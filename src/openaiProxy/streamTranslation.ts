import { extractAssistantTextFromNativeOutput } from "./messageMapping";
import type { NativeChatResponse, OpenAIChatCompletionChunk } from "./types";

export type NativeSseEvent = {
  eventType: string;
  data: Record<string, unknown>;
};

/**
 * Parse a chunk of native LM Studio SSE (event: / data: lines) into events.
 * Maintains leftover buffer across chunks.
 */
export function createNativeSseParser(): {
  push: (chunk: string) => NativeSseEvent[];
  flush: () => NativeSseEvent[];
} {
  let buffer: string = "";

  function consumeCompleteBlocks(rawText: string): {
    events: NativeSseEvent[];
    remainder: string;
  } {
    const normalized: string = rawText.replace(/\r\n/g, "\n");
    const blocks: string[] = normalized.split("\n\n");
    const remainder: string = blocks.pop() ?? "";
    const events: NativeSseEvent[] = [];

    for (const block of blocks) {
      if (block.trim() === "") {
        continue;
      }
      let eventTypeFromLine: string | undefined;
      const dataLines: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) {
          eventTypeFromLine = line.slice("event:".length).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice("data:".length).trim());
        }
      }
      if (dataLines.length === 0) {
        continue;
      }
      const dataText: string = dataLines.join("\n");
      try {
        const parsed: unknown = JSON.parse(dataText);
        if (parsed !== null && typeof parsed === "object") {
          const data = parsed as Record<string, unknown>;
          const typeFromData: string | undefined =
            typeof data.type === "string" ? data.type : undefined;
          // Prefer LM Studio's JSON `type` field; fall back to SSE event: line.
          const eventType: string =
            typeFromData ?? eventTypeFromLine ?? "message";
          events.push({
            eventType,
            data,
          });
        }
      } catch {
        // Skip malformed JSON frames.
      }
    }

    return { events, remainder };
  }

  return {
    push(chunk: string): NativeSseEvent[] {
      buffer += chunk;
      const { events, remainder } = consumeCompleteBlocks(buffer);
      buffer = remainder;
      return events;
    },
    flush(): NativeSseEvent[] {
      if (buffer.trim() === "") {
        return [];
      }
      const { events, remainder } = consumeCompleteBlocks(buffer + "\n\n");
      buffer = remainder;
      return events;
    },
  };
}

export type StreamTranslationState = {
  completionId: string;
  model: string;
  created: number;
  sentRole: boolean;
  emittedContent: boolean;
  lastErrorMessage: string | undefined;
};

export function createStreamTranslationState(
  model: string,
  completionId?: string,
): StreamTranslationState {
  const created: number = Math.floor(Date.now() / 1000);
  return {
    completionId: completionId ?? `chatcmpl-${created.toString(36)}`,
    model,
    created,
    sentRole: false,
    emittedContent: false,
    lastErrorMessage: undefined,
  };
}

function buildChunk(
  state: StreamTranslationState,
  delta: { role?: "assistant"; content?: string },
  finishReason: "stop" | null,
): OpenAIChatCompletionChunk {
  return {
    id: state.completionId,
    object: "chat.completion.chunk",
    created: state.created,
    model: state.model,
    choices: [
      {
        index: 0,
        delta,
        finish_reason: finishReason,
      },
    ],
  };
}

function extractContentFromChatEnd(
  nativeEvent: NativeSseEvent,
): string | undefined {
  const resultValue: unknown = nativeEvent.data.result;
  if (resultValue === null || typeof resultValue !== "object") {
    return undefined;
  }
  const result = resultValue as NativeChatResponse;
  const content: string = extractAssistantTextFromNativeOutput(result);
  return content.length > 0 ? content : undefined;
}

function applyChatEndMetadata(
  state: StreamTranslationState,
  nativeEvent: NativeSseEvent,
): void {
  // Do not change id/model after any chunk was already sent — OpenAI clients
  // expect a stable completion id and model across the stream.
  if (state.sentRole || state.emittedContent) {
    return;
  }
  const resultValue: unknown = nativeEvent.data.result;
  if (resultValue === null || typeof resultValue !== "object") {
    return;
  }
  const result = resultValue as NativeChatResponse;
  if (
    typeof result.model_instance_id === "string" &&
    result.model_instance_id.length > 0
  ) {
    state.model = result.model_instance_id;
  }
  if (typeof result.response_id === "string" && result.response_id.length > 0) {
    state.completionId = result.response_id;
  }
}

/**
 * Convert a native SSE event into zero or more OpenAI chat.completion.chunk
 * objects. Emits role on first content delta; finish on chat.end.
 * If no message.delta arrived, falls back to chat.end result.output text.
 */
export function translateNativeEventToOpenAIChunks(
  state: StreamTranslationState,
  nativeEvent: NativeSseEvent,
): OpenAIChatCompletionChunk[] {
  const chunks: OpenAIChatCompletionChunk[] = [];

  if (nativeEvent.eventType === "message.delta") {
    const contentValue: unknown = nativeEvent.data.content;
    if (typeof contentValue !== "string" || contentValue.length === 0) {
      return chunks;
    }
    const delta: { role?: "assistant"; content?: string } = {
      content: contentValue,
    };
    if (!state.sentRole) {
      delta.role = "assistant";
      state.sentRole = true;
    }
    state.emittedContent = true;
    chunks.push(buildChunk(state, delta, null));
    return chunks;
  }

  if (nativeEvent.eventType === "chat.end") {
    applyChatEndMetadata(state, nativeEvent);

    if (!state.emittedContent) {
      const fallbackContent: string | undefined =
        extractContentFromChatEnd(nativeEvent);
      if (fallbackContent !== undefined) {
        const delta: { role?: "assistant"; content?: string } = {
          content: fallbackContent,
        };
        if (!state.sentRole) {
          delta.role = "assistant";
          state.sentRole = true;
        }
        state.emittedContent = true;
        chunks.push(buildChunk(state, delta, null));
      }
    }

    if (!state.sentRole) {
      chunks.push(buildChunk(state, { role: "assistant", content: "" }, null));
      state.sentRole = true;
    }
    chunks.push(buildChunk(state, {}, "stop"));
    return chunks;
  }

  if (nativeEvent.eventType === "chat.start") {
    const modelInstanceId: unknown = nativeEvent.data.model_instance_id;
    if (typeof modelInstanceId === "string" && modelInstanceId.length > 0) {
      state.model = modelInstanceId;
    }
  }

  return chunks;
}

export function formatOpenAISseChunk(
  chunk: OpenAIChatCompletionChunk,
): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

export function formatOpenAISseDone(): string {
  return "data: [DONE]\n\n";
}

export function formatOpenAISseError(message: string): string {
  return `data: ${JSON.stringify({
    error: {
      message,
      type: "server_error",
    },
  })}\n\n`;
}
