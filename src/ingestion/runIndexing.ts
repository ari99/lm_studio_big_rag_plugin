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
  embeddingBatchSize = 250,
  embeddingConcurrency = 20,
}: RunIndexingParams): Promise<RunIndexingResult> {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === undefined;

  if (ownsVectorStore) {
    await vectorStore.initialize();
  }

  // Auto-detect and load embedding model(s)
  // Load exactly 4 instances for parallel embedding processing
  console.log('[BigRAG] Searching for available embedding models...');

  const EMBEDDING_MODEL_COUNT = 4; // Default: load 4 instances for parallel processing
  const embeddingModels: EmbeddingDynamicHandle[] = [];

  try {
    // First check what embedding models are already loaded
    let loadedModels = await client.embedding.listLoaded();
    console.log(`[BigRAG] Found ${loadedModels.length} already loaded embedding model(s)`);

    if (loadedModels.length >= EMBEDDING_MODEL_COUNT) {
      // Use exactly EMBEDDING_MODEL_COUNT models
      embeddingModels.push(...loadedModels.slice(0, EMBEDDING_MODEL_COUNT));
      console.log(`[BigRAG] Using ${embeddingModels.length} already loaded embedding models`);
    } else {
      // Need to load more models to reach EMBEDDING_MODEL_COUNT
      console.log(`[BigRAG] Need ${EMBEDDING_MODEL_COUNT} models, have ${loadedModels.length}. Loading additional models...`);

      // Use any already loaded models first
      if (loadedModels.length > 0) {
        embeddingModels.push(...loadedModels);
        console.log(`[BigRAG] Reusing ${loadedModels.length} already loaded model(s)`);
      }

      // Try common model IDs to find one that works
      const commonModelIds = [
        'nomic-ai/nomic-embed-text-v1.5',
        'nomic-ai/nomic-embed-text-v1.5-GGUF',
        'text-embedding-nomic-embed-text-v1.5',
      ];

      let baseModelId: string | null = null;
      for (const modelId of commonModelIds) {
        try {
          // Try to load to find a working model ID
          await client.embedding.load(modelId);
          baseModelId = modelId;
          console.log(`[BigRAG] Found working model ID: ${modelId}`);
          // Get the handle to this first loaded model
          const firstModel = await client.embedding.model(modelId);
          if (!embeddingModels.includes(firstModel)) {
            embeddingModels.push(firstModel);
          }
          break;
        } catch (e) {
          // Try next model ID
        }
      }

      if (!baseModelId) {
        throw new Error('Could not load any embedding model. Please download one first (e.g., nomic-ai/nomic-embed-text-v1.5). Run: lms get nomic-ai/nomic-embed-text-v1.5');
      }

      // Load additional instances until we have exactly EMBEDDING_MODEL_COUNT
      let instanceNum = embeddingModels.length + 1;
      while (embeddingModels.length < EMBEDDING_MODEL_COUNT) {
        const instanceId = `embedding-instance-${instanceNum}`;
        try {
          // Check current state before loading
          const currentModels = await client.embedding.listLoaded();
          console.log(`[BigRAG] Current loaded models: ${currentModels.length}, Target: ${EMBEDDING_MODEL_COUNT}, Need to load: ${EMBEDDING_MODEL_COUNT - embeddingModels.length}`);

          // Try to load with unique identifier
          const model = await client.embedding.load(baseModelId, { identifier: instanceId });
          embeddingModels.push(model);
          console.log(`[BigRAG] Loaded embedding model instance ${embeddingModels.length}/${EMBEDDING_MODEL_COUNT}: ${instanceId}`);
        } catch (e: any) {
          if (e.message?.includes('already exists')) {
            // Instance already exists, get handle to it
            try {
              const existingModel = await client.embedding.model(instanceId);
              if (!embeddingModels.some(m => m === existingModel)) {
                embeddingModels.push(existingModel);
                console.log(`[BigRAG] Using existing model instance: ${instanceId}`);
              }
            } catch (e2) {
              console.warn(`[BigRAG] Could not get handle to existing instance ${instanceId}: ${e2}`);
            }
          } else {
            console.warn(`[BigRAG] Failed to load instance ${instanceNum}: ${e.message}`);
          }
        }
        instanceNum++;

        // Safety check to prevent infinite loop
        if (instanceNum > EMBEDDING_MODEL_COUNT + 10) {
          console.warn('[BigRAG] Stopping model loading to prevent infinite loop');
          break;
        }
      }

      console.log(`[BigRAG] Successfully loaded ${embeddingModels.length} embedding model instance(s)`);
    }

    // Final verification: ensure we have exactly EMBEDDING_MODEL_COUNT or fewer
    if (embeddingModels.length > EMBEDDING_MODEL_COUNT) {
      console.warn(`[BigRAG] Warning: Have ${embeddingModels.length} models but expected ${EMBEDDING_MODEL_COUNT}. Using first ${EMBEDDING_MODEL_COUNT}.`);
      embeddingModels.splice(EMBEDDING_MODEL_COUNT);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[BigRAG] Failed to load embedding model:', errorMsg);
    console.error('[BigRAG] Make sure:');
    console.error('[BigRAG]   1. LM Studio is running');
    console.error('[BigRAG]   2. An embedding model is downloaded (e.g., nomic-ai/nomic-embed-text-v1.5)');
    console.error('[BigRAG]   3. Run "lms get nomic-ai/nomic-embed-text-v1.5" to download one');
    throw new Error(`Failed to load embedding model: ${errorMsg}`);
  }

  console.log(`[BigRAG] Using ${embeddingModels.length} embedding model(s) for parallel processing`);

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

