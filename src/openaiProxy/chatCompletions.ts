import type { IncomingMessage, ServerResponse } from "http";
import type { ProxyConfig } from "./config";
import {
  buildNativeChatRequest,
  mapNativeResponseToOpenAI,
} from "./messageMapping";
import {
  filterRequestHeaders,
  filterResponseHeaders,
  passthroughToLmStudio,
  readRequestBody,
} from "./passthrough";
import {
  createNativeSseParser,
  createStreamTranslationState,
  formatOpenAISseChunk,
  formatOpenAISseDone,
  formatOpenAISseError,
  translateNativeEventToOpenAIChunks,
  type NativeSseEvent,
} from "./streamTranslation";
import type {
  NativeChatResponse,
  OpenAIChatCompletionsRequest,
  OpenAIChatCompletionChunk,
} from "./types";

function writeJsonError(
  response: ServerResponse,
  statusCode: number,
  message: string,
): void {
  if (response.headersSent) {
    if (!response.writableEnded) {
      response.end();
    }
    return;
  }
  const errorType: string =
    statusCode >= 500 ? "server_error" : "invalid_request_error";
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      error: {
        message,
        type: errorType,
      },
    }),
  );
}

type ParsedChatBody =
  | { ok: true; request: OpenAIChatCompletionsRequest }
  | { ok: false; error: string };

function parseChatCompletionsBody(bodyBuffer: Buffer): ParsedChatBody {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyBuffer.toString("utf8"));
  } catch {
    return { ok: false, error: "Request body must be valid JSON" };
  }
  if (parsed === null || typeof parsed !== "object") {
    return { ok: false, error: "Request body must be a JSON object" };
  }
  const body = parsed as Record<string, unknown>;
  if (typeof body.model !== "string" || body.model.length === 0) {
    return { ok: false, error: "Missing required field: model" };
  }
  if (!Array.isArray(body.messages)) {
    return { ok: false, error: "Missing required field: messages" };
  }
  if (body.messages.length === 0) {
    return { ok: false, error: "messages must be a non-empty array" };
  }
  return { ok: true, request: body as OpenAIChatCompletionsRequest };
}

function safeWrite(response: ServerResponse, chunk: string): boolean {
  if (response.writableEnded || response.destroyed) {
    return false;
  }
  try {
    response.write(chunk);
    return true;
  } catch {
    return false;
  }
}

function extractNativeErrorMessage(nativeEvent: NativeSseEvent): string {
  const errorValue: unknown = nativeEvent.data.error;
  if (typeof errorValue === "string" && errorValue.length > 0) {
    return errorValue;
  }
  if (errorValue !== null && typeof errorValue === "object") {
    const errorObject = errorValue as Record<string, unknown>;
    if (typeof errorObject.message === "string") {
      return errorObject.message;
    }
  }
  if (typeof nativeEvent.data.message === "string") {
    return nativeEvent.data.message;
  }
  return "Upstream chat stream error";
}

async function handleStreamingChat(options: {
  config: ProxyConfig;
  openAiRequest: OpenAIChatCompletionsRequest;
  requestHeaders: IncomingMessage["headers"];
  response: ServerResponse;
}): Promise<void> {
  const nativeRequest = buildNativeChatRequest(options.openAiRequest, {
    pluginId: options.config.pluginId,
    allowedTools: options.config.allowedTools,
    disableIntegrations: options.config.disableIntegrations,
    storeChat: options.config.storeChat,
  });
  nativeRequest.stream = true;

  if (nativeRequest.input.trim() === "") {
    writeJsonError(
      options.response,
      400,
      "No user/assistant message content to send as input",
    );
    return;
  }

  const upstreamUrl: string = `${options.config.lmStudioBaseUrl}/api/v1/chat`;
  const headers: Record<string, string> = filterRequestHeaders(
    options.requestHeaders,
    options.config,
  );
  headers["content-type"] = "application/json";
  headers.accept = "text/event-stream";

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(nativeRequest),
    });
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : String(error);
    writeJsonError(
      options.response,
      502,
      `Upstream LM Studio unreachable: ${message}`,
    );
    return;
  }

  if (!upstreamResponse.ok) {
    const errorText: string = await upstreamResponse.text();
    options.response.writeHead(upstreamResponse.status, {
      "Content-Type":
        upstreamResponse.headers.get("content-type") ?? "application/json",
    });
    options.response.end(errorText);
    return;
  }

  options.response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const streamState = createStreamTranslationState(options.openAiRequest.model);
  const sseParser = createNativeSseParser();
  let sawChatEnd: boolean = false;
  let streamHadFatalError: boolean = false;

  if (upstreamResponse.body === null) {
    safeWrite(options.response, formatOpenAISseDone());
    options.response.end();
    return;
  }

  const reader = upstreamResponse.body.getReader();
  const textDecoder = new TextDecoder();
  let clientClosed: boolean = false;

  const onClientClose = (): void => {
    clientClosed = true;
    void reader.cancel().catch((): void => undefined);
  };
  options.response.once("close", onClientClose);

  function emitNativeEvents(events: NativeSseEvent[]): void {
    for (const nativeEvent of events) {
      if (nativeEvent.eventType === "error") {
        // Prefer recovering content from a later chat.end; only surface the
        // error if the stream ends with no assistant text.
        streamHadFatalError = true;
        streamState.lastErrorMessage = extractNativeErrorMessage(nativeEvent);
        continue;
      }
      const openAiChunks: OpenAIChatCompletionChunk[] =
        translateNativeEventToOpenAIChunks(streamState, nativeEvent);
      for (const chunk of openAiChunks) {
        safeWrite(options.response, formatOpenAISseChunk(chunk));
      }
      if (nativeEvent.eventType === "chat.end") {
        sawChatEnd = true;
        if (streamState.emittedContent) {
          streamHadFatalError = false;
        }
      }
    }
  }

  try {
    while (!clientClosed) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value === undefined) {
        continue;
      }
      const textChunk: string = textDecoder.decode(value, { stream: true });
      emitNativeEvents(sseParser.push(textChunk));
    }
    if (!clientClosed) {
      const flushedText: string = textDecoder.decode();
      if (flushedText.length > 0) {
        emitNativeEvents(sseParser.push(flushedText));
      }
      emitNativeEvents(sseParser.flush());
    }
  } finally {
    options.response.off("close", onClientClose);
    if (!clientClosed) {
      if (!sawChatEnd) {
        const trailingChunks: OpenAIChatCompletionChunk[] =
          translateNativeEventToOpenAIChunks(streamState, {
            eventType: "chat.end",
            data: { type: "chat.end" },
          });
        for (const chunk of trailingChunks) {
          safeWrite(options.response, formatOpenAISseChunk(chunk));
        }
      }
      if (streamHadFatalError && !streamState.emittedContent) {
        safeWrite(
          options.response,
          formatOpenAISseError(
            streamState.lastErrorMessage ?? "Upstream chat stream error",
          ),
        );
      }
      safeWrite(options.response, formatOpenAISseDone());
      if (!options.response.writableEnded) {
        options.response.end();
      }
    }
  }
}

