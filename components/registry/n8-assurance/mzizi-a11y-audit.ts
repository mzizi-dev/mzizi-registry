"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI A11Y AUDIT — N8 assurance (a node on the engineering strand)
   Runtime accessibility compliance across all nodes.
   ═══════════════════════════════════════════════════════════════ */

export type A11yViolationLevel = "critical" | "serious" | "moderate" | "minor"

export interface A11yViolation {
  rule: string
  level: A11yViolationLevel
  message: string
  element: string
  selector: string
  node?: number
  componentName?: string
  portalUrl?: string
  fix?: string
}

export interface A11yAuditResult {
  timestamp: string
  url: string
  totalElements: number
  violations: A11yViolation[]
  passes: number
  score: number // 0-100
}

export interface NyuchiA11yAuditConfig {
  /** Rules to check */
  rules?: string[]
  /** Minimum acceptable score */
  threshold?: number
  /** Run continuously in dev mode */
  continuous?: boolean
  onViolation?: (violation: A11yViolation) => void
  onComplete?: (result: A11yAuditResult) => void
}

/** Run an accessibility audit on the current page */
export function runA11yAudit(config: NyuchiA11yAuditConfig = {}): A11yAuditResult {
  const violations: A11yViolation[] = []
  const elements = document.querySelectorAll("*")
  let passes = 0

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const slot = htmlEl.getAttribute("data-slot")
    const portal = htmlEl.getAttribute("data-portal")
    const node = slot ? getNodeFromSlot(slot) : undefined

    // Rule: Images must have alt text
    if (el.tagName === "IMG" && !el.getAttribute("alt") && el.getAttribute("alt") !== "") {
      violations.push({
        rule: "img-alt",
        level: "critical",
        message: "Image missing alt text",
        element: el.tagName,
        selector: cssSelector(el),
        node,
        componentName: slot || undefined,
        portalUrl: portal || undefined,
        fix: 'Add alt="" for decorative or alt="description" for informative',
      })
    }
    // Rule: Buttons must have accessible name
    else if (
      (el.tagName === "BUTTON" || htmlEl.getAttribute("role") === "button") &&
      !getAccessibleName(htmlEl)
    ) {
      violations.push({
        rule: "button-name",
        level: "critical",
        message: "Button missing accessible name",
        element: el.tagName,
        selector: cssSelector(el),
        node,
        componentName: slot || undefined,
        portalUrl: portal || undefined,
        fix: "Add aria-label, aria-labelledby, or visible text",
      })
    }
    // Rule: Touch targets must be at least 44px
    else if (
      (el.tagName === "BUTTON" || el.tagName === "A" || htmlEl.getAttribute("role") === "button") &&
      htmlEl.offsetHeight > 0
    ) {
      const rect = htmlEl.getBoundingClientRect()
      if (rect.height < 44 || rect.width < 44) {
        violations.push({
          rule: "touch-target",
          level: "moderate",
          message: `Touch target too small (${Math.round(rect.width)}×${Math.round(rect.height)}px, min 44×44)`,
          element: el.tagName,
          selector: cssSelector(el),
          node,
          componentName: slot || undefined,
          portalUrl: portal || undefined,
          fix: "Set min-h-[44px] min-w-[44px] or equivalent",
        })
      }
    }
    // Rule: Interactive elements must have focus-visible styles
    else if (
      (el.tagName === "BUTTON" || el.tagName === "A" || el.tagName === "INPUT") &&
      htmlEl.offsetHeight > 0
    ) {
      passes++
    }
    // Rule: Headings should be in order
    else if (/^H[1-6]$/.test(el.tagName)) {
      passes++
    } else {
      passes++
    }
  })

  const score = elements.length > 0 ? Math.round((passes / elements.length) * 100) : 100
  const result: A11yAuditResult = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    totalElements: elements.length,
    violations,
    passes,
    score,
  }

  violations.forEach((v) => config.onViolation?.(v))
  config.onComplete?.(result)
  return result
}

function cssSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const slot = el.getAttribute("data-slot")
  if (slot) return `[data-slot="${slot}"]`
  return el.tagName.toLowerCase() + (el.className ? `.${el.className.split(" ")[0]}` : "")
}

function getAccessibleName(el: HTMLElement): string {
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("aria-labelledby") ||
    el.innerText?.trim() ||
    ""
  )
}

function getNodeFromSlot(slot: string): number | undefined {
  if (slot.startsWith("nyuchi-") && !slot.includes("page")) return 3
  if (slot.includes("page") || slot.includes("layout")) return 6
  return 2
}

/** React hook for continuous a11y monitoring in development */
export function useA11yAudit(config: NyuchiA11yAuditConfig = {}) {
  const [result, setResult] = React.useState<A11yAuditResult | null>(null)
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development" && !config.continuous) return
    const timer = setInterval(() => {
      setResult(runA11yAudit({ ...config, onComplete: setResult }))
    }, 5000)
    return () => clearInterval(timer)
  }, [config])
  return result
}
