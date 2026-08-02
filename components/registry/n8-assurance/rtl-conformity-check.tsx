"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   RTL CONFORMITY CHECK — N8 assurance (a node on the engineering strand)
   Validates right-to-left layout correctness across deployed components.
   ═══════════════════════════════════════════════════════════════ */

export type RtlViolationLevel = "critical" | "serious" | "moderate" | "minor"

export interface RtlViolation {
  rule: string
  level: RtlViolationLevel
  message: string
  element: string
  selector: string
  node?: number
  componentName?: string
  portalUrl?: string
  fix?: string
}

export interface RtlAuditResult {
  timestamp: string
  url: string
  direction: "ltr" | "rtl" | "auto"
  totalElements: number
  violations: RtlViolation[]
  passes: number
  score: number // 0-100
}

export interface RtlConformityConfig {
  /** Which rules to run (default: all) */
  rules?: Array<
    "logical-properties" | "bidi-text" | "icon-mirroring" | "text-alignment" | "direction-attribute"
  >
  /** Ignore icons that should never mirror (pause, play, search, etc.) */
  nonMirroringIcons?: string[]
  onViolation?: (violation: RtlViolation) => void
  onComplete?: (result: RtlAuditResult) => void
}

const DEFAULT_NON_MIRRORING = [
  "search-icon",
  "play-icon",
  "pause-icon",
  "volume-icon",
  "mute-icon",
  "clock-icon",
  "calendar-icon",
  "check-icon",
  "x-icon",
  "heart-icon",
  "star-icon",
  "info-icon",
  "warning-icon",
  "error-icon",
  "success-icon",
]

const PHYSICAL_PROPERTIES = [
  "margin-left",
  "margin-right",
  "padding-left",
  "padding-right",
  "left",
  "right",
  "border-left",
  "border-right",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
]

