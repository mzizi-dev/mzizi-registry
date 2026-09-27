/**
 * THE BUNDU BRAND SYSTEM — everything `/api/v1/brand` serves that is not a
 * colour family. THIS FILE IS THE SOURCE OF TRUTH. Edit the brand here.
 *
 * Until 2026-09 these six collections were read out of Supabase at request
 * time by `getBrandSystem()` — `brand_semantic_colors` (twice, once per
 * `color_type`), `brand_typography`, `brand_spacing`, `brand_ecosystem` and
 * `brand_meta`. That is retired. The registry has no database going forwards;
 * everything is from disk, and the brand is written by a human, so it belongs
 * where a diff and a reviewer can see it — the same move `palette.source.ts`
 * made for the twenty-one colour families, and for the same reason.
 *
 * WHAT LIVES WHERE. The split is by kind, not by convenience:
 *   - the 21 colour families      `lib/tokens/palette.source.ts`
 *   - everything else brand       here
 * The one seam between them is `mineralApiHex` below; its doc comment explains
 * why, and `__tests__/api/brand-from-disk.test.ts` fails if the two drift.
 *
 * SHAPES ARE THE COLLECTIONS' OWN, camelCased. Field names carry over intact —
 * including `hcLightValue` / `hcDarkValue` on the colours, the fluid-type and
 * `letterSpacing` fields on typography, and `adopterType` on the ecosystem.
 * None of those are served by `/api/v1/brand` today. They are kept anyway: a
 * field dropped because the current reader ignores it is a field that cannot
 * come back, and these were authored deliberately.
 *
 * ORDER IS DATA. Each array is committed in the order the API serves it —
 * colours by name, everything else by `sortOrder` — because consumers render
 * these in sequence. Do not re-sort on read.
 *
 * No network and no credential is needed to read any of this, which is the
 * point: `/api/v1/brand` answers with every Supabase variable unset.
 */

/** A semantic or background colour. `hc*` are the high-contrast overrides, null where none is defined. */
export interface BrandColorToken {
  name: string
  lightValue: string
  darkValue: string
  usage: string
  colorType: "semantic" | "background"
  hcLightValue: string | null
  hcDarkValue: string | null
}

/**
 * A typography entry. One table, three kinds, discriminated by `entryType`:
 * `font` (a family), `scale` (a size step) and `weight`. `/api/v1/brand` serves
 * the first two; the `weight` entry is carried here because it is real brand
 * data that the current projection happens not to reach.
 */
export interface BrandTypographyToken {
  name: string
  entryType: "font" | "scale" | "weight"
  sizePx: number | null
  sizeRem: string | null
  lineHeight: string | null
  weight: number | null
  font: "sans" | "serif" | "mono" | null
  usage: string
  family: string | null
  reason: string | null
  fluidMinPx: number | null
  fluidMaxPx: number | null
  fontFeatures: string | null
  letterSpacing: string | null
  sortOrder: number
}

export interface BrandSpacingToken {
  name: string
  px: number
  rem: string
  usage: string
  sortOrder: number
}

export interface BrandEcosystemEntry {
  name: string
  meaning: string
  language: string
  role: string
  mineral: string
  url: string
  description: string
  voice: string
  adopterType: string
  sortOrder: number
}

export interface BrandMeta {
  version: string
  name: string
  lastUpdated: string
  homepage: string
  radii: Record<string, unknown>
  philosophy: Record<string, unknown>
  voiceAndTone: Record<string, unknown>
  accessibility: Record<string, unknown>
  componentSpecs: Record<string, unknown>[]
}

/**
 * The mineral `hex` that `/api/v1/brand` serves, keyed by mineral name.
 *
 * WHY THIS IS NOT IN `palette.source.ts`. `brand_minerals` carried a `hex`
 * column alongside `light_hex` and `dark_hex`, and it is not derivable from
 * either: it is `lightHex` for cobalt, terracotta, sodalite and copper, and
 * `darkHex` for tanzanite, malachite and gold. It is the mineral's single
 * "the colour, if you only get one" value, and `/api/v1/brand` is its only
 * consumer — no CSS custom property, no platform token file, nothing in
 * `tokens:sync` emits it. Putting it in `palette.source.ts` would push a
 * field with exactly one reader through seven generated platform artifacts.
 *
 * The drift risk this creates — a mineral added to the palette and forgotten
 * here — is closed by a test, not by a comment: `brand-from-disk.test.ts`
 * asserts these keys are exactly the mineral names in the palette.
 */
