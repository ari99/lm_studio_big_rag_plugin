import * as path from "path";
import { type LMStudioClient } from "@lmstudio/sdk";
import { resolveEmbeddingModelId } from "../config";
import { VectorStore, type SearchResult } from "../vectorstore/vectorStore";
import {
  checkEmbeddingModelForRetrieval,
  deleteEmbeddingIndexManifest,
} from "../utils/embeddingIndexManifest";

let cachedVectorStore: VectorStore | null = null;
let lastVectorStoreDir = "";

function throwIfAborted(abortSignal: AbortSignal | undefined): void {
  if (abortSignal?.aborted) {
    throw abortSignal.reason ?? new DOMException("Aborted", "AbortError");
  }
}

export function getCachedVectorStore(): VectorStore | null {
  return cachedVectorStore;
}

/**
 * Open or reuse the in-memory vector store for the given directory.
 */
export async function ensureVectorStore(vectorStoreDir: string): Promise<VectorStore> {
  const resolvedDir = path.resolve(vectorStoreDir);
  if (!cachedVectorStore || lastVectorStoreDir !== resolvedDir) {
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
  }
  return cachedVectorStore;
}

export function summarizeText(text: string, maxLines: number = 3, maxChars: number = 400): string {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  const clippedLines = lines.slice(0, maxLines);
  let clipped = clippedLines.join("\n");
  if (clipped.length > maxChars) {
    clipped = clipped.slice(0, maxChars);
  }
  const needsEllipsis =
    lines.length > maxLines ||
    text.length > clipped.length ||
    (clipped.length === maxChars && text.length > maxChars);
  return needsEllipsis ? `${clipped.trimEnd()}…` : clipped;
}

export interface RetrievedPassage {
  text: string;
  score: number;
  filePath: string;
  fileName: string;
  chunkIndex: number;
  shardName: string;
  metadata: Record<string, unknown>;
}

export interface RagContextBlocks {
  full: string;
  preview: string;
}

export function formatRagContext(passages: RetrievedPassage[]): RagContextBlocks {
  let ragContextFull = "";
  let ragContextPreview = "";
  const prefix = "The following passages were found in your indexed documents:\n\n";
  ragContextFull += prefix;
  ragContextPreview += prefix;

  let citationNumber = 1;
  for (const passage of passages) {
    const fileName = path.basename(passage.filePath);
    const citationLabel =
      `Citation ${citationNumber} (from ${fileName}, score: ${passage.score.toFixed(3)}): `;
    ragContextFull += `\n${citationLabel}"${passage.text}"\n\n`;
    ragContextPreview += `\n${citationLabel}"${summarizeText(passage.text)}"\n\n`;
    citationNumber++;
  }

  return {
    full: ragContextFull.trimEnd(),
    preview: ragContextPreview.trimEnd(),
  };
}

function mapSearchResults(results: SearchResult[]): RetrievedPassage[] {
  return results.map((result) => ({
    text: result.text,
    score: result.score,
    filePath: result.filePath,
    fileName: result.fileName,
    chunkIndex: result.chunkIndex,
    shardName: result.shardName,
    metadata: result.metadata,
  }));
}

export interface RetrievePassagesParams {
  client: LMStudioClient;
  vectorStoreDir: string;
  embeddingModelId: string;
  query: string;
  retrievalLimit: number;
  retrievalThreshold: number;
  abortSignal?: AbortSignal;
}

export type RetrievePassagesResult =
  | { ok: true; passages: RetrievedPassage[] }
  | {
      ok: false;
      reason: "empty-index" | "embedding-mismatch";
      message: string;
      logMessage?: string;
    };

export async function retrievePassages(
  params: RetrievePassagesParams,
): Promise<RetrievePassagesResult> {
  const {
    client,
    vectorStoreDir,
    embeddingModelId,
    query,
    retrievalLimit,
    retrievalThreshold,
    abortSignal,
  } = params;

  const resolvedModelId = resolveEmbeddingModelId(embeddingModelId);
  const resolvedStoreDir = path.resolve(vectorStoreDir);
  throwIfAborted(abortSignal);

  const store = await ensureVectorStore(resolvedStoreDir);
  const stats = await store.getStats();

  if (stats.totalChunks === 0) {
    await deleteEmbeddingIndexManifest(resolvedStoreDir);
    return {
      ok: false,
      reason: "empty-index",
      message: "The document index is empty (no chunks stored yet).",
    };
  }

  const embeddingModel = await client.embedding.model(resolvedModelId, {
    signal: abortSignal,
  });

  throwIfAborted(abortSignal);

  const compatibility = await checkEmbeddingModelForRetrieval({
    vectorStoreDir: resolvedStoreDir,
    resolvedModelId,
    totalChunks: stats.totalChunks,
    embeddingModel,
  });

  if (!compatibility.ok) {
    return {
      ok: false,
      reason: "embedding-mismatch",
      message: compatibility.userMessage,
      logMessage: compatibility.logMessage,
    };
  }

  const queryPreview = query.length > 160 ? `${query.slice(0, 160)}...` : query;
  console.info(
    `[BigRAG] Executing vector search for "${queryPreview}" (limit=${retrievalLimit}, threshold=${retrievalThreshold})`,
  );

  const queryEmbeddingResult = await embeddingModel.embed(query);
  throwIfAborted(abortSignal);

  const results = await store.search(
    queryEmbeddingResult.embedding,
    retrievalLimit,
    retrievalThreshold,
  );

  if (results.length > 0) {
    const topHit = results[0];
    console.info(
      `[BigRAG] Vector search returned ${results.length} results. Top hit: file=${topHit.fileName} score=${topHit.score.toFixed(3)}`,
    );
  } else {
    console.warn("[BigRAG] Vector search returned 0 results.");
  }

  return { ok: true, passages: mapSearchResults(results) };
}

export interface IndexStatusParams {
  documentsDirectory: string;
  vectorStoreDirectory: string;
  embeddingModelId: string;
}

export interface IndexStatusResult {
  documentsDirectory: string;
  vectorStoreDirectory: string;
  embeddingModelId: string;
  totalChunks: number;
  uniqueFiles: number;
}

export async function getIndexStatus(
  params: IndexStatusParams,
): Promise<IndexStatusResult | { error: string }> {
  const { documentsDirectory, vectorStoreDirectory, embeddingModelId } = params;

  if (!documentsDirectory.trim()) {
    return { error: "Documents directory is not configured." };
  }
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
    uniqueFiles: stats.uniqueFiles,
  };
}
