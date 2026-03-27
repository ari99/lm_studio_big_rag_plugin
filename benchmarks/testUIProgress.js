/**
 * UI Progress Test
 * Tests the detailed progress updates for each indexing phase
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { VectorStore } = require("../dist/vectorstore/vectorStore");
const { IndexManager } = require("../dist/ingestion/indexManager");

// Create test documents
function createTestDocuments(baseDir, count, wordsPerDoc) {
  for (let i = 0; i < count; i++) {
    const words = [];
    for (let j = 0; j < wordsPerDoc; j++) {
      words.push(`word${j}`);
    }
    const content = words.join(" ");
    const ext = [".txt", ".md", ".html"][i % 3];
    const filePath = path.join(baseDir, `doc_${i}${ext}`);
    fs.writeFileSync(filePath, content);
  }
}

// Mock embedding model
class MockEmbeddingModel {
  async embed(texts) {
    await new Promise(resolve => setTimeout(resolve, 2)); // 2ms latency
    return Array.isArray(texts) ? texts.map(() => ({ embedding: Array.from({ length: 768 }, () => Math.random()) })) : [{ embedding: Array.from({ length: 768 }, () => Math.random()) }];
  }
}

async function runTest() {
  console.log("=".repeat(70));
  console.log("UI PROGRESS UPDATE TEST");
  console.log("=".repeat(70));
  console.log();

  const tempBase = fs.mkdtempSync(path.join(os.tmpdir(), "bigrag-ui-test-"));
  const docsDir = path.join(tempBase, "docs");
  const vectorStoreDir = path.join(tempBase, "vectorstore");
  
  fs.mkdirSync(docsDir, { recursive: true });

  try {
    // Create 30 test documents
    console.log("Creating 30 test documents...\n");
    createTestDocuments(docsDir, 30, 3000);

    // Initialize vector store
    const vectorStore = new VectorStore(vectorStoreDir);
    await vectorStore.initialize();

    // Mock embedding model
    const mockEmbeddingModel = new MockEmbeddingModel();

    // Progress callback that displays UI updates
    function onProgress(progress) {
      const icon = {
        scanning: "📂",
        parsing: "📄",
        chunking: "✂️",
        embedding: "🔮",
        indexing: "📊",
        complete: "✅",
        error: "❌",
      }[progress.status] || "⏳";

      const phaseInfo = progress.phase ? `[${progress.phase}]` : "";
      const phaseProgress = progress.phaseProgress || "";
      
      console.log(`${icon} ${phaseInfo} ${progress.currentFile}`);
      if (phaseProgress && phaseProgress !== progress.currentFile) {
        console.log(`   └─ ${phaseProgress}`);
      }
    }

    console.log("Starting indexing with UI progress updates:\n");

    const indexManager = new IndexManager({
      documentsDir: docsDir,
      vectorStore,
      vectorStoreDir,
      embeddingModel: mockEmbeddingModel,
      client: {},
      chunkSize: 100,
      chunkOverlap: 20,
      maxConcurrent: 5,
      enableOCR: false,
      autoReindex: false,
      parseDelayMs: 0,
      onProgress,
    });

    const result = await indexManager.index();

    console.log();
    console.log("=".repeat(70));
    console.log("INDEXING COMPLETE");
    console.log("=".repeat(70));
    console.log(`Total: ${result.totalFiles} | Success: ${result.successfulFiles} | Failed: ${result.failedFiles} | Skipped: ${result.skippedFiles}`);

  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
}

runTest().catch(console.error);