export const mineralApiHex: Readonly<Record<string, string>> = {
  cobalt: "#0047AB",
  tanzanite: "#B388FF",
  malachite: "#64FFDA",
  gold: "#FFD740",
  terracotta: "#A0522D",
  sodalite: "#283593",
  copper: "#BF5A36",
}

/** Semantic colours, in the order the API serves them (by name). */
export const semanticColors: BrandColorToken[] = [
  {
    name: "accent",
    usage: "Hover fills, selected rows, soft highlights. Cobalt container.",
    colorType: "semantic",
    darkValue: "#001F3F",
    lightValue: "#E3F2FD",
    hcDarkValue: "#001030",
    hcLightValue: "#B8D8FF",
  },
  {
    name: "border",
    usage: "Canonical border color — cards, inputs, dividers, tables. Warm stone, not cool gray.",
    colorType: "semantic",
    darkValue: "#2A2927",
    lightValue: "#E7E5E0",
    hcDarkValue: "#FFFFFF",
    hcLightValue: "#000000",
  },
  {
    name: "brand-accent",
    usage:
      "Per-app/per-context saturated brand mineral for accent fills and CTAs. Defaults to tanzanite — the Mukoko/Nyuchi brand mineral. Swappable per app or per-event/category (nhimbe). Distinct from the semantic --accent (a pale container for hover/selected states).",
    colorType: "semantic",
    darkValue: "#B388FF",
    lightValue: "#4B0082",
    hcDarkValue: "#D0A8FF",
    hcLightValue: "#2E004D",
  },
  {
    name: "destructive-container",
    usage: "Soft background behind destructive content. Follows mineral container pattern.",
    colorType: "semantic",
    darkValue: "#3E1818",
    lightValue: "#FDEDED",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "error",
    usage: "Error states, destructive actions",
    colorType: "semantic",
    darkValue: "#F2B8B5",
    lightValue: "#B3261E",
    hcDarkValue: "#FF8787",
    hcLightValue: "#8B0000",
  },
  {
    name: "info",
    usage: "Informational states",
    colorType: "semantic",
    darkValue: "#00B0FF",
    lightValue: "#0047AB",
    hcDarkValue: "#66CCFF",
    hcLightValue: "#003380",
  },
  {
    name: "input",
    usage: "Form input background — same as surface. Pill-shape provides visual distinction.",
    colorType: "semantic",
    darkValue: "#100F0E",
    lightValue: "#FFFFFF",
    hcDarkValue: "#000000",
    hcLightValue: "#FFFFFF",
  },
  {
    name: "neutral",
    usage: "Neutral / inactive status, secondary data series",
    colorType: "semantic",
    darkValue: "#A09C93",
    lightValue: "#55514B",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "offline",
    usage: "Offline / disconnected state",
    colorType: "semantic",
    darkValue: "#BA9570",
    lightValue: "#674C32",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "primary",
    usage:
      "Primary brand action color — tanzanite (the Mukoko/Nyuchi brand mineral). Maps to --color-tanzanite. Cobalt is the exceptional mineral for links/info only (see the info token) — do not use it as --primary.",
    colorType: "semantic",
    darkValue: "#B388FF",
    lightValue: "#4B0082",
    hcDarkValue: "#D0A8FF",
    hcLightValue: "#2E004D",
  },
  {
    name: "ring",
    usage: "Focus ring color — cobalt. 2px width, 2px offset (see brand_meta.accessibility).",
    colorType: "semantic",
    darkValue: "#00B0FF",
    lightValue: "#0047AB",
    hcDarkValue: "#66CCFF",
    hcLightValue: "#003380",
  },
  {
    name: "success",
    usage: "Success states, positive actions",
    colorType: "semantic",
    darkValue: "#64FFDA",
    lightValue: "#004D40",
    hcDarkValue: "#7FFFB0",
    hcLightValue: "#003820",
  },
  {
    name: "syncing",
    usage: "In-progress sync / pending state",
    colorType: "semantic",
    darkValue: "#36ABBA",
    lightValue: "#1C5962",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "warning",
    usage: "Warning states, caution",
    colorType: "semantic",
    darkValue: "#FFD866",
    lightValue: "#7A5C00",
    hcDarkValue: "#FFE080",
    hcLightValue: "#5C4400",
  },
]

