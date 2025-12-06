import * as crypto from "crypto";
import * as fs from "fs";

/**
 * Calculate SHA-256 hash of a file for change detection
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

