# Sizes, the Bundu floor and density

Two owner decisions shape this page. 2026-11-01 (tracking issue [#597](https://github.com/mzizi-dev/mzizi-registry/issues/597)): sizes follow Apple's Human Interface Guidelines on touch and step down as screens grow. **2026-11-02: the Bundu floor** puts hard minimums under that: body text 17px, captions 14px, a 49px hit region on every control, on every device, desktop included. This page is the migration guide.

## The Bundu floor

Bundu sets the standard for outdoor reading and for people who find technology hard (older users, African and emerging markets), so the minimum is as high as it can be and one Bundu will stand by. The numbers live in one place, `BUNDU_FLOOR` in `lib/tokens/roles.source.ts`; every generator, test, the contract runner and the Rust evaluator read them.

| Floor                              | Value       | Derives from                                                   | Replaces                                         |
| ---------------------------------- | ----------- | -------------------------------------------------------------- | ------------------------------------------------ |
| Body text, every device            | 17px        | Apple's iOS default body size; prime                           | 16px tablet, 15px desktop (2026-11-01)           |
| Captions, metadata, secondary text | 14px        | 2 x 7 (the radius unit)                                        | 15px small, 12px caption, 11px badges            |
| Hit region of every control        | 49px        | 7 x 7, above Apple's 44 pt                                     | 44px coarse (2026-11-01), 24px fine (WCAG 2.5.8) |
| Smallest a control is drawn        | 28px        | 4 x 7; Apple's macOS default control size                      | none                                             |
| Contrast                           | 7 / 4.5 / 3 | WCAG 2: body, non-body text, UI parts (#610, owner 2026-11-02) | none                                             |

The Bundu Order draws on biblical mathematical patterns and prime numbers (owner, 2026-11-02). The radii (4, 7, 12, 14, 17 and a pill) come from the 7px unit and do not change.

### How the hit region works at desktop density

A desktop control may be drawn smaller (28 to 40px) but keeps a 49px hit region. The token layer's `hit-area` rule (`@layer base`, in `mzizi-tokens-globals.css`) gives every `button`, `summary`, `[role="button"]`, `[role="tab"]`, `[role="switch"]` and any `.hit-area` element a transparent `::after` of `max(100%, var(--target-floor))`. `--target-floor` is 49px and no density layer lowers it. The rule **steps aside, on purpose**, for:

- **An element that draws its own `after:` pseudo-element** (`:not([class*="after:"])`): checkbox, switch, radio-group and the tabs line variant keep theirs. A Tailwind `after:` utility overrides only the properties it sets, so the rule's `top`, `left` and `transform` would otherwise mix in. Their hit region is their own box plus their own `after:` inset; the runner counts it as the drawn box.
- **Composite widgets.** Overlaying 49px on rows 28 to 36px apart would make each row's overlay cover its neighbours, and the later sibling steals the click. Menu and listbox rows (`menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`) instead take `min-height: var(--target-floor)` in the same layer (a `min-h-*` utility on the row overrides it, and then the row counts as its drawn box). A calendar day (`[data-day]`) is a grid cell and is left as drawn (owner call: its size comes from `--cell-size`).
- **An element with `overflow: hidden` or `clip`**, which would clip the pseudo-element. Size it at the floor, or put `hit-area` on a wrapper that does not clip.

Other consequences to know:

- A native `input`, `select` or `textarea` cannot carry a pseudo-element, so the field roles (`h-field`, `h-field-sm`) stay 49px drawn at desktop.
- A link is not covered (an inline link in text is exempt, as in WCAG 2.5.8). A standalone link that is a target (nav, breadcrumb, card link) is drawn at 49px, or takes the `hit-area` class. The contracts' known gaps are pinned (see "What fails the build").
- Where two covered controls sit closer than 49px apart, their overlays overlap and the later sibling wins the overlap. Keep gaps from the spacing tokens.
- The rule is in the base layer, so a utility on the element (`absolute`, `inset-*`) wins.
- The contract runner and the Rust evaluator count a control's hit region as 49px only where the rule provably applies (a button-like element with no own `after:` utility and no overflow clipping; a composite row with no `min-h-*`). Otherwise they use the drawn height. They cannot see static positioning or a page that never loaded the stylesheet, so they assume the stylesheet is there. `contracts/hit-region-cases.json` is the shared table both are tested against.

## Apple references (read 2026-11-01)

| Page                                                                                         | What it says                                                                                                                                                                                                   | Used for                              |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)             | "a button needs a hit region of at least 44x44 pt"                                                                                                                                                             | the reference Bundu raises to 49px    |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | iOS and iPadOS control size: default 44x44 pt, minimum 28x28 pt. macOS: default 28x28, minimum 20x20                                                                                                           | smallest drawn control, 28px          |
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)       | iOS and iPadOS default 17 pt, minimum 11 pt. Large (default) styles: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 1 12, Caption 2 11 | body 17px; heading scale on a phone   |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)               | Decide layout by size class, not device type; keep functionality the same as the space changes                                                                                                                 | density is a size and pointer concept |

