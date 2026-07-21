import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_EMBEDDING_MODEL_ID } from "../config.js";
import {
  mergeChatAndSyncedFileSettingsForTest,
  mergeEmbeddingModelPreference,
  mergeToolsPluginSettingsWithFallbacks,
  pickNonEmptyString,
} from "../utils/effectivePluginConfig.js";

test("pickNonEmptyString prefers primary then fallback", () => {
  assert.equal(pickNonEmptyString(" /chat/docs ", ""), "/chat/docs");
  assert.equal(pickNonEmptyString("", " /synced/docs "), "/synced/docs");
  assert.equal(pickNonEmptyString("  ", "/synced/docs"), "/synced/docs");
});

test("mergeChatAndSyncedFileSettings uses synced file when chat paths are empty", () => {
  const merged = mergeChatAndSyncedFileSettingsForTest(
    {
      documentsDirectory: "",
      vectorStoreDirectory: "",
      retrievalLimit: 5,
    },
    {
      documentsDirectory: "/synced/docs",
      vectorStoreDirectory: "/synced/store",
      retrievalLimit: 8,
    },
  );

  assert.equal(merged.documentsDirectory, "/synced/docs");
  assert.equal(merged.vectorStoreDirectory, "/synced/store");
  assert.equal(merged.retrievalLimit, 8);
});

test("mergeChatAndSyncedFileSettings prefers chat paths when both are set", () => {
  const merged = mergeChatAndSyncedFileSettingsForTest(
    {
      documentsDirectory: "/chat/docs",
      vectorStoreDirectory: "/chat/store",
      retrievalLimit: 3,
    },
    {
      documentsDirectory: "/synced/docs",
      vectorStoreDirectory: "/synced/store",
      retrievalLimit: 8,
    },
  );

  assert.equal(merged.documentsDirectory, "/chat/docs");
  assert.equal(merged.vectorStoreDirectory, "/chat/store");
  assert.equal(merged.retrievalLimit, 3);
});

test("mergeChatAndSyncedFileSettings ignores partial chat paths to avoid cross-project mix", () => {
  const merged = mergeChatAndSyncedFileSettingsForTest(
    {
      documentsDirectory: "/chat/docs",
      vectorStoreDirectory: "",
    },
    {
      documentsDirectory: "/synced/docs",
      vectorStoreDirectory: "/synced/store",
    },
  );

  assert.equal(merged.documentsDirectory, "/synced/docs");
  assert.equal(merged.vectorStoreDirectory, "/synced/store");
});

test("mergeEmbeddingModelPreference keeps custom synced model over chat default", () => {
  assert.equal(
    mergeEmbeddingModelPreference(
      DEFAULT_EMBEDDING_MODEL_ID,
      "text-embedding-mxbai-embed-large-v1",
    ),
    "text-embedding-mxbai-embed-large-v1",
  );
  assert.equal(
    mergeEmbeddingModelPreference(
      "text-embedding-custom",
      "text-embedding-mxbai-embed-large-v1",
    ),
    "text-embedding-custom",
  );
});

test("mergeChatAndSyncedFileSettings does not clobber synced embedding with chat default", () => {
  const merged = mergeChatAndSyncedFileSettingsForTest(
    {
      documentsDirectory: "/chat/docs",
      vectorStoreDirectory: "/chat/store",
      embeddingModel: DEFAULT_EMBEDDING_MODEL_ID,
    },
    {
      documentsDirectory: "/synced/docs",
      vectorStoreDirectory: "/synced/store",
      embeddingModel: "text-embedding-mxbai-embed-large-v1",
    },
  );

  assert.equal(merged.embeddingModel, "text-embedding-mxbai-embed-large-v1");
  assert.equal(merged.documentsDirectory, "/chat/docs");
  assert.equal(merged.vectorStoreDirectory, "/chat/store");
});

test("mergeToolsPluginSettingsWithFallbacks uses file and env layers", () => {
  const merged = mergeToolsPluginSettingsWithFallbacks(
    {
      documentsDirectory: "",
      vectorStoreDirectory: "",
      embeddingModel: "",
      retrievalLimit: 5,
      retrievalAffinityThreshold: 0.3,
    },
    {
      documentsDirectory: "/file/docs",
      vectorStoreDirectory: "/file/store",
    },
    {
      vectorStoreDirectory: "/env/store",
      embeddingModel: "text-embedding-mxbai-embed-large-v1",
    },
  );

  assert.equal(merged.documentsDirectory, "/file/docs");
  assert.equal(merged.vectorStoreDirectory, "/file/store");
  assert.equal(merged.embeddingModel, "text-embedding-mxbai-embed-large-v1");
});
