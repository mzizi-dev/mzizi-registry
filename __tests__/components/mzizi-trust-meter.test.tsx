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