async function handleNonStreamingChat(options: {
  config: ProxyConfig;
  openAiRequest: OpenAIChatCompletionsRequest;
  requestHeaders: IncomingMessage["headers"];
  response: ServerResponse;
}): Promise<void> {
  const nativeRequest = buildNativeChatRequest(options.openAiRequest, {
    pluginId: options.config.pluginId,
    allowedTools: options.config.allowedTools,
    disableIntegrations: options.config.disableIntegrations,
    storeChat: options.config.storeChat,
  });
  nativeRequest.stream = false;

  if (nativeRequest.input.trim() === "") {
    writeJsonError(
      options.response,
      400,
      "No user/assistant message content to send as input",
    );
    return;
  }

  const upstreamUrl: string = `${options.config.lmStudioBaseUrl}/api/v1/chat`;
  const headers: Record<string, string> = filterRequestHeaders(
    options.requestHeaders,
    options.config,
  );
  headers["content-type"] = "application/json";

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(nativeRequest),
    });
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : String(error);
    writeJsonError(
      options.response,
      502,
      `Upstream LM Studio unreachable: ${message}`,
    );
    return;
  }

  const responseText: string = await upstreamResponse.text();
  if (!upstreamResponse.ok) {
    const responseHeaders = filterResponseHeaders(upstreamResponse.headers);
    options.response.writeHead(upstreamResponse.status, {
      "Content-Type":
        responseHeaders["content-type"] ?? "application/json",
    });
    options.response.end(responseText);
    return;
  }

  let nativeResponse: NativeChatResponse;
  try {
    nativeResponse = JSON.parse(responseText) as NativeChatResponse;
  } catch {
    writeJsonError(
      options.response,
      502,
      "Upstream returned non-JSON chat response",
    );
    return;
  }

  const openAiResponse = mapNativeResponseToOpenAI(
    nativeResponse,
    options.openAiRequest.model,
  );
  options.response.writeHead(200, { "Content-Type": "application/json" });
  options.response.end(JSON.stringify(openAiResponse));
}

export async function handleChatCompletions(options: {
  config: ProxyConfig;
  request: IncomingMessage;
  response: ServerResponse;
  pathWithQuery: string;
}): Promise<void> {
  const bodyBuffer: Buffer = await readRequestBody(options.request);

  if (options.config.disableIntegrations) {
    await passthroughToLmStudio({
      config: options.config,
      method: "POST",
      pathWithQuery: options.pathWithQuery,
      requestHeaders: options.request.headers,
      body: bodyBuffer,
      response: options.response,
    });
    return;
  }

  const parsed = parseChatCompletionsBody(bodyBuffer);
  if (!parsed.ok) {
    writeJsonError(options.response, 400, parsed.error);
    return;
  }

  if (parsed.request.stream === true) {
    await handleStreamingChat({
      config: options.config,
      openAiRequest: parsed.request,
      requestHeaders: options.request.headers,
      response: options.response,
    });
    return;
  }

  await handleNonStreamingChat({
    config: options.config,
    openAiRequest: parsed.request,
    requestHeaders: options.request.headers,
    response: options.response,
  });
}
