/**
 * Benchmark suite for directory scanning
 * Compares TypeScript vs Rust native implementation performance
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Import implementations
import { scanDirectory as tsScanDir } from "../src/ingestion/fileScanner";
import { scanDirectory as nativeScanDir, isNativeAvailable } from "../src/native";

interface BenchmarkResult {
  name: string;
  filesScanned: number;
  totalTimeMs: number;
  filesPerSec: number;
}

async function createTestDirectoryStructure(
  baseDir: string,
  fileCount: number,
  depth: number = 2
): Promise<void> {
  const extensions = [".txt", ".md", ".html", ".pdf"];
  let filesCreated = 0;

  async function createFiles(dir: string, remainingDepth: number) {
    if (filesCreated >= fileCount) return;

    const filesInThisDir = Math.ceil(fileCount / Math.pow(10, remainingDepth));
    
    for (let i = 0; i < filesInThisDir && filesCreated < fileCount; i++) {
      const ext = extensions[Math.floor(Math.random() * extensions.length)];
      const fileName = `file_${filesCreated}${ext}`;
      const filePath = path.join(dir, fileName);
      await fs.promises.writeFile(filePath, `Content of file ${filesCreated}`);
      filesCreated++;
    }

    if (remainingDepth > 0) {
      const subdirs = Math.ceil(Math.sqrt(remainingDepth));
      for (let i = 0; i < subdirs; i++) {
        const subDir = path.join(dir, `subdir_${i}`);
        await fs.promises.mkdir(subDir);
        await createFiles(subDir, remainingDepth - 1);
      }
    }
  }

  await createFiles(baseDir, depth);
}

async function benchmarkScan(
  name: string,
  scanFn: (dir: string) => Promise<any[]>,
  dirPath: string
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  const files = await scanFn(dirPath);
  const totalTime = Date.now() - startTime;
  const filesPerSec = (files.length / totalTime) * 1000;

  return {
    name,
    filesScanned: files.length,
    totalTimeMs: totalTime,
    filesPerSec,
  };
}

async function runBenchmarks() {
  console.log("=".repeat(60));
  console.log("Directory Scanning Benchmark");
  console.log("=".repeat(60));

  const testConfigs = [
    { name: "100 files", files: 100 },
    { name: "500 files", files: 500 },
    { name: "1000 files", files: 1000 },
    { name: "5000 files", files: 5000 },
  ];

  const results: BenchmarkResult[] = [];

  for (const { name, files } of testConfigs) {
    console.log(`\n--- Testing with ${name} ---`);
    
    const testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bigrag-scan-bench-"));
    
    try {
      console.log(`Creating test directory structure...`);
      const createStart = Date.now();
      await createTestDirectoryStructure(testDir, files);
      const createTime = Date.now() - createStart;
      console.log(`  Created in ${createTime}ms`);

      // TypeScript benchmark
      console.log("Running TypeScript implementation...");
      const tsResult = await benchmarkScan(
        `TypeScript (${name})`,
        tsScanDir,
        testDir
      );
      results.push(tsResult);
      console.log(`  Time: ${tsResult.totalTimeMs.toFixed(2)}ms, Files/sec: ${tsResult.filesPerSec.toFixed(1)}`);

      // Native benchmark
      if (isNativeAvailable()) {
        console.log("Running Native Rust implementation...");
        const nativeResult = await benchmarkScan(
          `Native Rust (${name})`,
          nativeScanDir,
          testDir
        );
        results.push(nativeResult);
        console.log(`  Time: ${nativeResult.totalTimeMs.toFixed(2)}ms, Files/sec: ${nativeResult.filesPerSec.toFixed(1)}`);

        // Calculate speedup
        const speedup = tsResult.totalTimeMs / nativeResult.totalTimeMs;
        console.log(`  Speedup: ${speedup.toFixed(2)}x faster`);
      } else {
        console.log("Native module not available, skipping native benchmark");
      }
    } finally {
      // Cleanup
      await fs.promises.rm(testDir, { recursive: true, force: true });
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  
  for (const result of results) {
    console.log(
      `${result.name.padEnd(20)} | Time: ${result.totalTimeMs.toFixed(2)}ms | Files: ${result.filesScanned} | Files/sec: ${result.filesPerSec.toFixed(1)}`
    );
  }

  // Calculate overall speedup
  const tsResults = results.filter(r => r.name.includes("TypeScript"));
  const nativeResults = results.filter(r => r.name.includes("Native"));

  if (tsResults.length > 0 && nativeResults.length > 0) {
    const tsAvg = tsResults.reduce((sum, r) => sum + r.totalTimeMs, 0) / tsResults.length;
    const nativeAvg = nativeResults.reduce((sum, r) => sum + r.totalTimeMs, 0) / nativeResults.length;
    const overallSpeedup = tsAvg / nativeAvg;
    
    console.log(`\nOverall Speedup: ${overallSpeedup.toFixed(2)}x`);
  }
}

runBenchmarks().catch(console.error);
