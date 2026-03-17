# mukoko registry

> The component registry and brand documentation hub for the mukoko ecosystem.

[![CI](https://github.com/nyuchitech/mukoko-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/nyuchitech/mukoko-registry/actions/workflows/ci.yml)

**Version:** 7.0.0 | **Live:** [registry.mukoko.com](https://registry.mukoko.com) | **Brand:** [registry.mukoko.com/brand](https://registry.mukoko.com/brand)

## What is this?

mukoko registry serves 94 production-ready registry items (82 UI components, 3 hooks, 9 lib utilities) built on the **Five African Minerals** design system. Install any component with a single command:

```bash
npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/button
```

It also hosts the complete brand documentation for the mukoko ecosystem — colors, typography, spacing, accessibility guidelines, and the brand API.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nyuchitech/mukoko-registry.git
cd mukoko-registry

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the registry.

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run test suite (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm registry:build` | Generate static registry JSON |

## Five African Minerals

The design system is built on five colors, each named after an African mineral:

| Mineral | Hex | Usage |
|---|---|---|
| Cobalt | `#0047AB` | Primary blue, links, CTAs |
| Tanzanite | `#B388FF` | Purple accent, brand/logo |
| Malachite | `#64FFDA` | Success states, positive actions |
| Gold | `#FFD740` | Achievements, rewards, highlights |
| Terracotta | `#D4A574` | Community features, warmth |

## Architecture

```
registry.mukoko.com
├── /                    Landing page with component catalog
├── /brand               Brand documentation hub
│   ├── /brand/colors    Five African Minerals palette
│   ├── /brand/components  Component visual specs
│   └── /brand/guidelines  Typography, accessibility, usage rules
├── /api/r               Component registry API (shadcn compatible)
├── /api/r/[name]        Individual component source
└── /api/brand           Brand system JSON (v7.0.0)
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + CSS custom properties
- **Components:** Radix UI + CVA + cn()
- **Testing:** Vitest + Testing Library
- **CI/CD:** GitHub Actions + Vercel
- **Package Manager:** pnpm

## Ecosystem

mukoko registry is consumed by all apps in the mukoko ecosystem:

| App | URL |
|---|---|
| mukoko weather | [weather.mukoko.com](https://weather.mukoko.com) |
| mukoko news | [news.mukoko.com](https://news.mukoko.com) |
| nhimbe | [nhimbe.com](https://nhimbe.com) |
| lingo | [lingo.mukoko.com](https://lingo.mukoko.com) |
| bundu | [bundu.family](https://bundu.family) |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## Security

See [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## License

Copyright Nyuchi Africa (PVT) Ltd. All rights reserved.
