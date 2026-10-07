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
 * `mzizi-tokens-typescript.ts` shipped ten families of twenty-one for months
 * because it was hand-maintained and `tokens:verify` covers only the files it
 * writes. A gate that cannot see a surface reports green for it. This surface
 * is one the gate writes.
 *
 * The non-colour ladders and the surface ladder are declared as constants
 * below, for the same reason `SCALE` is declared in `sync-tokens.ts`: colour is
 * palette data, these are doctrine. The status colours, the radius ladder and
 * the touch and control heights are not: they are canon, read through the role
 * manifest (`lib/tokens/roles.source.ts`), which also drives every role this
 * file declares and the contrast gate (`roleGate()`) that measures them. `scripts/check-tokens-upstream.mjs` checks
 * them against `/v1/brand` in CI — never at build or runtime.
 *
 * Structure is lifted from the Mukoko Events app's `src/app/globals.css` (then `nyuchi/nhimbe`), which two
 * independent audits called the best-organised token file in the estate:
 * box-drawn section headers, a comment on every divergence naming what would
 * reverse it, provenance stamps, consistent ordering.
 *
 *   pnpm tokens:sync     regenerate
 *   pnpm tokens:verify   CI gate
 */

import type { ExperimentalToken, HeritageToken, MineralToken } from "../lib/tokens/palette.source"
import { backgroundColors as BACKGROUNDS, ecosystem, ecosystemAliases, semanticColors as SEMANTIC } from "../lib/tokens/brand.source"
import {
  colorKey,
  FONT_ALIASES,
  FONTS,
  isColorKind,
  RADIUS,
  ROLES,
  SIZING,
  STATUS,
  type Role,
  type RoleValue,
} from "../lib/tokens/roles.source"

/**
 * The status colours, the radius ladder and the touch and control heights are
 * read from canon through the role manifest (`lib/tokens/roles.source.ts`). They
 * used to be second copies declared in this file; re-exported under the same
 * names so nothing that imports them changes.
 */
export { RADIUS, SIZING, STATUS }

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

/**
 * `color-mix(in oklab, <a> <pct>%, <b>)`, resolved to a hex, for the roles the
 * stylesheet derives with `color-mix` (`--accent`, `--wash`). The platform files
 * have no `color-mix`, and the contrast gate has to measure what a browser paints.
 */
export function mixOklab(a: string, b: string, pct: number): string {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const gam = (c: number) => {
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
    return Math.min(255, Math.max(0, s * 255))
  }
  const toLab = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map(lin)
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl)
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl)
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl)
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ]
  }
  const t = pct / 100
  const [x, y] = [toLab(a), toLab(b)]
  const [L, A, B] = x.map((v, i) => v * t + y[i] * (1 - t))
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3)
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3)
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3)
  return toHex([
    gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ])
}

// ════════════════════════════════════════════════════════════════════════════
// DOCTRINE CONSTANTS — not palette data, so declared here like `SCALE`
// ════════════════════════════════════════════════════════════════════════════

/**
 * The nine-step surface ladder, `/v1/brand` `backgrounds`.
 *
 * NOTE `base`. `/v1/brand` calls this step `base`; `styles/globals.css` lost that
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

/**
 * Utility names for a size in TYPE under another name — not new sizes.
 *
 * `text-body-sm` is the name the registry's own components use for the 14px body
 * size (discover-card, discover-search, site-breadcrumb, the n6/n7 app shell…),
 * and the name `@bundu/ui` and `@nyuchi/ui` ship in `styles/theme.css` and
 * `tailwind-preset.mjs`. Without it, a repo that copies this stylesheet and
 * installs those components gets no rule for `text-body-sm` at all: the text
 * silently inherits 16px.
 */
export const TYPE_ALIASES = [["body-sm", "small"]] as const

