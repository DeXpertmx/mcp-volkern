#!/usr/bin/env node

// SDK v2 (@modelcontextprotocol/server) — implementa la spec MCP 2026-07-28.
// Servidor construido con McpServer + registerTool; los JSON Schemas del
// catálogo se convierten con fromJsonSchema (sin reescribirlos a zod).
// Transportes: stdio (Claude Desktop, Cursor…) y Streamable HTTP stateless
// en /mcp (VS Code, Cline, n8n). El transporte SSE de la spec 2025 fue
// retirado por la spec 2026-07-28.
import {
  McpServer,
  WebStandardStreamableHTTPServerTransport,
  fromJsonSchema,
} from "@modelcontextprotocol/server";
import type { JsonSchemaType } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";
import type { ReadableStream as WebReadableStream } from "stream/web";
import { VOLKERN_TOOLS } from "./tools-catalog.js";

// ============================================
// Configuration
// ============================================
const VOLKERN_API_URL = process.env.VOLKERN_API_URL || "https://volkern.app/api";
const VOLKERN_API_KEY = process.env.VOLKERN_API_KEY || "";
const TRANSPORT = (process.env.TRANSPORT || "stdio").toLowerCase();
const PORT = parseInt(process.env.PORT || "3001", 10);
const VERSION = "2.0.1";

if (!VOLKERN_API_KEY) {
  console.error("Error: VOLKERN_API_KEY environment variable is required");
  process.exit(1);
}

// ============================================
// API Helper
// ============================================
async function volkernRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
): Promise<unknown> {
  const url = `${VOLKERN_API_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${VOLKERN_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Volkern API Error (${response.status}): ${JSON.stringify(errorData)}`
    );
  }

  return response.json();
}

// ============================================
// Ejecución de tools
// ============================================
//
// El standalone NO ejecuta nada por su cuenta: reenvía `tools/call` al
// endpoint MCP de Volkern (`/mcp`) con la API key del usuario.
//
// Antes llamaba a la API REST tool por tool (`/contacts`, `/leads`…). Eso era
// un segundo camino de ejecución que no pasaba por ninguna decisión: la misma
// credencial podía borrar un contacto desde Claude Desktop sin que el gate de
// permisos lo supiera, y sin dejar la misma auditoría que `/mcp`.
//
// Reenviar a `/mcp` hace que herede, sin duplicar nada: identidad derivada de
// la credencial, decisión por herramienta y rol, aprobación con bloqueo de
// fila y registro en AuditLog.

const VOLKERN_MCP_URL =
  process.env.VOLKERN_MCP_URL ||
  `${VOLKERN_API_URL.replace(/\/api\/?$/, "")}/mcp`;

interface McpToolResult {
  // La firma de índice es lo que exige el callback de `registerTool` del SDK
  // v2 (resultado MCP abierto); sin ella el tipo concreto no es asignable.
  [clave: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<McpToolResult> {
  const response = await fetch(VOLKERN_MCP_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VOLKERN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = await response.json().catch(() => null);

  if (response.ok && payload?.result) {
    return payload.result as McpToolResult;
  }

  // 409: hace falta aprobación humana y NO se ha ejecutado nada. Se devuelve
  // como resultado legible en vez de como error de transporte, para que el
  // modelo lo explique en lugar de reintentar en bucle.
  if (response.status === 409) {
    const data = payload?.error?.data ?? {};
    return {
      content: [
        {
          type: "text",
          text:
            "Requiere aprobación de un responsable. No se ha ejecutado nada.\n" +
            `Solicitud: ${data.approvalId ?? "(sin id)"}\n` +
            `Motivo: ${payload?.error?.message ?? "acción sensible"}\n` +
            `Caduca: ${data.expiresAt ?? "(sin fecha)"}\n` +
            "Un responsable debe resolverla en Volkern; reintentar no la ejecuta.",
        },
      ],
    };
  }

  const message =
    payload?.error?.message ?? `Volkern MCP error (${response.status})`;
  return {
    content: [
      {
        type: "text",
        text: `${response.status === 403 ? "Denegado" : "Error"}: ${message}`,
      },
    ],
    isError: true,
  };
}

// ============================================
// Server Setup (SDK v2 — spec MCP 2026-07-28)
// ============================================

/**
 * Crea una instancia del servidor MCP con las 43 tools registradas.
 * Se crea una instancia nueva por conexión/petición (patrón stateless).
 */
function createVolkernServer(): McpServer {
  const server = new McpServer(
    { name: "volkern-mcp-server", version: VERSION },
    { capabilities: { tools: {} } }
  );

  for (const tool of VOLKERN_TOOLS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: fromJsonSchema(tool.inputSchema as unknown as JsonSchemaType),
      },
      async (args: unknown) => {
        const toolArgs = (args ?? {}) as Record<string, unknown>;
        try {
          // El resultado ya viene con la forma MCP ({content, isError}): el
          // endpoint /mcp de Volkern decide, ejecuta y audita.
          return await handleToolCall(tool.name, toolArgs);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{ type: "text" as const, text: `Error: ${errorMessage}` }],
            isError: true,
          };
        }
      }
    );
  }

  return server;
}

