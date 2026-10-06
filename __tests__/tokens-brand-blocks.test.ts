// The brand blocks of `mzizi-tokens-globals.css` used to type each brand's
// mineral into `scripts/render-globals-css.ts` by hand. Canon's brand record —
// `ecosystem` in `lib/tokens/brand.source.ts`, served as `/v1/brand` — had no
// `mzizi` row, so the stylesheet borrowed nyuchi's gold for mzizi and for its
// own default `--primary`, while `@bundu/ui`'s overlay guessed hematite. Two
// answers for one brand.
//
// The owner decided hematite (2026-09-30). These tests read the COMMITTED
// stylesheet (the file a consumer copies) and assert it agrees with the brand
// record for every brand that has one, including the default.

import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { ecosystem, ecosystemAliases, resolveEcosystemName } from "@/lib/tokens/brand.source"
import { brandOverrides, brandIndustryCategories } from "@/lib/tokens"
import { heritageColors, experimentalColors } from "@/lib/tokens/palette.generated"
import { BRANDS, BRAND_ALIASES, DEFAULT_BRAND } from "../scripts/render-globals-css"

const CSS = readFileSync(
  join(process.cwd(), "components/registry/n1-tokens/mzizi-tokens-globals.css"),
  "utf8"
)

function aaVar(family: string): string {
  if (heritageColors.some((h) => h.name === family)) return `--heritage-${family}-aa`
  if (experimentalColors.some((e) => e.name === family)) return `--exp-${family}-aa`
  return `--mineral-${family}-aa`
}

function blockPrimary(brand: string): string | undefined {
  // `[^{}]*` lets the brand sit anywhere in a selector list, so a block that
  // also carries a deprecated alias (`[data-brand="events"], [data-brand="nhimbe"]`)
  // matches for both names.
  const m = CSS.match(new RegExp(`\\[data-brand="${brand}"\\][^{}]*\\{[^}]*--primary:\\s*var\\((--[a-z-]+)\\)`))
  return m?.[1]
}

