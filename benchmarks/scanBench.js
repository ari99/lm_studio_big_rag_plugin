/**
 * Directory Scanning Benchmark
 * Compares TypeScript fs.walk vs Rust native implementation
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

// Load native module directly
const { createRequire } = require("module");
const nativeRequire = createRequire(__filename);

let nativeModule;
let loadError = null;

try {
  nativeModule = nativeRequire("../native/bigrag-native.linux-x64-gnu.node");
} catch (e) {
  loadError = e;
}

function isNativeAvailable() {
  return nativeModule !== undefined;
}

const scanDirectory = nativeModule?.scanDirectory;

// TypeScript directory scanner
const SUPPORTED_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".mdx",
  ".html", ".htm", ".xhtml",
  ".pdf", ".epub",
  ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".webp",
]);

async function walk(dir, files) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(ext)) {
        const stats = await fs.promises.stat(fullPath);
        files.push({
          path: fullPath,
          name: entry.name,
          extension: ext,
          size: stats.size,
          mtime: stats.mtime,
        });
      }
    }
  }
}

async function scanDirectoryTS(rootDir) {
  const files = [];
  await walk(rootDir, files);
  return files;
}

// Benchmark helper
async function benchmark(name, fn) {
  const start = performance.now();
  const result = await fn();
  const time = performance.now() - start;
  return { time, result };
}

// Create test directory structure
function createTestDirectoryStructure(
  baseDir,
  depth,
  filesPerDir,
  subdirsPerDir,
  currentDepth = 0
) {
  if (currentDepth >= depth) {
    return;
  }
  
  // Create files in current directory
  for (let i = 0; i < filesPerDir; i++) {
    const ext = [".txt", ".md", ".html", ".pdf"][i % 4];
    const filePath = path.join(baseDir, `file_${currentDepth}_${i}${ext}`);
    fs.writeFileSync(filePath, `Test content for file ${i} at depth ${currentDepth}\n`.repeat(100));
  }
  
  // Create subdirectories
  if (currentDepth < depth - 1) {
    for (let i = 0; i < subdirsPerDir; i++) {
      const subdir = path.join(baseDir, `subdir_${i}`);
      fs.mkdirSync(subdir, { recursive: true });
      createTestDirectoryStructure(subdir, depth, filesPerDir, subdirsPerDir, currentDepth + 1);
    }
  }
}

async function runBenchmarks() {
  console.log("=".repeat(60));
  console.log("DIRECTORY SCANNING BENCHMARKS");
  console.log("=".repeat(60));
  console.log();

  const nativeAvailable = isNativeAvailable();
  console.log(`Native module available: ${nativeAvailable}`);
  console.log();

  // Create temp directory for test structure
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "bigrag-scan-bench-"));
  console.log(`Test directory: ${tempDir}`);
  
  try {
    // Test 1: Small structure (3 levels, 5 files/dir, 2 subdirs/dir)
    console.log("-".repeat(60));
    console.log("Test 1: Small Structure (3 levels, ~35 files)");
    console.log("-".repeat(60));
    
    const smallDir = path.join(tempDir, "small");
    fs.mkdirSync(smallDir, { recursive: true });
    createTestDirectoryStructure(smallDir, 3, 5, 2);
    
    const tsSmallResult = await benchmark("TypeScript", () => scanDirectoryTS(smallDir));
    console.log(`TypeScript:  ${tsSmallResult.time.toFixed(2)}ms (${tsSmallResult.result.length} files)`);
    
    if (nativeAvailable) {
      const nativeSmallResult = await benchmark("Rust Native", () => scanDirectory(smallDir));
      console.log(`Rust Native: ${nativeSmallResult.time.toFixed(2)}ms (${nativeSmallResult.result.length} files)`);
      console.log(`Speedup:     ${(tsSmallResult.time / nativeSmallResult.time).toFixed(2)}x`);
    }
    console.log();

    // Test 2: Medium structure (4 levels, 10 files/dir, 3 subdirs/dir)
    console.log("-".repeat(60));
    console.log("Test 2: Medium Structure (4 levels, ~130 files)");
    console.log("-".repeat(60));
    
    const mediumDir = path.join(tempDir, "medium");
    fs.mkdirSync(mediumDir, { recursive: true });
    createTestDirectoryStructure(mediumDir, 4, 10, 3);
    
    const tsMediumResult = await benchmark("TypeScript", () => scanDirectoryTS(mediumDir));
    console.log(`TypeScript:  ${tsMediumResult.time.toFixed(2)}ms (${tsMediumResult.result.length} files)`);
    
    if (nativeAvailable) {
      const nativeMediumResult = await benchmark("Rust Native", () => scanDirectory(mediumDir));
      console.log(`Rust Native: ${nativeMediumResult.time.toFixed(2)}ms (${nativeMediumResult.result.length} files)`);
      console.log(`Speedup:     ${(tsMediumResult.time / nativeMediumResult.time).toFixed(2)}x`);
    }
    console.log();

    // Test 3: Large structure (5 levels, 15 files/dir, 4 subdirs/dir)
    console.log("-".repeat(60));
    console.log("Test 3: Large Structure (5 levels, ~500 files)");
    console.log("-".repeat(60));
    
    const largeDir = path.join(tempDir, "large");
    fs.mkdirSync(largeDir, { recursive: true });
    createTestDirectoryStructure(largeDir, 5, 15, 4);
    
    const tsLargeResult = await benchmark("TypeScript", () => scanDirectoryTS(largeDir));
    console.log(`TypeScript:  ${tsLargeResult.time.toFixed(2)}ms (${tsLargeResult.result.length} files)`);
    
    if (nativeAvailable) {
      const nativeLargeResult = await benchmark("Rust Native", () => scanDirectory(largeDir));
      console.log(`Rust Native: ${nativeLargeResult.time.toFixed(2)}ms (${nativeLargeResult.result.length} files)`);
      console.log(`Speedup:     ${(tsLargeResult.time / nativeLargeResult.time).toFixed(2)}x`);
    }
    console.log();

    // Test 4: Wide structure (2 levels, 100 files/dir, 10 subdirs/dir)
    console.log("-".repeat(60));
    console.log("Test 4: Wide Structure (2 levels, ~1000 files)");
    console.log("-".repeat(60));
    
    const wideDir = path.join(tempDir, "wide");
    fs.mkdirSync(wideDir, { recursive: true });
    createTestDirectoryStructure(wideDir, 2, 100, 10);
    
    const tsWideResult = await benchmark("TypeScript", () => scanDirectoryTS(wideDir));
    console.log(`TypeScript:  ${tsWideResult.time.toFixed(2)}ms (${tsWideResult.result.length} files)`);
    
    if (nativeAvailable) {
      const nativeWideResult = await benchmark("Rust Native", () => scanDirectory(wideDir));
      console.log(`Rust Native: ${nativeWideResult.time.toFixed(2)}ms (${nativeWideResult.result.length} files)`);
      console.log(`Speedup:     ${(tsWideResult.time / nativeWideResult.time).toFixed(2)}x`);
    }
    console.log();

  } finally {
    // Cleanup
    console.log("Cleaning up test directory (this may take a moment)...");
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log(`Cleaned up test directory`);
  }

  console.log("=".repeat(60));
  console.log("BENCHMARK COMPLETE");
  console.log("=".repeat(60));
}

runBenchmarks().catch(console.error);
