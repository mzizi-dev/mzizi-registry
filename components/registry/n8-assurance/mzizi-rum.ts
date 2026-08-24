"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI RUM — N8 assurance (a node on the engineering strand)
   Real User Monitoring. Privacy-first. No PII.
   ═══════════════════════════════════════════════════════════════ */

/**
 * `navigator.connection` is the Network Information API — widely shipped but
 * not in lib.dom, and absent on Safari. Declared narrowly rather than reached
 * through `any`, which would have erased the rest of Navigator too.
 */
interface NavigatorWithConnection extends Navigator {
  connection?: { effectiveType?: RumEvent["connection"] }
}

export interface RumEvent {
  type: "pageload" | "interaction" | "navigation" | "network" | "error"
  timestamp: string
  url: string
  miniApp?: string
  /** Device category derived from viewport */
  device: "mobile" | "tablet" | "desktop"
  /** Connection type from NetworkInformation API */
  connection?: "4g" | "3g" | "2g" | "slow-2g" | "wifi" | "unknown"
  metrics: Record<string, number>
}

export interface RumConfig {
  /** Sample rate 0-1 */
  sampleRate?: number
  /** Flush interval in ms */
  flushInterval?: number
  /**
   * Endpoint to POST batches to.
   *
   * **There is no default.** This used to default to `https://mzizi.dev/api/rum`,
   * a route that has never existed — so every consumer who installed this
   * component and did not set an endpoint POSTed their batches into a 404, and
   * the `catch` below (correctly) swallowed it. Silent data loss that looked
   * exactly like working RUM.
   *
   * Unset means "do not POST"; use `onFlush` to route batches yourself, or send
   * them to a collector with `mzizi-otel`. Inventing a destination for a
   * consumer's telemetry is not a sane default even when the destination works.
   */
  endpoint?: string
  /** Custom event handler instead of posting */
  onEvent?: (event: RumEvent) => void
  onFlush?: (events: RumEvent[]) => void
}

// BACKLINKS: RUM events are enriched with data-portal attributes
// to link performance metrics back to specific components in the registry.

class RumCollector {
  private events: RumEvent[] = []
  private config: Required<RumConfig>
  private flushTimer?: ReturnType<typeof setInterval>

  constructor(config: RumConfig = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 0.1,
      flushInterval: config.flushInterval ?? 30000,
      endpoint: config.endpoint ?? "",
      onEvent: config.onEvent ?? (() => {}),
      onFlush: config.onFlush ?? (() => {}),
    }
    if (Math.random() > this.config.sampleRate) return
    this.init()
  }

  private init() {
    if (typeof window === "undefined") return

    // Page load
    window.addEventListener("load", () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      if (nav) {
        this.record({
          type: "pageload",
          metrics: {
            dns: nav.domainLookupEnd - nav.domainLookupStart,
            tcp: nav.connectEnd - nav.connectStart,
            ttfb: nav.responseStart - nav.requestStart,
            domLoad: nav.domContentLoadedEventEnd - nav.fetchStart,
            fullLoad: nav.loadEventEnd - nav.fetchStart,
            transferSize: nav.transferSize,
          },
        })
      }
    })

    // Navigation
    const originalPushState = history.pushState
    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this.record({ type: "navigation", metrics: { timestamp: performance.now() } })
    }

    // Flush on interval
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval)

    // Flush on page hide
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush()
    })
  }

  record(partial: Omit<RumEvent, "timestamp" | "url" | "device" | "connection">) {
    const event: RumEvent = {
      ...partial,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      device: window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
      connection: (navigator as NavigatorWithConnection).connection?.effectiveType || "unknown",
    }
    this.events.push(event)
    this.config.onEvent(event)
  }

  private async flush() {
    if (this.events.length === 0) return
    const batch = [...this.events]
    this.events = []
    this.config.onFlush(batch)
    // No endpoint means the consumer routes batches themselves via `onFlush`.
    // Posting to a guessed address instead is how this component spent its
    // whole life writing into a 404.
    if (!this.config.endpoint) return
    try {
      await fetch(this.config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
        keepalive: true,
      })
    } catch {
      // Beacon delivery is best-effort: RUM must never surface a network
      // failure of its own to the user it is measuring.
    }
  }

  destroy() {
    if (this.flushTimer) clearInterval(this.flushTimer)
  }
}

let _rum: RumCollector | null = null
export function initRum(config?: RumConfig): RumCollector {
  if (!_rum) _rum = new RumCollector(config)
  return _rum
}

export function useRum(config?: RumConfig) {
  React.useEffect(() => {
    const rum = initRum(config)
    return () => rum.destroy()
  }, [])
}
