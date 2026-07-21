import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadConfig } from "../config";
import { filterRequestHeaders, filterResponseHeaders } from "../passthrough";

describe("filterRequestHeaders", (): void => {
  it("injects Bearer token when Authorization is absent", (): void => {
    const headers = filterRequestHeaders(
      { "content-type": "application/json" },
      {
        port: 1235,
        lmStudioBaseUrl: "http://127.0.0.1:1234",
        lmApiToken: "secret-token",
        pluginId: "mindstudio/big-rag",
        allowedTools: undefined,
        disableIntegrations: false,
        storeChat: false,
      },
    );
    assert.equal(headers.authorization, "Bearer secret-token");
  });

  it("does not overwrite an existing Authorization header", (): void => {
    const headers = filterRequestHeaders(
      { authorization: "Bearer client-token" },
      {
        port: 1235,
        lmStudioBaseUrl: "http://127.0.0.1:1234",
        lmApiToken: "secret-token",
        pluginId: "mindstudio/big-rag",
        allowedTools: undefined,
        disableIntegrations: false,
        storeChat: false,
      },
    );
    assert.equal(headers.authorization, "Bearer client-token");
  });
});

describe("filterResponseHeaders", (): void => {
  it("strips content-encoding and content-length from decoded fetch bodies", (): void => {
    const upstreamHeaders = new Headers({
      "content-type": "application/json",
      "content-encoding": "gzip",
      "content-length": "123",
      "x-custom": "keep",
    });
    const filtered = filterResponseHeaders(upstreamHeaders);
    assert.equal(filtered["content-encoding"], undefined);
    assert.equal(filtered["content-length"], undefined);
    assert.equal(filtered["content-type"], "application/json");
    assert.equal(filtered["x-custom"], "keep");
  });
});

describe("loadConfig", (): void => {
  it("parses allowed tools and strips trailing slash from base URL", (): void => {
    const config = loadConfig({
      PORT: "2345",
      LM_STUDIO_BASE_URL: "http://127.0.0.1:1234/",
      BIG_RAG_ALLOWED_TOOLS: "big_rag_search, big_rag_index_status",
      BIG_RAG_STORE_CHAT: "1",
    });
    assert.equal(config.port, 2345);
    assert.equal(config.lmStudioBaseUrl, "http://127.0.0.1:1234");
    assert.deepEqual(config.allowedTools, [
      "big_rag_search",
      "big_rag_index_status",
    ]);
    assert.equal(config.storeChat, true);
  });
});
