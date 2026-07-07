import * as fs from "fs";
import * as path from "path";
import * as mime from "mime-types";
import {
  listSupportedExtensions,
} from "../utils/supportedExtensions";
import { matchExcludePattern } from "../utils/fileExcludePatterns";
import { buildEffectiveExtensionSet } from "../utils/additionalExtensions";

export interface ScannedFile {
  path: string;
  name: string;
  extension: string;
  mimeType: string | false;
  size: number;
  mtime: Date;
}

export interface ExcludedFileInfo {
  relativePath: string;
  pattern: string;
}

export interface ScanDirectoryOptions {
  excludePatterns?: string[];
  additionalPlainTextExtensions?: ReadonlySet<string>;
  onExcludedFile?: (info: ExcludedFileInfo) => void;
}

/** Normalize and validate the root directory for scanning (resolves path, strips trailing slashes). */
function normalizeRootDir(rootDir: string): string {
  return path.resolve(rootDir.trim()).replace(/[/\\]+$/, "");
}

function toPosixRelativePath(root: string, fullPath: string): string {
  return path.relative(root, fullPath).split(path.sep).join("/");
}

/**
 * Recursively scan a directory for supported files
 */
export async function scanDirectory(
  rootDir: string,
  onProgress?: (current: number, total: number) => void,
  options?: ScanDirectoryOptions,
): Promise<ScannedFile[]> {
  const root = normalizeRootDir(rootDir);
  const excludePatterns = options?.excludePatterns ?? [];
  const additionalPlainTextExtensions = options?.additionalPlainTextExtensions ?? new Set<string>();
  const onExcludedFile = options?.onExcludedFile;
  const effectiveExtensions = buildEffectiveExtensionSet(additionalPlainTextExtensions);

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
  console.log(`[Scanner] Built-in extensions: ${supportedExtensionsDescription}`);
  if (additionalPlainTextExtensions.size > 0) {
    const additionalList = Array.from(additionalPlainTextExtensions.values()).sort().join(", ");
    console.log(`[Scanner] Additional plain-text extensions: ${additionalList}`);
  }

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

          if (effectiveExtensions.has(ext)) {
            const relativePosix = toPosixRelativePath(root, fullPath);
            const matchedPattern =
              excludePatterns.length > 0 ? matchExcludePattern(relativePosix, excludePatterns) : null;

            if (matchedPattern !== null) {
              onExcludedFile?.({ relativePath: relativePosix, pattern: matchedPattern });
            } else {
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
 * Check if a file type is supported (built-in plus optional user plain-text extensions).
 */
export function isSupportedFile(
  filePath: string,
  additionalPlainTextExtensions: ReadonlySet<string> = new Set<string>(),
): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return buildEffectiveExtensionSet(additionalPlainTextExtensions).has(ext);
}
