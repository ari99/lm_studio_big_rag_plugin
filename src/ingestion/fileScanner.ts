import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";
import {
  SUPPORTED_EXTENSIONS,
  listSupportedExtensions,
} from "../utils/supportedExtensions";

export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  mimeType: string | false;
  size: number;
  mtime: Date;
}

/** Normalize and validate the root directory for scanning (resolves path, strips trailing slashes). */
function normalizeRootDir(rootDir: string): string {
  const normalized = path.resolve(rootDir.trim()).replace(/\/+$/, "");
  return normalized;
}

/**
 * Recursively scan a directory for supported files
 */
export async function scanDirectory(
  rootDir: string,
  onProgress?: (current: number, total: number) => void,
): Promise<ScannedFile[]> {
  const root = normalizeRootDir(rootDir);
  try {
    await fs.promises.access(root, fs.constants.R_OK);
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      throw new Error(
        `Documents directory does not exist: ${root}. Check the path (e.g. spelling and that the folder exists).`,
      );
    }
    throw err;
  }

  const files: ScannedFile[] = [];
  let scannedCount = 0;

  const supportedExtensionsDescription = listSupportedExtensions().join(", ");
  console.log(`[Scanner] Supported extensions: ${supportedExtensionsDescription}`);

  async function walk(dir: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          scannedCount++;
          
          const ext = path.extname(entry.name).toLowerCase();
          
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            const stats = await fs.promises.stat(fullPath);
            const mimeType = mime.lookup(fullPath);
            
            files.push({
              path: fullPath,
              name: entry.name,
              extension: ext,
              mimeType,
              size: stats.size,
              mtime: stats.mtime,
            });
          }
          
          if (onProgress && scannedCount % 100 === 0) {
            onProgress(scannedCount, files.length);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }
  
  await walk(root);

  if (onProgress) {
    onProgress(scannedCount, files.length);
  }
  
  return files;
}

/**
 * Check if a file type is supported
 */
export function isSupportedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext);
}

