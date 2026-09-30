// The `-text` tier of `mzizi-tokens-globals.css`: every family's value as TEXT
// on `--base`, measured at APCA Lc 75.
//
// `-aa` answers a different question in light mode (a fill under white text),
// so light hematite `#546E7A` passes `-aa` and still fails as text on the page
// background: APCA Lc 69.7 on #F3F3F1. `mzizi-docs` derived `#4A616B` with
// `walk()` by hand and cited it as a local value. These tests read the
// COMMITTED stylesheet (the file a consumer copies) and pin the canon value.

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { heritageColors, experimentalColors, minerals } from "@/lib/tokens/palette.generated"
import { a11yTier, apca, LADDER, textOnBaseTier } from "../scripts/render-globals-css"

const CSS = readFileSync(
  join(process.cwd(), "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8"
)
const ROOT = CSS.slice(CSS.indexOf(":root {"), CSS.indexOf("/* ════ DARK"))
const DARK = CSS.slice(CSS.indexOf("/* ════ DARK"), CSS.indexOf("BRAND BLOCKS"))
const [, BASE_LIGHT, BASE_DARK] = LADDER.find(([n]) => n === "base")!

const FAMILIES = [
  ...minerals.map((f) => ["mineral", f] as const),
  ...heritageColors.map((f) => ["heritage", f] as const),
  ...experimentalColors.map((f) => ["exp", f] as const),
]

function value(block: string, name: string): string | undefined {
  return block.match(new RegExp(`^\\s*${name}:\\s*(#[0-9a-f]{6});`, "m"))?.[1]
}

describe("mzizi-tokens-globals.css text-on-base tier", () => {
  it("makes #4A616B canon for light hematite, and keeps #C9D2D7 for dark", () => {
    expect(BASE_LIGHT).toBe("#F3F3F1")
    expect(value(ROOT, "--heritage-hematite-text")).toBe("#4a616b")
    expect(value(DARK, "--heritage-hematite-text")).toBe("#c9d2d7")
    expect(apca("#546E7A", BASE_LIGHT)).toBeLessThan(75)
    expect(apca("#4A616B", BASE_LIGHT)).toBeGreaterThanOrEqual(75)
  })

  it("leaves every -aa value as it was", () => {
    expect(value(ROOT, "--heritage-hematite-aa")).toBe("#546e7a")
    expect(value(DARK, "--heritage-hematite-aa")).toBe("#c9d2d7")
    const families = FAMILIES.map(([, f]) => f)
    const tier = a11yTier(families)
    for (const [prefix, f] of FAMILIES) {
      const light = tier.get(f.name)?.light?.hex ?? f.lightHex
      const dark = tier.get(f.name)?.dark?.hex ?? f.darkHex
      expect(value(ROOT, `--${prefix}-${f.name}-aa`), f.name).toBe(light.toLowerCase())
      expect(value(DARK, `--${prefix}-${f.name}-aa`), f.name).toBe(dark.toLowerCase())
    }
  })

  it("emits a -text value for all 21 families, clearing Lc 75 on --base in both themes", () => {
    expect(FAMILIES).toHaveLength(21)
    for (const [prefix, f] of FAMILIES) {
      const l = value(ROOT, `--${prefix}-${f.name}-text`)
      const d = value(DARK, `--${prefix}-${f.name}-text`)
      expect(l, `${f.name} light`).toBeDefined()
      expect(d, `${f.name} dark`).toBeDefined()
      expect(Math.abs(apca(l!, BASE_LIGHT)), `${f.name} light`).toBeGreaterThanOrEqual(75)
      expect(Math.abs(apca(d!, BASE_DARK)), `${f.name} dark`).toBeGreaterThanOrEqual(75)
      expect(CSS).toContain(`--color-${f.name}-text: var(--${prefix}-${f.name}-text);`)
    }
  })

  it("keeps the canonical hex where it already clears the bar", () => {
    const tier = textOnBaseTier(FAMILIES.map(([, f]) => f))
    for (const [, f] of FAMILIES) {
      if (Math.abs(apca(f.lightHex, BASE_LIGHT)) >= 75) {
        expect(tier.get(f.name)!.light.hex, f.name).toBe(f.lightHex.toUpperCase())
      }
    }
  })

  it("adds no third dark value: dark -text is the dark -aa value", () => {
    for (const [prefix, f] of FAMILIES) {
      expect(value(DARK, `--${prefix}-${f.name}-text`), f.name).toBe(value(DARK, `--${prefix}-${f.name}-aa`))
    }
  })
})