/** Background colours, in the order the API serves them (by name). */
export const backgroundColors: BrandColorToken[] = [
  {
    name: "base",
    usage: "Page background — ambient base surface (prime step P5)",
    colorType: "background",
    darkValue: "#0E0D0C",
    lightValue: "#F3F3F1",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "container",
    usage: "Neutral containers, grouped content (prime step P11)",
    colorType: "background",
    darkValue: "#1E1D1A",
    lightValue: "#E5E4E1",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "muted",
    usage: "Deepest fill — inset sections, metadata rows, maximum text contrast",
    colorType: "background",
    darkValue: "#050504",
    lightValue: "#FAF9F5",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "overlay",
    usage: "Overlays and dialogs (prime step P13)",
    colorType: "background",
    darkValue: "#23221F",
    lightValue: "#E0DFDC",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "pitch",
    usage: "Deepest surface — media wells, splash (prime step P2)",
    colorType: "background",
    darkValue: "#050505",
    lightValue: "#FAFAFA",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "raised",
    usage: "Raised elements above overlay — menus, toasts (prime step P17)",
    colorType: "background",
    darkValue: "#2E2C29",
    lightValue: "#D6D5D1",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "scrim",
    usage: "Semi-transparent backdrop behind overlays",
    colorType: "background",
    darkValue: "rgba(0,0,0,0.60)",
    lightValue: "rgba(0,0,0,0.40)",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "surface",
    usage: "Card / panel surface (prime step P7)",
    colorType: "background",
    darkValue: "#131211",
    lightValue: "#EEEEEC",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "void",
    usage: "App shell behind base (prime step P3)",
    colorType: "background",
    darkValue: "#080807",
    lightValue: "#F8F8F7",
    hcDarkValue: null,
    hcLightValue: null,
  },
  {
    name: "wash",
    usage:
      "Cover-colour page wash — surface tinted with the active brand accent (~7% light / ~12% dark)",
    colorType: "background",
    darkValue: "color-mix(in oklab, var(--surface) 88%, var(--brand-accent))",
    lightValue: "color-mix(in oklab, var(--surface) 93%, var(--brand-accent))",
    hcDarkValue: null,
    hcLightValue: null,
  },
]

