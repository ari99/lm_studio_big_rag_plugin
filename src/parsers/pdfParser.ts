import { type LMStudioClient } from "@lmstudio/sdk";
import * as fs from "fs";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import { PNG } from "pngjs";

const MIN_TEXT_LENGTH = 50;
const OCR_MAX_PAGES = 50;
const OCR_MAX_IMAGES_PER_PAGE = 3;
const OCR_MIN_IMAGE_AREA = 10_000;
const OCR_IMAGE_TIMEOUT_MS = 30_000;

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

interface ExtractedOcrImage {
  buffer: Buffer;
  width: number;
  height: number;
  area: number;
}

export type PdfFailureReason =
  | "pdf.lmstudio-error"
  | "pdf.lmstudio-empty"
  | "pdf.pdfparse-error"
  | "pdf.pdfparse-empty"
  | "pdf.ocr-disabled"
  | "pdf.ocr-error"
  | "pdf.ocr-render-error"
  | "pdf.ocr-empty";

type PdfParseStage = "lmstudio" | "pdf-parse" | "ocr";
class ImageDataTimeoutError extends Error {
  constructor(objId: string) {
    super(`Timed out fetching image data for ${objId}`);
    this.name = "ImageDataTimeoutError";
  }
}

interface PdfParserSuccess {
  success: true;
  text: string;
  stage: PdfParseStage;
}

export interface PdfParserFailure {
  success: false;
  reason: PdfFailureReason;
  details?: string;
}

export type PdfParserResult = PdfParserSuccess | PdfParserFailure;

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

type StageResult = PdfParserSuccess | PdfParserFailure;

let cachedPdfjsLib: PdfJsModule | null = null;

