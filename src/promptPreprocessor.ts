import {
  type ChatMessage,
  type PromptPreprocessorController,
} from "@lmstudio/sdk";
import { configSchematics, DEFAULT_PROMPT_TEMPLATE, resolveEmbeddingModelId } from "./config";
import { performSanityChecks } from "./utils/sanityChecks";
import { tryStartIndexing, finishIndexing } from "./utils/indexingLock";
import { deleteEmbeddingIndexManifest } from "./utils/embeddingIndexManifest";
import * as path from "path";
import { runIndexingJob } from "./ingestion/runIndexing";
import { parseExcludePatternsBlock } from "./utils/fileExcludePatterns";
import { resolveAdditionalExtensions } from "./utils/additionalExtensions";
import { syncChatToolsSettingsForRest } from "./utils/effectivePluginConfig";
import {
  ensureVectorStore,
  formatRagContext,
  getCachedVectorStore,
  retrievePassages,
  summarizeText,
} from "./rag/retrieval";

/**
 * Check the abort signal and throw if the request has been cancelled.
 * This gives LM Studio the opportunity to stop the preprocessor promptly.
 */
function checkAbort(signal: AbortSignal): void {
  if (signal.aborted) {
    throw signal.reason ?? new DOMException("Aborted", "AbortError");
  }
}

/**
 * Returns true if the error is an abort/cancellation error that should be re-thrown.
 */
function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  if (error instanceof Error && error.message === "Aborted") return true;
  return false;
}

let sanityChecksPassed = false;
let lastSanityCheckedDocumentsDir = "";
let lastSanityCheckedVectorStoreDir = "";

const RAG_CONTEXT_MACRO = "{{rag_context}}";
const USER_QUERY_MACRO = "{{user_query}}";

function normalizePromptTemplate(template: string | null | undefined): string {
  const hasContent = typeof template === "string" && template.trim().length > 0;
  let normalized = hasContent ? template! : DEFAULT_PROMPT_TEMPLATE;

  if (!normalized.includes(RAG_CONTEXT_MACRO)) {
    console.warn(
      `[BigRAG] Prompt template missing ${RAG_CONTEXT_MACRO}. Prepending RAG context block.`,
    );
    normalized = `${RAG_CONTEXT_MACRO}\n\n${normalized}`;
  }

  if (!normalized.includes(USER_QUERY_MACRO)) {
    console.warn(
      `[BigRAG] Prompt template missing ${USER_QUERY_MACRO}. Appending user query block.`,
    );
    normalized = `${normalized}\n\nUser Query:\n\n${USER_QUERY_MACRO}`;
  }

  return normalized;
}

function fillPromptTemplate(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (acc, [token, value]) => acc.split(token).join(value),
    template,
  );
}

async function warnIfContextOverflow(
  ctl: PromptPreprocessorController,
  finalPrompt: string,
): Promise<void> {
  try {
    const tokenSource = await ctl.tokenSource();
    if (
      !tokenSource ||
      !("applyPromptTemplate" in tokenSource) ||
      typeof tokenSource.applyPromptTemplate !== "function" ||
      !("countTokens" in tokenSource) ||
      typeof tokenSource.countTokens !== "function" ||
      !("getContextLength" in tokenSource) ||
      typeof tokenSource.getContextLength !== "function"
    ) {
      console.warn("[BigRAG] Token source does not expose prompt utilities; skipping context check.");
      return;
    }

    const [contextLength, history] = await Promise.all([
      tokenSource.getContextLength(),
      ctl.pullHistory(),
    ]);
    const historyWithLatestMessage = history.withAppended({
      role: "user",
      content: finalPrompt,
    });
    const formattedPrompt = await tokenSource.applyPromptTemplate(historyWithLatestMessage);
    const promptTokens = await tokenSource.countTokens(formattedPrompt);

    if (promptTokens > contextLength) {
      const warningSummary =
        `⚠️ Prompt needs ${promptTokens.toLocaleString()} tokens but model max is ${contextLength.toLocaleString()}.`;
      console.warn("[BigRAG]", warningSummary);
      ctl.createStatus({
        status: "error",
        text: `${warningSummary} Reduce retrieved passages or increase the model's context length.`,
      });
      try {
        await ctl.client.system.notify({
          title: "Context window exceeded",
          description: `${warningSummary} Prompt may be truncated or rejected.`,
          noAutoDismiss: true,
        });
      } catch (notifyError) {
        console.warn("[BigRAG] Unable to send context overflow notification:", notifyError);
      }
    }
  } catch (error) {
    console.warn("[BigRAG] Failed to evaluate context usage:", error);
  }
}

