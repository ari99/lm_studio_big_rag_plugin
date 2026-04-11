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
    const deadline = Date.now() + OCR_IMAGE_TIMEOUT_MS;
    const pollMs = 25;
    while (Date.now() < deadline) {
      try {
        if (typeof page.objs.has === "function" && page.objs.has(objId)) {
          return page.objs.get(objId);
        }
      } catch {
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    throw new ImageDataTimeoutError(objId);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vZmlsZVNjYW5uZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvaHRtbFBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9wZGZQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZXB1YlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9pbWFnZVBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy90ZXh0UGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2RvY3VtZW50UGFyc2VyLnRzIiwgIi4uL3NyYy91dGlscy90ZXh0Q2h1bmtlci50cyIsICIuLi9zcmMvdXRpbHMvZmlsZUhhc2gudHMiLCAiLi4vc3JjL3V0aWxzL2ZhaWxlZEZpbGVSZWdpc3RyeS50cyIsICIuLi9zcmMvaW5nZXN0aW9uL2luZGV4TWFuYWdlci50cyIsICIuLi9zcmMvaW5nZXN0aW9uL3J1bkluZGV4aW5nLnRzIiwgIi4uL3NyYy9wcm9tcHRQcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFID0gYHt7cmFnX2NvbnRleHR9fVxuXG5Vc2UgdGhlIGNpdGF0aW9ucyBhYm92ZSB0byByZXNwb25kIHRvIHRoZSB1c2VyIHF1ZXJ5LCBvbmx5IGlmIHRoZXkgYXJlIHJlbGV2YW50LiBPdGhlcndpc2UsIHJlc3BvbmQgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5IHdpdGhvdXQgdGhlbS5cblxuVXNlciBRdWVyeTpcblxue3t1c2VyX3F1ZXJ5fX1gO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJkb2N1bWVudHNEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkRvY3VtZW50cyBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIlJvb3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgZG9jdW1lbnRzIHRvIGluZGV4LiBBbGwgc3ViZGlyZWN0b3JpZXMgd2lsbCBiZSBzY2FubmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vZG9jdW1lbnRzXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInZlY3RvclN0b3JlRGlyZWN0b3J5XCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJWZWN0b3IgU3RvcmUgRGlyZWN0b3J5XCIsXG4gICAgICBzdWJ0aXRsZTogXCJEaXJlY3Rvcnkgd2hlcmUgdGhlIHZlY3RvciBkYXRhYmFzZSB3aWxsIGJlIHN0b3JlZC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIi9wYXRoL3RvL3ZlY3Rvci9zdG9yZVwiLFxuICAgIH0sXG4gICAgXCJcIixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxMaW1pdFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgTGltaXRcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGNodW5rcyB0byByZXR1cm4gZHVyaW5nIHJldHJpZXZhbC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEsIG1heDogMjAsIHN0ZXA6IDEgfSxcbiAgICB9LFxuICAgIDUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicmV0cmlldmFsQWZmaW5pdHlUaHJlc2hvbGRcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBtaW46IDAuMCxcbiAgICAgIG1heDogMS4wLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUmV0cmlldmFsIEFmZmluaXR5IFRocmVzaG9sZFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWluaW11bSBzaW1pbGFyaXR5IHNjb3JlIGZvciBhIGNodW5rIHRvIGJlIGNvbnNpZGVyZWQgcmVsZXZhbnQuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLjAsIG1heDogMS4wLCBzdGVwOiAwLjAxIH0sXG4gICAgfSxcbiAgICAwLjUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtTaXplXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxMjgsXG4gICAgICBtYXg6IDIwNDgsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBTaXplXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTaXplIG9mIHRleHQgY2h1bmtzIGZvciBlbWJlZGRpbmcgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxMjgsIG1heDogMjA0OCwgc3RlcDogMTI4IH0sXG4gICAgfSxcbiAgICA1MTIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtPdmVybGFwXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiA1MTIsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBPdmVybGFwXCIsXG4gICAgICBzdWJ0aXRsZTogXCJPdmVybGFwIGJldHdlZW4gY29uc2VjdXRpdmUgY2h1bmtzIChpbiB0b2tlbnMpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MTIsIHN0ZXA6IDMyIH0sXG4gICAgfSxcbiAgICAxMDAsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWF4Q29uY3VycmVudEZpbGVzXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAxMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1heCBDb25jdXJyZW50IEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0byBwcm9jZXNzIGNvbmN1cnJlbnRseSBkdXJpbmcgaW5kZXhpbmcuIFJlY29tbWVuZCAxIGZvciBsYXJnZSBQREYgZGF0YXNldHMuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxLCBtYXg6IDEwLCBzdGVwOiAxIH0sXG4gICAgfSxcbiAgICAxLFxuICApXG4gIC5maWVsZChcbiAgICBcInBhcnNlRGVsYXlNc1wiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogNTAwMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlBhcnNlciBEZWxheSAobXMpXCIsXG4gICAgICBzdWJ0aXRsZTogXCJXYWl0IHRpbWUgYmVmb3JlIHBhcnNpbmcgZWFjaCBkb2N1bWVudCAoaGVscHMgYXZvaWQgV2ViU29ja2V0IHRocm90dGxpbmcpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MDAwLCBzdGVwOiAxMDAgfSxcbiAgICB9LFxuICAgIDUwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJlbmFibGVPQ1JcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgT0NSXCIsXG4gICAgICBzdWJ0aXRsZTogXCJFbmFibGUgT0NSIGZvciBpbWFnZSBmaWxlcyBhbmQgaW1hZ2UtYmFzZWQgUERGcyB1c2luZyBMTSBTdHVkaW8ncyBidWlsdC1pbiBkb2N1bWVudCBwYXJzZXIuXCIsXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXJcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlRvZ2dsZSBPTiB0byByZXF1ZXN0IGFuIGltbWVkaWF0ZSByZWluZGV4LiBUaGUgcGx1Z2luIHJlc2V0cyB0aGlzIGFmdGVyIHJ1bm5pbmcuIFVzZSB0aGUgXHUyMDFDU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcdTIwMUQgb3B0aW9uIGJlbG93IHRvIGNvbnRyb2wgd2hldGhlciB1bmNoYW5nZWQgZmlsZXMgYXJlIHNraXBwZWQuXCIsXG4gICAgfSxcbiAgICBmYWxzZSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlNraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTa2lwIHVuY2hhbmdlZCBmaWxlcyBmb3IgZmFzdGVyIG1hbnVhbCBydW5zLiBPbmx5IGluZGV4ZXMgbmV3IGZpbGVzIG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJtYW51YWxSZWluZGV4LnRyaWdnZXJcIixcbiAgICAgICAgICBjb25kaXRpb246IHsgdHlwZTogXCJlcXVhbHNcIiwgdmFsdWU6IHRydWUgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcInByb21wdFRlbXBsYXRlXCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJQcm9tcHQgVGVtcGxhdGVcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlN1cHBvcnRzIHt7cmFnX2NvbnRleHR9fSAocmVxdWlyZWQpIGFuZCB7e3VzZXJfcXVlcnl9fSBtYWNyb3MgZm9yIGN1c3RvbWl6aW5nIHRoZSBmaW5hbCBwcm9tcHQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogREVGQVVMVF9QUk9NUFRfVEVNUExBVEUsXG4gICAgICBpc1BhcmFncmFwaDogdHJ1ZSxcbiAgICB9LFxuICAgIERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFLFxuICApXG4gIC5idWlsZCgpO1xuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzL3Byb21pc2VzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBMb2NhbEluZGV4IH0gZnJvbSBcInZlY3RyYVwiO1xuXG5jb25zdCBNQVhfSVRFTVNfUEVSX1NIQVJEID0gMTAwMDA7XG5jb25zdCBTSEFSRF9ESVJfUFJFRklYID0gXCJzaGFyZF9cIjtcbmNvbnN0IFNIQVJEX0RJUl9SRUdFWCA9IC9ec2hhcmRfKFxcZCspJC87XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9jdW1lbnRDaHVuayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgdmVjdG9yOiBudW1iZXJbXTtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBtZXRhZGF0YTogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNjb3JlOiBudW1iZXI7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGNodW5rSW5kZXg6IG51bWJlcjtcbiAgc2hhcmROYW1lOiBzdHJpbmc7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG50eXBlIENodW5rTWV0YWRhdGEgPSB7XG4gIHRleHQ6IHN0cmluZztcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59O1xuXG5leHBvcnQgY2xhc3MgVmVjdG9yU3RvcmUge1xuICBwcml2YXRlIGRiUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHNoYXJkRGlyczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBhY3RpdmVTaGFyZDogTG9jYWxJbmRleCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVNoYXJkQ291bnQ6IG51bWJlciA9IDA7XG4gIHByaXZhdGUgdXBkYXRlTXV0ZXg6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3RvcihkYlBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuZGJQYXRoID0gcGF0aC5yZXNvbHZlKGRiUGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogT3BlbiBhIHNoYXJkIGJ5IGRpcmVjdG9yeSBuYW1lIChlLmcuIFwic2hhcmRfMDAwXCIpLiBDYWxsZXIgbXVzdCBub3QgaG9sZCB0aGUgcmVmZXJlbmNlXG4gICAqIGFmdGVyIHVzZSBzbyBHQyBjYW4gZnJlZSB0aGUgcGFyc2VkIGluZGV4IGRhdGEuXG4gICAqL1xuICBwcml2YXRlIG9wZW5TaGFyZChkaXI6IHN0cmluZyk6IExvY2FsSW5kZXgge1xuICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBkaXIpO1xuICAgIHJldHVybiBuZXcgTG9jYWxJbmRleChmdWxsUGF0aCk7XG4gIH1cblxuICAvKipcbiAgICogU2NhbiBkYlBhdGggZm9yIHNoYXJkX05OTiBkaXJlY3RvcmllcyBhbmQgcmV0dXJuIHNvcnRlZCBsaXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBkaXNjb3ZlclNoYXJkRGlycygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXIodGhpcy5kYlBhdGgsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICBjb25zdCBkaXJzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgZSBvZiBlbnRyaWVzKSB7XG4gICAgICBpZiAoZS5pc0RpcmVjdG9yeSgpICYmIFNIQVJEX0RJUl9SRUdFWC50ZXN0KGUubmFtZSkpIHtcbiAgICAgICAgZGlycy5wdXNoKGUubmFtZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGRpcnMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgY29uc3QgbiA9IChtOiBzdHJpbmcpID0+IHBhcnNlSW50KG0ubWF0Y2goU0hBUkRfRElSX1JFR0VYKSFbMV0sIDEwKTtcbiAgICAgIHJldHVybiBuKGEpIC0gbihiKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGlycztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSB2ZWN0b3Igc3RvcmU6IGRpc2NvdmVyIG9yIGNyZWF0ZSBzaGFyZHMsIG9wZW4gdGhlIGxhc3QgYXMgYWN0aXZlLlxuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy5ta2Rpcih0aGlzLmRiUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgdGhpcy5zaGFyZERpcnMgPSBhd2FpdCB0aGlzLmRpc2NvdmVyU2hhcmREaXJzKCk7XG5cbiAgICBpZiAodGhpcy5zaGFyZERpcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zdCBmaXJzdERpciA9IGAke1NIQVJEX0RJUl9QUkVGSVh9MDAwYDtcbiAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBmaXJzdERpcik7XG4gICAgICBjb25zdCBpbmRleCA9IG5ldyBMb2NhbEluZGV4KGZ1bGxQYXRoKTtcbiAgICAgIGF3YWl0IGluZGV4LmNyZWF0ZUluZGV4KHsgdmVyc2lvbjogMSB9KTtcbiAgICAgIHRoaXMuc2hhcmREaXJzID0gW2ZpcnN0RGlyXTtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBpbmRleDtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxhc3REaXIgPSB0aGlzLnNoYXJkRGlyc1t0aGlzLnNoYXJkRGlycy5sZW5ndGggLSAxXTtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmQgPSB0aGlzLm9wZW5TaGFyZChsYXN0RGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5hY3RpdmVTaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIHRoaXMuYWN0aXZlU2hhcmRDb3VudCA9IGl0ZW1zLmxlbmd0aDtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBkb2N1bWVudCBjaHVua3MgdG8gdGhlIGFjdGl2ZSBzaGFyZC4gUm90YXRlcyB0byBhIG5ldyBzaGFyZCB3aGVuIGZ1bGwuXG4gICAqL1xuICBhc3luYyBhZGRDaHVua3MoY2h1bmtzOiBEb2N1bWVudENodW5rW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlU2hhcmQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlZlY3RvciBzdG9yZSBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgfVxuICAgIGlmIChjaHVua3MubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICB0aGlzLnVwZGF0ZU11dGV4ID0gdGhpcy51cGRhdGVNdXRleC50aGVuKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLmJlZ2luVXBkYXRlKCk7XG4gICAgICB0cnkge1xuICAgICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhOiBDaHVua01ldGFkYXRhID0ge1xuICAgICAgICAgICAgdGV4dDogY2h1bmsudGV4dCxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBjaHVuay5maWxlUGF0aCxcbiAgICAgICAgICAgIGZpbGVOYW1lOiBjaHVuay5maWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVIYXNoOiBjaHVuay5maWxlSGFzaCxcbiAgICAgICAgICAgIGNodW5rSW5kZXg6IGNodW5rLmNodW5rSW5kZXgsXG4gICAgICAgICAgICAuLi5jaHVuay5tZXRhZGF0YSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGF3YWl0IHRoaXMuYWN0aXZlU2hhcmQhLnVwc2VydEl0ZW0oe1xuICAgICAgICAgICAgaWQ6IGNodW5rLmlkLFxuICAgICAgICAgICAgdmVjdG9yOiBjaHVuay52ZWN0b3IsXG4gICAgICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmFjdGl2ZVNoYXJkIS5lbmRVcGRhdGUoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZCEuY2FuY2VsVXBkYXRlKCk7XG4gICAgICAgIHRocm93IGU7XG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgKz0gY2h1bmtzLmxlbmd0aDtcbiAgICAgIGNvbnNvbGUubG9nKGBBZGRlZCAke2NodW5rcy5sZW5ndGh9IGNodW5rcyB0byB2ZWN0b3Igc3RvcmVgKTtcblxuICAgICAgaWYgKHRoaXMuYWN0aXZlU2hhcmRDb3VudCA+PSBNQVhfSVRFTVNfUEVSX1NIQVJEKSB7XG4gICAgICAgIGNvbnN0IG5leHROdW0gPSB0aGlzLnNoYXJkRGlycy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IG5leHREaXIgPSBgJHtTSEFSRF9ESVJfUFJFRklYfSR7U3RyaW5nKG5leHROdW0pLnBhZFN0YXJ0KDMsIFwiMFwiKX1gO1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbih0aGlzLmRiUGF0aCwgbmV4dERpcik7XG4gICAgICAgIGNvbnN0IG5ld0luZGV4ID0gbmV3IExvY2FsSW5kZXgoZnVsbFBhdGgpO1xuICAgICAgICBhd2FpdCBuZXdJbmRleC5jcmVhdGVJbmRleCh7IHZlcnNpb246IDEgfSk7XG4gICAgICAgIHRoaXMuc2hhcmREaXJzLnB1c2gobmV4dERpcik7XG4gICAgICAgIHRoaXMuYWN0aXZlU2hhcmQgPSBuZXdJbmRleDtcbiAgICAgICAgdGhpcy5hY3RpdmVTaGFyZENvdW50ID0gMDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZU11dGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaDogcXVlcnkgZWFjaCBzaGFyZCBpbiB0dXJuLCBtZXJnZSByZXN1bHRzLCBzb3J0IGJ5IHNjb3JlLCBmaWx0ZXIgYnkgdGhyZXNob2xkLCByZXR1cm4gdG9wIGxpbWl0LlxuICAgKi9cbiAgYXN5bmMgc2VhcmNoKFxuICAgIHF1ZXJ5VmVjdG9yOiBudW1iZXJbXSxcbiAgICBsaW1pdDogbnVtYmVyID0gNSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDAuNSxcbiAgKTogUHJvbWlzZTxTZWFyY2hSZXN1bHRbXT4ge1xuICAgIGNvbnN0IG1lcmdlZDogU2VhcmNoUmVzdWx0W10gPSBbXTtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHNoYXJkLnF1ZXJ5SXRlbXMoXG4gICAgICAgIHF1ZXJ5VmVjdG9yLFxuICAgICAgICBcIlwiLFxuICAgICAgICBsaW1pdCxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICBmYWxzZSxcbiAgICAgICk7XG4gICAgICBmb3IgKGNvbnN0IHIgb2YgcmVzdWx0cykge1xuICAgICAgICBjb25zdCBtID0gci5pdGVtLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGE7XG4gICAgICAgIG1lcmdlZC5wdXNoKHtcbiAgICAgICAgICB0ZXh0OiBtPy50ZXh0ID8/IFwiXCIsXG4gICAgICAgICAgc2NvcmU6IHIuc2NvcmUsXG4gICAgICAgICAgZmlsZVBhdGg6IG0/LmZpbGVQYXRoID8/IFwiXCIsXG4gICAgICAgICAgZmlsZU5hbWU6IG0/LmZpbGVOYW1lID8/IFwiXCIsXG4gICAgICAgICAgY2h1bmtJbmRleDogbT8uY2h1bmtJbmRleCA/PyAwLFxuICAgICAgICAgIHNoYXJkTmFtZTogZGlyLFxuICAgICAgICAgIG1ldGFkYXRhOiAoci5pdGVtLm1ldGFkYXRhIGFzIFJlY29yZDxzdHJpbmcsIGFueT4pID8/IHt9LFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlZFxuICAgICAgLmZpbHRlcigocikgPT4gci5zY29yZSA+PSB0aHJlc2hvbGQpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYi5zY29yZSAtIGEuc2NvcmUpXG4gICAgICAuc2xpY2UoMCwgbGltaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbGwgY2h1bmtzIGZvciBhIGZpbGUgKGJ5IGhhc2gpIGFjcm9zcyBhbGwgc2hhcmRzLlxuICAgKi9cbiAgYXN5bmMgZGVsZXRlQnlGaWxlSGFzaChmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbGFzdERpciA9IHRoaXMuc2hhcmREaXJzW3RoaXMuc2hhcmREaXJzLmxlbmd0aCAtIDFdO1xuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgICBjb25zdCB0b0RlbGV0ZSA9IGl0ZW1zLmZpbHRlcihcbiAgICAgICAgICAoaSkgPT4gKGkubWV0YWRhdGEgYXMgQ2h1bmtNZXRhZGF0YSk/LmZpbGVIYXNoID09PSBmaWxlSGFzaCxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHRvRGVsZXRlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhd2FpdCBzaGFyZC5iZWdpblVwZGF0ZSgpO1xuICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiB0b0RlbGV0ZSkge1xuICAgICAgICAgICAgYXdhaXQgc2hhcmQuZGVsZXRlSXRlbShpdGVtLmlkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgc2hhcmQuZW5kVXBkYXRlKCk7XG4gICAgICAgICAgaWYgKGRpciA9PT0gbGFzdERpciAmJiB0aGlzLmFjdGl2ZVNoYXJkKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZVNoYXJkQ291bnQgPSAoYXdhaXQgdGhpcy5hY3RpdmVTaGFyZC5saXN0SXRlbXMoKSkubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc29sZS5sb2coYERlbGV0ZWQgY2h1bmtzIGZvciBmaWxlIGhhc2g6ICR7ZmlsZUhhc2h9YCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGZpbGUgcGF0aCAtPiBzZXQgb2YgZmlsZSBoYXNoZXMgY3VycmVudGx5IGluIHRoZSBzdG9yZS5cbiAgICovXG4gIGFzeW5jIGdldEZpbGVIYXNoSW52ZW50b3J5KCk6IFByb21pc2U8TWFwPHN0cmluZywgU2V0PHN0cmluZz4+PiB7XG4gICAgY29uc3QgaW52ZW50b3J5ID0gbmV3IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PigpO1xuICAgIGZvciAoY29uc3QgZGlyIG9mIHRoaXMuc2hhcmREaXJzKSB7XG4gICAgICBjb25zdCBzaGFyZCA9IHRoaXMub3BlblNoYXJkKGRpcik7XG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHNoYXJkLmxpc3RJdGVtcygpO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IG0gPSBpdGVtLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGE7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gbT8uZmlsZVBhdGg7XG4gICAgICAgIGNvbnN0IGZpbGVIYXNoID0gbT8uZmlsZUhhc2g7XG4gICAgICAgIGlmICghZmlsZVBhdGggfHwgIWZpbGVIYXNoKSBjb250aW51ZTtcbiAgICAgICAgbGV0IHNldCA9IGludmVudG9yeS5nZXQoZmlsZVBhdGgpO1xuICAgICAgICBpZiAoIXNldCkge1xuICAgICAgICAgIHNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICAgIGludmVudG9yeS5zZXQoZmlsZVBhdGgsIHNldCk7XG4gICAgICAgIH1cbiAgICAgICAgc2V0LmFkZChmaWxlSGFzaCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbnZlbnRvcnk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRvdGFsIGNodW5rIGNvdW50IGFuZCB1bmlxdWUgZmlsZSBjb3VudC5cbiAgICovXG4gIGFzeW5jIGdldFN0YXRzKCk6IFByb21pc2U8e1xuICAgIHRvdGFsQ2h1bmtzOiBudW1iZXI7XG4gICAgdW5pcXVlRmlsZXM6IG51bWJlcjtcbiAgfT4ge1xuICAgIGxldCB0b3RhbENodW5rcyA9IDA7XG4gICAgY29uc3QgdW5pcXVlSGFzaGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgZm9yIChjb25zdCBkaXIgb2YgdGhpcy5zaGFyZERpcnMpIHtcbiAgICAgIGNvbnN0IHNoYXJkID0gdGhpcy5vcGVuU2hhcmQoZGlyKTtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgc2hhcmQubGlzdEl0ZW1zKCk7XG4gICAgICB0b3RhbENodW5rcyArPSBpdGVtcy5sZW5ndGg7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgY29uc3QgaCA9IChpdGVtLm1ldGFkYXRhIGFzIENodW5rTWV0YWRhdGEpPy5maWxlSGFzaDtcbiAgICAgICAgaWYgKGgpIHVuaXF1ZUhhc2hlcy5hZGQoaCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IHRvdGFsQ2h1bmtzLCB1bmlxdWVGaWxlczogdW5pcXVlSGFzaGVzLnNpemUgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbnkgY2h1bmsgZXhpc3RzIGZvciB0aGUgZ2l2ZW4gZmlsZSBoYXNoIChzaG9ydC1jaXJjdWl0cyBvbiBmaXJzdCBtYXRjaCkuXG4gICAqL1xuICBhc3luYyBoYXNGaWxlKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBmb3IgKGNvbnN0IGRpciBvZiB0aGlzLnNoYXJkRGlycykge1xuICAgICAgY29uc3Qgc2hhcmQgPSB0aGlzLm9wZW5TaGFyZChkaXIpO1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCBzaGFyZC5saXN0SXRlbXMoKTtcbiAgICAgIGlmIChpdGVtcy5zb21lKChpKSA9PiAoaS5tZXRhZGF0YSBhcyBDaHVua01ldGFkYXRhKT8uZmlsZUhhc2ggPT09IGZpbGVIYXNoKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbGVhc2UgdGhlIGFjdGl2ZSBzaGFyZCByZWZlcmVuY2UuXG4gICAqL1xuICBhc3luYyBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmFjdGl2ZVNoYXJkID0gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgb3MgZnJvbSBcIm9zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FuaXR5Q2hlY2tSZXN1bHQge1xuICBwYXNzZWQ6IGJvb2xlYW47XG4gIHdhcm5pbmdzOiBzdHJpbmdbXTtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtIHNhbml0eSBjaGVja3MgYmVmb3JlIGluZGV4aW5nIGxhcmdlIGRpcmVjdG9yaWVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwZXJmb3JtU2FuaXR5Q2hlY2tzKFxuICBkb2N1bWVudHNEaXI6IHN0cmluZyxcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZyxcbik6IFByb21pc2U8U2FuaXR5Q2hlY2tSZXN1bHQ+IHtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBDaGVjayBpZiBkaXJlY3RvcmllcyBleGlzdFxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2Vzcyhkb2N1bWVudHNEaXIsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgZXJyb3JzLnB1c2goYERvY3VtZW50cyBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Qgb3IgaXMgbm90IHJlYWRhYmxlOiAke2RvY3VtZW50c0Rpcn1gKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKHZlY3RvclN0b3JlRGlyLCBmcy5jb25zdGFudHMuV19PSyk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIFRyeSB0byBjcmVhdGUgaXRcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIodmVjdG9yU3RvcmVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgIGBWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0IGFuZCBjYW5ub3QgYmUgY3JlYXRlZDogJHt2ZWN0b3JTdG9yZURpcn1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBkaXNrIHNwYWNlXG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0ZnModmVjdG9yU3RvcmVEaXIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUdCID0gKHN0YXRzLmJhdmFpbCAqIHN0YXRzLmJzaXplKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICAgIFxuICAgIGlmIChhdmFpbGFibGVHQiA8IDEpIHtcbiAgICAgIGVycm9ycy5wdXNoKGBWZXJ5IGxvdyBkaXNrIHNwYWNlIGF2YWlsYWJsZTogJHthdmFpbGFibGVHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH0gZWxzZSBpZiAoYXZhaWxhYmxlR0IgPCAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaChgTG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgY2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcIik7XG4gIH1cblxuICAvLyBDaGVjayBhdmFpbGFibGUgbWVtb3J5XG4gIGNvbnN0IGZyZWVNZW1vcnlHQiA9IG9zLmZyZWVtZW0oKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICBjb25zdCB0b3RhbE1lbW9yeUdCID0gb3MudG90YWxtZW0oKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICBjb25zdCBydW5uaW5nT25NYWMgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiO1xuICBjb25zdCBsb3dNZW1vcnlNZXNzYWdlID1cbiAgICBgTG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQiBvZiAke3RvdGFsTWVtb3J5R0IudG9GaXhlZCgyKX0gR0IgdG90YWwuIGAgK1xuICAgIFwiQ29uc2lkZXIgcmVkdWNpbmcgY29uY3VycmVudCBmaWxlIHByb2Nlc3NpbmcuXCI7XG4gIGNvbnN0IHZlcnlMb3dNZW1vcnlNZXNzYWdlID1cbiAgICBgVmVyeSBsb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCLiBgICtcbiAgICAocnVubmluZ09uTWFjXG4gICAgICA/IFwibWFjT1MgbWF5IGJlIHJlcG9ydGluZyBjYWNoZWQgcGFnZXMgYXMgdXNlZDsgY2FjaGVkIG1lbW9yeSBjYW4gdXN1YWxseSBiZSByZWNsYWltZWQgYXV0b21hdGljYWxseS5cIlxuICAgICAgOiBcIkluZGV4aW5nIG1heSBmYWlsIGR1ZSB0byBpbnN1ZmZpY2llbnQgUkFNLlwiKTtcblxuICBpZiAoZnJlZU1lbW9yeUdCIDwgMC41KSB7XG4gICAgaWYgKHJ1bm5pbmdPbk1hYykge1xuICAgICAgd2FybmluZ3MucHVzaCh2ZXJ5TG93TWVtb3J5TWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9ycy5wdXNoKGBWZXJ5IGxvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCIDwgMikge1xuICAgIHdhcm5pbmdzLnB1c2gobG93TWVtb3J5TWVzc2FnZSk7XG4gIH1cblxuICAvLyBFc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZSAoc2FtcGxlLWJhc2VkIGZvciBwZXJmb3JtYW5jZSlcbiAgdHJ5IHtcbiAgICBjb25zdCBzYW1wbGVTaXplID0gYXdhaXQgZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRvY3VtZW50c0Rpcik7XG4gICAgY29uc3QgZXN0aW1hdGVkR0IgPSBzYW1wbGVTaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGVzdGltYXRlZEdCID4gMTAwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTGFyZ2UgZGlyZWN0b3J5IGRldGVjdGVkICh+JHtlc3RpbWF0ZWRHQi50b0ZpeGVkKDEpfSBHQikuIEluaXRpYWwgaW5kZXhpbmcgbWF5IHRha2Ugc2V2ZXJhbCBob3Vycy5gXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoZXN0aW1hdGVkR0IgPiAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgYE1lZGl1bS1zaXplZCBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSAzMC02MCBtaW51dGVzLmBcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgZXN0aW1hdGUgZGlyZWN0b3J5IHNpemVcIik7XG4gIH1cblxuICAvLyBDaGVjayBpZiB2ZWN0b3Igc3RvcmUgYWxyZWFkeSBoYXMgZGF0YVxuICB0cnkge1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcih2ZWN0b3JTdG9yZURpcik7XG4gICAgaWYgKGZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIFwiVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBpcyBub3QgZW1wdHkuIEV4aXN0aW5nIGRhdGEgd2lsbCBiZSB1c2VkIGZvciBpbmNyZW1lbnRhbCBpbmRleGluZy5cIlxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIERpcmVjdG9yeSBkb2Vzbid0IGV4aXN0IHlldCwgdGhhdCdzIGZpbmVcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGFzc2VkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIHdhcm5pbmdzLFxuICAgIGVycm9ycyxcbiAgfTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZSBieSBzYW1wbGluZ1xuICogKFF1aWNrIGVzdGltYXRlLCBub3QgZXhhY3QpXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVzdGltYXRlRGlyZWN0b3J5U2l6ZShkaXI6IHN0cmluZywgbWF4U2FtcGxlczogbnVtYmVyID0gMTAwKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgbGV0IHRvdGFsU2l6ZSA9IDA7XG4gIGxldCBmaWxlQ291bnQgPSAwO1xuICBsZXQgc2FtcGxlZFNpemUgPSAwO1xuICBsZXQgc2FtcGxlZENvdW50ID0gMDtcblxuICBhc3luYyBmdW5jdGlvbiB3YWxrKGN1cnJlbnREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcihjdXJyZW50RGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoc2FtcGxlZENvdW50ID49IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gYCR7Y3VycmVudERpcn0vJHtlbnRyeS5uYW1lfWA7XG5cbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIGZpbGVDb3VudCsrO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChzYW1wbGVkQ291bnQgPCBtYXhTYW1wbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgICBzYW1wbGVkU2l6ZSArPSBzdGF0cy5zaXplO1xuICAgICAgICAgICAgICBzYW1wbGVkQ291bnQrKztcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBTa2lwIGZpbGVzIHdlIGNhbid0IHN0YXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFNraXAgZGlyZWN0b3JpZXMgd2UgY2FuJ3QgcmVhZFxuICAgIH1cbiAgfVxuXG4gIGF3YWl0IHdhbGsoZGlyKTtcblxuICAvLyBFeHRyYXBvbGF0ZSBmcm9tIHNhbXBsZVxuICBpZiAoc2FtcGxlZENvdW50ID4gMCAmJiBmaWxlQ291bnQgPiAwKSB7XG4gICAgY29uc3QgYXZnRmlsZVNpemUgPSBzYW1wbGVkU2l6ZSAvIHNhbXBsZWRDb3VudDtcbiAgICB0b3RhbFNpemUgPSBhdmdGaWxlU2l6ZSAqIGZpbGVDb3VudDtcbiAgfVxuXG4gIHJldHVybiB0b3RhbFNpemU7XG59XG5cbi8qKlxuICogQ2hlY2sgc3lzdGVtIHJlc291cmNlcyBhbmQgcHJvdmlkZSByZWNvbW1lbmRhdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc291cmNlUmVjb21tZW5kYXRpb25zKFxuICBlc3RpbWF0ZWRTaXplR0I6IG51bWJlcixcbiAgZnJlZU1lbW9yeUdCOiBudW1iZXIsXG4pOiB7XG4gIHJlY29tbWVuZGVkQ29uY3VycmVuY3k6IG51bWJlcjtcbiAgcmVjb21tZW5kZWRDaHVua1NpemU6IG51bWJlcjtcbiAgZXN0aW1hdGVkVGltZTogc3RyaW5nO1xufSB7XG4gIGxldCByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMztcbiAgbGV0IHJlY29tbWVuZGVkQ2h1bmtTaXplID0gNTEyO1xuICBsZXQgZXN0aW1hdGVkVGltZSA9IFwidW5rbm93blwiO1xuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBhdmFpbGFibGUgbWVtb3J5XG4gIGlmIChmcmVlTWVtb3J5R0IgPCAyKSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDE7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCIDwgNCkge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAyO1xuICB9IGVsc2UgaWYgKGZyZWVNZW1vcnlHQiA+PSA4KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDU7XG4gIH1cblxuICAvLyBBZGp1c3QgYmFzZWQgb24gZGF0YXNldCBzaXplXG4gIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNS0xNSBtaW51dGVzXCI7XG4gIH0gZWxzZSBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMTApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIzMC02MCBtaW51dGVzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSA3Njg7XG4gIH0gZWxzZSBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMTAwKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiMi00IGhvdXJzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSAxMDI0O1xuICB9IGVsc2Uge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjQtMTIgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IE1hdGgubWluKHJlY29tbWVuZGVkQ29uY3VycmVuY3ksIDMpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5LFxuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplLFxuICAgIGVzdGltYXRlZFRpbWUsXG4gIH07XG59XG5cbiIsICJsZXQgaW5kZXhpbmdJblByb2dyZXNzID0gZmFsc2U7XG5cbi8qKlxuICogQXR0ZW1wdCB0byBhY3F1aXJlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqIFJldHVybnMgdHJ1ZSBpZiBubyBvdGhlciBpbmRleGluZyBqb2IgaXMgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeVN0YXJ0SW5kZXhpbmcoY29udGV4dDogc3RyaW5nID0gXCJ1bmtub3duXCIpOiBib29sZWFuIHtcbiAgaWYgKGluZGV4aW5nSW5Qcm9ncmVzcykge1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIGZhaWxlZDogbG9jayBhbHJlYWR5IGhlbGRgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSB0cnVlO1xuICBjb25zb2xlLmRlYnVnKGBbQmlnUkFHXSB0cnlTdGFydEluZGV4aW5nICgke2NvbnRleHR9KSBzdWNjZWVkZWRgKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmVsZWFzZSB0aGUgc2hhcmVkIGluZGV4aW5nIGxvY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5pc2hJbmRleGluZygpOiB2b2lkIHtcbiAgaW5kZXhpbmdJblByb2dyZXNzID0gZmFsc2U7XG4gIGNvbnNvbGUuZGVidWcoXCJbQmlnUkFHXSBmaW5pc2hJbmRleGluZzogbG9jayByZWxlYXNlZFwiKTtcbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciBhbiBpbmRleGluZyBqb2IgaXMgY3VycmVudGx5IHJ1bm5pbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4aW5nKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5kZXhpbmdJblByb2dyZXNzO1xufVxuXG4iLCAiY29uc3QgSFRNTF9FWFRFTlNJT05TID0gW1wiLmh0bVwiLCBcIi5odG1sXCIsIFwiLnhodG1sXCJdO1xuY29uc3QgTUFSS0RPV05fRVhURU5TSU9OUyA9IFtcIi5tZFwiLCBcIi5tYXJrZG93blwiLCBcIi5tZG93blwiLCBcIi5tZHhcIiwgXCIubWtkXCIsIFwiLm1rZG5cIl07XG5jb25zdCBURVhUX0VYVEVOU0lPTlMgPSBbXCIudHh0XCIsIFwiLnRleHRcIl07XG5jb25zdCBQREZfRVhURU5TSU9OUyA9IFtcIi5wZGZcIl07XG5jb25zdCBFUFVCX0VYVEVOU0lPTlMgPSBbXCIuZXB1YlwiXTtcbmNvbnN0IElNQUdFX0VYVEVOU0lPTlMgPSBbXCIuYm1wXCIsIFwiLmpwZ1wiLCBcIi5qcGVnXCIsIFwiLnBuZ1wiXTtcbmNvbnN0IEFSQ0hJVkVfRVhURU5TSU9OUyA9IFtcIi5yYXJcIl07XG5cbmNvbnN0IEFMTF9FWFRFTlNJT05fR1JPVVBTID0gW1xuICBIVE1MX0VYVEVOU0lPTlMsXG4gIE1BUktET1dOX0VYVEVOU0lPTlMsXG4gIFRFWFRfRVhURU5TSU9OUyxcbiAgUERGX0VYVEVOU0lPTlMsXG4gIEVQVUJfRVhURU5TSU9OUyxcbiAgSU1BR0VfRVhURU5TSU9OUyxcbiAgQVJDSElWRV9FWFRFTlNJT05TLFxuXTtcblxuZXhwb3J0IGNvbnN0IFNVUFBPUlRFRF9FWFRFTlNJT05TID0gbmV3IFNldChcbiAgQUxMX0VYVEVOU0lPTl9HUk9VUFMuZmxhdE1hcCgoZ3JvdXApID0+IGdyb3VwLm1hcCgoZXh0KSA9PiBleHQudG9Mb3dlckNhc2UoKSkpLFxuKTtcblxuZXhwb3J0IGNvbnN0IEhUTUxfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoSFRNTF9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBNQVJLRE9XTl9FWFRFTlNJT05fU0VUID0gbmV3IFNldChNQVJLRE9XTl9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBURVhUX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KFRFWFRfRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgSU1BR0VfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoSU1BR0VfRVhURU5TSU9OUyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0h0bWxFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIEhUTUxfRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNYXJrZG93bkV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gTUFSS0RPV05fRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQbGFpblRleHRFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIFRFWFRfRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0dWFsRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dCkgfHwgaXNQbGFpblRleHRFeHRlbnNpb24oZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zKCk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oU1VQUE9SVEVEX0VYVEVOU0lPTlMudmFsdWVzKCkpLnNvcnQoKTtcbn1cblxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBtaW1lIGZyb20gXCJtaW1lLXR5cGVzXCI7XG5pbXBvcnQge1xuICBTVVBQT1JURURfRVhURU5TSU9OUyxcbiAgbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMsXG59IGZyb20gXCIuLi91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Nhbm5lZEZpbGUge1xuICBwYXRoOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gIG1pbWVUeXBlOiBzdHJpbmcgfCBmYWxzZTtcbiAgc2l6ZTogbnVtYmVyO1xuICBtdGltZTogRGF0ZTtcbn1cblxuLyoqIE5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgdGhlIHJvb3QgZGlyZWN0b3J5IGZvciBzY2FubmluZyAocmVzb2x2ZXMgcGF0aCwgc3RyaXBzIHRyYWlsaW5nIHNsYXNoZXMpLiAqL1xuZnVuY3Rpb24gbm9ybWFsaXplUm9vdERpcihyb290RGlyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBub3JtYWxpemVkID0gcGF0aC5yZXNvbHZlKHJvb3REaXIudHJpbSgpKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICByZXR1cm4gbm9ybWFsaXplZDtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBzY2FuIGEgZGlyZWN0b3J5IGZvciBzdXBwb3J0ZWQgZmlsZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoXG4gIHJvb3REaXI6IHN0cmluZyxcbiAgb25Qcm9ncmVzcz86IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpID0+IHZvaWQsXG4pOiBQcm9taXNlPFNjYW5uZWRGaWxlW10+IHtcbiAgY29uc3Qgcm9vdCA9IG5vcm1hbGl6ZVJvb3REaXIocm9vdERpcik7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKHJvb3QsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICBpZiAoZXJyPy5jb2RlID09PSBcIkVOT0VOVFwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBEb2N1bWVudHMgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0OiAke3Jvb3R9LiBDaGVjayB0aGUgcGF0aCAoZS5nLiBzcGVsbGluZyBhbmQgdGhhdCB0aGUgZm9sZGVyIGV4aXN0cykuYCxcbiAgICAgICk7XG4gICAgfVxuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIGNvbnN0IGZpbGVzOiBTY2FubmVkRmlsZVtdID0gW107XG4gIGxldCBzY2FubmVkQ291bnQgPSAwO1xuXG4gIGNvbnN0IHN1cHBvcnRlZEV4dGVuc2lvbnNEZXNjcmlwdGlvbiA9IGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zKCkuam9pbihcIiwgXCIpO1xuICBjb25zb2xlLmxvZyhgW1NjYW5uZXJdIFN1cHBvcnRlZCBleHRlbnNpb25zOiAke3N1cHBvcnRlZEV4dGVuc2lvbnNEZXNjcmlwdGlvbn1gKTtcblxuICBhc3luYyBmdW5jdGlvbiB3YWxrKGRpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGRpciwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBlbnRyeS5uYW1lKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgYXdhaXQgd2FsayhmdWxsUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBzY2FubmVkQ291bnQrKztcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZW50cnkubmFtZSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoU1VQUE9SVEVEX0VYVEVOU0lPTlMuaGFzKGV4dCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBtaW1lVHlwZSA9IG1pbWUubG9va3VwKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZXMucHVzaCh7XG4gICAgICAgICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICAgICAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgICAgICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgICAgICAgbWltZVR5cGUsXG4gICAgICAgICAgICAgIHNpemU6IHN0YXRzLnNpemUsXG4gICAgICAgICAgICAgIG10aW1lOiBzdGF0cy5tdGltZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBpZiAob25Qcm9ncmVzcyAmJiBzY2FubmVkQ291bnQgJSAxMDAgPT09IDApIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBzY2FubmluZyBkaXJlY3RvcnkgJHtkaXJ9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cbiAgXG4gIGF3YWl0IHdhbGsocm9vdCk7XG5cbiAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICBvblByb2dyZXNzKHNjYW5uZWRDb3VudCwgZmlsZXMubGVuZ3RoKTtcbiAgfVxuICBcbiAgcmV0dXJuIGZpbGVzO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgZmlsZSB0eXBlIGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdXBwb3J0ZWRGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gU1VQUE9SVEVEX0VYVEVOU0lPTlMuaGFzKGV4dCk7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gXCJjaGVlcmlvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBQYXJzZSBIVE1ML0hUTSBmaWxlcyBhbmQgZXh0cmFjdCB0ZXh0IGNvbnRlbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSFRNTChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgsIFwidXRmLThcIik7XG4gICAgY29uc3QgJCA9IGNoZWVyaW8ubG9hZChjb250ZW50KTtcbiAgICBcbiAgICAvLyBSZW1vdmUgc2NyaXB0IGFuZCBzdHlsZSBlbGVtZW50c1xuICAgICQoXCJzY3JpcHQsIHN0eWxlLCBub3NjcmlwdFwiKS5yZW1vdmUoKTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IHRleHRcbiAgICBjb25zdCB0ZXh0ID0gJChcImJvZHlcIikudGV4dCgpIHx8ICQudGV4dCgpO1xuICAgIFxuICAgIC8vIENsZWFuIHVwIHdoaXRlc3BhY2VcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIEhUTUwgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGRmUGFyc2UgZnJvbSBcInBkZi1wYXJzZVwiO1xuaW1wb3J0IHsgY3JlYXRlV29ya2VyIH0gZnJvbSBcInRlc3NlcmFjdC5qc1wiO1xuaW1wb3J0IHsgUE5HIH0gZnJvbSBcInBuZ2pzXCI7XG5cbmNvbnN0IE1JTl9URVhUX0xFTkdUSCA9IDUwO1xuY29uc3QgT0NSX01BWF9QQUdFUyA9IDUwO1xuY29uc3QgT0NSX01BWF9JTUFHRVNfUEVSX1BBR0UgPSAzO1xuY29uc3QgT0NSX01JTl9JTUFHRV9BUkVBID0gMTBfMDAwO1xuY29uc3QgT0NSX01BWF9JTUFHRV9QSVhFTFMgPSA1MF8wMDBfMDAwOyAvLyB+NzAwMHg3MDAwOyBwcmV2ZW50cyBsZXB0b25pY2EgcGl4ZGF0YV9tYWxsb2MgY3Jhc2hlc1xuY29uc3QgT0NSX0lNQUdFX1RJTUVPVVRfTVMgPSAzMF8wMDA7XG5cbnR5cGUgUGRmSnNNb2R1bGUgPSB0eXBlb2YgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcblxuaW50ZXJmYWNlIEV4dHJhY3RlZE9jckltYWdlIHtcbiAgYnVmZmVyOiBCdWZmZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBhcmVhOiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFBkZkZhaWx1cmVSZWFzb24gPVxuICB8IFwicGRmLmxtc3R1ZGlvLWVycm9yXCJcbiAgfCBcInBkZi5sbXN0dWRpby1lbXB0eVwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZXJyb3JcIlxuICB8IFwicGRmLnBkZnBhcnNlLWVtcHR5XCJcbiAgfCBcInBkZi5vY3ItZGlzYWJsZWRcIlxuICB8IFwicGRmLm9jci1lcnJvclwiXG4gIHwgXCJwZGYub2NyLXJlbmRlci1lcnJvclwiXG4gIHwgXCJwZGYub2NyLWVtcHR5XCI7XG5cbnR5cGUgUGRmUGFyc2VTdGFnZSA9IFwibG1zdHVkaW9cIiB8IFwicGRmLXBhcnNlXCIgfCBcIm9jclwiO1xuY2xhc3MgSW1hZ2VEYXRhVGltZW91dEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvYmpJZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFRpbWVkIG91dCBmZXRjaGluZyBpbWFnZSBkYXRhIGZvciAke29iaklkfWApO1xuICAgIHRoaXMubmFtZSA9IFwiSW1hZ2VEYXRhVGltZW91dEVycm9yXCI7XG4gIH1cbn1cblxuaW50ZXJmYWNlIFBkZlBhcnNlclN1Y2Nlc3Mge1xuICBzdWNjZXNzOiB0cnVlO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YWdlOiBQZGZQYXJzZVN0YWdlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBkZlBhcnNlckZhaWx1cmUge1xuICBzdWNjZXNzOiBmYWxzZTtcbiAgcmVhc29uOiBQZGZGYWlsdXJlUmVhc29uO1xuICBkZXRhaWxzPzogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBQZGZQYXJzZXJSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxuZnVuY3Rpb24gY2xlYW5UZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG50eXBlIFN0YWdlUmVzdWx0ID0gUGRmUGFyc2VyU3VjY2VzcyB8IFBkZlBhcnNlckZhaWx1cmU7XG5cbmxldCBjYWNoZWRQZGZqc0xpYjogUGRmSnNNb2R1bGUgfCBudWxsID0gbnVsbDtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0UGRmanNMaWIoKSB7XG4gIGlmICghY2FjaGVkUGRmanNMaWIpIHtcbiAgICBjYWNoZWRQZGZqc0xpYiA9IGF3YWl0IGltcG9ydChcInBkZmpzLWRpc3QvbGVnYWN5L2J1aWxkL3BkZi5tanNcIik7XG4gIH1cbiAgcmV0dXJuIGNhY2hlZFBkZmpzTGliO1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aDogc3RyaW5nLCBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50KTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBtYXhSZXRyaWVzID0gMjtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gbWF4UmV0cmllczsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBjbGllbnQuZmlsZXMucHJlcGFyZUZpbGUoZmlsZVBhdGgpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2xpZW50LmZpbGVzLnBhcnNlRG9jdW1lbnQoZmlsZUhhbmRsZSwge1xuICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICBpZiAocHJvZ3Jlc3MgPT09IDAgfHwgcHJvZ3Jlc3MgPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFByb2Nlc3NpbmcgJHtmaWxlTmFtZX06ICR7KHByb2dyZXNzICogMTAwKS50b0ZpeGVkKDApfSVgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dChyZXN1bHQuY29udGVudCk7XG4gICAgICBpZiAoY2xlYW5lZC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICAgIHN0YWdlOiBcImxtc3R1ZGlvXCIsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFBhcnNlZCBidXQgZ290IHZlcnkgbGl0dGxlIHRleHQgZnJvbSAke2ZpbGVOYW1lfSAobGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9KSwgd2lsbCB0cnkgZmFsbGJhY2tzYCxcbiAgICAgICk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lbXB0eVwiLFxuICAgICAgICBkZXRhaWxzOiBgbGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9YCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGlzV2ViU29ja2V0RXJyb3IgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmXG4gICAgICAgIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwiV2ViU29ja2V0XCIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJjb25uZWN0aW9uIGNsb3NlZFwiKSk7XG5cbiAgICAgIGlmIChpc1dlYlNvY2tldEVycm9yICYmIGF0dGVtcHQgPCBtYXhSZXRyaWVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFdlYlNvY2tldCBlcnJvciBvbiAke2ZpbGVOYW1lfSwgcmV0cnlpbmcgKCR7YXR0ZW1wdH0vJHttYXhSZXRyaWVzfSkuLi5gLFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwICogYXR0ZW1wdCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIEVycm9yIHBhcnNpbmcgUERGIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICBkZXRhaWxzOiBcIkV4Y2VlZGVkIHJldHJ5IGF0dGVtcHRzXCIsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeVBkZlBhcnNlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuICB0cnkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZGZQYXJzZShidWZmZXIpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQocmVzdWx0LnRleHQgfHwgXCJcIik7XG5cbiAgICBpZiAoY2xlYW5lZC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIFN1Y2Nlc3NmdWxseSBleHRyYWN0ZWQgdGV4dCBmcm9tICR7ZmlsZU5hbWV9YCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICBzdGFnZTogXCJwZGYtcGFyc2VcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIFZlcnkgbGl0dGxlIG9yIG5vIHRleHQgZXh0cmFjdGVkIGZyb20gJHtmaWxlTmFtZX0gKGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofSlgLFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5wZGZwYXJzZS1lbXB0eVwiLFxuICAgICAgZGV0YWlsczogYGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofWAsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgRXJyb3IgcGFyc2luZyBQREYgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5wZGZwYXJzZS1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5T2NyV2l0aFBkZkpzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIGxldCB3b3JrZXI6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlV29ya2VyPj4gfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBwZGZqc0xpYiA9IGF3YWl0IGdldFBkZmpzTGliKCk7XG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoKSk7XG4gICAgY29uc3QgcGRmRG9jdW1lbnQgPSBhd2FpdCBwZGZqc0xpYlxuICAgICAgLmdldERvY3VtZW50KHsgZGF0YSwgdmVyYm9zaXR5OiBwZGZqc0xpYi5WZXJib3NpdHlMZXZlbC5FUlJPUlMgfSlcbiAgICAgIC5wcm9taXNlO1xuXG4gICAgY29uc3QgbnVtUGFnZXMgPSBwZGZEb2N1bWVudC5udW1QYWdlcztcbiAgICBjb25zdCBtYXhQYWdlcyA9IE1hdGgubWluKG51bVBhZ2VzLCBPQ1JfTUFYX1BBR0VTKTtcblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBTdGFydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9IC0gcGFnZXMgMSB0byAke21heFBhZ2VzfSAob2YgJHtudW1QYWdlc30pYCxcbiAgICApO1xuXG4gICAgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgIGNvbnN0IHRleHRQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcmVuZGVyRXJyb3JzID0gMDtcbiAgICBsZXQgcHJvY2Vzc2VkSW1hZ2VzID0gMDtcblxuICAgIGZvciAobGV0IHBhZ2VOdW0gPSAxOyBwYWdlTnVtIDw9IG1heFBhZ2VzOyBwYWdlTnVtKyspIHtcbiAgICAgIGxldCBwYWdlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZSA9IGF3YWl0IHBkZkRvY3VtZW50LmdldFBhZ2UocGFnZU51bSk7XG4gICAgICAgIGNvbnN0IGltYWdlcyA9IGF3YWl0IGV4dHJhY3RJbWFnZXNGb3JQYWdlKHBkZmpzTGliLCBwYWdlKTtcbiAgICAgICAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgJHtmaWxlTmFtZX0gLSBwYWdlICR7cGFnZU51bX0gY29udGFpbnMgbm8gZXh0cmFjdGFibGUgaW1hZ2VzLCBza2lwcGluZ2AsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkSW1hZ2VzID0gaW1hZ2VzLnNsaWNlKDAsIE9DUl9NQVhfSU1BR0VTX1BFUl9QQUdFKTtcbiAgICAgICAgZm9yIChjb25zdCBpbWFnZSBvZiBzZWxlY3RlZEltYWdlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICAgIGRhdGE6IHsgdGV4dCB9LFxuICAgICAgICAgICAgfSA9IGF3YWl0IHdvcmtlci5yZWNvZ25pemUoaW1hZ2UuYnVmZmVyKTtcbiAgICAgICAgICAgIHByb2Nlc3NlZEltYWdlcysrO1xuICAgICAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dCh0ZXh0IHx8IFwiXCIpO1xuICAgICAgICAgICAgaWYgKGNsZWFuZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaChjbGVhbmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChyZWNvZ25pemVFcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZWNvZ25pemUgaW1hZ2UgKCR7aW1hZ2Uud2lkdGh9eCR7aW1hZ2UuaGVpZ2h0fSkgb24gcGFnZSAke3BhZ2VOdW19IG9mICR7ZmlsZU5hbWV9OmAsXG4gICAgICAgICAgICAgIHJlY29nbml6ZUVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyByZWNvZ25pemVFcnJvci5tZXNzYWdlIDogcmVjb2duaXplRXJyb3IsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8gVGhlIHdvcmtlciBtYXkgaGF2ZSBjcmFzaGVkOyB0cnkgdG8gcmVjcmVhdGUgaXQgZm9yIHJlbWFpbmluZyBpbWFnZXNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyB3b3JrZXIgYWxyZWFkeSBkZWFkLCBpZ25vcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHJlY3JlYXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZWNyZWF0ZSBPQ1Igd29ya2VyLCBhYm9ydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9YCxcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgd29ya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgICAgICAgICAgIGRldGFpbHM6IGBXb3JrZXIgY3Jhc2hlZCBhbmQgY291bGQgbm90IGJlIHJlY3JlYXRlZDogJHtcbiAgICAgICAgICAgICAgICAgIHJlY3JlYXRlRXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IHJlY3JlYXRlRXJyb3IubWVzc2FnZSA6IFN0cmluZyhyZWNyZWF0ZUVycm9yKVxuICAgICAgICAgICAgICAgIH1gLFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlTnVtID09PSAxIHx8IHBhZ2VOdW0gJSAxMCA9PT0gMCB8fCBwYWdlTnVtID09PSBtYXhQYWdlcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSAke2ZpbGVOYW1lfSAtIHByb2Nlc3NlZCBwYWdlICR7cGFnZU51bX0vJHttYXhQYWdlc30gKGltYWdlcz0ke3Byb2Nlc3NlZEltYWdlc30sIGNoYXJzPSR7dGV4dFBhcnRzLmpvaW4oXG4gICAgICAgICAgICAgIFwiXFxuXFxuXCIsXG4gICAgICAgICAgICApLmxlbmd0aH0pYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChwYWdlRXJyb3IpIHtcbiAgICAgICAgaWYgKHBhZ2VFcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEFib3J0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX06ICR7cGFnZUVycm9yLm1lc3NhZ2V9YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICB3b3JrZXIgPSBudWxsO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICAgICAgICBkZXRhaWxzOiBwYWdlRXJyb3IubWVzc2FnZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlckVycm9ycysrO1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRXJyb3IgcHJvY2Vzc2luZyBwYWdlICR7cGFnZU51bX0gb2YgJHtmaWxlTmFtZX06YCxcbiAgICAgICAgICBwYWdlRXJyb3IsXG4gICAgICAgICk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBhd2FpdCBwYWdlPy5jbGVhbnVwKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHdvcmtlcikge1xuICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIH1cbiAgICB3b3JrZXIgPSBudWxsO1xuXG4gICAgY29uc3QgZnVsbFRleHQgPSBjbGVhblRleHQodGV4dFBhcnRzLmpvaW4oXCJcXG5cXG5cIikpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBDb21wbGV0ZWQgT0NSIGZvciAke2ZpbGVOYW1lfSwgZXh0cmFjdGVkICR7ZnVsbFRleHQubGVuZ3RofSBjaGFyYWN0ZXJzYCxcbiAgICApO1xuXG4gICAgaWYgKGZ1bGxUZXh0Lmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRleHQ6IGZ1bGxUZXh0LFxuICAgICAgICBzdGFnZTogXCJvY3JcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlckVycm9ycyA+IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLm9jci1yZW5kZXItZXJyb3JcIixcbiAgICAgICAgZGV0YWlsczogYCR7cmVuZGVyRXJyb3JzfSBwYWdlIHJlbmRlciBlcnJvcnNgLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1lbXB0eVwiLFxuICAgICAgZGV0YWlsczogXCJPQ1IgcHJvZHVjZWQgaW5zdWZmaWNpZW50IHRleHRcIixcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAoT0NSKSBFcnJvciBkdXJpbmcgT0NSIGZvciAke2ZpbGVOYW1lfTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9IGZpbmFsbHkge1xuICAgIGlmICh3b3JrZXIpIHtcbiAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdEltYWdlc0ZvclBhZ2UocGRmanNMaWI6IFBkZkpzTW9kdWxlLCBwYWdlOiBhbnkpOiBQcm9taXNlPEV4dHJhY3RlZE9jckltYWdlW10+IHtcbiAgY29uc3Qgb3BlcmF0b3JMaXN0ID0gYXdhaXQgcGFnZS5nZXRPcGVyYXRvckxpc3QoKTtcbiAgY29uc3QgaW1hZ2VzOiBFeHRyYWN0ZWRPY3JJbWFnZVtdID0gW107XG4gIGNvbnN0IGltYWdlRGF0YUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8YW55IHwgbnVsbD4+KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGVyYXRvckxpc3QuZm5BcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZuID0gb3BlcmF0b3JMaXN0LmZuQXJyYXlbaV07XG4gICAgY29uc3QgYXJncyA9IG9wZXJhdG9yTGlzdC5hcmdzQXJyYXlbaV07XG5cbiAgICB0cnkge1xuICAgICAgaWYgKGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbWFnZVhPYmplY3QgfHwgZm4gPT09IHBkZmpzTGliLk9QUy5wYWludEltYWdlWE9iamVjdFJlcGVhdCkge1xuICAgICAgICBjb25zdCBvYmpJZCA9IGFyZ3M/LlswXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpJZCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpbWdEYXRhO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGltZ0RhdGEgPSBhd2FpdCByZXNvbHZlSW1hZ2VEYXRhKHBhZ2UsIG9iaklkLCBpbWFnZURhdGFDYWNoZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZXNvbHZlIGltYWdlIGRhdGE6XCIsIGVycm9yKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWltZ0RhdGEpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcocGRmanNMaWIsIGltZ0RhdGEpO1xuICAgICAgICBpZiAoY29udmVydGVkKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goY29udmVydGVkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW5saW5lSW1hZ2VYT2JqZWN0ICYmIGFyZ3M/LlswXSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcocGRmanNMaWIsIGFyZ3NbMF0pO1xuICAgICAgICBpZiAoY29udmVydGVkKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goY29udmVydGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgICBjb25zb2xlLndhcm4oXCJbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIGV4dHJhY3QgaW5saW5lIGltYWdlOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlc1xuICAgIC5maWx0ZXIoKGltYWdlKSA9PiB7XG4gICAgICBpZiAoaW1hZ2UuYXJlYSA8IE9DUl9NSU5fSU1BR0VfQVJFQSkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKGltYWdlLmFyZWEgPiBPQ1JfTUFYX0lNQUdFX1BJWEVMUykge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBTa2lwcGluZyBvdmVyc2l6ZWQgaW1hZ2UgKCR7aW1hZ2Uud2lkdGh9eCR7aW1hZ2UuaGVpZ2h0fSA9ICR7aW1hZ2UuYXJlYS50b0xvY2FsZVN0cmluZygpfSBwaXhlbHMpIHRvIGF2b2lkIG1lbW9yeSBhbGxvY2F0aW9uIGZhaWx1cmVgLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmFyZWEgLSBhLmFyZWEpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlSW1hZ2VEYXRhKFxuICBwYWdlOiBhbnksXG4gIG9iaklkOiBzdHJpbmcsXG4gIGNhY2hlOiBNYXA8c3RyaW5nLCBQcm9taXNlPGFueSB8IG51bGw+Pixcbik6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICBpZiAoY2FjaGUuaGFzKG9iaklkKSkge1xuICAgIHJldHVybiBjYWNoZS5nZXQob2JqSWQpITtcbiAgfVxuXG4gIC8vIEF2b2lkIFBERi5qcyBQREZPYmplY3RzLmdldChpZCwgY2FsbGJhY2spOiBpdCBkb2VzIG9iai5wcm9taXNlLnRoZW4oKCkgPT4gY2IoLi4uKSlcbiAgLy8gd2l0aG91dCAuY2F0Y2goKSwgc28gYSByZWplY3RlZCBvciB0aHJvd2luZyBjYWxsYmFjayBiZWNvbWVzIGFuIHVuaGFuZGxlZCByZWplY3Rpb25cbiAgLy8gKGUuZy4gRm9ybWF0RXJyb3IgZnJvbSBtYWxmb3JtZWQgUERGIHN0cmVhbXMpLlxuICBjb25zdCBwcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyBPQ1JfSU1BR0VfVElNRU9VVF9NUztcbiAgICBjb25zdCBwb2xsTXMgPSAyNTtcblxuICAgIHdoaWxlIChEYXRlLm5vdygpIDwgZGVhZGxpbmUpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFnZS5vYmpzLmhhcyA9PT0gXCJmdW5jdGlvblwiICYmIHBhZ2Uub2Jqcy5oYXMob2JqSWQpKSB7XG4gICAgICAgICAgcmV0dXJuIHBhZ2Uub2Jqcy5nZXQob2JqSWQpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gVHJhbnNpZW50OyBrZWVwIHBvbGxpbmcgdW50aWwgdGltZW91dC5cbiAgICAgIH1cbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyKSA9PiBzZXRUaW1lb3V0KHIsIHBvbGxNcykpO1xuICAgIH1cblxuICAgIHRocm93IG5ldyBJbWFnZURhdGFUaW1lb3V0RXJyb3Iob2JqSWQpO1xuICB9KSgpO1xuXG4gIGNhY2hlLnNldChvYmpJZCwgcHJvbWlzZSk7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcoXG4gIHBkZmpzTGliOiBQZGZKc01vZHVsZSxcbiAgaW1nRGF0YTogYW55LFxuKTogRXh0cmFjdGVkT2NySW1hZ2UgfCBudWxsIHtcbiAgaWYgKCFpbWdEYXRhIHx8IHR5cGVvZiBpbWdEYXRhLndpZHRoICE9PSBcIm51bWJlclwiIHx8IHR5cGVvZiBpbWdEYXRhLmhlaWdodCAhPT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCBraW5kLCBkYXRhIH0gPSBpbWdEYXRhO1xuICBpZiAoIWRhdGEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHBuZyA9IG5ldyBQTkcoeyB3aWR0aCwgaGVpZ2h0IH0pO1xuICBjb25zdCBkZXN0ID0gcG5nLmRhdGE7XG5cbiAgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5SR0JBXzMyQlBQICYmIGRhdGEubGVuZ3RoID09PSB3aWR0aCAqIGhlaWdodCAqIDQpIHtcbiAgICBkZXN0LnNldChCdWZmZXIuZnJvbShkYXRhKSk7XG4gIH0gZWxzZSBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLlJHQl8yNEJQUCAmJiBkYXRhLmxlbmd0aCA9PT0gd2lkdGggKiBoZWlnaHQgKiAzKSB7XG4gICAgY29uc3Qgc3JjID0gZGF0YSBhcyBVaW50OEFycmF5O1xuICAgIGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IHNyYy5sZW5ndGg7IGkgKz0gMywgaiArPSA0KSB7XG4gICAgICBkZXN0W2pdID0gc3JjW2ldO1xuICAgICAgZGVzdFtqICsgMV0gPSBzcmNbaSArIDFdO1xuICAgICAgZGVzdFtqICsgMl0gPSBzcmNbaSArIDJdO1xuICAgICAgZGVzdFtqICsgM10gPSAyNTU7XG4gICAgfVxuICB9IGVsc2UgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5HUkFZU0NBTEVfMUJQUCkge1xuICAgIGxldCBwaXhlbEluZGV4ID0gMDtcbiAgICBjb25zdCB0b3RhbFBpeGVscyA9IHdpZHRoICogaGVpZ2h0O1xuICAgIGZvciAobGV0IGJ5dGVJbmRleCA9IDA7IGJ5dGVJbmRleCA8IGRhdGEubGVuZ3RoICYmIHBpeGVsSW5kZXggPCB0b3RhbFBpeGVsczsgYnl0ZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGJ5dGUgPSBkYXRhW2J5dGVJbmRleF07XG4gICAgICBmb3IgKGxldCBiaXQgPSA3OyBiaXQgPj0gMCAmJiBwaXhlbEluZGV4IDwgdG90YWxQaXhlbHM7IGJpdC0tKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gKGJ5dGUgPj4gYml0KSAmIDEgPyAyNTUgOiAwO1xuICAgICAgICBjb25zdCBkZXN0SW5kZXggPSBwaXhlbEluZGV4ICogNDtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXhdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAyXSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDNdID0gMjU1O1xuICAgICAgICBwaXhlbEluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBidWZmZXI6IFBORy5zeW5jLndyaXRlKHBuZyksXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGFyZWE6IHdpZHRoICogaGVpZ2h0LFxuICB9O1xufVxuXG4vKipcbiAqIFBhcnNlIFBERiBmaWxlcyB3aXRoIGEgbXVsdGktc3RhZ2Ugc3RyYXRlZ3k6XG4gKiAxLiBVc2UgTE0gU3R1ZGlvJ3MgYnVpbHQtaW4gZG9jdW1lbnQgcGFyc2VyIChmYXN0LCBzZXJ2ZXItc2lkZSwgbWF5IGluY2x1ZGUgT0NSKVxuICogMi4gRmFsbGJhY2sgdG8gbG9jYWwgcGRmLXBhcnNlIGZvciB0ZXh0LWJhc2VkIFBERnNcbiAqIDMuIElmIHN0aWxsIG5vIHRleHQgYW5kIE9DUiBpcyBlbmFibGVkLCBmYWxsYmFjayB0byBQREYuanMgKyBUZXNzZXJhY3QgT0NSXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZVBERihcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudCxcbiAgZW5hYmxlT0NSOiBib29sZWFuLFxuKTogUHJvbWlzZTxQZGZQYXJzZXJSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgLy8gMSkgTE0gU3R1ZGlvIHBhcnNlclxuICBjb25zdCBsbVN0dWRpb1Jlc3VsdCA9IGF3YWl0IHRyeUxtU3R1ZGlvUGFyc2VyKGZpbGVQYXRoLCBjbGllbnQpO1xuICBpZiAobG1TdHVkaW9SZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBsbVN0dWRpb1Jlc3VsdDtcbiAgfVxuICBsZXQgbGFzdEZhaWx1cmU6IFBkZlBhcnNlckZhaWx1cmUgPSBsbVN0dWRpb1Jlc3VsdDtcblxuICAvLyAyKSBMb2NhbCBwZGYtcGFyc2UgZmFsbGJhY2tcbiAgY29uc3QgcGRmUGFyc2VSZXN1bHQgPSBhd2FpdCB0cnlQZGZQYXJzZShmaWxlUGF0aCk7XG4gIGlmIChwZGZQYXJzZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIHBkZlBhcnNlUmVzdWx0O1xuICB9XG4gIGxhc3RGYWlsdXJlID0gcGRmUGFyc2VSZXN1bHQ7XG5cbiAgLy8gMykgT0NSIGZhbGxiYWNrIChvbmx5IGlmIGVuYWJsZWQpXG4gIGlmICghZW5hYmxlT0NSKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEVuYWJsZSBPQ1IgaXMgb2ZmLCBza2lwcGluZyBPQ1IgZmFsbGJhY2sgZm9yICR7ZmlsZU5hbWV9IGFmdGVyIG90aGVyIG1ldGhvZHMgcmV0dXJuZWQgbm8gdGV4dGAsXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1kaXNhYmxlZFwiLFxuICAgICAgZGV0YWlsczogYFByZXZpb3VzIGZhaWx1cmUgcmVhc29uOiAke2xhc3RGYWlsdXJlLnJlYXNvbn1gLFxuICAgIH07XG4gIH1cblxuICBjb25zb2xlLmxvZyhcbiAgICBgW1BERiBQYXJzZXJdIChPQ1IpIE5vIHRleHQgZXh0cmFjdGVkIGZyb20gJHtmaWxlTmFtZX0gd2l0aCBMTSBTdHVkaW8gb3IgcGRmLXBhcnNlLCBhdHRlbXB0aW5nIE9DUi4uLmAsXG4gICk7XG5cbiAgY29uc3Qgb2NyUmVzdWx0ID0gYXdhaXQgdHJ5T2NyV2l0aFBkZkpzKGZpbGVQYXRoKTtcbiAgaWYgKG9jclJlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIG9jclJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBvY3JSZXN1bHQ7XG59XG5cbiIsICIvLyBAdHMtaWdub3JlIC0gZXB1YjIgZG9lc24ndCBoYXZlIGNvbXBsZXRlIHR5cGVzXG5pbXBvcnQgeyBFUHViIH0gZnJvbSBcImVwdWIyXCI7XG5cbi8qKlxuICogUGFyc2UgRVBVQiBmaWxlcyBhbmQgZXh0cmFjdCB0ZXh0IGNvbnRlbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlRVBVQihmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZXB1YiA9IG5ldyBFUHViKGZpbGVQYXRoKTtcbiAgICAgIFxuICAgICAgZXB1Yi5vbihcImVycm9yXCIsIChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBFUFVCIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXNvbHZlKFwiXCIpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0cmlwSHRtbCA9IChpbnB1dDogc3RyaW5nKSA9PlxuICAgICAgICBpbnB1dC5yZXBsYWNlKC88W14+XSo+L2csIFwiIFwiKTtcblxuICAgICAgY29uc3QgZ2V0TWFuaWZlc3RFbnRyeSA9IChjaGFwdGVySWQ6IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gKGVwdWIgYXMgdW5rbm93biBhcyB7IG1hbmlmZXN0PzogUmVjb3JkPHN0cmluZywgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4gfSkubWFuaWZlc3Q/LltjaGFwdGVySWRdO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgZGVjb2RlTWVkaWFUeXBlID0gKGVudHJ5PzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSkgPT5cbiAgICAgICAgZW50cnk/LltcIm1lZGlhLXR5cGVcIl0gfHwgZW50cnk/Lm1lZGlhVHlwZSB8fCBcIlwiO1xuXG4gICAgICBjb25zdCBzaG91bGRSZWFkUmF3ID0gKG1lZGlhVHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBtZWRpYVR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZCA9PT0gXCJhcHBsaWNhdGlvbi94aHRtbCt4bWxcIiB8fCBub3JtYWxpemVkID09PSBcImltYWdlL3N2Zyt4bWxcIikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoXCJ0ZXh0L1wiKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJodG1sXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlYWRDaGFwdGVyID0gYXN5bmMgKGNoYXB0ZXJJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IGdldE1hbmlmZXN0RW50cnkoY2hhcHRlcklkKTtcbiAgICAgICAgaWYgKCFtYW5pZmVzdEVudHJ5KSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBFUFVCIGNoYXB0ZXIgJHtjaGFwdGVySWR9IG1pc3NpbmcgbWFuaWZlc3QgZW50cnkgaW4gJHtmaWxlUGF0aH0sIHNraXBwaW5nYCk7XG4gICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZWRpYVR5cGUgPSBkZWNvZGVNZWRpYVR5cGUobWFuaWZlc3RFbnRyeSk7XG4gICAgICAgIGlmIChzaG91bGRSZWFkUmF3KG1lZGlhVHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgICBlcHViLmdldEZpbGUoXG4gICAgICAgICAgICAgIGNoYXB0ZXJJZCxcbiAgICAgICAgICAgICAgKGVycm9yOiBFcnJvciB8IG51bGwsIGRhdGE/OiBCdWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHJlaihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgICAgcmVzKFwiXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXMoc3RyaXBIdG1sKGRhdGEudG9TdHJpbmcoXCJ1dGYtOFwiKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICBlcHViLmdldENoYXB0ZXIoXG4gICAgICAgICAgICBjaGFwdGVySWQsXG4gICAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCwgdGV4dD86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWooZXJyb3IpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXh0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmVzKHN0cmlwSHRtbCh0ZXh0KSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzKFwiXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBlcHViLm9uKFwiZW5kXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBjaGFwdGVycyA9IGVwdWIuZmxvdztcbiAgICAgICAgICBjb25zdCB0ZXh0UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgXG4gICAgICAgICAgZm9yIChjb25zdCBjaGFwdGVyIG9mIGNoYXB0ZXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBjaGFwdGVySWQgPSBjaGFwdGVyLmlkO1xuICAgICAgICAgICAgICBpZiAoIWNoYXB0ZXJJZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRVBVQiBjaGFwdGVyIG1pc3NpbmcgaWQgaW4gJHtmaWxlUGF0aH0sIHNraXBwaW5nYCk7XG4gICAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVhZENoYXB0ZXIoY2hhcHRlcklkKTtcbiAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChjaGFwdGVyRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVhZGluZyBjaGFwdGVyICR7Y2hhcHRlci5pZH06YCwgY2hhcHRlckVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgZnVsbFRleHQgPSB0ZXh0UGFydHMuam9pbihcIlxcblxcblwiKTtcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgZnVsbFRleHRcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgRVBVQiBjaGFwdGVyczpgLCBlcnJvcik7XG4gICAgICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGVwdWIucGFyc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5pdGlhbGl6aW5nIEVQVUIgcGFyc2VyIGZvciAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICByZXNvbHZlKFwiXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbiIsICJpbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5cbi8qKlxuICogUGFyc2UgaW1hZ2UgZmlsZXMgdXNpbmcgT0NSIChUZXNzZXJhY3QpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUltYWdlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICBcbiAgICBjb25zdCB7IGRhdGE6IHsgdGV4dCB9IH0gPSBhd2FpdCB3b3JrZXIucmVjb2duaXplKGZpbGVQYXRoKTtcbiAgICBcbiAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgXG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAgIC50cmltKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VUZXh0T3B0aW9ucyB7XG4gIHN0cmlwTWFya2Rvd24/OiBib29sZWFuO1xuICBwcmVzZXJ2ZUxpbmVCcmVha3M/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFBhcnNlIHBsYWluIHRleHQgZmlsZXMgKHR4dCwgbWQgYW5kIHJlbGF0ZWQgZm9ybWF0cylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlVGV4dChcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogUGFyc2VUZXh0T3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBzdHJpcE1hcmtkb3duID0gZmFsc2UsIHByZXNlcnZlTGluZUJyZWFrcyA9IGZhbHNlIH0gPSBvcHRpb25zO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVMaW5lRW5kaW5ncyhjb250ZW50KTtcblxuICAgIGNvbnN0IHN0cmlwcGVkID0gc3RyaXBNYXJrZG93biA/IHN0cmlwTWFya2Rvd25TeW50YXgobm9ybWFsaXplZCkgOiBub3JtYWxpemVkO1xuXG4gICAgcmV0dXJuIChwcmVzZXJ2ZUxpbmVCcmVha3MgPyBjb2xsYXBzZVdoaXRlc3BhY2VCdXRLZWVwTGluZXMoc3RyaXBwZWQpIDogY29sbGFwc2VXaGl0ZXNwYWNlKHN0cmlwcGVkKSkudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgdGV4dCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMaW5lRW5kaW5ncyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcclxcbj8vZywgXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2VCdXRLZWVwTGluZXMoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgaW5wdXRcbiAgICAgIC8vIFRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZSBwZXIgbGluZVxuICAgICAgLnJlcGxhY2UoL1sgXFx0XStcXG4vZywgXCJcXG5cIilcbiAgICAgIC8vIENvbGxhcHNlIG11bHRpcGxlIGJsYW5rIGxpbmVzIGJ1dCBrZWVwIHBhcmFncmFwaCBzZXBhcmF0aW9uXG4gICAgICAucmVwbGFjZSgvXFxuezMsfS9nLCBcIlxcblxcblwiKVxuICAgICAgLy8gQ29sbGFwc2UgaW50ZXJuYWwgc3BhY2VzL3RhYnNcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF17Mix9L2csIFwiIFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBzdHJpcE1hcmtkb3duU3ludGF4KGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgb3V0cHV0ID0gaW5wdXQ7XG5cbiAgLy8gUmVtb3ZlIGZlbmNlZCBjb2RlIGJsb2Nrc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvYGBgW1xcc1xcU10qP2BgYC9nLCBcIiBcIik7XG4gIC8vIFJlbW92ZSBpbmxpbmUgY29kZVxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvYChbXmBdKylgL2csIFwiJDFcIik7XG4gIC8vIFJlcGxhY2UgaW1hZ2VzIHdpdGggYWx0IHRleHRcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyFcXFsoW15cXF1dKilcXF1cXChbXildKlxcKS9nLCBcIiQxIFwiKTtcbiAgLy8gUmVwbGFjZSBsaW5rcyB3aXRoIGxpbmsgdGV4dFxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXFxbKFteXFxdXSspXFxdXFwoW14pXSpcXCkvZywgXCIkMVwiKTtcbiAgLy8gUmVtb3ZlIGVtcGhhc2lzIG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyhcXCpcXCp8X18pKC4qPylcXDEvZywgXCIkMlwiKTtcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyhcXCp8XykoLio/KVxcMS9nLCBcIiQyXCIpO1xuICAvLyBSZW1vdmUgaGVhZGluZ3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfSN7MSw2fVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgYmxvY2sgcXVvdGVzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30+XFxzPy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSB1bm9yZGVyZWQgbGlzdCBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM31bLSorXVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgb3JkZXJlZCBsaXN0IG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfVxcZCtbXFwuXFwpXVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgaG9yaXpvbnRhbCBydWxlc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9KFstKl9dXFxzPyl7Myx9JC9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSByZXNpZHVhbCBIVE1MIHRhZ3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLzxbXj5dKz4vZywgXCIgXCIpO1xuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwYXJzZUhUTUwgfSBmcm9tIFwiLi9odG1sUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZVBERiwgdHlwZSBQZGZGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4vcGRmUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZUVQVUIgfSBmcm9tIFwiLi9lcHViUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZUltYWdlIH0gZnJvbSBcIi4vaW1hZ2VQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlVGV4dCB9IGZyb20gXCIuL3RleHRQYXJzZXJcIjtcbmltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHtcbiAgSU1BR0VfRVhURU5TSU9OX1NFVCxcbiAgaXNIdG1sRXh0ZW5zaW9uLFxuICBpc01hcmtkb3duRXh0ZW5zaW9uLFxuICBpc1BsYWluVGV4dEV4dGVuc2lvbixcbiAgaXNUZXh0dWFsRXh0ZW5zaW9uLFxufSBmcm9tIFwiLi4vdXRpbHMvc3VwcG9ydGVkRXh0ZW5zaW9uc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlZERvY3VtZW50IHtcbiAgdGV4dDogc3RyaW5nO1xuICBtZXRhZGF0YToge1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgZmlsZU5hbWU6IHN0cmluZztcbiAgICBleHRlbnNpb246IHN0cmluZztcbiAgICBwYXJzZWRBdDogRGF0ZTtcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uID1cbiAgfCBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiXG4gIHwgXCJwZGYubWlzc2luZy1jbGllbnRcIlxuICB8IFBkZkZhaWx1cmVSZWFzb25cbiAgfCBcImVwdWIuZW1wdHlcIlxuICB8IFwiaHRtbC5lbXB0eVwiXG4gIHwgXCJodG1sLmVycm9yXCJcbiAgfCBcInRleHQuZW1wdHlcIlxuICB8IFwidGV4dC5lcnJvclwiXG4gIHwgXCJpbWFnZS5vY3ItZGlzYWJsZWRcIlxuICB8IFwiaW1hZ2UuZW1wdHlcIlxuICB8IFwiaW1hZ2UuZXJyb3JcIlxuICB8IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIjtcblxuZXhwb3J0IHR5cGUgRG9jdW1lbnRQYXJzZVJlc3VsdCA9XG4gIHwgeyBzdWNjZXNzOiB0cnVlOyBkb2N1bWVudDogUGFyc2VkRG9jdW1lbnQgfVxuICB8IHsgc3VjY2VzczogZmFsc2U7IHJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uOyBkZXRhaWxzPzogc3RyaW5nIH07XG5cbi8qKlxuICogUGFyc2UgYSBkb2N1bWVudCBmaWxlIGJhc2VkIG9uIGl0cyBleHRlbnNpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlRG9jdW1lbnQoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGVuYWJsZU9DUjogYm9vbGVhbiA9IGZhbHNlLFxuICBjbGllbnQ/OiBMTVN0dWRpb0NsaWVudCxcbik6IFByb21pc2U8RG9jdW1lbnRQYXJzZVJlc3VsdD4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCk7XG5cbiAgY29uc3QgYnVpbGRTdWNjZXNzID0gKHRleHQ6IHN0cmluZyk6IERvY3VtZW50UGFyc2VSZXN1bHQgPT4gKHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGRvY3VtZW50OiB7XG4gICAgICB0ZXh0LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIGZpbGVOYW1lLFxuICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgcGFyc2VkQXQ6IG5ldyBEYXRlKCksXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgaWYgKGlzSHRtbEV4dGVuc2lvbihleHQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gY2xlYW5BbmRWYWxpZGF0ZShcbiAgICAgICAgICBhd2FpdCBwYXJzZUhUTUwoZmlsZVBhdGgpLFxuICAgICAgICAgIFwiaHRtbC5lbXB0eVwiLFxuICAgICAgICAgIGAke2ZpbGVOYW1lfSBodG1sYCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRleHQuc3VjY2VzcyA/IGJ1aWxkU3VjY2Vzcyh0ZXh0LnZhbHVlKSA6IHRleHQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtIVE1MXSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwiaHRtbC5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5wZGZcIikge1xuICAgICAgaWYgKCFjbGllbnQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbUGFyc2VyXSBObyBMTSBTdHVkaW8gY2xpZW50IGF2YWlsYWJsZSBmb3IgUERGIHBhcnNpbmc6ICR7ZmlsZU5hbWV9YCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwicGRmLm1pc3NpbmctY2xpZW50XCIgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBkZlJlc3VsdCA9IGF3YWl0IHBhcnNlUERGKGZpbGVQYXRoLCBjbGllbnQsIGVuYWJsZU9DUik7XG4gICAgICBpZiAocGRmUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkU3VjY2VzcyhwZGZSZXN1bHQudGV4dCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGRmUmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLmVwdWJcIikge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlRVBVQihmaWxlUGF0aCk7XG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcImVwdWIuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgfVxuXG4gICAgaWYgKGlzVGV4dHVhbEV4dGVuc2lvbihleHQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VUZXh0KGZpbGVQYXRoLCB7XG4gICAgICAgICAgc3RyaXBNYXJrZG93bjogaXNNYXJrZG93bkV4dGVuc2lvbihleHQpLFxuICAgICAgICAgIHByZXNlcnZlTGluZUJyZWFrczogaXNQbGFpblRleHRFeHRlbnNpb24oZXh0KSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwidGV4dC5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bVGV4dF0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcInRleHQuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKElNQUdFX0VYVEVOU0lPTl9TRVQuaGFzKGV4dCkpIHtcbiAgICAgIGlmICghZW5hYmxlT0NSKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBTa2lwcGluZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9IChPQ1IgZGlzYWJsZWQpYCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwiaW1hZ2Uub2NyLWRpc2FibGVkXCIgfTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZUltYWdlKGZpbGVQYXRoKTtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJpbWFnZS5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bSW1hZ2VdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJpbWFnZS5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5yYXJcIikge1xuICAgICAgY29uc29sZS5sb2coYFJBUiBmaWxlcyBub3QgeWV0IHN1cHBvcnRlZDogJHtmaWxlUGF0aH1gKTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCIsIGRldGFpbHM6IFwiLnJhclwiIH07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFVuc3VwcG9ydGVkIGZpbGUgdHlwZTogJHtmaWxlUGF0aH1gKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiLCBkZXRhaWxzOiBleHQgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIGRvY3VtZW50ICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9XG59XG5cbnR5cGUgQ2xlYW5SZXN1bHQgPVxuICB8IHsgc3VjY2VzczogdHJ1ZTsgdmFsdWU6IHN0cmluZyB9XG4gIHwgeyBzdWNjZXNzOiBmYWxzZTsgcmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb247IGRldGFpbHM/OiBzdHJpbmcgfTtcblxuZnVuY3Rpb24gY2xlYW5BbmRWYWxpZGF0ZShcbiAgdGV4dDogc3RyaW5nLFxuICBlbXB0eVJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uLFxuICBkZXRhaWxzQ29udGV4dD86IHN0cmluZyxcbik6IENsZWFuUmVzdWx0IHtcbiAgY29uc3QgY2xlYW5lZCA9IHRleHQ/LnRyaW0oKSA/PyBcIlwiO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IGVtcHR5UmVhc29uLFxuICAgICAgZGV0YWlsczogZGV0YWlsc0NvbnRleHQgPyBgJHtkZXRhaWxzQ29udGV4dH0gdHJpbW1lZCB0byB6ZXJvIGxlbmd0aGAgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB2YWx1ZTogY2xlYW5lZCB9O1xufVxuXG4iLCAiLyoqXG4gKiBTaW1wbGUgdGV4dCBjaHVua2VyIHRoYXQgc3BsaXRzIHRleHQgaW50byBvdmVybGFwcGluZyBjaHVua3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNodW5rVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjaHVua1NpemU6IG51bWJlcixcbiAgb3ZlcmxhcDogbnVtYmVyLFxuKTogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IHN0YXJ0SW5kZXg6IG51bWJlcjsgZW5kSW5kZXg6IG51bWJlciB9PiB7XG4gIGNvbnN0IGNodW5rczogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IHN0YXJ0SW5kZXg6IG51bWJlcjsgZW5kSW5kZXg6IG51bWJlciB9PiA9IFtdO1xuICBcbiAgLy8gU2ltcGxlIHdvcmQtYmFzZWQgY2h1bmtpbmdcbiAgY29uc3Qgd29yZHMgPSB0ZXh0LnNwbGl0KC9cXHMrLyk7XG4gIFxuICBpZiAod29yZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGNodW5rcztcbiAgfVxuICBcbiAgbGV0IHN0YXJ0SWR4ID0gMDtcbiAgXG4gIHdoaWxlIChzdGFydElkeCA8IHdvcmRzLmxlbmd0aCkge1xuICAgIGNvbnN0IGVuZElkeCA9IE1hdGgubWluKHN0YXJ0SWR4ICsgY2h1bmtTaXplLCB3b3Jkcy5sZW5ndGgpO1xuICAgIGNvbnN0IGNodW5rV29yZHMgPSB3b3Jkcy5zbGljZShzdGFydElkeCwgZW5kSWR4KTtcbiAgICBjb25zdCBjaHVua1RleHQgPSBjaHVua1dvcmRzLmpvaW4oXCIgXCIpO1xuICAgIFxuICAgIGNodW5rcy5wdXNoKHtcbiAgICAgIHRleHQ6IGNodW5rVGV4dCxcbiAgICAgIHN0YXJ0SW5kZXg6IHN0YXJ0SWR4LFxuICAgICAgZW5kSW5kZXg6IGVuZElkeCxcbiAgICB9KTtcbiAgICBcbiAgICAvLyBNb3ZlIGZvcndhcmQgYnkgKGNodW5rU2l6ZSAtIG92ZXJsYXApIHRvIGNyZWF0ZSBvdmVybGFwcGluZyBjaHVua3NcbiAgICBzdGFydElkeCArPSBNYXRoLm1heCgxLCBjaHVua1NpemUgLSBvdmVybGFwKTtcbiAgICBcbiAgICAvLyBCcmVhayBpZiB3ZSd2ZSByZWFjaGVkIHRoZSBlbmRcbiAgICBpZiAoZW5kSWR4ID49IHdvcmRzLmxlbmd0aCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gY2h1bmtzO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIHRva2VuIGNvdW50IChyb3VnaCBhcHByb3hpbWF0aW9uOiAxIHRva2VuIFx1MjI0OCA0IGNoYXJhY3RlcnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc3RpbWF0ZVRva2VuQ291bnQodGV4dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDQpO1xufVxuXG4iLCAiaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIENhbGN1bGF0ZSBTSEEtMjU2IGhhc2ggb2YgYSBmaWxlIGZvciBjaGFuZ2UgZGV0ZWN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG4gICAgXG4gICAgc3RyZWFtLm9uKFwiZGF0YVwiLCAoZGF0YSkgPT4gaGFzaC51cGRhdGUoZGF0YSkpO1xuICAgIHN0cmVhbS5vbihcImVuZFwiLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KFwiaGV4XCIpKSk7XG4gICAgc3RyZWFtLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcbiAgfSk7XG59XG5cbi8qKlxuICogR2V0IGZpbGUgbWV0YWRhdGEgaW5jbHVkaW5nIHNpemUgYW5kIG1vZGlmaWNhdGlvbiB0aW1lXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRGaWxlTWV0YWRhdGEoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBEYXRlO1xuICBoYXNoOiBzdHJpbmc7XG59PiB7XG4gIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmaWxlUGF0aCk7XG4gIGNvbnN0IGhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aCk7XG4gIFxuICByZXR1cm4ge1xuICAgIHNpemU6IHN0YXRzLnNpemUsXG4gICAgbXRpbWU6IHN0YXRzLm10aW1lLFxuICAgIGhhc2gsXG4gIH07XG59XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuaW50ZXJmYWNlIEZhaWxlZEZpbGVFbnRyeSB7XG4gIGZpbGVIYXNoOiBzdHJpbmc7XG4gIHJlYXNvbjogc3RyaW5nO1xuICB0aW1lc3RhbXA6IHN0cmluZztcbn1cblxuLyoqXG4gKiBUcmFja3MgZmlsZXMgdGhhdCBmYWlsZWQgaW5kZXhpbmcgZm9yIGEgZ2l2ZW4gaGFzaCBzbyB3ZSBjYW4gc2tpcCB0aGVtXG4gKiB3aGVuIGF1dG8tcmVpbmRleGluZyB1bmNoYW5nZWQgZGF0YS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZhaWxlZEZpbGVSZWdpc3RyeSB7XG4gIHByaXZhdGUgbG9hZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgZW50cmllczogUmVjb3JkPHN0cmluZywgRmFpbGVkRmlsZUVudHJ5PiA9IHt9O1xuICBwcml2YXRlIHF1ZXVlOiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSByZWdpc3RyeVBhdGg6IHN0cmluZykge31cblxuICBwcml2YXRlIGFzeW5jIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMubG9hZGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUodGhpcy5yZWdpc3RyeVBhdGgsIFwidXRmLThcIik7XG4gICAgICB0aGlzLmVudHJpZXMgPSBKU09OLnBhcnNlKGRhdGEpID8/IHt9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5lbnRyaWVzID0ge307XG4gICAgfVxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyc2lzdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy5ta2RpcihwYXRoLmRpcm5hbWUodGhpcy5yZWdpc3RyeVBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUodGhpcy5yZWdpc3RyeVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuZW50cmllcywgbnVsbCwgMiksIFwidXRmLThcIik7XG4gIH1cblxuICBwcml2YXRlIHJ1bkV4Y2x1c2l2ZTxUPihvcGVyYXRpb246ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnF1ZXVlLnRoZW4ob3BlcmF0aW9uKTtcbiAgICB0aGlzLnF1ZXVlID0gcmVzdWx0LnRoZW4oXG4gICAgICAoKSA9PiB7fSxcbiAgICAgICgpID0+IHt9LFxuICAgICk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHJlY29yZEZhaWx1cmUoZmlsZVBhdGg6IHN0cmluZywgZmlsZUhhc2g6IHN0cmluZywgcmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICB0aGlzLmVudHJpZXNbZmlsZVBhdGhdID0ge1xuICAgICAgICBmaWxlSGFzaCxcbiAgICAgICAgcmVhc29uLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH07XG4gICAgICBhd2FpdCB0aGlzLnBlcnNpc3QoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNsZWFyRmFpbHVyZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMucnVuRXhjbHVzaXZlKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgICAgaWYgKHRoaXMuZW50cmllc1tmaWxlUGF0aF0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZW50cmllc1tmaWxlUGF0aF07XG4gICAgICAgIGF3YWl0IHRoaXMucGVyc2lzdCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RmFpbHVyZVJlYXNvbihmaWxlUGF0aDogc3RyaW5nLCBmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1tmaWxlUGF0aF07XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5LmZpbGVIYXNoID09PSBmaWxlSGFzaCA/IGVudHJ5LnJlYXNvbiA6IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IFBRdWV1ZSBmcm9tIFwicC1xdWV1ZVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBzY2FuRGlyZWN0b3J5LCB0eXBlIFNjYW5uZWRGaWxlIH0gZnJvbSBcIi4vZmlsZVNjYW5uZXJcIjtcbmltcG9ydCB7IHBhcnNlRG9jdW1lbnQsIHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4uL3BhcnNlcnMvZG9jdW1lbnRQYXJzZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlLCB0eXBlIERvY3VtZW50Q2h1bmsgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcbmltcG9ydCB7IGNodW5rVGV4dCB9IGZyb20gXCIuLi91dGlscy90ZXh0Q2h1bmtlclwiO1xuaW1wb3J0IHsgY2FsY3VsYXRlRmlsZUhhc2ggfSBmcm9tIFwiLi4vdXRpbHMvZmlsZUhhc2hcIjtcbmltcG9ydCB7IHR5cGUgRW1iZWRkaW5nRHluYW1pY0hhbmRsZSwgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBGYWlsZWRGaWxlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdXRpbHMvZmFpbGVkRmlsZVJlZ2lzdHJ5XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdQcm9ncmVzcyB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgcHJvY2Vzc2VkRmlsZXM6IG51bWJlcjtcbiAgY3VycmVudEZpbGU6IHN0cmluZztcbiAgc3RhdHVzOiBcInNjYW5uaW5nXCIgfCBcImluZGV4aW5nXCIgfCBcImNvbXBsZXRlXCIgfCBcImVycm9yXCI7XG4gIHN1Y2Nlc3NmdWxGaWxlcz86IG51bWJlcjtcbiAgZmFpbGVkRmlsZXM/OiBudW1iZXI7XG4gIHNraXBwZWRGaWxlcz86IG51bWJlcjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdSZXN1bHQge1xuICB0b3RhbEZpbGVzOiBudW1iZXI7XG4gIHN1Y2Nlc3NmdWxGaWxlczogbnVtYmVyO1xuICBmYWlsZWRGaWxlczogbnVtYmVyO1xuICBza2lwcGVkRmlsZXM6IG51bWJlcjtcbiAgdXBkYXRlZEZpbGVzOiBudW1iZXI7XG4gIG5ld0ZpbGVzOiBudW1iZXI7XG59XG5cbnR5cGUgRmlsZUluZGV4T3V0Y29tZSA9XG4gIHwgeyB0eXBlOiBcInNraXBwZWRcIiB9XG4gIHwgeyB0eXBlOiBcImluZGV4ZWRcIjsgY2hhbmdlVHlwZTogXCJuZXdcIiB8IFwidXBkYXRlZFwiIH1cbiAgfCB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ09wdGlvbnMge1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmU6IFZlY3RvclN0b3JlO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBlbWJlZGRpbmdNb2RlbDogRW1iZWRkaW5nRHluYW1pY0hhbmRsZTtcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudDtcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgYXV0b1JlaW5kZXg6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICBmYWlsdXJlUmVwb3J0UGF0aD86IHN0cmluZztcbiAgYWJvcnRTaWduYWw/OiBBYm9ydFNpZ25hbDtcbiAgb25Qcm9ncmVzcz86IChwcm9ncmVzczogSW5kZXhpbmdQcm9ncmVzcykgPT4gdm9pZDtcbn1cblxudHlwZSBGYWlsdXJlUmVhc29uID0gUGFyc2VGYWlsdXJlUmVhc29uIHwgXCJpbmRleC5jaHVuay1lbXB0eVwiIHwgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCI7XG5cbmZ1bmN0aW9uIGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihyYXc6IHVua25vd24pOiBudW1iZXJbXSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHJhdykpIHtcbiAgICByZXR1cm4gcmF3Lm1hcChhc3NlcnRGaW5pdGVOdW1iZXIpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiByYXcgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gW2Fzc2VydEZpbml0ZU51bWJlcihyYXcpXTtcbiAgfVxuXG4gIGlmIChyYXcgJiYgdHlwZW9mIHJhdyA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcocmF3KSkge1xuICAgICAgcmV0dXJuIEFycmF5LmZyb20ocmF3IGFzIHVua25vd24gYXMgQXJyYXlMaWtlPG51bWJlcj4pLm1hcChhc3NlcnRGaW5pdGVOdW1iZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9XG4gICAgICAocmF3IGFzIGFueSkuZW1iZWRkaW5nID8/XG4gICAgICAocmF3IGFzIGFueSkudmVjdG9yID8/XG4gICAgICAocmF3IGFzIGFueSkuZGF0YSA/P1xuICAgICAgKHR5cGVvZiAocmF3IGFzIGFueSkudG9BcnJheSA9PT0gXCJmdW5jdGlvblwiID8gKHJhdyBhcyBhbnkpLnRvQXJyYXkoKSA6IHVuZGVmaW5lZCkgPz9cbiAgICAgICh0eXBlb2YgKHJhdyBhcyBhbnkpLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiID8gKHJhdyBhcyBhbnkpLnRvSlNPTigpIDogdW5kZWZpbmVkKTtcblxuICAgIGlmIChjYW5kaWRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihjYW5kaWRhdGUpO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihcIkVtYmVkZGluZyBwcm92aWRlciByZXR1cm5lZCBhIG5vbi1udW1lcmljIHZlY3RvclwiKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RmluaXRlTnVtYmVyKHZhbHVlOiB1bmtub3duKTogbnVtYmVyIHtcbiAgY29uc3QgbnVtID0gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiID8gdmFsdWUgOiBOdW1iZXIodmFsdWUpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShudW0pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRW1iZWRkaW5nIHZlY3RvciBjb250YWlucyBhIG5vbi1maW5pdGUgdmFsdWVcIik7XG4gIH1cbiAgcmV0dXJuIG51bTtcbn1cblxuZXhwb3J0IGNsYXNzIEluZGV4TWFuYWdlciB7XG4gIHByaXZhdGUgcXVldWU6IFBRdWV1ZTtcbiAgcHJpdmF0ZSBvcHRpb25zOiBJbmRleGluZ09wdGlvbnM7XG4gIHByaXZhdGUgZmFpbHVyZVJlYXNvbkNvdW50czogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICBwcml2YXRlIGZhaWxlZEZpbGVSZWdpc3RyeTogRmFpbGVkRmlsZVJlZ2lzdHJ5O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEluZGV4aW5nT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5xdWV1ZSA9IG5ldyBQUXVldWUoeyBjb25jdXJyZW5jeTogb3B0aW9ucy5tYXhDb25jdXJyZW50IH0pO1xuICAgIHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5ID0gbmV3IEZhaWxlZEZpbGVSZWdpc3RyeShcbiAgICAgIHBhdGguam9pbihvcHRpb25zLnZlY3RvclN0b3JlRGlyLCBcIi5iaWctcmFnLWZhaWx1cmVzLmpzb25cIiksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB0aGUgaW5kZXhpbmcgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgaW5kZXgoKTogUHJvbWlzZTxJbmRleGluZ1Jlc3VsdD4ge1xuICAgIGNvbnN0IHsgZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZSwgb25Qcm9ncmVzcyB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVJbnZlbnRvcnkgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRGaWxlSGFzaEludmVudG9yeSgpO1xuXG4gICAgICAvLyBTdGVwIDE6IFNjYW4gZGlyZWN0b3J5XG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJzY2FubmluZ1wiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCBzY2FuRGlyZWN0b3J5KGRvY3VtZW50c0RpciwgKHNjYW5uZWQsIGZvdW5kKSA9PiB7XG4gICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgICB0b3RhbEZpbGVzOiBmb3VuZCxcbiAgICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgICAgY3VycmVudEZpbGU6IGBTY2FubmVkICR7c2Nhbm5lZH0gZmlsZXMuLi5gLFxuICAgICAgICAgICAgc3RhdHVzOiBcInNjYW5uaW5nXCIsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB0aGlzLm9wdGlvbnMuYWJvcnRTaWduYWw/LnRocm93SWZBYm9ydGVkKCk7XG5cbiAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2ZpbGVzLmxlbmd0aH0gZmlsZXMgdG8gcHJvY2Vzc2ApO1xuXG4gICAgICAvLyBTdGVwIDI6IEluZGV4IGZpbGVzXG4gICAgICBsZXQgcHJvY2Vzc2VkQ291bnQgPSAwO1xuICAgICAgbGV0IHN1Y2Nlc3NDb3VudCA9IDA7XG4gICAgICBsZXQgZmFpbENvdW50ID0gMDtcbiAgICAgIGxldCBza2lwcGVkQ291bnQgPSAwO1xuICAgICAgbGV0IHVwZGF0ZWRDb3VudCA9IDA7XG4gICAgICBsZXQgbmV3Q291bnQgPSAwO1xuXG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IGZpbGVzWzBdPy5uYW1lID8/IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBBYm9ydCBsaXN0ZW5lcjogd2hlbiBzaWduYWwgZmlyZXMsIGNsZWFyIHBlbmRpbmcgdGFza3MgZnJvbSB0aGUgcXVldWVcbiAgICAgIGNvbnN0IGFib3J0U2lnbmFsID0gdGhpcy5vcHRpb25zLmFib3J0U2lnbmFsO1xuICAgICAgY29uc3Qgb25BYm9ydCA9ICgpID0+IHRoaXMucXVldWUuY2xlYXIoKTtcbiAgICAgIGlmIChhYm9ydFNpZ25hbCkge1xuICAgICAgICBhYm9ydFNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgb25BYm9ydCwgeyBvbmNlOiB0cnVlIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBQcm9jZXNzIGZpbGVzIGluIGJhdGNoZXNcbiAgICAgIGNvbnN0IHRhc2tzID0gZmlsZXMubWFwKChmaWxlKSA9PlxuICAgICAgICB0aGlzLnF1ZXVlLmFkZChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgLy8gQ2hlY2sgYWJvcnQgYmVmb3JlIHByb2Nlc3NpbmcgZWFjaCBmaWxlXG4gICAgICAgICAgYWJvcnRTaWduYWw/LnRocm93SWZBYm9ydGVkKCk7XG5cbiAgICAgICAgICBsZXQgb3V0Y29tZTogRmlsZUluZGV4T3V0Y29tZSA9IHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IHByb2Nlc3NlZENvdW50LFxuICAgICAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgICAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dGNvbWUgPSBhd2FpdCB0aGlzLmluZGV4RmlsZShmaWxlLCBmaWxlSW52ZW50b3J5KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5kZXhpbmcgZmlsZSAke2ZpbGUucGF0aH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgICAgICBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcHJvY2Vzc2VkQ291bnQrKztcbiAgICAgICAgICBzd2l0Y2ggKG91dGNvbWUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcInNraXBwZWRcIjpcbiAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50Kys7XG4gICAgICAgICAgICAgIHNraXBwZWRDb3VudCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJpbmRleGVkXCI6XG4gICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgICBpZiAob3V0Y29tZS5jaGFuZ2VUeXBlID09PSBcIm5ld1wiKSB7XG4gICAgICAgICAgICAgICAgbmV3Q291bnQrKztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVkQ291bnQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJmYWlsZWRcIjpcbiAgICAgICAgICAgICAgZmFpbENvdW50Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YXNrcyk7XG5cbiAgICAgIC8vIENsZWFuIHVwIGFib3J0IGxpc3RlbmVyXG4gICAgICBpZiAoYWJvcnRTaWduYWwpIHtcbiAgICAgICAgYWJvcnRTaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIG9uQWJvcnQpO1xuICAgICAgfVxuXG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IHByb2Nlc3NlZENvdW50LFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJjb21wbGV0ZVwiLFxuICAgICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxvZ0ZhaWx1cmVTdW1tYXJ5KCk7XG4gICAgICBhd2FpdCB0aGlzLndyaXRlRmFpbHVyZVJlcG9ydCh7XG4gICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB1cGRhdGVkRmlsZXM6IHVwZGF0ZWRDb3VudCxcbiAgICAgICAgbmV3RmlsZXM6IG5ld0NvdW50LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgSW5kZXhpbmcgY29tcGxldGU6ICR7c3VjY2Vzc0NvdW50fS8ke2ZpbGVzLmxlbmd0aH0gZmlsZXMgc3VjY2Vzc2Z1bGx5IGluZGV4ZWQgKCR7ZmFpbENvdW50fSBmYWlsZWQsIHNraXBwZWQ9JHtza2lwcGVkQ291bnR9LCB1cGRhdGVkPSR7dXBkYXRlZENvdW50fSwgbmV3PSR7bmV3Q291bnR9KWAsXG4gICAgICApO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgdXBkYXRlZEZpbGVzOiB1cGRhdGVkQ291bnQsXG4gICAgICAgIG5ld0ZpbGVzOiBuZXdDb3VudCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBkdXJpbmcgaW5kZXhpbmc6XCIsIGVycm9yKTtcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IDAsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5kZXggYSBzaW5nbGUgZmlsZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBpbmRleEZpbGUoXG4gICAgZmlsZTogU2Nhbm5lZEZpbGUsXG4gICAgZmlsZUludmVudG9yeTogTWFwPHN0cmluZywgU2V0PHN0cmluZz4+ID0gbmV3IE1hcCgpLFxuICApOiBQcm9taXNlPEZpbGVJbmRleE91dGNvbWU+IHtcbiAgICBjb25zdCB7IHZlY3RvclN0b3JlLCBlbWJlZGRpbmdNb2RlbCwgY2xpZW50LCBjaHVua1NpemUsIGNodW5rT3ZlcmxhcCwgZW5hYmxlT0NSLCBhdXRvUmVpbmRleCB9ID1cbiAgICAgIHRoaXMub3B0aW9ucztcblxuICAgIGxldCBmaWxlSGFzaDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxjdWxhdGUgZmlsZSBoYXNoXG4gICAgICBmaWxlSGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBleGlzdGluZ0hhc2hlcyA9IGZpbGVJbnZlbnRvcnkuZ2V0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBoYXNTZWVuQmVmb3JlID0gZXhpc3RpbmdIYXNoZXMgIT09IHVuZGVmaW5lZCAmJiBleGlzdGluZ0hhc2hlcy5zaXplID4gMDtcbiAgICAgIGNvbnN0IGhhc1NhbWVIYXNoID0gZXhpc3RpbmdIYXNoZXM/LmhhcyhmaWxlSGFzaCkgPz8gZmFsc2U7XG5cbiAgICAgIC8vIENoZWNrIGlmIGZpbGUgYWxyZWFkeSBpbmRleGVkXG4gICAgICBpZiAoYXV0b1JlaW5kZXggJiYgaGFzU2FtZUhhc2gpIHtcbiAgICAgICAgY29uc29sZS5sb2coYEZpbGUgYWxyZWFkeSBpbmRleGVkIChza2lwcGVkKTogJHtmaWxlLm5hbWV9YCk7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwic2tpcHBlZFwiIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChhdXRvUmVpbmRleCkge1xuICAgICAgICBjb25zdCBwcmV2aW91c0ZhaWx1cmUgPSBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5nZXRGYWlsdXJlUmVhc29uKGZpbGUucGF0aCwgZmlsZUhhc2gpO1xuICAgICAgICBpZiAocHJldmlvdXNGYWlsdXJlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgRmlsZSBwcmV2aW91c2x5IGZhaWxlZCAoc2tpcHBlZCk6ICR7ZmlsZS5uYW1lfSAocmVhc29uPSR7cHJldmlvdXNGYWlsdXJlfSlgLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJza2lwcGVkXCIgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBXYWl0IGJlZm9yZSBwYXJzaW5nIHRvIHJlZHVjZSBXZWJTb2NrZXQgbG9hZFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXJzZURlbGF5TXMgPiAwKSB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aGlzLm9wdGlvbnMucGFyc2VEZWxheU1zKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnNlIGRvY3VtZW50XG4gICAgICBjb25zdCBwYXJzZWRSZXN1bHQgPSBhd2FpdCBwYXJzZURvY3VtZW50KGZpbGUucGF0aCwgZW5hYmxlT0NSLCBjbGllbnQpO1xuICAgICAgaWYgKCFwYXJzZWRSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUocGFyc2VkUmVzdWx0LnJlYXNvbiwgcGFyc2VkUmVzdWx0LmRldGFpbHMsIGZpbGUpO1xuICAgICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIHBhcnNlZFJlc3VsdC5yZWFzb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlZFJlc3VsdC5kb2N1bWVudDtcblxuICAgICAgLy8gQ2h1bmsgdGV4dFxuICAgICAgY29uc3QgY2h1bmtzID0gY2h1bmtUZXh0KHBhcnNlZC50ZXh0LCBjaHVua1NpemUsIGNodW5rT3ZlcmxhcCk7XG4gICAgICBpZiAoY2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgTm8gY2h1bmtzIGNyZWF0ZWQgZnJvbSAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFwiaW5kZXguY2h1bmstZW1wdHlcIiwgXCJjaHVua1RleHQgcHJvZHVjZWQgMCBjaHVua3NcIiwgZmlsZSk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJpbmRleC5jaHVuay1lbXB0eVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07IC8vIEZhaWxlZCB0byBjaHVua1xuICAgICAgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSBlbWJlZGRpbmdzIGFuZCBjcmVhdGUgZG9jdW1lbnQgY2h1bmtzXG4gICAgICBjb25zdCBkb2N1bWVudENodW5rczogRG9jdW1lbnRDaHVua1tdID0gW107XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gY2h1bmtzW2ldO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2hlY2sgYWJvcnQgYmV0d2VlbiBjaHVuayBlbWJlZGRpbmdzXG4gICAgICAgIHRoaXMub3B0aW9ucy5hYm9ydFNpZ25hbD8udGhyb3dJZkFib3J0ZWQoKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIEdlbmVyYXRlIGVtYmVkZGluZ1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGluZ1Jlc3VsdCA9IGF3YWl0IGVtYmVkZGluZ01vZGVsLmVtYmVkKGNodW5rLnRleHQpO1xuICAgICAgICAgIGNvbnN0IGVtYmVkZGluZyA9IGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihlbWJlZGRpbmdSZXN1bHQuZW1iZWRkaW5nKTtcbiAgICAgICAgICBcbiAgICAgICAgICBkb2N1bWVudENodW5rcy5wdXNoKHtcbiAgICAgICAgICAgIGlkOiBgJHtmaWxlSGFzaH0tJHtpfWAsXG4gICAgICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICAgICAgdmVjdG9yOiBlbWJlZGRpbmcsXG4gICAgICAgICAgICBmaWxlUGF0aDogZmlsZS5wYXRoLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgIGZpbGVIYXNoLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogaSxcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICAgIGV4dGVuc2lvbjogZmlsZS5leHRlbnNpb24sXG4gICAgICAgICAgICAgIHNpemU6IGZpbGUuc2l6ZSxcbiAgICAgICAgICAgICAgbXRpbWU6IGZpbGUubXRpbWUudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgc3RhcnRJbmRleDogY2h1bmsuc3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgZW5kSW5kZXg6IGNodW5rLmVuZEluZGV4LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBlbWJlZGRpbmcgY2h1bmsgJHtpfSBvZiAke2ZpbGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBjaHVua3MgdG8gdmVjdG9yIHN0b3JlXG4gICAgICBpZiAoZG9jdW1lbnRDaHVua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcbiAgICAgICAgICBcImluZGV4LmNodW5rLWVtcHR5XCIsXG4gICAgICAgICAgXCJBbGwgY2h1bmsgZW1iZWRkaW5ncyBmYWlsZWQsIG5vIGRvY3VtZW50IGNodW5rc1wiLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJpbmRleC5jaHVuay1lbXB0eVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHZlY3RvclN0b3JlLmFkZENodW5rcyhkb2N1bWVudENodW5rcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBJbmRleGVkICR7ZG9jdW1lbnRDaHVua3MubGVuZ3RofSBjaHVua3MgZnJvbSAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgaWYgKCFleGlzdGluZ0hhc2hlcykge1xuICAgICAgICAgIGZpbGVJbnZlbnRvcnkuc2V0KGZpbGUucGF0aCwgbmV3IFNldChbZmlsZUhhc2hdKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhpc3RpbmdIYXNoZXMuYWRkKGZpbGVIYXNoKTtcbiAgICAgICAgfVxuICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5jbGVhckZhaWx1cmUoZmlsZS5wYXRoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0eXBlOiBcImluZGV4ZWRcIixcbiAgICAgICAgICBjaGFuZ2VUeXBlOiBoYXNTZWVuQmVmb3JlID8gXCJ1cGRhdGVkXCIgOiBcIm5ld1wiLFxuICAgICAgICB9O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgYWRkaW5nIGNodW5rcyBmb3IgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgIFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiLFxuICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICBmaWxlLFxuICAgICAgICApO1xuICAgICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbmRleGluZyBmaWxlICR7ZmlsZS5wYXRofTpgLCBlcnJvcik7XG4gICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgICAgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiLFxuICAgICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICApO1xuICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTsgLy8gRmFpbGVkXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlaW5kZXggYSBzcGVjaWZpYyBmaWxlIChkZWxldGUgb2xkIGNodW5rcyBhbmQgcmVpbmRleClcbiAgICovXG4gIGFzeW5jIHJlaW5kZXhGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCB7IHZlY3RvclN0b3JlIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aCk7XG4gICAgICBcbiAgICAgIC8vIERlbGV0ZSBvbGQgY2h1bmtzXG4gICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5kZWxldGVCeUZpbGVIYXNoKGZpbGVIYXNoKTtcbiAgICAgIFxuICAgICAgLy8gUmVpbmRleFxuICAgICAgY29uc3QgZmlsZTogU2Nhbm5lZEZpbGUgPSB7XG4gICAgICAgIHBhdGg6IGZpbGVQYXRoLFxuICAgICAgICBuYW1lOiBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGgsXG4gICAgICAgIGV4dGVuc2lvbjogZmlsZVBhdGguc3BsaXQoXCIuXCIpLnBvcCgpIHx8IFwiXCIsXG4gICAgICAgIG1pbWVUeXBlOiBmYWxzZSxcbiAgICAgICAgc2l6ZTogMCxcbiAgICAgICAgbXRpbWU6IG5ldyBEYXRlKCksXG4gICAgICB9O1xuICAgICAgXG4gICAgICBhd2FpdCB0aGlzLmluZGV4RmlsZShmaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVpbmRleGluZyBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVjb3JkRmFpbHVyZShyZWFzb246IEZhaWx1cmVSZWFzb24sIGRldGFpbHM6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmlsZTogU2Nhbm5lZEZpbGUpIHtcbiAgICBjb25zdCBjdXJyZW50ID0gdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl0gPz8gMDtcbiAgICB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXSA9IGN1cnJlbnQgKyAxO1xuICAgIGNvbnN0IGRldGFpbFN1ZmZpeCA9IGRldGFpbHMgPyBgIGRldGFpbHM9JHtkZXRhaWxzfWAgOiBcIlwiO1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBbQmlnUkFHXSBGYWlsZWQgdG8gcGFyc2UgJHtmaWxlLm5hbWV9IChyZWFzb249JHtyZWFzb259LCBjb3VudD0ke3RoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dfSkke2RldGFpbFN1ZmZpeH1gLFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGxvZ0ZhaWx1cmVTdW1tYXJ5KCkge1xuICAgIGNvbnN0IGVudHJpZXMgPSBPYmplY3QuZW50cmllcyh0aGlzLmZhaWx1cmVSZWFzb25Db3VudHMpO1xuICAgIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29uc29sZS5sb2coXCJbQmlnUkFHXSBObyBwYXJzaW5nIGZhaWx1cmVzIHJlY29yZGVkLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc29sZS5sb2coXCJbQmlnUkFHXSBGYWlsdXJlIHJlYXNvbiBzdW1tYXJ5OlwiKTtcbiAgICBmb3IgKGNvbnN0IFtyZWFzb24sIGNvdW50XSBvZiBlbnRyaWVzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgICAtICR7cmVhc29ufTogJHtjb3VudH1gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHdyaXRlRmFpbHVyZVJlcG9ydChzdW1tYXJ5OiBJbmRleGluZ1Jlc3VsdCkge1xuICAgIGNvbnN0IHJlcG9ydFBhdGggPSB0aGlzLm9wdGlvbnMuZmFpbHVyZVJlcG9ydFBhdGg7XG4gICAgaWYgKCFyZXBvcnRQYXRoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICAgIC4uLnN1bW1hcnksXG4gICAgICBkb2N1bWVudHNEaXI6IHRoaXMub3B0aW9ucy5kb2N1bWVudHNEaXIsXG4gICAgICBmYWlsdXJlUmVhc29uczogdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzLFxuICAgICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKHBhdGguZGlybmFtZShyZXBvcnRQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy53cml0ZUZpbGUocmVwb3J0UGF0aCwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCwgbnVsbCwgMiksIFwidXRmLThcIik7XG4gICAgICBjb25zb2xlLmxvZyhgW0JpZ1JBR10gV3JvdGUgZmFpbHVyZSByZXBvcnQgdG8gJHtyZXBvcnRQYXRofWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBbQmlnUkFHXSBGYWlsZWQgdG8gd3JpdGUgZmFpbHVyZSByZXBvcnQgdG8gJHtyZXBvcnRQYXRofTpgLCBlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbiIsICJpbXBvcnQgeyB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IEluZGV4TWFuYWdlciwgdHlwZSBJbmRleGluZ1Byb2dyZXNzLCB0eXBlIEluZGV4aW5nUmVzdWx0IH0gZnJvbSBcIi4vaW5kZXhNYW5hZ2VyXCI7XG5pbXBvcnQgeyBWZWN0b3JTdG9yZSB9IGZyb20gXCIuLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkluZGV4aW5nUGFyYW1zIHtcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudDtcbiAgYWJvcnRTaWduYWw6IEFib3J0U2lnbmFsO1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgYXV0b1JlaW5kZXg6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICBmb3JjZVJlaW5kZXg/OiBib29sZWFuO1xuICB2ZWN0b3JTdG9yZT86IFZlY3RvclN0b3JlO1xuICBvblByb2dyZXNzPzogKHByb2dyZXNzOiBJbmRleGluZ1Byb2dyZXNzKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bkluZGV4aW5nUmVzdWx0IHtcbiAgc3VtbWFyeTogc3RyaW5nO1xuICBzdGF0czoge1xuICAgIHRvdGFsQ2h1bmtzOiBudW1iZXI7XG4gICAgdW5pcXVlRmlsZXM6IG51bWJlcjtcbiAgfTtcbiAgaW5kZXhpbmdSZXN1bHQ6IEluZGV4aW5nUmVzdWx0O1xufVxuXG4vKipcbiAqIFNoYXJlZCBoZWxwZXIgdGhhdCBydW5zIHRoZSBmdWxsIGluZGV4aW5nIHBpcGVsaW5lLlxuICogQWxsb3dzIHJldXNlIGFjcm9zcyB0aGUgbWFudWFsIHRvb2wsIGNvbmZpZy10cmlnZ2VyZWQgaW5kZXhpbmcsIGFuZCBhdXRvbWF0aWMgYm9vdHN0cmFwcGluZy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJ1bkluZGV4aW5nSm9iKHtcbiAgY2xpZW50LFxuICBhYm9ydFNpZ25hbCxcbiAgZG9jdW1lbnRzRGlyLFxuICB2ZWN0b3JTdG9yZURpcixcbiAgY2h1bmtTaXplLFxuICBjaHVua092ZXJsYXAsXG4gIG1heENvbmN1cnJlbnQsXG4gIGVuYWJsZU9DUixcbiAgYXV0b1JlaW5kZXgsXG4gIHBhcnNlRGVsYXlNcyxcbiAgZm9yY2VSZWluZGV4ID0gZmFsc2UsXG4gIHZlY3RvclN0b3JlOiBleGlzdGluZ1ZlY3RvclN0b3JlLFxuICBvblByb2dyZXNzLFxufTogUnVuSW5kZXhpbmdQYXJhbXMpOiBQcm9taXNlPFJ1bkluZGV4aW5nUmVzdWx0PiB7XG4gIGNvbnN0IHZlY3RvclN0b3JlID0gZXhpc3RpbmdWZWN0b3JTdG9yZSA/PyBuZXcgVmVjdG9yU3RvcmUodmVjdG9yU3RvcmVEaXIpO1xuICBjb25zdCBvd25zVmVjdG9yU3RvcmUgPSBleGlzdGluZ1ZlY3RvclN0b3JlID09PSB1bmRlZmluZWQ7XG5cbiAgaWYgKG93bnNWZWN0b3JTdG9yZSkge1xuICAgIGF3YWl0IHZlY3RvclN0b3JlLmluaXRpYWxpemUoKTtcbiAgfVxuXG4gIGNvbnN0IGVtYmVkZGluZ01vZGVsID0gYXdhaXQgY2xpZW50LmVtYmVkZGluZy5tb2RlbChcbiAgICBcIm5vbWljLWFpL25vbWljLWVtYmVkLXRleHQtdjEuNS1HR1VGXCIsXG4gICAgeyBzaWduYWw6IGFib3J0U2lnbmFsIH0sXG4gICk7XG5cbiAgY29uc3QgaW5kZXhNYW5hZ2VyID0gbmV3IEluZGV4TWFuYWdlcih7XG4gICAgZG9jdW1lbnRzRGlyLFxuICAgIHZlY3RvclN0b3JlLFxuICAgIHZlY3RvclN0b3JlRGlyLFxuICAgIGVtYmVkZGluZ01vZGVsLFxuICAgIGNsaWVudCxcbiAgICBjaHVua1NpemUsXG4gICAgY2h1bmtPdmVybGFwLFxuICAgIG1heENvbmN1cnJlbnQsXG4gICAgZW5hYmxlT0NSLFxuICAgIGF1dG9SZWluZGV4OiBmb3JjZVJlaW5kZXggPyBmYWxzZSA6IGF1dG9SZWluZGV4LFxuICAgIHBhcnNlRGVsYXlNcyxcbiAgICBhYm9ydFNpZ25hbCxcbiAgICBvblByb2dyZXNzLFxuICB9KTtcblxuICBjb25zdCBpbmRleGluZ1Jlc3VsdCA9IGF3YWl0IGluZGV4TWFuYWdlci5pbmRleCgpO1xuICBjb25zdCBzdGF0cyA9IGF3YWl0IHZlY3RvclN0b3JlLmdldFN0YXRzKCk7XG5cbiAgaWYgKG93bnNWZWN0b3JTdG9yZSkge1xuICAgIGF3YWl0IHZlY3RvclN0b3JlLmNsb3NlKCk7XG4gIH1cblxuICBjb25zdCBzdW1tYXJ5ID0gYEluZGV4aW5nIGNvbXBsZXRlZCFcXG5cXG5gICtcbiAgICBgXHUyMDIyIFN1Y2Nlc3NmdWxseSBpbmRleGVkOiAke2luZGV4aW5nUmVzdWx0LnN1Y2Nlc3NmdWxGaWxlc30vJHtpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgRmFpbGVkOiAke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgU2tpcHBlZCAodW5jaGFuZ2VkKTogJHtpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBVcGRhdGVkIGV4aXN0aW5nIGZpbGVzOiAke2luZGV4aW5nUmVzdWx0LnVwZGF0ZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIE5ldyBmaWxlcyBhZGRlZDogJHtpbmRleGluZ1Jlc3VsdC5uZXdGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIENodW5rcyBpbiBzdG9yZTogJHtzdGF0cy50b3RhbENodW5rc31cXG5gICtcbiAgICBgXHUyMDIyIFVuaXF1ZSBmaWxlcyBpbiBzdG9yZTogJHtzdGF0cy51bmlxdWVGaWxlc31gO1xuXG4gIHJldHVybiB7XG4gICAgc3VtbWFyeSxcbiAgICBzdGF0cyxcbiAgICBpbmRleGluZ1Jlc3VsdCxcbiAgfTtcbn1cblxuIiwgImltcG9ydCB7XG4gIHR5cGUgQ2hhdE1lc3NhZ2UsXG4gIHR5cGUgUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcixcbn0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MsIERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBWZWN0b3JTdG9yZSB9IGZyb20gXCIuL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5pbXBvcnQgeyBwZXJmb3JtU2FuaXR5Q2hlY2tzIH0gZnJvbSBcIi4vdXRpbHMvc2FuaXR5Q2hlY2tzXCI7XG5pbXBvcnQgeyB0cnlTdGFydEluZGV4aW5nLCBmaW5pc2hJbmRleGluZyB9IGZyb20gXCIuL3V0aWxzL2luZGV4aW5nTG9ja1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcnVuSW5kZXhpbmdKb2IgfSBmcm9tIFwiLi9pbmdlc3Rpb24vcnVuSW5kZXhpbmdcIjtcblxuLyoqXG4gKiBDaGVjayB0aGUgYWJvcnQgc2lnbmFsIGFuZCB0aHJvdyBpZiB0aGUgcmVxdWVzdCBoYXMgYmVlbiBjYW5jZWxsZWQuXG4gKiBUaGlzIGdpdmVzIExNIFN0dWRpbyB0aGUgb3Bwb3J0dW5pdHkgdG8gc3RvcCB0aGUgcHJlcHJvY2Vzc29yIHByb21wdGx5LlxuICovXG5mdW5jdGlvbiBjaGVja0Fib3J0KHNpZ25hbDogQWJvcnRTaWduYWwpOiB2b2lkIHtcbiAgaWYgKHNpZ25hbC5hYm9ydGVkKSB7XG4gICAgdGhyb3cgc2lnbmFsLnJlYXNvbiA/PyBuZXcgRE9NRXhjZXB0aW9uKFwiQWJvcnRlZFwiLCBcIkFib3J0RXJyb3JcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGVycm9yIGlzIGFuIGFib3J0L2NhbmNlbGxhdGlvbiBlcnJvciB0aGF0IHNob3VsZCBiZSByZS10aHJvd24uXG4gKi9cbmZ1bmN0aW9uIGlzQWJvcnRFcnJvcihlcnJvcjogdW5rbm93bik6IGJvb2xlYW4ge1xuICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBET01FeGNlcHRpb24gJiYgZXJyb3IubmFtZSA9PT0gXCJBYm9ydEVycm9yXCIpIHJldHVybiB0cnVlO1xuICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikgcmV0dXJuIHRydWU7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm1lc3NhZ2UgPT09IFwiQWJvcnRlZFwiKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBzdW1tYXJpemVUZXh0KHRleHQ6IHN0cmluZywgbWF4TGluZXM6IG51bWJlciA9IDMsIG1heENoYXJzOiBudW1iZXIgPSA0MDApOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IHRleHQuc3BsaXQoL1xccj9cXG4vKS5maWx0ZXIobGluZSA9PiBsaW5lLnRyaW0oKSAhPT0gXCJcIik7XG4gIGNvbnN0IGNsaXBwZWRMaW5lcyA9IGxpbmVzLnNsaWNlKDAsIG1heExpbmVzKTtcbiAgbGV0IGNsaXBwZWQgPSBjbGlwcGVkTGluZXMuam9pbihcIlxcblwiKTtcbiAgaWYgKGNsaXBwZWQubGVuZ3RoID4gbWF4Q2hhcnMpIHtcbiAgICBjbGlwcGVkID0gY2xpcHBlZC5zbGljZSgwLCBtYXhDaGFycyk7XG4gIH1cbiAgY29uc3QgbmVlZHNFbGxpcHNpcyA9XG4gICAgbGluZXMubGVuZ3RoID4gbWF4TGluZXMgfHxcbiAgICB0ZXh0Lmxlbmd0aCA+IGNsaXBwZWQubGVuZ3RoIHx8XG4gICAgY2xpcHBlZC5sZW5ndGggPT09IG1heENoYXJzICYmIHRleHQubGVuZ3RoID4gbWF4Q2hhcnM7XG4gIHJldHVybiBuZWVkc0VsbGlwc2lzID8gYCR7Y2xpcHBlZC50cmltRW5kKCl9XHUyMDI2YCA6IGNsaXBwZWQ7XG59XG5cbi8vIEdsb2JhbCBzdGF0ZSBmb3IgdmVjdG9yIHN0b3JlIChwZXJzaXN0cyBhY3Jvc3MgcmVxdWVzdHMpXG5sZXQgdmVjdG9yU3RvcmU6IFZlY3RvclN0b3JlIHwgbnVsbCA9IG51bGw7XG5sZXQgbGFzdEluZGV4ZWREaXIgPSBcIlwiO1xubGV0IHNhbml0eUNoZWNrc1Bhc3NlZCA9IGZhbHNlO1xuXG5jb25zdCBSQUdfQ09OVEVYVF9NQUNSTyA9IFwie3tyYWdfY29udGV4dH19XCI7XG5jb25zdCBVU0VSX1FVRVJZX01BQ1JPID0gXCJ7e3VzZXJfcXVlcnl9fVwiO1xuXG5mdW5jdGlvbiBub3JtYWxpemVQcm9tcHRUZW1wbGF0ZSh0ZW1wbGF0ZTogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGNvbnN0IGhhc0NvbnRlbnQgPSB0eXBlb2YgdGVtcGxhdGUgPT09IFwic3RyaW5nXCIgJiYgdGVtcGxhdGUudHJpbSgpLmxlbmd0aCA+IDA7XG4gIGxldCBub3JtYWxpemVkID0gaGFzQ29udGVudCA/IHRlbXBsYXRlISA6IERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFO1xuXG4gIGlmICghbm9ybWFsaXplZC5pbmNsdWRlcyhSQUdfQ09OVEVYVF9NQUNSTykpIHtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgW0JpZ1JBR10gUHJvbXB0IHRlbXBsYXRlIG1pc3NpbmcgJHtSQUdfQ09OVEVYVF9NQUNST30uIFByZXBlbmRpbmcgUkFHIGNvbnRleHQgYmxvY2suYCxcbiAgICApO1xuICAgIG5vcm1hbGl6ZWQgPSBgJHtSQUdfQ09OVEVYVF9NQUNST31cXG5cXG4ke25vcm1hbGl6ZWR9YDtcbiAgfVxuXG4gIGlmICghbm9ybWFsaXplZC5pbmNsdWRlcyhVU0VSX1FVRVJZX01BQ1JPKSkge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBbQmlnUkFHXSBQcm9tcHQgdGVtcGxhdGUgbWlzc2luZyAke1VTRVJfUVVFUllfTUFDUk99LiBBcHBlbmRpbmcgdXNlciBxdWVyeSBibG9jay5gLFxuICAgICk7XG4gICAgbm9ybWFsaXplZCA9IGAke25vcm1hbGl6ZWR9XFxuXFxuVXNlciBRdWVyeTpcXG5cXG4ke1VTRVJfUVVFUllfTUFDUk99YDtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG5mdW5jdGlvbiBmaWxsUHJvbXB0VGVtcGxhdGUodGVtcGxhdGU6IHN0cmluZywgcmVwbGFjZW1lbnRzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKHJlcGxhY2VtZW50cykucmVkdWNlKFxuICAgIChhY2MsIFt0b2tlbiwgdmFsdWVdKSA9PiBhY2Muc3BsaXQodG9rZW4pLmpvaW4odmFsdWUpLFxuICAgIHRlbXBsYXRlLFxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiB3YXJuSWZDb250ZXh0T3ZlcmZsb3coXG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcixcbiAgZmluYWxQcm9tcHQ6IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGNvbnN0IHRva2VuU291cmNlID0gYXdhaXQgY3RsLnRva2VuU291cmNlKCk7XG4gICAgaWYgKFxuICAgICAgIXRva2VuU291cmNlIHx8XG4gICAgICAhKFwiYXBwbHlQcm9tcHRUZW1wbGF0ZVwiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmFwcGx5UHJvbXB0VGVtcGxhdGUgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgIShcImNvdW50VG9rZW5zXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuY291bnRUb2tlbnMgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgIShcImdldENvbnRleHRMZW5ndGhcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5nZXRDb250ZXh0TGVuZ3RoICE9PSBcImZ1bmN0aW9uXCJcbiAgICApIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFRva2VuIHNvdXJjZSBkb2VzIG5vdCBleHBvc2UgcHJvbXB0IHV0aWxpdGllczsgc2tpcHBpbmcgY29udGV4dCBjaGVjay5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgW2NvbnRleHRMZW5ndGgsIGhpc3RvcnldID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdG9rZW5Tb3VyY2UuZ2V0Q29udGV4dExlbmd0aCgpLFxuICAgICAgY3RsLnB1bGxIaXN0b3J5KCksXG4gICAgXSk7XG4gICAgY29uc3QgaGlzdG9yeVdpdGhMYXRlc3RNZXNzYWdlID0gaGlzdG9yeS53aXRoQXBwZW5kZWQoe1xuICAgICAgcm9sZTogXCJ1c2VyXCIsXG4gICAgICBjb250ZW50OiBmaW5hbFByb21wdCxcbiAgICB9KTtcbiAgICBjb25zdCBmb3JtYXR0ZWRQcm9tcHQgPSBhd2FpdCB0b2tlblNvdXJjZS5hcHBseVByb21wdFRlbXBsYXRlKGhpc3RvcnlXaXRoTGF0ZXN0TWVzc2FnZSk7XG4gICAgY29uc3QgcHJvbXB0VG9rZW5zID0gYXdhaXQgdG9rZW5Tb3VyY2UuY291bnRUb2tlbnMoZm9ybWF0dGVkUHJvbXB0KTtcblxuICAgIGlmIChwcm9tcHRUb2tlbnMgPiBjb250ZXh0TGVuZ3RoKSB7XG4gICAgICBjb25zdCB3YXJuaW5nU3VtbWFyeSA9XG4gICAgICAgIGBcdTI2QTBcdUZFMEYgUHJvbXB0IG5lZWRzICR7cHJvbXB0VG9rZW5zLnRvTG9jYWxlU3RyaW5nKCl9IHRva2VucyBidXQgbW9kZWwgbWF4IGlzICR7Y29udGV4dExlbmd0aC50b0xvY2FsZVN0cmluZygpfS5gO1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR11cIiwgd2FybmluZ1N1bW1hcnkpO1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICB0ZXh0OiBgJHt3YXJuaW5nU3VtbWFyeX0gUmVkdWNlIHJldHJpZXZlZCBwYXNzYWdlcyBvciBpbmNyZWFzZSB0aGUgbW9kZWwncyBjb250ZXh0IGxlbmd0aC5gLFxuICAgICAgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBjdGwuY2xpZW50LnN5c3RlbS5ub3RpZnkoe1xuICAgICAgICAgIHRpdGxlOiBcIkNvbnRleHQgd2luZG93IGV4Y2VlZGVkXCIsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGAke3dhcm5pbmdTdW1tYXJ5fSBQcm9tcHQgbWF5IGJlIHRydW5jYXRlZCBvciByZWplY3RlZC5gLFxuICAgICAgICAgIG5vQXV0b0Rpc21pc3M6IHRydWUsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAobm90aWZ5RXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVW5hYmxlIHRvIHNlbmQgY29udGV4dCBvdmVyZmxvdyBub3RpZmljYXRpb246XCIsIG5vdGlmeUVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gRmFpbGVkIHRvIGV2YWx1YXRlIGNvbnRleHQgdXNhZ2U6XCIsIGVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIE1haW4gcHJvbXB0IHByZXByb2Nlc3NvciBmdW5jdGlvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlcHJvY2VzcyhcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxuICB1c2VyTWVzc2FnZTogQ2hhdE1lc3NhZ2UsXG4pOiBQcm9taXNlPENoYXRNZXNzYWdlIHwgc3RyaW5nPiB7XG4gIGNvbnN0IHVzZXJQcm9tcHQgPSB1c2VyTWVzc2FnZS5nZXRUZXh0KCk7XG4gIGNvbnN0IHBsdWdpbkNvbmZpZyA9IGN0bC5nZXRQbHVnaW5Db25maWcoY29uZmlnU2NoZW1hdGljcyk7XG5cbiAgLy8gR2V0IGNvbmZpZ3VyYXRpb25cbiAgY29uc3QgZG9jdW1lbnRzRGlyID0gcGx1Z2luQ29uZmlnLmdldChcImRvY3VtZW50c0RpcmVjdG9yeVwiKTtcbiAgY29uc3QgdmVjdG9yU3RvcmVEaXIgPSBwbHVnaW5Db25maWcuZ2V0KFwidmVjdG9yU3RvcmVEaXJlY3RvcnlcIik7XG4gIGNvbnN0IHJldHJpZXZhbExpbWl0ID0gcGx1Z2luQ29uZmlnLmdldChcInJldHJpZXZhbExpbWl0XCIpO1xuICBjb25zdCByZXRyaWV2YWxUaHJlc2hvbGQgPSBwbHVnaW5Db25maWcuZ2V0KFwicmV0cmlldmFsQWZmaW5pdHlUaHJlc2hvbGRcIik7XG4gIGNvbnN0IGNodW5rU2l6ZSA9IHBsdWdpbkNvbmZpZy5nZXQoXCJjaHVua1NpemVcIik7XG4gIGNvbnN0IGNodW5rT3ZlcmxhcCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJjaHVua092ZXJsYXBcIik7XG4gIGNvbnN0IG1heENvbmN1cnJlbnQgPSBwbHVnaW5Db25maWcuZ2V0KFwibWF4Q29uY3VycmVudEZpbGVzXCIpO1xuICBjb25zdCBlbmFibGVPQ1IgPSBwbHVnaW5Db25maWcuZ2V0KFwiZW5hYmxlT0NSXCIpO1xuICBjb25zdCBza2lwUHJldmlvdXNseUluZGV4ZWQgPSBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC5za2lwUHJldmlvdXNseUluZGV4ZWRcIik7XG4gIGNvbnN0IHBhcnNlRGVsYXlNcyA9IHBsdWdpbkNvbmZpZy5nZXQoXCJwYXJzZURlbGF5TXNcIikgPz8gMDtcbiAgY29uc3QgcmVpbmRleFJlcXVlc3RlZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnRyaWdnZXJcIik7XG5cbiAgLy8gVmFsaWRhdGUgY29uZmlndXJhdGlvblxuICBpZiAoIWRvY3VtZW50c0RpciB8fCBkb2N1bWVudHNEaXIgPT09IFwiXCIpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBEb2N1bWVudHMgZGlyZWN0b3J5IG5vdCBjb25maWd1cmVkLiBQbGVhc2Ugc2V0IGl0IGluIHBsdWdpbiBzZXR0aW5ncy5cIik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG5cbiAgaWYgKCF2ZWN0b3JTdG9yZURpciB8fCB2ZWN0b3JTdG9yZURpciA9PT0gXCJcIikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFZlY3RvciBzdG9yZSBkaXJlY3Rvcnkgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLlwiKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cblxuICB0cnkge1xuICAgIC8vIFBlcmZvcm0gc2FuaXR5IGNoZWNrcyBvbiBmaXJzdCBydW5cbiAgICBpZiAoIXNhbml0eUNoZWNrc1Bhc3NlZCkge1xuICAgICAgY29uc3QgY2hlY2tTdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgdGV4dDogXCJQZXJmb3JtaW5nIHNhbml0eSBjaGVja3MuLi5cIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBzYW5pdHlSZXN1bHQgPSBhd2FpdCBwZXJmb3JtU2FuaXR5Q2hlY2tzKGRvY3VtZW50c0RpciwgdmVjdG9yU3RvcmVEaXIpO1xuXG4gICAgICAvLyBMb2cgd2FybmluZ3NcbiAgICAgIGZvciAoY29uc3Qgd2FybmluZyBvZiBzYW5pdHlSZXN1bHQud2FybmluZ3MpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR11cIiwgd2FybmluZyk7XG4gICAgICB9XG5cbiAgICAgIC8vIExvZyBlcnJvcnMgYW5kIGFib3J0IGlmIGNyaXRpY2FsXG4gICAgICBpZiAoIXNhbml0eVJlc3VsdC5wYXNzZWQpIHtcbiAgICAgICAgZm9yIChjb25zdCBlcnJvciBvZiBzYW5pdHlSZXN1bHQuZXJyb3JzKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIltCaWdSQUddXCIsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmYWlsdXJlUmVhc29uID1cbiAgICAgICAgICBzYW5pdHlSZXN1bHQuZXJyb3JzWzBdID8/XG4gICAgICAgICAgc2FuaXR5UmVzdWx0Lndhcm5pbmdzWzBdID8/XG4gICAgICAgICAgXCJVbmtub3duIHJlYXNvbi4gUGxlYXNlIHJldmlldyBwbHVnaW4gc2V0dGluZ3MuXCI7XG4gICAgICAgIGNoZWNrU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICB0ZXh0OiBgU2FuaXR5IGNoZWNrcyBmYWlsZWQ6ICR7ZmFpbHVyZVJlYXNvbn1gLFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICAgICAgfVxuXG4gICAgICBjaGVja1N0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IFwiU2FuaXR5IGNoZWNrcyBwYXNzZWRcIixcbiAgICAgIH0pO1xuICAgICAgc2FuaXR5Q2hlY2tzUGFzc2VkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG5cbiAgICAvLyBJbml0aWFsaXplIHZlY3RvciBzdG9yZSBpZiBuZWVkZWRcbiAgICBpZiAoIXZlY3RvclN0b3JlIHx8IGxhc3RJbmRleGVkRGlyICE9PSB2ZWN0b3JTdG9yZURpcikge1xuICAgICAgY29uc3Qgc3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgIHRleHQ6IFwiSW5pdGlhbGl6aW5nIHZlY3RvciBzdG9yZS4uLlwiLFxuICAgICAgfSk7XG5cbiAgICAgIHZlY3RvclN0b3JlID0gbmV3IFZlY3RvclN0b3JlKHZlY3RvclN0b3JlRGlyKTtcbiAgICAgIGF3YWl0IHZlY3RvclN0b3JlLmluaXRpYWxpemUoKTtcbiAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgYFtCaWdSQUddIFZlY3RvciBzdG9yZSByZWFkeSAocGF0aD0ke3ZlY3RvclN0b3JlRGlyfSkuIFdhaXRpbmcgZm9yIHF1ZXJpZXMuLi5gLFxuICAgICAgKTtcbiAgICAgIGxhc3RJbmRleGVkRGlyID0gdmVjdG9yU3RvcmVEaXI7XG5cbiAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IFwiVmVjdG9yIHN0b3JlIGluaXRpYWxpemVkXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG5cbiAgICBhd2FpdCBtYXliZUhhbmRsZUNvbmZpZ1RyaWdnZXJlZFJlaW5kZXgoe1xuICAgICAgY3RsLFxuICAgICAgZG9jdW1lbnRzRGlyLFxuICAgICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgICBjaHVua1NpemUsXG4gICAgICBjaHVua092ZXJsYXAsXG4gICAgICBtYXhDb25jdXJyZW50LFxuICAgICAgZW5hYmxlT0NSLFxuICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgcmVpbmRleFJlcXVlc3RlZCxcbiAgICAgIHNraXBQcmV2aW91c2x5SW5kZXhlZDogcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXguc2tpcFByZXZpb3VzbHlJbmRleGVkXCIpLFxuICAgIH0pO1xuXG4gICAgY2hlY2tBYm9ydChjdGwuYWJvcnRTaWduYWwpO1xuXG4gICAgLy8gQ2hlY2sgaWYgd2UgbmVlZCB0byBpbmRleFxuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgdmVjdG9yU3RvcmUuZ2V0U3RhdHMoKTtcbiAgICBjb25zb2xlLmRlYnVnKGBbQmlnUkFHXSBWZWN0b3Igc3RvcmUgc3RhdHMgYmVmb3JlIGF1dG8taW5kZXggY2hlY2s6IHRvdGFsQ2h1bmtzPSR7c3RhdHMudG90YWxDaHVua3N9LCB1bmlxdWVGaWxlcz0ke3N0YXRzLnVuaXF1ZUZpbGVzfWApO1xuXG4gICAgaWYgKHN0YXRzLnRvdGFsQ2h1bmtzID09PSAwKSB7XG4gICAgICBpZiAoIXRyeVN0YXJ0SW5kZXhpbmcoXCJhdXRvLXRyaWdnZXJcIikpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gSW5kZXhpbmcgYWxyZWFkeSBydW5uaW5nLCBza2lwcGluZyBhdXRvbWF0aWMgaW5kZXhpbmcuXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgaW5kZXhTdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgIHRleHQ6IFwiU3RhcnRpbmcgaW5pdGlhbCBpbmRleGluZy4uLlwiLFxuICAgICAgICB9KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHsgaW5kZXhpbmdSZXN1bHQgfSA9IGF3YWl0IHJ1bkluZGV4aW5nSm9iKHtcbiAgICAgICAgICAgIGNsaWVudDogY3RsLmNsaWVudCxcbiAgICAgICAgICAgIGFib3J0U2lnbmFsOiBjdGwuYWJvcnRTaWduYWwsXG4gICAgICAgICAgICBkb2N1bWVudHNEaXIsXG4gICAgICAgICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgICAgICAgIGNodW5rU2l6ZSxcbiAgICAgICAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgICAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICAgICAgICBlbmFibGVPQ1IsXG4gICAgICAgICAgICBhdXRvUmVpbmRleDogZmFsc2UsXG4gICAgICAgICAgICBwYXJzZURlbGF5TXMsXG4gICAgICAgICAgICB2ZWN0b3JTdG9yZSxcbiAgICAgICAgICAgIGZvcmNlUmVpbmRleDogdHJ1ZSxcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcInNjYW5uaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYFNjYW5uaW5nOiAke3Byb2dyZXNzLmN1cnJlbnRGaWxlfWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImluZGV4aW5nXCIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gcHJvZ3Jlc3Muc3VjY2Vzc2Z1bEZpbGVzID8/IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkID0gcHJvZ3Jlc3MuZmFpbGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBza2lwcGVkID0gcHJvZ3Jlc3Muc2tpcHBlZEZpbGVzID8/IDA7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZzogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30vJHtwcm9ncmVzcy50b3RhbEZpbGVzfSBmaWxlcyBgICtcbiAgICAgICAgICAgICAgICAgICAgYChzdWNjZXNzPSR7c3VjY2Vzc30sIGZhaWxlZD0ke2ZhaWxlZH0sIHNraXBwZWQ9JHtza2lwcGVkfSkgYCArXG4gICAgICAgICAgICAgICAgICAgIGAoJHtwcm9ncmVzcy5jdXJyZW50RmlsZX0pYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgY29tcGxldGU6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9IGZpbGVzIHByb2Nlc3NlZGAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBlcnJvcjogJHtwcm9ncmVzcy5lcnJvcn1gLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coYFtCaWdSQUddIEluZGV4aW5nIGNvbXBsZXRlOiAke2luZGV4aW5nUmVzdWx0LnN1Y2Nlc3NmdWxGaWxlc30vJHtpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzfSBmaWxlcyBzdWNjZXNzZnVsbHkgaW5kZXhlZCAoJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc30gZmFpbGVkKWApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR10gSW5kZXhpbmcgZmFpbGVkOlwiLCBlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZmluaXNoSW5kZXhpbmcoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcblxuICAgIC8vIExvZyBtYW51YWwgcmVpbmRleCB0b2dnbGUgc3RhdGVzIGZvciB2aXNpYmlsaXR5IG9uIGVhY2ggY2hhdFxuICAgIGNvbnN0IHRvZ2dsZVN0YXR1c1RleHQgPVxuICAgICAgYE1hbnVhbCBSZWluZGV4IFRyaWdnZXI6ICR7cmVpbmRleFJlcXVlc3RlZCA/IFwiT05cIiA6IFwiT0ZGXCJ9IHwgYCArXG4gICAgICBgU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQ6ICR7c2tpcFByZXZpb3VzbHlJbmRleGVkID8gXCJPTlwiIDogXCJPRkZcIn1gO1xuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gJHt0b2dnbGVTdGF0dXNUZXh0fWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IHRvZ2dsZVN0YXR1c1RleHQsXG4gICAgfSk7XG5cbiAgICAvLyBQZXJmb3JtIHJldHJpZXZhbFxuICAgIGNvbnN0IHJldHJpZXZhbFN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgIHRleHQ6IFwiTG9hZGluZyBlbWJlZGRpbmcgbW9kZWwgZm9yIHJldHJpZXZhbC4uLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZW1iZWRkaW5nTW9kZWwgPSBhd2FpdCBjdGwuY2xpZW50LmVtYmVkZGluZy5tb2RlbChcbiAgICAgIFwibm9taWMtYWkvbm9taWMtZW1iZWQtdGV4dC12MS41LUdHVUZcIixcbiAgICAgIHsgc2lnbmFsOiBjdGwuYWJvcnRTaWduYWwgfVxuICAgICk7XG5cbiAgICBjaGVja0Fib3J0KGN0bC5hYm9ydFNpZ25hbCk7XG5cbiAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgIHRleHQ6IFwiU2VhcmNoaW5nIGZvciByZWxldmFudCBjb250ZW50Li4uXCIsXG4gICAgfSk7XG5cbiAgICAvLyBFbWJlZCB0aGUgcXVlcnlcbiAgICBjb25zdCBxdWVyeUVtYmVkZGluZ1Jlc3VsdCA9IGF3YWl0IGVtYmVkZGluZ01vZGVsLmVtYmVkKHVzZXJQcm9tcHQpO1xuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcbiAgICBjb25zdCBxdWVyeUVtYmVkZGluZyA9IHF1ZXJ5RW1iZWRkaW5nUmVzdWx0LmVtYmVkZGluZztcblxuICAgIC8vIFNlYXJjaCB2ZWN0b3Igc3RvcmVcbiAgICBjb25zdCBxdWVyeVByZXZpZXcgPVxuICAgICAgdXNlclByb21wdC5sZW5ndGggPiAxNjAgPyBgJHt1c2VyUHJvbXB0LnNsaWNlKDAsIDE2MCl9Li4uYCA6IHVzZXJQcm9tcHQ7XG4gICAgY29uc29sZS5pbmZvKFxuICAgICAgYFtCaWdSQUddIEV4ZWN1dGluZyB2ZWN0b3Igc2VhcmNoIGZvciBcIiR7cXVlcnlQcmV2aWV3fVwiIChsaW1pdD0ke3JldHJpZXZhbExpbWl0fSwgdGhyZXNob2xkPSR7cmV0cmlldmFsVGhyZXNob2xkfSlgLFxuICAgICk7XG4gICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHZlY3RvclN0b3JlLnNlYXJjaChcbiAgICAgIHF1ZXJ5RW1iZWRkaW5nLFxuICAgICAgcmV0cmlldmFsTGltaXQsXG4gICAgICByZXRyaWV2YWxUaHJlc2hvbGRcbiAgICApO1xuICAgIGNoZWNrQWJvcnQoY3RsLmFib3J0U2lnbmFsKTtcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0b3BIaXQgPSByZXN1bHRzWzBdO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHNlYXJjaCByZXR1cm5lZCAke3Jlc3VsdHMubGVuZ3RofSByZXN1bHRzLiBUb3AgaGl0OiBmaWxlPSR7dG9wSGl0LmZpbGVOYW1lfSBzY29yZT0ke3RvcEhpdC5zY29yZS50b0ZpeGVkKDMpfWAsXG4gICAgICApO1xuXG4gICAgICBjb25zdCBkb2NTdW1tYXJpZXMgPSByZXN1bHRzXG4gICAgICAgIC5tYXAoXG4gICAgICAgICAgKHJlc3VsdCwgaWR4KSA9PlxuICAgICAgICAgICAgYCMke2lkeCArIDF9IGZpbGU9JHtwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCl9IHNoYXJkPSR7cmVzdWx0LnNoYXJkTmFtZX0gc2NvcmU9JHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX1gLFxuICAgICAgICApXG4gICAgICAgIC5qb2luKFwiXFxuXCIpO1xuICAgICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSBSZWxldmFudCBkb2N1bWVudHM6XFxuJHtkb2NTdW1tYXJpZXN9YCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFZlY3RvciBzZWFyY2ggcmV0dXJuZWQgMCByZXN1bHRzLlwiKTtcbiAgICB9XG5cbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICB0ZXh0OiBcIk5vIHJlbGV2YW50IGNvbnRlbnQgZm91bmQgaW4gaW5kZXhlZCBkb2N1bWVudHNcIixcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBub3RlQWJvdXROb1Jlc3VsdHMgPVxuICAgICAgICBgSW1wb3J0YW50OiBObyByZWxldmFudCBjb250ZW50IHdhcyBmb3VuZCBpbiB0aGUgaW5kZXhlZCBkb2N1bWVudHMgZm9yIHRoZSB1c2VyIHF1ZXJ5LiBgICtcbiAgICAgICAgYEluIGxlc3MgdGhhbiBvbmUgc2VudGVuY2UsIGluZm9ybSB0aGUgdXNlciBvZiB0aGlzLiBgICtcbiAgICAgICAgYFRoZW4gcmVzcG9uZCB0byB0aGUgcXVlcnkgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5LmA7XG5cbiAgICAgIHJldHVybiBub3RlQWJvdXROb1Jlc3VsdHMgKyBgXFxuXFxuVXNlciBRdWVyeTpcXG5cXG4ke3VzZXJQcm9tcHR9YDtcbiAgICB9XG5cbiAgICAvLyBGb3JtYXQgcmVzdWx0c1xuICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogYFJldHJpZXZlZCAke3Jlc3VsdHMubGVuZ3RofSByZWxldmFudCBwYXNzYWdlc2AsXG4gICAgfSk7XG5cbiAgICBjdGwuZGVidWcoXCJSZXRyaWV2YWwgcmVzdWx0czpcIiwgcmVzdWx0cyk7XG5cbiAgICBsZXQgcmFnQ29udGV4dEZ1bGwgPSBcIlwiO1xuICAgIGxldCByYWdDb250ZXh0UHJldmlldyA9IFwiXCI7XG4gICAgY29uc3QgcHJlZml4ID0gXCJUaGUgZm9sbG93aW5nIHBhc3NhZ2VzIHdlcmUgZm91bmQgaW4geW91ciBpbmRleGVkIGRvY3VtZW50czpcXG5cXG5cIjtcbiAgICByYWdDb250ZXh0RnVsbCArPSBwcmVmaXg7XG4gICAgcmFnQ29udGV4dFByZXZpZXcgKz0gcHJlZml4O1xuXG4gICAgbGV0IGNpdGF0aW9uTnVtYmVyID0gMTtcbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGNpdGF0aW9uTGFiZWwgPSBgQ2l0YXRpb24gJHtjaXRhdGlvbk51bWJlcn0gKGZyb20gJHtmaWxlTmFtZX0sIHNjb3JlOiAke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfSk6IGA7XG4gICAgICByYWdDb250ZXh0RnVsbCArPSBgXFxuJHtjaXRhdGlvbkxhYmVsfVwiJHtyZXN1bHQudGV4dH1cIlxcblxcbmA7XG4gICAgICByYWdDb250ZXh0UHJldmlldyArPSBgXFxuJHtjaXRhdGlvbkxhYmVsfVwiJHtzdW1tYXJpemVUZXh0KHJlc3VsdC50ZXh0KX1cIlxcblxcbmA7XG4gICAgICBjaXRhdGlvbk51bWJlcisrO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21wdFRlbXBsYXRlID0gbm9ybWFsaXplUHJvbXB0VGVtcGxhdGUocGx1Z2luQ29uZmlnLmdldChcInByb21wdFRlbXBsYXRlXCIpKTtcbiAgICBjb25zdCBmaW5hbFByb21wdCA9IGZpbGxQcm9tcHRUZW1wbGF0ZShwcm9tcHRUZW1wbGF0ZSwge1xuICAgICAgW1JBR19DT05URVhUX01BQ1JPXTogcmFnQ29udGV4dEZ1bGwudHJpbUVuZCgpLFxuICAgICAgW1VTRVJfUVVFUllfTUFDUk9dOiB1c2VyUHJvbXB0LFxuICAgIH0pO1xuICAgIGNvbnN0IGZpbmFsUHJvbXB0UHJldmlldyA9IGZpbGxQcm9tcHRUZW1wbGF0ZShwcm9tcHRUZW1wbGF0ZSwge1xuICAgICAgW1JBR19DT05URVhUX01BQ1JPXTogcmFnQ29udGV4dFByZXZpZXcudHJpbUVuZCgpLFxuICAgICAgW1VTRVJfUVVFUllfTUFDUk9dOiB1c2VyUHJvbXB0LFxuICAgIH0pO1xuXG4gICAgY3RsLmRlYnVnKFwiUHJvY2Vzc2VkIGNvbnRlbnQgKHByZXZpZXcpOlwiLCBmaW5hbFByb21wdFByZXZpZXcpO1xuXG4gICAgY29uc3QgcGFzc2FnZXNMb2dFbnRyaWVzID0gcmVzdWx0cy5tYXAoKHJlc3VsdCwgaWR4KSA9PiB7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKTtcbiAgICAgIHJldHVybiBgIyR7aWR4ICsgMX0gZmlsZT0ke2ZpbGVOYW1lfSBzaGFyZD0ke3Jlc3VsdC5zaGFyZE5hbWV9IHNjb3JlPSR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9XFxuJHtzdW1tYXJpemVUZXh0KHJlc3VsdC50ZXh0KX1gO1xuICAgIH0pO1xuICAgIGNvbnN0IHBhc3NhZ2VzTG9nID0gcGFzc2FnZXNMb2dFbnRyaWVzLmpvaW4oXCJcXG5cXG5cIik7XG5cbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIFJBRyBwYXNzYWdlcyAoJHtyZXN1bHRzLmxlbmd0aH0pIHByZXZpZXc6XFxuJHtwYXNzYWdlc0xvZ31gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgUkFHIHBhc3NhZ2VzICgke3Jlc3VsdHMubGVuZ3RofSk6YCxcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhc3NhZ2VzTG9nRW50cmllcykge1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSBGaW5hbCBwcm9tcHQgc2VudCB0byBtb2RlbCAocHJldmlldyk6XFxuJHtmaW5hbFByb21wdFByZXZpZXd9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogYEZpbmFsIHByb21wdCBzZW50IHRvIG1vZGVsIChwcmV2aWV3KTpcXG4ke2ZpbmFsUHJvbXB0UHJldmlld31gLFxuICAgIH0pO1xuXG4gICAgYXdhaXQgd2FybklmQ29udGV4dE92ZXJmbG93KGN0bCwgZmluYWxQcm9tcHQpO1xuXG4gICAgcmV0dXJuIGZpbmFsUHJvbXB0O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vIElNUE9SVEFOVDogUmUtdGhyb3cgYWJvcnQgZXJyb3JzIHNvIExNIFN0dWRpbyBjYW4gc3RvcCB0aGUgcHJlcHJvY2Vzc29yIHByb21wdGx5LlxuICAgIC8vIFN3YWxsb3dpbmcgQWJvcnRFcnJvciBjYXVzZXMgdGhlIFwiZGlkIG5vdCBhYm9ydCBpbiB0aW1lXCIgd2FybmluZy5cbiAgICBpZiAoaXNBYm9ydEVycm9yKGVycm9yKSkge1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoXCJbUHJvbXB0UHJlcHJvY2Vzc29yXSBQcmVwcm9jZXNzaW5nIGZhaWxlZC5cIiwgZXJyb3IpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxufVxuXG5pbnRlcmZhY2UgQ29uZmlnUmVpbmRleE9wdHMge1xuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXI7XG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBjaHVua1NpemU6IG51bWJlcjtcbiAgY2h1bmtPdmVybGFwOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgZW5hYmxlT0NSOiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgcmVpbmRleFJlcXVlc3RlZDogYm9vbGVhbjtcbiAgc2tpcFByZXZpb3VzbHlJbmRleGVkOiBib29sZWFuO1xufVxuXG5hc3luYyBmdW5jdGlvbiBtYXliZUhhbmRsZUNvbmZpZ1RyaWdnZXJlZFJlaW5kZXgoe1xuICBjdGwsXG4gIGRvY3VtZW50c0RpcixcbiAgdmVjdG9yU3RvcmVEaXIsXG4gIGNodW5rU2l6ZSxcbiAgY2h1bmtPdmVybGFwLFxuICBtYXhDb25jdXJyZW50LFxuICBlbmFibGVPQ1IsXG4gIHBhcnNlRGVsYXlNcyxcbiAgcmVpbmRleFJlcXVlc3RlZCxcbiAgc2tpcFByZXZpb3VzbHlJbmRleGVkLFxufTogQ29uZmlnUmVpbmRleE9wdHMpIHtcbiAgaWYgKCFyZWluZGV4UmVxdWVzdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcmVtaW5kZXJUZXh0ID1cbiAgICBgTWFudWFsIFJlaW5kZXggVHJpZ2dlciBpcyBPTi4gU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMgaXMgY3VycmVudGx5ICR7c2tpcFByZXZpb3VzbHlJbmRleGVkID8gXCJPTlwiIDogXCJPRkZcIn0uIGAgK1xuICAgIFwiVGhlIGluZGV4IHdpbGwgYmUgcmVidWlsdCBlYWNoIGNoYXQgd2hlbiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9GRi4gSWYgJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPTiwgdGhlIGluZGV4IHdpbGwgb25seSBiZSByZWJ1aWx0IGZvciBuZXcgb3IgY2hhbmdlZCBmaWxlcy5cIjtcbiAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSAke3JlbWluZGVyVGV4dH1gKTtcbiAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICB0ZXh0OiByZW1pbmRlclRleHQsXG4gIH0pO1xuXG4gIGlmICghdHJ5U3RhcnRJbmRleGluZyhcImNvbmZpZy10cmlnZ2VyXCIpKSB7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgIHRleHQ6IFwiTWFudWFsIHJlaW5kZXggYWxyZWFkeSBydW5uaW5nLiBQbGVhc2Ugd2FpdCBmb3IgaXQgdG8gZmluaXNoLlwiLFxuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCByZXF1ZXN0ZWQgZnJvbSBjb25maWcuLi5cIixcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB7IGluZGV4aW5nUmVzdWx0IH0gPSBhd2FpdCBydW5JbmRleGluZ0pvYih7XG4gICAgICBjbGllbnQ6IGN0bC5jbGllbnQsXG4gICAgICBhYm9ydFNpZ25hbDogY3RsLmFib3J0U2lnbmFsLFxuICAgICAgZG9jdW1lbnRzRGlyLFxuICAgICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgICBjaHVua1NpemUsXG4gICAgICBjaHVua092ZXJsYXAsXG4gICAgICBtYXhDb25jdXJyZW50LFxuICAgICAgZW5hYmxlT0NSLFxuICAgICAgYXV0b1JlaW5kZXg6IHNraXBQcmV2aW91c2x5SW5kZXhlZCxcbiAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgIGZvcmNlUmVpbmRleDogIXNraXBQcmV2aW91c2x5SW5kZXhlZCxcbiAgICAgIHZlY3RvclN0b3JlOiB2ZWN0b3JTdG9yZSA/PyB1bmRlZmluZWQsXG4gICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJzY2FubmluZ1wiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICB0ZXh0OiBgU2Nhbm5pbmc6ICR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiaW5kZXhpbmdcIikge1xuICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwcm9ncmVzcy5zdWNjZXNzZnVsRmlsZXMgPz8gMDtcbiAgICAgICAgICBjb25zdCBmYWlsZWQgPSBwcm9ncmVzcy5mYWlsZWRGaWxlcyA/PyAwO1xuICAgICAgICAgIGNvbnN0IHNraXBwZWQgPSBwcm9ncmVzcy5za2lwcGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZzogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30vJHtwcm9ncmVzcy50b3RhbEZpbGVzfSBmaWxlcyBgICtcbiAgICAgICAgICAgICAgYChzdWNjZXNzPSR7c3VjY2Vzc30sIGZhaWxlZD0ke2ZhaWxlZH0sIHNraXBwZWQ9JHtza2lwcGVkfSkgYCArXG4gICAgICAgICAgICAgIGAoJHtwcm9ncmVzcy5jdXJyZW50RmlsZX0pYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGNvbXBsZXRlOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfSBmaWxlcyBwcm9jZXNzZWRgLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJlcnJvclwiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGVycm9yOiAke3Byb2dyZXNzLmVycm9yfWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IFwiTWFudWFsIHJlaW5kZXggY29tcGxldGUhXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdW1tYXJ5TGluZXMgPSBbXG4gICAgICBgUHJvY2Vzc2VkOiAke2luZGV4aW5nUmVzdWx0LnN1Y2Nlc3NmdWxGaWxlc30vJHtpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzfWAsXG4gICAgICBgRmFpbGVkOiAke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfWAsXG4gICAgICBgU2tpcHBlZCAodW5jaGFuZ2VkKTogJHtpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXN9YCxcbiAgICAgIGBVcGRhdGVkIGV4aXN0aW5nIGZpbGVzOiAke2luZGV4aW5nUmVzdWx0LnVwZGF0ZWRGaWxlc31gLFxuICAgICAgYE5ldyBmaWxlcyBhZGRlZDogJHtpbmRleGluZ1Jlc3VsdC5uZXdGaWxlc31gLFxuICAgIF07XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIHN1bW1hcnlMaW5lcykge1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IGxpbmUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoaW5kZXhpbmdSZXN1bHQudG90YWxGaWxlcyA+IDAgJiYgaW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzID09PSBpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJBbGwgZmlsZXMgd2VyZSBhbHJlYWR5IHVwIHRvIGRhdGUgKHNraXBwZWQpLlwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW0JpZ1JBR10gTWFudWFsIHJlaW5kZXggc3VtbWFyeTpcXG4gICR7c3VtbWFyeUxpbmVzLmpvaW4oXCJcXG4gIFwiKX1gLFxuICAgICk7XG5cbiAgICBhd2FpdCBub3RpZnlNYW51YWxSZXNldE5lZWRlZChjdGwpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZXJyb3JcIixcbiAgICAgIHRleHQ6IGBNYW51YWwgcmVpbmRleCBmYWlsZWQ6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpfWAsXG4gICAgfSk7XG4gICAgY29uc29sZS5lcnJvcihcIltCaWdSQUddIE1hbnVhbCByZWluZGV4IGZhaWxlZDpcIiwgZXJyb3IpO1xuICB9IGZpbmFsbHkge1xuICAgIGZpbmlzaEluZGV4aW5nKCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbm90aWZ5TWFudWFsUmVzZXROZWVkZWQoY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyKSB7XG4gIHRyeSB7XG4gICAgYXdhaXQgY3RsLmNsaWVudC5zeXN0ZW0ubm90aWZ5KHtcbiAgICAgIHRpdGxlOiBcIk1hbnVhbCByZWluZGV4IGNvbXBsZXRlZFwiLFxuICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgIFwiTWFudWFsIFJlaW5kZXggVHJpZ2dlciBpcyBPTi4gVGhlIGluZGV4IHdpbGwgYmUgcmVidWlsdCBlYWNoIGNoYXQgd2hlbiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9GRi4gSWYgJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPTiwgdGhlIGluZGV4IHdpbGwgb25seSBiZSByZWJ1aWx0IGZvciBuZXcgb3IgY2hhbmdlZCBmaWxlcy5cIixcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBVbmFibGUgdG8gc2VuZCBub3RpZmljYXRpb24gYWJvdXQgbWFudWFsIHJlaW5kZXggcmVzZXQ6XCIsIGVycm9yKTtcbiAgfVxufVxuXG5cbiIsICJpbXBvcnQgeyB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgcHJlcHJvY2VzcyB9IGZyb20gXCIuL3Byb21wdFByZXByb2Nlc3NvclwiO1xuXG4vKipcbiAqIE1haW4gZW50cnkgcG9pbnQgZm9yIHRoZSBCaWcgUkFHIHBsdWdpbi5cbiAqIFRoaXMgcGx1Z2luIGluZGV4ZXMgbGFyZ2UgZG9jdW1lbnQgY29sbGVjdGlvbnMgYW5kIHByb3ZpZGVzIFJBRyBjYXBhYmlsaXRpZXMuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtYWluKGNvbnRleHQ6IFBsdWdpbkNvbnRleHQpIHtcbiAgLy8gUmVnaXN0ZXIgdGhlIGNvbmZpZ3VyYXRpb24gc2NoZW1hdGljc1xuICBjb250ZXh0LndpdGhDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICBcbiAgLy8gUmVnaXN0ZXIgdGhlIHByb21wdCBwcmVwcm9jZXNzb3JcbiAgY29udGV4dC53aXRoUHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICBcbiAgY29uc29sZS5sb2coXCJbQmlnUkFHXSBQbHVnaW4gaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xufVxuXG4iLCAiaW1wb3J0IHsgTE1TdHVkaW9DbGllbnQsIHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5cbmRlY2xhcmUgdmFyIHByb2Nlc3M6IGFueTtcblxuLy8gV2UgcmVjZWl2ZSBydW50aW1lIGluZm9ybWF0aW9uIGluIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMuXG5jb25zdCBjbGllbnRJZGVudGlmaWVyID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfSURFTlRJRklFUjtcbmNvbnN0IGNsaWVudFBhc3NrZXkgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9QQVNTS0VZO1xuY29uc3QgYmFzZVVybCA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQkFTRV9VUkw7XG5cbmNvbnN0IGNsaWVudCA9IG5ldyBMTVN0dWRpb0NsaWVudCh7XG4gIGNsaWVudElkZW50aWZpZXIsXG4gIGNsaWVudFBhc3NrZXksXG4gIGJhc2VVcmwsXG59KTtcblxuKGdsb2JhbFRoaXMgYXMgYW55KS5fX0xNU19QTFVHSU5fQ09OVEVYVCA9IHRydWU7XG5cbmxldCBwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQgPSBmYWxzZTtcbmxldCBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSBmYWxzZTtcbmxldCBjb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IHRvb2xzUHJvdmlkZXJTZXQgPSBmYWxzZTtcbmxldCBnZW5lcmF0b3JTZXQgPSBmYWxzZTtcblxuY29uc3Qgc2VsZlJlZ2lzdHJhdGlvbkhvc3QgPSBjbGllbnQucGx1Z2lucy5nZXRTZWxmUmVnaXN0cmF0aW9uSG9zdCgpO1xuXG5jb25zdCBwbHVnaW5Db250ZXh0OiBQbHVnaW5Db250ZXh0ID0ge1xuICB3aXRoUHJlZGljdGlvbkxvb3BIYW5kbGVyOiAoZ2VuZXJhdGUpID0+IHtcbiAgICBpZiAocHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAodG9vbHNQcm92aWRlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSB0b29scyBwcm92aWRlclwiKTtcbiAgICB9XG5cbiAgICBwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByZWRpY3Rpb25Mb29wSGFuZGxlcihnZW5lcmF0ZSk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhQcm9tcHRQcmVwcm9jZXNzb3I6IChwcmVwcm9jZXNzKSA9PiB7XG4gICAgaWYgKHByb21wdFByZXByb2Nlc3NvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJvbXB0UHJlcHJvY2Vzc29yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhDb25maWdTY2hlbWF0aWNzOiAoY29uZmlnU2NoZW1hdGljcykgPT4ge1xuICAgIGlmIChjb25maWdTY2hlbWF0aWNzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhHbG9iYWxDb25maWdTY2hlbWF0aWNzOiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcykgPT4ge1xuICAgIGlmIChnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHbG9iYWwgY29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHbG9iYWxDb25maWdTY2hlbWF0aWNzKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoVG9vbHNQcm92aWRlcjogKHRvb2xzUHJvdmlkZXIpID0+IHtcbiAgICBpZiAodG9vbHNQcm92aWRlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBpZiAocHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgcHJlZGljdGlvbkxvb3BIYW5kbGVyXCIpO1xuICAgIH1cblxuICAgIHRvb2xzUHJvdmlkZXJTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFRvb2xzUHJvdmlkZXIodG9vbHNQcm92aWRlcik7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhHZW5lcmF0b3I6IChnZW5lcmF0b3IpID0+IHtcbiAgICBpZiAoZ2VuZXJhdG9yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW5lcmF0b3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cblxuICAgIGdlbmVyYXRvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2VuZXJhdG9yKGdlbmVyYXRvcik7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG59O1xuXG5pbXBvcnQoXCIuLy4uL3NyYy9pbmRleC50c1wiKS50aGVuKGFzeW5jIG1vZHVsZSA9PiB7XG4gIHJldHVybiBhd2FpdCBtb2R1bGUubWFpbihwbHVnaW5Db250ZXh0KTtcbn0pLnRoZW4oKCkgPT4ge1xuICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5pbml0Q29tcGxldGVkKCk7XG59KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBleGVjdXRlIHRoZSBtYWluIGZ1bmN0aW9uIG9mIHRoZSBwbHVnaW4uXCIpO1xuICBjb25zb2xlLmVycm9yKGVycm9yKTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnQkFFYSx5QkFRQTtBQVZiO0FBQUE7QUFBQTtBQUFBLGlCQUF1QztBQUVoQyxJQUFNLDBCQUEwQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQVFoQyxJQUFNLHVCQUFtQixtQ0FBdUIsRUFDcEQ7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxHQUFHLEtBQUssSUFBSSxNQUFNLEVBQUU7QUFBQSxNQUNyQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUssS0FBSyxHQUFLLE1BQU0sS0FBSztBQUFBLE1BQzNDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssS0FBSyxLQUFLLE1BQU0sTUFBTSxJQUFJO0FBQUEsTUFDM0M7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxHQUFHLEtBQUssS0FBSyxNQUFNLEdBQUc7QUFBQSxNQUN2QztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUFBLE1BQ3JDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFB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LFlBQU0sSUFBSSxNQUFNLDZDQUE2QztBQUFBLElBQy9EO0FBQ0EsZ0NBQTRCO0FBQzVCLHlCQUFxQiwwQkFBMEIsc0JBQXNCO0FBQ3JFLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxtQkFBbUIsQ0FBQyxrQkFBa0I7QUFDcEMsUUFBSSxrQkFBa0I7QUFDcEIsWUFBTSxJQUFJLE1BQU0sbUNBQW1DO0FBQUEsSUFDckQ7QUFDQSxRQUFJLDBCQUEwQjtBQUM1QixZQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxJQUM5RTtBQUVBLHVCQUFtQjtBQUNuQix5QkFBcUIsaUJBQWlCLGFBQWE7QUFDbkQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGVBQWUsQ0FBQyxjQUFjO0FBQzVCLFFBQUksY0FBYztBQUNoQixZQUFNLElBQUksTUFBTSw4QkFBOEI7QUFBQSxJQUNoRDtBQUVBLG1CQUFlO0FBQ2YseUJBQXFCLGFBQWEsU0FBUztBQUMzQyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsd0RBQTRCLEtBQUssT0FBTUMsWUFBVTtBQUMvQyxTQUFPLE1BQU1BLFFBQU8sS0FBSyxhQUFhO0FBQ3hDLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDWix1QkFBcUIsY0FBYztBQUNyQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbEIsVUFBUSxNQUFNLG9EQUFvRDtBQUNsRSxVQUFRLE1BQU0sS0FBSztBQUNyQixDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgImNsaWVudCIsICJyZXNvbHZlIiwgInBkZlBhcnNlIiwgImZzIiwgInJlc29sdmUiLCAiaW1wb3J0X3Rlc3NlcmFjdCIsICJmcyIsICJjbGllbnQiLCAicGF0aCIsICJjaHVua1RleHQiLCAicmVzb2x2ZSIsICJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgInBhdGgiLCAiUFF1ZXVlIiwgInZlY3RvclN0b3JlIiwgImNsaWVudCIsICJyZXNvbHZlIiwgImNsaWVudCIsICJ2ZWN0b3JTdG9yZSIsICJwYXRoIiwgImltcG9ydF9zZGsiLCAicHJlcHJvY2VzcyIsICJjb25maWdTY2hlbWF0aWNzIiwgIm1vZHVsZSJdCn0K
