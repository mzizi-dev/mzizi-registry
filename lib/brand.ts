/**
 * Mukoko Brand System — Single source of truth for brand data.
 *
 * Powers both the documentation pages (/brand/*) and the brand API (/api/brand).
 * All hex values match the CSS custom properties in app/globals.css.
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
  // ── The Bundu Family ──────────────────────────────────────────────────────
  {
    name: "bundu",
    meaning: "Wilderness",
    language: "Shona",
    tier: "ecosystem",
    role: "The ecosystem",
    description:
      "The complete ecosystem built by Nyuchi Africa. Three pillars — mukoko (consumer super app), nyuchi (enterprise layer), and sister brands (specialist verticals) — all connected through one identity, one design system, and one open data commons.",
    voice: "Visionary, grounded, inclusive",
    mineral: "terracotta",
    url: "https://bundu.family",
  },
  // ── Nyuchi — Enterprise Layer ─────────────────────────────────────────────
  {
    name: "nyuchi",
    meaning: "Bee",
    language: "Shona",
    tier: "enterprise",
    role: "Infrastructure & enterprise",
    description:
      "Seven enterprise products, each with its own consumer interface and business-facing tools. API platform, web services, learning, medical, rentals, tools, and SEO manager. Every nyuchi product is a standalone product, a door into the mukoko platform, and a professional surface for the same ecosystem.",
    voice: "Technical, reliable, industrious",
    mineral: "gold",
    url: "https://nyuchi.com",
  },
  // ── Mukoko — Consumer Super App ───────────────────────────────────────────
  {
    name: "mukoko",
    meaning: "Beehive",
    language: "Shona",
    tier: "consumer",
    role: "Africa's super app",
    description:
      "Seventeen mini-apps, four substrate components, one unified identity. The digital home where a billion African users live their digital lives — messaging, news, commerce, events, publishing, payments, transport, health, and more.",
    voice: "Welcoming, structured, protective",
    mineral: "tanzanite",
    url: "https://mukoko.com",
  },
  {
    name: "shamwari",
    meaning: "Friend",
    language: "Shona",
    tier: "consumer",
    role: "Sovereign AI companion",
    description:
      "The Digital Twin's conversational interface. Three layers of intelligence — personal (your pod data), community (anonymised platform data), and platform (base mukoko knowledge). A friend that serves; a friend that does not control.",
    voice: "Helpful, warm, intelligent",
    mineral: "cobalt",
    url: "https://shamwari.ai",
  },
  {
    name: "nhimbe",
    meaning: "Gathering",
    language: "Shona",
    tier: "consumer",
    role: "Events & gatherings",
    description:
      "Community events and cultural gatherings. Standalone brand calling the same platform API. Edge-first check-in via geographic Durable Objects for sub-10ms ticket validation at venue doors.",
    voice: "Celebratory, communal, vibrant",
    mineral: "malachite",
    url: "https://nhimbe.com",
  },
  // ── Sister Brands — Specialist Verticals ──────────────────────────────────
  {
    name: "bushtrade",
    meaning: "Bush trade",
    language: "English/Shona",
    tier: "sister",
    role: "Marketplace",
    description:
      "Rentals-first marketplace for Zimbabwe and beyond. Business verification through the platform's unified submissions pipeline. Escrow-backed payments via mukoko wallet. Seller conversations flow through Campfire.",
    voice: "Practical, trustworthy, local",
    mineral: "gold",
    url: "https://bushtrade.co.zw",
  },
  {
    name: "lingo",
    meaning: "Language",
    language: "English",
    tier: "consumer",
    role: "Language learning",
    description:
      "African language learning. Shona and Ndebele as primaries, English, French, Portuguese, and travel phrases. The product expression of mukoko's commitment to treating African languages as first-class citizens.",
    voice: "Encouraging, cultural, playful",
    mineral: "malachite",
    url: "https://lingo.mukoko.com",
  },
]

// ─── Mukoko Mini-Apps (17) ──────────────────────────────────────────────────

export interface MiniApp {
  name: string
  emoji: string
  layer: string
  description: string
}

export const MUKOKO_MINI_APPS: MiniApp[] = [
  { name: "Campfire", emoji: "🔥", layer: "Communication", description: "Platform anchor. All messaging and cross-app communications." },
  { name: "Pulse", emoji: "⚡", layer: "Discovery", description: "Personalised feed (v1) and agentic dashboard (v2 — Mukoko Home)." },
  { name: "Mukoko News", emoji: "📰", layer: "Journalism", description: "Pan-African news with entity extraction and 40 interest categories." },
  { name: "Bytes", emoji: "🎬", layer: "Creator Video", description: "Short-form video for African creators, archived to Arweave." },
  { name: "Circles", emoji: "🔵", layer: "Community", description: "Community messaging — groups, fan communities, professional networks." },
  { name: "Novels", emoji: "📚", layer: "Publishing", description: "10 work types, co-authorship with automatic revenue splitting." },
  { name: "Nhimbe", emoji: "🥁", layer: "Gathering", description: "Events and cultural gatherings. Standalone brand at nhimbe.com." },
  { name: "BushTrade", emoji: "🛒", layer: "Commerce", description: "Rentals-first marketplace. Standalone brand at bushtrade.co.zw." },
  { name: "Places", emoji: "📍", layer: "Geography", description: "Africa's geographic knowledge graph and business verification layer." },
  { name: "Transport", emoji: "🚌", layer: "Movement", description: "Public transit routing, vehicle booking, commute planning." },
  { name: "Planner", emoji: "📅", layer: "Organisation", description: "Calendar, tasks, bookings, and notes — all cross-app activity." },
  { name: "Mukoko Lingo", emoji: "🗣", layer: "Language", description: "African language learning. Shona and Ndebele as primaries." },
  { name: "Weather", emoji: "🌤", layer: "Environment", description: "Hyperlocal forecasts, severe alerts, farming intelligence." },
  { name: "Wallet", emoji: "💰", layer: "Economics", description: "MUKOKO tokens, mobile money, peer-to-peer, merchant payments." },
  { name: "Jobs", emoji: "💼", layer: "Employment", description: "Formal and informal employment discovery, credential verification." },
  { name: "Health", emoji: "🏥", layer: "Wellness", description: "Health info, telemedicine, medication reminders, health records." },
  { name: "Mukoko ID", emoji: "🆔", layer: "Identity", description: "Unified identity — one login, one Digital Twin, one reputation." },
]

// ─── Platform Substrate (4) ─────────────────────────────────────────────────

export interface SubstrateComponent {
  name: string
  description: string
}

export const PLATFORM_SUBSTRATE: SubstrateComponent[] = [
  { name: "Digital Twin", description: "Sovereign AI — your Honey, Shamwari interface, and Digital Twin NFT unified into a single intelligence living in your Web3 pod." },
  { name: "Mukoko Home", description: "The ambient agentic interface. Pulse v2 toggle. Lives on any screen. Connects to external services via MCP." },
  { name: "MUKOKO Token", description: "Two-token architecture. MIT (soulbound identity) + MXT (transferable exchange). Floor price anchored to human time." },
  { name: "Ubuntu Layer", description: "Community conscience. Seven contribution types, Ubuntu scores, badges, missions, DAO governance." },
]

// ─── Nyuchi Enterprise Products (7) ─────────────────────────────────────────

export interface NyuchiProduct {
  name: string
  description: string
  mukokoCounterpart?: string
}

export const NYUCHI_PRODUCTS: NyuchiProduct[] = [
  { name: "Nyuchi API Platform", description: "Gateway exposing platform capabilities to enterprise clients. API key management, rate limiting, billing, developer portal." },
  { name: "Nyuchi Web Services", description: "Development and infrastructure division. Client work, custom development, platform maintenance." },
  { name: "Nyuchi Learning", description: "Digital campus and digital literacy. Core expression of the belief that a super app must also build the people who use it." },
  { name: "Nyuchi Medical", description: "The clinic app. Doctors and GPs manage their practice. Connected to Mukoko Health through the same identity.", mukokoCounterpart: "Health" },
  { name: "Nyuchi Rentals", description: "Vehicle fleet management. Connected to Mukoko Transport for consumer-facing routing and booking.", mukokoCounterpart: "Transport" },
  { name: "Nyuchi Tools", description: "Workspace and productivity apps. The enterprise mirror of what Planner does for individuals.", mukokoCounterpart: "Planner" },
  { name: "Nyuchi SEO Manager", description: "AI-powered WordPress SEO plugin. Standalone SaaS leveraging the Shamwari AI infrastructure." },
]

// ─── Sister Brands ──────────────────────────────────────────────────────────

export interface SisterBrand {
  name: string
  description: string
  url?: string
}

export const SISTER_BRANDS: SisterBrand[] = [
  { name: "Zimbabwe Information Platform", description: "Consolidated travel and business intelligence for Zimbabwe. Powered by Mukoko's Places knowledge graph and verification infrastructure.", url: "https://zimbabwe.info" },
  { name: "Barstool by Nyuchi", description: "Hospitality reviews and discovery — restaurants, bars, cafes, nightlife. Built on Places verification data." },
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
  shona: "Ndiri nekuti tiri",
  description:
    "Every decision we make, every feature we build, every line of code we write runs through a single filter: does this strengthen the community, or does it extract from it?",
  pillars: [
    { name: "Local-First", description: "The device is the primary processing surface. Works in a village with 2G." },
    { name: "Mobile-First", description: "Built for the reality of the African smartphone market, not San Francisco." },
    { name: "Open Source", description: "Every critical dependency is sovereign. Speed is rented, truth is owned." },
    { name: "Open Data", description: "Platform data belongs to Africa. Personal data stays sovereign in your pod." },
  ],
  ubuntuQuestions: [
    "Does this strengthen community?",
    "Does this respect human dignity?",
    "Does this serve the collective good?",
    "Would we explain this proudly to our elders?",
    "Does this align with 'I am because we are'?",
  ],
  triMode: [
    { name: "Musha", meaning: "Home", description: "The foreground experience — the app you open and dwell in." },
    { name: "Basa", meaning: "Work", description: "The background service — data and capabilities other apps consume." },
    { name: "Nhaka", meaning: "Heritage", description: "The open data contribution — anonymised data flowing into the continental knowledge commons." },
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
  $schema: "https://design.nyuchi.com/schema/brand.json",
  "@context": "https://schema.org",
  "@type": "Brand",
  version: "4.0.1",
  name: "The Bundu Brand System",
  lastUpdated: "2026-03-09",
  homepage: "https://design.nyuchi.com/brand",
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
