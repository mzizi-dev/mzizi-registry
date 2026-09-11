/**
 * NYUCHI DESIGN TOKENS — N1: The Mathematical Substrate
 *
 * Canonical source: mzizi.dev
 * W3C Design Tokens Specification (2025.10) compliant
 * Nyuchi Frontend Architecture — Vertical Node N1
 *
 * THREE-TIER TOKEN ARCHITECTURE:
 *   1. Primitive: Raw values — never change regardless of theme or brand
 *   2. Semantic: Purpose-mapped aliases that adapt per theme (light/dark/high-contrast)
 *   3. Component: Scoped tokens for specific brand components
 *
 * WHERE THE COLOURS COME FROM:
 *   `lib/tokens/palette.source.ts` in the mzizi-registry repo is the canonical
 *   palette, and the only place a colour is authored. `pnpm tokens:sync`
 *   projects it into globals.css, into the Swift, Kotlin, ArkTS, React Native,
 *   Python and Rust token files, and into THE PALETTE REGION OF THIS FILE —
 *   everything between the `tokens:generated:ts-palette` markers in
 *   `paletteColors` below. Do not
 *   hand-edit a hex there; `pnpm tokens:verify` fails the build when it drifts,
 *   and `__tests__/tokens-surface-parity.test.ts` checks the families AND the
 *   hexes of all seven emitters against the source.
 *
 *   The rest of the file — the semantic tier, listing themes, brand overrides,
 *   component tokens, the status/severity systems — is hand-written, because
 *   none of it is in the palette. Where those tiers need a palette colour they
 *   REFERENCE the palette (`paletteColors.cobalt.value`, or `paletteVar()` for
 *   a `var(--color-…)` with the right fallback) rather than restating a hex.
 *
 *   This header used to read "This file is the source of truth. Platform
 *   generators read from it." That has not been true since the generator was
 *   written, and believing it is how this file drifted twice. First the
 *   five-name arrays in `generateCSSVariables()` outlived the five-and-five
 *   palette by two whole expansions, so a consumer got ten families of
 *   twenty-one. Then, with the families restored, six of them — terracotta,
 *   indigo, savanna, baobab, sunset and river — were still carrying their
 *   pre-Seven hexes: baobab was `#A5D6A7`, a green, where the palette says
 *   `#A1887F`, a brown. Both defects had the same cause and the same shape. A
 *   hand-maintained copy of generated data is invisible to the gate that
 *   guards the generated data, so it drifts and reports green while it does.
 *   Generating the region is the fix; retyping the six correct hexes would
 *   have rebuilt the trap with fresher numbers in it.
 *
 * TWENTY-ONE FAMILIES:
 *   Seven African Minerals (geological) + Seven Heritage Colors (atmospheric) +
 *   Seven Experimental tones (the heptagon). The same twenty-one that
 *   `/v1/brand` and the Mzizi MCP serve.
 *
 * "Thou hast ordered all things in measure, and number, and weight."
 * — The Bundu Order, v4.0.2
 */

// ═══════════════════════════════════════════════════════════════
// TIER 1 — PRIMITIVE TOKENS
// These are absolute values. They never change.
// ═══════════════════════════════════════════════════════════════

/**
 * THE PALETTE — GENERATED, NOT AUTHORED.
 *
 * Everything between the markers is emitted by `scripts/sync-tokens.ts` from
 * `lib/tokens/palette.source.ts`, the one file in the mzizi-registry repo where
 * a colour is authored. Run `pnpm tokens:sync` to regenerate it;
 * `pnpm tokens:verify` fails the build if it drifts, and
 * `__tests__/tokens-surface-parity.test.ts` fails if any of the seven emitters
 * disagrees with the palette on a family or a hex.
 *
 * DO NOT EDIT A HEX HERE. The edit is reverted by the next sync, and until then
 * this published registry item disagrees with globals.css, /v1/brand, the MCP
 * and the six other emitters — which is exactly the state terracotta, indigo,
 * savanna, baobab, sunset and river were in while this block was hand-kept.
 *
 * It is a declaration of its own rather than an inline block inside
 * `primitives` so that the rest of the token system can REFERENCE a palette
 * value (`paletteColors.cobalt.value`) instead of restating the hex. All 21
 * families: seven minerals (geological), seven heritage tones (atmospheric),
 * seven experimental (the heptagon). Each carries a dark-theme value and a
 * `<name>Light` counterpart; minerals additionally carry container and
 * on-container tiers.
 */
