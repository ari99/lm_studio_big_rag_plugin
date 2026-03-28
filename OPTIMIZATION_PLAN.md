# BigRAG Optimization Plan

**Document Purpose:** Comprehensive technical specification for all identified optimization opportunities in the BigRAG plugin.

**Embedding Model:** nomic-ai/nomic-embed-text-v1.5-GGUF  
**Tokenizer:** cl100k_base  
**Context Length:** 2048 tokens  
**Target Platforms:** Linux, macOS (Intel/ARM), Windows

---

## Executive Summary

**12 optimization opportunities identified** with potential **3-4x overall pipeline speedup**.

| Priority | Component | Expected Speedup | Implementation Effort |
|----------|-----------|------------------|----------------------|
| HIGH | Tokenizer-based chunking | Accuracy fix | 2-3 days |
| HIGH | PDF parser with OCR | 5-10x | 1 week |
| HIGH | Image OCR module | 8-15x | 3-4 days |
| HIGH | EPUB parser | 3-5x | 2-3 days |
| MEDIUM | Markdown stripping | 4-6x | 1-2 days |
| MEDIUM | Token estimation | 5-8x | 1 day |
| MEDIUM | Vector search | 2-4x | 3-4 days |
| LOW | File metadata | 2-3x | 1 day |
| LOW | Failure registry | 3-5x | 1 day |

---

## Phase 1: Tokenizer-Based Chunking

**Branch:** `experimental`  
**Status:** In Progress  
**Priority:** CRITICAL (eliminates token limit warnings)

### Technical Background

**nomic-ai/nomic-embed-text-v1.5** uses the **cl100k_base** tokenizer (same as GPT-4).

Current implementation uses heuristic estimation:
```typescript
// Current: Character/word-based estimation (~70-80% accurate)
estimate = text.length / 4;
wordBasedEstimate = wordCount * 1.3;
```

Problem: Underestimates for dense technical text, code, URLs → token limit warnings.

### Implementation Specification

**File: `src/utils/tokenAwareChunker.ts`** (NEW)

```typescript
import { encode } from 'gpt-tokenizer/cl100k_base';

export interface TokenChunkResult {
  text: string;
  tokenCount: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Count exact tokens using cl100k_base tokenizer
 */
export function countTokens(text: string): number {
  return encode(text).length;
}

/**
 * Chunk text by exact token count (not word estimates)
 */
export function chunkByExactTokens(
  text: string,
  maxTokens: number,
  overlap: number
): TokenChunkResult[] {
  const tokens = encode(text);
  const chunks: TokenChunkResult[] = [];
  let startIdx = 0;
  
  while (startIdx < tokens.length) {
    const endIdx = Math.min(startIdx + maxTokens, tokens.length);
    const chunkTokens = tokens.slice(startIdx, endIdx);
    const chunkText = decode(chunkTokens); // Decode back to text
    
    chunks.push({
      text: chunkText,
      tokenCount: chunkTokens.length,
      startIndex: startIdx,
      endIndex: endIdx,
    });
    
    startIdx += Math.max(1, maxTokens - overlap);
    if (endIdx >= tokens.length) break;
  }
  
  return chunks;
}

/**
 * Validate chunk is within token limit
 */
export function validateChunkTokens(
  text: string,
  maxTokens: number = 2048
): boolean {
  return encode(text).length <= maxTokens;
}

/**
 * Hybrid approach: Fast word-based chunking + tokenizer validation
 */
export function chunkWithValidation(
  text: string,
  chunkSize: number,  // words
  overlap: number,
  maxTokens: number = 2048
): TokenChunkResult[] {
  // Use fast word-based chunking
  const wordChunks = chunkText(text, chunkSize, overlap);
  
  // Validate each chunk with tokenizer
  const validChunks: TokenChunkResult[] = [];
  for (const chunk of wordChunks) {
    const tokenCount = encode(chunk.text).length;
    
    if (tokenCount <= maxTokens) {
      validChunks.push({
        text: chunk.text,
        tokenCount,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
      });
    } else {
      // Split oversized chunk using token-based approach
      const splitChunks = chunkByExactTokens(chunk.text, maxTokens, overlap);
      validChunks.push(...splitChunks);
    }
  }
  
  return validChunks;
}
```

