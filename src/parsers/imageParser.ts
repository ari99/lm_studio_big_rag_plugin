import { createWorker } from "tesseract.js";

/**
 * Parse image files using OCR (Tesseract)
 */
export async function parseImage(filePath: string): Promise<string> {
  try {
    const worker = await createWorker("eng");
    
    const { data: { text } } = await worker.recognize(filePath);
    
    await worker.terminate();
    
    return text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();
  } catch (error) {
    console.error(`Error parsing image file ${filePath}:`, error);
    return "";
  }
}