async function getPdfjsLib() {
  if (!cachedPdfjsLib) {
    cachedPdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return cachedPdfjsLib;
}

async function tryLmStudioParser(filePath: string, client: LMStudioClient): Promise<StageResult> {
  const maxRetries = 2;
  const fileName = filePath.split("/").pop() || filePath;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const fileHandle = await client.files.prepareFile(filePath);
      const result = await client.files.parseDocument(fileHandle, {
        onProgress: (progress) => {
          if (progress === 0 || progress === 1) {
            console.log(
              `[PDF Parser] (LM Studio) Processing ${fileName}: ${(progress * 100).toFixed(0)}%`,
            );
          }
        },
      });

      const cleaned = cleanText(result.content);
      if (cleaned.length >= MIN_TEXT_LENGTH) {
        return {
          success: true,
          text: cleaned,
          stage: "lmstudio",
        };
      }

      console.log(
        `[PDF Parser] (LM Studio) Parsed but got very little text from ${fileName} (length=${cleaned.length}), will try fallbacks`,
      );
      return {
        success: false,
        reason: "pdf.lmstudio-empty",
        details: `length=${cleaned.length}`,
      };
    } catch (error) {
      const isWebSocketError =
        error instanceof Error &&
        (error.message.includes("WebSocket") || error.message.includes("connection closed"));

      if (isWebSocketError && attempt < maxRetries) {
        console.warn(
          `[PDF Parser] (LM Studio) WebSocket error on ${fileName}, retrying (${attempt}/${maxRetries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      console.error(`[PDF Parser] (LM Studio) Error parsing PDF file ${filePath}:`, error);
      return {
        success: false,
        reason: "pdf.lmstudio-error",
        details: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    success: false,
    reason: "pdf.lmstudio-error",
    details: "Exceeded retry attempts",
  };
}

async function tryPdfParse(filePath: string): Promise<StageResult> {
  const fileName = filePath.split("/").pop() || filePath;
  try {
    const buffer = await fs.promises.readFile(filePath);
    const result = await pdfParse(buffer);
    const cleaned = cleanText(result.text || "");

    if (cleaned.length >= MIN_TEXT_LENGTH) {
      console.log(`[PDF Parser] (pdf-parse) Successfully extracted text from ${fileName}`);
      return {
        success: true,
        text: cleaned,
        stage: "pdf-parse",
      };
    }

    console.log(
      `[PDF Parser] (pdf-parse) Very little or no text extracted from ${fileName} (length=${cleaned.length})`,
    );
    return {
      success: false,
      reason: "pdf.pdfparse-empty",
      details: `length=${cleaned.length}`,
    };
  } catch (error) {
    console.error(`[PDF Parser] (pdf-parse) Error parsing PDF file ${filePath}:`, error);
    return {
      success: false,
      reason: "pdf.pdfparse-error",
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

async function tryOcrWithPdfJs(filePath: string): Promise<StageResult> {
  const fileName = filePath.split("/").pop() || filePath;

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  try {
    const pdfjsLib = await getPdfjsLib();
    const data = new Uint8Array(await fs.promises.readFile(filePath));
    const pdfDocument = await pdfjsLib
      .getDocument({ data, verbosity: pdfjsLib.VerbosityLevel.ERRORS })
      .promise;

    const numPages = pdfDocument.numPages;
    const maxPages = Math.min(numPages, OCR_MAX_PAGES);

    console.log(
      `[PDF Parser] (OCR) Starting OCR for ${fileName} - pages 1 to ${maxPages} (of ${numPages})`,
    );

    worker = await createWorker("eng");
    const textParts: string[] = [];
    let renderErrors = 0;
    let processedImages = 0;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      let page;
      try {
        page = await pdfDocument.getPage(pageNum);
        const images = await extractImagesForPage(pdfjsLib, page);
        if (images.length === 0) {
          console.log(
            `[PDF Parser] (OCR) ${fileName} - page ${pageNum} contains no extractable images, skipping`,
          );
          continue;
        }

        const selectedImages = images.slice(0, OCR_MAX_IMAGES_PER_PAGE);
        for (const image of selectedImages) {
          const {
            data: { text },
          } = await worker.recognize(image.buffer);
          processedImages++;
          const cleaned = cleanText(text || "");
          if (cleaned.length > 0) {
            textParts.push(cleaned);
          }
        }

        if (pageNum === 1 || pageNum % 10 === 0 || pageNum === maxPages) {
          console.log(
            `[PDF Parser] (OCR) ${fileName} - processed page ${pageNum}/${maxPages} (images=${processedImages}, chars=${textParts.join(
              "\n\n",
            ).length})`,
          );
        }
      } catch (pageError) {
        if (pageError instanceof ImageDataTimeoutError) {
          console.error(
            `[PDF Parser] (OCR) Aborting OCR for ${fileName}: ${pageError.message}`,
          );
          await worker.terminate();
          worker = null;
          return {
            success: false,
            reason: "pdf.ocr-error",
            details: pageError.message,
          };
        }
        renderErrors++;
        console.error(
          `[PDF Parser] (OCR) Error processing page ${pageNum} of ${fileName}:`,
          pageError,
        );
      } finally {
        await page?.cleanup();
      }
    }

    await worker.terminate();
    worker = null;

    const fullText = cleanText(textParts.join("\n\n"));
    console.log(
      `[PDF Parser] (OCR) Completed OCR for ${fileName}, extracted ${fullText.length} characters`,
    );

    if (fullText.length >= MIN_TEXT_LENGTH) {
      return {
        success: true,
        text: fullText,
        stage: "ocr",
      };
    }

    if (renderErrors > 0) {
      return {
        success: false,
        reason: "pdf.ocr-render-error",
        details: `${renderErrors} page render errors`,
      };
    }

    return {
      success: false,
      reason: "pdf.ocr-empty",
      details: "OCR produced insufficient text",
    };
  } catch (error) {
    console.error(`[PDF Parser] (OCR) Error during OCR for ${fileName}:`, error);
    return {
      success: false,
      reason: "pdf.ocr-error",
      details: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

async function extractImagesForPage(pdfjsLib: PdfJsModule, page: any): Promise<ExtractedOcrImage[]> {
  const operatorList = await page.getOperatorList();
  const images: ExtractedOcrImage[] = [];
  const imageDataCache = new Map<string, Promise<any | null>>();

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];

    try {
      if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintImageXObjectRepeat) {
        const objId = args?.[0];
        if (typeof objId !== "string") {
          continue;
        }
        let imgData;
        try {
          imgData = await resolveImageData(page, objId, imageDataCache);
        } catch (error) {
          if (error instanceof ImageDataTimeoutError) {
            throw error;
          }
          console.warn("[PDF Parser] (OCR) Failed to resolve image data:", error);
          continue;
        }
        if (!imgData) {
          continue;
        }
        const converted = convertImageDataToPng(pdfjsLib, imgData);
        if (converted) {
          images.push(converted);
        }
      } else if (fn === pdfjsLib.OPS.paintInlineImageXObject && args?.[0]) {
        const converted = convertImageDataToPng(pdfjsLib, args[0]);
        if (converted) {
          images.push(converted);
        }
      }
    } catch (error) {
      if (error instanceof ImageDataTimeoutError) {
        throw error;
      }
      console.warn("[PDF Parser] (OCR) Failed to extract inline image:", error);
    }
  }

  return images
    .filter((image) => image.area >= OCR_MIN_IMAGE_AREA)
    .sort((a, b) => b.area - a.area);
}

async function resolveImageData(
  page: any,
  objId: string,
  cache: Map<string, Promise<any | null>>,
): Promise<any | null> {
  if (cache.has(objId)) {
    return cache.get(objId)!;
  }

  const promise = (async () => {
    try {
      if (typeof page.objs.has === "function" && page.objs.has(objId)) {
        return page.objs.get(objId);
      }
    } catch {
      // fall through to async path
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let timeoutHandle: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
      };

      const handleData = (data: any) => {
        settled = true;
        cleanup();
        resolve(data);
      };

      try {
        page.objs.get(objId, handleData);
      } catch (error) {
        settled = true;
        cleanup();
        reject(error);
        return;
      }

      if (Number.isFinite(OCR_IMAGE_TIMEOUT_MS) && OCR_IMAGE_TIMEOUT_MS > 0) {
        timeoutHandle = setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new ImageDataTimeoutError(objId));
          }
        }, OCR_IMAGE_TIMEOUT_MS);
      }
    });
  })();

  cache.set(objId, promise);
  return promise;
}

function convertImageDataToPng(
  pdfjsLib: PdfJsModule,
  imgData: any,
): ExtractedOcrImage | null {
  if (!imgData || typeof imgData.width !== "number" || typeof imgData.height !== "number") {
    return null;
  }

  const { width, height, kind, data } = imgData;
  if (!data) {
    return null;
  }

  const png = new PNG({ width, height });
  const dest = png.data;

  if (kind === pdfjsLib.ImageKind.RGBA_32BPP && data.length === width * height * 4) {
    dest.set(Buffer.from(data));
  } else if (kind === pdfjsLib.ImageKind.RGB_24BPP && data.length === width * height * 3) {
    const src = data as Uint8Array;
    for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
      dest[j] = src[i];
      dest[j + 1] = src[i + 1];
      dest[j + 2] = src[i + 2];
      dest[j + 3] = 255;
    }
  } else if (kind === pdfjsLib.ImageKind.GRAYSCALE_1BPP) {
    let pixelIndex = 0;
    const totalPixels = width * height;
    for (let byteIndex = 0; byteIndex < data.length && pixelIndex < totalPixels; byteIndex++) {
      const byte = data[byteIndex];
      for (let bit = 7; bit >= 0 && pixelIndex < totalPixels; bit--) {
        const value = (byte >> bit) & 1 ? 255 : 0;
        const destIndex = pixelIndex * 4;
        dest[destIndex] = value;
        dest[destIndex + 1] = value;
        dest[destIndex + 2] = value;
        dest[destIndex + 3] = 255;
        pixelIndex++;
      }
    }
  } else {
    return null;
  }

  return {
    buffer: PNG.sync.write(png),
    width,
    height,
    area: width * height,
  };
}

/**
 * Parse PDF files with a multi-stage strategy:
 * 1. Use LM Studio's built-in document parser (fast, server-side, may include OCR)
 * 2. Fallback to local pdf-parse for text-based PDFs
 * 3. If still no text and OCR is enabled, fallback to PDF.js + Tesseract OCR
 */
export async function parsePDF(
  filePath: string,
  client: LMStudioClient,
  enableOCR: boolean,
): Promise<PdfParserResult> {
  const fileName = filePath.split("/").pop() || filePath;

  // 1) LM Studio parser
  const lmStudioResult = await tryLmStudioParser(filePath, client);
  if (lmStudioResult.success) {
    return lmStudioResult;
  }
  let lastFailure: PdfParserFailure = lmStudioResult;

  // 2) Local pdf-parse fallback
  const pdfParseResult = await tryPdfParse(filePath);
  if (pdfParseResult.success) {
    return pdfParseResult;
  }
  lastFailure = pdfParseResult;

  // 3) OCR fallback (only if enabled)
  if (!enableOCR) {
    console.log(
      `[PDF Parser] (OCR) Enable OCR is off, skipping OCR fallback for ${fileName} after other methods returned no text`,
    );
    return {
      success: false,
      reason: "pdf.ocr-disabled",
      details: `Previous failure reason: ${lastFailure.reason}`,
    };
  }

  console.log(
    `[PDF Parser] (OCR) No text extracted from ${fileName} with LM Studio or pdf-parse, attempting OCR...`,
  );

  const ocrResult = await tryOcrWithPdfJs(filePath);
  if (ocrResult.success) {
    return ocrResult;
  }

  return ocrResult;
}

