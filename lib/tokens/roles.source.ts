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
 *   - every size marked `floor` >= `spacing-touch-min` (the 45px Bundu hit area, a floor no pack can lower), and the
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
 * (`BUNDU_FLOOR.spacing`: a floor per spacing layer, owner ruling 2026-11-19; body leading 1.5) is an invariant no
 * pack can lower. The layer values are the fixed size roles `spacing-control-x` … `spacing-section`, declared as
 * `--space-<name>`; the fallback floors for a component with no known layer stay registered as `--inset-floor` and `--gap-floor` (#617), and the
 * fixed size roles `spacing-inset-floor` and `spacing-gap-floor` alias those two.
 *
 * Values are READ from `brand.source.ts` and `palette.source.ts`, never retyped:
 * this file replaced the second copies of the status colours, the radius ladder
 * and the touch and control heights that `scripts/render-globals-css.ts` and
 * `scripts/sync-tokens.ts` used to carry as constants.
 *
 *   pnpm tokens:sync     emit every role to the stylesheet and the platform files
 *   pnpm tokens:verify   CI gate: drift, plus the contrast gate
 */

import {
  backgroundColors,
  brandMeta,
  ecosystem,
  semanticColors,
  typography,
} from "./brand.source";
import { minerals } from "./palette.source";

export type RoleKind =
  "text" | "fill" | "ui" | "surface" | "size" | "radius" | "font";

/** A palette family tier, as `scripts/render-globals-css.ts` emits it. */
export type FamilyTier = "base" | "container" | "on-container" | "aa" | "text";

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
  | { font: string };

export type ThemedValue = RoleValue | { light: RoleValue; dark: RoleValue };

/** What every measured rule carries. */
interface MeasuredBase {
  /** Roles the value is measured on, as text or UI over that background. */
  against: readonly string[];
  /**
   * Also a minimum WCAG 2.2 contrast ratio, where a WCAG criterion applies as well as the
   * APCA bar: `border-control` carries 3 for WCAG 1.4.11 (non-text contrast, 3:1).
   */
  wcag?: number;
  /** Set only where the default misses its bar and the fix is an owner decision. */
  pending?: string;
  /**
   * A named, listed exception to the WCAG text minimum (`wcagFloor()`), never silent: this rule's WCAG bar is
   * `min` instead, for `reason`. The APCA bar still applies in full. The gate prints every one and
   * `__tests__/tokens-wcag-minimums.test.ts` pins the exact set, so it cannot grow quietly.
   */
  wcagException?: { min: number; reason: string };
}

/** A rule that measures the role. `contrastMin()` reads its bar. */
export type MeasuredRule =
  | (MeasuredBase & {
      /** Minimum |APCA Lc|. */
      min: number;
      nonBody?: undefined;
    })
  | (MeasuredBase & {
      /**
       * Text only: why this text is never body copy. It implies the bar: Lc 60 (`NON_BODY`,
       * APCA's minimum for non-body text) instead of 75. An owner decision, pinned by the role tests.
       */
      nonBody: string;
      min?: undefined;
    });

export type ContrastRule =
  | MeasuredRule
  /** Exempt from every bar, with the reason (text over imagery, for example). */
  | { exempt: string }
  /**
   * A ui role that only decorates: exempt from the Lc 30 ui bar, and listed by the gate.
   * The reason says why it is never the only cue. Pinned by the role tests.
   */
  | { decorative: string };

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
  | "font";

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
  | "theme";

export interface Role {
  name: string;
  group: RoleGroup;
  kind: RoleKind;
  required: boolean;
  description: string;
  contrast?: ContrastRule;
  /** The Mzizi pack. */
  default: ThemedValue;
  /**
   * Derive a compliant value from `default` with the palette's own `walk()` when
   * the default misses the contrast rule: `text` moves the role's value away from
   * its background, `fill` moves the fill away from its foreground. The `-aa`
   * principle: the canonical value stays, the role gets the measured-safe one.
   */
  derive?: "text" | "fill";
  /** Theme key, where the role's name would collide with a Tailwind keyword. */
  utility?: string;
  /** size: registered with Tailwind as its own literal value, which no pack can override. */
  fixed?: true;
  /**
   * size: a spacing layer (owner ruling 2026-11-19). Declared as `--space-<name>`, the layer token itself, not
   * `--size-<name>`; the Tailwind key stays `--spacing-<name>` (`p-control-x`, `gap-card-gap`). Always `fixed`.
   */
  space?: true;
  /**
   * size: must not be smaller than `spacing-touch-min`. The stylesheet registers
   * it as `max(var(--size-<name>), <floor>)`, so a pack that lowers the bare var
   * still paints the floor, and the gate fails a default under it.
   */
  floor?: true;
  block: RoleBlock;
}

/**
 * THE BUNDU FLOOR (owner rulings, 2026-11-02; hit-area and spacing-layer rulings, 2026-11-19): the hard minimums Bundu
 * stands behind, as high as possible, because Bundu sets the standard for outdoor reading and for people who find
 * technology hard (older users, African and emerging markets). ONE definition: the token generators, the contract
 * runner, the Rust evaluator and every test read these numbers, and `__tests__/bundu-floor.test.ts` fails when any
 * default breaks one.
 *
 * THE NUMBER RULE (owner, 2026-11-19): every Mzizi spacing or size value is a multiple of 3, a multiple of 7, or a
 * prime number. Start from the recommended value (WCAG, Apple HIG or Material 3) and take the nearest Mzizi number at
 * or above it. A little larger is fine; lower never is. Cards, containers and page layout use multiples of 7. Controls
 * may use any Mzizi number. The derivations below say which rung each number is; they are not the reason for it.
 *
 * Where each number comes from:
 *   - `unitPx` 7: the radius unit (`brand.source.ts`, `--radius-unit`); the radii are 4/7/12/14/17 and a pill.
 *   - `bodyPx` 17: body text on touch (every device that is not a desktop). It is Apple's iOS default body size, and a prime.
 *   - `captionPx` 14: captions, metadata and secondary labels; 2 x 7. Nothing readable is smaller.
 *   - `hitAreaPx` 45: every interactive control keeps a hit region this size on touch. WCAG 2.5.5 and Apple ask for 44;
 *     44 is 4 x 11, so the floor is 45 (3 x 15). Owner ruling 2026-11-19, replacing the 49px of 2026-11-02 (#660 and its
 *     predecessors). (On a desktop the tier below applies: the drawn box is the hit region.)
 *   - `visibleControlMinPx` 28: the smallest a control is DRAWN, at desktop density; 4 x 7 (Apple macOS default 28 pt).
 *   - `pointerFine`: THE DESKTOP TIER (owner ruling, 2026-11-12, #660: "yes do the device-based floor, desktop body
 *     15px"; hit region lowered to 24 by the owner, 2026-11-19). A fine pointer with hover (`DENSITY_DESKTOP_QUERY`) is
 *     not a finger. Touch (a coarse pointer, and every device that is not a desktop) keeps `hitAreaPx`. Desktop:
 *     `hitAreaPx` 24 (3 x 8, WCAG 2.2 SC 2.5.8's 24px), so a desktop control's drawn box (at least
 *     `visibleControlMinPx`) is larger than its hit region; `bodyPx` 15 (the owner's number; Apple's macOS default is 13
 *     pt). Unchanged on both tiers: captions 14px, the spacing floor, contrast.
 *   - `spacing`: THE SPACING FLOOR, one floor per layer with a dense step (owner rulings 2026-11-19; the single 14px inset
 *     and 7px gap of 2026-11-04, #617, are replaced). Each layer has a default value (the floor at default density) and a
 *     dense value (the absolute floor: nothing goes below it). Dense controls are drawn smaller and keep the full hit
 *     area (45 touch, 24 desktop). `layers` holds each layer's `px` and `dense`:
 *       layout      page-x 17 (prime), page-x-wide 28 / 21 (7 x 4, 7 x 3), section 49 / 28 (7 x 7, 7 x 4)
 *       containers  padding 28 / 21 (7 x 4, 7 x 3), gap 21 / 14 (7 x 3, 7 x 2)
 *       cards       padding 21 / 14 (7 x 3, 7 x 2), gap 14 / 7, stack 7 / 7
 *       controls    x 17 / 12 (prime, 3 x 4), field-x 17 / 12, gap 9 / 7 (3 x 3), between 9 / 9 (3 x 3)
 *       chips       chip-x 12 / 9 (3 x 4, 3 x 3)
 *       pills       pill-x 9 / 5 (3 x 3, prime), pill-gap 5 / 3 (prime, prime)
 *     `insetPx` (14) and `gapPx` (7) are the floors for a component or class whose layer is unknown: today's values, kept so
 *     enforcement is never weaker than before (owner 2026-11-19). A component with a known layer is checked against its own
 *     layer's dense floor in `SPACING_LAYER_FLOORS` (pills 5 and 3, chips 9, controls 12, cards 14 and 7, containers 21 and
 *     14, layout 17, 21 and 28). A label chip or pill is held on its inline axis by `--space-pill-x` (default 9, dense 5).
 *     `controlGapPx` 9: the gap between adjacent controls, visible edge to visible edge (hit regions may touch, never
 *     overlap). `labelGapPx` 7 is the global label-to-field floor. Its dense step, 5 (`--space-label-gap-dense`), is confirmed
 *     by the owner (2026-11-20). `itemGapPx` 7 is the dense floor of `--space-card-gap` (14 default), which sibling
 *     items of a list, grid or toolbar use.
 *     `leadingBody` 1.5: body line height (WCAG 1.4.12). Enforced as defaults in the base layer of the stylesheet (at each
 *     layer's dense floor) and as tests on every explicit value.
 *   - `contrast`: WCAG 2 ratios (#610, owner 2026-11-02): body text 7:1, non-body text 4.5:1, UI parts 3:1.
 *   - `apca`: the APCA Lc bars that stand beside them.
 */
export const BUNDU_FLOOR = {
  unitPx: 7,
  bodyPx: 17,
  captionPx: 14,
  hitAreaPx: 45,
  visibleControlMinPx: 28,
  pointerFine: { hitAreaPx: 24, bodyPx: 15 },
  spacing: {
    // Each layer: `px` is the default-density floor, `dense` the absolute floor (owner, 2026-11-19, second ruling).
    // Nothing goes below `dense`. A layer with no dense step has no `dense` key.
    layers: {
      pageX: { px: 17 },
      pageXWide: { px: 28, dense: 21 },
      section: { px: 49, dense: 28 },
      containerPadding: { px: 28, dense: 21 },
      containerGap: { px: 21, dense: 14 },
      cardPadding: { px: 21, dense: 14 },
      cardGap: { px: 14, dense: 7 },
      cardStack: { px: 7, dense: 7 },
      controlX: { px: 17, dense: 12 },
      fieldX: { px: 17, dense: 12 },
      controlGap: { px: 9, dense: 7 },
      controlBetween: { px: 9, dense: 9 },
      chipX: { px: 12, dense: 9 },
      pillX: { px: 9, dense: 5 },
      pillGap: { px: 5, dense: 3 },
      labelGap: { px: 7, dense: 5 },
    },
    /** The inset floor for a component with no known layer: 14px, today's value (owner 2026-11-19). What `--inset-floor` holds. */
    insetPx: 14,
    /** The gap floor for a component with no known layer: 7px, today's value (owner 2026-11-19). What `--gap-floor` holds. */
    gapPx: 7,
    /** The gap between adjacent controls: 9 at default density, and its dense floor is also 9. */
    controlGapPx: 9,
    /** The global label-to-field floor, 7px (`--space-label-gap`, the default). Its dense step (5) is confirmed by the owner (2026-11-20). */
    labelGapPx: 7,
    /** Alias of `spacing-card-gap-dense` (sibling items of a list, grid or toolbar, dense 7). */
    itemGapPx: 7,
    leadingBody: 1.5,
  },
  contrast: { body: 7, nonBody: 4.5, ui: 3 },
  apca: { body: 75, nonBody: 60, ui: 30 },
} as const;

/**
 * THE LAYER-AWARE CHECKER (owner ruling 2026-11-19, enforcement). Each component is checked against its own
 * layer's DENSE floor, the absolute minimum nothing may go below. The floors, in px:
 *   - pills:      padding 5, gap 3                 (`pill-x` dense, `pill-gap` dense)
 *   - chips:      padding 9, gap 7                 (`chip-x` dense; the owner set no chip gap, so today's 7 stands)
 *   - controls:   padding 12, gap 7, between 9, label 5  (`control-x` / `field-x` dense; icon gap; between controls; label gap)
 *   - cards:      padding 14, gap 7                (`card` dense, `card-stack` / `card-gap` dense)
 *   - containers: padding 21, gap 14               (`container` dense, `container-gap` dense)
 *   - layout:     page edge 17, wide page edge 21, section gap 28
 * A component with NO known layer (`COMPONENT_LAYERS` has no entry) is held to `BUNDU_FLOOR.spacing.insetPx` (14) and
 * `gapPx` (7): today's floors, so enforcement is never weaker than before. The checker reads each class's own
 * value; `label` is the owner's floor for a label and its field, which the markup check cannot see and is not enforced
 * by it. `contracts/runner.ts` and mzizi-rs/contract-eval hold copies, pinned by `__tests__/spacing-floor.test.ts`.
 */
export type SpacingLayer = "pills" | "chips" | "controls" | "cards" | "containers" | "layout";
export const SPACING_LAYER_FLOORS = {
  pills: { padding: 5, gap: 3 },
  chips: { padding: 9, gap: 7 },
  controls: { padding: 12, gap: 7, between: 9, label: 5 },
  cards: { padding: 14, gap: 7 },
  containers: { padding: 21, gap: 14 },
  layout: { padding: 17, wide: 21, gap: 28 },
} as const satisfies Record<SpacingLayer, Record<string, number>>;
/**
 * The layer of each contract that has one, keyed by contract name (`contracts/index.json`). A component whose layer
 * is not in this map is checked at the fallback floor (14 inset, 7 gap). The mapping is from each component's role:
 * N2 primitives that take input or are pressed are `controls`; chips and pill-shaped badges are `chips` and `pills`;
 * N3 composites that hold content in a box are `cards`; dialogs, popovers and toasts are `containers`; page and
 * section frames are `layout`.
 */
export const COMPONENT_LAYERS: Readonly<Record<string, SpacingLayer>> = {
  "app/badge": "pills",
  "ui/status-badge": "pills",
  "ui/mzizi-verified-badge": "pills",
  "discover/category-chip": "chips",
  "discover/category-chips": "chips",
  "app/button": "controls",
  "ui/button": "controls",
  "app/input": "controls",
  "ui/input": "controls",
  "ui/native-select": "controls",
  "ui/segmented-control": "controls",
  "app/toolbar-menu": "controls",
  "app/top-bar-action": "controls",
  "app/quick-search": "controls",
  "app/card": "cards",
  "ui/card": "cards",
  "app/stat-tile": "cards",
  "discover/discover-card": "cards",
  "app/alert": "cards",
  "ui/alert": "cards",
  "app/confirm-action": "containers",
  "app/detail-panel": "containers",
  "app/command-palette": "containers",
  "app/account-menu": "containers",
  "ui/toaster": "containers",
  "app/app-shell": "layout",
  "app/page-header": "layout",
  "site/container": "layout",
  "site/section": "layout",
  "discover/discover-shell": "layout",
};

/** APCA Lc 75: body text, and a foreground on its fill. The gate's text floor. */
export const BODY = BUNDU_FLOOR.apca.body;
/** APCA's minimum for non-body text: captions, timestamps, metadata (owner decision 2026-10-20, #484). */
export const NON_BODY = BUNDU_FLOOR.apca.nonBody;
/** APCA Lc 30: the parts of a control or focus indicator a user has to see. The gate's ui floor. */
export const UI = BUNDU_FLOOR.apca.ui;
/**
 * WCAG 2 contrast MINIMUMS, enforced next to the APCA bars (owner decision 2026-11-02, #399: "adopt a WCAG 7:1
 * floor for body text. We should have minimums set"). One definition; the gate, `textRamp()`, the derive walks
 * and the tests all read these.
 */
/** WCAG 2 ratio 7:1 (the AAA level of 1.4.6): body text, and a foreground on its fill. */
export const WCAG_BODY = BUNDU_FLOOR.contrast.body;
/** WCAG 2 ratio 4.5:1 (1.4.3): non-body text, the `nonBody` rule: captions, timestamps, metadata. */
export const WCAG_NON_BODY = BUNDU_FLOOR.contrast.nonBody;
/** WCAG 2 ratio 3:1 (1.4.11, non-text contrast): the `UI` rule, focus rings and control edges. */
export const WCAG_UI = BUNDU_FLOOR.contrast.ui;
const ON_PAGE = ["base", "surface"] as const;

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
] as const;

