//! Tokenizer module for accurate token counting
//! Uses tiktoken-rs for cl100k_base tokenizer (compatible with nomic-embed-text-v1.5)

use napi_derive::napi;
use rayon::prelude::*;
use tiktoken_rs::cl100k_base;
use napi::Result as NapiResult;

/// Result of token counting
#[napi(object)]
pub struct TokenCountResult {
    pub text: String,
    pub token_count: u32,
}

/// Chunk result with token-accurate boundaries
#[napi(object)]
pub struct TokenChunk {
    pub text: String,
    pub token_count: u32,
    pub start_token: u32,
    pub end_token: u32,
}

/// Count tokens in text using cl100k_base tokenizer
/// 
/// @param text - The text to count tokens in
/// @returns The number of tokens
#[napi]
pub fn count_tokens(text: String) -> NapiResult<u32> {
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;
    let tokens = bpe.encode_with_special_tokens(&text);
    Ok(tokens.len() as u32)
}

/// Count tokens in multiple texts in parallel
/// 
/// @param texts - Array of texts to count
/// @returns Array of token count results
#[napi]
pub fn count_tokens_batch(texts: Vec<String>) -> NapiResult<Vec<TokenCountResult>> {
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;
    
    let results: Vec<TokenCountResult> = texts
        .par_iter()
        .map(|text| {
            let tokens = bpe.encode_with_special_tokens(text);
            TokenCountResult {
                text: text.clone(),
                token_count: tokens.len() as u32,
            }
        })
        .collect();
    
    Ok(results)
}

/// Validate if text is within token limit
/// 
/// @param text - The text to validate
/// @param max_tokens - Maximum allowed tokens (default: 2048)
/// @returns true if within limit, false otherwise
#[napi]
pub fn validate_token_limit(text: String, max_tokens: Option<u32>) -> NapiResult<bool> {
    let max = max_tokens.unwrap_or(2048);
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;
    let tokens = bpe.encode_with_special_tokens(&text);
    Ok(tokens.len() <= max as usize)
}

/// Chunk text by exact token count
/// 
/// @param text - The text to chunk
/// @param max_tokens - Maximum tokens per chunk
/// @param overlap - Token overlap between chunks
/// @returns Array of chunks with token-accurate boundaries
#[napi]
pub fn chunk_by_tokens(
    text: String,
    max_tokens: u32,
    overlap: u32,
) -> NapiResult<Vec<TokenChunk>> {
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;
    let tokens = bpe.encode_with_special_tokens(&text);
    
    let mut chunks = Vec::new();
    let mut start_idx = 0u32;
    
    while start_idx < tokens.len() as u32 {
        let end_idx = ((start_idx as usize + max_tokens as usize).min(tokens.len())) as u32;
        
        // Extract token slice
        let chunk_tokens: Vec<u32> = tokens[start_idx as usize..end_idx as usize].iter().map(|&t| t as u32).collect();
        
        // Decode back to text
        let chunk_text = bpe
            .decode(chunk_tokens)
            .unwrap_or_else(|_| String::new());
        
        chunks.push(TokenChunk {
            text: chunk_text,
            token_count: end_idx - start_idx,
            start_token: start_idx,
            end_token: end_idx,
        });
        
        // Move forward by (max_tokens - overlap)
        let step = if max_tokens > overlap {
            max_tokens - overlap
        } else {
            1
        };
        
        start_idx += step;
        
        // Break if we've reached the end
        if end_idx >= tokens.len() as u32 {
            break;
        }
    }
    
    Ok(chunks)
}

/// Chunk multiple texts by tokens in parallel
/// 
/// @param texts - Array of texts to chunk
/// @param max_tokens - Maximum tokens per chunk
/// @param overlap - Token overlap between chunks
/// @returns Array of chunk arrays (grouped by input text)
#[napi]
pub fn chunk_texts_by_tokens(
    texts: Vec<String>,
    max_tokens: u32,
    overlap: u32,
) -> NapiResult<Vec<Vec<TokenChunk>>> {
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;
    
    let results: Vec<Vec<TokenChunk>> = texts
        .par_iter()
        .map(|text| {
            let tokens = bpe.encode_with_special_tokens(text);
            let mut chunks = Vec::new();
            let mut start_idx = 0u32;
            
            while start_idx < tokens.len() as u32 {
                let end_idx = ((start_idx as usize + max_tokens as usize).min(tokens.len())) as u32;
                let chunk_tokens: Vec<u32> = tokens[start_idx as usize..end_idx as usize].iter().map(|&t| t as u32).collect();
                let chunk_text = bpe.decode(chunk_tokens).unwrap_or_else(|_| String::new());
                
                chunks.push(TokenChunk {
                    text: chunk_text,
                    token_count: end_idx - start_idx,
                    start_token: start_idx,
                    end_token: end_idx,
                });
                
                let step = if max_tokens > overlap { max_tokens - overlap } else { 1 };
                start_idx += step;
                if end_idx >= tokens.len() as u32 { break; }
            }
            Ok(chunks)
        })
        .collect::<NapiResult<Vec<_>>>()?;

    Ok(results)
}

/// Get token count and character statistics for text
///
/// @param text - The text to analyze
/// @returns Token count, character count, and tokens per character ratio
#[napi]
pub fn get_token_stats(text: String) -> NapiResult<TokenStats> {
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;
    let tokens = bpe.encode_with_special_tokens(&text);

    let token_count = tokens.len();
    let char_count = text.chars().count();
    let tokens_per_char = if char_count > 0 {
        token_count as f64 / char_count as f64
    } else {
        0.0
    };

    Ok(TokenStats {
        token_count: token_count as u32,
        char_count: char_count as u32,
        tokens_per_char,
    })
}

/// Token statistics
#[napi(object)]
pub struct TokenStats {
    pub token_count: u32,
    pub char_count: u32,
    pub tokens_per_char: f64,
}

/// Filter texts that exceed token limit
///
/// @param texts - Array of texts to filter
/// @param max_tokens - Maximum allowed tokens
/// @returns Array of texts that are within the limit
#[napi]
pub fn filter_by_token_limit(
    texts: Vec<String>,
    max_tokens: u32,
) -> NapiResult<Vec<String>> {
    let bpe = cl100k_base().map_err(|e| napi::Error::from_reason(format!("Tokenizer error: {}", e)))?;

    let filtered: Vec<String> = texts
        .into_par_iter()
        .filter(|text| {
            let tokens = bpe.encode_with_special_tokens(text);
            tokens.len() <= max_tokens as usize
        })
        .collect();

    Ok(filtered)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_tokens() {
        let result = count_tokens("Hello, world!".to_string()).unwrap();
        assert!(result > 0);
    }

    #[test]
    fn test_validate_token_limit() {
        let result = validate_token_limit("Hello, world!".to_string(), Some(100)).unwrap();
        assert!(result);
    }

    #[test]
    fn test_chunk_by_tokens() {
        let text = "This is a test. ".repeat(100);
        let chunks = chunk_by_tokens(text, 50, 10).unwrap();
        assert!(!chunks.is_empty());
        
        // Verify each chunk is within limit
        for chunk in &chunks {
            assert!(chunk.token_count <= 50);
        }
    }
}
