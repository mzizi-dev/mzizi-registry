# Changelog

All notable changes to the Mzizi registry (`mzizi-dev/mzizi-registry`: the components, the design tokens, the doctrine, the Mzizi Roots crates and the `/api/v1` handlers that api.mzizi.dev serves) are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the code version follows [Semantic Versioning](https://semver.org/). Under `## [Unreleased]`, each change is a `### <Kind> — <what changed> (<merge date>, #<PR>)` subsection, newest first, where Kind is Added, Changed, Deprecated, Removed, Fixed or Security. Breaking changes are marked **Breaking**. A release moves the Unreleased entries under `## [x.y.z] - YYYY-MM-DD`. The machine-readable release record that `/api/v1/changelog` serves is `content/changelog/releases.json`; this file is the human narrative.

**The rule (owner, 2026-09-30):** every pull request that changes behaviour, shipped content, an API response, a published package or crate, a default, a dependency or a documented fact adds its entry here, under `## [Unreleased]`, in the same pull request. The `changelog / entry required` check fails a pull request that doesn't. Pull requests that touch only `.github/`, lockfiles or lint config pass without one, and pure CI, lint or typo pull requests can carry the `no-changelog` label instead.

From 2026-10-04 releases follow the org versioning policy ([nyuchi/.github#80](https://github.com/nyuchi/.github/issues/80)): staging merges are patches, a release to `main` is the next minor above the highest tag, and a major is only released by hand. Versions released before then are not renumbered.

## [Unreleased]

### Changed — Open in Mukoko covers every Mukoko service, and its examples use the canonical link (2026-10-05, #PR)

- **`discover/open-in-app` 1.2.0 and `discover/detail-actions` 1.1.0:** `service` also takes `places` (Mukoko Kweli), `lingo` and `profile` (a handle, without the `@`), matching the resolver's link table in mukoko-dev/super-app-web (`crates/links`). `MUKOKO_SERVICES` in `discover-open-link.ts` gains the three.
- **The `outline` example** is the canonical `https://mukoko.com/open/news/123`, not the retired `news.mukoko.com/open/article/123`.
- **The behaviour text** says what the resolver does now: a desktop browser or a crawler is redirected to the item's public page; a phone gets "Open in the Mukoko app" or "Continue on the web".

## [4.2.0] - 2026-10-05

The first release of `staging` to `main` under the org versioning policy ([nyuchi/.github#80](https://github.com/nyuchi/.github/issues/80)): the next minor above the highest tag (v4.1.16). The code version moves from 1.0.0 to 4.2.0 in `package.json`, `README.md` and `content/changelog/releases.json`; the pre-1.0 doctrine record also numbered 4.2.0 is a different release. Everything below, back to 1.0.0, ships in it.

### Changed — the Roots RFC makes pure `.astro` a first-class implementation (2026-10-05, #431)

- **`docs/roots/RFC-roots.md` §2.5, amended** (owner decision, 2026-10-05). It is now "The four formats and the frontend paths": a component is one registry name with one contract in `contracts/` and up to four sibling implementations, `.rs`, `.astro`, `.tsx` and `.mz`, all held to that contract by `contracts/runner.ts`. It sets the rules every `.astro` keeps (no framework and so no React layer under Astro, no client JavaScript unless the contract allows one script, no inline styles, which the runner enforces, flat imports), names the registry as the single source that `mzizi-dev/packages-npm` builds `@bundu/ui` and `@bundu/server` from behind its drift check, and documents the Astro target: `/v1/astro/{name}`, `mzizi add --target astro` and the MCP `astro` block. An Astro app now has three paths (a pure `.astro`, Roots as static HTML, a Roots island) instead of two. The original §2.5 is kept as Appendix B. No `.mz` file is touched.

### Added — every component in every format here: the Astro target, React builds of every contract, the Discover detail pattern and Open in Mukoko (2026-10-05, #430)

Owner decision, 2026-10-04: this registry is the single source of every component in every format (`.tsx`, `.rs`, `.astro`, and `.mz` as it lands). Tracking: #397 (the Astro target) and #429 (the detail pattern).

- **Added: `.astro` implementations.** The 54 Astro components `@bundu/ui` hand-authored in `mzizi-dev/packages-npm` (the Dashboard Standard's `src/app/*`, the Discover Standard's `src/discover/*`, the primitives and the marketing-site components) now live here, beside each component's `.tsx`: `app-*` (N6/N7, `app-brand-mark` in N3), `discover-*`, `site-*`, and `button`, `badge`, `card`, `alert`, `input`, `label`, `skeleton` beside their existing `.tsx`/`.rs`. With them come the framework-free modules they use (`ui-utils`, `ui-variants`, `app-nav`, `site-icons`, `site-breadcrumbs`), `@bundu/server`'s helpers as `n4-safety/server-*.ts` (the TypeScript mirror of `mzizi-roots-server`), and the Nyuchi brand-mark pair in `components/registry/assets/`. `site-hero` now composes a pure-Astro `site-cta-button` instead of a React button, so no `.astro` has React under it.
- **Added: React (`.tsx`) builds of every contract.** The 24 Dashboard Standard patterns and shell components, the 11 Discover components and the 8 site components each have a `.tsx` that keeps the whole contract (`identity: "contract"`), so Next.js apps adopt the same design through the registry (`mzizi add <name> --target tsx` or `npx shadcn add https://api.mzizi.dev/v1/ui/<name>`).
- **Added: the Discover detail pattern** (`discover/detail-hero`, `breadcrumb`, `meta-list`, `detail-actions`, `related-rail`), each a contract, an `.astro` and a `.tsx`, for the page of one item reached from a discover page.
- **Changed: Open in Mukoko** (`discover/open-in-app` 1.1.0). New `service` and `id` props build the canonical universal link `https://mukoko.com/open/<service>/<id>` (`discover-open-link.ts`, `openInMukokoUrl`); `href` stays as an explicit override.
- **Added: the `site/` contract family** (8 contracts), so every component has a contract. `site-breadcrumb` and `site-social-icon` gain a root `data-slot`.
- **Added: the `ui/` contract family** (4 contracts) for the Astro ports of existing registry primitives that `@bundu/ui` 0.3.0 added: `native-select`, `segmented-control`, `toaster` and `safe-area-frame` (`.astro` beside their `.tsx`, with the `safe-area` geometry module). `safe-area-frame.astro` now draws its box, canvas and bands as SVG geometry instead of inline `style` attributes, so it keeps the no-inline-style rule; its `.tsx` and `.rs` share only the slot until they follow.
- **Added: contracts test every format.** `__tests__/astro/contracts.test.ts` (`pnpm test:astro`, run by `pnpm test`) renders every `.astro` in every state; `__tests__/contracts/tsx-contracts.test.tsx` holds every `contract`-identity `.tsx` to the whole contract with the same runner, now canonical here as `contracts/runner.ts` (it lower-cases attribute names as a browser does). The schema gains `implementations.astro.registry` and the `contract` identity; `index.json` gains `astro`.
- **Added: `lib/astro.ts`**, the reader `mzizi-api-gateway` bundles for `GET /v1/astro/{name}` (documented in `openapi.yaml`): the `.astro` (or framework-free `.ts`), its flat imports as `/v1/astro/` registry dependencies, its npm dependencies, and its brand assets as base64 files (`lib/registry-assets.generated.json`). `pnpm registry:validate` rejects a framework import in an `.astro` or a flat import that does not resolve.
- **Changed:** registry `.astro` and framework-free `.ts` files import each other flat (`./button.astro`, `./ui-utils`), as installed; `vitest.astro.config.ts`, the default vitest config and tsconfig's `rootDirs` resolve them. `astro`, `css-select`, `domhandler`, `domutils` and `htmlparser2` are new devDependencies.

### Fixed — CONTRIBUTING no longer says to curl a local server (2026-10-04, #426)

The "Verify" step for a new component ran `curl http://localhost:11736/api/v1/ui/my-component`, but the app and its `/api/*` handlers were removed on 2026-10-02 and nothing listens there.

- **`CONTRIBUTING.md`**: the step now runs `pnpm registry:validate && pnpm registry:verify`, then `pnpm build && git status --porcelain` (every generator in write mode; commit what it writes). Once the change is on `main` and mzizi-api-gateway's registry pin reaches it, `https://api.mzizi.dev/v1/ui/my-component` serves it.
- **`.github/pull_request_template.md`**: the "API verified" checkbox that curled the same local URL is replaced by the same `pnpm build` check.

### Added — a push to `main` tells the registry pin bots at once (2026-10-04, #425)

The registry pin bots (`registry-pin-bump.yml` in mzizi-api-gateway and agent-tools) only ran on their hourly schedule, and GitHub delays and drops scheduled runs: on 2026-10-04 they ran 2–3 hours apart, so api.mzizi.dev and mcp.mzizi.dev served a registry hours behind `main`.

- **`.github/workflows/notify-pin-bots.yml`**: on every push to `main` (and by hand), it sends a `repository_dispatch` of type `registry-main-moved` to mzizi-dev/mzizi-api-gateway and agent-tools with `RELEASE_BUMP_TOKEN`, carrying the pushed SHA. It checks out and runs no code. A send that fails, or a missing token, only warns: the hourly run stays the backstop.
- It does nothing until each bot also triggers on `repository_dispatch`, which lands in those repositories separately.

### Fixed — `wallet-card` and `mzizi-create-listing` take their colours from N1, and CI runs `lint:colors` (2026-10-04)

`pnpm lint:colors` failed on `main` for nine raw palette hexes, and no CI job ran it (#423).

- **`wallet-card`**: each token type's card is its mineral (MIT tanzanite, MXT malachite, NST cobalt, NHC gold), filled from `var(--color-<mineral>)` to `var(--color-<mineral>-on-container)` with `text-<mineral>-container` text, in place of four fixed hex gradients under `text-white`. The card now follows the theme: a deep fill with pale text in light mode and a bright fill with deep text in dark mode, where white text on the old bright end (`#FFD740`, `#64FFDA`) was barely legible.
- **`mzizi-create-listing`**: the terracotta cover theme ends on `var(--color-terracotta)` instead of a raw `#A0522D`, and the gold and terracotta swatch comments, which were swapped, name the right mineral.
- **CI**: the `Lint` job runs `pnpm lint:colors` after ESLint, so a hardcoded palette hex fails a pull request instead of waiting for someone to run `pnpm check`.

### Added — `status-badge` in three builds (React, Mzizi Roots, the Mzizi language), and a CI gate for `.mz` components (2026-10-04, #418)

Owner decision, 2026-10-04: StatusBadge comes back as a registry component, built in Rust and in the Mzizi language. Components gain Rust and `.mz` builds beside their TypeScript, and the TypeScript stays for now.

- **`status-badge`** (N2): a pill-shaped lifecycle label, tinted with one of the Seven Minerals at 10% behind the mineral itself. `stable` is malachite, `beta` is cobalt, `alpha` is gold, and `deprecated` is terracotta, struck through. It ships in three builds that share one contract:
  - `status-badge.tsx` (React, built on `Badge`; `npx shadcn@latest add https://api.mzizi.dev/v1/ui/status-badge`);
  - `status-badge.rs` (Mzizi Roots, exported from `mzizi-ui` as `StatusBadge` with a `CONTRACT`);
  - `status-badge.mz` (the Mzizi language).
    `beta` is new; the removed app-only component had three statuses.
- **`.mz` files sit beside `.tsx` and `.rs`** in the registry. There are twelve. Eight are the N2 primitives already written and verified in mzizi-dev/mzizi `primitives/`: `button`, `badge`, `card`, `avatar`, `input`, `separator`, `spinner` and `alert`. They are copied beside their siblings unchanged. The other four, `status-badge`, `label`, `progress` and `chart`, are written here. `lib/registry.generated.ts` and `lib/registry-source.generated.json` list every one. **`pnpm mz:check`** (`scripts/check-mz.mjs`) runs `mz check` and `mz contract` on every one. A new **Mzizi components** CI job builds `mz` from mzizi-dev/mzizi at the commit in `scripts/mz-pin`. Any error or warning fails the job.
- **`mzizi-ui` now evaluates `CONTRACT` clauses** against `dioxus-ssr` markup, as `mzizi-brand` does, and exports `CONTRACTS`. The evaluator moved out of `mzizi-brand`'s test file into `mzizi-rs/contract-eval/contract_eval.rs`, shared by both suites, so there is no second copy.

### Added — the mzizi design system in `design-system/`, and a registry `assets/` directory with the official marks (2026-10-04, #418)

Owner decisions, 2026-10-04:

- The official marks are the mzizi seven-node network, the bundu ring, the nyuchi bee and the mukoko seven-mineral honeycomb, each in a light and a dark version.
- **mzizi is not gold.** Its mark is drawn in hematite, mzizi's ecosystem mineral. The first supplied version used nyuchi's gold.
- The repo is the source of the design system. The Design System artifact is published from `design-system/`.

The copper crosshair disc that used to ship as `public/icons/mzizi-icon.*` was not mzizi's mark. Tracking: #417.

- **`components/registry/assets/`**: a brand-asset directory beside the node directories, holding the marks for mzizi, bundu, nyuchi and mukoko. Its items list under N3 (brand) in `lib/registry.ts` and the node map, so `ui.mzizi.dev` serves them.
  - **`mzizi-mark-light` and `mzizi-mark-dark` are new installable items**: vector SVG masters in hematite (`#546e7a` light, `#90a4ae` dark), redrawn from the supplied geometry, with PNG renders beside them. Install one with `npx shadcn@latest add https://api.mzizi.dev/v1/ui/mzizi-mark-light`.
  - The bundu, nyuchi and mukoko marks are raster PNGs. They are listed but not installable until vector masters exist, and `registry:validate` says so.
  - `generate-registry-source` skips binary files, and `generate-file-paths`, `validate-registry` and `lib/registry.ts` rank a vector asset above its raster sibling.
- **`design-system/`**: the design system, mirroring the artifact's files one to one.
  - `design-system.json` is the artifact's index.
  - `README.md` is the brand book: voice and casing, surfaces, ink and accent, the ecosystem minerals (Mukoko Events, kweli, Nyuchi Learning, news and weather included), the 21 colour families, type, shape, spacing, states, accessibility and iconography.
  - `assets/<Group>/README.md` holds the mark notes.
  - `components/` holds static renditions of the Button, Input, Badge, Card, Switch, Checkbox and Tabs primitives, plus the cover.
  - `PUBLISHING.md` says how it stays current and how it is published.
- **`design-system/tokens.json`**: 104 colour tokens with light and dark values, plus type, spacing, radius, size and aspect tokens. It is generated by `pnpm design-system:generate` from `styles/globals.css`, `lib/tokens/palette.source.ts` and `lib/tokens/brand.source.ts`. `pnpm design-system:generate:check` gates it in CI and in `pnpm check`.
- **`__tests__/design-system.test.ts`** fails if any of these happens:
  - the flagged low-contrast colours (copper, sunset and kalahari in light; sodalite in dark) stop matching the palette;
  - an on-container pair drops below 7:1;
  - a colour alias dangles;
  - a mark is missing;
  - the mzizi mark is drawn in anything but hematite;
  - a component rendition names a source file that no longer exists.

### Added — `safe-area-frame`, `preview-canvas`, `preset-picker` and `mzizi-email-preview` (2026-10-04, #398)

- **Four components from nyuchi-tools** (`nyuchi/workspace-tools`), contributed because the registry had no equivalent. `safe-area-frame` (N2) draws a canvas shape at thumbnail size with its platform-UI bands shaded, in React and as a Mzizi Roots component in `mzizi-ui` (`SafeAreaFrame`, `safe_area_bands`) — one geometry, held together by the contract suite. `preview-canvas` (N2) is a single-image stage with Fit or scaled zoom and a busy state; `preset-picker` (N2) picks output sizes on `safe-area-frame`, keeping "active" and "included" apart; `mzizi-email-preview` (N3) shows email HTML in a sandboxed frame on an always-light body. Tests in `__tests__/components/` and `mzizi-rs/crates/mzizi-ui/tests/contract.rs`.

### Added — `mzizi-activitypub`, the shared ActivityPub crate (2026-10-04)

Owner decision Q5, 2026-10-04 (mukoko-dev/kweli#171; nyuchi/api-gateway `docs/architecture/activitypub.md`): the ActivityPub code circles.mukoko.com and kweli.mukoko.com each carried is one Mzizi server crate, used by both Workers.

- **New crate `mzizi-activitypub`** (`mzizi-rs/crates/mzizi-activitypub`), N11 discovery on the fediverse. Sans-IO functions returning `serde_json::Value`: the `@context` (`context`, `with_context`, `without_context`), content negotiation (`wants_activity_json`), `escape_html`, `text_to_html`, `encode`, `property_value`, WebFinger (`webfinger_user`, `jrd`, `self_link`, `profile_page_link`), `host_meta`, `nodeinfo_links`, `nodeinfo(&NodeInfo)`, and outboxes (`ordered_collection`, `ordered_collection_page`, `page_id`, `public_activity`). Builds for `wasm32-unknown-unknown`. Extracted from mukoko-dev/mukoko-circles `worker/src/ap.rs`; actors stay the host's.
- **Authored in the crate**, not under `components/registry/`: it has no TypeScript sibling and no UI, like the umbrella crates.
- **`mzizi-roots-server` gains an opt-in `activitypub` feature** re-exporting it as `mzizi_roots_server::activitypub`. Not a default feature, because it brings `serde_json` and `url`.
- `publish-crates.yml` publishes it, before the umbrellas. Its first crates.io release is 0.1.0 at the workspace version.
- Phase 2 of the design (HTTP signatures, the inbox, delivery) is built here next.

### Changed — every contract's `since` is `@bundu/ui` 0.3.0 (2026-10-04)

Owner decision, 2026-10-04: versions bumped but never published are reset to the org versioning policy, so the next `@bundu/ui` release is 0.3.0, one minor above 0.2.0 on npm, and it carries everything the unpublished 0.3.0, 0.4.x and 0.5.0 entries described. The `implementations.astro.since` of the ten `app/` contracts that said 0.4.0 and the eleven `discover/` contracts that said 0.5.0 now say 0.3.0. Contract versions are unchanged.

### Added — the Mzizi Discover Standard: a contract for each of the 11 Discover components (2026-10-04, #415)

Owner decision, 2026-10-04: the discover pages of news, events, circles and weather must be identical, so they move into the Mukoko super-app on the web unchanged. Tracking: #413.

- **`contracts/discover/`, a second contract family**: DiscoverShell, DiscoverMeta, DiscoverHero, DiscoverSearch, CategoryChips, CategoryChip, DiscoverSection, ResultGrid, DiscoverCard (one contract, variants `article`, `event`, `circle`, `place`), LoadMore and OpenInApp. Each is built in `@bundu/ui` (`src/discover/*.astro`, mzizi-dev/packages-npm) and evaluated there in every state. Where a server fills a prebuilt shell (circles.mukoko.com's Rust Worker), each contract has a `template` state with `{{placeholders}}`.
- **`app/filter-bar` 1.1.0**: a `search` prop (`false` renders only the selects), `searchLabel` and `q` become optional, and a select whose value is `""` is no longer an active filter.
- **`app/app-shell` 1.1.0**: the accent is `data-accent` plus the shell's stylesheet, not an inline `style`. **`app/bar-chart` 1.0.1**: bars are SVG geometry, not inline styles. The Astro runner now fails any inline `style` attribute, so a CSP needs no `style-src-attr 'unsafe-inline'`.
- **`__tests__/contracts`** reads every family (`FAMILIES`) and fails on a directory under `contracts/` it does not read.
- **CONTRIBUTING.md and AGENTS.md: upstream first.** A new or altered component goes upstream to Mzizi immediately; a local copy lives only as `TODO(mzizi)` with an open upstream PR.

### Changed — releases follow the org versioning policy (2026-10-04, #412)

`release.yml` and `publish-crates.yml` check the version with the shared `next-version` action (nyuchi/.github, pinned) before tagging or uploading. A release to `main` must be the next minor above the highest tag (the registry: 4.2.0, above v4.1.8; the crates: 0.2.0, above mzizi-rs-v0.1.0). A major is only released by hand, with `bump: major` on a manual run. The new `staging-version.yml` tags each merge into `staging` as the next patch. CONTRIBUTING.md § Versioning describes the policy.

### Changed — the nhimbe brand is retired: canon's events row is Mukoko Events, at events.mukoko.com (2026-10-04, #411)

Owner decisions, 2026-10-04 ([mukoko-dev/nhimbe#155](https://github.com/mukoko-dev/nhimbe/issues/155)): the events platform is **Mukoko Events**, at `https://events.mukoko.com`. The name "nhimbe" is retired as a brand, and the mineral stays **malachite**.

- **Canon's `ecosystem` table (`lib/tokens/brand.source.ts`, served as `/v1/brand` → `.ecosystem`) replaces the `nhimbe` row with `events`.** The new row has display name "Mukoko Events", role "Events & gatherings", mineral malachite and url events.mukoko.com, in the same `sortOrder` slot. `BrandEcosystemEntry` gains two optional fields. `displayName` is the product name where it differs from the wordmark. `aliases` lists deprecated names that still resolve to the row. The `events` row carries `aliases: ["nhimbe"]`. A new export, `ecosystemAliases`, maps each alias to its row, and `resolveEcosystemName()` resolves a name through it. No other row changes.
- **`nhimbe` is a documented deprecated alias, so nothing breaks.** `brandOverrides` (in `lib/tokens/index.ts` and the `mzizi-tokens-typescript` registry item) gains `events` and keeps `nhimbe` with the same malachite accent, marked `@deprecated`, and `BrandId` gains `"events"`. `mzizi-tokens-globals.css`'s brand block is now `[data-brand="events"], [data-brand="nhimbe"]`: the selector list is built from canon's `aliases` by `BRAND_ALIASES` in `scripts/render-globals-css.ts`, so `data-brand="nhimbe"` keeps resolving. `brandIndustryCategories.mukoko.events.products` now reads `["Mukoko Events"]`.
- **Copy:** the `app-switcher` entry is now `events`. The `mzizi-footer` (React and Dioxus) Platform link is "Mukoko Events" at `/events`. `sidebar-15` and `sidebar-16` show a "Mukoko Events" workspace in malachite; they said tanzanite, which was never this brand's mineral. Item `useCases` say `events` instead of `nhimbe`, and descriptions say "Mukoko Events". The README ecosystem table now lists events.mukoko.com. The wordmark lists in CONTRIBUTING, the PR template and the brand guidelines drop nhimbe. Doctrine reads "Mukoko Events gatherings".
- **Not changed:** the word _nhimbe_ where it names the Shona practice of communal work, as in sample data ("a working nhimbe") and history. `plugin/skills/` is copied from `@nyuchi/mzizi-skills`, so its ecosystem table follows when that package is bumped.
- **New tests** in `__tests__/tokens-brand-blocks.test.ts` pin the `events` row, the alias, and the `nhimbe` brand block and accent that still resolve. They also check that no alias shadows a live canon row.

### Changed — releases tag themselves with RELEASE_BUMP_TOKEN, and the crates get a tag and release (2026-10-04)

- `release.yml` creates the `v<package.json version>` tag and release with the `RELEASE_BUMP_TOKEN` org secret instead of `GITHUB_TOKEN`, so a workflow listening for the tag or the release can start (GitHub starts none from `GITHUB_TOKEN`).
- `publish-crates.yml` now tags each crates version it publishes as `mzizi-rs-vX.Y.Z` and creates a GitHub release linking every crate on crates.io, once all of them are there. If the tag already exists, the step does nothing; a dry run skips it. Tracking: mzizi-dev/packages-npm#25.

### Changed — Kweli is malachite, Nyuchi Learning is gold, and news and weather join canon (2026-10-04, #409)

Owner decisions, 2026-10-04 (#404):

- **Canon's `ecosystem` table (`lib/tokens/brand.source.ts`, served as `/v1/brand` → `.ecosystem`) gains four rows:** `kweli` (malachite; kweli.mukoko.com, trust and verification, "Truth" in Swahili), `learning` (gold; Nyuchi Learning, learning.nyuchi.com), `news` (cobalt) and `weather` (cobalt). Kweli had no canon row and borrowed Mukoko's tanzanite. News and weather were cobalt only in the mini-app accent table, so `@bundu/ui` overlays had to read that table; they now come from canon.
- **Nyuchi Learning / education is gold, not cobalt.** `brandIndustryCategories.nyuchi.education` said cobalt, which contradicted the rule that every Nyuchi brand is gold. The Nyuchi rule wins. Mukoko's `lingo` mini-app stays cobalt, as its own canon row says.
- **`brandOverrides` (the mini-app accent table, in `lib/tokens/index.ts` and the `mzizi-tokens-typescript` registry item)** gains `kweli` (malachite) and `learning` (gold), and `BrandId` gains both. `brandIndustryCategories.mukoko` gains `trust` (malachite, Kweli).
- **`mzizi-tokens-globals.css`** gains `[data-brand="weather"]`, `[data-brand="kweli"]` and `[data-brand="learning"]` blocks, and the `news` block now reads its mineral from canon instead of naming `lib/tokens/index.ts`.
- **New tests** in `__tests__/tokens-brand-blocks.test.ts` pin the four decisions, keep the education category gold, and fail if any `brandOverrides` entry disagrees with canon's mineral for a brand canon has.

### Changed — README, AGENTS and CONTRIBUTING name `contracts/` (2026-10-04, #408)

- **`README.md` and `AGENTS.md` now say what `contracts/` holds** (added in #406): a versioned, machine-readable contract for each `@bundu/ui` app component of the Mzizi Dashboard Standard, 31 in `contracts/app/`, in the format `contracts/schema/component-contract.schema.json` defines, listed in `contracts/index.json`, with the coverage table in `contracts/README.md`. Both link [docs.mzizi.dev/registry/contracts](https://docs.mzizi.dev/registry/contracts). `CONTRIBUTING.md`'s test layout lists `__tests__/contracts/`.

### Added — `AGENTS.md`: track big work in GitHub issues (2026-10-04, #402)

- **A new "Track big work in GitHub issues" section in `AGENTS.md`.** Any substantial build, migration, investigation or multi-step task gets a GitHub issue in the repo that owns it, before or as work starts, so another session, agent or person can pick it up. The issue holds the goal, the owner's decisions (verbatim where given), the plan, acceptance criteria, owner-only steps and links.
- **Every PR references its issue** (`Refs #n`; `Fixes #n` only when the merge completes it). Progress, decisions and a hand-off note (what's done, what's left, branch names) go in issue comments, at each merge and before a session or agent finishes. Work spanning repos gets a tracking issue that links the per-repo issues.
- **No secrets, credential status or exploitable detail in issues on public repos.**

### Fixed — shamwari's mini-app accent is sodalite, not tanzanite (2026-10-04)

- **`brandOverrides.shamwari` and `brandIndustryCategories.shamwari.ai` now say sodalite**, in `lib/tokens/index.ts` and in the `mzizi-tokens-typescript` registry item. Canon (`lib/tokens/brand.source.ts` ecosystem, `/v1/brand`) and the `mzizi-design` skill have shamwari on sodalite; these two tables still had Mukoko's tanzanite. Values: primary `#3D5AFE`, container `#E8EAF6`, on-container `#141A5C` (canon's sodalite), muted computed as before. Canon authors no sodalite hover tint, so `primaryHover` is `#6E83FE`, cobalt's rule (25% toward white) applied to `#3D5AFE`, until canon authors one.

### Security — the audit sets one advisory aside, by ID, until 2026-11-04 (2026-10-04)

- **`pnpm audit` ignores GHSA-vfj7-8cjw-p6xm and nothing else** (`pnpm.auditConfig.ignoreGhsas` in `package.json`). It is `braces` <=3.0.3 (ReDoS on deeply nested patterns), which has **no patched release**, reached only through `@next/eslint-plugin-next > fast-glob > micromatch`: lint tooling run on this repository's own files, never shipped in a registry item or served by the API. It failed `audit:check` (and so `pnpm check` and the pre-commit hook) on every branch, `main` included. The level stays `moderate`, so any other advisory still fails. **Recheck by 2026-11-04**: remove the entry once `braces` publishes a fix or the plugin drops it.

### Added — component contracts, and the Mzizi Dashboard Standard (2026-10-04, #404)

- **`contracts/`: a machine-readable, versioned contract for every `@bundu/ui` app component** (31: the shell, page and data patterns and the seven primitives under them). Owner decision, 2026-10-04: the Nyuchi console shell is the standard dashboard design for the whole Bundu ecosystem, with each brand's mineral as an overlay, and every component carries a contract, as in the language. `contracts/schema/component-contract.schema.json` is the format: props and slots with types, behaviour, named states, accessibility, density for fine and coarse pointers, theming (brand overlay tokens only; layout never varies by brand), the no-JS fallback, responsive rules, a `contract … end` block in the language's clause grammar (RFC-0006 / RFC-0010), and selector checks. An unevaluable clause fails (FM-12). `contracts/index.json` lists them; `contracts/README.md` has the coverage table and the gaps.
- **`__tests__/contracts/contracts.test.tsx`** validates every contract against the schema and the clause grammar, keeps the index and the README's coverage table honest, renders each declared React sibling (`badge`, `button`, `card`, `alert`, `input`, `label`, `skeleton`) and checks it carries the contract's identity, and checks each declared Rust sibling (`badge`, `button`, `card`, `input`, `label`) emits the same `data-slot`, variants and role. The Astro builds are evaluated in full in `mzizi-dev/packages-npm`.
- **24 of the 31 have no React or Rust implementation of their contract yet** (every shell and page pattern). They are #397 and #401 work; `contracts/README.md` lists them.

### Security — security reports go to `security@nyuchi.com` (2026-10-03, #396)

- **`SECURITY.md` names `security@nyuchi.com` as the email fallback** behind GitHub private advisories, in place of `security@bundu.org` (owner decision, 2026-10-03: one security contact for every repository). GitHub advisories stay the first channel.

### Changed — `vite-plus / check` gates on ESLint + tsc for now; the old Vite+ workflow moved (2026-10-03, #395)

- **`ci:check` = `pnpm lint && pnpm typecheck`.** The org-required `vite-plus / check` job runs it in place of `vp check` until this repo's TypeScript has been through the formatter. `.github/workflows/reusable-ci-vite-plus.yml` is now a pointer to `nyuchi/.github`'s `reusable-vite-plus.yml`.

### Changed — lint runs once, from the org-required workflow (2026-10-03)

- **Removed `.github/workflows/lint.yml`.** The `mzizi-dev` org ruleset now runs the shared lint on every pull request through `mzizi-dev/.github`'s `org-lint.yml`, publishing the same five `lint / …` checks, so the repo's own caller only ran lint a second time.

### Changed — stop tracking `.DS_Store` (2026-10-02, #388)

- **The repo root's macOS `.DS_Store` is no longer tracked**, and `.gitignore` now ignores it. Local copies stay on disk.

### Removed — the Next.js app: this repo is the registry and nothing else (2026-10-02)

- **Breaking (for anyone running this repo's app locally):** removed `app/` (every page, the `/api/*` route handlers and `/mcp`), `next.config.mjs`, `mdx-components.tsx`, `postcss.config.mjs`, `public/`, and the `dev`, `start`, `prebuild` and `postbuild` (pagefind) scripts. Nothing served them: `mzizi.dev` is mzizi-site, `app.mzizi.dev` mzizi-console, `api.mzizi.dev` mzizi-api-gateway and `mcp.mzizi.dev` mzizi-mcp in agent-tools. No public URL changes.
- **Removed the `mzizi-api/` Worker** generated from `app/api/**`, with `scripts/generate-api-routes.mjs`, `api:routes`, `api:routes:check`, `api:dev` and their tests. mzizi-api-gateway replaced it on 2026-09-29.
- **Removed the app-only components, hooks and `lib/` modules** that nothing else imports (`components/landing`, `playground`, `patterns`, `mukoko`, `docs`, `mdx`, the portal's own `components/ui` overrides, `lib/nav`, `lib/metrics`, `lib/file-backed-pages`, `lib/db/client`, and the installed copies of `lib/a11y`, `lib/motion` and `lib/resilience`), and the dependencies only they used (MDX, rehype, shiki, three/react-three, `@modelcontextprotocol/sdk`, pagefind, PostCSS). `next` stays, as a devDependency, because registry items import it.
- **The token source moved from `app/globals.css` to `styles/globals.css`.** `tokens:sync`, `tokens:verify`, `tokens:registry` and `lint:colors` read the new path. Install targets are unchanged: `mzizi-tokens-globals` still installs to `app/globals.css` in a consumer's project, and `mzizi-tokens` is still `cssVars`.
- **Kept:** `registry.json` and `components/registry/**`, the token pipeline, `mzizi-rs/`, `plugin/`, doctrine, `openapi.yaml`, every generator and its `--check`, every `lib/` module mzizi-api-gateway bundles, and the `mzizi-ui` and `mzizi-plus` proxy Workers.
- **`pnpm build` now runs every generator in write mode**, and CI's `Build` job fails if that changes a committed file. It used to be `next build`.

### Security — the old portal is no longer deployable, and `next/og` is gone (2026-10-02)

- **Removed the `next/og` routes** (`app/opengraph-image.tsx`, `app/components/[name]/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx`) and `lib/og/`. The component route put the URL slug into a Node `ImageResponse`, which is the exposure in GHSA-vcvr-r3jv-pc5j (critical RCE, `next` >= 16.2.0 < 16.3.6).
- **`next` is 16.3.8** (patched), with `@next/eslint-plugin-next` and `@next/mdx` to match. It stays a dependency because registry items such as `mzizi-sidebar`, `mzizi-bottom-nav` and `mzizi-seo` import Next.js for the apps that install them.
- **Removed the OpenNext deployment** (`wrangler.jsonc`, `open-next.config.ts`, `@opennextjs/cloudflare`, the `cf:*` scripts). The live surfaces moved on: `mzizi.dev` is mzizi-site, `app.mzizi.dev` mzizi-console, `api.mzizi.dev` mzizi-api-gateway and `mcp.mzizi.dev` mzizi-mcp. The orphaned `mzizi-registry` Worker is being deleted. Removing the rest of the Next.js app follows separately.

### Changed — agent skills 0.8.5: the language at `62a0f32` (the tracker, the service slice, `mz build`, RFC-0012) (2026-09-30, #387)

- **The lockfile resolves `@nyuchi/mzizi-skills` 0.8.5** (the range stays `^0.8.1`, which allows it). `lib/skills.generated.ts` and `plugin/skills/` are regenerated from the package, so `/v1/skills`, `/v1/skills/{name}` and the public plugin now serve 0.8.5 (agent-tools#166). The skills now follow language main `62a0f32`.
- **`mzizi-language`:** it points agents at `LANGUAGE-TRACKER.md` in `mzizi-dev/mzizi` before any capability claim, and summarises its gaps. It teaches the backend `service` (routes, handlers with `when`, `header` and `respond`, and `example` and `ensure` contracts; RFC-0011), `mz contract` running a service in process, and `mz build`, which lowers a service to a local Rust + axum package. It adds the MZ08xx codes and MZ0606 and MZ0611–MZ0613. It cites the harness's design as RFC-0012 (a draft) and the charter as v0.4. What is not built is listed exactly: expressions, bindings, callable functions, loops, error handling, modules, a standard library, component lowering and a release. Its description changes to match.
- **`mzizi-backend`:** the language now has one backend slice. It runs in process under `mz contract` and lowers with `mz build` to a local axum package. It has no Workers target and serves nothing live. A new "A Mzizi service" section shows the slice. The skill cites charter v0.4, and its description changes to match.
- **`mzizi-roots`:** only a Mzizi `service` lowers, not a component, so `mz contract` does not read a Roots `CONTRACT`. The contracts-everywhere RFC is named as RFC-0010.
- **The public Claude Code plugin is 1.2.3** (`plugin/.claude-plugin/plugin.json`), and its description and the marketplace entry name skills 0.8.5. `mzizi-design` and `discoverability` are unchanged.

### Changed — agent skills 0.8.4: Mzizi is a programming language, built to make Rust better (2026-09-30, #386)

- **The lockfile resolves `@nyuchi/mzizi-skills` 0.8.4** (the range stays `^0.8.1`, which allows it). `lib/skills.generated.ts` and `plugin/skills/` are regenerated from the package, so `/v1/skills`, `/v1/skills/{name}` and the public plugin now serve 0.8.4. These are the wording changes from agent-tools#157 (0.8.3) and agent-tools#159 (0.8.4), which position Mzizi as a programming language.
- **`mzizi-language`:** it opens by saying Mzizi is a general-purpose programming language built to make Rust better, the way TypeScript makes JavaScript better: no borrows, lifetimes or ownership in the language you write, with the harness at the core. Rust is its platform (designed to lower to Rust, with Mzizi Roots as its component model). Replacing TypeScript, Python and C++ and "makes Rust better" are stated as goals, not results. It separates the language, the harness (the layer an agent reads: the language as an agent sees it, the `mz check --agent` protocol and the plugin host; designed, not built, apart from the agent output) and the toolchain that implements the language and attaches to the harness (`mz`, the CLI, the MCP server, the skills, the benchmark harness). It also separates the components that support the language. It says Mzizi is "designed to lower to Rust", not that it "compiles to Rust", and places the Phase 0 pilots as tests inside Phase 0.
- **`mzizi-roots`:** Mzizi Roots is built to support the language as its component model; it is not the language.
- **`mzizi-design`:** Mzizi's ecosystem identity names the programming language and its toolchain first, instead of "the framework".
- **The public Claude Code plugin is 1.2.2** (`plugin/.claude-plugin/plugin.json`), and its description and the marketplace entry name skills 0.8.4. `mzizi-backend` and `discoverability` are unchanged.

### Added — a `-text` token for every colour family: the value to use as text on `--base` (2026-09-30, #385)

- **`mzizi-tokens-globals.css` gains `--mineral-*-text`, `--heritage-*-text` and `--exp-*-text` for all 21 families, in both themes, with `--color-*-text` in `@theme`** (Tailwind: `text-hematite-text`). Each one clears APCA Lc 75 as text on `--base` (`#F3F3F1` light, `#0E0D0C` dark), the same bar `--text-secondary` is walked to. Use it for links, accents and headings in a brand colour on the page background.
- **Why:** in light mode `-aa` is measured as a fill under white text, not as text on the page. Light hematite `#546E7A` passes that (5.40:1 under white) but measures APCA Lc 69.7 as text on `#F3F3F1`. docs.mzizi.dev worked around it with a hand-derived `#4A616B` (mzizi-docs #20); that value is now canon: `--heritage-hematite-text` is `#4a616b` light (Lc 75.1) and `#c9d2d7` dark (Lc -78.1).
- **How the values are made:** `scripts/render-globals-css.ts` `textOnBaseTier()` walks each family's light canonical hex toward black in 1% steps with the existing `walk()` and keeps the first step that passes. In dark, `-text` is the dark `-aa` value, which is already measured as text on base-dark (APCA Silver, Lc 78), so dark adds no new colour. Six families change in light: terracotta `#8e4928`, copper `#93452a`, savanna `#725915`, sunset `#a43310`, hematite `#4a616b`, kalahari `#675c46`. The other 15 keep their canonical hex.
- **Unchanged:** every existing token keeps its value, including every `-aa` and the brand blocks' `--primary`. `/v1/brand` does not serve the accessibility tier, so its response is unchanged. The Rust, Swift, Kotlin, ArkTS, React Native, Python and TypeScript token files carry the palette only and are unchanged.

### Changed — agent skills 0.8.2: Mzizi's own colour is hematite (2026-09-30, #384)

- **The lockfile resolves `@nyuchi/mzizi-skills` 0.8.2** (the range stays `^0.8.1`, which allows it). `lib/skills.generated.ts` and `plugin/skills/` are regenerated from the package, so `/v1/skills`, `/v1/skills/{name}` and the public plugin now serve 0.8.2.
- **`mzizi-design`:** the brand constellation gains a `Mzizi` row (the root: language, registry, design system; hematite; Root; precise, honest, grounded), with a note that hematite is a Heritage tone rather than one of the seven minerals, how `/v1/brand` serves it, and which stylesheets set it. Copper stays the ecosystem layer, not Mzizi's own surfaces. The skill's description says the same.
- **`mzizi-roots`:** the `--brand-accent` examples add a Mzizi surface = hematite.
- **`discoverability`:** the OG image guidance names the brand's colour (for mzizi.dev, hematite) instead of "the brand mineral".
- **The public Claude Code plugin is 1.2.1** (`plugin/.claude-plugin/plugin.json`), and its description and the marketplace entry name skills 0.8.2. `mzizi-language` and `mzizi-backend` are unchanged.

### Security — raise five dependency override floors past new advisories (2026-09-30, #383)

- `pnpm audit --audit-level=moderate` (the pre-commit hook and the required Security Audit check) failed on advisories published after the last green run: `brace-expansion` (uncontrolled recursion and quadratic expansion; reached through `@opennextjs/cloudflare`), `fast-uri` (inconsistent host case; through `shadcn`) and `ip-address` (subnet comparison and parse diagnostics; through `mongodb`). The `pnpm.overrides` floors move to the patched versions: `brace-expansion` `^5.0.12` (and `minimatch>brace-expansion`), `minimatch@8>brace-expansion` `^2.1.7`, `fast-uri` `^3.1.8` and `ip-address` `^10.7.1`. The lockfile is regenerated. No direct dependency changes.

### Changed — Mzizi's default primary is hematite (2026-09-30, #380)

- **Visible change: the default `--primary` of `mzizi-tokens-globals.css` is now hematite, not gold.** A consumer that copied this stylesheet and sets no `data-brand` renders its primary as `var(--heritage-hematite-aa)` instead of `var(--mineral-gold-aa)`, and the `[data-brand="mzizi"]` block moves the same way. The owner decided Mzizi's brand mineral on 2026-09-30 (#378); gold had been borrowed from nyuchi because canon had no mzizi record.
- **The stylesheet's brand blocks now read their family from the `/v1/brand` ecosystem table** instead of typing it into `scripts/render-globals-css.ts`, so the two cannot disagree again. The only row with no record is `news`, which is unchanged. Every other brand's value is unchanged.
- **To keep gold:** put `--primary: var(--mineral-gold-aa);` in your copy's LOCAL OVERRIDES block, or set `data-brand="nyuchi"`.
- **Unchanged:** `--ring` stays cobalt for every brand. The `mzizi-tokens` Rust crate carries the palette only (no brand default), so its generated copy does not change; a test pins that.

### Fixed — the public Claude Code plugin loads, and ships only what it should (2026-09-30, #381)

- **The plugin manifest failed validation, so the plugin could not load.** `claude plugin validate` rejected `repository` (an object; it must be a string) and the MCP entry's `"type": "url"` (not a transport). The MCP entry is now `{ "type": "http", "url": "https://mcp.mzizi.dev/mcp" }`, and the fields Claude Code ignores (`icons`, `permissions`, `$schema`) are gone.
- **The plugin moves from the repo root to `plugin/`.** Claude Code always loads `.mcp.json` at a plugin's root and the manifest cannot exclude it, so a root-level plugin would have configured this repo's developer `shadcn` MCP for every user. The manifest is now `plugin/.claude-plugin/plugin.json` (version 1.2.0), the skills are `plugin/skills/`, and `.claude-plugin/marketplace.json` points at `./plugin`. The install lines do not change: `/plugin marketplace add mzizi-dev/mzizi-registry`, then `/plugin install mzizi@mzizi`. Installed from the branch, the plugin registers five skills and one MCP server (`mzizi`), with no hooks or agents.
- **Breaking** for anything that read `.claude-plugin/plugin.json` or `skills/` at the repo root: they are now under `plugin/`.

### Changed — agent skills 0.8.1 (2026-09-30, #381)

- **`@nyuchi/mzizi-skills` `^0.8.1`** (lockfile 0.8.1). `lib/skills.generated.ts` and `plugin/skills/` are regenerated. 0.8.1 changes only `mzizi-roots`'s plugin install lines.
- **Each skill's `source` is `mzizi-dev/agent-tools/mzizi-skills/…`**, not `mzizi-tools/mzizi-skills/…` (the repository's old name). `/v1/skills` and `/v1/skills/{name}` return the new value.
- **`openapi.yaml`:** the `/skills` routes no longer describe a `nyuchi-design skills` CLI subcommand, which does not exist, and the example skill name is `mzizi-design`.
- **The N12 skills rung** (`/v1/architecture`) now describes what is true: no database copy, the generators and their `--check` gates, `mzizi_get_skills`, the working install lines and the public plugin. It used to describe a Supabase `skills` collection, `get_skill` / `list_skills`, `pnpm skills:sync` and `npx skills add`.

### Added — the `changelog / entry required` check, and the missing entries (2026-09-30)

- **New CI check, `changelog / entry required`** (`.github/workflows/changelog.yml`, logic in `scripts/changelog-gate.sh`). It fails a pull request that changes any non-exempt file without adding a line to this file. Exempt: the `no-changelog` label (pure CI, lint or typo changes), and pull requests that touch only `.github/`, lockfiles or lint config. `scripts/changelog-gate.test.sh` tests the gate, and the check runs it first. The same two scripts are in mzizi-api-gateway, mzizi-site, mzizi-docs and agent-tools.
- **Backfilled every merged pull request since the v1.0.0 release** (#183, 2026-07-26) that had no entry here, through #379, and added a `[1.0.0]` section for the release itself. The four entries dated 2026-04 that sat under Unreleased (from #43) move under `[1.0.0]`, where they shipped.
- `AGENTS.md` gains a Changelog section beside the freshness rule, and no longer says `CHANGELOG.md` is generated on a version bump: it is written by hand, and `release.yml` only tags the release. The header of this file now names the registry and states the rule.

### Added — the public `mzizi` Claude Code plugin carries the skills, and a marketplace (2026-09-30, #379)

- **The plugin in this repository now ships the five agent skills as well as the MCP.** The only plugin with skills lived in the private `mzizi-dev/agent-tools`, so nobody outside the org could install it. `skills/` is a byte-for-byte copy of `@nyuchi/mzizi-skills` 0.8.0 (5 skills, 10 files), written by `scripts/generate-plugin-skills.mjs` (`pnpm plugin:skills`) and checked in CI by `pnpm plugin:skills:check`, because a plugin installs from git and cannot read `node_modules`.
- **New `.claude-plugin/marketplace.json`:** marketplace `mzizi` with one plugin, `mzizi`. Install with `/plugin marketplace add mzizi-dev/mzizi-registry`, then `/plugin install mzizi@mzizi`.
- **`.claude-plugin/plugin.json` 1.0.0 → 1.1.0** describes the five skills and the MCP as they are (Rust first, free except the Fundi tools), and names `support@bundu.org` as the author contact. It used to describe a "Seven African Minerals palette" and tools that no longer exist.
- **`/skills` install lines are fixed.** They pointed at the private agent-tools marketplace and at `npx skills add @nyuchi/mzizi-skills`, which the skills CLI reads as a GitHub repository and fails to clone. They now give `npm install -D @nyuchi/mzizi-skills` with `npx skills experimental_sync`, and this repository's marketplace.

### Added — Mzizi's brand mineral is hematite (2026-09-30, #378)

- **`/api/v1/brand` gains a `mzizi` row in `ecosystem`, with `mineral: "hematite"`** (owner decision, 2026-09-30), at `sortOrder` 17 so no existing row moves. The table is the brand-to-mineral map, and it had no Mzizi row, so consumers guessed; `@bundu/ui`'s Mzizi overlay carried a local fallback marked "pending confirmation". Hematite is a heritage tone, so `BrandEcosystemEntry.mineral` is documented as naming a palette family, usually a mineral. A test checks that every ecosystem row names a family the palette serves.
- api.mzizi.dev serves the row once the gateway's registry pin moves past this commit.

### Changed — `/api/v1/skills` serves `@nyuchi/mzizi-skills` 0.8.0: five skills (2026-09-30, #377)

- **The skills dependency moves from `0.5.1` to `^0.8.0`**, so `/api/v1/skills` (and api.mzizi.dev `/v1/skills` after the gateway re-pins) serves the five 0.8.0 skills, `mzizi-language`, `mzizi-roots`, `mzizi-design`, `mzizi-backend` and `discoverability`, instead of nine including the retired `bundu-design`. npm and mcp.mzizi.dev already served 0.8.0. `lib/skills.generated.ts` is regenerated.
- **Breaking:** 0.8.0 renames, merges or removes the older skills with no aliases, so `/api/v1/skills/{name}` answers 404 for the old names. `nyuchi-design` is now part of `mzizi-design`; the `/skills` page's example request names `mzizi-design`.

### Changed — the code of conduct reports to `support@bundu.org` (2026-09-30, #376)

- **`CODE_OF_CONDUCT.md` names `support@bundu.org`**, the Mzizi contact the owner set on 2026-09-30, as the address for conduct reports. Security reports stay at `security@bundu.org` (`SECURITY.md`).

### Changed — the site, docs and skills freshness rule (2026-09-30, #375)

- **`AGENTS.md`, `CONTRIBUTING.md` and the pull request template record the owner's rule** that mzizi.dev, docs.mzizi.dev and `@nyuchi/mzizi-skills` must never lag this repository. A pull request with a user-visible change says so under a `Site/docs/skills impact` heading, so the standing freshness agents pick it up.

### Added — Mzizi Roots: the first batch, the umbrella crates and crates.io publishing (2026-09-29, #372)

- **New `mzizi-brand` crate (node N3), with Dioxus ports of twelve brand components** beside their `.tsx`: `mzizi-alert-banner`, `-avatar-stack`, `-cover-header`, `-empty-state`, `-escalation-card`, `-gauge-card`, `-hero-stat`, `-meta-tile`, `-stats-row`, `-success-screen`, `-suitability-card` and `-user-card`. Each exports a `CONTRACT` in the Mzizi language's `contract … end` clause grammar (RFC-0006); the crate's contract suite renders each component with `dioxus-ssr` and evaluates every clause against the markup, and a clause it cannot evaluate fails.
- **New umbrella crates `mzizi-roots`** (re-exports tokens, ui, brand and shell) **and `mzizi-roots-server`** (assurance, fundi, docs and discovery), each part a default feature. The eight node crates keep their names.
- **Fixed: `/api/v1/rs/{name}` named `mzizi-ui` as the crate for every component**, which was wrong for 34 of the 43 it served (`mzizi-footer` is in `mzizi-shell`, `mzizi-seo` in `mzizi-discovery`). `crate.name` now comes from `mzizi-rs/crate-for-node.json`, and a new `crate.git` gives an install that works before and after a crates.io release. The response shape is otherwise unchanged.
- **`publish-crates.yml`** publishes the workspace crates to crates.io, in dependency order, on merges to `main` that touch the Rust (dry run by default when run by hand). Each crate README gains the git install line, and `mzizi-ui`'s description names its nine primitives.
- **Security:** the `markdown-it` override moves to `^14.3.1` (GHSA-253c-mchw-3w2r, reached through markdownlint-cli2).

### Changed — Mzizi is named as the registry's operator (2026-09-29, #374)

- **README, `NOTICE` and the Claude Code plugin manifest no longer say Nyuchi operates or develops Mzizi.** Mzizi owns and operates the registry, the design system and the API; the Bundu Foundation is the copyright holder; Nyuchi operates only the Mzizi console and the revenue products. The `NOTICE` copyright line is unchanged.

### Changed — search reads the fields items have; file-backed routes serve their files (2026-09-29, #373)

- **`/api/v1/search` filters on `node` and `categories`, and returns `type`.** It used to filter on `layer` and `category` and project `registry_type` — the retired database row's field names, which no registry item carries — so those filters matched nothing and every hit was a bare name and description. Hits now carry `name`, `type`, `title`, `description`, `categories`, `node` and `nodeLabel`, and `meta` reports `node` instead of `layer`. Parameters combine (AND).
- **`?layer=` is deprecated.** It still works, as an alias of `?node=`, so older clients keep their results; a response to it carries `meta.deprecation` and a `Deprecation: true` header. It will be removed.
- **`/api/v1/ui/{name}/docs` and `/api/v1/ai/instructions/{name}` serve their files** instead of `503 Database not configured`, with the shapes they had before the Supabase removal. This is what `api.mzizi.dev` (mzizi-dev/mzizi-api-gateway) already serves.
- **`/api/v1/ui/{name}/versions`** still answers `503`, and now says why: version history is console-owned data, and this API has no database.
- **The discovery document and `openapi.yaml` stop describing a database.** `database: { status: "not_configured", components: 0 }` is replaced by `data: { source: "files", repository, components }` with the live count; the "operated and developed by Nyuchi" and "All data routes read from Supabase" lines are gone; Mzizi is named as the operator and the Bundu Foundation as the project's home. The schemas for docs, search and AI instructions now match their handlers, and no file-backed route lists a `503` any more.

### Added — the Mzizi Roots RFC (2026-09-29, #371)

- **`docs/roots/RFC-roots.md`:** an inventory of all 434 mzizi- and nyuchi-owned items by node and collection with their Rust status and planned batch; what a Roots UI or server component is, including the contract every one carries; crate naming and install; an additive API change that serves Rust first without breaking a URL; and the order of conversion in six batches.

### Changed — dependency updates (2026-09-29, #370)

- The ten open dependabot updates, #357 to #366, in one change: `@react-three/fiber` ^9.8.1, `typescript-eslint` ^8.70.1, `lucide-react` ^1.48.0, `three` ^0.186.1, `@next/mdx` ^16.3.6, `markdownlint-cli2` 0.23.3, `vite` ^8.3.1 (dependency and pnpm override), `wrangler` ^4.141.0, `tailwind-merge` ^3.7.0, `jsdom` ^30.1.1 and `vitest` ^5.0.2.

### Security — security reports go to `security@bundu.org` (2026-09-29, #369)

- **`/.well-known/security.txt` `Contact` and both fallback addresses in `SECURITY.md` are `security@bundu.org`** (owner decision, 2026-09-28: every Mzizi surface except the console). A test pins the address.

### Removed — Supabase (2026-09-29, #368)

- **The registry holds no database, client or credential.** `registry.json` and the files on disk are the whole data layer. Removed: the Supabase client and every database-backed reader and writer in `lib/db`, the `usage_events` tracker in `lib/metrics` and its call in every route, `supabase/functions` (the analytics edge function), the one-time extraction scripts, the seed module, `LiveComponentCount`, the Supabase MCP server entry, the `SUPABASE_*` environment examples, and the `@supabase/server` and `@supabase/supabase-js` dependencies.
- **Breaking** for anything that imported those modules. Nothing a consumer of the API sees changes: Supabase was never configured on the registry Worker, so the gated routes and pages already served their "not configured" answer, and now serve it directly. Pages whose content is file-backed keep their implementation behind `RENDER_FILE_BACKED_PAGES` (off).
- **Security:** the `ip-address` and `undici` overrides move past three moderate advisories.

### Changed — `NOTICE` names the Bundu Foundation as copyright holder (2026-09-29, #356)

- **`NOTICE` and the README licence line name the Bundu Foundation** as the parent copyright holder; Mzizi is not a separate legal entity. Other text stays Mzizi.

### Changed — `nyuchi-*` components are now `mzizi-*` (2026-09-27, #355)

- **All 123 `nyuchi-*` registry components are renamed `mzizi-*`.** Mzizi owns the registry, and Nyuchi operates it. The full old → new list is in `lib/component-renames.json`. Install them under the new name, for example `npx shadcn@latest add https://api.mzizi.dev/v1/ui/mzizi-footer` (previously `.../nyuchi-footer`).
- **Exported names follow the rename:** `Nyuchi*` → `Mzizi*`, `useNyuchiHarness` / `useNyuchiQuery` → `useMziziHarness` / `useMziziQuery`, the `nyuchi*Dark` / `nyuchi*Light` token constants → `mzizi*`, and the Rust modules `nyuchi_*` → `mzizi_*`.
  - `data-slot` and `data-portal` values change with them.
  - The earlier `mzizi-*` safety, resilience and assurance components are covered too; they still exported `Nyuchi*` names with `nyuchi-*` slots.
- **Old URLs keep working.** Every old URL form 308-redirects to the new slug on `mzizi.dev` and on the `api.mzizi.dev` Worker. That covers `/components`, `/source`, `/playground`, `/changelog`, `/api/v1/ui` (with `/docs` and `/versions`), `/api/v1/rs`, `/api/health`, `/api/chaos`, and the `/v1/*` API shape. Existing links and `shadcn add` commands still resolve.
  - The MCP `get_component` tool also accepts an old name.
- **Version history keeps its data.** `component_versions` is read under both the old and new names. A forward data migration, `supabase/data-migrations/20260927_rename_nyuchi_components_to_mzizi.sql`, moves the rows to the new names; it can be applied before or after deploy.
- **Unchanged:** npm package names and scopes (`@nyuchi/*`, `@bundu/*`), the Kotlin package `com.nyuchi.design.tokens`, CSS animation and keyframe names (`nyuchi-fade-slide-up`, …), `NyuchiLogo`, the AI-instruction document slugs, database names, and telemetry rows recorded under the old names.

### Added — primitives wave 1 in Rust: input, label, avatar, separator, progress and chart (2026-09-27, #351)

- **Dioxus ports in `mzizi-ui` of `input`, `label`, `avatar` (all six pieces), `separator` and `progress`**, among the most depended-on primitives. Before this, only `button`, `badge` and `card` had a Rust sibling, and the Phase 0 benchmark scores against those. **`chart` is ported as its container and contract only** (`data-slot`/`data-chart`, the class list, the loading skeleton); the Recharts-specific config, tooltip and legend pieces have nothing in Rust to port against. `/api/v1/rs/{name}` serves all six.

### Changed — Mzizi owns the non-revenue work; docs move to docs.mzizi.dev; README and AGENTS.md split (2026-09-27, #352, #353, #354)

- **Mzizi, not the Bundu Foundation, is named as owner** in `NOTICE`, the README, package and plugin metadata, the OpenAPI `info`, site metadata and JSON-LD, page copy, crate READMEs and the brand-system name. In served data, registry `meta.owner` and doctrine `owner` values `bundu` become `mzizi`, and N9 (fundi) reads "Nyuchi-operated, Nyuchi-governed". Nyuchi text, identifiers and URLs are unchanged. (#354)
- **Every link meaning "Mzizi's docs" points at docs.mzizi.dev**, including the `migrated_to` entries that `/api/v1/docs` answers with; `docs.bundu.org/mzizi` returns 404. (#353)
- **The README is split:** the human overview stays, and the full command reference, the generate/check pattern, the Rust gates and the honesty rules move to a new `AGENTS.md`. (#352)

### Added — the combined `globals.css` as a registry item (2026-09-25, #350)

- **`nyuchi-tokens-globals.css` (now `mzizi-tokens-globals.css`) is the eighth token target:** one self-contained stylesheet with `@import "tailwindcss"`, its own `@theme`, `:root`, `.dark`, the per-brand blocks and every non-colour ladder, so a repository can copy it in as its `globals.css`. It is generated from `lib/tokens/palette.source.ts` through the same drift gate as the other seven.

### Changed — Mzizi documentation lives in mzizi-docs, at docs.mzizi.dev (2026-09-25, #324)

- **The N10 documentation rung names one home for Mzizi's docs**, `mzizi-dev/mzizi-docs` on Mintlify at docs.mzizi.dev, instead of two Starlight sites in other orgs. Those sites keep their own non-Mzizi content.

### Changed — dependency updates (2026-09-25 to 2026-09-27, #340 to #349)

- `dompurify` 3.4.15, `lint-staged` 17.5.1, `lucide-react` 1.44.0, `input-otp` 1.5.0, `typescript-eslint` 8.70.0, `@supabase/server` 1.6.0 (since removed by #368), `shadcn` 4.21.0, `zod` 4.6.2, `@next/mdx` 16.3.4 and `@types/node` 26.6.2.

### Changed — the API is advertised and served at `api.mzizi.dev/v1` (2026-09-11 to 2026-09-14, #325, #327, #335, #339)

- **The docs, `llms.txt`, the OpenAPI `servers` entry and the API's own responses advertise `https://api.mzizi.dev/v1`** instead of `https://mzizi.dev/api/v1`. The path changes shape as well as host: `mzizi.dev/api/v1/X` becomes `api.mzizi.dev/v1/X`. No route is removed. (#325)
- **`registry.json` moves its 1,373 URLs onto `api.mzizi.dev/v1`**, including 804 `registryDependencies`, so `npx shadcn add https://api.mzizi.dev/v1/ui/<name>` resolves every dependency on the same host. (#327)
- **`/v1/*` is served at the root of the API host** as a rewrite of `/api/v1/*`, so both shapes answer and no install pays a redirect per dependency. Deploys install `wrangler`, which `@opennextjs/cloudflare` needs as a peer. (#335)
- The README links the canonical `/v1` form. (#339)

### Fixed — every token emitter carries the same 21 colour families (2026-09-11, #329, #330)

- **`nyuchi-tokens-typescript` carried 10 of the 21 families**, and six of its hexes predated the Seven palette (`baobab` was `#A5D6A7`, a green, where the palette says `#A1887F`). Its palette region is now generated between markers, and the six generated platform emitters (Swift, Kotlin, ArkTS, Python, React Native, Rust) gain the seven experimental tones. A gate fails when any emitter's family set differs. (#329, #330)

### Changed — the seven Rust crates are publishable (2026-09-11, #328, #331, #337)

- **Every crate can be packaged for crates.io.** They reached their components through `#[path]` includes four levels above the crate root, which `cargo package` cannot carry; each now includes a committed copy under `src/generated/`, written by `pnpm rust:generate` and checked in CI. (#328)
- Every crate has a README, keywords and categories, and the registry README and the seven crate READMEs were corrected against what they ship. (#331, #337)

### Changed — brand, changelog, health and node detail are served from files (2026-09-11, #332)

- **`/api/v1/brand`, `/api/v1/changelog`, `/api/v1/health` and the node detail route answered 503 on the Worker**, which carries no database credential. The brand collections are committed as `lib/tokens/brand.source.ts`, and the release history as `content/changelog/releases.json`, so they answer from files.

### Added — the washed theme in the registry (2026-09-11, #333)

- **New N3 component `nyuchi-washed-theme` (now `mzizi-washed-theme`):** the one implementation of "surface tinted by accent", which had been built four ways. From a named family or an explicit accent it emits `--washed-accent`, `--wash`, `--washed-on-wash` and `--washed-gradient`, plus the `--event-*` aliases existing pages read; `resolveWashedTheme()` solves a theme without rendering. The heritage accents in `lib/tokens` are fixed.

### Changed — org references and audit floors (2026-09-11, #319, #320)

- **85 references to `nyuchi/mzizi` or `nyuchi/mzizi-tools`** across routes, doctrine, docs, workflows and `security.txt` name `mzizi-dev/mzizi-registry` (or the right repository), decided one by one: `mzizi-dev/mzizi` is the language. (#319)
- **Security:** the `pnpm.overrides` floors move past six new advisories: `sharp` ^0.35.4, `js-yaml` ^4.3.2, `hono` ^4.13.5, and a new `smol-toml` ^1.7.1. (#320)

### Fixed — accessible text colours on the architecture page (2026-09-08, #317)

- **Mineral text on `/architecture` uses each mineral's `-on-container` text token**, not its fill. Sodalite's badge text went from APCA Lc -26.2 to Lc -73.9.

### Added — `ui.mzizi.dev` and `plus.mzizi.dev` (2026-09-08, #310, #311)

- **Two proxy Workers split the registry's pages by node:** `ui.mzizi.dev` for N1 tokens, N2 primitives, N3 brand, N6 pages and N7 shell, and `plus.mzizi.dev` for N4 safety, N5 resilience and N8 to N11. Each fetches the page from mzizi.dev or 302s to its canonical URL, gated by a generated node map. (#310)
- The `/cli` page says `ANTHROPIC_API_KEY` is optional for `fundi plan` and `fundi chat`. (#311)

### Changed — dependency updates, and `@tanstack/react-table` v9 (2026-09-05 to 2026-09-08, #235 to #309)

- **The `DataTable` primitive moves to `@tanstack/react-table` 9.2.4** and its Table Features API (`useTable` with `tableFeatures()`), since v9 removed the v8 factory API. A consumer who installs `data-table` now gets v9. (#299)
- **Security:** `sanitize-html` ^2.17.7 clears GHSA-g8qq-57p8-ggw5 (stored XSS through an SVG SMIL URI list), and `qs` is raised. (#298)
- Dependabot updates: `vitest` 5.0.0, `eslint` 10.9.1, `typescript-eslint` 8.69.0, `lint-staged` 17.4.1, `postcss` 8.5.28, `zod` 4.5.4, `dompurify` 3.4.14, `mongodb` 7.6.0, `@supabase/supabase-js` 2.115.0, `lucide-react` 1.37.0, `@next/mdx` 16.3.3, `@hookform/resolvers` 5.9.1, `@base-ui/react` 1.7.0, `@react-three/fiber` 9.7.0, `@react-three/drei` 10.7.8, `tsx` 4.23.13, the testing and types groups, and `actions/checkout` 7.0.1 and `actions/setup-node` 7.0.0.

### Fixed — the palette lint reports only real hits (2026-09-02, #289)

- **`pnpm lint:colors` reported 139 violations, 130 of them wrong**, from three defects in how it matched `var(` fallbacks. It now reports the nine real ones.

### Changed — mzizi.dev and the API run on Cloudflare Workers, with no request-time filesystem reads (2026-08-29 to 2026-08-30, #275 to #287)

- **Skills are served from the published `@nyuchi/mzizi-skills` bundle**, inlined at build time, not from a Supabase collection that a manual sync had let go stale. (#275)
- **Doctrine, the registry index and every component's source are inlined at build time** (`lib/registry-source.generated.json` and the other generated modules), so nothing reads the filesystem at request time. (#276, #277, #278)
- **mzizi.dev runs on Cloudflare Workers through OpenNext**, and **the API has its own Worker at api.mzizi.dev** (`mzizi-api/`), which imports the same route handlers unmodified. (#279, #285)
- Deploys go through the Cloudflare GitHub app, not CI; the short-lived deploy workflow is removed. (#280, #287)
- `next build` typechecks (`ignoreBuildErrors` is gone), `tokens:sync` formats through prettier, and the `--exp-*` block of `globals.css` is generated instead of hand-kept. (#282, #283, #284)

### Changed — one MCP server, and the framework doctrine (2026-08-26 to 2026-08-27, #265 to #273)

- **`mzizi.dev/mcp` answers 308 to `mcp.mzizi.dev/mcp`.** The registry's own four-tool MCP (`lib/mcp-server.ts`) is removed; mcp.mzizi.dev is the one Mzizi MCP. 308 keeps the method and body, so a client configured against the old URL keeps working. (#272)
- **The recorded framework doctrine is Astro with Vite+:** the UI is Astro, underneath is Rust first and TypeScript second, with no third UI framework. It was "Next.js + Capacitor", served to every agent through `/api/v1/architecture/frontend` and `mzizi_get_doctrine`. Cloudflare Workers is the deployment default. The pnpm `vite` override moves to ^8. (#269, #271, #273)
- **Fixed:** the plugin manifest described MCP tools that did not exist (#268), and "Five African Minerals" survived in seventeen places, two of them rendered (`signup-03`, `chart-radial-shape`) and six served in `registry.json`; the palette is seven per family (#265).

### Added — `/api/v1/brand` serves all 21 colour families (2026-08-24, #260, #261)

- **The heritage and experimental sevens join the minerals** in `/api/v1/brand`, which served 7 of 21, so `mzizi_get_tokens(family: "heritage")` works. The experimental tones join token generation, and tests assert the counts and the hexes. (#260, #261)

### Changed — the site tells the agentic-web framework story (2026-08-23 to 2026-08-24, #258, #259)

- **Every content surface on mzizi.dev describes Mzizi as a Rust framework for the agentic web**, with the registry as the Phase 0 benchmark corpus and a status note that Phase 0 has no toolchain to install and no benchmark numbers yet. (#258)
- **The "Nyuchi Design Portal" name is retired** everywhere it outlived its guard, including the `/api/v1/stats` title and the rendered `sidebar-01`. (#259)

### Added — Rust ports of N7, N10 and N11 (2026-08-11 to 2026-08-23, #253, #254, #256, #257)

- **`mzizi-shell` (N7) ports 12 of 16 shell components**; `app-switcher`, the header and the sidebar wait on N2 primitives in Rust, and the root layout has no Dioxus equivalent. **`mzizi-docs` completes N10** (4 of 4, including the two Dioxus renderers) and **`mzizi-discovery` completes N11**. Porting fixed a JSON-LD injection in `nyuchi-seo` (`</script` in a field closed the script element) and a PostgREST filter injection in `nyuchi-docs-api`.

### Security — the vulnerability disclosure path (2026-08-12, #255)

- **Every entry point to private vulnerability reporting was broken:** `security.txt`'s Contact, Policy and Acknowledgments, `SECURITY.md` and the issue-template config led to pages that answered 403 or 404, left over from an unfinished repository rename. Contact and Policy now point at working addresses, Acknowledgments is removed (there is no such page, and RFC 9116 makes it optional), and 35 references to the old repository slug are repointed.

### Fixed — installs from the registry were incomplete or wrong (2026-08-10 to 2026-08-11, #233, #244 to #252)

- **`/api/v1/ui` and `/api/v1/ui/{name}` dropped `type` and `registryDependencies`**, so `npx shadcn add` installed components without their dependencies, and the index had nothing to filter on. They carry both, and the index filters on `type`, `node`, `owner` and `collection`. (#244)
- **Only a component's first file had content;** nine files across five components installed empty. (#245)
- **N1 ships as CSS custom properties** (`cssVars`), so an installed component gets the variables it references; 431 components referenced tokens no install delivered. The theme item has a node, so N1 lists it. (#246, #248)
- **`files[].path` is the source location and `target` the destination**, which `shadcn registry validate` rejected on all 574 items. **567 bare `registryDependencies` resolved to shadcn's components** instead of Mzizi's and now name the Mzizi URL. **New `mzizi-base`** (`registry:base`) sets up a project in one `shadcn init`. (#249, #251, #252)
- **111 Tailwind arbitrary values containing spaces generated no CSS** in 39 components, and validation now fails on one. The log prefix is `[mzizi]` everywhere. **Security:** incident titles and error text can no longer forge Markdown structure in fundi issues or postmortems. (#233)

### Added — N8 assurance and N9 fundi in Rust (2026-08-08 to 2026-08-10, #228 to #232)

- **Every N8 and N9 logic component has a Rust core** in the new `mzizi-assurance` and `mzizi-fundi` crates, each against the component's contract rather than a translation, with contract suites. The ports fixed defects the TypeScript still had, among them: fundi's "requires human approval" was overridden by `autoHeal`; one SLO breach fired an alert per escalation tier; recurrence could lower a defect's severity; an empty service list reported "All Systems Operational". (#232)
- **New `mzizi-otel`**, an OTLP exporter for N8's signals, and `pnpm browser:check`, which renders pages and reports each run over OTLP. **Breaking** for `mzizi-rum`: it had no working default endpoint (it posted to a route that never existed), so it now has none and sends nothing until one is set. (#230, #231)
- The `--status-*` tokens N1 declares are defined, and 36 bare hexes use tokens. (#228)

### Security — five XSS sinks and two build-time advisories (2026-08-08, #220)

- **`markdown-renderer` escaped table cells and checked link schemes;** before, a table cell was a raw HTML sink and a `javascript:` link rendered. Three more sinks are closed, 107 broken consumer installs are fixed, and `js-yaml` and `nanoid` are raised past two high-severity advisories.

### Changed — component source, docs and doctrine move from Supabase into the repository (2026-08-02 to 2026-08-08, #193 to #227)

- **All 571 components are files on disk** under `components/registry/n<N>-<label>/`, read through one reader; the database column and its fallback are gone. Moving them let the toolchain see them, and it found files that had never compiled, among them `nyuchi-seo`, `nyuchi-fundi` and the ten login and signup screens. A 13th "component", `accessibility-audit`, was SQL comments and is now documentation. The 249 components the database view had hidden are served. (#195, #197 to #205, #215)
- **Doctrine is MDX in `content/doctrine/`** and component docs live in each item's `meta` block in `registry.json`, so the registry is entirely in git. **The registry goes bilingual:** a cargo workspace (`mzizi-rs/`), the first Dioxus primitives and `/api/v1/rs/{name}`. Nine routes that answered 503 for content in their own bundle answer from files. (#193, #218)
- **The playground renders every component** instead of 23 hand-written demos, against sample data whose shapes match the production collections. (#218, #219, #227)
- **Fixed:** `/api/v1/ui/{name}/versions` answered 500 for every component; 105 components' `registryDependencies` were not resolvable by the shadcn CLI; and CI now validates that every item installs. Chart.js is a runtime dependency. **Security:** every file path built from a non-literal is validated. (#193, #206, #212 to #214)

### Changed — the DNA double helix replaces the axis model (2026-07-31, #191, #192)

- **Breaking:** `/api/v1/architecture/axes`, `/architecture/frontend/axes`, `/architecture/frontend/layers` and `/architecture/layers/{n}` answer **410 Gone** with a `migrated_to` pointer, and `/api/v1/architecture` returns the helix, `{ nodes, rungs, strands }`. The site, `llms.txt`, the OG images and the observability chart speak the helix, and node pages are linked and in the sitemap. (#191, #192)
- **Breaking (MCP):** `list_components` no longer caps `node` at 10, so N11 and N12 are reachable. (#192)
- The portal ships the Mzizi icon and a full favicon set. (#192)

### Added — `mzizi.dev/skills` and `mzizi.dev/cli` (2026-07-29, #190)

- **Two pages for the skills bundle and the CLI:** install routes, the skill list read from the registry, and how to read a skill over HTTP and MCP.

### Changed — skills move to `nyuchi/mzizi-tools` (2026-07-29, #190)

- **The `skills` Supabase collection is now read-only from this repo.** Skill content is authored in git as `mzizi-skills/skills/<name>/SKILL.md` in `nyuchi/mzizi-tools`, published as the public npm package `@nyuchi/mzizi-skills`, and projected into the collection by that repo's `pnpm skills:sync`. The portal continues to serve it at `/api/v1/skills*` and via MCP `get_skill` / `list_skills` — it just never writes it. Documented in `CLAUDE.md` §15.23 (which previously asserted the opposite), §6.1, §3, and the `SkillRow` doc comment in `lib/db/types.ts`.

### Removed — the broken skills sync, the duplicated skill files and the npm publish step (2026-07-29, #190)

- **`scripts/sync-skills.ts` and the `skills:sync` / `skills:verify` scripts.** The script was doubly broken: it wrote to `packages/design-agent-skills/skills/<name>.md`, a directory that left this repo when that package moved to `mzizi-tools` (so `skills:sync` could only throw `ENOENT` and `skills:verify` reported permanent drift), and it pulled **DB → disk** while `mzizi-tools`' `sync-skills.mjs` pushes **disk → DB**. Two writers aimed at one collection from opposite ends meant whichever ran last silently reverted the other — the mechanism behind the drift found across the skill bodies.
- **The three duplicated skill files** — `.claude/skills/{nyuchi-design-system,ecosystem-app-setup,scaffold-component}.md`. All were copies of registry rows and all had drifted: `nyuchi-design-system` is superseded by the bundle's `nyuchi-design` and still taught the retired L1–L10 "3D architecture" axes; `ecosystem-app-setup` pointed at `npx @nyuchi/design-cli init` (a command that never shipped, under a package name that no longer exists) and `nyuchi/design-agent-skills`; `scaffold-component` was a stale fork of a row already updated to the node model. Their content lives on, corrected, in `@nyuchi/mzizi-skills`. `.claude/skills/README.md` now explains where the skills went and how to install them; the directory remains available for skills specific to working on the portal codebase.
- **The npm publish step in `release.yml`.** It ran `pnpm --filter @nyuchi/design-agent-skills publish` and `--filter @nyuchi/design-cli publish` on every version tag. With no `packages/` tree those filters matched nothing, so the step was a silent no-op — and had it ever matched, it would have republished the very names `mzizi-tools` deprecates in favour of `@nyuchi/mzizi-skills` and `@nyuchi/mzizi-cli`. This repo deploys to Vercel and publishes nothing to npm.
- **The broken `skills` array in `.claude-plugin/plugin.json`**, whose three paths under `./packages/design-agent-skills/skills/` did not exist. The skills ship with the `mzizi` plugin in `mzizi-tools`, which symlinks the bundle; this repo's plugin contributes the MCP server registration. Its description also claimed "Five African Minerals" (there are seven) and the retired "open 3D frontend architecture" (it is the DNA double helix).

### Changed — dependency updates (2026-07-28, #189)

- `@modelcontextprotocol/sdk` 1.30.0, `@supabase/supabase-js` 2.110.9, `@types/node` 26.1.2, `shadcn` 4.16.0 and `markdownlint-cli2` 0.23.2, all within their existing ranges.

### Changed — CONTRIBUTING, README and SECURITY match the repository (2026-07-27, #188)

- `CONTRIBUTING.md` no longer describes a `packages/` workspace that does not exist, and the `pnpm check` gate list in the README and `SECURITY.md` matches the real script (with `lint:colors` and `tokens:verify`).

## [1.0.0] - 2026-07-26

The first public release of the Mzizi portal codebase (#183). The code version resets to 1.0.0: the portal is not published to npm, and the 4.x line was its internal pre-1.0 iteration. The design-system doctrine line stays at v5, separate from the code version.

This file was not kept between 4.0.26 and 1.0.0, so this section summarises the period from the release record and the git history. The per-version records for 4.0.27 to 4.2.0, and for 1.0.0, are in `content/changelog/releases.json`, served at `/api/v1/changelog`. The full history is `git log v4.0.26..v1.0.0`.

### Added

- **The DNA double helix** as the architecture model (4.1.0), with a 3D helix on `/architecture` (2026-07-24).
- **Node-aware portal surfaces** (4.0.40, 2026-05-24): `/changelog`, `/tools`, `/ubuntu`, `/playground` and the observability panels, and a document-route MCP.
- **The seven-mineral and seven-heritage colour system** (2026-06-29), then the Experimental Seven, the status colours and the surface ladder on `/tokens`, and the 4.2.0 surface tokens `--pitch`, `--void` and `--wash` (#182).
- A shell with a collapsible sidebar and a ⌘K command palette, a larger footer, per-component Open Graph cards, and privacy and terms pages (2026-07-23 to 2026-07-24).
- Skills distribution, the `@nyuchi/design-cli` package and a Claude Code plugin (#65, 2026-04-27).

### Changed

- **The project became Mzizi** (#100, 2026-05-22): the identity moved from the Nyuchi Design Portal, the licence became Apache-2.0, Stytch and the fundi code were removed from this repository, and design.nyuchi.com 308s to mzizi.dev (4.1.8).
- Nextra was replaced by `@next/mdx` with a dashboard shell (#57), and the landing page and docs shell were split and rebuilt (2026-06-30 to 2026-07-01).
- Dependencies refreshed to latest (#181), and the `postcss` override moved past a high-severity advisory (#180).

### Entries written at the time (2026-04, #43)

These were recorded under Unreleased when they merged, and shipped in this release.

#### Added

- **`LICENSE`:** the repo was previously unlicensed. Added the MIT License with a note that `/api/v1/stats` usage metrics remain under CC BY 4.0.
- **`.github/workflows/lint.yml`:** new required-check workflow with four jobs — `actionlint`, `JSON validity`, `prettier`, `markdownlint` — wired to report under the `lint / <tool>` status names the branch protection rules expect.
- **`.markdownlint-cli2.jsonc`:** explicit markdownlint config so the new job runs with the exact same rules locally and in CI. Existing docs were updated to pass them (blank lines around tables, consistent ordered-list numbering) instead of relaxing the rules.
- **`.claude/skills/README.md`:** install instructions for the three skills (symlink from a local portal clone, copy via `curl`, or pair with the MCP server). The skills themselves are now in proper `---`-frontmatter format, addressing the "make them installable" request.

#### Docs

- **Rewrote `CLAUDE.md`** to match the post-v4.0.26 Supabase-first state (issue #30). Supabase is now documented as the single source of truth for components, docs, brand, architecture, AI instructions, changelog, and fundi; `registry.json` is described as a generated snapshot produced by `pnpm registry:sync` and verified in CI by `pnpm registry:verify`. Directory tree, API table, MCP tools list (18), and pre-commit gates all refreshed. Covered the new `/api/v1/{docs,changelog,fundi,search,ai/instructions,ui/[name]/docs,ui/[name]/versions}` endpoints and the `mukoko://ubuntu` resource.
- **Corrected the 3D frontend architecture description** in `CLAUDE.md` and `public/llms.txt` to match `get_layer_counts()` (issue #46): ten layers across **five** axes — X (L2/L3/L6/L7 composition), Y (L1 tokens / L4 safety / L5 resilience), Z (L8 assurance), Outside (L9 fundi), Documentation (L10). The previous "Outside = docs" / "Meta = templates" wording was wrong.
- **`README.md`:** fixed the MCP config example (`nyuchi-design-portal`, matching `.claude/settings.json`), expanded the tool table to all 18 MCP tools, and refreshed the `/api/v1/` endpoint table.
- **`CONTRIBUTING.md`, `.claude/skills/*`, `.github/pull_request_template.md`:** replaced `registry:build` references with the correct `registry:sync` / `registry:verify` flow and the Supabase-first component authoring steps.

#### Security

- **`/security-review` follow-through (fundi edge function):** added Bearer-token auth on `POST /functions/v1/fundi/heal` matching either `SUPABASE_SERVICE_ROLE_KEY` or an optional `FUNDI_HEAL_TOKEN`; `/heal` now returns 401 without one. Also added a strict allowlist regex (`/^[a-z0-9._-]{1,40}$/i`) on the `scope` field at ingest plus a 200-char cap on `symptom`, so attacker-controlled values can't reach the GitHub label / issue-body sinks malformed.
- **CLAUDE.md §15 rule 22 (new policy):** security findings discovered in any review/audit (`/security-review`, manual, CodeQL, Dependabot, `pnpm audit`) must be fixed in the current PR — never deferred. Codified to prevent the "scope creep / file follow-up issue" pattern that leaves vulnerable code in `main`.
- **4 high + 1 moderate transitive CVEs cleared via `pnpm.overrides`** (caught by audit while applying the policy above): bumped `@xmldom/xmldom` floor to `^0.9.10` (xmldom GHSA-2v35-w6hq-6mfw, GHSA-f6ww-3ggp-fr8h, GHSA-x6wf-f3px-wcqx, GHSA-j759-j44w-7fr8 — XML injection / uncontrolled recursion via `nextra → mathjax → speech-rule-engine → @xmldom/xmldom`); added `uuid: "^14.0.0"` (GHSA-w5hq-g745-h8pq — missing buffer bounds check via `nextra → @theguild/remark-mermaid → mermaid → uuid`).
- Added `pnpm.overrides` for `hono` (→^4.12.14), `dompurify` (→^3.4.0), and `sanitize-html` (→^2.17.3) to clear three moderate CVEs that were blocking the Security Audit CI job and the local pre-commit `pnpm audit` gate. `pnpm audit --audit-level=moderate` now returns clean.
- **Workflow permissions hardening:** every job in `.github/workflows/ci.yml` now declares `permissions: contents: read` explicitly, and a top-level default does the same. Resolves six medium CodeQL `actions/missing-workflow-permissions` findings against `main`.
- **`robots.txt`:** removed the stale `/api/v1/db` `Disallow` (the route no longer exists) and expanded the explicit AI-crawler allow-list — `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `Googlebot`, `Google-Extended`, `GoogleOther`, `PerplexityBot`, `Perplexity-User`, `FacebookBot`, `Meta-ExternalAgent`, `Meta-ExternalFetcher`, `Applebot`, `Applebot-Extended`, `CCBot`, `cohere-ai`, `Diffbot`, `DuckAssistBot`, `Bytespider`, `YouBot`, `Amazonbot`. The design system is built for AI consumption and the robots file now says so clearly.
- **`SECURITY.md` rewritten** with concrete response timelines, scoped surface, safe-harbour clause for good-faith security research, explicit out-of-scope items, and a reference to the live `/api/v1/changelog` endpoint instead of a hardcoded version.
- **`public/llms.txt` refactored** so every count and version points to a live API endpoint. No hardcoded registry totals remain — crawlers / agents are instructed to fetch `/api/v1/stats` for the authoritative numbers.

#### Changed

- Applied latest patch/minor dependency upgrades per the upgrade-first policy: `next` 16.2.3 → 16.2.4, `typescript` 6.0.2 → 6.0.3, `vitest` 4.1.4 → 4.1.5, `tailwindcss` 4.2.2 → 4.2.4, `@supabase/supabase-js` 2.103.0 → 2.104.0, `@base-ui/react` 1.3.0 → 1.4.1, `typescript-eslint` 8.58.2 → 8.59.0, `pagefind` 1.5.0 → 1.5.2, plus prettier, eslint, postcss, autoprefixer, react-hook-form, shadcn CLI. `vite` / `@vitejs/plugin-react` remain pinned pending vitest@5.

## [4.0.26] - 2026-04-14

### Added

- **5 new Supabase tables** — `ai_instructions`, `documentation_pages`, `changelog`, `component_versions`, `fundi_issues`. Types, query functions, and upserts in `lib/db/{types,index}.ts`.
- **Design tokens via `nyuchi-tokens` component** — new `getDesignTokens()` reads tokens from `components.source_code` where `name='nyuchi-tokens'`. Replaces the legacy `brand_*` path.
- **11 new REST API v1 endpoints** — `/ui/[name]/docs`, `/ui/[name]/versions`, `/search`, `/docs`, `/docs/[slug]`, `/changelog`, `/changelog/[version]`, `/fundi`, `/fundi/[id]`, `/fundi/stats`, `/ai/instructions`, `/ai/instructions/[name]`.
- **Layer breakdown** in `/api/v1/stats` — counts of stable components grouped by `architecture_layer`.
- **6 new MCP tools** — `get_layer_summary`, `get_ai_instructions`, `get_component_links`, `get_changelog`, `get_component_versions`, `get_documentation_page`.
- **MCP system prompt loader** — `loadSystemPrompt()` reads the `nyuchi-mcp-system-prompt` row from `ai_instructions` with a 60s TTL cache and passes it via the server's `instructions` option.

### Fixed

- **#28 — `get_design_tokens`/`get_brand_info` broken tools** — now read from the migrated `nyuchi-tokens` payload (with `getBrandSystem()` fallback) instead of the empty legacy `brand_*` tables.
- **#28 — `scaffold_component` dep detection** — `inferDependencies()` treats `@/*`, `./`, `../` imports as local, so `lucide-react` is never surfaced when source uses `@/lib/icons`.
- **GHSA-q4gf-8mx6-v5v3** — bumped Next.js 16.2.2 → 16.2.3.

### Changed

- **Playground `ComponentGallery`** — split into server + client halves; reads from `getAllComponents()` instead of `registry.json`.
- **`/components/[name]` page** — reads metadata + source from Supabase instead of the filesystem.
- **MCP server version** — `4.0.1` → `4.0.26`; `createMukokoMcpServer()` is now async.
- **`__tests__/api/registry-route.test.ts`** — rewritten to mock the DB client and call the route handler directly (no more `registry.json` file-existence assertions).
- **CLAUDE.md, README.md, public/llms.txt, openapi.yaml, `.claude/skills/*`** — updated counts (294 → 545), version (4.0.1 → 4.0.26), architecture narrative (10-layer 3D model).

## [Unreleased-prior]

### Added

- **Architecture v4.0.1 alignment** — three sources of truth (Supabase, ScyllaDB, Web3 Pod), seven data layers, corrected CouchDB to sync protocol, added Cloudflare Edge layer
- **Brand hierarchy** — bundu ecosystem > nyuchi enterprise > mukoko consumer. 17 mini-apps, 4 substrate, 7 enterprise products, sister brands
- **Mukoko Manifesto integration** — four pillars, five Ubuntu questions, seven covenants, tri-mode (Musha/Basa/Nhaka)
- **Site-wide rebrand** — "nyuchi design portal" naming, design.nyuchi.com domain, all 100+ files updated
- **Nyuchi Design Portal** — full developer documentation portal (71 pages)
  - /docs — Getting started, installation, theming, dark mode, CLI, changelog
  - /components/[name] — Dynamic per-component documentation pages
  - /blocks — Dashboard, authentication, sidebar block documentation
  - /charts — 7 chart type guides with mineral-themed examples
  - /foundations — Accessibility, i18n, layout, typography, motion
  - /design — Token reference, icons
  - /content — Writing guidelines, error messages, inclusive language
  - /patterns — Dashboard, auth, mobile-first, resource layouts
  - /registry — Consuming, contributing, schema, MCP docs
- **DB-first architecture** — all API routes read from Supabase
  - 19 database tables (components, brand, architecture, blocks, portal_pages)
  - Zero hardcoded fallbacks — proper 503 when DB not configured
  - Seed script populates DB from lib/brand.ts and lib/architecture.ts
- **MCP server consolidation** — single URL-based server at /mcp
  - Removed duplicate stdio server in mcp/ directory
  - All data read from Supabase
- **87 new UI components** (82 → 169 total)
  - Chat & Messaging: chat-bubble, chat-list, chat-input, chat-layout, typing-indicator, message-thread, reaction-picker
  - AI & Chatbot: ai-chat, prompt-input, streaming-text, ai-feedback, ai-response-card, source-citation, suggested-prompts
  - Forms: phone-input, tag-input, date-range-picker, time-picker, rich-text-editor, code-editor, color-picker, address-input, transfer-list, number-input, mention-input, autocomplete
  - Data Display: tree-view, kanban-board, virtual-list, property-list, json-viewer, schema-viewer, description-list
  - User & Profile: user-card, avatar-group, profile-header, activity-feed, notification-list
  - E-commerce: product-card, price-display, cart-item, order-summary, payment-method-card, subscription-card, invoice-row
  - Calendar: calendar-week-view, calendar-day-view, event-card, time-slot-picker, agenda-view
  - Productivity: todo-item, checklist, note-card, comment-thread, drag-handle, mention-input
  - Developer: api-key-display, webhook-card, env-editor, code-tabs, code-block, endpoint-card, log-viewer
  - Security: permission-badge, role-selector, mfa-setup, session-list, audit-log-entry
  - Content: markdown-renderer, lightbox, video-player, audio-player, file-preview
  - Navigation: stepper, app-switcher, bottom-sheet, mega-menu
  - Layout: page-header, section-header, settings-layout, split-view, masonry-grid, sticky-bar, infinite-scroll, pull-to-refresh
  - Feedback: announcement-bar, cookie-consent, password-strength, onboarding-tour, changelog-entry, maintenance-page
- **70 chart example blocks** — area (10), bar (10), line (10), pie (11), radar (14), radial (6), tooltip (9)
- **35 page blocks** — dashboard, 5 login, 5 signup, 16 sidebar, profile-page, profile-settings, onboarding-flow, error-page, empty-state, notification-center, search-results, command-center
- **Updated header navigation** — Docs, Components, Blocks, Charts, Brand, Foundations, Patterns, Architecture

### Changed

- All API routes now require Supabase — return 503 with setup instructions if not configured
- global-error.tsx uses design system tokens instead of hardcoded hex colors
- Registry items: 94 → 294 (169 UI + 3 hooks + 11 lib + 70 chart blocks + 35 page blocks + 6 standard blocks)
- Updated all packages to latest versions including major bumps:
  - Recharts 2 → 3, Sonner 1 → 2, Zod 3 → 4, TypeScript 5 → 6
  - Lucide-react 0.x → 1.x, shadcn 2 → 4, @hookform/resolvers 3 → 5
  - react-resizable-panels 2 → 4, @vercel/analytics 1 → 2

### Removed

- mcp/ directory (duplicate stdio server package)
- Hardcoded fallback patterns in all API routes
- Filesystem reads (registry.json, fs.readFileSync) from API routes

## [4.0.1] - 2026-03-09

### Added

- **Brand documentation hub** replacing legacy assets.nyuchi.com
  - `/brand` — Ecosystem overview (bundu, nyuchi, mukoko, shamwari, nhimbe)
  - `/brand/colors` — Five African Minerals palette with interactive swatches
  - `/brand/components` — Component visual specifications
  - `/brand/guidelines` — Typography, spacing, accessibility, voice & tone
- **Brand API** at `GET /api/brand` — complete brand system as JSON (v4.0.1)
- **Brand data module** (`lib/brand.ts`) — single source of truth for all brand data
- **Brand components** — ColorSwatch, TokenTable, MineralStrip, BrandCard, TypeScale, SpacingScale
- **Skeleton loading states** for brand pages
- **Test infrastructure** — Vitest with 67 tests across 6 test files
  - Brand data integrity tests (minerals, ecosystem, accessibility)
  - API route tests (brand API, registry validation)
  - Component rendering tests (BrandCard, MineralStrip, ColorSwatch, etc.)
  - Navigation tests (header links)
- **GitHub Actions CI** — lint, typecheck, test, build on PRs and pushes
- **GitHub Actions Claude Review** — AI code review on every PR using `anthropics/claude-code-action@v1`
- **GitHub Actions Release** — automated releases on version tags
- **ESLint configuration** — flat config (`eslint.config.mjs`) with typescript-eslint
- **Repository documentation** — README, CONTRIBUTING, SECURITY, CHANGELOG, issue templates

### Changed

- Header navigation — added "Brand" link
- Footer — added Brand section links, bumped version to v4.0.1
- Wordmark sizing — increased from `text-sm` to `text-xl` to match icon height
- Package name — `my-project` → `design-portal`
- Package version — `0.1.0` → `4.0.1`
- CLAUDE.md — comprehensive update with testing, CI/CD, versioning, brand documentation sections

### Design Standards

- Touch targets: 48px minimum (up from 44px)
- Accessibility: APCA 3.0 AAA (replacing WCAG AAA 7:1)
- Mineral strip replaces the legacy flag strip
- Noto Sans (not Plus Jakarta Sans) as the canonical body font

## [6.0.0] - Prior

Legacy version served from assets.nyuchi.com. Brand documentation only, no component registry.
