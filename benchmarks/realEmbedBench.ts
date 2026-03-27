/**
 * REAL Embedding Benchmark - Actual LM Studio API Calls
 * 
 * Compares:
 * 1. OLD: Per-file chunking + Per-file embedding (TypeScript)
 * 2. NEW: Batch chunking + Batch embedding (Rust Native)
 * 
 * Uses REAL embedding API calls to LM Studio server.
 */

import * as fs from "fs";
import * as path from "path";
import { LMStudioClient } from "@lmstudio/sdk";

import {
  chunkText as tsChunkText,
  isNativeChunkingAvailable,
} from "../src/utils/textChunker";

import {
  chunkText as nativeChunkText,
  chunkTextsBatch as nativeChunkTextsBatch,
  isNativeAvailable,
} from "../src/native";

// Configuration
// Set via environment variables for privacy:
//   export BIG_RAG_DOCUMENTS_PATH="/your/docs/path"
//   export BIG_RAG_LMSTUDIO_HOST="localhost:1234" or "192.168.x.x:1234"
//   export BIG_RAG_EMBEDDING_MODEL="nomic-ai/nomic-embed-text-v1.5-GGUF"
const DOCUMENTS_PATH = process.env.BIG_RAG_DOCUMENTS_PATH || "/path/to/your/documents";
const LMSTUDIO_HOST = process.env.BIG_RAG_LMSTUDIO_HOST || "localhost:1234";
const EMBEDDING_MODEL = process.env.BIG_RAG_EMBEDDING_MODEL || "nomic-ai/nomic-embed-text-v1.5-GGUF";
const CHUNK_SIZE = 100;
const CHUNK_OVERLAP = 20;
const MAX_FILES = 100;

interface BenchmarkResult {
  name: string;
  fileCount: number;
  totalChunks: number;
  totalTimeMs: number;
  chunkingTimeMs: number;
  embeddingTimeMs: number;
  chunksPerSec: number;
  avgTimePerFile: number;
  avgTimePerChunk: number;
}

interface LoadFileResult {
  path: string;
  name: string;
  text: string;
}

async function loadFiles(count: number): Promise<LoadFileResult[]> {
  const files: LoadFileResult[] = [];
  const supportedExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm"]);
  
  async function walk(dir: string): Promise<void> {
    if (files.length >= count) return;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= count) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            try {
              const content = await fs.promises.readFile(fullPath, "utf-8");
              if (content.length > 100) {
                files.push({
                  path: fullPath,
                  name: entry.name,
                  text: content,
                });
              }
            } catch {
              // Skip unreadable files
            }
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  await walk(DOCUMENTS_PATH);
  return files;
}

/**
 * OLD APPROACH: Per-file chunking + Per-file embedding
 * This is how the original TypeScript implementation worked
 */
async function benchmarkOldApproach(files: LoadFileResult[], client: LMStudioClient): Promise<BenchmarkResult> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  OLD APPROACH: Per-file Chunking + Per-file Embedding   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  
  const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
  const totalStart = Date.now();
  
  let totalChunks = 0;
  let chunkingTime = 0;
  let embeddingTime = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Phase 1: Chunk this file (TypeScript)
    const chunkStart = Date.now();
    const chunks = tsChunkText(file.text, CHUNK_SIZE, CHUNK_OVERLAP);
    chunkingTime += Date.now() - chunkStart;
    totalChunks += chunks.length;
    
    if (chunks.length === 0) continue;
    
    // Phase 2: Embed chunks for this file (ONE API CALL PER FILE)
    const embedStart = Date.now();
    try {
      const chunkTexts = chunks.map(c => c.text);
      await embeddingModel.embed(chunkTexts);
    } catch (error) {
      console.error(`Embedding failed for ${file.name}:`, error);
    }
    embeddingTime += Date.now() - embedStart;
    
    // Progress
    if ((i + 1) % 10 === 0 || i === files.length - 1) {
      console.log(`  Processed ${i + 1}/${files.length} files...`);
    }
  }
  
  const totalTime = Date.now() - totalStart;
  
  return {
    name: "OLD: Per-file (TS)",
    fileCount: files.length,
    totalChunks,
    totalTimeMs: totalTime,
    chunkingTimeMs: chunkingTime,
    embeddingTimeMs: embeddingTime,
    chunksPerSec: (totalChunks / totalTime) * 1000,
    avgTimePerFile: totalTime / files.length,
    avgTimePerChunk: totalTime / totalChunks,
  };
}

/**
 * NEW APPROACH: Batch chunking + Single batch embedding
 * This is the optimized Rust-native implementation
 */
