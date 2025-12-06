// @ts-ignore - epub2 doesn't have complete types
import { EPub } from "epub2";

/**
 * Parse EPUB files and extract text content
 */
export async function parseEPUB(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const epub = new EPub(filePath);
      
      epub.on("error", (error: Error) => {
        console.error(`Error parsing EPUB file ${filePath}:`, error);
        resolve("");
      });
      
      const stripHtml = (input: string) =>
        input.replace(/<[^>]*>/g, " ");

      const getManifestEntry = (chapterId: string) => {
        return (epub as unknown as { manifest?: Record<string, { [key: string]: string }> }).manifest?.[chapterId];
      };

      const decodeMediaType = (entry?: { [key: string]: string }) =>
        entry?.["media-type"] || entry?.mediaType || "";

      const shouldReadRaw = (mediaType: string) => {
        const normalized = mediaType.toLowerCase();
        if (!normalized) {
          return true;
        }

        if (normalized === "application/xhtml+xml" || normalized === "image/svg+xml") {
          return false;
        }

        if (normalized.startsWith("text/")) {
          return true;
        }

        if (normalized.includes("html")) {
          return true;
        }

        return true;
      };

      const readChapter = async (chapterId: string): Promise<string> => {
        const manifestEntry = getManifestEntry(chapterId);
        if (!manifestEntry) {
          console.warn(`EPUB chapter ${chapterId} missing manifest entry in ${filePath}, skipping`);
          return "";
        }

        const mediaType = decodeMediaType(manifestEntry);
        if (shouldReadRaw(mediaType)) {
          return new Promise((res, rej) => {
            epub.getFile(
              chapterId,
              (error: Error | null, data?: Buffer) => {
                if (error) {
                  rej(error);
                } else if (!data) {
                  res("");
                } else {
                  res(stripHtml(data.toString("utf-8")));
                }
              }
            );
          });
        }

        return new Promise((res, rej) => {
          epub.getChapter(
            chapterId,
            (error: Error | null, text?: string) => {
              if (error) {
                rej(error);
              } else if (typeof text === "string") {
                res(stripHtml(text));
              } else {
                res("");
              }
            }
          );
        });
      };

      epub.on("end", async () => {
        try {
          const chapters = epub.flow;
          const textParts: string[] = [];
          
          for (const chapter of chapters) {
            try {
              const chapterId = chapter.id;
              if (!chapterId) {
                console.warn(`EPUB chapter missing id in ${filePath}, skipping`);
                textParts.push("");
                continue;
              }

              const text = await readChapter(chapterId);
              textParts.push(text);
            } catch (chapterError) {
              console.error(`Error reading chapter ${chapter.id}:`, chapterError);
            }
          }
          
          const fullText = textParts.join("\n\n");
          resolve(
            fullText
              .replace(/\s+/g, " ")
              .replace(/\n+/g, "\n")
              .trim()
          );
        } catch (error) {
          console.error(`Error processing EPUB chapters:`, error);
          resolve("");
        }
      });
      
      epub.parse();
    } catch (error) {
      console.error(`Error initializing EPUB parser for ${filePath}:`, error);
      resolve("");
    }
  });
}