### Integration Points

**File: `src/ingestion/indexManager.ts`** (MODIFY)

Add tokenizer validation before embedding:

```typescript
// Line 367-380: Add tokenizer validation
const safeChunks = allChunks.filter((chunk, idx) => {
  // Current heuristic check
  const heuristicTokens = estimateTokenCount(chunk.text);
  
  // NEW: Tokenizer validation (optional, based on config)
  if (useTokenizerValidation) {
    const actualTokens = countTokens(chunk.text);
    if (actualTokens > MAX_EMBEDDING_TOKENS) {
      console.warn(`Chunk ${idx} from ${chunk.doc.file.name}: ${actualTokens} tokens exceeds limit`);
      return false;
    }
  } else {
    // Fallback to heuristic
    if (heuristicTokens > MAX_EMBEDDING_TOKENS) {
      return false;
    }
  }
  return true;
});
```

### Benchmark Plan

**File: `benchmarks/tokenizerBench.ts`** (NEW)

```typescript
import { estimateTokenCount } from '../src/utils/textChunker';
import { countTokens } from '../src/utils/tokenAwareChunker';

// Compare accuracy and performance
const testTexts = [
  generateProse(1000),
  generateCode(1000),
  generateTechnical(1000),
  generateMixed(1000),
];

for (const text of testTexts) {
  const actual = countTokens(text);
  const heuristic = estimateTokenCount(text);
  const accuracy = heuristic / actual;
  const error = Math.abs(actual - heuristic) / actual * 100;
  
  console.log(`Text type: ${type}`);
  console.log(`  Actual tokens: ${actual}`);
  console.log(`  Heuristic estimate: ${heuristic}`);
  console.log(`  Accuracy: ${(accuracy * 100).toFixed(1)}%`);
  console.log(`  Error: ${error.toFixed(1)}%`);
}
```

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Token limit warnings | 0 | Server logs |
| EOS/SEP warnings | 0 | Server logs |
| Tokenization overhead | <15% | Benchmark time |
| Chunk accuracy | 100% | All chunks ≤2048 tokens |

---

## Phase 2: Rust Parser Acceleration

### 2.1 PDF Parser with Native OCR

**File: `native/src/pdf_parser.rs`** (NEW)  
**Priority:** HIGH  
**Expected Speedup:** 5-10x (parsing), 8-15x (OCR)

#### Current Bottleneck

```typescript
// Current: Sequential Tesseract.js WASM calls
for (const image of images) {
  const { data: { text } } = await worker.recognize(image.buffer);
  // One image at a time, WASM bridge overhead
}
```

#### Rust Implementation

**Dependencies (add to `native/Cargo.toml`):**
```toml
lopdf = "0.31"        # PDF parsing
tesseract = "0.16"    # Native OCR bindings
image = "0.25"        # Image processing
rayon = "1.10"        # Parallel processing
```

**Function Signatures:**
```rust
use napi_derive::napi;
use rayon::prelude::*;

#[napi]
pub fn extract_pdf_text(path: String) -> Result<String> {
    // Use lopdf for text extraction
    // Parallel page processing
}

#[napi]
pub async fn ocr_pdf_pages(path: String, max_pages: u32) -> Result<String> {
    // Extract images from PDF
    // Parallel OCR with Rayon
}

#[napi]
pub async fn ocr_images_batch(paths: Vec<String>) -> Result<Vec<OcrResult>> {
    // Batch OCR for multiple images
    // Worker pooling to avoid initialization overhead
}
```

#### TypeScript Integration

**File: `src/parsers/pdfParser.ts`** (MODIFY)

```typescript
import { extractPdfText, ocrPdfPages } from '../native';

// Replace sequential OCR with parallel Rust implementation
const ocrResult = await ocrPdfPages(filePath, OCR_MAX_PAGES);
```

### 2.2 Image OCR Module

**File: `native/src/ocr.rs`** (NEW)  
**Priority:** HIGH  
**Expected Speedup:** 8-15x

#### Current Bottleneck

```typescript
// Current: Single-threaded, worker creation per image
const worker = await createWorker("eng");
const { data: { text } } = await worker.recognize(image.buffer);
await worker.terminate();
```

