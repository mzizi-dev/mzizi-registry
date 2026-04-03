/**
 * Mukoko Brand System — Types and database accessors.
 *
 * The DATABASE is the source of truth for all brand data.
 * This file exports types and re-exports async getters from lib/db.
 * Seed data (for initial DB population) lives in lib/db/seed-data/brand.ts.
 *
 * Install via: npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/utils
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Mineral {
  name: string
  hex: string
  lightHex: string
  darkHex: string
  containerLight: string
  containerDark: string
  cssVar: string
  origin: string
  symbolism: string
  usage: string
}

export interface EcosystemBrand {
  name: string
  meaning: string
  language: string
  role: string
  tier: "ecosystem" | "enterprise" | "consumer" | "sister"
  description: string
  voice: string
  mineral: string
  url: string
}

export interface TypeScaleEntry {
  name: string
  sizePx: number
  sizeRem: string
  lineHeight: string
  weight: number
  font: "sans" | "serif" | "mono"
  usage: string
}

export interface SpacingToken {
  name: string
  px: number
  rem: string
  usage: string
}

export interface ComponentSpec {
  name: string
  heights: Record<string, number>
  padding: string
  borderRadius: number
  minTouchTarget: number
  variants: string[]
}

export interface SemanticColor {
  name: string
  light: string
  dark: string
  usage: string
}

export interface BackgroundToken {
  name: string
  light: string
  dark: string
  usage: string
}

export interface MiniApp {
  name: string
  emoji: string
  layer: string
  description: string
}

export interface SubstrateComponent {
  name: string
  description: string
}

export interface NyuchiProduct {
  name: string
  description: string
  mukokoCounterpart?: string
}

export interface SisterBrand {
  name: string
  description: string
  url?: string
}

// ─── Database Getters (runtime source of truth) ─────────────────────────────
//
// The database is the source of truth. These re-export the async getters
// from lib/db so consumers can import from "@/lib/brand" as before.
// Seed data lives in lib/db/seed-data/brand.ts and is only used for
// initial database seeding via `pnpm db:seed`.

export {
  getMinerals,
  getEcosystemBrands,
  getTypography,
  getTypographyByType,
  getSpacing,
  getSemanticColors,
  getSemanticColorsByType,
  getBrandMeta,
  getBrandSystem,
} from "@/lib/db"

// Re-export seed data for backward compatibility with components that
// need synchronous access (tests, static builds without DB).
// These are prefixed to make it clear they are NOT the source of truth.
export {
  MINERALS as SEED_MINERALS,
  ECOSYSTEM_BRANDS as SEED_ECOSYSTEM_BRANDS,
  MUKOKO_MINI_APPS as SEED_MUKOKO_MINI_APPS,
  PLATFORM_SUBSTRATE as SEED_PLATFORM_SUBSTRATE,
  NYUCHI_PRODUCTS as SEED_NYUCHI_PRODUCTS,
  SISTER_BRANDS as SEED_SISTER_BRANDS,
  TYPE_SCALE as SEED_TYPE_SCALE,
  SPACING_SCALE as SEED_SPACING_SCALE,
  SEMANTIC_COLORS as SEED_SEMANTIC_COLORS,
  BACKGROUNDS as SEED_BACKGROUNDS,
  COMPONENT_SPECS as SEED_COMPONENT_SPECS,
  ACCESSIBILITY as SEED_ACCESSIBILITY,
  VOICE_AND_TONE as SEED_VOICE_AND_TONE,
  PHILOSOPHY as SEED_PHILOSOPHY,
  RADII as SEED_RADII,
  TYPOGRAPHY_FONTS as SEED_TYPOGRAPHY_FONTS,
  BRAND_SYSTEM as SEED_BRAND_SYSTEM,
} from "@/lib/db/seed-data/brand"
