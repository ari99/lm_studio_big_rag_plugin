use napi::bindgen_prelude::*;
use napi_derive::napi;
use sha2::{Digest, Sha256};
use std::fs::File;
use memmap2::Mmap;
use std::path::Path;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};

/// Calculate SHA-256 hash of a file using memory-mapped I/O for maximum performance
#[napi]
pub fn hash_file(path: String) -> Result<String> {
    let file_path = Path::new(&path);
    
    if !file_path.exists() {
        return Err(Error::new(
            Status::InvalidArg,
            format!("File does not exist: {}", path),
        ));
    }
    
    let file = File::open(file_path).map_err(|e| {
        Error::new(
            Status::GenericFailure,
            format!("Failed to open file: {}", e),
        )
    })?;
    
    // Use memory-mapped I/O for efficient file reading
    let mmap = unsafe { Mmap::map(&file) }.map_err(|e| {
        Error::new(
            Status::GenericFailure,
            format!("Failed to map file: {}", e),
        )
    })?;
    
    // Calculate hash using SHA-256
    let mut hasher = Sha256::new();
    hasher.update(&mmap);
    let hash = hasher.finalize();
    
    // Convert to hex string
    Ok(hex::encode(hash))
}

/// Calculate SHA-256 hash of multiple files in parallel
#[napi]
pub fn hash_files_parallel(paths: Vec<String>) -> Result<Vec<HashResult>> {
    let results: Vec<HashResult> = paths
        .par_iter()
        .map(|path: &String| {
            match hash_file(path.clone()) {
                Ok(hash) => HashResult {
                    path: path.clone(),
                    hash: Some(hash),
                    error: None,
                },
                Err(e) => HashResult {
                    path: path.clone(),
                    hash: None,
                    error: Some(e.to_string()),
                },
            }
        })
        .collect();
    
    Ok(results)
}

/// Calculate SHA-256 hash of raw data
#[napi]
pub fn hash_data(data: Buffer) -> Result<String> {
    let mut hasher = Sha256::new();
    hasher.update(&data);
    let hash = hasher.finalize();
    Ok(hex::encode(hash))
}

/// Result of a file hash operation
#[napi(object)]
pub struct HashResult {
    pub path: String,
    pub hash: Option<String>,
    pub error: Option<String>,
}

// Re-export hex encoding since we need it
mod hex {
    pub fn encode(bytes: impl AsRef<[u8]>) -> String {
        bytes
            .as_ref()
            .iter()
            .map(|b| format!("{:02x}", b))
            .collect()
    }
}
