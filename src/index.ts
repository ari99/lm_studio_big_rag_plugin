import { type PluginContext } from "@lmstudio/sdk";
import { configSchematics } from "./config";
import { preprocess } from "./promptPreprocessor";
import { provideTools } from "./toolsProvider";

/**
 * Main entry point for the Big RAG plugin.
 * This plugin indexes large document collections and provides RAG capabilities.
 */
export async function main(context: PluginContext) {
  context.withConfigSchematics(configSchematics);
  
  // Register the prompt preprocessor
  context.withPromptPreprocessor(preprocess);

  // Register tools for REST API / agent integrations
  context.withToolsProvider(provideTools);
  
  console.log("[BigRAG] Plugin initialized successfully");
}