/** Fonts, scale steps and weights, in `sortOrder`. */
export const typography: BrandTypographyToken[] = [
  {
    font: null,
    name: "sans",
    usage: "All body text, UI labels",
    family: "Noto Sans",
    reason: "Broad language support including African languages and diacritics",
    weight: null,
    sizePx: null,
    sizeRem: null,
    entryType: "font",
    sortOrder: 0,
    lineHeight: null,
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: null,
  },
  {
    font: null,
    name: "serif",
    usage: "Page titles, hero text, display headings",
    family: "Noto Serif",
    reason: "Elegant display type with matching language coverage",
    weight: null,
    sizePx: null,
    sizeRem: null,
    entryType: "font",
    sortOrder: 1,
    lineHeight: null,
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: null,
  },
  {
    font: null,
    name: "mono",
    usage: "Code blocks, terminal output, technical content",
    family: "JetBrains Mono",
    reason: "Purpose-built for developer readability",
    weight: null,
    sizePx: null,
    sizeRem: null,
    entryType: "font",
    sortOrder: 2,
    lineHeight: null,
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: null,
  },
  {
    font: "serif",
    name: "Display",
    usage: "Hero headlines, landing pages",
    family: null,
    reason: null,
    weight: 700,
    sizePx: 72,
    sizeRem: "4.5rem",
    entryType: "scale",
    sortOrder: 10,
    lineHeight: "1.1",
    fluidMaxPx: 72,
    fluidMinPx: 40,
    fontFeatures: null,
    letterSpacing: "-0.025em",
  },
  {
    font: "serif",
    name: "Display Small",
    usage: "Secondary hero headlines, landing page sub-hero sections",
    family: "Noto Serif",
    reason:
      "Smoother transition between Display (72) and H1 (48). Audit recommended for secondary hero surfaces and ad slots.",
    weight: 700,
    sizePx: 60,
    sizeRem: "3.75rem",
    entryType: "scale",
    sortOrder: 11,
    lineHeight: "1.1",
    fluidMaxPx: 60,
    fluidMinPx: 36,
    fontFeatures: null,
    letterSpacing: "-0.02em",
  },
  {
    font: "serif",
    name: "H1",
    usage: "Page titles",
    family: null,
    reason: null,
    weight: 700,
    sizePx: 48,
    sizeRem: "3rem",
    entryType: "scale",
    sortOrder: 12,
    lineHeight: "1.15",
    fluidMaxPx: 48,
    fluidMinPx: 32,
    fontFeatures: null,
    letterSpacing: "-0.02em",
  },
  {
    font: "serif",
    name: "H2",
    usage: "Section headings",
    family: null,
    reason: null,
    weight: 600,
    sizePx: 36,
    sizeRem: "2.25rem",
    entryType: "scale",
    sortOrder: 13,
    lineHeight: "1.2",
    fluidMaxPx: 36,
    fluidMinPx: 28,
    fontFeatures: null,
    letterSpacing: "-0.015em",
  },
  {
    font: "serif",
    name: "H3",
    usage: "Sub-section headings",
    family: null,
    reason: null,
    weight: 600,
    sizePx: 30,
    sizeRem: "1.875rem",
    entryType: "scale",
    sortOrder: 14,
    lineHeight: "1.25",
    fluidMaxPx: 30,
    fluidMinPx: 24,
    fontFeatures: null,
    letterSpacing: "-0.01em",
  },
  {
    font: "sans",
    name: "H4",
    usage: "Card titles, group headings",
    family: null,
    reason: null,
    weight: 600,
    sizePx: 24,
    sizeRem: "1.5rem",
    entryType: "scale",
    sortOrder: 15,
    lineHeight: "1.3",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "-0.005em",
  },
  {
    font: "sans",
    name: "H5",
    usage: "Small headings",
    family: null,
    reason: null,
    weight: 600,
    sizePx: 20,
    sizeRem: "1.25rem",
    entryType: "scale",
    sortOrder: 16,
    lineHeight: "1.4",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "normal",
  },
  {
    font: "sans",
    name: "H6",
    usage: "Nested headings in long-form content, legal pages, deep documentation",
    family: "Noto Sans",
    reason: "Needed for 6-level heading hierarchy in long-form content and legal/policy pages",
    weight: 600,
    sizePx: 16,
    sizeRem: "1rem",
    entryType: "scale",
    sortOrder: 17,
    lineHeight: "1.4",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "normal",
  },
  {
    font: "sans",
    name: "Body Large",
    usage: "Lead paragraphs",
    family: null,
    reason: null,
    weight: 400,
    sizePx: 18,
    sizeRem: "1.125rem",
    entryType: "scale",
    sortOrder: 18,
    lineHeight: "1.6",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "normal",
  },
  {
    font: "sans",
    name: "Body",
    usage: "Default body text",
    family: null,
    reason: null,
    weight: 400,
    sizePx: 16,
    sizeRem: "1rem",
    entryType: "scale",
    sortOrder: 19,
    lineHeight: "1.6",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "normal",
  },
  {
    font: "sans",
    name: "Body Small",
    usage: "Secondary text, descriptions",
    family: null,
    reason: null,
    weight: 400,
    sizePx: 14,
    sizeRem: "0.875rem",
    entryType: "scale",
    sortOrder: 20,
    lineHeight: "1.5",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "normal",
  },
  {
    font: "sans",
    name: "Caption",
    usage: "Labels, metadata, timestamps",
    family: null,
    reason: null,
    weight: 400,
    sizePx: 12,
    sizeRem: "0.75rem",
    entryType: "scale",
    sortOrder: 21,
    lineHeight: "1.5",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: "0.02em",
  },
  {
    font: "mono",
    name: "Code",
    usage: "Code blocks, terminal output",
    family: null,
    reason: null,
    weight: 400,
    sizePx: 14,
    sizeRem: "0.875rem",
    entryType: "scale",
    sortOrder: 22,
    lineHeight: "1.6",
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: "tabular-nums",
    letterSpacing: "normal",
  },
  {
    font: null,
    name: "Weight 500 (medium)",
    usage: "Nav items, UI labels needing emphasis without semibold weight",
    family: null,
    reason:
      "Fills gap between body (400) and semibold (600) — used for active nav states, form labels, and table headers.",
    weight: 500,
    sizePx: null,
    sizeRem: null,
    entryType: "weight",
    sortOrder: 100,
    lineHeight: null,
    fluidMaxPx: null,
    fluidMinPx: null,
    fontFeatures: null,
    letterSpacing: null,
  },
]

