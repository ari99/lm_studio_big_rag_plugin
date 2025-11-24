let indexingInProgress = false;

/**
 * Attempt to acquire the shared indexing lock.
 * Returns true if no other indexing job is running.
 */
export function tryStartIndexing(context: string = "unknown"): boolean {
  if (indexingInProgress) {
    console.debug(`[BigRAG] tryStartIndexing (${context}) failed: lock already held`);
    return false;
  }

  indexingInProgress = true;
  console.debug(`[BigRAG] tryStartIndexing (${context}) succeeded`);
  return true;
}

/**
 * Release the shared indexing lock.
 */
export function finishIndexing(): void {
  indexingInProgress = false;
  console.debug("[BigRAG] finishIndexing: lock released");
}

/**
 * Indicates whether an indexing job is currently running.
 */
export function isIndexing(): boolean {
  return indexingInProgress;
}

