import * as path from "path";
import { parseHTML } from "./htmlParser";
import { parsePDF, type PdfFailureReason } from "./pdfParser";
import { parseEPUB } from "./epubParser";
import { parseImage } from "./imageParser";
import { parseText } from "./textParser";
import { type LMStudioClient } from "@lmstudio/sdk";
import {
  IMAGE_EXTENSION_SET,
  isHtmlExtension,
  isMarkdownExtension,
  isPlainTextExtension,
  isTextualExtension,
} from "../utils/supportedExtensions";

export interface ParsedDocument {
  text: string;
  metadata: {
    filePath: string;
    fileName: string;
    extension: string;
    parsedAt: Date;
  };
}

export type ParseFailureReason =
  | "unsupported-extension"
  | "pdf.missing-client"
  | PdfFailureReason
  | "epub.empty"
  | "html.empty"
  | "html.error"
  | "text.empty"
  | "text.error"
  | "image.ocr-disabled"
  | "image.empty"
  | "image.error"
  | "parser.unexpected-error";

export type DocumentParseResult =
  | { success: true; document: ParsedDocument }
  | { success: false; reason: ParseFailureReason; details?: string };

/**
 * Parse a document file based on its extension
 */
export async function parseDocument(
  filePath: string,
  enableOCR: boolean = false,
  client?: LMStudioClient,
): Promise<DocumentParseResult> {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);

  const buildSuccess = (text: string): DocumentParseResult => ({
    success: true,
    document: {
      text,
      metadata: {
        filePath,
        fileName,
        extension: ext,
        parsedAt: new Date(),
      },
    },
  });

  try {
    if (isHtmlExtension(ext)) {
      try {
        const text = cleanAndValidate(
          await parseHTML(filePath),
          "html.empty",
          `${fileName} html`,
        );
        return text.success ? buildSuccess(text.value) : text;
      } catch (error) {
        console.error(`[Parser][HTML] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "html.error",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    }

    if (ext === ".pdf") {
      if (!client) {
        console.warn(`[Parser] No LM Studio client available for PDF parsing: ${fileName}`);
        return { success: false, reason: "pdf.missing-client" };
      }
      const pdfResult = await parsePDF(filePath, client, enableOCR);
      if (pdfResult.success) {
        return buildSuccess(pdfResult.text);
      }
      return pdfResult;
    }

    if (ext === ".epub") {
      const text = await parseEPUB(filePath);
      const cleaned = cleanAndValidate(text, "epub.empty", fileName);
      return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
    }

    if (isTextualExtension(ext)) {
      try {
        const text = await parseText(filePath, {
          stripMarkdown: isMarkdownExtension(ext),
          preserveLineBreaks: isPlainTextExtension(ext),
        });
        const cleaned = cleanAndValidate(text, "text.empty", fileName);
        return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
      } catch (error) {
        console.error(`[Parser][Text] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "text.error",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    }

    if (IMAGE_EXTENSION_SET.has(ext)) {
      if (!enableOCR) {
        console.log(`Skipping image file ${filePath} (OCR disabled)`);
        return { success: false, reason: "image.ocr-disabled" };
      }
      try {
        const text = await parseImage(filePath);
        const cleaned = cleanAndValidate(text, "image.empty", fileName);
        return cleaned.success ? buildSuccess(cleaned.value) : cleaned;
      } catch (error) {
        console.error(`[Parser][Image] Error parsing ${filePath}:`, error);
        return {
          success: false,
          reason: "image.error",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    }

    if (ext === ".rar") {
      console.log(`RAR files not yet supported: ${filePath}`);
      return { success: false, reason: "unsupported-extension", details: ".rar" };
    }

    console.log(`Unsupported file type: ${filePath}`);
    return { success: false, reason: "unsupported-extension", details: ext };
  } catch (error) {
    console.error(`Error parsing document ${filePath}:`, error);
    return {
      success: false,
      reason: "parser.unexpected-error",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

type CleanResult =
  | { success: true; value: string }
  | { success: false; reason: ParseFailureReason; details?: string };

function cleanAndValidate(
  text: string,
  emptyReason: ParseFailureReason,
  detailsContext?: string,
): CleanResult {
  const cleaned = text?.trim() ?? "";
  if (cleaned.length === 0) {
    return {
      success: false,
      reason: emptyReason,
      details: detailsContext ? `${detailsContext} trimmed to zero length` : undefined,
    };
  }
  return { success: true, value: cleaned };
}

