# BigRAG Native Module - Dependencies & Requirements

## Overview

This document details all dependencies, requirements, and setup instructions for the BigRAG plugin with Rust native module optimizations.

---

## System Requirements

### Minimum Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | >= 18.0.0 | Runtime environment |
| **npm** | >= 9.0.0 | Package management |
| **Rust** | >= 1.75.0 | Native module compilation |
| **Cargo** | >= 1.75.0 | Rust build system |

### Recommended Versions (as of testing)

```
Node.js: v20.20.2
npm: 10.8.2
Rust: 1.94.0
Cargo: 1.94.0
```

### Platform Support

| Platform | Target | Status |
|----------|--------|--------|
| Linux x64 | `x86_64-unknown-linux-gnu` | ✅ Tested |
| Linux ARM64 | `aarch64-unknown-linux-gnu` | ⚠️ Untested |
| macOS x64 | `x86_64-apple-darwin` | ⚠️ Untested |
| macOS ARM64 | `aarch64-apple-darwin` | ⚠️ Untested |
| Windows x64 | `x86_64-pc-windows-msvc` | ⚠️ Untested |

---

## TypeScript Dependencies

### Production Dependencies

```json
{
  "@lancedb/lancedb": "^0.24.1",      // Vector database
  "@lmstudio/sdk": "^1.5.0",          // LM Studio plugin SDK
  "cheerio": "^1.0.0-rc.12",          // HTML parsing
  "epub2": "^3.0.2",                  // EPUB parsing
  "mime-types": "^2.1.35",            // MIME type detection
  "p-queue": "^6.6.2",                // Promise queue
  "pdf-parse": "^1.1.1",              // PDF text extraction
  "pdfjs-dist": "^4.0.379",           // PDF rendering
  "pngjs": "^7.0.0",                  // PNG processing
  "tesseract.js": "^5.0.4",           // OCR for images
  "vectra": "^0.12.3",                // Vector store abstraction
  "zod": "3.24.1"                     // Schema validation
}
```

### Development Dependencies

```json
{
  "@types/mime-types": "^2.1.4",
  "@types/node": "^20.14.8",
  "@types/pdf-parse": "^1.1.5",
  "@types/pngjs": "^6.0.5",
  "ts-node": "^10.9.2",               // TypeScript execution
  "typescript": "^5.9.3"              // TypeScript compiler
}
```

---

## Rust Native Module Dependencies

### Cargo.toml Dependencies

```toml
[dependencies]
napi = "2.16"              # Node-API Rust bindings
napi-derive = "2.16"       # Procedural macros for napi
sha2 = "0.10"              # SHA-256 hashing
rayon = "1.10"             # Data parallelism
walkdir = "2.5"            # Recursive directory traversal
memmap2 = "0.9"            # Memory-mapped file I/O
serde = { version = "1.0", features = ["derive"] }  # Serialization
serde_json = "1.0"         # JSON processing

[build-dependencies]
napi-build = "2.1"         # Build system for napi-rs
```

### Rust Crate Purposes

| Crate | Purpose | Why It's Needed |
|-------|---------|-----------------|
| `napi` | Node-API bindings | Enables Rust ↔ Node.js communication |
| `napi-derive` | Procedural macros | Simplifies napi function exports |
| `sha2` | SHA-256 implementation | Cryptographic hashing |
| `rayon` | Parallel iterators | Parallel directory scanning |
| `walkdir` | Directory traversal | Efficient recursive file walking |
| `memmap2` | Memory mapping | Zero-copy file reading |
| `serde` | Serialization | Data structure conversion |
| `serde_json` | JSON handling | Result serialization |

---

## Installation Instructions

### 1. Install System Dependencies

#### Linux (Debian/Ubuntu)

```bash
# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install build essentials (if not present)
sudo apt-get install -y build-essential pkg-config libssl-dev
```

#### macOS

```bash
# Install Node.js (via Homebrew)
brew install node

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

#### Windows

```powershell
# Install Node.js (via winget)
winget install OpenJS.NodeJS.LTS

# Install Rust (via winget)
winget install Rustlang.Rustup

# Or download from https://rustup.rs/
```

### 2. Install npm Dependencies

```bash
cd /home/pickle/LMSPlugins/BigRAG/lm_studio_big_rag_plugin
npm install
```

### 3. Build Native Module

```bash
cd native
npm install
npm run build
```

This produces: `bigrag-native.linux-x64-gnu.node`

### 4. Build TypeScript

```bash
cd /home/pickle/LMSPlugins/BigRAG/lm_studio_big_rag_plugin
npm run build
```

---

## Verification

### Check Installation

```bash
# Verify Node.js and npm
node --version  # Expected: v20.x.x
npm --version   # Expected: 10.x.x

# Verify Rust and Cargo
rustc --version  # Expected: 1.75+
cargo --version  # Expected: 1.75+

