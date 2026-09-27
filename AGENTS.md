# AGENTS.md — mzizi-registry

> Vendor-neutral instructions for any AI agent working in this repository. See
> [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the PR process and code standards.

## What this repo is

The canonical Mzizi component registry, brand system, and DNA-helix frontend
architecture — a Next.js app whose `registry.json` and component files on disk are the
source of truth (no database). It is a **Bundu Foundation** governed standard; Nyuchi
operates it. It is **not** Mzizi-the-language (`mzizi-dev/mzizi`) — that's a different
research project that happens to share the org and a name fragment.

### A naming collision worth knowing before you grep

**`mzizi-ui` names two different things in this repo**, and confusing them will send you
to the wrong file:

- `mzizi-ui/` at the repo root — a small Cloudflare Worker (`src/index.ts`) that proxies
  `ui.mzizi.dev`, one of four domain-proxy Workers alongside `mzizi-api/`, `mzizi-plus/`,
  and the console (in `mzizi-console`, a separate repo).
- `mzizi-rs/crates/mzizi-ui` — the **Rust/Dioxus component crate** (N2 on the helix), a
  genuinely different codebase that happens to share the name because both serve node N2's
  viewable surface, one in TypeScript/React and one in Rust/Dioxus.

If an instruction says "mzizi-ui" without a path, ask which one before touching either.

## The four domain-proxy Workers

`lib/domain-proxy.ts` implements a shared proxy handler; each Worker below configures it
for a different subdomain and a different subset of the DNA-helix's 8 nodes / 4 rungs:

| Worker                   | Subdomain        | Nodes served                                                                                                                       |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `mzizi-ui/`              | `ui.mzizi.dev`   | N1 tokens, N2 primitives, N3 brand, N6 pages, N7 shell — the viewable strand                                                       |
| `mzizi-api/`             | `api.mzizi.dev`  | The 36 JSON endpoints under `app/api/` — the exact same route handlers the Next app serves, imported unmodified, not reimplemented |
| `mzizi-plus/`            | `plus.mzizi.dev` | N4 safety, N5 resilience, N8 assurance, N9 fundi, N10 documentation, N11 discovery — the toolchain                                 |
| (console, separate repo) | `app.mzizi.dev`  | `mzizi-dev/mzizi-console`                                                                                                          |

**`mzizi-plus` is slated to move to its own repository, outside this one — make sure any
change to it stays self-contained (no imports reaching back into this repo's `app/` or
`lib/` beyond `lib/domain-proxy.ts`, which the eventual split needs to either vendor or
depend on explicitly) so that move is a clean extraction, not an untangling exercise.**

## Build, test, run

```bash
git clone https://github.com/mzizi-dev/mzizi-registry.git && cd mzizi-registry
pnpm install
pnpm dev              # port 11736
```

**`pnpm check` runs every gate CI runs, in order** — run it before every push:

```bash
pnpm check
# = format:check && lint && lint:colors && lint:md && lint:json && typecheck && test
#   && audit:check && registry:validate && registry:verify && tokens:verify
#   && changelog:generate:check && node-map:generate:check && rust:generate:check && build
```

If `pnpm check` is green, CI will be too.

### The generate/check pattern

Most content in this repo (`registry.json`'s index, the changelog, the OpenAPI spec, the
Rust component copies, the node map, agent skills, brand tokens) is **generated from a
single source and committed**, not read live at request time. Every generator ships a
`--check` twin that fails if the committed output has drifted from its source:

```bash
pnpm registry:normalize   # rewrite registry.json canonically (it's authored, not generated — this just normalizes form)
pnpm registry:verify      # non-mutating: fails if registry.json isn't canonical
pnpm tokens:sync          # regenerate globals.css + palette.generated.ts from lib/tokens/palette.source.ts
pnpm tokens:verify         # non-mutating token-drift check
pnpm rust:generate         # regenerate mzizi-rs's crates/*/src/generated/ Rust component copies
pnpm rust:generate:check   # non-mutating check
```

If you touch a source file that one of these reads, run its generator (or its `--check`,
to confirm you already did) before committing — CI runs the `--check` half of every pair,
and a stale generated artifact is a merge-blocking defect, not a style nit.

The Rust workspace (`mzizi-rs/`) has its own gate, run from that directory:

```bash
cargo fmt --manifest-path mzizi-rs/Cargo.toml --all -- --check
cargo clippy --manifest-path mzizi-rs/Cargo.toml --workspace --all-targets -- -D warnings
cargo test --manifest-path mzizi-rs/Cargo.toml --workspace   # contract tests against the .tsx siblings
```

## Honesty rules — facts that drift, and the rule that catches it

This registry's own docs have shipped stale counts and retired terminology before (see the
git history of this file's predecessor content in README.md). Four facts worth checking
against the live API rather than trusting a prior write-up:

- **The component count moves.** Cite `GET /v1/ui` or `GET /v1/stats` and date the snapshot
  rather than repeating a number from memory.
- **21 colour families, not "the Five African Minerals."** Seven minerals, seven heritage
  tones, seven experimental — three groups of seven, and the "five minerals" phrasing is
  retired.
- **The DNA helix — 8 nodes, 4 rungs, 6 strands — not "axes" or "layers."**
  `/api/v1/architecture/axes` and `/layers/{n}` answer **410 Gone**, deliberately: those are
  retired models, not undocumented ones.
- **File-based, not database-backed.** `registry.json` plus files on disk. Do not describe
  a write path through Supabase/a database for anything under `components/registry/` — the
  one remaining DB-backed route is `/api/v1/search`, itself marked `503` in the API table,
  and that is a known gap, not a pattern to extend.

## A link this file replaces

`README.md` used to point to `CLAUDE.md §14` for "the version-bump propagation surfaces" —
that file does not exist in this repository (checked: no `CLAUDE.md` anywhere in the tree).
Whatever that section said has not been reconstructed here; if you know what it should say,
add it as its own section rather than re-creating a dead link.

## Naming and ownership

- Mzizi is **Bundu Foundation** governed IP; **Nyuchi** operates and develops it. It is not
  a Nyuchi product — anyone in the bundu ecosystem consumes it, direction-setting flows
  through the Foundation.
- Brand wordmarks are lowercase in prose: `mzizi`, `bundu`, `nyuchi`, `fundi`, `mukoko`.
- `mzizi-dev/agent-tools` is **private** — do not link it in anything public-facing; name
  it in prose instead.

## Further reading

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — PR process, code standards.
- [`SECURITY.md`](./SECURITY.md) — vulnerability reporting.
- [`CHANGELOG.md`](./CHANGELOG.md) — release history (auto-generated on version bump, see
  [`.github/workflows/release.yml`](./.github/workflows/release.yml)).
