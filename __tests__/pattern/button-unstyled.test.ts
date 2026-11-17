/**
 * The button sets no styling class (issue #708, pattern PR). Two things are held:
 *
 *   1. the SOURCE of button.tsx and button.rs carries no class string, no class recipe
 *      (`cva(`, a `classes()` table) and no Tailwind utility literal;
 *   2. the RENDERED output of the React button carries no `class` attribute, for every
 *      variant, size and state, unless the adopter passes one.
 *
 * The Astro build is rendered and held to the same rule in __tests__/astro/button-unstyled.test.ts.
 * The Rust build is held by mzizi-rs/crates/mzizi-ui/tests/button_unstyled.rs.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { Button } from "../../components/registry/n2-primitives/button"

const ROOT = path.resolve(__dirname, "../..")
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8")

/** Tailwind-style utility tokens: a prefix such as `bg-`, `text-`, `hover:` or a bare known utility. */
const UTILITY =
  /(^|[\s"'`:])(bg|text|rounded|border|ring|shadow|outline|h|w|size|min-h|min-w|p[xytblr]?|m[xytblr]?|gap|px|py|flex|inline-flex|items|justify|font|leading|tracking|transition|opacity|hover|focus-visible|disabled|dark|group|has|underline-offset)[-:[]|(^|[\s"'`])(inline-flex|flex|select-none|shrink-0|whitespace-nowrap|outline-none|items-center|justify-center|transition-all)([\s"'`]|$)/

/** Every quoted string literal in a source file. */
function literals(src: string): string[] {
  return [...src.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "")
}

describe("button source carries no styling", () => {
  for (const rel of [
    "components/registry/n2-primitives/button.tsx",
    "components/registry/n2-primitives/button.astro",
    "components/registry/n2-primitives/button.rs",
  ]) {
    test(`${path.basename(rel)} sets no class and builds no class recipe`, () => {
      const src = read(rel)
      expect(src).not.toMatch(/\bcva\(/)
      expect(src).not.toMatch(/\bclasses\(\)/)
      expect(src).not.toMatch(/\bclassName\s*=\s*["'`]/)
      expect(src).not.toMatch(/(^|\s)class\s*=\s*["'`]/m)
      expect(src).not.toMatch(/\bcn\(/)
      const offending = literals(src).filter((s) => UTILITY.test(s))
      expect(offending, `utility-looking literals in ${rel}`).toEqual([])
    })
  }
})

describe("the rendered React button carries no class attribute", () => {
  const variants = ["default", "outline", "secondary", "ghost", "destructive", "link"] as const
  const sizes = ["default", "sm", "lg", "icon", "icon-sm"] as const

  test("every variant and size, and the disabled state", () => {
    for (const variant of variants) {
      for (const size of sizes) {
        const html = renderToStaticMarkup(React.createElement(Button, { variant, size }, "Save"))
        expect(html, `${variant}/${size}`).not.toMatch(/\sclass=/)
        expect(html).toContain(`data-variant="${variant}"`)
        expect(html).toContain(`data-size="${size}"`)
        expect(html).toContain('data-slot="button"')
      }
    }
    const disabled = renderToStaticMarkup(React.createElement(Button, { disabled: true }, "Save"))
    expect(disabled).not.toMatch(/\sclass=/)
    expect(disabled).toContain('data-state="disabled"')
  })

  test("the adopter's className passes through, and nothing else is added", () => {
    const html = renderToStaticMarkup(
      React.createElement(Button, { className: "w-full mt-2", variant: "outline" }, "Save"),
    )
    expect(html).toContain('class="w-full mt-2"')
    expect(html.match(/\sclass=/g)?.length).toBe(1)
  })
})
