# RFC: Mzizi Roots without Dioxus

**Status:** proposed, 2026-10-20; partly built. **Progress on `staging`:** the
skeleton `render` (#506) and six static primitives (#510) are merged, which is PR 0 and six of the
thirteen components in PR 1 (§5). Dioxus is still a dependency of `mzizi-ui`, `mzizi-brand`,
`mzizi-shell`, `mzizi-docs` and the two umbrellas, and nothing is published or version-bumped. **Tracking:** [#503](https://github.com/mzizi-dev/mzizi-registry/issues/503).
**Amends:** [RFC-roots](./RFC-roots.md) §2.1 ("UI components are Dioxus") and §3 (the Dioxus
islands). The server half of Roots (`mzizi-roots-server`, `mzizi-assurance`, `mzizi-fundi`,
`mzizi-discovery`, `mzizi-activitypub`) is not affected, except the `docs` feature it inherits
from `mzizi-docs`.

**Owner decisions (2026-10-20, #503):**

- Migrate Mzizi Roots off Dioxus. Rust UI is a research track under the Bundu Foundation, not
  on the revenue path, and production web work must never wait on it.
- "The dioxus dependency should be removed. We built our own Mzizi primitives." Scope: remove
  `dioxus` and `dioxus-ssr` from every crate in `mzizi-rs/`, not only from the UI crates.
- No Dioxus, Leptos, Yew or other Rust UI framework as a dependency (brief §7).

## 1. Survey, as of `origin/staging` c837dc62 (re-checked at the rebase onto it)

| What                                                                           | Number                                                                                                                                                                                   |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry Rust sources (`components/registry/*/*.rs`)                           | 60                                                                                                                                                                                       |
| …that use `dioxus`                                                             | 39 (≈23 static, ≈17 with hooks, signals or event handlers; keyword match, so approximate)                                                                                                |
| …that do not (the server and assurance halves)                                 | 21                                                                                                                                                                                       |
| Crates whose `Cargo.toml` names `dioxus`                                       | 6 of 11: `mzizi-ui`, `mzizi-brand`, `mzizi-docs`, `mzizi-shell`, `mzizi-roots` (features), `mzizi-roots-server` (through `docs`)                                                         |
| `.rs` files in those crates that use `dioxus`                                  | `mzizi-ui` 17, `mzizi-brand` 14, `mzizi-shell` 12, `mzizi-docs` 2                                                                                                                        |
| `rsx!` invocations / `#[component]` functions                                  | `mzizi-ui` 65 / 28, `mzizi-brand` 19 / 12, `mzizi-shell` 20 / 12, `mzizi-docs` 5 / 2                                                                                                     |
| `dev-dependencies` on `dioxus-ssr`                                             | `mzizi-ui`, `mzizi-brand`                                                                                                                                                                |
| Test harnesses that render through Dioxus                                      | `mzizi-ui/tests/contract.rs`, `mzizi-ui/tests/contracts_json.rs`, `mzizi-brand/tests/contract.rs`, `mzizi-rs/contract-eval/contract_eval.rs` (the `render(fn() -> Element)` entry point) |
| Published on crates.io at 0.3.0 (checked 2026-10-20 against the crates.io API) | all 11 workspace crates                                                                                                                                                                  |

**Generator.** `scripts/generate-rust-components.mjs` copies each `components/registry/<node>/<file>.rs`
verbatim into `mzizi-rs/crates/<crate>/src/generated/`, with a header, and `--check` fails on drift.
Its node-to-crate map is `mzizi-rs/crate-for-node.json`, read also by `lib/rust-crates.ts`. The
generator has no Dioxus knowledge and needs no change to keep copying; the change is in what
the copies contain.

**Consumers.**

- `mzizi-api-gateway` `scripts/registry-handlers/rs.ts` serves `/v1/rs/{name}` with
  `target: "dioxus"` and a `crate` object. Its prose says "the Dioxus source is yours to write".
- `agent-tools/mzizi-mcp` (`src/tools.ts:292`, `src/registry.ts:54`, `scripts/registry-handlers/rs.ts`)
  describes the Rust build as "Rust, Dioxus". `mzizi-cli` picks `--target rust` for a
  `Cargo.toml` project and installs the component source.
- `mzizi-skills` (`mzizi-roots`, `mzizi-design`, `mzizi-backend`, `discoverability`) teaches the
  Dioxus `#[component]` shape.
- `mzizi-console` (`app.mzizi.dev`) is a separate Dioxus app; see §7.

## 2. "Our own primitives": what exists, and what this RFC uses

The owner asked for the `render` path to be built on Mzizi's own primitives. Searched for them:

- **The language primitives** (`mzizi-dev/mzizi`, `primitives/*.mz`: `button`, `input`, `badge`,
  `alert`, `card`, `avatar`, `separator`, `spinner`, `confirm_bar`). These are `.mz` source with
  `contract` blocks, gated by `mz check` and `mz contract`. They say what a component is, not how to
  render one: the Mzizi compiler lowers a `service` and a `program` to Rust, and no component lowers
  (`mzizi-dev/mzizi` AGENTS.md). **No Rust HTML can be generated from them today.** This RFC uses
  them as a reference for variant tables and class strings, where they agree with the contract.
  The authority stays `contracts/<family>/<name>.contract.json`, which every build is tested against.
- **The registry's N2 `.astro` builds** render HTML, but in Astro, not Rust. They are the pure-Astro
  implementations (registry#397) and are the contract's Astro build.
- **`mzizi-ui`'s `markdown-renderer.rs`** parses Markdown into a typed tree and "has no HTML string
  anywhere" (its header). It is the safety model for untrusted text, not an HTML writer.
- **`mzizi-seo`** (`mzizi-discovery`) already writes its `<head>` HTML without Dioxus (`Metadata::to_head_html`,
  `generate_schema_ld`). Its `escape_attr` for `<meta>` content is private and covers attributes only, so it is
  not reusable here.

**Result: no existing Dioxus-free HTML layer exists.** The smallest one that does the job is
specified in §3.

## 3. The replacement

### 3.1 The HTML layer

A module `html` in `mzizi-ui` (crate-internal, `pub(crate)`), written as
`mzizi-rs/crates/mzizi-ui/src/html.rs` in this PR. It has no dependencies. It exposes:

- `escape_into(&mut String, &str)`: `&`, `<`, `>`, `"`, `'` become `&#38;`, `&#60;`, `&#62;`,
  `&#34;`, `&#39;`. This is the table `dioxus-ssr` uses today (`askama_escape::Html`), so the output
  is byte-identical. Non-ASCII passes through.
- `open(&mut String, tag, &[(name, value)])` and `close(&mut String, tag)`: attribute values are
  always escaped, and attribute names are caller-supplied constants.

Every `render` builds its markup only through these functions. A `&str` prop can therefore never
close a quote or start a tag. Each render writes its own `class` and text through `escape_into`.

**Each component carries its own copy of the writer.** A registry file is installed on its own
(`mzizi-ui`'s `lib.rs` makes that the rule: each file self-contained), so `skeleton.rs` does not
`use crate::html`. It holds a private inline `mod html` with `escape_into`, `open` and `close`, the
same code as `html.rs`. `html.rs` is the reference and keeps the unit tests. The test
`the_inline_copy_in_skeleton_matches_this_reference` in `html.rs` renders the inline copy on the five
escaped characters and non-ASCII text, and compares it with the reference, so the copies cannot drift
without a failing test. When the layer is shared (above), the generator could inject this copy into
each component file from the reference, so there is one source and the copies stay generated.

Once the registry has a second consumer of the layer, it becomes the public `mzizi-html` crate
(zero dependencies), and the `mzizi-ui` copy is removed. That is a separate, deliberate release
decision (§6), not part of this RFC's removal.

### 3.2 Components

Each component gets:

- a props struct with the contract's props only, plain Rust types (`String`, `bool`, enums,
  `Option<_>`), `Default` where the contract gives a default;
- `pub fn render(props: &Props) -> String`;
- the root element carries `data-slot="<name>"` and `data-portal`, exactly as today, and the same
  `class` string (`*_variants(...)` keeps producing it);
- its `CONTRACT` const, unchanged.

Children are a difficulty. A Dioxus `children: Element` becomes either a `String` the caller has
already rendered (the usual case: `render(&Card { body: render_text(...) })`), or a typed slot
enum where the contract names several slots. The contract's `slots` block decides which.

Extra attributes (`attributes: Vec<Attribute>` through `GlobalAttributes`) have no Dioxus-free form
yet. The render path takes the contract's props only. Where a consumer needs an attribute the
contract does not name, the contract gains it first (upstream-first rule, AGENTS.md).

Static components (≈23 files) ship **zero WASM**: `render` runs natively at build time or as WASM
inside a Worker during SSR, and Astro inserts the string with `set:html`. Content is visible before
any WASM loads.

### 3.3 Behaviour: `attach`, one module per page

Interactive components (≈17 files: buttons with handlers, the toast, notification and command
palette, bottom nav, persistent player, route guard, theme and mini-app runtime) get a second,
optional function:

```rust
#[cfg(feature = "web")]
pub fn attach(root: &web_sys::Element, /* typed state */) { ... }
```

`attach` finds the server-rendered root by its `data-slot` and wires listeners with `web-sys`. It
does not build DOM. Each page has one WASM module that calls every `attach` its markup needs,
loaded once. Brief §3.3 applies: never one runtime per island, and the page's WASM payload is
tracked and any increase is a regression. The `web` feature is off by default, so a consumer that
only renders HTML pays nothing for it.

Where a component's state lives outside the DOM (the shell's providers, the route guard), the
state moves into plain Rust values passed to `attach`. Signals are not replaced by a framework:
the page module owns the state and writes it to the DOM.

### 3.4 Generator

`scripts/generate-rust-components.mjs` changes in one way and only in its output: nothing. It keeps
copying the registry file verbatim, because the registry file is still the one a human edits and
its `render` is part of that file. What changes is the registry file's contents. The generator's
header comment should name `render`, and the `--check` mode stays the drift gate.

`lib/rust-crates.ts` and `mzizi-api-gateway` `rs.ts` change their `target` from `"dioxus"` to
`"rust"` and the prose from "Dioxus source" to "the Rust render path". That is user-visible text on
`/v1/rs/{name}` and so ships with a `Site/docs/skills impact` note.

## 4. Parity

The bar: for every contract state of every component, and for a set of undeclared edge cases, the
`render` output equals the `dioxus-ssr` output of the Dioxus component with the same props, byte for
byte. Where a documented normalisation is needed (none has been needed so far), it is written here
and applied in the test, never silently.

**Proof so far.** `mzizi-ui/tests/render_parity.rs` compares `skeleton::render` with `dioxus-ssr` for
every state of `contracts/ui/skeleton.contract.json` and for six undeclared cases: an empty class,
spaces, quotes in a value, the five escaped characters, a non-ASCII class. It also pins the oracle's
own shape and escape references, so the test cannot pass on two empty strings. A mutation (quote
escape changed) makes it fail.

**Before `dioxus-ssr` is removed** (in the PR that removes it), each component's oracle output is
captured as a committed golden file, `<crate>/tests/golden/<name>.html`, generated once from
`dioxus-ssr` at the last commit where it exists. After removal, parity runs against the goldens.
The goldens are the record of the reference; they are not regenerated by any later PR without an
explicit note.

**Contract harness.** `contract_eval.rs` keeps its HTML parser (`parse`), which reads well-formed
`dioxus-ssr`-style markup and will read the `render` output unchanged. Its `render(fn() -> Element)`
entry point is replaced by `render_html(&str) -> Node`. The `contracts_json.rs` and `contract.rs`
suites call `render` instead of `dioxus_ssr::render`. Every clause, check and density row is still
evaluated, so the bar is unchanged.

## 5. Migration order

Each step is one PR, merges through `staging`, and leaves `pnpm check` and `cargo test --workspace`
green. Dioxus leaves the tree only at the end of its crate's step.

| PR              | Scope                                                                                                                                                                                                                                                                             | Dioxus after it                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **0 (this PR)** | `html` layer; `render` + parity for `skeleton` (the proof); design.                                                                                                                                                                                                               | Everywhere else.                                    |
| 1               | `mzizi-ui` static primitives with contracts: `alert`, `badge`, `button`, `card`, `input`, `label`, `separator`, `progress`, `avatar`, `status-badge`, `safe-area-frame`, `markdown-renderer` (already typed, so render is a walk over its tree), `chart`. Goldens captured.       | Dioxus in `mzizi-ui` only for the interactive ones. |
| 2               | `mzizi-ui` interactive primitives (`button`/`label` handlers, `input`) through `attach` behind `web`. Drop `dioxus`/`dioxus-ssr` from `mzizi-ui`. Contract harness switched to `render_html`.                                                                                     | None in `mzizi-ui`.                                 |
| 3               | `mzizi-brand` (14 files; it composes `mzizi-ui` primitives, so it follows PR 2). Its `tests/contract.rs` moves to goldens.                                                                                                                                                        | None in `mzizi-brand`.                              |
| 4               | `mzizi-docs` (2 files: `mzizi-changelog-renderer`, `mzizi-docs-engine`), then `mzizi-roots-server` (its `docs` feature stops pulling Dioxus).                                                                                                                                     | None in `mzizi-docs`, `mzizi-roots-server`.         |
| 5               | `mzizi-shell` (12 files, 12 components; the most stateful). Providers and route guard get plain-Rust state plus `attach`. Its page modules are the first real consumers of the one-WASM-per-page rule, so PR 5 measures the page WASM payload and sets the budget (decision 6.2). | None in `mzizi-shell`.                              |
| 6               | `mzizi-roots` umbrella: its `ui`, `brand`, `shell` features re-export the new crates. `dioxus` leaves every `Cargo.toml`, and a CI gate (`cargo tree -i dioxus` is empty in `mzizi-rs`) makes it stay that way.                                                                   | None in `mzizi-rs`.                                 |
| 7               | Text: `/v1/rs/{name}` `target`, the MCP `mzizi_get_component` description, `mzizi-cli` target wording, the `mzizi-roots` and `mzizi-design` skills, `RFC-roots.md` §2.1 and §3 amended. Site and docs follow.                                                                     | —                                                   |

PRs 1 to 5 can be reviewed independently, but each one's goldens are the input to the next, so they
merge in order.

## 6. Versions and crates.io

Nothing is published by any PR in this list until the owner approves it: `publish-crates.yml` uploads
any crate version not on crates.io, on merge to `main`. A new crate at 0.3.0 would be published by the
next release, which is why `mzizi-html` stays inside `mzizi-ui` for now.

The crates on crates.io at 0.3.0 keep working: a published version is permanent and is not yanked by
this work. A consumer pinned to `0.3` keeps the Dioxus components.

The change to the public API is breaking. A `0.x` crate's breaking change is a minor bump under
Cargo's convention, so the proposed version is **0.4.0**. The org policy's "major" means `1.0.0`, and
only a person runs that, so 1.0.0 is not proposed here. Bumps, in dependency order:

- `mzizi-tokens`: no change, stays 0.3.0.
- `mzizi-ui`, `mzizi-brand`, `mzizi-shell`, `mzizi-docs`: 0.4.0 (the public API changes in each).
- `mzizi-roots`: 0.4.0 (its features re-export the above at 0.4.0).
- `mzizi-roots-server`: 0.4.0 only if its public surface changes; its feature set does.
- `mzizi-assurance`, `mzizi-fundi`, `mzizi-discovery`, `mzizi-activitypub`: no change.

The release happens after PR 6, through `staging`, with a `CHANGELOG.md` entry marked **Breaking** and
a crate-by-crate migration note: which component moved from `Props` + `rsx!` to `render(&Props)`.

## 7. Out of scope: `mzizi-console` (`app.mzizi.dev`)

`mzizi-console` is a separate repository and a separate Dioxus app. It is not in `mzizi-rs/` and does
not depend on any Mzizi crate (`Cargo.toml` names only `dioxus`, `serde`, `serde_json`, `reqwest`,
`web-sys`, `tokio`). What it uses from Dioxus, for a later PR:

- `dioxus` with `features = ["web"]`; `dioxus::LaunchBuilder::web().with_cfg(dioxus::web::Config::new().rootname(MOUNT_ID))`;
  `dioxus::logger::initialize_default`.
- `rsx!` (10 invocations), `Element`, `#[component]` (5): three islands (`ComponentsIsland`,
  `TokensIsland`, `ArchitectureIsland`) and a `Root` that picks one from `data-island`.
- `use_resource` (3), with the `resolved!` macro (3, console-local) that maps loading, error and
  loaded states.
- No `use_signal`, `use_effect`, `use_memo` or context in the console source.

Its shape is what §3.3 describes: three islands, one WASM bundle serving all three (its own comment says
so). Migrating it means `resolved!` becomes a plain state match and `use_resource` becomes a `fetch`
in `attach`. It also owes the same decision on the page WASM budget.

## 8. Risks

1. **Byte parity on the rest of the set.** The skeleton proof covers attribute order, escaping and
   the empty-class case, not whitespace inside text nodes, `Option` children, or `Fragment`s. Each
   component's golden surfaces these; a difference fails in its PR, not later.
2. **Children and attributes.** `GlobalAttributes` pass-through is lost. Consumers that relied on
   it need the contract to name the attribute. This is a visible API change for them.
3. **Behaviour without a framework.** The shell's providers (theme, toast, route guard,
   notification center, persistent player) are the largest risk: their state and their reactivity
   were Dioxus signals. Moving them to plain state and `attach` is the real work in PR 5, and the
   WASM payload may grow. It has to be measured, not assumed.
4. **WASM budget (decision 6.2) is still open.** No interactive component ships until the budget is
   set. PR 2 and PR 5 are blocked on that decision.
5. **Two registry texts disagree while the migration runs.** The `/v1/rs` payload says `dioxus` until
   PR 7. Until then the text says "built on Dioxus 0.7 today and moving to Mzizi's own renderer"
   (#503 comment), so the registry stays true at each step.
6. **The estate is not Dioxus-free after this RFC.** `mzizi-console` is Dioxus. "Remove `dioxus` from
   mzizi-rs" is the scope here; the console is §7.
7. **Parity oracle loss.** Once `dioxus-ssr` is removed, a golden file is the only reference. A wrong
   golden is wrong forever, so goldens are captured once, reviewed, and changed only with a note.
8. **Release timing.** `publish-crates.yml` publishes on merge to `main`. A version bump in a PR
   that also changes the API would publish the breaking change at the next release, so bumps belong
   in PR 6 and need owner approval.

## 9. What PR 0 did (#506)

- Adds `mzizi-ui/src/html.rs` (the reference escaping writer, unit-tested) and `#[cfg(test)] pub(crate) mod html` in `lib.rs`. It is compiled for tests only, because `render` uses the inline copy in `skeleton.rs`.
- Adds `skeleton::RenderProps` and `skeleton::render` to the registry source
  `components/registry/n2-primitives/skeleton.rs`, regenerated into `mzizi-ui/src/generated/`.
  The Dioxus `Skeleton` stays.
- Adds `mzizi-ui/tests/render_parity.rs`.
- Adds this document.
- Removes nothing, bumps no version, publishes nothing.

Section 5 PR 1 is partly done: #510 landed `separator`, `progress`, `badge`, `status-badge`, `safe-area-frame`
and `chart`. Still to do in PR 1: `alert`, `button`, `card`, `input`, `label`, `avatar`,
`markdown-renderer`.

**Public API.** `mzizi_ui::skeleton::RenderProps` and `mzizi_ui::skeleton::render` are new public
items, so this is additive: no existing item changes. It is not a breaking change, and it ships
unreleased until PR 6.
