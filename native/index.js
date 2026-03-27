"use strict";
/**
 * TypeScript bindings for BigRAG native Rust module
 *
 * This module provides high-performance implementations of:
 * - File hashing (SHA-256)
 * - Text chunking
 * - Directory scanning
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectoryScanner = exports.getSupportedExtensions = exports.isSupportedExtension = exports.scanDirectory = exports.estimateTokensBatch = exports.estimateTokens = exports.chunkTextsParallel = exports.chunkText = exports.hashData = exports.hashFilesParallel = exports.hashFile = void 0;
exports.isNativeAvailable = isNativeAvailable;
exports.getNativeLoadError = getNativeLoadError;
const module_1 = require("module");
const require = (0, module_1.createRequire)(import.meta.url);
// Load the native module
let nativeModule;
let loadError = null;
try {
    nativeModule = require('./bigrag-native.linux-x64-gnu.node');
}
catch (e) {
    loadError = e;
}
// Fallback implementations in TypeScript
const fallbackImplementations = {
    hashFile: async (path) => {
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
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
            if (endIdx >= words.length)
                break;
        }
        return chunks;
    },
    scanDirectory: async (root) => {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
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
                }
                else if (entry.isFile()) {
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
// Check if native module is available
function isNativeAvailable() {
    return nativeModule !== undefined;
}
function getNativeLoadError() {
    return loadError?.message || null;
}
//# sourceMappingURL=index.js.map