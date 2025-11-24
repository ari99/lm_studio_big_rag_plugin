import * as cheerio from "cheerio";
import * as fs from "fs";

/**
 * Parse HTML/HTM files and extract text content
 */
export async function parseHTML(filePath: string): Promise<string> {
  try {
    const content = await fs.promises.readFile(filePath, "utf-8");
    const $ = cheerio.load(content);
    
    // Remove script and style elements
    $("script, style, noscript").remove();
    
    // Extract text
    const text = $("body").text() || $.text();
    
    // Clean up whitespace
    return text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, "\n")
      .trim();
  } catch (error) {
    console.error(`Error parsing HTML file ${filePath}:`, error);
    return "";
  }
}

