/**
 * Text Chunking Benchmark
 * Compares TypeScript vs Rust native implementation
 */

const { chunkText: tsChunkText } = require("../dist/utils/textChunker");

// Load native module directly
const path = require("path");
const { createRequire } = require("module");
const nativeRequire = createRequire(__filename);

let nativeModule;
let loadError = null;

try {
  nativeModule = nativeRequire("../native/bigrag-native.linux-x64-gnu.node");
} catch (e) {
  loadError = e;
}

function isNativeAvailable() {
  return nativeModule !== undefined;
}

const nativeChunkText = nativeModule?.chunkText;
const nativeChunkTextFast = nativeModule?.chunkTextFast;
const nativeChunkTextsParallel = nativeModule?.chunkTextsParallel;
const nativeChunkTextsBatch = nativeModule?.chunkTextsBatch;

// Generate test data
function generateTestText(wordCount) {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(`word${i}`);
  }
  return words.join(" ");
}

function generateTestDocuments(count, wordsPerDoc) {
  return Array.from({ length: count }, (_, i) => 
    generateTestText(wordsPerDoc)
  );
}

// Benchmark helper
async function benchmark(name, fn) {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  return { time, result };
}

async function runBenchmarks() {
  console.log("=".repeat(60));
  console.log("TEXT CHUNKING BENCHMARKS");
  console.log("=".repeat(60));
  console.log();

  const nativeAvailable = isNativeAvailable();
  console.log(`Native module available: ${nativeAvailable}`);
  console.log();

  const chunkSize = 100;
  const overlap = 20;

  // Test 1: Single document chunking
  console.log("-".repeat(60));
  console.log("Test 1: Single Document Chunking (10K words)");
  console.log("-".repeat(60));
  
  const singleText = generateTestText(10000);
  
  // TypeScript version
  const tsResult = await benchmark("TS", () => tsChunkText(singleText, chunkSize, overlap));
  console.log(`TypeScript:     ${tsResult.time.toFixed(2)}ms (${tsResult.result.length} chunks)`);
  
  if (nativeAvailable) {
    // Native version
    const nativeResult = await benchmark("Native", () => nativeChunkText(singleText, chunkSize, overlap));
    console.log(`Rust Native:    ${nativeResult.time.toFixed(2)}ms (${nativeResult.result.length} chunks)`);
    console.log(`Speedup:        ${(tsResult.time / nativeResult.time).toFixed(2)}x`);
    
    // Native fast version
    const fastResult = await benchmark("Native Fast", () => nativeChunkTextFast(singleText, chunkSize, overlap));
    console.log(`Rust Fast:      ${fastResult.time.toFixed(2)}ms (${fastResult.result.length} chunks)`);
    console.log(`Speedup (fast): ${(tsResult.time / fastResult.time).toFixed(2)}x`);
  }
  console.log();

  // Test 2: Multiple documents (sequential)
  console.log("-".repeat(60));
  console.log("Test 2: Multiple Documents Sequential (10 docs × 10K words)");
  console.log("-".repeat(60));
  
  const docs = generateTestDocuments(10, 10000);

  // TypeScript sequential
  const tsSeqResult = await benchmark("TS Sequential", () =>
    docs.map(doc => tsChunkText(doc, chunkSize, overlap))
  );
  console.log(`TypeScript:     ${tsSeqResult.time.toFixed(2)}ms`);

  let nativeSeqResult;
  if (nativeAvailable) {
    // Native sequential
    nativeSeqResult = await benchmark("Native Sequential", () =>
      docs.map(doc => nativeChunkText(doc, chunkSize, overlap))
    );
    console.log(`Rust Sequential:${nativeSeqResult.time.toFixed(2)}ms`);
    console.log(`Speedup:        ${(tsSeqResult.time / nativeSeqResult.time).toFixed(2)}x`);
  }
  console.log();

  // Test 4: Batch chunking (all docs in single call)
  console.log("-".repeat(60));
  console.log("Test 4: Batch Chunking (10 docs × 10K words, single FFI call)");
  console.log("-".repeat(60));

  let nativeParallelResult;
  if (nativeAvailable) {
    // Native parallel
    nativeParallelResult = await benchmark("Native Parallel", () =>
      nativeChunkTextsParallel(docs, chunkSize, overlap)
    );
    console.log(`Rust Parallel:  ${nativeParallelResult.time.toFixed(2)}ms`);
    console.log(`Speedup vs TS:  ${(tsSeqResult.time / nativeParallelResult.time).toFixed(2)}x`);
    if (nativeSeqResult) {
      console.log(`Speedup vs Seq: ${(nativeSeqResult.time / nativeParallelResult.time).toFixed(2)}x`);
    }
  }
  console.log();

  if (nativeAvailable && nativeChunkTextsBatch) {
    const batchResult = await benchmark("Native Batch", () =>
      nativeChunkTextsBatch(docs, chunkSize, overlap)
    );
    console.log(`Rust Batch:     ${batchResult.time.toFixed(2)}ms`);
    console.log(`Speedup vs TS:  ${(tsSeqResult.time / batchResult.time).toFixed(2)}x`);
    if (nativeParallelResult) {
      console.log(`Speedup vs Par: ${(nativeParallelResult.time / batchResult.time).toFixed(2)}x`);
    }
  }
  console.log();

  // Test 5: Large scale (50 docs)
  console.log("-".repeat(60));
  console.log("Test 5: Large Scale (50 docs × 10K words)");
  console.log("-".repeat(60));

  const largeDocs = generateTestDocuments(50, 10000);

  const tsLargeResult = await benchmark("TS Sequential", () =>
    largeDocs.map(doc => tsChunkText(doc, chunkSize, overlap))
  );
  console.log(`TypeScript:     ${tsLargeResult.time.toFixed(2)}ms`);

  if (nativeAvailable) {
    const nativeLargeParallel = await benchmark("Native Parallel", () =>
      nativeChunkTextsParallel(largeDocs, chunkSize, overlap)
    );
    console.log(`Rust Parallel:  ${nativeLargeParallel.time.toFixed(2)}ms`);
    console.log(`Speedup:        ${(tsLargeResult.time / nativeLargeParallel.time).toFixed(2)}x`);

    const nativeLargeBatch = await benchmark("Native Batch", () =>
      nativeChunkTextsBatch(largeDocs, chunkSize, overlap)
    );
    console.log(`Rust Batch:     ${nativeLargeBatch.time.toFixed(2)}ms`);
    console.log(`Speedup:        ${(tsLargeResult.time / nativeLargeBatch.time).toFixed(2)}x`);
  }
  console.log();

  console.log("=".repeat(60));
  console.log("BENCHMARK COMPLETE");
  console.log("=".repeat(60));
}

runBenchmarks().catch(console.error);