describe("mzizi-tokens-globals.css brand blocks", () => {
  it("maps mzizi to hematite, the owner's decision", () => {
    expect(ecosystem.find((b) => b.name === "mzizi")?.mineral).toBe("hematite")
    expect(blockPrimary("mzizi")).toBe("--heritage-hematite-aa")
  })

  it("agrees with the brand record for every brand that has one", () => {
    for (const [brand] of BRANDS) {
      const row = ecosystem.find((b) => b.name === brand)
      if (!row) continue
      expect(blockPrimary(brand), brand).toBe(aaVar(row.mineral))
    }
  })

  /**
   * The `mzizi-tokens` crate is NOT a copy of this stylesheet. Its
   * `src/generated/mzizi-tokens-rust.rs` is `pnpm rust:generate`'s copy of
   * `components/registry/n1-tokens/mzizi-tokens-rust.rs`, which
   * `scripts/sync-tokens.ts` `renderRust()` writes from the palette alone
   * (minerals, heritage, experimental), and `generate-rust-components.mjs`
   * copies only `.rs` files. So it has no brand default for this change to
   * move. If one is ever added, this fails and it must follow the brand
   * record like the CSS does.
   */
  it("leaves no brand default in the mzizi-tokens Rust crate to drift", () => {
    for (const file of [
      "components/registry/n1-tokens/mzizi-tokens-rust.rs",
      "mzizi-rs/crates/mzizi-tokens/src/generated/mzizi-tokens-rust.rs",
    ]) {
      const rust = readFileSync(join(process.cwd(), file), "utf8")
      expect(rust, file).not.toMatch(/\bprimary\b|DEFAULT_BRAND|data-brand/i)
      expect(rust, file).toMatch(/pub const HEMATITE_LIGHT: &str = "#[0-9A-F]{6}";/)
    }
  })

  it("resolves the default --primary through the default brand's family", () => {
    expect(DEFAULT_BRAND).toBe("mzizi")
    const root = CSS.slice(CSS.indexOf(":root {"), CSS.indexOf("/* ════ DARK"))
    const primaries = [...root.matchAll(/^\s*--primary:\s*var\((--[a-z-]+)\);/gm)].map((m) => m[1])
    expect(primaries).toEqual([aaVar("hematite")])
  })

  // Owner decisions, 2026-10-04 (mzizi-registry#404).
  it("records the 2026-10-04 brand mineral decisions in canon", () => {
    const mineralOf = (brand: string) => ecosystem.find((b) => b.name === brand)?.mineral
    expect(mineralOf("kweli")).toBe("malachite")
    expect(mineralOf("learning")).toBe("gold")
    expect(mineralOf("news")).toBe("cobalt")
    expect(mineralOf("weather")).toBe("cobalt")
    expect(blockPrimary("kweli")).toBe("--mineral-malachite-aa")
    expect(blockPrimary("learning")).toBe("--mineral-gold-aa")
    expect(blockPrimary("weather")).toBe("--mineral-cobalt-aa")
  })

  it("keeps every Nyuchi category gold, education included", () => {
    expect(brandIndustryCategories.nyuchi.education.mineral).toBe("gold")
  })

  it("keeps the mini-app accent table on canon's mineral for every brand canon has", () => {
    for (const [brand, accent] of Object.entries(brandOverrides)) {
      const row = ecosystem.find((b) => b.name === brand)
      if (!row) continue
      expect(accent.mineral, brand).toBe(row.mineral)
    }
  })
  // Owner decision, 2026-10-06: Mukoko Circles is tanzanite (Mukoko's
  // mineral) with a terracotta accent, which its block sets as --brand-accent.
  it("gives Mukoko Circles tanzanite with a terracotta --brand-accent", () => {
    const row = ecosystem.find((b) => b.name === "circles")
    expect(row?.mineral).toBe("tanzanite")
    expect(row?.accent).toBe("terracotta")
    expect(blockPrimary("circles")).toBe("--mineral-tanzanite-aa")
    const block = CSS.match(/\[data-brand="circles"\][^{}]*\{([^}]*)\}/)?.[1] ?? ""
    expect(block).toMatch(/--brand-accent:\s*var\(--mineral-terracotta-aa\)/)
  })

  it("sets --brand-accent only in the blocks of brands whose canon row names an accent", () => {
    for (const [brand] of BRANDS) {
      const row = ecosystem.find((b) => b.name === brand)
      const block = CSS.match(new RegExp(`\\[data-brand="${brand}"\\][^{}]*\\{([^}]*)\\}`))?.[1] ?? ""
      if (row?.accent) expect(block, brand).toContain(`--brand-accent: var(${aaVar(row.accent)})`)
      else expect(block, brand).not.toContain("--brand-accent")
    }
  })

  // Owner decision, 2026-10-04 (mukoko-dev/nhimbe#155): the nhimbe brand is
  // retired; the events platform is Mukoko Events at events.mukoko.com, and
  // its mineral stays malachite. `nhimbe` stays a deprecated alias.
  it("records Mukoko Events as the `events` row, with nhimbe as a deprecated alias", () => {
    const row = ecosystem.find((b) => b.name === "events")
    expect(row?.displayName).toBe("Mukoko Events")
    expect(row?.url).toBe("https://events.mukoko.com")
    expect(row?.mineral).toBe("malachite")
    expect(row?.aliases).toContain("nhimbe")
    expect(ecosystem.some((b) => b.name === "nhimbe")).toBe(false)
    expect(ecosystemAliases.nhimbe).toBe("events")
    expect(resolveEcosystemName("nhimbe")).toBe("events")
    expect(resolveEcosystemName("kweli")).toBe("kweli")
  })

  it("keeps data-brand=\"nhimbe\" resolving to the events block", () => {
    expect(BRAND_ALIASES.nhimbe).toBe("events")
    expect(blockPrimary("events")).toBe("--mineral-malachite-aa")
    expect(blockPrimary("nhimbe")).toBe("--mineral-malachite-aa")
    expect(brandOverrides.events.mineral).toBe("malachite")
    expect(brandOverrides.nhimbe).toEqual(brandOverrides.events)
  })

  it("never lets an alias shadow a live canon row", () => {
    for (const alias of Object.keys(ecosystemAliases)) {
      expect(ecosystem.some((b) => b.name === alias), alias).toBe(false)
    }
  })
})
