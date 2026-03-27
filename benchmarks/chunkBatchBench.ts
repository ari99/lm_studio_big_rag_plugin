/**
 * Benchmark: Batch Chunking Performance - PURE NATIVE RUST
 * 
 * Tests only the native Rust implementation with real documents.
 * No TypeScript fallbacks, no mixed implementations.
 */

import * as fs from "fs";
import * as path from "path";

import {
  chunkText as nativeChunkText,
  chunkTextsParallel as nativeChunkTextsParallel,
  chunkTextsBatch as nativeChunkTextsBatch,
  isNativeAvailable,
} from "../src/native";

const DOCUMENTS_PATH = "/home/pickle/Storage/RAG_Pipeline_Docs";
const CHUNK_SIZE = 100;
const CHUNK_OVERLAP = 20;
const MAX_FILES = 500;

interface BenchmarkResult {
  name: string;
  fileCount: number;
  totalChunks: number;
  totalTimeMs: number;
  chunksPerSec: number;
  avgTimePerFile: number;
}

async function loadTestFiles(count: number): Promise<string[]> {
  const files: string[] = [];
  const supportedExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".pdf"]);
  
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
                files.push(content);
              }
            } catch (e) {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }
  
  try {
    await fs.promises.access(DOCUMENTS_PATH);
    await walk(DOCUMENTS_PATH);
  } catch (e) {
    console.log(`Documents path not accessible: ${e}`);
  }
  
  return files;
}

async function benchmarkNativeSequential(texts: string[]): Promise<BenchmarkResult> {
  console.log("\n=== Sequential Chunking (Native, per-file FFI) ===");
  const start = Date.now();
  let totalChunks = 0;
  
  for (const text of texts) {
    const chunks = nativeChunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
    totalChunks += chunks.length;
  }
  
  const time = Date.now() - start;
  return {
    name: "Sequential (Native)",
    fileCount: texts.length,
    totalChunks,
    totalTimeMs: time,
    chunksPerSec: (totalChunks / time) * 1000,
    avgTimePerFile: time / texts.length,
  };
}

async function benchmarkNativeParallel(texts: string[]): Promise<BenchmarkResult> {
  console.log("\n=== Parallel Chunking (Native, batch FFI) ===");
  const start = Date.now();
  const results = await nativeChunkTextsParallel(texts, CHUNK_SIZE, CHUNK_OVERLAP);
  const totalChunks = results.reduce((sum: number, chunks: any[]) => sum + chunks.length, 0);
  
  const time = Date.now() - start;
  return {
    name: "Parallel (Native)",
    fileCount: texts.length,
    totalChunks,
    totalTimeMs: time,
    chunksPerSec: (totalChunks / time) * 1000,
    avgTimePerFile: time / texts.length,
  };
}

async function benchmarkUltraBatch(texts: string[]): Promise<BenchmarkResult> {
  console.log("\n=== Ultra-Batch Chunking (Native, SINGLE FFI call) ===");
  const start = Date.now();
  const groupedResults = await nativeChunkTextsBatch(texts, CHUNK_SIZE, CHUNK_OVERLAP);
  const totalChunks = groupedResults.length;
  
  const time = Date.now() - start;
  return {
    name: "Ultra-Batch (Native)",
    fileCount: texts.length,
    totalChunks,
    totalTimeMs: time,
    chunksPerSec: (totalChunks / time) * 1000,
    avgTimePerFile: time / texts.length,
  };
}

function printResults(results: BenchmarkResult[]) {
  console.log("\n" + "═".repeat(70));
  console.log("BENCHMARK SUMMARY");
  console.log("═".repeat(70));
  console.log(
    "Method".padEnd(25),
    "Time (ms)".padStart(12),
    "Chunks".padStart(10),
    "Chunks/s".padStart(12),
    "Speedup".padStart(10)
  );
  console.log("-".repeat(70));
  
  const baseline = results[0];
  for (const r of results) {
    const speedup = baseline.totalTimeMs / r.totalTimeMs;
    console.log(
      r.name.padEnd(25),
      r.totalTimeMs.toFixed(1).padStart(12),
      r.totalChunks.toString().padStart(10),
      r.chunksPerSec.toFixed(0).padStart(12),
      `${speedup.toFixed(2)}x`.padStart(10)
    );
  }
  
  console.log("═".repeat(70));
  console.log(`Best speedup: ${(baseline.totalTimeMs / results[results.length - 1].totalTimeMs).toFixed(2)}x`);
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        BigRAG Pure Native Rust Chunking Benchmark        ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Chunk size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP}`);
  console.log(`Native available: ${isNativeAvailable()}`);

  // Load test files
  console.log("\nLoading test files...");
  const texts = await loadTestFiles(MAX_FILES);
  console.log(`Loaded ${texts.length} files from ${DOCUMENTS_PATH}`);

  if (texts.length === 0) {
    console.log("No files loaded, exiting.");
    return;
  }

  const results: BenchmarkResult[] = [];

  // Run benchmarks (Native Rust only)
  if (isNativeAvailable()) {
    results.push(await benchmarkNativeSequential(texts));
    results.push(await benchmarkNativeParallel(texts));
    results.push(await benchmarkUltraBatch(texts));
  }

  // Print results
  printResults(results);

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    chunkSize: CHUNK_SIZE,
    overlap: CHUNK_OVERLAP,
    fileCount: texts.length,
    documentsPath: DOCUMENTS_PATH,
    nativeAvailable: isNativeAvailable(),
    results,
  };

  const reportPath = path.join(__dirname, "chunkBatchReport.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
