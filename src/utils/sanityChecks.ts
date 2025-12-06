import * as fs from "fs";
import * as os from "os";

export interface SanityCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Perform sanity checks before indexing large directories
 */
export async function performSanityChecks(
  documentsDir: string,
  vectorStoreDir: string,
): Promise<SanityCheckResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check if directories exist
  try {
    await fs.promises.access(documentsDir, fs.constants.R_OK);
  } catch {
    errors.push(`Documents directory does not exist or is not readable: ${documentsDir}`);
  }

  try {
    await fs.promises.access(vectorStoreDir, fs.constants.W_OK);
  } catch {
    // Try to create it
    try {
      await fs.promises.mkdir(vectorStoreDir, { recursive: true });
    } catch {
      errors.push(
        `Vector store directory does not exist and cannot be created: ${vectorStoreDir}`
      );
    }
  }

  // Check available disk space
  try {
    const stats = await fs.promises.statfs(vectorStoreDir);
    const availableGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
    
    if (availableGB < 1) {
      errors.push(`Very low disk space available: ${availableGB.toFixed(2)} GB`);
    } else if (availableGB < 10) {
      warnings.push(`Low disk space available: ${availableGB.toFixed(2)} GB`);
    }
  } catch (error) {
    warnings.push("Could not check available disk space");
  }

  // Check available memory
  const freeMemoryGB = os.freemem() / (1024 * 1024 * 1024);
  const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);
  const runningOnMac = process.platform === "darwin";
  const lowMemoryMessage =
    `Low free memory: ${freeMemoryGB.toFixed(2)} GB of ${totalMemoryGB.toFixed(2)} GB total. ` +
    "Consider reducing concurrent file processing.";
  const veryLowMemoryMessage =
    `Very low free memory: ${freeMemoryGB.toFixed(2)} GB. ` +
    (runningOnMac
      ? "macOS may be reporting cached pages as used; cached memory can usually be reclaimed automatically."
      : "Indexing may fail due to insufficient RAM.");

  if (freeMemoryGB < 0.5) {
    if (runningOnMac) {
      warnings.push(veryLowMemoryMessage);
    } else {
      errors.push(`Very low free memory: ${freeMemoryGB.toFixed(2)} GB`);
    }
  } else if (freeMemoryGB < 2) {
    warnings.push(lowMemoryMessage);
  }

  // Estimate directory size (sample-based for performance)
  try {
    const sampleSize = await estimateDirectorySize(documentsDir);
    const estimatedGB = sampleSize / (1024 * 1024 * 1024);
    
    if (estimatedGB > 100) {
      warnings.push(
        `Large directory detected (~${estimatedGB.toFixed(1)} GB). Initial indexing may take several hours.`
      );
    } else if (estimatedGB > 10) {
      warnings.push(
        `Medium-sized directory detected (~${estimatedGB.toFixed(1)} GB). Initial indexing may take 30-60 minutes.`
      );
    }
  } catch (error) {
    warnings.push("Could not estimate directory size");
  }

  // Check if vector store already has data
  try {
    const files = await fs.promises.readdir(vectorStoreDir);
    if (files.length > 0) {
      warnings.push(
        "Vector store directory is not empty. Existing data will be used for incremental indexing."
      );
    }
  } catch {
    // Directory doesn't exist yet, that's fine
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Estimate directory size by sampling
 * (Quick estimate, not exact)
 */
async function estimateDirectorySize(dir: string, maxSamples: number = 100): Promise<number> {
  let totalSize = 0;
  let fileCount = 0;
  let sampledSize = 0;
  let sampledCount = 0;

  async function walk(currentDir: string): Promise<void> {
    if (sampledCount >= maxSamples) {
      return;
    }

    try {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (sampledCount >= maxSamples) {
          break;
        }

        const fullPath = `${currentDir}/${entry.name}`;

        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          fileCount++;
          
          if (sampledCount < maxSamples) {
            try {
              const stats = await fs.promises.stat(fullPath);
              sampledSize += stats.size;
              sampledCount++;
            } catch {
              // Skip files we can't stat
            }
          }
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  await walk(dir);

  // Extrapolate from sample
  if (sampledCount > 0 && fileCount > 0) {
    const avgFileSize = sampledSize / sampledCount;
    totalSize = avgFileSize * fileCount;
  }

  return totalSize;
}

/**
 * Check system resources and provide recommendations
 */
export function getResourceRecommendations(
  estimatedSizeGB: number,
  freeMemoryGB: number,
): {
  recommendedConcurrency: number;
  recommendedChunkSize: number;
  estimatedTime: string;
} {
  let recommendedConcurrency = 3;
  let recommendedChunkSize = 512;
  let estimatedTime = "unknown";

  // Adjust based on available memory
  if (freeMemoryGB < 2) {
    recommendedConcurrency = 1;
  } else if (freeMemoryGB < 4) {
    recommendedConcurrency = 2;
  } else if (freeMemoryGB >= 8) {
    recommendedConcurrency = 5;
  }

  // Adjust based on dataset size
  if (estimatedSizeGB < 1) {
    estimatedTime = "5-15 minutes";
  } else if (estimatedSizeGB < 10) {
    estimatedTime = "30-60 minutes";
    recommendedChunkSize = 768;
  } else if (estimatedSizeGB < 100) {
    estimatedTime = "2-4 hours";
    recommendedChunkSize = 1024;
  } else {
    estimatedTime = "4-12 hours";
    recommendedChunkSize = 1024;
    recommendedConcurrency = Math.min(recommendedConcurrency, 3);
  }

  return {
    recommendedConcurrency,
    recommendedChunkSize,
    estimatedTime,
  };
}

