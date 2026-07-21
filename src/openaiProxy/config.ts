export type ProxyConfig = {
  port: number;
  lmStudioBaseUrl: string;
  lmApiToken: string | undefined;
  pluginId: string;
  allowedTools: string[] | undefined;
  disableIntegrations: boolean;
  storeChat: boolean;
};

function parsePort(rawValue: string | undefined, fallback: number): number {
  if (rawValue === undefined || rawValue.trim() === "") {
    return fallback;
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${rawValue}`);
  }
  return parsed;
}

function parseAllowedTools(rawValue: string | undefined): string[] | undefined {
  if (rawValue === undefined || rawValue.trim() === "") {
    return undefined;
  }
  const tools: string[] = rawValue
    .split(",")
    .map((toolName: string): string => toolName.trim())
    .filter((toolName: string): boolean => toolName.length > 0);
  return tools.length > 0 ? tools : undefined;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  return {
    port: parsePort(env.PORT, 1235),
    lmStudioBaseUrl: (env.LM_STUDIO_BASE_URL ?? "http://127.0.0.1:1234").replace(
      /\/$/,
      "",
    ),
    lmApiToken: env.LM_API_TOKEN?.trim() || undefined,
    pluginId: env.BIG_RAG_PLUGIN_ID?.trim() || "mindstudio/big-rag",
    allowedTools: parseAllowedTools(env.BIG_RAG_ALLOWED_TOOLS),
    disableIntegrations: env.BIG_RAG_DISABLE_INTEGRATIONS === "1",
    storeChat: env.BIG_RAG_STORE_CHAT === "1",
  };
}
