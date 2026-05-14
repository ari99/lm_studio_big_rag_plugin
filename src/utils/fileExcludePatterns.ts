import { minimatch } from "minimatch";

const MINIMATCH_OPTS = {
  dot: true,
  matchBase: true,
  windowsPathsNoEscape: true,
} as const;

/**
 * One glob pattern per line; trim; skip empty and # comments.
 */
export function parseExcludePatternsBlock(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    out.push(line);
  }
  return out;
}

/** Semicolon-separated patterns for env vars (shell-friendly). */
export function parseExcludePatternsFromEnv(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return [];
  }
  return parseExcludePatternsBlock(raw.replace(/;/g, "\n"));
}

/** First matching pattern, or null if none match. */
export function matchExcludePattern(relativePosixPath: string, patterns: string[]): string | null {
  for (const p of patterns) {
    if (minimatch(relativePosixPath, p, MINIMATCH_OPTS)) {
      return p;
    }
  }
  return null;
}

export function isRelativePathExcluded(relativePosixPath: string, patterns: string[]): boolean {
  return matchExcludePattern(relativePosixPath, patterns) !== null;
}
