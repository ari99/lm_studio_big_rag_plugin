import {
  chunkText as nativeChunkText,
  chunkTextFast as nativeChunkTextFast,
  chunkTextsParallel as nativeChunkTextsParallel,
  chunkTextsBatch as nativeChunkTextsBatch,
  isNativeAvailable,
  TextChunk,
  BatchChunkResult
} from "../native";

/**
 * Chunk result with metadata
 */
export interface ChunkResult {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenEstimate: number;
}

/**
 * Optimized text chunker that splits text into overlapping chunks
 * Uses native Rust implementation when available for maximum performance
 */
export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
): ChunkResult[] {
  if (isNativeAvailable()) {
    // Use native Rust implementation - optimized with single-pass word boundary detection
    const nativeChunks = nativeChunkText(text, chunkSize, overlap) as TextChunk[];
    return nativeChunks.map((chunk) => ({
      text: chunk.text,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      tokenEstimate: chunk.tokenEstimate,
    }));
  }

  // Fallback to TypeScript implementation
  const chunks: ChunkResult[] = [];

  // Simple word-based chunking
  const words = text.split(/\s+/);

  if (words.length === 0) {
    return chunks;
  }

  let startIdx = 0;

  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    const chunkWords = words.slice(startIdx, endIdx);
    const chunkText = chunkWords.join(" ");

    chunks.push({
      text: chunkText,
      startIndex: startIdx,
      endIndex: endIdx,
      tokenEstimate: Math.ceil(chunkText.length / 4),
    });

    // Move forward by (chunkSize - overlap) to create overlapping chunks
    startIdx += Math.max(1, chunkSize - overlap);

    // Break if we've reached the end
    if (endIdx >= words.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Fast text chunker - returns only text without metadata
 * Uses native Rust implementation for maximum performance (1.30x speedup)
 */
export function chunkTextFast(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  if (isNativeAvailable()) {
    return nativeChunkTextFast(text, chunkSize, overlap);
  }

  // Fallback to TypeScript implementation
  const chunks = chunkText(text, chunkSize, overlap);
  return chunks.map(c => c.text);
}

/**
 * Batch chunk multiple texts in parallel using Rust
 * Provides 1.45x speedup over sequential TypeScript implementation
 */
export async function chunkTextsParallel(
  texts: string[],
  chunkSize: number,
  overlap: number,
): Promise<ChunkResult[][]> {
  if (isNativeAvailable()) {
    const nativeChunks = await nativeChunkTextsParallel(texts, chunkSize, overlap) as TextChunk[][];
    return nativeChunks.map((fileChunks) =>
      fileChunks.map((chunk) => ({
        text: chunk.text,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
        tokenEstimate: chunk.tokenEstimate,
      }))
    );
  }

  // Fallback to sequential TypeScript implementation
  return texts.map((text) => chunkText(text, chunkSize, overlap));
}

/**
 * Ultra-batch chunking - chunks ALL documents in a single native call
 * Returns chunks grouped by file index for maximum performance (avoids FFI overhead)
 * This is the fastest chunking method - 20x+ speedup over sequential calls
 */
export async function chunkTextsBatch(
  texts: string[],
  chunkSize: number,
  overlap: number,
): Promise<Map<number, ChunkResult[]>> {
  if (isNativeAvailable() && nativeChunkTextsBatch) {
    const nativeResults = await nativeChunkTextsBatch(texts, chunkSize, overlap) as BatchChunkResult[];
    
    // Group by file index
    const grouped = new Map<number, ChunkResult[]>();
    for (const result of nativeResults) {
      let fileChunks = grouped.get(result.fileIndex);
      if (!fileChunks) {
        fileChunks = [];
        grouped.set(result.fileIndex, fileChunks);
      }
      fileChunks.push({
        text: result.text,
        startIndex: result.startIndex,
        endIndex: result.endIndex,
        tokenEstimate: result.tokenEstimate,
      });
    }
    return grouped;
  }

  // Fallback: use parallel implementation
  const parallelResults = await chunkTextsParallel(texts, chunkSize, overlap);
  return new Map(parallelResults.map((chunks, idx) => [idx, chunks]));
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if native chunking is available
 */
export function isNativeChunkingAvailable(): boolean {
  return isNativeAvailable();
}
