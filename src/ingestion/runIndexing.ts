import { type LMStudioClient, type EmbeddingDynamicHandle } from "@lmstudio/sdk";
import { IndexManager, type IndexingProgress, type IndexingResult } from "./indexManager";
import { VectorStore } from "../vectorstore/vectorStore";

export interface RunIndexingParams {
  client: LMStudioClient;
  abortSignal: AbortSignal;
  documentsDir: string;
  vectorStoreDir: string;
  chunkSize: number;
  chunkOverlap: number;
  maxConcurrent: number;
  enableOCR: boolean;
  autoReindex: boolean;
  parseDelayMs: number;
  forceReindex?: boolean;
  vectorStore?: VectorStore;
  onProgress?: (progress: IndexingProgress) => void;
  // Embedding parallelization settings
  embeddingMode?: "single" | "multi-model" | "large-batch";
  embeddingModelCount?: number;
  embeddingBatchSize?: number;
  embeddingConcurrency?: number;
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
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  autoReindex,
  parseDelayMs,
  forceReindex = false,
  vectorStore: existingVectorStore,
  onProgress,
  embeddingMode = "single",
  embeddingModelCount = 1,
  embeddingBatchSize = 100,
  embeddingConcurrency = 5,
}: RunIndexingParams): Promise<RunIndexingResult> {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === undefined;

  if (ownsVectorStore) {
    await vectorStore.initialize();
  }

  // Load embedding model(s) based on parallelization mode
  const embeddingModelId = "nomic-ai/nomic-embed-text-v1.5-GGUF";

  console.log(`[BigRAG] Loading embedding model(s): ${embeddingModelId}`);
  console.log(`[BigRAG] Mode: ${embeddingMode}, Model count: ${embeddingModelCount}`);

  const embeddingModels: EmbeddingDynamicHandle[] = [];

  try {
    if (embeddingMode === "multi-model" && embeddingModelCount > 1) {
      // Load multiple model instances for parallel embedding
      console.log(`[BigRAG] Loading ${embeddingModelCount} model instances for multi-model parallelization...`);
      const loadPromises = Array.from({ length: embeddingModelCount }, async (_, i) => {
        console.log(`[BigRAG] Loading model instance ${i + 1}/${embeddingModelCount}...`);
        const model = await client.embedding.model(embeddingModelId, { signal: abortSignal });
        console.log(`[BigRAG] Model instance ${i + 1}/${embeddingModelCount} loaded`);
        return model;
      });

      const loadedModels = await Promise.all(loadPromises);
      embeddingModels.push(...loadedModels);
      console.log(`[BigRAG] All ${embeddingModelCount} model instances loaded successfully`);
    } else {
      // Single model mode (default)
      console.log('[BigRAG] Loading single embedding model...');
      const model = await client.embedding.model(embeddingModelId, { signal: abortSignal });
      embeddingModels.push(model);
      console.log('[BigRAG] Embedding model loaded successfully');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[BigRAG] Failed to load embedding model:', errorMsg);
    console.error('[BigRAG] Make sure:');
    console.error('[BigRAG]   1. LM Studio is running');
    console.error('[BigRAG]   2. nomic-ai/nomic-embed-text-v1.5-GGUF is downloaded');
    console.error('[BigRAG]   3. The model is loaded (not unloaded) in LM Studio');
    console.error('[BigRAG]   4. For multi-model: enough VRAM for multiple instances');
    throw new Error(`Failed to load embedding model: ${errorMsg}`);
  }

  const indexManager = new IndexManager({
    documentsDir,
    vectorStore,
    vectorStoreDir,
    embeddingModels,
    client,
    chunkSize,
    chunkOverlap,
    maxConcurrent,
    enableOCR,
    autoReindex: forceReindex ? false : autoReindex,
    parseDelayMs,
    abortSignal,
    onProgress,
    embeddingBatchSize,
    embeddingConcurrency,
  });

  const indexingResult = await indexManager.index();
  const stats = await vectorStore.getStats();

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

