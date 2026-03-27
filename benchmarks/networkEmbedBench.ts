/**
 * BigRAG Network-Optimized Embedding Benchmark
 * 
 * Tests embedding performance over network (LM Link) with retry logic.
 * Compares per-file vs batch embedding approaches.
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
const DOCUMENTS_PATH = "/home/pickle/Storage/RAG_Pipeline_Docs";
const LMSTUDIO_HOST = "192.168.1.107:1234";  // BruceLeeSon server
const EMBEDDING_MODEL = "nomic-ai/nomic-embed-text-v1.5-GGUF";
const CHUNK_SIZE = 100;
const CHUNK_OVERLAP = 20;
const MAX_FILES = 50;  // Smaller for network stability
const MAX_RETRIES = 3;

interface BenchmarkResult {
  name: string;
  fileCount: number;
  totalChunks: number;
  successfulChunks: number;
  totalTimeMs: number;
  chunkingTimeMs: number;
  embeddingTimeMs: number;
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
        console.log(`    Embedding retry ${i + 1}/${retries}...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

/**
 * OLD APPROACH: Per-file embedding
 */
async function benchmarkOldApproach(files: LoadFileResult[], client: LMStudioClient): Promise<BenchmarkResult> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  OLD APPROACH: Per-file Chunking + Per-file Embedding   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  
  const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
  const totalStart = Date.now();
  
  let totalChunks = 0;
  let successfulChunks = 0;
  let chunkingTime = 0;
  let embeddingTime = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Chunk this file
    const chunkStart = Date.now();
    const chunks = tsChunkText(file.text, CHUNK_SIZE, CHUNK_OVERLAP);
    chunkingTime += Date.now() - chunkStart;
    totalChunks += chunks.length;
    
    if (chunks.length === 0) continue;
    
    // Embed chunks for this file (ONE API CALL PER FILE)
    const embedStart = Date.now();
    const chunkTexts = chunks.map(c => c.text);
    const result = await embedWithRetry(embeddingModel, chunkTexts);
    embeddingTime += Date.now() - embedStart;
    
    if (result) {
      successfulChunks += chunks.length;
    } else {
      console.log(`    ✗ Failed to embed ${file.name}`);
    }
    
    // Progress
    if ((i + 1) % 10 === 0 || i === files.length - 1) {
      console.log(`  Processed ${i + 1}/${files.length} files (${successfulChunks}/${totalChunks} chunks)...`);
    }
  }
  
  const totalTime = Date.now() - totalStart;
  const successRate = (successfulChunks / totalChunks) * 100;
  
  return {
    name: "OLD: Per-file",
    fileCount: files.length,
    totalChunks,
    successfulChunks,
    totalTimeMs: totalTime,
    chunkingTimeMs: chunkingTime,
    embeddingTimeMs: embeddingTime,
    chunksPerSec: (successfulChunks / totalTime) * 1000,
    successRate,
  };
}

/**
 * NEW APPROACH: Single batch embedding
 */
async function benchmarkNewApproach(files: LoadFileResult[], client: LMStudioClient): Promise<BenchmarkResult> {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║  NEW APPROACH: Batch Chunking + Single Batch Embedding  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  
  const embeddingModel = await client.embedding.model(EMBEDDING_MODEL);
  const totalStart = Date.now();
  
  // Phase 1: Batch chunk ALL files
  console.log("  Chunking all files with Rust batch...");
  const chunkStart = Date.now();
  const texts = files.map(f => f.text);
  const batchResults = await nativeChunkTextsBatch(texts, CHUNK_SIZE, CHUNK_OVERLAP);
  
  // Collect all chunk texts
  const allChunkTexts: string[] = [];
  for (const result of batchResults) {
    allChunkTexts.push(result.text);
  }
  
  const chunkingTime = Date.now() - chunkStart;
  const totalChunks = allChunkTexts.length;
  console.log(`  Created ${totalChunks} chunks from ${files.length} files`);
  
  // Phase 2: Single embedding call for ALL chunks
  console.log(`  Embedding all ${totalChunks} chunks in single batch...`);
  const embedStart = Date.now();
  const result = await embedWithRetry(embeddingModel, allChunkTexts, 5);
  const embeddingTime = Date.now() - embedStart;
  
  const successfulChunks = result ? totalChunks : 0;
  const totalTime = Date.now() - totalStart;
  const successRate = (successfulChunks / totalChunks) * 100;
  
  return {
    name: "NEW: Single Batch",
    fileCount: files.length,
    totalChunks,
    successfulChunks,
    totalTimeMs: totalTime,
    chunkingTimeMs: chunkingTime,
    embeddingTimeMs: embeddingTime,
    chunksPerSec: (successfulChunks / totalTime) * 1000,
    successRate,
  };
}