const paletteColors = {
  /* tokens:generated:ts-palette:start */
  // ─── SEVEN AFRICAN MINERALS (geological, from underground) ───────────────────
  // Dark-theme value first, then the light-theme counterpart as
  // `<name>Light` — the convention generateCSSVariables() relies on.
  cobalt: { value: "#00B0FF", description: "Primary blue, links, CTAs", family: "mineral" },
  cobaltLight: { value: "#0047AB", description: "Cobalt on light backgrounds" },
  tanzanite: {
    value: "#B388FF",
    description: "Purple accent, brand/logo, social features",
    family: "mineral",
  },
  tanzaniteLight: { value: "#4B0082", description: "Tanzanite on light backgrounds" },
  malachite: {
    value: "#64FFDA",
    description: "Success states, positive actions",
    family: "mineral",
  },
  malachiteLight: { value: "#004D40", description: "Malachite on light backgrounds" },
  gold: { value: "#FFD740", description: "Achievements, rewards, highlights", family: "mineral" },
  goldLight: { value: "#5D4037", description: "Gold on light backgrounds" },
  terracotta: { value: "#E1B07E", description: "Community features, warmth", family: "mineral" },
  terracottaLight: { value: "#A0522D", description: "Terracotta on light backgrounds" },
  sodalite: {
    value: "#3D5AFE",
    description: "AI/Shamwari surfaces, deep-reasoning states",
    family: "mineral",
  },
  sodaliteLight: { value: "#283593", description: "Sodalite on light backgrounds" },
  copper: {
    value: "#FF8A65",
    description: "Bundu ecosystem identity, the commons",
    family: "mineral",
  },
  copperLight: { value: "#BF5A36", description: "Copper on light backgrounds" },

  // ─── MINERAL CONTAINER COLORS ────────────────────────────────────────────────
  // Subtle background surfaces when a mineral is an area fill —
  // cards, banners, alerts, category-tinted sections.
  cobaltContainer: { value: "#E3F2FD", description: "Cobalt-tinted surface (light)" },
  cobaltContainerDark: { value: "#001F3F", description: "Cobalt-tinted surface (dark)" },
  tanzaniteContainer: { value: "#F3E5F5", description: "Tanzanite-tinted surface (light)" },
  tanzaniteContainerDark: { value: "#1A0033", description: "Tanzanite-tinted surface (dark)" },
  malachiteContainer: { value: "#E0F2F1", description: "Malachite-tinted surface (light)" },
  malachiteContainerDark: { value: "#00251A", description: "Malachite-tinted surface (dark)" },
  goldContainer: { value: "#FFF8E1", description: "Gold-tinted surface (light)" },
  goldContainerDark: { value: "#332200", description: "Gold-tinted surface (dark)" },
  terracottaContainer: { value: "#F5E6D3", description: "Terracotta-tinted surface (light)" },
  terracottaContainerDark: { value: "#3E2817", description: "Terracotta-tinted surface (dark)" },
  sodaliteContainer: { value: "#E8EAF6", description: "Sodalite-tinted surface (light)" },
  sodaliteContainerDark: { value: "#0D1442", description: "Sodalite-tinted surface (dark)" },
  copperContainer: { value: "#FBE4DA", description: "Copper-tinted surface (light)" },
  copperContainerDark: { value: "#3A1A0E", description: "Copper-tinted surface (dark)" },

  // ─── ON-CONTAINER COLORS (text/icons on container surfaces) ──────────────────
  cobaltOnContainer: { value: "#002966", description: "Text on cobalt container (light)" },
  cobaltOnContainerDark: { value: "#B3E5FC", description: "Text on cobalt container (dark)" },
  tanzaniteOnContainer: { value: "#2E004D", description: "Text on tanzanite container (light)" },
  tanzaniteOnContainerDark: { value: "#E1BEE7", description: "Text on tanzanite container (dark)" },
  malachiteOnContainer: { value: "#00332B", description: "Text on malachite container (light)" },
  malachiteOnContainerDark: { value: "#A7FFEB", description: "Text on malachite container (dark)" },
  goldOnContainer: { value: "#3E2723", description: "Text on gold container (light)" },
  goldOnContainerDark: { value: "#FFECB3", description: "Text on gold container (dark)" },
  terracottaOnContainer: { value: "#5D2906", description: "Text on terracotta container (light)" },
  terracottaOnContainerDark: {
    value: "#F5E6D3",
    description: "Text on terracotta container (dark)",
  },
  sodaliteOnContainer: { value: "#141A5C", description: "Text on sodalite container (light)" },
  sodaliteOnContainerDark: { value: "#C5CAE9", description: "Text on sodalite container (dark)" },
  copperOnContainer: { value: "#5C2410", description: "Text on copper container (light)" },
  copperOnContainerDark: { value: "#FFD3C2", description: "Text on copper container (dark)" },

  // ─── SEVEN HERITAGE COLORS (atmospheric, from above ground) ──────────────────
  indigo: {
    value: "#7986CB",
    description: "Twilight surfaces, deep atmosphere, mini-app moods",
    family: "heritage",
  },
  indigoLight: { value: "#4527A0", description: "Indigo on light backgrounds" },
  savanna: {
    value: "#E5C158",
    description: "Warm grassland surfaces, daylight atmosphere",
    family: "heritage",
  },
  savannaLight: { value: "#8D6E1A", description: "Savanna on light backgrounds" },
  baobab: {
    value: "#A1887F",
    description: "Earthy surfaces, grounded atmosphere, bark tones",
    family: "heritage",
  },
  baobabLight: { value: "#4E342E", description: "Baobab on light backgrounds" },
  sunset: {
    value: "#FF7043",
    description: "Warm accent surfaces, golden-hour atmosphere",
    family: "heritage",
  },
  sunsetLight: { value: "#D84315", description: "Sunset on light backgrounds" },
  river: {
    value: "#4DD0E1",
    description: "Cool surfaces, flowing atmosphere, water tones",
    family: "heritage",
  },
  riverLight: { value: "#006064", description: "River on light backgrounds" },
  hematite: {
    value: "#90A4AE",
    description: "Neutral anchor, mini-app surfaces, atmosphere",
    family: "heritage",
  },
  hematiteLight: { value: "#546E7A", description: "Hematite on light backgrounds" },
  kalahari: {
    value: "#E8D9B5",
    description: "Light anchor, warm backgrounds, mini-app surfaces",
    family: "heritage",
  },
  kalahariLight: { value: "#C9B589", description: "Kalahari on light backgrounds" },

  // ─── SEVEN EXPERIMENTAL TONES (the heptagon) ─────────────────────────────────
  // Hues offset 17 degrees apart, prime saturations, foregrounds
  // solved to P7. `--exp-*` in globals.css, `experimental` in
  // /v1/brand and the MCP.
  ember: { value: "#DA8766", description: "Ember — heptagon position 0", family: "experimental" },
  emberLight: { value: "#843D20", description: "Ember on light backgrounds" },
  acacia: { value: "#93A528", description: "Acacia — heptagon position 1", family: "experimental" },
  acaciaLight: { value: "#4D5615", description: "Acacia on light backgrounds" },
  fern: { value: "#2CB42B", description: "Fern — heptagon position 2", family: "experimental" },
  fernLight: { value: "#175E17", description: "Fern on light backgrounds" },
  lagoon: { value: "#2AAE9B", description: "Lagoon — heptagon position 3", family: "experimental" },
  lagoonLight: { value: "#165B51", description: "Lagoon on light backgrounds" },
  storm: { value: "#7E9BE0", description: "Storm — heptagon position 4", family: "experimental" },
  stormLight: { value: "#284CA6", description: "Storm on light backgrounds" },
  dusk: { value: "#BA87E2", description: "Dusk — heptagon position 5", family: "experimental" },
  duskLight: { value: "#742AAD", description: "Dusk on light backgrounds" },
  protea: { value: "#DF7BB4", description: "Protea — heptagon position 6", family: "experimental" },
  proteaLight: { value: "#932464", description: "Protea on light backgrounds" },
  /* tokens:generated:ts-palette:end */
} as const