// ============================================
// HTTP Transport — Streamable HTTP stateless (spec 2026-07-28)
// ============================================

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = `http://${host}${req.url || "/"}`;
  const method = (req.method || "GET").toUpperCase();

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, value);
  }

  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  let body: BodyInit | undefined;
  if (hasBody) {
    const raw = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    });
    body = new Uint8Array(raw);
  }

  return new Request(url, { method, headers, body });
}

async function writeWebResponse(response: Response, res: ServerResponse): Promise<void> {
  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(response.status, headers);

  if (response.body) {
    const nodeStream = Readable.fromWeb(response.body as unknown as WebReadableStream);
    nodeStream.pipe(res);
    await new Promise<void>((resolve, reject) => {
      nodeStream.on("end", resolve);
      nodeStream.on("error", reject);
      res.on("close", resolve);
    });
  } else {
    res.end();
  }
}

async function startHttpServer(): Promise<void> {
  const httpServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-API-Key, Mcp-Session-Id, Mcp-Protocol-Version"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            server: "volkern-mcp-server",
            version: VERSION,
            transport: "http",
          })
        );
        return;
      }

      // Endpoint MCP Streamable HTTP (stateless: servidor y transporte nuevos
      // por petición; GET/DELETE de sesiones 2025 responden 405 por diseño).
      if (pathname === "/mcp" || pathname === "/") {
        try {
          const transport = new WebStandardStreamableHTTPServerTransport({
            enableJsonResponse: true,
          });
          const server = createVolkernServer();
          await server.connect(transport);
          const response = await transport.handleRequest(await toWebRequest(req));
          await writeWebResponse(response, res);
        } catch (error) {
          console.error("Error handling MCP request:", error);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                jsonrpc: "2.0",
                error: { code: -32603, message: "Internal server error" },
                id: null,
              })
            );
          }
        }
        return;
      }

      res.writeHead(404);
      res.end("Not Found");
    }
  );

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.error("\nShutting down HTTP server...");
    httpServer.close();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    console.error("Shutting down HTTP server...");
    httpServer.close();
    process.exit(0);
  });

  return new Promise<void>((resolve, reject) => {
    httpServer.listen(PORT, () => {
      console.error(
        `Volkern MCP Server (SDK v2, spec 2026-07-28) on Streamable HTTP at http://localhost:${PORT}/mcp`
      );
      resolve();
    });
    httpServer.on("error", reject);
  });
}

// ============================================
// Start server (stdio or HTTP)
// ============================================
async function main() {
  if (TRANSPORT === "http" || TRANSPORT === "sse") {
    if (TRANSPORT === "sse") {
      console.error(
        "TRANSPORT=sse está obsoleto desde la spec 2026-07-28; iniciando Streamable HTTP en /mcp"
      );
    }
    await startHttpServer();
  } else {
    const server = createVolkernServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Volkern MCP Server running on stdio (SDK v2, spec MCP 2026-07-28)");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
