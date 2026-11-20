# Unstyled components: decisions, hook vocabulary and the structure gate

Status: B0 of the unstyled plan, 2026-11-20. This file records the owner's decisions, the attribute
vocabulary components use instead of classes, the pack layout the look will move into, and where the
Bundu floor is enforced once components are unstyled. Nothing here changes a component yet; B1 onward do.

## Owner decisions

**(a) Minors only.** Unstyled batches ship as minor releases. Each batch is additive: hooks, the mzizi
pack and aliases are added and the look is unchanged. Removing the classes from components is not a
standalone registry release. It is held for a major release that the owner is coordinating across several
products. Until that major ships, nothing breaking ships.

**(b) "Fragments" means** the 40 server-filled partials in `n6-pages` named `discover-*` and `site-*`
(tsx and astro), and the Roots `Node::Fragment` in `mzizi-rs/crates/mzizi-roots/src/node.rs`.

**(c) The browser geometry gate is required in CI.** It measures rendered geometry on touch and desktop
viewports for every contract state under each pack (see "Where the floor is enforced"). It is not optional
for B1.

**(d) The floor numbers are the current ones.** The pack and every test use the touch and desktop hit
areas, the desktop drawn minimum, the control heights and the per-layer spacing floors below. Every test
reads them from `BUNDU_FLOOR` in `lib/tokens/roles.source.ts`. No test, pack or component hard-codes them.

## The floor

The rule is the floor: no component, doc, test, token, skill, example or default may state or ship a value
under it. The numbers are `BUNDU_FLOOR` in `lib/tokens/roles.source.ts`. The table below is checked against
that object by `__tests__/unstyled/decisions.test.ts`.

| Quantity                                                              | Value | Source                                                            |
| --------------------------------------------------------------------- | ----- | ----------------------------------------------------------------- |
| Hit area, touch (coarse pointer, or any window narrower than 64rem)   | 45px  | `BUNDU_FLOOR.hitAreaPx`                                           |
| Hit area, desktop (fine pointer with hover, 64rem and up)             | 24px  | `BUNDU_FLOOR.pointerFine.hitAreaPx`                               |
| Desktop drawn minimum (a desktop control is drawn at least this tall) | 28px  | `BUNDU_FLOOR.visibleControlMinPx`                                 |
| Control height: sm, dense, field-sm                                   | 33px  | `spacing-control-sm`, `spacing-control-dense`, `spacing-field-sm` |
| Control height: lg, touch-target-sm                                   | 41px  | `spacing-control-lg`, `--touch-target-sm`                         |

Control heights that are already valid: 36, 28, 48 and 56. Dense controls are drawn smaller than their
default but keep the full hit area (45 touch, 24 desktop) through the hit-area pseudo-element.

Number rule: every spacing or size value is a multiple of 3, a multiple of 7, or a prime. Start from the
recommended value (WCAG, Apple HIG, Material 3) and take the nearest such number at or above it. Never lower.

### Spacing layers

Each layer has a default value (the floor at default density) and a dense value (the absolute floor).
Nothing goes below dense. A layer with no dense step has no dense value.

| Token                     | Default | Dense | `BUNDU_FLOOR.spacing.layers` key |
| ------------------------- | ------- | ----- | -------------------------------- |
| `--space-page-x`          | 17      | none  | `pageX`                          |
| `--space-page-x-wide`     | 28      | 21    | `pageXWide`                      |
| `--space-section`         | 49      | 28    | `section`                        |
| `--space-container`       | 28      | 21    | `containerPadding`               |
| `--space-container-gap`   | 21      | 14    | `containerGap`                   |
| `--space-card`            | 21      | 14    | `cardPadding`                    |
| `--space-card-gap`        | 14      | 7     | `cardGap`                        |
| `--space-card-stack`      | 7       | 7     | `cardStack`                      |
| `--space-control-x`       | 17      | 12    | `controlX`                       |
| `--space-field-x`         | 17      | 12    | `fieldX`                         |
| `--space-control-gap`     | 9       | 7     | `controlGap`                     |
| `--space-control-between` | 9       | 9     | `controlBetween`                 |
| `--space-chip-x`          | 12      | 9     | `chipX`                          |
| `--space-pill-x`          | 9       | 5     | `pillX`                          |
| `--space-pill-gap`        | 5       | 3     | `pillGap`                        |
| `--space-label-gap`       | 7       | 5     | `labelGap`                       |

Layers: controls are buttons, chips and inputs (N2); cards are cards, list items and tiles (N3 composites);
containers are dialogs, sheets and panels; layout is the page edge and the gaps between sections. Sibling
items in a list, grid or toolbar use the card gap. A component whose layer is unknown is held to
`BUNDU_FLOOR.spacing.insetPx` (14) and `gapPx` (7), never weaker than today.

Body text, captions, contrast (7:1 body, 4.5:1 non-body, 3:1 UI) and 1.5 body leading are unchanged.

## Hook vocabulary

Components express structure, state and variant with these attributes, not with classes. The look is in
the pack, keyed on them. Every attribute is set by the component source (tsx, astro and rs alike), so one
selector serves every build.

