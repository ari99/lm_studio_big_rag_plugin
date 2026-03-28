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
  embeddingModelCount?: number;
  embeddingModelId?: string;
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
  embeddingModelCount = 1,
  embeddingModelId = "nomic-ai/nomic-embed-text-v1.5-GGUF",
  embeddingBatchSize = 100,
  embeddingConcurrency = 5,
}: RunIndexingParams): Promise<RunIndexingResult> {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === undefined;

  if (ownsVectorStore) {
    await vectorStore.initialize();
  }

  // Load embedding model(s) using SDK's load_new_instance()
  // This allows loading multiple instances of the same model
  const isMultiModel = embeddingModelCount > 1;
  const baseModelId = embeddingModelId;

  console.log(`[BigRAG] Loading embedding model(s)`);
  console.log(`[BigRAG] Mode: ${isMultiModel ? `multi-model (${embeddingModelCount} instances)` : "single model"}`);
  console.log(`[BigRAG] Base model ID: ${baseModelId}`);
  console.log(`[BigRAG] Batch size: ${embeddingBatchSize}, Concurrency: ${embeddingConcurrency}`);

  const embeddingModels: EmbeddingDynamicHandle[] = [];

  try {
    if (isMultiModel) {
      // Load multiple model instances using SDK's load_new_instance()
      console.log(`[BigRAG] Loading ${embeddingModelCount} model instances using load_new_instance()...`);
      
      for (let i = 0; i < embeddingModelCount; i++) {
        const instanceNum = i + 1;
        const instanceId = `${baseModelId.replace(/\//g, '-')}-${instanceNum}`;
        
        console.log(`[BigRAG] Loading model instance ${instanceNum}/${embeddingModelCount} with identifier: ${instanceId}`);
        
        try {
          // Use load_new_instance to load a new instance with a custom identifier
          // @ts-ignore - load_new_instance may not be in type definitions but exists in SDK
          const model = await client.embedding.load_new_instance(baseModelId, instanceId);
          embeddingModels.push(model);
          console.log(`[BigRAG] Model instance ${instanceNum}/${embeddingModelCount} loaded successfully`);
        } catch (loadError: any) {
          // Instance might already exist, try to get it
          if (loadError.message?.includes("already exists") || loadError.message?.includes("already loaded")) {
            console.log(`[BigRAG] Model instance ${instanceNum} already exists, getting handle...`);
            const model = await client.embedding.model(instanceId, { signal: abortSignal });
            embeddingModels.push(model);
          } else {
            throw loadError;
          }
        }
      }
      
      console.log(`[BigRAG] All ${embeddingModelCount} model instances loaded`);
    } else {
      // Single model mode - just get or load the model
      console.log(`[BigRAG] Loading single embedding model: ${baseModelId}`);
      const model = await client.embedding.model(baseModelId, { signal: abortSignal });
      embeddingModels.push(model);
      console.log('[BigRAG] Embedding model loaded successfully');
    }

    console.log(`[BigRAG] All model handles acquired successfully`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[BigRAG] Failed to load embedding model:', errorMsg);
    console.error('[BigRAG] Make sure:');
    console.error('[BigRAG]   1. LM Studio is running');
    console.error('[BigRAG]   2. nomic-ai/nomic-embed-text-v1.5-GGUF (or your model) is downloaded');
    console.error('[BigRAG]   3. For multi-model: enough VRAM for multiple instances (~300MB each)');
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

