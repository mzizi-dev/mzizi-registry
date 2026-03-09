# CLAUDE.md — Mukoko Registry

## Project Overview

Mukoko Registry is a component registry serving 70+ production-ready React UI components built on the **Five African Minerals** design system. Components are installable via the shadcn CLI:

```
npx shadcn@latest add https://registry.mukoko.com/api/r/<component>
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7 (strict mode)
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS 4 + CSS custom properties
- **Component Primitives**: Radix UI + Base UI
- **Variant Management**: class-variance-authority (CVA)
- **Deployment**: Vercel

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm start            # Start production server
pnpm registry:build   # Generate static registry JSON files into public/r/
```

## Directory Structure

```
app/                    Next.js App Router
  api/r/                Registry API routes
    route.ts            GET /api/r — registry index
    [name]/route.ts     GET /api/r/[name] — individual component
  layout.tsx            Root layout (fonts, ThemeProvider)
  page.tsx              Landing page
  globals.css           Theme tokens + Tailwind imports
components/
  brand/                Brand assets (mukoko-logo.tsx)
  landing/              Landing page sections (header, hero, install-steps, etc.)
  ui/                   70+ shadcn-style UI components
hooks/                  Custom hooks (use-toast.ts, use-mobile.ts)
lib/
  utils.ts              cn() utility (clsx + tailwind-merge)
scripts/
  build-registry.js     Static registry builder
registry.json           Component registry manifest (source of truth)
components.json         shadcn CLI configuration
```

## Architecture

### Registry System

`registry.json` is the manifest defining all components with their metadata, dependencies, and file paths. Components are served two ways:

1. **Dynamic API** (`app/api/r/`): Reads registry.json at runtime, serves component source with CORS headers and 1-hour cache
2. **Static build** (`scripts/build-registry.js`): Generates JSON files into `public/r/` for CDN serving

### Component Patterns

- All UI components live in `components/ui/` and follow shadcn conventions
- Use CVA for variant definitions, Radix `Slot` for polymorphic rendering
- Class composition via `cn()` from `lib/utils.ts`
- Components are React Server Components by default; add `"use client"` only when needed

### Theming

Uses `next-themes` with CSS custom properties. Two modes: light (warm cream #FAF9F5) and dark (deep #0A0A0A).

**Five African Minerals palette**:
- Cobalt: `#0047AB` — primary blue
- Tanzanite: `#B388FF` — purple accent
- Malachite: `#64FFDA` — cyan accent
- Gold: `#FFD740` — yellow accent
- Terracotta: `#D4A574` — warm accent

**Typography**: Noto Sans (body), Noto Serif (headings), JetBrains Mono (code)

## Conventions

### Code Style

- Path alias: `@/*` maps to project root (e.g., `import { cn } from "@/lib/utils"`)
- shadcn "new-york" style with neutral base color
- Tailwind utility classes; avoid inline styles
- TypeScript strict mode — maintain type safety

### Adding a New Component

1. Create the component file in `components/ui/`
2. Add an entry to `registry.json` with name, type, description, dependencies, and files
3. Run `pnpm registry:build` to regenerate static files
4. The dynamic API picks up changes from registry.json automatically

### When Modifying Components

- Preserve the existing CVA variant pattern
- Keep Radix UI accessibility primitives intact
- Use `cn()` for all className composition
- Don't break the registry.json schema — it follows `https://ui.shadcn.com/schema/registry.json`

## Notable Configuration

- `next.config.mjs` has `typescript.ignoreBuildErrors: true` — TS errors won't fail the build
- Images are unoptimized (`images.unoptimized: true`)
- `radix-ui` is in `transpilePackages`
- No test framework is configured
- No CI/CD workflows — deployment is via Vercel
