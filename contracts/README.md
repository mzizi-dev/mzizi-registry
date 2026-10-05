# Component contracts

Owner decision, 2026-10-04: "the components should also be updated, same as the mzizi language — every component should have a contract." This directory holds those contracts, one machine-readable file per component. Tracking: [#404](https://github.com/mzizi-dev/mzizi-registry/issues/404).

Three families. The first is `app/`: the 31 server-rendered app components of `@bundu/ui` (`mzizi-dev/packages-npm`, `packages/bundu-ui/src/app/*.astro`). Together they are the **Mzizi Dashboard Standard**, the one dashboard design for every product in the Bundu ecosystem, with each brand's mineral as an overlay. The standard is published at [docs.mzizi.dev/patterns/dashboard-standard](https://docs.mzizi.dev/patterns/dashboard-standard). The second is `discover/`, the **Mzizi Discover Standard** ([below](#the-discover-standard-discover)). The third is `primitives/`: registry primitives whose contract is not (yet) part of a `@bundu/ui` standard, so the registry's own builds implement it in full ([below](#registry-primitives-primitives)).

**One contract per component, whatever the language** (owner, 2026-10-05; [#427](https://github.com/mzizi-dev/mzizi-registry/issues/427)). The contract is the only place a component's clauses, checks and density are written. Every build of the component, whether Astro, React (`.tsx`), Mzizi Roots (`.rs`) or the Mzizi language (`.mz`), is checked against that one file, and no build carries contract text of its own: where a `.rs` or `.mz` needs the contract inline (`pub const CONTRACT`, a `contract … end` block), `pnpm contracts:sync` writes it from here.

## What a contract is

`schema/component-contract.schema.json` is the format. Each `<family>/<name>.contract.json` is versioned on its own (`version`, semver: major when a clause, prop, slot or state is removed or narrowed; minor when one is added; patch for prose) and states:

| Field | What it holds |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `props`, `slots` | Every prop with its TypeScript type, whether it is required, its default and its closed set of values; every slot and what it is for. |
| `behaviour` | What the component does, in sentences. |
| `states` | Named fixtures: props (`{"$url": "…"}` is a URL) and slot HTML. `default` is required. Every runner renders every state. |
| `accessibility` | Roles, keyboard, focus and ARIA, and the WCAG 2.2 criteria it is built to meet. |
| `density` | Heights in px for a fine pointer and a coarse one (touch), read from the rendered classes by the spacing scale. |
| `theming` | The semantic tokens it reads, what a brand overlay changes (only colour: `--primary`, `--ring`, the shell's `--app-accent`, and the mark), and the status colours it may name. |
| `noJs` | `none` (no script) or `enhancement` (one script; everything in `without` works when it does not run). |
| `responsive` | Its rules from 320px up. |
| `contract` | A `contract … end` block in the Mzizi language's clause grammar ([`mzizi-dev/mzizi` RFC-0006 and RFC-0010](https://github.com/mzizi-dev/mzizi/tree/main/design)), the subset that applies to rendered markup. |
| `checks` | Assertions on the rendered markup by CSS selector: a count, a minimum, absence, attributes, text. |
| `implementations` | The Astro export, and the React (`.tsx`), Rust (`.rs`) and Mzizi language (`.mz`) registry items that implement the same contract, or `null`, each with its `identity`: `slot`, `slot+role` or `slot+variants` (identity only, with `divergences`), or `contract` (it implements the whole contract). `related` lists items with a similar purpose and a different contract. |
| `gaps` | Where the current build falls short of the standard, recorded rather than hidden. |

The clause subset: subjects `slot`, `role`, `label`, `class` and `portal` (the root element's attribute), `<element> "<text>"` (with `min_height`), `uses <data-slot>`, and `when <state> …`; predicates `is`, `contains`, `not_empty`, `in`, `uses "--token"`, `min_height` and `shows`. As in the language, **a clause, check or density row that a runner cannot evaluate fails**: an unevaluable contract must never read as a passing one (RFC-0006, FM-12).

## How contracts are checked

- **Astro (every component).** `mzizi-dev/packages-npm` ships a copy of this directory in `@bundu/ui` (`pnpm contracts:fetch`, `pnpm contracts:check`) and its `src/app/contracts.test.ts` renders every component in every state and evaluates the clauses, checks, density and the brand-overlay rule (no colour values; minerals only as declared status colours), the no-JS rule, and that the `.astro` file's props and slots are exactly the contract's.
- **React, Rust and Mzizi (where they exist).** `__tests__/contracts/contracts.test.tsx` here validates every contract against the schema and the clause grammar, and checks each declared sibling's identity: it renders the `.tsx` (the root `data-slot`, and `data-variant` for every variant or the `role`, as `identity` says), and reads the `.rs` and the `.mz` for the same `data-slot`, variants and role.
- **`identity: "contract"` is evaluated in full, in every language.** The `.tsx` is rendered in every state and every clause, check and density row is evaluated on its markup (`__tests__/contracts`). The `.rs` is rendered in every state with `dioxus-ssr` and the same clauses and checks are evaluated by the crate's contract suite (`mzizi-rs/crates/<crate>/tests/contracts_json.rs`, through the shared evaluator in `mzizi-rs/contract-eval/`). The `.mz` carries the clauses `mz contract` can evaluate on its source (the root's `slot`, `portal`, `role`, `label` and `class`, and `min_height`), written by `pnpm contracts:sync` and checked by `pnpm mz:check`; the `when <state>` clauses and checks need a rendered state, which the language cannot produce yet, and are held by the `.tsx` and `.rs` runners.
- **`pnpm contracts:sync` / `pnpm contracts:sync:check`** write each `contract`-identity contract into its `.rs` (`pub const CONTRACT`) and its `.mz` (`contract … end`). CI fails if either copy differs from this directory.
- **Never edit the copy in packages-npm.** Change the contract here; the package follows.

## Coverage

`identity` is what the sibling shares with the Astro build: `slot`, `slot+role` or `slot+variants`. `—` means there is no implementation of this contract in that language yet.

| Contract                 | Component         | Node | Version | React `.tsx`            | Rust `.rs`              | Mzizi `.mz`             |
| ------------------------ | ----------------- | ---- | ------- | ----------------------- | ----------------------- | ----------------------- |
| `app/app-shell`          | AppShell          | N7   | 1.1.0   | —                       | —                       | —                       |
| `app/side-nav`           | SideNav           | N7   | 1.0.0   | —                       | —                       | —                       |
| `app/workspace-switcher` | WorkspaceSwitcher | N7   | 1.0.0   | —                       | —                       | —                       |
| `app/quick-search`       | QuickSearch       | N7   | 1.0.0   | —                       | —                       | —                       |
| `app/command-palette`    | CommandPalette    | N7   | 1.0.0   | —                       | —                       | —                       |
| `app/top-bar-action`     | TopBarAction      | N7   | 1.0.0   | —                       | —                       | —                       |
| `app/page-header`        | PageHeader        | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/toolbar`            | Toolbar           | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/toolbar-menu`       | ToolbarMenu       | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/stat-tiles`         | StatTiles         | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/stat-tile`          | StatTile          | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/info-tip`           | InfoTip           | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/empty-state`        | EmptyState        | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/brand-mark`         | BrandMark         | N3   | 1.0.0   | —                       | —                       | —                       |
| `app/data-table`         | DataTable         | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/filter-bar`         | FilterBar         | N6   | 1.1.0   | —                       | —                       | —                       |
| `app/pagination`         | Pagination        | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/detail-panel`       | DetailPanel       | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/form-layout`        | FormLayout        | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/form-field`         | FormField         | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/state-message`      | StateMessage      | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/toast`              | Toast             | N6   | 1.0.0   | —                       | —                       | —                       |
| `app/account-menu`       | AccountMenu       | N7   | 1.0.0   | —                       | —                       | —                       |
| `app/bar-chart`          | BarChart          | N6   | 1.0.1   | —                       | —                       | —                       |
| `app/button`             | Button            | N2   | 1.0.0   | `button` (slot)         | `button` (slot)         | `button` (slot)         |
| `app/badge`              | Badge             | N2   | 1.0.0   | `badge` (slot+variants) | `badge` (slot+variants) | `badge` (slot+variants) |
| `app/card`               | Card              | N2   | 1.0.0   | `card` (slot)           | `card` (slot)           | `card` (slot)           |
| `app/alert`              | Alert             | N2   | 1.0.0   | `alert` (slot+role)     | —                       | `alert` (slot+role)     |
| `app/input`              | Input             | N2   | 1.0.0   | `input` (slot)          | `input` (slot)          | `input` (slot)          |
| `app/label`              | Label             | N2   | 1.0.0   | `label` (slot)          | `label` (slot)          | `label` (slot)          |
| `app/skeleton`           | Skeleton          | N2   | 1.0.0   | `skeleton` (slot)       | —                       | —                       |

### The Discover Standard (`discover/`)

The second family: the 11 Discover components of `@bundu/ui` (`packages/bundu-ui/src/discover/*.astro`), one design for every public discover and browse page in the Mukoko family (circles, news, events, weather, and the super-app on the web). Tracking: [#413](https://github.com/mzizi-dev/mzizi-registry/issues/413). Published at [docs.mzizi.dev/patterns/discover-standard](https://docs.mzizi.dev/patterns/discover-standard).

| Contract                    | Component       | Node | Version | React `.tsx` | Rust `.rs` | Mzizi `.mz` |
| --------------------------- | --------------- | ---- | ------- | ------------ | ---------- | ----------- |
| `discover/discover-shell`   | DiscoverShell   | N7   | 1.0.0   | —            | —          | —           |
| `discover/discover-meta`    | DiscoverMeta    | N6   | 1.0.0   | —            | —          | —           |
| `discover/discover-hero`    | DiscoverHero    | N6   | 1.0.0   | —            | —          | —           |
| `discover/discover-search`  | DiscoverSearch  | N6   | 1.0.0   | —            | —          | —           |
| `discover/category-chips`   | CategoryChips   | N6   | 1.0.0   | —            | —          | —           |
| `discover/category-chip`    | CategoryChip    | N6   | 1.0.0   | —            | —          | —           |
| `discover/discover-section` | DiscoverSection | N6   | 1.0.0   | —            | —          | —           |
| `discover/result-grid`      | ResultGrid      | N6   | 1.0.0   | —            | —          | —           |
| `discover/discover-card`    | DiscoverCard    | N6   | 1.0.0   | —            | —          | —           |
| `discover/load-more`        | LoadMore        | N6   | 1.0.0   | —            | —          | —           |
| `discover/open-in-app`      | OpenInApp       | N6   | 1.0.0   | —            | —          | —           |

Every Discover component also works in a server-filled shell (an Astro page built once with `{{placeholders}}` and filled by a server, as circles.mukoko.com's Rust Worker does): text props are plain strings, empty text hides itself, and state switches are attributes styled by classes. Each contract has a `template` state where that matters.

**Follow-ups (not built here).** 24 of the 31 have no `.tsx` and no `.rs`: every shell and page pattern. Of the seven primitives, `badge` matches in both languages (slot and all six variants) and `label` has nothing beyond its slot to share; `alert` and `skeleton` have no `.rs`; and `button`, `card` and `input` share only the slot, because their `.tsx` and `.rs` keep the registry's own variants, parts or height (each divergence is listed in the contract). The plan is [#397](https://github.com/mzizi-dev/mzizi-registry/issues/397) (an Astro target, so these `.astro` files move here) and [#401](https://github.com/mzizi-dev/mzizi-registry/issues/401) (Rust ports of the console patterns). Each port is done when it passes the contract above.

### Registry primitives (`primitives/`)

Registry primitives with no `@bundu/ui` standard yet (`astro: null`). Their registry builds implement the contract in full (`identity: "contract"`), so every language is evaluated against every clause. Tracking: [#427](https://github.com/mzizi-dev/mzizi-registry/issues/427).

| Contract                  | Component   | Node | Version | React `.tsx`              | Rust `.rs`                | Mzizi `.mz`               |
| ------------------------- | ----------- | ---- | ------- | ------------------------- | ------------------------- | ------------------------- |
| `primitives/status-badge` | StatusBadge | N2   | 1.0.0   | `status-badge` (contract) | `status-badge` (contract) | `status-badge` (contract) |

## Rules every contract's tests enforce

- **No inline `style` attributes.** The Astro runner fails any rendered element with a `style` attribute, so a page's Content-Security-Policy can keep `style-src 'self'` with no `style-src-attr 'unsafe-inline'`. Custom properties go through classes or data attributes (AppShell's `data-accent`), sizes through classes or SVG geometry (BarChart).
- **No colour values, minerals only as declared status colours** (the brand-overlay rule), and **no script beyond the one the contract allows** (JSON-LD, `type="application/ld+json"`, is data and does not count).

## Gaps the contracts record

- **AppShell.** The collapse toggle is 32px on every pointer; on a touch screen at 64rem or wider it is under the 44px target the rest of the shell keeps (WCAG 2.5.8 is met at 24px; 2.5.5 is not).
- **PageHeader.** The docs pill is 24px on touch: it meets WCAG 2.5.8 (24px) but not the 44px the other app controls keep.
- **InfoTip.** 32px on touch: meets WCAG 2.5.8 (24px), below the 44px the other app controls keep.
- **BrandMark.** Only the Nyuchi mark ships. Mukoko, Bundu, Mzizi and the sub-brands need their registry icon pairs added before their dashboards can adopt the standard.

## Adding or changing a contract

1. Edit or add `<family>/<name>.contract.json`; bump its `version`. For a `contract`-identity component, run `pnpm contracts:sync` so its `.rs` and `.mz` carry the new clauses. A new family also needs its directory in `FAMILIES` in `__tests__/contracts/contracts.test.tsx` and in `mzizi-dev/packages-npm`'s `scripts/contract-paths.mjs`.
2. Update `index.json` (the test fails if a file or version is missing from it) and the coverage table above (the test fails if a row disagrees).
3. `pnpm test` here, then in `mzizi-dev/packages-npm` run `pnpm contracts:fetch <this branch>` and `pnpm test`: the Astro build must pass the new contract before either side merges.
