"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI CONFORMITY CHECK — N8 assurance (a node on the engineering strand)
   Verifies production matches the registry (Netflix Conformity Monkey).
   ═══════════════════════════════════════════════════════════════ */

export type ConformityViolationType =
  | "unregistered"
  | "missing_portal"
  | "deprecated"
  | "version_mismatch"
  | "missing_aria"
  | "missing_slot"

export interface ConformityViolation {
  type: ConformityViolationType
  componentName: string
  element: string
  selector: string
  message: string
  portalUrl?: string
  severity: "info" | "warning" | "error"
}

export interface ConformityReport {
  timestamp: string
  url: string
  totalComponents: number
  conformant: number
  violations: ConformityViolation[]
  score: number // 0-100
}

export interface ConformityCheckConfig {
  /** Known registered components from the registry */
  registry?: Set<string>
  /** Deprecated component names */
  deprecated?: Set<string>
  /** Run automatically on route change */
  autoRun?: boolean
  onViolation?: (v: ConformityViolation) => void
  onReport?: (r: ConformityReport) => void
}

// N9 fundi integration: Major conformity violations are reported to Fundi
// import { getFundiReporter } from "@/lib/fundi/nyuchi-fundi-reporter"
// On error-severity violations: getFundiReporter().report({ component, errorType: "conformity", source: "conformity-check", ... })

export function runConformityCheck(config: ConformityCheckConfig = {}): ConformityReport {
  const violations: ConformityViolation[] = []
  const allSlotted = document.querySelectorAll("[data-slot]")
  let conformant = 0

  allSlotted.forEach((el) => {
    const slot = el.getAttribute("data-slot") || ""
    const portal = el.getAttribute("data-portal")
    const ariaLabel = el.getAttribute("aria-label") || el.getAttribute("role")

    // Check: is this component in the registry?
    if (config.registry && !config.registry.has(slot)) {
      violations.push({
        type: "unregistered",
        componentName: slot,
        element: el.tagName,
        selector: `[data-slot="${slot}"]`,
        message: `Component "${slot}" is not in the design registry`,
        severity: "warning",
      })
      config.onViolation?.({
        type: "unregistered",
        componentName: slot,
        element: el.tagName,
        selector: `[data-slot="${slot}"]`,
        message: `Component "${slot}" is not in the design registry`,
        severity: "warning",
      })
      return
    }

    // Check: does it have a portal backlink?
    if (!portal) {
      violations.push({
        type: "missing_portal",
        componentName: slot,
        element: el.tagName,
        selector: `[data-slot="${slot}"]`,
        message: `Component "${slot}" missing data-portal attribute`,
        severity: "info",
      })
    }

    // Check: is it deprecated?
    if (config.deprecated?.has(slot)) {
      violations.push({
        type: "deprecated",
        componentName: slot,
        element: el.tagName,
        selector: `[data-slot="${slot}"]`,
        message: `Component "${slot}" is deprecated`,
        portalUrl: portal || undefined,
        severity: "error",
      })
    }

    // Check: interactive elements need ARIA
    if (
      (el.tagName === "BUTTON" || el.getAttribute("role") === "button") &&
      !ariaLabel &&
      !el.textContent?.trim()
    ) {
      violations.push({
        type: "missing_aria",
        componentName: slot,
        element: el.tagName,
        selector: `[data-slot="${slot}"]`,
        message: `Interactive element in "${slot}" missing accessible name`,
        portalUrl: portal || undefined,
        severity: "warning",
      })
    }

    if (violations.filter((v) => v.componentName === slot).length === 0) conformant++
  })

  const report: ConformityReport = {
    timestamp: new Date().toISOString(),
    url: window.location.pathname,
    totalComponents: allSlotted.length,
    conformant,
    violations,
    score: allSlotted.length > 0 ? Math.round((conformant / allSlotted.length) * 100) : 100,
  }

  config.onReport?.(report)
  return report
}

/** React hook for continuous conformity monitoring in development */
export function useConformityCheck(config: ConformityCheckConfig = {}) {
  const [report, setReport] = React.useState<ConformityReport | null>(null)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    const run = () => setReport(runConformityCheck(config))
    run()
    if (config.autoRun) {
      const observer = new MutationObserver(() => setTimeout(run, 500))
      observer.observe(document.body, { childList: true, subtree: true })
      return () => observer.disconnect()
    }
  }, [])
  return report
}
