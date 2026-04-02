import { describe, it, expect } from "vitest"
import {
  MINERALS,
  ECOSYSTEM_BRANDS,
  TYPE_SCALE,
  SPACING_SCALE,
  SEMANTIC_COLORS,
  BACKGROUNDS,
  COMPONENT_SPECS,
  ACCESSIBILITY,
  VOICE_AND_TONE,
  PHILOSOPHY,
  TYPOGRAPHY_FONTS,
  BRAND_SYSTEM,
} from "@/lib/brand"

describe("Brand Data Module", () => {
  describe("MINERALS", () => {
    it("has exactly 5 minerals", () => {
      expect(MINERALS).toHaveLength(5)
    })

    it("contains all five African minerals", () => {
      const names = MINERALS.map((m) => m.name)
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
      for (const mineral of MINERALS) {
        expect(mineral.hex).toBe(hexMap[mineral.name])
      }
    })

    it("every mineral has required fields", () => {
      for (const mineral of MINERALS) {
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
      for (const mineral of MINERALS) {
        expect(mineral.containerLight).toBeTruthy()
        expect(mineral.containerDark).toBeTruthy()
      }
    })
  })

  describe("ECOSYSTEM_BRANDS", () => {
    it("has 7 brands", () => {
      expect(ECOSYSTEM_BRANDS).toHaveLength(7)
    })

    it("contains all ecosystem brands", () => {
      const names = ECOSYSTEM_BRANDS.map((b) => b.name)
      expect(names).toContain("bundu")
      expect(names).toContain("nyuchi")
      expect(names).toContain("mukoko")
      expect(names).toContain("shamwari")
      expect(names).toContain("nhimbe")
      expect(names).toContain("bushtrade")
      expect(names).toContain("lingo")
    })

    it("all brand names are lowercase", () => {
      for (const brand of ECOSYSTEM_BRANDS) {
        expect(brand.name).toBe(brand.name.toLowerCase())
      }
    })

    it("every brand has required fields", () => {
      for (const brand of ECOSYSTEM_BRANDS) {
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
      const mineralNames = MINERALS.map((m) => m.name)
      for (const brand of ECOSYSTEM_BRANDS) {
        expect(mineralNames).toContain(brand.mineral)
      }
    })
  })

  describe("TYPE_SCALE", () => {
    it("has entries from Display to Code", () => {
      const names = TYPE_SCALE.map((t) => t.name)
      expect(names).toContain("Display")
      expect(names).toContain("Body")
      expect(names).toContain("Caption")
      expect(names).toContain("Code")
    })

    it("sizes are in descending order", () => {
      for (let i = 0; i < TYPE_SCALE.length - 2; i++) {
        expect(TYPE_SCALE[i].sizePx).toBeGreaterThanOrEqual(TYPE_SCALE[i + 1].sizePx)
      }
    })

    it("fonts are valid", () => {
      const validFonts = ["sans", "serif", "mono"]
      for (const entry of TYPE_SCALE) {
        expect(validFonts).toContain(entry.font)
      }
    })

    it("Display is 72px", () => {
      const display = TYPE_SCALE.find((t) => t.name === "Display")
      expect(display?.sizePx).toBe(72)
    })

    it("Caption is 12px", () => {
      const caption = TYPE_SCALE.find((t) => t.name === "Caption")
      expect(caption?.sizePx).toBe(12)
    })
  })

  describe("SPACING_SCALE", () => {
    it("starts at 4px (xs) and ends at 64px (3xl)", () => {
      expect(SPACING_SCALE[0].px).toBe(4)
      expect(SPACING_SCALE[SPACING_SCALE.length - 1].px).toBe(64)
    })

    it("values are in ascending order", () => {
      for (let i = 0; i < SPACING_SCALE.length - 1; i++) {
        expect(SPACING_SCALE[i].px).toBeLessThan(SPACING_SCALE[i + 1].px)
      }
    })
  })

  describe("SEMANTIC_COLORS", () => {
    it("has success, error, warning, info", () => {
      const names = SEMANTIC_COLORS.map((c) => c.name)
      expect(names).toEqual(["success", "error", "warning", "info"])
    })

    it("every color has light and dark values", () => {
      for (const color of SEMANTIC_COLORS) {
        expect(color.light).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(color.dark).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })
  })

  describe("BACKGROUNDS", () => {
    it("has base, surface, muted", () => {
      const names = BACKGROUNDS.map((b) => b.name)
      expect(names).toEqual(["base", "surface", "muted"])
    })

    it("base light matches globals.css (#FAF9F5)", () => {
      const base = BACKGROUNDS.find((b) => b.name === "base")
      expect(base?.light).toBe("#FAF9F5")
    })

    it("base dark matches globals.css (#0A0A0A)", () => {
      const base = BACKGROUNDS.find((b) => b.name === "base")
      expect(base?.dark).toBe("#0A0A0A")
    })
  })

  describe("COMPONENT_SPECS", () => {
    it("includes core components", () => {
      const names = COMPONENT_SPECS.map((c) => c.name)
      expect(names).toContain("button")
      expect(names).toContain("input")
      expect(names).toContain("avatar")
      expect(names).toContain("badge")
      expect(names).toContain("card")
    })

    it("all touch targets are 48px", () => {
      for (const spec of COMPONENT_SPECS) {
        expect(spec.minTouchTarget).toBe(48)
      }
    })

    it("all specs have variants", () => {
      for (const spec of COMPONENT_SPECS) {
        expect(spec.variants.length).toBeGreaterThan(0)
      }
    })
  })

  describe("ACCESSIBILITY", () => {
    it("uses APCA 3.0 AAA standard", () => {
      expect(ACCESSIBILITY.standard).toBe("APCA 3.0 AAA")
    })

    it("has 48px minimum touch target", () => {
      expect(ACCESSIBILITY.minTouchTarget).toBe(48)
    })
  })

  describe("VOICE_AND_TONE", () => {
    it("has principles, do list, and don't list", () => {
      expect(VOICE_AND_TONE.principles.length).toBeGreaterThan(0)
      expect(VOICE_AND_TONE.doList.length).toBeGreaterThan(0)
      expect(VOICE_AND_TONE.dontList.length).toBeGreaterThan(0)
    })

    it("do list includes lowercase wordmark rule", () => {
      const hasLowercaseRule = VOICE_AND_TONE.doList.some((item) =>
        item.toLowerCase().includes("lowercase")
      )
      expect(hasLowercaseRule).toBe(true)
    })
  })

  describe("PHILOSOPHY", () => {
    it("is Ubuntu", () => {
      expect(PHILOSOPHY.name).toBe("Ubuntu")
      expect(PHILOSOPHY.meaning).toBe("I am because we are")
    })

    it("has 5 pillars", () => {
      expect(PHILOSOPHY.pillars).toHaveLength(5)
    })
  })

  describe("TYPOGRAPHY_FONTS", () => {
    it("has sans, serif, mono", () => {
      expect(TYPOGRAPHY_FONTS.sans.family).toBe("Noto Sans")
      expect(TYPOGRAPHY_FONTS.serif.family).toBe("Noto Serif")
      expect(TYPOGRAPHY_FONTS.mono.family).toBe("JetBrains Mono")
    })
  })

  describe("BRAND_SYSTEM (API payload)", () => {
    it("has version 4.0.1", () => {
      expect(BRAND_SYSTEM.version).toBe("4.0.1")
    })

    it("has all required top-level keys", () => {
      expect(BRAND_SYSTEM.$schema).toBeTruthy()
      expect(BRAND_SYSTEM.name).toBeTruthy()
      expect(BRAND_SYSTEM.homepage).toBe("https://design.nyuchi.com/brand")
      expect(BRAND_SYSTEM.minerals).toBe(MINERALS)
      expect(BRAND_SYSTEM.ecosystem).toBe(ECOSYSTEM_BRANDS)
      expect(BRAND_SYSTEM.typography).toBeTruthy()
      expect(BRAND_SYSTEM.spacing).toBe(SPACING_SCALE)
      expect(BRAND_SYSTEM.semanticColors).toBe(SEMANTIC_COLORS)
      expect(BRAND_SYSTEM.backgrounds).toBe(BACKGROUNDS)
      expect(BRAND_SYSTEM.componentSpecs).toBe(COMPONENT_SPECS)
      expect(BRAND_SYSTEM.accessibility).toBe(ACCESSIBILITY)
      expect(BRAND_SYSTEM.voiceAndTone).toBe(VOICE_AND_TONE)
      expect(BRAND_SYSTEM.philosophy).toBe(PHILOSOPHY)
    })

    it("is JSON-serializable", () => {
      const json = JSON.stringify(BRAND_SYSTEM)
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe("4.0.1")
      expect(parsed.minerals).toHaveLength(5)
    })
  })
})