#### Rust Implementation

```rust
use tesseract::{TessApi, PageSegMode};
use rayon::prelude::*;
use image::{DynamicImage, GenericImageView};

pub struct OcrWorker {
    tess: TessApi,
}

impl OcrWorker {
    pub fn new(lang: &str) -> Result<Self> {
        let mut tess = TessApi::new(lang, PageSegMode::SingleBlock);
        Ok(Self { tess })
    }
    
    pub fn recognize(&mut self, image: &DynamicImage) -> Result<String> {
        self.tess.set_image(image);
        Ok(self.tess.get_utf8_text().to_string())
    }
}

#[napi]
pub async fn ocr_images_parallel(
    paths: Vec<String>,
    lang: String,
) -> Vec<OcrResult> {
    // Parallel processing with Rayon
    paths.par_iter().map(|path| {
        let mut worker = OcrWorker::new(&lang).unwrap();
        let image = image::open(path).unwrap();
        let text = worker.recognize(&image).unwrap();
        OcrResult {
            path: path.clone(),
            text,
        }
    }).collect()
}
```

### 2.3 EPUB Parser

**File: `native/src/epub_parser.rs`** (NEW)  
**Priority:** HIGH  
**Expected Speedup:** 3-5x

#### Current Bottleneck

```typescript
// Current: Sequential chapter reading
for (const chapter of chapters) {
  const text = await readChapter(chapterId);
  textParts.push(text);
}
```

#### Rust Implementation

**Dependencies:**
```toml
epub = "2.0"          # EPUB parsing
scraper = "0.19"      # HTML parsing (faster than regex)
```

```rust
use epub::doc::{EpubDoc, DocError};
use scraper::{Html, Selector};
use rayon::prelude::*;

#[napi]
pub fn extract_epub_text(path: String) -> Result<String> {
    let mut doc = EpubDoc::new(path).map_err(|e| e.to_string())?;
    
    // Collect all chapter IDs
    let chapter_ids: Vec<String> = doc.get_toc().iter()
        .map(|item| item.id.clone())
        .collect();
    
    // Parallel chapter extraction
    let texts: Vec<String> = chapter_ids.par_iter()
        .filter_map(|id| {
            doc.set_current_resource(id).ok()?;
            let html = String::from_utf8_lossy(&doc.get_current().unwrap());
            Some(strip_html(&html))
        })
        .collect();
    
    Ok(texts.join("\n\n"))
}

fn strip_html(html: &str) -> String {
    let document = Html::parse_document(html);
    document.text().collect()
}
```

### 2.4 Text/Markdown Parser

**File: `native/src/text_parser.rs`** (NEW)  
**Priority:** MEDIUM  
**Expected Speedup:** 4-6x

#### Current Bottleneck

```typescript
// Current: 12+ sequential regex passes
output = output.replace(/```[\s\S]*?```/g, " ");
output = output.replace(/`([^`]+)`/g, "$1");
output = output.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1 ");
// ... 10+ additional passes
```

#### Rust Implementation

**Dependencies:**
```toml
pulldown-cmark = "0.10"  # Markdown parser
regex = "1.10"           # Compiled regex
```

```rust
use pulldown_cmark::{Parser, Options, Event, Tag};
use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref CODE_BLOCK_REGEX: Regex = Regex::new(r"```[\s\S]*?```").unwrap();
    static ref INLINE_CODE_REGEX: Regex = Regex::new(r"`([^`]+)`").unwrap();
    // ... pre-compiled regex patterns
}

#[napi]
pub fn strip_markdown(text: String) -> String {
    // Single-pass markdown parsing
    let mut options = Options::empty();
    options.insert(Options::ENABLE_STRIKETHROUGH);
    
    let parser = Parser::new_ext(&text, options);
    
    let mut result = String::new();
    for event in parser {
        match event {
            Event::Text(text) => result.push_str(&text),
            Event::Code(code) => result.push_str(&code),
            Event::SoftBreak | Event::HardBreak => result.push(' '),
            _ => {} // Skip other events (headers, lists, etc.)
        }
    }
    
    result
}