/** The floor the gate holds a kind to: 75 for text (60 for `nonBody` text), 30 for ui, none otherwise. */
export function contrastFloor(kind: RoleKind, rule?: ContrastRule): number {
  if (kind === "text")
    return rule && "against" in rule && rule.nonBody ? NON_BODY : BODY;
  return kind === "ui" ? UI : 0;
}

/** The WCAG 2 ratio floor the gate holds a kind to: 7 for body text, 4.5 for `nonBody` text, 3 for ui, none otherwise. */
export function wcagFloor(kind: RoleKind, rule?: ContrastRule): number {
  if (kind === "text")
    return rule && "against" in rule && rule.nonBody
      ? WCAG_NON_BODY
      : WCAG_BODY;
  return kind === "ui" ? WCAG_UI : 0;
}

/** The WCAG ratio a measured rule asks for: its own `wcag` where that is higher, else the kind's floor. 0 = none. */
export function wcagMin(kind: RoleKind, rule: MeasuredRule): number {
  if (rule.wcagException)
    return Math.max(rule.wcag ?? 0, rule.wcagException.min);
  return Math.max(rule.wcag ?? 0, wcagFloor(kind, rule));
}

/** The |Lc| a measured rule asks for: its `min`, or for `nonBody` text, `NON_BODY`. */
export function contrastMin(kind: RoleKind, rule: MeasuredRule): number {
  return rule.min ?? contrastFloor(kind, rule);
}

