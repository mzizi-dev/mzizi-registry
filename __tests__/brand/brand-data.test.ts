import { describe, it, expect } from "vitest"
import {
  SEED_MINERALS,
  SEED_ECOSYSTEM_BRANDS,
  SEED_TYPE_SCALE,
  SEED_SPACING_SCALE,
  SEED_SEMANTIC_COLORS,
  SEED_BACKGROUNDS,
  SEED_COMPONENT_SPECS,
  SEED_ACCESSIBILITY,
  SEED_VOICE_AND_TONE,
  SEED_PHILOSOPHY,
  SEED_TYPOGRAPHY_FONTS,
  SEED_BRAND_SYSTEM,
} from "@/lib/brand"

describe("Brand Data Module", () => {
  describe("SEED_MINERALS", () => {
    it("has exactly 5 minerals", () => {
      expect(SEED_MINERALS).toHaveLength(5)
    })

    it("contains all five African minerals", () => {
      const names = SEED_MINERALS.map((m) => m.name)
      expect(names).toEqual(["cobalt", "tanzanite", "malachite", "gold", "terracotta"])
    })

    it("has correct hex values matching globals.css", () => {
      const hexMap: Record<string, string> = {
        cobalt: "#0047AB",
        tanzanite: "#B388FF",
        malachite: "#64FFDA",
        gold: "#FFD740",
        terracotta: "#D4A574",
      }
      for (const mineral of SEED_MINERALS) {
        expect(mineral.hex).toBe(hexMap[mineral.name])
      }
    })

    it("every mineral has required fields", () => {
      for (const mineral of SEED_MINERALS) {
        expect(mineral.name).toBeTruthy()
        expect(mineral.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(mineral.lightHex).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(mineral.darkHex).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(mineral.cssVar).toMatch(/^--color-/)
        expect(mineral.origin).toBeTruthy()
        expect(mineral.symbolism).toBeTruthy()
        expect(mineral.usage).toBeTruthy()
      }
    })

    it("every mineral has container colors", () => {
      for (const mineral of SEED_MINERALS) {
        expect(mineral.containerLight).toBeTruthy()
        expect(mineral.containerDark).toBeTruthy()
      }
    })
  })

  describe("SEED_ECOSYSTEM_BRANDS", () => {
    it("has 7 brands", () => {
      expect(SEED_ECOSYSTEM_BRANDS).toHaveLength(7)
    })

    it("contains all ecosystem brands", () => {
      const names = SEED_ECOSYSTEM_BRANDS.map((b) => b.name)
      expect(names).toContain("bundu")
      expect(names).toContain("nyuchi")
      expect(names).toContain("mukoko")
      expect(names).toContain("shamwari")
      expect(names).toContain("nhimbe")
      expect(names).toContain("bushtrade")
      expect(names).toContain("lingo")
    })

    it("all brand names are lowercase", () => {
      for (const brand of SEED_ECOSYSTEM_BRANDS) {
        expect(brand.name).toBe(brand.name.toLowerCase())
      }
    })

    it("every brand has required fields", () => {
      for (const brand of SEED_ECOSYSTEM_BRANDS) {
        expect(brand.meaning).toBeTruthy()
        expect(brand.language).toBeTruthy()
        expect(brand.role).toBeTruthy()
        expect(brand.description).toBeTruthy()
        expect(brand.voice).toBeTruthy()
        expect(brand.mineral).toBeTruthy()
        expect(brand.url).toMatch(/^https:\/\//)
      }
    })

    it("every brand references a valid mineral", () => {
      const mineralNames = SEED_MINERALS.map((m) => m.name)
      for (const brand of SEED_ECOSYSTEM_BRANDS) {
        expect(mineralNames).toContain(brand.mineral)
      }
    })
  })

  describe("SEED_TYPE_SCALE", () => {
    it("has entries from Display to Code", () => {
      const names = SEED_TYPE_SCALE.map((t) => t.name)
      expect(names).toContain("Display")
      expect(names).toContain("Body")
      expect(names).toContain("Caption")
      expect(names).toContain("Code")
    })

    it("sizes are in descending order", () => {
      for (let i = 0; i < SEED_TYPE_SCALE.length - 2; i++) {
        expect(SEED_TYPE_SCALE[i].sizePx).toBeGreaterThanOrEqual(SEED_TYPE_SCALE[i + 1].sizePx)
      }
    })

    it("fonts are valid", () => {
      const validFonts = ["sans", "serif", "mono"]
      for (const entry of SEED_TYPE_SCALE) {
        expect(validFonts).toContain(entry.font)
      }
    })

    it("Display is 72px", () => {
      const display = SEED_TYPE_SCALE.find((t) => t.name === "Display")
      expect(display?.sizePx).toBe(72)
    })

    it("Caption is 12px", () => {
      const caption = SEED_TYPE_SCALE.find((t) => t.name === "Caption")
      expect(caption?.sizePx).toBe(12)
    })
  })

  describe("SEED_SPACING_SCALE", () => {
    it("starts at 4px (xs) and ends at 64px (3xl)", () => {
      expect(SEED_SPACING_SCALE[0].px).toBe(4)
      expect(SEED_SPACING_SCALE[SEED_SPACING_SCALE.length - 1].px).toBe(64)
    })

    it("values are in ascending order", () => {
      for (let i = 0; i < SEED_SPACING_SCALE.length - 1; i++) {
        expect(SEED_SPACING_SCALE[i].px).toBeLessThan(SEED_SPACING_SCALE[i + 1].px)
      }
    })
  })

  describe("SEED_SEMANTIC_COLORS", () => {
    it("has success, error, warning, info", () => {
      const names = SEED_SEMANTIC_COLORS.map((c) => c.name)
      expect(names).toEqual(["success", "error", "warning", "info"])
    })

    it("every color has light and dark values", () => {
      for (const color of SEED_SEMANTIC_COLORS) {
        expect(color.light).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(color.dark).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })
  })

  describe("SEED_BACKGROUNDS", () => {
    it("has base, surface, muted", () => {
      const names = SEED_BACKGROUNDS.map((b) => b.name)
      expect(names).toEqual(["base", "surface", "muted"])
    })

    it("base light matches globals.css (#FAF9F5)", () => {
      const base = SEED_BACKGROUNDS.find((b) => b.name === "base")
      expect(base?.light).toBe("#FAF9F5")
    })

    it("base dark matches globals.css (#0A0A0A)", () => {
      const base = SEED_BACKGROUNDS.find((b) => b.name === "base")
      expect(base?.dark).toBe("#0A0A0A")
    })
  })

  describe("SEED_COMPONENT_SPECS", () => {
    it("includes core components", () => {
      const names = SEED_COMPONENT_SPECS.map((c) => c.name)
      expect(names).toContain("button")
      expect(names).toContain("input")
      expect(names).toContain("avatar")
      expect(names).toContain("badge")
      expect(names).toContain("card")
    })

    it("all touch targets are 48px", () => {
      for (const spec of SEED_COMPONENT_SPECS) {
        expect(spec.minTouchTarget).toBe(48)
      }
    })

    it("all specs have variants", () => {
      for (const spec of SEED_COMPONENT_SPECS) {
        expect(spec.variants.length).toBeGreaterThan(0)
      }
    })
  })

  describe("SEED_ACCESSIBILITY", () => {
    it("uses APCA 3.0 AAA standard", () => {
      expect(SEED_ACCESSIBILITY.standard).toBe("APCA 3.0 AAA")
    })

    it("has 56px default and 48px minimum touch targets", () => {
      expect(SEED_ACCESSIBILITY.defaultTouchTarget).toBe(56)
      expect(SEED_ACCESSIBILITY.minTouchTarget).toBe(48)
    })
  })

  describe("SEED_VOICE_AND_TONE", () => {
    it("has principles, do list, and don't list", () => {
      expect(SEED_VOICE_AND_TONE.principles.length).toBeGreaterThan(0)
      expect(SEED_VOICE_AND_TONE.doList.length).toBeGreaterThan(0)
      expect(SEED_VOICE_AND_TONE.dontList.length).toBeGreaterThan(0)
    })

    it("do list includes lowercase wordmark rule", () => {
      const hasLowercaseRule = SEED_VOICE_AND_TONE.doList.some((item) =>
        item.toLowerCase().includes("lowercase")
      )
      expect(hasLowercaseRule).toBe(true)
    })
  })

  describe("SEED_PHILOSOPHY", () => {
    it("is Ubuntu", () => {
      expect(SEED_PHILOSOPHY.name).toBe("Ubuntu")
      expect(SEED_PHILOSOPHY.meaning).toBe("I am because we are")
      expect(SEED_PHILOSOPHY.shona).toBe("Ndiri nekuti tiri")
    })

    it("has 4 architectural pillars", () => {
      expect(SEED_PHILOSOPHY.pillars).toHaveLength(4)
      const names = SEED_PHILOSOPHY.pillars.map((p) => p.name)
      expect(names).toContain("Local-First")
      expect(names).toContain("Mobile-First")
      expect(names).toContain("Open Source")
      expect(names).toContain("Open Data")
    })

    it("has 5 Ubuntu questions", () => {
      expect(SEED_PHILOSOPHY.ubuntuQuestions).toHaveLength(5)
    })

    it("has 3 tri-mode operations", () => {
      expect(SEED_PHILOSOPHY.triMode).toHaveLength(3)
      const names = SEED_PHILOSOPHY.triMode.map((m) => m.name)
      expect(names).toEqual(["Musha", "Basa", "Nhaka"])
    })

    it("has 7 covenants", () => {
      expect(SEED_PHILOSOPHY.covenants).toHaveLength(7)
    })
  })

  describe("SEED_TYPOGRAPHY_FONTS", () => {
    it("has sans, serif, mono", () => {
      expect(SEED_TYPOGRAPHY_FONTS.sans.family).toBe("Noto Sans")
      expect(SEED_TYPOGRAPHY_FONTS.serif.family).toBe("Noto Serif")
      expect(SEED_TYPOGRAPHY_FONTS.mono.family).toBe("JetBrains Mono")
    })
  })

  describe("SEED_BRAND_SYSTEM (API payload)", () => {
    it("has version 4.0.1", () => {
      expect(SEED_BRAND_SYSTEM.version).toBe("4.0.1")
    })

    it("has all required top-level keys", () => {
      expect(SEED_BRAND_SYSTEM.$schema).toBeTruthy()
      expect(SEED_BRAND_SYSTEM.name).toBeTruthy()
      expect(SEED_BRAND_SYSTEM.homepage).toBe("https://design.nyuchi.com/brand")
      expect(SEED_BRAND_SYSTEM.minerals).toBe(SEED_MINERALS)
      expect(SEED_BRAND_SYSTEM.ecosystem).toBe(SEED_ECOSYSTEM_BRANDS)
      expect(SEED_BRAND_SYSTEM.typography).toBeTruthy()
      expect(SEED_BRAND_SYSTEM.spacing).toBe(SEED_SPACING_SCALE)
      expect(SEED_BRAND_SYSTEM.semanticColors).toBe(SEED_SEMANTIC_COLORS)
      expect(SEED_BRAND_SYSTEM.backgrounds).toBe(SEED_BACKGROUNDS)
      expect(SEED_BRAND_SYSTEM.componentSpecs).toBe(SEED_COMPONENT_SPECS)
      expect(SEED_BRAND_SYSTEM.accessibility).toBe(SEED_ACCESSIBILITY)
      expect(SEED_BRAND_SYSTEM.voiceAndTone).toBe(SEED_VOICE_AND_TONE)
      expect(SEED_BRAND_SYSTEM.philosophy).toBe(SEED_PHILOSOPHY)
    })

    it("is JSON-serializable", () => {
      const json = JSON.stringify(SEED_BRAND_SYSTEM)
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe("4.0.1")
      expect(parsed.minerals).toHaveLength(5)
    })
  })
})
