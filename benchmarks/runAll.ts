#!/usr/bin/env node
/**
 * Complete benchmark runner
 * Runs all benchmarks and generates a report
 */

import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

const benchmarks = [
  { name: "Hash Benchmark", script: "hashBench.ts" },
  { name: "Chunk Benchmark", script: "chunkBench.ts" },
  { name: "Scan Benchmark", script: "scanBench.ts" },
];

async function runScript(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", ["--loader", "ts-node/esm", script], {
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       BigRAG Native Module Benchmark Suite               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  const report: {
    timestamp: string;
    nativeAvailable: boolean;
    results: Array<{ name: string; status: string }>;
  } = {
    timestamp: new Date().toISOString(),
    nativeAvailable: false,
    results: [],
  };

  // Check if native module is available
  try {
    const { isNativeAvailable } = await import("../src/native/index.js");
    report.nativeAvailable = isNativeAvailable();
    console.log(`Native module available: ${report.nativeAvailable}`);
  } catch {
    console.log("Native module not available (will use TypeScript fallbacks)");
  }

  console.log();

  // Run each benchmark
  for (const { name, script } of benchmarks) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Running: ${name}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      await runScript(path.join("benchmarks", script));
      report.results.push({ name, status: "success" });
    } catch (error) {
      console.error(`Failed to run ${name}:`, error);
      report.results.push({ name, status: "failed" });
    }
  }

  // Save report
  const reportPath = path.join("benchmarks", "report.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);

  console.log("\n" + "═".repeat(60));
  console.log("Benchmark suite completed!");
  console.log("═".repeat(60));
}

main().catch(console.error);