/** Run an RTL conformity audit on the current page */
export function runRtlConformityCheck(config: RtlConformityConfig = {}): RtlAuditResult {
  const violations: RtlViolation[] = []
  const rules = new Set(
    config.rules ?? [
      "logical-properties",
      "bidi-text",
      "icon-mirroring",
      "text-alignment",
      "direction-attribute",
    ]
  )
  const nonMirroring = new Set(config.nonMirroringIcons ?? DEFAULT_NON_MIRRORING)
  const docDir = (document.documentElement.getAttribute("dir") as "ltr" | "rtl" | null) ?? "ltr"
  const elements = document.querySelectorAll("*")
  let passes = 0

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement
    const slot = htmlEl.getAttribute("data-slot") || undefined
    const portal = htmlEl.getAttribute("data-portal") || undefined
    const node = slot ? getNodeFromSlot(slot) : undefined
    const selector = cssSelector(el)
    let elementPassed = true

    // Rule: inline styles using physical properties instead of logical
    if (rules.has("logical-properties") && htmlEl.style) {
      for (const prop of PHYSICAL_PROPERTIES) {
        if (htmlEl.style.getPropertyValue(prop)) {
          violations.push({
            rule: "logical-properties",
            level: "serious",
            message: `Inline style uses physical "${prop}" — use logical equivalent (margin-inline-start, padding-inline-end, inset-inline-start, etc.)`,
            element: el.tagName,
            selector,
            node,
            componentName: slot,
            portalUrl: portal,
            fix: `Replace ${prop} with its inline-/block- logical counterpart`,
          })
          elementPassed = false
        }
      }
    }

    // Rule: bidi text missing lang/dir
    if (
      rules.has("bidi-text") &&
      (el.tagName === "P" || el.tagName === "SPAN" || el.tagName === "DIV")
    ) {
      const text = htmlEl.innerText?.trim()
      if (text && hasBidiChars(text) && !el.getAttribute("lang") && !el.getAttribute("dir")) {
        violations.push({
          rule: "bidi-text",
          level: "moderate",
          message: "Element contains bidi text but is missing lang or dir attribute",
          element: el.tagName,
          selector,
          node,
          componentName: slot,
          portalUrl: portal,
          fix: 'Add lang="ar" (or appropriate) or dir="auto" so the browser can render bidi correctly',
        })
        elementPassed = false
      }
    }

    // Rule: icon mirroring — icons that should mirror in RTL but have explicit transform=none,
    // or icons that should NOT mirror but lack direction-ignore marker
    if (rules.has("icon-mirroring") && (slot === "icon" || el.tagName === "SVG")) {
      const name = slot || htmlEl.getAttribute("aria-label") || ""
      const isNonMirroring = Array.from(nonMirroring).some((key) =>
        name.toLowerCase().includes(key)
      )
      const hasMirrorHint =
        htmlEl.style.getPropertyValue("transform") || htmlEl.getAttribute("data-rtl-mirror")
      if (docDir === "rtl" && !isNonMirroring && !hasMirrorHint && isDirectionalIcon(name)) {
        violations.push({
          rule: "icon-mirroring",
          level: "minor",
          message: `Directional icon "${name}" may need mirroring in RTL contexts`,
          element: el.tagName,
          selector,
          node,
          componentName: slot,
          portalUrl: portal,
          fix: 'Add data-rtl-mirror="true" or apply CSS [dir=rtl] & { transform: scaleX(-1) }',
        })
        elementPassed = false
      }
    }

    // Rule: text-alignment using left/right instead of start/end
    if (rules.has("text-alignment") && htmlEl.style?.textAlign) {
      const ta = htmlEl.style.textAlign
      if (ta === "left" || ta === "right") {
        violations.push({
          rule: "text-alignment",
          level: "moderate",
          message: `text-align: ${ta} is physical — use "start" or "end" for RTL-aware alignment`,
          element: el.tagName,
          selector,
          node,
          componentName: slot,
          portalUrl: portal,
          fix: `Replace text-align: ${ta} with text-align: ${ta === "left" ? "start" : "end"}`,
        })
        elementPassed = false
      }
    }

    if (elementPassed) passes++
  })

  // Rule: html/body direction attribute presence for multi-locale apps
  if (rules.has("direction-attribute") && !document.documentElement.getAttribute("dir")) {
    violations.push({
      rule: "direction-attribute",
      level: "serious",
      message: "<html> element has no dir attribute — RTL locales will fall back to LTR",
      element: "HTML",
      selector: "html",
      fix: 'Add dir="ltr" or dir="rtl" (or a direction provider) on <html>',
    })
  }

  const score = elements.length > 0 ? Math.round((passes / elements.length) * 100) : 100
  const result: RtlAuditResult = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    direction: docDir,
    totalElements: elements.length,
    violations,
    passes,
    score,
  }

  violations.forEach((v) => config.onViolation?.(v))
  config.onComplete?.(result)
  return result
}

function hasBidiChars(text: string): boolean {
  // Hebrew, Arabic, Syriac, Thaana, NKo, Samaritan, Mandaic
  return /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\u07C0-\u07FF\u0800-\u083F\u0840-\u085F]/.test(
    text
  )
}

function isDirectionalIcon(name: string): boolean {
  const directional = [
    "arrow",
    "chevron",
    "caret",
    "back",
    "forward",
    "next",
    "prev",
    "undo",
    "redo",
    "reply",
    "send",
  ]
  return directional.some((d) => name.toLowerCase().includes(d))
}

function cssSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  const slot = el.getAttribute("data-slot")
  if (slot) return `[data-slot="${slot}"]`
  return el.tagName.toLowerCase() + (el.className ? `.${String(el.className).split(" ")[0]}` : "")
}

function getNodeFromSlot(slot: string): number | undefined {
  if (slot.startsWith("nyuchi-") && !slot.includes("page")) return 3
  if (slot.includes("page") || slot.includes("layout")) return 6
  return 2
}

/** React hook: run a continuous RTL check while mounted (dev-mode default) */
export function useRtlConformity(config: RtlConformityConfig = {}) {
  const [result, setResult] = React.useState<RtlAuditResult | null>(null)
  React.useEffect(() => {
    const run = () => setResult(runRtlConformityCheck({ ...config, onComplete: setResult }))
    run()
    const timer = setInterval(run, 10_000)
    return () => clearInterval(timer)
  }, [config])
  return result
}
