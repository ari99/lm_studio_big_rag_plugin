/**
 * Real-world benchmark using actual RAG data paths
 * 
 * Vector Store:  /home/pickle/Storage/RAG DB
 * Documents:     /home/pickle/Storage/RAG_Pipeline_Docs
 */

import * as fs from "fs";
import * as path from "path";

// Import implementations
import { calculateFileHash as tsHashFile } from "../utils/fileHash";
import { chunkText as tsChunkText, isNativeChunkingAvailable } from "../utils/textChunker";
import { scanDirectory as tsScanDir, isNativeScanningAvailable } from "../ingestion/fileScanner";
import {
  hashFile as nativeHashFile,
  chunkText as nativeChunkText,
  scanDirectory as nativeScanDir,
  isNativeAvailable
} from "../native";

const DOCUMENTS_PATH = "/home/pickle/Storage/RAG_Pipeline_Docs";
const VECTOR_STORE_PATH = "/home/pickle/Storage/RAG DB";

interface BenchmarkStats {
  name: string;
  count: number;
  totalTimeMs: number;
  avgTimeMs: number;
  opsPerSec: number;
}

async function benchmarkHashing(files: string[], maxFiles: number = 50): Promise<{ ts?: BenchmarkStats; native?: BenchmarkStats }> {
  const testFiles = files.slice(0, maxFiles);
  const results: { ts?: BenchmarkStats; native?: BenchmarkStats } = {};

  console.log(`\n--- Hashing Benchmark (${testFiles.length} files) ---`);

  // TypeScript
  console.log("Running TypeScript hashing...");
  const tsStart = Date.now();
  let tsTotal = 0;
  
  for (const file of testFiles) {
    try {
      const start = Date.now();
      await tsHashFile(file);
      tsTotal += Date.now() - start;
    } catch (e) {
      console.warn(`  Failed to hash ${file}:`, (e as Error).message);
    }
  }
  const tsTime = Date.now() - tsStart;
  
  results.ts = {
    name: "TypeScript Hash",
    count: testFiles.length,
    totalTimeMs: tsTime,
    avgTimeMs: tsTotal / testFiles.length,
    opsPerSec: (testFiles.length / tsTime) * 1000,
  };
  console.log(`  Total: ${tsTime.toFixed(0)}ms, Avg: ${results.ts.avgTimeMs.toFixed(2)}ms/file, Ops/sec: ${results.ts.opsPerSec.toFixed(1)}`);

  // Native
  if (isNativeAvailable()) {
    console.log("Running Native Rust hashing...");
    const nativeStart = Date.now();
    let nativeTotal = 0;
    
    for (const file of testFiles) {
      try {
        const start = Date.now();
        await nativeHashFile(file);
        nativeTotal += Date.now() - start;
      } catch (e) {
        console.warn(`  Failed to hash ${file}:`, (e as Error).message);
      }
    }
    const nativeTime = Date.now() - nativeStart;
    
    results.native = {
      name: "Native Rust Hash",
      count: testFiles.length,
      totalTimeMs: nativeTime,
      avgTimeMs: nativeTotal / testFiles.length,
      opsPerSec: (testFiles.length / nativeTime) * 1000,
    };
    console.log(`  Total: ${nativeTime.toFixed(0)}ms, Avg: ${results.native.avgTimeMs.toFixed(2)}ms/file, Ops/sec: ${results.native.opsPerSec.toFixed(1)}`);
    
    const speedup = results.ts.avgTimeMs / results.native.avgTimeMs;
    console.log(`  Speedup: ${speedup.toFixed(2)}x`);
  }

  return results;
}

async function benchmarkChunking(files: string[], maxFiles: number = 20): Promise<{ ts?: BenchmarkStats; native?: BenchmarkStats }> {
  const testFiles = files.slice(0, maxFiles);
  const results: { ts?: BenchmarkStats; native?: BenchmarkStats } = {};

  console.log(`\n--- Chunking Benchmark (${testFiles.length} files) ---`);

  const chunkSize = 100;
  const overlap = 20;

  // TypeScript
  console.log("Running TypeScript chunking...");
  const tsStart = Date.now();
  let tsTotalChunks = 0;
  let tsTotalTime = 0;
  
  for (const file of testFiles) {
    try {
      const content = await fs.promises.readFile(file, "utf-8");
      const start = Date.now();
      const chunks = tsChunkText(content, chunkSize, overlap);
      tsTotalTime += Date.now() - start;
      tsTotalChunks += chunks.length;
    } catch (e) {
      console.warn(`  Failed to chunk ${file}:`, (e as Error).message);
    }
  }
  const tsTime = Date.now() - tsStart;
  
  results.ts = {
    name: "TypeScript Chunk",
    count: tsTotalChunks,
    totalTimeMs: tsTime,
    avgTimeMs: tsTotalTime / testFiles.length,
    opsPerSec: (testFiles.length / tsTime) * 1000,
  };
  console.log(`  Total: ${tsTime.toFixed(0)}ms, Chunks: ${tsTotalChunks}, Avg: ${results.ts.avgTimeMs.toFixed(2)}ms/file`);

  // Native
  if (isNativeAvailable()) {
    console.log("Running Native Rust chunking...");
    const nativeStart = Date.now();
    let nativeTotalChunks = 0;
    let nativeTotalTime = 0;
    
    for (const file of testFiles) {
      try {
        const content = await fs.promises.readFile(file, "utf-8");
        const start = Date.now();
        const chunks = nativeChunkText(content, chunkSize, overlap) as any[];
        nativeTotalTime += Date.now() - start;
        nativeTotalChunks += chunks.length;
      } catch (e) {
        console.warn(`  Failed to chunk ${file}:`, (e as Error).message);
      }
    }
    const nativeTime = Date.now() - nativeStart;
    
    results.native = {
      name: "Native Rust Chunk",
      count: nativeTotalChunks,
      totalTimeMs: nativeTime,
      avgTimeMs: nativeTotalTime / testFiles.length,
      opsPerSec: (testFiles.length / nativeTime) * 1000,
    };
    console.log(`  Total: ${nativeTime.toFixed(0)}ms, Chunks: ${nativeTotalChunks}, Avg: ${results.native.avgTimeMs.toFixed(2)}ms/file`);
    
    const speedup = results.ts.avgTimeMs / results.native.avgTimeMs;
    console.log(`  Speedup: ${speedup.toFixed(2)}x`);
  }

  return results;
}

