import * as fs from "fs/promises";
import * as path from "path";
import { LocalIndex } from "vectra";

const MAX_ITEMS_PER_SHARD = 10000;
const SHARD_DIR_PREFIX = "shard_";
const SHARD_DIR_REGEX = /^shard_(\d+)$/;

export interface DocumentChunk {
  id: string;
  text: string;
  vector: number[];
  filePath: string;
  fileName: string;
  fileHash: string;
  chunkIndex: number;
  metadata: Record<string, any>;
}

export interface SearchResult {
  text: string;
  score: number;
  filePath: string;
  fileName: string;
  chunkIndex: number;
  shardName: string;
  metadata: Record<string, any>;
}

type ChunkMetadata = {
  text: string;
  filePath: string;
  fileName: string;
  fileHash: string;
  chunkIndex: number;
  [key: string]: any;
};

export class VectorStore {
  private dbPath: string;
  private shardDirs: string[] = [];
  private activeShard: LocalIndex | null = null;
  private activeShardCount: number = 0;
  private updateMutex: Promise<void> = Promise.resolve();

  constructor(dbPath: string) {
    this.dbPath = path.resolve(dbPath);
  }

  /**
   * Open a shard by directory name (e.g. "shard_000"). Caller must not hold the reference
   * after use so GC can free the parsed index data.
   */
  private openShard(dir: string): LocalIndex {
    const fullPath = path.join(this.dbPath, dir);
    return new LocalIndex(fullPath);
  }

  /**
   * Scan dbPath for shard_NNN directories and return sorted list.
   */
  private async discoverShardDirs(): Promise<string[]> {
    const entries = await fs.readdir(this.dbPath, { withFileTypes: true });
    const dirs: string[] = [];
    for (const e of entries) {
      if (e.isDirectory() && SHARD_DIR_REGEX.test(e.name)) {
        dirs.push(e.name);
      }
    }
    dirs.sort((a, b) => {
      const n = (m: string) => parseInt(m.match(SHARD_DIR_REGEX)![1], 10);
      return n(a) - n(b);
    });
    return dirs;
  }

