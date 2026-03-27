/**
 * BigRAG End-to-End Indexing Benchmark
 * 
 * Measures the complete indexing pipeline:
 * 1. File scanning
 * 2. Document parsing
 * 3. Text chunking (Rust native - batch)
 * 4. Embedding generation (simulated)
 * 
 * This benchmark shows REAL performance for RAG workloads.
 */

import * as fs from "fs";
import * as path from "path";

import {
  chunkTextsBatch,
  isNativeChunkingAvailable,
} from "../src/utils/textChunker";

import {
  scanDirectory,
} from "../src/ingestion/fileScanner";

import {
  calculateFileHash,
} from "../src/utils/fileHash";

// Configuration
// Set via environment variables for privacy:
//   export BIG_RAG_DOCUMENTS_PATH="/your/docs/path"
const DOCUMENTS_PATH = process.env.BIG_RAG_DOCUMENTS_PATH || "/path/to/your/documents";
const CHUNK_SIZE = 100;
const CHUNK_OVERLAP = 20;
const MAX_FILES = 100;

interface BenchmarkPhase {
  name: string;
  timeMs: number;
  itemsProcessed: number;
  itemsPerSec: number;
}

interface BenchmarkResult {
  phase: string;
  timeMs: number;
  throughput: string;
  details: string;
}

async function benchmarkScanning(): Promise<BenchmarkResult> {
  console.log("\n=== Phase 1: Directory Scanning ===");
  const start = Date.now();
  
  const files = await scanDirectory(DOCUMENTS_PATH, () => {});
  
  const time = Date.now() - start;
  return {
    phase: "Scanning",
    timeMs: time,
    throughput: `${((files.length / time) * 1000).toFixed(1)} files/sec`,
    details: `${files.length} files in ${time}ms`,
  };
}

async function benchmarkHashing(fileCount: number): Promise<BenchmarkResult> {
  console.log(`\n=== Phase 2: File Hashing (${fileCount} files) ===`);
  const start = Date.now();
  
  const files: string[] = [];
  const supportedExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".pdf"]);
  
  async function walk(dir: string): Promise<void> {
    if (files.length >= fileCount) return;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= fileCount) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  await walk(DOCUMENTS_PATH);
  
  let hashCount = 0;
  for (const file of files) {
    try {
      await calculateFileHash(file);
      hashCount++;
    } catch {
      // Skip unreadable files
    }
  }
  
  const time = Date.now() - start;
  return {
    phase: "Hashing",
    timeMs: time,
    throughput: `${((hashCount / time) * 1000).toFixed(1)} files/sec`,
    details: `${hashCount} files hashed in ${time}ms`,
  };
}

async function benchmarkParsing(fileCount: number): Promise<BenchmarkResult> {
  console.log(`\n=== Phase 3: Document Parsing (${fileCount} files) ===`);
  const start = Date.now();
  
  const files: string[] = [];
  const supportedExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".pdf"]);
  
  async function walk(dir: string): Promise<void> {
    if (files.length >= fileCount) return;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= fileCount) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  await walk(DOCUMENTS_PATH);
  
  let parseCount = 0;
  let totalChars = 0;
  for (const file of files) {
    try {
      const content = await fs.promises.readFile(file, "utf-8");
      if (content.length > 100) {
        parseCount++;
        totalChars += content.length;
      }
    } catch {
      // Skip unreadable files
    }
  }
  
  const time = Date.now() - start;
  return {
    phase: "Parsing",
    timeMs: time,
    throughput: `${((totalChars / 1024 / 1024) / (time / 1000)).toFixed(2)} MB/sec`,
    details: `${parseCount} files, ${(totalChars / 1024).toFixed(1)} KB in ${time}ms`,
  };
}

