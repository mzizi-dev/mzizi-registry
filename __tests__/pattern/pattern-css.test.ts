/**
 * The pattern stylesheets (issue #708, pattern PR), held to the owner's rules:
 *
 *   tokens.css     values only: custom properties under :root, [data-theme="dark"] and the
 *                  colour-scheme query. No other selector, no rule, no Tailwind.
 *   floor.css      the identity-neutral minimums. Reads only tokens.css variables, sets no
 *                  colour, radius, font, padding or identity-bearing value.
 *   mzizi-theme.css  targets the button's attributes only, and reads only tokens.css variables.
 *
 * And the Bundu floor the sizes must keep, resolved from tokens.css: 49px on touch, 28px on a
 * desktop with a fine pointer; the three control heights in the contract (49/56, 36/40, 32).
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, test } from "vitest"

const DIR = path.resolve(__dirname, "../../styles/pattern")
const read = (f: string) => readFileSync(path.join(DIR, f), "utf8")

/** Top-level rules of a stylesheet: prelude and body, comments removed. */
function rules(css: string): { prelude: string; body: string }[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const out: { prelude: string; body: string }[] = []
  let depth = 0
  let boundary = 0
  let open = -1
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i]
    if (c === "{") {
      if (depth === 0) open = i
      depth += 1
    } else if (c === "}") {
      depth -= 1
      if (depth === 0) {
        out.push({ prelude: src.slice(boundary, open).trim(), body: src.slice(open + 1, i) })
        boundary = i + 1
      }
    } else if (c === ";" && depth === 0) boundary = i + 1
  }
  return out
}

/** Declarations (`prop: value`) of a body, at its own level. */
function declarations(body: string): { prop: string; value: string }[] {
  const out: { prop: string; value: string }[] = []
  let depth = 0
  let cur = ""
  for (const ch of body) {
    if (ch === "{") depth += 1
    if (ch === "}") depth -= 1
    if (depth === 0 && ch === ";") {
      const m = /^\s*([a-z-]+|--[\w-]+)\s*:\s*([\s\S]*)$/i.exec(cur)
      if (m) out.push({ prop: m[1]!, value: m[2]!.trim() })
      cur = ""
    } else if (depth === 0) cur += ch
  }
  return out
}

const tokens = read("tokens.css")
const floor = read("floor.css")
const theme = read("mzizi-theme.css")

