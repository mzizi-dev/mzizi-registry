/**
 * THE ROLE MANIFEST — what a component may name, and what the Mzizi pack maps it to.
 *
 * Epic #484 ("switchable N1"), slice 1. Components and contracts are moving from
 * palette names (`text-malachite`, `bg-gold-container`, `rounded-full`, `h-14`) to
 * ROLES (`text-status-success-text`, `bg-status-warning-container`,
 * `rounded-control`, `h-touch`). A role is a name with a job. A brand pack maps
 * each role to a value; this file holds every role and the DEFAULT mapping, which
 * is the Mzizi pack. A third-party pack (slice 2) remaps roles, never components.
 *
 * Each role has:
 *   - `name`      the bare custom property, without `--` (`status-success-text`)
 *   - `kind`      text | fill | ui | surface | size | radius | font
 *   - `required`  whether a pack must resolve it in both themes
 *   - `contrast`  the rule the gate in `scripts/render-globals-css.ts` enforces
 *   - `default`   the Mzizi pack's mapping, per theme where it differs
 *
 * THE CONTRAST GATE (owner rule, #484 §2b) runs on every `pnpm tokens:sync` and
 * `pnpm tokens:verify`, and fails the build on a violation:
 *   - `kind: text` roles: |APCA Lc| >= 75 on `base` and `surface`, both themes
 *   - a foreground on its fill: >= 75
 *   - `kind: ui` roles: >= 30 on `base` and `surface`
 *   - `spacing-touch` >= `spacing-touch-min` (48px, a floor no pack can lower)
 * A rule may carry `pending` instead of passing only where the shortfall is a
 * design decision the owner has not made; the gate prints those, and
 * `__tests__/tokens-roles.test.ts` pins the exact set so it cannot grow quietly.
 *
 * NAMING RULE (#456). No role key may collide with a Tailwind utility keyword.
 * `--color-base` made `text-base` a colour instead of Tailwind's 16px font size,
 * so the ladder step `base` registers as `--color-surface-base` (`bg-surface-base`).
 * `utility` overrides the theme key for that reason;
 * `__tests__/tokens-roles.test.ts` holds every key to the rule.
 *
 * WHAT IS NOT A ROLE: icon sizes, the numeric spacing scale, layout widths and
 * grid templates, z-index, the focus-ring width and border widths. Those are
 * structural, not brand decisions.
 *
 * Values are READ from `brand.source.ts` and `palette.source.ts`, never retyped:
 * this file replaced the second copies of the status colours, the radius ladder
 * and the touch and control heights that `scripts/render-globals-css.ts` and
 * `scripts/sync-tokens.ts` used to carry as constants.
 *
 *   pnpm tokens:sync     emit every role to the stylesheet and the platform files
 *   pnpm tokens:verify   CI gate: drift, plus the contrast gate
 */

import { backgroundColors, brandMeta, ecosystem, semanticColors, typography } from "./brand.source"
import { minerals } from "./palette.source"

export type RoleKind = "text" | "fill" | "ui" | "surface" | "size" | "radius" | "font"

/** A palette family tier, as `scripts/render-globals-css.ts` emits it. */
export type FamilyTier = "base" | "container" | "on-container" | "aa" | "text"

/** One theme's value for a role. */
export type RoleValue =
  /** A palette family tier: `var(--mineral-<family>-<tier>)` or its heritage/experimental twin. */
  | { family: string; tier: FamilyTier }
  /** Another role. */
  | { role: string }
  /** A step of the measured three-tier text ramp. */
  | { ramp: "primary" | "secondary" | "tertiary" }
  /** A `brand.source.ts` semantic colour, by name. */
  | { semantic: string }
  /** A `brand.source.ts` background (surface ladder) colour, by name. */
  | { background: string }
  /** A value with no other source in the brand record. */
  | { literal: string }
  /** `color-mix(in oklab, var(--a) n%, var(--b))`. */
  | { mix: readonly [string, number, string] }
  /** A length in pixels (sizes and radii). */
  | { px: number }
  /** A font stack. */
  | { font: string }