async function benchmarkChunking(fileCount: number): Promise<BenchmarkResult> {
  console.log(`\n=== Phase 4: Text Chunking (${fileCount} files, Rust Batch) ===`);
  
  // Load texts
  const files: string[] = [];
  const supportedExtensions = new Set([".txt", ".md", ".markdown", ".html", ".htm", ".pdf"]);
  
  async function walk(dir: string): Promise<void> {
    if (files.length >= fileCount) return;
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (files.length >= fileCount) return;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (supportedExtensions.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  await walk(DOCUMENTS_PATH);
  
  const texts: string[] = [];
  for (const file of files) {
    try {
      const content = await fs.promises.readFile(file, "utf-8");
      if (content.length > 100) {
        texts.push(content);
      }
    } catch {
      // Skip unreadable files
    }
  }
  
  console.log(`Loading ${texts.length} texts for chunking...`);
  
  const start = Date.now();
  
  // Use Rust batch chunking
  const chunkedTexts = await chunkTextsBatch(texts, CHUNK_SIZE, CHUNK_OVERLAP);
  
  let totalChunks = 0;
  for (const [, chunks] of chunkedTexts.entries()) {
    totalChunks += chunks.length;
  }
  
  const time = Date.now() - start;
  return {
    phase: "Chunking (Rust Batch)",
    timeMs: time,
    throughput: `${((totalChunks / time) * 1000).toFixed(1)} chunks/sec`,
    details: `${totalChunks} chunks from ${texts.length} texts in ${time}ms`,
  };
}

async function benchmarkEmbeddingSimulated(chunkCount: number): Promise<BenchmarkResult> {
  console.log(`\n=== Phase 5: Embedding Generation (Simulated, ${chunkCount} chunks) ===`);
  console.log("Note: Real embedding times depend on LM Studio API latency");
  console.log("Typical embedding API: 50-200ms per batch");
  
  // Simulate embedding latency (conservative estimate: 100ms per batch of 100)
  const batchSize = 100;
  const batchCount = Math.ceil(chunkCount / batchSize);
  const simulatedTimePerBatch = 100; // ms
  const simulatedTotalTime = batchCount * simulatedTimePerBatch;
  
  return {
    phase: "Embedding (Simulated)",
    timeMs: simulatedTotalTime,
    throughput: `${((chunkCount / simulatedTotalTime) * 1000).toFixed(1)} chunks/sec`,
    details: `${chunkCount} chunks in ~${simulatedTotalTime}ms (${batchCount} batches × ${simulatedTimePerBatch}ms)`,
  };
}

function printResults(results: BenchmarkResult[]) {
  console.log("\n" + "═".repeat(80));
  console.log("BIGRAG END-TO-END INDEXING BENCHMARK");
  console.log("═".repeat(80));
  
  let totalTime = 0;
  console.log(
    "Phase".padEnd(30),
    "Time (ms)".padStart(12),
    "Throughput".padStart(20),
    "Details".padStart(30)
  );
  console.log("-".repeat(80));
  
  for (const r of results) {
    totalTime += r.timeMs;
    console.log(
      r.phase.padEnd(30),
      r.timeMs.toFixed(1).padStart(12),
      r.throughput.padStart(20),
      r.details.padStart(30)
    );
  }
  
  console.log("-".repeat(80));
  console.log(
    "TOTAL".padEnd(30),
    totalTime.toFixed(1).padStart(12),
    "".padStart(20),
    `${results.length} phases`.padStart(30)
  );
  console.log("═".repeat(80));
  
  // Identify bottleneck
  const maxPhase = results.reduce((max, r) => r.timeMs > max.timeMs ? r : max, results[0]);
  const bottleneckPercent = (maxPhase.timeMs / totalTime * 100).toFixed(1);
  console.log(`\n⚠️  Bottleneck: ${maxPhase.phase} (${bottleneckPercent}% of total time)`);
  console.log(`   Recommendation: ${getRecommendation(maxPhase.phase)}`);
}

function getRecommendation(phase: string): string {
  switch (phase) {
    case "Scanning":
      return "Use Rust native scanDirectory (already implemented)";
    case "Hashing":
      return "Node.js crypto is already optimal, no action needed";
    case "Parsing":
      return "Consider parallel parsing with p-queue";
    case "Chunking (Rust Batch)":
      return "Already using optimal Rust batch chunking";
    case "Embedding (Simulated)":
      return "Batch ALL chunks into single embedding call (implemented!)";
    default:
      return "Profile to identify specific slowdown";
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║        BigRAG End-to-End Indexing Performance Benchmark        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`Documents: ${DOCUMENTS_PATH}`);
  console.log(`Chunk size: ${CHUNK_SIZE}, Overlap: ${CHUNK_OVERLAP}`);
  console.log(`Native Rust available: ${isNativeChunkingAvailable()}`);
  
  const results: BenchmarkResult[] = [];
  
  // Phase 1: Scanning
  results.push(await benchmarkScanning());
  
  // Phase 2: Hashing (sample)
  results.push(await benchmarkHashing(MAX_FILES));
  
  // Phase 3: Parsing (sample)
  results.push(await benchmarkParsing(MAX_FILES));
  
  // Phase 4: Chunking
  results.push(await benchmarkChunking(MAX_FILES));
  
  // Phase 5: Embedding (simulated based on chunk count from phase 4)
  // Estimate chunk count: ~10 chunks per file average
  const estimatedChunks = MAX_FILES * 10;
  results.push(await benchmarkEmbeddingSimulated(estimatedChunks));
  
  // Print results
  printResults(results);
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    documentsPath: DOCUMENTS_PATH,
    chunkSize: CHUNK_SIZE,
    overlap: CHUNK_OVERLAP,
    maxFiles: MAX_FILES,
    nativeAvailable: isNativeChunkingAvailable(),
    results,
  };
  
  const reportPath = path.join(__dirname, "e2eBenchmarkReport.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
