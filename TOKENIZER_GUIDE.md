# Tokenizer Guide for BigRAG

**Embedding Model:** nomic-ai/nomic-embed-text-v1.5-GGUF  
**Tokenizer Type:** cl100k_base (same as GPT-4)  
**Context Length:** 2048 tokens  
**Recommended Chunk Limit:** 1500-1800 tokens (with safety margin)

---

## Overview

This guide explains tokenization in the context of the BigRAG plugin and how to use accurate token counting to eliminate token limit warnings during embedding.

---

## Understanding Tokenization

### What is Tokenization?

Tokenization is the process of converting text into tokens (numerical IDs) that the embedding model can process. The nomic-embed-text model uses the **cl100k_base** tokenizer, which is a Byte Pair Encoding (BPE) tokenizer.

### Why Token Count Matters

The embedding model has a **hard limit of 2048 tokens** per input. If you send text exceeding this limit:

```
[WARNING] Number of tokens in input string (6423) exceeds model context length (2048). Truncating to 2048 tokens.
```

This truncation can:
- Cut off important information mid-sentence
- Reduce embedding quality
- Waste compute resources on partial text

### Token vs Word vs Character

| Unit | Example | Count |
|------|---------|-------|
| **Characters** | "Hello world" | 11 |
| **Words** | "Hello world" | 2 |
| **Tokens** | "Hello world" | 2 |
| **Tokens** | "Hellooooooooo" | 3-4 (varies) |
| **Tokens** | "function()" | 2-3 (code tokens differently) |

**Rule of thumb:**
- English prose: ~1 token ≈ 4 characters ≈ 0.75 words
- Code/technical: ~1 token ≈ 3 characters (more variable)
- URLs/identifiers: Highly variable (can be 1 token per subword)

---

## Current Implementation (Heuristic)

### How It Works

```typescript
// src/utils/textChunker.ts
export function estimateTokenCount(text: string): number {
  // Base estimate: 1 token ≈ 4 characters
  let estimate = text.length / 4;
  
  // Adjust for code patterns
  const codePatternRatio = (text.match(/[{}[\]()=<>;&|]/g) || []).length / text.length;
  if (codePatternRatio > 0.05) {
    estimate = text.length / 3;  // More conservative for code
  }
  
  // Word-based estimate
  const wordCount = (text.match(/\b\w+\b/g) || []).length;
  const wordBasedEstimate = wordCount * 1.3;
  
  // Use higher estimate for safety
  return Math.ceil(Math.max(estimate, wordBasedEstimate));
}
```

### Accuracy

| Text Type | Accuracy | Typical Error |
|-----------|----------|---------------|
| English prose | ~80-90% | ±10-20% |
| Technical text | ~70-80% | ±20-30% |
| Code | ~60-75% | ±25-40% |
| Mixed content | ~70-85% | ±15-30% |

### Why It Fails

1. **Underestimation for dense text:** Code, URLs, and technical identifiers often tokenize into more tokens than expected
2. **No awareness of BPE merges:** "unbelievable" = 1 token, "un·believ·able" = 3 tokens
3. **Special characters:** `@#$%^&*` can each be separate tokens

---

## Tokenizer-Based Implementation (Accurate)

### Installation

The `gpt-tokenizer` package is already installed (v3.4.0).

```bash
npm list gpt-tokenizer
# Should show: gpt-tokenizer@3.4.0
```

### Usage

```typescript
// src/utils/tokenAwareChunker.ts
import { encode } from 'gpt-tokenizer/cl100k_base';

/**
 * Count exact tokens using cl100k_base tokenizer
 */
export function countTokens(text: string): number {
  return encode(text).length;
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
```

### Performance

| Operation | Time (1000 words) | Time (10000 words) |
|-----------|-------------------|--------------------|
| `estimateTokenCount()` (heuristic) | ~0.05ms | ~0.2ms |
| `countTokens()` (tokenizer) | ~0.5-2ms | ~5-15ms |
| **Overhead** | **+0.45-1.95ms** | **+4.8-14.8ms** |

