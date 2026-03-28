/**
 * Embedding Benchmark Suite
 * 
 * Tests different embedding configurations to find the optimal setup:
 * - Single model vs multiple models
 * - Different batch sizes (100, 250, 500)
 * - Different concurrency levels (5, 10, 20)
 * 
 * Usage:
 *   npx ts-node benchmarks/embeddingBenchmark.ts
 */

import { LMStudioClient } from "@lmstudio/sdk";
import * as fs from "fs";
import * as path from "path";

// Benchmark configuration
const BENCHMARK_CONFIGS = [
  { name: "Single Model, Batch 100, Concurrency 5", modelCount: 1, batchSize: 100, concurrency: 5 },
  { name: "Single Model, Batch 250, Concurrency 10", modelCount: 1, batchSize: 250, concurrency: 10 },
  { name: "Single Model, Batch 500, Concurrency 20", modelCount: 1, batchSize: 500, concurrency: 20 },
  { name: "4 Models, Batch 100, Concurrency 5", modelCount: 4, batchSize: 100, concurrency: 5 },
  { name: "4 Models, Batch 250, Concurrency 10", modelCount: 4, batchSize: 250, concurrency: 10 },
  { name: "4 Models, Batch 500, Concurrency 20", modelCount: 4, batchSize: 500, concurrency: 20 },
];

const TEST_CHUNK_COUNT = 1000;
const EMBEDDING_MODEL_ID = "nomic-ai/nomic-embed-text-v1.5";

interface BenchmarkResult {
  configName: string;
  modelCount: number;
  batchSize: number;
  concurrency: number;
  totalTimeMs: number;
  chunksPerSecond: number;
  success: boolean;
  error?: string;
}

/**
 * Generate test chunks for benchmarking
 */
function generateTestChunks(count: number): string[] {
  const chunks: string[] = [];
  const sampleText = "The quick brown fox jumps over the lazy dog. ";
  
  for (let i = 0; i < count; i++) {
    // Generate chunks of varying lengths (50-200 words)
    const wordCount = 50 + Math.floor(Math.random() * 150);
    let chunk = "";
    for (let j = 0; j < wordCount; j++) {
      chunk += sampleText;
    }
    chunks.push(chunk.trim());
  }
  
  return chunks;
}

/**
 * Load multiple model instances
 */
async function loadModels(
  client: LMStudioClient,
  modelCount: number
): Promise<any[]> {
  const models: any[] = [];
  
  // Check already loaded models
  const loadedModels = await client.embedding.listLoaded();
  if (loadedModels.length >= modelCount) {
    console.log(`  Using ${modelCount} already loaded models`);
    return loadedModels.slice(0, modelCount);
  }
  
  // Use already loaded models first
  models.push(...loadedModels);
  
  // Load additional instances
  if (models.length === 0) {
    // Load first instance
    await client.embedding.load(EMBEDDING_MODEL_ID);
    const firstModel = await client.embedding.model(EMBEDDING_MODEL_ID);
    models.push(firstModel);
  }
  
  // Load remaining instances
  for (let i = models.length; i < modelCount; i++) {
    const instanceId = `benchmark-instance-${i + 1}`;
    try {
      const model = await client.embedding.load(EMBEDDING_MODEL_ID, { identifier: instanceId });
      models.push(model);
      console.log(`  Loaded model instance ${i + 1}/${modelCount}: ${instanceId}`);
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        const model = await client.embedding.model(instanceId);
        models.push(model);
      }
    }
  }
  
  return models;
}

/**
 * Run embedding benchmark for a specific configuration
 */
