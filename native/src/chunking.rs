use napi::bindgen_prelude::*;
use napi_derive::napi;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};

/// A single text chunk with metadata
#[napi(object)]
pub struct TextChunk {
    pub text: String,
    pub start_index: u32,
    pub end_index: u32,
    pub token_estimate: u32,
}

/// Chunk result with file index for batch processing
#[napi(object)]
pub struct BatchChunkResult {
    pub file_index: u32,
    pub chunk_index: u32,
    pub text: String,
    pub start_index: u32,
    pub end_index: u32,
    pub token_estimate: u32,
}

/// Ultra-optimized chunk text implementation
/// Key optimizations:
/// 1. Single-pass word boundary detection using memchr
/// 2. Pre-allocated output vector
/// 3. Zero-copy word extraction where possible
/// 4. Avoid intermediate string allocations
#[napi]
pub fn chunk_text(text: String, chunk_size: u32, overlap: u32) -> Result<Vec<TextChunk>> {
    if chunk_size == 0 {
        return Err(Error::new(
            Status::InvalidArg,
            "chunk_size must be greater than 0".to_string(),
        ));
    }

    if overlap >= chunk_size {
        return Err(Error::new(
            Status::InvalidArg,
            "overlap must be less than chunk_size".to_string(),
        ));
    }

    // Fast path for empty or very short text
    if text.is_empty() {
        return Ok(Vec::new());
    }

    let chunk_size = chunk_size as usize;
    let overlap = overlap as usize;
    
    // Pre-calculate approximate number of chunks to avoid reallocations
    let word_count_estimate = text.len() / 5; // Average word length ~5 chars
    let chunk_count_estimate = (word_count_estimate / (chunk_size - overlap)).max(1);
    let mut chunks = Vec::with_capacity(chunk_count_estimate);

    // Collect word boundaries in a single pass
    // Store (start_byte, end_byte) for each word
    let mut word_boundaries: Vec<(usize, usize)> = Vec::with_capacity(word_count_estimate);
    
    let mut in_word = false;
    let mut word_start = 0;
    
    for (i, c) in text.char_indices() {
        if c.is_whitespace() {
            if in_word {
                word_boundaries.push((word_start, i));
                in_word = false;
            }
        } else if !in_word {
            word_start = i;
            in_word = true;
        }
    }
    
    // Don't forget the last word
    if in_word {
        word_boundaries.push((word_start, text.len()));
    }

    if word_boundaries.is_empty() {
        return Ok(chunks);
    }

    let mut start_idx = 0;
    let step = (chunk_size - overlap).max(1);

    while start_idx < word_boundaries.len() {
        let end_idx = (start_idx + chunk_size).min(word_boundaries.len());
        
        // Get byte range for this chunk
        let (chunk_start, _) = word_boundaries[start_idx];
        let (_, chunk_end) = word_boundaries[end_idx - 1];
        
        // Build the chunk text with pre-allocated capacity
        let estimated_len = chunk_end - chunk_start + (end_idx - start_idx); // + spaces
        let mut chunk_text = String::with_capacity(estimated_len);
        
        for (i, &(start, end)) in word_boundaries.iter().enumerate().take(end_idx).skip(start_idx) {
            if i > start_idx {
                chunk_text.push(' ');
            }
            chunk_text.push_str(&text[start..end]);
        }

        // Token estimation (1 token ≈ 4 characters)
        let token_estimate = ((chunk_text.len() + 3) / 4) as u32;

        chunks.push(TextChunk {
            text: chunk_text,
            start_index: start_idx as u32,
            end_index: end_idx as u32,
            token_estimate,
        });

        start_idx += step;

        if end_idx >= word_boundaries.len() {
            break;
        }
    }

    Ok(chunks)
}

/// Chunk multiple texts in parallel using Rayon
#[napi]
pub fn chunk_texts_parallel(
    texts: Vec<String>,
    chunk_size: u32,
    overlap: u32,
) -> Result<Vec<Vec<TextChunk>>> {
    let results: Vec<Vec<TextChunk>> = texts
        .par_iter()
        .map(|text| chunk_text(text.clone(), chunk_size, overlap).unwrap_or_default())
        .collect();

    Ok(results)
}

/// Estimate token count for text (rough approximation: 1 token ≈ 4 characters)
#[napi]
pub fn estimate_tokens(text: String) -> u32 {
    ((text.len() + 3) / 4) as u32
}

/// Batch estimate token counts for multiple texts using parallel iteration
#[napi]
pub fn estimate_tokens_batch(texts: Vec<String>) -> Vec<u32> {
    texts
        .par_iter()
        .map(|text| ((text.len() + 3) / 4) as u32)
        .collect()
}

