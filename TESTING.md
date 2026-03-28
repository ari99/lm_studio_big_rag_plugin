# Testing Guide for BigRAG Plugin

**Embedding Model:** nomic-ai/nomic-embed-text-v1.5-GGUF  
**Test Datasets:** 1000, 5000, 10000 files (generated)  
**Platforms:** Linux, macOS (Intel/ARM), Windows

---

## Prerequisites

1. **LM Studio** installed and running
2. **Embedding model** loaded: `nomic-ai/nomic-embed-text-v1.5-GGUF`
3. **Node.js 18+** and npm installed
4. **Rust toolchain** installed (for native module)

### Rust Toolchain Installation

**Linux (Fedora/Ubuntu):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version  # Verify installation
```

**macOS:**
```bash
brew install rustup
rustup-init
```

**Windows:**
```powershell
winget install Rustlang.Rustup
```

---

## Setup for Testing

### 1. Install Dependencies

```bash
cd lm_studio_big_rag_plugin
npm install

# Build Rust native module
cd native
npm install
npm run build
cd ..

# Build TypeScript
npm run build
```

### 2. Generate Test Datasets

```bash
# Generate benchmark datasets (1000, 5000, 10000 files)
node dist/benchmarks/generateDataset.js 1000
node dist/benchmarks/generateDataset.js 5000
node dist/benchmarks/generateDataset.js 10000

# Datasets created in benchmark-data/
ls -la benchmark-data/
# 1000-files/  5000-files/  10000-files/
```

### 3. Create Vector Store Directory

```bash
mkdir -p ~/.lmstudio/big-rag-test-db
```

---

## Test Scenarios

### Test 1: Parser Smoke Tests

**Objective:** Verify core parsers succeed before large-scale tests.

```bash
npm run test
```

**Expected:** All parser tests pass (HTML, Markdown, Text)

---

### Test 2: Tokenizer vs Heuristic Comparison

**Objective:** Compare token estimation accuracy and warning rates.

**Steps:**

1. **Run heuristic benchmark (baseline):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --method heuristic \
     --output benchmarks/results/heuristic-1000.json
   ```

