# Changelog

All notable changes to the Nyuchi Design Portal are documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Security — raise five dependency override floors past new advisories (2026-09-30)

- `pnpm audit --audit-level=moderate` (the pre-commit hook and the required Security Audit check) failed on advisories published after the last green run: `brace-expansion` (uncontrolled recursion and quadratic expansion; reached through `@opennextjs/cloudflare`), `fast-uri` (inconsistent host case; through `shadcn`) and `ip-address` (subnet comparison and parse diagnostics; through `mongodb`). The `pnpm.overrides` floors move to the patched versions: `brace-expansion` `^5.0.12` (and `minimatch>brace-expansion`), `minimatch@8>brace-expansion` `^2.1.7`, `fast-uri` `^3.1.8` and `ip-address` `^10.7.1`. The lockfile is regenerated. No direct dependency changes.

### Fixed — the public Claude Code plugin loads, and ships only what it should (2026-09-30)

- **The plugin manifest failed validation, so the plugin could not load.** `claude plugin validate` rejected `repository` (an object; it must be a string) and the MCP entry's `"type": "url"` (not a transport). The MCP entry is now `{ "type": "http", "url": "https://mcp.mzizi.dev/mcp" }`, and the fields Claude Code ignores (`icons`, `permissions`, `$schema`) are gone.
- **The plugin moves from the repo root to `plugin/`.** Claude Code always loads `.mcp.json` at a plugin's root and the manifest cannot exclude it, so a root-level plugin would have configured this repo's developer `shadcn` MCP for every user. The manifest is now `plugin/.claude-plugin/plugin.json` (version 1.2.0), the skills are `plugin/skills/`, and `.claude-plugin/marketplace.json` points at `./plugin`. The install lines do not change: `/plugin marketplace add mzizi-dev/mzizi-registry`, then `/plugin install mzizi@mzizi`. Installed from the branch, the plugin registers five skills and one MCP server (`mzizi`), with no hooks or agents.
- **Breaking** for anything that read `.claude-plugin/plugin.json` or `skills/` at the repo root: they are now under `plugin/`.

### Changed — agent skills 0.8.1 (2026-09-30)

- **`@nyuchi/mzizi-skills` `^0.8.1`** (lockfile 0.8.1). `lib/skills.generated.ts` and `plugin/skills/` are regenerated. 0.8.1 changes only `mzizi-roots`'s plugin install lines.
- **Each skill's `source` is `mzizi-dev/agent-tools/mzizi-skills/…`**, not `mzizi-tools/mzizi-skills/…` (the repository's old name). `/v1/skills` and `/v1/skills/{name}` return the new value.
- **`openapi.yaml`:** the `/skills` routes no longer describe a `nyuchi-design skills` CLI subcommand, which does not exist, and the example skill name is `mzizi-design`.
- **The N12 skills rung** (`/v1/architecture`) now describes what is true: no database copy, the generators and their `--check` gates, `mzizi_get_skills`, the working install lines and the public plugin. It used to describe a Supabase `skills` collection, `get_skill` / `list_skills`, `pnpm skills:sync` and `npx skills add`.

### Changed — Mzizi is named as the registry's operator (2026-09-29)

- **README, `NOTICE` and the Claude Code plugin manifest no longer say Nyuchi operates or develops Mzizi.** Mzizi owns and operates the registry, the design system and the API; the Bundu Foundation is the copyright holder; Nyuchi operates only the Mzizi console and the revenue products. The `NOTICE` copyright line is unchanged.

### Changed — search reads the fields items have; file-backed routes serve their files (2026-09-29)

- **`/api/v1/search` filters on `node` and `categories`, and returns `type`.** It used to filter on `layer` and `category` and project `registry_type` — the retired database row's field names, which no registry item carries — so those filters matched nothing and every hit was a bare name and description. Hits now carry `name`, `type`, `title`, `description`, `categories`, `node` and `nodeLabel`, and `meta` reports `node` instead of `layer`. Parameters combine (AND).
- **`?layer=` is deprecated.** It still works, as an alias of `?node=`, so older clients keep their results; a response to it carries `meta.deprecation` and a `Deprecation: true` header. It will be removed.
- **`/api/v1/ui/{name}/docs` and `/api/v1/ai/instructions/{name}` serve their files** instead of `503 Database not configured`, with the shapes they had before the Supabase removal. This is what `api.mzizi.dev` (mzizi-dev/mzizi-api-gateway) already serves.
- **`/api/v1/ui/{name}/versions`** still answers `503`, and now says why: version history is console-owned data, and this API has no database.
- **The discovery document and `openapi.yaml` stop describing a database.** `database: { status: "not_configured", components: 0 }` is replaced by `data: { source: "files", repository, components }` with the live count; the "operated and developed by Nyuchi" and "All data routes read from Supabase" lines are gone; Mzizi is named as the operator and the Bundu Foundation as the project's home. The schemas for docs, search and AI instructions now match their handlers, and no file-backed route lists a `503` any more.

