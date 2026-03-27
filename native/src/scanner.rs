use napi::bindgen_prelude::*;
use napi_derive::napi;
use rayon::prelude::*;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Supported file extensions for RAG indexing
const SUPPORTED_EXTENSIONS: &[&str] = &[
    ".txt", ".md", ".markdown",
    ".html", ".htm",
    ".pdf",
    ".epub",
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp",
    ".doc", ".docx",
    ".odt",
    ".rtf",
];

/// Scanned file metadata
#[napi(object)]
pub struct ScannedFile {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub size: u32,
    pub mtime: u32,
}

/// Scan a directory recursively for supported files using parallel traversal
#[napi]
pub fn scan_directory(root: String) -> Result<Vec<ScannedFile>> {
    let root_path = Path::new(&root);

    if !root_path.exists() {
        return Err(Error::new(
            Status::InvalidArg,
            format!("Directory does not exist: {}", root),
        ));
    }

    if !root_path.is_dir() {
        return Err(Error::new(
            Status::InvalidArg,
            format!("Path is not a directory: {}", root),
        ));
    }

    // Collect all directory entries first
    let entries: Vec<PathBuf> = WalkDir::new(root_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .map(|e| e.path().to_path_buf())
        .collect();

    // Process files in parallel
    let files: Vec<ScannedFile> = entries
        .par_iter()
        .filter_map(|path| {
            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_lowercase();
            
            let full_ext = format!(".{}", ext);
            
            if !SUPPORTED_EXTENSIONS
                .iter()
                .any(|&e| e.eq_ignore_ascii_case(&full_ext.as_str()))
            {
                return None;
            }

            match fs::metadata(path) {
                Ok(metadata) => {
                    let mtime = metadata
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as u32)
                        .unwrap_or(0);

                    // Cap size at u32 max (4GB)
                    let size = metadata.len().min(u32::MAX as u64) as u32;

                    Some(ScannedFile {
                        path: path.to_string_lossy().to_string(),
                        name: path
                            .file_name()
                            .and_then(|n| n.to_str())
                            .unwrap_or("")
                            .to_string(),
                        extension: full_ext,
                        size,
                        mtime,
                    })
                }
                Err(_) => None,
            }
        })
        .collect();

    Ok(files)
}

/// Check if a file extension is supported
#[napi]
pub fn is_supported_extension(path: String) -> bool {
    let ext = Path::new(&path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let full_ext = format!(".{}", ext);
    SUPPORTED_EXTENSIONS
        .iter()
        .any(|&e| e.eq_ignore_ascii_case(&full_ext.as_str()))
}

/// Get list of all supported extensions
#[napi]
pub fn get_supported_extensions() -> Vec<String> {
    SUPPORTED_EXTENSIONS.iter().map(|s| s.to_string()).collect()
}

/// Scan directory with progress callback support (returns total count first)
#[napi]
pub struct DirectoryScanner {
    root: String,
}

#[napi]
impl DirectoryScanner {
    #[napi(constructor)]
    pub fn new(root: String) -> Self {
        DirectoryScanner { root }
    }

    /// Get total file count estimate (fast, no metadata)
    #[napi]
    pub fn count_files(&self) -> Result<u32> {
        let root_path = Path::new(&self.root);
        
        let count = WalkDir::new(root_path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.path().is_file()
                    && e.path()
                        .extension()
                        .and_then(|ext| ext.to_str())
                        .map(|ext| {
                            let full_ext = format!(".{}", ext.to_lowercase());
                            SUPPORTED_EXTENSIONS
                                .iter()
                                .any(|&e| e.eq_ignore_ascii_case(&full_ext.as_str()))
                        })
                        .unwrap_or(false)
            })
            .count();

        Ok(count as u32)
    }

    /// Scan and return all files with metadata
    #[napi]
    pub fn scan(&self) -> Result<Vec<ScannedFile>> {
        scan_directory(self.root.clone())
    }
}
