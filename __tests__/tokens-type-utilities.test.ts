// Every type-scale utility a registry component uses resolves in the stylesheet
// the registry ships (`mzizi-tokens-globals.css`).
//
// Tailwind 4 generates `text-<name>` only for a `--text-<name>` in `@theme`. The
// registry's components used `text-body-sm` 116 times while the stylesheet
// defined `--text-small` and no `--text-body-sm`, so a consumer that copied the
// stylesheet and installed the Discover components got no rule at all and the
// text fell back to 16px (mukoko-dev/mukoko-events /discover).

import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { TYPE, TYPE_ALIASES } from "../scripts/render-globals-css"

const ROOT = process.cwd()
const CSS = readFileSync(
  join(ROOT, "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8"
)
const THEME = CSS.slice(CSS.indexOf("@theme"))

/** Class names in the type-scale shape: text-body*, text-display*, text-h1..h6, … */
const TYPE_CLASS = /(?<![\w-])text-(body(?:-[a-z]+)?|small|caption|code|display(?:-[a-z]+)?|h[1-6])(?![\w-])/g
const SOURCE = /\.(tsx|astro|rs)$/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : SOURCE.test(name) ? [path] : []
  })
}

function used(): Map<string, string> {
  const seen = new Map<string, string>()
  for (const file of walk(join(ROOT, "components/registry"))) {
    for (const m of readFileSync(file, "utf8").matchAll(TYPE_CLASS)) {
      if (!seen.has(m[1])) seen.set(m[1], file.slice(ROOT.length + 1))
    }
  }
  return seen
}

describe("mzizi-tokens-globals.css type utilities", () => {
  it("defines --text-body-sm as the 14px small size", () => {
    expect(THEME).toMatch(/^\s*--text-body-sm: var\(--fs-small\);$/m)
    expect(CSS).toMatch(/^\s*--fs-small: 0\.875rem;/m)
  })

  it("only aliases sizes that exist in the type scale", () => {
    const sizes = new Set<string>(TYPE.map(([n]) => n))
    for (const [alias, size] of TYPE_ALIASES) {
      expect(sizes.has(size), `${alias} → ${size}`).toBe(true)
      expect(sizes.has(alias), `${alias} would shadow a real size`).toBe(false)
    }
  })

  it("defines every text-<size> a registry component uses", () => {
    const missing = [...used()]
      .filter(([name]) => !new RegExp(`^\\s*--text-${name}:`, "m").test(THEME))
      .map(([name, file]) => `text-${name} (first used in ${file})`)
    expect(missing).toEqual([])
  })
})
