/**
 * File Hashing Benchmark
 * Compares TypeScript crypto vs Rust native implementation
 */

import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { hashFile, hashFilesParallel, isNativeAvailable } from "../src/native";

// Generate test files
function createTestFile(dir: string, name: string, sizeKB: number): string {
  const filePath = path.join(dir, name);
  const buffer = Buffer.alloc(sizeKB * 1024);
  
  // Fill with random data
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.floor(Math.random() * 256);
  }
  
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

function createTestFiles(dir: string, count: number, sizeKB: number): string[] {
  return Array.from({ length: count }, (_, i) => 
    createTestFile(dir, `test_file_${i}.bin`, sizeKB)
  );
}

// TypeScript hash implementation (streaming)
async function hashFileTS(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

// TypeScript hash implementation (readFile - simpler)
async function hashFileTSReadFile(filePath: string): Promise<string> {
  const data = await fs.promises.readFile(filePath);
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

// Benchmark helper
async function benchmark<T>(name: string, fn: () => T | Promise<T>): Promise<{ time: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  return { time, result };
}

async function runBenchmarks() {
  console.log("=".repeat(60));
  console.log("FILE HASHING BENCHMARKS");
  console.log("=".repeat(60));
  console.log();

  const nativeAvailable = isNativeAvailable();
  console.log(`Native module available: ${nativeAvailable}`);
  console.log();

  // Create temp directory for test files
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bigrag-bench-"));
  console.log(`Test directory: ${tempDir}`);
  
  try {
    // Test 1: Small file (100KB)
    console.log("-".repeat(60));
    console.log("Test 1: Small File (100KB)");
    console.log("-".repeat(60));
    
    const smallFiles = createTestFiles(tempDir, 10, 100);
    
    // TypeScript streaming
    const tsStreamResult = await benchmark("TS Stream", async () => {
      const results = await Promise.all(smallFiles.map(f => hashFileTS(f)));
      return results;
    });
    console.log(`TypeScript Stream: ${tsStreamResult.time.toFixed(2)}ms`);
    
    // TypeScript readFile
    const tsReadResult = await benchmark("TS ReadFile", async () => {
      const results = await Promise.all(smallFiles.map(f => hashFileTSReadFile(f)));
      return results;
    });
    console.log(`TypeScript Read:   ${tsReadResult.time.toFixed(2)}ms`);
    
    if (nativeAvailable) {
      // Native single
      const nativeSingleResult = await benchmark("Native Single", async () => {
        const results = await Promise.all(smallFiles.map(f => hashFile(f)));
        return results;
      });
      console.log(`Rust Single:     ${nativeSingleResult.time.toFixed(2)}ms`);
      console.log(`Speedup vs best: ${(Math.min(tsStreamResult.time, tsReadResult.time) / nativeSingleResult.time).toFixed(2)}x`);
      
      // Native parallel
      const nativeParallelResult = await benchmark("Native Parallel", () => 
        hashFilesParallel(smallFiles)
      );
      console.log(`Rust Parallel:   ${nativeParallelResult.time.toFixed(2)}ms`);
      console.log(`Speedup vs best: ${(Math.min(tsStreamResult.time, tsReadResult.time) / nativeParallelResult.time).toFixed(2)}x`);
    }
    console.log();

    // Test 2: Medium file (1MB)
    console.log("-".repeat(60));
    console.log("Test 2: Medium File (1MB)");
    console.log("-".repeat(60));
    
    const mediumFiles = createTestFiles(tempDir, 10, 1024);
    
    const tsMediumStream = await benchmark("TS Stream", async () => {
      const results = await Promise.all(mediumFiles.map(f => hashFileTS(f)));
      return results;
    });
    console.log(`TypeScript Stream: ${tsMediumStream.time.toFixed(2)}ms`);
    
    const tsMediumRead = await benchmark("TS ReadFile", async () => {
      const results = await Promise.all(mediumFiles.map(f => hashFileTSReadFile(f)));
      return results;
    });
    console.log(`TypeScript Read:   ${tsMediumRead.time.toFixed(2)}ms`);
    
    if (nativeAvailable) {
      const nativeMediumSingle = await benchmark("Native Single", async () => {
        const results = await Promise.all(mediumFiles.map(f => hashFile(f)));
        return results;
      });
      console.log(`Rust Single:     ${nativeMediumSingle.time.toFixed(2)}ms`);
      
      const nativeMediumParallel = await benchmark("Native Parallel", () => 
        hashFilesParallel(mediumFiles)
      );
      console.log(`Rust Parallel:   ${nativeMediumParallel.time.toFixed(2)}ms`);
      console.log(`Speedup:         ${(Math.min(tsMediumStream.time, tsMediumRead.time) / nativeMediumParallel.time).toFixed(2)}x`);
    }
    console.log();

    // Test 3: Large file (10MB)
    console.log("-".repeat(60));
    console.log("Test 3: Large File (10MB)");
    console.log("-".repeat(60));
    
    const largeFiles = createTestFiles(tempDir, 5, 10240);
    
    const tsLargeStream = await benchmark("TS Stream", async () => {
      const results = await Promise.all(largeFiles.map(f => hashFileTS(f)));
      return results;
    });
    console.log(`TypeScript Stream: ${tsLargeStream.time.toFixed(2)}ms`);
    
    const tsLargeRead = await benchmark("TS ReadFile", async () => {
      const results = await Promise.all(largeFiles.map(f => hashFileTSReadFile(f)));
      return results;
    });
    console.log(`TypeScript Read:   ${tsLargeRead.time.toFixed(2)}ms`);
    
    if (nativeAvailable) {
      const nativeLargeSingle = await benchmark("Native Single", async () => {
        const results = await Promise.all(largeFiles.map(f => hashFile(f)));
        return results;
      });
      console.log(`Rust Single:     ${nativeLargeSingle.time.toFixed(2)}ms`);
      
      const nativeLargeParallel = await benchmark("Native Parallel", () => 
        hashFilesParallel(largeFiles)
      );
      console.log(`Rust Parallel:   ${nativeLargeParallel.time.toFixed(2)}ms`);
      console.log(`Speedup:         ${(Math.min(tsLargeStream.time, tsLargeRead.time) / nativeLargeParallel.time).toFixed(2)}x`);
    }
    console.log();

    // Test 4: Many small files (100 × 10KB)
    console.log("-".repeat(60));
    console.log("Test 4: Many Small Files (100 × 10KB)");
    console.log("-".repeat(60));
    
    const manySmallFiles = createTestFiles(tempDir, 100, 10);
    
    const tsManyStream = await benchmark("TS Stream", async () => {
      const results = await Promise.all(manySmallFiles.map(f => hashFileTS(f)));
      return results;
    });
    console.log(`TypeScript Stream: ${tsManyStream.time.toFixed(2)}ms`);
    
    if (nativeAvailable) {
      const nativeManyParallel = await benchmark("Native Parallel", () => 
        hashFilesParallel(manySmallFiles)
      );
      console.log(`Rust Parallel:   ${nativeManyParallel.time.toFixed(2)}ms`);
      console.log(`Speedup:         ${(tsManyStream.time / nativeManyParallel.time).toFixed(2)}x`);
    }
    console.log();

  } finally {
    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Cleaned up test directory`);
  }

  console.log("=".repeat(60));
  console.log("BENCHMARK COMPLETE");
  console.log("=".repeat(60));
}

runBenchmarks().catch(console.error);
