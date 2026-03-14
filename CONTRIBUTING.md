# Contributing to mukoko registry

Thank you for your interest in contributing to the mukoko registry.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/<your-username>/mukoko-registry.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Start the dev server: `pnpm dev`

## Development Workflow

### Before You Code

- Read [CLAUDE.md](CLAUDE.md) — it's the definitive reference for this codebase
- Understand the [Five African Minerals design system](https://registry.mukoko.com/brand/colors)
- Check existing components in `components/ui/` to understand patterns

### Code Standards

- **TypeScript strict mode** — no `any` without justification
- **Tailwind utility classes only** — no inline styles, no CSS modules
- **CVA + Radix + cn()** — every component follows this pattern
- **Named exports** — `export { Button }`, not `export default Button`
- **kebab-case files** — `button-group.tsx`, not `ButtonGroup.tsx`
- **All brand wordmarks lowercase** — mukoko, nyuchi, shamwari, bundu, nhimbe

### Component Requirements

Every component in `components/ui/` must have:
1. Accessibility via Radix UI primitives
2. CVA variants for visual states
3. `cn()` for className composition
4. `data-slot` attribute for CSS selection
5. Global styles only (CSS custom properties from `globals.css`)

### Adding a New Component

1. Create the component in `components/ui/`
2. Add an entry to `registry.json`
3. Run `pnpm registry:build` to generate static files
4. Add tests in `__tests__/`
5. Verify: `curl http://localhost:3000/api/v1/ui/<component-name>`

## Testing

```bash
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
```

All PRs must pass tests. Add tests for:
- New components (rendering, variants)
- New API routes (response format, headers)
- Brand data changes (integrity checks)

## Pull Request Process

1. Ensure your code passes: `pnpm lint && pnpm typecheck && pnpm test`
2. Write a clear PR description explaining the "why"
3. Reference any related issues
4. Wait for CI to pass (lint, typecheck, test, build)
5. Request review from a maintainer

## Versioning

This project uses semantic versioning. Version numbers appear in three places that must stay in sync:
- `package.json` (`version` field)
- `lib/brand.ts` (`BRAND_SYSTEM.version`)
- `components/landing/footer.tsx` (footer display)

Only maintainers create version tags and releases.

## Reporting Issues

- **Bugs:** Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug-report.md)
- **Features:** Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature-request.md)
- **Security:** See [SECURITY.md](SECURITY.md)

## Code of Conduct

We follow the Ubuntu philosophy: "I am because we are." Be respectful, inclusive, and constructive.