| Attribute          | Carries                                                                                                            | Example                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| `data-slot`        | The component or part name. Set on the root and on every part.                                                     | `data-slot="button"`          |
| `data-variant`     | The visual variant.                                                                                                | `data-variant="outline"`      |
| `data-size`        | The size.                                                                                                          | `data-size="sm"`              |
| `data-state`       | Interaction or lifecycle state: `enabled`, `disabled`, `open`, `closed`, `checked`, `active`.                      | `data-state="disabled"`       |
| `data-orientation` | `horizontal` or `vertical`, for components with an axis.                                                           | `data-orientation="vertical"` |
| `data-mineral`     | The mineral a brand or a colour role uses. It replaces the `mineral` class and the mineral prop's class output.    | `data-mineral="cobalt"`       |
| `data-own-after`   | Opts an element out of the hit-area pseudo-element. It replaces the class-substring opt-out (`[class*="after:"]`). | `data-own-after`              |

`data-portal` (the component's docs link) and ARIA attributes keep their current meaning. `data-day`, the
calendar's own opt-out, moves to `data-own-after` in the batch that covers calendars. These attributes are
structure, not styling, so they stay in components. Callers that read class output for a mineral move to
`data-mineral` in the major that removes classes.

## Pack layout

The look moves out of components into one first-party pack, `styles/packs/mzizi/`. B0 creates none of it.

- `index.css` declares `@layer mzizi.tokens, mzizi.floor, mzizi.components;`. The layer order is the
  order of precedence: tokens first, then the floor, then the component look.
- `tokens.css` is generated from N1 (`lib/tokens/roles.source.ts`). It replaces `styles/pattern/tokens.css`.
- `floor.css` applies the hit areas, the spacing floor and focus and motion rules to every `[data-slot]`
  interactive. It sets no colour.
- `components/<family>.css` holds one partial per family (primitives, charts, brand, shell, pages, safety,
  resilience, assurance) so batches do not collide.
- Every selector uses `:where()`, so its specificity is zero and an adopter's own classes win.
- `pack.json` is the manifest: slots, required tokens, floor version and brand id. `dist/` is the minified build.
- Other brands ship `styles/packs/<brand>/` with the same manifest and layout, and must pass the same suite.

Adopters who want Tailwind can use the pack's tokens. A Tailwind plugin is not required.

## Where the floor is enforced once components are unstyled

The numbers come from `BUNDU_FLOOR` only. The enforcement layers are:

1. **The numbers.** `lib/tokens/roles.source.ts`, `BUNDU_FLOOR`. Unchanged by the unstyled work.
2. **Pack static check.** `__tests__/theme/floor.test.ts` parses `styles/packs/mzizi` (Lightning CSS, as in
   `mzizi-css`). It asserts `--target-floor` is `2.8125rem` (45px) on touch and `1.5rem` (24px) on a fine
   pointer, the desktop drawn minimum of 28px, the hit area on every `[data-slot]` interactive, the inset,
   gap and leading defaults, focus-visible, reduced motion, and no hex outside `tokens.css`. Every value is
   read from `BUNDU_FLOOR`.
3. **Pack conformance.** `__tests__/theme/pack-conformance.test.ts` checks that a pack declares every required
   slot and token, and that a second brand pack passes the same suite.
4. **Browser geometry (required in CI).** A Kitesurf render (`pnpm browser:check`, see `docs/browser-checks.md`)
   of every contract state under each pack. It measures `getBoundingClientRect` for hit regions, inset, gaps
   and leading on touch and desktop viewports. It is the authoritative gate. The class-based gates
   (`__tests__/spacing-floor.test.ts` and its baseline, and the class-reading runner checks) are removed only
   after this gate reproduces their results.
5. **Contrast.** The resolved colours from the pack's custom properties go through the existing APCA and WCAG
   code (`__tests__/tokens-wcag-minimums.test.ts`, `lint:colors`), retargeted to pack roles.
6. **Component level (the structure gate).** `__tests__/unstyled/structure.test.ts` and
   `contracts/unstyled-baseline.json`. No component source carries a class, style, colour literal, length
   literal or brand reference beyond the class pass-through.

## The structure gate and its baseline

- `__tests__/unstyled/styling-scan.ts` is the heuristic. A file carries styling when its code (comments
  removed) has a class literal or class expression other than a bare pass-through, a class-composition helper
  (`cn`, `cva`, `clsx`), an inline style, a colour literal, a length literal in code, a Tailwind string, or a
  brand reference. It scans `.tsx`, `.ts`, `.astro`, `.rs` and `.css` under `components/registry/`. Counts are
  about ±5%.
- `contracts/unstyled-baseline.json` lists every file that carries styling today. **It may only shrink.** A
  batch removes the entries for the files it unstyles. Adding an entry is a review failure.
- The structure test fails when a file not in the baseline carries styling, when a baseline entry no longer
  carries styling (remove it), and when a baseline entry no longer exists.
- At B0 the baseline holds 744 of the 816 files scanned. The already-unstyled files (the Astro and tsx button,
  the Roots button and the eight Roots components, the four N2 tsx files, the discover-meta pair, `ai-safety.tsx`
  and `mzizi-chaos.tsx`) pass.

## Batch rules

- Every batch is additive until the owner's major. It adds hooks and pack CSS and keeps the look the same.
- Each batch edits only its own baseline keys. The baseline is shared, so merges stay disjoint.
- A batch that changes a floor value goes through `BUNDU_FLOOR` and this doc, in the same PR.
- Banned wording: "Web3", "sister brand", "sister brands", "largest product", "sovereign AI".
