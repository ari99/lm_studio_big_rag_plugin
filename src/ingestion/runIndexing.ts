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
  embeddingBatchSize = 100,
  embeddingConcurrency = 5,
}: RunIndexingParams): Promise<RunIndexingResult> {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === undefined;

  if (ownsVectorStore) {
    await vectorStore.initialize();
  }

  // Auto-detect and load the first available embedding model
  console.log('[BigRAG] Searching for available embedding models...');
  
  let embeddingModel: EmbeddingDynamicHandle | undefined;
  try {
    // First check if any embedding models are already loaded
    let loadedModels = await client.embedding.listLoaded();
    
    if (loadedModels.length > 0) {
      // Use the first loaded model
      embeddingModel = loadedModels[0];
      console.log('[BigRAG] Using already loaded embedding model');
    } else {
      // No models loaded, try to get the first downloaded model (this will load it)
      console.log('[BigRAG] No embedding models loaded. Attempting to load first available model...');
      // client.embedding.model() will load the model if it's not already loaded
      // We need to find a model key - try the common one first
      const commonModelIds = [
        'nomic-ai/nomic-embed-text-v1.5',
        'nomic-ai/nomic-embed-text-v1.5-GGUF',
        'text-embedding-nomic-embed-text-v1.5',
      ];
      
      for (const modelId of commonModelIds) {
        try {
          embeddingModel = await client.embedding.model(modelId, { signal: abortSignal });
          console.log(`[BigRAG] Loaded embedding model: ${modelId}`);
          break;
        } catch (e) {
          // Try next model ID
        }
      }
      
      if (!embeddingModel) {
        throw new Error('Could not load any embedding model. Please download one first (e.g., nomic-ai/nomic-embed-text-v1.5).');
      }
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

  const embeddingModels = [embeddingModel];

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

