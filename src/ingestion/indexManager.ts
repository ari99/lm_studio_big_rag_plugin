import PQueue from "p-queue";
import * as fs from "fs";
import * as path from "path";
import { scanDirectory, type ScannedFile } from "./fileScanner";
import { parseDocument, type ParseFailureReason } from "../parsers/documentParser";
import { VectorStore, type DocumentChunk } from "../vectorstore/vectorStore";
import { chunkText } from "../utils/textChunker";
import { calculateFileHash } from "../utils/fileHash";
import { type EmbeddingDynamicHandle, type LMStudioClient } from "@lmstudio/sdk";
import { FailedFileRegistry } from "../utils/failedFileRegistry";

export interface IndexingProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile: string;
  status: "scanning" | "indexing" | "complete" | "error";
  successfulFiles?: number;
  failedFiles?: number;
  skippedFiles?: number;
  error?: string;
}

export interface IndexingResult {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  skippedFiles: number;
  updatedFiles: number;
  newFiles: number;
}

type FileIndexOutcome =
  | { type: "skipped" }
  | { type: "indexed"; changeType: "new" | "updated" }
  | { type: "failed" };

export interface IndexingOptions {
  documentsDir: string;
  vectorStore: VectorStore;
  vectorStoreDir: string;
  embeddingModel: EmbeddingDynamicHandle;
  client: LMStudioClient;
  chunkSize: number;
  chunkOverlap: number;
  maxConcurrent: number;
  enableOCR: boolean;
  autoReindex: boolean;
  parseDelayMs: number;
  failureReportPath?: string;
  onProgress?: (progress: IndexingProgress) => void;
}

type FailureReason = ParseFailureReason | "index.chunk-empty" | "index.vector-add-error";

function coerceEmbeddingVector(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.map(assertFiniteNumber);
  }

  if (typeof raw === "number") {
    return [assertFiniteNumber(raw)];
  }

  if (raw && typeof raw === "object") {
    if (ArrayBuffer.isView(raw)) {
      return Array.from(raw as unknown as ArrayLike<number>).map(assertFiniteNumber);
    }

    const candidate =
      (raw as any).embedding ??
      (raw as any).vector ??
      (raw as any).data ??
      (typeof (raw as any).toArray === "function" ? (raw as any).toArray() : undefined) ??
      (typeof (raw as any).toJSON === "function" ? (raw as any).toJSON() : undefined);

    if (candidate !== undefined) {
      return coerceEmbeddingVector(candidate);
    }
  }

  throw new Error("Embedding provider returned a non-numeric vector");
}

function assertFiniteNumber(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error("Embedding vector contains a non-finite value");
  }
  return num;
}

export class IndexManager {
  private queue: PQueue;
  private options: IndexingOptions;
  private failureReasonCounts: Record<string, number> = {};
  private failedFileRegistry: FailedFileRegistry;

  constructor(options: IndexingOptions) {
    this.options = options;
    this.queue = new PQueue({ concurrency: options.maxConcurrent });
    this.failedFileRegistry = new FailedFileRegistry(
      path.join(options.vectorStoreDir, ".big-rag-failures.json"),
    );
  }

