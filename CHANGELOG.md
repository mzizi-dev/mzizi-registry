# Changelog

All notable changes to the Nyuchi Design Portal are documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **`LICENSE`:** the repo was previously unlicensed. Added the MIT License with a note that `/api/v1/stats` usage metrics remain under CC BY 4.0.
- **`.github/workflows/lint.yml`:** new required-check workflow with four jobs — `actionlint`, `JSON validity`, `prettier`, `markdownlint` — wired to report under the `lint / <tool>` status names the branch protection rules expect.
- **`.markdownlint-cli2.jsonc`:** explicit markdownlint config so the new job runs with the exact same rules locally and in CI. Existing docs were updated to pass them (blank lines around tables, consistent ordered-list numbering) instead of relaxing the rules.
- **`.claude/skills/README.md`:** install instructions for the three skills (symlink from a local portal clone, copy via `curl`, or pair with the MCP server). The skills themselves are now in proper `---`-frontmatter format, addressing the "make them installable" request.

### Docs

- **Rewrote `CLAUDE.md`** to match the post-v4.0.26 Supabase-first state (issue #30). Supabase is now documented as the single source of truth for components, docs, brand, architecture, AI instructions, changelog, and fundi; `registry.json` is described as a generated snapshot produced by `pnpm registry:sync` and verified in CI by `pnpm registry:verify`. Directory tree, API table, MCP tools list (18), and pre-commit gates all refreshed. Covered the new `/api/v1/{docs,changelog,fundi,search,ai/instructions,ui/[name]/docs,ui/[name]/versions}` endpoints and the `mukoko://ubuntu` resource.
- **Corrected the 3D frontend architecture description** in `CLAUDE.md` and `public/llms.txt` to match `get_layer_counts()` (issue #46): ten layers across **five** axes — X (L2/L3/L6/L7 composition), Y (L1 tokens / L4 safety / L5 resilience), Z (L8 assurance), Outside (L9 fundi), Documentation (L10). The previous "Outside = docs" / "Meta = templates" wording was wrong.
- **`README.md`:** fixed the MCP config example (`nyuchi-design-portal`, matching `.claude/settings.json`), expanded the tool table to all 18 MCP tools, and refreshed the `/api/v1/` endpoint table.
- **`CONTRIBUTING.md`, `.claude/skills/*`, `.github/pull_request_template.md`:** replaced `registry:build` references with the correct `registry:sync` / `registry:verify` flow and the Supabase-first component authoring steps.

### Security

- **`/security-review` follow-through (fundi edge function):** added Bearer-token auth on `POST /functions/v1/fundi/heal` matching either `SUPABASE_SERVICE_ROLE_KEY` or an optional `FUNDI_HEAL_TOKEN`; `/heal` now returns 401 without one. Also added a strict allowlist regex (`/^[a-z0-9._-]{1,40}$/i`) on the `scope` field at ingest plus a 200-char cap on `symptom`, so attacker-controlled values can't reach the GitHub label / issue-body sinks malformed.
- **CLAUDE.md §15 rule 22 (new policy):** security findings discovered in any review/audit (`/security-review`, manual, CodeQL, Dependabot, `pnpm audit`) must be fixed in the current PR — never deferred. Codified to prevent the "scope creep / file follow-up issue" pattern that leaves vulnerable code in `main`.
- **4 high + 1 moderate transitive CVEs cleared via `pnpm.overrides`** (caught by audit while applying the policy above): bumped `@xmldom/xmldom` floor to `^0.9.10` (xmldom GHSA-2v35-w6hq-6mfw, GHSA-f6ww-3ggp-fr8h, GHSA-x6wf-f3px-wcqx, GHSA-j759-j44w-7fr8 — XML injection / uncontrolled recursion via `nextra → mathjax → speech-rule-engine → @xmldom/xmldom`); added `uuid: "^14.0.0"` (GHSA-w5hq-g745-h8pq — missing buffer bounds check via `nextra → @theguild/remark-mermaid → mermaid → uuid`).
- Added `pnpm.overrides` for `hono` (→^4.12.14), `dompurify` (→^3.4.0), and `sanitize-html` (→^2.17.3) to clear three moderate CVEs that were blocking the Security Audit CI job and the local pre-commit `pnpm audit` gate. `pnpm audit --audit-level=moderate` now returns clean.
- **Workflow permissions hardening:** every job in `.github/workflows/ci.yml` now declares `permissions: contents: read` explicitly, and a top-level default does the same. Resolves six medium CodeQL `actions/missing-workflow-permissions` findings against `main`.
- **`robots.txt`:** removed the stale `/api/v1/db` `Disallow` (the route no longer exists) and expanded the explicit AI-crawler allow-list — `ClaudeBot`, `Claude-Web`, `anthropic-ai`, `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `Googlebot`, `Google-Extended`, `GoogleOther`, `PerplexityBot`, `Perplexity-User`, `FacebookBot`, `Meta-ExternalAgent`, `Meta-ExternalFetcher`, `Applebot`, `Applebot-Extended`, `CCBot`, `cohere-ai`, `Diffbot`, `DuckAssistBot`, `Bytespider`, `YouBot`, `Amazonbot`. The design system is built for AI consumption and the robots file now says so clearly.
- **`SECURITY.md` rewritten** with concrete response timelines, scoped surface, safe-harbour clause for good-faith security research, explicit out-of-scope items, and a reference to the live `/api/v1/changelog` endpoint instead of a hardcoded version.
- **`public/llms.txt` refactored** so every count and version points to a live API endpoint. No hardcoded registry totals remain — crawlers / agents are instructed to fetch `/api/v1/stats` for the authoritative numbers.

### Changed

- Applied latest patch/minor dependency upgrades per the upgrade-first policy: `next` 16.2.3 → 16.2.4, `typescript` 6.0.2 → 6.0.3, `vitest` 4.1.4 → 4.1.5, `tailwindcss` 4.2.2 → 4.2.4, `@supabase/supabase-js` 2.103.0 → 2.104.0, `@base-ui/react` 1.3.0 → 1.4.1, `typescript-eslint` 8.58.2 → 8.59.0, `pagefind` 1.5.0 → 1.5.2, plus prettier, eslint, postcss, autoprefixer, react-hook-form, shadcn CLI. `vite` / `@vitejs/plugin-react` remain pinned pending vitest@5.

## [4.0.26] - 2026-04-14

### Added

- **5 new Supabase tables** — `ai_instructions`, `documentation_pages`, `changelog`, `component_versions`, `fundi_issues`. Types, query functions, and upserts in `lib/db/{types,index}.ts`.
- **Design tokens via `nyuchi-tokens` component** — new `getDesignTokens()` reads tokens from `components.source_code` where `name='nyuchi-tokens'`. Replaces the legacy `brand_*` path.
- **11 new REST API v1 endpoints** — `/ui/[name]/docs`, `/ui/[name]/versions`, `/search`, `/docs`, `/docs/[slug]`, `/changelog`, `/changelog/[version]`, `/fundi`, `/fundi/[id]`, `/fundi/stats`, `/ai/instructions`, `/ai/instructions/[name]`.
- **Layer breakdown** in `/api/v1/stats` — counts of stable components grouped by `architecture_layer`.
- **6 new MCP tools** — `get_layer_summary`, `get_ai_instructions`, `get_component_links`, `get_changelog`, `get_component_versions`, `get_documentation_page`.
- **MCP system prompt loader** — `loadSystemPrompt()` reads the `nyuchi-mcp-system-prompt` row from `ai_instructions` with a 60s TTL cache and passes it via the server's `instructions` option.

### Fixed

- **#28 — `get_design_tokens`/`get_brand_info` broken tools** — now read from the migrated `nyuchi-tokens` payload (with `getBrandSystem()` fallback) instead of the empty legacy `brand_*` tables.
- **#28 — `scaffold_component` dep detection** — `inferDependencies()` treats `@/*`, `./`, `../` imports as local, so `lucide-react` is never surfaced when source uses `@/lib/icons`.
- **GHSA-q4gf-8mx6-v5v3** — bumped Next.js 16.2.2 → 16.2.3.

### Changed

- **Playground `ComponentGallery`** — split into server + client halves; reads from `getAllComponents()` instead of `registry.json`.
- **`/components/[name]` page** — reads metadata + source from Supabase instead of the filesystem.
- **MCP server version** — `4.0.1` → `4.0.26`; `createMukokoMcpServer()` is now async.
- **`__tests__/api/registry-route.test.ts`** — rewritten to mock the DB client and call the route handler directly (no more `registry.json` file-existence assertions).
- **CLAUDE.md, README.md, public/llms.txt, openapi.yaml, `.claude/skills/*`** — updated counts (294 → 545), version (4.0.1 → 4.0.26), architecture narrative (10-layer 3D model).

## [Unreleased-prior]

### Added

- **Architecture v4.0.1 alignment** — three sources of truth (Supabase, ScyllaDB, Web3 Pod), seven data layers, corrected CouchDB to sync protocol, added Cloudflare Edge layer
- **Brand hierarchy** — bundu ecosystem > nyuchi enterprise > mukoko consumer. 17 mini-apps, 4 substrate, 7 enterprise products, sister brands
- **Mukoko Manifesto integration** — four pillars, five Ubuntu questions, seven covenants, tri-mode (Musha/Basa/Nhaka)
- **Site-wide rebrand** — "nyuchi design portal" naming, design.nyuchi.com domain, all 100+ files updated
- **Nyuchi Design Portal** — full developer documentation portal (71 pages)
  - /docs — Getting started, installation, theming, dark mode, CLI, changelog
  - /components/[name] — Dynamic per-component documentation pages
  - /blocks — Dashboard, authentication, sidebar block documentation
  - /charts — 7 chart type guides with mineral-themed examples
  - /foundations — Accessibility, i18n, layout, typography, motion
  - /design — Token reference, icons
  - /content — Writing guidelines, error messages, inclusive language
  - /patterns — Dashboard, auth, mobile-first, resource layouts
  - /registry — Consuming, contributing, schema, MCP docs
- **DB-first architecture** — all API routes read from Supabase
  - 19 database tables (components, brand, architecture, blocks, portal_pages)
  - Zero hardcoded fallbacks — proper 503 when DB not configured
  - Seed script populates DB from lib/brand.ts and lib/architecture.ts
- **MCP server consolidation** — single URL-based server at /mcp
  - Removed duplicate stdio server in mcp/ directory
  - All data read from Supabase
- **87 new UI components** (82 → 169 total)
  - Chat & Messaging: chat-bubble, chat-list, chat-input, chat-layout, typing-indicator, message-thread, reaction-picker
  - AI & Chatbot: ai-chat, prompt-input, streaming-text, ai-feedback, ai-response-card, source-citation, suggested-prompts
  - Forms: phone-input, tag-input, date-range-picker, time-picker, rich-text-editor, code-editor, color-picker, address-input, transfer-list, number-input, mention-input, autocomplete
  - Data Display: tree-view, kanban-board, virtual-list, property-list, json-viewer, schema-viewer, description-list
  - User & Profile: user-card, avatar-group, profile-header, activity-feed, notification-list
  - E-commerce: product-card, price-display, cart-item, order-summary, payment-method-card, subscription-card, invoice-row
  - Calendar: calendar-week-view, calendar-day-view, event-card, time-slot-picker, agenda-view
  - Productivity: todo-item, checklist, note-card, comment-thread, drag-handle, mention-input
  - Developer: api-key-display, webhook-card, env-editor, code-tabs, code-block, endpoint-card, log-viewer
  - Security: permission-badge, role-selector, mfa-setup, session-list, audit-log-entry
  - Content: markdown-renderer, lightbox, video-player, audio-player, file-preview
  - Navigation: stepper, app-switcher, bottom-sheet, mega-menu
  - Layout: page-header, section-header, settings-layout, split-view, masonry-grid, sticky-bar, infinite-scroll, pull-to-refresh
  - Feedback: announcement-bar, cookie-consent, password-strength, onboarding-tour, changelog-entry, maintenance-page
- **70 chart example blocks** — area (10), bar (10), line (10), pie (11), radar (14), radial (6), tooltip (9)
- **35 page blocks** — dashboard, 5 login, 5 signup, 16 sidebar, profile-page, profile-settings, onboarding-flow, error-page, empty-state, notification-center, search-results, command-center
- **Updated header navigation** — Docs, Components, Blocks, Charts, Brand, Foundations, Patterns, Architecture

### Changed

- All API routes now require Supabase — return 503 with setup instructions if not configured
- global-error.tsx uses design system tokens instead of hardcoded hex colors
- Registry items: 94 → 294 (169 UI + 3 hooks + 11 lib + 70 chart blocks + 35 page blocks + 6 standard blocks)
- Updated all packages to latest versions including major bumps:
  - Recharts 2 → 3, Sonner 1 → 2, Zod 3 → 4, TypeScript 5 → 6
  - Lucide-react 0.x → 1.x, shadcn 2 → 4, @hookform/resolvers 3 → 5
  - react-resizable-panels 2 → 4, @vercel/analytics 1 → 2

### Removed

- mcp/ directory (duplicate stdio server package)
- Hardcoded fallback patterns in all API routes
- Filesystem reads (registry.json, fs.readFileSync) from API routes

## [4.0.1] - 2026-03-09

### Added

- **Brand documentation hub** replacing legacy assets.nyuchi.com
  - `/brand` — Ecosystem overview (bundu, nyuchi, mukoko, shamwari, nhimbe)
  - `/brand/colors` — Five African Minerals palette with interactive swatches
  - `/brand/components` — Component visual specifications
  - `/brand/guidelines` — Typography, spacing, accessibility, voice & tone
- **Brand API** at `GET /api/brand` — complete brand system as JSON (v4.0.1)
- **Brand data module** (`lib/brand.ts`) — single source of truth for all brand data
- **Brand components** — ColorSwatch, TokenTable, MineralStrip, BrandCard, TypeScale, SpacingScale
- **Skeleton loading states** for brand pages
- **Test infrastructure** — Vitest with 67 tests across 6 test files
  - Brand data integrity tests (minerals, ecosystem, accessibility)
  - API route tests (brand API, registry validation)
  - Component rendering tests (BrandCard, MineralStrip, ColorSwatch, etc.)
  - Navigation tests (header links)
- **GitHub Actions CI** — lint, typecheck, test, build on PRs and pushes
- **GitHub Actions Claude Review** — AI code review on every PR using `anthropics/claude-code-action@v1`
- **GitHub Actions Release** — automated releases on version tags
- **ESLint configuration** — flat config (`eslint.config.mjs`) with typescript-eslint
- **Repository documentation** — README, CONTRIBUTING, SECURITY, CHANGELOG, issue templates

### Changed

- Header navigation — added "Brand" link
- Footer — added Brand section links, bumped version to v4.0.1
- Wordmark sizing — increased from `text-sm` to `text-xl` to match icon height
- Package name — `my-project` → `design-portal`
- Package version — `0.1.0` → `4.0.1`
- CLAUDE.md — comprehensive update with testing, CI/CD, versioning, brand documentation sections

### Design Standards

- Touch targets: 48px minimum (up from 44px)
- Accessibility: APCA 3.0 AAA (replacing WCAG AAA 7:1)
- Mineral strip replaces the legacy flag strip
- Noto Sans (not Plus Jakarta Sans) as the canonical body font

## [6.0.0] - Prior

Legacy version served from assets.nyuchi.com. Brand documentation only, no component registry.
