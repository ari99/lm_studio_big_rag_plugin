import { type PluginContext } from "@lmstudio/sdk";
import { configSchematics } from "./config";
import { preprocess } from "./promptPreprocessor";

/**
 * Main entry point for the Big RAG plugin.
 * This plugin indexes large document collections and provides RAG capabilities.
 */
export async function main(context: PluginContext) {
  // Register the configuration schematics
  context.withConfigSchematics(configSchematics);
  
  // Register the prompt preprocessor
  context.withPromptPreprocessor(preprocess);
  
  console.log("[BigRAG] Plugin initialized successfully");
}