  /**
   * Start the indexing process
   */
  async index(): Promise<IndexingResult> {
    const { documentsDir, vectorStore, onProgress } = this.options;

    try {
      const fileInventory = await vectorStore.getFileHashInventory();

      // Step 1: Scan directory
      if (onProgress) {
        onProgress({
          totalFiles: 0,
          processedFiles: 0,
          currentFile: "",
          status: "scanning",
        });
      }

      const files = await scanDirectory(documentsDir, (scanned, found) => {
        if (onProgress) {
          onProgress({
            totalFiles: found,
            processedFiles: 0,
            currentFile: `Scanned ${scanned} files...`,
            status: "scanning",
          });
        }
      });

      console.log(`Found ${files.length} files to process`);

      // Step 2: Index files
      let processedCount = 0;
      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;
      let updatedCount = 0;
      let newCount = 0;

      if (onProgress) {
        onProgress({
          totalFiles: files.length,
          processedFiles: 0,
          currentFile: files[0]?.name ?? "",
          status: "indexing",
        });
      }

      // Process files in batches
      const tasks = files.map((file) =>
        this.queue.add(async () => {
          let outcome: FileIndexOutcome = { type: "failed" };
          try {
            if (onProgress) {
              onProgress({
                totalFiles: files.length,
                processedFiles: processedCount,
                currentFile: file.name,
                status: "indexing",
                successfulFiles: successCount,
                failedFiles: failCount,
                skippedFiles: skippedCount,
              });
            }

            outcome = await this.indexFile(file, fileInventory);
          } catch (error) {
            console.error(`Error indexing file ${file.path}:`, error);
            this.recordFailure(
              "parser.unexpected-error",
              error instanceof Error ? error.message : String(error),
              file,
            );
          }

          processedCount++;
          switch (outcome.type) {
            case "skipped":
              successCount++;
              skippedCount++;
              break;
            case "indexed":
              successCount++;
              if (outcome.changeType === "new") {
                newCount++;
              } else {
                updatedCount++;
              }
              break;
            case "failed":
              failCount++;
              break;
          }

          if (onProgress) {
            onProgress({
              totalFiles: files.length,
              processedFiles: processedCount,
              currentFile: file.name,
              status: "indexing",
              successfulFiles: successCount,
              failedFiles: failCount,
              skippedFiles: skippedCount,
            });
          }
        })
      );

      await Promise.all(tasks);

      if (onProgress) {
        onProgress({
          totalFiles: files.length,
          processedFiles: processedCount,
          currentFile: "",
          status: "complete",
          successfulFiles: successCount,
          failedFiles: failCount,
          skippedFiles: skippedCount,
        });
      }

      this.logFailureSummary();
      await this.writeFailureReport({
        totalFiles: files.length,
        successfulFiles: successCount,
        failedFiles: failCount,
        skippedFiles: skippedCount,
        updatedFiles: updatedCount,
        newFiles: newCount,
      });

      console.log(
        `Indexing complete: ${successCount}/${files.length} files successfully indexed (${failCount} failed, skipped=${skippedCount}, updated=${updatedCount}, new=${newCount})`,
      );
      
      return {
        totalFiles: files.length,
        successfulFiles: successCount,
        failedFiles: failCount,
        skippedFiles: skippedCount,
        updatedFiles: updatedCount,
        newFiles: newCount,
      };
    } catch (error) {
      console.error("Error during indexing:", error);
      if (onProgress) {
        onProgress({
          totalFiles: 0,
          processedFiles: 0,
          currentFile: "",
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  }

  /**
   * Index a single file
   */
  private async indexFile(
    file: ScannedFile,
    fileInventory: Map<string, Set<string>> = new Map(),
  ): Promise<FileIndexOutcome> {
    const { vectorStore, embeddingModel, client, chunkSize, chunkOverlap, enableOCR, autoReindex } =
      this.options;

    let fileHash: string | undefined;
    try {
      // Calculate file hash
      fileHash = await calculateFileHash(file.path);
      const existingHashes = fileInventory.get(file.path);
      const hasSeenBefore = existingHashes !== undefined && existingHashes.size > 0;
      const hasSameHash = existingHashes?.has(fileHash) ?? false;

      // Check if file already indexed
      if (autoReindex && hasSameHash) {
        console.log(`File already indexed (skipped): ${file.name}`);
        return { type: "skipped" };
      }

      if (autoReindex) {
        const previousFailure = await this.failedFileRegistry.getFailureReason(file.path, fileHash);
        if (previousFailure) {
          console.log(
            `File previously failed (skipped): ${file.name} (reason=${previousFailure})`,
          );
          return { type: "skipped" };
        }
      }

      // Wait before parsing to reduce WebSocket load
      if (this.options.parseDelayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, this.options.parseDelayMs));
      }

      // Parse document
      const parsedResult = await parseDocument(file.path, enableOCR, client);
      if (!parsedResult.success) {
        this.recordFailure(parsedResult.reason, parsedResult.details, file);
        if (fileHash) {
          await this.failedFileRegistry.recordFailure(file.path, fileHash, parsedResult.reason);
        }
        return { type: "failed" };
      }
      const parsed = parsedResult.document;

      // Chunk text
      const chunks = chunkText(parsed.text, chunkSize, chunkOverlap);
      if (chunks.length === 0) {
        console.log(`No chunks created from ${file.name}`);
        this.recordFailure("index.chunk-empty", "chunkText produced 0 chunks", file);
        if (fileHash) {
          await this.failedFileRegistry.recordFailure(file.path, fileHash, "index.chunk-empty");
        }
        return { type: "failed" }; // Failed to chunk
      }

      // Generate embeddings and create document chunks
      const documentChunks: DocumentChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
          // Generate embedding
          const embeddingResult = await embeddingModel.embed(chunk.text);
          const embedding = coerceEmbeddingVector(embeddingResult.embedding);
          
          documentChunks.push({
            id: `${fileHash}-${i}`,
            text: chunk.text,
            vector: embedding,
            filePath: file.path,
            fileName: file.name,
            fileHash,
            chunkIndex: i,
            metadata: {
              extension: file.extension,
              size: file.size,
              mtime: file.mtime.toISOString(),
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
            },
          });
        } catch (error) {
          console.error(`Error embedding chunk ${i} of ${file.name}:`, error);
        }
      }

      // Add chunks to vector store
      if (documentChunks.length === 0) {
        this.recordFailure(
          "index.chunk-empty",
          "All chunk embeddings failed, no document chunks",
          file,
        );
        if (fileHash) {
          await this.failedFileRegistry.recordFailure(file.path, fileHash, "index.chunk-empty");
        }
        return { type: "failed" };
      }

      try {
        await vectorStore.addChunks(documentChunks);
        console.log(`Indexed ${documentChunks.length} chunks from ${file.name}`);
        if (!existingHashes) {
          fileInventory.set(file.path, new Set([fileHash]));
        } else {
          existingHashes.add(fileHash);
        }
        await this.failedFileRegistry.clearFailure(file.path);
        return {
          type: "indexed",
          changeType: hasSeenBefore ? "updated" : "new",
        };
      } catch (error) {
        console.error(`Error adding chunks for ${file.name}:`, error);
        this.recordFailure(
          "index.vector-add-error",
          error instanceof Error ? error.message : String(error),
          file,
        );
        if (fileHash) {
          await this.failedFileRegistry.recordFailure(file.path, fileHash, "index.vector-add-error");
        }
        return { type: "failed" };
      }
    } catch (error) {
          console.error(`Error indexing file ${file.path}:`, error);
          this.recordFailure(
            "parser.unexpected-error",
            error instanceof Error ? error.message : String(error),
            file,
          );
      if (fileHash) {
        await this.failedFileRegistry.recordFailure(file.path, fileHash, "parser.unexpected-error");
      }
      return { type: "failed" }; // Failed
    }
  }