/** A `brand.source.ts` semantic colour, failing loudly when canon lost it. */
function semantic(name: string) {
  const row = semanticColors.find((c) => c.name === name);
  if (!row) throw new Error(`brand.source.ts semanticColors has no "${name}"`);
  return row;
}

/** A component spec from `brandMeta.componentSpecs`, by name. */
function spec(name: string): {
  heights: Record<string, number>;
  borderRadius: number;
} {
  const row = brandMeta.componentSpecs.find((s) => s.name === name);
  if (!row) throw new Error(`brand.source.ts componentSpecs has no "${name}"`);
  return row as unknown as {
    heights: Record<string, number>;
    borderRadius: number;
  };
}

function access(key: "minTouchTarget" | "defaultTouchTarget"): number {
  const v = brandMeta.accessibility[key];
  if (typeof v !== "number")
    throw new Error(`brand.source.ts accessibility.${key} is not a number`);
  // canon (`/v1/brand`) carries the number too; the Bundu floor is the one source and canon must agree.
  if (v !== BUNDU_FLOOR.hitAreaPx) {
    throw new Error(
      `brand.source.ts accessibility.${key} is ${v}px, but BUNDU_FLOOR.hitAreaPx is ${BUNDU_FLOOR.hitAreaPx}px`,
    );
  }
  return v;
}

/** Canon (`/v1/brand`) carries the spacing floor too; `BUNDU_FLOOR.spacing` is the one source and canon must agree. */
function spacingFloorInCanon(): void {
  const a = brandMeta.accessibility;
  const want: Record<string, number> = {
    minInset: BUNDU_FLOOR.spacing.insetPx,
    minControlGap: BUNDU_FLOOR.spacing.controlGapPx,
    minLabelGap: BUNDU_FLOOR.spacing.labelGapPx,
    minItemGap: BUNDU_FLOOR.spacing.itemGapPx,
    minBodyLeading: BUNDU_FLOOR.spacing.leadingBody,
  };
  for (const [k, v] of Object.entries(want))
    if (a[k] !== v)
      throw new Error(
        `brand.source.ts accessibility.${k} is ${String(a[k])}, but BUNDU_FLOOR.spacing says ${v}`,
      );
  const fine: Record<string, number> = {
    minTouchTargetPointerFine: BUNDU_FLOOR.pointerFine.hitAreaPx,
    bodyPxPointerFine: BUNDU_FLOOR.pointerFine.bodyPx,
  };
  for (const [k, v] of Object.entries(fine))
    if (a[k] !== v)
      throw new Error(
        `brand.source.ts accessibility.${k} is ${String(a[k])}, but BUNDU_FLOOR.pointerFine says ${v}`,
      );
}
spacingFloorInCanon();

