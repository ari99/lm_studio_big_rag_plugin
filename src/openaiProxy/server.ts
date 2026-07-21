import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { handleChatCompletions } from "./chatCompletions";
import { loadConfig, type ProxyConfig } from "./config";
import { passthroughToLmStudio, readRequestBody } from "./passthrough";

function getPathWithQuery(requestUrl: string | undefined): string {
  if (requestUrl === undefined || requestUrl.length === 0) {
    return "/";
  }
  return requestUrl;
}

function getPathname(pathWithQuery: string): string {
  const questionIndex: number = pathWithQuery.indexOf("?");
  if (questionIndex === -1) {
    return pathWithQuery;
  }
  return pathWithQuery.slice(0, questionIndex);
}

async function handleRequest(
  config: ProxyConfig,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const method: string = (request.method ?? "GET").toUpperCase();
  const pathWithQuery: string = getPathWithQuery(request.url);
  const pathname: string = getPathname(pathWithQuery);

  if (method === "GET" && pathname === "/health") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        status: "ok",
        lmStudioBaseUrl: config.lmStudioBaseUrl,
        pluginId: config.pluginId,
        disableIntegrations: config.disableIntegrations,
      }),
    );
    return;
  }

  if (method === "POST" && pathname === "/v1/chat/completions") {
    await handleChatCompletions({
      config,
      request,
      response,
      pathWithQuery,
    });
    return;
  }

  if (pathname.startsWith("/v1/") || pathname === "/v1") {
    const body: Buffer | undefined =
      method === "GET" || method === "HEAD"
        ? undefined
        : await readRequestBody(request);
    await passthroughToLmStudio({
      config,
      method,
      pathWithQuery,
      requestHeaders: request.headers,
      body,
      response,
    });
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(
    JSON.stringify({
      error: {
        message: `No route for ${method} ${pathname}`,
        type: "invalid_request_error",
      },
    }),
  );
}

export function startServer(config: ProxyConfig = loadConfig()): void {
  const server = createServer(
    (request: IncomingMessage, response: ServerResponse): void => {
      handleRequest(config, request, response).catch(
        (error: unknown): void => {
          const message: string =
            error instanceof Error ? error.message : String(error);
          if (response.headersSent) {
            // Avoid corrupting an in-flight SSE/JSON body with a second payload.
            if (!response.writableEnded) {
              response.end();
            }
            return;
          }
          response.writeHead(500, { "Content-Type": "application/json" });
          response.end(
            JSON.stringify({
              error: {
                message,
                type: "proxy_error",
              },
            }),
          );
        },
      );
    },
  );

  server.on("error", (error: NodeJS.ErrnoException): void => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${config.port} is already in use. Set PORT=... or stop the other process.`,
      );
      process.exit(1);
    }
    console.error(error);
    process.exit(1);
  });

  server.listen(config.port, (): void => {
    console.log(
      `big-rag OpenAI proxy listening on http://127.0.0.1:${config.port}`,
    );
    console.log(`Upstream LM Studio: ${config.lmStudioBaseUrl}`);
    console.log(
      `Chat completions → /api/v1/chat + plugin ${config.pluginId}` +
        (config.disableIntegrations ? " (integrations disabled)" : ""),
    );
  });
}

if (require.main === module) {
  try {
    startServer();
  } catch (error: unknown) {
    const message: string =
      error instanceof Error ? error.message : String(error);
    console.error(`Failed to start OpenAI proxy: ${message}`);
    process.exit(1);
  }
}
