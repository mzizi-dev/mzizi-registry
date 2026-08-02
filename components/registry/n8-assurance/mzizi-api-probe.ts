"use client"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI API PROBE — N8 assurance (a node on the engineering strand)
   Health checks across all component API endpoints.
   ═══════════════════════════════════════════════════════════════ */

export type EndpointStatus = "healthy" | "degraded" | "down" | "timeout" | "unknown"

export interface EndpointCheck {
  url: string
  componentName: string
  node: number
  status: EndpointStatus
  statusCode?: number
  latencyMs: number
  timestamp: string
  error?: string
}

export interface ApiProbeConfig {
  /** Base URL of the design portal */
  baseUrl?: string
  /** Timeout per request in ms */
  timeout?: number
  /** Endpoints to check (if empty, discovers from component_backlinks) */
  endpoints?: { url: string; componentName: string; node: number }[]
  onCheck?: (check: EndpointCheck) => void
  onComplete?: (checks: EndpointCheck[]) => void
}

// BACKLINKS: In production, endpoints are discovered from the component_backlinks
// DB view rather than hardcoded. Query: SELECT name, health_endpoint FROM component_backlinks

export async function runApiProbe(config: ApiProbeConfig = {}): Promise<EndpointCheck[]> {
  const { baseUrl = "https://mzizi.dev", timeout = 5000 } = config
  const checks: EndpointCheck[] = []

  const endpoints = config.endpoints || [
    { url: `${baseUrl}/api/health/nyuchi-tokens`, componentName: "nyuchi-tokens", node: 1 },
    { url: `${baseUrl}/api/health/nyuchi-section`, componentName: "nyuchi-section", node: 5 },
    {
      url: `${baseUrl}/api/health/nyuchi-wallet-gate`,
      componentName: "nyuchi-wallet-gate",
      node: 4,
    },
    { url: `${baseUrl}/api/health/wallet-page`, componentName: "wallet-page", node: 6 },
  ]

  for (const ep of endpoints) {
    const start = performance.now()
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeout)
      const res = await fetch(ep.url, { method: "HEAD", signal: controller.signal })
      clearTimeout(timer)
      const latencyMs = performance.now() - start

      const check: EndpointCheck = {
        url: ep.url,
        componentName: ep.componentName,
        node: ep.node,
        status: res.ok ? (latencyMs > 2000 ? "degraded" : "healthy") : "down",
        statusCode: res.status,
        latencyMs,
        timestamp: new Date().toISOString(),
      }
      checks.push(check)
      config.onCheck?.(check)
    } catch (err) {
      const check: EndpointCheck = {
        url: ep.url,
        componentName: ep.componentName,
        node: ep.node,
        status: String(err).includes("abort") ? "timeout" : "down",
        latencyMs: performance.now() - start,
        timestamp: new Date().toISOString(),
        error: String(err),
      }
      checks.push(check)
      config.onCheck?.(check)
    }
  }

  config.onComplete?.(checks)
  return checks
}
