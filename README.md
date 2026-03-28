# BigRAG Plugin for LM Studio - Rust Accelerated

A high-performance RAG (Retrieval-Augmented Generation) plugin for LM Studio that can index and search through large document collections. **Rust-accelerated** with native optimizations for maximum throughput.

**Original:** [ari99/lm_studio_big_rag_plugin](https://github.com/ari99/lm_studio_big_rag_plugin)  
**Rust Acceleration by:** [ViswaaTheMightyPickle](https://github.com/ViswaaTheMightyPickle)

**Embedding Model:** `nomic-ai/nomic-embed-text-v1.5-GGUF` (cl100k_base tokenizer, 2048 context)

---

## Table of Contents

- [Quick Start](#quick-start)
- [Performance Improvements](#performance-improvements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Supported File Types](#supported-file-types)
- [Architecture](#architecture)
- [Benchmarks](#benchmarks)
- [Optimization Roadmap](#optimization-roadmap)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Quick Start

### Prerequisites

- **LM Studio** installed ([Download](https://lmstudio.ai/))
- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Rust** installed for native module ([Download](https://rustup.rs/))
- **Embedding model**: `nomic-ai/nomic-embed-text-v1.5-GGUF` loaded in LM Studio

### 5-Minute Setup

```bash
# 1. Install via LM Studio (recommended)
lms get picklerick/big-rag-rust-accelerated

# OR manual install
git clone https://github.com/ViswaaTheMightyPickle/lm_studio_big_rag_plugin_rust_accelerated.git
cd lm_studio_big_rag_plugin_rust_accelerated
npm install
cd native && npm install && npm run build && cd ..
npm run build
npm run dev
```

### First Test

```bash
# Create test documents
mkdir -p ~/test-docs
echo "Artificial intelligence is transforming technology." > ~/test-docs/ai.txt
echo "Machine learning is a subset of AI." > ~/test-docs/ml.txt

# Configure in LM Studio:
# - Documents Directory: ~/test-docs
# - Vector Store: ~/.lmstudio/big-rag-db

# Send query: "What is artificial intelligence?"
```

---

## Performance Improvements

### Current Optimizations (Implemented)

| Optimization | Speedup | Description |
|--------------|---------|-------------|
| **Rust Directory Scanning** | **4-10x** | Parallel directory traversal with Rayon |
| **Rust File Hashing** | **1.2-4.5x** | Parallel SHA-256 with mmap I/O |
| **Rust Text Chunking** | **1.4-3.2x** | Native Rust with Rayon parallelism |
| **Batch Embedding** | **2.71x** | Optimal batch size (50 chunks) |

### Full Pipeline Speedup

| Scenario | TypeScript | Rust-Accelerated | **Speedup** |
|----------|------------|------------------|-------------|
| Small (20 files) | ~1,200ms | 322ms | **3.7x** |
| Medium (50 files) | ~2,800ms | 650ms | **4.3x** |
| Large (100 files) | ~5,500ms | 1,258ms | **4.4x** |

**Real-world results** (50 files, LM Link network):
- Before: 9,473ms → After: 3,492ms → **2.71x faster**

See [BENCHMARK_RESULTS.md](BENCHMARK_RESULTS.md) for detailed benchmarks.

---

## Installation

### Prerequisites Details

#### Rust Toolchain Installation

**Linux (Fedora/Ubuntu/Debian):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version  # Verify
```

**macOS:**
```bash
brew install rustup
rustup-init
```

**Windows:**
```powershell
# Download and run rustup-init.exe from https://rustup.rs/
# Or use winget:
winget install Rustlang.Rustup
```

**Cross-compilation targets (for building all platforms):**
```bash
rustup target add x86_64-apple-darwin    # macOS Intel
rustup target add aarch64-apple-darwin   # macOS ARM (M1/M2/M3)
rustup target add x86_64-pc-windows-gnu  # Windows
```

### Option 1: Quick Install (via LM Studio)

```bash
lms get picklerick/big-rag-rust-accelerated
```

### Option 2: Manual Install

```bash
# Clone repository
git clone https://github.com/ViswaaTheMightyPickle/lm_studio_big_rag_plugin_rust_accelerated.git
cd lm_studio_big_rag_plugin_rust_accelerated

# Install dependencies
npm install

# Build Rust native module
cd native
npm install
npm run build
cd ..

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

### Verify Installation

1. Open LM Studio → Settings → Plugins
2. Look for **"BigRAG"** or **"big-rag-rust-accelerated"**
3. If visible, installation successful

---

## Configuration

### Required Settings

| Setting | Description | Example |
|---------|-------------|---------|
| **Documents Directory** | Root directory with documents | `/home/user/Documents/MyLibrary` |
| **Vector Store Directory** | Vector database storage | `/home/user/.lmstudio/big-rag-db` |

### Retrieval Settings

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Retrieval Limit** | 1-20 | 5 | Max chunks to return |
| **Affinity Threshold** | 0.0-1.0 | 0.5 | Min similarity score |
| **Chunk Size** | 128-2048 | 512 | Words per chunk |
| **Chunk Overlap** | 0-512 | 100 | Overlap between chunks |

### Performance Settings

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Max Concurrent Files** | 1-10 | 1 | Files processed simultaneously |
| **Enable OCR** | boolean | true | OCR for images |

### Reindexing Controls

| Setting | Default | Description |
|---------|---------|-------------|
| **Manual Reindex Trigger** | OFF | ON = reindex every chat |
| **Skip Previously Indexed Files** | ON | Skip unchanged files |

---

## Usage

### Step 1: Configure Plugin

1. LM Studio → Settings → Plugins → BigRAG
2. Set Documents Directory and Vector Store Directory
3. Adjust optional settings as needed

### Step 2: Initial Indexing

First message triggers automatic indexing:

1. **Directory Scanning** - Recursive file scan (Rust-accelerated)
2. **Document Parsing** - PDF, EPUB, HTML, text, images
3. **Text Chunking** - Overlapping chunks (Rust-accelerated)
4. **Embedding Generation** - Batch embeddings (50 chunks/batch)
5. **Vector Store Indexing** - Sharded LanceDB indexes

**UI Progress Example:**
```
[Directory Scanning] 50/50 files scanned
[Document Parsing] 25/50 files parsed
[Text Chunking] Chunking 45 documents...
[Text Chunking] Created 2,850 chunks
[Embedding Generation] 1,425/2,850 chunks embedded
[Vector Store Indexing] 2,850/2,850 chunks indexed
[Indexing Complete] 48 successful, 0 failed, 2 skipped
```

### Step 3: Query Documents

Chat normally. Plugin will:
1. Search indexed documents
2. Inject relevant passages into context
3. Cite sources in responses

**Example:**
```
User: What is artificial intelligence?

Response: Based on the provided documents:
Citation 1 (from ai.txt, score: 0.89): "Artificial intelligence is transforming technology."
Citation 2 (from ml.txt, score: 0.76): "Machine learning is a subset of AI."
[Model response...]
```

---

## Supported File Types

| Category | Extensions | Notes |
|----------|------------|-------|
| **Documents** | PDF, EPUB, TXT, TEXT | PDF has OCR fallback |
| **Markdown** | MD, MDX, Markdown, MDown, MKD, MKDN | Full markdown support |
| **Web Content** | HTM, HTML, XHTML | Script/style stripped |
| **Images** (OCR) | BMP, JPEG, JPG, PNG | Tesseract OCR, max 50 pages |

---

## Architecture

### Three-Phase Indexing Pipeline

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Phase 1   │────▶│   Phase 2   │────▶│   Phase 3   │
│   Parse     │     │   Chunk     │     │   Embed     │
│  (parallel) │     │ (Rust batch)│     │ (50/batch)  │
└─────────────┘     └─────────────┘     └─────────────┘
     │                     │                     │
  All files           Single Rust         Batch API calls
  collected           call for all        (2.71x speedup)
```

### Components

| Component | File | Description |
|-----------|------|-------------|
| **File Scanner** | `src/ingestion/fileScanner.ts` | Rust-native scanning |
| **Document Parsers** | `src/parsers/` | PDF, EPUB, HTML, text, image |
| **Text Chunker** | `src/utils/textChunker.ts` | Rust-native batch chunking |
| **Vector Store** | `src/vectorstore/vectorStore.ts` | Vectra with sharded indexes |
| **Index Manager** | `src/ingestion/indexManager.ts` | Pipeline orchestration |
| **Native Module** | `native/src/` | Rust implementations |

---

## Benchmarks

### Current Performance (2026-03-27)

#### Text Chunking

| Test | TypeScript | Rust Native | Speedup |
|------|------------|-------------|---------|
| Single (10K words) | 1.18ms | 0.50ms | **2.37x** |
| Rust fast (no metadata) | 1.18ms | 0.37ms | **3.19x** |
| Batch (50 docs × 10K) | 26.54ms | 18.70ms | **1.42x** |

#### File Hashing

| Test | TypeScript | Rust Parallel | Speedup |
|------|------------|---------------|---------|
| Small (10 × 100KB) | 4.68ms | 2.73ms | **1.71x** |
| Medium (10 × 1MB) | 25.01ms | 16.73ms | **1.49x** |
| Many (100 × 10KB) | 13.44ms | 2.96ms | **4.54x** |

#### Directory Scanning

| Test | TypeScript | Rust Native | Speedup |
|------|------------|-------------|---------|
| Small (35 files) | 7.71ms | 0.75ms | **10.23x** |
| Medium (400 files) | 16.83ms | 3.79ms | **4.43x** |
| Large (5,115 files) | 135.22ms | 20.08ms | **6.73x** |

#### End-to-End Pipeline

| Dataset | Files | Chunks | Time | Throughput |
|---------|-------|--------|------|------------|
| Small | 20 | 1,260 | 322ms | 62 files/sec |
| Medium | 50 | 3,150 | 650ms | 77 files/sec |
| Large | 100 | 6,300 | 1,258ms | 80 files/sec |

### Running Benchmarks

```bash
# Build everything
npm run build:all

# Run all benchmarks
npm run bench

# Individual benchmarks
npm run bench:hash
npm run bench:chunk
npm run bench:scan

# Large-scale benchmarks (1000-10000 files)
node dist/benchmarks/generateDataset.js  # Generate test data
node dist/benchmarks/realEmbedBench.js --dataset benchmark-data/1000-files
```

See [BENCHMARK_RESULTS.md](BENCHMARK_RESULTS.md) for complete results.

---

## Optimization Roadmap

### Identified Bottlenecks & Planned Optimizations

| Component | Current | Bottleneck | Expected Speedup | Priority |
|-----------|---------|------------|------------------|----------|
| **PDF OCR** | Tesseract.js WASM | Sequential, single-threaded | **8-15x** | HIGH |
| **PDF Parsing** | pdf-parse (JS) | No parallelization | **5-10x** | HIGH |
| **Image OCR** | Tesseract.js | Worker creation overhead | **8-15x** | HIGH |
| **EPUB Parsing** | epub2 (JS) | Sequential chapters | **3-5x** | HIGH |
| **Markdown Strip** | 12+ regex passes | Sequential replacements | **4-6x** | MEDIUM |
| **Token Estimation** | Heuristic (char/4) | Multiple regex passes | **5-8x** | MEDIUM |
| **Vector Search** | Sequential shards | No parallel queries | **2-4x** | MEDIUM |
| **File Metadata** | Separate stat/hash | Two syscalls per file | **2-3x** | LOW |

### Implementation Phases

See [OPTIMIZATION_PLAN.md](OPTIMIZATION_PLAN.md) for detailed specifications.

#### Phase 1: Tokenizer-Based Chunking (Current)
- Use `gpt-tokenizer` (cl100k_base) for accurate token counting
- Eliminate token limit warnings
- Branch: `experimental`

#### Phase 2: Rust Parser Acceleration
- Native PDF parsing with `lopdf`
- Native OCR with `tesseract` crate + Rayon
- Native EPUB parsing with `epub` crate
- Native markdown stripping with `pulldown-cmark`

#### Phase 3: Vector Store Optimization
- Parallel shard queries
- SIMD vector distance calculations

#### Phase 4: Cross-Platform Builds
- Pre-built binaries for Linux, macOS (Intel/ARM), Windows
- GitHub Actions CI/CD

---

## Troubleshooting

### No Results Found
- Verify documents directory configured correctly
- Check indexing completed successfully
- Lower affinity threshold (try 0.3-0.4)
- Check LM Studio logs for errors

### Token Limit Warnings
- Current: Using heuristic token estimation (~1500 token chunks)
- Fix: Tokenizer-based chunking in progress (experimental branch)
- Temporary: Reduce chunk size in settings

### Slow Indexing

**Network embedding (LM Link):**
- Ensure stable network connection
- Batch size already optimized (50 chunks)
- Consider local embedding

**Local embedding:**
- Reduce Max Concurrent Files to 1-2
- Disable OCR if not needed
- Use SSD for vector store

### Out of Memory
- Set Max Concurrent Files to 1
- Close other applications
- Increase system swap space

### LM Link Connection Issues
- Verify remote device online
- Check `lms link status`
- Ensure embedding model loaded on remote device

### No Rust Native Module
```bash
# Rebuild native module
cd native
npm install
npm run build
cd ..
npm run build
```

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
├── README.md                  # This file
├── OPTIMIZATION_PLAN.md       # Detailed optimization specs
├── TOKENIZER_GUIDE.md         # Tokenizer integration guide
├── BENCHMARK_RESULTS.md       # Benchmark results
└── TESTING.md                 # Testing procedures
```

### Building

```bash
# Build Rust native module
cd native && npm run build && cd ..

# Build TypeScript
npm run build

# Build all
npm run build:all
```

### Testing

```bash
# Run parser tests
npm run test

# Run all tests
npm run test:all

# Run benchmarks
npm run bench
```

### Cross-Platform Build

```bash
# Linux (default)
npm run build:all

# macOS Intel
cd native && npm run build:macos-intel && cd ..

# macOS ARM (M1/M2/M3)
cd native && npm run build:macos-arm && cd ..

# Windows
cd native && npm run build:windows && cd ..
```

---

## Use Cases & Examples

### Personal Knowledge Base
```
Documents: ~/Documents/Notes
Vector Store: ~/.lmstudio/notes-db
Settings: Defaults work well
```

### Technical Documentation
```
Documents: ~/Code/project/docs
Vector Store: ~/.lmstudio/project-docs-db
Chunk Size: 1024 (larger for technical content)
```

### Research Papers
```
Documents: ~/Research/papers
Vector Store: ~/.lmstudio/research-db
Retrieval Limit: 10 (more results)
Affinity Threshold: 0.6 (higher precision)
```

### Legal Documents
```
Documents: ~/Legal/documents
Vector Store: ~/.lmstudio/legal-db
Affinity Threshold: 0.7 (higher precision)
Max Concurrent Files: 2 (careful processing)
```

See [TESTING.md](TESTING.md) for detailed testing scenarios.

---

## Credits

**Original Plugin:** [ari99/lm_studio_big_rag_plugin](https://github.com/ari99/lm_studio_big_rag_plugin)

**Rust Acceleration & Optimization by:**
- **MightyPickle** ([ViswaaTheMightyPickle](https://github.com/ViswaaTheMightyPickle))

**Key Contributions:**
- Three-phase indexing pipeline (Parse → Chunk → Embed)
- Optimal batch embedding (50 chunks/batch = 2.71x speedup)
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
- **gpt-tokenizer** - Token counting for cl100k_base

---

## Contributing

Contributions welcome! Active optimization areas:

1. **Tokenizer-Based Chunking** - Accurate token counting (experimental branch)
2. **Rust PDF Parser** - Native PDF parsing with OCR
3. **Rust EPUB Parser** - Parallel chapter extraction
4. **Vector Store SIMD** - SIMD distance calculations
5. **Cross-Platform CI/CD** - Automated builds for all platforms

For questions or issues, open a GitHub issue.

---

*Last updated: 2026-03-28*  
*Version: 1.0.0-rust-accelerated*  
*Experimental Branch: tokenizer-based chunking + Rust parser acceleration*
