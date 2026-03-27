#!/usr/bin/env node
"use strict";
/**
 * Complete benchmark runner
 * Runs all benchmarks and generates a report
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const benchmarks = [
    { name: "Hash Benchmark", script: "hashBench.ts" },
    { name: "Chunk Benchmark", script: "chunkBench.ts" },
    { name: "Scan Benchmark", script: "scanBench.ts" },
];
async function runScript(script) {
    return new Promise((resolve, reject) => {
        const proc = (0, child_process_1.spawn)("node", ["--loader", "ts-node/esm", script], {
            stdio: "inherit",
            shell: true,
        });
        proc.on("close", (code) => {
            if (code === 0) {
                resolve();
            }
            else {
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
    const report = {
        timestamp: new Date().toISOString(),
        nativeAvailable: false,
        results: [],
    };
    // Check if native module is available
    try {
        const { isNativeAvailable } = await Promise.resolve().then(() => __importStar(require("../src/native/index.js")));
        report.nativeAvailable = isNativeAvailable();
        console.log(`Native module available: ${report.nativeAvailable}`);
    }
    catch {
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
        }
        catch (error) {
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
//# sourceMappingURL=runAll.js.map