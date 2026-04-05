# nyuchi design portal

> The canonical design system for the bundu ecosystem — powering mukoko (17 consumer mini-apps), nyuchi (7 enterprise products), and sister brands. Component registry, brand documentation, architecture reference, and developer portal.

[![CI](https://github.com/nyuchitech/design-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/nyuchitech/design-portal/actions/workflows/ci.yml)

**Version:** 4.0.1 | **Live:** [design.nyuchi.com](https://design.nyuchi.com) | **Docs:** [design.nyuchi.com/docs](https://design.nyuchi.com/docs) | **Brand:** [design.nyuchi.com/brand](https://design.nyuchi.com/brand)

---

## What is this?

nyuchi design portal is the canonical design system for the bundu ecosystem — the single source of truth for component library, design tokens, brand guidelines, architecture documentation, and developer portal. It powers mukoko (Africa's super app — 17 mini-apps, 4 substrate components), nyuchi (7 enterprise products), and sister brands (Zimbabwe Information Platform, Barstool by Nyuchi).

It serves **294 production-ready registry items**:

- **169 UI components** -- from buttons and inputs to chat interfaces, kanban boards, and AI chatbot patterns
- **70 chart blocks** -- area, bar, line, pie, radar, radial, and tooltip chart examples built on Recharts
- **35 page blocks** -- complete page compositions for dashboards, authentication, profiles, settings, and sidebars
- **6 standard page compositions** -- ready-to-use page templates
- **3 hooks** -- toast, mobile detection, memory pressure
- **11 lib utilities** -- observability, circuit breaker, retry, timeout, fallback chain, chaos engineering, AI safety, and more

Everything is installable via the shadcn CLI and backed by a **DB-first architecture** with Supabase. All API routes read from the database with zero hardcoded fallbacks.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nyuchitech/design-portal.git
cd design-portal

# Install dependencies
pnpm install

# (Optional) Set up Supabase for full DB-first API
cp .env.example .env.local
# Add your SUPABASE_URL and SUPABASE_ANON_KEY

# Seed the database (requires SUPABASE_SERVICE_ROLE_KEY)
pnpm db:seed

# Start development server
pnpm dev
```

Visit [http://localhost:11736](http://localhost:11736) to see the portal.

---

## Install a Component

```bash
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/button
```

Install multiple components at once:

```bash
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/card \
  https://design.nyuchi.com/api/v1/ui/dialog \
  https://design.nyuchi.com/api/v1/ui/input
```

---

## Registry Categories

| Category | Count | Examples |
|---|---|---|
| **Forms & Input** | 28 | input, phone-input, date-range-picker, tag-input, rich-text-editor, combobox, input-otp |
| **Chat & Messaging** | 8 | chat-bubble, chat-list, chat-input, chat-layout |
| **AI & Chatbot** | 8 | ai-chat, prompt-input, streaming-text |
| **Data Display** | 14 | data-table, tree-view, kanban-board, virtual-list, json-viewer, timeline |
| **User & Profile** | 8 | avatar, user-card, profile-header, activity-feed |
| **E-commerce** | 7 | product-card, cart-item, order-summary |
| **Calendar** | 7 | calendar, calendar-week-view, event-card, time-slot-picker |
| **Productivity** | 6 | todo-item, checklist, comment-thread |
| **Developer Tools** | 7 | api-key-display, code-tabs, log-viewer, json-viewer |
| **Security** | 5 | permission-badge, mfa-setup, session-list |
| **Content & Media** | 6 | markdown-renderer, video-player, lightbox |
| **Navigation** | 8 | tabs, stepper, app-switcher, bottom-sheet, mega-menu |
| **Layout** | 10 | split-view, masonry-grid, infinite-scroll, page-header |
| **Feedback** | 10 | announcement-bar, cookie-consent, onboarding-tour, toast, progress |
| **Chart Blocks** | 70 | area, bar, line, pie, radar, radial, tooltip |
| **Page Blocks** | 35 | dashboard, login, signup, sidebar, profile, settings |
| **Mukoko Ecosystem** | 4 | mukoko-header, mukoko-footer, mukoko-sidebar, mukoko-bottom-nav |
| **Infrastructure** | 3 | error-boundary, lazy-section, section-error-boundary |
| **Hooks** | 3 | use-toast, use-mobile, use-memory-pressure |
| **Lib Utilities** | 11 | utils, observability, circuit-breaker, retry, timeout, fallback-chain, chaos, ai-safety |

---

## Portal Structure

The portal hosts **71 documentation pages** across **11 sections**:

```
design.nyuchi.com
├── /                          Landing page
├── /docs                      Developer documentation
│   ├── /docs/installation     Getting started
│   ├── /docs/cli              shadcn CLI usage
│   ├── /docs/theming          Theme customization
│   ├── /docs/dark-mode        Dark mode setup
│   └── /docs/changelog        Release history
├── /components                Component documentation
│   └── /components/[name]     Per-component docs, demos, API reference
├── /blocks                    Page block gallery
│   ├── /blocks/dashboard      Dashboard layouts
│   ├── /blocks/authentication Login/signup flows
│   ├── /blocks/sidebar        Sidebar compositions
│   └── ...
├── /charts                    Chart block gallery
│   ├── /charts/area           Area charts
│   ├── /charts/bar            Bar charts
│   ├── /charts/line           Line charts
│   ├── /charts/pie            Pie charts
│   ├── /charts/radar          Radar charts
│   ├── /charts/radial         Radial charts
│   └── /charts/tooltip        Tooltip charts
├── /brand                     Brand documentation
│   ├── /brand/colors          Five African Minerals palette
│   ├── /brand/components      Component visual specs
│   └── /brand/guidelines      Usage rules, accessibility
├── /foundations               Design foundations
│   ├── /foundations/typography Type scale and fonts
│   ├── /foundations/layout     Layout system
│   ├── /foundations/motion     Animation guidelines
│   ├── /foundations/accessibility Accessibility standards
│   └── /foundations/internationalization i18n support
├── /design                    Design tokens
│   ├── /design/tokens         Token reference
│   └── /design/icons          Icon system
├── /content                   Content guidelines
│   ├── /content/writing       Writing style
│   ├── /content/error-messages Error message patterns
│   └── /content/inclusive-language Inclusive language
├── /patterns                  Implementation patterns
│   ├── /patterns/components   Component patterns
│   ├── /patterns/dashboard    Dashboard patterns
│   ├── /patterns/authentication Auth patterns
│   ├── /patterns/mobile-first Mobile-first design
│   ├── /patterns/error-boundaries Error handling
│   ├── /patterns/lazy-loading Performance
│   ├── /patterns/ai-safety    AI safety guardrails
│   ├── /patterns/chaos        Chaos engineering
│   └── /patterns/architecture Architecture patterns
├── /architecture              Ecosystem architecture
│   ├── /architecture/principles Design principles
│   ├── /architecture/data-layer Data layer spec
│   ├── /architecture/pipeline  Data pipeline
│   └── /architecture/sovereignty Tech sovereignty
├── /registry                  Registry internals
│   ├── /registry/schema       Registry schema docs
│   ├── /registry/contributing Contribution guide
│   ├── /registry/consuming    Consumer guide
│   └── /registry/mcp          MCP server docs
└── /api-docs                  API documentation
```

---

## Five African Minerals

The design system is built on five colors, each named after an African mineral:

| Mineral | Hex | CSS Variable | Usage |
|---|---|---|---|
| Cobalt | `#0047AB` | `--color-cobalt` | Primary blue, links, CTAs |
| Tanzanite | `#B388FF` | `--color-tanzanite` | Purple accent, brand/logo |
| Malachite | `#64FFDA` | `--color-malachite` | Cyan accent, success states |
| Gold | `#FFD740` | `--color-gold` | Yellow accent, rewards, highlights |
| Terracotta | `#D4A574` | `--color-terracotta` | Warm accent, community |

---

## Architecture

### DB-First Design

All data flows through Supabase. API routes read from the database -- there are no hardcoded fallback objects.

```
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
│                                                     │
│  components          brand_minerals                 │
│  component_docs      brand_semantic_colors          │
│  component_demos     brand_typography               │
│  component_categories brand_spacing                 │
│  component_tags      brand_ecosystem                │
│                      brand_meta                     │
│  architecture_principles                            │
│  architecture_frameworks                            │
│  architecture_data_layers                           │
│  architecture_cloud_layers                          │
│  architecture_pipelines                             │
│  architecture_data_ownership                        │
│  architecture_sovereignty                           │
│  architecture_removed                               │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes (/api/v1/)           │
│                                                     │
│  /api/v1/ui          Component registry             │
│  /api/v1/ui/[name]   Individual component + source  │
│  /api/v1/brand       Brand system                   │
│  /api/v1/ecosystem   Architecture principles        │
│  /api/v1/data-layer  Data layer spec                │
│  /api/v1/pipeline    Open data pipeline             │
│  /api/v1/sovereignty Tech sovereignty               │
│  /api/v1/health      Health check                   │
│  /api/v1/db          Database operations            │
└───────────────────────┬─────────────────────────────┘
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
         shadcn CLI   MCP      Portal
         consumers   server    pages
```

### Three Sources of Truth

The mukoko platform has three authoritative databases:

| Source | Database | Owner | Role |
|---|---|---|---|
| Relational | Supabase / PostgreSQL | Platform | Identity, places, events, commerce, wallet |
| Non-relational | ScyllaDB | Platform | All content and streams — messages, articles, AI conversations |
| Personal | Web3 Pod (TBD) | Individual | Digital Twin memory, preferences, AI context |

Everything else — CouchDB (sync protocol), Cloudflare edge (KV + Durable Objects), RxDB/SQLite (device), Apache Doris (open data) — derives from these three sources.

**Speed is rented. Truth is owned.**

### MCP Server

The registry includes a Model Context Protocol server at `/mcp` via Streamable HTTP. It exposes components, brand data, design tokens, and architecture info to AI assistants.

**Endpoint:** `POST /mcp` (JSON-RPC) | `GET /mcp` (SSE) | `DELETE /mcp` (cleanup)

Available tools: `list_components`, `get_component`, `search_components`, `get_design_tokens`, `scaffold_component`, `get_install_command`, `get_brand_info`, `get_architecture_info`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.2 |
| Language | TypeScript (strict mode) | 6.0.2 |
| Package Manager | pnpm | -- |
| Styling | Tailwind CSS + CSS custom properties | 4.2.2 |
| Component Primitives | Radix UI + Base UI | radix-ui 1.4.3, @base-ui/react 1.3.0 |
| Variant Management | class-variance-authority (CVA) | 0.7.1 |
| Charts | Recharts | 3.8.1 |
| Forms | react-hook-form + zod | 7.72.0 / 4.3.6 |
| Database | Supabase | 2.101.1 |
| Documentation | Nextra | 4.6.1 |
| Search | Pagefind | 1.4.0 |
| Icons | Lucide React | 1.7.0 |
| MCP | @modelcontextprotocol/sdk | 1.29.0 |
| Testing | Vitest + Testing Library | 4.1.2 |
| CI/CD | GitHub Actions + Vercel | -- |

---

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server (port 11736) |
| `pnpm build` | Production build (includes Pagefind indexing) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run test suite (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm start` | Start production server |
| `pnpm registry:build` | Generate static registry JSON into `public/r/` |
| `pnpm db:seed` | Seed Supabase from registry.json and brand data |
| `pnpm db:reseed` | Force re-seed (idempotent upsert) |

---

## Ecosystem

This design system powers every app in the bundu ecosystem:

| App | URL | Role |
|---|---|---|
| mukoko | [mukoko.com](https://mukoko.com) | Africa's super app — 17 mini-apps, 4 substrate |
| mukoko weather | [weather.mukoko.com](https://weather.mukoko.com) | Hyperlocal forecasts, farming intelligence |
| mukoko news | [news.mukoko.com](https://news.mukoko.com) | Pan-African news aggregation |
| nhimbe | [nhimbe.com](https://nhimbe.com) | Events and cultural gatherings |
| lingo | [lingo.mukoko.com](https://lingo.mukoko.com) | African language learning |
| shamwari | [shamwari.ai](https://shamwari.ai) | Sovereign AI companion |
| bushtrade | [bushtrade.co.zw](https://bushtrade.co.zw) | Rentals-first marketplace |
| nyuchi | [nyuchi.com](https://nyuchi.com) | Enterprise layer — 7 products |
| bundu | [bundu.family](https://bundu.family) | The ecosystem |

---

## API

All endpoints are under `/api/v1/` and documented in [`openapi.yaml`](openapi.yaml). All responses include CORS headers and appropriate caching.

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1` | GET | Discovery document -- lists all resources |
| `/api/v1/ui` | GET | Component registry index |
| `/api/v1/ui/{name}` | GET | Individual component with inlined source code |
| `/api/v1/brand` | GET | Brand system (minerals, typography, spacing) |
| `/api/v1/ecosystem` | GET | Architecture principles and framework decisions |
| `/api/v1/data-layer` | GET | Local-first + cloud layer specification |
| `/api/v1/pipeline` | GET | Open data pipeline (Redpanda, Flink, Doris) |
| `/api/v1/sovereignty` | GET | Technology sovereignty assessments |
| `/api/v1/db` | GET | Database operations |
| `/api/v1/health` | GET | Service health check |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, code standards, and the PR process.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

Copyright Nyuchi Africa (PVT) Ltd. All rights reserved.
