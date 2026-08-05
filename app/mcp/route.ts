import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createMziziMcpServer } from "@/lib/mcp-server"

/**
 * Mzizi MCP — mzizi.dev/mcp (document-route)
 *
 * Serves the component registry over Streamable HTTP transport, stateless.
 *
 * There is no Supabase context here any more. Components are files in this repo
 * that this app compiles, and `lib/mcp-server.ts` reads them directly — so the
 * per-request anon `SupabaseClient` this route used to mint had nothing left to
 * connect to. Removing it also removes a failure mode: an unreachable database
 * used to make `/mcp` answer 500 before a single tool ran, for a store that only
 * ever served data now sitting on disk beside the code.
 *
 * The legacy relational MCP is retired (the `legacy` branch was dropped);
 * `design.nyuchi.com` now 308-redirects to `mzizi.dev`.
 *
 *   POST /mcp    — JSON-RPC (initialize, tool calls, resource reads)
 *   GET  /mcp    — SSE stream for server-initiated notifications
 *   DELETE /mcp  — Session cleanup
 *   OPTIONS /mcp — CORS preflight
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version, MCP-Session-Id, apikey",
}

function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  })
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function handle(request: Request): Promise<Response> {
  const transport = createTransport()
  const server = await createMziziMcpServer()
  await server.connect(transport)
  const response = await transport.handleRequest(request)
  return withCors(response)
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}

export async function DELETE(request: Request) {
  return handle(request)
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
