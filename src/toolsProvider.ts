import { tool, type Tool, type ToolsProviderController } from "@lmstudio/sdk";
import { z } from "zod";
import { resolveEmbeddingModelId } from "./config";
import { getIndexStatus, retrievePassages } from "./rag/retrieval";
import { readToolsPluginSettings } from "./utils/effectivePluginConfig";

export async function provideTools(ctl: ToolsProviderController): Promise<Tool[]> {
  const searchTool = tool({
    name: "big_rag_search",
    description:
      "Search the Big RAG indexed document collection for passages relevant to a query. " +
      "Returns matching text snippets with file names and similarity scores.",
    parameters: {
      query: z.string().describe("Natural-language search query"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Maximum passages to return (defaults to plugin Retrieval Limit setting)"),
    },
    implementation: async ({ query, limit }, { signal, status }) => {
      status("Searching indexed documents…");

      const pluginSettings = readToolsPluginSettings(ctl);
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) {
        return "Error: Search query must not be empty.";
      }

      const vectorStoreDir = pluginSettings.vectorStoreDirectory;
      if (!vectorStoreDir.trim()) {
        return (
          "Error: Vector store directory is not configured. " +
          "Set paths in the chat Integrations sidebar. REST reuses them via auto-sync to ~/.lmstudio/big-rag-tools-config.json, " +
          "or set BIG_RAG_DOCS_DIR / BIG_RAG_DB_DIR env vars on the LM Studio process."
        );
      }

      const retrievalLimit = limit ?? pluginSettings.retrievalLimit;
      const retrievalThreshold = pluginSettings.retrievalAffinityThreshold;
      const embeddingModelId = resolveEmbeddingModelId(pluginSettings.embeddingModel);

      const result = await retrievePassages({
        client: ctl.client,
        vectorStoreDir,
        embeddingModelId,
        query: trimmedQuery,
        retrievalLimit,
        retrievalThreshold,
        abortSignal: signal,
      });

      if (!result.ok) {
        if (result.logMessage) {
          console.error("[BigRAG]", result.logMessage);
        }
        return `Error: ${result.message}`;
      }

      // Return a plain object — LM Studio serializes tool results once.
      // Pre-stringifying caused double-encoded JSON in REST/tool payloads.
      type SearchPassageResult = {
        rank: number;
        fileName: string;
        filePath: string;
        score: number;
        shardName: string;
        text: string;
      };

      if (result.passages.length === 0) {
        const emptyPassages: SearchPassageResult[] = [];
        return {
          query: trimmedQuery,
          passageCount: 0,
          passages: emptyPassages,
          message: "No relevant content found in indexed documents for this query.",
        };
      }

      const searchPassages: SearchPassageResult[] = result.passages.map(
        (passage, passageIndex) => ({
          rank: passageIndex + 1,
          fileName: passage.fileName,
          filePath: passage.filePath,
          score: passage.score,
          shardName: passage.shardName,
          text: passage.text,
        }),
      );

      return {
        query: trimmedQuery,
        passageCount: searchPassages.length,
        passages: searchPassages,
      };
    },
  });

  const statusTool = tool({
    name: "big_rag_index_status",
    description:
      "Return Big RAG index statistics: chunk count, unique file count, and configured directories.",
    parameters: {},
    implementation: async (_params, { status }) => {
      status("Reading index status…");

      const pluginSettings = readToolsPluginSettings(ctl);
      const documentsDir = pluginSettings.documentsDirectory;
      const vectorStoreDir = pluginSettings.vectorStoreDirectory;
      const embeddingModelId = resolveEmbeddingModelId(pluginSettings.embeddingModel);

      const indexStatus = await getIndexStatus({
        documentsDirectory: documentsDir,
        vectorStoreDirectory: vectorStoreDir,
        embeddingModelId,
      });

      if ("error" in indexStatus) {
        return (
          `Error: ${indexStatus.error} Set paths in chat Integrations sidebar (syncs for REST on first message), ` +
          "or BIG_RAG_DOCS_DIR / BIG_RAG_DB_DIR env vars."
        );
      }

      return indexStatus;
    },
  });

  return [searchTool, statusTool];
}
