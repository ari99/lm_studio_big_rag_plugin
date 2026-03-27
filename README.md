# BigRAG Plugin for LM Studio - Rust Accelerated

A high-performance RAG (Retrieval-Augmented Generation) plugin for LM Studio that can index and search through large document collections. **Rust-accelerated** with native optimizations for maximum throughput.

**Original:** [ari99/lm_studio_big_rag_plugin](https://github.com/ari99/lm_studio_big_rag_plugin)  
**Rust Acceleration by:** [MightyPickle](https://github.com/ViswaaTheMightyPickle)

---

## 🚀 Performance Improvements

This fork introduces **2.71x faster indexing** through optimized batch embedding and Rust-native acceleration:

| Optimization | Speedup | Description |
|--------------|---------|-------------|
| **Batch Embedding** | 2.71x | Optimal batch size (200 chunks) reduces API overhead |
| **Rust Chunking** | 1.45x | Native Rust text chunking with parallel processing |
| **Three-Phase Pipeline** | 3-5x | Parse → Chunk → Embed in optimized stages |

**Real-world results** (50 files, 567 chunks, LM Link network):
- **Before:** 9,473ms
- **After:** 3,492ms
- **Speedup:** 2.71x

See [FINAL_PERFORMANCE_REPORT.md](FINAL_PERFORMANCE_REPORT.md) for detailed benchmarks.

---

## Features

- **🦀 Rust-Native Acceleration**: Native Rust module for text chunking, hashing, and directory scanning
- **⚡ Optimized Embedding**: Batch embedding with optimal batch size (200 chunks) for network efficiency
- **📁 Massive Scale**: Handle GB to TB-scale document collections
- **🔍 Deep Directory Scanning**: Recursively scans all subdirectories
- **📄 Multiple File Formats**: PDF, EPUB, TXT, Markdown, HTML, images (with OCR)
- **🔒 Incremental Indexing**: Automatically detects and skips already-indexed files
- **💾 Persistent Storage**: Vector embeddings stored locally with sharded indexes
- **🌐 LM Link Support**: Optimized for remote embedding via LM Link

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

### Quick Install (via LM Studio)

```bash
lms get https://github.com/ViswaaTheMightyPickle/lm_studio_big_rag_plugin_rust_accelerated
```

### Manual Install

```bash
cd lm_studio_big_rag_plugin_rust_accelerated
npm install
npm run build:native  # Build Rust native module
npm run build         # Build TypeScript
npm run dev           # Run in development mode
```

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

### 1. Configure the Plugin

1. Open LM Studio settings
2. Navigate to **Plugins** → **BigRAG**
3. Set your documents directory and vector store directory

### 2. Initial Indexing

The first time you send a message, the plugin will:
- Scan your documents directory
- Parse and chunk all files
- Generate embeddings (batched for efficiency)
- Store vectors locally

Progress is shown in the LM Studio interface.

### 3. Query Your Documents

Simply chat with your LM Studio model. The plugin will:
- Search indexed documents for relevant content
- Inject retrieved passages into context
- Cite sources in responses

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

### Embedding Batch Size Comparison

| Batch Size | Time (567 chunks) | API Calls | Speedup |
|------------|-------------------|-----------|---------|
| 1 (per-chunk) | 9,473ms | 567 | 1.00x |
| 50 | 5,863ms | 12 | 1.62x |
| 100 | 5,689ms | 6 | 1.67x |
| **200** | **3,492ms** | **3** | **2.71x** |
| 500 | 3,538ms | 2 | 2.68x |

**Optimal batch size: 200 chunks per API call**

### Rust Native Operations

| Operation | TypeScript | Rust Native | Speedup |
|-----------|------------|-------------|---------|
| Text Chunking (batch) | Baseline | Parallel | 1.45x |
| Text Chunking (fast) | Baseline | No metadata | 2.00x |
| Directory Scanning | Baseline | Parallel | 1.58x |

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