async function runBenchmark(
  client: LMStudioClient,
  config: typeof BENCHMARK_CONFIGS[0],
  chunks: string[]
): Promise<BenchmarkResult> {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${config.name}`);
  console.log(`${"=".repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    // Load models
    const models = await loadModels(client, config.modelCount);
    console.log(`  Using ${models.length} model(s)`);
    
    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < chunks.length; i += config.batchSize) {
      batches.push(chunks.slice(i, i + config.batchSize));
    }
    
    console.log(`  Created ${batches.length} batches of ${config.batchSize} chunks`);
    
    // Process batches with concurrency limit
    let completedBatches = 0;
    const results: any[] = [];
    const inFlight = new Map<number, Promise<any>>();
    let modelIndex = 0;
    
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      // Wait if we've hit concurrency limit
      while (inFlight.size >= config.concurrency) {
        await Promise.race(inFlight.values());
      }
      
      // Select model round-robin
      const model = models[modelIndex % models.length];
      modelIndex++;
      
      const batchPromise = (async () => {
        const batch = batches[batchIdx];
        const embedPromise = model.embed(batch);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Batch ${batchIdx} timeout after 120s`)), 120000)
        );
        return await Promise.race([embedPromise, timeoutPromise]);
      })();
      
      inFlight.set(batchIdx, batchPromise);
      
      batchPromise.then((result) => {
        results.push(...result);
        completedBatches++;
        inFlight.delete(batchIdx);
        
        if (completedBatches % 10 === 0) {
          console.log(`  Progress: ${completedBatches}/${batches.length} batches (${Math.round(completedBatches / batches.length * 100)}%)`);
        }
      });
    }
    
    // Wait for all batches to complete
    await Promise.all(inFlight.values());
    
    const totalTimeMs = Date.now() - startTime;
    const chunksPerSecond = Math.round((chunks.length / totalTimeMs) * 1000);
    
    console.log(`\n  Results:`);
    console.log(`    Total time: ${(totalTimeMs / 1000).toFixed(2)}s`);
    console.log(`    Chunks processed: ${results.length}`);
    console.log(`    Throughput: ${chunksPerSecond} chunks/second`);
    
    return {
      configName: config.name,
      modelCount: config.modelCount,
      batchSize: config.batchSize,
      concurrency: config.concurrency,
      totalTimeMs,
      chunksPerSecond,
      success: true,
    };
  } catch (error: any) {
    const totalTimeMs = Date.now() - startTime;
    console.error(`  ERROR: ${error.message}`);
    
    return {
      configName: config.name,
      modelCount: config.modelCount,
      batchSize: config.batchSize,
      concurrency: config.concurrency,
      totalTimeMs,
      chunksPerSecond: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Unload benchmark models
 */
async function unloadModels(client: LMStudioClient) {
  console.log("\nCleaning up benchmark models...");
  const loadedModels = await client.embedding.listLoaded();
  
  for (const model of loadedModels) {
    const info = await model.getInfo();
    if (info.modelKey?.includes("benchmark-instance")) {
      try {
        await model.unload();
        console.log(`  Unloaded: ${info.modelKey}`);
      } catch (e) {
        console.warn(`  Failed to unload ${info.modelKey}: ${e}`);
      }
    }
  }
}

/**
 * Save results to file
 */
function saveResults(results: BenchmarkResult[], outputPath: string) {
  const report = `# Embedding Benchmark Results

**Date:** ${new Date().toISOString()}
**Test Chunks:** ${TEST_CHUNK_COUNT}
**Model:** ${EMBEDDING_MODEL_ID}

## Results

| Configuration | Models | Batch Size | Concurrency | Time (s) | Chunks/sec | Success |
|--------------|--------|------------|-------------|----------|------------|---------|
${results.map(r => `| ${r.configName} | ${r.modelCount} | ${r.batchSize} | ${r.concurrency} | ${(r.totalTimeMs / 1000).toFixed(2)} | ${r.chunksPerSecond} | ${r.success ? "✅" : "❌"}`).join("\n")}

## Best Results

${(() => {
  const successful = results.filter(r => r.success);
  if (successful.length === 0) return "No successful benchmarks";
  
  const fastest = successful.reduce((a, b) => a.totalTimeMs < b.totalTimeMs ? a : b);
  const highestThroughput = successful.reduce((a, b) => a.chunksPerSecond > b.chunksPerSecond ? a : b);
  
  return `
**Fastest:** ${fastest.configName} - ${(fastest.totalTimeMs / 1000).toFixed(2)}s

**Highest Throughput:** ${highestThroughput.configName} - ${highestThroughput.chunksPerSecond} chunks/sec
`;
})()}

## Raw Data

\`\`\`json
${JSON.stringify(results, null, 2)}
\`\`\`
`;

  fs.writeFileSync(outputPath, report);
  console.log(`\nResults saved to: ${outputPath}`);
}

/**
 * Main benchmark runner
 */
async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║        BigRAG Embedding Benchmark Suite                   ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log(`\nTest chunks: ${TEST_CHUNK_COUNT}`);
  console.log(`Model: ${EMBEDDING_MODEL_ID}`);
  console.log(`Configurations to test: ${BENCHMARK_CONFIGS.length}`);
  
  const client = new LMStudioClient();
  const results: BenchmarkResult[] = [];
  const outputPath = path.join(__dirname, "BENCHMARK_EMBEDDING.md");
  
  try {
    // Generate test data
    console.log("\nGenerating test chunks...");
    const chunks = generateTestChunks(TEST_CHUNK_COUNT);
    console.log(`Generated ${chunks.length} test chunks`);
    
    // Run benchmarks
    for (const config of BENCHMARK_CONFIGS) {
      const result = await runBenchmark(client, config, chunks);
      results.push(result);
      
      // Small delay between benchmarks
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Save results
    saveResults(results, outputPath);
    
    // Print summary
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║                    BENCHMARK SUMMARY                      ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      const fastest = successful.reduce((a, b) => a.totalTimeMs < b.totalTimeMs ? a : b);
      const highestThroughput = successful.reduce((a, b) => a.chunksPerSecond > b.chunksPerSecond ? a : b);
      
      console.log(`\n🏆 Fastest: ${fastest.configName}`);
      console.log(`   Time: ${(fastest.totalTimeMs / 1000).toFixed(2)}s`);
      
      console.log(`\n⚡ Highest Throughput: ${highestThroughput.configName}`);
      console.log(`   ${highestThroughput.chunksPerSecond} chunks/second`);
    }
  } catch (error: any) {
    console.error("\nBenchmark failed:", error.message);
  } finally {
    // Cleanup
    await unloadModels(client);
    console.log("\nBenchmark complete!");
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main, BENCHMARK_CONFIGS, TEST_CHUNK_COUNT };
