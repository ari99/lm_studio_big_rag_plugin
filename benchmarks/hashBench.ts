/**
 * Benchmark suite for file hashing
 * Compares TypeScript vs Rust native implementation performance
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";

// Import implementations
import { calculateFileHash as tsHashFile } from "../src/utils/fileHash";
import { hashFile as nativeHashFile, isNativeAvailable } from "../src/native";

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTimeMs: number;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  opsPerSec: number;
}

async function benchmarkHash(
  name: string,
  hashFn: (path: string) => Promise<string>,
  filePath: string,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const iterStart = Date.now();
    await hashFn(filePath);
    const iterEnd = Date.now();
    times.push(iterEnd - iterStart);
  }

  const totalTime = Date.now() - startTime;
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const opsPerSec = (iterations / totalTime) * 1000;

  return {
    name,
    iterations,
    totalTimeMs: totalTime,
    avgTimeMs: avgTime,
    minTimeMs: minTime,
    maxTimeMs: maxTime,
    opsPerSec,
  };
}

async function runBenchmarks() {
  console.log("=".repeat(60));
  console.log("File Hashing Benchmark");
  console.log("=".repeat(60));

  // Create test files of different sizes
  const testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bigrag-bench-"));
  
  const testFiles = [
    { name: "1KB", size: 1024 },
    { name: "10KB", size: 10240 },
    { name: "100KB", size: 102400 },
    { name: "1MB", size: 1024 * 1024 },
  ];

  const results: BenchmarkResult[] = [];

  for (const { name, size } of testFiles) {
    const filePath = path.join(testDir, `test_${name}.bin`);
    const content = Buffer.alloc(size, 0x42); // Fill with 'B'
    await fs.promises.writeFile(filePath, content);

    console.log(`\n--- Testing with ${name} file ---`);

    // TypeScript benchmark
    console.log("Running TypeScript implementation...");
    const tsResult = await benchmarkHash(
      `TypeScript (${name})`,
      tsHashFile,
      filePath,
      50
    );
    results.push(tsResult);
    console.log(`  Avg: ${tsResult.avgTimeMs.toFixed(2)}ms, Ops/sec: ${tsResult.opsPerSec.toFixed(1)}`);

    // Native benchmark
    if (isNativeAvailable()) {
      console.log("Running Native Rust implementation...");
      const nativeResult = await benchmarkHash(
        `Native Rust (${name})`,
        nativeHashFile,
        filePath,
        50
      );
      results.push(nativeResult);
      console.log(`  Avg: ${nativeResult.avgTimeMs.toFixed(2)}ms, Ops/sec: ${nativeResult.opsPerSec.toFixed(1)}`);

      // Calculate speedup
      const speedup = tsResult.avgTimeMs / nativeResult.avgTimeMs;
      console.log(`  Speedup: ${speedup.toFixed(2)}x faster`);
    } else {
      console.log("Native module not available, skipping native benchmark");
    }
  }

  // Cleanup
  await fs.promises.rm(testDir, { recursive: true, force: true });

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  
  for (const result of results) {
    console.log(
      `${result.name.padEnd(30)} | Avg: ${result.avgTimeMs.toFixed(2)}ms | Ops/sec: ${result.opsPerSec.toFixed(1)}`
    );
  }

  // Calculate overall speedup
  const tsResults = results.filter(r => r.name.includes("TypeScript"));
  const nativeResults = results.filter(r => r.name.includes("Native"));

  if (tsResults.length > 0 && nativeResults.length > 0) {
    const tsAvg = tsResults.reduce((sum, r) => sum + r.avgTimeMs, 0) / tsResults.length;
    const nativeAvg = nativeResults.reduce((sum, r) => sum + r.avgTimeMs, 0) / nativeResults.length;
    const overallSpeedup = tsAvg / nativeAvg;
    
    console.log(`\nOverall Speedup: ${overallSpeedup.toFixed(2)}x`);
  }
}

runBenchmarks().catch(console.error);