/** The spacing ramp, in `sortOrder`. */
export const spacing: BrandSpacingToken[] = [
  {
    px: 2,
    rem: "0.125rem",
    name: "xxs",
    usage: "Hairline gaps — chip-in-chip, icon-to-badge, inline meta separators",
    sortOrder: 5,
  },
  {
    px: 4,
    rem: "0.25rem",
    name: "xs",
    usage: "Tight gaps, icon padding",
    sortOrder: 10,
  },
  {
    px: 6,
    rem: "0.375rem",
    name: "xs-plus",
    usage: "Icon-to-text offset, tight inline spacing",
    sortOrder: 20,
  },
  {
    px: 8,
    rem: "0.5rem",
    name: "sm",
    usage: "Compact spacing, inline gaps",
    sortOrder: 30,
  },
  {
    px: 10,
    rem: "0.625rem",
    name: "sm-plus",
    usage: "Dense tag padding, compact button icons",
    sortOrder: 40,
  },
  {
    px: 12,
    rem: "0.75rem",
    name: "md",
    usage: "Compact component padding — dense layouts, secondary surfaces",
    sortOrder: 50,
  },
  {
    px: 16,
    rem: "1rem",
    name: "base",
    usage: "Default component padding — cards, inputs, comfortable density",
    sortOrder: 70,
  },
  {
    px: 20,
    rem: "1.25rem",
    name: "base-plus",
    usage: "Comfortable component padding — the modern SaaS default (Linear, Vercel, Stripe)",
    sortOrder: 80,
  },
  {
    px: 24,
    rem: "1.5rem",
    name: "lg",
    usage: "Section padding, card gaps",
    sortOrder: 100,
  },
  {
    px: 32,
    rem: "2rem",
    name: "xl",
    usage: "Page margins, large gaps",
    sortOrder: 110,
  },
  {
    px: 40,
    rem: "2.5rem",
    name: "xl-plus",
    usage: "Section-header-to-content gap, large card spacing",
    sortOrder: 115,
  },
  {
    px: 48,
    rem: "3rem",
    name: "2xl",
    usage: "Section margins",
    sortOrder: 150,
  },
  {
    px: 56,
    rem: "3.5rem",
    name: "2xl-plus",
    usage: "Between major content blocks",
    sortOrder: 155,
  },
  {
    px: 64,
    rem: "4rem",
    name: "3xl",
    usage: "Page section spacing",
    sortOrder: 170,
  },
  {
    px: 80,
    rem: "5rem",
    name: "4xl",
    usage: "Page section spacing on desktop — hero breathing room",
    sortOrder: 200,
  },
  {
    px: 96,
    rem: "6rem",
    name: "5xl",
    usage: "Hero section spacing — prominent landing blocks",
    sortOrder: 220,
  },
  {
    px: 128,
    rem: "8rem",
    name: "6xl",
    usage: "Page hero spacing — full-viewport feature sections",
    sortOrder: 250,
  },
]