export type ThemedValue = RoleValue | { light: RoleValue; dark: RoleValue }

export type ContrastRule =
  | {
      /** Roles the value is measured on, as text or UI over that background. */
      against: readonly string[]
      /** Minimum |APCA Lc|. */
      min: number
      /** Set only where the default misses `min` and the fix is an owner decision. */
      pending?: string
    }
  | { exempt: string }

export type RoleGroup =
  | "identity"
  | "surface"
  | "text"
  | "shadcn"
  | "sidebar"
  | "status"
  | "status-legacy"
  | "lifecycle"
  | "destructive"
  | "categorical"
  | "size"
  | "radius"
  | "font"

/**
 * Which block of the Mzizi default stylesheet declares the role's bare var.
 * `roles` is the generic role block; the others are the blocks that held these
 * names before the manifest existed and still carry their measured comments.
 */
export type RoleBlock =
  | "ladder"
  | "text"
  | "disputed"
  | "status"
  | "chart"
  | "shadcn"
  | "sidebar"
  | "roles"
  | "invariant"
  | "theme"

export interface Role {
  name: string
  group: RoleGroup
  kind: RoleKind
  required: boolean
  description: string
  contrast?: ContrastRule
  /** The Mzizi pack. */
  default: ThemedValue
  /**
   * Derive a compliant value from `default` with the palette's own `walk()` when
   * the default misses the contrast rule: `text` moves the role's value away from
   * its background, `fill` moves the fill away from its foreground. The `-aa`
   * principle: the canonical value stays, the role gets the measured-safe one.
   */
  derive?: "text" | "fill"
  /** Theme key, where the role's name would collide with a Tailwind keyword. */
  utility?: string
  /** size: rendered as a literal no pack can override. */
  fixed?: true
  /** size: must not be smaller than `spacing-touch-min`. */
  floor?: true
  block: RoleBlock
}

const BODY = 75
const UI = 30
const ON_PAGE = ["base", "surface"] as const

/** A `brand.source.ts` semantic colour, failing loudly when canon lost it. */
function semantic(name: string) {
  const row = semanticColors.find((c) => c.name === name)
  if (!row) throw new Error(`brand.source.ts semanticColors has no "${name}"`)
  return row
}

/** A component spec from `brandMeta.componentSpecs`, by name. */
function spec(name: string): { heights: Record<string, number>; borderRadius: number } {
  const row = brandMeta.componentSpecs.find((s) => s.name === name)
  if (!row) throw new Error(`brand.source.ts componentSpecs has no "${name}"`)
  return row as unknown as { heights: Record<string, number>; borderRadius: number }
}

function access(key: "minTouchTarget" | "defaultTouchTarget"): number {
  const v = brandMeta.accessibility[key]
  if (typeof v !== "number") throw new Error(`brand.source.ts accessibility.${key} is not a number`)
  return v
}

function fontFamily(name: "sans" | "serif" | "mono"): string {
  const row = typography.find((t) => t.entryType === "font" && t.name === name)
  if (!row?.family) throw new Error(`brand.source.ts typography has no font "${name}"`)
  return row.family
}

/** The mzizi row's family: hematite, by owner decision (2026-09-30). */
export const DEFAULT_PRIMARY_FAMILY: string = (() => {
  const row = ecosystem.find((e) => e.name === "mzizi")
  if (!row) throw new Error(`brand.source.ts ecosystem has no "mzizi" row`)
  return row.mineral
})()

// ─── Status tones ────────────────────────────────────────────────────────────

/** Tone → palette family (#484 §1b: every palette use in a held component encodes one of these). */
export const STATUS_TONES = [
  ["success", "malachite"],
  ["warning", "gold"],
  ["info", "cobalt"],
  ["danger", "terracotta"],
  ["premium", "tanzanite"],
] as const