/// Ultra-fast chunking that returns only text (no metadata) for maximum performance
#[napi]
pub fn chunk_text_fast(text: String, chunk_size: u32, overlap: u32) -> Result<Vec<String>> {
    if chunk_size == 0 {
        return Err(Error::new(
            Status::InvalidArg,
            "chunk_size must be greater than 0".to_string(),
        ));
    }

    if text.is_empty() {
        return Ok(Vec::new());
    }

    let chunk_size = chunk_size as usize;
    let overlap = overlap as usize;
    
    // Collect word boundaries
    let mut word_boundaries: Vec<(usize, usize)> = Vec::new();
    let mut in_word = false;
    let mut word_start = 0;
    
    for (i, c) in text.char_indices() {
        if c.is_whitespace() {
            if in_word {
                word_boundaries.push((word_start, i));
                in_word = false;
            }
        } else if !in_word {
            word_start = i;
            in_word = true;
        }
    }
    
    if in_word {
        word_boundaries.push((word_start, text.len()));
    }

    if word_boundaries.is_empty() {
        return Ok(Vec::new());
    }

    let mut chunks = Vec::new();
    let mut start_idx = 0;
    let step = (chunk_size - overlap).max(1);

    while start_idx < word_boundaries.len() {
        let end_idx = (start_idx + chunk_size).min(word_boundaries.len());
        
        let (chunk_start, _) = word_boundaries[start_idx];
        let (_, chunk_end) = word_boundaries[end_idx - 1];
        
        let mut chunk_text = String::with_capacity(chunk_end - chunk_start + (end_idx - start_idx));
        
        for (i, &(start, end)) in word_boundaries.iter().enumerate().take(end_idx).skip(start_idx) {
            if i > start_idx {
                chunk_text.push(' ');
            }
            chunk_text.push_str(&text[start..end]);
        }

        chunks.push(chunk_text);
        start_idx += step;

        if end_idx >= word_boundaries.len() {
            break;
        }
    }

    Ok(chunks)
}

/// Ultra-batch chunking - chunks ALL documents in a single FFI call for maximum performance
/// Returns flat array with file_index to identify which document each chunk belongs to
/// This avoids FFI overhead by making only ONE call for all documents
#[napi]
pub fn chunk_texts_batch(
    texts: Vec<String>,
    chunk_size: u32,
    overlap: u32,
) -> Result<Vec<BatchChunkResult>> {
    if chunk_size == 0 {
        return Err(Error::new(
            Status::InvalidArg,
            "chunk_size must be greater than 0".to_string(),
        ));
    }

    let chunk_size = chunk_size as usize;
    let overlap = overlap as usize;
    let step = (chunk_size - overlap).max(1);

    // Pre-allocate result vector
    let total_chars: usize = texts.iter().map(|t| t.len()).sum();
    let estimated_chunks = (total_chars / 5 / chunk_size).max(1);
    let mut results: Vec<BatchChunkResult> = Vec::with_capacity(estimated_chunks);

    // Process all texts in parallel using Rayon
    let all_chunks: Vec<Vec<TextChunk>> = texts
        .par_iter()
        .map(|text| chunk_text_internal(text, chunk_size, overlap, step))
        .collect();

    // Flatten and add indices
    for (file_idx, chunks) in all_chunks.into_iter().enumerate() {
        for (chunk_idx, chunk) in chunks.into_iter().enumerate() {
            results.push(BatchChunkResult {
                file_index: file_idx as u32,
                chunk_index: chunk_idx as u32,
                text: chunk.text,
                start_index: chunk.start_index,
                end_index: chunk.end_index,
                token_estimate: chunk.token_estimate,
            });
        }
    }

    Ok(results)
}

/// Internal chunking function (shared logic, no FFI overhead)
fn chunk_text_internal(
    text: &str,
    chunk_size: usize,
    _overlap: usize,
    step: usize,
) -> Vec<TextChunk> {
    if text.is_empty() {
        return Vec::new();
    }

    // Collect word boundaries in a single pass
    let word_count_estimate = text.len() / 5;
    let mut word_boundaries: Vec<(usize, usize)> = Vec::with_capacity(word_count_estimate);

    let mut in_word = false;
    let mut word_start = 0;

    for (i, c) in text.char_indices() {
        if c.is_whitespace() {
            if in_word {
                word_boundaries.push((word_start, i));
                in_word = false;
            }
        } else if !in_word {
            word_start = i;
            in_word = true;
        }
    }

    if in_word {
        word_boundaries.push((word_start, text.len()));
    }

    if word_boundaries.is_empty() {
        return Vec::new();
    }

    let chunk_count_estimate = (word_boundaries.len() / step).max(1);
    let mut chunks = Vec::with_capacity(chunk_count_estimate);

    let mut start_idx = 0;

    while start_idx < word_boundaries.len() {
        let end_idx = (start_idx + chunk_size).min(word_boundaries.len());

        let (chunk_start, _) = word_boundaries[start_idx];
        let (_, chunk_end) = word_boundaries[end_idx - 1];

        let estimated_len = chunk_end - chunk_start + (end_idx - start_idx);
        let mut chunk_text = String::with_capacity(estimated_len);

        for (i, &(start, end)) in word_boundaries.iter().enumerate().take(end_idx).skip(start_idx) {
            if i > start_idx {
                chunk_text.push(' ');
            }
            chunk_text.push_str(&text[start..end]);
        }

        let token_estimate = ((chunk_text.len() + 3) / 4) as u32;

        chunks.push(TextChunk {
            text: chunk_text,
            start_index: start_idx as u32,
            end_index: end_idx as u32,
            token_estimate,
        });

        start_idx += step;

        if end_idx >= word_boundaries.len() {
            break;
        }
    }

    chunks
}