#[napi]
pub fn normalize_text(text: String) -> String {
    // Single-pass normalization
    text.replace("\r\n", "\n")
        .replace("\r", "\n")
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
}
```

---

## Phase 3: Vector Store Optimization

### 3.1 Parallel Shard Operations

**File: `native/src/vector_ops.rs`** (NEW)  
**Priority:** MEDIUM  
**Expected Speedup:** 2-4x

#### Current Bottleneck

```typescript
// Current: Sequential shard querying
for (const dir of this.shardDirs) {
  const shard = this.openShard(dir);
  const results = await shard.queryItems(queryVector, "", limit);
  // Merge all results
}
```

#### Rust Implementation

**Dependencies:**
```toml
ndarray = "0.15"       # Vector operations
simba = "0.8"          # SIMD linear algebra
```

```rust
use ndarray::{Array1, Array2};
use simba::simd::SimdFloat;
use rayon::prelude::*;

#[napi]
pub fn query_shards_parallel(
    shard_paths: Vec<String>,
    query: Vec<f32>,
) -> Vec<SearchResult> {
    // Parallel shard queries
    let results: Vec<Vec<SearchResult>> = shard_paths.par_iter()
        .map(|path| {
            let shard = open_shard(path);
            shard.query_items(&query, "", LIMIT)
        })
        .collect();
    
    // Merge and sort all results
    let mut merged: Vec<SearchResult> = results.into_iter().flatten().collect();
    merged.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
    merged.truncate(LIMIT);
    merged
}

#[napi]
pub fn compute_distances_simd(
    vectors: Vec<Vec<f32>>,
    query: Vec<f32>,
) -> Vec<f32> {
    // SIMD-accelerated distance calculations
    let query_array = Array1::from(query);
    
    vectors.par_iter()
        .map(|vector| {
            let vec_array = Array1::from(vector.clone());
            // Cosine similarity with SIMD
            let dot = vec_array.dot(&query_array);
            let norm_vec = vec_array.norm();
            let norm_query = query_array.norm();
            dot / (norm_vec * norm_query)
        })
        .collect()
}
```

---

## Phase 4: Infrastructure Improvements

### 4.1 Combined File Operations

**File: `native/src/file_ops.rs`** (NEW)  
**Priority:** LOW  
**Expected Speedup:** 2-3x

```rust
use std::fs::{metadata, File};
use std::io::Read;
use sha2::{Sha256, Digest};

#[napi]
pub fn get_file_metadata_with_hash(path: String) -> Result<FileMetadata> {
    // Single syscall for stat + mmap
    let meta = metadata(&path)?;
    
    // Memory-mapped hash calculation
    let mut file = File::open(&path)?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)?;
    
    let mut hasher = Sha256::new();
    hasher.update(&buffer);
    let hash = format!("{:x}", hasher.finalize());
    
    Ok(FileMetadata {
        size: meta.len(),
        mtime: meta.modified()?.duration_since(UNIX_EPOCH)?.as_millis() as u64,
        hash,
    })
}
```

### 4.2 Batch Failure Registry

**File: `native/src/registry.rs`** (NEW)  
**Priority:** LOW  
**Expected Speedup:** 3-5x

```rust
use tokio::fs::{File, OpenOptions};
use tokio::io::AsyncWriteExt;

#[napi]
pub async fn record_failures_batch(failures: Vec<FailureEntry>) -> Result<()> {
    // Batch writes with debouncing
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("failures.json")
        .await?;
    
    let json = serde_json::to_string(&failures)?;
    file.write_all(json.as_bytes()).await?;
    
    Ok(())
}
```

---

## Implementation Timeline

| Phase | Duration | Dependencies | Risk |
|-------|----------|--------------|------|
| 1. Tokenizer | 2-3 days | gpt-tokenizer (installed) | LOW |
| 2.1 PDF Parser | 1 week | lopdf, tesseract crates | MEDIUM |
| 2.2 Image OCR | 3-4 days | tesseract, image crates | MEDIUM |
| 2.3 EPUB Parser | 2-3 days | epub, scraper crates | LOW |
| 2.4 Text Parser | 1-2 days | pulldown-cmark | LOW |
| 3. Vector Store | 3-4 days | ndarray, simba | MEDIUM |
| 4. Infrastructure | 2-3 days | tokio | LOW |

**Total Estimated Time:** 3-4 weeks

---

## Testing Strategy

### Unit Tests

```rust
// Rust side tests
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_extract_pdf_text() {
        let result = extract_pdf_text("test.pdf".to_string()).unwrap();
        assert!(result.len() > 0);
    }
    
    #[test]
    fn test_ocr_images_parallel() {
        let paths = vec!["test1.png".to_string(), "test2.png".to_string()];
        let results = ocr_images_parallel(paths, "eng".to_string()).await;
        assert_eq!(results.len(), 2);
    }
}
```

### Integration Tests

```typescript
// TypeScript side tests
import { extractPdfText } from '../native';

