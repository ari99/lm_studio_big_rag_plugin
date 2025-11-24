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
  if (freeMemoryGB < 0.5) {
    errors.push(`Very low free memory: ${freeMemoryGB.toFixed(2)} GB`);
  } else if (freeMemoryGB < 2) {
    warnings.push(
      `Low free memory: ${freeMemoryGB.toFixed(2)} GB of ${totalMemoryGB.toFixed(2)} GB total. Consider reducing concurrent file processing.`
    );
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
var import_p_queue, fs8, path4, IndexManager;
var init_indexManager = __esm({
  "src/ingestion/indexManager.ts"() {
    "use strict";
    import_p_queue = __toESM(require("p-queue"));
    fs8 = __toESM(require("fs"));
    path4 = __toESM(require("path"));
    init_fileScanner();
    init_documentParser();
    init_textChunker();
    init_fileHash();
    IndexManager = class {
      constructor(options) {
        this.failureReasonCounts = {};
        this.options = options;
        this.queue = new import_p_queue.default({ concurrency: options.maxConcurrent });
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
              currentFile: "",
              status: "indexing"
            });
          }
          const tasks = files.map(
            (file) => this.queue.add(async () => {
              let outcome = { type: "failed" };
              try {
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
                  failedFiles: failCount
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
              failedFiles: failCount
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
        try {
          const fileHash = await calculateFileHash(file.path);
          const existingHashes = fileInventory.get(file.path);
          const hasSeenBefore = existingHashes !== void 0 && existingHashes.size > 0;
          const hasSameHash = existingHashes?.has(fileHash) ?? false;
          if (autoReindex && hasSameHash) {
            console.log(`File already indexed (skipped): ${file.name}`);
            return { type: "skipped" };
          }
          if (this.options.parseDelayMs > 0) {
            await new Promise((resolve2) => setTimeout(resolve2, this.options.parseDelayMs));
          }
          const parsedResult = await parseDocument(file.path, enableOCR, client2);
          if (!parsedResult.success) {
            this.recordFailure(parsedResult.reason, parsedResult.details, file);
            return { type: "failed" };
          }
          const parsed = parsedResult.document;
          const chunks = chunkText(parsed.text, chunkSize, chunkOverlap);
          if (chunks.length === 0) {
            console.log(`No chunks created from ${file.name}`);
            this.recordFailure("index.chunk-empty", "chunkText produced 0 chunks", file);
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
            return { type: "failed" };
          }
        } catch (error) {
          console.error(`Error indexing file ${file.path}:`, error);
          this.recordFailure(
            "parser.unexpected-error",
            error instanceof Error ? error.message : String(error),
            file
          );
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
          await fs8.promises.mkdir(path4.dirname(reportPath), { recursive: true });
          await fs8.promises.writeFile(reportPath, JSON.stringify(payload, null, 2), "utf-8");
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
        checkStatus.setState({
          status: "canceled",
          text: "Sanity checks failed. Please check configuration."
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
                indexStatus.setState({
                  status: "loading",
                  text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (success=${progress.successfulFiles ?? 0}, failed=${progress.failedFiles ?? 0}) (${progress.currentFile})`
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
        (result, idx) => `#${idx + 1} file=${path5.basename(result.filePath)} score=${result.score.toFixed(3)}`
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
      const fileName = path5.basename(result.filePath);
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
      const fileName = path5.basename(result.filePath);
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
  const reminderText = "Manual Reindex Trigger is ON. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files.";
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
          status.setState({
            status: "loading",
            text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (success=${progress.successfulFiles ?? 0}, failed=${progress.failedFiles ?? 0}) (${progress.currentFile})`
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
var path5, vectorStore, lastIndexedDir, sanityChecksPassed;
var init_promptPreprocessor = __esm({
  "src/promptPreprocessor.ts"() {
    "use strict";
    init_config();
    init_vectorStore();
    init_sanityChecks();
    init_indexingLock();
    path5 = __toESM(require("path"));
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL2NvbmZpZy50cyIsICIuLi9zcmMvdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmUudHMiLCAiLi4vc3JjL3V0aWxzL3Nhbml0eUNoZWNrcy50cyIsICIuLi9zcmMvdXRpbHMvaW5kZXhpbmdMb2NrLnRzIiwgIi4uL3NyYy91dGlscy9zdXBwb3J0ZWRFeHRlbnNpb25zLnRzIiwgIi4uL3NyYy9pbmdlc3Rpb24vZmlsZVNjYW5uZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvaHRtbFBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9wZGZQYXJzZXIudHMiLCAiLi4vc3JjL3BhcnNlcnMvZXB1YlBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy9pbWFnZVBhcnNlci50cyIsICIuLi9zcmMvcGFyc2Vycy90ZXh0UGFyc2VyLnRzIiwgIi4uL3NyYy9wYXJzZXJzL2RvY3VtZW50UGFyc2VyLnRzIiwgIi4uL3NyYy91dGlscy90ZXh0Q2h1bmtlci50cyIsICIuLi9zcmMvdXRpbHMvZmlsZUhhc2gudHMiLCAiLi4vc3JjL2luZ2VzdGlvbi9pbmRleE1hbmFnZXIudHMiLCAiLi4vc3JjL2luZ2VzdGlvbi9ydW5JbmRleGluZy50cyIsICIuLi9zcmMvcHJvbXB0UHJlcHJvY2Vzc29yLnRzIiwgIi4uL3NyYy9pbmRleC50cyIsICJlbnRyeS50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgY3JlYXRlQ29uZmlnU2NoZW1hdGljcyB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5cbmV4cG9ydCBjb25zdCBjb25maWdTY2hlbWF0aWNzID0gY3JlYXRlQ29uZmlnU2NoZW1hdGljcygpXG4gIC5maWVsZChcbiAgICBcImRvY3VtZW50c0RpcmVjdG9yeVwiLFxuICAgIFwic3RyaW5nXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiRG9jdW1lbnRzIERpcmVjdG9yeVwiLFxuICAgICAgc3VidGl0bGU6IFwiUm9vdCBkaXJlY3RvcnkgY29udGFpbmluZyBkb2N1bWVudHMgdG8gaW5kZXguIEFsbCBzdWJkaXJlY3RvcmllcyB3aWxsIGJlIHNjYW5uZWQuXCIsXG4gICAgICBwbGFjZWhvbGRlcjogXCIvcGF0aC90by9kb2N1bWVudHNcIixcbiAgICB9LFxuICAgIFwiXCIsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwidmVjdG9yU3RvcmVEaXJlY3RvcnlcIixcbiAgICBcInN0cmluZ1wiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlZlY3RvciBTdG9yZSBEaXJlY3RvcnlcIixcbiAgICAgIHN1YnRpdGxlOiBcIkRpcmVjdG9yeSB3aGVyZSB0aGUgdmVjdG9yIGRhdGFiYXNlIHdpbGwgYmUgc3RvcmVkLlwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiL3BhdGgvdG8vdmVjdG9yL3N0b3JlXCIsXG4gICAgfSxcbiAgICBcIlwiLFxuICApXG4gIC5maWVsZChcbiAgICBcInJldHJpZXZhbExpbWl0XCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAxLFxuICAgICAgbWF4OiAyMCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIlJldHJpZXZhbCBMaW1pdFwiLFxuICAgICAgc3VidGl0bGU6IFwiTWF4aW11bSBudW1iZXIgb2YgY2h1bmtzIHRvIHJldHVybiBkdXJpbmcgcmV0cmlldmFsLlwiLFxuICAgICAgc2xpZGVyOiB7IG1pbjogMSwgbWF4OiAyMCwgc3RlcDogMSB9LFxuICAgIH0sXG4gICAgNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiLFxuICAgIFwibnVtZXJpY1wiLFxuICAgIHtcbiAgICAgIG1pbjogMC4wLFxuICAgICAgbWF4OiAxLjAsXG4gICAgICBkaXNwbGF5TmFtZTogXCJSZXRyaWV2YWwgQWZmaW5pdHkgVGhyZXNob2xkXCIsXG4gICAgICBzdWJ0aXRsZTogXCJNaW5pbXVtIHNpbWlsYXJpdHkgc2NvcmUgZm9yIGEgY2h1bmsgdG8gYmUgY29uc2lkZXJlZCByZWxldmFudC5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDAuMCwgbWF4OiAxLjAsIHN0ZXA6IDAuMDEgfSxcbiAgICB9LFxuICAgIDAuNSxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJjaHVua1NpemVcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEyOCxcbiAgICAgIG1heDogMjA0OCxcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNodW5rIFNpemVcIixcbiAgICAgIHN1YnRpdGxlOiBcIlNpemUgb2YgdGV4dCBjaHVua3MgZm9yIGVtYmVkZGluZyAoaW4gdG9rZW5zKS5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEyOCwgbWF4OiAyMDQ4LCBzdGVwOiAxMjggfSxcbiAgICB9LFxuICAgIDUxMixcbiAgKVxuICAuZmllbGQoXG4gICAgXCJjaHVua092ZXJsYXBcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDAsXG4gICAgICBtYXg6IDUxMixcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkNodW5rIE92ZXJsYXBcIixcbiAgICAgIHN1YnRpdGxlOiBcIk92ZXJsYXAgYmV0d2VlbiBjb25zZWN1dGl2ZSBjaHVua3MgKGluIHRva2VucykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLCBtYXg6IDUxMiwgc3RlcDogMzIgfSxcbiAgICB9LFxuICAgIDEwMCxcbiAgKVxuICAuZmllbGQoXG4gICAgXCJtYXhDb25jdXJyZW50RmlsZXNcIixcbiAgICBcIm51bWVyaWNcIixcbiAgICB7XG4gICAgICBpbnQ6IHRydWUsXG4gICAgICBtaW46IDEsXG4gICAgICBtYXg6IDEwLFxuICAgICAgZGlzcGxheU5hbWU6IFwiTWF4IENvbmN1cnJlbnQgRmlsZXNcIixcbiAgICAgIHN1YnRpdGxlOiBcIk1heGltdW0gbnVtYmVyIG9mIGZpbGVzIHRvIHByb2Nlc3MgY29uY3VycmVudGx5IGR1cmluZyBpbmRleGluZy4gUmVjb21tZW5kIDEgZm9yIGxhcmdlIFBERiBkYXRhc2V0cy5cIixcbiAgICAgIHNsaWRlcjogeyBtaW46IDEsIG1heDogMTAsIHN0ZXA6IDEgfSxcbiAgICB9LFxuICAgIDEsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwicGFyc2VEZWxheU1zXCIsXG4gICAgXCJudW1lcmljXCIsXG4gICAge1xuICAgICAgaW50OiB0cnVlLFxuICAgICAgbWluOiAwLFxuICAgICAgbWF4OiA1MDAwLFxuICAgICAgZGlzcGxheU5hbWU6IFwiUGFyc2VyIERlbGF5IChtcylcIixcbiAgICAgIHN1YnRpdGxlOiBcIldhaXQgdGltZSBiZWZvcmUgcGFyc2luZyBlYWNoIGRvY3VtZW50IChoZWxwcyBhdm9pZCBXZWJTb2NrZXQgdGhyb3R0bGluZykuXCIsXG4gICAgICBzbGlkZXI6IHsgbWluOiAwLCBtYXg6IDUwMDAsIHN0ZXA6IDEwMCB9LFxuICAgIH0sXG4gICAgNTAwLFxuICApXG4gIC5maWVsZChcbiAgICBcImVuYWJsZU9DUlwiLFxuICAgIFwiYm9vbGVhblwiLFxuICAgIHtcbiAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBPQ1JcIixcbiAgICAgIHN1YnRpdGxlOiBcIkVuYWJsZSBPQ1IgZm9yIGltYWdlIGZpbGVzIGFuZCBpbWFnZS1iYXNlZCBQREZzIHVzaW5nIExNIFN0dWRpbydzIGJ1aWx0LWluIGRvY3VtZW50IHBhcnNlci5cIixcbiAgICB9LFxuICAgIHRydWUsXG4gIClcbiAgLmZpZWxkKFxuICAgIFwibWFudWFsUmVpbmRleC50cmlnZ2VyXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiTWFudWFsIFJlaW5kZXggVHJpZ2dlclwiLFxuICAgICAgc3VidGl0bGU6XG4gICAgICAgIFwiVG9nZ2xlIE9OIHRvIHJlcXVlc3QgYW4gaW1tZWRpYXRlIHJlaW5kZXguIFRoZSBwbHVnaW4gcmVzZXRzIHRoaXMgYWZ0ZXIgcnVubmluZy4gVXNlIHRoZSBcdTIwMUNTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlc1x1MjAxRCBvcHRpb24gYmVsb3cgdG8gY29udHJvbCB3aGV0aGVyIHVuY2hhbmdlZCBmaWxlcyBhcmUgc2tpcHBlZC5cIixcbiAgICB9LFxuICAgIGZhbHNlLFxuICApXG4gIC5maWVsZChcbiAgICBcIm1hbnVhbFJlaW5kZXguc2tpcFByZXZpb3VzbHlJbmRleGVkXCIsXG4gICAgXCJib29sZWFuXCIsXG4gICAge1xuICAgICAgZGlzcGxheU5hbWU6IFwiU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXNcIixcbiAgICAgIHN1YnRpdGxlOiBcIlNraXAgdW5jaGFuZ2VkIGZpbGVzIGZvciBmYXN0ZXIgbWFudWFsIHJ1bnMuIE9ubHkgaW5kZXhlcyBuZXcgZmlsZXMgb3IgY2hhbmdlZCBmaWxlcy5cIixcbiAgICAgIGRlcGVuZGVuY2llczogW1xuICAgICAgICB7XG4gICAgICAgICAga2V5OiBcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiLFxuICAgICAgICAgIGNvbmRpdGlvbjogeyB0eXBlOiBcImVxdWFsc1wiLCB2YWx1ZTogdHJ1ZSB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHRydWUsXG4gIClcbiAgLmJ1aWxkKCk7XG5cbiIsICJpbXBvcnQgeyBMb2NhbEluZGV4IH0gZnJvbSBcInZlY3RyYVwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG9jdW1lbnRDaHVuayB7XG4gIGlkOiBzdHJpbmc7XG4gIHRleHQ6IHN0cmluZztcbiAgdmVjdG9yOiBudW1iZXJbXTtcbiAgZmlsZVBhdGg6IHN0cmluZztcbiAgZmlsZU5hbWU6IHN0cmluZztcbiAgZmlsZUhhc2g6IHN0cmluZztcbiAgY2h1bmtJbmRleDogbnVtYmVyO1xuICBtZXRhZGF0YTogUmVjb3JkPHN0cmluZywgYW55Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWFyY2hSZXN1bHQge1xuICB0ZXh0OiBzdHJpbmc7XG4gIHNjb3JlOiBudW1iZXI7XG4gIGZpbGVQYXRoOiBzdHJpbmc7XG4gIGZpbGVOYW1lOiBzdHJpbmc7XG4gIGNodW5rSW5kZXg6IG51bWJlcjtcbiAgbWV0YWRhdGE6IFJlY29yZDxzdHJpbmcsIGFueT47XG59XG5cbmV4cG9ydCBjbGFzcyBWZWN0b3JTdG9yZSB7XG4gIHByaXZhdGUgaW5kZXg6IExvY2FsSW5kZXggfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkYlBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSBpbmRleFBhdGg6IHN0cmluZztcbiAgcHJpdmF0ZSB1cGRhdGVNdXRleDogUHJvbWlzZTx2b2lkPiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gIGNvbnN0cnVjdG9yKGRiUGF0aDogc3RyaW5nKSB7XG4gICAgdGhpcy5kYlBhdGggPSBwYXRoLnJlc29sdmUoZGJQYXRoKTtcbiAgICB0aGlzLmluZGV4UGF0aCA9IHRoaXMuZGJQYXRoO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXNvbHZlSW5kZXhQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKGF3YWl0IHRoaXMucGF0aENvbnRhaW5zSW5kZXgodGhpcy5kYlBhdGgpKSB7XG4gICAgICByZXR1cm4gdGhpcy5kYlBhdGg7XG4gICAgfVxuXG4gICAgY29uc3QgbmVzdGVkVmVjdHJhUGF0aCA9IHBhdGguam9pbih0aGlzLmRiUGF0aCwgXCJ2ZWN0cmFfaW5kZXhcIik7XG4gICAgaWYgKGF3YWl0IHRoaXMucGF0aENvbnRhaW5zSW5kZXgobmVzdGVkVmVjdHJhUGF0aCkpIHtcbiAgICAgIHJldHVybiBuZXN0ZWRWZWN0cmFQYXRoO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaW1tZWREYlBhdGggPSB0aGlzLmRiUGF0aC5yZXBsYWNlKC9bXFxcXC9dKyQvLCBcIlwiKTtcbiAgICBpZiAocGF0aC5iYXNlbmFtZSh0cmltbWVkRGJQYXRoKSA9PT0gXCJ2ZWN0cmFfaW5kZXhcIikge1xuICAgICAgcmV0dXJuIHRoaXMuZGJQYXRoO1xuICAgIH1cblxuICAgIHJldHVybiBuZXN0ZWRWZWN0cmFQYXRoO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBwYXRoQ29udGFpbnNJbmRleCh0YXJnZXREaXI6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbmRleEZpbGUgPSBwYXRoLmpvaW4odGFyZ2V0RGlyLCBcImluZGV4Lmpzb25cIik7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3MoaW5kZXhGaWxlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIHRoZSB2ZWN0b3Igc3RvcmVcbiAgICovXG4gIGFzeW5jIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuaW5kZXhQYXRoID0gYXdhaXQgdGhpcy5yZXNvbHZlSW5kZXhQYXRoKCk7XG5cbiAgICAgIC8vIEVuc3VyZSBkaXJlY3RvcnkgZXhpc3RzXG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2Rpcih0aGlzLmluZGV4UGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgICBcbiAgICAgIC8vIENyZWF0ZSBvciBvcGVuIFZlY3RyYSBpbmRleFxuICAgICAgdGhpcy5pbmRleCA9IG5ldyBMb2NhbEluZGV4KHRoaXMuaW5kZXhQYXRoKTtcbiAgICAgIFxuICAgICAgLy8gQ2hlY2sgaWYgaW5kZXggZXhpc3RzLCBpZiBub3QgY3JlYXRlIGl0XG4gICAgICBpZiAoIShhd2FpdCB0aGlzLmluZGV4LmlzSW5kZXhDcmVhdGVkKCkpKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuaW5kZXguY3JlYXRlSW5kZXgoKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coXCJWZWN0b3Igc3RvcmUgaW5pdGlhbGl6ZWQgc3VjY2Vzc2Z1bGx5XCIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgaW5pdGlhbGl6aW5nIHZlY3RvciBzdG9yZTpcIiwgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBkb2N1bWVudCBjaHVua3MgdG8gdGhlIHZlY3RvciBzdG9yZVxuICAgKiBVc2VzIGEgbXV0ZXggdG8gcHJldmVudCBjb25jdXJyZW50IHVwZGF0ZXNcbiAgICovXG4gIGFzeW5jIGFkZENodW5rcyhjaHVua3M6IERvY3VtZW50Q2h1bmtbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5pbmRleCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVjdG9yIHN0b3JlIG5vdCBpbml0aWFsaXplZFwiKTtcbiAgICB9XG5cbiAgICBpZiAoY2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdhaXQgZm9yIGFueSBwZW5kaW5nIHVwZGF0ZXMgdG8gY29tcGxldGUsIHRoZW4gcnVuIHRoaXMgdXBkYXRlXG4gICAgdGhpcy51cGRhdGVNdXRleCA9IHRoaXMudXBkYXRlTXV0ZXgudGhlbihhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIEJlZ2luIGJhdGNoIHVwZGF0ZVxuICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5iZWdpblVwZGF0ZSgpO1xuXG4gICAgICBmb3IgKGNvbnN0IGNodW5rIG9mIGNodW5rcykge1xuICAgICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLnVwc2VydEl0ZW0oe1xuICAgICAgICAgIGlkOiBjaHVuay5pZCxcbiAgICAgICAgICB2ZWN0b3I6IGNodW5rLnZlY3RvcixcbiAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgdGV4dDogY2h1bmsudGV4dCxcbiAgICAgICAgICAgIGZpbGVQYXRoOiBjaHVuay5maWxlUGF0aCxcbiAgICAgICAgICAgIGZpbGVOYW1lOiBjaHVuay5maWxlTmFtZSxcbiAgICAgICAgICAgIGZpbGVIYXNoOiBjaHVuay5maWxlSGFzaCxcbiAgICAgICAgICAgIGNodW5rSW5kZXg6IGNodW5rLmNodW5rSW5kZXgsXG4gICAgICAgICAgICAuLi5jaHVuay5tZXRhZGF0YSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gQ29tbWl0IHRoZSBiYXRjaFxuICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5lbmRVcGRhdGUoKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYEFkZGVkICR7Y2h1bmtzLmxlbmd0aH0gY2h1bmtzIHRvIHZlY3RvciBzdG9yZWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgYWRkaW5nIGNodW5rcyB0byB2ZWN0b3Igc3RvcmU6XCIsIGVycm9yKTtcbiAgICAgICAgLy8gU3RpbGwgZW5kIHRoZSB1cGRhdGUgb24gZXJyb3IgdG8gcHJldmVudCBsb2NrXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuZW5kVXBkYXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBJZ25vcmUgZXJyb3IgaWYgYWxyZWFkeSBlbmRlZFxuICAgICAgICB9XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBSZXR1cm4gdGhlIG11dGV4IHByb21pc2Ugc28gY2FsbGVyIGNhbiBhd2FpdCBjb21wbGV0aW9uXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlTXV0ZXg7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIGZvciBzaW1pbGFyIGNodW5rc1xuICAgKi9cbiAgYXN5bmMgc2VhcmNoKFxuICAgIHF1ZXJ5VmVjdG9yOiBudW1iZXJbXSxcbiAgICBsaW1pdDogbnVtYmVyID0gNSxcbiAgICB0aHJlc2hvbGQ6IG51bWJlciA9IDAuNSxcbiAgKTogUHJvbWlzZTxTZWFyY2hSZXN1bHRbXT4ge1xuICAgIGlmICghdGhpcy5pbmRleCkge1xuICAgICAgY29uc29sZS5sb2coXCJObyBpbmRleCBhdmFpbGFibGUgZm9yIHNlYXJjaFwiKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IHRoaXMuaW5kZXgucXVlcnlJdGVtcyhxdWVyeVZlY3RvciwgbGltaXQpO1xuXG4gICAgICByZXR1cm4gcmVzdWx0c1xuICAgICAgICAuZmlsdGVyKChyZXN1bHQpID0+IHJlc3VsdC5zY29yZSA+PSB0aHJlc2hvbGQpXG4gICAgICAgIC5tYXAoKHJlc3VsdCkgPT4gKHtcbiAgICAgICAgICB0ZXh0OiByZXN1bHQuaXRlbS5tZXRhZGF0YS50ZXh0IGFzIHN0cmluZyxcbiAgICAgICAgICBzY29yZTogcmVzdWx0LnNjb3JlLFxuICAgICAgICAgIGZpbGVQYXRoOiByZXN1bHQuaXRlbS5tZXRhZGF0YS5maWxlUGF0aCBhcyBzdHJpbmcsXG4gICAgICAgICAgZmlsZU5hbWU6IHJlc3VsdC5pdGVtLm1ldGFkYXRhLmZpbGVOYW1lIGFzIHN0cmluZyxcbiAgICAgICAgICBjaHVua0luZGV4OiByZXN1bHQuaXRlbS5tZXRhZGF0YS5jaHVua0luZGV4IGFzIG51bWJlcixcbiAgICAgICAgICBtZXRhZGF0YTogcmVzdWx0Lml0ZW0ubWV0YWRhdGEsXG4gICAgICAgIH0pKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlYXJjaGluZyB2ZWN0b3Igc3RvcmU6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGNodW5rcyBmb3IgYSBzcGVjaWZpYyBmaWxlIChieSBoYXNoKVxuICAgKiBVc2VzIGEgbXV0ZXggdG8gcHJldmVudCBjb25jdXJyZW50IHVwZGF0ZXNcbiAgICovXG4gIGFzeW5jIGRlbGV0ZUJ5RmlsZUhhc2goZmlsZUhhc2g6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5pbmRleCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFdhaXQgZm9yIGFueSBwZW5kaW5nIHVwZGF0ZXMgdG8gY29tcGxldGUsIHRoZW4gcnVuIHRoaXMgZGVsZXRlXG4gICAgdGhpcy51cGRhdGVNdXRleCA9IHRoaXMudXBkYXRlTXV0ZXgudGhlbihhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuYmVnaW5VcGRhdGUoKTtcbiAgICAgIFxuICAgICAgLy8gR2V0IGFsbCBpdGVtcyBhbmQgZmlsdGVyIGJ5IGZpbGVIYXNoXG4gICAgICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgdGhpcy5pbmRleCEubGlzdEl0ZW1zKCk7XG4gICAgICBcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhbGxJdGVtcykge1xuICAgICAgICBpZiAoaXRlbS5tZXRhZGF0YS5maWxlSGFzaCA9PT0gZmlsZUhhc2gpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaW5kZXghLmRlbGV0ZUl0ZW0oaXRlbS5pZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgICBhd2FpdCB0aGlzLmluZGV4IS5lbmRVcGRhdGUoKTtcbiAgICAgIFxuICAgICAgY29uc29sZS5sb2coYERlbGV0ZWQgY2h1bmtzIGZvciBmaWxlIGhhc2g6ICR7ZmlsZUhhc2h9YCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGRlbGV0aW5nIGNodW5rcyBmb3IgZmlsZSBoYXNoICR7ZmlsZUhhc2h9OmAsIGVycm9yKTtcbiAgICAgICAgLy8gU3RpbGwgZW5kIHRoZSB1cGRhdGUgb24gZXJyb3IgdG8gcHJldmVudCBsb2NrXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5pbmRleCEuZW5kVXBkYXRlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAvLyBJZ25vcmUgZXJyb3IgaWYgYWxyZWFkeSBlbmRlZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcy51cGRhdGVNdXRleDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIGZpbGUgKGJ5IGhhc2gpIGV4aXN0cyBpbiB0aGUgc3RvcmVcbiAgICovXG4gIGFzeW5jIGhhc0ZpbGUoZmlsZUhhc2g6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICghdGhpcy5pbmRleCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuaW5kZXgubGlzdEl0ZW1zKCk7XG4gICAgICBcbiAgICAgIHJldHVybiBhbGxJdGVtcy5zb21lKChpdGVtKSA9PiBpdGVtLm1ldGFkYXRhLmZpbGVIYXNoID09PSBmaWxlSGFzaCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGNoZWNraW5nIGZpbGUgaGFzaCAke2ZpbGVIYXNofTpgLCBlcnJvcik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIG1hcCBvZiBmaWxlIHBhdGhzIHRvIHRoZSBzZXQgb2YgaGFzaGVzIGN1cnJlbnRseSBzdG9yZWQuXG4gICAqL1xuICBhc3luYyBnZXRGaWxlSGFzaEludmVudG9yeSgpOiBQcm9taXNlPE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+Pj4ge1xuICAgIGNvbnN0IGludmVudG9yeSA9IG5ldyBNYXA8c3RyaW5nLCBTZXQ8c3RyaW5nPj4oKTtcbiAgICBpZiAoIXRoaXMuaW5kZXgpIHtcbiAgICAgIHJldHVybiBpbnZlbnRvcnk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFsbEl0ZW1zID0gYXdhaXQgdGhpcy5pbmRleC5saXN0SXRlbXMoKTtcbiAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBhbGxJdGVtcykge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IGl0ZW0ubWV0YWRhdGEuZmlsZVBhdGggYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICBjb25zdCBmaWxlSGFzaCA9IGl0ZW0ubWV0YWRhdGEuZmlsZUhhc2ggYXMgc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgICAgICBpZiAoIWZpbGVQYXRoIHx8ICFmaWxlSGFzaCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBoYXNoZXMgPSBpbnZlbnRvcnkuZ2V0KGZpbGVQYXRoKTtcbiAgICAgICAgaWYgKCFoYXNoZXMpIHtcbiAgICAgICAgICBoYXNoZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgICAgICBpbnZlbnRvcnkuc2V0KGZpbGVQYXRoLCBoYXNoZXMpO1xuICAgICAgICB9XG4gICAgICAgIGhhc2hlcy5hZGQoZmlsZUhhc2gpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGludmVudG9yeTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGJ1aWxkaW5nIGZpbGUgaGFzaCBpbnZlbnRvcnk6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiBpbnZlbnRvcnk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzdGF0aXN0aWNzIGFib3V0IHRoZSB2ZWN0b3Igc3RvcmVcbiAgICovXG4gIGFzeW5jIGdldFN0YXRzKCk6IFByb21pc2U8eyB0b3RhbENodW5rczogbnVtYmVyOyB1bmlxdWVGaWxlczogbnVtYmVyIH0+IHtcbiAgICBpZiAoIXRoaXMuaW5kZXgpIHtcbiAgICAgIHJldHVybiB7IHRvdGFsQ2h1bmtzOiAwLCB1bmlxdWVGaWxlczogMCB9O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBhbGxJdGVtcyA9IGF3YWl0IHRoaXMuaW5kZXgubGlzdEl0ZW1zKCk7XG4gICAgICBjb25zdCB1bmlxdWVIYXNoZXMgPSBuZXcgU2V0KFxuICAgICAgICBhbGxJdGVtcy5tYXAoKGl0ZW0pID0+IGl0ZW0ubWV0YWRhdGEuZmlsZUhhc2ggYXMgc3RyaW5nKVxuICAgICAgKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG90YWxDaHVua3M6IGFsbEl0ZW1zLmxlbmd0aCxcbiAgICAgICAgdW5pcXVlRmlsZXM6IHVuaXF1ZUhhc2hlcy5zaXplLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGdldHRpbmcgc3RhdHM6XCIsIGVycm9yKTtcbiAgICAgIHJldHVybiB7IHRvdGFsQ2h1bmtzOiAwLCB1bmlxdWVGaWxlczogMCB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDbG9zZSB0aGUgdmVjdG9yIHN0b3JlIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGNsb3NlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIFZlY3RyYSBkb2Vzbid0IHJlcXVpcmUgZXhwbGljaXQgY2xvc2luZ1xuICAgIHRoaXMuaW5kZXggPSBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBvcyBmcm9tIFwib3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTYW5pdHlDaGVja1Jlc3VsdCB7XG4gIHBhc3NlZDogYm9vbGVhbjtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG4vKipcbiAqIFBlcmZvcm0gc2FuaXR5IGNoZWNrcyBiZWZvcmUgaW5kZXhpbmcgbGFyZ2UgZGlyZWN0b3JpZXNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBlcmZvcm1TYW5pdHlDaGVja3MoXG4gIGRvY3VtZW50c0Rpcjogc3RyaW5nLFxuICB2ZWN0b3JTdG9yZURpcjogc3RyaW5nLFxuKTogUHJvbWlzZTxTYW5pdHlDaGVja1Jlc3VsdD4ge1xuICBjb25zdCB3YXJuaW5nczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZXJyb3JzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIC8vIENoZWNrIGlmIGRpcmVjdG9yaWVzIGV4aXN0XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMucHJvbWlzZXMuYWNjZXNzKGRvY3VtZW50c0RpciwgZnMuY29uc3RhbnRzLlJfT0spO1xuICB9IGNhdGNoIHtcbiAgICBlcnJvcnMucHVzaChgRG9jdW1lbnRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdCBvciBpcyBub3QgcmVhZGFibGU6ICR7ZG9jdW1lbnRzRGlyfWApO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5wcm9taXNlcy5hY2Nlc3ModmVjdG9yU3RvcmVEaXIsIGZzLmNvbnN0YW50cy5XX09LKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gVHJ5IHRvIGNyZWF0ZSBpdFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2Rpcih2ZWN0b3JTdG9yZURpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBlcnJvcnMucHVzaChcbiAgICAgICAgYFZlY3RvciBzdG9yZSBkaXJlY3RvcnkgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiAke3ZlY3RvclN0b3JlRGlyfWBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2sgYXZhaWxhYmxlIGRpc2sgc3BhY2VcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXRmcyh2ZWN0b3JTdG9yZURpcik7XG4gICAgY29uc3QgYXZhaWxhYmxlR0IgPSAoc3RhdHMuYmF2YWlsICogc3RhdHMuYnNpemUpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gICAgXG4gICAgaWYgKGF2YWlsYWJsZUdCIDwgMSkge1xuICAgICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGRpc2sgc3BhY2UgYXZhaWxhYmxlOiAke2F2YWlsYWJsZUdCLnRvRml4ZWQoMil9IEdCYCk7XG4gICAgfSBlbHNlIGlmIChhdmFpbGFibGVHQiA8IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKGBMb3cgZGlzayBzcGFjZSBhdmFpbGFibGU6ICR7YXZhaWxhYmxlR0IudG9GaXhlZCgyKX0gR0JgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBjaGVjayBhdmFpbGFibGUgZGlzayBzcGFjZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGF2YWlsYWJsZSBtZW1vcnlcbiAgY29uc3QgZnJlZU1lbW9yeUdCID0gb3MuZnJlZW1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIGNvbnN0IHRvdGFsTWVtb3J5R0IgPSBvcy50b3RhbG1lbSgpIC8gKDEwMjQgKiAxMDI0ICogMTAyNCk7XG4gIFxuICBpZiAoZnJlZU1lbW9yeUdCIDwgMC41KSB7XG4gICAgZXJyb3JzLnB1c2goYFZlcnkgbG93IGZyZWUgbWVtb3J5OiAke2ZyZWVNZW1vcnlHQi50b0ZpeGVkKDIpfSBHQmApO1xuICB9IGVsc2UgaWYgKGZyZWVNZW1vcnlHQiA8IDIpIHtcbiAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgYExvdyBmcmVlIG1lbW9yeTogJHtmcmVlTWVtb3J5R0IudG9GaXhlZCgyKX0gR0Igb2YgJHt0b3RhbE1lbW9yeUdCLnRvRml4ZWQoMil9IEdCIHRvdGFsLiBDb25zaWRlciByZWR1Y2luZyBjb25jdXJyZW50IGZpbGUgcHJvY2Vzc2luZy5gXG4gICAgKTtcbiAgfVxuXG4gIC8vIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIChzYW1wbGUtYmFzZWQgZm9yIHBlcmZvcm1hbmNlKVxuICB0cnkge1xuICAgIGNvbnN0IHNhbXBsZVNpemUgPSBhd2FpdCBlc3RpbWF0ZURpcmVjdG9yeVNpemUoZG9jdW1lbnRzRGlyKTtcbiAgICBjb25zdCBlc3RpbWF0ZWRHQiA9IHNhbXBsZVNpemUgLyAoMTAyNCAqIDEwMjQgKiAxMDI0KTtcbiAgICBcbiAgICBpZiAoZXN0aW1hdGVkR0IgPiAxMDApIHtcbiAgICAgIHdhcm5pbmdzLnB1c2goXG4gICAgICAgIGBMYXJnZSBkaXJlY3RvcnkgZGV0ZWN0ZWQgKH4ke2VzdGltYXRlZEdCLnRvRml4ZWQoMSl9IEdCKS4gSW5pdGlhbCBpbmRleGluZyBtYXkgdGFrZSBzZXZlcmFsIGhvdXJzLmBcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChlc3RpbWF0ZWRHQiA+IDEwKSB7XG4gICAgICB3YXJuaW5ncy5wdXNoKFxuICAgICAgICBgTWVkaXVtLXNpemVkIGRpcmVjdG9yeSBkZXRlY3RlZCAofiR7ZXN0aW1hdGVkR0IudG9GaXhlZCgxKX0gR0IpLiBJbml0aWFsIGluZGV4aW5nIG1heSB0YWtlIDMwLTYwIG1pbnV0ZXMuYFxuICAgICAgKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgd2FybmluZ3MucHVzaChcIkNvdWxkIG5vdCBlc3RpbWF0ZSBkaXJlY3Rvcnkgc2l6ZVwiKTtcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHZlY3RvciBzdG9yZSBhbHJlYWR5IGhhcyBkYXRhXG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKHZlY3RvclN0b3JlRGlyKTtcbiAgICBpZiAoZmlsZXMubGVuZ3RoID4gMCkge1xuICAgICAgd2FybmluZ3MucHVzaChcbiAgICAgICAgXCJWZWN0b3Igc3RvcmUgZGlyZWN0b3J5IGlzIG5vdCBlbXB0eS4gRXhpc3RpbmcgZGF0YSB3aWxsIGJlIHVzZWQgZm9yIGluY3JlbWVudGFsIGluZGV4aW5nLlwiXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gRGlyZWN0b3J5IGRvZXNuJ3QgZXhpc3QgeWV0LCB0aGF0J3MgZmluZVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwYXNzZWQ6IGVycm9ycy5sZW5ndGggPT09IDAsXG4gICAgd2FybmluZ3MsXG4gICAgZXJyb3JzLFxuICB9O1xufVxuXG4vKipcbiAqIEVzdGltYXRlIGRpcmVjdG9yeSBzaXplIGJ5IHNhbXBsaW5nXG4gKiAoUXVpY2sgZXN0aW1hdGUsIG5vdCBleGFjdClcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZXN0aW1hdGVEaXJlY3RvcnlTaXplKGRpcjogc3RyaW5nLCBtYXhTYW1wbGVzOiBudW1iZXIgPSAxMDApOiBQcm9taXNlPG51bWJlcj4ge1xuICBsZXQgdG90YWxTaXplID0gMDtcbiAgbGV0IGZpbGVDb3VudCA9IDA7XG4gIGxldCBzYW1wbGVkU2l6ZSA9IDA7XG4gIGxldCBzYW1wbGVkQ291bnQgPSAwO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIHdhbGsoY3VycmVudERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHNhbXBsZWRDb3VudCA+PSBtYXhTYW1wbGVzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGN1cnJlbnREaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGlmIChzYW1wbGVkQ291bnQgPj0gbWF4U2FtcGxlcykge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBgJHtjdXJyZW50RGlyfS8ke2VudHJ5Lm5hbWV9YDtcblxuICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgIGF3YWl0IHdhbGsoZnVsbFBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICAgICAgZmlsZUNvdW50Kys7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKHNhbXBsZWRDb3VudCA8IG1heFNhbXBsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICAgIHNhbXBsZWRTaXplICs9IHN0YXRzLnNpemU7XG4gICAgICAgICAgICAgIHNhbXBsZWRDb3VudCsrO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIC8vIFNraXAgZmlsZXMgd2UgY2FuJ3Qgc3RhdFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gU2tpcCBkaXJlY3RvcmllcyB3ZSBjYW4ndCByZWFkXG4gICAgfVxuICB9XG5cbiAgYXdhaXQgd2FsayhkaXIpO1xuXG4gIC8vIEV4dHJhcG9sYXRlIGZyb20gc2FtcGxlXG4gIGlmIChzYW1wbGVkQ291bnQgPiAwICYmIGZpbGVDb3VudCA+IDApIHtcbiAgICBjb25zdCBhdmdGaWxlU2l6ZSA9IHNhbXBsZWRTaXplIC8gc2FtcGxlZENvdW50O1xuICAgIHRvdGFsU2l6ZSA9IGF2Z0ZpbGVTaXplICogZmlsZUNvdW50O1xuICB9XG5cbiAgcmV0dXJuIHRvdGFsU2l6ZTtcbn1cblxuLyoqXG4gKiBDaGVjayBzeXN0ZW0gcmVzb3VyY2VzIGFuZCBwcm92aWRlIHJlY29tbWVuZGF0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2VSZWNvbW1lbmRhdGlvbnMoXG4gIGVzdGltYXRlZFNpemVHQjogbnVtYmVyLFxuICBmcmVlTWVtb3J5R0I6IG51bWJlcixcbik6IHtcbiAgcmVjb21tZW5kZWRDb25jdXJyZW5jeTogbnVtYmVyO1xuICByZWNvbW1lbmRlZENodW5rU2l6ZTogbnVtYmVyO1xuICBlc3RpbWF0ZWRUaW1lOiBzdHJpbmc7XG59IHtcbiAgbGV0IHJlY29tbWVuZGVkQ29uY3VycmVuY3kgPSAzO1xuICBsZXQgcmVjb21tZW5kZWRDaHVua1NpemUgPSA1MTI7XG4gIGxldCBlc3RpbWF0ZWRUaW1lID0gXCJ1bmtub3duXCI7XG5cbiAgLy8gQWRqdXN0IGJhc2VkIG9uIGF2YWlsYWJsZSBtZW1vcnlcbiAgaWYgKGZyZWVNZW1vcnlHQiA8IDIpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gMTtcbiAgfSBlbHNlIGlmIChmcmVlTWVtb3J5R0IgPCA0KSB7XG4gICAgcmVjb21tZW5kZWRDb25jdXJyZW5jeSA9IDI7XG4gIH0gZWxzZSBpZiAoZnJlZU1lbW9yeUdCID49IDgpIHtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gNTtcbiAgfVxuXG4gIC8vIEFkanVzdCBiYXNlZCBvbiBkYXRhc2V0IHNpemVcbiAgaWYgKGVzdGltYXRlZFNpemVHQiA8IDEpIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCI1LTE1IG1pbnV0ZXNcIjtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMCkge1xuICAgIGVzdGltYXRlZFRpbWUgPSBcIjMwLTYwIG1pbnV0ZXNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDc2ODtcbiAgfSBlbHNlIGlmIChlc3RpbWF0ZWRTaXplR0IgPCAxMDApIHtcbiAgICBlc3RpbWF0ZWRUaW1lID0gXCIyLTQgaG91cnNcIjtcbiAgICByZWNvbW1lbmRlZENodW5rU2l6ZSA9IDEwMjQ7XG4gIH0gZWxzZSB7XG4gICAgZXN0aW1hdGVkVGltZSA9IFwiNC0xMiBob3Vyc1wiO1xuICAgIHJlY29tbWVuZGVkQ2h1bmtTaXplID0gMTAyNDtcbiAgICByZWNvbW1lbmRlZENvbmN1cnJlbmN5ID0gTWF0aC5taW4ocmVjb21tZW5kZWRDb25jdXJyZW5jeSwgMyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlY29tbWVuZGVkQ29uY3VycmVuY3ksXG4gICAgcmVjb21tZW5kZWRDaHVua1NpemUsXG4gICAgZXN0aW1hdGVkVGltZSxcbiAgfTtcbn1cblxuIiwgImxldCBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcblxuLyoqXG4gKiBBdHRlbXB0IHRvIGFjcXVpcmUgdGhlIHNoYXJlZCBpbmRleGluZyBsb2NrLlxuICogUmV0dXJucyB0cnVlIGlmIG5vIG90aGVyIGluZGV4aW5nIGpvYiBpcyBydW5uaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdHJ5U3RhcnRJbmRleGluZyhjb250ZXh0OiBzdHJpbmcgPSBcInVua25vd25cIik6IGJvb2xlYW4ge1xuICBpZiAoaW5kZXhpbmdJblByb2dyZXNzKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gdHJ5U3RhcnRJbmRleGluZyAoJHtjb250ZXh0fSkgZmFpbGVkOiBsb2NrIGFscmVhZHkgaGVsZGApO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGluZGV4aW5nSW5Qcm9ncmVzcyA9IHRydWU7XG4gIGNvbnNvbGUuZGVidWcoYFtCaWdSQUddIHRyeVN0YXJ0SW5kZXhpbmcgKCR7Y29udGV4dH0pIHN1Y2NlZWRlZGApO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBSZWxlYXNlIHRoZSBzaGFyZWQgaW5kZXhpbmcgbG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmlzaEluZGV4aW5nKCk6IHZvaWQge1xuICBpbmRleGluZ0luUHJvZ3Jlc3MgPSBmYWxzZTtcbiAgY29uc29sZS5kZWJ1ZyhcIltCaWdSQUddIGZpbmlzaEluZGV4aW5nOiBsb2NrIHJlbGVhc2VkXCIpO1xufVxuXG4vKipcbiAqIEluZGljYXRlcyB3aGV0aGVyIGFuIGluZGV4aW5nIGpvYiBpcyBjdXJyZW50bHkgcnVubmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzSW5kZXhpbmcoKTogYm9vbGVhbiB7XG4gIHJldHVybiBpbmRleGluZ0luUHJvZ3Jlc3M7XG59XG5cbiIsICJjb25zdCBIVE1MX0VYVEVOU0lPTlMgPSBbXCIuaHRtXCIsIFwiLmh0bWxcIiwgXCIueGh0bWxcIl07XG5jb25zdCBNQVJLRE9XTl9FWFRFTlNJT05TID0gW1wiLm1kXCIsIFwiLm1hcmtkb3duXCIsIFwiLm1kb3duXCIsIFwiLm1keFwiLCBcIi5ta2RcIiwgXCIubWtkblwiXTtcbmNvbnN0IFRFWFRfRVhURU5TSU9OUyA9IFtcIi50eHRcIiwgXCIudGV4dFwiXTtcbmNvbnN0IFBERl9FWFRFTlNJT05TID0gW1wiLnBkZlwiXTtcbmNvbnN0IEVQVUJfRVhURU5TSU9OUyA9IFtcIi5lcHViXCJdO1xuY29uc3QgSU1BR0VfRVhURU5TSU9OUyA9IFtcIi5ibXBcIiwgXCIuanBnXCIsIFwiLmpwZWdcIiwgXCIucG5nXCJdO1xuY29uc3QgQVJDSElWRV9FWFRFTlNJT05TID0gW1wiLnJhclwiXTtcblxuY29uc3QgQUxMX0VYVEVOU0lPTl9HUk9VUFMgPSBbXG4gIEhUTUxfRVhURU5TSU9OUyxcbiAgTUFSS0RPV05fRVhURU5TSU9OUyxcbiAgVEVYVF9FWFRFTlNJT05TLFxuICBQREZfRVhURU5TSU9OUyxcbiAgRVBVQl9FWFRFTlNJT05TLFxuICBJTUFHRV9FWFRFTlNJT05TLFxuICBBUkNISVZFX0VYVEVOU0lPTlMsXG5dO1xuXG5leHBvcnQgY29uc3QgU1VQUE9SVEVEX0VYVEVOU0lPTlMgPSBuZXcgU2V0KFxuICBBTExfRVhURU5TSU9OX0dST1VQUy5mbGF0TWFwKChncm91cCkgPT4gZ3JvdXAubWFwKChleHQpID0+IGV4dC50b0xvd2VyQ2FzZSgpKSksXG4pO1xuXG5leHBvcnQgY29uc3QgSFRNTF9FWFRFTlNJT05fU0VUID0gbmV3IFNldChIVE1MX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IE1BUktET1dOX0VYVEVOU0lPTl9TRVQgPSBuZXcgU2V0KE1BUktET1dOX0VYVEVOU0lPTlMpO1xuZXhwb3J0IGNvbnN0IFRFWFRfRVhURU5TSU9OX1NFVCA9IG5ldyBTZXQoVEVYVF9FWFRFTlNJT05TKTtcbmV4cG9ydCBjb25zdCBJTUFHRV9FWFRFTlNJT05fU0VUID0gbmV3IFNldChJTUFHRV9FWFRFTlNJT05TKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGlzSHRtbEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gSFRNTF9FWFRFTlNJT05fU0VULmhhcyhleHQudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01hcmtkb3duRXh0ZW5zaW9uKGV4dDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBNQVJLRE9XTl9FWFRFTlNJT05fU0VULmhhcyhleHQudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYWluVGV4dEV4dGVuc2lvbihleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gVEVYVF9FWFRFTlNJT05fU0VULmhhcyhleHQudG9Mb3dlckNhc2UoKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RleHR1YWxFeHRlbnNpb24oZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGlzTWFya2Rvd25FeHRlbnNpb24oZXh0KSB8fCBpc1BsYWluVGV4dEV4dGVuc2lvbihleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGlzdFN1cHBvcnRlZEV4dGVuc2lvbnMoKTogc3RyaW5nW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShTVVBQT1JURURfRVhURU5TSU9OUy52YWx1ZXMoKSkuc29ydCgpO1xufVxuXG5cbiIsICJpbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIG1pbWUgZnJvbSBcIm1pbWUtdHlwZXNcIjtcbmltcG9ydCB7XG4gIFNVUFBPUlRFRF9FWFRFTlNJT05TLFxuICBsaXN0U3VwcG9ydGVkRXh0ZW5zaW9ucyxcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTY2FubmVkRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgbmFtZTogc3RyaW5nO1xuICBleHRlbnNpb246IHN0cmluZztcbiAgbWltZVR5cGU6IHN0cmluZyB8IGZhbHNlO1xuICBzaXplOiBudW1iZXI7XG4gIG10aW1lOiBEYXRlO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IHNjYW4gYSBkaXJlY3RvcnkgZm9yIHN1cHBvcnRlZCBmaWxlc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2NhbkRpcmVjdG9yeShcbiAgcm9vdERpcjogc3RyaW5nLFxuICBvblByb2dyZXNzPzogKGN1cnJlbnQ6IG51bWJlciwgdG90YWw6IG51bWJlcikgPT4gdm9pZCxcbik6IFByb21pc2U8U2Nhbm5lZEZpbGVbXT4ge1xuICBjb25zdCBmaWxlczogU2Nhbm5lZEZpbGVbXSA9IFtdO1xuICBsZXQgc2Nhbm5lZENvdW50ID0gMDtcbiAgXG4gIGNvbnN0IHN1cHBvcnRlZEV4dGVuc2lvbnNEZXNjcmlwdGlvbiA9IGxpc3RTdXBwb3J0ZWRFeHRlbnNpb25zKCkuam9pbihcIiwgXCIpO1xuICBjb25zb2xlLmxvZyhgW1NjYW5uZXJdIFN1cHBvcnRlZCBleHRlbnNpb25zOiAke3N1cHBvcnRlZEV4dGVuc2lvbnNEZXNjcmlwdGlvbn1gKTtcblxuICBhc3luYyBmdW5jdGlvbiB3YWxrKGRpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkZGlyKGRpciwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgICAgXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwYXRoLmpvaW4oZGlyLCBlbnRyeS5uYW1lKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChlbnRyeS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgYXdhaXQgd2FsayhmdWxsUGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgICAgICBzY2FubmVkQ291bnQrKztcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZW50cnkubmFtZSkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoU1VQUE9SVEVEX0VYVEVOU0lPTlMuaGFzKGV4dCkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMuc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICBjb25zdCBtaW1lVHlwZSA9IG1pbWUubG9va3VwKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZmlsZXMucHVzaCh7XG4gICAgICAgICAgICAgIHBhdGg6IGZ1bGxQYXRoLFxuICAgICAgICAgICAgICBuYW1lOiBlbnRyeS5uYW1lLFxuICAgICAgICAgICAgICBleHRlbnNpb246IGV4dCxcbiAgICAgICAgICAgICAgbWltZVR5cGUsXG4gICAgICAgICAgICAgIHNpemU6IHN0YXRzLnNpemUsXG4gICAgICAgICAgICAgIG10aW1lOiBzdGF0cy5tdGltZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICBpZiAob25Qcm9ncmVzcyAmJiBzY2FubmVkQ291bnQgJSAxMDAgPT09IDApIHtcbiAgICAgICAgICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBzY2FubmluZyBkaXJlY3RvcnkgJHtkaXJ9OmAsIGVycm9yKTtcbiAgICB9XG4gIH1cbiAgXG4gIGF3YWl0IHdhbGsocm9vdERpcik7XG4gIFxuICBpZiAob25Qcm9ncmVzcykge1xuICAgIG9uUHJvZ3Jlc3Moc2Nhbm5lZENvdW50LCBmaWxlcy5sZW5ndGgpO1xuICB9XG4gIFxuICByZXR1cm4gZmlsZXM7XG59XG5cbi8qKlxuICogQ2hlY2sgaWYgYSBmaWxlIHR5cGUgaXMgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1N1cHBvcnRlZEZpbGUoZmlsZVBhdGg6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiBTVVBQT1JURURfRVhURU5TSU9OUy5oYXMoZXh0KTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSBcImNoZWVyaW9cIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIFBhcnNlIEhUTUwvSFRNIGZpbGVzIGFuZCBleHRyYWN0IHRleHQgY29udGVudFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VIVE1MKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCAkID0gY2hlZXJpby5sb2FkKGNvbnRlbnQpO1xuICAgIFxuICAgIC8vIFJlbW92ZSBzY3JpcHQgYW5kIHN0eWxlIGVsZW1lbnRzXG4gICAgJChcInNjcmlwdCwgc3R5bGUsIG5vc2NyaXB0XCIpLnJlbW92ZSgpO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgdGV4dFxuICAgIGNvbnN0IHRleHQgPSAkKFwiYm9keVwiKS50ZXh0KCkgfHwgJC50ZXh0KCk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgd2hpdGVzcGFjZVxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgSFRNTCBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4gXCJcIjtcbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBwZGZQYXJzZSBmcm9tIFwicGRmLXBhcnNlXCI7XG5pbXBvcnQgeyBjcmVhdGVXb3JrZXIgfSBmcm9tIFwidGVzc2VyYWN0LmpzXCI7XG5pbXBvcnQgeyBQTkcgfSBmcm9tIFwicG5nanNcIjtcblxuY29uc3QgTUlOX1RFWFRfTEVOR1RIID0gNTA7XG5jb25zdCBPQ1JfTUFYX1BBR0VTID0gNTA7XG5jb25zdCBPQ1JfTUFYX0lNQUdFU19QRVJfUEFHRSA9IDM7XG5jb25zdCBPQ1JfTUlOX0lNQUdFX0FSRUEgPSAxMF8wMDA7XG5jb25zdCBPQ1JfSU1BR0VfVElNRU9VVF9NUyA9IDMwXzAwMDtcblxudHlwZSBQZGZKc01vZHVsZSA9IHR5cGVvZiBpbXBvcnQoXCJwZGZqcy1kaXN0L2xlZ2FjeS9idWlsZC9wZGYubWpzXCIpO1xuXG5pbnRlcmZhY2UgRXh0cmFjdGVkT2NySW1hZ2Uge1xuICBidWZmZXI6IEJ1ZmZlcjtcbiAgd2lkdGg6IG51bWJlcjtcbiAgaGVpZ2h0OiBudW1iZXI7XG4gIGFyZWE6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUGRmRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJwZGYubG1zdHVkaW8tZXJyb3JcIlxuICB8IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCJcbiAgfCBcInBkZi5wZGZwYXJzZS1lcnJvclwiXG4gIHwgXCJwZGYucGRmcGFyc2UtZW1wdHlcIlxuICB8IFwicGRmLm9jci1kaXNhYmxlZFwiXG4gIHwgXCJwZGYub2NyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItcmVuZGVyLWVycm9yXCJcbiAgfCBcInBkZi5vY3ItZW1wdHlcIjtcblxudHlwZSBQZGZQYXJzZVN0YWdlID0gXCJsbXN0dWRpb1wiIHwgXCJwZGYtcGFyc2VcIiB8IFwib2NyXCI7XG5jbGFzcyBJbWFnZURhdGFUaW1lb3V0RXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG9iaklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgVGltZWQgb3V0IGZldGNoaW5nIGltYWdlIGRhdGEgZm9yICR7b2JqSWR9YCk7XG4gICAgdGhpcy5uYW1lID0gXCJJbWFnZURhdGFUaW1lb3V0RXJyb3JcIjtcbiAgfVxufVxuXG5pbnRlcmZhY2UgUGRmUGFyc2VyU3VjY2VzcyB7XG4gIHN1Y2Nlc3M6IHRydWU7XG4gIHRleHQ6IHN0cmluZztcbiAgc3RhZ2U6IFBkZlBhcnNlU3RhZ2U7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGRmUGFyc2VyRmFpbHVyZSB7XG4gIHN1Y2Nlc3M6IGZhbHNlO1xuICByZWFzb246IFBkZkZhaWx1cmVSZWFzb247XG4gIGRldGFpbHM/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFBkZlBhcnNlclJlc3VsdCA9IFBkZlBhcnNlclN1Y2Nlc3MgfCBQZGZQYXJzZXJGYWlsdXJlO1xuXG5mdW5jdGlvbiBjbGVhblRleHQodGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRleHRcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgIC50cmltKCk7XG59XG5cbnR5cGUgU3RhZ2VSZXN1bHQgPSBQZGZQYXJzZXJTdWNjZXNzIHwgUGRmUGFyc2VyRmFpbHVyZTtcblxubGV0IGNhY2hlZFBkZmpzTGliOiBQZGZKc01vZHVsZSB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBnZXRQZGZqc0xpYigpIHtcbiAgaWYgKCFjYWNoZWRQZGZqc0xpYikge1xuICAgIGNhY2hlZFBkZmpzTGliID0gYXdhaXQgaW1wb3J0KFwicGRmanMtZGlzdC9sZWdhY3kvYnVpbGQvcGRmLm1qc1wiKTtcbiAgfVxuICByZXR1cm4gY2FjaGVkUGRmanNMaWI7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeUxtU3R1ZGlvUGFyc2VyKGZpbGVQYXRoOiBzdHJpbmcsIGNsaWVudDogTE1TdHVkaW9DbGllbnQpOiBQcm9taXNlPFN0YWdlUmVzdWx0PiB7XG4gIGNvbnN0IG1heFJldHJpZXMgPSAyO1xuICBjb25zdCBmaWxlTmFtZSA9IGZpbGVQYXRoLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBmaWxlUGF0aDtcblxuICBmb3IgKGxldCBhdHRlbXB0ID0gMTsgYXR0ZW1wdCA8PSBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZmlsZUhhbmRsZSA9IGF3YWl0IGNsaWVudC5maWxlcy5wcmVwYXJlRmlsZShmaWxlUGF0aCk7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGllbnQuZmlsZXMucGFyc2VEb2N1bWVudChmaWxlSGFuZGxlLCB7XG4gICAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMCB8fCBwcm9ncmVzcyA9PT0gMSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUHJvY2Vzc2luZyAke2ZpbGVOYW1lfTogJHsocHJvZ3Jlc3MgKiAxMDApLnRvRml4ZWQoMCl9JWAsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHJlc3VsdC5jb250ZW50KTtcbiAgICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgICAgc3RhZ2U6IFwibG1zdHVkaW9cIixcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgUGFyc2VkIGJ1dCBnb3QgdmVyeSBsaXR0bGUgdGV4dCBmcm9tICR7ZmlsZU5hbWV9IChsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH0pLCB3aWxsIHRyeSBmYWxsYmFja3NgLFxuICAgICAgKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICByZWFzb246IFwicGRmLmxtc3R1ZGlvLWVtcHR5XCIsXG4gICAgICAgIGRldGFpbHM6IGBsZW5ndGg9JHtjbGVhbmVkLmxlbmd0aH1gLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgaXNXZWJTb2NrZXRFcnJvciA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiZcbiAgICAgICAgKGVycm9yLm1lc3NhZ2UuaW5jbHVkZXMoXCJXZWJTb2NrZXRcIikgfHwgZXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcImNvbm5lY3Rpb24gY2xvc2VkXCIpKTtcblxuICAgICAgaWYgKGlzV2ViU29ja2V0RXJyb3IgJiYgYXR0ZW1wdCA8IG1heFJldHJpZXMpIHtcbiAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgIGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgV2ViU29ja2V0IGVycm9yIG9uICR7ZmlsZU5hbWV9LCByZXRyeWluZyAoJHthdHRlbXB0fS8ke21heFJldHJpZXN9KS4uLmAsXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDAgKiBhdHRlbXB0KSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKExNIFN0dWRpbykgRXJyb3IgcGFyc2luZyBQREYgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lcnJvclwiLFxuICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogZmFsc2UsXG4gICAgcmVhc29uOiBcInBkZi5sbXN0dWRpby1lcnJvclwiLFxuICAgIGRldGFpbHM6IFwiRXhjZWVkZWQgcmV0cnkgYXR0ZW1wdHNcIixcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJ5UGRmUGFyc2UoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG4gIHRyeSB7XG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgpO1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBkZlBhcnNlKGJ1ZmZlcik7XG4gICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuVGV4dChyZXN1bHQudGV4dCB8fCBcIlwiKTtcblxuICAgIGlmIChjbGVhbmVkLmxlbmd0aCA+PSBNSU5fVEVYVF9MRU5HVEgpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgU3VjY2Vzc2Z1bGx5IGV4dHJhY3RlZCB0ZXh0IGZyb20gJHtmaWxlTmFtZX1gKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHRleHQ6IGNsZWFuZWQsXG4gICAgICAgIHN0YWdlOiBcInBkZi1wYXJzZVwiLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKHBkZi1wYXJzZSkgVmVyeSBsaXR0bGUgb3Igbm8gdGV4dCBleHRyYWN0ZWQgZnJvbSAke2ZpbGVOYW1lfSAobGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9KWAsXG4gICAgKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLnBkZnBhcnNlLWVtcHR5XCIsXG4gICAgICBkZXRhaWxzOiBgbGVuZ3RoPSR7Y2xlYW5lZC5sZW5ndGh9YCxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYFtQREYgUGFyc2VyXSAocGRmLXBhcnNlKSBFcnJvciBwYXJzaW5nIFBERiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICByZWFzb246IFwicGRmLnBkZnBhcnNlLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiB0cnlPY3JXaXRoUGRmSnMoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8U3RhZ2VSZXN1bHQ+IHtcbiAgY29uc3QgZmlsZU5hbWUgPSBmaWxlUGF0aC5zcGxpdChcIi9cIikucG9wKCkgfHwgZmlsZVBhdGg7XG5cbiAgbGV0IHdvcmtlcjogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVXb3JrZXI+PiB8IG51bGwgPSBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHBkZmpzTGliID0gYXdhaXQgZ2V0UGRmanNMaWIoKTtcbiAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgZnMucHJvbWlzZXMucmVhZEZpbGUoZmlsZVBhdGgpKTtcbiAgICBjb25zdCBwZGZEb2N1bWVudCA9IGF3YWl0IHBkZmpzTGliXG4gICAgICAuZ2V0RG9jdW1lbnQoeyBkYXRhLCB2ZXJib3NpdHk6IHBkZmpzTGliLlZlcmJvc2l0eUxldmVsLkVSUk9SUyB9KVxuICAgICAgLnByb21pc2U7XG5cbiAgICBjb25zdCBudW1QYWdlcyA9IHBkZkRvY3VtZW50Lm51bVBhZ2VzO1xuICAgIGNvbnN0IG1heFBhZ2VzID0gTWF0aC5taW4obnVtUGFnZXMsIE9DUl9NQVhfUEFHRVMpO1xuXG4gICAgY29uc29sZS5sb2coXG4gICAgICBgW1BERiBQYXJzZXJdIChPQ1IpIFN0YXJ0aW5nIE9DUiBmb3IgJHtmaWxlTmFtZX0gLSBwYWdlcyAxIHRvICR7bWF4UGFnZXN9IChvZiAke251bVBhZ2VzfSlgLFxuICAgICk7XG5cbiAgICB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgY29uc3QgdGV4dFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGxldCByZW5kZXJFcnJvcnMgPSAwO1xuICAgIGxldCBwcm9jZXNzZWRJbWFnZXMgPSAwO1xuXG4gICAgZm9yIChsZXQgcGFnZU51bSA9IDE7IHBhZ2VOdW0gPD0gbWF4UGFnZXM7IHBhZ2VOdW0rKykge1xuICAgICAgbGV0IHBhZ2U7XG4gICAgICB0cnkge1xuICAgICAgICBwYWdlID0gYXdhaXQgcGRmRG9jdW1lbnQuZ2V0UGFnZShwYWdlTnVtKTtcbiAgICAgICAgY29uc3QgaW1hZ2VzID0gYXdhaXQgZXh0cmFjdEltYWdlc0ZvclBhZ2UocGRmanNMaWIsIHBhZ2UpO1xuICAgICAgICBpZiAoaW1hZ2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSAke2ZpbGVOYW1lfSAtIHBhZ2UgJHtwYWdlTnVtfSBjb250YWlucyBubyBleHRyYWN0YWJsZSBpbWFnZXMsIHNraXBwaW5nYCxcbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRJbWFnZXMgPSBpbWFnZXMuc2xpY2UoMCwgT0NSX01BWF9JTUFHRVNfUEVSX1BBR0UpO1xuICAgICAgICBmb3IgKGNvbnN0IGltYWdlIG9mIHNlbGVjdGVkSW1hZ2VzKSB7XG4gICAgICAgICAgY29uc3Qge1xuICAgICAgICAgICAgZGF0YTogeyB0ZXh0IH0sXG4gICAgICAgICAgfSA9IGF3YWl0IHdvcmtlci5yZWNvZ25pemUoaW1hZ2UuYnVmZmVyKTtcbiAgICAgICAgICBwcm9jZXNzZWRJbWFnZXMrKztcbiAgICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5UZXh0KHRleHQgfHwgXCJcIik7XG4gICAgICAgICAgaWYgKGNsZWFuZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGV4dFBhcnRzLnB1c2goY2xlYW5lZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBhZ2VOdW0gPT09IDEgfHwgcGFnZU51bSAlIDEwID09PSAwIHx8IHBhZ2VOdW0gPT09IG1heFBhZ2VzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICBgW1BERiBQYXJzZXJdIChPQ1IpICR7ZmlsZU5hbWV9IC0gcHJvY2Vzc2VkIHBhZ2UgJHtwYWdlTnVtfS8ke21heFBhZ2VzfSAoaW1hZ2VzPSR7cHJvY2Vzc2VkSW1hZ2VzfSwgY2hhcnM9JHt0ZXh0UGFydHMuam9pbihcbiAgICAgICAgICAgICAgXCJcXG5cXG5cIixcbiAgICAgICAgICAgICkubGVuZ3RofSlgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKHBhZ2VFcnJvcikge1xuICAgICAgICBpZiAocGFnZUVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgQWJvcnRpbmcgT0NSIGZvciAke2ZpbGVOYW1lfTogJHtwYWdlRXJyb3IubWVzc2FnZX1gLFxuICAgICAgICAgICk7XG4gICAgICAgICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgIHdvcmtlciA9IG51bGw7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgcmVhc29uOiBcInBkZi5vY3ItZXJyb3JcIixcbiAgICAgICAgICAgIGRldGFpbHM6IHBhZ2VFcnJvci5tZXNzYWdlLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmVuZGVyRXJyb3JzKys7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBFcnJvciBwcm9jZXNzaW5nIHBhZ2UgJHtwYWdlTnVtfSBvZiAke2ZpbGVOYW1lfTpgLFxuICAgICAgICAgIHBhZ2VFcnJvcixcbiAgICAgICAgKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGF3YWl0IHBhZ2U/LmNsZWFudXAoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgd29ya2VyID0gbnVsbDtcblxuICAgIGNvbnN0IGZ1bGxUZXh0ID0gY2xlYW5UZXh0KHRleHRQYXJ0cy5qb2luKFwiXFxuXFxuXCIpKTtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBbUERGIFBhcnNlcl0gKE9DUikgQ29tcGxldGVkIE9DUiBmb3IgJHtmaWxlTmFtZX0sIGV4dHJhY3RlZCAke2Z1bGxUZXh0Lmxlbmd0aH0gY2hhcmFjdGVyc2AsXG4gICAgKTtcblxuICAgIGlmIChmdWxsVGV4dC5sZW5ndGggPj0gTUlOX1RFWFRfTEVOR1RIKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICB0ZXh0OiBmdWxsVGV4dCxcbiAgICAgICAgc3RhZ2U6IFwib2NyXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChyZW5kZXJFcnJvcnMgPiAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgcmVhc29uOiBcInBkZi5vY3ItcmVuZGVyLWVycm9yXCIsXG4gICAgICAgIGRldGFpbHM6IGAke3JlbmRlckVycm9yc30gcGFnZSByZW5kZXIgZXJyb3JzYCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZW1wdHlcIixcbiAgICAgIGRldGFpbHM6IFwiT0NSIHByb2R1Y2VkIGluc3VmZmljaWVudCB0ZXh0XCIsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBbUERGIFBhcnNlcl0gKE9DUikgRXJyb3IgZHVyaW5nIE9DUiBmb3IgJHtmaWxlTmFtZX06YCwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIHJlYXNvbjogXCJwZGYub2NyLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAod29ya2VyKSB7XG4gICAgICBhd2FpdCB3b3JrZXIudGVybWluYXRlKCk7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RJbWFnZXNGb3JQYWdlKHBkZmpzTGliOiBQZGZKc01vZHVsZSwgcGFnZTogYW55KTogUHJvbWlzZTxFeHRyYWN0ZWRPY3JJbWFnZVtdPiB7XG4gIGNvbnN0IG9wZXJhdG9yTGlzdCA9IGF3YWl0IHBhZ2UuZ2V0T3BlcmF0b3JMaXN0KCk7XG4gIGNvbnN0IGltYWdlczogRXh0cmFjdGVkT2NySW1hZ2VbXSA9IFtdO1xuICBjb25zdCBpbWFnZURhdGFDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCBQcm9taXNlPGFueSB8IG51bGw+PigpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3BlcmF0b3JMaXN0LmZuQXJyYXkubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBmbiA9IG9wZXJhdG9yTGlzdC5mbkFycmF5W2ldO1xuICAgIGNvbnN0IGFyZ3MgPSBvcGVyYXRvckxpc3QuYXJnc0FycmF5W2ldO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmIChmbiA9PT0gcGRmanNMaWIuT1BTLnBhaW50SW1hZ2VYT2JqZWN0IHx8IGZuID09PSBwZGZqc0xpYi5PUFMucGFpbnRJbWFnZVhPYmplY3RSZXBlYXQpIHtcbiAgICAgICAgY29uc3Qgb2JqSWQgPSBhcmdzPy5bMF07XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqSWQgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaW1nRGF0YTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpbWdEYXRhID0gYXdhaXQgcmVzb2x2ZUltYWdlRGF0YShwYWdlLCBvYmpJZCwgaW1hZ2VEYXRhQ2FjaGUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEltYWdlRGF0YVRpbWVvdXRFcnJvcikge1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUud2FybihcIltQREYgUGFyc2VyXSAoT0NSKSBGYWlsZWQgdG8gcmVzb2x2ZSBpbWFnZSBkYXRhOlwiLCBlcnJvcik7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpbWdEYXRhKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEltYWdlRGF0YVRvUG5nKHBkZmpzTGliLCBpbWdEYXRhKTtcbiAgICAgICAgaWYgKGNvbnZlcnRlZCkge1xuICAgICAgICAgIGltYWdlcy5wdXNoKGNvbnZlcnRlZCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZm4gPT09IHBkZmpzTGliLk9QUy5wYWludElubGluZUltYWdlWE9iamVjdCAmJiBhcmdzPy5bMF0pIHtcbiAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEltYWdlRGF0YVRvUG5nKHBkZmpzTGliLCBhcmdzWzBdKTtcbiAgICAgICAgaWYgKGNvbnZlcnRlZCkge1xuICAgICAgICAgIGltYWdlcy5wdXNoKGNvbnZlcnRlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgSW1hZ2VEYXRhVGltZW91dEVycm9yKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgICAgY29uc29sZS53YXJuKFwiW1BERiBQYXJzZXJdIChPQ1IpIEZhaWxlZCB0byBleHRyYWN0IGlubGluZSBpbWFnZTpcIiwgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBpbWFnZXNcbiAgICAuZmlsdGVyKChpbWFnZSkgPT4gaW1hZ2UuYXJlYSA+PSBPQ1JfTUlOX0lNQUdFX0FSRUEpXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuYXJlYSAtIGEuYXJlYSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVJbWFnZURhdGEoXG4gIHBhZ2U6IGFueSxcbiAgb2JqSWQ6IHN0cmluZyxcbiAgY2FjaGU6IE1hcDxzdHJpbmcsIFByb21pc2U8YW55IHwgbnVsbD4+LFxuKTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XG4gIGlmIChjYWNoZS5oYXMob2JqSWQpKSB7XG4gICAgcmV0dXJuIGNhY2hlLmdldChvYmpJZCkhO1xuICB9XG5cbiAgY29uc3QgcHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgcGFnZS5vYmpzLmhhcyA9PT0gXCJmdW5jdGlvblwiICYmIHBhZ2Uub2Jqcy5oYXMob2JqSWQpKSB7XG4gICAgICAgIHJldHVybiBwYWdlLm9ianMuZ2V0KG9iaklkKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIGZhbGwgdGhyb3VnaCB0byBhc3luYyBwYXRoXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBzZXR0bGVkID0gZmFsc2U7XG4gICAgICBsZXQgdGltZW91dEhhbmRsZTogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRpbWVvdXRIYW5kbGUpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZSk7XG4gICAgICAgICAgdGltZW91dEhhbmRsZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGhhbmRsZURhdGEgPSAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBwYWdlLm9ianMuZ2V0KG9iaklkLCBoYW5kbGVEYXRhKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShPQ1JfSU1BR0VfVElNRU9VVF9NUykgJiYgT0NSX0lNQUdFX1RJTUVPVVRfTVMgPiAwKSB7XG4gICAgICAgIHRpbWVvdXRIYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBpZiAoIXNldHRsZWQpIHtcbiAgICAgICAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBJbWFnZURhdGFUaW1lb3V0RXJyb3Iob2JqSWQpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIE9DUl9JTUFHRV9USU1FT1VUX01TKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSkoKTtcblxuICBjYWNoZS5zZXQob2JqSWQsIHByb21pc2UpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltYWdlRGF0YVRvUG5nKFxuICBwZGZqc0xpYjogUGRmSnNNb2R1bGUsXG4gIGltZ0RhdGE6IGFueSxcbik6IEV4dHJhY3RlZE9jckltYWdlIHwgbnVsbCB7XG4gIGlmICghaW1nRGF0YSB8fCB0eXBlb2YgaW1nRGF0YS53aWR0aCAhPT0gXCJudW1iZXJcIiB8fCB0eXBlb2YgaW1nRGF0YS5oZWlnaHQgIT09IFwibnVtYmVyXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHsgd2lkdGgsIGhlaWdodCwga2luZCwgZGF0YSB9ID0gaW1nRGF0YTtcbiAgaWYgKCFkYXRhKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCBwbmcgPSBuZXcgUE5HKHsgd2lkdGgsIGhlaWdodCB9KTtcbiAgY29uc3QgZGVzdCA9IHBuZy5kYXRhO1xuXG4gIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuUkdCQV8zMkJQUCAmJiBkYXRhLmxlbmd0aCA9PT0gd2lkdGggKiBoZWlnaHQgKiA0KSB7XG4gICAgZGVzdC5zZXQoQnVmZmVyLmZyb20oZGF0YSkpO1xuICB9IGVsc2UgaWYgKGtpbmQgPT09IHBkZmpzTGliLkltYWdlS2luZC5SR0JfMjRCUFAgJiYgZGF0YS5sZW5ndGggPT09IHdpZHRoICogaGVpZ2h0ICogMykge1xuICAgIGNvbnN0IHNyYyA9IGRhdGEgYXMgVWludDhBcnJheTtcbiAgICBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCBzcmMubGVuZ3RoOyBpICs9IDMsIGogKz0gNCkge1xuICAgICAgZGVzdFtqXSA9IHNyY1tpXTtcbiAgICAgIGRlc3RbaiArIDFdID0gc3JjW2kgKyAxXTtcbiAgICAgIGRlc3RbaiArIDJdID0gc3JjW2kgKyAyXTtcbiAgICAgIGRlc3RbaiArIDNdID0gMjU1O1xuICAgIH1cbiAgfSBlbHNlIGlmIChraW5kID09PSBwZGZqc0xpYi5JbWFnZUtpbmQuR1JBWVNDQUxFXzFCUFApIHtcbiAgICBsZXQgcGl4ZWxJbmRleCA9IDA7XG4gICAgY29uc3QgdG90YWxQaXhlbHMgPSB3aWR0aCAqIGhlaWdodDtcbiAgICBmb3IgKGxldCBieXRlSW5kZXggPSAwOyBieXRlSW5kZXggPCBkYXRhLmxlbmd0aCAmJiBwaXhlbEluZGV4IDwgdG90YWxQaXhlbHM7IGJ5dGVJbmRleCsrKSB7XG4gICAgICBjb25zdCBieXRlID0gZGF0YVtieXRlSW5kZXhdO1xuICAgICAgZm9yIChsZXQgYml0ID0gNzsgYml0ID49IDAgJiYgcGl4ZWxJbmRleCA8IHRvdGFsUGl4ZWxzOyBiaXQtLSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IChieXRlID4+IGJpdCkgJiAxID8gMjU1IDogMDtcbiAgICAgICAgY29uc3QgZGVzdEluZGV4ID0gcGl4ZWxJbmRleCAqIDQ7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4XSA9IHZhbHVlO1xuICAgICAgICBkZXN0W2Rlc3RJbmRleCArIDFdID0gdmFsdWU7XG4gICAgICAgIGRlc3RbZGVzdEluZGV4ICsgMl0gPSB2YWx1ZTtcbiAgICAgICAgZGVzdFtkZXN0SW5kZXggKyAzXSA9IDI1NTtcbiAgICAgICAgcGl4ZWxJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYnVmZmVyOiBQTkcuc3luYy53cml0ZShwbmcpLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBhcmVhOiB3aWR0aCAqIGhlaWdodCxcbiAgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBQREYgZmlsZXMgd2l0aCBhIG11bHRpLXN0YWdlIHN0cmF0ZWd5OlxuICogMS4gVXNlIExNIFN0dWRpbydzIGJ1aWx0LWluIGRvY3VtZW50IHBhcnNlciAoZmFzdCwgc2VydmVyLXNpZGUsIG1heSBpbmNsdWRlIE9DUilcbiAqIDIuIEZhbGxiYWNrIHRvIGxvY2FsIHBkZi1wYXJzZSBmb3IgdGV4dC1iYXNlZCBQREZzXG4gKiAzLiBJZiBzdGlsbCBubyB0ZXh0IGFuZCBPQ1IgaXMgZW5hYmxlZCwgZmFsbGJhY2sgdG8gUERGLmpzICsgVGVzc2VyYWN0IE9DUlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VQREYoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQsXG4gIGVuYWJsZU9DUjogYm9vbGVhbixcbik6IFByb21pc2U8UGRmUGFyc2VyUmVzdWx0PiB7XG4gIGNvbnN0IGZpbGVOYW1lID0gZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoO1xuXG4gIC8vIDEpIExNIFN0dWRpbyBwYXJzZXJcbiAgY29uc3QgbG1TdHVkaW9SZXN1bHQgPSBhd2FpdCB0cnlMbVN0dWRpb1BhcnNlcihmaWxlUGF0aCwgY2xpZW50KTtcbiAgaWYgKGxtU3R1ZGlvUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICByZXR1cm4gbG1TdHVkaW9SZXN1bHQ7XG4gIH1cbiAgbGV0IGxhc3RGYWlsdXJlOiBQZGZQYXJzZXJGYWlsdXJlID0gbG1TdHVkaW9SZXN1bHQ7XG5cbiAgLy8gMikgTG9jYWwgcGRmLXBhcnNlIGZhbGxiYWNrXG4gIGNvbnN0IHBkZlBhcnNlUmVzdWx0ID0gYXdhaXQgdHJ5UGRmUGFyc2UoZmlsZVBhdGgpO1xuICBpZiAocGRmUGFyc2VSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBwZGZQYXJzZVJlc3VsdDtcbiAgfVxuICBsYXN0RmFpbHVyZSA9IHBkZlBhcnNlUmVzdWx0O1xuXG4gIC8vIDMpIE9DUiBmYWxsYmFjayAob25seSBpZiBlbmFibGVkKVxuICBpZiAoIWVuYWJsZU9DUikge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtQREYgUGFyc2VyXSAoT0NSKSBFbmFibGUgT0NSIGlzIG9mZiwgc2tpcHBpbmcgT0NSIGZhbGxiYWNrIGZvciAke2ZpbGVOYW1lfSBhZnRlciBvdGhlciBtZXRob2RzIHJldHVybmVkIG5vIHRleHRgLFxuICAgICk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBkZi5vY3ItZGlzYWJsZWRcIixcbiAgICAgIGRldGFpbHM6IGBQcmV2aW91cyBmYWlsdXJlIHJlYXNvbjogJHtsYXN0RmFpbHVyZS5yZWFzb259YCxcbiAgICB9O1xuICB9XG5cbiAgY29uc29sZS5sb2coXG4gICAgYFtQREYgUGFyc2VyXSAoT0NSKSBObyB0ZXh0IGV4dHJhY3RlZCBmcm9tICR7ZmlsZU5hbWV9IHdpdGggTE0gU3R1ZGlvIG9yIHBkZi1wYXJzZSwgYXR0ZW1wdGluZyBPQ1IuLi5gLFxuICApO1xuXG4gIGNvbnN0IG9jclJlc3VsdCA9IGF3YWl0IHRyeU9jcldpdGhQZGZKcyhmaWxlUGF0aCk7XG4gIGlmIChvY3JSZXN1bHQuc3VjY2Vzcykge1xuICAgIHJldHVybiBvY3JSZXN1bHQ7XG4gIH1cblxuICByZXR1cm4gb2NyUmVzdWx0O1xufVxuXG4iLCAiLy8gQHRzLWlnbm9yZSAtIGVwdWIyIGRvZXNuJ3QgaGF2ZSBjb21wbGV0ZSB0eXBlc1xuaW1wb3J0IHsgRVB1YiB9IGZyb20gXCJlcHViMlwiO1xuXG4vKipcbiAqIFBhcnNlIEVQVUIgZmlsZXMgYW5kIGV4dHJhY3QgdGV4dCBjb250ZW50XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUVQVUIoZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVwdWIgPSBuZXcgRVB1YihmaWxlUGF0aCk7XG4gICAgICBcbiAgICAgIGVwdWIub24oXCJlcnJvclwiLCAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgRVBVQiBmaWxlICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBjb25zdCBzdHJpcEh0bWwgPSAoaW5wdXQ6IHN0cmluZykgPT5cbiAgICAgICAgaW5wdXQucmVwbGFjZSgvPFtePl0qPi9nLCBcIiBcIik7XG5cbiAgICAgIGNvbnN0IGdldE1hbmlmZXN0RW50cnkgPSAoY2hhcHRlcklkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgcmV0dXJuIChlcHViIGFzIHVua25vd24gYXMgeyBtYW5pZmVzdD86IFJlY29yZDxzdHJpbmcsIHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+IH0pLm1hbmlmZXN0Py5bY2hhcHRlcklkXTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IGRlY29kZU1lZGlhVHlwZSA9IChlbnRyeT86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0pID0+XG4gICAgICAgIGVudHJ5Py5bXCJtZWRpYS10eXBlXCJdIHx8IGVudHJ5Py5tZWRpYVR5cGUgfHwgXCJcIjtcblxuICAgICAgY29uc3Qgc2hvdWxkUmVhZFJhdyA9IChtZWRpYVR5cGU6IHN0cmluZykgPT4ge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkID0gbWVkaWFUeXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5vcm1hbGl6ZWQgPT09IFwiYXBwbGljYXRpb24veGh0bWwreG1sXCIgfHwgbm9ybWFsaXplZCA9PT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobm9ybWFsaXplZC5zdGFydHNXaXRoKFwidGV4dC9cIikpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub3JtYWxpemVkLmluY2x1ZGVzKFwiaHRtbFwiKSkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZWFkQ2hhcHRlciA9IGFzeW5jIChjaGFwdGVySWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgICAgIGNvbnN0IG1hbmlmZXN0RW50cnkgPSBnZXRNYW5pZmVzdEVudHJ5KGNoYXB0ZXJJZCk7XG4gICAgICAgIGlmICghbWFuaWZlc3RFbnRyeSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybihgRVBVQiBjaGFwdGVyICR7Y2hhcHRlcklkfSBtaXNzaW5nIG1hbmlmZXN0IGVudHJ5IGluICR7ZmlsZVBhdGh9LCBza2lwcGluZ2ApO1xuICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVkaWFUeXBlID0gZGVjb2RlTWVkaWFUeXBlKG1hbmlmZXN0RW50cnkpO1xuICAgICAgICBpZiAoc2hvdWxkUmVhZFJhdyhtZWRpYVR5cGUpKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgICAgICAgZXB1Yi5nZXRGaWxlKFxuICAgICAgICAgICAgICBjaGFwdGVySWQsXG4gICAgICAgICAgICAgIChlcnJvcjogRXJyb3IgfCBudWxsLCBkYXRhPzogQnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICByZWooZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIWRhdGEpIHtcbiAgICAgICAgICAgICAgICAgIHJlcyhcIlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgcmVzKHN0cmlwSHRtbChkYXRhLnRvU3RyaW5nKFwidXRmLThcIikpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICAgICAgZXB1Yi5nZXRDaGFwdGVyKFxuICAgICAgICAgICAgY2hhcHRlcklkLFxuICAgICAgICAgICAgKGVycm9yOiBFcnJvciB8IG51bGwsIHRleHQ/OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmVqKGVycm9yKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdGV4dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJlcyhzdHJpcEh0bWwodGV4dCkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyhcIlwiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcblxuICAgICAgZXB1Yi5vbihcImVuZFwiLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2hhcHRlcnMgPSBlcHViLmZsb3c7XG4gICAgICAgICAgY29uc3QgdGV4dFBhcnRzOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgIFxuICAgICAgICAgIGZvciAoY29uc3QgY2hhcHRlciBvZiBjaGFwdGVycykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgY2hhcHRlcklkID0gY2hhcHRlci5pZDtcbiAgICAgICAgICAgICAgaWYgKCFjaGFwdGVySWQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEVQVUIgY2hhcHRlciBtaXNzaW5nIGlkIGluICR7ZmlsZVBhdGh9LCBza2lwcGluZ2ApO1xuICAgICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKFwiXCIpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHJlYWRDaGFwdGVyKGNoYXB0ZXJJZCk7XG4gICAgICAgICAgICAgIHRleHRQYXJ0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoY2hhcHRlckVycm9yKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlYWRpbmcgY2hhcHRlciAke2NoYXB0ZXIuaWR9OmAsIGNoYXB0ZXJFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGZ1bGxUZXh0ID0gdGV4dFBhcnRzLmpvaW4oXCJcXG5cXG5cIik7XG4gICAgICAgICAgcmVzb2x2ZShcbiAgICAgICAgICAgIGZ1bGxUZXh0XG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKVxuICAgICAgICAgICAgICAucmVwbGFjZSgvXFxuKy9nLCBcIlxcblwiKVxuICAgICAgICAgICAgICAudHJpbSgpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwcm9jZXNzaW5nIEVQVUIgY2hhcHRlcnM6YCwgZXJyb3IpO1xuICAgICAgICAgIHJlc29sdmUoXCJcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBlcHViLnBhcnNlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluaXRpYWxpemluZyBFUFVCIHBhcnNlciBmb3IgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgcmVzb2x2ZShcIlwiKTtcbiAgICB9XG4gIH0pO1xufVxuXG4iLCAiaW1wb3J0IHsgY3JlYXRlV29ya2VyIH0gZnJvbSBcInRlc3NlcmFjdC5qc1wiO1xuXG4vKipcbiAqIFBhcnNlIGltYWdlIGZpbGVzIHVzaW5nIE9DUiAoVGVzc2VyYWN0KVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcGFyc2VJbWFnZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB3b3JrZXIgPSBhd2FpdCBjcmVhdGVXb3JrZXIoXCJlbmdcIik7XG4gICAgXG4gICAgY29uc3QgeyBkYXRhOiB7IHRleHQgfSB9ID0gYXdhaXQgd29ya2VyLnJlY29nbml6ZShmaWxlUGF0aCk7XG4gICAgXG4gICAgYXdhaXQgd29ya2VyLnRlcm1pbmF0ZSgpO1xuICAgIFxuICAgIHJldHVybiB0ZXh0XG4gICAgICAucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcbiAgICAgIC5yZXBsYWNlKC9cXG4rL2csIFwiXFxuXCIpXG4gICAgICAudHJpbSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHBhcnNpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuIiwgImltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhcnNlVGV4dE9wdGlvbnMge1xuICBzdHJpcE1hcmtkb3duPzogYm9vbGVhbjtcbiAgcHJlc2VydmVMaW5lQnJlYWtzPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQYXJzZSBwbGFpbiB0ZXh0IGZpbGVzICh0eHQsIG1kIGFuZCByZWxhdGVkIGZvcm1hdHMpXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZVRleHQoXG4gIGZpbGVQYXRoOiBzdHJpbmcsXG4gIG9wdGlvbnM6IFBhcnNlVGV4dE9wdGlvbnMgPSB7fSxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHsgc3RyaXBNYXJrZG93biA9IGZhbHNlLCBwcmVzZXJ2ZUxpbmVCcmVha3MgPSBmYWxzZSB9ID0gb3B0aW9ucztcblxuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCBmcy5wcm9taXNlcy5yZWFkRmlsZShmaWxlUGF0aCwgXCJ1dGYtOFwiKTtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplTGluZUVuZGluZ3MoY29udGVudCk7XG5cbiAgICBjb25zdCBzdHJpcHBlZCA9IHN0cmlwTWFya2Rvd24gPyBzdHJpcE1hcmtkb3duU3ludGF4KG5vcm1hbGl6ZWQpIDogbm9ybWFsaXplZDtcblxuICAgIHJldHVybiAocHJlc2VydmVMaW5lQnJlYWtzID8gY29sbGFwc2VXaGl0ZXNwYWNlQnV0S2VlcExpbmVzKHN0cmlwcGVkKSA6IGNvbGxhcHNlV2hpdGVzcGFjZShzdHJpcHBlZCkpLnRyaW0oKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIHRleHQgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGluZUVuZGluZ3MoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXHJcXG4/L2csIFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBjb2xsYXBzZVdoaXRlc3BhY2UoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbn1cblxuZnVuY3Rpb24gY29sbGFwc2VXaGl0ZXNwYWNlQnV0S2VlcExpbmVzKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gKFxuICAgIGlucHV0XG4gICAgICAvLyBUcmltIHRyYWlsaW5nIHdoaXRlc3BhY2UgcGVyIGxpbmVcbiAgICAgIC5yZXBsYWNlKC9bIFxcdF0rXFxuL2csIFwiXFxuXCIpXG4gICAgICAvLyBDb2xsYXBzZSBtdWx0aXBsZSBibGFuayBsaW5lcyBidXQga2VlcCBwYXJhZ3JhcGggc2VwYXJhdGlvblxuICAgICAgLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIilcbiAgICAgIC8vIENvbGxhcHNlIGludGVybmFsIHNwYWNlcy90YWJzXG4gICAgICAucmVwbGFjZSgvWyBcXHRdezIsfS9nLCBcIiBcIilcbiAgKTtcbn1cblxuZnVuY3Rpb24gc3RyaXBNYXJrZG93blN5bnRheChpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgbGV0IG91dHB1dCA9IGlucHV0O1xuXG4gIC8vIFJlbW92ZSBmZW5jZWQgY29kZSBibG9ja3NcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL2BgYFtcXHNcXFNdKj9gYGAvZywgXCIgXCIpO1xuICAvLyBSZW1vdmUgaW5saW5lIGNvZGVcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL2AoW15gXSspYC9nLCBcIiQxXCIpO1xuICAvLyBSZXBsYWNlIGltYWdlcyB3aXRoIGFsdCB0ZXh0XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8hXFxbKFteXFxdXSopXFxdXFwoW14pXSpcXCkvZywgXCIkMSBcIik7XG4gIC8vIFJlcGxhY2UgbGlua3Mgd2l0aCBsaW5rIHRleHRcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL1xcWyhbXlxcXV0rKVxcXVxcKFteKV0qXFwpL2csIFwiJDFcIik7XG4gIC8vIFJlbW92ZSBlbXBoYXNpcyBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8oXFwqXFwqfF9fKSguKj8pXFwxL2csIFwiJDJcIik7XG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8oXFwqfF8pKC4qPylcXDEvZywgXCIkMlwiKTtcbiAgLy8gUmVtb3ZlIGhlYWRpbmdzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM30jezEsNn1cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIGJsb2NrIHF1b3Rlc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9Plxccz8vZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgdW5vcmRlcmVkIGxpc3QgbWFya2Vyc1xuICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvXlxcc3swLDN9Wy0qK11cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIG9yZGVyZWQgbGlzdCBtYXJrZXJzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC9eXFxzezAsM31cXGQrW1xcLlxcKV1cXHMrL2dtLCBcIlwiKTtcbiAgLy8gUmVtb3ZlIGhvcml6b250YWwgcnVsZXNcbiAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoL15cXHN7MCwzfShbLSpfXVxccz8pezMsfSQvZ20sIFwiXCIpO1xuICAvLyBSZW1vdmUgcmVzaWR1YWwgSFRNTCB0YWdzXG4gIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC88W14+XSs+L2csIFwiIFwiKTtcblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4iLCAiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcGFyc2VIVE1MIH0gZnJvbSBcIi4vaHRtbFBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VQREYsIHR5cGUgUGRmRmFpbHVyZVJlYXNvbiB9IGZyb20gXCIuL3BkZlBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VFUFVCIH0gZnJvbSBcIi4vZXB1YlBhcnNlclwiO1xuaW1wb3J0IHsgcGFyc2VJbWFnZSB9IGZyb20gXCIuL2ltYWdlUGFyc2VyXCI7XG5pbXBvcnQgeyBwYXJzZVRleHQgfSBmcm9tIFwiLi90ZXh0UGFyc2VyXCI7XG5pbXBvcnQgeyB0eXBlIExNU3R1ZGlvQ2xpZW50IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7XG4gIElNQUdFX0VYVEVOU0lPTl9TRVQsXG4gIGlzSHRtbEV4dGVuc2lvbixcbiAgaXNNYXJrZG93bkV4dGVuc2lvbixcbiAgaXNQbGFpblRleHRFeHRlbnNpb24sXG4gIGlzVGV4dHVhbEV4dGVuc2lvbixcbn0gZnJvbSBcIi4uL3V0aWxzL3N1cHBvcnRlZEV4dGVuc2lvbnNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWREb2N1bWVudCB7XG4gIHRleHQ6IHN0cmluZztcbiAgbWV0YWRhdGE6IHtcbiAgICBmaWxlUGF0aDogc3RyaW5nO1xuICAgIGZpbGVOYW1lOiBzdHJpbmc7XG4gICAgZXh0ZW5zaW9uOiBzdHJpbmc7XG4gICAgcGFyc2VkQXQ6IERhdGU7XG4gIH07XG59XG5cbmV4cG9ydCB0eXBlIFBhcnNlRmFpbHVyZVJlYXNvbiA9XG4gIHwgXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIlxuICB8IFwicGRmLm1pc3NpbmctY2xpZW50XCJcbiAgfCBQZGZGYWlsdXJlUmVhc29uXG4gIHwgXCJlcHViLmVtcHR5XCJcbiAgfCBcImh0bWwuZW1wdHlcIlxuICB8IFwiaHRtbC5lcnJvclwiXG4gIHwgXCJ0ZXh0LmVtcHR5XCJcbiAgfCBcInRleHQuZXJyb3JcIlxuICB8IFwiaW1hZ2Uub2NyLWRpc2FibGVkXCJcbiAgfCBcImltYWdlLmVtcHR5XCJcbiAgfCBcImltYWdlLmVycm9yXCJcbiAgfCBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCI7XG5cbmV4cG9ydCB0eXBlIERvY3VtZW50UGFyc2VSZXN1bHQgPVxuICB8IHsgc3VjY2VzczogdHJ1ZTsgZG9jdW1lbnQ6IFBhcnNlZERvY3VtZW50IH1cbiAgfCB7IHN1Y2Nlc3M6IGZhbHNlOyByZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbjsgZGV0YWlscz86IHN0cmluZyB9O1xuXG4vKipcbiAqIFBhcnNlIGEgZG9jdW1lbnQgZmlsZSBiYXNlZCBvbiBpdHMgZXh0ZW5zaW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZURvY3VtZW50KFxuICBmaWxlUGF0aDogc3RyaW5nLFxuICBlbmFibGVPQ1I6IGJvb2xlYW4gPSBmYWxzZSxcbiAgY2xpZW50PzogTE1TdHVkaW9DbGllbnQsXG4pOiBQcm9taXNlPERvY3VtZW50UGFyc2VSZXN1bHQ+IHtcbiAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpO1xuXG4gIGNvbnN0IGJ1aWxkU3VjY2VzcyA9ICh0ZXh0OiBzdHJpbmcpOiBEb2N1bWVudFBhcnNlUmVzdWx0ID0+ICh7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkb2N1bWVudDoge1xuICAgICAgdGV4dCxcbiAgICAgIG1ldGFkYXRhOiB7XG4gICAgICAgIGZpbGVQYXRoLFxuICAgICAgICBmaWxlTmFtZSxcbiAgICAgICAgZXh0ZW5zaW9uOiBleHQsXG4gICAgICAgIHBhcnNlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICB0cnkge1xuICAgIGlmIChpc0h0bWxFeHRlbnNpb24oZXh0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGNsZWFuQW5kVmFsaWRhdGUoXG4gICAgICAgICAgYXdhaXQgcGFyc2VIVE1MKGZpbGVQYXRoKSxcbiAgICAgICAgICBcImh0bWwuZW1wdHlcIixcbiAgICAgICAgICBgJHtmaWxlTmFtZX0gaHRtbGAsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0ZXh0LnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3ModGV4dC52YWx1ZSkgOiB0ZXh0O1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihgW1BhcnNlcl1bSFRNTF0gRXJyb3IgcGFyc2luZyAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgcmVhc29uOiBcImh0bWwuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIucGRmXCIpIHtcbiAgICAgIGlmICghY2xpZW50KSB7XG4gICAgICAgIGNvbnNvbGUud2FybihgW1BhcnNlcl0gTm8gTE0gU3R1ZGlvIGNsaWVudCBhdmFpbGFibGUgZm9yIFBERiBwYXJzaW5nOiAke2ZpbGVOYW1lfWApO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInBkZi5taXNzaW5nLWNsaWVudFwiIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwZGZSZXN1bHQgPSBhd2FpdCBwYXJzZVBERihmaWxlUGF0aCwgY2xpZW50LCBlbmFibGVPQ1IpO1xuICAgICAgaWYgKHBkZlJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgIHJldHVybiBidWlsZFN1Y2Nlc3MocGRmUmVzdWx0LnRleHQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBkZlJlc3VsdDtcbiAgICB9XG5cbiAgICBpZiAoZXh0ID09PSBcIi5lcHViXCIpIHtcbiAgICAgIGNvbnN0IHRleHQgPSBhd2FpdCBwYXJzZUVQVUIoZmlsZVBhdGgpO1xuICAgICAgY29uc3QgY2xlYW5lZCA9IGNsZWFuQW5kVmFsaWRhdGUodGV4dCwgXCJlcHViLmVtcHR5XCIsIGZpbGVOYW1lKTtcbiAgICAgIHJldHVybiBjbGVhbmVkLnN1Y2Nlc3MgPyBidWlsZFN1Y2Nlc3MoY2xlYW5lZC52YWx1ZSkgOiBjbGVhbmVkO1xuICAgIH1cblxuICAgIGlmIChpc1RleHR1YWxFeHRlbnNpb24oZXh0KSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdGV4dCA9IGF3YWl0IHBhcnNlVGV4dChmaWxlUGF0aCwge1xuICAgICAgICAgIHN0cmlwTWFya2Rvd246IGlzTWFya2Rvd25FeHRlbnNpb24oZXh0KSxcbiAgICAgICAgICBwcmVzZXJ2ZUxpbmVCcmVha3M6IGlzUGxhaW5UZXh0RXh0ZW5zaW9uKGV4dCksXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBjbGVhbmVkID0gY2xlYW5BbmRWYWxpZGF0ZSh0ZXh0LCBcInRleHQuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW1RleHRdIEVycm9yIHBhcnNpbmcgJHtmaWxlUGF0aH06YCwgZXJyb3IpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIHJlYXNvbjogXCJ0ZXh0LmVycm9yXCIsXG4gICAgICAgICAgZGV0YWlsczogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChJTUFHRV9FWFRFTlNJT05fU0VULmhhcyhleHQpKSB7XG4gICAgICBpZiAoIWVuYWJsZU9DUikge1xuICAgICAgICBjb25zb2xlLmxvZyhgU2tpcHBpbmcgaW1hZ2UgZmlsZSAke2ZpbGVQYXRofSAoT0NSIGRpc2FibGVkKWApO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcImltYWdlLm9jci1kaXNhYmxlZFwiIH07XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gYXdhaXQgcGFyc2VJbWFnZShmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IGNsZWFuZWQgPSBjbGVhbkFuZFZhbGlkYXRlKHRleHQsIFwiaW1hZ2UuZW1wdHlcIiwgZmlsZU5hbWUpO1xuICAgICAgICByZXR1cm4gY2xlYW5lZC5zdWNjZXNzID8gYnVpbGRTdWNjZXNzKGNsZWFuZWQudmFsdWUpIDogY2xlYW5lZDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYFtQYXJzZXJdW0ltYWdlXSBFcnJvciBwYXJzaW5nICR7ZmlsZVBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICByZWFzb246IFwiaW1hZ2UuZXJyb3JcIixcbiAgICAgICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV4dCA9PT0gXCIucmFyXCIpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBSQVIgZmlsZXMgbm90IHlldCBzdXBwb3J0ZWQ6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVhc29uOiBcInVuc3VwcG9ydGVkLWV4dGVuc2lvblwiLCBkZXRhaWxzOiBcIi5yYXJcIiB9O1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKGBVbnN1cHBvcnRlZCBmaWxlIHR5cGU6ICR7ZmlsZVBhdGh9YCk7XG4gICAgcmV0dXJuIHsgc3VjY2VzczogZmFsc2UsIHJlYXNvbjogXCJ1bnN1cHBvcnRlZC1leHRlbnNpb25cIiwgZGV0YWlsczogZXh0IH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcGFyc2luZyBkb2N1bWVudCAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICBkZXRhaWxzOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgfTtcbiAgfVxufVxuXG50eXBlIENsZWFuUmVzdWx0ID1cbiAgfCB7IHN1Y2Nlc3M6IHRydWU7IHZhbHVlOiBzdHJpbmcgfVxuICB8IHsgc3VjY2VzczogZmFsc2U7IHJlYXNvbjogUGFyc2VGYWlsdXJlUmVhc29uOyBkZXRhaWxzPzogc3RyaW5nIH07XG5cbmZ1bmN0aW9uIGNsZWFuQW5kVmFsaWRhdGUoXG4gIHRleHQ6IHN0cmluZyxcbiAgZW1wdHlSZWFzb246IFBhcnNlRmFpbHVyZVJlYXNvbixcbiAgZGV0YWlsc0NvbnRleHQ/OiBzdHJpbmcsXG4pOiBDbGVhblJlc3VsdCB7XG4gIGNvbnN0IGNsZWFuZWQgPSB0ZXh0Py50cmltKCkgPz8gXCJcIjtcbiAgaWYgKGNsZWFuZWQubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgcmVhc29uOiBlbXB0eVJlYXNvbixcbiAgICAgIGRldGFpbHM6IGRldGFpbHNDb250ZXh0ID8gYCR7ZGV0YWlsc0NvbnRleHR9IHRyaW1tZWQgdG8gemVybyBsZW5ndGhgIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgdmFsdWU6IGNsZWFuZWQgfTtcbn1cblxuIiwgIi8qKlxuICogU2ltcGxlIHRleHQgY2h1bmtlciB0aGF0IHNwbGl0cyB0ZXh0IGludG8gb3ZlcmxhcHBpbmcgY2h1bmtzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaHVua1RleHQoXG4gIHRleHQ6IHN0cmluZyxcbiAgY2h1bmtTaXplOiBudW1iZXIsXG4gIG92ZXJsYXA6IG51bWJlcixcbik6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBzdGFydEluZGV4OiBudW1iZXI7IGVuZEluZGV4OiBudW1iZXIgfT4ge1xuICBjb25zdCBjaHVua3M6IEFycmF5PHsgdGV4dDogc3RyaW5nOyBzdGFydEluZGV4OiBudW1iZXI7IGVuZEluZGV4OiBudW1iZXIgfT4gPSBbXTtcbiAgXG4gIC8vIFNpbXBsZSB3b3JkLWJhc2VkIGNodW5raW5nXG4gIGNvbnN0IHdvcmRzID0gdGV4dC5zcGxpdCgvXFxzKy8pO1xuICBcbiAgaWYgKHdvcmRzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBjaHVua3M7XG4gIH1cbiAgXG4gIGxldCBzdGFydElkeCA9IDA7XG4gIFxuICB3aGlsZSAoc3RhcnRJZHggPCB3b3Jkcy5sZW5ndGgpIHtcbiAgICBjb25zdCBlbmRJZHggPSBNYXRoLm1pbihzdGFydElkeCArIGNodW5rU2l6ZSwgd29yZHMubGVuZ3RoKTtcbiAgICBjb25zdCBjaHVua1dvcmRzID0gd29yZHMuc2xpY2Uoc3RhcnRJZHgsIGVuZElkeCk7XG4gICAgY29uc3QgY2h1bmtUZXh0ID0gY2h1bmtXb3Jkcy5qb2luKFwiIFwiKTtcbiAgICBcbiAgICBjaHVua3MucHVzaCh7XG4gICAgICB0ZXh0OiBjaHVua1RleHQsXG4gICAgICBzdGFydEluZGV4OiBzdGFydElkeCxcbiAgICAgIGVuZEluZGV4OiBlbmRJZHgsXG4gICAgfSk7XG4gICAgXG4gICAgLy8gTW92ZSBmb3J3YXJkIGJ5IChjaHVua1NpemUgLSBvdmVybGFwKSB0byBjcmVhdGUgb3ZlcmxhcHBpbmcgY2h1bmtzXG4gICAgc3RhcnRJZHggKz0gTWF0aC5tYXgoMSwgY2h1bmtTaXplIC0gb3ZlcmxhcCk7XG4gICAgXG4gICAgLy8gQnJlYWsgaWYgd2UndmUgcmVhY2hlZCB0aGUgZW5kXG4gICAgaWYgKGVuZElkeCA+PSB3b3Jkcy5sZW5ndGgpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBcbiAgcmV0dXJuIGNodW5rcztcbn1cblxuLyoqXG4gKiBFc3RpbWF0ZSB0b2tlbiBjb3VudCAocm91Z2ggYXBwcm94aW1hdGlvbjogMSB0b2tlbiBcdTIyNDggNCBjaGFyYWN0ZXJzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXN0aW1hdGVUb2tlbkNvdW50KHRleHQ6IHN0cmluZyk6IG51bWJlciB7XG4gIHJldHVybiBNYXRoLmNlaWwodGV4dC5sZW5ndGggLyA0KTtcbn1cblxuIiwgImltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBDYWxjdWxhdGUgU0hBLTI1NiBoYXNoIG9mIGEgZmlsZSBmb3IgY2hhbmdlIGRldGVjdGlvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgIGNvbnN0IHN0cmVhbSA9IGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpO1xuICAgIFxuICAgIHN0cmVhbS5vbihcImRhdGFcIiwgKGRhdGEpID0+IGhhc2gudXBkYXRlKGRhdGEpKTtcbiAgICBzdHJlYW0ub24oXCJlbmRcIiwgKCkgPT4gcmVzb2x2ZShoYXNoLmRpZ2VzdChcImhleFwiKSkpO1xuICAgIHN0cmVhbS5vbihcImVycm9yXCIsIHJlamVjdCk7XG4gIH0pO1xufVxuXG4vKipcbiAqIEdldCBmaWxlIG1ldGFkYXRhIGluY2x1ZGluZyBzaXplIGFuZCBtb2RpZmljYXRpb24gdGltZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RmlsZU1ldGFkYXRhKGZpbGVQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHtcbiAgc2l6ZTogbnVtYmVyO1xuICBtdGltZTogRGF0ZTtcbiAgaGFzaDogc3RyaW5nO1xufT4ge1xuICBjb25zdCBzdGF0cyA9IGF3YWl0IGZzLnByb21pc2VzLnN0YXQoZmlsZVBhdGgpO1xuICBjb25zdCBoYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGgpO1xuICBcbiAgcmV0dXJuIHtcbiAgICBzaXplOiBzdGF0cy5zaXplLFxuICAgIG10aW1lOiBzdGF0cy5tdGltZSxcbiAgICBoYXNoLFxuICB9O1xufVxuXG4iLCAiaW1wb3J0IFBRdWV1ZSBmcm9tIFwicC1xdWV1ZVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBzY2FuRGlyZWN0b3J5LCB0eXBlIFNjYW5uZWRGaWxlIH0gZnJvbSBcIi4vZmlsZVNjYW5uZXJcIjtcbmltcG9ydCB7IHBhcnNlRG9jdW1lbnQsIHR5cGUgUGFyc2VGYWlsdXJlUmVhc29uIH0gZnJvbSBcIi4uL3BhcnNlcnMvZG9jdW1lbnRQYXJzZXJcIjtcbmltcG9ydCB7IFZlY3RvclN0b3JlLCB0eXBlIERvY3VtZW50Q2h1bmsgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcbmltcG9ydCB7IGNodW5rVGV4dCB9IGZyb20gXCIuLi91dGlscy90ZXh0Q2h1bmtlclwiO1xuaW1wb3J0IHsgY2FsY3VsYXRlRmlsZUhhc2ggfSBmcm9tIFwiLi4vdXRpbHMvZmlsZUhhc2hcIjtcbmltcG9ydCB7IHR5cGUgRW1iZWRkaW5nRHluYW1pY0hhbmRsZSwgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdQcm9ncmVzcyB7XG4gIHRvdGFsRmlsZXM6IG51bWJlcjtcbiAgcHJvY2Vzc2VkRmlsZXM6IG51bWJlcjtcbiAgY3VycmVudEZpbGU6IHN0cmluZztcbiAgc3RhdHVzOiBcInNjYW5uaW5nXCIgfCBcImluZGV4aW5nXCIgfCBcImNvbXBsZXRlXCIgfCBcImVycm9yXCI7XG4gIHN1Y2Nlc3NmdWxGaWxlcz86IG51bWJlcjtcbiAgZmFpbGVkRmlsZXM/OiBudW1iZXI7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEluZGV4aW5nUmVzdWx0IHtcbiAgdG90YWxGaWxlczogbnVtYmVyO1xuICBzdWNjZXNzZnVsRmlsZXM6IG51bWJlcjtcbiAgZmFpbGVkRmlsZXM6IG51bWJlcjtcbiAgc2tpcHBlZEZpbGVzOiBudW1iZXI7XG4gIHVwZGF0ZWRGaWxlczogbnVtYmVyO1xuICBuZXdGaWxlczogbnVtYmVyO1xufVxuXG50eXBlIEZpbGVJbmRleE91dGNvbWUgPVxuICB8IHsgdHlwZTogXCJza2lwcGVkXCIgfVxuICB8IHsgdHlwZTogXCJpbmRleGVkXCI7IGNoYW5nZVR5cGU6IFwibmV3XCIgfCBcInVwZGF0ZWRcIiB9XG4gIHwgeyB0eXBlOiBcImZhaWxlZFwiIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW5kZXhpbmdPcHRpb25zIHtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlOiBWZWN0b3JTdG9yZTtcbiAgZW1iZWRkaW5nTW9kZWw6IEVtYmVkZGluZ0R5bmFtaWNIYW5kbGU7XG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQ7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIGF1dG9SZWluZGV4OiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgZmFpbHVyZVJlcG9ydFBhdGg/OiBzdHJpbmc7XG4gIG9uUHJvZ3Jlc3M/OiAocHJvZ3Jlc3M6IEluZGV4aW5nUHJvZ3Jlc3MpID0+IHZvaWQ7XG59XG5cbnR5cGUgRmFpbHVyZVJlYXNvbiA9IFBhcnNlRmFpbHVyZVJlYXNvbiB8IFwiaW5kZXguY2h1bmstZW1wdHlcIiB8IFwiaW5kZXgudmVjdG9yLWFkZC1lcnJvclwiO1xuXG5mdW5jdGlvbiBjb2VyY2VFbWJlZGRpbmdWZWN0b3IocmF3OiB1bmtub3duKTogbnVtYmVyW10ge1xuICBpZiAoQXJyYXkuaXNBcnJheShyYXcpKSB7XG4gICAgcmV0dXJuIHJhdy5tYXAoYXNzZXJ0RmluaXRlTnVtYmVyKTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgcmF3ID09PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIFthc3NlcnRGaW5pdGVOdW1iZXIocmF3KV07XG4gIH1cblxuICBpZiAocmF3ICYmIHR5cGVvZiByYXcgPT09IFwib2JqZWN0XCIpIHtcbiAgICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHJhdykpIHtcbiAgICAgIHJldHVybiBBcnJheS5mcm9tKHJhdyBhcyB1bmtub3duIGFzIEFycmF5TGlrZTxudW1iZXI+KS5tYXAoYXNzZXJ0RmluaXRlTnVtYmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBjYW5kaWRhdGUgPVxuICAgICAgKHJhdyBhcyBhbnkpLmVtYmVkZGluZyA/P1xuICAgICAgKHJhdyBhcyBhbnkpLnZlY3RvciA/P1xuICAgICAgKHJhdyBhcyBhbnkpLmRhdGEgPz9cbiAgICAgICh0eXBlb2YgKHJhdyBhcyBhbnkpLnRvQXJyYXkgPT09IFwiZnVuY3Rpb25cIiA/IChyYXcgYXMgYW55KS50b0FycmF5KCkgOiB1bmRlZmluZWQpID8/XG4gICAgICAodHlwZW9mIChyYXcgYXMgYW55KS50b0pTT04gPT09IFwiZnVuY3Rpb25cIiA/IChyYXcgYXMgYW55KS50b0pTT04oKSA6IHVuZGVmaW5lZCk7XG5cbiAgICBpZiAoY2FuZGlkYXRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBjb2VyY2VFbWJlZGRpbmdWZWN0b3IoY2FuZGlkYXRlKTtcbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoXCJFbWJlZGRpbmcgcHJvdmlkZXIgcmV0dXJuZWQgYSBub24tbnVtZXJpYyB2ZWN0b3JcIik7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEZpbml0ZU51bWJlcih2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gIGNvbnN0IG51bSA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiA/IHZhbHVlIDogTnVtYmVyKHZhbHVlKTtcbiAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobnVtKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVtYmVkZGluZyB2ZWN0b3IgY29udGFpbnMgYSBub24tZmluaXRlIHZhbHVlXCIpO1xuICB9XG4gIHJldHVybiBudW07XG59XG5cbmV4cG9ydCBjbGFzcyBJbmRleE1hbmFnZXIge1xuICBwcml2YXRlIHF1ZXVlOiBQUXVldWU7XG4gIHByaXZhdGUgb3B0aW9uczogSW5kZXhpbmdPcHRpb25zO1xuICBwcml2YXRlIGZhaWx1cmVSZWFzb25Db3VudHM6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zOiBJbmRleGluZ09wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMucXVldWUgPSBuZXcgUFF1ZXVlKHsgY29uY3VycmVuY3k6IG9wdGlvbnMubWF4Q29uY3VycmVudCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCB0aGUgaW5kZXhpbmcgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgaW5kZXgoKTogUHJvbWlzZTxJbmRleGluZ1Jlc3VsdD4ge1xuICAgIGNvbnN0IHsgZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZSwgb25Qcm9ncmVzcyB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVJbnZlbnRvcnkgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRGaWxlSGFzaEludmVudG9yeSgpO1xuXG4gICAgICAvLyBTdGVwIDE6IFNjYW4gZGlyZWN0b3J5XG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJzY2FubmluZ1wiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZmlsZXMgPSBhd2FpdCBzY2FuRGlyZWN0b3J5KGRvY3VtZW50c0RpciwgKHNjYW5uZWQsIGZvdW5kKSA9PiB7XG4gICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgICB0b3RhbEZpbGVzOiBmb3VuZCxcbiAgICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgICAgY3VycmVudEZpbGU6IGBTY2FubmVkICR7c2Nhbm5lZH0gZmlsZXMuLi5gLFxuICAgICAgICAgICAgc3RhdHVzOiBcInNjYW5uaW5nXCIsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhgRm91bmQgJHtmaWxlcy5sZW5ndGh9IGZpbGVzIHRvIHByb2Nlc3NgKTtcblxuICAgICAgLy8gU3RlcCAyOiBJbmRleCBmaWxlc1xuICAgICAgbGV0IHByb2Nlc3NlZENvdW50ID0gMDtcbiAgICAgIGxldCBzdWNjZXNzQ291bnQgPSAwO1xuICAgICAgbGV0IGZhaWxDb3VudCA9IDA7XG4gICAgICBsZXQgc2tpcHBlZENvdW50ID0gMDtcbiAgICAgIGxldCB1cGRhdGVkQ291bnQgPSAwO1xuICAgICAgbGV0IG5ld0NvdW50ID0gMDtcblxuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gUHJvY2VzcyBmaWxlcyBpbiBiYXRjaGVzXG4gICAgICBjb25zdCB0YXNrcyA9IGZpbGVzLm1hcCgoZmlsZSkgPT5cbiAgICAgICAgdGhpcy5xdWV1ZS5hZGQoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGxldCBvdXRjb21lOiBGaWxlSW5kZXhPdXRjb21lID0geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG91dGNvbWUgPSBhd2FpdCB0aGlzLmluZGV4RmlsZShmaWxlLCBmaWxlSW52ZW50b3J5KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgaW5kZXhpbmcgZmlsZSAke2ZpbGUucGF0aH06YCwgZXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRGYWlsdXJlKFxuICAgICAgICAgICAgICBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgZmlsZSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcHJvY2Vzc2VkQ291bnQrKztcbiAgICAgICAgICBzd2l0Y2ggKG91dGNvbWUudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcInNraXBwZWRcIjpcbiAgICAgICAgICAgICAgc3VjY2Vzc0NvdW50Kys7XG4gICAgICAgICAgICAgIHNraXBwZWRDb3VudCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJpbmRleGVkXCI6XG4gICAgICAgICAgICAgIHN1Y2Nlc3NDb3VudCsrO1xuICAgICAgICAgICAgICBpZiAob3V0Y29tZS5jaGFuZ2VUeXBlID09PSBcIm5ld1wiKSB7XG4gICAgICAgICAgICAgICAgbmV3Q291bnQrKztcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVkQ291bnQrKztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJmYWlsZWRcIjpcbiAgICAgICAgICAgICAgZmFpbENvdW50Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChvblByb2dyZXNzKSB7XG4gICAgICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgICAgICBwcm9jZXNzZWRGaWxlczogcHJvY2Vzc2VkQ291bnQsXG4gICAgICAgICAgICAgIGN1cnJlbnRGaWxlOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICAgIHN0YXR1czogXCJpbmRleGluZ1wiLFxuICAgICAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKTtcblxuICAgICAgaWYgKG9uUHJvZ3Jlc3MpIHtcbiAgICAgICAgb25Qcm9ncmVzcyh7XG4gICAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiBwcm9jZXNzZWRDb3VudCxcbiAgICAgICAgICBjdXJyZW50RmlsZTogXCJcIixcbiAgICAgICAgICBzdGF0dXM6IFwiY29tcGxldGVcIixcbiAgICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sb2dGYWlsdXJlU3VtbWFyeSgpO1xuICAgICAgYXdhaXQgdGhpcy53cml0ZUZhaWx1cmVSZXBvcnQoe1xuICAgICAgICB0b3RhbEZpbGVzOiBmaWxlcy5sZW5ndGgsXG4gICAgICAgIHN1Y2Nlc3NmdWxGaWxlczogc3VjY2Vzc0NvdW50LFxuICAgICAgICBmYWlsZWRGaWxlczogZmFpbENvdW50LFxuICAgICAgICBza2lwcGVkRmlsZXM6IHNraXBwZWRDb3VudCxcbiAgICAgICAgdXBkYXRlZEZpbGVzOiB1cGRhdGVkQ291bnQsXG4gICAgICAgIG5ld0ZpbGVzOiBuZXdDb3VudCxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYEluZGV4aW5nIGNvbXBsZXRlOiAke3N1Y2Nlc3NDb3VudH0vJHtmaWxlcy5sZW5ndGh9IGZpbGVzIHN1Y2Nlc3NmdWxseSBpbmRleGVkICgke2ZhaWxDb3VudH0gZmFpbGVkLCBza2lwcGVkPSR7c2tpcHBlZENvdW50fSwgdXBkYXRlZD0ke3VwZGF0ZWRDb3VudH0sIG5ldz0ke25ld0NvdW50fSlgLFxuICAgICAgKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdG90YWxGaWxlczogZmlsZXMubGVuZ3RoLFxuICAgICAgICBzdWNjZXNzZnVsRmlsZXM6IHN1Y2Nlc3NDb3VudCxcbiAgICAgICAgZmFpbGVkRmlsZXM6IGZhaWxDb3VudCxcbiAgICAgICAgc2tpcHBlZEZpbGVzOiBza2lwcGVkQ291bnQsXG4gICAgICAgIHVwZGF0ZWRGaWxlczogdXBkYXRlZENvdW50LFxuICAgICAgICBuZXdGaWxlczogbmV3Q291bnQsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZHVyaW5nIGluZGV4aW5nOlwiLCBlcnJvcik7XG4gICAgICBpZiAob25Qcm9ncmVzcykge1xuICAgICAgICBvblByb2dyZXNzKHtcbiAgICAgICAgICB0b3RhbEZpbGVzOiAwLFxuICAgICAgICAgIHByb2Nlc3NlZEZpbGVzOiAwLFxuICAgICAgICAgIGN1cnJlbnRGaWxlOiBcIlwiLFxuICAgICAgICAgIHN0YXR1czogXCJlcnJvclwiLFxuICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEluZGV4IGEgc2luZ2xlIGZpbGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgaW5kZXhGaWxlKFxuICAgIGZpbGU6IFNjYW5uZWRGaWxlLFxuICAgIGZpbGVJbnZlbnRvcnk6IE1hcDxzdHJpbmcsIFNldDxzdHJpbmc+PiA9IG5ldyBNYXAoKSxcbiAgKTogUHJvbWlzZTxGaWxlSW5kZXhPdXRjb21lPiB7XG4gICAgY29uc3QgeyB2ZWN0b3JTdG9yZSwgZW1iZWRkaW5nTW9kZWwsIGNsaWVudCwgY2h1bmtTaXplLCBjaHVua092ZXJsYXAsIGVuYWJsZU9DUiwgYXV0b1JlaW5kZXggfSA9XG4gICAgICB0aGlzLm9wdGlvbnM7XG5cbiAgICB0cnkge1xuICAgICAgLy8gQ2FsY3VsYXRlIGZpbGUgaGFzaFxuICAgICAgY29uc3QgZmlsZUhhc2ggPSBhd2FpdCBjYWxjdWxhdGVGaWxlSGFzaChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgZXhpc3RpbmdIYXNoZXMgPSBmaWxlSW52ZW50b3J5LmdldChmaWxlLnBhdGgpO1xuICAgICAgY29uc3QgaGFzU2VlbkJlZm9yZSA9IGV4aXN0aW5nSGFzaGVzICE9PSB1bmRlZmluZWQgJiYgZXhpc3RpbmdIYXNoZXMuc2l6ZSA+IDA7XG4gICAgICBjb25zdCBoYXNTYW1lSGFzaCA9IGV4aXN0aW5nSGFzaGVzPy5oYXMoZmlsZUhhc2gpID8/IGZhbHNlO1xuXG4gICAgICAvLyBDaGVjayBpZiBmaWxlIGFscmVhZHkgaW5kZXhlZFxuICAgICAgaWYgKGF1dG9SZWluZGV4ICYmIGhhc1NhbWVIYXNoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBGaWxlIGFscmVhZHkgaW5kZXhlZCAoc2tpcHBlZCk6ICR7ZmlsZS5uYW1lfWApO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcInNraXBwZWRcIiB9O1xuICAgICAgfVxuXG4gICAgICAvLyBXYWl0IGJlZm9yZSBwYXJzaW5nIHRvIHJlZHVjZSBXZWJTb2NrZXQgbG9hZFxuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wYXJzZURlbGF5TXMgPiAwKSB7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCB0aGlzLm9wdGlvbnMucGFyc2VEZWxheU1zKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFBhcnNlIGRvY3VtZW50XG4gICAgICBjb25zdCBwYXJzZWRSZXN1bHQgPSBhd2FpdCBwYXJzZURvY3VtZW50KGZpbGUucGF0aCwgZW5hYmxlT0NSLCBjbGllbnQpO1xuICAgICAgaWYgKCFwYXJzZWRSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUocGFyc2VkUmVzdWx0LnJlYXNvbiwgcGFyc2VkUmVzdWx0LmRldGFpbHMsIGZpbGUpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG4gICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZWRSZXN1bHQuZG9jdW1lbnQ7XG5cbiAgICAgIC8vIENodW5rIHRleHRcbiAgICAgIGNvbnN0IGNodW5rcyA9IGNodW5rVGV4dChwYXJzZWQudGV4dCwgY2h1bmtTaXplLCBjaHVua092ZXJsYXApO1xuICAgICAgaWYgKGNodW5rcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coYE5vIGNodW5rcyBjcmVhdGVkIGZyb20gJHtmaWxlLm5hbWV9YCk7XG4gICAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShcImluZGV4LmNodW5rLWVtcHR5XCIsIFwiY2h1bmtUZXh0IHByb2R1Y2VkIDAgY2h1bmtzXCIsIGZpbGUpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07IC8vIEZhaWxlZCB0byBjaHVua1xuICAgICAgfVxuXG4gICAgICAvLyBHZW5lcmF0ZSBlbWJlZGRpbmdzIGFuZCBjcmVhdGUgZG9jdW1lbnQgY2h1bmtzXG4gICAgICBjb25zdCBkb2N1bWVudENodW5rczogRG9jdW1lbnRDaHVua1tdID0gW107XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2h1bmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNodW5rID0gY2h1bmtzW2ldO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBHZW5lcmF0ZSBlbWJlZGRpbmdcbiAgICAgICAgICBjb25zdCBlbWJlZGRpbmdSZXN1bHQgPSBhd2FpdCBlbWJlZGRpbmdNb2RlbC5lbWJlZChjaHVuay50ZXh0KTtcbiAgICAgICAgICBjb25zdCBlbWJlZGRpbmcgPSBjb2VyY2VFbWJlZGRpbmdWZWN0b3IoZW1iZWRkaW5nUmVzdWx0LmVtYmVkZGluZyk7XG4gICAgICAgICAgXG4gICAgICAgICAgZG9jdW1lbnRDaHVua3MucHVzaCh7XG4gICAgICAgICAgICBpZDogYCR7ZmlsZUhhc2h9LSR7aX1gLFxuICAgICAgICAgICAgdGV4dDogY2h1bmsudGV4dCxcbiAgICAgICAgICAgIHZlY3RvcjogZW1iZWRkaW5nLFxuICAgICAgICAgICAgZmlsZVBhdGg6IGZpbGUucGF0aCxcbiAgICAgICAgICAgIGZpbGVOYW1lOiBmaWxlLm5hbWUsXG4gICAgICAgICAgICBmaWxlSGFzaCxcbiAgICAgICAgICAgIGNodW5rSW5kZXg6IGksXG4gICAgICAgICAgICBtZXRhZGF0YToge1xuICAgICAgICAgICAgICBleHRlbnNpb246IGZpbGUuZXh0ZW5zaW9uLFxuICAgICAgICAgICAgICBzaXplOiBmaWxlLnNpemUsXG4gICAgICAgICAgICAgIG10aW1lOiBmaWxlLm10aW1lLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgICAgIHN0YXJ0SW5kZXg6IGNodW5rLnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgIGVuZEluZGV4OiBjaHVuay5lbmRJbmRleCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgRXJyb3IgZW1iZWRkaW5nIGNodW5rICR7aX0gb2YgJHtmaWxlLm5hbWV9OmAsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgY2h1bmtzIHRvIHZlY3RvciBzdG9yZVxuICAgICAgaWYgKGRvY3VtZW50Q2h1bmtzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgXCJpbmRleC5jaHVuay1lbXB0eVwiLFxuICAgICAgICAgIFwiQWxsIGNodW5rIGVtYmVkZGluZ3MgZmFpbGVkLCBubyBkb2N1bWVudCBjaHVua3NcIixcbiAgICAgICAgICBmaWxlLFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHZlY3RvclN0b3JlLmFkZENodW5rcyhkb2N1bWVudENodW5rcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBJbmRleGVkICR7ZG9jdW1lbnRDaHVua3MubGVuZ3RofSBjaHVua3MgZnJvbSAke2ZpbGUubmFtZX1gKTtcbiAgICAgICAgaWYgKCFleGlzdGluZ0hhc2hlcykge1xuICAgICAgICAgIGZpbGVJbnZlbnRvcnkuc2V0KGZpbGUucGF0aCwgbmV3IFNldChbZmlsZUhhc2hdKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZXhpc3RpbmdIYXNoZXMuYWRkKGZpbGVIYXNoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiaW5kZXhlZFwiLFxuICAgICAgICAgIGNoYW5nZVR5cGU6IGhhc1NlZW5CZWZvcmUgPyBcInVwZGF0ZWRcIiA6IFwibmV3XCIsXG4gICAgICAgIH07XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBhZGRpbmcgY2h1bmtzIGZvciAke2ZpbGUubmFtZX06YCwgZXJyb3IpO1xuICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgXCJpbmRleC52ZWN0b3ItYWRkLWVycm9yXCIsXG4gICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgIGZpbGUsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFpbGVkXCIgfTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGluZGV4aW5nIGZpbGUgJHtmaWxlLnBhdGh9OmAsIGVycm9yKTtcbiAgICAgICAgICB0aGlzLnJlY29yZEZhaWx1cmUoXG4gICAgICAgICAgICBcInBhcnNlci51bmV4cGVjdGVkLWVycm9yXCIsXG4gICAgICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICBmaWxlLFxuICAgICAgICAgICk7XG4gICAgICByZXR1cm4geyB0eXBlOiBcImZhaWxlZFwiIH07IC8vIEZhaWxlZFxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWluZGV4IGEgc3BlY2lmaWMgZmlsZSAoZGVsZXRlIG9sZCBjaHVua3MgYW5kIHJlaW5kZXgpXG4gICAqL1xuICBhc3luYyByZWluZGV4RmlsZShmaWxlUGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgeyB2ZWN0b3JTdG9yZSB9ID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVIYXNoID0gYXdhaXQgY2FsY3VsYXRlRmlsZUhhc2goZmlsZVBhdGgpO1xuICAgICAgXG4gICAgICAvLyBEZWxldGUgb2xkIGNodW5rc1xuICAgICAgYXdhaXQgdmVjdG9yU3RvcmUuZGVsZXRlQnlGaWxlSGFzaChmaWxlSGFzaCk7XG4gICAgICBcbiAgICAgIC8vIFJlaW5kZXhcbiAgICAgIGNvbnN0IGZpbGU6IFNjYW5uZWRGaWxlID0ge1xuICAgICAgICBwYXRoOiBmaWxlUGF0aCxcbiAgICAgICAgbmFtZTogZmlsZVBhdGguc3BsaXQoXCIvXCIpLnBvcCgpIHx8IGZpbGVQYXRoLFxuICAgICAgICBleHRlbnNpb246IGZpbGVQYXRoLnNwbGl0KFwiLlwiKS5wb3AoKSB8fCBcIlwiLFxuICAgICAgICBtaW1lVHlwZTogZmFsc2UsXG4gICAgICAgIHNpemU6IDAsXG4gICAgICAgIG10aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgfTtcbiAgICAgIFxuICAgICAgYXdhaXQgdGhpcy5pbmRleEZpbGUoZmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIHJlaW5kZXhpbmcgZmlsZSAke2ZpbGVQYXRofTpgLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlY29yZEZhaWx1cmUocmVhc29uOiBGYWlsdXJlUmVhc29uLCBkZXRhaWxzOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZpbGU6IFNjYW5uZWRGaWxlKSB7XG4gICAgY29uc3QgY3VycmVudCA9IHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50c1tyZWFzb25dID8/IDA7XG4gICAgdGhpcy5mYWlsdXJlUmVhc29uQ291bnRzW3JlYXNvbl0gPSBjdXJyZW50ICsgMTtcbiAgICBjb25zdCBkZXRhaWxTdWZmaXggPSBkZXRhaWxzID8gYCBkZXRhaWxzPSR7ZGV0YWlsc31gIDogXCJcIjtcbiAgICBjb25zb2xlLndhcm4oXG4gICAgICBgW0JpZ1JBR10gRmFpbGVkIHRvIHBhcnNlICR7ZmlsZS5uYW1lfSAocmVhc29uPSR7cmVhc29ufSwgY291bnQ9JHt0aGlzLmZhaWx1cmVSZWFzb25Db3VudHNbcmVhc29uXX0pJHtkZXRhaWxTdWZmaXh9YCxcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2dGYWlsdXJlU3VtbWFyeSgpIHtcbiAgICBjb25zdCBlbnRyaWVzID0gT2JqZWN0LmVudHJpZXModGhpcy5mYWlsdXJlUmVhc29uQ291bnRzKTtcbiAgICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gTm8gcGFyc2luZyBmYWlsdXJlcyByZWNvcmRlZC5cIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gRmFpbHVyZSByZWFzb24gc3VtbWFyeTpcIik7XG4gICAgZm9yIChjb25zdCBbcmVhc29uLCBjb3VudF0gb2YgZW50cmllcykge1xuICAgICAgY29uc29sZS5sb2coYCAgLSAke3JlYXNvbn06ICR7Y291bnR9YCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB3cml0ZUZhaWx1cmVSZXBvcnQoc3VtbWFyeTogSW5kZXhpbmdSZXN1bHQpIHtcbiAgICBjb25zdCByZXBvcnRQYXRoID0gdGhpcy5vcHRpb25zLmZhaWx1cmVSZXBvcnRQYXRoO1xuICAgIGlmICghcmVwb3J0UGF0aCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICAuLi5zdW1tYXJ5LFxuICAgICAgZG9jdW1lbnRzRGlyOiB0aGlzLm9wdGlvbnMuZG9jdW1lbnRzRGlyLFxuICAgICAgZmFpbHVyZVJlYXNvbnM6IHRoaXMuZmFpbHVyZVJlYXNvbkNvdW50cyxcbiAgICAgIGdlbmVyYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5wcm9taXNlcy5ta2RpcihwYXRoLmRpcm5hbWUocmVwb3J0UGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgICAgYXdhaXQgZnMucHJvbWlzZXMud3JpdGVGaWxlKHJlcG9ydFBhdGgsIEpTT04uc3RyaW5naWZ5KHBheWxvYWQsIG51bGwsIDIpLCBcInV0Zi04XCIpO1xuICAgICAgY29uc29sZS5sb2coYFtCaWdSQUddIFdyb3RlIGZhaWx1cmUgcmVwb3J0IHRvICR7cmVwb3J0UGF0aH1gKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihgW0JpZ1JBR10gRmFpbGVkIHRvIHdyaXRlIGZhaWx1cmUgcmVwb3J0IHRvICR7cmVwb3J0UGF0aH06YCwgZXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4iLCAiaW1wb3J0IHsgdHlwZSBMTVN0dWRpb0NsaWVudCB9IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBJbmRleE1hbmFnZXIsIHR5cGUgSW5kZXhpbmdQcm9ncmVzcywgdHlwZSBJbmRleGluZ1Jlc3VsdCB9IGZyb20gXCIuL2luZGV4TWFuYWdlclwiO1xuaW1wb3J0IHsgVmVjdG9yU3RvcmUgfSBmcm9tIFwiLi4vdmVjdG9yc3RvcmUvdmVjdG9yU3RvcmVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSdW5JbmRleGluZ1BhcmFtcyB7XG4gIGNsaWVudDogTE1TdHVkaW9DbGllbnQ7XG4gIGFib3J0U2lnbmFsOiBBYm9ydFNpZ25hbDtcbiAgZG9jdW1lbnRzRGlyOiBzdHJpbmc7XG4gIHZlY3RvclN0b3JlRGlyOiBzdHJpbmc7XG4gIGNodW5rU2l6ZTogbnVtYmVyO1xuICBjaHVua092ZXJsYXA6IG51bWJlcjtcbiAgbWF4Q29uY3VycmVudDogbnVtYmVyO1xuICBlbmFibGVPQ1I6IGJvb2xlYW47XG4gIGF1dG9SZWluZGV4OiBib29sZWFuO1xuICBwYXJzZURlbGF5TXM6IG51bWJlcjtcbiAgZm9yY2VSZWluZGV4PzogYm9vbGVhbjtcbiAgdmVjdG9yU3RvcmU/OiBWZWN0b3JTdG9yZTtcbiAgb25Qcm9ncmVzcz86IChwcm9ncmVzczogSW5kZXhpbmdQcm9ncmVzcykgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSdW5JbmRleGluZ1Jlc3VsdCB7XG4gIHN1bW1hcnk6IHN0cmluZztcbiAgc3RhdHM6IHtcbiAgICB0b3RhbENodW5rczogbnVtYmVyO1xuICAgIHVuaXF1ZUZpbGVzOiBudW1iZXI7XG4gIH07XG4gIGluZGV4aW5nUmVzdWx0OiBJbmRleGluZ1Jlc3VsdDtcbn1cblxuLyoqXG4gKiBTaGFyZWQgaGVscGVyIHRoYXQgcnVucyB0aGUgZnVsbCBpbmRleGluZyBwaXBlbGluZS5cbiAqIEFsbG93cyByZXVzZSBhY3Jvc3MgdGhlIG1hbnVhbCB0b29sLCBjb25maWctdHJpZ2dlcmVkIGluZGV4aW5nLCBhbmQgYXV0b21hdGljIGJvb3RzdHJhcHBpbmcuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5JbmRleGluZ0pvYih7XG4gIGNsaWVudCxcbiAgYWJvcnRTaWduYWwsXG4gIGRvY3VtZW50c0RpcixcbiAgdmVjdG9yU3RvcmVEaXIsXG4gIGNodW5rU2l6ZSxcbiAgY2h1bmtPdmVybGFwLFxuICBtYXhDb25jdXJyZW50LFxuICBlbmFibGVPQ1IsXG4gIGF1dG9SZWluZGV4LFxuICBwYXJzZURlbGF5TXMsXG4gIGZvcmNlUmVpbmRleCA9IGZhbHNlLFxuICB2ZWN0b3JTdG9yZTogZXhpc3RpbmdWZWN0b3JTdG9yZSxcbiAgb25Qcm9ncmVzcyxcbn06IFJ1bkluZGV4aW5nUGFyYW1zKTogUHJvbWlzZTxSdW5JbmRleGluZ1Jlc3VsdD4ge1xuICBjb25zdCB2ZWN0b3JTdG9yZSA9IGV4aXN0aW5nVmVjdG9yU3RvcmUgPz8gbmV3IFZlY3RvclN0b3JlKHZlY3RvclN0b3JlRGlyKTtcbiAgY29uc3Qgb3duc1ZlY3RvclN0b3JlID0gZXhpc3RpbmdWZWN0b3JTdG9yZSA9PT0gdW5kZWZpbmVkO1xuXG4gIGlmIChvd25zVmVjdG9yU3RvcmUpIHtcbiAgICBhd2FpdCB2ZWN0b3JTdG9yZS5pbml0aWFsaXplKCk7XG4gIH1cblxuICBjb25zdCBlbWJlZGRpbmdNb2RlbCA9IGF3YWl0IGNsaWVudC5lbWJlZGRpbmcubW9kZWwoXG4gICAgXCJub21pYy1haS9ub21pYy1lbWJlZC10ZXh0LXYxLjUtR0dVRlwiLFxuICAgIHsgc2lnbmFsOiBhYm9ydFNpZ25hbCB9LFxuICApO1xuXG4gIGNvbnN0IGluZGV4TWFuYWdlciA9IG5ldyBJbmRleE1hbmFnZXIoe1xuICAgIGRvY3VtZW50c0RpcixcbiAgICB2ZWN0b3JTdG9yZSxcbiAgICBlbWJlZGRpbmdNb2RlbCxcbiAgICBjbGllbnQsXG4gICAgY2h1bmtTaXplLFxuICAgIGNodW5rT3ZlcmxhcCxcbiAgICBtYXhDb25jdXJyZW50LFxuICAgIGVuYWJsZU9DUixcbiAgICBhdXRvUmVpbmRleDogZm9yY2VSZWluZGV4ID8gZmFsc2UgOiBhdXRvUmVpbmRleCxcbiAgICBwYXJzZURlbGF5TXMsXG4gICAgb25Qcm9ncmVzcyxcbiAgfSk7XG5cbiAgY29uc3QgaW5kZXhpbmdSZXN1bHQgPSBhd2FpdCBpbmRleE1hbmFnZXIuaW5kZXgoKTtcbiAgY29uc3Qgc3RhdHMgPSBhd2FpdCB2ZWN0b3JTdG9yZS5nZXRTdGF0cygpO1xuXG4gIGlmIChvd25zVmVjdG9yU3RvcmUpIHtcbiAgICBhd2FpdCB2ZWN0b3JTdG9yZS5jbG9zZSgpO1xuICB9XG5cbiAgY29uc3Qgc3VtbWFyeSA9IGBJbmRleGluZyBjb21wbGV0ZWQhXFxuXFxuYCArXG4gICAgYFx1MjAyMiBTdWNjZXNzZnVsbHkgaW5kZXhlZDogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIEZhaWxlZDogJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc31cXG5gICtcbiAgICBgXHUyMDIyIFNraXBwZWQgKHVuY2hhbmdlZCk6ICR7aW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzfVxcbmAgK1xuICAgIGBcdTIwMjIgVXBkYXRlZCBleGlzdGluZyBmaWxlczogJHtpbmRleGluZ1Jlc3VsdC51cGRhdGVkRmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBOZXcgZmlsZXMgYWRkZWQ6ICR7aW5kZXhpbmdSZXN1bHQubmV3RmlsZXN9XFxuYCArXG4gICAgYFx1MjAyMiBDaHVua3MgaW4gc3RvcmU6ICR7c3RhdHMudG90YWxDaHVua3N9XFxuYCArXG4gICAgYFx1MjAyMiBVbmlxdWUgZmlsZXMgaW4gc3RvcmU6ICR7c3RhdHMudW5pcXVlRmlsZXN9YDtcblxuICByZXR1cm4ge1xuICAgIHN1bW1hcnksXG4gICAgc3RhdHMsXG4gICAgaW5kZXhpbmdSZXN1bHQsXG4gIH07XG59XG5cbiIsICJpbXBvcnQge1xuICB0eXBlIENoYXRNZXNzYWdlLFxuICB0eXBlIFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG59IGZyb20gXCJAbG1zdHVkaW8vc2RrXCI7XG5pbXBvcnQgeyBjb25maWdTY2hlbWF0aWNzIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBWZWN0b3JTdG9yZSB9IGZyb20gXCIuL3ZlY3RvcnN0b3JlL3ZlY3RvclN0b3JlXCI7XG5pbXBvcnQgeyBwZXJmb3JtU2FuaXR5Q2hlY2tzIH0gZnJvbSBcIi4vdXRpbHMvc2FuaXR5Q2hlY2tzXCI7XG5pbXBvcnQgeyB0cnlTdGFydEluZGV4aW5nLCBmaW5pc2hJbmRleGluZyB9IGZyb20gXCIuL3V0aWxzL2luZGV4aW5nTG9ja1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcnVuSW5kZXhpbmdKb2IgfSBmcm9tIFwiLi9pbmdlc3Rpb24vcnVuSW5kZXhpbmdcIjtcblxuZnVuY3Rpb24gc3VtbWFyaXplVGV4dCh0ZXh0OiBzdHJpbmcsIG1heExpbmVzOiBudW1iZXIgPSAzLCBtYXhDaGFyczogbnVtYmVyID0gNDAwKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSB0ZXh0LnNwbGl0KC9cXHI/XFxuLykuZmlsdGVyKGxpbmUgPT4gbGluZS50cmltKCkgIT09IFwiXCIpO1xuICBjb25zdCBjbGlwcGVkTGluZXMgPSBsaW5lcy5zbGljZSgwLCBtYXhMaW5lcyk7XG4gIGxldCBjbGlwcGVkID0gY2xpcHBlZExpbmVzLmpvaW4oXCJcXG5cIik7XG4gIGlmIChjbGlwcGVkLmxlbmd0aCA+IG1heENoYXJzKSB7XG4gICAgY2xpcHBlZCA9IGNsaXBwZWQuc2xpY2UoMCwgbWF4Q2hhcnMpO1xuICB9XG4gIGNvbnN0IG5lZWRzRWxsaXBzaXMgPVxuICAgIGxpbmVzLmxlbmd0aCA+IG1heExpbmVzIHx8XG4gICAgdGV4dC5sZW5ndGggPiBjbGlwcGVkLmxlbmd0aCB8fFxuICAgIGNsaXBwZWQubGVuZ3RoID09PSBtYXhDaGFycyAmJiB0ZXh0Lmxlbmd0aCA+IG1heENoYXJzO1xuICByZXR1cm4gbmVlZHNFbGxpcHNpcyA/IGAke2NsaXBwZWQudHJpbUVuZCgpfVx1MjAyNmAgOiBjbGlwcGVkO1xufVxuXG4vLyBHbG9iYWwgc3RhdGUgZm9yIHZlY3RvciBzdG9yZSAocGVyc2lzdHMgYWNyb3NzIHJlcXVlc3RzKVxubGV0IHZlY3RvclN0b3JlOiBWZWN0b3JTdG9yZSB8IG51bGwgPSBudWxsO1xubGV0IGxhc3RJbmRleGVkRGlyID0gXCJcIjtcbmxldCBzYW5pdHlDaGVja3NQYXNzZWQgPSBmYWxzZTtcbi8qKlxuICogTWFpbiBwcm9tcHQgcHJlcHJvY2Vzc29yIGZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwcmVwcm9jZXNzKFxuICBjdGw6IFByb21wdFByZXByb2Nlc3NvckNvbnRyb2xsZXIsXG4gIHVzZXJNZXNzYWdlOiBDaGF0TWVzc2FnZSxcbik6IFByb21pc2U8Q2hhdE1lc3NhZ2UgfCBzdHJpbmc+IHtcbiAgY29uc3QgdXNlclByb21wdCA9IHVzZXJNZXNzYWdlLmdldFRleHQoKTtcbiAgY29uc3QgcGx1Z2luQ29uZmlnID0gY3RsLmdldFBsdWdpbkNvbmZpZyhjb25maWdTY2hlbWF0aWNzKTtcblxuICAvLyBHZXQgY29uZmlndXJhdGlvblxuICBjb25zdCBkb2N1bWVudHNEaXIgPSBwbHVnaW5Db25maWcuZ2V0KFwiZG9jdW1lbnRzRGlyZWN0b3J5XCIpO1xuICBjb25zdCB2ZWN0b3JTdG9yZURpciA9IHBsdWdpbkNvbmZpZy5nZXQoXCJ2ZWN0b3JTdG9yZURpcmVjdG9yeVwiKTtcbiAgY29uc3QgcmV0cmlldmFsTGltaXQgPSBwbHVnaW5Db25maWcuZ2V0KFwicmV0cmlldmFsTGltaXRcIik7XG4gIGNvbnN0IHJldHJpZXZhbFRocmVzaG9sZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJyZXRyaWV2YWxBZmZpbml0eVRocmVzaG9sZFwiKTtcbiAgY29uc3QgY2h1bmtTaXplID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rU2l6ZVwiKTtcbiAgY29uc3QgY2h1bmtPdmVybGFwID0gcGx1Z2luQ29uZmlnLmdldChcImNodW5rT3ZlcmxhcFwiKTtcbiAgY29uc3QgbWF4Q29uY3VycmVudCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYXhDb25jdXJyZW50RmlsZXNcIik7XG4gIGNvbnN0IGVuYWJsZU9DUiA9IHBsdWdpbkNvbmZpZy5nZXQoXCJlbmFibGVPQ1JcIik7XG4gIGNvbnN0IHNraXBQcmV2aW91c2x5SW5kZXhlZCA9IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKTtcbiAgY29uc3QgcGFyc2VEZWxheU1zID0gcGx1Z2luQ29uZmlnLmdldChcInBhcnNlRGVsYXlNc1wiKSA/PyAwO1xuICBjb25zdCByZWluZGV4UmVxdWVzdGVkID0gcGx1Z2luQ29uZmlnLmdldChcIm1hbnVhbFJlaW5kZXgudHJpZ2dlclwiKTtcblxuICAvLyBWYWxpZGF0ZSBjb25maWd1cmF0aW9uXG4gIGlmICghZG9jdW1lbnRzRGlyIHx8IGRvY3VtZW50c0RpciA9PT0gXCJcIikge1xuICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIERvY3VtZW50cyBkaXJlY3Rvcnkgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgaXQgaW4gcGx1Z2luIHNldHRpbmdzLlwiKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cblxuICBpZiAoIXZlY3RvclN0b3JlRGlyIHx8IHZlY3RvclN0b3JlRGlyID09PSBcIlwiKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHN0b3JlIGRpcmVjdG9yeSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHNldCBpdCBpbiBwbHVnaW4gc2V0dGluZ3MuXCIpO1xuICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gUGVyZm9ybSBzYW5pdHkgY2hlY2tzIG9uIGZpcnN0IHJ1blxuICAgIGlmICghc2FuaXR5Q2hlY2tzUGFzc2VkKSB7XG4gICAgICBjb25zdCBjaGVja1N0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIlBlcmZvcm1pbmcgc2FuaXR5IGNoZWNrcy4uLlwiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IHNhbml0eVJlc3VsdCA9IGF3YWl0IHBlcmZvcm1TYW5pdHlDaGVja3MoZG9jdW1lbnRzRGlyLCB2ZWN0b3JTdG9yZURpcik7XG5cbiAgICAgIC8vIExvZyB3YXJuaW5nc1xuICAgICAgZm9yIChjb25zdCB3YXJuaW5nIG9mIHNhbml0eVJlc3VsdC53YXJuaW5ncykge1xuICAgICAgICBjb25zb2xlLndhcm4oXCJbQmlnUkFHXVwiLCB3YXJuaW5nKTtcbiAgICAgIH1cblxuICAgICAgLy8gTG9nIGVycm9ycyBhbmQgYWJvcnQgaWYgY3JpdGljYWxcbiAgICAgIGlmICghc2FuaXR5UmVzdWx0LnBhc3NlZCkge1xuICAgICAgICBmb3IgKGNvbnN0IGVycm9yIG9mIHNhbml0eVJlc3VsdC5lcnJvcnMpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR11cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIGNoZWNrU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICB0ZXh0OiBcIlNhbml0eSBjaGVja3MgZmFpbGVkLiBQbGVhc2UgY2hlY2sgY29uZmlndXJhdGlvbi5cIixcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB1c2VyTWVzc2FnZTtcbiAgICAgIH1cblxuICAgICAgY2hlY2tTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIlNhbml0eSBjaGVja3MgcGFzc2VkXCIsXG4gICAgICB9KTtcbiAgICAgIHNhbml0eUNoZWNrc1Bhc3NlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbGl6ZSB2ZWN0b3Igc3RvcmUgaWYgbmVlZGVkXG4gICAgaWYgKCF2ZWN0b3JTdG9yZSB8fCBsYXN0SW5kZXhlZERpciAhPT0gdmVjdG9yU3RvcmVEaXIpIHtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwibG9hZGluZ1wiLFxuICAgICAgICB0ZXh0OiBcIkluaXRpYWxpemluZyB2ZWN0b3Igc3RvcmUuLi5cIixcbiAgICAgIH0pO1xuXG4gICAgICB2ZWN0b3JTdG9yZSA9IG5ldyBWZWN0b3JTdG9yZSh2ZWN0b3JTdG9yZURpcik7XG4gICAgICBhd2FpdCB2ZWN0b3JTdG9yZS5pbml0aWFsaXplKCk7XG4gICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgIGBbQmlnUkFHXSBWZWN0b3Igc3RvcmUgcmVhZHkgKHBhdGg9JHt2ZWN0b3JTdG9yZURpcn0pLiBXYWl0aW5nIGZvciBxdWVyaWVzLi4uYCxcbiAgICAgICk7XG4gICAgICBsYXN0SW5kZXhlZERpciA9IHZlY3RvclN0b3JlRGlyO1xuXG4gICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBcIlZlY3RvciBzdG9yZSBpbml0aWFsaXplZFwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXdhaXQgbWF5YmVIYW5kbGVDb25maWdUcmlnZ2VyZWRSZWluZGV4KHtcbiAgICAgIGN0bCxcbiAgICAgIGRvY3VtZW50c0RpcixcbiAgICAgIHZlY3RvclN0b3JlRGlyLFxuICAgICAgY2h1bmtTaXplLFxuICAgICAgY2h1bmtPdmVybGFwLFxuICAgICAgbWF4Q29uY3VycmVudCxcbiAgICAgIGVuYWJsZU9DUixcbiAgICAgIHBhcnNlRGVsYXlNcyxcbiAgICAgIHJlaW5kZXhSZXF1ZXN0ZWQsXG4gICAgICBza2lwUHJldmlvdXNseUluZGV4ZWQ6IHBsdWdpbkNvbmZpZy5nZXQoXCJtYW51YWxSZWluZGV4LnNraXBQcmV2aW91c2x5SW5kZXhlZFwiKSxcbiAgICB9KTtcblxuICAgIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gaW5kZXhcbiAgICBjb25zdCBzdGF0cyA9IGF3YWl0IHZlY3RvclN0b3JlLmdldFN0YXRzKCk7XG4gICAgY29uc29sZS5kZWJ1ZyhgW0JpZ1JBR10gVmVjdG9yIHN0b3JlIHN0YXRzIGJlZm9yZSBhdXRvLWluZGV4IGNoZWNrOiB0b3RhbENodW5rcz0ke3N0YXRzLnRvdGFsQ2h1bmtzfSwgdW5pcXVlRmlsZXM9JHtzdGF0cy51bmlxdWVGaWxlc31gKTtcblxuICAgIGlmIChzdGF0cy50b3RhbENodW5rcyA9PT0gMCkge1xuICAgICAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiYXV0by10cmlnZ2VyXCIpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcIltCaWdSQUddIEluZGV4aW5nIGFscmVhZHkgcnVubmluZywgc2tpcHBpbmcgYXV0b21hdGljIGluZGV4aW5nLlwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGluZGV4U3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICB0ZXh0OiBcIlN0YXJ0aW5nIGluaXRpYWwgaW5kZXhpbmcuLi5cIixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IGluZGV4aW5nUmVzdWx0IH0gPSBhd2FpdCBydW5JbmRleGluZ0pvYih7XG4gICAgICAgICAgICBjbGllbnQ6IGN0bC5jbGllbnQsXG4gICAgICAgICAgICBhYm9ydFNpZ25hbDogY3RsLmFib3J0U2lnbmFsLFxuICAgICAgICAgICAgZG9jdW1lbnRzRGlyLFxuICAgICAgICAgICAgdmVjdG9yU3RvcmVEaXIsXG4gICAgICAgICAgICBjaHVua1NpemUsXG4gICAgICAgICAgICBjaHVua092ZXJsYXAsXG4gICAgICAgICAgICBtYXhDb25jdXJyZW50LFxuICAgICAgICAgICAgZW5hYmxlT0NSLFxuICAgICAgICAgICAgYXV0b1JlaW5kZXg6IGZhbHNlLFxuICAgICAgICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgICAgICAgdmVjdG9yU3RvcmUsXG4gICAgICAgICAgICBmb3JjZVJlaW5kZXg6IHRydWUsXG4gICAgICAgICAgICBvblByb2dyZXNzOiAocHJvZ3Jlc3MpID0+IHtcbiAgICAgICAgICAgICAgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJzY2FubmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgICAgICAgaW5kZXhTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZzogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30vJHtwcm9ncmVzcy50b3RhbEZpbGVzfSBmaWxlcyBgICtcbiAgICAgICAgICAgICAgICAgICAgYChzdWNjZXNzPSR7cHJvZ3Jlc3Muc3VjY2Vzc2Z1bEZpbGVzID8/IDB9LCBmYWlsZWQ9JHtwcm9ncmVzcy5mYWlsZWRGaWxlcyA/PyAwfSkgYCArXG4gICAgICAgICAgICAgICAgICAgIGAoJHtwcm9ncmVzcy5jdXJyZW50RmlsZX0pYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiY29tcGxldGVcIikge1xuICAgICAgICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmcgY29tcGxldGU6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9IGZpbGVzIHByb2Nlc3NlZGAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgICAgICBpbmRleFN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBlcnJvcjogJHtwcm9ncmVzcy5lcnJvcn1gLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coYFtCaWdSQUddIEluZGV4aW5nIGNvbXBsZXRlOiAke2luZGV4aW5nUmVzdWx0LnN1Y2Nlc3NmdWxGaWxlc30vJHtpbmRleGluZ1Jlc3VsdC50b3RhbEZpbGVzfSBmaWxlcyBzdWNjZXNzZnVsbHkgaW5kZXhlZCAoJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc30gZmFpbGVkKWApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGluZGV4U3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgICAgICAgdGV4dDogYEluZGV4aW5nIGZhaWxlZDogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcil9YCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiW0JpZ1JBR10gSW5kZXhpbmcgZmFpbGVkOlwiLCBlcnJvcik7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZmluaXNoSW5kZXhpbmcoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIExvZyBtYW51YWwgcmVpbmRleCB0b2dnbGUgc3RhdGVzIGZvciB2aXNpYmlsaXR5IG9uIGVhY2ggY2hhdFxuICAgIGNvbnN0IHRvZ2dsZVN0YXR1c1RleHQgPVxuICAgICAgYE1hbnVhbCBSZWluZGV4IFRyaWdnZXI6ICR7cmVpbmRleFJlcXVlc3RlZCA/IFwiT05cIiA6IFwiT0ZGXCJ9IHwgYCArXG4gICAgICBgU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQ6ICR7c2tpcFByZXZpb3VzbHlJbmRleGVkID8gXCJPTlwiIDogXCJPRkZcIn1gO1xuICAgIGNvbnNvbGUuaW5mbyhgW0JpZ1JBR10gJHt0b2dnbGVTdGF0dXNUZXh0fWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IHRvZ2dsZVN0YXR1c1RleHQsXG4gICAgfSk7XG5cbiAgICAvLyBQZXJmb3JtIHJldHJpZXZhbFxuICAgIGNvbnN0IHJldHJpZXZhbFN0YXR1cyA9IGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgIHRleHQ6IFwiTG9hZGluZyBlbWJlZGRpbmcgbW9kZWwgZm9yIHJldHJpZXZhbC4uLlwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZW1iZWRkaW5nTW9kZWwgPSBhd2FpdCBjdGwuY2xpZW50LmVtYmVkZGluZy5tb2RlbChcbiAgICAgIFwibm9taWMtYWkvbm9taWMtZW1iZWQtdGV4dC12MS41LUdHVUZcIixcbiAgICAgIHsgc2lnbmFsOiBjdGwuYWJvcnRTaWduYWwgfVxuICAgICk7XG5cbiAgICByZXRyaWV2YWxTdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgIHRleHQ6IFwiU2VhcmNoaW5nIGZvciByZWxldmFudCBjb250ZW50Li4uXCIsXG4gICAgfSk7XG5cbiAgICAvLyBFbWJlZCB0aGUgcXVlcnlcbiAgICBjb25zdCBxdWVyeUVtYmVkZGluZ1Jlc3VsdCA9IGF3YWl0IGVtYmVkZGluZ01vZGVsLmVtYmVkKHVzZXJQcm9tcHQpO1xuICAgIGNvbnN0IHF1ZXJ5RW1iZWRkaW5nID0gcXVlcnlFbWJlZGRpbmdSZXN1bHQuZW1iZWRkaW5nO1xuXG4gICAgLy8gU2VhcmNoIHZlY3RvciBzdG9yZVxuICAgIGNvbnN0IHF1ZXJ5UHJldmlldyA9XG4gICAgICB1c2VyUHJvbXB0Lmxlbmd0aCA+IDE2MCA/IGAke3VzZXJQcm9tcHQuc2xpY2UoMCwgMTYwKX0uLi5gIDogdXNlclByb21wdDtcbiAgICBjb25zb2xlLmluZm8oXG4gICAgICBgW0JpZ1JBR10gRXhlY3V0aW5nIHZlY3RvciBzZWFyY2ggZm9yIFwiJHtxdWVyeVByZXZpZXd9XCIgKGxpbWl0PSR7cmV0cmlldmFsTGltaXR9LCB0aHJlc2hvbGQ9JHtyZXRyaWV2YWxUaHJlc2hvbGR9KWAsXG4gICAgKTtcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgdmVjdG9yU3RvcmUuc2VhcmNoKFxuICAgICAgcXVlcnlFbWJlZGRpbmcsXG4gICAgICByZXRyaWV2YWxMaW1pdCxcbiAgICAgIHJldHJpZXZhbFRocmVzaG9sZFxuICAgICk7XG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgdG9wSGl0ID0gcmVzdWx0c1swXTtcbiAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgYFtCaWdSQUddIFZlY3RvciBzZWFyY2ggcmV0dXJuZWQgJHtyZXN1bHRzLmxlbmd0aH0gcmVzdWx0cy4gVG9wIGhpdDogZmlsZT0ke3RvcEhpdC5maWxlTmFtZX0gc2NvcmU9JHt0b3BIaXQuc2NvcmUudG9GaXhlZCgzKX1gLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgZG9jU3VtbWFyaWVzID0gcmVzdWx0c1xuICAgICAgICAubWFwKFxuICAgICAgICAgIChyZXN1bHQsIGlkeCkgPT5cbiAgICAgICAgICAgIGAjJHtpZHggKyAxfSBmaWxlPSR7cGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpfSBzY29yZT0ke3Jlc3VsdC5zY29yZS50b0ZpeGVkKDMpfWAsXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIFJlbGV2YW50IGRvY3VtZW50czpcXG4ke2RvY1N1bW1hcmllc31gKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVmVjdG9yIHNlYXJjaCByZXR1cm5lZCAwIHJlc3VsdHMuXCIpO1xuICAgIH1cblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgc3RhdHVzOiBcImNhbmNlbGVkXCIsXG4gICAgICAgIHRleHQ6IFwiTm8gcmVsZXZhbnQgY29udGVudCBmb3VuZCBpbiBpbmRleGVkIGRvY3VtZW50c1wiLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IG5vdGVBYm91dE5vUmVzdWx0cyA9XG4gICAgICAgIGBJbXBvcnRhbnQ6IE5vIHJlbGV2YW50IGNvbnRlbnQgd2FzIGZvdW5kIGluIHRoZSBpbmRleGVkIGRvY3VtZW50cyBmb3IgdGhlIHVzZXIgcXVlcnkuIGAgK1xuICAgICAgICBgSW4gbGVzcyB0aGFuIG9uZSBzZW50ZW5jZSwgaW5mb3JtIHRoZSB1c2VyIG9mIHRoaXMuIGAgK1xuICAgICAgICBgVGhlbiByZXNwb25kIHRvIHRoZSBxdWVyeSB0byB0aGUgYmVzdCBvZiB5b3VyIGFiaWxpdHkuYDtcblxuICAgICAgcmV0dXJuIG5vdGVBYm91dE5vUmVzdWx0cyArIGBcXG5cXG5Vc2VyIFF1ZXJ5OlxcblxcbiR7dXNlclByb21wdH1gO1xuICAgIH1cblxuICAgIC8vIEZvcm1hdCByZXN1bHRzXG4gICAgcmV0cmlldmFsU3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgUmV0cmlldmVkICR7cmVzdWx0cy5sZW5ndGh9IHJlbGV2YW50IHBhc3NhZ2VzYCxcbiAgICB9KTtcblxuICAgIGN0bC5kZWJ1ZyhcIlJldHJpZXZhbCByZXN1bHRzOlwiLCByZXN1bHRzKTtcblxuICAgIGxldCBwcm9jZXNzZWRDb250ZW50ID0gXCJcIjtcbiAgICBsZXQgcHJvY2Vzc2VkUHJldmlldyA9IFwiXCI7XG4gICAgY29uc3QgcHJlZml4ID0gXCJUaGUgZm9sbG93aW5nIHBhc3NhZ2VzIHdlcmUgZm91bmQgaW4geW91ciBpbmRleGVkIGRvY3VtZW50czpcXG5cXG5cIjtcbiAgICBwcm9jZXNzZWRDb250ZW50ICs9IHByZWZpeDtcbiAgICBwcm9jZXNzZWRQcmV2aWV3ICs9IHByZWZpeDtcblxuICAgIGxldCBjaXRhdGlvbk51bWJlciA9IDE7XG4gICAgZm9yIChjb25zdCByZXN1bHQgb2YgcmVzdWx0cykge1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXRoLmJhc2VuYW1lKHJlc3VsdC5maWxlUGF0aCk7XG4gICAgICBjb25zdCBjaXRhdGlvbkxhYmVsID0gYENpdGF0aW9uICR7Y2l0YXRpb25OdW1iZXJ9IChmcm9tICR7ZmlsZU5hbWV9LCBzY29yZTogJHtyZXN1bHQuc2NvcmUudG9GaXhlZCgzKX0pOiBgO1xuICAgICAgcHJvY2Vzc2VkQ29udGVudCArPSBgXFxuJHtjaXRhdGlvbkxhYmVsfVwiJHtyZXN1bHQudGV4dH1cIlxcblxcbmA7XG4gICAgICBwcm9jZXNzZWRQcmV2aWV3ICs9IGBcXG4ke2NpdGF0aW9uTGFiZWx9XCIke3N1bW1hcml6ZVRleHQocmVzdWx0LnRleHQpfVwiXFxuXFxuYDtcbiAgICAgIGNpdGF0aW9uTnVtYmVyKys7XG4gICAgfVxuXG4gICAgLy8gQWRkIGNpdGF0aW9ucyB0byBMTSBTdHVkaW8ncyBjaXRhdGlvbiBzeXN0ZW1cbiAgICAvLyBOb3RlOiBUaGlzIHdvdWxkIHJlcXVpcmUgYWRhcHRpbmcgdGhlIHJlc3VsdHMgdG8gdGhlIGV4cGVjdGVkIGZvcm1hdFxuICAgIC8vIFRoZSBjaXRhdGlvbiBzeXN0ZW0gZXhwZWN0cyBzcGVjaWZpYyBzdHJ1Y3R1cmUgZnJvbSB0aGUgcmV0cmlldmFsIEFQSVxuICAgIC8vIEZvciBub3csIHdlJ2xsIGp1c3QgaW5qZWN0IHRoZSB0ZXh0IGNvbnRlbnRcblxuICAgIGNvbnN0IHN1ZmZpeCA9XG4gICAgICBgVXNlIHRoZSBjaXRhdGlvbnMgYWJvdmUgdG8gcmVzcG9uZCB0byB0aGUgdXNlciBxdWVyeSwgb25seSBpZiB0aGV5IGFyZSByZWxldmFudC4gYCArXG4gICAgICBgT3RoZXJ3aXNlLCByZXNwb25kIHRvIHRoZSBiZXN0IG9mIHlvdXIgYWJpbGl0eSB3aXRob3V0IHRoZW0uYCArXG4gICAgICBgXFxuXFxuVXNlciBRdWVyeTpcXG5cXG4ke3VzZXJQcm9tcHR9YDtcbiAgICBwcm9jZXNzZWRDb250ZW50ICs9IHN1ZmZpeDtcbiAgICBwcm9jZXNzZWRQcmV2aWV3ICs9IHN1ZmZpeDtcblxuICAgIGN0bC5kZWJ1ZyhcIlByb2Nlc3NlZCBjb250ZW50IChwcmV2aWV3KTpcIiwgcHJvY2Vzc2VkUHJldmlldyk7XG5cbiAgICBjb25zdCBwYXNzYWdlc0xvZ0VudHJpZXMgPSByZXN1bHRzLm1hcCgocmVzdWx0LCBpZHgpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShyZXN1bHQuZmlsZVBhdGgpO1xuICAgICAgcmV0dXJuIGAjJHtpZHggKyAxfSBmaWxlPSR7ZmlsZU5hbWV9IHNjb3JlPSR7cmVzdWx0LnNjb3JlLnRvRml4ZWQoMyl9XFxuJHtzdW1tYXJpemVUZXh0KHJlc3VsdC50ZXh0KX1gO1xuICAgIH0pO1xuICAgIGNvbnN0IHBhc3NhZ2VzTG9nID0gcGFzc2FnZXNMb2dFbnRyaWVzLmpvaW4oXCJcXG5cXG5cIik7XG5cbiAgICBjb25zb2xlLmluZm8oYFtCaWdSQUddIFJBRyBwYXNzYWdlcyAoJHtyZXN1bHRzLmxlbmd0aH0pIHByZXZpZXc6XFxuJHtwYXNzYWdlc0xvZ31gKTtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBgUkFHIHBhc3NhZ2VzICgke3Jlc3VsdHMubGVuZ3RofSk6YCxcbiAgICB9KTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIHBhc3NhZ2VzTG9nRW50cmllcykge1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IGVudHJ5LFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc29sZS5pbmZvKGBbQmlnUkFHXSBGaW5hbCBwcm9tcHQgc2VudCB0byBtb2RlbCAocHJldmlldyk6XFxuJHtwcm9jZXNzZWRQcmV2aWV3fWApO1xuICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgIHRleHQ6IGBGaW5hbCBwcm9tcHQgc2VudCB0byBtb2RlbCAocHJldmlldyk6XFxuJHtwcm9jZXNzZWRQcmV2aWV3fWAsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJvY2Vzc2VkQ29udGVudDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiW1Byb21wdFByZXByb2Nlc3Nvcl0gUHJlcHJvY2Vzc2luZyBmYWlsZWQuXCIsIGVycm9yKTtcbiAgICByZXR1cm4gdXNlck1lc3NhZ2U7XG4gIH1cbn1cblxuaW50ZXJmYWNlIENvbmZpZ1JlaW5kZXhPcHRzIHtcbiAgY3RsOiBQcm9tcHRQcmVwcm9jZXNzb3JDb250cm9sbGVyO1xuICBkb2N1bWVudHNEaXI6IHN0cmluZztcbiAgdmVjdG9yU3RvcmVEaXI6IHN0cmluZztcbiAgY2h1bmtTaXplOiBudW1iZXI7XG4gIGNodW5rT3ZlcmxhcDogbnVtYmVyO1xuICBtYXhDb25jdXJyZW50OiBudW1iZXI7XG4gIGVuYWJsZU9DUjogYm9vbGVhbjtcbiAgcGFyc2VEZWxheU1zOiBudW1iZXI7XG4gIHJlaW5kZXhSZXF1ZXN0ZWQ6IGJvb2xlYW47XG4gIHNraXBQcmV2aW91c2x5SW5kZXhlZDogYm9vbGVhbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbWF5YmVIYW5kbGVDb25maWdUcmlnZ2VyZWRSZWluZGV4KHtcbiAgY3RsLFxuICBkb2N1bWVudHNEaXIsXG4gIHZlY3RvclN0b3JlRGlyLFxuICBjaHVua1NpemUsXG4gIGNodW5rT3ZlcmxhcCxcbiAgbWF4Q29uY3VycmVudCxcbiAgZW5hYmxlT0NSLFxuICBwYXJzZURlbGF5TXMsXG4gIHJlaW5kZXhSZXF1ZXN0ZWQsXG4gIHNraXBQcmV2aW91c2x5SW5kZXhlZCxcbn06IENvbmZpZ1JlaW5kZXhPcHRzKSB7XG4gIGlmICghcmVpbmRleFJlcXVlc3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHJlbWluZGVyVGV4dCA9XG4gICAgXCJNYW51YWwgUmVpbmRleCBUcmlnZ2VyIGlzIE9OLiBUaGUgaW5kZXggd2lsbCBiZSByZWJ1aWx0IGVhY2ggY2hhdCB3aGVuICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT0ZGLiBJZiAnU2tpcCBQcmV2aW91c2x5IEluZGV4ZWQgRmlsZXMnIGlzIE9OLCB0aGUgaW5kZXggd2lsbCBvbmx5IGJlIHJlYnVpbHQgZm9yIG5ldyBvciBjaGFuZ2VkIGZpbGVzLlwiO1xuICBjb25zb2xlLmluZm8oYFtCaWdSQUddICR7cmVtaW5kZXJUZXh0fWApO1xuICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgIHRleHQ6IHJlbWluZGVyVGV4dCxcbiAgfSk7XG5cbiAgaWYgKCF0cnlTdGFydEluZGV4aW5nKFwiY29uZmlnLXRyaWdnZXJcIikpIHtcbiAgICBjdGwuY3JlYXRlU3RhdHVzKHtcbiAgICAgIHN0YXR1czogXCJjYW5jZWxlZFwiLFxuICAgICAgdGV4dDogXCJNYW51YWwgcmVpbmRleCBhbHJlYWR5IHJ1bm5pbmcuIFBsZWFzZSB3YWl0IGZvciBpdCB0byBmaW5pc2guXCIsXG4gICAgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IHJlcXVlc3RlZCBmcm9tIGNvbmZpZy4uLlwiLFxuICB9KTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgaW5kZXhpbmdSZXN1bHQgfSA9IGF3YWl0IHJ1bkluZGV4aW5nSm9iKHtcbiAgICAgIGNsaWVudDogY3RsLmNsaWVudCxcbiAgICAgIGFib3J0U2lnbmFsOiBjdGwuYWJvcnRTaWduYWwsXG4gICAgICBkb2N1bWVudHNEaXIsXG4gICAgICB2ZWN0b3JTdG9yZURpcixcbiAgICAgIGNodW5rU2l6ZSxcbiAgICAgIGNodW5rT3ZlcmxhcCxcbiAgICAgIG1heENvbmN1cnJlbnQsXG4gICAgICBlbmFibGVPQ1IsXG4gICAgICBhdXRvUmVpbmRleDogc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgcGFyc2VEZWxheU1zLFxuICAgICAgZm9yY2VSZWluZGV4OiAhc2tpcFByZXZpb3VzbHlJbmRleGVkLFxuICAgICAgdmVjdG9yU3RvcmU6IHZlY3RvclN0b3JlID8/IHVuZGVmaW5lZCxcbiAgICAgIG9uUHJvZ3Jlc3M6IChwcm9ncmVzcykgPT4ge1xuICAgICAgICBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcInNjYW5uaW5nXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImxvYWRpbmdcIixcbiAgICAgICAgICAgIHRleHQ6IGBTY2FubmluZzogJHtwcm9ncmVzcy5jdXJyZW50RmlsZX1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHByb2dyZXNzLnN0YXR1cyA9PT0gXCJpbmRleGluZ1wiKSB7XG4gICAgICAgICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIHN0YXR1czogXCJsb2FkaW5nXCIsXG4gICAgICAgICAgICB0ZXh0OiBgSW5kZXhpbmc6ICR7cHJvZ3Jlc3MucHJvY2Vzc2VkRmlsZXN9LyR7cHJvZ3Jlc3MudG90YWxGaWxlc30gZmlsZXMgYCArXG4gICAgICAgICAgICAgIGAoc3VjY2Vzcz0ke3Byb2dyZXNzLnN1Y2Nlc3NmdWxGaWxlcyA/PyAwfSwgZmFpbGVkPSR7cHJvZ3Jlc3MuZmFpbGVkRmlsZXMgPz8gMH0pIGAgK1xuICAgICAgICAgICAgICBgKCR7cHJvZ3Jlc3MuY3VycmVudEZpbGV9KWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3Muc3RhdHVzID09PSBcImNvbXBsZXRlXCIpIHtcbiAgICAgICAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgc3RhdHVzOiBcImRvbmVcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBjb21wbGV0ZTogJHtwcm9ncmVzcy5wcm9jZXNzZWRGaWxlc30gZmlsZXMgcHJvY2Vzc2VkYCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9ncmVzcy5zdGF0dXMgPT09IFwiZXJyb3JcIikge1xuICAgICAgICAgIHN0YXR1cy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBzdGF0dXM6IFwiY2FuY2VsZWRcIixcbiAgICAgICAgICAgIHRleHQ6IGBJbmRleGluZyBlcnJvcjogJHtwcm9ncmVzcy5lcnJvcn1gLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgc3RhdHVzLnNldFN0YXRlKHtcbiAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICB0ZXh0OiBcIk1hbnVhbCByZWluZGV4IGNvbXBsZXRlIVwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3VtbWFyeUxpbmVzID0gW1xuICAgICAgYFByb2Nlc3NlZDogJHtpbmRleGluZ1Jlc3VsdC5zdWNjZXNzZnVsRmlsZXN9LyR7aW5kZXhpbmdSZXN1bHQudG90YWxGaWxlc31gLFxuICAgICAgYEZhaWxlZDogJHtpbmRleGluZ1Jlc3VsdC5mYWlsZWRGaWxlc31gLFxuICAgICAgYFNraXBwZWQgKHVuY2hhbmdlZCk6ICR7aW5kZXhpbmdSZXN1bHQuc2tpcHBlZEZpbGVzfWAsXG4gICAgICBgVXBkYXRlZCBleGlzdGluZyBmaWxlczogJHtpbmRleGluZ1Jlc3VsdC51cGRhdGVkRmlsZXN9YCxcbiAgICAgIGBOZXcgZmlsZXMgYWRkZWQ6ICR7aW5kZXhpbmdSZXN1bHQubmV3RmlsZXN9YCxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgbGluZSBvZiBzdW1tYXJ5TGluZXMpIHtcbiAgICAgIGN0bC5jcmVhdGVTdGF0dXMoe1xuICAgICAgICBzdGF0dXM6IFwiZG9uZVwiLFxuICAgICAgICB0ZXh0OiBsaW5lLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4aW5nUmVzdWx0LnRvdGFsRmlsZXMgPiAwICYmIGluZGV4aW5nUmVzdWx0LnNraXBwZWRGaWxlcyA9PT0gaW5kZXhpbmdSZXN1bHQudG90YWxGaWxlcykge1xuICAgICAgY3RsLmNyZWF0ZVN0YXR1cyh7XG4gICAgICAgIHN0YXR1czogXCJkb25lXCIsXG4gICAgICAgIHRleHQ6IFwiQWxsIGZpbGVzIHdlcmUgYWxyZWFkeSB1cCB0byBkYXRlIChza2lwcGVkKS5cIixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYFtCaWdSQUddIE1hbnVhbCByZWluZGV4IHN1bW1hcnk6XFxuICAke3N1bW1hcnlMaW5lcy5qb2luKFwiXFxuICBcIil9YCxcbiAgICApO1xuXG4gICAgYXdhaXQgbm90aWZ5TWFudWFsUmVzZXROZWVkZWQoY3RsKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzdGF0dXMuc2V0U3RhdGUoe1xuICAgICAgc3RhdHVzOiBcImVycm9yXCIsXG4gICAgICB0ZXh0OiBgTWFudWFsIHJlaW5kZXggZmFpbGVkOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKX1gLFxuICAgIH0pO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJbQmlnUkFHXSBNYW51YWwgcmVpbmRleCBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBmaW5pc2hJbmRleGluZygpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG5vdGlmeU1hbnVhbFJlc2V0TmVlZGVkKGN0bDogUHJvbXB0UHJlcHJvY2Vzc29yQ29udHJvbGxlcikge1xuICB0cnkge1xuICAgIGF3YWl0IGN0bC5jbGllbnQuc3lzdGVtLm5vdGlmeSh7XG4gICAgICB0aXRsZTogXCJNYW51YWwgcmVpbmRleCBjb21wbGV0ZWRcIixcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIk1hbnVhbCBSZWluZGV4IFRyaWdnZXIgaXMgT04uIFRoZSBpbmRleCB3aWxsIGJlIHJlYnVpbHQgZWFjaCBjaGF0IHdoZW4gJ1NraXAgUHJldmlvdXNseSBJbmRleGVkIEZpbGVzJyBpcyBPRkYuIElmICdTa2lwIFByZXZpb3VzbHkgSW5kZXhlZCBGaWxlcycgaXMgT04sIHRoZSBpbmRleCB3aWxsIG9ubHkgYmUgcmVidWlsdCBmb3IgbmV3IG9yIGNoYW5nZWQgZmlsZXMuXCIsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS53YXJuKFwiW0JpZ1JBR10gVW5hYmxlIHRvIHNlbmQgbm90aWZpY2F0aW9uIGFib3V0IG1hbnVhbCByZWluZGV4IHJlc2V0OlwiLCBlcnJvcik7XG4gIH1cbn1cblxuXG4iLCAiaW1wb3J0IHsgdHlwZSBQbHVnaW5Db250ZXh0IH0gZnJvbSBcIkBsbXN0dWRpby9zZGtcIjtcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYXRpY3MgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IHByZXByb2Nlc3MgfSBmcm9tIFwiLi9wcm9tcHRQcmVwcm9jZXNzb3JcIjtcblxuLyoqXG4gKiBNYWluIGVudHJ5IHBvaW50IGZvciB0aGUgQmlnIFJBRyBwbHVnaW4uXG4gKiBUaGlzIHBsdWdpbiBpbmRleGVzIGxhcmdlIGRvY3VtZW50IGNvbGxlY3Rpb25zIGFuZCBwcm92aWRlcyBSQUcgY2FwYWJpbGl0aWVzLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWFpbihjb250ZXh0OiBQbHVnaW5Db250ZXh0KSB7XG4gIC8vIFJlZ2lzdGVyIHRoZSBjb25maWd1cmF0aW9uIHNjaGVtYXRpY3NcbiAgY29udGV4dC53aXRoQ29uZmlnU2NoZW1hdGljcyhjb25maWdTY2hlbWF0aWNzKTtcbiAgXG4gIC8vIFJlZ2lzdGVyIHRoZSBwcm9tcHQgcHJlcHJvY2Vzc29yXG4gIGNvbnRleHQud2l0aFByb21wdFByZXByb2Nlc3NvcihwcmVwcm9jZXNzKTtcbiAgXG4gIGNvbnNvbGUubG9nKFwiW0JpZ1JBR10gUGx1Z2luIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseVwiKTtcbn1cblxuIiwgImltcG9ydCB7IExNU3R1ZGlvQ2xpZW50LCB0eXBlIFBsdWdpbkNvbnRleHQgfSBmcm9tIFwiQGxtc3R1ZGlvL3Nka1wiO1xuXG5kZWNsYXJlIHZhciBwcm9jZXNzOiBhbnk7XG5cbi8vIFdlIHJlY2VpdmUgcnVudGltZSBpbmZvcm1hdGlvbiBpbiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGVzLlxuY29uc3QgY2xpZW50SWRlbnRpZmllciA9IHByb2Nlc3MuZW52LkxNU19QTFVHSU5fQ0xJRU5UX0lERU5USUZJRVI7XG5jb25zdCBjbGllbnRQYXNza2V5ID0gcHJvY2Vzcy5lbnYuTE1TX1BMVUdJTl9DTElFTlRfUEFTU0tFWTtcbmNvbnN0IGJhc2VVcmwgPSBwcm9jZXNzLmVudi5MTVNfUExVR0lOX0JBU0VfVVJMO1xuXG5jb25zdCBjbGllbnQgPSBuZXcgTE1TdHVkaW9DbGllbnQoe1xuICBjbGllbnRJZGVudGlmaWVyLFxuICBjbGllbnRQYXNza2V5LFxuICBiYXNlVXJsLFxufSk7XG5cbihnbG9iYWxUaGlzIGFzIGFueSkuX19MTVNfUExVR0lOX0NPTlRFWFQgPSB0cnVlO1xuXG5sZXQgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gZmFsc2U7XG5sZXQgcHJvbXB0UHJlcHJvY2Vzc29yU2V0ID0gZmFsc2U7XG5sZXQgY29uZmlnU2NoZW1hdGljc1NldCA9IGZhbHNlO1xubGV0IGdsb2JhbENvbmZpZ1NjaGVtYXRpY3NTZXQgPSBmYWxzZTtcbmxldCB0b29sc1Byb3ZpZGVyU2V0ID0gZmFsc2U7XG5sZXQgZ2VuZXJhdG9yU2V0ID0gZmFsc2U7XG5cbmNvbnN0IHNlbGZSZWdpc3RyYXRpb25Ib3N0ID0gY2xpZW50LnBsdWdpbnMuZ2V0U2VsZlJlZ2lzdHJhdGlvbkhvc3QoKTtcblxuY29uc3QgcGx1Z2luQ29udGV4dDogUGx1Z2luQ29udGV4dCA9IHtcbiAgd2l0aFByZWRpY3Rpb25Mb29wSGFuZGxlcjogKGdlbmVyYXRlKSA9PiB7XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUHJlZGljdGlvbkxvb3BIYW5kbGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByZWRpY3Rpb25Mb29wSGFuZGxlciBjYW5ub3QgYmUgdXNlZCB3aXRoIGEgdG9vbHMgcHJvdmlkZXJcIik7XG4gICAgfVxuXG4gICAgcHJlZGljdGlvbkxvb3BIYW5kbGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRQcmVkaWN0aW9uTG9vcEhhbmRsZXIoZ2VuZXJhdGUpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoUHJvbXB0UHJlcHJvY2Vzc29yOiAocHJlcHJvY2VzcykgPT4ge1xuICAgIGlmIChwcm9tcHRQcmVwcm9jZXNzb3JTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlByb21wdFByZXByb2Nlc3NvciBhbHJlYWR5IHJlZ2lzdGVyZWRcIik7XG4gICAgfVxuICAgIHByb21wdFByZXByb2Nlc3NvclNldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0UHJvbXB0UHJlcHJvY2Vzc29yKHByZXByb2Nlc3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoQ29uZmlnU2NoZW1hdGljczogKGNvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoY29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ29uZmlnIHNjaGVtYXRpY3MgYWxyZWFkeSByZWdpc3RlcmVkXCIpO1xuICAgIH1cbiAgICBjb25maWdTY2hlbWF0aWNzU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRDb25maWdTY2hlbWF0aWNzKGNvbmZpZ1NjaGVtYXRpY3MpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2xvYmFsQ29uZmlnU2NoZW1hdGljczogKGdsb2JhbENvbmZpZ1NjaGVtYXRpY3MpID0+IHtcbiAgICBpZiAoZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2xvYmFsIGNvbmZpZyBzY2hlbWF0aWNzIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgZ2xvYmFsQ29uZmlnU2NoZW1hdGljc1NldCA9IHRydWU7XG4gICAgc2VsZlJlZ2lzdHJhdGlvbkhvc3Quc2V0R2xvYmFsQ29uZmlnU2NoZW1hdGljcyhnbG9iYWxDb25maWdTY2hlbWF0aWNzKTtcbiAgICByZXR1cm4gcGx1Z2luQ29udGV4dDtcbiAgfSxcbiAgd2l0aFRvb2xzUHJvdmlkZXI6ICh0b29sc1Byb3ZpZGVyKSA9PiB7XG4gICAgaWYgKHRvb2xzUHJvdmlkZXJTZXQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRvb2xzIHByb3ZpZGVyIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG4gICAgaWYgKHByZWRpY3Rpb25Mb29wSGFuZGxlclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVG9vbHMgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgd2l0aCBhIHByZWRpY3Rpb25Mb29wSGFuZGxlclwiKTtcbiAgICB9XG5cbiAgICB0b29sc1Byb3ZpZGVyU2V0ID0gdHJ1ZTtcbiAgICBzZWxmUmVnaXN0cmF0aW9uSG9zdC5zZXRUb29sc1Byb3ZpZGVyKHRvb2xzUHJvdmlkZXIpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxuICB3aXRoR2VuZXJhdG9yOiAoZ2VuZXJhdG9yKSA9PiB7XG4gICAgaWYgKGdlbmVyYXRvclNldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiR2VuZXJhdG9yIGFscmVhZHkgcmVnaXN0ZXJlZFwiKTtcbiAgICB9XG5cbiAgICBnZW5lcmF0b3JTZXQgPSB0cnVlO1xuICAgIHNlbGZSZWdpc3RyYXRpb25Ib3N0LnNldEdlbmVyYXRvcihnZW5lcmF0b3IpO1xuICAgIHJldHVybiBwbHVnaW5Db250ZXh0O1xuICB9LFxufTtcblxuaW1wb3J0KFwiLi8uLi9zcmMvaW5kZXgudHNcIikudGhlbihhc3luYyBtb2R1bGUgPT4ge1xuICByZXR1cm4gYXdhaXQgbW9kdWxlLm1haW4ocGx1Z2luQ29udGV4dCk7XG59KS50aGVuKCgpID0+IHtcbiAgc2VsZlJlZ2lzdHJhdGlvbkhvc3QuaW5pdENvbXBsZXRlZCgpO1xufSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gZXhlY3V0ZSB0aGUgbWFpbiBmdW5jdGlvbiBvZiB0aGUgcGx1Z2luLlwiKTtcbiAgY29uc29sZS5lcnJvcihlcnJvcik7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0JBRWE7QUFGYjtBQUFBO0FBQUE7QUFBQSxpQkFBdUM7QUFFaEMsSUFBTSx1QkFBbUIs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QkFBc0I7QUFDdEIseUJBQXFCLG9CQUFvQkEsaUJBQWdCO0FBQ3pELFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSw0QkFBNEIsQ0FBQywyQkFBMkI7QUFDdEQsUUFBSSwyQkFBMkI7QUFDN0IsWUFBTSxJQUFJLE1BQU0sNkNBQTZDO0FBQUEsSUFDL0Q7QUFDQSxnQ0FBNEI7QUFDNUIseUJBQXFCLDBCQUEwQixzQkFBc0I7QUFDckUsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLG1CQUFtQixDQUFDLGtCQUFrQjtBQUNwQyxRQUFJLGtCQUFrQjtBQUNwQixZQUFNLElBQUksTUFBTSxtQ0FBbUM7QUFBQSxJQUNyRDtBQUNBLFFBQUksMEJBQTBCO0FBQzVCLFlBQU0sSUFBSSxNQUFNLDREQUE0RDtBQUFBLElBQzlFO0FBRUEsdUJBQW1CO0FBQ25CLHlCQUFxQixpQkFBaUIsYUFBYTtBQUNuRCxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsZUFBZSxDQUFDLGNBQWM7QUFDNUIsUUFBSSxjQUFjO0FBQ2hCLFlBQU0sSUFBSSxNQUFNLDhCQUE4QjtBQUFBLElBQ2hEO0FBRUEsbUJBQWU7QUFDZix5QkFBcUIsYUFBYSxTQUFTO0FBQzNDLFdBQU87QUFBQSxFQUNUO0FBQ0Y7QUFFQSx3REFBNEIsS0FBSyxPQUFNQyxZQUFVO0FBQy9DLFNBQU8sTUFBTUEsUUFBTyxLQUFLLGFBQWE7QUFDeEMsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUNaLHVCQUFxQixjQUFjO0FBQ3JDLENBQUMsRUFBRSxNQUFNLENBQUMsVUFBVTtBQUNsQixVQUFRLE1BQU0sb0RBQW9EO0FBQ2xFLFVBQVEsTUFBTSxLQUFLO0FBQ3JCLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgImZzIiwgInBhdGgiLCAiZnMiLCAiY2xpZW50IiwgInJlc29sdmUiLCAicGRmUGFyc2UiLCAiZnMiLCAicmVzb2x2ZSIsICJpbXBvcnRfdGVzc2VyYWN0IiwgImZzIiwgImNsaWVudCIsICJwYXRoIiwgImNodW5rVGV4dCIsICJyZXNvbHZlIiwgImZzIiwgImZzIiwgInBhdGgiLCAiUFF1ZXVlIiwgInZlY3RvclN0b3JlIiwgImNsaWVudCIsICJyZXNvbHZlIiwgImNsaWVudCIsICJ2ZWN0b3JTdG9yZSIsICJwYXRoIiwgImltcG9ydF9zZGsiLCAicHJlcHJvY2VzcyIsICJjb25maWdTY2hlbWF0aWNzIiwgIm1vZHVsZSJdCn0K
