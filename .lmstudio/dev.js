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
        subtitle: "Maximum number of files to process concurrently during indexing. Higher values = faster parsing.",
        slider: { min: 1, max: 10, step: 1 }
      },
      5
    ).field(
      "parseDelayMs",
      "numeric",
      {
        int: true,
        min: 0,
        max: 5e3,
        displayName: "Parser Delay (ms)",
        subtitle: "Wait time before parsing each document (helps avoid WebSocket throttling). Set to 0 for fastest parsing.",
        slider: { min: 0, max: 5e3, step: 100 }
      },
      0
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
async function tryLmStudioParser(filePath, client2, timeoutMs = 1e4) {
  const maxRetries = 1;
  const fileName = filePath.split("/").pop() || filePath;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const parsePromise = client2.files.prepareFile(filePath).then(
        (fileHandle) => client2.files.parseDocument(fileHandle, {
          onProgress: (progress) => {
            if (progress === 0 || progress === 1) {
              console.log(
                `[PDF Parser] (LM Studio) Processing ${fileName}: ${(progress * 100).toFixed(0)}%`
              );
            }
          }
        })
      );
      const result = await Promise.race([
        parsePromise,
        new Promise(
          (_, reject) => setTimeout(() => reject(new Error("LM Studio parser timeout")), timeoutMs)
        )
      ]);
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
      const isTimeout = error instanceof Error && error.message.includes("timeout");
      const isWebSocketError = error instanceof Error && (error.message.includes("WebSocket") || error.message.includes("connection closed"));
      if (isTimeout) {
        console.warn(`[PDF Parser] (LM Studio) Timeout on ${fileName}, falling back to pdf-parse`);
        return {
          success: false,
          reason: "pdf.lmstudio-error",
          details: "Timeout - falling back to pdf-parse"
        };
      }
      if (isWebSocketError && attempt < maxRetries) {
        console.warn(
          `[PDF Parser] (LM Studio) WebSocket error on ${fileName}, retrying (${attempt}/${maxRetries})...`
        );
        await new Promise((resolve3) => setTimeout(resolve3, 1e3 * attempt));
        continue;
      }
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
  const pdfParseResult = await tryPdfParse(filePath);
  if (pdfParseResult.success) {
    return pdfParseResult;
  }
  let lastFailure = pdfParseResult;
  const lmStudioResult = await tryLmStudioParser(filePath, client2, 15e3);
  if (lmStudioResult.success) {
    return lmStudioResult;
  }
  lastFailure = lmStudioResult;
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
    `[PDF Parser] (OCR) No text extracted from ${fileName} with pdf-parse or LM Studio, attempting OCR...`
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
          const EMBEDDING_BATCH_SIZE = 50;
          const MAX_RETRIES = 3;
          if (allChunks.length > 0) {
            try {
              const allTexts = allChunks.map((c) => c.text);
              const allEmbeddings = [];
              for (let i = 0; i < allTexts.length; i += EMBEDDING_BATCH_SIZE) {
                const batch = allTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
                let lastError = null;
                for (let retry = 0; retry < MAX_RETRIES; retry++) {
                  try {
                    const result = await this.options.embeddingModel.embed(batch);
                    allEmbeddings.push(...result);
                    break;
                  } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    if (retry < MAX_RETRIES - 1) {
                      console.log(`  Embedding batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1}/${Math.ceil(allTexts.length / EMBEDDING_BATCH_SIZE)} failed, retry ${retry + 1}/${MAX_RETRIES}...`);
                      await new Promise((r) => setTimeout(r, 1e3 * (retry + 1)));
                    }
                  }
                }
                if (lastError && allEmbeddings.length - i < EMBEDDING_BATCH_SIZE) {
                  throw lastError;
                }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy9uYXRpdmUvaW5kZXgudHMiLCAiLi4vc3JjL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnMudHMiLCAiLi4vc3JjL2luZ2VzdGlvbi9maWxlU2Nhbm5lci50cyIsICIuLi9zcmMvcGFyc2Vycy9odG1sUGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL3BkZlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9lcHViUGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2ltYWdlUGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL3RleHRQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZG9jdW1lbnRQYXJzZXIudHMiLCAiLi4vc3JjL3V0aWxzL3RleHRDaHVua2VyLnRzIiwgIi4uL3NyYy91dGlscy9maWxlSGFzaC50cyIsICIuLi9zcmMvdXRpbHMvZmFpbGVkRmlsZVJlZ2lzdHJ5LnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vaW5kZXhNYW5hZ2VyLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vcnVuSW5kZXhpbmcudHMiLCAiLi4vc3JjL3Byb21wdFByZXByb2Nlc3Nvci50cyIsICIuLi9zcmMvaW5kZXgudHMiLCAiZW50cnkudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9QUk9NUFRfVEVNUExBVEUgPSBge3tyYWdfY29udGV4dH19XG5cblVzZSB0aGUgY2l0YXRpb25zIGFib3ZlIHRvIHJlc3BvbmQgdG8gdGhlIHVzZXIgcXVlcnksIG9ubHkgaWYgdGhleSBhcmUgcmVsZXZhbnQuIE90aGVyd2lzZSwgcmVzcG9uZCB0byB0aGUgYmVzdCBvZiB5b3VyIGFiaWxpdHkgd2l0aG91dCB0aGVtLlxuXG5Vc2VyIFF1ZXJ5OlxuXG57e3VzZXJfcXVlcnl9fWA7XG5cbmV4cG9ydCBjb25zdCBjb25maWdTY2hlbWF0aWNzID0gY3JlYXRlQ29uZmlnU2NoZW1hdGljcygpXG4gIC5maWVsZChcbiAgICBcImRvY3VtZW50c0RpcmVjdG9yeVwiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiRG9jdW1lbnRzIERpcmVjdG9yeVwiLFxuICAgICAgc3VidGl0bGU6IFwiUm9vdCBkaXJlY3RvcnkgY29udGFpbmluZyBkb2N1bWVudHMgdG8gaW5kZXguIEFsbCBzdWJkaXJlY3RvcmllcyB3aWxsIGJlIHNjYW5uZWQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCIvcGF0aC90by9kb2N1bWVudHNcIixcbiAgICB9LFxuICAgIFwiXCIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwidmVjdG9yU3RvcmVEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlZlY3RvciBTdG9yZSBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIkRpcmVjdG9yeSB3aGVyZSB0aGUgdmVjdG9yIGRhdGFiYXNlIHdpbGwgYmUgc3RvcmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vdmVjdG9yL3N0b3JlXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInJldHJpZXZhbExpbWl0XCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAyMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlJldHJpZXZhbCBMaW1pdFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWF4aW11bSBudW1iZXIgb2YgY2h1bmtzIHRvIHJldHVybiBkdXJpbmcgcmV0cmlldmFsLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMSwgbWF4OiAyMCwgc3RlcDogMSB9LFxuICAgIH0sXG4gICAgNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIG1pbjogMC4wLFxuICAgICAgbWF4OiAxLjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgQWZmaW5pdHkgVGhyZXNob2xkXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNaW5pbXVtIHNpbWlsYXJpdHkgc2NvcmUgZm9yIGEgY2h1bmsgdG8gYmUgY29uc2lkZXJlZCByZWxldmFudC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDAuMCwgbWF4OiAxLjAsIHN0ZXA6IDAuMDEgfSxcbiAgICB9LFxuICAgIDAuNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJjaHVua1NpemVcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEyOCxcbiAgICAgIG1heDogMjA0OCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNodW5rIFNpemVcIixcbiAgICAgIHN1YnRpdGxlOiBcIlNpemUgb2YgdGV4dCBjaHVua3MgZm9yIGVtYmVkZGluZyAoaW4gdG9rZW5zKS5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEyOCwgbWF4OiAyMDQ4LCBzdGVwOiAxMjggfSxcbiAgICB9LFxuICAgIDUxMixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJjaHVua092ZXJsYXBcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDUxMixcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNodW5rIE92ZXJsYXBcIixcbiAgICAgIHN1YnRpdGxlOiBcIk92ZXJsYXAgYmV0d2VlbiBjb25zZWN1dGl2ZSBjaHVua3MgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLCBtYXg6IDUxMiwgc3RlcDogMzIgfSxcbiAgICB9LFxuICAgIDEwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYXhDb25jdXJyZW50RmlsZXNcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEsXG4gICAgICBtYXg6IDEwLFxuICAgICAgZGlzcGxheU5hbWU6IFwiTWF4IENvbmN1cnJlbnQgRmlsZXNcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGZpbGVzIHRvIHByb2Nlc3MgY29uY3VycmVudGx5IGR1cmluZyBpbmRleGluZy4gSGlnaGVyIHZhbHVlcyA9IGZhc3RlciBwYXJzaW5nLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMSwgbWF4OiAxMCwgc3RlcDogMSB9LFxuICAgIH0sXG4gICAgNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJwYXJzZURlbGF5TXNcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDUwMDAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJQYXJzZXIgRGVsYXkgKG1zKVwiLFxuICAgICAgc3VidGl0bGU6IFwiV2FpdCB0aW1lIGJlZm9yZSBwYXJzaW5nIGVhY2ggZG9jdW1lbnQgKGhlbHBzIGF2b2lkIFdlYlNvY2tldCB0aHJvdHRsaW5nKS4gU2V0IHRvIDAgZm9yIGZhc3Rlc3QgcGFyc2luZy5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDAsIG1heDogNTAwMCwgc3RlcDogMTAwIH0sXG4gICAgfSxcbiAgICAwLFxuICApXG4gIC5maWVsZChcbiAgICBcImVuYWJsZU9DUlwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBPQ1JcIixcbiAgICAgIHN1YnRpdGxlOiBcIkVuYWJsZSBPQ1IgZm9yIGltYWdlIGZpbGVzIGFuZCBpbWFnZS1iYXNlZCBQREZzIHVzaW5nIExNIFN0dWRpbydzIGJ1aWx0LWluIGRvY3VtZW50IHBhcnNlci5cIixcbiAgICB9LFxuICAgIHRydWUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWFudWFsUmVpbmRleC50cmlnZ2VyXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiTWFudWFsIFJlaW5kZXggVHJpZ2dlclwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiVG9nZ2xlIE9OIHRvIHJlcXVlc3QgYW4gaW1tZWRpYXRlIHJlaW5kZXguIFRoZSBwbHVnaW4gcmVzZXRzIHRoaXMgYWZ0ZXIgcnVubmluZy4gVXNlIHRoZSBcdTIwMUNTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlc1x1MjAxRCBvcHRpb24gYmVsb3cgdG8gY29udHJvbCB3aGV0aGVyIHVuY2hhbmdlZCBmaWxlcyBhcmUgc2tpcHBlZC5cIixcbiAgICB9LFxuICAgIGZhbHNlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXguc2tpcFByZXZpb3VzbHlJbmRleGVkXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcIixcbiAgICAgIHN1YnRpdGxlOiBcIlNraXAgdW5jaGFuZ2VkIGZpbGVzIGZvciBmYXN0ZXIgbWFudWFsIHJ1bnMuIE9ubHkgaW5kZXhlcyBuZXcgZmlsZXMgb3IgY2hhbmdlZCBmaWxlcy5cIixcbiAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICB7XG4gICAgICAgICAga2V5OiBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgICAgICAgIGNvbmRpdGlvbjogeyB0eXBlOiBcImVxdWFsc1wiLCB2YWx1ZTogdHJ1ZSB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHRydWUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicHJvbXB0VGVtcGxhdGVcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlByb21wdCBUZW1wbGF0ZVwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiU3VwcG9ydHMge3tyYWdfY29udGV4dH19IChyZXF1aXJlZCkgYW5kIHt7dXNlcl9xdWVyeX19IG1hY3JvcyBmb3IgY3VzdG9taXppbmcgdGhlIGZpbmFsIHByb21wdC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBERUZBVUxUX1BST01QVF9URU1QTEFURSxcbiAgICAgIGlzUGFyYWdyYXBoOiB0cnVlLFxuICAgIH0sXG4gICAgREVGQVVMVF9QUk9NUFRfVEVNUExBVEUsXG4gIClcbiAgLmJ1aWxkKCk7XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IExvY2FsSW5kZXggfSBmcm9tIFwidmVjdHJhXCI7XG5cbmNvbnN0IE1BWF9JVEVNU19QRVJfU0hBUkQgPSAxMDAwMDtcbmNvbnN0IFNIQVJEX0RJUl9QUkVGSVggPSBcInNoYXJkX1wiO1xuY29uc3QgU0hBUkRfRElSX1JFR0VYID0gL15zaGFyZF8oXFxkKykkLztcblxuZXhwb3J0IGludGVyZmFjZSBEb2N1bWVudENodW5rIHtcbiAgaWQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xuICB2ZWN0b3I6IG51bWJlcltdO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaFJlc3VsdCB7XG4gIHRleHQ6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBzaGFyZE5hbWU6IHN0cmluZztcbiAgbWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbnR5cGUgQ2h1bmtNZXRhZGF0YSA9IHtcbiAgdGV4dDogc3RyaW5nO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcbn07XG5cbmV4cG9ydCBjbGFzcyBWZWN0b3JTdG9yZSB7XG4gIHByaXZhdGUgZGJQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgc2hhcmREaXJzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGFjdGl2ZVNoYXJkOiBMb2NhbEluZGV4IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlU2hhcmRDb3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB1cGRhdGVNdXRleDogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gIGNvbnN0cnVjdG9yKGRiUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5kYlBhdGggPSBwYXRoLnJlc29sdmUoZGJQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIGEgc2hhcmQgYnkgZGlyZWN0b3J5IG5hbWUgKGUuZy4gXCJzaGFyZF8wMDBcIikuIENhbGxlciBtdXN0IG5vdCBob2xkIHRoZSByZWZlcmVuY2VcbiAgICogYWZ0ZXIgdXNlIHNvIEdDIGNhbiBmcmVlIHRoZSBwYXJzZWQgaW5kZXggZGF0YS5cbiAgICovXG4gIHByaXZhdGUgb3BlblNoYXJkKGRpcjogc3RyaW5nKTogTG9jYWxJbmRleCB7XG4gICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIGRpcik7XG4gICAgcmV0dXJuIG5ldyBMb2NhbEluZGV4KGZ1bGxQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FuIGRiUGF0aCBmb3Igc2hhcmRfTk5OIGRpcmVjdG9yaWVzIGFuZCByZXR1cm4gc29ydGVkIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGRpc2NvdmVyU2hhcmREaXJzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpcih0aGlzLmRiUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgIGNvbnN0IGRpcnM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBlIG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChlLmlzRGlyZWN0b3J5KCkgJiYgU0hBUkRfRElSX1JFR0VYLnRlc3QoZS5uYW1lKSkge1xuICAgICAgICBkaXJzLnB1c2goZS5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGlycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBuID0gKG06IHN0cmluZykgPT4gcGFyc2VJbnQobS5tYXRjaChTSEFSRF9ESVJfUkVHRVgpIVsxXSwgMTApO1xuICAgICAgcmV0dXJuIG4oYSkgLSBuKGIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkaXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHZlY3RvciBzdG9yZTogZGlzY292ZXIgb3IgY3JlYXRlIHNoYXJkcywgb3BlbiB0aGUgbGFzdCBhcyBhY3RpdmUuXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLm1rZGlyKHRoaXMuZGJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB0aGlzLnNoYXJkRGlycyA9IGF3YWl0IHRoaXMuZGlzY292ZXJTaGFyZERpcnMoKTtcblxuICAgIGlmICh0aGlzLnNoYXJkRGlycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IGZpcnN0RGlyID0gYCR7U0hBUkRfRElSX1BSRUZJWH0wMDBgO1xuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIGZpcnN0RGlyKTtcbiAgICAgIGNvbnN0IGluZGV4ID0gbmV3IExvY2FsSW5kZXgoZnVsbFBhdGgpO1xuICAgICAgYXdhaXQgaW5kZXguY3JlYXRlSW5kZXgoeyB2ZXJzaW9uOiAxIH0pO1xuICAgICAgdGhpcy5zaGFyZERpcnMgPSBbZmlyc3REaXJdO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IGluZGV4O1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGFzdERpciA9IHRoaXMuc2hhcmREaXJzW3RoaXMuc2hhcmREaXJzLmxlbmd0aCAtIDFdO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IHRoaXMub3BlblNoYXJkKGxhc3REaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gaXRlbXMubGVuZ3RoO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGRvY3VtZW50IGNodW5rcyB0byB0aGUgYWN0aXZlIHNoYXJkLiBSb3RhdGVzIHRvIGEgbmV3IHNoYXJkIHdoZW4gZnVsbC5cbiAgICovXG4gIGFzeW5jIGFkZENodW5rcyhjaHVua3M6IERvY3VtZW50Q2h1bmtbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hY3RpdmVTaGFyZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVjdG9yIHN0b3JlIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICB9XG4gICAgaWYgKGNodW5rcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5hY3RpdmVTaGFyZCEuYmVnaW5VcGRhdGUoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGE6IENodW5rTWV0YWRhdGEgPSB7XG4gICAgICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICAgICAgZmlsZVBhdGg6IGNodW5rLmZpbGVQYXRoLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGNodW5rLmZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZUhhc2g6IGNodW5rLmZpbGVIYXNoLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogY2h1bmsuY2h1bmtJbmRleCxcbiAgICAgICAgICAgIC4uLmNodW5rLm1ldGFkYXRhLFxuICAgICAgICAgIH07XG4gICAgICAgICAgYXdhaXQgdGhpcy5hY3RpdmVTaGFyZCEudXBzZXJ0SXRlbSh7XG4gICAgICAgICAgICBpZDogY2h1bmsuaWQsXG4gICAgICAgICAgICB2ZWN0b3I6IGNodW5rLnZlY3RvcixcbiAgICAgICAgICAgIG1ldGFkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLmVuZFVwZGF0ZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkIS5jYW5jZWxVcGRhdGUoKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCArPSBjaHVua3MubGVuZ3RoO1xuICAgICAgY29uc29sZS5sb2coYEFkZGVkICR7Y2h1bmtzLmxlbmd0aH0gY2h1bmtzIHRvIHZlY3RvciBzdG9yZWApO1xuXG4gICAgICBpZiAodGhpcy5hY3RpdmVTaGFyZENvdW50ID49IE1BWF9JVEVNU19QRVJfU0hBUkQpIHtcbiAgICAgICAgY29uc3QgbmV4dE51bSA9IHRoaXMuc2hhcmREaXJzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgbmV4dERpciA9IGAke1NIQVJEX0RJUl9QUkVGSVh9JHtTdHJpbmcobmV4dE51bSkucGFkU3RhcnQoMywgXCIwXCIpfWA7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBuZXh0RGlyKTtcbiAgICAgICAgY29uc3QgbmV3SW5kZXggPSBuZXcgTG9jYWxJbmRleChmdWxsUGF0aCk7XG4gICAgICAgIGF3YWl0IG5ld0luZGV4LmNyZWF0ZUluZGV4KHsgdmVyc2lvbjogMSB9KTtcbiAgICAgICAgdGhpcy5zaGFyZERpcnMucHVzaChuZXh0RGlyKTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IG5ld0luZGV4O1xuICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgPSAwO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoOiBxdWVyeSBlYWNoIHNoYXJkIGluIHR1cm4sIG1lcmdlIHJlc3VsdHMsIHNvcnQgYnkgc2NvcmUsIGZpbHRlciBieSB0aHJlc2hvbGQsIHJldHVybiB0b3AgbGltaXQuXG4gICAqL1xuICBhc3luYyBzZWFyY2goXG4gICAgcXVlcnlWZWN0b3I6IG51bWJlcltdLFxuICAgIGxpbWl0OiBudW1iZXIgPSA1LFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMC41LFxuICApOiBQcm9taXNlPFNlYXJjaFJlc3VsdFtdPiB7XG4gICAgY29uc3QgbWVyZ2VkOiBTZWFyY2hSZXN1bHRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2hhcmQucXVlcnlJdGVtcyhcbiAgICAgICAgcXVlcnlWZWN0b3IsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGxpbWl0LFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIGZhbHNlLFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3QgciBvZiByZXN1bHRzKSB7XG4gICAgICAgIGNvbnN0IG0gPSByLml0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YTtcbiAgICAgICAgbWVyZ2VkLnB1c2goe1xuICAgICAgICAgIHRleHQ6IG0/LnRleHQgPz8gXCJcIixcbiAgICAgICAgICBzY29yZTogci5zY29yZSxcbiAgICAgICAgICBmaWxlUGF0aDogbT8uZmlsZVBhdGggPz8gXCJcIixcbiAgICAgICAgICBmaWxlTmFtZTogbT8uZmlsZU5hbWUgPz8gXCJcIixcbiAgICAgICAgICBjaHVua0luZGV4OiBtPy5jaHVua0luZGV4ID8/IDAsXG4gICAgICAgICAgc2hhcmROYW1lOiBkaXIsXG4gICAgICAgICAgbWV0YWRhdGE6IChyLml0ZW0ubWV0YWRhdGEgYXMgUmVjb3JkPHN0cmluZywgYW55PikgPz8ge30sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkXG4gICAgICAuZmlsdGVyKChyKSA9PiByLnNjb3JlID49IHRocmVzaG9sZClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSlcbiAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFsbCBjaHVua3MgZm9yIGEgZmlsZSAoYnkgaGFzaCkgYWNyb3NzIGFsbCBzaGFyZHMuXG4gICAqL1xuICBhc3luYyBkZWxldGVCeUZpbGVIYXNoKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsYXN0RGlyID0gdGhpcy5zaGFyZERpcnNbdGhpcy5zaGFyZERpcnMubGVuZ3RoIC0gMV07XG4gICAgdGhpcy51cGRhdGVNdXRleCA9IHRoaXMudXBkYXRlTXV0ZXgudGhlbihhc3luYyAoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICAgIGNvbnN0IHRvRGVsZXRlID0gaXRlbXMuZmlsdGVyKFxuICAgICAgICAgIChpKSA9PiAoaS5tZXRhZGF0YSBhcyBDaHVua01ldGFkYXRhKT8uZmlsZUhhc2ggPT09IGZpbGVIYXNoLFxuICAgICAgICApO1xuICAgICAgICBpZiAodG9EZWxldGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF3YWl0IHNoYXJkLmJlZ2luVXBkYXRlKCk7XG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRvRGVsZXRlKSB7XG4gICAgICAgICAgICBhd2FpdCBzaGFyZC5kZWxldGVJdGVtKGl0ZW0uaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBzaGFyZC5lbmRVcGRhdGUoKTtcbiAgICAgICAgICBpZiAoZGlyID09PSBsYXN0RGlyICYmIHRoaXMuYWN0aXZlU2hhcmQpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IChhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkLmxpc3RJdGVtcygpKS5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgRGVsZXRlZCBjaHVua3MgZm9yIGZpbGUgaGFzaDogJHtmaWxlSGFzaH1gKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVNdXRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZmlsZSBwYXRoIC0+IHNldCBvZiBmaWxlIGhhc2hlcyBjdXJyZW50bHkgaW4gdGhlIHN0b3JlLlxuICAgKi9cbiAgYXN5bmMgZ2V0RmlsZUhhc2hJbnZlbnRvcnkoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+IHtcbiAgICBjb25zdCBpbnZlbnRvcnkgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgIGNvbnN0IHNoYXJkID0gdGhpcy5vcGVuU2hhcmQoZGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgbSA9IGl0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBtPy5maWxlUGF0aDtcbiAgICAgICAgY29uc3QgZmlsZUhhc2ggPSBtPy5maWxlSGFzaDtcbiAgICAgICAgaWYgKCFmaWxlUGF0aCB8fCAhZmlsZUhhc2gpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgc2V0ID0gaW52ZW50b3J5LmdldChmaWxlUGF0aCk7XG4gICAgICAgIGlmICghc2V0KSB7XG4gICAgICAgICAgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgICAgaW52ZW50b3J5LnNldChmaWxlUGF0aCwgc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBzZXQuYWRkKGZpbGVIYXNoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGludmVudG9yeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdG90YWwgY2h1bmsgY291bnQgYW5kIHVuaXF1ZSBmaWxlIGNvdW50LlxuICAgKi9cbiAgYXN5bmMgZ2V0U3RhdHMoKTogUHJvbWlzZTx7XG4gICAgdG90YWxDaHVua3M6IG51bWJlcjtcbiAgICB1bmlxdWVGaWxlczogbnVtYmVyO1xuICB9PiB7XG4gICAgbGV0IHRvdGFsQ2h1bmtzID0gMDtcbiAgICBjb25zdCB1bmlxdWVIYXNoZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBzaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIHRvdGFsQ2h1bmtzICs9IGl0ZW1zLmxlbmd0aDtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCBoID0gKGl0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YSk/LmZpbGVIYXNoO1xuICAgICAgICBpZiAoaCkgdW5pcXVlSGFzaGVzLmFkZChoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdG90YWxDaHVua3MsIHVuaXF1ZUZpbGVzOiB1bmlxdWVIYXNoZXMuc2l6ZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFueSBjaHVuayBleGlzdHMgZm9yIHRoZSBnaXZlbiBmaWxlIGhhc2ggKHNob3J0LWNpcmN1aXRzIG9uIGZpcnN0IG1hdGNoKS5cbiAgICovXG4gIGFzeW5jIGhhc0ZpbGUoZmlsZUhhc2g6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgaWYgKGl0ZW1zLnNvbWUoKGkpID0+IChpLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGEpPy5maWxlSGFzaCA9PT0gZmlsZUhhc2gpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVsZWFzZSB0aGUgYWN0aXZlIHNoYXJkIHJlZmVyZW5jZS5cbiAgICovXG4gIGFzeW5jIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTYW5pdHlDaGVja1Jlc3VsdCB7XG4gIHBhc3NlZDogYm9vbGVhbjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFBlcmZvcm0gc2FuaXR5IGNoZWNrcyBiZWZvcmUgaW5kZXhpbmcgbGFyZ2UgZGlyZWN0b3JpZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1TYW5pdHlDaGVja3MoXG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nLFxuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nLFxuKTogUHJvbWlzZTxTYW5pdHlDaGVja1Jlc3VsdD4ge1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIENoZWNrIGlmIGRpcmVjdG9yaWVzIGV4aXN0XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKGRvY3VtZW50c0RpciwgZnMuY29uc3RhbnRzLlJfT0spO1xuICB9IGNhdGNoIHtcbiAgICBlcnJvcnMucHVzaChgRG9jdW1lbnRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgcmVhZGFibGU6ICR7ZG9jdW1lbnRzRGlyfWApO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3ModmVjdG9yU3RvcmVEaXIsIGZzLmNvbnN0YW50cy5XX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gVHJ5IHRvIGNyZWF0ZSBpdFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2Rpcih2ZWN0b3JTdG9yZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgYFZlY3RvciBzdG9yZSBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiAke3ZlY3RvclN0b3JlRGlyfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXRmcyh2ZWN0b3JTdG9yZURpcik7XG4gICAgY29uc3QgYXZhaWxhYmxlR0IgPSAoc3RhdHMuYmF2YWlsICogc3RhdHMuYnNpemUpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGF2YWlsYWJsZUdCIDwgMSkge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbGFibGVHQiA8IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKGBMb3cgZGlzayBzcGFjZSBhdmFpbGFibGU6ICR7YXZhaWxhYmxlR0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBjaGVjayBhdmFpbGFibGUgZGlzayBzcGFjZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBtZW1vcnlcbiAgY29uc3QgZnJlZU1lbW9yeUdCID0gb3MuZnJlZW1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHRvdGFsTWVtb3J5R0IgPSBvcy50b3RhbG1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHJ1bm5pbmdPbk1hYyA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCI7XG4gIGNvbnN0IGxvd01lbW9yeU1lc3NhZ2UgPVxuICAgIGBMb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCIG9mICR7dG90YWxNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQiB0b3RhbC4gYCArXG4gICAgXCJDb25zaWRlciByZWR1Y2luZyBjb25jdXJyZW50IGZpbGUgcHJvY2Vzc2luZy5cIjtcbiAgY29uc3QgdmVyeUxvd01lbW9yeU1lc3NhZ2UgPVxuICAgIGBWZXJ5IGxvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0IuIGAgK1xuICAgIChydW5uaW5nT25NYWNcbiAgICAgID8gXCJtYWNPUyBtYXkgYmUgcmVwb3J0aW5nIGNhY2hlZCBwYWdlcyBhcyB1c2VkOyBjYWNoZWQgbWVtb3J5IGNhbiB1c3VhbGx5IGJlIHJlY2xhaW1lZCBhdXRvbWF0aWNhbGx5LlwiXG4gICAgICA6IFwiSW5kZXhpbmcgbWF5IGZhaWwgZHVlIHRvIGluc3VmZmljaWVudCBSQU0uXCIpO1xuXG4gIGlmIChmcmVlTWVtb3J5R0IgPCAwLjUpIHtcbiAgICBpZiAocnVubmluZ09uTWFjKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHZlcnlMb3dNZW1vcnlNZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCAyKSB7XG4gICAgd2FybmluZ3MucHVzaChsb3dNZW1vcnlNZXNzYWdlKTtcbiAgfVxuXG4gIC8vIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIChzYW1wbGUtYmFzZWQgZm9yIHBlcmZvcm1hbmNlKVxuICB0cnkge1xuICAgIGNvbnN0IHNhbXBsZVNpemUgPSBhd2FpdCBlc3RpbWF0ZURpcmVjdG9yeVNpemUoZG9jdW1lbnRzRGlyKTtcbiAgICBjb25zdCBlc3RpbWF0ZWRHQiA9IHNhbXBsZVNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgICBcbiAgICBpZiAoZXN0aW1hdGVkR0IgPiAxMDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGBMYXJnZSBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSBzZXZlcmFsIGhvdXJzLmBcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChlc3RpbWF0ZWRHQiA+IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTWVkaXVtLXNpemVkIGRpcmVjdG9yeSBkZXRlY3RlZCAofiR7ZXN0aW1hdGVkR0IudG9GaXhlZCgxKX0gR0IpLiBJbml0aWFsIGluZGV4aW5nIG1heSB0YWtlIDMwLTYwIG1pbnV0ZXMuYFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBlc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHZlY3RvciBzdG9yZSBhbHJlYWR5IGhhcyBkYXRhXG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKHZlY3RvclN0b3JlRGlyKTtcbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgXCJWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGlzIG5vdCBlbXB0eS4gRXhpc3RpbmcgZGF0YSB3aWxsIGJlIHVzZWQgZm9yIGluY3JlbWVudGFsIGluZGV4aW5nLlwiXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QgeWV0LCB0aGF0J3MgZmluZVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwYXNzZWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgd2FybmluZ3MsXG4gICAgZXJyb3JzLFxuICB9O1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIGJ5IHNhbXBsaW5nXG4gKiAoUXVpY2sgZXN0aW1hdGUsIG5vdCBleGFjdClcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRpcjogc3RyaW5nLCBtYXhTYW1wbGVzOiBudW1iZXIgPSAxMDApOiBQcm9taXNlPG51bWJlcj4ge1xuICBsZXQgdG90YWxTaXplID0gMDtcbiAgbGV0IGZpbGVDb3VudCA9IDA7XG4gIGxldCBzYW1wbGVkU2l6ZSA9IDA7XG4gIGxldCBzYW1wbGVkQ291bnQgPSAwO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoY3VycmVudERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHNhbXBsZWRDb3VudCA+PSBtYXhTYW1wbGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGN1cnJlbnREaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBgJHtjdXJyZW50RGlyfS8ke2VudHJ5Lm5hbWV9YDtcblxuICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIGF3YWl0IHdhbGsoZnVsbFBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICAgICAgZmlsZUNvdW50Kys7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKHNhbXBsZWRDb3VudCA8IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgIHNhbXBsZWRTaXplICs9IHN0YXRzLnNpemU7XG4gICAgICAgICAgICAgIHNhbXBsZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIFNraXAgZmlsZXMgd2UgY2FuJ3Qgc3RhdFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU2tpcCBkaXJlY3RvcmllcyB3ZSBjYW4ndCByZWFkXG4gICAgfVxuICB9XG5cbiAgYXdhaXQgd2FsayhkaXIpO1xuXG4gIC8vIEV4dHJhcG9sYXRlIGZyb20gc2FtcGxlXG4gIGlmIChzYW1wbGVkQ291bnQgPiAwICYmIGZpbGVDb3VudCA+IDApIHtcbiAgICBjb25zdCBhdmdGaWxlU2l6ZSA9IHNhbXBsZWRTaXplIC8gc2FtcGxlZENvdW50O1xuICAgIHRvdGFsU2l6ZSA9IGF2Z0ZpbGVTaXplICogZmlsZUNvdW50O1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsU2l6ZTtcbn1cblxuLyoqXG4gKiBDaGVjayBzeXN0ZW0gcmVzb3VyY2VzIGFuZCBwcm92aWRlIHJlY29tbWVuZGF0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2VSZWNvbW1lbmRhdGlvbnMoXG4gIGVzdGltYXRlZFNpemVHQjogbnVtYmVyLFxuICBmcmVlTWVtb3J5R0I6IG51bWJlcixcbik6IHtcbiAgcmVjb21tZW5kZWRDb25jdXJyZW5jeTogbnVtYmVyO1xuICByZWNvbW1lbmRlZENodW5rU2l6ZTogbnVtYmVyO1xuICBlc3RpbWF0ZWRUaW1lOiBzdHJpbmc7XG59IHtcbiAgbGV0IHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAzO1xuICBsZXQgcmVjb21tZW5kZWRDaHVua1NpemUgPSA1MTI7XG4gIGxldCBlc3RpbWF0ZWRUaW1lID0gXCJ1bmtub3duXCI7XG5cbiAgLy8gQWRqdXN0IGJhc2VkIG9uIGF2YWlsYWJsZSBtZW1vcnlcbiAgaWYgKGZyZWVNZW1vcnlHQiA8IDIpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMTtcbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCA0KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDI7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCID49IDgpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gNTtcbiAgfVxuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBkYXRhc2V0IHNpemVcbiAgaWYgKGVzdGltYXRlZFNpemVHQiA8IDEpIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCI1LTE1IG1pbnV0ZXNcIjtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMCkge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjMwLTYwIG1pbnV0ZXNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDc2ODtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMDApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIyLTQgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gIH0gZWxzZSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNC0xMiBob3Vyc1wiO1xuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplID0gMTAyNDtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gTWF0aC5taW4ocmVjb21tZW5kZWRDb25jdXJyZW5jeSwgMyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3ksXG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUsXG4gICAgZXN0aW1hdGVkVGltZSxcbiAgfTtcbn1cblxuIiwgImxldCBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGFjcXVpcmUgdGhlIHNoYXJlZCBpbmRleGluZyBsb2NrLlxuICogUmV0dXJucyB0cnVlIGlmIG5vIG90aGVyIGluZGV4aW5nIGpvYiBpcyBydW5uaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ5U3RhcnRJbmRleGluZyhjb250ZXh0OiBzdHJpbmcgPSBcInVua25vd25cIik6IGJvb2xlYW4ge1xuICBpZiAoaW5kZXhpbmdJblByb2dyZXNzKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gdHJ5U3RhcnRJbmRleGluZyAoJHtjb250ZXh0fSkgZmFpbGVkOiBsb2NrIGFscmVhZHkgaGVsZGApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGluZGV4aW5nSW5Qcm9ncmVzcyA9IHRydWU7XG4gIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIHN1Y2NlZWRlZGApO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZWxlYXNlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmlzaEluZGV4aW5nKCk6IHZvaWQge1xuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgY29uc29sZS5kZWJ1ZyhcIltCaWdSQUddIGZpbmlzaEluZGV4aW5nOiBsb2NrIHJlbGVhc2VkXCIpO1xufVxuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIGFuIGluZGV4aW5nIGpvYiBpcyBjdXJyZW50bHkgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhpbmcoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmRleGluZ0luUHJvZ3Jlc3M7XG59XG5cbiIsICIvKipcbiAqIE5hdGl2ZSBtb2R1bGUgcmUtZXhwb3J0c1xuICogXG4gKiBUaGlzIG1vZHVsZSBwcm92aWRlcyBoaWdoLXBlcmZvcm1hbmNlIFJ1c3QgaW1wbGVtZW50YXRpb25zIG9mOlxuICogLSBGaWxlIGhhc2hpbmcgKFNIQS0yNTYpXG4gKiAtIFRleHQgY2h1bmtpbmdcbiAqIC0gRGlyZWN0b3J5IHNjYW5uaW5nXG4gKiBcbiAqIEZhbGxzIGJhY2sgdG8gVHlwZVNjcmlwdCBpbXBsZW1lbnRhdGlvbnMgaWYgbmF0aXZlIG1vZHVsZSBpcyBub3QgYXZhaWxhYmxlLlxuICovXG5cbi8vIFRyeSB0byBsb2FkIG5hdGl2ZSBtb2R1bGUsIGZhbGxiYWNrIHRvIFRTIGlmIG5vdCBhdmFpbGFibGVcbmxldCBuYXRpdmVNb2R1bGU6IGFueSA9IG51bGw7XG5sZXQgbmF0aXZlTG9hZEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxudHJ5IHtcbiAgLy8gVHJ5IGRpZmZlcmVudCBwb3NzaWJsZSBwYXRocyBmb3IgdGhlIG5hdGl2ZSBtb2R1bGVcbiAgY29uc3QgcGF0aHMgPSBbXG4gICAgJy4uLy4uL25hdGl2ZS9iaWdyYWctbmF0aXZlLmxpbnV4LXg2NC1nbnUubm9kZScsXG4gICAgJy4uLy4uL25hdGl2ZS9pbmRleC5ub2RlJyxcbiAgICAnQGJpZ3JhZy9uYXRpdmUnLFxuICBdO1xuXG4gIGZvciAoY29uc3QgcCBvZiBwYXRocykge1xuICAgIHRyeSB7XG4gICAgICBuYXRpdmVNb2R1bGUgPSByZXF1aXJlKHApO1xuICAgICAgYnJlYWs7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gIH1cbn0gY2F0Y2ggKGUpIHtcbiAgbmF0aXZlTG9hZEVycm9yID0gKGUgYXMgRXJyb3IpLm1lc3NhZ2U7XG59XG5cbi8vIFR5cGUgZGVmaW5pdGlvbnMgKG5hcGktcnMgY29udmVydHMgc25ha2VfY2FzZSB0byBjYW1lbENhc2UgZm9yIEpTKVxuZXhwb3J0IGludGVyZmFjZSBIYXNoUmVzdWx0IHtcbiAgcGF0aDogc3RyaW5nO1xuICBoYXNoOiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0Q2h1bmsge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0SW5kZXg6IG51bWJlcjtcbiAgZW5kSW5kZXg6IG51bWJlcjtcbiAgdG9rZW5Fc3RpbWF0ZTogbnVtYmVyO1xufVxuXG4vLy8gQmF0Y2ggY2h1bmsgcmVzdWx0IHdpdGggZmlsZSBpbmRleCBmb3IgaWRlbnRpZnlpbmcgc291cmNlIGRvY3VtZW50XG5leHBvcnQgaW50ZXJmYWNlIEJhdGNoQ2h1bmtSZXN1bHQge1xuICBmaWxlSW5kZXg6IG51bWJlcjtcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YXJ0SW5kZXg6IG51bWJlcjtcbiAgZW5kSW5kZXg6IG51bWJlcjtcbiAgdG9rZW5Fc3RpbWF0ZTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNjYW5uZWRGaWxlIHtcbiAgcGF0aDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGV4dGVuc2lvbjogc3RyaW5nO1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBudW1iZXI7XG59XG5cbi8vIEZhbGxiYWNrIGltcGxlbWVudGF0aW9uc1xuY29uc3QgZmFsbGJhY2tzID0ge1xuICBoYXNoRmlsZTogYXN5bmMgKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgY3J5cHRvID0gYXdhaXQgaW1wb3J0KCdjcnlwdG8nKTtcbiAgICBjb25zdCBmcyA9IGF3YWl0IGltcG9ydCgnZnMnKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcbiAgICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0ocGF0aCk7XG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoZGF0YSkgPT4gaGFzaC51cGRhdGUoZGF0YSkpO1xuICAgICAgc3RyZWFtLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KCdoZXgnKSkpO1xuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIHJlamVjdCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgY2h1bmtUZXh0OiAoXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIGNodW5rU2l6ZTogbnVtYmVyLFxuICAgIG92ZXJsYXA6IG51bWJlclxuICApOiBUZXh0Q2h1bmtbXSA9PiB7XG4gICAgY29uc3QgY2h1bmtzOiBUZXh0Q2h1bmtbXSA9IFtdO1xuICAgIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgvXFxzKy8pO1xuICAgIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHJldHVybiBjaHVua3M7XG5cbiAgICBsZXQgc3RhcnRJZHggPSAwO1xuICAgIHdoaWxlIChzdGFydElkeCA8IHdvcmRzLmxlbmd0aCkge1xuICAgICAgY29uc3QgZW5kSWR4ID0gTWF0aC5taW4oc3RhcnRJZHggKyBjaHVua1NpemUsIHdvcmRzLmxlbmd0aCk7XG4gICAgICBjb25zdCBjaHVua1dvcmRzID0gd29yZHMuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XG4gICAgICBjb25zdCBjaHVua1RleHQgPSBjaHVua1dvcmRzLmpvaW4oJyAnKTtcbiAgICAgIGNodW5rcy5wdXNoKHtcbiAgICAgICAgdGV4dDogY2h1bmtUZXh0LFxuICAgICAgICBzdGFydEluZGV4OiBzdGFydElkeCxcbiAgICAgICAgZW5kSW5kZXg6IGVuZElkeCxcbiAgICAgICAgdG9rZW5Fc3RpbWF0ZTogTWF0aC5jZWlsKGNodW5rVGV4dC5sZW5ndGggLyA0KSxcbiAgICAgIH0pO1xuICAgICAgc3RhcnRJZHggKz0gTWF0aC5tYXgoMSwgY2h1bmtTaXplIC0gb3ZlcmxhcCk7XG4gICAgICBpZiAoZW5kSWR4ID49IHdvcmRzLmxlbmd0aCkgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBjaHVua3M7XG4gIH0sXG5cbiAgc2NhbkRpcmVjdG9yeTogYXN5bmMgKHJvb3Q6IHN0cmluZyk6IFByb21pc2U8U2Nhbm5lZEZpbGVbXT4gPT4ge1xuICAgIGNvbnN0IGZzID0gYXdhaXQgaW1wb3J0KCdmcycpO1xuICAgIGNvbnN0IHBhdGggPSBhd2FpdCBpbXBvcnQoJ3BhdGgnKTtcbiAgICBjb25zdCBmaWxlczogU2Nhbm5lZEZpbGVbXSA9IFtdO1xuXG4gICAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9ucyA9IG5ldyBTZXQoW1xuICAgICAgJy50eHQnLCAnLm1kJywgJy5tYXJrZG93bicsICcuaHRtbCcsICcuaHRtJywgJy5wZGYnLCAnLmVwdWInLFxuICAgICAgJy5qcGcnLCAnLmpwZWcnLCAnLnBuZycsICcuZ2lmJywgJy5ibXAnLCAnLnRpZmYnLCAnLndlYnAnLFxuICAgIF0pO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gd2FsayhkaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBlbnRyeS5uYW1lKTtcbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShlbnRyeS5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIGlmIChzdXBwb3J0ZWRFeHRlbnNpb25zLmhhcyhleHQpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgZmlsZXMucHVzaCh7XG4gICAgICAgICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICAgICAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgICAgICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgICAgICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICAgICAgICAgICAgbXRpbWU6IHN0YXRzLm10aW1lTXMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBhd2FpdCB3YWxrKHJvb3QpO1xuICAgIHJldHVybiBmaWxlcztcbiAgfSxcbn07XG5cbi8vIEV4cG9ydCBmdW5jdGlvbnMgd2l0aCBuYXRpdmUvVFMgZmFsbGJhY2tcbmV4cG9ydCBjb25zdCBoYXNoRmlsZSA9IG5hdGl2ZU1vZHVsZT8uaGFzaEZpbGUgfHwgZmFsbGJhY2tzLmhhc2hGaWxlO1xuZXhwb3J0IGNvbnN0IGhhc2hGaWxlc1BhcmFsbGVsID0gbmF0aXZlTW9kdWxlPy5oYXNoRmlsZXNQYXJhbGxlbDtcbmV4cG9ydCBjb25zdCBoYXNoRGF0YSA9IG5hdGl2ZU1vZHVsZT8uaGFzaERhdGE7XG5cbi8vIE9wdGltaXplZCBjaHVua2luZyAtIHVzZSBuYXRpdmUgd2hlbiBhdmFpbGFibGVcbmV4cG9ydCBjb25zdCBjaHVua1RleHQgPSBuYXRpdmVNb2R1bGU/LmNodW5rVGV4dCB8fCBmYWxsYmFja3MuY2h1bmtUZXh0O1xuZXhwb3J0IGNvbnN0IGNodW5rVGV4dEZhc3QgPSBuYXRpdmVNb2R1bGU/LmNodW5rVGV4dEZhc3Q7XG5leHBvcnQgY29uc3QgY2h1bmtUZXh0c1BhcmFsbGVsID0gbmF0aXZlTW9kdWxlPy5jaHVua1RleHRzUGFyYWxsZWw7XG5leHBvcnQgY29uc3QgY2h1bmtUZXh0c0JhdGNoID0gbmF0aXZlTW9kdWxlPy5jaHVua1RleHRzQmF0Y2g7XG5leHBvcnQgY29uc3QgZXN0aW1hdGVUb2tlbnMgPSBuYXRpdmVNb2R1bGU/LmVzdGltYXRlVG9rZW5zO1xuZXhwb3J0IGNvbnN0IGVzdGltYXRlVG9rZW5zQmF0Y2ggPSBuYXRpdmVNb2R1bGU/LmVzdGltYXRlVG9rZW5zQmF0Y2g7XG5cbmV4cG9ydCBjb25zdCBzY2FuRGlyZWN0b3J5ID0gbmF0aXZlTW9kdWxlPy5zY2FuRGlyZWN0b3J5IHx8IGZhbGxiYWNrcy5zY2FuRGlyZWN0b3J5O1xuZXhwb3J0IGNvbnN0IGlzU3VwcG9ydGVkRXh0ZW5zaW9uID0gbmF0aXZlTW9kdWxlPy5pc1N1cHBvcnRlZEV4dGVuc2lvbiB8fCAoKCkgPT4gdHJ1ZSk7XG5leHBvcnQgY29uc3QgZ2V0U3VwcG9ydGVkRXh0ZW5zaW9ucyA9IG5hdGl2ZU1vZHVsZT8uZ2V0U3VwcG9ydGVkRXh0ZW5zaW9ucztcbmV4cG9ydCBjb25zdCBEaXJlY3RvcnlTY2FubmVyID0gbmF0aXZlTW9kdWxlPy5EaXJlY3RvcnlTY2FubmVyO1xuXG4vLyBVdGlsaXR5IGZ1bmN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGlzTmF0aXZlQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmF0aXZlTW9kdWxlICE9PSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF0aXZlTG9hZEVycm9yKCk6IHN0cmluZyB8IG51bGwge1xuICByZXR1cm4gbmF0aXZlTG9hZEVycm9yO1xufVxuIiwgImNvbnN0IEhUTUxfRVhURU5TSU9OUyA9IFtcIi5odG1cIiwgXCIuaHRtbFwiLCBcIi54aHRtbFwiXTtcbmNvbnN0IE1BUktET1dOX0VYVEVOU0lPTlMgPSBbXCIubWRcIiwgXCIubWFya2Rvd25cIiwgXCIubWRvd25cIiwgXCIubWR4XCIsIFwiLm1rZFwiLCBcIi5ta2RuXCJdO1xuY29uc3QgVEVYVF9FWFRFTlNJT05TID0gW1wiLnR4dFwiLCBcIi50ZXh0XCJdO1xuY29uc3QgUERGX0VYVEVOU0lPTlMgPSBbXCIucGRmXCJdO1xuY29uc3QgRVBVQl9FWFRFTlNJT05TID0gW1wiLmVwdWJcIl07XG5jb25zdCBJTUFHRV9FWFRFTlNJT05TID0gW1wiLmJtcFwiLCBcIi5qcGdcIiwgXCIuanBlZ1wiLCBcIi5wbmdcIl07XG5jb25zdCBBUkNISVZFX0VYVEVOU0lPTlMgPSBbXCIucmFyXCJdO1xuXG5jb25zdCBBTExfRVhURU5TSU9OX0dST1VQUyA9IFtcbiAgSFRNTF9FWFRFTlNJT05TLFxuICBNQVJLRE9XTl9FWFRFTlNJT05TLFxuICBURVhUX0VYVEVOU0lPTlMsXG4gIFBERl9FWFRFTlNJT05TLFxuICBFUFVCX0VYVEVOU0lPTlMsXG4gIElNQUdFX0VYVEVOU0lPTlMsXG4gIEFSQ0hJVkVfRVhURU5TSU9OUyxcbl07XG5cbmV4cG9ydCBjb25zdCBTVVBQT1JURURfRVhURU5TSU9OUyA9IG5ldyBTZXQoXG4gIEFMTF9FWFRFTlNJT05fR1JPVVBTLmZsYXRNYXAoKGdyb3VwKSA9PiBncm91cC5tYXAoKGV4dCkgPT4gZXh0LnRvTG93ZXJDYXNlKCkpKSxcbik7XG5cbmV4cG9ydCBjb25zdCBIVE1MX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KEhUTUxfRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgTUFSS0RPV05fRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoTUFSS0RPV05fRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgVEVYVF9FWFRFTlNJT05fU0VUID0gbmV3IFNldChURVhUX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IElNQUdFX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KElNQUdFX0VYVEVOU0lPTlMpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNIdG1sRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBIVE1MX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFya2Rvd25FeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIE1BUktET1dOX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBURVhUX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVGV4dHVhbEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNNYXJrZG93bkV4dGVuc2lvbihleHQpIHx8IGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucygpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKFNVUFBPUlRFRF9FWFRFTlNJT05TLnZhbHVlcygpKS5zb3J0KCk7XG59XG5cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgbWltZSBmcm9tIFwibWltZS10eXBlc1wiO1xuaW1wb3J0IHtcbiAgc2NhbkRpcmVjdG9yeSBhcyBuYXRpdmVTY2FuRGlyZWN0b3J5LFxuICBpc05hdGl2ZUF2YWlsYWJsZSxcbiAgU2Nhbm5lZEZpbGUgYXMgTmF0aXZlU2Nhbm5lZEZpbGUsXG59IGZyb20gXCIuLi9uYXRpdmVcIjtcbmltcG9ydCB7XG4gIFNVUFBPUlRFRF9FWFRFTlNJT05TLFxuICBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucyxcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTY2FubmVkRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBleHRlbnNpb246IHN0cmluZztcbiAgbWltZVR5cGU6IHN0cmluZyB8IGZhbHNlO1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBEYXRlO1xufVxuXG4vKiogTm9ybWFsaXplIGFuZCB2YWxpZGF0ZSB0aGUgcm9vdCBkaXJlY3RvcnkgZm9yIHNjYW5uaW5nIChyZXNvbHZlcyBwYXRoLCBzdHJpcHMgdHJhaWxpbmcgc2xhc2hlcykuICovXG5mdW5jdGlvbiBub3JtYWxpemVSb290RGlyKHJvb3REaXI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBwYXRoLnJlc29sdmUocm9vdERpci50cmltKCkpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHNjYW4gYSBkaXJlY3RvcnkgZm9yIHN1cHBvcnRlZCBmaWxlc1xuICogVXNlcyBuYXRpdmUgUnVzdCBpbXBsZW1lbnRhdGlvbiB3aGVuIGF2YWlsYWJsZSBmb3IgMTB4IHNwZWVkdXBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoXG4gIHJvb3REaXI6IHN0cmluZyxcbiAgb25Qcm9ncmVzcz86IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpID0+IHZvaWQsXG4pOiBQcm9taXNlPFNjYW5uZWRGaWxlW10+IHtcbiAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZVJvb3REaXIocm9vdERpcik7XG4gIFxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2Vzcyhyb290LCBmcy5jb25zdGFudHMuUl9PSyk7XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgaWYgKGVycj8uY29kZSA9PT0gXCJFTk9FTlRcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgRG9jdW1lbnRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdDogJHtyb290fS4gQ2hlY2sgdGhlIHBhdGggKGUuZy4gc3BlbGxpbmcgYW5kIHRoYXQgdGhlIGZvbGRlciBleGlzdHMpLmAsXG4gICAgICApO1xuICAgIH1cbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICAvLyBVc2UgbmF0aXZlIFJ1c3QgaW1wbGVtZW50YXRpb24gaWYgYXZhaWxhYmxlXG4gIGlmIChpc05hdGl2ZUF2YWlsYWJsZSgpKSB7XG4gICAgY29uc3QgbmF0aXZlRmlsZXMgPSBhd2FpdCBuYXRpdmVTY2FuRGlyZWN0b3J5KHJvb3QpIGFzIE5hdGl2ZVNjYW5uZWRGaWxlW107XG4gICAgXG4gICAgLy8gQ29udmVydCBuYXRpdmUgZm9ybWF0IHRvIGV4cGVjdGVkIGZvcm1hdFxuICAgIGNvbnN0IGZpbGVzOiBTY2FubmVkRmlsZVtdID0gbmF0aXZlRmlsZXMubWFwKChmKSA9PiAoe1xuICAgICAgcGF0aDogZi5wYXRoLFxuICAgICAgbmFtZTogZi5uYW1lLFxuICAgICAgZXh0ZW5zaW9uOiBmLmV4dGVuc2lvbixcbiAgICAgIG1pbWVUeXBlOiBtaW1lLmxvb2t1cChmLnBhdGgpLFxuICAgICAgc2l6ZTogZi5zaXplLFxuICAgICAgbXRpbWU6IG5ldyBEYXRlKGYubXRpbWUgKiAxMDAwKSwgLy8gQ29udmVydCBmcm9tIFVuaXggdGltZXN0YW1wXG4gICAgfSkpO1xuXG4gICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgIG9uUHJvZ3Jlc3MoZmlsZXMubGVuZ3RoLCBmaWxlcy5sZW5ndGgpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlcztcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIFR5cGVTY3JpcHQgaW1wbGVtZW50YXRpb25cbiAgY29uc3QgZmlsZXM6IFNjYW5uZWRGaWxlW10gPSBbXTtcbiAgbGV0IHNjYW5uZWRDb3VudCA9IDA7XG5cbiAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9uID0gbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMoKS5qb2luKFwiLCBcIik7XG4gIGNvbnNvbGUubG9nKGBbU2Nhbm5lcl0gU3VwcG9ydGVkIGV4dGVuc2lvbnM6ICR7c3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9ufWApO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoZGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGVudHJ5Lm5hbWUpO1xuXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgYXdhaXQgd2FsayhmdWxsUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBzY2FubmVkQ291bnQrKztcblxuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShlbnRyeS5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgaWYgKFNVUFBPUlRFRF9FWFRFTlNJT05TLmhhcyhleHQpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgY29uc3QgbWltZVR5cGUgPSBtaW1lLmxvb2t1cChmdWxsUGF0aCk7XG5cbiAgICAgICAgICAgIGZpbGVzLnB1c2goe1xuICAgICAgICAgICAgICBwYXRoOiBmdWxsUGF0aCxcbiAgICAgICAgICAgICAgbmFtZTogZW50cnkubmFtZSxcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBleHQsXG4gICAgICAgICAgICAgIG1pbWVUeXBlLFxuICAgICAgICAgICAgICBzaXplOiBzdGF0cy5zaXplLFxuICAgICAgICAgICAgICBtdGltZTogc3RhdHMubXRpbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob25Qcm9ncmVzcyAmJiBzY2FubmVkQ291bnQgJSAxMDAgPT09IDApIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBzY2FubmluZyBkaXJlY3RvcnkgJHtkaXJ9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhd2FpdCB3YWxrKHJvb3QpO1xuXG4gIGlmIChvblByb2dyZXNzKSB7XG4gICAgb25Qcm9ncmVzcyhzY2FubmVkQ291bnQsIGZpbGVzLmxlbmd0aCk7XG4gIH1cblxuICByZXR1cm4gZmlsZXM7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBmaWxlIHR5cGUgaXMgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N1cHBvcnRlZEZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBTVVBQT1JURURfRVhURU5TSU9OUy5oYXMoZXh0KTtcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBuYXRpdmUgc2Nhbm5pbmcgaXMgYXZhaWxhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc05hdGl2ZVNjYW5uaW5nQXZhaWxhYmxlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNOYXRpdmVBdmFpbGFibGUoKTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSBcImNoZWVyaW9cIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIFBhcnNlIEhUTUwvSFRNIGZpbGVzIGFuZCBleHRyYWN0IHRleHQgY29udGVudFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VIVE1MKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCAkID0gY2hlZXJpby5sb2FkKGNvbnRlbnQpO1xuICAgIFxuICAgIC8vIFJlbW92ZSBzY3JpcHQgYW5kIHN0eWxlIGVsZW1lbnRzXG4gICAgJChcInNjcmlwdCwgc3R5bGUsIG5vc2NyaXB0XCIpLnJlbW92ZSgpO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgdGV4dFxuICAgIGNvbnN0IHRleHQgPSAkKFwiYm9keVwiKS50ZXh0KCkgfHwgJC50ZXh0KCk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgd2hpdGVzcGFjZVxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgSFRNTCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwZGZQYXJzZSBmcm9tIFwicGRmLXBhcnNlXCI7XG5pbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5pbXBvcnQgeyBQTkcgfSBmcm9tIFwicG5nanNcIjtcblxuY29uc3QgTUlOX1RFWFRfTEVOR1RIID0gNTA7XG5jb25zdCBPQ1JfTUFYX1BBR0VTID0gNTA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFU19QRVJfUEFHRSA9IDM7XG5jb25zdCBPQ1JfTUlOX0lNQUdFX0FSRUEgPSAxMF8wMDA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFX1BJWEVMUyA9IDUwXzAwMF8wMDA7IC8vIH43MDAweDcwMDA7IHByZXZlbnRzIGxlcHRvbmljYSBwaXhkYXRhX21hbGxvYyBjcmFzaGVzXG5jb25zdCBPQ1JfSU1BR0VfVElNRU9VVF9NUyA9IDMwXzAwMDtcblxudHlwZSBQZGZKc01vZHVsZSA9IHR5cGVvZiBpbXBvcnQoXCJwZGZqcy1kaXN0L2xlZ2FjeS9idWlsZC9wZGYubWpzXCIpO1xuXG5pbnRlcmZhY2UgRXh0cmFjdGVkT2NySW1hZ2Uge1xuICBidWZmZXI6IEJ1ZmZlcjtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIGFyZWE6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUGRmRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJwZGYubG1zdHVkaW8tZXJyb3JcIlxuICB8IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCJcbiAgfCBcInBkZi5wZGZwYXJzZS1lcnJvclwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZW1wdHlcIlxuICB8IFwicGRmLm9jci1kaXNhYmxlZFwiXG4gIHwgXCJwZGYub2NyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItcmVuZGVyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItZW1wdHlcIjtcblxudHlwZSBQZGZQYXJzZVN0YWdlID0gXCJsbXN0dWRpb1wiIHwgXCJwZGYtcGFyc2VcIiB8IFwib2NyXCI7XG5jbGFzcyBJbWFnZURhdGFUaW1lb3V0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9iaklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVGltZWQgb3V0IGZldGNoaW5nIGltYWdlIGRhdGEgZm9yICR7b2JqSWR9YCk7XG4gICAgdGhpcy5uYW1lID0gXCJJbWFnZURhdGFUaW1lb3V0RXJyb3JcIjtcbiAgfVxufVxuXG5pbnRlcmZhY2UgUGRmUGFyc2VyU3VjY2VzcyB7XG4gIHN1Y2Nlc3M6IHRydWU7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhZ2U6IFBkZlBhcnNlU3RhZ2U7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmUGFyc2VyRmFpbHVyZSB7XG4gIHN1Y2Nlc3M6IGZhbHNlO1xuICByZWFzb246IFBkZkZhaWx1cmVSZWFzb247XG4gIGRldGFpbHM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFBkZlBhcnNlclJlc3VsdCA9IFBkZlBhcnNlclN1Y2Nlc3MgfCBQZGZQYXJzZXJGYWlsdXJlO1xuXG5mdW5jdGlvbiBjbGVhblRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbnR5cGUgU3RhZ2VSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxubGV0IGNhY2hlZFBkZmpzTGliOiBQZGZKc01vZHVsZSB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBnZXRQZGZqc0xpYigpIHtcbiAgaWYgKCFjYWNoZWRQZGZqc0xpYikge1xuICAgIGNhY2hlZFBkZmpzTGliID0gYXdhaXQgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkUGRmanNMaWI7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeUxtU3R1ZGlvUGFyc2VyKGZpbGVQYXRoOiBzdHJpbmcsIGNsaWVudDogTE1TdHVkaW9DbGllbnQsIHRpbWVvdXRNczogbnVtYmVyID0gMTAwMDApOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IG1heFJldHJpZXMgPSAxO1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgLy8gVGltZW91dCB3cmFwcGVyIGZvciBMTSBTdHVkaW8gcGFyc2VyIChwcmV2ZW50cyBoYW5naW5nIG9uIHNsb3cgV2ViU29ja2V0KVxuICAgICAgY29uc3QgcGFyc2VQcm9taXNlID0gY2xpZW50LmZpbGVzLnByZXBhcmVGaWxlKGZpbGVQYXRoKS50aGVuKGZpbGVIYW5kbGUgPT4gXG4gICAgICAgIGNsaWVudC5maWxlcy5wYXJzZURvY3VtZW50KGZpbGVIYW5kbGUsIHtcbiAgICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMCB8fCBwcm9ncmVzcyA9PT0gMSkge1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFByb2Nlc3NpbmcgJHtmaWxlTmFtZX06ICR7KHByb2dyZXNzICogMTAwKS50b0ZpeGVkKDApfSVgLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICBwYXJzZVByb21pc2UsXG4gICAgICAgIG5ldyBQcm9taXNlPG5ldmVyPigoXywgcmVqZWN0KSA9PiBcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoXCJMTSBTdHVkaW8gcGFyc2VyIHRpbWVvdXRcIikpLCB0aW1lb3V0TXMpXG4gICAgICAgIClcbiAgICAgIF0pO1xuXG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgICAgc3RhZ2U6IFwibG1zdHVkaW9cIixcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUGFyc2VkIGJ1dCBnb3QgdmVyeSBsaXR0bGUgdGV4dCBmcm9tICR7ZmlsZU5hbWV9IChsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH0pLCB3aWxsIHRyeSBmYWxsYmFja3NgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCIsXG4gICAgICAgIGRldGFpbHM6IGBsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH1gLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgaXNUaW1lb3V0ID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwidGltZW91dFwiKTtcbiAgICAgIGNvbnN0IGlzV2ViU29ja2V0RXJyb3IgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmXG4gICAgICAgIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwiV2ViU29ja2V0XCIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJjb25uZWN0aW9uIGNsb3NlZFwiKSk7XG5cbiAgICAgIGlmIChpc1RpbWVvdXQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgVGltZW91dCBvbiAke2ZpbGVOYW1lfSwgZmFsbGluZyBiYWNrIHRvIHBkZi1wYXJzZWApO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBcIlRpbWVvdXQgLSBmYWxsaW5nIGJhY2sgdG8gcGRmLXBhcnNlXCIsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChpc1dlYlNvY2tldEVycm9yICYmIGF0dGVtcHQgPCBtYXhSZXRyaWVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFdlYlNvY2tldCBlcnJvciBvbiAke2ZpbGVOYW1lfSwgcmV0cnlpbmcgKCR7YXR0ZW1wdH0vJHttYXhSZXRyaWVzfSkuLi5gLFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwICogYXR0ZW1wdCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBmYWxsYmFjayAtIGRvbid0IGxvZyBlcnJvciwganVzdCBmYWxsIGJhY2tcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVycm9yXCIsXG4gICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVycm9yXCIsXG4gICAgZGV0YWlsczogXCJFeGNlZWRlZCByZXRyeSBhdHRlbXB0c1wiLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlQZGZQYXJzZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcbiAgdHJ5IHtcbiAgICBjb25zdCBidWZmZXIgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGRmUGFyc2UoYnVmZmVyKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHJlc3VsdC50ZXh0IHx8IFwiXCIpO1xuXG4gICAgaWYgKGNsZWFuZWQubGVuZ3RoID49IE1JTl9URVhUX0xFTkdUSCkge1xuICAgICAgY29uc29sZS5sb2coYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBTdWNjZXNzZnVsbHkgZXh0cmFjdGVkIHRleHQgZnJvbSAke2ZpbGVOYW1lfWApO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdGV4dDogY2xlYW5lZCxcbiAgICAgICAgc3RhZ2U6IFwicGRmLXBhcnNlXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBWZXJ5IGxpdHRsZSBvciBubyB0ZXh0IGV4dHJhY3RlZCBmcm9tICR7ZmlsZU5hbWV9IChsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH0pYCxcbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYucGRmcGFyc2UtZW1wdHlcIixcbiAgICAgIGRldGFpbHM6IGBsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH1gLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIEVycm9yIHBhcnNpbmcgUERGIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYucGRmcGFyc2UtZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeU9jcldpdGhQZGZKcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICBsZXQgd29ya2VyOiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVdvcmtlcj4+IHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgcGRmanNMaWIgPSBhd2FpdCBnZXRQZGZqc0xpYigpO1xuICAgIGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheShhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCkpO1xuICAgIGNvbnN0IHBkZkRvY3VtZW50ID0gYXdhaXQgcGRmanNMaWJcbiAgICAgIC5nZXREb2N1bWVudCh7IGRhdGEsIHZlcmJvc2l0eTogcGRmanNMaWIuVmVyYm9zaXR5TGV2ZWwuRVJST1JTIH0pXG4gICAgICAucHJvbWlzZTtcblxuICAgIGNvbnN0IG51bVBhZ2VzID0gcGRmRG9jdW1lbnQubnVtUGFnZXM7XG4gICAgY29uc3QgbWF4UGFnZXMgPSBNYXRoLm1pbihudW1QYWdlcywgT0NSX01BWF9QQUdFUyk7XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgU3RhcnRpbmcgT0NSIGZvciAke2ZpbGVOYW1lfSAtIHBhZ2VzIDEgdG8gJHttYXhQYWdlc30gKG9mICR7bnVtUGFnZXN9KWAsXG4gICAgKTtcblxuICAgIHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICBjb25zdCB0ZXh0UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHJlbmRlckVycm9ycyA9IDA7XG4gICAgbGV0IHByb2Nlc3NlZEltYWdlcyA9IDA7XG5cbiAgICBmb3IgKGxldCBwYWdlTnVtID0gMTsgcGFnZU51bSA8PSBtYXhQYWdlczsgcGFnZU51bSsrKSB7XG4gICAgICBsZXQgcGFnZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhZ2UgPSBhd2FpdCBwZGZEb2N1bWVudC5nZXRQYWdlKHBhZ2VOdW0pO1xuICAgICAgICBjb25zdCBpbWFnZXMgPSBhd2FpdCBleHRyYWN0SW1hZ2VzRm9yUGFnZShwZGZqc0xpYiwgcGFnZSk7XG4gICAgICAgIGlmIChpbWFnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpICR7ZmlsZU5hbWV9IC0gcGFnZSAke3BhZ2VOdW19IGNvbnRhaW5zIG5vIGV4dHJhY3RhYmxlIGltYWdlcywgc2tpcHBpbmdgLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RlZEltYWdlcyA9IGltYWdlcy5zbGljZSgwLCBPQ1JfTUFYX0lNQUdFU19QRVJfUEFHRSk7XG4gICAgICAgIGZvciAoY29uc3QgaW1hZ2Ugb2Ygc2VsZWN0ZWRJbWFnZXMpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgICBkYXRhOiB7IHRleHQgfSxcbiAgICAgICAgICAgIH0gPSBhd2FpdCB3b3JrZXIucmVjb2duaXplKGltYWdlLmJ1ZmZlcik7XG4gICAgICAgICAgICBwcm9jZXNzZWRJbWFnZXMrKztcbiAgICAgICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQodGV4dCB8fCBcIlwiKTtcbiAgICAgICAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goY2xlYW5lZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBjYXRjaCAocmVjb2duaXplRXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gcmVjb2duaXplIGltYWdlICgke2ltYWdlLndpZHRofXgke2ltYWdlLmhlaWdodH0pIG9uIHBhZ2UgJHtwYWdlTnVtfSBvZiAke2ZpbGVOYW1lfTpgLFxuICAgICAgICAgICAgICByZWNvZ25pemVFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gcmVjb2duaXplRXJyb3IubWVzc2FnZSA6IHJlY29nbml6ZUVycm9yLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vIFRoZSB3b3JrZXIgbWF5IGhhdmUgY3Jhc2hlZDsgdHJ5IHRvIHJlY3JlYXRlIGl0IGZvciByZW1haW5pbmcgaW1hZ2VzXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgLy8gd29ya2VyIGFscmVhZHkgZGVhZCwgaWdub3JlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgICAgICAgICB9IGNhdGNoIChyZWNyZWF0ZUVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gcmVjcmVhdGUgT0NSIHdvcmtlciwgYWJvcnRpbmcgT0NSIGZvciAke2ZpbGVOYW1lfWAsXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHdvcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgICAgICAgICAgICBkZXRhaWxzOiBgV29ya2VyIGNyYXNoZWQgYW5kIGNvdWxkIG5vdCBiZSByZWNyZWF0ZWQ6ICR7XG4gICAgICAgICAgICAgICAgICByZWNyZWF0ZUVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyByZWNyZWF0ZUVycm9yLm1lc3NhZ2UgOiBTdHJpbmcocmVjcmVhdGVFcnJvcilcbiAgICAgICAgICAgICAgICB9YCxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZU51bSA9PT0gMSB8fCBwYWdlTnVtICUgMTAgPT09IDAgfHwgcGFnZU51bSA9PT0gbWF4UGFnZXMpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgJHtmaWxlTmFtZX0gLSBwcm9jZXNzZWQgcGFnZSAke3BhZ2VOdW19LyR7bWF4UGFnZXN9IChpbWFnZXM9JHtwcm9jZXNzZWRJbWFnZXN9LCBjaGFycz0ke3RleHRQYXJ0cy5qb2luKFxuICAgICAgICAgICAgICBcIlxcblxcblwiLFxuICAgICAgICAgICAgKS5sZW5ndGh9KWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAocGFnZUVycm9yKSB7XG4gICAgICAgIGlmIChwYWdlRXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBBYm9ydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9OiAke3BhZ2VFcnJvci5tZXNzYWdlfWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgd29ya2VyID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgICAgICAgZGV0YWlsczogcGFnZUVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJFcnJvcnMrKztcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEVycm9yIHByb2Nlc3NpbmcgcGFnZSAke3BhZ2VOdW19IG9mICR7ZmlsZU5hbWV9OmAsXG4gICAgICAgICAgcGFnZUVycm9yLFxuICAgICAgICApO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgYXdhaXQgcGFnZT8uY2xlYW51cCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh3b3JrZXIpIHtcbiAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB9XG4gICAgd29ya2VyID0gbnVsbDtcblxuICAgIGNvbnN0IGZ1bGxUZXh0ID0gY2xlYW5UZXh0KHRleHRQYXJ0cy5qb2luKFwiXFxuXFxuXCIpKTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgQ29tcGxldGVkIE9DUiBmb3IgJHtmaWxlTmFtZX0sIGV4dHJhY3RlZCAke2Z1bGxUZXh0Lmxlbmd0aH0gY2hhcmFjdGVyc2AsXG4gICAgKTtcblxuICAgIGlmIChmdWxsVGV4dC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0ZXh0OiBmdWxsVGV4dCxcbiAgICAgICAgc3RhZ2U6IFwib2NyXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJFcnJvcnMgPiAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5vY3ItcmVuZGVyLWVycm9yXCIsXG4gICAgICAgIGRldGFpbHM6IGAke3JlbmRlckVycm9yc30gcGFnZSByZW5kZXIgZXJyb3JzYCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZW1wdHlcIixcbiAgICAgIGRldGFpbHM6IFwiT0NSIHByb2R1Y2VkIGluc3VmZmljaWVudCB0ZXh0XCIsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKE9DUikgRXJyb3IgZHVyaW5nIE9DUiBmb3IgJHtmaWxlTmFtZX06YCwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAod29ya2VyKSB7XG4gICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RJbWFnZXNGb3JQYWdlKHBkZmpzTGliOiBQZGZKc01vZHVsZSwgcGFnZTogYW55KTogUHJvbWlzZTxFeHRyYWN0ZWRPY3JJbWFnZVtdPiB7XG4gIGNvbnN0IG9wZXJhdG9yTGlzdCA9IGF3YWl0IHBhZ2UuZ2V0T3BlcmF0b3JMaXN0KCk7XG4gIGNvbnN0IGltYWdlczogRXh0cmFjdGVkT2NySW1hZ2VbXSA9IFtdO1xuICBjb25zdCBpbWFnZURhdGFDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPGFueSB8IG51bGw+PigpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3BlcmF0b3JMaXN0LmZuQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBmbiA9IG9wZXJhdG9yTGlzdC5mbkFycmF5W2ldO1xuICAgIGNvbnN0IGFyZ3MgPSBvcGVyYXRvckxpc3QuYXJnc0FycmF5W2ldO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0IHx8IGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbWFnZVhPYmplY3RSZXBlYXQpIHtcbiAgICAgICAgY29uc3Qgb2JqSWQgPSBhcmdzPy5bMF07XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqSWQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaW1nRGF0YTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpbWdEYXRhID0gYXdhaXQgcmVzb2x2ZUltYWdlRGF0YShwYWdlLCBvYmpJZCwgaW1hZ2VEYXRhQ2FjaGUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUud2FybihcIltQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gcmVzb2x2ZSBpbWFnZSBkYXRhOlwiLCBlcnJvcik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpbWdEYXRhKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEltYWdlRGF0YVRvUG5nKHBkZmpzTGliLCBpbWdEYXRhKTtcbiAgICAgICAgaWYgKGNvbnZlcnRlZCkge1xuICAgICAgICAgIGltYWdlcy5wdXNoKGNvbnZlcnRlZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZm4gPT09IHBkZmpzTGliLk9QUy5wYWludElubGluZUltYWdlWE9iamVjdCAmJiBhcmdzPy5bMF0pIHtcbiAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEltYWdlRGF0YVRvUG5nKHBkZmpzTGliLCBhcmdzWzBdKTtcbiAgICAgICAgaWYgKGNvbnZlcnRlZCkge1xuICAgICAgICAgIGltYWdlcy5wdXNoKGNvbnZlcnRlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgICAgY29uc29sZS53YXJuKFwiW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byBleHRyYWN0IGlubGluZSBpbWFnZTpcIiwgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbWFnZXNcbiAgICAuZmlsdGVyKChpbWFnZSkgPT4ge1xuICAgICAgaWYgKGltYWdlLmFyZWEgPCBPQ1JfTUlOX0lNQUdFX0FSRUEpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmIChpbWFnZS5hcmVhID4gT0NSX01BWF9JTUFHRV9QSVhFTFMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgU2tpcHBpbmcgb3ZlcnNpemVkIGltYWdlICgke2ltYWdlLndpZHRofXgke2ltYWdlLmhlaWdodH0gPSAke2ltYWdlLmFyZWEudG9Mb2NhbGVTdHJpbmcoKX0gcGl4ZWxzKSB0byBhdm9pZCBtZW1vcnkgYWxsb2NhdGlvbiBmYWlsdXJlYCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSlcbiAgICAuc29ydCgoYSwgYikgPT4gYi5hcmVhIC0gYS5hcmVhKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUltYWdlRGF0YShcbiAgcGFnZTogYW55LFxuICBvYmpJZDogc3RyaW5nLFxuICBjYWNoZTogTWFwPHN0cmluZywgUHJvbWlzZTxhbnkgfCBudWxsPj4sXG4pOiBQcm9taXNlPGFueSB8IG51bGw+IHtcbiAgaWYgKGNhY2hlLmhhcyhvYmpJZCkpIHtcbiAgICByZXR1cm4gY2FjaGUuZ2V0KG9iaklkKSE7XG4gIH1cblxuICBjb25zdCBwcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiBwYWdlLm9ianMuaGFzID09PSBcImZ1bmN0aW9uXCIgJiYgcGFnZS5vYmpzLmhhcyhvYmpJZCkpIHtcbiAgICAgICAgcmV0dXJuIHBhZ2Uub2Jqcy5nZXQob2JqSWQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gZmFsbCB0aHJvdWdoIHRvIGFzeW5jIHBhdGhcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICAgIGxldCB0aW1lb3V0SGFuZGxlOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuXG4gICAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgICBpZiAodGltZW91dEhhbmRsZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcbiAgICAgICAgICB0aW1lb3V0SGFuZGxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgaGFuZGxlRGF0YSA9IChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHBhZ2Uub2Jqcy5nZXQob2JqSWQsIGhhbmRsZURhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKE9DUl9JTUFHRV9USU1FT1VUX01TKSAmJiBPQ1JfSU1BR0VfVElNRU9VVF9NUyA+IDApIHtcbiAgICAgICAgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICghc2V0dGxlZCkge1xuICAgICAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgICAgICByZWplY3QobmV3IEltYWdlRGF0YVRpbWVvdXRFcnJvcihvYmpJZCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgT0NSX0lNQUdFX1RJTUVPVVRfTVMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KSgpO1xuXG4gIGNhY2hlLnNldChvYmpJZCwgcHJvbWlzZSk7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcoXG4gIHBkZmpzTGliOiBQZGZKc01vZHVsZSxcbiAgaW1nRGF0YTogYW55LFxuKTogRXh0cmFjdGVkT2NySW1hZ2UgfCBudWxsIHtcbiAgaWYgKCFpbWdEYXRhIHx8IHR5cGVvZiBpbWdEYXRhLndpZHRoICE9PSBcIm51bWJlclwiIHx8IHR5cGVvZiBpbWdEYXRhLmhlaWdodCAhPT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCBraW5kLCBkYXRhIH0gPSBpbWdEYXRhO1xuICBpZiAoIWRhdGEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHBuZyA9IG5ldyBQTkcoeyB3aWR0aCwgaGVpZ2h0IH0pO1xuICBjb25zdCBkZXN0ID0gcG5nLmRhdGE7XG5cbiAgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5SR0JBXzMyQlBQICYmIGRhdGEubGVuZ3RoID09PSB3aWR0aCAqIGhlaWdodCAqIDQpIHtcbiAgICBkZXN0LnNldChCdWZmZXIuZnJvbShkYXRhKSk7XG4gIH0gZWxzZSBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLlJHQl8yNEJQUCAmJiBkYXRhLmxlbmd0aCA9PT0gd2lkdGggKiBoZWlnaHQgKiAzKSB7XG4gICAgY29uc3Qgc3JjID0gZGF0YSBhcyBVaW50OEFycmF5O1xuICAgIGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IHNyYy5sZW5ndGg7IGkgKz0gMywgaiArPSA0KSB7XG4gICAgICBkZXN0W2pdID0gc3JjW2ldO1xuICAgICAgZGVzdFtqICsgMV0gPSBzcmNbaSArIDFdO1xuICAgICAgZGVzdFtqICsgMl0gPSBzcmNbaSArIDJdO1xuICAgICAgZGVzdFtqICsgM10gPSAyNTU7XG4gICAgfVxuICB9IGVsc2UgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5HUkFZU0NBTEVfMUJQUCkge1xuICAgIGxldCBwaXhlbEluZGV4ID0gMDtcbiAgICBjb25zdCB0b3RhbFBpeGVscyA9IHdpZHRoICogaGVpZ2h0O1xuICAgIGZvciAobGV0IGJ5dGVJbmRleCA9IDA7IGJ5dGVJbmRleCA8IGRhdGEubGVuZ3RoICYmIHBpeGVsSW5kZXggPCB0b3RhbFBpeGVsczsgYnl0ZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGJ5dGUgPSBkYXRhW2J5dGVJbmRleF07XG4gICAgICBmb3IgKGxldCBiaXQgPSA3OyBiaXQgPj0gMCAmJiBwaXhlbEluZGV4IDwgdG90YWxQaXhlbHM7IGJpdC0tKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gKGJ5dGUgPj4gYml0KSAmIDEgPyAyNTUgOiAwO1xuICAgICAgICBjb25zdCBkZXN0SW5kZXggPSBwaXhlbEluZGV4ICogNDtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXhdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAyXSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDNdID0gMjU1O1xuICAgICAgICBwaXhlbEluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBidWZmZXI6IFBORy5zeW5jLndyaXRlKHBuZyksXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGFyZWE6IHdpZHRoICogaGVpZ2h0LFxuICB9O1xufVxuXG4vKipcbiAqIFBhcnNlIFBERiBmaWxlcyB3aXRoIGEgbXVsdGktc3RhZ2Ugc3RyYXRlZ3k6XG4gKiAxLiBVc2UgTE0gU3R1ZGlvJ3MgYnVpbHQtaW4gZG9jdW1lbnQgcGFyc2VyIChmYXN0LCBzZXJ2ZXItc2lkZSwgbWF5IGluY2x1ZGUgT0NSKVxuICogMi4gRmFsbGJhY2sgdG8gbG9jYWwgcGRmLXBhcnNlIGZvciB0ZXh0LWJhc2VkIFBERnNcbiAqIDMuIElmIHN0aWxsIG5vIHRleHQgYW5kIE9DUiBpcyBlbmFibGVkLCBmYWxsYmFjayB0byBQREYuanMgKyBUZXNzZXJhY3QgT0NSXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZVBERihcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudCxcbiAgZW5hYmxlT0NSOiBib29sZWFuLFxuKTogUHJvbWlzZTxQZGZQYXJzZXJSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgLy8gMSkgRkFTVDogTG9jYWwgcGRmLXBhcnNlIGZpcnN0IChubyBXZWJTb2NrZXQgb3ZlcmhlYWQpXG4gIGNvbnN0IHBkZlBhcnNlUmVzdWx0ID0gYXdhaXQgdHJ5UGRmUGFyc2UoZmlsZVBhdGgpO1xuICBpZiAocGRmUGFyc2VSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBwZGZQYXJzZVJlc3VsdDtcbiAgfVxuICBsZXQgbGFzdEZhaWx1cmU6IFBkZlBhcnNlckZhaWx1cmUgPSBwZGZQYXJzZVJlc3VsdDtcblxuICAvLyAyKSBMTSBTdHVkaW8gcGFyc2VyIGFzIGZhbGxiYWNrIChzbG93ZXIsIFdlYlNvY2tldC1iYXNlZClcbiAgY29uc3QgbG1TdHVkaW9SZXN1bHQgPSBhd2FpdCB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aCwgY2xpZW50LCAxNTAwMCk7XG4gIGlmIChsbVN0dWRpb1Jlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIGxtU3R1ZGlvUmVzdWx0O1xuICB9XG4gIGxhc3RGYWlsdXJlID0gbG1TdHVkaW9SZXN1bHQ7XG5cbiAgLy8gMykgT0NSIGZhbGxiYWNrIChvbmx5IGlmIGVuYWJsZWQsIHNsb3dlc3QpXG4gIGlmICghZW5hYmxlT0NSKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEVuYWJsZSBPQ1IgaXMgb2ZmLCBza2lwcGluZyBPQ1IgZmFsbGJhY2sgZm9yICR7ZmlsZU5hbWV9IGFmdGVyIG90aGVyIG1ldGhvZHMgcmV0dXJuZWQgbm8gdGV4dGAsXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1kaXNhYmxlZFwiLFxuICAgICAgZGV0YWlsczogYFByZXZpb3VzIGZhaWx1cmUgcmVhc29uOiAke2xhc3RGYWlsdXJlLnJlYXNvbn1gLFxuICAgIH07XG4gIH1cblxuICBjb25zb2xlLmxvZyhcbiAgICBgW1BERiBQYXJzZXJdIChPQ1IpIE5vIHRleHQgZXh0cmFjdGVkIGZyb20gJHtmaWxlTmFtZX0gd2l0aCBwZGYtcGFyc2Ugb3IgTE0gU3R1ZGlvLCBhdHRlbXB0aW5nIE9DUi4uLmAsXG4gICk7XG5cbiAgY29uc3Qgb2NyUmVzdWx0ID0gYXdhaXQgdHJ5T2NyV2l0aFBkZkpzKGZpbGVQYXRoKTtcbiAgaWYgKG9jclJlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIG9jclJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBvY3JSZXN1bHQ7XG59XG5cbiIsICIvLyBAdHMtaWdub3JlIC0gZXB1YjIgZG9lc24ndCBoYXZlIGNvbXBsZXRlIHR5cGVzXG5pbXBvcnQgeyBFUHViIH0gZnJvbSBcImVwdWIyXCI7XG5cbi8qKlxuICogUGFyc2UgRVBVQiBmaWxlcyBhbmQgZXh0cmFjdCB0ZXh0IGNvbnRlbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlRVBVQihmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZXB1YiA9IG5ldyBFUHViKGZpbGVQYXRoKTtcbiAgICAgIFxuICAgICAgZXB1Yi5vbihcImVycm9yXCIsIChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBFUFVCIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXNvbHZlKFwiXCIpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0cmlwSHRtbCA9IChpbnB1dDogc3RyaW5nKSA9PlxuICAgICAgICBpbnB1dC5yZXBsYWNlKC88W14+XSo+L2csIFwiIFwiKTtcblxuICAgICAgY29uc3QgZ2V0TWFuaWZlc3RFbnRyeSA9IChjaGFwdGVySWQ6IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gKGVwdWIgYXMgdW5rbm93biBhcyB7IG1hbmlmZXN0PzogUmVjb3JkPHN0cmluZywgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4gfSkubWFuaWZlc3Q/LltjaGFwdGVySWRdO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgZGVjb2RlTWVkaWFUeXBlID0gKGVudHJ5PzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSkgPT5cbiAgICAgICAgZW50cnk/LltcIm1lZGlhLXR5cGVcIl0gfHwgZW50cnk/Lm1lZGlhVHlwZSB8fCBcIlwiO1xuXG4gICAgICBjb25zdCBzaG91bGRSZWFkUmF3ID0gKG1lZGlhVHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBtZWRpYVR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZCA9PT0gXCJhcHBsaWNhdGlvbi94aHRtbCt4bWxcIiB8fCBub3JtYWxpemVkID09PSBcImltYWdlL3N2Zyt4bWxcIikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoXCJ0ZXh0L1wiKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJodG1sXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlYWRDaGFwdGVyID0gYXN5bmMgKGNoYXB0ZXJJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IGdldE1hbmlmZXN0RW50cnkoY2hhcHRlcklkKTtcbiAgICAgICAgaWYgKCFtYW5pZmVzdEVudHJ5KSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBFUFVCIGNoYXB0ZXIgJHtjaGFwdGVySWR9IG1pc3NpbmcgbWFuaWZlc3QgZW50cnkgaW4gJHtmaWxlUGF0aH0sIHNraXBwaW5nYCk7XG4gICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZWRpYVR5cGUgPSBkZWNvZGVNZWRpYVR5cGUobWFuaWZlc3RFbnRyeSk7XG4gICAgICAgIGlmIChzaG91bGRSZWFkUmF3KG1lZGlhVHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgICBlcHViLmdldEZpbGUoXG4gICAgICAgICAgICAgIGNoYXB0ZXJJZCxcbiAgICAgICAgICAgICAgKGVycm9yOiBFcnJvciB8IG51bGwsIGRhdGE/OiBCdWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHJlaihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgICAgcmVzKFwiXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXMoc3RyaXBIdG1sKGRhdGEudG9TdHJpbmcoXCJ1dGYtOFwiKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICBlcHViLmdldENoYXB0ZXIoXG4gICAgICAgICAgICBjaGFwdGVySWQsXG4gICAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCwgdGV4dD86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWooZXJyb3IpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXh0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmVzKHN0cmlwSHRtbCh0ZXh0KSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzKFwiXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBlcHViLm9uKFwiZW5kXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBjaGFwdGVycyA9IGVwdWIuZmxvdztcbiAgICAgICAgICBjb25zdCB0ZXh0UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgXG4gICAgICAgICAgZm9yIChjb25zdCBjaGFwdGVyIG9mIGNoYXB0ZXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBjaGFwdGVySWQgPSBjaGFwdGVyLmlkO1xuICAgICAgICAgICAgICBpZiAoIWNoYXB0ZXJJZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRVBVQiBjaGFwdGVyIG1pc3NpbmcgaWQgaW4gJHtmaWxlUGF0aH0sIHNraXBwaW5nYCk7XG4gICAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVhZENoYXB0ZXIoY2hhcHRlcklkKTtcbiAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChjaGFwdGVyRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVhZGluZyBjaGFwdGVyICR7Y2hhcHRlci5pZH06YCwgY2hhcHRlckVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgZnVsbFRleHQgPSB0ZXh0UGFydHMuam9pbihcIlxcblxcblwiKTtcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgZnVsbFRleHRcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgRVBVQiBjaGFwdGVyczpgLCBlcnJvcik7XG4gICAgICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGVwdWIucGFyc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5pdGlhbGl6aW5nIEVQVUIgcGFyc2VyIGZvciAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICByZXNvbHZlKFwiXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbiIsICJpbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5cbi8qKlxuICogUGFyc2UgaW1hZ2UgZmlsZXMgdXNpbmcgT0NSIChUZXNzZXJhY3QpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUltYWdlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICBcbiAgICBjb25zdCB7IGRhdGE6IHsgdGV4dCB9IH0gPSBhd2FpdCB3b3JrZXIucmVjb2duaXplKGZpbGVQYXRoKTtcbiAgICBcbiAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgXG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAgIC50cmltKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VUZXh0T3B0aW9ucyB7XG4gIHN0cmlwTWFya2Rvd24/OiBib29sZWFuO1xuICBwcmVzZXJ2ZUxpbmVCcmVha3M/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFBhcnNlIHBsYWluIHRleHQgZmlsZXMgKHR4dCwgbWQgYW5kIHJlbGF0ZWQgZm9ybWF0cylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlVGV4dChcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogUGFyc2VUZXh0T3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBzdHJpcE1hcmtkb3duID0gZmFsc2UsIHByZXNlcnZlTGluZUJyZWFrcyA9IGZhbHNlIH0gPSBvcHRpb25zO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVMaW5lRW5kaW5ncyhjb250ZW50KTtcblxuICAgIGNvbnN0IHN0cmlwcGVkID0gc3RyaXBNYXJrZG93biA/IHN0cmlwTWFya2Rvd25TeW50YXgobm9ybWFsaXplZCkgOiBub3JtYWxpemVkO1xuXG4gICAgcmV0dXJuIChwcmVzZXJ2ZUxpbmVCcmVha3MgPyBjb2xsYXBzZVdoaXRlc3BhY2VCdXRLZWVwTGluZXMoc3RyaXBwZWQpIDogY29sbGFwc2VXaGl0ZXNwYWNlKHN0cmlwcGVkKSkudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgdGV4dCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMaW5lRW5kaW5ncyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcclxcbj8vZywgXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2VCdXRLZWVwTGluZXMoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgaW5wdXRcbiAgICAgIC8vIFRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZSBwZXIgbGluZVxuICAgICAgLnJlcGxhY2UoL1sgXFx0XStcXG4vZywgXCJcXG5cIilcbiAgICAgIC8vIENvbGxhcHNlIG11bHRpcGxlIGJsYW5rIGxpbmVzIGJ1dCBrZWVwIHBhcmFncmFwaCBzZXBhcmF0aW9uXG4gICAgICAucmVwbGFjZSgvXFxuezMsfS9nLCBcIlxcblxcblwiKVxuICAgICAgLy8gQ29sbGFwc2UgaW50ZXJuYWwgc3BhY2VzL3RhYnNcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF17Mix9L2csIFwiIFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBzdHJpcE1hcmtkb3duU3ludGF4KGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgb3V0cHV0ID0gaW5wdXQ7XG5cbiAgLy8gUmVtb3ZlIGZlbmNlZCBjb2RlIGJsb2Nrc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvYGBgW1xcc1xcU10qP2BgYC9nLCBcIiBcIik7XG4gIC8vIFJlbW92ZSBpbmxpbmUgY29kZVxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvYChbXmBdKylgL2csIFwiJDFcIik7XG4gIC8vIFJlcGxhY2UgaW1hZ2VzIHdpdGggYWx0IHRleHRcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyFcXFsoW15cXF1dKilcXF1cXChbXildKlxcKS9nLCBcIiQxIFwiKTtcbiAgLy8gUmVwbGFjZSBsaW5rcyB3aXRoIGxpbmsgdGV4dFxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXFxbKFteXFxdXSspXFxdXFwoW14pXSpcXCkvZywgXCIkMVwiKTtcbiAgLy8gUmVtb3ZlIGVtcGhhc2lzIG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyhcXCpcXCp8X18pKC4qPylcXDEvZywgXCIkMlwiKTtcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyhcXCp8XykoLio/KVxcMS9nLCBcIiQyXCIpO1xuICAvLyBSZW1vdmUgaGVhZGluZ3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfSN7MSw2fVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgYmxvY2sgcXVvdGVzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30+XFxzPy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSB1bm9yZGVyZWQgbGlzdCBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM31bLSorXVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgb3JkZXJlZCBsaXN0IG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfVxcZCtbXFwuXFwpXVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgaG9yaXpvbnRhbCBydWxlc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9KFstKl9dXFxzPyl7Myx9JC9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSByZXNpZHVhbCBIVE1MIHRhZ3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLzxbXj5dKz4vZywgXCIgXCIpO1xuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwYXJzZUhUTUwgfSBmcm9tIFwiLi9odG1sUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZVBERiwgdHlwZSBQZGZGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4vcGRmUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZUVQVUIgfSBmcm9tIFwiLi9lcHViUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZUltYWdlIH0gZnJvbSBcIi4vaW1hZ2VQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlVGV4dCB9IGZyb20gXCIuL3RleHRQYXJzZXJcIjtcbmltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHtcbiAgSU1BR0VfRVhURU5TSU9OX1NFVCxcbiAgaXNIdG1sRXh0ZW5zaW9uLFxuICBpc01hcmtkb3duRXh0ZW5zaW9uLFxuICBpc1BsYWluVGV4dEV4dGVuc2lvbixcbiAgaXNUZXh0dWFsRXh0ZW5zaW9uLFxufSBmcm9tIFwiLi4vdXRpbHMvc3VwcG9ydGVkRXh0ZW5zaW9uc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlZERvY3VtZW50IHtcbiAgdGV4dDogc3RyaW5nO1xuICBtZXRhZGF0YToge1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgZmlsZU5hbWU6IHN0cmluZztcbiAgICBleHRlbnNpb246IHN0cmluZztcbiAgICBwYXJzZWRBdDogRGF0ZTtcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uID1cbiAgfCBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiXG4gIHwgXCJwZGYubWlzc2luZy1jbGllbnRcIlxuICB8IFBkZkZhaWx1cmVSZWFzb25cbiAgfCBcImVwdWIuZW1wdHlcIlxuICB8IFwiaHRtbC5lbXB0eVwiXG4gIHwgXCJodG1sLmVycm9yXCJcbiAgfCBcInRleHQuZW1wdHlcIlxuICB8IFwidGV4dC5lcnJvclwiXG4gIHwgXCJpbWFnZS5vY3ItZGlzYWJsZWRcIlxuICB8IFwiaW1hZ2UuZW1wdHlcIlxuICB8IFwiaW1hZ2UuZXJyb3JcIlxuICB8IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIjtcblxuZXhwb3J0IHR5cGUgRG9jdW1lbnRQYXJzZVJlc3VsdCA9XG4gIHwgeyBzdWNjZXNzOiB0cnVlOyBkb2N1bWVudDogUGFyc2VkRG9jdW1lbnQgfVxuICB8IHsgc3VjY2VzczogZmFsc2U7IHJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uOyBkZXRhaWxzPzogc3RyaW5nIH07XG5cbi8qKlxuICogUGFyc2UgYSBkb2N1bWVudCBmaWxlIGJhc2VkIG9uIGl0cyBleHRlbnNpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlRG9jdW1lbnQoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGVuYWJsZU9DUjogYm9vbGVhbiA9IGZhbHNlLFxuICBjbGllbnQ/OiBMTVN0dWRpb0NsaWVudCxcbik6IFByb21pc2U8RG9jdW1lbnRQYXJzZVJlc3VsdD4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCk7XG5cbiAgY29uc3QgYnVpbGRTdWNjZXNzID0gKHRleHQ6IHN0cmluZyk6IERvY3VtZW50UGFyc2VSZXN1bHQgPT4gKHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGRvY3VtZW50OiB7XG4gICAgICB0ZXh0LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIGZpbGVOYW1lLFxuICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgcGFyc2VkQXQ6IG5ldyBEYXRlKCksXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgaWYgKGlzSHRtbEV4dGVuc2lvbihleHQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gY2xlYW5BbmRWYWxpZGF0ZShcbiAgICAgICAgICBhd2FpdCBwYXJzZUhUTUwoZmlsZVBhdGgpLFxuICAgICAgICAgIFwiaHRtbC5lbXB0eVwiLFxuICAgICAgICAgIGAke2ZpbGVOYW1lfSBodG1sYCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRleHQuc3VjY2VzcyA/IGJ1aWxkU3VjY2Vzcyh0ZXh0LnZhbHVlKSA6IHRleHQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtIVE1MXSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwiaHRtbC5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5wZGZcIikge1xuICAgICAgaWYgKCFjbGllbnQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbUGFyc2VyXSBObyBMTSBTdHVkaW8gY2xpZW50IGF2YWlsYWJsZSBmb3IgUERGIHBhcnNpbmc6ICR7ZmlsZU5hbWV9YCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwicGRmLm1pc3NpbmctY2xpZW50XCIgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBkZlJlc3VsdCA9IGF3YWl0IHBhcnNlUERGKGZpbGVQYXRoLCBjbGllbnQsIGVuYWJsZU9DUik7XG4gICAgICBpZiAocGRmUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkU3VjY2VzcyhwZGZSZXN1bHQudGV4dCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGRmUmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLmVwdWJcIikge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlRVBVQihmaWxlUGF0aCk7XG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcImVwdWIuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgfVxuXG4gICAgaWYgKGlzVGV4dHVhbEV4dGVuc2lvbihleHQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VUZXh0KGZpbGVQYXRoLCB7XG4gICAgICAgICAgc3RyaXBNYXJrZG93bjogaXNNYXJrZG93bkV4dGVuc2lvbihleHQpLFxuICAgICAgICAgIHByZXNlcnZlTGluZUJyZWFrczogaXNQbGFpblRleHRFeHRlbnNpb24oZXh0KSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwidGV4dC5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bVGV4dF0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcInRleHQuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKElNQUdFX0VYVEVOU0lPTl9TRVQuaGFzKGV4dCkpIHtcbiAgICAgIGlmICghZW5hYmxlT0NSKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBTa2lwcGluZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9IChPQ1IgZGlzYWJsZWQpYCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwiaW1hZ2Uub2NyLWRpc2FibGVkXCIgfTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZUltYWdlKGZpbGVQYXRoKTtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJpbWFnZS5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bSW1hZ2VdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJpbWFnZS5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5yYXJcIikge1xuICAgICAgY29uc29sZS5sb2coYFJBUiBmaWxlcyBub3QgeWV0IHN1cHBvcnRlZDogJHtmaWxlUGF0aH1gKTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCIsIGRldGFpbHM6IFwiLnJhclwiIH07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFVuc3VwcG9ydGVkIGZpbGUgdHlwZTogJHtmaWxlUGF0aH1gKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiLCBkZXRhaWxzOiBleHQgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIGRvY3VtZW50ICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9XG59XG5cbnR5cGUgQ2xlYW5SZXN1bHQgPVxuICB8IHsgc3VjY2VzczogdHJ1ZTsgdmFsdWU6IHN0cmluZyB9XG4gIHwgeyBzdWNjZXNzOiBmYWxzZTsgcmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb247IGRldGFpbHM/OiBzdHJpbmcgfTtcblxuZnVuY3Rpb24gY2xlYW5BbmRWYWxpZGF0ZShcbiAgdGV4dDogc3RyaW5nLFxuICBlbXB0eVJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uLFxuICBkZXRhaWxzQ29udGV4dD86IHN0cmluZyxcbik6IENsZWFuUmVzdWx0IHtcbiAgY29uc3QgY2xlYW5lZCA9IHRleHQ/LnRyaW0oKSA/PyBcIlwiO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IGVtcHR5UmVhc29uLFxuICAgICAgZGV0YWlsczogZGV0YWlsc0NvbnRleHQgPyBgJHtkZXRhaWxzQ29udGV4dH0gdHJpbW1lZCB0byB6ZXJvIGxlbmd0aGAgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB2YWx1ZTogY2xlYW5lZCB9O1xufVxuXG4iLCAiaW1wb3J0IHtcbiAgY2h1bmtUZXh0IGFzIG5hdGl2ZUNodW5rVGV4dCxcbiAgY2h1bmtUZXh0RmFzdCBhcyBuYXRpdmVDaHVua1RleHRGYXN0LFxuICBjaHVua1RleHRzUGFyYWxsZWwgYXMgbmF0aXZlQ2h1bmtUZXh0c1BhcmFsbGVsLFxuICBjaHVua1RleHRzQmF0Y2ggYXMgbmF0aXZlQ2h1bmtUZXh0c0JhdGNoLFxuICBpc05hdGl2ZUF2YWlsYWJsZSxcbiAgVGV4dENodW5rLFxuICBCYXRjaENodW5rUmVzdWx0XG59IGZyb20gXCIuLi9uYXRpdmVcIjtcblxuLyoqXG4gKiBDaHVuayByZXN1bHQgd2l0aCBtZXRhZGF0YVxuICovXG5leHBvcnQgaW50ZXJmYWNlIENodW5rUmVzdWx0IHtcbiAgdGV4dDogc3RyaW5nO1xuICBzdGFydEluZGV4OiBudW1iZXI7XG4gIGVuZEluZGV4OiBudW1iZXI7XG4gIHRva2VuRXN0aW1hdGU6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBPcHRpbWl6ZWQgdGV4dCBjaHVua2VyIHRoYXQgc3BsaXRzIHRleHQgaW50byBvdmVybGFwcGluZyBjaHVua3NcbiAqIFVzZXMgbmF0aXZlIFJ1c3QgaW1wbGVtZW50YXRpb24gd2hlbiBhdmFpbGFibGUgZm9yIG1heGltdW0gcGVyZm9ybWFuY2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNodW5rVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjaHVua1NpemU6IG51bWJlcixcbiAgb3ZlcmxhcDogbnVtYmVyLFxuKTogQ2h1bmtSZXN1bHRbXSB7XG4gIGlmIChpc05hdGl2ZUF2YWlsYWJsZSgpKSB7XG4gICAgLy8gVXNlIG5hdGl2ZSBSdXN0IGltcGxlbWVudGF0aW9uIC0gb3B0aW1pemVkIHdpdGggc2luZ2xlLXBhc3Mgd29yZCBib3VuZGFyeSBkZXRlY3Rpb25cbiAgICBjb25zdCBuYXRpdmVDaHVua3MgPSBuYXRpdmVDaHVua1RleHQodGV4dCwgY2h1bmtTaXplLCBvdmVybGFwKSBhcyBUZXh0Q2h1bmtbXTtcbiAgICByZXR1cm4gbmF0aXZlQ2h1bmtzLm1hcCgoY2h1bmspID0+ICh7XG4gICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgc3RhcnRJbmRleDogY2h1bmsuc3RhcnRJbmRleCxcbiAgICAgIGVuZEluZGV4OiBjaHVuay5lbmRJbmRleCxcbiAgICAgIHRva2VuRXN0aW1hdGU6IGNodW5rLnRva2VuRXN0aW1hdGUsXG4gICAgfSkpO1xuICB9XG5cbiAgLy8gRmFsbGJhY2sgdG8gVHlwZVNjcmlwdCBpbXBsZW1lbnRhdGlvblxuICBjb25zdCBjaHVua3M6IENodW5rUmVzdWx0W10gPSBbXTtcblxuICAvLyBTaW1wbGUgd29yZC1iYXNlZCBjaHVua2luZ1xuICBjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoL1xccysvKTtcblxuICBpZiAod29yZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGNodW5rcztcbiAgfVxuXG4gIGxldCBzdGFydElkeCA9IDA7XG5cbiAgd2hpbGUgKHN0YXJ0SWR4IDwgd29yZHMubGVuZ3RoKSB7XG4gICAgY29uc3QgZW5kSWR4ID0gTWF0aC5taW4oc3RhcnRJZHggKyBjaHVua1NpemUsIHdvcmRzLmxlbmd0aCk7XG4gICAgY29uc3QgY2h1bmtXb3JkcyA9IHdvcmRzLnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xuICAgIGNvbnN0IGNodW5rVGV4dCA9IGNodW5rV29yZHMuam9pbihcIiBcIik7XG5cbiAgICBjaHVua3MucHVzaCh7XG4gICAgICB0ZXh0OiBjaHVua1RleHQsXG4gICAgICBzdGFydEluZGV4OiBzdGFydElkeCxcbiAgICAgIGVuZEluZGV4OiBlbmRJZHgsXG4gICAgICB0b2tlbkVzdGltYXRlOiBNYXRoLmNlaWwoY2h1bmtUZXh0Lmxlbmd0aCAvIDQpLFxuICAgIH0pO1xuXG4gICAgLy8gTW92ZSBmb3J3YXJkIGJ5IChjaHVua1NpemUgLSBvdmVybGFwKSB0byBjcmVhdGUgb3ZlcmxhcHBpbmcgY2h1bmtzXG4gICAgc3RhcnRJZHggKz0gTWF0aC5tYXgoMSwgY2h1bmtTaXplIC0gb3ZlcmxhcCk7XG5cbiAgICAvLyBCcmVhayBpZiB3ZSd2ZSByZWFjaGVkIHRoZSBlbmRcbiAgICBpZiAoZW5kSWR4ID49IHdvcmRzLmxlbmd0aCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNodW5rcztcbn1cblxuLyoqXG4gKiBGYXN0IHRleHQgY2h1bmtlciAtIHJldHVybnMgb25seSB0ZXh0IHdpdGhvdXQgbWV0YWRhdGFcbiAqIFVzZXMgbmF0aXZlIFJ1c3QgaW1wbGVtZW50YXRpb24gZm9yIG1heGltdW0gcGVyZm9ybWFuY2UgKDEuMzB4IHNwZWVkdXApXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaHVua1RleHRGYXN0KFxuICB0ZXh0OiBzdHJpbmcsXG4gIGNodW5rU2l6ZTogbnVtYmVyLFxuICBvdmVybGFwOiBudW1iZXIsXG4pOiBzdHJpbmdbXSB7XG4gIGlmIChpc05hdGl2ZUF2YWlsYWJsZSgpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZUNodW5rVGV4dEZhc3QodGV4dCwgY2h1bmtTaXplLCBvdmVybGFwKTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIFR5cGVTY3JpcHQgaW1wbGVtZW50YXRpb25cbiAgY29uc3QgY2h1bmtzID0gY2h1bmtUZXh0KHRleHQsIGNodW5rU2l6ZSwgb3ZlcmxhcCk7XG4gIHJldHVybiBjaHVua3MubWFwKGMgPT4gYy50ZXh0KTtcbn1cblxuLyoqXG4gKiBCYXRjaCBjaHVuayBtdWx0aXBsZSB0ZXh0cyBpbiBwYXJhbGxlbCB1c2luZyBSdXN0XG4gKiBQcm92aWRlcyAxLjQ1eCBzcGVlZHVwIG92ZXIgc2VxdWVudGlhbCBUeXBlU2NyaXB0IGltcGxlbWVudGF0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjaHVua1RleHRzUGFyYWxsZWwoXG4gIHRleHRzOiBzdHJpbmdbXSxcbiAgY2h1bmtTaXplOiBudW1iZXIsXG4gIG92ZXJsYXA6IG51bWJlcixcbik6IFByb21pc2U8Q2h1bmtSZXN1bHRbXVtdPiB7XG4gIGlmIChpc05hdGl2ZUF2YWlsYWJsZSgpKSB7XG4gICAgY29uc3QgbmF0aXZlQ2h1bmtzID0gYXdhaXQgbmF0aXZlQ2h1bmtUZXh0c1BhcmFsbGVsKHRleHRzLCBjaHVua1NpemUsIG92ZXJsYXApIGFzIFRleHRDaHVua1tdW107XG4gICAgcmV0dXJuIG5hdGl2ZUNodW5rcy5tYXAoKGZpbGVDaHVua3MpID0+XG4gICAgICBmaWxlQ2h1bmtzLm1hcCgoY2h1bmspID0+ICh7XG4gICAgICAgIHRleHQ6IGNodW5rLnRleHQsXG4gICAgICAgIHN0YXJ0SW5kZXg6IGNodW5rLnN0YXJ0SW5kZXgsXG4gICAgICAgIGVuZEluZGV4OiBjaHVuay5lbmRJbmRleCxcbiAgICAgICAgdG9rZW5Fc3RpbWF0ZTogY2h1bmsudG9rZW5Fc3RpbWF0ZSxcbiAgICAgIH0pKVxuICAgICk7XG4gIH1cblxuICAvLyBGYWxsYmFjayB0byBzZXF1ZW50aWFsIFR5cGVTY3JpcHQgaW1wbGVtZW50YXRpb25cbiAgcmV0dXJuIHRleHRzLm1hcCgodGV4dCkgPT4gY2h1bmtUZXh0KHRleHQsIGNodW5rU2l6ZSwgb3ZlcmxhcCkpO1xufVxuXG4vKipcbiAqIFVsdHJhLWJhdGNoIGNodW5raW5nIC0gY2h1bmtzIEFMTCBkb2N1bWVudHMgaW4gYSBzaW5nbGUgbmF0aXZlIGNhbGxcbiAqIFJldHVybnMgY2h1bmtzIGdyb3VwZWQgYnkgZmlsZSBpbmRleCBmb3IgbWF4aW11bSBwZXJmb3JtYW5jZSAoYXZvaWRzIEZGSSBvdmVyaGVhZClcbiAqIFRoaXMgaXMgdGhlIGZhc3Rlc3QgY2h1bmtpbmcgbWV0aG9kIC0gMjB4KyBzcGVlZHVwIG92ZXIgc2VxdWVudGlhbCBjYWxsc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2h1bmtUZXh0c0JhdGNoKFxuICB0ZXh0czogc3RyaW5nW10sXG4gIGNodW5rU2l6ZTogbnVtYmVyLFxuICBvdmVybGFwOiBudW1iZXIsXG4pOiBQcm9taXNlPE1hcDxudW1iZXIsIENodW5rUmVzdWx0W10+PiB7XG4gIGlmIChpc05hdGl2ZUF2YWlsYWJsZSgpICYmIG5hdGl2ZUNodW5rVGV4dHNCYXRjaCkge1xuICAgIGNvbnN0IG5hdGl2ZVJlc3VsdHMgPSBhd2FpdCBuYXRpdmVDaHVua1RleHRzQmF0Y2godGV4dHMsIGNodW5rU2l6ZSwgb3ZlcmxhcCkgYXMgQmF0Y2hDaHVua1Jlc3VsdFtdO1xuICAgIFxuICAgIC8vIEdyb3VwIGJ5IGZpbGUgaW5kZXhcbiAgICBjb25zdCBncm91cGVkID0gbmV3IE1hcDxudW1iZXIsIENodW5rUmVzdWx0W10+KCk7XG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgbmF0aXZlUmVzdWx0cykge1xuICAgICAgbGV0IGZpbGVDaHVua3MgPSBncm91cGVkLmdldChyZXN1bHQuZmlsZUluZGV4KTtcbiAgICAgIGlmICghZmlsZUNodW5rcykge1xuICAgICAgICBmaWxlQ2h1bmtzID0gW107XG4gICAgICAgIGdyb3VwZWQuc2V0KHJlc3VsdC5maWxlSW5kZXgsIGZpbGVDaHVua3MpO1xuICAgICAgfVxuICAgICAgZmlsZUNodW5rcy5wdXNoKHtcbiAgICAgICAgdGV4dDogcmVzdWx0LnRleHQsXG4gICAgICAgIHN0YXJ0SW5kZXg6IHJlc3VsdC5zdGFydEluZGV4LFxuICAgICAgICBlbmRJbmRleDogcmVzdWx0LmVuZEluZGV4LFxuICAgICAgICB0b2tlbkVzdGltYXRlOiByZXN1bHQudG9rZW5Fc3RpbWF0ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZ3JvdXBlZDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrOiB1c2UgcGFyYWxsZWwgaW1wbGVtZW50YXRpb25cbiAgY29uc3QgcGFyYWxsZWxSZXN1bHRzID0gYXdhaXQgY2h1bmtUZXh0c1BhcmFsbGVsKHRleHRzLCBjaHVua1NpemUsIG92ZXJsYXApO1xuICByZXR1cm4gbmV3IE1hcChwYXJhbGxlbFJlc3VsdHMubWFwKChjaHVua3MsIGlkeCkgPT4gW2lkeCwgY2h1bmtzXSkpO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIHRva2VuIGNvdW50IChyb3VnaCBhcHByb3hpbWF0aW9uOiAxIHRva2VuIFx1MjI0OCA0IGNoYXJhY3RlcnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc3RpbWF0ZVRva2VuQ291bnQodGV4dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDQpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIG5hdGl2ZSBjaHVua2luZyBpcyBhdmFpbGFibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzTmF0aXZlQ2h1bmtpbmdBdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc05hdGl2ZUF2YWlsYWJsZSgpO1xufVxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcblxuLyoqXG4gKiBDYWxjdWxhdGUgU0hBLTI1NiBoYXNoIG9mIGEgZmlsZSBmb3IgY2hhbmdlIGRldGVjdGlvblxuICogVXNlcyBOb2RlLmpzIGNyeXB0byBtb2R1bGUgKE9wZW5TU0wtYmFja2VkLCBoaWdobHkgb3B0aW1pemVkIEMgY29kZSlcbiAqIE5vdGU6IFJ1c3QgbmF0aXZlIGhhc2hpbmcgd2FzIGJlbmNobWFya2VkIGF0IDAuOTN4IHNwZWVkIChzbG93ZXIgZHVlIHRvIEZGSSBvdmVyaGVhZClcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICBjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcblxuICAgIHN0cmVhbS5vbihcImRhdGFcIiwgKGRhdGEpID0+IGhhc2gudXBkYXRlKGRhdGEpKTtcbiAgICBzdHJlYW0ub24oXCJlbmRcIiwgKCkgPT4gcmVzb2x2ZShoYXNoLmRpZ2VzdChcImhleFwiKSkpO1xuICAgIHN0cmVhbS5vbihcImVycm9yXCIsIHJlamVjdCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIENhbGN1bGF0ZSBTSEEtMjU2IGhhc2ggb2YgbXVsdGlwbGUgZmlsZXMgaW4gcGFyYWxsZWxcbiAqIFVzZXMgTm9kZS5qcyBjcnlwdG8gd2l0aCBQcm9taXNlLmFsbCBmb3IgcGFyYWxsZWwgZXhlY3V0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxjdWxhdGVGaWxlSGFzaGVzUGFyYWxsZWwoZmlsZVBhdGhzOiBzdHJpbmdbXSk6IFByb21pc2U8TWFwPHN0cmluZywgc3RyaW5nPj4ge1xuICBjb25zdCBoYXNoUHJvbWlzZXMgPSBmaWxlUGF0aHMubWFwKGFzeW5jIChmaWxlUGF0aCkgPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aCk7XG4gICAgcmV0dXJuIFtmaWxlUGF0aCwgaGFzaF0gYXMgW3N0cmluZywgc3RyaW5nXTtcbiAgfSk7XG5cbiAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsKGhhc2hQcm9taXNlcyk7XG4gIHJldHVybiBuZXcgTWFwKHJlc3VsdHMpO1xufVxuXG4vKipcbiAqIEdldCBmaWxlIG1ldGFkYXRhIGluY2x1ZGluZyBzaXplIGFuZCBtb2RpZmljYXRpb24gdGltZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RmlsZU1ldGFkYXRhKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgc2l6ZTogbnVtYmVyO1xuICBtdGltZTogRGF0ZTtcbiAgaGFzaDogc3RyaW5nO1xufT4ge1xuICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZmlsZVBhdGgpO1xuICBjb25zdCBoYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGgpO1xuXG4gIHJldHVybiB7XG4gICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICBtdGltZTogc3RhdHMubXRpbWUsXG4gICAgaGFzaCxcbiAgfTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmcy9wcm9taXNlc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbnRlcmZhY2UgRmFpbGVkRmlsZUVudHJ5IHtcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgcmVhc29uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRyYWNrcyBmaWxlcyB0aGF0IGZhaWxlZCBpbmRleGluZyBmb3IgYSBnaXZlbiBoYXNoIHNvIHdlIGNhbiBza2lwIHRoZW1cbiAqIHdoZW4gYXV0by1yZWluZGV4aW5nIHVuY2hhbmdlZCBkYXRhLlxuICovXG5leHBvcnQgY2xhc3MgRmFpbGVkRmlsZVJlZ2lzdHJ5IHtcbiAgcHJpdmF0ZSBsb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBlbnRyaWVzOiBSZWNvcmQ8c3RyaW5nLCBGYWlsZWRGaWxlRW50cnk+ID0ge307XG4gIHByaXZhdGUgcXVldWU6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHJlZ2lzdHJ5UGF0aDogc3RyaW5nKSB7fVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5sb2FkZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZSh0aGlzLnJlZ2lzdHJ5UGF0aCwgXCJ1dGYtOFwiKTtcbiAgICAgIHRoaXMuZW50cmllcyA9IEpTT04ucGFyc2UoZGF0YSkgPz8ge307XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLmVudHJpZXMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwZXJzaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLm1rZGlyKHBhdGguZGlybmFtZSh0aGlzLnJlZ2lzdHJ5UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0aGlzLnJlZ2lzdHJ5UGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5lbnRyaWVzLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcnVuRXhjbHVzaXZlPFQ+KG9wZXJhdGlvbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucXVldWUudGhlbihvcGVyYXRpb24pO1xuICAgIHRoaXMucXVldWUgPSByZXN1bHQudGhlbihcbiAgICAgICgpID0+IHt9LFxuICAgICAgKCkgPT4ge30sXG4gICAgKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgcmVjb3JkRmFpbHVyZShmaWxlUGF0aDogc3RyaW5nLCBmaWxlSGFzaDogc3RyaW5nLCByZWFzb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLnJ1bkV4Y2x1c2l2ZShhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgIHRoaXMuZW50cmllc1tmaWxlUGF0aF0gPSB7XG4gICAgICAgIGZpbGVIYXNoLFxuICAgICAgICByZWFzb24sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgfTtcbiAgICAgIGF3YWl0IHRoaXMucGVyc2lzdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2xlYXJGYWlsdXJlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICBpZiAodGhpcy5lbnRyaWVzW2ZpbGVQYXRoXSkge1xuICAgICAgICBkZWxldGUgdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXTtcbiAgICAgICAgYXdhaXQgdGhpcy5wZXJzaXN0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRGYWlsdXJlUmVhc29uKGZpbGVQYXRoOiBzdHJpbmcsIGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnkuZmlsZUhhc2ggPT09IGZpbGVIYXNoID8gZW50cnkucmVhc29uIDogdW5kZWZpbmVkO1xuICB9XG59XG5cbiIsICJpbXBvcnQgUFF1ZXVlIGZyb20gXCJwLXF1ZXVlXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHNjYW5EaXJlY3RvcnksIHR5cGUgU2Nhbm5lZEZpbGUgfSBmcm9tIFwiLi9maWxlU2Nhbm5lclwiO1xuaW1wb3J0IHsgcGFyc2VEb2N1bWVudCwgdHlwZSBQYXJzZUZhaWx1cmVSZWFzb24gfSBmcm9tIFwiLi4vcGFyc2Vycy9kb2N1bWVudFBhcnNlclwiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUsIHR5cGUgRG9jdW1lbnRDaHVuayB9IGZyb20gXCIuLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuaW1wb3J0IHsgY2h1bmtUZXh0c0JhdGNoLCB0eXBlIENodW5rUmVzdWx0IH0gZnJvbSBcIi4uL3V0aWxzL3RleHRDaHVua2VyXCI7XG5pbXBvcnQgeyBjYWxjdWxhdGVGaWxlSGFzaCB9IGZyb20gXCIuLi91dGlscy9maWxlSGFzaFwiO1xuaW1wb3J0IHsgdHlwZSBFbWJlZGRpbmdEeW5hbWljSGFuZGxlLCB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IEZhaWxlZEZpbGVSZWdpc3RyeSB9IGZyb20gXCIuLi91dGlscy9mYWlsZWRGaWxlUmVnaXN0cnlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ1Byb2dyZXNzIHtcbiAgdG90YWxGaWxlczogbnVtYmVyO1xuICBwcm9jZXNzZWRGaWxlczogbnVtYmVyO1xuICBjdXJyZW50RmlsZTogc3RyaW5nO1xuICBzdGF0dXM6IFwic2Nhbm5pbmdcIiB8IFwiaW5kZXhpbmdcIiB8IFwiY29tcGxldGVcIiB8IFwiZXJyb3JcIjtcbiAgc3VjY2Vzc2Z1bEZpbGVzPzogbnVtYmVyO1xuICBmYWlsZWRGaWxlcz86IG51bWJlcjtcbiAgc2tpcHBlZEZpbGVzPzogbnVtYmVyO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ1Jlc3VsdCB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgc3VjY2Vzc2Z1bEZpbGVzOiBudW1iZXI7XG4gIGZhaWxlZEZpbGVzOiBudW1iZXI7XG4gIHNraXBwZWRGaWxlczogbnVtYmVyO1xuICB1cGRhdGVkRmlsZXM6IG51bWJlcjtcbiAgbmV3RmlsZXM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ09wdGlvbnMge1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmU6IFZlY3RvclN0b3JlO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBlbWJlZGRpbmdNb2RlbDogRW1iZWRkaW5nRHluYW1pY0hhbmRsZTtcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudDtcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgYXV0b1JlaW5kZXg6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICBmYWlsdXJlUmVwb3J0UGF0aD86IHN0cmluZztcbiAgYWJvcnRTaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgb25Qcm9ncmVzcz86IChwcm9ncmVzczogSW5kZXhpbmdQcm9ncmVzcykgPT4gdm9pZDtcbn1cblxudHlwZSBGYWlsdXJlUmVhc29uID0gUGFyc2VGYWlsdXJlUmVhc29uIHwgXCJpbmRleC5jaHVuay1lbXB0eVwiIHwgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCIgfCBcImluZGV4LmVtYmVkZGluZy1lcnJvclwiO1xuXG5mdW5jdGlvbiBjb2VyY2VFbWJlZGRpbmdWZWN0b3IocmF3OiB1bmtub3duKTogbnVtYmVyW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XG4gICAgcmV0dXJuIHJhdy5tYXAoYXNzZXJ0RmluaXRlTnVtYmVyKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgcmF3ID09PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIFthc3NlcnRGaW5pdGVOdW1iZXIocmF3KV07XG4gIH1cblxuICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09IFwib2JqZWN0XCIpIHtcbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHJhdykpIHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHJhdyBhcyB1bmtub3duIGFzIEFycmF5TGlrZTxudW1iZXI+KS5tYXAoYXNzZXJ0RmluaXRlTnVtYmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPVxuICAgICAgKHJhdyBhcyBhbnkpLmVtYmVkZGluZyA/P1xuICAgICAgKHJhdyBhcyBhbnkpLnZlY3RvciA/P1xuICAgICAgKHJhdyBhcyBhbnkpLmRhdGEgPz9cbiAgICAgICh0eXBlb2YgKHJhdyBhcyBhbnkpLnRvQXJyYXkgPT09IFwiZnVuY3Rpb25cIiA/IChyYXcgYXMgYW55KS50b0FycmF5KCkgOiB1bmRlZmluZWQpID8/XG4gICAgICAodHlwZW9mIChyYXcgYXMgYW55KS50b0pTT04gPT09IFwiZnVuY3Rpb25cIiA/IChyYXcgYXMgYW55KS50b0pTT04oKSA6IHVuZGVmaW5lZCk7XG5cbiAgICBpZiAoY2FuZGlkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBjb2VyY2VFbWJlZGRpbmdWZWN0b3IoY2FuZGlkYXRlKTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJFbWJlZGRpbmcgcHJvdmlkZXIgcmV0dXJuZWQgYSBub24tbnVtZXJpYyB2ZWN0b3JcIik7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEZpbml0ZU51bWJlcih2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gIGNvbnN0IG51bSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IHZhbHVlIDogTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVtYmVkZGluZyB2ZWN0b3IgY29udGFpbnMgYSBub24tZmluaXRlIHZhbHVlXCIpO1xuICB9XG4gIHJldHVybiBudW07XG59XG5cbmV4cG9ydCBjbGFzcyBJbmRleE1hbmFnZXIge1xuICBwcml2YXRlIG9wdGlvbnM6IEluZGV4aW5nT3B0aW9ucztcbiAgcHJpdmF0ZSBmYWlsdXJlUmVhc29uQ291bnRzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gIHByaXZhdGUgZmFpbGVkRmlsZVJlZ2lzdHJ5OiBGYWlsZWRGaWxlUmVnaXN0cnk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogSW5kZXhpbmdPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeSA9IG5ldyBGYWlsZWRGaWxlUmVnaXN0cnkoXG4gICAgICBwYXRoLmpvaW4ob3B0aW9ucy52ZWN0b3JTdG9yZURpciwgXCIuYmlnLXJhZy1mYWlsdXJlcy5qc29uXCIpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgdGhlIGluZGV4aW5nIHByb2Nlc3NcbiAgICogVXNlcyB0d28tcGhhc2UgcHJvY2Vzc2luZyBmb3IgbWF4aW11bSBwZXJmb3JtYW5jZTpcbiAgICogUGhhc2UgMTogUGFyc2UgYWxsIGRvY3VtZW50cyBhbmQgY29sbGVjdCB0ZXh0c1xuICAgKiBQaGFzZSAyOiBCYXRjaCBjaHVuayBhbGwgdGV4dHMgaW4gc2luZ2xlIG5hdGl2ZSBjYWxsIChhdm9pZHMgRkZJIG92ZXJoZWFkKVxuICAgKiBQaGFzZSAzOiBCYXRjaCBlbWJlZCBhbmQgaW5kZXggYWxsIGNodW5rc1xuICAgKi9cbiAgYXN5bmMgaW5kZXgoKTogUHJvbWlzZTxJbmRleGluZ1Jlc3VsdD4ge1xuICAgIGNvbnN0IHsgZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZSwgY2h1bmtTaXplLCBjaHVua092ZXJsYXAsIG9uUHJvZ3Jlc3MgfSA9IHRoaXMub3B0aW9ucztcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlSW52ZW50b3J5ID0gYXdhaXQgdmVjdG9yU3RvcmUuZ2V0RmlsZUhhc2hJbnZlbnRvcnkoKTtcblxuICAgICAgLy8gU3RlcCAxOiBTY2FuIGRpcmVjdG9yeVxuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogMCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwic2Nhbm5pbmdcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgc2NhbkRpcmVjdG9yeShkb2N1bWVudHNEaXIsIChzY2FubmVkLCBmb3VuZCkgPT4ge1xuICAgICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgICAgdG90YWxGaWxlczogZm91bmQsXG4gICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBgU2Nhbm5lZCAke3NjYW5uZWR9IGZpbGVzLi4uYCxcbiAgICAgICAgICAgIHN0YXR1czogXCJzY2FubmluZ1wiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5vcHRpb25zLmFib3J0U2lnbmFsPy50aHJvd0lmQWJvcnRlZCgpO1xuICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7ZmlsZXMubGVuZ3RofSBmaWxlcyB0byBwcm9jZXNzYCk7XG5cbiAgICAgIC8vIFN0ZXAgMjogUGFyc2UgYWxsIGRvY3VtZW50cyBhbmQgY29sbGVjdCB0ZXh0cyAoUGhhc2UgMSlcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJQYXJzaW5nIGRvY3VtZW50cy4uLlwiLFxuICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaW50ZXJmYWNlIFBhcnNlZERvY3VtZW50IHtcbiAgICAgICAgZmlsZTogU2Nhbm5lZEZpbGU7XG4gICAgICAgIGZpbGVIYXNoOiBzdHJpbmc7XG4gICAgICAgIHRleHQ6IHN0cmluZztcbiAgICAgICAgb3V0Y29tZTogXCJuZXdcIiB8IFwidXBkYXRlZFwiIHwgXCJza2lwcGVkXCIgfCBcImZhaWxlZFwiO1xuICAgICAgICBmYWlsdXJlUmVhc29uPzogRmFpbHVyZVJlYXNvbjtcbiAgICAgICAgZmFpbHVyZURldGFpbHM/OiBzdHJpbmc7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBhcnNlZERvY3M6IFBhcnNlZERvY3VtZW50W10gPSBbXTtcbiAgICAgIGxldCBwYXJzZUNvdW50ID0gMDtcblxuICAgICAgLy8gUGFyc2UgZG9jdW1lbnRzIHdpdGggY29uY3VycmVuY3kgY29udHJvbFxuICAgICAgY29uc3QgcGFyc2VRdWV1ZSA9IG5ldyBQUXVldWUoeyBjb25jdXJyZW5jeTogdGhpcy5vcHRpb25zLm1heENvbmN1cnJlbnQgfSk7XG4gICAgICBjb25zdCBwYXJzZVRhc2tzID0gZmlsZXMubWFwKChmaWxlKSA9PlxuICAgICAgICBwYXJzZVF1ZXVlLmFkZChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5vcHRpb25zLmFib3J0U2lnbmFsPy50aHJvd0lmQWJvcnRlZCgpO1xuXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbGVIYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZS5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nSGFzaGVzID0gZmlsZUludmVudG9yeS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGhhc1NhbWVIYXNoID0gZXhpc3RpbmdIYXNoZXM/LmhhcyhmaWxlSGFzaCkgPz8gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIENoZWNrIGlmIGFscmVhZHkgaW5kZXhlZFxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdXRvUmVpbmRleCAmJiBoYXNTYW1lSGFzaCkge1xuICAgICAgICAgICAgICBwYXJzZWREb2NzLnB1c2goeyBmaWxlLCBmaWxlSGFzaCwgdGV4dDogXCJcIiwgb3V0Y29tZTogXCJza2lwcGVkXCIgfSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHByZXZpb3VzIGZhaWx1cmVcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXV0b1JlaW5kZXgpIHtcbiAgICAgICAgICAgICAgY29uc3QgcHJldmlvdXNGYWlsdXJlID0gYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkuZ2V0RmFpbHVyZVJlYXNvbihmaWxlLnBhdGgsIGZpbGVIYXNoKTtcbiAgICAgICAgICAgICAgaWYgKHByZXZpb3VzRmFpbHVyZSkge1xuICAgICAgICAgICAgICAgIHBhcnNlZERvY3MucHVzaCh7IGZpbGUsIGZpbGVIYXNoLCB0ZXh0OiBcIlwiLCBvdXRjb21lOiBcInNraXBwZWRcIiB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGFyc2UgZG9jdW1lbnRcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFJlc3VsdCA9IGF3YWl0IHBhcnNlRG9jdW1lbnQoZmlsZS5wYXRoLCB0aGlzLm9wdGlvbnMuZW5hYmxlT0NSLCB0aGlzLm9wdGlvbnMuY2xpZW50KTtcbiAgICAgICAgICAgIGlmICghcGFyc2VkUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgcGFyc2VkRG9jcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICAgIGZpbGVIYXNoLFxuICAgICAgICAgICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgb3V0Y29tZTogXCJmYWlsZWRcIixcbiAgICAgICAgICAgICAgICBmYWlsdXJlUmVhc29uOiBwYXJzZWRSZXN1bHQucmVhc29uLFxuICAgICAgICAgICAgICAgIGZhaWx1cmVEZXRhaWxzOiBwYXJzZWRSZXN1bHQuZGV0YWlscyxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcGFyc2VkRG9jcy5wdXNoKHtcbiAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICAgZmlsZUhhc2gsXG4gICAgICAgICAgICAgIHRleHQ6IHBhcnNlZFJlc3VsdC5kb2N1bWVudC50ZXh0LFxuICAgICAgICAgICAgICBvdXRjb21lOiBoYXNTYW1lSGFzaCA/IFwidXBkYXRlZFwiIDogXCJuZXdcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBwYXJzZWREb2NzLnB1c2goe1xuICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgICBmaWxlSGFzaDogXCJcIixcbiAgICAgICAgICAgICAgdGV4dDogXCJcIixcbiAgICAgICAgICAgICAgb3V0Y29tZTogXCJmYWlsZWRcIixcbiAgICAgICAgICAgICAgZmFpbHVyZVJlYXNvbjogXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiLFxuICAgICAgICAgICAgICBmYWlsdXJlRGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGFyc2VDb3VudCsrO1xuICAgICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcGFyc2VDb3VudCxcbiAgICAgICAgICAgICAgY3VycmVudEZpbGU6IGBQYXJzZWQgJHtwYXJzZUNvdW50fS8ke2ZpbGVzLmxlbmd0aH0uLi5gLFxuICAgICAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHBhcnNlVGFza3MpO1xuXG4gICAgICAvLyBSZWNvcmQgcGFyc2UgZmFpbHVyZXNcbiAgICAgIGZvciAoY29uc3QgZG9jIG9mIHBhcnNlZERvY3MpIHtcbiAgICAgICAgaWYgKGRvYy5vdXRjb21lID09PSBcImZhaWxlZFwiICYmIGRvYy5mYWlsdXJlUmVhc29uKSB7XG4gICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKGRvYy5mYWlsdXJlUmVhc29uLCBkb2MuZmFpbHVyZURldGFpbHMsIGRvYy5maWxlKTtcbiAgICAgICAgICBpZiAoZG9jLmZpbGVIYXNoKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGRvYy5maWxlLnBhdGgsIGRvYy5maWxlSGFzaCwgZG9jLmZhaWx1cmVSZWFzb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTdGVwIDM6IEJhdGNoIGNodW5rIGFsbCB0ZXh0cyAoUGhhc2UgMikgLSBTSU5HTEUgTkFUSVZFIENBTExcbiAgICAgIGNvbnN0IHRleHRzVG9DaHVuayA9IHBhcnNlZERvY3MuZmlsdGVyKGQgPT4gZC5vdXRjb21lICE9PSBcInNraXBwZWRcIiAmJiBkLm91dGNvbWUgIT09IFwiZmFpbGVkXCIpLm1hcChkID0+IGQudGV4dCk7XG4gICAgICBjb25zdCB2YWxpZERvY3MgPSBwYXJzZWREb2NzLmZpbHRlcihkID0+IGQub3V0Y29tZSAhPT0gXCJza2lwcGVkXCIgJiYgZC5vdXRjb21lICE9PSBcImZhaWxlZFwiKTtcblxuICAgICAgbGV0IGNodW5rZWRUZXh0czogTWFwPG51bWJlciwgQ2h1bmtSZXN1bHRbXT4gPSBuZXcgTWFwKCk7XG5cbiAgICAgIGlmICh0ZXh0c1RvQ2h1bmsubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgQmF0Y2ggY2h1bmtpbmcgJHt0ZXh0c1RvQ2h1bmsubGVuZ3RofSBkb2N1bWVudHMuLi5gKTtcbiAgICAgICAgY2h1bmtlZFRleHRzID0gYXdhaXQgY2h1bmtUZXh0c0JhdGNoKHRleHRzVG9DaHVuaywgY2h1bmtTaXplLCBjaHVua092ZXJsYXApO1xuICAgICAgfVxuXG4gICAgICAvLyBTdGVwIDQ6IEVtYmVkIGFuZCBpbmRleCBBTEwgY2h1bmtzIGluIGEgc2luZ2xlIGJhdGNoIChQaGFzZSAzKVxuICAgICAgLy8gVGhpcyBpcyB0aGUgS0VZIG9wdGltaXphdGlvbiAtIG9uZSBlbWJlZGRpbmcgQVBJIGNhbGwgZm9yIEFMTCBjaHVua3NcbiAgICAgIGxldCBzdWNjZXNzQ291bnQgPSAwO1xuICAgICAgbGV0IGZhaWxDb3VudCA9IDA7XG4gICAgICBsZXQgc2tpcHBlZENvdW50ID0gcGFyc2VkRG9jcy5maWx0ZXIoZCA9PiBkLm91dGNvbWUgPT09IFwic2tpcHBlZFwiKS5sZW5ndGg7XG4gICAgICBsZXQgdXBkYXRlZENvdW50ID0gMDtcbiAgICAgIGxldCBuZXdDb3VudCA9IDA7XG5cbiAgICAgIC8vIENvbGxlY3QgQUxMIGNodW5rcyBmcm9tIEFMTCBmaWxlcyB3aXRoIHRoZWlyIG1ldGFkYXRhXG4gICAgICBpbnRlcmZhY2UgQ2h1bmtXaXRoTWV0YWRhdGEge1xuICAgICAgICBkb2NJbmRleDogbnVtYmVyO1xuICAgICAgICBjaHVua0luZGV4OiBudW1iZXI7XG4gICAgICAgIHRleHQ6IHN0cmluZztcbiAgICAgICAgZG9jOiB0eXBlb2YgdmFsaWREb2NzWzBdO1xuICAgICAgICBjaHVuazogQ2h1bmtSZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGFsbENodW5rczogQ2h1bmtXaXRoTWV0YWRhdGFbXSA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWxpZERvY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZG9jID0gdmFsaWREb2NzW2ldO1xuICAgICAgICBjb25zdCBjaHVua3MgPSBjaHVua2VkVGV4dHMuZ2V0KGkpIHx8IFtdO1xuXG4gICAgICAgIGlmIChjaHVua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYE5vIGNodW5rcyBjcmVhdGVkIGZyb20gJHtkb2MuZmlsZS5uYW1lfWApO1xuICAgICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcImluZGV4LmNodW5rLWVtcHR5XCIsIFwiY2h1bmtUZXh0c0JhdGNoIHByb2R1Y2VkIDAgY2h1bmtzXCIsIGRvYy5maWxlKTtcbiAgICAgICAgICBpZiAoZG9jLmZpbGVIYXNoKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGRvYy5maWxlLnBhdGgsIGRvYy5maWxlSGFzaCwgXCJpbmRleC5jaHVuay1lbXB0eVwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmFpbENvdW50Kys7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNodW5rcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGFsbENodW5rcy5wdXNoKHtcbiAgICAgICAgICAgIGRvY0luZGV4OiBpLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogaixcbiAgICAgICAgICAgIHRleHQ6IGNodW5rc1tqXS50ZXh0LFxuICAgICAgICAgICAgZG9jLFxuICAgICAgICAgICAgY2h1bms6IGNodW5rc1tqXSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhgRW1iZWRkaW5nICR7YWxsQ2h1bmtzLmxlbmd0aH0gY2h1bmtzIGZyb20gJHt2YWxpZERvY3MubGVuZ3RofSBmaWxlcy4uLmApO1xuXG4gICAgICAvLyBFbWJlZCBpbiBiYXRjaGVzIG9mIDUwIGZvciBuZXR3b3JrIHN0YWJpbGl0eSAocHJldmVudHMgV2ViU29ja2V0IHRpbWVvdXRzKVxuICAgICAgLy8gUmVkdWNlZCBmcm9tIDIwMCBmb3IgYmV0dGVyIHJlbGlhYmlsaXR5IG92ZXIgTE0gTGlua1xuICAgICAgLy8gU2VlIEZJTkFMX1BFUkZPUk1BTkNFX1JFUE9SVC5tZCBmb3IgYmVuY2htYXJrIGRldGFpbHNcbiAgICAgIGNvbnN0IEVNQkVERElOR19CQVRDSF9TSVpFID0gNTA7XG4gICAgICBjb25zdCBNQVhfUkVUUklFUyA9IDM7XG4gICAgICBcbiAgICAgIGlmIChhbGxDaHVua3MubGVuZ3RoID4gMCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGFsbFRleHRzID0gYWxsQ2h1bmtzLm1hcChjID0+IGMudGV4dCk7XG4gICAgICAgICAgY29uc3QgYWxsRW1iZWRkaW5nczogYW55W10gPSBbXTtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBFbWJlZCBpbiBiYXRjaGVzIHRvIGF2b2lkIHRpbWVvdXQgYW5kIGltcHJvdmUgcmVsaWFiaWxpdHlcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFsbFRleHRzLmxlbmd0aDsgaSArPSBFTUJFRERJTkdfQkFUQ0hfU0laRSkge1xuICAgICAgICAgICAgY29uc3QgYmF0Y2ggPSBhbGxUZXh0cy5zbGljZShpLCBpICsgRU1CRURESU5HX0JBVENIX1NJWkUpO1xuICAgICAgICAgICAgbGV0IGxhc3RFcnJvcjogRXJyb3IgfCBudWxsID0gbnVsbDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gUmV0cnkgbG9naWMgZm9yIG5ldHdvcmsgc3RhYmlsaXR5XG4gICAgICAgICAgICBmb3IgKGxldCByZXRyeSA9IDA7IHJldHJ5IDwgTUFYX1JFVFJJRVM7IHJldHJ5KyspIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLm9wdGlvbnMuZW1iZWRkaW5nTW9kZWwuZW1iZWQoYmF0Y2gpO1xuICAgICAgICAgICAgICAgIGFsbEVtYmVkZGluZ3MucHVzaCguLi5yZXN1bHQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGxhc3RFcnJvciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKTtcbiAgICAgICAgICAgICAgICBpZiAocmV0cnkgPCBNQVhfUkVUUklFUyAtIDEpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGAgIEVtYmVkZGluZyBiYXRjaCAke01hdGguZmxvb3IoaSAvIEVNQkVERElOR19CQVRDSF9TSVpFKSArIDF9LyR7TWF0aC5jZWlsKGFsbFRleHRzLmxlbmd0aCAvIEVNQkVERElOR19CQVRDSF9TSVpFKX0gZmFpbGVkLCByZXRyeSAke3JldHJ5ICsgMX0vJHtNQVhfUkVUUklFU30uLi5gKTtcbiAgICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHIgPT4gc2V0VGltZW91dChyLCAxMDAwICogKHJldHJ5ICsgMSkpKTsgLy8gRXhwb25lbnRpYWwgYmFja29mZlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAobGFzdEVycm9yICYmIGFsbEVtYmVkZGluZ3MubGVuZ3RoIC0gaSA8IEVNQkVERElOR19CQVRDSF9TSVpFKSB7XG4gICAgICAgICAgICAgIHRocm93IGxhc3RFcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBHcm91cCByZXN1bHRzIGJ5IGZpbGUgZm9yIHZlY3RvciBzdG9yZSBpbnNlcnRpb25cbiAgICAgICAgICBjb25zdCBjaHVua3NCeUZpbGUgPSBuZXcgTWFwPG51bWJlciwgRG9jdW1lbnRDaHVua1tdPigpO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYWxsRW1iZWRkaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgY2h1bmtJbmZvID0gYWxsQ2h1bmtzW2ldO1xuICAgICAgICAgICAgY29uc3QgZW1iZWRkaW5nID0gY29lcmNlRW1iZWRkaW5nVmVjdG9yKGFsbEVtYmVkZGluZ3NbaV0uZW1iZWRkaW5nKTtcblxuICAgICAgICAgICAgbGV0IGZpbGVDaHVua3MgPSBjaHVua3NCeUZpbGUuZ2V0KGNodW5rSW5mby5kb2NJbmRleCk7XG4gICAgICAgICAgICBpZiAoIWZpbGVDaHVua3MpIHtcbiAgICAgICAgICAgICAgZmlsZUNodW5rcyA9IFtdO1xuICAgICAgICAgICAgICBjaHVua3NCeUZpbGUuc2V0KGNodW5rSW5mby5kb2NJbmRleCwgZmlsZUNodW5rcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbGVDaHVua3MucHVzaCh7XG4gICAgICAgICAgICAgIGlkOiBgJHtjaHVua0luZm8uZG9jLmZpbGVIYXNofS0ke2NodW5rSW5mby5jaHVua0luZGV4fWAsXG4gICAgICAgICAgICAgIHRleHQ6IGNodW5rSW5mby50ZXh0LFxuICAgICAgICAgICAgICB2ZWN0b3I6IGVtYmVkZGluZyxcbiAgICAgICAgICAgICAgZmlsZVBhdGg6IGNodW5rSW5mby5kb2MuZmlsZS5wYXRoLFxuICAgICAgICAgICAgICBmaWxlTmFtZTogY2h1bmtJbmZvLmRvYy5maWxlLm5hbWUsXG4gICAgICAgICAgICAgIGZpbGVIYXNoOiBjaHVua0luZm8uZG9jLmZpbGVIYXNoLFxuICAgICAgICAgICAgICBjaHVua0luZGV4OiBjaHVua0luZm8uY2h1bmtJbmRleCxcbiAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgICBleHRlbnNpb246IGNodW5rSW5mby5kb2MuZmlsZS5leHRlbnNpb24sXG4gICAgICAgICAgICAgICAgc2l6ZTogY2h1bmtJbmZvLmRvYy5maWxlLnNpemUsXG4gICAgICAgICAgICAgICAgbXRpbWU6IGNodW5rSW5mby5kb2MuZmlsZS5tdGltZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIHN0YXJ0SW5kZXg6IGNodW5rSW5mby5jaHVuay5zdGFydEluZGV4LFxuICAgICAgICAgICAgICAgIGVuZEluZGV4OiBjaHVua0luZm8uY2h1bmsuZW5kSW5kZXgsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgYWxsIGNodW5rcyB0byB2ZWN0b3Igc3RvcmVcbiAgICAgICAgICBmb3IgKGNvbnN0IFtkb2NJbmRleCwgZG9jdW1lbnRDaHVua3NdIG9mIGNodW5rc0J5RmlsZS5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRvYyA9IHZhbGlkRG9jc1tkb2NJbmRleF07XG4gICAgICAgICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5hZGRDaHVua3MoZG9jdW1lbnRDaHVua3MpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYEluZGV4ZWQgJHtkb2N1bWVudENodW5rcy5sZW5ndGh9IGNodW5rcyBmcm9tICR7ZG9jLmZpbGUubmFtZX1gKTtcblxuICAgICAgICAgICAgLy8gVXBkYXRlIGludmVudG9yeVxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdIYXNoZXMgPSBmaWxlSW52ZW50b3J5LmdldChkb2MuZmlsZS5wYXRoKTtcbiAgICAgICAgICAgIGlmICghZXhpc3RpbmdIYXNoZXMpIHtcbiAgICAgICAgICAgICAgZmlsZUludmVudG9yeS5zZXQoZG9jLmZpbGUucGF0aCwgbmV3IFNldChbZG9jLmZpbGVIYXNoXSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZXhpc3RpbmdIYXNoZXMuYWRkKGRvYy5maWxlSGFzaCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5jbGVhckZhaWx1cmUoZG9jLmZpbGUucGF0aCk7XG5cbiAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgaWYgKGRvYy5vdXRjb21lID09PSBcIm5ld1wiKSBuZXdDb3VudCsrO1xuICAgICAgICAgICAgZWxzZSB1cGRhdGVkQ291bnQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZW1iZWRkaW5nIGFsbCBjaHVua3M6YCwgZXJyb3IpO1xuICAgICAgICAgIC8vIE1hcmsgYWxsIGFzIGZhaWxlZFxuICAgICAgICAgIGZhaWxDb3VudCA9IHZhbGlkRG9jcy5sZW5ndGg7XG4gICAgICAgICAgZm9yIChjb25zdCBkb2Mgb2YgdmFsaWREb2NzKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgICAgIFwiaW5kZXguZW1iZWRkaW5nLWVycm9yXCIsXG4gICAgICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgZG9jLmZpbGUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGRvYy5maWxlSGFzaCkge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGRvYy5maWxlLnBhdGgsIGRvYy5maWxlSGFzaCwgXCJpbmRleC5lbWJlZGRpbmctZXJyb3JcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJjb21wbGV0ZVwiLFxuICAgICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxvZ0ZhaWx1cmVTdW1tYXJ5KCk7XG4gICAgICBhd2FpdCB0aGlzLndyaXRlRmFpbHVyZVJlcG9ydCh7XG4gICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB1cGRhdGVkRmlsZXM6IHVwZGF0ZWRDb3VudCxcbiAgICAgICAgbmV3RmlsZXM6IG5ld0NvdW50LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgSW5kZXhpbmcgY29tcGxldGU6ICR7c3VjY2Vzc0NvdW50fS8ke2ZpbGVzLmxlbmd0aH0gZmlsZXMgc3VjY2Vzc2Z1bGx5IGluZGV4ZWQgKCR7ZmFpbENvdW50fSBmYWlsZWQsIHNraXBwZWQ9JHtza2lwcGVkQ291bnR9LCB1cGRhdGVkPSR7dXBkYXRlZENvdW50fSwgbmV3PSR7bmV3Q291bnR9KWAsXG4gICAgICApO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgdXBkYXRlZEZpbGVzOiB1cGRhdGVkQ291bnQsXG4gICAgICAgIG5ld0ZpbGVzOiBuZXdDb3VudCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBkdXJpbmcgaW5kZXhpbmc6XCIsIGVycm9yKTtcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IDAsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29yZEZhaWx1cmUocmVhc29uOiBGYWlsdXJlUmVhc29uLCBkZXRhaWxzOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZpbGU6IFNjYW5uZWRGaWxlKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dID8/IDA7XG4gICAgdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl0gPSBjdXJyZW50ICsgMTtcbiAgICBjb25zdCBkZXRhaWxTdWZmaXggPSBkZXRhaWxzID8gYCBkZXRhaWxzPSR7ZGV0YWlsc31gIDogXCJcIjtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgW0JpZ1JBR10gRmFpbGVkIHRvIHBhcnNlICR7ZmlsZS5uYW1lfSAocmVhc29uPSR7cmVhc29ufSwgY291bnQ9JHt0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXX0pJHtkZXRhaWxTdWZmaXh9YCxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2dGYWlsdXJlU3VtbWFyeSgpIHtcbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXModGhpcy5mYWlsdXJlUmVhc29uQ291bnRzKTtcbiAgICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gTm8gcGFyc2luZyBmYWlsdXJlcyByZWNvcmRlZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gRmFpbHVyZSByZWFzb24gc3VtbWFyeTpcIik7XG4gICAgZm9yIChjb25zdCBbcmVhc29uLCBjb3VudF0gb2YgZW50cmllcykge1xuICAgICAgY29uc29sZS5sb2coYCAgLSAke3JlYXNvbn06ICR7Y291bnR9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB3cml0ZUZhaWx1cmVSZXBvcnQoc3VtbWFyeTogSW5kZXhpbmdSZXN1bHQpIHtcbiAgICBjb25zdCByZXBvcnRQYXRoID0gdGhpcy5vcHRpb25zLmZhaWx1cmVSZXBvcnRQYXRoO1xuICAgIGlmICghcmVwb3J0UGF0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAuLi5zdW1tYXJ5LFxuICAgICAgZG9jdW1lbnRzRGlyOiB0aGlzLm9wdGlvbnMuZG9jdW1lbnRzRGlyLFxuICAgICAgZmFpbHVyZVJlYXNvbnM6IHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50cyxcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2RpcihwYXRoLmRpcm5hbWUocmVwb3J0UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHJlcG9ydFBhdGgsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xuICAgICAgY29uc29sZS5sb2coYFtCaWdSQUddIFdyb3RlIGZhaWx1cmUgcmVwb3J0IHRvICR7cmVwb3J0UGF0aH1gKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgW0JpZ1JBR10gRmFpbGVkIHRvIHdyaXRlIGZhaWx1cmUgcmVwb3J0IHRvICR7cmVwb3J0UGF0aH06YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBJbmRleE1hbmFnZXIsIHR5cGUgSW5kZXhpbmdQcm9ncmVzcywgdHlwZSBJbmRleGluZ1Jlc3VsdCB9IGZyb20gXCIuL2luZGV4TWFuYWdlclwiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSdW5JbmRleGluZ1BhcmFtcyB7XG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQ7XG4gIGFib3J0U2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIGF1dG9SZWluZGV4OiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgZm9yY2VSZWluZGV4PzogYm9vbGVhbjtcbiAgdmVjdG9yU3RvcmU/OiBWZWN0b3JTdG9yZTtcbiAgb25Qcm9ncmVzcz86IChwcm9ncmVzczogSW5kZXhpbmdQcm9ncmVzcykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5JbmRleGluZ1Jlc3VsdCB7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgc3RhdHM6IHtcbiAgICB0b3RhbENodW5rczogbnVtYmVyO1xuICAgIHVuaXF1ZUZpbGVzOiBudW1iZXI7XG4gIH07XG4gIGluZGV4aW5nUmVzdWx0OiBJbmRleGluZ1Jlc3VsdDtcbn1cblxuLyoqXG4gKiBTaGFyZWQgaGVscGVyIHRoYXQgcnVucyB0aGUgZnVsbCBpbmRleGluZyBwaXBlbGluZS5cbiAqIEFsbG93cyByZXVzZSBhY3Jvc3MgdGhlIG1hbnVhbCB0b29sLCBjb25maWctdHJpZ2dlcmVkIGluZGV4aW5nLCBhbmQgYXV0b21hdGljIGJvb3RzdHJhcHBpbmcuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5JbmRleGluZ0pvYih7XG4gIGNsaWVudCxcbiAgYWJvcnRTaWduYWwsXG4gIGRvY3VtZW50c0RpcixcbiAgdmVjdG9yU3RvcmVEaXIsXG4gIGNodW5rU2l6ZSxcbiAgY2h1bmtPdmVybGFwLFxuICBtYXhDb25jdXJyZW50LFxuICBlbmFibGVPQ1IsXG4gIGF1dG9SZWluZGV4LFxuICBwYXJzZURlbGF5TXMsXG4gIGZvcmNlUmVpbmRleCA9IGZhbHNlLFxuICB2ZWN0b3JTdG9yZTogZXhpc3RpbmdWZWN0b3JTdG9yZSxcbiAgb25Qcm9ncmVzcyxcbn06IFJ1bkluZGV4aW5nUGFyYW1zKTogUHJvbWlzZTxSdW5JbmRleGluZ1Jlc3VsdD4ge1xuICBjb25zdCB2ZWN0b3JTdG9yZSA9IGV4aXN0aW5nVmVjdG9yU3RvcmUgPz8gbmV3IFZlY3RvclN0b3JlKHZlY3RvclN0b3JlRGlyKTtcbiAgY29uc3Qgb3duc1ZlY3RvclN0b3JlID0gZXhpc3RpbmdWZWN0b3JTdG9yZSA9PT0gdW5kZWZpbmVkO1xuXG4gIGlmIChvd25zVmVjdG9yU3RvcmUpIHtcbiAgICBhd2FpdCB2ZWN0b3JTdG9yZS5pbml0aWFsaXplKCk7XG4gIH1cblxuICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGNsaWVudC5lbWJlZGRpbmcubW9kZWwoXG4gICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgIHsgc2lnbmFsOiBhYm9ydFNpZ25hbCB9LFxuICApO1xuXG4gIGNvbnN0IGluZGV4TWFuYWdlciA9IG5ldyBJbmRleE1hbmFnZXIoe1xuICAgIGRvY3VtZW50c0RpcixcbiAgICB2ZWN0b3JTdG9yZSxcbiAgICB2ZWN0b3JTdG9yZURpcixcbiAgICBlbWJlZGRpbmdNb2RlbCxcbiAgICBjbGllbnQsXG4gICAgY2h1bmtTaXplLFxuICAgIGNodW5rT3ZlcmxhcCxcbiAgICBtYXhDb25jdXJyZW50LFxuICAgIGVuYWJsZU9DUixcbiAgICBhdXRvUmVpbmRleDogZm9yY2VSZWluZGV4ID8gZmFsc2UgOiBhdXRvUmVpbmRleCxcbiAgICBwYXJzZURlbGF5TXMsXG4gICAgYWJvcnRTaWduYWwsXG4gICAgb25Qcm9ncmVzcyxcbiAgfSk7XG5cbiAgY29uc3QgaW5kZXhpbmdSZXN1bHQgPSBhd2FpdCBpbmRleE1hbmFnZXIuaW5kZXgoKTtcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuXG4gIGlmIChvd25zVmVjdG9yU3RvcmUpIHtcbiAgICBhd2FpdCB2ZWN0b3JTdG9yZS5jbG9zZSgpO1xuICB9XG5cbiAgY29uc3Qgc3VtbWFyeSA9IGBJbmRleGluZyBjb21wbGV0ZWQhXFxuXFxuYCArXG4gICAgYFx1MjAyMiBTdWNjZXNzZnVsbHkgaW5kZXhlZDogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIEZhaWxlZDogJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIFNraXBwZWQgKHVuY2hhbmdlZCk6ICR7aW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgVXBkYXRlZCBleGlzdGluZyBmaWxlczogJHtpbmRleGluZ1Jlc3VsdC51cGRhdGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBOZXcgZmlsZXMgYWRkZWQ6ICR7aW5kZXhpbmdSZXN1bHQubmV3RmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBDaHVua3MgaW4gc3RvcmU6ICR7c3RhdHMudG90YWxDaHVua3N9XFxuYCArXG4gICAgYFx1MjAyMiBVbmlxdWUgZmlsZXMgaW4gc3RvcmU6ICR7c3RhdHMudW5pcXVlRmlsZXN9YDtcblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnksXG4gICAgc3RhdHMsXG4gICAgaW5kZXhpbmdSZXN1bHQsXG4gIH07XG59XG5cbiIsICJpbXBvcnQge1xuICB0eXBlIENoYXRNZXNzYWdlLFxuICB0eXBlIFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG59IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzLCBERUZBVUxUX1BST01QVF9URU1QTEFURSB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUgfSBmcm9tIFwiLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuaW1wb3J0IHsgcGVyZm9ybVNhbml0eUNoZWNrcyB9IGZyb20gXCIuL3V0aWxzL3Nhbml0eUNoZWNrc1wiO1xuaW1wb3J0IHsgdHJ5U3RhcnRJbmRleGluZywgZmluaXNoSW5kZXhpbmcgfSBmcm9tIFwiLi91dGlscy9pbmRleGluZ0xvY2tcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHJ1bkluZGV4aW5nSm9iIH0gZnJvbSBcIi4vaW5nZXN0aW9uL3J1bkluZGV4aW5nXCI7XG5cbi8qKlxuICogQ2hlY2sgdGhlIGFib3J0IHNpZ25hbCBhbmQgdGhyb3cgaWYgdGhlIHJlcXVlc3QgaGFzIGJlZW4gY2FuY2VsbGVkLlxuICogVGhpcyBnaXZlcyBMTSBTdHVkaW8gdGhlIG9wcG9ydHVuaXR5IHRvIHN0b3AgdGhlIHByZXByb2Nlc3NvciBwcm9tcHRseS5cbiAqL1xuZnVuY3Rpb24gY2hlY2tBYm9ydChzaWduYWw6IEFib3J0U2lnbmFsKTogdm9pZCB7XG4gIGlmIChzaWduYWwuYWJvcnRlZCkge1xuICAgIHRocm93IHNpZ25hbC5yZWFzb24gPz8gbmV3IERPTUV4Y2VwdGlvbihcIkFib3J0ZWRcIiwgXCJBYm9ydEVycm9yXCIpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBlcnJvciBpcyBhbiBhYm9ydC9jYW5jZWxsYXRpb24gZXJyb3IgdGhhdCBzaG91bGQgYmUgcmUtdGhyb3duLlxuICovXG5mdW5jdGlvbiBpc0Fib3J0RXJyb3IoZXJyb3I6IHVua25vd24pOiBib29sZWFuIHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubmFtZSA9PT0gXCJBYm9ydEVycm9yXCIpIHJldHVybiB0cnVlO1xuICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlID09PSBcIkFib3J0ZWRcIikgcmV0dXJuIHRydWU7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc3VtbWFyaXplVGV4dCh0ZXh0OiBzdHJpbmcsIG1heExpbmVzOiBudW1iZXIgPSAzLCBtYXhDaGFyczogbnVtYmVyID0gNDAwKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSB0ZXh0LnNwbGl0KC9cXHI/XFxuLykuZmlsdGVyKGxpbmUgPT4gbGluZS50cmltKCkgIT09IFwiXCIpO1xuICBjb25zdCBjbGlwcGVkTGluZXMgPSBsaW5lcy5zbGljZSgwLCBtYXhMaW5lcyk7XG4gIGxldCBjbGlwcGVkID0gY2xpcHBlZExpbmVzLmpvaW4oXCJcXG5cIik7XG4gIGlmIChjbGlwcGVkLmxlbmd0aCA+IG1heENoYXJzKSB7XG4gICAgY2xpcHBlZCA9IGNsaXBwZWQuc2xpY2UoMCwgbWF4Q2hhcnMpO1xuICB9XG4gIGNvbnN0IG5lZWRzRWxsaXBzaXMgPVxuICAgIGxpbmVzLmxlbmd0aCA+IG1heExpbmVzIHx8XG4gICAgdGV4dC5sZW5ndGggPiBjbGlwcGVkLmxlbmd0aCB8fFxuICAgIGNsaXBwZWQubGVuZ3RoID09PSBtYXhDaGFycyAmJiB0ZXh0Lmxlbmd0aCA+IG1heENoYXJzO1xuICByZXR1cm4gbmVlZHNFbGxpcHNpcyA/IGAke2NsaXBwZWQudHJpbUVuZCgpfVx1MjAyNmAgOiBjbGlwcGVkO1xufVxuXG4vLyBHbG9iYWwgc3RhdGUgZm9yIHZlY3RvciBzdG9yZSAocGVyc2lzdHMgYWNyb3NzIHJlcXVlc3RzKVxubGV0IHZlY3RvclN0b3JlOiBWZWN0b3JTdG9yZSB8IG51bGwgPSBudWxsO1xubGV0IGxhc3RJbmRleGVkRGlyID0gXCJcIjtcbmxldCBzYW5pdHlDaGVja3NQYXNzZWQgPSBmYWxzZTtcblxuY29uc3QgUkFHX0NPTlRFWFRfTUFDUk8gPSBcInt7cmFnX2NvbnRleHR9fVwiO1xuY29uc3QgVVNFUl9RVUVSWV9NQUNSTyA9IFwie3t1c2VyX3F1ZXJ5fX1cIjtcblxuZnVuY3Rpb24gbm9ybWFsaXplUHJvbXB0VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBjb25zdCBoYXNDb250ZW50ID0gdHlwZW9mIHRlbXBsYXRlID09PSBcInN0cmluZ1wiICYmIHRlbXBsYXRlLnRyaW0oKS5sZW5ndGggPiAwO1xuICBsZXQgbm9ybWFsaXplZCA9IGhhc0NvbnRlbnQgPyB0ZW1wbGF0ZSEgOiBERUZBVUxUX1BST01QVF9URU1QTEFURTtcblxuICBpZiAoIW5vcm1hbGl6ZWQuaW5jbHVkZXMoUkFHX0NPTlRFWFRfTUFDUk8pKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIFByb21wdCB0ZW1wbGF0ZSBtaXNzaW5nICR7UkFHX0NPTlRFWFRfTUFDUk99LiBQcmVwZW5kaW5nIFJBRyBjb250ZXh0IGJsb2NrLmAsXG4gICAgKTtcbiAgICBub3JtYWxpemVkID0gYCR7UkFHX0NPTlRFWFRfTUFDUk99XFxuXFxuJHtub3JtYWxpemVkfWA7XG4gIH1cblxuICBpZiAoIW5vcm1hbGl6ZWQuaW5jbHVkZXMoVVNFUl9RVUVSWV9NQUNSTykpIHtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgW0JpZ1JBR10gUHJvbXB0IHRlbXBsYXRlIG1pc3NpbmcgJHtVU0VSX1FVRVJZX01BQ1JPfS4gQXBwZW5kaW5nIHVzZXIgcXVlcnkgYmxvY2suYCxcbiAgICApO1xuICAgIG5vcm1hbGl6ZWQgPSBgJHtub3JtYWxpemVkfVxcblxcblVzZXIgUXVlcnk6XFxuXFxuJHtVU0VSX1FVRVJZX01BQ1JPfWA7XG4gIH1cblxuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuZnVuY3Rpb24gZmlsbFByb21wdFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcsIHJlcGxhY2VtZW50czogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhyZXBsYWNlbWVudHMpLnJlZHVjZShcbiAgICAoYWNjLCBbdG9rZW4sIHZhbHVlXSkgPT4gYWNjLnNwbGl0KHRva2VuKS5qb2luKHZhbHVlKSxcbiAgICB0ZW1wbGF0ZSxcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd2FybklmQ29udGV4dE92ZXJmbG93KFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIGZpbmFsUHJvbXB0OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlblNvdXJjZSA9IGF3YWl0IGN0bC50b2tlblNvdXJjZSgpO1xuICAgIGlmIChcbiAgICAgICF0b2tlblNvdXJjZSB8fFxuICAgICAgIShcImFwcGx5UHJvbXB0VGVtcGxhdGVcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5hcHBseVByb21wdFRlbXBsYXRlICE9PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICEoXCJjb3VudFRva2Vuc1wiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmNvdW50VG9rZW5zICE9PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICEoXCJnZXRDb250ZXh0TGVuZ3RoXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuZ2V0Q29udGV4dExlbmd0aCAhPT0gXCJmdW5jdGlvblwiXG4gICAgKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBUb2tlbiBzb3VyY2UgZG9lcyBub3QgZXhwb3NlIHByb21wdCB1dGlsaXRpZXM7IHNraXBwaW5nIGNvbnRleHQgY2hlY2suXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IFtjb250ZXh0TGVuZ3RoLCBoaXN0b3J5XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRva2VuU291cmNlLmdldENvbnRleHRMZW5ndGgoKSxcbiAgICAgIGN0bC5wdWxsSGlzdG9yeSgpLFxuICAgIF0pO1xuICAgIGNvbnN0IGhpc3RvcnlXaXRoTGF0ZXN0TWVzc2FnZSA9IGhpc3Rvcnkud2l0aEFwcGVuZGVkKHtcbiAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgY29udGVudDogZmluYWxQcm9tcHQsXG4gICAgfSk7XG4gICAgY29uc3QgZm9ybWF0dGVkUHJvbXB0ID0gYXdhaXQgdG9rZW5Tb3VyY2UuYXBwbHlQcm9tcHRUZW1wbGF0ZShoaXN0b3J5V2l0aExhdGVzdE1lc3NhZ2UpO1xuICAgIGNvbnN0IHByb21wdFRva2VucyA9IGF3YWl0IHRva2VuU291cmNlLmNvdW50VG9rZW5zKGZvcm1hdHRlZFByb21wdCk7XG5cbiAgICBpZiAocHJvbXB0VG9rZW5zID4gY29udGV4dExlbmd0aCkge1xuICAgICAgY29uc3Qgd2FybmluZ1N1bW1hcnkgPVxuICAgICAgICBgXHUyNkEwXHVGRTBGIFByb21wdCBuZWVkcyAke3Byb21wdFRva2Vucy50b0xvY2FsZVN0cmluZygpfSB0b2tlbnMgYnV0IG1vZGVsIG1heCBpcyAke2NvbnRleHRMZW5ndGgudG9Mb2NhbGVTdHJpbmcoKX0uYDtcbiAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddXCIsIHdhcm5pbmdTdW1tYXJ5KTtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZXJyb3JcIixcbiAgICAgICAgdGV4dDogYCR7d2FybmluZ1N1bW1hcnl9IFJlZHVjZSByZXRyaWV2ZWQgcGFzc2FnZXMgb3IgaW5jcmVhc2UgdGhlIG1vZGVsJ3MgY29udGV4dCBsZW5ndGguYCxcbiAgICAgIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgY3RsLmNsaWVudC5zeXN0ZW0ubm90aWZ5KHtcbiAgICAgICAgICB0aXRsZTogXCJDb250ZXh0IHdpbmRvdyBleGNlZWRlZFwiLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBgJHt3YXJuaW5nU3VtbWFyeX0gUHJvbXB0IG1heSBiZSB0cnVuY2F0ZWQgb3IgcmVqZWN0ZWQuYCxcbiAgICAgICAgICBub0F1dG9EaXNtaXNzOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKG5vdGlmeUVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFVuYWJsZSB0byBzZW5kIGNvbnRleHQgb3ZlcmZsb3cgbm90aWZpY2F0aW9uOlwiLCBub3RpZnlFcnJvcik7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIEZhaWxlZCB0byBldmFsdWF0ZSBjb250ZXh0IHVzYWdlOlwiLCBlcnJvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWluIHByb21wdCBwcmVwcm9jZXNzb3IgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXByb2Nlc3MoXG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcixcbiAgdXNlck1lc3NhZ2U6IENoYXRNZXNzYWdlLFxuKTogUHJvbWlzZTxDaGF0TWVzc2FnZSB8IHN0cmluZz4ge1xuICBjb25zdCB1c2VyUHJvbXB0ID0gdXNlck1lc3NhZ2UuZ2V0VGV4dCgpO1xuICBjb25zdCBwbHVnaW5Db25maWcgPSBjdGwuZ2V0UGx1Z2luQ29uZmlnKGNvbmZpZ1NjaGVtYXRpY3MpO1xuXG4gIC8vIEdldCBjb25maWd1cmF0aW9uXG4gIGNvbnN0IGRvY3VtZW50c0RpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJkb2N1bWVudHNEaXJlY3RvcnlcIik7XG4gIGNvbnN0IHZlY3RvclN0b3JlRGlyID0gcGx1Z2luQ29uZmlnLmdldChcInZlY3RvclN0b3JlRGlyZWN0b3J5XCIpO1xuICBjb25zdCByZXRyaWV2YWxMaW1pdCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxMaW1pdFwiKTtcbiAgY29uc3QgcmV0cmlldmFsVGhyZXNob2xkID0gcGx1Z2luQ29uZmlnLmdldChcInJldHJpZXZhbEFmZmluaXR5VGhyZXNob2xkXCIpO1xuICBjb25zdCBjaHVua1NpemUgPSBwbHVnaW5Db25maWcuZ2V0KFwiY2h1bmtTaXplXCIpO1xuICBjb25zdCBjaHVua092ZXJsYXAgPSBwbHVnaW5Db25maWcuZ2V0KFwiY2h1bmtPdmVybGFwXCIpO1xuICBjb25zdCBtYXhDb25jdXJyZW50ID0gcGx1Z2luQ29uZmlnLmdldChcIm1heENvbmN1cnJlbnRGaWxlc1wiKTtcbiAgY29uc3QgZW5hYmxlT0NSID0gcGx1Z2luQ29uZmlnLmdldChcImVuYWJsZU9DUlwiKTtcbiAgY29uc3Qgc2tpcFByZXZpb3VzbHlJbmRleGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXguc2tpcFByZXZpb3VzbHlJbmRleGVkXCIpO1xuICBjb25zdCBwYXJzZURlbGF5TXMgPSBwbHVnaW5Db25maWcuZ2V0KFwicGFyc2VEZWxheU1zXCIpID8/IDA7XG4gIGNvbnN0IHJlaW5kZXhSZXF1ZXN0ZWQgPSBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC50cmlnZ2VyXCIpO1xuXG4gIC8vIFZhbGlkYXRlIGNvbmZpZ3VyYXRpb25cbiAgaWYgKCFkb2N1bWVudHNEaXIgfHwgZG9jdW1lbnRzRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gRG9jdW1lbnRzIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIGlmICghdmVjdG9yU3RvcmVEaXIgfHwgdmVjdG9yU3RvcmVEaXIgPT09IFwiXCIpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IG5vdCBjb25maWd1cmVkLiBQbGVhc2Ugc2V0IGl0IGluIHBsdWdpbiBzZXR0aW5ncy5cIik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBQZXJmb3JtIHNhbml0eSBjaGVja3Mgb24gZmlyc3QgcnVuXG4gICAgaWYgKCFzYW5pdHlDaGVja3NQYXNzZWQpIHtcbiAgICAgIGNvbnN0IGNoZWNrU3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgIHRleHQ6IFwiUGVyZm9ybWluZyBzYW5pdHkgY2hlY2tzLi4uXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc2FuaXR5UmVzdWx0ID0gYXdhaXQgcGVyZm9ybVNhbml0eUNoZWNrcyhkb2N1bWVudHNEaXIsIHZlY3RvclN0b3JlRGlyKTtcblxuICAgICAgLy8gTG9nIHdhcm5pbmdzXG4gICAgICBmb3IgKGNvbnN0IHdhcm5pbmcgb2Ygc2FuaXR5UmVzdWx0Lndhcm5pbmdzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddXCIsIHdhcm5pbmcpO1xuICAgICAgfVxuXG4gICAgICAvLyBMb2cgZXJyb3JzIGFuZCBhYm9ydCBpZiBjcml0aWNhbFxuICAgICAgaWYgKCFzYW5pdHlSZXN1bHQucGFzc2VkKSB7XG4gICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2Ygc2FuaXR5UmVzdWx0LmVycm9ycykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXVwiLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmFpbHVyZVJlYXNvbiA9XG4gICAgICAgICAgc2FuaXR5UmVzdWx0LmVycm9yc1swXSA/P1xuICAgICAgICAgIHNhbml0eVJlc3VsdC53YXJuaW5nc1swXSA/P1xuICAgICAgICAgIFwiVW5rbm93biByZWFzb24uIFBsZWFzZSByZXZpZXcgcGx1Z2luIHNldHRpbmdzLlwiO1xuICAgICAgICBjaGVja1N0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgdGV4dDogYFNhbml0eSBjaGVja3MgZmFpbGVkOiAke2ZhaWx1cmVSZWFzb259YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIlNhbml0eSBjaGVja3MgcGFzc2VkXCIsXG4gICAgICB9KTtcbiAgICAgIHNhbml0eUNoZWNrc1Bhc3NlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB2ZWN0b3Igc3RvcmUgaWYgbmVlZGVkXG4gICAgaWYgKCF2ZWN0b3JTdG9yZSB8fCBsYXN0SW5kZXhlZERpciAhPT0gdmVjdG9yU3RvcmVEaXIpIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIkluaXRpYWxpemluZyB2ZWN0b3Igc3RvcmUuLi5cIixcbiAgICAgIH0pO1xuXG4gICAgICB2ZWN0b3JTdG9yZSA9IG5ldyBWZWN0b3JTdG9yZSh2ZWN0b3JTdG9yZURpcik7XG4gICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5pbml0aWFsaXplKCk7XG4gICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgIGBbQmlnUkFHXSBWZWN0b3Igc3RvcmUgcmVhZHkgKHBhdGg9JHt2ZWN0b3JTdG9yZURpcn0pLiBXYWl0aW5nIGZvciBxdWVyaWVzLi4uYCxcbiAgICAgICk7XG4gICAgICBsYXN0SW5kZXhlZERpciA9IHZlY3RvclN0b3JlRGlyO1xuXG4gICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuXG4gICAgYXdhaXQgbWF5YmVIYW5kbGVDb25maWdUcmlnZ2VyZWRSZWluZGV4KHtcbiAgICAgIGN0bCxcbiAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgY2h1bmtTaXplLFxuICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgIGVuYWJsZU9DUixcbiAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgIHJlaW5kZXhSZXF1ZXN0ZWQsXG4gICAgICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKSxcbiAgICB9KTtcblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gaW5kZXhcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IHZlY3RvclN0b3JlLmdldFN0YXRzKCk7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHN0YXRzIGJlZm9yZSBhdXRvLWluZGV4IGNoZWNrOiB0b3RhbENodW5rcz0ke3N0YXRzLnRvdGFsQ2h1bmtzfSwgdW5pcXVlRmlsZXM9JHtzdGF0cy51bmlxdWVGaWxlc31gKTtcblxuICAgIGlmIChzdGF0cy50b3RhbENodW5rcyA9PT0gMCkge1xuICAgICAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiYXV0by10cmlnZ2VyXCIpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIEluZGV4aW5nIGFscmVhZHkgcnVubmluZywgc2tpcHBpbmcgYXV0b21hdGljIGluZGV4aW5nLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluZGV4U3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICB0ZXh0OiBcIlN0YXJ0aW5nIGluaXRpYWwgaW5kZXhpbmcuLi5cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IGluZGV4aW5nUmVzdWx0IH0gPSBhd2FpdCBydW5JbmRleGluZ0pvYih7XG4gICAgICAgICAgICBjbGllbnQ6IGN0bC5jbGllbnQsXG4gICAgICAgICAgICBhYm9ydFNpZ25hbDogY3RsLmFib3J0U2lnbmFsLFxuICAgICAgICAgICAgZG9jdW1lbnRzRGlyLFxuICAgICAgICAgICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgICAgICAgICBjaHVua1NpemUsXG4gICAgICAgICAgICBjaHVua092ZXJsYXAsXG4gICAgICAgICAgICBtYXhDb25jdXJyZW50LFxuICAgICAgICAgICAgZW5hYmxlT0NSLFxuICAgICAgICAgICAgYXV0b1JlaW5kZXg6IGZhbHNlLFxuICAgICAgICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgICAgICAgdmVjdG9yU3RvcmUsXG4gICAgICAgICAgICBmb3JjZVJlaW5kZXg6IHRydWUsXG4gICAgICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJzY2FubmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHByb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZCA9IHByb2dyZXNzLmZhaWxlZEZpbGVzID8/IDA7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IHByb2dyZXNzLnNraXBwZWRGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmc6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9LyR7cHJvZ3Jlc3MudG90YWxGaWxlc30gZmlsZXMgYCArXG4gICAgICAgICAgICAgICAgICAgIGAoc3VjY2Vzcz0ke3N1Y2Nlc3N9LCBmYWlsZWQ9JHtmYWlsZWR9LCBza2lwcGVkPSR7c2tpcHBlZH0pIGAgK1xuICAgICAgICAgICAgICAgICAgICBgKCR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9KWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGNvbXBsZXRlOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfSBmaWxlcyBwcm9jZXNzZWRgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZXJyb3I6ICR7cHJvZ3Jlc3MuZXJyb3J9YCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQmlnUkFHXSBJbmRleGluZyBjb21wbGV0ZTogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc30gZmlsZXMgc3VjY2Vzc2Z1bGx5IGluZGV4ZWQgKCR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9IGZhaWxlZClgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBmYWlsZWQ6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltCaWdSQUddIEluZGV4aW5nIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGZpbmlzaEluZGV4aW5nKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG5cbiAgICAvLyBMb2cgbWFudWFsIHJlaW5kZXggdG9nZ2xlIHN0YXRlcyBmb3IgdmlzaWJpbGl0eSBvbiBlYWNoIGNoYXRcbiAgICBjb25zdCB0b2dnbGVTdGF0dXNUZXh0ID1cbiAgICAgIGBNYW51YWwgUmVpbmRleCBUcmlnZ2VyOiAke3JlaW5kZXhSZXF1ZXN0ZWQgPyBcIk9OXCIgOiBcIk9GRlwifSB8IGAgK1xuICAgICAgYFNraXAgUHJldmlvdXNseSBJbmRleGVkOiAke3NraXBQcmV2aW91c2x5SW5kZXhlZCA/IFwiT05cIiA6IFwiT0ZGXCJ9YDtcbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7dG9nZ2xlU3RhdHVzVGV4dH1gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiB0b2dnbGVTdGF0dXNUZXh0LFxuICAgIH0pO1xuXG4gICAgLy8gUGVyZm9ybSByZXRyaWV2YWxcbiAgICBjb25zdCByZXRyaWV2YWxTdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICB0ZXh0OiBcIkxvYWRpbmcgZW1iZWRkaW5nIG1vZGVsIGZvciByZXRyaWV2YWwuLi5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGVtYmVkZGluZ01vZGVsID0gYXdhaXQgY3RsLmNsaWVudC5lbWJlZGRpbmcubW9kZWwoXG4gICAgICBcIm5vbWljLWFpL25vbWljLWVtYmVkLXRleHQtdjEuNS1HR1VGXCIsXG4gICAgICB7IHNpZ25hbDogY3RsLmFib3J0U2lnbmFsIH1cbiAgICApO1xuXG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuXG4gICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICB0ZXh0OiBcIlNlYXJjaGluZyBmb3IgcmVsZXZhbnQgY29udGVudC4uLlwiLFxuICAgIH0pO1xuXG4gICAgLy8gRW1iZWQgdGhlIHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlFbWJlZGRpbmdSZXN1bHQgPSBhd2FpdCBlbWJlZGRpbmdNb2RlbC5lbWJlZCh1c2VyUHJvbXB0KTtcbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG4gICAgY29uc3QgcXVlcnlFbWJlZGRpbmcgPSBxdWVyeUVtYmVkZGluZ1Jlc3VsdC5lbWJlZGRpbmc7XG5cbiAgICAvLyBTZWFyY2ggdmVjdG9yIHN0b3JlXG4gICAgY29uc3QgcXVlcnlQcmV2aWV3ID1cbiAgICAgIHVzZXJQcm9tcHQubGVuZ3RoID4gMTYwID8gYCR7dXNlclByb21wdC5zbGljZSgwLCAxNjApfS4uLmAgOiB1c2VyUHJvbXB0O1xuICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgIGBbQmlnUkFHXSBFeGVjdXRpbmcgdmVjdG9yIHNlYXJjaCBmb3IgXCIke3F1ZXJ5UHJldmlld31cIiAobGltaXQ9JHtyZXRyaWV2YWxMaW1pdH0sIHRocmVzaG9sZD0ke3JldHJpZXZhbFRocmVzaG9sZH0pYCxcbiAgICApO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5zZWFyY2goXG4gICAgICBxdWVyeUVtYmVkZGluZyxcbiAgICAgIHJldHJpZXZhbExpbWl0LFxuICAgICAgcmV0cmlldmFsVGhyZXNob2xkXG4gICAgKTtcbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgdG9wSGl0ID0gcmVzdWx0c1swXTtcbiAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgYFtCaWdSQUddIFZlY3RvciBzZWFyY2ggcmV0dXJuZWQgJHtyZXN1bHRzLmxlbmd0aH0gcmVzdWx0cy4gVG9wIGhpdDogZmlsZT0ke3RvcEhpdC5maWxlTmFtZX0gc2NvcmU9JHt0b3BIaXQuc2NvcmUudG9GaXhlZCgzKX1gLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgZG9jU3VtbWFyaWVzID0gcmVzdWx0c1xuICAgICAgICAubWFwKFxuICAgICAgICAgIChyZXN1bHQsIGlkeCkgPT5cbiAgICAgICAgICAgIGAjJHtpZHggKyAxfSBmaWxlPSR7cGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpfSBzaGFyZD0ke3Jlc3VsdC5zaGFyZE5hbWV9IHNjb3JlPSR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9YCxcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUmVsZXZhbnQgZG9jdW1lbnRzOlxcbiR7ZG9jU3VtbWFyaWVzfWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBWZWN0b3Igc2VhcmNoIHJldHVybmVkIDAgcmVzdWx0cy5cIik7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgdGV4dDogXCJObyByZWxldmFudCBjb250ZW50IGZvdW5kIGluIGluZGV4ZWQgZG9jdW1lbnRzXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgbm90ZUFib3V0Tm9SZXN1bHRzID1cbiAgICAgICAgYEltcG9ydGFudDogTm8gcmVsZXZhbnQgY29udGVudCB3YXMgZm91bmQgaW4gdGhlIGluZGV4ZWQgZG9jdW1lbnRzIGZvciB0aGUgdXNlciBxdWVyeS4gYCArXG4gICAgICAgIGBJbiBsZXNzIHRoYW4gb25lIHNlbnRlbmNlLCBpbmZvcm0gdGhlIHVzZXIgb2YgdGhpcy4gYCArXG4gICAgICAgIGBUaGVuIHJlc3BvbmQgdG8gdGhlIHF1ZXJ5IHRvIHRoZSBiZXN0IG9mIHlvdXIgYWJpbGl0eS5gO1xuXG4gICAgICByZXR1cm4gbm90ZUFib3V0Tm9SZXN1bHRzICsgYFxcblxcblVzZXIgUXVlcnk6XFxuXFxuJHt1c2VyUHJvbXB0fWA7XG4gICAgfVxuXG4gICAgLy8gRm9ybWF0IHJlc3VsdHNcbiAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSZXRyaWV2ZWQgJHtyZXN1bHRzLmxlbmd0aH0gcmVsZXZhbnQgcGFzc2FnZXNgLFxuICAgIH0pO1xuXG4gICAgY3RsLmRlYnVnKFwiUmV0cmlldmFsIHJlc3VsdHM6XCIsIHJlc3VsdHMpO1xuXG4gICAgbGV0IHJhZ0NvbnRleHRGdWxsID0gXCJcIjtcbiAgICBsZXQgcmFnQ29udGV4dFByZXZpZXcgPSBcIlwiO1xuICAgIGNvbnN0IHByZWZpeCA9IFwiVGhlIGZvbGxvd2luZyBwYXNzYWdlcyB3ZXJlIGZvdW5kIGluIHlvdXIgaW5kZXhlZCBkb2N1bWVudHM6XFxuXFxuXCI7XG4gICAgcmFnQ29udGV4dEZ1bGwgKz0gcHJlZml4O1xuICAgIHJhZ0NvbnRleHRQcmV2aWV3ICs9IHByZWZpeDtcblxuICAgIGxldCBjaXRhdGlvbk51bWJlciA9IDE7XG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCk7XG4gICAgICBjb25zdCBjaXRhdGlvbkxhYmVsID0gYENpdGF0aW9uICR7Y2l0YXRpb25OdW1iZXJ9IChmcm9tICR7ZmlsZU5hbWV9LCBzY29yZTogJHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX0pOiBgO1xuICAgICAgcmFnQ29udGV4dEZ1bGwgKz0gYFxcbiR7Y2l0YXRpb25MYWJlbH1cIiR7cmVzdWx0LnRleHR9XCJcXG5cXG5gO1xuICAgICAgcmFnQ29udGV4dFByZXZpZXcgKz0gYFxcbiR7Y2l0YXRpb25MYWJlbH1cIiR7c3VtbWFyaXplVGV4dChyZXN1bHQudGV4dCl9XCJcXG5cXG5gO1xuICAgICAgY2l0YXRpb25OdW1iZXIrKztcbiAgICB9XG5cbiAgICBjb25zdCBwcm9tcHRUZW1wbGF0ZSA9IG5vcm1hbGl6ZVByb21wdFRlbXBsYXRlKHBsdWdpbkNvbmZpZy5nZXQoXCJwcm9tcHRUZW1wbGF0ZVwiKSk7XG4gICAgY29uc3QgZmluYWxQcm9tcHQgPSBmaWxsUHJvbXB0VGVtcGxhdGUocHJvbXB0VGVtcGxhdGUsIHtcbiAgICAgIFtSQUdfQ09OVEVYVF9NQUNST106IHJhZ0NvbnRleHRGdWxsLnRyaW1FbmQoKSxcbiAgICAgIFtVU0VSX1FVRVJZX01BQ1JPXTogdXNlclByb21wdCxcbiAgICB9KTtcbiAgICBjb25zdCBmaW5hbFByb21wdFByZXZpZXcgPSBmaWxsUHJvbXB0VGVtcGxhdGUocHJvbXB0VGVtcGxhdGUsIHtcbiAgICAgIFtSQUdfQ09OVEVYVF9NQUNST106IHJhZ0NvbnRleHRQcmV2aWV3LnRyaW1FbmQoKSxcbiAgICAgIFtVU0VSX1FVRVJZX01BQ1JPXTogdXNlclByb21wdCxcbiAgICB9KTtcblxuICAgIGN0bC5kZWJ1ZyhcIlByb2Nlc3NlZCBjb250ZW50IChwcmV2aWV3KTpcIiwgZmluYWxQcm9tcHRQcmV2aWV3KTtcblxuICAgIGNvbnN0IHBhc3NhZ2VzTG9nRW50cmllcyA9IHJlc3VsdHMubWFwKChyZXN1bHQsIGlkeCkgPT4ge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCk7XG4gICAgICByZXR1cm4gYCMke2lkeCArIDF9IGZpbGU9JHtmaWxlTmFtZX0gc2hhcmQ9JHtyZXN1bHQuc2hhcmROYW1lfSBzY29yZT0ke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfVxcbiR7c3VtbWFyaXplVGV4dChyZXN1bHQudGV4dCl9YDtcbiAgICB9KTtcbiAgICBjb25zdCBwYXNzYWdlc0xvZyA9IHBhc3NhZ2VzTG9nRW50cmllcy5qb2luKFwiXFxuXFxuXCIpO1xuXG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSBSQUcgcGFzc2FnZXMgKCR7cmVzdWx0cy5sZW5ndGh9KSBwcmV2aWV3OlxcbiR7cGFzc2FnZXNMb2d9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogYFJBRyBwYXNzYWdlcyAoJHtyZXN1bHRzLmxlbmd0aH0pOmAsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBwYXNzYWdlc0xvZ0VudHJpZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBlbnRyeSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gRmluYWwgcHJvbXB0IHNlbnQgdG8gbW9kZWwgKHByZXZpZXcpOlxcbiR7ZmluYWxQcm9tcHRQcmV2aWV3fWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBGaW5hbCBwcm9tcHQgc2VudCB0byBtb2RlbCAocHJldmlldyk6XFxuJHtmaW5hbFByb21wdFByZXZpZXd9YCxcbiAgICB9KTtcblxuICAgIGF3YWl0IHdhcm5JZkNvbnRleHRPdmVyZmxvdyhjdGwsIGZpbmFsUHJvbXB0KTtcblxuICAgIHJldHVybiBmaW5hbFByb21wdDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJTVBPUlRBTlQ6IFJlLXRocm93IGFib3J0IGVycm9ycyBzbyBMTSBTdHVkaW8gY2FuIHN0b3AgdGhlIHByZXByb2Nlc3NvciBwcm9tcHRseS5cbiAgICAvLyBTd2FsbG93aW5nIEFib3J0RXJyb3IgY2F1c2VzIHRoZSBcImRpZCBub3QgYWJvcnQgaW4gdGltZVwiIHdhcm5pbmcuXG4gICAgaWYgKGlzQWJvcnRFcnJvcihlcnJvcikpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICBjb25zb2xlLmVycm9yKFwiW1Byb21wdFByZXByb2Nlc3Nvcl0gUHJlcHJvY2Vzc2luZyBmYWlsZWQuXCIsIGVycm9yKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cbn1cblxuaW50ZXJmYWNlIENvbmZpZ1JlaW5kZXhPcHRzIHtcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyO1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIHJlaW5kZXhSZXF1ZXN0ZWQ6IGJvb2xlYW47XG4gIHNraXBQcmV2aW91c2x5SW5kZXhlZDogYm9vbGVhbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWF5YmVIYW5kbGVDb25maWdUcmlnZ2VyZWRSZWluZGV4KHtcbiAgY3RsLFxuICBkb2N1bWVudHNEaXIsXG4gIHZlY3RvclN0b3JlRGlyLFxuICBjaHVua1NpemUsXG4gIGNodW5rT3ZlcmxhcCxcbiAgbWF4Q29uY3VycmVudCxcbiAgZW5hYmxlT0NSLFxuICBwYXJzZURlbGF5TXMsXG4gIHJlaW5kZXhSZXF1ZXN0ZWQsXG4gIHNraXBQcmV2aW91c2x5SW5kZXhlZCxcbn06IENvbmZpZ1JlaW5kZXhPcHRzKSB7XG4gIGlmICghcmVpbmRleFJlcXVlc3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlbWluZGVyVGV4dCA9XG4gICAgYE1hbnVhbCBSZWluZGV4IFRyaWdnZXIgaXMgT04uIFNraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzIGlzIGN1cnJlbnRseSAke3NraXBQcmV2aW91c2x5SW5kZXhlZCA/IFwiT05cIiA6IFwiT0ZGXCJ9LiBgICtcbiAgICBcIlRoZSBpbmRleCB3aWxsIGJlIHJlYnVpbHQgZWFjaCBjaGF0IHdoZW4gJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPRkYuIElmICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT04sIHRoZSBpbmRleCB3aWxsIG9ubHkgYmUgcmVidWlsdCBmb3IgbmV3IG9yIGNoYW5nZWQgZmlsZXMuXCI7XG4gIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gJHtyZW1pbmRlclRleHR9YCk7XG4gIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgdGV4dDogcmVtaW5kZXJUZXh0LFxuICB9KTtcblxuICBpZiAoIXRyeVN0YXJ0SW5kZXhpbmcoXCJjb25maWctdHJpZ2dlclwiKSkge1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IGFscmVhZHkgcnVubmluZy4gUGxlYXNlIHdhaXQgZm9yIGl0IHRvIGZpbmlzaC5cIixcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgIHRleHQ6IFwiTWFudWFsIHJlaW5kZXggcmVxdWVzdGVkIGZyb20gY29uZmlnLi4uXCIsXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgeyBpbmRleGluZ1Jlc3VsdCB9ID0gYXdhaXQgcnVuSW5kZXhpbmdKb2Ioe1xuICAgICAgY2xpZW50OiBjdGwuY2xpZW50LFxuICAgICAgYWJvcnRTaWduYWw6IGN0bC5hYm9ydFNpZ25hbCxcbiAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgY2h1bmtTaXplLFxuICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgIGVuYWJsZU9DUixcbiAgICAgIGF1dG9SZWluZGV4OiBza2lwUHJldmlvdXNseUluZGV4ZWQsXG4gICAgICBwYXJzZURlbGF5TXMsXG4gICAgICBmb3JjZVJlaW5kZXg6ICFza2lwUHJldmlvdXNseUluZGV4ZWQsXG4gICAgICB2ZWN0b3JTdG9yZTogdmVjdG9yU3RvcmUgPz8gdW5kZWZpbmVkLFxuICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwic2Nhbm5pbmdcIikge1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgdGV4dDogYFNjYW5uaW5nOiAke3Byb2dyZXNzLmN1cnJlbnRGaWxlfWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImluZGV4aW5nXCIpIHtcbiAgICAgICAgICBjb25zdCBzdWNjZXNzID0gcHJvZ3Jlc3Muc3VjY2Vzc2Z1bEZpbGVzID8/IDA7XG4gICAgICAgICAgY29uc3QgZmFpbGVkID0gcHJvZ3Jlc3MuZmFpbGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICBjb25zdCBza2lwcGVkID0gcHJvZ3Jlc3Muc2tpcHBlZEZpbGVzID8/IDA7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmc6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9LyR7cHJvZ3Jlc3MudG90YWxGaWxlc30gZmlsZXMgYCArXG4gICAgICAgICAgICAgIGAoc3VjY2Vzcz0ke3N1Y2Nlc3N9LCBmYWlsZWQ9JHtmYWlsZWR9LCBza2lwcGVkPSR7c2tpcHBlZH0pIGAgK1xuICAgICAgICAgICAgICBgKCR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9KWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBlcnJvcjogJHtwcm9ncmVzcy5lcnJvcn1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IGNvbXBsZXRlIVwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3VtbWFyeUxpbmVzID0gW1xuICAgICAgYFByb2Nlc3NlZDogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc31gLFxuICAgICAgYEZhaWxlZDogJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc31gLFxuICAgICAgYFNraXBwZWQgKHVuY2hhbmdlZCk6ICR7aW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzfWAsXG4gICAgICBgVXBkYXRlZCBleGlzdGluZyBmaWxlczogJHtpbmRleGluZ1Jlc3VsdC51cGRhdGVkRmlsZXN9YCxcbiAgICAgIGBOZXcgZmlsZXMgYWRkZWQ6ICR7aW5kZXhpbmdSZXN1bHQubmV3RmlsZXN9YCxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBzdW1tYXJ5TGluZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBsaW5lLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMgPiAwICYmIGluZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlcyA9PT0gaW5kZXhpbmdSZXN1bHQudG90YWxGaWxlcykge1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IFwiQWxsIGZpbGVzIHdlcmUgYWxyZWFkeSB1cCB0byBkYXRlIChza2lwcGVkKS5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtCaWdSQUddIE1hbnVhbCByZWluZGV4IHN1bW1hcnk6XFxuICAke3N1bW1hcnlMaW5lcy5qb2luKFwiXFxuICBcIil9YCxcbiAgICApO1xuXG4gICAgYXdhaXQgbm90aWZ5TWFudWFsUmVzZXROZWVkZWQoY3RsKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICB0ZXh0OiBgTWFudWFsIHJlaW5kZXggZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgIH0pO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBmaW5pc2hJbmRleGluZygpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcikge1xuICB0cnkge1xuICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICB0aXRsZTogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZWRcIixcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXIgaXMgT04uIFRoZSBpbmRleCB3aWxsIGJlIHJlYnVpbHQgZWFjaCBjaGF0IHdoZW4gJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPRkYuIElmICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT04sIHRoZSBpbmRleCB3aWxsIG9ubHkgYmUgcmVidWlsdCBmb3IgbmV3IG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVW5hYmxlIHRvIHNlbmQgbm90aWZpY2F0aW9uIGFib3V0IG1hbnVhbCByZWluZGV4IHJlc2V0OlwiLCBlcnJvcik7XG4gIH1cbn1cblxuXG4iLCAiaW1wb3J0IHsgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IHByZXByb2Nlc3MgfSBmcm9tIFwiLi9wcm9tcHRQcmVwcm9jZXNzb3JcIjtcblxuLyoqXG4gKiBNYWluIGVudHJ5IHBvaW50IGZvciB0aGUgQmlnIFJBRyBwbHVnaW4uXG4gKiBUaGlzIHBsdWdpbiBpbmRleGVzIGxhcmdlIGRvY3VtZW50IGNvbGxlY3Rpb25zIGFuZCBwcm92aWRlcyBSQUcgY2FwYWJpbGl0aWVzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihjb250ZXh0OiBQbHVnaW5Db250ZXh0KSB7XG4gIC8vIFJlZ2lzdGVyIHRoZSBjb25maWd1cmF0aW9uIHNjaGVtYXRpY3NcbiAgY29udGV4dC53aXRoQ29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgXG4gIC8vIFJlZ2lzdGVyIHRoZSBwcm9tcHQgcHJlcHJvY2Vzc29yXG4gIGNvbnRleHQud2l0aFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgXG4gIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gUGx1Z2luIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseVwiKTtcbn1cblxuIiwgImltcG9ydCB7IExNU3R1ZGlvQ2xpZW50LCB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5kZWNsYXJlIHZhciBwcm9jZXNzOiBhbnk7XG5cbi8vIFdlIHJlY2VpdmUgcnVudGltZSBpbmZvcm1hdGlvbiBpbiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuY29uc3QgY2xpZW50SWRlbnRpZmllciA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX0lERU5USUZJRVI7XG5jb25zdCBjbGllbnRQYXNza2V5ID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfUEFTU0tFWTtcbmNvbnN0IGJhc2VVcmwgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0JBU0VfVVJMO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgTE1TdHVkaW9DbGllbnQoe1xuICBjbGllbnRJZGVudGlmaWVyLFxuICBjbGllbnRQYXNza2V5LFxuICBiYXNlVXJsLFxufSk7XG5cbihnbG9iYWxUaGlzIGFzIGFueSkuX19MTVNfUExVR0lOX0NPTlRFWFQgPSB0cnVlO1xuXG5sZXQgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gZmFsc2U7XG5sZXQgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gZmFsc2U7XG5sZXQgY29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCB0b29sc1Byb3ZpZGVyU2V0ID0gZmFsc2U7XG5sZXQgZ2VuZXJhdG9yU2V0ID0gZmFsc2U7XG5cbmNvbnN0IHNlbGZSZWdpc3RyYXRpb25Ib3N0ID0gY2xpZW50LnBsdWdpbnMuZ2V0U2VsZlJlZ2lzdHJhdGlvbkhvc3QoKTtcblxuY29uc3QgcGx1Z2luQ29udGV4dDogUGx1Z2luQ29udGV4dCA9IHtcbiAgd2l0aFByZWRpY3Rpb25Mb29wSGFuZGxlcjogKGdlbmVyYXRlKSA9PiB7XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgdG9vbHMgcHJvdmlkZXJcIik7XG4gICAgfVxuXG4gICAgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcmVkaWN0aW9uTG9vcEhhbmRsZXIoZ2VuZXJhdGUpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoUHJvbXB0UHJlcHJvY2Vzc29yOiAocHJlcHJvY2VzcykgPT4ge1xuICAgIGlmIChwcm9tcHRQcmVwcm9jZXNzb3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21wdFByZXByb2Nlc3NvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIHByb21wdFByZXByb2Nlc3NvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoQ29uZmlnU2NoZW1hdGljczogKGNvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoY29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBjb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2xvYmFsQ29uZmlnU2NoZW1hdGljczogKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2xvYmFsIGNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2xvYmFsQ29uZmlnU2NoZW1hdGljcyhnbG9iYWxDb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFRvb2xzUHJvdmlkZXI6ICh0b29sc1Byb3ZpZGVyKSA9PiB7XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHByZWRpY3Rpb25Mb29wSGFuZGxlclwiKTtcbiAgICB9XG5cbiAgICB0b29sc1Byb3ZpZGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2VuZXJhdG9yOiAoZ2VuZXJhdG9yKSA9PiB7XG4gICAgaWYgKGdlbmVyYXRvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0b3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdlbmVyYXRvcihnZW5lcmF0b3IpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxufTtcblxuaW1wb3J0KFwiLi8uLi9zcmMvaW5kZXgudHNcIikudGhlbihhc3luYyBtb2R1bGUgPT4ge1xuICByZXR1cm4gYXdhaXQgbW9kdWxlLm1haW4ocGx1Z2luQ29udGV4dCk7XG59KS50aGVuKCgpID0+IHtcbiAgc2VsZlJlZ2lzdHJhdGlvbkhvc3QuaW5pdENvbXBsZXRlZCgpO1xufSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgcGx1Z2luLlwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0JBRWEseUJBUUE7QUFWYjtBQUFBO0FBQUE7QUFBQSxpQkFBdUM7QUFFaEMsSUFBTSwwQkFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRaEMsSUFBTSx1QkFBbUIsbUNBQXVCLEVBQ3BEO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixhQUFhO0FBQUEsTUFDZjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBRyxLQUFLLElBQUksTUFBTSxFQUFFO0FBQUEsTUFDckM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxHQUFLLEtBQUssR0FBSyxNQUFNLEtBQUs7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEtBQUssS0FBSyxNQUFNLE1BQU0sSUFBSTtBQUFBLE1BQzNDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBRyxLQUFLLEtBQUssTUFBTSxHQUFHO0FBQUEsTUFDdkM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxHQUFHLEtBQUssSUFBSSxNQUFNLEVBQUU7QUFBQSxNQUNyQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFB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QWE7QUFDeEMsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUNaLHVCQUFxQixjQUFjO0FBQ3JDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNsQixVQUFRLE1BQU0sb0RBQW9EO0FBQ2xFLFVBQVEsTUFBTSxLQUFLO0FBQ3JCLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgInBhdGgiLCAiY3J5cHRvIiwgImZzIiwgInJlc29sdmUiLCAiY2h1bmtUZXh0IiwgInNjYW5EaXJlY3RvcnkiLCAiZmlsZXMiLCAiZnMiLCAicGF0aCIsICJmcyIsICJjbGllbnQiLCAicmVzb2x2ZSIsICJwZGZQYXJzZSIsICJmcyIsICJyZXNvbHZlIiwgImltcG9ydF90ZXNzZXJhY3QiLCAiZnMiLCAiY2xpZW50IiwgInBhdGgiLCAiY2h1bmtUZXh0IiwgImNodW5rVGV4dHNQYXJhbGxlbCIsICJjaHVua1RleHRzQmF0Y2giLCAicmVzb2x2ZSIsICJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgInBhdGgiLCAidmVjdG9yU3RvcmUiLCAic2NhbkRpcmVjdG9yeSIsICJQUXVldWUiLCAiY2h1bmtUZXh0c0JhdGNoIiwgImNsaWVudCIsICJ2ZWN0b3JTdG9yZSIsICJwYXRoIiwgImltcG9ydF9zZGsiLCAicHJlcHJvY2VzcyIsICJjb25maWdTY2hlbWF0aWNzIiwgIm1vZHVsZSJdCn0K
