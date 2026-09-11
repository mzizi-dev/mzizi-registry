/**
 * CROSS-SURFACE FAMILY PARITY.
 *
 * Mzizi publishes its design tokens through three distribution surfaces — the
 * MCP server and `/v1/brand`, the shadcn registry, and the crates registry —
 * and those surfaces are supposed to carry the same palette. For most of this
 * repo's life they did not, and nothing said so.
 *
 * The specific failure: `generateCSSVariables()` in the TypeScript token file
 * carried two literal arrays, five minerals and five heritage tones, written
 * when the palette was five-and-five. The palette grew to seven-and-seven, then
 * gained the experimental seven. The arrays did not move. A consumer installing
 * `nyuchi-tokens-typescript` got ten of twenty-one families; a consumer reading
 * `/v1/brand` got all twenty-one; and `sodalite` did not appear anywhere in the
 * TypeScript file at all. The six generated platform files had a narrower
 * version of the same hole — seven and seven, but no experimental.
 *
 * WHY THE EXISTING GATES DID NOT CATCH IT, which is the part worth keeping:
 *
 *   - `pnpm tokens:verify` (scripts/sync-tokens.ts --check) is a real gate, and
 *     it does fail the build on drift — but only for the artifacts it writes.
 *     `nyuchi-tokens-typescript.ts` is not one of them. It compared six files
 *     against the source and was silent about the seventh, which was the one
 *     that was wrong.
 *   - `__tests__/tokens-seven-fold.test.ts` asserts the counts, but against
 *     `palette.generated.ts` and `app/globals.css` — the two artifacts that were
 *     already correct. It never looked at an emitter.
 *
 * Both gates were pointed at the source and at the surfaces nearest it. The
 * divergence lived at the far end. So this file walks the far end: it reads the
 * canonical palette, then reads all SEVEN emitters as a consumer would — as
 * text, in the language each one is published in — and asserts the family sets
 * match. Adding a family to the palette without running `pnpm tokens:sync`
 * fails here, naming the surface and the missing family.
 *
 * It asserts which families are PRESENT, not which hexes they carry. That is
 * the defect being closed, and it is deliberately the whole scope: see the
 * "KNOWN DIVERGENCE" note in `nyuchi-tokens-typescript.ts` for six hexes that
 * do not match the palette and need a decision rather than a quiet edit.
 */

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { experimentalColors, heritageColors, minerals } from "@/lib/tokens/palette.source"
import { paletteFamilies } from "@/components/registry/n1-tokens/nyuchi-tokens-typescript"

const N1 = join(process.cwd(), "components/registry/n1-tokens")
const read = (file: string) => readFileSync(join(N1, file), "utf8")

/** The canonical family set, from the one file where a colour is authored. */
const EXPECTED = {
  mineral: minerals.map((m) => m.name),
  heritage: heritageColors.map((h) => h.name),
  experimental: experimentalColors.map((e) => e.name),
}
const EXPECTED_ALL = [...EXPECTED.mineral, ...EXPECTED.heritage, ...EXPECTED.experimental].sort()

/**
 * Pull family names out of an emitter by matching its dark-theme declaration.
 *
 * Matching the emitted SYNTAX rather than reading a structured export is the
 * point: it is what a Swift or Kotlin consumer actually compiles against, and
 * it cannot be satisfied by a file that merely mentions the name in a comment.
 */
