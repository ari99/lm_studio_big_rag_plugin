/**
 * Tests for native directory scanning implementation
 * Compares Rust native vs TypeScript fallback implementations
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import both implementations
import { scanDirectory as nativeScanDir, isNativeAvailable } from "../../native";
import { scanDirectory as tsScanDir } from "../../ingestion/fileScanner";

describe("Native Scanning Tests", () => {
  let testDir: string;
  let subDir: string;

  before(async () => {
    // Create test directory structure
    testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bigrag-scan-test-"));
    subDir = path.join(testDir, "subdir");
    await fs.promises.mkdir(subDir);

    // Create test files
    await fs.promises.writeFile(path.join(testDir, "file1.txt"), "content1");
    await fs.promises.writeFile(path.join(testDir, "file2.md"), "content2");
    await fs.promises.writeFile(path.join(testDir, "file3.html"), "<html></html>");
    await fs.promises.writeFile(path.join(subDir, "file4.txt"), "content4");
    await fs.promises.writeFile(path.join(subDir, "file5.pdf"), "pdf content");
    
    // Create unsupported file
    await fs.promises.writeFile(path.join(testDir, "file6.exe"), "binary");
  });

  after(async () => {
    // Cleanup
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  it("should report native module availability", () => {
    const available = isNativeAvailable();
    console.log(`Native module available: ${available}`);
  });

  it("should scan directory correctly (TypeScript)", async () => {
    const files = await tsScanDir(testDir);
    assert.ok(files.length >= 5, `Should find at least 5 supported files, found ${files.length}`);
    
    // Check file properties
    for (const file of files) {
      assert.ok(file.path, "File should have path");
      assert.ok(file.name, "File should have name");
      assert.ok(file.extension, "File should have extension");
      assert.ok(typeof file.size === "number", "File should have size");
      assert.ok(file.mtime instanceof Date, "File should have mtime");
    }
  });

  it("should scan directory correctly (Native)", async () => {
    if (!isNativeAvailable()) {
      console.log("Skipping native scan test - native module not available");
      return;
    }
    
    const files = await nativeScanDir(testDir) as any[];
    assert.ok(files.length >= 5, `Should find at least 5 supported files, found ${files.length}`);
    
    // Check file properties
    for (const file of files) {
      assert.ok(file.path, "File should have path");
      assert.ok(file.name, "File should have name");
      assert.ok(file.extension, "File should have extension");
      assert.ok(typeof file.size === "number", "File should have size");
      assert.ok(typeof file.mtime === "number", "File should have mtime (unix timestamp)");
    }
  });

  it("should find same files (both implementations)", async () => {
    if (!isNativeAvailable()) {
      console.log("Skipping comparison test - native module not available");
      return;
    }
    
    const [tsFiles, nativeFiles] = await Promise.all([
      tsScanDir(testDir),
      nativeScanDir(testDir) as Promise<any[]>,
    ]);
    
    const tsPaths = new Set(tsFiles.map(f => f.path));
    const nativePaths = new Set(nativeFiles.map(f => f.path));
    
    // Check that both found the same files
    assert.strictEqual(tsPaths.size, nativePaths.size, 
      "Both implementations should find same number of files");
    
    for (const tsPath of tsPaths) {
      assert.ok(nativePaths.has(tsPath), `Native should find ${tsPath}`);
    }
  });

  it("should handle empty directory", async () => {
    const emptyDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bigrag-empty-"));
    
    try {
      const tsFiles = await tsScanDir(emptyDir);
      assert.strictEqual(tsFiles.length, 0, "Empty directory should return no files");
      
      if (isNativeAvailable()) {
        const nativeFiles = await nativeScanDir(emptyDir) as any[];
        assert.strictEqual(nativeFiles.length, 0, "Empty directory should return no files (native)");
      }
    } finally {
      await fs.promises.rm(emptyDir, { recursive: true, force: true });
    }
  });

  it("should handle nested directories", async () => {
    const nestedDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bigrag-nested-"));
    
    try {
      // Create nested structure
      await fs.promises.mkdir(path.join(nestedDir, "a"));
      await fs.promises.mkdir(path.join(nestedDir, "a", "b"));
      await fs.promises.mkdir(path.join(nestedDir, "a", "b", "c"));
      await fs.promises.writeFile(path.join(nestedDir, "a", "b", "c", "deep.txt"), "deep");
      
      const tsFiles = await tsScanDir(nestedDir);
      assert.strictEqual(tsFiles.length, 1, "Should find file in nested directory");
      
      if (isNativeAvailable()) {
        const nativeFiles = await nativeScanDir(nestedDir) as any[];
        assert.strictEqual(nativeFiles.length, 1, "Should find file in nested directory (native)");
      }
    } finally {
      await fs.promises.rm(nestedDir, { recursive: true, force: true });
    }
  });

  it("should exclude unsupported files", async () => {
    const files = await tsScanDir(testDir);
    
    for (const file of files) {
      assert.notStrictEqual(file.extension, ".exe", "Should not include .exe files");
    }
    
    if (isNativeAvailable()) {
      const nativeFiles = await nativeScanDir(testDir) as any[];
      for (const file of nativeFiles) {
        assert.notStrictEqual(file.extension, ".exe", "Should not include .exe files (native)");
      }
    }
  });
});