# Verify native module exists
ls -la native/*.node  # Should show compiled .node file
```

### Run Tests

```bash
# Run all tests
npm run test:all

# Run native module tests only
npm run test:native
```

### Run Benchmarks

```bash
# Run real-world benchmark with actual data
npm run bench:real

# Run individual benchmarks
npm run bench:hash    # Hashing benchmark
npm run bench:chunk   # Chunking benchmark
npm run bench:scan    # Scanning benchmark
```

---

## Benchmark Results

### Test Environment

- **Documents Path**: `/home/pickle/Storage/RAG_Pipeline_Docs`
- **File Count**: 7,192 files
- **Node.js**: v20.20.2
- **Rust**: 1.94.0

### Performance Comparison

| Operation | TypeScript | Rust Native | Speedup | Notes |
|-----------|------------|-------------|---------|-------|
| **File Hashing** | 11.86ms/file | 12.28ms/file | 0.97x | Node.js crypto is already native C |
| **Text Chunking** | 235.95ms/file | 247.20ms/file | 0.95x | V8 string ops are highly optimized |
| **Directory Scanning** | 41ms total | 36ms total | 1.14x | Parallel traversal helps |

### Analysis

#### Why Rust Isn't Faster for Hashing

Node.js `crypto` module uses OpenSSL (C/C++), which is already highly optimized. The Rust `sha2` crate provides comparable performance but cannot exceed the underlying hardware limits.

#### Why Rust Isn't Faster for Chunking

1. **V8 Optimization**: JavaScript string operations in V8 are heavily optimized
2. **FFI Overhead**: Crossing the Node.js ↔ Rust boundary adds latency
3. **Memory Copying**: Strings must be copied between runtimes

#### Where Rust Helps

1. **Parallel Scanning**: Rayon enables true parallel directory traversal
2. **Memory Efficiency**: No GC pressure for large operations
3. **Batch Processing**: `hash_files_parallel` and `chunk_texts_parallel` provide real speedups
4. **Type Safety**: Compile-time guarantees prevent runtime errors

### Recommended Usage

```typescript
// ✅ USE NATIVE FOR: Batch operations
import { hashFilesParallel, chunkTextsParallel } from '@bigrag/native';

// Process 100 files in parallel
const hashes = await hashFilesParallel(filePaths);

// ✅ USE TYPESCRIPT FOR: Single operations
import { calculateFileHash } from './utils/fileHash';

// Hash a single file (auto-fallback to TS if native unavailable)
const hash = await calculateFileHash(filePath);
```

---

## Troubleshooting

### Native Module Not Loading

**Error**: `Cannot find module './bigrag-native.linux-x64-gnu.node'`

**Solution**:
```bash
cd native
npm run build
# Verify the .node file exists
ls -la *.node
```

### Build Fails with Rust Errors

**Error**: Various compilation errors

**Solution**:
```bash
# Update Rust to latest
rustup update

# Clean and rebuild
cd native
cargo clean
npm run build
```

### TypeScript Compilation Errors

**Error**: `Cannot find module '../native'`

**Solution**:
```bash
# Rebuild TypeScript
npm run build

# Check tsconfig.json includes src/
cat tsconfig.json
```

### Module Availability Check

```typescript
import { isNativeAvailable } from './src/native';

console.log(`Native available: ${isNativeAvailable()}`);
// If false, check that the .node file is in the native/ directory
```

---

## File Structure

```
lm_studio_big_rag_plugin/
├── src/
│   ├── native/           # TypeScript bindings for native module
│   │   └── index.ts
│   ├── utils/
│   │   ├── fileHash.ts   # Uses native when available
│   │   └── textChunker.ts # Uses native when available
│   ├── ingestion/
│   │   └── fileScanner.ts # Uses native when available
│   ├── benchmarks/
│   │   └── realWorldBench.ts
│   └── tests/
│       └── native/
│           ├── hash.test.ts
│           ├── chunk.test.ts
│           └── scan.test.ts
├── native/               # Rust workspace
│   ├── Cargo.toml
│   ├── package.json
│   ├── build.rs
│   ├── src/
│   │   ├── lib.rs
│   │   ├── hashing.rs
│   │   ├── chunking.rs
│   │   └── scanner.rs
│   └── bigrag-native.linux-x64-gnu.node  # Compiled binary
├── benchmarks/           # Benchmark scripts (not compiled)
│   ├── hashBench.ts
│   ├── chunkBench.ts
│   ├── scanBench.ts
│   └── realWorldReport.json
├── package.json
├── tsconfig.json
└── AGENTS.md
```

---

## API Reference

### Native Module Exports

```typescript
// Hashing
export function hashFile(path: string): Promise<string>
export function hashFilesParallel(paths: string[]): Promise<HashResult[]>
export function hashData(data: Buffer): Promise<string>

// Chunking
export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): TextChunk[]
export function chunkTextsParallel(
  texts: string[],
  chunkSize: number,
  overlap: number
): TextChunk[][]

// Scanning
export function scanDirectory(root: string): Promise<ScannedFile[]>
export function isSupportedExtension(path: string): boolean
export function getSupportedExtensions(): string[]

// Utility
export function isNativeAvailable(): boolean
export function getNativeLoadError(): string | null
```

### Type Definitions

```typescript
interface HashResult {
  path: string;
  hash: string | null;
  error: string | null;
}

interface TextChunk {
  text: string;
  start_index: number;
  end_index: number;
  token_estimate: number;
}

interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  size: number;
  mtime: number;  // Unix timestamp in seconds
}
```

---

## License

ISC (same as parent project)

---

## Contributing

When adding new native functions:

1. Add Rust implementation in `native/src/*.rs`
2. Export with `#[napi]` attribute
3. Update TypeScript bindings in `src/native/index.ts`
4. Add tests in `src/tests/native/*.test.ts`
5. Update this documentation

---

## References

- [napi-rs Documentation](https://napi.rs/)
- [Node-API Documentation](https://nodejs.org/api/n-api.html)
- [Rayon Documentation](https://docs.rs/rayon/)
- [BigRAG AGENTS.md](./AGENTS.md) - Core architecture documentation
