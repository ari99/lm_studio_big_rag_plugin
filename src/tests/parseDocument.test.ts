import { test } from "node:test";
import * as assert from "node:assert/strict";
import * as path from "path";
import { parseDocument } from "../parsers/documentParser";

const FIXTURE_DIR = path.resolve(__dirname, "../../test-fixtures");

test("parseDocument extracts clean text from HTML files", async () => {
  const htmlPath = path.join(FIXTURE_DIR, "sample.html");
  const result = await parseDocument(htmlPath);

  assert.equal(result.success, true, `Expected success but got ${result.success ? "success" : result.reason}`);
  if (!result.success) {
    return;
  }

  assert.ok(result.document.text.includes("Hello There"));
  assert.ok(!result.document.text.includes("console.log"));
});

test("parseDocument flattens Markdown formatting", async () => {
  const mdPath = path.join(FIXTURE_DIR, "sample.md");
  const result = await parseDocument(mdPath);

  assert.equal(result.success, true, `Expected success but got ${result.success ? "success" : result.reason}`);
  if (!result.success) {
    return;
  }

  const text = result.document.text;
  assert.ok(text.includes("Sample Markdown Title"));
  assert.ok(!text.includes("const block"));
  assert.ok(!text.includes("https://example.com"), "Markdown links should drop raw URLs");
});

test("parseDocument preserves paragraph spacing for plain text", async () => {
  const txtPath = path.join(FIXTURE_DIR, "sample.txt");
  const result = await parseDocument(txtPath);

  assert.equal(result.success, true, `Expected success but got ${result.success ? "success" : result.reason}`);
  if (!result.success) {
    return;
  }

  const text = result.document.text;
  assert.ok(text.includes("\n\n"), "Plain text should preserve blank lines between paragraphs");
  assert.ok(text.startsWith("This is a plain text document."));
});

