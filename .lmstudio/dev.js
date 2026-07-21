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
function resolveEmbeddingModelId(raw) {
  const t = typeof raw === "string" ? raw.trim() : "";
  return t.length > 0 ? t : DEFAULT_EMBEDDING_MODEL_ID;
}
var import_sdk, DEFAULT_EMBEDDING_MODEL_ID, DEFAULT_PROMPT_TEMPLATE, configSchematics;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    import_sdk = require("@lmstudio/sdk");
    DEFAULT_EMBEDDING_MODEL_ID = "nomic-ai/nomic-embed-text-v1.5-GGUF";
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
      "embeddingModel",
      "string",
      {
        displayName: "Embedding Model",
        subtitle: "LM Studio accepts more than one spelling for the same model\u2014for example mixedbread-ai/mxbai-embed-large-v1 (Hub / download) or text-embedding-mxbai-embed-large-v1 (as in lms ls). Both are valid; use one value consistently for indexing and chat so it matches .big-rag-embedding.json. Reindex after changing.",
        placeholder: DEFAULT_EMBEDDING_MODEL_ID
      },
      DEFAULT_EMBEDDING_MODEL_ID
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
        subtitle: "Size of text chunks for embedding (in words).",
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
        subtitle: "Overlap between consecutive chunks (in words).",
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
      "excludeFilenamePatterns",
      "string",
      {
        displayName: "Exclude filename patterns",
        subtitle: "Optional. One glob per line, matched against each file path relative to Documents Directory (use /). Lines starting with # are comments. Example: *.png excludes PNGs in any folder; archive/** excludes that subtree. Does not remove chunks already in the vector store\u2014clear or reindex to drop old data.",
        placeholder: "*.png\n# *.jpg",
        isParagraph: true
      },
      ""
    ).field(
      "additionalExtensions",
      "string",
      {
        displayName: "Additional plain-text extensions",
        subtitle: "Optional. One extension per line (e.g. .java, .cs, .py). Files are read as plain text. Binaries such as .exe and .zip are rejected. Built-in types like PDF and EPUB do not need to be listed.",
        placeholder: ".java\n.cs\n.py",
        isParagraph: true
      },
      ""
    ).field(
      "manualReindex.trigger",
      "boolean",
      {
        displayName: "Manual Reindex Trigger",
        subtitle: "Toggle ON to reindex on the next chat message. Turn it OFF again afterward (it does not auto-reset). Use \u201CSkip Previously Indexed Files\u201D to skip unchanged files."
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

// src/utils/sanityChecks.ts
async function performSanityChecks(documentsDir, vectorStoreDir) {
  const warnings = [];
  const errors = [];
  try {
    await fs.promises.access(documentsDir, fs.constants.R_OK);
  } catch {
    errors.push(`Documents directory does not exist or is not readable: ${documentsDir}`);
  }
  try {
    await fs.promises.access(vectorStoreDir, fs.constants.W_OK);
  } catch {
    try {
      await fs.promises.mkdir(vectorStoreDir, { recursive: true });
    } catch {
      errors.push(
        `Vector store directory does not exist and cannot be created: ${vectorStoreDir}`
      );
    }
  }
  try {
    const stats = await fs.promises.statfs(vectorStoreDir);
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
    const files = await fs.promises.readdir(vectorStoreDir);
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
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
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
              const stats = await fs.promises.stat(fullPath);
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
var fs, os;
var init_sanityChecks = __esm({
  "src/utils/sanityChecks.ts"() {
    "use strict";
    fs = __toESM(require("fs"));
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

// src/utils/coerceEmbedding.ts
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
var init_coerceEmbedding = __esm({
  "src/utils/coerceEmbedding.ts"() {
    "use strict";
  }
});

// src/utils/embeddingIndexManifest.ts
function getEmbeddingManifestPath(vectorStoreDir) {
  return path.join(path.resolve(vectorStoreDir), EMBEDDING_INDEX_MANIFEST_FILENAME);
}
async function readEmbeddingIndexManifest(vectorStoreDir) {
  const filePath = getEmbeddingManifestPath(vectorStoreDir);
  try {
    const raw = await fs2.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (typeof data.embeddingModelId === "string" && data.embeddingModelId.length > 0 && typeof data.dimensions === "number" && Number.isFinite(data.dimensions) && data.dimensions > 0) {
      return { embeddingModelId: data.embeddingModelId, dimensions: data.dimensions };
    }
    return null;
  } catch (e) {
    if (e?.code === "ENOENT") {
      return null;
    }
    console.warn("[BigRAG] Could not read embedding index manifest:", e);
    return null;
  }
}
async function writeEmbeddingIndexManifest(vectorStoreDir, manifest) {
  const filePath = getEmbeddingManifestPath(vectorStoreDir);
  await fs2.mkdir(path.dirname(filePath), { recursive: true });
  await fs2.writeFile(filePath, JSON.stringify(manifest, null, 2), "utf-8");
}
async function deleteEmbeddingIndexManifest(vectorStoreDir) {
  const filePath = getEmbeddingManifestPath(vectorStoreDir);
  try {
    await fs2.unlink(filePath);
  } catch (e) {
    if (e?.code !== "ENOENT") {
      console.warn("[BigRAG] Could not delete embedding index manifest:", e);
    }
  }
}
async function syncEmbeddingManifestAfterIndexing(vectorStoreDir, totalChunks, resolvedModelId, embeddingModel) {
  if (totalChunks === 0) {
    await deleteEmbeddingIndexManifest(vectorStoreDir);
    return;
  }
  const probe = await embeddingModel.embed(".");
  const dimensions = coerceEmbeddingVector(probe.embedding).length;
  await writeEmbeddingIndexManifest(vectorStoreDir, {
    embeddingModelId: resolvedModelId,
    dimensions
  });
}
async function checkEmbeddingModelForRetrieval(args) {
  const { vectorStoreDir, resolvedModelId, totalChunks, embeddingModel } = args;
  if (totalChunks === 0) {
    await deleteEmbeddingIndexManifest(vectorStoreDir);
    return { ok: true };
  }
  const manifest = await readEmbeddingIndexManifest(vectorStoreDir);
  if (!manifest) {
    const key = path.resolve(vectorStoreDir);
    if (!legacyWarnedDirs.has(key)) {
      legacyWarnedDirs.add(key);
      console.warn(
        "[BigRAG] Index has chunks but no `.big-rag-embedding.json` manifest (likely built with an older plugin). Retrieval proceeds; run a full reindex to record embedding metadata."
      );
    }
    return { ok: true };
  }
  if (manifest.embeddingModelId !== resolvedModelId) {
    const logMessage = `Embedding model mismatch: index was built with "${manifest.embeddingModelId}" but settings use "${resolvedModelId}". Reindex or change the setting.`;
    return {
      ok: false,
      logMessage,
      userMessage: `The document index was built with embedding model "${manifest.embeddingModelId}", but the plugin is set to "${resolvedModelId}". Either switch the Embedding Model setting back, or reindex your documents after changing the model.`
    };
  }
  const probe = await embeddingModel.embed(".");
  const dim = coerceEmbeddingVector(probe.embedding).length;
  if (dim !== manifest.dimensions) {
    const logMessage = `Embedding dimension mismatch: manifest has ${manifest.dimensions} but model "${resolvedModelId}" returned ${dim}. Reindex required.`;
    return {
      ok: false,
      logMessage,
      userMessage: `The stored index expects embedding vectors of length ${manifest.dimensions}, but the current model produced length ${dim}. Reindex your documents (or fix the model identifier).`
    };
  }
  return { ok: true };
}
var fs2, path, EMBEDDING_INDEX_MANIFEST_FILENAME, legacyWarnedDirs;
var init_embeddingIndexManifest = __esm({
  "src/utils/embeddingIndexManifest.ts"() {
    "use strict";
    fs2 = __toESM(require("fs/promises"));
    path = __toESM(require("path"));
    init_coerceEmbedding();
    EMBEDDING_INDEX_MANIFEST_FILENAME = ".big-rag-embedding.json";
    legacyWarnedDirs = /* @__PURE__ */ new Set();
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

// src/utils/fileExcludePatterns.ts
function parseExcludePatternsBlock(text) {
  const out = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    out.push(line);
  }
  return out;
}
function matchExcludePattern(relativePosixPath, patterns) {
  for (const p of patterns) {
    if ((0, import_minimatch.minimatch)(relativePosixPath, p, MINIMATCH_OPTS)) {
      return p;
    }
  }
  return null;
}
var import_minimatch, MINIMATCH_OPTS;
var init_fileExcludePatterns = __esm({
  "src/utils/fileExcludePatterns.ts"() {
    "use strict";
    import_minimatch = require("minimatch");
    MINIMATCH_OPTS = {
      dot: true,
      matchBase: true,
      windowsPathsNoEscape: true
    };
  }
});

// src/utils/additionalExtensions.ts
function parseAdditionalExtensionsBlock(text) {
  const tokens = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    for (const part of trimmedLine.split(",")) {
      const token = stripInlineComment(part);
      if (token === "") {
        continue;
      }
      tokens.push(token);
    }
  }
  return tokens;
}
function stripInlineComment(token) {
  const hashIndex = token.indexOf("#");
  if (hashIndex === -1) {
    return token.trim();
  }
  return token.slice(0, hashIndex).trim();
}
function normalizeExtension(raw) {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "") {
    return null;
  }
  if (trimmed.includes("*") || trimmed.includes("?")) {
    return null;
  }
  const normalized = trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
  if (normalized.length < 2 || normalized.includes("/") || normalized.includes("\\")) {
    return null;
  }
  return normalized;
}
function buildEffectiveExtensionSet(additionalPlainTextExtensions) {
  const effective = new Set(SUPPORTED_EXTENSIONS);
  for (const ext of additionalPlainTextExtensions) {
    effective.add(ext.toLowerCase());
  }
  return effective;
}
function isAdditionalPlainTextExtension(ext, additionalPlainTextSet) {
  return additionalPlainTextSet.has(ext.toLowerCase());
}
function resolveAdditionalExtensions(raw, log) {
  const accepted = [];
  const rejected = [];
  const warnings = [];
  const additionalPlainTextSet = /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  for (const token of parseAdditionalExtensionsBlock(raw)) {
    const normalized = normalizeExtension(token);
    if (normalized === null) {
      rejected.push({
        ext: token,
        reason: "Invalid extension format (use values like .java; wildcards are not allowed)"
      });
      continue;
    }
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    if (BLOCKED_BINARY_EXTENSIONS.has(normalized)) {
      rejected.push({
        ext: normalized,
        reason: "Binary or non-plain-text extension is not allowed"
      });
      continue;
    }
    if (SUPPORTED_EXTENSIONS.has(normalized)) {
      if (BUILTIN_NON_PLAINTEXT_EXTENSIONS.has(normalized)) {
        const warning2 = `Extension ${normalized} is already handled by a built-in parser; ignoring additional declaration.`;
        warnings.push(warning2);
        log?.(`[BigRAG] ${warning2}`);
        continue;
      }
      const warning = `Extension ${normalized} is already included in built-in supported types; no need to declare it again.`;
      warnings.push(warning);
      log?.(`[BigRAG] ${warning}`);
      continue;
    }
    accepted.push(normalized);
    additionalPlainTextSet.add(normalized);
  }
  for (const item of rejected) {
    log?.(`[BigRAG] Rejected additional extension ${item.ext}: ${item.reason}`);
  }
  return {
    accepted,
    additionalPlainTextSet,
    rejected,
    warnings
  };
}
var BLOCKED_BINARY_EXTENSIONS, BUILTIN_NON_PLAINTEXT_EXTENSIONS;
var init_additionalExtensions = __esm({
  "src/utils/additionalExtensions.ts"() {
    "use strict";
    init_supportedExtensions();
    BLOCKED_BINARY_EXTENSIONS = new Set(
      [
        ".exe",
        ".dll",
        ".so",
        ".dylib",
        ".zip",
        ".tar",
        ".gz",
        ".tgz",
        ".bz2",
        ".xz",
        ".7z",
        ".rar",
        ".wasm",
        ".bin",
        ".dmg",
        ".iso",
        ".deb",
        ".rpm",
        ".msi",
        ".apk",
        ".ipa",
        ".class",
        ".jar",
        ".war",
        ".ear",
        ".pyc",
        ".pyo",
        ".o",
        ".obj",
        ".a",
        ".lib",
        ".woff",
        ".woff2",
        ".ttf",
        ".otf",
        ".eot",
        ".ico",
        ".webp",
        ".gif",
        ".mp3",
        ".mp4",
        ".avi",
        ".mov",
        ".mkv",
        ".wav",
        ".flac",
        ".sqlite",
        ".db",
        ".doc",
        ".docx",
        ".ppt",
        ".pptx",
        ".xls",
        ".xlsx",
        ".odt",
        ".ods",
        ".odp"
      ].map((ext) => ext.toLowerCase())
    );
    BUILTIN_NON_PLAINTEXT_EXTENSIONS = new Set(
      [".htm", ".html", ".xhtml", ".pdf", ".epub", ".bmp", ".jpg", ".jpeg", ".png", ".rar"].map(
        (ext) => ext.toLowerCase()
      )
    );
  }
});

// src/ingestion/fileScanner.ts
function normalizeRootDir(rootDir) {
  return path2.resolve(rootDir.trim()).replace(/[/\\]+$/, "");
}
function toPosixRelativePath(root, fullPath) {
  return path2.relative(root, fullPath).split(path2.sep).join("/");
}
async function scanDirectory(rootDir, onProgress, options) {
  const root = normalizeRootDir(rootDir);
  const excludePatterns = options?.excludePatterns ?? [];
  const additionalPlainTextExtensions = options?.additionalPlainTextExtensions ?? /* @__PURE__ */ new Set();
  const onExcludedFile = options?.onExcludedFile;
  const effectiveExtensions = buildEffectiveExtensionSet(additionalPlainTextExtensions);
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
  console.log(`[Scanner] Built-in extensions: ${supportedExtensionsDescription}`);
  if (additionalPlainTextExtensions.size > 0) {
    const additionalList = Array.from(additionalPlainTextExtensions.values()).sort().join(", ");
    console.log(`[Scanner] Additional plain-text extensions: ${additionalList}`);
  }
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
          if (effectiveExtensions.has(ext)) {
            const relativePosix = toPosixRelativePath(root, fullPath);
            const matchedPattern = excludePatterns.length > 0 ? matchExcludePattern(relativePosix, excludePatterns) : null;
            if (matchedPattern !== null) {
              onExcludedFile?.({ relativePath: relativePosix, pattern: matchedPattern });
            } else {
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
    init_fileExcludePatterns();
    init_additionalExtensions();
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
        await new Promise((resolve6) => setTimeout(resolve6, 1e3 * attempt));
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
  return new Promise((resolve6, reject) => {
    try {
      const epub = new import_epub2.EPub(filePath);
      epub.on("error", (error) => {
        console.error(`Error parsing EPUB file ${filePath}:`, error);
        resolve6("");
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
          resolve6(
            fullText.replace(/\s+/g, " ").replace(/\n+/g, "\n").trim()
          );
        } catch (error) {
          console.error(`Error processing EPUB chapters:`, error);
          resolve6("");
        }
      });
      epub.parse();
    } catch (error) {
      console.error(`Error initializing EPUB parser for ${filePath}:`, error);
      resolve6("");
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
async function parseDocument(filePath, enableOCR = false, client2, additionalPlainTextExtensions = /* @__PURE__ */ new Set()) {
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
    if (isAdditionalPlainTextExtension(ext, additionalPlainTextExtensions)) {
      try {
        const text = await parseText(filePath, {
          stripMarkdown: false,
          preserveLineBreaks: true
        });
        const cleaned = cleanAndValidate(text, "text.empty", fileName);
        return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
      } catch (error) {
        console.error(`[Parser][AdditionalPlainText] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "text.error",
          details: error instanceof Error ? error.message : String(error)
        };
      }
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
    init_additionalExtensions();
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
  return new Promise((resolve6, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs7.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve6(hash.digest("hex")));
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
var import_p_queue, fs9, path5, EXCLUDE_PROGRESS_THROTTLE, IndexManager;
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
    init_coerceEmbedding();
    EXCLUDE_PROGRESS_THROTTLE = 40;
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
        const { documentsDir, vectorStore, onProgress } = this.options;
        try {
          const fileInventory = await vectorStore.getFileHashInventory();
          if (onProgress) {
            onProgress({
              totalFiles: 0,
              processedFiles: 0,
              currentFile: "",
              status: "scanning"
            });
          }
          const excludePatterns = this.options.excludePatterns ?? [];
          let excludedByPattern = 0;
          let lastExcludeProgressEmittedAt = 0;
          let lastExcludedRelative = "";
          const onExcludedFile = excludePatterns.length > 0 ? (info) => {
            excludedByPattern++;
            lastExcludedRelative = info.relativePath;
            console.log(
              `Excluded from indexing (exclude pattern): ${info.relativePath} (matched: ${info.pattern})`
            );
            if (!onProgress) {
              return;
            }
            if (excludedByPattern === 1 || excludedByPattern - lastExcludeProgressEmittedAt >= EXCLUDE_PROGRESS_THROTTLE) {
              lastExcludeProgressEmittedAt = excludedByPattern;
              onProgress({
                totalFiles: 0,
                processedFiles: 0,
                currentFile: `Excluded ${excludedByPattern} by pattern (latest: ${lastExcludedRelative})`,
                status: "scanning"
              });
            }
          } : void 0;
          const files = await scanDirectory(
            documentsDir,
            (scanned, found) => {
              if (onProgress) {
                onProgress({
                  totalFiles: found,
                  processedFiles: 0,
                  currentFile: `Scanned ${scanned} files...`,
                  status: "scanning"
                });
              }
            },
            {
              excludePatterns,
              additionalPlainTextExtensions: this.options.additionalPlainTextExtensions,
              onExcludedFile
            }
          );
          if (onProgress && excludedByPattern > 0 && excludedByPattern !== lastExcludeProgressEmittedAt) {
            onProgress({
              totalFiles: 0,
              processedFiles: 0,
              currentFile: `Excluded ${excludedByPattern} by pattern (latest: ${lastExcludedRelative})`,
              status: "scanning"
            });
          }
          this.options.abortSignal?.throwIfAborted();
          console.log(
            `Found ${files.length} files to process` + (excludedByPattern > 0 ? ` (${excludedByPattern} excluded by exclude patterns)` : "")
          );
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
            `Indexing complete: ${successCount}/${files.length} files successfully indexed (${failCount} failed, skipped=${skippedCount}, updated=${updatedCount}, new=${newCount})` + (excludedByPattern > 0 ? `; excluded by pattern=${excludedByPattern}` : "")
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
        const { vectorStore, embeddingModel, client: client2, chunkSize, chunkOverlap, enableOCR, autoReindex } = this.options;
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
            await new Promise((resolve6) => setTimeout(resolve6, this.options.parseDelayMs));
          }
          const parsedResult = await parseDocument(
            file.path,
            enableOCR,
            client2,
            this.options.additionalPlainTextExtensions ?? /* @__PURE__ */ new Set()
          );
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
            await vectorStore.deleteByFilePath(file.path);
            fileInventory.set(file.path, /* @__PURE__ */ new Set());
            await vectorStore.addChunks(documentChunks);
            console.log(`Indexed ${documentChunks.length} chunks from ${file.name}`);
            fileInventory.set(file.path, /* @__PURE__ */ new Set([fileHash]));
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
        const { vectorStore } = this.options;
        try {
          await vectorStore.deleteByFilePath(filePath);
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

// src/vectorstore/vectorStore.ts
var fs10, path6, import_vectra, MAX_ITEMS_PER_SHARD, SHARD_DIR_PREFIX, SHARD_DIR_REGEX, VectorStore;
var init_vectorStore = __esm({
  "src/vectorstore/vectorStore.ts"() {
    "use strict";
    fs10 = __toESM(require("fs/promises"));
    path6 = __toESM(require("path"));
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
        this.dbPath = path6.resolve(dbPath);
      }
      /**
       * Open a shard by directory name (e.g. "shard_000"). Caller must not hold the reference
       * after use so GC can free the parsed index data.
       */
      openShard(dir) {
        const fullPath = path6.join(this.dbPath, dir);
        return new import_vectra.LocalIndex(fullPath);
      }
      /**
       * Scan dbPath for shard_NNN directories and return sorted list.
       */
      async discoverShardDirs() {
        const entries = await fs10.readdir(this.dbPath, { withFileTypes: true });
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
        await fs10.mkdir(this.dbPath, { recursive: true });
        this.shardDirs = await this.discoverShardDirs();
        if (this.shardDirs.length === 0) {
          const firstDir = `${SHARD_DIR_PREFIX}000`;
          const fullPath = path6.join(this.dbPath, firstDir);
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
          this.activeShardCount = (await this.activeShard.listItems()).length;
          console.log(`Added ${chunks.length} chunks to vector store`);
          if (this.activeShardCount >= MAX_ITEMS_PER_SHARD) {
            const nextNum = this.shardDirs.length;
            const nextDir = `${SHARD_DIR_PREFIX}${String(nextNum).padStart(3, "0")}`;
            const fullPath = path6.join(this.dbPath, nextDir);
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
        return this.deleteChunksMatching(
          (metadata) => metadata.fileHash === fileHash,
          `file hash: ${fileHash}`
        );
      }
      /**
       * Delete all chunks for a source path across all shards (all prior hashes).
       */
      async deleteByFilePath(filePath) {
        const resolvedPath = path6.resolve(filePath);
        return this.deleteChunksMatching((metadata) => {
          const itemPath = metadata.filePath ?? "";
          if (itemPath === filePath || itemPath === resolvedPath) {
            return true;
          }
          try {
            return path6.resolve(itemPath) === resolvedPath;
          } catch {
            return false;
          }
        }, `file path: ${filePath}`);
      }
      async deleteChunksMatching(predicate, logLabel) {
        const lastDir = this.shardDirs[this.shardDirs.length - 1];
        this.updateMutex = this.updateMutex.then(async () => {
          for (const dir of this.shardDirs) {
            const shard = this.openShard(dir);
            const items = await shard.listItems();
            const toDelete = items.filter((item) => {
              const metadata = item.metadata;
              return metadata !== void 0 && predicate(metadata);
            });
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
          console.log(`Deleted chunks for ${logLabel}`);
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

// src/ingestion/runIndexing.ts
async function runIndexingJob({
  client: client2,
  abortSignal,
  documentsDir,
  vectorStoreDir,
  embeddingModelId,
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  autoReindex,
  parseDelayMs,
  excludePatterns = [],
  additionalPlainTextExtensions = /* @__PURE__ */ new Set(),
  forceReindex = false,
  vectorStore: existingVectorStore,
  onProgress
}) {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === void 0;
  if (ownsVectorStore) {
    await vectorStore.initialize();
  }
  const resolvedModelId = resolveEmbeddingModelId(embeddingModelId);
  const embeddingModel = await client2.embedding.model(resolvedModelId, { signal: abortSignal });
  const indexManager = new IndexManager({
    documentsDir,
    vectorStore,
    vectorStoreDir,
    embeddingModel,
    client: client2,
    chunkSize,
    chunkOverlap,
    maxConcurrent,
    enableOCR,
    autoReindex: forceReindex ? false : autoReindex,
    parseDelayMs,
    excludePatterns,
    additionalPlainTextExtensions,
    abortSignal,
    onProgress
  });
  const indexingResult = await indexManager.index();
  const stats = await vectorStore.getStats();
  await syncEmbeddingManifestAfterIndexing(
    vectorStoreDir,
    stats.totalChunks,
    resolvedModelId,
    embeddingModel
  );
  if (ownsVectorStore) {
    await vectorStore.close();
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
    init_config();
    init_embeddingIndexManifest();
  }
});

// src/utils/effectivePluginConfig.ts
function pickNonEmptyString(primary, fallback) {
  const trimmedPrimary = (primary ?? "").trim();
  if (trimmedPrimary !== "") {
    return trimmedPrimary;
  }
  return (fallback ?? "").trim();
}
function chatPathsConfigured(chatConfig) {
  return pickNonEmptyString(chatConfig.get("documentsDirectory"), "") !== "" && pickNonEmptyString(chatConfig.get("vectorStoreDirectory"), "") !== "";
}
function mergeEmbeddingModelPreference(chatEmbedding, syncedEmbedding) {
  const chatResolved = resolveEmbeddingModelId(chatEmbedding);
  const syncedTrimmed = (syncedEmbedding ?? "").trim();
  if (syncedTrimmed !== "" && resolveEmbeddingModelId(syncedTrimmed) !== DEFAULT_EMBEDDING_MODEL_ID && chatResolved === DEFAULT_EMBEDDING_MODEL_ID) {
    return resolveEmbeddingModelId(syncedTrimmed);
  }
  return chatResolved;
}
function pickFirstNonEmptyString(...values) {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed !== "") {
      return trimmed;
    }
  }
  return "";
}
function pickNumericSetting(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return DEFAULT_RETRIEVAL_LIMIT;
}
function pickThresholdSetting(...values) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD;
}
function resolveBigRagToolsConfigPath() {
  return (0, import_node_path.join)((0, import_node_os.homedir)(), ".lmstudio", BIG_RAG_TOOLS_CONFIG_FILENAME);
}
function extractToolsSettingsFromChatConfig(chatConfig) {
  return {
    documentsDirectory: pickNonEmptyString(chatConfig.get("documentsDirectory"), ""),
    vectorStoreDirectory: pickNonEmptyString(chatConfig.get("vectorStoreDirectory"), ""),
    embeddingModel: resolveEmbeddingModelId(chatConfig.get("embeddingModel")),
    retrievalLimit: chatConfig.get("retrievalLimit"),
    retrievalAffinityThreshold: chatConfig.get("retrievalAffinityThreshold")
  };
}
function toolsSettingsEqual(left, right) {
  return left.documentsDirectory === right.documentsDirectory && left.vectorStoreDirectory === right.vectorStoreDirectory && left.embeddingModel === right.embeddingModel && left.retrievalLimit === right.retrievalLimit && left.retrievalAffinityThreshold === right.retrievalAffinityThreshold;
}
function readSyncedToolsSettingsFile(configPath) {
  const resolvedPath = configPath ?? resolveBigRagToolsConfigPath();
  try {
    const rawContents = (0, import_node_fs.readFileSync)(resolvedPath, "utf8");
    const parsed = JSON.parse(rawContents);
    return {
      documentsDirectory: typeof parsed.documentsDirectory === "string" ? parsed.documentsDirectory.trim() : "",
      vectorStoreDirectory: typeof parsed.vectorStoreDirectory === "string" ? parsed.vectorStoreDirectory.trim() : "",
      embeddingModel: resolveEmbeddingModelId(parsed.embeddingModel),
      retrievalLimit: pickNumericSetting(parsed.retrievalLimit),
      retrievalAffinityThreshold: pickThresholdSetting(parsed.retrievalAffinityThreshold)
    };
  } catch {
    return null;
  }
}
function readToolsEnvLayer(environment = process.env) {
  const retrievalLimitRaw = environment.BIG_RAG_RETRIEVAL_LIMIT?.trim();
  const retrievalThresholdRaw = environment.BIG_RAG_RETRIEVAL_AFFINITY_THRESHOLD?.trim();
  return {
    documentsDirectory: (environment.BIG_RAG_DOCS_DIR ?? "").trim() || void 0,
    vectorStoreDirectory: (environment.BIG_RAG_DB_DIR ?? "").trim() || void 0,
    embeddingModel: (environment.BIG_RAG_EMBEDDING_MODEL ?? "").trim() || void 0,
    retrievalLimit: retrievalLimitRaw !== void 0 && retrievalLimitRaw !== "" ? Number(retrievalLimitRaw) : void 0,
    retrievalAffinityThreshold: retrievalThresholdRaw !== void 0 && retrievalThresholdRaw !== "" ? Number(retrievalThresholdRaw) : void 0
  };
}
function writeSyncedToolsSettingsIfChanged(settings) {
  const configPath = resolveBigRagToolsConfigPath();
  const existingSettings = readSyncedToolsSettingsFile(configPath);
  if (existingSettings !== null && toolsSettingsEqual(settings, existingSettings)) {
    return;
  }
  (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(configPath), { recursive: true });
  (0, import_node_fs.writeFileSync)(configPath, `${JSON.stringify(settings, null, 2)}
`, "utf8");
}
function syncChatToolsSettingsForRest(chatConfig) {
  const chatReader = {
    get: (key) => chatConfig.get(key)
  };
  if (!chatPathsConfigured(chatReader)) {
    return;
  }
  const mergedSettings = mergeChatWithSyncedFallback(
    extractToolsSettingsFromChatConfig(chatConfig),
    readSyncedToolsSettingsFile()
  );
  writeSyncedToolsSettingsIfChanged(mergedSettings);
}
function mergeToolsPluginSettingsWithFallbacks(baseSettings, ...fallbackLayers) {
  return {
    documentsDirectory: pickFirstNonEmptyString(
      baseSettings.documentsDirectory,
      ...fallbackLayers.map((layer) => layer.documentsDirectory)
    ),
    vectorStoreDirectory: pickFirstNonEmptyString(
      baseSettings.vectorStoreDirectory,
      ...fallbackLayers.map((layer) => layer.vectorStoreDirectory)
    ),
    embeddingModel: pickFirstNonEmptyString(
      baseSettings.embeddingModel,
      ...fallbackLayers.map((layer) => layer.embeddingModel)
    ),
    retrievalLimit: pickNumericSetting(
      baseSettings.retrievalLimit,
      ...fallbackLayers.map((layer) => layer.retrievalLimit)
    ),
    retrievalAffinityThreshold: pickThresholdSetting(
      baseSettings.retrievalAffinityThreshold,
      ...fallbackLayers.map((layer) => layer.retrievalAffinityThreshold)
    )
  };
}
function mergeChatWithSyncedFallback(chatSettings, syncedSettings) {
  const syncedLayer = syncedSettings ?? {};
  return {
    documentsDirectory: pickFirstNonEmptyString(
      chatSettings.documentsDirectory,
      syncedLayer.documentsDirectory
    ),
    vectorStoreDirectory: pickFirstNonEmptyString(
      chatSettings.vectorStoreDirectory,
      syncedLayer.vectorStoreDirectory
    ),
    embeddingModel: mergeEmbeddingModelPreference(
      chatSettings.embeddingModel,
      syncedLayer.embeddingModel
    ),
    retrievalLimit: pickNumericSetting(
      chatSettings.retrievalLimit,
      syncedLayer.retrievalLimit
    ),
    retrievalAffinityThreshold: pickThresholdSetting(
      chatSettings.retrievalAffinityThreshold,
      syncedLayer.retrievalAffinityThreshold
    )
  };
}
function readToolsPluginSettings(ctl) {
  const chatConfig = ctl.getPluginConfig(configSchematics);
  const chatSettings = extractToolsSettingsFromChatConfig(chatConfig);
  const chatReader = {
    get: (key) => chatSettings[key]
  };
  if (chatPathsConfigured(chatReader)) {
    const mergedChatSettings = mergeChatWithSyncedFallback(
      chatSettings,
      readSyncedToolsSettingsFile()
    );
    writeSyncedToolsSettingsIfChanged(mergedChatSettings);
    return mergedChatSettings;
  }
  const syncedSettings = readSyncedToolsSettingsFile();
  const baseSettings = syncedSettings ?? EMPTY_TOOLS_SETTINGS;
  return mergeToolsPluginSettingsWithFallbacks(
    baseSettings,
    readToolsEnvLayer()
  );
}
var import_node_fs, import_node_os, import_node_path, BIG_RAG_TOOLS_CONFIG_FILENAME, DEFAULT_RETRIEVAL_LIMIT, DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD, EMPTY_TOOLS_SETTINGS;
var init_effectivePluginConfig = __esm({
  "src/utils/effectivePluginConfig.ts"() {
    "use strict";
    import_node_fs = require("node:fs");
    import_node_os = require("node:os");
    import_node_path = require("node:path");
    init_config();
    BIG_RAG_TOOLS_CONFIG_FILENAME = "big-rag-tools-config.json";
    DEFAULT_RETRIEVAL_LIMIT = 5;
    DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD = 0.5;
    EMPTY_TOOLS_SETTINGS = {
      documentsDirectory: "",
      vectorStoreDirectory: "",
      embeddingModel: DEFAULT_EMBEDDING_MODEL_ID,
      retrievalLimit: DEFAULT_RETRIEVAL_LIMIT,
      retrievalAffinityThreshold: DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD
    };
  }
});

// src/rag/retrieval.ts
function throwIfAborted(abortSignal) {
  if (abortSignal?.aborted) {
    throw abortSignal.reason ?? new DOMException("Aborted", "AbortError");
  }
}
function getCachedVectorStore() {
  return cachedVectorStore;
}
async function ensureVectorStore(vectorStoreDir) {
  const resolvedDir = path7.resolve(vectorStoreDir);
  let openedStore = null;
  const openWork = vectorStoreOpenMutex.catch(() => void 0).then(async () => {
    if (cachedVectorStore && lastVectorStoreDir === resolvedDir) {
      openedStore = cachedVectorStore;
      return;
    }
    if (cachedVectorStore !== null && lastVectorStoreDir !== resolvedDir) {
      await cachedVectorStore.close();
    }
    cachedVectorStore = new VectorStore(resolvedDir);
    await cachedVectorStore.initialize();
    const statsAfterInit = await cachedVectorStore.getStats();
    if (statsAfterInit.totalChunks === 0) {
      await deleteEmbeddingIndexManifest(resolvedDir);
    }
    console.info(`[BigRAG] Vector store ready (path=${resolvedDir}). Waiting for queries...`);
    lastVectorStoreDir = resolvedDir;
    openedStore = cachedVectorStore;
  });
  vectorStoreOpenMutex = openWork.then(
    () => void 0,
    () => void 0
  );
  await openWork;
  if (openedStore === null) {
    throw new Error(`Failed to open vector store at ${resolvedDir}`);
  }
  return openedStore;
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
function formatRagContext(passages) {
  let ragContextFull = "";
  let ragContextPreview = "";
  const prefix = "The following passages were found in your indexed documents:\n\n";
  ragContextFull += prefix;
  ragContextPreview += prefix;
  let citationNumber = 1;
  for (const passage of passages) {
    const fileName = path7.basename(passage.filePath);
    const citationLabel = `Citation ${citationNumber} (from ${fileName}, score: ${passage.score.toFixed(3)}): `;
    ragContextFull += `
${citationLabel}"${passage.text}"

`;
    ragContextPreview += `
${citationLabel}"${summarizeText(passage.text)}"

`;
    citationNumber++;
  }
  return {
    full: ragContextFull.trimEnd(),
    preview: ragContextPreview.trimEnd()
  };
}
function mapSearchResults(results) {
  return results.map((result) => ({
    text: result.text,
    score: result.score,
    filePath: result.filePath,
    fileName: result.fileName,
    chunkIndex: result.chunkIndex,
    shardName: result.shardName,
    metadata: result.metadata
  }));
}
async function retrievePassages(params) {
  const {
    client: client2,
    vectorStoreDir,
    embeddingModelId,
    query,
    retrievalLimit,
    retrievalThreshold,
    abortSignal
  } = params;
  const resolvedModelId = resolveEmbeddingModelId(embeddingModelId);
  const resolvedStoreDir = path7.resolve(vectorStoreDir);
  throwIfAborted(abortSignal);
  const store = await ensureVectorStore(resolvedStoreDir);
  const stats = await store.getStats();
  if (stats.totalChunks === 0) {
    await deleteEmbeddingIndexManifest(resolvedStoreDir);
    return {
      ok: false,
      reason: "empty-index",
      message: "The document index is empty (no chunks stored yet)."
    };
  }
  const embeddingModel = await client2.embedding.model(resolvedModelId, {
    signal: abortSignal
  });
  throwIfAborted(abortSignal);
  const compatibility = await checkEmbeddingModelForRetrieval({
    vectorStoreDir: resolvedStoreDir,
    resolvedModelId,
    totalChunks: stats.totalChunks,
    embeddingModel
  });
  if (!compatibility.ok) {
    return {
      ok: false,
      reason: "embedding-mismatch",
      message: compatibility.userMessage,
      logMessage: compatibility.logMessage
    };
  }
  const queryPreview = query.length > 160 ? `${query.slice(0, 160)}...` : query;
  console.info(
    `[BigRAG] Executing vector search for "${queryPreview}" (limit=${retrievalLimit}, threshold=${retrievalThreshold})`
  );
  const queryEmbeddingResult = await embeddingModel.embed(query);
  throwIfAborted(abortSignal);
  const results = await store.search(
    queryEmbeddingResult.embedding,
    retrievalLimit,
    retrievalThreshold
  );
  if (results.length > 0) {
    const topHit = results[0];
    console.info(
      `[BigRAG] Vector search returned ${results.length} results. Top hit: file=${topHit.fileName} score=${topHit.score.toFixed(3)}`
    );
  } else {
    console.warn("[BigRAG] Vector search returned 0 results.");
  }
  return { ok: true, passages: mapSearchResults(results) };
}
async function getIndexStatus(params) {
  const { documentsDirectory, vectorStoreDirectory, embeddingModelId } = params;
  if (!vectorStoreDirectory.trim()) {
    return { error: "Vector store directory is not configured." };
  }
  const store = await ensureVectorStore(vectorStoreDirectory);
  const stats = await store.getStats();
  return {
    documentsDirectory,
    vectorStoreDirectory,
    embeddingModelId: resolveEmbeddingModelId(embeddingModelId),
    totalChunks: stats.totalChunks,
    uniqueFiles: stats.uniqueFiles
  };
}
var path7, cachedVectorStore, lastVectorStoreDir, vectorStoreOpenMutex;
var init_retrieval = __esm({
  "src/rag/retrieval.ts"() {
    "use strict";
    path7 = __toESM(require("path"));
    init_config();
    init_vectorStore();
    init_embeddingIndexManifest();
    cachedVectorStore = null;
    lastVectorStoreDir = "";
    vectorStoreOpenMutex = Promise.resolve();
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
  syncChatToolsSettingsForRest(pluginConfig);
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
  const resolvedEmbeddingModelId = resolveEmbeddingModelId(pluginConfig.get("embeddingModel"));
  const excludePatterns = parseExcludePatternsBlock(pluginConfig.get("excludeFilenamePatterns") ?? "");
  const { additionalPlainTextSet: additionalPlainTextExtensions } = resolveAdditionalExtensions(
    pluginConfig.get("additionalExtensions") ?? "",
    (message) => console.warn(message)
  );
  if (!documentsDir || documentsDir === "") {
    console.warn("[BigRAG] Documents directory not configured. Please set it in plugin settings.");
    return userMessage;
  }
  if (!vectorStoreDir || vectorStoreDir === "") {
    console.warn("[BigRAG] Vector store directory not configured. Please set it in plugin settings.");
    return userMessage;
  }
  try {
    const resolvedDocumentsDir = path8.resolve(documentsDir);
    const resolvedVectorStoreDir = path8.resolve(vectorStoreDir);
    const pathsChangedForSanity = resolvedDocumentsDir !== lastSanityCheckedDocumentsDir || resolvedVectorStoreDir !== lastSanityCheckedVectorStoreDir;
    if (!sanityChecksPassed || pathsChangedForSanity) {
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
      lastSanityCheckedDocumentsDir = resolvedDocumentsDir;
      lastSanityCheckedVectorStoreDir = resolvedVectorStoreDir;
    }
    checkAbort(ctl.abortSignal);
    {
      const status = ctl.createStatus({
        status: "loading",
        text: "Initializing vector store..."
      });
      await ensureVectorStore(vectorStoreDir);
      status.setState({
        status: "done",
        text: "Vector store initialized"
      });
    }
    const vectorStore = getCachedVectorStore();
    if (!vectorStore) {
      console.error("[BigRAG] Vector store failed to initialize.");
      return userMessage;
    }
    checkAbort(ctl.abortSignal);
    await maybeHandleConfigTriggeredReindex({
      ctl,
      documentsDir,
      vectorStoreDir,
      embeddingModelId: resolvedEmbeddingModelId,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      parseDelayMs,
      reindexRequested,
      excludePatterns,
      additionalPlainTextExtensions,
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
          text: `Starting initial indexing\u2026 (embedding model: ${resolvedEmbeddingModelId})`
        });
        try {
          const { indexingResult } = await runIndexingJob({
            client: ctl.client,
            abortSignal: ctl.abortSignal,
            documentsDir,
            vectorStoreDir,
            embeddingModelId: resolvedEmbeddingModelId,
            chunkSize,
            chunkOverlap,
            maxConcurrent,
            enableOCR,
            autoReindex: false,
            parseDelayMs,
            excludePatterns,
            additionalPlainTextExtensions,
            vectorStore,
            forceReindex: true,
            onProgress: (progress) => {
              if (progress.status === "scanning") {
                indexStatus.setState({
                  status: "loading",
                  text: `Scanning: ${progress.currentFile} (embedding model: ${resolvedEmbeddingModelId})`
                });
              } else if (progress.status === "indexing") {
                const success = progress.successfulFiles ?? 0;
                const failed = progress.failedFiles ?? 0;
                const skipped = progress.skippedFiles ?? 0;
                indexStatus.setState({
                  status: "loading",
                  text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (success=${success}, failed=${failed}, skipped=${skipped}) (embedding model: ${resolvedEmbeddingModelId}) (${progress.currentFile})`
                });
              } else if (progress.status === "complete") {
                indexStatus.setState({
                  status: "done",
                  text: `Indexing complete: ${progress.processedFiles} files processed (embedding model: ${resolvedEmbeddingModelId})`
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
    const toggleStatusText = `Manual Reindex Trigger: ${reindexRequested ? "ON" : "OFF"} | Skip Previously Indexed: ${skipPreviouslyIndexed ? "ON" : "OFF"} | Embedding model: ${resolvedEmbeddingModelId}`;
    console.info(`[BigRAG] ${toggleStatusText}`);
    ctl.createStatus({
      status: "done",
      text: toggleStatusText
    });
    const retrievalStats = await vectorStore.getStats();
    if (retrievalStats.totalChunks === 0) {
      await deleteEmbeddingIndexManifest(vectorStoreDir);
      ctl.createStatus({
        status: "canceled",
        text: "No documents indexed yet"
      });
      const noteAboutEmptyIndex = `Important: The document index is empty (no chunks stored yet). In one short sentence, tell the user that nothing has been indexed. Then answer their question to the best of your ability without claiming document retrieval.`;
      return noteAboutEmptyIndex + `

User Query:

${userPrompt}`;
    }
    const retrievalStatus = ctl.createStatus({
      status: "loading",
      text: "Searching for relevant content..."
    });
    const retrievalResult = await retrievePassages({
      client: ctl.client,
      vectorStoreDir,
      embeddingModelId: resolvedEmbeddingModelId,
      query: userPrompt,
      retrievalLimit,
      retrievalThreshold,
      abortSignal: ctl.abortSignal
    });
    checkAbort(ctl.abortSignal);
    if (!retrievalResult.ok) {
      retrievalStatus.setState({
        status: retrievalResult.reason === "embedding-mismatch" ? "error" : "canceled",
        text: retrievalResult.message
      });
      if (retrievalResult.logMessage) {
        console.error("[BigRAG]", retrievalResult.logMessage);
      }
      if (retrievalResult.reason === "embedding-mismatch") {
        return retrievalResult.message + `

User Query:

${userPrompt}`;
      }
      const noteAboutEmptyIndex = `Important: The document index is empty (no chunks stored yet). In one short sentence, tell the user that nothing has been indexed. Then answer their question to the best of your ability without claiming document retrieval.`;
      return noteAboutEmptyIndex + `

User Query:

${userPrompt}`;
    }
    const results = retrievalResult.passages;
    if (results.length > 0) {
      const docSummaries = results.map(
        (result, idx) => `#${idx + 1} file=${path8.basename(result.filePath)} shard=${result.shardName} score=${result.score.toFixed(3)}`
      ).join("\n");
      console.info(`[BigRAG] Relevant documents:
${docSummaries}`);
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
    const { full: ragContextFull, preview: ragContextPreview } = formatRagContext(results);
    const promptTemplate = normalizePromptTemplate(pluginConfig.get("promptTemplate"));
    const finalPrompt = fillPromptTemplate(promptTemplate, {
      [RAG_CONTEXT_MACRO]: ragContextFull,
      [USER_QUERY_MACRO]: userPrompt
    });
    const finalPromptPreview = fillPromptTemplate(promptTemplate, {
      [RAG_CONTEXT_MACRO]: ragContextPreview,
      [USER_QUERY_MACRO]: userPrompt
    });
    ctl.debug("Processed content (preview):", finalPromptPreview);
    const passagesLogEntries = results.map((result, idx) => {
      const fileName = path8.basename(result.filePath);
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
  embeddingModelId,
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  parseDelayMs,
  reindexRequested,
  excludePatterns,
  additionalPlainTextExtensions,
  skipPreviouslyIndexed
}) {
  if (!reindexRequested) {
    return;
  }
  const reminderText = `Manual Reindex Trigger is ON. Skip Previously Indexed Files is currently ${skipPreviouslyIndexed ? "ON" : "OFF"}. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files. Embedding model for this run: ${embeddingModelId}.`;
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
    text: `Manual reindex requested from config\u2026 (embedding model: ${embeddingModelId})`
  });
  try {
    const { indexingResult } = await runIndexingJob({
      client: ctl.client,
      abortSignal: ctl.abortSignal,
      documentsDir,
      vectorStoreDir,
      embeddingModelId,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      autoReindex: skipPreviouslyIndexed,
      parseDelayMs,
      excludePatterns,
      additionalPlainTextExtensions,
      forceReindex: !skipPreviouslyIndexed,
      vectorStore: getCachedVectorStore() ?? void 0,
      onProgress: (progress) => {
        if (progress.status === "scanning") {
          status.setState({
            status: "loading",
            text: `Scanning: ${progress.currentFile} (embedding model: ${embeddingModelId})`
          });
        } else if (progress.status === "indexing") {
          const success = progress.successfulFiles ?? 0;
          const failed = progress.failedFiles ?? 0;
          const skipped = progress.skippedFiles ?? 0;
          status.setState({
            status: "loading",
            text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files (success=${success}, failed=${failed}, skipped=${skipped}) (embedding model: ${embeddingModelId}) (${progress.currentFile})`
          });
        } else if (progress.status === "complete") {
          status.setState({
            status: "done",
            text: `Indexing complete: ${progress.processedFiles} files processed (embedding model: ${embeddingModelId})`
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
      text: `Manual reindex complete! (embedding model: ${embeddingModelId})`
    });
    const summaryLines = [
      `Embedding model: ${embeddingModelId}`,
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
    await notifyManualResetNeeded(ctl, embeddingModelId);
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
async function notifyManualResetNeeded(ctl, embeddingModelId) {
  try {
    await ctl.client.system.notify({
      title: "Manual reindex completed",
      description: `Manual Reindex Trigger is ON. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files. Last run used embedding model: ${embeddingModelId}.`
    });
  } catch (error) {
    console.warn("[BigRAG] Unable to send notification about manual reindex reset:", error);
  }
}
var path8, sanityChecksPassed, lastSanityCheckedDocumentsDir, lastSanityCheckedVectorStoreDir, RAG_CONTEXT_MACRO, USER_QUERY_MACRO;
var init_promptPreprocessor = __esm({
  "src/promptPreprocessor.ts"() {
    "use strict";
    init_config();
    init_sanityChecks();
    init_indexingLock();
    init_embeddingIndexManifest();
    path8 = __toESM(require("path"));
    init_runIndexing();
    init_fileExcludePatterns();
    init_additionalExtensions();
    init_effectivePluginConfig();
    init_retrieval();
    sanityChecksPassed = false;
    lastSanityCheckedDocumentsDir = "";
    lastSanityCheckedVectorStoreDir = "";
    RAG_CONTEXT_MACRO = "{{rag_context}}";
    USER_QUERY_MACRO = "{{user_query}}";
  }
});

// src/toolsProvider.ts
async function provideTools(ctl) {
  const searchTool = (0, import_sdk2.tool)({
    name: "big_rag_search",
    description: "Search the Big RAG indexed document collection for passages relevant to a query. Returns matching text snippets with file names and similarity scores.",
    parameters: {
      query: import_zod.z.string().describe("Natural-language search query"),
      limit: import_zod.z.number().int().min(1).max(20).optional().describe("Maximum passages to return (defaults to plugin Retrieval Limit setting)")
    },
    implementation: async ({ query, limit }, { signal, status }) => {
      status("Searching indexed documents\u2026");
      const pluginSettings = readToolsPluginSettings(ctl);
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        return "Error: Search query must not be empty.";
      }
      const vectorStoreDir = pluginSettings.vectorStoreDirectory;
      if (!vectorStoreDir.trim()) {
        return "Error: Vector store directory is not configured. Set paths in the chat Integrations sidebar. REST reuses them via auto-sync to ~/.lmstudio/big-rag-tools-config.json, or set BIG_RAG_DOCS_DIR / BIG_RAG_DB_DIR env vars on the LM Studio process.";
      }
      const retrievalLimit = limit ?? pluginSettings.retrievalLimit;
      const retrievalThreshold = pluginSettings.retrievalAffinityThreshold;
      const embeddingModelId = resolveEmbeddingModelId(pluginSettings.embeddingModel);
      const result = await retrievePassages({
        client: ctl.client,
        vectorStoreDir,
        embeddingModelId,
        query: trimmedQuery,
        retrievalLimit,
        retrievalThreshold,
        abortSignal: signal
      });
      if (!result.ok) {
        if (result.logMessage) {
          console.error("[BigRAG]", result.logMessage);
        }
        return `Error: ${result.message}`;
      }
      if (result.passages.length === 0) {
        return {
          query: trimmedQuery,
          passageCount: 0,
          passages: [],
          message: "No relevant content found in indexed documents for this query."
        };
      }
      return {
        query: trimmedQuery,
        passageCount: result.passages.length,
        passages: result.passages.map((passage, index) => ({
          rank: index + 1,
          fileName: passage.fileName,
          filePath: passage.filePath,
          score: passage.score,
          shardName: passage.shardName,
          text: passage.text
        }))
      };
    }
  });
  const statusTool = (0, import_sdk2.tool)({
    name: "big_rag_index_status",
    description: "Return Big RAG index statistics: chunk count, unique file count, and configured directories.",
    parameters: {},
    implementation: async (_params, { status }) => {
      status("Reading index status\u2026");
      const pluginSettings = readToolsPluginSettings(ctl);
      const documentsDir = pluginSettings.documentsDirectory;
      const vectorStoreDir = pluginSettings.vectorStoreDirectory;
      const embeddingModelId = resolveEmbeddingModelId(pluginSettings.embeddingModel);
      const indexStatus = await getIndexStatus({
        documentsDirectory: documentsDir,
        vectorStoreDirectory: vectorStoreDir,
        embeddingModelId
      });
      if ("error" in indexStatus) {
        return `Error: ${indexStatus.error} Set paths in chat Integrations sidebar (syncs for REST on first message), or BIG_RAG_DOCS_DIR / BIG_RAG_DB_DIR env vars.`;
      }
      return indexStatus;
    }
  });
  return [searchTool, statusTool];
}
var import_sdk2, import_zod;
var init_toolsProvider = __esm({
  "src/toolsProvider.ts"() {
    "use strict";
    import_sdk2 = require("@lmstudio/sdk");
    import_zod = require("zod");
    init_config();
    init_retrieval();
    init_effectivePluginConfig();
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
  context.withToolsProvider(provideTools);
  console.log("[BigRAG] Plugin initialized successfully");
}
var init_src = __esm({
  "src/index.ts"() {
    "use strict";
    init_config();
    init_promptPreprocessor();
    init_toolsProvider();
  }
});

// .lmstudio/entry.ts
var import_sdk3 = require("@lmstudio/sdk");
var clientIdentifier = process.env.LMS_PLUGIN_CLIENT_IDENTIFIER;
var clientPasskey = process.env.LMS_PLUGIN_CLIENT_PASSKEY;
var baseUrl = process.env.LMS_PLUGIN_BASE_URL;
var client = new import_sdk3.LMStudioClient({
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
