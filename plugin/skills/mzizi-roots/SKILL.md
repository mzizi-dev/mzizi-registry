---
name: mzizi-roots
description: Use this skill for anything involving Mzizi's components — using them, starting an app on them, or contributing one. Mzizi Roots is Mzizi's own components in Rust (Dioxus UI and host-agnostic server components) from mzizi-dev/mzizi-registry. Covers `cargo add mzizi-roots` / `mzizi-roots-server`, what `mzizi_get_component` returns (Rust first), the node-to-crate map, `pub const CONTRACT` checked against `dioxus-ssr` markup, the two frontend paths (Astro with Roots, or pure Rust) and app setup, reuse before build, adding a component to the registry (the node, the `.rs` and `.tsx`, `registry.json`, the per-node checklists, the 48px floor, `pnpm check` and the cargo gates), and the React/TSX build as the deprioritised secondary. Files are the data layer: there is no database.
user-invocable: true
---

# Mzizi Roots — the Rust build of Mzizi's components

**Mzizi Roots** is Mzizi's own components in Rust: UI components in Dioxus 0.7, and server
components as host-agnostic Rust. They live in
[`mzizi-dev/mzizi-registry`](https://github.com/mzizi-dev/mzizi-registry) and are compiled by
the crates in its `mzizi-rs/` workspace. The plan is `docs/roots/RFC-roots.md` there.

**Rust first.** Where a Rust implementation exists, present it and use it first. The React/TSX
components are **the React build**: they keep working for existing React apps, and they are
deprioritised, so no new work goes into them.

This skill describes registry `main` at `6663cb5` (2026-09-29), the crates published to
crates.io at **0.1.0** on 2026-09-29, and `mzizi-mcp` 0.11.0. It replaces three 0.7.0 skills:
`scaffold-component` (now "Contributing a component"), `simplify` (now "Reuse before build")
and the frontend half of `ecosystem-app-setup` (now "Starting an app"). Tokens, brand and the
Ubuntu constraints are in the `mzizi-design` skill.

## Install

Two umbrella crates with no code of their own re-export the node crates behind features:

```sh
cargo add mzizi-roots           # UI: tokens + ui + brand + shell (all default features)
cargo add mzizi-roots-server    # server: assurance + fundi + docs + discovery
```

Take only what you use:

```toml
[dependencies]
mzizi-roots = { version = "0.1", default-features = false, features = ["brand"] }
```

To follow `main`, or pin a commit, install from git. Cargo finds a crate by name anywhere in the
repository's workspace:

```sh
cargo add mzizi-roots --git https://github.com/mzizi-dev/mzizi-registry
```

```toml
mzizi-brand = { git = "https://github.com/mzizi-dev/mzizi-registry", rev = "<commit>" }
```

A single node crate works too (`cargo add mzizi-ui`). The crates depend on `dioxus` with
`macro`, `signals`, `hooks` and `html` only, so the app that mounts them chooses web, desktop,
mobile or server rendering.

`mzizi add <name> --target rust` (`@nyuchi/mzizi-cli`) records the crate and prints the
`cargo add` rather than copying a `.rs` file into your project: a copied component is a fork
of a crate module.

## What the MCP returns

`mzizi_get_component` on `https://mcp.mzizi.dev/mcp` (free, no account; `mzizi-mcp` 0.11.0) is
Rust first. It returns `{name, renamedFrom?, lead, note, rust, react, docs?, versions?}`:

- `lead` is `"rust"` when the component has a Roots implementation, else `"react"`; `note`
  says which build to use.
- `rust` is the registry's `/v1/rs/<name>` answer with the install first: `crate`
  (`{name, registry, git}`), `install.cargo` (`cargo add <crate>`), `install.pinned`
  (`cargo add <crate> --git https://github.com/mzizi-dev/mzizi-registry --rev <pin>`, which
  builds exactly the source shown), `module` (e.g. `mzizi_brand`), `contract` (the
  `contract … end` text, or `null`), and `files[]` with the `.rs` source inline. With no Rust
  it is `null`.
- `react` is the React build: `build: "react"`, `status: "deprioritised"`, `install` (the
  `npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>` line), then the `/v1/ui/<name>`
  body. It is no longer under a `component` key (that was 0.10.x).

`mzizi_list_components` rows carry `rustCrate` when a component has Rust, the response carries
`withRust`, and `rust: true` lists only those. `mzizi_search` hits carry `rustCrate` too. For
`mzizi-hero-stat` the answer is `lead: "rust"`, crate `mzizi-brand`, and the four-clause
contract shown under "Contracts" below.

## The crates

One crate per registry node that has Rust. The map is `mzizi-rs/crate-for-node.json`, and
`pnpm rust:generate` refuses a node with Rust in it that no crate claims.

| Node directory      | Crate             | Umbrella                           | What it holds                                                                                                                                                                                  |
| ------------------- | ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `n1-tokens`         | `mzizi-tokens`    | `mzizi-roots` (always on)          | the 21-family palette and scales as Rust consts, generated from `lib/tokens/palette.source.ts`                                                                                                 |
| `n2-primitives`     | `mzizi-ui`        | `mzizi-roots` (`ui`)               | avatar, badge, button, card, chart, input, label, progress, separator                                                                                                                          |
| `n3-brand`          | `mzizi-brand`     | `mzizi-roots` (`brand`)            | alert banner, avatar stack, cover header, empty state, escalation card, gauge card, hero stat, meta tile, stats row, success screen, suitability card, user card (all `mzizi-*`)               |
| `n7-shell`          | `mzizi-shell`     | `mzizi-roots` (`shell`)            | bottom nav, command palette, connectivity bar, deep-link handler, footer, mini-app runtime, notification center, persistent player, route guard, theme provider, toast provider, update prompt |
| `n8-assurance`      | `mzizi-assurance` | `mzizi-roots-server` (`assurance`) | probes, telemetry, the OTLP exporter, a11y and RTL conformity checks, alert and incident engines                                                                                               |
| `n9-fundi`          | `mzizi-fundi`     | `mzizi-roots-server` (`fundi`)     | the Fundi reporter and learning loop (client side)                                                                                                                                             |
| `n10-documentation` | `mzizi-docs`      | `mzizi-roots-server` (`docs`)      | the docs API and routing, AI context, the changelog and docs renderers (brings in `dioxus`)                                                                                                    |
| `n11-discovery`     | `mzizi-discovery` | `mzizi-roots-server` (`discovery`) | page metadata and Schema.org JSON-LD                                                                                                                                                           |

N4 safety, N5 resilience and N6 pages have no crate yet. When they do (`mzizi-safety`,
`mzizi-resilience`, `mzizi-pages`), they join `mzizi-roots` as features. A Workers adapter
(`mzizi-worker`) is planned for `mzizi-roots-server` and has not landed.

The registry has 577 items and 55 `.rs` files. Cite `GET https://api.mzizi.dev/v1/ui` or
`/v1/stats` for a current count rather than repeating these. To find a component's crate, read
`rust.crate` from `mzizi_get_component`, or take its node directory and read the table above.
`https://api.mzizi.dev/v1/rs/<name>` also serves a `crate` field, derived from the same map on
registry `main`; the API serves the registry at a pinned commit, and until the gateway's pin
moves past the map it names `mzizi-ui` for every component. Trust the map, or the MCP.

## Using a UI component

This compiles against `mzizi-roots` 0.1.0 from crates.io and renders the component to a static
HTML fragment with `dioxus-ssr`:

```toml
[dependencies]
mzizi-roots = { version = "0.1", default-features = false, features = ["brand"] }
dioxus = { version = "0.7", default-features = false, features = ["macro", "signals", "hooks", "html"] }
dioxus-ssr = "0.7"
```

```rust
use dioxus::prelude::*;
use mzizi_roots::brand::{AlertSeverity, MziziAlertBanner};

fn banner() -> Element {
    rsx! {
        MziziAlertBanner {
            r#type: "Thunderstorm",
            severity: AlertSeverity::Severe,
            headline: "Severe storms this afternoon",
        }
    }
}

fn main() {
    let mut dom = VirtualDom::new(banner);
    dom.rebuild_in_place();
    let html = dioxus_ssr::render(&dom); // a static HTML fragment for Astro to place
    println!("{html}");
}
```

The output is a `<div data-slot="mzizi-alert-banner" data-portal="https://mzizi.dev/components/mzizi-alert-banner" role="alert" …>`
with the same Tailwind classes and CSS custom properties as the React build, so one stylesheet
styles both.

What a Roots UI component looks like:

- **Same contract as the React build:** the same registry name, `data-slot`, `data-portal`,
  variant names and Tailwind classes over the same `var(--…)` tokens. No colour literals.
- **Variants are enums**, and a `match` replaces `class-variance-authority`
  (`n2-primitives/badge.rs`, `button.rs`).
- **Browser facilities are props.** Where the `.tsx` reads `useMziziHarness`, the Rust takes the
  one bit it branches on, usually `prefers_reduced_motion: bool`. Logging is the host's.
- **Icons are slots:** an `Element` the host renders, where the `.tsx` takes a Lucide component.
- **Each file is self-contained.** No helpers shared between components.

## The two frontend paths

The frontend is either **Astro with Roots underneath** or **pure Rust end to end**.

- **Pure Rust.** A Dioxus app depends on the crates and mounts the components on web (wasm),
  desktop or mobile. Every component supports this today.
- **Astro, static.** Render with `dioxus-ssr` at build time or in a Worker, and let Astro place
  the fragment, as in the example above. It ships no JavaScript and suits display components.
  The brand crate's contract suite does this for every component on every run.
- **Astro, interactive islands.** Compile to wasm with Dioxus's web renderer and wrap it as a
  custom element. **Not packaged yet**: the wrapper crate (`mzizi-islands`) is proposed for
  batch 2 of the RFC.

Astro has no `.astro` components to install. `mzizi add` refuses an Astro target and names the
gap. There is no React, Svelte or Vue layer under Astro.

## Starting an app

For a new Mzizi-ecosystem app, or any app that consumes the design system. Pick the path
first (above); these steps are the Astro one, with the pure-Rust differences noted.

### 1. Create the project (Astro)

```bash
pnpm create astro@latest my-app -- --template minimal --typescript strict
cd my-app
pnpm astro add tailwind cloudflare
```

Astro renders HTML by default, which is what makes a new app indexable by N11 and paintable on
a low-end device without opting in to either. For a pure-Rust app, start from
`cargo new my-app` and a Dioxus 0.7 app instead, and skip to step 3.

### 2. Wire the tokens

Copy the generated stylesheet rather than retyping hexes: `skills/mzizi-design/tokens/palette.css`
in `@nyuchi/mzizi-skills` (all 21 families, light and dark, generated from
`palette.canonical.json` at the package root). Import it from your global stylesheet (in Astro,
`src/styles/global.css`) and register the properties in the Tailwind 4 `@theme` block so
utilities generate. In Rust the same palette is the `mzizi-tokens` crate, always on in
`mzizi-roots`. How the 21 families are meant to be used, the radius scale and the 48px floor
are in the `mzizi-design` skill.

Pick the app's accent through `--brand-accent` rather than hardcoding a mineral hex: nyuchi =
gold, mukoko = tanzanite.

### 3. Add the Roots components

```bash
cargo add mzizi-roots        # tokens, primitives, brand components, app shell
```

For Astro, a small Rust crate (a build step, or a `workers-rs` Worker for request-time
rendering) renders each component to HTML with `dioxus-ssr`, and Astro places the fragment.
The fragment carries the same Tailwind classes as the React build, so the stylesheet from step 2
styles it, and it ships no JavaScript. Interactive islands (Roots compiled to wasm and wrapped
as custom elements) are proposed and not packaged yet. "Using a UI component" above has a
compiling example.

Never copy component source between apps. Depend on the crate, so every app inherits fixes.

### 4. Give the app's AI assistants the doctrine

Install the published skills bundle so any assistant working in the repo has the design system,
the language and the components on hand:

```bash
npm install -D @nyuchi/mzizi-skills
npx skills experimental_sync          # links the bundled skills into .agents/skills/
```

`npx skills add @nyuchi/mzizi-skills` does **not** work: the `skills` CLI reads that argument
as a GitHub repository and fails to clone it. `experimental_sync` is the CLI's route for skills
that ship in `node_modules`, and it is marked experimental. The same skills are served with no
install at all by the MCP's `mzizi_get_skills`.

The public Claude Code plugin installs these skills and the MCP in one step:

```
/plugin marketplace add mzizi-dev/mzizi-registry
/plugin install mzizi@mzizi
```

To wire the MCP directly instead, add it to `.mcp.json` or your client config. It is free with
no account; only the Fundi tools need sign-in:

```json
{
  "mcpServers": {
    "mzizi": { "type": "http", "url": "https://mcp.mzizi.dev/mcp" }
  }
}
```

### 5. Let fundi read the project

`@nyuchi/mzizi-cli` ships the **fundi** agent, which reads the project off disk and plans the
wiring against the registry:

```bash
pnpm add -D @nyuchi/mzizi-cli
pnpm exec fundi explore                 # offline — snapshot the project
pnpm exec fundi plan "wire up Mzizi tokens"
```

Run the bins from the installed package (`pnpm exec`, or `npx` inside the project). A bare
`npx fundi` outside it fetches an unrelated npm package called `fundi`. `explore` runs without
credentials; `plan` and `chat` need `ANTHROPIC_API_KEY`. A plan is
inert until you apply it, so read it before letting it write.

### 6. Verify

```bash
pnpm dev
```

Confirm the tokens resolve in light and dark, a rendered Roots fragment picks up the styles,
and the page is readable with JavaScript off.

### 7. An existing React app

If the app is already React, the React build installs with the CLI or shadcn, by absolute URL:

```bash
pnpm add -D @nyuchi/mzizi-cli && pnpm exec mzizi add button    # infers the tsx target
npx shadcn@latest add https://api.mzizi.dev/v1/ui/mzizi-theme-provider
```

Point `components.json` `registries.mzizi.url` at `https://api.mzizi.dev/v1/ui`. A bare name
resolves against shadcn's own registry and installs a different component. Do not start a new
app this way.

## Server components

A Roots server component is a **sans-IO core**: typed request in, typed response out, every
external facility (a store, a clock, an outbound fetch, a secret) behind a trait. The host owns
I/O and credentials. `n10-documentation/mzizi-docs-api.rs` is the model: it parses a path into a
typed `Route`, asks a `DocsStore` trait for data and returns an `ApiResponse`. `mzizi-assurance`,
`mzizi-fundi` and `mzizi-discovery` have no dependencies at all. The RFC records a passing
`wasm32-unknown-unknown` `cargo check` for those three and `mzizi-docs`; CI does not run a
wasm32 job yet.

A host adapter mounts the core: a `workers-rs` adapter for Cloudflare Workers, an axum adapter
for containers. Neither adapter crate exists yet. Until then the host writes the few lines that
turn its request into the core's request (see the `mzizi-backend` skill). Dioxus
`#[server]` functions are one more possible adapter, not the building block.

## Contracts

Every Roots component carries a contract, in two parts:

1. **The registry contract:** one registry name, description, dependencies and variants shared
   by both builds, and the same `data-slot`, `data-portal` and tokens. Each crate's
   `tests/contract.rs` reads the `.tsx` sibling and asserts that the slot, the portal and every
   variant value the Rust emits appear there too. A deliberate divergence, such as a touch
   target raised to the 48px floor, is asserted from both sides, so the test fails when the
   React build is fixed.
2. **Checkable clauses** in the Mzizi language's `contract … end` grammar (RFC-0006; the
   `mzizi-language` skill), exported as `pub const CONTRACT: &str`. From
   `n3-brand/mzizi-hero-stat.rs`:

   ```rust
   pub const CONTRACT: &str = r#"contract
     slot is "mzizi-hero-stat"
     role is "region"
     label not_empty
     button "Share" min_height 48
   end"#;
   ```

   `mzizi-brand`'s contract suite renders each component with `dioxus-ssr` in named states and
   evaluates every clause against the markup it emits. **A clause it cannot evaluate fails.**
   `mzizi_roots::brand::CONTRACTS` lists every brand component with its contract.

