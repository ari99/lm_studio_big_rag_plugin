import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createNativeSseParser,
  createStreamTranslationState,
  formatOpenAISseChunk,
  formatOpenAISseDone,
  translateNativeEventToOpenAIChunks,
} from "../streamTranslation";

describe("createNativeSseParser", (): void => {
  it("parses event/data frames across chunk boundaries", (): void => {
    const parser = createNativeSseParser();
    const firstBatch = parser.push(
      'event: message.delta\ndata: {"type":"message.delta","content":"Hel',
    );
    assert.equal(firstBatch.length, 0);

    const secondBatch = parser.push('lo"}\n\n');
    assert.equal(secondBatch.length, 1);
    assert.equal(secondBatch[0].eventType, "message.delta");
    assert.equal(secondBatch[0].data.content, "Hello");
  });

  it("parses multiple complete frames in one push", (): void => {
    const parser = createNativeSseParser();
    const events = parser.push(
      [
        'event: chat.start\ndata: {"type":"chat.start","model_instance_id":"m1"}\n\n',
        'event: message.delta\ndata: {"type":"message.delta","content":"A"}\n\n',
      ].join(""),
    );
    assert.equal(events.length, 2);
    assert.equal(events[0].eventType, "chat.start");
    assert.equal(events[1].eventType, "message.delta");
  });
});

describe("translateNativeEventToOpenAIChunks", (): void => {
  it("emits role on first content delta and stop on chat.end", (): void => {
    const state = createStreamTranslationState("test-model", "chatcmpl-test");

    const startChunks = translateNativeEventToOpenAIChunks(state, {
      eventType: "chat.start",
      data: { type: "chat.start", model_instance_id: "loaded-model" },
    });
    assert.equal(startChunks.length, 0);
    assert.equal(state.model, "loaded-model");

    const deltaChunks = translateNativeEventToOpenAIChunks(state, {
      eventType: "message.delta",
      data: { type: "message.delta", content: "Hi" },
    });
    assert.equal(deltaChunks.length, 1);
    assert.deepEqual(deltaChunks[0].choices[0].delta, {
      role: "assistant",
      content: "Hi",
    });
    assert.equal(deltaChunks[0].choices[0].finish_reason, null);

    const moreChunks = translateNativeEventToOpenAIChunks(state, {
      eventType: "message.delta",
      data: { type: "message.delta", content: "!" },
    });
    assert.deepEqual(moreChunks[0].choices[0].delta, { content: "!" });

    const endChunks = translateNativeEventToOpenAIChunks(state, {
      eventType: "chat.end",
      data: { type: "chat.end" },
    });
    assert.equal(endChunks.length, 1);
    assert.deepEqual(endChunks[0].choices[0].delta, {});
    assert.equal(endChunks[0].choices[0].finish_reason, "stop");
  });

  it("falls back to chat.end result.output when no deltas arrived", (): void => {
    const state = createStreamTranslationState("test-model", "chatcmpl-test");
    const endChunks = translateNativeEventToOpenAIChunks(state, {
      eventType: "chat.end",
      data: {
        type: "chat.end",
        result: {
          model_instance_id: "loaded-model",
          response_id: "resp_from_end",
          output: [{ type: "message", content: "From result only" }],
        },
      },
    });
    assert.equal(endChunks.length, 2);
    assert.equal(state.model, "loaded-model");
    assert.equal(state.completionId, "resp_from_end");
    assert.deepEqual(endChunks[0].choices[0].delta, {
      role: "assistant",
      content: "From result only",
    });
    assert.equal(endChunks[1].choices[0].finish_reason, "stop");
  });

  it("keeps completion id stable after deltas were already streamed", (): void => {
    const state = createStreamTranslationState("test-model", "chatcmpl-stable");
    translateNativeEventToOpenAIChunks(state, {
      eventType: "message.delta",
      data: { type: "message.delta", content: "Hi" },
    });
    translateNativeEventToOpenAIChunks(state, {
      eventType: "chat.end",
      data: {
        type: "chat.end",
        result: {
          model_instance_id: "other-model",
          response_id: "resp_should_not_replace",
          output: [{ type: "message", content: "ignored" }],
        },
      },
    });
    assert.equal(state.completionId, "chatcmpl-stable");
    assert.equal(state.model, "test-model");
  });
});

describe("createNativeSseParser type resolution", (): void => {
  it("uses JSON type when event: line is missing", (): void => {
    const parser = createNativeSseParser();
    const events = parser.push(
      'data: {"type":"message.delta","content":"X"}\n\n',
    );
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, "message.delta");
  });
});

describe("OpenAI SSE formatting", (): void => {
  it("formats data lines and DONE trailer", (): void => {
    const formatted: string = formatOpenAISseChunk({
      id: "chatcmpl-1",
      object: "chat.completion.chunk",
      created: 1,
      model: "m",
      choices: [
        {
          index: 0,
          delta: { content: "x" },
          finish_reason: null,
        },
      ],
    });
    assert.equal(formatted.startsWith("data: {"), true);
    assert.equal(formatted.endsWith("\n\n"), true);
    assert.equal(formatOpenAISseDone(), "data: [DONE]\n\n");
  });
});
