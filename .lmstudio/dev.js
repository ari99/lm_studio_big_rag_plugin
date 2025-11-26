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
var import_sdk, configSchematics;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    import_sdk = require("@lmstudio/sdk");
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
    let processedContent = "";
    let processedPreview = "";
    const prefix = "The following passages were found in your indexed documents:\n\n";
    processedContent += prefix;
    processedPreview += prefix;
    let citationNumber = 1;
    for (const result of results) {
      const fileName = path6.basename(result.filePath);
      const citationLabel = `Citation ${citationNumber} (from ${fileName}, score: ${result.score.toFixed(3)}): `;
      processedContent += `
${citationLabel}"${result.text}"

`;
      processedPreview += `
${citationLabel}"${summarizeText(result.text)}"

`;
      citationNumber++;
    }
    const suffix = `Use the citations above to respond to the user query, only if they are relevant. Otherwise, respond to the best of your ability without them.

User Query:

${userPrompt}`;
    processedContent += suffix;
    processedPreview += suffix;
    ctl.debug("Processed content (preview):", processedPreview);
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
${processedPreview}`);
    ctl.createStatus({
      status: "done",
      text: `Final prompt sent to model (preview):
${processedPreview}`
    });
    await warnIfContextOverflow(ctl, processedContent);
    return processedContent;
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
var path6, vectorStore, lastIndexedDir, sanityChecksPassed;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vZmlsZVNjYW5uZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvaHRtbFBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9wZGZQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZXB1YlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9pbWFnZVBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy90ZXh0UGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2RvY3VtZW50UGFyc2VyLnRzIiwgIi4uL3NyYy91dGlscy90ZXh0Q2h1bmtlci50cyIsICIuLi9zcmMvdXRpbHMvZmlsZUhhc2gudHMiLCAiLi4vc3JjL3V0aWxzL2ZhaWxlZEZpbGVSZWdpc3RyeS50cyIsICIuLi9zcmMvaW5nZXN0aW9uL2luZGV4TWFuYWdlci50cyIsICIuLi9zcmMvaW5nZXN0aW9uL3J1bkluZGV4aW5nLnRzIiwgIi4uL3NyYy9wcm9tcHRQcmVwcm9jZXNzb3IudHMiLCAiLi4vc3JjL2luZGV4LnRzIiwgImVudHJ5LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBjcmVhdGVDb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IGNvbmZpZ1NjaGVtYXRpY3MgPSBjcmVhdGVDb25maWdTY2hlbWF0aWNzKClcbiAgLmZpZWxkKFxuICAgIFwiZG9jdW1lbnRzRGlyZWN0b3J5XCIsXG4gICAgXCJzdHJpbmdcIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJEb2N1bWVudHMgRGlyZWN0b3J5XCIsXG4gICAgICBzdWJ0aXRsZTogXCJSb290IGRpcmVjdG9yeSBjb250YWluaW5nIGRvY3VtZW50cyB0byBpbmRleC4gQWxsIHN1YmRpcmVjdG9yaWVzIHdpbGwgYmUgc2Nhbm5lZC5cIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIi9wYXRoL3RvL2RvY3VtZW50c1wiLFxuICAgIH0sXG4gICAgXCJcIixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJ2ZWN0b3JTdG9yZURpcmVjdG9yeVwiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiVmVjdG9yIFN0b3JlIERpcmVjdG9yeVwiLFxuICAgICAgc3VidGl0bGU6IFwiRGlyZWN0b3J5IHdoZXJlIHRoZSB2ZWN0b3IgZGF0YWJhc2Ugd2lsbCBiZSBzdG9yZWQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCIvcGF0aC90by92ZWN0b3Ivc3RvcmVcIixcbiAgICB9LFxuICAgIFwiXCIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicmV0cmlldmFsTGltaXRcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEsXG4gICAgICBtYXg6IDIwLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUmV0cmlldmFsIExpbWl0XCIsXG4gICAgICBzdWJ0aXRsZTogXCJNYXhpbXVtIG51bWJlciBvZiBjaHVua3MgdG8gcmV0dXJuIGR1cmluZyByZXRyaWV2YWwuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAxLCBtYXg6IDIwLCBzdGVwOiAxIH0sXG4gICAgfSxcbiAgICA1LFxuICApXG4gIC5maWVsZChcbiAgICBcInJldHJpZXZhbEFmZmluaXR5VGhyZXNob2xkXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgbWluOiAwLjAsXG4gICAgICBtYXg6IDEuMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlJldHJpZXZhbCBBZmZpbml0eSBUaHJlc2hvbGRcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1pbmltdW0gc2ltaWxhcml0eSBzY29yZSBmb3IgYSBjaHVuayB0byBiZSBjb25zaWRlcmVkIHJlbGV2YW50LlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMC4wLCBtYXg6IDEuMCwgc3RlcDogMC4wMSB9LFxuICAgIH0sXG4gICAgMC41LFxuICApXG4gIC5maWVsZChcbiAgICBcImNodW5rU2l6ZVwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMTI4LFxuICAgICAgbWF4OiAyMDQ4LFxuICAgICAgZGlzcGxheU5hbWU6IFwiQ2h1bmsgU2l6ZVwiLFxuICAgICAgc3VidGl0bGU6IFwiU2l6ZSBvZiB0ZXh0IGNodW5rcyBmb3IgZW1iZWRkaW5nIChpbiB0b2tlbnMpLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMTI4LCBtYXg6IDIwNDgsIHN0ZXA6IDEyOCB9LFxuICAgIH0sXG4gICAgNTEyLFxuICApXG4gIC5maWVsZChcbiAgICBcImNodW5rT3ZlcmxhcFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMCxcbiAgICAgIG1heDogNTEyLFxuICAgICAgZGlzcGxheU5hbWU6IFwiQ2h1bmsgT3ZlcmxhcFwiLFxuICAgICAgc3VidGl0bGU6IFwiT3ZlcmxhcCBiZXR3ZWVuIGNvbnNlY3V0aXZlIGNodW5rcyAoaW4gdG9rZW5zKS5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDAsIG1heDogNTEyLCBzdGVwOiAzMiB9LFxuICAgIH0sXG4gICAgMTAwLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1heENvbmN1cnJlbnRGaWxlc1wiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIGludDogdHJ1ZSxcbiAgICAgIG1pbjogMSxcbiAgICAgIG1heDogMTAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJNYXggQ29uY3VycmVudCBGaWxlc1wiLFxuICAgICAgc3VidGl0bGU6IFwiTWF4aW11bSBudW1iZXIgb2YgZmlsZXMgdG8gcHJvY2VzcyBjb25jdXJyZW50bHkgZHVyaW5nIGluZGV4aW5nLiBSZWNvbW1lbmQgMSBmb3IgbGFyZ2UgUERGIGRhdGFzZXRzLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMSwgbWF4OiAxMCwgc3RlcDogMSB9LFxuICAgIH0sXG4gICAgMSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJwYXJzZURlbGF5TXNcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDUwMDAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJQYXJzZXIgRGVsYXkgKG1zKVwiLFxuICAgICAgc3VidGl0bGU6IFwiV2FpdCB0aW1lIGJlZm9yZSBwYXJzaW5nIGVhY2ggZG9jdW1lbnQgKGhlbHBzIGF2b2lkIFdlYlNvY2tldCB0aHJvdHRsaW5nKS5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDAsIG1heDogNTAwMCwgc3RlcDogMTAwIH0sXG4gICAgfSxcbiAgICA1MDAsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwiZW5hYmxlT0NSXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiRW5hYmxlIE9DUlwiLFxuICAgICAgc3VidGl0bGU6IFwiRW5hYmxlIE9DUiBmb3IgaW1hZ2UgZmlsZXMgYW5kIGltYWdlLWJhc2VkIFBERnMgdXNpbmcgTE0gU3R1ZGlvJ3MgYnVpbHQtaW4gZG9jdW1lbnQgcGFyc2VyLlwiLFxuICAgIH0sXG4gICAgdHJ1ZSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYW51YWxSZWluZGV4LnRyaWdnZXJcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJNYW51YWwgUmVpbmRleCBUcmlnZ2VyXCIsXG4gICAgICBzdWJ0aXRsZTpcbiAgICAgICAgXCJUb2dnbGUgT04gdG8gcmVxdWVzdCBhbiBpbW1lZGlhdGUgcmVpbmRleC4gVGhlIHBsdWdpbiByZXNldHMgdGhpcyBhZnRlciBydW5uaW5nLiBVc2UgdGhlIFx1MjAxQ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzXHUyMDFEIG9wdGlvbiBiZWxvdyB0byBjb250cm9sIHdoZXRoZXIgdW5jaGFuZ2VkIGZpbGVzIGFyZSBza2lwcGVkLlwiLFxuICAgIH0sXG4gICAgZmFsc2UsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWFudWFsUmVpbmRleC5za2lwUHJldmlvdXNseUluZGV4ZWRcIixcbiAgICBcImJvb2xlYW5cIixcbiAgICB7XG4gICAgICBkaXNwbGF5TmFtZTogXCJTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlc1wiLFxuICAgICAgc3VidGl0bGU6IFwiU2tpcCB1bmNoYW5nZWQgZmlsZXMgZm9yIGZhc3RlciBtYW51YWwgcnVucy4gT25seSBpbmRleGVzIG5ldyBmaWxlcyBvciBjaGFuZ2VkIGZpbGVzLlwiLFxuICAgICAgZGVwZW5kZW5jaWVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwibWFudWFsUmVpbmRleC50cmlnZ2VyXCIsXG4gICAgICAgICAgY29uZGl0aW9uOiB7IHR5cGU6IFwiZXF1YWxzXCIsIHZhbHVlOiB0cnVlIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAgdHJ1ZSxcbiAgKVxuICAuYnVpbGQoKTtcblxuIiwgImltcG9ydCB7IExvY2FsSW5kZXggfSBmcm9tIFwidmVjdHJhXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBEb2N1bWVudENodW5rIHtcbiAgaWQ6IHN0cmluZztcbiAgdGV4dDogc3RyaW5nO1xuICB2ZWN0b3I6IG51bWJlcltdO1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBmaWxlTmFtZTogc3RyaW5nO1xuICBmaWxlSGFzaDogc3RyaW5nO1xuICBjaHVua0luZGV4OiBudW1iZXI7XG4gIG1ldGFkYXRhOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlYXJjaFJlc3VsdCB7XG4gIHRleHQ6IHN0cmluZztcbiAgc2NvcmU6IG51bWJlcjtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBtZXRhZGF0YTogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFZlY3RvclN0b3JlIHtcbiAgcHJpdmF0ZSBpbmRleDogTG9jYWxJbmRleCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRiUGF0aDogc3RyaW5nO1xuICBwcml2YXRlIGluZGV4UGF0aDogc3RyaW5nO1xuICBwcml2YXRlIHVwZGF0ZU11dGV4OiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgY29uc3RydWN0b3IoZGJQYXRoOiBzdHJpbmcpIHtcbiAgICB0aGlzLmRiUGF0aCA9IHBhdGgucmVzb2x2ZShkYlBhdGgpO1xuICAgIHRoaXMuaW5kZXhQYXRoID0gdGhpcy5kYlBhdGg7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlc29sdmVJbmRleFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAoYXdhaXQgdGhpcy5wYXRoQ29udGFpbnNJbmRleCh0aGlzLmRiUGF0aCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmRiUGF0aDtcbiAgICB9XG5cbiAgICBjb25zdCBuZXN0ZWRWZWN0cmFQYXRoID0gcGF0aC5qb2luKHRoaXMuZGJQYXRoLCBcInZlY3RyYV9pbmRleFwiKTtcbiAgICBpZiAoYXdhaXQgdGhpcy5wYXRoQ29udGFpbnNJbmRleChuZXN0ZWRWZWN0cmFQYXRoKSkge1xuICAgICAgcmV0dXJuIG5lc3RlZFZlY3RyYVBhdGg7XG4gICAgfVxuXG4gICAgY29uc3QgdHJpbW1lZERiUGF0aCA9IHRoaXMuZGJQYXRoLnJlcGxhY2UoL1tcXFxcL10rJC8sIFwiXCIpO1xuICAgIGlmIChwYXRoLmJhc2VuYW1lKHRyaW1tZWREYlBhdGgpID09PSBcInZlY3RyYV9pbmRleFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5kYlBhdGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5lc3RlZFZlY3RyYVBhdGg7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHBhdGhDb250YWluc0luZGV4KHRhcmdldERpcjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGluZGV4RmlsZSA9IHBhdGguam9pbih0YXJnZXREaXIsIFwiaW5kZXguanNvblwiKTtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2VzcyhpbmRleEZpbGUpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgdGhlIHZlY3RvciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5pbmRleFBhdGggPSBhd2FpdCB0aGlzLnJlc29sdmVJbmRleFBhdGgoKTtcblxuICAgICAgLy8gRW5zdXJlIGRpcmVjdG9yeSBleGlzdHNcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKHRoaXMuaW5kZXhQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIFxuICAgICAgLy8gQ3JlYXRlIG9yIG9wZW4gVmVjdHJhIGluZGV4XG4gICAgICB0aGlzLmluZGV4ID0gbmV3IExvY2FsSW5kZXgodGhpcy5pbmRleFBhdGgpO1xuICAgICAgXG4gICAgICAvLyBDaGVjayBpZiBpbmRleCBleGlzdHMsIGlmIG5vdCBjcmVhdGUgaXRcbiAgICAgIGlmICghKGF3YWl0IHRoaXMuaW5kZXguaXNJbmRleENyZWF0ZWQoKSkpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbmRleC5jcmVhdGVJbmRleCgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBpbml0aWFsaXppbmcgdmVjdG9yIHN0b3JlOlwiLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQWRkIGRvY3VtZW50IGNodW5rcyB0byB0aGUgdmVjdG9yIHN0b3JlXG4gICAqIFVzZXMgYSBtdXRleCB0byBwcmV2ZW50IGNvbmN1cnJlbnQgdXBkYXRlc1xuICAgKi9cbiAgYXN5bmMgYWRkQ2h1bmtzKGNodW5rczogRG9jdW1lbnRDaHVua1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmluZGV4KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJWZWN0b3Igc3RvcmUgbm90IGluaXRpYWxpemVkXCIpO1xuICAgIH1cblxuICAgIGlmIChjaHVua3MubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgYW55IHBlbmRpbmcgdXBkYXRlcyB0byBjb21wbGV0ZSwgdGhlbiBydW4gdGhpcyB1cGRhdGVcbiAgICB0aGlzLnVwZGF0ZU11dGV4ID0gdGhpcy51cGRhdGVNdXRleC50aGVuKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gQmVnaW4gYmF0Y2ggdXBkYXRlXG4gICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmJlZ2luVXBkYXRlKCk7XG5cbiAgICAgIGZvciAoY29uc3QgY2h1bmsgb2YgY2h1bmtzKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEudXBzZXJ0SXRlbSh7XG4gICAgICAgICAgaWQ6IGNodW5rLmlkLFxuICAgICAgICAgIHZlY3RvcjogY2h1bmsudmVjdG9yLFxuICAgICAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgICAgICB0ZXh0OiBjaHVuay50ZXh0LFxuICAgICAgICAgICAgZmlsZVBhdGg6IGNodW5rLmZpbGVQYXRoLFxuICAgICAgICAgICAgZmlsZU5hbWU6IGNodW5rLmZpbGVOYW1lLFxuICAgICAgICAgICAgZmlsZUhhc2g6IGNodW5rLmZpbGVIYXNoLFxuICAgICAgICAgICAgY2h1bmtJbmRleDogY2h1bmsuY2h1bmtJbmRleCxcbiAgICAgICAgICAgIC4uLmNodW5rLm1ldGFkYXRhLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBDb21taXQgdGhlIGJhdGNoXG4gICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmVuZFVwZGF0ZSgpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhgQWRkZWQgJHtjaHVua3MubGVuZ3RofSBjaHVua3MgdG8gdmVjdG9yIHN0b3JlYCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBhZGRpbmcgY2h1bmtzIHRvIHZlY3RvciBzdG9yZTpcIiwgZXJyb3IpO1xuICAgICAgICAvLyBTdGlsbCBlbmQgdGhlIHVwZGF0ZSBvbiBlcnJvciB0byBwcmV2ZW50IGxvY2tcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5lbmRVcGRhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIElnbm9yZSBlcnJvciBpZiBhbHJlYWR5IGVuZGVkXG4gICAgICAgIH1cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFJldHVybiB0aGUgbXV0ZXggcHJvbWlzZSBzbyBjYWxsZXIgY2FuIGF3YWl0IGNvbXBsZXRpb25cbiAgICByZXR1cm4gdGhpcy51cGRhdGVNdXRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggZm9yIHNpbWlsYXIgY2h1bmtzXG4gICAqL1xuICBhc3luYyBzZWFyY2goXG4gICAgcXVlcnlWZWN0b3I6IG51bWJlcltdLFxuICAgIGxpbWl0OiBudW1iZXIgPSA1LFxuICAgIHRocmVzaG9sZDogbnVtYmVyID0gMC41LFxuICApOiBQcm9taXNlPFNlYXJjaFJlc3VsdFtdPiB7XG4gICAgaWYgKCF0aGlzLmluZGV4KSB7XG4gICAgICBjb25zb2xlLmxvZyhcIk5vIGluZGV4IGF2YWlsYWJsZSBmb3Igc2VhcmNoXCIpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdGhpcy5pbmRleC5xdWVyeUl0ZW1zKHF1ZXJ5VmVjdG9yLCBsaW1pdCk7XG5cbiAgICAgIHJldHVybiByZXN1bHRzXG4gICAgICAgIC5maWx0ZXIoKHJlc3VsdCkgPT4gcmVzdWx0LnNjb3JlID49IHRocmVzaG9sZClcbiAgICAgICAgLm1hcCgocmVzdWx0KSA9PiAoe1xuICAgICAgICAgIHRleHQ6IHJlc3VsdC5pdGVtLm1ldGFkYXRhLnRleHQgYXMgc3RyaW5nLFxuICAgICAgICAgIHNjb3JlOiByZXN1bHQuc2NvcmUsXG4gICAgICAgICAgZmlsZVBhdGg6IHJlc3VsdC5pdGVtLm1ldGFkYXRhLmZpbGVQYXRoIGFzIHN0cmluZyxcbiAgICAgICAgICBmaWxlTmFtZTogcmVzdWx0Lml0ZW0ubWV0YWRhdGEuZmlsZU5hbWUgYXMgc3RyaW5nLFxuICAgICAgICAgIGNodW5rSW5kZXg6IHJlc3VsdC5pdGVtLm1ldGFkYXRhLmNodW5rSW5kZXggYXMgbnVtYmVyLFxuICAgICAgICAgIG1ldGFkYXRhOiByZXN1bHQuaXRlbS5tZXRhZGF0YSxcbiAgICAgICAgfSkpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2VhcmNoaW5nIHZlY3RvciBzdG9yZTpcIiwgZXJyb3IpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgY2h1bmtzIGZvciBhIHNwZWNpZmljIGZpbGUgKGJ5IGhhc2gpXG4gICAqIFVzZXMgYSBtdXRleCB0byBwcmV2ZW50IGNvbmN1cnJlbnQgdXBkYXRlc1xuICAgKi9cbiAgYXN5bmMgZGVsZXRlQnlGaWxlSGFzaChmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmluZGV4KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgYW55IHBlbmRpbmcgdXBkYXRlcyB0byBjb21wbGV0ZSwgdGhlbiBydW4gdGhpcyBkZWxldGVcbiAgICB0aGlzLnVwZGF0ZU11dGV4ID0gdGhpcy51cGRhdGVNdXRleC50aGVuKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5iZWdpblVwZGF0ZSgpO1xuICAgICAgXG4gICAgICAvLyBHZXQgYWxsIGl0ZW1zIGFuZCBmaWx0ZXIgYnkgZmlsZUhhc2hcbiAgICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmluZGV4IS5saXN0SXRlbXMoKTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFsbEl0ZW1zKSB7XG4gICAgICAgIGlmIChpdGVtLm1ldGFkYXRhLmZpbGVIYXNoID09PSBmaWxlSGFzaCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuZGVsZXRlSXRlbShpdGVtLmlkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmVuZFVwZGF0ZSgpO1xuICAgICAgXG4gICAgICBjb25zb2xlLmxvZyhgRGVsZXRlZCBjaHVua3MgZm9yIGZpbGUgaGFzaDogJHtmaWxlSGFzaH1gKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZGVsZXRpbmcgY2h1bmtzIGZvciBmaWxlIGhhc2ggJHtmaWxlSGFzaH06YCwgZXJyb3IpO1xuICAgICAgICAvLyBTdGlsbCBlbmQgdGhlIHVwZGF0ZSBvbiBlcnJvciB0byBwcmV2ZW50IGxvY2tcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5lbmRVcGRhdGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIElnbm9yZSBlcnJvciBpZiBhbHJlYWR5IGVuZGVkXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZU11dGV4O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgZmlsZSAoYnkgaGFzaCkgZXhpc3RzIGluIHRoZSBzdG9yZVxuICAgKi9cbiAgYXN5bmMgaGFzRmlsZShmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKCF0aGlzLmluZGV4KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgdGhpcy5pbmRleC5saXN0SXRlbXMoKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIGFsbEl0ZW1zLnNvbWUoKGl0ZW0pID0+IGl0ZW0ubWV0YWRhdGEuZmlsZUhhc2ggPT09IGZpbGVIYXNoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgY2hlY2tpbmcgZmlsZSBoYXNoICR7ZmlsZUhhc2h9OmAsIGVycm9yKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbWFwIG9mIGZpbGUgcGF0aHMgdG8gdGhlIHNldCBvZiBoYXNoZXMgY3VycmVudGx5IHN0b3JlZC5cbiAgICovXG4gIGFzeW5jIGdldEZpbGVIYXNoSW52ZW50b3J5KCk6IFByb21pc2U8TWFwPHN0cmluZywgU2V0PHN0cmluZz4+PiB7XG4gICAgY29uc3QgaW52ZW50b3J5ID0gbmV3IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PigpO1xuICAgIGlmICghdGhpcy5pbmRleCkge1xuICAgICAgcmV0dXJuIGludmVudG9yeTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgYWxsSXRlbXMgPSBhd2FpdCB0aGlzLmluZGV4Lmxpc3RJdGVtcygpO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIGFsbEl0ZW1zKSB7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gaXRlbS5tZXRhZGF0YS5maWxlUGF0aCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnN0IGZpbGVIYXNoID0gaXRlbS5tZXRhZGF0YS5maWxlSGFzaCBhcyBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghZmlsZVBhdGggfHwgIWZpbGVIYXNoKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGhhc2hlcyA9IGludmVudG9yeS5nZXQoZmlsZVBhdGgpO1xuICAgICAgICBpZiAoIWhhc2hlcykge1xuICAgICAgICAgIGhhc2hlcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICAgIGludmVudG9yeS5zZXQoZmlsZVBhdGgsIGhhc2hlcyk7XG4gICAgICAgIH1cbiAgICAgICAgaGFzaGVzLmFkZChmaWxlSGFzaCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gaW52ZW50b3J5O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgYnVpbGRpbmcgZmlsZSBoYXNoIGludmVudG9yeTpcIiwgZXJyb3IpO1xuICAgICAgcmV0dXJuIGludmVudG9yeTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IHN0YXRpc3RpY3MgYWJvdXQgdGhlIHZlY3RvciBzdG9yZVxuICAgKi9cbiAgYXN5bmMgZ2V0U3RhdHMoKTogUHJvbWlzZTx7IHRvdGFsQ2h1bmtzOiBudW1iZXI7IHVuaXF1ZUZpbGVzOiBudW1iZXIgfT4ge1xuICAgIGlmICghdGhpcy5pbmRleCkge1xuICAgICAgcmV0dXJuIHsgdG90YWxDaHVua3M6IDAsIHVuaXF1ZUZpbGVzOiAwIH07XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgdGhpcy5pbmRleC5saXN0SXRlbXMoKTtcbiAgICAgIGNvbnN0IHVuaXF1ZUhhc2hlcyA9IG5ldyBTZXQoXG4gICAgICAgIGFsbEl0ZW1zLm1hcCgoaXRlbSkgPT4gaXRlbS5tZXRhZGF0YS5maWxlSGFzaCBhcyBzdHJpbmcpXG4gICAgICApO1xuICAgICAgXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b3RhbENodW5rczogYWxsSXRlbXMubGVuZ3RoLFxuICAgICAgICB1bmlxdWVGaWxlczogdW5pcXVlSGFzaGVzLnNpemUsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZ2V0dGluZyBzdGF0czpcIiwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHsgdG90YWxDaHVua3M6IDAsIHVuaXF1ZUZpbGVzOiAwIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSB2ZWN0b3Igc3RvcmUgY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgY2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gVmVjdHJhIGRvZXNuJ3QgcmVxdWlyZSBleHBsaWNpdCBjbG9zaW5nXG4gICAgdGhpcy5pbmRleCA9IG51bGw7XG4gIH1cbn1cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIG9zIGZyb20gXCJvc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNhbml0eUNoZWNrUmVzdWx0IHtcbiAgcGFzc2VkOiBib29sZWFuO1xuICB3YXJuaW5nczogc3RyaW5nW107XG4gIGVycm9yczogc3RyaW5nW107XG59XG5cbi8qKlxuICogUGVyZm9ybSBzYW5pdHkgY2hlY2tzIGJlZm9yZSBpbmRleGluZyBsYXJnZSBkaXJlY3Rvcmllc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGVyZm9ybVNhbml0eUNoZWNrcyhcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmcsXG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmcsXG4pOiBQcm9taXNlPFNhbml0eUNoZWNrUmVzdWx0PiB7XG4gIGNvbnN0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBlcnJvcnM6IHN0cmluZ1tdID0gW107XG5cbiAgLy8gQ2hlY2sgaWYgZGlyZWN0b3JpZXMgZXhpc3RcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3MoZG9jdW1lbnRzRGlyLCBmcy5jb25zdGFudHMuUl9PSyk7XG4gIH0gY2F0Y2gge1xuICAgIGVycm9ycy5wdXNoKGBEb2N1bWVudHMgZGlyZWN0b3J5IGRvZXMgbm90IGV4aXN0IG9yIGlzIG5vdCByZWFkYWJsZTogJHtkb2N1bWVudHNEaXJ9YCk7XG4gIH1cblxuICB0cnkge1xuICAgIGF3YWl0IGZzLnByb21pc2VzLmFjY2Vzcyh2ZWN0b3JTdG9yZURpciwgZnMuY29uc3RhbnRzLldfT0spO1xuICB9IGNhdGNoIHtcbiAgICAvLyBUcnkgdG8gY3JlYXRlIGl0XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLm1rZGlyKHZlY3RvclN0b3JlRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGVycm9ycy5wdXNoKFxuICAgICAgICBgVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdCBhbmQgY2Fubm90IGJlIGNyZWF0ZWQ6ICR7dmVjdG9yU3RvcmVEaXJ9YFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICAvLyBDaGVjayBhdmFpbGFibGUgZGlzayBzcGFjZVxuICB0cnkge1xuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdGZzKHZlY3RvclN0b3JlRGlyKTtcbiAgICBjb25zdCBhdmFpbGFibGVHQiA9IChzdGF0cy5iYXZhaWwgKiBzdGF0cy5ic2l6ZSkgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgICBcbiAgICBpZiAoYXZhaWxhYmxlR0IgPCAxKSB7XG4gICAgICBlcnJvcnMucHVzaChgVmVyeSBsb3cgZGlzayBzcGFjZSBhdmFpbGFibGU6ICR7YXZhaWxhYmxlR0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9IGVsc2UgaWYgKGF2YWlsYWJsZUdCIDwgMTApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goYExvdyBkaXNrIHNwYWNlIGF2YWlsYWJsZTogJHthdmFpbGFibGVHQi50b0ZpeGVkKDIpfSBHQmApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiQ291bGQgbm90IGNoZWNrIGF2YWlsYWJsZSBkaXNrIHNwYWNlXCIpO1xuICB9XG5cbiAgLy8gQ2hlY2sgYXZhaWxhYmxlIG1lbW9yeVxuICBjb25zdCBmcmVlTWVtb3J5R0IgPSBvcy5mcmVlbWVtKCkgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgY29uc3QgdG90YWxNZW1vcnlHQiA9IG9zLnRvdGFsbWVtKCkgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgY29uc3QgcnVubmluZ09uTWFjID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIjtcbiAgY29uc3QgbG93TWVtb3J5TWVzc2FnZSA9XG4gICAgYExvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0Igb2YgJHt0b3RhbE1lbW9yeUdCLnRvRml4ZWQoMil9IEdCIHRvdGFsLiBgICtcbiAgICBcIkNvbnNpZGVyIHJlZHVjaW5nIGNvbmN1cnJlbnQgZmlsZSBwcm9jZXNzaW5nLlwiO1xuICBjb25zdCB2ZXJ5TG93TWVtb3J5TWVzc2FnZSA9XG4gICAgYFZlcnkgbG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQi4gYCArXG4gICAgKHJ1bm5pbmdPbk1hY1xuICAgICAgPyBcIm1hY09TIG1heSBiZSByZXBvcnRpbmcgY2FjaGVkIHBhZ2VzIGFzIHVzZWQ7IGNhY2hlZCBtZW1vcnkgY2FuIHVzdWFsbHkgYmUgcmVjbGFpbWVkIGF1dG9tYXRpY2FsbHkuXCJcbiAgICAgIDogXCJJbmRleGluZyBtYXkgZmFpbCBkdWUgdG8gaW5zdWZmaWNpZW50IFJBTS5cIik7XG5cbiAgaWYgKGZyZWVNZW1vcnlHQiA8IDAuNSkge1xuICAgIGlmIChydW5uaW5nT25NYWMpIHtcbiAgICAgIHdhcm5pbmdzLnB1c2godmVyeUxvd01lbW9yeU1lc3NhZ2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBlcnJvcnMucHVzaChgVmVyeSBsb3cgZnJlZSBtZW1vcnk6ICR7ZnJlZU1lbW9yeUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGZyZWVNZW1vcnlHQiA8IDIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKGxvd01lbW9yeU1lc3NhZ2UpO1xuICB9XG5cbiAgLy8gRXN0aW1hdGUgZGlyZWN0b3J5IHNpemUgKHNhbXBsZS1iYXNlZCBmb3IgcGVyZm9ybWFuY2UpXG4gIHRyeSB7XG4gICAgY29uc3Qgc2FtcGxlU2l6ZSA9IGF3YWl0IGVzdGltYXRlRGlyZWN0b3J5U2l6ZShkb2N1bWVudHNEaXIpO1xuICAgIGNvbnN0IGVzdGltYXRlZEdCID0gc2FtcGxlU2l6ZSAvICgxMDI0ICogMTAyNCAqIDEwMjQpO1xuICAgIFxuICAgIGlmIChlc3RpbWF0ZWRHQiA+IDEwMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgYExhcmdlIGRpcmVjdG9yeSBkZXRlY3RlZCAofiR7ZXN0aW1hdGVkR0IudG9GaXhlZCgxKX0gR0IpLiBJbml0aWFsIGluZGV4aW5nIG1heSB0YWtlIHNldmVyYWwgaG91cnMuYFxuICAgICAgKTtcbiAgICB9IGVsc2UgaWYgKGVzdGltYXRlZEdCID4gMTApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGBNZWRpdW0tc2l6ZWQgZGlyZWN0b3J5IGRldGVjdGVkICh+JHtlc3RpbWF0ZWRHQi50b0ZpeGVkKDEpfSBHQikuIEluaXRpYWwgaW5kZXhpbmcgbWF5IHRha2UgMzAtNjAgbWludXRlcy5gXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFwiQ291bGQgbm90IGVzdGltYXRlIGRpcmVjdG9yeSBzaXplXCIpO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgdmVjdG9yIHN0b3JlIGFscmVhZHkgaGFzIGRhdGFcbiAgdHJ5IHtcbiAgICBjb25zdCBmaWxlcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIodmVjdG9yU3RvcmVEaXIpO1xuICAgIGlmIChmaWxlcy5sZW5ndGggPiAwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBcIlZlY3RvciBzdG9yZSBkaXJlY3RvcnkgaXMgbm90IGVtcHR5LiBFeGlzdGluZyBkYXRhIHdpbGwgYmUgdXNlZCBmb3IgaW5jcmVtZW50YWwgaW5kZXhpbmcuXCJcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBEaXJlY3RvcnkgZG9lc24ndCBleGlzdCB5ZXQsIHRoYXQncyBmaW5lXG4gIH1cblxuICByZXR1cm4ge1xuICAgIHBhc3NlZDogZXJyb3JzLmxlbmd0aCA9PT0gMCxcbiAgICB3YXJuaW5ncyxcbiAgICBlcnJvcnMsXG4gIH07XG59XG5cbi8qKlxuICogRXN0aW1hdGUgZGlyZWN0b3J5IHNpemUgYnkgc2FtcGxpbmdcbiAqIChRdWljayBlc3RpbWF0ZSwgbm90IGV4YWN0KVxuICovXG5hc3luYyBmdW5jdGlvbiBlc3RpbWF0ZURpcmVjdG9yeVNpemUoZGlyOiBzdHJpbmcsIG1heFNhbXBsZXM6IG51bWJlciA9IDEwMCk6IFByb21pc2U8bnVtYmVyPiB7XG4gIGxldCB0b3RhbFNpemUgPSAwO1xuICBsZXQgZmlsZUNvdW50ID0gMDtcbiAgbGV0IHNhbXBsZWRTaXplID0gMDtcbiAgbGV0IHNhbXBsZWRDb3VudCA9IDA7XG5cbiAgYXN5bmMgZnVuY3Rpb24gd2FsayhjdXJyZW50RGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoc2FtcGxlZENvdW50ID49IG1heFNhbXBsZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoY3VycmVudERpciwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgaWYgKHNhbXBsZWRDb3VudCA+PSBtYXhTYW1wbGVzKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IGAke2N1cnJlbnREaXJ9LyR7ZW50cnkubmFtZX1gO1xuXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgYXdhaXQgd2FsayhmdWxsUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBmaWxlQ291bnQrKztcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoc2FtcGxlZENvdW50IDwgbWF4U2FtcGxlcykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0KGZ1bGxQYXRoKTtcbiAgICAgICAgICAgICAgc2FtcGxlZFNpemUgKz0gc3RhdHMuc2l6ZTtcbiAgICAgICAgICAgICAgc2FtcGxlZENvdW50Kys7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgLy8gU2tpcCBmaWxlcyB3ZSBjYW4ndCBzdGF0XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBTa2lwIGRpcmVjdG9yaWVzIHdlIGNhbid0IHJlYWRcbiAgICB9XG4gIH1cblxuICBhd2FpdCB3YWxrKGRpcik7XG5cbiAgLy8gRXh0cmFwb2xhdGUgZnJvbSBzYW1wbGVcbiAgaWYgKHNhbXBsZWRDb3VudCA+IDAgJiYgZmlsZUNvdW50ID4gMCkge1xuICAgIGNvbnN0IGF2Z0ZpbGVTaXplID0gc2FtcGxlZFNpemUgLyBzYW1wbGVkQ291bnQ7XG4gICAgdG90YWxTaXplID0gYXZnRmlsZVNpemUgKiBmaWxlQ291bnQ7XG4gIH1cblxuICByZXR1cm4gdG90YWxTaXplO1xufVxuXG4vKipcbiAqIENoZWNrIHN5c3RlbSByZXNvdXJjZXMgYW5kIHByb3ZpZGUgcmVjb21tZW5kYXRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZXNvdXJjZVJlY29tbWVuZGF0aW9ucyhcbiAgZXN0aW1hdGVkU2l6ZUdCOiBudW1iZXIsXG4gIGZyZWVNZW1vcnlHQjogbnVtYmVyLFxuKToge1xuICByZWNvbW1lbmRlZENvbmN1cnJlbmN5OiBudW1iZXI7XG4gIHJlY29tbWVuZGVkQ2h1bmtTaXplOiBudW1iZXI7XG4gIGVzdGltYXRlZFRpbWU6IHN0cmluZztcbn0ge1xuICBsZXQgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDM7XG4gIGxldCByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDUxMjtcbiAgbGV0IGVzdGltYXRlZFRpbWUgPSBcInVua25vd25cIjtcblxuICAvLyBBZGp1c3QgYmFzZWQgb24gYXZhaWxhYmxlIG1lbW9yeVxuICBpZiAoZnJlZU1lbW9yeUdCIDwgMikge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAxO1xuICB9IGVsc2UgaWYgKGZyZWVNZW1vcnlHQiA8IDQpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMjtcbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPj0gOCkge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSA1O1xuICB9XG5cbiAgLy8gQWRqdXN0IGJhc2VkIG9uIGRhdGFzZXQgc2l6ZVxuICBpZiAoZXN0aW1hdGVkU2l6ZUdCIDwgMSkge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjUtMTUgbWludXRlc1wiO1xuICB9IGVsc2UgaWYgKGVzdGltYXRlZFNpemVHQiA8IDEwKSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiMzAtNjAgbWludXRlc1wiO1xuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplID0gNzY4O1xuICB9IGVsc2UgaWYgKGVzdGltYXRlZFNpemVHQiA8IDEwMCkge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjItNCBob3Vyc1wiO1xuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplID0gMTAyNDtcbiAgfSBlbHNlIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCI0LTEyIGhvdXJzXCI7XG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUgPSAxMDI0O1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSBNYXRoLm1pbihyZWNvbW1lbmRlZENvbmN1cnJlbmN5LCAzKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSxcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSxcbiAgICBlc3RpbWF0ZWRUaW1lLFxuICB9O1xufVxuXG4iLCAibGV0IGluZGV4aW5nSW5Qcm9ncmVzcyA9IGZhbHNlO1xuXG4vKipcbiAqIEF0dGVtcHQgdG8gYWNxdWlyZSB0aGUgc2hhcmVkIGluZGV4aW5nIGxvY2suXG4gKiBSZXR1cm5zIHRydWUgaWYgbm8gb3RoZXIgaW5kZXhpbmcgam9iIGlzIHJ1bm5pbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cnlTdGFydEluZGV4aW5nKGNvbnRleHQ6IHN0cmluZyA9IFwidW5rbm93blwiKTogYm9vbGVhbiB7XG4gIGlmIChpbmRleGluZ0luUHJvZ3Jlc3MpIHtcbiAgICBjb25zb2xlLmRlYnVnKGBbQmlnUkFHXSB0cnlTdGFydEluZGV4aW5nICgke2NvbnRleHR9KSBmYWlsZWQ6IGxvY2sgYWxyZWFkeSBoZWxkYCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaW5kZXhpbmdJblByb2dyZXNzID0gdHJ1ZTtcbiAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gdHJ5U3RhcnRJbmRleGluZyAoJHtjb250ZXh0fSkgc3VjY2VlZGVkYCk7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFJlbGVhc2UgdGhlIHNoYXJlZCBpbmRleGluZyBsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZmluaXNoSW5kZXhpbmcoKTogdm9pZCB7XG4gIGluZGV4aW5nSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICBjb25zb2xlLmRlYnVnKFwiW0JpZ1JBR10gZmluaXNoSW5kZXhpbmc6IGxvY2sgcmVsZWFzZWRcIik7XG59XG5cbi8qKlxuICogSW5kaWNhdGVzIHdoZXRoZXIgYW4gaW5kZXhpbmcgam9iIGlzIGN1cnJlbnRseSBydW5uaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNJbmRleGluZygpOiBib29sZWFuIHtcbiAgcmV0dXJuIGluZGV4aW5nSW5Qcm9ncmVzcztcbn1cblxuIiwgImNvbnN0IEhUTUxfRVhURU5TSU9OUyA9IFtcIi5odG1cIiwgXCIuaHRtbFwiLCBcIi54aHRtbFwiXTtcbmNvbnN0IE1BUktET1dOX0VYVEVOU0lPTlMgPSBbXCIubWRcIiwgXCIubWFya2Rvd25cIiwgXCIubWRvd25cIiwgXCIubWR4XCIsIFwiLm1rZFwiLCBcIi5ta2RuXCJdO1xuY29uc3QgVEVYVF9FWFRFTlNJT05TID0gW1wiLnR4dFwiLCBcIi50ZXh0XCJdO1xuY29uc3QgUERGX0VYVEVOU0lPTlMgPSBbXCIucGRmXCJdO1xuY29uc3QgRVBVQl9FWFRFTlNJT05TID0gW1wiLmVwdWJcIl07XG5jb25zdCBJTUFHRV9FWFRFTlNJT05TID0gW1wiLmJtcFwiLCBcIi5qcGdcIiwgXCIuanBlZ1wiLCBcIi5wbmdcIl07XG5jb25zdCBBUkNISVZFX0VYVEVOU0lPTlMgPSBbXCIucmFyXCJdO1xuXG5jb25zdCBBTExfRVhURU5TSU9OX0dST1VQUyA9IFtcbiAgSFRNTF9FWFRFTlNJT05TLFxuICBNQVJLRE9XTl9FWFRFTlNJT05TLFxuICBURVhUX0VYVEVOU0lPTlMsXG4gIFBERl9FWFRFTlNJT05TLFxuICBFUFVCX0VYVEVOU0lPTlMsXG4gIElNQUdFX0VYVEVOU0lPTlMsXG4gIEFSQ0hJVkVfRVhURU5TSU9OUyxcbl07XG5cbmV4cG9ydCBjb25zdCBTVVBQT1JURURfRVhURU5TSU9OUyA9IG5ldyBTZXQoXG4gIEFMTF9FWFRFTlNJT05fR1JPVVBTLmZsYXRNYXAoKGdyb3VwKSA9PiBncm91cC5tYXAoKGV4dCkgPT4gZXh0LnRvTG93ZXJDYXNlKCkpKSxcbik7XG5cbmV4cG9ydCBjb25zdCBIVE1MX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KEhUTUxfRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgTUFSS0RPV05fRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoTUFSS0RPV05fRVhURU5TSU9OUyk7XG5leHBvcnQgY29uc3QgVEVYVF9FWFRFTlNJT05fU0VUID0gbmV3IFNldChURVhUX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IElNQUdFX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KElNQUdFX0VYVEVOU0lPTlMpO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNIdG1sRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBIVE1MX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFya2Rvd25FeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIE1BUktET1dOX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBURVhUX0VYVEVOU0lPTl9TRVQuaGFzKGV4dC50b0xvd2VyQ2FzZSgpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzVGV4dHVhbEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gaXNNYXJrZG93bkV4dGVuc2lvbihleHQpIHx8IGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucygpOiBzdHJpbmdbXSB7XG4gIHJldHVybiBBcnJheS5mcm9tKFNVUFBPUlRFRF9FWFRFTlNJT05TLnZhbHVlcygpKS5zb3J0KCk7XG59XG5cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgbWltZSBmcm9tIFwibWltZS10eXBlc1wiO1xuaW1wb3J0IHtcbiAgU1VQUE9SVEVEX0VYVEVOU0lPTlMsXG4gIGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zLFxufSBmcm9tIFwiLi4vdXRpbHMvc3VwcG9ydGVkRXh0ZW5zaW9uc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNjYW5uZWRGaWxlIHtcbiAgcGF0aDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG4gIGV4dGVuc2lvbjogc3RyaW5nO1xuICBtaW1lVHlwZTogc3RyaW5nIHwgZmFsc2U7XG4gIHNpemU6IG51bWJlcjtcbiAgbXRpbWU6IERhdGU7XG59XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgc2NhbiBhIGRpcmVjdG9yeSBmb3Igc3VwcG9ydGVkIGZpbGVzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzY2FuRGlyZWN0b3J5KFxuICByb290RGlyOiBzdHJpbmcsXG4gIG9uUHJvZ3Jlc3M/OiAoY3VycmVudDogbnVtYmVyLCB0b3RhbDogbnVtYmVyKSA9PiB2b2lkLFxuKTogUHJvbWlzZTxTY2FubmVkRmlsZVtdPiB7XG4gIGNvbnN0IGZpbGVzOiBTY2FubmVkRmlsZVtdID0gW107XG4gIGxldCBzY2FubmVkQ291bnQgPSAwO1xuICBcbiAgY29uc3Qgc3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9uID0gbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMoKS5qb2luKFwiLCBcIik7XG4gIGNvbnNvbGUubG9nKGBbU2Nhbm5lcl0gU3VwcG9ydGVkIGV4dGVuc2lvbnM6ICR7c3VwcG9ydGVkRXh0ZW5zaW9uc0Rlc2NyaXB0aW9ufWApO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoZGlyOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGVudHJ5Lm5hbWUpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICBhd2FpdCB3YWxrKGZ1bGxQYXRoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUoKSkge1xuICAgICAgICAgIHNjYW5uZWRDb3VudCsrO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShlbnRyeS5uYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChTVVBQT1JURURfRVhURU5TSU9OUy5oYXMoZXh0KSkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBmcy5wcm9taXNlcy5zdGF0KGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IG1pbWVUeXBlID0gbWltZS5sb29rdXAoZnVsbFBhdGgpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBmaWxlcy5wdXNoKHtcbiAgICAgICAgICAgICAgcGF0aDogZnVsbFBhdGgsXG4gICAgICAgICAgICAgIG5hbWU6IGVudHJ5Lm5hbWUsXG4gICAgICAgICAgICAgIGV4dGVuc2lvbjogZXh0LFxuICAgICAgICAgICAgICBtaW1lVHlwZSxcbiAgICAgICAgICAgICAgc2l6ZTogc3RhdHMuc2l6ZSxcbiAgICAgICAgICAgICAgbXRpbWU6IHN0YXRzLm10aW1lLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGlmIChvblByb2dyZXNzICYmIHNjYW5uZWRDb3VudCAlIDEwMCA9PT0gMCkge1xuICAgICAgICAgICAgb25Qcm9ncmVzcyhzY2FubmVkQ291bnQsIGZpbGVzLmxlbmd0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHNjYW5uaW5nIGRpcmVjdG9yeSAke2Rpcn06YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxuICBcbiAgYXdhaXQgd2Fsayhyb290RGlyKTtcbiAgXG4gIGlmIChvblByb2dyZXNzKSB7XG4gICAgb25Qcm9ncmVzcyhzY2FubmVkQ291bnQsIGZpbGVzLmxlbmd0aCk7XG4gIH1cbiAgXG4gIHJldHVybiBmaWxlcztcbn1cblxuLyoqXG4gKiBDaGVjayBpZiBhIGZpbGUgdHlwZSBpcyBzdXBwb3J0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3VwcG9ydGVkRmlsZShmaWxlUGF0aDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGV4dCA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCkudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIFNVUFBPUlRFRF9FWFRFTlNJT05TLmhhcyhleHQpO1xufVxuXG4iLCAiaW1wb3J0ICogYXMgY2hlZXJpbyBmcm9tIFwiY2hlZXJpb1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbi8qKlxuICogUGFyc2UgSFRNTC9IVE0gZmlsZXMgYW5kIGV4dHJhY3QgdGV4dCBjb250ZW50XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUhUTUwoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgIGNvbnN0ICQgPSBjaGVlcmlvLmxvYWQoY29udGVudCk7XG4gICAgXG4gICAgLy8gUmVtb3ZlIHNjcmlwdCBhbmQgc3R5bGUgZWxlbWVudHNcbiAgICAkKFwic2NyaXB0LCBzdHlsZSwgbm9zY3JpcHRcIikucmVtb3ZlKCk7XG4gICAgXG4gICAgLy8gRXh0cmFjdCB0ZXh0XG4gICAgY29uc3QgdGV4dCA9ICQoXCJib2R5XCIpLnRleHQoKSB8fCAkLnRleHQoKTtcbiAgICBcbiAgICAvLyBDbGVhbiB1cCB3aGl0ZXNwYWNlXG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAgIC50cmltKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBIVE1MIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbiIsICJpbXBvcnQgeyB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHBkZlBhcnNlIGZyb20gXCJwZGYtcGFyc2VcIjtcbmltcG9ydCB7IGNyZWF0ZVdvcmtlciB9IGZyb20gXCJ0ZXNzZXJhY3QuanNcIjtcbmltcG9ydCB7IFBORyB9IGZyb20gXCJwbmdqc1wiO1xuXG5jb25zdCBNSU5fVEVYVF9MRU5HVEggPSA1MDtcbmNvbnN0IE9DUl9NQVhfUEFHRVMgPSA1MDtcbmNvbnN0IE9DUl9NQVhfSU1BR0VTX1BFUl9QQUdFID0gMztcbmNvbnN0IE9DUl9NSU5fSU1BR0VfQVJFQSA9IDEwXzAwMDtcbmNvbnN0IE9DUl9JTUFHRV9USU1FT1VUX01TID0gMzBfMDAwO1xuXG50eXBlIFBkZkpzTW9kdWxlID0gdHlwZW9mIGltcG9ydChcInBkZmpzLWRpc3QvbGVnYWN5L2J1aWxkL3BkZi5tanNcIik7XG5cbmludGVyZmFjZSBFeHRyYWN0ZWRPY3JJbWFnZSB7XG4gIGJ1ZmZlcjogQnVmZmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgYXJlYTogbnVtYmVyO1xufVxuXG5leHBvcnQgdHlwZSBQZGZGYWlsdXJlUmVhc29uID1cbiAgfCBcInBkZi5sbXN0dWRpby1lcnJvclwiXG4gIHwgXCJwZGYubG1zdHVkaW8tZW1wdHlcIlxuICB8IFwicGRmLnBkZnBhcnNlLWVycm9yXCJcbiAgfCBcInBkZi5wZGZwYXJzZS1lbXB0eVwiXG4gIHwgXCJwZGYub2NyLWRpc2FibGVkXCJcbiAgfCBcInBkZi5vY3ItZXJyb3JcIlxuICB8IFwicGRmLm9jci1yZW5kZXItZXJyb3JcIlxuICB8IFwicGRmLm9jci1lbXB0eVwiO1xuXG50eXBlIFBkZlBhcnNlU3RhZ2UgPSBcImxtc3R1ZGlvXCIgfCBcInBkZi1wYXJzZVwiIHwgXCJvY3JcIjtcbmNsYXNzIEltYWdlRGF0YVRpbWVvdXRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3Iob2JqSWQ6IHN0cmluZykge1xuICAgIHN1cGVyKGBUaW1lZCBvdXQgZmV0Y2hpbmcgaW1hZ2UgZGF0YSBmb3IgJHtvYmpJZH1gKTtcbiAgICB0aGlzLm5hbWUgPSBcIkltYWdlRGF0YVRpbWVvdXRFcnJvclwiO1xuICB9XG59XG5cbmludGVyZmFjZSBQZGZQYXJzZXJTdWNjZXNzIHtcbiAgc3VjY2VzczogdHJ1ZTtcbiAgdGV4dDogc3RyaW5nO1xuICBzdGFnZTogUGRmUGFyc2VTdGFnZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQZGZQYXJzZXJGYWlsdXJlIHtcbiAgc3VjY2VzczogZmFsc2U7XG4gIHJlYXNvbjogUGRmRmFpbHVyZVJlYXNvbjtcbiAgZGV0YWlscz86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgUGRmUGFyc2VyUmVzdWx0ID0gUGRmUGFyc2VyU3VjY2VzcyB8IFBkZlBhcnNlckZhaWx1cmU7XG5cbmZ1bmN0aW9uIGNsZWFuVGV4dCh0ZXh0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGV4dFxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgLnRyaW0oKTtcbn1cblxudHlwZSBTdGFnZVJlc3VsdCA9IFBkZlBhcnNlclN1Y2Nlc3MgfCBQZGZQYXJzZXJGYWlsdXJlO1xuXG5sZXQgY2FjaGVkUGRmanNMaWI6IFBkZkpzTW9kdWxlIHwgbnVsbCA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFBkZmpzTGliKCkge1xuICBpZiAoIWNhY2hlZFBkZmpzTGliKSB7XG4gICAgY2FjaGVkUGRmanNMaWIgPSBhd2FpdCBpbXBvcnQoXCJwZGZqcy1kaXN0L2xlZ2FjeS9idWlsZC9wZGYubWpzXCIpO1xuICB9XG4gIHJldHVybiBjYWNoZWRQZGZqc0xpYjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5TG1TdHVkaW9QYXJzZXIoZmlsZVBhdGg6IHN0cmluZywgY2xpZW50OiBMTVN0dWRpb0NsaWVudCk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgbWF4UmV0cmllcyA9IDI7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIGZvciAobGV0IGF0dGVtcHQgPSAxOyBhdHRlbXB0IDw9IG1heFJldHJpZXM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlSGFuZGxlID0gYXdhaXQgY2xpZW50LmZpbGVzLnByZXBhcmVGaWxlKGZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNsaWVudC5maWxlcy5wYXJzZURvY3VtZW50KGZpbGVIYW5kbGUsIHtcbiAgICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHByb2dyZXNzID09PSAwIHx8IHByb2dyZXNzID09PSAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoTE0gU3R1ZGlvKSBQcm9jZXNzaW5nICR7ZmlsZU5hbWV9OiAkeyhwcm9ncmVzcyAqIDEwMCkudG9GaXhlZCgwKX0lYCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQocmVzdWx0LmNvbnRlbnQpO1xuICAgICAgaWYgKGNsZWFuZWQubGVuZ3RoID49IE1JTl9URVhUX0xFTkdUSCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgdGV4dDogY2xlYW5lZCxcbiAgICAgICAgICBzdGFnZTogXCJsbXN0dWRpb1wiLFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYFtQREYgUGFyc2VyXSAoTE0gU3R1ZGlvKSBQYXJzZWQgYnV0IGdvdCB2ZXJ5IGxpdHRsZSB0ZXh0IGZyb20gJHtmaWxlTmFtZX0gKGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofSksIHdpbGwgdHJ5IGZhbGxiYWNrc2AsXG4gICAgICApO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIHJlYXNvbjogXCJwZGYubG1zdHVkaW8tZW1wdHlcIixcbiAgICAgICAgZGV0YWlsczogYGxlbmd0aD0ke2NsZWFuZWQubGVuZ3RofWAsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBpc1dlYlNvY2tldEVycm9yID1cbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJlxuICAgICAgICAoZXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcIldlYlNvY2tldFwiKSB8fCBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKFwiY29ubmVjdGlvbiBjbG9zZWRcIikpO1xuXG4gICAgICBpZiAoaXNXZWJTb2NrZXRFcnJvciAmJiBhdHRlbXB0IDwgbWF4UmV0cmllcykge1xuICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgYFtQREYgUGFyc2VyXSAoTE0gU3R1ZGlvKSBXZWJTb2NrZXQgZXJyb3Igb24gJHtmaWxlTmFtZX0sIHJldHJ5aW5nICgke2F0dGVtcHR9LyR7bWF4UmV0cmllc30pLi4uYCxcbiAgICAgICAgKTtcbiAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMTAwMCAqIGF0dGVtcHQpKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAoTE0gU3R1ZGlvKSBFcnJvciBwYXJzaW5nIFBERiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVycm9yXCIsXG4gICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVycm9yXCIsXG4gICAgZGV0YWlsczogXCJFeGNlZWRlZCByZXRyeSBhdHRlbXB0c1wiLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlQZGZQYXJzZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcbiAgdHJ5IHtcbiAgICBjb25zdCBidWZmZXIgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcGRmUGFyc2UoYnVmZmVyKTtcbiAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHJlc3VsdC50ZXh0IHx8IFwiXCIpO1xuXG4gICAgaWYgKGNsZWFuZWQubGVuZ3RoID49IE1JTl9URVhUX0xFTkdUSCkge1xuICAgICAgY29uc29sZS5sb2coYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBTdWNjZXNzZnVsbHkgZXh0cmFjdGVkIHRleHQgZnJvbSAke2ZpbGVOYW1lfWApO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgdGV4dDogY2xlYW5lZCxcbiAgICAgICAgc3RhZ2U6IFwicGRmLXBhcnNlXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBWZXJ5IGxpdHRsZSBvciBubyB0ZXh0IGV4dHJhY3RlZCBmcm9tICR7ZmlsZU5hbWV9IChsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH0pYCxcbiAgICApO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYucGRmcGFyc2UtZW1wdHlcIixcbiAgICAgIGRldGFpbHM6IGBsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH1gLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgW1BERiBQYXJzZXJdIChwZGYtcGFyc2UpIEVycm9yIHBhcnNpbmcgUERGIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYucGRmcGFyc2UtZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeU9jcldpdGhQZGZKcyhmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxTdGFnZVJlc3VsdD4ge1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICBsZXQgd29ya2VyOiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVdvcmtlcj4+IHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgcGRmanNMaWIgPSBhd2FpdCBnZXRQZGZqc0xpYigpO1xuICAgIGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheShhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCkpO1xuICAgIGNvbnN0IHBkZkRvY3VtZW50ID0gYXdhaXQgcGRmanNMaWJcbiAgICAgIC5nZXREb2N1bWVudCh7IGRhdGEsIHZlcmJvc2l0eTogcGRmanNMaWIuVmVyYm9zaXR5TGV2ZWwuRVJST1JTIH0pXG4gICAgICAucHJvbWlzZTtcblxuICAgIGNvbnN0IG51bVBhZ2VzID0gcGRmRG9jdW1lbnQubnVtUGFnZXM7XG4gICAgY29uc3QgbWF4UGFnZXMgPSBNYXRoLm1pbihudW1QYWdlcywgT0NSX01BWF9QQUdFUyk7XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgU3RhcnRpbmcgT0NSIGZvciAke2ZpbGVOYW1lfSAtIHBhZ2VzIDEgdG8gJHttYXhQYWdlc30gKG9mICR7bnVtUGFnZXN9KWAsXG4gICAgKTtcblxuICAgIHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICBjb25zdCB0ZXh0UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IHJlbmRlckVycm9ycyA9IDA7XG4gICAgbGV0IHByb2Nlc3NlZEltYWdlcyA9IDA7XG5cbiAgICBmb3IgKGxldCBwYWdlTnVtID0gMTsgcGFnZU51bSA8PSBtYXhQYWdlczsgcGFnZU51bSsrKSB7XG4gICAgICBsZXQgcGFnZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHBhZ2UgPSBhd2FpdCBwZGZEb2N1bWVudC5nZXRQYWdlKHBhZ2VOdW0pO1xuICAgICAgICBjb25zdCBpbWFnZXMgPSBhd2FpdCBleHRyYWN0SW1hZ2VzRm9yUGFnZShwZGZqc0xpYiwgcGFnZSk7XG4gICAgICAgIGlmIChpbWFnZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpICR7ZmlsZU5hbWV9IC0gcGFnZSAke3BhZ2VOdW19IGNvbnRhaW5zIG5vIGV4dHJhY3RhYmxlIGltYWdlcywgc2tpcHBpbmdgLFxuICAgICAgICAgICk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzZWxlY3RlZEltYWdlcyA9IGltYWdlcy5zbGljZSgwLCBPQ1JfTUFYX0lNQUdFU19QRVJfUEFHRSk7XG4gICAgICAgIGZvciAoY29uc3QgaW1hZ2Ugb2Ygc2VsZWN0ZWRJbWFnZXMpIHtcbiAgICAgICAgICBjb25zdCB7XG4gICAgICAgICAgICBkYXRhOiB7IHRleHQgfSxcbiAgICAgICAgICB9ID0gYXdhaXQgd29ya2VyLnJlY29nbml6ZShpbWFnZS5idWZmZXIpO1xuICAgICAgICAgIHByb2Nlc3NlZEltYWdlcysrO1xuICAgICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhblRleHQodGV4dCB8fCBcIlwiKTtcbiAgICAgICAgICBpZiAoY2xlYW5lZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0ZXh0UGFydHMucHVzaChjbGVhbmVkKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGFnZU51bSA9PT0gMSB8fCBwYWdlTnVtICUgMTAgPT09IDAgfHwgcGFnZU51bSA9PT0gbWF4UGFnZXMpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgJHtmaWxlTmFtZX0gLSBwcm9jZXNzZWQgcGFnZSAke3BhZ2VOdW19LyR7bWF4UGFnZXN9IChpbWFnZXM9JHtwcm9jZXNzZWRJbWFnZXN9LCBjaGFycz0ke3RleHRQYXJ0cy5qb2luKFxuICAgICAgICAgICAgICBcIlxcblxcblwiLFxuICAgICAgICAgICAgKS5sZW5ndGh9KWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAocGFnZUVycm9yKSB7XG4gICAgICAgIGlmIChwYWdlRXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBBYm9ydGluZyBPQ1IgZm9yICR7ZmlsZU5hbWV9OiAke3BhZ2VFcnJvci5tZXNzYWdlfWAsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgICAgd29ya2VyID0gbnVsbDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICByZWFzb246IFwicGRmLm9jci1lcnJvclwiLFxuICAgICAgICAgICAgZGV0YWlsczogcGFnZUVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJFcnJvcnMrKztcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEVycm9yIHByb2Nlc3NpbmcgcGFnZSAke3BhZ2VOdW19IG9mICR7ZmlsZU5hbWV9OmAsXG4gICAgICAgICAgcGFnZUVycm9yLFxuICAgICAgICApO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgYXdhaXQgcGFnZT8uY2xlYW51cCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB3b3JrZXIgPSBudWxsO1xuXG4gICAgY29uc3QgZnVsbFRleHQgPSBjbGVhblRleHQodGV4dFBhcnRzLmpvaW4oXCJcXG5cXG5cIikpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBDb21wbGV0ZWQgT0NSIGZvciAke2ZpbGVOYW1lfSwgZXh0cmFjdGVkICR7ZnVsbFRleHQubGVuZ3RofSBjaGFyYWN0ZXJzYCxcbiAgICApO1xuXG4gICAgaWYgKGZ1bGxUZXh0Lmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRleHQ6IGZ1bGxUZXh0LFxuICAgICAgICBzdGFnZTogXCJvY3JcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlckVycm9ycyA+IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLm9jci1yZW5kZXItZXJyb3JcIixcbiAgICAgICAgZGV0YWlsczogYCR7cmVuZGVyRXJyb3JzfSBwYWdlIHJlbmRlciBlcnJvcnNgLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1lbXB0eVwiLFxuICAgICAgZGV0YWlsczogXCJPQ1IgcHJvZHVjZWQgaW5zdWZmaWNpZW50IHRleHRcIixcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAoT0NSKSBFcnJvciBkdXJpbmcgT0NSIGZvciAke2ZpbGVOYW1lfTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9IGZpbmFsbHkge1xuICAgIGlmICh3b3JrZXIpIHtcbiAgICAgIGF3YWl0IHdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdEltYWdlc0ZvclBhZ2UocGRmanNMaWI6IFBkZkpzTW9kdWxlLCBwYWdlOiBhbnkpOiBQcm9taXNlPEV4dHJhY3RlZE9jckltYWdlW10+IHtcbiAgY29uc3Qgb3BlcmF0b3JMaXN0ID0gYXdhaXQgcGFnZS5nZXRPcGVyYXRvckxpc3QoKTtcbiAgY29uc3QgaW1hZ2VzOiBFeHRyYWN0ZWRPY3JJbWFnZVtdID0gW107XG4gIGNvbnN0IGltYWdlRGF0YUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIFByb21pc2U8YW55IHwgbnVsbD4+KCk7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvcGVyYXRvckxpc3QuZm5BcnJheS5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGZuID0gb3BlcmF0b3JMaXN0LmZuQXJyYXlbaV07XG4gICAgY29uc3QgYXJncyA9IG9wZXJhdG9yTGlzdC5hcmdzQXJyYXlbaV07XG5cbiAgICB0cnkge1xuICAgICAgaWYgKGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbWFnZVhPYmplY3QgfHwgZm4gPT09IHBkZmpzTGliLk9QUy5wYWludEltYWdlWE9iamVjdFJlcGVhdCkge1xuICAgICAgICBjb25zdCBvYmpJZCA9IGFyZ3M/LlswXTtcbiAgICAgICAgaWYgKHR5cGVvZiBvYmpJZCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpbWdEYXRhO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGltZ0RhdGEgPSBhd2FpdCByZXNvbHZlSW1hZ2VEYXRhKHBhZ2UsIG9iaklkLCBpbWFnZURhdGFDYWNoZSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc29sZS53YXJuKFwiW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byByZXNvbHZlIGltYWdlIGRhdGE6XCIsIGVycm9yKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWltZ0RhdGEpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcocGRmanNMaWIsIGltZ0RhdGEpO1xuICAgICAgICBpZiAoY29udmVydGVkKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goY29udmVydGVkKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW5saW5lSW1hZ2VYT2JqZWN0ICYmIGFyZ3M/LlswXSkge1xuICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcocGRmanNMaWIsIGFyZ3NbMF0pO1xuICAgICAgICBpZiAoY29udmVydGVkKSB7XG4gICAgICAgICAgaW1hZ2VzLnB1c2goY29udmVydGVkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBJbWFnZURhdGFUaW1lb3V0RXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICB9XG4gICAgICBjb25zb2xlLndhcm4oXCJbUERGIFBhcnNlcl0gKE9DUikgRmFpbGVkIHRvIGV4dHJhY3QgaW5saW5lIGltYWdlOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGltYWdlc1xuICAgIC5maWx0ZXIoKGltYWdlKSA9PiBpbWFnZS5hcmVhID49IE9DUl9NSU5fSU1BR0VfQVJFQSlcbiAgICAuc29ydCgoYSwgYikgPT4gYi5hcmVhIC0gYS5hcmVhKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUltYWdlRGF0YShcbiAgcGFnZTogYW55LFxuICBvYmpJZDogc3RyaW5nLFxuICBjYWNoZTogTWFwPHN0cmluZywgUHJvbWlzZTxhbnkgfCBudWxsPj4sXG4pOiBQcm9taXNlPGFueSB8IG51bGw+IHtcbiAgaWYgKGNhY2hlLmhhcyhvYmpJZCkpIHtcbiAgICByZXR1cm4gY2FjaGUuZ2V0KG9iaklkKSE7XG4gIH1cblxuICBjb25zdCBwcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgaWYgKHR5cGVvZiBwYWdlLm9ianMuaGFzID09PSBcImZ1bmN0aW9uXCIgJiYgcGFnZS5vYmpzLmhhcyhvYmpJZCkpIHtcbiAgICAgICAgcmV0dXJuIHBhZ2Uub2Jqcy5nZXQob2JqSWQpO1xuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gZmFsbCB0aHJvdWdoIHRvIGFzeW5jIHBhdGhcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICAgIGxldCB0aW1lb3V0SGFuZGxlOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuXG4gICAgICBjb25zdCBjbGVhbnVwID0gKCkgPT4ge1xuICAgICAgICBpZiAodGltZW91dEhhbmRsZSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlKTtcbiAgICAgICAgICB0aW1lb3V0SGFuZGxlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgY29uc3QgaGFuZGxlRGF0YSA9IChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHBhZ2Uub2Jqcy5nZXQob2JqSWQsIGhhbmRsZURhdGEpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgIGNsZWFudXAoKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKE9DUl9JTUFHRV9USU1FT1VUX01TKSAmJiBPQ1JfSU1BR0VfVElNRU9VVF9NUyA+IDApIHtcbiAgICAgICAgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGlmICghc2V0dGxlZCkge1xuICAgICAgICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICAgICAgICByZWplY3QobmV3IEltYWdlRGF0YVRpbWVvdXRFcnJvcihvYmpJZCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgT0NSX0lNQUdFX1RJTUVPVVRfTVMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KSgpO1xuXG4gIGNhY2hlLnNldChvYmpJZCwgcHJvbWlzZSk7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1hZ2VEYXRhVG9QbmcoXG4gIHBkZmpzTGliOiBQZGZKc01vZHVsZSxcbiAgaW1nRGF0YTogYW55LFxuKTogRXh0cmFjdGVkT2NySW1hZ2UgfCBudWxsIHtcbiAgaWYgKCFpbWdEYXRhIHx8IHR5cGVvZiBpbWdEYXRhLndpZHRoICE9PSBcIm51bWJlclwiIHx8IHR5cGVvZiBpbWdEYXRhLmhlaWdodCAhPT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCBraW5kLCBkYXRhIH0gPSBpbWdEYXRhO1xuICBpZiAoIWRhdGEpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHBuZyA9IG5ldyBQTkcoeyB3aWR0aCwgaGVpZ2h0IH0pO1xuICBjb25zdCBkZXN0ID0gcG5nLmRhdGE7XG5cbiAgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5SR0JBXzMyQlBQICYmIGRhdGEubGVuZ3RoID09PSB3aWR0aCAqIGhlaWdodCAqIDQpIHtcbiAgICBkZXN0LnNldChCdWZmZXIuZnJvbShkYXRhKSk7XG4gIH0gZWxzZSBpZiAoa2luZCA9PT0gcGRmanNMaWIuSW1hZ2VLaW5kLlJHQl8yNEJQUCAmJiBkYXRhLmxlbmd0aCA9PT0gd2lkdGggKiBoZWlnaHQgKiAzKSB7XG4gICAgY29uc3Qgc3JjID0gZGF0YSBhcyBVaW50OEFycmF5O1xuICAgIGZvciAobGV0IGkgPSAwLCBqID0gMDsgaSA8IHNyYy5sZW5ndGg7IGkgKz0gMywgaiArPSA0KSB7XG4gICAgICBkZXN0W2pdID0gc3JjW2ldO1xuICAgICAgZGVzdFtqICsgMV0gPSBzcmNbaSArIDFdO1xuICAgICAgZGVzdFtqICsgMl0gPSBzcmNbaSArIDJdO1xuICAgICAgZGVzdFtqICsgM10gPSAyNTU7XG4gICAgfVxuICB9IGVsc2UgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5HUkFZU0NBTEVfMUJQUCkge1xuICAgIGxldCBwaXhlbEluZGV4ID0gMDtcbiAgICBjb25zdCB0b3RhbFBpeGVscyA9IHdpZHRoICogaGVpZ2h0O1xuICAgIGZvciAobGV0IGJ5dGVJbmRleCA9IDA7IGJ5dGVJbmRleCA8IGRhdGEubGVuZ3RoICYmIHBpeGVsSW5kZXggPCB0b3RhbFBpeGVsczsgYnl0ZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGJ5dGUgPSBkYXRhW2J5dGVJbmRleF07XG4gICAgICBmb3IgKGxldCBiaXQgPSA3OyBiaXQgPj0gMCAmJiBwaXhlbEluZGV4IDwgdG90YWxQaXhlbHM7IGJpdC0tKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gKGJ5dGUgPj4gYml0KSAmIDEgPyAyNTUgOiAwO1xuICAgICAgICBjb25zdCBkZXN0SW5kZXggPSBwaXhlbEluZGV4ICogNDtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXhdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgMV0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAyXSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDNdID0gMjU1O1xuICAgICAgICBwaXhlbEluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBidWZmZXI6IFBORy5zeW5jLndyaXRlKHBuZyksXG4gICAgd2lkdGgsXG4gICAgaGVpZ2h0LFxuICAgIGFyZWE6IHdpZHRoICogaGVpZ2h0LFxuICB9O1xufVxuXG4vKipcbiAqIFBhcnNlIFBERiBmaWxlcyB3aXRoIGEgbXVsdGktc3RhZ2Ugc3RyYXRlZ3k6XG4gKiAxLiBVc2UgTE0gU3R1ZGlvJ3MgYnVpbHQtaW4gZG9jdW1lbnQgcGFyc2VyIChmYXN0LCBzZXJ2ZXItc2lkZSwgbWF5IGluY2x1ZGUgT0NSKVxuICogMi4gRmFsbGJhY2sgdG8gbG9jYWwgcGRmLXBhcnNlIGZvciB0ZXh0LWJhc2VkIFBERnNcbiAqIDMuIElmIHN0aWxsIG5vIHRleHQgYW5kIE9DUiBpcyBlbmFibGVkLCBmYWxsYmFjayB0byBQREYuanMgKyBUZXNzZXJhY3QgT0NSXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZVBERihcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudCxcbiAgZW5hYmxlT0NSOiBib29sZWFuLFxuKTogUHJvbWlzZTxQZGZQYXJzZXJSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgLy8gMSkgTE0gU3R1ZGlvIHBhcnNlclxuICBjb25zdCBsbVN0dWRpb1Jlc3VsdCA9IGF3YWl0IHRyeUxtU3R1ZGlvUGFyc2VyKGZpbGVQYXRoLCBjbGllbnQpO1xuICBpZiAobG1TdHVkaW9SZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBsbVN0dWRpb1Jlc3VsdDtcbiAgfVxuICBsZXQgbGFzdEZhaWx1cmU6IFBkZlBhcnNlckZhaWx1cmUgPSBsbVN0dWRpb1Jlc3VsdDtcblxuICAvLyAyKSBMb2NhbCBwZGYtcGFyc2UgZmFsbGJhY2tcbiAgY29uc3QgcGRmUGFyc2VSZXN1bHQgPSBhd2FpdCB0cnlQZGZQYXJzZShmaWxlUGF0aCk7XG4gIGlmIChwZGZQYXJzZVJlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIHBkZlBhcnNlUmVzdWx0O1xuICB9XG4gIGxhc3RGYWlsdXJlID0gcGRmUGFyc2VSZXN1bHQ7XG5cbiAgLy8gMykgT0NSIGZhbGxiYWNrIChvbmx5IGlmIGVuYWJsZWQpXG4gIGlmICghZW5hYmxlT0NSKSB7XG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIEVuYWJsZSBPQ1IgaXMgb2ZmLCBza2lwcGluZyBPQ1IgZmFsbGJhY2sgZm9yICR7ZmlsZU5hbWV9IGFmdGVyIG90aGVyIG1ldGhvZHMgcmV0dXJuZWQgbm8gdGV4dGAsXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLm9jci1kaXNhYmxlZFwiLFxuICAgICAgZGV0YWlsczogYFByZXZpb3VzIGZhaWx1cmUgcmVhc29uOiAke2xhc3RGYWlsdXJlLnJlYXNvbn1gLFxuICAgIH07XG4gIH1cblxuICBjb25zb2xlLmxvZyhcbiAgICBgW1BERiBQYXJzZXJdIChPQ1IpIE5vIHRleHQgZXh0cmFjdGVkIGZyb20gJHtmaWxlTmFtZX0gd2l0aCBMTSBTdHVkaW8gb3IgcGRmLXBhcnNlLCBhdHRlbXB0aW5nIE9DUi4uLmAsXG4gICk7XG5cbiAgY29uc3Qgb2NyUmVzdWx0ID0gYXdhaXQgdHJ5T2NyV2l0aFBkZkpzKGZpbGVQYXRoKTtcbiAgaWYgKG9jclJlc3VsdC5zdWNjZXNzKSB7XG4gICAgcmV0dXJuIG9jclJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBvY3JSZXN1bHQ7XG59XG5cbiIsICIvLyBAdHMtaWdub3JlIC0gZXB1YjIgZG9lc24ndCBoYXZlIGNvbXBsZXRlIHR5cGVzXG5pbXBvcnQgeyBFUHViIH0gZnJvbSBcImVwdWIyXCI7XG5cbi8qKlxuICogUGFyc2UgRVBVQiBmaWxlcyBhbmQgZXh0cmFjdCB0ZXh0IGNvbnRlbnRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlRVBVQihmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZXB1YiA9IG5ldyBFUHViKGZpbGVQYXRoKTtcbiAgICAgIFxuICAgICAgZXB1Yi5vbihcImVycm9yXCIsIChlcnJvcjogRXJyb3IpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBFUFVCIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXNvbHZlKFwiXCIpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGNvbnN0IHN0cmlwSHRtbCA9IChpbnB1dDogc3RyaW5nKSA9PlxuICAgICAgICBpbnB1dC5yZXBsYWNlKC88W14+XSo+L2csIFwiIFwiKTtcblxuICAgICAgY29uc3QgZ2V0TWFuaWZlc3RFbnRyeSA9IChjaGFwdGVySWQ6IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gKGVwdWIgYXMgdW5rbm93biBhcyB7IG1hbmlmZXN0PzogUmVjb3JkPHN0cmluZywgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4gfSkubWFuaWZlc3Q/LltjaGFwdGVySWRdO1xuICAgICAgfTtcblxuICAgICAgY29uc3QgZGVjb2RlTWVkaWFUeXBlID0gKGVudHJ5PzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSkgPT5cbiAgICAgICAgZW50cnk/LltcIm1lZGlhLXR5cGVcIl0gfHwgZW50cnk/Lm1lZGlhVHlwZSB8fCBcIlwiO1xuXG4gICAgICBjb25zdCBzaG91bGRSZWFkUmF3ID0gKG1lZGlhVHlwZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBtZWRpYVR5cGUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZCA9PT0gXCJhcHBsaWNhdGlvbi94aHRtbCt4bWxcIiB8fCBub3JtYWxpemVkID09PSBcImltYWdlL3N2Zyt4bWxcIikge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLnN0YXJ0c1dpdGgoXCJ0ZXh0L1wiKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCJodG1sXCIpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlYWRDaGFwdGVyID0gYXN5bmMgKGNoYXB0ZXJJZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgICAgICAgY29uc3QgbWFuaWZlc3RFbnRyeSA9IGdldE1hbmlmZXN0RW50cnkoY2hhcHRlcklkKTtcbiAgICAgICAgaWYgKCFtYW5pZmVzdEVudHJ5KSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBFUFVCIGNoYXB0ZXIgJHtjaGFwdGVySWR9IG1pc3NpbmcgbWFuaWZlc3QgZW50cnkgaW4gJHtmaWxlUGF0aH0sIHNraXBwaW5nYCk7XG4gICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZWRpYVR5cGUgPSBkZWNvZGVNZWRpYVR5cGUobWFuaWZlc3RFbnRyeSk7XG4gICAgICAgIGlmIChzaG91bGRSZWFkUmF3KG1lZGlhVHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgICBlcHViLmdldEZpbGUoXG4gICAgICAgICAgICAgIGNoYXB0ZXJJZCxcbiAgICAgICAgICAgICAgKGVycm9yOiBFcnJvciB8IG51bGwsIGRhdGE/OiBCdWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIHJlaihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghZGF0YSkge1xuICAgICAgICAgICAgICAgICAgcmVzKFwiXCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXMoc3RyaXBIdG1sKGRhdGEudG9TdHJpbmcoXCJ1dGYtOFwiKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgICAgICBlcHViLmdldENoYXB0ZXIoXG4gICAgICAgICAgICBjaGFwdGVySWQsXG4gICAgICAgICAgICAoZXJyb3I6IEVycm9yIHwgbnVsbCwgdGV4dD86IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWooZXJyb3IpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0ZXh0ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmVzKHN0cmlwSHRtbCh0ZXh0KSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzKFwiXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBlcHViLm9uKFwiZW5kXCIsIGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBjaGFwdGVycyA9IGVwdWIuZmxvdztcbiAgICAgICAgICBjb25zdCB0ZXh0UGFydHM6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgXG4gICAgICAgICAgZm9yIChjb25zdCBjaGFwdGVyIG9mIGNoYXB0ZXJzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBjb25zdCBjaGFwdGVySWQgPSBjaGFwdGVyLmlkO1xuICAgICAgICAgICAgICBpZiAoIWNoYXB0ZXJJZCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgRVBVQiBjaGFwdGVyIG1pc3NpbmcgaWQgaW4gJHtmaWxlUGF0aH0sIHNraXBwaW5nYCk7XG4gICAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goXCJcIik7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcmVhZENoYXB0ZXIoY2hhcHRlcklkKTtcbiAgICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9IGNhdGNoIChjaGFwdGVyRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgcmVhZGluZyBjaGFwdGVyICR7Y2hhcHRlci5pZH06YCwgY2hhcHRlckVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgZnVsbFRleHQgPSB0ZXh0UGFydHMuam9pbihcIlxcblxcblwiKTtcbiAgICAgICAgICByZXNvbHZlKFxuICAgICAgICAgICAgZnVsbFRleHRcbiAgICAgICAgICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAgICAgICAgIC50cmltKClcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHByb2Nlc3NpbmcgRVBVQiBjaGFwdGVyczpgLCBlcnJvcik7XG4gICAgICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIGVwdWIucGFyc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5pdGlhbGl6aW5nIEVQVUIgcGFyc2VyIGZvciAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICByZXNvbHZlKFwiXCIpO1xuICAgIH1cbiAgfSk7XG59XG5cbiIsICJpbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5cbi8qKlxuICogUGFyc2UgaW1hZ2UgZmlsZXMgdXNpbmcgT0NSIChUZXNzZXJhY3QpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUltYWdlKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IHdvcmtlciA9IGF3YWl0IGNyZWF0ZVdvcmtlcihcImVuZ1wiKTtcbiAgICBcbiAgICBjb25zdCB7IGRhdGE6IHsgdGV4dCB9IH0gPSBhd2FpdCB3b3JrZXIucmVjb2duaXplKGZpbGVQYXRoKTtcbiAgICBcbiAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgXG4gICAgcmV0dXJuIHRleHRcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgLnJlcGxhY2UoL1xcbisvZywgXCJcXG5cIilcbiAgICAgIC50cmltKCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyc2VUZXh0T3B0aW9ucyB7XG4gIHN0cmlwTWFya2Rvd24/OiBib29sZWFuO1xuICBwcmVzZXJ2ZUxpbmVCcmVha3M/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIFBhcnNlIHBsYWluIHRleHQgZmlsZXMgKHR4dCwgbWQgYW5kIHJlbGF0ZWQgZm9ybWF0cylcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlVGV4dChcbiAgZmlsZVBhdGg6IHN0cmluZyxcbiAgb3B0aW9uczogUGFyc2VUZXh0T3B0aW9ucyA9IHt9LFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgeyBzdHJpcE1hcmtkb3duID0gZmFsc2UsIHByZXNlcnZlTGluZUJyZWFrcyA9IGZhbHNlIH0gPSBvcHRpb25zO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGZzLnByb21pc2VzLnJlYWRGaWxlKGZpbGVQYXRoLCBcInV0Zi04XCIpO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVMaW5lRW5kaW5ncyhjb250ZW50KTtcblxuICAgIGNvbnN0IHN0cmlwcGVkID0gc3RyaXBNYXJrZG93biA/IHN0cmlwTWFya2Rvd25TeW50YXgobm9ybWFsaXplZCkgOiBub3JtYWxpemVkO1xuXG4gICAgcmV0dXJuIChwcmVzZXJ2ZUxpbmVCcmVha3MgPyBjb2xsYXBzZVdoaXRlc3BhY2VCdXRLZWVwTGluZXMoc3RyaXBwZWQpIDogY29sbGFwc2VXaGl0ZXNwYWNlKHN0cmlwcGVkKSkudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgdGV4dCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVMaW5lRW5kaW5ncyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xcclxcbj8vZywgXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGNvbGxhcHNlV2hpdGVzcGFjZShpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2VCdXRLZWVwTGluZXMoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiAoXG4gICAgaW5wdXRcbiAgICAgIC8vIFRyaW0gdHJhaWxpbmcgd2hpdGVzcGFjZSBwZXIgbGluZVxuICAgICAgLnJlcGxhY2UoL1sgXFx0XStcXG4vZywgXCJcXG5cIilcbiAgICAgIC8vIENvbGxhcHNlIG11bHRpcGxlIGJsYW5rIGxpbmVzIGJ1dCBrZWVwIHBhcmFncmFwaCBzZXBhcmF0aW9uXG4gICAgICAucmVwbGFjZSgvXFxuezMsfS9nLCBcIlxcblxcblwiKVxuICAgICAgLy8gQ29sbGFwc2UgaW50ZXJuYWwgc3BhY2VzL3RhYnNcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF17Mix9L2csIFwiIFwiKVxuICApO1xufVxuXG5mdW5jdGlvbiBzdHJpcE1hcmtkb3duU3ludGF4KGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgb3V0cHV0ID0gaW5wdXQ7XG5cbiAgLy8gUmVtb3ZlIGZlbmNlZCBjb2RlIGJsb2Nrc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvYGBgW1xcc1xcU10qP2BgYC9nLCBcIiBcIik7XG4gIC8vIFJlbW92ZSBpbmxpbmUgY29kZVxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvYChbXmBdKylgL2csIFwiJDFcIik7XG4gIC8vIFJlcGxhY2UgaW1hZ2VzIHdpdGggYWx0IHRleHRcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyFcXFsoW15cXF1dKilcXF1cXChbXildKlxcKS9nLCBcIiQxIFwiKTtcbiAgLy8gUmVwbGFjZSBsaW5rcyB3aXRoIGxpbmsgdGV4dFxuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXFxbKFteXFxdXSspXFxdXFwoW14pXSpcXCkvZywgXCIkMVwiKTtcbiAgLy8gUmVtb3ZlIGVtcGhhc2lzIG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyhcXCpcXCp8X18pKC4qPylcXDEvZywgXCIkMlwiKTtcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyhcXCp8XykoLio/KVxcMS9nLCBcIiQyXCIpO1xuICAvLyBSZW1vdmUgaGVhZGluZ3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfSN7MSw2fVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgYmxvY2sgcXVvdGVzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30+XFxzPy9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSB1bm9yZGVyZWQgbGlzdCBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM31bLSorXVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgb3JkZXJlZCBsaXN0IG1hcmtlcnNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfVxcZCtbXFwuXFwpXVxccysvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgaG9yaXpvbnRhbCBydWxlc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9KFstKl9dXFxzPyl7Myx9JC9nbSwgXCJcIik7XG4gIC8vIFJlbW92ZSByZXNpZHVhbCBIVE1MIHRhZ3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLzxbXj5dKz4vZywgXCIgXCIpO1xuXG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbiIsICJpbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwYXJzZUhUTUwgfSBmcm9tIFwiLi9odG1sUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZVBERiwgdHlwZSBQZGZGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4vcGRmUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZUVQVUIgfSBmcm9tIFwiLi9lcHViUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZUltYWdlIH0gZnJvbSBcIi4vaW1hZ2VQYXJzZXJcIjtcbmltcG9ydCB7IHBhcnNlVGV4dCB9IGZyb20gXCIuL3RleHRQYXJzZXJcIjtcbmltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHtcbiAgSU1BR0VfRVhURU5TSU9OX1NFVCxcbiAgaXNIdG1sRXh0ZW5zaW9uLFxuICBpc01hcmtkb3duRXh0ZW5zaW9uLFxuICBpc1BsYWluVGV4dEV4dGVuc2lvbixcbiAgaXNUZXh0dWFsRXh0ZW5zaW9uLFxufSBmcm9tIFwiLi4vdXRpbHMvc3VwcG9ydGVkRXh0ZW5zaW9uc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlZERvY3VtZW50IHtcbiAgdGV4dDogc3RyaW5nO1xuICBtZXRhZGF0YToge1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgZmlsZU5hbWU6IHN0cmluZztcbiAgICBleHRlbnNpb246IHN0cmluZztcbiAgICBwYXJzZWRBdDogRGF0ZTtcbiAgfTtcbn1cblxuZXhwb3J0IHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uID1cbiAgfCBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiXG4gIHwgXCJwZGYubWlzc2luZy1jbGllbnRcIlxuICB8IFBkZkZhaWx1cmVSZWFzb25cbiAgfCBcImVwdWIuZW1wdHlcIlxuICB8IFwiaHRtbC5lbXB0eVwiXG4gIHwgXCJodG1sLmVycm9yXCJcbiAgfCBcInRleHQuZW1wdHlcIlxuICB8IFwidGV4dC5lcnJvclwiXG4gIHwgXCJpbWFnZS5vY3ItZGlzYWJsZWRcIlxuICB8IFwiaW1hZ2UuZW1wdHlcIlxuICB8IFwiaW1hZ2UuZXJyb3JcIlxuICB8IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIjtcblxuZXhwb3J0IHR5cGUgRG9jdW1lbnRQYXJzZVJlc3VsdCA9XG4gIHwgeyBzdWNjZXNzOiB0cnVlOyBkb2N1bWVudDogUGFyc2VkRG9jdW1lbnQgfVxuICB8IHsgc3VjY2VzczogZmFsc2U7IHJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uOyBkZXRhaWxzPzogc3RyaW5nIH07XG5cbi8qKlxuICogUGFyc2UgYSBkb2N1bWVudCBmaWxlIGJhc2VkIG9uIGl0cyBleHRlbnNpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBhcnNlRG9jdW1lbnQoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGVuYWJsZU9DUjogYm9vbGVhbiA9IGZhbHNlLFxuICBjbGllbnQ/OiBMTVN0dWRpb0NsaWVudCxcbik6IFByb21pc2U8RG9jdW1lbnRQYXJzZVJlc3VsdD4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlUGF0aCk7XG5cbiAgY29uc3QgYnVpbGRTdWNjZXNzID0gKHRleHQ6IHN0cmluZyk6IERvY3VtZW50UGFyc2VSZXN1bHQgPT4gKHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGRvY3VtZW50OiB7XG4gICAgICB0ZXh0LFxuICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIGZpbGVOYW1lLFxuICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgcGFyc2VkQXQ6IG5ldyBEYXRlKCksXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgaWYgKGlzSHRtbEV4dGVuc2lvbihleHQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gY2xlYW5BbmRWYWxpZGF0ZShcbiAgICAgICAgICBhd2FpdCBwYXJzZUhUTUwoZmlsZVBhdGgpLFxuICAgICAgICAgIFwiaHRtbC5lbXB0eVwiLFxuICAgICAgICAgIGAke2ZpbGVOYW1lfSBodG1sYCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIHRleHQuc3VjY2VzcyA/IGJ1aWxkU3VjY2Vzcyh0ZXh0LnZhbHVlKSA6IHRleHQ7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbUGFyc2VyXVtIVE1MXSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwiaHRtbC5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5wZGZcIikge1xuICAgICAgaWYgKCFjbGllbnQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKGBbUGFyc2VyXSBObyBMTSBTdHVkaW8gY2xpZW50IGF2YWlsYWJsZSBmb3IgUERGIHBhcnNpbmc6ICR7ZmlsZU5hbWV9YCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwicGRmLm1pc3NpbmctY2xpZW50XCIgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBkZlJlc3VsdCA9IGF3YWl0IHBhcnNlUERGKGZpbGVQYXRoLCBjbGllbnQsIGVuYWJsZU9DUik7XG4gICAgICBpZiAocGRmUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkU3VjY2VzcyhwZGZSZXN1bHQudGV4dCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcGRmUmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChleHQgPT09IFwiLmVwdWJcIikge1xuICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlRVBVQihmaWxlUGF0aCk7XG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcImVwdWIuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgcmV0dXJuIGNsZWFuZWQuc3VjY2VzcyA/IGJ1aWxkU3VjY2VzcyhjbGVhbmVkLnZhbHVlKSA6IGNsZWFuZWQ7XG4gICAgfVxuXG4gICAgaWYgKGlzVGV4dHVhbEV4dGVuc2lvbihleHQpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VUZXh0KGZpbGVQYXRoLCB7XG4gICAgICAgICAgc3RyaXBNYXJrZG93bjogaXNNYXJrZG93bkV4dGVuc2lvbihleHQpLFxuICAgICAgICAgIHByZXNlcnZlTGluZUJyZWFrczogaXNQbGFpblRleHRFeHRlbnNpb24oZXh0KSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwidGV4dC5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bVGV4dF0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcInRleHQuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKElNQUdFX0VYVEVOU0lPTl9TRVQuaGFzKGV4dCkpIHtcbiAgICAgIGlmICghZW5hYmxlT0NSKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBTa2lwcGluZyBpbWFnZSBmaWxlICR7ZmlsZVBhdGh9IChPQ1IgZGlzYWJsZWQpYCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwiaW1hZ2Uub2NyLWRpc2FibGVkXCIgfTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZUltYWdlKGZpbGVQYXRoKTtcbiAgICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJpbWFnZS5lbXB0eVwiLCBmaWxlTmFtZSk7XG4gICAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bSW1hZ2VdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJpbWFnZS5lcnJvclwiLFxuICAgICAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5yYXJcIikge1xuICAgICAgY29uc29sZS5sb2coYFJBUiBmaWxlcyBub3QgeWV0IHN1cHBvcnRlZDogJHtmaWxlUGF0aH1gKTtcbiAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZWFzb246IFwidW5zdXBwb3J0ZWQtZXh0ZW5zaW9uXCIsIGRldGFpbHM6IFwiLnJhclwiIH07XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFVuc3VwcG9ydGVkIGZpbGUgdHlwZTogJHtmaWxlUGF0aH1gKTtcbiAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiLCBkZXRhaWxzOiBleHQgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIGRvY3VtZW50ICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgIGRldGFpbHM6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICB9O1xuICB9XG59XG5cbnR5cGUgQ2xlYW5SZXN1bHQgPVxuICB8IHsgc3VjY2VzczogdHJ1ZTsgdmFsdWU6IHN0cmluZyB9XG4gIHwgeyBzdWNjZXNzOiBmYWxzZTsgcmVhc29uOiBQYXJzZUZhaWx1cmVSZWFzb247IGRldGFpbHM/OiBzdHJpbmcgfTtcblxuZnVuY3Rpb24gY2xlYW5BbmRWYWxpZGF0ZShcbiAgdGV4dDogc3RyaW5nLFxuICBlbXB0eVJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uLFxuICBkZXRhaWxzQ29udGV4dD86IHN0cmluZyxcbik6IENsZWFuUmVzdWx0IHtcbiAgY29uc3QgY2xlYW5lZCA9IHRleHQ/LnRyaW0oKSA/PyBcIlwiO1xuICBpZiAoY2xlYW5lZC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IGVtcHR5UmVhc29uLFxuICAgICAgZGV0YWlsczogZGV0YWlsc0NvbnRleHQgPyBgJHtkZXRhaWxzQ29udGV4dH0gdHJpbW1lZCB0byB6ZXJvIGxlbmd0aGAgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCB2YWx1ZTogY2xlYW5lZCB9O1xufVxuXG4iLCAiLyoqXG4gKiBTaW1wbGUgdGV4dCBjaHVua2VyIHRoYXQgc3BsaXRzIHRleHQgaW50byBvdmVybGFwcGluZyBjaHVua3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNodW5rVGV4dChcbiAgdGV4dDogc3RyaW5nLFxuICBjaHVua1NpemU6IG51bWJlcixcbiAgb3ZlcmxhcDogbnVtYmVyLFxuKTogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IHN0YXJ0SW5kZXg6IG51bWJlcjsgZW5kSW5kZXg6IG51bWJlciB9PiB7XG4gIGNvbnN0IGNodW5rczogQXJyYXk8eyB0ZXh0OiBzdHJpbmc7IHN0YXJ0SW5kZXg6IG51bWJlcjsgZW5kSW5kZXg6IG51bWJlciB9PiA9IFtdO1xuICBcbiAgLy8gU2ltcGxlIHdvcmQtYmFzZWQgY2h1bmtpbmdcbiAgY29uc3Qgd29yZHMgPSB0ZXh0LnNwbGl0KC9cXHMrLyk7XG4gIFxuICBpZiAod29yZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGNodW5rcztcbiAgfVxuICBcbiAgbGV0IHN0YXJ0SWR4ID0gMDtcbiAgXG4gIHdoaWxlIChzdGFydElkeCA8IHdvcmRzLmxlbmd0aCkge1xuICAgIGNvbnN0IGVuZElkeCA9IE1hdGgubWluKHN0YXJ0SWR4ICsgY2h1bmtTaXplLCB3b3Jkcy5sZW5ndGgpO1xuICAgIGNvbnN0IGNodW5rV29yZHMgPSB3b3Jkcy5zbGljZShzdGFydElkeCwgZW5kSWR4KTtcbiAgICBjb25zdCBjaHVua1RleHQgPSBjaHVua1dvcmRzLmpvaW4oXCIgXCIpO1xuICAgIFxuICAgIGNodW5rcy5wdXNoKHtcbiAgICAgIHRleHQ6IGNodW5rVGV4dCxcbiAgICAgIHN0YXJ0SW5kZXg6IHN0YXJ0SWR4LFxuICAgICAgZW5kSW5kZXg6IGVuZElkeCxcbiAgICB9KTtcbiAgICBcbiAgICAvLyBNb3ZlIGZvcndhcmQgYnkgKGNodW5rU2l6ZSAtIG92ZXJsYXApIHRvIGNyZWF0ZSBvdmVybGFwcGluZyBjaHVua3NcbiAgICBzdGFydElkeCArPSBNYXRoLm1heCgxLCBjaHVua1NpemUgLSBvdmVybGFwKTtcbiAgICBcbiAgICAvLyBCcmVhayBpZiB3ZSd2ZSByZWFjaGVkIHRoZSBlbmRcbiAgICBpZiAoZW5kSWR4ID49IHdvcmRzLmxlbmd0aCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4gY2h1bmtzO1xufVxuXG4vKipcbiAqIEVzdGltYXRlIHRva2VuIGNvdW50IChyb3VnaCBhcHByb3hpbWF0aW9uOiAxIHRva2VuIFx1MjI0OCA0IGNoYXJhY3RlcnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlc3RpbWF0ZVRva2VuQ291bnQodGV4dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGguY2VpbCh0ZXh0Lmxlbmd0aCAvIDQpO1xufVxuXG4iLCAiaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIENhbGN1bGF0ZSBTSEEtMjU2IGhhc2ggb2YgYSBmaWxlIGZvciBjaGFuZ2UgZGV0ZWN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgY29uc3Qgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aCk7XG4gICAgXG4gICAgc3RyZWFtLm9uKFwiZGF0YVwiLCAoZGF0YSkgPT4gaGFzaC51cGRhdGUoZGF0YSkpO1xuICAgIHN0cmVhbS5vbihcImVuZFwiLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KFwiaGV4XCIpKSk7XG4gICAgc3RyZWFtLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcbiAgfSk7XG59XG5cbi8qKlxuICogR2V0IGZpbGUgbWV0YWRhdGEgaW5jbHVkaW5nIHNpemUgYW5kIG1vZGlmaWNhdGlvbiB0aW1lXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRGaWxlTWV0YWRhdGEoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8e1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBEYXRlO1xuICBoYXNoOiBzdHJpbmc7XG59PiB7XG4gIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmaWxlUGF0aCk7XG4gIGNvbnN0IGhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlUGF0aCk7XG4gIFxuICByZXR1cm4ge1xuICAgIHNpemU6IHN0YXRzLnNpemUsXG4gICAgbXRpbWU6IHN0YXRzLm10aW1lLFxuICAgIGhhc2gsXG4gIH07XG59XG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnMvcHJvbWlzZXNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcblxuaW50ZXJmYWNlIEZhaWxlZEZpbGVFbnRyeSB7XG4gIGZpbGVIYXNoOiBzdHJpbmc7XG4gIHJlYXNvbjogc3RyaW5nO1xuICB0aW1lc3RhbXA6IHN0cmluZztcbn1cblxuLyoqXG4gKiBUcmFja3MgZmlsZXMgdGhhdCBmYWlsZWQgaW5kZXhpbmcgZm9yIGEgZ2l2ZW4gaGFzaCBzbyB3ZSBjYW4gc2tpcCB0aGVtXG4gKiB3aGVuIGF1dG8tcmVpbmRleGluZyB1bmNoYW5nZWQgZGF0YS5cbiAqL1xuZXhwb3J0IGNsYXNzIEZhaWxlZEZpbGVSZWdpc3RyeSB7XG4gIHByaXZhdGUgbG9hZGVkID0gZmFsc2U7XG4gIHByaXZhdGUgZW50cmllczogUmVjb3JkPHN0cmluZywgRmFpbGVkRmlsZUVudHJ5PiA9IHt9O1xuICBwcml2YXRlIHF1ZXVlOiBQcm9taXNlPHZvaWQ+ID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSByZWdpc3RyeVBhdGg6IHN0cmluZykge31cblxuICBwcml2YXRlIGFzeW5jIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMubG9hZGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUodGhpcy5yZWdpc3RyeVBhdGgsIFwidXRmLThcIik7XG4gICAgICB0aGlzLmVudHJpZXMgPSBKU09OLnBhcnNlKGRhdGEpID8/IHt9O1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5lbnRyaWVzID0ge307XG4gICAgfVxuICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcGVyc2lzdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBmcy5ta2RpcihwYXRoLmRpcm5hbWUodGhpcy5yZWdpc3RyeVBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGUodGhpcy5yZWdpc3RyeVBhdGgsIEpTT04uc3RyaW5naWZ5KHRoaXMuZW50cmllcywgbnVsbCwgMiksIFwidXRmLThcIik7XG4gIH1cblxuICBwcml2YXRlIHJ1bkV4Y2x1c2l2ZTxUPihvcGVyYXRpb246ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLnF1ZXVlLnRoZW4ob3BlcmF0aW9uKTtcbiAgICB0aGlzLnF1ZXVlID0gcmVzdWx0LnRoZW4oXG4gICAgICAoKSA9PiB7fSxcbiAgICAgICgpID0+IHt9LFxuICAgICk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHJlY29yZEZhaWx1cmUoZmlsZVBhdGg6IHN0cmluZywgZmlsZUhhc2g6IHN0cmluZywgcmVhc29uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gdGhpcy5ydW5FeGNsdXNpdmUoYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgdGhpcy5sb2FkKCk7XG4gICAgICB0aGlzLmVudHJpZXNbZmlsZVBhdGhdID0ge1xuICAgICAgICBmaWxlSGFzaCxcbiAgICAgICAgcmVhc29uLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH07XG4gICAgICBhd2FpdCB0aGlzLnBlcnNpc3QoKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNsZWFyRmFpbHVyZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMucnVuRXhjbHVzaXZlKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IHRoaXMubG9hZCgpO1xuICAgICAgaWYgKHRoaXMuZW50cmllc1tmaWxlUGF0aF0pIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZW50cmllc1tmaWxlUGF0aF07XG4gICAgICAgIGF3YWl0IHRoaXMucGVyc2lzdCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RmFpbHVyZVJlYXNvbihmaWxlUGF0aDogc3RyaW5nLCBmaWxlSGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICBjb25zdCBlbnRyeSA9IHRoaXMuZW50cmllc1tmaWxlUGF0aF07XG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5LmZpbGVIYXNoID09PSBmaWxlSGFzaCA/IGVudHJ5LnJlYXNvbiA6IHVuZGVmaW5lZDtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IFBRdWV1ZSBmcm9tIFwicC1xdWV1ZVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBzY2FuRGlyZWN0b3J5LCB0eXBlIFNjYW5uZWRGaWxlIH0gZnJvbSBcIi4vZmlsZVNjYW5uZXJcIjtcbmltcG9ydCB7IHBhcnNlRG9jdW1lbnQsIHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4uL3BhcnNlcnMvZG9jdW1lbnRQYXJzZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlLCB0eXBlIERvY3VtZW50Q2h1bmsgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcbmltcG9ydCB7IGNodW5rVGV4dCB9IGZyb20gXCIuLi91dGlscy90ZXh0Q2h1bmtlclwiO1xuaW1wb3J0IHsgY2FsY3VsYXRlRmlsZUhhc2ggfSBmcm9tIFwiLi4vdXRpbHMvZmlsZUhhc2hcIjtcbmltcG9ydCB7IHR5cGUgRW1iZWRkaW5nRHluYW1pY0hhbmRsZSwgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBGYWlsZWRGaWxlUmVnaXN0cnkgfSBmcm9tIFwiLi4vdXRpbHMvZmFpbGVkRmlsZVJlZ2lzdHJ5XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdQcm9ncmVzcyB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgcHJvY2Vzc2VkRmlsZXM6IG51bWJlcjtcbiAgY3VycmVudEZpbGU6IHN0cmluZztcbiAgc3RhdHVzOiBcInNjYW5uaW5nXCIgfCBcImluZGV4aW5nXCIgfCBcImNvbXBsZXRlXCIgfCBcImVycm9yXCI7XG4gIHN1Y2Nlc3NmdWxGaWxlcz86IG51bWJlcjtcbiAgZmFpbGVkRmlsZXM/OiBudW1iZXI7XG4gIHNraXBwZWRGaWxlcz86IG51bWJlcjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdSZXN1bHQge1xuICB0b3RhbEZpbGVzOiBudW1iZXI7XG4gIHN1Y2Nlc3NmdWxGaWxlczogbnVtYmVyO1xuICBmYWlsZWRGaWxlczogbnVtYmVyO1xuICBza2lwcGVkRmlsZXM6IG51bWJlcjtcbiAgdXBkYXRlZEZpbGVzOiBudW1iZXI7XG4gIG5ld0ZpbGVzOiBudW1iZXI7XG59XG5cbnR5cGUgRmlsZUluZGV4T3V0Y29tZSA9XG4gIHwgeyB0eXBlOiBcInNraXBwZWRcIiB9XG4gIHwgeyB0eXBlOiBcImluZGV4ZWRcIjsgY2hhbmdlVHlwZTogXCJuZXdcIiB8IFwidXBkYXRlZFwiIH1cbiAgfCB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcblxuZXhwb3J0IGludGVyZmFjZSBJbmRleGluZ09wdGlvbnMge1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmU6IFZlY3RvclN0b3JlO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBlbWJlZGRpbmdNb2RlbDogRW1iZWRkaW5nRHluYW1pY0hhbmRsZTtcbiAgY2xpZW50OiBMTVN0dWRpb0NsaWVudDtcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgYXV0b1JlaW5kZXg6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICBmYWlsdXJlUmVwb3J0UGF0aD86IHN0cmluZztcbiAgb25Qcm9ncmVzcz86IChwcm9ncmVzczogSW5kZXhpbmdQcm9ncmVzcykgPT4gdm9pZDtcbn1cblxudHlwZSBGYWlsdXJlUmVhc29uID0gUGFyc2VGYWlsdXJlUmVhc29uIHwgXCJpbmRleC5jaHVuay1lbXB0eVwiIHwgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCI7XG5cbmZ1bmN0aW9uIGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihyYXc6IHVua25vd24pOiBudW1iZXJbXSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHJhdykpIHtcbiAgICByZXR1cm4gcmF3Lm1hcChhc3NlcnRGaW5pdGVOdW1iZXIpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiByYXcgPT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gW2Fzc2VydEZpbml0ZU51bWJlcihyYXcpXTtcbiAgfVxuXG4gIGlmIChyYXcgJiYgdHlwZW9mIHJhdyA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcocmF3KSkge1xuICAgICAgcmV0dXJuIEFycmF5LmZyb20ocmF3IGFzIHVua25vd24gYXMgQXJyYXlMaWtlPG51bWJlcj4pLm1hcChhc3NlcnRGaW5pdGVOdW1iZXIpO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbmRpZGF0ZSA9XG4gICAgICAocmF3IGFzIGFueSkuZW1iZWRkaW5nID8/XG4gICAgICAocmF3IGFzIGFueSkudmVjdG9yID8/XG4gICAgICAocmF3IGFzIGFueSkuZGF0YSA/P1xuICAgICAgKHR5cGVvZiAocmF3IGFzIGFueSkudG9BcnJheSA9PT0gXCJmdW5jdGlvblwiID8gKHJhdyBhcyBhbnkpLnRvQXJyYXkoKSA6IHVuZGVmaW5lZCkgPz9cbiAgICAgICh0eXBlb2YgKHJhdyBhcyBhbnkpLnRvSlNPTiA9PT0gXCJmdW5jdGlvblwiID8gKHJhdyBhcyBhbnkpLnRvSlNPTigpIDogdW5kZWZpbmVkKTtcblxuICAgIGlmIChjYW5kaWRhdGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGNvZXJjZUVtYmVkZGluZ1ZlY3RvcihjYW5kaWRhdGUpO1xuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihcIkVtYmVkZGluZyBwcm92aWRlciByZXR1cm5lZCBhIG5vbi1udW1lcmljIHZlY3RvclwiKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RmluaXRlTnVtYmVyKHZhbHVlOiB1bmtub3duKTogbnVtYmVyIHtcbiAgY29uc3QgbnVtID0gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiID8gdmFsdWUgOiBOdW1iZXIodmFsdWUpO1xuICBpZiAoIU51bWJlci5pc0Zpbml0ZShudW0pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRW1iZWRkaW5nIHZlY3RvciBjb250YWlucyBhIG5vbi1maW5pdGUgdmFsdWVcIik7XG4gIH1cbiAgcmV0dXJuIG51bTtcbn1cblxuZXhwb3J0IGNsYXNzIEluZGV4TWFuYWdlciB7XG4gIHByaXZhdGUgcXVldWU6IFBRdWV1ZTtcbiAgcHJpdmF0ZSBvcHRpb25zOiBJbmRleGluZ09wdGlvbnM7XG4gIHByaXZhdGUgZmFpbHVyZVJlYXNvbkNvdW50czogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICBwcml2YXRlIGZhaWxlZEZpbGVSZWdpc3RyeTogRmFpbGVkRmlsZVJlZ2lzdHJ5O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6IEluZGV4aW5nT3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5xdWV1ZSA9IG5ldyBQUXVldWUoeyBjb25jdXJyZW5jeTogb3B0aW9ucy5tYXhDb25jdXJyZW50IH0pO1xuICAgIHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5ID0gbmV3IEZhaWxlZEZpbGVSZWdpc3RyeShcbiAgICAgIHBhdGguam9pbihvcHRpb25zLnZlY3RvclN0b3JlRGlyLCBcIi5iaWctcmFnLWZhaWx1cmVzLmpzb25cIiksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB0aGUgaW5kZXhpbmcgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgaW5kZXgoKTogUHJvbWlzZTxJbmRleGluZ1Jlc3VsdD4ge1xuICAgIGNvbnN0IHsgZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZSwgb25Qcm9ncmVzcyB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVJbnZlbnRvcnkgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRGaWxlSGFzaEludmVudG9yeSgpO1xuXG4gICAgICAvLyBTdGVwIDE6IFNjYW4gZGlyZWN0b3J5XG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJzY2FubmluZ1wiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCBzY2FuRGlyZWN0b3J5KGRvY3VtZW50c0RpciwgKHNjYW5uZWQsIGZvdW5kKSA9PiB7XG4gICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgICB0b3RhbEZpbGVzOiBmb3VuZCxcbiAgICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgICAgY3VycmVudEZpbGU6IGBTY2FubmVkICR7c2Nhbm5lZH0gZmlsZXMuLi5gLFxuICAgICAgICAgICAgc3RhdHVzOiBcInNjYW5uaW5nXCIsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtmaWxlcy5sZW5ndGh9IGZpbGVzIHRvIHByb2Nlc3NgKTtcblxuICAgICAgLy8gU3RlcCAyOiBJbmRleCBmaWxlc1xuICAgICAgbGV0IHByb2Nlc3NlZENvdW50ID0gMDtcbiAgICAgIGxldCBzdWNjZXNzQ291bnQgPSAwO1xuICAgICAgbGV0IGZhaWxDb3VudCA9IDA7XG4gICAgICBsZXQgc2tpcHBlZENvdW50ID0gMDtcbiAgICAgIGxldCB1cGRhdGVkQ291bnQgPSAwO1xuICAgICAgbGV0IG5ld0NvdW50ID0gMDtcblxuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBmaWxlc1swXT8ubmFtZSA/PyBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gUHJvY2VzcyBmaWxlcyBpbiBiYXRjaGVzXG4gICAgICBjb25zdCB0YXNrcyA9IGZpbGVzLm1hcCgoZmlsZSkgPT5cbiAgICAgICAgdGhpcy5xdWV1ZS5hZGQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGxldCBvdXRjb21lOiBGaWxlSW5kZXhPdXRjb21lID0geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgICAgICAgIHRvdGFsRmlsZXM6IGZpbGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgICAgICAgY3VycmVudEZpbGU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFwiaW5kZXhpbmdcIixcbiAgICAgICAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICAgICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0Y29tZSA9IGF3YWl0IHRoaXMuaW5kZXhGaWxlKGZpbGUsIGZpbGVJbnZlbnRvcnkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBpbmRleGluZyBmaWxlICR7ZmlsZS5wYXRofTpgLCBlcnJvcik7XG4gICAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgICAgIFwicGFyc2VyLnVuZXhwZWN0ZWQtZXJyb3JcIixcbiAgICAgICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwcm9jZXNzZWRDb3VudCsrO1xuICAgICAgICAgIHN3aXRjaCAob3V0Y29tZS50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwic2tpcHBlZFwiOlxuICAgICAgICAgICAgICBzdWNjZXNzQ291bnQrKztcbiAgICAgICAgICAgICAgc2tpcHBlZENvdW50Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImluZGV4ZWRcIjpcbiAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50Kys7XG4gICAgICAgICAgICAgIGlmIChvdXRjb21lLmNoYW5nZVR5cGUgPT09IFwibmV3XCIpIHtcbiAgICAgICAgICAgICAgICBuZXdDb3VudCsrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVwZGF0ZWRDb3VudCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImZhaWxlZFwiOlxuICAgICAgICAgICAgICBmYWlsQ291bnQrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moe1xuICAgICAgICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiBwcm9jZXNzZWRDb3VudCxcbiAgICAgICAgICAgICAgY3VycmVudEZpbGU6IGZpbGUubmFtZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBcImluZGV4aW5nXCIsXG4gICAgICAgICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKTtcblxuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiBwcm9jZXNzZWRDb3VudCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiY29tcGxldGVcIixcbiAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICAgIHNraXBwZWRGaWxlczogc2tpcHBlZENvdW50LFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2dGYWlsdXJlU3VtbWFyeSgpO1xuICAgICAgYXdhaXQgdGhpcy53cml0ZUZhaWx1cmVSZXBvcnQoe1xuICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgdXBkYXRlZEZpbGVzOiB1cGRhdGVkQ291bnQsXG4gICAgICAgIG5ld0ZpbGVzOiBuZXdDb3VudCxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYEluZGV4aW5nIGNvbXBsZXRlOiAke3N1Y2Nlc3NDb3VudH0vJHtmaWxlcy5sZW5ndGh9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2ZhaWxDb3VudH0gZmFpbGVkLCBza2lwcGVkPSR7c2tpcHBlZENvdW50fSwgdXBkYXRlZD0ke3VwZGF0ZWRDb3VudH0sIG5ldz0ke25ld0NvdW50fSlgLFxuICAgICAgKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIHVwZGF0ZWRGaWxlczogdXBkYXRlZENvdW50LFxuICAgICAgICBuZXdGaWxlczogbmV3Q291bnQsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZHVyaW5nIGluZGV4aW5nOlwiLCBlcnJvcik7XG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluZGV4IGEgc2luZ2xlIGZpbGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgaW5kZXhGaWxlKFxuICAgIGZpbGU6IFNjYW5uZWRGaWxlLFxuICAgIGZpbGVJbnZlbnRvcnk6IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PiA9IG5ldyBNYXAoKSxcbiAgKTogUHJvbWlzZTxGaWxlSW5kZXhPdXRjb21lPiB7XG4gICAgY29uc3QgeyB2ZWN0b3JTdG9yZSwgZW1iZWRkaW5nTW9kZWwsIGNsaWVudCwgY2h1bmtTaXplLCBjaHVua092ZXJsYXAsIGVuYWJsZU9DUiwgYXV0b1JlaW5kZXggfSA9XG4gICAgICB0aGlzLm9wdGlvbnM7XG5cbiAgICBsZXQgZmlsZUhhc2g6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgLy8gQ2FsY3VsYXRlIGZpbGUgaGFzaFxuICAgICAgZmlsZUhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgZXhpc3RpbmdIYXNoZXMgPSBmaWxlSW52ZW50b3J5LmdldChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgaGFzU2VlbkJlZm9yZSA9IGV4aXN0aW5nSGFzaGVzICE9PSB1bmRlZmluZWQgJiYgZXhpc3RpbmdIYXNoZXMuc2l6ZSA+IDA7XG4gICAgICBjb25zdCBoYXNTYW1lSGFzaCA9IGV4aXN0aW5nSGFzaGVzPy5oYXMoZmlsZUhhc2gpID8/IGZhbHNlO1xuXG4gICAgICAvLyBDaGVjayBpZiBmaWxlIGFscmVhZHkgaW5kZXhlZFxuICAgICAgaWYgKGF1dG9SZWluZGV4ICYmIGhhc1NhbWVIYXNoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBGaWxlIGFscmVhZHkgaW5kZXhlZCAoc2tpcHBlZCk6ICR7ZmlsZS5uYW1lfWApO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcInNraXBwZWRcIiB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoYXV0b1JlaW5kZXgpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNGYWlsdXJlID0gYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkuZ2V0RmFpbHVyZVJlYXNvbihmaWxlLnBhdGgsIGZpbGVIYXNoKTtcbiAgICAgICAgaWYgKHByZXZpb3VzRmFpbHVyZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYEZpbGUgcHJldmlvdXNseSBmYWlsZWQgKHNraXBwZWQpOiAke2ZpbGUubmFtZX0gKHJlYXNvbj0ke3ByZXZpb3VzRmFpbHVyZX0pYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwic2tpcHBlZFwiIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gV2FpdCBiZWZvcmUgcGFyc2luZyB0byByZWR1Y2UgV2ViU29ja2V0IGxvYWRcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMucGFyc2VEZWxheU1zID4gMCkge1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgdGhpcy5vcHRpb25zLnBhcnNlRGVsYXlNcykpO1xuICAgICAgfVxuXG4gICAgICAvLyBQYXJzZSBkb2N1bWVudFxuICAgICAgY29uc3QgcGFyc2VkUmVzdWx0ID0gYXdhaXQgcGFyc2VEb2N1bWVudChmaWxlLnBhdGgsIGVuYWJsZU9DUiwgY2xpZW50KTtcbiAgICAgIGlmICghcGFyc2VkUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKHBhcnNlZFJlc3VsdC5yZWFzb24sIHBhcnNlZFJlc3VsdC5kZXRhaWxzLCBmaWxlKTtcbiAgICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBwYXJzZWRSZXN1bHQucmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZWRSZXN1bHQuZG9jdW1lbnQ7XG5cbiAgICAgIC8vIENodW5rIHRleHRcbiAgICAgIGNvbnN0IGNodW5rcyA9IGNodW5rVGV4dChwYXJzZWQudGV4dCwgY2h1bmtTaXplLCBjaHVua092ZXJsYXApO1xuICAgICAgaWYgKGNodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYE5vIGNodW5rcyBjcmVhdGVkIGZyb20gJHtmaWxlLm5hbWV9YCk7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcImluZGV4LmNodW5rLWVtcHR5XCIsIFwiY2h1bmtUZXh0IHByb2R1Y2VkIDAgY2h1bmtzXCIsIGZpbGUpO1xuICAgICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgICBhd2FpdCB0aGlzLmZhaWxlZEZpbGVSZWdpc3RyeS5yZWNvcmRGYWlsdXJlKGZpbGUucGF0aCwgZmlsZUhhc2gsIFwiaW5kZXguY2h1bmstZW1wdHlcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9OyAvLyBGYWlsZWQgdG8gY2h1bmtcbiAgICAgIH1cblxuICAgICAgLy8gR2VuZXJhdGUgZW1iZWRkaW5ncyBhbmQgY3JlYXRlIGRvY3VtZW50IGNodW5rc1xuICAgICAgY29uc3QgZG9jdW1lbnRDaHVua3M6IERvY3VtZW50Q2h1bmtbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNodW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBjaHVuayA9IGNodW5rc1tpXTtcbiAgICAgICAgXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gR2VuZXJhdGUgZW1iZWRkaW5nXG4gICAgICAgICAgY29uc3QgZW1iZWRkaW5nUmVzdWx0ID0gYXdhaXQgZW1iZWRkaW5nTW9kZWwuZW1iZWQoY2h1bmsudGV4dCk7XG4gICAgICAgICAgY29uc3QgZW1iZWRkaW5nID0gY29lcmNlRW1iZWRkaW5nVmVjdG9yKGVtYmVkZGluZ1Jlc3VsdC5lbWJlZGRpbmcpO1xuICAgICAgICAgIFxuICAgICAgICAgIGRvY3VtZW50Q2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgaWQ6IGAke2ZpbGVIYXNofS0ke2l9YCxcbiAgICAgICAgICAgIHRleHQ6IGNodW5rLnRleHQsXG4gICAgICAgICAgICB2ZWN0b3I6IGVtYmVkZGluZyxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBmaWxlLnBhdGgsXG4gICAgICAgICAgICBmaWxlTmFtZTogZmlsZS5uYW1lLFxuICAgICAgICAgICAgZmlsZUhhc2gsXG4gICAgICAgICAgICBjaHVua0luZGV4OiBpLFxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcbiAgICAgICAgICAgICAgZXh0ZW5zaW9uOiBmaWxlLmV4dGVuc2lvbixcbiAgICAgICAgICAgICAgc2l6ZTogZmlsZS5zaXplLFxuICAgICAgICAgICAgICBtdGltZTogZmlsZS5tdGltZS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICBzdGFydEluZGV4OiBjaHVuay5zdGFydEluZGV4LFxuICAgICAgICAgICAgICBlbmRJbmRleDogY2h1bmsuZW5kSW5kZXgsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGVtYmVkZGluZyBjaHVuayAke2l9IG9mICR7ZmlsZS5uYW1lfTpgLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGNodW5rcyB0byB2ZWN0b3Igc3RvcmVcbiAgICAgIGlmIChkb2N1bWVudENodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgIFwiaW5kZXguY2h1bmstZW1wdHlcIixcbiAgICAgICAgICBcIkFsbCBjaHVuayBlbWJlZGRpbmdzIGZhaWxlZCwgbm8gZG9jdW1lbnQgY2h1bmtzXCIsXG4gICAgICAgICAgZmlsZSxcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGZpbGVIYXNoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcImluZGV4LmNodW5rLWVtcHR5XCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuYWRkQ2h1bmtzKGRvY3VtZW50Q2h1bmtzKTtcbiAgICAgICAgY29uc29sZS5sb2coYEluZGV4ZWQgJHtkb2N1bWVudENodW5rcy5sZW5ndGh9IGNodW5rcyBmcm9tICR7ZmlsZS5uYW1lfWApO1xuICAgICAgICBpZiAoIWV4aXN0aW5nSGFzaGVzKSB7XG4gICAgICAgICAgZmlsZUludmVudG9yeS5zZXQoZmlsZS5wYXRoLCBuZXcgU2V0KFtmaWxlSGFzaF0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleGlzdGluZ0hhc2hlcy5hZGQoZmlsZUhhc2gpO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LmNsZWFyRmFpbHVyZShmaWxlLnBhdGgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiaW5kZXhlZFwiLFxuICAgICAgICAgIGNoYW5nZVR5cGU6IGhhc1NlZW5CZWZvcmUgPyBcInVwZGF0ZWRcIiA6IFwibmV3XCIsXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBhZGRpbmcgY2h1bmtzIGZvciAke2ZpbGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCIsXG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICk7XG4gICAgICAgIGlmIChmaWxlSGFzaCkge1xuICAgICAgICAgIGF3YWl0IHRoaXMuZmFpbGVkRmlsZVJlZ2lzdHJ5LnJlY29yZEZhaWx1cmUoZmlsZS5wYXRoLCBmaWxlSGFzaCwgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluZGV4aW5nIGZpbGUgJHtmaWxlLnBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgICBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICk7XG4gICAgICBpZiAoZmlsZUhhc2gpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5mYWlsZWRGaWxlUmVnaXN0cnkucmVjb3JkRmFpbHVyZShmaWxlLnBhdGgsIGZpbGVIYXNoLCBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWlsZWRcIiB9OyAvLyBGYWlsZWRcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVpbmRleCBhIHNwZWNpZmljIGZpbGUgKGRlbGV0ZSBvbGQgY2h1bmtzIGFuZCByZWluZGV4KVxuICAgKi9cbiAgYXN5bmMgcmVpbmRleEZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHsgdmVjdG9yU3RvcmUgfSA9IHRoaXMub3B0aW9ucztcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlSGFzaCA9IGF3YWl0IGNhbGN1bGF0ZUZpbGVIYXNoKGZpbGVQYXRoKTtcbiAgICAgIFxuICAgICAgLy8gRGVsZXRlIG9sZCBjaHVua3NcbiAgICAgIGF3YWl0IHZlY3RvclN0b3JlLmRlbGV0ZUJ5RmlsZUhhc2goZmlsZUhhc2gpO1xuICAgICAgXG4gICAgICAvLyBSZWluZGV4XG4gICAgICBjb25zdCBmaWxlOiBTY2FubmVkRmlsZSA9IHtcbiAgICAgICAgcGF0aDogZmlsZVBhdGgsXG4gICAgICAgIG5hbWU6IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aCxcbiAgICAgICAgZXh0ZW5zaW9uOiBmaWxlUGF0aC5zcGxpdChcIi5cIikucG9wKCkgfHwgXCJcIixcbiAgICAgICAgbWltZVR5cGU6IGZhbHNlLFxuICAgICAgICBzaXplOiAwLFxuICAgICAgICBtdGltZTogbmV3IERhdGUoKSxcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGF3YWl0IHRoaXMuaW5kZXhGaWxlKGZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciByZWluZGV4aW5nIGZpbGUgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWNvcmRGYWlsdXJlKHJlYXNvbjogRmFpbHVyZVJlYXNvbiwgZGV0YWlsczogc3RyaW5nIHwgdW5kZWZpbmVkLCBmaWxlOiBTY2FubmVkRmlsZSkge1xuICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXSA/PyAwO1xuICAgIHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dID0gY3VycmVudCArIDE7XG4gICAgY29uc3QgZGV0YWlsU3VmZml4ID0gZGV0YWlscyA/IGAgZGV0YWlscz0ke2RldGFpbHN9YCA6IFwiXCI7XG4gICAgY29uc29sZS53YXJuKFxuICAgICAgYFtCaWdSQUddIEZhaWxlZCB0byBwYXJzZSAke2ZpbGUubmFtZX0gKHJlYXNvbj0ke3JlYXNvbn0sIGNvdW50PSR7dGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl19KSR7ZGV0YWlsU3VmZml4fWAsXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgbG9nRmFpbHVyZVN1bW1hcnkoKSB7XG4gICAgY29uc3QgZW50cmllcyA9IE9iamVjdC5lbnRyaWVzKHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50cyk7XG4gICAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIltCaWdSQUddIE5vIHBhcnNpbmcgZmFpbHVyZXMgcmVjb3JkZWQuXCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIltCaWdSQUddIEZhaWx1cmUgcmVhc29uIHN1bW1hcnk6XCIpO1xuICAgIGZvciAoY29uc3QgW3JlYXNvbiwgY291bnRdIG9mIGVudHJpZXMpIHtcbiAgICAgIGNvbnNvbGUubG9nKGAgIC0gJHtyZWFzb259OiAke2NvdW50fWApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgd3JpdGVGYWlsdXJlUmVwb3J0KHN1bW1hcnk6IEluZGV4aW5nUmVzdWx0KSB7XG4gICAgY29uc3QgcmVwb3J0UGF0aCA9IHRoaXMub3B0aW9ucy5mYWlsdXJlUmVwb3J0UGF0aDtcbiAgICBpZiAoIXJlcG9ydFBhdGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgLi4uc3VtbWFyeSxcbiAgICAgIGRvY3VtZW50c0RpcjogdGhpcy5vcHRpb25zLmRvY3VtZW50c0RpcixcbiAgICAgIGZhaWx1cmVSZWFzb25zOiB0aGlzLmZhaWx1cmVSZWFzb25Db3VudHMsXG4gICAgICBnZW5lcmF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMubWtkaXIocGF0aC5kaXJuYW1lKHJlcG9ydFBhdGgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgIGF3YWl0IGZzLnByb21pc2VzLndyaXRlRmlsZShyZXBvcnRQYXRoLCBKU09OLnN0cmluZ2lmeShwYXlsb2FkLCBudWxsLCAyKSwgXCJ1dGYtOFwiKTtcbiAgICAgIGNvbnNvbGUubG9nKGBbQmlnUkFHXSBXcm90ZSBmYWlsdXJlIHJlcG9ydCB0byAke3JlcG9ydFBhdGh9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFtCaWdSQUddIEZhaWxlZCB0byB3cml0ZSBmYWlsdXJlIHJlcG9ydCB0byAke3JlcG9ydFBhdGh9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IHR5cGUgTE1TdHVkaW9DbGllbnQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgSW5kZXhNYW5hZ2VyLCB0eXBlIEluZGV4aW5nUHJvZ3Jlc3MsIHR5cGUgSW5kZXhpbmdSZXN1bHQgfSBmcm9tIFwiLi9pbmRleE1hbmFnZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlIH0gZnJvbSBcIi4uL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSW5kZXhpbmdQYXJhbXMge1xuICBjbGllbnQ6IExNU3R1ZGlvQ2xpZW50O1xuICBhYm9ydFNpZ25hbDogQWJvcnRTaWduYWw7XG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nO1xuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nO1xuICBjaHVua1NpemU6IG51bWJlcjtcbiAgY2h1bmtPdmVybGFwOiBudW1iZXI7XG4gIG1heENvbmN1cnJlbnQ6IG51bWJlcjtcbiAgZW5hYmxlT0NSOiBib29sZWFuO1xuICBhdXRvUmVpbmRleDogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIGZvcmNlUmVpbmRleD86IGJvb2xlYW47XG4gIHZlY3RvclN0b3JlPzogVmVjdG9yU3RvcmU7XG4gIG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IEluZGV4aW5nUHJvZ3Jlc3MpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVuSW5kZXhpbmdSZXN1bHQge1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIHN0YXRzOiB7XG4gICAgdG90YWxDaHVua3M6IG51bWJlcjtcbiAgICB1bmlxdWVGaWxlczogbnVtYmVyO1xuICB9O1xuICBpbmRleGluZ1Jlc3VsdDogSW5kZXhpbmdSZXN1bHQ7XG59XG5cbi8qKlxuICogU2hhcmVkIGhlbHBlciB0aGF0IHJ1bnMgdGhlIGZ1bGwgaW5kZXhpbmcgcGlwZWxpbmUuXG4gKiBBbGxvd3MgcmV1c2UgYWNyb3NzIHRoZSBtYW51YWwgdG9vbCwgY29uZmlnLXRyaWdnZXJlZCBpbmRleGluZywgYW5kIGF1dG9tYXRpYyBib290c3RyYXBwaW5nLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuSW5kZXhpbmdKb2Ioe1xuICBjbGllbnQsXG4gIGFib3J0U2lnbmFsLFxuICBkb2N1bWVudHNEaXIsXG4gIHZlY3RvclN0b3JlRGlyLFxuICBjaHVua1NpemUsXG4gIGNodW5rT3ZlcmxhcCxcbiAgbWF4Q29uY3VycmVudCxcbiAgZW5hYmxlT0NSLFxuICBhdXRvUmVpbmRleCxcbiAgcGFyc2VEZWxheU1zLFxuICBmb3JjZVJlaW5kZXggPSBmYWxzZSxcbiAgdmVjdG9yU3RvcmU6IGV4aXN0aW5nVmVjdG9yU3RvcmUsXG4gIG9uUHJvZ3Jlc3MsXG59OiBSdW5JbmRleGluZ1BhcmFtcyk6IFByb21pc2U8UnVuSW5kZXhpbmdSZXN1bHQ+IHtcbiAgY29uc3QgdmVjdG9yU3RvcmUgPSBleGlzdGluZ1ZlY3RvclN0b3JlID8/IG5ldyBWZWN0b3JTdG9yZSh2ZWN0b3JTdG9yZURpcik7XG4gIGNvbnN0IG93bnNWZWN0b3JTdG9yZSA9IGV4aXN0aW5nVmVjdG9yU3RvcmUgPT09IHVuZGVmaW5lZDtcblxuICBpZiAob3duc1ZlY3RvclN0b3JlKSB7XG4gICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICB9XG5cbiAgY29uc3QgZW1iZWRkaW5nTW9kZWwgPSBhd2FpdCBjbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgIFwibm9taWMtYWkvbm9taWMtZW1iZWQtdGV4dC12MS41LUdHVUZcIixcbiAgICB7IHNpZ25hbDogYWJvcnRTaWduYWwgfSxcbiAgKTtcblxuICBjb25zdCBpbmRleE1hbmFnZXIgPSBuZXcgSW5kZXhNYW5hZ2VyKHtcbiAgICBkb2N1bWVudHNEaXIsXG4gICAgdmVjdG9yU3RvcmUsXG4gICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgZW1iZWRkaW5nTW9kZWwsXG4gICAgY2xpZW50LFxuICAgIGNodW5rU2l6ZSxcbiAgICBjaHVua092ZXJsYXAsXG4gICAgbWF4Q29uY3VycmVudCxcbiAgICBlbmFibGVPQ1IsXG4gICAgYXV0b1JlaW5kZXg6IGZvcmNlUmVpbmRleCA/IGZhbHNlIDogYXV0b1JlaW5kZXgsXG4gICAgcGFyc2VEZWxheU1zLFxuICAgIG9uUHJvZ3Jlc3MsXG4gIH0pO1xuXG4gIGNvbnN0IGluZGV4aW5nUmVzdWx0ID0gYXdhaXQgaW5kZXhNYW5hZ2VyLmluZGV4KCk7XG4gIGNvbnN0IHN0YXRzID0gYXdhaXQgdmVjdG9yU3RvcmUuZ2V0U3RhdHMoKTtcblxuICBpZiAob3duc1ZlY3RvclN0b3JlKSB7XG4gICAgYXdhaXQgdmVjdG9yU3RvcmUuY2xvc2UoKTtcbiAgfVxuXG4gIGNvbnN0IHN1bW1hcnkgPSBgSW5kZXhpbmcgY29tcGxldGVkIVxcblxcbmAgK1xuICAgIGBcdTIwMjIgU3VjY2Vzc2Z1bGx5IGluZGV4ZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgQ2h1bmtzIGluIHN0b3JlOiAke3N0YXRzLnRvdGFsQ2h1bmtzfVxcbmAgK1xuICAgIGBcdTIwMjIgVW5pcXVlIGZpbGVzIGluIHN0b3JlOiAke3N0YXRzLnVuaXF1ZUZpbGVzfWA7XG5cbiAgcmV0dXJuIHtcbiAgICBzdW1tYXJ5LFxuICAgIHN0YXRzLFxuICAgIGluZGV4aW5nUmVzdWx0LFxuICB9O1xufVxuXG4iLCAiaW1wb3J0IHtcbiAgdHlwZSBDaGF0TWVzc2FnZSxcbiAgdHlwZSBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxufSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hdGljcyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUgfSBmcm9tIFwiLi92ZWN0b3JzdG9yZS92ZWN0b3JTdG9yZVwiO1xuaW1wb3J0IHsgcGVyZm9ybVNhbml0eUNoZWNrcyB9IGZyb20gXCIuL3V0aWxzL3Nhbml0eUNoZWNrc1wiO1xuaW1wb3J0IHsgdHJ5U3RhcnRJbmRleGluZywgZmluaXNoSW5kZXhpbmcgfSBmcm9tIFwiLi91dGlscy9pbmRleGluZ0xvY2tcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IHJ1bkluZGV4aW5nSm9iIH0gZnJvbSBcIi4vaW5nZXN0aW9uL3J1bkluZGV4aW5nXCI7XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZVRleHQodGV4dDogc3RyaW5nLCBtYXhMaW5lczogbnVtYmVyID0gMywgbWF4Q2hhcnM6IG51bWJlciA9IDQwMCk6IHN0cmluZyB7XG4gIGNvbnN0IGxpbmVzID0gdGV4dC5zcGxpdCgvXFxyP1xcbi8pLmZpbHRlcihsaW5lID0+IGxpbmUudHJpbSgpICE9PSBcIlwiKTtcbiAgY29uc3QgY2xpcHBlZExpbmVzID0gbGluZXMuc2xpY2UoMCwgbWF4TGluZXMpO1xuICBsZXQgY2xpcHBlZCA9IGNsaXBwZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xuICBpZiAoY2xpcHBlZC5sZW5ndGggPiBtYXhDaGFycykge1xuICAgIGNsaXBwZWQgPSBjbGlwcGVkLnNsaWNlKDAsIG1heENoYXJzKTtcbiAgfVxuICBjb25zdCBuZWVkc0VsbGlwc2lzID1cbiAgICBsaW5lcy5sZW5ndGggPiBtYXhMaW5lcyB8fFxuICAgIHRleHQubGVuZ3RoID4gY2xpcHBlZC5sZW5ndGggfHxcbiAgICBjbGlwcGVkLmxlbmd0aCA9PT0gbWF4Q2hhcnMgJiYgdGV4dC5sZW5ndGggPiBtYXhDaGFycztcbiAgcmV0dXJuIG5lZWRzRWxsaXBzaXMgPyBgJHtjbGlwcGVkLnRyaW1FbmQoKX1cdTIwMjZgIDogY2xpcHBlZDtcbn1cblxuLy8gR2xvYmFsIHN0YXRlIGZvciB2ZWN0b3Igc3RvcmUgKHBlcnNpc3RzIGFjcm9zcyByZXF1ZXN0cylcbmxldCB2ZWN0b3JTdG9yZTogVmVjdG9yU3RvcmUgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0SW5kZXhlZERpciA9IFwiXCI7XG5sZXQgc2FuaXR5Q2hlY2tzUGFzc2VkID0gZmFsc2U7XG5cbmFzeW5jIGZ1bmN0aW9uIHdhcm5JZkNvbnRleHRPdmVyZmxvdyhcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyLFxuICBmaW5hbFByb21wdDogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdG9rZW5Tb3VyY2UgPSBhd2FpdCBjdGwudG9rZW5Tb3VyY2UoKTtcbiAgICBpZiAoXG4gICAgICAhdG9rZW5Tb3VyY2UgfHxcbiAgICAgICEoXCJhcHBseVByb21wdFRlbXBsYXRlXCIgaW4gdG9rZW5Tb3VyY2UpIHx8XG4gICAgICB0eXBlb2YgdG9rZW5Tb3VyY2UuYXBwbHlQcm9tcHRUZW1wbGF0ZSAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiY291bnRUb2tlbnNcIiBpbiB0b2tlblNvdXJjZSkgfHxcbiAgICAgIHR5cGVvZiB0b2tlblNvdXJjZS5jb3VudFRva2VucyAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAhKFwiZ2V0Q29udGV4dExlbmd0aFwiIGluIHRva2VuU291cmNlKSB8fFxuICAgICAgdHlwZW9mIHRva2VuU291cmNlLmdldENvbnRleHRMZW5ndGggIT09IFwiZnVuY3Rpb25cIlxuICAgICkge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVG9rZW4gc291cmNlIGRvZXMgbm90IGV4cG9zZSBwcm9tcHQgdXRpbGl0aWVzOyBza2lwcGluZyBjb250ZXh0IGNoZWNrLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBbY29udGV4dExlbmd0aCwgaGlzdG9yeV0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0b2tlblNvdXJjZS5nZXRDb250ZXh0TGVuZ3RoKCksXG4gICAgICBjdGwucHVsbEhpc3RvcnkoKSxcbiAgICBdKTtcbiAgICBjb25zdCBoaXN0b3J5V2l0aExhdGVzdE1lc3NhZ2UgPSBoaXN0b3J5LndpdGhBcHBlbmRlZCh7XG4gICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgIGNvbnRlbnQ6IGZpbmFsUHJvbXB0LFxuICAgIH0pO1xuICAgIGNvbnN0IGZvcm1hdHRlZFByb21wdCA9IGF3YWl0IHRva2VuU291cmNlLmFwcGx5UHJvbXB0VGVtcGxhdGUoaGlzdG9yeVdpdGhMYXRlc3RNZXNzYWdlKTtcbiAgICBjb25zdCBwcm9tcHRUb2tlbnMgPSBhd2FpdCB0b2tlblNvdXJjZS5jb3VudFRva2Vucyhmb3JtYXR0ZWRQcm9tcHQpO1xuXG4gICAgaWYgKHByb21wdFRva2VucyA+IGNvbnRleHRMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHdhcm5pbmdTdW1tYXJ5ID1cbiAgICAgICAgYFx1MjZBMFx1RkUwRiBQcm9tcHQgbmVlZHMgJHtwcm9tcHRUb2tlbnMudG9Mb2NhbGVTdHJpbmcoKX0gdG9rZW5zIGJ1dCBtb2RlbCBtYXggaXMgJHtjb250ZXh0TGVuZ3RoLnRvTG9jYWxlU3RyaW5nKCl9LmA7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nU3VtbWFyeSk7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICAgIHRleHQ6IGAke3dhcm5pbmdTdW1tYXJ5fSBSZWR1Y2UgcmV0cmlldmVkIHBhc3NhZ2VzIG9yIGluY3JlYXNlIHRoZSBtb2RlbCdzIGNvbnRleHQgbGVuZ3RoLmAsXG4gICAgICB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICAgICAgdGl0bGU6IFwiQ29udGV4dCB3aW5kb3cgZXhjZWVkZWRcIixcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7d2FybmluZ1N1bW1hcnl9IFByb21wdCBtYXkgYmUgdHJ1bmNhdGVkIG9yIHJlamVjdGVkLmAsXG4gICAgICAgICAgbm9BdXRvRGlzbWlzczogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChub3RpZnlFcnJvcikge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBVbmFibGUgdG8gc2VuZCBjb250ZXh0IG92ZXJmbG93IG5vdGlmaWNhdGlvbjpcIiwgbm90aWZ5RXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBGYWlsZWQgdG8gZXZhbHVhdGUgY29udGV4dCB1c2FnZTpcIiwgZXJyb3IpO1xuICB9XG59XG5cbi8qKlxuICogTWFpbiBwcm9tcHQgcHJlcHJvY2Vzc29yIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwcm9jZXNzKFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBDaGF0TWVzc2FnZSxcbik6IFByb21pc2U8Q2hhdE1lc3NhZ2UgfCBzdHJpbmc+IHtcbiAgY29uc3QgdXNlclByb21wdCA9IHVzZXJNZXNzYWdlLmdldFRleHQoKTtcbiAgY29uc3QgcGx1Z2luQ29uZmlnID0gY3RsLmdldFBsdWdpbkNvbmZpZyhjb25maWdTY2hlbWF0aWNzKTtcblxuICAvLyBHZXQgY29uZmlndXJhdGlvblxuICBjb25zdCBkb2N1bWVudHNEaXIgPSBwbHVnaW5Db25maWcuZ2V0KFwiZG9jdW1lbnRzRGlyZWN0b3J5XCIpO1xuICBjb25zdCB2ZWN0b3JTdG9yZURpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJ2ZWN0b3JTdG9yZURpcmVjdG9yeVwiKTtcbiAgY29uc3QgcmV0cmlldmFsTGltaXQgPSBwbHVnaW5Db25maWcuZ2V0KFwicmV0cmlldmFsTGltaXRcIik7XG4gIGNvbnN0IHJldHJpZXZhbFRocmVzaG9sZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiKTtcbiAgY29uc3QgY2h1bmtTaXplID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rU2l6ZVwiKTtcbiAgY29uc3QgY2h1bmtPdmVybGFwID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rT3ZlcmxhcFwiKTtcbiAgY29uc3QgbWF4Q29uY3VycmVudCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYXhDb25jdXJyZW50RmlsZXNcIik7XG4gIGNvbnN0IGVuYWJsZU9DUiA9IHBsdWdpbkNvbmZpZy5nZXQoXCJlbmFibGVPQ1JcIik7XG4gIGNvbnN0IHNraXBQcmV2aW91c2x5SW5kZXhlZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKTtcbiAgY29uc3QgcGFyc2VEZWxheU1zID0gcGx1Z2luQ29uZmlnLmdldChcInBhcnNlRGVsYXlNc1wiKSA/PyAwO1xuICBjb25zdCByZWluZGV4UmVxdWVzdGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiKTtcblxuICAvLyBWYWxpZGF0ZSBjb25maWd1cmF0aW9uXG4gIGlmICghZG9jdW1lbnRzRGlyIHx8IGRvY3VtZW50c0RpciA9PT0gXCJcIikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIERvY3VtZW50cyBkaXJlY3Rvcnkgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLlwiKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cblxuICBpZiAoIXZlY3RvclN0b3JlRGlyIHx8IHZlY3RvclN0b3JlRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gUGVyZm9ybSBzYW5pdHkgY2hlY2tzIG9uIGZpcnN0IHJ1blxuICAgIGlmICghc2FuaXR5Q2hlY2tzUGFzc2VkKSB7XG4gICAgICBjb25zdCBjaGVja1N0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIlBlcmZvcm1pbmcgc2FuaXR5IGNoZWNrcy4uLlwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNhbml0eVJlc3VsdCA9IGF3YWl0IHBlcmZvcm1TYW5pdHlDaGVja3MoZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZURpcik7XG5cbiAgICAgIC8vIExvZyB3YXJuaW5nc1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHNhbml0eVJlc3VsdC53YXJuaW5ncykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9nIGVycm9ycyBhbmQgYWJvcnQgaWYgY3JpdGljYWxcbiAgICAgIGlmICghc2FuaXR5UmVzdWx0LnBhc3NlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHNhbml0eVJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR11cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZhaWx1cmVSZWFzb24gPVxuICAgICAgICAgIHNhbml0eVJlc3VsdC5lcnJvcnNbMF0gPz9cbiAgICAgICAgICBzYW5pdHlSZXN1bHQud2FybmluZ3NbMF0gPz9cbiAgICAgICAgICBcIlVua25vd24gcmVhc29uLiBQbGVhc2UgcmV2aWV3IHBsdWdpbiBzZXR0aW5ncy5cIjtcbiAgICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgIHRleHQ6IGBTYW5pdHkgY2hlY2tzIGZhaWxlZDogJHtmYWlsdXJlUmVhc29ufWAsXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gICAgICB9XG5cbiAgICAgIGNoZWNrU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJTYW5pdHkgY2hlY2tzIHBhc3NlZFwiLFxuICAgICAgfSk7XG4gICAgICBzYW5pdHlDaGVja3NQYXNzZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIEluaXRpYWxpemUgdmVjdG9yIHN0b3JlIGlmIG5lZWRlZFxuICAgIGlmICghdmVjdG9yU3RvcmUgfHwgbGFzdEluZGV4ZWREaXIgIT09IHZlY3RvclN0b3JlRGlyKSB7XG4gICAgICBjb25zdCBzdGF0dXMgPSBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgdGV4dDogXCJJbml0aWFsaXppbmcgdmVjdG9yIHN0b3JlLi4uXCIsXG4gICAgICB9KTtcblxuICAgICAgdmVjdG9yU3RvcmUgPSBuZXcgVmVjdG9yU3RvcmUodmVjdG9yU3RvcmVEaXIpO1xuICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuaW5pdGlhbGl6ZSgpO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHJlYWR5IChwYXRoPSR7dmVjdG9yU3RvcmVEaXJ9KS4gV2FpdGluZyBmb3IgcXVlcmllcy4uLmAsXG4gICAgICApO1xuICAgICAgbGFzdEluZGV4ZWREaXIgPSB2ZWN0b3JTdG9yZURpcjtcblxuICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWRcIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGF3YWl0IG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gICAgICBjdGwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBwYXJzZURlbGF5TXMsXG4gICAgICByZWluZGV4UmVxdWVzdGVkLFxuICAgICAgc2tpcFByZXZpb3VzbHlJbmRleGVkOiBwbHVnaW5Db25maWcuZ2V0KFwibWFudWFsUmVpbmRleC5za2lwUHJldmlvdXNseUluZGV4ZWRcIiksXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBpZiB3ZSBuZWVkIHRvIGluZGV4XG4gICAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuICAgIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIFZlY3RvciBzdG9yZSBzdGF0cyBiZWZvcmUgYXV0by1pbmRleCBjaGVjazogdG90YWxDaHVua3M9JHtzdGF0cy50b3RhbENodW5rc30sIHVuaXF1ZUZpbGVzPSR7c3RhdHMudW5pcXVlRmlsZXN9YCk7XG5cbiAgICBpZiAoc3RhdHMudG90YWxDaHVua3MgPT09IDApIHtcbiAgICAgIGlmICghdHJ5U3RhcnRJbmRleGluZyhcImF1dG8tdHJpZ2dlclwiKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBJbmRleGluZyBhbHJlYWR5IHJ1bm5pbmcsIHNraXBwaW5nIGF1dG9tYXRpYyBpbmRleGluZy5cIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBpbmRleFN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgdGV4dDogXCJTdGFydGluZyBpbml0aWFsIGluZGV4aW5nLi4uXCIsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgeyBpbmRleGluZ1Jlc3VsdCB9ID0gYXdhaXQgcnVuSW5kZXhpbmdKb2Ioe1xuICAgICAgICAgICAgY2xpZW50OiBjdGwuY2xpZW50LFxuICAgICAgICAgICAgYWJvcnRTaWduYWw6IGN0bC5hYm9ydFNpZ25hbCxcbiAgICAgICAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgICAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgICAgICAgY2h1bmtTaXplLFxuICAgICAgICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgICAgICAgIGVuYWJsZU9DUixcbiAgICAgICAgICAgIGF1dG9SZWluZGV4OiBmYWxzZSxcbiAgICAgICAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgICAgICAgIHZlY3RvclN0b3JlLFxuICAgICAgICAgICAgZm9yY2VSZWluZGV4OiB0cnVlLFxuICAgICAgICAgICAgb25Qcm9ncmVzczogKHByb2dyZXNzKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwic2Nhbm5pbmdcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgU2Nhbm5pbmc6ICR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9YCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiaW5kZXhpbmdcIikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSBwcm9ncmVzcy5zdWNjZXNzZnVsRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWQgPSBwcm9ncmVzcy5mYWlsZWRGaWxlcyA/PyAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNraXBwZWQgPSBwcm9ncmVzcy5za2lwcGVkRmlsZXMgPz8gMDtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGVycm9yOiAke3Byb2dyZXNzLmVycm9yfWAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhgW0JpZ1JBR10gSW5kZXhpbmcgY29tcGxldGU6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2luZGV4aW5nUmVzdWx0LmZhaWxlZEZpbGVzfSBmYWlsZWQpYCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBJbmRleGluZyBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBmaW5pc2hJbmRleGluZygpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTG9nIG1hbnVhbCByZWluZGV4IHRvZ2dsZSBzdGF0ZXMgZm9yIHZpc2liaWxpdHkgb24gZWFjaCBjaGF0XG4gICAgY29uc3QgdG9nZ2xlU3RhdHVzVGV4dCA9XG4gICAgICBgTWFudWFsIFJlaW5kZXggVHJpZ2dlcjogJHtyZWluZGV4UmVxdWVzdGVkID8gXCJPTlwiIDogXCJPRkZcIn0gfCBgICtcbiAgICAgIGBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZDogJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifWA7XG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSAke3RvZ2dsZVN0YXR1c1RleHR9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogdG9nZ2xlU3RhdHVzVGV4dCxcbiAgICB9KTtcblxuICAgIC8vIFBlcmZvcm0gcmV0cmlldmFsXG4gICAgY29uc3QgcmV0cmlldmFsU3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJMb2FkaW5nIGVtYmVkZGluZyBtb2RlbCBmb3IgcmV0cmlldmFsLi4uXCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGN0bC5jbGllbnQuZW1iZWRkaW5nLm1vZGVsKFxuICAgICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgICAgeyBzaWduYWw6IGN0bC5hYm9ydFNpZ25hbCB9XG4gICAgKTtcblxuICAgIHJldHJpZXZhbFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgdGV4dDogXCJTZWFyY2hpbmcgZm9yIHJlbGV2YW50IGNvbnRlbnQuLi5cIixcbiAgICB9KTtcblxuICAgIC8vIEVtYmVkIHRoZSBxdWVyeVxuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nUmVzdWx0ID0gYXdhaXQgZW1iZWRkaW5nTW9kZWwuZW1iZWQodXNlclByb21wdCk7XG4gICAgY29uc3QgcXVlcnlFbWJlZGRpbmcgPSBxdWVyeUVtYmVkZGluZ1Jlc3VsdC5lbWJlZGRpbmc7XG5cbiAgICAvLyBTZWFyY2ggdmVjdG9yIHN0b3JlXG4gICAgY29uc3QgcXVlcnlQcmV2aWV3ID1cbiAgICAgIHVzZXJQcm9tcHQubGVuZ3RoID4gMTYwID8gYCR7dXNlclByb21wdC5zbGljZSgwLCAxNjApfS4uLmAgOiB1c2VyUHJvbXB0O1xuICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgIGBbQmlnUkFHXSBFeGVjdXRpbmcgdmVjdG9yIHNlYXJjaCBmb3IgXCIke3F1ZXJ5UHJldmlld31cIiAobGltaXQ9JHtyZXRyaWV2YWxMaW1pdH0sIHRocmVzaG9sZD0ke3JldHJpZXZhbFRocmVzaG9sZH0pYCxcbiAgICApO1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5zZWFyY2goXG4gICAgICBxdWVyeUVtYmVkZGluZyxcbiAgICAgIHJldHJpZXZhbExpbWl0LFxuICAgICAgcmV0cmlldmFsVGhyZXNob2xkXG4gICAgKTtcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0b3BIaXQgPSByZXN1bHRzWzBdO1xuICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICBgW0JpZ1JBR10gVmVjdG9yIHNlYXJjaCByZXR1cm5lZCAke3Jlc3VsdHMubGVuZ3RofSByZXN1bHRzLiBUb3AgaGl0OiBmaWxlPSR7dG9wSGl0LmZpbGVOYW1lfSBzY29yZT0ke3RvcEhpdC5zY29yZS50b0ZpeGVkKDMpfWAsXG4gICAgICApO1xuXG4gICAgICBjb25zdCBkb2NTdW1tYXJpZXMgPSByZXN1bHRzXG4gICAgICAgIC5tYXAoXG4gICAgICAgICAgKHJlc3VsdCwgaWR4KSA9PlxuICAgICAgICAgICAgYCMke2lkeCArIDF9IGZpbGU9JHtwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCl9IHNjb3JlPSR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9YCxcbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUmVsZXZhbnQgZG9jdW1lbnRzOlxcbiR7ZG9jU3VtbWFyaWVzfWApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXSBWZWN0b3Igc2VhcmNoIHJldHVybmVkIDAgcmVzdWx0cy5cIik7XG4gICAgfVxuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgdGV4dDogXCJObyByZWxldmFudCBjb250ZW50IGZvdW5kIGluIGluZGV4ZWQgZG9jdW1lbnRzXCIsXG4gICAgICB9KTtcblxuICAgICAgY29uc3Qgbm90ZUFib3V0Tm9SZXN1bHRzID1cbiAgICAgICAgYEltcG9ydGFudDogTm8gcmVsZXZhbnQgY29udGVudCB3YXMgZm91bmQgaW4gdGhlIGluZGV4ZWQgZG9jdW1lbnRzIGZvciB0aGUgdXNlciBxdWVyeS4gYCArXG4gICAgICAgIGBJbiBsZXNzIHRoYW4gb25lIHNlbnRlbmNlLCBpbmZvcm0gdGhlIHVzZXIgb2YgdGhpcy4gYCArXG4gICAgICAgIGBUaGVuIHJlc3BvbmQgdG8gdGhlIHF1ZXJ5IHRvIHRoZSBiZXN0IG9mIHlvdXIgYWJpbGl0eS5gO1xuXG4gICAgICByZXR1cm4gbm90ZUFib3V0Tm9SZXN1bHRzICsgYFxcblxcblVzZXIgUXVlcnk6XFxuXFxuJHt1c2VyUHJvbXB0fWA7XG4gICAgfVxuXG4gICAgLy8gRm9ybWF0IHJlc3VsdHNcbiAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSZXRyaWV2ZWQgJHtyZXN1bHRzLmxlbmd0aH0gcmVsZXZhbnQgcGFzc2FnZXNgLFxuICAgIH0pO1xuXG4gICAgY3RsLmRlYnVnKFwiUmV0cmlldmFsIHJlc3VsdHM6XCIsIHJlc3VsdHMpO1xuXG4gICAgbGV0IHByb2Nlc3NlZENvbnRlbnQgPSBcIlwiO1xuICAgIGxldCBwcm9jZXNzZWRQcmV2aWV3ID0gXCJcIjtcbiAgICBjb25zdCBwcmVmaXggPSBcIlRoZSBmb2xsb3dpbmcgcGFzc2FnZXMgd2VyZSBmb3VuZCBpbiB5b3VyIGluZGV4ZWQgZG9jdW1lbnRzOlxcblxcblwiO1xuICAgIHByb2Nlc3NlZENvbnRlbnQgKz0gcHJlZml4O1xuICAgIHByb2Nlc3NlZFByZXZpZXcgKz0gcHJlZml4O1xuXG4gICAgbGV0IGNpdGF0aW9uTnVtYmVyID0gMTtcbiAgICBmb3IgKGNvbnN0IHJlc3VsdCBvZiByZXN1bHRzKSB7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUocmVzdWx0LmZpbGVQYXRoKTtcbiAgICAgIGNvbnN0IGNpdGF0aW9uTGFiZWwgPSBgQ2l0YXRpb24gJHtjaXRhdGlvbk51bWJlcn0gKGZyb20gJHtmaWxlTmFtZX0sIHNjb3JlOiAke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfSk6IGA7XG4gICAgICBwcm9jZXNzZWRDb250ZW50ICs9IGBcXG4ke2NpdGF0aW9uTGFiZWx9XCIke3Jlc3VsdC50ZXh0fVwiXFxuXFxuYDtcbiAgICAgIHByb2Nlc3NlZFByZXZpZXcgKz0gYFxcbiR7Y2l0YXRpb25MYWJlbH1cIiR7c3VtbWFyaXplVGV4dChyZXN1bHQudGV4dCl9XCJcXG5cXG5gO1xuICAgICAgY2l0YXRpb25OdW1iZXIrKztcbiAgICB9XG5cbiAgICAvLyBBZGQgY2l0YXRpb25zIHRvIExNIFN0dWRpbydzIGNpdGF0aW9uIHN5c3RlbVxuICAgIC8vIE5vdGU6IFRoaXMgd291bGQgcmVxdWlyZSBhZGFwdGluZyB0aGUgcmVzdWx0cyB0byB0aGUgZXhwZWN0ZWQgZm9ybWF0XG4gICAgLy8gVGhlIGNpdGF0aW9uIHN5c3RlbSBleHBlY3RzIHNwZWNpZmljIHN0cnVjdHVyZSBmcm9tIHRoZSByZXRyaWV2YWwgQVBJXG4gICAgLy8gRm9yIG5vdywgd2UnbGwganVzdCBpbmplY3QgdGhlIHRleHQgY29udGVudFxuXG4gICAgY29uc3Qgc3VmZml4ID1cbiAgICAgIGBVc2UgdGhlIGNpdGF0aW9ucyBhYm92ZSB0byByZXNwb25kIHRvIHRoZSB1c2VyIHF1ZXJ5LCBvbmx5IGlmIHRoZXkgYXJlIHJlbGV2YW50LiBgICtcbiAgICAgIGBPdGhlcndpc2UsIHJlc3BvbmQgdG8gdGhlIGJlc3Qgb2YgeW91ciBhYmlsaXR5IHdpdGhvdXQgdGhlbS5gICtcbiAgICAgIGBcXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7dXNlclByb21wdH1gO1xuICAgIHByb2Nlc3NlZENvbnRlbnQgKz0gc3VmZml4O1xuICAgIHByb2Nlc3NlZFByZXZpZXcgKz0gc3VmZml4O1xuXG4gICAgY3RsLmRlYnVnKFwiUHJvY2Vzc2VkIGNvbnRlbnQgKHByZXZpZXcpOlwiLCBwcm9jZXNzZWRQcmV2aWV3KTtcblxuICAgIGNvbnN0IHBhc3NhZ2VzTG9nRW50cmllcyA9IHJlc3VsdHMubWFwKChyZXN1bHQsIGlkeCkgPT4ge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCk7XG4gICAgICByZXR1cm4gYCMke2lkeCArIDF9IGZpbGU9JHtmaWxlTmFtZX0gc2NvcmU9JHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX1cXG4ke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfWA7XG4gICAgfSk7XG4gICAgY29uc3QgcGFzc2FnZXNMb2cgPSBwYXNzYWdlc0xvZ0VudHJpZXMuam9pbihcIlxcblxcblwiKTtcblxuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gUkFHIHBhc3NhZ2VzICgke3Jlc3VsdHMubGVuZ3RofSkgcHJldmlldzpcXG4ke3Bhc3NhZ2VzTG9nfWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBSQUcgcGFzc2FnZXMgKCR7cmVzdWx0cy5sZW5ndGh9KTpgLFxuICAgIH0pO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgcGFzc2FnZXNMb2dFbnRyaWVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogZW50cnksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIEZpbmFsIHByb21wdCBzZW50IHRvIG1vZGVsIChwcmV2aWV3KTpcXG4ke3Byb2Nlc3NlZFByZXZpZXd9YCk7XG4gICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogYEZpbmFsIHByb21wdCBzZW50IHRvIG1vZGVsIChwcmV2aWV3KTpcXG4ke3Byb2Nlc3NlZFByZXZpZXd9YCxcbiAgICB9KTtcblxuICAgIGF3YWl0IHdhcm5JZkNvbnRleHRPdmVyZmxvdyhjdGwsIHByb2Nlc3NlZENvbnRlbnQpO1xuXG4gICAgcmV0dXJuIHByb2Nlc3NlZENvbnRlbnQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIltQcm9tcHRQcmVwcm9jZXNzb3JdIFByZXByb2Nlc3NpbmcgZmFpbGVkLlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIHVzZXJNZXNzYWdlO1xuICB9XG59XG5cbmludGVyZmFjZSBDb25maWdSZWluZGV4T3B0cyB7XG4gIGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcjtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIHBhcnNlRGVsYXlNczogbnVtYmVyO1xuICByZWluZGV4UmVxdWVzdGVkOiBib29sZWFuO1xuICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IGJvb2xlYW47XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG1heWJlSGFuZGxlQ29uZmlnVHJpZ2dlcmVkUmVpbmRleCh7XG4gIGN0bCxcbiAgZG9jdW1lbnRzRGlyLFxuICB2ZWN0b3JTdG9yZURpcixcbiAgY2h1bmtTaXplLFxuICBjaHVua092ZXJsYXAsXG4gIG1heENvbmN1cnJlbnQsXG4gIGVuYWJsZU9DUixcbiAgcGFyc2VEZWxheU1zLFxuICByZWluZGV4UmVxdWVzdGVkLFxuICBza2lwUHJldmlvdXNseUluZGV4ZWQsXG59OiBDb25maWdSZWluZGV4T3B0cykge1xuICBpZiAoIXJlaW5kZXhSZXF1ZXN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCByZW1pbmRlclRleHQgPVxuICAgIGBNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcyBpcyBjdXJyZW50bHkgJHtza2lwUHJldmlvdXNseUluZGV4ZWQgPyBcIk9OXCIgOiBcIk9GRlwifS4gYCArXG4gICAgXCJUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiO1xuICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7cmVtaW5kZXJUZXh0fWApO1xuICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgIHRleHQ6IHJlbWluZGVyVGV4dCxcbiAgfSk7XG5cbiAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiY29uZmlnLXRyaWdnZXJcIikpIHtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBhbHJlYWR5IHJ1bm5pbmcuIFBsZWFzZSB3YWl0IGZvciBpdCB0byBmaW5pc2guXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IHJlcXVlc3RlZCBmcm9tIGNvbmZpZy4uLlwiLFxuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgaW5kZXhpbmdSZXN1bHQgfSA9IGF3YWl0IHJ1bkluZGV4aW5nSm9iKHtcbiAgICAgIGNsaWVudDogY3RsLmNsaWVudCxcbiAgICAgIGFib3J0U2lnbmFsOiBjdGwuYWJvcnRTaWduYWwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBhdXRvUmVpbmRleDogc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgZm9yY2VSZWluZGV4OiAhc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgdmVjdG9yU3RvcmU6IHZlY3RvclN0b3JlID8/IHVuZGVmaW5lZCxcbiAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcInNjYW5uaW5nXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IHByb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwO1xuICAgICAgICAgIGNvbnN0IGZhaWxlZCA9IHByb2dyZXNzLmZhaWxlZEZpbGVzID8/IDA7XG4gICAgICAgICAgY29uc3Qgc2tpcHBlZCA9IHByb2dyZXNzLnNraXBwZWRGaWxlcyA/PyAwO1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nOiAke3Byb2dyZXNzLnByb2Nlc3NlZEZpbGVzfS8ke3Byb2dyZXNzLnRvdGFsRmlsZXN9IGZpbGVzIGAgK1xuICAgICAgICAgICAgICBgKHN1Y2Nlc3M9JHtzdWNjZXNzfSwgZmFpbGVkPSR7ZmFpbGVkfSwgc2tpcHBlZD0ke3NraXBwZWR9KSBgICtcbiAgICAgICAgICAgICAgYCgke3Byb2dyZXNzLmN1cnJlbnRGaWxlfSlgLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJjb21wbGV0ZVwiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgY29tcGxldGU6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9IGZpbGVzIHByb2Nlc3NlZGAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgZXJyb3I6ICR7cHJvZ3Jlc3MuZXJyb3J9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZSFcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN1bW1hcnlMaW5lcyA9IFtcbiAgICAgIGBQcm9jZXNzZWQ6ICR7aW5kZXhpbmdSZXN1bHQuc3VjY2Vzc2Z1bEZpbGVzfS8ke2luZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXN9YCxcbiAgICAgIGBGYWlsZWQ6ICR7aW5kZXhpbmdSZXN1bHQuZmFpbGVkRmlsZXN9YCxcbiAgICAgIGBTa2lwcGVkICh1bmNoYW5nZWQpOiAke2luZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlc31gLFxuICAgICAgYFVwZGF0ZWQgZXhpc3RpbmcgZmlsZXM6ICR7aW5kZXhpbmdSZXN1bHQudXBkYXRlZEZpbGVzfWAsXG4gICAgICBgTmV3IGZpbGVzIGFkZGVkOiAke2luZGV4aW5nUmVzdWx0Lm5ld0ZpbGVzfWAsXG4gICAgXTtcbiAgICBmb3IgKGNvbnN0IGxpbmUgb2Ygc3VtbWFyeUxpbmVzKSB7XG4gICAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgdGV4dDogbGluZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzID4gMCAmJiBpbmRleGluZ1Jlc3VsdC5za2lwcGVkRmlsZXMgPT09IGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIkFsbCBmaWxlcyB3ZXJlIGFscmVhZHkgdXAgdG8gZGF0ZSAoc2tpcHBlZCkuXCIsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBzdW1tYXJ5OlxcbiAgJHtzdW1tYXJ5TGluZXMuam9pbihcIlxcbiAgXCIpfWAsXG4gICAgKTtcblxuICAgIGF3YWl0IG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgdGV4dDogYE1hbnVhbCByZWluZGV4IGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICB9KTtcbiAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR10gTWFudWFsIHJlaW5kZXggZmFpbGVkOlwiLCBlcnJvcik7XG4gIH0gZmluYWxseSB7XG4gICAgZmluaXNoSW5kZXhpbmcoKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBub3RpZnlNYW51YWxSZXNldE5lZWRlZChjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjdGwuY2xpZW50LnN5c3RlbS5ub3RpZnkoe1xuICAgICAgdGl0bGU6IFwiTWFudWFsIHJlaW5kZXggY29tcGxldGVkXCIsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgXCJNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiLFxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIFVuYWJsZSB0byBzZW5kIG5vdGlmaWNhdGlvbiBhYm91dCBtYW51YWwgcmVpbmRleCByZXNldDpcIiwgZXJyb3IpO1xuICB9XG59XG5cblxuIiwgImltcG9ydCB7IHR5cGUgUGx1Z2luQ29udGV4dCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBwcmVwcm9jZXNzIH0gZnJvbSBcIi4vcHJvbXB0UHJlcHJvY2Vzc29yXCI7XG5cbi8qKlxuICogTWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIEJpZyBSQUcgcGx1Z2luLlxuICogVGhpcyBwbHVnaW4gaW5kZXhlcyBsYXJnZSBkb2N1bWVudCBjb2xsZWN0aW9ucyBhbmQgcHJvdmlkZXMgUkFHIGNhcGFiaWxpdGllcy5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1haW4oY29udGV4dDogUGx1Z2luQ29udGV4dCkge1xuICAvLyBSZWdpc3RlciB0aGUgY29uZmlndXJhdGlvbiBzY2hlbWF0aWNzXG4gIGNvbnRleHQud2l0aENvbmZpZ1NjaGVtYXRpY3MoY29uZmlnU2NoZW1hdGljcyk7XG4gIFxuICAvLyBSZWdpc3RlciB0aGUgcHJvbXB0IHByZXByb2Nlc3NvclxuICBjb250ZXh0LndpdGhQcm9tcHRQcmVwcm9jZXNzb3IocHJlcHJvY2Vzcyk7XG4gIFxuICBjb25zb2xlLmxvZyhcIltCaWdSQUddIFBsdWdpbiBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHlcIik7XG59XG5cbiIsICJpbXBvcnQgeyBMTVN0dWRpb0NsaWVudCwgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcblxuZGVjbGFyZSB2YXIgcHJvY2VzczogYW55O1xuXG4vLyBXZSByZWNlaXZlIHJ1bnRpbWUgaW5mb3JtYXRpb24gaW4gdGhlIGVudmlyb25tZW50IHZhcmlhYmxlcy5cbmNvbnN0IGNsaWVudElkZW50aWZpZXIgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0NMSUVOVF9JREVOVElGSUVSO1xuY29uc3QgY2xpZW50UGFzc2tleSA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX1BBU1NLRVk7XG5jb25zdCBiYXNlVXJsID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9CQVNFX1VSTDtcblxuY29uc3QgY2xpZW50ID0gbmV3IExNU3R1ZGlvQ2xpZW50KHtcbiAgY2xpZW50SWRlbnRpZmllcixcbiAgY2xpZW50UGFzc2tleSxcbiAgYmFzZVVybCxcbn0pO1xuXG4oZ2xvYmFsVGhpcyBhcyBhbnkpLl9fTE1TX1BMVUdJTl9DT05URVhUID0gdHJ1ZTtcblxubGV0IHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IGZhbHNlO1xubGV0IHByb21wdFByZXByb2Nlc3NvclNldCA9IGZhbHNlO1xubGV0IGNvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCBnbG9iYWxDb25maWdTY2hlbWF0aWNzU2V0ID0gZmFsc2U7XG5sZXQgdG9vbHNQcm92aWRlclNldCA9IGZhbHNlO1xubGV0IGdlbmVyYXRvclNldCA9IGZhbHNlO1xuXG5jb25zdCBzZWxmUmVnaXN0cmF0aW9uSG9zdCA9IGNsaWVudC5wbHVnaW5zLmdldFNlbGZSZWdpc3RyYXRpb25Ib3N0KCk7XG5cbmNvbnN0IHBsdWdpbkNvbnRleHQ6IFBsdWdpbkNvbnRleHQgPSB7XG4gIHdpdGhQcmVkaWN0aW9uTG9vcEhhbmRsZXI6IChnZW5lcmF0ZSkgPT4ge1xuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcmVkaWN0aW9uTG9vcEhhbmRsZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHRvb2xzIHByb3ZpZGVyXCIpO1xuICAgIH1cblxuICAgIHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJlZGljdGlvbkxvb3BIYW5kbGVyKGdlbmVyYXRlKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFByb21wdFByZXByb2Nlc3NvcjogKHByZXByb2Nlc3MpID0+IHtcbiAgICBpZiAocHJvbXB0UHJlcHJvY2Vzc29yU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQcm9tcHRQcmVwcm9jZXNzb3IgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBwcm9tcHRQcmVwcm9jZXNzb3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aENvbmZpZ1NjaGVtYXRpY3M6IChjb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGNvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgY29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0Q29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdsb2JhbENvbmZpZ1NjaGVtYXRpY3M6IChnbG9iYWxDb25maWdTY2hlbWF0aWNzKSA9PiB7XG4gICAgaWYgKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdsb2JhbCBjb25maWcgc2NoZW1hdGljcyBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdsb2JhbENvbmZpZ1NjaGVtYXRpY3MoZ2xvYmFsQ29uZmlnU2NoZW1hdGljcyk7XG4gICAgcmV0dXJuIHBsdWdpbkNvbnRleHQ7XG4gIH0sXG4gIHdpdGhUb29sc1Byb3ZpZGVyOiAodG9vbHNQcm92aWRlcikgPT4ge1xuICAgIGlmICh0b29sc1Byb3ZpZGVyU2V0KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb29scyBwcm92aWRlciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIGlmIChwcmVkaWN0aW9uTG9vcEhhbmRsZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGNhbm5vdCBiZSB1c2VkIHdpdGggYSBwcmVkaWN0aW9uTG9vcEhhbmRsZXJcIik7XG4gICAgfVxuXG4gICAgdG9vbHNQcm92aWRlclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0VG9vbHNQcm92aWRlcih0b29sc1Byb3ZpZGVyKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aEdlbmVyYXRvcjogKGdlbmVyYXRvcikgPT4ge1xuICAgIGlmIChnZW5lcmF0b3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdlbmVyYXRvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuXG4gICAgZ2VuZXJhdG9yU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRHZW5lcmF0b3IoZ2VuZXJhdG9yKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbn07XG5cbmltcG9ydChcIi4vLi4vc3JjL2luZGV4LnRzXCIpLnRoZW4oYXN5bmMgbW9kdWxlID0+IHtcbiAgcmV0dXJuIGF3YWl0IG1vZHVsZS5tYWluKHBsdWdpbkNvbnRleHQpO1xufSkudGhlbigoKSA9PiB7XG4gIHNlbGZSZWdpc3RyYXRpb25Ib3N0LmluaXRDb21wbGV0ZWQoKTtcbn0pLmNhdGNoKChlcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGV4ZWN1dGUgdGhlIG1haW4gZnVuY3Rpb24gb2YgdGhlIHBsdWdpbi5cIik7XG4gIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdCQUVhO0FBRmI7QUFBQTtBQUFBO0FBQUEsaUJBQXVDO0FBRWhDLElBQU0sdUJBQW1CLG1DQUF1QixFQUNwRDtBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixhQUFhO0FBQUEsTUFDZjtBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxJQUFJLE1BQU0sRUFBRTtBQUFBLE1BQ3JDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBSyxLQUFLLEdBQUssTUFBTSxLQUFLO0FBQUEsTUFDM0M7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxLQUFLLEtBQUssTUFBTSxNQUFNLElBQUk7QUFBQSxNQUMzQztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxRQUNMLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxRQUNWLFFBQVEsRUFBRSxLQUFLLEdBQUcsS0FBSyxLQUFLLE1BQU0sR0FBRztBQUFBLE1BQ3ZDO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsS0FBSztBQUFBLFFBQ0wsYUFBYTtBQUFBLFFBQ2IsVUFBVTtBQUFBLFFBQ1YsUUFBUSxFQUFFLEtBQUssR0FBRyxLQUFLLElBQUksTUFBTSxFQUFFO0FBQUEsTUFDckM7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixRQUFRLEVBQUUsS0FBSyxHQUFHLEtBQUssS0FBTSxNQUFNLElBQUk7QUFBQSxNQUN6QztBQUFBLE1BQ0E7QUFBQSxJQUNGLEVBQ0M7QUFBQSxNQUNDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxRQUNFLGFBQWE7QUFBQSxRQUNiLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQztBQUFBLE1BQ0M7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLFFBQ0UsYUFBYTtBQUFBLFFBQ2IsVUFDRTtBQUFBLE1BQ0o7QUFBQSxNQUNBO0FBQUEsSUFDRixFQUNDO0FBQUEsTUFDQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsUUFDRSxhQUFhO0FBQUEsUUFDYixVQUFVO0FBQUEsUUFDVixjQUFjO0FBQUEsVUFDWjtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsV0FBVyxFQUFFLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFBQSxVQUMzQztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQTtBQUFBLElBQ0YsRUFDQyxNQUFNO0FBQUE7QUFBQTs7O0FDdElULG1CQUNBLE1BQ0EsSUFzQmE7QUF4QmI7QUFBQTtBQUFBO0FBQUEsb0JBQTJCO0FBQzNCLFdBQXNCO0FBQ3RCLFNBQW9CO0FBc0JiLElBQU0sY0FBTixNQUFrQjtBQUFBLE1BTXZCLFlBQVksUUFBZ0I7QUFMNUIsYUFBUSxRQUEyQjtBQUduQyxhQUFRLGNBQTZCLFFBQVEsUUFBUTtBQUduRCxhQUFLLFNBQWMsYUFBUSxNQUFNO0FBQ2pDLGFBQUssWUFBWSxLQUFLO0FBQUEsTUFDeEI7QUFBQSxNQUVBLE1BQWMsbUJBQW9DO0FBQ2hELFlBQUksTUFBTSxLQUFLLGtCQUFrQixLQUFLLE1BQU0sR0FBRztBQUM3QyxpQkFBTyxLQUFLO0FBQUEsUUFDZDtBQUVBLGNBQU0sbUJBQXdCLFVBQUssS0FBSyxRQUFRLGNBQWM7QUFDOUQsWUFBSSxNQUFNLEtBQUssa0JBQWtCLGdCQUFnQixHQUFHO0FBQ2xELGlCQUFPO0FBQUEsUUFDVDtBQUVBLGNBQU0sZ0JBQWdCLEtBQUssT0FBTyxRQUFRLFdBQVcsRUFBRTtBQUN2RCxZQUFTLGNBQVMsYUFBYSxNQUFNLGdCQUFnQjtBQUNuRCxpQkFBTyxLQUFLO0FBQUEsUUFDZDtBQUVBLGVBQU87QUFBQSxNQUNUO0FBQUEsTUFFQSxNQUFjLGtCQUFrQixXQUFxQztBQUNuRSxZQUFJO0FBQ0YsZ0JBQU0sWUFBaUIsVUFBSyxXQUFXLFlBQVk7QUFDbkQsZ0JBQVMsWUFBUyxPQUFPLFNBQVM7QUFDbEMsaUJBQU87QUFBQSxRQUNULFFBQVE7QUFDTixpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLQSxNQUFNLGFBQTRCO0FBQ2hDLFlBQUk7QUFDRixlQUFLLFlBQVksTUFBTSxLQUFLLGlCQUFpQjtBQUc3QyxnQkFBUyxZQUFTLE1BQU0sS0FBSyxXQUFXLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFHM0QsZUFBSyxRQUFRLElBQUkseUJBQVcsS0FBSyxTQUFTO0FBRzFDLGNBQUksQ0FBRSxNQUFNLEtBQUssTUFBTSxlQUFlLEdBQUk7QUFDeEMsa0JBQU0sS0FBSyxNQUFNLFlBQVk7QUFBQSxVQUMvQjtBQUVBLGtCQUFRLElBQUksdUNBQXVDO0FBQUEsUUFDckQsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSxvQ0FBb0MsS0FBSztBQUN2RCxnQkFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQU1BLE1BQU0sVUFBVSxRQUF3QztBQUN0RCxZQUFJLENBQUMsS0FBSyxPQUFPO0FBQ2YsZ0JBQU0sSUFBSSxNQUFNLDhCQUE4QjtBQUFBLFFBQ2hEO0FBRUEsWUFBSSxPQUFPLFdBQVcsR0FBRztBQUN2QjtBQUFBLFFBQ0Y7QUFHQSxhQUFLLGNBQWMsS0FBSyxZQUFZLEtBQUssWUFBWTtBQUNyRCxjQUFJO0FBRUEsa0JBQU0sS0FBSyxNQUFPLFlBQVk7QUFFaEMsdUJBQVcsU0FBUyxRQUFRO0FBQ3hCLG9CQUFNLEtBQUssTUFBTyxXQUFXO0FBQUEsZ0JBQzdCLElBQUksTUFBTTtBQUFBLGdCQUNWLFFBQVEsTUFBTTtBQUFBLGdCQUNkLFVBQVU7QUFBQSxrQkFDUixNQUFNLE1BQU07QUFBQSxrQkFDWixVQUFVLE1BQU07QUFBQSxrQkFDaEIsVUFBVSxNQUFNO0FBQUEsa0JBQ2hCLFVBQVUsTUFBTTtBQUFBLGtCQUNoQixZQUFZLE1BQU07QUFBQSxrQkFDbEIsR0FBRyxNQUFNO0FBQUEsZ0JBQ1g7QUFBQSxjQUNGLENBQUM7QUFBQSxZQUNIO0FBR0Usa0JBQU0sS0FBSyxNQUFPLFVBQVU7QUFFOUIsb0JBQVEsSUFBSSxTQUFTLE9BQU8sTUFBTSx5QkFBeUI7QUFBQSxVQUM3RCxTQUFTLE9BQU87QUFDZCxvQkFBUSxNQUFNLHdDQUF3QyxLQUFLO0FBRXpELGdCQUFJO0FBQ0Ysb0JBQU0sS0FBSyxNQUFPLFVBQVU7QUFBQSxZQUM5QixTQUFTLEdBQUc7QUFBQSxZQUVaO0FBQ0Ysa0JBQU07QUFBQSxVQUNSO0FBQUEsUUFDQSxDQUFDO0FBR0QsZUFBTyxLQUFLO0FBQUEsTUFDZDtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BS0EsTUFBTSxPQUNKLGFBQ0EsUUFBZ0IsR0FDaEIsWUFBb0IsS0FDSztBQUN6QixZQUFJLENBQUMsS0FBSyxPQUFPO0FBQ2Ysa0JBQVEsSUFBSSwrQkFBK0I7QUFDM0MsaUJBQU8sQ0FBQztBQUFBLFFBQ1Y7QUFFQSxZQUFJO0FBQ0YsZ0JBQU0sVUFBVSxNQUFNLEtBQUssTUFBTSxXQUFXLGFBQWEsS0FBSztBQUU5RCxpQkFBTyxRQUNKLE9BQU8sQ0FBQyxXQUFXLE9BQU8sU0FBUyxTQUFTLEVBQzVDLElBQUksQ0FBQyxZQUFZO0FBQUEsWUFDaEIsTUFBTSxPQUFPLEtBQUssU0FBUztBQUFBLFlBQzNCLE9BQU8sT0FBTztBQUFBLFlBQ2QsVUFBVSxPQUFPLEtBQUssU0FBUztBQUFBLFlBQy9CLFVBQVUsT0FBTyxLQUFLLFNBQVM7QUFBQSxZQUMvQixZQUFZLE9BQU8sS0FBSyxTQUFTO0FBQUEsWUFDakMsVUFBVSxPQUFPLEtBQUs7QUFBQSxVQUN4QixFQUFFO0FBQUEsUUFDTixTQUFTLE9BQU87QUFDZCxrQkFBUSxNQUFNLGlDQUFpQyxLQUFLO0FBQ3BELGlCQUFPLENBQUM7QUFBQSxRQUNWO0FBQUEsTUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFNQSxNQUFNLGlCQUFpQixVQUFpQztBQUN0RCxZQUFJLENBQUMsS0FBSyxPQUFPO0FBQ2Y7QUFBQSxRQUNGO0FBR0EsYUFBSyxjQUFjLEtBQUssWUFBWSxLQUFLLFlBQVk7QUFDckQsY0FBSTtBQUNBLGtCQUFNLEtBQUssTUFBTyxZQUFZO0FBRzlCLGtCQUFNLFdBQVcsTUFBTSxLQUFLLE1BQU8sVUFBVTtBQUUvQyx1QkFBVyxRQUFRLFVBQVU7QUFDM0Isa0JBQUksS0FBSyxTQUFTLGFBQWEsVUFBVTtBQUNyQyxzQkFBTSxLQUFLLE1BQU8sV0FBVyxLQUFLLEVBQUU7QUFBQSxjQUN4QztBQUFBLFlBQ0Y7QUFFRSxrQkFBTSxLQUFLLE1BQU8sVUFBVTtBQUU5QixvQkFBUSxJQUFJLGlDQUFpQyxRQUFRLEVBQUU7QUFBQSxVQUN6RCxTQUFTLE9BQU87QUFDZCxvQkFBUSxNQUFNLHVDQUF1QyxRQUFRLEtBQUssS0FBSztBQUVyRSxnQkFBSTtBQUNGLG9CQUFNLEtBQUssTUFBTyxVQUFVO0FBQUEsWUFDOUIsU0FBUyxHQUFHO0FBQUEsWUFFWjtBQUFBLFVBQ0Y7QUFBQSxRQUNGLENBQUM7QUFFRCxlQUFPLEtBQUs7QUFBQSxNQUNkO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLQSxNQUFNLFFBQVEsVUFBb0M7QUFDaEQsWUFBSSxDQUFDLEtBQUssT0FBTztBQUNmLGlCQUFPO0FBQUEsUUFDVDtBQUVBLFlBQUk7QUFDRixnQkFBTSxXQUFXLE1BQU0sS0FBSyxNQUFNLFVBQVU7QUFFNUMsaUJBQU8sU0FBUyxLQUFLLENBQUMsU0FBUyxLQUFLLFNBQVMsYUFBYSxRQUFRO0FBQUEsUUFDcEUsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSw0QkFBNEIsUUFBUSxLQUFLLEtBQUs7QUFDNUQsaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BS0EsTUFBTSx1QkFBMEQ7QUFDOUQsY0FBTSxZQUFZLG9CQUFJLElBQXlCO0FBQy9DLFlBQUksQ0FBQyxLQUFLLE9BQU87QUFDZixpQkFBTztBQUFBLFFBQ1Q7QUFFQSxZQUFJO0FBQ0YsZ0JBQU0sV0FBVyxNQUFNLEtBQUssTUFBTSxVQUFVO0FBQzVDLHFCQUFXLFFBQVEsVUFBVTtBQUMzQixrQkFBTSxXQUFXLEtBQUssU0FBUztBQUMvQixrQkFBTSxXQUFXLEtBQUssU0FBUztBQUMvQixnQkFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVO0FBQzFCO0FBQUEsWUFDRjtBQUNBLGdCQUFJLFNBQVMsVUFBVSxJQUFJLFFBQVE7QUFDbkMsZ0JBQUksQ0FBQyxRQUFRO0FBQ1gsdUJBQVMsb0JBQUksSUFBWTtBQUN6Qix3QkFBVSxJQUFJLFVBQVUsTUFBTTtBQUFBLFlBQ2hDO0FBQ0EsbUJBQU8sSUFBSSxRQUFRO0FBQUEsVUFDckI7QUFDQSxpQkFBTztBQUFBLFFBQ1QsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSx1Q0FBdUMsS0FBSztBQUMxRCxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLQSxNQUFNLFdBQWtFO0FBQ3RFLFlBQUksQ0FBQyxLQUFLLE9BQU87QUFDZixpQkFBTyxFQUFFLGFBQWEsR0FBRyxhQUFhLEVBQUU7QUFBQSxRQUMxQztBQUVBLFlBQUk7QUFDRixnQkFBTSxXQUFXLE1BQU0sS0FBSyxNQUFNLFVBQVU7QUFDNUMsZ0JBQU0sZUFBZSxJQUFJO0FBQUEsWUFDdkIsU0FBUyxJQUFJLENBQUMsU0FBUyxLQUFLLFNBQVMsUUFBa0I7QUFBQSxVQUN6RDtBQUVBLGlCQUFPO0FBQUEsWUFDTCxhQUFhLFNBQVM7QUFBQSxZQUN0QixhQUFhLGFBQWE7QUFBQSxVQUM1QjtBQUFBLFFBQ0YsU0FBUyxPQUFPO0FBQ2Qsa0JBQVEsTUFBTSx3QkFBd0IsS0FBSztBQUMzQyxpQkFBTyxFQUFFLGFBQWEsR0FBRyxhQUFhLEVBQUU7QUFBQSxRQUMxQztBQUFBLE1BQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtBLE1BQU0sUUFBdUI7QUFFM0IsYUFBSyxRQUFRO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFBQTtBQUFBOzs7QUMxUkEsZUFBc0Isb0JBQ3BCLGNBQ0EsZ0JBQzRCO0FBQzVCLFFBQU0sV0FBcUIsQ0FBQztBQUM1QixRQUFNLFNBQW1CLENBQUM7QUFHMUIsTUFBSTtBQUNGLFVBQVMsYUFBUyxPQUFPLGNBQWlCLGNBQVUsSUFBSTtBQUFBLEVBQzFELFFBQVE7QUFDTixXQUFPLEtBQUssMERBQTBELFlBQVksRUFBRTtBQUFBLEVBQ3RGO0FBRUEsTUFBSTtBQUNGLFVBQVMsYUFBUyxPQUFPLGdCQUFtQixjQUFVLElBQUk7QUFBQSxFQUM1RCxRQUFRO0FBRU4sUUFBSTtBQUNGLFlBQVMsYUFBUyxNQUFNLGdCQUFnQixFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQUEsSUFDN0QsUUFBUTtBQUNOLGFBQU87QUFBQSxRQUNMLGdFQUFnRSxjQUFjO0FBQUEsTUFDaEY7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUdBLE1BQUk7QUFDRixVQUFNLFFBQVEsTUFBUyxhQUFTLE9BQU8sY0FBYztBQUNyRCxVQUFNLGNBQWUsTUFBTSxTQUFTLE1BQU0sU0FBVSxPQUFPLE9BQU87QUFFbEUsUUFBSSxjQUFjLEdBQUc7QUFDbkIsYUFBTyxLQUFLLGtDQUFrQyxZQUFZLFFBQVEsQ0FBQyxDQUFDLEtBQUs7QUFBQSxJQUMzRSxXQUFXLGNBQWMsSUFBSTtBQUMzQixlQUFTLEtBQUssNkJBQTZCLFlBQVksUUFBUSxDQUFDLENBQUMsS0FBSztBQUFBLElBQ3hFO0FBQUEsRUFDRixTQUFTLE9BQU87QUFDZCxhQUFTLEtBQUssc0NBQXNDO0FBQUEsRUFDdEQ7QUFHQSxRQUFNLGVBQWtCLFdBQVEsS0FBSyxPQUFPLE9BQU87QUFDbkQsUUFBTSxnQkFBbUIsWUFBUyxLQUFLLE9BQU8sT0FBTztBQUNyRCxRQUFNLGVBQWUsUUFBUSxhQUFhO0FBQzFDLFFBQU0sbUJBQ0osb0JBQW9CLGFBQWEsUUFBUSxDQUFDLENBQUMsVUFBVSxjQUFjLFFBQVEsQ0FBQyxDQUFDO0FBRS9FLFFBQU0sdUJBQ0oseUJBQXlCLGFBQWEsUUFBUSxDQUFDLENBQUMsV0FDL0MsZUFDRyx1R0FDQTtBQUVOLE1BQUksZUFBZSxLQUFLO0FBQ3RCLFFBQUksY0FBYztBQUNoQixlQUFTLEtBQUssb0JBQW9CO0FBQUEsSUFDcEMsT0FBTztBQUNMLGFBQU8sS0FBSyx5QkFBeUIsYUFBYSxRQUFRLENBQUMsQ0FBQyxLQUFLO0FBQUEsSUFDbkU7QUFBQSxFQUNGLFdBQVcsZUFBZSxHQUFHO0FBQzNCLGFBQVMsS0FBSyxnQkFBZ0I7QUFBQSxFQUNoQztBQUdBLE1BQUk7QUFDRixVQUFNLGFBQWEsTUFBTSxzQkFBc0IsWUFBWTtBQUMzRCxVQUFNLGNBQWMsY0FBYyxPQUFPLE9BQU87QUFFaEQsUUFBSSxjQUFjLEtBQUs7QUFDckIsZUFBUztBQUFBLFFBQ1AsOEJBQThCLFlBQVksUUFBUSxDQUFDLENBQUM7QUFBQSxNQUN0RDtBQUFBLElBQ0YsV0FBVyxjQUFjLElBQUk7QUFDM0IsZUFBUztBQUFBLFFBQ1AscUNBQXFDLFlBQVksUUFBUSxDQUFDLENBQUM7QUFBQSxNQUM3RDtBQUFBLElBQ0Y7QUFBQSxFQUNGLFNBQVMsT0FBTztBQUNkLGFBQVMsS0FBSyxtQ0FBbUM7QUFBQSxFQUNuRDtBQUdBLE1BQUk7QUFDRixVQUFNLFFBQVEsTUFBUyxhQUFTLFFBQVEsY0FBYztBQUN0RCxRQUFJLE1BQU0sU0FBUyxHQUFHO0FBQ3BCLGVBQVM7QUFBQSxRQUNQO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLFFBQVE7QUFBQSxFQUVSO0FBRUEsU0FBTztBQUFBLElBQ0wsUUFBUSxPQUFPLFdBQVc7QUFBQSxJQUMxQjtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQ0Y7QUFNQSxlQUFlLHNCQUFzQixLQUFhLGFBQXFCLEtBQXNCO0FBQzNGLE1BQUksWUFBWTtBQUNoQixNQUFJLFlBQVk7QUFDaEIsTUFBSSxjQUFjO0FBQ2xCLE1BQUksZUFBZTtBQUVuQixpQkFBZSxLQUFLLFlBQW1DO0FBQ3JELFFBQUksZ0JBQWdCLFlBQVk7QUFDOUI7QUFBQSxJQUNGO0FBRUEsUUFBSTtBQUNGLFlBQU0sVUFBVSxNQUFTLGFBQVMsUUFBUSxZQUFZLEVBQUUsZUFBZSxLQUFLLENBQUM7QUFFN0UsaUJBQVcsU0FBUyxTQUFTO0FBQzNCLFlBQUksZ0JBQWdCLFlBQVk7QUFDOUI7QUFBQSxRQUNGO0FBRUEsY0FBTSxXQUFXLEdBQUcsVUFBVSxJQUFJLE1BQU0sSUFBSTtBQUU1QyxZQUFJLE1BQU0sWUFBWSxHQUFHO0FBQ3ZCLGdCQUFNLEtBQUssUUFBUTtBQUFBLFFBQ3JCLFdBQVcsTUFBTSxPQUFPLEdBQUc7QUFDekI7QUFFQSxjQUFJLGVBQWUsWUFBWTtBQUM3QixnQkFBSTtBQUNGLG9CQUFNLFFBQVEsTUFBUyxhQUFTLEtBQUssUUFBUTtBQUM3Qyw2QkFBZSxNQUFNO0FBQ3JCO0FBQUEsWUFDRixRQUFRO0FBQUEsWUFFUjtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsUUFBUTtBQUFBLElBRVI7QUFBQSxFQUNGO0FBRUEsUUFBTSxLQUFLLEdBQUc7QUFHZCxNQUFJLGVBQWUsS0FBSyxZQUFZLEdBQUc7QUFDckMsVUFBTSxjQUFjLGNBQWM7QUFDbEMsZ0JBQVksY0FBYztBQUFBLEVBQzVCO0FBRUEsU0FBTztBQUNUO0FBeEtBLElBQUFBLEtBQ0E7QUFEQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxNQUFvQjtBQUNwQixTQUFvQjtBQUFBO0FBQUE7OztBQ0tiLFNBQVMsaUJBQWlCLFVBQWtCLFdBQW9CO0FBQ3JFLE1BQUksb0JBQW9CO0FBQ3RCLFlBQVEsTUFBTSw4QkFBOEIsT0FBTyw2QkFBNkI7QUFDaEYsV0FBTztBQUFBLEVBQ1Q7QUFFQSx1QkFBcUI7QUFDckIsVUFBUSxNQUFNLDhCQUE4QixPQUFPLGFBQWE7QUFDaEUsU0FBTztBQUNUO0FBS08sU0FBUyxpQkFBdUI7QUFDckMsdUJBQXFCO0FBQ3JCLFVBQVEsTUFBTSx3Q0FBd0M7QUFDeEQ7QUF2QkEsSUFBSTtBQUFKO0FBQUE7QUFBQTtBQUFBLElBQUkscUJBQXFCO0FBQUE7QUFBQTs7O0FDMkJsQixTQUFTLGdCQUFnQixLQUFzQjtBQUNwRCxTQUFPLG1CQUFtQixJQUFJLElBQUksWUFBWSxDQUFDO0FBQ2pEO0FBRU8sU0FBUyxvQkFBb0IsS0FBc0I7QUFDeEQsU0FBTyx1QkFBdUIsSUFBSSxJQUFJLFlBQVksQ0FBQztBQUNyRDtBQUVPLFNBQVMscUJBQXFCLEtBQXNCO0FBQ3pELFNBQU8sbUJBQW1CLElBQUksSUFBSSxZQUFZLENBQUM7QUFDakQ7QUFFTyxTQUFTLG1CQUFtQixLQUFzQjtBQUN2RCxTQUFPLG9CQUFvQixHQUFHLEtBQUsscUJBQXFCLEdBQUc7QUFDN0Q7QUFFTyxTQUFTLDBCQUFvQztBQUNsRCxTQUFPLE1BQU0sS0FBSyxxQkFBcUIsT0FBTyxDQUFDLEVBQUUsS0FBSztBQUN4RDtBQTdDQSxJQUFNLGlCQUNBLHFCQUNBLGlCQUNBLGdCQUNBLGlCQUNBLGtCQUNBLG9CQUVBLHNCQVVPLHNCQUlBLG9CQUNBLHdCQUNBLG9CQUNBO0FBekJiO0FBQUE7QUFBQTtBQUFBLElBQU0sa0JBQWtCLENBQUMsUUFBUSxTQUFTLFFBQVE7QUFDbEQsSUFBTSxzQkFBc0IsQ0FBQyxPQUFPLGFBQWEsVUFBVSxRQUFRLFFBQVEsT0FBTztBQUNsRixJQUFNLGtCQUFrQixDQUFDLFFBQVEsT0FBTztBQUN4QyxJQUFNLGlCQUFpQixDQUFDLE1BQU07QUFDOUIsSUFBTSxrQkFBa0IsQ0FBQyxPQUFPO0FBQ2hDLElBQU0sbUJBQW1CLENBQUMsUUFBUSxRQUFRLFNBQVMsTUFBTTtBQUN6RCxJQUFNLHFCQUFxQixDQUFDLE1BQU07QUFFbEMsSUFBTSx1QkFBdUI7QUFBQSxNQUMzQjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFFTyxJQUFNLHVCQUF1QixJQUFJO0FBQUEsTUFDdEMscUJBQXFCLFFBQVEsQ0FBQyxVQUFVLE1BQU0sSUFBSSxDQUFDLFFBQVEsSUFBSSxZQUFZLENBQUMsQ0FBQztBQUFBLElBQy9FO0FBRU8sSUFBTSxxQkFBcUIsSUFBSSxJQUFJLGVBQWU7QUFDbEQsSUFBTSx5QkFBeUIsSUFBSSxJQUFJLG1CQUFtQjtBQUMxRCxJQUFNLHFCQUFxQixJQUFJLElBQUksZUFBZTtBQUNsRCxJQUFNLHNCQUFzQixJQUFJLElBQUksZ0JBQWdCO0FBQUE7QUFBQTs7O0FDTDNELGVBQXNCLGNBQ3BCLFNBQ0EsWUFDd0I7QUFDeEIsUUFBTSxRQUF1QixDQUFDO0FBQzlCLE1BQUksZUFBZTtBQUVuQixRQUFNLGlDQUFpQyx3QkFBd0IsRUFBRSxLQUFLLElBQUk7QUFDMUUsVUFBUSxJQUFJLG1DQUFtQyw4QkFBOEIsRUFBRTtBQUUvRSxpQkFBZSxLQUFLLEtBQTRCO0FBQzlDLFFBQUk7QUFDRixZQUFNLFVBQVUsTUFBUyxhQUFTLFFBQVEsS0FBSyxFQUFFLGVBQWUsS0FBSyxDQUFDO0FBRXRFLGlCQUFXLFNBQVMsU0FBUztBQUMzQixjQUFNLFdBQWdCLFdBQUssS0FBSyxNQUFNLElBQUk7QUFFMUMsWUFBSSxNQUFNLFlBQVksR0FBRztBQUN2QixnQkFBTSxLQUFLLFFBQVE7QUFBQSxRQUNyQixXQUFXLE1BQU0sT0FBTyxHQUFHO0FBQ3pCO0FBRUEsZ0JBQU0sTUFBVyxjQUFRLE1BQU0sSUFBSSxFQUFFLFlBQVk7QUFFakQsY0FBSSxxQkFBcUIsSUFBSSxHQUFHLEdBQUc7QUFDakMsa0JBQU0sUUFBUSxNQUFTLGFBQVMsS0FBSyxRQUFRO0FBQzdDLGtCQUFNLFdBQWdCLFlBQU8sUUFBUTtBQUVyQyxrQkFBTSxLQUFLO0FBQUEsY0FDVCxNQUFNO0FBQUEsY0FDTixNQUFNLE1BQU07QUFBQSxjQUNaLFdBQVc7QUFBQSxjQUNYO0FBQUEsY0FDQSxNQUFNLE1BQU07QUFBQSxjQUNaLE9BQU8sTUFBTTtBQUFBLFlBQ2YsQ0FBQztBQUFBLFVBQ0g7QUFFQSxjQUFJLGNBQWMsZUFBZSxRQUFRLEdBQUc7QUFDMUMsdUJBQVcsY0FBYyxNQUFNLE1BQU07QUFBQSxVQUN2QztBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixTQUFTLE9BQU87QUFDZCxjQUFRLE1BQU0sNEJBQTRCLEdBQUcsS0FBSyxLQUFLO0FBQUEsSUFDekQ7QUFBQSxFQUNGO0FBRUEsUUFBTSxLQUFLLE9BQU87QUFFbEIsTUFBSSxZQUFZO0FBQ2QsZUFBVyxjQUFjLE1BQU0sTUFBTTtBQUFBLEVBQ3ZDO0FBRUEsU0FBTztBQUNUO0FBM0VBLElBQUFDLEtBQ0FDLE9BQ0E7QUFGQTtBQUFBO0FBQUE7QUFBQSxJQUFBRCxNQUFvQjtBQUNwQixJQUFBQyxRQUFzQjtBQUN0QixXQUFzQjtBQUN0QjtBQUFBO0FBQUE7OztBQ0dBLGVBQXNCLFVBQVUsVUFBbUM7QUFDakUsTUFBSTtBQUNGLFVBQU0sVUFBVSxNQUFTLGFBQVMsU0FBUyxVQUFVLE9BQU87QUFDNUQsVUFBTSxJQUFZLGFBQUssT0FBTztBQUc5QixNQUFFLHlCQUF5QixFQUFFLE9BQU87QUFHcEMsVUFBTSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssS0FBSyxFQUFFLEtBQUs7QUFHeEMsV0FBTyxLQUNKLFFBQVEsUUFBUSxHQUFHLEVBQ25CLFFBQVEsUUFBUSxJQUFJLEVBQ3BCLEtBQUs7QUFBQSxFQUNWLFNBQVMsT0FBTztBQUNkLFlBQVEsTUFBTSwyQkFBMkIsUUFBUSxLQUFLLEtBQUs7QUFDM0QsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQTFCQSxhQUNBQztBQURBO0FBQUE7QUFBQTtBQUFBLGNBQXlCO0FBQ3pCLElBQUFBLE1BQW9CO0FBQUE7QUFBQTs7O0FDb0RwQixTQUFTLFVBQVUsTUFBc0I7QUFDdkMsU0FBTyxLQUNKLFFBQVEsUUFBUSxHQUFHLEVBQ25CLFFBQVEsUUFBUSxJQUFJLEVBQ3BCLEtBQUs7QUFDVjtBQU1BLGVBQWUsY0FBYztBQUMzQixNQUFJLENBQUMsZ0JBQWdCO0FBQ25CLHFCQUFpQixNQUFNLE9BQU8saUNBQWlDO0FBQUEsRUFDakU7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxlQUFlLGtCQUFrQixVQUFrQkMsU0FBOEM7QUFDL0YsUUFBTSxhQUFhO0FBQ25CLFFBQU0sV0FBVyxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUksS0FBSztBQUU5QyxXQUFTLFVBQVUsR0FBRyxXQUFXLFlBQVksV0FBVztBQUN0RCxRQUFJO0FBQ0YsWUFBTSxhQUFhLE1BQU1BLFFBQU8sTUFBTSxZQUFZLFFBQVE7QUFDMUQsWUFBTSxTQUFTLE1BQU1BLFFBQU8sTUFBTSxjQUFjLFlBQVk7QUFBQSxRQUMxRCxZQUFZLENBQUMsYUFBYTtBQUN4QixjQUFJLGFBQWEsS0FBSyxhQUFhLEdBQUc7QUFDcEMsb0JBQVE7QUFBQSxjQUNOLHVDQUF1QyxRQUFRLE1BQU0sV0FBVyxLQUFLLFFBQVEsQ0FBQyxDQUFDO0FBQUEsWUFDakY7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUVELFlBQU0sVUFBVSxVQUFVLE9BQU8sT0FBTztBQUN4QyxVQUFJLFFBQVEsVUFBVSxpQkFBaUI7QUFDckMsZUFBTztBQUFBLFVBQ0wsU0FBUztBQUFBLFVBQ1QsTUFBTTtBQUFBLFVBQ04sT0FBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBRUEsY0FBUTtBQUFBLFFBQ04saUVBQWlFLFFBQVEsWUFBWSxRQUFRLE1BQU07QUFBQSxNQUNyRztBQUNBLGFBQU87QUFBQSxRQUNMLFNBQVM7QUFBQSxRQUNULFFBQVE7QUFBQSxRQUNSLFNBQVMsVUFBVSxRQUFRLE1BQU07QUFBQSxNQUNuQztBQUFBLElBQ0YsU0FBUyxPQUFPO0FBQ2QsWUFBTSxtQkFDSixpQkFBaUIsVUFDaEIsTUFBTSxRQUFRLFNBQVMsV0FBVyxLQUFLLE1BQU0sUUFBUSxTQUFTLG1CQUFtQjtBQUVwRixVQUFJLG9CQUFvQixVQUFVLFlBQVk7QUFDNUMsZ0JBQVE7QUFBQSxVQUNOLCtDQUErQyxRQUFRLGVBQWUsT0FBTyxJQUFJLFVBQVU7QUFBQSxRQUM3RjtBQUNBLGNBQU0sSUFBSSxRQUFRLENBQUNDLGFBQVksV0FBV0EsVUFBUyxNQUFPLE9BQU8sQ0FBQztBQUNsRTtBQUFBLE1BQ0Y7QUFFQSxjQUFRLE1BQU0sbURBQW1ELFFBQVEsS0FBSyxLQUFLO0FBQ25GLGFBQU87QUFBQSxRQUNMLFNBQVM7QUFBQSxRQUNULFFBQVE7QUFBQSxRQUNSLFNBQVMsaUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSztBQUFBLE1BQ2hFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFFQSxTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsSUFDVCxRQUFRO0FBQUEsSUFDUixTQUFTO0FBQUEsRUFDWDtBQUNGO0FBRUEsZUFBZSxZQUFZLFVBQXdDO0FBQ2pFLFFBQU0sV0FBVyxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUksS0FBSztBQUM5QyxNQUFJO0FBQ0YsVUFBTSxTQUFTLE1BQVMsYUFBUyxTQUFTLFFBQVE7QUFDbEQsVUFBTSxTQUFTLFVBQU0saUJBQUFDLFNBQVMsTUFBTTtBQUNwQyxVQUFNLFVBQVUsVUFBVSxPQUFPLFFBQVEsRUFBRTtBQUUzQyxRQUFJLFFBQVEsVUFBVSxpQkFBaUI7QUFDckMsY0FBUSxJQUFJLDZEQUE2RCxRQUFRLEVBQUU7QUFDbkYsYUFBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBRUEsWUFBUTtBQUFBLE1BQ04sa0VBQWtFLFFBQVEsWUFBWSxRQUFRLE1BQU07QUFBQSxJQUN0RztBQUNBLFdBQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFFBQVE7QUFBQSxNQUNSLFNBQVMsVUFBVSxRQUFRLE1BQU07QUFBQSxJQUNuQztBQUFBLEVBQ0YsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLG1EQUFtRCxRQUFRLEtBQUssS0FBSztBQUNuRixXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFBQSxJQUNoRTtBQUFBLEVBQ0Y7QUFDRjtBQUVBLGVBQWUsZ0JBQWdCLFVBQXdDO0FBQ3JFLFFBQU0sV0FBVyxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUksS0FBSztBQUU5QyxNQUFJLFNBQTBEO0FBQzlELE1BQUk7QUFDRixVQUFNLFdBQVcsTUFBTSxZQUFZO0FBQ25DLFVBQU0sT0FBTyxJQUFJLFdBQVcsTUFBUyxhQUFTLFNBQVMsUUFBUSxDQUFDO0FBQ2hFLFVBQU0sY0FBYyxNQUFNLFNBQ3ZCLFlBQVksRUFBRSxNQUFNLFdBQVcsU0FBUyxlQUFlLE9BQU8sQ0FBQyxFQUMvRDtBQUVILFVBQU0sV0FBVyxZQUFZO0FBQzdCLFVBQU0sV0FBVyxLQUFLLElBQUksVUFBVSxhQUFhO0FBRWpELFlBQVE7QUFBQSxNQUNOLHVDQUF1QyxRQUFRLGlCQUFpQixRQUFRLFFBQVEsUUFBUTtBQUFBLElBQzFGO0FBRUEsYUFBUyxVQUFNLCtCQUFhLEtBQUs7QUFDakMsVUFBTSxZQUFzQixDQUFDO0FBQzdCLFFBQUksZUFBZTtBQUNuQixRQUFJLGtCQUFrQjtBQUV0QixhQUFTLFVBQVUsR0FBRyxXQUFXLFVBQVUsV0FBVztBQUNwRCxVQUFJO0FBQ0osVUFBSTtBQUNGLGVBQU8sTUFBTSxZQUFZLFFBQVEsT0FBTztBQUN4QyxjQUFNLFNBQVMsTUFBTSxxQkFBcUIsVUFBVSxJQUFJO0FBQ3hELFlBQUksT0FBTyxXQUFXLEdBQUc7QUFDdkIsa0JBQVE7QUFBQSxZQUNOLHNCQUFzQixRQUFRLFdBQVcsT0FBTztBQUFBLFVBQ2xEO0FBQ0E7QUFBQSxRQUNGO0FBRUEsY0FBTSxpQkFBaUIsT0FBTyxNQUFNLEdBQUcsdUJBQXVCO0FBQzlELG1CQUFXLFNBQVMsZ0JBQWdCO0FBQ2xDLGdCQUFNO0FBQUEsWUFDSixNQUFNLEVBQUUsS0FBSztBQUFBLFVBQ2YsSUFBSSxNQUFNLE9BQU8sVUFBVSxNQUFNLE1BQU07QUFDdkM7QUFDQSxnQkFBTSxVQUFVLFVBQVUsUUFBUSxFQUFFO0FBQ3BDLGNBQUksUUFBUSxTQUFTLEdBQUc7QUFDdEIsc0JBQVUsS0FBSyxPQUFPO0FBQUEsVUFDeEI7QUFBQSxRQUNGO0FBRUEsWUFBSSxZQUFZLEtBQUssVUFBVSxPQUFPLEtBQUssWUFBWSxVQUFVO0FBQy9ELGtCQUFRO0FBQUEsWUFDTixzQkFBc0IsUUFBUSxxQkFBcUIsT0FBTyxJQUFJLFFBQVEsWUFBWSxlQUFlLFdBQVcsVUFBVTtBQUFBLGNBQ3BIO0FBQUEsWUFDRixFQUFFLE1BQU07QUFBQSxVQUNWO0FBQUEsUUFDRjtBQUFBLE1BQ0YsU0FBUyxXQUFXO0FBQ2xCLFlBQUkscUJBQXFCLHVCQUF1QjtBQUM5QyxrQkFBUTtBQUFBLFlBQ04sdUNBQXVDLFFBQVEsS0FBSyxVQUFVLE9BQU87QUFBQSxVQUN2RTtBQUNBLGdCQUFNLE9BQU8sVUFBVTtBQUN2QixtQkFBUztBQUNULGlCQUFPO0FBQUEsWUFDTCxTQUFTO0FBQUEsWUFDVCxRQUFRO0FBQUEsWUFDUixTQUFTLFVBQVU7QUFBQSxVQUNyQjtBQUFBLFFBQ0Y7QUFDQTtBQUNBLGdCQUFRO0FBQUEsVUFDTiw0Q0FBNEMsT0FBTyxPQUFPLFFBQVE7QUFBQSxVQUNsRTtBQUFBLFFBQ0Y7QUFBQSxNQUNGLFVBQUU7QUFDQSxjQUFNLE1BQU0sUUFBUTtBQUFBLE1BQ3RCO0FBQUEsSUFDRjtBQUVBLFVBQU0sT0FBTyxVQUFVO0FBQ3ZCLGFBQVM7QUFFVCxVQUFNLFdBQVcsVUFBVSxVQUFVLEtBQUssTUFBTSxDQUFDO0FBQ2pELFlBQVE7QUFBQSxNQUNOLHdDQUF3QyxRQUFRLGVBQWUsU0FBUyxNQUFNO0FBQUEsSUFDaEY7QUFFQSxRQUFJLFNBQVMsVUFBVSxpQkFBaUI7QUFDdEMsYUFBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBRUEsUUFBSSxlQUFlLEdBQUc7QUFDcEIsYUFBTztBQUFBLFFBQ0wsU0FBUztBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxHQUFHLFlBQVk7QUFBQSxNQUMxQjtBQUFBLElBQ0Y7QUFFQSxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixTQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0YsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLDJDQUEyQyxRQUFRLEtBQUssS0FBSztBQUMzRSxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFBQSxJQUNoRTtBQUFBLEVBQ0YsVUFBRTtBQUNBLFFBQUksUUFBUTtBQUNWLFlBQU0sT0FBTyxVQUFVO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxlQUFlLHFCQUFxQixVQUF1QixNQUF5QztBQUNsRyxRQUFNLGVBQWUsTUFBTSxLQUFLLGdCQUFnQjtBQUNoRCxRQUFNLFNBQThCLENBQUM7QUFDckMsUUFBTSxpQkFBaUIsb0JBQUksSUFBaUM7QUFFNUQsV0FBUyxJQUFJLEdBQUcsSUFBSSxhQUFhLFFBQVEsUUFBUSxLQUFLO0FBQ3BELFVBQU0sS0FBSyxhQUFhLFFBQVEsQ0FBQztBQUNqQyxVQUFNLE9BQU8sYUFBYSxVQUFVLENBQUM7QUFFckMsUUFBSTtBQUNGLFVBQUksT0FBTyxTQUFTLElBQUkscUJBQXFCLE9BQU8sU0FBUyxJQUFJLHlCQUF5QjtBQUN4RixjQUFNLFFBQVEsT0FBTyxDQUFDO0FBQ3RCLFlBQUksT0FBTyxVQUFVLFVBQVU7QUFDN0I7QUFBQSxRQUNGO0FBQ0EsWUFBSTtBQUNKLFlBQUk7QUFDRixvQkFBVSxNQUFNLGlCQUFpQixNQUFNLE9BQU8sY0FBYztBQUFBLFFBQzlELFNBQVMsT0FBTztBQUNkLGNBQUksaUJBQWlCLHVCQUF1QjtBQUMxQyxrQkFBTTtBQUFBLFVBQ1I7QUFDQSxrQkFBUSxLQUFLLG9EQUFvRCxLQUFLO0FBQ3RFO0FBQUEsUUFDRjtBQUNBLFlBQUksQ0FBQyxTQUFTO0FBQ1o7QUFBQSxRQUNGO0FBQ0EsY0FBTSxZQUFZLHNCQUFzQixVQUFVLE9BQU87QUFDekQsWUFBSSxXQUFXO0FBQ2IsaUJBQU8sS0FBSyxTQUFTO0FBQUEsUUFDdkI7QUFBQSxNQUNGLFdBQVcsT0FBTyxTQUFTLElBQUksMkJBQTJCLE9BQU8sQ0FBQyxHQUFHO0FBQ25FLGNBQU0sWUFBWSxzQkFBc0IsVUFBVSxLQUFLLENBQUMsQ0FBQztBQUN6RCxZQUFJLFdBQVc7QUFDYixpQkFBTyxLQUFLLFNBQVM7QUFBQSxRQUN2QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLFNBQVMsT0FBTztBQUNkLFVBQUksaUJBQWlCLHVCQUF1QjtBQUMxQyxjQUFNO0FBQUEsTUFDUjtBQUNBLGNBQVEsS0FBSyxzREFBc0QsS0FBSztBQUFBLElBQzFFO0FBQUEsRUFDRjtBQUVBLFNBQU8sT0FDSixPQUFPLENBQUMsVUFBVSxNQUFNLFFBQVEsa0JBQWtCLEVBQ2xELEtBQUssQ0FBQyxHQUFHLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSTtBQUNuQztBQUVBLGVBQWUsaUJBQ2IsTUFDQSxPQUNBLE9BQ3FCO0FBQ3JCLE1BQUksTUFBTSxJQUFJLEtBQUssR0FBRztBQUNwQixXQUFPLE1BQU0sSUFBSSxLQUFLO0FBQUEsRUFDeEI7QUFFQSxRQUFNLFdBQVcsWUFBWTtBQUMzQixRQUFJO0FBQ0YsVUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLGNBQWMsS0FBSyxLQUFLLElBQUksS0FBSyxHQUFHO0FBQy9ELGVBQU8sS0FBSyxLQUFLLElBQUksS0FBSztBQUFBLE1BQzVCO0FBQUEsSUFDRixRQUFRO0FBQUEsSUFFUjtBQUVBLFdBQU8sSUFBSSxRQUFRLENBQUNELFVBQVMsV0FBVztBQUN0QyxVQUFJLFVBQVU7QUFDZCxVQUFJLGdCQUF1QztBQUUzQyxZQUFNLFVBQVUsTUFBTTtBQUNwQixZQUFJLGVBQWU7QUFDakIsdUJBQWEsYUFBYTtBQUMxQiwwQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFFQSxZQUFNLGFBQWEsQ0FBQyxTQUFjO0FBQ2hDLGtCQUFVO0FBQ1YsZ0JBQVE7QUFDUixRQUFBQSxTQUFRLElBQUk7QUFBQSxNQUNkO0FBRUEsVUFBSTtBQUNGLGFBQUssS0FBSyxJQUFJLE9BQU8sVUFBVTtBQUFBLE1BQ2pDLFNBQVMsT0FBTztBQUNkLGtCQUFVO0FBQ1YsZ0JBQVE7QUFDUixlQUFPLEtBQUs7QUFDWjtBQUFBLE1BQ0Y7QUFFQSxVQUFJLE9BQU8sU0FBUyxvQkFBb0IsS0FBSyx1QkFBdUIsR0FBRztBQUNyRSx3QkFBZ0IsV0FBVyxNQUFNO0FBQy9CLGNBQUksQ0FBQyxTQUFTO0FBQ1osc0JBQVU7QUFDVixtQkFBTyxJQUFJLHNCQUFzQixLQUFLLENBQUM7QUFBQSxVQUN6QztBQUFBLFFBQ0YsR0FBRyxvQkFBb0I7QUFBQSxNQUN6QjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0gsR0FBRztBQUVILFFBQU0sSUFBSSxPQUFPLE9BQU87QUFDeEIsU0FBTztBQUNUO0FBRUEsU0FBUyxzQkFDUCxVQUNBLFNBQzBCO0FBQzFCLE1BQUksQ0FBQyxXQUFXLE9BQU8sUUFBUSxVQUFVLFlBQVksT0FBTyxRQUFRLFdBQVcsVUFBVTtBQUN2RixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sRUFBRSxPQUFPLFFBQVEsTUFBTSxLQUFLLElBQUk7QUFDdEMsTUFBSSxDQUFDLE1BQU07QUFDVCxXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sTUFBTSxJQUFJLGlCQUFJLEVBQUUsT0FBTyxPQUFPLENBQUM7QUFDckMsUUFBTSxPQUFPLElBQUk7QUFFakIsTUFBSSxTQUFTLFNBQVMsVUFBVSxjQUFjLEtBQUssV0FBVyxRQUFRLFNBQVMsR0FBRztBQUNoRixTQUFLLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQztBQUFBLEVBQzVCLFdBQVcsU0FBUyxTQUFTLFVBQVUsYUFBYSxLQUFLLFdBQVcsUUFBUSxTQUFTLEdBQUc7QUFDdEYsVUFBTSxNQUFNO0FBQ1osYUFBUyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxRQUFRLEtBQUssR0FBRyxLQUFLLEdBQUc7QUFDckQsV0FBSyxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ2YsV0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQztBQUN2QixXQUFLLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBQ3ZCLFdBQUssSUFBSSxDQUFDLElBQUk7QUFBQSxJQUNoQjtBQUFBLEVBQ0YsV0FBVyxTQUFTLFNBQVMsVUFBVSxnQkFBZ0I7QUFDckQsUUFBSSxhQUFhO0FBQ2pCLFVBQU0sY0FBYyxRQUFRO0FBQzVCLGFBQVMsWUFBWSxHQUFHLFlBQVksS0FBSyxVQUFVLGFBQWEsYUFBYSxhQUFhO0FBQ3hGLFlBQU0sT0FBTyxLQUFLLFNBQVM7QUFDM0IsZUFBUyxNQUFNLEdBQUcsT0FBTyxLQUFLLGFBQWEsYUFBYSxPQUFPO0FBQzdELGNBQU0sUUFBUyxRQUFRLE1BQU8sSUFBSSxNQUFNO0FBQ3hDLGNBQU0sWUFBWSxhQUFhO0FBQy9CLGFBQUssU0FBUyxJQUFJO0FBQ2xCLGFBQUssWUFBWSxDQUFDLElBQUk7QUFDdEIsYUFBSyxZQUFZLENBQUMsSUFBSTtBQUN0QixhQUFLLFlBQVksQ0FBQyxJQUFJO0FBQ3RCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGLE9BQU87QUFDTCxXQUFPO0FBQUEsRUFDVDtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVEsaUJBQUksS0FBSyxNQUFNLEdBQUc7QUFBQSxJQUMxQjtBQUFBLElBQ0E7QUFBQSxJQUNBLE1BQU0sUUFBUTtBQUFBLEVBQ2hCO0FBQ0Y7QUFRQSxlQUFzQixTQUNwQixVQUNBRCxTQUNBLFdBQzBCO0FBQzFCLFFBQU0sV0FBVyxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUksS0FBSztBQUc5QyxRQUFNLGlCQUFpQixNQUFNLGtCQUFrQixVQUFVQSxPQUFNO0FBQy9ELE1BQUksZUFBZSxTQUFTO0FBQzFCLFdBQU87QUFBQSxFQUNUO0FBQ0EsTUFBSSxjQUFnQztBQUdwQyxRQUFNLGlCQUFpQixNQUFNLFlBQVksUUFBUTtBQUNqRCxNQUFJLGVBQWUsU0FBUztBQUMxQixXQUFPO0FBQUEsRUFDVDtBQUNBLGdCQUFjO0FBR2QsTUFBSSxDQUFDLFdBQVc7QUFDZCxZQUFRO0FBQUEsTUFDTixtRUFBbUUsUUFBUTtBQUFBLElBQzdFO0FBQ0EsV0FBTztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsU0FBUyw0QkFBNEIsWUFBWSxNQUFNO0FBQUEsSUFDekQ7QUFBQSxFQUNGO0FBRUEsVUFBUTtBQUFBLElBQ04sNkNBQTZDLFFBQVE7QUFBQSxFQUN2RDtBQUVBLFFBQU0sWUFBWSxNQUFNLGdCQUFnQixRQUFRO0FBQ2hELE1BQUksVUFBVSxTQUFTO0FBQ3JCLFdBQU87QUFBQSxFQUNUO0FBRUEsU0FBTztBQUNUO0FBcGZBLElBQ0FHLEtBQ0Esa0JBQ0Esa0JBQ0EsY0FFTSxpQkFDQSxlQUNBLHlCQUNBLG9CQUNBLHNCQXNCQSx1QkE4QkY7QUE5REo7QUFBQTtBQUFBO0FBQ0EsSUFBQUEsTUFBb0I7QUFDcEIsdUJBQXFCO0FBQ3JCLHVCQUE2QjtBQUM3QixtQkFBb0I7QUFFcEIsSUFBTSxrQkFBa0I7QUFDeEIsSUFBTSxnQkFBZ0I7QUFDdEIsSUFBTSwwQkFBMEI7QUFDaEMsSUFBTSxxQkFBcUI7QUFDM0IsSUFBTSx1QkFBdUI7QUFzQjdCLElBQU0sd0JBQU4sY0FBb0MsTUFBTTtBQUFBLE1BQ3hDLFlBQVksT0FBZTtBQUN6QixjQUFNLHFDQUFxQyxLQUFLLEVBQUU7QUFDbEQsYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUF5QkEsSUFBSSxpQkFBcUM7QUFBQTtBQUFBOzs7QUN4RHpDLGVBQXNCLFVBQVUsVUFBbUM7QUFDakUsU0FBTyxJQUFJLFFBQVEsQ0FBQ0MsVUFBUyxXQUFXO0FBQ3RDLFFBQUk7QUFDRixZQUFNLE9BQU8sSUFBSSxrQkFBSyxRQUFRO0FBRTlCLFdBQUssR0FBRyxTQUFTLENBQUMsVUFBaUI7QUFDakMsZ0JBQVEsTUFBTSwyQkFBMkIsUUFBUSxLQUFLLEtBQUs7QUFDM0QsUUFBQUEsU0FBUSxFQUFFO0FBQUEsTUFDWixDQUFDO0FBRUQsWUFBTSxZQUFZLENBQUMsVUFDakIsTUFBTSxRQUFRLFlBQVksR0FBRztBQUUvQixZQUFNLG1CQUFtQixDQUFDLGNBQXNCO0FBQzlDLGVBQVEsS0FBNkUsV0FBVyxTQUFTO0FBQUEsTUFDM0c7QUFFQSxZQUFNLGtCQUFrQixDQUFDLFVBQ3ZCLFFBQVEsWUFBWSxLQUFLLE9BQU8sYUFBYTtBQUUvQyxZQUFNLGdCQUFnQixDQUFDLGNBQXNCO0FBQzNDLGNBQU0sYUFBYSxVQUFVLFlBQVk7QUFDekMsWUFBSSxDQUFDLFlBQVk7QUFDZixpQkFBTztBQUFBLFFBQ1Q7QUFFQSxZQUFJLGVBQWUsMkJBQTJCLGVBQWUsaUJBQWlCO0FBQzVFLGlCQUFPO0FBQUEsUUFDVDtBQUVBLFlBQUksV0FBVyxXQUFXLE9BQU8sR0FBRztBQUNsQyxpQkFBTztBQUFBLFFBQ1Q7QUFFQSxZQUFJLFdBQVcsU0FBUyxNQUFNLEdBQUc7QUFDL0IsaUJBQU87QUFBQSxRQUNUO0FBRUEsZUFBTztBQUFBLE1BQ1Q7QUFFQSxZQUFNLGNBQWMsT0FBTyxjQUF1QztBQUNoRSxjQUFNLGdCQUFnQixpQkFBaUIsU0FBUztBQUNoRCxZQUFJLENBQUMsZUFBZTtBQUNsQixrQkFBUSxLQUFLLGdCQUFnQixTQUFTLDhCQUE4QixRQUFRLFlBQVk7QUFDeEYsaUJBQU87QUFBQSxRQUNUO0FBRUEsY0FBTSxZQUFZLGdCQUFnQixhQUFhO0FBQy9DLFlBQUksY0FBYyxTQUFTLEdBQUc7QUFDNUIsaUJBQU8sSUFBSSxRQUFRLENBQUMsS0FBSyxRQUFRO0FBQy9CLGlCQUFLO0FBQUEsY0FDSDtBQUFBLGNBQ0EsQ0FBQyxPQUFxQixTQUFrQjtBQUN0QyxvQkFBSSxPQUFPO0FBQ1Qsc0JBQUksS0FBSztBQUFBLGdCQUNYLFdBQVcsQ0FBQyxNQUFNO0FBQ2hCLHNCQUFJLEVBQUU7QUFBQSxnQkFDUixPQUFPO0FBQ0wsc0JBQUksVUFBVSxLQUFLLFNBQVMsT0FBTyxDQUFDLENBQUM7QUFBQSxnQkFDdkM7QUFBQSxjQUNGO0FBQUEsWUFDRjtBQUFBLFVBQ0YsQ0FBQztBQUFBLFFBQ0g7QUFFQSxlQUFPLElBQUksUUFBUSxDQUFDLEtBQUssUUFBUTtBQUMvQixlQUFLO0FBQUEsWUFDSDtBQUFBLFlBQ0EsQ0FBQyxPQUFxQixTQUFrQjtBQUN0QyxrQkFBSSxPQUFPO0FBQ1Qsb0JBQUksS0FBSztBQUFBLGNBQ1gsV0FBVyxPQUFPLFNBQVMsVUFBVTtBQUNuQyxvQkFBSSxVQUFVLElBQUksQ0FBQztBQUFBLGNBQ3JCLE9BQU87QUFDTCxvQkFBSSxFQUFFO0FBQUEsY0FDUjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUVBLFdBQUssR0FBRyxPQUFPLFlBQVk7QUFDekIsWUFBSTtBQUNGLGdCQUFNLFdBQVcsS0FBSztBQUN0QixnQkFBTSxZQUFzQixDQUFDO0FBRTdCLHFCQUFXLFdBQVcsVUFBVTtBQUM5QixnQkFBSTtBQUNGLG9CQUFNLFlBQVksUUFBUTtBQUMxQixrQkFBSSxDQUFDLFdBQVc7QUFDZCx3QkFBUSxLQUFLLDhCQUE4QixRQUFRLFlBQVk7QUFDL0QsMEJBQVUsS0FBSyxFQUFFO0FBQ2pCO0FBQUEsY0FDRjtBQUVBLG9CQUFNLE9BQU8sTUFBTSxZQUFZLFNBQVM7QUFDeEMsd0JBQVUsS0FBSyxJQUFJO0FBQUEsWUFDckIsU0FBUyxjQUFjO0FBQ3JCLHNCQUFRLE1BQU0seUJBQXlCLFFBQVEsRUFBRSxLQUFLLFlBQVk7QUFBQSxZQUNwRTtBQUFBLFVBQ0Y7QUFFQSxnQkFBTSxXQUFXLFVBQVUsS0FBSyxNQUFNO0FBQ3RDLFVBQUFBO0FBQUEsWUFDRSxTQUNHLFFBQVEsUUFBUSxHQUFHLEVBQ25CLFFBQVEsUUFBUSxJQUFJLEVBQ3BCLEtBQUs7QUFBQSxVQUNWO0FBQUEsUUFDRixTQUFTLE9BQU87QUFDZCxrQkFBUSxNQUFNLG1DQUFtQyxLQUFLO0FBQ3RELFVBQUFBLFNBQVEsRUFBRTtBQUFBLFFBQ1o7QUFBQSxNQUNGLENBQUM7QUFFRCxXQUFLLE1BQU07QUFBQSxJQUNiLFNBQVMsT0FBTztBQUNkLGNBQVEsTUFBTSxzQ0FBc0MsUUFBUSxLQUFLLEtBQUs7QUFDdEUsTUFBQUEsU0FBUSxFQUFFO0FBQUEsSUFDWjtBQUFBLEVBQ0YsQ0FBQztBQUNIO0FBaElBLElBQ0E7QUFEQTtBQUFBO0FBQUE7QUFDQSxtQkFBcUI7QUFBQTtBQUFBOzs7QUNJckIsZUFBc0IsV0FBVyxVQUFtQztBQUNsRSxNQUFJO0FBQ0YsVUFBTSxTQUFTLFVBQU0sZ0NBQWEsS0FBSztBQUV2QyxVQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLE1BQU0sT0FBTyxVQUFVLFFBQVE7QUFFMUQsVUFBTSxPQUFPLFVBQVU7QUFFdkIsV0FBTyxLQUNKLFFBQVEsUUFBUSxHQUFHLEVBQ25CLFFBQVEsUUFBUSxJQUFJLEVBQ3BCLEtBQUs7QUFBQSxFQUNWLFNBQVMsT0FBTztBQUNkLFlBQVEsTUFBTSw0QkFBNEIsUUFBUSxLQUFLLEtBQUs7QUFDNUQsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQXJCQSxJQUFBQztBQUFBO0FBQUE7QUFBQTtBQUFBLElBQUFBLG9CQUE2QjtBQUFBO0FBQUE7OztBQ1U3QixlQUFzQixVQUNwQixVQUNBLFVBQTRCLENBQUMsR0FDWjtBQUNqQixRQUFNLEVBQUUsZ0JBQWdCLE9BQU8scUJBQXFCLE1BQU0sSUFBSTtBQUU5RCxNQUFJO0FBQ0YsVUFBTSxVQUFVLE1BQVMsYUFBUyxTQUFTLFVBQVUsT0FBTztBQUM1RCxVQUFNLGFBQWEscUJBQXFCLE9BQU87QUFFL0MsVUFBTSxXQUFXLGdCQUFnQixvQkFBb0IsVUFBVSxJQUFJO0FBRW5FLFlBQVEscUJBQXFCLCtCQUErQixRQUFRLElBQUksbUJBQW1CLFFBQVEsR0FBRyxLQUFLO0FBQUEsRUFDN0csU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLDJCQUEyQixRQUFRLEtBQUssS0FBSztBQUMzRCxXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsU0FBUyxxQkFBcUIsT0FBdUI7QUFDbkQsU0FBTyxNQUFNLFFBQVEsVUFBVSxJQUFJO0FBQ3JDO0FBRUEsU0FBUyxtQkFBbUIsT0FBdUI7QUFDakQsU0FBTyxNQUFNLFFBQVEsUUFBUSxHQUFHO0FBQ2xDO0FBRUEsU0FBUywrQkFBK0IsT0FBdUI7QUFDN0QsU0FDRSxNQUVHLFFBQVEsYUFBYSxJQUFJLEVBRXpCLFFBQVEsV0FBVyxNQUFNLEVBRXpCLFFBQVEsY0FBYyxHQUFHO0FBRWhDO0FBRUEsU0FBUyxvQkFBb0IsT0FBdUI7QUFDbEQsTUFBSSxTQUFTO0FBR2IsV0FBUyxPQUFPLFFBQVEsbUJBQW1CLEdBQUc7QUFFOUMsV0FBUyxPQUFPLFFBQVEsY0FBYyxJQUFJO0FBRTFDLFdBQVMsT0FBTyxRQUFRLDJCQUEyQixLQUFLO0FBRXhELFdBQVMsT0FBTyxRQUFRLDBCQUEwQixJQUFJO0FBRXRELFdBQVMsT0FBTyxRQUFRLHFCQUFxQixJQUFJO0FBQ2pELFdBQVMsT0FBTyxRQUFRLGtCQUFrQixJQUFJO0FBRTlDLFdBQVMsT0FBTyxRQUFRLHVCQUF1QixFQUFFO0FBRWpELFdBQVMsT0FBTyxRQUFRLGtCQUFrQixFQUFFO0FBRTVDLFdBQVMsT0FBTyxRQUFRLHNCQUFzQixFQUFFO0FBRWhELFdBQVMsT0FBTyxRQUFRLDBCQUEwQixFQUFFO0FBRXBELFdBQVMsT0FBTyxRQUFRLDZCQUE2QixFQUFFO0FBRXZELFdBQVMsT0FBTyxRQUFRLFlBQVksR0FBRztBQUV2QyxTQUFPO0FBQ1Q7QUE3RUEsSUFBQUM7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUFBQSxNQUFvQjtBQUFBO0FBQUE7OztBQzhDcEIsZUFBc0IsY0FDcEIsVUFDQSxZQUFxQixPQUNyQkMsU0FDOEI7QUFDOUIsUUFBTSxNQUFXLGNBQVEsUUFBUSxFQUFFLFlBQVk7QUFDL0MsUUFBTSxXQUFnQixlQUFTLFFBQVE7QUFFdkMsUUFBTSxlQUFlLENBQUMsVUFBdUM7QUFBQSxJQUMzRCxTQUFTO0FBQUEsSUFDVCxVQUFVO0FBQUEsTUFDUjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsUUFDQSxXQUFXO0FBQUEsUUFDWCxVQUFVLG9CQUFJLEtBQUs7QUFBQSxNQUNyQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsTUFBSTtBQUNGLFFBQUksZ0JBQWdCLEdBQUcsR0FBRztBQUN4QixVQUFJO0FBQ0YsY0FBTSxPQUFPO0FBQUEsVUFDWCxNQUFNLFVBQVUsUUFBUTtBQUFBLFVBQ3hCO0FBQUEsVUFDQSxHQUFHLFFBQVE7QUFBQSxRQUNiO0FBQ0EsZUFBTyxLQUFLLFVBQVUsYUFBYSxLQUFLLEtBQUssSUFBSTtBQUFBLE1BQ25ELFNBQVMsT0FBTztBQUNkLGdCQUFRLE1BQU0sZ0NBQWdDLFFBQVEsS0FBSyxLQUFLO0FBQ2hFLGVBQU87QUFBQSxVQUNMLFNBQVM7QUFBQSxVQUNULFFBQVE7QUFBQSxVQUNSLFNBQVMsaUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSztBQUFBLFFBQ2hFO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFFQSxRQUFJLFFBQVEsUUFBUTtBQUNsQixVQUFJLENBQUNBLFNBQVE7QUFDWCxnQkFBUSxLQUFLLDJEQUEyRCxRQUFRLEVBQUU7QUFDbEYsZUFBTyxFQUFFLFNBQVMsT0FBTyxRQUFRLHFCQUFxQjtBQUFBLE1BQ3hEO0FBQ0EsWUFBTSxZQUFZLE1BQU0sU0FBUyxVQUFVQSxTQUFRLFNBQVM7QUFDNUQsVUFBSSxVQUFVLFNBQVM7QUFDckIsZUFBTyxhQUFhLFVBQVUsSUFBSTtBQUFBLE1BQ3BDO0FBQ0EsYUFBTztBQUFBLElBQ1Q7QUFFQSxRQUFJLFFBQVEsU0FBUztBQUNuQixZQUFNLE9BQU8sTUFBTSxVQUFVLFFBQVE7QUFDckMsWUFBTSxVQUFVLGlCQUFpQixNQUFNLGNBQWMsUUFBUTtBQUM3RCxhQUFPLFFBQVEsVUFBVSxhQUFhLFFBQVEsS0FBSyxJQUFJO0FBQUEsSUFDekQ7QUFFQSxRQUFJLG1CQUFtQixHQUFHLEdBQUc7QUFDM0IsVUFBSTtBQUNGLGNBQU0sT0FBTyxNQUFNLFVBQVUsVUFBVTtBQUFBLFVBQ3JDLGVBQWUsb0JBQW9CLEdBQUc7QUFBQSxVQUN0QyxvQkFBb0IscUJBQXFCLEdBQUc7QUFBQSxRQUM5QyxDQUFDO0FBQ0QsY0FBTSxVQUFVLGlCQUFpQixNQUFNLGNBQWMsUUFBUTtBQUM3RCxlQUFPLFFBQVEsVUFBVSxhQUFhLFFBQVEsS0FBSyxJQUFJO0FBQUEsTUFDekQsU0FBUyxPQUFPO0FBQ2QsZ0JBQVEsTUFBTSxnQ0FBZ0MsUUFBUSxLQUFLLEtBQUs7QUFDaEUsZUFBTztBQUFBLFVBQ0wsU0FBUztBQUFBLFVBQ1QsUUFBUTtBQUFBLFVBQ1IsU0FBUyxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLO0FBQUEsUUFDaEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFFBQUksb0JBQW9CLElBQUksR0FBRyxHQUFHO0FBQ2hDLFVBQUksQ0FBQyxXQUFXO0FBQ2QsZ0JBQVEsSUFBSSx1QkFBdUIsUUFBUSxpQkFBaUI7QUFDNUQsZUFBTyxFQUFFLFNBQVMsT0FBTyxRQUFRLHFCQUFxQjtBQUFBLE1BQ3hEO0FBQ0EsVUFBSTtBQUNGLGNBQU0sT0FBTyxNQUFNLFdBQVcsUUFBUTtBQUN0QyxjQUFNLFVBQVUsaUJBQWlCLE1BQU0sZUFBZSxRQUFRO0FBQzlELGVBQU8sUUFBUSxVQUFVLGFBQWEsUUFBUSxLQUFLLElBQUk7QUFBQSxNQUN6RCxTQUFTLE9BQU87QUFDZCxnQkFBUSxNQUFNLGlDQUFpQyxRQUFRLEtBQUssS0FBSztBQUNqRSxlQUFPO0FBQUEsVUFDTCxTQUFTO0FBQUEsVUFDVCxRQUFRO0FBQUEsVUFDUixTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFBQSxRQUNoRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsUUFBSSxRQUFRLFFBQVE7QUFDbEIsY0FBUSxJQUFJLGdDQUFnQyxRQUFRLEVBQUU7QUFDdEQsYUFBTyxFQUFFLFNBQVMsT0FBTyxRQUFRLHlCQUF5QixTQUFTLE9BQU87QUFBQSxJQUM1RTtBQUVBLFlBQVEsSUFBSSwwQkFBMEIsUUFBUSxFQUFFO0FBQ2hELFdBQU8sRUFBRSxTQUFTLE9BQU8sUUFBUSx5QkFBeUIsU0FBUyxJQUFJO0FBQUEsRUFDekUsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLDBCQUEwQixRQUFRLEtBQUssS0FBSztBQUMxRCxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxRQUFRO0FBQUEsTUFDUixTQUFTLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFBQSxJQUNoRTtBQUFBLEVBQ0Y7QUFDRjtBQU1BLFNBQVMsaUJBQ1AsTUFDQSxhQUNBLGdCQUNhO0FBQ2IsUUFBTSxVQUFVLE1BQU0sS0FBSyxLQUFLO0FBQ2hDLE1BQUksUUFBUSxXQUFXLEdBQUc7QUFDeEIsV0FBTztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsUUFBUTtBQUFBLE1BQ1IsU0FBUyxpQkFBaUIsR0FBRyxjQUFjLDRCQUE0QjtBQUFBLElBQ3pFO0FBQUEsRUFDRjtBQUNBLFNBQU8sRUFBRSxTQUFTLE1BQU0sT0FBTyxRQUFRO0FBQ3pDO0FBaExBLElBQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsUUFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQUE7QUFBQTs7O0FDSk8sU0FBUyxVQUNkLE1BQ0EsV0FDQSxTQUMrRDtBQUMvRCxRQUFNLFNBQXdFLENBQUM7QUFHL0UsUUFBTSxRQUFRLEtBQUssTUFBTSxLQUFLO0FBRTlCLE1BQUksTUFBTSxXQUFXLEdBQUc7QUFDdEIsV0FBTztBQUFBLEVBQ1Q7QUFFQSxNQUFJLFdBQVc7QUFFZixTQUFPLFdBQVcsTUFBTSxRQUFRO0FBQzlCLFVBQU0sU0FBUyxLQUFLLElBQUksV0FBVyxXQUFXLE1BQU0sTUFBTTtBQUMxRCxVQUFNLGFBQWEsTUFBTSxNQUFNLFVBQVUsTUFBTTtBQUMvQyxVQUFNQyxhQUFZLFdBQVcsS0FBSyxHQUFHO0FBRXJDLFdBQU8sS0FBSztBQUFBLE1BQ1YsTUFBTUE7QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQSxJQUNaLENBQUM7QUFHRCxnQkFBWSxLQUFLLElBQUksR0FBRyxZQUFZLE9BQU87QUFHM0MsUUFBSSxVQUFVLE1BQU0sUUFBUTtBQUMxQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBRUEsU0FBTztBQUNUO0FBeENBO0FBQUE7QUFBQTtBQUFBO0FBQUE7OztBQ01BLGVBQXNCLGtCQUFrQixVQUFtQztBQUN6RSxTQUFPLElBQUksUUFBUSxDQUFDQyxVQUFTLFdBQVc7QUFDdEMsVUFBTSxPQUFjLGtCQUFXLFFBQVE7QUFDdkMsVUFBTSxTQUFZLHFCQUFpQixRQUFRO0FBRTNDLFdBQU8sR0FBRyxRQUFRLENBQUMsU0FBUyxLQUFLLE9BQU8sSUFBSSxDQUFDO0FBQzdDLFdBQU8sR0FBRyxPQUFPLE1BQU1BLFNBQVEsS0FBSyxPQUFPLEtBQUssQ0FBQyxDQUFDO0FBQ2xELFdBQU8sR0FBRyxTQUFTLE1BQU07QUFBQSxFQUMzQixDQUFDO0FBQ0g7QUFmQSxZQUNBQztBQURBO0FBQUE7QUFBQTtBQUFBLGFBQXdCO0FBQ3hCLElBQUFBLE1BQW9CO0FBQUE7QUFBQTs7O0FDRHBCLElBQUFDLEtBQ0FDLE9BWWE7QUFiYjtBQUFBO0FBQUE7QUFBQSxJQUFBRCxNQUFvQjtBQUNwQixJQUFBQyxRQUFzQjtBQVlmLElBQU0scUJBQU4sTUFBeUI7QUFBQSxNQUs5QixZQUE2QixjQUFzQjtBQUF0QjtBQUo3QixhQUFRLFNBQVM7QUFDakIsYUFBUSxVQUEyQyxDQUFDO0FBQ3BELGFBQVEsUUFBdUIsUUFBUSxRQUFRO0FBQUEsTUFFSztBQUFBLE1BRXBELE1BQWMsT0FBc0I7QUFDbEMsWUFBSSxLQUFLLFFBQVE7QUFDZjtBQUFBLFFBQ0Y7QUFDQSxZQUFJO0FBQ0YsZ0JBQU0sT0FBTyxNQUFTLGFBQVMsS0FBSyxjQUFjLE9BQU87QUFDekQsZUFBSyxVQUFVLEtBQUssTUFBTSxJQUFJLEtBQUssQ0FBQztBQUFBLFFBQ3RDLFFBQVE7QUFDTixlQUFLLFVBQVUsQ0FBQztBQUFBLFFBQ2xCO0FBQ0EsYUFBSyxTQUFTO0FBQUEsTUFDaEI7QUFBQSxNQUVBLE1BQWMsVUFBeUI7QUFDckMsY0FBUyxVQUFXLGNBQVEsS0FBSyxZQUFZLEdBQUcsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUNuRSxjQUFTLGNBQVUsS0FBSyxjQUFjLEtBQUssVUFBVSxLQUFLLFNBQVMsTUFBTSxDQUFDLEdBQUcsT0FBTztBQUFBLE1BQ3RGO0FBQUEsTUFFUSxhQUFnQixXQUF5QztBQUMvRCxjQUFNLFNBQVMsS0FBSyxNQUFNLEtBQUssU0FBUztBQUN4QyxhQUFLLFFBQVEsT0FBTztBQUFBLFVBQ2xCLE1BQU07QUFBQSxVQUFDO0FBQUEsVUFDUCxNQUFNO0FBQUEsVUFBQztBQUFBLFFBQ1Q7QUFDQSxlQUFPO0FBQUEsTUFDVDtBQUFBLE1BRUEsTUFBTSxjQUFjLFVBQWtCLFVBQWtCLFFBQStCO0FBQ3JGLGVBQU8sS0FBSyxhQUFhLFlBQVk7QUFDbkMsZ0JBQU0sS0FBSyxLQUFLO0FBQ2hCLGVBQUssUUFBUSxRQUFRLElBQUk7QUFBQSxZQUN2QjtBQUFBLFlBQ0E7QUFBQSxZQUNBLFlBQVcsb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFBQSxVQUNwQztBQUNBLGdCQUFNLEtBQUssUUFBUTtBQUFBLFFBQ3JCLENBQUM7QUFBQSxNQUNIO0FBQUEsTUFFQSxNQUFNLGFBQWEsVUFBaUM7QUFDbEQsZUFBTyxLQUFLLGFBQWEsWUFBWTtBQUNuQyxnQkFBTSxLQUFLLEtBQUs7QUFDaEIsY0FBSSxLQUFLLFFBQVEsUUFBUSxHQUFHO0FBQzFCLG1CQUFPLEtBQUssUUFBUSxRQUFRO0FBQzVCLGtCQUFNLEtBQUssUUFBUTtBQUFBLFVBQ3JCO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUFBLE1BRUEsTUFBTSxpQkFBaUIsVUFBa0IsVUFBK0M7QUFDdEYsY0FBTSxLQUFLLEtBQUs7QUFDaEIsY0FBTSxRQUFRLEtBQUssUUFBUSxRQUFRO0FBQ25DLFlBQUksQ0FBQyxPQUFPO0FBQ1YsaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTyxNQUFNLGFBQWEsV0FBVyxNQUFNLFNBQVM7QUFBQSxNQUN0RDtBQUFBLElBQ0Y7QUFBQTtBQUFBOzs7QUN2QkEsU0FBUyxzQkFBc0IsS0FBd0I7QUFDckQsTUFBSSxNQUFNLFFBQVEsR0FBRyxHQUFHO0FBQ3RCLFdBQU8sSUFBSSxJQUFJLGtCQUFrQjtBQUFBLEVBQ25DO0FBRUEsTUFBSSxPQUFPLFFBQVEsVUFBVTtBQUMzQixXQUFPLENBQUMsbUJBQW1CLEdBQUcsQ0FBQztBQUFBLEVBQ2pDO0FBRUEsTUFBSSxPQUFPLE9BQU8sUUFBUSxVQUFVO0FBQ2xDLFFBQUksWUFBWSxPQUFPLEdBQUcsR0FBRztBQUMzQixhQUFPLE1BQU0sS0FBSyxHQUFtQyxFQUFFLElBQUksa0JBQWtCO0FBQUEsSUFDL0U7QUFFQSxVQUFNLFlBQ0gsSUFBWSxhQUNaLElBQVksVUFDWixJQUFZLFNBQ1osT0FBUSxJQUFZLFlBQVksYUFBYyxJQUFZLFFBQVEsSUFBSSxZQUN0RSxPQUFRLElBQVksV0FBVyxhQUFjLElBQVksT0FBTyxJQUFJO0FBRXZFLFFBQUksY0FBYyxRQUFXO0FBQzNCLGFBQU8sc0JBQXNCLFNBQVM7QUFBQSxJQUN4QztBQUFBLEVBQ0Y7QUFFQSxRQUFNLElBQUksTUFBTSxrREFBa0Q7QUFDcEU7QUFFQSxTQUFTLG1CQUFtQixPQUF3QjtBQUNsRCxRQUFNLE1BQU0sT0FBTyxVQUFVLFdBQVcsUUFBUSxPQUFPLEtBQUs7QUFDNUQsTUFBSSxDQUFDLE9BQU8sU0FBUyxHQUFHLEdBQUc7QUFDekIsVUFBTSxJQUFJLE1BQU0sOENBQThDO0FBQUEsRUFDaEU7QUFDQSxTQUFPO0FBQ1Q7QUF6RkEsb0JBQ0FDLEtBQ0FDLE9BeUZhO0FBM0ZiO0FBQUE7QUFBQTtBQUFBLHFCQUFtQjtBQUNuQixJQUFBRCxNQUFvQjtBQUNwQixJQUFBQyxRQUFzQjtBQUN0QjtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBa0ZPLElBQU0sZUFBTixNQUFtQjtBQUFBLE1BTXhCLFlBQVksU0FBMEI7QUFIdEMsYUFBUSxzQkFBOEMsQ0FBQztBQUlyRCxhQUFLLFVBQVU7QUFDZixhQUFLLFFBQVEsSUFBSSxlQUFBQyxRQUFPLEVBQUUsYUFBYSxRQUFRLGNBQWMsQ0FBQztBQUM5RCxhQUFLLHFCQUFxQixJQUFJO0FBQUEsVUFDdkIsV0FBSyxRQUFRLGdCQUFnQix3QkFBd0I7QUFBQSxRQUM1RDtBQUFBLE1BQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtBLE1BQU0sUUFBaUM7QUFDckMsY0FBTSxFQUFFLGNBQWMsYUFBQUMsY0FBYSxXQUFXLElBQUksS0FBSztBQUV2RCxZQUFJO0FBQ0YsZ0JBQU0sZ0JBQWdCLE1BQU1BLGFBQVkscUJBQXFCO0FBRzdELGNBQUksWUFBWTtBQUNkLHVCQUFXO0FBQUEsY0FDVCxZQUFZO0FBQUEsY0FDWixnQkFBZ0I7QUFBQSxjQUNoQixhQUFhO0FBQUEsY0FDYixRQUFRO0FBQUEsWUFDVixDQUFDO0FBQUEsVUFDSDtBQUVBLGdCQUFNLFFBQVEsTUFBTSxjQUFjLGNBQWMsQ0FBQyxTQUFTLFVBQVU7QUFDbEUsZ0JBQUksWUFBWTtBQUNkLHlCQUFXO0FBQUEsZ0JBQ1QsWUFBWTtBQUFBLGdCQUNaLGdCQUFnQjtBQUFBLGdCQUNoQixhQUFhLFdBQVcsT0FBTztBQUFBLGdCQUMvQixRQUFRO0FBQUEsY0FDVixDQUFDO0FBQUEsWUFDSDtBQUFBLFVBQ0YsQ0FBQztBQUVELGtCQUFRLElBQUksU0FBUyxNQUFNLE1BQU0sbUJBQW1CO0FBR3BELGNBQUksaUJBQWlCO0FBQ3JCLGNBQUksZUFBZTtBQUNuQixjQUFJLFlBQVk7QUFDaEIsY0FBSSxlQUFlO0FBQ25CLGNBQUksZUFBZTtBQUNuQixjQUFJLFdBQVc7QUFFZixjQUFJLFlBQVk7QUFDZCx1QkFBVztBQUFBLGNBQ1QsWUFBWSxNQUFNO0FBQUEsY0FDbEIsZ0JBQWdCO0FBQUEsY0FDaEIsYUFBYSxNQUFNLENBQUMsR0FBRyxRQUFRO0FBQUEsY0FDL0IsUUFBUTtBQUFBLFlBQ1YsQ0FBQztBQUFBLFVBQ0g7QUFHQSxnQkFBTSxRQUFRLE1BQU07QUFBQSxZQUFJLENBQUMsU0FDdkIsS0FBSyxNQUFNLElBQUksWUFBWTtBQUN6QixrQkFBSSxVQUE0QixFQUFFLE1BQU0sU0FBUztBQUNqRCxrQkFBSTtBQUNGLG9CQUFJLFlBQVk7QUFDZCw2QkFBVztBQUFBLG9CQUNULFlBQVksTUFBTTtBQUFBLG9CQUNsQixnQkFBZ0I7QUFBQSxvQkFDaEIsYUFBYSxLQUFLO0FBQUEsb0JBQ2xCLFFBQVE7QUFBQSxvQkFDUixpQkFBaUI7QUFBQSxvQkFDakIsYUFBYTtBQUFBLG9CQUNiLGNBQWM7QUFBQSxrQkFDaEIsQ0FBQztBQUFBLGdCQUNIO0FBRUEsMEJBQVUsTUFBTSxLQUFLLFVBQVUsTUFBTSxhQUFhO0FBQUEsY0FDcEQsU0FBUyxPQUFPO0FBQ2Qsd0JBQVEsTUFBTSx1QkFBdUIsS0FBSyxJQUFJLEtBQUssS0FBSztBQUN4RCxxQkFBSztBQUFBLGtCQUNIO0FBQUEsa0JBQ0EsaUJBQWlCLFFBQVEsTUFBTSxVQUFVLE9BQU8sS0FBSztBQUFBLGtCQUNyRDtBQUFBLGdCQUNGO0FBQUEsY0FDRjtBQUVBO0FBQ0Esc0JBQVEsUUFBUSxNQUFNO0FBQUEsZ0JBQ3BCLEtBQUs7QUFDSDtBQUNBO0FBQ0E7QUFBQSxnQkFDRixLQUFLO0FBQ0g7QUFDQSxzQkFBSSxRQUFRLGVBQWUsT0FBTztBQUNoQztBQUFBLGtCQUNGLE9BQU87QUFDTDtBQUFBLGtCQUNGO0FBQ0E7QUFBQSxnQkFDRixLQUFLO0FBQ0g7QUFDQTtBQUFBLGNBQ0o7QUFFQSxrQkFBSSxZQUFZO0FBQ2QsMkJBQVc7QUFBQSxrQkFDVCxZQUFZLE1BQU07QUFBQSxrQkFDbEIsZ0JBQWdCO0FBQUEsa0JBQ2hCLGFBQWEsS0FBSztBQUFBLGtCQUNsQixRQUFRO0FBQUEsa0JBQ1IsaUJBQWlCO0FBQUEsa0JBQ2pCLGFBQWE7QUFBQSxrQkFDYixjQUFjO0FBQUEsZ0JBQ2hCLENBQUM7QUFBQSxjQUNIO0FBQUEsWUFDRixDQUFDO0FBQUEsVUFDSDtBQUVBLGdCQUFNLFFBQVEsSUFBSSxLQUFLO0FBRXZCLGNBQUksWUFBWTtBQUNkLHVCQUFXO0FBQUEsY0FDVCxZQUFZLE1BQU07QUFBQSxjQUNsQixnQkFBZ0I7QUFBQSxjQUNoQixhQUFhO0FBQUEsY0FDYixRQUFRO0FBQUEsY0FDUixpQkFBaUI7QUFBQSxjQUNqQixhQUFhO0FBQUEsY0FDYixjQUFjO0FBQUEsWUFDaEIsQ0FBQztBQUFBLFVBQ0g7QUFFQSxlQUFLLGtCQUFrQjtBQUN2QixnQkFBTSxLQUFLLG1CQUFtQjtBQUFBLFlBQzVCLFlBQVksTUFBTTtBQUFBLFlBQ2xCLGlCQUFpQjtBQUFBLFlBQ2pCLGFBQWE7QUFBQSxZQUNiLGNBQWM7QUFBQSxZQUNkLGNBQWM7QUFBQSxZQUNkLFVBQVU7QUFBQSxVQUNaLENBQUM7QUFFRCxrQkFBUTtBQUFBLFlBQ04sc0JBQXNCLFlBQVksSUFBSSxNQUFNLE1BQU0sZ0NBQWdDLFNBQVMsb0JBQW9CLFlBQVksYUFBYSxZQUFZLFNBQVMsUUFBUTtBQUFBLFVBQ3ZLO0FBRUEsaUJBQU87QUFBQSxZQUNMLFlBQVksTUFBTTtBQUFBLFlBQ2xCLGlCQUFpQjtBQUFBLFlBQ2pCLGFBQWE7QUFBQSxZQUNiLGNBQWM7QUFBQSxZQUNkLGNBQWM7QUFBQSxZQUNkLFVBQVU7QUFBQSxVQUNaO0FBQUEsUUFDRixTQUFTLE9BQU87QUFDZCxrQkFBUSxNQUFNLDBCQUEwQixLQUFLO0FBQzdDLGNBQUksWUFBWTtBQUNkLHVCQUFXO0FBQUEsY0FDVCxZQUFZO0FBQUEsY0FDWixnQkFBZ0I7QUFBQSxjQUNoQixhQUFhO0FBQUEsY0FDYixRQUFRO0FBQUEsY0FDUixPQUFPLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFBQSxZQUM5RCxDQUFDO0FBQUEsVUFDSDtBQUNBLGdCQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtBLE1BQWMsVUFDWixNQUNBLGdCQUEwQyxvQkFBSSxJQUFJLEdBQ3ZCO0FBQzNCLGNBQU0sRUFBRSxhQUFBQSxjQUFhLGdCQUFnQixRQUFBQyxTQUFRLFdBQVcsY0FBYyxXQUFXLFlBQVksSUFDM0YsS0FBSztBQUVQLFlBQUk7QUFDSixZQUFJO0FBRUYscUJBQVcsTUFBTSxrQkFBa0IsS0FBSyxJQUFJO0FBQzVDLGdCQUFNLGlCQUFpQixjQUFjLElBQUksS0FBSyxJQUFJO0FBQ2xELGdCQUFNLGdCQUFnQixtQkFBbUIsVUFBYSxlQUFlLE9BQU87QUFDNUUsZ0JBQU0sY0FBYyxnQkFBZ0IsSUFBSSxRQUFRLEtBQUs7QUFHckQsY0FBSSxlQUFlLGFBQWE7QUFDOUIsb0JBQVEsSUFBSSxtQ0FBbUMsS0FBSyxJQUFJLEVBQUU7QUFDMUQsbUJBQU8sRUFBRSxNQUFNLFVBQVU7QUFBQSxVQUMzQjtBQUVBLGNBQUksYUFBYTtBQUNmLGtCQUFNLGtCQUFrQixNQUFNLEtBQUssbUJBQW1CLGlCQUFpQixLQUFLLE1BQU0sUUFBUTtBQUMxRixnQkFBSSxpQkFBaUI7QUFDbkIsc0JBQVE7QUFBQSxnQkFDTixxQ0FBcUMsS0FBSyxJQUFJLFlBQVksZUFBZTtBQUFBLGNBQzNFO0FBQ0EscUJBQU8sRUFBRSxNQUFNLFVBQVU7QUFBQSxZQUMzQjtBQUFBLFVBQ0Y7QUFHQSxjQUFJLEtBQUssUUFBUSxlQUFlLEdBQUc7QUFDakMsa0JBQU0sSUFBSSxRQUFRLENBQUFDLGFBQVcsV0FBV0EsVUFBUyxLQUFLLFFBQVEsWUFBWSxDQUFDO0FBQUEsVUFDN0U7QUFHQSxnQkFBTSxlQUFlLE1BQU0sY0FBYyxLQUFLLE1BQU0sV0FBV0QsT0FBTTtBQUNyRSxjQUFJLENBQUMsYUFBYSxTQUFTO0FBQ3pCLGlCQUFLLGNBQWMsYUFBYSxRQUFRLGFBQWEsU0FBUyxJQUFJO0FBQ2xFLGdCQUFJLFVBQVU7QUFDWixvQkFBTSxLQUFLLG1CQUFtQixjQUFjLEtBQUssTUFBTSxVQUFVLGFBQWEsTUFBTTtBQUFBLFlBQ3RGO0FBQ0EsbUJBQU8sRUFBRSxNQUFNLFNBQVM7QUFBQSxVQUMxQjtBQUNBLGdCQUFNLFNBQVMsYUFBYTtBQUc1QixnQkFBTSxTQUFTLFVBQVUsT0FBTyxNQUFNLFdBQVcsWUFBWTtBQUM3RCxjQUFJLE9BQU8sV0FBVyxHQUFHO0FBQ3ZCLG9CQUFRLElBQUksMEJBQTBCLEtBQUssSUFBSSxFQUFFO0FBQ2pELGlCQUFLLGNBQWMscUJBQXFCLCtCQUErQixJQUFJO0FBQzNFLGdCQUFJLFVBQVU7QUFDWixvQkFBTSxLQUFLLG1CQUFtQixjQUFjLEtBQUssTUFBTSxVQUFVLG1CQUFtQjtBQUFBLFlBQ3RGO0FBQ0EsbUJBQU8sRUFBRSxNQUFNLFNBQVM7QUFBQSxVQUMxQjtBQUdBLGdCQUFNLGlCQUFrQyxDQUFDO0FBRXpDLG1CQUFTLElBQUksR0FBRyxJQUFJLE9BQU8sUUFBUSxLQUFLO0FBQ3RDLGtCQUFNLFFBQVEsT0FBTyxDQUFDO0FBRXRCLGdCQUFJO0FBRUYsb0JBQU0sa0JBQWtCLE1BQU0sZUFBZSxNQUFNLE1BQU0sSUFBSTtBQUM3RCxvQkFBTSxZQUFZLHNCQUFzQixnQkFBZ0IsU0FBUztBQUVqRSw2QkFBZSxLQUFLO0FBQUEsZ0JBQ2xCLElBQUksR0FBRyxRQUFRLElBQUksQ0FBQztBQUFBLGdCQUNwQixNQUFNLE1BQU07QUFBQSxnQkFDWixRQUFRO0FBQUEsZ0JBQ1IsVUFBVSxLQUFLO0FBQUEsZ0JBQ2YsVUFBVSxLQUFLO0FBQUEsZ0JBQ2Y7QUFBQSxnQkFDQSxZQUFZO0FBQUEsZ0JBQ1osVUFBVTtBQUFBLGtCQUNSLFdBQVcsS0FBSztBQUFBLGtCQUNoQixNQUFNLEtBQUs7QUFBQSxrQkFDWCxPQUFPLEtBQUssTUFBTSxZQUFZO0FBQUEsa0JBQzlCLFlBQVksTUFBTTtBQUFBLGtCQUNsQixVQUFVLE1BQU07QUFBQSxnQkFDbEI7QUFBQSxjQUNGLENBQUM7QUFBQSxZQUNILFNBQVMsT0FBTztBQUNkLHNCQUFRLE1BQU0seUJBQXlCLENBQUMsT0FBTyxLQUFLLElBQUksS0FBSyxLQUFLO0FBQUEsWUFDcEU7QUFBQSxVQUNGO0FBR0EsY0FBSSxlQUFlLFdBQVcsR0FBRztBQUMvQixpQkFBSztBQUFBLGNBQ0g7QUFBQSxjQUNBO0FBQUEsY0FDQTtBQUFBLFlBQ0Y7QUFDQSxnQkFBSSxVQUFVO0FBQ1osb0JBQU0sS0FBSyxtQkFBbUIsY0FBYyxLQUFLLE1BQU0sVUFBVSxtQkFBbUI7QUFBQSxZQUN0RjtBQUNBLG1CQUFPLEVBQUUsTUFBTSxTQUFTO0FBQUEsVUFDMUI7QUFFQSxjQUFJO0FBQ0Ysa0JBQU1ELGFBQVksVUFBVSxjQUFjO0FBQzFDLG9CQUFRLElBQUksV0FBVyxlQUFlLE1BQU0sZ0JBQWdCLEtBQUssSUFBSSxFQUFFO0FBQ3ZFLGdCQUFJLENBQUMsZ0JBQWdCO0FBQ25CLDRCQUFjLElBQUksS0FBSyxNQUFNLG9CQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUFBLFlBQ2xELE9BQU87QUFDTCw2QkFBZSxJQUFJLFFBQVE7QUFBQSxZQUM3QjtBQUNBLGtCQUFNLEtBQUssbUJBQW1CLGFBQWEsS0FBSyxJQUFJO0FBQ3BELG1CQUFPO0FBQUEsY0FDTCxNQUFNO0FBQUEsY0FDTixZQUFZLGdCQUFnQixZQUFZO0FBQUEsWUFDMUM7QUFBQSxVQUNGLFNBQVMsT0FBTztBQUNkLG9CQUFRLE1BQU0sMkJBQTJCLEtBQUssSUFBSSxLQUFLLEtBQUs7QUFDNUQsaUJBQUs7QUFBQSxjQUNIO0FBQUEsY0FDQSxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLO0FBQUEsY0FDckQ7QUFBQSxZQUNGO0FBQ0EsZ0JBQUksVUFBVTtBQUNaLG9CQUFNLEtBQUssbUJBQW1CLGNBQWMsS0FBSyxNQUFNLFVBQVUsd0JBQXdCO0FBQUEsWUFDM0Y7QUFDQSxtQkFBTyxFQUFFLE1BQU0sU0FBUztBQUFBLFVBQzFCO0FBQUEsUUFDRixTQUFTLE9BQU87QUFDVixrQkFBUSxNQUFNLHVCQUF1QixLQUFLLElBQUksS0FBSyxLQUFLO0FBQ3hELGVBQUs7QUFBQSxZQUNIO0FBQUEsWUFDQSxpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLO0FBQUEsWUFDckQ7QUFBQSxVQUNGO0FBQ0osY0FBSSxVQUFVO0FBQ1osa0JBQU0sS0FBSyxtQkFBbUIsY0FBYyxLQUFLLE1BQU0sVUFBVSx5QkFBeUI7QUFBQSxVQUM1RjtBQUNBLGlCQUFPLEVBQUUsTUFBTSxTQUFTO0FBQUEsUUFDMUI7QUFBQSxNQUNGO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFLQSxNQUFNLFlBQVksVUFBaUM7QUFDakQsY0FBTSxFQUFFLGFBQUFBLGFBQVksSUFBSSxLQUFLO0FBRTdCLFlBQUk7QUFDRixnQkFBTSxXQUFXLE1BQU0sa0JBQWtCLFFBQVE7QUFHakQsZ0JBQU1BLGFBQVksaUJBQWlCLFFBQVE7QUFHM0MsZ0JBQU0sT0FBb0I7QUFBQSxZQUN4QixNQUFNO0FBQUEsWUFDTixNQUFNLFNBQVMsTUFBTSxHQUFHLEVBQUUsSUFBSSxLQUFLO0FBQUEsWUFDbkMsV0FBVyxTQUFTLE1BQU0sR0FBRyxFQUFFLElBQUksS0FBSztBQUFBLFlBQ3hDLFVBQVU7QUFBQSxZQUNWLE1BQU07QUFBQSxZQUNOLE9BQU8sb0JBQUksS0FBSztBQUFBLFVBQ2xCO0FBRUEsZ0JBQU0sS0FBSyxVQUFVLElBQUk7QUFBQSxRQUMzQixTQUFTLE9BQU87QUFDZCxrQkFBUSxNQUFNLHlCQUF5QixRQUFRLEtBQUssS0FBSztBQUN6RCxnQkFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsTUFFUSxjQUFjLFFBQXVCLFNBQTZCLE1BQW1CO0FBQzNGLGNBQU0sVUFBVSxLQUFLLG9CQUFvQixNQUFNLEtBQUs7QUFDcEQsYUFBSyxvQkFBb0IsTUFBTSxJQUFJLFVBQVU7QUFDN0MsY0FBTSxlQUFlLFVBQVUsWUFBWSxPQUFPLEtBQUs7QUFDdkQsZ0JBQVE7QUFBQSxVQUNOLDRCQUE0QixLQUFLLElBQUksWUFBWSxNQUFNLFdBQVcsS0FBSyxvQkFBb0IsTUFBTSxDQUFDLElBQUksWUFBWTtBQUFBLFFBQ3BIO0FBQUEsTUFDRjtBQUFBLE1BRVEsb0JBQW9CO0FBQzFCLGNBQU0sVUFBVSxPQUFPLFFBQVEsS0FBSyxtQkFBbUI7QUFDdkQsWUFBSSxRQUFRLFdBQVcsR0FBRztBQUN4QixrQkFBUSxJQUFJLHdDQUF3QztBQUNwRDtBQUFBLFFBQ0Y7QUFDQSxnQkFBUSxJQUFJLGtDQUFrQztBQUM5QyxtQkFBVyxDQUFDLFFBQVEsS0FBSyxLQUFLLFNBQVM7QUFDckMsa0JBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxLQUFLLEVBQUU7QUFBQSxRQUN2QztBQUFBLE1BQ0Y7QUFBQSxNQUVBLE1BQWMsbUJBQW1CLFNBQXlCO0FBQ3hELGNBQU0sYUFBYSxLQUFLLFFBQVE7QUFDaEMsWUFBSSxDQUFDLFlBQVk7QUFDZjtBQUFBLFFBQ0Y7QUFFQSxjQUFNLFVBQVU7QUFBQSxVQUNkLEdBQUc7QUFBQSxVQUNILGNBQWMsS0FBSyxRQUFRO0FBQUEsVUFDM0IsZ0JBQWdCLEtBQUs7QUFBQSxVQUNyQixjQUFhLG9CQUFJLEtBQUssR0FBRSxZQUFZO0FBQUEsUUFDdEM7QUFFQSxZQUFJO0FBQ0YsZ0JBQVMsYUFBUyxNQUFXLGNBQVEsVUFBVSxHQUFHLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFDckUsZ0JBQVMsYUFBUyxVQUFVLFlBQVksS0FBSyxVQUFVLFNBQVMsTUFBTSxDQUFDLEdBQUcsT0FBTztBQUNqRixrQkFBUSxJQUFJLG9DQUFvQyxVQUFVLEVBQUU7QUFBQSxRQUM5RCxTQUFTLE9BQU87QUFDZCxrQkFBUSxNQUFNLDhDQUE4QyxVQUFVLEtBQUssS0FBSztBQUFBLFFBQ2xGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQTtBQUFBOzs7QUNoY0EsZUFBc0IsZUFBZTtBQUFBLEVBQ25DLFFBQUFHO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQSxlQUFlO0FBQUEsRUFDZixhQUFhO0FBQUEsRUFDYjtBQUNGLEdBQWtEO0FBQ2hELFFBQU1DLGVBQWMsdUJBQXVCLElBQUksWUFBWSxjQUFjO0FBQ3pFLFFBQU0sa0JBQWtCLHdCQUF3QjtBQUVoRCxNQUFJLGlCQUFpQjtBQUNuQixVQUFNQSxhQUFZLFdBQVc7QUFBQSxFQUMvQjtBQUVBLFFBQU0saUJBQWlCLE1BQU1ELFFBQU8sVUFBVTtBQUFBLElBQzVDO0FBQUEsSUFDQSxFQUFFLFFBQVEsWUFBWTtBQUFBLEVBQ3hCO0FBRUEsUUFBTSxlQUFlLElBQUksYUFBYTtBQUFBLElBQ3BDO0FBQUEsSUFDQSxhQUFBQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxRQUFBRDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBLGFBQWEsZUFBZSxRQUFRO0FBQUEsSUFDcEM7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBRUQsUUFBTSxpQkFBaUIsTUFBTSxhQUFhLE1BQU07QUFDaEQsUUFBTSxRQUFRLE1BQU1DLGFBQVksU0FBUztBQUV6QyxNQUFJLGlCQUFpQjtBQUNuQixVQUFNQSxhQUFZLE1BQU07QUFBQSxFQUMxQjtBQUVBLFFBQU0sVUFBVTtBQUFBO0FBQUEsK0JBQ2EsZUFBZSxlQUFlLElBQUksZUFBZSxVQUFVO0FBQUEsaUJBQ3pFLGVBQWUsV0FBVztBQUFBLDhCQUNiLGVBQWUsWUFBWTtBQUFBLGlDQUN4QixlQUFlLFlBQVk7QUFBQSwwQkFDbEMsZUFBZSxRQUFRO0FBQUEsMEJBQ3ZCLE1BQU0sV0FBVztBQUFBLGdDQUNYLE1BQU0sV0FBVztBQUUvQyxTQUFPO0FBQUEsSUFDTDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUNGO0FBaEdBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFBQTtBQUFBOzs7QUNTQSxTQUFTLGNBQWMsTUFBYyxXQUFtQixHQUFHLFdBQW1CLEtBQWE7QUFDekYsUUFBTSxRQUFRLEtBQUssTUFBTSxPQUFPLEVBQUUsT0FBTyxVQUFRLEtBQUssS0FBSyxNQUFNLEVBQUU7QUFDbkUsUUFBTSxlQUFlLE1BQU0sTUFBTSxHQUFHLFFBQVE7QUFDNUMsTUFBSSxVQUFVLGFBQWEsS0FBSyxJQUFJO0FBQ3BDLE1BQUksUUFBUSxTQUFTLFVBQVU7QUFDN0IsY0FBVSxRQUFRLE1BQU0sR0FBRyxRQUFRO0FBQUEsRUFDckM7QUFDQSxRQUFNLGdCQUNKLE1BQU0sU0FBUyxZQUNmLEtBQUssU0FBUyxRQUFRLFVBQ3RCLFFBQVEsV0FBVyxZQUFZLEtBQUssU0FBUztBQUMvQyxTQUFPLGdCQUFnQixHQUFHLFFBQVEsUUFBUSxDQUFDLFdBQU07QUFDbkQ7QUFPQSxlQUFlLHNCQUNiLEtBQ0EsYUFDZTtBQUNmLE1BQUk7QUFDRixVQUFNLGNBQWMsTUFBTSxJQUFJLFlBQVk7QUFDMUMsUUFDRSxDQUFDLGVBQ0QsRUFBRSx5QkFBeUIsZ0JBQzNCLE9BQU8sWUFBWSx3QkFBd0IsY0FDM0MsRUFBRSxpQkFBaUIsZ0JBQ25CLE9BQU8sWUFBWSxnQkFBZ0IsY0FDbkMsRUFBRSxzQkFBc0IsZ0JBQ3hCLE9BQU8sWUFBWSxxQkFBcUIsWUFDeEM7QUFDQSxjQUFRLEtBQUssaUZBQWlGO0FBQzlGO0FBQUEsSUFDRjtBQUVBLFVBQU0sQ0FBQyxlQUFlLE9BQU8sSUFBSSxNQUFNLFFBQVEsSUFBSTtBQUFBLE1BQ2pELFlBQVksaUJBQWlCO0FBQUEsTUFDN0IsSUFBSSxZQUFZO0FBQUEsSUFDbEIsQ0FBQztBQUNELFVBQU0sMkJBQTJCLFFBQVEsYUFBYTtBQUFBLE1BQ3BELE1BQU07QUFBQSxNQUNOLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFDRCxVQUFNLGtCQUFrQixNQUFNLFlBQVksb0JBQW9CLHdCQUF3QjtBQUN0RixVQUFNLGVBQWUsTUFBTSxZQUFZLFlBQVksZUFBZTtBQUVsRSxRQUFJLGVBQWUsZUFBZTtBQUNoQyxZQUFNLGlCQUNKLDZCQUFtQixhQUFhLGVBQWUsQ0FBQyw0QkFBNEIsY0FBYyxlQUFlLENBQUM7QUFDNUcsY0FBUSxLQUFLLFlBQVksY0FBYztBQUN2QyxVQUFJLGFBQWE7QUFBQSxRQUNmLFFBQVE7QUFBQSxRQUNSLE1BQU0sR0FBRyxjQUFjO0FBQUEsTUFDekIsQ0FBQztBQUNELFVBQUk7QUFDRixjQUFNLElBQUksT0FBTyxPQUFPLE9BQU87QUFBQSxVQUM3QixPQUFPO0FBQUEsVUFDUCxhQUFhLEdBQUcsY0FBYztBQUFBLFVBQzlCLGVBQWU7QUFBQSxRQUNqQixDQUFDO0FBQUEsTUFDSCxTQUFTLGFBQWE7QUFDcEIsZ0JBQVEsS0FBSywwREFBMEQsV0FBVztBQUFBLE1BQ3BGO0FBQUEsSUFDRjtBQUFBLEVBQ0YsU0FBUyxPQUFPO0FBQ2QsWUFBUSxLQUFLLDhDQUE4QyxLQUFLO0FBQUEsRUFDbEU7QUFDRjtBQUtBLGVBQXNCLFdBQ3BCLEtBQ0EsYUFDK0I7QUFDL0IsUUFBTSxhQUFhLFlBQVksUUFBUTtBQUN2QyxRQUFNLGVBQWUsSUFBSSxnQkFBZ0IsZ0JBQWdCO0FBR3pELFFBQU0sZUFBZSxhQUFhLElBQUksb0JBQW9CO0FBQzFELFFBQU0saUJBQWlCLGFBQWEsSUFBSSxzQkFBc0I7QUFDOUQsUUFBTSxpQkFBaUIsYUFBYSxJQUFJLGdCQUFnQjtBQUN4RCxRQUFNLHFCQUFxQixhQUFhLElBQUksNEJBQTRCO0FBQ3hFLFFBQU0sWUFBWSxhQUFhLElBQUksV0FBVztBQUM5QyxRQUFNLGVBQWUsYUFBYSxJQUFJLGNBQWM7QUFDcEQsUUFBTSxnQkFBZ0IsYUFBYSxJQUFJLG9CQUFvQjtBQUMzRCxRQUFNLFlBQVksYUFBYSxJQUFJLFdBQVc7QUFDOUMsUUFBTSx3QkFBd0IsYUFBYSxJQUFJLHFDQUFxQztBQUNwRixRQUFNLGVBQWUsYUFBYSxJQUFJLGNBQWMsS0FBSztBQUN6RCxRQUFNLG1CQUFtQixhQUFhLElBQUksdUJBQXVCO0FBR2pFLE1BQUksQ0FBQyxnQkFBZ0IsaUJBQWlCLElBQUk7QUFDeEMsWUFBUSxLQUFLLGdGQUFnRjtBQUM3RixXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUksQ0FBQyxrQkFBa0IsbUJBQW1CLElBQUk7QUFDNUMsWUFBUSxLQUFLLG1GQUFtRjtBQUNoRyxXQUFPO0FBQUEsRUFDVDtBQUVBLE1BQUk7QUFFRixRQUFJLENBQUMsb0JBQW9CO0FBQ3ZCLFlBQU0sY0FBYyxJQUFJLGFBQWE7QUFBQSxRQUNuQyxRQUFRO0FBQUEsUUFDUixNQUFNO0FBQUEsTUFDUixDQUFDO0FBRUQsWUFBTSxlQUFlLE1BQU0sb0JBQW9CLGNBQWMsY0FBYztBQUczRSxpQkFBVyxXQUFXLGFBQWEsVUFBVTtBQUMzQyxnQkFBUSxLQUFLLFlBQVksT0FBTztBQUFBLE1BQ2xDO0FBR0EsVUFBSSxDQUFDLGFBQWEsUUFBUTtBQUN4QixtQkFBVyxTQUFTLGFBQWEsUUFBUTtBQUN2QyxrQkFBUSxNQUFNLFlBQVksS0FBSztBQUFBLFFBQ2pDO0FBQ0EsY0FBTSxnQkFDSixhQUFhLE9BQU8sQ0FBQyxLQUNyQixhQUFhLFNBQVMsQ0FBQyxLQUN2QjtBQUNGLG9CQUFZLFNBQVM7QUFBQSxVQUNuQixRQUFRO0FBQUEsVUFDUixNQUFNLHlCQUF5QixhQUFhO0FBQUEsUUFDOUMsQ0FBQztBQUNELGVBQU87QUFBQSxNQUNUO0FBRUEsa0JBQVksU0FBUztBQUFBLFFBQ25CLFFBQVE7QUFBQSxRQUNSLE1BQU07QUFBQSxNQUNSLENBQUM7QUFDRCwyQkFBcUI7QUFBQSxJQUN2QjtBQUdBLFFBQUksQ0FBQyxlQUFlLG1CQUFtQixnQkFBZ0I7QUFDckQsWUFBTSxTQUFTLElBQUksYUFBYTtBQUFBLFFBQzlCLFFBQVE7QUFBQSxRQUNSLE1BQU07QUFBQSxNQUNSLENBQUM7QUFFRCxvQkFBYyxJQUFJLFlBQVksY0FBYztBQUM1QyxZQUFNLFlBQVksV0FBVztBQUM3QixjQUFRO0FBQUEsUUFDTixxQ0FBcUMsY0FBYztBQUFBLE1BQ3JEO0FBQ0EsdUJBQWlCO0FBRWpCLGFBQU8sU0FBUztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUFBLElBQ0g7QUFFQSxVQUFNLGtDQUFrQztBQUFBLE1BQ3RDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLHVCQUF1QixhQUFhLElBQUkscUNBQXFDO0FBQUEsSUFDL0UsQ0FBQztBQUdELFVBQU0sUUFBUSxNQUFNLFlBQVksU0FBUztBQUN6QyxZQUFRLE1BQU0sb0VBQW9FLE1BQU0sV0FBVyxpQkFBaUIsTUFBTSxXQUFXLEVBQUU7QUFFdkksUUFBSSxNQUFNLGdCQUFnQixHQUFHO0FBQzNCLFVBQUksQ0FBQyxpQkFBaUIsY0FBYyxHQUFHO0FBQ3JDLGdCQUFRLEtBQUssaUVBQWlFO0FBQUEsTUFDaEYsT0FBTztBQUNMLGNBQU0sY0FBYyxJQUFJLGFBQWE7QUFBQSxVQUNuQyxRQUFRO0FBQUEsVUFDUixNQUFNO0FBQUEsUUFDUixDQUFDO0FBRUQsWUFBSTtBQUNGLGdCQUFNLEVBQUUsZUFBZSxJQUFJLE1BQU0sZUFBZTtBQUFBLFlBQzlDLFFBQVEsSUFBSTtBQUFBLFlBQ1osYUFBYSxJQUFJO0FBQUEsWUFDakI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0EsYUFBYTtBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQSxjQUFjO0FBQUEsWUFDZCxZQUFZLENBQUMsYUFBYTtBQUN4QixrQkFBSSxTQUFTLFdBQVcsWUFBWTtBQUNsQyw0QkFBWSxTQUFTO0FBQUEsa0JBQ25CLFFBQVE7QUFBQSxrQkFDUixNQUFNLGFBQWEsU0FBUyxXQUFXO0FBQUEsZ0JBQ3pDLENBQUM7QUFBQSxjQUNILFdBQVcsU0FBUyxXQUFXLFlBQVk7QUFDekMsc0JBQU0sVUFBVSxTQUFTLG1CQUFtQjtBQUM1QyxzQkFBTSxTQUFTLFNBQVMsZUFBZTtBQUN2QyxzQkFBTSxVQUFVLFNBQVMsZ0JBQWdCO0FBQ3pDLDRCQUFZLFNBQVM7QUFBQSxrQkFDbkIsUUFBUTtBQUFBLGtCQUNSLE1BQU0sYUFBYSxTQUFTLGNBQWMsSUFBSSxTQUFTLFVBQVUsbUJBQ25ELE9BQU8sWUFBWSxNQUFNLGFBQWEsT0FBTyxNQUNyRCxTQUFTLFdBQVc7QUFBQSxnQkFDNUIsQ0FBQztBQUFBLGNBQ0gsV0FBVyxTQUFTLFdBQVcsWUFBWTtBQUN6Qyw0QkFBWSxTQUFTO0FBQUEsa0JBQ25CLFFBQVE7QUFBQSxrQkFDUixNQUFNLHNCQUFzQixTQUFTLGNBQWM7QUFBQSxnQkFDckQsQ0FBQztBQUFBLGNBQ0gsV0FBVyxTQUFTLFdBQVcsU0FBUztBQUN0Qyw0QkFBWSxTQUFTO0FBQUEsa0JBQ25CLFFBQVE7QUFBQSxrQkFDUixNQUFNLG1CQUFtQixTQUFTLEtBQUs7QUFBQSxnQkFDekMsQ0FBQztBQUFBLGNBQ0g7QUFBQSxZQUNGO0FBQUEsVUFDRixDQUFDO0FBRUQsa0JBQVEsSUFBSSwrQkFBK0IsZUFBZSxlQUFlLElBQUksZUFBZSxVQUFVLGdDQUFnQyxlQUFlLFdBQVcsVUFBVTtBQUFBLFFBQzVLLFNBQVMsT0FBTztBQUNkLHNCQUFZLFNBQVM7QUFBQSxZQUNuQixRQUFRO0FBQUEsWUFDUixNQUFNLG9CQUFvQixpQkFBaUIsUUFBUSxNQUFNLFVBQVUsT0FBTyxLQUFLLENBQUM7QUFBQSxVQUNsRixDQUFDO0FBQ0Qsa0JBQVEsTUFBTSw2QkFBNkIsS0FBSztBQUFBLFFBQ2xELFVBQUU7QUFDQSx5QkFBZTtBQUFBLFFBQ2pCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFHQSxVQUFNLG1CQUNKLDJCQUEyQixtQkFBbUIsT0FBTyxLQUFLLCtCQUM5Qix3QkFBd0IsT0FBTyxLQUFLO0FBQ2xFLFlBQVEsS0FBSyxZQUFZLGdCQUFnQixFQUFFO0FBQzNDLFFBQUksYUFBYTtBQUFBLE1BQ2YsUUFBUTtBQUFBLE1BQ1IsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUdELFVBQU0sa0JBQWtCLElBQUksYUFBYTtBQUFBLE1BQ3ZDLFFBQVE7QUFBQSxNQUNSLE1BQU07QUFBQSxJQUNSLENBQUM7QUFFRCxVQUFNLGlCQUFpQixNQUFNLElBQUksT0FBTyxVQUFVO0FBQUEsTUFDaEQ7QUFBQSxNQUNBLEVBQUUsUUFBUSxJQUFJLFlBQVk7QUFBQSxJQUM1QjtBQUVBLG9CQUFnQixTQUFTO0FBQUEsTUFDdkIsUUFBUTtBQUFBLE1BQ1IsTUFBTTtBQUFBLElBQ1IsQ0FBQztBQUdELFVBQU0sdUJBQXVCLE1BQU0sZUFBZSxNQUFNLFVBQVU7QUFDbEUsVUFBTSxpQkFBaUIscUJBQXFCO0FBRzVDLFVBQU0sZUFDSixXQUFXLFNBQVMsTUFBTSxHQUFHLFdBQVcsTUFBTSxHQUFHLEdBQUcsQ0FBQyxRQUFRO0FBQy9ELFlBQVE7QUFBQSxNQUNOLHlDQUF5QyxZQUFZLFlBQVksY0FBYyxlQUFlLGtCQUFrQjtBQUFBLElBQ2xIO0FBQ0EsVUFBTSxVQUFVLE1BQU0sWUFBWTtBQUFBLE1BQ2hDO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQ0EsUUFBSSxRQUFRLFNBQVMsR0FBRztBQUN0QixZQUFNLFNBQVMsUUFBUSxDQUFDO0FBQ3hCLGNBQVE7QUFBQSxRQUNOLG1DQUFtQyxRQUFRLE1BQU0sMkJBQTJCLE9BQU8sUUFBUSxVQUFVLE9BQU8sTUFBTSxRQUFRLENBQUMsQ0FBQztBQUFBLE1BQzlIO0FBRUEsWUFBTSxlQUFlLFFBQ2xCO0FBQUEsUUFDQyxDQUFDLFFBQVEsUUFDUCxJQUFJLE1BQU0sQ0FBQyxTQUFjLGVBQVMsT0FBTyxRQUFRLENBQUMsVUFBVSxPQUFPLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFBQSxNQUN2RixFQUNDLEtBQUssSUFBSTtBQUNaLGNBQVEsS0FBSztBQUFBLEVBQWlDLFlBQVksRUFBRTtBQUFBLElBQzlELE9BQU87QUFDTCxjQUFRLEtBQUssNENBQTRDO0FBQUEsSUFDM0Q7QUFFQSxRQUFJLFFBQVEsV0FBVyxHQUFHO0FBQ3hCLHNCQUFnQixTQUFTO0FBQUEsUUFDdkIsUUFBUTtBQUFBLFFBQ1IsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUVELFlBQU0scUJBQ0o7QUFJRixhQUFPLHFCQUFxQjtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBQXNCLFVBQVU7QUFBQSxJQUM5RDtBQUdBLG9CQUFnQixTQUFTO0FBQUEsTUFDdkIsUUFBUTtBQUFBLE1BQ1IsTUFBTSxhQUFhLFFBQVEsTUFBTTtBQUFBLElBQ25DLENBQUM7QUFFRCxRQUFJLE1BQU0sc0JBQXNCLE9BQU87QUFFdkMsUUFBSSxtQkFBbUI7QUFDdkIsUUFBSSxtQkFBbUI7QUFDdkIsVUFBTSxTQUFTO0FBQ2Ysd0JBQW9CO0FBQ3BCLHdCQUFvQjtBQUVwQixRQUFJLGlCQUFpQjtBQUNyQixlQUFXLFVBQVUsU0FBUztBQUM1QixZQUFNLFdBQWdCLGVBQVMsT0FBTyxRQUFRO0FBQzlDLFlBQU0sZ0JBQWdCLFlBQVksY0FBYyxVQUFVLFFBQVEsWUFBWSxPQUFPLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFDckcsMEJBQW9CO0FBQUEsRUFBSyxhQUFhLElBQUksT0FBTyxJQUFJO0FBQUE7QUFBQTtBQUNyRCwwQkFBb0I7QUFBQSxFQUFLLGFBQWEsSUFBSSxjQUFjLE9BQU8sSUFBSSxDQUFDO0FBQUE7QUFBQTtBQUNwRTtBQUFBLElBQ0Y7QUFPQSxVQUFNLFNBQ0o7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUVzQixVQUFVO0FBQ2xDLHdCQUFvQjtBQUNwQix3QkFBb0I7QUFFcEIsUUFBSSxNQUFNLGdDQUFnQyxnQkFBZ0I7QUFFMUQsVUFBTSxxQkFBcUIsUUFBUSxJQUFJLENBQUMsUUFBUSxRQUFRO0FBQ3RELFlBQU0sV0FBZ0IsZUFBUyxPQUFPLFFBQVE7QUFDOUMsYUFBTyxJQUFJLE1BQU0sQ0FBQyxTQUFTLFFBQVEsVUFBVSxPQUFPLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFBQSxFQUFLLGNBQWMsT0FBTyxJQUFJLENBQUM7QUFBQSxJQUNyRyxDQUFDO0FBQ0QsVUFBTSxjQUFjLG1CQUFtQixLQUFLLE1BQU07QUFFbEQsWUFBUSxLQUFLLDBCQUEwQixRQUFRLE1BQU07QUFBQSxFQUFlLFdBQVcsRUFBRTtBQUNqRixRQUFJLGFBQWE7QUFBQSxNQUNmLFFBQVE7QUFBQSxNQUNSLE1BQU0saUJBQWlCLFFBQVEsTUFBTTtBQUFBLElBQ3ZDLENBQUM7QUFDRCxlQUFXLFNBQVMsb0JBQW9CO0FBQ3RDLFVBQUksYUFBYTtBQUFBLFFBQ2YsUUFBUTtBQUFBLFFBQ1IsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUFBLElBQ0g7QUFFQSxZQUFRLEtBQUs7QUFBQSxFQUFtRCxnQkFBZ0IsRUFBRTtBQUNsRixRQUFJLGFBQWE7QUFBQSxNQUNmLFFBQVE7QUFBQSxNQUNSLE1BQU07QUFBQSxFQUEwQyxnQkFBZ0I7QUFBQSxJQUNsRSxDQUFDO0FBRUQsVUFBTSxzQkFBc0IsS0FBSyxnQkFBZ0I7QUFFakQsV0FBTztBQUFBLEVBQ1QsU0FBUyxPQUFPO0FBQ2QsWUFBUSxNQUFNLDhDQUE4QyxLQUFLO0FBQ2pFLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFlQSxlQUFlLGtDQUFrQztBQUFBLEVBQy9DO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQ0YsR0FBc0I7QUFDcEIsTUFBSSxDQUFDLGtCQUFrQjtBQUNyQjtBQUFBLEVBQ0Y7QUFFQSxRQUFNLGVBQ0osNEVBQTRFLHdCQUF3QixPQUFPLEtBQUs7QUFFbEgsVUFBUSxLQUFLLFlBQVksWUFBWSxFQUFFO0FBQ3ZDLE1BQUksYUFBYTtBQUFBLElBQ2YsUUFBUTtBQUFBLElBQ1IsTUFBTTtBQUFBLEVBQ1IsQ0FBQztBQUVELE1BQUksQ0FBQyxpQkFBaUIsZ0JBQWdCLEdBQUc7QUFDdkMsUUFBSSxhQUFhO0FBQUEsTUFDZixRQUFRO0FBQUEsTUFDUixNQUFNO0FBQUEsSUFDUixDQUFDO0FBQ0Q7QUFBQSxFQUNGO0FBRUEsUUFBTSxTQUFTLElBQUksYUFBYTtBQUFBLElBQzlCLFFBQVE7QUFBQSxJQUNSLE1BQU07QUFBQSxFQUNSLENBQUM7QUFFRCxNQUFJO0FBQ0YsVUFBTSxFQUFFLGVBQWUsSUFBSSxNQUFNLGVBQWU7QUFBQSxNQUM5QyxRQUFRLElBQUk7QUFBQSxNQUNaLGFBQWEsSUFBSTtBQUFBLE1BQ2pCO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBLGFBQWE7QUFBQSxNQUNiO0FBQUEsTUFDQSxjQUFjLENBQUM7QUFBQSxNQUNmLGFBQWEsZUFBZTtBQUFBLE1BQzVCLFlBQVksQ0FBQyxhQUFhO0FBQ3hCLFlBQUksU0FBUyxXQUFXLFlBQVk7QUFDbEMsaUJBQU8sU0FBUztBQUFBLFlBQ2QsUUFBUTtBQUFBLFlBQ1IsTUFBTSxhQUFhLFNBQVMsV0FBVztBQUFBLFVBQ3pDLENBQUM7QUFBQSxRQUNILFdBQVcsU0FBUyxXQUFXLFlBQVk7QUFDekMsZ0JBQU0sVUFBVSxTQUFTLG1CQUFtQjtBQUM1QyxnQkFBTSxTQUFTLFNBQVMsZUFBZTtBQUN2QyxnQkFBTSxVQUFVLFNBQVMsZ0JBQWdCO0FBQ3pDLGlCQUFPLFNBQVM7QUFBQSxZQUNkLFFBQVE7QUFBQSxZQUNSLE1BQU0sYUFBYSxTQUFTLGNBQWMsSUFBSSxTQUFTLFVBQVUsbUJBQ25ELE9BQU8sWUFBWSxNQUFNLGFBQWEsT0FBTyxNQUNyRCxTQUFTLFdBQVc7QUFBQSxVQUM1QixDQUFDO0FBQUEsUUFDSCxXQUFXLFNBQVMsV0FBVyxZQUFZO0FBQ3pDLGlCQUFPLFNBQVM7QUFBQSxZQUNkLFFBQVE7QUFBQSxZQUNSLE1BQU0sc0JBQXNCLFNBQVMsY0FBYztBQUFBLFVBQ3JELENBQUM7QUFBQSxRQUNILFdBQVcsU0FBUyxXQUFXLFNBQVM7QUFDdEMsaUJBQU8sU0FBUztBQUFBLFlBQ2QsUUFBUTtBQUFBLFlBQ1IsTUFBTSxtQkFBbUIsU0FBUyxLQUFLO0FBQUEsVUFDekMsQ0FBQztBQUFBLFFBQ0g7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTyxTQUFTO0FBQUEsTUFDZCxRQUFRO0FBQUEsTUFDUixNQUFNO0FBQUEsSUFDUixDQUFDO0FBRUQsVUFBTSxlQUFlO0FBQUEsTUFDbkIsY0FBYyxlQUFlLGVBQWUsSUFBSSxlQUFlLFVBQVU7QUFBQSxNQUN6RSxXQUFXLGVBQWUsV0FBVztBQUFBLE1BQ3JDLHdCQUF3QixlQUFlLFlBQVk7QUFBQSxNQUNuRCwyQkFBMkIsZUFBZSxZQUFZO0FBQUEsTUFDdEQsb0JBQW9CLGVBQWUsUUFBUTtBQUFBLElBQzdDO0FBQ0EsZUFBVyxRQUFRLGNBQWM7QUFDL0IsVUFBSSxhQUFhO0FBQUEsUUFDZixRQUFRO0FBQUEsUUFDUixNQUFNO0FBQUEsTUFDUixDQUFDO0FBQUEsSUFDSDtBQUVBLFFBQUksZUFBZSxhQUFhLEtBQUssZUFBZSxpQkFBaUIsZUFBZSxZQUFZO0FBQzlGLFVBQUksYUFBYTtBQUFBLFFBQ2YsUUFBUTtBQUFBLFFBQ1IsTUFBTTtBQUFBLE1BQ1IsQ0FBQztBQUFBLElBQ0g7QUFFQSxZQUFRO0FBQUEsTUFDTjtBQUFBLElBQXVDLGFBQWEsS0FBSyxNQUFNLENBQUM7QUFBQSxJQUNsRTtBQUVBLFVBQU0sd0JBQXdCLEdBQUc7QUFBQSxFQUNuQyxTQUFTLE9BQU87QUFDZCxXQUFPLFNBQVM7QUFBQSxNQUNkLFFBQVE7QUFBQSxNQUNSLE1BQU0sMEJBQTBCLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUssQ0FBQztBQUFBLElBQ3hGLENBQUM7QUFDRCxZQUFRLE1BQU0sbUNBQW1DLEtBQUs7QUFBQSxFQUN4RCxVQUFFO0FBQ0EsbUJBQWU7QUFBQSxFQUNqQjtBQUNGO0FBRUEsZUFBZSx3QkFBd0IsS0FBbUM7QUFDeEUsTUFBSTtBQUNGLFVBQU0sSUFBSSxPQUFPLE9BQU8sT0FBTztBQUFBLE1BQzdCLE9BQU87QUFBQSxNQUNQLGFBQ0U7QUFBQSxJQUNKLENBQUM7QUFBQSxFQUNILFNBQVMsT0FBTztBQUNkLFlBQVEsS0FBSyxvRUFBb0UsS0FBSztBQUFBLEVBQ3hGO0FBQ0Y7QUFuaUJBLElBUUFDLE9Ba0JJLGFBQ0EsZ0JBQ0E7QUE1Qko7QUFBQTtBQUFBO0FBSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFBQSxRQUFzQjtBQUN0QjtBQWlCQSxJQUFJLGNBQWtDO0FBQ3RDLElBQUksaUJBQWlCO0FBQ3JCLElBQUkscUJBQXFCO0FBQUE7QUFBQTs7O0FDNUJ6QjtBQUFBO0FBQUE7QUFBQTtBQVFBLGVBQXNCLEtBQUssU0FBd0I7QUFFakQsVUFBUSxxQkFBcUIsZ0JBQWdCO0FBRzdDLFVBQVEsdUJBQXVCLFVBQVU7QUFFekMsVUFBUSxJQUFJLDBDQUEwQztBQUN4RDtBQWhCQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQUE7QUFBQTs7O0FDRkEsSUFBQUMsY0FBbUQ7QUFLbkQsSUFBTSxtQkFBbUIsUUFBUSxJQUFJO0FBQ3JDLElBQU0sZ0JBQWdCLFFBQVEsSUFBSTtBQUNsQyxJQUFNLFVBQVUsUUFBUSxJQUFJO0FBRTVCLElBQU0sU0FBUyxJQUFJLDJCQUFlO0FBQUEsRUFDaEM7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUNGLENBQUM7QUFFQSxXQUFtQix1QkFBdUI7QUFFM0MsSUFBSSwyQkFBMkI7QUFDL0IsSUFBSSx3QkFBd0I7QUFDNUIsSUFBSSxzQkFBc0I7QUFDMUIsSUFBSSw0QkFBNEI7QUFDaEMsSUFBSSxtQkFBbUI7QUFDdkIsSUFBSSxlQUFlO0FBRW5CLElBQU0sdUJBQXVCLE9BQU8sUUFBUSx3QkFBd0I7QUFFcEUsSUFBTSxnQkFBK0I7QUFBQSxFQUNuQywyQkFBMkIsQ0FBQyxhQUFhO0FBQ3ZDLFFBQUksMEJBQTBCO0FBQzVCLFlBQU0sSUFBSSxNQUFNLDBDQUEwQztBQUFBLElBQzVEO0FBQ0EsUUFBSSxrQkFBa0I7QUFDcEIsWUFBTSxJQUFJLE1BQU0sNERBQTREO0FBQUEsSUFDOUU7QUFFQSwrQkFBMkI7QUFDM0IseUJBQXFCLHlCQUF5QixRQUFRO0FBQ3RELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSx3QkFBd0IsQ0FBQ0MsZ0JBQWU7QUFDdEMsUUFBSSx1QkFBdUI7QUFDekIsWUFBTSxJQUFJLE1BQU0sdUNBQXVDO0FBQUEsSUFDekQ7QUFDQSw0QkFBd0I7QUFDeEIseUJBQXFCLHNCQUFzQkEsV0FBVTtBQUNyRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0Esc0JBQXNCLENBQUNDLHNCQUFxQjtBQUMxQyxRQUFJLHFCQUFxQjtBQUN2QixZQUFNLElBQUksTUFBTSxzQ0FBc0M7QUFBQSxJQUN4RDtBQUNBLDBCQUFzQjtBQUN0Qix5QkFBcUIsb0JBQW9CQSxpQkFBZ0I7QUFDekQsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLDRCQUE0QixDQUFDLDJCQUEyQjtBQUN0RCxRQUFJLDJCQUEyQjtBQUM3QixZQUFNLElBQUksTUFBTSw2Q0FBNkM7QUFBQSxJQUMvRDtBQUNBLGdDQUE0QjtBQUM1Qix5QkFBcUIsMEJBQTBCLHNCQUFzQjtBQUNyRSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsbUJBQW1CLENBQUMsa0JBQWtCO0FBQ3BDLFFBQUksa0JBQWtCO0FBQ3BCLFlBQU0sSUFBSSxNQUFNLG1DQUFtQztBQUFBLElBQ3JEO0FBQ0EsUUFBSSwwQkFBMEI7QUFDNUIsWUFBTSxJQUFJLE1BQU0sNERBQTREO0FBQUEsSUFDOUU7QUFFQSx1QkFBbUI7QUFDbkIseUJBQXFCLGlCQUFpQixhQUFhO0FBQ25ELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxlQUFlLENBQUMsY0FBYztBQUM1QixRQUFJLGNBQWM7QUFDaEIsWUFBTSxJQUFJLE1BQU0sOEJBQThCO0FBQUEsSUFDaEQ7QUFFQSxtQkFBZTtBQUNmLHlCQUFxQixhQUFhLFNBQVM7QUFDM0MsV0FBTztBQUFBLEVBQ1Q7QUFDRjtBQUVBLHdEQUE0QixLQUFLLE9BQU1DLFlBQVU7QUFDL0MsU0FBTyxNQUFNQSxRQUFPLEtBQUssYUFBYTtBQUN4QyxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ1osdUJBQXFCLGNBQWM7QUFDckMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxVQUFVO0FBQ2xCLFVBQVEsTUFBTSxvREFBb0Q7QUFDbEUsVUFBUSxNQUFNLEtBQUs7QUFDckIsQ0FBQzsiLAogICJuYW1lcyI6IFsiZnMiLCAiZnMiLCAicGF0aCIsICJmcyIsICJjbGllbnQiLCAicmVzb2x2ZSIsICJwZGZQYXJzZSIsICJmcyIsICJyZXNvbHZlIiwgImltcG9ydF90ZXNzZXJhY3QiLCAiZnMiLCAiY2xpZW50IiwgInBhdGgiLCAiY2h1bmtUZXh0IiwgInJlc29sdmUiLCAiZnMiLCAiZnMiLCAicGF0aCIsICJmcyIsICJwYXRoIiwgIlBRdWV1ZSIsICJ2ZWN0b3JTdG9yZSIsICJjbGllbnQiLCAicmVzb2x2ZSIsICJjbGllbnQiLCAidmVjdG9yU3RvcmUiLCAicGF0aCIsICJpbXBvcnRfc2RrIiwgInByZXByb2Nlc3MiLCAiY29uZmlnU2NoZW1hdGljcyIsICJtb2R1bGUiXQp9Cg==