Today the twelve `mzizi-brand` components export `CONTRACT`. The other crates check the
registry contract against the `.tsx`, and their `CONTRACT` clauses arrive batch by batch.
Server-component clauses (status per route, CORS and cache headers, no credential in the core)
wait on the language's contracts-everywhere RFC. Until then their tests assert those properties
against an in-memory implementation of the traits. When the language lowers to Rust, `mz
contract` reads the same text; it does not yet.

## Reuse before build

**The simplest change is the one you don't write.** Reuse before you build, compose before you
implement, and let one source own each decision. Use this before adding a component, a style or
a page, and during any refactor.

1. **Reuse before build.** Search the registry first: `mzizi_search` or
   `mzizi_list_components` over the MCP (`https://mcp.mzizi.dev/mcp`, free), or
   `GET https://api.mzizi.dev/v1/ui`. Where a Rust implementation exists, depend on its crate
   (`cargo add mzizi-roots`). For the React build, install with
   `mzizi add <name>` or `npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>`. Never
   reimplement a primitive that already exists.
2. **Styles are tokens.** Never hardcode a colour, radius, spacing, or motion value —
   consume `var(--…)` (or the `mzizi-tokens` consts in Rust). N1 is the only layer allowed to
   define values, so a rebrand is one edit. A new colour goes in the registry's
   `lib/tokens/palette.source.ts`, and `pnpm tokens:sync` regenerates `globals.css`, the Rust
   tokens and the other emitters from it.
