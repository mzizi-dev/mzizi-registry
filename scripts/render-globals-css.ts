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
  BODY,
  BODY_FLOOR_PX,
  BUNDU_FLOOR,
  CAPTION_FLOOR_PX,
  FLOOR_VISIBLE_FINE_PX,
  DENSITY_DESKTOP_QUERY,
  DENSITY_TABLET_QUERY,
  DESKTOP_SIZES,
  FLOOR_COARSE_PX,
  LEGACY_FLOOR_PX,
  LEGACY_SIZES,
  colorKey,
  contrastFloor,
  contrastMin,
  wcagFloor,
  wcagMin,
  WCAG_BODY,
  FONT_ALIASES,
  FONTS,
  isColorKind,
  type MeasuredRule,
  NON_BODY,
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

/**
 * Walk from `start` toward `end` in 1% steps, then `end` itself; return the
 * first that passes, or `null` when none does. The role derivations use this
 * form, so a rule no walk can satisfy is reported, never painted as #000/#FFF.
 */
function walkTo(start: string, end: string, ok: (hex: string) => boolean): string | null {
  if (ok(start)) return start
  for (let t = 0.01; t <= 0.97; t += 0.01) {
    const c = mix(start, end, t)
    if (ok(c)) return c
  }
  return ok(end) ? end : null
}

/** Walk from `start` toward `end` in 1% steps; return the first step that passes, else `end` (the palette tiers). */
function walk(start: string, end: string, ok: (hex: string) => boolean): string {
  return walkTo(start, end, ok) ?? end
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
 *
 * Both are READ from `brand.source.ts` `backgroundColors`, the same fold as
 * `STATUS`, `RADIUS` and `SIZING`: the contrast gate measures the roles `base`
 * and `surface` from that record, so the text ramp and the `-text` tier, which
 * walk against these, measure the same surface the gate does.
 */
export const LADDER: ReadonlyArray<readonly [string, string, string, string]> = (
  ["pitch", "void", "base", "surface", "container", "overlay", "raised", "scrim", "wash"] as const
).map((name) => {
  const row = background(name)
  return [name, canonicalColor(row.lightValue), canonicalColor(row.darkValue), row.usage] as const
})

/** The tenth background — deepest inset fill, not a ladder rung. */
export const MUTED: readonly [string, string] = (() => {
  const row = background("muted")
  return [canonicalColor(row.lightValue), canonicalColor(row.darkValue)] as const
})()

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
  // Phone / coarse pointer: Apple HIG Typography, iOS/iPadOS "Large (default)" text styles
  // (developer.apple.com/design/human-interface-guidelines/typography, read 2026-11-01).
  ["display", "2.5rem", 40, "1.1", 700, "serif"],
  ["display-sm", "2.125rem", 34, "1.1", 700, "serif"],
  ["h1", "2.125rem", 34, "1.15", 700, "serif"], // Large Title (leading comes from --lh-*)
  ["h2", "1.75rem", 28, "1.2", 600, "serif"], // Title 1 (leading comes from --lh-*)
  ["h3", "1.375rem", 22, "1.25", 600, "serif"], // Title 2 (leading comes from --lh-*)
  ["h4", "1.25rem", 20, "1.3", 600, "sans"], // Title 3 (leading comes from --lh-*)
  ["h5", "1.0625rem", 17, "1.4", 600, "sans"], // Headline (leading comes from --lh-*)
  ["h6", "1.0625rem", 17, "1.4", 600, "sans"], // Callout 16 raised to the Bundu body floor, 17 (leading comes from --lh-*)
  ["body-lg", "1.125rem", 18, "1.6", 400, "sans"], // no Apple style between Body 17 and Title 3 20; unchanged
  ["body", "1.0625rem", 17, "1.6", 400, "sans"], // Body (leading comes from --lh-*)
  ["small", "0.875rem", 14, "1.5", 400, "sans"], // secondary label: the Bundu caption floor, 14 (Apple Subhead is 15)
  ["caption", "0.875rem", 14, "1.5", 400, "sans"], // caption, metadata: the Bundu caption floor, 14 (Apple Caption 1 is 12, its minimum 11)
  ["code", "0.875rem", 14, "1.6", 400, "mono"],
] as const

/**
 * Type under density: only the sizes that move are listed, `[rem, px]`. Display and heading sizes step down as
 * screens grow. BODY AND SECONDARY TEXT DO NOT: the Bundu floor (owner ruling 2026-11-02, `BUNDU_FLOOR` in
 * `lib/tokens/roles.source.ts`) holds body text at 17px on every device, desktop included, and captions,
 * metadata and secondary labels at 14px. Every step listed here stays at or above the body floor;
 * `__tests__/bundu-floor.test.ts` fails when one does not.
 */
export const TYPE_STEPS = {
  tablet: {
    display: ["3rem", 48],
    "display-sm": ["2.5rem", 40],
  },
  desktop: {
    display: ["3rem", 48],
    "display-sm": ["2.5rem", 40],
    h1: ["2rem", 32],
    h2: ["1.5rem", 24],
    h3: ["1.25rem", 20],
    h4: ["1.125rem", 18],
  },
} as const satisfies Record<string, Record<string, readonly [string, number]>>

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

const BASE_LIGHT = LADDER.find(([n]) => n === "base")![1]
const BASE_DARK = LADDER.find(([n]) => n === "base")![2]
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

const SURFACE_LIGHT = LADDER.find(([n]) => n === "surface")![1]
const SURFACE_DARK = LADDER.find(([n]) => n === "surface")![2]

