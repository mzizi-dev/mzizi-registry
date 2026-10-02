# Mzizi

> The canonical component registry, brand system, and DNA-helix frontend architecture for the bundu ecosystem — an open-architecture project of the Bundu Foundation, owned and operated by Mzizi.

[![CI](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/ci.yml)
[![Release](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/release.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/release.yml)
[![CodeQL](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/security/code-scanning)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

**Version:** 1.0.0 | **API:** [api.mzizi.dev](https://api.mzizi.dev/v1/ui) | **Console:** [app.mzizi.dev](https://app.mzizi.dev) | **MCP:** `mcp.mzizi.dev/mcp` | **Docs:** [docs.mzizi.dev](https://docs.mzizi.dev)

> **This repo serves no website and no API.** It is the registry's source: `registry.json`, the
> component files, the token pipeline, the Rust crates and the generators that check them. The
> public hosts are served by other repos, which read this one — see
> [Where each host is served from](#where-each-host-is-served-from).

---

## What is Mzizi?

**Mzizi** (Swahili for _root_) installs like any shadcn registry, one command, into any
project — but underneath the install command is a bet most registries don't make: **the
same component, verified twice, in two languages.** Every primitive with a Rust sibling
ships a `.tsx` and a `.rs` version that a contract test asserts agree on variants,
`data-slot` names, and classes — not two implementations that happen to look similar, one
source of truth checked from both directions.

```bash
npx shadcn@latest add https://api.mzizi.dev/v1/ui/button
```

**575 components** across 8 architectural nodes and 4 rungs, served from disk —
`registry.json` and the component files in this repo are the source of truth, not a
database. **21 colour families.** **One MCP server** (served from `mzizi-dev/agent-tools`) any AI
client can install against.
Nothing here is a Nyuchi product: it's a Mzizi-governed standard the whole bundu ecosystem
(Mukoko's consumer apps, Nyuchi's enterprise products, sister brands) installs from the same
place.

Install several at once:

```bash
npx shadcn@latest add \
  https://api.mzizi.dev/v1/ui/card \
  https://api.mzizi.dev/v1/ui/dialog \
  https://api.mzizi.dev/v1/ui/data-table
```

Every install carries the canonical typography (Noto Sans / Noto Serif / JetBrains Mono),
the 21-family palette, the DNA-helix architecture, the pill-button identity, and the 56px
touch-target floor.

---

## Where each host is served from

The Next.js app that used to live here (the `mzizi.dev` portal, the `/api/v1` routes and the
`mzizi-api` Worker generated from them) has been removed. Every public host is now served by
its own repo:

| Host                                           | Served by                                                                                                                                                                         |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`mzizi.dev`](https://mzizi.dev)               | [`mzizi-dev/mzizi-site`](https://github.com/mzizi-dev/mzizi-site) (Astro)                                                                                                         |
| [`app.mzizi.dev`](https://app.mzizi.dev)       | [`mzizi-dev/mzizi-console`](https://github.com/mzizi-dev/mzizi-console) (Astro)                                                                                                   |
| [`api.mzizi.dev`](https://api.mzizi.dev/v1/ui) | [`mzizi-dev/mzizi-api-gateway`](https://github.com/mzizi-dev/mzizi-api-gateway) (Cloudflare Worker), built from this repo's `registry.json` and `lib/` readers at a pinned commit |
| `mcp.mzizi.dev`                                | The `mzizi-mcp` Worker in `mzizi-dev/agent-tools` (private)                                                                                                                       |
| [`docs.mzizi.dev`](https://docs.mzizi.dev)     | [`mzizi-dev/mzizi-docs`](https://github.com/mzizi-dev/mzizi-docs) (Mintlify)                                                                                                      |
| [`ui.mzizi.dev`](https://ui.mzizi.dev)         | `mzizi-ui/` in this repo — a domain-proxy Worker in front of `mzizi.dev` for the viewable strand (tokens, primitives, brand, pages, shell)                                        |
| `plus.mzizi.dev`                               | `mzizi-plus/` in this repo — the same proxy for the toolchain nodes (safety, resilience, assurance, fundi, documentation, discovery)                                              |

`mzizi-rs/` is the Rust half of the bet above: a Cargo workspace whose `mzizi-ui` crate
(Dioxus primitives) and `mzizi-tokens` crate (generated from the same palette source as the
CSS custom properties) are compiled and contract-tested in CI, not just committed as text.

---

## AI-Native: MCP server

There is **one** Mzizi MCP server: `https://mcp.mzizi.dev/mcp` (Streamable HTTP transport,
the `mzizi-mcp` Worker in `mzizi-dev/agent-tools`, a private repo). Each tool returns a
whole self-contained JSON document per component — one fetch, no joins. Access is gated by a
**free WorkOS AuthKit signup**; `api.mzizi.dev/v1` remains open and unauthenticated for
anything that needs no account.

```json
{
  "mcpServers": {
    "mzizi": {
      "type": "url",
      "url": "https://mcp.mzizi.dev/mcp"
    }
  }
}
```

Resources: `mzizi://components` (component index), `mzizi://nodes` (per-node summary).
Tools: `list_components`, `get_component`, `list_collections`.

The standalone Cloudflare Worker variant, the Fundi self-healing agent, the TypeScript SDK,
the published `mzizi-skills` bundle, and the Svelte mini-app that surfaces Mzizi inside the
Nyuchi Console all live in **`mzizi-dev/agent-tools`** — a private repo, not this one.

---

## The palette — 21 colour families

Seven African minerals, seven heritage tones, seven experimental. Values are generated from
`lib/tokens/palette.source.ts` in this repo (`pnpm tokens:sync`) — not from a database; the
live values are served at [`GET /v1/brand`](https://api.mzizi.dev/v1/brand).

| Mineral    | Role         | Family     | CSS Variable         |
| ---------- | ------------ | ---------- | -------------------- |
| Cobalt     | Knowledge    | deep-earth | `--color-cobalt`     |
| Tanzanite  | Identity     | deep-earth | `--color-tanzanite`  |
| Malachite  | Growth       | deep-earth | `--color-malachite`  |
| Sodalite   | Intelligence | deep-earth | `--color-sodalite`   |
| Gold       | Value        | hand       | `--color-gold`       |
| Terracotta | Community    | hand       | `--color-terracotta` |
| Copper     | Stewardship  | hand       | `--color-copper`     |

Alongside the minerals: the seven heritage tones (indigo, savanna, baobab, sunset, river,
hematite, kalahari), the status set (success/warning/info/error/neutral/offline/syncing),
and the experimental seven (ember, acacia, fern, lagoon, storm, dusk, protea) — 21 families
in all. See [`GET /v1/brand`](https://api.mzizi.dev/v1/brand) for the full, live palette.

**Buttons are always pill-shaped (`rounded-full`)** — a brand identity decision, not a
radius scale value.

---

## API

`api.mzizi.dev` is served by
[`mzizi-dev/mzizi-api-gateway`](https://github.com/mzizi-dev/mzizi-api-gateway), not by
this repo. The gateway bundles this repo's files — `registry.json`, the component sources
and the `lib/` readers (`lib/registry`, `lib/db`, `lib/skills`, `lib/tokens`, …) — at a
pinned commit. The spec stays here in [`openapi.yaml`](openapi.yaml) (inlined into
`lib/openapi.generated.ts`, which the gateway serves at `GET /openapi`).

Resource paths serve under both `/v1/` (canonical) and `/api/v1/`. The registry holds no
database: every route answers from those files. The one route marked **503** is data this
API does not hold.

| Endpoint                                                               | Method   | Description                                                                                   |
| ---------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `/api/v1`                                                              | GET      | Discovery document                                                                            |
| `/api/v1/ui`                                                           | GET      | Component registry index                                                                      |
| `/api/v1/ui/{name}`                                                    | GET      | Component source + metadata (shadcn format)                                                   |
| `/api/v1/ui/{name}/docs`                                               | GET      | Structured docs from the item's `meta` block in `registry.json`                               |
| `/api/v1/ui/{name}/versions`                                           | GET      | Component version history — **503**; the history is console data, not the registry's          |
| `/api/v1/brand`                                                        | GET      | Brand system (minerals, typography, spacing)                                                  |
| `/api/v1/architecture`                                                 | GET      | Full architecture snapshot                                                                    |
| `/api/v1/architecture/nodes/{n}`                                       | GET      | One node or rung of the helix (`n` is uncapped)                                               |
| `/api/v1/architecture/axes`, `/layers/{n}`, `/frontend/{axes\|layers}` | GET      | **410 Gone** — retired models                                                                 |
| `/api/v1/ubuntu/pillars`, `/ubuntu/principles`                         | GET      | The Five Ubuntu Pillars / Principles                                                          |
| `/api/v1/docs`, `/docs/{slug}`                                         | GET      | **410 Gone** — long-form docs moved to docs.mzizi.dev                                         |
| `/api/v1/changelog`, `/changelog/{version}`                            | GET      | Release history                                                                               |
| `/api/v1/ai/instructions{,/{name}}`                                    | GET      | AI instruction sets; `{name}` matches a set's name, then its target                           |
| `/api/v1/skills{,/{name},/summary}`                                    | GET      | Published agent skills                                                                        |
| `/api/v1/search?q=&node=&category=`                                    | GET      | Component search; `?layer=` is a deprecated alias of `?node=`                                 |
| `/api/v1/ecosystem`                                                    | GET      | Architecture principles + framework decision                                                  |
| `/api/v1/data-layer`                                                   | GET      | Local-first + cloud layer specification                                                       |
| `/api/v1/pipeline`                                                     | GET      | Open data pipeline (Redpanda, Flink, Doris)                                                   |
| `/api/v1/sovereignty`                                                  | GET      | Technology sovereignty assessments                                                            |
| `/api/v1/stats?days=`                                                  | GET      | Usage metrics shape (CC BY 4.0, `?days=7\|30\|90`) — always zeroed; telemetry is console data |
| `/api/v1/health`                                                       | GET      | Service health check                                                                          |
| `/mcp`                                                                 | POST/GET | **308** → `mcp.mzizi.dev/mcp` (the one MCP server)                                            |

---

## Open Data & Observability

Usage metrics are public by design. The `/observability` dashboard left with the Next.js
portal. Raw data:
`GET https://api.mzizi.dev/v1/stats` — licensed CC BY 4.0.

---

## Tech Stack

| Layer                | Technology                                                              | Version        |
| -------------------- | ----------------------------------------------------------------------- | -------------- |
| Language             | TypeScript (strict mode)                                                | 6.0.3          |
| Styling              | Tailwind CSS 4 + CSS custom properties                                  | 4.2.4          |
| Component Primitives | Radix UI + Base UI                                                      | radix-ui 1.4.3 |
| Variant Management   | class-variance-authority (CVA)                                          | 0.7.1          |
| Charts               | Recharts                                                                | 3.8.1          |
| Forms                | react-hook-form + zod                                                   | 7.73.1 / 4.3.6 |
| Registry storage     | `registry.json` + component files on disk — no database                 | —              |
| Rust                 | `mzizi-rs/` workspace — `mzizi-ui` (Dioxus), `mzizi-tokens` (generated) | —              |
| Testing              | Vitest, `cargo test` for the Rust half                                  | 5.0.2          |
| CI/CD                | GitHub Actions — this repo deploys no app                               | —              |

See [`AGENTS.md`](./AGENTS.md) for the full command reference, the CI gate list, and what an
agent working in this repo needs to know before pushing.

---

## Ecosystem

| Repository                                                                              | URL                                                | Role                                                                                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **[mzizi-dev/mzizi-registry](https://github.com/mzizi-dev/mzizi-registry)** (this repo) | —                                                  | Component registry source, tokens, Rust crates, DNA-helix doctrine                                          |
| **[mzizi-dev/mzizi](https://github.com/mzizi-dev/mzizi)**                               | —                                                  | Mzizi **the language** — the Rust compiler research project. Not the registry                               |
| **[mzizi-dev/mzizi-console](https://github.com/mzizi-dev/mzizi-console)**               | [app.mzizi.dev](https://app.mzizi.dev)             | The Mzizi console                                                                                           |
| **[mzizi-dev/mzizi-api-gateway](https://github.com/mzizi-dev/mzizi-api-gateway)**       | [api.mzizi.dev](https://api.mzizi.dev/v1/health)   | The registry API as a pure-Rust Cloudflare Worker                                                           |
| **[mzizi-dev/mzizi-docs](https://github.com/mzizi-dev/mzizi-docs)**                     | [docs.mzizi.dev](https://docs.mzizi.dev)           | Mzizi's documentation — the one home for Mzizi docs (Mintlify)                                              |
| **mzizi-dev/agent-tools** (private)                                                     | npm packages                                       | Mzizi tooling — `mzizi-mcp` worker, `mzizi-sdk` (with the Fundi agent), `mzizi-skills`, `mzizi-console-app` |
| **[nyuchi/mukoko-platform](https://github.com/nyuchi/mukoko-platform)** (private)       | [platform.nyuchi.com](https://platform.nyuchi.com) | Nyuchi Console — B2B platform                                                                               |
| **[bundu-labs/bundu-docs](https://github.com/bundu-labs/bundu-docs)** (private)         | [docs.bundu.org](https://docs.bundu.org)           | Bundu's own product documentation (not Mzizi's docs)                                                        |
| **[nyuchi/nyuchi-docs](https://github.com/nyuchi/nyuchi-docs)**                         | [docs.nyuchi.com](https://docs.nyuchi.com)         | Nyuchi engineering documentation (not Mzizi's docs)                                                         |
| mukoko                                                                                  | [mukoko.com](https://mukoko.com)                   | Africa's super app                                                                                          |
| mukoko weather                                                                          | [weather.mukoko.com](https://weather.mukoko.com)   | Hyperlocal forecasts, farming intelligence                                                                  |
| mukoko news                                                                             | [news.mukoko.com](https://news.mukoko.com)         | Pan-African news aggregation                                                                                |
| nhimbe                                                                                  | [nhimbe.com](https://nhimbe.com)                   | Events and cultural gatherings                                                                              |
| shamwari                                                                                | [shamwari.ai](https://shamwari.ai)                 | Sovereign AI companion                                                                                      |
| nyuchi                                                                                  | [nyuchi.com](https://nyuchi.com)                   | Enterprise layer                                                                                            |
| bundu                                                                                   | [bundu.family](https://bundu.family)               | The ecosystem                                                                                               |

---

## Releases

Every merge to `main` that bumps `package.json`'s version triggers an automatic GitHub
release — see [`.github/workflows/release.yml`](.github/workflows/release.yml). See
[`CHANGELOG.md`](CHANGELOG.md) for release history.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development guidelines and the PR process, and
[`AGENTS.md`](AGENTS.md) for the full command reference and CI gates. For questions and
ideas, use [GitHub Discussions](https://github.com/mzizi-dev/mzizi-registry/discussions).

## Code of Conduct

See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Built on Ubuntu: _umuntu ngumuntu
ngabantu_ — a person is a person through other persons.

## Security

See [`SECURITY.md`](SECURITY.md) or report privately via
[GitHub Security Advisories](https://github.com/mzizi-dev/mzizi-registry/security/advisories/new).

## Governance & License

Mzizi is an **open-architecture project of the Bundu Foundation**. Mzizi owns and operates
the registry, the design system and the API. It is **not** a Nyuchi product: Nyuchi
operates only the [Mzizi console](https://app.mzizi.dev) and the revenue products. Anyone in
the bundu ecosystem can consume the registry; contribution and direction-setting flow
through Mzizi.

Licensed under the [Apache License 2.0](LICENSE). © Bundu Foundation, the copyright holder.
See [NOTICE](NOTICE) for attribution.
