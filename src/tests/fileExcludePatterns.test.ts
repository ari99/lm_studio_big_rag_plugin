import { test } from "node:test";
import * as assert from "node:assert/strict";
import {
  parseExcludePatternsBlock,
  parseExcludePatternsFromEnv,
  matchExcludePattern,
  isRelativePathExcluded,
} from "../utils/fileExcludePatterns";

test("parseExcludePatternsBlock trims, skips empty and comments", () => {
  const raw = "  *.png  \n\n# ignore jpg\n*.jpg\n";
  assert.deepEqual(parseExcludePatternsBlock(raw), ["*.png", "*.jpg"]);
});

test("parseExcludePatternsFromEnv splits on semicolon", () => {
  assert.deepEqual(parseExcludePatternsFromEnv("a;b;c"), ["a", "b", "c"]);
  assert.deepEqual(parseExcludePatternsFromEnv(undefined), []);
});

test("matchExcludePattern *.png matches root and nested paths", () => {
  const p = ["*.png"];
  assert.equal(matchExcludePattern("x.png", p), "*.png");
  assert.equal(matchExcludePattern("img/x.png", p), "*.png");
  assert.equal(matchExcludePattern("doc.pdf", p), null);
});

test("matchExcludePattern respects directory segment in pattern", () => {
  assert.equal(matchExcludePattern("foo/bar.md", ["foo/*.md"]), "foo/*.md");
  assert.equal(matchExcludePattern("bar/foo.md", ["foo/*.md"]), null);
});

test("isRelativePathExcluded is true when any pattern matches", () => {
  assert.equal(isRelativePathExcluded("a.txt", ["*.png", "*.txt"]), true);
  assert.equal(isRelativePathExcluded("a.txt", ["*.png"]), false);
});