describe('PDF Parser', () => {
  it('should extract text from PDF', async () => {
    const text = await extractPdfText('test.pdf');
    expect(text.length).toBeGreaterThan(0);
  });
});
```

### Benchmark Tests

```typescript
// Performance regression tests
import { bench } from './benchmark-utils';

describe('PDF Parser Performance', () => {
  it('should be faster than TypeScript version', async () => {
    const tsTime = await bench(() => tsParsePdf('test.pdf'));
    const rustTime = await bench(() => rustParsePdf('test.pdf'));
    
    expect(rustTime).toBeLessThan(tsTime * 0.5); // At least 2x faster
  });
});
```

---

## Cross-Platform Build Strategy

### Build Targets

| Platform | Target Triple | CI Runner |
|----------|---------------|-----------|
| Linux x86_64 | `x86_64-unknown-linux-gnu` | Ubuntu (GitHub Actions) |
| macOS Intel | `x86_64-apple-darwin` | macOS (GitHub Actions) |
| macOS ARM | `aarch64-apple-darwin` | macOS (GitHub Actions) |
| Windows | `x86_64-pc-windows-gnu` | Windows (GitHub Actions) |

### GitHub Actions Workflow

```yaml
# .github/workflows/build-native.yml
name: Build Native Module

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - os: macos-latest
            target: x86_64-apple-darwin
          - os: macos-latest
            target: aarch64-apple-darwin
          - os: windows-latest
            target: x86_64-pc-windows-gnu
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Rust
        uses: dtolnay/rust-action@stable
        with:
          targets: ${{ matrix.target }}
      
      - name: Build Native Module
        run: |
          cd native
          npm install
          npm run build -- --target ${{ matrix.target }}
```

---

## Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Token limit warnings | 0 | Server logs |
| PDF parsing speedup | 5x | Benchmark comparison |
| OCR speedup | 10x | Benchmark comparison |
| EPUB parsing speedup | 3x | Benchmark comparison |
| Overall pipeline speedup | 3x | End-to-end benchmark |
| Cross-platform builds | 4/4 | CI/CD success |
| Memory usage | No increase | Peak memory monitoring |
| Test coverage | >80% | Unit + integration tests |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Native module build failures | Pre-built binaries for all platforms |
| Memory safety issues | Property-based testing, extensive unit tests |
| API incompatibility | Maintain TypeScript fallback |
| Platform-specific bugs | CI testing on all platforms |
| Performance regression | Continuous benchmarking in CI |

---

## Appendix: Dependency Reference

### Rust Dependencies

```toml
[dependencies]
napi = "2.16"
napi-derive = "2.16"

# Current
sha2 = "0.10"
rayon = "1.10"
walkdir = "2.5"
memmap2 = "0.9"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Phase 2: Parsers
lopdf = "0.31"
tesseract = "0.16"
image = "0.25"
epub = "2.0"
scraper = "0.19"
pulldown-cmark = "0.10"
regex = "1.10"
lazy_static = "1.4"

# Phase 3: Vector operations
ndarray = "0.15"
simba = "0.8"

# Phase 4: Infrastructure
tokio = { version = "1.0", features = ["full"] }
```

### TypeScript Dependencies

```json
{
  "dependencies": {
    "gpt-tokenizer": "^3.4.0"
  }
}
```

---

*Last updated: 2026-03-28*  
*Version: 1.0 (Experimental)*  
*Branch: experimental*