/** Lifecycle → tone. Aliases, so a pack that remaps a tone moves its lifecycle too. */
export const LIFECYCLE = [
  ["stable", "success"],
  ["beta", "info"],
  ["alpha", "warning"],
  ["deprecated", "danger"],
] as const

/** The four tiers every status tone carries, and how each is measured. */
function toneRoles(tone: string, values: Record<"fill" | "container" | "on" | "text", ThemedValue>, description: string): Role[] {
  const name = `status-${tone}`
  return [
    {
      name,
      group: "status",
      kind: "ui",
      required: true,
      description: `${description} — the tone itself: dots, icons, rules, tinted fills (\`bg-${name}/10\`).`,
      contrast: { against: ON_PAGE, min: UI },
      default: values.fill,
      block: "roles",
    },
    {
      name: `${name}-container`,
      group: "status",
      kind: "surface",
      required: true,
      description: `${description} — a soft fill behind ${tone} content (alerts, badges, toasts).`,
      default: values.container,
      block: "roles",
    },
    {
      name: `${name}-on-container`,
      group: "status",
      kind: "text",
      required: true,
      description: `${description} — text and icons on \`${name}-container\`.`,
      contrast: { against: [`${name}-container`], min: BODY },
      default: values.on,
      derive: "text",
      block: "roles",
    },
    {
      name: `${name}-text`,
      group: "status",
      kind: "text",
      required: true,
      description: `${description} — the tone as text on the page (#315's per-role \`-text\` tier).`,
      contrast: { against: ON_PAGE, min: BODY },
      default: values.text,
      derive: "text",
      block: "roles",
    },
  ]
}

const fam = (family: string, tier: FamilyTier): RoleValue => ({ family, tier })

const STATUS_ROLES: Role[] = [
  ...STATUS_TONES.flatMap(([tone, family]) =>
    toneRoles(
      tone,
      {
        fill: fam(family, "base"),
        container: fam(family, "container"),
        on: fam(family, "on-container"),
        text: fam(family, "text"),
      },
      `${tone[0].toUpperCase()}${tone.slice(1)} (${family} in the Mzizi pack)`
    )
  ),
  ...toneRoles(
    "neutral",
    {
      fill: { role: "neutral" },
      container: { role: "container" },
      on: { role: "text-primary" },
      text: { role: "muted-foreground" },
    },
    "Neutral (the muted ladder in the Mzizi pack)"
  ),
]

const LIFECYCLE_ROLES: Role[] = LIFECYCLE.flatMap(([stage, tone]) =>
  ["", "-container", "-on-container", "-text"].map((suffix): Role => {
    const of = STATUS_ROLES.find((r) => r.name === `status-${tone}${suffix}`)!
    const contrast: ContrastRule | undefined =
      suffix === "-on-container"
        ? { against: [`status-${stage}-container`], min: BODY }
        : of.contrast
    return {
      name: `status-${stage}${suffix}`,
      group: "lifecycle",
      kind: of.kind,
      required: true,
      description: `Lifecycle \`${stage}\`: an alias of \`status-${tone}${suffix}\`.`,
      contrast,
      default: { role: `status-${tone}${suffix}` },
      block: "roles",
    }
  })
)

// ─── Legacy status colours — `/v1/brand` semanticColors, read from canon ─────

/**
 * The status colours `--success`, `--warning`, … that the stylesheet carried as a
 * second copy (`STATUS` in `render-globals-css.ts`). Read from canon now. They
 * stay as roles because components and consumers use them; the status TONES
 * above are what slice 4 migrates components onto.
 */
const LEGACY_STATUS_NAMES = ["success", "warning", "error", "info", "neutral", "offline", "syncing"] as const