async function benchmarkNewApproach(files: LoadFileResult[], client: LMStudioClient): Promise<BenchmarkResult> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  NEW APPROACH: Batch Chunking + Single Batch Embedding  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  
  const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
  const totalStart = Date.now();
  
  // Phase 1: Batch chunk ALL files (single Rust call)
  console.log("  Chunking all files with Rust batch...");
  const chunkStart = Date.now();
  const texts = files.map(f => f.text);
  const batchResults = await nativeChunkTextsBatch(texts, CHUNK_SIZE, CHUNK_OVERLAP);
  
  // batchResults is a flat array of BatchChunkResult with fileIndex property
  // Group by file index
  const chunksByFile = new Map<number, any[]>();
  for (const result of batchResults) {
    let fileChunks = chunksByFile.get(result.fileIndex);
    if (!fileChunks) {
      fileChunks = [];
      chunksByFile.set(result.fileIndex, fileChunks);
    }
    fileChunks.push(result);
  }
  
  // Flatten all chunks
  const allChunks: { text: string; fileIndex: number }[] = [];
  for (const [fileIdx, chunks] of chunksByFile.entries()) {
    for (const chunk of chunks) {
      allChunks.push({ text: chunk.text, fileIndex: fileIdx });
    }
  }
  
  const chunkingTime = Date.now() - chunkStart;
  const totalChunks = allChunks.length;
  console.log(`  Created ${totalChunks} chunks from ${files.length} files`);
  
  // Phase 2: Single embedding call for ALL chunks
  console.log(`  Embedding all ${totalChunks} chunks in single batch...`);
  const embedStart = Date.now();
  try {
    const allTexts = allChunks.map(c => c.text);
    await embeddingModel.embed(allTexts);
  } catch (error) {
    console.error(`Batch embedding failed:`, error);
  }
  const embeddingTime = Date.now() - embedStart;
  
  const totalTime = Date.now() - totalStart;
  
  return {
    name: "NEW: Batch (Rust)",
    fileCount: files.length,
    totalChunks,
    totalTimeMs: totalTime,
    chunkingTimeMs: chunkingTime,
    embeddingTimeMs: embeddingTime,
    chunksPerSec: (totalChunks / totalTime) * 1000,
    avgTimePerFile: totalTime / files.length,
    avgTimePerChunk: totalTime / totalChunks,
  };
}

/**
 * HYBRID APPROACH: TypeScript chunking + Single batch embedding
 * Tests if batch embedding alone provides the speedup
 */
async function benchmarkHybridApproach(files: LoadFileResult[], client: LMStudioClient): Promise<BenchmarkResult> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  HYBRID: TS Chunking + Single Batch Embedding           ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  
  const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
  const totalStart = Date.now();
  
  // Phase 1: Chunk each file with TypeScript
  console.log("  Chunking files with TypeScript...");
  const chunkStart = Date.now();
  const allChunks: string[] = [];
  
  for (const file of files) {
    const chunks = tsChunkText(file.text, CHUNK_SIZE, CHUNK_OVERLAP);
    allChunks.push(...chunks.map(c => c.text));
  }
  
  const chunkingTime = Date.now() - chunkStart;
  const totalChunks = allChunks.length;
  console.log(`  Created ${totalChunks} chunks`);
  
  // Phase 2: Single embedding call for ALL chunks
  console.log(`  Embedding all ${totalChunks} chunks in single batch...`);
  const embedStart = Date.now();
  try {
    await embeddingModel.embed(allChunks);
  } catch (error) {
    console.error(`Batch embedding failed:`, error);
  }
  const embeddingTime = Date.now() - embedStart;
  
  const totalTime = Date.now() - totalStart;
  
  return {
    name: "HYBRID: TS + Batch Embed",
    fileCount: files.length,
    totalChunks,
    totalTimeMs: totalTime,
    chunkingTimeMs: chunkingTime,
    embeddingTimeMs: embeddingTime,
    chunksPerSec: (totalChunks / totalTime) * 1000,
    avgTimePerFile: totalTime / files.length,
    avgTimePerChunk: totalTime / totalChunks,
  };
}

