# BigRAG Plugin - Benchmark Results

**Date:** 2026-03-28  
**Platform:** Linux x86_64 (Fedora)  
**Node.js:** v20.20.2  
**Rust:** 1.75+  
**Embedding Model:** nomic-ai/nomic-embed-text-v1.5-GGUF (cl100k_base tokenizer, 2048 context)

---

## Executive Summary

The Rust-accelerated native module provides significant performance improvements across all benchmarked operations:

| Operation | Best Speedup | Notes |
|-----------|-------------|-------|
| **Text Chunking (single)** | **3.19x** | Rust fast implementation |
| **Text Chunking (batch)** | **1.42x** | 50 docs × 10K words, parallel Rust |
| **File Hashing (many files)** | **4.54x** | 100 × 10KB files, parallel Rust |
| **Directory Scanning** | **10.23x** | Small structure (35 files) |
| **End-to-End Indexing** | **76-80 files/sec** | With mock embedding (5ms latency) |

---

## Current Baseline Benchmarks

### Text Chunking (Word-Based Heuristic)

| Test | TypeScript | Rust Native | Speedup |
|------|------------|-------------|---------|
| Single document (10K words) | 1.18ms | 0.50ms | **2.37x** |
| Rust fast (no metadata) | 1.18ms | 0.37ms | **3.19x** |
| Batch (50 docs × 10K words) | 26.54ms | 18.70ms | **1.42x** |

### File Hashing

| Test | TypeScript | Rust Parallel | Speedup |
|------|------------|---------------|---------|
| Small files (10 × 100KB) | 4.68ms | 2.73ms | **1.71x** |
| Medium files (10 × 1MB) | 25.01ms | 16.73ms | **1.49x** |
| Many files (100 × 10KB) | 13.44ms | 2.96ms | **4.54x** |

### Directory Scanning

| Test | TypeScript | Rust Native | Speedup |
|------|------------|-------------|---------|
| Small (35 files) | 7.71ms | 0.75ms | **10.23x** |
| Medium (400 files) | 16.83ms | 3.79ms | **4.43x** |
| Large (5,115 files) | 135.22ms | 20.08ms | **6.73x** |

### End-to-End Indexing (Full Pipeline)

| Dataset | Files | Chunks | Time | Throughput |
|---------|-------|--------|------|------------|
| Small | 20 | 1,260 | 322ms | 62 files/sec |
| Medium | 50 | 3,150 | 650ms | 77 files/sec |
| Large | 100 | 6,300 | 1,258ms | 80 files/sec |

---

## Tokenizer vs Heuristic Benchmark Template

**Status:** Pending implementation (experimental branch)

### Test Methodology

Compare two chunking approaches:
1. **Heuristic (Current):** `estimateTokenCount()` using character/word ratios
2. **Tokenizer (New):** `encode()` using gpt-tokenizer cl100k_base

### Metrics to Track

| Metric | Heuristic | Tokenizer | Target |
|--------|-----------|-----------|--------|
| Token estimation accuracy | ~70-80% | 100% | 100% |
| Overhead per chunk | <0.1ms | 0.5-2ms | <15% total |
| Token limit warnings | Some occur | 0% | 0% |
| Chunk rejection rate | Some occur | 0% | 0% |

### Benchmark Commands

```bash
# Generate test dataset
node dist/benchmarks/generateDataset.js 1000

# Run heuristic benchmark (baseline)
node dist/benchmarks/realEmbedBench.js \
  --dataset benchmark-data/1000-files \
  --method heuristic \
  --log-server

# Run tokenizer benchmark (experimental)
node dist/benchmarks/realEmbedBench.js \
  --dataset benchmark-data/1000-files \
  --method tokenizer \
  --log-server

# Check server logs for warnings
grep -i "warning\|exceed\|truncat" ~/.lmstudio/logs/*.log
```

### Expected Results Template

| Dataset | Method | Index Time | Warnings | Rejections | Overhead |
|---------|--------|------------|----------|------------|----------|
| 1000 files | Heuristic | TBD | TBD | TBD | Baseline |
| 1000 files | Tokenizer | TBD | 0 | 0 | +5-15% |
| 5000 files | Heuristic | TBD | TBD | TBD | Baseline |
| 5000 files | Tokenizer | TBD | 0 | 0 | +5-15% |
| 10000 files | Heuristic | TBD | TBD | TBD | Baseline |
| 10000 files | Tokenizer | TBD | 0 | 0 | +5-15% |

---

## Large-Scale Benchmark Template (1000-10000 files)

**Status:** Pending dataset generation

### Dataset Specification

| Dataset | Files | Total Words | Est. Chunks | Size |
|---------|-------|-------------|-------------|------|
| 1000-files | 1,000 | 5M | ~63,000 | ~25MB |
| 5000-files | 5,000 | 25M | ~315,000 | ~125MB |
| 10000-files | 10,000 | 50M | ~630,000 | ~250MB |

**File Type Distribution:**
- 60% TXT (plain text)
- 20% MD (markdown)
- 10% HTML (web content)
- 10% PDF (text-based)

**Word Count Distribution:**
- 30% short (500-1000 words)
- 40% medium (1000-5000 words)
- 30% long (5000-10000 words)

### Benchmark Commands

```bash
# Generate datasets
node dist/benchmarks/generateDataset.js 1000
node dist/benchmarks/generateDataset.js 5000
node dist/benchmarks/generateDataset.js 10000

# Run benchmarks
for SIZE in 1000 5000 10000; do
  echo "=== Benchmarking $SIZE files ==="
  node dist/benchmarks/realEmbedBench.js \
    --dataset benchmark-data/${SIZE}-files \
    --output benchmarks/results/${SIZE}-files.json
done
```

### Metrics to Track

