import { LMStudioClient } from "@lmstudio/sdk";
import { VectorStore } from "./vectorstore/vectorStore";
import { IndexManager } from "./ingestion/indexManager";

async function main() {
  const documentsDir = process.env.BIG_RAG_DOCS_DIR ?? process.argv[2];
  const vectorStoreDir = process.env.BIG_RAG_DB_DIR ?? process.argv[3];

  if (!documentsDir || !vectorStoreDir) {
    console.error(
      "Usage: BIG_RAG_DOCS_DIR=/path/to/docs BIG_RAG_DB_DIR=/path/to/db node dist/cliIndex.js\n" +
        "   or: node dist/cliIndex.js /path/to/docs /path/to/db",
    );
    process.exit(1);
  }

  const chunkSize = process.env.BIG_RAG_CHUNK_SIZE
    ? Number(process.env.BIG_RAG_CHUNK_SIZE)
    : 512;
  const chunkOverlap = process.env.BIG_RAG_CHUNK_OVERLAP
    ? Number(process.env.BIG_RAG_CHUNK_OVERLAP)
    : 100;
  const maxConcurrent = process.env.BIG_RAG_MAX_CONCURRENT
    ? Number(process.env.BIG_RAG_MAX_CONCURRENT)
    : 1;
  const enableOCR =
    (process.env.BIG_RAG_ENABLE_OCR ?? "true").toLowerCase() === "true";
  const autoReindex =
    (process.env.BIG_RAG_FORCE_REINDEX ?? "false").toLowerCase() !== "true";
  const parseDelayMs = process.env.BIG_RAG_PARSE_DELAY_MS
    ? Number(process.env.BIG_RAG_PARSE_DELAY_MS)
    : 500;
  const failureReportPath = process.env.BIG_RAG_FAILURE_REPORT_PATH;

  const embeddingModelId =
    process.env.BIG_RAG_EMBEDDING_MODEL ??
    "nomic-ai/nomic-embed-text-v1.5-GGUF";

  console.log("[BigRAG CLI] Starting indexing");
  console.log(`[BigRAG CLI] Documents dir: ${documentsDir}`);
  console.log(`[BigRAG CLI] Vector store dir: ${vectorStoreDir}`);
  console.log(`[BigRAG CLI] Embedding model: ${embeddingModelId}`);

  const client = new LMStudioClient();

  console.log("[BigRAG CLI] Initializing vector store...");
  const vectorStore = new VectorStore(vectorStoreDir);
  await vectorStore.initialize();

  console.log("[BigRAG CLI] Loading embedding model...");
  const embeddingModel = await client.embedding.model(embeddingModelId);

  const indexManager = new IndexManager({
    documentsDir,
    vectorStore,
    vectorStoreDir,
    embeddingModel,
    client,
    chunkSize,
    chunkOverlap,
    maxConcurrent,
    enableOCR,
    autoReindex,
    parseDelayMs,
    failureReportPath,
    onProgress: (progress) => {
      if (progress.status === "scanning") {
        console.log(
          `[BigRAG CLI] Scanning: ${progress.currentFile || "discovering files"}`,
        );
      } else if (progress.status === "indexing") {
        const success = progress.successfulFiles ?? 0;
        const failed = progress.failedFiles ?? 0;
        const skipped = progress.skippedFiles ?? 0;
        console.log(
          `[BigRAG CLI] Indexing: ${progress.processedFiles}/${progress.totalFiles} files ` +
            `(success=${success}, failed=${failed}, skipped=${skipped})`,
        );
      } else if (progress.status === "complete") {
        console.log(
          `[BigRAG CLI] Indexing complete: ${progress.processedFiles} files processed`,
        );
      } else if (progress.status === "error") {
        console.error(`[BigRAG CLI] Indexing error: ${progress.error}`);
      }
    },
  });

  try {
    const result = await indexManager.index();
    const stats = await vectorStore.getStats();

    console.log(
      "[BigRAG CLI] Indexing finished:\n" +
        `  Files: ${result.successfulFiles}/${result.totalFiles} successfully indexed (${result.failedFiles} failed)\n` +
        `  Chunks: ${stats.totalChunks}\n` +
        `  Unique files: ${stats.uniqueFiles}`,
    );
  } catch (error) {
    console.error("[BigRAG CLI] Error during indexing:", error);
    process.exitCode = 1;
  } finally {
    await vectorStore.close();
  }
}

void main();