export const primitives = {
  color: {
    ...paletteColors,

    // Neutrals — warm stone palette (April 2026, AAA-optimised)
    // Named by role, not arbitrary grey percentage.
    white: { value: "#FAFAFA" },
    cream: { value: "#FAF9F5", description: "Light mode muted fill / warm cream" },
    warmGrey: { value: "#F3F3F1", description: "Light mode ambient background" },
    stone68: { value: "#B2AFA8", description: "Dark mode muted-foreground (AAA on all surfaces)" },
    stone27: { value: "#494840", description: "Light mode muted-foreground (AAA on all surfaces)" },
    overlay: { value: "#252421", description: "Dark mode modal/sheet surface (L14%)" },
    ambient: { value: "#0E0D0C", description: "Dark mode page background (L10%, warm stone)" },
    surface: { value: "#100F0E", description: "Dark mode card surface (L6%)" },
    deep: { value: "#050504", description: "Dark mode deepest fill (L2%, max text contrast)" },
    black: { value: "#000000" },

    // Semantic raw values
    success: { value: "#4ADE80" },
    warning: { value: "#FBBF24" },
    error: { value: "#F87171" },
    // `info` IS cobalt — the informational state and the primary blue are one
    // decision, not two that happen to agree. Read, not retyped.
    info: { value: paletteColors.cobalt.value },
  },

  // ─── SPACING SCALE (Nyuchi Design canonical) ───────────────
  spacing: {
    "0": { value: "0px" },
    xs: { value: "4px", description: "Tight gaps, icon padding" },
    sm: { value: "8px", description: "Compact spacing, inline gaps" },
    md: { value: "12px", description: "Default component padding" },
    base: { value: "16px", description: "Standard spacing" },
    lg: { value: "24px", description: "Section padding, card gaps" },
    xl: { value: "32px", description: "Page margins, large gaps" },
    "2xl": { value: "48px", description: "Section margins" },
    "3xl": { value: "64px", description: "Page section spacing" },
  },

  // ─── BORDER RADIUS (Nyuchi Design canonical) ──────────────
  // Base unit: 7px (--radius-unit). Ecosystem numbers: 7, 12, 14, 17.
  // Buttons are ALWAYS pill (rounded-full, 9999px).
  radius: {
    none: { value: "0px" },
    sm: { value: "7px", description: "Subtle rounding, checkboxes, small elements" },
    md: { value: "12px", description: "Cards, inputs, containers" },
    lg: { value: "14px", description: "Default radius, medium containers" },
    xl: { value: "17px", description: "Large cards, dialogs, prominent surfaces" },
    full: { value: "9999px", description: "Buttons, badges, pills, avatars — ALWAYS pill" },
    circle: { value: "50%", description: "Perfect circles" },
  },

  // ─── TYPOGRAPHY (Nyuchi Design canonical) ─────────────────
  // Noto Sans/Serif chosen for cross-language compatibility
  // (800+ languages including African languages and diacritics)
  fontFamily: {
    sans: {
      value: '"Noto Sans", system-ui, -apple-system, sans-serif',
      description: "Body/UI — all text, labels, descriptions",
    },
    serif: {
      value: '"Noto Serif", Georgia, "Times New Roman", serif',
      description: "Display — page titles, hero text, H1-H3",
    },
    mono: {
      value: '"JetBrains Mono", "Fira Code", monospace',
      description: "Code — blocks, terminal, technical",
    },
  },

  // Type scale (Nyuchi Design canonical)
  fontSize: {
    caption: { value: "12px", description: "0.75rem — Labels, metadata, timestamps" },
    bodySmall: { value: "14px", description: "0.875rem — Secondary text, descriptions" },
    body: { value: "16px", description: "1rem — Default body text" },
    bodyLarge: { value: "18px", description: "1.125rem — Lead paragraphs" },
    h5: { value: "20px", description: "1.25rem — Noto Sans 600 — Small headings" },
    h4: { value: "24px", description: "1.5rem — Noto Sans 600 — Card titles" },
    h3: { value: "30px", description: "1.875rem — Noto Serif 600 — Sub-sections" },
    h2: { value: "36px", description: "2.25rem — Noto Serif 600 — Section headings" },
    h1: { value: "48px", description: "3rem — Noto Serif 700 — Page titles" },
    display: { value: "72px", description: "4.5rem — Noto Serif 700 — Hero headlines" },
  },

  fontWeight: {
    light: { value: "300" },
    regular: { value: "400" },
    medium: { value: "500" },
    semibold: { value: "600" },
    bold: { value: "700" },
  },

  // ─── TOUCH TARGETS (Nyuchi Design canonical) ──────────────
  // APCA 3.0 AAA accessibility standard
  touchTarget: {
    default: { value: "56px", description: "Default interactive element height" },
    sm: { value: "48px", description: "Minimum — NEVER below this" },
  },

  // ─── MOTION (Nyuchi Design canonical) ─────────────────────
  motion: {
    duration: {
      quick: { value: "100ms", description: "Micro-interactions, toggles" },
      standard: { value: "200ms", description: "Default transitions" },
      emphasis: { value: "350ms", description: "Entry/exit animations" },
      dramatic: { value: "500ms", description: "Page transitions, celebrations" },
    },
    easing: {
      entrance: { value: "cubic-bezier(0.0, 0.0, 0.2, 1)", description: "Elements entering view" },
      exit: { value: "cubic-bezier(0.4, 0.0, 1, 1)", description: "Elements leaving view" },
      standard: { value: "cubic-bezier(0.4, 0.0, 0.2, 1)", description: "General movement" },
      spring: { value: "cubic-bezier(0.175, 0.885, 0.32, 1.275)", description: "Bouncy, playful" },
    },
    stagger: {
      delay: { value: "50ms", description: "Per-item delay in lists" },
      maxItems: {
        value: "8",
        description: "Max items to stagger (beyond this, all appear together)",
      },
    },
  },

  // ─── SHADOWS / ELEVATION ──────────────────────────────────
  shadow: {
    sm: { value: "0 1px 2px rgba(0,0,0,0.15)" },
    md: { value: "0 4px 12px rgba(0,0,0,0.2)" },
    lg: { value: "0 8px 24px rgba(0,0,0,0.25)" },
    xl: { value: "0 20px 60px rgba(0,0,0,0.4)" },
    glow: { value: "0 4px 20px rgba(100,255,218,0.3)", description: "Malachite glow for FABs" },
  },

  // ─── Z-INDEX SCALE ────────────────────────────────────────
  zIndex: {
    base: { value: "0" },
    dropdown: { value: "10" },
    sticky: { value: "20" },
    overlay: { value: "30" },
    modal: { value: "40" },
    toast: { value: "50" },
    tooltip: { value: "60" },
  },

  // ─── BREAKPOINTS ──────────────────────────────────────────
  breakpoint: {
    mobile: { value: "0px" },
    tablet: { value: "640px" },
    desktop: { value: "1024px" },
    wide: { value: "1440px" },
  },
} as const

// ═══════════════════════════════════════════════════════════════
// TIER 2 — SEMANTIC TOKENS
// These change per theme. Values from Nyuchi Design canonical.
// ═══════════════════════════════════════════════════════════════

export type ThemeMode = "dark" | "light" | "high-contrast"