const LEGACY_STATUS_ROLES: Role[] = [
  ...LEGACY_STATUS_NAMES.map(
    (name): Role => ({
      name,
      group: "status-legacy",
      kind: "ui",
      required: true,
      description: semantic(name).usage,
      contrast: { against: ON_PAGE, min: UI },
      default: { semantic: name },
      block: "status",
    })
  ),
  {
    name: "destructive-container",
    group: "destructive",
    kind: "surface",
    required: true,
    description: semantic("destructive-container").usage,
    default: { semantic: "destructive-container" },
    block: "status",
  },
]

// ─── The manifest ────────────────────────────────────────────────────────────

const LADDER_NAMES = ["pitch", "void", "base", "surface", "container", "overlay", "raised", "scrim"] as const

function background(name: string) {
  const row = backgroundColors.find((c) => c.name === name)
  if (!row) throw new Error(`brand.source.ts backgroundColors has no "${name}"`)
  return row
}

const fg = (against: string): ContrastRule => ({ against: [against], min: BODY })
const onWhiteOrInk: ThemedValue = { light: { literal: "#FFFFFF" }, dark: { literal: "#0E0D0C" } }

export const ROLES: readonly Role[] = [
  // ── Identity ──
  {
    name: "primary",
    group: "identity",
    kind: "fill",
    required: true,
    description: `The brand's action colour. Mzizi: ${DEFAULT_PRIMARY_FAMILY} (-aa), the ecosystem row for mzizi.`,
    default: fam(DEFAULT_PRIMARY_FAMILY, "aa"),
    block: "disputed",
  },
  {
    name: "primary-foreground",
    group: "identity",
    kind: "text",
    required: true,
    description: "Text and icons on `primary`.",
    contrast: fg("primary"),
    default: onWhiteOrInk,
    block: "shadcn",
  },
  {
    name: "ring",
    group: "identity",
    kind: "ui",
    required: true,
    description: "The focus ring. Cobalt (-aa) in the Mzizi pack, for every ecosystem brand; a custom pack may set it.",
    contrast: { against: ON_PAGE, min: UI },
    default: fam("cobalt", "aa"),
    block: "disputed",
  },
  {
    name: "brand-accent",
    group: "identity",
    kind: "fill",
    required: true,
    description: "The saturated brand accent (accent fills, the page wash). Follows `primary` unless a brand names an accent.",
    default: { role: "primary" },
    block: "disputed",
  },
  {
    name: "brand-accent-foreground",
    group: "identity",
    kind: "text",
    required: true,
    description: "Text and icons on `brand-accent`.",
    contrast: fg("brand-accent"),
    default: onWhiteOrInk,
    block: "shadcn",
  },
  {
    name: "app-accent",
    group: "identity",
    kind: "fill",
    required: true,
    description: "An app's own accent inside the shell (`app/app-shell` `accent`). Follows `brand-accent`.",
    default: { role: "brand-accent" },
    block: "roles",
  },
  {
    name: "app-accent-foreground",
    group: "identity",
    kind: "text",
    required: true,
    description: "Text and icons on `app-accent`.",
    contrast: fg("app-accent"),
    default: { role: "brand-accent-foreground" },
    block: "roles",
  },

  // ── Surfaces: the ladder, as today ──
  ...LADDER_NAMES.map(
    (name): Role => ({
      name,
      group: "surface",
      kind: "surface",
      required: true,
      description: background(name).usage,
      default: { background: name },
      // `--color-base` made `text-base` a colour (#456).
      utility: name === "base" ? "surface-base" : undefined,
      block: "ladder",
    })
  ),
  {
    name: "wash",
    group: "surface",
    kind: "surface",
    required: true,
    description: background("wash").usage,
    default: { light: { mix: ["surface", 93, "brand-accent"] }, dark: { mix: ["surface", 88, "brand-accent"] } },
    block: "ladder",
  },
  {
    name: "muted",
    group: "surface",
    kind: "surface",
    required: true,
    description: background("muted").usage,
    default: { background: "muted" },
    block: "ladder",
  },

  // ── Text ──
  {
    name: "text-primary",
    group: "text",
    kind: "text",
    required: true,
    description: "Body and heading text. APCA Lc 90 on `base`.",
    contrast: { against: ON_PAGE, min: BODY },
    default: { ramp: "primary" },
    block: "text",
  },
  {
    name: "text-secondary",
    group: "text",
    kind: "text",
    required: true,
    description: "Secondary text, descriptions. APCA Lc 75 on `base` and `surface` (#399).",
    contrast: { against: ON_PAGE, min: BODY },
    default: { ramp: "secondary" },
    block: "text",
  },
  {
    name: "text-tertiary",
    group: "text",
    kind: "text",
    required: true,
    description: "Placeholders, metadata and captions that are not body copy. APCA Lc 60 on `base` and `surface`.",
    contrast: {
      against: ON_PAGE,
      min: BODY,
      pending:
        "text-tertiary is a sub-body tier by design (Lc 60: placeholders, metadata). Raising it to Lc 75 makes it text-secondary; " +
        "the owner decides whether it stays a text role at Lc 60 or is retired (#484).",
    },
    default: { ramp: "tertiary" },
    block: "text",
  },
  {
    name: "hero-text",
    group: "text",
    kind: "text",
    required: true,
    description: "Text over photography, always with `--hero-text-shadow`.",
    contrast: { exempt: "drawn over imagery, not over base or surface; carries --hero-text-shadow" },
    default: { literal: "#FFFFFF" },
    block: "text",
  },
  {
    name: "muted-foreground",
    group: "text",
    kind: "text",
    required: true,
    description: "shadcn's secondary text. An alias of `text-secondary`.",
    contrast: { against: ON_PAGE, min: BODY },
    default: { role: "text-secondary" },
    block: "text",
  },

  // ── Status: the legacy semantic colours, then the tones ──
  ...LEGACY_STATUS_ROLES,
  ...STATUS_ROLES,
  ...LIFECYCLE_ROLES,

  // ── Categorical ──
  ...minerals.map(
    (m, i): Role => ({
      name: `chart-${i + 1}`,
      group: "categorical",
      kind: "fill",
      required: true,
      description: `Chart series ${i + 1}. Mzizi: ${m.name}.`,
      default: fam(m.name, "base"),
      block: "chart",
    })
  ),
  ...(
    [
      ["chart-positive", "success"],
      ["chart-negative", "error"],
      ["chart-neutral", "neutral"],
    ] as const
  ).map(
    ([name, of]): Role => ({
      name,
      group: "categorical",
      kind: "fill",
      required: true,
      description: `Semantic chart series; never changes hue between themes. An alias of \`${of}\`.`,
      default: { role: of },
      block: "chart",
    })
  ),
  ...minerals.map(
    (m, i): Role => ({
      name: `category-${i + 1}`,
      group: "categorical",
      kind: "fill",
      required: true,
      description: `Category ${i + 1} (the mineral strip, Discover categories). Mzizi: ${m.name}.`,
      default: fam(m.name, "base"),
      block: "roles",
    })
  ),

  // ── shadcn semantic set ──
  {
    name: "background",
    group: "shadcn",
    kind: "surface",
    required: true,
    description: "shadcn's page background. An alias of `base`.",
    default: { role: "base" },
    block: "shadcn",
  },
  {
    name: "foreground",
    group: "shadcn",
    kind: "text",
    required: true,
    description: "shadcn's text colour. An alias of `text-primary`.",
    contrast: { against: ON_PAGE, min: BODY },
    default: { role: "text-primary" },
    block: "shadcn",
  },
  { name: "card", group: "shadcn", kind: "surface", required: true, description: "Card surface.", default: { role: "surface" }, block: "shadcn" },
  { name: "card-foreground", group: "shadcn", kind: "text", required: true, description: "Text on `card`.", contrast: fg("card"), default: { role: "text-primary" }, block: "shadcn" },
  { name: "popover", group: "shadcn", kind: "surface", required: true, description: "Popover surface.", default: { role: "overlay" }, block: "shadcn" },
  { name: "popover-foreground", group: "shadcn", kind: "text", required: true, description: "Text on `popover`.", contrast: fg("popover"), default: { role: "text-primary" }, block: "shadcn" },
  { name: "secondary", group: "shadcn", kind: "fill", required: true, description: "Secondary button fill.", default: { role: "container" }, block: "shadcn" },
  { name: "secondary-foreground", group: "shadcn", kind: "text", required: true, description: "Text on `secondary`.", contrast: fg("secondary"), default: { role: "text-primary" }, block: "shadcn" },
  {
    name: "destructive",
    group: "destructive",
    kind: "fill",
    required: true,
    description: "Errors and destructive actions: red, never the terracotta `status-danger` (owner decision 2026-10-07).",
    default: { role: "error" },
    derive: "fill",
    block: "shadcn",
  },
  {
    name: "destructive-foreground",
    group: "destructive",
    kind: "text",
    required: true,
    description: "Text and icons on `destructive`.",
    contrast: fg("destructive"),
    default: onWhiteOrInk,
    block: "shadcn",
  },
  {
    name: "destructive-text",
    group: "destructive",
    kind: "text",
    required: true,
    description: "Error text on the page (form messages).",
    contrast: { against: ON_PAGE, min: BODY },
    default: { role: "error" },
    derive: "text",
    block: "roles",
  },
  { name: "overlay-foreground", group: "shadcn", kind: "text", required: true, description: "Text on `overlay`.", contrast: fg("overlay"), default: { role: "text-primary" }, block: "shadcn" },
  {
    name: "accent",
    group: "shadcn",
    kind: "surface",
    required: true,
    description: "Hover and selected fills: `primary` at 12% over `base`.",
    default: { mix: ["primary", 12, "base"] },
    block: "disputed",
  },
  { name: "accent-foreground", group: "shadcn", kind: "text", required: true, description: "Text on `accent`.", contrast: fg("accent"), default: { role: "text-primary" }, block: "shadcn" },
  {
    name: "border",
    group: "shadcn",
    kind: "ui",
    required: true,
    description: "Hairlines: cards, inputs, dividers, tables.",
    contrast: {
      against: ON_PAGE,
      min: UI,
      pending:
        "the Mzizi hairline (#E7E5E0 / #2A2927) is decorative and measures under Lc 15 on base. Lc 30 is a visibly heavier " +
        "border on every card; the owner decides between darkening it and a separate boundary role for inputs (#484).",
    },
    default: { semantic: "border" },
    block: "disputed",
  },
  { name: "input", group: "shadcn", kind: "surface", required: true, description: semantic("input").usage, default: { semantic: "input" }, block: "disputed" },

  // ── Sidebar ──
  { name: "sidebar", group: "sidebar", kind: "surface", required: true, description: "Sidebar surface.", default: { role: "surface" }, block: "sidebar" },
  { name: "sidebar-foreground", group: "sidebar", kind: "text", required: true, description: "Text on `sidebar`.", contrast: fg("sidebar"), default: { role: "text-primary" }, block: "sidebar" },
  { name: "sidebar-primary", group: "sidebar", kind: "fill", required: true, description: "The sidebar's active item fill.", default: { role: "primary" }, block: "sidebar" },
  { name: "sidebar-primary-foreground", group: "sidebar", kind: "text", required: true, description: "Text on `sidebar-primary`.", contrast: fg("sidebar-primary"), default: { role: "primary-foreground" }, block: "sidebar" },
  { name: "sidebar-accent", group: "sidebar", kind: "surface", required: true, description: "The sidebar's hover fill.", default: { role: "container" }, block: "sidebar" },
  { name: "sidebar-accent-foreground", group: "sidebar", kind: "text", required: true, description: "Text on `sidebar-accent`.", contrast: fg("sidebar-accent"), default: { role: "text-primary" }, block: "sidebar" },
  {
    name: "sidebar-border",
    group: "sidebar",
    kind: "ui",
    required: true,
    description: "Sidebar hairlines. An alias of `border`.",
    contrast: { against: ["sidebar"], min: UI, pending: "an alias of `border`; see that role's pending decision (#484)." },
    default: { role: "border" },
    block: "sidebar",
  },
  { name: "sidebar-ring", group: "sidebar", kind: "ui", required: true, description: "Focus ring in the sidebar.", contrast: { against: ["sidebar"], min: UI }, default: { role: "ring" }, block: "sidebar" },

  // ── Size: touch targets and control heights (brandMeta) ──
  {
    name: "spacing-touch",
    group: "size",
    kind: "size",
    required: true,
    description: "The default touch target (`h-touch`, `min-h-touch`). brandMeta.accessibility.defaultTouchTarget.",
    default: { px: access("defaultTouchTarget") },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-touch-min",
    group: "size",
    kind: "size",
    required: true,
    description: "The touch floor (`min-h-touch-min`): 48px, fixed — no pack can lower it (owner decision 2026-10-07).",
    default: { px: access("minTouchTarget") },
    fixed: true,
    block: "invariant",
  },
  { name: "spacing-control", group: "size", kind: "size", required: true, description: "Default control height. componentSpecs.button.heights.default.", default: { px: spec("button").heights.default }, floor: true, block: "invariant" },
  { name: "spacing-control-sm", group: "size", kind: "size", required: true, description: "Small control height. componentSpecs.button.heights.sm.", default: { px: spec("button").heights.sm }, floor: true, block: "invariant" },
  { name: "spacing-control-lg", group: "size", kind: "size", required: true, description: "Large control height. componentSpecs.button.heights.lg.", default: { px: spec("button").heights.lg }, floor: true, block: "invariant" },
  { name: "spacing-control-icon", group: "size", kind: "size", required: true, description: "Icon-button size. componentSpecs.button.heights.icon.", default: { px: spec("button").heights.icon }, floor: true, block: "invariant" },
  {
    name: "spacing-control-dense",
    group: "size",
    kind: "size",
    required: true,
    description: "Dense control height for a fine pointer only (`pointer-fine:h-control-dense`); below the touch floor on purpose (#484 §2a).",
    default: { px: 32 },
    block: "invariant",
  },
  { name: "spacing-field", group: "size", kind: "size", required: true, description: "Input height. componentSpecs.input.heights.default.", default: { px: spec("input").heights.default }, floor: true, block: "invariant" },
  { name: "spacing-field-sm", group: "size", kind: "size", required: true, description: "Small input height. componentSpecs.input.heights.sm.", default: { px: spec("input").heights.sm }, floor: true, block: "invariant" },

  // ── Radius (brandMeta.componentSpecs) ──
  {
    name: "radius-control",
    group: "radius",
    kind: "radius",
    required: true,
    description: "Buttons and controls. Mzizi keeps pill (owner decision 2026-10-07); a pack may switch it.",
    default: { px: spec("button").borderRadius },
    block: "invariant",
  },
  { name: "radius-field", group: "radius", kind: "radius", required: true, description: "Inputs. componentSpecs.input.borderRadius.", default: { px: spec("input").borderRadius }, block: "invariant" },
  { name: "radius-badge", group: "radius", kind: "radius", required: true, description: "Badges. componentSpecs.badge.borderRadius.", default: { px: spec("badge").borderRadius }, block: "invariant" },
  { name: "radius-card", group: "radius", kind: "radius", required: true, description: "Cards. componentSpecs.card.borderRadius.", default: { px: spec("card").borderRadius }, block: "invariant" },
  { name: "radius-dialog", group: "radius", kind: "radius", required: true, description: "Dialogs. componentSpecs.dialog.borderRadius.", default: { px: spec("dialog").borderRadius }, block: "invariant" },

  // ── Font (brand.source typography) ──
  { name: "font-body", group: "font", kind: "font", required: true, description: "Body and UI text. `font-sans` is an alias.", default: { font: `"${fontFamily("sans")}", ui-sans-serif, system-ui, sans-serif` }, block: "theme" },
  { name: "font-display", group: "font", kind: "font", required: true, description: "Display and headings. `font-serif` is an alias.", default: { font: `"${fontFamily("serif")}", ui-serif, Georgia, serif` }, block: "theme" },
  { name: "font-code", group: "font", kind: "font", required: true, description: "Code. `font-mono` is an alias.", default: { font: `"${fontFamily("mono")}", ui-monospace, Menlo, monospace` }, block: "theme" },
]