function printComparison(results: BenchmarkResult[]) {
  console.log("\n" + "═".repeat(95));
  console.log("BENCHMARK COMPARISON - LM STUDIO EMBEDDING (with retries)");
  console.log("═".repeat(95));
  
  const baseline = results[0];
  
  console.log(
    "Method".padEnd(20),
    "Total (ms)".padStart(10),
    "Success".padStart(10),
    "Chunk (ms)".padStart(10),
    "Embed (ms)".padStart(10),
    "Chunks/s".padStart(10),
    "Speedup".padStart(10)
  );
  console.log("-".repeat(95));
  
  for (const r of results) {
    const speedup = baseline.totalTimeMs / r.totalTimeMs;
    const chunkPercent = ((r.chunkingTimeMs / r.totalTimeMs) * 100).toFixed(1);
    const embedPercent = ((r.embeddingTimeMs / r.totalTimeMs) * 100).toFixed(1);
    
    console.log(
      r.name.padEnd(20),
      r.totalTimeMs.toFixed(0).padStart(10),
      `${r.successRate.toFixed(0)}%`.padStart(10),
      `${r.chunkingTimeMs.toFixed(0)} (${chunkPercent}%)`.padStart(10),
      `${r.embeddingTimeMs.toFixed(0)} (${embedPercent}%)`.padStart(10),
      r.chunksPerSec.toFixed(0).padStart(10),
      `${speedup.toFixed(2)}x`.padStart(10)
    );
  }
  
  console.log("═".repeat(95));
  
  // Analysis
  console.log("\n📊 ANALYSIS:");
  const oldResult = results[0];
  const newResult = results[results.length - 1];
  
  console.log(`   OLD: ${oldResult.totalChunks} chunks, ${oldResult.successfulChunks} successful (${oldResult.successRate.toFixed(0)}%)`);
  console.log(`   NEW: ${newResult.totalChunks} chunks, ${newResult.successfulChunks} successful (${newResult.successRate.toFixed(0)}%)`);
  console.log(`   Overall speedup: ${(oldResult.totalTimeMs / newResult.totalTimeMs).toFixed(2)}x`);
  
  // Reliability comparison
  if (oldResult.successRate < 100) {
    console.log(`   ⚠️  OLD approach had ${(100 - oldResult.successRate).toFixed(0)}% failure rate`);
  }
  if (newResult.successRate >= 100) {
    console.log(`   ✓ NEW approach was 100% reliable`);
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║     BigRAG Network-Optimized Embedding Benchmark              ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`Documents: ${DOCUMENTS_PATH}`);
  console.log(`LM Studio: ${LMSTUDIO_HOST} (BruceLeeSon)`);
  console.log(`Embedding Model: ${EMBEDDING_MODEL}`);
  console.log(`Chunk size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP}`);
  console.log(`Max retries: ${MAX_RETRIES}`);
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
  
  console.log("\n" + "─".repeat(95));
  console.log("Starting benchmarks...");
  console.log("─".repeat(95));
  
  // Run benchmarks
  results.push(await benchmarkOldApproach(files, client));
  results.push(await benchmarkNewApproach(files, client));
  
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
    maxRetries: MAX_RETRIES,
    results,
  };
  
  const reportPath = path.join(__dirname, "networkEmbedBenchmark.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
