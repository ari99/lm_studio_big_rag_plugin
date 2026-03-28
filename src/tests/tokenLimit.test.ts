import {
  chunkText,
  ensureChunkTokenLimits,
  splitOversizedChunk,
  estimateTokenCount,
  MAX_CHUNK_TOKENS,
  MAX_EMBEDDING_TOKENS,
} from "../utils/textChunker";

import { describe, it } from "node:test";
import assert from "node:assert";

describe("Token Limit Enforcement", () => {
  it("should not split chunks under the limit", () => {
    const shortText = "This is a short text. It should not be split.";
    const chunks = chunkText(shortText, 512, 100);
    const enforced = ensureChunkTokenLimits(chunks);
    
    assert.strictEqual(enforced.length, 1);
    assert.strictEqual(enforced[0].text, shortText);
  });

  it("should split oversized chunks", () => {
    // Create a very long text that exceeds the token limit
    const longText = Array(1000).fill("This is a sentence. ").join("");
    const chunks = chunkText(longText, 2048, 100);
    
    // The chunker may create chunks that exceed the token limit
    const enforced = ensureChunkTokenLimits(chunks);
    
    // All enforced chunks should be under the limit
    for (const chunk of enforced) {
      const tokens = estimateTokenCount(chunk.text);
      assert.ok(
        tokens <= MAX_EMBEDDING_TOKENS,
        `Chunk has ${tokens} tokens, exceeds limit of ${MAX_EMBEDDING_TOKENS}`
      );
    }
  });

  it("should handle extremely long sentences", () => {
    // Create a single extremely long sentence without periods
    const longSentence = Array(500).fill("word").join(" ");
    const result = splitOversizedChunk(longSentence, 0, longSentence.length);
    
    // All chunks should be under the limit
    for (const chunk of result) {
      const tokens = estimateTokenCount(chunk.text);
      assert.ok(
        tokens <= MAX_EMBEDDING_TOKENS,
        `Chunk has ${tokens} tokens, exceeds limit of ${MAX_EMBEDDING_TOKENS}`
      );
    }
  });

  it("should preserve text content after splitting", () => {
    const originalText = "First sentence. Second sentence. Third sentence. ".repeat(100);
    const chunks = chunkText(originalText, 512, 50);
    const enforced = ensureChunkTokenLimits(chunks);
    
    // Reconstruct text from chunks
    const reconstructed = enforced.map(c => c.text).join(" ");
    
    // Should contain most of the original content (allowing for some whitespace differences)
    const originalWords = originalText.split(/\s+/).filter(w => w.length > 0);
    const reconstructedWords = reconstructed.split(/\s+/).filter(w => w.length > 0);
    
    assert.ok(
      reconstructedWords.length >= originalWords.length * 0.95,
      "Reconstructed text should contain most of original content"
    );
  });

  it("should estimate tokens correctly", () => {
    const text = "This is a test sentence with some words.";
    const tokens = estimateTokenCount(text);

    // New estimation uses word-based calculation: ~1.3 tokens per word
    // 9 words * 1.3 = ~11.7 → 12 tokens
    // The estimate should be reasonable (between 8 and 15 for this text)
    assert.ok(
      tokens >= 8 && tokens <= 15,
      `Token estimate ${tokens} should be reasonable for "${text}"`
    );
  });

  it("should handle empty text", () => {
    const result = splitOversizedChunk("", 0, 0);
    // Empty text returns as a single chunk with empty text
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, "");
  });

  it("should handle text at the boundary", () => {
    // Create text that's close to the limit
    const boundaryText = Array(400).fill("word ").join("");
    const result = splitOversizedChunk(boundaryText, 0, boundaryText.length);
    
    // May or may not split depending on exact token count
    for (const chunk of result) {
      const tokens = estimateTokenCount(chunk.text);
      assert.ok(
        tokens <= MAX_EMBEDDING_TOKENS,
        `Chunk has ${tokens} tokens, exceeds limit of ${MAX_EMBEDDING_TOKENS}`
      );
    }
  });
});

console.log("Token limit enforcement tests completed!");
