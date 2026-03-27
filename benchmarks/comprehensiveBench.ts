/**
 * BigRAG Comprehensive Benchmark Suite
 * 
 * Tests all plugin features:
 * 1. File Scanning (Rust vs TypeScript)
 * 2. PDF Parsing (pdf-parse vs LM Studio)
 * 3. Text Chunking (Rust batch vs TypeScript)
 * 4. Embedding (batch vs per-file)
 * 5. Vector Store (batch vs sequential)
 * 6. End-to-End Indexing
 * 
 * Usage: npx ts-node benchmarks/comprehensiveBench.ts
 */

import * as fs from "fs";
import * as path from "path";
import { LMStudioClient } from "@lmstudio/sdk";

// Configuration
const CONFIG = {
  documentsPath: process.env.BIG_RAG_DOCUMENTS_PATH || "/path/to/documents",
  vectorStorePath: process.env.BIG_RAG_VECTOR_STORE || "/path/to/vectorstore",
  lmStudioHost: process.env.BIG_RAG_LMSTUDIO_HOST || "localhost:1234",
  embeddingModel: process.env.BIG_RAG_EMBEDDING_MODEL || "nomic-ai/nomic-embed-text-v1.5-GGUF",
  chunkSize: 100,
  chunkOverlap: 20,
  maxFiles: 50,
};

interface BenchmarkResult {
  name: string;
  timeMs: number;
  itemsProcessed: number;
  throughput: string;
  details?: string;
}

// ============================================================================
// TEST 1: File Scanning
// ============================================================================

async function benchmarkFileScanning(): Promise<BenchmarkResult> {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: File Scanning Performance");
  console.log("=".repeat(60));

  const { scanDirectory } = await import("../src/ingestion/fileScanner");
  
  const start = Date.now();
  const files = await scanDirectory(CONFIG.documentsPath, () => {});
  const time = Date.now() - start;

  return {
    name: "File Scanning (Rust)",
    timeMs: time,
    itemsProcessed: files.length,
    throughput: `${((files.length / time) * 1000).toFixed(1)} files/sec`,
    details: `${files.length} files scanned`,
  };
}

// ============================================================================
// TEST 2: PDF Parsing
// ============================================================================

async function benchmarkPdfParsing(): Promise<BenchmarkResult[]> {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: PDF Parsing Performance");
  console.log("=".repeat(60));

  const { parseDocument } = await import("../src/parsers/documentParser");
  const { LMStudioClient } = await import("@lmstudio/sdk");
  
  // Find PDF files
  const allFiles: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".pdf")) {
        allFiles.push(fullPath);
      }
    }
  }
  await walk(CONFIG.documentsPath);
  const pdfFiles = allFiles.slice(0, 10); // Test with 10 PDFs

  if (pdfFiles.length === 0) {
    console.log("No PDF files found, skipping test");
    return [];
  }

  console.log(`Testing with ${pdfFiles.length} PDF files`);

  // Test pdf-parse (fast path)
  const client = new LMStudioClient({ baseUrl: `ws://${CONFIG.lmStudioHost}` });
  
  const startPdfParse = Date.now();
  let totalTextPdfParse = 0;
  for (const pdf of pdfFiles) {
    const result = await parseDocument(pdf, false, client);
    if (result.success) {
      totalTextPdfParse += result.document.text.length;
    }
  }
  const timePdfParse = Date.now() - startPdfParse;

  return [
    {
      name: "PDF Parsing (pdf-parse)",
      timeMs: timePdfParse,
      itemsProcessed: pdfFiles.length,
      throughput: `${((pdfFiles.length / timePdfParse) * 1000).toFixed(1)} files/sec`,
      details: `${(totalTextPdfParse / 1024).toFixed(1)} KB extracted`,
    },
  ];
}

// ============================================================================
// TEST 3: Text Chunking
// ============================================================================

