import * as fs from "fs/promises";
import * as path from "path";

interface FailedFileEntry {
  fileHash: string;
  reason: string;
  timestamp: string;
}

/**
 * Tracks files that failed indexing for a given hash so we can skip them
 * when auto-reindexing unchanged data.
 */
export class FailedFileRegistry {
  private loaded = false;
  private entries: Record<string, FailedFileEntry> = {};
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly registryPath: string) {}

  private async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    try {
      const data = await fs.readFile(this.registryPath, "utf-8");
      this.entries = JSON.parse(data) ?? {};
    } catch {
      this.entries = {};
    }
    this.loaded = true;
  }

  private async persist(): Promise<void> {
    await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
    await fs.writeFile(this.registryPath, JSON.stringify(this.entries, null, 2), "utf-8");
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(
      () => {},
      () => {},
    );
    return result;
  }

  async recordFailure(filePath: string, fileHash: string, reason: string): Promise<void> {
    return this.runExclusive(async () => {
      await this.load();
      this.entries[filePath] = {
        fileHash,
        reason,
        timestamp: new Date().toISOString(),
      };
      await this.persist();
    });
  }

  async clearFailure(filePath: string): Promise<void> {
    return this.runExclusive(async () => {
      await this.load();
      if (this.entries[filePath]) {
        delete this.entries[filePath];
        await this.persist();
      }
    });
  }

  async getFailureReason(filePath: string, fileHash: string): Promise<string | undefined> {
    await this.load();
    const entry = this.entries[filePath];
    if (!entry) {
      return undefined;
    }
    return entry.fileHash === fileHash ? entry.reason : undefined;
  }
}

