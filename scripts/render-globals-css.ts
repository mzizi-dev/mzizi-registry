/**
 * THE COMBINED `globals.css` — one self-contained file, generated.
 *
 * The owner's instruction: "we have a default `globals.css`. This file is
 * served over the registry of both shadcn and crates. This is the combined file
 * across the repos. This then is copied to every repo that needs styling."
 *
 * So this renders ONE file. Not a token package, not a layered import set, not
 * a sibling `@theme` artifact — a single stylesheet a repo copies in and uses.
 * It carries `@import "tailwindcss"`, its own `@theme` block, `:root`, `.dark`,
 * the per-brand blocks, and every non-colour ladder. Nothing it needs lives
 * anywhere else, because a copy cannot follow an `@import` to a sibling that
 * was not copied with it.
 *
 * NOTHING HERE IS HAND-AUTHORED COLOUR. The 21 families come from
 * `lib/tokens/palette.source.ts`, the repo's declared source of truth, through
 * `scripts/sync-tokens.ts` — which registers this renderer as a PLATFORM_TARGET
 * so `pnpm tokens:verify` gates it beside the Swift, Kotlin, ArkTS,
 * React-Native, Python and Rust emitters. That placement is the whole point:
 * `nyuchi-tokens-typescript.ts` shipped ten families of twenty-one for months
 * because it was hand-maintained and `tokens:verify` covers only the files it
 * writes. A gate that cannot see a surface reports green for it. This surface
 * is one the gate writes.
 *
 * The non-colour ladders and the surface ladder are declared as constants
 * below, for the same reason `SCALE` is declared in `sync-tokens.ts`: colour is
 * palette data, these are doctrine. `scripts/check-tokens-upstream.mjs` checks
 * them against `/v1/brand` in CI — never at build or runtime.
 *
 * Structure is lifted from `nyuchi/nhimbe/src/app/globals.css`, which two
 * independent audits called the best-organised token file in the estate:
 * box-drawn section headers, a comment on every divergence naming what would
 * reverse it, provenance stamps, consistent ordering.
 *
 *   pnpm tokens:sync     regenerate
 *   pnpm tokens:verify   CI gate
 */

import type { ExperimentalToken, HeritageToken, MineralToken } from "../lib/tokens/palette.source"

type Mineral = MineralToken
type Heritage = HeritageToken
type Experimental = ExperimentalToken

// ════════════════════════════════════════════════════════════════════════════
// MEASUREMENT — APCA 3.0 and WCAG 2.2
// ════════════════════════════════════════════════════════════════════════════

/**
 * Mzizi's stated accessibility standard is "APCA 3.0 AAA" (`/v1/brand`
 * accessibility.standard), so the accessibility tier below is measured, not
 * eyeballed. This implementation reproduces all six APCA figures already
 * published in the estate to within 0.04 Lc — the two in
 * `shamwari-ai/docs/style.css`, the two in `mzizi-dev/mzizi-docs/style.css`,
 * and the two trap values those files call out — which is what licenses using
 * it to derive new values for the other eighteen families.
 */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