async function benchmarkTextChunking(): Promise<BenchmarkResult[]> {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: Text Chunking Performance");
  console.log("=".repeat(60));

  const { chunkText } = await import("../src/utils/textChunker");
  const { chunkText: nativeChunkText, chunkTextsBatch, isNativeAvailable } = await import("../src/native");
  
  // Load test texts
  const texts: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (texts.length >= CONFIG.maxFiles) return;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".txt") || entry.name.endsWith(".md"))) {
        try {
          const content = await fs.promises.readFile(fullPath, "utf-8");
          if (content.length > 100) {
            texts.push(content);
          }
        } catch {}
      }
    }
  }
  await walk(CONFIG.documentsPath);

  if (texts.length === 0) {
    console.log("No text files found, skipping test");
    return [];
  }

  console.log(`Testing with ${texts.length} text files`);

  // TypeScript chunking
  const startTs = Date.now();
  let totalChunksTs = 0;
  for (const text of texts) {
    const chunks = chunkText(text, CONFIG.chunkSize, CONFIG.chunkOverlap);
    totalChunksTs += chunks.length;
  }
  const timeTs = Date.now() - startTs;

  // Native Rust chunking (per-file)
  let timeNative = 0;
  let totalChunksNative = 0;
  if (isNativeAvailable()) {
    const startNative = Date.now();
    for (const text of texts) {
      const chunks = nativeChunkText(text, CONFIG.chunkSize, CONFIG.chunkOverlap);
      totalChunksNative += chunks.length;
    }
    timeNative = Date.now() - startNative;
  }

  // Native Rust batch chunking
  let timeBatch = 0;
  let totalChunksBatch = 0;
  if (isNativeAvailable() && chunkTextsBatch) {
    const startBatch = Date.now();
    const batchResults = await chunkTextsBatch(texts, CONFIG.chunkSize, CONFIG.chunkOverlap);
    totalChunksBatch = batchResults.length;
    timeBatch = Date.now() - startBatch;
  }

  const results: BenchmarkResult[] = [
    {
      name: "Text Chunking (TypeScript)",
      timeMs: timeTs,
      itemsProcessed: totalChunksTs,
      throughput: `${((totalChunksTs / timeTs) * 1000).toFixed(1)} chunks/sec`,
      details: `${texts.length} files → ${totalChunksTs} chunks`,
    },
  ];

  if (isNativeAvailable()) {
    results.push({
      name: "Text Chunking (Native, per-file)",
      timeMs: timeNative,
      itemsProcessed: totalChunksNative,
      throughput: `${((totalChunksNative / timeNative) * 1000).toFixed(1)} chunks/sec`,
      details: `${texts.length} files → ${totalChunksNative} chunks`,
    });
  }

  if (isNativeAvailable() && chunkTextsBatch) {
    results.push({
      name: "Text Chunking (Native, batch)",
      timeMs: timeBatch,
      itemsProcessed: totalChunksBatch,
      throughput: `${((totalChunksBatch / timeBatch) * 1000).toFixed(1)} chunks/sec`,
      details: `${texts.length} files → ${totalChunksBatch} chunks`,
    });
  }

  return results;
}

// ============================================================================
// TEST 4: Embedding
// ============================================================================

async function benchmarkEmbedding(): Promise<BenchmarkResult[]> {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Embedding Performance");
  console.log("=".repeat(60));

  const client = new LMStudioClient({ baseUrl: `ws://${CONFIG.lmStudioHost}` });
  const embeddingModel = await client.embedding.model(CONFIG.embeddingModel);
  
  // Generate test chunks
  const testChunks: string[] = [];
  for (let i = 0; i < 50; i++) {
    testChunks.push(`Test chunk ${i}: ${"lorem ipsum ".repeat(50)}`);
  }

  console.log(`Testing with ${testChunks.length} chunks`);

  // Per-chunk embedding (OLD way)
  const startPerChunk = Date.now();
  let successPerChunk = 0;
  for (let i = 0; i < testChunks.length; i++) {
    try {
      await embeddingModel.embed([testChunks[i]]);
      successPerChunk++;
    } catch {}
  }
  const timePerChunk = Date.now() - startPerChunk;

  // Batch embedding (NEW way)
  const startBatch = Date.now();
  let successBatch = 0;
  try {
    await embeddingModel.embed(testChunks);
    successBatch = testChunks.length;
  } catch (error) {
    console.log("Batch embedding failed:", error);
  }
  const timeBatch = Date.now() - startBatch;

  return [
    {
      name: "Embedding (per-chunk)",
      timeMs: timePerChunk,
      itemsProcessed: successPerChunk,
      throughput: `${((successPerChunk / timePerChunk) * 1000).toFixed(1)} chunks/sec`,
      details: `${successPerChunk}/${testChunks.length} successful`,
    },
    {
      name: "Embedding (batch)",
      timeMs: timeBatch,
      itemsProcessed: successBatch,
      throughput: `${((successBatch / timeBatch) * 1000).toFixed(1)} chunks/sec`,
      details: `${successBatch}/${testChunks.length} successful`,
    },
  ];
}

// ============================================================================
// TEST 5: Vector Store
// ============================================================================

