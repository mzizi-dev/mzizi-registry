"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ERROR TRACKER — N8 assurance (a node on the engineering strand)
   Structured error collection + blast radius analysis.
   ═══════════════════════════════════════════════════════════════ */

export interface TrackedError {
  id: string
  message: string
  stack?: string
  componentName?: string
  portalUrl?: string
  node?: number
  miniApp?: string
  url: string
  timestamp: string
  count: number
  firstSeen: string
  lastSeen: string
  /** Components in the same render tree that might be affected */
  blastRadius: string[]
  severity: "low" | "medium" | "high" | "critical"
  resolved: boolean
}

export interface ErrorTrackerConfig {
  /** Max errors to keep in memory */
  maxErrors?: number
  /** Group similar errors (dedup) */
  dedup?: boolean
  /** Auto-resolve after N minutes without recurrence */
  autoResolveMinutes?: number
  onError?: (error: TrackedError) => void
  onCritical?: (error: TrackedError) => void
}

// N9 fundi integration — how a critical error actually reaches the rung.
//
// This block used to point at `@/lib/fundi/nyuchi-fundi-reporter`, which does not
// exist in this repo and never has, so the one instruction here for getting a
// signal out named a file nobody could install.
//
// The sink is `mzizi-otel` (N8): give `onCritical` an exporter and the error
// leaves as an OTLP span that fundi — or any other agent or service that speaks
// OpenTelemetry — can subscribe to. A bespoke reporter would have been readable
// by fundi alone.
//
//   import { exportSpans, otelStatus } from "./mzizi-otel"
//
//   createErrorTracker({
//     onCritical: (e) => exportSpans(
//       [{
//         name: `error ${e.componentName ?? "unknown"}`,
//         startTimeMs: Date.parse(e.firstSeen),
//         endTimeMs: Date.parse(e.lastSeen),
//         attributes: {
//           "mzizi.node": e.node ?? 8,
//           "mzizi.component": e.componentName,
//           "mzizi.blast_radius": e.blastRadius.length,
//           "error.message": e.message,
//         },
//         status: { code: otelStatus.ERROR, message: e.message },
//       }],
//       { serviceName: "my-app" },
//     ),
//   })

class ErrorTrackerCore {
  private errors = new Map<string, TrackedError>()
  private config: Required<ErrorTrackerConfig>

  constructor(config: ErrorTrackerConfig = {}) {
    this.config = {
      maxErrors: config.maxErrors ?? 500,
      dedup: config.dedup ?? true,
      autoResolveMinutes: config.autoResolveMinutes ?? 60,
      onError: config.onError ?? (() => {}),
      onCritical: config.onCritical ?? (() => {}),
    }
  }

  track(error: Error, context?: { componentName?: string; node?: number; miniApp?: string }) {
    const key = this.config.dedup
      ? `${error.message}:${context?.componentName || "unknown"}`
      : Date.now().toString()
    const existing = this.errors.get(key)

    // Find blast radius via DOM backlinks
    const blastRadius = this.findBlastRadius(context?.componentName)

    // Determine severity
    const severity = this.classifySeverity(error, context, blastRadius)

    if (existing) {
      existing.count++
      existing.lastSeen = new Date().toISOString()
      existing.resolved = false
      if (severity === "critical") this.config.onCritical(existing)
      return existing
    }

    const portalEl = context?.componentName
      ? document.querySelector(`[data-slot="${context.componentName}"]`)
      : null

    const tracked: TrackedError = {
      id: key,
      message: error.message,
      stack: error.stack,
      componentName: context?.componentName,
      portalUrl: portalEl?.getAttribute("data-portal") || undefined,
      node: context?.node,
      miniApp: context?.miniApp,
      url: typeof window !== "undefined" ? window.location.pathname : "",
      timestamp: new Date().toISOString(),
      count: 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      blastRadius,
      severity,
      resolved: false,
    }

    this.errors.set(key, tracked)
    this.config.onError(tracked)
    if (severity === "critical") this.config.onCritical(tracked)

    // Evict old errors
    if (this.errors.size > this.config.maxErrors) {
      const oldest = [...this.errors.entries()].sort((a, b) =>
        a[1].lastSeen.localeCompare(b[1].lastSeen)
      )[0]
      if (oldest) this.errors.delete(oldest[0])
    }

    return tracked
  }

  private findBlastRadius(componentName?: string): string[] {
    if (!componentName || typeof document === "undefined") return []
    const el = document.querySelector(`[data-slot="${componentName}"]`)
    if (!el) return []
    const parent = el.closest("[data-slot]")
    const siblings = parent ? parent.querySelectorAll("[data-slot]") : []
    return Array.from(siblings)
      .map((s) => s.getAttribute("data-slot") || "")
      .filter((s) => s && s !== componentName)
  }

  private classifySeverity(
    error: Error,
    ctx?: { node?: number },
    blastRadius?: string[]
  ): TrackedError["severity"] {
    if (ctx?.node === 1 || ctx?.node === 4) return "critical" // Token or safety node failure
    if (ctx?.node === 7) return "high" // Shell failure
    if ((blastRadius?.length || 0) > 10) return "high" // Wide blast radius
    if (error.message.includes("TypeError") || error.message.includes("Cannot read"))
      return "medium"
    return "low"
  }

  getErrors(): TrackedError[] {
    return [...this.errors.values()]
  }
  getUnresolved(): TrackedError[] {
    return [...this.errors.values()].filter((e) => !e.resolved)
  }
  resolve(id: string) {
    const e = this.errors.get(id)
    if (e) e.resolved = true
  }
  clear() {
    this.errors.clear()
  }
}

/** Global error tracker singleton */
let _tracker: ErrorTrackerCore | null = null
export function getErrorTracker(config?: ErrorTrackerConfig): ErrorTrackerCore {
  if (!_tracker) _tracker = new ErrorTrackerCore(config)
  return _tracker
}

/** React hook to access error tracker */
export function useErrorTracker(config?: ErrorTrackerConfig) {
  const tracker = React.useMemo(() => getErrorTracker(config), [])
  return tracker
}
