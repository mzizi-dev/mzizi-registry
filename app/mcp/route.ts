/**
 * `mzizi.dev/mcp` — retired, 308 to `mcp.mzizi.dev/mcp`.
 *
 * There is ONE Mzizi MCP now. This route used to be a second one: the same
 * registry, a smaller tool set, no authentication, served in-process by the
 * portal. Two endpoints over one corpus is two tool catalogues to keep in step,
 * two auth stories to explain, and a silent choice for every client author —
 * and the two had already diverged (four tools here against eleven there).
 *
 * 308 rather than 301 or 302 on purpose: it is the only redirect status that
 * guarantees the method and body survive the hop, so an in-flight JSON-RPC
 * `POST` reaches the real server instead of arriving as a bodyless `GET`. The
 * MCP Streamable HTTP clients in use here follow it on `fetch`.
 *
 * WHAT THIS COSTS, SAID PLAINLY. Anonymous access to the Mzizi registry over
 * MCP ends here. `mcp.mzizi.dev/mcp` sits behind WorkOS AuthKit — a free
 * signup, not a paywall, but a signup where there was none. Anything that
 * needs an unauthenticated read still has `mzizi.dev/api/v1` (open, no key)
 * and `mcp.mzizi.dev/catalogue.json` for the tool list.
 *
 * Keep this route. Deleting it would 404 every client configured against the
 * old URL, which is a worse answer than forwarding them.
 */

const TARGET = "https://mcp.mzizi.dev/mcp"

function redirect(): Response {
  return new Response(null, {
    status: 308,
    headers: {
      Location: TARGET,
      // A client that cannot follow the redirect should still be able to read
      // why, and CORS applies to the redirect response itself.
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

export function POST() {
  return redirect()
}

export function GET() {
  return redirect()
}

export function DELETE() {
  return redirect()
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, MCP-Protocol-Version, MCP-Session-Id, apikey",
    },
  })
}
