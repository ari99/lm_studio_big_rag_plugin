/**
 * BigRAG Hybrid Batch Embedding Benchmark
 * 
 * Tests different batch sizes to find optimal embedding strategy.
 * Compares:
 * 1. Per-file embedding (many small API calls)
 * 2. Single batch embedding (one large API call)
 * 3. Hybrid batching (medium-sized batches)
 */

import * as fs from "fs";
import * as path from "path";
import { LMStudioClient } from "@lmstudio/sdk";

import {
  chunkText as tsChunkText,
} from "../src/utils/textChunker";

import {
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
const MAX_FILES = 50;
const MAX_RETRIES = 3;

// Batch sizes to test
const BATCH_SIZES = [1, 50, 100, 200, 500];

interface BenchmarkResult {
  name: string;
  batchSize: number;
  totalChunks: number;
  successfulChunks: number;
  totalTimeMs: number;
  chunkingTimeMs: number;
  embeddingTimeMs: number;
  apiCalls: number;
  chunksPerSec: number;
  successRate: number;
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

async function embedWithRetry(
  embeddingModel: any,
  texts: string[],
  retries: number = MAX_RETRIES
): Promise<any[] | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await embeddingModel.embed(texts);
    } catch (error: any) {
      if (i < retries - 1) {
        console.log(`      Retry ${i + 1}/${retries}...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

async function benchmarkWithBatchSize(
  files: LoadFileResult[],
  client: LMStudioClient,
  batchSize: number
): Promise<BenchmarkResult> {
  const isPerFile = batchSize === 1;
  const isSingleBatch = batchSize >= files.length * 20; // Assume ~20 chunks per file
  
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Batch Size: ${batchSize}${" ".repeat(44)}║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  
  const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
  const totalStart = Date.now();
  
  // Collect all chunks
  const allChunks: string[] = [];
  for (const file of files) {
    const chunks = tsChunkText(file.text, CHUNK_SIZE, CHUNK_OVERLAP);
    allChunks.push(...chunks.map(c => c.text));
  }
  
  const totalChunks = allChunks.length;
  let successfulChunks = 0;
  let chunkingTime = 0; // Included in file loading for simplicity
  let embeddingTime = 0;
  let apiCalls = 0;
  
  console.log(`  Total chunks: ${totalChunks}`);
  console.log(`  Batch size: ${batchSize}`);
  console.log(`  Expected API calls: ${Math.ceil(totalChunks / batchSize)}`);
  
  // Process in batches
  const embedStart = Date.now();
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    const result = await embedWithRetry(embeddingModel, batch);
    apiCalls++;
    
    if (result) {
      successfulChunks += batch.length;
    }
    
    // Progress
    const progress = Math.min(i + batchSize, allChunks.length);
    const percent = ((progress / allChunks.length) * 100).toFixed(0);
    if (apiCalls % 5 === 0 || progress === allChunks.length) {
      console.log(`  Progress: ${progress}/${allChunks.length} chunks (${percent}%), ${successfulChunks} successful...`);
    }
  }
  embeddingTime = Date.now() - embedStart;
  
  const totalTime = Date.now() - totalStart;
  const successRate = (successfulChunks / totalChunks) * 100;
  
  return {
    name: `Batch ${batchSize}`,
    batchSize,
    totalChunks,
    successfulChunks,
    totalTimeMs: totalTime,
    chunkingTimeMs: chunkingTime,
    embeddingTimeMs: embeddingTime,
    apiCalls,
    chunksPerSec: (successfulChunks / totalTime) * 1000,
    successRate,
  };
}

function printComparison(results: BenchmarkResult[]) {
  console.log("\n" + "═".repeat(100));
  console.log("BATCH SIZE COMPARISON");
  console.log("═".repeat(100));
  
  // Sort by batch size
  results.sort((a, b) => a.batchSize - b.batchSize);
  
  const baseline = results[0];
  
  console.log(
    "Batch Size".padEnd(12),
    "Total (ms)".padStart(10),
    "Success".padStart(10),
    "API Calls".padStart(10),
    "Chunks/s".padStart(10),
    "Speedup".padStart(10),
    "Reliability".padStart(12)
  );
  console.log("-".repeat(100));
  
  for (const r of results) {
    const speedup = baseline.totalTimeMs / r.totalTimeMs;
    const reliability = r.successRate >= 100 ? "✓" : r.successRate >= 50 ? "⚠" : "✗";
    
    console.log(
      r.batchSize.toString().padEnd(12),
      r.totalTimeMs.toFixed(0).padStart(10),
      `${r.successRate.toFixed(0)}%`.padStart(10),
      r.apiCalls.toString().padStart(10),
      r.chunksPerSec.toFixed(0).padStart(10),
      `${speedup.toFixed(2)}x`.padStart(10),
      `${reliability} ${r.successRate.toFixed(0)}%`.padStart(12)
    );
  }
  
  console.log("═".repeat(100));
  
  // Find best batch size
  const successfulResults = results.filter(r => r.successRate >= 100);
  if (successfulResults.length > 0) {
    const best = successfulResults.reduce((min, r) => r.totalTimeMs < min.totalTimeMs ? r : min);
    console.log(`\n🏆 Best batch size: ${best.batchSize} (${best.totalTimeMs}ms, ${best.chunksPerSec.toFixed(0)} chunks/sec)`);
    console.log(`   Speedup vs per-file: ${(best.totalTimeMs / baseline.totalTimeMs).toFixed(2)}x`);
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║     BigRAG Hybrid Batch Embedding Benchmark                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`Documents: ${DOCUMENTS_PATH}`);
  console.log(`LM Studio: ${LMSTUDIO_HOST} (BruceLeeSon)`);
  console.log(`Embedding Model: ${EMBEDDING_MODEL}`);
  console.log(`Chunk size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP}`);
  console.log(`Batch sizes to test: ${BATCH_SIZES.join(", ")}`);
  console.log(`Native Rust available: ${isNativeAvailable()}`);
  
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
    return;
  }
  
  const results: BenchmarkResult[] = [];
  
  console.log("\n" + "─".repeat(100));
  console.log("Starting benchmarks...");
  console.log("─".repeat(100));
  
  // Test each batch size
  for (const batchSize of BATCH_SIZES) {
    const result = await benchmarkWithBatchSize(files, client, batchSize);
    results.push(result);
    
    // Small delay between tests
    await new Promise(r => setTimeout(r, 500));
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
    batchSizesTested: BATCH_SIZES,
    results,
  };
  
  const reportPath = path.join(__dirname, "hybridEmbedBenchmark.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