  /**
   * Initialize the vector store: discover or create shards, open the last as active.
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.dbPath, { recursive: true });
    this.shardDirs = await this.discoverShardDirs();

    if (this.shardDirs.length === 0) {
      const firstDir = `${SHARD_DIR_PREFIX}000`;
      const fullPath = path.join(this.dbPath, firstDir);
      const index = new LocalIndex(fullPath);
      await index.createIndex({ version: 1 });
      this.shardDirs = [firstDir];
      this.activeShard = index;
      this.activeShardCount = 0;
    } else {
      const lastDir = this.shardDirs[this.shardDirs.length - 1];
      this.activeShard = this.openShard(lastDir);
      const items = await this.activeShard.listItems();
      this.activeShardCount = items.length;
    }
    console.log("Vector store initialized successfully");
  }

  /**
   * Add document chunks to the active shard. Rotates to a new shard when full.
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.activeShard) {
      throw new Error("Vector store not initialized");
    }
    if (chunks.length === 0) return;

    this.updateMutex = this.updateMutex.then(async () => {
      await this.activeShard!.beginUpdate();
      try {
        for (const chunk of chunks) {
          const metadata: ChunkMetadata = {
            text: chunk.text,
            filePath: chunk.filePath,
            fileName: chunk.fileName,
            fileHash: chunk.fileHash,
            chunkIndex: chunk.chunkIndex,
            ...chunk.metadata,
          };
          await this.activeShard!.upsertItem({
            id: chunk.id,
            vector: chunk.vector,
            metadata,
          });
        }
        await this.activeShard!.endUpdate();
      } catch (e) {
        this.activeShard!.cancelUpdate();
        throw e;
      }
      this.activeShardCount += chunks.length;
      console.log(`Added ${chunks.length} chunks to vector store`);

      if (this.activeShardCount >= MAX_ITEMS_PER_SHARD) {
        const nextNum = this.shardDirs.length;
        const nextDir = `${SHARD_DIR_PREFIX}${String(nextNum).padStart(3, "0")}`;
        const fullPath = path.join(this.dbPath, nextDir);
        const newIndex = new LocalIndex(fullPath);
        await newIndex.createIndex({ version: 1 });
        this.shardDirs.push(nextDir);
        this.activeShard = newIndex;
        this.activeShardCount = 0;
      }
    });

    return this.updateMutex;
  }

  /**
   * Search: query each shard in turn, merge results, sort by score, filter by threshold, return top limit.
   */
  async search(
    queryVector: number[],
    limit: number = 5,
    threshold: number = 0.5,
  ): Promise<SearchResult[]> {
    const merged: SearchResult[] = [];
    for (const dir of this.shardDirs) {
      const shard = this.openShard(dir);
      const results = await shard.queryItems(
        queryVector,
        "",
        limit,
        undefined,
        false,
      );
      for (const r of results) {
        const m = r.item.metadata as ChunkMetadata;
        merged.push({
          text: m?.text ?? "",
          score: r.score,
          filePath: m?.filePath ?? "",
          fileName: m?.fileName ?? "",
          chunkIndex: m?.chunkIndex ?? 0,
          shardName: dir,
          metadata: (r.item.metadata as Record<string, any>) ?? {},
        });
      }
    }
    return merged
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Delete all chunks for a file (by hash) across all shards.
   */
  async deleteByFileHash(fileHash: string): Promise<void> {
    const lastDir = this.shardDirs[this.shardDirs.length - 1];
    this.updateMutex = this.updateMutex.then(async () => {
      for (const dir of this.shardDirs) {
        const shard = this.openShard(dir);
        const items = await shard.listItems();
        const toDelete = items.filter(
          (i) => (i.metadata as ChunkMetadata)?.fileHash === fileHash,
        );
        if (toDelete.length > 0) {
          await shard.beginUpdate();
          for (const item of toDelete) {
            await shard.deleteItem(item.id);
          }
          await shard.endUpdate();
          if (dir === lastDir && this.activeShard) {
            this.activeShardCount = (await this.activeShard.listItems()).length;
          }
        }
      }
      console.log(`Deleted chunks for file hash: ${fileHash}`);
    });
    return this.updateMutex;
  }

  /**
   * Get file path -> set of file hashes currently in the store.
   */
  async getFileHashInventory(): Promise<Map<string, Set<string>>> {
    const inventory = new Map<string, Set<string>>();
    for (const dir of this.shardDirs) {
      const shard = this.openShard(dir);
      const items = await shard.listItems();
      for (const item of items) {
        const m = item.metadata as ChunkMetadata;
        const filePath = m?.filePath;
        const fileHash = m?.fileHash;
        if (!filePath || !fileHash) continue;
        let set = inventory.get(filePath);
        if (!set) {
          set = new Set<string>();
          inventory.set(filePath, set);
        }
        set.add(fileHash);
      }
    }
    return inventory;
  }

  /**
   * Get total chunk count and unique file count.
   */
  async getStats(): Promise<{
    totalChunks: number;
    uniqueFiles: number;
  }> {
    let totalChunks = 0;
    const uniqueHashes = new Set<string>();
    for (const dir of this.shardDirs) {
      const shard = this.openShard(dir);
      const items = await shard.listItems();
      totalChunks += items.length;
      for (const item of items) {
        const h = (item.metadata as ChunkMetadata)?.fileHash;
        if (h) uniqueHashes.add(h);
      }
    }
    return { totalChunks, uniqueFiles: uniqueHashes.size };
  }

  /**
   * Check if any chunk exists for the given file hash (short-circuits on first match).
   */
  async hasFile(fileHash: string): Promise<boolean> {
    for (const dir of this.shardDirs) {
      const shard = this.openShard(dir);
      const items = await shard.listItems();
      if (items.some((i) => (i.metadata as ChunkMetadata)?.fileHash === fileHash)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Release the active shard reference.
   */
  async close(): Promise<void> {
    this.activeShard = null;
  }
}