/** Tailwind's own font utilities, kept as aliases of the font roles. */
export const FONT_ALIASES = [
  ["sans", "font-body"],
  ["serif", "font-display"],
  ["mono", "font-code"],
] as const

export function role(name: string): Role {
  const r = ROLES.find((x) => x.name === name)
  if (!r) throw new Error(`no role "${name}" in lib/tokens/roles.source.ts`)
  return r
}

export const isColorKind = (k: RoleKind) => k === "text" || k === "fill" || k === "ui" || k === "surface"

/** The theme key a colour role registers under: `--color-<utility>`. */
export const colorKey = (r: Role) => r.utility ?? r.name

// ─── The folded constants ────────────────────────────────────────────────────
//
// What `scripts/render-globals-css.ts` and `scripts/sync-tokens.ts` used to
// declare a second time. Same names and shapes their emitters use, read from
// canon, so the stylesheet and the platform files cannot disagree with it.

/** `[name, light, dark, usage]` — the legacy status colours, from `semanticColors`. */
export const STATUS: ReadonlyArray<readonly [string, string, string, string]> = LEGACY_STATUS_ROLES.map((r) => {
  const c = semantic(r.name)
  return [r.name, c.lightValue, c.darkValue, c.usage] as const
})

/**
 * The radius ladder, from `brandMeta.radii`, in ladder order. CLAUDE.md §7.5:
 * every radius derives from a 7px unit, giving the ecosystem numbers 7 / 12 /
 * 14 / 17. A `--radius` of 10px or 12px with a `calc()` scale hung off it puts
 * every derived rung off the system.
 */
