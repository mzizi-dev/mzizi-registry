# Sizes, Apple alignment and density

Owner decision, 2026-11-01 (tracking issue [#597](https://github.com/mzizi-dev/mzizi-registry/issues/597)): Mzizi sizes follow Apple's Human Interface Guidelines on touch, and step down as screens grow. This page is the migration guide.

## Apple references (read 2026-11-01)

| Page                                                                                         | What it says                                                                                                                                                                                                   | Used for                              |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)             | "a button needs a hit region of at least 44x44 pt"                                                                                                                                                             | `--target-floor` on a coarse pointer  |
| [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) | iOS and iPadOS control size: default 44x44 pt, minimum 28x28 pt. macOS: default 28x28, minimum 20x20                                                                                                           | default control, desktop density      |
| [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)       | iOS and iPadOS default 17 pt, minimum 11 pt. Large (default) styles: Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17, Body 17, Callout 16, Subhead 15, Footnote 13, Caption 1 12, Caption 2 11 | type scale on a phone                 |
| [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)               | Decide layout by size class, not device type; keep functionality the same as the space changes                                                                                                                 | density is a size and pointer concept |

Not from Apple: the 24px desktop floor is WCAG 2.2 SC 2.5.8 (Target Size, Minimum, AA), and the 14px desktop body floor is ours. Apple's macOS body is 13 pt, which we do not follow because the floor is higher.

## The three layers

Defined once, in the token layer (`scripts/render-globals-css.ts`, `lib/tokens/roles.source.ts`), emitted into `mzizi-tokens-globals.css`. A component never branches on screen size.

| Layer        | Applies when                                              | Targets                                        | Body text |
| ------------ | --------------------------------------------------------- | ---------------------------------------------- | --------- |
| Phone, touch | the defaults                                              | 44px (large 48px)                              | 17px      |
| Tablet       | `min-width: 48rem`                                        | 44px: an iPad is touched; only type steps down | 16px      |
| Desktop      | `min-width: 64rem` and `pointer: fine` and `hover: hover` | 28 to 40px, floor 24px                         | 15px      |

Density is about visual size only. Screen size is never used to guess network quality: a laptop or an iPad is usually on wifi, so loading behaviour does not depend on it. The gaps between targets are spacing tokens, which density does not change.

## Migration: old to new

| Token (CSS variable)                        | Old            | Phone, tablet                            | Desktop   | Apple reference                                 |
| ------------------------------------------- | -------------- | ---------------------------------------- | --------- | ----------------------------------------------- |
| `--size-touch` / `--spacing-touch`          | 56px           | 44px                                     | 36px      | Buttons: 44x44 pt                               |
| `--size-touch-min` / `--target-floor`       | 48px           | 44px                                     | 24px      | Buttons: 44x44 pt; WCAG 2.2 SC 2.5.8 on desktop |
| `--size-control`                            | 56px           | 44px                                     | 36px      | Accessibility: iOS default 44x44 pt             |
| `--size-control-sm`                         | 48px           | 44px                                     | 32px      | Buttons: 44x44 pt                               |
| `--size-control-lg`                         | 56px           | 48px                                     | 40px      | no Apple size above default on iOS              |
| `--size-control-icon`                       | 48px           | 44px                                     | 36px      | Buttons: 44x44 pt                               |
| `--size-control-dense`                      | 32px           | 32px                                     | 28px      | macOS default 28x28 pt                          |
| `--size-field`                              | 56px           | 44px                                     | 36px      | Accessibility: iOS default 44x44 pt             |
| `--size-field-sm`                           | 48px           | 44px                                     | 32px      | Buttons: 44x44 pt                               |
| `--fs-body`                                 | 16px           | 17px / 16px                              | 15px      | Typography: iOS default 17 pt                   |
| `--fs-small` (`text-body-sm`)               | 14px           | 15px / 14px                              | 14px      | Typography: Subhead 15 pt                       |
| `--fs-h1`                                   | 48px           | 34px                                     | 32px      | Typography: Large Title 34 pt                   |
| `--fs-h2`                                   | 36px           | 28px                                     | 24px      | Typography: Title 1 28 pt                       |
| `--fs-h3`                                   | 30px           | 22px                                     | 20px      | Typography: Title 2 22 pt                       |
| `--fs-h4`                                   | 24px           | 20px                                     | 18px      | Typography: Title 3 20 pt                       |
| `--fs-h5`                                   | 20px           | 17px                                     | 16px      | Typography: Headline 17 pt                      |
| `--fs-h6`                                   | 16px           | 16px                                     | 15px      | Typography: Callout 16 pt                       |
| `--fs-display` / `--fs-display-sm`          | 72 / 60px      | 40 / 34px (tablet and desktop 48 / 40px) | 48 / 40px | none: marketing sizes                           |
| `--fs-caption`, `--fs-body-lg`, `--fs-code` | 12 / 18 / 14px | unchanged                                | unchanged | Caption 1 is 12 pt; Apple's minimum is 11 pt    |
| `--touch-target-lg` / `--touch-target`      | 56 / 48px      | 44 / 44px                                | n/a       | Buttons: 44x44 pt                               |
| badge `fontSize` (`componentTokens`)        | 10px           | 11px                                     | 11px      | Typography: iOS minimum 11 pt                   |

Body text on a phone goes UP by 1px (16 to 17): Apple's iOS default is 17 pt. Everything else on touch goes down or stays.

## Opting out until you migrate

Nothing changes for an app until it takes this registry version. To take the version and keep the old sizes for a while, put the attribute on the root element:

```html
<html data-mzizi-sizes="legacy">
```

It restores every value in the "Old" column (including the 48px floor), and outranks the density layer. Remove it when the app has moved. The attribute is the compatibility alias; it is planned to be removed in the next major version.

## What fails the build

`__tests__/density.test.ts` fails when: a touch target default is under 44px; a desktop size is under 24px or does not step down; desktop body or small text is under 14px or caption under 11px; the density media queries stop requiring a fine pointer and hover, or mention a network signal; the legacy block drifts from the old values; or the contract runner, the Rust evaluator (`mzizi-rs/contract-eval`) or `lib/tokens/index.ts` disagree with `lib/tokens/roles.source.ts`. It also fails if `button` or `input` carries a hard-coded `h-12`/`h-14`.

## Semver

Recommended bump for the registry: a minor under the org policy (a release to `main` is the next minor), because the legacy attribute keeps old sizes available. Recommended bump for `@bundu/ui`, which ships these values to apps: a **major**, because a pinned app that takes the new version changes size without editing a line. Publishing is an owner step.

## Not in this change

- The 34 app and discover contracts and 130-odd components that still hard-code `h-12`/`h-14` (marketing blocks) or use the Dashboard Standard's own `pointer-coarse:` classes (coarse 48px): they already sit at or above 44px on touch and are tracked in #597 for a follow-up.
- `.mz` files (`button.mz` still says `height 56`): they are built elsewhere (see `AGENTS.md`).
- The site, the docs, agent-tools and `@bundu/ui` (`mzizi-dev/packages-npm`) copies: their own repos.