  /**
   * Reindex a specific file (delete old chunks and reindex)
   */
  async reindexFile(filePath: string): Promise<void> {
    const { vectorStore } = this.options;

    try {
      const fileHash = await calculateFileHash(filePath);
      
      // Delete old chunks
      await vectorStore.deleteByFileHash(fileHash);
      
      // Reindex
      const file: ScannedFile = {
        path: filePath,
        name: filePath.split("/").pop() || filePath,
        extension: filePath.split(".").pop() || "",
        mimeType: false,
        size: 0,
        mtime: new Date(),
      };
      
      await this.indexFile(file);
    } catch (error) {
      console.error(`Error reindexing file ${filePath}:`, error);
      throw error;
    }
  }

  private recordFailure(reason: FailureReason, details: string | undefined, file: ScannedFile) {
    const current = this.failureReasonCounts[reason] ?? 0;
    this.failureReasonCounts[reason] = current + 1;
    const detailSuffix = details ? ` details=${details}` : "";
    console.warn(
      `[BigRAG] Failed to parse ${file.name} (reason=${reason}, count=${this.failureReasonCounts[reason]})${detailSuffix}`,
    );
  }

  private logFailureSummary() {
    const entries = Object.entries(this.failureReasonCounts);
    if (entries.length === 0) {
      console.log("[BigRAG] No parsing failures recorded.");
      return;
    }
    console.log("[BigRAG] Failure reason summary:");
    for (const [reason, count] of entries) {
      console.log(`  - ${reason}: ${count}`);
    }
  }

  private async writeFailureReport(summary: IndexingResult) {
    const reportPath = this.options.failureReportPath;
    if (!reportPath) {
      return;
    }

    const payload = {
      ...summary,
      documentsDir: this.options.documentsDir,
      failureReasons: this.failureReasonCounts,
      generatedAt: new Date().toISOString(),
    };

    try {
      await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.promises.writeFile(reportPath, JSON.stringify(payload, null, 2), "utf-8");
      console.log(`[BigRAG] Wrote failure report to ${reportPath}`);
    } catch (error) {
      console.error(`[BigRAG] Failed to write failure report to ${reportPath}:`, error);
    }
  }
}

