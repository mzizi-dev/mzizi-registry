# Component contracts

Owner decision, 2026-10-04: "the components should also be updated, same as the mzizi language — every component should have a contract." This directory holds those contracts, one machine-readable file per component. Tracking: [#404](https://github.com/mzizi-dev/mzizi-registry/issues/404).

Four families, all in one format. Every contract has an Astro build in this registry, beside its React build (`components/registry/n<N>-*/<name>.astro` and `.tsx`), and some have a Rust build too:

- `app/`: the 31 server-rendered app components. Together they are the **Mzizi Dashboard Standard**, the one dashboard design for every product in the Bundu ecosystem, with each brand's mineral as an overlay ([docs.mzizi.dev/patterns/dashboard-standard](https://docs.mzizi.dev/patterns/dashboard-standard)).
- `discover/`: the **Mzizi Discover Standard** ([below](#the-discover-standard-discover)), with its detail pattern.
- `site/`: the marketing-site components (hero, sections, container, breadcrumb, icons, the mineral strip).
- `ui/`: the Astro ports of registry primitives (native select, segmented control, toaster, safe-area frame).

`@bundu/ui` (`mzizi-dev/packages-npm`) is built from these files at a pinned registry commit (`pnpm registry:sync` there), and its CI fails if the package drifts from the registry.

## What a contract is

`schema/component-contract.schema.json` is the format. Each `<family>/<name>.contract.json` is versioned on its own (`version`, semver: major when a clause, prop, slot or state is removed or narrowed; minor when one is added; patch for prose) and states:

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

Every format that exists is tested against the contract, here:

- **Astro (every contract).** `__tests__/astro/contracts.test.ts` (`pnpm test:astro`) renders each contract's `.astro` (`implementations.astro.registry`) in every state through Astro's container API, with no framework renderer registered, and evaluates the clauses, checks, density and the brand-overlay rule, the no-JS rule, and that the `.astro` file's props and slots are exactly the contract's. It also fails if a registry `.astro` implements no contract.
- **React (every contract).** Where `implementations.tsx.identity` is `contract`, `__tests__/contracts/tsx-contracts.test.tsx` renders the `.tsx` in every state (react-dom/server) and holds it to the whole contract with the same runner, `runner.ts`. Its header documents how a contract maps onto React props (`class` → `className`, named slots → camelCase props, `requestUrl` where Astro reads the request). The seven app primitives' `.tsx` are the registry's own `button`, `badge`, `card`, `alert`, `input`, `label` and `skeleton`: they keep the registry's variants and share only the identity their contract names (`slot`, `slot+role` or `slot+variants`), which `__tests__/contracts/contracts.test.tsx` checks.
- **Rust (where it exists).** `contracts.test.tsx` checks each declared `.rs` sibling emits the same `data-slot`, variants and role; the crates' own `tests/contract.rs` check each `.rs` against its `.tsx`.
- **The package.** `mzizi-dev/packages-npm` ships a copy of this directory and of `runner.ts` in `@bundu/ui` and runs the same contracts against the built package. Never edit the copies there: change them here and bump that repo's registry pin.

## Coverage

`identity` is what a sibling shares with the contract: the whole `contract`, or only `slot`, `slot+role` or `slot+variants`. `—` means there is no implementation of this contract in that language yet.

| Contract                 | Component         | Node | Version | Astro `.astro`           | React `.tsx`                        | Rust `.rs`              |
| ------------------------ | ----------------- | ---- | ------- | ------------------------ | ----------------------------------- | ----------------------- |
| `app/app-shell`          | AppShell          | N7   | 1.1.0   | `app-shell`              | `app-shell` (contract)              | —                       |
| `app/side-nav`           | SideNav           | N7   | 1.0.0   | `app-side-nav`           | `app-side-nav` (contract)           | —                       |
| `app/workspace-switcher` | WorkspaceSwitcher | N7   | 1.0.0   | `app-workspace-switcher` | `app-workspace-switcher` (contract) | —                       |
| `app/quick-search`       | QuickSearch       | N7   | 1.0.0   | `app-quick-search`       | `app-quick-search` (contract)       | —                       |
| `app/command-palette`    | CommandPalette    | N7   | 1.0.0   | `app-command-palette`    | `app-command-palette` (contract)    | —                       |
| `app/top-bar-action`     | TopBarAction      | N7   | 1.0.0   | `app-top-bar-action`     | `app-top-bar-action` (contract)     | —                       |
| `app/page-header`        | PageHeader        | N6   | 1.0.0   | `app-page-header`        | `app-page-header` (contract)        | —                       |
| `app/toolbar`            | Toolbar           | N6   | 1.0.0   | `app-toolbar`            | `app-toolbar` (contract)            | —                       |
| `app/toolbar-menu`       | ToolbarMenu       | N6   | 1.0.0   | `app-toolbar-menu`       | `app-toolbar-menu` (contract)       | —                       |
| `app/stat-tiles`         | StatTiles         | N6   | 1.0.0   | `app-stat-tiles`         | `app-stat-tiles` (contract)         | —                       |
| `app/stat-tile`          | StatTile          | N6   | 1.0.0   | `app-stat-tile`          | `app-stat-tile` (contract)          | —                       |
| `app/info-tip`           | InfoTip           | N6   | 1.0.0   | `app-info-tip`           | `app-info-tip` (contract)           | —                       |
| `app/empty-state`        | EmptyState        | N6   | 1.0.0   | `app-empty-state`        | `app-empty-state` (contract)        | —                       |
| `app/brand-mark`         | BrandMark         | N3   | 1.0.0   | `app-brand-mark`         | `app-brand-mark` (contract)         | —                       |
| `app/data-table`         | DataTable         | N6   | 1.0.0   | `app-data-table`         | `app-data-table` (contract)         | —                       |
| `app/filter-bar`         | FilterBar         | N6   | 1.1.0   | `app-filter-bar`         | `app-filter-bar` (contract)         | —                       |
| `app/pagination`         | Pagination        | N6   | 1.0.0   | `app-pagination`         | `app-pagination` (contract)         | —                       |
| `app/detail-panel`       | DetailPanel       | N6   | 1.0.0   | `app-detail-panel`       | `app-detail-panel` (contract)       | —                       |
| `app/form-layout`        | FormLayout        | N6   | 1.0.0   | `app-form-layout`        | `app-form-layout` (contract)        | —                       |
| `app/form-field`         | FormField         | N6   | 1.0.0   | `app-form-field`         | `app-form-field` (contract)         | —                       |
| `app/state-message`      | StateMessage      | N6   | 1.0.0   | `app-state-message`      | `app-state-message` (contract)      | —                       |
| `app/toast`              | Toast             | N6   | 1.0.0   | `app-toast`              | `app-toast` (contract)              | —                       |
| `app/account-menu`       | AccountMenu       | N7   | 1.0.0   | `app-account-menu`       | `app-account-menu` (contract)       | —                       |
| `app/bar-chart`          | BarChart          | N6   | 1.0.1   | `app-bar-chart`          | `app-bar-chart` (contract)          | —                       |
| `app/button`             | Button            | N2   | 1.0.0   | `button`                 | `button` (slot)                     | `button` (slot)         |
| `app/badge`              | Badge             | N2   | 1.0.0   | `badge`                  | `badge` (slot+variants)             | `badge` (slot+variants) |
| `app/card`               | Card              | N2   | 1.0.0   | `card`                   | `card` (slot)                       | `card` (slot)           |
| `app/alert`              | Alert             | N2   | 1.0.0   | `alert`                  | `alert` (slot+role)                 | —                       |
| `app/input`              | Input             | N2   | 1.0.0   | `input`                  | `input` (slot)                      | `input` (slot)          |
| `app/label`              | Label             | N2   | 1.0.0   | `label`                  | `label` (slot)                      | `label` (slot)          |
| `app/skeleton`           | Skeleton          | N2   | 1.0.0   | `skeleton`               | `skeleton` (slot)                   | —                       |

### The Discover Standard (`discover/`)

One design for every public discover and browse page in the Mukoko family (circles, news, events, weather, and the super-app on the web), and for the page of one item reached from them (the detail pattern: DetailHero, DiscoverBreadcrumb, MetaList, DetailActions and RelatedRail). Tracking: [#413](https://github.com/mzizi-dev/mzizi-registry/issues/413). Published at [docs.mzizi.dev/patterns/discover-standard](https://docs.mzizi.dev/patterns/discover-standard) and [docs.mzizi.dev/patterns/discover-detail](https://docs.mzizi.dev/patterns/discover-detail).

| Contract                    | Component          | Node | Version | Astro `.astro`            | React `.tsx`                         | Rust `.rs` |
| --------------------------- | ------------------ | ---- | ------- | ------------------------- | ------------------------------------ | ---------- |
| `discover/discover-shell`   | DiscoverShell      | N7   | 1.0.0   | `discover-shell`          | `discover-shell` (contract)          | —          |
| `discover/discover-meta`    | DiscoverMeta       | N6   | 1.0.0   | `discover-meta`           | `discover-meta` (contract)           | —          |
| `discover/discover-hero`    | DiscoverHero       | N6   | 1.0.0   | `discover-hero`           | `discover-hero` (contract)           | —          |
| `discover/discover-search`  | DiscoverSearch     | N6   | 1.0.0   | `discover-search`         | `discover-search` (contract)         | —          |
| `discover/category-chips`   | CategoryChips      | N6   | 1.0.0   | `discover-category-chips` | `discover-category-chips` (contract) | —          |
| `discover/category-chip`    | CategoryChip       | N6   | 1.0.0   | `discover-category-chip`  | `discover-category-chip` (contract)  | —          |
| `discover/discover-section` | DiscoverSection    | N6   | 1.0.0   | `discover-section`        | `discover-section` (contract)        | —          |
| `discover/result-grid`      | ResultGrid         | N6   | 1.0.0   | `discover-result-grid`    | `discover-result-grid` (contract)    | —          |
| `discover/discover-card`    | DiscoverCard       | N6   | 1.0.0   | `discover-card`           | `discover-card` (contract)           | —          |
| `discover/load-more`        | LoadMore           | N6   | 1.0.0   | `discover-load-more`      | `discover-load-more` (contract)      | —          |
| `discover/open-in-app`      | OpenInApp          | N6   | 1.1.0   | `discover-open-in-app`    | `discover-open-in-app` (contract)    | —          |
| `discover/breadcrumb`       | DiscoverBreadcrumb | N6   | 1.0.0   | `discover-breadcrumb`     | `discover-breadcrumb` (contract)     | —          |
| `discover/detail-actions`   | DetailActions      | N6   | 1.0.0   | `discover-detail-actions` | `discover-detail-actions` (contract) | —          |
| `discover/detail-hero`      | DetailHero         | N6   | 1.0.0   | `discover-detail-hero`    | `discover-detail-hero` (contract)    | —          |
| `discover/meta-list`        | MetaList           | N6   | 1.0.0   | `discover-meta-list`      | `discover-meta-list` (contract)      | —          |
| `discover/related-rail`     | RelatedRail        | N6   | 1.0.0   | `discover-related-rail`   | `discover-related-rail` (contract)   | —          |

Every Discover component also works in a server-filled shell (an Astro page built once with `{{placeholders}}` and filled by a server, as circles.mukoko.com's Rust Worker does): text props are plain strings, empty text hides itself, and state switches are attributes styled by classes. Each contract has a `template` state where that matters.

**Open in Mukoko.** `open-in-app` (1.1.0) and `detail-actions` link to one canonical universal link, `https://mukoko.com/open/<service>/<id>`, built by `discover-open-link.ts` (`openInMukokoUrl`). The Mukoko apps claim `mukoko.com/open/*` through iOS universal links and Android app links; on the web, the `/open/*` resolver in `mukoko-dev/super-app-web` sends the reader to that service's page for the item. An explicit `href` is kept only as an override.

### The marketing-site family (`site/`)

| Contract              | Component     | Node | Version | Astro `.astro`        | React `.tsx`                     | Rust `.rs` |
| --------------------- | ------------- | ---- | ------- | --------------------- | -------------------------------- | ---------- |
| `site/breadcrumb`     | Breadcrumb    | N6   | 1.0.0   | `site-breadcrumb`     | `site-breadcrumb` (contract)     | —          |
| `site/container`      | Container     | N6   | 1.0.0   | `site-container`      | `site-container` (contract)      | —          |
| `site/hero`           | Hero          | N6   | 1.0.0   | `site-hero`           | `site-hero` (contract)           | —          |
| `site/icon`           | Icon          | N2   | 1.0.0   | `site-icon`           | `site-icon` (contract)           | —          |
| `site/mineral-strip`  | MineralStrip  | N3   | 1.0.0   | `site-mineral-strip`  | `site-mineral-strip` (contract)  | —          |
| `site/section`        | Section       | N6   | 1.0.0   | `site-section`        | `site-section` (contract)        | —          |
| `site/section-header` | SectionHeader | N6   | 1.0.0   | `site-section-header` | `site-section-header` (contract) | —          |
| `site/social-icon`    | SocialIcon    | N3   | 1.0.0   | `site-social-icon`    | `site-social-icon` (contract)    | —          |

### Astro ports of registry primitives (`ui/`)

The `.astro` builds of existing registry primitives, beside their `.tsx` (and `.rs`). Their React builds keep the registry's own API, so each shares only what its `identity` says, or nothing yet (`—`); the contracts list the divergences and gaps.

| Contract               | Component        | Node | Version | Astro `.astro`      | React `.tsx`               | Rust `.rs`               |
| ---------------------- | ---------------- | ---- | ------- | ------------------- | -------------------------- | ------------------------ |
| `ui/native-select`     | NativeSelect     | N2   | 1.0.0   | `native-select`     | —                          | —                        |
| `ui/safe-area-frame`   | SafeAreaFrame    | N2   | 1.0.0   | `safe-area-frame`   | `safe-area-frame` (slot)   | `safe-area-frame` (slot) |
| `ui/segmented-control` | SegmentedControl | N2   | 1.0.0   | `segmented-control` | `segmented-control` (slot) | —                        |
| `ui/toaster`           | Toaster          | N2   | 1.0.0   | `toaster`           | —                          | —                        |

**Follow-ups.** Rust ports of the app, discover and site components ([#401](https://github.com/mzizi-dev/mzizi-registry/issues/401)); each is done when it passes its contract. `button`, `card` and `input` share only their slot with their `.tsx` and `.rs`, which keep the registry's own variants, parts or height (each divergence is listed in the contract).

## Rules every contract's tests enforce

- **No inline `style` attributes.** The Astro runner fails any rendered element with a `style` attribute, so a page's Content-Security-Policy can keep `style-src 'self'` with no `style-src-attr 'unsafe-inline'`. Custom properties go through classes or data attributes (AppShell's `data-accent`), sizes through classes or SVG geometry (BarChart).
- **No colour values, minerals only as declared status colours** (the brand-overlay rule), and **no script beyond the one the contract allows** (JSON-LD, `type="application/ld+json"`, is data and does not count).

## Gaps the contracts record

- **AppShell.** The collapse toggle is 32px on every pointer; on a touch screen at 64rem or wider it is under the 44px target the rest of the shell keeps (WCAG 2.5.8 is met at 24px; 2.5.5 is not).
- **PageHeader.** The docs pill is 24px on touch: it meets WCAG 2.5.8 (24px) but not the 44px the other app controls keep.
- **InfoTip.** 32px on touch: meets WCAG 2.5.8 (24px), below the 44px the other app controls keep.
- **BrandMark.** Only the Nyuchi mark ships. Mukoko, Bundu, Mzizi and the sub-brands need their registry icon pairs added before their dashboards can adopt the standard.

## Adding or changing a contract

1. Edit or add `<family>/<name>.contract.json`; bump its `version`. Change its `.astro` and its `.tsx` in the same pull request. A new family also needs its directory in `FAMILIES` in `__tests__/contracts/contracts.test.tsx` and in `mzizi-dev/packages-npm`'s `scripts/contract-paths.mjs`.
2. Update `index.json` (the test fails if a file or version is missing from it) and the coverage table above (the test fails if a row disagrees).
3. `pnpm test` here (it runs `pnpm test:astro` too): every format must pass the contract before it merges. Then bump `mzizi-dev/packages-npm`'s registry pin and run `pnpm registry:sync` and `pnpm contracts:fetch` there.
