import * as fs from "fs/promises";
import * as path from "path";
import { type EmbeddingDynamicHandle } from "@lmstudio/sdk";
import { coerceEmbeddingVector } from "./coerceEmbedding";

export const EMBEDDING_INDEX_MANIFEST_FILENAME = ".big-rag-embedding.json";

export interface EmbeddingIndexManifest {
  embeddingModelId: string;
  dimensions: number;
}

export function getEmbeddingManifestPath(vectorStoreDir: string): string {
  return path.join(path.resolve(vectorStoreDir), EMBEDDING_INDEX_MANIFEST_FILENAME);
}

export async function readEmbeddingIndexManifest(
  vectorStoreDir: string,
): Promise<EmbeddingIndexManifest | null> {
  const filePath = getEmbeddingManifestPath(vectorStoreDir);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as Partial<EmbeddingIndexManifest>;
    if (
      typeof data.embeddingModelId === "string" &&
      data.embeddingModelId.length > 0 &&
      typeof data.dimensions === "number" &&
      Number.isFinite(data.dimensions) &&
      data.dimensions > 0
    ) {
      return { embeddingModelId: data.embeddingModelId, dimensions: data.dimensions };
    }
    return null;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      return null;
    }
    console.warn("[BigRAG] Could not read embedding index manifest:", e);
    return null;
  }
}

export async function writeEmbeddingIndexManifest(
  vectorStoreDir: string,
  manifest: EmbeddingIndexManifest,
): Promise<void> {
  const filePath = getEmbeddingManifestPath(vectorStoreDir);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(manifest, null, 2), "utf-8");
}

export async function deleteEmbeddingIndexManifest(vectorStoreDir: string): Promise<void> {
  const filePath = getEmbeddingManifestPath(vectorStoreDir);
  try {
    await fs.unlink(filePath);
  } catch (e: any) {
    if (e?.code !== "ENOENT") {
      console.warn("[BigRAG] Could not delete embedding index manifest:", e);
    }
  }
}

/**
 * After indexing: persist manifest when the store has chunks; otherwise remove stale manifest.
 */
export async function syncEmbeddingManifestAfterIndexing(
  vectorStoreDir: string,
  totalChunks: number,
  resolvedModelId: string,
  embeddingModel: EmbeddingDynamicHandle,
): Promise<void> {
  if (totalChunks === 0) {
    await deleteEmbeddingIndexManifest(vectorStoreDir);
    return;
  }
  const probe = await embeddingModel.embed(".");
  const dimensions = coerceEmbeddingVector(probe.embedding).length;
  await writeEmbeddingIndexManifest(vectorStoreDir, {
    embeddingModelId: resolvedModelId,
    dimensions,
  });
}

export type EmbeddingRetrievalCheck =
  | { ok: true }
  | { ok: false; userMessage: string; logMessage: string };

const legacyWarnedDirs = new Set<string>();

/**
 * Validate configured embedding model against on-disk manifest before retrieval.
 * When totalChunks is 0, clears any stale manifest.
 */
export async function checkEmbeddingModelForRetrieval(args: {
  vectorStoreDir: string;
  resolvedModelId: string;
  totalChunks: number;
  embeddingModel: EmbeddingDynamicHandle;
}): Promise<EmbeddingRetrievalCheck> {
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
        "[BigRAG] Index has chunks but no `.big-rag-embedding.json` manifest (likely built with an older plugin). " +
          "Retrieval proceeds; run a full reindex to record embedding metadata.",
      );
    }
    return { ok: true };
  }

  if (manifest.embeddingModelId !== resolvedModelId) {
    const logMessage =
      `Embedding model mismatch: index was built with "${manifest.embeddingModelId}" but settings use "${resolvedModelId}". Reindex or change the setting.`;
    return {
      ok: false,
      logMessage,
      userMessage:
        `The document index was built with embedding model "${manifest.embeddingModelId}", but the plugin is set to "${resolvedModelId}". ` +
        `Either switch the Embedding Model setting back, or reindex your documents after changing the model.`,
    };
  }

  const probe = await embeddingModel.embed(".");
  const dim = coerceEmbeddingVector(probe.embedding).length;
  if (dim !== manifest.dimensions) {
    const logMessage =
      `Embedding dimension mismatch: manifest has ${manifest.dimensions} but model "${resolvedModelId}" returned ${dim}. Reindex required.`;
    return {
      ok: false,
      logMessage,
      userMessage:
        `The stored index expects embedding vectors of length ${manifest.dimensions}, but the current model produced length ${dim}. ` +
        `Reindex your documents (or fix the model identifier).`,
    };
  }

  return { ok: true };
}