/** The nine NAMED line-heights. `caption` shares `small`'s, `code` shares `body`'s. */
export const LEADING = [
  ["display", "1.1"], ["h1", "1.15"], ["h2", "1.2"], ["h3", "1.25"], ["h4", "1.3"],
  ["h5", "1.4"], ["h6", "1.4"], ["body", "1.6"], ["small", "1.5"],
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

export const ZINDEX = [
  ["base", "0"], ["dropdown", "10"], ["sticky", "20"], ["overlay", "30"],
  ["modal", "40"], ["toast", "50"], ["tooltip", "60"],
] as const

/**
 * Content widths — the three columns `site/container` (and `site/section`,
 * `site/hero`, the Discover pages) render through `.container-custom`,
 * `.container-narrow` and `.container-prose`.
 *
 * The values are what `@bundu/ui` 0.5.0 actually RENDERS, not what its theme
 * declares: its `globals.css` builds `.container-custom` on `max-w-7xl` (80rem),
 * `.container-narrow` on `max-w-narrow` (its `--container-narrow: 42rem`) and
 * `.container-prose` on `max-w-3xl` (48rem). Its `theme.css` also declares
 * `--container-prose: 65ch`, but no utility of its uses that, so 48rem is the
 * reading column every consuming site has shipped.
 *
 * `--container-prose: 48rem` does NOT change Tailwind's `max-w-prose`: that is
 * a static utility (65ch) and wins over the theme key (checked against
 * tailwindcss 4.3.3). So `max-w-prose` keeps its 65ch meaning — the registry's
 * app-page-header, app-empty-state and cover-wash-header rely on it — and the
 * theme key feeds only `.container-prose` and the `@prose:` container variant.
 * `max-w-narrow` and `max-w-wide` are new utilities from these keys.
 */
export const CONTAINERS = [
  ["narrow", "42rem", "672px — the editorial column (.container-narrow)"],
  ["prose", "48rem", "768px — the reading column (.container-prose); max-w-prose stays 65ch"],
  ["wide", "80rem", "1280px — the wide grid column (.container-custom)"],
] as const

/**
 * The container utilities: width, centring, and the responsive side gutters,
 * on the spacing ladder. Same boxes as `@bundu/ui` 0.5.0's `px-6 sm:px-8
 * lg:px-10` — `--space-lg` 24px, `--space-xl` 32px, `--space-xl-plus` 40px at
 * Tailwind's default `sm` (40rem) and `lg` (64rem).
 */
export const CONTAINER_UTILITIES = [
  ["container-custom", "wide", ["lg", "xl", "xl-plus"]],
  ["container-narrow", "narrow", ["lg", "xl"]],
  ["container-prose", "prose", ["lg", "xl"]],
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
 * gets no variant. Light-theme text on `--base` is a third role, measured by
 * `textOnBaseTier()` below and emitted as `-text`.
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

/** APCA Lc 75, the body-text bar. `textRamp()` walks `--text-secondary` to the same bar. */
const BODY_TEXT = 75

export interface TextVariant {
  hex: string
  canon: string
  canonMeasure: number
  measure: number
  origin: string
}

/**
 * The text-on-base tier: a `-text` value for every family, measured as TEXT on
 * `--base`, the page background.
 *
 * `-aa` answers a different question in each theme. In dark it is text on
 * base-dark, but in light it is a FILL under white text, so a light `-aa` can
 * pass and still fail as a link or accent on the page. Hematite is the case that
 * found it: `#546E7A` is 5.40:1 under white and passes, but as text on `#F3F3F1`
 * it is APCA Lc 69.7, under the body-text bar. `mzizi-docs` derived `#4A616B` by
 * hand with this file's `walk()` and cited it as a local value; this makes it
 * canon.
 *
 * Light: the canonical `lightHex`, walked toward black until it clears Lc 75 on
 * `BASE_LIGHT`. Dark: the dark `-aa` value, which is already text on
 * `BASE_DARK` at APCA Silver (Lc 78, above this bar), so dark adds no third
 * value. A family that already clears the bar keeps its canonical hex, so the
 * `-text` alias always resolves, as `-aa` does. No `-aa` value changes.
 */
export function textOnBaseTier(
  families: { name: string; lightHex: string; darkHex: string }[],
  tier = a11yTier(families)
): Map<string, { light: TextVariant; dark: TextVariant }> {
  const out = new Map<string, { light: TextVariant; dark: TextVariant }>()
  for (const f of families) {
    const light = walk(f.lightHex, "#000000", (c) => Math.abs(apca(c, BASE_LIGHT)) >= BODY_TEXT)
    const darkStart = tier.get(f.name)?.dark?.hex ?? f.darkHex
    const dark = walk(darkStart, WHITE, (c) => Math.abs(apca(c, BASE_DARK)) >= BODY_TEXT)
    out.set(f.name, {
      light: {
        hex: light.toUpperCase(),
        canon: f.lightHex.toUpperCase(),
        canonMeasure: +apca(f.lightHex, BASE_LIGHT).toFixed(1),
        measure: +apca(light, BASE_LIGHT).toFixed(1),
        origin: light.toUpperCase() === f.lightHex.toUpperCase()
          ? "canonical value already clears the bar"
          : "derived — canon lightHex toward #000000",
      },
      dark: {
        hex: dark.toUpperCase(),
        canon: f.darkHex.toUpperCase(),
        canonMeasure: +apca(f.darkHex, BASE_DARK).toFixed(1),
        measure: +apca(dark, BASE_DARK).toFixed(1),
        origin: dark.toUpperCase() === f.darkHex.toUpperCase()
          ? "canonical value already clears the bar"
          : "the dark -aa value, already text on base-dark",
      },
    })
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
 * invents one — `styles/globals.css` uses ink `#141413`, `bushtrade` runs its own
 * `--text-primary/secondary/tertiary`, and they do not agree.
 *
 * Rather than pick one, this interpolates the system's OWN base pair
 * (#F3F3F1 / #0E0D0C) and stops at a measured APCA target. No foreign colour
 * enters the file, and the warm-neutral axis is the ladder's own. It is the
 * same derivation `shamwari-ai/docs` and `mzizi-dev/mzizi-docs` each wrote out
 * by hand for their neutral ramps.
 *
 * Secondary and tertiary clear their bar on `--surface` as well as `--base`
 * (#399). Both are walked to the bar exactly, and `--surface` (cards, panels)
 * is one step deeper than `--base` in both themes, so a value measured on base
 * alone fell under the bar on every card: light `--text-secondary`, which is
 * `--muted-foreground`, measured Lc 72.5 there. Primary is walked on base to
 * Lc 90 and keeps more than Lc 85 on surface, so it is not moved.
 */
export function textRamp() {
  const surface = (mode: "light" | "dark") => LADDER.find(([n]) => n === "surface")![mode === "light" ? 1 : 2]
  const ramp = (bg: string, toward: string, bar: number, also: string[] = []) =>
    walk(mix(bg, toward, 0.01), toward, (c) => [bg, ...also].every((b) => Math.abs(apca(c, b)) >= bar))
  const build = (bg: string, toward: string, surf: string) => {
    const t = {
      primary: ramp(bg, toward, 90),
      secondary: ramp(bg, toward, 75, [surf]),
      tertiary: ramp(bg, toward, 60, [surf]),
    }
    return {
      ...t,
      measure: {
        primary: +apca(t.primary, bg).toFixed(1),
        secondary: +apca(t.secondary, bg).toFixed(1),
        tertiary: +apca(t.tertiary, bg).toFixed(1),
      },
      onSurface: {
        primary: +apca(t.primary, surf).toFixed(1),
        secondary: +apca(t.secondary, surf).toFixed(1),
        tertiary: +apca(t.tertiary, surf).toFixed(1),
      },
    }
  }
  return {
    light: build(BASE_LIGHT, BASE_DARK, surface("light")),
    dark: build(BASE_DARK, BASE_LIGHT, surface("dark")),
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ROLES — the manifest resolved, and the contrast gate
// ════════════════════════════════════════════════════════════════════════════

export type Mode = "light" | "dark"
const MODES: readonly Mode[] = ["light", "dark"]

/** One role, resolved for the Mzizi pack. */
export interface ResolvedRole {
  role: Role
  /** What the stylesheet declares, per theme. */
  css: Record<Mode, string>
  /** What a browser paints: a hex for a colour, a length for a size or radius, a stack for a font. */
  value: Record<Mode, string>
  /** Set where the value was derived to meet the role's contrast rule. */
  derived: Partial<Record<Mode, string>>
}

/** The bare custom property a role is declared as. */
export function roleVar(r: Role): string {
  if (r.kind === "radius") return `--r-${r.name.replace(/^radius-/, "")}`
  if (r.kind === "size") return `--size-${r.name.replace(/^spacing-/, "")}`
  return `--${r.name}`
}

/** The custom-property prefix a palette family is emitted under. */
function familyPrefix(
  family: string,
  heritage: ReadonlyArray<{ name: string }>,
  experimental: ReadonlyArray<{ name: string }>
): "mineral" | "heritage" | "exp" {
  if (heritage.some((h) => h.name === family)) return "heritage"
  if (experimental.some((e) => e.name === family)) return "exp"
  return "mineral"
}

const themed = (v: Role["default"], mode: Mode): RoleValue =>
  "light" in v && "dark" in v ? v[mode] : (v as RoleValue)

/**
 * Resolve every role in `lib/tokens/roles.source.ts` to what the Mzizi default
 * stylesheet declares and what it paints, in both themes.
 *
 * A role marked `derive` whose default misses its contrast rule gets a measured
 * value walked from the default with `walk()`, the way the `-aa` tier is made:
 * the family's own variable is untouched, and the role carries the safe value
 * with the measurement beside it.
 */
export function resolveRoles(minerals: Mineral[], heritage: Heritage[], experimental: Experimental[]): Map<string, ResolvedRole> {
  const families = [
    ...minerals.map((m) => ({ ...m, group: "mineral" as const })),
    ...heritage.map((h) => ({ ...h, group: "heritage" as const })),
    ...experimental.map((e) => ({ ...e, group: "exp" as const })),
  ]
  const tier = a11yTier(families.map(({ name, lightHex, darkHex }) => ({ name, lightHex, darkHex })))
  const textTier = textOnBaseTier(families.map(({ name, lightHex, darkHex }) => ({ name, lightHex, darkHex })), tier)
  const ramp = textRamp()
  const byName = new Map(ROLES.map((r) => [r.name, r]))
  const out = new Map<string, ResolvedRole>()
  const resolving = new Set<string>()

  const familyValue = (family: string, t: string, mode: Mode): string => {
    const f = families.find((x) => x.name === family)
    if (!f) throw new Error(`role default names unknown palette family "${family}"`)
    const L = mode === "light"
    switch (t) {
      case "base":
        return (L ? f.lightHex : f.darkHex).toUpperCase()
      case "aa":
        return (tier.get(family)?.[mode]?.hex ?? (L ? f.lightHex : f.darkHex)).toUpperCase()
      case "text":
        return textTier.get(family)![mode].hex.toUpperCase()
      case "container":
      case "on-container": {
        if (f.group === "heritage") throw new Error(`heritage family "${family}" has no ${t} tier`)
        const x = f as unknown as Record<string, string>
        const key = t === "container" ? (L ? "containerLight" : "containerDark") : L ? "onContainerLight" : "onContainerDark"
        return x[key].toUpperCase()
      }
    }
    throw new Error(`unknown family tier "${t}"`)
  }

  /** One theme's declaration and painted value for a role default, before any derivation. */
  const one = (v: RoleValue, mode: Mode, r: Role): { css: string; value: string } => {
    if ("family" in v) {
      const prefix = familyPrefix(v.family, heritage, experimental)
      const suffix = v.tier === "base" ? "" : `-${v.tier}`
      return { css: `var(--${prefix}-${v.family}${suffix})`, value: familyValue(v.family, v.tier, mode) }
    }
    if ("role" in v) {
      const target = byName.get(v.role)
      if (!target) throw new Error(`role "${r.name}" aliases unknown role "${v.role}"`)
      return { css: `var(${roleVar(target)})`, value: resolve(v.role).value[mode] }
    }
    if ("ramp" in v) {
      const hex = ramp[mode][v.ramp].toUpperCase()
      return { css: lo(hex), value: hex }
    }
    if ("semantic" in v || "background" in v) {
      const value = canonicalColor("semantic" in v ? STATUS_OR_SEMANTIC(v.semantic, mode) : BACKGROUND(v.background, mode))
      return { css: lo(value), value }
    }
    if ("literal" in v) return { css: lo(v.literal), value: v.literal.startsWith("#") ? v.literal.toUpperCase() : v.literal }
    if ("mix" in v) {
      const [a, pct, b] = v.mix
      const ra = byName.get(a)
      const rb = byName.get(b)
      if (!ra || !rb) throw new Error(`role "${r.name}" mixes an unknown role`)
      return {
        css: `color-mix(in oklab, var(${roleVar(ra)}) ${pct}%, var(${roleVar(rb)}))`,
        value: mixOklab(resolve(a).value[mode], resolve(b).value[mode], pct),
      }
    }
    if ("px" in v) {
      const css = r.kind === "size" ? `${v.px / 16}rem` : `${v.px}px`
      return { css, value: `${v.px}px` }
    }
    if ("font" in v) return { css: v.font, value: v.font }
    throw new Error(`role "${r.name}" has an unreadable default`)
  }

  const passes = (hex: string, rule: { against: readonly string[]; min: number }, mode: Mode) =>
    rule.against.every((bg) => Math.abs(apca(hex, resolve(bg).value[mode])) >= rule.min)

  function resolve(name: string): ResolvedRole {
    const done = out.get(name)
    if (done) return done
    const r = byName.get(name)
    if (!r) throw new Error(`unknown role "${name}"`)
    if (resolving.has(name)) throw new Error(`role "${name}" resolves through itself`)
    resolving.add(name)
    const css = {} as Record<Mode, string>
    const value = {} as Record<Mode, string>
    const derived: Partial<Record<Mode, string>> = {}
    for (const mode of MODES) {
      const base = one(themed(r.default, mode), mode, r)
      css[mode] = base.css
      value[mode] = base.value
      if (r.derive === "text" && r.contrast && "against" in r.contrast && !passes(base.value, r.contrast, mode)) {
        const rule = r.contrast
        const hex = walk(base.value, mode === "light" ? "#000000" : "#FFFFFF", (c) => passes(c, rule, mode))
        const worst = Math.min(...rule.against.map((bg) => Math.abs(apca(base.value, resolve(bg).value[mode]))))
        derived[mode] = `derived: ${base.value} measures Lc ${worst.toFixed(1)} against ${rule.against.join(" / ")}; walked toward ${mode === "light" ? "#000000" : "#FFFFFF"} to Lc ${rule.min}`
        css[mode] = lo(hex)
        value[mode] = hex
      }
      if (r.derive === "fill") {
        // Every role measured ON this fill must clear its bar on it.
        const fgs = ROLES.filter((x) => x.contrast && "against" in x.contrast && x.contrast.against.includes(name))
        const ok = (fill: string) =>
          fgs.every((x) => Math.abs(apca(resolve(x.name).value[mode], fill)) >= (x.contrast as { min: number }).min)
        if (fgs.length && !ok(base.value)) {
          const fgHex = resolve(fgs[0].name).value[mode]
          const toward = apca(fgHex, base.value) < 0 ? "#000000" : "#FFFFFF"
          const hex = walk(base.value, toward, ok)
          const lc = Math.abs(apca(fgHex, base.value)).toFixed(1)
          derived[mode] = `derived: ${fgs[0].name} measures Lc ${lc} on ${base.value}; fill walked toward ${toward} to Lc ${(fgs[0].contrast as { min: number }).min}`
          css[mode] = lo(hex)
          value[mode] = hex
        }
      }
    }
    resolving.delete(name)
    const res = { role: r, css, value, derived }
    out.set(name, res)
    return res
  }

  for (const r of ROLES) resolve(r.name)
  return out
}

/** `#e7e5e0` → `#E7E5E0`; `rgba(0,0,0,0.40)` → `rgba(0, 0, 0, 0.4)`, the form the stylesheet writes. */
function canonicalColor(v: string): string {
  if (v.startsWith("#")) return v.toUpperCase()
  const m = v.match(/^rgba\(([^)]+)\)$/)
  return m ? `rgba(${m[1].split(",").map((x) => Number(x.trim())).join(", ")})` : v
}

function STATUS_OR_SEMANTIC(name: string, mode: Mode): string {
  const row = SEMANTIC.find((c) => c.name === name)
  if (!row) throw new Error(`brand.source.ts semanticColors has no "${name}"`)
  return mode === "light" ? row.lightValue : row.darkValue
}

function BACKGROUND(name: string, mode: Mode): string {
  const row = BACKGROUNDS.find((c) => c.name === name)
  if (!row) throw new Error(`brand.source.ts backgroundColors has no "${name}"`)
  return mode === "light" ? row.lightValue : row.darkValue
}

/** One measurement the gate made. */
export interface GateResult {
  role: string
  mode: Mode | "both"
  against: string
  measure: number
  min: number
  pass: boolean
  pending?: string
}

/**
 * THE CONTRAST GATE (#484 §2b). Run on every `pnpm tokens:sync` and
 * `pnpm tokens:verify`; a violation fails the build.
 *
 *   - every `kind: text` role: |Lc| >= 75 on `base` and `surface` (or on the
 *     fill it is declared against), both themes
 *   - every `kind: ui` role: |Lc| >= 30 on what it is declared against
 *   - `spacing-touch` and every size marked `floor` >= `spacing-touch-min`
 *   - every `required` role resolves in both themes
 *
 * The manifest cannot loosen it: a text role that declares a bar under 75, or a
 * ui role under 30, is itself a violation unless the rule carries `pending`, an
 * owner decision named in the rule (and pinned by the role tests).
 */
export function roleGate(resolved: Map<string, ResolvedRole>): { results: GateResult[]; violations: string[]; pending: GateResult[] } {
  const results: GateResult[] = []
  const violations: string[] = []
  for (const { role: r, value } of resolved.values()) {
    if (r.required && MODES.some((m) => !value[m])) violations.push(`${r.name}: required, but does not resolve in both themes`)
    if (!r.contrast || "exempt" in r.contrast) {
      if ((r.kind === "text" || r.kind === "ui") && !r.contrast) violations.push(`${r.name}: a ${r.kind} role with no contrast rule`)
      continue
    }
    const floor = r.kind === "text" ? 75 : r.kind === "ui" ? 30 : 0
    if (r.contrast.min < floor && !r.contrast.pending) violations.push(`${r.name}: declares Lc ${r.contrast.min}, under the ${r.kind} bar of ${floor}`)
    for (const mode of MODES) {
      for (const bg of r.contrast.against) {
        const raw = Math.abs(apca(value[mode], resolved.get(bg)!.value[mode]))
        const measure = +raw.toFixed(1)
        const min = Math.max(r.contrast.min, floor)
        const res: GateResult = { role: r.name, mode, against: bg, measure, min, pass: raw >= min }
        if (!res.pass && r.contrast.pending) res.pending = r.contrast.pending
        results.push(res)
        if (!res.pass && !res.pending) violations.push(`${r.name} (${mode}): Lc ${measure} on ${bg}, needs ${min}`)
      }
    }
  }
  const px = (name: string) => parseFloat(resolved.get(name)!.value.light)
  const touchMin = px("spacing-touch-min")
  for (const { role: r } of resolved.values()) {
    if (!r.floor) continue
    const measure = px(r.name)
    results.push({ role: r.name, mode: "both", against: "spacing-touch-min", measure, min: touchMin, pass: measure >= touchMin })
    if (measure < touchMin) violations.push(`${r.name}: ${measure}px, under the ${touchMin}px touch floor`)
  }
  return { results, violations, pending: results.filter((x) => x.pending) }
}

/**
 * The mineral canon's `ecosystem` table (`lib/tokens/brand.source.ts`, served
 * as `/v1/brand` → `ecosystem`) gives a brand. Read, never retyped, so this
 * file cannot disagree with the brand record.
 */
function ecosystemMineral(brand: string): string {
  const row = ecosystem.find((b) => b.name === brand)
  if (!row) throw new Error(`brand.source.ts ecosystem has no row for "${brand}"`)
  return row.mineral
}

/**
 * Brand → palette family. Every row is sourced, none is guessed.
 *
 * Every row reads its mineral from its `ecosystem` record. `news` used to have
 * no record and named `lib/tokens/index.ts` instead; canon gained `news`,
 * `weather`, `kweli` and `learning` rows on 2026-10-04 (owner decisions:
 * kweli malachite, learning gold, news and weather cobalt). `shamwari` was
 * the one row where two on-disk sources disagreed: `/v1/brand` says
 * sodalite, `lib/tokens/index.ts` had it under a tanzanite category.
 * `/v1/brand` wins — it is the brand record, the category map is a product
 * taxonomy — and `shamwari-ai/docs` ships sodalite.
 *
 * `mzizi` is hematite, a heritage tone, by owner decision (2026-09-30). Until
 * then this row said gold, borrowed from nyuchi because the table had no mzizi
 * record. `mzizi` is also this stylesheet's default brand (see `disputed()`).
 */
export const BRANDS: ReadonlyArray<readonly [string, string, string]> = [
  ["mzizi", ecosystemMineral("mzizi"), "/v1/brand ecosystem[name=mzizi].mineral (owner decision, 2026-09-30)"],
  ["mukoko", ecosystemMineral("mukoko"), "/v1/brand ecosystem[name=mukoko].mineral"],
  ["nyuchi", ecosystemMineral("nyuchi"), "/v1/brand ecosystem[name=nyuchi].mineral"],
  ["bundu", ecosystemMineral("bundu"), "/v1/brand ecosystem[name=bundu].mineral"],
  ["shamwari", ecosystemMineral("shamwari"), "/v1/brand ecosystem[name=shamwari].mineral"],
  ["news", ecosystemMineral("news"), "/v1/brand ecosystem[name=news].mineral (owner decision, 2026-10-04)"],
  ["events", ecosystemMineral("events"), "/v1/brand ecosystem[name=events].mineral, Mukoko Events (owner decision, 2026-10-04; agrees with lib/tokens/index.ts mukoko.events)"],
  ["bushtrade", ecosystemMineral("bushtrade"), "/v1/brand ecosystem[name=bushtrade].mineral (agrees with lib/tokens/index.ts mukoko.commerce)"],
  ["weather", ecosystemMineral("weather"), "/v1/brand ecosystem[name=weather].mineral (owner decision, 2026-10-04)"],
  ["kweli", ecosystemMineral("kweli"), "/v1/brand ecosystem[name=kweli].mineral (owner decision, 2026-10-04)"],
  ["learning", ecosystemMineral("learning"), "/v1/brand ecosystem[name=learning].mineral (owner decision, 2026-10-04: every Nyuchi brand is gold)"],
  ["circles", ecosystemMineral("circles"), "/v1/brand ecosystem[name=circles].mineral, Mukoko Circles; accent from ecosystem[name=circles].accent (owner decision, 2026-10-06)"],
]

/** A brand's accent family (`--brand-accent`), when its canon row names one. */
export function ecosystemAccent(brand: string): string | undefined {
  return ecosystem.find((b) => b.name === brand)?.accent
}

/**
 * Deprecated `data-brand` values, each mapped to the brand it now means. A
 * block's selector list carries its aliases, so `data-brand="nhimbe"` keeps
 * resolving after the rename to `events` (owner decision, 2026-10-04: the
 * nhimbe brand is retired; the events platform is Mukoko Events). Read from
 * canon's `aliases`, never retyped.
 */
export const BRAND_ALIASES: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(ecosystemAliases).filter(([, brand]) => BRANDS.some(([b]) => b === brand))
)

/** A brand's selector list: itself, then each deprecated alias. */
function brandSelectors(brand: string): string {
  const aliases = Object.keys(BRAND_ALIASES).filter((a) => BRAND_ALIASES[a] === brand)
  return [brand, ...aliases].map((b) => `[data-brand="${b}"]`).join(",\n")
}

/** This stylesheet's default brand — the one `:root` resolves without `data-brand`. */
export const DEFAULT_BRAND = "mzizi"

/**
 * The `-aa` custom property for a family, by the prefix its group is emitted
 * under: `--mineral-*`, `--heritage-*` or `--exp-*`.
 */
function aaVar(family: string, heritage: ReadonlyArray<{ name: string }>, experimental: ReadonlyArray<{ name: string }>): string {
  if (heritage.some((h) => h.name === family)) return `--heritage-${family}-aa`
  if (experimental.some((e) => e.name === family)) return `--exp-${family}-aa`
  return `--mineral-${family}-aa`
}

// ════════════════════════════════════════════════════════════════════════════
// THE RENDERER
// ════════════════════════════════════════════════════════════════════════════

const box = (title: string) =>
  `  /* ${"─".repeat(2)} ${title} ${"─".repeat(Math.max(2, 70 - title.length))} */`

const lo = (hex: string) => (hex.startsWith("#") ? hex.toLowerCase() : hex)

/** `--primary`/`--ring` are set per brand; everything else derives from them. */
function brandBlocks(heritage: ReadonlyArray<{ name: string }>, experimental: ReadonlyArray<{ name: string }>): string {
  return BRANDS.map(
    ([brand, mineral, source]) => {
      const aliases = Object.keys(BRAND_ALIASES).filter((a) => BRAND_ALIASES[a] === brand)
      const aliasNote = aliases.length
        ? `\n * Deprecated alias${aliases.length > 1 ? "es" : ""}, still honoured: ${aliases.join(", ")}.`
        : ""
      const accent = ecosystemAccent(brand)
      const accentLine = accent ? `\n  --brand-accent: var(${aaVar(accent, heritage, experimental)});` : ""
      return `/* ${brand} — ${mineral}${accent ? `, ${accent} accent` : ""}.
 * ${source}${aliasNote} */
${brandSelectors(brand)} {
  --primary: var(${aaVar(mineral, heritage, experimental)});
  --ring: var(--mineral-cobalt-aa);${accentLine}
}`
    }
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
  const textTier = textOnBaseTier(families, tier)
  const text = textRamp()
  const resolved = resolveRoles(minerals, heritage, experimental)

  /** The `-text` value, and the measurement behind it, for one family in one theme. */
  const tx = (name: string, mode: "light" | "dark") => {
    const v = textTier.get(name)![mode]
    const bg = mode === "light" ? BASE_LIGHT : BASE_DARK
    return {
      hex: v.hex,
      note: v.hex === v.canon
        ? `APCA Lc ${v.measure} on --base — ${v.origin}`
        : `APCA Lc ${v.measure} on --base. ${v.canon} measures ${v.canonMeasure} as text on ${bg}; ${v.origin}`,
    }
  }

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
      out.push(`  --mineral-${m.name}-text: ${lo(tx(m.name, mode).hex)}; /* ${tx(m.name, mode).note} */`)
    }

    out.push("")
    out.push(box("SEVEN HERITAGE TONES"))
    for (const h of heritage) {
      const v = pick(h.lightHex, h.darkHex)
      const a = aa(h.name, v, mode)
      out.push(`  --heritage-${h.name}: ${lo(v)}; /* ${h.symbolism} */`)
      out.push(`  --heritage-${h.name}-aa: ${lo(a.hex)}; /* ${a.note} */`)
      out.push(`  --heritage-${h.name}-text: ${lo(tx(h.name, mode).hex)}; /* ${tx(h.name, mode).note} */`)
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
      out.push(`  --exp-${e.name}-text: ${lo(tx(e.name, mode).hex)}; /* ${tx(e.name, mode).note} */`)
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
    out.push(`  --text-primary: ${lo(t.primary)}; /* APCA Lc ${t.measure.primary} on --base, ${t.onSurface.primary} on --surface */`)
    out.push(`  --text-secondary: ${lo(t.secondary)}; /* APCA Lc ${t.measure.secondary} on --base, ${t.onSurface.secondary} on --surface */`)
    out.push(`  --text-tertiary: ${lo(t.tertiary)}; /* APCA Lc ${t.measure.tertiary} on --base, ${t.onSurface.tertiary} on --surface */`)
    out.push(`  --hero-text: #ffffff; /* Text over photography — pair with --hero-text-shadow, never bare */`)
    out.push(`  --hero-text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 2px 12px rgba(0, 0, 0, 0.4);`)
    out.push(`  --muted-foreground: var(--text-secondary);`)

    out.push("")
    /** The declaration for one role in this theme, with the measurement where it was derived. */
    const decl = (r: ResolvedRole, comment?: string) => {
      const note = r.derived[mode] ?? comment
      return `  ${roleVar(r.role)}: ${r.css[mode]};${note ? ` /* ${note} */` : ""}`
    }
    const block = (b: Role["block"]) => [...resolved.values()].filter((r) => r.role.block === b)

    out.push(box("STATUS"))
    for (const r of block("status")) out.push(decl(r, r.role.description))

    out.push("")
    out.push(box("CHART — the seven minerals, in palette order"))
    for (const r of block("chart")) {
      if (r.role.name === "chart-positive") {
        out.push(`  /* Semantic series. These must NOT change hue between themes — a negative`)
        out.push(`     series that is orange in light and rose in dark is the defect found in`)
        out.push(`     mukoko-news, where all twelve chart values were raw Tailwind palette. */`)
      }
      out.push(decl(r))
    }

    out.push("")
    out.push(box("SHADCN SEMANTIC SET"))
    for (const r of block("shadcn")) {
      out.push(decl(r, r.role.name === "background" ? "ALIAS. /v1/brand calls this step `base`; shadcn calls it `background`." : undefined))
    }

    out.push("")
    out.push(box("SIDEBAR"))
    for (const r of block("sidebar")) out.push(decl(r))

    // The role layer (#484). Every role the blocks above do not already declare.
    // Declared again under `.dark` only where the theme changes what it paints,
    // so a nested `.dark` scope re-resolves it.
    const own = block("roles").filter((r) => mode === "light" || r.value.dark !== r.value.light || r.css.dark !== r.css.light)
    if (own.length) {
      out.push("")
      out.push(box("ROLES — identity, status tones, lifecycle, destructive, categories (#484)"))
      for (const r of own) out.push(decl(r))
    }

    return out.join("\n")
  }

  const defaultMineral = BRANDS.find(([b]) => b === DEFAULT_BRAND)![1]
  const defaultPrimary = aaVar(defaultMineral, heritage, experimental)
  return [
    header(),
    themeBlock(minerals, heritage, experimental),
    fontTheme(resolved),
    containerTheme(),
    rootBlock(vars("light"), defaultPrimary, resolved),
    darkBlock(vars("dark"), defaultPrimary),
    containerUtilities(),
    brandSection(heritage, experimental),
  ].join("\n\n")
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
 *   text-on-base tier    a \`-text\` variant beside every family, APCA Lc 75
 *                        as text on \`--base\` in both themes (for links,
 *                        accents and headings in the brand colour)
 *   surface ladder       9 steps, pitch → wash, plus \`muted\`
 *   text ramp            3 tiers, measured on \`--base\`, plus \`--hero-text\`
 *   status / chart / sidebar / the shadcn semantic set
 *   roles                every role in \`lib/tokens/roles.source.ts\` as a
 *                        bare var and a Tailwind key: identity, status tones
 *                        (\`text-status-success-text\`), lifecycle, destructive,
 *                        categories, sizes (\`h-touch\`), radii
 *                        (\`rounded-control\`) and fonts (\`font-body\`). A brand
 *                        moves a role by redeclaring its var; the APCA gate
 *                        holds the Mzizi mapping to Lc 75 text, Lc 30 UI
 *   non-colour ladders   spacing 17, motion 4+4+3, type 13+9, shadow 8,
 *                        radius 7, touch targets, control heights, z-index
 *   containers           3 widths (narrow, prose, wide) and the
 *                        \`.container-custom\` / \`-narrow\` / \`-prose\` utilities
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
 * The one literal is the touch floor, \`--spacing-touch-min\`, inlined on purpose
 * so no brand can lower it, and \`--spacing-touch\` is clamped to it.
 *
 * Every role in \`lib/tokens/roles.source.ts\` registers here
 * (\`--color-<role>\`, \`--radius-<role>\`, \`--spacing-<role>\`), so a brand that
 * moves a role's bare variable moves every utility that names it with no
 * Tailwind rebuild. The fonts are not here: see \`fontTheme()\`.
 */
function themeBlock(minerals: Mineral[], heritage: Heritage[], experimental: Experimental[]): string {
  const out: string[] = ["@theme inline {"]
  out.push(box("FAMILIES"))
  for (const m of minerals) {
    out.push(`  --color-${m.name}: var(--mineral-${m.name});`)
    out.push(`  --color-${m.name}-container: var(--mineral-${m.name}-container);`)
    out.push(`  --color-${m.name}-on-container: var(--mineral-${m.name}-on-container);`)
    out.push(`  --color-${m.name}-aa: var(--mineral-${m.name}-aa);`)
    out.push(`  --color-${m.name}-text: var(--mineral-${m.name}-text);`)
  }
  for (const h of heritage) {
    out.push(`  --color-${h.name}: var(--heritage-${h.name});`)
    out.push(`  --color-${h.name}-aa: var(--heritage-${h.name}-aa);`)
    out.push(`  --color-${h.name}-text: var(--heritage-${h.name}-text);`)
  }
  for (const e of experimental) {
    out.push(`  --color-${e.name}: var(--exp-${e.name});`)
    out.push(`  --color-${e.name}-container: var(--exp-${e.name}-container);`)
    out.push(`  --color-${e.name}-on-container: var(--exp-${e.name}-on-container);`)
    out.push(`  --color-${e.name}-ui: var(--exp-${e.name}-ui);`)
    out.push(`  --color-${e.name}-aa: var(--exp-${e.name}-aa);`)
    out.push(`  --color-${e.name}-text: var(--exp-${e.name}-text);`)
  }
  out.push("")
  out.push(box("ROLES — colour (lib/tokens/roles.source.ts)"))
  for (const r of ROLES.filter((x) => isColorKind(x.kind))) out.push(`  --color-${colorKey(r)}: var(${roleVar(r)});`)
  out.push("")
  out.push(box("ROLES — size and radius"))
  for (const r of ROLES.filter((x) => x.kind === "size")) {
    const key = r.name
    const touchMin = ROLES.find((x) => x.name === "spacing-touch-min")!
    const floor = `${(touchMin.default as { px: number }).px / 16}rem`
    if (r.fixed) out.push(`  --${key}: ${floor}; /* a literal: the touch floor no brand can lower */`)
    else if (r.name === "spacing-touch") out.push(`  --${key}: max(var(${roleVar(r)}), ${floor}); /* never under the touch floor */`)
    else out.push(`  --${key}: var(${roleVar(r)});`)
  }
  for (const r of ROLES.filter((x) => x.kind === "radius")) out.push(`  --${r.name}: var(${roleVar(r)});`)
  out.push("")
  out.push(box("SPACING / RADIUS / TYPE / SHADOW / EASING"))
  for (const [n] of SPACING) out.push(`  --spacing-${n}: var(--space-${n});`)
  for (const [n] of RADIUS) out.push(`  --radius-${n}: var(--r-${n});`)
  for (const [n] of TYPE) out.push(`  --text-${n}: var(--fs-${n});`)
  for (const [alias, size] of TYPE_ALIASES) out.push(`  --text-${alias}: var(--fs-${size});`)
  for (const [n] of SHADOW) out.push(`  --shadow-${n}: var(--elevation-${n});`)
  for (const [n] of EASING) out.push(`  --ease-${n}: var(--easing-${n});`)
  out.push("}")
  return out.join("\n")
}

/**
 * The font roles, in a plain \`@theme\` (not \`inline\`).
 *
 * Under \`@theme inline\` Tailwind compiled the literal "Noto Sans" into
 * \`.font-sans\`, so a brand could not move the type without rebuilding. A
 * non-inline key compiles \`.font-body\` to \`font-family: var(--font-body)\`
 * and declares \`--font-body\` on \`:root\`, where a brand overrides it at runtime.
 * \`font-sans\`, \`font-serif\` and \`font-mono\` stay, as aliases of the roles.
 */
function fontTheme(resolved: Map<string, ResolvedRole>): string {
  const out: string[] = ["@theme {"]
  out.push(box("FONT ROLES"))
  for (const r of ROLES.filter((x) => x.kind === "font")) out.push(`  ${roleVar(r)}: ${resolved.get(r.name)!.css.light};`)
  for (const [alias, of] of FONT_ALIASES) out.push(`  --font-${alias}: var(--${of});`)
  out.push("}")
  return out.join("\n")
}

/**
 * The content widths, in a plain `@theme` (not `inline`): the values are
 * theme-invariant literals, and a non-inline key keeps `max-w-narrow` and the
 * container utilities resolving through `var(--container-*)`, so a consumer
 * can move a width with one line in LOCAL OVERRIDES.
 */
function containerTheme(): string {
  const out: string[] = ["@theme {"]
  out.push(box("CONTAINER WIDTHS"))
  for (const [n, v, why] of CONTAINERS) out.push(`  --container-${n}: ${v}; /* ${why} */`)
  out.push("}")
  return out.join("\n")
}

/** `.container-custom`, `.container-narrow`, `.container-prose` as `@utility`. */
function containerUtilities(): string {
  const bp = ["sm", "lg"] as const
  const blocks = CONTAINER_UTILITIES.map(([name, width, gutters]) => {
    const out = [`@utility ${name} {`]
    out.push(`  max-width: var(--container-${width});`)
    out.push(`  margin-inline: auto;`)
    out.push(`  padding-inline: var(--space-${gutters[0]});`)
    gutters.slice(1).forEach((g, i) => {
      out.push(`  @variant ${bp[i]} {`)
      out.push(`    padding-inline: var(--space-${g});`)
      out.push(`  }`)
    })
    out.push("}")
    return out.join("\n")
  })
  return `/* ════════════════════════════════════════════════════════════════════════════
 * CONTAINERS
 *
 * The three content columns the site components render through. They used to
 * live in each consuming site's globals.css, so a repo that copied this file
 * and installed \`site-container\` got an unstyled div. \`@utility\` rather than
 * \`@layer components\`, so they take variants (\`md:container-narrow\`) and a
 * plain utility after them (\`px-0\`) still wins.
 * ════════════════════════════════════════════════════════════════════════════ */

${blocks.join("\n\n")}`
}

/** The ladders and the unresolved block — theme-invariant, so `:root` only. */
function invariants(resolved: Map<string, ResolvedRole>): string {
  const out: string[] = []
  const decl = (r: Role) => {
    const v = resolved.get(r.name)!
    const px = r.kind === "size" ? ` /* ${v.value.light} — ${r.description} */` : ` /* ${r.description} */`
    return `  ${roleVar(r)}: ${v.css.light};${px}`
  }
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
  for (const [alias, of] of FONT_ALIASES) out.push(`  --font-family-${alias}: ${resolved.get(of)!.css.light};`)
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
  out.push(`  /* Radius roles (#484) — brandMeta.componentSpecs. Mzizi keeps controls pill (owner`)
  out.push(`     decision 2026-10-07); a brand switches them here, not in a component. */`)
  for (const r of ROLES.filter((x) => x.kind === "radius")) out.push(`${decl(r)}`)
  out.push(`  /* Deprecated names of the radius roles, kept for one minor: */`)
  out.push(`  --r-button: var(--r-control);`)
  out.push(`  --r-input: var(--r-field);`)

  out.push("")
  out.push(box("ELEVATION — 8 rungs"))
  for (const [n, v] of SHADOW) out.push(`  --elevation-${n}: ${v};`)

  out.push("")
  out.push(box("TOUCH TARGETS AND CONTROL HEIGHTS"))
  for (const [n, v, why] of SIZING) out.push(`  --${n}: ${v}; /* ${why} */`)
  out.push(`  /* Size roles (#484) — \`h-touch\`, \`min-h-touch-min\`, \`h-control\`… The touch floor is`)
  out.push(`     fixed in @theme; moving --size-touch-min does not lower min-h-touch-min. */`)
  for (const r of ROLES.filter((x) => x.kind === "size")) out.push(`${decl(r)}`)

  out.push("")
  out.push(box("Z-INDEX"))
  for (const [n, v] of ZINDEX) out.push(`  --z-${n}: ${v};`)
  return out.join("\n")
}

/**
 * THE UNRESOLVED SEVEN.
 *
 * `styles/globals.css` and `/v1/brand` agree EXACTLY on all 21 families — 42
 * mineral values, 14 heritage, every experimental. They disagree on seven
 * semantic tokens, and the owner has not ruled. Nothing below is a ruling
 * either: the three that are genuinely per-brand are DERIVED from the brand
 * block so no brand's value is baked in, and the rest name both readings and
 * what would reverse them.
 */
function disputed(mode: "light" | "dark", defaultPrimary: string): string {
  const pick = <T,>(l: T, d: T) => (mode === "light" ? l : d)
  const out: string[] = []
  out.push("")
  out.push(box("UNRESOLVED — the registry and /v1/brand disagree; this is NOT a ruling"))
  if (mode === "light") {
    out.push(`  /* --primary  registry: ink #141413 | /v1/brand: tanzanite #4B0082
     Genuinely per-brand — bundu is copper, shamwari sodalite, nyuchi gold — so
     it is NOT defined as a value here. It resolves through the [data-brand]
     block at the foot of this file. \`mzizi\` is the default because this is the
     mzizi default stylesheet, and mzizi is hematite by owner decision
     (2026-09-30), read from /v1/brand ecosystem[name=mzizi]. Until then this
     default was gold. Set data-brand on <html> to change it.
     TO REVERSE: if the owner rules for ink, that is a new neutral family in
     palette.source.ts and a [data-brand] row, not an edit here. */`)
    out.push(`  --primary: var(${defaultPrimary});`)
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

function rootBlock(body: string, defaultPrimary: string, resolved: Map<string, ResolvedRole>): string {
  return `/* ════ LIGHT — the default theme ════ */
:root {
${body}
${disputed("light", defaultPrimary)}
${invariants(resolved)}
}`
}

function darkBlock(body: string, defaultPrimary: string): string {
  return `/* ════ DARK ════
 * Both selectors, because the estate uses both: next-themes writes \`.dark\`,
 * and several apps drive the theme from \`data-theme\`. A file that carried only
 * one of them rendered the light value in dark mode wherever the other was in
 * use — which is the single defect the completeness test exists to catch. */
.dark,
[data-theme="dark"] {
${body}
${disputed("dark", defaultPrimary)}
}`
}

function brandSection(heritage: ReadonlyArray<{ name: string }>, experimental: ReadonlyArray<{ name: string }>): string {
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
 * \`bundu-labs/marketing\` proved — and assigns a palette variable
 * (\`var(--mineral-*)\`, or \`var(--heritage-*)\` for mzizi's hematite), never a hex.
 * \`--accent\` and \`--brand-accent\` follow \`--primary\` automatically. Each block
 * references the \`-aa\` variant, so a brand whose mineral fails contrast gets
 * the measured-safe value rather than each team rediscovering the problem.
 *
 * Every family below is sourced, none guessed — the comment names where.
 * ════════════════════════════════════════════════════════════════════════════ */

${brandBlocks(heritage, experimental)}

/* ════════════════════════════════════════════════════════════════════════════
 * LOCAL OVERRIDES — the only block a consuming repo edits.
 *
 * Put divergence here, with a comment saying why and what would reverse it, the
 * way Mukoko Events' control-height block does. Everything above is generated and a
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
  const textTier = textOnBaseTier(families, tier)
  const text = textRamp()
  const textOf = (name: string) => {
    const v = textTier.get(name)!
    return { light: v.light.hex, dark: v.dark.hex, apca: { light: v.light.measure, dark: v.dark.measure }, metric: "APCA Lc 75 as text on surfaces.base" }
  }
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
      "The machine-readable twin of mzizi-tokens-globals.css — same values, same pass, same gate. " +
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
            text: textOf(m.name),
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
            text: textOf(h.name),
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
            text: textOf(e.name),
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
    roles: Object.fromEntries(
      [...resolveRoles(minerals, heritage, experimental).values()].map(({ role: r, value, derived }) => [
        r.name,
        {
          kind: r.kind,
          group: r.group,
          required: r.required,
          cssVar: roleVar(r),
          light: value.light,
          dark: value.dark,
          contrast: r.contrast ?? null,
          ...(Object.keys(derived).length ? { derived } : {}),
          description: r.description,
        },
      ])
    ),
    chart: {
      series: minerals.map((m) => ({ name: m.name, light: m.lightHex.toUpperCase(), dark: m.darkHex.toUpperCase() })),
      positive: "status.success", negative: "status.error", neutral: "status.neutral",
      $comment: "Semantic series reference a status role so they cannot change hue between themes.",
    },
    brands: Object.fromEntries(
      BRANDS.map(([brand, mineral, source]) => {
        const m = [...minerals, ...heritage, ...experimental].find((x) => x.name === mineral)
        if (!m) throw new Error(`brand ${brand} names unknown palette family "${mineral}"`)
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
        "The registry's styles/globals.css and /v1/brand disagree on these and the owner has not ruled. " +
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
      fonts: { ...FONTS },
    },
  }
  return JSON.stringify(doc, null, 2) + "\n"
}
