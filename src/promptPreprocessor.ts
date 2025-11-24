import {
  type ChatMessage,
  type PromptPreprocessorController,
} from "@lmstudio/sdk";
import { configSchematics } from "./config";
import { VectorStore } from "./vectorstore/vectorStore";
import { performSanityChecks } from "./utils/sanityChecks";
import { tryStartIndexing, finishIndexing } from "./utils/indexingLock";
import * as path from "path";
import { runIndexingJob } from "./ingestion/runIndexing";

function summarizeText(text: string, maxLines: number = 3, maxChars: number = 400): string {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
  const clippedLines = lines.slice(0, maxLines);
  let clipped = clippedLines.join("\n");
  if (clipped.length > maxChars) {
    clipped = clipped.slice(0, maxChars);
  }
  const needsEllipsis =
    lines.length > maxLines ||
    text.length > clipped.length ||
    clipped.length === maxChars && text.length > maxChars;
  return needsEllipsis ? `${clipped.trimEnd()}…` : clipped;
}

// Global state for vector store (persists across requests)
let vectorStore: VectorStore | null = null;
let lastIndexedDir = "";
let sanityChecksPassed = false;
/**
 * Main prompt preprocessor function
 */
export async function preprocess(
  ctl: PromptPreprocessorController,
  userMessage: ChatMessage,
): Promise<ChatMessage | string> {
  const userPrompt = userMessage.getText();
  const pluginConfig = ctl.getPluginConfig(configSchematics);

  // Get configuration
  const documentsDir = pluginConfig.get("documentsDirectory");
  const vectorStoreDir = pluginConfig.get("vectorStoreDirectory");
  const retrievalLimit = pluginConfig.get("retrievalLimit");
  const retrievalThreshold = pluginConfig.get("retrievalAffinityThreshold");
  const chunkSize = pluginConfig.get("chunkSize");
  const chunkOverlap = pluginConfig.get("chunkOverlap");
  const maxConcurrent = pluginConfig.get("maxConcurrentFiles");
  const enableOCR = pluginConfig.get("enableOCR");
  const skipPreviouslyIndexed = pluginConfig.get("manualReindex.skipPreviouslyIndexed");
  const parseDelayMs = pluginConfig.get("parseDelayMs") ?? 0;
  const reindexRequested = pluginConfig.get("manualReindex.trigger");

  // Validate configuration
  if (!documentsDir || documentsDir === "") {
    console.warn("[BigRAG] Documents directory not configured. Please set it in plugin settings.");
    return userMessage;
  }

  if (!vectorStoreDir || vectorStoreDir === "") {
    console.warn("[BigRAG] Vector store directory not configured. Please set it in plugin settings.");
    return userMessage;
  }

  try {
    // Perform sanity checks on first run
    if (!sanityChecksPassed) {
      const checkStatus = ctl.createStatus({
        status: "loading",
        text: "Performing sanity checks...",
      });

      const sanityResult = await performSanityChecks(documentsDir, vectorStoreDir);

      // Log warnings
      for (const warning of sanityResult.warnings) {
        console.warn("[BigRAG]", warning);
      }

      // Log errors and abort if critical
      if (!sanityResult.passed) {
        for (const error of sanityResult.errors) {
          console.error("[BigRAG]", error);
        }
        checkStatus.setState({
          status: "canceled",
          text: "Sanity checks failed. Please check configuration.",
        });
        return userMessage;
      }

      checkStatus.setState({
        status: "done",
        text: "Sanity checks passed",
      });
      sanityChecksPassed = true;
    }

    // Initialize vector store if needed
    if (!vectorStore || lastIndexedDir !== vectorStoreDir) {
      const status = ctl.createStatus({
        status: "loading",
        text: "Initializing vector store...",
      });

      vectorStore = new VectorStore(vectorStoreDir);
      await vectorStore.initialize();
      console.info(
        `[BigRAG] Vector store ready (path=${vectorStoreDir}). Waiting for queries...`,
      );
      lastIndexedDir = vectorStoreDir;

      status.setState({
        status: "done",
        text: "Vector store initialized",
      });
    }

    await maybeHandleConfigTriggeredReindex({
      ctl,
      documentsDir,
      vectorStoreDir,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      parseDelayMs,
      reindexRequested,
      skipPreviouslyIndexed: pluginConfig.get("manualReindex.skipPreviouslyIndexed"),
    });

    // Check if we need to index
    const stats = await vectorStore.getStats();
    console.debug(`[BigRAG] Vector store stats before auto-index check: totalChunks=${stats.totalChunks}, uniqueFiles=${stats.uniqueFiles}`);

    if (stats.totalChunks === 0) {
      if (!tryStartIndexing("auto-trigger")) {
        console.warn("[BigRAG] Indexing already running, skipping automatic indexing.");
      } else {
        const indexStatus = ctl.createStatus({
          status: "loading",
          text: "Starting initial indexing...",
        });

        try {
          const { indexingResult } = await runIndexingJob({
            client: ctl.client,
            abortSignal: ctl.abortSignal,
            documentsDir,
            vectorStoreDir,
            chunkSize,
            chunkOverlap,
            maxConcurrent,
            enableOCR,
            autoReindex: false,
            parseDelayMs,
            vectorStore,
            forceReindex: true,
            onProgress: (progress) => {
              if (progress.status === "scanning") {
                indexStatus.setState({
                  status: "loading",
                  text: `Scanning: ${progress.currentFile}`,
                });
              } else if (progress.status === "indexing") {
                indexStatus.setState({
                  status: "loading",
                  text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files ` +
                    `(success=${progress.successfulFiles ?? 0}, failed=${progress.failedFiles ?? 0}) ` +
                    `(${progress.currentFile})`,
                });
              } else if (progress.status === "complete") {
                indexStatus.setState({
                  status: "done",
                  text: `Indexing complete: ${progress.processedFiles} files processed`,
                });
              } else if (progress.status === "error") {
                indexStatus.setState({
                  status: "canceled",
                  text: `Indexing error: ${progress.error}`,
                });
              }
            },
          });

          console.log(`[BigRAG] Indexing complete: ${indexingResult.successfulFiles}/${indexingResult.totalFiles} files successfully indexed (${indexingResult.failedFiles} failed)`);
        } catch (error) {
          indexStatus.setState({
            status: "canceled",
            text: `Indexing failed: ${error instanceof Error ? error.message : String(error)}`,
          });
          console.error("[BigRAG] Indexing failed:", error);
        } finally {
          finishIndexing();
        }
      }
    }

    // Log manual reindex toggle states for visibility on each chat
    const toggleStatusText =
      `Manual Reindex Trigger: ${reindexRequested ? "ON" : "OFF"} | ` +
      `Skip Previously Indexed: ${skipPreviouslyIndexed ? "ON" : "OFF"}`;
    console.info(`[BigRAG] ${toggleStatusText}`);
    ctl.createStatus({
      status: "done",
      text: toggleStatusText,
    });

    // Perform retrieval
    const retrievalStatus = ctl.createStatus({
      status: "loading",
      text: "Loading embedding model for retrieval...",
    });

    const embeddingModel = await ctl.client.embedding.model(
      "nomic-ai/nomic-embed-text-v1.5-GGUF",
      { signal: ctl.abortSignal }
    );

    retrievalStatus.setState({
      status: "loading",
      text: "Searching for relevant content...",
    });

    // Embed the query
    const queryEmbeddingResult = await embeddingModel.embed(userPrompt);
    const queryEmbedding = queryEmbeddingResult.embedding;

    // Search vector store
    const queryPreview =
      userPrompt.length > 160 ? `${userPrompt.slice(0, 160)}...` : userPrompt;
    console.info(
      `[BigRAG] Executing vector search for "${queryPreview}" (limit=${retrievalLimit}, threshold=${retrievalThreshold})`,
    );
    const results = await vectorStore.search(
      queryEmbedding,
      retrievalLimit,
      retrievalThreshold
    );
    if (results.length > 0) {
      const topHit = results[0];
      console.info(
        `[BigRAG] Vector search returned ${results.length} results. Top hit: file=${topHit.fileName} score=${topHit.score.toFixed(3)}`,
      );

      const docSummaries = results
        .map(
          (result, idx) =>
            `#${idx + 1} file=${path.basename(result.filePath)} score=${result.score.toFixed(3)}`,
        )
        .join("\n");
      console.info(`[BigRAG] Relevant documents:\n${docSummaries}`);
    } else {
      console.warn("[BigRAG] Vector search returned 0 results.");
    }

    if (results.length === 0) {
      retrievalStatus.setState({
        status: "canceled",
        text: "No relevant content found in indexed documents",
      });

      const noteAboutNoResults =
        `Important: No relevant content was found in the indexed documents for the user query. ` +
        `In less than one sentence, inform the user of this. ` +
        `Then respond to the query to the best of your ability.`;

      return noteAboutNoResults + `\n\nUser Query:\n\n${userPrompt}`;
    }

    // Format results
    retrievalStatus.setState({
      status: "done",
      text: `Retrieved ${results.length} relevant passages`,
    });

    ctl.debug("Retrieval results:", results);

    let processedContent = "";
    let processedPreview = "";
    const prefix = "The following passages were found in your indexed documents:\n\n";
    processedContent += prefix;
    processedPreview += prefix;

    let citationNumber = 1;
    for (const result of results) {
      const fileName = path.basename(result.filePath);
      const citationLabel = `Citation ${citationNumber} (from ${fileName}, score: ${result.score.toFixed(3)}): `;
      processedContent += `\n${citationLabel}"${result.text}"\n\n`;
      processedPreview += `\n${citationLabel}"${summarizeText(result.text)}"\n\n`;
      citationNumber++;
    }

    // Add citations to LM Studio's citation system
    // Note: This would require adapting the results to the expected format
    // The citation system expects specific structure from the retrieval API
    // For now, we'll just inject the text content

    const suffix =
      `Use the citations above to respond to the user query, only if they are relevant. ` +
      `Otherwise, respond to the best of your ability without them.` +
      `\n\nUser Query:\n\n${userPrompt}`;
    processedContent += suffix;
    processedPreview += suffix;

    ctl.debug("Processed content (preview):", processedPreview);

    const passagesLogEntries = results.map((result, idx) => {
      const fileName = path.basename(result.filePath);
      return `#${idx + 1} file=${fileName} score=${result.score.toFixed(3)}\n${summarizeText(result.text)}`;
    });
    const passagesLog = passagesLogEntries.join("\n\n");

    console.info(`[BigRAG] RAG passages (${results.length}) preview:\n${passagesLog}`);
    ctl.createStatus({
      status: "done",
      text: `RAG passages (${results.length}):`,
    });
    for (const entry of passagesLogEntries) {
      ctl.createStatus({
        status: "done",
        text: entry,
      });
    }

    console.info(`[BigRAG] Final prompt sent to model (preview):\n${processedPreview}`);
    ctl.createStatus({
      status: "done",
      text: `Final prompt sent to model (preview):\n${processedPreview}`,
    });

    return processedContent;
  } catch (error) {
    console.error("[PromptPreprocessor] Preprocessing failed.", error);
    return userMessage;
  }
}

interface ConfigReindexOpts {
  ctl: PromptPreprocessorController;
  documentsDir: string;
  vectorStoreDir: string;
  chunkSize: number;
  chunkOverlap: number;
  maxConcurrent: number;
  enableOCR: boolean;
  parseDelayMs: number;
  reindexRequested: boolean;
  skipPreviouslyIndexed: boolean;
}

async function maybeHandleConfigTriggeredReindex({
  ctl,
  documentsDir,
  vectorStoreDir,
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  parseDelayMs,
  reindexRequested,
  skipPreviouslyIndexed,
}: ConfigReindexOpts) {
  if (!reindexRequested) {
    return;
  }

  const reminderText =
    "Manual Reindex Trigger is ON. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files.";
  console.info(`[BigRAG] ${reminderText}`);
  ctl.createStatus({
    status: "done",
    text: reminderText,
  });

  if (!tryStartIndexing("config-trigger")) {
    ctl.createStatus({
      status: "canceled",
      text: "Manual reindex already running. Please wait for it to finish.",
    });
    return;
  }

  const status = ctl.createStatus({
    status: "loading",
    text: "Manual reindex requested from config...",
  });

  try {
    const { indexingResult } = await runIndexingJob({
      client: ctl.client,
      abortSignal: ctl.abortSignal,
      documentsDir,
      vectorStoreDir,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      autoReindex: skipPreviouslyIndexed,
      parseDelayMs,
      forceReindex: !skipPreviouslyIndexed,
      vectorStore: vectorStore ?? undefined,
      onProgress: (progress) => {
        if (progress.status === "scanning") {
          status.setState({
            status: "loading",
            text: `Scanning: ${progress.currentFile}`,
          });
        } else if (progress.status === "indexing") {
          status.setState({
            status: "loading",
            text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files ` +
              `(success=${progress.successfulFiles ?? 0}, failed=${progress.failedFiles ?? 0}) ` +
              `(${progress.currentFile})`,
          });
        } else if (progress.status === "complete") {
          status.setState({
            status: "done",
            text: `Indexing complete: ${progress.processedFiles} files processed`,
          });
        } else if (progress.status === "error") {
          status.setState({
            status: "canceled",
            text: `Indexing error: ${progress.error}`,
          });
        }
      },
    });

    status.setState({
      status: "done",
      text: "Manual reindex complete!",
    });

    const summaryLines = [
      `Processed: ${indexingResult.successfulFiles}/${indexingResult.totalFiles}`,
      `Failed: ${indexingResult.failedFiles}`,
      `Skipped (unchanged): ${indexingResult.skippedFiles}`,
      `Updated existing files: ${indexingResult.updatedFiles}`,
      `New files added: ${indexingResult.newFiles}`,
    ];
    for (const line of summaryLines) {
      ctl.createStatus({
        status: "done",
        text: line,
      });
    }

    if (indexingResult.totalFiles > 0 && indexingResult.skippedFiles === indexingResult.totalFiles) {
      ctl.createStatus({
        status: "done",
        text: "All files were already up to date (skipped).",
      });
    }

    console.log(
      `[BigRAG] Manual reindex summary:\n  ${summaryLines.join("\n  ")}`,
    );

    await notifyManualResetNeeded(ctl);
  } catch (error) {
    status.setState({
      status: "error",
      text: `Manual reindex failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    console.error("[BigRAG] Manual reindex failed:", error);
  } finally {
    finishIndexing();
  }
}

async function notifyManualResetNeeded(ctl: PromptPreprocessorController) {
  try {
    await ctl.client.system.notify({
      title: "Manual reindex completed",
      description:
        "Manual Reindex Trigger is ON. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files.",
    });
  } catch (error) {
    console.warn("[BigRAG] Unable to send notification about manual reindex reset:", error);
  }
}


