# Changelog

All notable changes to the Nyuchi Design Portal are documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
