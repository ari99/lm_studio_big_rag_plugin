import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";
import type { ProxyConfig } from "./config";

const HOP_BY_HOP_HEADERS: Set<string> = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/** fetch() auto-decompresses; do not forward encoding headers with a decoded body. */
const DECODED_BODY_RESPONSE_HEADERS: Set<string> = new Set([
  "content-encoding",
  "content-length",
]);

function hasAuthorizationHeader(headers: Record<string, string>): boolean {
  return Object.keys(headers).some(
    (headerName: string): boolean => headerName.toLowerCase() === "authorization",
  );
}

export function filterRequestHeaders(
  headers: IncomingHttpHeaders,
  config: ProxyConfig,
): Record<string, string> {
  const filtered: Record<string, string> = {};
  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerValue === undefined) {
      continue;
    }
    const lowerName: string = headerName.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerName)) {
      continue;
    }
    // Always store lowercase so later overrides (content-type, accept, …) replace
    // instead of duplicating mixed-case keys that confuse upstream parsers.
    filtered[lowerName] = Array.isArray(headerValue)
      ? headerValue.join(", ")
      : headerValue;
  }

  if (config.lmApiToken !== undefined && !hasAuthorizationHeader(filtered)) {
    filtered.authorization = `Bearer ${config.lmApiToken}`;
  }

  return filtered;
}

export function filterResponseHeaders(
  headers: Headers,
): Record<string, string> {
  const filtered: Record<string, string> = {};
  headers.forEach((headerValue: string, headerName: string): void => {
    const lowerName: string = headerName.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lowerName)) {
      return;
    }
    if (DECODED_BODY_RESPONSE_HEADERS.has(lowerName)) {
      return;
    }
    filtered[headerName] = headerValue;
  });
  return filtered;
}

export async function readRequestBody(
  request: IncomingMessage,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function passthroughToLmStudio(options: {
  config: ProxyConfig;
  method: string;
  pathWithQuery: string;
  requestHeaders: IncomingHttpHeaders;
  body: Buffer | undefined;
  response: ServerResponse;
}): Promise<void> {
  const upstreamUrl: string = `${options.config.lmStudioBaseUrl}${options.pathWithQuery}`;
  const headers: Record<string, string> = filterRequestHeaders(
    options.requestHeaders,
    options.config,
  );

  const fetchInit: RequestInit = {
    method: options.method,
    headers,
  };
  if (
    options.body !== undefined &&
    options.body.length > 0 &&
    options.method !== "GET" &&
    options.method !== "HEAD"
  ) {
    fetchInit.body = new Uint8Array(options.body);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, fetchInit);
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : String(error);
    options.response.writeHead(502, { "Content-Type": "application/json" });
    options.response.end(
      JSON.stringify({
        error: {
          message: `Upstream LM Studio unreachable: ${message}`,
          type: "proxy_error",
        },
      }),
    );
    return;
  }

  const responseHeaders: Record<string, string> = filterResponseHeaders(
    upstreamResponse.headers,
  );
  options.response.writeHead(upstreamResponse.status, responseHeaders);

  if (upstreamResponse.body === null) {
    options.response.end();
    return;
  }

  const reader = upstreamResponse.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      if (value !== undefined) {
        if (options.response.writableEnded || options.response.destroyed) {
          await reader.cancel().catch((): void => undefined);
          break;
        }
        try {
          options.response.write(Buffer.from(value));
        } catch {
          await reader.cancel().catch((): void => undefined);
          break;
        }
      }
    }
  } finally {
    if (!options.response.writableEnded) {
      options.response.end();
    }
  }
}