3. **Compose, don't implement.** A page (N6) is a composition of N2 primitives and N3 brand
   components — never inline a `<button>`, a card, or an SVG. Pull spinners, skeletons, and
   badges from N2.
4. **Variants over copies.** Collapse near-duplicate components into one variant table: an
   enum with a `match` in Rust, an `enum` table in Mzizi source, one `cva()` in the React
   build. Express differences as `variant` / `size` props, not new files.
5. **One composition path.** In the React build, compose class names through `cn()` and
   extract shared logic into `lib/` or a hook. In Rust, a pure function beside the component.
   No logic duplicated across files.
6. **Right altitude.** Keep each component self-contained, importing only from the layer
   below on its strand. A primitive that reaches up into page code can't be installed on its
   own.
7. **Delete first.** Prefer removing over adding — dead code, unused props, redundant
   wrappers, commented-out blocks. Less code is less to break, read, and keep true.
8. **Live data, not copies.** Read counts, tokens and doctrine from their source
   (`https://api.mzizi.dev/v1/stats`, `palette.canonical.json`, `mzizi_get_tokens`,
   `mzizi_get_doctrine`). A baked-in number or duplicated token guarantees drift.

### Checklist

- [ ] Searched the registry before building, and used the Rust build where one exists?
- [ ] All styles are tokens (`var(--…)`), zero hardcoded values outside N1?
- [ ] Page is pure composition of N2/N3, no inlined primitives?
- [ ] Variation expressed as one variant table, not near-duplicate files?
- [ ] One composition path, shared logic extracted once?
- [ ] Each file self-contained and installable, importing only downward?
- [ ] Deleted more than you added where you could?
- [ ] Counts, tokens, and doctrine read live, not hardcoded?

