import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildNativeChatRequest,
  mapMessagesToNativeInput,
  mapNativeResponseToOpenAI,
} from "../messageMapping";
import type { OpenAIChatCompletionsRequest } from "../types";

describe("mapMessagesToNativeInput", (): void => {
  it("maps a single user message to plain input", (): void => {
    const mapped = mapMessagesToNativeInput([
      { role: "user", content: "What is rifling?" },
    ]);
    assert.equal(mapped.systemPrompt, undefined);
    assert.equal(mapped.input, "What is rifling?");
  });

  it("concatenates system messages into system_prompt", (): void => {
    const mapped = mapMessagesToNativeInput([
      { role: "system", content: "Be concise." },
      { role: "system", content: "Cite sources." },
      { role: "user", content: "Hello" },
    ]);
    assert.equal(mapped.systemPrompt, "Be concise.\n\nCite sources.");
    assert.equal(mapped.input, "Hello");
  });

  it("formats multi-turn non-system messages as a transcript", (): void => {
    const mapped = mapMessagesToNativeInput([
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello!" },
      { role: "user", content: "More?" },
    ]);
    assert.equal(mapped.systemPrompt, "You are helpful.");
    assert.equal(mapped.input, "user: Hi\n\nassistant: Hello!\n\nuser: More?");
  });

  it("extracts text from content parts", (): void => {
    const mapped = mapMessagesToNativeInput([
      {
        role: "user",
        content: [
          { type: "text", text: "Part A" },
          { type: "text", text: "Part B" },
        ],
      },
    ]);
    assert.equal(mapped.input, "Part A\nPart B");
  });
});

describe("buildNativeChatRequest", (): void => {
  it("injects plugin integrations and maps max_tokens", (): void => {
    const openAiRequest: OpenAIChatCompletionsRequest = {
      model: "meta/llama-3.3-70b",
      messages: [{ role: "user", content: "Search docs" }],
      temperature: 0,
      max_tokens: 256,
    };
    const nativeRequest = buildNativeChatRequest(openAiRequest, {
      pluginId: "mindstudio/big-rag",
      allowedTools: ["big_rag_search"],
      disableIntegrations: false,
      storeChat: false,
    });
    assert.equal(nativeRequest.model, "meta/llama-3.3-70b");
    assert.equal(nativeRequest.input, "Search docs");
    assert.equal(nativeRequest.max_output_tokens, 256);
    assert.equal(nativeRequest.store, false);
    assert.deepEqual(nativeRequest.integrations, [
      {
        type: "plugin",
        id: "mindstudio/big-rag",
        allowed_tools: ["big_rag_search"],
      },
    ]);
  });

  it("omits integrations when disabled", (): void => {
    const openAiRequest: OpenAIChatCompletionsRequest = {
      model: "test-model",
      messages: [{ role: "user", content: "Hi" }],
    };
    const nativeRequest = buildNativeChatRequest(openAiRequest, {
      pluginId: "mindstudio/big-rag",
      allowedTools: undefined,
      disableIntegrations: true,
      storeChat: false,
    });
    assert.equal(nativeRequest.integrations, undefined);
  });

  it("maps max_completion_tokens when max_tokens is absent", (): void => {
    const openAiRequest: OpenAIChatCompletionsRequest = {
      model: "test-model",
      messages: [{ role: "user", content: "Hi" }],
      max_completion_tokens: 128,
    };
    const nativeRequest = buildNativeChatRequest(openAiRequest, {
      pluginId: "mindstudio/big-rag",
      allowedTools: undefined,
      disableIntegrations: false,
      storeChat: false,
    });
    assert.equal(nativeRequest.max_output_tokens, 128);
  });
});

describe("mapNativeResponseToOpenAI", (): void => {
  it("maps message output and usage stats", (): void => {
    const openAiResponse = mapNativeResponseToOpenAI(
      {
        model_instance_id: "meta/llama-3.3-70b",
        response_id: "resp_abc",
        output: [
          { type: "reasoning", content: "thinking" },
          { type: "message", content: "Final answer" },
        ],
        stats: {
          input_tokens: 10,
          total_output_tokens: 5,
        },
      },
      "fallback-model",
    );
    assert.equal(openAiResponse.object, "chat.completion");
    assert.equal(openAiResponse.id, "resp_abc");
    assert.equal(openAiResponse.model, "meta/llama-3.3-70b");
    assert.equal(openAiResponse.choices[0].message.content, "Final answer");
    assert.deepEqual(openAiResponse.usage, {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    });
  });
});
