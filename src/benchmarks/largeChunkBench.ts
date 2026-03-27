/**
 * Large-scale chunking benchmark with more data
 */

import * as fs from "fs";
import * as path from "path";

// Import implementations
import { chunkText as tsChunkText } from "../utils/textChunker";
import { 
  chunkText as nativeChunkText,
  chunkTextFast as nativeChunkTextFast,
  chunkTextsParallel,
  isNativeAvailable 
} from "../native";

const DOCUMENTS_PATH = "/home/pickle/Storage/RAG_Pipeline_Docs";

interface BenchmarkStats {
  name: string;
  totalChars: number;
  totalTimeMs: number;
  charsPerSec: number;
  chunksProduced: number;
}

async function benchmarkChunkingPure(
  name: string,
  chunkFn: (text: string, chunkSize: number, overlap: number) => any[],
  texts: string[],
  chunkSize: number,
  overlap: number,
  iterations: number
): Promise<BenchmarkStats> {
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0) * iterations;
  
  const startTime = Date.now();
  let totalChunks = 0;
  
  for (let i = 0; i < iterations; i++) {
    for (const text of texts) {
      const chunks = chunkFn(text, chunkSize, overlap);
      totalChunks += chunks.length;
    }
  }
  
  const totalTime = Date.now() - startTime;
  const charsPerSec = (totalChars / totalTime) * 1000;

  return {
    name,
    totalChars,
    totalTimeMs: totalTime,
    charsPerSec,
    chunksProduced: totalChunks,
  };
}

async function benchmarkChunkingParallel(
  name: string,
  chunkFn: (texts: string[], chunkSize: number, overlap: number) => Promise<any[][]>,
  texts: string[],
  chunkSize: number,
  overlap: number,
  iterations: number
): Promise<BenchmarkStats> {
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0) * iterations;
  
  const startTime = Date.now();
  let totalChunks = 0;
  
  for (let i = 0; i < iterations; i++) {
    const allChunks = await chunkFn(texts, chunkSize, overlap);
    totalChunks += allChunks.reduce((sum, c) => sum + c.length, 0);
  }
  
  const totalTime = Date.now() - startTime;
  const charsPerSec = (totalChars / totalTime) * 1000;

  return {
    name,
    totalChars,
    totalTimeMs: totalTime,
    charsPerSec,
    chunksProduced: totalChunks,
  };
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║      Large-Scale Chunking Benchmark (5 iterations)       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  console.log(`Native module available: ${isNativeAvailable()}`);
  console.log();

  // Load ALL text/markdown files into memory
  console.log("Loading ALL text files into memory...");
  const tsFiles = await import("../ingestion/fileScanner").then(m => m.scanDirectory(DOCUMENTS_PATH));
  
  const testTexts: string[] = [];
  
  for (const file of tsFiles) {
    if (file.extension === ".txt" || file.extension === ".md") {
      try {
        const content = await fs.promises.readFile(file.path, "utf-8");
        if (content.length > 500) {
          testTexts.push(content);
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }

  const totalChars = testTexts.reduce((sum, t) => sum + t.length, 0);
  console.log(`Loaded ${testTexts.length} files, ${totalChars.toLocaleString()} characters`);
  console.log();

  const chunkSize = 100;
  const overlap = 20;
  const iterations = 5; // Run 5 iterations to amplify differences

  console.log(`Running ${iterations} iterations...`);
  console.log();

  const results: BenchmarkStats[] = [];

  // TypeScript benchmark
  console.log("Running TypeScript chunking...");
  const tsResult = await benchmarkChunkingPure(
    "TypeScript",
    tsChunkText,
    testTexts,
    chunkSize,
    overlap,
    iterations
  );
  results.push(tsResult);
  console.log(`  Time: ${tsResult.totalTimeMs.toFixed(0)}ms, Chars/sec: ${tsResult.charsPerSec.toLocaleString()}, Chunks: ${tsResult.chunksProduced}`);

  // Native Rust - sequential
  if (isNativeAvailable()) {
    console.log("Running Native Rust chunking (sequential)...");
    const nativeResult = await benchmarkChunkingPure(
      "Native Rust (seq)",
      nativeChunkText,
      testTexts,
      chunkSize,
      overlap,
      iterations
    );
    results.push(nativeResult);
    console.log(`  Time: ${nativeResult.totalTimeMs.toFixed(0)}ms, Chars/sec: ${nativeResult.charsPerSec.toLocaleString()}, Chunks: ${nativeResult.chunksProduced}`);
    
    const speedup = tsResult.totalTimeMs / nativeResult.totalTimeMs;
    console.log(`  Speedup: ${speedup.toFixed(2)}x`);
    console.log();

    // Native Rust - fast (no metadata)
    console.log("Running Native Rust chunking (fast, no metadata)...");
    const nativeFastResult = await benchmarkChunkingPure(
      "Native Rust (fast)",
      nativeChunkTextFast,
      testTexts,
      chunkSize,
      overlap,
      iterations
    );
    results.push(nativeFastResult);
    console.log(`  Time: ${nativeFastResult.totalTimeMs.toFixed(0)}ms, Chars/sec: ${nativeFastResult.charsPerSec.toLocaleString()}, Chunks: ${nativeFastResult.chunksProduced}`);
    
    const fastSpeedup = tsResult.totalTimeMs / nativeFastResult.totalTimeMs;
    console.log(`  Speedup: ${fastSpeedup.toFixed(2)}x`);
    console.log();

    // Native Rust - parallel
    console.log("Running Native Rust chunking (parallel)...");
    const nativeParallelResult = await benchmarkChunkingParallel(
      "Native Rust (parallel)",
      chunkTextsParallel,
      testTexts,
      chunkSize,
      overlap,
      iterations
    );
    results.push(nativeParallelResult);
    console.log(`  Time: ${nativeParallelResult.totalTimeMs.toFixed(0)}ms, Chars/sec: ${nativeParallelResult.charsPerSec.toLocaleString()}, Chunks: ${nativeParallelResult.chunksProduced}`);
    
    const parallelSpeedup = tsResult.totalTimeMs / nativeParallelResult.totalTimeMs;
    console.log(`  Speedup: ${parallelSpeedup.toFixed(2)}x`);
  }

  // Print summary
  console.log("\n" + "═".repeat(60));
  console.log("SUMMARY");
  console.log("═".repeat(60));
  
  for (const result of results) {
    const relativeSpeedup = result.totalTimeMs > 0 ? tsResult.totalTimeMs / result.totalTimeMs : 0;
    console.log(
      `${result.name.padEnd(25)} | Time: ${result.totalTimeMs.toFixed(0)}ms | Chars/sec: ${result.charsPerSec.toLocaleString()} | ${relativeSpeedup.toFixed(2)}x`
    );
  }

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    testFiles: testTexts.length,
    totalChars,
    iterations,
    chunkSize,
    overlap,
    results: results.map(r => ({
      ...r,
      speedup: tsResult.totalTimeMs / r.totalTimeMs,
    })),
  };

  const reportPath = path.join(__dirname, "../../benchmarks/largeChunkReport.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
