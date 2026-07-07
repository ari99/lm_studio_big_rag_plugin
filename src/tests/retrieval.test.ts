import { test } from "node:test";
import * as assert from "node:assert/strict";
import { formatRagContext, summarizeText } from "../rag/retrieval";

test("summarizeText clips long content with ellipsis", () => {
  const longText = "line one\nline two\nline three\nline four";
  const summary = summarizeText(longText, 2, 20);
  assert.ok(summary.endsWith("…"));
  assert.ok(summary.includes("line one"));
});

test("formatRagContext builds citation blocks", () => {
  const { full, preview } = formatRagContext([
    {
      text: "Sample passage text",
      score: 0.812,
      filePath: "/docs/readme.txt",
      fileName: "readme.txt",
      chunkIndex: 0,
      shardName: "shard_000",
      metadata: {},
    },
  ]);

  assert.ok(full.includes("Citation 1 (from readme.txt, score: 0.812)"));
  assert.ok(full.includes("Sample passage text"));
  assert.ok(preview.includes("Citation 1 (from readme.txt, score: 0.812)"));
});
