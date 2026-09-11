# Mzizi

> An open-architecture project of the Bundu Foundation — the canonical component registry, brand system, DNA-helix frontend architecture, and AI-native developer portal for the bundu ecosystem. Operated and developed by Nyuchi.

[![CI](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/ci.yml)
[![Release](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/release.yml/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/release.yml)
[![CodeQL](https://github.com/mzizi-dev/mzizi-registry/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/mzizi-dev/mzizi-registry/security/code-scanning)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

**Version:** 1.0.0 | **API:** [api.mzizi.dev](https://api.mzizi.dev/v1/ui) | **Console:** [app.mzizi.dev](https://app.mzizi.dev) | **MCP:** `mcp.mzizi.dev/mcp` | **Product docs:** [docs.bundu.org](https://docs.bundu.org) | **Engineering docs:** [docs.nyuchi.com](https://docs.nyuchi.com)

> **The `mzizi.dev` apex no longer serves this repo.** It is now served by the
> `mzizi-site` Worker, which ships three pages (`/`, `/ecosystem`, `/language`).
> `/components`, `/tokens`, `/brand`, `/r/`, `/observability`, `/api/v1` and
> `/mcp` all return 404 on the apex. The API and MCP surfaces are unaffected at
> `api.mzizi.dev` and `mcp.mzizi.dev`. Porting the portal routes is
> [mzizi-site#5](https://github.com/mzizi-dev/mzizi-site/pull/5); the cutover
> runbook is [mzizi-site#3](https://github.com/mzizi-dev/mzizi-site/pull/3).

<!-- Separates the two blockquotes: with only a blank line between them they
     parse as ONE blockquote containing a blank line (markdownlint MD028). -->

> The previous Mintlify docs site is retired — long-form docs now live at [docs.bundu.org](https://docs.bundu.org) (product) and [docs.nyuchi.com](https://docs.nyuchi.com) (engineering).

---

## What is Mzizi?

**Mzizi** (Swahili for _root_) is an independent open-architecture project of the **Bundu Foundation**, operated and developed by **Nyuchi**. It owns the open DNA-helix frontend architecture, the component registry, the Mzizi API at `api.mzizi.dev/v1`, the 21-family design system, and the Model Context Protocol (MCP) server at `mcp.mzizi.dev/mcp`. It is **not** a Nyuchi product — it is a Bundu-governed standard the whole bundu ecosystem (Mukoko consumer mini-apps, Nyuchi enterprise products, sister brands) installs from. The registry is **served from disk** — `registry.json` and the component files in this repo are the source of truth, not a database. Served as a shadcn-compatible API, every component is installable into any project with one command.

---

## Quick install

```bash
npx shadcn@latest add https://api.mzizi.dev/v1/ui/button
```

Install several at once:

```bash
npx shadcn@latest add \
  https://api.mzizi.dev/v1/ui/card \
  https://api.mzizi.dev/v1/ui/dialog \
  https://api.mzizi.dev/v1/ui/data-table
```

Every install carries the canonical typography (Noto Sans / Noto Serif / JetBrains Mono), the 21-family palette, the DNA-helix architecture, the pill-button identity, and the 56px touch-target floor.

---

## AI-Native: MCP server

There is **one** Mzizi MCP server: `https://mcp.mzizi.dev/mcp` (Streamable HTTP transport, the `mzizi-mcp` Worker in `mzizi-dev/agent-tools`, a private repo). Each tool returns a whole self-contained JSON document per component — one fetch, no joins. Access is gated by a **free WorkOS AuthKit signup**; `api.mzizi.dev/v1` remains open and unauthenticated for anything that needs no account.

The portal used to serve a second, smaller MCP in-process at `mzizi.dev/mcp`. That route is now a **308** to the one above — method and body preserved, so an in-flight JSON-RPC `POST` survives the hop and existing clients keep working. Configure new clients against the real endpoint:

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

Resources:

- `mzizi://components` — component index (name / node / collection / owner)
- `mzizi://nodes` — per-node collection summary

Tools:

- `list_components` — filter by node (1–11) or owner
- `get_component` — full document for one component
- `list_collections` — counts + ownership across the 8 nodes and 4 rungs

The standalone Cloudflare Worker variant (for consumers that don't want to go through `mzizi.dev`), the Fundi self-healing agent, the TypeScript SDK, the published `mzizi-skills` bundle, and the `mzizi-console-app` (Svelte mini-app that surfaces Mzizi inside the Nyuchi Console at `platform.nyuchi.com`) all live in **`mzizi-dev/agent-tools`** — a private repo, not this one.

---

## The palette — 21 colour families

The palette is **21 colour families**: seven African minerals, seven heritage tones, and the experimental seven. The minerals each carry a semantic **role** and sit in two **families**. Values are generated from `lib/tokens/palette.source.ts` in this repo (`pnpm tokens:sync`) — **not** from a database; the live values are served at [`GET /v1/brand`](https://api.mzizi.dev/v1/brand).

| Mineral    | Role         | Family     | CSS Variable         |
| ---------- | ------------ | ---------- | -------------------- |
| Cobalt     | Knowledge    | deep-earth | `--color-cobalt`     |
| Tanzanite  | Identity     | deep-earth | `--color-tanzanite`  |
| Malachite  | Growth       | deep-earth | `--color-malachite`  |
| Sodalite   | Intelligence | deep-earth | `--color-sodalite`   |
| Gold       | Value        | hand       | `--color-gold`       |
| Terracotta | Community    | hand       | `--color-terracotta` |
| Copper     | Stewardship  | hand       | `--color-copper`     |

Alongside the minerals the palette carries **seven heritage tones** (indigo, savanna, baobab, sunset, river, hematite, kalahari), the **status** set (success/warning/info/error/neutral/offline/syncing), and the **experimental seven** (ember, acacia, fern, lagoon, storm, dusk, protea) — 21 families in all. See [`GET /v1/brand`](https://api.mzizi.dev/v1/brand) for the full, live palette.

**Buttons are always pill-shaped (`rounded-full`).** This is a brand identity decision — not a radius scale value.

---

## Registry

The registry index is served at [`GET /v1/ui`](https://api.mzizi.dev/v1/ui). **575 components** across the 8 nodes and 4 rungs, read from `registry.json` and the component files in this repo — there is no database behind them. [`GET /v1/stats`](https://api.mzizi.dev/v1/stats) is the raw open-data feed (CC BY 4.0).

The human-facing browse pages are currently offline — see the apex notice above.

---

## API

Resource paths serve under **both** `/v1/` (canonical) and `/api/v1/`. The one
exception is the bare discovery index: `/api/v1` returns it, `/v1` still falls
through to the origin's HTML 404. Full spec in [`openapi.yaml`](openapi.yaml) (also served at `GET /api/openapi`).

| Endpoint                                       | Method   | Description                                                     |
| ---------------------------------------------- | -------- | --------------------------------------------------------------- |
| `/api/v1`                                      | GET      | Discovery document                                              |
| `/api/v1/ui`                                   | GET      | Component registry index                                        |
| `/api/v1/ui/{name}`                            | GET      | Component source + metadata (shadcn format)                     |
| `/api/v1/ui/{name}/docs`                       | GET      | Structured docs (use cases, variants, a11y)                     |
| `/api/v1/ui/{name}/versions`                   | GET      | Component version history                                       |
| `/api/v1/brand`                                | GET      | Brand system (minerals, typography, spacing)                    |
| `/api/v1/architecture`                         | GET      | Full architecture snapshot                                      |
| `/api/v1/architecture/nodes/{n}`               | GET      | One node or rung of the helix (`n` is uncapped)                 |
| `/api/v1/architecture/axes`                    | GET      | **HTTP 410 Gone** — the axis model is retired                   |
| `/api/v1/architecture/layers/{n}`              | GET      | **HTTP 410 Gone** — the layer model is retired                  |
| `/api/v1/architecture/frontend/{axes\|layers}` | GET      | **HTTP 410 Gone** — the axis model is retired                   |
| `/api/v1/ubuntu/pillars`                       | GET      | Five Ubuntu Pillars                                             |
| `/api/v1/ubuntu/principles`                    | GET      | Five Ubuntu Principles                                          |
| `/api/v1/docs`                                 | GET      | **HTTP 410 Gone** — long-form docs moved to docs.bundu.org      |
| `/api/v1/docs/{slug}`                          | GET      | **HTTP 410 Gone** — see `/api/v1/docs` for slug map             |
| `/api/v1/changelog`                            | GET      | Release history                                                 |
| `/api/v1/changelog/{version}`                  | GET      | Single release                                                  |
| `/api/v1/ai/instructions{,/{name}}`            | GET      | AI instruction sets (mcp-server / claude / copilot)             |
| `/api/v1/skills{,/{name},/summary}`            | GET      | Published agent skills                                          |
| `/api/v1/search?q=`                            | GET      | Cross-resource search — **503 today**: the last DB-backed route |
| `/api/v1/ecosystem`                            | GET      | Architecture principles + framework decision                    |
| `/api/v1/data-layer`                           | GET      | Local-first + cloud layer specification                         |
| `/api/v1/pipeline`                             | GET      | Open data pipeline (Redpanda, Flink, Doris)                     |
| `/api/v1/sovereignty`                          | GET      | Technology sovereignty assessments                              |
| `/api/v1/stats?days=`                          | GET      | Open-data usage metrics (CC BY 4.0, `?days=7\|30\|90`)          |
| `/api/v1/health`                               | GET      | Service health check                                            |
| `/api/openapi`                                 | GET      | OpenAPI 3.1 specification (YAML)                                |
| `/mcp`                                         | POST/GET | **308** → `mcp.mzizi.dev/mcp` (the one MCP server)              |

---

## Open Data & Observability

Usage metrics are public by design — aligned with the bundu open data philosophy. The `/observability` dashboard (API call volumes, error rates, p95 latency per endpoint, most-requested components, MCP tool usage, 30-day trends) is **currently offline with the rest of the apex portal** — see the notice at the top.

Raw data: `GET https://api.mzizi.dev/v1/stats` — licensed CC BY 4.0.

---

## Tech Stack

| Layer                | Technology                                                       | Version        |
| -------------------- | ---------------------------------------------------------------- | -------------- |
| Framework            | Next.js (App Router)                                             | 16.2.4         |
| Language             | TypeScript (strict mode)                                         | 6.0.3          |
| Styling              | Tailwind CSS 4 + CSS custom properties                           | 4.2.4          |
| Component Primitives | Radix UI + Base UI                                               | radix-ui 1.4.3 |
| Variant Management   | class-variance-authority (CVA)                                   | 0.7.1          |
| Charts               | Recharts                                                         | 3.8.1          |
| Forms                | react-hook-form + zod                                            | 7.73.1 / 4.3.6 |
| Registry storage     | `registry.json` + component files on disk — no database          | —              |
| MCP SDK              | @modelcontextprotocol/sdk                                        | 1.29.0         |
| Icons                | Lucide React                                                     | 1.8.0          |
| Testing              | Vitest + Testing Library                                         | 4.1.5          |
| CI/CD                | GitHub Actions; deploys to Vercel — moving to Cloudflare Workers | —              |

---

## Commands

| Command                   | Description                                                                        |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `pnpm dev`                | Start development server (port 11736)                                              |
| `pnpm build`              | Production build (postbuild runs Pagefind to index `.next/server/app`)             |
| `pnpm check`              | **Run every CI gate locally** — same set CI runs on a PR. Use this before pushing. |
| `pnpm format`             | Auto-fix formatting (prettier) across the whole tree                               |
| `pnpm format:check`       | Check formatting without writing — fails if anything would change                  |
| `pnpm lint`               | ESLint (zero warnings enforced)                                                    |
| `pnpm lint:fix`           | ESLint with `--fix`                                                                |
| `pnpm lint:md`            | markdownlint-cli2 across all `*.md`                                                |
| `pnpm lint:json`          | Parse every tracked `*.json` to ensure validity                                    |
| `pnpm lint:yaml`          | yamllint (requires `pip install yamllint`)                                         |
| `pnpm typecheck`          | TypeScript type check (`tsc --noEmit`)                                             |
| `pnpm test`               | Vitest, single run                                                                 |
| `pnpm test:watch`         | Vitest watch mode                                                                  |
| `pnpm audit:check`        | `pnpm audit --audit-level=moderate` — same gate CI runs                            |
| `pnpm registry:normalize` | Rewrite `registry.json` in canonical form (it is authored, not generated)          |
| `pnpm registry:verify`    | Non-mutating check — fails if `registry.json` is not canonical                     |
| `pnpm tokens:sync`        | Regenerate the generated palette (`globals.css` + `palette.generated.ts`)          |
| `pnpm tokens:verify`      | Non-mutating token drift check (run this if you've touched the DB palette)         |

### Run every CI gate before pushing

```bash
pnpm check
# = format:check && lint && lint:colors && lint:md && lint:json && typecheck
#   && test && audit:check && registry:verify && tokens:verify && build
```

If `pnpm check` is green, CI will be too.

---

## CI workflows

| Workflow                                       | Trigger                      | Required checks                                                                                          |
| ---------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`ci.yml`](.github/workflows/ci.yml)           | push to `main`, PR to `main` | `Lint`, `Type Check`, `Test`, `Build`, `Security Audit`, `Registry Snapshot`                             |
| [`lint.yml`](.github/workflows/lint.yml)       | push to `main`, PR to `main` | `lint / actionlint`, `lint / JSON validity`, `lint / prettier`, `lint / markdownlint`, `lint / yamllint` |
| [`release.yml`](.github/workflows/release.yml) | tag push (`v*`)              | Validates `package.json` version matches the tag, then creates a GitHub release                          |

---

## Local Development

```bash
git clone https://github.com/mzizi-dev/mzizi-registry.git
cd mzizi-registry
pnpm install

pnpm dev
```

---

## Ecosystem

| Repository                                                                              | URL                                                | Role                                                                                                        |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **[mzizi-dev/mzizi-registry](https://github.com/mzizi-dev/mzizi-registry)** (this repo) | [mzizi.dev](https://mzizi.dev)                     | Mzizi portal — component registry, brand, DNA-helix architecture, document-route MCP                        |
| **[mzizi-dev/mzizi](https://github.com/mzizi-dev/mzizi)**                               | —                                                  | Mzizi **the language** — the Rust compiler and runtime for the agentic web. Not the registry                |
| **[mzizi-dev/mzizi-console](https://github.com/mzizi-dev/mzizi-console)**               | [app.mzizi.dev](https://app.mzizi.dev)             | The Mzizi console                                                                                           |
| **[mzizi-dev/mzizi-api-gateway](https://github.com/mzizi-dev/mzizi-api-gateway)**       | [api.mzizi.dev](https://api.mzizi.dev/v1/health)   | The registry API as a pure-Rust Cloudflare Worker                                                           |
| **mzizi-dev/agent-tools** (private)                                                     | npm packages                                       | Mzizi tooling — `mzizi-mcp` worker, `mzizi-sdk` (with the Fundi agent), `mzizi-skills`, `mzizi-console-app` |
| **[nyuchi/mukoko-platform](https://github.com/nyuchi/mukoko-platform)** (private)       | [platform.nyuchi.com](https://platform.nyuchi.com) | Nyuchi Console — B2B platform (will be renamed `nyuchi-console`)                                            |
| **[bundu-labs/bundu-docs](https://github.com/bundu-labs/bundu-docs)** (private)         | [docs.bundu.org](https://docs.bundu.org)           | Outward-facing product documentation (Astro Starlight)                                                      |
| **[nyuchi/nyuchi-docs](https://github.com/nyuchi/nyuchi-docs)**                         | [docs.nyuchi.com](https://docs.nyuchi.com)         | Engineering / how-things-are-done docs (Astro Starlight)                                                    |
| mukoko                                                                                  | [mukoko.com](https://mukoko.com)                   | Africa's super app                                                                                          |
| mukoko weather                                                                          | [weather.mukoko.com](https://weather.mukoko.com)   | Hyperlocal forecasts, farming intelligence                                                                  |
| mukoko news                                                                             | [news.mukoko.com](https://news.mukoko.com)         | Pan-African news aggregation                                                                                |
| nhimbe                                                                                  | [nhimbe.com](https://nhimbe.com)                   | Events and cultural gatherings                                                                              |
| shamwari                                                                                | [shamwari.ai](https://shamwari.ai)                 | Sovereign AI companion                                                                                      |
| nyuchi                                                                                  | [nyuchi.com](https://nyuchi.com)                   | Enterprise layer                                                                                            |
| bundu                                                                                   | [bundu.family](https://bundu.family)               | The ecosystem                                                                                               |

---

## Releases

Every merge to `main` that bumps `package.json` version triggers an automatic GitHub release. The release workflow validates all CI gates (lint, typecheck, tests, build) before tagging.

The version-bump propagation surfaces are listed in [`CLAUDE.md`](CLAUDE.md) §14. See [`CHANGELOG.md`](CHANGELOG.md) for release history.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, code standards, and the PR process. For questions and ideas, use [GitHub Discussions](https://github.com/mzizi-dev/mzizi-registry/discussions).

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Built on Ubuntu: _umuntu ngumuntu ngabantu_ — a person is a person through other persons.

## Security

See [SECURITY.md](SECURITY.md) or report privately via [GitHub Security Advisories](https://github.com/mzizi-dev/mzizi-registry/security/advisories/new).

## Governance & License

Mzizi is an **independent open-architecture project of the [Bundu Foundation](https://bundu.family)**, operated and developed by [Nyuchi Africa (PVT) Ltd](https://nyuchi.com). It is **not** a Nyuchi product — Nyuchi is the operator, the Bundu Foundation is the governance body. Anyone in the bundu ecosystem can consume the registry; contribution and direction-setting flow through the Bundu Foundation.

Licensed under the [Apache License 2.0](LICENSE). © Bundu Foundation, operated by Nyuchi Africa (PVT) Ltd. See [NOTICE](NOTICE) for attribution.