/** The ecosystem brands, in `sortOrder`. */
export const ecosystem: BrandEcosystemEntry[] = [
  {
    url: "https://www.bundu.org",
    name: "bundu",
    role: "The ecosystem",
    voice: "Visionary, grounded, inclusive",
    meaning: "Wilderness",
    mineral: "copper",
    language: "Shona",
    sortOrder: 0,
    description:
      "The complete ecosystem built by Nyuchi Africa. Three pillars — mukoko (consumer super app), nyuchi (enterprise layer), and sister brands (specialist verticals) — all connected through one identity, one design system, and one open data commons.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://nyuchi.com",
    name: "nyuchi",
    role: "Infrastructure & enterprise",
    voice: "Technical, reliable, industrious",
    meaning: "Bee",
    mineral: "gold",
    language: "Shona",
    sortOrder: 1,
    description:
      "Seven enterprise products, each with its own consumer interface and business-facing tools. API platform, web services, learning, medical, rentals, tools, and SEO manager. Every nyuchi product is a standalone product, a door into the mukoko platform, and a professional surface for the same ecosystem.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://mukoko.com",
    name: "mukoko",
    role: "Africa's super app",
    voice: "Welcoming, structured, protective",
    meaning: "Beehive",
    mineral: "tanzanite",
    language: "Shona",
    sortOrder: 2,
    description:
      "A growing net of mini-apps — founded seventeen, four substrate components, one unified identity — grown under the Bundu Order. The digital home where a billion Africans' social, creative, commercial, civic, and economic lives belong.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://shamwari.ai",
    name: "shamwari",
    role: "Sovereign AI companion",
    voice: "Helpful, warm, intelligent",
    meaning: "Friend",
    mineral: "sodalite",
    language: "Shona",
    sortOrder: 3,
    description:
      "The Digital Twin's conversational interface. Three layers of intelligence — personal (your pod data), community (anonymised platform data), and platform (base mukoko knowledge). A friend that serves; a friend that does not control.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://nhimbe.com",
    name: "nhimbe",
    role: "Events & gatherings",
    voice: "Celebratory, communal, vibrant",
    meaning: "Gathering",
    mineral: "malachite",
    language: "Shona",
    sortOrder: 4,
    description:
      "Community events and cultural gatherings. Standalone brand calling the same platform API. Edge-first check-in via geographic Durable Objects for sub-10ms ticket validation at venue doors.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://bushtrade.co.zw",
    name: "bushtrade",
    role: "Marketplace",
    voice: "Practical, trustworthy, local",
    meaning: "Bush trade",
    mineral: "gold",
    language: "English/Shona",
    sortOrder: 5,
    description:
      "Rentals-first marketplace for Zimbabwe and beyond. Business verification through the platform's unified submissions pipeline. Escrow-backed payments via mukoko wallet. Seller conversations flow through Campfire.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://lingo.mukoko.com",
    name: "lingo",
    role: "Language learning",
    voice: "Encouraging, cultural, playful",
    meaning: "Language",
    mineral: "cobalt",
    language: "English",
    sortOrder: 6,
    description:
      "African language learning. Shona and Ndebele as primaries, English, French, Portuguese, and travel phrases. The product expression of mukoko's commitment to treating African languages as first-class citizens.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://campfire.mukoko.com",
    name: "campfire",
    role: "Platform messaging anchor",
    voice: "Direct, warm, always present",
    meaning: "Campfire",
    mineral: "malachite",
    language: "English",
    sortOrder: 7,
    description:
      "All messaging and cross-app communications. The architectural anchor of the ecosystem.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://bytes.mukoko.com",
    name: "bytes",
    role: "Short-form creator video",
    voice: "Energetic, creative, youthful",
    meaning: "Bytes",
    mineral: "tanzanite",
    language: "English",
    sortOrder: 8,
    description: "African creator video platform competing with TikTok.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://novels.mukoko.com",
    name: "novels",
    role: "Publishing platform",
    voice: "Literary, thoughtful, immersive",
    meaning: "Novels",
    mineral: "malachite",
    language: "English",
    sortOrder: 9,
    description: "Long-form publishing with 10 work types, co-authorship, and revenue splitting.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://places.mukoko.com",
    name: "places",
    role: "Geographic knowledge graph",
    voice: "Authoritative, helpful, discoverable",
    meaning: "Places",
    mineral: "gold",
    language: "English",
    sortOrder: 10,
    description:
      "Africa's rival to Google Business Profile + Maps for formal and informal economies.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://transport.mukoko.com",
    name: "transport",
    role: "Public transit and booking",
    voice: "Efficient, reliable, practical",
    meaning: "Transport",
    mineral: "gold",
    language: "English",
    sortOrder: 11,
    description: "Public transit routing, vehicle booking, commute planning for African cities.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://planner.mukoko.com",
    name: "planner",
    role: "Productivity hub",
    voice: "Organised, clear, supportive",
    meaning: "Planner",
    mineral: "cobalt",
    language: "English",
    sortOrder: 12,
    description: "Calendar, tasks, notes, bookings — single source of truth for scheduling.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://wallet.mukoko.com",
    name: "wallet",
    role: "Payments and tokens",
    voice: "Trustworthy, precise, secure",
    meaning: "Wallet",
    mineral: "gold",
    language: "English",
    sortOrder: 13,
    description: "MUKOKO tokens, mobile money, bank transfers. No bank account required.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://pulse.mukoko.com",
    name: "pulse",
    role: "Feed and Mukoko Home",
    voice: "Personal, adaptive, ambient",
    meaning: "Pulse",
    mineral: "tanzanite",
    language: "English",
    sortOrder: 14,
    description: "Personalised content feed and agentic dashboard.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://health.mukoko.com",
    name: "health",
    role: "Wellness and telemedicine",
    voice: "Caring, accurate, private",
    meaning: "Health",
    mineral: "malachite",
    language: "English",
    sortOrder: 15,
    description:
      "Health info, telemedicine booking, medication reminders. Connected to Nyuchi Medical.",
    adopterType: "ecosystem_brand",
  },
  {
    url: "https://circles.mukoko.com",
    name: "circles",
    role: "Community messaging",
    voice: "Inclusive, moderated, community-driven",
    meaning: "Circles",
    mineral: "terracotta",
    language: "English",
    sortOrder: 16,
    description: "Community channels — WhatsApp groups, Discord servers for Africa.",
    adopterType: "ecosystem_brand",
  },
]

