import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  type ConfigSchematics,
  type InferParsedConfig,
  type ParsedConfig,
  type VirtualConfigSchematics,
} from "@lmstudio/sdk";
import { configSchematics, DEFAULT_EMBEDDING_MODEL_ID, resolveEmbeddingModelId } from "../config";

export const BIG_RAG_TOOLS_CONFIG_FILENAME = "big-rag-tools-config.json";

export type BigRagPluginConfig = InferParsedConfig<typeof configSchematics>;

/** Controllers that expose per-chat plugin configuration. */
export interface PluginConfigAccess {
  getPluginConfig<TVirtualConfigSchematics extends VirtualConfigSchematics>(
    configSchematics: ConfigSchematics<TVirtualConfigSchematics>,
  ): ParsedConfig<TVirtualConfigSchematics>;
}

export function pickNonEmptyString(
  primary: string | undefined | null,
  fallback: string | undefined | null,
): string {
  const trimmedPrimary = (primary ?? "").trim();
  if (trimmedPrimary !== "") {
    return trimmedPrimary;
  }
  return (fallback ?? "").trim();
}

export interface ToolsPluginSettings {
  documentsDirectory: string;
  vectorStoreDirectory: string;
  embeddingModel: string;
  retrievalLimit: number;
  retrievalAffinityThreshold: number;
}

const DEFAULT_RETRIEVAL_LIMIT = 5;
const DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD = 0.5;

interface ToolsConfigReader {
  get(key: string): unknown;
}

function chatPathsConfigured(chatConfig: ToolsConfigReader): boolean {
  return (
    pickNonEmptyString(chatConfig.get("documentsDirectory") as string, "") !== "" &&
    pickNonEmptyString(chatConfig.get("vectorStoreDirectory") as string, "") !== ""
  );
}

/**
 * Prefer a custom synced embedding over the chat schematic default so REST-only
 * custom models are not clobbered on the first chat message.
 */
export function mergeEmbeddingModelPreference(
  chatEmbedding: string | undefined | null,
  syncedEmbedding: string | undefined | null,
): string {
  const chatResolved: string = resolveEmbeddingModelId(chatEmbedding);
  const syncedTrimmed: string = (syncedEmbedding ?? "").trim();
  if (
    syncedTrimmed !== "" &&
    resolveEmbeddingModelId(syncedTrimmed) !== DEFAULT_EMBEDDING_MODEL_ID &&
    chatResolved === DEFAULT_EMBEDDING_MODEL_ID
  ) {
    return resolveEmbeddingModelId(syncedTrimmed);
  }
  return chatResolved;
}

function pickFirstNonEmptyString(
  ...values: Array<string | undefined | null>
): string {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed !== "") {
      return trimmed;
    }
  }
  return "";
}

function pickNumericSetting(
  ...values: Array<number | undefined | null>
): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return DEFAULT_RETRIEVAL_LIMIT;
}

function pickThresholdSetting(
  ...values: Array<number | undefined | null>
): number {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD;
}

export function resolveBigRagToolsConfigPath(): string {
  return join(homedir(), ".lmstudio", BIG_RAG_TOOLS_CONFIG_FILENAME);
}

/** Read tools-relevant fields from the single chat config form. */
export function extractToolsSettingsFromChatConfig(
  chatConfig: BigRagPluginConfig,
): ToolsPluginSettings {
  return {
    documentsDirectory: pickNonEmptyString(chatConfig.get("documentsDirectory"), ""),
    vectorStoreDirectory: pickNonEmptyString(chatConfig.get("vectorStoreDirectory"), ""),
    embeddingModel: resolveEmbeddingModelId(chatConfig.get("embeddingModel")),
    retrievalLimit: chatConfig.get("retrievalLimit") as number,
    retrievalAffinityThreshold: chatConfig.get("retrievalAffinityThreshold") as number,
  };
}

function toolsSettingsEqual(
  left: ToolsPluginSettings,
  right: ToolsPluginSettings,
): boolean {
  return (
    left.documentsDirectory === right.documentsDirectory &&
    left.vectorStoreDirectory === right.vectorStoreDirectory &&
    left.embeddingModel === right.embeddingModel &&
    left.retrievalLimit === right.retrievalLimit &&
    left.retrievalAffinityThreshold === right.retrievalAffinityThreshold
  );
}

/** Optional path overrides for REST/tools when LM Studio has no chat session. */
export interface ToolsConfigFallbackLayer {
  documentsDirectory?: string;
  vectorStoreDirectory?: string;
  embeddingModel?: string;
  retrievalLimit?: number;
  retrievalAffinityThreshold?: number;
}

