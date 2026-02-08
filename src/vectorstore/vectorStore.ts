import { LocalIndex } from "vectra";
import * as path from "path";
import * as fs from "fs";

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
  metadata: Record<string, any>;
}

export class VectorStore {
  private index: LocalIndex | null = null;
  private dbPath: string;
  private indexPath: string;
  private updateMutex: Promise<void> = Promise.resolve();

  constructor(dbPath: string) {
    this.dbPath = path.resolve(dbPath);
    this.indexPath = this.dbPath;
  }

  private async resolveIndexPath(): Promise<string> {
    if (await this.pathContainsIndex(this.dbPath)) {
      return this.dbPath;
    }

    const nestedVectraPath = path.join(this.dbPath, "vectra_index");
    if (await this.pathContainsIndex(nestedVectraPath)) {
      return nestedVectraPath;
    }

    const trimmedDbPath = this.dbPath.replace(/[\\/]+$/, "");
    if (path.basename(trimmedDbPath) === "vectra_index") {
      return this.dbPath;
    }

    return nestedVectraPath;
  }

  private async pathContainsIndex(targetDir: string): Promise<boolean> {
    try {
      const indexFile = path.join(targetDir, "index.json");
      await fs.promises.access(indexFile);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    try {
      this.indexPath = await this.resolveIndexPath();

      // Ensure directory exists
      await fs.promises.mkdir(this.indexPath, { recursive: true });
      
      // Create or open Vectra index
      this.index = new LocalIndex(this.indexPath);
      
      // Check if index exists, if not create it
      if (!(await this.index.isIndexCreated())) {
        await this.index.createIndex();
      }
      
      console.log("Vector store initialized successfully");
    } catch (error) {
      console.error("Error initializing vector store:", error);
      throw error;
    }
  }

  /**
   * Add document chunks to the vector store
   * Uses a mutex to prevent concurrent updates
   */
  async addChunks(chunks: DocumentChunk[]): Promise<void> {
    if (!this.index) {
      throw new Error("Vector store not initialized");
    }

    if (chunks.length === 0) {
      return;
    }

    // Wait for any pending updates to complete, then run this update
    this.updateMutex = this.updateMutex.then(async () => {
    try {
      // Begin batch update
        await this.index!.beginUpdate();

      for (const chunk of chunks) {
          await this.index!.upsertItem({
          id: chunk.id,
          vector: chunk.vector,
          metadata: {
            text: chunk.text,
            filePath: chunk.filePath,
            fileName: chunk.fileName,
            fileHash: chunk.fileHash,
            chunkIndex: chunk.chunkIndex,
            ...chunk.metadata,
          },
        });
      }

      // Commit the batch
        await this.index!.endUpdate();
      
      console.log(`Added ${chunks.length} chunks to vector store`);
    } catch (error) {
      console.error("Error adding chunks to vector store:", error);
        // Still end the update on error to prevent lock
        try {
          await this.index!.endUpdate();
        } catch (e) {
          // Ignore error if already ended
        }
      throw error;
    }
    });

    // Return the mutex promise so caller can await completion
    return this.updateMutex;
  }

  /**
   * Search for similar chunks
   */
  async search(
    queryVector: number[],
    limit: number = 5,
    threshold: number = 0.5,
  ): Promise<SearchResult[]> {
    if (!this.index) {
      console.log("No index available for search");
      return [];
    }

    try {
      const results = await this.index.queryItems(queryVector, '', limit, undefined, false);

      return results
        .filter((result) => result.score >= threshold)
        .map((result) => ({
          text: result.item.metadata.text as string,
          score: result.score,
          filePath: result.item.metadata.filePath as string,
          fileName: result.item.metadata.fileName as string,
          chunkIndex: result.item.metadata.chunkIndex as number,
          metadata: result.item.metadata,
        }));
    } catch (error) {
      console.error("Error searching vector store:", error);
      return [];
    }
  }

  /**
   * Delete chunks for a specific file (by hash)
   * Uses a mutex to prevent concurrent updates
   */
  async deleteByFileHash(fileHash: string): Promise<void> {
    if (!this.index) {
      return;
    }

    // Wait for any pending updates to complete, then run this delete
    this.updateMutex = this.updateMutex.then(async () => {
    try {
        await this.index!.beginUpdate();
      
      // Get all items and filter by fileHash
        const allItems = await this.index!.listItems();
      
      for (const item of allItems) {
        if (item.metadata.fileHash === fileHash) {
            await this.index!.deleteItem(item.id);
        }
      }
      
        await this.index!.endUpdate();
      
      console.log(`Deleted chunks for file hash: ${fileHash}`);
    } catch (error) {
      console.error(`Error deleting chunks for file hash ${fileHash}:`, error);
        // Still end the update on error to prevent lock
        try {
          await this.index!.endUpdate();
        } catch (e) {
          // Ignore error if already ended
        }
      }
    });

    return this.updateMutex;
  }

  /**
   * Check if a file (by hash) exists in the store
   */
  async hasFile(fileHash: string): Promise<boolean> {
    if (!this.index) {
      return false;
    }

    try {
      const allItems = await this.index.listItems();
      
      return allItems.some((item) => item.metadata.fileHash === fileHash);
    } catch (error) {
      console.error(`Error checking file hash ${fileHash}:`, error);
      return false;
    }
  }

  /**
   * Get a map of file paths to the set of hashes currently stored.
   */
  async getFileHashInventory(): Promise<Map<string, Set<string>>> {
    const inventory = new Map<string, Set<string>>();
    if (!this.index) {
      return inventory;
    }

    try {
      const allItems = await this.index.listItems();
      for (const item of allItems) {
        const filePath = item.metadata.filePath as string | undefined;
        const fileHash = item.metadata.fileHash as string | undefined;
        if (!filePath || !fileHash) {
          continue;
        }
        let hashes = inventory.get(filePath);
        if (!hashes) {
          hashes = new Set<string>();
          inventory.set(filePath, hashes);
        }
        hashes.add(fileHash);
      }
      return inventory;
    } catch (error) {
      console.error("Error building file hash inventory:", error);
      return inventory;
    }
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<{ totalChunks: number; uniqueFiles: number }> {
    if (!this.index) {
      return { totalChunks: 0, uniqueFiles: 0 };
    }

    try {
      const allItems = await this.index.listItems();
      const uniqueHashes = new Set(
        allItems.map((item) => item.metadata.fileHash as string)
      );
      
      return {
        totalChunks: allItems.length,
        uniqueFiles: uniqueHashes.size,
      };
    } catch (error) {
      console.error("Error getting stats:", error);
      return { totalChunks: 0, uniqueFiles: 0 };
    }
  }

  /**
   * Close the vector store connection
   */
  async close(): Promise<void> {
    // Vectra doesn't require explicit closing
    this.index = null;
  }
}
