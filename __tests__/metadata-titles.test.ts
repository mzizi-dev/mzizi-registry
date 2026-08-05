// Page titles must not repeat the brand the root template already appends.
//
// `app/layout.tsx` sets `title.template = "%s | Mzizi"`, so a page whose own
// title also ends in the brand renders twice over — the live site was serving
// "Components — Mzizi | Mzizi", "Colour tokens — mzizi.dev | Mzizi" and
// "Architecture — Mzizi DNA double helix | Mzizi".
//
// This is a discoverability defect, not a cosmetic one: the <title> is the
// first thing a crawler, a search result and a shared-link preview read, and
// the duplication eats the character budget that should carry the page's own
// identity. The `discoverability` skill's covenant — "if the machine can't see
// it, it doesn't exist" — is what this guards.
//
// Two pages also carried names that no longer exist: "mzizi design portal" and
// "nyuchi design portal" both predate the rename to Mzizi.

import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const APP = join(process.cwd(), "app")

function pageFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...pageFiles(full))
    else if (entry === "page.tsx" || entry === "layout.tsx") out.push(full)
  }
  return out
}

/** Every string assigned to a `title:` key, excluding non-metadata uses. */
function titlesIn(source: string): string[] {
  const out: string[] = []
  for (const m of source.matchAll(/\btitle:\s*"([^"]+)"/g)) out.push(m[1])
  return out
}

const FILES = pageFiles(APP)

// Retired names. The rename to Mzizi is complete; these describe nothing that
// still exists, so a title carrying one is stale by definition.
const RETIRED = [/mzizi design portal/i, /nyuchi design portal/i, /design\.nyuchi\.com/i]

describe("page metadata titles", () => {
  it("finds page files to check", () => {
    expect(FILES.length).toBeGreaterThan(5)
  })

  it("keeps the brand suffix in exactly one place — the root template", () => {
    const template = readFileSync(join(APP, "layout.tsx"), "utf8")
    expect(template).toContain('template: "%s | Mzizi"')

    const offenders: string[] = []
    for (const file of FILES) {
      // The root layout legitimately names the brand: it IS the template and
      // the default. Every other file inherits the suffix.
      if (file === join(APP, "layout.tsx")) continue
      const rel = file.slice(APP.length + 1)
      for (const title of titlesIn(readFileSync(file, "utf8"))) {
        // `app/page.tsx` is the site root; its title IS the brand, and the
        // template does not apply to `title.default`.
        if (rel === "page.tsx" && title === "Mzizi") continue
        if (/\bMzizi\b/.test(title) || /mzizi\.dev/i.test(title)) {
          offenders.push(`${rel}: "${title}"`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("carries no retired product name in a title", () => {
    const offenders: string[] = []
    for (const file of FILES) {
      const rel = file.slice(APP.length + 1)
      for (const title of titlesIn(readFileSync(file, "utf8"))) {
        if (RETIRED.some((r) => r.test(title))) offenders.push(`${rel}: "${title}"`)
      }
    }
    expect(offenders).toEqual([])
  })
})
