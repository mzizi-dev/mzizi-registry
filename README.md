# nyuchi design portal

> The canonical design system for the bundu ecosystem — powering mukoko (17 consumer mini-apps), nyuchi (7 enterprise products), and sister brands. Component registry, brand documentation, architecture reference, AI-native tooling, and developer portal.

[![CI](https://github.com/nyuchitech/design-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/nyuchitech/design-portal/actions/workflows/ci.yml)
[![Release](https://github.com/nyuchitech/design-portal/actions/workflows/release.yml/badge.svg)](https://github.com/nyuchitech/design-portal/actions/workflows/release.yml)
[![CodeQL](https://github.com/nyuchitech/design-portal/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/nyuchitech/design-portal/security/code-scanning)

**Version:** 4.0.1 | **Live:** [design.nyuchi.com](https://design.nyuchi.com) | **Docs:** [design.nyuchi.com/docs](https://design.nyuchi.com/docs) | **Observability:** [design.nyuchi.com/observability](https://design.nyuchi.com/observability)

---

## What is this?

nyuchi design portal is the canonical design system for the bundu ecosystem — the single source of truth for UI components, design tokens, brand guidelines, architecture documentation, and developer portal. It powers mukoko (Africa's super app — 17 mini-apps), nyuchi (7 enterprise products), and every app in the bundu family.

The registry is backed by a **DB-first architecture** (Supabase) and served as a shadcn-compatible API — every component is installable directly into any project with one command. It is also **AI-native**: a full Model Context Protocol (MCP) server at `/mcp` gives Claude Code and other AI assistants direct access to the registry, brand tokens, and design system documentation.

---

## Quick install

```bash
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/button
```

Install multiple:

```bash
npx shadcn@latest add \
  https://design.nyuchi.com/api/v1/ui/card \
  https://design.nyuchi.com/api/v1/ui/dialog \
  https://design.nyuchi.com/api/v1/ui/data-table
```

---

## AI-Native: MCP Server + Claude Code Skill

### Connect Claude Code (or any MCP client)

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "design-portal": {
      "type": "url",
      "url": "https://design.nyuchi.com/mcp"
    }
  }
}
```

Your AI assistant can now:

| Tool                    | What it does                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `list_components`       | Browse all registry items, filter by type or category          |
| `get_component`         | Fetch full source code + metadata for any component            |
| `search_components`     | Search by name or description                                  |
| `scaffold_component`    | Generate a new component following CVA + Radix + cn() patterns |
| `get_design_tokens`     | Fetch the Five African Minerals palette + semantic tokens      |
| `get_install_command`   | Get the shadcn CLI install command for any component           |
| `get_brand_info`        | Brand system — ecosystem brands, typography, spacing           |
| `get_architecture_info` | Architecture principles, data layer, pipeline, sovereignty     |
| `get_ubuntu_principles` | Ubuntu philosophy and community-first design doctrine          |
| `get_usage_stats`       | Public API and MCP usage metrics (open data, CC BY 4.0)        |
| `get_database_status`   | Registry database status and row counts                        |

**Endpoint:** `POST /mcp` (JSON-RPC) | `GET /mcp` (SSE) | `DELETE /mcp` (cleanup) | `OPTIONS /mcp` (CORS preflight)

### Claude Code Skill

The `mukoko-design-system` skill (`/.claude/skills/mukoko-design-system.md`) is a pre-built Claude Code skill that teaches AI assistants the Five African Minerals design system:

- Full color palette with APCA contrast values
- CVA + Radix + `cn()` component patterns
- Ubuntu design checklist (touch targets, connectivity, shared devices)
- APCA Lc 90+ accessibility quick reference
- Registry install commands

Activate in any session: `/mukoko-design-system`

---

## Five African Minerals

The design system is built on five colors named after African minerals — constant across light and dark mode:

| Mineral    | Hex       | CSS Variable         | Usage                              |
| ---------- | --------- | -------------------- | ---------------------------------- |
| Cobalt     | `#0047AB` | `--color-cobalt`     | Primary blue, links, CTAs          |
| Tanzanite  | `#B388FF` | `--color-tanzanite`  | Purple accent, brand/logo          |
| Malachite  | `#64FFDA` | `--color-malachite`  | Cyan accent, success states        |
| Gold       | `#FFD740` | `--color-gold`       | Yellow accent, rewards, highlights |
| Terracotta | `#D4A574` | `--color-terracotta` | Warm accent, community             |

**Buttons are always pill-shaped (`rounded-full`).** This is a brand identity decision — not a radius scale value.

---

## Registry

The registry is live at [design.nyuchi.com/components](https://design.nyuchi.com/components). Component counts are always live from the database — see [/observability](https://design.nyuchi.com/observability) for real-time totals.

| Category             | Examples                                                                         |
| -------------------- | -------------------------------------------------------------------------------- |
| **Forms & Input**    | input, phone-input, date-range-picker, tag-input, rich-text-editor, combobox     |
| **Chat & Messaging** | chat-bubble, chat-list, chat-input, chat-layout, typing-indicator                |
| **AI & Chatbot**     | ai-chat, prompt-input, streaming-text, ai-feedback, suggested-prompts            |
| **Data Display**     | data-table, kanban-board, tree-view, virtual-list, json-viewer, timeline         |
| **User & Profile**   | avatar-group, user-card, profile-header, activity-feed                           |
| **E-commerce**       | product-card, cart-item, order-summary, subscription-card                        |
| **Calendar**         | calendar, calendar-week-view, event-card, time-slot-picker                       |
| **Developer Tools**  | api-key-display, code-tabs, log-viewer, endpoint-card                            |
| **Navigation**       | tabs, stepper, app-switcher, bottom-sheet, mega-menu                             |
| **Layout**           | split-view, masonry-grid, infinite-scroll, page-header                           |
| **Feedback**         | announcement-bar, cookie-consent, onboarding-tour, toast                         |
| **Chart Blocks**     | area (10), bar (10), line (10), pie (11), radar (14), radial (6), tooltip (9)    |
| **Page Blocks**      | dashboard, login (5), signup (5), sidebar (16), profile, settings                |
| **Mukoko Ecosystem** | mukoko-header, mukoko-footer, mukoko-sidebar, mukoko-bottom-nav                  |
| **Infrastructure**   | error-boundary, lazy-section, section-error-boundary                             |
| **Hooks**            | use-toast, use-mobile, use-memory-pressure                                       |
| **Lib Utilities**    | utils, observability, circuit-breaker, retry, timeout, fallback-chain, ai-safety |

---

## API

All endpoints under `/api/v1/`. Full spec in [`openapi.yaml`](openapi.yaml).

| Endpoint              | Method   | Description                                         |
| --------------------- | -------- | --------------------------------------------------- |
| `/api/v1`             | GET      | Discovery document                                  |
| `/api/v1/ui`          | GET      | Component registry index                            |
| `/api/v1/ui/{name}`   | GET      | Component source + metadata                         |
| `/api/v1/brand`       | GET      | Brand system (minerals, typography, spacing)        |
| `/api/v1/ecosystem`   | GET      | Architecture principles + framework decision        |
| `/api/v1/data-layer`  | GET      | Local-first + cloud layer specification             |
| `/api/v1/pipeline`    | GET      | Open data pipeline (Redpanda, Flink, Doris)         |
| `/api/v1/sovereignty` | GET      | Technology sovereignty assessments                  |
| `/api/v1/stats`       | GET      | Public usage metrics (CC BY 4.0, `?days=7\|30\|90`) |
| `/api/v1/health`      | GET      | Service health check                                |
| `/api/v1/db`          | GET/POST | Database status and seeding                         |
| `/mcp`                | POST/GET | MCP server (Streamable HTTP)                        |

---

## Open Data & Observability

Usage metrics are public by design — aligned with the bundu open data philosophy. The [/observability](https://design.nyuchi.com/observability) dashboard shows:

- API call volumes, error rates, and p95 latency per endpoint
- Most requested components (live install popularity ranking)
- MCP tool usage breakdown
- 30-day traffic trends

Raw data: `GET https://design.nyuchi.com/api/v1/stats` — licensed CC BY 4.0.

---

## Architecture

### DB-First

All data flows through Supabase. API routes read from the database with no hardcoded fallbacks:

```
Supabase (PostgreSQL)
  components, component_docs, component_demos
  brand_minerals, brand_semantic_colors, brand_typography
  brand_spacing, brand_ecosystem, brand_meta
  architecture_principles, architecture_framework
  architecture_data_layer, architecture_pipeline
  architecture_sovereignty, architecture_removed
  usage_events          ← API + MCP observability
        │
        ▼
Next.js API Routes (/api/v1/)
        │
   ┌────┼────┐
   ▼    ▼    ▼
shadcn  MCP  Portal
  CLI server  pages
```

### Layered Component Architecture

```
Layer 1: Primitives    (Button, Input, Card, Badge)
    ↓
Layer 2: Composites    (ChatLayout, DataTable)
    ↓
Layer 3: Orchestrators (Page sections)
    ↓
Layer 4: Error boundaries + loading states
    ↓
Layer 5: Server page wrappers (page.tsx)
```

### Three Sources of Truth

| Source         | Database              | Role                                                       |
| -------------- | --------------------- | ---------------------------------------------------------- |
| Relational     | Supabase / PostgreSQL | Identity, places, events, commerce, wallet                 |
| Non-relational | ScyllaDB              | Content and streams — messages, articles, AI conversations |
| Personal       | Web3 Pod (TBD)        | Digital Twin memory, preferences, AI context               |

**Speed is rented. Truth is owned.**

---

## Tech Stack

| Layer                | Technology                             | Version        |
| -------------------- | -------------------------------------- | -------------- |
| Framework            | Next.js (App Router)                   | 16.2.2         |
| Language             | TypeScript (strict mode)               | 6.0.2          |
| Package Manager      | pnpm                                   | —              |
| Styling              | Tailwind CSS 4 + CSS custom properties | 4.2.2          |
| Component Primitives | Radix UI + Base UI                     | radix-ui 1.4.3 |
| Variant Management   | class-variance-authority (CVA)         | 0.7.1          |
| HTML Sanitization    | sanitize-html                          | 2.17.2         |
| Charts               | Recharts                               | 3.8.1          |
| Forms                | react-hook-form + zod                  | 7.72.0 / 4.3.6 |
| Database             | Supabase                               | 2.101.1        |
| Documentation        | Nextra                                 | 4.6.1          |
| Icons                | Lucide React                           | 1.7.0          |
| MCP                  | @modelcontextprotocol/sdk              | 1.29.0         |
| Testing              | Vitest + Testing Library               | 4.1.2          |
| CI/CD                | GitHub Actions + Vercel                | —              |

---

## Commands

| Command               | Description                                     |
| --------------------- | ----------------------------------------------- |
| `pnpm dev`            | Start development server                        |
| `pnpm build`          | Production build                                |
| `pnpm lint`           | Run ESLint (zero warnings enforced)             |
| `pnpm test`           | Run Vitest test suite                           |
| `pnpm test:watch`     | Watch mode                                      |
| `pnpm typecheck`      | TypeScript type check                           |
| `pnpm registry:build` | Generate static registry JSON into `public/r/`  |
| `pnpm db:seed`        | Seed Supabase from registry.json and brand data |
| `pnpm db:reseed`      | Force re-seed (idempotent)                      |

---

## Local Development

```bash
git clone https://github.com/nyuchitech/design-portal.git
cd design-portal
pnpm install

# Optional — full DB-first API
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...  (seeding only)
pnpm db:seed

pnpm dev
```

---

## Releases

Every merge to `main` that bumps `package.json` version triggers an automatic GitHub release. The release workflow validates all CI gates (lint, typecheck, tests, build) before tagging.

To release a new version:

1. Update `version` in `package.json`
2. Update `BRAND_SYSTEM.version` in `lib/brand.ts`
3. Update the version in `components/landing/footer.tsx`
4. Open a PR — the merge creates the release automatically

See [CHANGELOG.md](CHANGELOG.md) for release history.

---

## Ecosystem

| App            | URL                                              | Role                                       |
| -------------- | ------------------------------------------------ | ------------------------------------------ |
| mukoko         | [mukoko.com](https://mukoko.com)                 | Africa's super app — 17 mini-apps          |
| mukoko weather | [weather.mukoko.com](https://weather.mukoko.com) | Hyperlocal forecasts, farming intelligence |
| mukoko news    | [news.mukoko.com](https://news.mukoko.com)       | Pan-African news aggregation               |
| nhimbe         | [nhimbe.com](https://nhimbe.com)                 | Events and cultural gatherings             |
| lingo          | [lingo.mukoko.com](https://lingo.mukoko.com)     | African language learning                  |
| shamwari       | [shamwari.ai](https://shamwari.ai)               | Sovereign AI companion                     |
| bushtrade      | [bushtrade.co.zw](https://bushtrade.co.zw)       | Rentals-first marketplace                  |
| nyuchi         | [nyuchi.com](https://nyuchi.com)                 | Enterprise layer — 7 products              |
| bundu          | [bundu.family](https://bundu.family)             | The ecosystem                              |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, code standards, and the PR process.

For questions and ideas, use [GitHub Discussions](https://github.com/nyuchitech/design-portal/discussions).

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Built on Ubuntu: _umuntu ngumuntu ngabantu_ — a person is a person through other persons.

## Security

See [SECURITY.md](SECURITY.md) or report privately via [GitHub Security Advisories](https://github.com/nyuchitech/design-portal/security/advisories/new).

## License

Copyright Nyuchi Africa (PVT) Ltd. All rights reserved.
