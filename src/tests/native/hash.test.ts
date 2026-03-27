/**
 * Tests for native file hashing implementation
 * Compares Rust native vs TypeScript fallback implementations
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as crypto from "crypto";
import { describe, it, before, after } from "node:test";
import assert from "node:assert";

// Import both implementations
import { hashFile as nativeHashFile, isNativeAvailable } from "../../native";
import { calculateFileHash as tsHashFile } from "../../utils/fileHash";

describe("Native Hashing Tests", () => {
  let testDir: string;
  let testFilePath: string;
  let testContent: string;
  let expectedHash: string;

  before(async () => {
    // Create temp directory and test file
    testDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "bigrag-test-"));
    testFilePath = path.join(testDir, "test.txt");
    testContent = "Hello, World! This is a test file for hashing.";
    
    await fs.promises.writeFile(testFilePath, testContent);
    
    // Calculate expected hash using Node.js crypto
    expectedHash = crypto.createHash("sha256").update(testContent).digest("hex");
  });

  after(async () => {
    // Cleanup
    await fs.promises.rm(testDir, { recursive: true, force: true });
  });

  it("should report native module availability", () => {
    const available = isNativeAvailable();
    console.log(`Native module available: ${available}`);
    // Don't assert - just report
  });

  it("should hash file correctly (TypeScript)", async () => {
    const hash = await tsHashFile(testFilePath);
    assert.strictEqual(hash, expectedHash, "TypeScript hash should match expected");
  });

  it("should hash file correctly (Native)", async () => {
    if (!isNativeAvailable()) {
      console.log("Skipping native hash test - native module not available");
      return;
    }
    
    const hash = await nativeHashFile(testFilePath);
    assert.strictEqual(hash, expectedHash, "Native hash should match expected");
  });

  it("should produce same hash for both implementations", async () => {
    if (!isNativeAvailable()) {
      console.log("Skipping comparison test - native module not available");
      return;
    }
    
    const [tsHash, nativeHash] = await Promise.all([
      tsHashFile(testFilePath),
      nativeHashFile(testFilePath),
    ]);
    
    assert.strictEqual(tsHash, nativeHash, "Both implementations should produce same hash");
  });

  it("should handle large files", async () => {
    const largeFilePath = path.join(testDir, "large.txt");
    const largeContent = "A".repeat(1024 * 1024); // 1MB
    
    await fs.promises.writeFile(largeFilePath, largeContent);
    const expectedLargeHash = crypto.createHash("sha256").update(largeContent).digest("hex");
    
    const tsHash = await tsHashFile(largeFilePath);
    assert.strictEqual(tsHash, expectedLargeHash, "TypeScript should handle large files");
    
    if (isNativeAvailable()) {
      const nativeHash = await nativeHashFile(largeFilePath);
      assert.strictEqual(nativeHash, expectedLargeHash, "Native should handle large files");
    }
  });

  it("should handle empty files", async () => {
    const emptyFilePath = path.join(testDir, "empty.txt");
    await fs.promises.writeFile(emptyFilePath, "");
    const expectedEmptyHash = crypto.createHash("sha256").update("").digest("hex");
    
    const tsHash = await tsHashFile(emptyFilePath);
    assert.strictEqual(tsHash, expectedEmptyHash, "TypeScript should handle empty files");
    
    if (isNativeAvailable()) {
      const nativeHash = await nativeHashFile(emptyFilePath);
      assert.strictEqual(nativeHash, expectedEmptyHash, "Native should handle empty files");
    }
  });
});
