"use strict";
/**
 * Benchmark suite for file hashing
 * Compares TypeScript vs Rust native implementation performance
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
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
// Import implementations
const fileHash_1 = require("../src/utils/fileHash");
const native_1 = require("../src/native");
async function benchmarkHash(name, hashFn, filePath, iterations = 100) {
    const times = [];
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
    const results = [];
    for (const { name, size } of testFiles) {
        const filePath = path.join(testDir, `test_${name}.bin`);
        const content = Buffer.alloc(size, 0x42); // Fill with 'B'
        await fs.promises.writeFile(filePath, content);
        console.log(`\n--- Testing with ${name} file ---`);
        // TypeScript benchmark
        console.log("Running TypeScript implementation...");
        const tsResult = await benchmarkHash(`TypeScript (${name})`, fileHash_1.calculateFileHash, filePath, 50);
        results.push(tsResult);
        console.log(`  Avg: ${tsResult.avgTimeMs.toFixed(2)}ms, Ops/sec: ${tsResult.opsPerSec.toFixed(1)}`);
        // Native benchmark
        if ((0, native_1.isNativeAvailable)()) {
            console.log("Running Native Rust implementation...");
            const nativeResult = await benchmarkHash(`Native Rust (${name})`, native_1.hashFile, filePath, 50);
            results.push(nativeResult);
            console.log(`  Avg: ${nativeResult.avgTimeMs.toFixed(2)}ms, Ops/sec: ${nativeResult.opsPerSec.toFixed(1)}`);
            // Calculate speedup
            const speedup = tsResult.avgTimeMs / nativeResult.avgTimeMs;
            console.log(`  Speedup: ${speedup.toFixed(2)}x faster`);
        }
        else {
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
        console.log(`${result.name.padEnd(30)} | Avg: ${result.avgTimeMs.toFixed(2)}ms | Ops/sec: ${result.opsPerSec.toFixed(1)}`);
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
//# sourceMappingURL=hashBench.js.map