For a typical indexing run with 10,000 chunks:
- Heuristic validation: ~2 seconds total
- Tokenizer validation: ~20 seconds total
- **Acceptable trade-off for 100% accuracy**

---

## Hybrid Approach (Recommended)

Use fast heuristic for initial chunking, tokenizer for validation:

```typescript
import { encode } from 'gpt-tokenizer/cl100k_base';
import { chunkText, estimateTokenCount } from './textChunker';

export function chunkWithValidation(
  text: string,
  chunkSize: number,
  overlap: number,
  maxTokens: number = 2048
) {
  // Step 1: Fast word-based chunking
  const wordChunks = chunkText(text, chunkSize, overlap);
  
  const validChunks = [];
  for (const chunk of wordChunks) {
    // Step 2: Validate with tokenizer
    const actualTokens = encode(chunk.text).length;
    
    if (actualTokens <= maxTokens) {
      validChunks.push({
        ...chunk,
        tokenCount: actualTokens,
      });
    } else {
      // Step 3: Split oversized chunks using token-based approach
      const tokens = encode(chunk.text);
      const splitChunks = splitByTokens(tokens, maxTokens, overlap);
      validChunks.push(...splitChunks);
    }
  }
  
  return validChunks;
}

function splitByTokens(tokens: number[], maxTokens: number, overlap: number) {
  // Implementation: split token array, decode back to text
  // ...
}
```

### Benefits

1. **Fast path for normal text:** Most chunks pass heuristic + validation
2. **Accurate fallback for edge cases:** Oversized chunks are split correctly
3. **Best of both worlds:** Speed + accuracy

---

## Configuration

### Recommended Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| `MAX_CHUNK_TOKENS` | 1500 | 548 token safety margin |
| `MAX_EMBEDDING_TOKENS` | 2048 | Model hard limit |
| `useTokenizerValidation` | true | Eliminate warnings |

### When to Use Each Method

| Scenario | Recommended Method |
|----------|-------------------|
| **Production (accuracy critical)** | Tokenizer validation |
| **Development (fast iteration)** | Heuristic only |
| **Large-scale indexing (>10K files)** | Hybrid approach |
| **Code documentation** | Tokenizer validation |
| **Prose/novels** | Heuristic sufficient |

---

## Benchmarking

### Compare Heuristic vs Tokenizer

```bash
# Generate test dataset
node dist/benchmarks/generateDataset.js 1000

# Run heuristic benchmark
node dist/benchmarks/realEmbedBench.js \
  --dataset benchmark-data/1000-files \
  --method heuristic

# Run tokenizer benchmark
node dist/benchmarks/realEmbedBench.js \
  --dataset benchmark-data/1000-files \
  --method tokenizer

# Check server logs for warnings
grep -i "exceeds model context" ~/.lmstudio/logs/*.log
```

### Expected Results

| Metric | Heuristic | Tokenizer |
|--------|-----------|-----------|
| Token limit warnings | Some occur | 0 |
| EOS/SEP warnings | Some occur | 0 |
| Indexing time | Baseline | +5-15% |
| Chunk accuracy | ~80% | 100% |

---

## Troubleshooting

### Still Getting Token Limit Warnings

1. **Verify tokenizer is being used:**
   ```typescript
   console.log('Token count:', countTokens(chunk.text));
   ```

2. **Check MAX_CHUNK_TOKENS setting:**
   ```typescript
   console.log('Max chunk tokens:', MAX_CHUNK_TOKENS);
   // Should be 1500-1800, not 2048
   ```

3. **Verify cl100k_base tokenizer:**
   ```typescript
   import { encode } from 'gpt-tokenizer/cl100k_base';
   // NOT: import { encode } from 'gpt-tokenizer';
   // Different models use different tokenizers!
   ```

### Tokenizer Overhead Too High