describe("tokens.css is values only", () => {
  test("every rule is :root, [data-theme=dark], or a colour-scheme or size query of :root", () => {
    for (const r of rules(tokens)) {
      const sel = r.prelude
      if (sel === ":root" || sel === '[data-theme="dark"]') continue
      if (sel === "@media (prefers-color-scheme: dark)") {
        const inner = rules(r.body)
        // scoped to a page with no data-theme, so an explicit data-theme always wins
        expect(inner.map((x) => x.prelude)).toEqual([":root:not([data-theme])"])
        continue
      }
      expect(sel, `unexpected rule ${sel}`).toMatch(/^@media \(/)
      const inner = rules(r.body)
      expect(inner.map((x) => x.prelude), `inside ${sel}`).toEqual([":root"])
    }
  })

  test("every declaration is a custom property, and no brand block or Tailwind rule is left", () => {
    for (const r of rules(tokens)) {
      for (const d of declarations(r.body)) expect(d.prop.startsWith("--"), `${d.prop}`).toBe(true)
      for (const inner of rules(r.body)) for (const d of declarations(inner.body)) expect(d.prop.startsWith("--")).toBe(true)
    }
    expect(tokens).not.toMatch(/data-brand|@theme|@import|@layer|@utility/)
  })
})

/** The custom properties a stylesheet defines, by name. */
function defined(css: string): Set<string> {
  const names = new Set<string>()
  for (const r of rules(css)) {
    for (const d of declarations(r.body)) if (d.prop.startsWith("--")) names.add(d.prop)
    for (const inner of rules(r.body)) for (const d of declarations(inner.body)) if (d.prop.startsWith("--")) names.add(d.prop)
  }
  return names
}

describe("floor.css reads only tokens.css and sets no identity", () => {
  const TOKENS = defined(tokens)
  const ALLOWED = new Set(["position", "min-height", "content", "top", "left", "width", "height", "transform", "outline", "outline-offset", "transition"])

  test("only the minimums are declared", () => {
    const props = new Set<string>()
    for (const r of rules(floor)) {
      for (const d of declarations(r.body)) props.add(d.prop)
      for (const inner of rules(r.body)) for (const d of declarations(inner.body)) props.add(d.prop)
    }
    expect([...props].filter((p) => !ALLOWED.has(p))).toEqual([])
  })

  test("it reads only custom properties that tokens.css defines", () => {
    for (const v of floor.matchAll(/var\((--[\w-]+)/g)) expect(TOKENS.has(v[1]!), v[1]).toBe(true)
  })

  test("it carries no colour literal", () => {
    expect(floor).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklab\(|color-mix\(/i)
  })
})

describe("mzizi-theme.css targets the button's attributes", () => {
  test("every rule is keyed on the button's data-slot", () => {
    for (const r of rules(theme)) expect(r.prelude, r.prelude).toMatch(/^\[data-slot="button"\]/)
  })

  test("it reads only custom properties that tokens.css defines", () => {
    const TOKENS = defined(tokens)
    for (const v of theme.matchAll(/var\((--[\w-]+)/g)) expect(TOKENS.has(v[1]!), v[1]).toBe(true)
  })
})

/** A token's px value from tokens.css at a given tier: the root block, or the named media block. */
function px(name: string, tier: "touch" | "desktop"): number {
  const scan = (css: string): string | undefined => {
    const m = new RegExp(`${name}:\\s*([^;]+);`).exec(css)
    return m?.[1]
  }
  let value: string | undefined
  if (tier === "desktop") {
    const media = rules(tokens).find((r) => r.prelude.includes("min-width: 64rem") && r.prelude.includes("pointer: fine"))
    value = media ? scan(media.body) : undefined
  }
  value ??= scan(tokens)
  if (!value) throw new Error(`${name} is not in tokens.css`)
  const rem = /^([\d.]+)rem$/.exec(value.trim())
  if (rem) return Number(rem[1]) * 16
  const pxm = /^([\d.]+)px$/.exec(value.trim())
  if (pxm) return Number(pxm[1])
  throw new Error(`${name} = ${value}: not a length this test reads`)
}

describe("the Bundu floor, resolved from tokens.css", () => {
  test("the hit region is 49px on touch and 28px on a desktop with a fine pointer", () => {
    expect(px("--target-floor", "touch")).toBe(49)
    expect(px("--target-floor", "desktop")).toBe(28)
  })

  test("the control heights match the contract: 49/36 default, 49/32 sm, 56/40 lg, 49/36 icon, 49/32 icon-sm", () => {
    expect([px("--size-control", "touch"), px("--size-control", "desktop")]).toEqual([49, 36])
    expect([px("--size-control-sm", "touch"), px("--size-control-sm", "desktop")]).toEqual([49, 32])
    expect([px("--size-control-lg", "touch"), px("--size-control-lg", "desktop")]).toEqual([56, 40])
    expect([px("--size-control-icon", "touch"), px("--size-control-icon", "desktop")]).toEqual([49, 36])
  })

  test("the theme sizes the button from those tokens, never from a literal height", () => {
    const sized = rules(theme).flatMap((r) => rules(r.body)).filter((r) => r.prelude.includes("data-size"))
    expect(sized.length).toBeGreaterThan(0)
    for (const r of sized) {
      for (const d of declarations(r.body)) {
        if (d.prop === "height" || d.prop === "width") expect(d.value, `${r.prelude} ${d.prop}`).toMatch(/^var\(--size-/)
      }
    }
    expect(theme).toMatch(/height:\s*var\(--size-control\)/)
  })
})