Bundu goes above Apple where Apple's number is lower than the floor: 49px for hit regions (Apple 44), 14px for captions (Apple 11 to 12), and 17px body on desktop (Apple's macOS body is 13 pt).

## The three layers

Defined once, in the token layer (`scripts/render-globals-css.ts`, `lib/tokens/roles.source.ts`), emitted into `mzizi-tokens-globals.css`. A component never branches on screen size.

| Layer        | Applies when                                              | Controls drawn at        | Hit region | Body | Caption |
| ------------ | --------------------------------------------------------- | ------------------------ | ---------- | ---- | ------- |
| Phone, touch | the defaults                                              | 49px (large 56px)        | 49px       | 17px | 14px    |
| Tablet       | `min-width: 48rem`                                        | 49px: an iPad is touched | 49px       | 17px | 14px    |
| Desktop      | `min-width: 64rem` and `pointer: fine` and `hover: hover` | 28 to 40px (fields 49px) | 49px       | 17px | 14px    |

Only display and heading sizes step down as screens grow (tablet: display; desktop: display and H1 to H4). Body and secondary text never do. A touchscreen laptop also reports a coarse pointer (`any-pointer: coarse`), so the desktop layer does not apply to it.

Density is about visual size only. Screen size is never used to guess network quality. The gaps between targets are spacing tokens, which density does not change.

## Migration: old to new

"Old" is the 2026-11-01 value (registry 4.21.0 and later); the `legacy` column is what `data-mzizi-sizes="legacy"` restores.

