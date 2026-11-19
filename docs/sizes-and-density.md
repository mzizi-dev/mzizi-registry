# Sizes, hit regions and spacing

Three owner decisions shape this page. Sizes follow Apple's Human Interface Guidelines on touch and step down on a desktop (2026-11-01). The hit-area floor is 45px on touch and 24px on a desktop (2026-11-19, which replaces the 49px and 28px floors of 2026-11-02 and 2026-11-12, #660). Spacing is held to one floor per layer, each with a dense step (2026-11-19).

## The number rule

Every Mzizi spacing or size value is a multiple of 3, a multiple of 7, or a prime number. Start from the recommended value (WCAG, Apple HIG or Material 3) and take the nearest Mzizi number at or above it. A little larger is fine; lower never is. Cards, containers and page layout use multiples of 7. Controls may use any Mzizi number.

Component heights are not changed by this rule. The control heights that do change are the dense and small steps: `spacing-control-sm` and `spacing-control-dense` 32 to 33, `spacing-field-sm` 32 to 33, `spacing-control-lg` 40 to 41, and `--touch-target-sm` 40 to 41. 41 is prime, and it is the nearest Mzizi number at or above 40.

## The hit region

| Tier    | Floor | Built from                               | Where it applies                            | Token                       |
| ------- | ----- | ---------------------------------------- | ------------------------------------------- | --------------------------- |
| Touch   | 45px  | 3 x 15 (WCAG 2.5.5 and Apple ask for 44) | a coarse pointer, or any window under 64rem | `--target-floor: 2.8125rem` |
| Desktop | 24px  | 3 x 8 (WCAG 2.5.8)                       | a fine pointer with hover, 64rem and up     | `--target-floor: 1.5rem`    |

A desktop control is drawn at least 28px (`visibleControlMinPx`, unchanged), so its drawn box holds its 24px hit region. A dense control is drawn smaller and keeps the full hit area, through the hit-area pseudo-element.

- **An element that draws its own `after:` pseudo-element** (`:not([class*="after:"])`): checkbox, switch, radio-group and the tabs line variant keep theirs. A Tailwind `after:` utility overrides the rule.
- **Composite widgets.** A 45px overlay on rows 24 to 36px apart would make each row's overlay cover its neighbours, so menu and listbox rows take `min-height` instead of a pseudo-element.
- **A native `input`, `select` or `textarea`** cannot carry a pseudo-element, so its drawn box is its hit region. The field roles (`h-field`, `h-field-sm`) are 49px on touch, which is above the 45px floor, and step down on a desktop.
- **A link is not covered** (an inline link in text is exempt, as in WCAG 2.5.8). A standalone link that is a target is drawn at 45px on touch.
- **Hit regions may touch, never overlap.** Where two covered controls sit closer than the tier's floor apart, their overlays overlap and the later sibling wins the overlap. Keep gaps from the spacing tokens.

The contract runner and the Rust evaluator count a control's hit region as the tier's floor (45px on touch, 24px on a desktop) only where the rule provably applies: a button-like element with no `after:` of its own.

## The spacing floor, one floor per layer

Each layer has a default value (the floor at default density) and a dense value (the absolute floor). Nothing goes below dense. Dense is for content that needs it, and white space is used where it serves.