export function readSyncedToolsSettingsFile(
  configPath?: string,
): ToolsPluginSettings | null {
  const resolvedPath = configPath ?? resolveBigRagToolsConfigPath();
  try {
    const rawContents = readFileSync(resolvedPath, "utf8");
    const parsed = JSON.parse(rawContents) as Partial<ToolsPluginSettings>;
    return {
      documentsDirectory:
        typeof parsed.documentsDirectory === "string" ? parsed.documentsDirectory.trim() : "",
      vectorStoreDirectory:
        typeof parsed.vectorStoreDirectory === "string" ? parsed.vectorStoreDirectory.trim() : "",
      embeddingModel: resolveEmbeddingModelId(parsed.embeddingModel),
      retrievalLimit: pickNumericSetting(parsed.retrievalLimit),
      retrievalAffinityThreshold: pickThresholdSetting(parsed.retrievalAffinityThreshold),
    };
  } catch {
    return null;
  }
}

export function readToolsEnvLayer(
  environment: NodeJS.ProcessEnv = process.env,
): ToolsConfigFallbackLayer {
  const retrievalLimitRaw = environment.BIG_RAG_RETRIEVAL_LIMIT?.trim();
  const retrievalThresholdRaw = environment.BIG_RAG_RETRIEVAL_AFFINITY_THRESHOLD?.trim();
  return {
    documentsDirectory: (environment.BIG_RAG_DOCS_DIR ?? "").trim() || undefined,
    vectorStoreDirectory: (environment.BIG_RAG_DB_DIR ?? "").trim() || undefined,
    embeddingModel: (environment.BIG_RAG_EMBEDDING_MODEL ?? "").trim() || undefined,
    retrievalLimit:
      retrievalLimitRaw !== undefined && retrievalLimitRaw !== ""
        ? Number(retrievalLimitRaw)
        : undefined,
    retrievalAffinityThreshold:
      retrievalThresholdRaw !== undefined && retrievalThresholdRaw !== ""
        ? Number(retrievalThresholdRaw)
        : undefined,
  };
}