/**
 * A radius role's default: the rung of the radius ladder it follows, so a
 * consumer that moves `--r-full` or `--r-base` moves the role too. The rung is
 * named here and checked against the component spec it stands for, so canon
 * stays the source and a spec that moves off its rung fails loudly.
 */
function rung(specName: string, name: string): RoleValue {
  const v = brandMeta.radii[name];
  if (typeof v !== "string")
    throw new Error(`brand.source.ts radii has no "${name}"`);
  const want = spec(specName).borderRadius;
  if (parseFloat(v) !== want) {
    throw new Error(
      `componentSpecs.${specName}.borderRadius is ${want}px, but its radius rung "${name}" is ${v}`,
    );
  }
  return { radius: name };
}

function fontFamily(name: "sans" | "serif" | "mono"): string {
  const row = typography.find((t) => t.entryType === "font" && t.name === name);
  if (!row?.family)
    throw new Error(`brand.source.ts typography has no font "${name}"`);
  return row.family;
}

/**
 * Canon's type scale (`/v1/brand` typography, `design-system/tokens.json`) is held to the Bundu floor at load, like
 * `access()` holds the hit area: Body and every heading and display step >= `bodyPx`, Body Small, Caption and Code
 * >= `captionPx`. A canon row under its floor fails the build rather than serving a stale size.
 */
for (const t of typography) {
  if (t.entryType !== "scale" || typeof t.sizePx !== "number") continue;
  const floor = ["Body Small", "Caption", "Code"].includes(t.name)
    ? BUNDU_FLOOR.captionPx
    : BUNDU_FLOOR.bodyPx;
  if (t.sizePx < floor) {
    throw new Error(
      `brand.source.ts typography "${t.name}" is ${t.sizePx}px, under the Bundu floor of ${floor}px`,
    );
  }
}

/** The mzizi row's family: hematite, by owner decision (2026-09-30). */
export const DEFAULT_PRIMARY_FAMILY: string = (() => {
  const row = ecosystem.find((e) => e.name === "mzizi");
  if (!row) throw new Error(`brand.source.ts ecosystem has no "mzizi" row`);
  return row.mineral;
})();

// ─── Status tones ────────────────────────────────────────────────────────────

/** Tone → palette family (#484 §1b: every palette use in a held component encodes one of these). */
export const STATUS_TONES = [
  ["success", "malachite"],
  ["warning", "gold"],
  ["info", "cobalt"],
  ["danger", "terracotta"],
  ["premium", "tanzanite"],
] as const;

/** Lifecycle → tone. Aliases, so a pack that remaps a tone moves its lifecycle too. */
export const LIFECYCLE = [
  ["stable", "success"],
  ["beta", "info"],
  ["alpha", "warning"],
  ["deprecated", "danger"],
] as const;

/** The four tiers every status tone carries, and how each is measured. */
function toneRoles(
  tone: string,
  values: Record<"fill" | "container" | "on" | "text", ThemedValue>,
  description: string,
): Role[] {
  const name = `status-${tone}`;
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
  ];
}

const fam = (family: string, tier: FamilyTier): RoleValue => ({ family, tier });

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
      `${tone[0].toUpperCase()}${tone.slice(1)} (${family} in the Mzizi pack)`,
    ),
  ),
  ...toneRoles(
    "neutral",
    {
      fill: { role: "neutral" },
      container: { role: "container" },
      on: { role: "text-primary" },
      text: { role: "muted-foreground" },
    },
    "Neutral (the muted ladder in the Mzizi pack)",
  ),
];

const LIFECYCLE_ROLES: Role[] = LIFECYCLE.flatMap(([stage, tone]) =>
  ["", "-container", "-on-container", "-text"].map((suffix): Role => {
    const of = STATUS_ROLES.find((r) => r.name === `status-${tone}${suffix}`)!;
    const contrast: ContrastRule | undefined =
      suffix === "-on-container"
        ? { against: [`status-${stage}-container`], min: BODY }
        : of.contrast;
    return {
      name: `status-${stage}${suffix}`,
      group: "lifecycle",
      kind: of.kind,
      required: true,
      description: `Lifecycle \`${stage}\`: an alias of \`status-${tone}${suffix}\`.`,
      contrast,
      default: { role: `status-${tone}${suffix}` },
      block: "roles",
    };
  }),
);

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
] as const;

/** The attestations, unordered: each one is held or not, alongside the level. */
export const ATTESTATIONS = [
  ["community", "Community Vouched", "terracotta"],
  ["business", "Registered Business", "malachite"],
  ["domain", "Domain Verified", "copper"],
] as const;

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
] as const;

/** Kept for existing readers: the legacy tier → palette family it resolves to. */
export const TIER_FAMILIES = [
  ["community", "terracotta"],
  ["otp", "cobalt"],
  ["government", "gold"],
  ["licensed", "tanzanite"],
] as const;

/** The five legacy tiers in ladder order, with the label each one carries. */
export const TIERS = [
  ["unverified", "Unverified"],
  ["community", "Community Verified"],
  ["otp", "Contact Verified"],
  ["government", "Government Verified"],
  ["licensed", "Licensed Professional"],
] as const;

/** The four parts every level, attestation and tier carries: the same shape as a status tone. */
function trustRoles(
  name: string,
  group: "assurance" | "attestation",
  what: string,
  values: Record<"fill" | "container" | "on" | "text", ThemedValue>,
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
  ];
}

const familyValues = (family: string) => ({
  fill: fam(family, "base"),
  container: fam(family, "container"),
  on: fam(family, "on-container"),
  text: fam(family, "text"),
});

const ASSURANCE_ROLES: Role[] = ASSURANCE_LEVELS.flatMap(
  ([level, label, family], i) =>
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
          },
    ),
);

const ATTESTATION_ROLES: Role[] = ATTESTATIONS.flatMap(
  ([type, label, family]) =>
    trustRoles(
      `attestation-${type}`,
      "attestation",
      `Attestation \`${type}\` ("${label}", ${family} in the Mzizi pack)`,
      familyValues(family),
    ),
);

/** `--tier-*`: aliases of the new roles, so a pack that remaps a level moves its legacy tier too. */
const TIER_ROLES: Role[] = TIER_ALIASES.flatMap(([tier, target]) =>
  ["", "-container", "-on-container", "-text"].map((suffix): Role => {
    const of = [...ASSURANCE_ROLES, ...ATTESTATION_ROLES].find(
      (r) => r.name === `${target}${suffix}`,
    )!;
    const contrast: ContrastRule | undefined =
      suffix === "-on-container"
        ? { against: [`tier-${tier}-container`], min: BODY }
        : of.contrast;
    return {
      name: `tier-${tier}${suffix}`,
      group: "tier",
      kind: of.kind,
      required: true,
      description: `Legacy verification tier \`${tier}\` (\`bundu.verificationTier\`): an alias of \`${target}${suffix}\`. Read the assurance and attestation roles in new code.`,
      contrast,
      default: { role: `${target}${suffix}` },
      block: "roles",
    };
  }),
);

