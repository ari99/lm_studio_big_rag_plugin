/**
 * End-to-End Indexing Benchmark
 * Measures full pipeline: Scan → Parse → Chunk → Embed → Index
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { VectorStore } from "../src/vectorstore/vectorStore";
import { IndexManager } from "../src/ingestion/indexManager";

// Create test documents
function createTestDocuments(baseDir: string, count: number, wordsPerDoc: number): string[] {
  const files: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const words: string[] = [];
    for (let j = 0; j < wordsPerDoc; j++) {
      words.push(`word${j}`);
    }
    const content = words.join(" ");
    
    const ext = [".txt", ".md", ".html"][i % 3];
    const filePath = path.join(baseDir, `doc_${i}${ext}`);
    fs.writeFileSync(filePath, content);
    files.push(filePath);
  }
  
  return files;
}

// Mock embedding model for benchmark (simulates API latency)
class MockEmbeddingModel {
  private latency: number;
  
  constructor(latencyMs: number = 10) {
    this.latency = latencyMs;
  }
  
  async embed(texts: string | string[]) {
    const textArray = Array.isArray(texts) ? texts : [texts];
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, this.latency));
    
    // Return mock embeddings (random vectors)
    return textArray.map(() => ({
      embedding: Array.from({ length: 768 }, () => Math.random()),
    }));
  }
}

// Benchmark helper
async function benchmark<T>(name: string, fn: () => T | Promise<T>): Promise<{ time: number; result: T }> {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  return { time, result };
}

async function runBenchmark() {
  console.log("=".repeat(60));
  console.log("END-TO-END INDEXING BENCHMARK");
  console.log("=".repeat(60));
  console.log();

  // Configuration
  const testCases = [
    { name: "Small", files: 20, wordsPerFile: 5000 },
    { name: "Medium", files: 50, wordsPerFile: 5000 },
    { name: "Large", files: 100, wordsPerFile: 5000 },
  ];

  const chunkSize = 100;
  const chunkOverlap = 20;
  const maxConcurrent = 5;
  const enableOCR = false;
  const parseDelayMs = 0;
  const mockEmbeddingLatency = 5; // ms per batch

  for (const testCase of testCases) {
    console.log("-".repeat(60));
    console.log(`Test: ${testCase.name} (${testCase.files} files × ${testCase.wordsPerFile} words)`);
    console.log("-".repeat(60));

    // Create temp directories
    const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), "bigrag-e2e-"));
    const docsDir = path.join(tempBase, "docs");
    const vectorStoreDir = path.join(tempBase, "vectorstore");
    
    fs.mkdirSync(docsDir, { recursive: true });

    try {
      // Create test documents
      console.log(`Creating ${testCase.files} test documents...`);
      const createResult = await benchmark("Create Docs", () => 
        createTestDocuments(docsDir, testCase.files, testCase.wordsPerFile)
      );
      console.log(`Document creation: ${createResult.time.toFixed(2)}ms`);
      console.log();

      // Initialize vector store
      console.log("Initializing vector store...");
      const vectorStore = new VectorStore(vectorStoreDir);
      await vectorStore.initialize();

      // Create mock embedding model
      const mockEmbeddingModel = new MockEmbeddingModel(mockEmbeddingLatency) as any;

      // Run indexing
      console.log("Running indexing pipeline...");
      const indexResult = await benchmark("Index Pipeline", async () => {
        const indexManager = new IndexManager({
          documentsDir: docsDir,
          vectorStore,
          vectorStoreDir,
          embeddingModel: mockEmbeddingModel,
          client: {} as any,
          chunkSize,
          chunkOverlap,
          maxConcurrent,
          enableOCR,
          autoReindex: false,
          parseDelayMs,
        });
        
        return await indexManager.index();
      });

      console.log();
      console.log(`Indexing time:    ${indexResult.time.toFixed(2)}ms`);
      console.log(`Total files:      ${indexResult.result.totalFiles}`);
      console.log(`Successful:       ${indexResult.result.successfulFiles}`);
      console.log(`Failed:           ${indexResult.result.failedFiles}`);
      console.log(`Skipped:          ${indexResult.result.skippedFiles}`);
      console.log();
      
      // Calculate throughput
      const filesPerSecond = (indexResult.result.successfulFiles / indexResult.time) * 1000;
      console.log(`Throughput:       ${filesPerSecond.toFixed(2)} files/second`);
      
      // Test retrieval
      console.log();
      console.log("Testing retrieval...");
      const searchResult = await benchmark("Vector Search", () => 
        vectorStore.search(Array.from({ length: 768 }, () => Math.random()), 5, 0.3)
      );
      console.log(`Search time:      ${searchResult.time.toFixed(2)}ms`);
      console.log(`Results found:    ${searchResult.result.length}`);

    } catch (error) {
      console.error(`Benchmark failed for ${testCase.name}:`, error);
    } finally {
      // Cleanup
      fs.rmSync(tempBase, { recursive: true, force: true });
    }
    
    console.log();
  }

  console.log("=".repeat(60));
  console.log("BENCHMARK COMPLETE");
  console.log("=".repeat(60));
}

runBenchmark().catch(console.error);
