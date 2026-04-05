# Contributing to nyuchi design portal

Thank you for your interest in contributing to the nyuchi design portal -- the Nyuchi Design Portal.

This guide covers everything you need to get started, from setting up your environment to submitting a pull request.

---

## Getting Started

### 1. Fork and clone

```bash
# Fork via GitHub, then clone your fork
git clone https://github.com/<your-username>/design-portal.git
cd design-portal
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up the database (optional for UI work)

The registry uses a DB-first architecture with Supabase. For component development and documentation work, you can run the portal without a database connection -- but API routes will not function.

For full functionality:

```bash
# Copy the environment template
cp .env.example .env.local

# Add your Supabase credentials
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (only needed for seeding)

# Seed the database from registry.json and brand data
pnpm db:seed
```

### 4. Start the development server

```bash
pnpm dev
```

The portal runs at [http://localhost:11736](http://localhost:11736).

### 5. Create a branch

```bash
git checkout -b feature/your-feature
```

---

## Development Workflow

### Before You Code

1. **Read [CLAUDE.md](CLAUDE.md)** -- it is the definitive reference for this codebase, covering architecture, conventions, and the full design system specification
2. **Understand the [Five African Minerals design system](https://design.nyuchi.com/brand/colors)** -- all colors come from five mineral-named tokens
3. **Browse existing components** in `components/ui/` to understand the CVA + Radix + cn() pattern
4. **Check `registry.json`** before modifying components to understand the dependency graph
5. **Understand the DB-first architecture** -- API routes read from Supabase, not hardcoded objects

### Key Principles

- The registry is the **single source of truth** for the entire bundu ecosystem. Changes here propagate to every app that consumes the registry.
- Every component must be **independently installable** via the shadcn CLI.
- The **Five African Minerals palette** is the only approved color system. Never introduce colors outside the token system.
- **Accessibility is mandatory** -- APCA 3.0 AAA contrast, 56px default / 48px minimum touch targets, keyboard navigation, screen reader support.

---

## Code Standards

### TypeScript

- **Strict mode** -- no `any` without explicit justification in a comment
- **Path alias** -- use `@/*` for imports (e.g., `import { cn } from "@/lib/utils"`)
- **Named exports** -- `export { Button, buttonVariants }`, not `export default Button`

### Styling

- **Tailwind utility classes only** -- no inline styles, no CSS modules
- **Never hardcode hex colors** -- use Tailwind classes backed by CSS custom properties from `globals.css`
- **`cn()` for all className composition** -- never string concatenation
- **CVA for variants** -- use class-variance-authority for any component with visual states

### File Conventions

- **kebab-case** for file names: `button-group.tsx`, `date-range-picker.tsx`
- **PascalCase** for component names: `ButtonGroup`, `DateRangePicker`
- **All brand wordmarks lowercase** -- mukoko, nyuchi, shamwari, bundu, nhimbe
- **`data-slot` attribute** on every component for CSS selection and identification
- **`"use client"` only when necessary** -- components are React Server Components by default; add the directive only when using hooks, event handlers, or browser APIs

### DB-First Architecture

- All API routes read from Supabase -- never return hardcoded fallback data
- Database operations go through `lib/db/index.ts`
- Types are defined in `lib/db/types.ts`
- Seeding uses upsert (ON CONFLICT) for idempotency

---

## Adding a New UI Component

1. **Create the component file** in `components/ui/`:

```tsx
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const myComponentVariants = cva(
  "base-classes-here",
  {
    variants: {
      variant: {
        default: "default-variant-classes",
      },
      size: {
        default: "default-size-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function MyComponent({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof myComponentVariants>) {
  return (
    <div
      data-slot="my-component"
      className={cn(myComponentVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { MyComponent, myComponentVariants }
```

2. **Add an entry to `registry.json`**:

```json
{
  "name": "my-component",
  "type": "registry:ui",
  "description": "One-line description of what it does.",
  "dependencies": ["class-variance-authority"],
  "registryDependencies": [],
  "files": [
    {
      "path": "components/ui/my-component.tsx",
      "type": "registry:ui"
    }
  ]
}
```

3. **Seed the database** to make the component available via the API:

```bash
pnpm db:seed
```

4. **Run the static registry build**:

```bash
pnpm registry:build
```

5. **Add tests** in `__tests__/components/`:

```tsx
import { render, screen } from "@testing-library/react"
import { MyComponent } from "@/components/ui/my-component"

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent>Hello</MyComponent>)
    expect(screen.getByText("Hello")).toBeInTheDocument()
  })
})
```

6. **Verify** the component serves correctly:

```bash
curl http://localhost:11736/api/v1/ui/my-component
```

---

## Adding a New Block

Blocks are complete page compositions (dashboards, login pages, settings panels, etc.) or chart examples.

1. **Create the block file** in `components/blocks/`:
   - Chart blocks go in the appropriate chart type directory
   - Page blocks go in the appropriate page type directory

2. **Add to `registry.json`** with type `registry:block`:

```json
{
  "name": "dashboard-01",
  "type": "registry:block",
  "description": "Dashboard layout with sidebar navigation and stats cards.",
  "dependencies": [],
  "registryDependencies": ["card", "sidebar", "chart"],
  "files": [
    {
      "path": "components/blocks/dashboard-01.tsx",
      "type": "registry:block"
    }
  ]
}
```

3. **Seed the database and rebuild the registry** as with UI components.

---

## Adding a Portal Page

The portal uses Nextra (MDX) for documentation pages. There are 71 pages across 11 sections.

1. **Identify the correct section** for your page:
   - `/docs` -- developer documentation (installation, CLI, theming)
   - `/components` -- per-component documentation
   - `/blocks` -- block gallery and demos
   - `/charts` -- chart block gallery
   - `/brand` -- brand documentation
   - `/foundations` -- typography, layout, motion, accessibility, i18n
   - `/design` -- design tokens, icons
   - `/content` -- writing guidelines, error messages, inclusive language
   - `/patterns` -- implementation patterns
   - `/architecture` -- ecosystem architecture
   - `/registry` -- registry internals (schema, MCP, contributing, consuming)

2. **Create the MDX file** in the appropriate `app/<section>/` directory:

```mdx
# Page Title

Description of the page content.

## Section

Content here.
```

3. **Update the section's `_meta.ts`** to include navigation for your new page.

---

## Testing

### Running Tests

```bash
pnpm test             # Run all tests once
pnpm test:watch       # Watch mode for development
```

### What to Test

- **New components** -- rendering, variant application, accessibility attributes
- **New API routes** -- response format, status codes, headers
- **Brand data changes** -- integrity checks (minerals match globals.css hex values)
- **Architecture data changes** -- data integrity validation
- **Registry changes** -- all referenced files exist on disk, schema validation

### Test Location

```
__tests__/
├── api/              API route tests
├── brand/            Brand data integrity tests
├── architecture/     Architecture data integrity tests
└── components/       Component rendering tests
```

---

## Pull Request Process

### Before Submitting

Run the full CI pipeline locally:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four must pass. The CI pipeline runs lint, typecheck, and test in parallel, then build.

### PR Checklist

- [ ] Code follows TypeScript strict mode -- no untyped `any`
- [ ] Styling uses Tailwind utility classes only -- no inline styles or hardcoded colors
- [ ] Components use CVA + cn() + data-slot pattern
- [ ] New components are added to `registry.json`
- [ ] Database seeded with new data (`pnpm db:seed`)
- [ ] Tests added for new functionality
- [ ] All existing tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Accessibility reviewed (APCA contrast, touch targets, keyboard nav)
- [ ] Brand wordmarks are lowercase (mukoko, nyuchi, shamwari, bundu, nhimbe)

### Review Process

1. Submit your PR with a clear description explaining the "why"
2. Reference any related issues
3. CI will run automatically (lint, typecheck, test, build)
4. An AI code review via Claude will check design system adherence, accessibility, and code quality
5. A maintainer will review and provide feedback
6. Once approved and CI passes, a maintainer will merge

---

## Versioning

This project uses semantic versioning. The version number appears in **four places** that must stay in sync:

1. `package.json` -- `version` field
2. `lib/brand.ts` -- `BRAND_SYSTEM.version`
3. `lib/architecture.ts` -- version reference
4. `components/landing/footer.tsx` -- footer display

Only maintainers create version tags and releases. The release process:

1. Update version in all four locations
2. Commit: `git commit -m "Release vX.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push --tags`
5. GitHub Actions validates and creates the release automatically

---

## Reporting Issues

- **Bugs** -- describe the problem, include steps to reproduce, expected vs actual behavior
- **Feature requests** -- describe the use case and why it benefits the ecosystem
- **Security vulnerabilities** -- see [SECURITY.md](SECURITY.md) for responsible disclosure

When filing issues, include:

- Browser and OS version (for UI issues)
- Node.js and pnpm versions
- Relevant error messages or screenshots
- The component or page affected

---

## Code of Conduct

We follow the Ubuntu philosophy: **"I am because we are."**

- Be respectful and inclusive in all interactions
- Value constructive feedback -- give it kindly, receive it graciously
- Remember that this project serves a pan-African ecosystem with diverse users and contributors
- Write code and documentation that is accessible and welcoming to newcomers
- Assume good intent; ask clarifying questions before making judgments

Harassment, discrimination, and exclusionary behavior are not tolerated. Maintainers may remove contributions or ban contributors who violate these principles.

---

## Questions?

- Read [CLAUDE.md](CLAUDE.md) for the full technical reference
- Browse the [portal](https://design.nyuchi.com) for design system documentation
- Open a discussion on GitHub for architectural questions