async function benchmarkVectorStore(): Promise<BenchmarkResult[]> {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 5: Vector Store Performance");
  console.log("=".repeat(60));

  const { VectorStore } = await import("../src/vectorstore/vectorStore");
  
  // Create test vector store
  const testDbPath = path.join(CONFIG.vectorStorePath, "benchmark-test");
  await fs.promises.rm(testDbPath, { recursive: true, force: true });
  
  const vectorStore = new VectorStore(testDbPath);
  await vectorStore.initialize();

  // Generate test chunks
  const testChunks = [];
  for (let i = 0; i < 100; i++) {
    testChunks.push({
      id: `test-${i}`,
      text: `Test chunk ${i}`,
      vector: Array(768).fill(0.1),
      filePath: `/test/file${Math.floor(i / 10)}.txt`,
      fileName: `file${Math.floor(i / 10)}.txt`,
      fileHash: `hash${Math.floor(i / 10)}`,
      chunkIndex: i % 10,
      metadata: { test: true },
    });
  }

  // Sequential addChunks (OLD way)
  const startSequential = Date.now();
  for (let i = 0; i < 10; i++) {
    const fileChunks = testChunks.slice(i * 10, (i + 1) * 10);
    await vectorStore.addChunks(fileChunks);
  }
  const timeSequential = Date.now() - startSequential;

  // Clean up for batch test
  await fs.promises.rm(testDbPath, { recursive: true, force: true });
  const vectorStore2 = new VectorStore(testDbPath);
  await vectorStore2.initialize();

  // Batch addChunks (NEW way)
  const startBatch = Date.now();
  await vectorStore2.addChunks(testChunks);
  const timeBatch = Date.now() - startBatch;

  // Clean up
  await fs.promises.rm(testDbPath, { recursive: true, force: true });

  return [
    {
      name: "Vector Store (sequential)",
      timeMs: timeSequential,
      itemsProcessed: testChunks.length,
      throughput: `${((testChunks.length / timeSequential) * 1000).toFixed(1)} chunks/sec`,
      details: "10 addChunks calls",
    },
    {
      name: "Vector Store (batch)",
      timeMs: timeBatch,
      itemsProcessed: testChunks.length,
      throughput: `${((testChunks.length / timeBatch) * 1000).toFixed(1)} chunks/sec`,
      details: "1 addChunks call",
    },
  ];
}

// ============================================================================
// TEST 6: End-to-End
// ============================================================================

async function benchmarkEndToEnd(): Promise<BenchmarkResult> {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 6: End-to-End Indexing");
  console.log("=".repeat(60));

  const { IndexManager } = await import("../src/ingestion/indexManager");
  const { VectorStore } = await import("../src/vectorstore/vectorStore");
  const { LMStudioClient } = await import("@lmstudio/sdk");
  
  // Clean up
  const testDbPath = path.join(CONFIG.vectorStorePath, "e2e-test");
  await fs.promises.rm(testDbPath, { recursive: true, force: true });

  const client = new LMStudioClient({ baseUrl: `ws://${CONFIG.lmStudioHost}` });
  const embeddingModel = await client.embedding.model(CONFIG.embeddingModel);
  const vectorStore = new VectorStore(testDbPath);
  await vectorStore.initialize();

  const indexManager = new IndexManager({
    documentsDir: CONFIG.documentsPath,
    vectorStore,
    vectorStoreDir: testDbPath,
    embeddingModel,
    client,
    chunkSize: CONFIG.chunkSize,
    chunkOverlap: CONFIG.chunkOverlap,
    maxConcurrent: 5,
    enableOCR: false,
    autoReindex: false,
    parseDelayMs: 0,
    onProgress: (progress) => {
      if (progress.status === "indexing") {
        console.log(`  Progress: ${progress.processedFiles}/${progress.totalFiles} files`);
      }
    },
  });

  const start = Date.now();
  const result = await indexManager.index();
  const time = Date.now() - start;

  // Clean up
  await fs.promises.rm(testDbPath, { recursive: true, force: true });

  return {
    name: "End-to-End Indexing",
    timeMs: time,
    itemsProcessed: result.successfulFiles,
    throughput: `${((result.successfulFiles / time) * 1000).toFixed(1)} files/sec`,
    details: `${result.successfulFiles} files, ${result.totalFiles} total`,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     BigRAG Comprehensive Benchmark Suite                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`Documents: ${CONFIG.documentsPath}`);
  console.log(`Vector Store: ${CONFIG.vectorStorePath}`);
  console.log(`LM Studio: ${CONFIG.lmStudioHost}`);

  const allResults: BenchmarkResult[] = [];

  // Run tests
  allResults.push(await benchmarkFileScanning());
  allResults.push(...await benchmarkPdfParsing());
  allResults.push(...await benchmarkTextChunking());
  allResults.push(...await benchmarkEmbedding());
  allResults.push(...await benchmarkVectorStore());
  allResults.push(await benchmarkEndToEnd());

  // Print summary
  console.log("\n" + "═".repeat(80));
  console.log("BENCHMARK SUMMARY");
  console.log("═".repeat(80));
  console.log(
    "Test".padEnd(35),
    "Time (ms)".padStart(10),
    "Throughput".padStart(20),
    "Details".padStart(25)
  );
  console.log("-".repeat(80));
  for (const r of allResults) {
    console.log(
      r.name.padEnd(35),
      r.timeMs.toFixed(0).padStart(10),
      r.throughput.padStart(20),
      (r.details || "").padStart(25)
    );
  }
  console.log("═".repeat(80));

  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    results: allResults,
  };

  const reportPath = path.join(__dirname, "comprehensiveBenchmark.json");
  await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
}

main().catch(console.error);