2. **Run tokenizer benchmark (experimental):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --method tokenizer \
     --output benchmarks/results/tokenizer-1000.json
   ```

3. **Check server logs for warnings:**
   ```bash
   # Token limit warnings
   grep -c "exceeds model context length" ~/.lmstudio/logs/*.log
   
   # EOS/SEP warnings
   grep -c "not SEP" ~/.lmstudio/logs/*.log
   
   # View recent warnings
   tail -100 ~/.lmstudio/logs/*.log | grep -i "warning"
   ```

**Success Criteria:**
- ✅ Tokenizer has 0 token limit warnings
- ✅ Tokenizer has 0 EOS/SEP warnings
- ✅ Tokenizer overhead <15% of total indexing time

---

### Test 3: Large-Scale Benchmark (1000-10000 files)

**Objective:** Measure performance at scale.

**Steps:**

```bash
# Run benchmarks for each dataset size
for SIZE in 1000 5000 10000; do
  echo "=== Benchmarking $SIZE files ==="
  
  # Clear vector store
  rm -rf ~/.lmstudio/big-rag-test-db/*
  
  # Run benchmark
  node dist/benchmarks/realEmbedBench.js \
    --dataset benchmark-data/${SIZE}-files \
    --output benchmarks/results/${SIZE}-files.json \
    --log-stats
  
  # Wait between runs
  sleep 5
done
```

**Metrics to Track:**

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

### Test 4: Incremental Indexing

**Objective:** Verify already-indexed files are skipped.

**Steps:**

1. **First indexing run:**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --output benchmarks/results/incremental-first.json
   ```
   Note the indexing time: `TIME1`

2. **Second indexing run (no changes):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --output benchmarks/results/incremental-second.json
   ```
   Note the indexing time: `TIME2`

3. **Add new files:**
   ```bash
   for i in {1..100}; do
     echo "New document $i" > benchmark-data/1000-files/new_$i.txt
   done
   ```

4. **Third indexing run (with new files):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --output benchmarks/results/incremental-third.json
   ```

**Expected Results:**
- `TIME2` << `TIME1` (skipped all files)
- Third run only processes 100 new files

**Success Criteria:**
- ✅ Already-indexed files are skipped
- ✅ Only new/modified files are processed
- ✅ Retrieval still works correctly

---

### Test 5: Concurrent Processing

**Objective:** Test different concurrency settings.

**Steps:**

1. **Low concurrency (maxConcurrentFiles = 1):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --max-concurrent 1 \
     --output benchmarks/results/concurrent-1.json
   ```

2. **Medium concurrency (maxConcurrentFiles = 5):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --max-concurrent 5 \
     --output benchmarks/results/concurrent-5.json
   ```

3. **High concurrency (maxConcurrentFiles = 10):**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --max-concurrent 10 \
     --output benchmarks/results/concurrent-10.json
   ```

**Expected Results:**
- Higher concurrency = faster (to a point)
- Higher concurrency = more memory usage

**Success Criteria:**
- ✅ All settings work correctly
- ✅ Higher concurrency is faster (up to optimal point)
- ✅ No race conditions or errors

---

### Test 6: Retrieval Threshold Tuning

**Objective:** Test different affinity threshold settings.

**Steps:**

1. **Index test documents:**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files \
     --index-only
   ```

2. **High threshold (0.9 - very strict):**
   ```bash
   node dist/benchmarks/searchBench.js \
     --dataset benchmark-data/1000-files \
     --threshold 0.9 \
     --query "artificial intelligence"
   ```

3. **Medium threshold (0.5 - default):**
   ```bash
   node dist/benchmarks/searchBench.js \
     --dataset benchmark-data/1000-files \
     --threshold 0.5 \
     --query "artificial intelligence"
   ```

4. **Low threshold (0.3 - very loose):**
   ```bash
   node dist/benchmarks/searchBench.js \
     --dataset benchmark-data/1000-files \
     --threshold 0.3 \
     --query "artificial intelligence"
   ```

**Expected Results:**
- High threshold: Fewer, more relevant results
- Low threshold: More results, some less relevant

**Success Criteria:**
- ✅ Threshold affects number of results
- ✅ Results are properly filtered
- ✅ No errors with extreme values

---

### Test 7: Cross-Platform Compatibility

**Objective:** Verify plugin works on all target platforms.

**Platforms to Test:**

| Platform | Status | Notes |
|----------|--------|-------|
| Linux x86_64 | TBD | Native (Fedora) |
| macOS x86_64 | TBD | Intel Mac |
| macOS aarch64 | TBD | M1/M2/M3 Mac |
| Windows x86_64 | TBD | Windows 10/11 |

**Test Checklist:**

- [ ] Native module builds successfully
- [ ] TypeScript compiles without errors
- [ ] Plugin loads in LM Studio
- [ ] Indexing completes successfully
- [ ] Retrieval returns results
- [ ] No platform-specific errors

---

### Test 8: Error Handling

**Objective:** Verify graceful handling of errors.

**Test Cases:**

1. **Invalid Directory:**
   ```bash
   node dist/benchmarks/realEmbedBench.js \
     --dataset /nonexistent/path \
     --output benchmarks/results/error-invalid-dir.json
   ```
   **Expected:** Warning message, no crash

2. **Corrupted File:**
   ```bash
   # Create corrupted PDF
   echo "not a real pdf" > benchmark-data/1000-files/corrupted.pdf
   
   # Re-run indexing
   node dist/benchmarks/realEmbedBench.js \
     --dataset benchmark-data/1000-files
   ```
   **Expected:** File is skipped with error log, indexing continues

3. **No Write Permission:**
   ```bash
   # Create read-only directory
   mkdir -p /tmp/readonly-db
   chmod 555 /tmp/readonly-db
   
   node dist/benchmarks/realEmbedBench.js \
     --vector-store /tmp/readonly-db
   ```
   **Expected:** Clear error message

**Success Criteria:**
- ✅ Plugin doesn't crash
- ✅ Clear error messages
- ✅ Other files continue to process

---

## Performance Benchmarks

### Expected Performance by Dataset Size

| Dataset | Files | Est. Chunks | Est. Time (heuristic) | Est. Time (tokenizer) | Throughput |
|---------|-------|-------------|----------------------|----------------------|------------|
| Small | 1000 | ~63,000 | ~15-20 min | ~17-23 min | ~50-65 files/min |
| Medium | 5000 | ~315,000 | ~75-100 min | ~85-115 min | ~50-65 files/min |
| Large | 10000 | ~630,000 | ~150-200 min | ~170-230 min | ~50-65 files/min |

*Note: Times vary based on hardware, embedding API speed, and network latency.*

### Memory Usage Expectations

| Dataset | Peak Memory (heuristic) | Peak Memory (tokenizer) |
|---------|------------------------|------------------------|
| 1000 files | ~200-400 MB | ~250-450 MB |
| 5000 files | ~500-800 MB | ~600-900 MB |
| 10000 files | ~1-1.5 GB | ~1.2-1.7 GB |

---

## Debugging

### Enable Debug Logging

The plugin uses LM Studio's logging system. To see debug output:

1. Check LM Studio's developer console
2. Look for messages prefixed with plugin name
3. Use `ctl.debug()` calls in code for detailed logging

### Monitor Server Logs

```bash
# Watch logs in real-time
tail -f ~/.lmstudio/logs/*.log

# Filter for BigRAG messages
tail -f ~/.lmstudio/logs/*.log | grep -i "bigrag\|big-rag"

# Filter for warnings/errors
tail -f ~/.lmstudio/logs/*.log | grep -i "warning\|error"

# Count token limit warnings
grep -c "exceeds model context" ~/.lmstudio/logs/*.log
```

### Common Issues

1. **"No relevant content found"**
   - Check that indexing completed
   - Lower the retrieval threshold (try 0.3-0.4)
   - Verify query matches document content

2. **"Vector store not initialized"**
   - Check vector store directory permissions
   - Ensure directory path is valid
   - Check LM Studio logs for initialization errors

3. **Slow indexing**
   - Reduce concurrent files
   - Disable OCR if not needed
   - Check disk I/O performance

4. **High memory usage**
   - Reduce concurrent files to 1-2
   - Process documents in smaller batches
   - Check for memory leaks in parsers

5. **Token limit warnings**
   - Switch to tokenizer-based chunking (experimental branch)
   - Reduce MAX_CHUNK_TOKENS setting
   - Check chunk size configuration

---

## Benchmark Results

### Current Baseline (2026-03-28)

See [BENCHMARK_RESULTS.md](BENCHMARK_RESULTS.md) for complete results.

### Pending Tests

- [ ] Tokenizer vs heuristic comparison
- [ ] 1000-file benchmark
- [ ] 5000-file benchmark
- [ ] 10000-file benchmark
- [ ] Cross-platform tests

---

## Cleanup

After testing, clean up test data:

```bash
# Remove benchmark datasets
rm -rf benchmark-data/

# Remove test vector store
rm -rf ~/.lmstudio/big-rag-test-db

# Remove benchmark results
rm -rf benchmarks/results/
```

---

## Automated Testing (Future)

For automated testing in CI/CD:

```bash
# Run all tests
npm run test:all

# Run benchmarks
npm run bench

# Run specific benchmark
node dist/benchmarks/realEmbedBench.js \
  --dataset benchmark-data/1000-files \
  --method tokenizer \
  --ci-mode
```

---

## Reporting Issues

When reporting issues, include:

1. Plugin version and branch (e.g., `experimental`)
2. LM Studio version
3. Operating system and version
4. Dataset size and composition
5. Configuration settings
6. Error messages and logs
7. Steps to reproduce
8. Server log excerpts (~50 lines around error)

---

## Performance Tuning Checklist

- [ ] Tested with small dataset (1000 files)
- [ ] Tested with medium dataset (5000 files)
- [ ] Tested with large dataset (10000 files)
- [ ] Optimized chunk size for use case
- [ ] Tuned retrieval threshold
- [ ] Adjusted concurrency for hardware
- [ ] Tested OCR performance (if needed)
- [ ] Verified incremental indexing works
- [ ] Checked memory usage under load
- [ ] Tested error handling
- [ ] Documented optimal settings
- [ ] Cross-platform tests passed

---

*Last updated: 2026-03-28*  
*Version: 1.0 (Experimental)*  
*Branch: experimental*
