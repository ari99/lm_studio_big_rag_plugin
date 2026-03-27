# Vector Store Indexing Performance Analysis

**Date:** 2026-03-27  
**Issue:** Vector store indexing is slow

---

## Root Cause Analysis

After analyzing the code, I've identified **3 major bottlenecks**:

### 1. ❌ Sequential `addChunks` Calls (CRITICAL)

**Location:** `src/ingestion/indexManager.ts` line 365-367

```typescript
// Add all chunks to vector store
for (const [docIndex, documentChunks] of chunksByFile.entries()) {
  const doc = validDocs[docIndex];
  await vectorStore.addChunks(documentChunks);  // ← SEQUENTIAL CALLS
  console.log(`Indexed ${documentChunks.length} chunks from ${doc.file.name}`);
}
```

**Problem:**
- Each file's chunks are added **one at a time** with `await`
- For 100 files = 100 separate `addChunks` calls
- Each call has mutex overhead + shard I/O

**Impact:** ~100ms overhead per call × 100 files = **10 seconds wasted**

---

### 2. ❌ Mutex Serialization (CRITICAL)

**Location:** `src/vectorstore/vectorStore.ts` line 104-107

```typescript
async addChunks(chunks: DocumentChunk[]): Promise<void> {
  // ...
  this.updateMutex = this.updateMutex.then(async () => {
    await this.activeShard!.beginUpdate();
    try {
      for (const chunk of chunks) {  // ← ANOTHER LOOP
        // ... upsertItem per chunk
      }
    }
  });
  return this.updateMutex;
}
```

**Problem:**
- `updateMutex` serializes ALL `addChunks` calls
- Even if called in parallel, they execute sequentially
- Each call does `beginUpdate()` → loop → `endUpdate()`

**Impact:** Cannot parallelize vector store writes

---

### 3. ❌ Per-Chunk Upsert (MODERATE)

**Location:** `src/vectorstore/vectorStore.ts` line 112-120

```typescript
for (const chunk of chunks) {
  const metadata: ChunkMetadata = { ... };
  await this.activeShard!.upsertItem({  // ← ONE CALL PER CHUNK
    id: chunk.id,
    vector: chunk.vector,
    metadata,
  });
}
```

**Problem:**
- Each chunk is upserted individually
- No batch insert API usage
- Vectra's `LocalIndex` might support batch operations

**Impact:** ~1-5ms per chunk × 1000 chunks = **1-5 seconds**

---

## Performance Impact

### Current Flow (100 files, 1000 chunks)

```
Embedding (batch)          → 3.5s   ✓ Fast
└─ addChunks(file1)        → 100ms
   └─ upsertItem(chunk1)   → 5ms
   └─ upsertItem(chunk2)   → 5ms
   └─ ... (10 chunks)
└─ addChunks(file2)        → 100ms
   └─ upsertItem(chunk1)   → 5ms
   └─ ... (10 chunks)
└─ ... (98 more files)

Total vector store time: ~10 seconds (100 files × 100ms)
```

### Optimized Flow

```
Embedding (batch)          → 3.5s
└─ addChunks(ALL FILES)    → 500ms  ✓ Single call
   └─ upsertItem(chunk1)   → 5ms
   └─ upsertItem(chunk2)   → 5ms
   └─ ... (1000 chunks)

Total vector store time: ~5.5 seconds (5s for upserts + 0.5s overhead)
```

**Expected Speedup: 2x faster** (10s → 5s for vector store)

---

## Solutions

### Solution 1: Batch All Chunks (EASY, 2x speedup)

**Change:** Collect ALL chunks into one array, call `addChunks` once

```typescript
// OLD: Sequential per-file calls
for (const [docIndex, documentChunks] of chunksByFile.entries()) {
  await vectorStore.addChunks(documentChunks);
}

// NEW: Single batch call
const allDocumentChunks: DocumentChunk[] = [];
for (const [, documentChunks] of chunksByFile.entries()) {
  allDocumentChunks.push(...documentChunks);
}
await vectorStore.addChunks(allDocumentChunks);
```

**Impact:**
- ✅ Eliminates per-call overhead (100 calls → 1 call)
- ✅ Reduces mutex contention
- ✅ Simple change, low risk

---

### Solution 2: Remove Mutex, Use Single Transaction (MEDIUM, 3x speedup)

**Change:** Wrap entire indexing in one transaction

```typescript
// In indexManager.ts
await vectorStore.beginTransaction();
try {
  await vectorStore.addChunks(allDocumentChunks);
} finally {
  await vectorStore.endTransaction();
}
```

**Impact:**
- ✅ Single `beginUpdate()` / `endUpdate()` pair
- ✅ No mutex overhead
- ⚠️ Requires vector store API changes

---

### Solution 3: Batch Upsert API (HARD, 5x speedup)

**Change:** Use Vectra's batch API if available, or bulk insert

```typescript
// If Vectra supports it:
await this.activeShard.upsertItems(items);  // Batch API

// Or bulk insert without upsert:
await this.activeShard.insertMany(items);
```

**Impact:**
- ✅ Fastest option
- ⚠️ Requires checking Vectra API
- ⚠️ May need schema changes

---

## Recommendation

**Implement Solution 1 immediately** (5 minutes, 2x speedup):

```typescript
// src/ingestion/indexManager.ts line ~365

// OLD CODE:
for (const [docIndex, documentChunks] of chunksByFile.entries()) {
  const doc = validDocs[docIndex];
  await vectorStore.addChunks(documentChunks);
  console.log(`Indexed ${documentChunks.length} chunks from ${doc.file.name}`);
}

// NEW CODE:
const allDocumentChunks: DocumentChunk[] = [];
for (const [, documentChunks] of chunksByFile.entries()) {
  allDocumentChunks.push(...documentChunks);
}
console.log(`Adding ${allDocumentChunks.length} chunks to vector store...`);
await vectorStore.addChunks(allDocumentChunks);
```

**Expected Results:**
- 100 files: ~10s → ~5s (2x faster)
- 1000 files: ~100s → ~50s (2x faster)

---

## Additional Optimizations (Future)

### 4. Parallel Shard Writes

If using multiple shards, write to different shards in parallel:

```typescript
// Group chunks by shard, write in parallel
const chunksByShard = groupByShard(allDocumentChunks);
await Promise.all(
  chunksByShard.map(([shard, chunks]) => shard.addChunks(chunks))
);
```

### 5. Disable Duplicate Checks

If file hashes are unique, skip `upsertItem` (which checks for duplicates):

```typescript
// Use insertItem instead of upsertItem (if available)
await this.activeShard.insertItem({...});  // Faster, no duplicate check
```

### 6. Memory-Mapped Index

For very large datasets, consider memory-mapped index files instead of loading entire shards into memory.

---

## Benchmark Plan

Test with 100 files (~1000 chunks):

```bash
# Before
time node dist/cliIndex.js --documents /path/to/docs --vector-store /path/to/db

# After (Solution 1)
time node dist/cliIndex.js --documents /path/to/docs --vector-store /path/to/db

# Expected: 50% reduction in vector store time
```

---

## Summary

| Bottleneck | Impact | Solution | Effort |
|------------|--------|----------|--------|
| Sequential `addChunks` | 10s → 5s | Batch all chunks | 5 min |
| Mutex serialization | Prevents parallelism | Single transaction | 30 min |
| Per-chunk upsert | 5ms/chunk | Batch upsert API | 2 hours |

**Immediate action:** Implement Solution 1 for instant 2x speedup.

---

*Analysis by: MightyPickle*  
*BigRAG Plugin v1.0.0*
