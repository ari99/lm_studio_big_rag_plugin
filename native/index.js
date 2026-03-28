'use strict';
/**
 * TypeScript bindings for BigRAG native Rust module
 *
 * This module provides high-performance implementations of:
 * - File hashing (SHA-256)
 * - Text chunking
 * - Directory scanning
 * - Token counting (cl100k_base for nomic-embed-text-v1.5)
 */

Object.defineProperty(exports, "__esModule", { value: true });

const { createRequire } = require('module');
const require = createRequire(__filename);

// Load the native module
let nativeModule;
let loadError = null;

try {
  nativeModule = require('./bigrag-native.linux-x64-gnu.node');
} catch (e) {
  loadError = e;
}

// Fallback implementations in TypeScript
const fallbackImplementations = {
  hashFile: async (path) => {
    const crypto = require('crypto');
    const fs = require('fs');
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(path);
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  },

  chunkText: (text, chunkSize, overlap) => {
    const chunks = [];
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

  scanDirectory: async (root) => {
    const fs = require('fs');
    const path = require('path');
    const files = [];
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
    async function walk(dir) {
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
exports.hashFile = nativeModule?.hashFile || fallbackImplementations.hashFile;
exports.hashFilesParallel = nativeModule?.hashFilesParallel;
exports.hashData = nativeModule?.hashData;

exports.chunkText = nativeModule?.chunkText || fallbackImplementations.chunkText;
exports.chunkTextsParallel = nativeModule?.chunkTextsParallel;
exports.estimateTokens = nativeModule?.estimateTokens;
exports.estimateTokensBatch = nativeModule?.estimateTokensBatch;

exports.scanDirectory = nativeModule?.scanDirectory || fallbackImplementations.scanDirectory;
exports.isSupportedExtension = nativeModule?.isSupportedExtension;
exports.getSupportedExtensions = nativeModule?.getSupportedExtensions;
exports.DirectoryScanner = nativeModule?.DirectoryScanner;

// Tokenizer functions (Rust only, no fallback)
exports.countTokens = nativeModule?.countTokens;
exports.countTokensBatch = nativeModule?.countTokensBatch;
exports.validateTokenLimit = nativeModule?.validateTokenLimit;
exports.chunkByTokens = nativeModule?.chunkByTokens;
exports.chunkTextsByTokens = nativeModule?.chunkTextsByTokens;
exports.getTokenStats = nativeModule?.getTokenStats;
exports.filterByTokenLimit = nativeModule?.filterByTokenLimit;

// Check if native module is available
function isNativeAvailable() {
  return nativeModule !== undefined;
}
exports.isNativeAvailable = isNativeAvailable;

function getNativeLoadError() {
  return loadError?.message || null;
}
exports.getNativeLoadError = getNativeLoadError;