1. **Use hybrid approach:** Heuristic first, tokenizer validation only for edge cases

2. **Batch tokenization:**
   ```typescript
   // Better: tokenize once, reuse result
   const tokens = encode(text);
   const tokenCount = tokens.length;
   const chunks = splitIntoChunks(tokens, maxTokens);
   ```

3. **Cache token counts:**
   ```typescript
   const tokenCache = new Map<string, number>();
   
   function getCachedTokenCount(text: string): number {
     if (tokenCache.has(text)) {
       return tokenCache.get(text)!;
     }
     const count = encode(text).length;
     tokenCache.set(text, count);
     return count;
   }
   ```

### Wrong Tokenizer for Model

| Model | Tokenizer | Import |
|-------|-----------|--------|
| nomic-embed-text-v1.5 | cl100k_base | `gpt-tokenizer/cl100k_base` |
| GPT-4, GPT-3.5 | cl100k_base | `gpt-tokenizer/cl100k_base` |
| GPT-4o, GPT-4.1 | o200k_base | `gpt-tokenizer/o200k_base` |
| Older models | p50k_base | `gpt-tokenizer/p50k_base` |

---

## API Reference

### gpt-tokenizer Functions

```typescript
import {
  encode,           // Encode text to tokens
  decode,           // Decode tokens to text
  encodeChat,       // Encode chat messages (for chat models)
  isWithinTokenLimit,  // Check if text is within token limit
} from 'gpt-tokenizer/cl100k_base';

// Basic usage
const tokens = encode("Hello world!");
console.log(tokens);  // [15339, 1917, 31]

const text = decode(tokens);
console.log(text);  // "Hello world!"

// Check token limit
const isSafe = isWithinTokenLimit("Hello world!", 10);
console.log(isSafe);  // true
```

### BigRAG Functions (Planned)

```typescript
import {
  countTokens,           // Count exact tokens
  chunkByExactTokens,    // Chunk by token count
  validateChunkTokens,   // Validate chunk is within limit
  chunkWithValidation,   // Hybrid approach
} from './utils/tokenAwareChunker';
```

---

## Best Practices

1. **Always use safety margin:** Set `MAX_CHUNK_TOKENS` to 1500-1800, not 2048

2. **Validate before embedding:** Check token count before sending to embedding API

3. **Log token statistics:** Track min/max/avg tokens per chunk for debugging

4. **Handle edge cases:** Very long words, URLs, code identifiers can skew estimates

5. **Test with real data:** Benchmark with your actual document collection

---

## Migration Guide

### From Heuristic to Tokenizer

**Step 1: Add tokenizer import**
```typescript
// Add to src/utils/textChunker.ts
import { encode } from 'gpt-tokenizer/cl100k_base';
```

**Step 2: Update estimateTokenCount**
```typescript
export function estimateTokenCount(text: string): number {
  // Option A: Use tokenizer directly (accurate but slower)
  return encode(text).length;
  
  // Option B: Keep heuristic, add validation elsewhere
  // ... existing heuristic code ...
}
```

**Step 3: Add validation in indexManager**
```typescript
// In src/ingestion/indexManager.ts, before embedding
const safeChunks = allChunks.filter((chunk) => {
  const tokens = encode(chunk.text).length;
  return tokens <= MAX_EMBEDDING_TOKENS;
});
```

**Step 4: Test and benchmark**
```bash
npm run build
node dist/benchmarks/tokenizerBench.js
```

---

## Resources

- [gpt-tokenizer npm](https://www.npmjs.com/package/gpt-tokenizer)
- [gpt-tokenizer playground](https://gpt-tokenizer.dev/)
- [OpenAI Tokenizer](https://platform.openai.com/tokenizer)
- [cl100k_base tokenizer spec](https://github.com/openai/tiktoken)

---

*Last updated: 2026-03-28*  
*Version: 1.0 (Experimental)*  
*Branch: experimental*
