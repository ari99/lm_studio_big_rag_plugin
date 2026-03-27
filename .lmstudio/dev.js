"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/config.ts
var import_sdk, DEFAULT_PROMPT_TEMPLATE, configSchematics;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    import_sdk = require("@lmstudio/sdk");
    DEFAULT_PROMPT_TEMPLATE = `{{rag_context}}

Use the citations above to respond to the user query, only if they are relevant. Otherwise, respond to the best of your ability without them.

User Query:

{{user_query}}`;
    configSchematics = (0, import_sdk.createConfigSchematics)().field(
      "documentsDirectory",
      "string",
      {
        displayName: "Documents Directory",
        subtitle: "Root directory containing documents to index. All subdirectories will be scanned.",
        placeholder: "/path/to/documents"
      },
      ""
    ).field(
      "vectorStoreDirectory",
      "string",
      {
        displayName: "Vector Store Directory",
        subtitle: "Directory where the vector database will be stored.",
        placeholder: "/path/to/vector/store"
      },
      ""
    ).field(
      "retrievalLimit",
      "numeric",
      {
        int: true,
        min: 1,
        max: 20,
        displayName: "Retrieval Limit",
        subtitle: "Maximum number of chunks to return during retrieval.",
        slider: { min: 1, max: 20, step: 1 }
      },
      5
    ).field(
      "retrievalAffinityThreshold",
      "numeric",
      {
        min: 0,
        max: 1,
        displayName: "Retrieval Affinity Threshold",
        subtitle: "Minimum similarity score for a chunk to be considered relevant.",
        slider: { min: 0, max: 1, step: 0.01 }
      },
      0.5
    ).field(
      "chunkSize",
      "numeric",
      {
        int: true,
        min: 128,
        max: 2048,
        displayName: "Chunk Size",
        subtitle: "Size of text chunks for embedding (in tokens).",
        slider: { min: 128, max: 2048, step: 128 }
      },
      512
    ).field(
      "chunkOverlap",
      "numeric",
      {
        int: true,
        min: 0,
        max: 512,
        displayName: "Chunk Overlap",
        subtitle: "Overlap between consecutive chunks (in tokens).",
        slider: { min: 0, max: 512, step: 32 }
      },
      100
    ).field(
      "maxConcurrentFiles",
      "numeric",
      {
        int: true,
        min: 1,
        max: 10,
        displayName: "Max Concurrent Files",
        subtitle: "Maximum number of files to process concurrently during indexing. Recommend 1 for large PDF datasets.",
        slider: { min: 1, max: 10, step: 1 }
      },
      1
    ).field(
      "parseDelayMs",
      "numeric",
      {
        int: true,
        min: 0,
        max: 5e3,
        displayName: "Parser Delay (ms)",
        subtitle: "Wait time before parsing each document (helps avoid WebSocket throttling).",
        slider: { min: 0, max: 5e3, step: 100 }
      },
      500
    ).field(
      "enableOCR",
      "boolean",
      {
        displayName: "Enable OCR",
        subtitle: "Enable OCR for image files and image-based PDFs using LM Studio's built-in document parser."
      },
      true
    ).field(
      "manualReindex.trigger",
      "boolean",
      {
        displayName: "Manual Reindex Trigger",
        subtitle: "Toggle ON to request an immediate reindex. The plugin resets this after running. Use the \u201CSkip Previously Indexed Files\u201D option below to control whether unchanged files are skipped."
      },
      false
    ).field(
      "manualReindex.skipPreviouslyIndexed",
      "boolean",
      {
        displayName: "Skip Previously Indexed Files",
        subtitle: "Skip unchanged files for faster manual runs. Only indexes new files or changed files.",
        dependencies: [
          {
            key: "manualReindex.trigger",
            condition: { type: "equals", value: true }
          }
        ]
      },
      true
    ).field(
      "promptTemplate",
      "string",
      {
        displayName: "Prompt Template",
        subtitle: "Supports {{rag_context}} (required) and {{user_query}} macros for customizing the final prompt.",
        placeholder: DEFAULT_PROMPT_TEMPLATE,
        isParagraph: true
      },
      DEFAULT_PROMPT_TEMPLATE
    ).build();
  }
});

// src/vectorstore/vectorStore.ts
var fs, path, import_vectra, MAX_ITEMS_PER_SHARD, SHARD_DIR_PREFIX, SHARD_DIR_REGEX, VectorStore;
var init_vectorStore = __esm({
  "src/vectorstore/vectorStore.ts"() {
    "use strict";
    fs = __toESM(require("fs/promises"));
    path = __toESM(require("path"));
    import_vectra = require("vectra");
    MAX_ITEMS_PER_SHARD = 1e4;
    SHARD_DIR_PREFIX = "shard_";
    SHARD_DIR_REGEX = /^shard_(\d+)$/;
    VectorStore = class {
      constructor(dbPath) {
        this.shardDirs = [];
        this.activeShard = null;
        this.activeShardCount = 0;
        this.updateMutex = Promise.resolve();
        this.dbPath = path.resolve(dbPath);
      }
      /**
       * Open a shard by directory name (e.g. "shard_000"). Caller must not hold the reference
       * after use so GC can free the parsed index data.
       */
      openShard(dir) {
        const fullPath = path.join(this.dbPath, dir);
        return new import_vectra.LocalIndex(fullPath);
      }
      /**
       * Scan dbPath for shard_NNN directories and return sorted list.
       */
      async discoverShardDirs() {
        const entries = await fs.readdir(this.dbPath, { withFileTypes: true });
        const dirs = [];
        for (const e of entries) {
          if (e.isDirectory() && SHARD_DIR_REGEX.test(e.name)) {
            dirs.push(e.name);
          }
        }
        dirs.sort((a, b) => {
          const n = (m) => parseInt(m.match(SHARD_DIR_REGEX)[1], 10);
          return n(a) - n(b);
        });
        return dirs;
      }
      /**
       * Initialize the vector store: discover or create shards, open the last as active.
       */
      async initialize() {
        await fs.mkdir(this.dbPath, { recursive: true });
        this.shardDirs = await this.discoverShardDirs();
        if (this.shardDirs.length === 0) {
          const firstDir = `${SHARD_DIR_PREFIX}000`;
          const fullPath = path.join(this.dbPath, firstDir);
          const index = new import_vectra.LocalIndex(fullPath);
          await index.createIndex({ version: 1 });
          this.shardDirs = [firstDir];
          this.activeShard = index;
          this.activeShardCount = 0;
        } else {
          const lastDir = this.shardDirs[this.shardDirs.length - 1];
          this.activeShard = this.openShard(lastDir);
          const items = await this.activeShard.listItems();
          this.activeShardCount = items.length;
        }
        console.log("Vector store initialized successfully");
      }
      /**
       * Add document chunks to the active shard. Rotates to a new shard when full.
       */
      async addChunks(chunks) {
        if (!this.activeShard) {
          throw new Error("Vector store not initialized");
        }
        if (chunks.length === 0) return;
        this.updateMutex = this.updateMutex.then(async () => {
          await this.activeShard.beginUpdate();
          try {
            for (const chunk of chunks) {
              const metadata = {
                text: chunk.text,
                filePath: chunk.filePath,
                fileName: chunk.fileName,
                fileHash: chunk.fileHash,
                chunkIndex: chunk.chunkIndex,
                ...chunk.metadata
              };
              await this.activeShard.upsertItem({
                id: chunk.id,
                vector: chunk.vector,
                metadata
              });
            }
            await this.activeShard.endUpdate();
          } catch (e) {
            this.activeShard.cancelUpdate();
            throw e;
          }
          this.activeShardCount += chunks.length;
          console.log(`Added ${chunks.length} chunks to vector store`);
          if (this.activeShardCount >= MAX_ITEMS_PER_SHARD) {
            const nextNum = this.shardDirs.length;
            const nextDir = `${SHARD_DIR_PREFIX}${String(nextNum).padStart(3, "0")}`;
            const fullPath = path.join(this.dbPath, nextDir);
            const newIndex = new import_vectra.LocalIndex(fullPath);
            await newIndex.createIndex({ version: 1 });
            this.shardDirs.push(nextDir);
            this.activeShard = newIndex;
            this.activeShardCount = 0;
          }
        });
        return this.updateMutex;
      }
      /**
       * Search: query each shard in turn, merge results, sort by score, filter by threshold, return top limit.
       */
      async search(queryVector, limit = 5, threshold = 0.5) {
        const merged = [];
        for (const dir of this.shardDirs) {
          const shard = this.openShard(dir);
          const results = await shard.queryItems(
            queryVector,
            "",
            limit,
            void 0,
            false
          );
          for (const r of results) {
            const m = r.item.metadata;
            merged.push({
              text: m?.text ?? "",
              score: r.score,
              filePath: m?.filePath ?? "",
              fileName: m?.fileName ?? "",
              chunkIndex: m?.chunkIndex ?? 0,
              shardName: dir,
              metadata: r.item.metadata ?? {}
            });
          }
        }
        return merged.filter((r) => r.score >= threshold).sort((a, b) => b.score - a.score).slice(0, limit);
      }
      /**
       * Delete all chunks for a file (by hash) across all shards.
       */
      async deleteByFileHash(fileHash) {
        const lastDir = this.shardDirs[this.shardDirs.length - 1];
        this.updateMutex = this.updateMutex.then(async () => {
          for (const dir of this.shardDirs) {
            const shard = this.openShard(dir);
            const items = await shard.listItems();
            const toDelete = items.filter(
              (i) => i.metadata?.fileHash === fileHash
            );
            if (toDelete.length > 0) {
              await shard.beginUpdate();
              for (const item of toDelete) {
                await shard.deleteItem(item.id);
              }
              await shard.endUpdate();
              if (dir === lastDir && this.activeShard) {
                this.activeShardCount = (await this.activeShard.listItems()).length;
              }
            }
          }
          console.log(`Deleted chunks for file hash: ${fileHash}`);
        });
        return this.updateMutex;
      }
      /**
       * Get file path -> set of file hashes currently in the store.
       */
      async getFileHashInventory() {
        const inventory = /* @__PURE__ */ new Map();
        for (const dir of this.shardDirs) {
          const shard = this.openShard(dir);
          const items = await shard.listItems();
          for (const item of items) {
            const m = item.metadata;
            const filePath = m?.filePath;
            const fileHash = m?.fileHash;
            if (!filePath || !fileHash) continue;
            let set = inventory.get(filePath);
            if (!set) {
              set = /* @__PURE__ */ new Set();
              inventory.set(filePath, set);
            }
            set.add(fileHash);
          }
        }
        return inventory;
      }
      /**
       * Get total chunk count and unique file count.
       */
      async getStats() {
        let totalChunks = 0;
        const uniqueHashes = /* @__PURE__ */ new Set();
        for (const dir of this.shardDirs) {
          const shard = this.openShard(dir);
          const items = await shard.listItems();
          totalChunks += items.length;
          for (const item of items) {
            const h = item.metadata?.fileHash;
            if (h) uniqueHashes.add(h);
          }
        }
        return { totalChunks, uniqueFiles: uniqueHashes.size };
      }
      /**
       * Check if any chunk exists for the given file hash (short-circuits on first match).
       */
      async hasFile(fileHash) {
        for (const dir of this.shardDirs) {
          const shard = this.openShard(dir);
          const items = await shard.listItems();
          if (items.some((i) => i.metadata?.fileHash === fileHash)) {
            return true;
          }
        }
        return false;
      }
      /**
       * Release the active shard reference.
       */
      async close() {
        this.activeShard = null;
      }
    };
  }
});

// src/utils/sanityChecks.ts
async function performSanityChecks(documentsDir, vectorStoreDir) {
  const warnings = [];
  const errors = [];
  try {
    await fs2.promises.access(documentsDir, fs2.constants.R_OK);
  } catch {
    errors.push(`Documents directory does not exist or is not readable: ${documentsDir}`);
  }
  try {
    await fs2.promises.access(vectorStoreDir, fs2.constants.W_OK);
  } catch {
    try {
      await fs2.promises.mkdir(vectorStoreDir, { recursive: true });
    } catch {
      errors.push(
        `Vector store directory does not exist and cannot be created: ${vectorStoreDir}`
      );
    }
  }
  try {
    const stats = await fs2.promises.statfs(vectorStoreDir);
    const availableGB = stats.bavail * stats.bsize / (1024 * 1024 * 1024);
    if (availableGB < 1) {
      errors.push(`Very low disk space available: ${availableGB.toFixed(2)} GB`);
    } else if (availableGB < 10) {
      warnings.push(`Low disk space available: ${availableGB.toFixed(2)} GB`);
    }
  } catch (error) {
    warnings.push("Could not check available disk space");
  }
  const freeMemoryGB = os.freemem() / (1024 * 1024 * 1024);
  const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
  const runningOnMac = process.platform === "darwin";
  const lowMemoryMessage = `Low free memory: ${freeMemoryGB.toFixed(2)} GB of ${totalMemoryGB.toFixed(2)} GB total. Consider reducing concurrent file processing.`;
  const veryLowMemoryMessage = `Very low free memory: ${freeMemoryGB.toFixed(2)} GB. ` + (runningOnMac ? "macOS may be reporting cached pages as used; cached memory can usually be reclaimed automatically." : "Indexing may fail due to insufficient RAM.");
  if (freeMemoryGB < 0.5) {
    if (runningOnMac) {
      warnings.push(veryLowMemoryMessage);
    } else {
      errors.push(`Very low free memory: ${freeMemoryGB.toFixed(2)} GB`);
    }
  } else if (freeMemoryGB < 2) {
    warnings.push(lowMemoryMessage);
  }
  try {
    const sampleSize = await estimateDirectorySize(documentsDir);
    const estimatedGB = sampleSize / (1024 * 1024 * 1024);
    if (estimatedGB > 100) {
      warnings.push(
        `Large directory detected (~${estimatedGB.toFixed(1)} GB). Initial indexing may take several hours.`
      );
    } else if (estimatedGB > 10) {
      warnings.push(
        `Medium-sized directory detected (~${estimatedGB.toFixed(1)} GB). Initial indexing may take 30-60 minutes.`
      );
    }
  } catch (error) {
    warnings.push("Could not estimate directory size");
  }
  try {
    const files = await fs2.promises.readdir(vectorStoreDir);
    if (files.length > 0) {
      warnings.push(
        "Vector store directory is not empty. Existing data will be used for incremental indexing."
      );
    }
  } catch {
  }
  return {
    passed: errors.length === 0,
    warnings,
    errors
  };
}
async function estimateDirectorySize(dir, maxSamples = 100) {
  let totalSize = 0;
  let fileCount = 0;
  let sampledSize = 0;
  let sampledCount = 0;
  async function walk(currentDir) {
    if (sampledCount >= maxSamples) {
      return;
    }
    try {
      const entries = await fs2.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (sampledCount >= maxSamples) {
          break;
        }
        const fullPath = `${currentDir}/${entry.name}`;
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          fileCount++;
          if (sampledCount < maxSamples) {
            try {
              const stats = await fs2.promises.stat(fullPath);
              sampledSize += stats.size;
              sampledCount++;
            } catch {
            }
          }
        }
      }
    } catch {
    }
  }
  await walk(dir);
  if (sampledCount > 0 && fileCount > 0) {
    const avgFileSize = sampledSize / sampledCount;
    totalSize = avgFileSize * fileCount;
  }
  return totalSize;
}
var fs2, os;
var init_sanityChecks = __esm({
  "src/utils/sanityChecks.ts"() {
    "use strict";
    fs2 = __toESM(require("fs"));
    os = __toESM(require("os"));
  }
});

// src/utils/indexingLock.ts
function tryStartIndexing(context = "unknown") {
  if (indexingInProgress) {
    console.debug(`[BigRAG] tryStartIndexing (${context}) failed: lock already held`);
    return false;
  }
  indexingInProgress = true;
  console.debug(`[BigRAG] tryStartIndexing (${context}) succeeded`);
  return true;
}
function finishIndexing() {
  indexingInProgress = false;
  console.debug("[BigRAG] finishIndexing: lock released");
}
var indexingInProgress;
var init_indexingLock = __esm({
  "src/utils/indexingLock.ts"() {
    "use strict";
    indexingInProgress = false;
  }
});

// src/native/index.ts
function isNativeAvailable() {
  return nativeModule !== null;
}
var nativeModule, nativeLoadError, fallbacks, hashFile, hashFilesParallel, hashData, chunkText, chunkTextFast, chunkTextsParallel, chunkTextsBatch, estimateTokens, estimateTokensBatch, scanDirectory, isSupportedExtension, getSupportedExtensions, DirectoryScanner;
var init_native = __esm({
  "src/native/index.ts"() {
    "use strict";
    nativeModule = null;
    nativeLoadError = null;
    try {
      const paths = [
        "../../native/bigrag-native.linux-x64-gnu.node",
        "../../native/index.node",
        "@bigrag/native"
      ];
      for (const p of paths) {
        try {
          nativeModule = require(p);
          break;
        } catch {
          continue;
        }
      }
    } catch (e) {
      nativeLoadError = e.message;
    }
    fallbacks = {
      hashFile: async (path7) => {
        const crypto2 = await import("crypto");
        const fs10 = await import("fs");
        return new Promise((resolve3, reject) => {
          const hash = crypto2.createHash("sha256");
          const stream = fs10.createReadStream(path7);
          stream.on("data", (data) => hash.update(data));
          stream.on("end", () => resolve3(hash.digest("hex")));
          stream.on("error", reject);
        });
      },
      chunkText: (text, chunkSize, overlap) => {
        const chunks = [];
        const words = text.split(/\s+/);
        if (words.length === 0) return chunks;
        let startIdx = 0;
        while (startIdx < words.length) {
          const endIdx = Math.min(startIdx + chunkSize, words.length);
          const chunkWords = words.slice(startIdx, endIdx);
          const chunkText3 = chunkWords.join(" ");
          chunks.push({
            text: chunkText3,
            startIndex: startIdx,
            endIndex: endIdx,
            tokenEstimate: Math.ceil(chunkText3.length / 4)
          });
          startIdx += Math.max(1, chunkSize - overlap);
          if (endIdx >= words.length) break;
        }
        return chunks;
      },
      scanDirectory: async (root) => {
        const fs10 = await import("fs");
        const path7 = await import("path");
        const files = [];
        const supportedExtensions = /* @__PURE__ */ new Set([
          ".txt",
          ".md",
          ".markdown",
          ".html",
          ".htm",
          ".pdf",
          ".epub",
          ".jpg",
          ".jpeg",
          ".png",
          ".gif",
          ".bmp",
          ".tiff",
          ".webp"
        ]);
        async function walk(dir) {
          const entries = await fs10.promises.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path7.join(dir, entry.name);
            if (entry.isDirectory()) {
              await walk(fullPath);
            } else if (entry.isFile()) {
              const ext = path7.extname(entry.name).toLowerCase();
              if (supportedExtensions.has(ext)) {
                const stats = await fs10.promises.stat(fullPath);
                files.push({
                  path: fullPath,
                  name: entry.name,
                  extension: ext,
                  size: stats.size,
                  mtime: stats.mtimeMs
                });
              }
            }
          }
        }
        await walk(root);
        return files;
      }
    };
    hashFile = nativeModule?.hashFile || fallbacks.hashFile;
    hashFilesParallel = nativeModule?.hashFilesParallel;
    hashData = nativeModule?.hashData;
    chunkText = nativeModule?.chunkText || fallbacks.chunkText;
    chunkTextFast = nativeModule?.chunkTextFast;
    chunkTextsParallel = nativeModule?.chunkTextsParallel;
    chunkTextsBatch = nativeModule?.chunkTextsBatch;
    estimateTokens = nativeModule?.estimateTokens;
    estimateTokensBatch = nativeModule?.estimateTokensBatch;
    scanDirectory = nativeModule?.scanDirectory || fallbacks.scanDirectory;
    isSupportedExtension = nativeModule?.isSupportedExtension || (() => true);
    getSupportedExtensions = nativeModule?.getSupportedExtensions;
    DirectoryScanner = nativeModule?.DirectoryScanner;
  }
});

// src/utils/supportedExtensions.ts
function isHtmlExtension(ext) {
  return HTML_EXTENSION_SET.has(ext.toLowerCase());
}
function isMarkdownExtension(ext) {
  return MARKDOWN_EXTENSION_SET.has(ext.toLowerCase());
}
function isPlainTextExtension(ext) {
  return TEXT_EXTENSION_SET.has(ext.toLowerCase());
}
function isTextualExtension(ext) {
  return isMarkdownExtension(ext) || isPlainTextExtension(ext);
}
function listSupportedExtensions() {
  return Array.from(SUPPORTED_EXTENSIONS.values()).sort();
}
var HTML_EXTENSIONS, MARKDOWN_EXTENSIONS, TEXT_EXTENSIONS, PDF_EXTENSIONS, EPUB_EXTENSIONS, IMAGE_EXTENSIONS, ARCHIVE_EXTENSIONS, ALL_EXTENSION_GROUPS, SUPPORTED_EXTENSIONS, HTML_EXTENSION_SET, MARKDOWN_EXTENSION_SET, TEXT_EXTENSION_SET, IMAGE_EXTENSION_SET;
var init_supportedExtensions = __esm({
  "src/utils/supportedExtensions.ts"() {
    "use strict";
    HTML_EXTENSIONS = [".htm", ".html", ".xhtml"];
    MARKDOWN_EXTENSIONS = [".md", ".markdown", ".mdown", ".mdx", ".mkd", ".mkdn"];
    TEXT_EXTENSIONS = [".txt", ".text"];
    PDF_EXTENSIONS = [".pdf"];
    EPUB_EXTENSIONS = [".epub"];
    IMAGE_EXTENSIONS = [".bmp", ".jpg", ".jpeg", ".png"];
    ARCHIVE_EXTENSIONS = [".rar"];
    ALL_EXTENSION_GROUPS = [
      HTML_EXTENSIONS,
      MARKDOWN_EXTENSIONS,
      TEXT_EXTENSIONS,
      PDF_EXTENSIONS,
      EPUB_EXTENSIONS,
      IMAGE_EXTENSIONS,
      ARCHIVE_EXTENSIONS
    ];
    SUPPORTED_EXTENSIONS = new Set(
      ALL_EXTENSION_GROUPS.flatMap((group) => group.map((ext) => ext.toLowerCase()))
    );
    HTML_EXTENSION_SET = new Set(HTML_EXTENSIONS);
    MARKDOWN_EXTENSION_SET = new Set(MARKDOWN_EXTENSIONS);
    TEXT_EXTENSION_SET = new Set(TEXT_EXTENSIONS);
    IMAGE_EXTENSION_SET = new Set(IMAGE_EXTENSIONS);
  }
});

// src/ingestion/fileScanner.ts
function normalizeRootDir(rootDir) {
  const normalized = path2.resolve(rootDir.trim()).replace(/\/+$/, "");
  return normalized;
}
async function scanDirectory2(rootDir, onProgress) {
  const root = normalizeRootDir(rootDir);
  try {
    await fs3.promises.access(root, fs3.constants.R_OK);
  } catch (err) {
    if (err?.code === "ENOENT") {
      throw new Error(
        `Documents directory does not exist: ${root}. Check the path (e.g. spelling and that the folder exists).`
      );
    }
    throw err;
  }
  if (isNativeAvailable()) {
    const nativeFiles = await scanDirectory(root);
    const files2 = nativeFiles.map((f) => ({
      path: f.path,
      name: f.name,
      extension: f.extension,
      mimeType: mime.lookup(f.path),
      size: f.size,
      mtime: new Date(f.mtime * 1e3)
      // Convert from Unix timestamp
    }));
    if (onProgress) {
      onProgress(files2.length, files2.length);
    }
    return files2;
  }
  const files = [];
  let scannedCount = 0;
  const supportedExtensionsDescription = listSupportedExtensions().join(", ");
  console.log(`[Scanner] Supported extensions: ${supportedExtensionsDescription}`);
  async function walk(dir) {
    try {
      const entries = await fs3.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path2.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          scannedCount++;
          const ext = path2.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            const stats = await fs3.promises.stat(fullPath);
            const mimeType = mime.lookup(fullPath);
            files.push({
              path: fullPath,
              name: entry.name,
              extension: ext,
              mimeType,
              size: stats.size,
              mtime: stats.mtime
            });
          }
          if (onProgress && scannedCount % 100 === 0) {
            onProgress(scannedCount, files.length);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }
  await walk(root);
  if (onProgress) {
    onProgress(scannedCount, files.length);
  }
  return files;
}
var fs3, path2, mime;
var init_fileScanner = __esm({
  "src/ingestion/fileScanner.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"));
    path2 = __toESM(require("path"));
    mime = __toESM(require("mime-types"));
    init_native();
    init_supportedExtensions();
  }
});

// src/parsers/htmlParser.ts
async function parseHTML(filePath) {
  try {
    const content = await fs4.promises.readFile(filePath, "utf-8");
    const $ = cheerio.load(content);
    $("script, style, noscript").remove();
    const text = $("body").text() || $.text();
    return text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
  } catch (error) {
    console.error(`Error parsing HTML file ${filePath}:`, error);
    return "";
  }
}
var cheerio, fs4;
var init_htmlParser = __esm({
  "src/parsers/htmlParser.ts"() {
    "use strict";
    cheerio = __toESM(require("cheerio"));
    fs4 = __toESM(require("fs"));
  }
});

// src/parsers/pdfParser.ts
function cleanText(text) {
  return text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
}
async function getPdfjsLib() {
  if (!cachedPdfjsLib) {
    cachedPdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return cachedPdfjsLib;
}
async function tryLmStudioParser(filePath, client2) {
  const maxRetries = 2;
  const fileName = filePath.split("/").pop() || filePath;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileHandle = await client2.files.prepareFile(filePath);
      const result = await client2.files.parseDocument(fileHandle, {
        onProgress: (progress) => {
          if (progress === 0 || progress === 1) {
            console.log(
              `[PDF Parser] (LM Studio) Processing ${fileName}: ${(progress * 100).toFixed(0)}%`
            );
          }
        }
      });
      const cleaned = cleanText(result.content);
      if (cleaned.length >= MIN_TEXT_LENGTH) {
        return {
          success: true,
          text: cleaned,
          stage: "lmstudio"
        };
      }
      console.log(
        `[PDF Parser] (LM Studio) Parsed but got very little text from ${fileName} (length=${cleaned.length}), will try fallbacks`
      );
      return {
        success: false,
        reason: "pdf.lmstudio-empty",
        details: `length=${cleaned.length}`
      };
    } catch (error) {
      const isWebSocketError = error instanceof Error && (error.message.includes("WebSocket") || error.message.includes("connection closed"));
      if (isWebSocketError && attempt < maxRetries) {
        console.warn(
          `[PDF Parser] (LM Studio) WebSocket error on ${fileName}, retrying (${attempt}/${maxRetries})...`
        );
        await new Promise((resolve3) => setTimeout(resolve3, 1e3 * attempt));
        continue;
      }
      console.error(`[PDF Parser] (LM Studio) Error parsing PDF file ${filePath}:`, error);
      return {
        success: false,
        reason: "pdf.lmstudio-error",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }
  return {
    success: false,
    reason: "pdf.lmstudio-error",
    details: "Exceeded retry attempts"
  };
}
async function tryPdfParse(filePath) {
  const fileName = filePath.split("/").pop() || filePath;
  try {
    const buffer = await fs5.promises.readFile(filePath);
    const result = await (0, import_pdf_parse.default)(buffer);
    const cleaned = cleanText(result.text || "");
    if (cleaned.length >= MIN_TEXT_LENGTH) {
      console.log(`[PDF Parser] (pdf-parse) Successfully extracted text from ${fileName}`);
      return {
        success: true,
        text: cleaned,
        stage: "pdf-parse"
      };
    }
    console.log(
      `[PDF Parser] (pdf-parse) Very little or no text extracted from ${fileName} (length=${cleaned.length})`
    );
    return {
      success: false,
      reason: "pdf.pdfparse-empty",
      details: `length=${cleaned.length}`
    };
  } catch (error) {
    console.error(`[PDF Parser] (pdf-parse) Error parsing PDF file ${filePath}:`, error);
    return {
      success: false,
      reason: "pdf.pdfparse-error",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
async function tryOcrWithPdfJs(filePath) {
  const fileName = filePath.split("/").pop() || filePath;
  let worker = null;
  try {
    const pdfjsLib = await getPdfjsLib();
    const data = new Uint8Array(await fs5.promises.readFile(filePath));
    const pdfDocument = await pdfjsLib.getDocument({ data, verbosity: pdfjsLib.VerbosityLevel.ERRORS }).promise;
    const numPages = pdfDocument.numPages;
    const maxPages = Math.min(numPages, OCR_MAX_PAGES);
    console.log(
      `[PDF Parser] (OCR) Starting OCR for ${fileName} - pages 1 to ${maxPages} (of ${numPages})`
    );
    worker = await (0, import_tesseract.createWorker)("eng");
    const textParts = [];
    let renderErrors = 0;
    let processedImages = 0;
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      let page;
      try {
        page = await pdfDocument.getPage(pageNum);
        const images = await extractImagesForPage(pdfjsLib, page);
        if (images.length === 0) {
          console.log(
            `[PDF Parser] (OCR) ${fileName} - page ${pageNum} contains no extractable images, skipping`
          );
          continue;
        }
        const selectedImages = images.slice(0, OCR_MAX_IMAGES_PER_PAGE);
        for (const image of selectedImages) {
          try {
            const {
              data: { text }
            } = await worker.recognize(image.buffer);
            processedImages++;
            const cleaned = cleanText(text || "");
            if (cleaned.length > 0) {
              textParts.push(cleaned);
            }
          } catch (recognizeError) {
            console.warn(
              `[PDF Parser] (OCR) Failed to recognize image (${image.width}x${image.height}) on page ${pageNum} of ${fileName}:`,
              recognizeError instanceof Error ? recognizeError.message : recognizeError
            );
            try {
              await worker.terminate();
            } catch {
            }
            try {
              worker = await (0, import_tesseract.createWorker)("eng");
            } catch (recreateError) {
              console.error(
                `[PDF Parser] (OCR) Failed to recreate OCR worker, aborting OCR for ${fileName}`
              );
              worker = null;
              return {
                success: false,
                reason: "pdf.ocr-error",
                details: `Worker crashed and could not be recreated: ${recreateError instanceof Error ? recreateError.message : String(recreateError)}`
              };
            }
          }
        }
        if (pageNum === 1 || pageNum % 10 === 0 || pageNum === maxPages) {
          console.log(
            `[PDF Parser] (OCR) ${fileName} - processed page ${pageNum}/${maxPages} (images=${processedImages}, chars=${textParts.join(
              "\n\n"
            ).length})`
          );
        }
      } catch (pageError) {
        if (pageError instanceof ImageDataTimeoutError) {
          console.error(
            `[PDF Parser] (OCR) Aborting OCR for ${fileName}: ${pageError.message}`
          );
          await worker.terminate();
          worker = null;
          return {
            success: false,
            reason: "pdf.ocr-error",
            details: pageError.message
          };
        }
        renderErrors++;
        console.error(
          `[PDF Parser] (OCR) Error processing page ${pageNum} of ${fileName}:`,
          pageError
        );
      } finally {
        await page?.cleanup();
      }
    }
    if (worker) {
      await worker.terminate();
    }
    worker = null;
    const fullText = cleanText(textParts.join("\n\n"));
    console.log(
      `[PDF Parser] (OCR) Completed OCR for ${fileName}, extracted ${fullText.length} characters`
    );
    if (fullText.length >= MIN_TEXT_LENGTH) {
      return {
        success: true,
        text: fullText,
        stage: "ocr"
      };
    }
    if (renderErrors > 0) {
      return {
        success: false,
        reason: "pdf.ocr-render-error",
        details: `${renderErrors} page render errors`
      };
    }
    return {
      success: false,
      reason: "pdf.ocr-empty",
      details: "OCR produced insufficient text"
    };
  } catch (error) {
    console.error(`[PDF Parser] (OCR) Error during OCR for ${fileName}:`, error);
    return {
      success: false,
      reason: "pdf.ocr-error",
      details: error instanceof Error ? error.message : String(error)
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
async function extractImagesForPage(pdfjsLib, page) {
  const operatorList = await page.getOperatorList();
  const images = [];
  const imageDataCache = /* @__PURE__ */ new Map();
  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];
    try {
      if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintImageXObjectRepeat) {
        const objId = args?.[0];
        if (typeof objId !== "string") {
          continue;
        }
        let imgData;
        try {
          imgData = await resolveImageData(page, objId, imageDataCache);
        } catch (error) {
          if (error instanceof ImageDataTimeoutError) {
            throw error;
          }
          console.warn("[PDF Parser] (OCR) Failed to resolve image data:", error);
          continue;
        }
        if (!imgData) {
          continue;
        }
        const converted = convertImageDataToPng(pdfjsLib, imgData);
        if (converted) {
          images.push(converted);
        }
      } else if (fn === pdfjsLib.OPS.paintInlineImageXObject && args?.[0]) {
        const converted = convertImageDataToPng(pdfjsLib, args[0]);
        if (converted) {
          images.push(converted);
        }
      }
    } catch (error) {
      if (error instanceof ImageDataTimeoutError) {
        throw error;
      }
      console.warn("[PDF Parser] (OCR) Failed to extract inline image:", error);
    }
  }
  return images.filter((image) => {
    if (image.area < OCR_MIN_IMAGE_AREA) return false;
    if (image.area > OCR_MAX_IMAGE_PIXELS) {
      console.warn(
        `[PDF Parser] (OCR) Skipping oversized image (${image.width}x${image.height} = ${image.area.toLocaleString()} pixels) to avoid memory allocation failure`
      );
      return false;
    }
    return true;
  }).sort((a, b) => b.area - a.area);
}
async function resolveImageData(page, objId, cache) {
  if (cache.has(objId)) {
    return cache.get(objId);
  }
  const promise = (async () => {
    try {
      if (typeof page.objs.has === "function" && page.objs.has(objId)) {
        return page.objs.get(objId);
      }
    } catch {
    }
    return new Promise((resolve3, reject) => {
      let settled = false;
      let timeoutHandle = null;
      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
      };
      const handleData = (data) => {
        settled = true;
        cleanup();
        resolve3(data);
      };
      try {
        page.objs.get(objId, handleData);
      } catch (error) {
        settled = true;
        cleanup();
        reject(error);
        return;
      }
      if (Number.isFinite(OCR_IMAGE_TIMEOUT_MS) && OCR_IMAGE_TIMEOUT_MS > 0) {
        timeoutHandle = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new ImageDataTimeoutError(objId));
          }
        }, OCR_IMAGE_TIMEOUT_MS);
      }
    });
  })();
  cache.set(objId, promise);
  return promise;
}
function convertImageDataToPng(pdfjsLib, imgData) {
  if (!imgData || typeof imgData.width !== "number" || typeof imgData.height !== "number") {
    return null;
  }
  const { width, height, kind, data } = imgData;
  if (!data) {
    return null;
  }
  const png = new import_pngjs.PNG({ width, height });
  const dest = png.data;
  if (kind === pdfjsLib.ImageKind.RGBA_32BPP && data.length === width * height * 4) {
    dest.set(Buffer.from(data));
  } else if (kind === pdfjsLib.ImageKind.RGB_24BPP && data.length === width * height * 3) {
    const src = data;
    for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
      dest[j] = src[i];
      dest[j + 1] = src[i + 1];
      dest[j + 2] = src[i + 2];
      dest[j + 3] = 255;
    }
  } else if (kind === pdfjsLib.ImageKind.GRAYSCALE_1BPP) {
    let pixelIndex = 0;
    const totalPixels = width * height;
    for (let byteIndex = 0; byteIndex < data.length && pixelIndex < totalPixels; byteIndex++) {
      const byte = data[byteIndex];
      for (let bit = 7; bit >= 0 && pixelIndex < totalPixels; bit--) {
        const value = byte >> bit & 1 ? 255 : 0;
        const destIndex = pixelIndex * 4;
        dest[destIndex] = value;
        dest[destIndex + 1] = value;
        dest[destIndex + 2] = value;
        dest[destIndex + 3] = 255;
        pixelIndex++;
      }
    }
  } else {
    return null;
  }
  return {
    buffer: import_pngjs.PNG.sync.write(png),
    width,
    height,
    area: width * height
  };
}
async function parsePDF(filePath, client2, enableOCR) {
  const fileName = filePath.split("/").pop() || filePath;
  const lmStudioResult = await tryLmStudioParser(filePath, client2);
  if (lmStudioResult.success) {
    return lmStudioResult;
  }
  let lastFailure = lmStudioResult;
  const pdfParseResult = await tryPdfParse(filePath);
  if (pdfParseResult.success) {
    return pdfParseResult;
  }
  lastFailure = pdfParseResult;
  if (!enableOCR) {
    console.log(
      `[PDF Parser] (OCR) Enable OCR is off, skipping OCR fallback for ${fileName} after other methods returned no text`
    );
    return {
      success: false,
      reason: "pdf.ocr-disabled",
      details: `Previous failure reason: ${lastFailure.reason}`
    };
  }
  console.log(
    `[PDF Parser] (OCR) No text extracted from ${fileName} with LM Studio or pdf-parse, attempting OCR...`
  );
  const ocrResult = await tryOcrWithPdfJs(filePath);
  if (ocrResult.success) {
    return ocrResult;
  }
  return ocrResult;
}
var fs5, import_pdf_parse, import_tesseract, import_pngjs, MIN_TEXT_LENGTH, OCR_MAX_PAGES, OCR_MAX_IMAGES_PER_PAGE, OCR_MIN_IMAGE_AREA, OCR_MAX_IMAGE_PIXELS, OCR_IMAGE_TIMEOUT_MS, ImageDataTimeoutError, cachedPdfjsLib;
var init_pdfParser = __esm({
  "src/parsers/pdfParser.ts"() {
    "use strict";
    fs5 = __toESM(require("fs"));
    import_pdf_parse = __toESM(require("pdf-parse"));
    import_tesseract = require("tesseract.js");
    import_pngjs = require("pngjs");
    MIN_TEXT_LENGTH = 50;
    OCR_MAX_PAGES = 50;
    OCR_MAX_IMAGES_PER_PAGE = 3;
    OCR_MIN_IMAGE_AREA = 1e4;
    OCR_MAX_IMAGE_PIXELS = 5e7;
    OCR_IMAGE_TIMEOUT_MS = 3e4;
    ImageDataTimeoutError = class extends Error {
      constructor(objId) {
        super(`Timed out fetching image data for ${objId}`);
        this.name = "ImageDataTimeoutError";
      }
    };
    cachedPdfjsLib = null;
  }
});

