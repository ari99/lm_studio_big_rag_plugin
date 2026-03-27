"use strict";
/**
 * Real-world benchmark using actual RAG data paths
 *
 * Vector Store:  /home/pickle/Storage/RAG DB
 * Documents:     /home/pickle/Storage/RAG_Pipeline_Docs
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
const path = __importStar(require("path"));
// Import implementations
const fileHash_1 = require("../src/utils/fileHash");
const textChunker_1 = require("../src/utils/textChunker");
const fileScanner_1 = require("../src/ingestion/fileScanner");
const native_1 = require("../src/native");
const DOCUMENTS_PATH = "/home/pickle/Storage/RAG_Pipeline_Docs";
const VECTOR_STORE_PATH = "/home/pickle/Storage/RAG DB";
async function benchmarkHashing(files, maxFiles = 50) {
    const testFiles = files.slice(0, maxFiles);
    const results = {};
    console.log(`\n--- Hashing Benchmark (${testFiles.length} files) ---`);
    // TypeScript
    console.log("Running TypeScript hashing...");
    const tsStart = Date.now();
    let tsTotal = 0;
    for (const file of testFiles) {
        try {
            const start = Date.now();
            await (0, fileHash_1.calculateFileHash)(file);
            tsTotal += Date.now() - start;
        }
        catch (e) {
            console.warn(`  Failed to hash ${file}:`, e.message);
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
    if ((0, native_1.isNativeAvailable)()) {
        console.log("Running Native Rust hashing...");
        const nativeStart = Date.now();
        let nativeTotal = 0;
        for (const file of testFiles) {
            try {
                const start = Date.now();
                await (0, native_1.hashFile)(file);
                nativeTotal += Date.now() - start;
            }
            catch (e) {
                console.warn(`  Failed to hash ${file}:`, e.message);
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
async function benchmarkChunking(files, maxFiles = 20) {
    const testFiles = files.slice(0, maxFiles);
    const results = {};
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
            const chunks = (0, textChunker_1.chunkText)(content, chunkSize, overlap);
            tsTotalTime += Date.now() - start;
            tsTotalChunks += chunks.length;
        }
        catch (e) {
            console.warn(`  Failed to chunk ${file}:`, e.message);
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
    if ((0, native_1.isNativeAvailable)()) {
        console.log("Running Native Rust chunking...");
        const nativeStart = Date.now();
        let nativeTotalChunks = 0;
        let nativeTotalTime = 0;
        for (const file of testFiles) {
            try {
                const content = await fs.promises.readFile(file, "utf-8");
                const start = Date.now();
                const chunks = (0, native_1.chunkText)(content, chunkSize, overlap);
                nativeTotalTime += Date.now() - start;
                nativeTotalChunks += chunks.length;
            }
            catch (e) {
                console.warn(`  Failed to chunk ${file}:`, e.message);
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
async function benchmarkScanning() {
    const results = {};
    console.log(`\n--- Scanning Benchmark (${DOCUMENTS_PATH}) ---`);
    // TypeScript
    console.log("Running TypeScript scanning...");
    const tsStart = Date.now();
    const tsFiles = await (0, fileScanner_1.scanDirectory)(DOCUMENTS_PATH);
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
    if ((0, native_1.isNativeAvailable)()) {
        console.log("Running Native Rust scanning...");
        const nativeStart = Date.now();
        const nativeFiles = await (0, native_1.scanDirectory)(DOCUMENTS_PATH);
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
    }
    catch {
        console.error(`Documents path does not exist: ${DOCUMENTS_PATH}`);
        console.log("Creating test data instead...");
        // Create test data
        await fs.promises.mkdir(DOCUMENTS_PATH, { recursive: true });
        for (let i = 0; i < 100; i++) {
            await fs.promises.writeFile(path.join(DOCUMENTS_PATH, `test_${i}.txt`), `Test content ${i}\n`.repeat(1000));
        }
    }
    // Check native availability
    console.log("Native module status:");
    console.log(`  Available: ${(0, native_1.isNativeAvailable)()}`);
    console.log(`  Hashing: ${(0, fileHash_1.isNativeHashingAvailable)()}`);
    console.log(`  Chunking: ${(0, textChunker_1.isNativeChunkingAvailable)()}`);
    console.log(`  Scanning: ${(0, fileScanner_1.isNativeScanningAvailable)()}`);
    console.log();
    // Get file list
    console.log("Scanning for files...");
    const files = await (0, fileScanner_1.scanDirectory)(DOCUMENTS_PATH);
    console.log(`Found ${files.length} files`);
    const filePaths = files.map(f => f.path);
    const report = {
        timestamp: new Date().toISOString(),
        documentsPath: DOCUMENTS_PATH,
        vectorStorePath: VECTOR_STORE_PATH,
        fileCount: files.length,
        nativeAvailable: (0, native_1.isNativeAvailable)(),
        benchmarks: {},
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
    if (!(0, native_1.isNativeAvailable)()) {
        console.log("\n⚠️  Native module not available. Install with:");
        console.log("   cd native && npm install && npm run build");
    }
}
main().catch(console.error);
//# sourceMappingURL=realWorldBench.js.map