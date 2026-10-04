import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { CONTRAST_FLAGS, buildTokens } from "../scripts/generate-design-system"
import { heritageColors, minerals } from "../lib/tokens/palette.source"

const ROOT = process.cwd()
const tokens = buildTokens(readFileSync(join(ROOT, "styles/globals.css"), "utf8"))
const byName = new Map(tokens.color.tokens.map((t) => [t.name, t.value]))

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe("design-system/tokens.json", () => {
  it("names exactly the raw mineral and heritage colours that miss 4.5:1 on card", () => {
    const failing = [...minerals, ...heritageColors]
      .map((c) => c.name)
      .filter((name) =>
        (["light", "dark"] as const).some(
          (theme) => ratio(byName.get(name)![theme], byName.get("card")![theme]) < 4.5,
        ),
      )
      .sort()
    expect(failing).toEqual(Object.keys(CONTRAST_FLAGS).sort())
  })

  it("keeps every mineral's on-container text at 7:1 or more on its container", () => {
    for (const m of minerals) {
      for (const theme of ["light", "dark"] as const) {
        const text = byName.get(`${m.name}-on-container`)![theme]
        const ground = byName.get(`${m.name}-container`)![theme]
        expect(ratio(text, ground), `${m.name} ${theme}`).toBeGreaterThanOrEqual(7)
      }
    }
  })

  it("resolves every colour alias to a token that exists", () => {
    for (const t of tokens.color.tokens) {
      for (const v of Object.values(t.value)) {
        const alias = /^\{(.+)\}$/.exec(v)
        if (alias) expect(byName.has(alias[1]), `${t.name} -> ${alias[1]}`).toBe(true)
      }
    }
  })

  it("ships a light and a dark version of every brand mark", () => {
    for (const mark of ["mzizi-mark", "bundu-mark", "nyuchi-bee", "mukoko-mark"]) {
      for (const theme of ["light", "dark"]) {
        expect(existsSync(join(ROOT, `design-system/marks/${mark}-${theme}.png`)), `${mark}-${theme}`).toBe(true)
      }
    }
  })
})