// src/parsers/epubParser.ts
async function parseEPUB(filePath) {
  return new Promise((resolve3, reject) => {
    try {
      const epub = new import_epub2.EPub(filePath);
      epub.on("error", (error) => {
        console.error(`Error parsing EPUB file ${filePath}:`, error);
        resolve3("");
      });
      const stripHtml = (input) => input.replace(/<[^>]*>/g, " ");
      const getManifestEntry = (chapterId) => {
        return epub.manifest?.[chapterId];
      };
      const decodeMediaType = (entry) => entry?.["media-type"] || entry?.mediaType || "";
      const shouldReadRaw = (mediaType) => {
        const normalized = mediaType.toLowerCase();
        if (!normalized) {
          return true;
        }
        if (normalized === "application/xhtml+xml" || normalized === "image/svg+xml") {
          return false;
        }
        if (normalized.startsWith("text/")) {
          return true;
        }
        if (normalized.includes("html")) {
          return true;
        }
        return true;
      };
      const readChapter = async (chapterId) => {
        const manifestEntry = getManifestEntry(chapterId);
        if (!manifestEntry) {
          console.warn(`EPUB chapter ${chapterId} missing manifest entry in ${filePath}, skipping`);
          return "";
        }
        const mediaType = decodeMediaType(manifestEntry);
        if (shouldReadRaw(mediaType)) {
          return new Promise((res, rej) => {
            epub.getFile(
              chapterId,
              (error, data) => {
                if (error) {
                  rej(error);
                } else if (!data) {
                  res("");
                } else {
                  res(stripHtml(data.toString("utf-8")));
                }
              }
            );
          });
        }
        return new Promise((res, rej) => {
          epub.getChapter(
            chapterId,
            (error, text) => {
              if (error) {
                rej(error);
              } else if (typeof text === "string") {
                res(stripHtml(text));
              } else {
                res("");
              }
            }
          );
        });
      };
      epub.on("end", async () => {
        try {
          const chapters = epub.flow;
          const textParts = [];
          for (const chapter of chapters) {
            try {
              const chapterId = chapter.id;
              if (!chapterId) {
                console.warn(`EPUB chapter missing id in ${filePath}, skipping`);
                textParts.push("");
                continue;
              }
              const text = await readChapter(chapterId);
              textParts.push(text);
            } catch (chapterError) {
              console.error(`Error reading chapter ${chapter.id}:`, chapterError);
            }
          }
          const fullText = textParts.join("\n\n");
          resolve3(
            fullText.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim()
          );
        } catch (error) {
          console.error(`Error processing EPUB chapters:`, error);
          resolve3("");
        }
      });
      epub.parse();
    } catch (error) {
      console.error(`Error initializing EPUB parser for ${filePath}:`, error);
      resolve3("");
    }
  });
}
var import_epub2;
var init_epubParser = __esm({
  "src/parsers/epubParser.ts"() {
    "use strict";
    import_epub2 = require("epub2");
  }
});

// src/parsers/imageParser.ts
async function parseImage(filePath) {
  try {
    const worker = await (0, import_tesseract2.createWorker)("eng");
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim();
  } catch (error) {
    console.error(`Error parsing image file ${filePath}:`, error);
    return "";
  }
}
var import_tesseract2;
var init_imageParser = __esm({
  "src/parsers/imageParser.ts"() {
    "use strict";
    import_tesseract2 = require("tesseract.js");
  }
});

// src/parsers/textParser.ts
async function parseText(filePath, options = {}) {
  const { stripMarkdown = false, preserveLineBreaks = false } = options;
  try {
    const content = await fs6.promises.readFile(filePath, "utf-8");
    const normalized = normalizeLineEndings(content);
    const stripped = stripMarkdown ? stripMarkdownSyntax(normalized) : normalized;
    return (preserveLineBreaks ? collapseWhitespaceButKeepLines(stripped) : collapseWhitespace(stripped)).trim();
  } catch (error) {
    console.error(`Error parsing text file ${filePath}:`, error);
    return "";
  }
}
function normalizeLineEndings(input) {
  return input.replace(/\r\n?/g, "\n");
}
function collapseWhitespace(input) {
  return input.replace(/\s+/g, " ");
}
function collapseWhitespaceButKeepLines(input) {
  return input.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
}
function stripMarkdownSyntax(input) {
  let output = input;
  output = output.replace(/```[\s\S]*?```/g, " ");
  output = output.replace(/`([^`]+)`/g, "$1");
  output = output.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1 ");
  output = output.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  output = output.replace(/(\*\*|__)(.*?)\1/g, "$2");
  output = output.replace(/(\*|_)(.*?)\1/g, "$2");
  output = output.replace(/^\s{0,3}#{1,6}\s+/gm, "");
  output = output.replace(/^\s{0,3}>\s?/gm, "");
  output = output.replace(/^\s{0,3}[-*+]\s+/gm, "");
  output = output.replace(/^\s{0,3}\d+[\.\)]\s+/gm, "");
  output = output.replace(/^\s{0,3}([-*_]\s?){3,}$/gm, "");
  output = output.replace(/<[^>]+>/g, " ");
  return output;
}
var fs6;
var init_textParser = __esm({
  "src/parsers/textParser.ts"() {
    "use strict";
    fs6 = __toESM(require("fs"));
  }
});

// src/parsers/documentParser.ts
async function parseDocument(filePath, enableOCR = false, client2) {
  const ext = path3.extname(filePath).toLowerCase();
  const fileName = path3.basename(filePath);
  const buildSuccess = (text) => ({
    success: true,
    document: {
      text,
      metadata: {
        filePath,
        fileName,
        extension: ext,
        parsedAt: /* @__PURE__ */ new Date()
      }
    }
  });
  try {
    if (isHtmlExtension(ext)) {
      try {
        const text = cleanAndValidate(
          await parseHTML(filePath),
          "html.empty",
          `${fileName} html`
        );
        return text.success ? buildSuccess(text.value) : text;
      } catch (error) {
        console.error(`[Parser][HTML] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "html.error",
          details: error instanceof Error ? error.message : String(error)
        };
      }
    }
    if (ext === ".pdf") {
      if (!client2) {
        console.warn(`[Parser] No LM Studio client available for PDF parsing: ${fileName}`);
        return { success: false, reason: "pdf.missing-client" };
      }
      const pdfResult = await parsePDF(filePath, client2, enableOCR);
      if (pdfResult.success) {
        return buildSuccess(pdfResult.text);
      }
      return pdfResult;
    }
    if (ext === ".epub") {
      const text = await parseEPUB(filePath);
      const cleaned = cleanAndValidate(text, "epub.empty", fileName);
      return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
    }
    if (isTextualExtension(ext)) {
      try {
        const text = await parseText(filePath, {
          stripMarkdown: isMarkdownExtension(ext),
          preserveLineBreaks: isPlainTextExtension(ext)
        });
        const cleaned = cleanAndValidate(text, "text.empty", fileName);
        return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
      } catch (error) {
        console.error(`[Parser][Text] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "text.error",
          details: error instanceof Error ? error.message : String(error)
        };
      }
    }
    if (IMAGE_EXTENSION_SET.has(ext)) {
      if (!enableOCR) {
        console.log(`Skipping image file ${filePath} (OCR disabled)`);
        return { success: false, reason: "image.ocr-disabled" };
      }
      try {
        const text = await parseImage(filePath);
        const cleaned = cleanAndValidate(text, "image.empty", fileName);
        return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
      } catch (error) {
        console.error(`[Parser][Image] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "image.error",
          details: error instanceof Error ? error.message : String(error)
        };
      }
    }
    if (ext === ".rar") {
      console.log(`RAR files not yet supported: ${filePath}`);
      return { success: false, reason: "unsupported-extension", details: ".rar" };
    }
    console.log(`Unsupported file type: ${filePath}`);
    return { success: false, reason: "unsupported-extension", details: ext };
  } catch (error) {
    console.error(`Error parsing document ${filePath}:`, error);
    return {
      success: false,
      reason: "parser.unexpected-error",
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
function cleanAndValidate(text, emptyReason, detailsContext) {
  const cleaned = text?.trim() ?? "";
  if (cleaned.length === 0) {
    return {
      success: false,
      reason: emptyReason,
      details: detailsContext ? `${detailsContext} trimmed to zero length` : void 0
    };
  }
  return { success: true, value: cleaned };
}
var path3;
var init_documentParser = __esm({
  "src/parsers/documentParser.ts"() {
    "use strict";
    path3 = __toESM(require("path"));
    init_htmlParser();
    init_pdfParser();
    init_epubParser();
    init_imageParser();
    init_textParser();
    init_supportedExtensions();
  }
});

// src/utils/textChunker.ts
function chunkText2(text, chunkSize, overlap) {
  if (isNativeAvailable()) {
    const nativeChunks = chunkText(text, chunkSize, overlap);
    return nativeChunks.map((chunk) => ({
      text: chunk.text,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      tokenEstimate: chunk.tokenEstimate
    }));
  }
  const chunks = [];
  const words = text.split(/\s+/);
  if (words.length === 0) {
    return chunks;
  }
  let startIdx = 0;
  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    const chunkWords = words.slice(startIdx, endIdx);
    const chunkText3 = chunkWords.join(" ");
    chunks.push({
      text: chunkText3,
      startIndex: startIdx,
      endIndex: endIdx,
      tokenEstimate: Math.ceil(chunkText3.length / 4)
    });
    startIdx += Math.max(1, chunkSize - overlap);
    if (endIdx >= words.length) {
      break;
    }
  }
  return chunks;
}
async function chunkTextsParallel2(texts, chunkSize, overlap) {
  if (isNativeAvailable()) {
    const nativeChunks = await chunkTextsParallel(texts, chunkSize, overlap);
    return nativeChunks.map(
      (fileChunks) => fileChunks.map((chunk) => ({
        text: chunk.text,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
        tokenEstimate: chunk.tokenEstimate
      }))
    );
  }
  return texts.map((text) => chunkText2(text, chunkSize, overlap));
}
async function chunkTextsBatch2(texts, chunkSize, overlap) {
  if (isNativeAvailable() && chunkTextsBatch) {
    const nativeResults = await chunkTextsBatch(texts, chunkSize, overlap);
    const grouped = /* @__PURE__ */ new Map();
    for (const result of nativeResults) {
      let fileChunks = grouped.get(result.fileIndex);
      if (!fileChunks) {
        fileChunks = [];
        grouped.set(result.fileIndex, fileChunks);
      }
      fileChunks.push({
        text: result.text,
        startIndex: result.startIndex,
        endIndex: result.endIndex,
        tokenEstimate: result.tokenEstimate
      });
    }
    return grouped;
  }
  const parallelResults = await chunkTextsParallel2(texts, chunkSize, overlap);
  return new Map(parallelResults.map((chunks, idx) => [idx, chunks]));
}
var init_textChunker = __esm({
  "src/utils/textChunker.ts"() {
    "use strict";
    init_native();
  }
});

// src/utils/fileHash.ts
async function calculateFileHash(filePath) {
  return new Promise((resolve3, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs7.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve3(hash.digest("hex")));
    stream.on("error", reject);
  });
}
var fs7, crypto;
var init_fileHash = __esm({
  "src/utils/fileHash.ts"() {
    "use strict";
    fs7 = __toESM(require("fs"));
    crypto = __toESM(require("crypto"));
  }
});

// src/utils/failedFileRegistry.ts
var fs8, path4, FailedFileRegistry;
var init_failedFileRegistry = __esm({
  "src/utils/failedFileRegistry.ts"() {
    "use strict";
    fs8 = __toESM(require("fs/promises"));
    path4 = __toESM(require("path"));
    FailedFileRegistry = class {
      constructor(registryPath) {
        this.registryPath = registryPath;
        this.loaded = false;
        this.entries = {};
        this.queue = Promise.resolve();
      }
      async load() {
        if (this.loaded) {
          return;
        }
        try {
          const data = await fs8.readFile(this.registryPath, "utf-8");
          this.entries = JSON.parse(data) ?? {};
        } catch {
          this.entries = {};
        }
        this.loaded = true;
      }
      async persist() {
        await fs8.mkdir(path4.dirname(this.registryPath), { recursive: true });
        await fs8.writeFile(this.registryPath, JSON.stringify(this.entries, null, 2), "utf-8");
      }
      runExclusive(operation) {
        const result = this.queue.then(operation);
        this.queue = result.then(
          () => {
          },
          () => {
          }
        );
        return result;
      }
      async recordFailure(filePath, fileHash, reason) {
        return this.runExclusive(async () => {
          await this.load();
          this.entries[filePath] = {
            fileHash,
            reason,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          };
          await this.persist();
        });
      }
      async clearFailure(filePath) {
        return this.runExclusive(async () => {
          await this.load();
          if (this.entries[filePath]) {
            delete this.entries[filePath];
            await this.persist();
          }
        });
      }
      async getFailureReason(filePath, fileHash) {
        await this.load();
        const entry = this.entries[filePath];
        if (!entry) {
          return void 0;
        }
        return entry.fileHash === fileHash ? entry.reason : void 0;
      }
    };
  }
});