/** APCA Lc 75, the body-text bar (`BODY` in the role manifest). `textRamp()` walks `--text-secondary` to the same bar. */
const BODY_TEXT = BODY

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
    // Lc 75 on `base` and WCAG 7:1 (`WCAG_BODY`, #399) on `base` and `surface`: the page surfaces body text sits on.
    const light = walk(
      f.lightHex,
      "#000000",
      (c) => Math.abs(apca(c, BASE_LIGHT)) >= BODY_TEXT && [BASE_LIGHT, SURFACE_LIGHT].every((b) => wcag(c, b) >= WCAG_BODY)
    )
    const darkStart = tier.get(f.name)?.dark?.hex ?? f.darkHex
    const dark = walk(
      darkStart,
      WHITE,
      (c) => Math.abs(apca(c, BASE_DARK)) >= BODY_TEXT && [BASE_DARK, SURFACE_DARK].every((b) => wcag(c, b) >= WCAG_BODY)
    )
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
  // The WCAG minimums (owner decision 2026-11-02, #399) come from the manifest: body text 7:1, tertiary 4.5:1.
  const ratioOf = (name: string) => {
    const r = ROLES.find((x) => x.name === name)!
    return r.contrast && "against" in r.contrast ? wcagMin(r.kind, r.contrast) : 0
  }
  const ramp = (bg: string, toward: string, bar: number, also: string[] = [], ratio?: number) =>
    walk(mix(bg, toward, 0.01), toward, (c) =>
      [bg, ...also].every((b) => Math.abs(apca(c, b)) >= bar && (!ratio || wcag(c, b) >= ratio))
    )
  const build = (bg: string, toward: string, surf: string) => {
    const t = {
      primary: ramp(bg, toward, 90, [], ratioOf("text-primary")),
      secondary: ramp(bg, toward, BODY, [surf], ratioOf("text-secondary")),
      tertiary: ramp(bg, toward, NON_BODY, [surf], ratioOf("text-tertiary")),
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
  /**
   * Set in the theme a derived role was NOT derived in: why it is a literal
   * there too (the alias-chain rule, in the stylesheet header).
   */
  notes: Partial<Record<Mode, string>>
  /** Set where `derive` found no compliant value; the gate reports it as a violation. */
  unmet: Partial<Record<Mode, string>>
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

const BLACK = "#000000"
const opposite = (toward: string) => (toward === BLACK ? WHITE : BLACK)

/**
 * Resolve every role in `lib/tokens/roles.source.ts` to what the Mzizi default
 * stylesheet declares and what it paints, in both themes.
 *
 * A role marked `derive` whose default misses its contrast rule gets a measured
 * value walked from the default with `walkTo()`, the way the `-aa` tier is made:
 * the family's own variable is untouched, and the role carries the safe value
 * with the measurement beside it.
 *
 *   - `derive: "fill"` moves the fill until EVERY role measured on it clears its
 *     bar. Each foreground pulls the fill away from itself; the walk goes the way
 *     they agree on (or the first foreground's way when they do not), then the
 *     other way. A fill is measured against its foregrounds' values BEFORE their
 *     own derivation, so a text-derived foreground on a fill-derived fill
 *     resolves fill first, foreground second, in either resolution order,
 *     without re-entering either.
 *   - `derive: "text"` moves the role away from its backgrounds: toward black in
 *     light, toward white in dark, then the other way.
 *   - When neither direction satisfies the rule, the role keeps its default and
 *     `unmet` says why, which `roleGate()` reports as a violation naming the
 *     roles. Nothing is ever painted #000 or #FFF because a walk ran out.
 *   - A role derived in either theme is a literal in BOTH themes (the alias-chain
 *     rule): overriding its source var then moves it in neither theme, instead
 *     of in one.
 *
 * `roles` defaults to the manifest; tests pass another to exercise a case the
 * Mzizi pack does not have. The map is in `roles` order whatever order the
 * resolution finished in, so the output does not depend on it.
 */
export function resolveRoles(
  minerals: Mineral[],
  heritage: Heritage[],
  experimental: Experimental[],
  roles: readonly Role[] = ROLES
): Map<string, ResolvedRole> {
  const families = [
    ...minerals.map((m) => ({ ...m, group: "mineral" as const })),
    ...heritage.map((h) => ({ ...h, group: "heritage" as const })),
    ...experimental.map((e) => ({ ...e, group: "exp" as const })),
  ]
  const tier = a11yTier(families.map(({ name, lightHex, darkHex }) => ({ name, lightHex, darkHex })))
  const textTier = textOnBaseTier(families.map(({ name, lightHex, darkHex }) => ({ name, lightHex, darkHex })), tier)
  const ramp = textRamp()
  const byName = new Map(roles.map((r) => [r.name, r]))
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
    if ("radius" in v) {
      const row = RADIUS.find(([n]) => n === v.radius)
      if (!row) throw new Error(`role "${r.name}" names unknown radius rung "${v.radius}"`)
      return { css: `var(--r-${v.radius})`, value: row[1] }
    }
    if ("font" in v) return { css: v.font, value: v.font }
    throw new Error(`role "${r.name}" has an unreadable default`)
  }

  /** A role's value before its own derivation: what a fill is measured against. */
  const underived = (name: string, mode: Mode): string => {
    const r = byName.get(name)
    if (!r) throw new Error(`unknown role "${name}"`)
    return one(themed(r.default, mode), mode, r).value
  }

  /** Whether `hex` clears both of a rule's bars (|Lc| `min`, and the WCAG ratio where set) on `on`. */
  const clears = (hex: string, on: string, min: number, ratio?: number) =>
    Math.abs(apca(hex, on)) >= min && (ratio === undefined || wcag(hex, on) >= ratio)

  /**
   * Whether `hex` clears role `x`'s rule on every background, in `mode`. `bgValue` paints a
   * background: by default its resolved value (the fill walk below passes one with a
   * candidate fill in place of the fill it is walking).
   */
  const passes = (
    hex: string,
    x: Role & { contrast: MeasuredRule },
    mode: Mode,
    bgValue: (bg: string) => string = (bg) => resolve(bg).value[mode]
  ) => x.contrast.against.every((bg) => clears(hex, bgValue(bg), contrastMin(x.kind, x.contrast), wcagMin(x.kind, x.contrast) || undefined))

  const measured = (x: Role): x is Role & { contrast: MeasuredRule } => !!x.contrast && "against" in x.contrast

  /** Walk toward `first`, then the other way; the first value that passes, or null. */
  const derive = (start: string, first: string, ok: (hex: string) => boolean) => {
    for (const toward of [first, opposite(first)]) {
      const hex = walkTo(start, toward, ok)
      if (hex) return { hex, toward }
    }
    return null
  }

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
    const notes: Partial<Record<Mode, string>> = {}
    const unmet: Partial<Record<Mode, string>> = {}
    for (const mode of MODES) {
      const base = one(themed(r.default, mode), mode, r)
      css[mode] = base.css
      value[mode] = base.value
      if (r.derive === "text" && measured(r) && !passes(base.value, r, mode)) {
        const rule = r.contrast
        const min = contrastMin(r.kind, rule)
        const worst = Math.min(...rule.against.map((bg) => Math.abs(apca(base.value, resolve(bg).value[mode]))))
        const got = derive(base.value, mode === "light" ? BLACK : WHITE, (c) => passes(c, r, mode))
        if (got) {
          const bars = `Lc ${min}${wcagMin(r.kind, rule) ? ` and ${wcagMin(r.kind, rule)}:1` : ""}`
          derived[mode] = `derived: ${base.value} measures Lc ${worst.toFixed(1)} against ${rule.against.join(" / ")}; walked toward ${got.toward} to ${bars}`
          css[mode] = lo(got.hex)
          value[mode] = got.hex
        } else {
          unmet[mode] =
            `${r.name} (${mode}): derive "text" found no value between #000000 and #FFFFFF from ${base.value} ` +
            `that clears Lc ${min}${wcagMin(r.kind, rule) ? ` and ${wcagMin(r.kind, rule)}:1` : ""} against ${rule.against.join(" / ")} (Lc ${worst.toFixed(1)} now)`
        }
      }
      if (r.derive === "fill") {
        // Every role measured ON this fill must clear its bars on it (|Lc| and, where its
        // rule sets one, the WCAG ratio). A foreground that is mid-resolution is measured
        // before its own derivation. A text-derived foreground is held to what it WILL
        // paint: a candidate fill passes when that foreground clears its rule on it, as it
        // is or once its own walk has moved it, with the candidate standing in for this
        // fill. So the fill only moves where the foreground cannot reach its bars by itself.
        const fgs = roles
          .filter((x): x is Role & { contrast: MeasuredRule } => measured(x) && x.contrast.against.includes(name))
          .map((x) => ({
            role: x,
            name: x.name,
            min: contrastMin(x.kind, x.contrast),
            ratio: wcagMin(x.kind, x.contrast) || undefined,
            hex: x.derive === "text" || resolving.has(x.name) ? underived(x.name, mode) : resolve(x.name).value[mode],
          }))
        const reaches = (f: (typeof fgs)[number], fill: string) => {
          if (f.role.derive !== "text") return clears(f.hex, fill, f.min, f.ratio)
          const on = (bg: string) => (bg === name ? fill : resolving.has(bg) ? underived(bg, mode) : resolve(bg).value[mode])
          if (passes(f.hex, f.role, mode, on)) return true
          return derive(f.hex, mode === "light" ? BLACK : WHITE, (c) => passes(c, f.role, mode, on)) !== null
        }
        const ok = (fill: string) => fgs.every((f) => reaches(f, fill))
        if (fgs.length && !ok(base.value)) {
          // Each foreground pulls the fill away from itself: light text on a dark
          // fill pulls it toward black, dark text toward white.
          const pulls = fgs.map((f) => (apca(f.hex, base.value) < 0 ? BLACK : WHITE))
          const toBlack = pulls.filter((p) => p === BLACK).length
          const first = toBlack * 2 > pulls.length ? BLACK : toBlack * 2 < pulls.length ? WHITE : pulls[0]
          const measures = fgs.map((f) => `${f.name} measures Lc ${Math.abs(apca(f.hex, base.value)).toFixed(1)}`).join(", ")
          const got = derive(base.value, first, ok)
          if (got) {
            derived[mode] = `derived: ${measures} on ${base.value}; fill walked toward ${got.toward} to Lc ${Math.max(...fgs.map((f) => f.min))}${fgs.some((f) => f.ratio) ? ` and ${Math.max(...fgs.map((f) => f.ratio ?? 0))}:1` : ""}`
            css[mode] = lo(got.hex)
            value[mode] = got.hex
          } else {
            unmet[mode] =
              `${r.name} (${mode}): derive "fill" found no fill between #000000 and #FFFFFF from ${base.value} on which ` +
              `${fgs.map((f) => `${f.name} (needs Lc ${f.min}${f.ratio ? ` and ${f.ratio}:1` : ""})`).join(", ")} all clear their bars; ${measures} now`
          }
        }
      }
    }
    // The alias-chain rule: derived in one theme means a literal in both.
    if (MODES.some((m) => derived[m])) {
      for (const mode of MODES) {
        if (derived[mode] || css[mode] === lo(value[mode])) continue
        notes[mode] = `${css[mode]}, measured; a literal because the ${mode === "light" ? "dark" : "light"} theme is derived (see ALIAS CHAINS in the header)`
        css[mode] = lo(value[mode])
      }
    }
    resolving.delete(name)
    const res: ResolvedRole = { role: r, css, value, derived, notes, unmet }
    out.set(name, res)
    return res
  }

  for (const r of roles) resolve(r.name)
  return new Map(roles.map((r) => [r.name, out.get(r.name)!]))
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

/** A `brand.source.ts` background (surface ladder) row, failing loudly when canon lost it. */
function background(name: string) {
  const row = BACKGROUNDS.find((c) => c.name === name)
  if (!row) throw new Error(`brand.source.ts backgroundColors has no "${name}"`)
  return row
}

function BACKGROUND(name: string, mode: Mode): string {
  const row = background(name)
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
  /** Set where the rule has a named exception to the WCAG text minimum (`wcagException`). */
  wcagException?: string
  /** Set where the rule also carries a WCAG ratio: the measured ratio and its minimum. */
  wcag?: { measure: number; min: number }
}

/**
 * THE CONTRAST GATE (#484 §2b). Run on every `pnpm tokens:sync` and
 * `pnpm tokens:verify`; a violation fails the build.
 *
 *   - every `kind: text` role: |Lc| >= 75 on `base` and `surface` (or on the
 *     fill it is declared against), both themes; >= 60 where its rule names
 *     `nonBody` (text that is never body copy: APCA's non-body minimum)
 *   - every `kind: ui` role: |Lc| >= 30 on what it is declared against, unless it
 *     is marked `decorative`: then it is exempt, and listed in `decorative` so the
 *     report names every exemption (#484, owner decision 2026-10-20)
 *   - every size marked `floor` >= `spacing-touch-min`
 *   - every `derive` found a compliant value (`unmet` is a violation naming the
 *     roles, never a silent #000/#FFF)
 *
 * TODO(#484 slice 2): enforce `required` when brand packs land. Every role the
 * manifest declares resolves or throws in `resolveRoles()`, so there is nothing
 * to check until a pack can leave a role out.
 *
 * The manifest cannot loosen it: a text role that declares a bar under its floor
 * (`BODY`, or `NON_BODY` with `nonBody`), or a ui role under `UI` (all from
 * `lib/tokens/roles.source.ts`, read through `contrastFloor()`), is itself a violation unless
 * the rule carries `pending`, an owner decision named in the rule; a `decorative`
 * rule on anything but a ui role is a violation. `nonBody`, `decorative` and
 * `pending` are each pinned by the role tests.
 */
export function roleGate(resolved: Map<string, ResolvedRole>): {
  results: GateResult[]
  violations: string[]
  pending: GateResult[]
  decorative: { role: string; reason: string }[]
  wcagExceptions: { role: string; min: number; floor: number; reason: string }[]
} {
  const results: GateResult[] = []
  const wcagExceptions: { role: string; min: number; floor: number; reason: string }[] = []
  const violations: string[] = []
  const decorative: { role: string; reason: string }[] = []
  for (const { role: r, value, unmet } of resolved.values()) {
    for (const mode of MODES) if (unmet[mode]) violations.push(unmet[mode]!)
    if (r.contrast && "decorative" in r.contrast) {
      if (r.kind !== "ui") violations.push(`${r.name}: only a ui role can be decorative, not a ${r.kind} role`)
      else decorative.push({ role: r.name, reason: r.contrast.decorative })
      continue
    }
    if (!r.contrast || "exempt" in r.contrast) {
      if ((r.kind === "text" || r.kind === "ui") && !r.contrast) violations.push(`${r.name}: a ${r.kind} role with no contrast rule`)
      continue
    }
    const rule = r.contrast
    if (rule.nonBody && r.kind !== "text") violations.push(`${r.name}: only a text role can be nonBody, not a ${r.kind} role`)
    const floor = contrastFloor(r.kind, rule)
    const declared = contrastMin(r.kind, rule)
    if (declared < floor && !rule.pending) violations.push(`${r.name}: declares Lc ${declared}, under the ${r.kind} bar of ${floor}`)
    const min = Math.max(declared, floor)
    // The WCAG minimum: the kind's floor (7 body, 4.5 nonBody, 3 ui), or the rule's own higher ratio.
    const wcagBar = wcagMin(r.kind, rule)
    if ((rule.wcag ?? Infinity) < wcagFloor(r.kind, rule) && !rule.pending && !rule.wcagException)
      violations.push(`${r.name}: declares WCAG ${rule.wcag}:1, under the ${r.kind} minimum of ${wcagFloor(r.kind, rule)}:1`)
    if (rule.wcagException) {
      if (r.kind !== "text") violations.push(`${r.name}: only a text role can carry a wcagException, not a ${r.kind} role`)
      else wcagExceptions.push({ role: r.name, min: rule.wcagException.min, floor: wcagFloor(r.kind, rule), reason: rule.wcagException.reason })
    }
    for (const mode of MODES) {
      for (const bg of rule.against) {
        const on = resolved.get(bg)!.value[mode]
        const raw = Math.abs(apca(value[mode], on))
        const measure = +raw.toFixed(1)
        const ratio = wcagBar === 0 ? undefined : wcag(value[mode], on)
        const wcagOk = ratio === undefined || ratio >= wcagBar
        const res: GateResult = { role: r.name, mode, against: bg, measure, min, pass: raw >= min && wcagOk }
        if (ratio !== undefined) res.wcag = { measure: +ratio.toFixed(2), min: wcagBar }
        if (rule.wcagException) res.wcagException = rule.wcagException.reason
        if (!res.pass && rule.pending) res.pending = rule.pending
        results.push(res)
        if (!res.pass && !res.pending) {
          violations.push(
            `${r.name} (${mode}): Lc ${measure} on ${bg}, needs ${min}` +
              (ratio === undefined ? "" : `; WCAG ${ratio.toFixed(2)}:1, needs ${wcagBar}:1`)
          )
        }
      }
    }
  }
  const px = (name: string) => parseFloat(resolved.get(name)!.value.light)
  if (!resolved.has("spacing-touch-min")) throw new Error(`the manifest has no "spacing-touch-min", the touch floor`)
  const touchMin = px("spacing-touch-min")
  for (const { role: r } of resolved.values()) {
    if (!r.floor) continue
    const measure = px(r.name)
    results.push({ role: r.name, mode: "both", against: "spacing-touch-min", measure, min: touchMin, pass: measure >= touchMin })
    if (measure < touchMin) violations.push(`${r.name}: ${measure}px, under the ${touchMin}px touch floor`)
  }
  return { results, violations, pending: results.filter((x) => x.pending), decorative, wcagExceptions }
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

/**
 * `resolved` is the role map `scripts/sync-tokens.ts` resolves once in `main()`
 * and hands to every emitter; a caller without one gets the Mzizi pack.
 */
export function renderGlobalsCss(
  minerals: Mineral[],
  heritage: Heritage[],
  experimental: Experimental[],
  resolved: Map<string, ResolvedRole> = resolveRoles(minerals, heritage, experimental)
): string {
  const families = [
    ...minerals.map((m) => ({ name: m.name, lightHex: m.lightHex, darkHex: m.darkHex })),
    ...heritage.map((h) => ({ name: h.name, lightHex: h.lightHex, darkHex: h.darkHex })),
    ...experimental.map((e) => ({ name: e.name, lightHex: e.lightHex, darkHex: e.darkHex })),
  ]
  const tier = a11yTier(families)
  const textTier = textOnBaseTier(families, tier)
  const text = textRamp()

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
      // The light-mode value in EVERY theme (#543): for a surface that stays light in a dark
      // app (a printed card, an email preview). The same in both blocks, so it never flips.
      out.push(`  --mineral-${m.name}-light: ${lo(m.lightHex)}; /* ${m.name}'s light-mode value, fixed across themes */`)
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
    const tr = (on: string) => wcag(t.tertiary, on).toFixed(2)
    out.push(
      `  --text-tertiary: ${lo(t.tertiary)}; /* APCA Lc ${t.measure.tertiary} on --base, ${t.onSurface.tertiary} on --surface; ` +
        `WCAG ${tr(mode === "light" ? BASE_LIGHT : BASE_DARK)}:1 and ${tr(LADDER.find(([n]) => n === "surface")![mode === "light" ? 1 : 2])}:1 */`
    )
    out.push(`  --hero-text: #ffffff; /* Text over photography — pair with --hero-text-shadow, never bare */`)
    out.push(`  --hero-text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 2px 12px rgba(0, 0, 0, 0.4);`)
    out.push(`  --muted-foreground: var(--text-secondary);`)

    out.push("")
    /** The declaration for one role in this theme, with the measurement where it was derived. */
    const decl = (r: ResolvedRole, comment?: string) => {
      const note = r.derived[mode] ?? r.notes[mode] ?? comment
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
    themeBlock(minerals, heritage, experimental, resolved),
    fontTheme(resolved),
    containerTheme(),
    rootBlock(vars("light"), defaultPrimary, resolved),
    darkBlock(vars("dark"), defaultPrimary),
    containerUtilities(),
    densityLayer(),
    brandSection(heritage, experimental),
  ].join("\n\n")
}

/**
 * DENSITY — sizes step DOWN as screens grow (owner decision 2026-11-01).
 *
 * Defined once, here, as media queries on the size and type variables. A
 * component never branches on screen size. Density is about visual size only:
 * it is not a network-quality signal, because laptops and iPads are usually on wifi.
 *
 *   phone / coarse pointer   the :root values: 49px targets (the Bundu hit area), 17px body
 *   tablet (>= 48rem)        display type steps down; targets stay 49px (an iPad is still touched)
 *   desktop                  fine pointer + hover + >= 64rem: controls are DRAWN 28-40px
 *
 * THE BUNDU FLOOR holds in every layer (owner ruling 2026-11-02, `BUNDU_FLOOR`): body text 17px and
 * captions 14px (so no type step lives in these media queries below them), and a 49px HIT REGION on
 * every interactive control, desktop included. A control may be drawn smaller (28px and up) but keeps
 * its hit region through the `hit-area` rule below; `--target-floor` is never lowered here. Native
 * form fields cannot carry a pseudo-element, so they are drawn at the hit area. Zoom and
 * prefers-reduced-motion are untouched. Gaps between targets are spacing tokens, which density does
 * not change.
 *
 * \`:root[data-mzizi-sizes="legacy"]\` restores the pre-2026-11-01 values for a consumer
 * that has not migrated; it outranks every media block above it.
 */
function densityLayer(): string {
  const typeLines = (steps: Record<string, readonly [string, number]>) =>
    Object.entries(steps).map(([n, [rem, px]]) => `    --fs-${n}: ${rem}; /* ${px}px */`)
  const sizeLines = (sizes: Readonly<Record<string, number>>) =>
    Object.entries(sizes).map(([n, px]) => `    --${n.replace(/^spacing-/, "size-")}: ${px / 16}rem; /* ${px}px */`)
  const legacyTypeBase = {
    display: ["4.5rem", 72], "display-sm": ["3.75rem", 60], h1: ["3rem", 48], h2: ["2.25rem", 36], h3: ["1.875rem", 30],
    h4: ["1.5rem", 24], h5: ["1.25rem", 20], h6: ["1rem", 16], "body-lg": ["1.125rem", 18], body: ["1rem", 16],
    small: ["0.875rem", 14], caption: ["0.75rem", 12],
  } as const
  return `/* ════════════════════════════════════════════════════════════════════════════
 * DENSITY — sizes step down as screens grow (2026-11-01). See densityLayer().
 * ════════════════════════════════════════════════════════════════════════════ */
/* The ${FLOOR_COARSE_PX}px hit region (BUNDU_FLOOR.hitAreaPx): a transparent pseudo-element grows the click and
   touch region of a button-like control to the floor, so a control drawn at ${FLOOR_VISIBLE_FINE_PX}px on a
   desktop is still ${FLOOR_COARSE_PX}px to hit. It is in the base layer, so a utility on the element (absolute,
   inset-*) wins, and it is a no-op where the control is already drawn at the floor or larger.
   It steps aside, by design, for:
   - an element that draws its own after: pseudo-element (checkbox, switch, radio, the tabs line): it keeps its
     own, because a utility only overrides the properties it sets and the rest of this rule would mix in;
   - composite widgets, where a ${FLOOR_COARSE_PX}px overlay on a row ${FLOOR_VISIBLE_FINE_PX} to 36px tall would
     overlap its neighbours and the later sibling would steal the click: menu and listbox rows take
     min-height instead (below), and a calendar day ([data-day]) is a grid cell, left as drawn;
   - an element that clips its overflow (overflow-hidden), which would clip the pseudo-element too: add
     the wrapper-level hit-area, or size it at the floor.
   Inline links in running text are exempt, as in WCAG 2.5.8; add \`hit-area\` to any other target. */
@layer base {
  :where(button, [role="button"], [role="tab"], [role="switch"], summary, .hit-area):not([class*="after:"], [data-day]) {
    position: relative;
  }
  :where(button, [role="button"], [role="tab"], [role="switch"], summary, .hit-area):not([class*="after:"], [data-day])::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: max(100%, var(--target-floor));
    height: max(100%, var(--target-floor));
    transform: translate(-50%, -50%);
  }
  :where([role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"]) {
    min-height: var(--target-floor);
  }
}

/* ════════════════════════════════════════════════════════════════════════════
 * THE SPACING FLOOR (owner, 2026-11-04, #617; \`BUNDU_FLOOR.spacing\`): minimums that nothing can go under, even a
 * component that sets no padding at all. Inset ${BUNDU_FLOOR.spacing.insetPx}px, gaps ${BUNDU_FLOOR.spacing.controlGapPx}px, body leading ${BUNDU_FLOOR.spacing.leadingBody}.
 * These are DEFAULTS in the base layer, like the hit-area rule above: a bare element gets the floor, and a utility
 * on it (\`p-6\`, \`gap-2\`) is the author's own value, which \`__tests__/spacing-floor.test.ts\` holds to the floor
 * for every registry component. They step aside, by design, for:
 *   - controls with no text to inset: an icon-only button (\`> svg:only-child\`), an empty one, an \`svg\` (a spinner with \`role="status"\`), a fixed square
 *     (\`size-*\`), a calendar day (\`[data-day]\`), and the native checkbox, radio, range, colour and file inputs;
 *   - a surface whose padding lives on its structured children (a card with \`card-header\` / \`card-content\`
 *     slots): padding the root as well would pad twice. The children carry the inset, and the test holds them to it.
 * A control's BLOCK axis is not inset here: its height floors (the ${FLOOR_VISIBLE_FINE_PX}px drawn minimum, the ${FLOOR_COARSE_PX}px hit
 * region) already decide it, and ${BUNDU_FLOOR.spacing.insetPx}px of block padding does not fit a ${FLOOR_VISIBLE_FINE_PX}px control.
 * The legacy opt-out (data-mzizi-sizes="legacy", last in this file) sets the three variables to 0, 0 and 1: every rule below becomes a no-op.
 * ════════════════════════════════════════════════════════════════════════════ */
@layer base {
  body {
    line-height: max(var(--lh-body), var(--leading-floor));
  }
  :is(
      button,
      [role="button"],
      [role="tab"],
      [role="menuitem"],
      [role="menuitemcheckbox"],
      [role="menuitemradio"],
      [role="option"],
      select,
      textarea,
      input:not([type="checkbox"], [type="radio"], [type="range"], [type="hidden"], [type="file"], [type="color"], [type="image"])
    ):not(:has(> svg:only-child, > img:only-child), :empty, [class^="size-"], [class*=" size-"], [data-day]) {
    padding-inline: var(--inset-floor);
  }
  :where(dialog, [popover], [role="alertdialog"], [role="tooltip"], [data-slot="card"], [data-slot="alert"]):not(
      :has(> [data-slot*="header"], > [data-slot*="content"], > [data-slot*="footer"], > [data-slot*="title"], > [data-slot*="description"]),
      svg,
      :empty,
      [class^="size-"],
      [class*=" size-"]
    ) {
    padding: var(--inset-floor);
  }
  :where([role="toolbar"], [role="tablist"], [role="radiogroup"], [role="group"], [role="menu"], [role="listbox"], [role="list"], ul, ol, menu, fieldset) {
    gap: var(--gap-floor);
  }
}

@media ${DENSITY_TABLET_QUERY} {
  :root {
${typeLines(TYPE_STEPS.tablet).join("\n")}
  }
}

@media ${DENSITY_DESKTOP_QUERY} {
  :root {
    --control-floor: ${FLOOR_VISIBLE_FINE_PX / 16}rem; /* ${FLOOR_VISIBLE_FINE_PX}px: the smallest a control is DRAWN. --target-floor (the ${FLOOR_COARSE_PX}px hit region) is not lowered. */
    --touch-target-lg: ${DESKTOP_SIZES["spacing-touch"]}px;
    --touch-target: ${DESKTOP_SIZES["spacing-control-sm"]}px;
    --h-button-default: ${DESKTOP_SIZES["spacing-control"] / 16}rem; /* ${DESKTOP_SIZES["spacing-control"]}px */
    --h-button-sm: ${DESKTOP_SIZES["spacing-control-sm"] / 16}rem; /* ${DESKTOP_SIZES["spacing-control-sm"]}px */
    --h-input: ${DESKTOP_SIZES["spacing-field"] / 16}rem; /* ${DESKTOP_SIZES["spacing-field"]}px */
${sizeLines(DESKTOP_SIZES).join("\n")}
${typeLines(TYPE_STEPS.desktop).join("\n")}
  }
}

/* Opt out until you have migrated: the sizes consumers pinned before 2026-11-01. It restores the old sizes (and so
   steps OUT of the Bundu floor: 16px body, 12px captions, 48px targets); remove it to take the floor. */
:root[data-mzizi-sizes="legacy"] {
  --target-floor: ${LEGACY_FLOOR_PX / 16}rem; /* ${LEGACY_FLOOR_PX}px */
  --inset-floor: 0px; /* no spacing floor (steps out of #617) */
  --gap-floor: 0px;
  --leading-floor: 1;
  --control-floor: ${LEGACY_FLOOR_PX / 16}rem; /* ${LEGACY_FLOOR_PX}px */
  --touch-target-lg: 56px;
  --touch-target: 48px;
  --h-button-default: 3.5rem; /* 56px */
  --h-button-sm: 3rem; /* 48px */
  --h-input: 3.5rem; /* 56px */
${sizeLines(LEGACY_SIZES).join("\n")}
${Object.entries(legacyTypeBase).map(([n, [rem, px]]) => `  --fs-${n}: ${rem}; /* ${px}px */`).join("\n")}
}`
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
 *                        holds the Mzizi mapping to Lc 75 text, Lc 30 UI.
 *                        Floored sizes are clamped: \`max(var(--size-*), 3rem)\`
 *   non-colour ladders   spacing 17, motion 4+4+3, type 13+9, shadow 8,
 *                        radius 7, touch targets, control heights, z-index
 *   containers           3 widths (narrow, prose, wide) and the
 *                        \`.container-custom\` / \`-narrow\` / \`-prose\` utilities
 *   brand blocks         8 \`[data-brand]\` selectors, each moving \`--primary\`
 *                        and \`--ring\` only
 *
 * ALIAS CHAINS — what moves when you override a var
 *   A role that aliases another (\`--status-deprecated: var(--status-danger)\`)
 *   or a palette tier (\`var(--mineral-cobalt-aa)\`) follows it in both themes.
 *   A role whose value had to be DERIVED to meet its contrast bar is a measured
 *   literal in BOTH themes, even in the theme where the source already passed
 *   (\`--destructive\` light is #b3261e, the value of \`--error\`, because dark
 *   is derived). So overriding a source var moves a role in both themes or in
 *   neither, never in one. To move a derived role, redeclare the role itself.
 *   Radius roles follow their rung: \`--r-control: var(--r-full)\`.
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
 * The literals are the \`fixed\` size roles (the touch floor,
 * \`--spacing-touch-min\`), inlined on purpose so no brand can move them, and
 * every size role marked \`floor\` is clamped to the floor (see
 * \`sizeRoleTheme()\`).
 *
 * Every role in \`lib/tokens/roles.source.ts\` registers here
 * (\`--color-<role>\`, \`--radius-<role>\`, \`--spacing-<role>\`), so a brand that
 * moves a role's bare variable moves every utility that names it with no
 * Tailwind rebuild. The fonts are not here: see \`fontTheme()\`.
 */
function themeBlock(minerals: Mineral[], heritage: Heritage[], experimental: Experimental[], resolved: Map<string, ResolvedRole>): string {
  const out: string[] = ["@theme inline {"]
  out.push(box("FAMILIES"))
  for (const m of minerals) {
    out.push(`  --color-${m.name}: var(--mineral-${m.name});`)
    out.push(`  --color-${m.name}-container: var(--mineral-${m.name}-container);`)
    out.push(`  --color-${m.name}-on-container: var(--mineral-${m.name}-on-container);`)
    out.push(`  --color-${m.name}-aa: var(--mineral-${m.name}-aa);`)
    out.push(`  --color-${m.name}-text: var(--mineral-${m.name}-text);`)
    out.push(`  --color-${m.name}-light: var(--mineral-${m.name}-light);`)
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
  out.push(...sizeRoleTheme(ROLES, resolved))
  for (const r of ROLES.filter((x) => x.kind === "radius")) out.push(`  --${r.name}: var(${roleVar(r)});`)
  out.push("")
  out.push(box("SPACING / RADIUS / TYPE / SHADOW / EASING"))
  for (const [n] of SPACING) out.push(`  --spacing-${n}: var(--space-${n});`)
  for (const [n] of RADIUS) out.push(`  --radius-${n}: var(--r-${n});`)
  for (const [n] of TYPE) out.push(`  --text-${n}: var(--fs-${n});`)
  for (const [alias, size] of TYPE_ALIASES) out.push(`  --text-${alias}: var(--fs-${size});`)
  // Tailwind's own default steps, raised to the Bundu floor: `text-xs` (12px) and `text-base` (16px) are
  // below it, so a component that names them still paints 14px and 17px.
  out.push(`  --text-xs: var(--fs-caption); /* Tailwind default 12px, raised to the ${CAPTION_FLOOR_PX}px caption floor */`)
  out.push(`  --text-xs--line-height: var(--lh-small);`)
  out.push(`  --text-sm: var(--fs-small); /* ${CAPTION_FLOOR_PX}px */`)
  out.push(`  --text-sm--line-height: var(--lh-small);`)
  out.push(`  --text-base: var(--fs-body); /* Tailwind default 16px, raised to the ${BODY_FLOOR_PX}px body floor */`)
  out.push(`  --text-base--line-height: var(--lh-body);`)
  for (const [n] of SHADOW) out.push(`  --shadow-${n}: var(--elevation-${n});`)
  for (const [n] of EASING) out.push(`  --ease-${n}: var(--easing-${n});`)
  out.push("}")
  return out.join("\n")
}

/**
 * The size roles' Tailwind registrations, keyed on the manifest's flags, never
 * on a role's name:
 *
 *   - `fixed`: the role's OWN value, as a literal no brand can override;
 *   - `floor`: `max(var(--size-<name>), <floor>)`, where the floor is
 *     `--target-floor`, so a brand that lowers the bare var still
 *     paints at least the control floor (49px, or 28px drawn at desktop density);
 *   - otherwise: `var(--size-<name>)`, which a brand moves freely
 *     (`spacing-control-dense`, fine pointer only).
 */
export function sizeRoleTheme(roles: readonly Role[], resolved: Map<string, ResolvedRole>): string[] {
  const touchMin = resolved.get("spacing-touch-min")
  if (!touchMin?.role.fixed) throw new Error(`"spacing-touch-min" must be a fixed size role: it is the touch floor`)
  // The floors are variables, not literals: `--target-floor` is 49px everywhere and `--control-floor` is 49px, or
  // 28px under desktop density (see `densityLayer()`). They are declared in :root's invariants,
  // not in a brand block, so a brand pack that moves a size role cannot lower it.
  // `--target-floor` is the hit region: 49px on every device, never lowered. A floored size role is clamped to
  // `--control-floor` instead: 49px, or the 28px a desktop control may be DRAWN at (its hit region is kept
  // by the `hit-area` rule in `densityLayer()`).
  const floor = "var(--control-floor)"
  const hit = "var(--target-floor)"
  return roles
    .filter((r) => r.kind === "size")
    .map((r) => {
      const own = resolved.get(r.name)
      if (!own) throw new Error(`size role "${r.name}" was not resolved`)
      if (r.fixed) {
        if (r.name === touchMin.role.name) return `  --${r.name}: ${hit}; /* the hit-area floor: ${FLOOR_COARSE_PX}px on every device; no brand can lower it */`
        // The spacing floor (#617): the same variables the base layer reads, so the legacy opt-out moves both.
        if (r.name === "spacing-inset-floor") return `  --${r.name}: var(--inset-floor); /* the inset floor: ${BUNDU_FLOOR.spacing.insetPx}px; no brand can lower it */`
        if (r.name === "spacing-gap-floor") return `  --${r.name}: var(--gap-floor); /* the gap floor: ${BUNDU_FLOOR.spacing.controlGapPx}px; no brand can lower it */`
        return `  --${r.name}: ${own.css.light}; /* a literal: fixed, no brand can move it */`
      }
      if (r.floor) return `  --${r.name}: max(var(${roleVar(r)}), ${floor}); /* never under the control floor: ${FLOOR_COARSE_PX}px, or ${FLOOR_VISIBLE_FINE_PX}px drawn at desktop density */`
      return `  --${r.name}: var(${roleVar(r)});`
    })
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
  out.push(`  /* Deprecated names of the radius roles, kept for one minor. Each role follows its`)
  out.push(`     rung (--r-full, --r-base…), so moving a rung still moves these: */`)
  out.push(`  --r-button: var(--r-control);`)
  out.push(`  --r-input: var(--r-field);`)

  out.push("")
  out.push(box("ELEVATION — 8 rungs"))
  for (const [n, v] of SHADOW) out.push(`  --elevation-${n}: ${v};`)

  out.push("")
  out.push(box("TOUCH TARGETS AND CONTROL HEIGHTS"))
  for (const [n, v, why] of SIZING) out.push(`  --${n}: ${v}; /* ${why} */`)
  out.push(`  --target-floor: ${FLOOR_COARSE_PX / 16}rem; /* ${FLOOR_COARSE_PX}px — the Bundu hit region (7 x 7), on every device. Density never lowers it. */`)
  out.push(`  --inset-floor: ${BUNDU_FLOOR.spacing.insetPx / 16}rem; /* ${BUNDU_FLOOR.spacing.insetPx}px — the least padding between text and the edge of its container (2 x 7). Density never lowers it. */`)
  out.push(`  --gap-floor: ${BUNDU_FLOOR.spacing.controlGapPx / 16}rem; /* ${BUNDU_FLOOR.spacing.controlGapPx}px — the least gap between adjacent controls, a label and its field, and sibling items (the 7px unit). */`)
  out.push(`  --leading-floor: ${BUNDU_FLOOR.spacing.leadingBody}; /* body line height, never tighter (WCAG 1.4.12). */`)
  out.push(`  --control-floor: ${FLOOR_COARSE_PX / 16}rem; /* ${FLOOR_COARSE_PX}px: the smallest a floored control is drawn; desktop density lowers it to ${FLOOR_VISIBLE_FINE_PX}px. */`)
  out.push(`  /* Size roles (#484) — \`h-touch\`, \`min-h-touch-min\`, \`h-control\`… The touch floor is`)
  out.push(`     --target-floor, set here and by the density layer only; moving --size-touch-min does not`)
  out.push(`     lower min-h-touch-min, and every floored role (touch, control, field) is clamped in`)
  out.push(`     @theme to max(var(--size-*), var(--target-floor)). */`)
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
  experimental: Experimental[],
  resolved: Map<string, ResolvedRole> = resolveRoles(minerals, heritage, experimental)
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
      [...resolved.values()].map(({ role: r, value, derived }) => [
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
      density: {
        $comment:
          "Sizes step down as screens grow (owner decision 2026-11-01). Visual size only: never a network-quality signal. " +
          "Phone / coarse pointer is the role defaults (Apple HIG); tablet steps type down; desktop is a fine pointer with hover.",
        queries: { tablet: DENSITY_TABLET_QUERY, desktop: DENSITY_DESKTOP_QUERY },
        bunduFloor: BUNDU_FLOOR,
        floorPx: {
          hitArea: FLOOR_COARSE_PX,
          visibleFine: FLOOR_VISIBLE_FINE_PX,
          body: BODY_FLOOR_PX,
          caption: CAPTION_FLOOR_PX,
          inset: BUNDU_FLOOR.spacing.insetPx,
          gap: BUNDU_FLOOR.spacing.controlGapPx,
          leading: BUNDU_FLOOR.spacing.leadingBody,
          // Deprecated aliases of the 4.21.0 keys, for one release, carrying the Bundu floor's values
          // (the hit area is 49px on both pointers; body is 17px on every device). Read the keys above.
          coarse: FLOOR_COARSE_PX,
          fine: FLOOR_COARSE_PX,
          bodyFine: BODY_FLOOR_PX,
        },
        desktopPx: { ...DESKTOP_SIZES },
        legacyPx: { ...LEGACY_SIZES, floor: LEGACY_FLOOR_PX },
        typeSteps: TYPE_STEPS,
        apple: {
          buttons: "https://developer.apple.com/design/human-interface-guidelines/buttons: a hit region of at least 44x44 pt (Bundu keeps 49)",
          accessibility: "https://developer.apple.com/design/human-interface-guidelines/accessibility: iOS and iPadOS control size, default 44x44 pt, minimum 28x28 pt",
          typography: "https://developer.apple.com/design/human-interface-guidelines/typography: iOS and iPadOS default 17 pt, minimum 11 pt; Large (default) text styles",
          readOn: "2026-11-01",
        },
      },
      zIndex: Object.fromEntries(ZINDEX),
      fonts: { ...FONTS },
    },
  }
  return JSON.stringify(doc, null, 2) + "\n"
}
