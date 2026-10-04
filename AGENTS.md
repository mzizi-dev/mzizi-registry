# AGENTS.md — mzizi-registry

> Vendor-neutral instructions for any AI agent working in this repository. See
> [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the PR process and code standards.

## What this repo is

The canonical Mzizi component registry, brand system, and DNA-helix frontend
architecture. `registry.json` and the component files on disk are the source of truth (no
database). This repo serves no website and no API: the Next.js app that used to live here
was removed, and every public host is served by its own repo (`mzizi.dev` →
`mzizi-dev/mzizi-site`, `app.mzizi.dev` → `mzizi-dev/mzizi-console`, `api.mzizi.dev` →
`mzizi-dev/mzizi-api-gateway`, `mcp.mzizi.dev` → `mzizi-mcp` in `mzizi-dev/agent-tools`).
What it ships is the registry, the token pipeline, the Rust crates (`mzizi-rs/`), the
generators and their checks, the public plugin (`plugin/`), and the `lib/` readers the
gateway bundles at a pinned commit. It is a **Mzizi**-governed standard; Nyuchi
operates it. It is **not** Mzizi-the-language (`mzizi-dev/mzizi`) — that's a different
research project that happens to share the org and a name fragment.

`contracts/` holds a versioned, machine-readable contract for each `@bundu/ui` app
component of the Mzizi Dashboard Standard: 31 in `contracts/app/`, in the format
`contracts/schema/component-contract.schema.json` defines, listed in `contracts/index.json`,
with the coverage table in [`contracts/README.md`](./contracts/README.md) and the reference
at [docs.mzizi.dev/registry/contracts](https://docs.mzizi.dev/registry/contracts). Change a
contract here, never the copy in `mzizi-dev/packages-npm`; `__tests__/contracts/contracts.test.tsx`
keeps the index and the coverage table honest.

### A naming collision worth knowing before you grep

**`mzizi-ui` names two different things in this repo**, and confusing them will send you
to the wrong file:

- `mzizi-ui/` at the repo root — a small Cloudflare Worker (`src/index.ts`) that proxies
  `ui.mzizi.dev`, one of two domain-proxy Workers in this repo alongside `mzizi-plus/`.
- `mzizi-rs/crates/mzizi-ui` — the **Rust/Dioxus component crate** (N2 on the helix), a
  genuinely different codebase that happens to share the name because both serve node N2's
  viewable surface, one in TypeScript/React and one in Rust/Dioxus.

If an instruction says "mzizi-ui" without a path, ask which one before touching either.

## The two domain-proxy Workers

`lib/domain-proxy.ts` implements a shared proxy handler in front of `https://mzizi.dev`;
each Worker below configures it for a different subdomain and a different subset of the
DNA-helix's 8 nodes / 4 rungs:

| Worker        | Subdomain        | Nodes served                                                                                       |
| ------------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| `mzizi-ui/`   | `ui.mzizi.dev`   | N1 tokens, N2 primitives, N3 brand, N6 pages, N7 shell — the viewable strand                       |
| `mzizi-plus/` | `plus.mzizi.dev` | N4 safety, N5 resilience, N8 assurance, N9 fundi, N10 documentation, N11 discovery — the toolchain |

`api.mzizi.dev` is not one of them: the `mzizi-api/` Worker that was generated from the
removed `app/api/` routes was replaced by `mzizi-dev/mzizi-api-gateway` on 2026-09-29.

**`mzizi-plus` is slated to move to its own repository, outside this one — make sure any
change to it stays self-contained (no imports reaching back into this repo's `lib/` beyond
`lib/domain-proxy.ts`, which the eventual split needs to either vendor or depend on
explicitly) so that move is a clean extraction, not an untangling exercise.**

## What `mzizi-api-gateway` reads from here

The gateway's `scripts/extract.ts` bundles these modules at its pinned registry commit:
`lib/registry`, `lib/registry-source`, `lib/db`, `lib/skills`, `lib/samples/data`,
`lib/tokens/palette.generated`, `lib/tokens/brand.source`, `lib/openapi.generated`,
`lib/component-renames` and `lib/rust-crates`, plus `registry.json` and the files those
read. They are a public contract with that repo: renaming or removing one breaks the
gateway's next pin bump.

## Build, test, run

```bash
git clone https://github.com/mzizi-dev/mzizi-registry.git && cd mzizi-registry
pnpm install
```

There is no dev server: nothing here renders a page. `pnpm build` runs every generator in
write mode; CI's `Build` job then fails if that changed a committed file.

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
pnpm plugin:skills          # copy @nyuchi/mzizi-skills into plugin/skills/ for the public Claude Code plugin
pnpm plugin:skills:check    # non-mutating check
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
- **21 colour families, not a five-mineral count.** Seven minerals, seven heritage
  tones, seven experimental — three groups of seven; the older five-mineral phrasing is
  retired.
- **The DNA helix — 8 nodes, 4 rungs, 6 strands — not "axes" or "layers."**
  `/api/v1/architecture/axes` and `/layers/{n}` answer **410 Gone**, deliberately: those are
  retired models, not undocumented ones.
- **File-based, no database at all.** `registry.json` plus files on disk. The registry holds
  no Supabase client, credential or query — the Mzizi console (`mzizi-dev/mzizi-console`) is
  the only thing in the estate that talks to Supabase, and `__tests__/db/no-source-in-database.test.ts`
  fails the build if an `@supabase/*` import or a `SUPABASE_*` read comes back.
  The API (served by `mzizi-dev/mzizi-api-gateway`) answers from these files; its
  `/v1/ui/{name}/versions` answers `503` naming the console as the owner of version
  history. Do not "fix" that by adding a database.
- **`/api/v1/search` filters on `node`, not `layer`.** `?layer=` survives only as a
  deprecated alias of `?node=` (it adds `meta.deprecation` and a `Deprecation: true`
  header). Don't document it as anything else, and don't add another `layer` anywhere.

## Site, docs and skills freshness (hard rule)

Owner's rule, 2026-09-30: **mzizi.dev (`mzizi-dev/mzizi-site`), docs.mzizi.dev
(`mzizi-dev/mzizi-docs`) and the agent skills (`@nyuchi/mzizi-skills`) must never lag this
repo.** In the owner's words: "if the skills are outdated, AI and LLMs fail immediately."

- Any change to the components, the Mzizi Roots crates (`mzizi-rs/crates/`), the API data
  (`registry.json`, the `lib/` readers `mzizi-api-gateway` bundles, `openapi.yaml`), or the npm packages and
  MCP tools that read this registry changes what the site, the docs and the skills must say.
- `@nyuchi/mzizi-skills` (in agent-tools, `mzizi-skills/`) tracks every language and
  component change as closely as the site and docs do. All three copies serve the same
  current version: npm, `mzizi_get_skills` on mcp.mzizi.dev, and `/v1/skills` on
  api.mzizi.dev, which reads the skills through this repo's `@nyuchi/mzizi-skills`
  dependency and the gateway's registry pin.
- Three standing freshness agents, one each for the site, the docs and the skills, check
  upstream state against what those surfaces say, and open PRs whenever anything drifts.
- **A PR here that changes something user-visible must say so in its body, under a
  `Site/docs/skills impact` heading**, so the freshness agents pick it up. Name what changed
  and which pages, sections or skills it affects. If nothing user-visible changed, write
  "None".

## Changelog (hard rule)

Owner's rule, 2026-09-30: "changelogs are super important".

- **Every PR that changes behaviour, shipped content, an API response, a published package
  or crate, a default, a dependency or a documented fact adds an entry under
  `## [Unreleased]` in `CHANGELOG.md`**, in the same PR. Use a
  `### <Kind> — <what changed> (<date>, #<PR>)` heading, where Kind is a Keep a Changelog
  heading (Added, Changed, Deprecated, Removed, Fixed, Security), mark breaking changes
  **Breaking**, and say what changed for a consumer of the registry or the API, not the
  commit text.
- The `changelog / entry required` check (`.github/workflows/changelog.yml`) fails a PR
  without one. PRs that touch only `.github/`, lockfiles or lint config pass, and pure CI,
  lint or typo PRs can carry the `no-changelog` label instead.
- The logic is `scripts/changelog-gate.sh`, tested by `scripts/changelog-gate.test.sh`.
  Keep both identical to the copies in the other Mzizi repositories.
- `CHANGELOG.md` is the human narrative. A release also adds its machine-readable record to
  `content/changelog/releases.json`, which `/v1/changelog` on api.mzizi.dev serves (through
  the gateway's registry pin).

## A link this file replaces

`README.md` used to point to `CLAUDE.md §14` for "the version-bump propagation surfaces" —
that file does not exist in this repository (checked: no `CLAUDE.md` anywhere in the tree).
Whatever that section said has not been reconstructed here; if you know what it should say,
add it as its own section rather than re-creating a dead link.

## Naming and ownership

- Mzizi is owned and governed by **Mzizi**; **Nyuchi** operates and develops it. It is not
  a Nyuchi product — anyone in the bundu ecosystem consumes it, direction-setting flows
  through Mzizi.
- Brand wordmarks are lowercase in prose: `mzizi`, `bundu`, `nyuchi`, `fundi`, `mukoko`.
- `mzizi-dev/agent-tools` is **private** — do not link it in anything public-facing; name
  it in prose instead.

## Further reading

- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — PR process, code standards.
- [`SECURITY.md`](./SECURITY.md) — vulnerability reporting.
- [`CHANGELOG.md`](./CHANGELOG.md) — the change history, written by hand in every PR (see
  "Changelog" above). [`.github/workflows/release.yml`](./.github/workflows/release.yml)
  tags a GitHub release when `package.json`'s version is new; it does not write the
  changelog. [`.github/workflows/publish-crates.yml`](./.github/workflows/publish-crates.yml)
  publishes any crate version not yet on crates.io and tags it `mzizi-rs-vX.Y.Z`. Both run
  on merge to `main` with `RELEASE_BUMP_TOKEN`; nobody pushes a tag by hand.

## Track big work in GitHub issues

Any substantial build, migration, investigation or multi-step task gets a GitHub issue in the repo that owns it — before or as work starts — so another session, agent or person can pick it up.

- The issue holds the goal, the owner's decisions (verbatim where given), the plan, acceptance criteria, owner-only steps and links.
- Every PR references its issue (`Refs #n`; `Fixes #n` only when the merge completes it).
- Post progress, decisions and a hand-off note (what's done, what's left, branch names) as issue comments — at each merge and before a session or agent finishes.
- Work spanning repos gets a tracking issue that links the per-repo issues.
- Never put secrets, credential status or exploitable detail in issues on public repos.
