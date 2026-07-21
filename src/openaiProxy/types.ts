export type OpenAIChatMessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: string; [key: string]: unknown };

export type OpenAIChatMessage = {
  role: string;
  content?: string | OpenAIChatMessageContentPart[] | null;
  name?: string;
};

export type OpenAIChatCompletionsRequest = {
  model: string;
  messages: OpenAIChatMessage[];
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  seed?: number;
  [key: string]: unknown;
};

export type NativePluginIntegration = {
  type: "plugin";
  id: string;
  allowed_tools?: string[];
};

export type NativeChatRequest = {
  model: string;
  input: string;
  system_prompt?: string;
  integrations?: Array<string | NativePluginIntegration>;
  stream?: boolean;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  max_output_tokens?: number;
  store?: boolean;
};

export type NativeOutputMessage = {
  type: "message";
  content: string;
};

export type NativeOutputToolCall = {
  type: "tool_call";
  tool: string;
  arguments?: Record<string, unknown>;
  output?: string;
};

export type NativeOutputReasoning = {
  type: "reasoning";
  content: string;
};

export type NativeOutputItem =
  | NativeOutputMessage
  | NativeOutputToolCall
  | NativeOutputReasoning
  | { type: string; [key: string]: unknown };

export type NativeChatResponse = {
  model_instance_id?: string;
  output?: NativeOutputItem[];
  stats?: {
    input_tokens?: number;
    total_output_tokens?: number;
    reasoning_output_tokens?: number;
  };
  response_id?: string;
  [key: string]: unknown;
};

export type OpenAIChatCompletionChoice = {
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: "stop" | "length" | null;
};

export type OpenAIChatCompletionResponse = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: OpenAIChatCompletionChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type OpenAIChatCompletionChunk = {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: "assistant";
      content?: string;
    };
    finish_reason: "stop" | null;
  }>;
};