| Layer            | Token                     | Default | Dense       | Built from                                  |
| ---------------- | ------------------------- | ------- | ----------- | ------------------------------------------- |
| Layout           | `--space-page-x`          | 17      | none        | prime (Apple and M3 compact 16)             |
| Layout           | `--space-page-x-wide`     | 28      | 21          | 7 x 4 and 7 x 3 (M3 medium and expanded 24) |
| Layout           | `--space-section`         | 49      | 28          | 7 x 7 and 7 x 4 (48)                        |
| Containers       | `--space-container`       | 28      | 21          | 7 x 4 and 7 x 3 (M3 dialog 24)              |
| Containers       | `--space-container-gap`   | 21      | 14          | 7 x 3 and 7 x 2 (M3 dialog 16)              |
| Cards            | `--space-card`            | 21      | 14          | 7 x 3 and 7 x 2 (M3 card 16)                |
| Cards            | `--space-card-gap`        | 14      | 7           | 7 x 2 and 7 (M3 card gap 8)                 |
| Cards            | `--space-card-stack`      | 7       | 7           | 7 (title to body 4)                         |
| Controls         | `--space-control-x`       | 17      | 12          | prime and 3 x 4 (M3 small button 16)        |
| Controls         | `--space-field-x`         | 17      | 12          | prime and 3 x 4 (M3 text field 16)          |
| Controls         | `--space-control-gap`     | 9       | 7           | 3 x 3 and 7 (M3 icon to label 8)            |
| Controls         | `--space-control-between` | 9       | 9           | 3 x 3 (M3 target spacing 8)                 |
| Controls         | `--space-label-gap`       | 7       | 5 (pending) | 7 and prime (label to field 6 to 8)         |
| Chips            | `--space-chip-x`          | 12      | 9           | 3 x 4 and 3 x 3 (M3 chip 12)                |
| Pills and badges | `--space-pill-x`          | 9       | 5           | 3 x 3 and prime (M3 badge 4)                |
| Pills and badges | `--space-pill-gap`        | 5       | 3           | prime (4)                                   |

The dense tokens are named `<token>-dense`, for example `--space-card-dense`. The label-gap and card-gap values for sibling items are derived from the number rule, not stated by the owner, so the owner may still override them.

The base layer applies the dense floor to a bare element. A bare control's inline padding is at least `--space-control-x-dense` (12px), a bare card at least `--space-card-dense` (14px), and a bare dialog, sheet or popover at least `--space-container-dense` (21px). Gaps between controls are 9px (`--space-control-between`).

### The aliases

`BUNDU_FLOOR.spacing` in `lib/tokens/roles.source.ts` is the one source. Four names are kept for consumers that depend on them:

| Name         | Value | Token           | Meaning                                                                                                                |
| ------------ | ----- | --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `insetPx`    | 14px  | `--inset-floor` | The floor for a component with no known layer (today's value)                                                          |
| `gapPx`      | 7px   | `--gap-floor`   | The floor for a component with no known layer (today's value)                                                          |
| `labelGapPx` | 7px   | none            | The global label-to-field floor (layer-blind guards read it); its dense step, 5px, is pending the owner's confirmation |
| `itemGapPx`  | 7px   | none            | The dense floor of `--space-card-gap` for sibling items                                                                |

The `--inset-floor` and `--gap-floor` values are never lowered for a component with no known layer. A density layer never lowers them, and the legacy opt-out sets them to 0.

## The layer-aware checker

The contract runner (`contracts/runner.ts`) and the Rust evaluator (`mzizi-rs/contract-eval`) check each component against its own layer's dense floor. The table is `SPACING_LAYER_FLOORS` in `lib/tokens/roles.source.ts`, and the mapping from contract to layer is `COMPONENT_LAYERS`.

| Layer      | Padding                    | Gap                                                     |
| ---------- | -------------------------- | ------------------------------------------------------- |
| Pills      | 5                          | 3                                                       |
| Chips      | 9                          | 7 (no chip gap is set, so the fallback applies)         |
| Controls   | 12                         | 9 between controls, 7 icon gap, 5 label gap             |
| Cards      | 14                         | 7                                                       |
| Containers | 21                         | 14 (not enforced at class level, see below)             |
| Layout     | 17 page edge, 21 wide edge | 28 section gap (not enforced at class level, see below) |

Rules, in order:

- An interactive element is a control whatever its component is. It is checked at the controls padding.
- Any other element takes its component's layer.
- Between adjacent controls is 9px when the children are controls. A pill's gap is 3px. Everything else keeps the 7px fallback, including chips.
- A component with no known layer keeps 14 and 7 on every element. Enforcement is never weaker than today.

**Not enforced at class level, and why.** The container gap (14) and the layout section gap (28) are not checked by the class-level rule. A class like `gap-2` inside a dialog's header row is an item gap, not a container gap, and a class-level check cannot tell the two apart. The same is true of the layout section gap. Both need a structural check that reads what a gap separates. They are not enforced yet.

The label gap (5) is a relationship between a label and its field, which the markup check does not see. It is documented here and is not checked by the runner.

The mapping in `COMPONENT_LAYERS` is from each component's role: N2 primitives that take input or are pressed are controls; chips and pill-shaped badges are chips and pills; N3 composites that hold content in a box are cards; dialogs, popovers and toasts are containers; page and section frames are layout. A contract that is not listed is checked at the fallback floors.

## Control heights

The heights are size roles, and they step down with the density layer:

| Token                  | Touch | Desktop | Note                                                                 |
| ---------------------- | ----- | ------- | -------------------------------------------------------------------- |
| `--size-control`       | 49px  | 36px    | `componentSpecs.button.heights.default`                              |
| `--size-control-sm`    | 49px  | 33px    | Rounded up from 32 (3 x 11)                                          |
| `--size-control-lg`    | 56px  | 41px    | Rounded up from 40 (prime)                                           |
| `--size-control-dense` | 33px  | 28px    | Rounded up from 32; fine pointer only                                |
| `--size-field-sm`      | 49px  | 33px    | Rounded up from 32                                                   |
| `--touch-target-sm`    | 41px  | none    | Dense secondary action, rounded up from 40; not for primary controls |

Component heights (the touch heights of buttons, inputs and tabs at 49px) are unchanged.

## Text floors

Body text is 17px on touch and 15px on a desktop. Captions, metadata and secondary labels are 14px everywhere. Body line height is at least 1.5 (WCAG 1.4.12). Contrast is 7:1 for body text, 4.5:1 for non-body text and 3:1 for UI parts. These are unchanged by 2026-11-19.

A label chip or pill is held on its inline axis (owner, 2026-11-04, #625), and as of 2026-11-19 it is held to the pill layer's dense floor (`--space-pill-x`, 5px). A pill's block axis is its line height or its fixed height.

## What a test checks

- `__tests__/bundu-floor.test.ts` fails when a default type step is under its floor in any layer, or a hit region under the floor on either tier.
- `__tests__/spacing-floor.test.ts` fails when the spacing numbers differ between `BUNDU_FLOOR`, canon, `/v1/tokens` and the stylesheet; when a density layer lowers `--inset-floor` or `--gap-floor`; when a layer value breaks the number rule; or when the TypeScript and Rust layer tables differ.
- The contract runner and the Rust evaluator read every element of every rendered state (`evaluateSpacing` in `contracts/runner.ts`, and `spacing_violations` in `mzizi-rs/contract-eval`), against the shared table `contracts/spacing-cases.json`.
- `__tests__/spacing-floor.test.ts` counts any gap under 7 (`gap-0`, `gap-px` and `space-*-0`), `p-0`-style resets and negative margins per file against `__tests__/spacing-floor-baseline.json`. A file may not exceed its baseline, and a file below it must lower it.
- `contracts/spacing-geometry.json` specifies the rendered guard once, for a browser audit. This repository has no browser harness of its own.

## Apple and WCAG, for reference

| Source                                                                                       | Number                                                                       | Bundu                                    |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)             | a hit region of at least 44x44 pt                                            | 45px on touch                            |
| WCAG 2.5.5                                                                                   | 44 x 44 CSS px                                                               | 45px on touch                            |
| WCAG 2.5.8                                                                                   | 24 x 24 CSS px                                                               | 24px on a desktop                        |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | iOS default control 44 pt, minimum 28 pt; macOS default 28 pt, minimum 20 pt | 45px touch, 24px desktop hit, 28px drawn |

Bundu goes above Apple where Apple's number is lower than the floor. Bundu keeps 45px on touch, 17px body on touch, and 14px captions (Apple 11 to 12).