/** Brand identity, philosophy, voice, accessibility posture and component specs. */
export const brandMeta: BrandMeta = {
  version: "4.0.31",
  name: "The Bundu Brand System",
  lastUpdated: "2026-07-13",
  homepage: "https://mzizi.dev/brand",
  radii: {
    lg: "14px",
    md: "12px",
    sm: "7px",
    xl: "17px",
    "2xl": "17px",
    base: "14px",
    full: "9999px",
    system: "Ecosystem numbers: 7, 12, 14, 17. Buttons are always pill (rounded-full).",
  },
  philosophy: {
    name: "Ubuntu",
    shona: "Ndiri nekuti tiri",
    meaning: "I am because we are",
    triMode: [
      {
        name: "Musha",
        meaning: "Home",
        description: "The foreground experience — the app you open and dwell in.",
      },
      {
        name: "Basa",
        meaning: "Work",
        description: "The background service — data and capabilities other apps consume.",
      },
      {
        name: "Nhaka",
        meaning: "Heritage",
        description:
          "The open data contribution — anonymised data flowing into the continental knowledge commons.",
      },
    ],
    covenants: [
      "We will never sell your personal data.",
      "We will never design for addiction.",
      "We will never let advertisers control what you see.",
      "We will never abandon African creators.",
      "We will never choose proprietary when open source is adequate.",
      "We will never treat African languages as an afterthought.",
      "We will never abandon our values when growth demands it.",
    ],
    description:
      "Every decision we make, every feature we build, every line of code we write runs through a single filter: does this strengthen the community, or does it extract from it?",
    ubuntuPillars: [
      {
        name: "family",
        shona: "Mhuri",
        title: "Family",
      },
      {
        name: "community",
        shona: "Nharaunda",
        title: "Community",
      },
      {
        name: "society",
        shona: "Vanhu",
        title: "Society",
      },
      {
        name: "environment",
        shona: "Zvakatipoteredza",
        title: "Environment",
      },
      {
        name: "spirituality",
        shona: "Unhu",
        title: "Spirituality",
      },
    ],
    ubuntuQuestions: [
      "Does this strengthen community?",
      "Does this respect human dignity?",
      "Does this serve the collective good?",
      "Would we explain this proudly to our elders?",
      "Does this align with 'I am because we are'?",
    ],
    ubuntuPrinciples: [
      {
        name: "survival",
        shona: "Kurarama",
        title: "Survival",
      },
      {
        name: "solidarity",
        shona: "Kubatana",
        title: "Solidarity",
      },
      {
        name: "compassion",
        shona: "Tsitsi",
        title: "Compassion",
      },
      {
        name: "respect",
        shona: "Ruremekedzo",
        title: "Respect",
      },
      {
        name: "dignity",
        shona: "Chiremerera",
        title: "Dignity",
      },
    ],
    architecturalPillars: [
      {
        name: "Local-First",
        description: "The device is the primary processing surface. Works in a village with 2G.",
      },
      {
        name: "Mobile-First",
        description: "Built for the reality of the African smartphone market, not San Francisco.",
      },
      {
        name: "Open Source",
        description: "Every critical dependency is sovereign. Speed is rented, truth is owned.",
      },
      {
        name: "Open Data",
        description: "Platform data belongs to Africa. Personal data stays sovereign in your pod.",
      },
    ],
  },
  voiceAndTone: {
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
    principles: [
      "Speak like a knowledgeable friend, not a corporation",
      "Use simple, clear language — avoid jargon",
      "Be warm and encouraging, never condescending",
      "Respect African cultural context and diversity",
      "Prefer active voice and direct address",
    ],
  },
  accessibility: {
    standard: "APCA 3.0 AAA",
    screenReaders: "Semantic HTML with ARIA attributes where needed",
    focusIndicator: "2px ring with ring-offset-2, using --ring token",
    minTouchTarget: 48,
    defaultTouchTarget: 56,
    keyboardNavigation: "Full keyboard support via Radix UI primitives",
    contrastDescription:
      "Advanced Perceptual Contrast Algorithm for superior readability across all mineral colors",
  },
  componentSpecs: [
    {
      name: "button",
      note: "Buttons are ALWAYS pill-shaped (rounded-full). Brand identity decision.",
      heights: {
        lg: 56,
        sm: 48,
        icon: 48,
        default: 56,
      },
      padding: "px-4 (sm), px-5 (default), px-6 (lg)",
      variants: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      borderRadius: 9999,
      minTouchTarget: 48,
    },
    {
      name: "input",
      note: "Inputs are pill-shaped to match buttons.",
      heights: {
        sm: 48,
        default: 56,
      },
      padding: "px-4",
      variants: ["default", "error"],
      borderRadius: 9999,
      minTouchTarget: 48,
    },
    {
      name: "avatar",
      heights: {
        lg: 48,
        sm: 32,
        xl: 64,
        xs: 24,
        default: 40,
      },
      padding: "none",
      variants: ["image", "fallback"],
      borderRadius: 9999,
      minTouchTarget: 48,
    },
    {
      name: "badge",
      heights: {
        default: 22,
      },
      padding: "px-2.5 py-0.5",
      variants: ["default", "secondary", "destructive", "outline"],
      borderRadius: 9999,
      minTouchTarget: 48,
    },
    {
      name: "card",
      note: "Cards use --radius-lg (14px) with a full 1px border and compact 14px padding (4.2.0 density refresh).",
      heights: {
        auto: 0,
      },
      padding: "p-3.5",
      variants: ["default", "accented", "clickable"],
      borderRadius: 14,
      minTouchTarget: 48,
    },
    {
      name: "dialog",
      note: "Dialogs use --radius-xl (17px).",
      heights: {
        auto: 0,
      },
      padding: "p-5",
      variants: ["default"],
      borderRadius: 17,
      minTouchTarget: 48,
    },
    {
      name: "toggle",
      heights: {
        default: 24,
      },
      padding: "none",
      variants: ["on", "off"],
      borderRadius: 9999,
      minTouchTarget: 48,
    },
    {
      name: "checkbox",
      note: "Checkboxes use --radius-sm (7px).",
      heights: {
        default: 20,
      },
      padding: "none",
      variants: ["checked", "unchecked", "indeterminate"],
      borderRadius: 7,
      minTouchTarget: 48,
    },
    {
      name: "tabs",
      note: "Tab triggers use --radius-xl (17px).",
      heights: {
        default: 48,
      },
      padding: "px-4",
      variants: ["default", "underline"],
      borderRadius: 17,
      minTouchTarget: 48,
    },
  ],
}
