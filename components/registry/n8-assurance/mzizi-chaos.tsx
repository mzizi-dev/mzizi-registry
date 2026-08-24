"use client"

import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CHAOS — N8 assurance (a node on the engineering strand)
   
   Reactive chaos diagnostics. Runs in production.
   Injection mode + Reactive mode.
   ═══════════════════════════════════════════════════════════════ */

// ── Chaos Configuration ─────────────────────────────────────────

// BACKLINKS: Uses data-portal and data-slot attributes to identify components
// during chaos injection. When injecting an error, Fundi reads the data-portal
// attribute to link the failure back to the registry documentation.

export interface ChaosConfig {
  /** Enable chaos injection (default: false in dev, configurable in prod) */
  enabled: boolean
  /** Probability of error injection per render (0-1, default: 0.001 = 0.1%) */
  errorProbability: number
  /** Probability of latency injection per fetch (0-1, default: 0.005 = 0.5%) */
  latencyProbability: number
  /** Maximum injected latency in ms */
  maxLatencyMs: number
  /** Nodes to target (empty = all) */
  targetNodes: number[]
  /** Feature flag key for remote control */
  featureFlag?: string
}

const DEFAULT_CONFIG: ChaosConfig = {
  enabled: false,
  errorProbability: 0.001,
  latencyProbability: 0.005,
  maxLatencyMs: 3000,
  targetNodes: [],
}

// ── Injection Mode ──────────────────────────────────────────────

export function shouldInjectError(config: ChaosConfig = DEFAULT_CONFIG): boolean {
  if (!config.enabled) return false
  return Math.random() < config.errorProbability
}

export function shouldInjectLatency(config: ChaosConfig = DEFAULT_CONFIG): boolean {
  if (!config.enabled) return false
  return Math.random() < config.latencyProbability
}

export function getInjectedLatency(config: ChaosConfig = DEFAULT_CONFIG): number {
  return Math.floor(Math.random() * config.maxLatencyMs)
}

export class ChaosInjectedError extends Error {
  constructor(node: number, component: string) {
    super(`[mzizi:chaos] Injected error in Node ${node} component "${component}"`)
    this.name = "ChaosInjectedError"
  }
}

// ── Reactive Mode — Blast Radius Diagnostics ────────────────────

export interface ProbeResult {
  target: string
  status: "healthy" | "degraded" | "error" | "timeout"
  latencyMs: number
  error?: string
}

export interface DiagnosticReport {
  timestamp: string
  triggerComponent: string
  triggerError: string
  probes: ProbeResult[]
  blastRadius: "isolated" | "partial" | "systemic"
  recommendation: string
}

async function probeEndpoint(
  url: string,
  label: string,
  timeoutMs: number = 5000
): Promise<ProbeResult> {
  const start = performance.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { method: "HEAD", signal: controller.signal })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - start)
    return { target: label, status: res.ok ? "healthy" : "degraded", latencyMs }
  } catch (e) {
    const latencyMs = Math.round(performance.now() - start)
    const isTimeout = (e as Error).name === "AbortError"
    return {
      target: label,
      status: isTimeout ? "timeout" : "error",
      latencyMs,
      error: (e as Error).message,
    }
  }
}

export async function diagnoseBlastRadius(
  triggerComponent: string,
  triggerError: Error,
  endpoints: { url: string; label: string }[] = [
    { url: "/api/health", label: "API" },
    { url: "/api/weather?lat=-17.83&lon=31.05", label: "Weather API" },
  ]
): Promise<DiagnosticReport> {
  const probes = await Promise.all(endpoints.map((e) => probeEndpoint(e.url, e.label)))

  const errorCount = probes.filter((p) => p.status === "error" || p.status === "timeout").length
  const blastRadius: DiagnosticReport["blastRadius"] =
    errorCount === 0 ? "isolated" : errorCount < probes.length / 2 ? "partial" : "systemic"

  const recommendation =
    blastRadius === "isolated"
      ? "Component-level issue. Retry should resolve."
      : blastRadius === "partial"
        ? "Multiple services affected. Check infrastructure."
        : "Systemic outage. Activate incident response."

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    triggerComponent,
    triggerError: triggerError.message,
    probes,
    blastRadius,
    recommendation,
  }

  // Log structured diagnostic report
  console.warn("[mzizi:chaos] Diagnostic report:", JSON.stringify(report, null, 2))
  return report
}

// ── React Integration ───────────────────────────────────────────

const ChaosContext = React.createContext<ChaosConfig>(DEFAULT_CONFIG)

export function ChaosProvider({
  config,
  children,
}: {
  config?: Partial<ChaosConfig>
  children: React.ReactNode
}) {
  const merged = React.useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  return <ChaosContext.Provider value={merged}>{children}</ChaosContext.Provider>
}

export function useChaos(): ChaosConfig {
  return React.useContext(ChaosContext)
}

/**
 * Hook for reactive chaos diagnostics.
 * Call diagnose() when an error boundary catches an error.
 * Returns the latest diagnostic report.
 */
export function useChaosDiagnostics() {
  const [report, setReport] = React.useState<DiagnosticReport | null>(null)
  const [diagnosing, setDiagnosing] = React.useState(false)

  const diagnose = React.useCallback(async (component: string, error: Error) => {
    setDiagnosing(true)
    try {
      const r = await diagnoseBlastRadius(component, error)
      setReport(r)
    } finally {
      setDiagnosing(false)
    }
  }, [])

  return { report, diagnosing, diagnose }
}

// `ChaosConfig`, `ProbeResult` and `DiagnosticReport` are all exported at their
// declarations, so re-listing them here was a TS2484 conflict — this file did
// not compile in any consumer that installed it. Nothing else needs exporting,
// so the whole statement goes.
