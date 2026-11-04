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
 *   - MINIMUMS (owner decision 2026-11-02, #399), enforced as well as the APCA bars, from `WCAG_BODY`,
 *     `WCAG_NON_BODY` and `WCAG_UI` below: body text >= WCAG 7:1, `nonBody` text >= 4.5:1, ui >= 3:1
 *   - `kind: text` roles: |APCA Lc| >= 75 on `base` and `surface`, both themes
 *   - a `kind: text` role whose rule names `nonBody` (text that is never body copy:
 *     captions, timestamps, metadata): >= 60, APCA's minimum for non-body text; `nonBody`
 *     implies that bar, so the rule sets no `min`
 *   - a foreground on its fill: >= 75
 *   - `kind: ui` roles: >= 30 on `base` and `surface`; a rule may add a WCAG 2.2 ratio
 *     (`wcag`), measured as well: `border-control` carries 3:1 for WCAG 1.4.11
 *   - a `kind: ui` role marked `decorative` is exempt, and the gate lists it: a soft
 *     hairline between regions that is never the only cue. An edge that identifies a
 *     control is `border-control`, held to Lc 30 and 3:1 on every surface a control can
 *     sit on (owner decision 2026-10-20, #484). `input`, the edge controls draw today, is
 *     pending until slice 4 moves them
 * The bars are `BODY`, `NON_BODY` and `UI` below; the gate reads them from here.
 *   - every size marked `floor` >= `spacing-touch-min` (the 49px Bundu hit area, a floor no pack can lower), and the
 *     smallest size a desktop density layer draws >= `BUNDU_FLOOR.visibleControlMinPx` (28px)
 *   - a `derive` that no walk can satisfy is a violation naming the roles, never #000/#FFF
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
 * structural, not brand decisions. The scale itself stays structural; its MINIMUMS are not: the spacing floor
 * (`BUNDU_FLOOR.spacing`: inset 14px, gaps 7px, body leading 1.5) is an invariant no pack can lower, registered
 * as `--inset-floor`, `--gap-floor` and `--leading-floor` and as the fixed size roles `spacing-inset-floor` and
 * `spacing-gap-floor` (#617).
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
  /** A rung of the radius ladder (`brandMeta.radii`): declared as `var(--r-<rung>)`, so it follows the rung. */
  | { radius: string }
  /** A font stack. */
  | { font: string }

export type ThemedValue = RoleValue | { light: RoleValue; dark: RoleValue }

/** What every measured rule carries. */
interface MeasuredBase {
  /** Roles the value is measured on, as text or UI over that background. */
  against: readonly string[]
  /**
   * Also a minimum WCAG 2.2 contrast ratio, where a WCAG criterion applies as well as the
   * APCA bar: `border-control` carries 3 for WCAG 1.4.11 (non-text contrast, 3:1).
   */
  wcag?: number
  /** Set only where the default misses its bar and the fix is an owner decision. */
  pending?: string
  /**
   * A named, listed exception to the WCAG text minimum (`wcagFloor()`), never silent: this rule's WCAG bar is
   * `min` instead, for `reason`. The APCA bar still applies in full. The gate prints every one and
   * `__tests__/tokens-wcag-minimums.test.ts` pins the exact set, so it cannot grow quietly.
   */
  wcagException?: { min: number; reason: string }
}

/** A rule that measures the role. `contrastMin()` reads its bar. */
export type MeasuredRule =
  | (MeasuredBase & {
      /** Minimum |APCA Lc|. */
      min: number
      nonBody?: undefined
    })
  | (MeasuredBase & {
      /**
       * Text only: why this text is never body copy. It implies the bar: Lc 60 (`NON_BODY`,
       * APCA's minimum for non-body text) instead of 75. An owner decision, pinned by the role tests.
       */
      nonBody: string
      min?: undefined
    })

export type ContrastRule =
  | MeasuredRule
  /** Exempt from every bar, with the reason (text over imagery, for example). */
  | { exempt: string }
  /**
   * A ui role that only decorates: exempt from the Lc 30 ui bar, and listed by the gate.
   * The reason says why it is never the only cue. Pinned by the role tests.
   */
  | { decorative: string }

export type RoleGroup =
  | "identity"
  | "surface"
  | "text"
  | "shadcn"
  | "sidebar"
  | "status"
  | "status-legacy"
  | "lifecycle"
  | "assurance"
  | "attestation"
  | "tier"
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
  /** size: registered with Tailwind as its own literal value, which no pack can override. */
  fixed?: true
  /**
   * size: must not be smaller than `spacing-touch-min`. The stylesheet registers
   * it as `max(var(--size-<name>), <floor>)`, so a pack that lowers the bare var
   * still paints the floor, and the gate fails a default under it.
   */
  floor?: true
  block: RoleBlock
}

/**
 * THE BUNDU FLOOR (owner rulings, 2026-11-02): the hard minimums Bundu stands behind, as high as possible, because
 * Bundu sets the standard for outdoor reading and for people who find technology hard (older users, African and
 * emerging markets). ONE definition: the token generators, the contract runner, the Rust evaluator and every
 * test read these numbers, and `__tests__/bundu-floor.test.ts` fails when any default breaks one.
 *
 * Where each number comes from (The Bundu Order draws on biblical mathematical patterns and prime numbers;
 * owner, 2026-11-02):
 *   - `unitPx` 7: the radius unit (`brand.source.ts`, `--radius-unit`); the radii are 4/7/12/14/17 and a pill.
 *   - `bodyPx` 17: body text on every device, desktop included. It is Apple's iOS default body size, and a prime.
 *   - `captionPx` 14: captions, metadata and secondary labels; 2 x 7. Nothing readable is smaller.
 *   - `hitAreaPx` 49: every interactive control keeps a hit region this size on every device, desktop included;
 *     7 x 7, above Apple's 44 pt. A desktop control may DRAW smaller (`visibleControlMinPx` and up) but keeps the
 *     hit region through padding or the `hit-area` pseudo-element (see `densityLayer()`).
 *   - `visibleControlMinPx` 28: the smallest a control is DRAWN, at desktop density; 4 x 7 (Apple macOS default 28 pt).
 *   - `spacing`: the SPACING FLOOR (owner, 2026-11-04, #617): minimums nothing can go under, even a component that
 *     sets no padding at all. All on the 7px unit. `insetPx` 14 (2 x 7): padding between text and the edge of its
 *     container (a control's label on the inline axis; a card, panel, dialog, alert or popover on both axes; a
 *     control's block axis is held by its height floors instead). `controlGapPx` 7: the gap between adjacent
 *     interactive controls, visible edge to visible edge (hit regions may touch, never overlap).
 *     `labelGapPx` 7: a label and its field. `itemGapPx` 7: sibling items of a list, grid, stack or toolbar.
 *     `leadingBody` 1.5: body line height (WCAG 1.4.12). Enforced as defaults in the base layer of the stylesheet
 *     (`--inset-floor`, `--gap-floor`, `--leading-floor`) and as tests on every explicit value.
 *   - `contrast`: WCAG 2 ratios (#610, owner 2026-11-02): body text 7:1, non-body text 4.5:1, UI parts 3:1.
 *   - `apca`: the APCA Lc bars that stand beside them.
 */
export const BUNDU_FLOOR = {
  unitPx: 7,
  bodyPx: 17,
  captionPx: 14,
  hitAreaPx: 49,
  visibleControlMinPx: 28,
  spacing: { insetPx: 14, controlGapPx: 7, labelGapPx: 7, itemGapPx: 7, leadingBody: 1.5 },
  contrast: { body: 7, nonBody: 4.5, ui: 3 },
  apca: { body: 75, nonBody: 60, ui: 30 },
} as const

/** APCA Lc 75: body text, and a foreground on its fill. The gate's text floor. */
export const BODY = BUNDU_FLOOR.apca.body
/** APCA's minimum for non-body text: captions, timestamps, metadata (owner decision 2026-10-20, #484). */
export const NON_BODY = BUNDU_FLOOR.apca.nonBody
/** APCA Lc 30: the parts of a control or focus indicator a user has to see. The gate's ui floor. */
export const UI = BUNDU_FLOOR.apca.ui
/**
 * WCAG 2 contrast MINIMUMS, enforced next to the APCA bars (owner decision 2026-11-02, #399: "adopt a WCAG 7:1
 * floor for body text. We should have minimums set"). One definition; the gate, `textRamp()`, the derive walks
 * and the tests all read these.
 */
/** WCAG 2 ratio 7:1 (the AAA level of 1.4.6): body text, and a foreground on its fill. */
export const WCAG_BODY = BUNDU_FLOOR.contrast.body
/** WCAG 2 ratio 4.5:1 (1.4.3): non-body text, the `nonBody` rule: captions, timestamps, metadata. */
export const WCAG_NON_BODY = BUNDU_FLOOR.contrast.nonBody
/** WCAG 2 ratio 3:1 (1.4.11, non-text contrast): the `UI` rule, focus rings and control edges. */
export const WCAG_UI = BUNDU_FLOOR.contrast.ui
const ON_PAGE = ["base", "surface"] as const

/**
 * Every surface a control can sit on: the neutral ladder from `pitch` to `raised`, the
 * inset `muted` fill, the brand `wash`, and the shadcn and sidebar aliases of those
 * (`background`, `card`, `popover`, `sidebar`), which a pack can remap on their own. Not here:
 * `scrim` (translucent), the hover and selected fills (`accent`, `sidebar-accent`), the status
 * and destructive containers (an alert's fill, not a form's) and `input` (a control's own fill).
 */
export const CONTROL_SURFACES = [
  "pitch",
  "void",
  "base",
  "surface",
  "container",
  "overlay",
  "raised",
  "muted",
  "wash",
  "background",
  "card",
  "popover",
  "sidebar",
] as const

/** The floor the gate holds a kind to: 75 for text (60 for `nonBody` text), 30 for ui, none otherwise. */
export function contrastFloor(kind: RoleKind, rule?: ContrastRule): number {
  if (kind === "text") return rule && "against" in rule && rule.nonBody ? NON_BODY : BODY
  return kind === "ui" ? UI : 0
}

/** The WCAG 2 ratio floor the gate holds a kind to: 7 for body text, 4.5 for `nonBody` text, 3 for ui, none otherwise. */
export function wcagFloor(kind: RoleKind, rule?: ContrastRule): number {
  if (kind === "text") return rule && "against" in rule && rule.nonBody ? WCAG_NON_BODY : WCAG_BODY
  return kind === "ui" ? WCAG_UI : 0
}

/** The WCAG ratio a measured rule asks for: its own `wcag` where that is higher, else the kind's floor. 0 = none. */
export function wcagMin(kind: RoleKind, rule: MeasuredRule): number {
  if (rule.wcagException) return Math.max(rule.wcag ?? 0, rule.wcagException.min)
  return Math.max(rule.wcag ?? 0, wcagFloor(kind, rule))
}

/** The |Lc| a measured rule asks for: its `min`, or for `nonBody` text, `NON_BODY`. */
export function contrastMin(kind: RoleKind, rule: MeasuredRule): number {
  return rule.min ?? contrastFloor(kind, rule)
}

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
  // canon (`/v1/brand`) carries the number too; the Bundu floor is the one source and canon must agree.
  if (v !== BUNDU_FLOOR.hitAreaPx) {
    throw new Error(`brand.source.ts accessibility.${key} is ${v}px, but BUNDU_FLOOR.hitAreaPx is ${BUNDU_FLOOR.hitAreaPx}px`)
  }
  return v
}

/** Canon (`/v1/brand`) carries the spacing floor too; `BUNDU_FLOOR.spacing` is the one source and canon must agree. */
function spacingFloorInCanon(): void {
  const a = brandMeta.accessibility
  const want: Record<string, number> = {
    minInset: BUNDU_FLOOR.spacing.insetPx,
    minControlGap: BUNDU_FLOOR.spacing.controlGapPx,
    minLabelGap: BUNDU_FLOOR.spacing.labelGapPx,
    minItemGap: BUNDU_FLOOR.spacing.itemGapPx,
    minBodyLeading: BUNDU_FLOOR.spacing.leadingBody,
  }
  for (const [k, v] of Object.entries(want))
    if (a[k] !== v) throw new Error(`brand.source.ts accessibility.${k} is ${String(a[k])}, but BUNDU_FLOOR.spacing says ${v}`)
}
spacingFloorInCanon()

/**
 * A radius role's default: the rung of the radius ladder it follows, so a
 * consumer that moves `--r-full` or `--r-base` moves the role too. The rung is
 * named here and checked against the component spec it stands for, so canon
 * stays the source and a spec that moves off its rung fails loudly.
 */
function rung(specName: string, name: string): RoleValue {
  const v = brandMeta.radii[name]
  if (typeof v !== "string") throw new Error(`brand.source.ts radii has no "${name}"`)
  const want = spec(specName).borderRadius
  if (parseFloat(v) !== want) {
    throw new Error(`componentSpecs.${specName}.borderRadius is ${want}px, but its radius rung "${name}" is ${v}`)
  }
  return { radius: name }
}

function fontFamily(name: "sans" | "serif" | "mono"): string {
  const row = typography.find((t) => t.entryType === "font" && t.name === name)
  if (!row?.family) throw new Error(`brand.source.ts typography has no font "${name}"`)
  return row.family
}

/**
 * Canon's type scale (`/v1/brand` typography, `design-system/tokens.json`) is held to the Bundu floor at load, like
 * `access()` holds the hit area: Body and every heading and display step >= `bodyPx`, Body Small, Caption and Code
 * >= `captionPx`. A canon row under its floor fails the build rather than serving a stale size.
 */
for (const t of typography) {
  if (t.entryType !== "scale" || typeof t.sizePx !== "number") continue
  const floor = ["Body Small", "Caption", "Code"].includes(t.name) ? BUNDU_FLOOR.captionPx : BUNDU_FLOOR.bodyPx
  if (t.sizePx < floor) {
    throw new Error(`brand.source.ts typography "${t.name}" is ${t.sizePx}px, under the Bundu floor of ${floor}px`)
  }
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

// ─── Verification: assurance levels and attestations ────────────────────────

/**
 * The Bundu trust model, as nyuchi/nyuchi-api `gateway/lib/assurance.py` defines it: two
 * independent things, deliberately not one number.
 *
 *   - ASSURANCE LEVELS are ordered (0 none, 1 otp, 2 documented, 3 government, 4 licensed):
 *     how strongly an identity is proven. `>=` is meaningful.
 *   - ATTESTATIONS are unordered and held alongside the level (community, business, domain):
 *     who vouches for the subject. A tuck shop is level 1 + community; a registered firm is
 *     level 3 + business; neither outranks the other.
 *
 * Community is NOT a rung. The legacy ladder put it at 1, below otp, which ranked a trader
 * vouched for by their whole street below anyone who clicked a link in an email. It is a
 * parallel route to trust, so it is an attestation here and never sits on the level scale.
 *
 * Mineral per part (each is a role contract, seven-minerals.mdx):
 *   - none → the neutral grey (`status-neutral`): nothing is proven, so nothing is claimed.
 *   - otp → cobalt, government → gold, licensed → tanzanite, community → terracotta: the
 *     owner's ladder of 2026-10-24 (#543), unchanged.
 *   - documented → sodalite (Intelligence: a document was examined and reasoned about). It
 *     sits between otp (cobalt) and government (gold), and sodalite is cobalt's deep-earth
 *     neighbour, so the first two levels read as one blue family growing deeper.
 *   - business → malachite (Growth: an enterprise that is registered and building). Gold
 *     (commerce) is government's, and a registration check is not a payment.
 *   - domain → copper (Stewardship: control of a name on the commons, held and kept).
 * The three new families are the only minerals the ladder did not already use, so no part
 * shares a mineral with another; heritage tones stay environment, not contract.
 */
export const ASSURANCE_LEVELS = [
  ["none", "Unverified", null],
  ["otp", "Contact Verified", "cobalt"],
  ["documented", "Documents Checked", "sodalite"],
  ["government", "Government Verified", "gold"],
  ["licensed", "Licensed Professional", "tanzanite"],
] as const

/** The attestations, unordered: each one is held or not, alongside the level. */
export const ATTESTATIONS = [
  ["community", "Community Vouched", "terracotta"],
  ["business", "Registered Business", "malachite"],
  ["domain", "Domain Verified", "copper"],
] as const

/**
 * The legacy ladder (`bundu.verificationTier`, 0 unverified … 4 licensed) and the part of the
 * new model each `--tier-*` role now aliases. `legacy_tier()` in assurance.py is the derived
 * projection; these names stay until every reader has moved (Kweli, `@bundu/ui`).
 */
export const TIER_ALIASES = [
  ["unverified", "assurance-none"],
  ["community", "attestation-community"],
  ["otp", "assurance-otp"],
  ["government", "assurance-government"],
  ["licensed", "assurance-licensed"],
] as const

/** Kept for existing readers: the legacy tier → palette family it resolves to. */
export const TIER_FAMILIES = [
  ["community", "terracotta"],
  ["otp", "cobalt"],
  ["government", "gold"],
  ["licensed", "tanzanite"],
] as const

/** The five legacy tiers in ladder order, with the label each one carries. */
export const TIERS = [
  ["unverified", "Unverified"],
  ["community", "Community Verified"],
  ["otp", "Contact Verified"],
  ["government", "Government Verified"],
  ["licensed", "Licensed Professional"],
] as const

/** The four parts every level, attestation and tier carries: the same shape as a status tone. */
function trustRoles(
  name: string,
  group: "assurance" | "attestation",
  what: string,
  values: Record<"fill" | "container" | "on" | "text", ThemedValue>
): Role[] {
  return [
    {
      name,
      group,
      kind: "ui",
      required: true,
      description: `${what} — the part itself: badge icons, meter bars, tinted fills (\`bg-${name}/15\`).`,
      contrast: { against: ON_PAGE, min: UI },
      default: values.fill,
      // Sodalite's dark base (#3D5AFE) measures Lc 26.9 on the dark page, under the ui bar:
      // the fill walks to clear it, the way the -aa tier is made, and only where it misses.
      derive: "text",
      block: "roles",
    },
    {
      name: `${name}-container`,
      group,
      kind: "surface",
      required: true,
      description: `${what} — a soft fill behind its content (a chip or banner).`,
      default: values.container,
      block: "roles",
    },
    {
      name: `${name}-on-container`,
      group,
      kind: "text",
      required: true,
      description: `${what} — text and icons on \`${name}-container\`.`,
      contrast: { against: [`${name}-container`], min: BODY },
      default: values.on,
      derive: "text",
      block: "roles",
    },
    {
      name: `${name}-text`,
      group,
      kind: "text",
      required: true,
      description: `${what} — its name as text on the page.`,
      contrast: { against: ON_PAGE, min: BODY },
      default: values.text,
      derive: "text",
      block: "roles",
    },
  ]
}

const familyValues = (family: string) => ({
  fill: fam(family, "base"),
  container: fam(family, "container"),
  on: fam(family, "on-container"),
  text: fam(family, "text"),
})

const ASSURANCE_ROLES: Role[] = ASSURANCE_LEVELS.flatMap(([level, label, family], i) =>
  trustRoles(
    `assurance-${level}`,
    "assurance",
    `Assurance level ${i} \`${level}\` ("${label}", ${family ?? "the neutral grey, `status-neutral`,"} in the Mzizi pack)`,
    family
      ? familyValues(family)
      : {
          fill: { role: "status-neutral" },
          container: { role: "status-neutral-container" },
          on: { role: "status-neutral-on-container" },
          text: { role: "status-neutral-text" },
        }
  )
)

const ATTESTATION_ROLES: Role[] = ATTESTATIONS.flatMap(([type, label, family]) =>
  trustRoles(`attestation-${type}`, "attestation", `Attestation \`${type}\` ("${label}", ${family} in the Mzizi pack)`, familyValues(family))
)

/** `--tier-*`: aliases of the new roles, so a pack that remaps a level moves its legacy tier too. */
const TIER_ROLES: Role[] = TIER_ALIASES.flatMap(([tier, target]) =>
  ["", "-container", "-on-container", "-text"].map((suffix): Role => {
    const of = [...ASSURANCE_ROLES, ...ATTESTATION_ROLES].find((r) => r.name === `${target}${suffix}`)!
    const contrast: ContrastRule | undefined =
      suffix === "-on-container" ? { against: [`tier-${tier}-container`], min: BODY } : of.contrast
    return {
      name: `tier-${tier}${suffix}`,
      group: "tier",
      kind: of.kind,
      required: true,
      description: `Legacy verification tier \`${tier}\` (\`bundu.verificationTier\`): an alias of \`${target}${suffix}\`. Read the assurance and attestation roles in new code.`,
      contrast,
      default: { role: `${target}${suffix}` },
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

/**
 * The label on a brand's solid action fill (`primary` and what follows it) holds WCAG 4.5:1 (1.4.3), not the 7:1 body
 * minimum. These are button labels, not body copy, and the fill is per-brand: `--primary` resolves through each
 * `[data-brand]` block to that family's `-aa` tier, which is by definition the 4.5:1 fill under white, so 7:1 would
 * darken the action colour of all seven brands, a brand decision the owner has not made. APCA Lc 75 still applies.
 * `destructive-foreground` joins them (pending owner confirmation, 2026-11-02): the destructive fill stays canon #B3261E, whose
 * white label measures 6.54:1 (Lc 86), so one semantic keeps one red.
 */
const ON_BRAND_FILL_EXCEPTION = {
  min: 4.5,
  reason:
    "a label on the brand's solid action fill, not body copy; the fill is each brand's -aa tier (4.5:1 under white) " +
    "and 7:1 would darken every brand's action colour, an owner decision",
} as const
const fgOnBrandFill = (against: string): ContrastRule => ({
  against: [against],
  min: BODY,
  wcagException: ON_BRAND_FILL_EXCEPTION,
})
const DESTRUCTIVE_FILL_EXCEPTION = {
  min: 4.5,
  reason:
    "a label on the destructive action fill, not body copy; the fill is canon error #B3261E (6.54:1 under white, Lc 86), " +
    "and 7:1 would move it to #AA241D, a second red beside canon error; pending owner confirmation, 2026-11-02",
} as const
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
    contrast: fgOnBrandFill("primary"),
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
    contrast: fgOnBrandFill("brand-accent"),
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
    contrast: fgOnBrandFill("app-accent"),
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
  /*
   * The QR plate (#543). A QR code reads most reliably as dark modules on a light ground with
   * a light quiet zone, and some scanners cannot read an inverted (light-on-dark) code. So the
   * plate stays light in EVERY theme, and its ink stays dark. The values are the canon's own
   * white and ink, the pair `onWhiteOrInk` already uses, fixed rather than themed.
   */
  {
    name: "surface-qr",
    group: "surface",
    kind: "surface",
    required: true,
    description: "The plate behind a QR code: white in every theme, so the code is never inverted.",
    default: { literal: "#FFFFFF" },
    block: "roles",
  },
  {
    name: "on-surface-qr",
    group: "surface",
    kind: "text",
    required: true,
    description: "A QR code's modules on `surface-qr`: the canon's ink in every theme.",
    contrast: fg("surface-qr"),
    default: { literal: "#0E0D0C" },
    block: "roles",
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
    description:
      "Placeholders, captions, timestamps and metadata that are not body copy. APCA Lc 60 (APCA's minimum for non-body " +
      "text) and WCAG 4.5:1 (1.4.3) on `base` and `surface`, the surfaces `text-secondary` is held to; lighter than " +
      "`text-secondary` (Lc 75), which body copy uses.",
    contrast: {
      against: ON_PAGE,
      nonBody:
        "a sub-body tier by design: placeholders, captions, timestamps and metadata, never body copy. " +
        "Its own floor of Lc 60, so it stays lighter than text-secondary (owner decision 2026-10-20, #484).",
      // Owner decision 2026-10-20 (#484): "Add 4.5:1 too". `textRamp()` walks the tier to it.
      wcag: 4.5,
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
  ...ASSURANCE_ROLES,
  ...ATTESTATION_ROLES,
  ...TIER_ROLES,

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
    contrast: { against: ["destructive"], min: BODY, wcagException: DESTRUCTIVE_FILL_EXCEPTION },
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
  {
    /*
     * `--status-error`: the name N1's `statusTokens` gives the error status and
     * that components use (`text-status-error`, `var(--status-error, …)`) beside
     * `--status-success` / `--status-warning`. It was defined only in the site's
     * own stylesheet, so a consumer of the distributed tokens fell through to each
     * component's hex fallback (#543). An alias of `destructive`: one decision for
     * "error" (red, never the terracotta `status-danger`).
     */
    name: "status-error",
    group: "destructive",
    kind: "ui",
    required: true,
    description: "The error status (`text-status-error`, `fill-status-error`): an alias of `destructive`, red, never the terracotta `status-danger`.",
    contrast: { against: ON_PAGE, min: UI },
    default: { role: "destructive" },
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
    description:
      "Decorative hairlines between regions: cards, dividers, tables. Never the only cue, and not for a control's edge: " +
      "that is `border-control` (controls still draw theirs with `border-input` until slice 4 of #484 moves them).",
    contrast: {
      decorative:
        "a soft hairline (#E7E5E0 / #2A2927, under Lc 15 on base) that is never the only cue: a card also steps the " +
        "surface, and a divider or table rule separates content its spacing already groups. The edge that identifies a " +
        "control is meant to be border-control (Lc 30 and 3:1); controls draw it with border-input until slice 4, and the " +
        "gate reports input pending until then (owner decision 2026-10-20, #484).",
    },
    default: { semantic: "border" },
    block: "disputed",
  },
  {
    name: "border-control",
    group: "shadcn",
    kind: "ui",
    required: true,
    description:
      "The edge that identifies a control: inputs, selects, textareas, checkboxes, radios, switch tracks. " +
      "APCA Lc 30 and WCAG 3:1 (1.4.11, non-text contrast) on every surface a control can sit on (`CONTROL_SURFACES`): " +
      "the `border` hairline walked toward ink in light and toward white in dark until it clears both. No component " +
      "uses it yet; slice 4 of #484 moves the controls onto it from `border-input`.",
    // Lc 30 alone is 1.8:1 in light, under 1.4.11's 3:1, so the role carries both bars.
    contrast: { against: CONTROL_SURFACES, min: UI, wcag: 3 },
    // The role, not the brand row: a pack that moves the hairline moves where the walk starts.
    default: { role: "border" },
    derive: "text",
    block: "roles",
  },
  {
    name: "input",
    group: "shadcn",
    kind: "surface",
    required: true,
    description: semantic("input").usage,
    // Measured in its use as an edge: every control draws its border with `border-input` today.
    contrast: {
      against: CONTROL_SURFACES,
      min: UI,
      wcag: 3,
      pending:
        "controls draw their edge with border-input, and --input is the control's own fill (#FFFFFF / #100F0E, about Lc 0 " +
        "on base). Slice 4 of #484 moves inputs, selects, textareas, checkboxes, radios, input-otp, combobox, toggle and the " +
        "switch track onto border-control; until then the control edge is pending, not passing.",
    },
    default: { semantic: "input" },
    block: "disputed",
  },

  // ── Sidebar ──
  { name: "sidebar", group: "sidebar", kind: "surface", required: true, description: "Sidebar surface.", default: { role: "surface" }, block: "sidebar" },
  { name: "sidebar-foreground", group: "sidebar", kind: "text", required: true, description: "Text on `sidebar`.", contrast: fg("sidebar"), default: { role: "text-primary" }, block: "sidebar" },
  { name: "sidebar-primary", group: "sidebar", kind: "fill", required: true, description: "The sidebar's active item fill.", default: { role: "primary" }, block: "sidebar" },
  { name: "sidebar-primary-foreground", group: "sidebar", kind: "text", required: true, description: "Text on `sidebar-primary`.", contrast: fgOnBrandFill("sidebar-primary"), default: { role: "primary-foreground" }, block: "sidebar" },
  { name: "sidebar-accent", group: "sidebar", kind: "surface", required: true, description: "The sidebar's hover fill.", default: { role: "container" }, block: "sidebar" },
  { name: "sidebar-accent-foreground", group: "sidebar", kind: "text", required: true, description: "Text on `sidebar-accent`.", contrast: fg("sidebar-accent"), default: { role: "text-primary" }, block: "sidebar" },
  {
    name: "sidebar-border",
    group: "sidebar",
    kind: "ui",
    required: true,
    description: "Decorative sidebar hairlines. An alias of `border`; a control's edge is `border-control` (from slice 4 of #484).",
    contrast: {
      decorative:
        "an alias of border, the sidebar's dividers: never the only cue. A control's edge in the sidebar is meant to be " +
        "border-control, which is measured on sidebar (#484).",
    },
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
    description: "The hit-area floor (`min-h-touch-min`): 49px (`BUNDU_FLOOR.hitAreaPx`, 7 x 7, above Apple HIG Buttons' 44x44 pt) on every device, desktop included, registered as `--target-floor`. Density never lowers it: a desktop control may be drawn smaller but keeps this hit region (owner ruling 2026-11-02, replacing the 24px desktop floor of 2026-11-01 and the 44px of 2026-11-01). No brand pack can move it.",
    default: { px: access("minTouchTarget") },
    fixed: true,
    block: "invariant",
  },
  {
    name: "spacing-inset-floor",
    group: "size",
    kind: "size",
    required: true,
    description: "The inset floor (`p-inset-floor`, `px-inset-floor`): 14px (`BUNDU_FLOOR.spacing.insetPx`, 2 x 7), the least padding between text and the edge of its container, registered as `--inset-floor`. No component, density layer or brand pack can lower it (owner 2026-11-04, #617).",
    default: { px: BUNDU_FLOOR.spacing.insetPx },
    fixed: true,
    block: "invariant",
  },
  {
    name: "spacing-gap-floor",
    group: "size",
    kind: "size",
    required: true,
    description: "The gap floor (`gap-gap-floor`, `p-gap-floor`): 7px (`BUNDU_FLOOR.spacing.controlGapPx`, the unit), the least gap between adjacent controls, a label and its field, and sibling items, registered as `--gap-floor`. No component, density layer or brand pack can lower it (owner 2026-11-04, #617).",
    default: { px: BUNDU_FLOOR.spacing.controlGapPx },
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
    description: "Dense control height for a fine pointer only (`pointer-fine:h-control-dense`); drawn below the hit-area floor on purpose (#484 §2a), its 49px hit region kept by the `hit-area` pseudo-element; 28px under desktop density.",
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
    default: rung("button", "full"),
    block: "invariant",
  },
  { name: "radius-field", group: "radius", kind: "radius", required: true, description: "Inputs. componentSpecs.input.borderRadius.", default: rung("input", "full"), block: "invariant" },
  { name: "radius-badge", group: "radius", kind: "radius", required: true, description: "Badges. componentSpecs.badge.borderRadius.", default: rung("badge", "full"), block: "invariant" },
  { name: "radius-card", group: "radius", kind: "radius", required: true, description: "Cards. componentSpecs.card.borderRadius.", default: rung("card", "base"), block: "invariant" },
  { name: "radius-dialog", group: "radius", kind: "radius", required: true, description: "Dialogs. componentSpecs.dialog.borderRadius.", default: rung("dialog", "xl"), block: "invariant" },

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
 * every radius derives from a 7px unit, giving the ecosystem numbers 4 / 7 /
 * 12 / 14 / 17 (xs is the unit less 3, for the smallest marks: swatches, kbd). A `--radius` of 10px or 12px with a `calc()` scale hung off it puts
 * every derived rung off the system.
 */
export const RADIUS: ReadonlyArray<readonly [string, string]> = (["xs", "sm", "md", "base", "lg", "xl", "2xl", "full"] as const).map(
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
 * does not hold: a dense secondary action drawn below the floor, never a primary control.
 */
export const SIZING: ReadonlyArray<readonly [string, string, string]> = [
  ["touch-target-lg", `${access("defaultTouchTarget")}px`, "Default touch target — /v1/brand defaultTouchTarget"],
  ["touch-target", `${access("minTouchTarget")}px`, "Minimum touch target — /v1/brand minTouchTarget"],
  ["touch-target-sm", "40px", "Dense secondary actions: drawn at 40px, the 49px hit region kept by the hit-area pseudo-element; not for primary controls"],
  ["h-button-default", rem(spec("button").heights.default), `${spec("button").heights.default}px — componentSpecs.button.heights.default`],
  ["h-button-sm", rem(spec("button").heights.sm), `${spec("button").heights.sm}px — componentSpecs.button.heights.sm`],
  ["h-input", rem(spec("input").heights.default), `${spec("input").heights.default}px — inputs match the default button`],
]

/** The font stacks, by Tailwind alias, for the platform files. */
export const FONTS = { sans: fontFamily("sans"), serif: fontFamily("serif"), mono: fontFamily("mono") } as const


// ─── Density (owner decision 2026-11-01) ─────────────────────────────────────
//
// ONE place for "sizes step down as screens grow". Components never branch on
// screen size; `scripts/render-globals-css.ts` emits these as media queries on
// the size variables, and `__tests__/density.test.ts` holds them to the floors.
//
// Density is about VISUAL SIZE only. It is never read as a network-quality
// guess: laptops and iPads are usually on wifi.

/**
 * The hit region every interactive control keeps, on every device including desktop (the Bundu floor, owner ruling
 * 2026-11-02): `BUNDU_FLOOR.hitAreaPx`, 49px. It replaces Apple HIG Buttons' 44 pt on a coarse pointer AND the
 * 24px WCAG 2.2 SC 2.5.8 floor registry 4.21.0 set for a fine pointer. Kept under the old name for importers.
 */
export const FLOOR_COARSE_PX = BUNDU_FLOOR.hitAreaPx
/** The smallest a control is DRAWN under desktop density, px. Its hit region is still FLOOR_COARSE_PX. */
export const FLOOR_VISIBLE_FINE_PX = BUNDU_FLOOR.visibleControlMinPx
/** The type steps that are secondary text (floor `captionPx`, 14px); every other step is body or a heading (floor `bodyPx`, 17px). */
export const CAPTION_STEPS: readonly string[] = ["small", "caption", "code"]
/** Body text never below this on any device, px (17: Apple's iOS default body size). */
export const BODY_FLOOR_PX = BUNDU_FLOOR.bodyPx
/** Captions, metadata and secondary labels never below this, px. */
export const CAPTION_FLOOR_PX = BUNDU_FLOOR.captionPx

/** The fine-pointer, hover-capable, wide-viewport media query. Tablets (coarse pointer) never match, nor does a touchscreen laptop, which also has a coarse pointer (`any-pointer: coarse`). */
export const DENSITY_DESKTOP_QUERY = "(min-width: 64rem) and (pointer: fine) and (hover: hover) and (not (any-pointer: coarse))"
/** Type steps down at tablet width on any pointer. */
export const DENSITY_TABLET_QUERY = "(min-width: 48rem)"

/**
 * Size roles under desktop density, in px: what a control is DRAWN at. Every one must be >= FLOOR_VISIBLE_FINE_PX,
 * and every control keeps a FLOOR_COARSE_PX hit region through the `hit-area` rule (`densityLayer()`). The field
 * roles do not step down: a native input or select cannot carry a pseudo-element, so its box IS its hit region.
 */
export const DESKTOP_SIZES: Readonly<Record<string, number>> = {
  "spacing-touch": 36,
  "spacing-control": 36,
  "spacing-control-sm": 32,
  "spacing-control-lg": 40,
  "spacing-control-icon": 36,
  "spacing-control-dense": 28,
  "spacing-field": 49,
  "spacing-field-sm": 49,
}

/**
 * The sizes consumers pinned before 2026-11-01, restored by
 * `:root[data-mzizi-sizes="legacy"]`. The migration table in the docs is generated from this.
 */
export const LEGACY_SIZES: Readonly<Record<string, number>> = {
  "spacing-touch": 56,
  "spacing-control": 56,
  "spacing-control-sm": 48,
  "spacing-control-lg": 56,
  "spacing-control-icon": 48,
  "spacing-control-dense": 32,
  "spacing-field": 56,
  "spacing-field-sm": 48,
}
/** Size roles whose box is their hit region (native form fields: no pseudo-element): they keep the hit area drawn. */
export const NATIVE_HIT_ROLES: readonly string[] = ["spacing-field", "spacing-field-sm"]
/** The legacy touch floor, px. */
export const LEGACY_FLOOR_PX = 48
