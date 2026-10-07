// The container utilities ship in the stylesheet the registry ships
// (`mzizi-tokens-globals.css`).
//
// `site-container`, `site-section`, `site-hero` and the Discover pages render
// through `.container-custom`, `.container-narrow` and `.container-prose`, which
// used to live only in each consuming site's globals.css: a repo that copied
// the registry's stylesheet and installed those components got an unstyled,
// full-width div. These tests read the COMMITTED stylesheet, then compile it
// with Tailwind to check what a consumer actually gets.

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { createRequire } from "node:module"
import { compile } from "tailwindcss"
import { CONTAINERS, CONTAINER_UTILITIES } from "../scripts/render-globals-css"

const ROOT = process.cwd()
const CSS = readFileSync(
  join(ROOT, "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8"
)
/** Everything above LOCAL OVERRIDES: the part `pnpm tokens:sync` writes. */
const GENERATED = CSS.slice(0, CSS.indexOf("LOCAL OVERRIDES — the only block"))

const TAILWIND = dirname(createRequire(import.meta.url).resolve("tailwindcss/package.json"))

async function build(candidates: string[]): Promise<string> {
  const compiler = await compile(CSS, {
    base: ROOT,
    loadStylesheet: async (id: string) => {
      const path = id === "tailwindcss" ? join(TAILWIND, "index.css") : join(TAILWIND, id.replace(/^tailwindcss\//, ""))
      return { path, base: dirname(path), content: readFileSync(path, "utf8") }
    },
  })
  return compiler.build(candidates)
}

/** The rule body for `.selector { … }` in compiled output (one level of nesting). */
function rule(css: string, selector: string): string {
  const m = css.match(new RegExp(`\\n\\s*\\.${selector} \\{((?:[^{}]|\\{[^{}]*\\})*)\\}`))
  return m?.[1] ?? ""
}

describe("mzizi-tokens-globals.css containers", () => {
  it("declares the three widths in @theme, in the generated part", () => {
    expect(GENERATED).toMatch(/^\s*--container-narrow: 42rem;/m)
    expect(GENERATED).toMatch(/^\s*--container-prose: 48rem;/m)
    expect(GENERATED).toMatch(/^\s*--container-wide: 80rem;/m)
    expect(CONTAINERS.map(([n, v]) => `${n}=${v}`)).toEqual(["narrow=42rem", "prose=48rem", "wide=80rem"])
  })

  it("ships the three utilities in the generated part", () => {
    for (const name of ["container-custom", "container-narrow", "container-prose"]) {
      expect(GENERATED, name).toMatch(new RegExp(`^@utility ${name} \\{`, "m"))
    }
    expect(CONTAINER_UTILITIES.map(([n]) => n)).toEqual(["container-custom", "container-narrow", "container-prose"])
  })

  it("renders @bundu/ui 0.5.0's boxes on the spacing ladder", async () => {
    const out = await build(["container-custom", "container-narrow", "container-prose"])

    const custom = rule(out, "container-custom")
    expect(custom).toMatch(/max-width: var\(--container-wide\);/)
    expect(custom).toMatch(/margin-inline: auto;/)
    expect(custom).toMatch(/^\s*padding-inline: var\(--space-lg\);/m)
    expect(custom).toMatch(/@media \(width >= 40rem\) \{\s*padding-inline: var\(--space-xl\);/)
    expect(custom).toMatch(/@media \(width >= 64rem\) \{\s*padding-inline: var\(--space-xl-plus\);/)

    for (const [name, width] of [["container-narrow", "narrow"], ["container-prose", "prose"]] as const) {
      const body = rule(out, name)
      expect(body, name).toMatch(new RegExp(`max-width: var\\(--container-${width}\\);`))
      expect(body, name).toMatch(/margin-inline: auto;/)
      expect(body, name).toMatch(/^\s*padding-inline: var\(--space-lg\);/m)
      expect(body, name).toMatch(/@media \(width >= 40rem\) \{\s*padding-inline: var\(--space-xl\);/)
      expect(body, name).not.toMatch(/64rem/)
    }

    // The values the utilities read resolve to the widths @bundu/ui renders.
    expect(out).toMatch(/--container-wide: 80rem;/)
    expect(out).toMatch(/--container-narrow: 42rem;/)
    expect(out).toMatch(/--container-prose: 48rem;/)
    expect(out).toMatch(/--space-lg: 1\.5rem;/)
    expect(out).toMatch(/--space-xl: 2rem;/)
    expect(out).toMatch(/--space-xl-plus: 2\.5rem;/)
  })

  it("adds max-w-narrow / max-w-wide and leaves Tailwind's max-w-prose at 65ch", async () => {
    const out = await build(["max-w-narrow", "max-w-wide", "max-w-prose"])
    expect(rule(out, "max-w-narrow")).toMatch(/max-width: var\(--container-narrow\);/)
    expect(rule(out, "max-w-wide")).toMatch(/max-width: var\(--container-wide\);/)
    // app-page-header, app-empty-state and cover-wash-header use max-w-prose for 65ch.
    expect(rule(out, "max-w-prose")).toMatch(/max-width: 65ch;/)
  })
})
