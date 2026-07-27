# Contributing to Mzizi

Thank you for your interest in contributing to **Mzizi** — the open component registry, brand system, and DNA-helix architecture portal for the bundu ecosystem (the `design-portal` repository).

This guide covers everything you need to get started, from setting up your environment to opening a pull request.

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

The repo is a **pnpm workspace** — one `pnpm install` at the root installs everything. Today the workspace contains a single project: the Next.js portal app at the root. The published Mzizi tooling packages (the CLI, the `mzizi-skills` bundle, the standalone MCP worker, and the SDK) live in **[`nyuchi/mzizi-tools`](https://github.com/nyuchi/mzizi-tools)**, not here — see [CLAUDE.md §2](CLAUDE.md) for the split.

Useful root commands:

```bash
pnpm dev             # Next.js dev server
pnpm typecheck       # typecheck the portal app
pnpm test            # run the Vitest suite
pnpm registry:sync   # regenerate registry.json from Supabase
pnpm skills:sync     # refresh the skill snapshots from the Supabase `skills` table
pnpm skills:verify   # CI-style drift check (non-zero exit on drift)
```

Skill content lives in the Supabase `skills` table — never hand-edit the generated `.md` snapshots. See [CLAUDE.md §15](CLAUDE.md) for the single-source-of-truth doctrine.

### 3. Set up the database (optional for UI work)

The registry uses a DB-first architecture with Supabase. For component development and documentation work, you can run the portal without a database connection — but API routes will not function.

For full functionality:

```bash
# Copy the environment template
cp .env.example .env.local

# Add your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
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

1. **Read [CLAUDE.md](CLAUDE.md)** — it is the definitive reference for this codebase, covering architecture, conventions, and the full design system specification
1. **Understand the [Seven African Minerals design system](https://mzizi.dev/tokens)** — all colors come from the mineral-named tokens (seven minerals + seven heritage tones + status + the Experimental Seven)
1. **Browse existing components** in `components/ui/` to understand the CVA + Radix + cn() pattern
1. **Check `registry.json`** before modifying components to understand the dependency graph
1. **Understand the DB-first architecture** — API routes read from Supabase, not hardcoded objects

### Key Principles

- The registry is the **single source of truth** for the entire bundu ecosystem. Changes here propagate to every app that consumes the registry.
- Every component must be **independently installable** via the shadcn CLI.
- The **Seven African Minerals palette** (minerals + heritage + status + experimental) is the only approved color system. Never introduce colors outside the token system.
- **Accessibility is mandatory** — APCA 3.0 AAA contrast, 56px default / 48px minimum touch targets, keyboard navigation, screen reader support.

---

## Code Standards

### TypeScript

- **Strict mode** — no `any` without explicit justification in a comment
- **Path alias** — use `@/*` for imports (e.g., `import { cn } from "@/lib/utils"`)
- **Named exports** — `export { Button, buttonVariants }`, not `export default Button`

### Styling

- **Tailwind utility classes only** — no inline styles, no CSS modules
- **Never hardcode hex colors** — use Tailwind classes backed by CSS custom properties from `globals.css`
- **`cn()` for all className composition** — never string concatenation
- **CVA for variants** — use class-variance-authority for any component with visual states

### File Conventions

- **kebab-case** for file names: `button-group.tsx`, `date-range-picker.tsx`
- **PascalCase** for component names: `ButtonGroup`, `DateRangePicker`
- **All brand wordmarks lowercase** — mzizi, mukoko, nyuchi, shamwari, bundu, nhimbe
- **`data-slot` attribute** on every component for CSS selection and identification
- **`"use client"` only when necessary** — components are React Server Components by default; add the directive only when using hooks, event handlers, or browser APIs

### DB-First Architecture

- All API routes read from Supabase — never return hardcoded fallback data
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

const myComponentVariants = cva("base-classes-here", {
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
})

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

1. **Upsert the component into the Supabase `components` table** — Supabase is the source of truth. Include `source_code`, `architecture_layer`, `category`, `dependencies`, `registry_dependencies`, and `status = 'stable'`. The portal serves it from the DB on the next request — no rebuild required.

1. **Regenerate the registry snapshot.** `registry.json` is generated, never hand-edited (CLAUDE.md §15 rule 2); `pnpm registry:sync` rewrites it from Supabase and CI fails on drift via `pnpm registry:verify`:

```bash
pnpm registry:sync
```

The generated entry looks like this:

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

1. **Add tests** in `__tests__/components/`:

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

1. **Verify** the component serves correctly:

```bash
curl http://localhost:11736/api/v1/ui/my-component
```

---

## Adding a New Block

Blocks are complete page compositions (dashboards, login pages, settings panels, etc.) or chart examples.

1. **Create the block file** in `components/blocks/`:
   - Chart blocks go in the appropriate chart type directory
   - Page blocks go in the appropriate page type directory

1. **Add to `registry.json`** with type `registry:block`:

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

1. **Upsert into Supabase and run `pnpm registry:sync`** as with UI components.

---

## Adding a Portal Page

The portal hosts the **functional** surfaces only — the component gallery
(`/components`), the DNA-helix architecture explorer (`/architecture`), and
observability (`/observability`). Each is a standard Next.js App Router
`page.tsx`.

Long-form documentation (installation, CLI, theming, contributing, brand,
foundations, patterns, registry internals) lives in the standalone Astro
Starlight docs sites — product docs at <https://docs.bundu.org> and engineering
docs at <https://docs.nyuchi.com> — not in this repo. To edit a guide,
contribute to those docs repos instead. (The previous Mintlify docs site is
retired.)

To add a new functional page to the portal:

1. **Create the page** at `app/<section>/page.tsx` as a server component.
2. **Export `metadata`** (title + description) for SEO.
3. **Add the route to `lib/nav.ts`** so it appears in the dashboard sidebar
   and header. Nav is curated (not auto-generated) so the order and grouping
   are intentional.

---

## Testing

### Running Tests

```bash
pnpm test             # Run all tests once
pnpm test:watch       # Watch mode for development
```

### What to Test

- **New components** — rendering, variant application, accessibility attributes
- **New API routes** — response format, status codes, headers
- **Brand data changes** — integrity checks (minerals match globals.css hex values)
- **Architecture data changes** — data integrity validation
- **Registry changes** — all referenced files exist on disk, schema validation

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

### Before submitting — run the same gates CI runs

Use the single `pnpm check` script. It chains every CI gate locally so you catch problems before they reach the runner. **Run it before every push** — the husky pre-commit hook is a safety net, not a substitute.

```bash
pnpm check
```

That's equivalent to:

```bash
pnpm format:check    # prettier check (no writes)
pnpm lint            # ESLint, zero warnings
pnpm lint:colors     # guard against off-token hardcoded colors
pnpm lint:md         # markdownlint-cli2
pnpm lint:json       # every tracked JSON parses
pnpm typecheck       # tsc --noEmit
pnpm test            # vitest single run
pnpm audit:check     # pnpm audit --audit-level=moderate
pnpm registry:verify # CI fails if registry.json drifts from Supabase
pnpm tokens:verify   # CI fails if the design tokens drift from Supabase
pnpm build           # next build (terminal gate)
```

If any step fails, `pnpm check` exits non-zero on the first failure. Fix forwards and re-run.

#### One-time tooling setup

| Tool                 | Install                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Node 22 + pnpm 10.33 | `nvm use 22` then `corepack enable`                                                                                                        |
| `markdownlint-cli2`  | `pnpm install` (committed devDep)                                                                                                          |
| `prettier`, `eslint` | `pnpm install` (committed devDeps)                                                                                                         |
| `actionlint`         | `brew install actionlint` or `bash <(curl -fsSL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)` |
| `yamllint`           | `pip install yamllint==1.35.1` (one-time)                                                                                                  |

The two non-`pnpm` tools (`actionlint`, `yamllint`) are run on CI by the `lint` workflow but aren't strictly required locally — they're pure static checks on YAML files you'd typically run as a sanity check after editing `.github/workflows/*.yml` or `.yamllint.yml`. Install them if you regularly touch CI configs; otherwise CI will catch issues.

#### Quick fix-everything

If `pnpm check` complains about formatting or auto-fixable lint, run:

```bash
pnpm format    # auto-fix prettier
pnpm lint:fix  # auto-fix ESLint
pnpm check     # re-run full gate
```

### CI workflows that run on your PR

Detailed in [`README.md`](README.md#ci-workflows). Required for merge:

- **`ci.yml`** — `Lint`, `Type Check`, `Test`, `Build`, `Security Audit`, `Registry Snapshot`
- **`lint.yml`** — `lint / actionlint`, `lint / JSON validity`, `lint / prettier`, `lint / markdownlint`, `lint / yamllint`
- **`CodeQL`** — `Analyze (actions)`, `Analyze (javascript-typescript)`

`Claude Code Review` runs on every PR comment but is advisory, not a merge gate. The dependency tree inside `ci.yml` is:

```text
Tier 1 parallel:  Audit, Lint, Type Check, Registry Snapshot
Tier 2:           Test                              (waits on Lint, Type Check)
Tier 3 terminal:  Build                             (waits on all of the above)
```

### PR Checklist

- [ ] `pnpm check` passes locally (single command — see above)
- [ ] Code follows TypeScript strict mode — no untyped `any`
- [ ] Styling uses Tailwind utility classes only — no inline styles or hardcoded hex colors
- [ ] Components use CVA + cn() + data-slot pattern
- [ ] New components are upserted into the Supabase `components` table; `pnpm registry:sync` regenerates `registry.json`
- [ ] Tests added for new functionality
- [ ] Accessibility reviewed (APCA contrast, 56px default / 48px minimum touch targets, keyboard nav)
- [ ] Brand wordmarks are lowercase (`mzizi`, `mukoko`, `nyuchi`, `shamwari`, `bundu`, `nhimbe`)
- [ ] Buttons are pill-shaped (`rounded-full`)
- [ ] Any security finding from `/security-review` is fixed in this PR (per CLAUDE.md §15 rule 22 — never deferred)

### Review Process

1. Submit your PR with a clear description explaining the "why"
1. Reference any related issues
1. CI will run automatically (lint, typecheck, test, build)
1. An AI code review via Claude will check design system adherence, accessibility, and code quality
1. A maintainer will review and provide feedback
1. Once approved and CI passes, a maintainer will merge

---

## Versioning

This project uses semantic versioning; the current version is **1.0.0**. A version bump must be propagated to every surface listed in [CLAUDE.md §14](CLAUDE.md) — `package.json`, `lib/mcp-server.ts` (`VERSION`), the Supabase `changelog` row, `components/landing/footer.tsx`, `components/landing/dashboard-sidebar.tsx`, `app/layout.tsx` (`softwareVersion`), `README.md`, and CLAUDE.md §1 — which must all stay in sync.

Only maintainers create version tags and releases. The release process:

1. Update the version across every surface listed in CLAUDE.md §14.
1. Insert a row into the Supabase `changelog` table for the new version.
1. Commit and open a PR; merge with `merge_method=merge` (never squash).
1. Tag `vX.Y.Z` and push the tag.
1. GitHub Actions validates the tag against `package.json` and creates the release automatically.

---

## Reporting Issues

- **Bugs** — describe the problem, include steps to reproduce, expected vs actual behavior
- **Feature requests** — describe the use case and why it benefits the ecosystem
- **Security vulnerabilities** — see [SECURITY.md](SECURITY.md) for responsible disclosure

When filing issues, include:

- Browser and OS version (for UI issues)
- Node.js and pnpm versions
- Relevant error messages or screenshots
- The component or page affected

---

## Code of Conduct

We follow the Ubuntu philosophy: **"I am because we are."**

- Be respectful and inclusive in all interactions
- Value constructive feedback — give it kindly, receive it graciously
- Remember that this project serves a pan-African ecosystem with diverse users and contributors
- Write code and documentation that is accessible and welcoming to newcomers
- Assume good intent; ask clarifying questions before making judgments

Harassment, discrimination, and exclusionary behavior are not tolerated. Maintainers may remove contributions or ban contributors who violate these principles.

---

## Questions?

- Read [CLAUDE.md](CLAUDE.md) for the full technical reference
- Browse the [portal](https://mzizi.dev) for design system documentation
- Open a discussion on GitHub for architectural questions
