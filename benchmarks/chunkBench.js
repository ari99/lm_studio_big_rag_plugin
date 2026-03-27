"use strict";
/**
 * Benchmark suite for text chunking
 * Compares TypeScript vs Rust native implementation performance
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Import implementations
const textChunker_1 = require("../src/utils/textChunker");
const native_1 = require("../src/native");
async function benchmarkChunk(name, chunkFn, text, chunkSize, overlap, iterations = 50) {
    const times = [];
    let totalChunks = 0;
    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
        const iterStart = Date.now();
        const chunks = chunkFn(text, chunkSize, overlap);
        const iterEnd = Date.now();
        times.push(iterEnd - iterStart);
        totalChunks += chunks.length;
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
        chunksProduced: totalChunks,
    };
}
function generateTestText(wordCount) {
    const words = [
        "the", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog",
        "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
        "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
        "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
        "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
    ];
    return Array.from({ length: wordCount }, () => words[Math.floor(Math.random() * words.length)]).join(" ");
}
async function runBenchmarks() {
    console.log("=".repeat(60));
    console.log("Text Chunking Benchmark");
    console.log("=".repeat(60));
    const testConfigs = [
        { name: "1K words", words: 1000 },
        { name: "10K words", words: 10000 },
        { name: "50K words", words: 50000 },
        { name: "100K words", words: 100000 },
    ];
    const chunkSize = 100;
    const overlap = 20;
    const results = [];
    for (const { name, words } of testConfigs) {
        console.log(`\nGenerating test text (${name})...`);
        const testText = generateTestText(words);
        console.log(`  Generated ${testText.length.toLocaleString()} characters`);
        // TypeScript benchmark
        console.log("Running TypeScript implementation...");
        const tsResult = await benchmarkChunk(`TypeScript (${name})`, textChunker_1.chunkText, testText, chunkSize, overlap, 30);
        results.push(tsResult);
        console.log(`  Avg: ${tsResult.avgTimeMs.toFixed(2)}ms, Chunks: ${tsResult.chunksProduced}, Ops/sec: ${tsResult.opsPerSec.toFixed(1)}`);
        // Native benchmark
        if ((0, native_1.isNativeAvailable)()) {
            console.log("Running Native Rust implementation...");
            const nativeResult = await benchmarkChunk(`Native Rust (${name})`, native_1.chunkText, testText, chunkSize, overlap, 30);
            results.push(nativeResult);
            console.log(`  Avg: ${nativeResult.avgTimeMs.toFixed(2)}ms, Chunks: ${nativeResult.chunksProduced}, Ops/sec: ${nativeResult.opsPerSec.toFixed(1)}`);
            // Calculate speedup
            const speedup = tsResult.avgTimeMs / nativeResult.avgTimeMs;
            console.log(`  Speedup: ${speedup.toFixed(2)}x faster`);
        }
        else {
            console.log("Native module not available, skipping native benchmark");
        }
    }
    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("Summary");
    console.log("=".repeat(60));
    for (const result of results) {
        console.log(`${result.name.padEnd(20)} | Avg: ${result.avgTimeMs.toFixed(2)}ms | Chunks: ${result.chunksProduced} | Ops/sec: ${result.opsPerSec.toFixed(1)}`);
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
//# sourceMappingURL=chunkBench.js.map