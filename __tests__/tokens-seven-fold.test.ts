// The token system is a heptagon three times over: seven minerals, seven
// heritage tones, seven experimental. Every count claim in the codebase has
// drifted from that at least once.
//
// The platform token files each shipped FIVE minerals and FIVE heritage tones
// against a seven-and-seven system — no sodalite, copper, hematite or kalahari
// — until `scripts/sync-tokens.ts` made the DB the generator's only input. The
// prose drifted separately and later: `lib/tokens/index.ts` carried "TEN
// LISTING THEMES" and "Ten Colors of Africa" directly above a block holding
// fourteen, and two comments still said "five minerals" after the data said
// seven. Nothing failed, because no test asserted a count.
//
// These tests assert the counts, against the artifacts a reader actually
// consumes. They need no network: `palette.generated.ts` is the committed
// snapshot and `pnpm tokens:verify` is what proves it matches the database.

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { experimentalColors, heritageColors, minerals } from "@/lib/tokens/palette.generated"
import { listingThemes } from "@/lib/tokens"

const CSS = readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

/** Custom properties declared with a literal value, by prefix. */
function declared(prefix: string): string[] {
  const names = new Set<string>()
  for (const m of CSS.matchAll(new RegExp(`--${prefix}-([a-z]+)\\s*:\\s*#`, "g"))) {
    names.add(m[1])
  }
  return [...names].sort()
}

describe("the seven-fold palette", () => {
  it("has seven minerals, seven heritage tones and seven experimental", () => {
    expect(minerals).toHaveLength(7)
    expect(heritageColors).toHaveLength(7)
    expect(experimentalColors).toHaveLength(7)
  })

  it("names the four families that were once missing", () => {
    // These are the specific casualties of the five-against-seven era. Naming
    // them means a regression reads as "sodalite is gone", not "a count is 6".
    const mineralNames = minerals.map((m) => m.name)
    expect(mineralNames).toContain("sodalite")
    expect(mineralNames).toContain("copper")
    const heritageNames = heritageColors.map((h) => h.name)
    expect(heritageNames).toContain("hematite")
    expect(heritageNames).toContain("kalahari")
  })

  it("gives every experimental tone a distinct heptagon position 0-6", () => {
    const idx = experimentalColors.map((e) => e.heptagonIndex).sort((a, b) => a - b)
    expect(idx).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it("declares all 21 families as CSS custom properties", () => {
    expect(declared("mineral")).toHaveLength(7)
    expect(declared("heritage")).toHaveLength(7)
    expect(declared("exp")).toHaveLength(7)
  })

  it("declares every family in BOTH the light and dark blocks", () => {
    // A value present in only one theme block is how the platform files came to
    // serve dark colours to light-theme consumers.
    const darkAt = CSS.search(/^\.dark\s*\{/m)
    expect(darkAt).toBeGreaterThan(-1)
    const light = CSS.slice(0, darkAt)
    const dark = CSS.slice(darkAt)
    for (const { prefix, names } of [
      { prefix: "mineral", names: minerals.map((m) => m.name) },
      { prefix: "heritage", names: heritageColors.map((h) => h.name) },
      { prefix: "exp", names: experimentalColors.map((e) => e.name) },
    ]) {
      for (const name of names) {
        const decl = new RegExp(`--${prefix}-${name}\\s*:\\s*#`)
        expect(decl.test(light), `--${prefix}-${name} missing from the light block`).toBe(true)
        expect(decl.test(dark), `--${prefix}-${name} missing from the dark block`).toBe(true)
      }
    }
  })
})

describe("listing themes", () => {
  it("covers every mineral and heritage family", () => {
    // The gap this closes: the union type was written as ten and froze while the
    // collections grew to seven each, so four families existed as data and were
    // unreachable from code.
    for (const name of [...minerals.map((m) => m.name), ...heritageColors.map((h) => h.name)]) {
      expect(listingThemes, `listingThemes is missing "${name}"`).toHaveProperty(name)
    }
  })

  it("tags each palette theme with the family it came from", () => {
    for (const m of minerals) {
      expect(listingThemes[m.name as keyof typeof listingThemes].family).toBe("mineral")
    }
    for (const h of heritageColors) {
      expect(listingThemes[h.name as keyof typeof listingThemes].family).toBe("heritage")
    }
  })
})

describe("the ListingTheme union and the map agree", () => {
  // A prose guard was tried here first and removed: a regex cannot tell a claim
  // ("all five minerals") from a citation of a retired claim ("the platform
  // files emitted five minerals against a seven-and-seven system"), and the
  // second kind is worth keeping — it records why the first is wrong. The same
  // distinction applies to retired naming elsewhere in this repo.
  //
  // The structural invariant is checkable without that ambiguity: the union type
  // and the map must not disagree. Note this alone would NOT have caught the
  // original defect — union and map were consistent with each other while both
  // lagged the database. That gap is covered by "covers every mineral and
  // heritage family" above, which compares against the generated palette.
  it("declares exactly the keys the map defines", () => {
    const union = readFileSync(join(process.cwd(), "lib/tokens/index.ts"), "utf8")
    const block = union.match(/export type ListingTheme =([\s\S]*?)\n\n/)
    expect(block, "could not locate the ListingTheme union").not.toBeNull()
    const declared = [...block![1].matchAll(/\|\s*"([^"]+)"/g)].map((m) => m[1]).sort()
    const defined = Object.keys(listingThemes).sort()
    expect(declared).toEqual(defined)
  })
})
