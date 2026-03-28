/**
 * Type declarations for BigRAG native Rust module
 */

export interface HashResult {
  path: string;
  hash: string | null;
  error: string | null;
}

export interface TextChunk {
  text: string;
  start_index: number;
  end_index: number;
  token_estimate: number;
}

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

export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  mtime: number;
}

// Hashing functions
export function hashFile(path: string): Promise<string>;
export function hashFilesParallel(paths: string[]): Promise<HashResult[]>;
export function hashData(data: Buffer): string;

// Chunking functions
export function chunkText(text: string, chunkSize: number, overlap: number): TextChunk[];
export function chunkTextsParallel(texts: string[], chunkSize: number, overlap: number): TextChunk[][];
export function estimateTokens(text: string): number;
export function estimateTokensBatch(texts: string[]): number[];

// Directory scanning functions
export function scanDirectory(root: string): Promise<ScannedFile[]>;
export function isSupportedExtension(ext: string): boolean;
export function getSupportedExtensions(): string[];
export class DirectoryScanner {
  scan(root: string): Promise<ScannedFile[]>;
}

// Tokenizer functions
export function countTokens(text: string): number;
export function countTokensBatch(texts: string[]): TokenCountResult[];
export function validateTokenLimit(text: string, maxTokens?: number): boolean;
export function chunkByTokens(text: string, maxTokens: number, overlap: number): TokenChunk[];
export function chunkTextsByTokens(texts: string[], maxTokens: number, overlap: number): TokenChunk[][];
export function getTokenStats(text: string): TokenStats;
export function filterByTokenLimit(texts: string[], maxTokens: number): string[];

// Utility functions
export function isNativeAvailable(): boolean;
export function getNativeLoadError(): string | null;
