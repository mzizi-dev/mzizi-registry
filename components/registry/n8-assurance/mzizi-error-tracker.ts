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

// A critical error has TWO exits, and they are not alternatives.
//
// The import path here used to read `@/lib/fundi/nyuchi-fundi-reporter`, one
// directory off: `nyuchi-fundi-reporter` (N9) is a real registry component and
// the shadcn CLI installs it to `lib/nyuchi-fundi-reporter.ts`. Wrong path, real
// file — so the fix is the path, not the pointer.
//
//   1. N9 fundi — files a GitHub issue, deduplicated by a per-component cooldown.
//      This is the healing path: a named defect a human can merge a fix for.
//
//        import { getFundiReporter } from "@/lib/nyuchi-fundi-reporter"
//
//        createErrorTracker({
//          onCritical: (e) => getFundiReporter().report({
//            component: e.componentName ?? "unknown",
//            node: e.node ?? 8,
//            severity: e.severity,
//            errorType: "render",
//            source: "error-tracker",
//            title: e.message,
//            description: e.stack ?? e.message,
//            blastRadius: e.blastRadius,
//          }),
//        })
//
//   2. N8 mzizi-otel — emits an OTLP span. This is the observation path: every
//      error, not just the critical ones, readable by any agent or service that
//      speaks OpenTelemetry rather than by fundi alone.
//
//        import { exportSpans, otelStatus } from "./mzizi-otel"
//
//        createErrorTracker({
//          onError: (e) => exportSpans(
//            [{
//              name: `error ${e.componentName ?? "unknown"}`,
//              startTimeMs: Date.parse(e.firstSeen),
//              endTimeMs: Date.parse(e.lastSeen),
//              attributes: {
//                "mzizi.node": e.node ?? 8,
//                "mzizi.component": e.componentName,
//                "mzizi.blast_radius": e.blastRadius.length,
//                "error.message": e.message,
//              },
//              status: { code: otelStatus.ERROR, message: e.message },
//            }],
//            { serviceName: "my-app" },
//          ),
//        })
//
// Wire both. Reporting every error to N9 would open an issue per render failure;
// emitting only to OTLP means nothing ever gets fixed unless somebody is watching
// a dashboard.

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