// ─── Legacy status colours — `/v1/brand` semanticColors, read from canon ─────

/**
 * The status colours `--success`, `--warning`, … that the stylesheet carried as a
 * second copy (`STATUS` in `render-globals-css.ts`). Read from canon now. They
 * stay as roles because components and consumers use them; the status TONES
 * above are what slice 4 migrates components onto.
 */
const LEGACY_STATUS_NAMES = [
  "success",
  "warning",
  "error",
  "info",
  "neutral",
  "offline",
  "syncing",
] as const;

const LEGACY_STATUS_ROLES: Role[] = [
  ...LEGACY_STATUS_NAMES.map((name): Role => ({
    name,
    group: "status-legacy",
    kind: "ui",
    required: true,
    description: semantic(name).usage,
    contrast: { against: ON_PAGE, min: UI },
    default: { semantic: name },
    block: "status",
  })),
  {
    name: "destructive-container",
    group: "destructive",
    kind: "surface",
    required: true,
    description: semantic("destructive-container").usage,
    default: { semantic: "destructive-container" },
    block: "status",
  },
];

// ─── The manifest ────────────────────────────────────────────────────────────

const LADDER_NAMES = [
  "pitch",
  "void",
  "base",
  "surface",
  "container",
  "overlay",
  "raised",
  "scrim",
] as const;

function background(name: string) {
  const row = backgroundColors.find((c) => c.name === name);
  if (!row)
    throw new Error(`brand.source.ts backgroundColors has no "${name}"`);
  return row;
}

