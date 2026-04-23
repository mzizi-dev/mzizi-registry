"use client"

import { useEffect, useState } from "react"

interface McpStats {
  tools: number
  resources: number
}

/**
 * Live-fetches the MCP server's registered tool + resource counts via
 * JSON-RPC. Never hardcoded — the source of truth is the running server
 * at /mcp, so this component can never drift from reality.
 *
 * Usage:
 *   <LiveMcpStats />                       → "<N> tools and <M> resources"
 *   <LiveMcpStats format="tools" />        → "<N> tools"
 *   <LiveMcpStats format="tools-only" />   → "<N>"
 *   <LiveMcpStats className="..." />
 */
export function LiveMcpStats({
  format = "full",
  className,
}: {
  format?: "full" | "tools" | "resources" | "tools-only" | "resources-only"
  className?: string
}) {
  const [stats, setStats] = useState<McpStats | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    async function rpc(method: string, id: number) {
      const res = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params: {} }),
        signal,
      })
      if (!res.ok) throw new Error(`MCP ${method} failed: ${res.status}`)
      const data = await res.json()
      return data.result
    }

    Promise.all([rpc("tools/list", 1), rpc("resources/list", 2)])
      .then(([tools, resources]) => {
        if (signal.aborted) return
        setStats({
          tools: Array.isArray(tools?.tools) ? tools.tools.length : 0,
          resources: Array.isArray(resources?.resources) ? resources.resources.length : 0,
        })
      })
      .catch(() => {
        // Graceful degradation — the surrounding prose still makes sense
        // without specific numbers.
      })

    return () => controller.abort()
  }, [])

  if (!stats) {
    return <span className={className}>tools and resources</span>
  }

  switch (format) {
    case "tools":
      return <span className={className}>{stats.tools} tools</span>
    case "resources":
      return <span className={className}>{stats.resources} resources</span>
    case "tools-only":
      return <span className={className}>{stats.tools}</span>
    case "resources-only":
      return <span className={className}>{stats.resources}</span>
    case "full":
    default:
      return (
        <span className={className}>
          {stats.tools} tools and {stats.resources} resources
        </span>
      )
  }
}
