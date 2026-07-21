import type {
  NativeChatRequest,
  NativeChatResponse,
  NativePluginIntegration,
  OpenAIChatCompletionsRequest,
  OpenAIChatCompletionResponse,
  OpenAIChatMessage,
  OpenAIChatMessageContentPart,
} from "./types";

function extractTextFromContent(
  content: OpenAIChatMessage["content"],
): string {
  if (content === undefined || content === null) {
    return "";
  }
  if (typeof content === "string") {
    return content;
  }
  const textParts: string[] = [];
  for (const part of content) {
    if (part.type === "text" && typeof part.text === "string") {
      textParts.push(part.text);
    }
  }
  return textParts.join("\n");
}

function formatConversationLine(message: OpenAIChatMessage): string {
  const roleLabel: string = message.role;
  const textContent: string = extractTextFromContent(message.content);
  if (textContent.length === 0) {
    return `${roleLabel}:`;
  }
  return `${roleLabel}: ${textContent}`;
}

export type MappedChatRequest = {
  systemPrompt: string | undefined;
  input: string;
};

/**
 * Split OpenAI messages into native system_prompt + input.
 * System messages become system_prompt; remaining turns become a transcript.
 * A single non-system user message is passed through as plain input text.
 */
export function mapMessagesToNativeInput(
  messages: OpenAIChatMessage[],
): MappedChatRequest {
  const systemParts: string[] = [];
  const nonSystemMessages: OpenAIChatMessage[] = [];

  for (const message of messages) {
    if (message === null || typeof message !== "object") {
      continue;
    }
    if (message.role === "system") {
      const systemText: string = extractTextFromContent(message.content);
      if (systemText.length > 0) {
        systemParts.push(systemText);
      }
      continue;
    }
    nonSystemMessages.push(message);
  }

  const systemPrompt: string | undefined =
    systemParts.length > 0 ? systemParts.join("\n\n") : undefined;

  let input: string;
  if (nonSystemMessages.length === 0) {
    input = "";
  } else if (
    nonSystemMessages.length === 1 &&
    nonSystemMessages[0].role === "user"
  ) {
    input = extractTextFromContent(nonSystemMessages[0].content);
  } else {
    input = nonSystemMessages
      .map((message: OpenAIChatMessage): string => formatConversationLine(message))
      .join("\n\n");
  }

  return { systemPrompt, input };
}

export type BuildNativeRequestOptions = {
  pluginId: string;
  allowedTools: string[] | undefined;
  disableIntegrations: boolean;
  storeChat: boolean;
};

export function buildNativeChatRequest(
  openAiRequest: OpenAIChatCompletionsRequest,
  options: BuildNativeRequestOptions,
): NativeChatRequest {
  const mapped: MappedChatRequest = mapMessagesToNativeInput(
    openAiRequest.messages ?? [],
  );

  const nativeRequest: NativeChatRequest = {
    model: openAiRequest.model,
    input: mapped.input,
    stream: openAiRequest.stream === true,
    store: options.storeChat,
  };

  if (mapped.systemPrompt !== undefined) {
    nativeRequest.system_prompt = mapped.systemPrompt;
  }
  if (typeof openAiRequest.temperature === "number") {
    nativeRequest.temperature = openAiRequest.temperature;
  }
  if (typeof openAiRequest.top_p === "number") {
    nativeRequest.top_p = openAiRequest.top_p;
  }
  if (typeof openAiRequest.top_k === "number") {
    nativeRequest.top_k = openAiRequest.top_k;
  }
  if (typeof openAiRequest.max_tokens === "number") {
    nativeRequest.max_output_tokens = openAiRequest.max_tokens;
  } else if (typeof openAiRequest.max_completion_tokens === "number") {
    nativeRequest.max_output_tokens = openAiRequest.max_completion_tokens;
  }

  if (!options.disableIntegrations) {
    const integration: NativePluginIntegration = {
      type: "plugin",
      id: options.pluginId,
    };
    if (options.allowedTools !== undefined && options.allowedTools.length > 0) {
      integration.allowed_tools = options.allowedTools;
    }
    nativeRequest.integrations = [integration];
  }

  return nativeRequest;
}

export function extractAssistantTextFromNativeOutput(
  nativeResponse: NativeChatResponse,
): string {
  const outputItems = nativeResponse.output ?? [];
  const messageParts: string[] = [];
  for (const item of outputItems) {
    if (item.type === "message" && typeof item.content === "string") {
      messageParts.push(item.content);
    }
  }
  if (messageParts.length > 0) {
    return messageParts.join("\n");
  }
  return "";
}

export function mapNativeResponseToOpenAI(
  nativeResponse: NativeChatResponse,
  model: string,
  completionId?: string,
): OpenAIChatCompletionResponse {
  const content: string = extractAssistantTextFromNativeOutput(nativeResponse);
  const created: number = Math.floor(Date.now() / 1000);
  const id: string =
    completionId ??
    nativeResponse.response_id ??
    `chatcmpl-${created.toString(36)}`;

  const response: OpenAIChatCompletionResponse = {
    id,
    object: "chat.completion",
    created,
    model: nativeResponse.model_instance_id ?? model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: "stop",
      },
    ],
  };

  const stats = nativeResponse.stats;
  if (stats !== undefined) {
    const promptTokens: number = stats.input_tokens ?? 0;
    const completionTokens: number = stats.total_output_tokens ?? 0;
    response.usage = {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    };
  }

  return response;
}

/** Exported for tests that exercise image/text content parts. */
export function contentPartsToText(
  parts: OpenAIChatMessageContentPart[],
): string {
  return extractTextFromContent(parts);
}