function writeSyncedToolsSettingsIfChanged(settings: ToolsPluginSettings): void {
  const configPath = resolveBigRagToolsConfigPath();
  const existingSettings = readSyncedToolsSettingsFile(configPath);
  if (existingSettings !== null && toolsSettingsEqual(settings, existingSettings)) {
    return;
  }
  mkdirSync(dirname(configPath), { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}

/**
 * Copy chat sidebar settings into ~/.lmstudio/big-rag-tools-config.json for REST/curl.
 * Called when chat paths are configured so REST can reuse the same values without a duplicate form.
 */
export function syncChatToolsSettingsForRest(chatConfig: BigRagPluginConfig): void {
  const chatReader: ToolsConfigReader = {
    get: (key: string) => chatConfig.get(key as Parameters<BigRagPluginConfig["get"]>[0]),
  };
  if (!chatPathsConfigured(chatReader)) {
    return;
  }

  const mergedSettings = mergeChatWithSyncedFallback(
    extractToolsSettingsFromChatConfig(chatConfig),
    readSyncedToolsSettingsFile(),
  );
  writeSyncedToolsSettingsIfChanged(mergedSettings);
}

export function mergeToolsPluginSettingsWithFallbacks(
  baseSettings: ToolsPluginSettings,
  ...fallbackLayers: ToolsConfigFallbackLayer[]
): ToolsPluginSettings {
  return {
    documentsDirectory: pickFirstNonEmptyString(
      baseSettings.documentsDirectory,
      ...fallbackLayers.map((layer) => layer.documentsDirectory),
    ),
    vectorStoreDirectory: pickFirstNonEmptyString(
      baseSettings.vectorStoreDirectory,
      ...fallbackLayers.map((layer) => layer.vectorStoreDirectory),
    ),
    embeddingModel: pickFirstNonEmptyString(
      baseSettings.embeddingModel,
      ...fallbackLayers.map((layer) => layer.embeddingModel),
    ),
    retrievalLimit: pickNumericSetting(
      baseSettings.retrievalLimit,
      ...fallbackLayers.map((layer) => layer.retrievalLimit),
    ),
    retrievalAffinityThreshold: pickThresholdSetting(
      baseSettings.retrievalAffinityThreshold,
      ...fallbackLayers.map((layer) => layer.retrievalAffinityThreshold),
    ),
  };
}

const EMPTY_TOOLS_SETTINGS: ToolsPluginSettings = {
  documentsDirectory: "",
  vectorStoreDirectory: "",
  embeddingModel: DEFAULT_EMBEDDING_MODEL_ID,
  retrievalLimit: DEFAULT_RETRIEVAL_LIMIT,
  retrievalAffinityThreshold: DEFAULT_RETRIEVAL_AFFINITY_THRESHOLD,
};

/** Merge chat settings with synced file, filling any empty chat fields from the sync copy. */
function mergeChatWithSyncedFallback(
  chatSettings: ToolsPluginSettings,
  syncedSettings: ToolsPluginSettings | ToolsConfigFallbackLayer | null,
): ToolsPluginSettings {
  const syncedLayer: ToolsConfigFallbackLayer = syncedSettings ?? {};
  return {
    documentsDirectory: pickFirstNonEmptyString(
      chatSettings.documentsDirectory,
      syncedLayer.documentsDirectory,
    ),
    vectorStoreDirectory: pickFirstNonEmptyString(
      chatSettings.vectorStoreDirectory,
      syncedLayer.vectorStoreDirectory,
    ),
    embeddingModel: mergeEmbeddingModelPreference(
      chatSettings.embeddingModel,
      syncedLayer.embeddingModel,
    ),
    retrievalLimit: pickNumericSetting(
      chatSettings.retrievalLimit,
      syncedLayer.retrievalLimit,
    ),
    retrievalAffinityThreshold: pickThresholdSetting(
      chatSettings.retrievalAffinityThreshold,
      syncedLayer.retrievalAffinityThreshold,
    ),
  };
}

/**
 * Settings for REST/tools: uses chat config when a chat session exists; otherwise reads the
 * synced file (written from chat settings) and BIG_RAG_* env vars.
 */
export function readToolsPluginSettings(ctl: PluginConfigAccess): ToolsPluginSettings {
  const chatConfig = ctl.getPluginConfig(configSchematics);
  const chatSettings = extractToolsSettingsFromChatConfig(chatConfig);
  const chatReader: ToolsConfigReader = {
    get: (key: string) => chatSettings[key as keyof ToolsPluginSettings],
  };

  if (chatPathsConfigured(chatReader)) {
    const mergedChatSettings = mergeChatWithSyncedFallback(
      chatSettings,
      readSyncedToolsSettingsFile(),
    );
    writeSyncedToolsSettingsIfChanged(mergedChatSettings);
    return mergedChatSettings;
  }

  const syncedSettings = readSyncedToolsSettingsFile();
  const baseSettings = syncedSettings ?? EMPTY_TOOLS_SETTINGS;

  return mergeToolsPluginSettingsWithFallbacks(
    baseSettings,
    readToolsEnvLayer(),
  );
}

/** @internal Exported for unit tests. */
export function mergeChatAndSyncedFileSettingsForTest(
  chatValues: Record<string, unknown>,
  syncedValues: Record<string, unknown>,
): ToolsPluginSettings {
  const chatReader = {
    get: (key: string) => chatValues[key],
  } as ToolsConfigReader;

  const chatSettings: ToolsPluginSettings = {
    documentsDirectory: pickNonEmptyString(chatValues.documentsDirectory as string, ""),
    vectorStoreDirectory: pickNonEmptyString(chatValues.vectorStoreDirectory as string, ""),
    embeddingModel: resolveEmbeddingModelId(
      typeof chatValues.embeddingModel === "string" ? chatValues.embeddingModel : undefined,
    ),
    retrievalLimit: pickNumericSetting(chatValues.retrievalLimit as number | undefined),
    retrievalAffinityThreshold: pickThresholdSetting(
      chatValues.retrievalAffinityThreshold as number | undefined,
    ),
  };

  if (!chatPathsConfigured(chatReader)) {
    return {
      documentsDirectory: pickNonEmptyString("", syncedValues.documentsDirectory as string),
      vectorStoreDirectory: pickNonEmptyString("", syncedValues.vectorStoreDirectory as string),
      embeddingModel: resolveEmbeddingModelId(
        typeof syncedValues.embeddingModel === "string" ? syncedValues.embeddingModel : undefined,
      ),
      retrievalLimit: pickNumericSetting(
        undefined,
        syncedValues.retrievalLimit as number | undefined,
      ),
      retrievalAffinityThreshold: pickThresholdSetting(
        undefined,
        syncedValues.retrievalAffinityThreshold as number | undefined,
      ),
    };
  }

  return mergeChatWithSyncedFallback(chatSettings, {
    documentsDirectory: syncedValues.documentsDirectory as string,
    vectorStoreDirectory: syncedValues.vectorStoreDirectory as string,
    embeddingModel:
      typeof syncedValues.embeddingModel === "string"
        ? syncedValues.embeddingModel
        : undefined,
    retrievalLimit: pickNumericSetting(syncedValues.retrievalLimit as number | undefined),
    retrievalAffinityThreshold: pickThresholdSetting(
      syncedValues.retrievalAffinityThreshold as number | undefined,
    ),
  });
}
