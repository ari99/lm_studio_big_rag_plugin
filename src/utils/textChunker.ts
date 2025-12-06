/**
 * Simple text chunker that splits text into overlapping chunks
 */
export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
): Array<{ text: string; startIndex: number; endIndex: number }> {
  const chunks: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  
  // Simple word-based chunking
  const words = text.split(/\s+/);
  
  if (words.length === 0) {
    return chunks;
  }
  
  let startIdx = 0;
  
  while (startIdx < words.length) {
    const endIdx = Math.min(startIdx + chunkSize, words.length);
    const chunkWords = words.slice(startIdx, endIdx);
    const chunkText = chunkWords.join(" ");
    
    chunks.push({
      text: chunkText,
      startIndex: startIdx,
      endIndex: endIdx,
    });
    
    // Move forward by (chunkSize - overlap) to create overlapping chunks
    startIdx += Math.max(1, chunkSize - overlap);
    
    // Break if we've reached the end
    if (endIdx >= words.length) {
      break;
    }
  }
  
  return chunks;
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