const fg = (against: string): ContrastRule => ({
  against: [against],
  min: BODY,
});

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
} as const;
const fgOnBrandFill = (against: string): ContrastRule => ({
  against: [against],
  min: BODY,
  wcagException: ON_BRAND_FILL_EXCEPTION,
});
const DESTRUCTIVE_FILL_EXCEPTION = {
  min: 4.5,
  reason:
    "a label on the destructive action fill, not body copy; the fill is canon error #B3261E (6.54:1 under white, Lc 86), " +
    "and 7:1 would move it to #AA241D, a second red beside canon error; pending owner confirmation, 2026-11-02",
} as const;
const onWhiteOrInk: ThemedValue = {
  light: { literal: "#FFFFFF" },
  dark: { literal: "#0E0D0C" },
};

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
    description:
      "The focus ring. Cobalt (-aa) in the Mzizi pack, for every ecosystem brand; a custom pack may set it.",
    contrast: { against: ON_PAGE, min: UI },
    default: fam("cobalt", "aa"),
    block: "disputed",
  },
  {
    name: "brand-accent",
    group: "identity",
    kind: "fill",
    required: true,
    description:
      "The saturated brand accent (accent fills, the page wash). Follows `primary` unless a brand names an accent.",
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
    description:
      "An app's own accent inside the shell (`app/app-shell` `accent`). Follows `brand-accent`.",
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
  ...LADDER_NAMES.map((name): Role => ({
    name,
    group: "surface",
    kind: "surface",
    required: true,
    description: background(name).usage,
    default: { background: name },
    // `--color-base` made `text-base` a colour (#456).
    utility: name === "base" ? "surface-base" : undefined,
    block: "ladder",
  })),
  {
    name: "wash",
    group: "surface",
    kind: "surface",
    required: true,
    description: background("wash").usage,
    default: {
      light: { mix: ["surface", 93, "brand-accent"] },
      dark: { mix: ["surface", 88, "brand-accent"] },
    },
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
    description:
      "The plate behind a QR code: white in every theme, so the code is never inverted.",
    default: { literal: "#FFFFFF" },
    block: "roles",
  },
  {
    name: "on-surface-qr",
    group: "surface",
    kind: "text",
    required: true,
    description:
      "A QR code's modules on `surface-qr`: the canon's ink in every theme.",
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
    description:
      "Secondary text, descriptions. APCA Lc 75 on `base` and `surface` (#399).",
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
    contrast: {
      exempt:
        "drawn over imagery, not over base or surface; carries --hero-text-shadow",
    },
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
  ...minerals.map((m, i): Role => ({
    name: `chart-${i + 1}`,
    group: "categorical",
    kind: "fill",
    required: true,
    description: `Chart series ${i + 1}. Mzizi: ${m.name}.`,
    default: fam(m.name, "base"),
    block: "chart",
  })),
  ...(
    [
      ["chart-positive", "success"],
      ["chart-negative", "error"],
      ["chart-neutral", "neutral"],
    ] as const
  ).map(([name, of]): Role => ({
    name,
    group: "categorical",
    kind: "fill",
    required: true,
    description: `Semantic chart series; never changes hue between themes. An alias of \`${of}\`.`,
    default: { role: of },
    block: "chart",
  })),
  ...minerals.map((m, i): Role => ({
    name: `category-${i + 1}`,
    group: "categorical",
    kind: "fill",
    required: true,
    description: `Category ${i + 1} (the mineral strip, Discover categories). Mzizi: ${m.name}.`,
    default: fam(m.name, "base"),
    block: "roles",
  })),

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
  {
    name: "card",
    group: "shadcn",
    kind: "surface",
    required: true,
    description: "Card surface.",
    default: { role: "surface" },
    block: "shadcn",
  },
  {
    name: "card-foreground",
    group: "shadcn",
    kind: "text",
    required: true,
    description: "Text on `card`.",
    contrast: fg("card"),
    default: { role: "text-primary" },
    block: "shadcn",
  },
  {
    name: "popover",
    group: "shadcn",
    kind: "surface",
    required: true,
    description: "Popover surface.",
    default: { role: "overlay" },
    block: "shadcn",
  },
  {
    name: "popover-foreground",
    group: "shadcn",
    kind: "text",
    required: true,
    description: "Text on `popover`.",
    contrast: fg("popover"),
    default: { role: "text-primary" },
    block: "shadcn",
  },
  {
    name: "secondary",
    group: "shadcn",
    kind: "fill",
    required: true,
    description: "Secondary button fill.",
    default: { role: "container" },
    block: "shadcn",
  },
  {
    name: "secondary-foreground",
    group: "shadcn",
    kind: "text",
    required: true,
    description: "Text on `secondary`.",
    contrast: fg("secondary"),
    default: { role: "text-primary" },
    block: "shadcn",
  },
  {
    name: "destructive",
    group: "destructive",
    kind: "fill",
    required: true,
    description:
      "Errors and destructive actions: red, never the terracotta `status-danger` (owner decision 2026-10-07).",
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
    contrast: {
      against: ["destructive"],
      min: BODY,
      wcagException: DESTRUCTIVE_FILL_EXCEPTION,
    },
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
    description:
      "The error status (`text-status-error`, `fill-status-error`): an alias of `destructive`, red, never the terracotta `status-danger`.",
    contrast: { against: ON_PAGE, min: UI },
    default: { role: "destructive" },
    block: "roles",
  },
  {
    name: "overlay-foreground",
    group: "shadcn",
    kind: "text",
    required: true,
    description: "Text on `overlay`.",
    contrast: fg("overlay"),
    default: { role: "text-primary" },
    block: "shadcn",
  },
  {
    name: "accent",
    group: "shadcn",
    kind: "surface",
    required: true,
    description: "Hover and selected fills: `primary` at 12% over `base`.",
    default: { mix: ["primary", 12, "base"] },
    block: "disputed",
  },
  {
    name: "accent-foreground",
    group: "shadcn",
    kind: "text",
    required: true,
    description: "Text on `accent`.",
    contrast: fg("accent"),
    default: { role: "text-primary" },
    block: "shadcn",
  },
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
  {
    name: "sidebar",
    group: "sidebar",
    kind: "surface",
    required: true,
    description: "Sidebar surface.",
    default: { role: "surface" },
    block: "sidebar",
  },
  {
    name: "sidebar-foreground",
    group: "sidebar",
    kind: "text",
    required: true,
    description: "Text on `sidebar`.",
    contrast: fg("sidebar"),
    default: { role: "text-primary" },
    block: "sidebar",
  },
  {
    name: "sidebar-primary",
    group: "sidebar",
    kind: "fill",
    required: true,
    description: "The sidebar's active item fill.",
    default: { role: "primary" },
    block: "sidebar",
  },
  {
    name: "sidebar-primary-foreground",
    group: "sidebar",
    kind: "text",
    required: true,
    description: "Text on `sidebar-primary`.",
    contrast: fgOnBrandFill("sidebar-primary"),
    default: { role: "primary-foreground" },
    block: "sidebar",
  },
  {
    name: "sidebar-accent",
    group: "sidebar",
    kind: "surface",
    required: true,
    description: "The sidebar's hover fill.",
    default: { role: "container" },
    block: "sidebar",
  },
  {
    name: "sidebar-accent-foreground",
    group: "sidebar",
    kind: "text",
    required: true,
    description: "Text on `sidebar-accent`.",
    contrast: fg("sidebar-accent"),
    default: { role: "text-primary" },
    block: "sidebar",
  },
  {
    name: "sidebar-border",
    group: "sidebar",
    kind: "ui",
    required: true,
    description:
      "Decorative sidebar hairlines. An alias of `border`; a control's edge is `border-control` (from slice 4 of #484).",
    contrast: {
      decorative:
        "an alias of border, the sidebar's dividers: never the only cue. A control's edge in the sidebar is meant to be " +
        "border-control, which is measured on sidebar (#484).",
    },
    default: { role: "border" },
    block: "sidebar",
  },
  {
    name: "sidebar-ring",
    group: "sidebar",
    kind: "ui",
    required: true,
    description: "Focus ring in the sidebar.",
    contrast: { against: ["sidebar"], min: UI },
    default: { role: "ring" },
    block: "sidebar",
  },

  // ── Size: touch targets and control heights (brandMeta) ──
  {
    name: "spacing-touch",
    group: "size",
    kind: "size",
    required: true,
    description:
      "The default touch target (`h-touch`, `min-h-touch`). brandMeta.accessibility.defaultTouchTarget.",
    default: { px: access("defaultTouchTarget") },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-touch-min",
    group: "size",
    kind: "size",
    required: true,
    description:
      "The hit-area floor (`min-h-touch-min`), registered as `--target-floor`, in two pointer tiers: 45px on touch (`BUNDU_FLOOR.hitAreaPx`, 3 x 15: WCAG 2.5.5 and Apple ask for 44, rounded up to the Mzizi number rule; owner 2026-11-19) and 24px on a desktop, a fine pointer with hover (`BUNDU_FLOOR.pointerFine.hitAreaPx`, 3 x 8, WCAG 2.5.8). Only the desktop density layer lowers it, and not below 24px (owner rulings 2026-11-02, 2026-11-12 and 2026-11-19; the 2026-11-19 ruling replaced the 49px touch and 28px desktop floors of #660). No brand pack can move it.",
    default: { px: access("minTouchTarget") },
    fixed: true,
    block: "invariant",
  },
  {
    name: "spacing-inset-floor",
    group: "size",
    kind: "size",
    required: true,
    description:
      "ALIAS, kept for consumers that name the floor (owner 2026-11-19 replaced the single 14px floor with a floor per spacing layer and a dense step, see the `space-*` layer roles). The floor for a component with no known layer: 14px (`BUNDU_FLOOR.spacing.insetPx`, today's value, owner 2026-11-19), registered as `--inset-floor`. A component with a known layer is held to its own layer's dense floor (`p-pill-x` 5, `p-control-x` 12, `p-card` 14, `p-container` 21), never below it. No component, density layer or brand pack can lower it (owner 2026-11-04, #617; the value is the owner's 2026-11-19 ruling).",
    default: { px: BUNDU_FLOOR.spacing.insetPx },
    fixed: true,
    block: "invariant",
  },
  {
    name: "spacing-gap-floor",
    group: "size",
    kind: "size",
    required: true,
    description:
      "ALIAS, kept for consumers that name the floor (owner 2026-11-19). The floor for a component with no known layer: 7px (`BUNDU_FLOOR.spacing.gapPx`, today's value, owner 2026-11-19), registered as `--gap-floor`. A component with a known layer is held to its own layer's dense gap; gaps between adjacent controls are 9px (`spacing-control-between`). No component, density layer or brand pack can lower it (owner 2026-11-04, #617).",
    default: { px: BUNDU_FLOOR.spacing.gapPx },
    fixed: true,
    block: "invariant",
  },
  {
    name: "spacing-page-x",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Layout (page edge, phone). Default 17px (prime); reference: Apple and M3 compact 16. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pageX.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-page-x-wide",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Layout (page edge, medium and expanded). Default 28px (7 x 4); reference: M3 medium and expanded 24. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pageXWide.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-page-x-wide-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Layout (page edge, medium and expanded). Dense 21px (7 x 3); reference: 16 to 24. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pageXWide.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-section",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Layout (gap between sections). Default 49px (7 x 7); reference: 48. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.section.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-section-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Layout (gap between sections). Dense 28px (7 x 4); reference: 24. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.section.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-container",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Containers (dialogs, sheets, panels) padding. Default 28px (7 x 4); reference: M3 dialog 24. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.containerPadding.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-container-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Containers (dialogs, sheets, panels) padding. Dense 21px (7 x 3); reference: M3 sheet 16. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.containerPadding.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-container-gap",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Containers gap. Default 21px (7 x 3); reference: M3 dialog 16. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.containerGap.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-container-gap-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Containers gap. Dense 14px (7 x 2); reference: 12. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.containerGap.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-card",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Cards (cards, list items, tiles) padding. Default 21px (7 x 3); reference: M3 card 16. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.cardPadding.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-card-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Cards (cards, list items, tiles) padding. Dense 14px (7 x 2); reference: M3 list item 12. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.cardPadding.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-card-gap",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Cards gap. Default 14px (7 x 2); reference: M3 card gap 8. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.cardGap.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-card-gap-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Cards gap. Dense 7px (7); reference: 4. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.cardGap.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-card-stack",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Cards title to body. Default 7px (7); reference: title to body 4. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.cardStack.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-card-stack-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Cards title to body. Dense 7px (7); reference: 4. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.cardStack.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control-x",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls (buttons, chips, inputs) inline inset. Default 17px (prime); reference: M3 small button 16. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.controlX.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control-x-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls (buttons, chips, inputs) inline inset. Dense 12px (3 x 4); reference: M3 dense button 12. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.controlX.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-field-x",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, text field inline inset. Default 17px (prime); reference: M3 text field 16. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.fieldX.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-field-x-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, text field inline inset. Dense 12px (3 x 4); reference: 12. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.fieldX.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control-gap",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, icon to label. Default 9px (3 x 3); reference: M3 icon to label 8. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.controlGap.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control-gap-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, icon to label. Dense 7px (7); reference: 6. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.controlGap.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control-between",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, gap between adjacent controls. Default 9px (3 x 3); reference: M3 target spacing 8. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.controlBetween.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control-between-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, gap between adjacent controls. Dense 9px (3 x 3); reference: 8 (no dense step; the dense floor equals the default). The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.controlBetween.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-chip-x",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Chips inline inset. Default 12px (3 x 4); reference: M3 chip 12. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.chipX.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-chip-x-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Chips inline inset. Dense 9px (3 x 3); reference: M3 chip 8. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.chipX.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-pill-x",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Pills and badges inline inset. Default 9px (3 x 3); reference: 8. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pillX.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-pill-x-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Pills and badges inline inset. Dense 5px (prime); reference: M3 badge 4. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pillX.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-pill-gap",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Pills and badges gap. Default 5px (prime); reference: 4. The default-density floor. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pillGap.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-pill-gap-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Pills and badges gap. Dense 3px (prime and 3 x 1); reference: 2. The absolute floor: nothing goes below it. Owner 2026-11-19.",
    default: { px: BUNDU_FLOOR.spacing.layers.pillGap.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-label-gap",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, gap between a label and its field. Default 7px (7); reference: label to field 6 to 8. The default-density floor. Derived from the number rule; confirmed by the owner (2026-11-20).",
    default: { px: BUNDU_FLOOR.spacing.layers.labelGap.px },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-label-gap-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Layer: Controls, gap between a label and its field. Dense 5px (prime); reference: M3 4. The absolute floor: nothing goes below it. Derived from the number rule; confirmed by the owner (2026-11-20).",
    default: { px: BUNDU_FLOOR.spacing.layers.labelGap.dense },
    fixed: true,
    space: true,
    block: "invariant",
  },
  {
    name: "spacing-control",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Default control height. componentSpecs.button.heights.default.",
    default: { px: spec("button").heights.default },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-control-sm",
    group: "size",
    kind: "size",
    required: true,
    description: "Small control height. componentSpecs.button.heights.sm.",
    default: { px: spec("button").heights.sm },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-control-lg",
    group: "size",
    kind: "size",
    required: true,
    description: "Large control height. componentSpecs.button.heights.lg.",
    default: { px: spec("button").heights.lg },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-control-icon",
    group: "size",
    kind: "size",
    required: true,
    description: "Icon-button size. componentSpecs.button.heights.icon.",
    default: { px: spec("button").heights.icon },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-control-dense",
    group: "size",
    kind: "size",
    required: true,
    description:
      "Dense control height for a fine pointer only (`pointer-fine:h-control-dense`); drawn below the hit-area floor on purpose (#484 §2a), its 45px hit region kept by the `hit-area` pseudo-element; 28px under desktop density. 33px (3 x 11), rounded up from 32 by the number rule (owner 2026-11-19).",
    default: { px: 33 },
    block: "invariant",
  },
  {
    name: "spacing-field",
    group: "size",
    kind: "size",
    required: true,
    description: "Input height. componentSpecs.input.heights.default.",
    default: { px: spec("input").heights.default },
    floor: true,
    block: "invariant",
  },
  {
    name: "spacing-field-sm",
    group: "size",
    kind: "size",
    required: true,
    description: "Small input height. componentSpecs.input.heights.sm.",
    default: { px: spec("input").heights.sm },
    floor: true,
    block: "invariant",
  },

  // ── Radius (brandMeta.componentSpecs) ──
  {
    name: "radius-control",
    group: "radius",
    kind: "radius",
    required: true,
    description:
      "Buttons and controls. Mzizi keeps pill (owner decision 2026-10-07); a pack may switch it.",
    default: rung("button", "full"),
    block: "invariant",
  },
  {
    name: "radius-field",
    group: "radius",
    kind: "radius",
    required: true,
    description: "Inputs. componentSpecs.input.borderRadius.",
    default: rung("input", "full"),
    block: "invariant",
  },
  {
    name: "radius-badge",
    group: "radius",
    kind: "radius",
    required: true,
    description: "Badges. componentSpecs.badge.borderRadius.",
    default: rung("badge", "full"),
    block: "invariant",
  },
  {
    name: "radius-card",
    group: "radius",
    kind: "radius",
    required: true,
    description: "Cards. componentSpecs.card.borderRadius.",
    default: rung("card", "base"),
    block: "invariant",
  },
  {
    name: "radius-dialog",
    group: "radius",
    kind: "radius",
    required: true,
    description: "Dialogs. componentSpecs.dialog.borderRadius.",
    default: rung("dialog", "xl"),
    block: "invariant",
  },

  // ── Font (brand.source typography) ──
  {
    name: "font-body",
    group: "font",
    kind: "font",
    required: true,
    description: "Body and UI text. `font-sans` is an alias.",
    default: {
      font: `"${fontFamily("sans")}", ui-sans-serif, system-ui, sans-serif`,
    },
    block: "theme",
  },
  {
    name: "font-display",
    group: "font",
    kind: "font",
    required: true,
    description: "Display and headings. `font-serif` is an alias.",
    default: { font: `"${fontFamily("serif")}", ui-serif, Georgia, serif` },
    block: "theme",
  },
  {
    name: "font-code",
    group: "font",
    kind: "font",
    required: true,
    description: "Code. `font-mono` is an alias.",
    default: {
      font: `"${fontFamily("mono")}", ui-monospace, Menlo, monospace`,
    },
    block: "theme",
  },
];

/** Tailwind's own font utilities, kept as aliases of the font roles. */
export const FONT_ALIASES = [
  ["sans", "font-body"],
  ["serif", "font-display"],
  ["mono", "font-code"],
] as const;

export function role(name: string): Role {
  const r = ROLES.find((x) => x.name === name);
  if (!r) throw new Error(`no role "${name}" in lib/tokens/roles.source.ts`);
  return r;
}

export const isColorKind = (k: RoleKind) =>
  k === "text" || k === "fill" || k === "ui" || k === "surface";

/** The theme key a colour role registers under: `--color-<utility>`. */
export const colorKey = (r: Role) => r.utility ?? r.name;

// ─── The folded constants ────────────────────────────────────────────────────
//
// What `scripts/render-globals-css.ts` and `scripts/sync-tokens.ts` used to
// declare a second time. Same names and shapes their emitters use, read from
// canon, so the stylesheet and the platform files cannot disagree with it.

/** `[name, light, dark, usage]` — the legacy status colours, from `semanticColors`. */
export const STATUS: ReadonlyArray<readonly [string, string, string, string]> =
  LEGACY_STATUS_ROLES.map((r) => {
    const c = semantic(r.name);
    return [r.name, c.lightValue, c.darkValue, c.usage] as const;
  });

/**
 * The radius ladder, from `brandMeta.radii`, in ladder order. CLAUDE.md §7.5:
 * every radius derives from a 7px unit, giving the ecosystem numbers 4 / 7 /
 * 12 / 14 / 17 (xs is the unit less 3, for the smallest marks: swatches, kbd). A `--radius` of 10px or 12px with a `calc()` scale hung off it puts
 * every derived rung off the system.
 */
export const RADIUS: ReadonlyArray<readonly [string, string]> = (
  ["xs", "sm", "md", "base", "lg", "xl", "2xl", "full"] as const
).map((n) => {
  const v = brandMeta.radii[n];
  if (typeof v !== "string")
    throw new Error(`brand.source.ts radii has no "${n}"`);
  return [n, v] as const;
});

const rem = (px: number) => `${px / 16}rem`;

/**
 * Touch targets and control heights, under the names the stylesheet has always
 * declared, from `brandMeta`. `touch-target-sm` (41px) is the one value canon
 * does not hold: a dense secondary action drawn below the floor, never a primary control.
 */
export const SIZING: ReadonlyArray<readonly [string, string, string]> = [
  [
    "touch-target-lg",
    `${access("defaultTouchTarget")}px`,
    "Default touch target — /v1/brand defaultTouchTarget",
  ],
  [
    "touch-target",
    `${access("minTouchTarget")}px`,
    "Minimum touch target — /v1/brand minTouchTarget",
  ],
  [
    "touch-target-sm",
    "41px",
    "Dense secondary actions: drawn at 41px (prime; owner 2026-11-19; was 40), the 45px hit region kept by the hit-area pseudo-element; not for primary controls",
  ],
  [
    "h-button-default",
    rem(spec("button").heights.default),
    `${spec("button").heights.default}px — componentSpecs.button.heights.default`,
  ],
  [
    "h-button-sm",
    rem(spec("button").heights.sm),
    `${spec("button").heights.sm}px — componentSpecs.button.heights.sm`,
  ],
  [
    "h-input",
    rem(spec("input").heights.default),
    `${spec("input").heights.default}px — inputs match the default button`,
  ],
];

/** The font stacks, by Tailwind alias, for the platform files. */
export const FONTS = {
  sans: fontFamily("sans"),
  serif: fontFamily("serif"),
  mono: fontFamily("mono"),
} as const;

// ─── Density (owner decision 2026-11-01) ─────────────────────────────────────
//
// ONE place for "sizes step down as screens grow". Components never branch on
// screen size; `scripts/render-globals-css.ts` emits these as media queries on
// the size variables, and `__tests__/density.test.ts` holds them to the floors.
//
// Density is about VISUAL SIZE only. It is never read as a network-quality
// guess: laptops and iPads are usually on wifi.

/**
 * The hit region every interactive control keeps on touch (the Bundu floor, owner ruling 2026-11-02):
 * `BUNDU_FLOOR.hitAreaPx`, 45px (owner 2026-11-19). It replaces Apple HIG Buttons' 44 pt on a coarse pointer. A desktop keeps the
 * smaller `FLOOR_FINE_HIT_PX` (24px, owner ruling 2026-11-19; 28px under #660). Kept under the old name for importers.
 */
export const FLOOR_COARSE_PX = BUNDU_FLOOR.hitAreaPx;
/** The smallest a control is DRAWN under desktop density, px. */
export const FLOOR_VISIBLE_FINE_PX = BUNDU_FLOOR.visibleControlMinPx;
/** The hit region every interactive control keeps on a desktop (a fine pointer with hover), px: 24 (owner 2026-11-19; 28 under #660). Below FLOOR_VISIBLE_FINE_PX, so a desktop control's drawn box is its whole hit region and more. */
export const FLOOR_FINE_HIT_PX = BUNDU_FLOOR.pointerFine.hitAreaPx;
/** The type steps that are secondary text (floor `captionPx`, 14px); every other step is body or a heading (floor `bodyPx`, 17px). */
export const CAPTION_STEPS: readonly string[] = ["small", "caption", "code"];
/** Body text never below this on any device, px (17: Apple's iOS default body size). */
export const BODY_FLOOR_PX = BUNDU_FLOOR.bodyPx;
/** Body text never below this on a desktop (a fine pointer with hover), px: 15 (owner, #660). */
export const BODY_FLOOR_FINE_PX = BUNDU_FLOOR.pointerFine.bodyPx;
/** Captions, metadata and secondary labels never below this, px. */
export const CAPTION_FLOOR_PX = BUNDU_FLOOR.captionPx;

/** The fine-pointer, hover-capable, wide-viewport media query. Tablets (coarse pointer) never match, nor does a touchscreen laptop, which also has a coarse pointer (`any-pointer: coarse`). */
export const DENSITY_DESKTOP_QUERY =
  "(min-width: 64rem) and (pointer: fine) and (hover: hover) and (not (any-pointer: coarse))";
/** Type steps down at tablet width on any pointer. */
export const DENSITY_TABLET_QUERY = "(min-width: 48rem)";

/**
 * Size roles under desktop density, in px: what a control is DRAWN at. Every one must be >= FLOOR_VISIBLE_FINE_PX
 * (FLOOR_VISIBLE_FINE_PX, 28): the drawn box is at least the 24px desktop hit region, so a desktop control's own box
 * already covers its hit region. (Before 2026-11-19 a desktop kept a 49px touch and 28px hit region, and the native
 * field roles could not step down because an input or select cannot carry a pseudo-element; they now step down with
 * the rest.)
 */
export const DESKTOP_SIZES: Readonly<Record<string, number>> = {
  "spacing-touch": 36,
  "spacing-control": 36,
  "spacing-control-sm": 33,
  "spacing-control-lg": 41,
  "spacing-control-icon": 36,
  "spacing-control-dense": 28,
  "spacing-field": 36,
  "spacing-field-sm": 33,
};

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
};
/** Size roles whose box is their hit region (native form fields: no pseudo-element): they keep the hit area drawn. */
export const NATIVE_HIT_ROLES: readonly string[] = [
  "spacing-field",
  "spacing-field-sm",
];
/** The legacy touch floor, px. */
export const LEGACY_FLOOR_PX = 48;
