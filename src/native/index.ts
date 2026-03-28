/**
 * Native module re-exports
 * 
 * This module provides high-performance Rust implementations of:
 * - File hashing (SHA-256)
 * - Text chunking
 * - Directory scanning
 * 
 * Falls back to TypeScript implementations if native module is not available.
 */

// Try to load native module, fallback to TS if not available
let nativeModule: any = null;
let nativeLoadError: string | null = null;

try {
  // Try different possible paths for the native module
  // Paths are relative to dist/native/index.js (compiled output)
  const paths = [
    '../native/bigrag-native.linux-x64-gnu.node',  // From dist/native/
    '../../native/bigrag-native.linux-x64-gnu.node',  // From dist/
    './bigrag-native.linux-x64-gnu.node',  // Same directory
    '@bigrag/native',  // NPM package (if installed)
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
    nativeLoadError = 'Native module not found at any of the expected paths';
    console.warn('[BigRAG Native] Using TypeScript fallbacks. Native functions will not be available.');
  }
} catch (e) {
  nativeLoadError = (e as Error).message;
  console.warn('[BigRAG Native] Error loading native module:', nativeLoadError);
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

// Fallback implementations
const fallbacks = {
  hashFile: async (path: string): Promise<string> => {
    const crypto = await import('crypto');
    const fs = await import('fs');
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(path);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  },

  chunkText: (
    text: string,
    chunkSize: number,
    overlap: number
  ): TextChunk[] => {
    const chunks: TextChunk[] = [];
    const words = text.split(/\s+/);
    if (words.length === 0) return chunks;

    let startIdx = 0;
    while (startIdx < words.length) {
      const endIdx = Math.min(startIdx + chunkSize, words.length);
      const chunkWords = words.slice(startIdx, endIdx);
      const chunkText = chunkWords.join(' ');
      chunks.push({
        text: chunkText,
        startIndex: startIdx,
        endIndex: endIdx,
        tokenEstimate: Math.ceil(chunkText.length / 4),
      });
      startIdx += Math.max(1, chunkSize - overlap);
      if (endIdx >= words.length) break;
    }
    return chunks;
  },

  scanDirectory: async (root: string): Promise<ScannedFile[]> => {
    const fs = await import('fs');
    const path = await import('path');
    const files: ScannedFile[] = [];

    const supportedExtensions = new Set([
      '.txt', '.md', '.markdown', '.html', '.htm', '.pdf', '.epub',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
    ]);

    async function walk(dir: string): Promise<void> {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            const stats = await fs.promises.stat(fullPath);
            files.push({
              path: fullPath,
              name: entry.name,
              extension: ext,
              size: stats.size,
              mtime: stats.mtimeMs,
            });
          }
        }
      }
    }

    await walk(root);
    return files;
  },
};

// Export functions with native/TS fallback
export const hashFile = nativeModule?.hashFile || fallbacks.hashFile;
export const hashFilesParallel = nativeModule?.hashFilesParallel;
export const hashData = nativeModule?.hashData;

// Optimized chunking - use native when available
export const chunkText = nativeModule?.chunkText || fallbacks.chunkText;
export const chunkTextFast = nativeModule?.chunkTextFast;
export const chunkTextsParallel = nativeModule?.chunkTextsParallel;
export const chunkTextsBatch = nativeModule?.chunkTextsBatch;
export const estimateTokens = nativeModule?.estimateTokens;
export const estimateTokensBatch = nativeModule?.estimateTokensBatch;

export const scanDirectory = nativeModule?.scanDirectory || fallbacks.scanDirectory;
export const isSupportedExtension = nativeModule?.isSupportedExtension || (() => true);
export const getSupportedExtensions = nativeModule?.getSupportedExtensions;
export const DirectoryScanner = nativeModule?.DirectoryScanner;

// Tokenizer functions (from Rust native module, with TS fallbacks)
const tokenizerFallbacks = {
  countTokens: (text: string): number => {
    // Heuristic fallback: ~1 token per 4 characters
    return Math.ceil(text.length / 4);
  },
  
  validateTokenLimit: (text: string, maxTokens?: number): boolean => {
    const max = maxTokens || 2048;
    return tokenizerFallbacks.countTokens(text) <= max;
  },
  
  chunkByTokens: (text: string, maxTokens: number, overlap: number): TokenChunk[] => {
    // Fallback: estimate words and chunk
    const words = text.split(/\s+/);
    const wordsPerToken = 0.75; // Approximate
    const maxWords = Math.floor(maxTokens / wordsPerToken);
    
    const chunks: TokenChunk[] = [];
    let startIdx = 0;
    
    while (startIdx < words.length) {
      const endIdx = Math.min(startIdx + maxWords, words.length);
      const chunkWords = words.slice(startIdx, endIdx);
      const chunkText = chunkWords.join(' ');
      
      chunks.push({
        text: chunkText,
        token_count: tokenizerFallbacks.countTokens(chunkText),
        start_token: startIdx,
        end_token: endIdx,
      });
      
      const step = Math.max(1, maxWords - Math.floor(overlap / wordsPerToken));
      startIdx += step;
      if (endIdx >= words.length) break;
    }
    
    return chunks;
  },
  
  chunkTextsByTokens: (texts: string[], maxTokens: number, overlap: number): TokenChunk[][] => {
    return texts.map(text => tokenizerFallbacks.chunkByTokens(text, maxTokens, overlap));
  },
  
  countTokensBatch: (texts: string[]): TokenCountResult[] => {
    return texts.map(text => ({
      text,
      token_count: tokenizerFallbacks.countTokens(text),
    }));
  },
  
  getTokenStats: (text: string): TokenStats => {
    const tokenCount = tokenizerFallbacks.countTokens(text);
    return {
      token_count: tokenCount,
      char_count: text.length,
      tokens_per_char: text.length > 0 ? tokenCount / text.length : 0,
    };
  },
  
  filterByTokenLimit: (texts: string[], maxTokens: number): string[] => {
    return texts.filter(text => tokenizerFallbacks.validateTokenLimit(text, maxTokens));
  },
};

export const countTokens = nativeModule?.countTokens || tokenizerFallbacks.countTokens;
export const countTokensBatch = nativeModule?.countTokensBatch || tokenizerFallbacks.countTokensBatch;
export const validateTokenLimit = nativeModule?.validateTokenLimit || tokenizerFallbacks.validateTokenLimit;
export const chunkByTokens = nativeModule?.chunkByTokens || tokenizerFallbacks.chunkByTokens;
export const chunkTextsByTokens = nativeModule?.chunkTextsByTokens || tokenizerFallbacks.chunkTextsByTokens;
export const getTokenStats = nativeModule?.getTokenStats || tokenizerFallbacks.getTokenStats;
export const filterByTokenLimit = nativeModule?.filterByTokenLimit || tokenizerFallbacks.filterByTokenLimit;

// Utility functions
export function isNativeAvailable(): boolean {
  return nativeModule !== null;
}

export function getNativeLoadError(): string | null {
  return nativeLoadError;
}