/**
 * Main prompt preprocessor function
 */
export async function preprocess(
  ctl: PromptPreprocessorController,
  userMessage: ChatMessage,
): Promise<ChatMessage | string> {
  const userPrompt = userMessage.getText();
  const pluginConfig = ctl.getPluginConfig(configSchematics);
  syncChatToolsSettingsForRest(pluginConfig);

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
  const resolvedEmbeddingModelId = resolveEmbeddingModelId(pluginConfig.get("embeddingModel"));
  const excludePatterns = parseExcludePatternsBlock(pluginConfig.get("excludeFilenamePatterns") ?? "");
  const { additionalPlainTextSet: additionalPlainTextExtensions } = resolveAdditionalExtensions(
    pluginConfig.get("additionalExtensions") ?? "",
    (message) => console.warn(message),
  );

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
    // Re-run sanity checks when paths change or on first run.
    const resolvedDocumentsDir = path.resolve(documentsDir);
    const resolvedVectorStoreDir = path.resolve(vectorStoreDir);
    const pathsChangedForSanity =
      resolvedDocumentsDir !== lastSanityCheckedDocumentsDir ||
      resolvedVectorStoreDir !== lastSanityCheckedVectorStoreDir;
    if (!sanityChecksPassed || pathsChangedForSanity) {
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
        const failureReason =
          sanityResult.errors[0] ??
          sanityResult.warnings[0] ??
          "Unknown reason. Please review plugin settings.";
        checkStatus.setState({
          status: "canceled",
          text: `Sanity checks failed: ${failureReason}`,
        });
        return userMessage;
      }

      checkStatus.setState({
        status: "done",
        text: "Sanity checks passed",
      });
      sanityChecksPassed = true;
      lastSanityCheckedDocumentsDir = resolvedDocumentsDir;
      lastSanityCheckedVectorStoreDir = resolvedVectorStoreDir;
    }

    checkAbort(ctl.abortSignal);

    // Initialize vector store if needed
    {
      const status = ctl.createStatus({
        status: "loading",
        text: "Initializing vector store...",
      });

      await ensureVectorStore(vectorStoreDir);
      status.setState({
        status: "done",
        text: "Vector store initialized",
      });
    }

    const vectorStore = getCachedVectorStore();
    if (!vectorStore) {
      console.error("[BigRAG] Vector store failed to initialize.");
      return userMessage;
    }

    checkAbort(ctl.abortSignal);

    await maybeHandleConfigTriggeredReindex({
      ctl,
      documentsDir,
      vectorStoreDir,
      embeddingModelId: resolvedEmbeddingModelId,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      parseDelayMs,
      reindexRequested,
      excludePatterns,
      additionalPlainTextExtensions,
      skipPreviouslyIndexed: pluginConfig.get("manualReindex.skipPreviouslyIndexed"),
    });

    checkAbort(ctl.abortSignal);

    // Check if we need to index
    const stats = await vectorStore.getStats();
    console.debug(`[BigRAG] Vector store stats before auto-index check: totalChunks=${stats.totalChunks}, uniqueFiles=${stats.uniqueFiles}`);

    if (stats.totalChunks === 0) {
      if (!tryStartIndexing("auto-trigger")) {
        console.warn("[BigRAG] Indexing already running, skipping automatic indexing.");
      } else {
        const indexStatus = ctl.createStatus({
          status: "loading",
          text: `Starting initial indexing… (embedding model: ${resolvedEmbeddingModelId})`,
        });

        try {
          const { indexingResult } = await runIndexingJob({
            client: ctl.client,
            abortSignal: ctl.abortSignal,
            documentsDir,
            vectorStoreDir,
            embeddingModelId: resolvedEmbeddingModelId,
            chunkSize,
            chunkOverlap,
            maxConcurrent,
            enableOCR,
            autoReindex: false,
            parseDelayMs,
            excludePatterns,
            additionalPlainTextExtensions,
            vectorStore,
            forceReindex: true,
            onProgress: (progress) => {
              if (progress.status === "scanning") {
                indexStatus.setState({
                  status: "loading",
                  text: `Scanning: ${progress.currentFile} (embedding model: ${resolvedEmbeddingModelId})`,
                });
              } else if (progress.status === "indexing") {
                const success = progress.successfulFiles ?? 0;
                const failed = progress.failedFiles ?? 0;
                const skipped = progress.skippedFiles ?? 0;
                indexStatus.setState({
                  status: "loading",
                  text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files ` +
                    `(success=${success}, failed=${failed}, skipped=${skipped}) ` +
                    `(embedding model: ${resolvedEmbeddingModelId}) ` +
                    `(${progress.currentFile})`,
                });
              } else if (progress.status === "complete") {
                indexStatus.setState({
                  status: "done",
                  text: `Indexing complete: ${progress.processedFiles} files processed (embedding model: ${resolvedEmbeddingModelId})`,
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

    checkAbort(ctl.abortSignal);

    // Log manual reindex toggle states for visibility on each chat
    const toggleStatusText =
      `Manual Reindex Trigger: ${reindexRequested ? "ON" : "OFF"} | ` +
      `Skip Previously Indexed: ${skipPreviouslyIndexed ? "ON" : "OFF"} | ` +
      `Embedding model: ${resolvedEmbeddingModelId}`;
    console.info(`[BigRAG] ${toggleStatusText}`);
    ctl.createStatus({
      status: "done",
      text: toggleStatusText,
    });

    const retrievalStats = await vectorStore.getStats();
    if (retrievalStats.totalChunks === 0) {
      await deleteEmbeddingIndexManifest(vectorStoreDir);
      ctl.createStatus({
        status: "canceled",
        text: "No documents indexed yet",
      });
      const noteAboutEmptyIndex =
        `Important: The document index is empty (no chunks stored yet). ` +
        `In one short sentence, tell the user that nothing has been indexed. ` +
        `Then answer their question to the best of your ability without claiming document retrieval.`;
      return noteAboutEmptyIndex + `\n\nUser Query:\n\n${userPrompt}`;
    }

    const retrievalStatus = ctl.createStatus({
      status: "loading",
      text: "Searching for relevant content...",
    });

    const retrievalResult = await retrievePassages({
      client: ctl.client,
      vectorStoreDir,
      embeddingModelId: resolvedEmbeddingModelId,
      query: userPrompt,
      retrievalLimit,
      retrievalThreshold,
      abortSignal: ctl.abortSignal,
    });

    checkAbort(ctl.abortSignal);

    if (!retrievalResult.ok) {
      retrievalStatus.setState({
        status: retrievalResult.reason === "embedding-mismatch" ? "error" : "canceled",
        text: retrievalResult.message,
      });
      if (retrievalResult.logMessage) {
        console.error("[BigRAG]", retrievalResult.logMessage);
      }
      if (retrievalResult.reason === "embedding-mismatch") {
        return retrievalResult.message + `\n\nUser Query:\n\n${userPrompt}`;
      }
      // empty-index fallback (e.g. index cleared between stats check and search)
      const noteAboutEmptyIndex =
        `Important: The document index is empty (no chunks stored yet). ` +
        `In one short sentence, tell the user that nothing has been indexed. ` +
        `Then answer their question to the best of your ability without claiming document retrieval.`;
      return noteAboutEmptyIndex + `\n\nUser Query:\n\n${userPrompt}`;
    }

    const results = retrievalResult.passages;

    if (results.length > 0) {
      const docSummaries = results
        .map(
          (result, idx) =>
            `#${idx + 1} file=${path.basename(result.filePath)} shard=${result.shardName} score=${result.score.toFixed(3)}`,
        )
        .join("\n");
      console.info(`[BigRAG] Relevant documents:\n${docSummaries}`);
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

    retrievalStatus.setState({
      status: "done",
      text: `Retrieved ${results.length} relevant passages`,
    });

    ctl.debug("Retrieval results:", results);

    const { full: ragContextFull, preview: ragContextPreview } = formatRagContext(results);

    const promptTemplate = normalizePromptTemplate(pluginConfig.get("promptTemplate"));
    const finalPrompt = fillPromptTemplate(promptTemplate, {
      [RAG_CONTEXT_MACRO]: ragContextFull,
      [USER_QUERY_MACRO]: userPrompt,
    });
    const finalPromptPreview = fillPromptTemplate(promptTemplate, {
      [RAG_CONTEXT_MACRO]: ragContextPreview,
      [USER_QUERY_MACRO]: userPrompt,
    });

    ctl.debug("Processed content (preview):", finalPromptPreview);

    const passagesLogEntries = results.map((result, idx) => {
      const fileName = path.basename(result.filePath);
      return `#${idx + 1} file=${fileName} shard=${result.shardName} score=${result.score.toFixed(3)}\n${summarizeText(result.text)}`;
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

    console.info(`[BigRAG] Final prompt sent to model (preview):\n${finalPromptPreview}`);
    ctl.createStatus({
      status: "done",
      text: `Final prompt sent to model (preview):\n${finalPromptPreview}`,
    });

    await warnIfContextOverflow(ctl, finalPrompt);

    return finalPrompt;
  } catch (error) {
    // IMPORTANT: Re-throw abort errors so LM Studio can stop the preprocessor promptly.
    // Swallowing AbortError causes the "did not abort in time" warning.
    if (isAbortError(error)) {
      throw error;
    }
    console.error("[PromptPreprocessor] Preprocessing failed.", error);
    return userMessage;
  }
}

interface ConfigReindexOpts {
  ctl: PromptPreprocessorController;
  documentsDir: string;
  vectorStoreDir: string;
  embeddingModelId: string;
  chunkSize: number;
  chunkOverlap: number;
  maxConcurrent: number;
  enableOCR: boolean;
  parseDelayMs: number;
  reindexRequested: boolean;
  excludePatterns: string[];
  additionalPlainTextExtensions: ReadonlySet<string>;
  skipPreviouslyIndexed: boolean;
}

async function maybeHandleConfigTriggeredReindex({
  ctl,
  documentsDir,
  vectorStoreDir,
  embeddingModelId,
  chunkSize,
  chunkOverlap,
  maxConcurrent,
  enableOCR,
  parseDelayMs,
  reindexRequested,
  excludePatterns,
  additionalPlainTextExtensions,
  skipPreviouslyIndexed,
}: ConfigReindexOpts) {
  if (!reindexRequested) {
    return;
  }

  const reminderText =
    `Manual Reindex Trigger is ON. Skip Previously Indexed Files is currently ${skipPreviouslyIndexed ? "ON" : "OFF"}. ` +
    "The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files. " +
    `Embedding model for this run: ${embeddingModelId}.`;
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
    text: `Manual reindex requested from config… (embedding model: ${embeddingModelId})`,
  });

  try {
    const { indexingResult } = await runIndexingJob({
      client: ctl.client,
      abortSignal: ctl.abortSignal,
      documentsDir,
      vectorStoreDir,
      embeddingModelId,
      chunkSize,
      chunkOverlap,
      maxConcurrent,
      enableOCR,
      autoReindex: skipPreviouslyIndexed,
      parseDelayMs,
      excludePatterns,
      additionalPlainTextExtensions,
      forceReindex: !skipPreviouslyIndexed,
      vectorStore: getCachedVectorStore() ?? undefined,
      onProgress: (progress) => {
        if (progress.status === "scanning") {
          status.setState({
            status: "loading",
            text: `Scanning: ${progress.currentFile} (embedding model: ${embeddingModelId})`,
          });
        } else if (progress.status === "indexing") {
          const success = progress.successfulFiles ?? 0;
          const failed = progress.failedFiles ?? 0;
          const skipped = progress.skippedFiles ?? 0;
          status.setState({
            status: "loading",
            text: `Indexing: ${progress.processedFiles}/${progress.totalFiles} files ` +
              `(success=${success}, failed=${failed}, skipped=${skipped}) ` +
              `(embedding model: ${embeddingModelId}) ` +
              `(${progress.currentFile})`,
          });
        } else if (progress.status === "complete") {
          status.setState({
            status: "done",
            text: `Indexing complete: ${progress.processedFiles} files processed (embedding model: ${embeddingModelId})`,
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
      text: `Manual reindex complete! (embedding model: ${embeddingModelId})`,
    });

    const summaryLines = [
      `Embedding model: ${embeddingModelId}`,
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

    await notifyManualResetNeeded(ctl, embeddingModelId);
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

async function notifyManualResetNeeded(
  ctl: PromptPreprocessorController,
  embeddingModelId: string,
) {
  try {
    await ctl.client.system.notify({
      title: "Manual reindex completed",
      description:
        `Manual Reindex Trigger is ON. The index will be rebuilt each chat when 'Skip Previously Indexed Files' is OFF. If 'Skip Previously Indexed Files' is ON, the index will only be rebuilt for new or changed files. Last run used embedding model: ${embeddingModelId}.`,
    });
  } catch (error) {
    console.warn("[BigRAG] Unable to send notification about manual reindex reset:", error);
  }
}


