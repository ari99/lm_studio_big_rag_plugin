/**
 * Tests for native text chunking implementation
 * Compares Rust native vs TypeScript fallback implementations
 */

import { describe, it } from "node:test";
import assert from "node:assert";

// Import both implementations
import { chunkText as nativeChunkText, isNativeAvailable } from "../../native";
import { chunkText as tsChunkText } from "../../utils/textChunker";

describe("Native Chunking Tests", () => {
  const testText = "This is a test sentence. Another sentence here. And one more. " +
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. " +
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore. " +
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

  it("should report native module availability", () => {
    const available = isNativeAvailable();
    console.log(`Native module available: ${available}`);
  });

  it("should chunk text correctly (TypeScript)", () => {
    const chunks = tsChunkText(testText, 10, 2);
    assert.ok(chunks.length > 0, "Should produce chunks");
    assert.ok(chunks[0].text.length > 0, "First chunk should have text");
    
    // Check overlap
    if (chunks.length > 1) {
      const firstChunkEnd = chunks[0].endIndex;
      const secondChunkStart = chunks[1].startIndex;
      assert.ok(secondChunkStart < firstChunkEnd, "Chunks should overlap");
    }
  });

  it("should chunk text correctly (Native)", () => {
    if (!isNativeAvailable()) {
      console.log("Skipping native chunking test - native module not available");
      return;
    }
    
    const chunks = nativeChunkText(testText, 10, 2) as any[];
    assert.ok(chunks.length > 0, "Should produce chunks");
    assert.ok(chunks[0].text.length > 0, "First chunk should have text");
  });

  it("should produce same number of chunks", () => {
    if (!isNativeAvailable()) {
      console.log("Skipping comparison test - native module not available");
      return;
    }
    
    const tsChunks = tsChunkText(testText, 10, 2);
    const nativeChunks = nativeChunkText(testText, 10, 2) as any[];
    
    // Allow some tolerance due to implementation differences
    const ratio = nativeChunks.length / tsChunks.length;
    assert.ok(ratio > 0.8 && ratio < 1.2, 
      `Chunk counts should be similar: TS=${tsChunks.length}, Native=${nativeChunks.length}`);
  });

  it("should handle empty text", () => {
    const tsChunks = tsChunkText("", 10, 2);
    assert.strictEqual(tsChunks.length, 0, "Empty text should produce no chunks");
    
    if (isNativeAvailable()) {
      const nativeChunks = nativeChunkText("", 10, 2) as any[];
      assert.strictEqual(nativeChunks.length, 0, "Empty text should produce no chunks (native)");
    }
  });

  it("should handle short text", () => {
    const shortText = "Hello world";
    const tsChunks = tsChunkText(shortText, 10, 2);
    assert.strictEqual(tsChunks.length, 1, "Short text should produce one chunk");
    
    if (isNativeAvailable()) {
      const nativeChunks = nativeChunkText(shortText, 10, 2) as any[];
      assert.strictEqual(nativeChunks.length, 1, "Short text should produce one chunk (native)");
    }
  });

  it("should handle overlap correctly", () => {
    const chunks = tsChunkText(testText, 5, 2);
    
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = chunks[i - 1].endIndex;
      const currStart = chunks[i].startIndex;
      const overlap = prevEnd - currStart;
      assert.ok(overlap >= 0, `Overlap should be non-negative at chunk ${i}`);
      assert.ok(overlap <= 2, `Overlap should not exceed specified overlap at chunk ${i}`);
    }
  });

  it("should include token estimates", () => {
    const chunks = tsChunkText(testText, 10, 2);
    
    for (const chunk of chunks) {
      assert.ok("tokenEstimate" in chunk, "Chunk should have tokenEstimate");
      assert.ok(chunk.tokenEstimate > 0, "Token estimate should be positive");
    }
  });

  it("should handle large text", () => {
    const largeText = "Word ".repeat(10000);
    const chunks = tsChunkText(largeText, 100, 20);
    assert.ok(chunks.length > 0, "Large text should produce chunks");
    
    if (isNativeAvailable()) {
      const nativeChunks = nativeChunkText(largeText, 100, 20) as any[];
      assert.ok(nativeChunks.length > 0, "Large text should produce chunks (native)");
    }
  });
});
