import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  parseAdditionalExtensionsBlock,
  parseAdditionalExtensionsFromEnv,
  normalizeExtension,
  resolveAdditionalExtensions,
  buildEffectiveExtensionSet,
  isAdditionalPlainTextExtension,
} from "../utils/additionalExtensions";
import { isSupportedFile } from "../ingestion/fileScanner";

test("parseAdditionalExtensionsBlock trims, skips empty and comments, splits commas", () => {
  const raw = "  .java  \n\n# ignore\n.cs, .py\n";
  assert.deepEqual(parseAdditionalExtensionsBlock(raw), [".java", ".cs", ".py"]);
});

test("parseAdditionalExtensionsFromEnv splits on semicolon", () => {
  assert.deepEqual(parseAdditionalExtensionsFromEnv(".java;.cs"), [".java", ".cs"]);
  assert.deepEqual(parseAdditionalExtensionsFromEnv(undefined), []);
});

test("normalizeExtension adds dot and lowercases", () => {
  assert.equal(normalizeExtension("JAVA"), ".java");
  assert.equal(normalizeExtension(".CS"), ".cs");
});

test("normalizeExtension rejects wildcards and invalid tokens", () => {
  assert.equal(normalizeExtension("*.java"), null);
  assert.equal(normalizeExtension(""), null);
  assert.equal(normalizeExtension("foo/bar"), null);
});

test("parseAdditionalExtensionsBlock strips inline comments after extension", () => {
  const raw = ".java # JVM sources\n.cs, .py # scripting\n";
  assert.deepEqual(parseAdditionalExtensionsBlock(raw), [".java", ".cs", ".py"]);
});

test("resolveAdditionalExtensions rejects binary extensions", () => {
  const result = resolveAdditionalExtensions(".exe\n.java");
  assert.deepEqual(result.accepted, [".java"]);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0]?.ext, ".exe");
  assert.ok(result.additionalPlainTextSet.has(".java"));
});

test("resolveAdditionalExtensions rejects office document extensions", () => {
  const result = resolveAdditionalExtensions(".docx\n.java");
  assert.deepEqual(result.accepted, [".java"]);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0]?.ext, ".docx");
});

test("resolveAdditionalExtensions warns on built-in non-plain-text redeclaration", () => {
  const result = resolveAdditionalExtensions(".pdf\n.java");
  assert.deepEqual(result.accepted, [".java"]);
  assert.ok(result.warnings.some((warning) => warning.includes(".pdf")));
  assert.equal(result.additionalPlainTextSet.has(".pdf"), false);
});

test("buildEffectiveExtensionSet includes user extensions", () => {
  const effective = buildEffectiveExtensionSet(new Set([".java", ".cs"]));
  assert.ok(effective.has(".java"));
  assert.ok(effective.has(".cs"));
  assert.ok(effective.has(".pdf"));
});

test("isAdditionalPlainTextExtension distinguishes user vs built-in", () => {
  const additional = new Set([".java"]);
  assert.equal(isAdditionalPlainTextExtension(".java", additional), true);
  assert.equal(isAdditionalPlainTextExtension(".pdf", additional), false);
});

test("isSupportedFile respects additional plain-text extensions", () => {
  const additional = new Set([".java"]);
  assert.equal(isSupportedFile("Example.java", additional), true);
  assert.equal(isSupportedFile("Example.go", additional), false);
  assert.equal(isSupportedFile("Example.pdf", additional), true);
});
