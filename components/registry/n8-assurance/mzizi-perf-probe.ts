"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI PERF PROBE — N8 assurance (a node on the engineering strand)
   Web Vitals + component-level performance monitoring.
   ═══════════════════════════════════════════════════════════════ */

export interface WebVitalsMetric {
  name: "LCP" | "FID" | "CLS" | "INP" | "TTFB" | "FCP"
  value: number
  rating: "good" | "needs-improvement" | "poor"
  url: string
  timestamp: string
}

export interface ComponentPerfMetric {
  componentName: string
  portalUrl?: string
  node: number
  renderTimeMs: number
  rerenderCount: number
  mountTimeMs: number
}

export interface PerfReport {
  url: string
  timestamp: string
  vitals: WebVitalsMetric[]
  components: ComponentPerfMetric[]
  totalRenderTimeMs: number
  memoryUsageMB?: number
}

const VITAL_THRESHOLDS: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  INP: { good: 200, poor: 500 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
}

function rateMetric(name: string, value: number): WebVitalsMetric["rating"] {
  const t = VITAL_THRESHOLDS[name]
  if (!t) return "good"
  if (value <= t.good) return "good"
  if (value >= t.poor) return "poor"
  return "needs-improvement"
}

export interface NyuchiPerfProbeConfig {
  onMetric?: (metric: WebVitalsMetric) => void
  onReport?: (report: PerfReport) => void
  /** Track component-level rendering via data-portal attributes */
  trackComponents?: boolean
  /** Sample rate 0-1 (default: 0.1 = 10% of pageloads) */
  sampleRate?: number
}

/** Initialize Web Vitals collection */
export function initPerfProbe(config: NyuchiPerfProbeConfig = {}) {
  const { sampleRate = 0.1 } = config
  if (Math.random() > sampleRate) return // Sampling

  if (typeof window === "undefined") return

  // Use PerformanceObserver for real metrics
  const vitals: WebVitalsMetric[] = []

  function recordMetric(name: WebVitalsMetric["name"], value: number) {
    const metric: WebVitalsMetric = {
      name,
      value,
      rating: rateMetric(name, value),
      url: window.location.pathname,
      timestamp: new Date().toISOString(),
    }
    vitals.push(metric)
    config.onMetric?.(metric)
  }

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      if (entries.length > 0) recordMetric("LCP", entries[entries.length - 1].startTime)
    })
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
  } catch {
    // This entry type is unsupported here. A missing metric is the correct
    // outcome — a perf probe must never break the page it is measuring.
  }

  /** `layout-shift` entries — PerformanceEntry does not declare these. */
  interface LayoutShiftEntry extends PerformanceEntry {
    hadRecentInput: boolean
    value: number
  }
  /** Chrome-only heap reporting; absent everywhere else, hence optional. */
  interface PerformanceWithMemory extends Performance {
    memory?: { usedJSHeapSize: number }
  }

  /**
   * `performance.memory` exists only in Chromium. The previous
   * `(performance as any).memory?.usedJSHeapSize / 1048576` divided `undefined`
   * by a number on every other browser, so `memoryUsageMB` was reported as
   * **NaN** — a number-shaped value that poisons any average computed from it.
   * `memoryUsageMB` is optional; absent is the honest answer.
   */
  function heapUsedMB(): number | undefined {
    const bytes = (performance as PerformanceWithMemory).memory?.usedJSHeapSize
    return bytes === undefined ? undefined : bytes / 1048576
  }

  // CLS
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) clsValue += entry.value
      }
      recordMetric("CLS", clsValue)
    })
    clsObserver.observe({ type: "layout-shift", buffered: true })
  } catch {
    // This entry type is unsupported here. A missing metric is the correct
    // outcome — a perf probe must never break the page it is measuring.
  }

  // FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") recordMetric("FCP", entry.startTime)
      }
    })
    fcpObserver.observe({ type: "paint", buffered: true })
  } catch {
    // This entry type is unsupported here. A missing metric is the correct
    // outcome — a perf probe must never break the page it is measuring.
  }

  // TTFB from navigation timing
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    if (nav) recordMetric("TTFB", nav.responseStart - nav.requestStart)
  } catch {
    // This entry type is unsupported here. A missing metric is the correct
    // outcome — a perf probe must never break the page it is measuring.
  }

  // Component-level perf via data-portal
  if (config.trackComponents) {
    setTimeout(() => {
      const components: ComponentPerfMetric[] = []
      document.querySelectorAll("[data-portal]").forEach((el) => {
        const slot = el.getAttribute("data-slot") || "unknown"
        const portal = el.getAttribute("data-portal") || undefined
        components.push({
          componentName: slot,
          portalUrl: portal,
          node: guessNode(slot),
          renderTimeMs: 0,
          rerenderCount: 0,
          mountTimeMs: 0,
        })
      })
      const report: PerfReport = {
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
        vitals,
        components,
        totalRenderTimeMs: performance.now(),
        memoryUsageMB: heapUsedMB(),
      }
      config.onReport?.(report)
    }, 5000)
  }
}

function guessNode(slot: string): number {
  if (slot.includes("page") || slot.includes("layout")) return 6
  if (slot.startsWith("nyuchi-")) return 3
  return 2
}

/** React hook for component-level render tracking */
export function usePerfMark(componentName: string) {
  const renderCount = React.useRef(0)
  React.useEffect(() => {
    renderCount.current++
  })
  React.useEffect(() => {
    performance.mark(`${componentName}-mount`)
    return () => {
      performance.mark(`${componentName}-unmount`)
    }
  }, [componentName])
}