async function benchmarkScanning(): Promise<{ ts?: BenchmarkStats; native?: BenchmarkStats }> {
  const results: { ts?: BenchmarkStats; native?: BenchmarkStats } = {};

  console.log(`\n--- Scanning Benchmark (${DOCUMENTS_PATH}) ---`);

  // TypeScript
  console.log("Running TypeScript scanning...");
  const tsStart = Date.now();
  const tsFiles = await tsScanDir(DOCUMENTS_PATH);
  const tsTime = Date.now() - tsStart;
  
  results.ts = {
    name: "TypeScript Scan",
    count: tsFiles.length,
    totalTimeMs: tsTime,
    avgTimeMs: tsTime / (tsFiles.length || 1),
    opsPerSec: (tsFiles.length / tsTime) * 1000,
  };
  console.log(`  Found: ${tsFiles.length} files, Time: ${tsTime.toFixed(0)}ms, Files/sec: ${results.ts.opsPerSec.toFixed(1)}`);

  // Native
  if (isNativeAvailable()) {
    console.log("Running Native Rust scanning...");
    const nativeStart = Date.now();
    const nativeFiles = await nativeScanDir(DOCUMENTS_PATH) as any[];
    const nativeTime = Date.now() - nativeStart;
    
    results.native = {
      name: "Native Rust Scan",
      count: nativeFiles.length,
      totalTimeMs: nativeTime,
      avgTimeMs: nativeTime / (nativeFiles.length || 1),
      opsPerSec: (nativeFiles.length / nativeTime) * 1000,
    };
    console.log(`  Found: ${nativeFiles.length} files, Time: ${nativeTime.toFixed(0)}ms, Files/sec: ${results.native.opsPerSec.toFixed(1)}`);
    
    const speedup = tsTime / nativeTime;
    console.log(`  Speedup: ${speedup.toFixed(2)}x`);
  }

  return results;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     BigRAG Real-World Benchmark (RAG Data Paths)         ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`Documents: ${DOCUMENTS_PATH}`);
  console.log(`Vector Store: ${VECTOR_STORE_PATH}`);
  console.log();

  // Check paths exist
  try {
    await fs.promises.access(DOCUMENTS_PATH);
  } catch {
    console.error(`Documents path does not exist: ${DOCUMENTS_PATH}`);
    console.log("Creating test data instead...");
    // Create test data
    await fs.promises.mkdir(DOCUMENTS_PATH, { recursive: true });
    for (let i = 0; i < 100; i++) {
      await fs.promises.writeFile(
        path.join(DOCUMENTS_PATH, `test_${i}.txt`),
        `Test content ${i}\n`.repeat(1000)
      );
    }
  }

  // Check native availability
  console.log("Native module status:");
  console.log(`  Available: ${isNativeAvailable()}`);
  console.log(`  Chunking: ${isNativeChunkingAvailable()}`);
  console.log(`  Scanning: ${isNativeScanningAvailable()}`);
  console.log();

  // Get file list
  console.log("Scanning for files...");
  const files = await tsScanDir(DOCUMENTS_PATH);
  console.log(`Found ${files.length} files`);
  const filePaths = files.map((f: { path: string }) => f.path);

  const report = {
    timestamp: new Date().toISOString(),
    documentsPath: DOCUMENTS_PATH,
    vectorStorePath: VECTOR_STORE_PATH,
    fileCount: files.length,
    nativeAvailable: isNativeAvailable(),
    benchmarks: {} as Record<string, any>,
  };

  // Run benchmarks
  report.benchmarks.hashing = await benchmarkHashing(filePaths);
  report.benchmarks.chunking = await benchmarkChunking(filePaths);
  report.benchmarks.scanning = await benchmarkScanning();

  // Save report
  const reportPath = path.join(__dirname, "../../benchmarks/realWorldReport.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("BENCHMARK SUMMARY");
  console.log("═".repeat(60));
  
  if (report.benchmarks.hashing.native) {
    const h = report.benchmarks.hashing;
    console.log(`Hashing:  ${(h.ts.avgTimeMs / h.native.avgTimeMs).toFixed(2)}x speedup`);
  }
  if (report.benchmarks.chunking.native) {
    const c = report.benchmarks.chunking;
    console.log(`Chunking: ${(c.ts.avgTimeMs / c.native.avgTimeMs).toFixed(2)}x speedup`);
  }
  if (report.benchmarks.scanning.native) {
    const s = report.benchmarks.scanning;
    console.log(`Scanning: ${(s.ts.totalTimeMs / s.native.totalTimeMs).toFixed(2)}x speedup`);
  }
  
  if (!isNativeAvailable()) {
    console.log("\n⚠️  Native module not available. Install with:");
    console.log("   cd native && npm install && npm run build");
  }
}

main().catch(console.error);
