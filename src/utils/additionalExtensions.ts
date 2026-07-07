import { SUPPORTED_EXTENSIONS } from "./supportedExtensions";

export const BLOCKED_BINARY_EXTENSIONS = new Set(
  [
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".zip",
    ".tar",
    ".gz",
    ".tgz",
    ".bz2",
    ".xz",
    ".7z",
    ".rar",
    ".wasm",
    ".bin",
    ".dmg",
    ".iso",
    ".deb",
    ".rpm",
    ".msi",
    ".apk",
    ".ipa",
    ".class",
    ".jar",
    ".war",
    ".ear",
    ".pyc",
    ".pyo",
    ".o",
    ".obj",
    ".a",
    ".lib",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".ico",
    ".webp",
    ".gif",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".mkv",
    ".wav",
    ".flac",
    ".sqlite",
    ".db",
    ".doc",
    ".docx",
    ".ppt",
    ".pptx",
    ".xls",
    ".xlsx",
    ".odt",
    ".ods",
    ".odp",
  ].map((ext) => ext.toLowerCase()),
);

/** Built-in extensions with dedicated non-plain-text parsers (PDF, EPUB, HTML, images, archives). */
export const BUILTIN_NON_PLAINTEXT_EXTENSIONS = new Set(
  [".htm", ".html", ".xhtml", ".pdf", ".epub", ".bmp", ".jpg", ".jpeg", ".png", ".rar"].map(
    (ext) => ext.toLowerCase(),
  ),
);

export interface RejectedExtension {
  ext: string;
  reason: string;
}

export interface ResolvedAdditionalExtensions {
  accepted: string[];
  additionalPlainTextSet: ReadonlySet<string>;
  rejected: RejectedExtension[];
  warnings: string[];
}

export type ExtensionLogFn = (message: string) => void;

/**
 * One extension per line or comma-separated; trim; skip empty and # comments.
 */
export function parseAdditionalExtensionsBlock(text: string): string[] {
  const tokens: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmedLine = rawLine.trim();
    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }
    for (const part of trimmedLine.split(",")) {
      const token = stripInlineComment(part);
      if (token === "") {
        continue;
      }
      tokens.push(token);
    }
  }
  return tokens;
}

/** Strip trailing `# comment` from a single extension token (line comments handled separately). */
function stripInlineComment(token: string): string {
  const hashIndex = token.indexOf("#");
  if (hashIndex === -1) {
    return token.trim();
  }
  return token.slice(0, hashIndex).trim();
}

/** Semicolon-separated extensions for env vars (shell-friendly). */
export function parseAdditionalExtensionsFromEnv(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === "") {
    return [];
  }
  return parseAdditionalExtensionsBlock(raw.replace(/;/g, "\n"));
}

/**
 * Normalize a user extension token. Returns null if invalid (wildcards, empty, etc.).
 */
export function normalizeExtension(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "") {
    return null;
  }
  if (trimmed.includes("*") || trimmed.includes("?")) {
    return null;
  }
  const normalized = trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
  if (normalized.length < 2 || normalized.includes("/") || normalized.includes("\\")) {
    return null;
  }
  return normalized;
}

export function buildEffectiveExtensionSet(
  additionalPlainTextExtensions: ReadonlySet<string> | Iterable<string>,
): Set<string> {
  const effective = new Set(SUPPORTED_EXTENSIONS);
  for (const ext of additionalPlainTextExtensions) {
    effective.add(ext.toLowerCase());
  }
  return effective;
}

export function isAdditionalPlainTextExtension(
  ext: string,
  additionalPlainTextSet: ReadonlySet<string>,
): boolean {
  return additionalPlainTextSet.has(ext.toLowerCase());
}

export function resolveAdditionalExtensions(
  raw: string,
  log?: ExtensionLogFn,
): ResolvedAdditionalExtensions {
  const accepted: string[] = [];
  const rejected: RejectedExtension[] = [];
  const warnings: string[] = [];
  const additionalPlainTextSet = new Set<string>();
  const seen = new Set<string>();

  for (const token of parseAdditionalExtensionsBlock(raw)) {
    const normalized = normalizeExtension(token);
    if (normalized === null) {
      rejected.push({
        ext: token,
        reason: "Invalid extension format (use values like .java; wildcards are not allowed)",
      });
      continue;
    }

    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    if (BLOCKED_BINARY_EXTENSIONS.has(normalized)) {
      rejected.push({
        ext: normalized,
        reason: "Binary or non-plain-text extension is not allowed",
      });
      continue;
    }

    if (SUPPORTED_EXTENSIONS.has(normalized)) {
      if (BUILTIN_NON_PLAINTEXT_EXTENSIONS.has(normalized)) {
        const warning =
          `Extension ${normalized} is already handled by a built-in parser; ignoring additional declaration.`;
        warnings.push(warning);
        log?.(`[BigRAG] ${warning}`);
        continue;
      }
      const warning =
        `Extension ${normalized} is already included in built-in supported types; no need to declare it again.`;
      warnings.push(warning);
      log?.(`[BigRAG] ${warning}`);
      continue;
    }

    accepted.push(normalized);
    additionalPlainTextSet.add(normalized);
  }

  for (const item of rejected) {
    log?.(`[BigRAG] Rejected additional extension ${item.ext}: ${item.reason}`);
  }

  return {
    accepted,
    additionalPlainTextSet,
    rejected,
    warnings,
  };
}
