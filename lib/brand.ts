/**
 * Mukoko Brand System — Single source of truth for brand data.
 *
 * Powers both the documentation pages (/brand/*) and the brand API (/api/brand).
 * All hex values match the CSS custom properties in app/globals.css.
 *
 * Install via: npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/utils
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

// ─── Data ────────────────────────────────────────────────────────────────────

export const MINERALS: Mineral[] = [
  {
    name: "cobalt",
    hex: "#0047AB",
    lightHex: "#0047AB",
    darkHex: "#00B0FF",
    containerLight: "rgba(0, 71, 171, 0.08)",
    containerDark: "rgba(0, 176, 255, 0.12)",
    cssVar: "--color-cobalt",
    origin: "Katanga (DRC) and Zambian Copperbelt",
    symbolism: "Digital future, trust, knowledge",
    usage: "Primary blue, links, CTAs",
  },
  {
    name: "tanzanite",
    hex: "#B388FF",
    lightHex: "#4B0082",
    darkHex: "#B388FF",
    containerLight: "rgba(75, 0, 130, 0.08)",
    containerDark: "rgba(179, 136, 255, 0.12)",
    cssVar: "--color-tanzanite",
    origin: "Merelani Hills, Tanzania",
    symbolism: "Premium, creativity, connection",
    usage: "Purple accent, brand/logo, social features",
  },
  {
    name: "malachite",
    hex: "#64FFDA",
    lightHex: "#004D40",
    darkHex: "#64FFDA",
    containerLight: "rgba(0, 77, 64, 0.08)",
    containerDark: "rgba(100, 255, 218, 0.12)",
    cssVar: "--color-malachite",
    origin: "Congo Copper Belt",
    symbolism: "Growth, nature, success",
    usage: "Success states, positive actions",
  },
  {
    name: "gold",
    hex: "#FFD740",
    lightHex: "#5D4037",
    darkHex: "#FFD740",
    containerLight: "rgba(93, 64, 55, 0.08)",
    containerDark: "rgba(255, 215, 64, 0.12)",
    cssVar: "--color-gold",
    origin: "Ghana, South Africa, Mali",
    symbolism: "Honey, rewards, warmth",
    usage: "Achievements, rewards, highlights",
  },
  {
    name: "terracotta",
    hex: "#D4A574",
    lightHex: "#8B4513",
    darkHex: "#D4A574",
    containerLight: "rgba(139, 69, 19, 0.08)",
    containerDark: "rgba(212, 165, 116, 0.12)",
    cssVar: "--color-terracotta",
    origin: "Pan-African Sahel",
    symbolism: "Earth, community, grounding",
    usage: "Community features, warmth",
  },
]

export const ECOSYSTEM_BRANDS: EcosystemBrand[] = [
  {
    name: "bundu",
    meaning: "Wilderness",
    language: "Shona",
    role: "Parent ecosystem",
    description:
      "The overarching ecosystem vision. Technology serving African communities through interconnected, sustainable approaches rooted in ancestral wisdom.",
    voice: "Visionary, grounded, inclusive",
    mineral: "terracotta",
    url: "https://bundu.family",
  },
  {
    name: "nyuchi",
    meaning: "Bee",
    language: "Shona",
    role: "Action layer",
    description:
      "Collective action, pollination, community building. The industrious African bee spirit — workers building together and spreading ideas across communities.",
    voice: "Energetic, communal, industrious",
    mineral: "gold",
    url: "https://nyuchi.com",
  },
  {
    name: "mukoko",
    meaning: "Beehive",
    language: "Shona",
    role: "Structure layer",
    description:
      "Community gathering and storage. The digital home where the community lives, stores resources, and finds protection. Identity, journalism, social, events.",
    voice: "Welcoming, structured, protective",
    mineral: "tanzanite",
    url: "https://mukoko.com",
  },
  {
    name: "shamwari",
    meaning: "Friend",
    language: "Shona",
    role: "Intelligence layer",
    description:
      "AI companion service. A genuine companion designed to help, not replace. Emphasizes human connection and warmth over cold efficiency.",
    voice: "Helpful, warm, intelligent",
    mineral: "cobalt",
    url: "https://shamwari.ai",
  },
  {
    name: "nhimbe",
    meaning: "Gathering",
    language: "Shona",
    role: "Events layer",
    description:
      "Community event celebrations. Bringing people together for shared experiences, cultural events, and collaborative gatherings.",
    voice: "Celebratory, communal, vibrant",
    mineral: "malachite",
    url: "https://nhimbe.com",
  },
]

export const TYPE_SCALE: TypeScaleEntry[] = [
  { name: "Display", sizePx: 72, sizeRem: "4.5rem", lineHeight: "1.1", weight: 700, font: "serif", usage: "Hero headlines, landing pages" },
  { name: "H1", sizePx: 48, sizeRem: "3rem", lineHeight: "1.15", weight: 700, font: "serif", usage: "Page titles" },
  { name: "H2", sizePx: 36, sizeRem: "2.25rem", lineHeight: "1.2", weight: 600, font: "serif", usage: "Section headings" },
  { name: "H3", sizePx: 30, sizeRem: "1.875rem", lineHeight: "1.25", weight: 600, font: "serif", usage: "Sub-section headings" },
  { name: "H4", sizePx: 24, sizeRem: "1.5rem", lineHeight: "1.3", weight: 600, font: "sans", usage: "Card titles, group headings" },
  { name: "H5", sizePx: 20, sizeRem: "1.25rem", lineHeight: "1.4", weight: 600, font: "sans", usage: "Small headings" },
  { name: "Body Large", sizePx: 18, sizeRem: "1.125rem", lineHeight: "1.6", weight: 400, font: "sans", usage: "Lead paragraphs" },
  { name: "Body", sizePx: 16, sizeRem: "1rem", lineHeight: "1.6", weight: 400, font: "sans", usage: "Default body text" },
  { name: "Body Small", sizePx: 14, sizeRem: "0.875rem", lineHeight: "1.5", weight: 400, font: "sans", usage: "Secondary text, descriptions" },
  { name: "Caption", sizePx: 12, sizeRem: "0.75rem", lineHeight: "1.5", weight: 400, font: "sans", usage: "Labels, metadata, timestamps" },
  { name: "Code", sizePx: 14, sizeRem: "0.875rem", lineHeight: "1.6", weight: 400, font: "mono", usage: "Code blocks, terminal output" },
]

export const SPACING_SCALE: SpacingToken[] = [
  { name: "xs", px: 4, rem: "0.25rem", usage: "Tight gaps, icon padding" },
  { name: "sm", px: 8, rem: "0.5rem", usage: "Compact spacing, inline gaps" },
  { name: "md", px: 12, rem: "0.75rem", usage: "Default component padding" },
  { name: "base", px: 16, rem: "1rem", usage: "Standard spacing" },
  { name: "lg", px: 24, rem: "1.5rem", usage: "Section padding, card gaps" },
  { name: "xl", px: 32, rem: "2rem", usage: "Page margins, large gaps" },
  { name: "2xl", px: 48, rem: "3rem", usage: "Section margins" },
  { name: "3xl", px: 64, rem: "4rem", usage: "Page section spacing" },
]

export const SEMANTIC_COLORS: SemanticColor[] = [
  { name: "success", light: "#004D40", dark: "#64FFDA", usage: "Success states, positive actions" },
  { name: "error", light: "#B3261E", dark: "#F2B8B5", usage: "Error states, destructive actions" },
  { name: "warning", light: "#7A5C00", dark: "#FFD866", usage: "Warning states, caution" },
  { name: "info", light: "#0047AB", dark: "#00B0FF", usage: "Informational states" },
]

export const BACKGROUNDS: BackgroundToken[] = [
  { name: "base", light: "#FAF9F5", dark: "#0A0A0A", usage: "Page background" },
  { name: "surface", light: "#FFFFFF", dark: "#141414", usage: "Cards, elevated surfaces" },
  { name: "muted", light: "#F3F2EE", dark: "#1E1E1E", usage: "Subdued backgrounds, secondary surfaces" },
]

export const COMPONENT_SPECS: ComponentSpec[] = [
  {
    name: "button",
    heights: { sm: 32, default: 36, lg: 44, icon: 36 },
    padding: "px-3 (sm), px-4 (default), px-6 (lg)",
    borderRadius: 12,
    minTouchTarget: 48,
    variants: ["default", "destructive", "outline", "secondary", "ghost", "link"],
  },
  {
    name: "input",
    heights: { default: 40, sm: 32 },
    padding: "px-3",
    borderRadius: 12,
    minTouchTarget: 48,
    variants: ["default", "error"],
  },
  {
    name: "avatar",
    heights: { xs: 24, sm: 32, default: 40, lg: 48, xl: 64 },
    padding: "none",
    borderRadius: 9999,
    minTouchTarget: 48,
    variants: ["image", "fallback"],
  },
  {
    name: "badge",
    heights: { default: 22 },
    padding: "px-2.5 py-0.5",
    borderRadius: 9999,
    minTouchTarget: 48,
    variants: ["default", "secondary", "destructive", "outline"],
  },
  {
    name: "card",
    heights: { auto: 0 },
    padding: "p-6",
    borderRadius: 16,
    minTouchTarget: 48,
    variants: ["default", "accented", "clickable"],
  },
  {
    name: "toggle",
    heights: { default: 24 },
    padding: "none",
    borderRadius: 9999,
    minTouchTarget: 48,
    variants: ["on", "off"],
  },
  {
    name: "checkbox",
    heights: { default: 20 },
    padding: "none",
    borderRadius: 4,
    minTouchTarget: 48,
    variants: ["checked", "unchecked", "indeterminate"],
  },
]

export const ACCESSIBILITY = {
  standard: "APCA 3.0 AAA",
  contrastDescription: "Advanced Perceptual Contrast Algorithm for superior readability across all mineral colors",
  minTouchTarget: 48,
  focusIndicator: "2px ring with ring-offset-2, using --ring token",
  keyboardNavigation: "Full keyboard support via Radix UI primitives",
  screenReaders: "Semantic HTML with ARIA attributes where needed",
}

export const VOICE_AND_TONE = {
  principles: [
    "Speak like a knowledgeable friend, not a corporation",
    "Use simple, clear language — avoid jargon",
    "Be warm and encouraging, never condescending",
    "Respect African cultural context and diversity",
    "Prefer active voice and direct address",
  ],
  doList: [
    "Use lowercase for all brand wordmarks (mukoko, nyuchi, shamwari, bundu, nhimbe)",
    "Reference African origins and meanings when contextually appropriate",
    "Write in a way that welcomes both technical and non-technical readers",
    "Use inclusive language that reflects Ubuntu philosophy",
  ],
  dontList: [
    "Don't capitalize brand wordmarks (not Mukoko, not NYUCHI)",
    "Don't use overly formal or corporate language",
    "Don't assume Western-centric cultural references",
    "Don't use jargon without explanation",
  ],
}

export const PHILOSOPHY = {
  name: "Ubuntu",
  meaning: "I am because we are",
  pillars: [
    { name: "Family", description: "The foundation of community" },
    { name: "Community", description: "Collective strength through shared purpose" },
    { name: "Society", description: "Building systems that serve everyone" },
    { name: "Environment", description: "Technology in harmony with nature" },
    { name: "Spirituality", description: "Meaning and connection beyond the material" },
  ],
}

export const RADII = {
  base: "0.75rem (12px)",
  sm: "calc(var(--radius) - 4px) — 8px",
  md: "calc(var(--radius) - 2px) — 10px",
  lg: "var(--radius) — 12px",
  xl: "calc(var(--radius) + 4px) — 16px",
  "2xl": "calc(var(--radius) + 8px) — 20px",
  "3xl": "calc(var(--radius) + 12px) — 24px",
  "4xl": "calc(var(--radius) + 16px) — 28px",
  full: "9999px — pills/avatars",
}

export const TYPOGRAPHY_FONTS = {
  sans: { family: "Noto Sans", usage: "All body text, UI labels", reason: "Broad language support including African languages and diacritics" },
  serif: { family: "Noto Serif", usage: "Page titles, hero text, display headings", reason: "Elegant display type with matching language coverage" },
  mono: { family: "JetBrains Mono", usage: "Code blocks, terminal output, technical content", reason: "Purpose-built for developer readability" },
}

// ─── Full Brand System (for API serialization) ──────────────────────────────

export const BRAND_SYSTEM = {
  $schema: "https://registry.mukoko.com/schema/brand.json",
  "@context": "https://schema.org",
  "@type": "Brand",
  version: "4.0.1",
  name: "Mukoko Brand System",
  lastUpdated: "2026-03-09",
  homepage: "https://registry.mukoko.com/brand",
  minerals: MINERALS,
  ecosystem: ECOSYSTEM_BRANDS,
  typography: {
    fonts: TYPOGRAPHY_FONTS,
    scale: TYPE_SCALE,
  },
  spacing: SPACING_SCALE,
  radii: RADII,
  semanticColors: SEMANTIC_COLORS,
  backgrounds: BACKGROUNDS,
  componentSpecs: COMPONENT_SPECS,
  accessibility: ACCESSIBILITY,
  voiceAndTone: VOICE_AND_TONE,
  philosophy: PHILOSOPHY,
}