function printComparison(results: BenchmarkResult[]) {
  console.log("\n" + "═".repeat(90));
  console.log("BENCHMARK COMPARISON - REAL LM STUDIO EMBEDDING API");
  console.log("═".repeat(90));
  
  const baseline = results[0];
  
  console.log(
    "Method".padEnd(25),
    "Total (ms)".padStart(12),
    "Chunk (ms)".padStart(11),
    "Embed (ms)".padStart(11),
    "Chunks".padStart(8),
    "Speedup".padStart(10)
  );
  console.log("-".repeat(90));
  
  for (const r of results) {
    const speedup = baseline.totalTimeMs / r.totalTimeMs;
    const chunkPercent = ((r.chunkingTimeMs / r.totalTimeMs) * 100).toFixed(1);
    const embedPercent = ((r.embeddingTimeMs / r.totalTimeMs) * 100).toFixed(1);
    
    console.log(
      r.name.padEnd(25),
      r.totalTimeMs.toFixed(0).padStart(12),
      `${r.chunkingTimeMs.toFixed(0)} (${chunkPercent}%)`.padStart(11),
      `${r.embeddingTimeMs.toFixed(0)} (${embedPercent}%)`.padStart(11),
      r.totalChunks.toString().padStart(8),
      `${speedup.toFixed(2)}x`.padStart(10)
    );
  }
  
  console.log("═".repeat(90));
  
  // Calculate speedup components
  const oldEmbedPerChunk = results[0].embeddingTimeMs / results[0].totalChunks;
  const newEmbedPerChunk = results[results.length - 1].embeddingTimeMs / results[results.length - 1].totalChunks;
  
  console.log("\n📊 ANALYSIS:");
  console.log(`   OLD embedding time per chunk: ${oldEmbedPerChunk.toFixed(2)}ms`);
  console.log(`   NEW embedding time per chunk: ${newEmbedPerChunk.toFixed(2)}ms`);
  console.log(`   Embedding speedup: ${(oldEmbedPerChunk / newEmbedPerChunk).toFixed(2)}x`);
  console.log(`   Overall speedup: ${(baseline.totalTimeMs / results[results.length - 1].totalTimeMs).toFixed(2)}x`);
  
  // Identify bottleneck
  const lastResult = results[results.length - 1];
  const bottleneck = lastResult.chunkingTimeMs > lastResult.embeddingTimeMs ? "Chunking" : "Embedding";
  const bottleneckPercent = Math.max(
    (lastResult.chunkingTimeMs / lastResult.totalTimeMs) * 100,
    (lastResult.embeddingTimeMs / lastResult.totalTimeMs) * 100
  );
  console.log(`   Current bottleneck: ${bottleneck} (${bottleneckPercent.toFixed(1)}%)`);
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║     BigRAG REAL Embedding Benchmark - LM Studio API           ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`Documents: ${DOCUMENTS_PATH}`);
  console.log(`LM Studio: ${LMSTUDIO_HOST}`);
  console.log(`Embedding Model: ${EMBEDDING_MODEL}`);
  console.log(`Chunk size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP}`);
  console.log(`Native Rust available: ${isNativeAvailable()}`);
  console.log(`Native chunking available: ${isNativeChunkingAvailable()}`);
  
  // Load test files
  console.log("\nLoading test files...");
  const files = await loadFiles(MAX_FILES);
  console.log(`Loaded ${files.length} files`);
  
  if (files.length === 0) {
    console.log("No files loaded, exiting.");
    return;
  }
  
  // Connect to LM Studio
  console.log(`\nConnecting to LM Studio at ${LMSTUDIO_HOST}...`);
  let client: LMStudioClient;
  try {
    client = new LMStudioClient({ 
      baseUrl: `ws://${LMSTUDIO_HOST}` 
    });
    
    // Test connection
    console.log("Testing embedding connection...");
    const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
    await embeddingModel.embed(["test"]);
    console.log("✓ LM Studio connection successful");
  } catch (error) {
    console.error(`✗ Failed to connect to LM Studio:`, error);
    console.log("\nMake sure LM Studio is running with embedding model loaded.");
    console.log("Start LM Studio and load an embedding model, then re-run this benchmark.");
    return;
  }
  
  const results: BenchmarkResult[] = [];
  
  // Run benchmarks
  console.log("\n" + "─".repeat(90));
  console.log("Starting benchmarks...");
  console.log("─".repeat(90));
  
  // 1. OLD approach
  results.push(await benchmarkOldApproach(files, client));
  
  // 2. HYBRID approach (TS chunking + batch embedding)
  results.push(await benchmarkHybridApproach(files, client));
  
  // 3. NEW approach (Rust batch chunking + batch embedding)
  if (isNativeAvailable()) {
    results.push(await benchmarkNewApproach(files, client));
  }
  
  // Print comparison
  printComparison(results);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    documentsPath: DOCUMENTS_PATH,
    lmStudioHost: LMSTUDIO_HOST,
    embeddingModel: EMBEDDING_MODEL,
    chunkSize: CHUNK_SIZE,
    overlap: CHUNK_OVERLAP,
    fileCount: files.length,
    nativeAvailable: isNativeAvailable(),
    results,
  };
  
  const reportPath = path.join(__dirname, "realEmbedBenchmark.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