const sorted = (names: string[]) => [...new Set(names)].sort()
function scan(source: string, pattern: RegExp, normalise: (s: string) => string): string[] {
  return sorted([...source.matchAll(pattern)].map((m) => normalise(m[1])))
}
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/** Every emitter, and how to read the family set back out of it. */
const EMITTERS: { name: string; file: string; families: () => string[] }[] = [
  {
    name: "swift",
    file: "nyuchi-tokens-swift.swift",
    // static let nyuchiEmberDark  = Color(hex: "#DA8766")
    families: () =>
      scan(read("nyuchi-tokens-swift.swift"), /static let nyuchi(\w+?)Dark\b/g, lowerFirst),
  },
  {
    name: "kotlin",
    file: "nyuchi-tokens-kotlin.kt",
    // val EmberDark  = Color(0xFFDA8766)
    families: () =>
      scan(read("nyuchi-tokens-kotlin.kt"), /val (\w+?)Dark\s*=\s*Color\(/g, lowerFirst),
  },
  {
    name: "arkts",
    file: "nyuchi-tokens-arkts.ets",
    // emberDark: "#DA8766",
    families: () => scan(read("nyuchi-tokens-arkts.ets"), /(\w+?)Dark:\s*"#/g, (s) => s),
  },
  {
    name: "react-native",
    file: "nyuchi-tokens-react-native.ts",
    families: () => scan(read("nyuchi-tokens-react-native.ts"), /(\w+?)Dark:\s*"#/g, (s) => s),
  },
  {
    name: "python",
    file: "nyuchi-tokens-python.py",
    // EMBER_DARK: str = "#DA8766"
    families: () =>
      scan(read("nyuchi-tokens-python.py"), /(\w+?)_DARK:\s*str\s*=/g, (s) => s.toLowerCase()),
  },
  {
    name: "rust",
    file: "nyuchi-tokens-rust.rs",
    // pub const EMBER_DARK: &str = "#DA8766";
    families: () =>
      scan(read("nyuchi-tokens-rust.rs"), /pub const (\w+?)_DARK:\s*&str/g, (s) => s.toLowerCase()),
  },
  {
    name: "typescript",
    file: "nyuchi-tokens-typescript.ts",
    // Asked through the module's own derivation, so a regression in
    // `paletteFamilies()` — the function `generateCSSVariables()` depends on —
    // fails here rather than passing on the strength of the raw table.
    families: () => sorted(paletteFamilies().map(([name]) => name)),
  },
]

describe("every token emitter carries the canonical family set", () => {
  it("covers all seven emitters", () => {
    // A parity suite that quietly stops covering a surface is worse than none:
    // it reports green for six files while the seventh drifts. This is the
    // guard on the guard.
    expect(EMITTERS.map((e) => e.name).sort()).toEqual([
      "arkts",
      "kotlin",
      "python",
      "react-native",
      "rust",
      "swift",
      "typescript",
    ])
  })

  it("agrees with the palette on how many families exist", () => {
    expect(EXPECTED.mineral).toHaveLength(7)
    expect(EXPECTED.heritage).toHaveLength(7)
    expect(EXPECTED.experimental).toHaveLength(7)
    expect(EXPECTED_ALL).toHaveLength(21)
  })

  for (const emitter of EMITTERS) {
    describe(emitter.name, () => {
      it(`declares exactly the 21 families in lib/tokens/palette.source.ts`, () => {
        // toEqual on the sorted sets, rather than a length check or a series of
        // `toContain`s, so the failure message prints both the missing families
        // and any the emitter invented.
        expect(emitter.families(), `${emitter.file} diverged from the palette`).toEqual(
          EXPECTED_ALL
        )
      })

      for (const [group, names] of Object.entries(EXPECTED)) {
        it(`carries all seven ${group} families`, () => {
          const have = emitter.families()
          const missing = names.filter((n) => !have.includes(n))
          expect(missing, `${emitter.file} is missing ${group}: ${missing.join(", ")}`).toEqual([])
        })
      }
    })
  }

  it("names sodalite in every emitter", () => {
    // sodalite is the canary. It appeared ZERO times in the TypeScript token
    // file, and it is the family whose absence proved the five-name arrays were
    // still live rather than merely untidy. Asserted by name so a regression
    // reads as "sodalite is gone from kotlin", not "expected 21, got 20".
    for (const emitter of EMITTERS) {
      expect(emitter.families(), `${emitter.file} is missing sodalite`).toContain("sodalite")
    }
  })
})

describe("the derived family list", () => {
  it("tags each family with the group it belongs to", () => {
    const byName = new Map(paletteFamilies())
    for (const [group, names] of Object.entries(EXPECTED)) {
      for (const name of names) {
        expect(byName.get(name), `${name} should be tagged "${group}"`).toBe(group)
      }
    }
  })

  it("is derived from the token data, not from a literal list", () => {
    // The regression this forbids is precise: someone "fixes" a future gap by
    // pasting the current family names back into generateCSSVariables. That
    // passes every assertion above on the day it is written and rots exactly as
    // the five-name arrays did. Deriving the keys is the fix; a longer literal
    // is the bug wearing a bigger coat.
    const source = readFileSync(join(N1, "nyuchi-tokens-typescript.ts"), "utf8")
    const fn = source.match(/export function generateCSSVariables\(([\s\S]*?)\n\}/)
    expect(fn, "could not locate generateCSSVariables").not.toBeNull()
    // Comments are stripped first, and that distinction matters: the comment
    // inside that function QUOTES the retired five-name arrays in order to
    // explain why they are gone. A citation of a bad pattern is worth keeping;
    // a use of it is not, and a regex cannot tell them apart unless the
    // comments are removed. (`__tests__/tokens-seven-fold.test.ts` reaches the
    // same conclusion about the retired palette name, for the same reason.)
    const body = fn![1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")
    for (const name of EXPECTED_ALL) {
      expect(
        body.includes(`"${name}"`),
        `generateCSSVariables names "${name}" literally — derive it from primitives.color instead`
      ).toBe(false)
    }
  })
})
