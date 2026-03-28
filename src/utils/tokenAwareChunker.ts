/**
 * Token-aware chunker using Rust native tokenizer
 * 
 * Provides accurate token counting using cl100k_base tokenizer
 * (compatible with nomic-ai/nomic-embed-text-v1.5-GGUF)
 */

import {
  countTokens as nativeCountTokens,
  countTokensBatch as nativeCountTokensBatch,
  validateTokenLimit as nativeValidateTokenLimit,
  chunkByTokens as nativeChunkByTokens,
  chunkTextsByTokens as nativeChunkTextsByTokens,
  getTokenStats as nativeGetTokenStats,
  filterByTokenLimit as nativeFilterByTokenLimit,
  isNativeAvailable,
} from "../native";

/**
 * Chunk result with metadata (compatible with textChunker.ts ChunkResult)
 */
export interface ChunkResult {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
  // Additional token-accurate fields
  tokenCount?: number;
  startToken?: number;
  endToken?: number;
}

/**
 * Token chunk from native Rust
 */
export interface NativeTokenChunk {
  text: string;
  token_count: number;
  start_token: number;
  end_token: number;
}

/**
 * Token count result from native Rust
 */
export interface NativeTokenCountResult {
  text: string;
  token_count: number;
}

/**
 * Token stats from native Rust
 */
export interface NativeTokenStats {
  token_count: number;
  char_count: number;
  tokens_per_char: number;
}

/**
 * Maximum tokens allowed for embedding model input
 * nomic-embed-text-v1.5 has 2048 token context
 */
export const MAX_EMBEDDING_TOKENS = 2048;

/**
 * Conservative token limit for chunking
 * Leaves ~548 token safety margin
 */
export const MAX_CHUNK_TOKENS = 1500;

/**
 * Count tokens in text using cl100k_base tokenizer (Rust native)
 * 
 * @param text - Text to count tokens in
 * @returns Exact token count
 */
export function countTokens(text: string): number {
  if (!nativeCountTokens) {
    throw new Error('Native tokenizer not available');
  }
  return nativeCountTokens(text);
}

/**
 * Count tokens in multiple texts in parallel (Rust native)
 * 
 * @param texts - Array of texts to count
 * @returns Array of token count results
 */
export function countTokensBatch(texts: string[]): NativeTokenCountResult[] {
  if (!nativeCountTokensBatch) {
    throw new Error('Native tokenizer not available');
  }
  return nativeCountTokensBatch(texts);
}

/**
 * Validate if text is within token limit
 * 
 * @param text - Text to validate
 * @param maxTokens - Maximum allowed tokens (default: 2048)
 * @returns true if within limit
 */
export function validateTokenLimit(text: string, maxTokens: number = MAX_EMBEDDING_TOKENS): boolean {
  if (!nativeValidateTokenLimit) {
    throw new Error('Native tokenizer not available');
  }
  return nativeValidateTokenLimit(text, maxTokens);
}

/**
 * Chunk text by exact token count (Rust native)
 * 
 * @param text - Text to chunk
 * @param maxTokens - Maximum tokens per chunk
 * @param overlap - Token overlap between chunks
 * @returns Array of chunks with token-accurate boundaries
 */
export function chunkByTokens(
  text: string,
  maxTokens: number = MAX_CHUNK_TOKENS,
  overlap: number = 0
): ChunkResult[] {
  if (!nativeChunkByTokens) {
    throw new Error('Native tokenizer not available');
  }
  
  const nativeChunks = nativeChunkByTokens(text, maxTokens, overlap) as NativeTokenChunk[];
  return nativeChunks.map((chunk: NativeTokenChunk) => ({
    text: chunk.text,
    startIndex: chunk.start_token,
    endIndex: chunk.end_token,
    tokenEstimate: chunk.token_count,
    tokenCount: chunk.token_count,
    startToken: chunk.start_token,
    endToken: chunk.end_token,
  }));
}

/**
 * Chunk multiple texts by tokens in parallel (Rust native)
 * 
 * @param texts - Array of texts to chunk
 * @param maxTokens - Maximum tokens per chunk
 * @param overlap - Token overlap between chunks
 * @returns Array of chunk arrays (grouped by input text)
 */
export function chunkTextsByTokens(
  texts: string[],
  maxTokens: number = MAX_CHUNK_TOKENS,
  overlap: number = 0
): ChunkResult[][] {
  if (!nativeChunkTextsByTokens) {
    throw new Error('Native tokenizer not available');
  }
  
  const nativeResults = nativeChunkTextsByTokens(texts, maxTokens, overlap) as NativeTokenChunk[][];
  return nativeResults.map((fileChunks: NativeTokenChunk[]) =>
    fileChunks.map((chunk: NativeTokenChunk) => ({
      text: chunk.text,
      startIndex: chunk.start_token,
      endIndex: chunk.end_token,
      tokenEstimate: chunk.token_count,
      tokenCount: chunk.token_count,
      startToken: chunk.start_token,
      endToken: chunk.end_token,
    }))
  );
}

/**
 * Get token statistics for text
 * 
 * @param text - Text to analyze
 * @returns Token count, character count, and tokens per character ratio
 */
export function getTokenStats(text: string): NativeTokenStats {
  if (!nativeGetTokenStats) {
    throw new Error('Native tokenizer not available');
  }
  return nativeGetTokenStats(text) as NativeTokenStats;
}

/**
 * Filter texts that exceed token limit
 * 
 * @param texts - Array of texts to filter
 * @param maxTokens - Maximum allowed tokens
 * @returns Array of texts within the limit
 */
export function filterByTokenLimit(
  texts: string[],
  maxTokens: number = MAX_EMBEDDING_TOKENS
): string[] {
  if (!nativeFilterByTokenLimit) {
    throw new Error('Native tokenizer not available');
  }
  return nativeFilterByTokenLimit(texts, maxTokens);
}

/**
 * Check if native tokenizer is available
 */
export function isNativeTokenizerAvailable(): boolean {
  return isNativeAvailable() && nativeCountTokens !== undefined;
}
