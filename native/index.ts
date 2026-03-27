/**
 * TypeScript bindings for BigRAG native Rust module
 * 
 * This module provides high-performance implementations of:
 * - File hashing (SHA-256)
 * - Text chunking
 * - Directory scanning
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load the native module
let nativeModule: any;
let loadError: Error | null = null;

try {
  nativeModule = require('./bigrag-native.linux-x64-gnu.node');
} catch (e) {
  loadError = e as Error;
}

// Fallback implementations in TypeScript
const fallbackImplementations = {
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
  ): Array<{ text: string; startIndex: number; endIndex: number; tokenEstimate: number }> => {
    const chunks: Array<{ text: string; startIndex: number; endIndex: number; tokenEstimate: number }> = [];
    const words = text.split(/\s+/);
    
    if (words.length === 0) {
      return chunks;
    }

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

  scanDirectory: async (root: string): Promise<Array<{
    path: string;
    name: string;
    extension: string;
    size: number;
    mtime: number;
  }>> => {
    const fs = await import('fs');
    const path = await import('path');
    
    const files: Array<{
      path: string;
      name: string;
      extension: string;
      size: number;
      mtime: number;
    }> = [];

    const supportedExtensions = new Set([
      '.txt', '.md', '.markdown',
      '.html', '.htm',
      '.pdf',
      '.epub',
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp',
      '.doc', '.docx',
      '.odt',
      '.rtf',
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

// Export native functions with fallback
export const hashFile = nativeModule?.hashFile || fallbackImplementations.hashFile;
export const hashFilesParallel = nativeModule?.hashFilesParallel;
export const hashData = nativeModule?.hashData;

export const chunkText = nativeModule?.chunkText || fallbackImplementations.chunkText;
export const chunkTextsParallel = nativeModule?.chunkTextsParallel;
export const estimateTokens = nativeModule?.estimateTokens;
export const estimateTokensBatch = nativeModule?.estimateTokensBatch;

export const scanDirectory = nativeModule?.scanDirectory || fallbackImplementations.scanDirectory;
export const isSupportedExtension = nativeModule?.isSupportedExtension;
export const getSupportedExtensions = nativeModule?.getSupportedExtensions;
export const DirectoryScanner = nativeModule?.DirectoryScanner;

// Type exports
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

export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  mtime: number;
}

// Check if native module is available
export function isNativeAvailable(): boolean {
  return nativeModule !== undefined;
}

export function getNativeLoadError(): string | null {
  return loadError?.message || null;
}
