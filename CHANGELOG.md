# Changelog

All notable changes to the mukoko registry are documented here.

This project follows [Semantic Versioning](https://semver.org/).

## [7.0.0] - 2026-03-09

### Added
- **Brand documentation hub** replacing legacy assets.nyuchi.com
  - `/brand` — Ecosystem overview (bundu, nyuchi, mukoko, shamwari, nhimbe)
  - `/brand/colors` — Five African Minerals palette with interactive swatches
  - `/brand/components` — Component visual specifications
  - `/brand/guidelines` — Typography, spacing, accessibility, voice & tone
- **Brand API** at `GET /api/brand` — complete brand system as JSON (v7.0.0)
- **Brand data module** (`lib/brand.ts`) — single source of truth for all brand data
- **Brand components** — ColorSwatch, TokenTable, MineralStrip, BrandCard, TypeScale, SpacingScale
- **Skeleton loading states** for brand pages
- **Test infrastructure** — Vitest with 67 tests across 6 test files
  - Brand data integrity tests (minerals, ecosystem, accessibility)
  - API route tests (brand API, registry validation)
  - Component rendering tests (BrandCard, MineralStrip, ColorSwatch, etc.)
  - Navigation tests (header links)
- **GitHub Actions CI** — lint, typecheck, test, build on PRs and pushes
- **GitHub Actions Release** — automated releases on version tags
- **Repository documentation** — README, CONTRIBUTING, SECURITY, CHANGELOG, issue templates

### Changed
- Header navigation — added "Brand" link
- Footer — added Brand section links, bumped version to v7.0.0
- Wordmark sizing — increased from `text-sm` to `text-xl` to match icon height
- Package name — `my-project` → `mukoko-registry`
- Package version — `0.1.0` → `7.0.0`
- CLAUDE.md — comprehensive update with testing, CI/CD, versioning, brand documentation sections

### Design Standards
- Touch targets: 48px minimum (up from 44px)
- Accessibility: APCA 3.0 AAA (replacing WCAG AAA 7:1)
- Mineral strip replaces the legacy flag strip
- Noto Sans (not Plus Jakarta Sans) as the canonical body font

## [6.0.0] - Prior

Legacy version served from assets.nyuchi.com. Brand documentation only, no component registry.
