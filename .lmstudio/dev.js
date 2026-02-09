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
async function scanDirectory(rootDir, onProgress) {
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
function chunkText(text, chunkSize, overlap) {
  const chunks = [];
  const words = text.split(/\s+/);
  if (words.length === 0) {
    return chunks;
  }
  let startIdx = 0;
  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    const chunkWords = words.slice(startIdx, endIdx);
    const chunkText2 = chunkWords.join(" ");
    chunks.push({
      text: chunkText2,
      startIndex: startIdx,
      endIndex: endIdx
    });
    startIdx += Math.max(1, chunkSize - overlap);
    if (endIdx >= words.length) {
      break;
    }
  }
  return chunks;
}
var init_textChunker = __esm({
  "src/utils/textChunker.ts"() {
    "use strict";
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
var crypto, fs7;
var init_fileHash = __esm({
  "src/utils/fileHash.ts"() {
    "use strict";
    crypto = __toESM(require("crypto"));
    fs7 = __toESM(require("fs"));
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
        this.queue = new import_p_queue.default({ concurrency: options.maxConcurrent });
        this.failedFileRegistry = new FailedFileRegistry(
          path5.join(options.vectorStoreDir, ".big-rag-failures.json")
        );
      }
      /**
       * Start the indexing process
       */
      async index() {
        const { documentsDir, vectorStore: vectorStore2, onProgress } = this.options;
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
          const files = await scanDirectory(documentsDir, (scanned, found) => {
            if (onProgress) {
              onProgress({
                totalFiles: found,
                processedFiles: 0,
                currentFile: `Scanned ${scanned} files...`,
                status: "scanning"
              });
            }
          });
          console.log(`Found ${files.length} files to process`);
          let processedCount = 0;
          let successCount = 0;
          let failCount = 0;
          let skippedCount = 0;
          let updatedCount = 0;
          let newCount = 0;
          if (onProgress) {
            onProgress({
              totalFiles: files.length,
              processedFiles: 0,
              currentFile: files[0]?.name ?? "",
              status: "indexing"
            });
          }
          const tasks = files.map(
            (file) => this.queue.add(async () => {
              let outcome = { type: "failed" };
              try {
                if (onProgress) {
                  onProgress({
                    totalFiles: files.length,
                    processedFiles: processedCount,
                    currentFile: file.name,
                    status: "indexing",
                    successfulFiles: successCount,
                    failedFiles: failCount,
                    skippedFiles: skippedCount
                  });
                }
                outcome = await this.indexFile(file, fileInventory);
              } catch (error) {
                console.error(`Error indexing file ${file.path}:`, error);
                this.recordFailure(
                  "parser.unexpected-error",
                  error instanceof Error ? error.message : String(error),
                  file
                );
              }
              processedCount++;
              switch (outcome.type) {
                case "skipped":
                  successCount++;
                  skippedCount++;
                  break;
                case "indexed":
                  successCount++;
                  if (outcome.changeType === "new") {
                    newCount++;
                  } else {
                    updatedCount++;
                  }
                  break;
                case "failed":
                  failCount++;
                  break;
              }
              if (onProgress) {
                onProgress({
                  totalFiles: files.length,
                  processedFiles: processedCount,
                  currentFile: file.name,
                  status: "indexing",
                  successfulFiles: successCount,
                  failedFiles: failCount,
                  skippedFiles: skippedCount
                });
              }
            })
          );
          await Promise.all(tasks);
          if (onProgress) {
            onProgress({
              totalFiles: files.length,
              processedFiles: processedCount,
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
      /**
       * Index a single file
       */
      async indexFile(file, fileInventory = /* @__PURE__ */ new Map()) {
        const { vectorStore: vectorStore2, embeddingModel, client: client2, chunkSize, chunkOverlap, enableOCR, autoReindex } = this.options;
        let fileHash;
        try {
          fileHash = await calculateFileHash(file.path);
          const existingHashes = fileInventory.get(file.path);
          const hasSeenBefore = existingHashes !== void 0 && existingHashes.size > 0;
          const hasSameHash = existingHashes?.has(fileHash) ?? false;
          if (autoReindex && hasSameHash) {
            console.log(`File already indexed (skipped): ${file.name}`);
            return { type: "skipped" };
          }
          if (autoReindex) {
            const previousFailure = await this.failedFileRegistry.getFailureReason(file.path, fileHash);
            if (previousFailure) {
              console.log(
                `File previously failed (skipped): ${file.name} (reason=${previousFailure})`
              );
              return { type: "skipped" };
            }
          }
          if (this.options.parseDelayMs > 0) {
            await new Promise((resolve3) => setTimeout(resolve3, this.options.parseDelayMs));
          }
          const parsedResult = await parseDocument(file.path, enableOCR, client2);
          if (!parsedResult.success) {
            this.recordFailure(parsedResult.reason, parsedResult.details, file);
            if (fileHash) {
              await this.failedFileRegistry.recordFailure(file.path, fileHash, parsedResult.reason);
            }
            return { type: "failed" };
          }
          const parsed = parsedResult.document;
          const chunks = chunkText(parsed.text, chunkSize, chunkOverlap);
          if (chunks.length === 0) {
            console.log(`No chunks created from ${file.name}`);
            this.recordFailure("index.chunk-empty", "chunkText produced 0 chunks", file);
            if (fileHash) {
              await this.failedFileRegistry.recordFailure(file.path, fileHash, "index.chunk-empty");
            }
            return { type: "failed" };
          }
          const documentChunks = [];
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            try {
              const embeddingResult = await embeddingModel.embed(chunk.text);
              const embedding = coerceEmbeddingVector(embeddingResult.embedding);
              documentChunks.push({
                id: `${fileHash}-${i}`,
                text: chunk.text,
                vector: embedding,
                filePath: file.path,
                fileName: file.name,
                fileHash,
                chunkIndex: i,
                metadata: {
                  extension: file.extension,
                  size: file.size,
                  mtime: file.mtime.toISOString(),
                  startIndex: chunk.startIndex,
                  endIndex: chunk.endIndex
                }
              });
            } catch (error) {
              console.error(`Error embedding chunk ${i} of ${file.name}:`, error);
            }
          }
          if (documentChunks.length === 0) {
            this.recordFailure(
              "index.chunk-empty",
              "All chunk embeddings failed, no document chunks",
              file
            );
            if (fileHash) {
              await this.failedFileRegistry.recordFailure(file.path, fileHash, "index.chunk-empty");
            }
            return { type: "failed" };
          }
          try {
            await vectorStore2.addChunks(documentChunks);
            console.log(`Indexed ${documentChunks.length} chunks from ${file.name}`);
            if (!existingHashes) {
              fileInventory.set(file.path, /* @__PURE__ */ new Set([fileHash]));
            } else {
              existingHashes.add(fileHash);
            }
            await this.failedFileRegistry.clearFailure(file.path);
            return {
              type: "indexed",
              changeType: hasSeenBefore ? "updated" : "new"
            };
          } catch (error) {
            console.error(`Error adding chunks for ${file.name}:`, error);
            this.recordFailure(
              "index.vector-add-error",
              error instanceof Error ? error.message : String(error),
              file
            );
            if (fileHash) {
              await this.failedFileRegistry.recordFailure(file.path, fileHash, "index.vector-add-error");
            }
            return { type: "failed" };
          }
        } catch (error) {
          console.error(`Error indexing file ${file.path}:`, error);
          this.recordFailure(
            "parser.unexpected-error",
            error instanceof Error ? error.message : String(error),
            file
          );
          if (fileHash) {
            await this.failedFileRegistry.recordFailure(file.path, fileHash, "parser.unexpected-error");
          }
          return { type: "failed" };
        }
      }
      /**
       * Reindex a specific file (delete old chunks and reindex)
       */
      async reindexFile(filePath) {
        const { vectorStore: vectorStore2 } = this.options;
        try {
          const fileHash = await calculateFileHash(filePath);
          await vectorStore2.deleteByFileHash(fileHash);
          const file = {
            path: filePath,
            name: filePath.split("/").pop() || filePath,
            extension: filePath.split(".").pop() || "",
            mimeType: false,
            size: 0,
            mtime: /* @__PURE__ */ new Date()
          };
          await this.indexFile(file);
        } catch (error) {
          console.error(`Error reindexing file ${filePath}:`, error);
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
    retrievalStatus.setState({
      status: "loading",
      text: "Searching for relevant content..."
    });
    const queryEmbeddingResult = await embeddingModel.embed(userPrompt);
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
    if (results.length > 0) {
      const topHit = results[0];
      console.info(
        `[BigRAG] Vector search returned ${results.length} results. Top hit: file=${topHit.fileName} score=${topHit.score.toFixed(3)}`
      );
      const docSummaries = results.map(
        (result, idx) => `#${idx + 1} file=${path6.basename(result.filePath)} score=${result.score.toFixed(3)}`
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
      return `#${idx + 1} file=${fileName} score=${result.score.toFixed(3)}
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vZmlsZVNjYW5uZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvaHRtbFBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9wZGZQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZXB1YlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9pbWFnZVBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy90ZXh0UGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2RvY3VtZW50UGFyc2VyLnRzIiwgIi4uL3NyYy91dGlscy90ZXh0Q2h1bmtlci50cyIsICIuLi9zcmMvdXRpbHMvZmlsZUhhc2gudHMiLCAiLi4vc3JjL3V0aWxzL2ZhaWxlZEZpbGVSZWdpc3RyeS50cyIsICIuLi9zcmMvaW5nZXN0aW9uL2luZGV4TWFuYWdlci50cyIsICIuLi9zcmMvaW5nZXN0aW9uL3J1bkluZGV4aW5nLnRzIiwgIi4uL3NyYy9wcm9tcHRQcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFID0gYHt7cmFnX2NvbnRleHR9fVxuXG5Vc2UgdGhlIGNpdGF0aW9ucyBhYm92ZSB0byByZXNwb25kIHRvIHRoZSB1c2VyIHF1ZXJ5LCBvbmx5IGlmIHRoZXkgYXJlIHJlbGV2YW50LiBPdGhlcndpc2UsIHJlc3BvbmQgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5IHdpdGhvdXQgdGhlbS5cblxuVXNlciBRdWVyeTpcblxue3t1c2VyX3F1ZXJ5fX1gO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJkb2N1bWVudHNEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkRvY3VtZW50cyBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIlJvb3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgZG9jdW1lbnRzIHRvIGluZGV4LiBBbGwgc3ViZGlyZWN0b3JpZXMgd2lsbCBiZSBzY2FubmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vZG9jdW1lbnRzXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInZlY3RvclN0b3JlRGlyZWN0b3J5XCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJWZWN0b3IgU3RvcmUgRGlyZWN0b3J5XCIsXG4gICAgICBzdWJ0aXRsZTogXCJEaXJlY3Rvcnkgd2hlcmUgdGhlIHZlY3RvciBkYXRhYmFzZSB3aWxsIGJlIHN0b3JlZC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIi9wYXRoL3RvL3ZlY3Rvci9zdG9yZVwiLFxuICAgIH0sXG4gICAgXCJcIixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxMaW1pdFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgTGltaXRcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGNodW5rcyB0byByZXR1cm4gZHVyaW5nIHJldHJpZXZhbC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEsIG1heDogMjAsIHN0ZXA6IDEgfSxcbiAgICB9LFxuICAgIDUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicmV0cmlldmFsQWZmaW5pdHlUaHJlc2hvbGRcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBtaW46IDAuMCxcbiAgICAgIG1heDogMS4wLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUmV0cmlldmFsIEFmZmluaXR5IFRocmVzaG9sZFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWluaW11bSBzaW1pbGFyaXR5IHNjb3JlIGZvciBhIGNodW5rIHRvIGJlIGNvbnNpZGVyZWQgcmVsZXZhbnQuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLjAsIG1heDogMS4wLCBzdGVwOiAwLjAxIH0sXG4gICAgfSxcbiAgICAwLjUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtTaXplXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxMjgsXG4gICAgICBtYXg6IDIwNDgsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBTaXplXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTaXplIG9mIHRleHQgY2h1bmtzIGZvciBlbWJlZGRpbmcgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxMjgsIG1heDogMjA0OCwgc3RlcDogMTI4IH0sXG4gICAgfSxcbiAgICA1MTIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtPdmVybGFwXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiA1MTIsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBPdmVybGFwXCIsXG4gICAgICBzdWJ0aXRsZTogXCJPdmVybGFwIGJldHdlZW4gY29uc2VjdXRpdmUgY2h1bmtzIChpbiB0b2tlbnMpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MTIsIHN0ZXA6IDMyIH0sXG4gICAgfSxcbiAgICAxMDAsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWF4Q29uY3VycmVudEZpbGVzXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAxMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1heCBDb25jdXJyZW50IEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0byBwcm9jZXNzIGNvbmN1cnJlbnRseSBkdXJpbmcgaW5kZXhpbmcuIFJlY29tbWVuZCAxIGZvciBsYXJnZSBQREYgZGF0YXNldHMuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxLCBtYXg6IDEwLCBzdGVwOiAxIH0sXG4gICAgfSxcbiAgICAxLFxuICApXG4gIC5maWVsZChcbiAgICBcInBhcnNlRGVsYXlNc1wiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogNTAwMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlBhcnNlciBEZWxheSAobXMpXCIsXG4gICAgICBzdWJ0aXRsZTogXCJXYWl0IHRpbWUgYmVmb3JlIHBhcnNpbmcgZWFjaCBkb2N1bWVudCAoaGVscHMgYXZvaWQgV2ViU29ja2V0IHRocm90dGxpbmcpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MDAwLCBzdGVwOiAxMDAgfSxcbiAgICB9LFxuICAgIDUwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJlbmFibGVPQ1JcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgT0NSXCIsXG4gICAgICBzdWJ0aXRsZTogXCJFbmFibGUgT0NSIGZvciBpbWFnZSBmaWxlcyBhbmQgaW1hZ2UtYmFzZWQgUERGcyB1c2luZyBMTSBTdHVkaW8ncyBidWlsdC1pbiBkb2N1bWVudCBwYXJzZXIuXCIsXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXJcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlRvZ2dsZSBPTiB0byByZXF1ZXN0IGFuIGltbWVkaWF0ZSByZWluZGV4LiBUaGUgcGx1Z2luIHJlc2V0cyB0aGlzIGFmdGVyIHJ1bm5pbmcuIFVzZSB0aGUgXHUyMDFDU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcdTIwMUQgb3B0aW9uIGJlbG93IHRvIGNvbnRyb2wgd2hldGhlciB1bmNoYW5nZWQgZmlsZXMgYXJlIHNraXBwZWQuXCIsXG4gICAgfSxcbiAgICBmYWxzZSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlNraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTa2lwIHVuY2hhbmdlZCBmaWxlcyBmb3IgZmFzdGVyIG1hbnVhbCBydW5zLiBPbmx5IGluZGV4ZXMgbmV3IGZpbGVzIG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJtYW51YWxSZWluZGV4LnRyaWdnZXJcIixcbiAgICAgICAgICBjb25kaXRpb246IHsgdHlwZTogXCJlcXVhbHNcIiwgdmFsdWU6IHRydWUgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcInByb21wdFRlbXBsYXRlXCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJQcm9tcHQgVGVtcGxhdGVcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlN1cHBvcnRzIHt7cmFnX2NvbnRleHR9fSAocmVxdWlyZWQpIGFuZCB7e3VzZXJfcXVlcnl9fSBtYWNyb3MgZm9yIGN1c3RvbWl6aW5nIHRoZSBmaW5hbCBwcm9tcHQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogREVGQVVMVF9QUk9NUFRfVEVNUExBVEUsXG4gICAgICBpc1BhcmFncmFwaDogdHJ1ZSxcbiAgICB9LFxuICAgIERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFLFxuICApXG4gIC5idWlsZCgpO1xuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzL3Byb21pc2VzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBMb2NhbEluZGV4IH0gZnJvbSBcInZlY3RyYVwiO1xuXG5jb25zdCBNQVhfSVRFTVNfUEVSX1NIQVJEID0gMTAwMDA7XG5jb25zdCBTSEFSRF9ESVJfUFJFRklYID0gXCJzaGFyZF9cIjtcbmNvbnN0IFNIQVJEX0RJUl9SRUdFWCA9IC9ec2hhcmRfKFxcZCspJC87XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9jdW1lbnRDaHVuayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgdmVjdG9yOiBudW1iZXJbXTtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBtZXRhZGF0YTogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNjb3JlOiBudW1iZXI7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGNodW5rSW5kZXg6IG51bWJlcjtcbiAgbWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbnR5cGUgQ2h1bmtNZXRhZGF0YSA9IHtcbiAgdGV4dDogc3RyaW5nO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIFtrZXk6IHN0cmluZ106IGFueTtcbn07XG5cbmV4cG9ydCBjbGFzcyBWZWN0b3JTdG9yZSB7XG4gIHByaXZhdGUgZGJQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgc2hhcmREaXJzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGFjdGl2ZVNoYXJkOiBMb2NhbEluZGV4IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlU2hhcmRDb3VudDogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSB1cGRhdGVNdXRleDogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gIGNvbnN0cnVjdG9yKGRiUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5kYlBhdGggPSBwYXRoLnJlc29sdmUoZGJQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVuIGEgc2hhcmQgYnkgZGlyZWN0b3J5IG5hbWUgKGUuZy4gXCJzaGFyZF8wMDBcIikuIENhbGxlciBtdXN0IG5vdCBob2xkIHRoZSByZWZlcmVuY2VcbiAgICogYWZ0ZXIgdXNlIHNvIEdDIGNhbiBmcmVlIHRoZSBwYXJzZWQgaW5kZXggZGF0YS5cbiAgICovXG4gIHByaXZhdGUgb3BlblNoYXJkKGRpcjogc3RyaW5nKTogTG9jYWxJbmRleCB7XG4gICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIGRpcik7XG4gICAgcmV0dXJuIG5ldyBMb2NhbEluZGV4KGZ1bGxQYXRoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTY2FuIGRiUGF0aCBmb3Igc2hhcmRfTk5OIGRpcmVjdG9yaWVzIGFuZCByZXR1cm4gc29ydGVkIGxpc3QuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGRpc2NvdmVyU2hhcmREaXJzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucmVhZGRpcih0aGlzLmRiUGF0aCwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgIGNvbnN0IGRpcnM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChjb25zdCBlIG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChlLmlzRGlyZWN0b3J5KCkgJiYgU0hBUkRfRElSX1JFR0VYLnRlc3QoZS5uYW1lKSkge1xuICAgICAgICBkaXJzLnB1c2goZS5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZGlycy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBuID0gKG06IHN0cmluZykgPT4gcGFyc2VJbnQobS5tYXRjaChTSEFSRF9ESVJfUkVHRVgpIVsxXSwgMTApO1xuICAgICAgcmV0dXJuIG4oYSkgLSBuKGIpO1xuICAgIH0pO1xuICAgIHJldHVybiBkaXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHZlY3RvciBzdG9yZTogZGlzY292ZXIgb3IgY3JlYXRlIHNoYXJkcywgb3BlbiB0aGUgbGFzdCBhcyBhY3RpdmUuXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLm1rZGlyKHRoaXMuZGJQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB0aGlzLnNoYXJkRGlycyA9IGF3YWl0IHRoaXMuZGlzY292ZXJTaGFyZERpcnMoKTtcblxuICAgIGlmICh0aGlzLnNoYXJkRGlycy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnN0IGZpcnN0RGlyID0gYCR7U0hBUkRfRElSX1BSRUZJWH0wMDBgO1xuICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIGZpcnN0RGlyKTtcbiAgICAgIGNvbnN0IGluZGV4ID0gbmV3IExvY2FsSW5kZXgoZnVsbFBhdGgpO1xuICAgICAgYXdhaXQgaW5kZXguY3JlYXRlSW5kZXgoeyB2ZXJzaW9uOiAxIH0pO1xuICAgICAgdGhpcy5zaGFyZERpcnMgPSBbZmlyc3REaXJdO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IGluZGV4O1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbGFzdERpciA9IHRoaXMuc2hhcmREaXJzW3RoaXMuc2hhcmREaXJzLmxlbmd0aCAtIDFdO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IHRoaXMub3BlblNoYXJkKGxhc3REaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gaXRlbXMubGVuZ3RoO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGRvY3VtZW50IGNodW5rcyB0byB0aGUgYWN0aXZlIHNoYXJkLiBSb3RhdGVzIHRvIGEgbmV3IHNoYXJkIHdoZW4gZnVsbC5cbiAgICovXG4gIGFzeW5jIGFkZENodW5rcyhjaHVua3M6IERvY3VtZW50Q2h1bmtbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5hY3RpdmVTaGFyZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVjdG9yIHN0b3JlIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICB9XG4gICAgaWYgKGNodW5rcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5hY3RpdmVTaGFyZCEuYmVnaW5VcGRhdGUoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgICAgICAgY29uc3QgbWV0YWRhdGE6IENodW5rTWV0YWRhdGEgPSB7XG4gICAgICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICAgICAgZmlsZVBhdGg6IGNodW5rLmZpbGVQYXRoLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGNodW5rLmZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZUhhc2g6IGNodW5rLmZpbGVIYXNoLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogY2h1bmsuY2h1bmtJbmRleCxcbiAgICAgICAgICAgIC4uLmNodW5rLm1ldGFkYXRhLFxuICAgICAgICAgIH07XG4gICAgICAgICAgYXdhaXQgdGhpcy5hY3RpdmVTaGFyZCEudXBzZXJ0SXRlbSh7XG4gICAgICAgICAgICBpZDogY2h1bmsuaWQsXG4gICAgICAgICAgICB2ZWN0b3I6IGNodW5rLnZlY3RvcixcbiAgICAgICAgICAgIG1ldGFkYXRhLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLmVuZFVwZGF0ZSgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkIS5jYW5jZWxVcGRhdGUoKTtcbiAgICAgICAgdGhyb3cgZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCArPSBjaHVua3MubGVuZ3RoO1xuICAgICAgY29uc29sZS5sb2coYEFkZGVkICR7Y2h1bmtzLmxlbmd0aH0gY2h1bmtzIHRvIHZlY3RvciBzdG9yZWApO1xuXG4gICAgICBpZiAodGhpcy5hY3RpdmVTaGFyZENvdW50ID49IE1BWF9JVEVNU19QRVJfU0hBUkQpIHtcbiAgICAgICAgY29uc3QgbmV4dE51bSA9IHRoaXMuc2hhcmREaXJzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgbmV4dERpciA9IGAke1NIQVJEX0RJUl9QUkVGSVh9JHtTdHJpbmcobmV4dE51bSkucGFkU3RhcnQoMywgXCIwXCIpfWA7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBuZXh0RGlyKTtcbiAgICAgICAgY29uc3QgbmV3SW5kZXggPSBuZXcgTG9jYWxJbmRleChmdWxsUGF0aCk7XG4gICAgICAgIGF3YWl0IG5ld0luZGV4LmNyZWF0ZUluZGV4KHsgdmVyc2lvbjogMSB9KTtcbiAgICAgICAgdGhpcy5zaGFyZERpcnMucHVzaChuZXh0RGlyKTtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZCA9IG5ld0luZGV4O1xuICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgPSAwO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoOiBxdWVyeSBlYWNoIHNoYXJkIGluIHR1cm4sIG1lcmdlIHJlc3VsdHMsIHNvcnQgYnkgc2NvcmUsIGZpbHRlciBieSB0aHJlc2hvbGQsIHJldHVybiB0b3AgbGltaXQuXG4gICAqL1xuICBhc3luYyBzZWFyY2goXG4gICAgcXVlcnlWZWN0b3I6IG51bWJlcltdLFxuICAgIGxpbWl0OiBudW1iZXIgPSA1LFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMC41LFxuICApOiBQcm9taXNlPFNlYXJjaFJlc3VsdFtdPiB7XG4gICAgY29uc3QgbWVyZ2VkOiBTZWFyY2hSZXN1bHRbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgc2hhcmQucXVlcnlJdGVtcyhcbiAgICAgICAgcXVlcnlWZWN0b3IsXG4gICAgICAgIFwiXCIsXG4gICAgICAgIGxpbWl0LFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIGZhbHNlLFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3QgciBvZiByZXN1bHRzKSB7XG4gICAgICAgIGNvbnN0IG0gPSByLml0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YTtcbiAgICAgICAgbWVyZ2VkLnB1c2goe1xuICAgICAgICAgIHRleHQ6IG0/LnRleHQgPz8gXCJcIixcbiAgICAgICAgICBzY29yZTogci5zY29yZSxcbiAgICAgICAgICBmaWxlUGF0aDogbT8uZmlsZVBhdGggPz8gXCJcIixcbiAgICAgICAgICBmaWxlTmFtZTogbT8uZmlsZU5hbWUgPz8gXCJcIixcbiAgICAgICAgICBjaHVua0luZGV4OiBtPy5jaHVua0luZGV4ID8/IDAsXG4gICAgICAgICAgbWV0YWRhdGE6IChyLml0ZW0ubWV0YWRhdGEgYXMgUmVjb3JkPHN0cmluZywgYW55PikgPz8ge30sXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkXG4gICAgICAuZmlsdGVyKChyKSA9PiByLnNjb3JlID49IHRocmVzaG9sZClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLnNjb3JlIC0gYS5zY29yZSlcbiAgICAgIC5zbGljZSgwLCBsaW1pdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFsbCBjaHVua3MgZm9yIGEgZmlsZSAoYnkgaGFzaCkgYWNyb3NzIGFsbCBzaGFyZHMuXG4gICAqL1xuICBhc3luYyBkZWxldGVCeUZpbGVIYXNoKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBsYXN0RGlyID0gdGhpcy5zaGFyZERpcnNbdGhpcy5zaGFyZERpcnMubGVuZ3RoIC0gMV07XG4gICAgdGhpcy51cGRhdGVNdXRleCA9IHRoaXMudXBkYXRlTXV0ZXgudGhlbihhc3luYyAoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICAgIGNvbnN0IHRvRGVsZXRlID0gaXRlbXMuZmlsdGVyKFxuICAgICAgICAgIChpKSA9PiAoaS5tZXRhZGF0YSBhcyBDaHVua01ldGFkYXRhKT8uZmlsZUhhc2ggPT09IGZpbGVIYXNoLFxuICAgICAgICApO1xuICAgICAgICBpZiAodG9EZWxldGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGF3YWl0IHNoYXJkLmJlZ2luVXBkYXRlKCk7XG4gICAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHRvRGVsZXRlKSB7XG4gICAgICAgICAgICBhd2FpdCBzaGFyZC5kZWxldGVJdGVtKGl0ZW0uaWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBzaGFyZC5lbmRVcGRhdGUoKTtcbiAgICAgICAgICBpZiAoZGlyID09PSBsYXN0RGlyICYmIHRoaXMuYWN0aXZlU2hhcmQpIHtcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IChhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkLmxpc3RJdGVtcygpKS5sZW5ndGg7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zb2xlLmxvZyhgRGVsZXRlZCBjaHVua3MgZm9yIGZpbGUgaGFzaDogJHtmaWxlSGFzaH1gKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy51cGRhdGVNdXRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgZmlsZSBwYXRoIC0+IHNldCBvZiBmaWxlIGhhc2hlcyBjdXJyZW50bHkgaW4gdGhlIHN0b3JlLlxuICAgKi9cbiAgYXN5bmMgZ2V0RmlsZUhhc2hJbnZlbnRvcnkoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+IHtcbiAgICBjb25zdCBpbnZlbnRvcnkgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgIGNvbnN0IHNoYXJkID0gdGhpcy5vcGVuU2hhcmQoZGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgbSA9IGl0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBtPy5maWxlUGF0aDtcbiAgICAgICAgY29uc3QgZmlsZUhhc2ggPSBtPy5maWxlSGFzaDtcbiAgICAgICAgaWYgKCFmaWxlUGF0aCB8fCAhZmlsZUhhc2gpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgc2V0ID0gaW52ZW50b3J5LmdldChmaWxlUGF0aCk7XG4gICAgICAgIGlmICghc2V0KSB7XG4gICAgICAgICAgc2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgICAgaW52ZW50b3J5LnNldChmaWxlUGF0aCwgc2V0KTtcbiAgICAgICAgfVxuICAgICAgICBzZXQuYWRkKGZpbGVIYXNoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGludmVudG9yeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdG90YWwgY2h1bmsgY291bnQgYW5kIHVuaXF1ZSBmaWxlIGNvdW50LlxuICAgKi9cbiAgYXN5bmMgZ2V0U3RhdHMoKTogUHJvbWlzZTx7XG4gICAgdG90YWxDaHVua3M6IG51bWJlcjtcbiAgICB1bmlxdWVGaWxlczogbnVtYmVyO1xuICB9PiB7XG4gICAgbGV0IHRvdGFsQ2h1bmtzID0gMDtcbiAgICBjb25zdCB1bmlxdWVIYXNoZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBzaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIHRvdGFsQ2h1bmtzICs9IGl0ZW1zLmxlbmd0aDtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgICAgICBjb25zdCBoID0gKGl0ZW0ubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YSk/LmZpbGVIYXNoO1xuICAgICAgICBpZiAoaCkgdW5pcXVlSGFzaGVzLmFkZChoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHsgdG90YWxDaHVua3MsIHVuaXF1ZUZpbGVzOiB1bmlxdWVIYXNoZXMuc2l6ZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGFueSBjaHVuayBleGlzdHMgZm9yIHRoZSBnaXZlbiBmaWxlIGhhc2ggKHNob3J0LWNpcmN1aXRzIG9uIGZpcnN0IG1hdGNoKS5cbiAgICovXG4gIGFzeW5jIGhhc0ZpbGUoZmlsZUhhc2g6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgaWYgKGl0ZW1zLnNvbWUoKGkpID0+IChpLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGEpPy5maWxlSGFzaCA9PT0gZmlsZUhhc2gpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogUmVsZWFzZSB0aGUgYWN0aXZlIHNoYXJkIHJlZmVyZW5jZS5cbiAgICovXG4gIGFzeW5jIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTYW5pdHlDaGVja1Jlc3VsdCB7XG4gIHBhc3NlZDogYm9vbGVhbjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFBlcmZvcm0gc2FuaXR5IGNoZWNrcyBiZWZvcmUgaW5kZXhpbmcgbGFyZ2UgZGlyZWN0b3JpZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1TYW5pdHlDaGVja3MoXG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nLFxuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nLFxuKTogUHJvbWlzZTxTYW5pdHlDaGVja1Jlc3VsdD4ge1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIENoZWNrIGlmIGRpcmVjdG9yaWVzIGV4aXN0XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKGRvY3VtZW50c0RpciwgZnMuY29uc3RhbnRzLlJfT0spO1xuICB9IGNhdGNoIHtcbiAgICBlcnJvcnMucHVzaChgRG9jdW1lbnRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgcmVhZGFibGU6ICR7ZG9jdW1lbnRzRGlyfWApO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3ModmVjdG9yU3RvcmVEaXIsIGZzLmNvbnN0YW50cy5XX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gVHJ5IHRvIGNyZWF0ZSBpdFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2Rpcih2ZWN0b3JTdG9yZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgYFZlY3RvciBzdG9yZSBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiAke3ZlY3RvclN0b3JlRGlyfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXRmcyh2ZWN0b3JTdG9yZURpcik7XG4gICAgY29uc3QgYXZhaWxhYmxlR0IgPSAoc3RhdHMuYmF2YWlsICogc3RhdHMuYnNpemUpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGF2YWlsYWJsZUdCIDwgMSkge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbGFibGVHQiA8IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKGBMb3cgZGlzayBzcGFjZSBhdmFpbGFibGU6ICR7YXZhaWxhYmxlR0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBjaGVjayBhdmFpbGFibGUgZGlzayBzcGFjZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBtZW1vcnlcbiAgY29uc3QgZnJlZU1lbW9yeUdCID0gb3MuZnJlZW1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHRvdGFsTWVtb3J5R0IgPSBvcy50b3RhbG1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHJ1bm5pbmdPbk1hYyA9IHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCI7XG4gIGNvbnN0IGxvd01lbW9yeU1lc3NhZ2UgPVxuICAgIGBMb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCIG9mICR7dG90YWxNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQiB0b3RhbC4gYCArXG4gICAgXCJDb25zaWRlciByZWR1Y2luZyBjb25jdXJyZW50IGZpbGUgcHJvY2Vzc2luZy5cIjtcbiAgY29uc3QgdmVyeUxvd01lbW9yeU1lc3NhZ2UgPVxuICAgIGBWZXJ5IGxvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0IuIGAgK1xuICAgIChydW5uaW5nT25NYWNcbiAgICAgID8gXCJtYWNPUyBtYXkgYmUgcmVwb3J0aW5nIGNhY2hlZCBwYWdlcyBhcyB1c2VkOyBjYWNoZWQgbWVtb3J5IGNhbiB1c3VhbGx5IGJlIHJlY2xhaW1lZCBhdXRvbWF0aWNhbGx5LlwiXG4gICAgICA6IFwiSW5kZXhpbmcgbWF5IGZhaWwgZHVlIHRvIGluc3VmZmljaWVudCBSQU0uXCIpO1xuXG4gIGlmIChmcmVlTWVtb3J5R0IgPCAwLjUpIHtcbiAgICBpZiAocnVubmluZ09uTWFjKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKHZlcnlMb3dNZW1vcnlNZXNzYWdlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH1cbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCAyKSB7XG4gICAgd2FybmluZ3MucHVzaChsb3dNZW1vcnlNZXNzYWdlKTtcbiAgfVxuXG4gIC8vIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIChzYW1wbGUtYmFzZWQgZm9yIHBlcmZvcm1hbmNlKVxuICB0cnkge1xuICAgIGNvbnN0IHNhbXBsZVNpemUgPSBhd2FpdCBlc3RpbWF0ZURpcmVjdG9yeVNpemUoZG9jdW1lbnRzRGlyKTtcbiAgICBjb25zdCBlc3RpbWF0ZWRHQiA9IHNhbXBsZVNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgICBcbiAgICBpZiAoZXN0aW1hdGVkR0IgPiAxMDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGBMYXJnZSBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSBzZXZlcmFsIGhvdXJzLmBcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChlc3RpbWF0ZWRHQiA+IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTWVkaXVtLXNpemVkIGRpcmVjdG9yeSBkZXRlY3RlZCAofiR7ZXN0aW1hdGVkR0IudG9GaXhlZCgxKX0gR0IpLiBJbml0aWFsIGluZGV4aW5nIG1heSB0YWtlIDMwLTYwIG1pbnV0ZXMuYFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBlc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHZlY3RvciBzdG9yZSBhbHJlYWR5IGhhcyBkYXRhXG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKHZlY3RvclN0b3JlRGlyKTtcbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgXCJWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGlzIG5vdCBlbXB0eS4gRXhpc3RpbmcgZGF0YSB3aWxsIGJlIHVzZWQgZm9yIGluY3JlbWVudGFsIGluZGV4aW5nLlwiXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QgeWV0LCB0aGF0J3MgZmluZVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwYXNzZWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgd2FybmluZ3MsXG4gICAgZXJyb3JzLFxuICB9O1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIGJ5IHNhbXBsaW5nXG4gKiAoUXVpY2sgZXN0aW1hdGUsIG5vdCBleGFjdClcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRpcjogc3RyaW5nLCBtYXhTYW1wbGVzOiBudW1iZXIgPSAxMDApOiBQcm9taXNlPG51bWJlcj4ge1xuICBsZXQgdG90YWxTaXplID0gMDtcbiAgbGV0IGZpbGVDb3VudCA9IDA7XG4gIGxldCBzYW1wbGVkU2l6ZSA9IDA7XG4gIGxldCBzYW1wbGVkQ291bnQgPSAwO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoY3VycmVudERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHNhbXBsZWRDb3VudCA+PSBtYXhTYW1wbGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGN1cnJlbnREaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBgJHtjdXJyZW50RGlyfS8ke2VudHJ5Lm5hbWV9YDtcblxuICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIGF3YWl0IHdhbGsoZnVsbFBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICAgICAgZmlsZUNvdW50Kys7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKHNhbXBsZWRDb3VudCA8IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgIHNhbXBsZWRTaXplICs9IHN0YXRzLnNpemU7XG4gICAgICAgICAgICAgIHNhbXBsZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIFNraXAgZmlsZXMgd2UgY2FuJ3Qgc3RhdFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU2tpcCBkaXJlY3RvcmllcyB3ZSBjYW4ndCByZWFkXG4gICAgfVxuICB9XG5cbiAgYXdhaXQgd2FsayhkaXIpO1xuXG4gIC8vIEV4dHJhcG9sYXRlIGZyb20gc2FtcGxlXG4gIGlmIChzYW1wbGVkQ291bnQgPiAwICYmIGZpbGVDb3VudCA+IDApIHtcbiAgICBjb25zdCBhdmdGaWxlU2l6ZSA9IHNhbXBsZWRTaXplIC8gc2FtcGxlZENvdW50O1xuICAgIHRvdGFsU2l6ZSA9IGF2Z0ZpbGVTaXplICogZmlsZUNvdW50O1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsU2l6ZTtcbn1cblxuLyoqXG4gKiBDaGVjayBzeXN0ZW0gcmVzb3VyY2VzIGFuZCBwcm92aWRlIHJlY29tbWVuZGF0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2VSZWNvbW1lbmRhdGlvbnMoXG4gIGVzdGltYXRlZFNpemVHQjogbnVtYmVyLFxuICBmcmVlTWVtb3J5R0I6IG51bWJlcixcbik6IHtcbiAgcmVjb21tZW5kZWRDb25jdXJyZW5jeTogbnVtYmVyO1xuICByZWNvbW1lbmRlZENodW5rU2l6ZTogbnVtYmVyO1xuICBlc3RpbWF0ZWRUaW1lOiBzdHJpbmc7XG59IHtcbiAgbGV0IHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAzO1xuICBsZXQgcmVjb21tZW5kZWRDaHVua1NpemUgPSA1MTI7XG4gIGxldCBlc3RpbWF0ZWRUaW1lID0gXCJ1bmtub3duXCI7XG5cbiAgLy8gQWRqdXN0IGJhc2VkIG9uIGF2YWlsYWJsZSBtZW1vcnlcbiAgaWYgKGZyZWVNZW1vcnlHQiA8IDIpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMTtcbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCA0KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDI7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCID49IDgpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gNTtcbiAgfVxuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBkYXRhc2V0IHNpemVcbiAgaWYgKGVzdGltYXRlZFNpemVHQiA8IDEpIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCI1LTE1IG1pbnV0ZXNcIjtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMCkge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjMwLTYwIG1pbnV0ZXNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDc2ODtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMDApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIyLTQgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gIH0gZWxzZSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNC0xMiBob3Vyc1wiO1xuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplID0gMTAyNDtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gTWF0aC5taW4ocmVjb21tZW5kZWRDb25jdXJyZW5jeSwgMyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3ksXG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUsXG4gICAgZXN0aW1hdGVkVGltZSxcbiAgfTtcbn1cblxuIiwgImxldCBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGFjcXVpcmUgdGhlIHNoYXJlZCBpbmRleGluZyBsb2NrLlxuICogUmV0dXJucyB0cnVlIGlmIG5vIG90aGVyIGluZGV4aW5nIGpvYiBpcyBydW5uaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ5U3RhcnRJbmRleGluZyhjb250ZXh0OiBzdHJpbmcgPSBcInVua25vd25cIik6IGJvb2xlYW4ge1xuICBpZiAoaW5kZXhpbmdJblByb2dyZXNzKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gdHJ5U3RhcnRJbmRleGluZyAoJHtjb250ZXh0fSkgZmFpbGVkOiBsb2NrIGFscmVhZHkgaGVsZGApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGluZGV4aW5nSW5Qcm9ncmVzcyA9IHRydWU7XG4gIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIHN1Y2NlZWRlZGApO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZWxlYXNlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmlzaEluZGV4aW5nKCk6IHZvaWQge1xuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgY29uc29sZS5kZWJ1ZyhcIltCaWdSQUddIGZpbmlzaEluZGV4aW5nOiBsb2NrIHJlbGVhc2VkXCIpO1xufVxuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIGFuIGluZGV4aW5nIGpvYiBpcyBjdXJyZW50bHkgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhpbmcoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmRleGluZ0luUHJvZ3Jlc3M7XG59XG5cbiIsICJjb25zdCBIVE1MX0VYVEVOU0lPTlMgPSBbXCIuaHRtXCIsIFwiLmh0bWxcIiwgXCIueGh0bWxcIl07XG5jb25zdCBNQVJLRE9XTl9FWFRFTlNJT05TID0gW1wiLm1kXCIsIFwiLm1hcmtkb3duXCIsIFwiLm1kb3duXCIsIFwiLm1keFwiLCBcIi5ta2RcIiwgXCIubWtkblwiXTtcbmNvbnN0IFRFWFRfRVhURU5TSU9OUyA9IFtcIi50eHRcIiwgXCIudGV4dFwiXTtcbmNvbnN0IFBERl9FWFRFTlNJT05TID0gW1wiLnBkZlwiXTtcbmNvbnN0IEVQVUJfRVhURU5TSU9OUyA9IFtcIi5lcHViXCJdO1xuY29uc3QgSU1BR0VfRVhURU5TSU9OUyA9IFtcIi5ibXBcIiwgXCIuanBnXCIsIFwiLmpwZWdcIiwgXCIucG5nXCJdO1xuY29uc3QgQVJDSElWRV9FWFRFTlNJT05TID0gW1wiLnJhclwiXTtcblxuY29uc3QgQUxMX0VYVEVOU0lPTl9HUk9VUFMgPSBbXG4gIEhUTUxfRVhURU5TSU9OUyxcbiAgTUFSS0RPV05fRVhURU5TSU9OUyxcbiAgVEVYVF9FWFRFTlNJT05TLFxuICBQREZfRVhURU5TSU9OUyxcbiAgRVBVQl9FWFRFTlNJT05TLFxuICBJTUFHRV9FWFRFTlNJT05TLFxuICBBUkNISVZFX0VYVEVOU0lPTlMsXG5dO1xuXG5leHBvcnQgY29uc3QgU1VQUE9SVEVEX0VYVEVOU0lPTlMgPSBuZXcgU2V0KFxuICBBTExfRVhURU5TSU9OX0dST1VQUy5mbGF0TWFwKChncm91cCkgPT4gZ3JvdXAubWFwKChleHQpID0+IGV4dC50b0xvd2VyQ2FzZSgpKSksXG4pO1xuXG5leHBvcnQgY29uc3QgSFRNTF9FWFRFTlNJT05fU0VUID0gbmV3IFNldChIVE1MX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IE1BUktET1dOX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KE1BUktET1dOX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IFRFWFRfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoVEVYVF9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBJTUFHRV9FWFRFTlNJT05fU0VUID0gbmV3IFNldChJTUFHRV9FWFRFTlNJT05TKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSHRtbEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gSFRNTF9FWFRFTlNJT05fU0VULmhhcyhleHQudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBNQVJLRE9XTl9FWFRFTlNJT05fU0VULmhhcyhleHQudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYWluVGV4dEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gVEVYVF9FWFRFTlNJT05fU0VULmhhcyhleHQudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RleHR1YWxFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzTWFya2Rvd25FeHRlbnNpb24oZXh0KSB8fCBpc1BsYWluVGV4dEV4dGVuc2lvbihleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMoKTogc3RyaW5nW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShTVVBQT1JURURfRVhURU5TSU9OUy52YWx1ZXMoKSkuc29ydCgpO1xufVxuXG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIG1pbWUgZnJvbSBcIm1pbWUtdHlwZXNcIjtcbmltcG9ydCB7XG4gIFNVUFBPUlRFRF9FWFRFTlNJT05TLFxuICBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucyxcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTY2FubmVkRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBleHRlbnNpb246IHN0cmluZztcbiAgbWltZVR5cGU6IHN0cmluZyB8IGZhbHNlO1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBEYXRlO1xufVxuXG4vKiogTm9ybWFsaXplIGFuZCB2YWxpZGF0ZSB0aGUgcm9vdCBkaXJlY3RvcnkgZm9yIHNjYW5uaW5nIChyZXNvbHZlcyBwYXRoLCBzdHJpcHMgdHJhaWxpbmcgc2xhc2hlcykuICovXG5mdW5jdGlvbiBub3JtYWxpemVSb290RGlyKHJvb3REaXI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBwYXRoLnJlc29sdmUocm9vdERpci50cmltKCkpLnJlcGxhY2UoL1xcLyskLywgXCJcIik7XG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHNjYW4gYSBkaXJlY3RvcnkgZm9yIHN1cHBvcnRlZCBmaWxlc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhbkRpcmVjdG9yeShcbiAgcm9vdERpcjogc3RyaW5nLFxuICBvblByb2dyZXNzPzogKGN1cnJlbnQ6IG51bWJlciwgdG90YWw6IG51bWJlcikgPT4gdm9pZCxcbik6IFByb21pc2U8U2Nhbm5lZEZpbGVbXT4ge1xuICBjb25zdCByb290ID0gbm9ybWFsaXplUm9vdERpcihyb290RGlyKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3Mocm9vdCwgZnMuY29uc3RhbnRzLlJfT0spO1xuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIGlmIChlcnI/LmNvZGUgPT09IFwiRU5PRU5UXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYERvY3VtZW50cyBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Q6ICR7cm9vdH0uIENoZWNrIHRoZSBwYXRoIChlLmcuIHNwZWxsaW5nIGFuZCB0aGF0IHRoZSBmb2xkZXIgZXhpc3RzKS5gLFxuICAgICAgKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyO1xuICB9XG5cbiAgY29uc3QgZmlsZXM6IFNjYW5uZWRGaWxlW10gPSBbXTtcbiAgbGV0IHNjYW5uZWRDb3VudCA9IDA7XG5cbiAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9uID0gbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMoKS5qb2luKFwiLCBcIik7XG4gIGNvbnNvbGUubG9nKGBbU2Nhbm5lcl0gU3VwcG9ydGVkIGV4dGVuc2lvbnM6ICR7c3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9ufWApO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoZGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGVudHJ5Lm5hbWUpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIHNjYW5uZWRDb3VudCsrO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShlbnRyeS5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChTVVBQT1JURURfRVhURU5TSU9OUy5oYXMoZXh0KSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0KGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IG1pbWVUeXBlID0gbWltZS5sb29rdXAoZnVsbFBhdGgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgcGF0aDogZnVsbFBhdGgsXG4gICAgICAgICAgICAgIG5hbWU6IGVudHJ5Lm5hbWUsXG4gICAgICAgICAgICAgIGV4dGVuc2lvbjogZXh0LFxuICAgICAgICAgICAgICBtaW1lVHlwZSxcbiAgICAgICAgICAgICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICAgICAgICAgICAgbXRpbWU6IHN0YXRzLm10aW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGlmIChvblByb2dyZXNzICYmIHNjYW5uZWRDb3VudCAlIDEwMCA9PT0gMCkge1xuICAgICAgICAgICAgb25Qcm9ncmVzcyhzY2FubmVkQ291bnQsIGZpbGVzLmxlbmd0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHNjYW5uaW5nIGRpcmVjdG9yeSAke2Rpcn06YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxuICBcbiAgYXdhaXQgd2Fsayhyb290KTtcblxuICBpZiAob25Qcm9ncmVzcykge1xuICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICB9XG4gIFxuICByZXR1cm4gZmlsZXM7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBmaWxlIHR5cGUgaXMgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N1cHBvcnRlZEZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBTVVBQT1JURURfRVhURU5TSU9OUy5oYXMoZXh0KTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSBcImNoZWVyaW9cIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIFBhcnNlIEhUTUwvSFRNIGZpbGVzIGFuZCBleHRyYWN0IHRleHQgY29udGVudFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VIVE1MKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCAkID0gY2hlZXJpby5sb2FkKGNvbnRlbnQpO1xuICAgIFxuICAgIC8vIFJlbW92ZSBzY3JpcHQgYW5kIHN0eWxlIGVsZW1lbnRzXG4gICAgJChcInNjcmlwdCwgc3R5bGUsIG5vc2NyaXB0XCIpLnJlbW92ZSgpO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgdGV4dFxuICAgIGNvbnN0IHRleHQgPSAkKFwiYm9keVwiKS50ZXh0KCkgfHwgJC50ZXh0KCk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgd2hpdGVzcGFjZVxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgSFRNTCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwZGZQYXJzZSBmcm9tIFwicGRmLXBhcnNlXCI7XG5pbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5pbXBvcnQgeyBQTkcgfSBmcm9tIFwicG5nanNcIjtcblxuY29uc3QgTUlOX1RFWFRfTEVOR1RIID0gNTA7XG5jb25zdCBPQ1JfTUFYX1BBR0VTID0gNTA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFU19QRVJfUEFHRSA9IDM7XG5jb25zdCBPQ1JfTUlOX0lNQUdFX0FSRUEgPSAxMF8wMDA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFX1BJWEVMUyA9IDUwXzAwMF8wMDA7IC8vIH43MDAweDcwMDA7IHByZXZlbnRzIGxlcHRvbmljYSBwaXhkYXRhX21hbGxvYyBjcmFzaGVzXG5jb25zdCBPQ1JfSU1BR0VfVElNRU9VVF9NUyA9IDMwXzAwMDtcblxudHlwZSBQZGZKc01vZHVsZSA9IHR5cGVvZiBpbXBvcnQoXCJwZGZqcy1kaXN0L2xlZ2FjeS9idWlsZC9wZGYubWpzXCIpO1xuXG5pbnRlcmZhY2UgRXh0cmFjdGVkT2NySW1hZ2Uge1xuICBidWZmZXI6IEJ1ZmZlcjtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIGFyZWE6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUGRmRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJwZGYubG1zdHVkaW8tZXJyb3JcIlxuICB8IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCJcbiAgfCBcInBkZi5wZGZwYXJzZS1lcnJvclwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZW1wdHlcIlxuICB8IFwicGRmLm9jci1kaXNhYmxlZFwiXG4gIHwgXCJwZGYub2NyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItcmVuZGVyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItZW1wdHlcIjtcblxudHlwZSBQZGZQYXJzZVN0YWdlID0gXCJsbXN0dWRpb1wiIHwgXCJwZGYtcGFyc2VcIiB8IFwib2NyXCI7XG5jbGFzcyBJbWFnZURhdGFUaW1lb3V0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9iaklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVGltZWQgb3V0IGZldGNoaW5nIGltYWdlIGRhdGEgZm9yICR7b2JqSWR9YCk7XG4gICAgdGhpcy5uYW1lID0gXCJJbWFnZURhdGFUaW1lb3V0RXJyb3JcIjtcbiAgfVxufVxuXG5pbnRlcmZhY2UgUGRmUGFyc2VyU3VjY2VzcyB7XG4gIHN1Y2Nlc3M6IHRydWU7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhZ2U6IFBkZlBhcnNlU3RhZ2U7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmUGFyc2VyRmFpbHVyZSB7XG4gIHN1Y2Nlc3M6IGZhbHNlO1xuICByZWFzb246IFBkZkZhaWx1cmVSZWFzb247XG4gIGRldGFpbHM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFBkZlBhcnNlclJlc3VsdCA9IFBkZlBhcnNlclN1Y2Nlc3MgfCBQZGZQYXJzZXJGYWlsdXJlO1xuXG5mdW5jdGlvbiBjbGVhblRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbnR5cGUgU3RhZ2VSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxubGV0IGNhY2hlZFBkZmpzTGliOiBQZGZKc01vZHVsZSB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBnZXRQZGZqc0xpYigpIHtcbiAgaWYgKCFjYWNoZWRQZGZqc0xpYikge1xuICAgIGNhY2hlZFBkZmpzTGliID0gYXdhaXQgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkUGRmanNMaWI7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeUxtU3R1ZGlvUGFyc2VyKGZpbGVQYXRoOiBzdHJpbmcsIGNsaWVudDogTE1TdHVkaW9DbGllbnQpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IG1heFJldHJpZXMgPSAyO1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUhhbmRsZSA9IGF3YWl0IGNsaWVudC5maWxlcy5wcmVwYXJlRmlsZShmaWxlUGF0aCk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGllbnQuZmlsZXMucGFyc2VEb2N1bWVudChmaWxlSGFuZGxlLCB7XG4gICAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMCB8fCBwcm9ncmVzcyA9PT0gMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUHJvY2Vzc2luZyAke2ZpbGVOYW1lfTogJHsocHJvZ3Jlc3MgKiAxMDApLnRvRml4ZWQoMCl9JWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgICAgc3RhZ2U6IFwibG1zdHVkaW9cIixcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUGFyc2VkIGJ1dCBnb3QgdmVyeSBsaXR0bGUgdGV4dCBmcm9tICR7ZmlsZU5hbWV9IChsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH0pLCB3aWxsIHRyeSBmYWxsYmFja3NgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCIsXG4gICAgICAgIGRldGFpbHM6IGBsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH1gLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgaXNXZWJTb2NrZXRFcnJvciA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiZcbiAgICAgICAgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJXZWJTb2NrZXRcIikgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcImNvbm5lY3Rpb24gY2xvc2VkXCIpKTtcblxuICAgICAgaWYgKGlzV2ViU29ja2V0RXJyb3IgJiYgYXR0ZW1wdCA8IG1heFJldHJpZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgV2ViU29ja2V0IGVycm9yIG9uICR7ZmlsZU5hbWV9LCByZXRyeWluZyAoJHthdHRlbXB0fS8ke21heFJldHJpZXN9KS4uLmAsXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDAgKiBhdHRlbXB0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgRXJyb3IgcGFyc2luZyBQREYgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lcnJvclwiLFxuICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogZmFsc2UsXG4gICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lcnJvclwiLFxuICAgIGRldGFpbHM6IFwiRXhjZWVkZWQgcmV0cnkgYXR0ZW1wdHNcIixcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5UGRmUGFyc2UoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBkZlBhcnNlKGJ1ZmZlcik7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dChyZXN1bHQudGV4dCB8fCBcIlwiKTtcblxuICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgU3VjY2Vzc2Z1bGx5IGV4dHJhY3RlZCB0ZXh0IGZyb20gJHtmaWxlTmFtZX1gKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgIHN0YWdlOiBcInBkZi1wYXJzZVwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgVmVyeSBsaXR0bGUgb3Igbm8gdGV4dCBleHRyYWN0ZWQgZnJvbSAke2ZpbGVOYW1lfSAobGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9KWAsXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLnBkZnBhcnNlLWVtcHR5XCIsXG4gICAgICBkZXRhaWxzOiBgbGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9YCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBFcnJvciBwYXJzaW5nIFBERiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLnBkZnBhcnNlLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlPY3JXaXRoUGRmSnMoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgbGV0IHdvcmtlcjogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVXb3JrZXI+PiB8IG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHBkZmpzTGliID0gYXdhaXQgZ2V0UGRmanNMaWIoKTtcbiAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgpKTtcbiAgICBjb25zdCBwZGZEb2N1bWVudCA9IGF3YWl0IHBkZmpzTGliXG4gICAgICAuZ2V0RG9jdW1lbnQoeyBkYXRhLCB2ZXJib3NpdHk6IHBkZmpzTGliLlZlcmJvc2l0eUxldmVsLkVSUk9SUyB9KVxuICAgICAgLnByb21pc2U7XG5cbiAgICBjb25zdCBudW1QYWdlcyA9IHBkZkRvY3VtZW50Lm51bVBhZ2VzO1xuICAgIGNvbnN0IG1heFBhZ2VzID0gTWF0aC5taW4obnVtUGFnZXMsIE9DUl9NQVhfUEFHRVMpO1xuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIFN0YXJ0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX0gLSBwYWdlcyAxIHRvICR7bWF4UGFnZXN9IChvZiAke251bVBhZ2VzfSlgLFxuICAgICk7XG5cbiAgICB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgY29uc3QgdGV4dFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCByZW5kZXJFcnJvcnMgPSAwO1xuICAgIGxldCBwcm9jZXNzZWRJbWFnZXMgPSAwO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IDE7IHBhZ2VOdW0gPD0gbWF4UGFnZXM7IHBhZ2VOdW0rKykge1xuICAgICAgbGV0IHBhZ2U7XG4gICAgICB0cnkge1xuICAgICAgICBwYWdlID0gYXdhaXQgcGRmRG9jdW1lbnQuZ2V0UGFnZShwYWdlTnVtKTtcbiAgICAgICAgY29uc3QgaW1hZ2VzID0gYXdhaXQgZXh0cmFjdEltYWdlc0ZvclBhZ2UocGRmanNMaWIsIHBhZ2UpO1xuICAgICAgICBpZiAoaW1hZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSAke2ZpbGVOYW1lfSAtIHBhZ2UgJHtwYWdlTnVtfSBjb250YWlucyBubyBleHRyYWN0YWJsZSBpbWFnZXMsIHNraXBwaW5nYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRJbWFnZXMgPSBpbWFnZXMuc2xpY2UoMCwgT0NSX01BWF9JTUFHRVNfUEVSX1BBR0UpO1xuICAgICAgICBmb3IgKGNvbnN0IGltYWdlIG9mIHNlbGVjdGVkSW1hZ2VzKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgICAgZGF0YTogeyB0ZXh0IH0sXG4gICAgICAgICAgICB9ID0gYXdhaXQgd29ya2VyLnJlY29nbml6ZShpbWFnZS5idWZmZXIpO1xuICAgICAgICAgICAgcHJvY2Vzc2VkSW1hZ2VzKys7XG4gICAgICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHRleHQgfHwgXCJcIik7XG4gICAgICAgICAgICBpZiAoY2xlYW5lZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKGNsZWFuZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2ggKHJlY29nbml6ZUVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlY29nbml6ZSBpbWFnZSAoJHtpbWFnZS53aWR0aH14JHtpbWFnZS5oZWlnaHR9KSBvbiBwYWdlICR7cGFnZU51bX0gb2YgJHtmaWxlTmFtZX06YCxcbiAgICAgICAgICAgICAgcmVjb2duaXplRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IHJlY29nbml6ZUVycm9yLm1lc3NhZ2UgOiByZWNvZ25pemVFcnJvcixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICAvLyBUaGUgd29ya2VyIG1heSBoYXZlIGNyYXNoZWQ7IHRyeSB0byByZWNyZWF0ZSBpdCBmb3IgcmVtYWluaW5nIGltYWdlc1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIHdvcmtlciBhbHJlYWR5IGRlYWQsIGlnbm9yZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgICAgICAgICAgfSBjYXRjaCAocmVjcmVhdGVFcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlY3JlYXRlIE9DUiB3b3JrZXIsIGFib3J0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX1gLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICB3b3JrZXIgPSBudWxsO1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICAgICAgICAgICAgZGV0YWlsczogYFdvcmtlciBjcmFzaGVkIGFuZCBjb3VsZCBub3QgYmUgcmVjcmVhdGVkOiAke1xuICAgICAgICAgICAgICAgICAgcmVjcmVhdGVFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gcmVjcmVhdGVFcnJvci5tZXNzYWdlIDogU3RyaW5nKHJlY3JlYXRlRXJyb3IpXG4gICAgICAgICAgICAgICAgfWAsXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2VOdW0gPT09IDEgfHwgcGFnZU51bSAlIDEwID09PSAwIHx8IHBhZ2VOdW0gPT09IG1heFBhZ2VzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpICR7ZmlsZU5hbWV9IC0gcHJvY2Vzc2VkIHBhZ2UgJHtwYWdlTnVtfS8ke21heFBhZ2VzfSAoaW1hZ2VzPSR7cHJvY2Vzc2VkSW1hZ2VzfSwgY2hhcnM9JHt0ZXh0UGFydHMuam9pbihcbiAgICAgICAgICAgICAgXCJcXG5cXG5cIixcbiAgICAgICAgICAgICkubGVuZ3RofSlgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKHBhZ2VFcnJvcikge1xuICAgICAgICBpZiAocGFnZUVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgQWJvcnRpbmcgT0NSIGZvciAke2ZpbGVOYW1lfTogJHtwYWdlRXJyb3IubWVzc2FnZX1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgIHdvcmtlciA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgICAgICAgIGRldGFpbHM6IHBhZ2VFcnJvci5tZXNzYWdlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRXJyb3JzKys7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBFcnJvciBwcm9jZXNzaW5nIHBhZ2UgJHtwYWdlTnVtfSBvZiAke2ZpbGVOYW1lfTpgLFxuICAgICAgICAgIHBhZ2VFcnJvcixcbiAgICAgICAgKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGF3YWl0IHBhZ2U/LmNsZWFudXAoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAod29ya2VyKSB7XG4gICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgfVxuICAgIHdvcmtlciA9IG51bGw7XG5cbiAgICBjb25zdCBmdWxsVGV4dCA9IGNsZWFuVGV4dCh0ZXh0UGFydHMuam9pbihcIlxcblxcblwiKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIENvbXBsZXRlZCBPQ1IgZm9yICR7ZmlsZU5hbWV9LCBleHRyYWN0ZWQgJHtmdWxsVGV4dC5sZW5ndGh9IGNoYXJhY3RlcnNgLFxuICAgICk7XG5cbiAgICBpZiAoZnVsbFRleHQubGVuZ3RoID49IE1JTl9URVhUX0xFTkdUSCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdGV4dDogZnVsbFRleHQsXG4gICAgICAgIHN0YWdlOiBcIm9jclwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAocmVuZGVyRXJyb3JzID4gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYub2NyLXJlbmRlci1lcnJvclwiLFxuICAgICAgICBkZXRhaWxzOiBgJHtyZW5kZXJFcnJvcnN9IHBhZ2UgcmVuZGVyIGVycm9yc2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVtcHR5XCIsXG4gICAgICBkZXRhaWxzOiBcIk9DUiBwcm9kdWNlZCBpbnN1ZmZpY2llbnQgdGV4dFwiLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChPQ1IpIEVycm9yIGR1cmluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHdvcmtlcikge1xuICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0SW1hZ2VzRm9yUGFnZShwZGZqc0xpYjogUGRmSnNNb2R1bGUsIHBhZ2U6IGFueSk6IFByb21pc2U8RXh0cmFjdGVkT2NySW1hZ2VbXT4ge1xuICBjb25zdCBvcGVyYXRvckxpc3QgPSBhd2FpdCBwYWdlLmdldE9wZXJhdG9yTGlzdCgpO1xuICBjb25zdCBpbWFnZXM6IEV4dHJhY3RlZE9jckltYWdlW10gPSBbXTtcbiAgY29uc3QgaW1hZ2VEYXRhQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxhbnkgfCBudWxsPj4oKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG9wZXJhdG9yTGlzdC5mbkFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZm4gPSBvcGVyYXRvckxpc3QuZm5BcnJheVtpXTtcbiAgICBjb25zdCBhcmdzID0gb3BlcmF0b3JMaXN0LmFyZ3NBcnJheVtpXTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoZm4gPT09IHBkZmpzTGliLk9QUy5wYWludEltYWdlWE9iamVjdCB8fCBmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0UmVwZWF0KSB7XG4gICAgICAgIGNvbnN0IG9iaklkID0gYXJncz8uWzBdO1xuICAgICAgICBpZiAodHlwZW9mIG9iaklkICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGltZ0RhdGE7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaW1nRGF0YSA9IGF3YWl0IHJlc29sdmVJbWFnZURhdGEocGFnZSwgb2JqSWQsIGltYWdlRGF0YUNhY2hlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlc29sdmUgaW1hZ2UgZGF0YTpcIiwgZXJyb3IpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaW1nRGF0YSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRJbWFnZURhdGFUb1BuZyhwZGZqc0xpYiwgaW1nRGF0YSk7XG4gICAgICAgIGlmIChjb252ZXJ0ZWQpIHtcbiAgICAgICAgICBpbWFnZXMucHVzaChjb252ZXJ0ZWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbmxpbmVJbWFnZVhPYmplY3QgJiYgYXJncz8uWzBdKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRJbWFnZURhdGFUb1BuZyhwZGZqc0xpYiwgYXJnc1swXSk7XG4gICAgICAgIGlmIChjb252ZXJ0ZWQpIHtcbiAgICAgICAgICBpbWFnZXMucHVzaChjb252ZXJ0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybihcIltQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gZXh0cmFjdCBpbmxpbmUgaW1hZ2U6XCIsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW1hZ2VzXG4gICAgLmZpbHRlcigoaW1hZ2UpID0+IHtcbiAgICAgIGlmIChpbWFnZS5hcmVhIDwgT0NSX01JTl9JTUFHRV9BUkVBKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoaW1hZ2UuYXJlYSA+IE9DUl9NQVhfSU1BR0VfUElYRUxTKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIFNraXBwaW5nIG92ZXJzaXplZCBpbWFnZSAoJHtpbWFnZS53aWR0aH14JHtpbWFnZS5oZWlnaHR9ID0gJHtpbWFnZS5hcmVhLnRvTG9jYWxlU3RyaW5nKCl9IHBpeGVscykgdG8gYXZvaWQgbWVtb3J5IGFsbG9jYXRpb24gZmFpbHVyZWAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuYXJlYSAtIGEuYXJlYSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVJbWFnZURhdGEoXG4gIHBhZ2U6IGFueSxcbiAgb2JqSWQ6IHN0cmluZyxcbiAgY2FjaGU6IE1hcDxzdHJpbmcsIFByb21pc2U8YW55IHwgbnVsbD4+LFxuKTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XG4gIGlmIChjYWNoZS5oYXMob2JqSWQpKSB7XG4gICAgcmV0dXJuIGNhY2hlLmdldChvYmpJZCkhO1xuICB9XG5cbiAgY29uc3QgcHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgcGFnZS5vYmpzLmhhcyA9PT0gXCJmdW5jdGlvblwiICYmIHBhZ2Uub2Jqcy5oYXMob2JqSWQpKSB7XG4gICAgICAgIHJldHVybiBwYWdlLm9ianMuZ2V0KG9iaklkKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIGZhbGwgdGhyb3VnaCB0byBhc3luYyBwYXRoXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgICBsZXQgdGltZW91dEhhbmRsZTogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRpbWVvdXRIYW5kbGUpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgdGltZW91dEhhbmRsZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGhhbmRsZURhdGEgPSAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBwYWdlLm9ianMuZ2V0KG9iaklkLCBoYW5kbGVEYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShPQ1JfSU1BR0VfVElNRU9VVF9NUykgJiYgT0NSX0lNQUdFX1RJTUVPVVRfTVMgPiAwKSB7XG4gICAgICAgIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBpZiAoIXNldHRsZWQpIHtcbiAgICAgICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBJbWFnZURhdGFUaW1lb3V0RXJyb3Iob2JqSWQpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIE9DUl9JTUFHRV9USU1FT1VUX01TKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSkoKTtcblxuICBjYWNoZS5zZXQob2JqSWQsIHByb21pc2UpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltYWdlRGF0YVRvUG5nKFxuICBwZGZqc0xpYjogUGRmSnNNb2R1bGUsXG4gIGltZ0RhdGE6IGFueSxcbik6IEV4dHJhY3RlZE9jckltYWdlIHwgbnVsbCB7XG4gIGlmICghaW1nRGF0YSB8fCB0eXBlb2YgaW1nRGF0YS53aWR0aCAhPT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgaW1nRGF0YS5oZWlnaHQgIT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHsgd2lkdGgsIGhlaWdodCwga2luZCwgZGF0YSB9ID0gaW1nRGF0YTtcbiAgaWYgKCFkYXRhKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBwbmcgPSBuZXcgUE5HKHsgd2lkdGgsIGhlaWdodCB9KTtcbiAgY29uc3QgZGVzdCA9IHBuZy5kYXRhO1xuXG4gIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuUkdCQV8zMkJQUCAmJiBkYXRhLmxlbmd0aCA9PT0gd2lkdGggKiBoZWlnaHQgKiA0KSB7XG4gICAgZGVzdC5zZXQoQnVmZmVyLmZyb20oZGF0YSkpO1xuICB9IGVsc2UgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5SR0JfMjRCUFAgJiYgZGF0YS5sZW5ndGggPT09IHdpZHRoICogaGVpZ2h0ICogMykge1xuICAgIGNvbnN0IHNyYyA9IGRhdGEgYXMgVWludDhBcnJheTtcbiAgICBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpICs9IDMsIGogKz0gNCkge1xuICAgICAgZGVzdFtqXSA9IHNyY1tpXTtcbiAgICAgIGRlc3RbaiArIDFdID0gc3JjW2kgKyAxXTtcbiAgICAgIGRlc3RbaiArIDJdID0gc3JjW2kgKyAyXTtcbiAgICAgIGRlc3RbaiArIDNdID0gMjU1O1xuICAgIH1cbiAgfSBlbHNlIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuR1JBWVNDQUxFXzFCUFApIHtcbiAgICBsZXQgcGl4ZWxJbmRleCA9IDA7XG4gICAgY29uc3QgdG90YWxQaXhlbHMgPSB3aWR0aCAqIGhlaWdodDtcbiAgICBmb3IgKGxldCBieXRlSW5kZXggPSAwOyBieXRlSW5kZXggPCBkYXRhLmxlbmd0aCAmJiBwaXhlbEluZGV4IDwgdG90YWxQaXhlbHM7IGJ5dGVJbmRleCsrKSB7XG4gICAgICBjb25zdCBieXRlID0gZGF0YVtieXRlSW5kZXhdO1xuICAgICAgZm9yIChsZXQgYml0ID0gNzsgYml0ID49IDAgJiYgcGl4ZWxJbmRleCA8IHRvdGFsUGl4ZWxzOyBiaXQtLSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IChieXRlID4+IGJpdCkgJiAxID8gMjU1IDogMDtcbiAgICAgICAgY29uc3QgZGVzdEluZGV4ID0gcGl4ZWxJbmRleCAqIDQ7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4XSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDFdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgMl0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAzXSA9IDI1NTtcbiAgICAgICAgcGl4ZWxJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYnVmZmVyOiBQTkcuc3luYy53cml0ZShwbmcpLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBhcmVhOiB3aWR0aCAqIGhlaWdodCxcbiAgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBQREYgZmlsZXMgd2l0aCBhIG11bHRpLXN0YWdlIHN0cmF0ZWd5OlxuICogMS4gVXNlIExNIFN0dWRpbydzIGJ1aWx0LWluIGRvY3VtZW50IHBhcnNlciAoZmFzdCwgc2VydmVyLXNpZGUsIG1heSBpbmNsdWRlIE9DUilcbiAqIDIuIEZhbGxiYWNrIHRvIGxvY2FsIHBkZi1wYXJzZSBmb3IgdGV4dC1iYXNlZCBQREZzXG4gKiAzLiBJZiBzdGlsbCBubyB0ZXh0IGFuZCBPQ1IgaXMgZW5hYmxlZCwgZmFsbGJhY2sgdG8gUERGLmpzICsgVGVzc2VyYWN0IE9DUlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VQREYoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQsXG4gIGVuYWJsZU9DUjogYm9vbGVhbixcbik6IFByb21pc2U8UGRmUGFyc2VyUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIC8vIDEpIExNIFN0dWRpbyBwYXJzZXJcbiAgY29uc3QgbG1TdHVkaW9SZXN1bHQgPSBhd2FpdCB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aCwgY2xpZW50KTtcbiAgaWYgKGxtU3R1ZGlvUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gbG1TdHVkaW9SZXN1bHQ7XG4gIH1cbiAgbGV0IGxhc3RGYWlsdXJlOiBQZGZQYXJzZXJGYWlsdXJlID0gbG1TdHVkaW9SZXN1bHQ7XG5cbiAgLy8gMikgTG9jYWwgcGRmLXBhcnNlIGZhbGxiYWNrXG4gIGNvbnN0IHBkZlBhcnNlUmVzdWx0ID0gYXdhaXQgdHJ5UGRmUGFyc2UoZmlsZVBhdGgpO1xuICBpZiAocGRmUGFyc2VSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBwZGZQYXJzZVJlc3VsdDtcbiAgfVxuICBsYXN0RmFpbHVyZSA9IHBkZlBhcnNlUmVzdWx0O1xuXG4gIC8vIDMpIE9DUiBmYWxsYmFjayAob25seSBpZiBlbmFibGVkKVxuICBpZiAoIWVuYWJsZU9DUikge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBFbmFibGUgT0NSIGlzIG9mZiwgc2tpcHBpbmcgT0NSIGZhbGxiYWNrIGZvciAke2ZpbGVOYW1lfSBhZnRlciBvdGhlciBtZXRob2RzIHJldHVybmVkIG5vIHRleHRgLFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZGlzYWJsZWRcIixcbiAgICAgIGRldGFpbHM6IGBQcmV2aW91cyBmYWlsdXJlIHJlYXNvbjogJHtsYXN0RmFpbHVyZS5yZWFzb259YCxcbiAgICB9O1xuICB9XG5cbiAgY29uc29sZS5sb2coXG4gICAgYFtQREYgUGFyc2VyXSAoT0NSKSBObyB0ZXh0IGV4dHJhY3RlZCBmcm9tICR7ZmlsZU5hbWV9IHdpdGggTE0gU3R1ZGlvIG9yIHBkZi1wYXJzZSwgYXR0ZW1wdGluZyBPQ1IuLi5gLFxuICApO1xuXG4gIGNvbnN0IG9jclJlc3VsdCA9IGF3YWl0IHRyeU9jcldpdGhQZGZKcyhmaWxlUGF0aCk7XG4gIGlmIChvY3JSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBvY3JSZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gb2NyUmVzdWx0O1xufVxuXG4iLCAiLy8gQHRzLWlnbm9yZSAtIGVwdWIyIGRvZXNuJ3QgaGF2ZSBjb21wbGV0ZSB0eXBlc1xuaW1wb3J0IHsgRVB1YiB9IGZyb20gXCJlcHViMlwiO1xuXG4vKipcbiAqIFBhcnNlIEVQVUIgZmlsZXMgYW5kIGV4dHJhY3QgdGV4dCBjb250ZW50XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUVQVUIoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVwdWIgPSBuZXcgRVB1YihmaWxlUGF0aCk7XG4gICAgICBcbiAgICAgIGVwdWIub24oXCJlcnJvclwiLCAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgRVBVQiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBzdHJpcEh0bWwgPSAoaW5wdXQ6IHN0cmluZykgPT5cbiAgICAgICAgaW5wdXQucmVwbGFjZSgvPFtePl0qPi9nLCBcIiBcIik7XG5cbiAgICAgIGNvbnN0IGdldE1hbmlmZXN0RW50cnkgPSAoY2hhcHRlcklkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIChlcHViIGFzIHVua25vd24gYXMgeyBtYW5pZmVzdD86IFJlY29yZDxzdHJpbmcsIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+IH0pLm1hbmlmZXN0Py5bY2hhcHRlcklkXTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGRlY29kZU1lZGlhVHlwZSA9IChlbnRyeT86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0pID0+XG4gICAgICAgIGVudHJ5Py5bXCJtZWRpYS10eXBlXCJdIHx8IGVudHJ5Py5tZWRpYVR5cGUgfHwgXCJcIjtcblxuICAgICAgY29uc3Qgc2hvdWxkUmVhZFJhdyA9IChtZWRpYVR5cGU6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbWVkaWFUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiYXBwbGljYXRpb24veGh0bWwreG1sXCIgfHwgbm9ybWFsaXplZCA9PT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKFwidGV4dC9cIikpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwiaHRtbFwiKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZWFkQ2hhcHRlciA9IGFzeW5jIChjaGFwdGVySWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBnZXRNYW5pZmVzdEVudHJ5KGNoYXB0ZXJJZCk7XG4gICAgICAgIGlmICghbWFuaWZlc3RFbnRyeSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihgRVBVQiBjaGFwdGVyICR7Y2hhcHRlcklkfSBtaXNzaW5nIG1hbmlmZXN0IGVudHJ5IGluICR7ZmlsZVBhdGh9LCBza2lwcGluZ2ApO1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVkaWFUeXBlID0gZGVjb2RlTWVkaWFUeXBlKG1hbmlmZXN0RW50cnkpO1xuICAgICAgICBpZiAoc2hvdWxkUmVhZFJhdyhtZWRpYVR5cGUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgICAgZXB1Yi5nZXRGaWxlKFxuICAgICAgICAgICAgICBjaGFwdGVySWQsXG4gICAgICAgICAgICAgIChlcnJvcjogRXJyb3IgfCBudWxsLCBkYXRhPzogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICByZWooZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgIHJlcyhcIlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmVzKHN0cmlwSHRtbChkYXRhLnRvU3RyaW5nKFwidXRmLThcIikpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgZXB1Yi5nZXRDaGFwdGVyKFxuICAgICAgICAgICAgY2hhcHRlcklkLFxuICAgICAgICAgICAgKGVycm9yOiBFcnJvciB8IG51bGwsIHRleHQ/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqKGVycm9yKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGV4dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJlcyhzdHJpcEh0bWwodGV4dCkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyhcIlwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZXB1Yi5vbihcImVuZFwiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2hhcHRlcnMgPSBlcHViLmZsb3c7XG4gICAgICAgICAgY29uc3QgdGV4dFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgIFxuICAgICAgICAgIGZvciAoY29uc3QgY2hhcHRlciBvZiBjaGFwdGVycykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgY2hhcHRlcklkID0gY2hhcHRlci5pZDtcbiAgICAgICAgICAgICAgaWYgKCFjaGFwdGVySWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEVQVUIgY2hhcHRlciBtaXNzaW5nIGlkIGluICR7ZmlsZVBhdGh9LCBza2lwcGluZ2ApO1xuICAgICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlYWRDaGFwdGVyKGNoYXB0ZXJJZCk7XG4gICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoY2hhcHRlckVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlYWRpbmcgY2hhcHRlciAke2NoYXB0ZXIuaWR9OmAsIGNoYXB0ZXJFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGZ1bGxUZXh0ID0gdGV4dFBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG4gICAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICAgIGZ1bGxUZXh0XG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIEVQVUIgY2hhcHRlcnM6YCwgZXJyb3IpO1xuICAgICAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBlcHViLnBhcnNlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluaXRpYWxpemluZyBFUFVCIHBhcnNlciBmb3IgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICB9XG4gIH0pO1xufVxuXG4iLCAiaW1wb3J0IHsgY3JlYXRlV29ya2VyIH0gZnJvbSBcInRlc3NlcmFjdC5qc1wiO1xuXG4vKipcbiAqIFBhcnNlIGltYWdlIGZpbGVzIHVzaW5nIE9DUiAoVGVzc2VyYWN0KVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VJbWFnZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgXG4gICAgY29uc3QgeyBkYXRhOiB7IHRleHQgfSB9ID0gYXdhaXQgd29ya2VyLnJlY29nbml6ZShmaWxlUGF0aCk7XG4gICAgXG4gICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIFxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlVGV4dE9wdGlvbnMge1xuICBzdHJpcE1hcmtkb3duPzogYm9vbGVhbjtcbiAgcHJlc2VydmVMaW5lQnJlYWtzPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQYXJzZSBwbGFpbiB0ZXh0IGZpbGVzICh0eHQsIG1kIGFuZCByZWxhdGVkIGZvcm1hdHMpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZVRleHQoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFBhcnNlVGV4dE9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgc3RyaXBNYXJrZG93biA9IGZhbHNlLCBwcmVzZXJ2ZUxpbmVCcmVha3MgPSBmYWxzZSB9ID0gb3B0aW9ucztcblxuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplTGluZUVuZGluZ3MoY29udGVudCk7XG5cbiAgICBjb25zdCBzdHJpcHBlZCA9IHN0cmlwTWFya2Rvd24gPyBzdHJpcE1hcmtkb3duU3ludGF4KG5vcm1hbGl6ZWQpIDogbm9ybWFsaXplZDtcblxuICAgIHJldHVybiAocHJlc2VydmVMaW5lQnJlYWtzID8gY29sbGFwc2VXaGl0ZXNwYWNlQnV0S2VlcExpbmVzKHN0cmlwcGVkKSA6IGNvbGxhcHNlV2hpdGVzcGFjZShzdHJpcHBlZCkpLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIHRleHQgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGluZUVuZGluZ3MoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlQnV0S2VlcExpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGlucHV0XG4gICAgICAvLyBUcmltIHRyYWlsaW5nIHdoaXRlc3BhY2UgcGVyIGxpbmVcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rXFxuL2csIFwiXFxuXCIpXG4gICAgICAvLyBDb2xsYXBzZSBtdWx0aXBsZSBibGFuayBsaW5lcyBidXQga2VlcCBwYXJhZ3JhcGggc2VwYXJhdGlvblxuICAgICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAgIC8vIENvbGxhcHNlIGludGVybmFsIHNwYWNlcy90YWJzXG4gICAgICAucmVwbGFjZSgvWyBcXHRdezIsfS9nLCBcIiBcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gc3RyaXBNYXJrZG93blN5bnRheChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG91dHB1dCA9IGlucHV0O1xuXG4gIC8vIFJlbW92ZSBmZW5jZWQgY29kZSBibG9ja3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL2BgYFtcXHNcXFNdKj9gYGAvZywgXCIgXCIpO1xuICAvLyBSZW1vdmUgaW5saW5lIGNvZGVcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL2AoW15gXSspYC9nLCBcIiQxXCIpO1xuICAvLyBSZXBsYWNlIGltYWdlcyB3aXRoIGFsdCB0ZXh0XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8hXFxbKFteXFxdXSopXFxdXFwoW14pXSpcXCkvZywgXCIkMSBcIik7XG4gIC8vIFJlcGxhY2UgbGlua3Mgd2l0aCBsaW5rIHRleHRcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL1xcWyhbXlxcXV0rKVxcXVxcKFteKV0qXFwpL2csIFwiJDFcIik7XG4gIC8vIFJlbW92ZSBlbXBoYXNpcyBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8oXFwqXFwqfF9fKSguKj8pXFwxL2csIFwiJDJcIik7XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8oXFwqfF8pKC4qPylcXDEvZywgXCIkMlwiKTtcbiAgLy8gUmVtb3ZlIGhlYWRpbmdzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30jezEsNn1cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIGJsb2NrIHF1b3Rlc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9Plxccz8vZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgdW5vcmRlcmVkIGxpc3QgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9Wy0qK11cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIG9yZGVyZWQgbGlzdCBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM31cXGQrW1xcLlxcKV1cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIGhvcml6b250YWwgcnVsZXNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfShbLSpfXVxccz8pezMsfSQvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgcmVzaWR1YWwgSFRNTCB0YWdzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC88W14+XSs+L2csIFwiIFwiKTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4iLCAiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcGFyc2VIVE1MIH0gZnJvbSBcIi4vaHRtbFBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VQREYsIHR5cGUgUGRmRmFpbHVyZVJlYXNvbiB9IGZyb20gXCIuL3BkZlBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VFUFVCIH0gZnJvbSBcIi4vZXB1YlBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VJbWFnZSB9IGZyb20gXCIuL2ltYWdlUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZVRleHQgfSBmcm9tIFwiLi90ZXh0UGFyc2VyXCI7XG5pbXBvcnQgeyB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7XG4gIElNQUdFX0VYVEVOU0lPTl9TRVQsXG4gIGlzSHRtbEV4dGVuc2lvbixcbiAgaXNNYXJrZG93bkV4dGVuc2lvbixcbiAgaXNQbGFpblRleHRFeHRlbnNpb24sXG4gIGlzVGV4dHVhbEV4dGVuc2lvbixcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWREb2N1bWVudCB7XG4gIHRleHQ6IHN0cmluZztcbiAgbWV0YWRhdGE6IHtcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xuICAgIGZpbGVOYW1lOiBzdHJpbmc7XG4gICAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gICAgcGFyc2VkQXQ6IERhdGU7XG4gIH07XG59XG5cbmV4cG9ydCB0eXBlIFBhcnNlRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIlxuICB8IFwicGRmLm1pc3NpbmctY2xpZW50XCJcbiAgfCBQZGZGYWlsdXJlUmVhc29uXG4gIHwgXCJlcHViLmVtcHR5XCJcbiAgfCBcImh0bWwuZW1wdHlcIlxuICB8IFwiaHRtbC5lcnJvclwiXG4gIHwgXCJ0ZXh0LmVtcHR5XCJcbiAgfCBcInRleHQuZXJyb3JcIlxuICB8IFwiaW1hZ2Uub2NyLWRpc2FibGVkXCJcbiAgfCBcImltYWdlLmVtcHR5XCJcbiAgfCBcImltYWdlLmVycm9yXCJcbiAgfCBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCI7XG5cbmV4cG9ydCB0eXBlIERvY3VtZW50UGFyc2VSZXN1bHQgPVxuICB8IHsgc3VjY2VzczogdHJ1ZTsgZG9jdW1lbnQ6IFBhcnNlZERvY3VtZW50IH1cbiAgfCB7IHN1Y2Nlc3M6IGZhbHNlOyByZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbjsgZGV0YWlscz86IHN0cmluZyB9O1xuXG4vKipcbiAqIFBhcnNlIGEgZG9jdW1lbnQgZmlsZSBiYXNlZCBvbiBpdHMgZXh0ZW5zaW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZURvY3VtZW50KFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBlbmFibGVPQ1I6IGJvb2xlYW4gPSBmYWxzZSxcbiAgY2xpZW50PzogTE1TdHVkaW9DbGllbnQsXG4pOiBQcm9taXNlPERvY3VtZW50UGFyc2VSZXN1bHQ+IHtcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpO1xuXG4gIGNvbnN0IGJ1aWxkU3VjY2VzcyA9ICh0ZXh0OiBzdHJpbmcpOiBEb2N1bWVudFBhcnNlUmVzdWx0ID0+ICh7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkb2N1bWVudDoge1xuICAgICAgdGV4dCxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgZXh0ZW5zaW9uOiBleHQsXG4gICAgICAgIHBhcnNlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICB0cnkge1xuICAgIGlmIChpc0h0bWxFeHRlbnNpb24oZXh0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGNsZWFuQW5kVmFsaWRhdGUoXG4gICAgICAgICAgYXdhaXQgcGFyc2VIVE1MKGZpbGVQYXRoKSxcbiAgICAgICAgICBcImh0bWwuZW1wdHlcIixcbiAgICAgICAgICBgJHtmaWxlTmFtZX0gaHRtbGAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0ZXh0LnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3ModGV4dC52YWx1ZSkgOiB0ZXh0O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bSFRNTF0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcImh0bWwuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIucGRmXCIpIHtcbiAgICAgIGlmICghY2xpZW50KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW1BhcnNlcl0gTm8gTE0gU3R1ZGlvIGNsaWVudCBhdmFpbGFibGUgZm9yIFBERiBwYXJzaW5nOiAke2ZpbGVOYW1lfWApO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInBkZi5taXNzaW5nLWNsaWVudFwiIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwZGZSZXN1bHQgPSBhd2FpdCBwYXJzZVBERihmaWxlUGF0aCwgY2xpZW50LCBlbmFibGVPQ1IpO1xuICAgICAgaWYgKHBkZlJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiBidWlsZFN1Y2Nlc3MocGRmUmVzdWx0LnRleHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBkZlJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5lcHViXCIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZUVQVUIoZmlsZVBhdGgpO1xuICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJlcHViLmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgIH1cblxuICAgIGlmIChpc1RleHR1YWxFeHRlbnNpb24oZXh0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlVGV4dChmaWxlUGF0aCwge1xuICAgICAgICAgIHN0cmlwTWFya2Rvd246IGlzTWFya2Rvd25FeHRlbnNpb24oZXh0KSxcbiAgICAgICAgICBwcmVzZXJ2ZUxpbmVCcmVha3M6IGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dCksXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcInRleHQuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW1RleHRdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJ0ZXh0LmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChJTUFHRV9FWFRFTlNJT05fU0VULmhhcyhleHQpKSB7XG4gICAgICBpZiAoIWVuYWJsZU9DUikge1xuICAgICAgICBjb25zb2xlLmxvZyhgU2tpcHBpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofSAoT0NSIGRpc2FibGVkKWApO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcImltYWdlLm9jci1kaXNhYmxlZFwiIH07XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VJbWFnZShmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwiaW1hZ2UuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW0ltYWdlXSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwiaW1hZ2UuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIucmFyXCIpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBSQVIgZmlsZXMgbm90IHlldCBzdXBwb3J0ZWQ6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiLCBkZXRhaWxzOiBcIi5yYXJcIiB9O1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBVbnN1cHBvcnRlZCBmaWxlIHR5cGU6ICR7ZmlsZVBhdGh9YCk7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIiwgZGV0YWlsczogZXh0IH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBkb2N1bWVudCAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfVxufVxuXG50eXBlIENsZWFuUmVzdWx0ID1cbiAgfCB7IHN1Y2Nlc3M6IHRydWU7IHZhbHVlOiBzdHJpbmcgfVxuICB8IHsgc3VjY2VzczogZmFsc2U7IHJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uOyBkZXRhaWxzPzogc3RyaW5nIH07XG5cbmZ1bmN0aW9uIGNsZWFuQW5kVmFsaWRhdGUoXG4gIHRleHQ6IHN0cmluZyxcbiAgZW1wdHlSZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbixcbiAgZGV0YWlsc0NvbnRleHQ/OiBzdHJpbmcsXG4pOiBDbGVhblJlc3VsdCB7XG4gIGNvbnN0IGNsZWFuZWQgPSB0ZXh0Py50cmltKCkgPz8gXCJcIjtcbiAgaWYgKGNsZWFuZWQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBlbXB0eVJlYXNvbixcbiAgICAgIGRldGFpbHM6IGRldGFpbHNDb250ZXh0ID8gYCR7ZGV0YWlsc0NvbnRleHR9IHRyaW1tZWQgdG8gemVybyBsZW5ndGhgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgdmFsdWU6IGNsZWFuZWQgfTtcbn1cblxuIiwgIi8qKlxuICogU2ltcGxlIHRleHQgY2h1bmtlciB0aGF0IHNwbGl0cyB0ZXh0IGludG8gb3ZlcmxhcHBpbmcgY2h1bmtzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaHVua1RleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgY2h1bmtTaXplOiBudW1iZXIsXG4gIG92ZXJsYXA6IG51bWJlcixcbik6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBzdGFydEluZGV4OiBudW1iZXI7IGVuZEluZGV4OiBudW1iZXIgfT4ge1xuICBjb25zdCBjaHVua3M6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBzdGFydEluZGV4OiBudW1iZXI7IGVuZEluZGV4OiBudW1iZXIgfT4gPSBbXTtcbiAgXG4gIC8vIFNpbXBsZSB3b3JkLWJhc2VkIGNodW5raW5nXG4gIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgvXFxzKy8pO1xuICBcbiAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBjaHVua3M7XG4gIH1cbiAgXG4gIGxldCBzdGFydElkeCA9IDA7XG4gIFxuICB3aGlsZSAoc3RhcnRJZHggPCB3b3Jkcy5sZW5ndGgpIHtcbiAgICBjb25zdCBlbmRJZHggPSBNYXRoLm1pbihzdGFydElkeCArIGNodW5rU2l6ZSwgd29yZHMubGVuZ3RoKTtcbiAgICBjb25zdCBjaHVua1dvcmRzID0gd29yZHMuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XG4gICAgY29uc3QgY2h1bmtUZXh0ID0gY2h1bmtXb3Jkcy5qb2luKFwiIFwiKTtcbiAgICBcbiAgICBjaHVua3MucHVzaCh7XG4gICAgICB0ZXh0OiBjaHVua1RleHQsXG4gICAgICBzdGFydEluZGV4OiBzdGFydElkeCxcbiAgICAgIGVuZEluZGV4OiBlbmRJZHgsXG4gICAgfSk7XG4gICAgXG4gICAgLy8gTW92ZSBmb3J3YXJkIGJ5IChjaHVua1NpemUgLSBvdmVybGFwKSB0byBjcmVhdGUgb3ZlcmxhcHBpbmcgY2h1bmtzXG4gICAgc3RhcnRJZHggKz0gTWF0aC5tYXgoMSwgY2h1bmtTaXplIC0gb3ZlcmxhcCk7XG4gICAgXG4gICAgLy8gQnJlYWsgaWYgd2UndmUgcmVhY2hlZCB0aGUgZW5kXG4gICAgaWYgKGVuZElkeCA+PSB3b3Jkcy5sZW5ndGgpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGNodW5rcztcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSB0b2tlbiBjb3VudCAocm91Z2ggYXBwcm94aW1hdGlvbjogMSB0b2tlbiBcdTIyNDggNCBjaGFyYWN0ZXJzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXN0aW1hdGVUb2tlbkNvdW50KHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyA0KTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBDYWxjdWxhdGUgU0hBLTI1NiBoYXNoIG9mIGEgZmlsZSBmb3IgY2hhbmdlIGRldGVjdGlvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xuICAgIFxuICAgIHN0cmVhbS5vbihcImRhdGFcIiwgKGRhdGEpID0+IGhhc2gudXBkYXRlKGRhdGEpKTtcbiAgICBzdHJlYW0ub24oXCJlbmRcIiwgKCkgPT4gcmVzb2x2ZShoYXNoLmRpZ2VzdChcImhleFwiKSkpO1xuICAgIHN0cmVhbS5vbihcImVycm9yXCIsIHJlamVjdCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEdldCBmaWxlIG1ldGFkYXRhIGluY2x1ZGluZyBzaXplIGFuZCBtb2RpZmljYXRpb24gdGltZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RmlsZU1ldGFkYXRhKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgc2l6ZTogbnVtYmVyO1xuICBtdGltZTogRGF0ZTtcbiAgaGFzaDogc3RyaW5nO1xufT4ge1xuICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZmlsZVBhdGgpO1xuICBjb25zdCBoYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGgpO1xuICBcbiAgcmV0dXJuIHtcbiAgICBzaXplOiBzdGF0cy5zaXplLFxuICAgIG10aW1lOiBzdGF0cy5tdGltZSxcbiAgICBoYXNoLFxuICB9O1xufVxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzL3Byb21pc2VzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbmludGVyZmFjZSBGYWlsZWRGaWxlRW50cnkge1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICByZWFzb246IHN0cmluZztcbiAgdGltZXN0YW1wOiBzdHJpbmc7XG59XG5cbi8qKlxuICogVHJhY2tzIGZpbGVzIHRoYXQgZmFpbGVkIGluZGV4aW5nIGZvciBhIGdpdmVuIGhhc2ggc28gd2UgY2FuIHNraXAgdGhlbVxuICogd2hlbiBhdXRvLXJlaW5kZXhpbmcgdW5jaGFuZ2VkIGRhdGEuXG4gKi9cbmV4cG9ydCBjbGFzcyBGYWlsZWRGaWxlUmVnaXN0cnkge1xuICBwcml2YXRlIGxvYWRlZCA9IGZhbHNlO1xuICBwcml2YXRlIGVudHJpZXM6IFJlY29yZDxzdHJpbmcsIEZhaWxlZEZpbGVFbnRyeT4gPSB7fTtcbiAgcHJpdmF0ZSBxdWV1ZTogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgcmVnaXN0cnlQYXRoOiBzdHJpbmcpIHt9XG5cbiAgcHJpdmF0ZSBhc3luYyBsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmxvYWRlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKHRoaXMucmVnaXN0cnlQYXRoLCBcInV0Zi04XCIpO1xuICAgICAgdGhpcy5lbnRyaWVzID0gSlNPTi5wYXJzZShkYXRhKSA/PyB7fTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMuZW50cmllcyA9IHt9O1xuICAgIH1cbiAgICB0aGlzLmxvYWRlZCA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBlcnNpc3QoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgZnMubWtkaXIocGF0aC5kaXJuYW1lKHRoaXMucmVnaXN0cnlQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlKHRoaXMucmVnaXN0cnlQYXRoLCBKU09OLnN0cmluZ2lmeSh0aGlzLmVudHJpZXMsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xuICB9XG5cbiAgcHJpdmF0ZSBydW5FeGNsdXNpdmU8VD4ob3BlcmF0aW9uOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gdGhpcy5xdWV1ZS50aGVuKG9wZXJhdGlvbik7XG4gICAgdGhpcy5xdWV1ZSA9IHJlc3VsdC50aGVuKFxuICAgICAgKCkgPT4ge30sXG4gICAgICAoKSA9PiB7fSxcbiAgICApO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyByZWNvcmRGYWlsdXJlKGZpbGVQYXRoOiBzdHJpbmcsIGZpbGVIYXNoOiBzdHJpbmcsIHJlYXNvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMucnVuRXhjbHVzaXZlKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgICAgdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXSA9IHtcbiAgICAgICAgZmlsZUhhc2gsXG4gICAgICAgIHJlYXNvbixcbiAgICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9O1xuICAgICAgYXdhaXQgdGhpcy5wZXJzaXN0KCk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjbGVhckZhaWx1cmUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLnJ1bkV4Y2x1c2l2ZShhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgIGlmICh0aGlzLmVudHJpZXNbZmlsZVBhdGhdKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmVudHJpZXNbZmlsZVBhdGhdO1xuICAgICAgICBhd2FpdCB0aGlzLnBlcnNpc3QoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGdldEZhaWx1cmVSZWFzb24oZmlsZVBhdGg6IHN0cmluZywgZmlsZUhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgdW5kZWZpbmVkPiB7XG4gICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgY29uc3QgZW50cnkgPSB0aGlzLmVudHJpZXNbZmlsZVBhdGhdO1xuICAgIGlmICghZW50cnkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeS5maWxlSGFzaCA9PT0gZmlsZUhhc2ggPyBlbnRyeS5yZWFzb24gOiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuIiwgImltcG9ydCBQUXVldWUgZnJvbSBcInAtcXVldWVcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgc2NhbkRpcmVjdG9yeSwgdHlwZSBTY2FubmVkRmlsZSB9IGZyb20gXCIuL2ZpbGVTY2FubmVyXCI7XG5pbXBvcnQgeyBwYXJzZURvY3VtZW50LCB0eXBlIFBhcnNlRmFpbHVyZVJlYXNvbiB9IGZyb20gXCIuLi9wYXJzZXJzL2RvY3VtZW50UGFyc2VyXCI7XG5pbXBvcnQgeyBWZWN0b3JTdG9yZSwgdHlwZSBEb2N1bWVudENodW5rIH0gZnJvbSBcIi4uL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5pbXBvcnQgeyBjaHVua1RleHQgfSBmcm9tIFwiLi4vdXRpbHMvdGV4dENodW5rZXJcIjtcbmltcG9ydCB7IGNhbGN1bGF0ZUZpbGVIYXNoIH0gZnJvbSBcIi4uL3V0aWxzL2ZpbGVIYXNoXCI7XG5pbXBvcnQgeyB0eXBlIEVtYmVkZGluZ0R5bmFtaWNIYW5kbGUsIHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgRmFpbGVkRmlsZVJlZ2lzdHJ5IH0gZnJvbSBcIi4uL3V0aWxzL2ZhaWxlZEZpbGVSZWdpc3RyeVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4aW5nUHJvZ3Jlc3Mge1xuICB0b3RhbEZpbGVzOiBudW1iZXI7XG4gIHByb2Nlc3NlZEZpbGVzOiBudW1iZXI7XG4gIGN1cnJlbnRGaWxlOiBzdHJpbmc7XG4gIHN0YXR1czogXCJzY2FubmluZ1wiIHwgXCJpbmRleGluZ1wiIHwgXCJjb21wbGV0ZVwiIHwgXCJlcnJvclwiO1xuICBzdWNjZXNzZnVsRmlsZXM/OiBudW1iZXI7XG4gIGZhaWxlZEZpbGVzPzogbnVtYmVyO1xuICBza2lwcGVkRmlsZXM/OiBudW1iZXI7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4aW5nUmVzdWx0IHtcbiAgdG90YWxGaWxlczogbnVtYmVyO1xuICBzdWNjZXNzZnVsRmlsZXM6IG51bWJlcjtcbiAgZmFpbGVkRmlsZXM6IG51bWJlcjtcbiAgc2tpcHBlZEZpbGVzOiBudW1iZXI7XG4gIHVwZGF0ZWRGaWxlczogbnVtYmVyO1xuICBuZXdGaWxlczogbnVtYmVyO1xufVxuXG50eXBlIEZpbGVJbmRleE91dGNvbWUgPVxuICB8IHsgdHlwZTogXCJza2lwcGVkXCIgfVxuICB8IHsgdHlwZTogXCJpbmRleGVkXCI7IGNoYW5nZVR5cGU6IFwibmV3XCIgfCBcInVwZGF0ZWRcIiB9XG4gIHwgeyB0eXBlOiBcImZhaWxlZFwiIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdPcHRpb25zIHtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlOiBWZWN0b3JTdG9yZTtcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgZW1iZWRkaW5nTW9kZWw6IEVtYmVkZGluZ0R5bmFtaWNIYW5kbGU7XG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQ7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIGF1dG9SZWluZGV4OiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgZmFpbHVyZVJlcG9ydFBhdGg/OiBzdHJpbmc7XG4gIG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IEluZGV4aW5nUHJvZ3Jlc3MpID0+IHZvaWQ7XG59XG5cbnR5cGUgRmFpbHVyZVJlYXNvbiA9IFBhcnNlRmFpbHVyZVJlYXNvbiB8IFwiaW5kZXguY2h1bmstZW1wdHlcIiB8IFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiO1xuXG5mdW5jdGlvbiBjb2VyY2VFbWJlZGRpbmdWZWN0b3IocmF3OiB1bmtub3duKTogbnVtYmVyW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XG4gICAgcmV0dXJuIHJhdy5tYXAoYXNzZXJ0RmluaXRlTnVtYmVyKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgcmF3ID09PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIFthc3NlcnRGaW5pdGVOdW1iZXIocmF3KV07XG4gIH1cblxuICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09IFwib2JqZWN0XCIpIHtcbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHJhdykpIHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHJhdyBhcyB1bmtub3duIGFzIEFycmF5TGlrZTxudW1iZXI+KS5tYXAoYXNzZXJ0RmluaXRlTnVtYmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPVxuICAgICAgKHJhdyBhcyBhbnkpLmVtYmVkZGluZyA/P1xuICAgICAgKHJhdyBhcyBhbnkpLnZlY3RvciA/P1xuICAgICAgKHJhdyBhcyBhbnkpLmRhdGEgPz9cbiAgICAgICh0eXBlb2YgKHJhdyBhcyBhbnkpLnRvQXJyYXkgPT09IFwiZnVuY3Rpb25cIiA/IChyYXcgYXMgYW55KS50b0FycmF5KCkgOiB1bmRlZmluZWQpID8/XG4gICAgICAodHlwZW9mIChyYXcgYXMgYW55KS50b0pTT04gPT09IFwiZnVuY3Rpb25cIiA/IChyYXcgYXMgYW55KS50b0pTT04oKSA6IHVuZGVmaW5lZCk7XG5cbiAgICBpZiAoY2FuZGlkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBjb2VyY2VFbWJlZGRpbmdWZWN0b3IoY2FuZGlkYXRlKTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJFbWJlZGRpbmcgcHJvdmlkZXIgcmV0dXJuZWQgYSBub24tbnVtZXJpYyB2ZWN0b3JcIik7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEZpbml0ZU51bWJlcih2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gIGNvbnN0IG51bSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IHZhbHVlIDogTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVtYmVkZGluZyB2ZWN0b3IgY29udGFpbnMgYSBub24tZmluaXRlIHZhbHVlXCIpO1xuICB9XG4gIHJldHVybiBudW07XG59XG5cbmV4cG9ydCBjbGFzcyBJbmRleE1hbmFnZXIge1xuICBwcml2YXRlIHF1ZXVlOiBQUXVldWU7XG4gIHByaXZhdGUgb3B0aW9uczogSW5kZXhpbmdPcHRpb25zO1xuICBwcml2YXRlIGZhaWx1cmVSZWFzb25Db3VudHM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgcHJpdmF0ZSBmYWlsZWRGaWxlUmVnaXN0cnk6IEZhaWxlZEZpbGVSZWdpc3RyeTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJbmRleGluZ09wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMucXVldWUgPSBuZXcgUFF1ZXVlKHsgY29uY3VycmVuY3k6IG9wdGlvbnMubWF4Q29uY3VycmVudCB9KTtcbiAgICB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeSA9IG5ldyBGYWlsZWRGaWxlUmVnaXN0cnkoXG4gICAgICBwYXRoLmpvaW4ob3B0aW9ucy52ZWN0b3JTdG9yZURpciwgXCIuYmlnLXJhZy1mYWlsdXJlcy5qc29uXCIpLFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU3RhcnQgdGhlIGluZGV4aW5nIHByb2Nlc3NcbiAgICovXG4gIGFzeW5jIGluZGV4KCk6IFByb21pc2U8SW5kZXhpbmdSZXN1bHQ+IHtcbiAgICBjb25zdCB7IGRvY3VtZW50c0RpciwgdmVjdG9yU3RvcmUsIG9uUHJvZ3Jlc3MgfSA9IHRoaXMub3B0aW9ucztcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlSW52ZW50b3J5ID0gYXdhaXQgdmVjdG9yU3RvcmUuZ2V0RmlsZUhhc2hJbnZlbnRvcnkoKTtcblxuICAgICAgLy8gU3RlcCAxOiBTY2FuIGRpcmVjdG9yeVxuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogMCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwic2Nhbm5pbmdcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgc2NhbkRpcmVjdG9yeShkb2N1bWVudHNEaXIsIChzY2FubmVkLCBmb3VuZCkgPT4ge1xuICAgICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgICAgdG90YWxGaWxlczogZm91bmQsXG4gICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBgU2Nhbm5lZCAke3NjYW5uZWR9IGZpbGVzLi4uYCxcbiAgICAgICAgICAgIHN0YXR1czogXCJzY2FubmluZ1wiLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7ZmlsZXMubGVuZ3RofSBmaWxlcyB0byBwcm9jZXNzYCk7XG5cbiAgICAgIC8vIFN0ZXAgMjogSW5kZXggZmlsZXNcbiAgICAgIGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG4gICAgICBsZXQgc3VjY2Vzc0NvdW50ID0gMDtcbiAgICAgIGxldCBmYWlsQ291bnQgPSAwO1xuICAgICAgbGV0IHNraXBwZWRDb3VudCA9IDA7XG4gICAgICBsZXQgdXBkYXRlZENvdW50ID0gMDtcbiAgICAgIGxldCBuZXdDb3VudCA9IDA7XG5cbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogZmlsZXNbMF0/Lm5hbWUgPz8gXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFByb2Nlc3MgZmlsZXMgaW4gYmF0Y2hlc1xuICAgICAgY29uc3QgdGFza3MgPSBmaWxlcy5tYXAoKGZpbGUpID0+XG4gICAgICAgIHRoaXMucXVldWUuYWRkKGFzeW5jICgpID0+IHtcbiAgICAgICAgICBsZXQgb3V0Y29tZTogRmlsZUluZGV4T3V0Y29tZSA9IHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IHByb2Nlc3NlZENvdW50LFxuICAgICAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dGNvbWUgPSBhd2FpdCB0aGlzLmluZGV4RmlsZShmaWxlLCBmaWxlSW52ZW50b3J5KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5kZXhpbmcgZmlsZSAke2ZpbGUucGF0aH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgICAgICBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcHJvY2Vzc2VkQ291bnQrKztcbiAgICAgICAgICBzd2l0Y2ggKG91dGNvbWUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcInNraXBwZWRcIjpcbiAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50Kys7XG4gICAgICAgICAgICAgIHNraXBwZWRDb3VudCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJpbmRleGVkXCI6XG4gICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgICBpZiAob3V0Y29tZS5jaGFuZ2VUeXBlID09PSBcIm5ld1wiKSB7XG4gICAgICAgICAgICAgICAgbmV3Q291bnQrKztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVkQ291bnQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJmYWlsZWRcIjpcbiAgICAgICAgICAgICAgZmFpbENvdW50Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcyk7XG5cbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImNvbXBsZXRlXCIsXG4gICAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubG9nRmFpbHVyZVN1bW1hcnkoKTtcbiAgICAgIGF3YWl0IHRoaXMud3JpdGVGYWlsdXJlUmVwb3J0KHtcbiAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIHVwZGF0ZWRGaWxlczogdXBkYXRlZENvdW50LFxuICAgICAgICBuZXdGaWxlczogbmV3Q291bnQsXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBJbmRleGluZyBjb21wbGV0ZTogJHtzdWNjZXNzQ291bnR9LyR7ZmlsZXMubGVuZ3RofSBmaWxlcyBzdWNjZXNzZnVsbHkgaW5kZXhlZCAoJHtmYWlsQ291bnR9IGZhaWxlZCwgc2tpcHBlZD0ke3NraXBwZWRDb3VudH0sIHVwZGF0ZWQ9JHt1cGRhdGVkQ291bnR9LCBuZXc9JHtuZXdDb3VudH0pYCxcbiAgICAgICk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB1cGRhdGVkRmlsZXM6IHVwZGF0ZWRDb3VudCxcbiAgICAgICAgbmV3RmlsZXM6IG5ld0NvdW50LFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGR1cmluZyBpbmRleGluZzpcIiwgZXJyb3IpO1xuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogMCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiZXJyb3JcIixcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRleCBhIHNpbmdsZSBmaWxlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGluZGV4RmlsZShcbiAgICBmaWxlOiBTY2FubmVkRmlsZSxcbiAgICBmaWxlSW52ZW50b3J5OiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSBuZXcgTWFwKCksXG4gICk6IFByb21pc2U8RmlsZUluZGV4T3V0Y29tZT4ge1xuICAgIGNvbnN0IHsgdmVjdG9yU3RvcmUsIGVtYmVkZGluZ01vZGVsLCBjbGllbnQsIGNodW5rU2l6ZSwgY2h1bmtPdmVybGFwLCBlbmFibGVPQ1IsIGF1dG9SZWluZGV4IH0gPVxuICAgICAgdGhpcy5vcHRpb25zO1xuXG4gICAgbGV0IGZpbGVIYXNoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGN1bGF0ZSBmaWxlIGhhc2hcbiAgICAgIGZpbGVIYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nSGFzaGVzID0gZmlsZUludmVudG9yeS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IGhhc1NlZW5CZWZvcmUgPSBleGlzdGluZ0hhc2hlcyAhPT0gdW5kZWZpbmVkICYmIGV4aXN0aW5nSGFzaGVzLnNpemUgPiAwO1xuICAgICAgY29uc3QgaGFzU2FtZUhhc2ggPSBleGlzdGluZ0hhc2hlcz8uaGFzKGZpbGVIYXNoKSA/PyBmYWxzZTtcblxuICAgICAgLy8gQ2hlY2sgaWYgZmlsZSBhbHJlYWR5IGluZGV4ZWRcbiAgICAgIGlmIChhdXRvUmVpbmRleCAmJiBoYXNTYW1lSGFzaCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgRmlsZSBhbHJlYWR5IGluZGV4ZWQgKHNraXBwZWQpOiAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJza2lwcGVkXCIgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKGF1dG9SZWluZGV4KSB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzRmFpbHVyZSA9IGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LmdldEZhaWx1cmVSZWFzb24oZmlsZS5wYXRoLCBmaWxlSGFzaCk7XG4gICAgICAgIGlmIChwcmV2aW91c0ZhaWx1cmUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBGaWxlIHByZXZpb3VzbHkgZmFpbGVkIChza2lwcGVkKTogJHtmaWxlLm5hbWV9IChyZWFzb249JHtwcmV2aW91c0ZhaWx1cmV9KWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4geyB0eXBlOiBcInNraXBwZWRcIiB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdhaXQgYmVmb3JlIHBhcnNpbmcgdG8gcmVkdWNlIFdlYlNvY2tldCBsb2FkXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBhcnNlRGVsYXlNcyA+IDApIHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMub3B0aW9ucy5wYXJzZURlbGF5TXMpKTtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgZG9jdW1lbnRcbiAgICAgIGNvbnN0IHBhcnNlZFJlc3VsdCA9IGF3YWl0IHBhcnNlRG9jdW1lbnQoZmlsZS5wYXRoLCBlbmFibGVPQ1IsIGNsaWVudCk7XG4gICAgICBpZiAoIXBhcnNlZFJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShwYXJzZWRSZXN1bHQucmVhc29uLCBwYXJzZWRSZXN1bHQuZGV0YWlscywgZmlsZSk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgcGFyc2VkUmVzdWx0LnJlYXNvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VkUmVzdWx0LmRvY3VtZW50O1xuXG4gICAgICAvLyBDaHVuayB0ZXh0XG4gICAgICBjb25zdCBjaHVua3MgPSBjaHVua1RleHQocGFyc2VkLnRleHQsIGNodW5rU2l6ZSwgY2h1bmtPdmVybGFwKTtcbiAgICAgIGlmIChjaHVua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBObyBjaHVua3MgY3JlYXRlZCBmcm9tICR7ZmlsZS5uYW1lfWApO1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXCJpbmRleC5jaHVuay1lbXB0eVwiLCBcImNodW5rVGV4dCBwcm9kdWNlZCAwIGNodW5rc1wiLCBmaWxlKTtcbiAgICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcImluZGV4LmNodW5rLWVtcHR5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTsgLy8gRmFpbGVkIHRvIGNodW5rXG4gICAgICB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIGVtYmVkZGluZ3MgYW5kIGNyZWF0ZSBkb2N1bWVudCBjaHVua3NcbiAgICAgIGNvbnN0IGRvY3VtZW50Q2h1bmtzOiBEb2N1bWVudENodW5rW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBjaHVua3NbaV07XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEdlbmVyYXRlIGVtYmVkZGluZ1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGluZ1Jlc3VsdCA9IGF3YWl0IGVtYmVkZGluZ01vZGVsLmVtYmVkKGNodW5rLnRleHQpO1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGluZyA9IGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihlbWJlZGRpbmdSZXN1bHQuZW1iZWRkaW5nKTtcbiAgICAgICAgICBcbiAgICAgICAgICBkb2N1bWVudENodW5rcy5wdXNoKHtcbiAgICAgICAgICAgIGlkOiBgJHtmaWxlSGFzaH0tJHtpfWAsXG4gICAgICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICAgICAgdmVjdG9yOiBlbWJlZGRpbmcsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZS5wYXRoLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgIGZpbGVIYXNoLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogaSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIGV4dGVuc2lvbjogZmlsZS5leHRlbnNpb24sXG4gICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgICAgbXRpbWU6IGZpbGUubXRpbWUudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgc3RhcnRJbmRleDogY2h1bmsuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgZW5kSW5kZXg6IGNodW5rLmVuZEluZGV4LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBlbWJlZGRpbmcgY2h1bmsgJHtpfSBvZiAke2ZpbGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBjaHVua3MgdG8gdmVjdG9yIHN0b3JlXG4gICAgICBpZiAoZG9jdW1lbnRDaHVua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcbiAgICAgICAgICBcImluZGV4LmNodW5rLWVtcHR5XCIsXG4gICAgICAgICAgXCJBbGwgY2h1bmsgZW1iZWRkaW5ncyBmYWlsZWQsIG5vIGRvY3VtZW50IGNodW5rc1wiLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJpbmRleC5jaHVuay1lbXB0eVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHZlY3RvclN0b3JlLmFkZENodW5rcyhkb2N1bWVudENodW5rcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBJbmRleGVkICR7ZG9jdW1lbnRDaHVua3MubGVuZ3RofSBjaHVua3MgZnJvbSAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgaWYgKCFleGlzdGluZ0hhc2hlcykge1xuICAgICAgICAgIGZpbGVJbnZlbnRvcnkuc2V0KGZpbGUucGF0aCwgbmV3IFNldChbZmlsZUhhc2hdKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhpc3RpbmdIYXNoZXMuYWRkKGZpbGVIYXNoKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5jbGVhckZhaWx1cmUoZmlsZS5wYXRoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBcImluZGV4ZWRcIixcbiAgICAgICAgICBjaGFuZ2VUeXBlOiBoYXNTZWVuQmVmb3JlID8gXCJ1cGRhdGVkXCIgOiBcIm5ld1wiLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgYWRkaW5nIGNodW5rcyBmb3IgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgIFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiLFxuICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICApO1xuICAgICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbmRleGluZyBmaWxlICR7ZmlsZS5wYXRofTpgLCBlcnJvcik7XG4gICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgICAgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiLFxuICAgICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICApO1xuICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTsgLy8gRmFpbGVkXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlaW5kZXggYSBzcGVjaWZpYyBmaWxlIChkZWxldGUgb2xkIGNodW5rcyBhbmQgcmVpbmRleClcbiAgICovXG4gIGFzeW5jIHJlaW5kZXhGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IHZlY3RvclN0b3JlIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aCk7XG4gICAgICBcbiAgICAgIC8vIERlbGV0ZSBvbGQgY2h1bmtzXG4gICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5kZWxldGVCeUZpbGVIYXNoKGZpbGVIYXNoKTtcbiAgICAgIFxuICAgICAgLy8gUmVpbmRleFxuICAgICAgY29uc3QgZmlsZTogU2Nhbm5lZEZpbGUgPSB7XG4gICAgICAgIHBhdGg6IGZpbGVQYXRoLFxuICAgICAgICBuYW1lOiBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGgsXG4gICAgICAgIGV4dGVuc2lvbjogZmlsZVBhdGguc3BsaXQoXCIuXCIpLnBvcCgpIHx8IFwiXCIsXG4gICAgICAgIG1pbWVUeXBlOiBmYWxzZSxcbiAgICAgICAgc2l6ZTogMCxcbiAgICAgICAgbXRpbWU6IG5ldyBEYXRlKCksXG4gICAgICB9O1xuICAgICAgXG4gICAgICBhd2FpdCB0aGlzLmluZGV4RmlsZShmaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVpbmRleGluZyBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb3JkRmFpbHVyZShyZWFzb246IEZhaWx1cmVSZWFzb24sIGRldGFpbHM6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmlsZTogU2Nhbm5lZEZpbGUpIHtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl0gPz8gMDtcbiAgICB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXSA9IGN1cnJlbnQgKyAxO1xuICAgIGNvbnN0IGRldGFpbFN1ZmZpeCA9IGRldGFpbHMgPyBgIGRldGFpbHM9JHtkZXRhaWxzfWAgOiBcIlwiO1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBbQmlnUkFHXSBGYWlsZWQgdG8gcGFyc2UgJHtmaWxlLm5hbWV9IChyZWFzb249JHtyZWFzb259LCBjb3VudD0ke3RoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dfSkke2RldGFpbFN1ZmZpeH1gLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGxvZ0ZhaWx1cmVTdW1tYXJ5KCkge1xuICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyh0aGlzLmZhaWx1cmVSZWFzb25Db3VudHMpO1xuICAgIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coXCJbQmlnUkFHXSBObyBwYXJzaW5nIGZhaWx1cmVzIHJlY29yZGVkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJbQmlnUkFHXSBGYWlsdXJlIHJlYXNvbiBzdW1tYXJ5OlwiKTtcbiAgICBmb3IgKGNvbnN0IFtyZWFzb24sIGNvdW50XSBvZiBlbnRyaWVzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgICAtICR7cmVhc29ufTogJHtjb3VudH1gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHdyaXRlRmFpbHVyZVJlcG9ydChzdW1tYXJ5OiBJbmRleGluZ1Jlc3VsdCkge1xuICAgIGNvbnN0IHJlcG9ydFBhdGggPSB0aGlzLm9wdGlvbnMuZmFpbHVyZVJlcG9ydFBhdGg7XG4gICAgaWYgKCFyZXBvcnRQYXRoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgIC4uLnN1bW1hcnksXG4gICAgICBkb2N1bWVudHNEaXI6IHRoaXMub3B0aW9ucy5kb2N1bWVudHNEaXIsXG4gICAgICBmYWlsdXJlUmVhc29uczogdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzLFxuICAgICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKHBhdGguZGlybmFtZShyZXBvcnRQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUocmVwb3J0UGF0aCwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCwgbnVsbCwgMiksIFwidXRmLThcIik7XG4gICAgICBjb25zb2xlLmxvZyhgW0JpZ1JBR10gV3JvdGUgZmFpbHVyZSByZXBvcnQgdG8gJHtyZXBvcnRQYXRofWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbQmlnUkFHXSBGYWlsZWQgdG8gd3JpdGUgZmFpbHVyZSByZXBvcnQgdG8gJHtyZXBvcnRQYXRofTpgLCBlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbiIsICJpbXBvcnQgeyB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IEluZGV4TWFuYWdlciwgdHlwZSBJbmRleGluZ1Byb2dyZXNzLCB0eXBlIEluZGV4aW5nUmVzdWx0IH0gZnJvbSBcIi4vaW5kZXhNYW5hZ2VyXCI7XG5pbXBvcnQgeyBWZWN0b3JTdG9yZSB9IGZyb20gXCIuLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkluZGV4aW5nUGFyYW1zIHtcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudDtcbiAgYWJvcnRTaWduYWw6IEFib3J0U2lnbmFsO1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgYXV0b1JlaW5kZXg6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICBmb3JjZVJlaW5kZXg/OiBib29sZWFuO1xuICB2ZWN0b3JTdG9yZT86IFZlY3RvclN0b3JlO1xuICBvblByb2dyZXNzPzogKHByb2dyZXNzOiBJbmRleGluZ1Byb2dyZXNzKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkluZGV4aW5nUmVzdWx0IHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBzdGF0czoge1xuICAgIHRvdGFsQ2h1bmtzOiBudW1iZXI7XG4gICAgdW5pcXVlRmlsZXM6IG51bWJlcjtcbiAgfTtcbiAgaW5kZXhpbmdSZXN1bHQ6IEluZGV4aW5nUmVzdWx0O1xufVxuXG4vKipcbiAqIFNoYXJlZCBoZWxwZXIgdGhhdCBydW5zIHRoZSBmdWxsIGluZGV4aW5nIHBpcGVsaW5lLlxuICogQWxsb3dzIHJldXNlIGFjcm9zcyB0aGUgbWFudWFsIHRvb2wsIGNvbmZpZy10cmlnZ2VyZWQgaW5kZXhpbmcsIGFuZCBhdXRvbWF0aWMgYm9vdHN0cmFwcGluZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkluZGV4aW5nSm9iKHtcbiAgY2xpZW50LFxuICBhYm9ydFNpZ25hbCxcbiAgZG9jdW1lbnRzRGlyLFxuICB2ZWN0b3JTdG9yZURpcixcbiAgY2h1bmtTaXplLFxuICBjaHVua092ZXJsYXAsXG4gIG1heENvbmN1cnJlbnQsXG4gIGVuYWJsZU9DUixcbiAgYXV0b1JlaW5kZXgsXG4gIHBhcnNlRGVsYXlNcyxcbiAgZm9yY2VSZWluZGV4ID0gZmFsc2UsXG4gIHZlY3RvclN0b3JlOiBleGlzdGluZ1ZlY3RvclN0b3JlLFxuICBvblByb2dyZXNzLFxufTogUnVuSW5kZXhpbmdQYXJhbXMpOiBQcm9taXNlPFJ1bkluZGV4aW5nUmVzdWx0PiB7XG4gIGNvbnN0IHZlY3RvclN0b3JlID0gZXhpc3RpbmdWZWN0b3JTdG9yZSA/PyBuZXcgVmVjdG9yU3RvcmUodmVjdG9yU3RvcmVEaXIpO1xuICBjb25zdCBvd25zVmVjdG9yU3RvcmUgPSBleGlzdGluZ1ZlY3RvclN0b3JlID09PSB1bmRlZmluZWQ7XG5cbiAgaWYgKG93bnNWZWN0b3JTdG9yZSkge1xuICAgIGF3YWl0IHZlY3RvclN0b3JlLmluaXRpYWxpemUoKTtcbiAgfVxuXG4gIGNvbnN0IGVtYmVkZGluZ01vZGVsID0gYXdhaXQgY2xpZW50LmVtYmVkZGluZy5tb2RlbChcbiAgICBcIm5vbWljLWFpL25vbWljLWVtYmVkLXRleHQtdjEuNS1HR1VGXCIsXG4gICAgeyBzaWduYWw6IGFib3J0U2lnbmFsIH0sXG4gICk7XG5cbiAgY29uc3QgaW5kZXhNYW5hZ2VyID0gbmV3IEluZGV4TWFuYWdlcih7XG4gICAgZG9jdW1lbnRzRGlyLFxuICAgIHZlY3RvclN0b3JlLFxuICAgIHZlY3RvclN0b3JlRGlyLFxuICAgIGVtYmVkZGluZ01vZGVsLFxuICAgIGNsaWVudCxcbiAgICBjaHVua1NpemUsXG4gICAgY2h1bmtPdmVybGFwLFxuICAgIG1heENvbmN1cnJlbnQsXG4gICAgZW5hYmxlT0NSLFxuICAgIGF1dG9SZWluZGV4OiBmb3JjZVJlaW5kZXggPyBmYWxzZSA6IGF1dG9SZWluZGV4LFxuICAgIHBhcnNlRGVsYXlNcyxcbiAgICBvblByb2dyZXNzLFxuICB9KTtcblxuICBjb25zdCBpbmRleGluZ1Jlc3VsdCA9IGF3YWl0IGluZGV4TWFuYWdlci5pbmRleCgpO1xuICBjb25zdCBzdGF0cyA9IGF3YWl0IHZlY3RvclN0b3JlLmdldFN0YXRzKCk7XG5cbiAgaWYgKG93bnNWZWN0b3JTdG9yZSkge1xuICAgIGF3YWl0IHZlY3RvclN0b3JlLmNsb3NlKCk7XG4gIH1cblxuICBjb25zdCBzdW1tYXJ5ID0gYEluZGV4aW5nIGNvbXBsZXRlZCFcXG5cXG5gICtcbiAgICBgXHUyMDIyIFN1Y2Nlc3NmdWxseSBpbmRleGVkOiAke2luZGV4aW5nUmVzdWx0LnN1Y2Nlc3NmdWxGaWxlc30vJHtpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgRmFpbGVkOiAke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgU2tpcHBlZCAodW5jaGFuZ2VkKTogJHtpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBVcGRhdGVkIGV4aXN0aW5nIGZpbGVzOiAke2luZGV4aW5nUmVzdWx0LnVwZGF0ZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIE5ldyBmaWxlcyBhZGRlZDogJHtpbmRleGluZ1Jlc3VsdC5uZXdGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIENodW5rcyBpbiBzdG9yZTogJHtzdGF0cy50b3RhbENodW5rc31cXG5gICtcbiAgICBgXHUyMDIyIFVuaXF1ZSBmaWxlcyBpbiBzdG9yZTogJHtzdGF0cy51bmlxdWVGaWxlc31gO1xuXG4gIHJldHVybiB7XG4gICAgc3VtbWFyeSxcbiAgICBzdGF0cyxcbiAgICBpbmRleGluZ1Jlc3VsdCxcbiAgfTtcbn1cblxuIiwgImltcG9ydCB7XG4gIHR5cGUgQ2hhdE1lc3NhZ2UsXG4gIHR5cGUgUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcixcbn0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MsIERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBWZWN0b3JTdG9yZSB9IGZyb20gXCIuL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5pbXBvcnQgeyBwZXJmb3JtU2FuaXR5Q2hlY2tzIH0gZnJvbSBcIi4vdXRpbHMvc2FuaXR5Q2hlY2tzXCI7XG5pbXBvcnQgeyB0cnlTdGFydEluZGV4aW5nLCBmaW5pc2hJbmRleGluZyB9IGZyb20gXCIuL3V0aWxzL2luZGV4aW5nTG9ja1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcnVuSW5kZXhpbmdKb2IgfSBmcm9tIFwiLi9pbmdlc3Rpb24vcnVuSW5kZXhpbmdcIjtcblxuZnVuY3Rpb24gc3VtbWFyaXplVGV4dCh0ZXh0OiBzdHJpbmcsIG1heExpbmVzOiBudW1iZXIgPSAzLCBtYXhDaGFyczogbnVtYmVyID0gNDAwKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSB0ZXh0LnNwbGl0KC9cXHI/XFxuLykuZmlsdGVyKGxpbmUgPT4gbGluZS50cmltKCkgIT09IFwiXCIpO1xuICBjb25zdCBjbGlwcGVkTGluZXMgPSBsaW5lcy5zbGljZSgwLCBtYXhMaW5lcyk7XG4gIGxldCBjbGlwcGVkID0gY2xpcHBlZExpbmVzLmpvaW4oXCJcXG5cIik7XG4gIGlmIChjbGlwcGVkLmxlbmd0aCA+IG1heENoYXJzKSB7XG4gICAgY2xpcHBlZCA9IGNsaXBwZWQuc2xpY2UoMCwgbWF4Q2hhcnMpO1xuICB9XG4gIGNvbnN0IG5lZWRzRWxsaXBzaXMgPVxuICAgIGxpbmVzLmxlbmd0aCA+IG1heExpbmVzIHx8XG4gICAgdGV4dC5sZW5ndGggPiBjbGlwcGVkLmxlbmd0aCB8fFxuICAgIGNsaXBwZWQubGVuZ3RoID09PSBtYXhDaGFycyAmJiB0ZXh0Lmxlbmd0aCA+IG1heENoYXJzO1xuICByZXR1cm4gbmVlZHNFbGxpcHNpcyA/IGAke2NsaXBwZWQudHJpbUVuZCgpfVx1MjAyNmAgOiBjbGlwcGVkO1xufVxuXG4vLyBHbG9iYWwgc3RhdGUgZm9yIHZlY3RvciBzdG9yZSAocGVyc2lzdHMgYWNyb3NzIHJlcXVlc3RzKVxubGV0IHZlY3RvclN0b3JlOiBWZWN0b3JTdG9yZSB8IG51bGwgPSBudWxsO1xubGV0IGxhc3RJbmRleGVkRGlyID0gXCJcIjtcbmxldCBzYW5pdHlDaGVja3NQYXNzZWQgPSBmYWxzZTtcblxuY29uc3QgUkFHX0NPTlRFWFRfTUFDUk8gPSBcInt7cmFnX2NvbnRleHR9fVwiO1xuY29uc3QgVVNFUl9RVUVSWV9NQUNSTyA9IFwie3t1c2VyX3F1ZXJ5fX1cIjtcblxuZnVuY3Rpb24gbm9ybWFsaXplUHJvbXB0VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBjb25zdCBoYXNDb250ZW50ID0gdHlwZW9mIHRlbXBsYXRlID09PSBcInN0cmluZ1wiICYmIHRlbXBsYXRlLnRyaW0oKS5sZW5ndGggPiAwO1xuICBsZXQgbm9ybWFsaXplZCA9IGhhc0NvbnRlbnQgPyB0ZW1wbGF0ZSEgOiBERUZBVUxUX1BST01QVF9URU1QTEFURTtcblxuICBpZiAoIW5vcm1hbGl6ZWQuaW5jbHVkZXMoUkFHX0NPTlRFWFRfTUFDUk8pKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIFByb21wdCB0ZW1wbGF0ZSBtaXNzaW5nICR7UkFHX0NPTlRFWFRfTUFDUk99LiBQcmVwZW5kaW5nIFJBRyBjb250ZXh0IGJsb2NrLmAsXG4gICAgKTtcbiAgICBub3JtYWxpemVkID0gYCR7UkFHX0NPTlRFWFRfTUFDUk99XFxuXFxuJHtub3JtYWxpemVkfWA7XG4gIH1cblxuICBpZiAoIW5vcm1hbGl6ZWQuaW5jbHVkZXMoVVNFUl9RVUVSWV9NQUNSTykpIHtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgW0JpZ1JBR10gUHJvbXB0IHRlbXBsYXRlIG1pc3NpbmcgJHtVU0VSX1FVRVJZX01BQ1JPfS4gQXBwZW5kaW5nIHVzZXIgcXVlcnkgYmxvY2suYCxcbiAgICApO1xuICAgIG5vcm1hbGl6ZWQgPSBgJHtub3JtYWxpemVkfVxcblxcblVzZXIgUXVlcnk6XFxuXFxuJHtVU0VSX1FVRVJZX01BQ1JPfWA7XG4gIH1cblxuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuZnVuY3Rpb24gZmlsbFByb21wdFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcsIHJlcGxhY2VtZW50czogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhyZXBsYWNlbWVudHMpLnJlZHVjZShcbiAgICAoYWNjLCBbdG9rZW4sIHZhbHVlXSkgPT4gYWNjLnNwbGl0KHRva2VuKS5qb2luKHZhbHVlKSxcbiAgICB0ZW1wbGF0ZSxcbiAgKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd2FybklmQ29udGV4dE92ZXJmbG93KFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIGZpbmFsUHJvbXB0OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB0b2tlblNvdXJjZSA9IGF3YWl0IGN0bC50b2tlblNvdXJjZSgpO1xuICAgIGlmIChcbiAgICAgICF0b2tlblNvdXJjZSB8fFxuICAgICAgIShcImFwcGx5UHJvbXB0VGVtcGxhdGVcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5hcHBseVByb21wdFRlbXBsYXRlICE9PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICEoXCJjb3VudFRva2Vuc1wiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmNvdW50VG9rZW5zICE9PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICEoXCJnZXRDb250ZXh0TGVuZ3RoXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuZ2V0Q29udGV4dExlbmd0aCAhPT0gXCJmdW5jdGlvblwiXG4gICAgKSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBUb2tlbiBzb3VyY2UgZG9lcyBub3QgZXhwb3NlIHByb21wdCB1dGlsaXRpZXM7IHNraXBwaW5nIGNvbnRleHQgY2hlY2suXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IFtjb250ZXh0TGVuZ3RoLCBoaXN0b3J5XSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRva2VuU291cmNlLmdldENvbnRleHRMZW5ndGgoKSxcbiAgICAgIGN0bC5wdWxsSGlzdG9yeSgpLFxuICAgIF0pO1xuICAgIGNvbnN0IGhpc3RvcnlXaXRoTGF0ZXN0TWVzc2FnZSA9IGhpc3Rvcnkud2l0aEFwcGVuZGVkKHtcbiAgICAgIHJvbGU6IFwidXNlclwiLFxuICAgICAgY29udGVudDogZmluYWxQcm9tcHQsXG4gICAgfSk7XG4gICAgY29uc3QgZm9ybWF0dGVkUHJvbXB0ID0gYXdhaXQgdG9rZW5Tb3VyY2UuYXBwbHlQcm9tcHRUZW1wbGF0ZShoaXN0b3J5V2l0aExhdGVzdE1lc3NhZ2UpO1xuICAgIGNvbnN0IHByb21wdFRva2VucyA9IGF3YWl0IHRva2VuU291cmNlLmNvdW50VG9rZW5zKGZvcm1hdHRlZFByb21wdCk7XG5cbiAgICBpZiAocHJvbXB0VG9rZW5zID4gY29udGV4dExlbmd0aCkge1xuICAgICAgY29uc3Qgd2FybmluZ1N1bW1hcnkgPVxuICAgICAgICBgXHUyNkEwXHVGRTBGIFByb21wdCBuZWVkcyAke3Byb21wdFRva2Vucy50b0xvY2FsZVN0cmluZygpfSB0b2tlbnMgYnV0IG1vZGVsIG1heCBpcyAke2NvbnRleHRMZW5ndGgudG9Mb2NhbGVTdHJpbmcoKX0uYDtcbiAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddXCIsIHdhcm5pbmdTdW1tYXJ5KTtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZXJyb3JcIixcbiAgICAgICAgdGV4dDogYCR7d2FybmluZ1N1bW1hcnl9IFJlZHVjZSByZXRyaWV2ZWQgcGFzc2FnZXMgb3IgaW5jcmVhc2UgdGhlIG1vZGVsJ3MgY29udGV4dCBsZW5ndGguYCxcbiAgICAgIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgY3RsLmNsaWVudC5zeXN0ZW0ubm90aWZ5KHtcbiAgICAgICAgICB0aXRsZTogXCJDb250ZXh0IHdpbmRvdyBleGNlZWRlZFwiLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiBgJHt3YXJuaW5nU3VtbWFyeX0gUHJvbXB0IG1heSBiZSB0cnVuY2F0ZWQgb3IgcmVqZWN0ZWQuYCxcbiAgICAgICAgICBub0F1dG9EaXNtaXNzOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKG5vdGlmeUVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFVuYWJsZSB0byBzZW5kIGNvbnRleHQgb3ZlcmZsb3cgbm90aWZpY2F0aW9uOlwiLCBub3RpZnlFcnJvcik7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIEZhaWxlZCB0byBldmFsdWF0ZSBjb250ZXh0IHVzYWdlOlwiLCBlcnJvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWluIHByb21wdCBwcmVwcm9jZXNzb3IgZnVuY3Rpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByZXByb2Nlc3MoXG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcixcbiAgdXNlck1lc3NhZ2U6IENoYXRNZXNzYWdlLFxuKTogUHJvbWlzZTxDaGF0TWVzc2FnZSB8IHN0cmluZz4ge1xuICBjb25zdCB1c2VyUHJvbXB0ID0gdXNlck1lc3NhZ2UuZ2V0VGV4dCgpO1xuICBjb25zdCBwbHVnaW5Db25maWcgPSBjdGwuZ2V0UGx1Z2luQ29uZmlnKGNvbmZpZ1NjaGVtYXRpY3MpO1xuXG4gIC8vIEdldCBjb25maWd1cmF0aW9uXG4gIGNvbnN0IGRvY3VtZW50c0RpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJkb2N1bWVudHNEaXJlY3RvcnlcIik7XG4gIGNvbnN0IHZlY3RvclN0b3JlRGlyID0gcGx1Z2luQ29uZmlnLmdldChcInZlY3RvclN0b3JlRGlyZWN0b3J5XCIpO1xuICBjb25zdCByZXRyaWV2YWxMaW1pdCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxMaW1pdFwiKTtcbiAgY29uc3QgcmV0cmlldmFsVGhyZXNob2xkID0gcGx1Z2luQ29uZmlnLmdldChcInJldHJpZXZhbEFmZmluaXR5VGhyZXNob2xkXCIpO1xuICBjb25zdCBjaHVua1NpemUgPSBwbHVnaW5Db25maWcuZ2V0KFwiY2h1bmtTaXplXCIpO1xuICBjb25zdCBjaHVua092ZXJsYXAgPSBwbHVnaW5Db25maWcuZ2V0KFwiY2h1bmtPdmVybGFwXCIpO1xuICBjb25zdCBtYXhDb25jdXJyZW50ID0gcGx1Z2luQ29uZmlnLmdldChcIm1heENvbmN1cnJlbnRGaWxlc1wiKTtcbiAgY29uc3QgZW5hYmxlT0NSID0gcGx1Z2luQ29uZmlnLmdldChcImVuYWJsZU9DUlwiKTtcbiAgY29uc3Qgc2tpcFByZXZpb3VzbHlJbmRleGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXguc2tpcFByZXZpb3VzbHlJbmRleGVkXCIpO1xuICBjb25zdCBwYXJzZURlbGF5TXMgPSBwbHVnaW5Db25maWcuZ2V0KFwicGFyc2VEZWxheU1zXCIpID8/IDA7XG4gIGNvbnN0IHJlaW5kZXhSZXF1ZXN0ZWQgPSBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC50cmlnZ2VyXCIpO1xuXG4gIC8vIFZhbGlkYXRlIGNvbmZpZ3VyYXRpb25cbiAgaWYgKCFkb2N1bWVudHNEaXIgfHwgZG9jdW1lbnRzRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gRG9jdW1lbnRzIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIGlmICghdmVjdG9yU3RvcmVEaXIgfHwgdmVjdG9yU3RvcmVEaXIgPT09IFwiXCIpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IG5vdCBjb25maWd1cmVkLiBQbGVhc2Ugc2V0IGl0IGluIHBsdWdpbiBzZXR0aW5ncy5cIik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG5cbiAgdHJ5IHtcbiAgICAvLyBQZXJmb3JtIHNhbml0eSBjaGVja3Mgb24gZmlyc3QgcnVuXG4gICAgaWYgKCFzYW5pdHlDaGVja3NQYXNzZWQpIHtcbiAgICAgIGNvbnN0IGNoZWNrU3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgIHRleHQ6IFwiUGVyZm9ybWluZyBzYW5pdHkgY2hlY2tzLi4uXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgc2FuaXR5UmVzdWx0ID0gYXdhaXQgcGVyZm9ybVNhbml0eUNoZWNrcyhkb2N1bWVudHNEaXIsIHZlY3RvclN0b3JlRGlyKTtcblxuICAgICAgLy8gTG9nIHdhcm5pbmdzXG4gICAgICBmb3IgKGNvbnN0IHdhcm5pbmcgb2Ygc2FuaXR5UmVzdWx0Lndhcm5pbmdzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddXCIsIHdhcm5pbmcpO1xuICAgICAgfVxuXG4gICAgICAvLyBMb2cgZXJyb3JzIGFuZCBhYm9ydCBpZiBjcml0aWNhbFxuICAgICAgaWYgKCFzYW5pdHlSZXN1bHQucGFzc2VkKSB7XG4gICAgICAgIGZvciAoY29uc3QgZXJyb3Igb2Ygc2FuaXR5UmVzdWx0LmVycm9ycykge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXVwiLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmFpbHVyZVJlYXNvbiA9XG4gICAgICAgICAgc2FuaXR5UmVzdWx0LmVycm9yc1swXSA/P1xuICAgICAgICAgIHNhbml0eVJlc3VsdC53YXJuaW5nc1swXSA/P1xuICAgICAgICAgIFwiVW5rbm93biByZWFzb24uIFBsZWFzZSByZXZpZXcgcGx1Z2luIHNldHRpbmdzLlwiO1xuICAgICAgICBjaGVja1N0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgdGV4dDogYFNhbml0eSBjaGVja3MgZmFpbGVkOiAke2ZhaWx1cmVSZWFzb259YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIlNhbml0eSBjaGVja3MgcGFzc2VkXCIsXG4gICAgICB9KTtcbiAgICAgIHNhbml0eUNoZWNrc1Bhc3NlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGl6ZSB2ZWN0b3Igc3RvcmUgaWYgbmVlZGVkXG4gICAgaWYgKCF2ZWN0b3JTdG9yZSB8fCBsYXN0SW5kZXhlZERpciAhPT0gdmVjdG9yU3RvcmVEaXIpIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIkluaXRpYWxpemluZyB2ZWN0b3Igc3RvcmUuLi5cIixcbiAgICAgIH0pO1xuXG4gICAgICB2ZWN0b3JTdG9yZSA9IG5ldyBWZWN0b3JTdG9yZSh2ZWN0b3JTdG9yZURpcik7XG4gICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5pbml0aWFsaXplKCk7XG4gICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgIGBbQmlnUkFHXSBWZWN0b3Igc3RvcmUgcmVhZHkgKHBhdGg9JHt2ZWN0b3JTdG9yZURpcn0pLiBXYWl0aW5nIGZvciBxdWVyaWVzLi4uYCxcbiAgICAgICk7XG4gICAgICBsYXN0SW5kZXhlZERpciA9IHZlY3RvclN0b3JlRGlyO1xuXG4gICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgbWF5YmVIYW5kbGVDb25maWdUcmlnZ2VyZWRSZWluZGV4KHtcbiAgICAgIGN0bCxcbiAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgY2h1bmtTaXplLFxuICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgIGVuYWJsZU9DUixcbiAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgIHJlaW5kZXhSZXF1ZXN0ZWQsXG4gICAgICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKSxcbiAgICB9KTtcblxuICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gaW5kZXhcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IHZlY3RvclN0b3JlLmdldFN0YXRzKCk7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHN0YXRzIGJlZm9yZSBhdXRvLWluZGV4IGNoZWNrOiB0b3RhbENodW5rcz0ke3N0YXRzLnRvdGFsQ2h1bmtzfSwgdW5pcXVlRmlsZXM9JHtzdGF0cy51bmlxdWVGaWxlc31gKTtcblxuICAgIGlmIChzdGF0cy50b3RhbENodW5rcyA9PT0gMCkge1xuICAgICAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiYXV0by10cmlnZ2VyXCIpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIEluZGV4aW5nIGFscmVhZHkgcnVubmluZywgc2tpcHBpbmcgYXV0b21hdGljIGluZGV4aW5nLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluZGV4U3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICB0ZXh0OiBcIlN0YXJ0aW5nIGluaXRpYWwgaW5kZXhpbmcuLi5cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IGluZGV4aW5nUmVzdWx0IH0gPSBhd2FpdCBydW5JbmRleGluZ0pvYih7XG4gICAgICAgICAgICBjbGllbnQ6IGN0bC5jbGllbnQsXG4gICAgICAgICAgICBhYm9ydFNpZ25hbDogY3RsLmFib3J0U2lnbmFsLFxuICAgICAgICAgICAgZG9jdW1lbnRzRGlyLFxuICAgICAgICAgICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgICAgICAgICBjaHVua1NpemUsXG4gICAgICAgICAgICBjaHVua092ZXJsYXAsXG4gICAgICAgICAgICBtYXhDb25jdXJyZW50LFxuICAgICAgICAgICAgZW5hYmxlT0NSLFxuICAgICAgICAgICAgYXV0b1JlaW5kZXg6IGZhbHNlLFxuICAgICAgICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgICAgICAgdmVjdG9yU3RvcmUsXG4gICAgICAgICAgICBmb3JjZVJlaW5kZXg6IHRydWUsXG4gICAgICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJzY2FubmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHByb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZCA9IHByb2dyZXNzLmZhaWxlZEZpbGVzID8/IDA7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IHByb2dyZXNzLnNraXBwZWRGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmc6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9LyR7cHJvZ3Jlc3MudG90YWxGaWxlc30gZmlsZXMgYCArXG4gICAgICAgICAgICAgICAgICAgIGAoc3VjY2Vzcz0ke3N1Y2Nlc3N9LCBmYWlsZWQ9JHtmYWlsZWR9LCBza2lwcGVkPSR7c2tpcHBlZH0pIGAgK1xuICAgICAgICAgICAgICAgICAgICBgKCR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9KWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGNvbXBsZXRlOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfSBmaWxlcyBwcm9jZXNzZWRgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZXJyb3I6ICR7cHJvZ3Jlc3MuZXJyb3J9YCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKGBbQmlnUkFHXSBJbmRleGluZyBjb21wbGV0ZTogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc30gZmlsZXMgc3VjY2Vzc2Z1bGx5IGluZGV4ZWQgKCR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9IGZhaWxlZClgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBmYWlsZWQ6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltCaWdSQUddIEluZGV4aW5nIGZhaWxlZDpcIiwgZXJyb3IpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIGZpbmlzaEluZGV4aW5nKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBMb2cgbWFudWFsIHJlaW5kZXggdG9nZ2xlIHN0YXRlcyBmb3IgdmlzaWJpbGl0eSBvbiBlYWNoIGNoYXRcbiAgICBjb25zdCB0b2dnbGVTdGF0dXNUZXh0ID1cbiAgICAgIGBNYW51YWwgUmVpbmRleCBUcmlnZ2VyOiAke3JlaW5kZXhSZXF1ZXN0ZWQgPyBcIk9OXCIgOiBcIk9GRlwifSB8IGAgK1xuICAgICAgYFNraXAgUHJldmlvdXNseSBJbmRleGVkOiAke3NraXBQcmV2aW91c2x5SW5kZXhlZCA/IFwiT05cIiA6IFwiT0ZGXCJ9YDtcbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7dG9nZ2xlU3RhdHVzVGV4dH1gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiB0b2dnbGVTdGF0dXNUZXh0LFxuICAgIH0pO1xuXG4gICAgLy8gUGVyZm9ybSByZXRyaWV2YWxcbiAgICBjb25zdCByZXRyaWV2YWxTdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICB0ZXh0OiBcIkxvYWRpbmcgZW1iZWRkaW5nIG1vZGVsIGZvciByZXRyaWV2YWwuLi5cIixcbiAgICB9KTtcblxuICAgIGNvbnN0IGVtYmVkZGluZ01vZGVsID0gYXdhaXQgY3RsLmNsaWVudC5lbWJlZGRpbmcubW9kZWwoXG4gICAgICBcIm5vbWljLWFpL25vbWljLWVtYmVkLXRleHQtdjEuNS1HR1VGXCIsXG4gICAgICB7IHNpZ25hbDogY3RsLmFib3J0U2lnbmFsIH1cbiAgICApO1xuXG4gICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICB0ZXh0OiBcIlNlYXJjaGluZyBmb3IgcmVsZXZhbnQgY29udGVudC4uLlwiLFxuICAgIH0pO1xuXG4gICAgLy8gRW1iZWQgdGhlIHF1ZXJ5XG4gICAgY29uc3QgcXVlcnlFbWJlZGRpbmdSZXN1bHQgPSBhd2FpdCBlbWJlZGRpbmdNb2RlbC5lbWJlZCh1c2VyUHJvbXB0KTtcbiAgICBjb25zdCBxdWVyeUVtYmVkZGluZyA9IHF1ZXJ5RW1iZWRkaW5nUmVzdWx0LmVtYmVkZGluZztcblxuICAgIC8vIFNlYXJjaCB2ZWN0b3Igc3RvcmVcbiAgICBjb25zdCBxdWVyeVByZXZpZXcgPVxuICAgICAgdXNlclByb21wdC5sZW5ndGggPiAxNjAgPyBgJHt1c2VyUHJvbXB0LnNsaWNlKDAsIDE2MCl9Li4uYCA6IHVzZXJQcm9tcHQ7XG4gICAgY29uc29sZS5pbmZvKFxuICAgICAgYFtCaWdSQUddIEV4ZWN1dGluZyB2ZWN0b3Igc2VhcmNoIGZvciBcIiR7cXVlcnlQcmV2aWV3fVwiIChsaW1pdD0ke3JldHJpZXZhbExpbWl0fSwgdGhyZXNob2xkPSR7cmV0cmlldmFsVGhyZXNob2xkfSlgLFxuICAgICk7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHZlY3RvclN0b3JlLnNlYXJjaChcbiAgICAgIHF1ZXJ5RW1iZWRkaW5nLFxuICAgICAgcmV0cmlldmFsTGltaXQsXG4gICAgICByZXRyaWV2YWxUaHJlc2hvbGRcbiAgICApO1xuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRvcEhpdCA9IHJlc3VsdHNbMF07XG4gICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgIGBbQmlnUkFHXSBWZWN0b3Igc2VhcmNoIHJldHVybmVkICR7cmVzdWx0cy5sZW5ndGh9IHJlc3VsdHMuIFRvcCBoaXQ6IGZpbGU9JHt0b3BIaXQuZmlsZU5hbWV9IHNjb3JlPSR7dG9wSGl0LnNjb3JlLnRvRml4ZWQoMyl9YCxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGRvY1N1bW1hcmllcyA9IHJlc3VsdHNcbiAgICAgICAgLm1hcChcbiAgICAgICAgICAocmVzdWx0LCBpZHgpID0+XG4gICAgICAgICAgICBgIyR7aWR4ICsgMX0gZmlsZT0ke3BhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKX0gc2NvcmU9JHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX1gLFxuICAgICAgICApXG4gICAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSBSZWxldmFudCBkb2N1bWVudHM6XFxuJHtkb2NTdW1tYXJpZXN9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFZlY3RvciBzZWFyY2ggcmV0dXJuZWQgMCByZXN1bHRzLlwiKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICB0ZXh0OiBcIk5vIHJlbGV2YW50IGNvbnRlbnQgZm91bmQgaW4gaW5kZXhlZCBkb2N1bWVudHNcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBub3RlQWJvdXROb1Jlc3VsdHMgPVxuICAgICAgICBgSW1wb3J0YW50OiBObyByZWxldmFudCBjb250ZW50IHdhcyBmb3VuZCBpbiB0aGUgaW5kZXhlZCBkb2N1bWVudHMgZm9yIHRoZSB1c2VyIHF1ZXJ5LiBgICtcbiAgICAgICAgYEluIGxlc3MgdGhhbiBvbmUgc2VudGVuY2UsIGluZm9ybSB0aGUgdXNlciBvZiB0aGlzLiBgICtcbiAgICAgICAgYFRoZW4gcmVzcG9uZCB0byB0aGUgcXVlcnkgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5LmA7XG5cbiAgICAgIHJldHVybiBub3RlQWJvdXROb1Jlc3VsdHMgKyBgXFxuXFxuVXNlciBRdWVyeTpcXG5cXG4ke3VzZXJQcm9tcHR9YDtcbiAgICB9XG5cbiAgICAvLyBGb3JtYXQgcmVzdWx0c1xuICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogYFJldHJpZXZlZCAke3Jlc3VsdHMubGVuZ3RofSByZWxldmFudCBwYXNzYWdlc2AsXG4gICAgfSk7XG5cbiAgICBjdGwuZGVidWcoXCJSZXRyaWV2YWwgcmVzdWx0czpcIiwgcmVzdWx0cyk7XG5cbiAgICBsZXQgcmFnQ29udGV4dEZ1bGwgPSBcIlwiO1xuICAgIGxldCByYWdDb250ZXh0UHJldmlldyA9IFwiXCI7XG4gICAgY29uc3QgcHJlZml4ID0gXCJUaGUgZm9sbG93aW5nIHBhc3NhZ2VzIHdlcmUgZm91bmQgaW4geW91ciBpbmRleGVkIGRvY3VtZW50czpcXG5cXG5cIjtcbiAgICByYWdDb250ZXh0RnVsbCArPSBwcmVmaXg7XG4gICAgcmFnQ29udGV4dFByZXZpZXcgKz0gcHJlZml4O1xuXG4gICAgbGV0IGNpdGF0aW9uTnVtYmVyID0gMTtcbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGNpdGF0aW9uTGFiZWwgPSBgQ2l0YXRpb24gJHtjaXRhdGlvbk51bWJlcn0gKGZyb20gJHtmaWxlTmFtZX0sIHNjb3JlOiAke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfSk6IGA7XG4gICAgICByYWdDb250ZXh0RnVsbCArPSBgXFxuJHtjaXRhdGlvbkxhYmVsfVwiJHtyZXN1bHQudGV4dH1cIlxcblxcbmA7XG4gICAgICByYWdDb250ZXh0UHJldmlldyArPSBgXFxuJHtjaXRhdGlvbkxhYmVsfVwiJHtzdW1tYXJpemVUZXh0KHJlc3VsdC50ZXh0KX1cIlxcblxcbmA7XG4gICAgICBjaXRhdGlvbk51bWJlcisrO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21wdFRlbXBsYXRlID0gbm9ybWFsaXplUHJvbXB0VGVtcGxhdGUocGx1Z2luQ29uZmlnLmdldChcInByb21wdFRlbXBsYXRlXCIpKTtcbiAgICBjb25zdCBmaW5hbFByb21wdCA9IGZpbGxQcm9tcHRUZW1wbGF0ZShwcm9tcHRUZW1wbGF0ZSwge1xuICAgICAgW1JBR19DT05URVhUX01BQ1JPXTogcmFnQ29udGV4dEZ1bGwudHJpbUVuZCgpLFxuICAgICAgW1VTRVJfUVVFUllfTUFDUk9dOiB1c2VyUHJvbXB0LFxuICAgIH0pO1xuICAgIGNvbnN0IGZpbmFsUHJvbXB0UHJldmlldyA9IGZpbGxQcm9tcHRUZW1wbGF0ZShwcm9tcHRUZW1wbGF0ZSwge1xuICAgICAgW1JBR19DT05URVhUX01BQ1JPXTogcmFnQ29udGV4dFByZXZpZXcudHJpbUVuZCgpLFxuICAgICAgW1VTRVJfUVVFUllfTUFDUk9dOiB1c2VyUHJvbXB0LFxuICAgIH0pO1xuXG4gICAgY3RsLmRlYnVnKFwiUHJvY2Vzc2VkIGNvbnRlbnQgKHByZXZpZXcpOlwiLCBmaW5hbFByb21wdFByZXZpZXcpO1xuXG4gICAgY29uc3QgcGFzc2FnZXNMb2dFbnRyaWVzID0gcmVzdWx0cy5tYXAoKHJlc3VsdCwgaWR4KSA9PiB7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKTtcbiAgICAgIHJldHVybiBgIyR7aWR4ICsgMX0gZmlsZT0ke2ZpbGVOYW1lfSBzY29yZT0ke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfVxcbiR7c3VtbWFyaXplVGV4dChyZXN1bHQudGV4dCl9YDtcbiAgICB9KTtcbiAgICBjb25zdCBwYXNzYWdlc0xvZyA9IHBhc3NhZ2VzTG9nRW50cmllcy5qb2luKFwiXFxuXFxuXCIpO1xuXG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSBSQUcgcGFzc2FnZXMgKCR7cmVzdWx0cy5sZW5ndGh9KSBwcmV2aWV3OlxcbiR7cGFzc2FnZXNMb2d9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogYFJBRyBwYXNzYWdlcyAoJHtyZXN1bHRzLmxlbmd0aH0pOmAsXG4gICAgfSk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBwYXNzYWdlc0xvZ0VudHJpZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBlbnRyeSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gRmluYWwgcHJvbXB0IHNlbnQgdG8gbW9kZWwgKHByZXZpZXcpOlxcbiR7ZmluYWxQcm9tcHRQcmV2aWV3fWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBGaW5hbCBwcm9tcHQgc2VudCB0byBtb2RlbCAocHJldmlldyk6XFxuJHtmaW5hbFByb21wdFByZXZpZXd9YCxcbiAgICB9KTtcblxuICAgIGF3YWl0IHdhcm5JZkNvbnRleHRPdmVyZmxvdyhjdGwsIGZpbmFsUHJvbXB0KTtcblxuICAgIHJldHVybiBmaW5hbFByb21wdDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiW1Byb21wdFByZXByb2Nlc3Nvcl0gUHJlcHJvY2Vzc2luZyBmYWlsZWQuXCIsIGVycm9yKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cbn1cblxuaW50ZXJmYWNlIENvbmZpZ1JlaW5kZXhPcHRzIHtcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyO1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIHJlaW5kZXhSZXF1ZXN0ZWQ6IGJvb2xlYW47XG4gIHNraXBQcmV2aW91c2x5SW5kZXhlZDogYm9vbGVhbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWF5YmVIYW5kbGVDb25maWdUcmlnZ2VyZWRSZWluZGV4KHtcbiAgY3RsLFxuICBkb2N1bWVudHNEaXIsXG4gIHZlY3RvclN0b3JlRGlyLFxuICBjaHVua1NpemUsXG4gIGNodW5rT3ZlcmxhcCxcbiAgbWF4Q29uY3VycmVudCxcbiAgZW5hYmxlT0NSLFxuICBwYXJzZURlbGF5TXMsXG4gIHJlaW5kZXhSZXF1ZXN0ZWQsXG4gIHNraXBQcmV2aW91c2x5SW5kZXhlZCxcbn06IENvbmZpZ1JlaW5kZXhPcHRzKSB7XG4gIGlmICghcmVpbmRleFJlcXVlc3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlbWluZGVyVGV4dCA9XG4gICAgYE1hbnVhbCBSZWluZGV4IFRyaWdnZXIgaXMgT04uIFNraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzIGlzIGN1cnJlbnRseSAke3NraXBQcmV2aW91c2x5SW5kZXhlZCA/IFwiT05cIiA6IFwiT0ZGXCJ9LiBgICtcbiAgICBcIlRoZSBpbmRleCB3aWxsIGJlIHJlYnVpbHQgZWFjaCBjaGF0IHdoZW4gJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPRkYuIElmICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT04sIHRoZSBpbmRleCB3aWxsIG9ubHkgYmUgcmVidWlsdCBmb3IgbmV3IG9yIGNoYW5nZWQgZmlsZXMuXCI7XG4gIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gJHtyZW1pbmRlclRleHR9YCk7XG4gIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgdGV4dDogcmVtaW5kZXJUZXh0LFxuICB9KTtcblxuICBpZiAoIXRyeVN0YXJ0SW5kZXhpbmcoXCJjb25maWctdHJpZ2dlclwiKSkge1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IGFscmVhZHkgcnVubmluZy4gUGxlYXNlIHdhaXQgZm9yIGl0IHRvIGZpbmlzaC5cIixcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgIHRleHQ6IFwiTWFudWFsIHJlaW5kZXggcmVxdWVzdGVkIGZyb20gY29uZmlnLi4uXCIsXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgeyBpbmRleGluZ1Jlc3VsdCB9ID0gYXdhaXQgcnVuSW5kZXhpbmdKb2Ioe1xuICAgICAgY2xpZW50OiBjdGwuY2xpZW50LFxuICAgICAgYWJvcnRTaWduYWw6IGN0bC5hYm9ydFNpZ25hbCxcbiAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgY2h1bmtTaXplLFxuICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgIGVuYWJsZU9DUixcbiAgICAgIGF1dG9SZWluZGV4OiBza2lwUHJldmlvdXNseUluZGV4ZWQsXG4gICAgICBwYXJzZURlbGF5TXMsXG4gICAgICBmb3JjZVJlaW5kZXg6ICFza2lwUHJldmlvdXNseUluZGV4ZWQsXG4gICAgICB2ZWN0b3JTdG9yZTogdmVjdG9yU3RvcmUgPz8gdW5kZWZpbmVkLFxuICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwic2Nhbm5pbmdcIikge1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgdGV4dDogYFNjYW5uaW5nOiAke3Byb2dyZXNzLmN1cnJlbnRGaWxlfWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImluZGV4aW5nXCIpIHtcbiAgICAgICAgICBjb25zdCBzdWNjZXNzID0gcHJvZ3Jlc3Muc3VjY2Vzc2Z1bEZpbGVzID8/IDA7XG4gICAgICAgICAgY29uc3QgZmFpbGVkID0gcHJvZ3Jlc3MuZmFpbGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICBjb25zdCBza2lwcGVkID0gcHJvZ3Jlc3Muc2tpcHBlZEZpbGVzID8/IDA7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmc6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9LyR7cHJvZ3Jlc3MudG90YWxGaWxlc30gZmlsZXMgYCArXG4gICAgICAgICAgICAgIGAoc3VjY2Vzcz0ke3N1Y2Nlc3N9LCBmYWlsZWQ9JHtmYWlsZWR9LCBza2lwcGVkPSR7c2tpcHBlZH0pIGAgK1xuICAgICAgICAgICAgICBgKCR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9KWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBlcnJvcjogJHtwcm9ncmVzcy5lcnJvcn1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IGNvbXBsZXRlIVwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3VtbWFyeUxpbmVzID0gW1xuICAgICAgYFByb2Nlc3NlZDogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc31gLFxuICAgICAgYEZhaWxlZDogJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc31gLFxuICAgICAgYFNraXBwZWQgKHVuY2hhbmdlZCk6ICR7aW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzfWAsXG4gICAgICBgVXBkYXRlZCBleGlzdGluZyBmaWxlczogJHtpbmRleGluZ1Jlc3VsdC51cGRhdGVkRmlsZXN9YCxcbiAgICAgIGBOZXcgZmlsZXMgYWRkZWQ6ICR7aW5kZXhpbmdSZXN1bHQubmV3RmlsZXN9YCxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBzdW1tYXJ5TGluZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBsaW5lLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMgPiAwICYmIGluZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlcyA9PT0gaW5kZXhpbmdSZXN1bHQudG90YWxGaWxlcykge1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IFwiQWxsIGZpbGVzIHdlcmUgYWxyZWFkeSB1cCB0byBkYXRlIChza2lwcGVkKS5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtCaWdSQUddIE1hbnVhbCByZWluZGV4IHN1bW1hcnk6XFxuICAke3N1bW1hcnlMaW5lcy5qb2luKFwiXFxuICBcIil9YCxcbiAgICApO1xuXG4gICAgYXdhaXQgbm90aWZ5TWFudWFsUmVzZXROZWVkZWQoY3RsKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICB0ZXh0OiBgTWFudWFsIHJlaW5kZXggZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgIH0pO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBmaW5pc2hJbmRleGluZygpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcikge1xuICB0cnkge1xuICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICB0aXRsZTogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZWRcIixcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXIgaXMgT04uIFRoZSBpbmRleCB3aWxsIGJlIHJlYnVpbHQgZWFjaCBjaGF0IHdoZW4gJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPRkYuIElmICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT04sIHRoZSBpbmRleCB3aWxsIG9ubHkgYmUgcmVidWlsdCBmb3IgbmV3IG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVW5hYmxlIHRvIHNlbmQgbm90aWZpY2F0aW9uIGFib3V0IG1hbnVhbCByZWluZGV4IHJlc2V0OlwiLCBlcnJvcik7XG4gIH1cbn1cblxuXG4iLCAiaW1wb3J0IHsgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IHByZXByb2Nlc3MgfSBmcm9tIFwiLi9wcm9tcHRQcmVwcm9jZXNzb3JcIjtcblxuLyoqXG4gKiBNYWluIGVudHJ5IHBvaW50IGZvciB0aGUgQmlnIFJBRyBwbHVnaW4uXG4gKiBUaGlzIHBsdWdpbiBpbmRleGVzIGxhcmdlIGRvY3VtZW50IGNvbGxlY3Rpb25zIGFuZCBwcm92aWRlcyBSQUcgY2FwYWJpbGl0aWVzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihjb250ZXh0OiBQbHVnaW5Db250ZXh0KSB7XG4gIC8vIFJlZ2lzdGVyIHRoZSBjb25maWd1cmF0aW9uIHNjaGVtYXRpY3NcbiAgY29udGV4dC53aXRoQ29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgXG4gIC8vIFJlZ2lzdGVyIHRoZSBwcm9tcHQgcHJlcHJvY2Vzc29yXG4gIGNvbnRleHQud2l0aFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgXG4gIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gUGx1Z2luIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseVwiKTtcbn1cblxuIiwgImltcG9ydCB7IExNU3R1ZGlvQ2xpZW50LCB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5kZWNsYXJlIHZhciBwcm9jZXNzOiBhbnk7XG5cbi8vIFdlIHJlY2VpdmUgcnVudGltZSBpbmZvcm1hdGlvbiBpbiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuY29uc3QgY2xpZW50SWRlbnRpZmllciA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX0lERU5USUZJRVI7XG5jb25zdCBjbGllbnRQYXNza2V5ID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfUEFTU0tFWTtcbmNvbnN0IGJhc2VVcmwgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0JBU0VfVVJMO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgTE1TdHVkaW9DbGllbnQoe1xuICBjbGllbnRJZGVudGlmaWVyLFxuICBjbGllbnRQYXNza2V5LFxuICBiYXNlVXJsLFxufSk7XG5cbihnbG9iYWxUaGlzIGFzIGFueSkuX19MTVNfUExVR0lOX0NPTlRFWFQgPSB0cnVlO1xuXG5sZXQgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gZmFsc2U7XG5sZXQgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gZmFsc2U7XG5sZXQgY29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCB0b29sc1Byb3ZpZGVyU2V0ID0gZmFsc2U7XG5sZXQgZ2VuZXJhdG9yU2V0ID0gZmFsc2U7XG5cbmNvbnN0IHNlbGZSZWdpc3RyYXRpb25Ib3N0ID0gY2xpZW50LnBsdWdpbnMuZ2V0U2VsZlJlZ2lzdHJhdGlvbkhvc3QoKTtcblxuY29uc3QgcGx1Z2luQ29udGV4dDogUGx1Z2luQ29udGV4dCA9IHtcbiAgd2l0aFByZWRpY3Rpb25Mb29wSGFuZGxlcjogKGdlbmVyYXRlKSA9PiB7XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgdG9vbHMgcHJvdmlkZXJcIik7XG4gICAgfVxuXG4gICAgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcmVkaWN0aW9uTG9vcEhhbmRsZXIoZ2VuZXJhdGUpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoUHJvbXB0UHJlcHJvY2Vzc29yOiAocHJlcHJvY2VzcykgPT4ge1xuICAgIGlmIChwcm9tcHRQcmVwcm9jZXNzb3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21wdFByZXByb2Nlc3NvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIHByb21wdFByZXByb2Nlc3NvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoQ29uZmlnU2NoZW1hdGljczogKGNvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoY29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBjb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2xvYmFsQ29uZmlnU2NoZW1hdGljczogKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2xvYmFsIGNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2xvYmFsQ29uZmlnU2NoZW1hdGljcyhnbG9iYWxDb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFRvb2xzUHJvdmlkZXI6ICh0b29sc1Byb3ZpZGVyKSA9PiB7XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHByZWRpY3Rpb25Mb29wSGFuZGxlclwiKTtcbiAgICB9XG5cbiAgICB0b29sc1Byb3ZpZGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2VuZXJhdG9yOiAoZ2VuZXJhdG9yKSA9PiB7XG4gICAgaWYgKGdlbmVyYXRvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0b3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdlbmVyYXRvcihnZW5lcmF0b3IpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxufTtcblxuaW1wb3J0KFwiLi8uLi9zcmMvaW5kZXgudHNcIikudGhlbihhc3luYyBtb2R1bGUgPT4ge1xuICByZXR1cm4gYXdhaXQgbW9kdWxlLm1haW4ocGx1Z2luQ29udGV4dCk7XG59KS50aGVuKCgpID0+IHtcbiAgc2VsZlJlZ2lzdHJhdGlvbkhvc3QuaW5pdENvbXBsZXRlZCgpO1xufSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgcGx1Z2luLlwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0JBRWEseUJBUUE7QUFWYjtBQUFBO0FBQUE7QUFBQSxpQkFBdUM7QUFFaEMsSUFBTSwwQkFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRaEMsSUFBTSx1QkFBbUIsbUNBQXVCLEVBQ3BEO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixhQUFhO0FBQUEsTUFDZjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBRyxLQUFLLElBQUksTUFBTSxFQUFFO0FBQUEsTUFDckM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxHQUFLLEtBQUssR0FBSyxNQUFNLEtBQUs7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEtBQUssS0FBSyxNQUFNLE1BQU0sSUFBSTtBQUFBLE1BQzNDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBRyxLQUFLLEtBQUssTUFBTSxHQUFHO0FBQUEsTUFDdkM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEs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QUFBLElBQzlFO0FBRUEsdUJBQW1CO0FBQ25CLHlCQUFxQixpQkFBaUIsYUFBYTtBQUNuRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsZUFBZSxDQUFDLGNBQWM7QUFDNUIsUUFBSSxjQUFjO0FBQ2hCLFlBQU0sSUFBSSxNQUFNLDhCQUE4QjtBQUFBLElBQ2hEO0FBRUEsbUJBQWU7QUFDZix5QkFBcUIsYUFBYSxTQUFTO0FBQzNDLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSx3REFBNEIsS0FBSyxPQUFNQyxZQUFVO0FBQy9DLFNBQU8sTUFBTUEsUUFBTyxLQUFLLGFBQWE7QUFDeEMsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUNaLHVCQUFxQixjQUFjO0FBQ3JDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNsQixVQUFRLE1BQU0sb0RBQW9EO0FBQ2xFLFVBQVEsTUFBTSxLQUFLO0FBQ3JCLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgImZzIiwgInBhdGgiLCAiZnMiLCAiY2xpZW50IiwgInJlc29sdmUiLCAicGRmUGFyc2UiLCAiZnMiLCAicmVzb2x2ZSIsICJpbXBvcnRfdGVzc2VyYWN0IiwgImZzIiwgImNsaWVudCIsICJwYXRoIiwgImNodW5rVGV4dCIsICJyZXNvbHZlIiwgImZzIiwgImZzIiwgInBhdGgiLCAiZnMiLCAicGF0aCIsICJQUXVldWUiLCAidmVjdG9yU3RvcmUiLCAiY2xpZW50IiwgInJlc29sdmUiLCAiY2xpZW50IiwgInZlY3RvclN0b3JlIiwgInBhdGgiLCAiaW1wb3J0X3NkayIsICJwcmVwcm9jZXNzIiwgImNvbmZpZ1NjaGVtYXRpY3MiLCAibW9kdWxlIl0KfQo=
