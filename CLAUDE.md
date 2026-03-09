# CLAUDE.md — Mukoko Registry

> **Canonical design system for the Mukoko ecosystem.**
> This file is the definitive reference for AI assistants working on this codebase.
> It also serves as the template for CLAUDE.md files across all Mukoko and Nyuchi repositories.

---

## 1. Project Identity

**Mukoko Registry** is the component registry and design system hub for the Mukoko ecosystem. It serves 70+ production-ready React UI components built on the **Five African Minerals** design system, installable via the shadcn CLI:

```
npx shadcn@latest add https://registry.mukoko.com/api/r/<component>
```

**Live at:** registry.mukoko.com

**Organization:** Nyuchi Africa (PVT) Ltd — `github.com/nyuchitech`

**Ecosystem context:** This registry is consumed by all Mukoko apps (weather, news, events, the super app) and any new app built under the Nyuchi/Mukoko brand. It is the single source of truth for the design system.

---

## 2. Ecosystem Overview

Mukoko Registry exists within a broader ecosystem. Understanding the relationships prevents duplicate work and ensures consistency.

| Repository | Purpose | Stack | Status |
|---|---|---|---|
| **mukoko-registry** (this repo) | Component registry + design system hub | Next.js 16, Tailwind 4, Radix UI | Canonical, active |
| **mukoko-weather** | AI weather intelligence platform | Next.js 16, FastAPI, MongoDB, Claude AI | Production |
| **mukoko-news** | Pan-African news aggregator | Next.js 15, Cloudflare Workers, Hono, D1 | Active |
| **mukoko** | Super app (6 ecosystem apps) | Flutter shell, Preact mini-apps, Turborepo | Active |
| **nhimbe** | Events platform | Next.js, TypeScript | Active |
| **shamwari-ai** | Localized African AI model | Python | Research |
| **nyuchi-main** | Core platform + API + marketing | Next.js, Cloudflare Workers | Active |
| **learning** | Digital learning experiences | Astro | Active |

### Design System Flow

```
mukoko-registry (this repo)
    │
    ├── Defines: Five African Minerals palette, typography, component API
    ├── Serves: 70+ components via shadcn CLI / API / static JSON
    │
    └── Consumed by:
        ├── mukoko-weather  (weather.mukoko.com)
        ├── mukoko-news     (news.mukoko.com)
        ├── mukoko super app (*.mukoko.com)
        ├── nhimbe          (events.mukoko.com)
        └── Any new Mukoko app
```

**Rule:** When building a new app, install components from this registry. Do not copy-paste component code or create parallel component libraries.

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript (strict mode) | 5.7.3 |
| Package Manager | pnpm | — |
| Styling | Tailwind CSS + CSS custom properties | 4.2.0 |
| Component Primitives | Radix UI + Base UI | radix-ui 1.4.3, @base-ui/react 1.0.0 |
| Variant Management | class-variance-authority (CVA) | 0.7.1 |
| Class Composition | clsx + tailwind-merge | via `cn()` in `lib/utils.ts` |
| Icons | Lucide React | 0.564.0 |
| Theming | next-themes | 0.4.6 |
| Forms | react-hook-form + zod | 7.54.1 / 3.24.1 |
| Charts | Recharts | 2.15.0 |
| Deployment | Vercel | — |

---

## 4. Commands

```bash
pnpm dev              # Start dev server (Next.js)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm start            # Start production server
pnpm registry:build   # Generate static registry JSON files into public/r/
```

---

## 5. Directory Structure