const toHex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`.toUpperCase()

/** Linear interpolation in sRGB — the method the estate already derives with. */
function mix(from: string, to: string, t: number): string {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return toHex(a.map((c, i) => c + (b[i] - c) * t))
}

const screenY = (hex: string) =>
  (([r, g, b]) => 0.2126729 * r + 0.7151522 * g + 0.072175 * b)(
    hexToRgb(hex).map((c) => Math.pow(c / 255, 2.4))
  )

/** APCA 0.1.9 (W3 SAPC). Positive = dark text on light; negative = the reverse. */
export function apca(text: string, bg: string): number {
  const clamp = (y: number) => (y >= 0.022 ? y : y + Math.pow(0.022 - y, 1.414))
  const t = clamp(screenY(text))
  const b = clamp(screenY(bg))
  if (Math.abs(b - t) < 0.0005) return 0
  if (b > t) {
    const sapc = (Math.pow(b, 0.56) - Math.pow(t, 0.57)) * 1.14
    return (sapc < 0.1 ? 0 : sapc - 0.027) * 100
  }
  const sapc = (Math.pow(b, 0.65) - Math.pow(t, 0.62)) * 1.14
  return (sapc > -0.1 ? 0 : sapc + 0.027) * 100
}

/** WCAG 2.2 contrast ratio — the bar `bundu` measured its copper against. */
export function wcag(a: string, b: string): number {
  const lum = (hex: string) =>
    (([r, g, b2]) => 0.2126 * r + 0.7152 * g + 0.0722 * b2)(
      hexToRgb(hex).map((c) => {
        const s = c / 255
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      })
    )
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Walk from `start` toward `end` in 1% steps; return the first step that passes. */
function walk(start: string, end: string, ok: (hex: string) => boolean): string {
  if (ok(start)) return start
  for (let t = 0.01; t <= 0.97; t += 0.01) {
    const c = mix(start, end, t)
    if (ok(c)) return c
  }
  return end
}

// ════════════════════════════════════════════════════════════════════════════
// DOCTRINE CONSTANTS — not palette data, so declared here like `SCALE`
// ════════════════════════════════════════════════════════════════════════════

/**
 * The nine-step surface ladder, `/v1/brand` `backgrounds`.
 *
 * NOTE `base`. `/v1/brand` calls this step `base`; `app/globals.css` lost that
 * name and calls it `--background`, which is also a shadcn semantic role. Both
 * names ship here — `--base` is the ladder step, `--background` an alias of it
 * — so a consumer reading either vocabulary resolves, and the step keeps the
 * name the design system gives it.
 *
 * `muted` is the tenth background `/v1/brand` publishes and is emitted too; it
 * is not a rung of the nine-step ladder, it is the deepest inset fill.
 */
export const LADDER = [
  ["pitch", "#FAFAFA", "#050505", "Deepest surface — media wells, splash (prime step P2)"],
  ["void", "#F8F8F7", "#080807", "App shell behind base (prime step P3)"],
  ["base", "#F3F3F1", "#0E0D0C", "Page background — ambient base surface (prime step P5)"],
  ["surface", "#EEEEEC", "#131211", "Card / panel surface (prime step P7)"],
  ["container", "#E5E4E1", "#1E1D1A", "Neutral containers, grouped content (prime step P11)"],
  ["overlay", "#E0DFDC", "#23221F", "Overlays and dialogs (prime step P13)"],
  ["raised", "#D6D5D1", "#2E2C29", "Raised elements above overlay — menus, toasts (prime step P17)"],
  ["scrim", "rgba(0, 0, 0, 0.4)", "rgba(0, 0, 0, 0.6)", "Semi-transparent backdrop behind overlays"],
  [
    "wash",
    "color-mix(in oklab, var(--surface) 93%, var(--brand-accent))",
    "color-mix(in oklab, var(--surface) 88%, var(--brand-accent))",
    "Cover-colour page wash — surface tinted with the active brand accent",
  ],
] as const

/** The tenth background — deepest inset fill, not a ladder rung. */
export const MUTED = ["#FAF9F5", "#050504"] as const

/** `/v1/brand` `semanticColors`, status subset — brand-neutral, not disputed. */
export const STATUS = [
  ["success", "#004D40", "#64FFDA", "Success states, positive actions"],
  ["warning", "#7A5C00", "#FFD866", "Warning states, caution"],
  ["error", "#B3261E", "#F2B8B5", "Error states, destructive actions"],
  ["info", "#0047AB", "#00B0FF", "Informational states"],
  ["neutral", "#55514B", "#A09C93", "Neutral / inactive status, secondary data series"],
  ["offline", "#674C32", "#BA9570", "Offline / disconnected state"],
  ["syncing", "#1C5962", "#36ABBA", "In-progress sync / pending state"],
  ["destructive-container", "#FDEDED", "#3E1818", "Soft background behind destructive content"],
] as const

/** Spacing — 17 rungs, `/v1/brand` `spacing`. */
export const SPACING = [
  ["xxs", "0.125rem", 2], ["xs", "0.25rem", 4], ["xs-plus", "0.375rem", 6],
  ["sm", "0.5rem", 8], ["sm-plus", "0.625rem", 10], ["md", "0.75rem", 12],
  ["base", "1rem", 16], ["base-plus", "1.25rem", 20], ["lg", "1.5rem", 24],
  ["xl", "2rem", 32], ["xl-plus", "2.5rem", 40], ["2xl", "3rem", 48],
  ["2xl-plus", "3.5rem", 56], ["3xl", "4rem", 64], ["4xl", "5rem", 80],
  ["5xl", "6rem", 96], ["6xl", "8rem", 128],
] as const

/** Type scale — 13 sizes, `/v1/brand` `typography.scale`. */
export const TYPE = [
  ["display", "4.5rem", 72, "1.1", 700, "serif"],
  ["display-sm", "3.75rem", 60, "1.1", 700, "serif"],
  ["h1", "3rem", 48, "1.15", 700, "serif"],
  ["h2", "2.25rem", 36, "1.2", 600, "serif"],
  ["h3", "1.875rem", 30, "1.25", 600, "serif"],
  ["h4", "1.5rem", 24, "1.3", 600, "sans"],
  ["h5", "1.25rem", 20, "1.4", 600, "sans"],
  ["h6", "1rem", 16, "1.4", 600, "sans"],
  ["body-lg", "1.125rem", 18, "1.6", 400, "sans"],
  ["body", "1rem", 16, "1.6", 400, "sans"],
  ["small", "0.875rem", 14, "1.5", 400, "sans"],
  ["caption", "0.75rem", 12, "1.5", 400, "sans"],
  ["code", "0.875rem", 14, "1.6", 400, "mono"],
] as const

/** The nine NAMED line-heights. `caption` shares `small`'s, `code` shares `body`'s. */
export const LEADING = [
  ["display", "1.1"], ["h1", "1.15"], ["h2", "1.2"], ["h3", "1.25"], ["h4", "1.3"],
  ["h5", "1.4"], ["h6", "1.4"], ["body", "1.6"], ["small", "1.5"],
] as const

/**
 * Radius — CLAUDE.md §7.5 and `/v1/brand` `radii`: every radius derives from a
 * 7px unit, giving the ecosystem numbers 7 / 12 / 14 / 17.
 *
 * This is the ladder several apps get wrong. A `--radius` of 10px or 12px with
 * a `calc()` scale hung off it puts every derived rung off the system — the
 * unit is SEVEN, and `--radius` is two units.
 */
export const RADIUS = [
  ["sm", "7px"], ["md", "12px"], ["base", "14px"], ["lg", "14px"],
  ["xl", "17px"], ["2xl", "17px"], ["full", "9999px"],
] as const

/** Elevation — eight rungs. */
export const SHADOW = [
  ["none", "none"],
  ["xs", "0 1px 2px rgba(20, 20, 19, 0.04)"],
  ["sm", "0 1px 2px rgba(0, 0, 0, 0.15)"],
  ["md", "0 4px 12px rgba(0, 0, 0, 0.2)"],
  ["lg", "0 8px 24px rgba(0, 0, 0, 0.25)"],
  ["xl", "0 20px 60px rgba(0, 0, 0, 0.4)"],
  ["inner", "inset 0 2px 4px rgba(20, 20, 19, 0.06)"],
  ["focus-ring", "0 0 0 2px var(--background), 0 0 0 4px var(--ring)"],
] as const

/** Motion — four durations, four easings, three staggers. Dual-named. */
export const DURATION = [
  ["quick", "100ms"], ["standard", "200ms"], ["emphasis", "350ms"], ["dramatic", "500ms"],
] as const
export const EASING = [
  ["entrance", "cubic-bezier(0, 0, 0.2, 1)"],
  ["exit", "cubic-bezier(0.4, 0, 1, 1)"],
  ["standard", "cubic-bezier(0.4, 0, 0.2, 1)"],
  ["spring", "cubic-bezier(0.34, 1.56, 0.64, 1)"],
] as const
export const STAGGER = [["tight", "30ms"], ["base", "50ms"], ["loose", "80ms"]] as const

/**
 * Touch targets and control heights — `/v1/brand` `accessibility` and
 * `componentSpecs`: minimum 48px, default 56px, buttons always pill.
 *
 * `nhimbe` runs a compact 36/32 scale and says so in a comment naming the
 * doctrine values and the single knob that would adopt them. That is a
 * consumer's deliberate divergence; the default file ships the doctrine.
 */
export const SIZING = [
  ["touch-target-lg", "56px", "Default touch target — /v1/brand defaultTouchTarget"],
  ["touch-target", "48px", "Minimum touch target — /v1/brand minTouchTarget"],
  ["touch-target-sm", "40px", "Dense secondary actions; below the 48px floor, so not for primary controls"],
  ["h-button-default", "3.5rem", "56px — componentSpecs.button.heights.default"],
  ["h-button-sm", "3rem", "48px — componentSpecs.button.heights.sm"],
  ["h-input", "3.5rem", "56px — inputs match the default button"],
] as const

export const ZINDEX = [
  ["base", "0"], ["dropdown", "10"], ["sticky", "20"], ["overlay", "30"],
  ["modal", "40"], ["toast", "50"], ["tooltip", "60"],
] as const

// ════════════════════════════════════════════════════════════════════════════
// DERIVED TIERS — computed from the palette, never typed in
// ════════════════════════════════════════════════════════════════════════════

const BASE_LIGHT = "#F3F3F1"
const BASE_DARK = "#0E0D0C"
const WHITE = "#FFFFFF"
/** WCAG 2.2 AA for a light fill carrying white text. */
const AA = 4.5
/** APCA "Silver" — the bar `bushtrade` names and `shamwari-ai/docs` clears. */
const SILVER = 78

/**
 * The three fixes three teams shipped independently, without knowing about each
 * other. They are preferred over derivation: each was measured by the team that
 * hit the problem, and each is already in production.
 *
 *   bundu      copper light  #BF5A36 is 4.43:1 on white — under AA
 *   shamwari   sodalite dark #3D5AFE is APCA Lc -26.9 on #0E0D0C
 *   bushtrade  terracotta and cobalt dark, both marked "APCA Silver: Lc 78"
 *
 * Three teams, the same discovery, no shared fix. That is canon's bug, and this
 * tier is the shared fix. Two of the four are NUDGED: bushtrade's values
 * measure Lc -77.0 and -76.7 against `/v1/brand`'s own base-dark, not the 78
 * their comments claim, so the tier walks them the last step. Verified against
 * bushtrade's own `--surface-base` (#0A0A0A) too — the shortfall is in the
 * values, not in the background they were measured on.
 */
const SHIPPED: Record<string, { light?: [string, string]; dark?: [string, string] }> = {
  copper: { light: ["#B4532F", "bundu-labs/marketing/apps/bundu/src/styles/global.css:11"] },
  sodalite: { dark: ["#C6CFFF", "shamwari-ai/docs/style.css:32"] },
  terracotta: { dark: ["#EAC99E", "nyuchi/bushtrade/src/app/globals.css:166"] },
  cobalt: { dark: ["#80DAFF", "nyuchi/bushtrade/src/app/globals.css:171"] },
}

export interface A11yVariant {
  hex: string
  canon: string
  canonMeasure: number
  measure: number
  metric: string
  origin: string
}

/**
 * The accessibility tier — an AA/APCA-safe variant for every family that fails.
 *
 * It is added ALONGSIDE the canonical hex and never replaces it. `--color-x`
 * stays exactly what the palette says; `--color-x-aa` is the variant, and the
 * measurement that produced it is in the comment beside it.
 *
 * Two roles are measured, because those are the two the three reports were
 * about: a light-theme fill carrying white text (WCAG AA 4.5:1), and dark-theme
 * text on the base-dark surface (APCA Silver Lc 78). A family that passes both
 * gets no variant.
 *
 * Deriving this rather than listing it means an eighth family added to
 * `palette.source.ts` is measured on the next `pnpm tokens:sync` instead of
 * quietly shipping without a variant.
 */
export function a11yTier(
  families: { name: string; lightHex: string; darkHex: string }[]
): Map<string, { light?: A11yVariant; dark?: A11yVariant }> {
  const out = new Map<string, { light?: A11yVariant; dark?: A11yVariant }>()
  for (const f of families) {
    const wl = wcag(f.lightHex, WHITE)
    const ld = apca(f.darkHex, BASE_DARK)
    const entry: { light?: A11yVariant; dark?: A11yVariant } = {}
    if (wl < AA) {
      const shipped = SHIPPED[f.name]?.light
      const hex = walk(shipped?.[0] ?? f.lightHex, "#000000", (c) => wcag(c, WHITE) >= AA)
      entry.light = {
        hex,
        canon: f.lightHex.toUpperCase(),
        canonMeasure: +wl.toFixed(2),
        measure: +wcag(hex, WHITE).toFixed(2),
        metric: "WCAG 2.2 AA on #FFFFFF",
        origin: shipped
          ? `${shipped[1]}${hex === shipped[0] ? "" : ` (nudged from ${shipped[0]}, ${wcag(shipped[0], WHITE).toFixed(2)}:1)`}`
          : "derived — canon lightHex toward #000000",
      }
    }
    if (Math.abs(ld) < SILVER) {
      const shipped = SHIPPED[f.name]?.dark
      const hex = walk(shipped?.[0] ?? f.darkHex, WHITE, (c) => Math.abs(apca(c, BASE_DARK)) >= SILVER)
      entry.dark = {
        hex,
        canon: f.darkHex.toUpperCase(),
        canonMeasure: +ld.toFixed(1),
        measure: +apca(hex, BASE_DARK).toFixed(1),
        metric: `APCA Silver on ${BASE_DARK}`,
        origin: shipped
          ? `${shipped[1]}${hex === shipped[0] ? "" : ` (nudged from ${shipped[0]}, Lc ${apca(shipped[0], BASE_DARK).toFixed(1)} — its comment claims 78)`}`
          : "derived — canon darkHex toward #FFFFFF",
      }
    }
    if (entry.light || entry.dark) out.set(f.name, entry)
  }
  return out
}

/**
 * On-container text for the SEVEN MINERALS.
 *
 * `/v1/brand` publishes `onContainer*` for the experimental seven only, which
 * is the accessibility hole several apps found independently: seven minerals
 * with containers and no defined text colour on them. `palette.source.ts` — the
 * repo's source of truth, and the thing this generator reads — DOES carry
 * `onContainerLight` / `onContainerDark` for all seven. So the hole is in the
 * API surface, not in the palette, and the fix is to emit what the source
 * already holds rather than to invent values.
 *
 * This function only MEASURES those published values, so the emitted comment
 * can state the contrast a consumer is getting.
 */
export function onContainerMeasure(m: Mineral) {
  return {
    light: +apca(m.onContainerLight, m.containerLight).toFixed(1),
    dark: +apca(m.onContainerDark, m.containerDark).toFixed(1),
  }
}

/**
 * The three-tier text ramp.
 *
 * `/v1/brand` publishes no foreground colour at all, which is why every app
 * invents one — `app/globals.css` uses ink `#141413`, `bushtrade` runs its own
 * `--text-primary/secondary/tertiary`, and they do not agree.
 *
 * Rather than pick one, this interpolates the system's OWN base pair
 * (#F3F3F1 / #0E0D0C) and stops at a measured APCA target. No foreign colour
 * enters the file, and the warm-neutral axis is the ladder's own. It is the
 * same derivation `shamwari-ai/docs` and `mzizi-dev/mzizi-docs` each wrote out
 * by hand for their neutral ramps.
 */
export function textRamp() {
  const ramp = (bg: string, toward: string, bar: number) =>
    walk(mix(bg, toward, 0.01), toward, (c) => Math.abs(apca(c, bg)) >= bar)
  const build = (bg: string, toward: string) => {
    const t = {
      primary: ramp(bg, toward, 90),
      secondary: ramp(bg, toward, 75),
      tertiary: ramp(bg, toward, 60),
    }
    return {
      ...t,
      measure: {
        primary: +apca(t.primary, bg).toFixed(1),
        secondary: +apca(t.secondary, bg).toFixed(1),
        tertiary: +apca(t.tertiary, bg).toFixed(1),
      },
    }
  }
  return { light: build(BASE_LIGHT, BASE_DARK), dark: build(BASE_DARK, BASE_LIGHT) }
}

/**
 * Brand → mineral. Every row is sourced, none is guessed.
 *
 * `mzizi` and `news` have no `ecosystem` record in `/v1/brand`, so their rows
 * name the on-disk statement they come from instead. `shamwari` is the one row
 * where the two disagree: `/v1/brand` says sodalite, `lib/tokens/index.ts` has
 * it under a tanzanite category. `/v1/brand` wins — it is the brand record, the
 * category map is a product taxonomy — and `shamwari-ai/docs` ships sodalite.
 */
export const BRANDS = [
  ["mzizi", "gold", "app/globals.css:256 — \"Per-brand accent — nyuchi = gold\"; mzizi.dev is a nyuchi-operated portal. No `mzizi` ecosystem record in /v1/brand."],
  ["mukoko", "tanzanite", "/v1/brand ecosystem[name=mukoko].mineral"],
  ["nyuchi", "gold", "/v1/brand ecosystem[name=nyuchi].mineral"],
  ["bundu", "copper", "/v1/brand ecosystem[name=bundu].mineral"],
  ["shamwari", "sodalite", "/v1/brand ecosystem[name=shamwari].mineral"],
  ["news", "cobalt", "lib/tokens/index.ts:696 — mukoko.news. No `news` ecosystem record in /v1/brand."],
  ["nhimbe", "malachite", "/v1/brand ecosystem[name=nhimbe].mineral (agrees with lib/tokens/index.ts mukoko.events)"],
  ["bushtrade", "gold", "/v1/brand ecosystem[name=bushtrade].mineral (agrees with lib/tokens/index.ts mukoko.commerce)"],
] as const

// ════════════════════════════════════════════════════════════════════════════
// THE RENDERER
// ════════════════════════════════════════════════════════════════════════════

const box = (title: string) =>
  `  /* ${"─".repeat(2)} ${title} ${"─".repeat(Math.max(2, 70 - title.length))} */`

const lo = (hex: string) => (hex.startsWith("#") ? hex.toLowerCase() : hex)

/** `--primary`/`--ring` are set per brand; everything else derives from them. */
function brandBlocks(): string {
  return BRANDS.map(
    ([brand, mineral, source]) => `/* ${brand} — ${mineral}.
 * ${source} */
[data-brand="${brand}"] {
  --primary: var(--mineral-${mineral}-aa);
  --ring: var(--mineral-cobalt-aa);
}`
  ).join("\n\n")
}

export function renderGlobalsCss(
  minerals: Mineral[],
  heritage: Heritage[],
  experimental: Experimental[]
): string {
  const families = [
    ...minerals.map((m) => ({ name: m.name, lightHex: m.lightHex, darkHex: m.darkHex })),
    ...heritage.map((h) => ({ name: h.name, lightHex: h.lightHex, darkHex: h.darkHex })),
    ...experimental.map((e) => ({ name: e.name, lightHex: e.lightHex, darkHex: e.darkHex })),
  ]
  const tier = a11yTier(families)
  const text = textRamp()

  /** The `-aa` alias ALWAYS resolves — canonical value where no variant is needed. */
  const aa = (name: string, canon: string, mode: "light" | "dark") => {
    const v = tier.get(name)?.[mode]
    return v ? { hex: v.hex, note: `${v.canon} measures ${v.canonMeasure} — ${v.metric}. ${v.origin}` } : { hex: canon, note: "canonical value already clears the bar" }
  }

  const vars = (mode: "light" | "dark"): string => {
    const pick = <T,>(l: T, d: T) => (mode === "light" ? l : d)
    const out: string[] = []

    out.push(box("SEVEN MINERALS"))
    for (const m of minerals) {
      const v = pick(m.lightHex, m.darkHex)
      const c = pick(m.containerLight, m.containerDark)
      const oc = pick(m.onContainerLight, m.onContainerDark)
      const measured = onContainerMeasure(m)
      const a = aa(m.name, v, mode)
      out.push(`  /* ${m.name} — ${m.role}. ${m.symbolism} */`)
      out.push(`  --mineral-${m.name}: ${lo(v)};`)
      out.push(`  --mineral-${m.name}-container: ${lo(c)};`)
      out.push(`  --mineral-${m.name}-on-container: ${lo(oc)}; /* APCA Lc ${pick(measured.light, measured.dark)} on the container */`)
      out.push(`  --mineral-${m.name}-aa: ${lo(a.hex)}; /* ${a.note} */`)
    }

    out.push("")
    out.push(box("SEVEN HERITAGE TONES"))
    for (const h of heritage) {
      const v = pick(h.lightHex, h.darkHex)
      const a = aa(h.name, v, mode)
      out.push(`  --heritage-${h.name}: ${lo(v)}; /* ${h.symbolism} */`)
      out.push(`  --heritage-${h.name}-aa: ${lo(a.hex)}; /* ${a.note} */`)
    }

    out.push("")
    out.push(box("SEVEN EXPERIMENTAL — the computed heptagon"))
    for (const e of experimental) {
      const v = pick(e.lightHex, e.darkHex)
      const a = aa(e.name, v, mode)
      out.push(`  /* ${e.name} — heptagon index ${e.heptagonIndex} */`)
      out.push(`  --exp-${e.name}: ${lo(v)};`)
      out.push(`  --exp-${e.name}-container: ${lo(pick(e.containerLight, e.containerDark))};`)
      out.push(`  --exp-${e.name}-on-container: ${lo(pick(e.onContainerLight, e.onContainerDark))};`)
      out.push(`  --exp-${e.name}-ui: ${lo(pick(e.uiLight, e.uiDark))};`)
      out.push(`  --exp-${e.name}-aa: ${lo(a.hex)}; /* ${a.note} */`)
    }

    out.push("")
    out.push(box("SURFACE LADDER — nine steps, deepest to highest"))
    for (const [name, l, d, usage] of LADDER) {
      out.push(`  --${name}: ${lo(pick(l, d))}; /* ${usage} */`)
    }
    out.push(`  --muted: ${lo(pick(MUTED[0], MUTED[1]))}; /* Deepest inset fill — not a ladder rung */`)

    out.push("")
    out.push(box("TEXT RAMP — three tiers, APCA-measured on --base"))
    const t = pick(text.light, text.dark)
    out.push(`  --text-primary: ${lo(t.primary)}; /* APCA Lc ${t.measure.primary} on --base */`)
    out.push(`  --text-secondary: ${lo(t.secondary)}; /* APCA Lc ${t.measure.secondary} on --base */`)
    out.push(`  --text-tertiary: ${lo(t.tertiary)}; /* APCA Lc ${t.measure.tertiary} on --base */`)
    out.push(`  --hero-text: #ffffff; /* Text over photography — pair with --hero-text-shadow, never bare */`)
    out.push(`  --hero-text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 2px 12px rgba(0, 0, 0, 0.4);`)
    out.push(`  --muted-foreground: var(--text-secondary);`)

    out.push("")
    out.push(box("STATUS"))
    for (const [name, l, d, usage] of STATUS) {
      out.push(`  --${name}: ${lo(pick(l, d))}; /* ${usage} */`)
    }

    out.push("")
    out.push(box("CHART — the seven minerals, in palette order"))
    minerals.forEach((m, i) => out.push(`  --chart-${i + 1}: var(--mineral-${m.name});`))
    out.push(`  /* Semantic series. These must NOT change hue between themes — a negative`)
    out.push(`     series that is orange in light and rose in dark is the defect found in`)
    out.push(`     mukoko-news, where all twelve chart values were raw Tailwind palette. */`)
    out.push(`  --chart-positive: var(--success);`)
    out.push(`  --chart-negative: var(--error);`)
    out.push(`  --chart-neutral: var(--neutral);`)

    out.push("")
    out.push(box("SHADCN SEMANTIC SET"))
    out.push(`  --background: var(--base); /* ALIAS. /v1/brand calls this step \`base\`; shadcn calls it \`background\`. */`)
    out.push(`  --foreground: var(--text-primary);`)
    out.push(`  --card: var(--surface);`)
    out.push(`  --card-foreground: var(--text-primary);`)
    out.push(`  --popover: var(--overlay);`)
    out.push(`  --popover-foreground: var(--text-primary);`)
    out.push(`  --primary-foreground: ${lo(pick("#ffffff", "#0e0d0c"))};`)
    out.push(`  --secondary: var(--container);`)
    out.push(`  --secondary-foreground: var(--text-primary);`)
    out.push(`  --destructive: var(--error);`)
    out.push(`  --destructive-foreground: ${lo(pick("#ffffff", "#0e0d0c"))};`)
    out.push(`  --overlay-foreground: var(--text-primary);`)
    out.push(`  --accent-foreground: var(--text-primary);`)
    out.push(`  --brand-accent-foreground: ${lo(pick("#ffffff", "#0e0d0c"))};`)

    out.push("")
    out.push(box("SIDEBAR"))
    out.push(`  --sidebar: var(--surface);`)
    out.push(`  --sidebar-foreground: var(--text-primary);`)
    out.push(`  --sidebar-primary: var(--primary);`)
    out.push(`  --sidebar-primary-foreground: var(--primary-foreground);`)
    out.push(`  --sidebar-accent: var(--container);`)
    out.push(`  --sidebar-accent-foreground: var(--text-primary);`)
    out.push(`  --sidebar-border: var(--border);`)
    out.push(`  --sidebar-ring: var(--ring);`)

    return out.join("\n")
  }

  return [header(), themeBlock(minerals, heritage, experimental), rootBlock(vars("light")), darkBlock(vars("dark")), brandSection()].join("\n\n")
}

function header(): string {
  return `/* ════════════════════════════════════════════════════════════════════════════
 * MZIZI — THE DEFAULT globals.css
 *
 * GENERATED. Do not edit this file; edit \`lib/tokens/palette.source.ts\` and run
 * \`pnpm tokens:sync\`. \`pnpm tokens:verify\` fails CI when this has drifted.
 *
 * This is the combined stylesheet across the estate, served from the shadcn
 * registry (\`npx shadcn@latest add https://api.mzizi.dev/v1/ui/nyuchi-globals\`)
 * and carried into the crates registry through \`mzizi-tokens\`. A repo that
 * needs styling COPIES it. That is why it is self-contained: it imports
 * Tailwind, declares its own \`@theme\`, and references no sibling file. There is
 * nothing to install alongside it and nothing for a copy to lose.
 *
 * WHAT IS IN IT
 *   21 brand families    7 minerals, 7 heritage tones, 7 experimental
 *   accessibility tier   an AA/APCA-safe \`-aa\` variant beside every canonical
 *                        hex — added, never substituted
 *   surface ladder       9 steps, pitch → wash, plus \`muted\`
 *   text ramp            3 tiers, measured on \`--base\`, plus \`--hero-text\`
 *   status / chart / sidebar / the shadcn semantic set
 *   non-colour ladders   spacing 17, motion 4+4+3, type 13+9, shadow 8,
 *                        radius 7, touch targets, control heights, z-index
 *   brand blocks         8 \`[data-brand]\` selectors, each moving \`--primary\`
 *                        and \`--ring\` only
 *
 * HOW TO USE IT
 *   Copy it in as your \`globals.css\`. Set \`data-brand\` on <html> to pick a
 *   brand; set \`.dark\` or \`data-theme="dark"\` to pick a theme. Local divergence
 *   goes in the LOCAL OVERRIDES block at the foot of the file, where a reviewer
 *   can see it and \`pnpm tokens:sync\` will not overwrite your copy.
 *
 * ════════════════════════════════════════════════════════════════════════════ */

@import "tailwindcss";

@custom-variant dark (&:is(.dark *), &:is([data-theme="dark"] *));`
}

/**
 * The Tailwind v4 surface.
 *
 * \`@theme inline\` rather than \`@theme\`: the values are \`var()\` references that
 * change with the theme, and \`inline\` is what makes a utility resolve through
 * the variable at runtime instead of baking in whichever value was current at
 * build. Every entry here is a \`var()\` — there is no hex in this block, by
 * construction, because the definitions live in \`:root\` and \`.dark\` below.
 */
function themeBlock(minerals: Mineral[], heritage: Heritage[], experimental: Experimental[]): string {
  const out: string[] = ["@theme inline {"]
  out.push("  --font-sans: \"Noto Sans\", ui-sans-serif, system-ui, sans-serif;")
  out.push("  --font-serif: \"Noto Serif\", ui-serif, Georgia, serif;")
  out.push("  --font-mono: \"JetBrains Mono\", ui-monospace, Menlo, monospace;")
  out.push("")
  out.push(box("FAMILIES"))
  for (const m of minerals) {
    out.push(`  --color-${m.name}: var(--mineral-${m.name});`)
    out.push(`  --color-${m.name}-container: var(--mineral-${m.name}-container);`)
    out.push(`  --color-${m.name}-on-container: var(--mineral-${m.name}-on-container);`)
    out.push(`  --color-${m.name}-aa: var(--mineral-${m.name}-aa);`)
  }
  for (const h of heritage) {
    out.push(`  --color-${h.name}: var(--heritage-${h.name});`)
    out.push(`  --color-${h.name}-aa: var(--heritage-${h.name}-aa);`)
  }
  for (const e of experimental) {
    out.push(`  --color-${e.name}: var(--exp-${e.name});`)
    out.push(`  --color-${e.name}-container: var(--exp-${e.name}-container);`)
    out.push(`  --color-${e.name}-on-container: var(--exp-${e.name}-on-container);`)
    out.push(`  --color-${e.name}-ui: var(--exp-${e.name}-ui);`)
    out.push(`  --color-${e.name}-aa: var(--exp-${e.name}-aa);`)
  }
  out.push("")
  out.push(box("SURFACES, TEXT, STATUS, SEMANTICS"))
  const roles = [
    ...LADDER.map(([n]) => n as string),
    "muted",
    "text-primary", "text-secondary", "text-tertiary", "hero-text",
    ...STATUS.map(([n]) => n as string),
    "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
    "primary", "primary-foreground", "secondary", "secondary-foreground",
    "muted-foreground", "accent", "accent-foreground", "destructive", "destructive-foreground",
    "overlay-foreground", "border", "input", "ring", "brand-accent", "brand-accent-foreground",
    "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7",
    "chart-positive", "chart-negative", "chart-neutral",
    "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
    "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
  ]
  for (const r of roles) out.push(`  --color-${r}: var(--${r});`)
  out.push("")
  out.push(box("SPACING / RADIUS / TYPE / SHADOW / EASING"))
  for (const [n] of SPACING) out.push(`  --spacing-${n}: var(--space-${n});`)
  for (const [n] of RADIUS) out.push(`  --radius-${n}: var(--r-${n});`)
  for (const [n] of TYPE) out.push(`  --text-${n}: var(--fs-${n});`)
  for (const [n] of SHADOW) out.push(`  --shadow-${n}: var(--elevation-${n});`)
  for (const [n] of EASING) out.push(`  --ease-${n}: var(--easing-${n});`)
  out.push("}")
  return out.join("\n")
}

/** The ladders and the unresolved block — theme-invariant, so `:root` only. */
function invariants(): string {
  const out: string[] = []
  out.push("")
  out.push(box("SPACING — 17 rungs"))
  for (const [n, rem, px] of SPACING) out.push(`  --space-${n}: ${rem}; /* ${px}px */`)

  out.push("")
  out.push(box("MOTION — dual-named, so both vocabularies resolve"))
  for (const [n, v] of DURATION) out.push(`  --motion-${n}: ${v};`)
  for (const [n] of DURATION) out.push(`  --motion-duration-${n}: var(--motion-${n});`)
  for (const [n, v] of EASING) out.push(`  --easing-${n}: ${v};`)
  for (const [n] of EASING) out.push(`  --motion-ease-${n}: var(--easing-${n});`)
  for (const [n, v] of STAGGER) out.push(`  --motion-stagger-${n}: ${v};`)

  out.push("")
  out.push(box("TYPOGRAPHY — 13 sizes, 9 line-heights"))
  out.push(`  --font-family-sans: "Noto Sans", ui-sans-serif, system-ui, sans-serif;`)
  out.push(`  --font-family-serif: "Noto Serif", ui-serif, Georgia, serif;`)
  out.push(`  --font-family-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;`)
  for (const [n, rem, px, lh, w, f] of TYPE) {
    out.push(`  --fs-${n}: ${rem}; /* ${px} — ${f} ${w}, line-height ${lh} */`)
  }
  for (const [n, v] of LEADING) out.push(`  --lh-${n}: ${v};`)
  for (const [n, , , , w] of TYPE) out.push(`  --fw-${n}: ${w};`)

  out.push("")
  out.push(box("RADIUS — every rung derives from a 7px unit"))
  out.push(`  --radius-unit: 7px; /* CLAUDE.md §7.5. Apps running a 10px or 12px unit have the whole calc() scale wrong. */`)
  for (const [n, v] of RADIUS) out.push(`  --r-${n}: ${v};`)
  out.push(`  --radius: calc(var(--radius-unit) * 2); /* 14px */`)
  out.push(`  --r-circle: 50%;`)
  out.push(`  /* Semantic aliases — /v1/brand componentSpecs: buttons and inputs are ALWAYS pill. */`)
  out.push(`  --r-button: var(--r-full);`)
  out.push(`  --r-input: var(--r-full);`)
  out.push(`  --r-badge: var(--r-full);`)
  out.push(`  --r-card: var(--r-base);`)

  out.push("")
  out.push(box("ELEVATION — 8 rungs"))
  for (const [n, v] of SHADOW) out.push(`  --elevation-${n}: ${v};`)

  out.push("")
  out.push(box("TOUCH TARGETS AND CONTROL HEIGHTS"))
  for (const [n, v, why] of SIZING) out.push(`  --${n}: ${v}; /* ${why} */`)

  out.push("")
  out.push(box("Z-INDEX"))
  for (const [n, v] of ZINDEX) out.push(`  --z-${n}: ${v};`)
  return out.join("\n")
}

/**
 * THE UNRESOLVED SEVEN.
 *
 * `app/globals.css` and `/v1/brand` agree EXACTLY on all 21 families — 42
 * mineral values, 14 heritage, every experimental. They disagree on seven
 * semantic tokens, and the owner has not ruled. Nothing below is a ruling
 * either: the three that are genuinely per-brand are DERIVED from the brand
 * block so no brand's value is baked in, and the rest name both readings and
 * what would reverse them.
 */
function disputed(mode: "light" | "dark"): string {
  const pick = <T,>(l: T, d: T) => (mode === "light" ? l : d)
  const out: string[] = []
  out.push("")
  out.push(box("UNRESOLVED — the registry and /v1/brand disagree; this is NOT a ruling"))
  if (mode === "light") {
    out.push(`  /* --primary  registry: ink #141413 | /v1/brand: tanzanite #4B0082
     Genuinely per-brand — bundu is copper, shamwari sodalite, nyuchi gold — so
     it is NOT defined as a value here. It resolves through the [data-brand]
     block at the foot of this file. \`mzizi\` is the default because this is the
     mzizi default stylesheet; set data-brand on <html> to change it.
     TO REVERSE: if the owner rules for ink, that is a new neutral family in
     palette.source.ts and a [data-brand] row, not an edit here. */`)
    out.push(`  --primary: var(--mineral-gold-aa);`)
    out.push(`  /* --ring  registry: ink #141413 | /v1/brand: cobalt #0047AB
     /v1/brand ties the focus ring to cobalt for every brand and the
     accessibility record says "2px ring with ring-offset-2, using --ring".
     The brand blocks below keep it cobalt; one that needs otherwise overrides. */`)
    out.push(`  --ring: var(--mineral-cobalt-aa);`)
    out.push(`  /* --accent  registry: #faf9f5 | /v1/brand: #E3F2FD (cobalt container)
     Both readings are a pale container; they disagree on WHOSE. Deriving it
     from --primary takes neither side and follows the brand automatically.
     color-mix is already how /v1/brand defines --wash, so this is the system's
     own technique, not a new one.
     TO REVERSE: assign var(--mineral-<x>-container) in the brand block. */`)
    out.push(`  --accent: color-mix(in oklab, var(--primary) 12%, var(--base));`)
    out.push(`  /* --brand-accent  registry: gold #7a5c00 | /v1/brand: tanzanite #4B0082
     Both are "the app's saturated brand mineral" — which is what --primary is.
     Aliasing it picks no brand and keeps the two from drifting apart. */`)
    out.push(`  --brand-accent: var(--primary);`)
  }
  out.push(`  /* --border  registry: rgba(10,10,10,0.06) | /v1/brand: ${pick("#E7E5E0", "#2A2927")}
     A translucent hairline versus warm stone. Not per-brand — a skin choice.
     /v1/brand's value ships because this file's other surface values are
     /v1/brand's and mixing the two vocabularies is what produced the drift.
     TO REVERSE: one line in LOCAL OVERRIDES. */`)
  out.push(`  --border: ${lo(pick("#E7E5E0", "#2A2927"))};`)
  out.push(`  /* --input  registry: rgba(10,10,10,0.06) | /v1/brand: ${pick("#FFFFFF", "#100F0E")} */`)
  out.push(`  --input: ${lo(pick("#FFFFFF", "#100F0E"))};`)
  if (mode === "light") {
    out.push(`  /* --background  registry: #f3f2ee | /v1/brand: #F3F3F1 (the \`base\` step)
     Emitted above as an ALIAS of --base rather than a value of its own, so the
     ladder has one definition and the shadcn name resolves to it. The disputed
     hex is --base itself; /v1/brand's is used because --base is a rung of the
     nine-step ladder and the rest of that ladder is /v1/brand's. */`)
  }
  return out.join("\n")
}

function rootBlock(body: string): string {
  return `/* ════ LIGHT — the default theme ════ */
:root {
${body}
${disputed("light")}
${invariants()}
}`
}

function darkBlock(body: string): string {
  return `/* ════ DARK ════
 * Both selectors, because the estate uses both: next-themes writes \`.dark\`,
 * and several apps drive the theme from \`data-theme\`. A file that carried only
 * one of them rendered the light value in dark mode wherever the other was in
 * use — which is the single defect the completeness test exists to catch. */
.dark,
[data-theme="dark"] {
${body}
${disputed("dark")}
}`
}

function brandSection(): string {
  return `/* ════════════════════════════════════════════════════════════════════════════
 * BRAND BLOCKS
 *
 * The per-brand variance, in the same file, because consumption is copy-in: a
 * second artifact to install beside this one is a second thing that can drift,
 * and killing that drift is why this file exists. They are inert until
 * \`data-brand\` is set, so a repo that wants one edits nothing and a repo that
 * wants none is unaffected.
 *
 * Each block moves \`--primary\` and \`--ring\` ONLY — the pattern
 * \`bundu-labs/marketing\` proved — and assigns \`var(--mineral-*)\`, never a hex.
 * \`--accent\` and \`--brand-accent\` follow \`--primary\` automatically. Each block
 * references the \`-aa\` variant, so a brand whose mineral fails contrast gets
 * the measured-safe value rather than each team rediscovering the problem.
 *
 * Every mineral below is sourced, none guessed — the comment names where.
 * ════════════════════════════════════════════════════════════════════════════ */

${brandBlocks()}

/* ════════════════════════════════════════════════════════════════════════════
 * LOCAL OVERRIDES — the only block a consuming repo edits.
 *
 * Put divergence here, with a comment saying why and what would reverse it, the
 * way nhimbe's control-height block does. Everything above is generated and a
 * re-copy overwrites it; this block is where your copy stays yours.
 * ════════════════════════════════════════════════════════════════════════════ */`
}

// ════════════════════════════════════════════════════════════════════════════
// THE MACHINE-READABLE TWIN
// ════════════════════════════════════════════════════════════════════════════

/**
 * The same values as JSON, from the same render pass.
 *
 * It earns its place on two counts that CSS cannot cover:
 *
 *   - `mukoko-weather-mobile` is Expo. React Native has no CSS custom
 *     properties at all, so a stylesheet is not a distribution format for it.
 *   - OG-image, email and PDF generators need inline hex. Satori does not
 *     resolve CSS variables; it needs the literal.
 *
 * Those consumers are today served by hand-mirrored hex literals scattered
 * across the estate, which is the same defect as everything else here — a value
 * copied by hand, with nothing checking the copy. This is generated in the same
 * pass as the CSS, from the same palette, and gated by the same
 * `pnpm tokens:verify`, so the two cannot disagree.
 */
export function renderGlobalsJson(
  minerals: Mineral[],
  heritage: Heritage[],
  experimental: Experimental[]
): string {
  const families = [
    ...minerals.map((m) => ({ name: m.name, lightHex: m.lightHex, darkHex: m.darkHex })),
    ...heritage.map((h) => ({ name: h.name, lightHex: h.lightHex, darkHex: h.darkHex })),
    ...experimental.map((e) => ({ name: e.name, lightHex: e.lightHex, darkHex: e.darkHex })),
  ]
  const tier = a11yTier(families)
  const text = textRamp()
  const aaOf = (name: string, canonL: string, canonD: string) => ({
    light: tier.get(name)?.light?.hex ?? canonL.toUpperCase(),
    dark: tier.get(name)?.dark?.hex ?? canonD.toUpperCase(),
  })
  const variant = (name: string) => {
    const v = tier.get(name)
    if (!v) return undefined
    const j: Record<string, unknown> = {}
    for (const mode of ["light", "dark"] as const) {
      const x = v[mode]
      if (x) j[mode] = { hex: x.hex, replaces: x.canon, canonMeasures: x.canonMeasure, measures: x.measure, metric: x.metric, origin: x.origin }
    }
    return j
  }

  const doc = {
    $comment:
      "GENERATED by pnpm tokens:sync from lib/tokens/palette.source.ts. Do not edit. " +
      "The machine-readable twin of nyuchi-tokens-globals.css — same values, same pass, same gate. " +
      "For consumers that cannot read CSS custom properties: Expo/React Native, and Satori-based " +
      "OG-image, email and PDF generators that need inline hex.",
    families: {
      minerals: Object.fromEntries(
        minerals.map((m) => [
          m.name,
          {
            role: m.role, family: m.family, origin: m.origin, symbolism: m.symbolism, usage: m.usage,
            light: m.lightHex.toUpperCase(), dark: m.darkHex.toUpperCase(),
            containerLight: m.containerLight.toUpperCase(), containerDark: m.containerDark.toUpperCase(),
            onContainerLight: m.onContainerLight.toUpperCase(), onContainerDark: m.onContainerDark.toUpperCase(),
            aa: aaOf(m.name, m.lightHex, m.darkHex),
            accessibility: variant(m.name),
          },
        ])
      ),
      heritage: Object.fromEntries(
        heritage.map((h) => [
          h.name,
          {
            origin: h.origin, symbolism: h.symbolism, usage: h.usage,
            light: h.lightHex.toUpperCase(), dark: h.darkHex.toUpperCase(),
            aa: aaOf(h.name, h.lightHex, h.darkHex),
            accessibility: variant(h.name),
          },
        ])
      ),
      experimental: Object.fromEntries(
        experimental.map((e) => [
          e.name,
          {
            heptagonIndex: e.heptagonIndex,
            light: e.lightHex.toUpperCase(), dark: e.darkHex.toUpperCase(),
            containerLight: e.containerLight.toUpperCase(), containerDark: e.containerDark.toUpperCase(),
            onContainerLight: e.onContainerLight.toUpperCase(), onContainerDark: e.onContainerDark.toUpperCase(),
            uiLight: e.uiLight.toUpperCase(), uiDark: e.uiDark.toUpperCase(),
            aa: aaOf(e.name, e.lightHex, e.darkHex),
            accessibility: variant(e.name),
          },
        ])
      ),
    },
    surfaces: Object.fromEntries(LADDER.map(([n, l, d, usage]) => [n, { light: l, dark: d, usage }])),
    muted: { light: MUTED[0], dark: MUTED[1], usage: "Deepest inset fill — not a ladder rung" },
    text: {
      primary: { light: text.light.primary, dark: text.dark.primary, apca: { light: text.light.measure.primary, dark: text.dark.measure.primary } },
      secondary: { light: text.light.secondary, dark: text.dark.secondary, apca: { light: text.light.measure.secondary, dark: text.dark.measure.secondary } },
      tertiary: { light: text.light.tertiary, dark: text.dark.tertiary, apca: { light: text.light.measure.tertiary, dark: text.dark.measure.tertiary } },
      hero: { hex: "#FFFFFF", shadow: "0 1px 3px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.4)", usage: "Text over photography — never bare" },
    },
    status: Object.fromEntries(STATUS.map(([n, l, d, usage]) => [n, { light: l, dark: d, usage }])),
    chart: {
      series: minerals.map((m) => ({ name: m.name, light: m.lightHex.toUpperCase(), dark: m.darkHex.toUpperCase() })),
      positive: "status.success", negative: "status.error", neutral: "status.neutral",
      $comment: "Semantic series reference a status role so they cannot change hue between themes.",
    },
    brands: Object.fromEntries(
      BRANDS.map(([brand, mineral, source]) => {
        const m = minerals.find((x) => x.name === mineral)!
        return [brand, {
          mineral, source,
          primary: aaOf(mineral, m.lightHex, m.darkHex),
          ring: aaOf("cobalt", minerals.find((x) => x.name === "cobalt")!.lightHex, minerals.find((x) => x.name === "cobalt")!.darkHex),
          brandAccent: aaOf(mineral, m.lightHex, m.darkHex),
          accent: { $derived: "color-mix(in oklab, primary 12%, surfaces.base)" },
        }]
      })
    ),
    unresolved: {
      $comment:
        "The registry's app/globals.css and /v1/brand disagree on these and the owner has not ruled. " +
        "Listed so a consumer knows they are provisional. See the UNRESOLVED block in the CSS.",
      tokens: {
        primary: { registry: "#141413", brandApi: "#4B0082", resolution: "per-brand; see brands" },
        ring: { registry: "#141413", brandApi: "#0047AB", resolution: "per-brand; see brands" },
        accent: { registry: "#FAF9F5", brandApi: "#E3F2FD", resolution: "derived from primary" },
        background: { registry: "#F3F2EE", brandApi: "#F3F3F1", resolution: "alias of surfaces.base" },
        border: { registry: "rgba(10,10,10,0.06)", brandApi: "#E7E5E0 / #2A2927", resolution: "/v1/brand value shipped" },
        input: { registry: "rgba(10,10,10,0.06)", brandApi: "#FFFFFF / #100F0E", resolution: "/v1/brand value shipped" },
        "brand-accent": { registry: "#7A5C00", brandApi: "#4B0082", resolution: "alias of primary" },
      },
    },
    scale: {
      spacing: Object.fromEntries(SPACING.map(([n, rem, px]) => [n, { rem, px }])),
      radius: { unit: "7px", ...Object.fromEntries(RADIUS.map(([n, v]) => [n, v])) },
      type: Object.fromEntries(TYPE.map(([n, rem, px, lh, w, f]) => [n, { rem, px, lineHeight: lh, weight: w, font: f }])),
      leading: Object.fromEntries(LEADING),
      shadow: Object.fromEntries(SHADOW),
      motion: {
        duration: Object.fromEntries(DURATION),
        easing: Object.fromEntries(EASING),
        stagger: Object.fromEntries(STAGGER),
      },
      sizing: Object.fromEntries(SIZING.map(([n, v, why]) => [n, { value: v, usage: why }])),
      zIndex: Object.fromEntries(ZINDEX),
      fonts: { sans: "Noto Sans", serif: "Noto Serif", mono: "JetBrains Mono" },
    },
  }
  return JSON.stringify(doc, null, 2) + "\n"
}
