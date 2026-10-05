# Contributing to Mzizi

Thank you for your interest in contributing to **Mzizi** — the open component registry, brand system, and DNA-helix architecture portal for the bundu ecosystem (the `mzizi` repository).

This guide covers everything you need to get started, from setting up your environment to opening a pull request.

---

## Getting Started

### 1. Fork and clone

```bash
# Fork via GitHub, then clone your fork
git clone https://github.com/<your-username>/mzizi.git
cd mzizi
```

### 2. Install dependencies

```bash
pnpm install
```

The repo is a **pnpm workspace** — one `pnpm install` at the root installs everything. Today the workspace contains a single project: the registry at the root. There is no app here — the Next.js portal was removed; `mzizi.dev` is `mzizi-dev/mzizi-site` and `api.mzizi.dev` is `mzizi-dev/mzizi-api-gateway`. The published Mzizi tooling packages (the CLI, the `mzizi-skills` bundle, the standalone MCP worker, and the SDK) live in **`mzizi-dev/agent-tools` (private)**, not here — see [CLAUDE.md §2](CLAUDE.md) for the split.

Useful root commands:

```bash
pnpm typecheck       # typecheck the registry sources, scripts and Workers
pnpm test            # run the Vitest suite
pnpm registry:normalize # canonicalise registry.json (it is authored, not generated)
pnpm registry:validate  # offline gate — every item resolves on disk and installs
```

Skills are authored in `mzizi-dev/agent-tools` (`mzizi-skills/skills/<name>/SKILL.md`, published as `@nyuchi/mzizi-skills`) and are not in this repo or in the database. The `skills:sync` / `skills:verify` scripts documented here before are gone with the projection they maintained. See [CLAUDE.md §15.23](CLAUDE.md).

### 3. No database to set up

The registry holds no database and needs no credentials. `registry.json` plus the files on disk (`components/registry/`, `content/doctrine/`, `content/changelog/releases.json`, `lib/tokens/`) are the whole data layer, so a fresh clone has everything `mzizi-api-gateway` bundles from it.

Machine-written data — component version history, usage telemetry, the fundi and observability logs — lives in Supabase and belongs to the Mzizi console (`mzizi-dev/mzizi-console`), the only thing in the estate that talks to Supabase. Nothing in this repo reads or writes it.

### 4. Create a branch

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
1. **Understand the file-based architecture** — API routes read `registry.json` and files on disk; there is no database

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
- **All brand wordmarks lowercase** — mzizi, mukoko, nyuchi, shamwari, bundu
- **`data-slot` attribute** on every component for CSS selection and identification
- **`"use client"` only when necessary** — components are React Server Components by default; add the directive only when using hooks, event handlers, or browser APIs

### File-Based Architecture

- The registry holds no database. Every API route and page reads files that ship with the app — never add a Supabase (or any database) client, query, or credential
- Data access goes through `lib/db/index.ts`, whose functions read `registry.json`, `content/`, and `lib/tokens/` (the name is historical)
- Payload types are defined in `lib/db/types.ts`
- Change data with a pull request against the file it lives in, so every edit shows up in a diff

---

## Upstream first: new or altered components go to Mzizi

Owner's rule, 2026-10-04: "anything new that is not in Mzizi, or altered from the Mzizi
ones, we need to adjust Mzizi so the design is always updating so we maintain consistency."

- **A component an app needs that Mzizi does not have, or a change to one Mzizi has (a
  prop, a variant, a state, a fix), goes upstream to Mzizi immediately**: its contract in
  this registry (`contracts/`), its build in `@bundu/ui` (`mzizi-dev/packages-npm`), and
  its page on docs.mzizi.dev, in the same piece of work.
- **An app keeps a local copy only while that upstream PR is open**, marked at the top of
  the file with `TODO(mzizi): <upstream PR URL>`, and deletes it when the release that
  carries the change is installed. A local fork, restyle or wrapper with no open upstream
  PR is a bug, whoever wrote it.
