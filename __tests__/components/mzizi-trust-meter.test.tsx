/**
 * mzizi-trust-meter: the counted-signal list (#543) for Kweli's "Address trust" panel, and
 * that a meter without `signals` renders the three-signal breakdown exactly as before.
 */
import { renderToStaticMarkup } from "react-dom/server"
import { beforeAll, describe, expect, it } from "vitest"

import { MziziTrustMeter } from "@/components/registry/n3-brand/mzizi-trust-meter"

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
})

const html = (el: React.ReactElement) => {
  const host = document.createElement("div")
  host.innerHTML = renderToStaticMarkup(el)
  return host
}

describe("MziziTrustMeter signal counts", () => {
  const signals = [
    { label: "Check-ins at the entrance", count: 12, detail: "Mukoko Events" },
    { label: "Deliveries completed", count: 1204 },
    { label: "Neighbours who vouched", count: 3 },
  ]

  it("lists one row per signal, with its count", () => {
    const root = html(<MziziTrustMeter title="Address trust" trustScore={0.62} signals={signals} />)
    const rows = root.querySelectorAll('ul[data-slot="trust-signal-list"] > li[data-slot="trust-signal"]')
    expect(rows).toHaveLength(3)
    expect([...rows].map((r) => r.querySelector('[data-slot="trust-signal-count"]')?.textContent)).toEqual([
      "12",
      (1204).toLocaleString(),
      "3",
    ])
    expect(rows[0]?.textContent).toContain("Mukoko Events")
  })

  it("names the meter with its title, and exposes its value", () => {
    const root = html(<MziziTrustMeter title="Address trust" trustScore={0.62} signals={signals} />)
    const meter = root.querySelector('[role="meter"]')
    expect(meter?.getAttribute("aria-label")).toBe("Address trust")
    expect(meter?.getAttribute("aria-valuenow")).toBe("0.62")
    expect(meter?.getAttribute("aria-valuemin")).toBe("0")
    expect(meter?.getAttribute("aria-valuemax")).toBe("1")
    expect(root.textContent).toContain("Address trust")
  })

  it("replaces the three-signal breakdown when signals are given", () => {
    const root = html(<MziziTrustMeter trustScore={0.5} signals={signals} />)
    expect(root.textContent).not.toContain("Verification")
    expect(root.textContent).not.toContain("Ubuntu")
  })

  it("each row is at least 44px (min-h-11)", () => {
    const root = html(<MziziTrustMeter trustScore={0.5} signals={signals} />)
    for (const li of root.querySelectorAll('[data-slot="trust-signal"]')) expect(li.className).toContain("min-h-11")
  })

  it("compact shows no list", () => {
    const root = html(<MziziTrustMeter trustScore={0.5} signals={signals} compact />)
    expect(root.querySelector('[data-slot="trust-signal-list"]')).toBeNull()
  })

  it("without signals the meter is unchanged: default name and the three-signal breakdown", () => {
    const root = html(<MziziTrustMeter trustScore={0.3} verificationScore={0.4} />)
    expect(root.querySelector('[role="meter"]')?.getAttribute("aria-label")).toBe("Trust score")
    expect(root.querySelector('[data-slot="trust-signal-list"]')).toBeNull()
    for (const s of ["Trust Score", "Verification", "Status", "Ubuntu"]) expect(root.textContent).toContain(s)
  })

  it("is a server component with no inline style: the bars are SVG rect widths", () => {
    const root = html(<MziziTrustMeter trustScore={0.62} verificationScore={0.5} ubuntuScore={1.4} />)
    expect(root.querySelector("[style]")).toBeNull()
    expect(root.querySelector('svg[data-slot="trust-meter-bar"] rect')?.getAttribute("width")).toBe("62")
    // Values over 1 are clamped to the full bar, never past it.
    const ubuntu = root.querySelector('[data-signal="ubuntu"] rect')
    expect(ubuntu?.getAttribute("width")).toBe("100")
  })
})

describe("MziziTrustMeter showScore (#543)", () => {
  it("by default writes no raw score: the level is named, and is the meter's value text", () => {
    const root = html(<MziziTrustMeter trustScore={0.3} verificationScore={0.4} ubuntuScore={0.1} />)
    expect(root.querySelector('[data-slot="trust-meter-score"]')).toBeNull()
    expect(root.querySelector('[data-slot="trust-breakdown-value"]')).toBeNull()
    expect(root.querySelector('[data-slot="trust-meter-level"]')?.textContent).toBe("Growing")
    expect(root.textContent).not.toMatch(/\d\.\d{3}/)
    const meter = root.querySelector('[role="meter"]')
    expect(meter?.getAttribute("aria-valuetext")).toBe("Growing")
    expect(meter?.getAttribute("aria-valuenow")).toBe("0.3")
  })

  it("showScore writes the composite and each signal's value", () => {
    const root = html(<MziziTrustMeter trustScore={0.3} verificationScore={0.4} showScore />)
    expect(root.querySelector('[data-slot="trust-meter-score"]')?.textContent).toBe("0.300")
    expect(root.querySelectorAll('[data-slot="trust-breakdown-value"]')).toHaveLength(3)
    expect(root.querySelector('[data-slot="trust-meter-level"]')).toBeNull()
    expect(root.querySelector('[role="meter"]')?.hasAttribute("aria-valuetext")).toBe(false)
  })
})

describe("mzizi-trust-tiers (#543)", () => {
  it("is server-safe: no \"use client\", no hooks, no browser globals", async () => {
    const { readFileSync } = await import("node:fs")
    const src = readFileSync("components/registry/n3-brand/mzizi-trust-tiers.ts", "utf8")
    expect(src).not.toMatch(/^\s*["']use client["']/m)
    expect(src).not.toMatch(/\buse(State|Effect|Ref|Memo|Callback|Context)\b/)
    expect(src).not.toMatch(/\b(window|document|localStorage)\./)
  })

  it("is the badge's ladder: the badge re-exports the same objects", async () => {
    const tiers = await import("@/lib/mzizi-trust-tiers")
    const badge = await import("@/components/registry/n3-brand/mzizi-verified-badge")
    expect(badge.TIER_CONFIG).toBe(tiers.TIER_CONFIG)
    expect(badge.STATUS_OVERLAY).toBe(tiers.STATUS_OVERLAY)
    expect(tiers.computeTrustScore("government", "living")).toBe(0.3)
  })
})