## Contributing a component

**A component is a real file.** `components/registry/n<N>-<label>/<name>.rs` (Rust, compiled by
the node's crate in `mzizi-rs/`) and, for the React build, `<name>.tsx` beside it, which the
Next.js build compiles and typechecks. An error in either fails CI.

| File                                          | What it is                                                        |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `components/registry/n<N>-<label>/<name>.rs`  | the Roots component (Dioxus UI, or a sans-IO server core)         |
| `components/registry/n<N>-<label>/<name>.tsx` | the React build of the same contract                              |
| `registry.json`                               | the manifest `/v1/ui/<name>` and `npx shadcn add` resolve against |

`registry.json` carries the install contract (description, dependencies,
`registryDependencies`, target paths) and **never the source**. The node is derived from the
directory the component lives in, so it cannot disagree with where the file is.

**There is no database.** The registry's files are its data layer (mzizi-registry PR #368), and
a test fails the build if a Supabase import or a `SUPABASE_*` read comes back. Nothing about a
component, including its source, status or history, is written to a table. If you find
instructions anywhere telling you to `INSERT` a component or read a `component_documents` row,
they are stale.

### Step 1 — Decide the node

The architecture is the **Mzizi DNA double helix**: eight nodes (N1–N8) on the engineering
backbone, four rungs (N9–N12) that bridge both backbones, and six strands. The N-numbers are
**labels, not a sequence**.

The node decides the **directory**, the directory decides the **crate** that compiles the Rust
(`mzizi-rs/crate-for-node.json`), and the directory is what the build reads. Choosing the node
and choosing where the file goes are the same decision.

| Node              | Directory            | Crate             | What belongs there                                                          |
| ----------------- | -------------------- | ----------------- | --------------------------------------------------------------------------- |
| N1 tokens         | `n1-tokens/`         | `mzizi-tokens`    | A token value or emitter (colour, spacing, motion, radius), not a component |
| N2 primitive      | `n2-primitives/`     | `mzizi-ui`        | Generic UI: button, card, input, dialog, toolbar, bento-grid                |
| N3 brand          | `n3-brand/`          | `mzizi-brand`     | A branded composition with the mineral palette                              |
| N4 safety         | `n4-safety/`         | none yet          | A conditional-rendering gate: permission, geo, rate limit                   |
| N5 resilience     | `n5-resilience/`     | none yet          | Error boundary, skeleton, offline banner, fallback chain                    |
| N6 pages          | `n6-pages/`          | none yet          | Full-screen layout composition                                              |
| N7 shell          | `n7-shell/`          | `mzizi-shell`     | App container: navigation, routing, lifecycle                               |
| N8 assurance      | `n8-assurance/`      | `mzizi-assurance` | Instrumentation, a11y audit, RTL conformity, probes                         |
| N9 fundi          | `n9-fundi/`          | `mzizi-fundi`     | Automated healing (a rung)                                                  |
| N10 documentation | `n10-documentation/` | `mzizi-docs`      | Docs, AI instructions, docs infrastructure (a rung)                         |
| N11 discovery     | `n11-discovery/`     | `mzizi-discovery` | SEO / AIO surfaces: if the machine can't see it, it doesn't exist (a rung)  |
| N12 skills        | none in the registry | none              | Agent skills (a rung), authored in `mzizi-dev/agent-tools/mzizi-skills/`    |

A node with no crate yet (N4, N5, N6) takes a `.tsx` today. Adding its first `.rs` means adding
its crate and its `crate-for-node.json` entry in the same pull request; `pnpm rust:generate`
refuses Rust that no crate claims.

If you are unsure where something belongs, ask the MCP (`https://mcp.mzizi.dev/mcp`, free, no
account): `mzizi_list_components` with `node: N` shows what already lives in a node, and
`mzizi_get_architecture` returns the node, rung and strand model with live counts. Never
hardcode counts.

### Step 2 — Write the file

Create it in the directory the node names:

```
components/registry/n3-brand/mzizi-your-component.rs     # the Roots component
components/registry/n3-brand/mzizi-your-component.tsx    # the React build, same contract
```

The Rust file carries `pub const CONTRACT: &str` and follows the rules in "Using a UI component" above: variants as enums, tokens by reference, browser facilities as props, icons as slots,
no helpers shared between components. `.ts` is for a non-rendering module.

That is the authoring step. There is no row to insert and no registration to perform before
writing code: the file _is_ the component, and `cargo test` (for the `.rs`), `pnpm typecheck`
and `pnpm build` (for the `.tsx`) are what tell you it is real.

Naming: N3 brand components take a `mzizi-` prefix. (Components formerly named `nyuchi-*` are
`mzizi-*`, and the old names redirect.) Everything else is the bare name, matching what a
consumer will type in `mzizi add` or `npx shadcn add`.

### Wiring the Rust into its crate

`pnpm rust:generate` writes the committed copy to `mzizi-rs/crates/<crate>/src/generated/`. Add
the `#[path = "generated/<name>.rs"] pub mod <name_snake>;` line and the `pub use` to the
crate's `src/lib.rs` by hand, and add the component to the crate's `tests/contract.rs`. Edit
the registry file, never the copy. The workspace lints forbid `unsafe_code` and warn on
`missing_docs`; clippy turns the warning into a failure. Cap parallel builds on a small machine
(`CARGO_BUILD_JOBS=2`).

A release is a version bump in `mzizi-rs/Cargo.toml`. On merge to `main`,
`.github/workflows/publish-crates.yml` re-runs the Rust gate and publishes each crate in
dependency order, skipping any version already on crates.io. A published crate name is
permanent. Say in the PR body that components changed, so the site, docs and skills are
updated to match.

### Step 3 — Declare it in `registry.json`

One item, carrying the install contract. `meta` is the part you author; four other fields are
**derived from it** and must not be hand-written.

```jsonc
{
  "name": "your-component-name",
  "type": "registry:ui",
  "description": "Short description of what it does.",
  "dependencies": [],
  "registryDependencies": [],
  "files": [
    {
      "path": "components/registry/n2-primitives/your-component-name.tsx",
      "target": "components/ui/your-component-name.tsx",
      "type": "registry:ui"
    }
  ],
  "meta": {
    "collection": "primitives",
    "owner": "mzizi",
    "useCases": ["Use case 1", "Use case 2"],
    "variants": ["default", "sm", "lg"],
    "sizes": ["default", "sm", "lg"],
    "features": ["cn() for className composition", "data-slot attribute"],
    "a11y": ["ARIA attributes", "Keyboard accessible"],
    "hasDemo": true
  }
}
```

`files[]` lists the `.tsx`: it is the shadcn install contract for the React build. The `.rs`
beside it is not listed; the node's crate compiles it, and `/v1/rs/<name>` serves it with the
crate's name.

**Do not write `title`, `categories`, `docs` or `author`.** `pnpm registry:metadata` derives all
four from `meta` and the repo. `docs` in particular is what the shadcn CLI prints _after_
installing, so it is generated from your `useCases` / `variants` / `sizes` / `features` / `a11y`
rather than duplicated by hand — and an item with no `meta` deliberately gets no `docs`, because
a stub reads as documentation and says nothing.

Then run the generators and let the gates check you:

```bash
pnpm registry:paths        # fill file paths from what is on disk
pnpm registry:metadata     # derive title, categories, docs, author
pnpm registry:normalize    # canonical ordering
pnpm registry:validate     # every item resolves on disk; every dependency addressable
pnpm registry:verify       # the CI drift gate
pnpm typecheck && pnpm build
```

Follow the criteria for the chosen node.

#### Every node: the Rust file

- `pub const CONTRACT: &str` with the clauses the rendered markup must meet (slot, role, touch
  floors, variant tables), evaluated by the crate's `tests/contract.rs` on `dioxus-ssr` output
- The same `data-slot`, `data-portal` and variant values as the `.tsx`, asserted by the same
  suite; a deliberate divergence is asserted from both sides
- `prefers_reduced_motion: bool` as a prop where the `.tsx` reads the harness's motion
- Icons as `Element` slots, not an icon crate
- Doc comments on every public item (`missing_docs` is a warning, and clippy runs with
  `-D warnings`); no `unsafe`

#### N2 primitive checklist

- No `useMziziHarness` import in the `.tsx`
- `data-slot` attribute on the root element
- `data-portal` attribute pointing at `https://mzizi.dev/components/<name>`
- `cn()` for className composition in the `.tsx`
- No raw Tailwind colours: use semantic tokens (`bg-primary`, `text-foreground`, …)
- Icons from `@/lib/icons` in the `.tsx`, never `lucide-react` directly
- **Touch targets never go below 48px.** Buttons and inputs are `h-14` (56px) default and
  `h-12` (48px) small, as `button.tsx`, `button.rs` and `primitives/button.mz` all state, and
  `/v1/brand` `.componentSpecs` serves (`minTouchTarget: 48`). A smaller visual box, such as a
  badge, is not a touch target; if it becomes one, give it `min-h-[48px]`.
- Pill-shaped categories (button, input, avatar, badge, toggle) use `rounded-full`

#### N3 brand checklist

- `mzizi-` prefix on the name
- `useMziziHarness("<name>")` in the `.tsx` for the motion preference (and `log` or
  `LiveRegion` where the component uses them); `prefers_reduced_motion` as a prop in the `.rs`
- The entrance animation off when motion is reduced
- An ARIA role or `aria-label`, and a region that is named in every state, the loading
  skeleton included
- `data-slot` and `data-portal` attributes, in every state
- `focus-visible` ring on interactive elements, and interactive elements at the 48px floor
- I18N via `Intl` formatters for dates, numbers and currency
- Semantic tokens for status-bearing colours

#### N6 page checklist

- Pure composition: no inline buttons, cards or SVGs
- Accept children/slots for content
- Semantic CSS vars only (`bg-card`, `text-foreground`, `bg-primary`)
- A loading-state prop
- `role="main"` and an `aria-label`

#### N8 assurance checklist

- A sans-IO Rust core (typed input, typed result, every facility behind a trait) in
  `mzizi-assurance`, with the `.ts` module as the React build
- A banner comment identifying the node and purpose
- A configurable rules array
- Optional `onViolation` / `onComplete` callbacks

### Step 4 — Docs and demos

There is nothing extra to write. Docs come from the `meta` you already authored in Step 3
(`useCases`, `variants`, `sizes`, `features`, `a11y`), and `pnpm registry:metadata` turns them
into the `docs` string the CLI prints after install. Set `meta.hasDemo` when a demo exists.

If a prop table is expected, `pnpm props:extract` derives it from the component's own types and
`pnpm props:verify` is the gate. Props are read from the code, never restated beside it.

### Step 5 — Versions and history

There is no status row and no database. A component's version history is the registry's
changelog (`content/changelog/`, generated, checked by `pnpm changelog:generate:check`) and the
rename map. `mzizi_get_component` with `include: ["versions"]` returns it. Read what a component
is through the MCP or `https://api.mzizi.dev/v1/ui/<name>` rather than assuming.

### Step 6 — Validate accessibility

If your component introduces a new colour pair, validate it before shipping. The MCP tool is
computed locally and needs no account:

```
mzizi_check_accessibility(foreground: "#FFFFFF", background: "#0047AB")
```

It returns the WCAG 2.1 contrast ratio with AA/AAA verdicts and whether the pair clears the
Mzizi floor (APCA and AAA).

### Step 7 — Before you open the PR

`pnpm check` runs every registry gate CI runs, in order, including `registry:validate`,
`registry:verify`, `tokens:verify`, `changelog:generate:check`, `rust:generate:check`, the
tests and the build. Then the Rust workspace gate:

```bash
pnpm check
cargo fmt --manifest-path mzizi-rs/Cargo.toml --all -- --check
cargo clippy --manifest-path mzizi-rs/Cargo.toml --workspace --all-targets -- -D warnings
cargo test --manifest-path mzizi-rs/Cargo.toml --workspace
cargo package --manifest-path mzizi-rs/Cargo.toml --workspace
```

If you touched `files[]` or `meta`, run `pnpm registry:paths`, `pnpm registry:metadata` and
`pnpm registry:normalize` first; their `--check` twins fail otherwise.

A green run means the item resolves to real files, every dependency is addressable, the derived
fields match `meta`, the Rust compiles, and its contract holds on rendered markup. Say in the PR
body that a component changed, so the site, the docs and the skills are updated to match.

### What to avoid

- **Never put component source in a database row, a JSON document, or any second place.** The
  file under `components/registry/` is the component; everything else is a representation of
  it, and a representation can drift from the code while still looking correct. That is not
  hypothetical here: a `source_code` column once served stale copies for 571 components.
- Never edit `mzizi-rs/crates/*/src/generated/`. It is overwritten by `pnpm rust:generate`.
- Never hand-write `title`, `categories`, `docs` or `author` in `registry.json`. They are
  derived, and a hand-written value is a second source that the next generator run silently
  overwrites.
- Never hardcode hex colour values (except documented third-party brands like Ethereum,
  Google, EcoCash).
- Never use `lucide-react` directly in a `.tsx`; go through `@/lib/icons`.
- Never use `margin-left` / `padding-right` / `left`; use logical properties
  (`margin-inline-start`, …) for RTL support.
- Never start new work in the React build alone. If a component has a Rust implementation,
  change the Rust and keep the `.tsx` in step.
- Never bump a major version on your own initiative. That is a maintainers' call.

## The React build

`npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>` installs the `.tsx` for an existing
React app, for all 577 items. Always pass the absolute URL: a bare name resolves against
shadcn's own registry and installs a different component. `mzizi add <name>` installs the React
build too. Neither is where new work goes.

## See also

- `docs/roots/RFC-roots.md` in the registry: the inventory, the conversion batches and what
  the API and site still need for Rust-first serving (`/v1/roots` is proposed, not live).
- The `mzizi-language` skill for the clause grammar and `mz contract`.
- The `mzizi-design` skill for the palette, radius, type and the Ubuntu constraints.
- The `mzizi-backend` skill for mounting a server core on Workers.