- The standards this protects: the Dashboard Standard (`contracts/app/`, #404) and the
  Discover Standard (`contracts/discover/`, #413). Both say "do not fork; fix upstream".

---

## Adding a New UI Component

**Contract first; Astro by default.** Astro is the default web UI, so a new component's design
starts from its Astro build; its React and Rust builds then render the same component for
consumers that do not use Astro (see AGENTS.md). Every component has one contract, `contracts/<family>/<name>.contract.json`,
whatever languages it ships in (owner, 2026-10-05; [#427](https://github.com/mzizi-dev/mzizi-registry/issues/427)).
Write it before the code: its props, states, clauses, checks and density are what the `.astro`, the
`.tsx`, the `.rs` and the `.mz` are each tested against. A registry primitive goes in `contracts/ui/`
with `identity: "contract"` for each registry build (a Dashboard Standard build of the same primitive is
`app-<name>` under `contracts/app/`); add the `pub const CONTRACT` to the `.rs`, then run
`pnpm contracts:sync` to fill it from the contract file (`.mz` files are built elsewhere, per AGENTS.md). See [`contracts/README.md`](./contracts/README.md).

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

1. **Write the component file** under `components/registry/n<N>-<label>/<name>.tsx` — the component IS the file, and the build compiles and typechecks it. Then add its item to `registry.json`: `name`, `type`, `description`, `dependencies`, `registryDependencies`, `files[].path`, and the `meta` block (`useCases`, `variants`, `sizes`, `features`, `a11y`, `owner`, `collection`).

1. **Canonicalise and validate the manifest.** `registry.json` is authored (CLAUDE.md §15 rule 2); `pnpm registry:normalize` sorts and formats it, `pnpm registry:validate` proves the item resolves on disk and its dependencies are addressable, and CI runs both:

```bash
pnpm registry:normalize && pnpm registry:validate
```

The entry looks like this:

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

1. **Verify** the item resolves and the build is clean. There is no local server (the app and its `/api/*` handlers were removed on 2026-10-02):

```bash
pnpm registry:validate && pnpm registry:verify
pnpm build && git status --porcelain   # every generator in write mode; commit what it writes
```

Once the change is on `main` and mzizi-api-gateway's pin reaches it, `curl https://api.mzizi.dev/v1/ui/my-component` serves it.

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

1. **Add the item to `registry.json` and run `pnpm registry:normalize`** as with UI components.

---

## Pages and documentation

This repo has no pages. The functional surfaces that used to be Next.js routes here
(the component gallery, the architecture explorer, observability) left with the app;
`mzizi.dev` is built from [`mzizi-dev/mzizi-site`](https://github.com/mzizi-dev/mzizi-site).

Long-form documentation lives in the Mzizi docs site at <https://docs.mzizi.dev>, built
from [`mzizi-dev/mzizi-docs`](https://github.com/mzizi-dev/mzizi-docs). Doctrine
(`content/doctrine/`) stays here.

---

## Testing

### Running Tests

```bash
pnpm test             # Run all tests once
pnpm test:watch       # Watch mode for development
```

### What to Test

- **New components** — rendering, variant application, accessibility attributes
- **Brand data changes** — integrity checks (minerals match globals.css hex values)
- **Architecture data changes** — data integrity validation
- **Registry changes** — all referenced files exist on disk, schema validation

### Test Location

```
__tests__/
├── contracts/        Every contract in contracts/ against the schema, the index and the README
├── db/               The no-database guarantee
├── lib/              The readers mzizi-api-gateway bundles, and the generators' outputs
├── registry/         Registry item checks
└── tokens-*.test.ts  Token pipeline integrity
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
pnpm registry:verify # CI fails if registry.json is not canonical
pnpm tokens:verify   # CI fails if the generated tokens drift from lib/tokens/palette.source.ts
pnpm build           # run every generator in write mode (terminal gate; CI fails on any diff)
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

The dependency tree inside `ci.yml` is:

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
- [ ] New components are files under `components/registry/`, with their item + `meta` added to `registry.json` and `pnpm registry:normalize` run
- [ ] Tests added for new functionality
- [ ] Accessibility reviewed (APCA contrast, 56px default / 48px minimum touch targets, keyboard nav)
- [ ] Brand wordmarks are lowercase (`mzizi`, `mukoko`, `nyuchi`, `shamwari`, `bundu`)
- [ ] Buttons are pill-shaped (`rounded-full`)
- [ ] Any security finding from `/security-review` is fixed in this PR (per CLAUDE.md §15 rule 22 — never deferred)
- [ ] The PR body has a `Site/docs/skills impact` section. mzizi.dev, docs.mzizi.dev and the agent skills (`@nyuchi/mzizi-skills`) must never lag this repo, so any user-visible change to components, the Mzizi Roots crates, the API data, or the npm packages and MCP tools is named there for the site, docs and skills freshness agents (see [`AGENTS.md`](AGENTS.md#site-docs-and-skills-freshness-hard-rule)). Write "None" if nothing user-visible changed.

### Review Process

1. Submit your PR with a clear description explaining the "why"
1. Reference any related issues
1. CI will run automatically (lint, typecheck, test, build)
1. An AI code review via Claude will check design system adherence, accessibility, and code quality
1. A maintainer will review and provide feedback
1. Once approved and CI passes, a maintainer will merge

---

## Versioning

Releases follow the org versioning policy ([nyuchi/.github#80](https://github.com/nyuchi/.github/issues/80)), from 2026-10-04:

- A merge into `staging` is a **patch** (x.y.z → x.y.z+1), tagged automatically by `staging-version.yml`.
- A release to `main` is a **minor** (x.y.z → x.y+1.0) **above the highest existing tag**. The highest `v` tag is v4.1.8, so the next registry release is **4.2.0**, even though `package.json` still reads 1.0.0. The Mzizi Roots crates follow the same rule against their own `mzizi-rs-v` tags (next: 0.2.0).
- A **major** is only released by hand: run the Release (or Publish crates) workflow with `bump: major`. Each segment holds 0–999.
- `release.yml` and `publish-crates.yml` check the version with the shared `next-version` action before tagging or uploading, and name the version they expect. Released versions are never renumbered.

A version bump must be propagated to every surface listed in [CLAUDE.md §14](CLAUDE.md) — `package.json`, `lib/mcp-server.ts` (`VERSION`), the release entry in `content/changelog/releases.json`, `components/landing/footer.tsx`, `components/landing/dashboard-sidebar.tsx`, `app/layout.tsx` (`softwareVersion`), `README.md`, and CLAUDE.md §1 — which must all stay in sync.

Only maintainers create version tags and releases. The release process:

1. Update the version across every surface listed in CLAUDE.md §14.
1. Add an entry for the new version to `content/changelog/releases.json` and run `pnpm changelog:generate`.
1. Commit and open a PR, and merge it to `main`.
1. `release.yml` checks the version against the policy, then tags `vX.Y.Z` and creates the release. Nobody pushes a tag by hand.

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
