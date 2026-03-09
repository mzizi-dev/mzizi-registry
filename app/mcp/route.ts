import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createMukokoMcpServer } from "@/lib/mcp-server"

/**
 * MCP Endpoint — registry.mukoko.com/mcp
 *
 * Serves the Mukoko Registry MCP server over Streamable HTTP transport.
 * Stateless mode — each request creates a fresh transport/server pair.
 *
 * Supports:
 *   POST /mcp — JSON-RPC messages (initialize, tool calls, resource reads)
 *   GET  /mcp — SSE stream for server-initiated notifications
 *   DELETE /mcp — Session cleanup
 */

function createTransport() {
  return new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  })
}

export async function POST(request: Request) {
  const transport = createTransport()
  const server = createMukokoMcpServer()

  await server.connect(transport)

  const response = await transport.handleRequest(request)

  return response
}

export async function GET(request: Request) {
  const transport = createTransport()
  const server = createMukokoMcpServer()

  await server.connect(transport)

  return transport.handleRequest(request)
}

export async function DELETE(request: Request) {
  const transport = createTransport()
  const server = createMukokoMcpServer()

  await server.connect(transport)

  return transport.handleRequest(request)
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version, MCP-Session-Id",
    },
  })
}
