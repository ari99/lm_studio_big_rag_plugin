import PQueue from "p-queue";
import * as fs from "fs";
import * as path from "path";
import { scanDirectory, type ScannedFile } from "./fileScanner";
import { parseDocument, type ParseFailureReason } from "../parsers/documentParser";
import { VectorStore, type DocumentChunk } from "../vectorstore/vectorStore";
import { chunkTextsBatch, type ChunkResult } from "../utils/textChunker";
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
  abortSignal?: AbortSignal;
  onProgress?: (progress: IndexingProgress) => void;
}

type FailureReason = ParseFailureReason | "index.chunk-empty" | "index.vector-add-error" | "index.embedding-error";

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
  private options: IndexingOptions;
  private failureReasonCounts: Record<string, number> = {};
  private failedFileRegistry: FailedFileRegistry;

  constructor(options: IndexingOptions) {
    this.options = options;
    this.failedFileRegistry = new FailedFileRegistry(
      path.join(options.vectorStoreDir, ".big-rag-failures.json"),
    );
  }

  /**
   * Start the indexing process
   * Uses two-phase processing for maximum performance:
   * Phase 1: Parse all documents and collect texts
   * Phase 2: Batch chunk all texts in single native call (avoids FFI overhead)
   * Phase 3: Batch embed and index all chunks
   */
  async index(): Promise<IndexingResult> {
    const { documentsDir, vectorStore, chunkSize, chunkOverlap, onProgress } = this.options;

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

      this.options.abortSignal?.throwIfAborted();
      console.log(`Found ${files.length} files to process`);

      // Step 2: Parse all documents and collect texts (Phase 1)
      if (onProgress) {
        onProgress({
          totalFiles: files.length,
          processedFiles: 0,
          currentFile: "Parsing documents...",
          status: "indexing",
        });
      }

      interface ParsedDocument {
        file: ScannedFile;
        fileHash: string;
        text: string;
        outcome: "new" | "updated" | "skipped" | "failed";
        failureReason?: FailureReason;
        failureDetails?: string;
      }

      const parsedDocs: ParsedDocument[] = [];
      let parseCount = 0;

      // Parse documents with concurrency control
      const parseQueue = new PQueue({ concurrency: this.options.maxConcurrent });
      const parseTasks = files.map((file) =>
        parseQueue.add(async () => {
          this.options.abortSignal?.throwIfAborted();

          try {
            const fileHash = await calculateFileHash(file.path);
            const existingHashes = fileInventory.get(file.path);
            const hasSameHash = existingHashes?.has(fileHash) ?? false;

            // Check if already indexed
            if (this.options.autoReindex && hasSameHash) {
              parsedDocs.push({ file, fileHash, text: "", outcome: "skipped" });
              return;
            }

            // Check for previous failure
            if (this.options.autoReindex) {
              const previousFailure = await this.failedFileRegistry.getFailureReason(file.path, fileHash);
              if (previousFailure) {
                parsedDocs.push({ file, fileHash, text: "", outcome: "skipped" });
                return;
              }
            }

            // Parse document
            const parsedResult = await parseDocument(file.path, this.options.enableOCR, this.options.client);
            if (!parsedResult.success) {
              parsedDocs.push({
                file,
                fileHash,
                text: "",
                outcome: "failed",
                failureReason: parsedResult.reason,
                failureDetails: parsedResult.details,
              });
              return;
            }

            parsedDocs.push({
              file,
              fileHash,
              text: parsedResult.document.text,
              outcome: hasSameHash ? "updated" : "new",
            });
          } catch (error) {
            parsedDocs.push({
              file,
              fileHash: "",
              text: "",
              outcome: "failed",
              failureReason: "parser.unexpected-error",
              failureDetails: error instanceof Error ? error.message : String(error),
            });
          }

          parseCount++;
          if (onProgress) {
            onProgress({
              totalFiles: files.length,
              processedFiles: parseCount,
              currentFile: `Parsed ${parseCount}/${files.length}...`,
              status: "indexing",
            });
          }
        })
      );

      await Promise.all(parseTasks);

      // Record parse failures
      for (const doc of parsedDocs) {
        if (doc.outcome === "failed" && doc.failureReason) {
          this.recordFailure(doc.failureReason, doc.failureDetails, doc.file);
          if (doc.fileHash) {
            await this.failedFileRegistry.recordFailure(doc.file.path, doc.fileHash, doc.failureReason);
          }
        }
      }

      // Step 3: Batch chunk all texts (Phase 2) - SINGLE NATIVE CALL
      const textsToChunk = parsedDocs.filter(d => d.outcome !== "skipped" && d.outcome !== "failed").map(d => d.text);
      const validDocs = parsedDocs.filter(d => d.outcome !== "skipped" && d.outcome !== "failed");

      let chunkedTexts: Map<number, ChunkResult[]> = new Map();

      if (textsToChunk.length > 0) {
        console.log(`Batch chunking ${textsToChunk.length} documents...`);
        chunkedTexts = await chunkTextsBatch(textsToChunk, chunkSize, chunkOverlap);
      }

      // Step 4: Embed and index ALL chunks in a single batch (Phase 3)
      // This is the KEY optimization - one embedding API call for ALL chunks
      let successCount = 0;
      let failCount = 0;
      let skippedCount = parsedDocs.filter(d => d.outcome === "skipped").length;
      let updatedCount = 0;
      let newCount = 0;

      // Collect ALL chunks from ALL files with their metadata
      interface ChunkWithMetadata {
        docIndex: number;
        chunkIndex: number;
        text: string;
        doc: typeof validDocs[0];
        chunk: ChunkResult;
      }

      const allChunks: ChunkWithMetadata[] = [];
      for (let i = 0; i < validDocs.length; i++) {
        const doc = validDocs[i];
        const chunks = chunkedTexts.get(i) || [];

        if (chunks.length === 0) {
          console.log(`No chunks created from ${doc.file.name}`);
          this.recordFailure("index.chunk-empty", "chunkTextsBatch produced 0 chunks", doc.file);
          if (doc.fileHash) {
            await this.failedFileRegistry.recordFailure(doc.file.path, doc.fileHash, "index.chunk-empty");
          }
          failCount++;
          continue;
        }

        for (let j = 0; j < chunks.length; j++) {
          allChunks.push({
            docIndex: i,
            chunkIndex: j,
            text: chunks[j].text,
            doc,
            chunk: chunks[j],
          });
        }
      }

      console.log(`Embedding ${allChunks.length} chunks from ${validDocs.length} files...`);

      // Embed in batches of 200 for optimal network performance (2.71x speedup)
      // See FINAL_PERFORMANCE_REPORT.md for benchmark details
      const EMBEDDING_BATCH_SIZE = 200;
      
      if (allChunks.length > 0) {
        try {
          const allTexts = allChunks.map(c => c.text);
          const allEmbeddings: any[] = [];
          
          // Embed in batches to avoid timeout and improve reliability
          for (let i = 0; i < allTexts.length; i += EMBEDDING_BATCH_SIZE) {
            const batch = allTexts.slice(i, i + EMBEDDING_BATCH_SIZE);
            const result = await this.options.embeddingModel.embed(batch);
            allEmbeddings.push(...result);
          }

          // Group results by file for vector store insertion
          const chunksByFile = new Map<number, DocumentChunk[]>();
          for (let i = 0; i < allEmbeddings.length; i++) {
            const chunkInfo = allChunks[i];
            const embedding = coerceEmbeddingVector(allEmbeddings[i].embedding);

            let fileChunks = chunksByFile.get(chunkInfo.docIndex);
            if (!fileChunks) {
              fileChunks = [];
              chunksByFile.set(chunkInfo.docIndex, fileChunks);
            }

            fileChunks.push({
              id: `${chunkInfo.doc.fileHash}-${chunkInfo.chunkIndex}`,
              text: chunkInfo.text,
              vector: embedding,
              filePath: chunkInfo.doc.file.path,
              fileName: chunkInfo.doc.file.name,
              fileHash: chunkInfo.doc.fileHash,
              chunkIndex: chunkInfo.chunkIndex,
              metadata: {
                extension: chunkInfo.doc.file.extension,
                size: chunkInfo.doc.file.size,
                mtime: chunkInfo.doc.file.mtime.toISOString(),
                startIndex: chunkInfo.chunk.startIndex,
                endIndex: chunkInfo.chunk.endIndex,
              },
            });
          }

          // Add all chunks to vector store
          for (const [docIndex, documentChunks] of chunksByFile.entries()) {
            const doc = validDocs[docIndex];
            await vectorStore.addChunks(documentChunks);
            console.log(`Indexed ${documentChunks.length} chunks from ${doc.file.name}`);

            // Update inventory
            const existingHashes = fileInventory.get(doc.file.path);
            if (!existingHashes) {
              fileInventory.set(doc.file.path, new Set([doc.fileHash]));
            } else {
              existingHashes.add(doc.fileHash);
            }
            await this.failedFileRegistry.clearFailure(doc.file.path);

            successCount++;
            if (doc.outcome === "new") newCount++;
            else updatedCount++;
          }
        } catch (error) {
          console.error(`Error embedding all chunks:`, error);
          // Mark all as failed
          failCount = validDocs.length;
          for (const doc of validDocs) {
            this.recordFailure(
              "index.embedding-error",
              error instanceof Error ? error.message : String(error),
              doc.file,
            );
            if (doc.fileHash) {
              await this.failedFileRegistry.recordFailure(doc.file.path, doc.fileHash, "index.embedding-error");
            }
          }
        }
      }

      if (onProgress) {
        onProgress({
          totalFiles: files.length,
          processedFiles: files.length,
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

