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
  // Load 4 instances by default for parallel embedding processing
  console.log('[BigRAG] Searching for available embedding models...');
  
  const EMBEDDING_MODEL_COUNT = 4; // Default: load 4 instances for parallel processing
  const embeddingModels: EmbeddingDynamicHandle[] = [];
  
  try {
    // First check if any embedding models are already loaded
    let loadedModels = await client.embedding.listLoaded();
    
    if (loadedModels.length >= EMBEDDING_MODEL_COUNT) {
      // Use the first N loaded models
      embeddingModels.push(...loadedModels.slice(0, EMBEDDING_MODEL_COUNT));
      console.log(`[BigRAG] Using ${embeddingModels.length} already loaded embedding models`);
    } else {
      // Need to load models
      console.log(`[BigRAG] Loading ${EMBEDDING_MODEL_COUNT} embedding model instances for parallel processing...`);
      
      // Try common model IDs
      const commonModelIds = [
        'nomic-ai/nomic-embed-text-v1.5',
        'nomic-ai/nomic-embed-text-v1.5-GGUF',
        'text-embedding-nomic-embed-text-v1.5',
      ];
      
      let baseModelId: string | null = null;
      for (const modelId of commonModelIds) {
        try {
          // Try to load the first instance to find a working model ID
          await client.embedding.load(modelId);
          baseModelId = modelId;
          console.log(`[BigRAG] Found working model ID: ${modelId}`);
          break;
        } catch (e) {
          // Try next model ID
        }
      }
      
      if (!baseModelId) {
        throw new Error('Could not load any embedding model. Please download one first (e.g., nomic-ai/nomic-embed-text-v1.5). Run: lms get nomic-ai/nomic-embed-text-v1.5');
      }
      
      // Get handle to the first loaded model
      const firstModel = await client.embedding.model(baseModelId);
      embeddingModels.push(firstModel);
      
      // Load remaining instances (we already have 1, need EMBEDDING_MODEL_COUNT - 1 more)
      for (let i = 1; i < EMBEDDING_MODEL_COUNT; i++) {
        try {
          // Load additional instances with unique identifiers
          const instanceId = `embedding-instance-${i + 1}`;
          const model = await client.embedding.load(baseModelId, { identifier: instanceId });
          embeddingModels.push(model);
          console.log(`[BigRAG] Loaded embedding model instance ${i + 1}/${EMBEDDING_MODEL_COUNT}: ${instanceId}`);
        } catch (e: any) {
          // Instance might already exist, get handle to it
          if (e.message?.includes('already exists')) {
            console.warn(`[BigRAG] Instance ${i + 1} already exists with identifier 'embedding-instance-${i + 1}', skipping...`);
          } else {
            console.warn(`[BigRAG] Failed to load instance ${i + 1}: ${e.message}`);
          }
        }
      }
      
      console.log(`[BigRAG] Successfully loaded ${embeddingModels.length} embedding model instances`);
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

