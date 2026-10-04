# RFC: Mzizi Roots

**Status:** proposed, 2026-09-29.
**Scope:** Mzizi's own branded components (`mzizi`- and `nyuchi`-owned registry items),
converted to Rust as UI components and server components for the agentic web.
**Snapshot:** registry `main` at `f19bb0b`. Every count below is computed from
`registry.json` and `components/registry/` at that commit.
**Companion:** the first batch of twelve components ships in
[mzizi-registry#372](https://github.com/mzizi-dev/mzizi-registry/pull/372) (§6).

## Summary

Mzizi Roots is the Rust build of Mzizi's own components. UI components are Dioxus
components. Server components are host-agnostic Rust that a Cloudflare Worker (through
`workers-rs`) or a container (through an axum-class server) mounts, and they are the
building blocks Mzizi's backend services are meant to be built from. Every Roots component
carries a contract: the registry contract it already has (name, slot, variants, tokens), plus
checkable clauses in the Mzizi language's `contract … end` grammar that its tests evaluate.

The React components keep working as **the React build**. They are deprioritised: no new work
goes into them, and wherever a Rust implementation exists the registry, the API, the MCP
server and the site present it first.

Nothing in this RFC changes or removes a public URL or an install command. `npx shadcn add
https://api.mzizi.dev/v1/ui/{name}` keeps working for all 577 items.

## 1. Inventory

### 1.1 Where the registry stands

`registry.json` has 577 items. 43 have a Rust implementation: a `<name>.rs` file beside the
`.tsx`, compiled by one of the crates in `mzizi-rs/`.

| Owner                               | Items   | With Rust |
| ----------------------------------- | ------- | --------- |
| `mzizi`                             | 290     | 14        |
| `nyuchi`                            | 144     | 20        |
| `framework` (mostly shadcn-derived) | 143     | 9         |
| **All**                             | **577** | **43**    |

The 434 `mzizi`- and `nyuchi`-owned items are the branded set Roots converts. The owner
field records where an item came from; since the `nyuchi-*` → `mzizi-*` rename, both owners
are Mzizi's own components.

### 1.2 How status and kind are assigned

#### Rust status

- **has**: a `<name>.rs` sibling exists and a crate compiles it. That is what makes
  `/v1/rs/{name}` answer 200.
- **partial**: the item has no sibling of its own, but a Rust implementation of part of its
  contract exists elsewhere. There are two: `avatar-group` (`AvatarGroup` in `avatar.rs`) and
  `accessibility-audit` (its procedure is implemented by `mzizi-a11y-audit.rs`).
- **none**: React only.

#### Kind

- **UI component**: renders markup (`registry:ui` outside N6).
- **server component**: runs on a server or at the edge and has no DOM: the N8 probes and
  exporters, the N10 docs API and AI context, the N9 reporter and learning loop, N11 SEO,
  the N2 resilience libraries (circuit breaker, rate limiter, retry, timeout, bulkhead,
  fallback chain), N4 AI safety, and the SQL accessibility audit.
- **lib/hook**: every other `registry:lib`, `registry:hook`, `registry:base` and
  `registry:theme` item. Most of these are N1 token families.
- **page/block**: `registry:block` items and everything in N6.

### 1.3 By node and collection

| Node                | Owner    | Collection           |   Items |    Has | Partial |    None |      UI | Server | Lib/hook | Page/block |
| ------------------- | -------- | -------------------- | ------: | -----: | ------: | ------: | ------: | -----: | -------: | ---------: |
| — (data item)       | `mzizi`  | styling-libs         |       2 |      0 |       0 |       2 |       0 |      0 |        2 |          0 |
| `n1-tokens`         | `mzizi`  | styling-libs         |      18 |      1 |       0 |      17 |       0 |      0 |       18 |          0 |
| `n2-primitives`     | `mzizi`  | primitives           |     228 |      0 |       1 |     227 |     214 |      6 |        4 |          4 |
| `n3-brand`          | `nyuchi` | brand                |      64 |      0 |       0 |      64 |      61 |      0 |        1 |          2 |
| `n3-brand`          | `nyuchi` | agentic-components   |       4 |      0 |       0 |       4 |       4 |      0 |        0 |          0 |
| `n4-safety`         | `mzizi`  | safety               |      14 |      0 |       0 |      14 |      13 |      1 |        0 |          0 |
| `n5-resilience`     | `mzizi`  | resilience           |      14 |      0 |       0 |      14 |      13 |      0 |        0 |          1 |
| `n6-pages`          | `nyuchi` | pages                |      52 |      0 |       0 |      52 |       0 |      0 |        0 |         52 |
| `n7-shell`          | `nyuchi` | shell                |      16 |     12 |       0 |       4 |      16 |      0 |        0 |          0 |
| `n8-assurance`      | `mzizi`  | documentation        |       1 |      0 |       1 |       0 |       0 |      1 |        0 |          0 |
| `n8-assurance`      | `mzizi`  | observability        |      13 |     13 |       0 |       0 |       2 |      6 |        5 |          0 |
| `n9-fundi`          | `nyuchi` | fundi                |       3 |      3 |       0 |       0 |       0 |      2 |        1 |          0 |
| `n10-documentation` | `nyuchi` | documentation-engine |       4 |      4 |       0 |       0 |       2 |      2 |        0 |          0 |
| `n11-discovery`     | `nyuchi` | pages                |       1 |      1 |       0 |       0 |       0 |      1 |        0 |          0 |
| **All**             |          |                      | **434** | **34** |   **2** | **398** | **325** | **19** |   **31** |     **59** |

Three things stand out.

- **N8 to N11 are done.** 21 of their 22 items have Rust, across `mzizi-assurance`,
  `mzizi-fundi`, `mzizi-docs` and `mzizi-discovery`. The 22nd, `accessibility-audit`, is a
  SQL procedure document whose logic `mzizi-a11y-audit.rs` implements.
- **N7 is 12 of 16.** The other four are blocked on N2 primitives or are not portable
  (`mzizi-root-layout` wraps Next.js's `<html>`).
- **The brand layer has nothing.** N3, the layer that makes a Mzizi app look like Mzizi, has
  no Rust at all. N2's 228 Mzizi-owned primitives have none either. That is where Roots
  starts.

Appendix A lists every one of the 434 items with its status, kind and planned batch.

### 1.4 Why the `framework` items are low priority

The 143 `framework` items are mostly shadcn-derived primitives: dialog, popover, tabs, select,
sheet, sidebar, charts and the rest. Nine already have Rust (`button`, `badge`, `card`,
`avatar`, `input`, `label`, `progress`, `separator`, `chart`), in `mzizi-ui`. They come after
the branded set for four reasons.

1. **They are not Mzizi's.** Unbranded primitives are commodity work, and the Dioxus ecosystem
   builds its own. Converting them first would spend the effort where Mzizi adds least.
2. **The benchmark corpus is Mzizi's own components.** The language charter
   ([CHARTER.md](https://github.com/mzizi-dev/mzizi/blob/main/CHARTER.md) §6) fixes the
   Phase 0 task set as "Mzizi's own components", not "an external library (shadcn, a generic
   primitive set, etc.)".
3. **Many are React-shaped.** A large share wrap Radix, Base UI, `cmdk`, `vaul`, `embla` or
   Recharts. The port is a rewrite against a different interaction model, not a translation.
4. **The branded set needs only a few of them.** They are converted when a branded
   component is blocked on one, not as a batch. The ones already in the way are `popover`,
   `scroll-area`, `dialog`, `tabs`, `calendar`, `textarea`, `dropdown-menu`, `table`,
   `switch` and `sidebar` (§5).

## 2. What a Roots component is

### 2.1 UI components are Dioxus

A Roots UI component is a Dioxus 0.7 `#[component]` in a `.rs` file beside its `.tsx`
sibling, in the same node directory, under the same registry name. That is the shape the 34
existing ports already prove, and this RFC keeps it:

- **Same contract as the React build.** The same `data-slot` and `data-portal` attributes,
  the same variant names (the registry item's `meta.variants`), and the same Tailwind classes
  over the same CSS custom properties. One stylesheet styles both builds.
- **Tokens by reference.** No colour literals. Components use `var(--color-*)`,
  `var(--brand-accent)` and the Tailwind utilities, and `mzizi-tokens` is the Rust emitter of
  the one palette source (`lib/tokens/palette.source.ts`).
- **Variants are enums.** A `match` is the whole of `class-variance-authority`, checked
  exhaustively at compile time (`badge.rs`, `button.rs`).
- **Browser facilities are props.** The React build reads motion, logging and a live region
  from `useMziziHarness`. A Roots component takes the one bit it branches on, usually
  `prefers_reduced_motion: bool`, as a prop (`mzizi-update-prompt.rs`). Logging is the
  host's. The same component therefore renders on the server, in a browser or on a device.
- **Icons are slots.** Where the React build takes a Lucide component type, a Roots component
  takes an `Element` the host renders.
- **Each file is self-contained.** No shared helpers between components, so each one is
  readable and portable on its own (`mzizi-ui/src/lib.rs`).
- **No renderer dependency.** The crates depend on `dioxus` with `macro`, `signals`, `hooks`
  and `html` only. The app that mounts them picks web, desktop, mobile or server rendering.

### 2.2 Server components are sans-IO Rust behind host adapters

Mzizi's backend infrastructure is meant to be built with Mzizi, and Roots server components
are its building blocks. The model for a server component is the handler of a backend
service: api.mzizi.dev's routes, a probe, an exporter, an issue desk.

**What exists here already.** The 21 server-side ports in N8 to N11 share one shape.
`mzizi-docs-api.rs` parses a path into a typed `Route`, asks a `DocsStore` trait for data,
and shapes the answer into an `ApiResponse` with its status and headers. It holds no client
and reads no environment. `mzizi-otel.rs` builds an OTLP request and lets the host send it.
`mzizi-assurance`, `mzizi-fundi` and `mzizi-discovery` have no dependencies at all. In the
words of `mzizi-docs-api.rs`, "`Deno.serve` has no Rust equivalent worth pretending to": the
component owns routing and shaping, and the host owns I/O and credentials.

**What the charter asks for.** The language
[charter](https://github.com/mzizi-dev/mzizi/blob/main/CHARTER.md) §2 makes Cloudflare
Workers and Containers first-class: "Workers via `workers-rs` (wasm32) … Containers via a
native Rust HTTP server packaged as a container image". Handler code "reaches
target-specific facilities only through declared capabilities" (§4, Phase 1).

**So a Roots server component is:**

1. **A sans-IO core** in a node crate: typed request in, typed response out, every external
   facility (a store, a clock, an outbound fetch, a secret) behind a trait. This is the
   charter's "declared capability", written in Rust today. It builds for native and for
   `wasm32-unknown-unknown` with no feature changes. A wasm32 `cargo check` passes today for
   `mzizi-assurance`, `mzizi-fundi`, `mzizi-docs` and `mzizi-discovery`.
2. **A host adapter** that mounts the core. The first is a Workers adapter over `workers-rs`
   (the `worker` crate): it turns a `worker::Request` into the core's request, implements the
   traits over Workers bindings (KV, R2, D1, `fetch`, secrets), and turns the response back.
   An axum adapter does the same for Containers. Adapters live in their own crate so the
   cores stay dependency-free.

**Why not Dioxus server functions as the building block.** Dioxus server functions
(`#[server]`) belong to Dioxus's fullstack runtime, which serves them from its own axum-based
server. They are a good fit for a pure-Rust app that already runs Dioxus fullstack, and a
server function can call a Roots core directly. They are not the building block, for two
reasons: the charter's edge target is `workers-rs`, which that runtime is not built around;
and a backend service like api.mzizi.dev has no UI tree for a server function to belong to.
Server functions become one more adapter where a Dioxus fullstack app wants them.

**The first proof** is an api-gateway-style handler on Workers: the existing
`mzizi-docs-api` core mounted in a `workers-rs` Worker, answering the same requests with the
same bodies (batch 4, §5).

### 2.3 The contract

**Every Roots component carries a contract.** It has two parts.

1. **The registry contract**, as today: one registry name, one description, one set of
   dependencies and variants shared by both builds, the same `data-slot` and `data-portal`,
   the same tokens. The crates' `tests/contract.rs` suites read the `.tsx` sibling and assert
   that the slot, the portal and every variant value the Rust emits also appear there. Each
   deliberate divergence (a touch floor raised to 48px, a quoted URL, an unclamped ARIA value
   fixed) is asserted from both sides, so the test fails when the React build is fixed and
   the note can be removed.
2. **Checkable clauses** in the Mzizi language's `contract … end` grammar
   ([RFC-0006](https://github.com/mzizi-dev/mzizi/blob/main/design/RFC-0006-contracts.md)).
   Each Rust module exports them as `pub const CONTRACT: &str`:

   ```text
   contract
     slot is "mzizi-alert-banner"
     portal is "https://mzizi.dev/components/mzizi-alert-banner"
     role is "alert"
     every alert_severity label not_empty
     watch.mineral uses "--severity-cold"
     button "Dismiss" min_height 48
     button "View Details" min_height 48
   end
   ```

   The crate's contract suite renders the component with `dioxus-ssr` in named states and
   evaluates every clause against the markup it actually emits. It uses the RFC-0006 subject
   forms (`<name>`, `every <enum> <column>`, `<enum>.<variant> <column>`,
   `<variant>.<column>`, `<element> "<text>"`, `when <state>`) and predicates (`is`,
   `contains`, `not_empty`, `at_least`, `in`, `uses "--token"`, `min_height`, `shows`). A
   clause it cannot evaluate **fails**, which is RFC-0006's FM-12: an unevaluable contract
   that passes reads as proof. When the language lowers to Rust (RFC-0007 G2.1), `mz contract`
   reads the same text.

Server components carry contracts too: status codes per route, headers such as CORS and
cache, and "no credential in the component". Their clause vocabulary is not settled here. A
separate language RFC on contracts everywhere (components, language functions and backend
handlers) is being written, and it will set it. Until then a server component's tests assert
those properties against an in-memory implementation of its traits, which is how
`mzizi-docs-api.rs` is tested today.

### 2.4 Verification

A Roots component is done when all of these pass in CI:

| Gate           | Command                                                 | What it proves                                                       |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| Copies in sync | `pnpm rust:generate:check`                              | the crate compiles the registry's file, not a stale copy             |
| Format         | `cargo fmt --all -- --check`                            | rustfmt-clean                                                        |
| Compile        | `cargo check --workspace --all-targets`                 | it builds                                                            |
| Lint           | `cargo clippy --workspace --all-targets -- -D warnings` | no warnings under the workspace lints                                |
| Unit tests     | `cargo test --workspace`                                | its pure functions behave                                            |
| Contract       | `cargo test` (`tests/contract.rs`)                      | its own contract holds on rendered markup, and it matches its `.tsx` |
| Publishable    | `cargo package --workspace`                             | the tarball builds from its own files                                |
| Served         | vitest, `__tests__/api/v1/`                             | `/v1/rs/{name}` answers 200 with the source and the right crate      |

Server components add a `wasm32-unknown-unknown` build check once the Workers adapter lands,
so a core that stops building for Workers fails CI rather than a deploy.

### 2.5 The two frontend paths

The frontend is either **Astro with Roots underneath**, or **pure Rust end to end**.

**Pure Rust.** A Dioxus app depends on the Roots crates and mounts the components directly,
on web (wasm), desktop or mobile, with its server as a `workers-rs` Worker or a Dioxus
fullstack server. This is what the crates are built for, and every batch supports it.

**Astro with Roots underneath.** Astro renders the page chrome as static HTML, and Roots
components render inside it in one of two ways:

1. **Static HTML at build or request time.** Rust renders the component to an HTML string
   with `dioxus-ssr`, in a build step or in a `workers-rs` Worker, and Astro places the
   fragment. It carries the same classes as the React build, so the site's Tailwind
   stylesheet styles it, and it ships no JavaScript. This suits display components: cards,
   stats, gauges, headers, states.
2. **Interactive islands.** The component is compiled to wasm with Dioxus's web renderer and
   wrapped as a custom element (`<mzizi-alert-banner>`), loaded from a plain
   `<script type="module">`. Astro renders the tag and the island hydrates itself. This is
   the charter's Phase 1 "self-contained artifact … an ES module / custom element (and its
   WASM bundle)", and it is the pattern mzizi.dev describes for app.mzizi.dev: "Astro chrome,
   Rust/Dioxus islands".

**What the first batch supports.** All twelve components work in a pure-Rust Dioxus app. All
twelve render to static HTML through `dioxus-ssr`: the contract suite does exactly that for
every component on every run, and the crate type-checks for `wasm32-unknown-unknown`. No
Astro integration or custom-element wrapper exists yet, so neither Astro path is packaged. The
wrapper is a small crate (`mzizi-islands`, proposed) that registers each component as a
custom element, and it belongs with batch 2, when the first interactive brand components need
it.

## 3. Naming and packaging

### 3.1 Crate layout

Today there are seven crates, one per node that has Rust: `mzizi-tokens` (N1), `mzizi-ui`
(N2), `mzizi-shell` (N7), `mzizi-assurance` (N8), `mzizi-fundi` (N9), `mzizi-docs` (N10) and
`mzizi-discovery` (N11). A node directory maps to exactly one crate
(`mzizi-rs/crate-for-node.json` from batch 1), and `pnpm rust:generate` refuses a node with
Rust in it that no crate claims.

| Option                                 | Layout                                                                                                                                                               | For                                                                                                                                                              | Against                                                                                |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **A. Keep per-node crates**            | Keep the seven names. Add `mzizi-brand` for N3 now, and `mzizi-safety` (N4), `mzizi-resilience` (N5) and `mzizi-pages` (N6) when their batches land.                 | Matches the registry's structure and the crates already in the workspace. The charter names `mzizi-ui` as the UI layer. A consumer takes only the nodes it uses. | A full app takes several dependencies.                                                 |
| **B. A and umbrella crates** (decided) | A, plus `mzizi-roots`, which re-exports the UI crates behind features (`ui`, `brand`, `shell`, …), and `mzizi-roots-server` for the server crates and host adapters. | One line in `Cargo.toml` for the common case. The umbrella is where "Roots" appears as a name.                                                                   | Two more crates to publish, and a version to keep in step.                             |
| **C. Rename to `mzizi-roots-*`**       | `mzizi-roots-ui`, `mzizi-roots-brand`, …                                                                                                                             | Every crate carries the programme name.                                                                                                                          | Churns names the charter and the benchmark harness already use, for no technical gain. |

**Decided: option B** (owner, 2026-09-29). The node crates keep their names and stay the
crates that compile each component, so `/v1/rs/{name}` names a node crate. Two umbrella
crates, which have no code of their own, sit on top:

| Umbrella             | Re-exports                                                                                                                                            | Features                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `mzizi-roots`        | `tokens` (`mzizi-tokens`), `ui` (`mzizi-ui`), `brand` (`mzizi-brand`), `shell` (`mzizi-shell`)                                                        | `ui`, `brand` and `shell`, all on by default. `mzizi-tokens` is always in. |
| `mzizi-roots-server` | `assurance` (`mzizi-assurance`), `fundi` (`mzizi-fundi`), `docs` (`mzizi-docs`), `discovery` (`mzizi-discovery`), `activitypub` (`mzizi-activitypub`) | The first four on by default; `activitypub` opt-in (2026-10-04).           |

The split follows §1.2 at crate level. `mzizi-docs` goes on the server side: its docs API and
AI context are server components, and its two documentation renderers come with it, which is
why the `docs` feature brings in `dioxus`. When N4, N5 and N6 get crates (`mzizi-safety`,
`mzizi-resilience`, `mzizi-pages`), they join `mzizi-roots` as features. When the Workers
adapter (`mzizi-worker`) lands, it joins `mzizi-roots-server`.

All of these names were free on crates.io when checked on 2026-09-29. A published name is
permanent.

### 3.2 Installing

**From git, today and at any commit.** Cargo finds a crate by name anywhere in a git
repository's workspace, so no path is needed:

```sh
cargo add mzizi-roots --git https://github.com/mzizi-dev/mzizi-registry   # the UI side
cargo add mzizi-brand --git https://github.com/mzizi-dev/mzizi-registry   # or one node crate
```

```toml
[dependencies]
mzizi-brand = { git = "https://github.com/mzizi-dev/mzizi-registry", rev = "<commit>" }
```

Pin a `rev` (or a `tag` once releases are tagged) for a reproducible build. This is the fix
for mzizi-dev/mzizi's pilot 2, where `cargo add mzizi-ui` failed because the crate was not on
crates.io.

**From crates.io, after the first release.**

```sh
cargo add mzizi-roots          # or mzizi-roots-server, or a single node crate
```

The owner approved publishing to crates.io on 2026-09-29. Batch 1 adds
`.github/workflows/publish-crates.yml`: on a merge to `main` that touches the Rust, it re-runs
the whole Rust gate, then publishes each crate in dependency order, skipping any version
already on crates.io. The repository needs a `CARGO_REGISTRY_TOKEN` secret for it to publish.
A release is a version bump in `mzizi-rs/Cargo.toml`.

**What `/v1/rs/{name}` says.** Its payload names the crate: `crate: { name, registry, git }`.
Before batch 1 it answered `mzizi-ui` for every component, which was wrong for 34 of the 43.
Batch 1 derives it from the same node-to-crate map the generator uses.

## 4. Serving Rust first

### 4.1 The change

Every existing URL keeps its current response shape. Everything below is additive.

1. **`/v1/rs/{name}`** stays the per-component Rust route. Its payload gains:
   - `crate.git` (batch 1) and the correct `crate.name` (batch 1);
   - `install`: `{ "git": "cargo add <crate> --git https://github.com/mzizi-dev/mzizi-registry", "cratesIo": "cargo add <crate>" }`;
   - `contract`: the component's `CONTRACT` text, so an agent can read the checkable clauses
     without parsing Rust.
2. **`/v1/roots`**, new: the index of Mzizi Roots, one row per component with a Rust
   implementation: `name`, `crate`, `node`, `kind` (`ui`, `server`, `lib`), `contractClauses`
   (a count), and two links, `rs` (`/v1/rs/{name}`) and `react` (`/v1/ui/{name}`). It takes
   `crate`, `node` and `kind` filters. It is the list an agent or the site starts from when it
   wants the Rust build.
3. **`/v1/ui/{name}`**, unchanged for shadcn: the React build, byte for byte. It gains
   `meta.roots` when a Rust implementation exists:
   `{ "crate": "mzizi-brand", "rs": "https://api.mzizi.dev/v1/rs/<name>" }`. `meta` is a
   free-form record in shadcn's registry-item schema, so the CLI ignores it, and it tells a
   reader of the React build that a Rust build exists.
4. **`/v1/ui`** (the list) gains a `rust: boolean` per item and a `target=rust` filter.
5. **`/openapi`** documents all of the above.

The React build is served exactly as it is today. Where both exist, the API, the MCP server
and the site put Rust first and label the TSX "React build".

### 4.2 What each service needs

None of this is implemented by this RFC.

**mzizi-api-gateway** (api.mzizi.dev, Hono on Workers, bundled registry files)

- Bundle `mzizi-rs/crate-for-node.json` and derive `crate.name` from it in `/v1/rs/{name}`.
  Its handler hard-codes `mzizi-ui` today, as the registry's did.
- Add `crate.git`, `install` and `contract` to `/v1/rs/{name}`. The contract is the string
  between `pub const CONTRACT: &str = r#"` and `"#;` in the served source.
- Add `/v1/roots`, `meta.roots` on `/v1/ui/{name}`, and `rust`/`target=rust` on `/v1/ui`.
- Extend the parity script to cover the new fields and route, and update `/openapi`.
- Port each change here first, in `app/api/v1/`, so the registry's routes stay the reference
  the gateway is compared against.

**mzizi-mcp** (agent-tools, mcp.mzizi.dev)

- `get_component` gains `target: "rust" | "react"`. It defaults to `rust` when a Rust
  implementation exists: `files[]` then carries the `.rs` source, with the crate, the install
  line and the contract. `target: "react"`, or a component with no Rust, returns what it
  returns today.
- `list_components` gains `target: "rust"`, backed by the same data as `/v1/roots`.
- The server instructions say Rust first: "Mzizi Roots components are Rust; the React build is
  kept for existing React apps."
- The bundled registry data gains the crate map and the extracted contracts.

**mzizi-site** (mzizi.dev, static Astro)

- `/components` leads with Roots: a component page shows the Rust build first (crate, install
  line, contract, source link) and the React build second, labelled "React build".
- The index gains a Rust filter and a Roots count, built from `/v1/roots` at build time.
- mzizi.dev leads with the language, so Roots sits under `/components`, as the components do.

## 5. Order of conversion

| Batch | What                                                                                                                                                                                                                                                                              |   Items | Blockers                                                                                                                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | N3 brand leaf components: alert banner, avatar stack, cover header, empty state, escalation card, gauge card, hero stat, meta tile, stats row, success screen, suitability card, user card. New crate `mzizi-brand`, contract evaluation, publish workflow.                       |      12 | None. In the companion pull request.                                                                                                                                                                                                                                          |
| **2** | The rest of N3 that composes nothing unported: cards, rows, headers, badges, the agentic payment-mandate and product-results cards, `mzizi-media`. Adds `mzizi-islands` (custom elements).                                                                                        |      52 | 27 of N3's files import Lucide icons, and some icons are part of the contract (a source badge's credibility icon). Needs a decision between icon slots everywhere and a small generated icon module. `mzizi-media` needs an HTML sanitiser (`ammonia`) in place of DOMPurify. |
| **3** | N4 safety gates and N5 resilience components.                                                                                                                                                                                                                                     |      27 | The gate shape is proven by `mzizi-route-guard.rs` (a pure `evaluate` plus a component). The error boundaries need Dioxus's `ErrorBoundary`, and `mzizi-prefetch-boundary` needs `SuspenseBoundary`.                                                                          |
| **4** | Server components and libraries: the N2 resilience libraries, `observability` and `architecture`; N4 `ai-safety`; the ten N1 token families (motion, layout, locale, a11y and others); the N8 SQL audit. Adds `mzizi-worker` (`workers-rs` adapter) and the docs API as a Worker. |      21 | Async without a runtime in the cores (traits over `Future`, no tokio). A `wasm32` CI job. The token generator has to emit non-colour families to Rust.                                                                                                                        |
| **5** | N2 Mzizi-owned primitives, in sub-batches of about 20. 190 import nothing unported; 25 do.                                                                                                                                                                                        |     215 | For the 25: the framework primitives `popover`, `scroll-area`, `dialog`, `tabs`, `calendar`, `textarea`, `dropdown-menu` and `table`, and the libraries `chart.js`, `react-day-picker`, `@tanstack/react-table` and DOMPurify.                                                |
| **6** | Composition: N6 pages and blocks (52), N3 composites (`mzizi-profile-page`, `mzizi-profile-settings`, `mzizi-user-menu`), N2 blocks (4), and N7's `app-switcher`, `mzizi-header` and `mzizi-sidebar`.                                                                             |      62 | Everything above, plus the framework `sidebar`, `switch` and `dropdown-menu`.                                                                                                                                                                                                 |
| n/a   | Not converted: seven other-platform token emitters (their Rust counterpart is `mzizi-tokens-rust`), the two CSS data items (`mzizi-base`, `mzizi-tokens`), `mzizi-harness` (replaced by props, §2.1) and `mzizi-root-layout` (a Dioxus app's root is `dioxus::launch`).           |      11 | —                                                                                                                                                                                                                                                                             |
| done  | Already Rust.                                                                                                                                                                                                                                                                     |      34 | —                                                                                                                                                                                                                                                                             |
|       | **Total**                                                                                                                                                                                                                                                                         | **434** |                                                                                                                                                                                                                                                                               |

The two `partial` items are counted in batches 5 (`avatar-group`) and 4
(`accessibility-audit`).

Each batch is a pull request, or several for batch 5, with the same gates (§2.4). A batch
lands its crate changes, its `.rs` files and its contracts together, so no Rust ships
unchecked.

## 6. The first batch

The companion pull request converts the twelve N3 components listed in batch 1. They were
chosen because they are the brand layer, where there was no Rust at all, and because each
one fits a shape an existing port already proves:

- **Variant enums** as in `badge.rs` and `button.rs`: alert severities, gauge minerals,
  suitability levels, cover heights, avatar sizes, stats layouts, trend directions.
- **The harness as a prop** as in `mzizi-update-prompt.rs`: eight of the twelve animate in and
  take `prefers_reduced_motion`.
- **Pure functions under the component** as in `mzizi-bottom-nav.rs`'s `is_active`:
  `initials`, `stack_layout`, `arc_dash`, `validity_line`, `pill_text`, `cover_style`.
- **Host-controlled state** as in `mzizi-route-guard.rs`: the escalation card, the agentic
  one, takes `pending_id` from the host that is resuming the agent, so a server or a replay
  can render the pending state with no client state at all.

Each has a contract, between three and eight clauses and 65 in all, and the new
`mzizi-brand` contract suite evaluates every one of them on rendered markup. Breaking one
fails the suite: shrinking the alert banner's details button back to `h-10` fails
`button "View Details" min_height 48`.

The ports fix six defects the React build still has: a 40px button under the 48px floor, an
unclamped `aria-valuenow`, an unquoted CSS URL, an unnamed ARIA region, initials that split a
UTF-16 surrogate pair, and a `data-portal` present only on the loading skeleton. Each is
covered by a test. The first four are also asserted against the `.tsx`, so their tests fail
when the React build is fixed and the divergence note can go.

## 7. Relationship to the language

Roots does not depend on the language's result. The two Phase 0 pilots (2026-09-27) showed no
advantage for Mzizi: the frontier model tied the two arms, with Mzizi about 8% cheaper in
tokens, and the ~7B open-weight model did worse in Mzizi on all three metrics. The
kill-criterion run has not happened. Roots is Rust either way.

If the language does lower to Rust, Roots is its target. The corpus is these components,
their contracts are written in its grammar, and their contract suites are the defect oracle
RFC-0007 G2.1 names. A separate language RFC is being written on contracts everywhere and on
extending the benchmark to TypeScript/React, Python, Go, C++ and Rust backends; this RFC does
not duplicate it.

## Appendix A. Every branded item

Rust status and kind as defined in §1.2; batch as in §5 ("—" is already Rust).

### Data items (no source file)

| Item           | Owner   | Collection   | Kind     | Rust | Batch |
| -------------- | ------- | ------------ | -------- | ---- | ----- |
| `mzizi-base`   | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens` | `mzizi` | styling-libs | lib/hook | none | n/a   |

### `n1-tokens`

| Item                        | Owner   | Collection   | Kind     | Rust | Batch |
| --------------------------- | ------- | ------------ | -------- | ---- | ----- |
| `mzizi-a11y`                | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-data`                | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-dx`                  | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-harness-prewire`     | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-icons`               | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-layout`              | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-locale`              | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-motion`              | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-platform`            | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-resilience`          | `mzizi` | styling-libs | lib/hook | none | 4     |
| `mzizi-tokens-arkts`        | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens-globals`      | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens-kotlin`       | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens-python`       | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens-react-native` | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens-rust`         | `mzizi` | styling-libs | lib/hook | has  | —     |
| `mzizi-tokens-swift`        | `mzizi` | styling-libs | lib/hook | none | n/a   |
| `mzizi-tokens-typescript`   | `mzizi` | styling-libs | lib/hook | none | n/a   |

### `n2-primitives`

| Item                       | Owner   | Collection | Kind       | Rust                                   | Batch |
| -------------------------- | ------- | ---------- | ---------- | -------------------------------------- | ----- |
| `activity-feed`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `address-input`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `agenda-view`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `ai-chat`                  | `mzizi` | primitives | UI         | none                                   | 5     |
| `ai-feedback`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `ai-response-card`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `analytics-dashboard-card` | `mzizi` | primitives | UI         | none                                   | 5     |
| `ancestry-memorial`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `announcement-bar`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `api-key-display`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `api-usage-meter`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `appointment-card`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `arc-gauge`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `architecture`             | `mzizi` | primitives | lib/hook   | none                                   | 4     |
| `assignee-picker`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `audio-player`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `audio-waveform`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `audit-log-entry`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `author-bio-card`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `autocomplete`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `avatar-group`             | `mzizi` | primitives | UI         | partial (`AvatarGroup` in `avatar.rs`) | 5     |
| `batch-action-bar`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `bento-grid`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `booking-calendar`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `booking-confirmation`     | `mzizi` | primitives | UI         | none                                   | 5     |
| `bottom-sheet`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `bulkhead`                 | `mzizi` | primitives | server     | none                                   | 4     |
| `button-group`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `calendar-day-view`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `calendar-month-view`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `calendar-week-view`       | `mzizi` | primitives | UI         | none                                   | 5     |
| `camera-viewfinder`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `canvas-chart`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `caption-editor`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `cart-item`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `category-browser`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `changelog-entry`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `chaos`                    | `mzizi` | primitives | lib/hook   | none                                   | 4     |
| `chapter-list`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `chapter-reader`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `chat-bubble`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `chat-input`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `chat-layout`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `chat-list`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `checklist`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `circuit-breaker`          | `mzizi` | primitives | server     | none                                   | 4     |
| `co-author-strip`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `code-block`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `code-editor`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `code-tabs`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `color-picker`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `combobox`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `command-center`           | `mzizi` | primitives | page/block | none                                   | 6     |
| `comment-on-paragraph`     | `mzizi` | primitives | UI         | none                                   | 5     |
| `comment-thread`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `contact-card`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `content-calendar`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `contrast-mode-toggle`     | `mzizi` | primitives | UI         | none                                   | 5     |
| `cookie-consent`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `copy-button`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `currency-input`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `data-table`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `date-label`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `date-picker`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `date-range-picker`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `dependency-graph`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `deployment-status-card`   | `mzizi` | primitives | UI         | none                                   | 5     |
| `description-list`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `direction`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `drag-handle`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `driver-profile-card`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `empty`                    | `mzizi` | primitives | UI         | none                                   | 5     |
| `empty-state`              | `mzizi` | primitives | page/block | none                                   | 6     |
| `endpoint-card`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `env-editor`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `escrow-status`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `event-block`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `event-rsvp-inline`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `exchange-rate`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `fallback-chain`           | `mzizi` | primitives | server     | none                                   | 4     |
| `fare-calculator`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `feature-flag-toggle`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `field`                    | `mzizi` | primitives | UI         | none                                   | 5     |
| `file-preview`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `file-upload`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `filter-bar`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `font-settings-panel`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `gas-estimator`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `group-info-card`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `health-record-summary`    | `mzizi` | primitives | UI         | none                                   | 5     |
| `horizontal-scroll`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `infinite-scroll`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `info-row`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `inline-edit`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `input-group`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `invite-link`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `invoice-row`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `item`                     | `mzizi` | primitives | UI         | none                                   | 5     |
| `itinerary-timeline`       | `mzizi` | primitives | UI         | none                                   | 5     |
| `json-viewer`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `kanban-board`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `kbd`                      | `mzizi` | primitives | UI         | none                                   | 5     |
| `kpi-card`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `language-switcher`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `lazy-section`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `lightbox`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `location-picker`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `location-share`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `log-viewer`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `maintenance-page`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `map-card`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `map-cluster`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `map-marker`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `map-route`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `map-view`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `markdown-renderer`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `masonry-grid`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `media-filter-strip`       | `mzizi` | primitives | UI         | none                                   | 5     |
| `medication-reminder`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `mega-menu`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `member-list`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `member-row`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `mention-input`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `message-thread`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `mfa-setup`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `mobile-money-selector`    | `mzizi` | primitives | UI         | none                                   | 5     |
| `moderation-queue-item`    | `mzizi` | primitives | UI         | none                                   | 5     |
| `music-selector`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `native-select`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `nearby-list`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `node-status-card`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `note-card`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `note-editor`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `notification-bell`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `notification-center`      | `mzizi` | primitives | page/block | none                                   | 6     |
| `notification-center-full` | `mzizi` | primitives | UI         | none                                   | 5     |
| `notification-list`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `novel-cover`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `number-input`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `observability`            | `mzizi` | primitives | lib/hook   | none                                   | 4     |
| `order-summary`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `page-header`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `password-strength`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `payment-method-card`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `payment-pin-pad`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `permission-badge`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `phone-input`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `pinned-message`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `pod-storage-meter`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `poll`                     | `mzizi` | primitives | UI         | none                                   | 5     |
| `price-display`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `pricing-card`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `priority-selector`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `prompt-input`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `property-list`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `pull-to-refresh`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `quick-action-grid`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `rate-limiter`             | `mzizi` | primitives | server     | none                                   | 4     |
| `rating`                   | `mzizi` | primitives | UI         | none                                   | 5     |
| `reaction-picker`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `read-receipts`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `reading-progress`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `recording-controls`       | `mzizi` | primitives | UI         | none                                   | 5     |
| `recurrence-picker`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `reminder-card`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `retry`                    | `mzizi` | primitives | server     | none                                   | 4     |
| `revenue-dashboard-widget` | `mzizi` | primitives | UI         | none                                   | 5     |
| `review-card`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `rich-text-editor`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `role-selector`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `route-card`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `schema-viewer`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `search-bar`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `search-results`           | `mzizi` | primitives | page/block | none                                   | 6     |
| `section-header`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `segmented-control`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `send-money-flow`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `service-health-card`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `session-list`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `settings-layout`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `severity-badge`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `share-dialog`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `source-citation`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `spinner`                  | `mzizi` | primitives | UI         | none                                   | 5     |
| `split-bill`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `split-view`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `stats-card`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `status-dot`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `status-indicator`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `step-progress`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `stepper`                  | `mzizi` | primitives | UI         | none                                   | 5     |
| `sticky-bar`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `stop-card`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `story-creator`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `streaming-text`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `subscription-card`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `suggested-prompts`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `symptom-checker`          | `mzizi` | primitives | UI         | none                                   | 5     |
| `tag-input`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `task-board`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `telemedicine-widget`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `text-size-adjuster`       | `mzizi` | primitives | UI         | none                                   | 5     |
| `time-picker`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `time-series-chart`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `time-slot-picker`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `time-tracker`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `timeline`                 | `mzizi` | primitives | UI         | none                                   | 5     |
| `timeout`                  | `mzizi` | primitives | server     | none                                   | 4     |
| `todo-item`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `token-balance-card`       | `mzizi` | primitives | UI         | none                                   | 5     |
| `toolbar`                  | `mzizi` | primitives | UI         | none                                   | 5     |
| `transfer-list`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `translation-indicator`    | `mzizi` | primitives | UI         | none                                   | 5     |
| `tree-view`                | `mzizi` | primitives | UI         | none                                   | 5     |
| `typing-indicator`         | `mzizi` | primitives | UI         | none                                   | 5     |
| `typography`               | `mzizi` | primitives | UI         | none                                   | 5     |
| `use-memory-pressure`      | `mzizi` | primitives | lib/hook   | none                                   | 5     |
| `user-management-row`      | `mzizi` | primitives | UI         | none                                   | 5     |
| `vehicle-card`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `verification-review-card` | `mzizi` | primitives | UI         | none                                   | 5     |
| `video-player`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `video-trimmer`            | `mzizi` | primitives | UI         | none                                   | 5     |
| `virtual-list`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `vitals-display`           | `mzizi` | primitives | UI         | none                                   | 5     |
| `voice-note-player`        | `mzizi` | primitives | UI         | none                                   | 5     |
| `vote-buttons`             | `mzizi` | primitives | UI         | none                                   | 5     |
| `wallet-card`              | `mzizi` | primitives | UI         | none                                   | 5     |
| `webhook-card`             | `mzizi` | primitives | UI         | none                                   | 5     |

### `n3-brand`

| Item                         | Owner    | Collection         | Kind       | Rust | Batch |
| ---------------------------- | -------- | ------------------ | ---------- | ---- | ----- |
| `mzizi-action-sheet`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-alert-banner`         | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-application-tracker`  | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-article-card`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-auth-card`            | `nyuchi` | agentic-components | UI         | none | 2     |
| `mzizi-avatar-stack`         | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-badge-display`        | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-balance-display`      | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-calendar`             | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-commute-card`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-content-composer`     | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-conversation-row`     | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-cover-header`         | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-cover-wash-header`    | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-create-listing`       | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-credential-card`      | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-empty-state`          | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-escalation-card`      | `nyuchi` | agentic-components | UI         | none | 1     |
| `mzizi-event-card`           | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-featured-card`        | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-forecast-card`        | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-gauge-card`           | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-group-card`           | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-harness`              | `nyuchi` | brand              | lib/hook   | none | n/a   |
| `mzizi-health-dashboard`     | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-hero-stat`            | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-job-card`             | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-leaderboard-row`      | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-lesson-card`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-listing-card`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-media`                | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-message-bubble`       | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-meta-tile`            | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-mission-card`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-notification-item`    | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-offer-card`           | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-onboarding-step`      | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-payment-mandate-card` | `nyuchi` | agentic-components | UI         | none | 2     |
| `mzizi-payment-summary`      | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-phrase-card`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-place-card`           | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-product-card`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-product-results`      | `nyuchi` | agentic-components | UI         | none | 2     |
| `mzizi-profile-block`        | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-profile-header`       | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-profile-page`         | `nyuchi` | brand              | page/block | none | 6     |
| `mzizi-profile-settings`     | `nyuchi` | brand              | page/block | none | 6     |
| `mzizi-programme-item`       | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-provider-card`        | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-registration-card`    | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-review-card`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-route-planner`        | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-rsvp-button`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-search-view`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-share-card`           | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-sidebar-nav`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-source-badge`         | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-stats-row`            | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-success-screen`       | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-suitability-card`     | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-ticket-card`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-timeline`             | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-transaction-row`      | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-trust-meter`          | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-user-card`            | `nyuchi` | brand              | UI         | none | 1     |
| `mzizi-user-menu`            | `nyuchi` | brand              | UI         | none | 6     |
| `mzizi-verified-badge`       | `nyuchi` | brand              | UI         | none | 2     |
| `mzizi-washed-theme`         | `nyuchi` | brand              | UI         | none | 2     |

### `n4-safety`

| Item                    | Owner   | Collection | Kind   | Rust | Batch |
| ----------------------- | ------- | ---------- | ------ | ---- | ----- |
| `ai-safety`             | `mzizi` | safety     | server | none | 4     |
| `mzizi-chain-gate`      | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-content-gate`    | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-crypto-gate`     | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-did-gate`        | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-feature-gate`    | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-geo-gate`        | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-moderation-gate` | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-offline-gate`    | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-permission-gate` | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-rate-gate`       | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-trust-gate`      | `mzizi` | safety     | UI     | none | 3     |
| `mzizi-wallet-gate`     | `mzizi` | safety     | UI     | none | 3     |
| `subscription-gate`     | `mzizi` | safety     | UI     | none | 3     |

### `n5-resilience`

| Item                      | Owner   | Collection | Kind       | Rust | Batch |
| ------------------------- | ------- | ---------- | ---------- | ---- | ----- |
| `error-boundary`          | `mzizi` | resilience | UI         | none | 3     |
| `error-page`              | `mzizi` | resilience | page/block | none | 3     |
| `mzizi-abr-content`       | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-chain-resilience`  | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-crypto-fallback`   | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-degradation-chain` | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-error-set`         | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-load-shedder`      | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-prefetch-boundary` | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-section`           | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-skeleton-set`      | `mzizi` | resilience | UI         | none | 3     |
| `mzizi-sync-status`       | `mzizi` | resilience | UI         | none | 3     |
| `offline-banner`          | `mzizi` | resilience | UI         | none | 3     |
| `section-error-boundary`  | `mzizi` | resilience | UI         | none | 3     |

### `n6-pages`

| Item                        | Owner    | Collection | Kind       | Rust | Batch |
| --------------------------- | -------- | ---------- | ---------- | ---- | ----- |
| `admin-page`                | `nyuchi` | pages      | page/block | none | 6     |
| `analytics-dashboard-page`  | `nyuchi` | pages      | page/block | none | 6     |
| `api-explorer-page`         | `nyuchi` | pages      | page/block | none | 6     |
| `article-page`              | `nyuchi` | pages      | page/block | none | 6     |
| `billing-page`              | `nyuchi` | pages      | page/block | none | 6     |
| `booking-page`              | `nyuchi` | pages      | page/block | none | 6     |
| `chat-page`                 | `nyuchi` | pages      | page/block | none | 6     |
| `checkout-page`             | `nyuchi` | pages      | page/block | none | 6     |
| `console-dashboard-page`    | `nyuchi` | pages      | page/block | none | 6     |
| `data-explorer-page`        | `nyuchi` | pages      | page/block | none | 6     |
| `health-dashboard-page`     | `nyuchi` | pages      | page/block | none | 6     |
| `individual-profile-page`   | `nyuchi` | pages      | page/block | none | 6     |
| `infrastructure-page`       | `nyuchi` | pages      | page/block | none | 6     |
| `job-board-page`            | `nyuchi` | pages      | page/block | none | 6     |
| `learning-page`             | `nyuchi` | pages      | page/block | none | 6     |
| `login-01`                  | `nyuchi` | pages      | page/block | none | 6     |
| `login-02`                  | `nyuchi` | pages      | page/block | none | 6     |
| `login-03`                  | `nyuchi` | pages      | page/block | none | 6     |
| `login-04`                  | `nyuchi` | pages      | page/block | none | 6     |
| `login-05`                  | `nyuchi` | pages      | page/block | none | 6     |
| `logs-page`                 | `nyuchi` | pages      | page/block | none | 6     |
| `map-page`                  | `nyuchi` | pages      | page/block | none | 6     |
| `marketplace-page`          | `nyuchi` | pages      | page/block | none | 6     |
| `media-player-page`         | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-auth-layout`         | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-create-page`         | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-dashboard-layout`    | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-detail-layout`       | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-detail-page`         | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-empty-screen`        | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-error-screen`        | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-feed-page`           | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-grid`                | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-page`                | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-profile-page-layout` | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-settings-page`       | `nyuchi` | pages      | page/block | none | 6     |
| `mzizi-splash-screen`       | `nyuchi` | pages      | page/block | none | 6     |
| `onboarding-flow`           | `nyuchi` | pages      | page/block | none | 6     |
| `onboarding-tour`           | `nyuchi` | pages      | page/block | none | 6     |
| `org-profile-page`          | `nyuchi` | pages      | page/block | none | 6     |
| `payment-page`              | `nyuchi` | pages      | page/block | none | 6     |
| `report-page`               | `nyuchi` | pages      | page/block | none | 6     |
| `signup-01`                 | `nyuchi` | pages      | page/block | none | 6     |
| `signup-02`                 | `nyuchi` | pages      | page/block | none | 6     |
| `signup-03`                 | `nyuchi` | pages      | page/block | none | 6     |
| `signup-04`                 | `nyuchi` | pages      | page/block | none | 6     |
| `signup-05`                 | `nyuchi` | pages      | page/block | none | 6     |
| `social-feed-page`          | `nyuchi` | pages      | page/block | none | 6     |
| `team-management-page`      | `nyuchi` | pages      | page/block | none | 6     |
| `transaction-history-page`  | `nyuchi` | pages      | page/block | none | 6     |
| `verification-page`         | `nyuchi` | pages      | page/block | none | 6     |
| `wallet-page`               | `nyuchi` | pages      | page/block | none | 6     |

### `n7-shell`

| Item                        | Owner    | Collection | Kind | Rust | Batch |
| --------------------------- | -------- | ---------- | ---- | ---- | ----- |
| `app-switcher`              | `nyuchi` | shell      | UI   | none | 6     |
| `mzizi-bottom-nav`          | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-command-palette`     | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-connectivity-bar`    | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-deep-link-handler`   | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-footer`              | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-header`              | `nyuchi` | shell      | UI   | none | 6     |
| `mzizi-mini-app-runtime`    | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-notification-center` | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-persistent-player`   | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-root-layout`         | `nyuchi` | shell      | UI   | none | n/a   |
| `mzizi-route-guard`         | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-sidebar`             | `nyuchi` | shell      | UI   | none | 6     |
| `mzizi-theme-provider`      | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-toast-provider`      | `nyuchi` | shell      | UI   | has  | —     |
| `mzizi-update-prompt`       | `nyuchi` | shell      | UI   | has  | —     |

### `n8-assurance`

| Item                     | Owner   | Collection    | Kind     | Rust                                         | Batch |
| ------------------------ | ------- | ------------- | -------- | -------------------------------------------- | ----- |
| `accessibility-audit`    | `mzizi` | documentation | server   | partial (procedure in `mzizi-a11y-audit.rs`) | 4     |
| `mzizi-a11y-audit`       | `mzizi` | observability | lib/hook | has                                          | —     |
| `mzizi-alert-engine`     | `mzizi` | observability | server   | has                                          | —     |
| `mzizi-api-probe`        | `mzizi` | observability | server   | has                                          | —     |
| `mzizi-chaos`            | `mzizi` | observability | lib/hook | has                                          | —     |
| `mzizi-conformity-check` | `mzizi` | observability | lib/hook | has                                          | —     |
| `mzizi-error-tracker`    | `mzizi` | observability | server   | has                                          | —     |
| `mzizi-incident-manager` | `mzizi` | observability | server   | has                                          | —     |
| `mzizi-otel`             | `mzizi` | observability | server   | has                                          | —     |
| `mzizi-perf-probe`       | `mzizi` | observability | lib/hook | has                                          | —     |
| `mzizi-platform-health`  | `mzizi` | observability | UI       | has                                          | —     |
| `mzizi-rum`              | `mzizi` | observability | lib/hook | has                                          | —     |
| `mzizi-synthetic-probe`  | `mzizi` | observability | server   | has                                          | —     |
| `rtl-conformity-check`   | `mzizi` | observability | UI       | has                                          | —     |

### `n9-fundi`

| Item                   | Owner    | Collection | Kind     | Rust | Batch |
| ---------------------- | -------- | ---------- | -------- | ---- | ----- |
| `mzizi-fundi`          | `nyuchi` | fundi      | lib/hook | has  | —     |
| `mzizi-fundi-learning` | `nyuchi` | fundi      | server   | has  | —     |
| `mzizi-fundi-reporter` | `nyuchi` | fundi      | server   | has  | —     |

### `n10-documentation`

| Item                       | Owner    | Collection           | Kind   | Rust | Batch |
| -------------------------- | -------- | -------------------- | ------ | ---- | ----- |
| `mzizi-ai-context`         | `nyuchi` | documentation-engine | server | has  | —     |
| `mzizi-changelog-renderer` | `nyuchi` | documentation-engine | UI     | has  | —     |
| `mzizi-docs-api`           | `nyuchi` | documentation-engine | server | has  | —     |
| `mzizi-docs-engine`        | `nyuchi` | documentation-engine | UI     | has  | —     |

### `n11-discovery`

| Item        | Owner    | Collection | Kind   | Rust | Batch |
| ----------- | -------- | ---------- | ------ | ---- | ----- |
| `mzizi-seo` | `nyuchi` | pages      | server | has  | —     |
