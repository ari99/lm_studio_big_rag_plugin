import { createConfigSchematics } from "@lmstudio/sdk";

export const DEFAULT_PROMPT_TEMPLATE = `{{rag_context}}

Use the citations above to respond to the user query, only if they are relevant. Otherwise, respond to the best of your ability without them.

User Query:

{{user_query}}`;

export const configSchematics = createConfigSchematics()
  .field(
    "documentsDirectory",
    "string",
    {
      displayName: "Documents Directory",
      subtitle: "Root directory containing documents to index. All subdirectories will be scanned.",
      placeholder: "/path/to/documents",
    },
    "",
  )
  .field(
    "vectorStoreDirectory",
    "string",
    {
      displayName: "Vector Store Directory",
      subtitle: "Directory where the vector database will be stored.",
      placeholder: "/path/to/vector/store",
    },
    "",
  )
  .field(
    "retrievalLimit",
    "numeric",
    {
      int: true,
      min: 1,
      max: 20,
      displayName: "Retrieval Limit",
      subtitle: "Maximum number of chunks to return during retrieval.",
      slider: { min: 1, max: 20, step: 1 },
    },
    5,
  )
  .field(
    "retrievalAffinityThreshold",
    "numeric",
    {
      min: 0.0,
      max: 1.0,
      displayName: "Retrieval Affinity Threshold",
      subtitle: "Minimum similarity score for a chunk to be considered relevant.",
      slider: { min: 0.0, max: 1.0, step: 0.01 },
    },
    0.5,
  )
  .field(
    "chunkSize",
    "numeric",
    {
      int: true,
      min: 128,
      max: 1500,
      displayName: "Chunk Size",
      subtitle: "Size of text chunks for embedding (in tokens). Max 1500 to stay under 2048 token embedding limit.",
      slider: { min: 128, max: 1500, step: 128 },
    },
    400,
  )
  .field(
    "chunkOverlap",
    "numeric",
    {
      int: true,
      min: 0,
      max: 512,
      displayName: "Chunk Overlap",
      subtitle: "Overlap between consecutive chunks (in tokens).",
      slider: { min: 0, max: 512, step: 32 },
    },
    100,
  )
  .field(
    "maxConcurrentFiles",
    "numeric",
    {
      int: true,
      min: 1,
      max: 10,
      displayName: "Max Concurrent Files",
      subtitle: "Maximum number of files to process concurrently during indexing. Higher values = faster parsing.",
      slider: { min: 1, max: 10, step: 1 },
    },
    5,
  )
  .field(
    "parseDelayMs",
    "numeric",
    {
      int: true,
      min: 0,
      max: 5000,
      displayName: "Parser Delay (ms)",
      subtitle: "Wait time before parsing each document (helps avoid WebSocket throttling). Set to 0 for fastest parsing.",
      slider: { min: 0, max: 5000, step: 100 },
    },
    0,
  )
  .field(
    "enableOCR",
    "boolean",
    {
      displayName: "Enable OCR",
      subtitle: "Enable OCR for image files and image-based PDFs using LM Studio's built-in document parser.",
    },
    true,
  )
  .field(
    "manualReindex.trigger",
    "boolean",
    {
      displayName: "Manual Reindex Trigger",
      subtitle:
        "Toggle ON to request an immediate reindex. The plugin resets this after running. Use the “Skip Previously Indexed Files” option below to control whether unchanged files are skipped.",
    },
    false,
  )
  .field(
    "manualReindex.skipPreviouslyIndexed",
    "boolean",
    {
      displayName: "Skip Previously Indexed Files",
      subtitle: "Skip unchanged files for faster manual runs. Only indexes new files or changed files.",
      dependencies: [
        {
          key: "manualReindex.trigger",
          condition: { type: "equals", value: true },
        },
      ],
    },
    true,
  )
  .field(
    "promptTemplate",
    "string",
    {
      displayName: "Prompt Template",
      subtitle:
        "Supports {{rag_context}} (required) and {{user_query}} macros for customizing the final prompt.",
      placeholder: DEFAULT_PROMPT_TEMPLATE,
      isParagraph: true,
    },
    DEFAULT_PROMPT_TEMPLATE,
  )
  .field(
    "embeddingParallelization.modelCount",
    "numeric",
    {
      int: true,
      min: 1,
      max: 8,
      displayName: "Number of Embedding Models",
      subtitle: "How many instances of the embedding model to load. 1 = single model, 2-8 = multi-model parallelization. More = faster but uses more VRAM (each instance uses ~300MB).",
      slider: { min: 1, max: 8, step: 1 },
    },
    1,
  )
  .field(
    "embeddingParallelization.batchSize",
    "numeric",
    {
      int: true,
      min: 10,
      max: 500,
      displayName: "Batch Size",
      subtitle: "Number of chunks per embedding API call. Larger = more efficient but uses more memory. Default: 100. For large-batch mode, use 300-500.",
      slider: { min: 10, max: 500, step: 10 },
    },
    100,
  )
  .field(
    "embeddingParallelization.concurrency",
    "numeric",
    {
      int: true,
      min: 1,
      max: 20,
      displayName: "Concurrent Batches",
      subtitle: "Number of simultaneous embedding requests. Higher = faster but more network/memory pressure. Default: 5.",
      slider: { min: 1, max: 20, step: 1 },
    },
    5,
  )
  .build();