### Changed — `nyuchi-*` components are now `mzizi-*` (2026-09-27)

- **All 123 `nyuchi-*` registry components are renamed `mzizi-*`.** Mzizi owns the registry, and Nyuchi operates it. The full old → new list is in `lib/component-renames.json`. Install them under the new name, for example `npx shadcn@latest add https://api.mzizi.dev/v1/ui/mzizi-footer` (previously `.../nyuchi-footer`).
- **Exported names follow the rename:** `Nyuchi*` → `Mzizi*`, `useNyuchiHarness` / `useNyuchiQuery` → `useMziziHarness` / `useMziziQuery`, the `nyuchi*Dark` / `nyuchi*Light` token constants → `mzizi*`, and the Rust modules `nyuchi_*` → `mzizi_*`.
  - `data-slot` and `data-portal` values change with them.
  - The earlier `mzizi-*` safety, resilience and assurance components are covered too; they still exported `Nyuchi*` names with `nyuchi-*` slots.
- **Old URLs keep working.** Every old URL form 308-redirects to the new slug on `mzizi.dev` and on the `api.mzizi.dev` Worker. That covers `/components`, `/source`, `/playground`, `/changelog`, `/api/v1/ui` (with `/docs` and `/versions`), `/api/v1/rs`, `/api/health`, `/api/chaos`, and the `/v1/*` API shape. Existing links and `shadcn add` commands still resolve.
  - The MCP `get_component` tool also accepts an old name.
- **Version history keeps its data.** `component_versions` is read under both the old and new names. A forward data migration, `supabase/data-migrations/20260927_rename_nyuchi_components_to_mzizi.sql`, moves the rows to the new names; it can be applied before or after deploy.
- **Unchanged:** npm package names and scopes (`@nyuchi/*`, `@bundu/*`), the Kotlin package `com.nyuchi.design.tokens`, CSS animation and keyframe names (`nyuchi-fade-slide-up`, …), `NyuchiLogo`, the AI-instruction document slugs, database names, and telemetry rows recorded under the old names.

### Changed — skills move to `nyuchi/mzizi-tools`

- **The `skills` Supabase collection is now read-only from this repo.** Skill content is authored in git as `mzizi-skills/skills/<name>/SKILL.md` in `nyuchi/mzizi-tools`, published as the public npm package `@nyuchi/mzizi-skills`, and projected into the collection by that repo's `pnpm skills:sync`. The portal continues to serve it at `/api/v1/skills*` and via MCP `get_skill` / `list_skills` — it just never writes it. Documented in `CLAUDE.md` §15.23 (which previously asserted the opposite), §6.1, §3, and the `SkillRow` doc comment in `lib/db/types.ts`.

### Removed

- **`scripts/sync-skills.ts` and the `skills:sync` / `skills:verify` scripts.** The script was doubly broken: it wrote to `packages/design-agent-skills/skills/<name>.md`, a directory that left this repo when that package moved to `mzizi-tools` (so `skills:sync` could only throw `ENOENT` and `skills:verify` reported permanent drift), and it pulled **DB → disk** while `mzizi-tools`' `sync-skills.mjs` pushes **disk → DB**. Two writers aimed at one collection from opposite ends meant whichever ran last silently reverted the other — the mechanism behind the drift found across the skill bodies.
- **The three duplicated skill files** — `.claude/skills/{nyuchi-design-system,ecosystem-app-setup,scaffold-component}.md`. All were copies of registry rows and all had drifted: `nyuchi-design-system` is superseded by the bundle's `nyuchi-design` and still taught the retired L1–L10 "3D architecture" axes; `ecosystem-app-setup` pointed at `npx @nyuchi/design-cli init` (a command that never shipped, under a package name that no longer exists) and `nyuchi/design-agent-skills`; `scaffold-component` was a stale fork of a row already updated to the node model. Their content lives on, corrected, in `@nyuchi/mzizi-skills`. `.claude/skills/README.md` now explains where the skills went and how to install them; the directory remains available for skills specific to working on the portal codebase.
- **The npm publish step in `release.yml`.** It ran `pnpm --filter @nyuchi/design-agent-skills publish` and `--filter @nyuchi/design-cli publish` on every version tag. With no `packages/` tree those filters matched nothing, so the step was a silent no-op — and had it ever matched, it would have republished the very names `mzizi-tools` deprecates in favour of `@nyuchi/mzizi-skills` and `@nyuchi/mzizi-cli`. This repo deploys to Vercel and publishes nothing to npm.
- **The broken `skills` array in `.claude-plugin/plugin.json`**, whose three paths under `./packages/design-agent-skills/skills/` did not exist. The skills ship with the `mzizi` plugin in `mzizi-tools`, which symlinks the bundle; this repo's plugin contributes the MCP server registration. Its description also claimed "Five African Minerals" (there are seven) and the retired "open 3D frontend architecture" (it is the DNA double helix).

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
