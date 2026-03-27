# BigRAG Plugin for LM Studio - Rust Accelerated

A high-performance RAG (Retrieval-Augmented Generation) plugin for LM Studio that can index and search through large document collections. **Rust-accelerated** with native optimizations for maximum throughput.

**Original:** [ari99/lm_studio_big_rag_plugin](https://github.com/ari99/lm_studio_big_rag_plugin)
**Rust Acceleration by:** [ViswaaTheMightyPickle](https://github.com/ViswaaTheMightyPickle)

---

## Performance Improvements

This fork introduces **massive speedups** through optimized batch embedding and Rust-native acceleration:

### Individual Optimization Speedups

| Optimization | Speedup | Description |
|--------------|---------|-------------|
| **Rust Directory Scanning** | **4-10x** | Parallel directory traversal |
| **Rust File Hashing** | **1.2-4.5x** | Parallel SHA-256 with mmap I/O |
| **Rust Text Chunking** | **1.4-3.2x** | Native Rust with Rayon parallelism |
| **Batch Embedding** | **2.71x** | Optimal batch size (50 chunks) reduces API overhead |

### FULL Cumulative Speedup

When all optimizations work together in the complete pipeline:

| Scenario | TypeScript | Rust-Accelerated | **Full Speedup** |
|----------|------------|------------------|------------------|
| **Small (20 files)** | ~1,200ms | 322ms | **3.7x faster** |
| **Medium (50 files)** | ~2,800ms | 650ms | **4.3x faster** |
| **Large (100 files)** | ~5,500ms | 1,258ms | **4.4x faster** |

**Real-world results** (50 files, 567 chunks, LM Link network):
- **Before (TypeScript):** 9,473ms
- **After (Rust + Batch):** 3,492ms
- **Speedup:** **2.71x**

> **Note:** Full speedup is calculated by multiplying individual optimization speedups: `10x (scan) × 4x (hash) × 1.4x (chunk) × 2.7x (embed) = ~150x` theoretical max. Real-world shows **3-4x** due to parsing bottlenecks and network latency.

See [BENCHMARK_RESULTS.md](BENCHMARK_RESULTS.md) for detailed benchmarks.

---

## Features

- **Rust-Native Acceleration**: Native Rust module for text chunking, hashing, and directory scanning
- **Optimized Embedding**: Batch embedding with optimal batch size (50 chunks) for network efficiency
- **Real-time UI Progress**: Detailed progress updates for each indexing phase
- **Massive Scale**: Handle GB to TB-scale document collections
- **Deep Directory Scanning**: Recursively scans all subdirectories
- **Multiple File Formats**: PDF, EPUB, TXT, Markdown, HTML, images (with OCR)
- **Incremental Indexing**: Automatically detects and skips already-indexed files
- **Persistent Storage**: Vector embeddings stored locally with sharded indexes
- **LM Link Support**: Optimized for remote embedding via LM Link

---

## Supported File Types

| Category | Extensions |
|----------|------------|
| **Documents** | PDF, EPUB, TXT, TEXT |
| **Markdown** | MD, MDX, Markdown, MDown, MKD, MKDN |
| **Web Content** | HTM, HTML, XHTML |
| **Images** (OCR) | BMP, JPEG, JPG, PNG |

---

## Installation

### Prerequisites

Before installing, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Rust** installed for building native module ([Download](https://rustup.rs/))
- **LM Studio** installed ([Download](https://lmstudio.ai/))
- An **embedding model** loaded in LM Studio (e.g., `nomic-ai/nomic-embed-text-v1.5-GGUF`)

### Option 1: Quick Install (via LM Studio)

```bash
lms get picklerick/big-rag-rust-accelerated
```

This automatically downloads and installs the plugin.

### Option 2: Manual Install (Step-by-Step)

**Step 1: Clone the repository**
```bash
git clone https://github.com/ViswaaTheMightyPickle/lm_studio_big_rag_plugin_rust_accelerated.git
cd lm_studio_big_rag_plugin_rust_accelerated
```

**Step 2: Install Node.js dependencies**
```bash
npm install
```

**Step 3: Build the Rust native module**
```bash
cd native
npm install
npm run build
cd ..
```

**Step 4: Build TypeScript**
```bash
npm run build
```

**Step 5: Run in development mode**
```bash
npm run dev
```

The plugin will register with LM Studio automatically.

### Verify Installation

1. Open LM Studio
2. Go to **Settings** → **Plugins**
3. Look for **"BigRAG"** or **"big-rag-rust-accelerated"** in the plugin list
4. If visible, installation was successful

---

## Configuration

### Required Settings

| Setting | Description | Example |
|---------|-------------|---------|
| **Documents Directory** | Root directory containing your documents | `/home/user/Documents/MyLibrary` |
| **Vector Store Directory** | Where the vector database is stored | `/home/user/.lmstudio/big-rag-db` |

### Retrieval Settings

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Retrieval Limit** | 1-20 | 5 | Maximum chunks to return |
| **Affinity Threshold** | 0.0-1.0 | 0.5 | Minimum similarity score |
| **Chunk Size** | 128-2048 | 512 | Words per chunk |
| **Chunk Overlap** | 0-512 | 100 | Overlap between chunks |

### Performance Settings

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Max Concurrent Files** | 1-10 | 1 | Files processed simultaneously |
| **Enable OCR** | boolean | true | Enable OCR for images |

### Reindexing Controls

| Setting | Default | Description |
|---------|---------|-------------|
| **Manual Reindex Trigger** | OFF | Toggle ON to force reindexing on every chat |
| **Skip Previously Indexed Files** | ON | Skip unchanged files during reindex |

---

## Usage

### Step 1: Configure the Plugin

1. Open LM Studio
2. Go to **Settings** → **Plugins**
3. Find and click on **BigRAG**
4. Configure the following settings:

**Required Settings:**
| Setting | Description | Example |
|---------|-------------|---------|
| **Documents Directory** | Root directory containing your documents | `/home/user/Documents/MyLibrary` |
| **Vector Store Directory** | Where the vector database is stored | `/home/user/.lmstudio/big-rag-db` |

**Optional Settings (use defaults for testing):**
| Setting | Default | Description |
|---------|---------|-------------|
| **Retrieval Limit** | 5 | Maximum chunks to return |
| **Affinity Threshold** | 0.5 | Minimum similarity score |
| **Chunk Size** | 512 | Words per chunk |
| **Chunk Overlap** | 100 | Overlap between chunks |
| **Max Concurrent Files** | 5 | Files processed simultaneously |
| **Enable OCR** | true | Enable OCR for images |

### Step 2: Initial Indexing

The first time you send a message, the plugin will automatically index your documents.

**What happens during indexing:**

1. **Directory Scanning** - Recursively scans all files in your documents directory
2. **Document Parsing** - Parses each file (PDF, EPUB, HTML, text, images)
3. **Text Chunking** - Splits documents into overlapping chunks (Rust-accelerated)
4. **Embedding Generation** - Creates vector embeddings for each chunk (batched)
5. **Vector Store Indexing** - Stores embeddings in sharded LanceDB indexes

**Real-time UI Progress:**

During indexing, you'll see detailed progress updates in LM Studio:

```
[Directory Scanning] 50/50 files scanned
[Document Parsing] 25/50 files parsed
[Text Chunking] Chunking 45 documents...
[Text Chunking] Created 2,850 chunks
[Embedding Generation] 1,425/2,850 chunks embedded
[Vector Store Indexing] 2,850/2,850 chunks indexed
[Indexing Complete] 48 successful, 0 failed, 2 skipped
```

### Step 3: Query Your Documents

Simply chat with your LM Studio model. The plugin will:

1. **Search** indexed documents for relevant content
2. **Inject** retrieved passages into context
3. **Cite** sources in responses

**Example Query:**
```
What is artificial intelligence?
```

**Expected Response:**
```
Based on the provided documents:

Citation 1 (from ai.txt, score: 0.89): "Artificial intelligence is transforming technology."
Citation 2 (from ml.txt, score: 0.76): "Machine learning is a subset of AI."

[Model's response incorporating this information...]
```

---

## Architecture

### Optimized Indexing Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Phase 1   │────▶│   Phase 2   │────▶│   Phase 3   │
│   Parse     │     │   Chunk     │     │   Embed     │
│  (parallel) │     │ (Rust batch)│     │ (batches of 200)│
└─────────────┘     └─────────────┘     └─────────────┘
     │                     │                     │
  All files           Single Rust         Batch API calls
  collected           call for all        (2.71x speedup)
```

### Components

| Component | File | Description |
|-----------|------|-------------|
| **File Scanner** | `src/ingestion/fileScanner.ts` | Rust-native directory scanning |
| **Document Parsers** | `src/parsers/` | PDF, EPUB, HTML, text, image parsers |
| **Text Chunker** | `src/utils/textChunker.ts` | Rust-native batch chunking |
| **Vector Store** | `src/vectorstore/vectorStore.ts` | Vectra with sharded indexes |
| **Index Manager** | `src/ingestion/indexManager.ts` | Three-phase pipeline orchestration |
| **Native Module** | `native/src/` | Rust implementations |

---

## Performance Benchmarks

### Verified Benchmark Results (2026-03-27)

#### Text Chunking

| Test | TypeScript | Rust Native | Speedup |
|------|------------|-------------|---------|
| Single document (10K words) | 1.18ms | 0.50ms | **2.37x** |
| Rust fast (no metadata) | 1.18ms | 0.37ms | **3.19x** |
| Batch (50 docs × 10K words) | 26.54ms | 18.70ms | **1.42x** |

#### File Hashing

| Test | TypeScript | Rust Parallel | Speedup |
|------|------------|---------------|---------|
| Small files (10 × 100KB) | 4.68ms | 2.73ms | **1.71x** |
| Medium files (10 × 1MB) | 25.01ms | 16.73ms | **1.49x** |
| Many files (100 × 10KB) | 13.44ms | 2.96ms | **4.54x** |

#### Directory Scanning

| Test | TypeScript | Rust Native | Speedup |
|------|------------|-------------|---------|
| Small (35 files) | 7.71ms | 0.75ms | **10.23x** |
| Medium (400 files) | 16.83ms | 3.79ms | **4.43x** |
| Large (5,115 files) | 135.22ms | 20.08ms | **6.73x** |

#### End-to-End Indexing (Full Pipeline)

| Dataset | Files | Chunks | Time | Throughput |
|---------|-------|--------|------|------------|
| Small | 20 | 1,260 | 322ms | 62 files/sec |
| Medium | 50 | 3,150 | 650ms | 77 files/sec |
| Large | 100 | 6,300 | 1,258ms | 80 files/sec |

See [BENCHMARK_RESULTS.md](BENCHMARK_RESULTS.md) for full details.

---

## Troubleshooting

### No Results Found

- Verify documents directory is correctly configured
- Check that indexing completed successfully
- Lower the retrieval affinity threshold (try 0.3-0.4)
- Check LM Studio logs for errors

### Slow Indexing

**Network embedding (LM Link):**
- Ensure stable network connection
- Use batch size of 200 (already configured)
- Consider local embedding for faster processing

**Local embedding:**
- Reduce `Max Concurrent Files` to 1-2
- Disable OCR if not needed
- Use SSD for vector store directory

### Out of Memory

- Set `Max Concurrent Files` to 1
- Close other applications
- Increase system swap space

### LM Link Connection Issues

- Verify remote device is online
- Check device name in `lms link status`
- Ensure embedding model is loaded on remote device

---

## Development

### Project Structure

```
lm_studio_big_rag_plugin_rust_accelerated/
├── src/
│   ├── config.ts              # Plugin configuration
│   ├── index.ts               # Main entry point
│   ├── promptPreprocessor.ts  # RAG query integration
│   ├── ingestion/
│   │   ├── fileScanner.ts     # Rust-native scanning
│   │   └── indexManager.ts    # Three-phase pipeline
│   ├── parsers/               # Document parsers
│   ├── vectorstore/           # Vectra integration
│   └── utils/
│       ├── textChunker.ts     # Rust batch chunking
│       └── fileHash.ts        # File hashing
├── native/                    # Rust native module
│   ├── src/
│   │   ├── chunking.rs        # Text chunking
│   │   ├── hashing.rs         # File hashing
│   │   └── scanning.rs        # Directory scanning
│   └── Cargo.toml
├── benchmarks/                # Performance benchmarks
├── FINAL_PERFORMANCE_REPORT.md
└── README.md
```

### Building the Native Module

```bash
# Build Rust native module
cd native
npm run build

# Build TypeScript
cd ..
npm run build

# Run tests
npm run test:all

# Run benchmarks
npx ts-node benchmarks/hybridEmbedBench.ts
```

### Running Benchmarks

```bash
# Embedding batch size benchmark
npx ts-node benchmarks/hybridEmbedBench.ts

# End-to-end indexing benchmark
npx ts-node benchmarks/e2eBench.ts

# Real LM Studio API benchmark
npx ts-node benchmarks/realEmbedBench.ts
```

---

## Credits

**Original Plugin:** [ari99/lm_studio_big_rag_plugin](https://github.com/ari99/lm_studio_big_rag_plugin)

**Rust Acceleration & Optimization by:**
- **MightyPickle** ([ViswaaTheMightyPickle](https://github.com/ViswaaTheMightyPickle))

**Key Contributions:**
- Three-phase indexing pipeline (Parse → Chunk → Embed)
- Optimal batch embedding (200 chunks/batch = 2.71x speedup)
- Rust native module integration
- Comprehensive performance benchmarking
- LM Link network optimization

---

## License

ISC

---

## Acknowledgments

- **LM Studio SDK** - Plugin framework
- **Vectra** - Vector storage with sharded indexes
- **Tesseract.js** - OCR for image files
- **pdf-parse** - PDF text extraction
- **epub2** - EPUB parsing
- **cheerio** - HTML parsing
- **napi-rs** - Rust Node.js bindings
- **Rayon** - Rust parallel processing

---

## Contributing

Contributions welcome! Areas for future optimization:

1. **GPU Embedding** - CUDA/OpenCL acceleration
2. **Streaming Index** - Process files as they arrive
3. **Distributed Indexing** - Multi-machine parallel processing
4. **Compression** - Compress vector storage

For questions or issues, open a GitHub issue.

---

*Last updated: 2026-03-27*  
*Version: 1.0.0-rust-accelerated*