```
mukoko-registry/
├── app/                          # Next.js App Router
│   ├── api/r/                    # Registry API routes
│   │   ├── route.ts              # GET /api/r — registry index
│   │   └── [name]/route.ts       # GET /api/r/[name] — individual component
│   ├── layout.tsx                # Root layout (fonts, ThemeProvider)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Theme tokens + Tailwind imports (SOURCE OF TRUTH)
│   ├── error.tsx                 # Route-level error boundary
│   ├── global-error.tsx          # Global error handler
│   └── not-found.tsx             # 404 page
├── components/
│   ├── brand/                    # Brand assets
│   │   └── mukoko-logo.tsx       # Official beehive logo with wordmark
│   ├── landing/                  # Landing page sections
│   │   ├── header.tsx            # Navigation with theme toggle
│   │   ├── hero.tsx              # Hero with mineral color showcase
│   │   ├── install-steps.tsx     # 3-step installation guide
│   │   ├── component-showcase.tsx
│   │   ├── component-catalog.tsx # Searchable catalog with categories
│   │   └── footer.tsx
│   ├── ui/                       # 70+ shadcn-style UI components
│   │   ├── button.tsx            # CVA variants, Slot polymorphism
│   │   ├── card.tsx, dialog.tsx, input.tsx, ...
│   │   └── [70+ component files]
│   ├── theme-provider.tsx        # next-themes wrapper
│   └── theme-toggle.tsx          # Light/dark mode toggle
├── hooks/
│   ├── use-toast.ts              # Toast notification state (reducer pattern)
│   └── use-mobile.ts             # Mobile breakpoint detection (768px)
├── lib/
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
├── scripts/
│   └── build-registry.js         # Static registry builder → public/r/
├── public/
│   ├── r/                        # Generated static registry JSON (gitignored)
│   └── icons/                    # Favicon assets
├── registry.json                 # Component registry manifest (SOURCE OF TRUTH)
├── components.json               # shadcn CLI configuration
├── next.config.mjs               # Next.js config
├── tsconfig.json                 # TypeScript config (strict, path aliases)
├── postcss.config.mjs            # PostCSS with @tailwindcss/postcss
└── package.json                  # Dependencies and scripts
```

---

## 6. Architecture

### 6.1 Registry System

`registry.json` is the manifest defining all 70+ components with metadata, dependencies, and file paths. It follows the schema at `https://ui.shadcn.com/schema/registry.json`.

Components are served two ways:

1. **Dynamic API** (`app/api/r/`): Reads `registry.json` at runtime, inlines component source code, serves with CORS headers and 1-hour cache
2. **Static build** (`scripts/build-registry.js`): Pre-generates JSON files into `public/r/` for CDN serving

**Registry item schema:**
```json
{
  "name": "button",
  "type": "registry:ui",
  "description": "Displays a button or a component that looks like a button.",
  "dependencies": ["radix-ui", "class-variance-authority"],
  "registryDependencies": ["other-component-names"],
  "files": [
    { "path": "components/ui/button.tsx", "type": "registry:ui" }
  ]
}
```

**Item types:** `registry:ui` (components), `registry:hook` (hooks), `registry:lib` (utilities)

### 6.2 Layered Component Architecture

Every component follows a layered pattern. This is mandatory for all Mukoko apps consuming this registry.

```
Layer 1: Shared primitives (Button, Input, Card, Badge, etc.)
    ↓ imported by
Layer 2: Domain-specific composites (landing sections, feature components)
    ↓ imported by
Layer 3: Page orchestrators (compose sections into full pages)
    ↓ wrapped with
Layer 4: Error boundaries + loading states (per-section isolation)
    ↓ rendered by
Layer 5: Server page wrappers (page.tsx — SEO, data, layout)
```

**Rules:**
- Components import from the layer below, never sideways or upward
- Each component is a standalone file
- Page orchestrators NEVER hardcode rendering logic — they compose imported components
- All colors and styles come from CSS custom properties in `globals.css`

### 6.3 Component Patterns

All UI components in `components/ui/` follow these patterns:

**CVA variant pattern** (example: `button.tsx`):
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center ...", // base classes
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ...",
        outline: "border-border bg-input/30 ...",
        // ...
      },
      size: {
        default: "h-9 gap-1.5 px-3",
        sm: "h-8 gap-1 px-3",
        // ...
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

**Polymorphic rendering with Slot:**
```typescript
function Button({ asChild = false, ...props }) {
  const Comp = asChild ? Slot.Root : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
```

**Data attributes for component identification:**
- `data-slot="button"` — component identification
- `data-variant={variant}` — active variant
- `data-size={size}` — active size

**Server vs Client components:**
- Components are React Server Components by default
- Add `"use client"` only when the component uses hooks, event handlers, or browser APIs
- The `ThemeProvider` and interactive components require `"use client"`

### 6.4 Error Handling

Three layers of error isolation:

1. **Component-level:** Try/catch in data processing, graceful fallbacks
2. **Route-level:** `app/error.tsx` catches route errors
3. **Global:** `app/global-error.tsx` as last resort

**API error handling:**
- Registry API returns proper HTTP status codes (400, 404, 500)
- File read errors are logged but don't crash the response — missing files are skipped
- All errors logged with `[mukoko]` prefix for grep-ability

---

## 7. Five African Minerals Design System

This is the canonical design system. All Mukoko apps MUST use these tokens.

### 7.1 Color Palette

**Mineral accent colors** (constant across light/dark):
| Mineral | Hex | CSS Variable | Usage |
|---|---|---|---|
| Cobalt | `#0047AB` | `--color-cobalt` | Primary blue, links, CTAs |
| Tanzanite | `#B388FF` | `--color-tanzanite` | Purple accent, brand/logo |
| Malachite | `#64FFDA` | `--color-malachite` | Cyan accent, success states |
| Gold | `#FFD740` | `--color-gold` | Yellow accent, rewards/highlights |
| Terracotta | `#D4A574` | `--color-terracotta` | Warm accent, community |

**Semantic color tokens** (theme-adaptive via CSS custom properties):
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `#FAF9F5` (warm cream) | `#0A0A0A` (deep night) | Page background |
| `--foreground` | `#141413` | `#F5F5F4` | Primary text |
| `--card` | `#FFFFFF` | `#141414` | Card surfaces |
| `--muted` | `#F3F2EE` | `#1E1E1E` | Subdued backgrounds |
| `--muted-foreground` | `#5C5B58` | `#9A9A95` | Secondary text |
| `--border` | `rgba(10,10,10,0.08)` | `rgba(255,255,255,0.08)` | Borders |
| `--primary` | `#141413` | `#F5F5F4` | Primary interactive |
| `--destructive` | `#B3261E` | `#F2B8B5` | Error/danger |

**Chart colors** (theme-adaptive):
| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `#4B0082` | `#B388FF` (Tanzanite) |
| `--chart-2` | `#0047AB` | `#00B0FF` (Cobalt) |
| `--chart-3` | `#004D40` | `#64FFDA` (Malachite) |
| `--chart-4` | `#5D4037` | `#FFD740` (Gold) |
| `--chart-5` | `#8B4513` | `#D4A574` (Terracotta) |

**Category-to-mineral mapping** (for apps with activity categories):
| Category | Mineral | Tailwind classes |
|---|---|---|
| Farming | Malachite | `bg-mineral-malachite`, `text-mineral-malachite` |
| Mining | Terracotta | `bg-mineral-terracotta`, `text-mineral-terracotta` |
| Travel | Cobalt | `bg-mineral-cobalt`, `text-mineral-cobalt` |
| Tourism | Tanzanite | `bg-mineral-tanzanite`, `text-mineral-tanzanite` |
| Sports | Gold | `bg-mineral-gold`, `text-mineral-gold` |

### 7.2 Typography

| Role | Font | CSS Variable | Usage |
|---|---|---|---|
| Body | Noto Sans | `--font-sans` | All body text, UI labels |
| Display/Headings | Noto Serif | `--font-serif` | Page titles, hero text |
| Code | JetBrains Mono | `--font-mono` | Code blocks, terminal |

Noto Sans chosen for broad language support (African languages, diacritics).

All brand wordmarks are **lowercase**: `mukoko`, `nyuchi`, `shamwari`.

### 7.3 Theme Implementation

- `next-themes` with `attribute="class"` and `defaultTheme="system"`
- CSS custom properties defined in `app/globals.css` under `:root` (light) and `.dark` (dark)
- Tailwind CSS 4 `@theme inline` block registers all tokens for utility class generation
- `@custom-variant dark (&:is(.dark *))` enables dark mode variant

### 7.4 Styling Rules

1. **NEVER use hardcoded hex colors, rgba(), or inline `style={{}}`** — use Tailwind classes backed by CSS custom properties
2. All new color tokens MUST be added to `globals.css` in both `:root` and `.dark` blocks AND registered in the `@theme` block
3. Use `cn()` from `@/lib/utils` for all className composition — never string concatenation
4. Use `CATEGORY_STYLES` objects for category-specific styling — never construct dynamic Tailwind class names
5. Border radius uses the `--radius` token system (`radius-sm` through `radius-4xl`)

**Exceptions to the no-inline-styles rule:**
- `next/og` (Satori) routes — canvas renderer, no CSS custom property support
- Three.js/WebGL — requires raw hex for materials and shaders
- SVG components where Tailwind classes don't apply

### 7.5 Radius System

```
--radius: 0.75rem (base)
--radius-sm: calc(var(--radius) - 4px)
--radius-md: calc(var(--radius) - 2px)
--radius-lg: var(--radius)
--radius-xl: calc(var(--radius) + 4px)
--radius-2xl: calc(var(--radius) + 8px)
```

---

## 8. Conventions

### 8.1 Code Style

- **Path alias:** `@/*` maps to project root (e.g., `import { cn } from "@/lib/utils"`)
- **shadcn style:** "new-york" with neutral base color
- **Tailwind utility classes only** — no inline styles, no CSS modules (except embed widgets)
- **TypeScript strict mode** — maintain type safety, no `any` without justification
- **Exports:** Named exports for components (`export { Button, buttonVariants }`), not default exports
- **File naming:** kebab-case for files (`button-group.tsx`), PascalCase for components (`ButtonGroup`)

### 8.2 Component Requirements

Every component in `components/ui/` MUST have:

1. **Accessibility** — ARIA attributes where needed, semantic HTML, keyboard navigation via Radix primitives
2. **Global styles only** — Tailwind classes backed by CSS custom properties from `globals.css`
3. **`cn()` composition** — all className props composed through `cn()`
4. **CVA variants** — use class-variance-authority for any component with visual variants
5. **Radix primitives** — use Radix UI for accessible behavior (focus management, keyboard nav, screen readers)
6. **`data-slot` attribute** — for component identification in CSS selectors

### 8.3 Adding a New Component

1. Create the component file in `components/ui/`
2. Follow the CVA + Radix + cn() pattern (see `button.tsx` as reference)
3. Add an entry to `registry.json` with: `name`, `type`, `description`, `dependencies`, `registryDependencies`, `files`
4. Run `pnpm registry:build` to regenerate static files
5. The dynamic API picks up changes from `registry.json` automatically
6. Verify with: `curl http://localhost:3000/api/r/<component-name>`

### 8.4 Modifying Existing Components

- Preserve the existing CVA variant pattern — add variants, don't restructure
- Keep Radix UI accessibility primitives intact
- Don't break the registry.json schema — it follows `https://ui.shadcn.com/schema/registry.json`
- Test that the component still serves correctly via the API

### 8.5 When Building a New Mukoko App

This registry is the template. New apps MUST:

1. **Install components from this registry** via `npx shadcn@latest add https://registry.mukoko.com/api/r/<component>`
2. **Copy `globals.css` theme tokens** — the `:root`, `.dark`, and `@theme` blocks are the canonical design system
3. **Use the same typography stack** — Noto Sans, Noto Serif, JetBrains Mono
4. **Follow the layered architecture** — primitives → composites → orchestrators → error boundaries → server pages
5. **Use `cn()` for class composition** — install `clsx` + `tailwind-merge`, create `lib/utils.ts`
6. **Set up `next-themes`** with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
7. **Use Tailwind CSS 4** with `@tailwindcss/postcss` and the `@theme inline` block pattern
8. **Follow the `components.json` configuration** for shadcn CLI compatibility

### 8.6 registry.json Schema Reference

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "mukoko",
  "homepage": "https://registry.mukoko.com",
  "items": [
    {
      "name": "component-name",
      "type": "registry:ui | registry:hook | registry:lib",
      "description": "One-line description of the component.",
      "dependencies": ["npm-package-names"],
      "registryDependencies": ["other-registry-component-names"],
      "files": [
        {
          "path": "components/ui/component-name.tsx",
          "type": "registry:ui"
        }
      ]
    }
  ]
}
```

---

## 9. API Reference

### GET /api/r

Returns the full registry index with all component metadata.

**Response:** shadcn registry schema with `$schema`, `name`, `homepage`, `items[]`

**Headers:** `Cache-Control: public, max-age=3600, s-maxage=86400`, `Access-Control-Allow-Origin: *`

### GET /api/r/[name]

Returns a single component with inline source code.

**Response:** shadcn registry-item schema with `$schema`, `name`, `type`, `description`, `dependencies`, `registryDependencies`, `files[]` (each file includes `content` with full source)

**Error responses:** 400 (invalid name), 404 (not found), 500 (server error)

---

## 10. Component Categories

The 70+ components are organized by function:

| Category | Components |
|---|---|
| **Input** | calendar, checkbox, combobox, command, field, form, input, input-group, input-otp, label, native-select, radio-group, select, slider, switch, textarea |
| **Action** | button, button-group, toggle, toggle-group |
| **Data Display** | avatar, badge, chart, kbd, table |
| **Feedback** | alert, empty, progress, skeleton, sonner, spinner, toast, toaster |
| **Layout** | accordion, aspect-ratio, card, carousel, collapsible, drawer, item, resizable, scroll-area, separator, sheet, sidebar |
| **Navigation** | breadcrumb, menubar, navigation-menu, pagination, tabs |
| **Overlay** | alert-dialog, context-menu, dialog, dropdown-menu, hover-card, popover, tooltip |
| **Utility** | direction, use-mobile (hook), use-toast (hook), utils (lib) |

---

## 11. Notable Configuration

| File | Setting | Note |
|---|---|---|
| `next.config.mjs` | `typescript.ignoreBuildErrors: true` | TS errors won't fail builds |
| `next.config.mjs` | `images.unoptimized: true` | No Next.js image optimization |
| `next.config.mjs` | `transpilePackages: ["radix-ui"]` | Radix UI needs transpilation |
| `components.json` | `style: "new-york"`, `rsc: true` | shadcn CLI defaults |
| `components.json` | `iconLibrary: "lucide"` | Lucide React for all icons |
| `tsconfig.json` | `strict: true`, `target: "ES6"` | Strict TypeScript |
| `tsconfig.json` | `paths: { "@/*": ["./*"] }` | Root-relative imports |
| `postcss.config.mjs` | `@tailwindcss/postcss` | Tailwind CSS 4 PostCSS plugin |

---

## 12. Deployment

- **Platform:** Vercel (automatic deploys from main branch)
- **No CI/CD workflows** — Vercel handles build + deploy
- **No test framework configured** — manual verification via API and build
- **Static registry:** Run `pnpm registry:build` before deploy if static serving is needed

---

## 13. LLM Instructions

When working on this codebase as an AI assistant:

1. **Read `registry.json` before modifying components** — understand the dependency graph
2. **Never break the shadcn registry schema** — downstream apps depend on it
3. **Use the Five African Minerals palette** — never introduce colors outside the token system
4. **Follow the CVA + Radix + cn() pattern** — every component uses this stack
5. **Keep components self-contained** — each file should be independently installable via the registry
6. **Preserve accessibility** — Radix primitives handle focus, keyboard, and screen reader behavior
7. **Test API output** — after modifying a component, verify it serves correctly via `/api/r/[name]`
8. **Respect the layered architecture** — primitives don't import page-level code
9. **All brand wordmarks lowercase** — `mukoko`, `nyuchi`, `shamwari`
10. **This is the canonical design system** — changes here propagate to all Mukoko apps