| Token (CSS variable)                         | Old (2026-11-01)    | New: phone, tablet | New: desktop    | Legacy    |
| -------------------------------------------- | ------------------- | ------------------ | --------------- | --------- |
| `--size-touch` / `--spacing-touch`           | 44px / 36px desktop | 49px               | 36px (hit 49px) | 56px      |
| `--size-touch-min` / `--target-floor`        | 44px / 24px desktop | 49px               | 49px            | 48px      |
| `--control-floor` (new: smallest drawn)      | none                | 49px               | 28px            | 48px      |
| `--size-control`                             | 44px / 36px         | 49px               | 36px (hit 49px) | 56px      |
| `--size-control-sm`                          | 44px / 32px         | 49px               | 32px (hit 49px) | 48px      |
| `--size-control-lg`                          | 48px / 40px         | 56px               | 40px (hit 49px) | 56px      |
| `--size-control-icon`                        | 44px / 36px         | 49px               | 36px (hit 49px) | 48px      |
| `--size-control-dense`                       | 32px / 28px         | 32px (hit 49px)    | 28px (hit 49px) | 32px      |
| `--size-field`                               | 44px / 36px         | 49px               | 49px            | 56px      |
| `--size-field-sm`                            | 44px / 32px         | 49px               | 49px            | 48px      |
| `--fs-body`                                  | 17px / 16px / 15px  | 17px               | 17px            | 16px      |
| `--fs-small` (`text-body-sm`, `text-sm`)     | 15px / 14px         | 14px               | 14px            | 14px      |
| `--fs-caption` (`text-xs`)                   | 12px                | 14px               | 14px            | 12px      |
| `--fs-h6`                                    | 16px / 15px         | 17px               | 17px            | 16px      |
| `--fs-h5`                                    | 17px / 16px         | 17px               | 17px            | 20px      |
| `--fs-body-lg`, `--fs-code`                  | 18px / 14px         | unchanged          | 18px (was 17px) | unchanged |
| `text-base` (Tailwind's default step)        | 16px                | 17px               | 17px            | 16px      |
| `--touch-target-lg` / `--touch-target`       | 44 / 44px           | 49 / 49px          | 36 / 32px       | 56 / 48px |
| badge `fontSize`, chart axis labels          | 10 to 12px          | 14px               | 14px            | n/a       |
| brand `componentSpecs` button / input / tabs | 44px (large 48px)   | 49px (large 56px)  | n/a             | n/a       |

`--fs-h1` to `--fs-h4` and the display sizes are unchanged (they were already at or above 17px). The `text-xs` step is Tailwind's own (12px by default); the token layer now registers `--text-xs`, `--text-sm` and `--text-base` as 14, 14 and 17px, so a component that names them paints the floor.

Components: every arbitrary `text-[8px]` to `text-[13px]` (about 340 uses in 150 registry files) is now `text-sm` (14px), and the registry's chart axis and label sizes are 14px. `native-select` takes its height from the field roles (`h-field`, `h-field-sm`) instead of `h-12` and `h-8`. Expect denser layouts to need room: a badge or a meta label that fitted at 10px is now 14px.

## What to do in an app

1. Take this registry version (or `@bundu/ui` built from it) and re-run `pnpm tokens:sync` or re-copy `mzizi-tokens-globals.css`.
2. Replace any `h-12`, `h-14`, `min-h-[44px]` on a control with a size role (`h-control`, `h-field`, `min-h-touch-min`). A drawn size under 49px is fine at desktop for a button-like control, never for a field or a standalone link.
3. Replace any `text-[Npx]` under 14 with `text-sm`; keep body copy on `text-base` or `text-body`.
4. If a layout breaks and cannot move yet, set `<html data-mzizi-sizes="legacy">` (below) and plan the move.

## Opting out until you migrate

Nothing changes for an app until it takes this registry version. To take the version and keep the old sizes for a while, put the attribute on the root element:

```html
<html data-mzizi-sizes="legacy">
```

It restores every value in the "Legacy" column (including the 48px floor and the 56px, 48px sizes), and outranks the density layer. It also steps out of the Bundu floor: 16px body, 12px captions, 48px targets. `text-xs` and `text-base` follow `--fs-caption` and `--fs-body`, so they step out of the floor with it. Remove the attribute when the app has moved. It is the compatibility alias; it is planned to be removed in the next major version.

## What fails the build

`__tests__/bundu-floor.test.ts` fails when: any default type step is under its floor (body and headings 17px, small, caption and code 14px) in any layer, or `text-xs`, `text-sm` or `text-base` is mapped under it; a size role marked `floor` is under 49px; `--target-floor` is lowered in the tablet or desktop layer, or the `hit-area` rule is gone; a desktop size is drawn under 28px, or a native field is drawn under 49px; the floor numbers differ between `BUNDU_FLOOR`, canon (`brandMeta`), `/v1/tokens` (`lib/tokens/index.ts`), the contract runner and the Rust evaluator; or a registry component names an arbitrary text size under 14px.

`__tests__/density.test.ts` keeps the density rules (media queries need a fine pointer and hover and never a network signal, the legacy block restores the old values, the copies of the size table agree).

The contract runner and the Rust evaluator fail any density row whose interactive control has a hit region under 49px on either pointer, or a button-like control drawn under 28px. Rows that predate the floor (`HIT_AREA_GAPS` in `contracts/runner.ts` and in `mzizi-rs/contract-eval/contract_eval.rs`, held equal by a test) are pinned and skipped; a new row cannot join the list without a reviewer seeing it, and the follow-up removes them as each build passes.

## Semver

Owner decision, 2026-11-02: `@bundu/ui` takes a **minor** bump, not a major, "we not a major bump yet". The registry release is also a minor under the org policy (a release to `main` is the next minor). Because a minor lets an app on a caret range pick the new sizes up without editing a line, the compatibility alias is the safety net: an app that is not ready sets `<html data-mzizi-sizes="legacy">` before it takes the version, and removes it when it has migrated. Publishing is an owner step.

## Not in this change

- The pinned `HIT_AREA_GAPS` rows: app and discover components whose links, or whose controls drawn on a literal `h-11`/`h-12`, are under 49px. Each moves onto a size role or takes `hit-area`; tracked in #597.
- Arbitrary text sizes of 15px and 16px (about 20 uses): they could be body or secondary text, so they are not rewritten here.
- `.mz` files (`button.mz` still says `height 56`; `badge.mz` and `status-badge.mz` still say `h-5` and `text-[10px]`): they are built elsewhere (see `AGENTS.md`) and were not edited.
- The site, the docs, agent-tools and `@bundu/ui` (`mzizi-dev/packages-npm`) copies: their own repos.