// src/ingestion/indexManager.ts
function coerceEmbeddingVector(raw) {
  if (Array.isArray(raw)) {
    return raw.map(assertFiniteNumber);
  }
  if (typeof raw === "number") {
    return [assertFiniteNumber(raw)];
  }
  if (raw && typeof raw === "object") {
    if (ArrayBuffer.isView(raw)) {
      return Array.from(raw).map(assertFiniteNumber);
    }
    const candidate = raw.embedding ?? raw.vector ?? raw.data ?? (typeof raw.toArray === "function" ? raw.toArray() : void 0) ?? (typeof raw.toJSON === "function" ? raw.toJSON() : void 0);
    if (candidate !== void 0) {
      return coerceEmbeddingVector(candidate);
    }
  }
  throw new Error("Embedding provider returned a non-numeric vector");
}
function assertFiniteNumber(value) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("Embedding vector contains a non-finite value");
  }
  return num;
}
var import_p_queue, fs9, path5, IndexManager;
var init_indexManager = __esm({
  "src/ingestion/indexManager.ts"() {
    "use strict";
    import_p_queue = __toESM(require("p-queue"));
    fs9 = __toESM(require("fs"));
    path5 = __toESM(require("path"));
    init_fileScanner();
    init_documentParser();
    init_textChunker();
    init_fileHash();
    init_failedFileRegistry();
    IndexManager = class {
      constructor(options) {
        this.failureReasonCounts = {};
        this.options = options;
        this.failedFileRegistry = new FailedFileRegistry(
          path5.join(options.vectorStoreDir, ".big-rag-failures.json")
        );
      }
      /**
       * Start the indexing process
       * Uses two-phase processing for maximum performance:
       * Phase 1: Parse all documents and collect texts
       * Phase 2: Batch chunk all texts in single native call (avoids FFI overhead)
       * Phase 3: Batch embed and index all chunks
       */
      async index() {
        const { documentsDir, vectorStore: vectorStore2, chunkSize, chunkOverlap, onProgress } = this.options;
        try {
          const fileInventory = await vectorStore2.getFileHashInventory();
          if (onProgress) {
            onProgress({
              totalFiles: 0,
              processedFiles: 0,
              currentFile: "",
              status: "scanning"
            });
          }
          const files = await scanDirectory2(documentsDir, (scanned, found) => {
            if (onProgress) {
              onProgress({
                totalFiles: found,
                processedFiles: 0,
                currentFile: `Scanned ${scanned} files...`,
                status: "scanning"
              });
            }
          });
          this.options.abortSignal?.throwIfAborted();
          console.log(`Found ${files.length} files to process`);
          if (onProgress) {
            onProgress({
              totalFiles: files.length,
              processedFiles: 0,
              currentFile: "Parsing documents...",
              status: "indexing"
            });
          }
          const parsedDocs = [];
          let parseCount = 0;
          const parseQueue = new import_p_queue.default({ concurrency: this.options.maxConcurrent });
          const parseTasks = files.map(
            (file) => parseQueue.add(async () => {
              this.options.abortSignal?.throwIfAborted();
              try {
                const fileHash = await calculateFileHash(file.path);
                const existingHashes = fileInventory.get(file.path);
                const hasSameHash = existingHashes?.has(fileHash) ?? false;
                if (this.options.autoReindex && hasSameHash) {
                  parsedDocs.push({ file, fileHash, text: "", outcome: "skipped" });
                  return;
                }
                if (this.options.autoReindex) {
                  const previousFailure = await this.failedFileRegistry.getFailureReason(file.path, fileHash);
                  if (previousFailure) {
                    parsedDocs.push({ file, fileHash, text: "", outcome: "skipped" });
                    return;
                  }
                }
                const parsedResult = await parseDocument(file.path, this.options.enableOCR, this.options.client);
                if (!parsedResult.success) {
                  parsedDocs.push({
                    file,
                    fileHash,
                    text: "",
                    outcome: "failed",
                    failureReason: parsedResult.reason,
                    failureDetails: parsedResult.details
                  });
                  return;
                }
                parsedDocs.push({
                  file,
                  fileHash,
                  text: parsedResult.document.text,
                  outcome: hasSameHash ? "updated" : "new"
                });
              } catch (error) {
                parsedDocs.push({
                  file,
                  fileHash: "",
                  text: "",
                  outcome: "failed",
                  failureReason: "parser.unexpected-error",
                  failureDetails: error instanceof Error ? error.message : String(error)
                });
              }
              parseCount++;
              if (onProgress) {
                onProgress({
                  totalFiles: files.length,
                  processedFiles: parseCount,
                  currentFile: `Parsed ${parseCount}/${files.length}...`,
                  status: "indexing"
                });
              }
            })
          );
          await Promise.all(parseTasks);
          for (const doc of parsedDocs) {
            if (doc.outcome === "failed" && doc.failureReason) {
              this.recordFailure(doc.failureReason, doc.failureDetails, doc.file);
              if (doc.fileHash) {
                await this.failedFileRegistry.recordFailure(doc.file.path, doc.fileHash, doc.failureReason);
              }
            }
          }
          const textsToChunk = parsedDocs.filter((d) => d.outcome !== "skipped" && d.outcome !== "failed").map((d) => d.text);
          const validDocs = parsedDocs.filter((d) => d.outcome !== "skipped" && d.outcome !== "failed");
          let chunkedTexts = /* @__PURE__ */ new Map();
          if (textsToChunk.length > 0) {
            console.log(`Batch chunking ${textsToChunk.length} documents...`);
            chunkedTexts = await chunkTextsBatch2(textsToChunk, chunkSize, chunkOverlap);
          }
          let successCount = 0;
          let failCount = 0;
          let skippedCount = parsedDocs.filter((d) => d.outcome === "skipped").length;
          let updatedCount = 0;
          let newCount = 0;
          const allChunks = [];
          for (let i = 0; i < validDocs.length; i++) {
            const doc = validDocs[i];
            const chunks = chunkedTexts.get(i) || [];
            if (chunks.length === 0) {
              console.log(`No chunks created from ${doc.file.name}`);
              this.recordFailure("index.chunk-empty", "chunkTextsBatch produced 0 chunks", doc.file);
              if (doc.fileHash) {
                await this.failedFileRegistry.recordFailure(doc.file.path, doc.fileHash, "index.chunk-empty");
              }
              failCount++;
              continue;
            }
            for (let j = 0; j < chunks.length; j++) {
              allChunks.push({
                docIndex: i,
                chunkIndex: j,
                text: chunks[j].text,
                doc,
                chunk: chunks[j]
              });
            }
          }
          console.log(`Embedding ${allChunks.length} chunks from ${validDocs.length} files...`);
          const EMBEDDING_BATCH_SIZE = 200;
          if (allChunks.length > 0) {
            try {
              const allTexts = allChunks.map((c) => c.text);
              const allEmbeddings = [];
              for (let i = 0; i < allTexts.length; i += EMBEDDING_BATCH_SIZE) {
                const batch = allTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
                const result = await this.options.embeddingModel.embed(batch);
                allEmbeddings.push(...result);
              }
              const chunksByFile = /* @__PURE__ */ new Map();
              for (let i = 0; i < allEmbeddings.length; i++) {
                const chunkInfo = allChunks[i];
                const embedding = coerceEmbeddingVector(allEmbeddings[i].embedding);
                let fileChunks = chunksByFile.get(chunkInfo.docIndex);
                if (!fileChunks) {
                  fileChunks = [];
                  chunksByFile.set(chunkInfo.docIndex, fileChunks);
                }
                fileChunks.push({
                  id: `${chunkInfo.doc.fileHash}-${chunkInfo.chunkIndex}`,
                  text: chunkInfo.text,
                  vector: embedding,
                  filePath: chunkInfo.doc.file.path,
                  fileName: chunkInfo.doc.file.name,
                  fileHash: chunkInfo.doc.fileHash,
                  chunkIndex: chunkInfo.chunkIndex,
                  metadata: {
                    extension: chunkInfo.doc.file.extension,
                    size: chunkInfo.doc.file.size,
                    mtime: chunkInfo.doc.file.mtime.toISOString(),
                    startIndex: chunkInfo.chunk.startIndex,
                    endIndex: chunkInfo.chunk.endIndex
                  }
                });
              }
              for (const [docIndex, documentChunks] of chunksByFile.entries()) {
                const doc = validDocs[docIndex];
                await vectorStore2.addChunks(documentChunks);
                console.log(`Indexed ${documentChunks.length} chunks from ${doc.file.name}`);
                const existingHashes = fileInventory.get(doc.file.path);
                if (!existingHashes) {
                  fileInventory.set(doc.file.path, /* @__PURE__ */ new Set([doc.fileHash]));
                } else {
                  existingHashes.add(doc.fileHash);
                }
                await this.failedFileRegistry.clearFailure(doc.file.path);
                successCount++;
                if (doc.outcome === "new") newCount++;
                else updatedCount++;
              }
            } catch (error) {
              console.error(`Error embedding all chunks:`, error);
              failCount = validDocs.length;
              for (const doc of validDocs) {
                this.recordFailure(
                  "index.embedding-error",
                  error instanceof Error ? error.message : String(error),
                  doc.file
                );
                if (doc.fileHash) {
                  await this.failedFileRegistry.recordFailure(doc.file.path, doc.fileHash, "index.embedding-error");
                }
              }
            }
          }
          if (onProgress) {
            onProgress({
              totalFiles: files.length,
              processedFiles: files.length,
              currentFile: "",
              status: "complete",
              successfulFiles: successCount,
              failedFiles: failCount,
              skippedFiles: skippedCount
            });
          }
          this.logFailureSummary();
          await this.writeFailureReport({
            totalFiles: files.length,
            successfulFiles: successCount,
            failedFiles: failCount,
            skippedFiles: skippedCount,
            updatedFiles: updatedCount,
            newFiles: newCount
          });
          console.log(
            `Indexing complete: ${successCount}/${files.length} files successfully indexed (${failCount} failed, skipped=${skippedCount}, updated=${updatedCount}, new=${newCount})`
          );
          return {
            totalFiles: files.length,
            successfulFiles: successCount,
            failedFiles: failCount,
            skippedFiles: skippedCount,
            updatedFiles: updatedCount,
            newFiles: newCount
          };
        } catch (error) {
          console.error("Error during indexing:", error);
          if (onProgress) {
            onProgress({
              totalFiles: 0,
              processedFiles: 0,
              currentFile: "",
              status: "error",
              error: error instanceof Error ? error.message : String(error)
            });
          }
          throw error;
        }
      }
      recordFailure(reason, details, file) {
        const current = this.failureReasonCounts[reason] ?? 0;
        this.failureReasonCounts[reason] = current + 1;
        const detailSuffix = details ? ` details=${details}` : "";
        console.warn(
          `[BigRAG] Failed to parse ${file.name} (reason=${reason}, count=${this.failureReasonCounts[reason]})${detailSuffix}`
        );
      }
      logFailureSummary() {
        const entries = Object.entries(this.failureReasonCounts);
        if (entries.length === 0) {
          console.log("[BigRAG] No parsing failures recorded.");
          return;
        }
        console.log("[BigRAG] Failure reason summary:");
        for (const [reason, count] of entries) {
          console.log(`  - ${reason}: ${count}`);
        }
      }
      async writeFailureReport(summary) {
        const reportPath = this.options.failureReportPath;
        if (!reportPath) {
          return;
        }
        const payload = {
          ...summary,
          documentsDir: this.options.documentsDir,
          failureReasons: this.failureReasonCounts,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        try {
          await fs9.promises.mkdir(path5.dirname(reportPath), { recursive: true });
          await fs9.promises.writeFile(reportPath, JSON.stringify(payload, null, 2), "utf-8");
          console.log(`[BigRAG] Wrote failure report to ${reportPath}`);
        } catch (error) {
          console.error(`[BigRAG] Failed to write failure report to ${reportPath}:`, error);
        }
      }
    };
  }
});

// src/ingestion/runIndexing.ts
async function runIndexingJob({
  client: client2,
  abortSignal,
  documentsDir,
  vectorStoreDir,
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  autoReindex,
  parseDelayMs,
  forceReindex = false,
  vectorStore: existingVectorStore,
  onProgress
}) {
  const vectorStore2 = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === void 0;
  if (ownsVectorStore) {
    await vectorStore2.initialize();
  }
  const embeddingModel = await client2.embedding.model(
    "nomic-ai/nomic-embed-text-v1.5-GGUF",
    { signal: abortSignal }
  );
  const indexManager = new IndexManager({
    documentsDir,
    vectorStore: vectorStore2,
    vectorStoreDir,
    embeddingModel,
    client: client2,
    chunkSize,
    chunkOverlap,
    maxConcurrent,
    enableOCR,
    autoReindex: forceReindex ? false : autoReindex,
    parseDelayMs,
    abortSignal,
    onProgress
  });
  const indexingResult = await indexManager.index();
  const stats = await vectorStore2.getStats();
  if (ownsVectorStore) {
    await vectorStore2.close();
  }
  const summary = `Indexing completed!

\u2022 Successfully indexed: ${indexingResult.successfulFiles}/${indexingResult.totalFiles}
\u2022 Failed: ${indexingResult.failedFiles}
\u2022 Skipped (unchanged): ${indexingResult.skippedFiles}
\u2022 Updated existing files: ${indexingResult.updatedFiles}
\u2022 New files added: ${indexingResult.newFiles}
\u2022 Chunks in store: ${stats.totalChunks}
\u2022 Unique files in store: ${stats.uniqueFiles}`;
  return {
    summary,
    stats,
    indexingResult
  };
}
var init_runIndexing = __esm({
  "src/ingestion/runIndexing.ts"() {
    "use strict";
    init_indexManager();
    init_vectorStore();
  }
});

// src/promptPreprocessor.ts
function checkAbort(signal) {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }
}
function isAbortError(error) {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  if (error instanceof Error && error.message === "Aborted") return true;
  return false;
}
function summarizeText(text, maxLines = 3, maxChars = 400) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const clippedLines = lines.slice(0, maxLines);
  let clipped = clippedLines.join("\n");
  if (clipped.length > maxChars) {
    clipped = clipped.slice(0, maxChars);
  }
  const needsEllipsis = lines.length > maxLines || text.length > clipped.length || clipped.length === maxChars && text.length > maxChars;
  return needsEllipsis ? `${clipped.trimEnd()}\u2026` : clipped;
}
function normalizePromptTemplate(template) {
  const hasContent = typeof template === "string" && template.trim().length > 0;
  let normalized = hasContent ? template : DEFAULT_PROMPT_TEMPLATE;
  if (!normalized.includes(RAG_CONTEXT_MACRO)) {
    console.warn(
      `[BigRAG] Prompt template missing ${RAG_CONTEXT_MACRO}. Prepending RAG context block.`
    );
    normalized = `${RAG_CONTEXT_MACRO}

${normalized}`;
  }
  if (!normalized.includes(USER_QUERY_MACRO)) {
    console.warn(
      `[BigRAG] Prompt template missing ${USER_QUERY_MACRO}. Appending user query block.`
    );
    normalized = `${normalized}

User Query:

${USER_QUERY_MACRO}`;
  }
  return normalized;
}
function fillPromptTemplate(template, replacements) {
  return Object.entries(replacements).reduce(
    (acc, [token, value]) => acc.split(token).join(value),
    template
  );
}
async function warnIfContextOverflow(ctl, finalPrompt) {
  try {
    const tokenSource = await ctl.tokenSource();
    if (!tokenSource || !("applyPromptTemplate" in tokenSource) || typeof tokenSource.applyPromptTemplate !== "function" || !("countTokens" in tokenSource) || typeof tokenSource.countTokens !== "function" || !("getContextLength" in tokenSource) || typeof tokenSource.getContextLength !== "function") {
      console.warn("[BigRAG] Token source does not expose prompt utilities; skipping context check.");
      return;
    }
    const [contextLength, history] = await Promise.all([
      tokenSource.getContextLength(),
      ctl.pullHistory()
    ]);
    const historyWithLatestMessage = history.withAppended({
      role: "user",
      content: finalPrompt
    });
    const formattedPrompt = await tokenSource.applyPromptTemplate(historyWithLatestMessage);
    const promptTokens = await tokenSource.countTokens(formattedPrompt);
    if (promptTokens > contextLength) {
      const warningSummary = `\u26A0\uFE0F Prompt needs ${promptTokens.toLocaleString()} tokens but model max is ${contextLength.toLocaleString()}.`;
      console.warn("[BigRAG]", warningSummary);
      ctl.createStatus({
        status: "error",
        text: `${warningSummary} Reduce retrieved passages or increase the model's context length.`
      });
      try {
        await ctl.client.system.notify({
          title: "Context window exceeded",
          description: `${warningSummary} Prompt may be truncated or rejected.`,
          noAutoDismiss: true
        });
      } catch (notifyError) {
        console.warn("[BigRAG] Unable to send context overflow notification:", notifyError);
      }
    }
  } catch (error) {
    console.warn("[BigRAG] Failed to evaluate context usage:", error);
  }
}
async function preprocess(ctl, userMessage) {
  const userPrompt = userMessage.getText();
  const pluginConfig = ctl.getPluginConfig(configSchematics);
  const documentsDir = pluginConfig.get("documentsDirectory");
  const vectorStoreDir = pluginConfig.get("vectorStoreDirectory");
  const retrievalLimit = pluginConfig.get("retrievalLimit");
  const retrievalThreshold = pluginConfig.get("retrievalAffinityThreshold");
  const chunkSize = pluginConfig.get("chunkSize");
  const chunkOverlap = pluginConfig.get("chunkOverlap");
  const maxConcurrent = pluginConfig.get("maxConcurrentFiles");
  const enableOCR = pluginConfig.get("enableOCR");
  const skipPreviouslyIndexed = pluginConfig.get("manualReindex.skipPreviouslyIndexed");
  const parseDelayMs = pluginConfig.get("parseDelayMs") ?? 0;
  const reindexRequested = pluginConfig.get("manualReindex.trigger");
  if (!documentsDir || documentsDir === "") {
    console.warn("[BigRAG] Documents directory not configured. Please set it in plugin settings.");
    return userMessage;
  }
  if (!vectorStoreDir || vectorStoreDir === "") {
    console.warn("[BigRAG] Vector store directory not configured. Please set it in plugin settings.");
    return userMessage;
  }
  try {
    if (!sanityChecksPassed) {
      const checkStatus = ctl.createStatus({
        status: "loading",
        text: "Performing sanity checks..."
      });
      const sanityResult = await performSanityChecks(documentsDir, vectorStoreDir);
      for (const warning of sanityResult.warnings) {
        console.warn("[BigRAG]", warning);
      }
      if (!sanityResult.passed) {
        for (const error of sanityResult.errors) {
          console.error("[BigRAG]", error);
        }
        const failureReason = sanityResult.errors[0] ?? sanityResult.warnings[0] ?? "Unknown reason. Please review plugin settings.";
        checkStatus.setState({
          status: "canceled",
          text: `Sanity checks failed: ${failureReason}`
        });
        return userMessage;
      }
      checkStatus.setState({
        status: "done",
        text: "Sanity checks passed"
      });
      sanityChecksPassed = true;
    }
    checkAbort(ctl.abortSignal);
    if (!vectorStore || lastIndexedDir !== vectorStoreDir) {
      const status = ctl.createStatus({
        status: "loading",
        text: "Initializing vector store..."
      });
      vectorStore = new VectorStore(vectorStoreDir);
      await vectorStore.initialize();
      console.info(
        `[BigRAG] Vector store ready (path=${vectorStoreDir}). Waiting for queries...`
      );
      lastIndexedDir = vectorStoreDir;
      status.setState({
        status: "done",
        text: "Vector store initialized"
      });
    }
    checkAbort(ctl.abortSignal);
    await maybeHandleConfigTriggeredReindex({
      ctl,
      documentsDir,
      vectorStoreDir,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      parseDelayMs,
      reindexRequested,
      skipPreviouslyIndexed: pluginConfig.get("manualReindex.skipPreviouslyIndexed")
    });
    checkAbort(ctl.abortSignal);
    const stats = await vectorStore.getStats();
    console.debug(`[BigRAG] Vector store stats before auto-index check: totalChunks=${stats.totalChunks}, uniqueFiles=${stats.uniqueFiles}`);
    if (stats.totalChunks === 0) {
      if (!tryStartIndexing("auto-trigger")) {
        console.warn("[BigRAG] Indexing already running, skipping automatic indexing.");
      } else {
        const indexStatus = ctl.createStatus({
          status: "loading",
          text: "Starting initial indexing..."
        });
        try {
          const { indexingResult } = await runIndexingJob({
            client: ctl.client,
            abortSignal: ctl.abortSignal,
            documentsDir,
            vectorStoreDir,
            chunkSize,
            chunkOverlap,
            maxConcurrent,
            enableOCR,
            autoReindex: false,
            parseDelayMs,
            vectorStore,
            forceReindex: true,
            onProgress: (progress) => {
              if (progress.status === "scanning") {
                indexStatus.setState({
                  status: "loading",
                  text: `Scanning: ${progress.currentFile}`
                });
              } else if (progress.status === "indexing") {
                const success = progress.successfulFiles ?? 0;
                const failed = progress.failedFiles ?? 0;
                const skipped = progress.skippedFiles ?? 0;
                indexStatus.setState({
                  status: "loading",
                  text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (success=${success}, failed=${failed}, skipped=${skipped}) (${progress.currentFile})`
                });
              } else if (progress.status === "complete") {
                indexStatus.setState({
                  status: "done",
                  text: `Indexing complete: ${progress.processedFiles} files processed`
                });
              } else if (progress.status === "error") {
                indexStatus.setState({
                  status: "canceled",
                  text: `Indexing error: ${progress.error}`
                });
              }
            }
          });
          console.log(`[BigRAG] Indexing complete: ${indexingResult.successfulFiles}/${indexingResult.totalFiles} files successfully indexed (${indexingResult.failedFiles} failed)`);
        } catch (error) {
          indexStatus.setState({
            status: "canceled",
            text: `Indexing failed: ${error instanceof Error ? error.message : String(error)}`
          });
          console.error("[BigRAG] Indexing failed:", error);
        } finally {
          finishIndexing();
        }
      }
    }
    checkAbort(ctl.abortSignal);
    const toggleStatusText = `Manual Reindex Trigger: ${reindexRequested ? "ON" : "OFF"} | Skip Previously Indexed: ${skipPreviouslyIndexed ? "ON" : "OFF"}`;
    console.info(`[BigRAG] ${toggleStatusText}`);
    ctl.createStatus({
      status: "done",
      text: toggleStatusText
    });
    const retrievalStatus = ctl.createStatus({
      status: "loading",
      text: "Loading embedding model for retrieval..."
    });
    const embeddingModel = await ctl.client.embedding.model(
      "nomic-ai/nomic-embed-text-v1.5-GGUF",
      { signal: ctl.abortSignal }
    );
    checkAbort(ctl.abortSignal);
    retrievalStatus.setState({
      status: "loading",
      text: "Searching for relevant content..."
    });
    const queryEmbeddingResult = await embeddingModel.embed(userPrompt);
    checkAbort(ctl.abortSignal);
    const queryEmbedding = queryEmbeddingResult.embedding;
    const queryPreview = userPrompt.length > 160 ? `${userPrompt.slice(0, 160)}...` : userPrompt;
    console.info(
      `[BigRAG] Executing vector search for "${queryPreview}" (limit=${retrievalLimit}, threshold=${retrievalThreshold})`
    );
    const results = await vectorStore.search(
      queryEmbedding,
      retrievalLimit,
      retrievalThreshold
    );
    checkAbort(ctl.abortSignal);
    if (results.length > 0) {
      const topHit = results[0];
      console.info(
        `[BigRAG] Vector search returned ${results.length} results. Top hit: file=${topHit.fileName} score=${topHit.score.toFixed(3)}`
      );
      const docSummaries = results.map(
        (result, idx) => `#${idx + 1} file=${path6.basename(result.filePath)} shard=${result.shardName} score=${result.score.toFixed(3)}`
      ).join("\n");
      console.info(`[BigRAG] Relevant documents:
${docSummaries}`);
    } else {
      console.warn("[BigRAG] Vector search returned 0 results.");
    }
    if (results.length === 0) {
      retrievalStatus.setState({
        status: "canceled",
        text: "No relevant content found in indexed documents"
      });
      const noteAboutNoResults = `Important: No relevant content was found in the indexed documents for the user query. In less than one sentence, inform the user of this. Then respond to the query to the best of your ability.`;
      return noteAboutNoResults + `

User Query:

${userPrompt}`;
    }
    retrievalStatus.setState({
      status: "done",
      text: `Retrieved ${results.length} relevant passages`
    });
    ctl.debug("Retrieval results:", results);
    let ragContextFull = "";
    let ragContextPreview = "";
    const prefix = "The following passages were found in your indexed documents:\n\n";
    ragContextFull += prefix;
    ragContextPreview += prefix;
    let citationNumber = 1;
    for (const result of results) {
      const fileName = path6.basename(result.filePath);
      const citationLabel = `Citation ${citationNumber} (from ${fileName}, score: ${result.score.toFixed(3)}): `;
      ragContextFull += `
${citationLabel}"${result.text}"

`;
      ragContextPreview += `
${citationLabel}"${summarizeText(result.text)}"

`;
      citationNumber++;
    }
    const promptTemplate = normalizePromptTemplate(pluginConfig.get("promptTemplate"));
    const finalPrompt = fillPromptTemplate(promptTemplate, {
      [RAG_CONTEXT_MACRO]: ragContextFull.trimEnd(),
      [USER_QUERY_MACRO]: userPrompt
    });
    const finalPromptPreview = fillPromptTemplate(promptTemplate, {
      [RAG_CONTEXT_MACRO]: ragContextPreview.trimEnd(),
      [USER_QUERY_MACRO]: userPrompt
    });
    ctl.debug("Processed content (preview):", finalPromptPreview);
    const passagesLogEntries = results.map((result, idx) => {
      const fileName = path6.basename(result.filePath);
      return `#${idx + 1} file=${fileName} shard=${result.shardName} score=${result.score.toFixed(3)}
${summarizeText(result.text)}`;
    });
    const passagesLog = passagesLogEntries.join("\n\n");
    console.info(`[BigRAG] RAG passages (${results.length}) preview:
${passagesLog}`);
    ctl.createStatus({
      status: "done",
      text: `RAG passages (${results.length}):`
    });
    for (const entry of passagesLogEntries) {
      ctl.createStatus({
        status: "done",
        text: entry
      });
    }
    console.info(`[BigRAG] Final prompt sent to model (preview):
${finalPromptPreview}`);
    ctl.createStatus({
      status: "done",
      text: `Final prompt sent to model (preview):
${finalPromptPreview}`
    });
    await warnIfContextOverflow(ctl, finalPrompt);
    return finalPrompt;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    console.error("[PromptPreprocessor] Preprocessing failed.", error);
    return userMessage;
  }
}
async function maybeHandleConfigTriggeredReindex({
  ctl,
  documentsDir,
  vectorStoreDir,
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  parseDelayMs,
  reindexRequested,
  skipPreviouslyIndexed
}) {
  if (!reindexRequested) {
    return;
  }
  const reminderText = `Manual Reindex Trigger is ON. Skip Previously Indexed Files is currently ${skipPreviouslyIndexed ? "ON" : "OFF"}. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files.`;
  console.info(`[BigRAG] ${reminderText}`);
  ctl.createStatus({
    status: "done",
    text: reminderText
  });
  if (!tryStartIndexing("config-trigger")) {
    ctl.createStatus({
      status: "canceled",
      text: "Manual reindex already running. Please wait for it to finish."
    });
    return;
  }
  const status = ctl.createStatus({
    status: "loading",
    text: "Manual reindex requested from config..."
  });
  try {
    const { indexingResult } = await runIndexingJob({
      client: ctl.client,
      abortSignal: ctl.abortSignal,
      documentsDir,
      vectorStoreDir,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      autoReindex: skipPreviouslyIndexed,
      parseDelayMs,
      forceReindex: !skipPreviouslyIndexed,
      vectorStore: vectorStore ?? void 0,
      onProgress: (progress) => {
        if (progress.status === "scanning") {
          status.setState({
            status: "loading",
            text: `Scanning: ${progress.currentFile}`
          });
        } else if (progress.status === "indexing") {
          const success = progress.successfulFiles ?? 0;
          const failed = progress.failedFiles ?? 0;
          const skipped = progress.skippedFiles ?? 0;
          status.setState({
            status: "loading",
            text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (success=${success}, failed=${failed}, skipped=${skipped}) (${progress.currentFile})`
          });
        } else if (progress.status === "complete") {
          status.setState({
            status: "done",
            text: `Indexing complete: ${progress.processedFiles} files processed`
          });
        } else if (progress.status === "error") {
          status.setState({
            status: "canceled",
            text: `Indexing error: ${progress.error}`
          });
        }
      }
    });
    status.setState({
      status: "done",
      text: "Manual reindex complete!"
    });
    const summaryLines = [
      `Processed: ${indexingResult.successfulFiles}/${indexingResult.totalFiles}`,
      `Failed: ${indexingResult.failedFiles}`,
      `Skipped (unchanged): ${indexingResult.skippedFiles}`,
      `Updated existing files: ${indexingResult.updatedFiles}`,
      `New files added: ${indexingResult.newFiles}`
    ];
    for (const line of summaryLines) {
      ctl.createStatus({
        status: "done",
        text: line
      });
    }
    if (indexingResult.totalFiles > 0 && indexingResult.skippedFiles === indexingResult.totalFiles) {
      ctl.createStatus({
        status: "done",
        text: "All files were already up to date (skipped)."
      });
    }
    console.log(
      `[BigRAG] Manual reindex summary:
  ${summaryLines.join("\n  ")}`
    );
    await notifyManualResetNeeded(ctl);
  } catch (error) {
    status.setState({
      status: "error",
      text: `Manual reindex failed: ${error instanceof Error ? error.message : String(error)}`
    });
    console.error("[BigRAG] Manual reindex failed:", error);
  } finally {
    finishIndexing();
  }
}
async function notifyManualResetNeeded(ctl) {
  try {
    await ctl.client.system.notify({
      title: "Manual reindex completed",
      description: "Manual Reindex Trigger is ON. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files."
    });
  } catch (error) {
    console.warn("[BigRAG] Unable to send notification about manual reindex reset:", error);
  }
}
var path6, vectorStore, lastIndexedDir, sanityChecksPassed, RAG_CONTEXT_MACRO, USER_QUERY_MACRO;
var init_promptPreprocessor = __esm({
  "src/promptPreprocessor.ts"() {
    "use strict";
    init_config();
    init_vectorStore();
    init_sanityChecks();
    init_indexingLock();
    path6 = __toESM(require("path"));
    init_runIndexing();
    vectorStore = null;
    lastIndexedDir = "";
    sanityChecksPassed = false;
    RAG_CONTEXT_MACRO = "{{rag_context}}";
    USER_QUERY_MACRO = "{{user_query}}";
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  main: () => main
});
async function main(context) {
  context.withConfigSchematics(configSchematics);
  context.withPromptPreprocessor(preprocess);
  console.log("[BigRAG] Plugin initialized successfully");
}
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_config();
    init_promptPreprocessor();
  }
});

// .lmstudio/entry.ts
var import_sdk2 = require("@lmstudio/sdk");
var clientIdentifier = process.env.LMS_PLUGIN_CLIENT_IDENTIFIER;
var clientPasskey = process.env.LMS_PLUGIN_CLIENT_PASSKEY;
var baseUrl = process.env.LMS_PLUGIN_BASE_URL;
var client = new import_sdk2.LMStudioClient({
  clientIdentifier,
  clientPasskey,
  baseUrl
});
globalThis.__LMS_PLUGIN_CONTEXT = true;
var predictionLoopHandlerSet = false;
var promptPreprocessorSet = false;
var configSchematicsSet = false;
var globalConfigSchematicsSet = false;
var toolsProviderSet = false;
var generatorSet = false;
var selfRegistrationHost = client.plugins.getSelfRegistrationHost();
var pluginContext = {
  withPredictionLoopHandler: (generate) => {
    if (predictionLoopHandlerSet) {
      throw new Error("PredictionLoopHandler already registered");
    }
    if (toolsProviderSet) {
      throw new Error("PredictionLoopHandler cannot be used with a tools provider");
    }
    predictionLoopHandlerSet = true;
    selfRegistrationHost.setPredictionLoopHandler(generate);
    return pluginContext;
  },
  withPromptPreprocessor: (preprocess2) => {
    if (promptPreprocessorSet) {
      throw new Error("PromptPreprocessor already registered");
    }
    promptPreprocessorSet = true;
    selfRegistrationHost.setPromptPreprocessor(preprocess2);
    return pluginContext;
  },
  withConfigSchematics: (configSchematics2) => {
    if (configSchematicsSet) {
      throw new Error("Config schematics already registered");
    }
    configSchematicsSet = true;
    selfRegistrationHost.setConfigSchematics(configSchematics2);
    return pluginContext;
  },
  withGlobalConfigSchematics: (globalConfigSchematics) => {
    if (globalConfigSchematicsSet) {
      throw new Error("Global config schematics already registered");
    }
    globalConfigSchematicsSet = true;
    selfRegistrationHost.setGlobalConfigSchematics(globalConfigSchematics);
    return pluginContext;
  },
  withToolsProvider: (toolsProvider) => {
    if (toolsProviderSet) {
      throw new Error("Tools provider already registered");
    }
    if (predictionLoopHandlerSet) {
      throw new Error("Tools provider cannot be used with a predictionLoopHandler");
    }
    toolsProviderSet = true;
    selfRegistrationHost.setToolsProvider(toolsProvider);
    return pluginContext;
  },
  withGenerator: (generator) => {
    if (generatorSet) {
      throw new Error("Generator already registered");
    }
    generatorSet = true;
    selfRegistrationHost.setGenerator(generator);
    return pluginContext;
  }
};
Promise.resolve().then(() => (init_src(), src_exports)).then(async (module2) => {
  return await module2.main(pluginContext);
}).then(() => {
  selfRegistrationHost.initCompleted();
}).catch((error) => {
  console.error("Failed to execute the main function of the plugin.");
  console.error(error);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy9uYXRpdmUvaW5kZXgudHMiLCAiLi4vc3JjL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnMudHMiLCAiLi4vc3JjL2luZ2VzdGlvbi9maWxlU2Nhbm5lci50cyIsICIuLi9zcmMvcGFyc2Vycy9odG1sUGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL3BkZlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9lcHViUGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2ltYWdlUGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL3RleHRQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZG9jdW1lbnRQYXJzZXIudHMiLCAiLi4vc3JjL3V0aWxzL3RleHRDaHVua2VyLnRzIiwgIi4uL3NyYy91dGlscy9maWxlSGFzaC50cyIsICIuLi9zcmMvdXRpbHMvZmFpbGVkRmlsZVJlZ2lzdHJ5LnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vaW5kZXhNYW5hZ2VyLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vcnVuSW5kZXhpbmcudHMiLCAiLi4vc3JjL3Byb21wdFByZXByb2Nlc3Nvci50cyIsICIuLi9zcmMvaW5kZXgudHMiLCAiZW50cnkudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9QUk9NUFRfVEVNUExBVEUgPSBge3tyYWdfY29udGV4dH19XG5cblVzZSB0aGUgY2l0YXRpb25zIGFib3ZlIHRvIHJlc3BvbmQgdG8gdGhlIHVzZXIgcXVlcnksIG9ubHkgaWYgdGhleSBhcmUgcmVsZXZhbnQuIE90aGVyd2lzZSwgcmVzcG9uZCB0byB0aGUgYmVzdCBvZiB5b3VyIGFiaWxpdHkgd2l0aG91dCB0aGVtLlxuXG5Vc2VyIFF1ZXJ5OlxuXG57e3VzZXJfcXVlcnl9fWA7XG5cbmV4cG9ydCBjb25zdCBjb25maWdTY2hlbWF0aWNzID0gY3JlYXRlQ29uZmlnU2NoZW1hdGljcygpXG4gIC5maWVsZChcbiAgICBcImRvY3VtZW50c0RpcmVjdG9yeVwiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiRG9jdW1lbnRzIERpcmVjdG9yeVwiLFxuICAgICAgc3VidGl0bGU6IFwiUm9vdCBkaXJlY3RvcnkgY29udGFpbmluZyBkb2N1bWVudHMgdG8gaW5kZXguIEFsbCBzdWJkaXJlY3RvcmllcyB3aWxsIGJlIHNjYW5uZWQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCIvcGF0aC90by9kb2N1bWVudHNcIixcbiAgICB9LFxuICAgIFwiXCIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwidmVjdG9yU3RvcmVEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlZlY3RvciBTdG9yZSBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIkRpcmVjdG9yeSB3aGVyZSB0aGUgdmVjdG9yIGRhdGFiYXNlIHdpbGwgYmUgc3RvcmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vdmVjdG9yL3N0b3JlXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInJldHJpZXZhbExpbWl0XCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAyMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlJldHJpZXZhbCBMaW1pdFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWF4aW11bSBudW1iZXIgb2YgY2h1bmtzIHRvIHJldHVybiBkdXJpbmcgcmV0cmlldmFsLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMSwgbWF4OiAyMCwgc3RlcDogMSB9LFxuICAgIH0sXG4gICAgNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIG1pbjogMC4wLFxuICAgICAgbWF4OiAxLjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgQWZmaW5pdHkgVGhyZXNob2xkXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNaW5pbXVtIHNpbWlsYXJpdHkgc2NvcmUgZm9yIGEgY2h1bmsgdG8gYmUgY29uc2lkZXJlZCByZWxldmFudC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDAuMCwgbWF4OiAxLjAsIHN0ZXA6IDAuMDEgfSxcbiAgICB9LFxuICAgIDAuNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJjaHVua1NpemVcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEyOCxcbiAgICAgIG1heDogMjA0OCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNodW5rIFNpemVcIixcbiAgICAgIHN1YnRpdGxlOiBcIlNpemUgb2YgdGV4dCBjaHVua3MgZm9yIGVtYmVkZGluZyAoaW4gdG9rZW5zKS5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEyOCwgbWF4OiAyMDQ4LCBzdGVwOiAxMjggfSxcbiAgICB9LFxuICAgIDUxMixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJjaHVua092ZXJsYXBcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDUxMixcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNodW5rIE92ZXJsYXBcIixcbiAgICAgIHN1YnRpdGxlOiBcIk92ZXJsYXAgYmV0d2VlbiBjb25zZWN1dGl2ZSBjaHVua3MgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLCBtYXg6IDUxMiwgc3RlcDogMzIgfSxcbiAgICB9LFxuICAgIDEwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYXhDb25jdXJyZW50RmlsZXNcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEsXG4gICAgICBtYXg6IDEwLFxuICAgICAgZGlzcGxheU5hbWU6IFwiTWF4IENvbmN1cnJlbnQgRmlsZXNcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGZpbGVzIHRvIHByb2Nlc3MgY29uY3VycmVudGx5IGR1cmluZyBpbmRleGluZy4gUmVjb21tZW5kIDEgZm9yIGxhcmdlIFBERiBkYXRhc2V0cy5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEsIG1heDogMTAsIHN0ZXA6IDEgfSxcbiAgICB9LFxuICAgIDEsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicGFyc2VEZWxheU1zXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiA1MDAwLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUGFyc2VyIERlbGF5IChtcylcIixcbiAgICAgIHN1YnRpdGxlOiBcIldhaXQgdGltZSBiZWZvcmUgcGFyc2luZyBlYWNoIGRvY3VtZW50IChoZWxwcyBhdm9pZCBXZWJTb2NrZXQgdGhyb3R0bGluZykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLCBtYXg6IDUwMDAsIHN0ZXA6IDEwMCB9LFxuICAgIH0sXG4gICAgNTAwLFxuICApXG4gIC5maWVsZChcbiAgICBcImVuYWJsZU9DUlwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBPQ1JcIixcbiAgICAgIHN1YnRpdGxlOiBcIkVuYWJsZSBPQ1IgZm9yIGltYWdlIGZpbGVzIGFuZCBpbWFnZS1iYXNlZCBQREZzIHVzaW5nIExNIFN0dWRpbydzIGJ1aWx0LWluIGRvY3VtZW50IHBhcnNlci5cIixcbiAgICB9LFxuICAgIHRydWUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWFudWFsUmVpbmRleC50cmlnZ2VyXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiTWFudWFsIFJlaW5kZXggVHJpZ2dlclwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiVG9nZ2xlIE9OIHRvIHJlcXVlc3QgYW4gaW1tZWRpYXRlIHJlaW5kZXguIFRoZSBwbHVnaW4gcmVzZXRzIHRoaXMgYWZ0ZXIgcnVubmluZy4gVXNlIHRoZSBcdTIwMUNTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlc1x1MjAxRCBvcHRpb24gYmVsb3cgdG8gY29udHJvbCB3aGV0aGVyIHVuY2hhbmdlZCBmaWxlcyBhcmUgc2tpcHBlZC5cIixcbiAgICB9LFxuICAgIGZhbHNlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXguc2tpcFByZXZpb3VzbHlJbmRleGVkXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcIixcbiAgICAgIHN1YnRpdGxlOiBcIlNraXAgdW5jaGFuZ2VkIGZpbGVzIGZvciBmYXN0ZXIgbWFudWFsIHJ1bnMuIE9ubHkgaW5kZXhlcyBuZXcgZmlsZXMgb3IgY2hhbmdlZCBmaWxlcy5cIixcbiAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICB7XG4gICAgICAgICAga2V5OiBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgICAgICAgIGNvbmRpdGlvbjogeyB0eXBlOiBcImVxdWFsc1wiLCB2YWx1ZTogdHJ1ZSB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHRydWUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicHJvbXB0VGVtcGxhdGVcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlByb21wdCBUZW1wbGF0ZVwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiU3VwcG9ydHMge3tyYWdfY29udGV4dH19IChyZXF1aXJlZCkgYW5kIHt7dXNlcl9xdWVyeX19IG1hY3JvcyBmb3IgY3VzdG9taXppbmcgdGhlIGZpbmFsIHByb21wdC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBERUZBVUxUX1BST01QVF9URU1QTEFURSxcbiAgICAgIGlzUGFyYWdyYXBoOiB0cnVlLFxuICAgIH0sXG4gICAgREVGQVVMVF9QUk9NUFRfVEVNUExBVEUsXG4gIClcbiAgLmJ1aWxkKCk7XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IExvY2FsSW5kZXggfSBmcm9tIFwidmVjdHJhXCI7XG5cbmNvbnN0IE1BWF9JVEVNU19QRVJfU0hBUkQgPSAxMDAwMDtcbmNvbnN0IFNIQVJEX0RJUl9QUkVGSVggPSBcInNoYXJkX1wiO1xuY29uc3QgU0hBUkRfRElSX1JFR0VYID0gL15zaGFyZF8oXFxkKykkLztcblxuZXhwb3J0IGludGVyZmFjZSBEb2N1bWVudENodW5rIHtcbiAgaWQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xuICB2ZWN0b3I6IG51bWJlcltdO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaFJlc3VsdCB7XG4gIHRleHQ6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBzaGFyZE5hbWU6IHN0cmluZztcbiAgbWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbnR5cGUgQ2h1bmtNZXRhZGF0YSA9IHtcbiAgdGV4dDogc3RyaW5nO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcbn07XG5cbmV4cG9ydCBjbGFzcyBWZWN0b3JTdG9yZSB7XG4gIHByaXZhdGUgZGJQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgc2hhcmREaXJzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGFjdGl2ZVNoYXJkOiBMb2NhbEluZGV4IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlU2hhcmRDb3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB1cGRhdGVNdXRleDogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gIGNvbnN0cnVjdG9yKGRiUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5kYlBhdGggPSBwYXRoLnJlc29sdmUoZGJQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIGEgc2hhcmQgYnkgZGlyZWN0b3J5IG5hbWUgKGUuZy4gXCJzaGFyZF8wMDBcIikuIENhbGxlciBtdXN0IG5vdCBob2xkIHRoZSByZWZlcmVuY2VcbiAgICogYWZ0ZXIgdXNlIHNvIEdDIGNhbiBmcmVlIHRoZSBwYXJzZWQgaW5kZXggZGF0YS5cbiAgICovXG4gIHByaXZhdGUgb3BlblNoYXJkKGRpcjogc3RyaW5nKTogTG9jYWxJbmRleCB7XG4gICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIGRpcik7XG4gICAgcmV0dXJuIG5ldyBMb2NhbEluZGV4KGZ1bGxQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FuIGRiUGF0aCBmb3Igc2hhcmRfTk5OIGRpcmVjdG9yaWVzIGFuZCByZXR1cm4gc29ydGVkIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGRpc2NvdmVyU2hhcmREaXJzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpcih0aGlzLmRiUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgIGNvbnN0IGRpcnM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBlIG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChlLmlzRGlyZWN0b3J5KCkgJiYgU0hBUkRfRElSX1JFR0VYLnRlc3QoZS5uYW1lKSkge1xuICAgICAgICBkaXJzLnB1c2goZS5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGlycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBuID0gKG06IHN0cmluZykgPT4gcGFyc2VJbnQobS5tYXRjaChTSEFSRF9ESVJfUkVHRVgpIVsxXSwgMTApO1xuICAgICAgcmV0dXJuIG4oYSkgLSBuKGIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkaXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHZlY3RvciBzdG9yZTogZGlzY292ZXIgb3IgY3JlYXRlIHNoYXJkcywgb3BlbiB0aGUgbGFzdCBhcyBhY3RpdmUuXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLm1rZGlyKHRoaXMuZGJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB0aGlzLnNoYXJkRGlycyA9IGF3YWl0IHRoaXMuZGlzY292ZXJTaGFyZERpcnMoKTtcblxuICAgIGlmICh0aGlzLnNoYXJkRGlycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IGZpcnN0RGlyID0gYCR7U0hBUkRfRElSX1BSRUZJWH0wMDBgO1xuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIGZpcnN0RGlyKTtcbiAgICAgIGNvbnN0IGluZGV4ID0gbmV3IExvY2FsSW5kZXgoZnVsbFBhdGgpO1xuICAgICAgYXdhaXQgaW5kZXguY3JlYXRlSW5kZXgoeyB2ZXJzaW9uOiAxIH0pO1xuICAgICAgdGhpcy5zaGFyZERpcnMgPSBbZmlyc3REaXJdO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IGluZGV4O1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGFzdERpciA9IHRoaXMuc2hhcmREaXJzW3RoaXMuc2hhcmREaXJzLmxlbmd0aCAtIDFdO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IHRoaXMub3BlblNoYXJkKGxhc3REaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gaXRlbXMubGVuZ3RoO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGRvY3VtZW50IGNodW5rcyB0byB0aGUgYWN0aXZlIHNoYXJkLiBSb3RhdGVzIHRvIGEgbmV3IHNoYXJkIHdoZW4gZnVsbC5cbiAgICovXG4gIGFzeW5jIGFkZENodW5rcyhjaHVua3M6IERvY3VtZW50Q2h1bmtbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hY3RpdmVTaGFyZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVjdG9yIHN0b3JlIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICB9XG4gICAgaWYgKGNodW5rcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5hY3RpdmVTaGFyZCEuYmVnaW5VcGRhdGUoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGE6IENodW5rTWV0YWRhdGEgPSB7XG4gICAgICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICAgICAgZmlsZVBhdGg6IGNodW5rLmZpbGVQYXRoLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGNodW5rLmZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZUhhc2g6IGNodW5rLmZpbGVIYXNoLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogY2h1bmsuY2h1bmtJbmRleCxcbiAgICAgICAgICAgIC4uLmNodW5rLm1ldGFkYXRhLFxuICAgICAgICAgIH07XG4gICAgICAgICAgYXdhaXQgdGhpcy5hY3RpdmVTaGFyZCEudXBzZXJ0SXRlbSh7XG4gICAgICAgICAgICBpZDogY2h1bmsuaWQsXG4gICAgICAgICAgICB2ZWN0b3I6IGNodW5rLnZlY3RvcixcbiAgICAgICAgICAgIG1ldGFkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLmVuZFVwZGF0ZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkIS5jYW5jZWxVcGRhdGUoKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCArPSBjaHVua3MubGVuZ3RoO1xuICAgICAgY29uc29sZS5sb2coYEFkZGVkICR7Y2h1bmtzLmxlbmd0aH0gY2h1bmtzIHRvIHZlY3RvciBzdG9yZWApO1xuXG4gICAgICBpZiAodGhpcy5hY3RpdmVTaGFyZENvdW50ID49IE1BWF9JVEVNU19QRVJfU0hBUkQpIHtcbiAgICAgICAgY29uc3QgbmV4dE51bSA9IHRoaXMuc2hhcmREaXJzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgbmV4dERpciA9IGAke1NIQVJEX0RJUl9QUkVGSVh9JHtTdHJpbmcobmV4dE51bSkucGFkU3RhcnQoMywgXCIwXCIpfWA7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBuZXh0RGlyKTtcbiAgICAgICAgY29uc3QgbmV3SW5kZXggPSBuZXcgTG9jYWxJbmRleChmdWxsUGF0aCk7XG4gICAgICAgIGF3YWl0IG5ld0luZGV4LmNyZWF0ZUluZGV4KHsgdmVyc2lvbjogMSB9KTtcbiAgICAgICAgdGhpcy5zaGFyZERpcnMucHVzaChuZXh0RGlyKTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IG5ld0luZGV4O1xuICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgPSAwO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoOiBxdWVyeSBlYWNoIHNoYXJkIGluIHR1cm4sIG1lcmdlIHJlc3VsdHMsIHNvcnQgYnkgc2NvcmUsIGZpbHRlciBieSB0aHJlc2hvbGQsIHJldHVybiB0b3AgbGltaXQuXG4gICAqL1xuICBhc3luYyBzZWFyY2goXG4gICAgcXVlcnlWZWN0b3I6IG51bWJlcltdLFxuICAgIGxpbWl0OiBudW1iZXIgPSA1LFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMC41LFxuICApOiBQcm9taXNlPFNlYXJjaFJlc3VsdFtdPiB7XG4gICAgY29uc3QgbWVyZ2VkOiBTZWFyY2hSZXN1bHRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2hhcmQucXVlcnlJdGVtcyhcbiAgICAgICAgcXVlcnlWZWN0b3IsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGxpbWl0LFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIGZhbHNlLFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3QgciBvZiByZXN1bHRzKSB7XG4gICAgICAgIGNvbnN0IG0gPSByLml0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YTtcbiAgICAgICAgbWVyZ2VkLnB1c2goe1xuICAgICAgICAgIHRleHQ6IG0/LnRleHQgPz8gXCJcIixcbiAgICAgICAgICBzY29yZTogci5zY29yZSxcbiAgICAgICAgICBmaWxlUGF0aDogbT8uZmlsZVBhdGggPz8gXCJcIixcbiAgICAgICAgICBmaWxlTmFtZTogbT8uZmlsZU5hbWUgPz8gXCJcIixcbiAgICAgICAgICBjaHVua0luZGV4OiBtPy5jaHVua0luZGV4ID8/IDAsXG4gICAgICAgICAgc2hhcmROYW1lOiBkaXIsXG4gICAgICAgICAgbWV0YWRhdGE6IChyLml0ZW0ubWV0YWRhdGEgYXMgUmVjb3JkPHN0cmluZywgYW55PikgPz8ge30sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkXG4gICAgICAuZmlsdGVyKChyKSA9PiByLnNjb3JlID49IHRocmVzaG9sZClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSlcbiAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFsbCBjaHVua3MgZm9yIGEgZmlsZSAoYnkgaGFzaCkgYWNyb3NzIGFsbCBzaGFyZHMuXG4gICAqL1xuICBhc3luYyBkZWxldGVCeUZpbGVIYXNoKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsYXN0RGlyID0gdGhpcy5zaGFyZERpcnNbdGhpcy5zaGFyZERpcnMubGVuZ3RoIC0gMV07XG4gICAgdGhpcy51cGRhdGVNdXRleCA9IHRoaXMudXBkYXRlTXV0ZXgudGhlbihhc3luYyAoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICAgIGNvbnN0IHRvRGVsZXRlID0gaXRlbXMuZmlsdGVyKFxuICAgICAgICAgIChpKSA9PiAoaS5tZXRhZGF0YSBhcyBDaHVua01ldGFkYXRhKT8uZmlsZUhhc2ggPT09IGZpbGVIYXNoLFxuICAgICAgICApO1xuICAgICAgICBpZiAodG9EZWxldGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF3YWl0IHNoYXJkLmJlZ2luVXBkYXRlKCk7XG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRvRGVsZXRlKSB7XG4gICAgICAgICAgICBhd2FpdCBzaGFyZC5kZWxldGVJdGVtKGl0ZW0uaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBzaGFyZC5lbmRVcGRhdGUoKTtcbiAgICAgICAgICBpZiAoZGlyID09PSBsYXN0RGlyICYmIHRoaXMuYWN0aXZlU2hhcmQpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IChhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkLmxpc3RJdGVtcygpKS5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgRGVsZXRlZCBjaHVua3MgZm9yIGZpbGUgaGFzaDogJHtmaWxlSGFzaH1gKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVNdXRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZmlsZSBwYXRoIC0+IHNldCBvZiBmaWxlIGhhc2hlcyBjdXJyZW50bHkgaW4gdGhlIHN0b3JlLlxuICAgKi9cbiAgYXN5bmMgZ2V0RmlsZUhhc2hJbnZlbnRvcnkoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+IHtcbiAgICBjb25zdCBpbnZlbnRvcnkgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgIGNvbnN0IHNoYXJkID0gdGhpcy5vcGVuU2hhcmQoZGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgbSA9IGl0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBtPy5maWxlUGF0aDtcbiAgICAgICAgY29uc3QgZmlsZUhhc2ggPSBtPy5maWxlSGFzaDtcbiAgICAgICAgaWYgKCFmaWxlUGF0aCB8fCAhZmlsZUhhc2gpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgc2V0ID0gaW52ZW50b3J5LmdldChmaWxlUGF0aCk7XG4gICAgICAgIGlmICghc2V0KSB7XG4gICAgICAgICAgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgICAgaW52ZW50b3J5LnNldChmaWxlUGF0aCwgc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBzZXQuYWRkKGZpbGVIYXNoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGludmVudG9yeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdG90YWwgY2h1bmsgY291bnQgYW5kIHVuaXF1ZSBmaWxlIGNvdW50LlxuICAgKi9cbiAgYXN5bmMgZ2V0U3RhdHMoKTogUHJvbWlzZTx7XG4gICAgdG90YWxDaHVua3M6IG51bWJlcjtcbiAgICB1bmlxdWVGaWxlczogbnVtYmVyO1xuICB9PiB7XG4gICAgbGV0IHRvdGFsQ2h1bmtzID0gMDtcbiAgICBjb25zdCB1bmlxdWVIYXNoZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBzaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIHRvdGFsQ2h1bmtzICs9IGl0ZW1zLmxlbmd0aDtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCBoID0gKGl0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YSk/LmZpbGVIYXNoO1xuICAgICAgICBpZiAoaCkgdW5pcXVlSGFzaGVzLmFkZChoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdG90YWxDaHVua3MsIHVuaXF1ZUZpbGVzOiB1bmlxdWVIYXNoZXMuc2l6ZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFueSBjaHVuayBleGlzdHMgZm9yIHRoZSBnaXZlbiBmaWxlIGhhc2ggKHNob3J0LWNpcmN1aXRzIG9uIGZpcnN0IG1hdGNoKS5cbiAgICovXG4gIGFzeW5jIGhhc0ZpbGUoZmlsZUhhc2g6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgaWYgKGl0ZW1zLnNvbWUoKGkpID0+IChpLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGEpPy5maWxlSGFzaCA9PT0gZmlsZUhhc2gpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVsZWFzZSB0aGUgYWN0aXZlIHNoYXJkIHJlZmVyZW5jZS5cbiAgICovXG4gIGFzeW5jIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTYW5pdHlDaGVja1Jlc3VsdCB7XG4gIHBhc3NlZDogYm9vbGVhbjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFBlcmZvcm0gc2FuaXR5IGNoZWNrcyBiZWZvcmUgaW5kZXhpbmcgbGFyZ2UgZGlyZWN0b3JpZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1TYW5pdHlDaGVja3MoXG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nLFxuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nLFxuKTogUHJvbWlzZTxTYW5pdHlDaGVja1Jlc3VsdD4ge1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIENoZWNrIGlmIGRpcmVjdG9yaWVzIGV4aXN0XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKGRvY3VtZW50c0RpciwgZnMuY29uc3RhbnRzLlJfT0spO1xuICB9IGNhdGNoIHtcbiAgICBlcnJvcnMucHVzaChgRG9jdW1lbnRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgcmVhZGFibGU6ICR7ZG9jdW1lbnRzRGlyfWApO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3ModmVjdG9yU3RvcmVEaXIsIGZzLmNvbnN0YW50cy5XX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gVHJ5IHRvIGNyZWF0ZSBpdFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2Rpcih2ZWN0b3JTdG9yZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgYFZlY3RvciBzdG9yZSBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiAke3ZlY3RvclN0b3JlRGlyfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXRmcyh2ZWN0b3JTdG9yZURpcik7XG4gICAgY29uc3QgYXZhaWxhYmxlR0IgPSAoc3RhdHMuYmF2YWlsICogc3RhdHMuYnNpemUpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGF2YWlsYWJsZUdCIDwgMSkge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbGFibGVHQiA8IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKGBMb3cgZGlzayBzcGFjZSBhdmFpbGFibGU6ICR7YXZhaWxhYmxlR0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBjaGVjayBhdmFpbGFibGUgZGlzayBzcGFjZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBtZW1vcnlcbiAgY29uc3QgZnJlZU1lbW9yeUdCID0gb3MuZnJlZW1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHRvdGFsTWVtb3J5R0IgPSBvcy50b3RhbG1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHJ1bm5pbmdPbk1hYyA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCI7XG4gIGNvbnN0IGxvd01lbW9yeU1lc3NhZ2UgPVxuICAgIGBMb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCIG9mICR7dG90YWxNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQiB0b3RhbC4gYCArXG4gICAgXCJDb25zaWRlciByZWR1Y2luZyBjb25jdXJyZW50IGZpbGUgcHJvY2Vzc2luZy5cIjtcbiAgY29uc3QgdmVyeUxvd01lbW9yeU1lc3NhZ2UgPVxuICAgIGBWZXJ5IGxvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0IuIGAgK1xuICAgIChydW5uaW5nT25NYWNcbiAgICAgID8gXCJtYWNPUyBtYXkgYmUgcmVwb3J0aW5nIGNhY2hlZCBwYWdlcyBhcyB1c2VkOyBjYWNoZWQgbWVtb3J5IGNhbiB1c3VhbGx5IGJlIHJlY2xhaW1lZCBhdXRvbWF0aWNhbGx5LlwiXG4gICAgICA6IFwiSW5kZXhpbmcgbWF5IGZhaWwgZHVlIHRvIGluc3VmZmljaWVudCBSQU0uXCIpO1xuXG4gIGlmIChmcmVlTWVtb3J5R0IgPCAwLjUpIHtcbiAgICBpZiAocnVubmluZ09uTWFjKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHZlcnlMb3dNZW1vcnlNZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCAyKSB7XG4gICAgd2FybmluZ3MucHVzaChsb3dNZW1vcnlNZXNzYWdlKTtcbiAgfVxuXG4gIC8vIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIChzYW1wbGUtYmFzZWQgZm9yIHBlcmZvcm1hbmNlKVxuICB0cnkge1xuICAgIGNvbnN0IHNhbXBsZVNpemUgPSBhd2FpdCBlc3RpbWF0ZURpcmVjdG9yeVNpemUoZG9jdW1lbnRzRGlyKTtcbiAgICBjb25zdCBlc3RpbWF0ZWRHQiA9IHNhbXBsZVNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgICBcbiAgICBpZiAoZXN0aW1hdGVkR0IgPiAxMDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGBMYXJnZSBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSBzZXZlcmFsIGhvdXJzLmBcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChlc3RpbWF0ZWRHQiA+IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTWVkaXVtLXNpemVkIGRpcmVjdG9yeSBkZXRlY3RlZCAofiR7ZXN0aW1hdGVkR0IudG9GaXhlZCgxKX0gR0IpLiBJbml0aWFsIGluZGV4aW5nIG1heSB0YWtlIDMwLTYwIG1pbnV0ZXMuYFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBlc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHZlY3RvciBzdG9yZSBhbHJlYWR5IGhhcyBkYXRhXG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKHZlY3RvclN0b3JlRGlyKTtcbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgXCJWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGlzIG5vdCBlbXB0eS4gRXhpc3RpbmcgZGF0YSB3aWxsIGJlIHVzZWQgZm9yIGluY3JlbWVudGFsIGluZGV4aW5nLlwiXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QgeWV0LCB0aGF0J3MgZmluZVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwYXNzZWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgd2FybmluZ3MsXG4gICAgZXJyb3JzLFxuICB9O1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIGJ5IHNhbXBsaW5nXG4gKiAoUXVpY2sgZXN0aW1hdGUsIG5vdCBleGFjdClcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRpcjogc3RyaW5nLCBtYXhTYW1wbGVzOiBudW1iZXIgPSAxMDApOiBQcm9taXNlPG51bWJlcj4ge1xuICBsZXQgdG90YWxTaXplID0gMDtcbiAgbGV0IGZpbGVDb3VudCA9IDA7XG4gIGxldCBzYW1wbGVkU2l6ZSA9IDA7XG4gIGxldCBzYW1wbGVkQ291bnQgPSAwO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoY3VycmVudERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHNhbXBsZWRDb3VudCA+PSBtYXhTYW1wbGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGN1cnJlbnREaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBgJHtjdXJyZW50RGlyfS8ke2VudHJ5Lm5hbWV9YDtcblxuICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIGF3YWl0IHdhbGsoZnVsbFBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICAgICAgZmlsZUNvdW50Kys7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKHNhbXBsZWRDb3VudCA8IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgIHNhbXBsZWRTaXplICs9IHN0YXRzLnNpemU7XG4gICAgICAgICAgICAgIHNhbXBsZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIFNraXAgZmlsZXMgd2UgY2FuJ3Qgc3RhdFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU2tpcCBkaXJlY3RvcmllcyB3ZSBjYW4ndCByZWFkXG4gICAgfVxuICB9XG5cbiAgYXdhaXQgd2FsayhkaXIpO1xuXG4gIC8vIEV4dHJhcG9sYXRlIGZyb20gc2FtcGxlXG4gIGlmIChzYW1wbGVkQ291bnQgPiAwICYmIGZpbGVDb3VudCA+IDApIHtcbiAgICBjb25zdCBhdmdGaWxlU2l6ZSA9IHNhbXBsZWRTaXplIC8gc2FtcGxlZENvdW50O1xuICAgIHRvdGFsU2l6ZSA9IGF2Z0ZpbGVTaXplICogZmlsZUNvdW50O1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsU2l6ZTtcbn1cblxuLyoqXG4gKiBDaGVjayBzeXN0ZW0gcmVzb3VyY2VzIGFuZCBwcm92aWRlIHJlY29tbWVuZGF0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2VSZWNvbW1lbmRhdGlvbnMoXG4gIGVzdGltYXRlZFNpemVHQjogbnVtYmVyLFxuICBmcmVlTWVtb3J5R0I6IG51bWJlcixcbik6IHtcbiAgcmVjb21tZW5kZWRDb25jdXJyZW5jeTogbnVtYmVyO1xuICByZWNvbW1lbmRlZENodW5rU2l6ZTogbnVtYmVyO1xuICBlc3RpbWF0ZWRUaW1lOiBzdHJpbmc7XG59IHtcbiAgbGV0IHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAzO1xuICBsZXQgcmVjb21tZW5kZWRDaHVua1NpemUgPSA1MTI7XG4gIGxldCBlc3RpbWF0ZWRUaW1lID0gXCJ1bmtub3duXCI7XG5cbiAgLy8gQWRqdXN0IGJhc2VkIG9uIGF2YWlsYWJsZSBtZW1vcnlcbiAgaWYgKGZyZWVNZW1vcnlHQiA8IDIpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMTtcbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCA0KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDI7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCID49IDgpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gNTtcbiAgfVxuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBkYXRhc2V0IHNpemVcbiAgaWYgKGVzdGltYXRlZFNpemVHQiA8IDEpIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCI1LTE1IG1pbnV0ZXNcIjtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMCkge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjMwLTYwIG1pbnV0ZXNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDc2ODtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMDApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIyLTQgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gIH0gZWxzZSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNC0xMiBob3Vyc1wiO1xuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplID0gMTAyNDtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gTWF0aC5taW4ocmVjb21tZW5kZWRDb25jdXJyZW5jeSwgMyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3ksXG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUsXG4gICAgZXN0aW1hdGVkVGltZSxcbiAgfTtcbn1cblxuIiwgImxldCBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGFjcXVpcmUgdGhlIHNoYXJlZCBpbmRleGluZyBsb2NrLlxuICogUmV0dXJucyB0cnVlIGlmIG5vIG90aGVyIGluZGV4aW5nIGpvYiBpcyBydW5uaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ5U3RhcnRJbmRleGluZyhjb250ZXh0OiBzdHJpbmcgPSBcInVua25vd25cIik6IGJvb2xlYW4ge1xuICBpZiAoaW5kZXhpbmdJblByb2dyZXNzKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gdHJ5U3RhcnRJbmRleGluZyAoJHtjb250ZXh0fSkgZmFpbGVkOiBsb2NrIGFscmVhZHkgaGVsZGApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGluZGV4aW5nSW5Qcm9ncmVzcyA9IHRydWU7XG4gIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIHN1Y2NlZWRlZGApO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZWxlYXNlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmlzaEluZGV4aW5nKCk6IHZvaWQge1xuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgY29uc29sZS5kZWJ1ZyhcIltCaWdSQUddIGZpbmlzaEluZGV4aW5nOiBsb2NrIHJlbGVhc2VkXCIpO1xufVxuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIGFuIGluZGV4aW5nIGpvYiBpcyBjdXJyZW50bHkgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhpbmcoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmRleGluZ0luUHJvZ3Jlc3M7XG59XG5cbiIsICIvKipcbiAqIE5hdGl2ZSBtb2R1bGUgcmUtZXhwb3J0c1xuICogXG4gKiBUaGlzIG1vZHVsZSBwcm92aWRlcyBoaWdoLXBlcmZvcm1hbmNlIFJ1c3QgaW1wbGVtZW50YXRpb25zIG9mOlxuICogLSBGaWxlIGhhc2hpbmcgKFNIQS0yNTYpXG4gKiAtIFRleHQgY2h1bmtpbmdcbiAqIC0gRGlyZWN0b3J5IHNjYW5uaW5nXG4gKiBcbiAqIEZhbGxzIGJhY2sgdG8gVHlwZVNjcmlwdCBpbXBsZW1lbnRhdGlvbnMgaWYgbmF0aXZlIG1vZHVsZSBpcyBub3QgYXZhaWxhYmxlLlxuICovXG5cbi8vIFRyeSB0byBsb2FkIG5hdGl2ZSBtb2R1bGUsIGZhbGxiYWNrIHRvIFRTIGlmIG5vdCBhdmFpbGFibGVcbmxldCBuYXRpdmVNb2R1bGU6IGFueSA9IG51bGw7XG5sZXQgbmF0aXZlTG9hZEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxudHJ5IHtcbiAgLy8gVHJ5IGRpZmZlcmVudCBwb3NzaWJsZSBwYXRocyBmb3IgdGhlIG5hdGl2ZSBtb2R1bGVcbiAgY29uc3QgcGF0aHMgPSBbXG4gICAgJy4uLy4uL25hdGl2ZS9iaWdyYWctbmF0aXZlLmxpbnV4LXg2NC1nbnUubm9kZScsXG4gICAgJy4uLy4uL25hdGl2ZS9pbmRleC5ub2RlJyxcbiAgICAnQGJpZ3JhZy9uYXRpdmUnLFxuICBdO1xuXG4gIGZvciAoY29uc3QgcCBvZiBwYXRocykge1xuICAgIHRyeSB7XG4gICAgICBuYXRpdmVNb2R1bGUgPSByZXF1aXJlKHApO1xuICAgICAgYnJlYWs7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbn0gY2F0Y2ggKGUpIHtcbiAgbmF0aXZlTG9hZEVycm9yID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG59XG5cbi8vIFR5cGUgZGVmaW5pdGlvbnMgKG5hcGktcnMgY29udmVydHMgc25ha2VfY2FzZSB0byBjYW1lbENhc2UgZm9yIEpTKVxuZXhwb3J0IGludGVyZmFjZSBIYXNoUmVzdWx0IHtcbiAgcGF0aDogc3RyaW5nO1xuICBoYXNoOiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0Q2h1bmsge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0SW5kZXg6IG51bWJlcjtcbiAgZW5kSW5kZXg6IG51bWJlcjtcbiAgdG9rZW5Fc3RpbWF0ZTogbnVtYmVyO1xufVxuXG4vLy8gQmF0Y2ggY2h1bmsgcmVzdWx0IHdpdGggZmlsZSBpbmRleCBmb3IgaWRlbnRpZnlpbmcgc291cmNlIGRvY3VtZW50XG5leHBvcnQgaW50ZXJmYWNlIEJhdGNoQ2h1bmtSZXN1bHQge1xuICBmaWxlSW5kZXg6IG51bWJlcjtcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0SW5kZXg6IG51bWJlcjtcbiAgZW5kSW5kZXg6IG51bWJlcjtcbiAgdG9rZW5Fc3RpbWF0ZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjYW5uZWRGaWxlIHtcbiAgcGF0aDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGV4dGVuc2lvbjogc3RyaW5nO1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBudW1iZXI7XG59XG5cbi8vIEZhbGxiYWNrIGltcGxlbWVudGF0aW9uc1xuY29uc3QgZmFsbGJhY2tzID0ge1xuICBoYXNoRmlsZTogYXN5bmMgKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgY3J5cHRvID0gYXdhaXQgaW1wb3J0KCdjcnlwdG8nKTtcbiAgICBjb25zdCBmcyA9IGF3YWl0IGltcG9ydCgnZnMnKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aCk7XG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4gaGFzaC51cGRhdGUoZGF0YSkpO1xuICAgICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KCdoZXgnKSkpO1xuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgY2h1bmtUZXh0OiAoXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIGNodW5rU2l6ZTogbnVtYmVyLFxuICAgIG92ZXJsYXA6IG51bWJlclxuICApOiBUZXh0Q2h1bmtbXSA9PiB7XG4gICAgY29uc3QgY2h1bmtzOiBUZXh0Q2h1bmtbXSA9IFtdO1xuICAgIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgvXFxzKy8pO1xuICAgIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHJldHVybiBjaHVua3M7XG5cbiAgICBsZXQgc3RhcnRJZHggPSAwO1xuICAgIHdoaWxlIChzdGFydElkeCA8IHdvcmRzLmxlbmd0aCkge1xuICAgICAgY29uc3QgZW5kSWR4ID0gTWF0aC5taW4oc3RhcnRJZHggKyBjaHVua1NpemUsIHdvcmRzLmxlbmd0aCk7XG4gICAgICBjb25zdCBjaHVua1dvcmRzID0gd29yZHMuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XG4gICAgICBjb25zdCBjaHVua1RleHQgPSBjaHVua1dvcmRzLmpvaW4oJyAnKTtcbiAgICAgIGNodW5rcy5wdXNoKHtcbiAgICAgICAgdGV4dDogY2h1bmtUZXh0LFxuICAgICAgICBzdGFydEluZGV4OiBzdGFydElkeCxcbiAgICAgICAgZW5kSW5kZXg6IGVuZElkeCxcbiAgICAgICAgdG9rZW5Fc3RpbWF0ZTogTWF0aC5jZWlsKGNodW5rVGV4dC5sZW5ndGggLyA0KSxcbiAgICAgIH0pO1xuICAgICAgc3RhcnRJZHggKz0gTWF0aC5tYXgoMSwgY2h1bmtTaXplIC0gb3ZlcmxhcCk7XG4gICAgICBpZiAoZW5kSWR4ID49IHdvcmRzLmxlbmd0aCkgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjaHVua3M7XG4gIH0sXG5cbiAgc2NhbkRpcmVjdG9yeTogYXN5bmMgKHJvb3Q6IHN0cmluZyk6IFByb21pc2U8U2Nhbm5lZEZpbGVbXT4gPT4ge1xuICAgIGNvbnN0IGZzID0gYXdhaXQgaW1wb3J0KCdmcycpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCBpbXBvcnQoJ3BhdGgnKTtcbiAgICBjb25zdCBmaWxlczogU2Nhbm5lZEZpbGVbXSA9IFtdO1xuXG4gICAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9ucyA9IG5ldyBTZXQoW1xuICAgICAgJy50eHQnLCAnLm1kJywgJy5tYXJrZG93bicsICcuaHRtbCcsICcuaHRtJywgJy5wZGYnLCAnLmVwdWInLFxuICAgICAgJy5qcGcnLCAnLmpwZWcnLCAnLnBuZycsICcuZ2lmJywgJy5ibXAnLCAnLnRpZmYnLCAnLndlYnAnLFxuICAgIF0pO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gd2FsayhkaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBlbnRyeS5uYW1lKTtcbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShlbnRyeS5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRFeHRlbnNpb25zLmhhcyhleHQpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgZmlsZXMucHVzaCh7XG4gICAgICAgICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICAgICAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgICAgICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgICAgICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICAgICAgICAgICAgbXRpbWU6IHN0YXRzLm10aW1lTXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBhd2FpdCB3YWxrKHJvb3QpO1xuICAgIHJldHVybiBmaWxlcztcbiAgfSxcbn07XG5cbi8vIEV4cG9ydCBmdW5jdGlvbnMgd2l0aCBuYXRpdmUvVFMgZmFsbGJhY2tcbmV4cG9ydCBjb25zdCBoYXNoRmlsZSA9IG5hdGl2ZU1vZHVsZT8uaGFzaEZpbGUgfHwgZmFsbGJhY2tzLmhhc2hGaWxlO1xuZXhwb3J0IGNvbnN0IGhhc2hGaWxlc1BhcmFsbGVsID0gbmF0aXZlTW9kdWxlPy5oYXNoRmlsZXNQYXJhbGxlbDtcbmV4cG9ydCBjb25zdCBoYXNoRGF0YSA9IG5hdGl2ZU1vZHVsZT8uaGFzaERhdGE7XG5cbi8vIE9wdGltaXplZCBjaHVua2luZyAtIHVzZSBuYXRpdmUgd2hlbiBhdmFpbGFibGVcbmV4cG9ydCBjb25zdCBjaHVua1RleHQgPSBuYXRpdmVNb2R1bGU/LmNodW5rVGV4dCB8fCBmYWxsYmFja3MuY2h1bmtUZXh0O1xuZXhwb3J0IGNvbnN0IGNodW5rVGV4dEZhc3QgPSBuYXRpdmVNb2R1bGU/LmNodW5rVGV4dEZhc3Q7XG5leHBvcnQgY29uc3QgY2h1bmtUZXh0c1BhcmFsbGVsID0gbmF0aXZlTW9kdWxlPy5jaHVua1RleHRzUGFyYWxsZWw7XG5leHBvcnQgY29uc3QgY2h1bmtUZXh0c0JhdGNoID0gbmF0aXZlTW9kdWxlPy5jaHVua1RleHRzQmF0Y2g7XG5leHBvcnQgY29uc3QgZXN0aW1hdGVUb2tlbnMgPSBuYXRpdmVNb2R1bGU/LmVzdGltYXRlVG9rZW5zO1xuZXhwb3J0IGNvbnN0IGVzdGltYXRlVG9rZW5zQmF0Y2ggPSBuYXRpdmVNb2R1bGU/LmVzdGltYXRlVG9rZW5zQmF0Y2g7XG5cbmV4cG9ydCBjb25zdCBzY2FuRGlyZWN0b3J5ID0gbmF0aXZlTW9kdWxlPy5zY2FuRGlyZWN0b3J5IHx8IGZhbGxiYWNrcy5zY2FuRGlyZWN0b3J5O1xuZXhwb3J0IGNvbnN0IGlzU3VwcG9ydGVkRXh0ZW5zaW9uID0gbmF0aXZlTW9kdWxlPy5pc1N1cHBvcnRlZEV4dGVuc2lvbiB8fCAoKCkgPT4gdHJ1ZSk7XG5leHBvcnQgY29uc3QgZ2V0U3VwcG9ydGVkRXh0ZW5zaW9ucyA9IG5hdGl2ZU1vZHVsZT8uZ2V0U3VwcG9ydGVkRXh0ZW5zaW9ucztcbmV4cG9ydCBjb25zdCBEaXJlY3RvcnlTY2FubmVyID0gbmF0aXZlTW9kdWxlPy5EaXJlY3RvcnlTY2FubmVyO1xuXG4vLyBVdGlsaXR5IGZ1bmN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGlzTmF0aXZlQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmF0aXZlTW9kdWxlICE9PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlTG9hZEVycm9yKCk6IHN0cmluZyB8IG51bGwge1xuICByZXR1cm4gbmF0aXZlTG9hZEVycm9yO1xufVxuIiwgImNvbnN0IEhUTUxfRVhURU5TSU9OUyA9IFtcIi5odG1cIiwgXCIuaHRtbFwiLCBcIi54aHRtbFwiXTtcbmNvbnN0IE1BUktET1dOX0VYVEVOU0lPTlMgPSBbXCIubWRcIiwgXCIubWFya2Rvd25cIiwgXCIubWRvd25cIiwgXCIubWR4XCIsIFwiLm1rZFwiLCBcIi5ta2RuXCJdO1xuY29uc3QgVEVYVF9FWFRFTlNJT05TID0gW1wiLnR4dFwiLCBcIi50ZXh0XCJdO1xuY29uc3QgUERGX0VYVEVOU0lPTlMgPSBbXCIucGRmXCJdO1xuY29uc3QgRVBVQl9FWFRFTlNJT05TID0gW1wiLmVwdWJcIl07XG5jb25zdCBJTUFHRV9FWFRFTlNJT05TID0gW1wiLmJtcFwiLCBcIi5qcGdcIiwgXCIuanBlZ1wiLCBcIi5wbmdcIl07XG5jb25zdCBBUkNISVZFX0VYVEVOU0lPTlMgPSBbXCIucmFyXCJdO1xuXG5jb25zdCBBTExfRVhURU5TSU9OX0dST1VQUyA9IFtcbiAgSFRNTF9FWFRFTlNJT05TLFxuICBNQVJLRE9XTl9FWFRFTlNJT05TLFxuICBURVhUX0VYVEVOU0lPTlMsXG4gIFBERl9FWFRFTlNJT05TLFxuICBFUFVCX0VYVEVOU0lPTlMsXG4gIElNQUdFX0VYVEVOU0lPTlMsXG4gIEFSQ0hJVkVfRVhURU5TSU9OUyxcbl07XG5cbmV4cG9ydCBjb25zdCBTVVBQT1JURURfRVhURU5TSU9OUyA9IG5ldyBTZXQoXG4gIEFMTF9FWFRFTlNJT05fR1JPVVBTLmZsYXRNYXAoKGdyb3VwKSA9PiBncm91cC5tYXAoKGV4dCkgPT4gZXh0LnRvTG93ZXJDYXNlKCkpKSxcbik7XG5cbmV4cG9ydCBjb25zdCBIVE1MX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KEhUTUxfRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgTUFSS0RPV05fRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoTUFSS0RPV05fRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgVEVYVF9FWFRFTlNJT05fU0VUID0gbmV3IFNldChURVhUX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IElNQUdFX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KElNQUdFX0VYVEVOU0lPTlMpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNIdG1sRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBIVE1MX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFya2Rvd25FeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIE1BUktET1dOX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBURVhUX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVGV4dHVhbEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNNYXJrZG93bkV4dGVuc2lvbihleHQpIHx8IGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucygpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKFNVUFBPUlRFRF9FWFRFTlNJT05TLnZhbHVlcygpKS5zb3J0KCk7XG59XG5cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgbWltZSBmcm9tIFwibWltZS10eXBlc1wiO1xuaW1wb3J0IHtcbiAgc2NhbkRpcmVjdG9yeSBhcyBuYXRpdmVTY2FuRGlyZWN0b3J5LFxuICBpc05hdGl2ZUF2YWlsYWJsZSxcbiAgU2Nhbm5lZEZpbGUgYXMgTmF0aXZlU2Nhbm5lZEZpbGUsXG59IGZyb20gXCIuLi9uYXRpdmVcIjtcbmltcG9ydCB7XG4gIFNVUFBPUlRFRF9FWFRFTlNJT05TLFxuICBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucyxcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTY2FubmVkRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBleHRlbnNpb246IHN0cmluZztcbiAgbWltZVR5cGU6IHN0cmluZyB8IGZhbHNlO1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBEYXRlO1xufVxuXG4vKiogTm9ybWFsaXplIGFuZCB2YWxpZGF0ZSB0aGUgcm9vdCBkaXJlY3RvcnkgZm9yIHNjYW5uaW5nIChyZXNvbHZlcyBwYXRoLCBzdHJpcHMgdHJhaWxpbmcgc2xhc2hlcykuICovXG5mdW5jdGlvbiBub3JtYWxpemVSb290RGlyKHJvb3REaXI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBwYXRoLnJlc29sdmUocm9vdERpci50cmltKCkpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHNjYW4gYSBkaXJlY3RvcnkgZm9yIHN1cHBvcnRlZCBmaWxlc1xuICogVXNlcyBuYXRpdmUgUnVzdCBpbXBsZW1lbnRhdGlvbiB3aGVuIGF2YWlsYWJsZSBmb3IgMTB4IHNwZWVkdXBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoXG4gIHJvb3REaXI6IHN0cmluZyxcbiAgb25Qcm9ncmVzcz86IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpID0+IHZvaWQsXG4pOiBQcm9taXNlPFNjYW5uZWRGaWxlW10+IHtcbiAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZVJvb3REaXIocm9vdERpcik7XG4gIFxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2Vzcyhyb290LCBmcy5jb25zdGFudHMuUl9PSyk7XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgaWYgKGVycj8uY29kZSA9PT0gXCJFTk9FTlRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRG9jdW1lbnRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdDogJHtyb290fS4gQ2hlY2sgdGhlIHBhdGggKGUuZy4gc3BlbGxpbmcgYW5kIHRoYXQgdGhlIGZvbGRlciBleGlzdHMpLmAsXG4gICAgICApO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICAvLyBVc2UgbmF0aXZlIFJ1c3QgaW1wbGVtZW50YXRpb24gaWYgYXZhaWxhYmxlXG4gIGlmIChpc05hdGl2ZUF2YWlsYWJsZSgpKSB7XG4gICAgY29uc3QgbmF0aXZlRmlsZXMgPSBhd2FpdCBuYXRpdmVTY2FuRGlyZWN0b3J5KHJvb3QpIGFzIE5hdGl2ZVNjYW5uZWRGaWxlW107XG4gICAgXG4gICAgLy8gQ29udmVydCBuYXRpdmUgZm9ybWF0IHRvIGV4cGVjdGVkIGZvcm1hdFxuICAgIGNvbnN0IGZpbGVzOiBTY2FubmVkRmlsZVtdID0gbmF0aXZlRmlsZXMubWFwKChmKSA9PiAoe1xuICAgICAgcGF0aDogZi5wYXRoLFxuICAgICAgbmFtZTogZi5uYW1lLFxuICAgICAgZXh0ZW5zaW9uOiBmLmV4dGVuc2lvbixcbiAgICAgIG1pbWVUeXBlOiBtaW1lLmxvb2t1cChmLnBhdGgpLFxuICAgICAgc2l6ZTogZi5zaXplLFxuICAgICAgbXRpbWU6IG5ldyBEYXRlKGYubXRpbWUgKiAxMDAwKSwgLy8gQ29udmVydCBmcm9tIFVuaXggdGltZXN0YW1wXG4gICAgfSkpO1xuXG4gICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgIG9uUHJvZ3Jlc3MoZmlsZXMubGVuZ3RoLCBmaWxlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlcztcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIFR5cGVTY3JpcHQgaW1wbGVtZW50YXRpb25cbiAgY29uc3QgZmlsZXM6IFNjYW5uZWRGaWxlW10gPSBbXTtcbiAgbGV0IHNjYW5uZWRDb3VudCA9IDA7XG5cbiAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9uID0gbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMoKS5qb2luKFwiLCBcIik7XG4gIGNvbnNvbGUubG9nKGBbU2Nhbm5lcl0gU3VwcG9ydGVkIGV4dGVuc2lvbnM6ICR7c3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9ufWApO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoZGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGVudHJ5Lm5hbWUpO1xuXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgYXdhaXQgd2FsayhmdWxsUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBzY2FubmVkQ291bnQrKztcblxuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShlbnRyeS5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKFNVUFBPUlRFRF9FWFRFTlNJT05TLmhhcyhleHQpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgY29uc3QgbWltZVR5cGUgPSBtaW1lLmxvb2t1cChmdWxsUGF0aCk7XG5cbiAgICAgICAgICAgIGZpbGVzLnB1c2goe1xuICAgICAgICAgICAgICBwYXRoOiBmdWxsUGF0aCxcbiAgICAgICAgICAgICAgbmFtZTogZW50cnkubmFtZSxcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBleHQsXG4gICAgICAgICAgICAgIG1pbWVUeXBlLFxuICAgICAgICAgICAgICBzaXplOiBzdGF0cy5zaXplLFxuICAgICAgICAgICAgICBtdGltZTogc3RhdHMubXRpbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob25Qcm9ncmVzcyAmJiBzY2FubmVkQ291bnQgJSAxMDAgPT09IDApIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBzY2FubmluZyBkaXJlY3RvcnkgJHtkaXJ9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhd2FpdCB3YWxrKHJvb3QpO1xuXG4gIGlmIChvblByb2dyZXNzKSB7XG4gICAgb25Qcm9ncmVzcyhzY2FubmVkQ291bnQsIGZpbGVzLmxlbmd0aCk7XG4gIH1cblxuICByZXR1cm4gZmlsZXM7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBmaWxlIHR5cGUgaXMgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N1cHBvcnRlZEZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBTVVBQT1JURURfRVhURU5TSU9OUy5oYXMoZXh0KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBuYXRpdmUgc2Nhbm5pbmcgaXMgYXZhaWxhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05hdGl2ZVNjYW5uaW5nQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNOYXRpdmVBdmFpbGFibGUoKTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSBcImNoZWVyaW9cIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIFBhcnNlIEhUTUwvSFRNIGZpbGVzIGFuZCBleHRyYWN0IHRleHQgY29udGVudFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VIVE1MKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCAkID0gY2hlZXJpby5sb2FkKGNvbnRlbnQpO1xuICAgIFxuICAgIC8vIFJlbW92ZSBzY3JpcHQgYW5kIHN0eWxlIGVsZW1lbnRzXG4gICAgJChcInNjcmlwdCwgc3R5bGUsIG5vc2NyaXB0XCIpLnJlbW92ZSgpO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgdGV4dFxuICAgIGNvbnN0IHRleHQgPSAkKFwiYm9keVwiKS50ZXh0KCkgfHwgJC50ZXh0KCk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgd2hpdGVzcGFjZVxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgSFRNTCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwZGZQYXJzZSBmcm9tIFwicGRmLXBhcnNlXCI7XG5pbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5pbXBvcnQgeyBQTkcgfSBmcm9tIFwicG5nanNcIjtcblxuY29uc3QgTUlOX1RFWFRfTEVOR1RIID0gNTA7XG5jb25zdCBPQ1JfTUFYX1BBR0VTID0gNTA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFU19QRVJfUEFHRSA9IDM7XG5jb25zdCBPQ1JfTUlOX0lNQUdFX0FSRUEgPSAxMF8wMDA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFX1BJWEVMUyA9IDUwXzAwMF8wMDA7IC8vIH43MDAweDcwMDA7IHByZXZlbnRzIGxlcHRvbmljYSBwaXhkYXRhX21hbGxvYyBjcmFzaGVzXG5jb25zdCBPQ1JfSU1BR0VfVElNRU9VVF9NUyA9IDMwXzAwMDtcblxudHlwZSBQZGZKc01vZHVsZSA9IHR5cGVvZiBpbXBvcnQoXCJwZGZqcy1kaXN0L2xlZ2FjeS9idWlsZC9wZGYubWpzXCIpO1xuXG5pbnRlcmZhY2UgRXh0cmFjdGVkT2NySW1hZ2Uge1xuICBidWZmZXI6IEJ1ZmZlcjtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIGFyZWE6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUGRmRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJwZGYubG1zdHVkaW8tZXJyb3JcIlxuICB8IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCJcbiAgfCBcInBkZi5wZGZwYXJzZS1lcnJvclwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZW1wdHlcIlxuICB8IFwicGRmLm9jci1kaXNhYmxlZFwiXG4gIHwgXCJwZGYub2NyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItcmVuZGVyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItZW1wdHlcIjtcblxudHlwZSBQZGZQYXJzZVN0YWdlID0gXCJsbXN0dWRpb1wiIHwgXCJwZGYtcGFyc2VcIiB8IFwib2NyXCI7XG5jbGFzcyBJbWFnZURhdGFUaW1lb3V0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9iaklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVGltZWQgb3V0IGZldGNoaW5nIGltYWdlIGRhdGEgZm9yICR7b2JqSWR9YCk7XG4gICAgdGhpcy5uYW1lID0gXCJJbWFnZURhdGFUaW1lb3V0RXJyb3JcIjtcbiAgfVxufVxuXG5pbnRlcmZhY2UgUGRmUGFyc2VyU3VjY2VzcyB7XG4gIHN1Y2Nlc3M6IHRydWU7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhZ2U6IFBkZlBhcnNlU3RhZ2U7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmUGFyc2VyRmFpbHVyZSB7XG4gIHN1Y2Nlc3M6IGZhbHNlO1xuICByZWFzb246IFBkZkZhaWx1cmVSZWFzb247XG4gIGRldGFpbHM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFBkZlBhcnNlclJlc3VsdCA9IFBkZlBhcnNlclN1Y2Nlc3MgfCBQZGZQYXJzZXJGYWlsdXJlO1xuXG5mdW5jdGlvbiBjbGVhblRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbnR5cGUgU3RhZ2VSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxubGV0IGNhY2hlZFBkZmpzTGliOiBQZGZKc01vZHVsZSB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBnZXRQZGZqc0xpYigpIHtcbiAgaWYgKCFjYWNoZWRQZGZqc0xpYikge1xuICAgIGNhY2hlZFBkZmpzTGliID0gYXdhaXQgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkUGRmanNMaWI7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeUxtU3R1ZGlvUGFyc2VyKGZpbGVQYXRoOiBzdHJpbmcsIGNsaWVudDogTE1TdHVkaW9DbGllbnQpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IG1heFJldHJpZXMgPSAyO1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUhhbmRsZSA9IGF3YWl0IGNsaWVudC5maWxlcy5wcmVwYXJlRmlsZShmaWxlUGF0aCk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGllbnQuZmlsZXMucGFyc2VEb2N1bWVudChmaWxlSGFuZGxlLCB7XG4gICAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMCB8fCBwcm9ncmVzcyA9PT0gMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUHJvY2Vzc2luZyAke2ZpbGVOYW1lfTogJHsocHJvZ3Jlc3MgKiAxMDApLnRvRml4ZWQoMCl9JWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgICAgc3RhZ2U6IFwibG1zdHVkaW9cIixcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUGFyc2VkIGJ1dCBnb3QgdmVyeSBsaXR0bGUgdGV4dCBmcm9tICR7ZmlsZU5hbWV9IChsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH0pLCB3aWxsIHRyeSBmYWxsYmFja3NgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCIsXG4gICAgICAgIGRldGFpbHM6IGBsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH1gLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgaXNXZWJTb2NrZXRFcnJvciA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiZcbiAgICAgICAgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJXZWJTb2NrZXRcIikgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcImNvbm5lY3Rpb24gY2xvc2VkXCIpKTtcblxuICAgICAgaWYgKGlzV2ViU29ja2V0RXJyb3IgJiYgYXR0ZW1wdCA8IG1heFJldHJpZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgV2ViU29ja2V0IGVycm9yIG9uICR7ZmlsZU5hbWV9LCByZXRyeWluZyAoJHthdHRlbXB0fS8ke21heFJldHJpZXN9KS4uLmAsXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDAgKiBhdHRlbXB0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgRXJyb3IgcGFyc2luZyBQREYgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lcnJvclwiLFxuICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogZmFsc2UsXG4gICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lcnJvclwiLFxuICAgIGRldGFpbHM6IFwiRXhjZWVkZWQgcmV0cnkgYXR0ZW1wdHNcIixcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5UGRmUGFyc2UoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBkZlBhcnNlKGJ1ZmZlcik7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dChyZXN1bHQudGV4dCB8fCBcIlwiKTtcblxuICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgU3VjY2Vzc2Z1bGx5IGV4dHJhY3RlZCB0ZXh0IGZyb20gJHtmaWxlTmFtZX1gKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgIHN0YWdlOiBcInBkZi1wYXJzZVwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgVmVyeSBsaXR0bGUgb3Igbm8gdGV4dCBleHRyYWN0ZWQgZnJvbSAke2ZpbGVOYW1lfSAobGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9KWAsXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLnBkZnBhcnNlLWVtcHR5XCIsXG4gICAgICBkZXRhaWxzOiBgbGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9YCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBFcnJvciBwYXJzaW5nIFBERiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLnBkZnBhcnNlLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlPY3JXaXRoUGRmSnMoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgbGV0IHdvcmtlcjogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVXb3JrZXI+PiB8IG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHBkZmpzTGliID0gYXdhaXQgZ2V0UGRmanNMaWIoKTtcbiAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgpKTtcbiAgICBjb25zdCBwZGZEb2N1bWVudCA9IGF3YWl0IHBkZmpzTGliXG4gICAgICAuZ2V0RG9jdW1lbnQoeyBkYXRhLCB2ZXJib3NpdHk6IHBkZmpzTGliLlZlcmJvc2l0eUxldmVsLkVSUk9SUyB9KVxuICAgICAgLnByb21pc2U7XG5cbiAgICBjb25zdCBudW1QYWdlcyA9IHBkZkRvY3VtZW50Lm51bVBhZ2VzO1xuICAgIGNvbnN0IG1heFBhZ2VzID0gTWF0aC5taW4obnVtUGFnZXMsIE9DUl9NQVhfUEFHRVMpO1xuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIFN0YXJ0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX0gLSBwYWdlcyAxIHRvICR7bWF4UGFnZXN9IChvZiAke251bVBhZ2VzfSlgLFxuICAgICk7XG5cbiAgICB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgY29uc3QgdGV4dFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCByZW5kZXJFcnJvcnMgPSAwO1xuICAgIGxldCBwcm9jZXNzZWRJbWFnZXMgPSAwO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IDE7IHBhZ2VOdW0gPD0gbWF4UGFnZXM7IHBhZ2VOdW0rKykge1xuICAgICAgbGV0IHBhZ2U7XG4gICAgICB0cnkge1xuICAgICAgICBwYWdlID0gYXdhaXQgcGRmRG9jdW1lbnQuZ2V0UGFnZShwYWdlTnVtKTtcbiAgICAgICAgY29uc3QgaW1hZ2VzID0gYXdhaXQgZXh0cmFjdEltYWdlc0ZvclBhZ2UocGRmanNMaWIsIHBhZ2UpO1xuICAgICAgICBpZiAoaW1hZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSAke2ZpbGVOYW1lfSAtIHBhZ2UgJHtwYWdlTnVtfSBjb250YWlucyBubyBleHRyYWN0YWJsZSBpbWFnZXMsIHNraXBwaW5nYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRJbWFnZXMgPSBpbWFnZXMuc2xpY2UoMCwgT0NSX01BWF9JTUFHRVNfUEVSX1BBR0UpO1xuICAgICAgICBmb3IgKGNvbnN0IGltYWdlIG9mIHNlbGVjdGVkSW1hZ2VzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgZGF0YTogeyB0ZXh0IH0sXG4gICAgICAgICAgICB9ID0gYXdhaXQgd29ya2VyLnJlY29nbml6ZShpbWFnZS5idWZmZXIpO1xuICAgICAgICAgICAgcHJvY2Vzc2VkSW1hZ2VzKys7XG4gICAgICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHRleHQgfHwgXCJcIik7XG4gICAgICAgICAgICBpZiAoY2xlYW5lZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKGNsZWFuZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKHJlY29nbml6ZUVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlY29nbml6ZSBpbWFnZSAoJHtpbWFnZS53aWR0aH14JHtpbWFnZS5oZWlnaHR9KSBvbiBwYWdlICR7cGFnZU51bX0gb2YgJHtmaWxlTmFtZX06YCxcbiAgICAgICAgICAgICAgcmVjb2duaXplRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IHJlY29nbml6ZUVycm9yLm1lc3NhZ2UgOiByZWNvZ25pemVFcnJvcixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBUaGUgd29ya2VyIG1heSBoYXZlIGNyYXNoZWQ7IHRyeSB0byByZWNyZWF0ZSBpdCBmb3IgcmVtYWluaW5nIGltYWdlc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIHdvcmtlciBhbHJlYWR5IGRlYWQsIGlnbm9yZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgICAgICAgICAgfSBjYXRjaCAocmVjcmVhdGVFcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlY3JlYXRlIE9DUiB3b3JrZXIsIGFib3J0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX1gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB3b3JrZXIgPSBudWxsO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICAgICAgICAgICAgZGV0YWlsczogYFdvcmtlciBjcmFzaGVkIGFuZCBjb3VsZCBub3QgYmUgcmVjcmVhdGVkOiAke1xuICAgICAgICAgICAgICAgICAgcmVjcmVhdGVFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gcmVjcmVhdGVFcnJvci5tZXNzYWdlIDogU3RyaW5nKHJlY3JlYXRlRXJyb3IpXG4gICAgICAgICAgICAgICAgfWAsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2VOdW0gPT09IDEgfHwgcGFnZU51bSAlIDEwID09PSAwIHx8IHBhZ2VOdW0gPT09IG1heFBhZ2VzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpICR7ZmlsZU5hbWV9IC0gcHJvY2Vzc2VkIHBhZ2UgJHtwYWdlTnVtfS8ke21heFBhZ2VzfSAoaW1hZ2VzPSR7cHJvY2Vzc2VkSW1hZ2VzfSwgY2hhcnM9JHt0ZXh0UGFydHMuam9pbihcbiAgICAgICAgICAgICAgXCJcXG5cXG5cIixcbiAgICAgICAgICAgICkubGVuZ3RofSlgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKHBhZ2VFcnJvcikge1xuICAgICAgICBpZiAocGFnZUVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgQWJvcnRpbmcgT0NSIGZvciAke2ZpbGVOYW1lfTogJHtwYWdlRXJyb3IubWVzc2FnZX1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgIHdvcmtlciA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgICAgICAgIGRldGFpbHM6IHBhZ2VFcnJvci5tZXNzYWdlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRXJyb3JzKys7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBFcnJvciBwcm9jZXNzaW5nIHBhZ2UgJHtwYWdlTnVtfSBvZiAke2ZpbGVOYW1lfTpgLFxuICAgICAgICAgIHBhZ2VFcnJvcixcbiAgICAgICAgKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGF3YWl0IHBhZ2U/LmNsZWFudXAoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAod29ya2VyKSB7XG4gICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgfVxuICAgIHdvcmtlciA9IG51bGw7XG5cbiAgICBjb25zdCBmdWxsVGV4dCA9IGNsZWFuVGV4dCh0ZXh0UGFydHMuam9pbihcIlxcblxcblwiKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIENvbXBsZXRlZCBPQ1IgZm9yICR7ZmlsZU5hbWV9LCBleHRyYWN0ZWQgJHtmdWxsVGV4dC5sZW5ndGh9IGNoYXJhY3RlcnNgLFxuICAgICk7XG5cbiAgICBpZiAoZnVsbFRleHQubGVuZ3RoID49IE1JTl9URVhUX0xFTkdUSCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdGV4dDogZnVsbFRleHQsXG4gICAgICAgIHN0YWdlOiBcIm9jclwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAocmVuZGVyRXJyb3JzID4gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYub2NyLXJlbmRlci1lcnJvclwiLFxuICAgICAgICBkZXRhaWxzOiBgJHtyZW5kZXJFcnJvcnN9IHBhZ2UgcmVuZGVyIGVycm9yc2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVtcHR5XCIsXG4gICAgICBkZXRhaWxzOiBcIk9DUiBwcm9kdWNlZCBpbnN1ZmZpY2llbnQgdGV4dFwiLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChPQ1IpIEVycm9yIGR1cmluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHdvcmtlcikge1xuICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0SW1hZ2VzRm9yUGFnZShwZGZqc0xpYjogUGRmSnNNb2R1bGUsIHBhZ2U6IGFueSk6IFByb21pc2U8RXh0cmFjdGVkT2NySW1hZ2VbXT4ge1xuICBjb25zdCBvcGVyYXRvckxpc3QgPSBhd2FpdCBwYWdlLmdldE9wZXJhdG9yTGlzdCgpO1xuICBjb25zdCBpbWFnZXM6IEV4dHJhY3RlZE9jckltYWdlW10gPSBbXTtcbiAgY29uc3QgaW1hZ2VEYXRhQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxhbnkgfCBudWxsPj4oKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG9wZXJhdG9yTGlzdC5mbkFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZm4gPSBvcGVyYXRvckxpc3QuZm5BcnJheVtpXTtcbiAgICBjb25zdCBhcmdzID0gb3BlcmF0b3JMaXN0LmFyZ3NBcnJheVtpXTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoZm4gPT09IHBkZmpzTGliLk9QUy5wYWludEltYWdlWE9iamVjdCB8fCBmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0UmVwZWF0KSB7XG4gICAgICAgIGNvbnN0IG9iaklkID0gYXJncz8uWzBdO1xuICAgICAgICBpZiAodHlwZW9mIG9iaklkICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGltZ0RhdGE7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaW1nRGF0YSA9IGF3YWl0IHJlc29sdmVJbWFnZURhdGEocGFnZSwgb2JqSWQsIGltYWdlRGF0YUNhY2hlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlc29sdmUgaW1hZ2UgZGF0YTpcIiwgZXJyb3IpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaW1nRGF0YSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRJbWFnZURhdGFUb1BuZyhwZGZqc0xpYiwgaW1nRGF0YSk7XG4gICAgICAgIGlmIChjb252ZXJ0ZWQpIHtcbiAgICAgICAgICBpbWFnZXMucHVzaChjb252ZXJ0ZWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbmxpbmVJbWFnZVhPYmplY3QgJiYgYXJncz8uWzBdKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRJbWFnZURhdGFUb1BuZyhwZGZqc0xpYiwgYXJnc1swXSk7XG4gICAgICAgIGlmIChjb252ZXJ0ZWQpIHtcbiAgICAgICAgICBpbWFnZXMucHVzaChjb252ZXJ0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybihcIltQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gZXh0cmFjdCBpbmxpbmUgaW1hZ2U6XCIsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW1hZ2VzXG4gICAgLmZpbHRlcigoaW1hZ2UpID0+IHtcbiAgICAgIGlmIChpbWFnZS5hcmVhIDwgT0NSX01JTl9JTUFHRV9BUkVBKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaW1hZ2UuYXJlYSA+IE9DUl9NQVhfSU1BR0VfUElYRUxTKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIFNraXBwaW5nIG92ZXJzaXplZCBpbWFnZSAoJHtpbWFnZS53aWR0aH14JHtpbWFnZS5oZWlnaHR9ID0gJHtpbWFnZS5hcmVhLnRvTG9jYWxlU3RyaW5nKCl9IHBpeGVscykgdG8gYXZvaWQgbWVtb3J5IGFsbG9jYXRpb24gZmFpbHVyZWAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuYXJlYSAtIGEuYXJlYSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVJbWFnZURhdGEoXG4gIHBhZ2U6IGFueSxcbiAgb2JqSWQ6IHN0cmluZyxcbiAgY2FjaGU6IE1hcDxzdHJpbmcsIFByb21pc2U8YW55IHwgbnVsbD4+LFxuKTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XG4gIGlmIChjYWNoZS5oYXMob2JqSWQpKSB7XG4gICAgcmV0dXJuIGNhY2hlLmdldChvYmpJZCkhO1xuICB9XG5cbiAgY29uc3QgcHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgcGFnZS5vYmpzLmhhcyA9PT0gXCJmdW5jdGlvblwiICYmIHBhZ2Uub2Jqcy5oYXMob2JqSWQpKSB7XG4gICAgICAgIHJldHVybiBwYWdlLm9ianMuZ2V0KG9iaklkKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIGZhbGwgdGhyb3VnaCB0byBhc3luYyBwYXRoXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgICBsZXQgdGltZW91dEhhbmRsZTogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRpbWVvdXRIYW5kbGUpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgdGltZW91dEhhbmRsZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGhhbmRsZURhdGEgPSAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBwYWdlLm9ianMuZ2V0KG9iaklkLCBoYW5kbGVEYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShPQ1JfSU1BR0VfVElNRU9VVF9NUykgJiYgT0NSX0lNQUdFX1RJTUVPVVRfTVMgPiAwKSB7XG4gICAgICAgIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBpZiAoIXNldHRsZWQpIHtcbiAgICAgICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBJbWFnZURhdGFUaW1lb3V0RXJyb3Iob2JqSWQpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIE9DUl9JTUFHRV9USU1FT1VUX01TKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSkoKTtcblxuICBjYWNoZS5zZXQob2JqSWQsIHByb21pc2UpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltYWdlRGF0YVRvUG5nKFxuICBwZGZqc0xpYjogUGRmSnNNb2R1bGUsXG4gIGltZ0RhdGE6IGFueSxcbik6IEV4dHJhY3RlZE9jckltYWdlIHwgbnVsbCB7XG4gIGlmICghaW1nRGF0YSB8fCB0eXBlb2YgaW1nRGF0YS53aWR0aCAhPT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgaW1nRGF0YS5oZWlnaHQgIT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHsgd2lkdGgsIGhlaWdodCwga2luZCwgZGF0YSB9ID0gaW1nRGF0YTtcbiAgaWYgKCFkYXRhKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBwbmcgPSBuZXcgUE5HKHsgd2lkdGgsIGhlaWdodCB9KTtcbiAgY29uc3QgZGVzdCA9IHBuZy5kYXRhO1xuXG4gIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuUkdCQV8zMkJQUCAmJiBkYXRhLmxlbmd0aCA9PT0gd2lkdGggKiBoZWlnaHQgKiA0KSB7XG4gICAgZGVzdC5zZXQoQnVmZmVyLmZyb20oZGF0YSkpO1xuICB9IGVsc2UgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5SR0JfMjRCUFAgJiYgZGF0YS5sZW5ndGggPT09IHdpZHRoICogaGVpZ2h0ICogMykge1xuICAgIGNvbnN0IHNyYyA9IGRhdGEgYXMgVWludDhBcnJheTtcbiAgICBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpICs9IDMsIGogKz0gNCkge1xuICAgICAgZGVzdFtqXSA9IHNyY1tpXTtcbiAgICAgIGRlc3RbaiArIDFdID0gc3JjW2kgKyAxXTtcbiAgICAgIGRlc3RbaiArIDJdID0gc3JjW2kgKyAyXTtcbiAgICAgIGRlc3RbaiArIDNdID0gMjU1O1xuICAgIH1cbiAgfSBlbHNlIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuR1JBWVNDQUxFXzFCUFApIHtcbiAgICBsZXQgcGl4ZWxJbmRleCA9IDA7XG4gICAgY29uc3QgdG90YWxQaXhlbHMgPSB3aWR0aCAqIGhlaWdodDtcbiAgICBmb3IgKGxldCBieXRlSW5kZXggPSAwOyBieXRlSW5kZXggPCBkYXRhLmxlbmd0aCAmJiBwaXhlbEluZGV4IDwgdG90YWxQaXhlbHM7IGJ5dGVJbmRleCsrKSB7XG4gICAgICBjb25zdCBieXRlID0gZGF0YVtieXRlSW5kZXhdO1xuICAgICAgZm9yIChsZXQgYml0ID0gNzsgYml0ID49IDAgJiYgcGl4ZWxJbmRleCA8IHRvdGFsUGl4ZWxzOyBiaXQtLSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IChieXRlID4+IGJpdCkgJiAxID8gMjU1IDogMDtcbiAgICAgICAgY29uc3QgZGVzdEluZGV4ID0gcGl4ZWxJbmRleCAqIDQ7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4XSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDFdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgMl0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAzXSA9IDI1NTtcbiAgICAgICAgcGl4ZWxJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYnVmZmVyOiBQTkcuc3luYy53cml0ZShwbmcpLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBhcmVhOiB3aWR0aCAqIGhlaWdodCxcbiAgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBQREYgZmlsZXMgd2l0aCBhIG11bHRpLXN0YWdlIHN0cmF0ZWd5OlxuICogMS4gVXNlIExNIFN0dWRpbydzIGJ1aWx0LWluIGRvY3VtZW50IHBhcnNlciAoZmFzdCwgc2VydmVyLXNpZGUsIG1heSBpbmNsdWRlIE9DUilcbiAqIDIuIEZhbGxiYWNrIHRvIGxvY2FsIHBkZi1wYXJzZSBmb3IgdGV4dC1iYXNlZCBQREZzXG4gKiAzLiBJZiBzdGlsbCBubyB0ZXh0IGFuZCBPQ1IgaXMgZW5hYmxlZCwgZmFsbGJhY2sgdG8gUERGLmpzICsgVGVzc2VyYWN0IE9DUlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VQREYoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQsXG4gIGVuYWJsZU9DUjogYm9vbGVhbixcbik6IFByb21pc2U8UGRmUGFyc2VyUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIC8vIDEpIExNIFN0dWRpbyBwYXJzZXJcbiAgY29uc3QgbG1TdHVkaW9SZXN1bHQgPSBhd2FpdCB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aCwgY2xpZW50KTtcbiAgaWYgKGxtU3R1ZGlvUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gbG1TdHVkaW9SZXN1bHQ7XG4gIH1cbiAgbGV0IGxhc3RGYWlsdXJlOiBQZGZQYXJzZXJGYWlsdXJlID0gbG1TdHVkaW9SZXN1bHQ7XG5cbiAgLy8gMikgTG9jYWwgcGRmLXBhcnNlIGZhbGxiYWNrXG4gIGNvbnN0IHBkZlBhcnNlUmVzdWx0ID0gYXdhaXQgdHJ5UGRmUGFyc2UoZmlsZVBhdGgpO1xuICBpZiAocGRmUGFyc2VSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBwZGZQYXJzZVJlc3VsdDtcbiAgfVxuICBsYXN0RmFpbHVyZSA9IHBkZlBhcnNlUmVzdWx0O1xuXG4gIC8vIDMpIE9DUiBmYWxsYmFjayAob25seSBpZiBlbmFibGVkKVxuICBpZiAoIWVuYWJsZU9DUikge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBFbmFibGUgT0NSIGlzIG9mZiwgc2tpcHBpbmcgT0NSIGZhbGxiYWNrIGZvciAke2ZpbGVOYW1lfSBhZnRlciBvdGhlciBtZXRob2RzIHJldHVybmVkIG5vIHRleHRgLFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZGlzYWJsZWRcIixcbiAgICAgIGRldGFpbHM6IGBQcmV2aW91cyBmYWlsdXJlIHJlYXNvbjogJHtsYXN0RmFpbHVyZS5yZWFzb259YCxcbiAgICB9O1xuICB9XG5cbiAgY29uc29sZS5sb2coXG4gICAgYFtQREYgUGFyc2VyXSAoT0NSKSBObyB0ZXh0IGV4dHJhY3RlZCBmcm9tICR7ZmlsZU5hbWV9IHdpdGggTE0gU3R1ZGlvIG9yIHBkZi1wYXJzZSwgYXR0ZW1wdGluZyBPQ1IuLi5gLFxuICApO1xuXG4gIGNvbnN0IG9jclJlc3VsdCA9IGF3YWl0IHRyeU9jcldpdGhQZGZKcyhmaWxlUGF0aCk7XG4gIGlmIChvY3JSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBvY3JSZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gb2NyUmVzdWx0O1xufVxuXG4iLCAiLy8gQHRzLWlnbm9yZSAtIGVwdWIyIGRvZXNuJ3QgaGF2ZSBjb21wbGV0ZSB0eXBlc1xuaW1wb3J0IHsgRVB1YiB9IGZyb20gXCJlcHViMlwiO1xuXG4vKipcbiAqIFBhcnNlIEVQVUIgZmlsZXMgYW5kIGV4dHJhY3QgdGV4dCBjb250ZW50XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUVQVUIoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVwdWIgPSBuZXcgRVB1YihmaWxlUGF0aCk7XG4gICAgICBcbiAgICAgIGVwdWIub24oXCJlcnJvclwiLCAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgRVBVQiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBzdHJpcEh0bWwgPSAoaW5wdXQ6IHN0cmluZykgPT5cbiAgICAgICAgaW5wdXQucmVwbGFjZSgvPFtePl0qPi9nLCBcIiBcIik7XG5cbiAgICAgIGNvbnN0IGdldE1hbmlmZXN0RW50cnkgPSAoY2hhcHRlcklkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIChlcHViIGFzIHVua25vd24gYXMgeyBtYW5pZmVzdD86IFJlY29yZDxzdHJpbmcsIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+IH0pLm1hbmlmZXN0Py5bY2hhcHRlcklkXTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGRlY29kZU1lZGlhVHlwZSA9IChlbnRyeT86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0pID0+XG4gICAgICAgIGVudHJ5Py5bXCJtZWRpYS10eXBlXCJdIHx8IGVudHJ5Py5tZWRpYVR5cGUgfHwgXCJcIjtcblxuICAgICAgY29uc3Qgc2hvdWxkUmVhZFJhdyA9IChtZWRpYVR5cGU6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbWVkaWFUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiYXBwbGljYXRpb24veGh0bWwreG1sXCIgfHwgbm9ybWFsaXplZCA9PT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKFwidGV4dC9cIikpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwiaHRtbFwiKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZWFkQ2hhcHRlciA9IGFzeW5jIChjaGFwdGVySWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBnZXRNYW5pZmVzdEVudHJ5KGNoYXB0ZXJJZCk7XG4gICAgICAgIGlmICghbWFuaWZlc3RFbnRyeSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihgRVBVQiBjaGFwdGVyICR7Y2hhcHRlcklkfSBtaXNzaW5nIG1hbmlmZXN0IGVudHJ5IGluICR7ZmlsZVBhdGh9LCBza2lwcGluZ2ApO1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVkaWFUeXBlID0gZGVjb2RlTWVkaWFUeXBlKG1hbmlmZXN0RW50cnkpO1xuICAgICAgICBpZiAoc2hvdWxkUmVhZFJhdyhtZWRpYVR5cGUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgICAgZXB1Yi5nZXRGaWxlKFxuICAgICAgICAgICAgICBjaGFwdGVySWQsXG4gICAgICAgICAgICAgIChlcnJvcjogRXJyb3IgfCBudWxsLCBkYXRhPzogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICByZWooZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgIHJlcyhcIlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmVzKHN0cmlwSHRtbChkYXRhLnRvU3RyaW5nKFwidXRmLThcIikpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgZXB1Yi5nZXRDaGFwdGVyKFxuICAgICAgICAgICAgY2hhcHRlcklkLFxuICAgICAgICAgICAgKGVycm9yOiBFcnJvciB8IG51bGwsIHRleHQ/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqKGVycm9yKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGV4dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJlcyhzdHJpcEh0bWwodGV4dCkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyhcIlwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZXB1Yi5vbihcImVuZFwiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2hhcHRlcnMgPSBlcHViLmZsb3c7XG4gICAgICAgICAgY29uc3QgdGV4dFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgIFxuICAgICAgICAgIGZvciAoY29uc3QgY2hhcHRlciBvZiBjaGFwdGVycykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgY2hhcHRlcklkID0gY2hhcHRlci5pZDtcbiAgICAgICAgICAgICAgaWYgKCFjaGFwdGVySWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEVQVUIgY2hhcHRlciBtaXNzaW5nIGlkIGluICR7ZmlsZVBhdGh9LCBza2lwcGluZ2ApO1xuICAgICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlYWRDaGFwdGVyKGNoYXB0ZXJJZCk7XG4gICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoY2hhcHRlckVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlYWRpbmcgY2hhcHRlciAke2NoYXB0ZXIuaWR9OmAsIGNoYXB0ZXJFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGZ1bGxUZXh0ID0gdGV4dFBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG4gICAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICAgIGZ1bGxUZXh0XG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIEVQVUIgY2hhcHRlcnM6YCwgZXJyb3IpO1xuICAgICAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBlcHViLnBhcnNlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluaXRpYWxpemluZyBFUFVCIHBhcnNlciBmb3IgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICB9XG4gIH0pO1xufVxuXG4iLCAiaW1wb3J0IHsgY3JlYXRlV29ya2VyIH0gZnJvbSBcInRlc3NlcmFjdC5qc1wiO1xuXG4vKipcbiAqIFBhcnNlIGltYWdlIGZpbGVzIHVzaW5nIE9DUiAoVGVzc2VyYWN0KVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VJbWFnZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgXG4gICAgY29uc3QgeyBkYXRhOiB7IHRleHQgfSB9ID0gYXdhaXQgd29ya2VyLnJlY29nbml6ZShmaWxlUGF0aCk7XG4gICAgXG4gICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIFxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlVGV4dE9wdGlvbnMge1xuICBzdHJpcE1hcmtkb3duPzogYm9vbGVhbjtcbiAgcHJlc2VydmVMaW5lQnJlYWtzPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQYXJzZSBwbGFpbiB0ZXh0IGZpbGVzICh0eHQsIG1kIGFuZCByZWxhdGVkIGZvcm1hdHMpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZVRleHQoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFBhcnNlVGV4dE9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgc3RyaXBNYXJrZG93biA9IGZhbHNlLCBwcmVzZXJ2ZUxpbmVCcmVha3MgPSBmYWxzZSB9ID0gb3B0aW9ucztcblxuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplTGluZUVuZGluZ3MoY29udGVudCk7XG5cbiAgICBjb25zdCBzdHJpcHBlZCA9IHN0cmlwTWFya2Rvd24gPyBzdHJpcE1hcmtkb3duU3ludGF4KG5vcm1hbGl6ZWQpIDogbm9ybWFsaXplZDtcblxuICAgIHJldHVybiAocHJlc2VydmVMaW5lQnJlYWtzID8gY29sbGFwc2VXaGl0ZXNwYWNlQnV0S2VlcExpbmVzKHN0cmlwcGVkKSA6IGNvbGxhcHNlV2hpdGVzcGFjZShzdHJpcHBlZCkpLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIHRleHQgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGluZUVuZGluZ3MoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlQnV0S2VlcExpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGlucHV0XG4gICAgICAvLyBUcmltIHRyYWlsaW5nIHdoaXRlc3BhY2UgcGVyIGxpbmVcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rXFxuL2csIFwiXFxuXCIpXG4gICAgICAvLyBDb2xsYXBzZSBtdWx0aXBsZSBibGFuayBsaW5lcyBidXQga2VlcCBwYXJhZ3JhcGggc2VwYXJhdGlvblxuICAgICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAgIC8vIENvbGxhcHNlIGludGVybmFsIHNwYWNlcy90YWJzXG4gICAgICAucmVwbGFjZSgvWyBcXHRdezIsfS9nLCBcIiBcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gc3RyaXBNYXJrZG93blN5bnRheChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG91dHB1dCA9IGlucHV0O1xuXG4gIC8vIFJlbW92ZSBmZW5jZWQgY29kZSBibG9ja3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL2BgYFtcXHNcXFNdKj9gYGAvZywgXCIgXCIpO1xuICAvLyBSZW1vdmUgaW5saW5lIGNvZGVcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL2AoW15gXSspYC9nLCBcIiQxXCIpO1xuICAvLyBSZXBsYWNlIGltYWdlcyB3aXRoIGFsdCB0ZXh0XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8hXFxbKFteXFxdXSopXFxdXFwoW14pXSpcXCkvZywgXCIkMSBcIik7XG4gIC8vIFJlcGxhY2UgbGlua3Mgd2l0aCBsaW5rIHRleHRcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL1xcWyhbXlxcXV0rKVxcXVxcKFteKV0qXFwpL2csIFwiJDFcIik7XG4gIC8vIFJlbW92ZSBlbXBoYXNpcyBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8oXFwqXFwqfF9fKSguKj8pXFwxL2csIFwiJDJcIik7XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8oXFwqfF8pKC4qPylcXDEvZywgXCIkMlwiKTtcbiAgLy8gUmVtb3ZlIGhlYWRpbmdzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30jezEsNn1cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIGJsb2NrIHF1b3Rlc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9Plxccz8vZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgdW5vcmRlcmVkIGxpc3QgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9Wy0qK11cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIG9yZGVyZWQgbGlzdCBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM31cXGQrW1xcLlxcKV1cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIGhvcml6b250YWwgcnVsZXNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfShbLSpfXVxccz8pezMsfSQvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgcmVzaWR1YWwgSFRNTCB0YWdzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC88W14+XSs+L2csIFwiIFwiKTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4iLCAiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcGFyc2VIVE1MIH0gZnJvbSBcIi4vaHRtbFBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VQREYsIHR5cGUgUGRmRmFpbHVyZVJlYXNvbiB9IGZyb20gXCIuL3BkZlBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VFUFVCIH0gZnJvbSBcIi4vZXB1YlBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VJbWFnZSB9IGZyb20gXCIuL2ltYWdlUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZVRleHQgfSBmcm9tIFwiLi90ZXh0UGFyc2VyXCI7XG5pbXBvcnQgeyB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7XG4gIElNQUdFX0VYVEVOU0lPTl9TRVQsXG4gIGlzSHRtbEV4dGVuc2lvbixcbiAgaXNNYXJrZG93bkV4dGVuc2lvbixcbiAgaXNQbGFpblRleHRFeHRlbnNpb24sXG4gIGlzVGV4dHVhbEV4dGVuc2lvbixcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWREb2N1bWVudCB7XG4gIHRleHQ6IHN0cmluZztcbiAgbWV0YWRhdGE6IHtcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xuICAgIGZpbGVOYW1lOiBzdHJpbmc7XG4gICAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gICAgcGFyc2VkQXQ6IERhdGU7XG4gIH07XG59XG5cbmV4cG9ydCB0eXBlIFBhcnNlRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIlxuICB8IFwicGRmLm1pc3NpbmctY2xpZW50XCJcbiAgfCBQZGZGYWlsdXJlUmVhc29uXG4gIHwgXCJlcHViLmVtcHR5XCJcbiAgfCBcImh0bWwuZW1wdHlcIlxuICB8IFwiaHRtbC5lcnJvclwiXG4gIHwgXCJ0ZXh0LmVtcHR5XCJcbiAgfCBcInRleHQuZXJyb3JcIlxuICB8IFwiaW1hZ2Uub2NyLWRpc2FibGVkXCJcbiAgfCBcImltYWdlLmVtcHR5XCJcbiAgfCBcImltYWdlLmVycm9yXCJcbiAgfCBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCI7XG5cbmV4cG9ydCB0eXBlIERvY3VtZW50UGFyc2VSZXN1bHQgPVxuICB8IHsgc3VjY2VzczogdHJ1ZTsgZG9jdW1lbnQ6IFBhcnNlZERvY3VtZW50IH1cbiAgfCB7IHN1Y2Nlc3M6IGZhbHNlOyByZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbjsgZGV0YWlscz86IHN0cmluZyB9O1xuXG4vKipcbiAqIFBhcnNlIGEgZG9jdW1lbnQgZmlsZSBiYXNlZCBvbiBpdHMgZXh0ZW5zaW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZURvY3VtZW50KFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBlbmFibGVPQ1I6IGJvb2xlYW4gPSBmYWxzZSxcbiAgY2xpZW50PzogTE1TdHVkaW9DbGllbnQsXG4pOiBQcm9taXNlPERvY3VtZW50UGFyc2VSZXN1bHQ+IHtcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpO1xuXG4gIGNvbnN0IGJ1aWxkU3VjY2VzcyA9ICh0ZXh0OiBzdHJpbmcpOiBEb2N1bWVudFBhcnNlUmVzdWx0ID0+ICh7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkb2N1bWVudDoge1xuICAgICAgdGV4dCxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgZXh0ZW5zaW9uOiBleHQsXG4gICAgICAgIHBhcnNlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICB0cnkge1xuICAgIGlmIChpc0h0bWxFeHRlbnNpb24oZXh0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGNsZWFuQW5kVmFsaWRhdGUoXG4gICAgICAgICAgYXdhaXQgcGFyc2VIVE1MKGZpbGVQYXRoKSxcbiAgICAgICAgICBcImh0bWwuZW1wdHlcIixcbiAgICAgICAgICBgJHtmaWxlTmFtZX0gaHRtbGAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0ZXh0LnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3ModGV4dC52YWx1ZSkgOiB0ZXh0O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bSFRNTF0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcImh0bWwuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIucGRmXCIpIHtcbiAgICAgIGlmICghY2xpZW50KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW1BhcnNlcl0gTm8gTE0gU3R1ZGlvIGNsaWVudCBhdmFpbGFibGUgZm9yIFBERiBwYXJzaW5nOiAke2ZpbGVOYW1lfWApO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInBkZi5taXNzaW5nLWNsaWVudFwiIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwZGZSZXN1bHQgPSBhd2FpdCBwYXJzZVBERihmaWxlUGF0aCwgY2xpZW50LCBlbmFibGVPQ1IpO1xuICAgICAgaWYgKHBkZlJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiBidWlsZFN1Y2Nlc3MocGRmUmVzdWx0LnRleHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBkZlJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5lcHViXCIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZUVQVUIoZmlsZVBhdGgpO1xuICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJlcHViLmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgIH1cblxuICAgIGlmIChpc1RleHR1YWxFeHRlbnNpb24oZXh0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlVGV4dChmaWxlUGF0aCwge1xuICAgICAgICAgIHN0cmlwTWFya2Rvd246IGlzTWFya2Rvd25FeHRlbnNpb24oZXh0KSxcbiAgICAgICAgICBwcmVzZXJ2ZUxpbmVCcmVha3M6IGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dCksXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcInRleHQuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW1RleHRdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJ0ZXh0LmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChJTUFHRV9FWFRFTlNJT05fU0VULmhhcyhleHQpKSB7XG4gICAgICBpZiAoIWVuYWJsZU9DUikge1xuICAgICAgICBjb25zb2xlLmxvZyhgU2tpcHBpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofSAoT0NSIGRpc2FibGVkKWApO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcImltYWdlLm9jci1kaXNhYmxlZFwiIH07XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VJbWFnZShmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwiaW1hZ2UuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW0ltYWdlXSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwiaW1hZ2UuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIucmFyXCIpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBSQVIgZmlsZXMgbm90IHlldCBzdXBwb3J0ZWQ6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiLCBkZXRhaWxzOiBcIi5yYXJcIiB9O1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBVbnN1cHBvcnRlZCBmaWxlIHR5cGU6ICR7ZmlsZVBhdGh9YCk7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIiwgZGV0YWlsczogZXh0IH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBkb2N1bWVudCAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfVxufVxuXG50eXBlIENsZWFuUmVzdWx0ID1cbiAgfCB7IHN1Y2Nlc3M6IHRydWU7IHZhbHVlOiBzdHJpbmcgfVxuICB8IHsgc3VjY2VzczogZmFsc2U7IHJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uOyBkZXRhaWxzPzogc3RyaW5nIH07XG5cbmZ1bmN0aW9uIGNsZWFuQW5kVmFsaWRhdGUoXG4gIHRleHQ6IHN0cmluZyxcbiAgZW1wdHlSZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbixcbiAgZGV0YWlsc0NvbnRleHQ/OiBzdHJpbmcsXG4pOiBDbGVhblJlc3VsdCB7XG4gIGNvbnN0IGNsZWFuZWQgPSB0ZXh0Py50cmltKCkgPz8gXCJcIjtcbiAgaWYgKGNsZWFuZWQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBlbXB0eVJlYXNvbixcbiAgICAgIGRldGFpbHM6IGRldGFpbHNDb250ZXh0ID8gYCR7ZGV0YWlsc0NvbnRleHR9IHRyaW1tZWQgdG8gemVybyBsZW5ndGhgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgdmFsdWU6IGNsZWFuZWQgfTtcbn1cblxuIiwgImltcG9ydCB7XG4gIGNodW5rVGV4dCBhcyBuYXRpdmVDaHVua1RleHQsXG4gIGNodW5rVGV4dEZhc3QgYXMgbmF0aXZlQ2h1bmtUZXh0RmFzdCxcbiAgY2h1bmtUZXh0c1BhcmFsbGVsIGFzIG5hdGl2ZUNodW5rVGV4dHNQYXJhbGxlbCxcbiAgY2h1bmtUZXh0c0JhdGNoIGFzIG5hdGl2ZUNodW5rVGV4dHNCYXRjaCxcbiAgaXNOYXRpdmVBdmFpbGFibGUsXG4gIFRleHRDaHVuayxcbiAgQmF0Y2hDaHVua1Jlc3VsdFxufSBmcm9tIFwiLi4vbmF0aXZlXCI7XG5cbi8qKlxuICogQ2h1bmsgcmVzdWx0IHdpdGggbWV0YWRhdGFcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDaHVua1Jlc3VsdCB7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhcnRJbmRleDogbnVtYmVyO1xuICBlbmRJbmRleDogbnVtYmVyO1xuICB0b2tlbkVzdGltYXRlOiBudW1iZXI7XG59XG5cbi8qKlxuICogT3B0aW1pemVkIHRleHQgY2h1bmtlciB0aGF0IHNwbGl0cyB0ZXh0IGludG8gb3ZlcmxhcHBpbmcgY2h1bmtzXG4gKiBVc2VzIG5hdGl2ZSBSdXN0IGltcGxlbWVudGF0aW9uIHdoZW4gYXZhaWxhYmxlIGZvciBtYXhpbXVtIHBlcmZvcm1hbmNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaHVua1RleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgY2h1bmtTaXplOiBudW1iZXIsXG4gIG92ZXJsYXA6IG51bWJlcixcbik6IENodW5rUmVzdWx0W10ge1xuICBpZiAoaXNOYXRpdmVBdmFpbGFibGUoKSkge1xuICAgIC8vIFVzZSBuYXRpdmUgUnVzdCBpbXBsZW1lbnRhdGlvbiAtIG9wdGltaXplZCB3aXRoIHNpbmdsZS1wYXNzIHdvcmQgYm91bmRhcnkgZGV0ZWN0aW9uXG4gICAgY29uc3QgbmF0aXZlQ2h1bmtzID0gbmF0aXZlQ2h1bmtUZXh0KHRleHQsIGNodW5rU2l6ZSwgb3ZlcmxhcCkgYXMgVGV4dENodW5rW107XG4gICAgcmV0dXJuIG5hdGl2ZUNodW5rcy5tYXAoKGNodW5rKSA9PiAoe1xuICAgICAgdGV4dDogY2h1bmsudGV4dCxcbiAgICAgIHN0YXJ0SW5kZXg6IGNodW5rLnN0YXJ0SW5kZXgsXG4gICAgICBlbmRJbmRleDogY2h1bmsuZW5kSW5kZXgsXG4gICAgICB0b2tlbkVzdGltYXRlOiBjaHVuay50b2tlbkVzdGltYXRlLFxuICAgIH0pKTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIFR5cGVTY3JpcHQgaW1wbGVtZW50YXRpb25cbiAgY29uc3QgY2h1bmtzOiBDaHVua1Jlc3VsdFtdID0gW107XG5cbiAgLy8gU2ltcGxlIHdvcmQtYmFzZWQgY2h1bmtpbmdcbiAgY29uc3Qgd29yZHMgPSB0ZXh0LnNwbGl0KC9cXHMrLyk7XG5cbiAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBjaHVua3M7XG4gIH1cblxuICBsZXQgc3RhcnRJZHggPSAwO1xuXG4gIHdoaWxlIChzdGFydElkeCA8IHdvcmRzLmxlbmd0aCkge1xuICAgIGNvbnN0IGVuZElkeCA9IE1hdGgubWluKHN0YXJ0SWR4ICsgY2h1bmtTaXplLCB3b3Jkcy5sZW5ndGgpO1xuICAgIGNvbnN0IGNodW5rV29yZHMgPSB3b3Jkcy5zbGljZShzdGFydElkeCwgZW5kSWR4KTtcbiAgICBjb25zdCBjaHVua1RleHQgPSBjaHVua1dvcmRzLmpvaW4oXCIgXCIpO1xuXG4gICAgY2h1bmtzLnB1c2goe1xuICAgICAgdGV4dDogY2h1bmtUZXh0LFxuICAgICAgc3RhcnRJbmRleDogc3RhcnRJZHgsXG4gICAgICBlbmRJbmRleDogZW5kSWR4LFxuICAgICAgdG9rZW5Fc3RpbWF0ZTogTWF0aC5jZWlsKGNodW5rVGV4dC5sZW5ndGggLyA0KSxcbiAgICB9KTtcblxuICAgIC8vIE1vdmUgZm9yd2FyZCBieSAoY2h1bmtTaXplIC0gb3ZlcmxhcCkgdG8gY3JlYXRlIG92ZXJsYXBwaW5nIGNodW5rc1xuICAgIHN0YXJ0SWR4ICs9IE1hdGgubWF4KDEsIGNodW5rU2l6ZSAtIG92ZXJsYXApO1xuXG4gICAgLy8gQnJlYWsgaWYgd2UndmUgcmVhY2hlZCB0aGUgZW5kXG4gICAgaWYgKGVuZElkeCA+PSB3b3Jkcy5sZW5ndGgpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaHVua3M7XG59XG5cbi8qKlxuICogRmFzdCB0ZXh0IGNodW5rZXIgLSByZXR1cm5zIG9ubHkgdGV4dCB3aXRob3V0IG1ldGFkYXRhXG4gKiBVc2VzIG5hdGl2ZSBSdXN0IGltcGxlbWVudGF0aW9uIGZvciBtYXhpbXVtIHBlcmZvcm1hbmNlICgxLjMweCBzcGVlZHVwKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY2h1bmtUZXh0RmFzdChcbiAgdGV4dDogc3RyaW5nLFxuICBjaHVua1NpemU6IG51bWJlcixcbiAgb3ZlcmxhcDogbnVtYmVyLFxuKTogc3RyaW5nW10ge1xuICBpZiAoaXNOYXRpdmVBdmFpbGFibGUoKSkge1xuICAgIHJldHVybiBuYXRpdmVDaHVua1RleHRGYXN0KHRleHQsIGNodW5rU2l6ZSwgb3ZlcmxhcCk7XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBUeXBlU2NyaXB0IGltcGxlbWVudGF0aW9uXG4gIGNvbnN0IGNodW5rcyA9IGNodW5rVGV4dCh0ZXh0LCBjaHVua1NpemUsIG92ZXJsYXApO1xuICByZXR1cm4gY2h1bmtzLm1hcChjID0+IGMudGV4dCk7XG59XG5cbi8qKlxuICogQmF0Y2ggY2h1bmsgbXVsdGlwbGUgdGV4dHMgaW4gcGFyYWxsZWwgdXNpbmcgUnVzdFxuICogUHJvdmlkZXMgMS40NXggc3BlZWR1cCBvdmVyIHNlcXVlbnRpYWwgVHlwZVNjcmlwdCBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2h1bmtUZXh0c1BhcmFsbGVsKFxuICB0ZXh0czogc3RyaW5nW10sXG4gIGNodW5rU2l6ZTogbnVtYmVyLFxuICBvdmVybGFwOiBudW1iZXIsXG4pOiBQcm9taXNlPENodW5rUmVzdWx0W11bXT4ge1xuICBpZiAoaXNOYXRpdmVBdmFpbGFibGUoKSkge1xuICAgIGNvbnN0IG5hdGl2ZUNodW5rcyA9IGF3YWl0IG5hdGl2ZUNodW5rVGV4dHNQYXJhbGxlbCh0ZXh0cywgY2h1bmtTaXplLCBvdmVybGFwKSBhcyBUZXh0Q2h1bmtbXVtdO1xuICAgIHJldHVybiBuYXRpdmVDaHVua3MubWFwKChmaWxlQ2h1bmtzKSA9PlxuICAgICAgZmlsZUNodW5rcy5tYXAoKGNodW5rKSA9PiAoe1xuICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICBzdGFydEluZGV4OiBjaHVuay5zdGFydEluZGV4LFxuICAgICAgICBlbmRJbmRleDogY2h1bmsuZW5kSW5kZXgsXG4gICAgICAgIHRva2VuRXN0aW1hdGU6IGNodW5rLnRva2VuRXN0aW1hdGUsXG4gICAgICB9KSlcbiAgICApO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gc2VxdWVudGlhbCBUeXBlU2NyaXB0IGltcGxlbWVudGF0aW9uXG4gIHJldHVybiB0ZXh0cy5tYXAoKHRleHQpID0+IGNodW5rVGV4dCh0ZXh0LCBjaHVua1NpemUsIG92ZXJsYXApKTtcbn1cblxuLyoqXG4gKiBVbHRyYS1iYXRjaCBjaHVua2luZyAtIGNodW5rcyBBTEwgZG9jdW1lbnRzIGluIGEgc2luZ2xlIG5hdGl2ZSBjYWxsXG4gKiBSZXR1cm5zIGNodW5rcyBncm91cGVkIGJ5IGZpbGUgaW5kZXggZm9yIG1heGltdW0gcGVyZm9ybWFuY2UgKGF2b2lkcyBGRkkgb3ZlcmhlYWQpXG4gKiBUaGlzIGlzIHRoZSBmYXN0ZXN0IGNodW5raW5nIG1ldGhvZCAtIDIweCsgc3BlZWR1cCBvdmVyIHNlcXVlbnRpYWwgY2FsbHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNodW5rVGV4dHNCYXRjaChcbiAgdGV4dHM6IHN0cmluZ1tdLFxuICBjaHVua1NpemU6IG51bWJlcixcbiAgb3ZlcmxhcDogbnVtYmVyLFxuKTogUHJvbWlzZTxNYXA8bnVtYmVyLCBDaHVua1Jlc3VsdFtdPj4ge1xuICBpZiAoaXNOYXRpdmVBdmFpbGFibGUoKSAmJiBuYXRpdmVDaHVua1RleHRzQmF0Y2gpIHtcbiAgICBjb25zdCBuYXRpdmVSZXN1bHRzID0gYXdhaXQgbmF0aXZlQ2h1bmtUZXh0c0JhdGNoKHRleHRzLCBjaHVua1NpemUsIG92ZXJsYXApIGFzIEJhdGNoQ2h1bmtSZXN1bHRbXTtcbiAgICBcbiAgICAvLyBHcm91cCBieSBmaWxlIGluZGV4XG4gICAgY29uc3QgZ3JvdXBlZCA9IG5ldyBNYXA8bnVtYmVyLCBDaHVua1Jlc3VsdFtdPigpO1xuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIG5hdGl2ZVJlc3VsdHMpIHtcbiAgICAgIGxldCBmaWxlQ2h1bmtzID0gZ3JvdXBlZC5nZXQocmVzdWx0LmZpbGVJbmRleCk7XG4gICAgICBpZiAoIWZpbGVDaHVua3MpIHtcbiAgICAgICAgZmlsZUNodW5rcyA9IFtdO1xuICAgICAgICBncm91cGVkLnNldChyZXN1bHQuZmlsZUluZGV4LCBmaWxlQ2h1bmtzKTtcbiAgICAgIH1cbiAgICAgIGZpbGVDaHVua3MucHVzaCh7XG4gICAgICAgIHRleHQ6IHJlc3VsdC50ZXh0LFxuICAgICAgICBzdGFydEluZGV4OiByZXN1bHQuc3RhcnRJbmRleCxcbiAgICAgICAgZW5kSW5kZXg6IHJlc3VsdC5lbmRJbmRleCxcbiAgICAgICAgdG9rZW5Fc3RpbWF0ZTogcmVzdWx0LnRva2VuRXN0aW1hdGUsXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGdyb3VwZWQ7XG4gIH1cblxuICAvLyBGYWxsYmFjazogdXNlIHBhcmFsbGVsIGltcGxlbWVudGF0aW9uXG4gIGNvbnN0IHBhcmFsbGVsUmVzdWx0cyA9IGF3YWl0IGNodW5rVGV4dHNQYXJhbGxlbCh0ZXh0cywgY2h1bmtTaXplLCBvdmVybGFwKTtcbiAgcmV0dXJuIG5ldyBNYXAocGFyYWxsZWxSZXN1bHRzLm1hcCgoY2h1bmtzLCBpZHgpID0+IFtpZHgsIGNodW5rc10pKTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSB0b2tlbiBjb3VudCAocm91Z2ggYXBwcm94aW1hdGlvbjogMSB0b2tlbiBcdTIyNDggNCBjaGFyYWN0ZXJzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXN0aW1hdGVUb2tlbkNvdW50KHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyA0KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBuYXRpdmUgY2h1bmtpbmcgaXMgYXZhaWxhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05hdGl2ZUNodW5raW5nQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNOYXRpdmVBdmFpbGFibGUoKTtcbn1cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5cbi8qKlxuICogQ2FsY3VsYXRlIFNIQS0yNTYgaGFzaCBvZiBhIGZpbGUgZm9yIGNoYW5nZSBkZXRlY3Rpb25cbiAqIFVzZXMgTm9kZS5qcyBjcnlwdG8gbW9kdWxlIChPcGVuU1NMLWJhY2tlZCwgaGlnaGx5IG9wdGltaXplZCBDIGNvZGUpXG4gKiBOb3RlOiBSdXN0IG5hdGl2ZSBoYXNoaW5nIHdhcyBiZW5jaG1hcmtlZCBhdCAwLjkzeCBzcGVlZCAoc2xvd2VyIGR1ZSB0byBGRkkgb3ZlcmhlYWQpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG5cbiAgICBzdHJlYW0ub24oXCJkYXRhXCIsIChkYXRhKSA9PiBoYXNoLnVwZGF0ZShkYXRhKSk7XG4gICAgc3RyZWFtLm9uKFwiZW5kXCIsICgpID0+IHJlc29sdmUoaGFzaC5kaWdlc3QoXCJoZXhcIikpKTtcbiAgICBzdHJlYW0ub24oXCJlcnJvclwiLCByZWplY3QpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgU0hBLTI1NiBoYXNoIG9mIG11bHRpcGxlIGZpbGVzIGluIHBhcmFsbGVsXG4gKiBVc2VzIE5vZGUuanMgY3J5cHRvIHdpdGggUHJvbWlzZS5hbGwgZm9yIHBhcmFsbGVsIGV4ZWN1dGlvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsY3VsYXRlRmlsZUhhc2hlc1BhcmFsbGVsKGZpbGVQYXRoczogc3RyaW5nW10pOiBQcm9taXNlPE1hcDxzdHJpbmcsIHN0cmluZz4+IHtcbiAgY29uc3QgaGFzaFByb21pc2VzID0gZmlsZVBhdGhzLm1hcChhc3luYyAoZmlsZVBhdGgpID0+IHtcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGgpO1xuICAgIHJldHVybiBbZmlsZVBhdGgsIGhhc2hdIGFzIFtzdHJpbmcsIHN0cmluZ107XG4gIH0pO1xuXG4gIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBQcm9taXNlLmFsbChoYXNoUHJvbWlzZXMpO1xuICByZXR1cm4gbmV3IE1hcChyZXN1bHRzKTtcbn1cblxuLyoqXG4gKiBHZXQgZmlsZSBtZXRhZGF0YSBpbmNsdWRpbmcgc2l6ZSBhbmQgbW9kaWZpY2F0aW9uIHRpbWVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEZpbGVNZXRhZGF0YShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gIHNpemU6IG51bWJlcjtcbiAgbXRpbWU6IERhdGU7XG4gIGhhc2g6IHN0cmluZztcbn0+IHtcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0KGZpbGVQYXRoKTtcbiAgY29uc3QgaGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoKTtcblxuICByZXR1cm4ge1xuICAgIHNpemU6IHN0YXRzLnNpemUsXG4gICAgbXRpbWU6IHN0YXRzLm10aW1lLFxuICAgIGhhc2gsXG4gIH07XG59XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuaW50ZXJmYWNlIEZhaWxlZEZpbGVFbnRyeSB7XG4gIGZpbGVIYXNoOiBzdHJpbmc7XG4gIHJlYXNvbjogc3RyaW5nO1xuICB0aW1lc3RhbXA6IHN0cmluZztcbn1cblxuLyoqXG4gKiBUcmFja3MgZmlsZXMgdGhhdCBmYWlsZWQgaW5kZXhpbmcgZm9yIGEgZ2l2ZW4gaGFzaCBzbyB3ZSBjYW4gc2tpcCB0aGVtXG4gKiB3aGVuIGF1dG8tcmVpbmRleGluZyB1bmNoYW5nZWQgZGF0YS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZhaWxlZEZpbGVSZWdpc3RyeSB7XG4gIHByaXZhdGUgbG9hZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgZW50cmllczogUmVjb3JkPHN0cmluZywgRmFpbGVkRmlsZUVudHJ5PiA9IHt9O1xuICBwcml2YXRlIHF1ZXVlOiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSByZWdpc3RyeVBhdGg6IHN0cmluZykge31cblxuICBwcml2YXRlIGFzeW5jIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMubG9hZGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUodGhpcy5yZWdpc3RyeVBhdGgsIFwidXRmLThcIik7XG4gICAgICB0aGlzLmVudHJpZXMgPSBKU09OLnBhcnNlKGRhdGEpID8/IHt9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5lbnRyaWVzID0ge307XG4gICAgfVxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyc2lzdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy5ta2RpcihwYXRoLmRpcm5hbWUodGhpcy5yZWdpc3RyeVBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUodGhpcy5yZWdpc3RyeVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuZW50cmllcywgbnVsbCwgMiksIFwidXRmLThcIik7XG4gIH1cblxuICBwcml2YXRlIHJ1bkV4Y2x1c2l2ZTxUPihvcGVyYXRpb246ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnF1ZXVlLnRoZW4ob3BlcmF0aW9uKTtcbiAgICB0aGlzLnF1ZXVlID0gcmVzdWx0LnRoZW4oXG4gICAgICAoKSA9PiB7fSxcbiAgICAgICgpID0+IHt9LFxuICAgICk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHJlY29yZEZhaWx1cmUoZmlsZVBhdGg6IHN0cmluZywgZmlsZUhhc2g6IHN0cmluZywgcmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICB0aGlzLmVudHJpZXNbZmlsZVBhdGhdID0ge1xuICAgICAgICBmaWxlSGFzaCxcbiAgICAgICAgcmVhc29uLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH07XG4gICAgICBhd2FpdCB0aGlzLnBlcnNpc3QoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNsZWFyRmFpbHVyZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMucnVuRXhjbHVzaXZlKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgICAgaWYgKHRoaXMuZW50cmllc1tmaWxlUGF0aF0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZW50cmllc1tmaWxlUGF0aF07XG4gICAgICAgIGF3YWl0IHRoaXMucGVyc2lzdCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RmFpbHVyZVJlYXNvbihmaWxlUGF0aDogc3RyaW5nLCBmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1tmaWxlUGF0aF07XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5LmZpbGVIYXNoID09PSBmaWxlSGFzaCA/IGVudHJ5LnJlYXNvbiA6IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IFBRdWV1ZSBmcm9tIFwicC1xdWV1ZVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBzY2FuRGlyZWN0b3J5LCB0eXBlIFNjYW5uZWRGaWxlIH0gZnJvbSBcIi4vZmlsZVNjYW5uZXJcIjtcbmltcG9ydCB7IHBhcnNlRG9jdW1lbnQsIHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4uL3BhcnNlcnMvZG9jdW1lbnRQYXJzZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlLCB0eXBlIERvY3VtZW50Q2h1bmsgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcbmltcG9ydCB7IGNodW5rVGV4dHNCYXRjaCwgdHlwZSBDaHVua1Jlc3VsdCB9IGZyb20gXCIuLi91dGlscy90ZXh0Q2h1bmtlclwiO1xuaW1wb3J0IHsgY2FsY3VsYXRlRmlsZUhhc2ggfSBmcm9tIFwiLi4vdXRpbHMvZmlsZUhhc2hcIjtcbmltcG9ydCB7IHR5cGUgRW1iZWRkaW5nRHluYW1pY0hhbmRsZSwgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBGYWlsZWRGaWxlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdXRpbHMvZmFpbGVkRmlsZVJlZ2lzdHJ5XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdQcm9ncmVzcyB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgcHJvY2Vzc2VkRmlsZXM6IG51bWJlcjtcbiAgY3VycmVudEZpbGU6IHN0cmluZztcbiAgc3RhdHVzOiBcInNjYW5uaW5nXCIgfCBcImluZGV4aW5nXCIgfCBcImNvbXBsZXRlXCIgfCBcImVycm9yXCI7XG4gIHN1Y2Nlc3NmdWxGaWxlcz86IG51bWJlcjtcbiAgZmFpbGVkRmlsZXM/OiBudW1iZXI7XG4gIHNraXBwZWRGaWxlcz86IG51bWJlcjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdSZXN1bHQge1xuICB0b3RhbEZpbGVzOiBudW1iZXI7XG4gIHN1Y2Nlc3NmdWxGaWxlczogbnVtYmVyO1xuICBmYWlsZWRGaWxlczogbnVtYmVyO1xuICBza2lwcGVkRmlsZXM6IG51bWJlcjtcbiAgdXBkYXRlZEZpbGVzOiBudW1iZXI7XG4gIG5ld0ZpbGVzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdPcHRpb25zIHtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlOiBWZWN0b3JTdG9yZTtcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgZW1iZWRkaW5nTW9kZWw6IEVtYmVkZGluZ0R5bmFtaWNIYW5kbGU7XG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQ7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIGF1dG9SZWluZGV4OiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgZmFpbHVyZVJlcG9ydFBhdGg/OiBzdHJpbmc7XG4gIGFib3J0U2lnbmFsPzogQWJvcnRTaWduYWw7XG4gIG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IEluZGV4aW5nUHJvZ3Jlc3MpID0+IHZvaWQ7XG59XG5cbnR5cGUgRmFpbHVyZVJlYXNvbiA9IFBhcnNlRmFpbHVyZVJlYXNvbiB8IFwiaW5kZXguY2h1bmstZW1wdHlcIiB8IFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiIHwgXCJpbmRleC5lbWJlZGRpbmctZXJyb3JcIjtcblxuZnVuY3Rpb24gY29lcmNlRW1iZWRkaW5nVmVjdG9yKHJhdzogdW5rbm93bik6IG51bWJlcltdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkocmF3KSkge1xuICAgIHJldHVybiByYXcubWFwKGFzc2VydEZpbml0ZU51bWJlcik7XG4gIH1cblxuICBpZiAodHlwZW9mIHJhdyA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBbYXNzZXJ0RmluaXRlTnVtYmVyKHJhdyldO1xuICB9XG5cbiAgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSBcIm9iamVjdFwiKSB7XG4gICAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhyYXcpKSB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShyYXcgYXMgdW5rbm93biBhcyBBcnJheUxpa2U8bnVtYmVyPikubWFwKGFzc2VydEZpbml0ZU51bWJlcik7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuZGlkYXRlID1cbiAgICAgIChyYXcgYXMgYW55KS5lbWJlZGRpbmcgPz9cbiAgICAgIChyYXcgYXMgYW55KS52ZWN0b3IgPz9cbiAgICAgIChyYXcgYXMgYW55KS5kYXRhID8/XG4gICAgICAodHlwZW9mIChyYXcgYXMgYW55KS50b0FycmF5ID09PSBcImZ1bmN0aW9uXCIgPyAocmF3IGFzIGFueSkudG9BcnJheSgpIDogdW5kZWZpbmVkKSA/P1xuICAgICAgKHR5cGVvZiAocmF3IGFzIGFueSkudG9KU09OID09PSBcImZ1bmN0aW9uXCIgPyAocmF3IGFzIGFueSkudG9KU09OKCkgOiB1bmRlZmluZWQpO1xuXG4gICAgaWYgKGNhbmRpZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gY29lcmNlRW1iZWRkaW5nVmVjdG9yKGNhbmRpZGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKFwiRW1iZWRkaW5nIHByb3ZpZGVyIHJldHVybmVkIGEgbm9uLW51bWVyaWMgdmVjdG9yXCIpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRGaW5pdGVOdW1iZXIodmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCBudW0gPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG51bSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbWJlZGRpbmcgdmVjdG9yIGNvbnRhaW5zIGEgbm9uLWZpbml0ZSB2YWx1ZVwiKTtcbiAgfVxuICByZXR1cm4gbnVtO1xufVxuXG5leHBvcnQgY2xhc3MgSW5kZXhNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBvcHRpb25zOiBJbmRleGluZ09wdGlvbnM7XG4gIHByaXZhdGUgZmFpbHVyZVJlYXNvbkNvdW50czogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICBwcml2YXRlIGZhaWxlZEZpbGVSZWdpc3RyeTogRmFpbGVkRmlsZVJlZ2lzdHJ5O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEluZGV4aW5nT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkgPSBuZXcgRmFpbGVkRmlsZVJlZ2lzdHJ5KFxuICAgICAgcGF0aC5qb2luKG9wdGlvbnMudmVjdG9yU3RvcmVEaXIsIFwiLmJpZy1yYWctZmFpbHVyZXMuanNvblwiKSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBpbmRleGluZyBwcm9jZXNzXG4gICAqIFVzZXMgdHdvLXBoYXNlIHByb2Nlc3NpbmcgZm9yIG1heGltdW0gcGVyZm9ybWFuY2U6XG4gICAqIFBoYXNlIDE6IFBhcnNlIGFsbCBkb2N1bWVudHMgYW5kIGNvbGxlY3QgdGV4dHNcbiAgICogUGhhc2UgMjogQmF0Y2ggY2h1bmsgYWxsIHRleHRzIGluIHNpbmdsZSBuYXRpdmUgY2FsbCAoYXZvaWRzIEZGSSBvdmVyaGVhZClcbiAgICogUGhhc2UgMzogQmF0Y2ggZW1iZWQgYW5kIGluZGV4IGFsbCBjaHVua3NcbiAgICovXG4gIGFzeW5jIGluZGV4KCk6IFByb21pc2U8SW5kZXhpbmdSZXN1bHQ+IHtcbiAgICBjb25zdCB7IGRvY3VtZW50c0RpciwgdmVjdG9yU3RvcmUsIGNodW5rU2l6ZSwgY2h1bmtPdmVybGFwLCBvblByb2dyZXNzIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUludmVudG9yeSA9IGF3YWl0IHZlY3RvclN0b3JlLmdldEZpbGVIYXNoSW52ZW50b3J5KCk7XG5cbiAgICAgIC8vIFN0ZXAgMTogU2NhbiBkaXJlY3RvcnlcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IDAsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcInNjYW5uaW5nXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHNjYW5EaXJlY3RvcnkoZG9jdW1lbnRzRGlyLCAoc2Nhbm5lZCwgZm91bmQpID0+IHtcbiAgICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZvdW5kLFxuICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgICBjdXJyZW50RmlsZTogYFNjYW5uZWQgJHtzY2FubmVkfSBmaWxlcy4uLmAsXG4gICAgICAgICAgICBzdGF0dXM6IFwic2Nhbm5pbmdcIixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMub3B0aW9ucy5hYm9ydFNpZ25hbD8udGhyb3dJZkFib3J0ZWQoKTtcbiAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2ZpbGVzLmxlbmd0aH0gZmlsZXMgdG8gcHJvY2Vzc2ApO1xuXG4gICAgICAvLyBTdGVwIDI6IFBhcnNlIGFsbCBkb2N1bWVudHMgYW5kIGNvbGxlY3QgdGV4dHMgKFBoYXNlIDEpXG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiUGFyc2luZyBkb2N1bWVudHMuLi5cIixcbiAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGludGVyZmFjZSBQYXJzZWREb2N1bWVudCB7XG4gICAgICAgIGZpbGU6IFNjYW5uZWRGaWxlO1xuICAgICAgICBmaWxlSGFzaDogc3RyaW5nO1xuICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgIG91dGNvbWU6IFwibmV3XCIgfCBcInVwZGF0ZWRcIiB8IFwic2tpcHBlZFwiIHwgXCJmYWlsZWRcIjtcbiAgICAgICAgZmFpbHVyZVJlYXNvbj86IEZhaWx1cmVSZWFzb247XG4gICAgICAgIGZhaWx1cmVEZXRhaWxzPzogc3RyaW5nO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBwYXJzZWREb2NzOiBQYXJzZWREb2N1bWVudFtdID0gW107XG4gICAgICBsZXQgcGFyc2VDb3VudCA9IDA7XG5cbiAgICAgIC8vIFBhcnNlIGRvY3VtZW50cyB3aXRoIGNvbmN1cnJlbmN5IGNvbnRyb2xcbiAgICAgIGNvbnN0IHBhcnNlUXVldWUgPSBuZXcgUFF1ZXVlKHsgY29uY3VycmVuY3k6IHRoaXMub3B0aW9ucy5tYXhDb25jdXJyZW50IH0pO1xuICAgICAgY29uc3QgcGFyc2VUYXNrcyA9IGZpbGVzLm1hcCgoZmlsZSkgPT5cbiAgICAgICAgcGFyc2VRdWV1ZS5hZGQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRoaXMub3B0aW9ucy5hYm9ydFNpZ25hbD8udGhyb3dJZkFib3J0ZWQoKTtcblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBmaWxlSGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGUucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZ0hhc2hlcyA9IGZpbGVJbnZlbnRvcnkuZ2V0KGZpbGUucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBoYXNTYW1lSGFzaCA9IGV4aXN0aW5nSGFzaGVzPy5oYXMoZmlsZUhhc2gpID8/IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBDaGVjayBpZiBhbHJlYWR5IGluZGV4ZWRcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1JlaW5kZXggJiYgaGFzU2FtZUhhc2gpIHtcbiAgICAgICAgICAgICAgcGFyc2VkRG9jcy5wdXNoKHsgZmlsZSwgZmlsZUhhc2gsIHRleHQ6IFwiXCIsIG91dGNvbWU6IFwic2tpcHBlZFwiIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBwcmV2aW91cyBmYWlsdXJlXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF1dG9SZWluZGV4KSB7XG4gICAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzRmFpbHVyZSA9IGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LmdldEZhaWx1cmVSZWFzb24oZmlsZS5wYXRoLCBmaWxlSGFzaCk7XG4gICAgICAgICAgICAgIGlmIChwcmV2aW91c0ZhaWx1cmUpIHtcbiAgICAgICAgICAgICAgICBwYXJzZWREb2NzLnB1c2goeyBmaWxlLCBmaWxlSGFzaCwgdGV4dDogXCJcIiwgb3V0Y29tZTogXCJza2lwcGVkXCIgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBhcnNlIGRvY3VtZW50XG4gICAgICAgICAgICBjb25zdCBwYXJzZWRSZXN1bHQgPSBhd2FpdCBwYXJzZURvY3VtZW50KGZpbGUucGF0aCwgdGhpcy5vcHRpb25zLmVuYWJsZU9DUiwgdGhpcy5vcHRpb25zLmNsaWVudCk7XG4gICAgICAgICAgICBpZiAoIXBhcnNlZFJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgIHBhcnNlZERvY3MucHVzaCh7XG4gICAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgICBmaWxlSGFzaCxcbiAgICAgICAgICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICAgICAgICAgIG91dGNvbWU6IFwiZmFpbGVkXCIsXG4gICAgICAgICAgICAgICAgZmFpbHVyZVJlYXNvbjogcGFyc2VkUmVzdWx0LnJlYXNvbixcbiAgICAgICAgICAgICAgICBmYWlsdXJlRGV0YWlsczogcGFyc2VkUmVzdWx0LmRldGFpbHMsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhcnNlZERvY3MucHVzaCh7XG4gICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICAgIGZpbGVIYXNoLFxuICAgICAgICAgICAgICB0ZXh0OiBwYXJzZWRSZXN1bHQuZG9jdW1lbnQudGV4dCxcbiAgICAgICAgICAgICAgb3V0Y29tZTogaGFzU2FtZUhhc2ggPyBcInVwZGF0ZWRcIiA6IFwibmV3XCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcGFyc2VkRG9jcy5wdXNoKHtcbiAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgZmlsZUhhc2g6IFwiXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgIG91dGNvbWU6IFwiZmFpbGVkXCIsXG4gICAgICAgICAgICAgIGZhaWx1cmVSZWFzb246IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgICAgICAgICAgZmFpbHVyZURldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhcnNlQ291bnQrKztcbiAgICAgICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IHBhcnNlQ291bnQsXG4gICAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBgUGFyc2VkICR7cGFyc2VDb3VudH0vJHtmaWxlcy5sZW5ndGh9Li4uYCxcbiAgICAgICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChwYXJzZVRhc2tzKTtcblxuICAgICAgLy8gUmVjb3JkIHBhcnNlIGZhaWx1cmVzXG4gICAgICBmb3IgKGNvbnN0IGRvYyBvZiBwYXJzZWREb2NzKSB7XG4gICAgICAgIGlmIChkb2Mub3V0Y29tZSA9PT0gXCJmYWlsZWRcIiAmJiBkb2MuZmFpbHVyZVJlYXNvbikge1xuICAgICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShkb2MuZmFpbHVyZVJlYXNvbiwgZG9jLmZhaWx1cmVEZXRhaWxzLCBkb2MuZmlsZSk7XG4gICAgICAgICAgaWYgKGRvYy5maWxlSGFzaCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShkb2MuZmlsZS5wYXRoLCBkb2MuZmlsZUhhc2gsIGRvYy5mYWlsdXJlUmVhc29uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gU3RlcCAzOiBCYXRjaCBjaHVuayBhbGwgdGV4dHMgKFBoYXNlIDIpIC0gU0lOR0xFIE5BVElWRSBDQUxMXG4gICAgICBjb25zdCB0ZXh0c1RvQ2h1bmsgPSBwYXJzZWREb2NzLmZpbHRlcihkID0+IGQub3V0Y29tZSAhPT0gXCJza2lwcGVkXCIgJiYgZC5vdXRjb21lICE9PSBcImZhaWxlZFwiKS5tYXAoZCA9PiBkLnRleHQpO1xuICAgICAgY29uc3QgdmFsaWREb2NzID0gcGFyc2VkRG9jcy5maWx0ZXIoZCA9PiBkLm91dGNvbWUgIT09IFwic2tpcHBlZFwiICYmIGQub3V0Y29tZSAhPT0gXCJmYWlsZWRcIik7XG5cbiAgICAgIGxldCBjaHVua2VkVGV4dHM6IE1hcDxudW1iZXIsIENodW5rUmVzdWx0W10+ID0gbmV3IE1hcCgpO1xuXG4gICAgICBpZiAodGV4dHNUb0NodW5rLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYEJhdGNoIGNodW5raW5nICR7dGV4dHNUb0NodW5rLmxlbmd0aH0gZG9jdW1lbnRzLi4uYCk7XG4gICAgICAgIGNodW5rZWRUZXh0cyA9IGF3YWl0IGNodW5rVGV4dHNCYXRjaCh0ZXh0c1RvQ2h1bmssIGNodW5rU2l6ZSwgY2h1bmtPdmVybGFwKTtcbiAgICAgIH1cblxuICAgICAgLy8gU3RlcCA0OiBFbWJlZCBhbmQgaW5kZXggQUxMIGNodW5rcyBpbiBhIHNpbmdsZSBiYXRjaCAoUGhhc2UgMylcbiAgICAgIC8vIFRoaXMgaXMgdGhlIEtFWSBvcHRpbWl6YXRpb24gLSBvbmUgZW1iZWRkaW5nIEFQSSBjYWxsIGZvciBBTEwgY2h1bmtzXG4gICAgICBsZXQgc3VjY2Vzc0NvdW50ID0gMDtcbiAgICAgIGxldCBmYWlsQ291bnQgPSAwO1xuICAgICAgbGV0IHNraXBwZWRDb3VudCA9IHBhcnNlZERvY3MuZmlsdGVyKGQgPT4gZC5vdXRjb21lID09PSBcInNraXBwZWRcIikubGVuZ3RoO1xuICAgICAgbGV0IHVwZGF0ZWRDb3VudCA9IDA7XG4gICAgICBsZXQgbmV3Q291bnQgPSAwO1xuXG4gICAgICAvLyBDb2xsZWN0IEFMTCBjaHVua3MgZnJvbSBBTEwgZmlsZXMgd2l0aCB0aGVpciBtZXRhZGF0YVxuICAgICAgaW50ZXJmYWNlIENodW5rV2l0aE1ldGFkYXRhIHtcbiAgICAgICAgZG9jSW5kZXg6IG51bWJlcjtcbiAgICAgICAgY2h1bmtJbmRleDogbnVtYmVyO1xuICAgICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgICAgIGRvYzogdHlwZW9mIHZhbGlkRG9jc1swXTtcbiAgICAgICAgY2h1bms6IENodW5rUmVzdWx0O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBhbGxDaHVua3M6IENodW5rV2l0aE1ldGFkYXRhW10gPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsaWREb2NzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IHZhbGlkRG9jc1tpXTtcbiAgICAgICAgY29uc3QgY2h1bmtzID0gY2h1bmtlZFRleHRzLmdldChpKSB8fCBbXTtcblxuICAgICAgICBpZiAoY2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBObyBjaHVua3MgY3JlYXRlZCBmcm9tICR7ZG9jLmZpbGUubmFtZX1gKTtcbiAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXCJpbmRleC5jaHVuay1lbXB0eVwiLCBcImNodW5rVGV4dHNCYXRjaCBwcm9kdWNlZCAwIGNodW5rc1wiLCBkb2MuZmlsZSk7XG4gICAgICAgICAgaWYgKGRvYy5maWxlSGFzaCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShkb2MuZmlsZS5wYXRoLCBkb2MuZmlsZUhhc2gsIFwiaW5kZXguY2h1bmstZW1wdHlcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZhaWxDb3VudCsrO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjaHVua3MubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBhbGxDaHVua3MucHVzaCh7XG4gICAgICAgICAgICBkb2NJbmRleDogaSxcbiAgICAgICAgICAgIGNodW5rSW5kZXg6IGosXG4gICAgICAgICAgICB0ZXh0OiBjaHVua3Nbal0udGV4dCxcbiAgICAgICAgICAgIGRvYyxcbiAgICAgICAgICAgIGNodW5rOiBjaHVua3Nbal0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coYEVtYmVkZGluZyAke2FsbENodW5rcy5sZW5ndGh9IGNodW5rcyBmcm9tICR7dmFsaWREb2NzLmxlbmd0aH0gZmlsZXMuLi5gKTtcblxuICAgICAgLy8gRW1iZWQgaW4gYmF0Y2hlcyBvZiAyMDAgZm9yIG9wdGltYWwgbmV0d29yayBwZXJmb3JtYW5jZSAoMi43MXggc3BlZWR1cClcbiAgICAgIC8vIFNlZSBGSU5BTF9QRVJGT1JNQU5DRV9SRVBPUlQubWQgZm9yIGJlbmNobWFyayBkZXRhaWxzXG4gICAgICBjb25zdCBFTUJFRERJTkdfQkFUQ0hfU0laRSA9IDIwMDtcbiAgICAgIFxuICAgICAgaWYgKGFsbENodW5rcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgYWxsVGV4dHMgPSBhbGxDaHVua3MubWFwKGMgPT4gYy50ZXh0KTtcbiAgICAgICAgICBjb25zdCBhbGxFbWJlZGRpbmdzOiBhbnlbXSA9IFtdO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEVtYmVkIGluIGJhdGNoZXMgdG8gYXZvaWQgdGltZW91dCBhbmQgaW1wcm92ZSByZWxpYWJpbGl0eVxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsVGV4dHMubGVuZ3RoOyBpICs9IEVNQkVERElOR19CQVRDSF9TSVpFKSB7XG4gICAgICAgICAgICBjb25zdCBiYXRjaCA9IGFsbFRleHRzLnNsaWNlKGksIGkgKyBFTUJFRERJTkdfQkFUQ0hfU0laRSk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLm9wdGlvbnMuZW1iZWRkaW5nTW9kZWwuZW1iZWQoYmF0Y2gpO1xuICAgICAgICAgICAgYWxsRW1iZWRkaW5ncy5wdXNoKC4uLnJlc3VsdCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gR3JvdXAgcmVzdWx0cyBieSBmaWxlIGZvciB2ZWN0b3Igc3RvcmUgaW5zZXJ0aW9uXG4gICAgICAgICAgY29uc3QgY2h1bmtzQnlGaWxlID0gbmV3IE1hcDxudW1iZXIsIERvY3VtZW50Q2h1bmtbXT4oKTtcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbEVtYmVkZGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNodW5rSW5mbyA9IGFsbENodW5rc1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGVtYmVkZGluZyA9IGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihhbGxFbWJlZGRpbmdzW2ldLmVtYmVkZGluZyk7XG5cbiAgICAgICAgICAgIGxldCBmaWxlQ2h1bmtzID0gY2h1bmtzQnlGaWxlLmdldChjaHVua0luZm8uZG9jSW5kZXgpO1xuICAgICAgICAgICAgaWYgKCFmaWxlQ2h1bmtzKSB7XG4gICAgICAgICAgICAgIGZpbGVDaHVua3MgPSBbXTtcbiAgICAgICAgICAgICAgY2h1bmtzQnlGaWxlLnNldChjaHVua0luZm8uZG9jSW5kZXgsIGZpbGVDaHVua3MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmaWxlQ2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICBpZDogYCR7Y2h1bmtJbmZvLmRvYy5maWxlSGFzaH0tJHtjaHVua0luZm8uY2h1bmtJbmRleH1gLFxuICAgICAgICAgICAgICB0ZXh0OiBjaHVua0luZm8udGV4dCxcbiAgICAgICAgICAgICAgdmVjdG9yOiBlbWJlZGRpbmcsXG4gICAgICAgICAgICAgIGZpbGVQYXRoOiBjaHVua0luZm8uZG9jLmZpbGUucGF0aCxcbiAgICAgICAgICAgICAgZmlsZU5hbWU6IGNodW5rSW5mby5kb2MuZmlsZS5uYW1lLFxuICAgICAgICAgICAgICBmaWxlSGFzaDogY2h1bmtJbmZvLmRvYy5maWxlSGFzaCxcbiAgICAgICAgICAgICAgY2h1bmtJbmRleDogY2h1bmtJbmZvLmNodW5rSW5kZXgsXG4gICAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBjaHVua0luZm8uZG9jLmZpbGUuZXh0ZW5zaW9uLFxuICAgICAgICAgICAgICAgIHNpemU6IGNodW5rSW5mby5kb2MuZmlsZS5zaXplLFxuICAgICAgICAgICAgICAgIG10aW1lOiBjaHVua0luZm8uZG9jLmZpbGUubXRpbWUudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzdGFydEluZGV4OiBjaHVua0luZm8uY2h1bmsuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICBlbmRJbmRleDogY2h1bmtJbmZvLmNodW5rLmVuZEluZGV4LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWRkIGFsbCBjaHVua3MgdG8gdmVjdG9yIHN0b3JlXG4gICAgICAgICAgZm9yIChjb25zdCBbZG9jSW5kZXgsIGRvY3VtZW50Q2h1bmtzXSBvZiBjaHVua3NCeUZpbGUuZW50cmllcygpKSB7XG4gICAgICAgICAgICBjb25zdCBkb2MgPSB2YWxpZERvY3NbZG9jSW5kZXhdO1xuICAgICAgICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuYWRkQ2h1bmtzKGRvY3VtZW50Q2h1bmtzKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBJbmRleGVkICR7ZG9jdW1lbnRDaHVua3MubGVuZ3RofSBjaHVua3MgZnJvbSAke2RvYy5maWxlLm5hbWV9YCk7XG5cbiAgICAgICAgICAgIC8vIFVwZGF0ZSBpbnZlbnRvcnlcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSGFzaGVzID0gZmlsZUludmVudG9yeS5nZXQoZG9jLmZpbGUucGF0aCk7XG4gICAgICAgICAgICBpZiAoIWV4aXN0aW5nSGFzaGVzKSB7XG4gICAgICAgICAgICAgIGZpbGVJbnZlbnRvcnkuc2V0KGRvYy5maWxlLnBhdGgsIG5ldyBTZXQoW2RvYy5maWxlSGFzaF0pKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nSGFzaGVzLmFkZChkb2MuZmlsZUhhc2gpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkuY2xlYXJGYWlsdXJlKGRvYy5maWxlLnBhdGgpO1xuXG4gICAgICAgICAgICBzdWNjZXNzQ291bnQrKztcbiAgICAgICAgICAgIGlmIChkb2Mub3V0Y29tZSA9PT0gXCJuZXdcIikgbmV3Q291bnQrKztcbiAgICAgICAgICAgIGVsc2UgdXBkYXRlZENvdW50Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGVtYmVkZGluZyBhbGwgY2h1bmtzOmAsIGVycm9yKTtcbiAgICAgICAgICAvLyBNYXJrIGFsbCBhcyBmYWlsZWRcbiAgICAgICAgICBmYWlsQ291bnQgPSB2YWxpZERvY3MubGVuZ3RoO1xuICAgICAgICAgIGZvciAoY29uc3QgZG9jIG9mIHZhbGlkRG9jcykge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgICAgICBcImluZGV4LmVtYmVkZGluZy1lcnJvclwiLFxuICAgICAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgIGRvYy5maWxlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChkb2MuZmlsZUhhc2gpIHtcbiAgICAgICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShkb2MuZmlsZS5wYXRoLCBkb2MuZmlsZUhhc2gsIFwiaW5kZXguZW1iZWRkaW5nLWVycm9yXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiY29tcGxldGVcIixcbiAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2dGYWlsdXJlU3VtbWFyeSgpO1xuICAgICAgYXdhaXQgdGhpcy53cml0ZUZhaWx1cmVSZXBvcnQoe1xuICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgdXBkYXRlZEZpbGVzOiB1cGRhdGVkQ291bnQsXG4gICAgICAgIG5ld0ZpbGVzOiBuZXdDb3VudCxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYEluZGV4aW5nIGNvbXBsZXRlOiAke3N1Y2Nlc3NDb3VudH0vJHtmaWxlcy5sZW5ndGh9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2ZhaWxDb3VudH0gZmFpbGVkLCBza2lwcGVkPSR7c2tpcHBlZENvdW50fSwgdXBkYXRlZD0ke3VwZGF0ZWRDb3VudH0sIG5ldz0ke25ld0NvdW50fSlgLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIHVwZGF0ZWRGaWxlczogdXBkYXRlZENvdW50LFxuICAgICAgICBuZXdGaWxlczogbmV3Q291bnQsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZHVyaW5nIGluZGV4aW5nOlwiLCBlcnJvcik7XG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRGYWlsdXJlKHJlYXNvbjogRmFpbHVyZVJlYXNvbiwgZGV0YWlsczogc3RyaW5nIHwgdW5kZWZpbmVkLCBmaWxlOiBTY2FubmVkRmlsZSkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXSA/PyAwO1xuICAgIHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dID0gY3VycmVudCArIDE7XG4gICAgY29uc3QgZGV0YWlsU3VmZml4ID0gZGV0YWlscyA/IGAgZGV0YWlscz0ke2RldGFpbHN9YCA6IFwiXCI7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIEZhaWxlZCB0byBwYXJzZSAke2ZpbGUubmFtZX0gKHJlYXNvbj0ke3JlYXNvbn0sIGNvdW50PSR7dGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl19KSR7ZGV0YWlsU3VmZml4fWAsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9nRmFpbHVyZVN1bW1hcnkoKSB7XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50cyk7XG4gICAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIltCaWdSQUddIE5vIHBhcnNpbmcgZmFpbHVyZXMgcmVjb3JkZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIltCaWdSQUddIEZhaWx1cmUgcmVhc29uIHN1bW1hcnk6XCIpO1xuICAgIGZvciAoY29uc3QgW3JlYXNvbiwgY291bnRdIG9mIGVudHJpZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgIC0gJHtyZWFzb259OiAke2NvdW50fWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgd3JpdGVGYWlsdXJlUmVwb3J0KHN1bW1hcnk6IEluZGV4aW5nUmVzdWx0KSB7XG4gICAgY29uc3QgcmVwb3J0UGF0aCA9IHRoaXMub3B0aW9ucy5mYWlsdXJlUmVwb3J0UGF0aDtcbiAgICBpZiAoIXJlcG9ydFBhdGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgLi4uc3VtbWFyeSxcbiAgICAgIGRvY3VtZW50c0RpcjogdGhpcy5vcHRpb25zLmRvY3VtZW50c0RpcixcbiAgICAgIGZhaWx1cmVSZWFzb25zOiB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHMsXG4gICAgICBnZW5lcmF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIocGF0aC5kaXJuYW1lKHJlcG9ydFBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShyZXBvcnRQYXRoLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcbiAgICAgIGNvbnNvbGUubG9nKGBbQmlnUkFHXSBXcm90ZSBmYWlsdXJlIHJlcG9ydCB0byAke3JlcG9ydFBhdGh9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtCaWdSQUddIEZhaWxlZCB0byB3cml0ZSBmYWlsdXJlIHJlcG9ydCB0byAke3JlcG9ydFBhdGh9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgSW5kZXhNYW5hZ2VyLCB0eXBlIEluZGV4aW5nUHJvZ3Jlc3MsIHR5cGUgSW5kZXhpbmdSZXN1bHQgfSBmcm9tIFwiLi9pbmRleE1hbmFnZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlIH0gZnJvbSBcIi4uL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSW5kZXhpbmdQYXJhbXMge1xuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50O1xuICBhYm9ydFNpZ25hbDogQWJvcnRTaWduYWw7XG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBjaHVua1NpemU6IG51bWJlcjtcbiAgY2h1bmtPdmVybGFwOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgZW5hYmxlT0NSOiBib29sZWFuO1xuICBhdXRvUmVpbmRleDogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIGZvcmNlUmVpbmRleD86IGJvb2xlYW47XG4gIHZlY3RvclN0b3JlPzogVmVjdG9yU3RvcmU7XG4gIG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IEluZGV4aW5nUHJvZ3Jlc3MpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSW5kZXhpbmdSZXN1bHQge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIHN0YXRzOiB7XG4gICAgdG90YWxDaHVua3M6IG51bWJlcjtcbiAgICB1bmlxdWVGaWxlczogbnVtYmVyO1xuICB9O1xuICBpbmRleGluZ1Jlc3VsdDogSW5kZXhpbmdSZXN1bHQ7XG59XG5cbi8qKlxuICogU2hhcmVkIGhlbHBlciB0aGF0IHJ1bnMgdGhlIGZ1bGwgaW5kZXhpbmcgcGlwZWxpbmUuXG4gKiBBbGxvd3MgcmV1c2UgYWNyb3NzIHRoZSBtYW51YWwgdG9vbCwgY29uZmlnLXRyaWdnZXJlZCBpbmRleGluZywgYW5kIGF1dG9tYXRpYyBib290c3RyYXBwaW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSW5kZXhpbmdKb2Ioe1xuICBjbGllbnQsXG4gIGFib3J0U2lnbmFsLFxuICBkb2N1bWVudHNEaXIsXG4gIHZlY3RvclN0b3JlRGlyLFxuICBjaHVua1NpemUsXG4gIGNodW5rT3ZlcmxhcCxcbiAgbWF4Q29uY3VycmVudCxcbiAgZW5hYmxlT0NSLFxuICBhdXRvUmVpbmRleCxcbiAgcGFyc2VEZWxheU1zLFxuICBmb3JjZVJlaW5kZXggPSBmYWxzZSxcbiAgdmVjdG9yU3RvcmU6IGV4aXN0aW5nVmVjdG9yU3RvcmUsXG4gIG9uUHJvZ3Jlc3MsXG59OiBSdW5JbmRleGluZ1BhcmFtcyk6IFByb21pc2U8UnVuSW5kZXhpbmdSZXN1bHQ+IHtcbiAgY29uc3QgdmVjdG9yU3RvcmUgPSBleGlzdGluZ1ZlY3RvclN0b3JlID8/IG5ldyBWZWN0b3JTdG9yZSh2ZWN0b3JTdG9yZURpcik7XG4gIGNvbnN0IG93bnNWZWN0b3JTdG9yZSA9IGV4aXN0aW5nVmVjdG9yU3RvcmUgPT09IHVuZGVmaW5lZDtcblxuICBpZiAob3duc1ZlY3RvclN0b3JlKSB7XG4gICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICB9XG5cbiAgY29uc3QgZW1iZWRkaW5nTW9kZWwgPSBhd2FpdCBjbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgIFwibm9taWMtYWkvbm9taWMtZW1iZWQtdGV4dC12MS41LUdHVUZcIixcbiAgICB7IHNpZ25hbDogYWJvcnRTaWduYWwgfSxcbiAgKTtcblxuICBjb25zdCBpbmRleE1hbmFnZXIgPSBuZXcgSW5kZXhNYW5hZ2VyKHtcbiAgICBkb2N1bWVudHNEaXIsXG4gICAgdmVjdG9yU3RvcmUsXG4gICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgZW1iZWRkaW5nTW9kZWwsXG4gICAgY2xpZW50LFxuICAgIGNodW5rU2l6ZSxcbiAgICBjaHVua092ZXJsYXAsXG4gICAgbWF4Q29uY3VycmVudCxcbiAgICBlbmFibGVPQ1IsXG4gICAgYXV0b1JlaW5kZXg6IGZvcmNlUmVpbmRleCA/IGZhbHNlIDogYXV0b1JlaW5kZXgsXG4gICAgcGFyc2VEZWxheU1zLFxuICAgIGFib3J0U2lnbmFsLFxuICAgIG9uUHJvZ3Jlc3MsXG4gIH0pO1xuXG4gIGNvbnN0IGluZGV4aW5nUmVzdWx0ID0gYXdhaXQgaW5kZXhNYW5hZ2VyLmluZGV4KCk7XG4gIGNvbnN0IHN0YXRzID0gYXdhaXQgdmVjdG9yU3RvcmUuZ2V0U3RhdHMoKTtcblxuICBpZiAob3duc1ZlY3RvclN0b3JlKSB7XG4gICAgYXdhaXQgdmVjdG9yU3RvcmUuY2xvc2UoKTtcbiAgfVxuXG4gIGNvbnN0IHN1bW1hcnkgPSBgSW5kZXhpbmcgY29tcGxldGVkIVxcblxcbmAgK1xuICAgIGBcdTIwMjIgU3VjY2Vzc2Z1bGx5IGluZGV4ZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgQ2h1bmtzIGluIHN0b3JlOiAke3N0YXRzLnRvdGFsQ2h1bmtzfVxcbmAgK1xuICAgIGBcdTIwMjIgVW5pcXVlIGZpbGVzIGluIHN0b3JlOiAke3N0YXRzLnVuaXF1ZUZpbGVzfWA7XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5LFxuICAgIHN0YXRzLFxuICAgIGluZGV4aW5nUmVzdWx0LFxuICB9O1xufVxuXG4iLCAiaW1wb3J0IHtcbiAgdHlwZSBDaGF0TWVzc2FnZSxcbiAgdHlwZSBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxufSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcywgREVGQVVMVF9QUk9NUFRfVEVNUExBVEUgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlIH0gZnJvbSBcIi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcbmltcG9ydCB7IHBlcmZvcm1TYW5pdHlDaGVja3MgfSBmcm9tIFwiLi91dGlscy9zYW5pdHlDaGVja3NcIjtcbmltcG9ydCB7IHRyeVN0YXJ0SW5kZXhpbmcsIGZpbmlzaEluZGV4aW5nIH0gZnJvbSBcIi4vdXRpbHMvaW5kZXhpbmdMb2NrXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBydW5JbmRleGluZ0pvYiB9IGZyb20gXCIuL2luZ2VzdGlvbi9ydW5JbmRleGluZ1wiO1xuXG4vKipcbiAqIENoZWNrIHRoZSBhYm9ydCBzaWduYWwgYW5kIHRocm93IGlmIHRoZSByZXF1ZXN0IGhhcyBiZWVuIGNhbmNlbGxlZC5cbiAqIFRoaXMgZ2l2ZXMgTE0gU3R1ZGlvIHRoZSBvcHBvcnR1bml0eSB0byBzdG9wIHRoZSBwcmVwcm9jZXNzb3IgcHJvbXB0bHkuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQWJvcnQoc2lnbmFsOiBBYm9ydFNpZ25hbCk6IHZvaWQge1xuICBpZiAoc2lnbmFsLmFib3J0ZWQpIHtcbiAgICB0aHJvdyBzaWduYWwucmVhc29uID8/IG5ldyBET01FeGNlcHRpb24oXCJBYm9ydGVkXCIsIFwiQWJvcnRFcnJvclwiKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZXJyb3IgaXMgYW4gYWJvcnQvY2FuY2VsbGF0aW9uIGVycm9yIHRoYXQgc2hvdWxkIGJlIHJlLXRocm93bi5cbiAqL1xuZnVuY3Rpb24gaXNBYm9ydEVycm9yKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikgcmV0dXJuIHRydWU7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZSA9PT0gXCJBYm9ydGVkXCIpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZVRleHQodGV4dDogc3RyaW5nLCBtYXhMaW5lczogbnVtYmVyID0gMywgbWF4Q2hhcnM6IG51bWJlciA9IDQwMCk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pLmZpbHRlcihsaW5lID0+IGxpbmUudHJpbSgpICE9PSBcIlwiKTtcbiAgY29uc3QgY2xpcHBlZExpbmVzID0gbGluZXMuc2xpY2UoMCwgbWF4TGluZXMpO1xuICBsZXQgY2xpcHBlZCA9IGNsaXBwZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xuICBpZiAoY2xpcHBlZC5sZW5ndGggPiBtYXhDaGFycykge1xuICAgIGNsaXBwZWQgPSBjbGlwcGVkLnNsaWNlKDAsIG1heENoYXJzKTtcbiAgfVxuICBjb25zdCBuZWVkc0VsbGlwc2lzID1cbiAgICBsaW5lcy5sZW5ndGggPiBtYXhMaW5lcyB8fFxuICAgIHRleHQubGVuZ3RoID4gY2xpcHBlZC5sZW5ndGggfHxcbiAgICBjbGlwcGVkLmxlbmd0aCA9PT0gbWF4Q2hhcnMgJiYgdGV4dC5sZW5ndGggPiBtYXhDaGFycztcbiAgcmV0dXJuIG5lZWRzRWxsaXBzaXMgPyBgJHtjbGlwcGVkLnRyaW1FbmQoKX1cdTIwMjZgIDogY2xpcHBlZDtcbn1cblxuLy8gR2xvYmFsIHN0YXRlIGZvciB2ZWN0b3Igc3RvcmUgKHBlcnNpc3RzIGFjcm9zcyByZXF1ZXN0cylcbmxldCB2ZWN0b3JTdG9yZTogVmVjdG9yU3RvcmUgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0SW5kZXhlZERpciA9IFwiXCI7XG5sZXQgc2FuaXR5Q2hlY2tzUGFzc2VkID0gZmFsc2U7XG5cbmNvbnN0IFJBR19DT05URVhUX01BQ1JPID0gXCJ7e3JhZ19jb250ZXh0fX1cIjtcbmNvbnN0IFVTRVJfUVVFUllfTUFDUk8gPSBcInt7dXNlcl9xdWVyeX19XCI7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb21wdFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgY29uc3QgaGFzQ29udGVudCA9IHR5cGVvZiB0ZW1wbGF0ZSA9PT0gXCJzdHJpbmdcIiAmJiB0ZW1wbGF0ZS50cmltKCkubGVuZ3RoID4gMDtcbiAgbGV0IG5vcm1hbGl6ZWQgPSBoYXNDb250ZW50ID8gdGVtcGxhdGUhIDogREVGQVVMVF9QUk9NUFRfVEVNUExBVEU7XG5cbiAgaWYgKCFub3JtYWxpemVkLmluY2x1ZGVzKFJBR19DT05URVhUX01BQ1JPKSkge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBbQmlnUkFHXSBQcm9tcHQgdGVtcGxhdGUgbWlzc2luZyAke1JBR19DT05URVhUX01BQ1JPfS4gUHJlcGVuZGluZyBSQUcgY29udGV4dCBibG9jay5gLFxuICAgICk7XG4gICAgbm9ybWFsaXplZCA9IGAke1JBR19DT05URVhUX01BQ1JPfVxcblxcbiR7bm9ybWFsaXplZH1gO1xuICB9XG5cbiAgaWYgKCFub3JtYWxpemVkLmluY2x1ZGVzKFVTRVJfUVVFUllfTUFDUk8pKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIFByb21wdCB0ZW1wbGF0ZSBtaXNzaW5nICR7VVNFUl9RVUVSWV9NQUNST30uIEFwcGVuZGluZyB1c2VyIHF1ZXJ5IGJsb2NrLmAsXG4gICAgKTtcbiAgICBub3JtYWxpemVkID0gYCR7bm9ybWFsaXplZH1cXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7VVNFUl9RVUVSWV9NQUNST31gO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbGxQcm9tcHRUZW1wbGF0ZSh0ZW1wbGF0ZTogc3RyaW5nLCByZXBsYWNlbWVudHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMocmVwbGFjZW1lbnRzKS5yZWR1Y2UoXG4gICAgKGFjYywgW3Rva2VuLCB2YWx1ZV0pID0+IGFjYy5zcGxpdCh0b2tlbikuam9pbih2YWx1ZSksXG4gICAgdGVtcGxhdGUsXG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdhcm5JZkNvbnRleHRPdmVyZmxvdyhcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxuICBmaW5hbFByb21wdDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdG9rZW5Tb3VyY2UgPSBhd2FpdCBjdGwudG9rZW5Tb3VyY2UoKTtcbiAgICBpZiAoXG4gICAgICAhdG9rZW5Tb3VyY2UgfHxcbiAgICAgICEoXCJhcHBseVByb21wdFRlbXBsYXRlXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuYXBwbHlQcm9tcHRUZW1wbGF0ZSAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiY291bnRUb2tlbnNcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5jb3VudFRva2VucyAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiZ2V0Q29udGV4dExlbmd0aFwiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmdldENvbnRleHRMZW5ndGggIT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVG9rZW4gc291cmNlIGRvZXMgbm90IGV4cG9zZSBwcm9tcHQgdXRpbGl0aWVzOyBza2lwcGluZyBjb250ZXh0IGNoZWNrLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBbY29udGV4dExlbmd0aCwgaGlzdG9yeV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0b2tlblNvdXJjZS5nZXRDb250ZXh0TGVuZ3RoKCksXG4gICAgICBjdGwucHVsbEhpc3RvcnkoKSxcbiAgICBdKTtcbiAgICBjb25zdCBoaXN0b3J5V2l0aExhdGVzdE1lc3NhZ2UgPSBoaXN0b3J5LndpdGhBcHBlbmRlZCh7XG4gICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgIGNvbnRlbnQ6IGZpbmFsUHJvbXB0LFxuICAgIH0pO1xuICAgIGNvbnN0IGZvcm1hdHRlZFByb21wdCA9IGF3YWl0IHRva2VuU291cmNlLmFwcGx5UHJvbXB0VGVtcGxhdGUoaGlzdG9yeVdpdGhMYXRlc3RNZXNzYWdlKTtcbiAgICBjb25zdCBwcm9tcHRUb2tlbnMgPSBhd2FpdCB0b2tlblNvdXJjZS5jb3VudFRva2Vucyhmb3JtYXR0ZWRQcm9tcHQpO1xuXG4gICAgaWYgKHByb21wdFRva2VucyA+IGNvbnRleHRMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdTdW1tYXJ5ID1cbiAgICAgICAgYFx1MjZBMFx1RkUwRiBQcm9tcHQgbmVlZHMgJHtwcm9tcHRUb2tlbnMudG9Mb2NhbGVTdHJpbmcoKX0gdG9rZW5zIGJ1dCBtb2RlbCBtYXggaXMgJHtjb250ZXh0TGVuZ3RoLnRvTG9jYWxlU3RyaW5nKCl9LmA7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nU3VtbWFyeSk7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgIHRleHQ6IGAke3dhcm5pbmdTdW1tYXJ5fSBSZWR1Y2UgcmV0cmlldmVkIHBhc3NhZ2VzIG9yIGluY3JlYXNlIHRoZSBtb2RlbCdzIGNvbnRleHQgbGVuZ3RoLmAsXG4gICAgICB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICAgICAgdGl0bGU6IFwiQ29udGV4dCB3aW5kb3cgZXhjZWVkZWRcIixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7d2FybmluZ1N1bW1hcnl9IFByb21wdCBtYXkgYmUgdHJ1bmNhdGVkIG9yIHJlamVjdGVkLmAsXG4gICAgICAgICAgbm9BdXRvRGlzbWlzczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChub3RpZnlFcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBVbmFibGUgdG8gc2VuZCBjb250ZXh0IG92ZXJmbG93IG5vdGlmaWNhdGlvbjpcIiwgbm90aWZ5RXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBGYWlsZWQgdG8gZXZhbHVhdGUgY29udGV4dCB1c2FnZTpcIiwgZXJyb3IpO1xuICB9XG59XG5cbi8qKlxuICogTWFpbiBwcm9tcHQgcHJlcHJvY2Vzc29yIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwcm9jZXNzKFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBDaGF0TWVzc2FnZSxcbik6IFByb21pc2U8Q2hhdE1lc3NhZ2UgfCBzdHJpbmc+IHtcbiAgY29uc3QgdXNlclByb21wdCA9IHVzZXJNZXNzYWdlLmdldFRleHQoKTtcbiAgY29uc3QgcGx1Z2luQ29uZmlnID0gY3RsLmdldFBsdWdpbkNvbmZpZyhjb25maWdTY2hlbWF0aWNzKTtcblxuICAvLyBHZXQgY29uZmlndXJhdGlvblxuICBjb25zdCBkb2N1bWVudHNEaXIgPSBwbHVnaW5Db25maWcuZ2V0KFwiZG9jdW1lbnRzRGlyZWN0b3J5XCIpO1xuICBjb25zdCB2ZWN0b3JTdG9yZURpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJ2ZWN0b3JTdG9yZURpcmVjdG9yeVwiKTtcbiAgY29uc3QgcmV0cmlldmFsTGltaXQgPSBwbHVnaW5Db25maWcuZ2V0KFwicmV0cmlldmFsTGltaXRcIik7XG4gIGNvbnN0IHJldHJpZXZhbFRocmVzaG9sZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiKTtcbiAgY29uc3QgY2h1bmtTaXplID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rU2l6ZVwiKTtcbiAgY29uc3QgY2h1bmtPdmVybGFwID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rT3ZlcmxhcFwiKTtcbiAgY29uc3QgbWF4Q29uY3VycmVudCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYXhDb25jdXJyZW50RmlsZXNcIik7XG4gIGNvbnN0IGVuYWJsZU9DUiA9IHBsdWdpbkNvbmZpZy5nZXQoXCJlbmFibGVPQ1JcIik7XG4gIGNvbnN0IHNraXBQcmV2aW91c2x5SW5kZXhlZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKTtcbiAgY29uc3QgcGFyc2VEZWxheU1zID0gcGx1Z2luQ29uZmlnLmdldChcInBhcnNlRGVsYXlNc1wiKSA/PyAwO1xuICBjb25zdCByZWluZGV4UmVxdWVzdGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiKTtcblxuICAvLyBWYWxpZGF0ZSBjb25maWd1cmF0aW9uXG4gIGlmICghZG9jdW1lbnRzRGlyIHx8IGRvY3VtZW50c0RpciA9PT0gXCJcIikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIERvY3VtZW50cyBkaXJlY3Rvcnkgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLlwiKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cblxuICBpZiAoIXZlY3RvclN0b3JlRGlyIHx8IHZlY3RvclN0b3JlRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gUGVyZm9ybSBzYW5pdHkgY2hlY2tzIG9uIGZpcnN0IHJ1blxuICAgIGlmICghc2FuaXR5Q2hlY2tzUGFzc2VkKSB7XG4gICAgICBjb25zdCBjaGVja1N0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIlBlcmZvcm1pbmcgc2FuaXR5IGNoZWNrcy4uLlwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNhbml0eVJlc3VsdCA9IGF3YWl0IHBlcmZvcm1TYW5pdHlDaGVja3MoZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZURpcik7XG5cbiAgICAgIC8vIExvZyB3YXJuaW5nc1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHNhbml0eVJlc3VsdC53YXJuaW5ncykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9nIGVycm9ycyBhbmQgYWJvcnQgaWYgY3JpdGljYWxcbiAgICAgIGlmICghc2FuaXR5UmVzdWx0LnBhc3NlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHNhbml0eVJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR11cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZhaWx1cmVSZWFzb24gPVxuICAgICAgICAgIHNhbml0eVJlc3VsdC5lcnJvcnNbMF0gPz9cbiAgICAgICAgICBzYW5pdHlSZXN1bHQud2FybmluZ3NbMF0gPz9cbiAgICAgICAgICBcIlVua25vd24gcmVhc29uLiBQbGVhc2UgcmV2aWV3IHBsdWdpbiBzZXR0aW5ncy5cIjtcbiAgICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgIHRleHQ6IGBTYW5pdHkgY2hlY2tzIGZhaWxlZDogJHtmYWlsdXJlUmVhc29ufWAsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGNoZWNrU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJTYW5pdHkgY2hlY2tzIHBhc3NlZFwiLFxuICAgICAgfSk7XG4gICAgICBzYW5pdHlDaGVja3NQYXNzZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIC8vIEluaXRpYWxpemUgdmVjdG9yIHN0b3JlIGlmIG5lZWRlZFxuICAgIGlmICghdmVjdG9yU3RvcmUgfHwgbGFzdEluZGV4ZWREaXIgIT09IHZlY3RvclN0b3JlRGlyKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgdGV4dDogXCJJbml0aWFsaXppbmcgdmVjdG9yIHN0b3JlLi4uXCIsXG4gICAgICB9KTtcblxuICAgICAgdmVjdG9yU3RvcmUgPSBuZXcgVmVjdG9yU3RvcmUodmVjdG9yU3RvcmVEaXIpO1xuICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHJlYWR5IChwYXRoPSR7dmVjdG9yU3RvcmVEaXJ9KS4gV2FpdGluZyBmb3IgcXVlcmllcy4uLmAsXG4gICAgICApO1xuICAgICAgbGFzdEluZGV4ZWREaXIgPSB2ZWN0b3JTdG9yZURpcjtcblxuICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWRcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIGF3YWl0IG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gICAgICBjdGwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBwYXJzZURlbGF5TXMsXG4gICAgICByZWluZGV4UmVxdWVzdGVkLFxuICAgICAgc2tpcFByZXZpb3VzbHlJbmRleGVkOiBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC5za2lwUHJldmlvdXNseUluZGV4ZWRcIiksXG4gICAgfSk7XG5cbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGluZGV4XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIFZlY3RvciBzdG9yZSBzdGF0cyBiZWZvcmUgYXV0by1pbmRleCBjaGVjazogdG90YWxDaHVua3M9JHtzdGF0cy50b3RhbENodW5rc30sIHVuaXF1ZUZpbGVzPSR7c3RhdHMudW5pcXVlRmlsZXN9YCk7XG5cbiAgICBpZiAoc3RhdHMudG90YWxDaHVua3MgPT09IDApIHtcbiAgICAgIGlmICghdHJ5U3RhcnRJbmRleGluZyhcImF1dG8tdHJpZ2dlclwiKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBJbmRleGluZyBhbHJlYWR5IHJ1bm5pbmcsIHNraXBwaW5nIGF1dG9tYXRpYyBpbmRleGluZy5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbmRleFN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgdGV4dDogXCJTdGFydGluZyBpbml0aWFsIGluZGV4aW5nLi4uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBpbmRleGluZ1Jlc3VsdCB9ID0gYXdhaXQgcnVuSW5kZXhpbmdKb2Ioe1xuICAgICAgICAgICAgY2xpZW50OiBjdGwuY2xpZW50LFxuICAgICAgICAgICAgYWJvcnRTaWduYWw6IGN0bC5hYm9ydFNpZ25hbCxcbiAgICAgICAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgICAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgICAgICAgY2h1bmtTaXplLFxuICAgICAgICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgICAgICAgIGVuYWJsZU9DUixcbiAgICAgICAgICAgIGF1dG9SZWluZGV4OiBmYWxzZSxcbiAgICAgICAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgICAgICAgIHZlY3RvclN0b3JlLFxuICAgICAgICAgICAgZm9yY2VSZWluZGV4OiB0cnVlLFxuICAgICAgICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwic2Nhbm5pbmdcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgU2Nhbm5pbmc6ICR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9YCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiaW5kZXhpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwcm9ncmVzcy5zdWNjZXNzZnVsRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBwcm9ncmVzcy5mYWlsZWRGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNraXBwZWQgPSBwcm9ncmVzcy5za2lwcGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGVycm9yOiAke3Byb2dyZXNzLmVycm9yfWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0JpZ1JBR10gSW5kZXhpbmcgY29tcGxldGU6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfSBmYWlsZWQpYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBJbmRleGluZyBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBmaW5pc2hJbmRleGluZygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuXG4gICAgLy8gTG9nIG1hbnVhbCByZWluZGV4IHRvZ2dsZSBzdGF0ZXMgZm9yIHZpc2liaWxpdHkgb24gZWFjaCBjaGF0XG4gICAgY29uc3QgdG9nZ2xlU3RhdHVzVGV4dCA9XG4gICAgICBgTWFudWFsIFJlaW5kZXggVHJpZ2dlcjogJHtyZWluZGV4UmVxdWVzdGVkID8gXCJPTlwiIDogXCJPRkZcIn0gfCBgICtcbiAgICAgIGBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZDogJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifWA7XG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSAke3RvZ2dsZVN0YXR1c1RleHR9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogdG9nZ2xlU3RhdHVzVGV4dCxcbiAgICB9KTtcblxuICAgIC8vIFBlcmZvcm0gcmV0cmlldmFsXG4gICAgY29uc3QgcmV0cmlldmFsU3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJMb2FkaW5nIGVtYmVkZGluZyBtb2RlbCBmb3IgcmV0cmlldmFsLi4uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGN0bC5jbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgICAgeyBzaWduYWw6IGN0bC5hYm9ydFNpZ25hbCB9XG4gICAgKTtcblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJTZWFyY2hpbmcgZm9yIHJlbGV2YW50IGNvbnRlbnQuLi5cIixcbiAgICB9KTtcblxuICAgIC8vIEVtYmVkIHRoZSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nUmVzdWx0ID0gYXdhaXQgZW1iZWRkaW5nTW9kZWwuZW1iZWQodXNlclByb21wdCk7XG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nID0gcXVlcnlFbWJlZGRpbmdSZXN1bHQuZW1iZWRkaW5nO1xuXG4gICAgLy8gU2VhcmNoIHZlY3RvciBzdG9yZVxuICAgIGNvbnN0IHF1ZXJ5UHJldmlldyA9XG4gICAgICB1c2VyUHJvbXB0Lmxlbmd0aCA+IDE2MCA/IGAke3VzZXJQcm9tcHQuc2xpY2UoMCwgMTYwKX0uLi5gIDogdXNlclByb21wdDtcbiAgICBjb25zb2xlLmluZm8oXG4gICAgICBgW0JpZ1JBR10gRXhlY3V0aW5nIHZlY3RvciBzZWFyY2ggZm9yIFwiJHtxdWVyeVByZXZpZXd9XCIgKGxpbWl0PSR7cmV0cmlldmFsTGltaXR9LCB0aHJlc2hvbGQ9JHtyZXRyaWV2YWxUaHJlc2hvbGR9KWAsXG4gICAgKTtcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdmVjdG9yU3RvcmUuc2VhcmNoKFxuICAgICAgcXVlcnlFbWJlZGRpbmcsXG4gICAgICByZXRyaWV2YWxMaW1pdCxcbiAgICAgIHJldHJpZXZhbFRocmVzaG9sZFxuICAgICk7XG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRvcEhpdCA9IHJlc3VsdHNbMF07XG4gICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgIGBbQmlnUkFHXSBWZWN0b3Igc2VhcmNoIHJldHVybmVkICR7cmVzdWx0cy5sZW5ndGh9IHJlc3VsdHMuIFRvcCBoaXQ6IGZpbGU9JHt0b3BIaXQuZmlsZU5hbWV9IHNjb3JlPSR7dG9wSGl0LnNjb3JlLnRvRml4ZWQoMyl9YCxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGRvY1N1bW1hcmllcyA9IHJlc3VsdHNcbiAgICAgICAgLm1hcChcbiAgICAgICAgICAocmVzdWx0LCBpZHgpID0+XG4gICAgICAgICAgICBgIyR7aWR4ICsgMX0gZmlsZT0ke3BhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKX0gc2hhcmQ9JHtyZXN1bHQuc2hhcmROYW1lfSBzY29yZT0ke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfWAsXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIFJlbGV2YW50IGRvY3VtZW50czpcXG4ke2RvY1N1bW1hcmllc31gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHNlYXJjaCByZXR1cm5lZCAwIHJlc3VsdHMuXCIpO1xuICAgIH1cblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgIHRleHQ6IFwiTm8gcmVsZXZhbnQgY29udGVudCBmb3VuZCBpbiBpbmRleGVkIGRvY3VtZW50c1wiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG5vdGVBYm91dE5vUmVzdWx0cyA9XG4gICAgICAgIGBJbXBvcnRhbnQ6IE5vIHJlbGV2YW50IGNvbnRlbnQgd2FzIGZvdW5kIGluIHRoZSBpbmRleGVkIGRvY3VtZW50cyBmb3IgdGhlIHVzZXIgcXVlcnkuIGAgK1xuICAgICAgICBgSW4gbGVzcyB0aGFuIG9uZSBzZW50ZW5jZSwgaW5mb3JtIHRoZSB1c2VyIG9mIHRoaXMuIGAgK1xuICAgICAgICBgVGhlbiByZXNwb25kIHRvIHRoZSBxdWVyeSB0byB0aGUgYmVzdCBvZiB5b3VyIGFiaWxpdHkuYDtcblxuICAgICAgcmV0dXJuIG5vdGVBYm91dE5vUmVzdWx0cyArIGBcXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7dXNlclByb21wdH1gO1xuICAgIH1cblxuICAgIC8vIEZvcm1hdCByZXN1bHRzXG4gICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgUmV0cmlldmVkICR7cmVzdWx0cy5sZW5ndGh9IHJlbGV2YW50IHBhc3NhZ2VzYCxcbiAgICB9KTtcblxuICAgIGN0bC5kZWJ1ZyhcIlJldHJpZXZhbCByZXN1bHRzOlwiLCByZXN1bHRzKTtcblxuICAgIGxldCByYWdDb250ZXh0RnVsbCA9IFwiXCI7XG4gICAgbGV0IHJhZ0NvbnRleHRQcmV2aWV3ID0gXCJcIjtcbiAgICBjb25zdCBwcmVmaXggPSBcIlRoZSBmb2xsb3dpbmcgcGFzc2FnZXMgd2VyZSBmb3VuZCBpbiB5b3VyIGluZGV4ZWQgZG9jdW1lbnRzOlxcblxcblwiO1xuICAgIHJhZ0NvbnRleHRGdWxsICs9IHByZWZpeDtcbiAgICByYWdDb250ZXh0UHJldmlldyArPSBwcmVmaXg7XG5cbiAgICBsZXQgY2l0YXRpb25OdW1iZXIgPSAxO1xuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpO1xuICAgICAgY29uc3QgY2l0YXRpb25MYWJlbCA9IGBDaXRhdGlvbiAke2NpdGF0aW9uTnVtYmVyfSAoZnJvbSAke2ZpbGVOYW1lfSwgc2NvcmU6ICR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9KTogYDtcbiAgICAgIHJhZ0NvbnRleHRGdWxsICs9IGBcXG4ke2NpdGF0aW9uTGFiZWx9XCIke3Jlc3VsdC50ZXh0fVwiXFxuXFxuYDtcbiAgICAgIHJhZ0NvbnRleHRQcmV2aWV3ICs9IGBcXG4ke2NpdGF0aW9uTGFiZWx9XCIke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfVwiXFxuXFxuYDtcbiAgICAgIGNpdGF0aW9uTnVtYmVyKys7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbXB0VGVtcGxhdGUgPSBub3JtYWxpemVQcm9tcHRUZW1wbGF0ZShwbHVnaW5Db25maWcuZ2V0KFwicHJvbXB0VGVtcGxhdGVcIikpO1xuICAgIGNvbnN0IGZpbmFsUHJvbXB0ID0gZmlsbFByb21wdFRlbXBsYXRlKHByb21wdFRlbXBsYXRlLCB7XG4gICAgICBbUkFHX0NPTlRFWFRfTUFDUk9dOiByYWdDb250ZXh0RnVsbC50cmltRW5kKCksXG4gICAgICBbVVNFUl9RVUVSWV9NQUNST106IHVzZXJQcm9tcHQsXG4gICAgfSk7XG4gICAgY29uc3QgZmluYWxQcm9tcHRQcmV2aWV3ID0gZmlsbFByb21wdFRlbXBsYXRlKHByb21wdFRlbXBsYXRlLCB7XG4gICAgICBbUkFHX0NPTlRFWFRfTUFDUk9dOiByYWdDb250ZXh0UHJldmlldy50cmltRW5kKCksXG4gICAgICBbVVNFUl9RVUVSWV9NQUNST106IHVzZXJQcm9tcHQsXG4gICAgfSk7XG5cbiAgICBjdGwuZGVidWcoXCJQcm9jZXNzZWQgY29udGVudCAocHJldmlldyk6XCIsIGZpbmFsUHJvbXB0UHJldmlldyk7XG5cbiAgICBjb25zdCBwYXNzYWdlc0xvZ0VudHJpZXMgPSByZXN1bHRzLm1hcCgocmVzdWx0LCBpZHgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpO1xuICAgICAgcmV0dXJuIGAjJHtpZHggKyAxfSBmaWxlPSR7ZmlsZU5hbWV9IHNoYXJkPSR7cmVzdWx0LnNoYXJkTmFtZX0gc2NvcmU9JHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX1cXG4ke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfWA7XG4gICAgfSk7XG4gICAgY29uc3QgcGFzc2FnZXNMb2cgPSBwYXNzYWdlc0xvZ0VudHJpZXMuam9pbihcIlxcblxcblwiKTtcblxuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUkFHIHBhc3NhZ2VzICgke3Jlc3VsdHMubGVuZ3RofSkgcHJldmlldzpcXG4ke3Bhc3NhZ2VzTG9nfWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSQUcgcGFzc2FnZXMgKCR7cmVzdWx0cy5sZW5ndGh9KTpgLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgcGFzc2FnZXNMb2dFbnRyaWVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogZW50cnksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIEZpbmFsIHByb21wdCBzZW50IHRvIG1vZGVsIChwcmV2aWV3KTpcXG4ke2ZpbmFsUHJvbXB0UHJldmlld31gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgRmluYWwgcHJvbXB0IHNlbnQgdG8gbW9kZWwgKHByZXZpZXcpOlxcbiR7ZmluYWxQcm9tcHRQcmV2aWV3fWAsXG4gICAgfSk7XG5cbiAgICBhd2FpdCB3YXJuSWZDb250ZXh0T3ZlcmZsb3coY3RsLCBmaW5hbFByb21wdCk7XG5cbiAgICByZXR1cm4gZmluYWxQcm9tcHQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gSU1QT1JUQU5UOiBSZS10aHJvdyBhYm9ydCBlcnJvcnMgc28gTE0gU3R1ZGlvIGNhbiBzdG9wIHRoZSBwcmVwcm9jZXNzb3IgcHJvbXB0bHkuXG4gICAgLy8gU3dhbGxvd2luZyBBYm9ydEVycm9yIGNhdXNlcyB0aGUgXCJkaWQgbm90IGFib3J0IGluIHRpbWVcIiB3YXJuaW5nLlxuICAgIGlmIChpc0Fib3J0RXJyb3IoZXJyb3IpKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgY29uc29sZS5lcnJvcihcIltQcm9tcHRQcmVwcm9jZXNzb3JdIFByZXByb2Nlc3NpbmcgZmFpbGVkLlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG59XG5cbmludGVyZmFjZSBDb25maWdSZWluZGV4T3B0cyB7XG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcjtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICByZWluZGV4UmVxdWVzdGVkOiBib29sZWFuO1xuICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IGJvb2xlYW47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gIGN0bCxcbiAgZG9jdW1lbnRzRGlyLFxuICB2ZWN0b3JTdG9yZURpcixcbiAgY2h1bmtTaXplLFxuICBjaHVua092ZXJsYXAsXG4gIG1heENvbmN1cnJlbnQsXG4gIGVuYWJsZU9DUixcbiAgcGFyc2VEZWxheU1zLFxuICByZWluZGV4UmVxdWVzdGVkLFxuICBza2lwUHJldmlvdXNseUluZGV4ZWQsXG59OiBDb25maWdSZWluZGV4T3B0cykge1xuICBpZiAoIXJlaW5kZXhSZXF1ZXN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZW1pbmRlclRleHQgPVxuICAgIGBNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcyBpcyBjdXJyZW50bHkgJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifS4gYCArXG4gICAgXCJUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiO1xuICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7cmVtaW5kZXJUZXh0fWApO1xuICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgIHRleHQ6IHJlbWluZGVyVGV4dCxcbiAgfSk7XG5cbiAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiY29uZmlnLXRyaWdnZXJcIikpIHtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBhbHJlYWR5IHJ1bm5pbmcuIFBsZWFzZSB3YWl0IGZvciBpdCB0byBmaW5pc2guXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IHJlcXVlc3RlZCBmcm9tIGNvbmZpZy4uLlwiLFxuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgaW5kZXhpbmdSZXN1bHQgfSA9IGF3YWl0IHJ1bkluZGV4aW5nSm9iKHtcbiAgICAgIGNsaWVudDogY3RsLmNsaWVudCxcbiAgICAgIGFib3J0U2lnbmFsOiBjdGwuYWJvcnRTaWduYWwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBhdXRvUmVpbmRleDogc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgZm9yY2VSZWluZGV4OiAhc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgdmVjdG9yU3RvcmU6IHZlY3RvclN0b3JlID8/IHVuZGVmaW5lZCxcbiAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcInNjYW5uaW5nXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHByb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwO1xuICAgICAgICAgIGNvbnN0IGZhaWxlZCA9IHByb2dyZXNzLmZhaWxlZEZpbGVzID8/IDA7XG4gICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IHByb2dyZXNzLnNraXBwZWRGaWxlcyA/PyAwO1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgY29tcGxldGU6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9IGZpbGVzIHByb2Nlc3NlZGAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZXJyb3I6ICR7cHJvZ3Jlc3MuZXJyb3J9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZSFcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN1bW1hcnlMaW5lcyA9IFtcbiAgICAgIGBQcm9jZXNzZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9YCxcbiAgICAgIGBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9YCxcbiAgICAgIGBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31gLFxuICAgICAgYFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfWAsXG4gICAgICBgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfWAsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygc3VtbWFyeUxpbmVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogbGluZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzID4gMCAmJiBpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXMgPT09IGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIkFsbCBmaWxlcyB3ZXJlIGFscmVhZHkgdXAgdG8gZGF0ZSAoc2tpcHBlZCkuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBzdW1tYXJ5OlxcbiAgJHtzdW1tYXJ5TGluZXMuam9pbihcIlxcbiAgXCIpfWAsXG4gICAgKTtcblxuICAgIGF3YWl0IG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgdGV4dDogYE1hbnVhbCByZWluZGV4IGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICB9KTtcbiAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR10gTWFudWFsIHJlaW5kZXggZmFpbGVkOlwiLCBlcnJvcik7XG4gIH0gZmluYWxseSB7XG4gICAgZmluaXNoSW5kZXhpbmcoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBub3RpZnlNYW51YWxSZXNldE5lZWRlZChjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjdGwuY2xpZW50LnN5c3RlbS5ub3RpZnkoe1xuICAgICAgdGl0bGU6IFwiTWFudWFsIHJlaW5kZXggY29tcGxldGVkXCIsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgXCJNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFVuYWJsZSB0byBzZW5kIG5vdGlmaWNhdGlvbiBhYm91dCBtYW51YWwgcmVpbmRleCByZXNldDpcIiwgZXJyb3IpO1xuICB9XG59XG5cblxuIiwgImltcG9ydCB7IHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBwcmVwcm9jZXNzIH0gZnJvbSBcIi4vcHJvbXB0UHJlcHJvY2Vzc29yXCI7XG5cbi8qKlxuICogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIEJpZyBSQUcgcGx1Z2luLlxuICogVGhpcyBwbHVnaW4gaW5kZXhlcyBsYXJnZSBkb2N1bWVudCBjb2xsZWN0aW9ucyBhbmQgcHJvdmlkZXMgUkFHIGNhcGFiaWxpdGllcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1haW4oY29udGV4dDogUGx1Z2luQ29udGV4dCkge1xuICAvLyBSZWdpc3RlciB0aGUgY29uZmlndXJhdGlvbiBzY2hlbWF0aWNzXG4gIGNvbnRleHQud2l0aENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gIFxuICAvLyBSZWdpc3RlciB0aGUgcHJvbXB0IHByZXByb2Nlc3NvclxuICBjb250ZXh0LndpdGhQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gIFxuICBjb25zb2xlLmxvZyhcIltCaWdSQUddIFBsdWdpbiBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG59XG5cbiIsICJpbXBvcnQgeyBMTVN0dWRpb0NsaWVudCwgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZGVjbGFyZSB2YXIgcHJvY2VzczogYW55O1xuXG4vLyBXZSByZWNlaXZlIHJ1bnRpbWUgaW5mb3JtYXRpb24gaW4gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbmNvbnN0IGNsaWVudElkZW50aWZpZXIgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9JREVOVElGSUVSO1xuY29uc3QgY2xpZW50UGFzc2tleSA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX1BBU1NLRVk7XG5jb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9CQVNFX1VSTDtcblxuY29uc3QgY2xpZW50ID0gbmV3IExNU3R1ZGlvQ2xpZW50KHtcbiAgY2xpZW50SWRlbnRpZmllcixcbiAgY2xpZW50UGFzc2tleSxcbiAgYmFzZVVybCxcbn0pO1xuXG4oZ2xvYmFsVGhpcyBhcyBhbnkpLl9fTE1TX1BMVUdJTl9DT05URVhUID0gdHJ1ZTtcblxubGV0IHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IGZhbHNlO1xubGV0IHByb21wdFByZXByb2Nlc3NvclNldCA9IGZhbHNlO1xubGV0IGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgdG9vbHNQcm92aWRlclNldCA9IGZhbHNlO1xubGV0IGdlbmVyYXRvclNldCA9IGZhbHNlO1xuXG5jb25zdCBzZWxmUmVnaXN0cmF0aW9uSG9zdCA9IGNsaWVudC5wbHVnaW5zLmdldFNlbGZSZWdpc3RyYXRpb25Ib3N0KCk7XG5cbmNvbnN0IHBsdWdpbkNvbnRleHQ6IFBsdWdpbkNvbnRleHQgPSB7XG4gIHdpdGhQcmVkaWN0aW9uTG9vcEhhbmRsZXI6IChnZW5lcmF0ZSkgPT4ge1xuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHRvb2xzIHByb3ZpZGVyXCIpO1xuICAgIH1cblxuICAgIHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJlZGljdGlvbkxvb3BIYW5kbGVyKGdlbmVyYXRlKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFByb21wdFByZXByb2Nlc3NvcjogKHByZXByb2Nlc3MpID0+IHtcbiAgICBpZiAocHJvbXB0UHJlcHJvY2Vzc29yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9tcHRQcmVwcm9jZXNzb3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aENvbmZpZ1NjaGVtYXRpY3M6IChjb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGNvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgY29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0Q29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdsb2JhbENvbmZpZ1NjaGVtYXRpY3M6IChnbG9iYWxDb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdsb2JhbCBjb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdsb2JhbENvbmZpZ1NjaGVtYXRpY3MoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhUb29sc1Byb3ZpZGVyOiAodG9vbHNQcm92aWRlcikgPT4ge1xuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSBwcmVkaWN0aW9uTG9vcEhhbmRsZXJcIik7XG4gICAgfVxuXG4gICAgdG9vbHNQcm92aWRlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0VG9vbHNQcm92aWRlcih0b29sc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdlbmVyYXRvcjogKGdlbmVyYXRvcikgPT4ge1xuICAgIGlmIChnZW5lcmF0b3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuXG4gICAgZ2VuZXJhdG9yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHZW5lcmF0b3IoZ2VuZXJhdG9yKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbn07XG5cbmltcG9ydChcIi4vLi4vc3JjL2luZGV4LnRzXCIpLnRoZW4oYXN5bmMgbW9kdWxlID0+IHtcbiAgcmV0dXJuIGF3YWl0IG1vZHVsZS5tYWluKHBsdWdpbkNvbnRleHQpO1xufSkudGhlbigoKSA9PiB7XG4gIHNlbGZSZWdpc3RyYXRpb25Ib3N0LmluaXRDb21wbGV0ZWQoKTtcbn0pLmNhdGNoKChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgdGhlIG1haW4gZnVuY3Rpb24gb2YgdGhlIHBsdWdpbi5cIik7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdCQUVhLHlCQVFBO0FBVmI7QUFBQTtBQUFBO0FBQUEsaUJBQXVDO0FBRWhDLElBQU0sMEJBQTBCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBUWhDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixhQUFhO0FBQUEsTUFDZjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUFBLE1BQ3JDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBSyxLQUFLLEdBQUssTUFBTSxLQUFLO0FBQUEsTUFDM0M7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxNQUFNLElBQUk7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxLQUFLLE1BQU0sR0FBRztBQUFBLE1BQ3ZDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBRyxLQUFLLElBQUksTUFBTSxFQUFFO0FBQUEsTUFDckM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FB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aEQ7QUFFQSxtQkFBZTtBQUNmLHlCQUFxQixhQUFhLFNBQVM7QUFDM0MsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLHdEQUE0QixLQUFLLE9BQU1DLFlBQVU7QUFDL0MsU0FBTyxNQUFNQSxRQUFPLEtBQUssYUFBYTtBQUN4QyxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ1osdUJBQXFCLGNBQWM7QUFDckMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ2xCLFVBQVEsTUFBTSxvREFBb0Q7QUFDbEUsVUFBUSxNQUFNLEtBQUs7QUFDckIsQ0FBQzsiLAogICJuYW1lcyI6IFsiZnMiLCAicGF0aCIsICJjcnlwdG8iLCAiZnMiLCAicmVzb2x2ZSIsICJjaHVua1RleHQiLCAic2NhbkRpcmVjdG9yeSIsICJmaWxlcyIsICJmcyIsICJwYXRoIiwgImZzIiwgImNsaWVudCIsICJyZXNvbHZlIiwgInBkZlBhcnNlIiwgImZzIiwgInJlc29sdmUiLCAiaW1wb3J0X3Rlc3NlcmFjdCIsICJmcyIsICJjbGllbnQiLCAicGF0aCIsICJjaHVua1RleHQiLCAiY2h1bmtUZXh0c1BhcmFsbGVsIiwgImNodW5rVGV4dHNCYXRjaCIsICJyZXNvbHZlIiwgImZzIiwgImZzIiwgInBhdGgiLCAiZnMiLCAicGF0aCIsICJ2ZWN0b3JTdG9yZSIsICJzY2FuRGlyZWN0b3J5IiwgIlBRdWV1ZSIsICJjaHVua1RleHRzQmF0Y2giLCAiY2xpZW50IiwgInZlY3RvclN0b3JlIiwgInBhdGgiLCAiaW1wb3J0X3NkayIsICJwcmVwcm9jZXNzIiwgImNvbmZpZ1NjaGVtYXRpY3MiLCAibW9kdWxlIl0KfQo=
