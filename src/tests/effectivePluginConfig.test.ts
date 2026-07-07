import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeChatAndSyncedFileSettingsForTest,
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

test("mergeChatAndSyncedFileSettings prefers chat paths when set", () => {
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

test("mergeChatAndSyncedFileSettings fills missing chat path from synced file", () => {
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

  assert.equal(merged.documentsDirectory, "/chat/docs");
  assert.equal(merged.vectorStoreDirectory, "/synced/store");
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
