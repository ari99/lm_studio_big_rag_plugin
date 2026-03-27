/**
 * Run All Benchmarks
 * Executes all benchmark suites and generates summary report
 */

import { execSync } from "child_process";
import * as path from "path";

const benchmarks = [
  { name: "Chunking", file: "chunkBench.ts" },
  { name: "Hashing", file: "hashBench.ts" },
  { name: "Scanning", file: "scanBench.ts" },
  { name: "End-to-End", file: "e2eBench.ts" },
];

console.log("=".repeat(60));
console.log("BIGRAG BENCHMARK SUITE");
console.log("=".repeat(60));
console.log();

const results: { name: string; success: boolean; output: string }[] = [];

for (const bench of benchmarks) {
  console.log(`Running ${bench.name} benchmark...`);
  console.log("-".repeat(60));
  
  try {
    const output = execSync(
      `node --loader ts-node/esm benchmarks/${bench.file}`,
      {
        encoding: "utf-8",
        cwd: path.join(__dirname, ".."),
        timeout: 300000, // 5 minute timeout per benchmark
      }
    );
    
    results.push({ name: bench.name, success: true, output });
    console.log(output);
  } catch (error: any) {
    const output = error.stdout || error.message;
    results.push({ name: bench.name, success: false, output });
    console.log(`FAILED: ${bench.name}`);
    console.log(output);
  }
  
  console.log();
}

// Generate summary
console.log("=".repeat(60));
console.log("SUMMARY");
console.log("=".repeat(60));
console.log();

for (const result of results) {
  const status = result.success ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} - ${result.name}`);
}

console.log();
console.log(`Passed: ${results.filter(r => r.success).length}/${results.length}`);
