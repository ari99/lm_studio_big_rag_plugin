import * as fs from "fs";
import * as crypto from "crypto";

/**
 * Calculate SHA-256 hash of a file for change detection
 * Uses Node.js crypto module (OpenSSL-backed, highly optimized C code)
 * Note: Rust native hashing was benchmarked at 0.93x speed (slower due to FFI overhead)
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Calculate SHA-256 hash of multiple files in parallel
 * Uses Node.js crypto with Promise.all for parallel execution
 */
export async function calculateFileHashesParallel(filePaths: string[]): Promise<Map<string, string>> {
  const hashPromises = filePaths.map(async (filePath) => {
    const hash = await calculateFileHash(filePath);
    return [filePath, hash] as [string, string];
  });

  const results = await Promise.all(hashPromises);
  return new Map(results);
}

/**
 * Get file metadata including size and modification time
 */
export async function getFileMetadata(filePath: string): Promise<{
  size: number;
  mtime: Date;
  hash: string;
}> {
  const stats = await fs.promises.stat(filePath);
  const hash = await calculateFileHash(filePath);

  return {
    size: stats.size,
    mtime: stats.mtime,
    hash,
  };
}

