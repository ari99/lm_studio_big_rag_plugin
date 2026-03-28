/**
 * Native module exports
 *
 * This module provides high-performance Rust implementations of:
 * - File hashing (SHA-256)
 * - Text chunking
 * - Directory scanning
 * - Token counting (cl100k_base for nomic-embed-text-v1.5)
 *
 * Requires native module to be built. No TypeScript fallbacks.
 */

// Try to load native module
let nativeModule: any = null;
let nativeLoadError: string | null = null;

try {
  // Try different possible paths for the native module
  // Paths are relative to dist/native/index.js (compiled output)
  const paths = [
    '../native/bigrag-native.linux-x64-gnu.node',  // From dist/native/
    '../../native/bigrag-native.linux-x64-gnu.node',  // From dist/
    './bigrag-native.linux-x64-gnu.node',  // Same directory
  ];

  for (const p of paths) {
    try {
      nativeModule = require(p);
      console.log('[BigRAG Native] Loaded from:', p);
      break;
    } catch (e) {
      // Silently try next path
    }
  }
  
  if (!nativeModule) {
    throw new Error('Native module not found. Ensure native module is built with: cd native && npm run build');
  }
} catch (e) {
  nativeLoadError = (e as Error).message;
  console.error('[BigRAG Native] Failed to load native module:', nativeLoadError);
  throw e;
}

// Type definitions (napi-rs converts snake_case to camelCase for JS)
export interface HashResult {
  path: string;
  hash: string | null;
  error: string | null;
}

export interface TextChunk {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
}

/// Batch chunk result with file index for identifying source document
export interface BatchChunkResult {
  fileIndex: number;
  chunkIndex: number;
  text: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
}

export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  mtime: number;
}

// Tokenizer type definitions
export interface TokenChunk {
  text: string;
  token_count: number;
  start_token: number;
  end_token: number;
}

export interface TokenCountResult {
  text: string;
  token_count: number;
}

export interface TokenStats {
  token_count: number;
  char_count: number;
  tokens_per_char: number;
}

// Export all functions from native module (no fallbacks)
export const hashFile = nativeModule.hashFile;
export const hashFilesParallel = nativeModule.hashFilesParallel;
export const hashData = nativeModule.hashData;

export const chunkText = nativeModule.chunkText;
export const chunkTextFast = nativeModule.chunkTextFast;
export const chunkTextsParallel = nativeModule.chunkTextsParallel;
export const chunkTextsBatch = nativeModule.chunkTextsBatch;
export const estimateTokens = nativeModule.estimateTokens;
export const estimateTokensBatch = nativeModule.estimateTokensBatch;

export const scanDirectory = nativeModule.scanDirectory;
export const isSupportedExtension = nativeModule.isSupportedExtension;
export const getSupportedExtensions = nativeModule.getSupportedExtensions;
export const DirectoryScanner = nativeModule.DirectoryScanner;

// Tokenizer functions (Rust native only, no fallbacks)
export const countTokens = nativeModule.countTokens;
export const countTokensBatch = nativeModule.countTokensBatch;
export const validateTokenLimit = nativeModule.validateTokenLimit;
export const chunkByTokens = nativeModule.chunkByTokens;
export const chunkTextsByTokens = nativeModule.chunkTextsByTokens;
export const getTokenStats = nativeModule.getTokenStats;
export const filterByTokenLimit = nativeModule.filterByTokenLimit;

// Utility functions
export function isNativeAvailable(): boolean {
  return nativeModule !== null;
}

export function getNativeLoadError(): string | null {
  return nativeLoadError;
}
