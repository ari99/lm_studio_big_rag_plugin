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
          this.options.abortSignal?.throwIfAborted();
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
          const abortSignal = this.options.abortSignal;
          const onAbort = () => this.queue.clear();
          if (abortSignal) {
            abortSignal.addEventListener("abort", onAbort, { once: true });
          }
          const tasks = files.map(
            (file) => this.queue.add(async () => {
              abortSignal?.throwIfAborted();
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
          if (abortSignal) {
            abortSignal.removeEventListener("abort", onAbort);
          }
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
            this.options.abortSignal?.throwIfAborted();
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vZmlsZVNjYW5uZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvaHRtbFBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9wZGZQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZXB1YlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9pbWFnZVBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy90ZXh0UGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2RvY3VtZW50UGFyc2VyLnRzIiwgIi4uL3NyYy91dGlscy90ZXh0Q2h1bmtlci50cyIsICIuLi9zcmMvdXRpbHMvZmlsZUhhc2gudHMiLCAiLi4vc3JjL3V0aWxzL2ZhaWxlZEZpbGVSZWdpc3RyeS50cyIsICIuLi9zcmMvaW5nZXN0aW9uL2luZGV4TWFuYWdlci50cyIsICIuLi9zcmMvaW5nZXN0aW9uL3J1bkluZGV4aW5nLnRzIiwgIi4uL3NyYy9wcm9tcHRQcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFID0gYHt7cmFnX2NvbnRleHR9fVxuXG5Vc2UgdGhlIGNpdGF0aW9ucyBhYm92ZSB0byByZXNwb25kIHRvIHRoZSB1c2VyIHF1ZXJ5LCBvbmx5IGlmIHRoZXkgYXJlIHJlbGV2YW50LiBPdGhlcndpc2UsIHJlc3BvbmQgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5IHdpdGhvdXQgdGhlbS5cblxuVXNlciBRdWVyeTpcblxue3t1c2VyX3F1ZXJ5fX1gO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJkb2N1bWVudHNEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkRvY3VtZW50cyBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIlJvb3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgZG9jdW1lbnRzIHRvIGluZGV4LiBBbGwgc3ViZGlyZWN0b3JpZXMgd2lsbCBiZSBzY2FubmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vZG9jdW1lbnRzXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInZlY3RvclN0b3JlRGlyZWN0b3J5XCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJWZWN0b3IgU3RvcmUgRGlyZWN0b3J5XCIsXG4gICAgICBzdWJ0aXRsZTogXCJEaXJlY3Rvcnkgd2hlcmUgdGhlIHZlY3RvciBkYXRhYmFzZSB3aWxsIGJlIHN0b3JlZC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIi9wYXRoL3RvL3ZlY3Rvci9zdG9yZVwiLFxuICAgIH0sXG4gICAgXCJcIixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxMaW1pdFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgTGltaXRcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGNodW5rcyB0byByZXR1cm4gZHVyaW5nIHJldHJpZXZhbC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEsIG1heDogMjAsIHN0ZXA6IDEgfSxcbiAgICB9LFxuICAgIDUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicmV0cmlldmFsQWZmaW5pdHlUaHJlc2hvbGRcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBtaW46IDAuMCxcbiAgICAgIG1heDogMS4wLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUmV0cmlldmFsIEFmZmluaXR5IFRocmVzaG9sZFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWluaW11bSBzaW1pbGFyaXR5IHNjb3JlIGZvciBhIGNodW5rIHRvIGJlIGNvbnNpZGVyZWQgcmVsZXZhbnQuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLjAsIG1heDogMS4wLCBzdGVwOiAwLjAxIH0sXG4gICAgfSxcbiAgICAwLjUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtTaXplXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxMjgsXG4gICAgICBtYXg6IDIwNDgsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBTaXplXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTaXplIG9mIHRleHQgY2h1bmtzIGZvciBlbWJlZGRpbmcgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxMjgsIG1heDogMjA0OCwgc3RlcDogMTI4IH0sXG4gICAgfSxcbiAgICA1MTIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtPdmVybGFwXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiA1MTIsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBPdmVybGFwXCIsXG4gICAgICBzdWJ0aXRsZTogXCJPdmVybGFwIGJldHdlZW4gY29uc2VjdXRpdmUgY2h1bmtzIChpbiB0b2tlbnMpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MTIsIHN0ZXA6IDMyIH0sXG4gICAgfSxcbiAgICAxMDAsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWF4Q29uY3VycmVudEZpbGVzXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAxMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1heCBDb25jdXJyZW50IEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0byBwcm9jZXNzIGNvbmN1cnJlbnRseSBkdXJpbmcgaW5kZXhpbmcuIFJlY29tbWVuZCAxIGZvciBsYXJnZSBQREYgZGF0YXNldHMuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxLCBtYXg6IDEwLCBzdGVwOiAxIH0sXG4gICAgfSxcbiAgICAxLFxuICApXG4gIC5maWVsZChcbiAgICBcInBhcnNlRGVsYXlNc1wiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogNTAwMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlBhcnNlciBEZWxheSAobXMpXCIsXG4gICAgICBzdWJ0aXRsZTogXCJXYWl0IHRpbWUgYmVmb3JlIHBhcnNpbmcgZWFjaCBkb2N1bWVudCAoaGVscHMgYXZvaWQgV2ViU29ja2V0IHRocm90dGxpbmcpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MDAwLCBzdGVwOiAxMDAgfSxcbiAgICB9LFxuICAgIDUwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJlbmFibGVPQ1JcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgT0NSXCIsXG4gICAgICBzdWJ0aXRsZTogXCJFbmFibGUgT0NSIGZvciBpbWFnZSBmaWxlcyBhbmQgaW1hZ2UtYmFzZWQgUERGcyB1c2luZyBMTSBTdHVkaW8ncyBidWlsdC1pbiBkb2N1bWVudCBwYXJzZXIuXCIsXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXJcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlRvZ2dsZSBPTiB0byByZXF1ZXN0IGFuIGltbWVkaWF0ZSByZWluZGV4LiBUaGUgcGx1Z2luIHJlc2V0cyB0aGlzIGFmdGVyIHJ1bm5pbmcuIFVzZSB0aGUgXHUyMDFDU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcdTIwMUQgb3B0aW9uIGJlbG93IHRvIGNvbnRyb2wgd2hldGhlciB1bmNoYW5nZWQgZmlsZXMgYXJlIHNraXBwZWQuXCIsXG4gICAgfSxcbiAgICBmYWxzZSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlNraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTa2lwIHVuY2hhbmdlZCBmaWxlcyBmb3IgZmFzdGVyIG1hbnVhbCBydW5zLiBPbmx5IGluZGV4ZXMgbmV3IGZpbGVzIG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJtYW51YWxSZWluZGV4LnRyaWdnZXJcIixcbiAgICAgICAgICBjb25kaXRpb246IHsgdHlwZTogXCJlcXVhbHNcIiwgdmFsdWU6IHRydWUgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcInByb21wdFRlbXBsYXRlXCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJQcm9tcHQgVGVtcGxhdGVcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlN1cHBvcnRzIHt7cmFnX2NvbnRleHR9fSAocmVxdWlyZWQpIGFuZCB7e3VzZXJfcXVlcnl9fSBtYWNyb3MgZm9yIGN1c3RvbWl6aW5nIHRoZSBmaW5hbCBwcm9tcHQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogREVGQVVMVF9QUk9NUFRfVEVNUExBVEUsXG4gICAgICBpc1BhcmFncmFwaDogdHJ1ZSxcbiAgICB9LFxuICAgIERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFLFxuICApXG4gIC5idWlsZCgpO1xuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzL3Byb21pc2VzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBMb2NhbEluZGV4IH0gZnJvbSBcInZlY3RyYVwiO1xuXG5jb25zdCBNQVhfSVRFTVNfUEVSX1NIQVJEID0gMTAwMDA7XG5jb25zdCBTSEFSRF9ESVJfUFJFRklYID0gXCJzaGFyZF9cIjtcbmNvbnN0IFNIQVJEX0RJUl9SRUdFWCA9IC9ec2hhcmRfKFxcZCspJC87XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9jdW1lbnRDaHVuayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgdmVjdG9yOiBudW1iZXJbXTtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBtZXRhZGF0YTogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNjb3JlOiBudW1iZXI7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGNodW5rSW5kZXg6IG51bWJlcjtcbiAgc2hhcmROYW1lOiBzdHJpbmc7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG50eXBlIENodW5rTWV0YWRhdGEgPSB7XG4gIHRleHQ6IHN0cmluZztcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG5leHBvcnQgY2xhc3MgVmVjdG9yU3RvcmUge1xuICBwcml2YXRlIGRiUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHNoYXJkRGlyczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBhY3RpdmVTaGFyZDogTG9jYWxJbmRleCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVNoYXJkQ291bnQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgdXBkYXRlTXV0ZXg6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3RvcihkYlBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuZGJQYXRoID0gcGF0aC5yZXNvbHZlKGRiUGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbiBhIHNoYXJkIGJ5IGRpcmVjdG9yeSBuYW1lIChlLmcuIFwic2hhcmRfMDAwXCIpLiBDYWxsZXIgbXVzdCBub3QgaG9sZCB0aGUgcmVmZXJlbmNlXG4gICAqIGFmdGVyIHVzZSBzbyBHQyBjYW4gZnJlZSB0aGUgcGFyc2VkIGluZGV4IGRhdGEuXG4gICAqL1xuICBwcml2YXRlIG9wZW5TaGFyZChkaXI6IHN0cmluZyk6IExvY2FsSW5kZXgge1xuICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBkaXIpO1xuICAgIHJldHVybiBuZXcgTG9jYWxJbmRleChmdWxsUGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogU2NhbiBkYlBhdGggZm9yIHNoYXJkX05OTiBkaXJlY3RvcmllcyBhbmQgcmV0dXJuIHNvcnRlZCBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBkaXNjb3ZlclNoYXJkRGlycygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXIodGhpcy5kYlBhdGgsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICBjb25zdCBkaXJzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZSBvZiBlbnRyaWVzKSB7XG4gICAgICBpZiAoZS5pc0RpcmVjdG9yeSgpICYmIFNIQVJEX0RJUl9SRUdFWC50ZXN0KGUubmFtZSkpIHtcbiAgICAgICAgZGlycy5wdXNoKGUubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGRpcnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgY29uc3QgbiA9IChtOiBzdHJpbmcpID0+IHBhcnNlSW50KG0ubWF0Y2goU0hBUkRfRElSX1JFR0VYKSFbMV0sIDEwKTtcbiAgICAgIHJldHVybiBuKGEpIC0gbihiKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGlycztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSB2ZWN0b3Igc3RvcmU6IGRpc2NvdmVyIG9yIGNyZWF0ZSBzaGFyZHMsIG9wZW4gdGhlIGxhc3QgYXMgYWN0aXZlLlxuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRiUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgdGhpcy5zaGFyZERpcnMgPSBhd2FpdCB0aGlzLmRpc2NvdmVyU2hhcmREaXJzKCk7XG5cbiAgICBpZiAodGhpcy5zaGFyZERpcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBmaXJzdERpciA9IGAke1NIQVJEX0RJUl9QUkVGSVh9MDAwYDtcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBmaXJzdERpcik7XG4gICAgICBjb25zdCBpbmRleCA9IG5ldyBMb2NhbEluZGV4KGZ1bGxQYXRoKTtcbiAgICAgIGF3YWl0IGluZGV4LmNyZWF0ZUluZGV4KHsgdmVyc2lvbjogMSB9KTtcbiAgICAgIHRoaXMuc2hhcmREaXJzID0gW2ZpcnN0RGlyXTtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBpbmRleDtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxhc3REaXIgPSB0aGlzLnNoYXJkRGlyc1t0aGlzLnNoYXJkRGlycy5sZW5ndGggLSAxXTtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmQgPSB0aGlzLm9wZW5TaGFyZChsYXN0RGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5hY3RpdmVTaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IGl0ZW1zLmxlbmd0aDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBkb2N1bWVudCBjaHVua3MgdG8gdGhlIGFjdGl2ZSBzaGFyZC4gUm90YXRlcyB0byBhIG5ldyBzaGFyZCB3aGVuIGZ1bGwuXG4gICAqL1xuICBhc3luYyBhZGRDaHVua3MoY2h1bmtzOiBEb2N1bWVudENodW5rW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlU2hhcmQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlZlY3RvciBzdG9yZSBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgfVxuICAgIGlmIChjaHVua3MubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICB0aGlzLnVwZGF0ZU11dGV4ID0gdGhpcy51cGRhdGVNdXRleC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLmJlZ2luVXBkYXRlKCk7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhOiBDaHVua01ldGFkYXRhID0ge1xuICAgICAgICAgICAgdGV4dDogY2h1bmsudGV4dCxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBjaHVuay5maWxlUGF0aCxcbiAgICAgICAgICAgIGZpbGVOYW1lOiBjaHVuay5maWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVIYXNoOiBjaHVuay5maWxlSGFzaCxcbiAgICAgICAgICAgIGNodW5rSW5kZXg6IGNodW5rLmNodW5rSW5kZXgsXG4gICAgICAgICAgICAuLi5jaHVuay5tZXRhZGF0YSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLnVwc2VydEl0ZW0oe1xuICAgICAgICAgICAgaWQ6IGNodW5rLmlkLFxuICAgICAgICAgICAgdmVjdG9yOiBjaHVuay52ZWN0b3IsXG4gICAgICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkIS5lbmRVcGRhdGUoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZCEuY2FuY2VsVXBkYXRlKCk7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgKz0gY2h1bmtzLmxlbmd0aDtcbiAgICAgIGNvbnNvbGUubG9nKGBBZGRlZCAke2NodW5rcy5sZW5ndGh9IGNodW5rcyB0byB2ZWN0b3Igc3RvcmVgKTtcblxuICAgICAgaWYgKHRoaXMuYWN0aXZlU2hhcmRDb3VudCA+PSBNQVhfSVRFTVNfUEVSX1NIQVJEKSB7XG4gICAgICAgIGNvbnN0IG5leHROdW0gPSB0aGlzLnNoYXJkRGlycy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IG5leHREaXIgPSBgJHtTSEFSRF9ESVJfUFJFRklYfSR7U3RyaW5nKG5leHROdW0pLnBhZFN0YXJ0KDMsIFwiMFwiKX1gO1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbih0aGlzLmRiUGF0aCwgbmV4dERpcik7XG4gICAgICAgIGNvbnN0IG5ld0luZGV4ID0gbmV3IExvY2FsSW5kZXgoZnVsbFBhdGgpO1xuICAgICAgICBhd2FpdCBuZXdJbmRleC5jcmVhdGVJbmRleCh7IHZlcnNpb246IDEgfSk7XG4gICAgICAgIHRoaXMuc2hhcmREaXJzLnB1c2gobmV4dERpcik7XG4gICAgICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBuZXdJbmRleDtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gMDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZU11dGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaDogcXVlcnkgZWFjaCBzaGFyZCBpbiB0dXJuLCBtZXJnZSByZXN1bHRzLCBzb3J0IGJ5IHNjb3JlLCBmaWx0ZXIgYnkgdGhyZXNob2xkLCByZXR1cm4gdG9wIGxpbWl0LlxuICAgKi9cbiAgYXN5bmMgc2VhcmNoKFxuICAgIHF1ZXJ5VmVjdG9yOiBudW1iZXJbXSxcbiAgICBsaW1pdDogbnVtYmVyID0gNSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDAuNSxcbiAgKTogUHJvbWlzZTxTZWFyY2hSZXN1bHRbXT4ge1xuICAgIGNvbnN0IG1lcmdlZDogU2VhcmNoUmVzdWx0W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNoYXJkLnF1ZXJ5SXRlbXMoXG4gICAgICAgIHF1ZXJ5VmVjdG9yLFxuICAgICAgICBcIlwiLFxuICAgICAgICBsaW1pdCxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICBmYWxzZSxcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IHIgb2YgcmVzdWx0cykge1xuICAgICAgICBjb25zdCBtID0gci5pdGVtLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGE7XG4gICAgICAgIG1lcmdlZC5wdXNoKHtcbiAgICAgICAgICB0ZXh0OiBtPy50ZXh0ID8/IFwiXCIsXG4gICAgICAgICAgc2NvcmU6IHIuc2NvcmUsXG4gICAgICAgICAgZmlsZVBhdGg6IG0/LmZpbGVQYXRoID8/IFwiXCIsXG4gICAgICAgICAgZmlsZU5hbWU6IG0/LmZpbGVOYW1lID8/IFwiXCIsXG4gICAgICAgICAgY2h1bmtJbmRleDogbT8uY2h1bmtJbmRleCA/PyAwLFxuICAgICAgICAgIHNoYXJkTmFtZTogZGlyLFxuICAgICAgICAgIG1ldGFkYXRhOiAoci5pdGVtLm1ldGFkYXRhIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pID8/IHt9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZFxuICAgICAgLmZpbHRlcigocikgPT4gci5zY29yZSA+PSB0aHJlc2hvbGQpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpXG4gICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbGwgY2h1bmtzIGZvciBhIGZpbGUgKGJ5IGhhc2gpIGFjcm9zcyBhbGwgc2hhcmRzLlxuICAgKi9cbiAgYXN5bmMgZGVsZXRlQnlGaWxlSGFzaChmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGFzdERpciA9IHRoaXMuc2hhcmREaXJzW3RoaXMuc2hhcmREaXJzLmxlbmd0aCAtIDFdO1xuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgICBjb25zdCB0b0RlbGV0ZSA9IGl0ZW1zLmZpbHRlcihcbiAgICAgICAgICAoaSkgPT4gKGkubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YSk/LmZpbGVIYXNoID09PSBmaWxlSGFzaCxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRvRGVsZXRlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhd2FpdCBzaGFyZC5iZWdpblVwZGF0ZSgpO1xuICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0b0RlbGV0ZSkge1xuICAgICAgICAgICAgYXdhaXQgc2hhcmQuZGVsZXRlSXRlbShpdGVtLmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgc2hhcmQuZW5kVXBkYXRlKCk7XG4gICAgICAgICAgaWYgKGRpciA9PT0gbGFzdERpciAmJiB0aGlzLmFjdGl2ZVNoYXJkKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgPSAoYXdhaXQgdGhpcy5hY3RpdmVTaGFyZC5saXN0SXRlbXMoKSkubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYERlbGV0ZWQgY2h1bmtzIGZvciBmaWxlIGhhc2g6ICR7ZmlsZUhhc2h9YCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZpbGUgcGF0aCAtPiBzZXQgb2YgZmlsZSBoYXNoZXMgY3VycmVudGx5IGluIHRoZSBzdG9yZS5cbiAgICovXG4gIGFzeW5jIGdldEZpbGVIYXNoSW52ZW50b3J5KCk6IFByb21pc2U8TWFwPHN0cmluZywgU2V0PHN0cmluZz4+PiB7XG4gICAgY29uc3QgaW52ZW50b3J5ID0gbmV3IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PigpO1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IG0gPSBpdGVtLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGE7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gbT8uZmlsZVBhdGg7XG4gICAgICAgIGNvbnN0IGZpbGVIYXNoID0gbT8uZmlsZUhhc2g7XG4gICAgICAgIGlmICghZmlsZVBhdGggfHwgIWZpbGVIYXNoKSBjb250aW51ZTtcbiAgICAgICAgbGV0IHNldCA9IGludmVudG9yeS5nZXQoZmlsZVBhdGgpO1xuICAgICAgICBpZiAoIXNldCkge1xuICAgICAgICAgIHNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICAgIGludmVudG9yeS5zZXQoZmlsZVBhdGgsIHNldCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0LmFkZChmaWxlSGFzaCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbnZlbnRvcnk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRvdGFsIGNodW5rIGNvdW50IGFuZCB1bmlxdWUgZmlsZSBjb3VudC5cbiAgICovXG4gIGFzeW5jIGdldFN0YXRzKCk6IFByb21pc2U8e1xuICAgIHRvdGFsQ2h1bmtzOiBudW1iZXI7XG4gICAgdW5pcXVlRmlsZXM6IG51bWJlcjtcbiAgfT4ge1xuICAgIGxldCB0b3RhbENodW5rcyA9IDA7XG4gICAgY29uc3QgdW5pcXVlSGFzaGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgIGNvbnN0IHNoYXJkID0gdGhpcy5vcGVuU2hhcmQoZGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICB0b3RhbENodW5rcyArPSBpdGVtcy5sZW5ndGg7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgaCA9IChpdGVtLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGEpPy5maWxlSGFzaDtcbiAgICAgICAgaWYgKGgpIHVuaXF1ZUhhc2hlcy5hZGQoaCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHRvdGFsQ2h1bmtzLCB1bmlxdWVGaWxlczogdW5pcXVlSGFzaGVzLnNpemUgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbnkgY2h1bmsgZXhpc3RzIGZvciB0aGUgZ2l2ZW4gZmlsZSBoYXNoIChzaG9ydC1jaXJjdWl0cyBvbiBmaXJzdCBtYXRjaCkuXG4gICAqL1xuICBhc3luYyBoYXNGaWxlKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBzaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIGlmIChpdGVtcy5zb21lKChpKSA9PiAoaS5tZXRhZGF0YSBhcyBDaHVua01ldGFkYXRhKT8uZmlsZUhhc2ggPT09IGZpbGVIYXNoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2UgdGhlIGFjdGl2ZSBzaGFyZCByZWZlcmVuY2UuXG4gICAqL1xuICBhc3luYyBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmFjdGl2ZVNoYXJkID0gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgb3MgZnJvbSBcIm9zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FuaXR5Q2hlY2tSZXN1bHQge1xuICBwYXNzZWQ6IGJvb2xlYW47XG4gIHdhcm5pbmdzOiBzdHJpbmdbXTtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtIHNhbml0eSBjaGVja3MgYmVmb3JlIGluZGV4aW5nIGxhcmdlIGRpcmVjdG9yaWVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwZXJmb3JtU2FuaXR5Q2hlY2tzKFxuICBkb2N1bWVudHNEaXI6IHN0cmluZyxcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZyxcbik6IFByb21pc2U8U2FuaXR5Q2hlY2tSZXN1bHQ+IHtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBDaGVjayBpZiBkaXJlY3RvcmllcyBleGlzdFxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2Vzcyhkb2N1bWVudHNEaXIsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgZXJyb3JzLnB1c2goYERvY3VtZW50cyBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Qgb3IgaXMgbm90IHJlYWRhYmxlOiAke2RvY3VtZW50c0Rpcn1gKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKHZlY3RvclN0b3JlRGlyLCBmcy5jb25zdGFudHMuV19PSyk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIFRyeSB0byBjcmVhdGUgaXRcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIodmVjdG9yU3RvcmVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgIGBWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0IGFuZCBjYW5ub3QgYmUgY3JlYXRlZDogJHt2ZWN0b3JTdG9yZURpcn1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBkaXNrIHNwYWNlXG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0ZnModmVjdG9yU3RvcmVEaXIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUdCID0gKHN0YXRzLmJhdmFpbCAqIHN0YXRzLmJzaXplKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICAgIFxuICAgIGlmIChhdmFpbGFibGVHQiA8IDEpIHtcbiAgICAgIGVycm9ycy5wdXNoKGBWZXJ5IGxvdyBkaXNrIHNwYWNlIGF2YWlsYWJsZTogJHthdmFpbGFibGVHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH0gZWxzZSBpZiAoYXZhaWxhYmxlR0IgPCAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaChgTG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgY2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcIik7XG4gIH1cblxuICAvLyBDaGVjayBhdmFpbGFibGUgbWVtb3J5XG4gIGNvbnN0IGZyZWVNZW1vcnlHQiA9IG9zLmZyZWVtZW0oKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICBjb25zdCB0b3RhbE1lbW9yeUdCID0gb3MudG90YWxtZW0oKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICBjb25zdCBydW5uaW5nT25NYWMgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiO1xuICBjb25zdCBsb3dNZW1vcnlNZXNzYWdlID1cbiAgICBgTG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQiBvZiAke3RvdGFsTWVtb3J5R0IudG9GaXhlZCgyKX0gR0IgdG90YWwuIGAgK1xuICAgIFwiQ29uc2lkZXIgcmVkdWNpbmcgY29uY3VycmVudCBmaWxlIHByb2Nlc3NpbmcuXCI7XG4gIGNvbnN0IHZlcnlMb3dNZW1vcnlNZXNzYWdlID1cbiAgICBgVmVyeSBsb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCLiBgICtcbiAgICAocnVubmluZ09uTWFjXG4gICAgICA/IFwibWFjT1MgbWF5IGJlIHJlcG9ydGluZyBjYWNoZWQgcGFnZXMgYXMgdXNlZDsgY2FjaGVkIG1lbW9yeSBjYW4gdXN1YWxseSBiZSByZWNsYWltZWQgYXV0b21hdGljYWxseS5cIlxuICAgICAgOiBcIkluZGV4aW5nIG1heSBmYWlsIGR1ZSB0byBpbnN1ZmZpY2llbnQgUkFNLlwiKTtcblxuICBpZiAoZnJlZU1lbW9yeUdCIDwgMC41KSB7XG4gICAgaWYgKHJ1bm5pbmdPbk1hYykge1xuICAgICAgd2FybmluZ3MucHVzaCh2ZXJ5TG93TWVtb3J5TWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9ycy5wdXNoKGBWZXJ5IGxvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCIDwgMikge1xuICAgIHdhcm5pbmdzLnB1c2gobG93TWVtb3J5TWVzc2FnZSk7XG4gIH1cblxuICAvLyBFc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZSAoc2FtcGxlLWJhc2VkIGZvciBwZXJmb3JtYW5jZSlcbiAgdHJ5IHtcbiAgICBjb25zdCBzYW1wbGVTaXplID0gYXdhaXQgZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRvY3VtZW50c0Rpcik7XG4gICAgY29uc3QgZXN0aW1hdGVkR0IgPSBzYW1wbGVTaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGVzdGltYXRlZEdCID4gMTAwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTGFyZ2UgZGlyZWN0b3J5IGRldGVjdGVkICh+JHtlc3RpbWF0ZWRHQi50b0ZpeGVkKDEpfSBHQikuIEluaXRpYWwgaW5kZXhpbmcgbWF5IHRha2Ugc2V2ZXJhbCBob3Vycy5gXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoZXN0aW1hdGVkR0IgPiAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgYE1lZGl1bS1zaXplZCBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSAzMC02MCBtaW51dGVzLmBcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgZXN0aW1hdGUgZGlyZWN0b3J5IHNpemVcIik7XG4gIH1cblxuICAvLyBDaGVjayBpZiB2ZWN0b3Igc3RvcmUgYWxyZWFkeSBoYXMgZGF0YVxuICB0cnkge1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcih2ZWN0b3JTdG9yZURpcik7XG4gICAgaWYgKGZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIFwiVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBpcyBub3QgZW1wdHkuIEV4aXN0aW5nIGRhdGEgd2lsbCBiZSB1c2VkIGZvciBpbmNyZW1lbnRhbCBpbmRleGluZy5cIlxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIERpcmVjdG9yeSBkb2Vzbid0IGV4aXN0IHlldCwgdGhhdCdzIGZpbmVcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGFzc2VkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIHdhcm5pbmdzLFxuICAgIGVycm9ycyxcbiAgfTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZSBieSBzYW1wbGluZ1xuICogKFF1aWNrIGVzdGltYXRlLCBub3QgZXhhY3QpXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVzdGltYXRlRGlyZWN0b3J5U2l6ZShkaXI6IHN0cmluZywgbWF4U2FtcGxlczogbnVtYmVyID0gMTAwKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgbGV0IHRvdGFsU2l6ZSA9IDA7XG4gIGxldCBmaWxlQ291bnQgPSAwO1xuICBsZXQgc2FtcGxlZFNpemUgPSAwO1xuICBsZXQgc2FtcGxlZENvdW50ID0gMDtcblxuICBhc3luYyBmdW5jdGlvbiB3YWxrKGN1cnJlbnREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcihjdXJyZW50RGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoc2FtcGxlZENvdW50ID49IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gYCR7Y3VycmVudERpcn0vJHtlbnRyeS5uYW1lfWA7XG5cbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIGZpbGVDb3VudCsrO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChzYW1wbGVkQ291bnQgPCBtYXhTYW1wbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgICBzYW1wbGVkU2l6ZSArPSBzdGF0cy5zaXplO1xuICAgICAgICAgICAgICBzYW1wbGVkQ291bnQrKztcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBTa2lwIGZpbGVzIHdlIGNhbid0IHN0YXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFNraXAgZGlyZWN0b3JpZXMgd2UgY2FuJ3QgcmVhZFxuICAgIH1cbiAgfVxuXG4gIGF3YWl0IHdhbGsoZGlyKTtcblxuICAvLyBFeHRyYXBvbGF0ZSBmcm9tIHNhbXBsZVxuICBpZiAoc2FtcGxlZENvdW50ID4gMCAmJiBmaWxlQ291bnQgPiAwKSB7XG4gICAgY29uc3QgYXZnRmlsZVNpemUgPSBzYW1wbGVkU2l6ZSAvIHNhbXBsZWRDb3VudDtcbiAgICB0b3RhbFNpemUgPSBhdmdGaWxlU2l6ZSAqIGZpbGVDb3VudDtcbiAgfVxuXG4gIHJldHVybiB0b3RhbFNpemU7XG59XG5cbi8qKlxuICogQ2hlY2sgc3lzdGVtIHJlc291cmNlcyBhbmQgcHJvdmlkZSByZWNvbW1lbmRhdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc291cmNlUmVjb21tZW5kYXRpb25zKFxuICBlc3RpbWF0ZWRTaXplR0I6IG51bWJlcixcbiAgZnJlZU1lbW9yeUdCOiBudW1iZXIsXG4pOiB7XG4gIHJlY29tbWVuZGVkQ29uY3VycmVuY3k6IG51bWJlcjtcbiAgcmVjb21tZW5kZWRDaHVua1NpemU6IG51bWJlcjtcbiAgZXN0aW1hdGVkVGltZTogc3RyaW5nO1xufSB7XG4gIGxldCByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMztcbiAgbGV0IHJlY29tbWVuZGVkQ2h1bmtTaXplID0gNTEyO1xuICBsZXQgZXN0aW1hdGVkVGltZSA9IFwidW5rbm93blwiO1xuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBhdmFpbGFibGUgbWVtb3J5XG4gIGlmIChmcmVlTWVtb3J5R0IgPCAyKSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDE7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCIDwgNCkge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAyO1xuICB9IGVsc2UgaWYgKGZyZWVNZW1vcnlHQiA+PSA4KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDU7XG4gIH1cblxuICAvLyBBZGp1c3QgYmFzZWQgb24gZGF0YXNldCBzaXplXG4gIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNS0xNSBtaW51dGVzXCI7XG4gIH0gZWxzZSBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMTApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIzMC02MCBtaW51dGVzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSA3Njg7XG4gIH0gZWxzZSBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMTAwKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiMi00IGhvdXJzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSAxMDI0O1xuICB9IGVsc2Uge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjQtMTIgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IE1hdGgubWluKHJlY29tbWVuZGVkQ29uY3VycmVuY3ksIDMpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5LFxuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplLFxuICAgIGVzdGltYXRlZFRpbWUsXG4gIH07XG59XG5cbiIsICJsZXQgaW5kZXhpbmdJblByb2dyZXNzID0gZmFsc2U7XG5cbi8qKlxuICogQXR0ZW1wdCB0byBhY3F1aXJlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqIFJldHVybnMgdHJ1ZSBpZiBubyBvdGhlciBpbmRleGluZyBqb2IgaXMgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeVN0YXJ0SW5kZXhpbmcoY29udGV4dDogc3RyaW5nID0gXCJ1bmtub3duXCIpOiBib29sZWFuIHtcbiAgaWYgKGluZGV4aW5nSW5Qcm9ncmVzcykge1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIGZhaWxlZDogbG9jayBhbHJlYWR5IGhlbGRgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSB0cnVlO1xuICBjb25zb2xlLmRlYnVnKGBbQmlnUkFHXSB0cnlTdGFydEluZGV4aW5nICgke2NvbnRleHR9KSBzdWNjZWVkZWRgKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmVsZWFzZSB0aGUgc2hhcmVkIGluZGV4aW5nIGxvY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5pc2hJbmRleGluZygpOiB2b2lkIHtcbiAgaW5kZXhpbmdJblByb2dyZXNzID0gZmFsc2U7XG4gIGNvbnNvbGUuZGVidWcoXCJbQmlnUkFHXSBmaW5pc2hJbmRleGluZzogbG9jayByZWxlYXNlZFwiKTtcbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciBhbiBpbmRleGluZyBqb2IgaXMgY3VycmVudGx5IHJ1bm5pbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4aW5nKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5kZXhpbmdJblByb2dyZXNzO1xufVxuXG4iLCAiY29uc3QgSFRNTF9FWFRFTlNJT05TID0gW1wiLmh0bVwiLCBcIi5odG1sXCIsIFwiLnhodG1sXCJdO1xuY29uc3QgTUFSS0RPV05fRVhURU5TSU9OUyA9IFtcIi5tZFwiLCBcIi5tYXJrZG93blwiLCBcIi5tZG93blwiLCBcIi5tZHhcIiwgXCIubWtkXCIsIFwiLm1rZG5cIl07XG5jb25zdCBURVhUX0VYVEVOU0lPTlMgPSBbXCIudHh0XCIsIFwiLnRleHRcIl07XG5jb25zdCBQREZfRVhURU5TSU9OUyA9IFtcIi5wZGZcIl07XG5jb25zdCBFUFVCX0VYVEVOU0lPTlMgPSBbXCIuZXB1YlwiXTtcbmNvbnN0IElNQUdFX0VYVEVOU0lPTlMgPSBbXCIuYm1wXCIsIFwiLmpwZ1wiLCBcIi5qcGVnXCIsIFwiLnBuZ1wiXTtcbmNvbnN0IEFSQ0hJVkVfRVhURU5TSU9OUyA9IFtcIi5yYXJcIl07XG5cbmNvbnN0IEFMTF9FWFRFTlNJT05fR1JPVVBTID0gW1xuICBIVE1MX0VYVEVOU0lPTlMsXG4gIE1BUktET1dOX0VYVEVOU0lPTlMsXG4gIFRFWFRfRVhURU5TSU9OUyxcbiAgUERGX0VYVEVOU0lPTlMsXG4gIEVQVUJfRVhURU5TSU9OUyxcbiAgSU1BR0VfRVhURU5TSU9OUyxcbiAgQVJDSElWRV9FWFRFTlNJT05TLFxuXTtcblxuZXhwb3J0IGNvbnN0IFNVUFBPUlRFRF9FWFRFTlNJT05TID0gbmV3IFNldChcbiAgQUxMX0VYVEVOU0lPTl9HUk9VUFMuZmxhdE1hcCgoZ3JvdXApID0+IGdyb3VwLm1hcCgoZXh0KSA9PiBleHQudG9Mb3dlckNhc2UoKSkpLFxuKTtcblxuZXhwb3J0IGNvbnN0IEhUTUxfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoSFRNTF9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBNQVJLRE9XTl9FWFRFTlNJT05fU0VUID0gbmV3IFNldChNQVJLRE9XTl9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBURVhUX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KFRFWFRfRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgSU1BR0VfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoSU1BR0VfRVhURU5TSU9OUyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0h0bWxFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIEhUTUxfRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNYXJrZG93bkV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gTUFSS0RPV05fRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQbGFpblRleHRFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIFRFWFRfRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0dWFsRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dCkgfHwgaXNQbGFpblRleHRFeHRlbnNpb24oZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zKCk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oU1VQUE9SVEVEX0VYVEVOU0lPTlMudmFsdWVzKCkpLnNvcnQoKTtcbn1cblxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBtaW1lIGZyb20gXCJtaW1lLXR5cGVzXCI7XG5pbXBvcnQge1xuICBTVVBQT1JURURfRVhURU5TSU9OUyxcbiAgbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMsXG59IGZyb20gXCIuLi91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Nhbm5lZEZpbGUge1xuICBwYXRoOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gIG1pbWVUeXBlOiBzdHJpbmcgfCBmYWxzZTtcbiAgc2l6ZTogbnVtYmVyO1xuICBtdGltZTogRGF0ZTtcbn1cblxuLyoqIE5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgdGhlIHJvb3QgZGlyZWN0b3J5IGZvciBzY2FubmluZyAocmVzb2x2ZXMgcGF0aCwgc3RyaXBzIHRyYWlsaW5nIHNsYXNoZXMpLiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplUm9vdERpcihyb290RGlyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gcGF0aC5yZXNvbHZlKHJvb3REaXIudHJpbSgpKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBzY2FuIGEgZGlyZWN0b3J5IGZvciBzdXBwb3J0ZWQgZmlsZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoXG4gIHJvb3REaXI6IHN0cmluZyxcbiAgb25Qcm9ncmVzcz86IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpID0+IHZvaWQsXG4pOiBQcm9taXNlPFNjYW5uZWRGaWxlW10+IHtcbiAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZVJvb3REaXIocm9vdERpcik7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKHJvb3QsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICBpZiAoZXJyPy5jb2RlID09PSBcIkVOT0VOVFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEb2N1bWVudHMgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0OiAke3Jvb3R9LiBDaGVjayB0aGUgcGF0aCAoZS5nLiBzcGVsbGluZyBhbmQgdGhhdCB0aGUgZm9sZGVyIGV4aXN0cykuYCxcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIGNvbnN0IGZpbGVzOiBTY2FubmVkRmlsZVtdID0gW107XG4gIGxldCBzY2FubmVkQ291bnQgPSAwO1xuXG4gIGNvbnN0IHN1cHBvcnRlZEV4dGVuc2lvbnNEZXNjcmlwdGlvbiA9IGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zKCkuam9pbihcIiwgXCIpO1xuICBjb25zb2xlLmxvZyhgW1NjYW5uZXJdIFN1cHBvcnRlZCBleHRlbnNpb25zOiAke3N1cHBvcnRlZEV4dGVuc2lvbnNEZXNjcmlwdGlvbn1gKTtcblxuICBhc3luYyBmdW5jdGlvbiB3YWxrKGRpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGRpciwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBlbnRyeS5uYW1lKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgYXdhaXQgd2FsayhmdWxsUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBzY2FubmVkQ291bnQrKztcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZW50cnkubmFtZSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoU1VQUE9SVEVEX0VYVEVOU0lPTlMuaGFzKGV4dCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBtaW1lVHlwZSA9IG1pbWUubG9va3VwKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZXMucHVzaCh7XG4gICAgICAgICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICAgICAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgICAgICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgICAgICAgbWltZVR5cGUsXG4gICAgICAgICAgICAgIHNpemU6IHN0YXRzLnNpemUsXG4gICAgICAgICAgICAgIG10aW1lOiBzdGF0cy5tdGltZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBpZiAob25Qcm9ncmVzcyAmJiBzY2FubmVkQ291bnQgJSAxMDAgPT09IDApIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBzY2FubmluZyBkaXJlY3RvcnkgJHtkaXJ9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cbiAgXG4gIGF3YWl0IHdhbGsocm9vdCk7XG5cbiAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICBvblByb2dyZXNzKHNjYW5uZWRDb3VudCwgZmlsZXMubGVuZ3RoKTtcbiAgfVxuICBcbiAgcmV0dXJuIGZpbGVzO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgZmlsZSB0eXBlIGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdXBwb3J0ZWRGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gU1VQUE9SVEVEX0VYVEVOU0lPTlMuaGFzKGV4dCk7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gXCJjaGVlcmlvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBQYXJzZSBIVE1ML0hUTSBmaWxlcyBhbmQgZXh0cmFjdCB0ZXh0IGNvbnRlbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSFRNTChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgsIFwidXRmLThcIik7XG4gICAgY29uc3QgJCA9IGNoZWVyaW8ubG9hZChjb250ZW50KTtcbiAgICBcbiAgICAvLyBSZW1vdmUgc2NyaXB0IGFuZCBzdHlsZSBlbGVtZW50c1xuICAgICQoXCJzY3JpcHQsIHN0eWxlLCBub3NjcmlwdFwiKS5yZW1vdmUoKTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IHRleHRcbiAgICBjb25zdCB0ZXh0ID0gJChcImJvZHlcIikudGV4dCgpIHx8ICQudGV4dCgpO1xuICAgIFxuICAgIC8vIENsZWFuIHVwIHdoaXRlc3BhY2VcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIEhUTUwgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGRmUGFyc2UgZnJvbSBcInBkZi1wYXJzZVwiO1xuaW1wb3J0IHsgY3JlYXRlV29ya2VyIH0gZnJvbSBcInRlc3NlcmFjdC5qc1wiO1xuaW1wb3J0IHsgUE5HIH0gZnJvbSBcInBuZ2pzXCI7XG5cbmNvbnN0IE1JTl9URVhUX0xFTkdUSCA9IDUwO1xuY29uc3QgT0NSX01BWF9QQUdFUyA9IDUwO1xuY29uc3QgT0NSX01BWF9JTUFHRVNfUEVSX1BBR0UgPSAzO1xuY29uc3QgT0NSX01JTl9JTUFHRV9BUkVBID0gMTBfMDAwO1xuY29uc3QgT0NSX01BWF9JTUFHRV9QSVhFTFMgPSA1MF8wMDBfMDAwOyAvLyB+NzAwMHg3MDAwOyBwcmV2ZW50cyBsZXB0b25pY2EgcGl4ZGF0YV9tYWxsb2MgY3Jhc2hlc1xuY29uc3QgT0NSX0lNQUdFX1RJTUVPVVRfTVMgPSAzMF8wMDA7XG5cbnR5cGUgUGRmSnNNb2R1bGUgPSB0eXBlb2YgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcblxuaW50ZXJmYWNlIEV4dHJhY3RlZE9jckltYWdlIHtcbiAgYnVmZmVyOiBCdWZmZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBhcmVhOiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFBkZkZhaWx1cmVSZWFzb24gPVxuICB8IFwicGRmLmxtc3R1ZGlvLWVycm9yXCJcbiAgfCBcInBkZi5sbXN0dWRpby1lbXB0eVwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZXJyb3JcIlxuICB8IFwicGRmLnBkZnBhcnNlLWVtcHR5XCJcbiAgfCBcInBkZi5vY3ItZGlzYWJsZWRcIlxuICB8IFwicGRmLm9jci1lcnJvclwiXG4gIHwgXCJwZGYub2NyLXJlbmRlci1lcnJvclwiXG4gIHwgXCJwZGYub2NyLWVtcHR5XCI7XG5cbnR5cGUgUGRmUGFyc2VTdGFnZSA9IFwibG1zdHVkaW9cIiB8IFwicGRmLXBhcnNlXCIgfCBcIm9jclwiO1xuY2xhc3MgSW1hZ2VEYXRhVGltZW91dEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvYmpJZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFRpbWVkIG91dCBmZXRjaGluZyBpbWFnZSBkYXRhIGZvciAke29iaklkfWApO1xuICAgIHRoaXMubmFtZSA9IFwiSW1hZ2VEYXRhVGltZW91dEVycm9yXCI7XG4gIH1cbn1cblxuaW50ZXJmYWNlIFBkZlBhcnNlclN1Y2Nlc3Mge1xuICBzdWNjZXNzOiB0cnVlO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YWdlOiBQZGZQYXJzZVN0YWdlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBkZlBhcnNlckZhaWx1cmUge1xuICBzdWNjZXNzOiBmYWxzZTtcbiAgcmVhc29uOiBQZGZGYWlsdXJlUmVhc29uO1xuICBkZXRhaWxzPzogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBQZGZQYXJzZXJSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxuZnVuY3Rpb24gY2xlYW5UZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG50eXBlIFN0YWdlUmVzdWx0ID0gUGRmUGFyc2VyU3VjY2VzcyB8IFBkZlBhcnNlckZhaWx1cmU7XG5cbmxldCBjYWNoZWRQZGZqc0xpYjogUGRmSnNNb2R1bGUgfCBudWxsID0gbnVsbDtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0UGRmanNMaWIoKSB7XG4gIGlmICghY2FjaGVkUGRmanNMaWIpIHtcbiAgICBjYWNoZWRQZGZqc0xpYiA9IGF3YWl0IGltcG9ydChcInBkZmpzLWRpc3QvbGVnYWN5L2J1aWxkL3BkZi5tanNcIik7XG4gIH1cbiAgcmV0dXJuIGNhY2hlZFBkZmpzTGliO1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aDogc3RyaW5nLCBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50KTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBtYXhSZXRyaWVzID0gMjtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gbWF4UmV0cmllczsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBjbGllbnQuZmlsZXMucHJlcGFyZUZpbGUoZmlsZVBhdGgpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2xpZW50LmZpbGVzLnBhcnNlRG9jdW1lbnQoZmlsZUhhbmRsZSwge1xuICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICBpZiAocHJvZ3Jlc3MgPT09IDAgfHwgcHJvZ3Jlc3MgPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFByb2Nlc3NpbmcgJHtmaWxlTmFtZX06ICR7KHByb2dyZXNzICogMTAwKS50b0ZpeGVkKDApfSVgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dChyZXN1bHQuY29udGVudCk7XG4gICAgICBpZiAoY2xlYW5lZC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICAgIHN0YWdlOiBcImxtc3R1ZGlvXCIsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFBhcnNlZCBidXQgZ290IHZlcnkgbGl0dGxlIHRleHQgZnJvbSAke2ZpbGVOYW1lfSAobGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9KSwgd2lsbCB0cnkgZmFsbGJhY2tzYCxcbiAgICAgICk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lbXB0eVwiLFxuICAgICAgICBkZXRhaWxzOiBgbGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9YCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGlzV2ViU29ja2V0RXJyb3IgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmXG4gICAgICAgIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwiV2ViU29ja2V0XCIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJjb25uZWN0aW9uIGNsb3NlZFwiKSk7XG5cbiAgICAgIGlmIChpc1dlYlNvY2tldEVycm9yICYmIGF0dGVtcHQgPCBtYXhSZXRyaWVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFdlYlNvY2tldCBlcnJvciBvbiAke2ZpbGVOYW1lfSwgcmV0cnlpbmcgKCR7YXR0ZW1wdH0vJHttYXhSZXRyaWVzfSkuLi5gLFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwICogYXR0ZW1wdCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIEVycm9yIHBhcnNpbmcgUERGIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICBkZXRhaWxzOiBcIkV4Y2VlZGVkIHJldHJ5IGF0dGVtcHRzXCIsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeVBkZlBhcnNlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuICB0cnkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZGZQYXJzZShidWZmZXIpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQocmVzdWx0LnRleHQgfHwgXCJcIik7XG5cbiAgICBpZiAoY2xlYW5lZC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIFN1Y2Nlc3NmdWxseSBleHRyYWN0ZWQgdGV4dCBmcm9tICR7ZmlsZU5hbWV9YCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICBzdGFnZTogXCJwZGYtcGFyc2VcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIFZlcnkgbGl0dGxlIG9yIG5vIHRleHQgZXh0cmFjdGVkIGZyb20gJHtmaWxlTmFtZX0gKGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofSlgLFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5wZGZwYXJzZS1lbXB0eVwiLFxuICAgICAgZGV0YWlsczogYGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofWAsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgRXJyb3IgcGFyc2luZyBQREYgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5wZGZwYXJzZS1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5T2NyV2l0aFBkZkpzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIGxldCB3b3JrZXI6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlV29ya2VyPj4gfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBwZGZqc0xpYiA9IGF3YWl0IGdldFBkZmpzTGliKCk7XG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoKSk7XG4gICAgY29uc3QgcGRmRG9jdW1lbnQgPSBhd2FpdCBwZGZqc0xpYlxuICAgICAgLmdldERvY3VtZW50KHsgZGF0YSwgdmVyYm9zaXR5OiBwZGZqc0xpYi5WZXJib3NpdHlMZXZlbC5FUlJPUlMgfSlcbiAgICAgIC5wcm9taXNlO1xuXG4gICAgY29uc3QgbnVtUGFnZXMgPSBwZGZEb2N1bWVudC5udW1QYWdlcztcbiAgICBjb25zdCBtYXhQYWdlcyA9IE1hdGgubWluKG51bVBhZ2VzLCBPQ1JfTUFYX1BBR0VTKTtcblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBTdGFydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9IC0gcGFnZXMgMSB0byAke21heFBhZ2VzfSAob2YgJHtudW1QYWdlc30pYCxcbiAgICApO1xuXG4gICAgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgIGNvbnN0IHRleHRQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcmVuZGVyRXJyb3JzID0gMDtcbiAgICBsZXQgcHJvY2Vzc2VkSW1hZ2VzID0gMDtcblxuICAgIGZvciAobGV0IHBhZ2VOdW0gPSAxOyBwYWdlTnVtIDw9IG1heFBhZ2VzOyBwYWdlTnVtKyspIHtcbiAgICAgIGxldCBwYWdlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZSA9IGF3YWl0IHBkZkRvY3VtZW50LmdldFBhZ2UocGFnZU51bSk7XG4gICAgICAgIGNvbnN0IGltYWdlcyA9IGF3YWl0IGV4dHJhY3RJbWFnZXNGb3JQYWdlKHBkZmpzTGliLCBwYWdlKTtcbiAgICAgICAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgJHtmaWxlTmFtZX0gLSBwYWdlICR7cGFnZU51bX0gY29udGFpbnMgbm8gZXh0cmFjdGFibGUgaW1hZ2VzLCBza2lwcGluZ2AsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkSW1hZ2VzID0gaW1hZ2VzLnNsaWNlKDAsIE9DUl9NQVhfSU1BR0VTX1BFUl9QQUdFKTtcbiAgICAgICAgZm9yIChjb25zdCBpbWFnZSBvZiBzZWxlY3RlZEltYWdlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICAgIGRhdGE6IHsgdGV4dCB9LFxuICAgICAgICAgICAgfSA9IGF3YWl0IHdvcmtlci5yZWNvZ25pemUoaW1hZ2UuYnVmZmVyKTtcbiAgICAgICAgICAgIHByb2Nlc3NlZEltYWdlcysrO1xuICAgICAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dCh0ZXh0IHx8IFwiXCIpO1xuICAgICAgICAgICAgaWYgKGNsZWFuZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaChjbGVhbmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChyZWNvZ25pemVFcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZWNvZ25pemUgaW1hZ2UgKCR7aW1hZ2Uud2lkdGh9eCR7aW1hZ2UuaGVpZ2h0fSkgb24gcGFnZSAke3BhZ2VOdW19IG9mICR7ZmlsZU5hbWV9OmAsXG4gICAgICAgICAgICAgIHJlY29nbml6ZUVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyByZWNvZ25pemVFcnJvci5tZXNzYWdlIDogcmVjb2duaXplRXJyb3IsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8gVGhlIHdvcmtlciBtYXkgaGF2ZSBjcmFzaGVkOyB0cnkgdG8gcmVjcmVhdGUgaXQgZm9yIHJlbWFpbmluZyBpbWFnZXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyB3b3JrZXIgYWxyZWFkeSBkZWFkLCBpZ25vcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHJlY3JlYXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZWNyZWF0ZSBPQ1Igd29ya2VyLCBhYm9ydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9YCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgd29ya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgICAgICAgICAgIGRldGFpbHM6IGBXb3JrZXIgY3Jhc2hlZCBhbmQgY291bGQgbm90IGJlIHJlY3JlYXRlZDogJHtcbiAgICAgICAgICAgICAgICAgIHJlY3JlYXRlRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IHJlY3JlYXRlRXJyb3IubWVzc2FnZSA6IFN0cmluZyhyZWNyZWF0ZUVycm9yKVxuICAgICAgICAgICAgICAgIH1gLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlTnVtID09PSAxIHx8IHBhZ2VOdW0gJSAxMCA9PT0gMCB8fCBwYWdlTnVtID09PSBtYXhQYWdlcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSAke2ZpbGVOYW1lfSAtIHByb2Nlc3NlZCBwYWdlICR7cGFnZU51bX0vJHttYXhQYWdlc30gKGltYWdlcz0ke3Byb2Nlc3NlZEltYWdlc30sIGNoYXJzPSR7dGV4dFBhcnRzLmpvaW4oXG4gICAgICAgICAgICAgIFwiXFxuXFxuXCIsXG4gICAgICAgICAgICApLmxlbmd0aH0pYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChwYWdlRXJyb3IpIHtcbiAgICAgICAgaWYgKHBhZ2VFcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEFib3J0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX06ICR7cGFnZUVycm9yLm1lc3NhZ2V9YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICB3b3JrZXIgPSBudWxsO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICAgICAgICBkZXRhaWxzOiBwYWdlRXJyb3IubWVzc2FnZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlckVycm9ycysrO1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRXJyb3IgcHJvY2Vzc2luZyBwYWdlICR7cGFnZU51bX0gb2YgJHtmaWxlTmFtZX06YCxcbiAgICAgICAgICBwYWdlRXJyb3IsXG4gICAgICAgICk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBhd2FpdCBwYWdlPy5jbGVhbnVwKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHdvcmtlcikge1xuICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIH1cbiAgICB3b3JrZXIgPSBudWxsO1xuXG4gICAgY29uc3QgZnVsbFRleHQgPSBjbGVhblRleHQodGV4dFBhcnRzLmpvaW4oXCJcXG5cXG5cIikpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBDb21wbGV0ZWQgT0NSIGZvciAke2ZpbGVOYW1lfSwgZXh0cmFjdGVkICR7ZnVsbFRleHQubGVuZ3RofSBjaGFyYWN0ZXJzYCxcbiAgICApO1xuXG4gICAgaWYgKGZ1bGxUZXh0Lmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRleHQ6IGZ1bGxUZXh0LFxuICAgICAgICBzdGFnZTogXCJvY3JcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlckVycm9ycyA+IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLm9jci1yZW5kZXItZXJyb3JcIixcbiAgICAgICAgZGV0YWlsczogYCR7cmVuZGVyRXJyb3JzfSBwYWdlIHJlbmRlciBlcnJvcnNgLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1lbXB0eVwiLFxuICAgICAgZGV0YWlsczogXCJPQ1IgcHJvZHVjZWQgaW5zdWZmaWNpZW50IHRleHRcIixcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAoT0NSKSBFcnJvciBkdXJpbmcgT0NSIGZvciAke2ZpbGVOYW1lfTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9IGZpbmFsbHkge1xuICAgIGlmICh3b3JrZXIpIHtcbiAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdEltYWdlc0ZvclBhZ2UocGRmanNMaWI6IFBkZkpzTW9kdWxlLCBwYWdlOiBhbnkpOiBQcm9taXNlPEV4dHJhY3RlZE9jckltYWdlW10+IHtcbiAgY29uc3Qgb3BlcmF0b3JMaXN0ID0gYXdhaXQgcGFnZS5nZXRPcGVyYXRvckxpc3QoKTtcbiAgY29uc3QgaW1hZ2VzOiBFeHRyYWN0ZWRPY3JJbWFnZVtdID0gW107XG4gIGNvbnN0IGltYWdlRGF0YUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8YW55IHwgbnVsbD4+KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGVyYXRvckxpc3QuZm5BcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZuID0gb3BlcmF0b3JMaXN0LmZuQXJyYXlbaV07XG4gICAgY29uc3QgYXJncyA9IG9wZXJhdG9yTGlzdC5hcmdzQXJyYXlbaV07XG5cbiAgICB0cnkge1xuICAgICAgaWYgKGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbWFnZVhPYmplY3QgfHwgZm4gPT09IHBkZmpzTGliLk9QUy5wYWludEltYWdlWE9iamVjdFJlcGVhdCkge1xuICAgICAgICBjb25zdCBvYmpJZCA9IGFyZ3M/LlswXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpJZCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpbWdEYXRhO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGltZ0RhdGEgPSBhd2FpdCByZXNvbHZlSW1hZ2VEYXRhKHBhZ2UsIG9iaklkLCBpbWFnZURhdGFDYWNoZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZXNvbHZlIGltYWdlIGRhdGE6XCIsIGVycm9yKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWltZ0RhdGEpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcocGRmanNMaWIsIGltZ0RhdGEpO1xuICAgICAgICBpZiAoY29udmVydGVkKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goY29udmVydGVkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW5saW5lSW1hZ2VYT2JqZWN0ICYmIGFyZ3M/LlswXSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcocGRmanNMaWIsIGFyZ3NbMF0pO1xuICAgICAgICBpZiAoY29udmVydGVkKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goY29udmVydGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgICBjb25zb2xlLndhcm4oXCJbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIGV4dHJhY3QgaW5saW5lIGltYWdlOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlc1xuICAgIC5maWx0ZXIoKGltYWdlKSA9PiB7XG4gICAgICBpZiAoaW1hZ2UuYXJlYSA8IE9DUl9NSU5fSU1BR0VfQVJFQSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGltYWdlLmFyZWEgPiBPQ1JfTUFYX0lNQUdFX1BJWEVMUykge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBTa2lwcGluZyBvdmVyc2l6ZWQgaW1hZ2UgKCR7aW1hZ2Uud2lkdGh9eCR7aW1hZ2UuaGVpZ2h0fSA9ICR7aW1hZ2UuYXJlYS50b0xvY2FsZVN0cmluZygpfSBwaXhlbHMpIHRvIGF2b2lkIG1lbW9yeSBhbGxvY2F0aW9uIGZhaWx1cmVgLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmFyZWEgLSBhLmFyZWEpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlSW1hZ2VEYXRhKFxuICBwYWdlOiBhbnksXG4gIG9iaklkOiBzdHJpbmcsXG4gIGNhY2hlOiBNYXA8c3RyaW5nLCBQcm9taXNlPGFueSB8IG51bGw+Pixcbik6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICBpZiAoY2FjaGUuaGFzKG9iaklkKSkge1xuICAgIHJldHVybiBjYWNoZS5nZXQob2JqSWQpITtcbiAgfVxuXG4gIGNvbnN0IHByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIHBhZ2Uub2Jqcy5oYXMgPT09IFwiZnVuY3Rpb25cIiAmJiBwYWdlLm9ianMuaGFzKG9iaklkKSkge1xuICAgICAgICByZXR1cm4gcGFnZS5vYmpzLmdldChvYmpJZCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBmYWxsIHRocm91Z2ggdG8gYXN5bmMgcGF0aFxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgICAgbGV0IHRpbWVvdXRIYW5kbGU6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aW1lb3V0SGFuZGxlKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpO1xuICAgICAgICAgIHRpbWVvdXRIYW5kbGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBoYW5kbGVEYXRhID0gKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZS5vYmpzLmdldChvYmpJZCwgaGFuZGxlRGF0YSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoT0NSX0lNQUdFX1RJTUVPVVRfTVMpICYmIE9DUl9JTUFHRV9USU1FT1VUX01TID4gMCkge1xuICAgICAgICB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFzZXR0bGVkKSB7XG4gICAgICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgSW1hZ2VEYXRhVGltZW91dEVycm9yKG9iaklkKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBPQ1JfSU1BR0VfVElNRU9VVF9NUyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pKCk7XG5cbiAgY2FjaGUuc2V0KG9iaklkLCBwcm9taXNlKTtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbWFnZURhdGFUb1BuZyhcbiAgcGRmanNMaWI6IFBkZkpzTW9kdWxlLFxuICBpbWdEYXRhOiBhbnksXG4pOiBFeHRyYWN0ZWRPY3JJbWFnZSB8IG51bGwge1xuICBpZiAoIWltZ0RhdGEgfHwgdHlwZW9mIGltZ0RhdGEud2lkdGggIT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIGltZ0RhdGEuaGVpZ2h0ICE9PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIGtpbmQsIGRhdGEgfSA9IGltZ0RhdGE7XG4gIGlmICghZGF0YSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcG5nID0gbmV3IFBORyh7IHdpZHRoLCBoZWlnaHQgfSk7XG4gIGNvbnN0IGRlc3QgPSBwbmcuZGF0YTtcblxuICBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLlJHQkFfMzJCUFAgJiYgZGF0YS5sZW5ndGggPT09IHdpZHRoICogaGVpZ2h0ICogNCkge1xuICAgIGRlc3Quc2V0KEJ1ZmZlci5mcm9tKGRhdGEpKTtcbiAgfSBlbHNlIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuUkdCXzI0QlBQICYmIGRhdGEubGVuZ3RoID09PSB3aWR0aCAqIGhlaWdodCAqIDMpIHtcbiAgICBjb25zdCBzcmMgPSBkYXRhIGFzIFVpbnQ4QXJyYXk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGogPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSArPSAzLCBqICs9IDQpIHtcbiAgICAgIGRlc3Rbal0gPSBzcmNbaV07XG4gICAgICBkZXN0W2ogKyAxXSA9IHNyY1tpICsgMV07XG4gICAgICBkZXN0W2ogKyAyXSA9IHNyY1tpICsgMl07XG4gICAgICBkZXN0W2ogKyAzXSA9IDI1NTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLkdSQVlTQ0FMRV8xQlBQKSB7XG4gICAgbGV0IHBpeGVsSW5kZXggPSAwO1xuICAgIGNvbnN0IHRvdGFsUGl4ZWxzID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgZm9yIChsZXQgYnl0ZUluZGV4ID0gMDsgYnl0ZUluZGV4IDwgZGF0YS5sZW5ndGggJiYgcGl4ZWxJbmRleCA8IHRvdGFsUGl4ZWxzOyBieXRlSW5kZXgrKykge1xuICAgICAgY29uc3QgYnl0ZSA9IGRhdGFbYnl0ZUluZGV4XTtcbiAgICAgIGZvciAobGV0IGJpdCA9IDc7IGJpdCA+PSAwICYmIHBpeGVsSW5kZXggPCB0b3RhbFBpeGVsczsgYml0LS0pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSAoYnl0ZSA+PiBiaXQpICYgMSA/IDI1NSA6IDA7XG4gICAgICAgIGNvbnN0IGRlc3RJbmRleCA9IHBpeGVsSW5kZXggKiA0O1xuICAgICAgICBkZXN0W2Rlc3RJbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAxXSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDJdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgM10gPSAyNTU7XG4gICAgICAgIHBpeGVsSW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGJ1ZmZlcjogUE5HLnN5bmMud3JpdGUocG5nKSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgYXJlYTogd2lkdGggKiBoZWlnaHQsXG4gIH07XG59XG5cbi8qKlxuICogUGFyc2UgUERGIGZpbGVzIHdpdGggYSBtdWx0aS1zdGFnZSBzdHJhdGVneTpcbiAqIDEuIFVzZSBMTSBTdHVkaW8ncyBidWlsdC1pbiBkb2N1bWVudCBwYXJzZXIgKGZhc3QsIHNlcnZlci1zaWRlLCBtYXkgaW5jbHVkZSBPQ1IpXG4gKiAyLiBGYWxsYmFjayB0byBsb2NhbCBwZGYtcGFyc2UgZm9yIHRleHQtYmFzZWQgUERGc1xuICogMy4gSWYgc3RpbGwgbm8gdGV4dCBhbmQgT0NSIGlzIGVuYWJsZWQsIGZhbGxiYWNrIHRvIFBERi5qcyArIFRlc3NlcmFjdCBPQ1JcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlUERGKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50LFxuICBlbmFibGVPQ1I6IGJvb2xlYW4sXG4pOiBQcm9taXNlPFBkZlBhcnNlclJlc3VsdD4ge1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICAvLyAxKSBMTSBTdHVkaW8gcGFyc2VyXG4gIGNvbnN0IGxtU3R1ZGlvUmVzdWx0ID0gYXdhaXQgdHJ5TG1TdHVkaW9QYXJzZXIoZmlsZVBhdGgsIGNsaWVudCk7XG4gIGlmIChsbVN0dWRpb1Jlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIGxtU3R1ZGlvUmVzdWx0O1xuICB9XG4gIGxldCBsYXN0RmFpbHVyZTogUGRmUGFyc2VyRmFpbHVyZSA9IGxtU3R1ZGlvUmVzdWx0O1xuXG4gIC8vIDIpIExvY2FsIHBkZi1wYXJzZSBmYWxsYmFja1xuICBjb25zdCBwZGZQYXJzZVJlc3VsdCA9IGF3YWl0IHRyeVBkZlBhcnNlKGZpbGVQYXRoKTtcbiAgaWYgKHBkZlBhcnNlUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gcGRmUGFyc2VSZXN1bHQ7XG4gIH1cbiAgbGFzdEZhaWx1cmUgPSBwZGZQYXJzZVJlc3VsdDtcblxuICAvLyAzKSBPQ1IgZmFsbGJhY2sgKG9ubHkgaWYgZW5hYmxlZClcbiAgaWYgKCFlbmFibGVPQ1IpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRW5hYmxlIE9DUiBpcyBvZmYsIHNraXBwaW5nIE9DUiBmYWxsYmFjayBmb3IgJHtmaWxlTmFtZX0gYWZ0ZXIgb3RoZXIgbWV0aG9kcyByZXR1cm5lZCBubyB0ZXh0YCxcbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWRpc2FibGVkXCIsXG4gICAgICBkZXRhaWxzOiBgUHJldmlvdXMgZmFpbHVyZSByZWFzb246ICR7bGFzdEZhaWx1cmUucmVhc29ufWAsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKFxuICAgIGBbUERGIFBhcnNlcl0gKE9DUikgTm8gdGV4dCBleHRyYWN0ZWQgZnJvbSAke2ZpbGVOYW1lfSB3aXRoIExNIFN0dWRpbyBvciBwZGYtcGFyc2UsIGF0dGVtcHRpbmcgT0NSLi4uYCxcbiAgKTtcblxuICBjb25zdCBvY3JSZXN1bHQgPSBhd2FpdCB0cnlPY3JXaXRoUGRmSnMoZmlsZVBhdGgpO1xuICBpZiAob2NyUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gb2NyUmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIG9jclJlc3VsdDtcbn1cblxuIiwgIi8vIEB0cy1pZ25vcmUgLSBlcHViMiBkb2Vzbid0IGhhdmUgY29tcGxldGUgdHlwZXNcbmltcG9ydCB7IEVQdWIgfSBmcm9tIFwiZXB1YjJcIjtcblxuLyoqXG4gKiBQYXJzZSBFUFVCIGZpbGVzIGFuZCBleHRyYWN0IHRleHQgY29udGVudFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VFUFVCKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBlcHViID0gbmV3IEVQdWIoZmlsZVBhdGgpO1xuICAgICAgXG4gICAgICBlcHViLm9uKFwiZXJyb3JcIiwgKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIEVQVUIgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3RyaXBIdG1sID0gKGlucHV0OiBzdHJpbmcpID0+XG4gICAgICAgIGlucHV0LnJlcGxhY2UoLzxbXj5dKj4vZywgXCIgXCIpO1xuXG4gICAgICBjb25zdCBnZXRNYW5pZmVzdEVudHJ5ID0gKGNoYXB0ZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiAoZXB1YiBhcyB1bmtub3duIGFzIHsgbWFuaWZlc3Q/OiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PiB9KS5tYW5pZmVzdD8uW2NoYXB0ZXJJZF07XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBkZWNvZGVNZWRpYVR5cGUgPSAoZW50cnk/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9KSA9PlxuICAgICAgICBlbnRyeT8uW1wibWVkaWEtdHlwZVwiXSB8fCBlbnRyeT8ubWVkaWFUeXBlIHx8IFwiXCI7XG5cbiAgICAgIGNvbnN0IHNob3VsZFJlYWRSYXcgPSAobWVkaWFUeXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG1lZGlhVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkID09PSBcImFwcGxpY2F0aW9uL3hodG1sK3htbFwiIHx8IG5vcm1hbGl6ZWQgPT09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuc3RhcnRzV2l0aChcInRleHQvXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcImh0bWxcIikpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVhZENoYXB0ZXIgPSBhc3luYyAoY2hhcHRlcklkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJ5ID0gZ2V0TWFuaWZlc3RFbnRyeShjaGFwdGVySWQpO1xuICAgICAgICBpZiAoIW1hbmlmZXN0RW50cnkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYEVQVUIgY2hhcHRlciAke2NoYXB0ZXJJZH0gbWlzc2luZyBtYW5pZmVzdCBlbnRyeSBpbiAke2ZpbGVQYXRofSwgc2tpcHBpbmdgKTtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lZGlhVHlwZSA9IGRlY29kZU1lZGlhVHlwZShtYW5pZmVzdEVudHJ5KTtcbiAgICAgICAgaWYgKHNob3VsZFJlYWRSYXcobWVkaWFUeXBlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgIGVwdWIuZ2V0RmlsZShcbiAgICAgICAgICAgICAgY2hhcHRlcklkLFxuICAgICAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCwgZGF0YT86IEJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgcmVqKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICByZXMoXCJcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJlcyhzdHJpcEh0bWwoZGF0YS50b1N0cmluZyhcInV0Zi04XCIpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgIGVwdWIuZ2V0Q2hhcHRlcihcbiAgICAgICAgICAgIGNoYXB0ZXJJZCxcbiAgICAgICAgICAgIChlcnJvcjogRXJyb3IgfCBudWxsLCB0ZXh0Pzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlaihlcnJvcik7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRleHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICByZXMoc3RyaXBIdG1sKHRleHQpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMoXCJcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGVwdWIub24oXCJlbmRcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNoYXB0ZXJzID0gZXB1Yi5mbG93O1xuICAgICAgICAgIGNvbnN0IHRleHRQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICBcbiAgICAgICAgICBmb3IgKGNvbnN0IGNoYXB0ZXIgb2YgY2hhcHRlcnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNoYXB0ZXJJZCA9IGNoYXB0ZXIuaWQ7XG4gICAgICAgICAgICAgIGlmICghY2hhcHRlcklkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBFUFVCIGNoYXB0ZXIgbWlzc2luZyBpZCBpbiAke2ZpbGVQYXRofSwgc2tpcHBpbmdgKTtcbiAgICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaChcIlwiKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZWFkQ2hhcHRlcihjaGFwdGVySWQpO1xuICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGNoYXB0ZXJFcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZWFkaW5nIGNoYXB0ZXIgJHtjaGFwdGVyLmlkfTpgLCBjaGFwdGVyRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBmdWxsVGV4dCA9IHRleHRQYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xuICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICBmdWxsVGV4dFxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyBFUFVCIGNoYXB0ZXJzOmAsIGVycm9yKTtcbiAgICAgICAgICByZXNvbHZlKFwiXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXB1Yi5wYXJzZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbml0aWFsaXppbmcgRVBVQiBwYXJzZXIgZm9yICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgfVxuICB9KTtcbn1cblxuIiwgImltcG9ydCB7IGNyZWF0ZVdvcmtlciB9IGZyb20gXCJ0ZXNzZXJhY3QuanNcIjtcblxuLyoqXG4gKiBQYXJzZSBpbWFnZSBmaWxlcyB1c2luZyBPQ1IgKFRlc3NlcmFjdClcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSW1hZ2UoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgIFxuICAgIGNvbnN0IHsgZGF0YTogeyB0ZXh0IH0gfSA9IGF3YWl0IHdvcmtlci5yZWNvZ25pemUoZmlsZVBhdGgpO1xuICAgIFxuICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICBcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIGltYWdlIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZVRleHRPcHRpb25zIHtcbiAgc3RyaXBNYXJrZG93bj86IGJvb2xlYW47XG4gIHByZXNlcnZlTGluZUJyZWFrcz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogUGFyc2UgcGxhaW4gdGV4dCBmaWxlcyAodHh0LCBtZCBhbmQgcmVsYXRlZCBmb3JtYXRzKVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VUZXh0KFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBvcHRpb25zOiBQYXJzZVRleHRPcHRpb25zID0ge30sXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IHN0cmlwTWFya2Rvd24gPSBmYWxzZSwgcHJlc2VydmVMaW5lQnJlYWtzID0gZmFsc2UgfSA9IG9wdGlvbnM7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgsIFwidXRmLThcIik7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUxpbmVFbmRpbmdzKGNvbnRlbnQpO1xuXG4gICAgY29uc3Qgc3RyaXBwZWQgPSBzdHJpcE1hcmtkb3duID8gc3RyaXBNYXJrZG93blN5bnRheChub3JtYWxpemVkKSA6IG5vcm1hbGl6ZWQ7XG5cbiAgICByZXR1cm4gKHByZXNlcnZlTGluZUJyZWFrcyA/IGNvbGxhcHNlV2hpdGVzcGFjZUJ1dEtlZXBMaW5lcyhzdHJpcHBlZCkgOiBjb2xsYXBzZVdoaXRlc3BhY2Uoc3RyaXBwZWQpKS50cmltKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyB0ZXh0IGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxpbmVFbmRpbmdzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxyXFxuPy9nLCBcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZUJ1dEtlZXBMaW5lcyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBpbnB1dFxuICAgICAgLy8gVHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlIHBlciBsaW5lXG4gICAgICAucmVwbGFjZSgvWyBcXHRdK1xcbi9nLCBcIlxcblwiKVxuICAgICAgLy8gQ29sbGFwc2UgbXVsdGlwbGUgYmxhbmsgbGluZXMgYnV0IGtlZXAgcGFyYWdyYXBoIHNlcGFyYXRpb25cbiAgICAgIC5yZXBsYWNlKC9cXG57Myx9L2csIFwiXFxuXFxuXCIpXG4gICAgICAvLyBDb2xsYXBzZSBpbnRlcm5hbCBzcGFjZXMvdGFic1xuICAgICAgLnJlcGxhY2UoL1sgXFx0XXsyLH0vZywgXCIgXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIHN0cmlwTWFya2Rvd25TeW50YXgoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBvdXRwdXQgPSBpbnB1dDtcblxuICAvLyBSZW1vdmUgZmVuY2VkIGNvZGUgYmxvY2tzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9gYGBbXFxzXFxTXSo/YGBgL2csIFwiIFwiKTtcbiAgLy8gUmVtb3ZlIGlubGluZSBjb2RlXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9gKFteYF0rKWAvZywgXCIkMVwiKTtcbiAgLy8gUmVwbGFjZSBpbWFnZXMgd2l0aCBhbHQgdGV4dFxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvIVxcWyhbXlxcXV0qKVxcXVxcKFteKV0qXFwpL2csIFwiJDEgXCIpO1xuICAvLyBSZXBsYWNlIGxpbmtzIHdpdGggbGluayB0ZXh0XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9cXFsoW15cXF1dKylcXF1cXChbXildKlxcKS9nLCBcIiQxXCIpO1xuICAvLyBSZW1vdmUgZW1waGFzaXMgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvKFxcKlxcKnxfXykoLio/KVxcMS9nLCBcIiQyXCIpO1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvKFxcKnxfKSguKj8pXFwxL2csIFwiJDJcIik7XG4gIC8vIFJlbW92ZSBoZWFkaW5nc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9I3sxLDZ9XFxzKy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSBibG9jayBxdW90ZXNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfT5cXHM/L2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIHVub3JkZXJlZCBsaXN0IG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfVstKitdXFxzKy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSBvcmRlcmVkIGxpc3QgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9XFxkK1tcXC5cXCldXFxzKy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSBob3Jpem9udGFsIHJ1bGVzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30oWy0qX11cXHM/KXszLH0kL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIHJlc2lkdWFsIEhUTUwgdGFnc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvPFtePl0rPi9nLCBcIiBcIik7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuIiwgImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHBhcnNlSFRNTCB9IGZyb20gXCIuL2h0bWxQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlUERGLCB0eXBlIFBkZkZhaWx1cmVSZWFzb24gfSBmcm9tIFwiLi9wZGZQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlRVBVQiB9IGZyb20gXCIuL2VwdWJQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlSW1hZ2UgfSBmcm9tIFwiLi9pbWFnZVBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VUZXh0IH0gZnJvbSBcIi4vdGV4dFBhcnNlclwiO1xuaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQge1xuICBJTUFHRV9FWFRFTlNJT05fU0VULFxuICBpc0h0bWxFeHRlbnNpb24sXG4gIGlzTWFya2Rvd25FeHRlbnNpb24sXG4gIGlzUGxhaW5UZXh0RXh0ZW5zaW9uLFxuICBpc1RleHR1YWxFeHRlbnNpb24sXG59IGZyb20gXCIuLi91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkRG9jdW1lbnQge1xuICB0ZXh0OiBzdHJpbmc7XG4gIG1ldGFkYXRhOiB7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbiAgICBmaWxlTmFtZTogc3RyaW5nO1xuICAgIGV4dGVuc2lvbjogc3RyaW5nO1xuICAgIHBhcnNlZEF0OiBEYXRlO1xuICB9O1xufVxuXG5leHBvcnQgdHlwZSBQYXJzZUZhaWx1cmVSZWFzb24gPVxuICB8IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCJcbiAgfCBcInBkZi5taXNzaW5nLWNsaWVudFwiXG4gIHwgUGRmRmFpbHVyZVJlYXNvblxuICB8IFwiZXB1Yi5lbXB0eVwiXG4gIHwgXCJodG1sLmVtcHR5XCJcbiAgfCBcImh0bWwuZXJyb3JcIlxuICB8IFwidGV4dC5lbXB0eVwiXG4gIHwgXCJ0ZXh0LmVycm9yXCJcbiAgfCBcImltYWdlLm9jci1kaXNhYmxlZFwiXG4gIHwgXCJpbWFnZS5lbXB0eVwiXG4gIHwgXCJpbWFnZS5lcnJvclwiXG4gIHwgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiO1xuXG5leHBvcnQgdHlwZSBEb2N1bWVudFBhcnNlUmVzdWx0ID1cbiAgfCB7IHN1Y2Nlc3M6IHRydWU7IGRvY3VtZW50OiBQYXJzZWREb2N1bWVudCB9XG4gIHwgeyBzdWNjZXNzOiBmYWxzZTsgcmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb247IGRldGFpbHM/OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBQYXJzZSBhIGRvY3VtZW50IGZpbGUgYmFzZWQgb24gaXRzIGV4dGVuc2lvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VEb2N1bWVudChcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgZW5hYmxlT0NSOiBib29sZWFuID0gZmFsc2UsXG4gIGNsaWVudD86IExNU3R1ZGlvQ2xpZW50LFxuKTogUHJvbWlzZTxEb2N1bWVudFBhcnNlUmVzdWx0PiB7XG4gIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKTtcblxuICBjb25zdCBidWlsZFN1Y2Nlc3MgPSAodGV4dDogc3RyaW5nKTogRG9jdW1lbnRQYXJzZVJlc3VsdCA9PiAoe1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgZG9jdW1lbnQ6IHtcbiAgICAgIHRleHQsXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgIGV4dGVuc2lvbjogZXh0LFxuICAgICAgICBwYXJzZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBpZiAoaXNIdG1sRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBjbGVhbkFuZFZhbGlkYXRlKFxuICAgICAgICAgIGF3YWl0IHBhcnNlSFRNTChmaWxlUGF0aCksXG4gICAgICAgICAgXCJodG1sLmVtcHR5XCIsXG4gICAgICAgICAgYCR7ZmlsZU5hbWV9IGh0bWxgLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGV4dC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKHRleHQudmFsdWUpIDogdGV4dDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW0hUTUxdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJodG1sLmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLnBkZlwiKSB7XG4gICAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYFtQYXJzZXJdIE5vIExNIFN0dWRpbyBjbGllbnQgYXZhaWxhYmxlIGZvciBQREYgcGFyc2luZzogJHtmaWxlTmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJwZGYubWlzc2luZy1jbGllbnRcIiB9O1xuICAgICAgfVxuICAgICAgY29uc3QgcGRmUmVzdWx0ID0gYXdhaXQgcGFyc2VQREYoZmlsZVBhdGgsIGNsaWVudCwgZW5hYmxlT0NSKTtcbiAgICAgIGlmIChwZGZSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gYnVpbGRTdWNjZXNzKHBkZlJlc3VsdC50ZXh0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwZGZSZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIuZXB1YlwiKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VFUFVCKGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwiZXB1Yi5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICB9XG5cbiAgICBpZiAoaXNUZXh0dWFsRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZVRleHQoZmlsZVBhdGgsIHtcbiAgICAgICAgICBzdHJpcE1hcmtkb3duOiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dCksXG4gICAgICAgICAgcHJlc2VydmVMaW5lQnJlYWtzOiBpc1BsYWluVGV4dEV4dGVuc2lvbihleHQpLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJ0ZXh0LmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtUZXh0XSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwidGV4dC5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoSU1BR0VfRVhURU5TSU9OX1NFVC5oYXMoZXh0KSkge1xuICAgICAgaWYgKCFlbmFibGVPQ1IpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFNraXBwaW5nIGltYWdlIGZpbGUgJHtmaWxlUGF0aH0gKE9DUiBkaXNhYmxlZClgKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJpbWFnZS5vY3ItZGlzYWJsZWRcIiB9O1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlSW1hZ2UoZmlsZVBhdGgpO1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcImltYWdlLmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtJbWFnZV0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcImltYWdlLmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLnJhclwiKSB7XG4gICAgICBjb25zb2xlLmxvZyhgUkFSIGZpbGVzIG5vdCB5ZXQgc3VwcG9ydGVkOiAke2ZpbGVQYXRofWApO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIiwgZGV0YWlsczogXCIucmFyXCIgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgVW5zdXBwb3J0ZWQgZmlsZSB0eXBlOiAke2ZpbGVQYXRofWApO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCIsIGRldGFpbHM6IGV4dCB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgZG9jdW1lbnQgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH1cbn1cblxudHlwZSBDbGVhblJlc3VsdCA9XG4gIHwgeyBzdWNjZXNzOiB0cnVlOyB2YWx1ZTogc3RyaW5nIH1cbiAgfCB7IHN1Y2Nlc3M6IGZhbHNlOyByZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbjsgZGV0YWlscz86IHN0cmluZyB9O1xuXG5mdW5jdGlvbiBjbGVhbkFuZFZhbGlkYXRlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIGVtcHR5UmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb24sXG4gIGRldGFpbHNDb250ZXh0Pzogc3RyaW5nLFxuKTogQ2xlYW5SZXN1bHQge1xuICBjb25zdCBjbGVhbmVkID0gdGV4dD8udHJpbSgpID8/IFwiXCI7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogZW1wdHlSZWFzb24sXG4gICAgICBkZXRhaWxzOiBkZXRhaWxzQ29udGV4dCA/IGAke2RldGFpbHNDb250ZXh0fSB0cmltbWVkIHRvIHplcm8gbGVuZ3RoYCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG4gIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHZhbHVlOiBjbGVhbmVkIH07XG59XG5cbiIsICIvKipcbiAqIFNpbXBsZSB0ZXh0IGNodW5rZXIgdGhhdCBzcGxpdHMgdGV4dCBpbnRvIG92ZXJsYXBwaW5nIGNodW5rc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2h1bmtUZXh0KFxuICB0ZXh0OiBzdHJpbmcsXG4gIGNodW5rU2l6ZTogbnVtYmVyLFxuICBvdmVybGFwOiBudW1iZXIsXG4pOiBBcnJheTx7IHRleHQ6IHN0cmluZzsgc3RhcnRJbmRleDogbnVtYmVyOyBlbmRJbmRleDogbnVtYmVyIH0+IHtcbiAgY29uc3QgY2h1bmtzOiBBcnJheTx7IHRleHQ6IHN0cmluZzsgc3RhcnRJbmRleDogbnVtYmVyOyBlbmRJbmRleDogbnVtYmVyIH0+ID0gW107XG4gIFxuICAvLyBTaW1wbGUgd29yZC1iYXNlZCBjaHVua2luZ1xuICBjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoL1xccysvKTtcbiAgXG4gIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gY2h1bmtzO1xuICB9XG4gIFxuICBsZXQgc3RhcnRJZHggPSAwO1xuICBcbiAgd2hpbGUgKHN0YXJ0SWR4IDwgd29yZHMubGVuZ3RoKSB7XG4gICAgY29uc3QgZW5kSWR4ID0gTWF0aC5taW4oc3RhcnRJZHggKyBjaHVua1NpemUsIHdvcmRzLmxlbmd0aCk7XG4gICAgY29uc3QgY2h1bmtXb3JkcyA9IHdvcmRzLnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xuICAgIGNvbnN0IGNodW5rVGV4dCA9IGNodW5rV29yZHMuam9pbihcIiBcIik7XG4gICAgXG4gICAgY2h1bmtzLnB1c2goe1xuICAgICAgdGV4dDogY2h1bmtUZXh0LFxuICAgICAgc3RhcnRJbmRleDogc3RhcnRJZHgsXG4gICAgICBlbmRJbmRleDogZW5kSWR4LFxuICAgIH0pO1xuICAgIFxuICAgIC8vIE1vdmUgZm9yd2FyZCBieSAoY2h1bmtTaXplIC0gb3ZlcmxhcCkgdG8gY3JlYXRlIG92ZXJsYXBwaW5nIGNodW5rc1xuICAgIHN0YXJ0SWR4ICs9IE1hdGgubWF4KDEsIGNodW5rU2l6ZSAtIG92ZXJsYXApO1xuICAgIFxuICAgIC8vIEJyZWFrIGlmIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgIGlmIChlbmRJZHggPj0gd29yZHMubGVuZ3RoKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBjaHVua3M7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgdG9rZW4gY291bnQgKHJvdWdoIGFwcHJveGltYXRpb246IDEgdG9rZW4gXHUyMjQ4IDQgY2hhcmFjdGVycylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVzdGltYXRlVG9rZW5Db3VudCh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gNCk7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBjcnlwdG8gZnJvbSBcImNyeXB0b1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbi8qKlxuICogQ2FsY3VsYXRlIFNIQS0yNTYgaGFzaCBvZiBhIGZpbGUgZm9yIGNoYW5nZSBkZXRlY3Rpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICBjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcbiAgICBcbiAgICBzdHJlYW0ub24oXCJkYXRhXCIsIChkYXRhKSA9PiBoYXNoLnVwZGF0ZShkYXRhKSk7XG4gICAgc3RyZWFtLm9uKFwiZW5kXCIsICgpID0+IHJlc29sdmUoaGFzaC5kaWdlc3QoXCJoZXhcIikpKTtcbiAgICBzdHJlYW0ub24oXCJlcnJvclwiLCByZWplY3QpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBHZXQgZmlsZSBtZXRhZGF0YSBpbmNsdWRpbmcgc2l6ZSBhbmQgbW9kaWZpY2F0aW9uIHRpbWVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEZpbGVNZXRhZGF0YShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gIHNpemU6IG51bWJlcjtcbiAgbXRpbWU6IERhdGU7XG4gIGhhc2g6IHN0cmluZztcbn0+IHtcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0KGZpbGVQYXRoKTtcbiAgY29uc3QgaGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoKTtcbiAgXG4gIHJldHVybiB7XG4gICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICBtdGltZTogc3RhdHMubXRpbWUsXG4gICAgaGFzaCxcbiAgfTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmcy9wcm9taXNlc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbnRlcmZhY2UgRmFpbGVkRmlsZUVudHJ5IHtcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgcmVhc29uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRyYWNrcyBmaWxlcyB0aGF0IGZhaWxlZCBpbmRleGluZyBmb3IgYSBnaXZlbiBoYXNoIHNvIHdlIGNhbiBza2lwIHRoZW1cbiAqIHdoZW4gYXV0by1yZWluZGV4aW5nIHVuY2hhbmdlZCBkYXRhLlxuICovXG5leHBvcnQgY2xhc3MgRmFpbGVkRmlsZVJlZ2lzdHJ5IHtcbiAgcHJpdmF0ZSBsb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBlbnRyaWVzOiBSZWNvcmQ8c3RyaW5nLCBGYWlsZWRGaWxlRW50cnk+ID0ge307XG4gIHByaXZhdGUgcXVldWU6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHJlZ2lzdHJ5UGF0aDogc3RyaW5nKSB7fVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5sb2FkZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZSh0aGlzLnJlZ2lzdHJ5UGF0aCwgXCJ1dGYtOFwiKTtcbiAgICAgIHRoaXMuZW50cmllcyA9IEpTT04ucGFyc2UoZGF0YSkgPz8ge307XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLmVudHJpZXMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwZXJzaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLm1rZGlyKHBhdGguZGlybmFtZSh0aGlzLnJlZ2lzdHJ5UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0aGlzLnJlZ2lzdHJ5UGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5lbnRyaWVzLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcnVuRXhjbHVzaXZlPFQ+KG9wZXJhdGlvbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucXVldWUudGhlbihvcGVyYXRpb24pO1xuICAgIHRoaXMucXVldWUgPSByZXN1bHQudGhlbihcbiAgICAgICgpID0+IHt9LFxuICAgICAgKCkgPT4ge30sXG4gICAgKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgcmVjb3JkRmFpbHVyZShmaWxlUGF0aDogc3RyaW5nLCBmaWxlSGFzaDogc3RyaW5nLCByZWFzb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLnJ1bkV4Y2x1c2l2ZShhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgIHRoaXMuZW50cmllc1tmaWxlUGF0aF0gPSB7XG4gICAgICAgIGZpbGVIYXNoLFxuICAgICAgICByZWFzb24sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgfTtcbiAgICAgIGF3YWl0IHRoaXMucGVyc2lzdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2xlYXJGYWlsdXJlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICBpZiAodGhpcy5lbnRyaWVzW2ZpbGVQYXRoXSkge1xuICAgICAgICBkZWxldGUgdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXTtcbiAgICAgICAgYXdhaXQgdGhpcy5wZXJzaXN0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRGYWlsdXJlUmVhc29uKGZpbGVQYXRoOiBzdHJpbmcsIGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnkuZmlsZUhhc2ggPT09IGZpbGVIYXNoID8gZW50cnkucmVhc29uIDogdW5kZWZpbmVkO1xuICB9XG59XG5cbiIsICJpbXBvcnQgUFF1ZXVlIGZyb20gXCJwLXF1ZXVlXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHNjYW5EaXJlY3RvcnksIHR5cGUgU2Nhbm5lZEZpbGUgfSBmcm9tIFwiLi9maWxlU2Nhbm5lclwiO1xuaW1wb3J0IHsgcGFyc2VEb2N1bWVudCwgdHlwZSBQYXJzZUZhaWx1cmVSZWFzb24gfSBmcm9tIFwiLi4vcGFyc2Vycy9kb2N1bWVudFBhcnNlclwiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUsIHR5cGUgRG9jdW1lbnRDaHVuayB9IGZyb20gXCIuLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuaW1wb3J0IHsgY2h1bmtUZXh0IH0gZnJvbSBcIi4uL3V0aWxzL3RleHRDaHVua2VyXCI7XG5pbXBvcnQgeyBjYWxjdWxhdGVGaWxlSGFzaCB9IGZyb20gXCIuLi91dGlscy9maWxlSGFzaFwiO1xuaW1wb3J0IHsgdHlwZSBFbWJlZGRpbmdEeW5hbWljSGFuZGxlLCB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IEZhaWxlZEZpbGVSZWdpc3RyeSB9IGZyb20gXCIuLi91dGlscy9mYWlsZWRGaWxlUmVnaXN0cnlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ1Byb2dyZXNzIHtcbiAgdG90YWxGaWxlczogbnVtYmVyO1xuICBwcm9jZXNzZWRGaWxlczogbnVtYmVyO1xuICBjdXJyZW50RmlsZTogc3RyaW5nO1xuICBzdGF0dXM6IFwic2Nhbm5pbmdcIiB8IFwiaW5kZXhpbmdcIiB8IFwiY29tcGxldGVcIiB8IFwiZXJyb3JcIjtcbiAgc3VjY2Vzc2Z1bEZpbGVzPzogbnVtYmVyO1xuICBmYWlsZWRGaWxlcz86IG51bWJlcjtcbiAgc2tpcHBlZEZpbGVzPzogbnVtYmVyO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ1Jlc3VsdCB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgc3VjY2Vzc2Z1bEZpbGVzOiBudW1iZXI7XG4gIGZhaWxlZEZpbGVzOiBudW1iZXI7XG4gIHNraXBwZWRGaWxlczogbnVtYmVyO1xuICB1cGRhdGVkRmlsZXM6IG51bWJlcjtcbiAgbmV3RmlsZXM6IG51bWJlcjtcbn1cblxudHlwZSBGaWxlSW5kZXhPdXRjb21lID1cbiAgfCB7IHR5cGU6IFwic2tpcHBlZFwiIH1cbiAgfCB7IHR5cGU6IFwiaW5kZXhlZFwiOyBjaGFuZ2VUeXBlOiBcIm5ld1wiIHwgXCJ1cGRhdGVkXCIgfVxuICB8IHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4aW5nT3B0aW9ucyB7XG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nO1xuICB2ZWN0b3JTdG9yZTogVmVjdG9yU3RvcmU7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGVtYmVkZGluZ01vZGVsOiBFbWJlZGRpbmdEeW5hbWljSGFuZGxlO1xuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50O1xuICBjaHVua1NpemU6IG51bWJlcjtcbiAgY2h1bmtPdmVybGFwOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgZW5hYmxlT0NSOiBib29sZWFuO1xuICBhdXRvUmVpbmRleDogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIGZhaWx1cmVSZXBvcnRQYXRoPzogc3RyaW5nO1xuICBhYm9ydFNpZ25hbD86IEFib3J0U2lnbmFsO1xuICBvblByb2dyZXNzPzogKHByb2dyZXNzOiBJbmRleGluZ1Byb2dyZXNzKSA9PiB2b2lkO1xufVxuXG50eXBlIEZhaWx1cmVSZWFzb24gPSBQYXJzZUZhaWx1cmVSZWFzb24gfCBcImluZGV4LmNodW5rLWVtcHR5XCIgfCBcImluZGV4LnZlY3Rvci1hZGQtZXJyb3JcIjtcblxuZnVuY3Rpb24gY29lcmNlRW1iZWRkaW5nVmVjdG9yKHJhdzogdW5rbm93bik6IG51bWJlcltdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkocmF3KSkge1xuICAgIHJldHVybiByYXcubWFwKGFzc2VydEZpbml0ZU51bWJlcik7XG4gIH1cblxuICBpZiAodHlwZW9mIHJhdyA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBbYXNzZXJ0RmluaXRlTnVtYmVyKHJhdyldO1xuICB9XG5cbiAgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSBcIm9iamVjdFwiKSB7XG4gICAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhyYXcpKSB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShyYXcgYXMgdW5rbm93biBhcyBBcnJheUxpa2U8bnVtYmVyPikubWFwKGFzc2VydEZpbml0ZU51bWJlcik7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuZGlkYXRlID1cbiAgICAgIChyYXcgYXMgYW55KS5lbWJlZGRpbmcgPz9cbiAgICAgIChyYXcgYXMgYW55KS52ZWN0b3IgPz9cbiAgICAgIChyYXcgYXMgYW55KS5kYXRhID8/XG4gICAgICAodHlwZW9mIChyYXcgYXMgYW55KS50b0FycmF5ID09PSBcImZ1bmN0aW9uXCIgPyAocmF3IGFzIGFueSkudG9BcnJheSgpIDogdW5kZWZpbmVkKSA/P1xuICAgICAgKHR5cGVvZiAocmF3IGFzIGFueSkudG9KU09OID09PSBcImZ1bmN0aW9uXCIgPyAocmF3IGFzIGFueSkudG9KU09OKCkgOiB1bmRlZmluZWQpO1xuXG4gICAgaWYgKGNhbmRpZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gY29lcmNlRW1iZWRkaW5nVmVjdG9yKGNhbmRpZGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKFwiRW1iZWRkaW5nIHByb3ZpZGVyIHJldHVybmVkIGEgbm9uLW51bWVyaWMgdmVjdG9yXCIpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRGaW5pdGVOdW1iZXIodmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCBudW0gPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG51bSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbWJlZGRpbmcgdmVjdG9yIGNvbnRhaW5zIGEgbm9uLWZpbml0ZSB2YWx1ZVwiKTtcbiAgfVxuICByZXR1cm4gbnVtO1xufVxuXG5leHBvcnQgY2xhc3MgSW5kZXhNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBxdWV1ZTogUFF1ZXVlO1xuICBwcml2YXRlIG9wdGlvbnM6IEluZGV4aW5nT3B0aW9ucztcbiAgcHJpdmF0ZSBmYWlsdXJlUmVhc29uQ291bnRzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gIHByaXZhdGUgZmFpbGVkRmlsZVJlZ2lzdHJ5OiBGYWlsZWRGaWxlUmVnaXN0cnk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogSW5kZXhpbmdPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnF1ZXVlID0gbmV3IFBRdWV1ZSh7IGNvbmN1cnJlbmN5OiBvcHRpb25zLm1heENvbmN1cnJlbnQgfSk7XG4gICAgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkgPSBuZXcgRmFpbGVkRmlsZVJlZ2lzdHJ5KFxuICAgICAgcGF0aC5qb2luKG9wdGlvbnMudmVjdG9yU3RvcmVEaXIsIFwiLmJpZy1yYWctZmFpbHVyZXMuanNvblwiKSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBpbmRleGluZyBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBpbmRleCgpOiBQcm9taXNlPEluZGV4aW5nUmVzdWx0PiB7XG4gICAgY29uc3QgeyBkb2N1bWVudHNEaXIsIHZlY3RvclN0b3JlLCBvblByb2dyZXNzIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUludmVudG9yeSA9IGF3YWl0IHZlY3RvclN0b3JlLmdldEZpbGVIYXNoSW52ZW50b3J5KCk7XG5cbiAgICAgIC8vIFN0ZXAgMTogU2NhbiBkaXJlY3RvcnlcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IDAsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcInNjYW5uaW5nXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHNjYW5EaXJlY3RvcnkoZG9jdW1lbnRzRGlyLCAoc2Nhbm5lZCwgZm91bmQpID0+IHtcbiAgICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZvdW5kLFxuICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgICBjdXJyZW50RmlsZTogYFNjYW5uZWQgJHtzY2FubmVkfSBmaWxlcy4uLmAsXG4gICAgICAgICAgICBzdGF0dXM6IFwic2Nhbm5pbmdcIixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHRoaXMub3B0aW9ucy5hYm9ydFNpZ25hbD8udGhyb3dJZkFib3J0ZWQoKTtcblxuICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7ZmlsZXMubGVuZ3RofSBmaWxlcyB0byBwcm9jZXNzYCk7XG5cbiAgICAgIC8vIFN0ZXAgMjogSW5kZXggZmlsZXNcbiAgICAgIGxldCBwcm9jZXNzZWRDb3VudCA9IDA7XG4gICAgICBsZXQgc3VjY2Vzc0NvdW50ID0gMDtcbiAgICAgIGxldCBmYWlsQ291bnQgPSAwO1xuICAgICAgbGV0IHNraXBwZWRDb3VudCA9IDA7XG4gICAgICBsZXQgdXBkYXRlZENvdW50ID0gMDtcbiAgICAgIGxldCBuZXdDb3VudCA9IDA7XG5cbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogZmlsZXNbMF0/Lm5hbWUgPz8gXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEFib3J0IGxpc3RlbmVyOiB3aGVuIHNpZ25hbCBmaXJlcywgY2xlYXIgcGVuZGluZyB0YXNrcyBmcm9tIHRoZSBxdWV1ZVxuICAgICAgY29uc3QgYWJvcnRTaWduYWwgPSB0aGlzLm9wdGlvbnMuYWJvcnRTaWduYWw7XG4gICAgICBjb25zdCBvbkFib3J0ID0gKCkgPT4gdGhpcy5xdWV1ZS5jbGVhcigpO1xuICAgICAgaWYgKGFib3J0U2lnbmFsKSB7XG4gICAgICAgIGFib3J0U2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoXCJhYm9ydFwiLCBvbkFib3J0LCB7IG9uY2U6IHRydWUgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFByb2Nlc3MgZmlsZXMgaW4gYmF0Y2hlc1xuICAgICAgY29uc3QgdGFza3MgPSBmaWxlcy5tYXAoKGZpbGUpID0+XG4gICAgICAgIHRoaXMucXVldWUuYWRkKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAvLyBDaGVjayBhYm9ydCBiZWZvcmUgcHJvY2Vzc2luZyBlYWNoIGZpbGVcbiAgICAgICAgICBhYm9ydFNpZ25hbD8udGhyb3dJZkFib3J0ZWQoKTtcblxuICAgICAgICAgIGxldCBvdXRjb21lOiBGaWxlSW5kZXhPdXRjb21lID0geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgICAgICAgY3VycmVudEZpbGU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICAgICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0Y29tZSA9IGF3YWl0IHRoaXMuaW5kZXhGaWxlKGZpbGUsIGZpbGVJbnZlbnRvcnkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbmRleGluZyBmaWxlICR7ZmlsZS5wYXRofTpgLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgICAgIFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwcm9jZXNzZWRDb3VudCsrO1xuICAgICAgICAgIHN3aXRjaCAob3V0Y29tZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwic2tpcHBlZFwiOlxuICAgICAgICAgICAgICBzdWNjZXNzQ291bnQrKztcbiAgICAgICAgICAgICAgc2tpcHBlZENvdW50Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImluZGV4ZWRcIjpcbiAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50Kys7XG4gICAgICAgICAgICAgIGlmIChvdXRjb21lLmNoYW5nZVR5cGUgPT09IFwibmV3XCIpIHtcbiAgICAgICAgICAgICAgICBuZXdDb3VudCsrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVwZGF0ZWRDb3VudCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImZhaWxlZFwiOlxuICAgICAgICAgICAgICBmYWlsQ291bnQrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiBwcm9jZXNzZWRDb3VudCxcbiAgICAgICAgICAgICAgY3VycmVudEZpbGU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKTtcblxuICAgICAgLy8gQ2xlYW4gdXAgYWJvcnQgbGlzdGVuZXJcbiAgICAgIGlmIChhYm9ydFNpZ25hbCkge1xuICAgICAgICBhYm9ydFNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgb25BYm9ydCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImNvbXBsZXRlXCIsXG4gICAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubG9nRmFpbHVyZVN1bW1hcnkoKTtcbiAgICAgIGF3YWl0IHRoaXMud3JpdGVGYWlsdXJlUmVwb3J0KHtcbiAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIHVwZGF0ZWRGaWxlczogdXBkYXRlZENvdW50LFxuICAgICAgICBuZXdGaWxlczogbmV3Q291bnQsXG4gICAgICB9KTtcblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBJbmRleGluZyBjb21wbGV0ZTogJHtzdWNjZXNzQ291bnR9LyR7ZmlsZXMubGVuZ3RofSBmaWxlcyBzdWNjZXNzZnVsbHkgaW5kZXhlZCAoJHtmYWlsQ291bnR9IGZhaWxlZCwgc2tpcHBlZD0ke3NraXBwZWRDb3VudH0sIHVwZGF0ZWQ9JHt1cGRhdGVkQ291bnR9LCBuZXc9JHtuZXdDb3VudH0pYCxcbiAgICAgICk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB1cGRhdGVkRmlsZXM6IHVwZGF0ZWRDb3VudCxcbiAgICAgICAgbmV3RmlsZXM6IG5ld0NvdW50LFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGR1cmluZyBpbmRleGluZzpcIiwgZXJyb3IpO1xuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogMCxcbiAgICAgICAgICBwcm9jZXNzZWRGaWxlczogMCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiZXJyb3JcIixcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRleCBhIHNpbmdsZSBmaWxlXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGluZGV4RmlsZShcbiAgICBmaWxlOiBTY2FubmVkRmlsZSxcbiAgICBmaWxlSW52ZW50b3J5OiBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4gPSBuZXcgTWFwKCksXG4gICk6IFByb21pc2U8RmlsZUluZGV4T3V0Y29tZT4ge1xuICAgIGNvbnN0IHsgdmVjdG9yU3RvcmUsIGVtYmVkZGluZ01vZGVsLCBjbGllbnQsIGNodW5rU2l6ZSwgY2h1bmtPdmVybGFwLCBlbmFibGVPQ1IsIGF1dG9SZWluZGV4IH0gPVxuICAgICAgdGhpcy5vcHRpb25zO1xuXG4gICAgbGV0IGZpbGVIYXNoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgdHJ5IHtcbiAgICAgIC8vIENhbGN1bGF0ZSBmaWxlIGhhc2hcbiAgICAgIGZpbGVIYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IGV4aXN0aW5nSGFzaGVzID0gZmlsZUludmVudG9yeS5nZXQoZmlsZS5wYXRoKTtcbiAgICAgIGNvbnN0IGhhc1NlZW5CZWZvcmUgPSBleGlzdGluZ0hhc2hlcyAhPT0gdW5kZWZpbmVkICYmIGV4aXN0aW5nSGFzaGVzLnNpemUgPiAwO1xuICAgICAgY29uc3QgaGFzU2FtZUhhc2ggPSBleGlzdGluZ0hhc2hlcz8uaGFzKGZpbGVIYXNoKSA/PyBmYWxzZTtcblxuICAgICAgLy8gQ2hlY2sgaWYgZmlsZSBhbHJlYWR5IGluZGV4ZWRcbiAgICAgIGlmIChhdXRvUmVpbmRleCAmJiBoYXNTYW1lSGFzaCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgRmlsZSBhbHJlYWR5IGluZGV4ZWQgKHNraXBwZWQpOiAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJza2lwcGVkXCIgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKGF1dG9SZWluZGV4KSB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzRmFpbHVyZSA9IGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LmdldEZhaWx1cmVSZWFzb24oZmlsZS5wYXRoLCBmaWxlSGFzaCk7XG4gICAgICAgIGlmIChwcmV2aW91c0ZhaWx1cmUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBGaWxlIHByZXZpb3VzbHkgZmFpbGVkIChza2lwcGVkKTogJHtmaWxlLm5hbWV9IChyZWFzb249JHtwcmV2aW91c0ZhaWx1cmV9KWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm4geyB0eXBlOiBcInNraXBwZWRcIiB9O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdhaXQgYmVmb3JlIHBhcnNpbmcgdG8gcmVkdWNlIFdlYlNvY2tldCBsb2FkXG4gICAgICBpZiAodGhpcy5vcHRpb25zLnBhcnNlRGVsYXlNcyA+IDApIHtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMub3B0aW9ucy5wYXJzZURlbGF5TXMpKTtcbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgZG9jdW1lbnRcbiAgICAgIGNvbnN0IHBhcnNlZFJlc3VsdCA9IGF3YWl0IHBhcnNlRG9jdW1lbnQoZmlsZS5wYXRoLCBlbmFibGVPQ1IsIGNsaWVudCk7XG4gICAgICBpZiAoIXBhcnNlZFJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShwYXJzZWRSZXN1bHQucmVhc29uLCBwYXJzZWRSZXN1bHQuZGV0YWlscywgZmlsZSk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgcGFyc2VkUmVzdWx0LnJlYXNvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VkUmVzdWx0LmRvY3VtZW50O1xuXG4gICAgICAvLyBDaHVuayB0ZXh0XG4gICAgICBjb25zdCBjaHVua3MgPSBjaHVua1RleHQocGFyc2VkLnRleHQsIGNodW5rU2l6ZSwgY2h1bmtPdmVybGFwKTtcbiAgICAgIGlmIChjaHVua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBObyBjaHVua3MgY3JlYXRlZCBmcm9tICR7ZmlsZS5uYW1lfWApO1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXCJpbmRleC5jaHVuay1lbXB0eVwiLCBcImNodW5rVGV4dCBwcm9kdWNlZCAwIGNodW5rc1wiLCBmaWxlKTtcbiAgICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcImluZGV4LmNodW5rLWVtcHR5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTsgLy8gRmFpbGVkIHRvIGNodW5rXG4gICAgICB9XG5cbiAgICAgIC8vIEdlbmVyYXRlIGVtYmVkZGluZ3MgYW5kIGNyZWF0ZSBkb2N1bWVudCBjaHVua3NcbiAgICAgIGNvbnN0IGRvY3VtZW50Q2h1bmtzOiBEb2N1bWVudENodW5rW10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2h1bmsgPSBjaHVua3NbaV07XG4gICAgICAgIFxuICAgICAgICAvLyBDaGVjayBhYm9ydCBiZXR3ZWVuIGNodW5rIGVtYmVkZGluZ3NcbiAgICAgICAgdGhpcy5vcHRpb25zLmFib3J0U2lnbmFsPy50aHJvd0lmQWJvcnRlZCgpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gR2VuZXJhdGUgZW1iZWRkaW5nXG4gICAgICAgICAgY29uc3QgZW1iZWRkaW5nUmVzdWx0ID0gYXdhaXQgZW1iZWRkaW5nTW9kZWwuZW1iZWQoY2h1bmsudGV4dCk7XG4gICAgICAgICAgY29uc3QgZW1iZWRkaW5nID0gY29lcmNlRW1iZWRkaW5nVmVjdG9yKGVtYmVkZGluZ1Jlc3VsdC5lbWJlZGRpbmcpO1xuICAgICAgICAgIFxuICAgICAgICAgIGRvY3VtZW50Q2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgaWQ6IGAke2ZpbGVIYXNofS0ke2l9YCxcbiAgICAgICAgICAgIHRleHQ6IGNodW5rLnRleHQsXG4gICAgICAgICAgICB2ZWN0b3I6IGVtYmVkZGluZyxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlLnBhdGgsXG4gICAgICAgICAgICBmaWxlTmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgZmlsZUhhc2gsXG4gICAgICAgICAgICBjaHVua0luZGV4OiBpLFxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBmaWxlLmV4dGVuc2lvbixcbiAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgICAgICAgICBtdGltZTogZmlsZS5tdGltZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICBzdGFydEluZGV4OiBjaHVuay5zdGFydEluZGV4LFxuICAgICAgICAgICAgICBlbmRJbmRleDogY2h1bmsuZW5kSW5kZXgsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGVtYmVkZGluZyBjaHVuayAke2l9IG9mICR7ZmlsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGNodW5rcyB0byB2ZWN0b3Igc3RvcmVcbiAgICAgIGlmIChkb2N1bWVudENodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgIFwiaW5kZXguY2h1bmstZW1wdHlcIixcbiAgICAgICAgICBcIkFsbCBjaHVuayBlbWJlZGRpbmdzIGZhaWxlZCwgbm8gZG9jdW1lbnQgY2h1bmtzXCIsXG4gICAgICAgICAgZmlsZSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcImluZGV4LmNodW5rLWVtcHR5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuYWRkQ2h1bmtzKGRvY3VtZW50Q2h1bmtzKTtcbiAgICAgICAgY29uc29sZS5sb2coYEluZGV4ZWQgJHtkb2N1bWVudENodW5rcy5sZW5ndGh9IGNodW5rcyBmcm9tICR7ZmlsZS5uYW1lfWApO1xuICAgICAgICBpZiAoIWV4aXN0aW5nSGFzaGVzKSB7XG4gICAgICAgICAgZmlsZUludmVudG9yeS5zZXQoZmlsZS5wYXRoLCBuZXcgU2V0KFtmaWxlSGFzaF0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleGlzdGluZ0hhc2hlcy5hZGQoZmlsZUhhc2gpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LmNsZWFyRmFpbHVyZShmaWxlLnBhdGgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiaW5kZXhlZFwiLFxuICAgICAgICAgIGNoYW5nZVR5cGU6IGhhc1NlZW5CZWZvcmUgPyBcInVwZGF0ZWRcIiA6IFwibmV3XCIsXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBhZGRpbmcgY2h1bmtzIGZvciAke2ZpbGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCIsXG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluZGV4aW5nIGZpbGUgJHtmaWxlLnBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgICBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICk7XG4gICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9OyAvLyBGYWlsZWRcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVpbmRleCBhIHNwZWNpZmljIGZpbGUgKGRlbGV0ZSBvbGQgY2h1bmtzIGFuZCByZWluZGV4KVxuICAgKi9cbiAgYXN5bmMgcmVpbmRleEZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgdmVjdG9yU3RvcmUgfSA9IHRoaXMub3B0aW9ucztcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlSGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoKTtcbiAgICAgIFxuICAgICAgLy8gRGVsZXRlIG9sZCBjaHVua3NcbiAgICAgIGF3YWl0IHZlY3RvclN0b3JlLmRlbGV0ZUJ5RmlsZUhhc2goZmlsZUhhc2gpO1xuICAgICAgXG4gICAgICAvLyBSZWluZGV4XG4gICAgICBjb25zdCBmaWxlOiBTY2FubmVkRmlsZSA9IHtcbiAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgIG5hbWU6IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aCxcbiAgICAgICAgZXh0ZW5zaW9uOiBmaWxlUGF0aC5zcGxpdChcIi5cIikucG9wKCkgfHwgXCJcIixcbiAgICAgICAgbWltZVR5cGU6IGZhbHNlLFxuICAgICAgICBzaXplOiAwLFxuICAgICAgICBtdGltZTogbmV3IERhdGUoKSxcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGF3YWl0IHRoaXMuaW5kZXhGaWxlKGZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZWluZGV4aW5nIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRGYWlsdXJlKHJlYXNvbjogRmFpbHVyZVJlYXNvbiwgZGV0YWlsczogc3RyaW5nIHwgdW5kZWZpbmVkLCBmaWxlOiBTY2FubmVkRmlsZSkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXSA/PyAwO1xuICAgIHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dID0gY3VycmVudCArIDE7XG4gICAgY29uc3QgZGV0YWlsU3VmZml4ID0gZGV0YWlscyA/IGAgZGV0YWlscz0ke2RldGFpbHN9YCA6IFwiXCI7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIEZhaWxlZCB0byBwYXJzZSAke2ZpbGUubmFtZX0gKHJlYXNvbj0ke3JlYXNvbn0sIGNvdW50PSR7dGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl19KSR7ZGV0YWlsU3VmZml4fWAsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9nRmFpbHVyZVN1bW1hcnkoKSB7XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50cyk7XG4gICAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIltCaWdSQUddIE5vIHBhcnNpbmcgZmFpbHVyZXMgcmVjb3JkZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIltCaWdSQUddIEZhaWx1cmUgcmVhc29uIHN1bW1hcnk6XCIpO1xuICAgIGZvciAoY29uc3QgW3JlYXNvbiwgY291bnRdIG9mIGVudHJpZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgIC0gJHtyZWFzb259OiAke2NvdW50fWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgd3JpdGVGYWlsdXJlUmVwb3J0KHN1bW1hcnk6IEluZGV4aW5nUmVzdWx0KSB7XG4gICAgY29uc3QgcmVwb3J0UGF0aCA9IHRoaXMub3B0aW9ucy5mYWlsdXJlUmVwb3J0UGF0aDtcbiAgICBpZiAoIXJlcG9ydFBhdGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgLi4uc3VtbWFyeSxcbiAgICAgIGRvY3VtZW50c0RpcjogdGhpcy5vcHRpb25zLmRvY3VtZW50c0RpcixcbiAgICAgIGZhaWx1cmVSZWFzb25zOiB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHMsXG4gICAgICBnZW5lcmF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIocGF0aC5kaXJuYW1lKHJlcG9ydFBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShyZXBvcnRQYXRoLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcbiAgICAgIGNvbnNvbGUubG9nKGBbQmlnUkFHXSBXcm90ZSBmYWlsdXJlIHJlcG9ydCB0byAke3JlcG9ydFBhdGh9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtCaWdSQUddIEZhaWxlZCB0byB3cml0ZSBmYWlsdXJlIHJlcG9ydCB0byAke3JlcG9ydFBhdGh9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgSW5kZXhNYW5hZ2VyLCB0eXBlIEluZGV4aW5nUHJvZ3Jlc3MsIHR5cGUgSW5kZXhpbmdSZXN1bHQgfSBmcm9tIFwiLi9pbmRleE1hbmFnZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlIH0gZnJvbSBcIi4uL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSW5kZXhpbmdQYXJhbXMge1xuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50O1xuICBhYm9ydFNpZ25hbDogQWJvcnRTaWduYWw7XG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBjaHVua1NpemU6IG51bWJlcjtcbiAgY2h1bmtPdmVybGFwOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgZW5hYmxlT0NSOiBib29sZWFuO1xuICBhdXRvUmVpbmRleDogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIGZvcmNlUmVpbmRleD86IGJvb2xlYW47XG4gIHZlY3RvclN0b3JlPzogVmVjdG9yU3RvcmU7XG4gIG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IEluZGV4aW5nUHJvZ3Jlc3MpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSW5kZXhpbmdSZXN1bHQge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIHN0YXRzOiB7XG4gICAgdG90YWxDaHVua3M6IG51bWJlcjtcbiAgICB1bmlxdWVGaWxlczogbnVtYmVyO1xuICB9O1xuICBpbmRleGluZ1Jlc3VsdDogSW5kZXhpbmdSZXN1bHQ7XG59XG5cbi8qKlxuICogU2hhcmVkIGhlbHBlciB0aGF0IHJ1bnMgdGhlIGZ1bGwgaW5kZXhpbmcgcGlwZWxpbmUuXG4gKiBBbGxvd3MgcmV1c2UgYWNyb3NzIHRoZSBtYW51YWwgdG9vbCwgY29uZmlnLXRyaWdnZXJlZCBpbmRleGluZywgYW5kIGF1dG9tYXRpYyBib290c3RyYXBwaW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSW5kZXhpbmdKb2Ioe1xuICBjbGllbnQsXG4gIGFib3J0U2lnbmFsLFxuICBkb2N1bWVudHNEaXIsXG4gIHZlY3RvclN0b3JlRGlyLFxuICBjaHVua1NpemUsXG4gIGNodW5rT3ZlcmxhcCxcbiAgbWF4Q29uY3VycmVudCxcbiAgZW5hYmxlT0NSLFxuICBhdXRvUmVpbmRleCxcbiAgcGFyc2VEZWxheU1zLFxuICBmb3JjZVJlaW5kZXggPSBmYWxzZSxcbiAgdmVjdG9yU3RvcmU6IGV4aXN0aW5nVmVjdG9yU3RvcmUsXG4gIG9uUHJvZ3Jlc3MsXG59OiBSdW5JbmRleGluZ1BhcmFtcyk6IFByb21pc2U8UnVuSW5kZXhpbmdSZXN1bHQ+IHtcbiAgY29uc3QgdmVjdG9yU3RvcmUgPSBleGlzdGluZ1ZlY3RvclN0b3JlID8/IG5ldyBWZWN0b3JTdG9yZSh2ZWN0b3JTdG9yZURpcik7XG4gIGNvbnN0IG93bnNWZWN0b3JTdG9yZSA9IGV4aXN0aW5nVmVjdG9yU3RvcmUgPT09IHVuZGVmaW5lZDtcblxuICBpZiAob3duc1ZlY3RvclN0b3JlKSB7XG4gICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICB9XG5cbiAgY29uc3QgZW1iZWRkaW5nTW9kZWwgPSBhd2FpdCBjbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgIFwibm9taWMtYWkvbm9taWMtZW1iZWQtdGV4dC12MS41LUdHVUZcIixcbiAgICB7IHNpZ25hbDogYWJvcnRTaWduYWwgfSxcbiAgKTtcblxuICBjb25zdCBpbmRleE1hbmFnZXIgPSBuZXcgSW5kZXhNYW5hZ2VyKHtcbiAgICBkb2N1bWVudHNEaXIsXG4gICAgdmVjdG9yU3RvcmUsXG4gICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgZW1iZWRkaW5nTW9kZWwsXG4gICAgY2xpZW50LFxuICAgIGNodW5rU2l6ZSxcbiAgICBjaHVua092ZXJsYXAsXG4gICAgbWF4Q29uY3VycmVudCxcbiAgICBlbmFibGVPQ1IsXG4gICAgYXV0b1JlaW5kZXg6IGZvcmNlUmVpbmRleCA/IGZhbHNlIDogYXV0b1JlaW5kZXgsXG4gICAgcGFyc2VEZWxheU1zLFxuICAgIGFib3J0U2lnbmFsLFxuICAgIG9uUHJvZ3Jlc3MsXG4gIH0pO1xuXG4gIGNvbnN0IGluZGV4aW5nUmVzdWx0ID0gYXdhaXQgaW5kZXhNYW5hZ2VyLmluZGV4KCk7XG4gIGNvbnN0IHN0YXRzID0gYXdhaXQgdmVjdG9yU3RvcmUuZ2V0U3RhdHMoKTtcblxuICBpZiAob3duc1ZlY3RvclN0b3JlKSB7XG4gICAgYXdhaXQgdmVjdG9yU3RvcmUuY2xvc2UoKTtcbiAgfVxuXG4gIGNvbnN0IHN1bW1hcnkgPSBgSW5kZXhpbmcgY29tcGxldGVkIVxcblxcbmAgK1xuICAgIGBcdTIwMjIgU3VjY2Vzc2Z1bGx5IGluZGV4ZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgQ2h1bmtzIGluIHN0b3JlOiAke3N0YXRzLnRvdGFsQ2h1bmtzfVxcbmAgK1xuICAgIGBcdTIwMjIgVW5pcXVlIGZpbGVzIGluIHN0b3JlOiAke3N0YXRzLnVuaXF1ZUZpbGVzfWA7XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5LFxuICAgIHN0YXRzLFxuICAgIGluZGV4aW5nUmVzdWx0LFxuICB9O1xufVxuXG4iLCAiaW1wb3J0IHtcbiAgdHlwZSBDaGF0TWVzc2FnZSxcbiAgdHlwZSBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxufSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcywgREVGQVVMVF9QUk9NUFRfVEVNUExBVEUgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlIH0gZnJvbSBcIi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcbmltcG9ydCB7IHBlcmZvcm1TYW5pdHlDaGVja3MgfSBmcm9tIFwiLi91dGlscy9zYW5pdHlDaGVja3NcIjtcbmltcG9ydCB7IHRyeVN0YXJ0SW5kZXhpbmcsIGZpbmlzaEluZGV4aW5nIH0gZnJvbSBcIi4vdXRpbHMvaW5kZXhpbmdMb2NrXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBydW5JbmRleGluZ0pvYiB9IGZyb20gXCIuL2luZ2VzdGlvbi9ydW5JbmRleGluZ1wiO1xuXG4vKipcbiAqIENoZWNrIHRoZSBhYm9ydCBzaWduYWwgYW5kIHRocm93IGlmIHRoZSByZXF1ZXN0IGhhcyBiZWVuIGNhbmNlbGxlZC5cbiAqIFRoaXMgZ2l2ZXMgTE0gU3R1ZGlvIHRoZSBvcHBvcnR1bml0eSB0byBzdG9wIHRoZSBwcmVwcm9jZXNzb3IgcHJvbXB0bHkuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrQWJvcnQoc2lnbmFsOiBBYm9ydFNpZ25hbCk6IHZvaWQge1xuICBpZiAoc2lnbmFsLmFib3J0ZWQpIHtcbiAgICB0aHJvdyBzaWduYWwucmVhc29uID8/IG5ldyBET01FeGNlcHRpb24oXCJBYm9ydGVkXCIsIFwiQWJvcnRFcnJvclwiKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgZXJyb3IgaXMgYW4gYWJvcnQvY2FuY2VsbGF0aW9uIGVycm9yIHRoYXQgc2hvdWxkIGJlIHJlLXRocm93bi5cbiAqL1xuZnVuY3Rpb24gaXNBYm9ydEVycm9yKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIERPTUV4Y2VwdGlvbiAmJiBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikgcmV0dXJuIHRydWU7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSByZXR1cm4gdHJ1ZTtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZSA9PT0gXCJBYm9ydGVkXCIpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZVRleHQodGV4dDogc3RyaW5nLCBtYXhMaW5lczogbnVtYmVyID0gMywgbWF4Q2hhcnM6IG51bWJlciA9IDQwMCk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pLmZpbHRlcihsaW5lID0+IGxpbmUudHJpbSgpICE9PSBcIlwiKTtcbiAgY29uc3QgY2xpcHBlZExpbmVzID0gbGluZXMuc2xpY2UoMCwgbWF4TGluZXMpO1xuICBsZXQgY2xpcHBlZCA9IGNsaXBwZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xuICBpZiAoY2xpcHBlZC5sZW5ndGggPiBtYXhDaGFycykge1xuICAgIGNsaXBwZWQgPSBjbGlwcGVkLnNsaWNlKDAsIG1heENoYXJzKTtcbiAgfVxuICBjb25zdCBuZWVkc0VsbGlwc2lzID1cbiAgICBsaW5lcy5sZW5ndGggPiBtYXhMaW5lcyB8fFxuICAgIHRleHQubGVuZ3RoID4gY2xpcHBlZC5sZW5ndGggfHxcbiAgICBjbGlwcGVkLmxlbmd0aCA9PT0gbWF4Q2hhcnMgJiYgdGV4dC5sZW5ndGggPiBtYXhDaGFycztcbiAgcmV0dXJuIG5lZWRzRWxsaXBzaXMgPyBgJHtjbGlwcGVkLnRyaW1FbmQoKX1cdTIwMjZgIDogY2xpcHBlZDtcbn1cblxuLy8gR2xvYmFsIHN0YXRlIGZvciB2ZWN0b3Igc3RvcmUgKHBlcnNpc3RzIGFjcm9zcyByZXF1ZXN0cylcbmxldCB2ZWN0b3JTdG9yZTogVmVjdG9yU3RvcmUgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0SW5kZXhlZERpciA9IFwiXCI7XG5sZXQgc2FuaXR5Q2hlY2tzUGFzc2VkID0gZmFsc2U7XG5cbmNvbnN0IFJBR19DT05URVhUX01BQ1JPID0gXCJ7e3JhZ19jb250ZXh0fX1cIjtcbmNvbnN0IFVTRVJfUVVFUllfTUFDUk8gPSBcInt7dXNlcl9xdWVyeX19XCI7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb21wdFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgY29uc3QgaGFzQ29udGVudCA9IHR5cGVvZiB0ZW1wbGF0ZSA9PT0gXCJzdHJpbmdcIiAmJiB0ZW1wbGF0ZS50cmltKCkubGVuZ3RoID4gMDtcbiAgbGV0IG5vcm1hbGl6ZWQgPSBoYXNDb250ZW50ID8gdGVtcGxhdGUhIDogREVGQVVMVF9QUk9NUFRfVEVNUExBVEU7XG5cbiAgaWYgKCFub3JtYWxpemVkLmluY2x1ZGVzKFJBR19DT05URVhUX01BQ1JPKSkge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBbQmlnUkFHXSBQcm9tcHQgdGVtcGxhdGUgbWlzc2luZyAke1JBR19DT05URVhUX01BQ1JPfS4gUHJlcGVuZGluZyBSQUcgY29udGV4dCBibG9jay5gLFxuICAgICk7XG4gICAgbm9ybWFsaXplZCA9IGAke1JBR19DT05URVhUX01BQ1JPfVxcblxcbiR7bm9ybWFsaXplZH1gO1xuICB9XG5cbiAgaWYgKCFub3JtYWxpemVkLmluY2x1ZGVzKFVTRVJfUVVFUllfTUFDUk8pKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIFByb21wdCB0ZW1wbGF0ZSBtaXNzaW5nICR7VVNFUl9RVUVSWV9NQUNST30uIEFwcGVuZGluZyB1c2VyIHF1ZXJ5IGJsb2NrLmAsXG4gICAgKTtcbiAgICBub3JtYWxpemVkID0gYCR7bm9ybWFsaXplZH1cXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7VVNFUl9RVUVSWV9NQUNST31gO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbGxQcm9tcHRUZW1wbGF0ZSh0ZW1wbGF0ZTogc3RyaW5nLCByZXBsYWNlbWVudHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMocmVwbGFjZW1lbnRzKS5yZWR1Y2UoXG4gICAgKGFjYywgW3Rva2VuLCB2YWx1ZV0pID0+IGFjYy5zcGxpdCh0b2tlbikuam9pbih2YWx1ZSksXG4gICAgdGVtcGxhdGUsXG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdhcm5JZkNvbnRleHRPdmVyZmxvdyhcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxuICBmaW5hbFByb21wdDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdG9rZW5Tb3VyY2UgPSBhd2FpdCBjdGwudG9rZW5Tb3VyY2UoKTtcbiAgICBpZiAoXG4gICAgICAhdG9rZW5Tb3VyY2UgfHxcbiAgICAgICEoXCJhcHBseVByb21wdFRlbXBsYXRlXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuYXBwbHlQcm9tcHRUZW1wbGF0ZSAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiY291bnRUb2tlbnNcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5jb3VudFRva2VucyAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiZ2V0Q29udGV4dExlbmd0aFwiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmdldENvbnRleHRMZW5ndGggIT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVG9rZW4gc291cmNlIGRvZXMgbm90IGV4cG9zZSBwcm9tcHQgdXRpbGl0aWVzOyBza2lwcGluZyBjb250ZXh0IGNoZWNrLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBbY29udGV4dExlbmd0aCwgaGlzdG9yeV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0b2tlblNvdXJjZS5nZXRDb250ZXh0TGVuZ3RoKCksXG4gICAgICBjdGwucHVsbEhpc3RvcnkoKSxcbiAgICBdKTtcbiAgICBjb25zdCBoaXN0b3J5V2l0aExhdGVzdE1lc3NhZ2UgPSBoaXN0b3J5LndpdGhBcHBlbmRlZCh7XG4gICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgIGNvbnRlbnQ6IGZpbmFsUHJvbXB0LFxuICAgIH0pO1xuICAgIGNvbnN0IGZvcm1hdHRlZFByb21wdCA9IGF3YWl0IHRva2VuU291cmNlLmFwcGx5UHJvbXB0VGVtcGxhdGUoaGlzdG9yeVdpdGhMYXRlc3RNZXNzYWdlKTtcbiAgICBjb25zdCBwcm9tcHRUb2tlbnMgPSBhd2FpdCB0b2tlblNvdXJjZS5jb3VudFRva2Vucyhmb3JtYXR0ZWRQcm9tcHQpO1xuXG4gICAgaWYgKHByb21wdFRva2VucyA+IGNvbnRleHRMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdTdW1tYXJ5ID1cbiAgICAgICAgYFx1MjZBMFx1RkUwRiBQcm9tcHQgbmVlZHMgJHtwcm9tcHRUb2tlbnMudG9Mb2NhbGVTdHJpbmcoKX0gdG9rZW5zIGJ1dCBtb2RlbCBtYXggaXMgJHtjb250ZXh0TGVuZ3RoLnRvTG9jYWxlU3RyaW5nKCl9LmA7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nU3VtbWFyeSk7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgIHRleHQ6IGAke3dhcm5pbmdTdW1tYXJ5fSBSZWR1Y2UgcmV0cmlldmVkIHBhc3NhZ2VzIG9yIGluY3JlYXNlIHRoZSBtb2RlbCdzIGNvbnRleHQgbGVuZ3RoLmAsXG4gICAgICB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICAgICAgdGl0bGU6IFwiQ29udGV4dCB3aW5kb3cgZXhjZWVkZWRcIixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7d2FybmluZ1N1bW1hcnl9IFByb21wdCBtYXkgYmUgdHJ1bmNhdGVkIG9yIHJlamVjdGVkLmAsXG4gICAgICAgICAgbm9BdXRvRGlzbWlzczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChub3RpZnlFcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBVbmFibGUgdG8gc2VuZCBjb250ZXh0IG92ZXJmbG93IG5vdGlmaWNhdGlvbjpcIiwgbm90aWZ5RXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBGYWlsZWQgdG8gZXZhbHVhdGUgY29udGV4dCB1c2FnZTpcIiwgZXJyb3IpO1xuICB9XG59XG5cbi8qKlxuICogTWFpbiBwcm9tcHQgcHJlcHJvY2Vzc29yIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwcm9jZXNzKFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBDaGF0TWVzc2FnZSxcbik6IFByb21pc2U8Q2hhdE1lc3NhZ2UgfCBzdHJpbmc+IHtcbiAgY29uc3QgdXNlclByb21wdCA9IHVzZXJNZXNzYWdlLmdldFRleHQoKTtcbiAgY29uc3QgcGx1Z2luQ29uZmlnID0gY3RsLmdldFBsdWdpbkNvbmZpZyhjb25maWdTY2hlbWF0aWNzKTtcblxuICAvLyBHZXQgY29uZmlndXJhdGlvblxuICBjb25zdCBkb2N1bWVudHNEaXIgPSBwbHVnaW5Db25maWcuZ2V0KFwiZG9jdW1lbnRzRGlyZWN0b3J5XCIpO1xuICBjb25zdCB2ZWN0b3JTdG9yZURpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJ2ZWN0b3JTdG9yZURpcmVjdG9yeVwiKTtcbiAgY29uc3QgcmV0cmlldmFsTGltaXQgPSBwbHVnaW5Db25maWcuZ2V0KFwicmV0cmlldmFsTGltaXRcIik7XG4gIGNvbnN0IHJldHJpZXZhbFRocmVzaG9sZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiKTtcbiAgY29uc3QgY2h1bmtTaXplID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rU2l6ZVwiKTtcbiAgY29uc3QgY2h1bmtPdmVybGFwID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rT3ZlcmxhcFwiKTtcbiAgY29uc3QgbWF4Q29uY3VycmVudCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYXhDb25jdXJyZW50RmlsZXNcIik7XG4gIGNvbnN0IGVuYWJsZU9DUiA9IHBsdWdpbkNvbmZpZy5nZXQoXCJlbmFibGVPQ1JcIik7XG4gIGNvbnN0IHNraXBQcmV2aW91c2x5SW5kZXhlZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKTtcbiAgY29uc3QgcGFyc2VEZWxheU1zID0gcGx1Z2luQ29uZmlnLmdldChcInBhcnNlRGVsYXlNc1wiKSA/PyAwO1xuICBjb25zdCByZWluZGV4UmVxdWVzdGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiKTtcblxuICAvLyBWYWxpZGF0ZSBjb25maWd1cmF0aW9uXG4gIGlmICghZG9jdW1lbnRzRGlyIHx8IGRvY3VtZW50c0RpciA9PT0gXCJcIikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIERvY3VtZW50cyBkaXJlY3Rvcnkgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLlwiKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cblxuICBpZiAoIXZlY3RvclN0b3JlRGlyIHx8IHZlY3RvclN0b3JlRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gUGVyZm9ybSBzYW5pdHkgY2hlY2tzIG9uIGZpcnN0IHJ1blxuICAgIGlmICghc2FuaXR5Q2hlY2tzUGFzc2VkKSB7XG4gICAgICBjb25zdCBjaGVja1N0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIlBlcmZvcm1pbmcgc2FuaXR5IGNoZWNrcy4uLlwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNhbml0eVJlc3VsdCA9IGF3YWl0IHBlcmZvcm1TYW5pdHlDaGVja3MoZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZURpcik7XG5cbiAgICAgIC8vIExvZyB3YXJuaW5nc1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHNhbml0eVJlc3VsdC53YXJuaW5ncykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9nIGVycm9ycyBhbmQgYWJvcnQgaWYgY3JpdGljYWxcbiAgICAgIGlmICghc2FuaXR5UmVzdWx0LnBhc3NlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHNhbml0eVJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR11cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZhaWx1cmVSZWFzb24gPVxuICAgICAgICAgIHNhbml0eVJlc3VsdC5lcnJvcnNbMF0gPz9cbiAgICAgICAgICBzYW5pdHlSZXN1bHQud2FybmluZ3NbMF0gPz9cbiAgICAgICAgICBcIlVua25vd24gcmVhc29uLiBQbGVhc2UgcmV2aWV3IHBsdWdpbiBzZXR0aW5ncy5cIjtcbiAgICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgIHRleHQ6IGBTYW5pdHkgY2hlY2tzIGZhaWxlZDogJHtmYWlsdXJlUmVhc29ufWAsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGNoZWNrU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJTYW5pdHkgY2hlY2tzIHBhc3NlZFwiLFxuICAgICAgfSk7XG4gICAgICBzYW5pdHlDaGVja3NQYXNzZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIC8vIEluaXRpYWxpemUgdmVjdG9yIHN0b3JlIGlmIG5lZWRlZFxuICAgIGlmICghdmVjdG9yU3RvcmUgfHwgbGFzdEluZGV4ZWREaXIgIT09IHZlY3RvclN0b3JlRGlyKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgdGV4dDogXCJJbml0aWFsaXppbmcgdmVjdG9yIHN0b3JlLi4uXCIsXG4gICAgICB9KTtcblxuICAgICAgdmVjdG9yU3RvcmUgPSBuZXcgVmVjdG9yU3RvcmUodmVjdG9yU3RvcmVEaXIpO1xuICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHJlYWR5IChwYXRoPSR7dmVjdG9yU3RvcmVEaXJ9KS4gV2FpdGluZyBmb3IgcXVlcmllcy4uLmAsXG4gICAgICApO1xuICAgICAgbGFzdEluZGV4ZWREaXIgPSB2ZWN0b3JTdG9yZURpcjtcblxuICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWRcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIGF3YWl0IG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gICAgICBjdGwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBwYXJzZURlbGF5TXMsXG4gICAgICByZWluZGV4UmVxdWVzdGVkLFxuICAgICAgc2tpcFByZXZpb3VzbHlJbmRleGVkOiBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC5za2lwUHJldmlvdXNseUluZGV4ZWRcIiksXG4gICAgfSk7XG5cbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGluZGV4XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIFZlY3RvciBzdG9yZSBzdGF0cyBiZWZvcmUgYXV0by1pbmRleCBjaGVjazogdG90YWxDaHVua3M9JHtzdGF0cy50b3RhbENodW5rc30sIHVuaXF1ZUZpbGVzPSR7c3RhdHMudW5pcXVlRmlsZXN9YCk7XG5cbiAgICBpZiAoc3RhdHMudG90YWxDaHVua3MgPT09IDApIHtcbiAgICAgIGlmICghdHJ5U3RhcnRJbmRleGluZyhcImF1dG8tdHJpZ2dlclwiKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBJbmRleGluZyBhbHJlYWR5IHJ1bm5pbmcsIHNraXBwaW5nIGF1dG9tYXRpYyBpbmRleGluZy5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbmRleFN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgdGV4dDogXCJTdGFydGluZyBpbml0aWFsIGluZGV4aW5nLi4uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBpbmRleGluZ1Jlc3VsdCB9ID0gYXdhaXQgcnVuSW5kZXhpbmdKb2Ioe1xuICAgICAgICAgICAgY2xpZW50OiBjdGwuY2xpZW50LFxuICAgICAgICAgICAgYWJvcnRTaWduYWw6IGN0bC5hYm9ydFNpZ25hbCxcbiAgICAgICAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgICAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgICAgICAgY2h1bmtTaXplLFxuICAgICAgICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgICAgICAgIGVuYWJsZU9DUixcbiAgICAgICAgICAgIGF1dG9SZWluZGV4OiBmYWxzZSxcbiAgICAgICAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgICAgICAgIHZlY3RvclN0b3JlLFxuICAgICAgICAgICAgZm9yY2VSZWluZGV4OiB0cnVlLFxuICAgICAgICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwic2Nhbm5pbmdcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgU2Nhbm5pbmc6ICR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9YCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiaW5kZXhpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwcm9ncmVzcy5zdWNjZXNzZnVsRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBwcm9ncmVzcy5mYWlsZWRGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNraXBwZWQgPSBwcm9ncmVzcy5za2lwcGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGVycm9yOiAke3Byb2dyZXNzLmVycm9yfWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0JpZ1JBR10gSW5kZXhpbmcgY29tcGxldGU6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfSBmYWlsZWQpYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBJbmRleGluZyBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBmaW5pc2hJbmRleGluZygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuXG4gICAgLy8gTG9nIG1hbnVhbCByZWluZGV4IHRvZ2dsZSBzdGF0ZXMgZm9yIHZpc2liaWxpdHkgb24gZWFjaCBjaGF0XG4gICAgY29uc3QgdG9nZ2xlU3RhdHVzVGV4dCA9XG4gICAgICBgTWFudWFsIFJlaW5kZXggVHJpZ2dlcjogJHtyZWluZGV4UmVxdWVzdGVkID8gXCJPTlwiIDogXCJPRkZcIn0gfCBgICtcbiAgICAgIGBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZDogJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifWA7XG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSAke3RvZ2dsZVN0YXR1c1RleHR9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogdG9nZ2xlU3RhdHVzVGV4dCxcbiAgICB9KTtcblxuICAgIC8vIFBlcmZvcm0gcmV0cmlldmFsXG4gICAgY29uc3QgcmV0cmlldmFsU3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJMb2FkaW5nIGVtYmVkZGluZyBtb2RlbCBmb3IgcmV0cmlldmFsLi4uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGN0bC5jbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgICAgeyBzaWduYWw6IGN0bC5hYm9ydFNpZ25hbCB9XG4gICAgKTtcblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJTZWFyY2hpbmcgZm9yIHJlbGV2YW50IGNvbnRlbnQuLi5cIixcbiAgICB9KTtcblxuICAgIC8vIEVtYmVkIHRoZSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nUmVzdWx0ID0gYXdhaXQgZW1iZWRkaW5nTW9kZWwuZW1iZWQodXNlclByb21wdCk7XG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nID0gcXVlcnlFbWJlZGRpbmdSZXN1bHQuZW1iZWRkaW5nO1xuXG4gICAgLy8gU2VhcmNoIHZlY3RvciBzdG9yZVxuICAgIGNvbnN0IHF1ZXJ5UHJldmlldyA9XG4gICAgICB1c2VyUHJvbXB0Lmxlbmd0aCA+IDE2MCA/IGAke3VzZXJQcm9tcHQuc2xpY2UoMCwgMTYwKX0uLi5gIDogdXNlclByb21wdDtcbiAgICBjb25zb2xlLmluZm8oXG4gICAgICBgW0JpZ1JBR10gRXhlY3V0aW5nIHZlY3RvciBzZWFyY2ggZm9yIFwiJHtxdWVyeVByZXZpZXd9XCIgKGxpbWl0PSR7cmV0cmlldmFsTGltaXR9LCB0aHJlc2hvbGQ9JHtyZXRyaWV2YWxUaHJlc2hvbGR9KWAsXG4gICAgKTtcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdmVjdG9yU3RvcmUuc2VhcmNoKFxuICAgICAgcXVlcnlFbWJlZGRpbmcsXG4gICAgICByZXRyaWV2YWxMaW1pdCxcbiAgICAgIHJldHJpZXZhbFRocmVzaG9sZFxuICAgICk7XG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRvcEhpdCA9IHJlc3VsdHNbMF07XG4gICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgIGBbQmlnUkFHXSBWZWN0b3Igc2VhcmNoIHJldHVybmVkICR7cmVzdWx0cy5sZW5ndGh9IHJlc3VsdHMuIFRvcCBoaXQ6IGZpbGU9JHt0b3BIaXQuZmlsZU5hbWV9IHNjb3JlPSR7dG9wSGl0LnNjb3JlLnRvRml4ZWQoMyl9YCxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGRvY1N1bW1hcmllcyA9IHJlc3VsdHNcbiAgICAgICAgLm1hcChcbiAgICAgICAgICAocmVzdWx0LCBpZHgpID0+XG4gICAgICAgICAgICBgIyR7aWR4ICsgMX0gZmlsZT0ke3BhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKX0gc2hhcmQ9JHtyZXN1bHQuc2hhcmROYW1lfSBzY29yZT0ke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfWAsXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIFJlbGV2YW50IGRvY3VtZW50czpcXG4ke2RvY1N1bW1hcmllc31gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHNlYXJjaCByZXR1cm5lZCAwIHJlc3VsdHMuXCIpO1xuICAgIH1cblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgIHRleHQ6IFwiTm8gcmVsZXZhbnQgY29udGVudCBmb3VuZCBpbiBpbmRleGVkIGRvY3VtZW50c1wiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG5vdGVBYm91dE5vUmVzdWx0cyA9XG4gICAgICAgIGBJbXBvcnRhbnQ6IE5vIHJlbGV2YW50IGNvbnRlbnQgd2FzIGZvdW5kIGluIHRoZSBpbmRleGVkIGRvY3VtZW50cyBmb3IgdGhlIHVzZXIgcXVlcnkuIGAgK1xuICAgICAgICBgSW4gbGVzcyB0aGFuIG9uZSBzZW50ZW5jZSwgaW5mb3JtIHRoZSB1c2VyIG9mIHRoaXMuIGAgK1xuICAgICAgICBgVGhlbiByZXNwb25kIHRvIHRoZSBxdWVyeSB0byB0aGUgYmVzdCBvZiB5b3VyIGFiaWxpdHkuYDtcblxuICAgICAgcmV0dXJuIG5vdGVBYm91dE5vUmVzdWx0cyArIGBcXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7dXNlclByb21wdH1gO1xuICAgIH1cblxuICAgIC8vIEZvcm1hdCByZXN1bHRzXG4gICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgUmV0cmlldmVkICR7cmVzdWx0cy5sZW5ndGh9IHJlbGV2YW50IHBhc3NhZ2VzYCxcbiAgICB9KTtcblxuICAgIGN0bC5kZWJ1ZyhcIlJldHJpZXZhbCByZXN1bHRzOlwiLCByZXN1bHRzKTtcblxuICAgIGxldCByYWdDb250ZXh0RnVsbCA9IFwiXCI7XG4gICAgbGV0IHJhZ0NvbnRleHRQcmV2aWV3ID0gXCJcIjtcbiAgICBjb25zdCBwcmVmaXggPSBcIlRoZSBmb2xsb3dpbmcgcGFzc2FnZXMgd2VyZSBmb3VuZCBpbiB5b3VyIGluZGV4ZWQgZG9jdW1lbnRzOlxcblxcblwiO1xuICAgIHJhZ0NvbnRleHRGdWxsICs9IHByZWZpeDtcbiAgICByYWdDb250ZXh0UHJldmlldyArPSBwcmVmaXg7XG5cbiAgICBsZXQgY2l0YXRpb25OdW1iZXIgPSAxO1xuICAgIGZvciAoY29uc3QgcmVzdWx0IG9mIHJlc3VsdHMpIHtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpO1xuICAgICAgY29uc3QgY2l0YXRpb25MYWJlbCA9IGBDaXRhdGlvbiAke2NpdGF0aW9uTnVtYmVyfSAoZnJvbSAke2ZpbGVOYW1lfSwgc2NvcmU6ICR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9KTogYDtcbiAgICAgIHJhZ0NvbnRleHRGdWxsICs9IGBcXG4ke2NpdGF0aW9uTGFiZWx9XCIke3Jlc3VsdC50ZXh0fVwiXFxuXFxuYDtcbiAgICAgIHJhZ0NvbnRleHRQcmV2aWV3ICs9IGBcXG4ke2NpdGF0aW9uTGFiZWx9XCIke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfVwiXFxuXFxuYDtcbiAgICAgIGNpdGF0aW9uTnVtYmVyKys7XG4gICAgfVxuXG4gICAgY29uc3QgcHJvbXB0VGVtcGxhdGUgPSBub3JtYWxpemVQcm9tcHRUZW1wbGF0ZShwbHVnaW5Db25maWcuZ2V0KFwicHJvbXB0VGVtcGxhdGVcIikpO1xuICAgIGNvbnN0IGZpbmFsUHJvbXB0ID0gZmlsbFByb21wdFRlbXBsYXRlKHByb21wdFRlbXBsYXRlLCB7XG4gICAgICBbUkFHX0NPTlRFWFRfTUFDUk9dOiByYWdDb250ZXh0RnVsbC50cmltRW5kKCksXG4gICAgICBbVVNFUl9RVUVSWV9NQUNST106IHVzZXJQcm9tcHQsXG4gICAgfSk7XG4gICAgY29uc3QgZmluYWxQcm9tcHRQcmV2aWV3ID0gZmlsbFByb21wdFRlbXBsYXRlKHByb21wdFRlbXBsYXRlLCB7XG4gICAgICBbUkFHX0NPTlRFWFRfTUFDUk9dOiByYWdDb250ZXh0UHJldmlldy50cmltRW5kKCksXG4gICAgICBbVVNFUl9RVUVSWV9NQUNST106IHVzZXJQcm9tcHQsXG4gICAgfSk7XG5cbiAgICBjdGwuZGVidWcoXCJQcm9jZXNzZWQgY29udGVudCAocHJldmlldyk6XCIsIGZpbmFsUHJvbXB0UHJldmlldyk7XG5cbiAgICBjb25zdCBwYXNzYWdlc0xvZ0VudHJpZXMgPSByZXN1bHRzLm1hcCgocmVzdWx0LCBpZHgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpO1xuICAgICAgcmV0dXJuIGAjJHtpZHggKyAxfSBmaWxlPSR7ZmlsZU5hbWV9IHNoYXJkPSR7cmVzdWx0LnNoYXJkTmFtZX0gc2NvcmU9JHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX1cXG4ke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfWA7XG4gICAgfSk7XG4gICAgY29uc3QgcGFzc2FnZXNMb2cgPSBwYXNzYWdlc0xvZ0VudHJpZXMuam9pbihcIlxcblxcblwiKTtcblxuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUkFHIHBhc3NhZ2VzICgke3Jlc3VsdHMubGVuZ3RofSkgcHJldmlldzpcXG4ke3Bhc3NhZ2VzTG9nfWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSQUcgcGFzc2FnZXMgKCR7cmVzdWx0cy5sZW5ndGh9KTpgLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgcGFzc2FnZXNMb2dFbnRyaWVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogZW50cnksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIEZpbmFsIHByb21wdCBzZW50IHRvIG1vZGVsIChwcmV2aWV3KTpcXG4ke2ZpbmFsUHJvbXB0UHJldmlld31gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgRmluYWwgcHJvbXB0IHNlbnQgdG8gbW9kZWwgKHByZXZpZXcpOlxcbiR7ZmluYWxQcm9tcHRQcmV2aWV3fWAsXG4gICAgfSk7XG5cbiAgICBhd2FpdCB3YXJuSWZDb250ZXh0T3ZlcmZsb3coY3RsLCBmaW5hbFByb21wdCk7XG5cbiAgICByZXR1cm4gZmluYWxQcm9tcHQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gSU1QT1JUQU5UOiBSZS10aHJvdyBhYm9ydCBlcnJvcnMgc28gTE0gU3R1ZGlvIGNhbiBzdG9wIHRoZSBwcmVwcm9jZXNzb3IgcHJvbXB0bHkuXG4gICAgLy8gU3dhbGxvd2luZyBBYm9ydEVycm9yIGNhdXNlcyB0aGUgXCJkaWQgbm90IGFib3J0IGluIHRpbWVcIiB3YXJuaW5nLlxuICAgIGlmIChpc0Fib3J0RXJyb3IoZXJyb3IpKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgY29uc29sZS5lcnJvcihcIltQcm9tcHRQcmVwcm9jZXNzb3JdIFByZXByb2Nlc3NpbmcgZmFpbGVkLlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG59XG5cbmludGVyZmFjZSBDb25maWdSZWluZGV4T3B0cyB7XG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcjtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICByZWluZGV4UmVxdWVzdGVkOiBib29sZWFuO1xuICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IGJvb2xlYW47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gIGN0bCxcbiAgZG9jdW1lbnRzRGlyLFxuICB2ZWN0b3JTdG9yZURpcixcbiAgY2h1bmtTaXplLFxuICBjaHVua092ZXJsYXAsXG4gIG1heENvbmN1cnJlbnQsXG4gIGVuYWJsZU9DUixcbiAgcGFyc2VEZWxheU1zLFxuICByZWluZGV4UmVxdWVzdGVkLFxuICBza2lwUHJldmlvdXNseUluZGV4ZWQsXG59OiBDb25maWdSZWluZGV4T3B0cykge1xuICBpZiAoIXJlaW5kZXhSZXF1ZXN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZW1pbmRlclRleHQgPVxuICAgIGBNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcyBpcyBjdXJyZW50bHkgJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifS4gYCArXG4gICAgXCJUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiO1xuICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7cmVtaW5kZXJUZXh0fWApO1xuICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgIHRleHQ6IHJlbWluZGVyVGV4dCxcbiAgfSk7XG5cbiAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiY29uZmlnLXRyaWdnZXJcIikpIHtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBhbHJlYWR5IHJ1bm5pbmcuIFBsZWFzZSB3YWl0IGZvciBpdCB0byBmaW5pc2guXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IHJlcXVlc3RlZCBmcm9tIGNvbmZpZy4uLlwiLFxuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgaW5kZXhpbmdSZXN1bHQgfSA9IGF3YWl0IHJ1bkluZGV4aW5nSm9iKHtcbiAgICAgIGNsaWVudDogY3RsLmNsaWVudCxcbiAgICAgIGFib3J0U2lnbmFsOiBjdGwuYWJvcnRTaWduYWwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBhdXRvUmVpbmRleDogc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgZm9yY2VSZWluZGV4OiAhc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgdmVjdG9yU3RvcmU6IHZlY3RvclN0b3JlID8/IHVuZGVmaW5lZCxcbiAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcInNjYW5uaW5nXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHByb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwO1xuICAgICAgICAgIGNvbnN0IGZhaWxlZCA9IHByb2dyZXNzLmZhaWxlZEZpbGVzID8/IDA7XG4gICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IHByb2dyZXNzLnNraXBwZWRGaWxlcyA/PyAwO1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgY29tcGxldGU6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9IGZpbGVzIHByb2Nlc3NlZGAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZXJyb3I6ICR7cHJvZ3Jlc3MuZXJyb3J9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZSFcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN1bW1hcnlMaW5lcyA9IFtcbiAgICAgIGBQcm9jZXNzZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9YCxcbiAgICAgIGBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9YCxcbiAgICAgIGBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31gLFxuICAgICAgYFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfWAsXG4gICAgICBgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfWAsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygc3VtbWFyeUxpbmVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogbGluZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzID4gMCAmJiBpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXMgPT09IGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIkFsbCBmaWxlcyB3ZXJlIGFscmVhZHkgdXAgdG8gZGF0ZSAoc2tpcHBlZCkuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBzdW1tYXJ5OlxcbiAgJHtzdW1tYXJ5TGluZXMuam9pbihcIlxcbiAgXCIpfWAsXG4gICAgKTtcblxuICAgIGF3YWl0IG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgdGV4dDogYE1hbnVhbCByZWluZGV4IGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICB9KTtcbiAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR10gTWFudWFsIHJlaW5kZXggZmFpbGVkOlwiLCBlcnJvcik7XG4gIH0gZmluYWxseSB7XG4gICAgZmluaXNoSW5kZXhpbmcoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBub3RpZnlNYW51YWxSZXNldE5lZWRlZChjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjdGwuY2xpZW50LnN5c3RlbS5ub3RpZnkoe1xuICAgICAgdGl0bGU6IFwiTWFudWFsIHJlaW5kZXggY29tcGxldGVkXCIsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgXCJNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFVuYWJsZSB0byBzZW5kIG5vdGlmaWNhdGlvbiBhYm91dCBtYW51YWwgcmVpbmRleCByZXNldDpcIiwgZXJyb3IpO1xuICB9XG59XG5cblxuIiwgImltcG9ydCB7IHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBwcmVwcm9jZXNzIH0gZnJvbSBcIi4vcHJvbXB0UHJlcHJvY2Vzc29yXCI7XG5cbi8qKlxuICogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIEJpZyBSQUcgcGx1Z2luLlxuICogVGhpcyBwbHVnaW4gaW5kZXhlcyBsYXJnZSBkb2N1bWVudCBjb2xsZWN0aW9ucyBhbmQgcHJvdmlkZXMgUkFHIGNhcGFiaWxpdGllcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1haW4oY29udGV4dDogUGx1Z2luQ29udGV4dCkge1xuICAvLyBSZWdpc3RlciB0aGUgY29uZmlndXJhdGlvbiBzY2hlbWF0aWNzXG4gIGNvbnRleHQud2l0aENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gIFxuICAvLyBSZWdpc3RlciB0aGUgcHJvbXB0IHByZXByb2Nlc3NvclxuICBjb250ZXh0LndpdGhQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gIFxuICBjb25zb2xlLmxvZyhcIltCaWdSQUddIFBsdWdpbiBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG59XG5cbiIsICJpbXBvcnQgeyBMTVN0dWRpb0NsaWVudCwgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZGVjbGFyZSB2YXIgcHJvY2VzczogYW55O1xuXG4vLyBXZSByZWNlaXZlIHJ1bnRpbWUgaW5mb3JtYXRpb24gaW4gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbmNvbnN0IGNsaWVudElkZW50aWZpZXIgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9JREVOVElGSUVSO1xuY29uc3QgY2xpZW50UGFzc2tleSA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX1BBU1NLRVk7XG5jb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9CQVNFX1VSTDtcblxuY29uc3QgY2xpZW50ID0gbmV3IExNU3R1ZGlvQ2xpZW50KHtcbiAgY2xpZW50SWRlbnRpZmllcixcbiAgY2xpZW50UGFzc2tleSxcbiAgYmFzZVVybCxcbn0pO1xuXG4oZ2xvYmFsVGhpcyBhcyBhbnkpLl9fTE1TX1BMVUdJTl9DT05URVhUID0gdHJ1ZTtcblxubGV0IHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IGZhbHNlO1xubGV0IHByb21wdFByZXByb2Nlc3NvclNldCA9IGZhbHNlO1xubGV0IGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgdG9vbHNQcm92aWRlclNldCA9IGZhbHNlO1xubGV0IGdlbmVyYXRvclNldCA9IGZhbHNlO1xuXG5jb25zdCBzZWxmUmVnaXN0cmF0aW9uSG9zdCA9IGNsaWVudC5wbHVnaW5zLmdldFNlbGZSZWdpc3RyYXRpb25Ib3N0KCk7XG5cbmNvbnN0IHBsdWdpbkNvbnRleHQ6IFBsdWdpbkNvbnRleHQgPSB7XG4gIHdpdGhQcmVkaWN0aW9uTG9vcEhhbmRsZXI6IChnZW5lcmF0ZSkgPT4ge1xuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHRvb2xzIHByb3ZpZGVyXCIpO1xuICAgIH1cblxuICAgIHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJlZGljdGlvbkxvb3BIYW5kbGVyKGdlbmVyYXRlKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFByb21wdFByZXByb2Nlc3NvcjogKHByZXByb2Nlc3MpID0+IHtcbiAgICBpZiAocHJvbXB0UHJlcHJvY2Vzc29yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9tcHRQcmVwcm9jZXNzb3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aENvbmZpZ1NjaGVtYXRpY3M6IChjb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGNvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgY29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0Q29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdsb2JhbENvbmZpZ1NjaGVtYXRpY3M6IChnbG9iYWxDb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdsb2JhbCBjb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdsb2JhbENvbmZpZ1NjaGVtYXRpY3MoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhUb29sc1Byb3ZpZGVyOiAodG9vbHNQcm92aWRlcikgPT4ge1xuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSBwcmVkaWN0aW9uTG9vcEhhbmRsZXJcIik7XG4gICAgfVxuXG4gICAgdG9vbHNQcm92aWRlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0VG9vbHNQcm92aWRlcih0b29sc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdlbmVyYXRvcjogKGdlbmVyYXRvcikgPT4ge1xuICAgIGlmIChnZW5lcmF0b3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuXG4gICAgZ2VuZXJhdG9yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHZW5lcmF0b3IoZ2VuZXJhdG9yKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbn07XG5cbmltcG9ydChcIi4vLi4vc3JjL2luZGV4LnRzXCIpLnRoZW4oYXN5bmMgbW9kdWxlID0+IHtcbiAgcmV0dXJuIGF3YWl0IG1vZHVsZS5tYWluKHBsdWdpbkNvbnRleHQpO1xufSkudGhlbigoKSA9PiB7XG4gIHNlbGZSZWdpc3RyYXRpb25Ib3N0LmluaXRDb21wbGV0ZWQoKTtcbn0pLmNhdGNoKChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgdGhlIG1haW4gZnVuY3Rpb24gb2YgdGhlIHBsdWdpbi5cIik7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdCQUVhLHlCQVFBO0FBVmI7QUFBQTtBQUFBO0FBQUEsaUJBQXVDO0FBRWhDLElBQU0sMEJBQTBCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBUWhDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixhQUFhO0FBQUEsTUFDZjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUFBLE1BQ3JDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBSyxLQUFLLEdBQUssTUFBTSxLQUFLO0FBQUEsTUFDM0M7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxNQUFNLElBQUk7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtB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a0I7QUFDcEMsUUFBSSxrQkFBa0I7QUFDcEIsWUFBTSxJQUFJLE1BQU0sbUNBQW1DO0FBQUEsSUFDckQ7QUFDQSxRQUFJLDBCQUEwQjtBQUM1QixZQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxJQUM5RTtBQUVBLHVCQUFtQjtBQUNuQix5QkFBcUIsaUJBQWlCLGFBQWE7QUFDbkQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGVBQWUsQ0FBQyxjQUFjO0FBQzVCLFFBQUksY0FBYztBQUNoQixZQUFNLElBQUksTUFBTSw4QkFBOEI7QUFBQSxJQUNoRDtBQUVBLG1CQUFlO0FBQ2YseUJBQXFCLGFBQWEsU0FBUztBQUMzQyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsd0RBQTRCLEtBQUssT0FBTUMsWUFBVTtBQUMvQyxTQUFPLE1BQU1BLFFBQU8sS0FBSyxhQUFhO0FBQ3hDLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDWix1QkFBcUIsY0FBYztBQUNyQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbEIsVUFBUSxNQUFNLG9EQUFvRDtBQUNsRSxVQUFRLE1BQU0sS0FBSztBQUNyQixDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgImNsaWVudCIsICJyZXNvbHZlIiwgInBkZlBhcnNlIiwgImZzIiwgInJlc29sdmUiLCAiaW1wb3J0X3Rlc3NlcmFjdCIsICJmcyIsICJjbGllbnQiLCAicGF0aCIsICJjaHVua1RleHQiLCAicmVzb2x2ZSIsICJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgInBhdGgiLCAiUFF1ZXVlIiwgInZlY3RvclN0b3JlIiwgImNsaWVudCIsICJyZXNvbHZlIiwgImNsaWVudCIsICJ2ZWN0b3JTdG9yZSIsICJwYXRoIiwgImltcG9ydF9zZGsiLCAicHJlcHJvY2VzcyIsICJjb25maWdTY2hlbWF0aWNzIiwgIm1vZHVsZSJdCn0K
