# Sizes, the Bundu floor and density

Two owner decisions shape this page. 2026-11-01 (tracking issue [#597](https://github.com/mzizi-dev/mzizi-registry/issues/597)): sizes follow Apple's Human Interface Guidelines on touch and step down as screens grow. **2026-11-02: the Bundu floor** puts hard minimums under that: body text 17px, captions 14px, a 49px hit region on every control. **2026-11-12 (#660): the floor has two pointer tiers.** Touch keeps the numbers above; a desktop (a fine pointer with hover) keeps a 28px hit region and 15px body, captions still 14px, because Apple treats macOS as a denser tier and 49px controls with 17px text on every desktop screen cost a great deal of scrolling. This page is the migration guide.

## The Bundu floor

Bundu sets the standard for outdoor reading and for people who find technology hard (older users, African and emerging markets), so the minimum is as high as it can be and one Bundu will stand by. The numbers live in one place, `BUNDU_FLOOR` in `lib/tokens/roles.source.ts`; every generator, test, the contract runner and the Rust evaluator read them.

| Floor                                | Value       | Derives from                                                   | Replaces                               |
| ------------------------------------ | ----------- | -------------------------------------------------------------- | -------------------------------------- |
| Body text, touch                     | 17px        | Apple's iOS default body size; prime                           | 16px tablet, 15px desktop (2026-11-01) |
| Body text, desktop                   | 15px        | owner ruling 2026-11-12 (Apple's macOS default is 13 pt)       | 17px on every device (2026-11-02)      |
| Captions, metadata, secondary text   | 14px        | 2 x 7 (the radius unit)                                        | 15px small, 12px caption, 11px badges  |
| Hit region of every control, touch   | 49px        | 7 x 7, above Apple's 44 pt                                     | 44px coarse (2026-11-01)               |
| Hit region of every control, desktop | 28px        | 4 x 7, Apple's macOS default control, above WCAG 2.5.8's 24px  | 49px on every device (2026-11-02)      |
| Smallest a control is drawn          | 28px        | 4 x 7; Apple's macOS default control size                      | none                                   |
| Contrast                             | 7 / 4.5 / 3 | WCAG 2: body, non-body text, UI parts (#610, owner 2026-11-02) | none                                   |

The Bundu Order draws on biblical mathematical patterns and prime numbers (owner, 2026-11-02). The radii (4, 7, 12, 14, 17 and a pill) come from the 7px unit and do not change.

### The spacing floor (owner, 2026-11-04, #617)

Beside the sizes, the Bundu floor sets minimums for **space**: padding, gaps and leading that nothing can go under, even a component that sets no padding at all. `BUNDU_FLOOR.spacing` holds them, on the 7px unit.

| Floor          | Value | CSS custom property | Meaning                                                     |
| -------------- | ----- | ------------------- | ----------------------------------------------------------- |
| `insetPx`      | 14px  | `--inset-floor`     | Padding between text and the edge of its container (2 x 7)  |
| `controlGapPx` | 7px   | `--gap-floor`       | Gap between adjacent controls, visible edge to visible edge |
| `labelGapPx`   | 7px   | `--gap-floor`       | Gap between a label and its field                           |
| `itemGapPx`    | 7px   | `--gap-floor`       | Gap between sibling items of a list, grid, stack or toolbar |
| `leadingBody`  | 1.5   | `--leading-floor`   | Body line height (WCAG 1.4.12)                              |

- **The variables** are in `:root` of `mzizi-tokens-globals.css`, never lowered by a density layer, and registered as the fixed size roles `spacing-inset-floor` and `spacing-gap-floor` (`px-inset-floor`, `p-inset-floor`, `gap-gap-floor`), so the platform token files carry 14 and 7 as they carry 49. `/v1/brand` (`brand_meta.accessibility.minInset`, `minControlGap`, `minLabelGap`, `minItemGap`, `minBodyLeading`) and `/v1/tokens` (`spacingFloor`) carry them too.
- **The base layer enforces defaults** for a component that sets nothing: `padding-inline: var(--inset-floor)` on a bare `button`, `select`, `textarea` or text `input`; `padding: var(--inset-floor)` on a bare text surface (a native `dialog`, a `[popover]`, an alert, a tooltip, a card with no structured children); `gap: var(--gap-floor)` on a list, group, toolbar or tablist; `line-height: max(var(--lh-body), var(--leading-floor))` on `body`. It steps aside for an icon-only button, an empty element, a fixed square (`size-*`), a calendar day and the native checkbox, radio, range, colour and file inputs, and for a card whose padding lives on its `card-header` / `card-content` children (padding both would pad twice).
- **A utility is the author's own value.** `p-6` or `gap-2` on the element wins over the base layer, so the tests hold every explicit value to the floor.
- **A control's block axis is held by its height.** 14px of block padding does not fit a control drawn at 28px, so the inset floor is the inline axis for a control, and both axes for a surface.
- **A label chip or pill is held on its inline axis (owner, 2026-11-04, #625).** A one-line chip or pill (a badge, a status pill, the hero's status pill, an eyebrow) keeps 14px between its text and its left and right edges. Its block axis is its line height or its fixed height (`h-*`), not 14px of padding: a 14px block inset would make a label chip about 49px tall, and the 28px and 49px floors already decide that axis. A surface (card, panel, dialog, alert, popover) keeps 14px on both axes. This is what the contract runner already enforces; nothing was relaxed.
- **Hit regions may touch, never overlap.** The gap floor is measured between visible edges. The `hit-area` overlay of the hit-region floor may reach into neighbouring space, as it did.
- **Legacy.** `data-mzizi-sizes="legacy"` sets the three variables to 0, 0 and 1, so every base rule above is a no-op.

### How the hit region works at desktop density

A desktop control is drawn 28 to 40px and its hit region is 28px (`BUNDU_FLOOR.pointerFine.hitAreaPx`), so a desktop control's drawn box is its hit region and the rule below never grows one there. On touch the hit region is 49px. The token layer's `hit-area` rule (`@layer base`, in `mzizi-tokens-globals.css`) gives every `button`, `summary`, `[role="button"]`, `[role="tab"]`, `[role="switch"]` and any `.hit-area` element a transparent `::after` of `max(100%, var(--target-floor))`. `--target-floor` is 49px, and only the desktop density layer lowers it, to 28px. The rule **steps aside, on purpose**, for:

- **An element that draws its own `after:` pseudo-element** (`:not([class*="after:"])`): checkbox, switch, radio-group and the tabs line variant keep theirs. A Tailwind `after:` utility overrides only the properties it sets, so the rule's `top`, `left` and `transform` would otherwise mix in. Their hit region is their own box plus their own `after:` inset; the runner counts it as the drawn box.
- **Composite widgets.** Overlaying a touch-sized (49px) hit region on rows 28 to 36px apart would make each row's overlay cover its neighbours, and the later sibling steals the click. Menu and listbox rows (`menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`) instead take `min-height: var(--target-floor)` in the same layer (a `min-h-*` utility on the row overrides it, and then the row counts as its drawn box). A calendar day (`[data-day]`) is a grid cell and is left as drawn (owner call: its size comes from `--cell-size`).
- **An element with `overflow: hidden` or `clip`**, which would clip the pseudo-element. Size it at the floor, or put `hit-area` on a wrapper that does not clip.

Other consequences to know:

- A native `input`, `select` or `textarea` cannot carry a pseudo-element, so its drawn box is its hit region. The field roles (`h-field`, `h-field-sm`) are 49px on touch and step down to 36px and 32px on a desktop, above the 28px floor.
- A link is not covered (an inline link in text is exempt, as in WCAG 2.5.8). A standalone link that is a target (nav, breadcrumb, card link) is drawn at 49px on touch (28px or more on a desktop), or takes the `hit-area` class. The contracts' known gaps are pinned (see "What fails the build").
- Where two covered controls sit closer than the tier's hit region apart (49px on touch), their overlays overlap and the later sibling wins the overlap. Keep gaps from the spacing tokens.
- The rule is in the base layer, so a utility on the element (`absolute`, `inset-*`) wins.
- The contract runner and the Rust evaluator count a control's hit region as the tier's floor (49px on touch, 28px on a desktop) only where the rule provably applies (a button-like element with no own `after:` utility and no overflow clipping; a composite row with no `min-h-*`). Otherwise they use the drawn height. They cannot see static positioning or a page that never loaded the stylesheet, so they assume the stylesheet is there. `contracts/hit-region-cases.json` is the shared table both are tested against.

## Apple references (read 2026-11-01)

| Page                                                                                         | What it says                                                                                                                                                                                                   | Used for                              |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)             | "a button needs a hit region of at least 44x44 pt"                                                                                                                                                             | the reference Bundu raises to 49px    |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | iOS and iPadOS control size: default 44x44 pt, minimum 28x28 pt. macOS: default 28x28, minimum 20x20                                                                                                           | smallest drawn control, 28px          |
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)       | iOS and iPadOS default 17 pt, minimum 11 pt. Large (default) styles: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 1 12, Caption 2 11 | body 17px; heading scale on a phone   |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)               | Decide layout by size class, not device type; keep functionality the same as the space changes                                                                                                                 | density is a size and pointer concept |

Bundu goes above Apple where Apple's number is lower than the floor: 49px for hit regions (Apple 44), 14px for captions (Apple 11 to 12), and 17px body on touch. On a desktop Bundu keeps 28px hit regions (Apple's macOS default control is 28 pt) and 15px body (Apple's macOS body is 13 pt).

## The three layers

Defined once, in the token layer (`scripts/render-globals-css.ts`, `lib/tokens/roles.source.ts`), emitted into `mzizi-tokens-globals.css`. A component never branches on screen size.

| Layer        | Applies when                                              | Controls drawn at              | Hit region | Body | Caption |
| ------------ | --------------------------------------------------------- | ------------------------------ | ---------- | ---- | ------- |
| Phone, touch | the defaults                                              | 49px (large 56px)              | 49px       | 17px | 14px    |
| Tablet       | `min-width: 48rem`                                        | 49px: an iPad is touched       | 49px       | 17px | 14px    |
| Desktop      | `min-width: 64rem` and `pointer: fine` and `hover: hover` | 28 to 40px (fields 32 to 36px) | 28px       | 15px | 14px    |

Display and heading sizes step down as screens grow (tablet: display; desktop: display and H1 to H4), and on a desktop body steps down to 15px (body large to 17px). Secondary text never steps down. A touchscreen laptop also reports a coarse pointer (`any-pointer: coarse`), so the desktop layer does not apply to it.

Density is about visual size only. Screen size is never used to guess network quality. The gaps between targets are spacing tokens, which density does not change.

## Migration: old to new

"Old" is the 2026-11-01 value (registry 4.21.0 and later); the `legacy` column is what `data-mzizi-sizes="legacy"` restores.

| Token (CSS variable)                         | Old (2026-11-01)    | New: phone, tablet | New: desktop    | Legacy    |
| -------------------------------------------- | ------------------- | ------------------ | --------------- | --------- |
| `--size-touch` / `--spacing-touch`           | 44px / 36px desktop | 49px               | 36px (hit 28px) | 56px      |
| `--size-touch-min` / `--target-floor`        | 44px / 24px desktop | 49px               | 28px            | 48px      |
| `--control-floor` (new: smallest drawn)      | none                | 49px               | 28px            | 48px      |
| `--size-control`                             | 44px / 36px         | 49px               | 36px (hit 28px) | 56px      |
| `--size-control-sm`                          | 44px / 32px         | 49px               | 32px (hit 28px) | 48px      |
| `--size-control-lg`                          | 48px / 40px         | 56px               | 40px (hit 28px) | 56px      |
| `--size-control-icon`                        | 44px / 36px         | 49px               | 36px (hit 28px) | 48px      |
| `--size-control-dense`                       | 32px / 28px         | 32px (hit 28px)    | 28px (hit 28px) | 32px      |
| `--size-field`                               | 44px / 36px         | 49px               | 36px            | 56px      |
| `--size-field-sm`                            | 44px / 32px         | 49px               | 32px            | 48px      |
| `--fs-body`                                  | 17px / 16px / 15px  | 17px               | 15px            | 16px      |
| `--fs-small` (`text-body-sm`, `text-sm`)     | 15px / 14px         | 14px               | 14px            | 14px      |
| `--fs-caption` (`text-xs`)                   | 12px                | 14px               | 14px            | 12px      |
| `--fs-h6`                                    | 16px / 15px         | 17px               | 17px            | 16px      |
| `--fs-h5`                                    | 17px / 16px         | 17px               | 17px            | 20px      |
| `--fs-body-lg`, `--fs-code`                  | 18px / 14px         | unchanged          | 17px, 14px      | unchanged |
| `text-base` (Tailwind's default step)        | 16px                | 17px               | 17px            | 16px      |
| `--touch-target-lg` / `--touch-target`       | 44 / 44px           | 49 / 49px          | 36 / 32px       | 56 / 48px |
| badge `fontSize`, chart axis labels          | 10 to 12px          | 14px               | 14px            | n/a       |
| brand `componentSpecs` button / input / tabs | 44px (large 48px)   | 49px (large 56px)  | n/a             | n/a       |

`--fs-h1` to `--fs-h4` and the display sizes are unchanged (they were already at or above 17px). The `text-xs` step is Tailwind's own (12px by default); the token layer now registers `--text-xs`, `--text-sm` and `--text-base` as 14, 14 and 17px, so a component that names them paints the floor.

Components: every arbitrary `text-[8px]` to `text-[13px]` (about 340 uses in 150 registry files) is now `text-sm` (14px), and the registry's chart axis and label sizes are 14px. `native-select` takes its height from the field roles (`h-field`, `h-field-sm`) instead of `h-12` and `h-8`. Expect denser layouts to need room: a badge or a meta label that fitted at 10px is now 14px.

## What to do in an app

1. Take this registry version (or `@bundu/ui` built from it) and re-run `pnpm tokens:sync` or re-copy `mzizi-tokens-globals.css`.
2. Replace any `h-12`, `h-14`, `min-h-[44px]` on a control with a size role (`h-control`, `h-field`, `min-h-touch-min`). A drawn size under 49px is fine at desktop (down to 28px) for any control, and on touch for none.
3. Replace any `text-[Npx]` under 14 with `text-sm`; keep body copy on `text-base` or `text-body`.
4. If a layout breaks and cannot move yet, set `<html data-mzizi-sizes="legacy">` (below) and plan the move.

## Opting out until you migrate

Nothing changes for an app until it takes this registry version. To take the version and keep the old sizes for a while, put the attribute on the root element:

```html
<html data-mzizi-sizes="legacy">
```

It restores every value in the "Legacy" column (including the 48px floor and the 56px, 48px sizes), and outranks the density layer. It also steps out of the Bundu floor: 16px body, 12px captions, 48px targets. `text-xs` and `text-base` follow `--fs-caption` and `--fs-body`, so they step out of the floor with it. Remove the attribute when the app has moved. It is the compatibility alias; it is planned to be removed in the next major version.

## What fails the build

`__tests__/bundu-floor.test.ts` fails when: any default type step is under its floor (touch: body and headings 17px; desktop: body 15px; small, caption and code 14px everywhere) in any layer, or `text-xs`, `text-sm` or `text-base` is mapped under it; a size role marked `floor` is under 49px; `--target-floor` is lowered in the tablet layer or lowered below 28px in the desktop layer, or the `hit-area` rule is gone; a desktop size is drawn under 28px, or a native field is drawn under 28px on a desktop; the floor numbers differ between `BUNDU_FLOOR`, canon (`brandMeta`), `/v1/tokens` (`lib/tokens/index.ts`), the contract runner and the Rust evaluator; or a registry component names an arbitrary text size under 14px.

`__tests__/density.test.ts` keeps the density rules (media queries need a fine pointer and hover and never a network signal, the legacy block restores the old values, the copies of the size table agree).

The contract runner and the Rust evaluator fail any density row whose interactive control has a hit region under 28px on a fine pointer or under 49px on a coarse one, or a button-like control drawn under 28px. Rows that predate the floor (`HIT_AREA_GAPS` in `contracts/runner.ts` and in `mzizi-rs/contract-eval/contract_eval.rs`, held equal by a test) are pinned and skipped; a new row cannot join the list without a reviewer seeing it, and the follow-up removes them as each build passes.

`__tests__/spacing-floor.test.ts` fails when the spacing numbers differ between `BUNDU_FLOOR`, canon, `/v1/tokens` and the stylesheet, when a density layer lowers `--inset-floor`, `--gap-floor` or `--leading-floor`, when the base-layer rules are gone, or when a platform token file lacks the 14 and 7 roles.

### What fails the build, for spacing (#617)

- **Every contract component, every format.** `evaluateSpacing` in `contracts/runner.ts` (React and Astro) and `spacing_violations` in `mzizi-rs/contract-eval` (Rust) read every element of every rendered state and fail: a `gap-*` or `space-*` under 7px on an element with two or more children; padding under 14px on an element with text of its own that draws an edge (inline axis; block axis too, unless the element is a control, fixes its own height or is inline-level, because its height or line height decides that axis); a negative margin on a text container; a tight `leading-*` (`none`, `tight`, `snug`, a number under 1.5) on `p`, `li`, `dd`, `blockquote`, `figcaption`, `td` or `th`. A class is read through its variants (`sm:gap-0` counts). `contracts/spacing-cases.json` is the shared table both evaluators answer identically.
- **Exceptions are pinned and have reasons.** `SPACING_GAPS` in `contracts/runner.ts` (and its key-for-key copy in the Rust evaluator) lists the four: a chart's 1px bars, a joined search-and-submit toolbar, a card that bleeds an image to its edge, and inline code in running text. A fifth needs a reviewer to read its reason.
- **Every registry component, from source.** `__tests__/spacing-floor.test.ts` counts `gap-0`/`gap-px`/`space-*-0` gaps, `p-0`-style resets and negative margins per file against `__tests__/spacing-floor-baseline.json`: a file may not exceed its baseline, a file that improved must lower it, and a line (or the line after one) carrying `spacing-floor: exception <reason>` is not counted. Regenerate with `UPDATE_SPACING_BASELINE=1 pnpm vitest run __tests__/spacing-floor.test.ts`.
- **Rendered geometry.** This repository has no browser harness (`scripts/kitesurf.ts` is a remote text probe), so `contracts/spacing-geometry.json` specifies the guard once: what to measure (control gap, label gap, item gap, text inset, body leading), the minimum each reads from the floor, the WCAG 1.4.12 stress (line height 1.5, paragraph spacing 2x, letter spacing 0.12em, word spacing 0.16em, nothing clipped or overflowing) and the breakpoints. A repository that renders pages (mzizi-site's `audit-ui.mjs --guard`, the CLI's check) runs it.

## Semver

Owner decision, 2026-11-02: `@bundu/ui` takes a **minor** bump, not a major, "we not a major bump yet". The registry release is also a minor under the org policy (a release to `main` is the next minor). Because a minor lets an app on a caret range pick the new sizes up without editing a line, the compatibility alias is the safety net: an app that is not ready sets `<html data-mzizi-sizes="legacy">` before it takes the version, and removes it when it has migrated. Publishing is an owner step.

## Not in this change

- The pinned `HIT_AREA_GAPS` rows: app and discover components whose links, or whose controls drawn on a literal `h-11`/`h-12`, are under 49px on touch. Each moves onto a size role or takes `hit-area`; tracked in #597.
- Arbitrary text sizes of 15px and 16px (about 20 uses): they could be body or secondary text, so they are not rewritten here.
- `.mz` files (`button.mz` still says `height 56`; `badge.mz` and `status-badge.mz` still say `h-5` and `text-[10px]`): they are built elsewhere (see `AGENTS.md`) and were not edited.
- The site, the docs, agent-tools and `@bundu/ui` (`mzizi-dev/packages-npm`) copies: their own repos.