export const RADIUS: ReadonlyArray<readonly [string, string]> = (["sm", "md", "base", "lg", "xl", "2xl", "full"] as const).map(
  (n) => {
    const v = brandMeta.radii[n]
    if (typeof v !== "string") throw new Error(`brand.source.ts radii has no "${n}"`)
    return [n, v] as const
  }
)

const rem = (px: number) => `${px / 16}rem`

/**
 * Touch targets and control heights, under the names the stylesheet has always
 * declared, from `brandMeta`. `touch-target-sm` (40px) is the one value canon
 * does not hold: a dense secondary action below the floor, never a primary control.
 */
export const SIZING: ReadonlyArray<readonly [string, string, string]> = [
  ["touch-target-lg", `${access("defaultTouchTarget")}px`, "Default touch target — /v1/brand defaultTouchTarget"],
  ["touch-target", `${access("minTouchTarget")}px`, "Minimum touch target — /v1/brand minTouchTarget"],
  ["touch-target-sm", "40px", "Dense secondary actions; below the 48px floor, so not for primary controls"],
  ["h-button-default", rem(spec("button").heights.default), `${spec("button").heights.default}px — componentSpecs.button.heights.default`],
  ["h-button-sm", rem(spec("button").heights.sm), `${spec("button").heights.sm}px — componentSpecs.button.heights.sm`],
  ["h-input", rem(spec("input").heights.default), `${spec("input").heights.default}px — inputs match the default button`],
]

/** The font stacks, by Tailwind alias, for the platform files. */
export const FONTS = { sans: fontFamily("sans"), serif: fontFamily("serif"), mono: fontFamily("mono") } as const
