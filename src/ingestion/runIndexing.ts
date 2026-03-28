import { type LMStudioClient, type EmbeddingDynamicHandle } from "@lmstudio/sdk";
import { IndexManager, type IndexingProgress, type IndexingResult } from "./indexManager";
import { VectorStore } from "../vectorstore/vectorStore";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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
  embeddingModelIdPattern?: string;
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
  embeddingModelIdPattern = "nomic-ai/nomic-embed-text-v1.5-GGUF",
  embeddingBatchSize = 100,
  embeddingConcurrency = 5,
}: RunIndexingParams): Promise<RunIndexingResult> {
  const vectorStore = existingVectorStore ?? new VectorStore(vectorStoreDir);
  const ownsVectorStore = existingVectorStore === undefined;

  if (ownsVectorStore) {
    await vectorStore.initialize();
  }

  // Load embedding model(s) using LM Studio CLI
  // LM Studio requires explicit model loading via CLI for multiple instances
  const isMultiModel = embeddingModelCount > 1;
  const baseModelId = embeddingModelIdPattern.replace("{i}", "").trim();

  console.log(`[BigRAG] Loading embedding model(s)`);
  console.log(`[BigRAG] Mode: ${isMultiModel ? `multi-model (${embeddingModelCount} instances)` : "single model"}`);
  console.log(`[BigRAG] Base model ID: ${baseModelId}`);
  console.log(`[BigRAG] Batch size: ${embeddingBatchSize}, Concurrency: ${embeddingConcurrency}`);

  const embeddingModels: EmbeddingDynamicHandle[] = [];

  try {
    if (isMultiModel) {
      // Load multiple model instances using lms CLI
      console.log(`[BigRAG] Loading ${embeddingModelCount} model instances using lms CLI...`);
      
      for (let i = 0; i < embeddingModelCount; i++) {
        const instanceNum = i + 1;
        const modelIdentifier = `${baseModelId}-${instanceNum}`;
        
        console.log(`[BigRAG] Loading model instance ${instanceNum}/${embeddingModelCount} with identifier: ${modelIdentifier}`);
        
        // Use lms CLI to load the model with a unique identifier
        // The --yes flag auto-approves, --identifier sets the API identifier
        const lmsCommand = `lms load -y --identifier "${modelIdentifier}" "${baseModelId}"`;
        console.log(`[BigRAG] Executing: ${lmsCommand}`);
        
        try {
          const { stdout, stderr } = await execAsync(lmsCommand, { timeout: 60000 });
          if (stdout) console.log(`[BigRAG] lms output: ${stdout}`);
          if (stderr) console.warn(`[BigRAG] lms warnings: ${stderr}`);
          console.log(`[BigRAG] Model instance ${instanceNum}/${embeddingModelCount} loaded successfully`);
        } catch (lmsError: any) {
          // Model might already be loaded, which is fine
          if (lmsError.message?.includes("already loaded") || lmsError.message?.includes("already exists")) {
            console.log(`[BigRAG] Model instance ${instanceNum} already loaded, continuing...`);
          } else {
            throw lmsError;
          }
        }
      }
      
      console.log(`[BigRAG] All ${embeddingModelCount} model instances loaded`);
    } else {
      // Single model mode - just ensure it's loaded
      console.log(`[BigRAG] Ensuring single embedding model is loaded...`);
      const lmsCommand = `lms load -y --identifier "${baseModelId}" "${baseModelId}"`;
      try {
        await execAsync(lmsCommand, { timeout: 60000 });
        console.log(`[BigRAG] Model loaded: ${baseModelId}`);
      } catch (lmsError: any) {
        if (!lmsError.message?.includes("already loaded")) {
          console.warn(`[BigRAG] Could not load model via CLI: ${lmsError.message}`);
          console.warn(`[BigRAG] Will try to get handle anyway...`);
        }
      }
    }

    // Now get handles to all loaded models
    console.log(`[BigRAG] Getting handles to loaded model instances...`);
    for (let i = 0; i < embeddingModelCount; i++) {
      const instanceNum = i + 1;
      const modelIdentifier = isMultiModel ? `${baseModelId}-${instanceNum}` : baseModelId;
      
      console.log(`[BigRAG] Getting handle to model: ${modelIdentifier}`);
      const model = await client.embedding.model(modelIdentifier, { signal: abortSignal });
      embeddingModels.push(model);
    }

    console.log(`[BigRAG] All model handles acquired successfully`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[BigRAG] Failed to load embedding model:', errorMsg);
    console.error('[BigRAG] Make sure:');
    console.error('[BigRAG]   1. LM Studio is running');
    console.error('[BigRAG]   2. nomic-ai/nomic-embed-text-v1.5-GGUF (or your model) is downloaded');
    console.error('[BigRAG]   3. lms CLI is available in PATH');
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

