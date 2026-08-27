"use client"

import { useEffect, useState } from "react"

interface McpStats {
  tools: number
}

/**
 * Cross-origin on purpose. The one Mzizi MCP lives on its own host; this is its
 * only unauthenticated view, and it is CORS-open for this reader.
 */
const CATALOGUE_URL = "https://mcp.mzizi.dev/catalogue.json"

/**
 * Live-fetches the MCP server's registered tool count. Never hardcoded — the
 * source of truth is the running server, so this component cannot drift.
 *
 * It used to POST `tools/list` at this app's own `/mcp`. That route is now a
 * 308 to `mcp.mzizi.dev/mcp`, which is behind WorkOS AuthKit and answers 401 to
 * an anonymous `tools/list` — correctly. So the read moved to
 * `mcp.mzizi.dev/catalogue.json`, published for exactly this: it NAMES the
 * tools and cannot call one, which is all a landing page ever needed.
 *
 * The resource formats are gone with it. The catalogue does not enumerate
 * resource URIs — an unauthenticated caller has no business doing that — and
 * nothing rendered them; keeping the variants would have meant printing a
 * confident `0`, and a wrong number is worse than an absent one.
 *
 * Usage:
 *   <LiveMcpStats />                       → "<N> tools"
 *   <LiveMcpStats format="tools" />        → "<N> tools"
 *   <LiveMcpStats format="tools-only" />   → "<N>"
 *   <LiveMcpStats className="..." />
 */
export function LiveMcpStats({
  format = "full",
  className,
}: {
  format?: "full" | "tools" | "tools-only"
  className?: string
}) {
  const [stats, setStats] = useState<McpStats | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    fetch(CATALOGUE_URL, { signal, headers: { Accept: "application/json" } })
      .then((res) => {
        if (!res.ok) throw new Error(`catalogue failed: ${res.status}`)
        return res.json()
      })
      .then((data: { tools?: unknown[] }) => {
        if (signal.aborted) return
        // Only set state when the payload is the shape claimed. A malformed
        // response falling through to `length` on a non-array would render "0
        // tools", which reads as a working server with nothing on it.
        if (!Array.isArray(data.tools)) return
        setStats({ tools: data.tools.length })
      })
      .catch(() => {
        // Graceful degradation — the surrounding prose still makes sense
        // without specific numbers.
      })

    return () => controller.abort()
  }, [])

  if (!stats) {
    return <span className={className}>tools</span>
  }

  switch (format) {
    case "tools":
    case "full":
      return <span className={className}>{stats.tools} tools</span>
    case "tools-only":
      return <span className={className}>{stats.tools}</span>
    default:
      return <span className={className}>{stats.tools} tools</span>
  }
}
