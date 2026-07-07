import { type LMStudioClient } from "@lmstudio/sdk";
import { IndexManager, type IndexingProgress, type IndexingResult } from "./indexManager";
import { VectorStore } from "../vectorstore/vectorStore";
import { resolveEmbeddingModelId } from "../config";
import { syncEmbeddingManifestAfterIndexing } from "../utils/embeddingIndexManifest";

export interface RunIndexingParams {
  client: LMStudioClient;
  abortSignal: AbortSignal;
  documentsDir: string;
  vectorStoreDir: string;
  embeddingModelId: string;
  chunkSize: number;
  chunkOverlap: number;
  maxConcurrent: number;
  enableOCR: boolean;
  autoReindex: boolean;
  parseDelayMs: number;
  /** Glob patterns relative to documents dir; matching supported files are not parsed or embedded. */
  excludePatterns?: string[];
  /** User-declared plain-text extensions to index as plain text. */
  additionalPlainTextExtensions?: ReadonlySet<string>;
  forceReindex?: boolean;
  vectorStore?: VectorStore;
  onProgress?: (progress: IndexingProgress) => void;
}

export interface RunIndexingResult {
  summary: string;
  stats: {
    totalChunks: number;
    uniqueFiles: number;
  };
  indexingResult: IndexingResult;
}

/**
 * Shared helper that runs the full indexing pipeline.
 * Allows reuse across the manual tool, config-triggered indexing, and automatic bootstrapping.
 */
export async function runIndexingJob({
  client,
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
  additionalPlainTextExtensions = new Set<string>(),
  forceReindex = false,
  vectorStore: existingVectorStore,
  onProgress,
}: RunIndexingParams): Promise<RunIndexingResult> {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === undefined;

  if (ownsVectorStore) {
    await vectorStore.initialize();
  }

  const resolvedModelId = resolveEmbeddingModelId(embeddingModelId);
  const embeddingModel = await client.embedding.model(resolvedModelId, { signal: abortSignal });

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
    autoReindex: forceReindex ? false : autoReindex,
    parseDelayMs,
    excludePatterns,
    additionalPlainTextExtensions,
    abortSignal,
    onProgress,
  });

  const indexingResult = await indexManager.index();
  const stats = await vectorStore.getStats();

  await syncEmbeddingManifestAfterIndexing(
    vectorStoreDir,
    stats.totalChunks,
    resolvedModelId,
    embeddingModel,
  );

  if (ownsVectorStore) {
    await vectorStore.close();
  }

  const summary = `Indexing completed!\n\n` +
    `• Successfully indexed: ${indexingResult.successfulFiles}/${indexingResult.totalFiles}\n` +
    `• Failed: ${indexingResult.failedFiles}\n` +
    `• Skipped (unchanged): ${indexingResult.skippedFiles}\n` +
    `• Updated existing files: ${indexingResult.updatedFiles}\n` +
    `• New files added: ${indexingResult.newFiles}\n` +
    `• Chunks in store: ${stats.totalChunks}\n` +
    `• Unique files in store: ${stats.uniqueFiles}`;

  return {
    summary,
    stats,
    indexingResult,
  };
}

