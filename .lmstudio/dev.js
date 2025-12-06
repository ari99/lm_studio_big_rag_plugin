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
var import_vectra, path, fs, VectorStore;
var init_vectorStore = __esm({
  "src/vectorstore/vectorStore.ts"() {
    "use strict";
    import_vectra = require("vectra");
    path = __toESM(require("path"));
    fs = __toESM(require("fs"));
    VectorStore = class {
      constructor(dbPath) {
        this.index = null;
        this.updateMutex = Promise.resolve();
        this.dbPath = path.resolve(dbPath);
        this.indexPath = this.dbPath;
      }
      async resolveIndexPath() {
        if (await this.pathContainsIndex(this.dbPath)) {
          return this.dbPath;
        }
        const nestedVectraPath = path.join(this.dbPath, "vectra_index");
        if (await this.pathContainsIndex(nestedVectraPath)) {
          return nestedVectraPath;
        }
        const trimmedDbPath = this.dbPath.replace(/[\\/]+$/, "");
        if (path.basename(trimmedDbPath) === "vectra_index") {
          return this.dbPath;
        }
        return nestedVectraPath;
      }
      async pathContainsIndex(targetDir) {
        try {
          const indexFile = path.join(targetDir, "index.json");
          await fs.promises.access(indexFile);
          return true;
        } catch {
          return false;
        }
      }
      /**
       * Initialize the vector store
       */
      async initialize() {
        try {
          this.indexPath = await this.resolveIndexPath();
          await fs.promises.mkdir(this.indexPath, { recursive: true });
          this.index = new import_vectra.LocalIndex(this.indexPath);
          if (!await this.index.isIndexCreated()) {
            await this.index.createIndex();
          }
          console.log("Vector store initialized successfully");
        } catch (error) {
          console.error("Error initializing vector store:", error);
          throw error;
        }
      }
      /**
       * Add document chunks to the vector store
       * Uses a mutex to prevent concurrent updates
       */
      async addChunks(chunks) {
        if (!this.index) {
          throw new Error("Vector store not initialized");
        }
        if (chunks.length === 0) {
          return;
        }
        this.updateMutex = this.updateMutex.then(async () => {
          try {
            await this.index.beginUpdate();
            for (const chunk of chunks) {
              await this.index.upsertItem({
                id: chunk.id,
                vector: chunk.vector,
                metadata: {
                  text: chunk.text,
                  filePath: chunk.filePath,
                  fileName: chunk.fileName,
                  fileHash: chunk.fileHash,
                  chunkIndex: chunk.chunkIndex,
                  ...chunk.metadata
                }
              });
            }
            await this.index.endUpdate();
            console.log(`Added ${chunks.length} chunks to vector store`);
          } catch (error) {
            console.error("Error adding chunks to vector store:", error);
            try {
              await this.index.endUpdate();
            } catch (e) {
            }
            throw error;
          }
        });
        return this.updateMutex;
      }
      /**
       * Search for similar chunks
       */
      async search(queryVector, limit = 5, threshold = 0.5) {
        if (!this.index) {
          console.log("No index available for search");
          return [];
        }
        try {
          const results = await this.index.queryItems(queryVector, limit);
          return results.filter((result) => result.score >= threshold).map((result) => ({
            text: result.item.metadata.text,
            score: result.score,
            filePath: result.item.metadata.filePath,
            fileName: result.item.metadata.fileName,
            chunkIndex: result.item.metadata.chunkIndex,
            metadata: result.item.metadata
          }));
        } catch (error) {
          console.error("Error searching vector store:", error);
          return [];
        }
      }
      /**
       * Delete chunks for a specific file (by hash)
       * Uses a mutex to prevent concurrent updates
       */
      async deleteByFileHash(fileHash) {
        if (!this.index) {
          return;
        }
        this.updateMutex = this.updateMutex.then(async () => {
          try {
            await this.index.beginUpdate();
            const allItems = await this.index.listItems();
            for (const item of allItems) {
              if (item.metadata.fileHash === fileHash) {
                await this.index.deleteItem(item.id);
              }
            }
            await this.index.endUpdate();
            console.log(`Deleted chunks for file hash: ${fileHash}`);
          } catch (error) {
            console.error(`Error deleting chunks for file hash ${fileHash}:`, error);
            try {
              await this.index.endUpdate();
            } catch (e) {
            }
          }
        });
        return this.updateMutex;
      }
      /**
       * Check if a file (by hash) exists in the store
       */
      async hasFile(fileHash) {
        if (!this.index) {
          return false;
        }
        try {
          const allItems = await this.index.listItems();
          return allItems.some((item) => item.metadata.fileHash === fileHash);
        } catch (error) {
          console.error(`Error checking file hash ${fileHash}:`, error);
          return false;
        }
      }
      /**
       * Get a map of file paths to the set of hashes currently stored.
       */
      async getFileHashInventory() {
        const inventory = /* @__PURE__ */ new Map();
        if (!this.index) {
          return inventory;
        }
        try {
          const allItems = await this.index.listItems();
          for (const item of allItems) {
            const filePath = item.metadata.filePath;
            const fileHash = item.metadata.fileHash;
            if (!filePath || !fileHash) {
              continue;
            }
            let hashes = inventory.get(filePath);
            if (!hashes) {
              hashes = /* @__PURE__ */ new Set();
              inventory.set(filePath, hashes);
            }
            hashes.add(fileHash);
          }
          return inventory;
        } catch (error) {
          console.error("Error building file hash inventory:", error);
          return inventory;
        }
      }
      /**
       * Get statistics about the vector store
       */
      async getStats() {
        if (!this.index) {
          return { totalChunks: 0, uniqueFiles: 0 };
        }
        try {
          const allItems = await this.index.listItems();
          const uniqueHashes = new Set(
            allItems.map((item) => item.metadata.fileHash)
          );
          return {
            totalChunks: allItems.length,
            uniqueFiles: uniqueHashes.size
          };
        } catch (error) {
          console.error("Error getting stats:", error);
          return { totalChunks: 0, uniqueFiles: 0 };
        }
      }
      /**
       * Close the vector store connection
       */
      async close() {
        this.index = null;
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
async function scanDirectory(rootDir, onProgress) {
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
  await walk(rootDir);
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
        await new Promise((resolve2) => setTimeout(resolve2, 1e3 * attempt));
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
          const {
            data: { text }
          } = await worker.recognize(image.buffer);
          processedImages++;
          const cleaned = cleanText(text || "");
          if (cleaned.length > 0) {
            textParts.push(cleaned);
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
    await worker.terminate();
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
  return images.filter((image) => image.area >= OCR_MIN_IMAGE_AREA).sort((a, b) => b.area - a.area);
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
    return new Promise((resolve2, reject) => {
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
        resolve2(data);
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
var fs5, import_pdf_parse, import_tesseract, import_pngjs, MIN_TEXT_LENGTH, OCR_MAX_PAGES, OCR_MAX_IMAGES_PER_PAGE, OCR_MIN_IMAGE_AREA, OCR_IMAGE_TIMEOUT_MS, ImageDataTimeoutError, cachedPdfjsLib;
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
  return new Promise((resolve2, reject) => {
    try {
      const epub = new import_epub2.EPub(filePath);
      epub.on("error", (error) => {
        console.error(`Error parsing EPUB file ${filePath}:`, error);
        resolve2("");
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
          resolve2(
            fullText.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim()
          );
        } catch (error) {
          console.error(`Error processing EPUB chapters:`, error);
          resolve2("");
        }
      });
      epub.parse();
    } catch (error) {
      console.error(`Error initializing EPUB parser for ${filePath}:`, error);
      resolve2("");
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
  return new Promise((resolve2, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs7.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve2(hash.digest("hex")));
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
            await new Promise((resolve2) => setTimeout(resolve2, this.options.parseDelayMs));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vZmlsZVNjYW5uZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvaHRtbFBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9wZGZQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZXB1YlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9pbWFnZVBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy90ZXh0UGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2RvY3VtZW50UGFyc2VyLnRzIiwgIi4uL3NyYy91dGlscy90ZXh0Q2h1bmtlci50cyIsICIuLi9zcmMvdXRpbHMvZmlsZUhhc2gudHMiLCAiLi4vc3JjL3V0aWxzL2ZhaWxlZEZpbGVSZWdpc3RyeS50cyIsICIuLi9zcmMvaW5nZXN0aW9uL2luZGV4TWFuYWdlci50cyIsICIuLi9zcmMvaW5nZXN0aW9uL3J1bkluZGV4aW5nLnRzIiwgIi4uL3NyYy9wcm9tcHRQcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFID0gYHt7cmFnX2NvbnRleHR9fVxuXG5Vc2UgdGhlIGNpdGF0aW9ucyBhYm92ZSB0byByZXNwb25kIHRvIHRoZSB1c2VyIHF1ZXJ5LCBvbmx5IGlmIHRoZXkgYXJlIHJlbGV2YW50LiBPdGhlcndpc2UsIHJlc3BvbmQgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5IHdpdGhvdXQgdGhlbS5cblxuVXNlciBRdWVyeTpcblxue3t1c2VyX3F1ZXJ5fX1gO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hdGljcyA9IGNyZWF0ZUNvbmZpZ1NjaGVtYXRpY3MoKVxuICAuZmllbGQoXG4gICAgXCJkb2N1bWVudHNEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkRvY3VtZW50cyBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIlJvb3QgZGlyZWN0b3J5IGNvbnRhaW5pbmcgZG9jdW1lbnRzIHRvIGluZGV4LiBBbGwgc3ViZGlyZWN0b3JpZXMgd2lsbCBiZSBzY2FubmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vZG9jdW1lbnRzXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInZlY3RvclN0b3JlRGlyZWN0b3J5XCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJWZWN0b3IgU3RvcmUgRGlyZWN0b3J5XCIsXG4gICAgICBzdWJ0aXRsZTogXCJEaXJlY3Rvcnkgd2hlcmUgdGhlIHZlY3RvciBkYXRhYmFzZSB3aWxsIGJlIHN0b3JlZC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIi9wYXRoL3RvL3ZlY3Rvci9zdG9yZVwiLFxuICAgIH0sXG4gICAgXCJcIixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxMaW1pdFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgTGltaXRcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGNodW5rcyB0byByZXR1cm4gZHVyaW5nIHJldHJpZXZhbC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEsIG1heDogMjAsIHN0ZXA6IDEgfSxcbiAgICB9LFxuICAgIDUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicmV0cmlldmFsQWZmaW5pdHlUaHJlc2hvbGRcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBtaW46IDAuMCxcbiAgICAgIG1heDogMS4wLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUmV0cmlldmFsIEFmZmluaXR5IFRocmVzaG9sZFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWluaW11bSBzaW1pbGFyaXR5IHNjb3JlIGZvciBhIGNodW5rIHRvIGJlIGNvbnNpZGVyZWQgcmVsZXZhbnQuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLjAsIG1heDogMS4wLCBzdGVwOiAwLjAxIH0sXG4gICAgfSxcbiAgICAwLjUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtTaXplXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxMjgsXG4gICAgICBtYXg6IDIwNDgsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBTaXplXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTaXplIG9mIHRleHQgY2h1bmtzIGZvciBlbWJlZGRpbmcgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxMjgsIG1heDogMjA0OCwgc3RlcDogMTI4IH0sXG4gICAgfSxcbiAgICA1MTIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiY2h1bmtPdmVybGFwXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiA1MTIsXG4gICAgICBkaXNwbGF5TmFtZTogXCJDaHVuayBPdmVybGFwXCIsXG4gICAgICBzdWJ0aXRsZTogXCJPdmVybGFwIGJldHdlZW4gY29uc2VjdXRpdmUgY2h1bmtzIChpbiB0b2tlbnMpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MTIsIHN0ZXA6IDMyIH0sXG4gICAgfSxcbiAgICAxMDAsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWF4Q29uY3VycmVudEZpbGVzXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAxMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1heCBDb25jdXJyZW50IEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIG51bWJlciBvZiBmaWxlcyB0byBwcm9jZXNzIGNvbmN1cnJlbnRseSBkdXJpbmcgaW5kZXhpbmcuIFJlY29tbWVuZCAxIGZvciBsYXJnZSBQREYgZGF0YXNldHMuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxLCBtYXg6IDEwLCBzdGVwOiAxIH0sXG4gICAgfSxcbiAgICAxLFxuICApXG4gIC5maWVsZChcbiAgICBcInBhcnNlRGVsYXlNc1wiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogNTAwMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlBhcnNlciBEZWxheSAobXMpXCIsXG4gICAgICBzdWJ0aXRsZTogXCJXYWl0IHRpbWUgYmVmb3JlIHBhcnNpbmcgZWFjaCBkb2N1bWVudCAoaGVscHMgYXZvaWQgV2ViU29ja2V0IHRocm90dGxpbmcpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMCwgbWF4OiA1MDAwLCBzdGVwOiAxMDAgfSxcbiAgICB9LFxuICAgIDUwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJlbmFibGVPQ1JcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgT0NSXCIsXG4gICAgICBzdWJ0aXRsZTogXCJFbmFibGUgT0NSIGZvciBpbWFnZSBmaWxlcyBhbmQgaW1hZ2UtYmFzZWQgUERGcyB1c2luZyBMTSBTdHVkaW8ncyBidWlsdC1pbiBkb2N1bWVudCBwYXJzZXIuXCIsXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXJcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlRvZ2dsZSBPTiB0byByZXF1ZXN0IGFuIGltbWVkaWF0ZSByZWluZGV4LiBUaGUgcGx1Z2luIHJlc2V0cyB0aGlzIGFmdGVyIHJ1bm5pbmcuIFVzZSB0aGUgXHUyMDFDU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcdTIwMUQgb3B0aW9uIGJlbG93IHRvIGNvbnRyb2wgd2hldGhlciB1bmNoYW5nZWQgZmlsZXMgYXJlIHNraXBwZWQuXCIsXG4gICAgfSxcbiAgICBmYWxzZSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlNraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzXCIsXG4gICAgICBzdWJ0aXRsZTogXCJTa2lwIHVuY2hhbmdlZCBmaWxlcyBmb3IgZmFzdGVyIG1hbnVhbCBydW5zLiBPbmx5IGluZGV4ZXMgbmV3IGZpbGVzIG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgICBkZXBlbmRlbmNpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJtYW51YWxSZWluZGV4LnRyaWdnZXJcIixcbiAgICAgICAgICBjb25kaXRpb246IHsgdHlwZTogXCJlcXVhbHNcIiwgdmFsdWU6IHRydWUgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB0cnVlLFxuICApXG4gIC5maWVsZChcbiAgICBcInByb21wdFRlbXBsYXRlXCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJQcm9tcHQgVGVtcGxhdGVcIixcbiAgICAgIHN1YnRpdGxlOlxuICAgICAgICBcIlN1cHBvcnRzIHt7cmFnX2NvbnRleHR9fSAocmVxdWlyZWQpIGFuZCB7e3VzZXJfcXVlcnl9fSBtYWNyb3MgZm9yIGN1c3RvbWl6aW5nIHRoZSBmaW5hbCBwcm9tcHQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogREVGQVVMVF9QUk9NUFRfVEVNUExBVEUsXG4gICAgICBpc1BhcmFncmFwaDogdHJ1ZSxcbiAgICB9LFxuICAgIERFRkFVTFRfUFJPTVBUX1RFTVBMQVRFLFxuICApXG4gIC5idWlsZCgpO1xuXG4iLCAiaW1wb3J0IHsgTG9jYWxJbmRleCB9IGZyb20gXCJ2ZWN0cmFcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERvY3VtZW50Q2h1bmsge1xuICBpZDogc3RyaW5nO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHZlY3RvcjogbnVtYmVyW107XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGZpbGVIYXNoOiBzdHJpbmc7XG4gIGNodW5rSW5kZXg6IG51bWJlcjtcbiAgbWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VhcmNoUmVzdWx0IHtcbiAgdGV4dDogc3RyaW5nO1xuICBzY29yZTogbnVtYmVyO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgY2xhc3MgVmVjdG9yU3RvcmUge1xuICBwcml2YXRlIGluZGV4OiBMb2NhbEluZGV4IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZGJQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgaW5kZXhQYXRoOiBzdHJpbmc7XG4gIHByaXZhdGUgdXBkYXRlTXV0ZXg6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3RvcihkYlBhdGg6IHN0cmluZykge1xuICAgIHRoaXMuZGJQYXRoID0gcGF0aC5yZXNvbHZlKGRiUGF0aCk7XG4gICAgdGhpcy5pbmRleFBhdGggPSB0aGlzLmRiUGF0aDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVzb2x2ZUluZGV4UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmIChhd2FpdCB0aGlzLnBhdGhDb250YWluc0luZGV4KHRoaXMuZGJQYXRoKSkge1xuICAgICAgcmV0dXJuIHRoaXMuZGJQYXRoO1xuICAgIH1cblxuICAgIGNvbnN0IG5lc3RlZFZlY3RyYVBhdGggPSBwYXRoLmpvaW4odGhpcy5kYlBhdGgsIFwidmVjdHJhX2luZGV4XCIpO1xuICAgIGlmIChhd2FpdCB0aGlzLnBhdGhDb250YWluc0luZGV4KG5lc3RlZFZlY3RyYVBhdGgpKSB7XG4gICAgICByZXR1cm4gbmVzdGVkVmVjdHJhUGF0aDtcbiAgICB9XG5cbiAgICBjb25zdCB0cmltbWVkRGJQYXRoID0gdGhpcy5kYlBhdGgucmVwbGFjZSgvW1xcXFwvXSskLywgXCJcIik7XG4gICAgaWYgKHBhdGguYmFzZW5hbWUodHJpbW1lZERiUGF0aCkgPT09IFwidmVjdHJhX2luZGV4XCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmRiUGF0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gbmVzdGVkVmVjdHJhUGF0aDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGF0aENvbnRhaW5zSW5kZXgodGFyZ2V0RGlyOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaW5kZXhGaWxlID0gcGF0aC5qb2luKHRhcmdldERpciwgXCJpbmRleC5qc29uXCIpO1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKGluZGV4RmlsZSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSB0aGUgdmVjdG9yIHN0b3JlXG4gICAqL1xuICBhc3luYyBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmluZGV4UGF0aCA9IGF3YWl0IHRoaXMucmVzb2x2ZUluZGV4UGF0aCgpO1xuXG4gICAgICAvLyBFbnN1cmUgZGlyZWN0b3J5IGV4aXN0c1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIodGhpcy5pbmRleFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgXG4gICAgICAvLyBDcmVhdGUgb3Igb3BlbiBWZWN0cmEgaW5kZXhcbiAgICAgIHRoaXMuaW5kZXggPSBuZXcgTG9jYWxJbmRleCh0aGlzLmluZGV4UGF0aCk7XG4gICAgICBcbiAgICAgIC8vIENoZWNrIGlmIGluZGV4IGV4aXN0cywgaWYgbm90IGNyZWF0ZSBpdFxuICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pbmRleC5pc0luZGV4Q3JlYXRlZCgpKSkge1xuICAgICAgICBhd2FpdCB0aGlzLmluZGV4LmNyZWF0ZUluZGV4KCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKFwiVmVjdG9yIHN0b3JlIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseVwiKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluaXRpYWxpemluZyB2ZWN0b3Igc3RvcmU6XCIsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgZG9jdW1lbnQgY2h1bmtzIHRvIHRoZSB2ZWN0b3Igc3RvcmVcbiAgICogVXNlcyBhIG11dGV4IHRvIHByZXZlbnQgY29uY3VycmVudCB1cGRhdGVzXG4gICAqL1xuICBhc3luYyBhZGRDaHVua3MoY2h1bmtzOiBEb2N1bWVudENodW5rW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuaW5kZXgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlZlY3RvciBzdG9yZSBub3QgaW5pdGlhbGl6ZWRcIik7XG4gICAgfVxuXG4gICAgaWYgKGNodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXYWl0IGZvciBhbnkgcGVuZGluZyB1cGRhdGVzIHRvIGNvbXBsZXRlLCB0aGVuIHJ1biB0aGlzIHVwZGF0ZVxuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBCZWdpbiBiYXRjaCB1cGRhdGVcbiAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuYmVnaW5VcGRhdGUoKTtcblxuICAgICAgZm9yIChjb25zdCBjaHVuayBvZiBjaHVua3MpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS51cHNlcnRJdGVtKHtcbiAgICAgICAgICBpZDogY2h1bmsuaWQsXG4gICAgICAgICAgdmVjdG9yOiBjaHVuay52ZWN0b3IsXG4gICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgIHRleHQ6IGNodW5rLnRleHQsXG4gICAgICAgICAgICBmaWxlUGF0aDogY2h1bmsuZmlsZVBhdGgsXG4gICAgICAgICAgICBmaWxlTmFtZTogY2h1bmsuZmlsZU5hbWUsXG4gICAgICAgICAgICBmaWxlSGFzaDogY2h1bmsuZmlsZUhhc2gsXG4gICAgICAgICAgICBjaHVua0luZGV4OiBjaHVuay5jaHVua0luZGV4LFxuICAgICAgICAgICAgLi4uY2h1bmsubWV0YWRhdGEsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENvbW1pdCB0aGUgYmF0Y2hcbiAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuZW5kVXBkYXRlKCk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBBZGRlZCAke2NodW5rcy5sZW5ndGh9IGNodW5rcyB0byB2ZWN0b3Igc3RvcmVgKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGFkZGluZyBjaHVua3MgdG8gdmVjdG9yIHN0b3JlOlwiLCBlcnJvcik7XG4gICAgICAgIC8vIFN0aWxsIGVuZCB0aGUgdXBkYXRlIG9uIGVycm9yIHRvIHByZXZlbnQgbG9ja1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmVuZFVwZGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gSWdub3JlIGVycm9yIGlmIGFscmVhZHkgZW5kZWRcbiAgICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICAgIH0pO1xuXG4gICAgLy8gUmV0dXJuIHRoZSBtdXRleCBwcm9taXNlIHNvIGNhbGxlciBjYW4gYXdhaXQgY29tcGxldGlvblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZU11dGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIFNlYXJjaCBmb3Igc2ltaWxhciBjaHVua3NcbiAgICovXG4gIGFzeW5jIHNlYXJjaChcbiAgICBxdWVyeVZlY3RvcjogbnVtYmVyW10sXG4gICAgbGltaXQ6IG51bWJlciA9IDUsXG4gICAgdGhyZXNob2xkOiBudW1iZXIgPSAwLjUsXG4gICk6IFByb21pc2U8U2VhcmNoUmVzdWx0W10+IHtcbiAgICBpZiAoIXRoaXMuaW5kZXgpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiTm8gaW5kZXggYXZhaWxhYmxlIGZvciBzZWFyY2hcIik7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB0aGlzLmluZGV4LnF1ZXJ5SXRlbXMocXVlcnlWZWN0b3IsIGxpbWl0KTtcblxuICAgICAgcmV0dXJuIHJlc3VsdHNcbiAgICAgICAgLmZpbHRlcigocmVzdWx0KSA9PiByZXN1bHQuc2NvcmUgPj0gdGhyZXNob2xkKVxuICAgICAgICAubWFwKChyZXN1bHQpID0+ICh7XG4gICAgICAgICAgdGV4dDogcmVzdWx0Lml0ZW0ubWV0YWRhdGEudGV4dCBhcyBzdHJpbmcsXG4gICAgICAgICAgc2NvcmU6IHJlc3VsdC5zY29yZSxcbiAgICAgICAgICBmaWxlUGF0aDogcmVzdWx0Lml0ZW0ubWV0YWRhdGEuZmlsZVBhdGggYXMgc3RyaW5nLFxuICAgICAgICAgIGZpbGVOYW1lOiByZXN1bHQuaXRlbS5tZXRhZGF0YS5maWxlTmFtZSBhcyBzdHJpbmcsXG4gICAgICAgICAgY2h1bmtJbmRleDogcmVzdWx0Lml0ZW0ubWV0YWRhdGEuY2h1bmtJbmRleCBhcyBudW1iZXIsXG4gICAgICAgICAgbWV0YWRhdGE6IHJlc3VsdC5pdGVtLm1ldGFkYXRhLFxuICAgICAgICB9KSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZWFyY2hpbmcgdmVjdG9yIHN0b3JlOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBjaHVua3MgZm9yIGEgc3BlY2lmaWMgZmlsZSAoYnkgaGFzaClcbiAgICogVXNlcyBhIG11dGV4IHRvIHByZXZlbnQgY29uY3VycmVudCB1cGRhdGVzXG4gICAqL1xuICBhc3luYyBkZWxldGVCeUZpbGVIYXNoKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuaW5kZXgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBXYWl0IGZvciBhbnkgcGVuZGluZyB1cGRhdGVzIHRvIGNvbXBsZXRlLCB0aGVuIHJ1biB0aGlzIGRlbGV0ZVxuICAgIHRoaXMudXBkYXRlTXV0ZXggPSB0aGlzLnVwZGF0ZU11dGV4LnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmJlZ2luVXBkYXRlKCk7XG4gICAgICBcbiAgICAgIC8vIEdldCBhbGwgaXRlbXMgYW5kIGZpbHRlciBieSBmaWxlSGFzaFxuICAgICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuaW5kZXghLmxpc3RJdGVtcygpO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcbiAgICAgICAgaWYgKGl0ZW0ubWV0YWRhdGEuZmlsZUhhc2ggPT09IGZpbGVIYXNoKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5kZWxldGVJdGVtKGl0ZW0uaWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBcbiAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuZW5kVXBkYXRlKCk7XG4gICAgICBcbiAgICAgIGNvbnNvbGUubG9nKGBEZWxldGVkIGNodW5rcyBmb3IgZmlsZSBoYXNoOiAke2ZpbGVIYXNofWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBkZWxldGluZyBjaHVua3MgZm9yIGZpbGUgaGFzaCAke2ZpbGVIYXNofTpgLCBlcnJvcik7XG4gICAgICAgIC8vIFN0aWxsIGVuZCB0aGUgdXBkYXRlIG9uIGVycm9yIHRvIHByZXZlbnQgbG9ja1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmVuZFVwZGF0ZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gSWdub3JlIGVycm9yIGlmIGFscmVhZHkgZW5kZWRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYSBmaWxlIChieSBoYXNoKSBleGlzdHMgaW4gdGhlIHN0b3JlXG4gICAqL1xuICBhc3luYyBoYXNGaWxlKGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAoIXRoaXMuaW5kZXgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmluZGV4Lmxpc3RJdGVtcygpO1xuICAgICAgXG4gICAgICByZXR1cm4gYWxsSXRlbXMuc29tZSgoaXRlbSkgPT4gaXRlbS5tZXRhZGF0YS5maWxlSGFzaCA9PT0gZmlsZUhhc2gpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBjaGVja2luZyBmaWxlIGhhc2ggJHtmaWxlSGFzaH06YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBtYXAgb2YgZmlsZSBwYXRocyB0byB0aGUgc2V0IG9mIGhhc2hlcyBjdXJyZW50bHkgc3RvcmVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0RmlsZUhhc2hJbnZlbnRvcnkoKTogUHJvbWlzZTxNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4+IHtcbiAgICBjb25zdCBpbnZlbnRvcnkgPSBuZXcgTWFwPHN0cmluZywgU2V0PHN0cmluZz4+KCk7XG4gICAgaWYgKCF0aGlzLmluZGV4KSB7XG4gICAgICByZXR1cm4gaW52ZW50b3J5O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuaW5kZXgubGlzdEl0ZW1zKCk7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBpdGVtLm1ldGFkYXRhLmZpbGVQYXRoIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgY29uc3QgZmlsZUhhc2ggPSBpdGVtLm1ldGFkYXRhLmZpbGVIYXNoIGFzIHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCFmaWxlUGF0aCB8fCAhZmlsZUhhc2gpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaGFzaGVzID0gaW52ZW50b3J5LmdldChmaWxlUGF0aCk7XG4gICAgICAgIGlmICghaGFzaGVzKSB7XG4gICAgICAgICAgaGFzaGVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgICAgaW52ZW50b3J5LnNldChmaWxlUGF0aCwgaGFzaGVzKTtcbiAgICAgICAgfVxuICAgICAgICBoYXNoZXMuYWRkKGZpbGVIYXNoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbnZlbnRvcnk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBidWlsZGluZyBmaWxlIGhhc2ggaW52ZW50b3J5OlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4gaW52ZW50b3J5O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgc3RhdGlzdGljcyBhYm91dCB0aGUgdmVjdG9yIHN0b3JlXG4gICAqL1xuICBhc3luYyBnZXRTdGF0cygpOiBQcm9taXNlPHsgdG90YWxDaHVua3M6IG51bWJlcjsgdW5pcXVlRmlsZXM6IG51bWJlciB9PiB7XG4gICAgaWYgKCF0aGlzLmluZGV4KSB7XG4gICAgICByZXR1cm4geyB0b3RhbENodW5rczogMCwgdW5pcXVlRmlsZXM6IDAgfTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmluZGV4Lmxpc3RJdGVtcygpO1xuICAgICAgY29uc3QgdW5pcXVlSGFzaGVzID0gbmV3IFNldChcbiAgICAgICAgYWxsSXRlbXMubWFwKChpdGVtKSA9PiBpdGVtLm1ldGFkYXRhLmZpbGVIYXNoIGFzIHN0cmluZylcbiAgICAgICk7XG4gICAgICBcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRvdGFsQ2h1bmtzOiBhbGxJdGVtcy5sZW5ndGgsXG4gICAgICAgIHVuaXF1ZUZpbGVzOiB1bmlxdWVIYXNoZXMuc2l6ZSxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIHN0YXRzOlwiLCBlcnJvcik7XG4gICAgICByZXR1cm4geyB0b3RhbENodW5rczogMCwgdW5pcXVlRmlsZXM6IDAgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2xvc2UgdGhlIHZlY3RvciBzdG9yZSBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBjbG9zZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyBWZWN0cmEgZG9lc24ndCByZXF1aXJlIGV4cGxpY2l0IGNsb3NpbmdcbiAgICB0aGlzLmluZGV4ID0gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgb3MgZnJvbSBcIm9zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FuaXR5Q2hlY2tSZXN1bHQge1xuICBwYXNzZWQ6IGJvb2xlYW47XG4gIHdhcm5pbmdzOiBzdHJpbmdbXTtcbiAgZXJyb3JzOiBzdHJpbmdbXTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtIHNhbml0eSBjaGVja3MgYmVmb3JlIGluZGV4aW5nIGxhcmdlIGRpcmVjdG9yaWVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwZXJmb3JtU2FuaXR5Q2hlY2tzKFxuICBkb2N1bWVudHNEaXI6IHN0cmluZyxcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZyxcbik6IFByb21pc2U8U2FuaXR5Q2hlY2tSZXN1bHQ+IHtcbiAgY29uc3Qgd2FybmluZ3M6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGVycm9yczogc3RyaW5nW10gPSBbXTtcblxuICAvLyBDaGVjayBpZiBkaXJlY3RvcmllcyBleGlzdFxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2Vzcyhkb2N1bWVudHNEaXIsIGZzLmNvbnN0YW50cy5SX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgZXJyb3JzLnB1c2goYERvY3VtZW50cyBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3Qgb3IgaXMgbm90IHJlYWRhYmxlOiAke2RvY3VtZW50c0Rpcn1gKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKHZlY3RvclN0b3JlRGlyLCBmcy5jb25zdGFudHMuV19PSyk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIFRyeSB0byBjcmVhdGUgaXRcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIodmVjdG9yU3RvcmVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZXJyb3JzLnB1c2goXG4gICAgICAgIGBWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0IGFuZCBjYW5ub3QgYmUgY3JlYXRlZDogJHt2ZWN0b3JTdG9yZURpcn1gXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBkaXNrIHNwYWNlXG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0ZnModmVjdG9yU3RvcmVEaXIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUdCID0gKHN0YXRzLmJhdmFpbCAqIHN0YXRzLmJzaXplKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICAgIFxuICAgIGlmIChhdmFpbGFibGVHQiA8IDEpIHtcbiAgICAgIGVycm9ycy5wdXNoKGBWZXJ5IGxvdyBkaXNrIHNwYWNlIGF2YWlsYWJsZTogJHthdmFpbGFibGVHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH0gZWxzZSBpZiAoYXZhaWxhYmxlR0IgPCAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaChgTG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgY2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcIik7XG4gIH1cblxuICAvLyBDaGVjayBhdmFpbGFibGUgbWVtb3J5XG4gIGNvbnN0IGZyZWVNZW1vcnlHQiA9IG9zLmZyZWVtZW0oKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICBjb25zdCB0b3RhbE1lbW9yeUdCID0gb3MudG90YWxtZW0oKSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICBjb25zdCBydW5uaW5nT25NYWMgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiO1xuICBjb25zdCBsb3dNZW1vcnlNZXNzYWdlID1cbiAgICBgTG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQiBvZiAke3RvdGFsTWVtb3J5R0IudG9GaXhlZCgyKX0gR0IgdG90YWwuIGAgK1xuICAgIFwiQ29uc2lkZXIgcmVkdWNpbmcgY29uY3VycmVudCBmaWxlIHByb2Nlc3NpbmcuXCI7XG4gIGNvbnN0IHZlcnlMb3dNZW1vcnlNZXNzYWdlID1cbiAgICBgVmVyeSBsb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCLiBgICtcbiAgICAocnVubmluZ09uTWFjXG4gICAgICA/IFwibWFjT1MgbWF5IGJlIHJlcG9ydGluZyBjYWNoZWQgcGFnZXMgYXMgdXNlZDsgY2FjaGVkIG1lbW9yeSBjYW4gdXN1YWxseSBiZSByZWNsYWltZWQgYXV0b21hdGljYWxseS5cIlxuICAgICAgOiBcIkluZGV4aW5nIG1heSBmYWlsIGR1ZSB0byBpbnN1ZmZpY2llbnQgUkFNLlwiKTtcblxuICBpZiAoZnJlZU1lbW9yeUdCIDwgMC41KSB7XG4gICAgaWYgKHJ1bm5pbmdPbk1hYykge1xuICAgICAgd2FybmluZ3MucHVzaCh2ZXJ5TG93TWVtb3J5TWVzc2FnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVycm9ycy5wdXNoKGBWZXJ5IGxvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCIDwgMikge1xuICAgIHdhcm5pbmdzLnB1c2gobG93TWVtb3J5TWVzc2FnZSk7XG4gIH1cblxuICAvLyBFc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZSAoc2FtcGxlLWJhc2VkIGZvciBwZXJmb3JtYW5jZSlcbiAgdHJ5IHtcbiAgICBjb25zdCBzYW1wbGVTaXplID0gYXdhaXQgZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRvY3VtZW50c0Rpcik7XG4gICAgY29uc3QgZXN0aW1hdGVkR0IgPSBzYW1wbGVTaXplIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGVzdGltYXRlZEdCID4gMTAwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTGFyZ2UgZGlyZWN0b3J5IGRldGVjdGVkICh+JHtlc3RpbWF0ZWRHQi50b0ZpeGVkKDEpfSBHQikuIEluaXRpYWwgaW5kZXhpbmcgbWF5IHRha2Ugc2V2ZXJhbCBob3Vycy5gXG4gICAgICApO1xuICAgIH0gZWxzZSBpZiAoZXN0aW1hdGVkR0IgPiAxMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgYE1lZGl1bS1zaXplZCBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSAzMC02MCBtaW51dGVzLmBcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHdhcm5pbmdzLnB1c2goXCJDb3VsZCBub3QgZXN0aW1hdGUgZGlyZWN0b3J5IHNpemVcIik7XG4gIH1cblxuICAvLyBDaGVjayBpZiB2ZWN0b3Igc3RvcmUgYWxyZWFkeSBoYXMgZGF0YVxuICB0cnkge1xuICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcih2ZWN0b3JTdG9yZURpcik7XG4gICAgaWYgKGZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIFwiVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBpcyBub3QgZW1wdHkuIEV4aXN0aW5nIGRhdGEgd2lsbCBiZSB1c2VkIGZvciBpbmNyZW1lbnRhbCBpbmRleGluZy5cIlxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIERpcmVjdG9yeSBkb2Vzbid0IGV4aXN0IHlldCwgdGhhdCdzIGZpbmVcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcGFzc2VkOiBlcnJvcnMubGVuZ3RoID09PSAwLFxuICAgIHdhcm5pbmdzLFxuICAgIGVycm9ycyxcbiAgfTtcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZSBieSBzYW1wbGluZ1xuICogKFF1aWNrIGVzdGltYXRlLCBub3QgZXhhY3QpXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGVzdGltYXRlRGlyZWN0b3J5U2l6ZShkaXI6IHN0cmluZywgbWF4U2FtcGxlczogbnVtYmVyID0gMTAwKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgbGV0IHRvdGFsU2l6ZSA9IDA7XG4gIGxldCBmaWxlQ291bnQgPSAwO1xuICBsZXQgc2FtcGxlZFNpemUgPSAwO1xuICBsZXQgc2FtcGxlZENvdW50ID0gMDtcblxuICBhc3luYyBmdW5jdGlvbiB3YWxrKGN1cnJlbnREaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcihjdXJyZW50RGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoc2FtcGxlZENvdW50ID49IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gYCR7Y3VycmVudERpcn0vJHtlbnRyeS5uYW1lfWA7XG5cbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIGZpbGVDb3VudCsrO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChzYW1wbGVkQ291bnQgPCBtYXhTYW1wbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgICBzYW1wbGVkU2l6ZSArPSBzdGF0cy5zaXplO1xuICAgICAgICAgICAgICBzYW1wbGVkQ291bnQrKztcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICAvLyBTa2lwIGZpbGVzIHdlIGNhbid0IHN0YXRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIFNraXAgZGlyZWN0b3JpZXMgd2UgY2FuJ3QgcmVhZFxuICAgIH1cbiAgfVxuXG4gIGF3YWl0IHdhbGsoZGlyKTtcblxuICAvLyBFeHRyYXBvbGF0ZSBmcm9tIHNhbXBsZVxuICBpZiAoc2FtcGxlZENvdW50ID4gMCAmJiBmaWxlQ291bnQgPiAwKSB7XG4gICAgY29uc3QgYXZnRmlsZVNpemUgPSBzYW1wbGVkU2l6ZSAvIHNhbXBsZWRDb3VudDtcbiAgICB0b3RhbFNpemUgPSBhdmdGaWxlU2l6ZSAqIGZpbGVDb3VudDtcbiAgfVxuXG4gIHJldHVybiB0b3RhbFNpemU7XG59XG5cbi8qKlxuICogQ2hlY2sgc3lzdGVtIHJlc291cmNlcyBhbmQgcHJvdmlkZSByZWNvbW1lbmRhdGlvbnNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFJlc291cmNlUmVjb21tZW5kYXRpb25zKFxuICBlc3RpbWF0ZWRTaXplR0I6IG51bWJlcixcbiAgZnJlZU1lbW9yeUdCOiBudW1iZXIsXG4pOiB7XG4gIHJlY29tbWVuZGVkQ29uY3VycmVuY3k6IG51bWJlcjtcbiAgcmVjb21tZW5kZWRDaHVua1NpemU6IG51bWJlcjtcbiAgZXN0aW1hdGVkVGltZTogc3RyaW5nO1xufSB7XG4gIGxldCByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMztcbiAgbGV0IHJlY29tbWVuZGVkQ2h1bmtTaXplID0gNTEyO1xuICBsZXQgZXN0aW1hdGVkVGltZSA9IFwidW5rbm93blwiO1xuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBhdmFpbGFibGUgbWVtb3J5XG4gIGlmIChmcmVlTWVtb3J5R0IgPCAyKSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDE7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCIDwgNCkge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAyO1xuICB9IGVsc2UgaWYgKGZyZWVNZW1vcnlHQiA+PSA4KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDU7XG4gIH1cblxuICAvLyBBZGp1c3QgYmFzZWQgb24gZGF0YXNldCBzaXplXG4gIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNS0xNSBtaW51dGVzXCI7XG4gIH0gZWxzZSBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMTApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIzMC02MCBtaW51dGVzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSA3Njg7XG4gIH0gZWxzZSBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMTAwKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiMi00IGhvdXJzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSAxMDI0O1xuICB9IGVsc2Uge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjQtMTIgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IE1hdGgubWluKHJlY29tbWVuZGVkQ29uY3VycmVuY3ksIDMpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5LFxuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplLFxuICAgIGVzdGltYXRlZFRpbWUsXG4gIH07XG59XG5cbiIsICJsZXQgaW5kZXhpbmdJblByb2dyZXNzID0gZmFsc2U7XG5cbi8qKlxuICogQXR0ZW1wdCB0byBhY3F1aXJlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqIFJldHVybnMgdHJ1ZSBpZiBubyBvdGhlciBpbmRleGluZyBqb2IgaXMgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyeVN0YXJ0SW5kZXhpbmcoY29udGV4dDogc3RyaW5nID0gXCJ1bmtub3duXCIpOiBib29sZWFuIHtcbiAgaWYgKGluZGV4aW5nSW5Qcm9ncmVzcykge1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIGZhaWxlZDogbG9jayBhbHJlYWR5IGhlbGRgKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSB0cnVlO1xuICBjb25zb2xlLmRlYnVnKGBbQmlnUkFHXSB0cnlTdGFydEluZGV4aW5nICgke2NvbnRleHR9KSBzdWNjZWVkZWRgKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogUmVsZWFzZSB0aGUgc2hhcmVkIGluZGV4aW5nIGxvY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5pc2hJbmRleGluZygpOiB2b2lkIHtcbiAgaW5kZXhpbmdJblByb2dyZXNzID0gZmFsc2U7XG4gIGNvbnNvbGUuZGVidWcoXCJbQmlnUkFHXSBmaW5pc2hJbmRleGluZzogbG9jayByZWxlYXNlZFwiKTtcbn1cblxuLyoqXG4gKiBJbmRpY2F0ZXMgd2hldGhlciBhbiBpbmRleGluZyBqb2IgaXMgY3VycmVudGx5IHJ1bm5pbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0luZGV4aW5nKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gaW5kZXhpbmdJblByb2dyZXNzO1xufVxuXG4iLCAiY29uc3QgSFRNTF9FWFRFTlNJT05TID0gW1wiLmh0bVwiLCBcIi5odG1sXCIsIFwiLnhodG1sXCJdO1xuY29uc3QgTUFSS0RPV05fRVhURU5TSU9OUyA9IFtcIi5tZFwiLCBcIi5tYXJrZG93blwiLCBcIi5tZG93blwiLCBcIi5tZHhcIiwgXCIubWtkXCIsIFwiLm1rZG5cIl07XG5jb25zdCBURVhUX0VYVEVOU0lPTlMgPSBbXCIudHh0XCIsIFwiLnRleHRcIl07XG5jb25zdCBQREZfRVhURU5TSU9OUyA9IFtcIi5wZGZcIl07XG5jb25zdCBFUFVCX0VYVEVOU0lPTlMgPSBbXCIuZXB1YlwiXTtcbmNvbnN0IElNQUdFX0VYVEVOU0lPTlMgPSBbXCIuYm1wXCIsIFwiLmpwZ1wiLCBcIi5qcGVnXCIsIFwiLnBuZ1wiXTtcbmNvbnN0IEFSQ0hJVkVfRVhURU5TSU9OUyA9IFtcIi5yYXJcIl07XG5cbmNvbnN0IEFMTF9FWFRFTlNJT05fR1JPVVBTID0gW1xuICBIVE1MX0VYVEVOU0lPTlMsXG4gIE1BUktET1dOX0VYVEVOU0lPTlMsXG4gIFRFWFRfRVhURU5TSU9OUyxcbiAgUERGX0VYVEVOU0lPTlMsXG4gIEVQVUJfRVhURU5TSU9OUyxcbiAgSU1BR0VfRVhURU5TSU9OUyxcbiAgQVJDSElWRV9FWFRFTlNJT05TLFxuXTtcblxuZXhwb3J0IGNvbnN0IFNVUFBPUlRFRF9FWFRFTlNJT05TID0gbmV3IFNldChcbiAgQUxMX0VYVEVOU0lPTl9HUk9VUFMuZmxhdE1hcCgoZ3JvdXApID0+IGdyb3VwLm1hcCgoZXh0KSA9PiBleHQudG9Mb3dlckNhc2UoKSkpLFxuKTtcblxuZXhwb3J0IGNvbnN0IEhUTUxfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoSFRNTF9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBNQVJLRE9XTl9FWFRFTlNJT05fU0VUID0gbmV3IFNldChNQVJLRE9XTl9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBURVhUX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KFRFWFRfRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgSU1BR0VfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoSU1BR0VfRVhURU5TSU9OUyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0h0bWxFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIEhUTUxfRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNYXJrZG93bkV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gTUFSS0RPV05fRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQbGFpblRleHRFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIFRFWFRfRVhURU5TSU9OX1NFVC5oYXMoZXh0LnRvTG93ZXJDYXNlKCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0dWFsRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dCkgfHwgaXNQbGFpblRleHRFeHRlbnNpb24oZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zKCk6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIEFycmF5LmZyb20oU1VQUE9SVEVEX0VYVEVOU0lPTlMudmFsdWVzKCkpLnNvcnQoKTtcbn1cblxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBtaW1lIGZyb20gXCJtaW1lLXR5cGVzXCI7XG5pbXBvcnQge1xuICBTVVBQT1JURURfRVhURU5TSU9OUyxcbiAgbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMsXG59IGZyb20gXCIuLi91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2Nhbm5lZEZpbGUge1xuICBwYXRoOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbiAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gIG1pbWVUeXBlOiBzdHJpbmcgfCBmYWxzZTtcbiAgc2l6ZTogbnVtYmVyO1xuICBtdGltZTogRGF0ZTtcbn1cblxuLyoqXG4gKiBSZWN1cnNpdmVseSBzY2FuIGEgZGlyZWN0b3J5IGZvciBzdXBwb3J0ZWQgZmlsZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNjYW5EaXJlY3RvcnkoXG4gIHJvb3REaXI6IHN0cmluZyxcbiAgb25Qcm9ncmVzcz86IChjdXJyZW50OiBudW1iZXIsIHRvdGFsOiBudW1iZXIpID0+IHZvaWQsXG4pOiBQcm9taXNlPFNjYW5uZWRGaWxlW10+IHtcbiAgY29uc3QgZmlsZXM6IFNjYW5uZWRGaWxlW10gPSBbXTtcbiAgbGV0IHNjYW5uZWRDb3VudCA9IDA7XG4gIFxuICBjb25zdCBzdXBwb3J0ZWRFeHRlbnNpb25zRGVzY3JpcHRpb24gPSBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucygpLmpvaW4oXCIsIFwiKTtcbiAgY29uc29sZS5sb2coYFtTY2FubmVyXSBTdXBwb3J0ZWQgZXh0ZW5zaW9uczogJHtzdXBwb3J0ZWRFeHRlbnNpb25zRGVzY3JpcHRpb259YCk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gd2FsayhkaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcihkaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gcGF0aC5qb2luKGRpciwgZW50cnkubmFtZSk7XG4gICAgICAgIFxuICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIGF3YWl0IHdhbGsoZnVsbFBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICAgICAgc2Nhbm5lZENvdW50Kys7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGVudHJ5Lm5hbWUpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKFNVUFBPUlRFRF9FWFRFTlNJT05TLmhhcyhleHQpKSB7XG4gICAgICAgICAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZnVsbFBhdGgpO1xuICAgICAgICAgICAgY29uc3QgbWltZVR5cGUgPSBtaW1lLmxvb2t1cChmdWxsUGF0aCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZpbGVzLnB1c2goe1xuICAgICAgICAgICAgICBwYXRoOiBmdWxsUGF0aCxcbiAgICAgICAgICAgICAgbmFtZTogZW50cnkubmFtZSxcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBleHQsXG4gICAgICAgICAgICAgIG1pbWVUeXBlLFxuICAgICAgICAgICAgICBzaXplOiBzdGF0cy5zaXplLFxuICAgICAgICAgICAgICBtdGltZTogc3RhdHMubXRpbWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKG9uUHJvZ3Jlc3MgJiYgc2Nhbm5lZENvdW50ICUgMTAwID09PSAwKSB7XG4gICAgICAgICAgICBvblByb2dyZXNzKHNjYW5uZWRDb3VudCwgZmlsZXMubGVuZ3RoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3Igc2Nhbm5pbmcgZGlyZWN0b3J5ICR7ZGlyfTpgLCBlcnJvcik7XG4gICAgfVxuICB9XG4gIFxuICBhd2FpdCB3YWxrKHJvb3REaXIpO1xuICBcbiAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICBvblByb2dyZXNzKHNjYW5uZWRDb3VudCwgZmlsZXMubGVuZ3RoKTtcbiAgfVxuICBcbiAgcmV0dXJuIGZpbGVzO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgZmlsZSB0eXBlIGlzIHN1cHBvcnRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNTdXBwb3J0ZWRGaWxlKGZpbGVQYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gU1VQUE9SVEVEX0VYVEVOU0lPTlMuaGFzKGV4dCk7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gXCJjaGVlcmlvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBQYXJzZSBIVE1ML0hUTSBmaWxlcyBhbmQgZXh0cmFjdCB0ZXh0IGNvbnRlbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSFRNTChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgsIFwidXRmLThcIik7XG4gICAgY29uc3QgJCA9IGNoZWVyaW8ubG9hZChjb250ZW50KTtcbiAgICBcbiAgICAvLyBSZW1vdmUgc2NyaXB0IGFuZCBzdHlsZSBlbGVtZW50c1xuICAgICQoXCJzY3JpcHQsIHN0eWxlLCBub3NjcmlwdFwiKS5yZW1vdmUoKTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IHRleHRcbiAgICBjb25zdCB0ZXh0ID0gJChcImJvZHlcIikudGV4dCgpIHx8ICQudGV4dCgpO1xuICAgIFxuICAgIC8vIENsZWFuIHVwIHdoaXRlc3BhY2VcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIEhUTUwgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgcGRmUGFyc2UgZnJvbSBcInBkZi1wYXJzZVwiO1xuaW1wb3J0IHsgY3JlYXRlV29ya2VyIH0gZnJvbSBcInRlc3NlcmFjdC5qc1wiO1xuaW1wb3J0IHsgUE5HIH0gZnJvbSBcInBuZ2pzXCI7XG5cbmNvbnN0IE1JTl9URVhUX0xFTkdUSCA9IDUwO1xuY29uc3QgT0NSX01BWF9QQUdFUyA9IDUwO1xuY29uc3QgT0NSX01BWF9JTUFHRVNfUEVSX1BBR0UgPSAzO1xuY29uc3QgT0NSX01JTl9JTUFHRV9BUkVBID0gMTBfMDAwO1xuY29uc3QgT0NSX0lNQUdFX1RJTUVPVVRfTVMgPSAzMF8wMDA7XG5cbnR5cGUgUGRmSnNNb2R1bGUgPSB0eXBlb2YgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcblxuaW50ZXJmYWNlIEV4dHJhY3RlZE9jckltYWdlIHtcbiAgYnVmZmVyOiBCdWZmZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xuICBhcmVhOiBudW1iZXI7XG59XG5cbmV4cG9ydCB0eXBlIFBkZkZhaWx1cmVSZWFzb24gPVxuICB8IFwicGRmLmxtc3R1ZGlvLWVycm9yXCJcbiAgfCBcInBkZi5sbXN0dWRpby1lbXB0eVwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZXJyb3JcIlxuICB8IFwicGRmLnBkZnBhcnNlLWVtcHR5XCJcbiAgfCBcInBkZi5vY3ItZGlzYWJsZWRcIlxuICB8IFwicGRmLm9jci1lcnJvclwiXG4gIHwgXCJwZGYub2NyLXJlbmRlci1lcnJvclwiXG4gIHwgXCJwZGYub2NyLWVtcHR5XCI7XG5cbnR5cGUgUGRmUGFyc2VTdGFnZSA9IFwibG1zdHVkaW9cIiB8IFwicGRmLXBhcnNlXCIgfCBcIm9jclwiO1xuY2xhc3MgSW1hZ2VEYXRhVGltZW91dEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihvYmpJZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoYFRpbWVkIG91dCBmZXRjaGluZyBpbWFnZSBkYXRhIGZvciAke29iaklkfWApO1xuICAgIHRoaXMubmFtZSA9IFwiSW1hZ2VEYXRhVGltZW91dEVycm9yXCI7XG4gIH1cbn1cblxuaW50ZXJmYWNlIFBkZlBhcnNlclN1Y2Nlc3Mge1xuICBzdWNjZXNzOiB0cnVlO1xuICB0ZXh0OiBzdHJpbmc7XG4gIHN0YWdlOiBQZGZQYXJzZVN0YWdlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBkZlBhcnNlckZhaWx1cmUge1xuICBzdWNjZXNzOiBmYWxzZTtcbiAgcmVhc29uOiBQZGZGYWlsdXJlUmVhc29uO1xuICBkZXRhaWxzPzogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBQZGZQYXJzZXJSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxuZnVuY3Rpb24gY2xlYW5UZXh0KHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0ZXh0XG4gICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAudHJpbSgpO1xufVxuXG50eXBlIFN0YWdlUmVzdWx0ID0gUGRmUGFyc2VyU3VjY2VzcyB8IFBkZlBhcnNlckZhaWx1cmU7XG5cbmxldCBjYWNoZWRQZGZqc0xpYjogUGRmSnNNb2R1bGUgfCBudWxsID0gbnVsbDtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0UGRmanNMaWIoKSB7XG4gIGlmICghY2FjaGVkUGRmanNMaWIpIHtcbiAgICBjYWNoZWRQZGZqc0xpYiA9IGF3YWl0IGltcG9ydChcInBkZmpzLWRpc3QvbGVnYWN5L2J1aWxkL3BkZi5tanNcIik7XG4gIH1cbiAgcmV0dXJuIGNhY2hlZFBkZmpzTGliO1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aDogc3RyaW5nLCBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50KTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBtYXhSZXRyaWVzID0gMjtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDE7IGF0dGVtcHQgPD0gbWF4UmV0cmllczsgYXR0ZW1wdCsrKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVIYW5kbGUgPSBhd2FpdCBjbGllbnQuZmlsZXMucHJlcGFyZUZpbGUoZmlsZVBhdGgpO1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY2xpZW50LmZpbGVzLnBhcnNlRG9jdW1lbnQoZmlsZUhhbmRsZSwge1xuICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICBpZiAocHJvZ3Jlc3MgPT09IDAgfHwgcHJvZ3Jlc3MgPT09IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFByb2Nlc3NpbmcgJHtmaWxlTmFtZX06ICR7KHByb2dyZXNzICogMTAwKS50b0ZpeGVkKDApfSVgLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dChyZXN1bHQuY29udGVudCk7XG4gICAgICBpZiAoY2xlYW5lZC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICAgIHN0YWdlOiBcImxtc3R1ZGlvXCIsXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFBhcnNlZCBidXQgZ290IHZlcnkgbGl0dGxlIHRleHQgZnJvbSAke2ZpbGVOYW1lfSAobGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9KSwgd2lsbCB0cnkgZmFsbGJhY2tzYCxcbiAgICAgICk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lbXB0eVwiLFxuICAgICAgICBkZXRhaWxzOiBgbGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9YCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGlzV2ViU29ja2V0RXJyb3IgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmXG4gICAgICAgIChlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwiV2ViU29ja2V0XCIpIHx8IGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJjb25uZWN0aW9uIGNsb3NlZFwiKSk7XG5cbiAgICAgIGlmIChpc1dlYlNvY2tldEVycm9yICYmIGF0dGVtcHQgPCBtYXhSZXRyaWVzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIFdlYlNvY2tldCBlcnJvciBvbiAke2ZpbGVOYW1lfSwgcmV0cnlpbmcgKCR7YXR0ZW1wdH0vJHttYXhSZXRyaWVzfSkuLi5gLFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwICogYXR0ZW1wdCkpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChMTSBTdHVkaW8pIEVycm9yIHBhcnNpbmcgUERGIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZXJyb3JcIixcbiAgICBkZXRhaWxzOiBcIkV4Y2VlZGVkIHJldHJ5IGF0dGVtcHRzXCIsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeVBkZlBhcnNlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuICB0cnkge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoKTtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZGZQYXJzZShidWZmZXIpO1xuICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQocmVzdWx0LnRleHQgfHwgXCJcIik7XG5cbiAgICBpZiAoY2xlYW5lZC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIFN1Y2Nlc3NmdWxseSBleHRyYWN0ZWQgdGV4dCBmcm9tICR7ZmlsZU5hbWV9YCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0ZXh0OiBjbGVhbmVkLFxuICAgICAgICBzdGFnZTogXCJwZGYtcGFyc2VcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIFZlcnkgbGl0dGxlIG9yIG5vIHRleHQgZXh0cmFjdGVkIGZyb20gJHtmaWxlTmFtZX0gKGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofSlgLFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5wZGZwYXJzZS1lbXB0eVwiLFxuICAgICAgZGV0YWlsczogYGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofWAsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgRXJyb3IgcGFyc2luZyBQREYgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5wZGZwYXJzZS1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5T2NyV2l0aFBkZkpzKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIGxldCB3b3JrZXI6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlV29ya2VyPj4gfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBwZGZqc0xpYiA9IGF3YWl0IGdldFBkZmpzTGliKCk7XG4gICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoKSk7XG4gICAgY29uc3QgcGRmRG9jdW1lbnQgPSBhd2FpdCBwZGZqc0xpYlxuICAgICAgLmdldERvY3VtZW50KHsgZGF0YSwgdmVyYm9zaXR5OiBwZGZqc0xpYi5WZXJib3NpdHlMZXZlbC5FUlJPUlMgfSlcbiAgICAgIC5wcm9taXNlO1xuXG4gICAgY29uc3QgbnVtUGFnZXMgPSBwZGZEb2N1bWVudC5udW1QYWdlcztcbiAgICBjb25zdCBtYXhQYWdlcyA9IE1hdGgubWluKG51bVBhZ2VzLCBPQ1JfTUFYX1BBR0VTKTtcblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBTdGFydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9IC0gcGFnZXMgMSB0byAke21heFBhZ2VzfSAob2YgJHtudW1QYWdlc30pYCxcbiAgICApO1xuXG4gICAgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgIGNvbnN0IHRleHRQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcmVuZGVyRXJyb3JzID0gMDtcbiAgICBsZXQgcHJvY2Vzc2VkSW1hZ2VzID0gMDtcblxuICAgIGZvciAobGV0IHBhZ2VOdW0gPSAxOyBwYWdlTnVtIDw9IG1heFBhZ2VzOyBwYWdlTnVtKyspIHtcbiAgICAgIGxldCBwYWdlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZSA9IGF3YWl0IHBkZkRvY3VtZW50LmdldFBhZ2UocGFnZU51bSk7XG4gICAgICAgIGNvbnN0IGltYWdlcyA9IGF3YWl0IGV4dHJhY3RJbWFnZXNGb3JQYWdlKHBkZmpzTGliLCBwYWdlKTtcbiAgICAgICAgaWYgKGltYWdlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgJHtmaWxlTmFtZX0gLSBwYWdlICR7cGFnZU51bX0gY29udGFpbnMgbm8gZXh0cmFjdGFibGUgaW1hZ2VzLCBza2lwcGluZ2AsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNlbGVjdGVkSW1hZ2VzID0gaW1hZ2VzLnNsaWNlKDAsIE9DUl9NQVhfSU1BR0VTX1BFUl9QQUdFKTtcbiAgICAgICAgZm9yIChjb25zdCBpbWFnZSBvZiBzZWxlY3RlZEltYWdlcykge1xuICAgICAgICAgIGNvbnN0IHtcbiAgICAgICAgICAgIGRhdGE6IHsgdGV4dCB9LFxuICAgICAgICAgIH0gPSBhd2FpdCB3b3JrZXIucmVjb2duaXplKGltYWdlLmJ1ZmZlcik7XG4gICAgICAgICAgcHJvY2Vzc2VkSW1hZ2VzKys7XG4gICAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dCh0ZXh0IHx8IFwiXCIpO1xuICAgICAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKGNsZWFuZWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwYWdlTnVtID09PSAxIHx8IHBhZ2VOdW0gJSAxMCA9PT0gMCB8fCBwYWdlTnVtID09PSBtYXhQYWdlcykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSAke2ZpbGVOYW1lfSAtIHByb2Nlc3NlZCBwYWdlICR7cGFnZU51bX0vJHttYXhQYWdlc30gKGltYWdlcz0ke3Byb2Nlc3NlZEltYWdlc30sIGNoYXJzPSR7dGV4dFBhcnRzLmpvaW4oXG4gICAgICAgICAgICAgIFwiXFxuXFxuXCIsXG4gICAgICAgICAgICApLmxlbmd0aH0pYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChwYWdlRXJyb3IpIHtcbiAgICAgICAgaWYgKHBhZ2VFcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEFib3J0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX06ICR7cGFnZUVycm9yLm1lc3NhZ2V9YCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgICB3b3JrZXIgPSBudWxsO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICAgICAgICBkZXRhaWxzOiBwYWdlRXJyb3IubWVzc2FnZSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJlbmRlckVycm9ycysrO1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRXJyb3IgcHJvY2Vzc2luZyBwYWdlICR7cGFnZU51bX0gb2YgJHtmaWxlTmFtZX06YCxcbiAgICAgICAgICBwYWdlRXJyb3IsXG4gICAgICAgICk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBhd2FpdCBwYWdlPy5jbGVhbnVwKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIHdvcmtlciA9IG51bGw7XG5cbiAgICBjb25zdCBmdWxsVGV4dCA9IGNsZWFuVGV4dCh0ZXh0UGFydHMuam9pbihcIlxcblxcblwiKSk7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIENvbXBsZXRlZCBPQ1IgZm9yICR7ZmlsZU5hbWV9LCBleHRyYWN0ZWQgJHtmdWxsVGV4dC5sZW5ndGh9IGNoYXJhY3RlcnNgLFxuICAgICk7XG5cbiAgICBpZiAoZnVsbFRleHQubGVuZ3RoID49IE1JTl9URVhUX0xFTkdUSCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdGV4dDogZnVsbFRleHQsXG4gICAgICAgIHN0YWdlOiBcIm9jclwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAocmVuZGVyRXJyb3JzID4gMCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYub2NyLXJlbmRlci1lcnJvclwiLFxuICAgICAgICBkZXRhaWxzOiBgJHtyZW5kZXJFcnJvcnN9IHBhZ2UgcmVuZGVyIGVycm9yc2AsXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVtcHR5XCIsXG4gICAgICBkZXRhaWxzOiBcIk9DUiBwcm9kdWNlZCBpbnN1ZmZpY2llbnQgdGV4dFwiLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChPQ1IpIEVycm9yIGR1cmluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHdvcmtlcikge1xuICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBleHRyYWN0SW1hZ2VzRm9yUGFnZShwZGZqc0xpYjogUGRmSnNNb2R1bGUsIHBhZ2U6IGFueSk6IFByb21pc2U8RXh0cmFjdGVkT2NySW1hZ2VbXT4ge1xuICBjb25zdCBvcGVyYXRvckxpc3QgPSBhd2FpdCBwYWdlLmdldE9wZXJhdG9yTGlzdCgpO1xuICBjb25zdCBpbWFnZXM6IEV4dHJhY3RlZE9jckltYWdlW10gPSBbXTtcbiAgY29uc3QgaW1hZ2VEYXRhQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgUHJvbWlzZTxhbnkgfCBudWxsPj4oKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IG9wZXJhdG9yTGlzdC5mbkFycmF5Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgZm4gPSBvcGVyYXRvckxpc3QuZm5BcnJheVtpXTtcbiAgICBjb25zdCBhcmdzID0gb3BlcmF0b3JMaXN0LmFyZ3NBcnJheVtpXTtcblxuICAgIHRyeSB7XG4gICAgICBpZiAoZm4gPT09IHBkZmpzTGliLk9QUy5wYWludEltYWdlWE9iamVjdCB8fCBmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0UmVwZWF0KSB7XG4gICAgICAgIGNvbnN0IG9iaklkID0gYXJncz8uWzBdO1xuICAgICAgICBpZiAodHlwZW9mIG9iaklkICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGltZ0RhdGE7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaW1nRGF0YSA9IGF3YWl0IHJlc29sdmVJbWFnZURhdGEocGFnZSwgb2JqSWQsIGltYWdlRGF0YUNhY2hlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIHJlc29sdmUgaW1hZ2UgZGF0YTpcIiwgZXJyb3IpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaW1nRGF0YSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRJbWFnZURhdGFUb1BuZyhwZGZqc0xpYiwgaW1nRGF0YSk7XG4gICAgICAgIGlmIChjb252ZXJ0ZWQpIHtcbiAgICAgICAgICBpbWFnZXMucHVzaChjb252ZXJ0ZWQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbmxpbmVJbWFnZVhPYmplY3QgJiYgYXJncz8uWzBdKSB7XG4gICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRJbWFnZURhdGFUb1BuZyhwZGZqc0xpYiwgYXJnc1swXSk7XG4gICAgICAgIGlmIChjb252ZXJ0ZWQpIHtcbiAgICAgICAgICBpbWFnZXMucHVzaChjb252ZXJ0ZWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybihcIltQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gZXh0cmFjdCBpbmxpbmUgaW1hZ2U6XCIsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaW1hZ2VzXG4gICAgLmZpbHRlcigoaW1hZ2UpID0+IGltYWdlLmFyZWEgPj0gT0NSX01JTl9JTUFHRV9BUkVBKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmFyZWEgLSBhLmFyZWEpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlSW1hZ2VEYXRhKFxuICBwYWdlOiBhbnksXG4gIG9iaklkOiBzdHJpbmcsXG4gIGNhY2hlOiBNYXA8c3RyaW5nLCBQcm9taXNlPGFueSB8IG51bGw+Pixcbik6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICBpZiAoY2FjaGUuaGFzKG9iaklkKSkge1xuICAgIHJldHVybiBjYWNoZS5nZXQob2JqSWQpITtcbiAgfVxuXG4gIGNvbnN0IHByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIHBhZ2Uub2Jqcy5oYXMgPT09IFwiZnVuY3Rpb25cIiAmJiBwYWdlLm9ianMuaGFzKG9iaklkKSkge1xuICAgICAgICByZXR1cm4gcGFnZS5vYmpzLmdldChvYmpJZCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBmYWxsIHRocm91Z2ggdG8gYXN5bmMgcGF0aFxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgICAgbGV0IHRpbWVvdXRIYW5kbGU6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGNvbnN0IGNsZWFudXAgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aW1lb3V0SGFuZGxlKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpO1xuICAgICAgICAgIHRpbWVvdXRIYW5kbGUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBoYW5kbGVEYXRhID0gKGRhdGE6IGFueSkgPT4ge1xuICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcGFnZS5vYmpzLmdldChvYmpJZCwgaGFuZGxlRGF0YSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUoT0NSX0lNQUdFX1RJTUVPVVRfTVMpICYmIE9DUl9JTUFHRV9USU1FT1VUX01TID4gMCkge1xuICAgICAgICB0aW1lb3V0SGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgaWYgKCFzZXR0bGVkKSB7XG4gICAgICAgICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgSW1hZ2VEYXRhVGltZW91dEVycm9yKG9iaklkKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBPQ1JfSU1BR0VfVElNRU9VVF9NUyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pKCk7XG5cbiAgY2FjaGUuc2V0KG9iaklkLCBwcm9taXNlKTtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbWFnZURhdGFUb1BuZyhcbiAgcGRmanNMaWI6IFBkZkpzTW9kdWxlLFxuICBpbWdEYXRhOiBhbnksXG4pOiBFeHRyYWN0ZWRPY3JJbWFnZSB8IG51bGwge1xuICBpZiAoIWltZ0RhdGEgfHwgdHlwZW9mIGltZ0RhdGEud2lkdGggIT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIGltZ0RhdGEuaGVpZ2h0ICE9PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB7IHdpZHRoLCBoZWlnaHQsIGtpbmQsIGRhdGEgfSA9IGltZ0RhdGE7XG4gIGlmICghZGF0YSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgcG5nID0gbmV3IFBORyh7IHdpZHRoLCBoZWlnaHQgfSk7XG4gIGNvbnN0IGRlc3QgPSBwbmcuZGF0YTtcblxuICBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLlJHQkFfMzJCUFAgJiYgZGF0YS5sZW5ndGggPT09IHdpZHRoICogaGVpZ2h0ICogNCkge1xuICAgIGRlc3Quc2V0KEJ1ZmZlci5mcm9tKGRhdGEpKTtcbiAgfSBlbHNlIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuUkdCXzI0QlBQICYmIGRhdGEubGVuZ3RoID09PSB3aWR0aCAqIGhlaWdodCAqIDMpIHtcbiAgICBjb25zdCBzcmMgPSBkYXRhIGFzIFVpbnQ4QXJyYXk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGogPSAwOyBpIDwgc3JjLmxlbmd0aDsgaSArPSAzLCBqICs9IDQpIHtcbiAgICAgIGRlc3Rbal0gPSBzcmNbaV07XG4gICAgICBkZXN0W2ogKyAxXSA9IHNyY1tpICsgMV07XG4gICAgICBkZXN0W2ogKyAyXSA9IHNyY1tpICsgMl07XG4gICAgICBkZXN0W2ogKyAzXSA9IDI1NTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLkdSQVlTQ0FMRV8xQlBQKSB7XG4gICAgbGV0IHBpeGVsSW5kZXggPSAwO1xuICAgIGNvbnN0IHRvdGFsUGl4ZWxzID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgZm9yIChsZXQgYnl0ZUluZGV4ID0gMDsgYnl0ZUluZGV4IDwgZGF0YS5sZW5ndGggJiYgcGl4ZWxJbmRleCA8IHRvdGFsUGl4ZWxzOyBieXRlSW5kZXgrKykge1xuICAgICAgY29uc3QgYnl0ZSA9IGRhdGFbYnl0ZUluZGV4XTtcbiAgICAgIGZvciAobGV0IGJpdCA9IDc7IGJpdCA+PSAwICYmIHBpeGVsSW5kZXggPCB0b3RhbFBpeGVsczsgYml0LS0pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSAoYnl0ZSA+PiBiaXQpICYgMSA/IDI1NSA6IDA7XG4gICAgICAgIGNvbnN0IGRlc3RJbmRleCA9IHBpeGVsSW5kZXggKiA0O1xuICAgICAgICBkZXN0W2Rlc3RJbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAxXSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDJdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgM10gPSAyNTU7XG4gICAgICAgIHBpeGVsSW5kZXgrKztcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGJ1ZmZlcjogUE5HLnN5bmMud3JpdGUocG5nKSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgYXJlYTogd2lkdGggKiBoZWlnaHQsXG4gIH07XG59XG5cbi8qKlxuICogUGFyc2UgUERGIGZpbGVzIHdpdGggYSBtdWx0aS1zdGFnZSBzdHJhdGVneTpcbiAqIDEuIFVzZSBMTSBTdHVkaW8ncyBidWlsdC1pbiBkb2N1bWVudCBwYXJzZXIgKGZhc3QsIHNlcnZlci1zaWRlLCBtYXkgaW5jbHVkZSBPQ1IpXG4gKiAyLiBGYWxsYmFjayB0byBsb2NhbCBwZGYtcGFyc2UgZm9yIHRleHQtYmFzZWQgUERGc1xuICogMy4gSWYgc3RpbGwgbm8gdGV4dCBhbmQgT0NSIGlzIGVuYWJsZWQsIGZhbGxiYWNrIHRvIFBERi5qcyArIFRlc3NlcmFjdCBPQ1JcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlUERGKFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50LFxuICBlbmFibGVPQ1I6IGJvb2xlYW4sXG4pOiBQcm9taXNlPFBkZlBhcnNlclJlc3VsdD4ge1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICAvLyAxKSBMTSBTdHVkaW8gcGFyc2VyXG4gIGNvbnN0IGxtU3R1ZGlvUmVzdWx0ID0gYXdhaXQgdHJ5TG1TdHVkaW9QYXJzZXIoZmlsZVBhdGgsIGNsaWVudCk7XG4gIGlmIChsbVN0dWRpb1Jlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIGxtU3R1ZGlvUmVzdWx0O1xuICB9XG4gIGxldCBsYXN0RmFpbHVyZTogUGRmUGFyc2VyRmFpbHVyZSA9IGxtU3R1ZGlvUmVzdWx0O1xuXG4gIC8vIDIpIExvY2FsIHBkZi1wYXJzZSBmYWxsYmFja1xuICBjb25zdCBwZGZQYXJzZVJlc3VsdCA9IGF3YWl0IHRyeVBkZlBhcnNlKGZpbGVQYXRoKTtcbiAgaWYgKHBkZlBhcnNlUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gcGRmUGFyc2VSZXN1bHQ7XG4gIH1cbiAgbGFzdEZhaWx1cmUgPSBwZGZQYXJzZVJlc3VsdDtcblxuICAvLyAzKSBPQ1IgZmFsbGJhY2sgKG9ubHkgaWYgZW5hYmxlZClcbiAgaWYgKCFlbmFibGVPQ1IpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgRW5hYmxlIE9DUiBpcyBvZmYsIHNraXBwaW5nIE9DUiBmYWxsYmFjayBmb3IgJHtmaWxlTmFtZX0gYWZ0ZXIgb3RoZXIgbWV0aG9kcyByZXR1cm5lZCBubyB0ZXh0YCxcbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWRpc2FibGVkXCIsXG4gICAgICBkZXRhaWxzOiBgUHJldmlvdXMgZmFpbHVyZSByZWFzb246ICR7bGFzdEZhaWx1cmUucmVhc29ufWAsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKFxuICAgIGBbUERGIFBhcnNlcl0gKE9DUikgTm8gdGV4dCBleHRyYWN0ZWQgZnJvbSAke2ZpbGVOYW1lfSB3aXRoIExNIFN0dWRpbyBvciBwZGYtcGFyc2UsIGF0dGVtcHRpbmcgT0NSLi4uYCxcbiAgKTtcblxuICBjb25zdCBvY3JSZXN1bHQgPSBhd2FpdCB0cnlPY3JXaXRoUGRmSnMoZmlsZVBhdGgpO1xuICBpZiAob2NyUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gb2NyUmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIG9jclJlc3VsdDtcbn1cblxuIiwgIi8vIEB0cy1pZ25vcmUgLSBlcHViMiBkb2Vzbid0IGhhdmUgY29tcGxldGUgdHlwZXNcbmltcG9ydCB7IEVQdWIgfSBmcm9tIFwiZXB1YjJcIjtcblxuLyoqXG4gKiBQYXJzZSBFUFVCIGZpbGVzIGFuZCBleHRyYWN0IHRleHQgY29udGVudFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VFUFVCKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBlcHViID0gbmV3IEVQdWIoZmlsZVBhdGgpO1xuICAgICAgXG4gICAgICBlcHViLm9uKFwiZXJyb3JcIiwgKGVycm9yOiBFcnJvcikgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIEVQVUIgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgY29uc3Qgc3RyaXBIdG1sID0gKGlucHV0OiBzdHJpbmcpID0+XG4gICAgICAgIGlucHV0LnJlcGxhY2UoLzxbXj5dKj4vZywgXCIgXCIpO1xuXG4gICAgICBjb25zdCBnZXRNYW5pZmVzdEVudHJ5ID0gKGNoYXB0ZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiAoZXB1YiBhcyB1bmtub3duIGFzIHsgbWFuaWZlc3Q/OiBSZWNvcmQ8c3RyaW5nLCB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PiB9KS5tYW5pZmVzdD8uW2NoYXB0ZXJJZF07XG4gICAgICB9O1xuXG4gICAgICBjb25zdCBkZWNvZGVNZWRpYVR5cGUgPSAoZW50cnk/OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9KSA9PlxuICAgICAgICBlbnRyeT8uW1wibWVkaWEtdHlwZVwiXSB8fCBlbnRyeT8ubWVkaWFUeXBlIHx8IFwiXCI7XG5cbiAgICAgIGNvbnN0IHNob3VsZFJlYWRSYXcgPSAobWVkaWFUeXBlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG1lZGlhVHlwZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoIW5vcm1hbGl6ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkID09PSBcImFwcGxpY2F0aW9uL3hodG1sK3htbFwiIHx8IG5vcm1hbGl6ZWQgPT09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuc3RhcnRzV2l0aChcInRleHQvXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZC5pbmNsdWRlcyhcImh0bWxcIikpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVhZENoYXB0ZXIgPSBhc3luYyAoY2hhcHRlcklkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICAgICAgICBjb25zdCBtYW5pZmVzdEVudHJ5ID0gZ2V0TWFuaWZlc3RFbnRyeShjaGFwdGVySWQpO1xuICAgICAgICBpZiAoIW1hbmlmZXN0RW50cnkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oYEVQVUIgY2hhcHRlciAke2NoYXB0ZXJJZH0gbWlzc2luZyBtYW5pZmVzdCBlbnRyeSBpbiAke2ZpbGVQYXRofSwgc2tpcHBpbmdgKTtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lZGlhVHlwZSA9IGRlY29kZU1lZGlhVHlwZShtYW5pZmVzdEVudHJ5KTtcbiAgICAgICAgaWYgKHNob3VsZFJlYWRSYXcobWVkaWFUeXBlKSkge1xuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICAgIGVwdWIuZ2V0RmlsZShcbiAgICAgICAgICAgICAgY2hhcHRlcklkLFxuICAgICAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCwgZGF0YT86IEJ1ZmZlcikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgcmVqKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFkYXRhKSB7XG4gICAgICAgICAgICAgICAgICByZXMoXCJcIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJlcyhzdHJpcEh0bWwoZGF0YS50b1N0cmluZyhcInV0Zi04XCIpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgIGVwdWIuZ2V0Q2hhcHRlcihcbiAgICAgICAgICAgIGNoYXB0ZXJJZCxcbiAgICAgICAgICAgIChlcnJvcjogRXJyb3IgfCBudWxsLCB0ZXh0Pzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJlaihlcnJvcik7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRleHQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICByZXMoc3RyaXBIdG1sKHRleHQpKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMoXCJcIik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIGVwdWIub24oXCJlbmRcIiwgYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNoYXB0ZXJzID0gZXB1Yi5mbG93O1xuICAgICAgICAgIGNvbnN0IHRleHRQYXJ0czogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICBcbiAgICAgICAgICBmb3IgKGNvbnN0IGNoYXB0ZXIgb2YgY2hhcHRlcnMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNoYXB0ZXJJZCA9IGNoYXB0ZXIuaWQ7XG4gICAgICAgICAgICAgIGlmICghY2hhcHRlcklkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBFUFVCIGNoYXB0ZXIgbWlzc2luZyBpZCBpbiAke2ZpbGVQYXRofSwgc2tpcHBpbmdgKTtcbiAgICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaChcIlwiKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCByZWFkQ2hhcHRlcihjaGFwdGVySWQpO1xuICAgICAgICAgICAgICB0ZXh0UGFydHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGNoYXB0ZXJFcnJvcikge1xuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZWFkaW5nIGNoYXB0ZXIgJHtjaGFwdGVyLmlkfTpgLCBjaGFwdGVyRXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBmdWxsVGV4dCA9IHRleHRQYXJ0cy5qb2luKFwiXFxuXFxuXCIpO1xuICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICBmdWxsVGV4dFxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAgICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyBFUFVCIGNoYXB0ZXJzOmAsIGVycm9yKTtcbiAgICAgICAgICByZXNvbHZlKFwiXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZXB1Yi5wYXJzZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbml0aWFsaXppbmcgRVBVQiBwYXJzZXIgZm9yICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgfVxuICB9KTtcbn1cblxuIiwgImltcG9ydCB7IGNyZWF0ZVdvcmtlciB9IGZyb20gXCJ0ZXNzZXJhY3QuanNcIjtcblxuLyoqXG4gKiBQYXJzZSBpbWFnZSBmaWxlcyB1c2luZyBPQ1IgKFRlc3NlcmFjdClcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlSW1hZ2UoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qgd29ya2VyID0gYXdhaXQgY3JlYXRlV29ya2VyKFwiZW5nXCIpO1xuICAgIFxuICAgIGNvbnN0IHsgZGF0YTogeyB0ZXh0IH0gfSA9IGF3YWl0IHdvcmtlci5yZWNvZ25pemUoZmlsZVBhdGgpO1xuICAgIFxuICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICBcbiAgICByZXR1cm4gdGV4dFxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIGltYWdlIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZVRleHRPcHRpb25zIHtcbiAgc3RyaXBNYXJrZG93bj86IGJvb2xlYW47XG4gIHByZXNlcnZlTGluZUJyZWFrcz86IGJvb2xlYW47XG59XG5cbi8qKlxuICogUGFyc2UgcGxhaW4gdGV4dCBmaWxlcyAodHh0LCBtZCBhbmQgcmVsYXRlZCBmb3JtYXRzKVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VUZXh0KFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBvcHRpb25zOiBQYXJzZVRleHRPcHRpb25zID0ge30sXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCB7IHN0cmlwTWFya2Rvd24gPSBmYWxzZSwgcHJlc2VydmVMaW5lQnJlYWtzID0gZmFsc2UgfSA9IG9wdGlvbnM7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgsIFwidXRmLThcIik7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUxpbmVFbmRpbmdzKGNvbnRlbnQpO1xuXG4gICAgY29uc3Qgc3RyaXBwZWQgPSBzdHJpcE1hcmtkb3duID8gc3RyaXBNYXJrZG93blN5bnRheChub3JtYWxpemVkKSA6IG5vcm1hbGl6ZWQ7XG5cbiAgICByZXR1cm4gKHByZXNlcnZlTGluZUJyZWFrcyA/IGNvbGxhcHNlV2hpdGVzcGFjZUJ1dEtlZXBMaW5lcyhzdHJpcHBlZCkgOiBjb2xsYXBzZVdoaXRlc3BhY2Uoc3RyaXBwZWQpKS50cmltKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyB0ZXh0IGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUxpbmVFbmRpbmdzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxyXFxuPy9nLCBcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaW5wdXQucmVwbGFjZSgvXFxzKy9nLCBcIiBcIik7XG59XG5cbmZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZUJ1dEtlZXBMaW5lcyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIChcbiAgICBpbnB1dFxuICAgICAgLy8gVHJpbSB0cmFpbGluZyB3aGl0ZXNwYWNlIHBlciBsaW5lXG4gICAgICAucmVwbGFjZSgvWyBcXHRdK1xcbi9nLCBcIlxcblwiKVxuICAgICAgLy8gQ29sbGFwc2UgbXVsdGlwbGUgYmxhbmsgbGluZXMgYnV0IGtlZXAgcGFyYWdyYXBoIHNlcGFyYXRpb25cbiAgICAgIC5yZXBsYWNlKC9cXG57Myx9L2csIFwiXFxuXFxuXCIpXG4gICAgICAvLyBDb2xsYXBzZSBpbnRlcm5hbCBzcGFjZXMvdGFic1xuICAgICAgLnJlcGxhY2UoL1sgXFx0XXsyLH0vZywgXCIgXCIpXG4gICk7XG59XG5cbmZ1bmN0aW9uIHN0cmlwTWFya2Rvd25TeW50YXgoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBvdXRwdXQgPSBpbnB1dDtcblxuICAvLyBSZW1vdmUgZmVuY2VkIGNvZGUgYmxvY2tzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9gYGBbXFxzXFxTXSo/YGBgL2csIFwiIFwiKTtcbiAgLy8gUmVtb3ZlIGlubGluZSBjb2RlXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9gKFteYF0rKWAvZywgXCIkMVwiKTtcbiAgLy8gUmVwbGFjZSBpbWFnZXMgd2l0aCBhbHQgdGV4dFxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvIVxcWyhbXlxcXV0qKVxcXVxcKFteKV0qXFwpL2csIFwiJDEgXCIpO1xuICAvLyBSZXBsYWNlIGxpbmtzIHdpdGggbGluayB0ZXh0XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9cXFsoW15cXF1dKylcXF1cXChbXildKlxcKS9nLCBcIiQxXCIpO1xuICAvLyBSZW1vdmUgZW1waGFzaXMgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvKFxcKlxcKnxfXykoLio/KVxcMS9nLCBcIiQyXCIpO1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvKFxcKnxfKSguKj8pXFwxL2csIFwiJDJcIik7XG4gIC8vIFJlbW92ZSBoZWFkaW5nc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9I3sxLDZ9XFxzKy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSBibG9jayBxdW90ZXNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfT5cXHM/L2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIHVub3JkZXJlZCBsaXN0IG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfVstKitdXFxzKy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSBvcmRlcmVkIGxpc3QgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9XFxkK1tcXC5cXCldXFxzKy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSBob3Jpem9udGFsIHJ1bGVzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30oWy0qX11cXHM/KXszLH0kL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIHJlc2lkdWFsIEhUTUwgdGFnc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvPFtePl0rPi9nLCBcIiBcIik7XG5cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuIiwgImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHBhcnNlSFRNTCB9IGZyb20gXCIuL2h0bWxQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlUERGLCB0eXBlIFBkZkZhaWx1cmVSZWFzb24gfSBmcm9tIFwiLi9wZGZQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlRVBVQiB9IGZyb20gXCIuL2VwdWJQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlSW1hZ2UgfSBmcm9tIFwiLi9pbWFnZVBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VUZXh0IH0gZnJvbSBcIi4vdGV4dFBhcnNlclwiO1xuaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQge1xuICBJTUFHRV9FWFRFTlNJT05fU0VULFxuICBpc0h0bWxFeHRlbnNpb24sXG4gIGlzTWFya2Rvd25FeHRlbnNpb24sXG4gIGlzUGxhaW5UZXh0RXh0ZW5zaW9uLFxuICBpc1RleHR1YWxFeHRlbnNpb24sXG59IGZyb20gXCIuLi91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VkRG9jdW1lbnQge1xuICB0ZXh0OiBzdHJpbmc7XG4gIG1ldGFkYXRhOiB7XG4gICAgZmlsZVBhdGg6IHN0cmluZztcbiAgICBmaWxlTmFtZTogc3RyaW5nO1xuICAgIGV4dGVuc2lvbjogc3RyaW5nO1xuICAgIHBhcnNlZEF0OiBEYXRlO1xuICB9O1xufVxuXG5leHBvcnQgdHlwZSBQYXJzZUZhaWx1cmVSZWFzb24gPVxuICB8IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCJcbiAgfCBcInBkZi5taXNzaW5nLWNsaWVudFwiXG4gIHwgUGRmRmFpbHVyZVJlYXNvblxuICB8IFwiZXB1Yi5lbXB0eVwiXG4gIHwgXCJodG1sLmVtcHR5XCJcbiAgfCBcImh0bWwuZXJyb3JcIlxuICB8IFwidGV4dC5lbXB0eVwiXG4gIHwgXCJ0ZXh0LmVycm9yXCJcbiAgfCBcImltYWdlLm9jci1kaXNhYmxlZFwiXG4gIHwgXCJpbWFnZS5lbXB0eVwiXG4gIHwgXCJpbWFnZS5lcnJvclwiXG4gIHwgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiO1xuXG5leHBvcnQgdHlwZSBEb2N1bWVudFBhcnNlUmVzdWx0ID1cbiAgfCB7IHN1Y2Nlc3M6IHRydWU7IGRvY3VtZW50OiBQYXJzZWREb2N1bWVudCB9XG4gIHwgeyBzdWNjZXNzOiBmYWxzZTsgcmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb247IGRldGFpbHM/OiBzdHJpbmcgfTtcblxuLyoqXG4gKiBQYXJzZSBhIGRvY3VtZW50IGZpbGUgYmFzZWQgb24gaXRzIGV4dGVuc2lvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VEb2N1bWVudChcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgZW5hYmxlT0NSOiBib29sZWFuID0gZmFsc2UsXG4gIGNsaWVudD86IExNU3R1ZGlvQ2xpZW50LFxuKTogUHJvbWlzZTxEb2N1bWVudFBhcnNlUmVzdWx0PiB7XG4gIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKTtcblxuICBjb25zdCBidWlsZFN1Y2Nlc3MgPSAodGV4dDogc3RyaW5nKTogRG9jdW1lbnRQYXJzZVJlc3VsdCA9PiAoe1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgZG9jdW1lbnQ6IHtcbiAgICAgIHRleHQsXG4gICAgICBtZXRhZGF0YToge1xuICAgICAgICBmaWxlUGF0aCxcbiAgICAgICAgZmlsZU5hbWUsXG4gICAgICAgIGV4dGVuc2lvbjogZXh0LFxuICAgICAgICBwYXJzZWRBdDogbmV3IERhdGUoKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSk7XG5cbiAgdHJ5IHtcbiAgICBpZiAoaXNIdG1sRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBjbGVhbkFuZFZhbGlkYXRlKFxuICAgICAgICAgIGF3YWl0IHBhcnNlSFRNTChmaWxlUGF0aCksXG4gICAgICAgICAgXCJodG1sLmVtcHR5XCIsXG4gICAgICAgICAgYCR7ZmlsZU5hbWV9IGh0bWxgLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGV4dC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKHRleHQudmFsdWUpIDogdGV4dDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW0hUTUxdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJodG1sLmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLnBkZlwiKSB7XG4gICAgICBpZiAoIWNsaWVudCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYFtQYXJzZXJdIE5vIExNIFN0dWRpbyBjbGllbnQgYXZhaWxhYmxlIGZvciBQREYgcGFyc2luZzogJHtmaWxlTmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJwZGYubWlzc2luZy1jbGllbnRcIiB9O1xuICAgICAgfVxuICAgICAgY29uc3QgcGRmUmVzdWx0ID0gYXdhaXQgcGFyc2VQREYoZmlsZVBhdGgsIGNsaWVudCwgZW5hYmxlT0NSKTtcbiAgICAgIGlmIChwZGZSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICByZXR1cm4gYnVpbGRTdWNjZXNzKHBkZlJlc3VsdC50ZXh0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwZGZSZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIuZXB1YlwiKSB7XG4gICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VFUFVCKGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwiZXB1Yi5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICB9XG5cbiAgICBpZiAoaXNUZXh0dWFsRXh0ZW5zaW9uKGV4dCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZVRleHQoZmlsZVBhdGgsIHtcbiAgICAgICAgICBzdHJpcE1hcmtkb3duOiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dCksXG4gICAgICAgICAgcHJlc2VydmVMaW5lQnJlYWtzOiBpc1BsYWluVGV4dEV4dGVuc2lvbihleHQpLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJ0ZXh0LmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtUZXh0XSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwidGV4dC5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoSU1BR0VfRVhURU5TSU9OX1NFVC5oYXMoZXh0KSkge1xuICAgICAgaWYgKCFlbmFibGVPQ1IpIHtcbiAgICAgICAgY29uc29sZS5sb2coYFNraXBwaW5nIGltYWdlIGZpbGUgJHtmaWxlUGF0aH0gKE9DUiBkaXNhYmxlZClgKTtcbiAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJpbWFnZS5vY3ItZGlzYWJsZWRcIiB9O1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlSW1hZ2UoZmlsZVBhdGgpO1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcImltYWdlLmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtJbWFnZV0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcImltYWdlLmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLnJhclwiKSB7XG4gICAgICBjb25zb2xlLmxvZyhgUkFSIGZpbGVzIG5vdCB5ZXQgc3VwcG9ydGVkOiAke2ZpbGVQYXRofWApO1xuICAgICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIiwgZGV0YWlsczogXCIucmFyXCIgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhgVW5zdXBwb3J0ZWQgZmlsZSB0eXBlOiAke2ZpbGVQYXRofWApO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCIsIGRldGFpbHM6IGV4dCB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgZG9jdW1lbnQgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiLFxuICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgIH07XG4gIH1cbn1cblxudHlwZSBDbGVhblJlc3VsdCA9XG4gIHwgeyBzdWNjZXNzOiB0cnVlOyB2YWx1ZTogc3RyaW5nIH1cbiAgfCB7IHN1Y2Nlc3M6IGZhbHNlOyByZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbjsgZGV0YWlscz86IHN0cmluZyB9O1xuXG5mdW5jdGlvbiBjbGVhbkFuZFZhbGlkYXRlKFxuICB0ZXh0OiBzdHJpbmcsXG4gIGVtcHR5UmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb24sXG4gIGRldGFpbHNDb250ZXh0Pzogc3RyaW5nLFxuKTogQ2xlYW5SZXN1bHQge1xuICBjb25zdCBjbGVhbmVkID0gdGV4dD8udHJpbSgpID8/IFwiXCI7XG4gIGlmIChjbGVhbmVkLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogZW1wdHlSZWFzb24sXG4gICAgICBkZXRhaWxzOiBkZXRhaWxzQ29udGV4dCA/IGAke2RldGFpbHNDb250ZXh0fSB0cmltbWVkIHRvIHplcm8gbGVuZ3RoYCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG4gIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHZhbHVlOiBjbGVhbmVkIH07XG59XG5cbiIsICIvKipcbiAqIFNpbXBsZSB0ZXh0IGNodW5rZXIgdGhhdCBzcGxpdHMgdGV4dCBpbnRvIG92ZXJsYXBwaW5nIGNodW5rc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2h1bmtUZXh0KFxuICB0ZXh0OiBzdHJpbmcsXG4gIGNodW5rU2l6ZTogbnVtYmVyLFxuICBvdmVybGFwOiBudW1iZXIsXG4pOiBBcnJheTx7IHRleHQ6IHN0cmluZzsgc3RhcnRJbmRleDogbnVtYmVyOyBlbmRJbmRleDogbnVtYmVyIH0+IHtcbiAgY29uc3QgY2h1bmtzOiBBcnJheTx7IHRleHQ6IHN0cmluZzsgc3RhcnRJbmRleDogbnVtYmVyOyBlbmRJbmRleDogbnVtYmVyIH0+ID0gW107XG4gIFxuICAvLyBTaW1wbGUgd29yZC1iYXNlZCBjaHVua2luZ1xuICBjb25zdCB3b3JkcyA9IHRleHQuc3BsaXQoL1xccysvKTtcbiAgXG4gIGlmICh3b3Jkcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gY2h1bmtzO1xuICB9XG4gIFxuICBsZXQgc3RhcnRJZHggPSAwO1xuICBcbiAgd2hpbGUgKHN0YXJ0SWR4IDwgd29yZHMubGVuZ3RoKSB7XG4gICAgY29uc3QgZW5kSWR4ID0gTWF0aC5taW4oc3RhcnRJZHggKyBjaHVua1NpemUsIHdvcmRzLmxlbmd0aCk7XG4gICAgY29uc3QgY2h1bmtXb3JkcyA9IHdvcmRzLnNsaWNlKHN0YXJ0SWR4LCBlbmRJZHgpO1xuICAgIGNvbnN0IGNodW5rVGV4dCA9IGNodW5rV29yZHMuam9pbihcIiBcIik7XG4gICAgXG4gICAgY2h1bmtzLnB1c2goe1xuICAgICAgdGV4dDogY2h1bmtUZXh0LFxuICAgICAgc3RhcnRJbmRleDogc3RhcnRJZHgsXG4gICAgICBlbmRJbmRleDogZW5kSWR4LFxuICAgIH0pO1xuICAgIFxuICAgIC8vIE1vdmUgZm9yd2FyZCBieSAoY2h1bmtTaXplIC0gb3ZlcmxhcCkgdG8gY3JlYXRlIG92ZXJsYXBwaW5nIGNodW5rc1xuICAgIHN0YXJ0SWR4ICs9IE1hdGgubWF4KDEsIGNodW5rU2l6ZSAtIG92ZXJsYXApO1xuICAgIFxuICAgIC8vIEJyZWFrIGlmIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgIGlmIChlbmRJZHggPj0gd29yZHMubGVuZ3RoKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiBjaHVua3M7XG59XG5cbi8qKlxuICogRXN0aW1hdGUgdG9rZW4gY291bnQgKHJvdWdoIGFwcHJveGltYXRpb246IDEgdG9rZW4gXHUyMjQ4IDQgY2hhcmFjdGVycylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVzdGltYXRlVG9rZW5Db3VudCh0ZXh0OiBzdHJpbmcpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5jZWlsKHRleHQubGVuZ3RoIC8gNCk7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBjcnlwdG8gZnJvbSBcImNyeXB0b1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbi8qKlxuICogQ2FsY3VsYXRlIFNIQS0yNTYgaGFzaCBvZiBhIGZpbGUgZm9yIGNoYW5nZSBkZXRlY3Rpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGhhc2ggPSBjcnlwdG8uY3JlYXRlSGFzaChcInNoYTI1NlwiKTtcbiAgICBjb25zdCBzdHJlYW0gPSBmcy5jcmVhdGVSZWFkU3RyZWFtKGZpbGVQYXRoKTtcbiAgICBcbiAgICBzdHJlYW0ub24oXCJkYXRhXCIsIChkYXRhKSA9PiBoYXNoLnVwZGF0ZShkYXRhKSk7XG4gICAgc3RyZWFtLm9uKFwiZW5kXCIsICgpID0+IHJlc29sdmUoaGFzaC5kaWdlc3QoXCJoZXhcIikpKTtcbiAgICBzdHJlYW0ub24oXCJlcnJvclwiLCByZWplY3QpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBHZXQgZmlsZSBtZXRhZGF0YSBpbmNsdWRpbmcgc2l6ZSBhbmQgbW9kaWZpY2F0aW9uIHRpbWVcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEZpbGVNZXRhZGF0YShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx7XG4gIHNpemU6IG51bWJlcjtcbiAgbXRpbWU6IERhdGU7XG4gIGhhc2g6IHN0cmluZztcbn0+IHtcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0KGZpbGVQYXRoKTtcbiAgY29uc3QgaGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoKTtcbiAgXG4gIHJldHVybiB7XG4gICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICBtdGltZTogc3RhdHMubXRpbWUsXG4gICAgaGFzaCxcbiAgfTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmcy9wcm9taXNlc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5pbnRlcmZhY2UgRmFpbGVkRmlsZUVudHJ5IHtcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgcmVhc29uOiBzdHJpbmc7XG4gIHRpbWVzdGFtcDogc3RyaW5nO1xufVxuXG4vKipcbiAqIFRyYWNrcyBmaWxlcyB0aGF0IGZhaWxlZCBpbmRleGluZyBmb3IgYSBnaXZlbiBoYXNoIHNvIHdlIGNhbiBza2lwIHRoZW1cbiAqIHdoZW4gYXV0by1yZWluZGV4aW5nIHVuY2hhbmdlZCBkYXRhLlxuICovXG5leHBvcnQgY2xhc3MgRmFpbGVkRmlsZVJlZ2lzdHJ5IHtcbiAgcHJpdmF0ZSBsb2FkZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSBlbnRyaWVzOiBSZWNvcmQ8c3RyaW5nLCBGYWlsZWRGaWxlRW50cnk+ID0ge307XG4gIHByaXZhdGUgcXVldWU6IFByb21pc2U8dm9pZD4gPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHJlZ2lzdHJ5UGF0aDogc3RyaW5nKSB7fVxuXG4gIHByaXZhdGUgYXN5bmMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5sb2FkZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZSh0aGlzLnJlZ2lzdHJ5UGF0aCwgXCJ1dGYtOFwiKTtcbiAgICAgIHRoaXMuZW50cmllcyA9IEpTT04ucGFyc2UoZGF0YSkgPz8ge307XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLmVudHJpZXMgPSB7fTtcbiAgICB9XG4gICAgdGhpcy5sb2FkZWQgPSB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwZXJzaXN0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGZzLm1rZGlyKHBhdGguZGlybmFtZSh0aGlzLnJlZ2lzdHJ5UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZSh0aGlzLnJlZ2lzdHJ5UGF0aCwgSlNPTi5zdHJpbmdpZnkodGhpcy5lbnRyaWVzLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcbiAgfVxuXG4gIHByaXZhdGUgcnVuRXhjbHVzaXZlPFQ+KG9wZXJhdGlvbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucXVldWUudGhlbihvcGVyYXRpb24pO1xuICAgIHRoaXMucXVldWUgPSByZXN1bHQudGhlbihcbiAgICAgICgpID0+IHt9LFxuICAgICAgKCkgPT4ge30sXG4gICAgKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYXN5bmMgcmVjb3JkRmFpbHVyZShmaWxlUGF0aDogc3RyaW5nLCBmaWxlSGFzaDogc3RyaW5nLCByZWFzb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLnJ1bkV4Y2x1c2l2ZShhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgIHRoaXMuZW50cmllc1tmaWxlUGF0aF0gPSB7XG4gICAgICAgIGZpbGVIYXNoLFxuICAgICAgICByZWFzb24sXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgfTtcbiAgICAgIGF3YWl0IHRoaXMucGVyc2lzdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2xlYXJGYWlsdXJlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICBpZiAodGhpcy5lbnRyaWVzW2ZpbGVQYXRoXSkge1xuICAgICAgICBkZWxldGUgdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXTtcbiAgICAgICAgYXdhaXQgdGhpcy5wZXJzaXN0KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRGYWlsdXJlUmVhc29uKGZpbGVQYXRoOiBzdHJpbmcsIGZpbGVIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5lbnRyaWVzW2ZpbGVQYXRoXTtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnkuZmlsZUhhc2ggPT09IGZpbGVIYXNoID8gZW50cnkucmVhc29uIDogdW5kZWZpbmVkO1xuICB9XG59XG5cbiIsICJpbXBvcnQgUFF1ZXVlIGZyb20gXCJwLXF1ZXVlXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHNjYW5EaXJlY3RvcnksIHR5cGUgU2Nhbm5lZEZpbGUgfSBmcm9tIFwiLi9maWxlU2Nhbm5lclwiO1xuaW1wb3J0IHsgcGFyc2VEb2N1bWVudCwgdHlwZSBQYXJzZUZhaWx1cmVSZWFzb24gfSBmcm9tIFwiLi4vcGFyc2Vycy9kb2N1bWVudFBhcnNlclwiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUsIHR5cGUgRG9jdW1lbnRDaHVuayB9IGZyb20gXCIuLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuaW1wb3J0IHsgY2h1bmtUZXh0IH0gZnJvbSBcIi4uL3V0aWxzL3RleHRDaHVua2VyXCI7XG5pbXBvcnQgeyBjYWxjdWxhdGVGaWxlSGFzaCB9IGZyb20gXCIuLi91dGlscy9maWxlSGFzaFwiO1xuaW1wb3J0IHsgdHlwZSBFbWJlZGRpbmdEeW5hbWljSGFuZGxlLCB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IEZhaWxlZEZpbGVSZWdpc3RyeSB9IGZyb20gXCIuLi91dGlscy9mYWlsZWRGaWxlUmVnaXN0cnlcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ1Byb2dyZXNzIHtcbiAgdG90YWxGaWxlczogbnVtYmVyO1xuICBwcm9jZXNzZWRGaWxlczogbnVtYmVyO1xuICBjdXJyZW50RmlsZTogc3RyaW5nO1xuICBzdGF0dXM6IFwic2Nhbm5pbmdcIiB8IFwiaW5kZXhpbmdcIiB8IFwiY29tcGxldGVcIiB8IFwiZXJyb3JcIjtcbiAgc3VjY2Vzc2Z1bEZpbGVzPzogbnVtYmVyO1xuICBmYWlsZWRGaWxlcz86IG51bWJlcjtcbiAgc2tpcHBlZEZpbGVzPzogbnVtYmVyO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ1Jlc3VsdCB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgc3VjY2Vzc2Z1bEZpbGVzOiBudW1iZXI7XG4gIGZhaWxlZEZpbGVzOiBudW1iZXI7XG4gIHNraXBwZWRGaWxlczogbnVtYmVyO1xuICB1cGRhdGVkRmlsZXM6IG51bWJlcjtcbiAgbmV3RmlsZXM6IG51bWJlcjtcbn1cblxudHlwZSBGaWxlSW5kZXhPdXRjb21lID1cbiAgfCB7IHR5cGU6IFwic2tpcHBlZFwiIH1cbiAgfCB7IHR5cGU6IFwiaW5kZXhlZFwiOyBjaGFuZ2VUeXBlOiBcIm5ld1wiIHwgXCJ1cGRhdGVkXCIgfVxuICB8IHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4aW5nT3B0aW9ucyB7XG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nO1xuICB2ZWN0b3JTdG9yZTogVmVjdG9yU3RvcmU7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGVtYmVkZGluZ01vZGVsOiBFbWJlZGRpbmdEeW5hbWljSGFuZGxlO1xuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50O1xuICBjaHVua1NpemU6IG51bWJlcjtcbiAgY2h1bmtPdmVybGFwOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgZW5hYmxlT0NSOiBib29sZWFuO1xuICBhdXRvUmVpbmRleDogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIGZhaWx1cmVSZXBvcnRQYXRoPzogc3RyaW5nO1xuICBvblByb2dyZXNzPzogKHByb2dyZXNzOiBJbmRleGluZ1Byb2dyZXNzKSA9PiB2b2lkO1xufVxuXG50eXBlIEZhaWx1cmVSZWFzb24gPSBQYXJzZUZhaWx1cmVSZWFzb24gfCBcImluZGV4LmNodW5rLWVtcHR5XCIgfCBcImluZGV4LnZlY3Rvci1hZGQtZXJyb3JcIjtcblxuZnVuY3Rpb24gY29lcmNlRW1iZWRkaW5nVmVjdG9yKHJhdzogdW5rbm93bik6IG51bWJlcltdIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkocmF3KSkge1xuICAgIHJldHVybiByYXcubWFwKGFzc2VydEZpbml0ZU51bWJlcik7XG4gIH1cblxuICBpZiAodHlwZW9mIHJhdyA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBbYXNzZXJ0RmluaXRlTnVtYmVyKHJhdyldO1xuICB9XG5cbiAgaWYgKHJhdyAmJiB0eXBlb2YgcmF3ID09PSBcIm9iamVjdFwiKSB7XG4gICAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhyYXcpKSB7XG4gICAgICByZXR1cm4gQXJyYXkuZnJvbShyYXcgYXMgdW5rbm93biBhcyBBcnJheUxpa2U8bnVtYmVyPikubWFwKGFzc2VydEZpbml0ZU51bWJlcik7XG4gICAgfVxuXG4gICAgY29uc3QgY2FuZGlkYXRlID1cbiAgICAgIChyYXcgYXMgYW55KS5lbWJlZGRpbmcgPz9cbiAgICAgIChyYXcgYXMgYW55KS52ZWN0b3IgPz9cbiAgICAgIChyYXcgYXMgYW55KS5kYXRhID8/XG4gICAgICAodHlwZW9mIChyYXcgYXMgYW55KS50b0FycmF5ID09PSBcImZ1bmN0aW9uXCIgPyAocmF3IGFzIGFueSkudG9BcnJheSgpIDogdW5kZWZpbmVkKSA/P1xuICAgICAgKHR5cGVvZiAocmF3IGFzIGFueSkudG9KU09OID09PSBcImZ1bmN0aW9uXCIgPyAocmF3IGFzIGFueSkudG9KU09OKCkgOiB1bmRlZmluZWQpO1xuXG4gICAgaWYgKGNhbmRpZGF0ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gY29lcmNlRW1iZWRkaW5nVmVjdG9yKGNhbmRpZGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEVycm9yKFwiRW1iZWRkaW5nIHByb3ZpZGVyIHJldHVybmVkIGEgbm9uLW51bWVyaWMgdmVjdG9yXCIpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRGaW5pdGVOdW1iZXIodmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCBudW0gPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSA6IE51bWJlcih2YWx1ZSk7XG4gIGlmICghTnVtYmVyLmlzRmluaXRlKG51bSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJFbWJlZGRpbmcgdmVjdG9yIGNvbnRhaW5zIGEgbm9uLWZpbml0ZSB2YWx1ZVwiKTtcbiAgfVxuICByZXR1cm4gbnVtO1xufVxuXG5leHBvcnQgY2xhc3MgSW5kZXhNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBxdWV1ZTogUFF1ZXVlO1xuICBwcml2YXRlIG9wdGlvbnM6IEluZGV4aW5nT3B0aW9ucztcbiAgcHJpdmF0ZSBmYWlsdXJlUmVhc29uQ291bnRzOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gIHByaXZhdGUgZmFpbGVkRmlsZVJlZ2lzdHJ5OiBGYWlsZWRGaWxlUmVnaXN0cnk7XG5cbiAgY29uc3RydWN0b3Iob3B0aW9uczogSW5kZXhpbmdPcHRpb25zKSB7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLnF1ZXVlID0gbmV3IFBRdWV1ZSh7IGNvbmN1cnJlbmN5OiBvcHRpb25zLm1heENvbmN1cnJlbnQgfSk7XG4gICAgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkgPSBuZXcgRmFpbGVkRmlsZVJlZ2lzdHJ5KFxuICAgICAgcGF0aC5qb2luKG9wdGlvbnMudmVjdG9yU3RvcmVEaXIsIFwiLmJpZy1yYWctZmFpbHVyZXMuanNvblwiKSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHRoZSBpbmRleGluZyBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBpbmRleCgpOiBQcm9taXNlPEluZGV4aW5nUmVzdWx0PiB7XG4gICAgY29uc3QgeyBkb2N1bWVudHNEaXIsIHZlY3RvclN0b3JlLCBvblByb2dyZXNzIH0gPSB0aGlzLm9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUludmVudG9yeSA9IGF3YWl0IHZlY3RvclN0b3JlLmdldEZpbGVIYXNoSW52ZW50b3J5KCk7XG5cbiAgICAgIC8vIFN0ZXAgMTogU2NhbiBkaXJlY3RvcnlcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IDAsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcInNjYW5uaW5nXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlcyA9IGF3YWl0IHNjYW5EaXJlY3RvcnkoZG9jdW1lbnRzRGlyLCAoc2Nhbm5lZCwgZm91bmQpID0+IHtcbiAgICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZvdW5kLFxuICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgICBjdXJyZW50RmlsZTogYFNjYW5uZWQgJHtzY2FubmVkfSBmaWxlcy4uLmAsXG4gICAgICAgICAgICBzdGF0dXM6IFwic2Nhbm5pbmdcIixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2ZpbGVzLmxlbmd0aH0gZmlsZXMgdG8gcHJvY2Vzc2ApO1xuXG4gICAgICAvLyBTdGVwIDI6IEluZGV4IGZpbGVzXG4gICAgICBsZXQgcHJvY2Vzc2VkQ291bnQgPSAwO1xuICAgICAgbGV0IHN1Y2Nlc3NDb3VudCA9IDA7XG4gICAgICBsZXQgZmFpbENvdW50ID0gMDtcbiAgICAgIGxldCBza2lwcGVkQ291bnQgPSAwO1xuICAgICAgbGV0IHVwZGF0ZWRDb3VudCA9IDA7XG4gICAgICBsZXQgbmV3Q291bnQgPSAwO1xuXG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IGZpbGVzWzBdPy5uYW1lID8/IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBQcm9jZXNzIGZpbGVzIGluIGJhdGNoZXNcbiAgICAgIGNvbnN0IHRhc2tzID0gZmlsZXMubWFwKChmaWxlKSA9PlxuICAgICAgICB0aGlzLnF1ZXVlLmFkZChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgbGV0IG91dGNvbWU6IEZpbGVJbmRleE91dGNvbWUgPSB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiBwcm9jZXNzZWRDb3VudCxcbiAgICAgICAgICAgICAgICBjdXJyZW50RmlsZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICAgICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgICAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvdXRjb21lID0gYXdhaXQgdGhpcy5pbmRleEZpbGUoZmlsZSwgZmlsZUludmVudG9yeSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluZGV4aW5nIGZpbGUgJHtmaWxlLnBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcbiAgICAgICAgICAgICAgXCJwYXJzZXIudW5leHBlY3RlZC1lcnJvclwiLFxuICAgICAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHByb2Nlc3NlZENvdW50Kys7XG4gICAgICAgICAgc3dpdGNoIChvdXRjb21lLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJza2lwcGVkXCI6XG4gICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgICBza2lwcGVkQ291bnQrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiaW5kZXhlZFwiOlxuICAgICAgICAgICAgICBzdWNjZXNzQ291bnQrKztcbiAgICAgICAgICAgICAgaWYgKG91dGNvbWUuY2hhbmdlVHlwZSA9PT0gXCJuZXdcIikge1xuICAgICAgICAgICAgICAgIG5ld0NvdW50Kys7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlZENvdW50Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZmFpbGVkXCI6XG4gICAgICAgICAgICAgIGZhaWxDb3VudCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IHByb2Nlc3NlZENvdW50LFxuICAgICAgICAgICAgICBjdXJyZW50RmlsZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwodGFza3MpO1xuXG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IHByb2Nlc3NlZENvdW50LFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJjb21wbGV0ZVwiLFxuICAgICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxvZ0ZhaWx1cmVTdW1tYXJ5KCk7XG4gICAgICBhd2FpdCB0aGlzLndyaXRlRmFpbHVyZVJlcG9ydCh7XG4gICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgc3VjY2Vzc2Z1bEZpbGVzOiBzdWNjZXNzQ291bnQsXG4gICAgICAgIGZhaWxlZEZpbGVzOiBmYWlsQ291bnQsXG4gICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB1cGRhdGVkRmlsZXM6IHVwZGF0ZWRDb3VudCxcbiAgICAgICAgbmV3RmlsZXM6IG5ld0NvdW50LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICBgSW5kZXhpbmcgY29tcGxldGU6ICR7c3VjY2Vzc0NvdW50fS8ke2ZpbGVzLmxlbmd0aH0gZmlsZXMgc3VjY2Vzc2Z1bGx5IGluZGV4ZWQgKCR7ZmFpbENvdW50fSBmYWlsZWQsIHNraXBwZWQ9JHtza2lwcGVkQ291bnR9LCB1cGRhdGVkPSR7dXBkYXRlZENvdW50fSwgbmV3PSR7bmV3Q291bnR9KWAsXG4gICAgICApO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgdXBkYXRlZEZpbGVzOiB1cGRhdGVkQ291bnQsXG4gICAgICAgIG5ld0ZpbGVzOiBuZXdDb3VudCxcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBkdXJpbmcgaW5kZXhpbmc6XCIsIGVycm9yKTtcbiAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgIHRvdGFsRmlsZXM6IDAsXG4gICAgICAgICAgcHJvY2Vzc2VkRmlsZXM6IDAsXG4gICAgICAgICAgY3VycmVudEZpbGU6IFwiXCIsXG4gICAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5kZXggYSBzaW5nbGUgZmlsZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBpbmRleEZpbGUoXG4gICAgZmlsZTogU2Nhbm5lZEZpbGUsXG4gICAgZmlsZUludmVudG9yeTogTWFwPHN0cmluZywgU2V0PHN0cmluZz4+ID0gbmV3IE1hcCgpLFxuICApOiBQcm9taXNlPEZpbGVJbmRleE91dGNvbWU+IHtcbiAgICBjb25zdCB7IHZlY3RvclN0b3JlLCBlbWJlZGRpbmdNb2RlbCwgY2xpZW50LCBjaHVua1NpemUsIGNodW5rT3ZlcmxhcCwgZW5hYmxlT0NSLCBhdXRvUmVpbmRleCB9ID1cbiAgICAgIHRoaXMub3B0aW9ucztcblxuICAgIGxldCBmaWxlSGFzaDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIHRyeSB7XG4gICAgICAvLyBDYWxjdWxhdGUgZmlsZSBoYXNoXG4gICAgICBmaWxlSGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBleGlzdGluZ0hhc2hlcyA9IGZpbGVJbnZlbnRvcnkuZ2V0KGZpbGUucGF0aCk7XG4gICAgICBjb25zdCBoYXNTZWVuQmVmb3JlID0gZXhpc3RpbmdIYXNoZXMgIT09IHVuZGVmaW5lZCAmJiBleGlzdGluZ0hhc2hlcy5zaXplID4gMDtcbiAgICAgIGNvbnN0IGhhc1NhbWVIYXNoID0gZXhpc3RpbmdIYXNoZXM/LmhhcyhmaWxlSGFzaCkgPz8gZmFsc2U7XG5cbiAgICAgIC8vIENoZWNrIGlmIGZpbGUgYWxyZWFkeSBpbmRleGVkXG4gICAgICBpZiAoYXV0b1JlaW5kZXggJiYgaGFzU2FtZUhhc2gpIHtcbiAgICAgICAgY29uc29sZS5sb2coYEZpbGUgYWxyZWFkeSBpbmRleGVkIChza2lwcGVkKTogJHtmaWxlLm5hbWV9YCk7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwic2tpcHBlZFwiIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChhdXRvUmVpbmRleCkge1xuICAgICAgICBjb25zdCBwcmV2aW91c0ZhaWx1cmUgPSBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5nZXRGYWlsdXJlUmVhc29uKGZpbGUucGF0aCwgZmlsZUhhc2gpO1xuICAgICAgICBpZiAocHJldmlvdXNGYWlsdXJlKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgRmlsZSBwcmV2aW91c2x5IGZhaWxlZCAoc2tpcHBlZCk6ICR7ZmlsZS5uYW1lfSAocmVhc29uPSR7cHJldmlvdXNGYWlsdXJlfSlgLFxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJza2lwcGVkXCIgfTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBXYWl0IGJlZm9yZSBwYXJzaW5nIHRvIHJlZHVjZSBXZWJTb2NrZXQgbG9hZFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXJzZURlbGF5TXMgPiAwKSB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aGlzLm9wdGlvbnMucGFyc2VEZWxheU1zKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnNlIGRvY3VtZW50XG4gICAgICBjb25zdCBwYXJzZWRSZXN1bHQgPSBhd2FpdCBwYXJzZURvY3VtZW50KGZpbGUucGF0aCwgZW5hYmxlT0NSLCBjbGllbnQpO1xuICAgICAgaWYgKCFwYXJzZWRSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUocGFyc2VkUmVzdWx0LnJlYXNvbiwgcGFyc2VkUmVzdWx0LmRldGFpbHMsIGZpbGUpO1xuICAgICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIHBhcnNlZFJlc3VsdC5yZWFzb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlZFJlc3VsdC5kb2N1bWVudDtcblxuICAgICAgLy8gQ2h1bmsgdGV4dFxuICAgICAgY29uc3QgY2h1bmtzID0gY2h1bmtUZXh0KHBhcnNlZC50ZXh0LCBjaHVua1NpemUsIGNodW5rT3ZlcmxhcCk7XG4gICAgICBpZiAoY2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgTm8gY2h1bmtzIGNyZWF0ZWQgZnJvbSAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFwiaW5kZXguY2h1bmstZW1wdHlcIiwgXCJjaHVua1RleHQgcHJvZHVjZWQgMCBjaHVua3NcIiwgZmlsZSk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJpbmRleC5jaHVuay1lbXB0eVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07IC8vIEZhaWxlZCB0byBjaHVua1xuICAgICAgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSBlbWJlZGRpbmdzIGFuZCBjcmVhdGUgZG9jdW1lbnQgY2h1bmtzXG4gICAgICBjb25zdCBkb2N1bWVudENodW5rczogRG9jdW1lbnRDaHVua1tdID0gW107XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gY2h1bmtzW2ldO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBHZW5lcmF0ZSBlbWJlZGRpbmdcbiAgICAgICAgICBjb25zdCBlbWJlZGRpbmdSZXN1bHQgPSBhd2FpdCBlbWJlZGRpbmdNb2RlbC5lbWJlZChjaHVuay50ZXh0KTtcbiAgICAgICAgICBjb25zdCBlbWJlZGRpbmcgPSBjb2VyY2VFbWJlZGRpbmdWZWN0b3IoZW1iZWRkaW5nUmVzdWx0LmVtYmVkZGluZyk7XG4gICAgICAgICAgXG4gICAgICAgICAgZG9jdW1lbnRDaHVua3MucHVzaCh7XG4gICAgICAgICAgICBpZDogYCR7ZmlsZUhhc2h9LSR7aX1gLFxuICAgICAgICAgICAgdGV4dDogY2h1bmsudGV4dCxcbiAgICAgICAgICAgIHZlY3RvcjogZW1iZWRkaW5nLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGUucGF0aCxcbiAgICAgICAgICAgIGZpbGVOYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICBmaWxlSGFzaCxcbiAgICAgICAgICAgIGNodW5rSW5kZXg6IGksXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICBleHRlbnNpb246IGZpbGUuZXh0ZW5zaW9uLFxuICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemUsXG4gICAgICAgICAgICAgIG10aW1lOiBmaWxlLm10aW1lLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgIHN0YXJ0SW5kZXg6IGNodW5rLnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgIGVuZEluZGV4OiBjaHVuay5lbmRJbmRleCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZW1iZWRkaW5nIGNodW5rICR7aX0gb2YgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgY2h1bmtzIHRvIHZlY3RvciBzdG9yZVxuICAgICAgaWYgKGRvY3VtZW50Q2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgXCJpbmRleC5jaHVuay1lbXB0eVwiLFxuICAgICAgICAgIFwiQWxsIGNodW5rIGVtYmVkZGluZ3MgZmFpbGVkLCBubyBkb2N1bWVudCBjaHVua3NcIixcbiAgICAgICAgICBmaWxlLFxuICAgICAgICApO1xuICAgICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIFwiaW5kZXguY2h1bmstZW1wdHlcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5hZGRDaHVua3MoZG9jdW1lbnRDaHVua3MpO1xuICAgICAgICBjb25zb2xlLmxvZyhgSW5kZXhlZCAke2RvY3VtZW50Q2h1bmtzLmxlbmd0aH0gY2h1bmtzIGZyb20gJHtmaWxlLm5hbWV9YCk7XG4gICAgICAgIGlmICghZXhpc3RpbmdIYXNoZXMpIHtcbiAgICAgICAgICBmaWxlSW52ZW50b3J5LnNldChmaWxlLnBhdGgsIG5ldyBTZXQoW2ZpbGVIYXNoXSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4aXN0aW5nSGFzaGVzLmFkZChmaWxlSGFzaCk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkuY2xlYXJGYWlsdXJlKGZpbGUucGF0aCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogXCJpbmRleGVkXCIsXG4gICAgICAgICAgY2hhbmdlVHlwZTogaGFzU2VlbkJlZm9yZSA/IFwidXBkYXRlZFwiIDogXCJuZXdcIixcbiAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGFkZGluZyBjaHVua3MgZm9yICR7ZmlsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcbiAgICAgICAgICBcImluZGV4LnZlY3Rvci1hZGQtZXJyb3JcIixcbiAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgZmlsZSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcImluZGV4LnZlY3Rvci1hZGQtZXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5kZXhpbmcgZmlsZSAke2ZpbGUucGF0aH06YCwgZXJyb3IpO1xuICAgICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcbiAgICAgICAgICAgIFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgIGZpbGUsXG4gICAgICAgICAgKTtcbiAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIik7XG4gICAgICB9XG4gICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07IC8vIEZhaWxlZFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWluZGV4IGEgc3BlY2lmaWMgZmlsZSAoZGVsZXRlIG9sZCBjaHVua3MgYW5kIHJlaW5kZXgpXG4gICAqL1xuICBhc3luYyByZWluZGV4RmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyB2ZWN0b3JTdG9yZSB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVIYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGgpO1xuICAgICAgXG4gICAgICAvLyBEZWxldGUgb2xkIGNodW5rc1xuICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuZGVsZXRlQnlGaWxlSGFzaChmaWxlSGFzaCk7XG4gICAgICBcbiAgICAgIC8vIFJlaW5kZXhcbiAgICAgIGNvbnN0IGZpbGU6IFNjYW5uZWRGaWxlID0ge1xuICAgICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgbmFtZTogZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoLFxuICAgICAgICBleHRlbnNpb246IGZpbGVQYXRoLnNwbGl0KFwiLlwiKS5wb3AoKSB8fCBcIlwiLFxuICAgICAgICBtaW1lVHlwZTogZmFsc2UsXG4gICAgICAgIHNpemU6IDAsXG4gICAgICAgIG10aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgYXdhaXQgdGhpcy5pbmRleEZpbGUoZmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlaW5kZXhpbmcgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29yZEZhaWx1cmUocmVhc29uOiBGYWlsdXJlUmVhc29uLCBkZXRhaWxzOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZpbGU6IFNjYW5uZWRGaWxlKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dID8/IDA7XG4gICAgdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl0gPSBjdXJyZW50ICsgMTtcbiAgICBjb25zdCBkZXRhaWxTdWZmaXggPSBkZXRhaWxzID8gYCBkZXRhaWxzPSR7ZGV0YWlsc31gIDogXCJcIjtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgW0JpZ1JBR10gRmFpbGVkIHRvIHBhcnNlICR7ZmlsZS5uYW1lfSAocmVhc29uPSR7cmVhc29ufSwgY291bnQ9JHt0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXX0pJHtkZXRhaWxTdWZmaXh9YCxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2dGYWlsdXJlU3VtbWFyeSgpIHtcbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXModGhpcy5mYWlsdXJlUmVhc29uQ291bnRzKTtcbiAgICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gTm8gcGFyc2luZyBmYWlsdXJlcyByZWNvcmRlZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gRmFpbHVyZSByZWFzb24gc3VtbWFyeTpcIik7XG4gICAgZm9yIChjb25zdCBbcmVhc29uLCBjb3VudF0gb2YgZW50cmllcykge1xuICAgICAgY29uc29sZS5sb2coYCAgLSAke3JlYXNvbn06ICR7Y291bnR9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB3cml0ZUZhaWx1cmVSZXBvcnQoc3VtbWFyeTogSW5kZXhpbmdSZXN1bHQpIHtcbiAgICBjb25zdCByZXBvcnRQYXRoID0gdGhpcy5vcHRpb25zLmZhaWx1cmVSZXBvcnRQYXRoO1xuICAgIGlmICghcmVwb3J0UGF0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAuLi5zdW1tYXJ5LFxuICAgICAgZG9jdW1lbnRzRGlyOiB0aGlzLm9wdGlvbnMuZG9jdW1lbnRzRGlyLFxuICAgICAgZmFpbHVyZVJlYXNvbnM6IHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50cyxcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2RpcihwYXRoLmRpcm5hbWUocmVwb3J0UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHJlcG9ydFBhdGgsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xuICAgICAgY29uc29sZS5sb2coYFtCaWdSQUddIFdyb3RlIGZhaWx1cmUgcmVwb3J0IHRvICR7cmVwb3J0UGF0aH1gKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgW0JpZ1JBR10gRmFpbGVkIHRvIHdyaXRlIGZhaWx1cmUgcmVwb3J0IHRvICR7cmVwb3J0UGF0aH06YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBJbmRleE1hbmFnZXIsIHR5cGUgSW5kZXhpbmdQcm9ncmVzcywgdHlwZSBJbmRleGluZ1Jlc3VsdCB9IGZyb20gXCIuL2luZGV4TWFuYWdlclwiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSdW5JbmRleGluZ1BhcmFtcyB7XG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQ7XG4gIGFib3J0U2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIGF1dG9SZWluZGV4OiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgZm9yY2VSZWluZGV4PzogYm9vbGVhbjtcbiAgdmVjdG9yU3RvcmU/OiBWZWN0b3JTdG9yZTtcbiAgb25Qcm9ncmVzcz86IChwcm9ncmVzczogSW5kZXhpbmdQcm9ncmVzcykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5JbmRleGluZ1Jlc3VsdCB7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgc3RhdHM6IHtcbiAgICB0b3RhbENodW5rczogbnVtYmVyO1xuICAgIHVuaXF1ZUZpbGVzOiBudW1iZXI7XG4gIH07XG4gIGluZGV4aW5nUmVzdWx0OiBJbmRleGluZ1Jlc3VsdDtcbn1cblxuLyoqXG4gKiBTaGFyZWQgaGVscGVyIHRoYXQgcnVucyB0aGUgZnVsbCBpbmRleGluZyBwaXBlbGluZS5cbiAqIEFsbG93cyByZXVzZSBhY3Jvc3MgdGhlIG1hbnVhbCB0b29sLCBjb25maWctdHJpZ2dlcmVkIGluZGV4aW5nLCBhbmQgYXV0b21hdGljIGJvb3RzdHJhcHBpbmcuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5JbmRleGluZ0pvYih7XG4gIGNsaWVudCxcbiAgYWJvcnRTaWduYWwsXG4gIGRvY3VtZW50c0RpcixcbiAgdmVjdG9yU3RvcmVEaXIsXG4gIGNodW5rU2l6ZSxcbiAgY2h1bmtPdmVybGFwLFxuICBtYXhDb25jdXJyZW50LFxuICBlbmFibGVPQ1IsXG4gIGF1dG9SZWluZGV4LFxuICBwYXJzZURlbGF5TXMsXG4gIGZvcmNlUmVpbmRleCA9IGZhbHNlLFxuICB2ZWN0b3JTdG9yZTogZXhpc3RpbmdWZWN0b3JTdG9yZSxcbiAgb25Qcm9ncmVzcyxcbn06IFJ1bkluZGV4aW5nUGFyYW1zKTogUHJvbWlzZTxSdW5JbmRleGluZ1Jlc3VsdD4ge1xuICBjb25zdCB2ZWN0b3JTdG9yZSA9IGV4aXN0aW5nVmVjdG9yU3RvcmUgPz8gbmV3IFZlY3RvclN0b3JlKHZlY3RvclN0b3JlRGlyKTtcbiAgY29uc3Qgb3duc1ZlY3RvclN0b3JlID0gZXhpc3RpbmdWZWN0b3JTdG9yZSA9PT0gdW5kZWZpbmVkO1xuXG4gIGlmIChvd25zVmVjdG9yU3RvcmUpIHtcbiAgICBhd2FpdCB2ZWN0b3JTdG9yZS5pbml0aWFsaXplKCk7XG4gIH1cblxuICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGNsaWVudC5lbWJlZGRpbmcubW9kZWwoXG4gICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgIHsgc2lnbmFsOiBhYm9ydFNpZ25hbCB9LFxuICApO1xuXG4gIGNvbnN0IGluZGV4TWFuYWdlciA9IG5ldyBJbmRleE1hbmFnZXIoe1xuICAgIGRvY3VtZW50c0RpcixcbiAgICB2ZWN0b3JTdG9yZSxcbiAgICB2ZWN0b3JTdG9yZURpcixcbiAgICBlbWJlZGRpbmdNb2RlbCxcbiAgICBjbGllbnQsXG4gICAgY2h1bmtTaXplLFxuICAgIGNodW5rT3ZlcmxhcCxcbiAgICBtYXhDb25jdXJyZW50LFxuICAgIGVuYWJsZU9DUixcbiAgICBhdXRvUmVpbmRleDogZm9yY2VSZWluZGV4ID8gZmFsc2UgOiBhdXRvUmVpbmRleCxcbiAgICBwYXJzZURlbGF5TXMsXG4gICAgb25Qcm9ncmVzcyxcbiAgfSk7XG5cbiAgY29uc3QgaW5kZXhpbmdSZXN1bHQgPSBhd2FpdCBpbmRleE1hbmFnZXIuaW5kZXgoKTtcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuXG4gIGlmIChvd25zVmVjdG9yU3RvcmUpIHtcbiAgICBhd2FpdCB2ZWN0b3JTdG9yZS5jbG9zZSgpO1xuICB9XG5cbiAgY29uc3Qgc3VtbWFyeSA9IGBJbmRleGluZyBjb21wbGV0ZWQhXFxuXFxuYCArXG4gICAgYFx1MjAyMiBTdWNjZXNzZnVsbHkgaW5kZXhlZDogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIEZhaWxlZDogJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIFNraXBwZWQgKHVuY2hhbmdlZCk6ICR7aW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgVXBkYXRlZCBleGlzdGluZyBmaWxlczogJHtpbmRleGluZ1Jlc3VsdC51cGRhdGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBOZXcgZmlsZXMgYWRkZWQ6ICR7aW5kZXhpbmdSZXN1bHQubmV3RmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBDaHVua3MgaW4gc3RvcmU6ICR7c3RhdHMudG90YWxDaHVua3N9XFxuYCArXG4gICAgYFx1MjAyMiBVbmlxdWUgZmlsZXMgaW4gc3RvcmU6ICR7c3RhdHMudW5pcXVlRmlsZXN9YDtcblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnksXG4gICAgc3RhdHMsXG4gICAgaW5kZXhpbmdSZXN1bHQsXG4gIH07XG59XG5cbiIsICJpbXBvcnQge1xuICB0eXBlIENoYXRNZXNzYWdlLFxuICB0eXBlIFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG59IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzLCBERUZBVUxUX1BST01QVF9URU1QTEFURSB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUgfSBmcm9tIFwiLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuaW1wb3J0IHsgcGVyZm9ybVNhbml0eUNoZWNrcyB9IGZyb20gXCIuL3V0aWxzL3Nhbml0eUNoZWNrc1wiO1xuaW1wb3J0IHsgdHJ5U3RhcnRJbmRleGluZywgZmluaXNoSW5kZXhpbmcgfSBmcm9tIFwiLi91dGlscy9pbmRleGluZ0xvY2tcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHJ1bkluZGV4aW5nSm9iIH0gZnJvbSBcIi4vaW5nZXN0aW9uL3J1bkluZGV4aW5nXCI7XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZVRleHQodGV4dDogc3RyaW5nLCBtYXhMaW5lczogbnVtYmVyID0gMywgbWF4Q2hhcnM6IG51bWJlciA9IDQwMCk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pLmZpbHRlcihsaW5lID0+IGxpbmUudHJpbSgpICE9PSBcIlwiKTtcbiAgY29uc3QgY2xpcHBlZExpbmVzID0gbGluZXMuc2xpY2UoMCwgbWF4TGluZXMpO1xuICBsZXQgY2xpcHBlZCA9IGNsaXBwZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xuICBpZiAoY2xpcHBlZC5sZW5ndGggPiBtYXhDaGFycykge1xuICAgIGNsaXBwZWQgPSBjbGlwcGVkLnNsaWNlKDAsIG1heENoYXJzKTtcbiAgfVxuICBjb25zdCBuZWVkc0VsbGlwc2lzID1cbiAgICBsaW5lcy5sZW5ndGggPiBtYXhMaW5lcyB8fFxuICAgIHRleHQubGVuZ3RoID4gY2xpcHBlZC5sZW5ndGggfHxcbiAgICBjbGlwcGVkLmxlbmd0aCA9PT0gbWF4Q2hhcnMgJiYgdGV4dC5sZW5ndGggPiBtYXhDaGFycztcbiAgcmV0dXJuIG5lZWRzRWxsaXBzaXMgPyBgJHtjbGlwcGVkLnRyaW1FbmQoKX1cdTIwMjZgIDogY2xpcHBlZDtcbn1cblxuLy8gR2xvYmFsIHN0YXRlIGZvciB2ZWN0b3Igc3RvcmUgKHBlcnNpc3RzIGFjcm9zcyByZXF1ZXN0cylcbmxldCB2ZWN0b3JTdG9yZTogVmVjdG9yU3RvcmUgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0SW5kZXhlZERpciA9IFwiXCI7XG5sZXQgc2FuaXR5Q2hlY2tzUGFzc2VkID0gZmFsc2U7XG5cbmNvbnN0IFJBR19DT05URVhUX01BQ1JPID0gXCJ7e3JhZ19jb250ZXh0fX1cIjtcbmNvbnN0IFVTRVJfUVVFUllfTUFDUk8gPSBcInt7dXNlcl9xdWVyeX19XCI7XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVByb21wdFRlbXBsYXRlKHRlbXBsYXRlOiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkKTogc3RyaW5nIHtcbiAgY29uc3QgaGFzQ29udGVudCA9IHR5cGVvZiB0ZW1wbGF0ZSA9PT0gXCJzdHJpbmdcIiAmJiB0ZW1wbGF0ZS50cmltKCkubGVuZ3RoID4gMDtcbiAgbGV0IG5vcm1hbGl6ZWQgPSBoYXNDb250ZW50ID8gdGVtcGxhdGUhIDogREVGQVVMVF9QUk9NUFRfVEVNUExBVEU7XG5cbiAgaWYgKCFub3JtYWxpemVkLmluY2x1ZGVzKFJBR19DT05URVhUX01BQ1JPKSkge1xuICAgIGNvbnNvbGUud2FybihcbiAgICAgIGBbQmlnUkFHXSBQcm9tcHQgdGVtcGxhdGUgbWlzc2luZyAke1JBR19DT05URVhUX01BQ1JPfS4gUHJlcGVuZGluZyBSQUcgY29udGV4dCBibG9jay5gLFxuICAgICk7XG4gICAgbm9ybWFsaXplZCA9IGAke1JBR19DT05URVhUX01BQ1JPfVxcblxcbiR7bm9ybWFsaXplZH1gO1xuICB9XG5cbiAgaWYgKCFub3JtYWxpemVkLmluY2x1ZGVzKFVTRVJfUVVFUllfTUFDUk8pKSB7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIFByb21wdCB0ZW1wbGF0ZSBtaXNzaW5nICR7VVNFUl9RVUVSWV9NQUNST30uIEFwcGVuZGluZyB1c2VyIHF1ZXJ5IGJsb2NrLmAsXG4gICAgKTtcbiAgICBub3JtYWxpemVkID0gYCR7bm9ybWFsaXplZH1cXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7VVNFUl9RVUVSWV9NQUNST31gO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbGxQcm9tcHRUZW1wbGF0ZSh0ZW1wbGF0ZTogc3RyaW5nLCByZXBsYWNlbWVudHM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMocmVwbGFjZW1lbnRzKS5yZWR1Y2UoXG4gICAgKGFjYywgW3Rva2VuLCB2YWx1ZV0pID0+IGFjYy5zcGxpdCh0b2tlbikuam9pbih2YWx1ZSksXG4gICAgdGVtcGxhdGUsXG4gICk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdhcm5JZkNvbnRleHRPdmVyZmxvdyhcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxuICBmaW5hbFByb21wdDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdG9rZW5Tb3VyY2UgPSBhd2FpdCBjdGwudG9rZW5Tb3VyY2UoKTtcbiAgICBpZiAoXG4gICAgICAhdG9rZW5Tb3VyY2UgfHxcbiAgICAgICEoXCJhcHBseVByb21wdFRlbXBsYXRlXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuYXBwbHlQcm9tcHRUZW1wbGF0ZSAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiY291bnRUb2tlbnNcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5jb3VudFRva2VucyAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiZ2V0Q29udGV4dExlbmd0aFwiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmdldENvbnRleHRMZW5ndGggIT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVG9rZW4gc291cmNlIGRvZXMgbm90IGV4cG9zZSBwcm9tcHQgdXRpbGl0aWVzOyBza2lwcGluZyBjb250ZXh0IGNoZWNrLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBbY29udGV4dExlbmd0aCwgaGlzdG9yeV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0b2tlblNvdXJjZS5nZXRDb250ZXh0TGVuZ3RoKCksXG4gICAgICBjdGwucHVsbEhpc3RvcnkoKSxcbiAgICBdKTtcbiAgICBjb25zdCBoaXN0b3J5V2l0aExhdGVzdE1lc3NhZ2UgPSBoaXN0b3J5LndpdGhBcHBlbmRlZCh7XG4gICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgIGNvbnRlbnQ6IGZpbmFsUHJvbXB0LFxuICAgIH0pO1xuICAgIGNvbnN0IGZvcm1hdHRlZFByb21wdCA9IGF3YWl0IHRva2VuU291cmNlLmFwcGx5UHJvbXB0VGVtcGxhdGUoaGlzdG9yeVdpdGhMYXRlc3RNZXNzYWdlKTtcbiAgICBjb25zdCBwcm9tcHRUb2tlbnMgPSBhd2FpdCB0b2tlblNvdXJjZS5jb3VudFRva2Vucyhmb3JtYXR0ZWRQcm9tcHQpO1xuXG4gICAgaWYgKHByb21wdFRva2VucyA+IGNvbnRleHRMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdTdW1tYXJ5ID1cbiAgICAgICAgYFx1MjZBMFx1RkUwRiBQcm9tcHQgbmVlZHMgJHtwcm9tcHRUb2tlbnMudG9Mb2NhbGVTdHJpbmcoKX0gdG9rZW5zIGJ1dCBtb2RlbCBtYXggaXMgJHtjb250ZXh0TGVuZ3RoLnRvTG9jYWxlU3RyaW5nKCl9LmA7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nU3VtbWFyeSk7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgIHRleHQ6IGAke3dhcm5pbmdTdW1tYXJ5fSBSZWR1Y2UgcmV0cmlldmVkIHBhc3NhZ2VzIG9yIGluY3JlYXNlIHRoZSBtb2RlbCdzIGNvbnRleHQgbGVuZ3RoLmAsXG4gICAgICB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICAgICAgdGl0bGU6IFwiQ29udGV4dCB3aW5kb3cgZXhjZWVkZWRcIixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7d2FybmluZ1N1bW1hcnl9IFByb21wdCBtYXkgYmUgdHJ1bmNhdGVkIG9yIHJlamVjdGVkLmAsXG4gICAgICAgICAgbm9BdXRvRGlzbWlzczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChub3RpZnlFcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBVbmFibGUgdG8gc2VuZCBjb250ZXh0IG92ZXJmbG93IG5vdGlmaWNhdGlvbjpcIiwgbm90aWZ5RXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBGYWlsZWQgdG8gZXZhbHVhdGUgY29udGV4dCB1c2FnZTpcIiwgZXJyb3IpO1xuICB9XG59XG5cbi8qKlxuICogTWFpbiBwcm9tcHQgcHJlcHJvY2Vzc29yIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwcm9jZXNzKFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBDaGF0TWVzc2FnZSxcbik6IFByb21pc2U8Q2hhdE1lc3NhZ2UgfCBzdHJpbmc+IHtcbiAgY29uc3QgdXNlclByb21wdCA9IHVzZXJNZXNzYWdlLmdldFRleHQoKTtcbiAgY29uc3QgcGx1Z2luQ29uZmlnID0gY3RsLmdldFBsdWdpbkNvbmZpZyhjb25maWdTY2hlbWF0aWNzKTtcblxuICAvLyBHZXQgY29uZmlndXJhdGlvblxuICBjb25zdCBkb2N1bWVudHNEaXIgPSBwbHVnaW5Db25maWcuZ2V0KFwiZG9jdW1lbnRzRGlyZWN0b3J5XCIpO1xuICBjb25zdCB2ZWN0b3JTdG9yZURpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJ2ZWN0b3JTdG9yZURpcmVjdG9yeVwiKTtcbiAgY29uc3QgcmV0cmlldmFsTGltaXQgPSBwbHVnaW5Db25maWcuZ2V0KFwicmV0cmlldmFsTGltaXRcIik7XG4gIGNvbnN0IHJldHJpZXZhbFRocmVzaG9sZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiKTtcbiAgY29uc3QgY2h1bmtTaXplID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rU2l6ZVwiKTtcbiAgY29uc3QgY2h1bmtPdmVybGFwID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rT3ZlcmxhcFwiKTtcbiAgY29uc3QgbWF4Q29uY3VycmVudCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYXhDb25jdXJyZW50RmlsZXNcIik7XG4gIGNvbnN0IGVuYWJsZU9DUiA9IHBsdWdpbkNvbmZpZy5nZXQoXCJlbmFibGVPQ1JcIik7XG4gIGNvbnN0IHNraXBQcmV2aW91c2x5SW5kZXhlZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKTtcbiAgY29uc3QgcGFyc2VEZWxheU1zID0gcGx1Z2luQ29uZmlnLmdldChcInBhcnNlRGVsYXlNc1wiKSA/PyAwO1xuICBjb25zdCByZWluZGV4UmVxdWVzdGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiKTtcblxuICAvLyBWYWxpZGF0ZSBjb25maWd1cmF0aW9uXG4gIGlmICghZG9jdW1lbnRzRGlyIHx8IGRvY3VtZW50c0RpciA9PT0gXCJcIikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIERvY3VtZW50cyBkaXJlY3Rvcnkgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLlwiKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cblxuICBpZiAoIXZlY3RvclN0b3JlRGlyIHx8IHZlY3RvclN0b3JlRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gUGVyZm9ybSBzYW5pdHkgY2hlY2tzIG9uIGZpcnN0IHJ1blxuICAgIGlmICghc2FuaXR5Q2hlY2tzUGFzc2VkKSB7XG4gICAgICBjb25zdCBjaGVja1N0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIlBlcmZvcm1pbmcgc2FuaXR5IGNoZWNrcy4uLlwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNhbml0eVJlc3VsdCA9IGF3YWl0IHBlcmZvcm1TYW5pdHlDaGVja3MoZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZURpcik7XG5cbiAgICAgIC8vIExvZyB3YXJuaW5nc1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHNhbml0eVJlc3VsdC53YXJuaW5ncykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9nIGVycm9ycyBhbmQgYWJvcnQgaWYgY3JpdGljYWxcbiAgICAgIGlmICghc2FuaXR5UmVzdWx0LnBhc3NlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHNhbml0eVJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR11cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZhaWx1cmVSZWFzb24gPVxuICAgICAgICAgIHNhbml0eVJlc3VsdC5lcnJvcnNbMF0gPz9cbiAgICAgICAgICBzYW5pdHlSZXN1bHQud2FybmluZ3NbMF0gPz9cbiAgICAgICAgICBcIlVua25vd24gcmVhc29uLiBQbGVhc2UgcmV2aWV3IHBsdWdpbiBzZXR0aW5ncy5cIjtcbiAgICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgIHRleHQ6IGBTYW5pdHkgY2hlY2tzIGZhaWxlZDogJHtmYWlsdXJlUmVhc29ufWAsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGNoZWNrU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJTYW5pdHkgY2hlY2tzIHBhc3NlZFwiLFxuICAgICAgfSk7XG4gICAgICBzYW5pdHlDaGVja3NQYXNzZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEluaXRpYWxpemUgdmVjdG9yIHN0b3JlIGlmIG5lZWRlZFxuICAgIGlmICghdmVjdG9yU3RvcmUgfHwgbGFzdEluZGV4ZWREaXIgIT09IHZlY3RvclN0b3JlRGlyKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgdGV4dDogXCJJbml0aWFsaXppbmcgdmVjdG9yIHN0b3JlLi4uXCIsXG4gICAgICB9KTtcblxuICAgICAgdmVjdG9yU3RvcmUgPSBuZXcgVmVjdG9yU3RvcmUodmVjdG9yU3RvcmVEaXIpO1xuICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHJlYWR5IChwYXRoPSR7dmVjdG9yU3RvcmVEaXJ9KS4gV2FpdGluZyBmb3IgcXVlcmllcy4uLmAsXG4gICAgICApO1xuICAgICAgbGFzdEluZGV4ZWREaXIgPSB2ZWN0b3JTdG9yZURpcjtcblxuICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWRcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGF3YWl0IG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gICAgICBjdGwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBwYXJzZURlbGF5TXMsXG4gICAgICByZWluZGV4UmVxdWVzdGVkLFxuICAgICAgc2tpcFByZXZpb3VzbHlJbmRleGVkOiBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC5za2lwUHJldmlvdXNseUluZGV4ZWRcIiksXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGluZGV4XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIFZlY3RvciBzdG9yZSBzdGF0cyBiZWZvcmUgYXV0by1pbmRleCBjaGVjazogdG90YWxDaHVua3M9JHtzdGF0cy50b3RhbENodW5rc30sIHVuaXF1ZUZpbGVzPSR7c3RhdHMudW5pcXVlRmlsZXN9YCk7XG5cbiAgICBpZiAoc3RhdHMudG90YWxDaHVua3MgPT09IDApIHtcbiAgICAgIGlmICghdHJ5U3RhcnRJbmRleGluZyhcImF1dG8tdHJpZ2dlclwiKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBJbmRleGluZyBhbHJlYWR5IHJ1bm5pbmcsIHNraXBwaW5nIGF1dG9tYXRpYyBpbmRleGluZy5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbmRleFN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgdGV4dDogXCJTdGFydGluZyBpbml0aWFsIGluZGV4aW5nLi4uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBpbmRleGluZ1Jlc3VsdCB9ID0gYXdhaXQgcnVuSW5kZXhpbmdKb2Ioe1xuICAgICAgICAgICAgY2xpZW50OiBjdGwuY2xpZW50LFxuICAgICAgICAgICAgYWJvcnRTaWduYWw6IGN0bC5hYm9ydFNpZ25hbCxcbiAgICAgICAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgICAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgICAgICAgY2h1bmtTaXplLFxuICAgICAgICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgICAgICAgIGVuYWJsZU9DUixcbiAgICAgICAgICAgIGF1dG9SZWluZGV4OiBmYWxzZSxcbiAgICAgICAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgICAgICAgIHZlY3RvclN0b3JlLFxuICAgICAgICAgICAgZm9yY2VSZWluZGV4OiB0cnVlLFxuICAgICAgICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwic2Nhbm5pbmdcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgU2Nhbm5pbmc6ICR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9YCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiaW5kZXhpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwcm9ncmVzcy5zdWNjZXNzZnVsRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBwcm9ncmVzcy5mYWlsZWRGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNraXBwZWQgPSBwcm9ncmVzcy5za2lwcGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGVycm9yOiAke3Byb2dyZXNzLmVycm9yfWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0JpZ1JBR10gSW5kZXhpbmcgY29tcGxldGU6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfSBmYWlsZWQpYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBJbmRleGluZyBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBmaW5pc2hJbmRleGluZygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9nIG1hbnVhbCByZWluZGV4IHRvZ2dsZSBzdGF0ZXMgZm9yIHZpc2liaWxpdHkgb24gZWFjaCBjaGF0XG4gICAgY29uc3QgdG9nZ2xlU3RhdHVzVGV4dCA9XG4gICAgICBgTWFudWFsIFJlaW5kZXggVHJpZ2dlcjogJHtyZWluZGV4UmVxdWVzdGVkID8gXCJPTlwiIDogXCJPRkZcIn0gfCBgICtcbiAgICAgIGBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZDogJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifWA7XG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSAke3RvZ2dsZVN0YXR1c1RleHR9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogdG9nZ2xlU3RhdHVzVGV4dCxcbiAgICB9KTtcblxuICAgIC8vIFBlcmZvcm0gcmV0cmlldmFsXG4gICAgY29uc3QgcmV0cmlldmFsU3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJMb2FkaW5nIGVtYmVkZGluZyBtb2RlbCBmb3IgcmV0cmlldmFsLi4uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGN0bC5jbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgICAgeyBzaWduYWw6IGN0bC5hYm9ydFNpZ25hbCB9XG4gICAgKTtcblxuICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJTZWFyY2hpbmcgZm9yIHJlbGV2YW50IGNvbnRlbnQuLi5cIixcbiAgICB9KTtcblxuICAgIC8vIEVtYmVkIHRoZSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nUmVzdWx0ID0gYXdhaXQgZW1iZWRkaW5nTW9kZWwuZW1iZWQodXNlclByb21wdCk7XG4gICAgY29uc3QgcXVlcnlFbWJlZGRpbmcgPSBxdWVyeUVtYmVkZGluZ1Jlc3VsdC5lbWJlZGRpbmc7XG5cbiAgICAvLyBTZWFyY2ggdmVjdG9yIHN0b3JlXG4gICAgY29uc3QgcXVlcnlQcmV2aWV3ID1cbiAgICAgIHVzZXJQcm9tcHQubGVuZ3RoID4gMTYwID8gYCR7dXNlclByb21wdC5zbGljZSgwLCAxNjApfS4uLmAgOiB1c2VyUHJvbXB0O1xuICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgIGBbQmlnUkFHXSBFeGVjdXRpbmcgdmVjdG9yIHNlYXJjaCBmb3IgXCIke3F1ZXJ5UHJldmlld31cIiAobGltaXQ9JHtyZXRyaWV2YWxMaW1pdH0sIHRocmVzaG9sZD0ke3JldHJpZXZhbFRocmVzaG9sZH0pYCxcbiAgICApO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5zZWFyY2goXG4gICAgICBxdWVyeUVtYmVkZGluZyxcbiAgICAgIHJldHJpZXZhbExpbWl0LFxuICAgICAgcmV0cmlldmFsVGhyZXNob2xkXG4gICAgKTtcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0b3BIaXQgPSByZXN1bHRzWzBdO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHNlYXJjaCByZXR1cm5lZCAke3Jlc3VsdHMubGVuZ3RofSByZXN1bHRzLiBUb3AgaGl0OiBmaWxlPSR7dG9wSGl0LmZpbGVOYW1lfSBzY29yZT0ke3RvcEhpdC5zY29yZS50b0ZpeGVkKDMpfWAsXG4gICAgICApO1xuXG4gICAgICBjb25zdCBkb2NTdW1tYXJpZXMgPSByZXN1bHRzXG4gICAgICAgIC5tYXAoXG4gICAgICAgICAgKHJlc3VsdCwgaWR4KSA9PlxuICAgICAgICAgICAgYCMke2lkeCArIDF9IGZpbGU9JHtwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCl9IHNjb3JlPSR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9YCxcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUmVsZXZhbnQgZG9jdW1lbnRzOlxcbiR7ZG9jU3VtbWFyaWVzfWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBWZWN0b3Igc2VhcmNoIHJldHVybmVkIDAgcmVzdWx0cy5cIik7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgdGV4dDogXCJObyByZWxldmFudCBjb250ZW50IGZvdW5kIGluIGluZGV4ZWQgZG9jdW1lbnRzXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgbm90ZUFib3V0Tm9SZXN1bHRzID1cbiAgICAgICAgYEltcG9ydGFudDogTm8gcmVsZXZhbnQgY29udGVudCB3YXMgZm91bmQgaW4gdGhlIGluZGV4ZWQgZG9jdW1lbnRzIGZvciB0aGUgdXNlciBxdWVyeS4gYCArXG4gICAgICAgIGBJbiBsZXNzIHRoYW4gb25lIHNlbnRlbmNlLCBpbmZvcm0gdGhlIHVzZXIgb2YgdGhpcy4gYCArXG4gICAgICAgIGBUaGVuIHJlc3BvbmQgdG8gdGhlIHF1ZXJ5IHRvIHRoZSBiZXN0IG9mIHlvdXIgYWJpbGl0eS5gO1xuXG4gICAgICByZXR1cm4gbm90ZUFib3V0Tm9SZXN1bHRzICsgYFxcblxcblVzZXIgUXVlcnk6XFxuXFxuJHt1c2VyUHJvbXB0fWA7XG4gICAgfVxuXG4gICAgLy8gRm9ybWF0IHJlc3VsdHNcbiAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSZXRyaWV2ZWQgJHtyZXN1bHRzLmxlbmd0aH0gcmVsZXZhbnQgcGFzc2FnZXNgLFxuICAgIH0pO1xuXG4gICAgY3RsLmRlYnVnKFwiUmV0cmlldmFsIHJlc3VsdHM6XCIsIHJlc3VsdHMpO1xuXG4gICAgbGV0IHJhZ0NvbnRleHRGdWxsID0gXCJcIjtcbiAgICBsZXQgcmFnQ29udGV4dFByZXZpZXcgPSBcIlwiO1xuICAgIGNvbnN0IHByZWZpeCA9IFwiVGhlIGZvbGxvd2luZyBwYXNzYWdlcyB3ZXJlIGZvdW5kIGluIHlvdXIgaW5kZXhlZCBkb2N1bWVudHM6XFxuXFxuXCI7XG4gICAgcmFnQ29udGV4dEZ1bGwgKz0gcHJlZml4O1xuICAgIHJhZ0NvbnRleHRQcmV2aWV3ICs9IHByZWZpeDtcblxuICAgIGxldCBjaXRhdGlvbk51bWJlciA9IDE7XG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCk7XG4gICAgICBjb25zdCBjaXRhdGlvbkxhYmVsID0gYENpdGF0aW9uICR7Y2l0YXRpb25OdW1iZXJ9IChmcm9tICR7ZmlsZU5hbWV9LCBzY29yZTogJHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX0pOiBgO1xuICAgICAgcmFnQ29udGV4dEZ1bGwgKz0gYFxcbiR7Y2l0YXRpb25MYWJlbH1cIiR7cmVzdWx0LnRleHR9XCJcXG5cXG5gO1xuICAgICAgcmFnQ29udGV4dFByZXZpZXcgKz0gYFxcbiR7Y2l0YXRpb25MYWJlbH1cIiR7c3VtbWFyaXplVGV4dChyZXN1bHQudGV4dCl9XCJcXG5cXG5gO1xuICAgICAgY2l0YXRpb25OdW1iZXIrKztcbiAgICB9XG5cbiAgICBjb25zdCBwcm9tcHRUZW1wbGF0ZSA9IG5vcm1hbGl6ZVByb21wdFRlbXBsYXRlKHBsdWdpbkNvbmZpZy5nZXQoXCJwcm9tcHRUZW1wbGF0ZVwiKSk7XG4gICAgY29uc3QgZmluYWxQcm9tcHQgPSBmaWxsUHJvbXB0VGVtcGxhdGUocHJvbXB0VGVtcGxhdGUsIHtcbiAgICAgIFtSQUdfQ09OVEVYVF9NQUNST106IHJhZ0NvbnRleHRGdWxsLnRyaW1FbmQoKSxcbiAgICAgIFtVU0VSX1FVRVJZX01BQ1JPXTogdXNlclByb21wdCxcbiAgICB9KTtcbiAgICBjb25zdCBmaW5hbFByb21wdFByZXZpZXcgPSBmaWxsUHJvbXB0VGVtcGxhdGUocHJvbXB0VGVtcGxhdGUsIHtcbiAgICAgIFtSQUdfQ09OVEVYVF9NQUNST106IHJhZ0NvbnRleHRQcmV2aWV3LnRyaW1FbmQoKSxcbiAgICAgIFtVU0VSX1FVRVJZX01BQ1JPXTogdXNlclByb21wdCxcbiAgICB9KTtcblxuICAgIGN0bC5kZWJ1ZyhcIlByb2Nlc3NlZCBjb250ZW50IChwcmV2aWV3KTpcIiwgZmluYWxQcm9tcHRQcmV2aWV3KTtcblxuICAgIGNvbnN0IHBhc3NhZ2VzTG9nRW50cmllcyA9IHJlc3VsdHMubWFwKChyZXN1bHQsIGlkeCkgPT4ge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCk7XG4gICAgICByZXR1cm4gYCMke2lkeCArIDF9IGZpbGU9JHtmaWxlTmFtZX0gc2NvcmU9JHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX1cXG4ke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfWA7XG4gICAgfSk7XG4gICAgY29uc3QgcGFzc2FnZXNMb2cgPSBwYXNzYWdlc0xvZ0VudHJpZXMuam9pbihcIlxcblxcblwiKTtcblxuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUkFHIHBhc3NhZ2VzICgke3Jlc3VsdHMubGVuZ3RofSkgcHJldmlldzpcXG4ke3Bhc3NhZ2VzTG9nfWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSQUcgcGFzc2FnZXMgKCR7cmVzdWx0cy5sZW5ndGh9KTpgLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgcGFzc2FnZXNMb2dFbnRyaWVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogZW50cnksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIEZpbmFsIHByb21wdCBzZW50IHRvIG1vZGVsIChwcmV2aWV3KTpcXG4ke2ZpbmFsUHJvbXB0UHJldmlld31gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgRmluYWwgcHJvbXB0IHNlbnQgdG8gbW9kZWwgKHByZXZpZXcpOlxcbiR7ZmluYWxQcm9tcHRQcmV2aWV3fWAsXG4gICAgfSk7XG5cbiAgICBhd2FpdCB3YXJuSWZDb250ZXh0T3ZlcmZsb3coY3RsLCBmaW5hbFByb21wdCk7XG5cbiAgICByZXR1cm4gZmluYWxQcm9tcHQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIltQcm9tcHRQcmVwcm9jZXNzb3JdIFByZXByb2Nlc3NpbmcgZmFpbGVkLlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG59XG5cbmludGVyZmFjZSBDb25maWdSZWluZGV4T3B0cyB7XG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcjtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICByZWluZGV4UmVxdWVzdGVkOiBib29sZWFuO1xuICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IGJvb2xlYW47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gIGN0bCxcbiAgZG9jdW1lbnRzRGlyLFxuICB2ZWN0b3JTdG9yZURpcixcbiAgY2h1bmtTaXplLFxuICBjaHVua092ZXJsYXAsXG4gIG1heENvbmN1cnJlbnQsXG4gIGVuYWJsZU9DUixcbiAgcGFyc2VEZWxheU1zLFxuICByZWluZGV4UmVxdWVzdGVkLFxuICBza2lwUHJldmlvdXNseUluZGV4ZWQsXG59OiBDb25maWdSZWluZGV4T3B0cykge1xuICBpZiAoIXJlaW5kZXhSZXF1ZXN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZW1pbmRlclRleHQgPVxuICAgIGBNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcyBpcyBjdXJyZW50bHkgJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifS4gYCArXG4gICAgXCJUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiO1xuICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7cmVtaW5kZXJUZXh0fWApO1xuICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgIHRleHQ6IHJlbWluZGVyVGV4dCxcbiAgfSk7XG5cbiAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiY29uZmlnLXRyaWdnZXJcIikpIHtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBhbHJlYWR5IHJ1bm5pbmcuIFBsZWFzZSB3YWl0IGZvciBpdCB0byBmaW5pc2guXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IHJlcXVlc3RlZCBmcm9tIGNvbmZpZy4uLlwiLFxuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgaW5kZXhpbmdSZXN1bHQgfSA9IGF3YWl0IHJ1bkluZGV4aW5nSm9iKHtcbiAgICAgIGNsaWVudDogY3RsLmNsaWVudCxcbiAgICAgIGFib3J0U2lnbmFsOiBjdGwuYWJvcnRTaWduYWwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBhdXRvUmVpbmRleDogc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgZm9yY2VSZWluZGV4OiAhc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgdmVjdG9yU3RvcmU6IHZlY3RvclN0b3JlID8/IHVuZGVmaW5lZCxcbiAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcInNjYW5uaW5nXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHByb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwO1xuICAgICAgICAgIGNvbnN0IGZhaWxlZCA9IHByb2dyZXNzLmZhaWxlZEZpbGVzID8/IDA7XG4gICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IHByb2dyZXNzLnNraXBwZWRGaWxlcyA/PyAwO1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgY29tcGxldGU6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9IGZpbGVzIHByb2Nlc3NlZGAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZXJyb3I6ICR7cHJvZ3Jlc3MuZXJyb3J9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZSFcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN1bW1hcnlMaW5lcyA9IFtcbiAgICAgIGBQcm9jZXNzZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9YCxcbiAgICAgIGBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9YCxcbiAgICAgIGBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31gLFxuICAgICAgYFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfWAsXG4gICAgICBgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfWAsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygc3VtbWFyeUxpbmVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogbGluZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzID4gMCAmJiBpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXMgPT09IGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIkFsbCBmaWxlcyB3ZXJlIGFscmVhZHkgdXAgdG8gZGF0ZSAoc2tpcHBlZCkuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBzdW1tYXJ5OlxcbiAgJHtzdW1tYXJ5TGluZXMuam9pbihcIlxcbiAgXCIpfWAsXG4gICAgKTtcblxuICAgIGF3YWl0IG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgdGV4dDogYE1hbnVhbCByZWluZGV4IGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICB9KTtcbiAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR10gTWFudWFsIHJlaW5kZXggZmFpbGVkOlwiLCBlcnJvcik7XG4gIH0gZmluYWxseSB7XG4gICAgZmluaXNoSW5kZXhpbmcoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBub3RpZnlNYW51YWxSZXNldE5lZWRlZChjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjdGwuY2xpZW50LnN5c3RlbS5ub3RpZnkoe1xuICAgICAgdGl0bGU6IFwiTWFudWFsIHJlaW5kZXggY29tcGxldGVkXCIsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgXCJNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFVuYWJsZSB0byBzZW5kIG5vdGlmaWNhdGlvbiBhYm91dCBtYW51YWwgcmVpbmRleCByZXNldDpcIiwgZXJyb3IpO1xuICB9XG59XG5cblxuIiwgImltcG9ydCB7IHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBwcmVwcm9jZXNzIH0gZnJvbSBcIi4vcHJvbXB0UHJlcHJvY2Vzc29yXCI7XG5cbi8qKlxuICogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIEJpZyBSQUcgcGx1Z2luLlxuICogVGhpcyBwbHVnaW4gaW5kZXhlcyBsYXJnZSBkb2N1bWVudCBjb2xsZWN0aW9ucyBhbmQgcHJvdmlkZXMgUkFHIGNhcGFiaWxpdGllcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1haW4oY29udGV4dDogUGx1Z2luQ29udGV4dCkge1xuICAvLyBSZWdpc3RlciB0aGUgY29uZmlndXJhdGlvbiBzY2hlbWF0aWNzXG4gIGNvbnRleHQud2l0aENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gIFxuICAvLyBSZWdpc3RlciB0aGUgcHJvbXB0IHByZXByb2Nlc3NvclxuICBjb250ZXh0LndpdGhQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gIFxuICBjb25zb2xlLmxvZyhcIltCaWdSQUddIFBsdWdpbiBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG59XG5cbiIsICJpbXBvcnQgeyBMTVN0dWRpb0NsaWVudCwgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZGVjbGFyZSB2YXIgcHJvY2VzczogYW55O1xuXG4vLyBXZSByZWNlaXZlIHJ1bnRpbWUgaW5mb3JtYXRpb24gaW4gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbmNvbnN0IGNsaWVudElkZW50aWZpZXIgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9JREVOVElGSUVSO1xuY29uc3QgY2xpZW50UGFzc2tleSA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX1BBU1NLRVk7XG5jb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9CQVNFX1VSTDtcblxuY29uc3QgY2xpZW50ID0gbmV3IExNU3R1ZGlvQ2xpZW50KHtcbiAgY2xpZW50SWRlbnRpZmllcixcbiAgY2xpZW50UGFzc2tleSxcbiAgYmFzZVVybCxcbn0pO1xuXG4oZ2xvYmFsVGhpcyBhcyBhbnkpLl9fTE1TX1BMVUdJTl9DT05URVhUID0gdHJ1ZTtcblxubGV0IHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IGZhbHNlO1xubGV0IHByb21wdFByZXByb2Nlc3NvclNldCA9IGZhbHNlO1xubGV0IGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgdG9vbHNQcm92aWRlclNldCA9IGZhbHNlO1xubGV0IGdlbmVyYXRvclNldCA9IGZhbHNlO1xuXG5jb25zdCBzZWxmUmVnaXN0cmF0aW9uSG9zdCA9IGNsaWVudC5wbHVnaW5zLmdldFNlbGZSZWdpc3RyYXRpb25Ib3N0KCk7XG5cbmNvbnN0IHBsdWdpbkNvbnRleHQ6IFBsdWdpbkNvbnRleHQgPSB7XG4gIHdpdGhQcmVkaWN0aW9uTG9vcEhhbmRsZXI6IChnZW5lcmF0ZSkgPT4ge1xuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHRvb2xzIHByb3ZpZGVyXCIpO1xuICAgIH1cblxuICAgIHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJlZGljdGlvbkxvb3BIYW5kbGVyKGdlbmVyYXRlKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFByb21wdFByZXByb2Nlc3NvcjogKHByZXByb2Nlc3MpID0+IHtcbiAgICBpZiAocHJvbXB0UHJlcHJvY2Vzc29yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9tcHRQcmVwcm9jZXNzb3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aENvbmZpZ1NjaGVtYXRpY3M6IChjb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGNvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgY29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0Q29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdsb2JhbENvbmZpZ1NjaGVtYXRpY3M6IChnbG9iYWxDb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdsb2JhbCBjb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdsb2JhbENvbmZpZ1NjaGVtYXRpY3MoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhUb29sc1Byb3ZpZGVyOiAodG9vbHNQcm92aWRlcikgPT4ge1xuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSBwcmVkaWN0aW9uTG9vcEhhbmRsZXJcIik7XG4gICAgfVxuXG4gICAgdG9vbHNQcm92aWRlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0VG9vbHNQcm92aWRlcih0b29sc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdlbmVyYXRvcjogKGdlbmVyYXRvcikgPT4ge1xuICAgIGlmIChnZW5lcmF0b3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuXG4gICAgZ2VuZXJhdG9yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHZW5lcmF0b3IoZ2VuZXJhdG9yKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbn07XG5cbmltcG9ydChcIi4vLi4vc3JjL2luZGV4LnRzXCIpLnRoZW4oYXN5bmMgbW9kdWxlID0+IHtcbiAgcmV0dXJuIGF3YWl0IG1vZHVsZS5tYWluKHBsdWdpbkNvbnRleHQpO1xufSkudGhlbigoKSA9PiB7XG4gIHNlbGZSZWdpc3RyYXRpb25Ib3N0LmluaXRDb21wbGV0ZWQoKTtcbn0pLmNhdGNoKChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgdGhlIG1haW4gZnVuY3Rpb24gb2YgdGhlIHBsdWdpbi5cIik7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdCQUVhLHlCQVFBO0FBVmI7QUFBQTtBQUFBO0FBQUEsaUJBQXVDO0FBRWhDLElBQU0sMEJBQTBCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBUWhDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixhQUFhO0FBQUEsTUFDZjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUFBLE1BQ3JDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBSyxLQUFLLEdBQUssTUFBTSxLQUFLO0FBQUEsTUFDM0M7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxNQUFNLElBQUk7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxLQUFLLE1BQU0sR0FBRztBQUFBLE1BQ3ZDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFB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QUFBLEVBQ0EsNEJBQTRCLENBQUMsMkJBQTJCO0FBQ3RELFFBQUksMkJBQTJCO0FBQzdCLFlBQU0sSUFBSSxNQUFNLDZDQUE2QztBQUFBLElBQy9EO0FBQ0EsZ0NBQTRCO0FBQzVCLHlCQUFxQiwwQkFBMEIsc0JBQXNCO0FBQ3JFLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxtQkFBbUIsQ0FBQyxrQkFBa0I7QUFDcEMsUUFBSSxrQkFBa0I7QUFDcEIsWUFBTSxJQUFJLE1BQU0sbUNBQW1DO0FBQUEsSUFDckQ7QUFDQSxRQUFJLDBCQUEwQjtBQUM1QixZQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxJQUM5RTtBQUVBLHVCQUFtQjtBQUNuQix5QkFBcUIsaUJBQWlCLGFBQWE7QUFDbkQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLGVBQWUsQ0FBQyxjQUFjO0FBQzVCLFFBQUksY0FBYztBQUNoQixZQUFNLElBQUksTUFBTSw4QkFBOEI7QUFBQSxJQUNoRDtBQUVBLG1CQUFlO0FBQ2YseUJBQXFCLGFBQWEsU0FBUztBQUMzQyxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsd0RBQTRCLEtBQUssT0FBTUMsWUFBVTtBQUMvQyxTQUFPLE1BQU1BLFFBQU8sS0FBSyxhQUFhO0FBQ3hDLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDWix1QkFBcUIsY0FBYztBQUNyQyxDQUFDLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDbEIsVUFBUSxNQUFNLG9EQUFvRDtBQUNsRSxVQUFRLE1BQU0sS0FBSztBQUNyQixDQUFDOyIsCiAgIm5hbWVzIjogWyJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgImNsaWVudCIsICJyZXNvbHZlIiwgInBkZlBhcnNlIiwgImZzIiwgInJlc29sdmUiLCAiaW1wb3J0X3Rlc3NlcmFjdCIsICJmcyIsICJjbGllbnQiLCAicGF0aCIsICJjaHVua1RleHQiLCAicmVzb2x2ZSIsICJmcyIsICJmcyIsICJwYXRoIiwgImZzIiwgInBhdGgiLCAiUFF1ZXVlIiwgInZlY3RvclN0b3JlIiwgImNsaWVudCIsICJyZXNvbHZlIiwgImNsaWVudCIsICJ2ZWN0b3JTdG9yZSIsICJwYXRoIiwgImltcG9ydF9zZGsiLCAicHJlcHJvY2VzcyIsICJjb25maWdTY2hlbWF0aWNzIiwgIm1vZHVsZSJdCn0K