export const semanticTokens: Record<ThemeMode, Record<string, { value: string }>> = {
  dark: {
    // Surfaces — SWAPPED arrangement, AAA-optimised (April 2026)
    // background is the AMBIENT page base (lighter, L10%)
    // card is the CONTENT surface (darker, L6%)
    // muted is the DEEPEST fill (L2%, maximum text contrast)
    // overlay is the MODAL/SHEET surface (L14%, scrim creates pop)
    background: { value: "#0E0D0C" },
    foreground: { value: "#F5F5F4" },
    card: { value: "#100F0E" },
    "card-foreground": { value: "#F5F5F4" },
    muted: { value: "#050504" },
    "muted-foreground": { value: "#B2AFA8" },
    overlay: { value: "#252421" },
    scrim: { value: "rgba(0,0,0,0.60)" },
    primary: { value: "#F5F5F4" },
    "primary-foreground": { value: "#0E0D0C" },
    secondary: { value: "#050504" },
    "secondary-foreground": { value: "#F5F5F4" },
    accent: { value: "#050504" },
    "accent-foreground": { value: "#F5F5F4" },
    destructive: { value: "#F2B8B5" },
    border: { value: "rgba(255,255,255,0.06)" },
    input: { value: "rgba(255,255,255,0.06)" },
    ring: { value: "#F5F5F4" },
  },
  light: {
    // Surfaces — SWAPPED arrangement, AAA-optimised (April 2026)
    // background is the AMBIENT page base (warm grey, slightly tinted)
    // card is the CONTENT surface (pure white)
    // muted is the WARM CREAM fill
    // overlay is the MODAL/SHEET surface (white, same as card in light mode)
    background: { value: "#F3F3F1" },
    foreground: { value: "#141413" },
    card: { value: "#FFFFFF" },
    "card-foreground": { value: "#141413" },
    muted: { value: "#FAF9F5" },
    "muted-foreground": { value: "#494840" },
    overlay: { value: "#FFFFFF" },
    scrim: { value: "rgba(0,0,0,0.40)" },
    primary: { value: "#141413" },
    "primary-foreground": { value: "#FFFFFF" },
    secondary: { value: "#FAF9F5" },
    "secondary-foreground": { value: "#141413" },
    accent: { value: "#FAF9F5" },
    "accent-foreground": { value: "#141413" },
    destructive: { value: "#B3261E" },
    border: { value: "rgba(10,10,10,0.06)" },
    input: { value: "rgba(10,10,10,0.06)" },
    ring: { value: "#141413" },
  },
  "high-contrast": {
    background: { value: "#000000" },
    foreground: { value: "#FFFFFF" },
    card: { value: "#1A1A1A" },
    "card-foreground": { value: "#FFFFFF" },
    muted: { value: "#2A2A2A" },
    "muted-foreground": { value: "#E0E0E0" },
    primary: { value: "#FFFFFF" },
    "primary-foreground": { value: "#000000" },
    secondary: { value: "#2A2A2A" },
    "secondary-foreground": { value: "#FFFFFF" },
    accent: { value: "#2A2A2A" },
    "accent-foreground": { value: "#FFFFFF" },
    destructive: { value: "#FCA5A5" },
    border: { value: "#FFFFFF" },
    input: { value: "#FFFFFF" },
    ring: { value: "#FFFFFF" },
  },
}

// ═══════════════════════════════════════════════════════════════
// LISTING THEMES — Ten Colors of Africa
// Seven Minerals (geological) + Seven Heritage (atmospheric)
// Each theme provides a background gradient for listing pages.
// ═══════════════════════════════════════════════════════════════

export type ListingTheme =
  | "default"
  | "cobalt"
  | "tanzanite"
  | "malachite"
  | "gold"
  | "terracotta"
  | "indigo"
  | "savanna"
  | "baobab"
  | "sunset"
  | "river"

export const listingThemes: Record<
  ListingTheme,
  {
    name: string
    accent: string | null
    bg: string
    surface: string
    gradient: string | null
    family: "mineral" | "heritage" | "default"
    origin: string
  }
> = {
  default: {
    name: "Default",
    accent: null,
    bg: "#0E0D0C",
    surface: "#100F0E",
    gradient: null,
    family: "default",
    origin: "",
  },
  // Minerals
  cobalt: {
    name: "Cobalt",
    accent: primitives.color.cobalt.value,
    bg: "#001833",
    surface: "#002244",
    gradient: "linear-gradient(145deg, #000D1A 0%, #001833 50%, #002244 100%)",
    family: "mineral",
    origin: "Katanga (DRC), Zambian Copperbelt",
  },
  tanzanite: {
    name: "Tanzanite",
    accent: primitives.color.tanzanite.value,
    bg: "#1A0033",
    surface: "#2A0055",
    gradient: "linear-gradient(145deg, #0D001A 0%, #1A0033 50%, #2A0055 100%)",
    family: "mineral",
    origin: "Merelani Hills, Tanzania",
  },
  malachite: {
    name: "Malachite",
    accent: primitives.color.malachite.value,
    bg: "#002E25",
    surface: "#003D32",
    gradient: "linear-gradient(145deg, #001A14 0%, #002E25 50%, #003D32 100%)",
    family: "mineral",
    origin: "Congo Copper Belt",
  },
  gold: {
    name: "Gold",
    accent: primitives.color.gold.value,
    bg: "#1A1400",
    surface: "#2A2200",
    gradient: "linear-gradient(145deg, #0D0A00 0%, #1A1400 50%, #2A2200 100%)",
    family: "mineral",
    origin: "Ghana, South Africa, Mali",
  },
  terracotta: {
    name: "Terracotta",
    accent: primitives.color.terracotta.value,
    bg: "#1A0F05",
    surface: "#2A1A0A",
    gradient: "linear-gradient(145deg, #0D0800 0%, #1A0F05 50%, #2A1A0A 100%)",
    family: "mineral",
    origin: "Pan-African Sahel",
  },
  // Heritage
  indigo: {
    name: "Indigo",
    accent: primitives.color.indigo.value,
    bg: "#0D1040",
    surface: "#141866",
    gradient: "linear-gradient(145deg, #050820 0%, #0D1040 50%, #141866 100%)",
    family: "heritage",
    origin: "Yoruba adire, Kano dye pits, Shweshwe cloth",
  },
  savanna: {
    name: "Savanna",
    accent: primitives.color.savanna.value,
    bg: "#1A1408",
    surface: "#2A2010",
    gradient: "linear-gradient(145deg, #0D0A03 0%, #1A1408 50%, #2A2010 100%)",
    family: "heritage",
    origin: "Golden grasslands, Sahel to Southern Africa",
  },
  baobab: {
    name: "Baobab",
    accent: primitives.color.baobab.value,
    bg: "#0F1A0F",
    surface: "#1A2A1A",
    gradient: "linear-gradient(145deg, #060D06 0%, #0F1A0F 50%, #1A2A1A 100%)",
    family: "heritage",
    origin: "Tree of life, sub-Saharan Africa",
  },
  sunset: {
    name: "Sunset",
    accent: primitives.color.sunset.value,
    bg: "#2A0A02",
    surface: "#3D1005",
    gradient: "linear-gradient(145deg, #1A0500 0%, #2A0A02 50%, #3D1005 100%)",
    family: "heritage",
    origin: "African dusk, rose-copper sky",
  },
  river: {
    name: "River",
    accent: primitives.color.river.value,
    bg: "#002025",
    surface: "#003035",
    gradient: "linear-gradient(145deg, #001418 0%, #002025 50%, #003035 100%)",
    family: "heritage",
    origin: "Zambezi, Limpopo, Nile, Congo",
  },
}

// ═══════════════════════════════════════════════════════════════
// BRAND OVERRIDES — Per-app accent colors
// Each mini-app overrides the primary accent.
// ═══════════════════════════════════════════════════════════════

export type BrandId =
  | "mukoko"
  | "nhimbe"
  | "bushtrade"
  | "lingo"
  | "shamwari"
  | "campfire"
  | "bytes"
  | "novels"
  | "news"
  | "places"
  | "circles"
  | "planner"
  | "transport"
  | "weather"
  | "health"
  | "jobs"
  | "wallet"

