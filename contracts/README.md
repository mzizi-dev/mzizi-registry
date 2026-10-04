# Component contracts

Owner decision, 2026-10-04: "the components should also be updated, same as the mzizi language — every component should have a contract." This directory holds those contracts, one machine-readable file per component. Tracking: [#404](https://github.com/mzizi-dev/mzizi-registry/issues/404).

The first family is `app/`: the 31 server-rendered app components of `@bundu/ui` (`mzizi-dev/packages-npm`, `packages/bundu-ui/src/app/*.astro`). Together they are the **Mzizi Dashboard Standard**, the one dashboard design for every product in the Bundu ecosystem, with each brand's mineral as an overlay. The standard is published at [docs.mzizi.dev/patterns/dashboard-standard](https://docs.mzizi.dev/patterns/dashboard-standard).

## What a contract is

`schema/component-contract.schema.json` is the format. Each `app/<name>.contract.json` is versioned on its own (`version`, semver: major when a clause, prop, slot or state is removed or narrowed; minor when one is added; patch for prose) and states:

| Field             | What it holds                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `props`, `slots`  | Every prop with its TypeScript type, whether it is required, its default and its closed set of values; every slot and what it is for.                                                                         |
| `behaviour`       | What the component does, in sentences.                                                                                                                                                                        |
| `states`          | Named fixtures: props (`{"$url": "…"}` is a URL) and slot HTML. `default` is required. Every runner renders every state.                                                                                      |
| `accessibility`   | Roles, keyboard, focus and ARIA, and the WCAG 2.2 criteria it is built to meet.                                                                                                                               |
| `density`         | Heights in px for a fine pointer and a coarse one (touch), read from the rendered classes by the spacing scale.                                                                                               |
| `theming`         | The semantic tokens it reads, what a brand overlay changes (only colour: `--primary`, `--ring`, the shell's `--app-accent`, and the mark), and the status colours it may name.                                |
| `noJs`            | `none` (no script) or `enhancement` (one script; everything in `without` works when it does not run).                                                                                                         |
| `responsive`      | Its rules from 320px up.                                                                                                                                                                                      |
| `contract`        | A `contract … end` block in the Mzizi language's clause grammar ([`mzizi-dev/mzizi` RFC-0006 and RFC-0010](https://github.com/mzizi-dev/mzizi/tree/main/design)), the subset that applies to rendered markup. |
| `checks`          | Assertions on the rendered markup by CSS selector: a count, a minimum, absence, attributes, text.                                                                                                             |
| `implementations` | The Astro export, and the React (`.tsx`) and Rust (`.rs`) registry items that implement the same contract, or `null`. `related` lists items with a similar purpose and a different contract.                  |
| `gaps`            | Where the current build falls short of the standard, recorded rather than hidden.                                                                                                                             |

The clause subset: subjects `slot`, `role`, `label`, `class` and `portal` (the root element's attribute), `<element> "<text>"` (with `min_height`), `uses <data-slot>`, and `when <state> …`; predicates `is`, `contains`, `not_empty`, `in`, `uses "--token"`, `min_height` and `shows`. As in the language, **a clause, check or density row that a runner cannot evaluate fails**: an unevaluable contract must never read as a passing one (RFC-0006, FM-12).

## How contracts are checked

- **Astro (every component).** `mzizi-dev/packages-npm` ships a copy of this directory in `@bundu/ui` (`pnpm contracts:fetch`, `pnpm contracts:check`) and its `src/app/contracts.test.ts` renders every component in every state and evaluates the clauses, checks, density and the brand-overlay rule (no colour values; minerals only as declared status colours), the no-JS rule, and that the `.astro` file's props and slots are exactly the contract's.
- **React and Rust (where they exist).** `__tests__/contracts/contracts.test.tsx` here validates every contract against the schema and the clause grammar, renders each declared `.tsx` sibling and checks it carries the contract's identity (the root `data-slot`, and `data-variant` for every variant or the `role`, as `identity` says), and checks each declared `.rs` sibling emits the same `data-slot`, variants and role. The crates' own `tests/contract.rs` already check each `.rs` against its `.tsx`.
- **Never edit the copy in packages-npm.** Change the contract here; the package follows.

## Coverage

`identity` is what the sibling shares with the Astro build: `slot`, `slot+role` or `slot+variants`. `—` means there is no implementation of this contract in that language yet.

| Contract                 | Component         | Node | Version | React `.tsx`            | Rust `.rs`              |
| ------------------------ | ----------------- | ---- | ------- | ----------------------- | ----------------------- |
| `app/app-shell`          | AppShell          | N7   | 1.0.0   | —                       | —                       |
| `app/side-nav`           | SideNav           | N7   | 1.0.0   | —                       | —                       |
| `app/workspace-switcher` | WorkspaceSwitcher | N7   | 1.0.0   | —                       | —                       |
| `app/quick-search`       | QuickSearch       | N7   | 1.0.0   | —                       | —                       |
| `app/command-palette`    | CommandPalette    | N7   | 1.0.0   | —                       | —                       |
| `app/top-bar-action`     | TopBarAction      | N7   | 1.0.0   | —                       | —                       |
| `app/page-header`        | PageHeader        | N6   | 1.0.0   | —                       | —                       |
| `app/toolbar`            | Toolbar           | N6   | 1.0.0   | —                       | —                       |
| `app/toolbar-menu`       | ToolbarMenu       | N6   | 1.0.0   | —                       | —                       |
| `app/stat-tiles`         | StatTiles         | N6   | 1.0.0   | —                       | —                       |
| `app/stat-tile`          | StatTile          | N6   | 1.0.0   | —                       | —                       |
| `app/info-tip`           | InfoTip           | N6   | 1.0.0   | —                       | —                       |
| `app/empty-state`        | EmptyState        | N6   | 1.0.0   | —                       | —                       |
| `app/brand-mark`         | BrandMark         | N3   | 1.0.0   | —                       | —                       |
| `app/data-table`         | DataTable         | N6   | 1.0.0   | —                       | —                       |
| `app/filter-bar`         | FilterBar         | N6   | 1.0.0   | —                       | —                       |
| `app/pagination`         | Pagination        | N6   | 1.0.0   | —                       | —                       |
| `app/detail-panel`       | DetailPanel       | N6   | 1.0.0   | —                       | —                       |
| `app/form-layout`        | FormLayout        | N6   | 1.0.0   | —                       | —                       |
| `app/form-field`         | FormField         | N6   | 1.0.0   | —                       | —                       |
| `app/state-message`      | StateMessage      | N6   | 1.0.0   | —                       | —                       |
| `app/toast`              | Toast             | N6   | 1.0.0   | —                       | —                       |
| `app/account-menu`       | AccountMenu       | N7   | 1.0.0   | —                       | —                       |
| `app/bar-chart`          | BarChart          | N6   | 1.0.0   | —                       | —                       |
| `app/button`             | Button            | N2   | 1.0.0   | `button` (slot)         | `button` (slot)         |
| `app/badge`              | Badge             | N2   | 1.0.0   | `badge` (slot+variants) | `badge` (slot+variants) |
| `app/card`               | Card              | N2   | 1.0.0   | `card` (slot)           | `card` (slot)           |
| `app/alert`              | Alert             | N2   | 1.0.0   | `alert` (slot+role)     | —                       |
| `app/input`              | Input             | N2   | 1.0.0   | `input` (slot)          | `input` (slot)          |
| `app/label`              | Label             | N2   | 1.0.0   | `label` (slot)          | `label` (slot)          |
| `app/skeleton`           | Skeleton          | N2   | 1.0.0   | `skeleton` (slot)       | —                       |

**Follow-ups (not built here).** 24 of the 31 have no `.tsx` and no `.rs`: every shell and page pattern. Of the seven primitives, `badge` matches in both languages (slot and all six variants) and `label` has nothing beyond its slot to share; `alert` and `skeleton` have no `.rs`; and `button`, `card` and `input` share only the slot, because their `.tsx` and `.rs` keep the registry's own variants, parts or height (each divergence is listed in the contract). The plan is [#397](https://github.com/mzizi-dev/mzizi-registry/issues/397) (an Astro target, so these `.astro` files move here) and [#401](https://github.com/mzizi-dev/mzizi-registry/issues/401) (Rust ports of the console patterns). Each port is done when it passes the contract above.

## Gaps the contracts record

- **AppShell.** The collapse toggle is 32px on every pointer; on a touch screen at 64rem or wider it is under the 44px target the rest of the shell keeps (WCAG 2.5.8 is met at 24px; 2.5.5 is not).
- **PageHeader.** The docs pill is 24px on touch: it meets WCAG 2.5.8 (24px) but not the 44px the other app controls keep.
- **InfoTip.** 32px on touch: meets WCAG 2.5.8 (24px), below the 44px the other app controls keep.
- **BrandMark.** Only the Nyuchi mark ships. Mukoko, Bundu, Mzizi and the sub-brands need their registry icon pairs added before their dashboards can adopt the standard.

## Adding or changing a contract

1. Edit or add `app/<name>.contract.json`; bump its `version`.
2. Update `index.json` (the test fails if a file or version is missing from it) and the coverage table above (the test fails if a row disagrees).
3. `pnpm test` here, then in `mzizi-dev/packages-npm` run `pnpm contracts:fetch <this branch>` and `pnpm test`: the Astro build must pass the new contract before either side merges.
