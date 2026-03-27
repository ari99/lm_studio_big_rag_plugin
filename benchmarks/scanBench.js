"use strict";
/**
 * Benchmark suite for directory scanning
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
const fileScanner_1 = require("../src/ingestion/fileScanner");
const native_1 = require("../src/native");
async function createTestDirectoryStructure(baseDir, fileCount, depth = 2) {
    const extensions = [".txt", ".md", ".html", ".pdf"];
    let filesCreated = 0;
    async function createFiles(dir, remainingDepth) {
        if (filesCreated >= fileCount)
            return;
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
async function benchmarkScan(name, scanFn, dirPath) {
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
    const results = [];
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
            const tsResult = await benchmarkScan(`TypeScript (${name})`, fileScanner_1.scanDirectory, testDir);
            results.push(tsResult);
            console.log(`  Time: ${tsResult.totalTimeMs.toFixed(2)}ms, Files/sec: ${tsResult.filesPerSec.toFixed(1)}`);
            // Native benchmark
            if ((0, native_1.isNativeAvailable)()) {
                console.log("Running Native Rust implementation...");
                const nativeResult = await benchmarkScan(`Native Rust (${name})`, native_1.scanDirectory, testDir);
                results.push(nativeResult);
                console.log(`  Time: ${nativeResult.totalTimeMs.toFixed(2)}ms, Files/sec: ${nativeResult.filesPerSec.toFixed(1)}`);
                // Calculate speedup
                const speedup = tsResult.totalTimeMs / nativeResult.totalTimeMs;
                console.log(`  Speedup: ${speedup.toFixed(2)}x faster`);
            }
            else {
                console.log("Native module not available, skipping native benchmark");
            }
        }
        finally {
            // Cleanup
            await fs.promises.rm(testDir, { recursive: true, force: true });
        }
    }
    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("Summary");
    console.log("=".repeat(60));
    for (const result of results) {
        console.log(`${result.name.padEnd(20)} | Time: ${result.totalTimeMs.toFixed(2)}ms | Files: ${result.filesScanned} | Files/sec: ${result.filesPerSec.toFixed(1)}`);
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
//# sourceMappingURL=scanBench.js.map