/**
 * One mini-app accent, resolved from the mineral it is assigned.
 *
 * `primary`, `container` and `onContainer` were literal hexes — seventeen
 * copies of seven palette values, which is seventeen chances to miss a palette
 * change. `circles` had already missed one: it carried terracotta's pre-Seven
 * `#D4A574` long after the palette said `#E1B07E`. They are read out of
 * `primitives.color` now, so a brand accent cannot disagree with the mineral it
 * names.
 *
 * `primaryHover` is the one value that is NOT derivable: it is a hand-picked
 * tint per mineral, not a formula (the seven existing tints lighten by
 * different amounts on different channels), so it stays authored and is passed
 * in. `primaryMuted` is exactly `primary` at 12% and is computed.
 */
function mutedFrom(hex: string, alpha = 0.12): string {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function brandAccent(mineral: string, primaryHover: string) {
  const palette = primitives.color as Record<string, { value: string }>
  const primary = palette[mineral].value
  return {
    primary,
    mineral,
    primaryHover,
    primaryMuted: mutedFrom(primary),
    container: palette[`${mineral}Container`].value,
    onContainer: palette[`${mineral}OnContainer`].value,
  }
}

export const brandOverrides: Record<
  BrandId,
  {
    primary: string
    mineral: string
    primaryHover: string
    primaryMuted: string
    container: string
    onContainer: string
  }
> = {
  // ─── Mini-App accents (canonical from brand_ecosystem table) ──
  // Mineral assignments: tanzanite=identity/social/premium, cobalt=info/education/productivity,
  // malachite=events/health/nature, gold=commerce/places/wallet, terracotta=community
  mukoko: brandAccent("tanzanite", "#CE9FFF"),
  nhimbe: brandAccent("malachite", "#80FFE4"),
  bushtrade: brandAccent("gold", "#FFDF6B"),
  lingo: brandAccent("cobalt", "#40C4FF"),
  shamwari: brandAccent("tanzanite", "#CE9FFF"),
  campfire: brandAccent("malachite", "#80FFE4"),
  bytes: brandAccent("tanzanite", "#CE9FFF"),
  novels: brandAccent("malachite", "#80FFE4"),
  news: brandAccent("cobalt", "#40C4FF"),
  places: brandAccent("gold", "#FFDF6B"),
  circles: brandAccent("terracotta", "#E0B88A"),
  planner: brandAccent("cobalt", "#40C4FF"),
  transport: brandAccent("gold", "#FFDF6B"),
  weather: brandAccent("cobalt", "#40C4FF"),
  health: brandAccent("malachite", "#80FFE4"),
  jobs: brandAccent("gold", "#FFDF6B"),
  wallet: brandAccent("gold", "#FFDF6B"),
}

// ═══════════════════════════════════════════════════════════════
// BRAND INDUSTRY CATEGORIES — Mineral associations by sector
// Each brand (Nyuchi enterprise, Mukoko super app, Shamwari AI)
// organises products into industry categories, each with a
// mineral accent that reflects the industry's emotional tone.
// ═══════════════════════════════════════════════════════════════

export type IndustryCategory = {
  mineral: string
  label: string
  products: string[]
}

export const brandIndustryCategories: Record<string, Record<string, IndustryCategory>> = {
  nyuchi: {
    services: {
      mineral: "gold",
      label: "Services",
      products: ["Nyuchi Platform", "Tukmart", "Nyuchi Honey"],
    },
    travel: {
      mineral: "malachite",
      label: "Travel",
      products: ["Zimbabwe Travel Information", "Iconic Expeditions"],
    },
    education: {
      mineral: "cobalt",
      label: "Education",
      products: ["Nyuchi Learning", "Nyuchi Lingo"],
    },
    community: {
      mineral: "terracotta",
      label: "Community",
      products: ["Nyuchi Foundation", "Technology Leaders of Africa"],
    },
  },
  mukoko: {
    id: { mineral: "tanzanite", label: "Identity", products: ["Mukoko ID", "Digital Twin"] },
    news: { mineral: "cobalt", label: "News", products: ["Mukoko News"] },
    social: {
      mineral: "tanzanite",
      label: "Social",
      products: ["Campfire", "Bytes", "Novels", "Circles"],
    },
    events: { mineral: "malachite", label: "Events", products: ["Nhimbe"] },
    commerce: { mineral: "gold", label: "Commerce", products: ["BushTrade", "Wallet"] },
    places: { mineral: "gold", label: "Places", products: ["Places", "Transport"] },
    productivity: {
      mineral: "cobalt",
      label: "Productivity",
      products: ["Planner", "Weather", "Jobs"],
    },
    wellness: { mineral: "malachite", label: "Wellness", products: ["Health"] },
    language: { mineral: "cobalt", label: "Language", products: ["Lingo"] },
  },
  shamwari: {
    ai: { mineral: "tanzanite", label: "AI Companion", products: ["Shamwari AI", "Digital Twin"] },
  },
}

// ═══════════════════════════════════════════════════════════════
// TIER 3 — COMPONENT TOKENS
// Scoped values for specific brand components.
// ═══════════════════════════════════════════════════════════════

export const componentTokens = {
  header: { height: "56px", zIndex: "50" },
  bottomNav: { height: "80px", fabSize: "52px", fabRise: "24px" },
  sidebar: { width: "256px", collapsedWidth: "64px" },
  avatar: { sm: "32px", md: "40px", lg: "64px", xl: "80px", xxl: "120px" },
  badge: { height: "20px", padding: "0 8px", fontSize: "10px" },
  input: { height: "48px" },
  button: { height: "56px", heightSm: "48px", heightLg: "56px" },
  card: { padding: "16px", gap: "14px" },
  page: { maxWidth: "1280px", margin: "20px" },
  focusRing: { width: "2px", offset: "2px", color: "var(--ring)" },
  // GLOBAL CSS RULE (add to globals.css):
  // :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  // button:focus-visible, a:focus-visible, [role="button"]:focus-visible,
  // input:focus-visible, select:focus-visible, textarea:focus-visible {
  //   outline: 2px solid var(--ring); outline-offset: 2px;
  // }
  mineralStrip: { width: "4px", position: "left", direction: "vertical" },
  listingImage: {
    aspectRatio: "1/1",
    description: "Always square — events, products, articles, places",
  },
} as const

// ═══════════════════════════════════════════════════════════════
// CSS GENERATOR — Produces CSS custom properties for :root
// ═══════════════════════════════════════════════════════════════

/**
 * Every palette family in `primitives.color`, as `[name, family]` pairs, in
 * declaration order.
 *
 * This is the one place that answers "which colour families exist?", and it
 * answers it by reading the token data rather than by restating it. Anything
 * that needs the list — `generateCSSVariables()` below, the cross-surface
 * parity test, a downstream generator — asks here, so there is no second list
 * to forget to update.
 *
 * Container, on-container, neutral and semantic entries are deliberately not
 * families: they carry no `family` tag, and they are derived from or scoped to
 * a family rather than being one.
 */
export function paletteFamilies(): [string, PaletteFamily][] {
  return Object.entries(primitives.color).flatMap(([name, token]) =>
    "family" in token ? [[name, token.family as PaletteFamily] as [string, PaletteFamily]] : []
  )
}

/** The three colour groups. Seven families each — the system is a heptagon three times over. */
export type PaletteFamily = "mineral" | "heritage" | "experimental"

/**
 * A `var(--color-<name>)` reference with the palette hex as its fallback.
 *
 * The fallback exists for contexts where the custom property is not defined —
 * an email, a canvas, a consumer who installed this item without globals.css —
 * and it was written out by hand at every call site. That made every fallback a
 * private copy of a palette value: `var(--color-terracotta, #D4A574)` still
 * named terracotta's pre-Seven hex long after the palette said `#E1B07E`, so a
 * chart rendered without the stylesheet drew the wrong brand colour and nothing
 * could tell. Reading the fallback out of `primitives.color` — which is itself
 * generated — means the two halves of the expression cannot disagree.
 */
export function paletteVar(name: string, theme: ThemeMode = "dark"): string {
  const palette = primitives.color as Record<string, { value: string } | undefined>
  const token = palette[theme === "light" ? `${name}Light` : name]
  return token ? `var(--color-${name}, ${token.value})` : `var(--color-${name})`
}

export function generateCSSVariables(theme: ThemeMode = "dark", brand: BrandId = "mukoko"): string {
  const semantic = semanticTokens[theme]
  const brandColors = brandOverrides[brand]

  const lines: string[] = [":root {"]

  // Palette colours, theme-resolved.
  //
  // These keys are DERIVED from `primitives.color` — every entry carrying a
  // `family` tag is a palette family, and its light counterpart is `<name>Light`
  // by the convention the table above follows throughout.
  //
  // They used to be two hardcoded arrays, `["cobalt", "tanzanite", "malachite",
  // "gold", "terracotta"]` and `["indigo", "savanna", "baobab", "sunset",
  // "river"]`, written when the palette was five-and-five. The palette became
  // seven-and-seven and then gained the experimental seven; the arrays did not,
  // so this function emitted ten of twenty-one families and nothing failed.
  // sodalite, copper, hematite, kalahari and the whole experimental heptagon
  // were simply unreachable from generated CSS.
  //
  // Swapping five names for twenty-one would have fixed today and rebuilt the
  // trap for tomorrow: the next family added is the next one silently missing.
  // A literal list of what the data contains is the bug, not its length. So the
  // list is gone — add a family to `primitives.color` with a `family` tag and it
  // appears here, in globals.css, and in `__tests__/tokens-surface-parity.test.ts`
  // without anyone editing this function.
  for (const [name] of paletteFamilies()) {
    const key = theme === "light" ? `${name}Light` : name
    const val = primitives.color[key as keyof typeof primitives.color]
    lines.push(`  --color-${name}: ${val.value};`)
  }

  // Radii
  for (const [key, val] of Object.entries(primitives.radius)) {
    lines.push(`  --radius-${key}: ${val.value};`)
  }

  // Spacing
  for (const [key, val] of Object.entries(primitives.spacing)) {
    lines.push(`  --space-${key}: ${val.value};`)
  }

  // Shadows
  for (const [key, val] of Object.entries(primitives.shadow)) {
    lines.push(`  --shadow-${key}: ${val.value};`)
  }

  // Touch targets
  lines.push(`  --touch-target: ${primitives.touchTarget.default.value};`)
  lines.push(`  --touch-target-sm: ${primitives.touchTarget.sm.value};`)

  // Motion
  for (const [key, val] of Object.entries(primitives.motion.duration)) {
    lines.push(`  --motion-${key}: ${val.value};`)
  }
  for (const [key, val] of Object.entries(primitives.motion.easing)) {
    lines.push(`  --easing-${key}: ${val.value};`)
  }

  // Semantic tokens (theme-dependent)
  for (const [key, val] of Object.entries(semantic)) {
    lines.push(`  --${key}: ${val.value};`)
  }

  // Brand overrides
  lines.push(`  --color-primary: ${brandColors.primary};`)
  lines.push(`  --color-primary-hover: ${brandColors.primaryHover};`)
  lines.push(`  --color-primary-muted: ${brandColors.primaryMuted};`)

  // Component tokens
  for (const [comp, tokens] of Object.entries(componentTokens)) {
    for (const [key, val] of Object.entries(tokens)) {
      lines.push(`  --${comp}-${key}: ${val};`)
    }
  }

  lines.push("}")
  return lines.join("\n")
}

// ═══════════════════════════════════════════════════════════════
// MULTI-PLATFORM TOKEN GENERATOR
//
// `css` and `json` are generated here because they cover the WHOLE token
// system — semantic tokens, brand overrides, listing themes, component tokens —
// which lives in this file.
//
// The per-platform COLOUR files (Swift, Kotlin, ArkTS, React Native, Python,
// Rust) are NOT generated here any more. They are written by
// `scripts/sync-tokens.ts` from the Supabase collections `styling-minerals` and
// `styling-heritage-colors`, and guarded by `pnpm tokens:verify`.
//
// The generators that stood here read a hardcoded in-file colour map: they
// emitted five minerals and five heritage tones against a seven-and-seven
// system, under `mukoko`-prefixed names, dark theme only. Keeping them would
// keep two sources of truth for one set of values inside the node whose
// covenant is "design decisions are data, not code".
// ═══════════════════════════════════════════════════════════════

export type PlatformFormat = "css" | "json"

export function generateTokens(format: PlatformFormat): string {
  if (format === "json") {
    return JSON.stringify(
      { primitives, semanticTokens, brandOverrides, listingThemes, componentTokens },
      null,
      2
    )
  }
  return generateCSSVariables()
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// SEMANTIC STATUS & ALERT TOKEN SYSTEM
//
// IMPORTANT: These use GLOBALLY RECOGNIZED accessibility colors,
// NOT the Seven African Minerals. The minerals are brand identity
// (links, CTAs, achievements, community). Status colors are a
// SEPARATE universal system that works across all languages,
// literacy levels, and cultures. Color is the first thing people
// see — especially across Africa and different languages.
//
// WCAG AA compliant on both light and dark backgrounds.
// Based on: Material Design, Apple HIG, W3C accessibility guidelines.
// ═══════════════════════════════════════════════════════════════

/**
 * Universal status colors — WCAG AA compliant, globally recognized.
 * These are NOT minerals. Red = error. Amber = warning. Green = success.
 * People see color before text. This is critical for accessibility.
 */
export const universalStatus = {
  success: "#22C55E", // Green-500 — universal "go/safe/done/complete"
  warning: "#F59E0B", // Amber-500 — universal "caution/attention/pending"
  error: "#EF4444", // Red-500 — universal "stop/danger/error/failed"
  info: "#3B82F6", // Blue-500 — universal "notice/information/help"
  neutral: "#6B7280", // Gray-500 — neutral/inactive/disabled/unknown
} as const

/**
 * Status tokens — the universal 5-state status system.
 * Every component that shows success/warning/error/info/neutral uses these.
 */
export const statusTokens = {
  success: {
    value: "var(--status-success, #22C55E)",
    css: "--status-success",
    hex: "#22C55E",
    label: "Success",
  },
  warning: {
    value: "var(--status-warning, #F59E0B)",
    css: "--status-warning",
    hex: "#F59E0B",
    label: "Warning",
  },
  error: {
    value: "var(--status-error, #EF4444)",
    css: "--status-error",
    hex: "#EF4444",
    label: "Error",
  },
  info: {
    value: "var(--status-info, #3B82F6)",
    css: "--status-info",
    hex: "#3B82F6",
    label: "Info",
  },
  neutral: {
    value: "var(--status-neutral, #6B7280)",
    css: "--status-neutral",
    hex: "#6B7280",
    label: "Neutral",
  },
} as const

/**
 * Severity tokens — graduated urgency scale for alerts, weather, health.
 * Uses universally recognized color escalation: green → amber → orange → red.
 */
export const severityTokens = {
  low: {
    value: "var(--severity-low, #22C55E)",
    css: "--severity-low",
    hex: "#22C55E",
    label: "Low",
  },
  moderate: {
    value: "var(--severity-moderate, #F59E0B)",
    css: "--severity-moderate",
    hex: "#F59E0B",
    label: "Moderate",
  },
  high: {
    value: "var(--severity-high, #F97316)",
    css: "--severity-high",
    hex: "#F97316",
    label: "High",
  },
  severe: {
    value: "var(--severity-severe, #EF4444)",
    css: "--severity-severe",
    hex: "#EF4444",
    label: "Severe",
  },
  extreme: {
    value: "var(--severity-extreme, #DC2626)",
    css: "--severity-extreme",
    hex: "#DC2626",
    label: "Extreme",
  },
  cold: {
    value: "var(--severity-cold, #3B82F6)",
    css: "--severity-cold",
    hex: "#3B82F6",
    label: "Cold",
  },
} as const

/**
 * Notification tokens — for toast, banner, and notification components.
 * Same universal colors as status — consistency across all notification types.
 */
export const notificationTokens = {
  success: {
    value: "var(--notification-success, #22C55E)",
    css: "--notification-success",
    hex: "#22C55E",
  },
  warning: {
    value: "var(--notification-warning, #F59E0B)",
    css: "--notification-warning",
    hex: "#F59E0B",
  },
  error: {
    value: "var(--notification-error, #EF4444)",
    css: "--notification-error",
    hex: "#EF4444",
  },
  info: { value: "var(--notification-info, #3B82F6)", css: "--notification-info", hex: "#3B82F6" },
} as const

/**
 * Connection tokens — connectivity gradient for local-first architecture.
 * Green = online, Blue = syncing, Amber = cached, Red/Orange = offline.
 */
export const connectionTokens = {
  online: {
    value: "var(--connection-online, #22C55E)",
    css: "--connection-online",
    hex: "#22C55E",
    label: "Connected",
  },
  syncing: {
    value: "var(--connection-syncing, #3B82F6)",
    css: "--connection-syncing",
    hex: "#3B82F6",
    label: "Syncing",
  },
  cached: {
    value: "var(--connection-cached, #F59E0B)",
    css: "--connection-cached",
    hex: "#F59E0B",
    label: "Cached",
  },
  offline: {
    value: "var(--connection-offline, #EF4444)",
    css: "--connection-offline",
    hex: "#EF4444",
    label: "Offline",
  },
} as const

/**
 * Verification tier tokens — these DO use minerals because they are BRAND identity.
 * Verification tiers are a Mukoko-specific concept, not a universal status.
 * The minerals communicate prestige and progression within the ecosystem.
 */
export const verificationTokens = {
  unverified: {
    value: "var(--tier-unverified, #6B7280)",
    css: "--tier-unverified",
    hex: "#6B7280",
    label: "Unverified",
  },
  community: {
    value: `var(--tier-community, ${paletteVar("malachite")})`,
    css: "--tier-community",
    mineral: "malachite",
    label: "Community",
  },
  otp: {
    value: `var(--tier-otp, ${paletteVar("cobalt")})`,
    css: "--tier-otp",
    mineral: "cobalt",
    label: "OTP Verified",
  },
  government: {
    value: `var(--tier-government, ${paletteVar("tanzanite")})`,
    css: "--tier-government",
    mineral: "tanzanite",
    label: "Government ID",
  },
  licensed: {
    value: `var(--tier-licensed, ${paletteVar("gold")})`,
    css: "--tier-licensed",
    mineral: "gold",
    label: "Licensed",
  },
} as const

/**
 * Crypto level tokens — universal color scale (green = safe, red = none).
 * NOT minerals — these are security indicators that must be instantly readable.
 */
export const cryptoTokens = {
  quantumSafe: {
    value: "var(--crypto-quantum-safe, #22C55E)",
    css: "--crypto-quantum-safe",
    hex: "#22C55E",
    label: "Quantum Safe",
  },
  classical: {
    value: "var(--crypto-classical, #3B82F6)",
    css: "--crypto-classical",
    hex: "#3B82F6",
    label: "Classical",
  },
  weak: {
    value: "var(--crypto-weak, #F59E0B)",
    css: "--crypto-weak",
    hex: "#F59E0B",
    label: "Weak",
  },
  none: {
    value: "var(--crypto-none, #EF4444)",
    css: "--crypto-none",
    hex: "#EF4444",
    label: "None",
  },
} as const

/**
 * Moderation tokens — universal colors (green = approved, red = rejected).
 */
export const moderationTokens = {
  approved: {
    value: "var(--moderation-approved, #22C55E)",
    css: "--moderation-approved",
    hex: "#22C55E",
    label: "Approved",
  },
  pending: {
    value: "var(--moderation-pending, #F59E0B)",
    css: "--moderation-pending",
    hex: "#F59E0B",
    label: "Pending",
  },
  flagged: {
    value: "var(--moderation-flagged, #F97316)",
    css: "--moderation-flagged",
    hex: "#F97316",
    label: "Flagged",
  },
  rejected: {
    value: "var(--moderation-rejected, #EF4444)",
    css: "--moderation-rejected",
    hex: "#EF4444",
    label: "Rejected",
  },
} as const

/**
 * Service health tokens — universal colors (green = operational, red = outage).
 */
export const serviceHealthTokens = {
  operational: {
    value: "var(--health-operational, #22C55E)",
    css: "--health-operational",
    hex: "#22C55E",
    label: "Operational",
  },
  degraded: {
    value: "var(--health-degraded, #F59E0B)",
    css: "--health-degraded",
    hex: "#F59E0B",
    label: "Degraded",
  },
  outage: {
    value: "var(--health-outage, #EF4444)",
    css: "--health-outage",
    hex: "#EF4444",
    label: "Outage",
  },
  maintenance: {
    value: "var(--health-maintenance, #3B82F6)",
    css: "--health-maintenance",
    hex: "#3B82F6",
    label: "Maintenance",
  },
} as const

/**
 * Generate CSS custom property declarations for all semantic tokens.
 */
export function generateStatusCSS(): string {
  const lines = [":root {", "  /* Universal status colors — NOT minerals */"]
  const groups = [
    { name: "Status", tokens: statusTokens },
    { name: "Severity", tokens: severityTokens },
    { name: "Notification", tokens: notificationTokens },
    { name: "Connection", tokens: connectionTokens },
    { name: "Crypto", tokens: cryptoTokens },
    { name: "Moderation", tokens: moderationTokens },
    { name: "Health", tokens: serviceHealthTokens },
  ]
  for (const group of groups) {
    lines.push(`  /* ${group.name} */`)
    for (const [, token] of Object.entries(group.tokens)) {
      if ("css" in token && "hex" in token) lines.push(`  ${token.css}: ${token.hex};`)
    }
  }
  lines.push("  /* Verification tiers — these use minerals (brand identity) */")
  lines.push("  --tier-unverified: #6B7280;")
  lines.push(`  --tier-community: ${paletteVar("malachite")};`)
  lines.push(`  --tier-otp: ${paletteVar("cobalt")};`)
  lines.push(`  --tier-government: ${paletteVar("tanzanite")};`)
  lines.push(`  --tier-licensed: ${paletteVar("gold")};`)
  lines.push("}")
  return lines.join("\n")
}

// CHART COLOR SYSTEM
// Maps chart indices to Seven African Minerals + Heritage colors.
// Replaces shadcn default --chart-1..5 with Nyuchi mineral palette.
// Import mineralChartConfig in any chart block for instant brand compliance.
// ═══════════════════════════════════════════════════════════════

/**
 * The `--chart-N` custom properties in globals.css take the first five minerals
 * in palette order, light theme in `:root` and dark in `.dark`. The hexes are
 * deliberately NOT restated here: they are in the generated palette region
 * above, and a comment that repeats a generated value is a copy that rots
 * silently — this one did, and went on naming terracotta's pre-Seven
 * `#D4A574` / `#8B4513` after the palette had moved.
 */

/** Pre-built chart configs mapping data keys to mineral colors */
export const mineralChartConfig = {
  /** Single-series chart — uses cobalt */
  single: (label: string) => ({
    value: { label, color: paletteVar("cobalt") },
  }),
  /** Two-series chart — cobalt + malachite */
  dual: (label1: string, label2: string) => ({
    [label1.toLowerCase().replace(/\\s/g, "_")]: {
      label: label1,
      color: paletteVar("cobalt"),
    },
    [label2.toLowerCase().replace(/\\s/g, "_")]: {
      label: label2,
      color: paletteVar("malachite"),
    },
  }),
  /** Five-series chart — the first five minerals in palette order */
  fiveMinerals: (labels: [string, string, string, string, string]) =>
    Object.fromEntries(
      labels.map((label, i) => [
        label.toLowerCase().replace(/\\s/g, "_"),
        { label, color: mineralChartColors[i] },
      ])
    ),
  /** Heritage colors for the later series */
  heritage: Object.fromEntries(
    paletteFamilies()
      .filter(([, family]) => family === "heritage")
      .map(([name]) => [name, paletteVar(name)])
  ),
} as const

/**
 * Chart colour array for recharts — palette order, minerals then heritage.
 *
 * Derived from `paletteFamilies()` rather than listed, for the reason spelled
 * out on `generateCSSVariables()`: a literal list of what the palette contains
 * is the bug, not its length. The previous list held ten entries, frozen at the
 * five-and-five era, and five of those ten carried pre-Seven hexes.
 */
export const mineralChartColors: readonly string[] = paletteFamilies()
  .filter(([, family]) => family !== "experimental")
  .map(([name]) => paletteVar(name))

// ═══════════════════════════════════════════════════════════════
// COLOR RESOLUTION UTILITIES
// For Canvas-based charts and non-CSS-aware rendering contexts.
// CSS var() references don't work in Canvas 2D — these resolve
// them to concrete hex values at runtime.
// ═══════════════════════════════════════════════════════════════

/**
 * Resolve a CSS custom property to its computed value.
 * Returns the concrete color for Canvas 2D, WebGL, or native contexts.
 * Falls back to the raw string if resolution fails (SSR, DOM not ready).
 */
export function resolveColor(color: string): string {
  if (typeof window === "undefined") return color
  if (!color.startsWith("var(")) return color
  const prop = color
    .replace(/^var\(/, "")
    .replace(/\)$/, "")
    .split(",")[0]
    .trim()
  try {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
    return resolved || color
  } catch {
    return color
  }
}

/**
 * Apply alpha to a resolved color string.
 * Handles hex (#RGB, #RRGGBB), rgb(), rgba(), hsl(), hsla(), oklch().
 * Canvas 2D cannot use CSS opacity — must compute rgba directly.
 */
export function hexWithAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha))
  if (!color || color.startsWith("var(")) return `rgba(0,0,0,${a})`

  const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},${a})`

  const hslMatch = color.match(/^hsla?\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%/)
  if (hslMatch) return `hsla(${hslMatch[1]},${hslMatch[2]}%,${hslMatch[3]}%,${a})`

  const oklchMatch = color.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (oklchMatch) return `oklch(${oklchMatch[1]} ${oklchMatch[2]} ${oklchMatch[3]} / ${a})`

  if (color.startsWith("#")) {
    const hex = color.replace("#", "")
    const base =
      hex.length === 3
        ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
        : hex.length >= 6
          ? hex.slice(0, 6)
          : hex
    return `#${base}${Math.round(a * 255)
      .toString(16)
      .padStart(2, "0")}`
  }

  return `rgba(0,0,0,${a})`
}

/**
 * Generate the canonical tokens.json — single source of truth for all platform generators.
 * The architecture doc specifies: "The source of truth is a single tokens.json file
 * that all platform generators read from."
 */
export function generateTokensJSON(): string {
  return JSON.stringify(
    {
      $schema: "https://mzizi.dev/tokens/v1",
      version: "4.0.2",
      generated: new Date().toISOString(),
      colors: { minerals: primitives.color, semantic: semanticTokens },
      radii: primitives.radius,
      typography: {
        family: primitives.fontFamily,
        size: primitives.fontSize,
        weight: primitives.fontWeight,
      },
      spacing: primitives.spacing,
      motion: primitives.motion,
      touchTargets: primitives.touchTarget,
      brandOverrides,
      chartColors: mineralChartColors,
      status: statusTokens,
      severity: severityTokens,
      notifications: notificationTokens,
      connection: connectionTokens,
      verification: verificationTokens,
      crypto: cryptoTokens,
      moderation: moderationTokens,
      serviceHealth: serviceHealthTokens,
    },
    null,
    2
  )
}

/**
 * Generate ArkTS/ArkUI tokens for HarmonyOS native shell.
 * Maps minerals + semantics to ArkUI Resource files + theme tokens.
 */
// `generateArkTS` was removed with the other platform generators above —
// same hardcoded five-and-five colour map. ArkTS now comes from
// `scripts/sync-tokens.ts` as nyuchi-tokens-arkts.ets.
