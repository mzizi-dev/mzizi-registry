# Mzizi

> The canonical component registry, brand system, and DNA-helix frontend architecture for the bundu ecosystem — an independent open-architecture project owned by Mzizi, operated and developed by Nyuchi.

[![CI](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/ci.yml)
[![Release](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/release.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/release.yml)
[![CodeQL](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/security/code-scanning)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

**Version:** 1.0.0 | **API:** [api.mzizi.dev](https://api.mzizi.dev/v1/ui) | **Console:** [app.mzizi.dev](https://app.mzizi.dev) | **MCP:** `mcp.mzizi.dev/mcp` | **Docs:** [docs.mzizi.dev](https://docs.mzizi.dev)

> **The `mzizi.dev` apex no longer serves this repo.** It's now served by the `mzizi-site`
> Worker, which ships three pages (`/`, `/ecosystem`, `/language`). `/components`, `/tokens`,
> `/brand`, `/r/`, `/observability`, `/api/v1` and `/mcp` all return 404 on the apex — the
> API and MCP surfaces are unaffected at `api.mzizi.dev` and `mcp.mzizi.dev`. Porting the
> portal routes is [mzizi-site#5](https://github.com/mzizi-dev/mzizi-site/pull/5).

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
database. **21 colour families.** **One MCP server** any AI client can install against.
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

## Architecture: four domains, one registry

This repo doesn't just serve one surface — it's the source for four independently deployed
Cloudflare Workers, each a thin proxy over a different slice of the same underlying
registry:

| Domain                                         | What it serves                                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`ui.mzizi.dev`](https://ui.mzizi.dev)         | The viewable strand — tokens, primitives, brand, pages, shell                                                        |
| [`api.mzizi.dev`](https://api.mzizi.dev/v1/ui) | The 36 JSON endpoints, imported unmodified from the same route handlers the Next app serves — not a reimplementation |
| `plus.mzizi.dev`                               | The toolchain: safety, resilience, assurance, fundi, documentation, discovery                                        |
| [`app.mzizi.dev`](https://app.mzizi.dev)       | The console (`mzizi-dev/mzizi-console`, a separate repo)                                                             |

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

Resource paths serve under both `/v1/` (canonical) and `/api/v1/`. Full spec in
[`openapi.yaml`](openapi.yaml), also served at `GET /api/openapi`.

| Endpoint                                                               | Method   | Description                                                     |
| ---------------------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| `/api/v1`                                                              | GET      | Discovery document                                              |
| `/api/v1/ui`                                                           | GET      | Component registry index                                        |
| `/api/v1/ui/{name}`                                                    | GET      | Component source + metadata (shadcn format)                     |
| `/api/v1/ui/{name}/docs`                                               | GET      | Structured docs (use cases, variants, a11y)                     |
| `/api/v1/ui/{name}/versions`                                           | GET      | Component version history                                       |
| `/api/v1/brand`                                                        | GET      | Brand system (minerals, typography, spacing)                    |
| `/api/v1/architecture`                                                 | GET      | Full architecture snapshot                                      |
| `/api/v1/architecture/nodes/{n}`                                       | GET      | One node or rung of the helix (`n` is uncapped)                 |
| `/api/v1/architecture/axes`, `/layers/{n}`, `/frontend/{axes\|layers}` | GET      | **410 Gone** — retired models                                   |
| `/api/v1/ubuntu/pillars`, `/ubuntu/principles`                         | GET      | The Five Ubuntu Pillars / Principles                            |
| `/api/v1/docs`, `/docs/{slug}`                                         | GET      | **410 Gone** — long-form docs moved to docs.mzizi.dev           |
| `/api/v1/changelog`, `/changelog/{version}`                            | GET      | Release history                                                 |
| `/api/v1/ai/instructions{,/{name}}`                                    | GET      | AI instruction sets (mcp-server / claude / copilot)             |
| `/api/v1/skills{,/{name},/summary}`                                    | GET      | Published agent skills                                          |
| `/api/v1/search?q=`                                                    | GET      | Cross-resource search — **503 today**, the last DB-backed route |
| `/api/v1/ecosystem`                                                    | GET      | Architecture principles + framework decision                    |
| `/api/v1/data-layer`                                                   | GET      | Local-first + cloud layer specification                         |
| `/api/v1/pipeline`                                                     | GET      | Open data pipeline (Redpanda, Flink, Doris)                     |
| `/api/v1/sovereignty`                                                  | GET      | Technology sovereignty assessments                              |
| `/api/v1/stats?days=`                                                  | GET      | Open-data usage metrics (CC BY 4.0, `?days=7\|30\|90`)          |
| `/api/v1/health`                                                       | GET      | Service health check                                            |
| `/mcp`                                                                 | POST/GET | **308** → `mcp.mzizi.dev/mcp` (the one MCP server)              |

---

## Open Data & Observability

Usage metrics are public by design. The `/observability` dashboard is currently offline
with the rest of the apex portal (see the notice above). Raw data:
`GET https://api.mzizi.dev/v1/stats` — licensed CC BY 4.0.

---

## Tech Stack

| Layer                | Technology                                                              | Version        |
| -------------------- | ----------------------------------------------------------------------- | -------------- |
| Framework            | Next.js (App Router)                                                    | 16.2.4         |
| Language             | TypeScript (strict mode)                                                | 6.0.3          |
| Styling              | Tailwind CSS 4 + CSS custom properties                                  | 4.2.4          |
| Component Primitives | Radix UI + Base UI                                                      | radix-ui 1.4.3 |
| Variant Management   | class-variance-authority (CVA)                                          | 0.7.1          |
| Charts               | Recharts                                                                | 3.8.1          |
| Forms                | react-hook-form + zod                                                   | 7.73.1 / 4.3.6 |
| Registry storage     | `registry.json` + component files on disk — no database                 | —              |
| MCP SDK              | @modelcontextprotocol/sdk                                               | 1.29.0         |
| Rust                 | `mzizi-rs/` workspace — `mzizi-ui` (Dioxus), `mzizi-tokens` (generated) | —              |
| Testing              | Vitest + Testing Library, `cargo test` for the Rust half                | 4.1.5          |
| CI/CD                | GitHub Actions; deploys to Vercel — moving to Cloudflare Workers        | —              |

See [`AGENTS.md`](./AGENTS.md) for the full command reference, the CI gate list, and what an
agent working in this repo needs to know before pushing.

---

## Ecosystem

| Repository                                                                              | URL                                                | Role                                                                                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **[mzizi-dev/mzizi-registry](https://github.com/mzizi-dev/mzizi-registry)** (this repo) | [mzizi.dev](https://mzizi.dev)                     | Component registry, brand, DNA-helix architecture, document-route MCP                                       |
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

Mzizi is an **independent open-architecture project owned by Mzizi**, operated and
developed by [Nyuchi Africa (PVT) Ltd](https://nyuchi.com). It is **not** a Nyuchi product —
Nyuchi is the operator, Mzizi is the governance body. Anyone in the bundu ecosystem can
consume the registry; contribution and direction-setting flow through Mzizi.

Licensed under the [Apache License 2.0](LICENSE). © Bundu Foundation. Mzizi is operated by
Nyuchi Africa (PVT) Ltd. See [NOTICE](NOTICE) for attribution.