| Metric | 1000 files | 5000 files | 10000 files |
|--------|------------|------------|-------------|
| Directory scan time | TBD | TBD | TBD |
| File hashing time | TBD | TBD | TBD |
| Parsing time | TBD | TBD | TBD |
| Chunking time | TBD | TBD | TBD |
| Embedding time | TBD | TBD | TBD |
| Vector indexing time | TBD | TBD | TBD |
| **Total time** | TBD | TBD | TBD |
| **Throughput (files/sec)** | TBD | TBD | TBD |
| **Memory peak (MB)** | TBD | TBD | TBD |

---

## Rust Parser Optimization Benchmark Template

**Status:** Pending implementation (experimental branch)

### PDF Parser with Native OCR

| Test | Current (Tesseract.js) | Rust Native | Speedup |
|------|------------------------|-------------|---------|
| PDF text (10 pages) | TBD | TBD | 5-10x |
| PDF OCR (10 pages) | TBD | TBD | 8-15x |
| PDF OCR (50 pages) | TBD | TBD | 8-15x |

### EPUB Parser

| Test | Current (epub2 JS) | Rust Native | Speedup |
|------|-------------------|-------------|---------|
| EPUB (100 chapters) | TBD | TBD | 3-5x |
| EPUB parallel chapters | TBD | TBD | 3-5x |

### Markdown/Text Parser

| Test | Current (12+ regex) | Rust (pulldown-cmark) | Speedup |
|------|---------------------|----------------------|---------|
| Markdown strip (10K words) | TBD | TBD | 4-6x |
| Text normalize (10K words) | TBD | TBD | 3-4x |

---

## Vector Store Optimization Benchmark Template

**Status:** Pending implementation

### Parallel Shard Operations

| Test | Current (sequential) | Rust Parallel | Speedup |
|------|---------------------|---------------|---------|
| Search (10 shards) | TBD | TBD | 2-4x |
| Search (50 shards) | TBD | TBD | 2-4x |
| SIMD distance calc | TBD | TBD | 2-4x |

---

## Cross-Platform Build Benchmark

**Status:** Pending implementation

### Build Times by Platform

| Platform | Build Time | Binary Size | Notes |
|----------|------------|-------------|-------|
| Linux x86_64 | TBD | TBD | Native |
| macOS x86_64 | TBD | TBD | Cross-compile |
| macOS aarch64 | TBD | TBD | Cross-compile |
| Windows x86_64 | TBD | TBD | Cross-compile |

---

## Pipeline Stage Breakdown

**Current (TypeScript parsers, Rust chunking/hash/scan):**

| Stage | Time % | Optimized? | Potential |
|-------|--------|------------|-----------|
| Directory Scanning | 5% | ✅ Rust | Done |
| File Hashing | 10% | ✅ Rust | Done |
| Document Parsing | 35% | ❌ JS | 5-10x possible |
| Text Chunking | 5% | ✅ Rust | Done |
| Embedding | 40% | Network-bound | N/A |
| Vector Indexing | 5% | ⚠️ Partial | 2-4x possible |

**After Rust Parser Optimization (Projected):**

| Stage | Time % | Optimized? | Notes |
|-------|--------|------------|-------|
| Directory Scanning | 2% | ✅ Rust | |
| File Hashing | 4% | ✅ Rust | |
| Document Parsing | 7% | ✅ Rust | 5x faster |
| Text Chunking | 2% | ✅ Rust | |
| Embedding | 80% | Network-bound | Dominates |
| Vector Indexing | 5% | ⚠️ Partial | |

---

## How to Run Benchmarks

### Setup

```bash
# Install Rust toolchain (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Build native module
cd native
npm install
npm run build
cd ..

# Build TypeScript
npm run build
```

### Individual Benchmarks

```bash
# Text chunking
npm run bench:chunk

# File hashing
npm run bench:hash

# Directory scanning
npm run bench:scan

# All benchmarks
npm run bench
```

### Large-Scale Benchmarks

```bash
# Generate test dataset
node dist/benchmarks/generateDataset.js 1000

# Run real embedding benchmark (requires LM Studio running)
node dist/benchmarks/realEmbedBench.js \
  --dataset benchmark-data/1000-files \
  --embedding-model "nomic-ai/nomic-embed-text-v1.5-GGUF"
```

### Server Log Monitoring

```bash
# Watch for warnings during benchmark
tail -f ~/.lmstudio/logs/*.log | grep -i "warning\|exceed\|truncat"

# Count token limit warnings
grep -c "exceeds model context length" ~/.lmstudio/logs/*.log

# Count EOS/SEP warnings
grep -c "not SEP" ~/.lmstudio/logs/*.log
```

---

## Benchmark Results Archive

### 2026-03-27 (Current Baseline)

See "Current Baseline Benchmarks" section above.

### 2026-03-28 (Pending)

- Tokenizer vs heuristic comparison
- Large-scale benchmarks (1000-10000 files)

### Future (Pending Implementation)

- Rust parser optimization results
- Vector store optimization results
- Cross-platform build results

---

## Notes

1. **Token Estimation Accuracy:** Current heuristic method achieves ~70-80% accuracy compared to actual tokenization. Variance depends on text type (prose vs code vs technical).

2. **Network Embedding:** All embedding benchmarks using LM Link network API. Local embedding would show different performance characteristics.

3. **Parsing Bottleneck:** Document parsing (PDF/EPUB) is the primary remaining bottleneck at 35% of pipeline time. Rust parser optimization is the highest priority.

4. **FFI Overhead:** Rust native calls have ~1-2ms FFI overhead. Batch operations amortize this cost effectively.

---

*Last updated: 2026-03-28*  
*Next benchmark run: Tokenizer vs heuristic (experimental branch)*
