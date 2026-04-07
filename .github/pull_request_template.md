## Summary

Brief description of what this PR does and why.

## Changes

- Change 1
- Change 2

## Type

- [ ] Bug fix
- [ ] New feature
- [ ] Component addition
- [ ] Block addition
- [ ] Portal page
- [ ] Brand/design system update
- [ ] Documentation
- [ ] CI/infrastructure
- [ ] Security / dependency update

## Pre-commit Gate (must pass locally before pushing)

- [ ] `pnpm lint` — zero warnings
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm test` — all 123 tests pass
- [ ] `pnpm audit --audit-level=moderate` — zero vulnerabilities
- [ ] `pnpm exec prettier --check` — all staged files formatted

## Quality Checklist

- [ ] New tests added for new functionality
- [ ] All packages at latest (run `pnpm outdated` — zero results allowed)
- [ ] No hardcoded colors — using CSS custom properties from `globals.css`
- [ ] Brand wordmarks are lowercase: `mukoko`, `nyuchi`, `shamwari`, `bundu`, `nhimbe`
- [ ] Accessibility: APCA Lc 90+ body text, Lc 75+ large text, 56px default / 48px minimum touch targets
- [ ] Ubuntu design checklist: shared devices, 3G performant, localisable strings
- [ ] AI output runs through `fullSafetyCheck()` + `validateCulturalContext()` (if AI features touched)

## Registry / Design System (if applicable)

- [ ] `registry.json` updated (if adding/modifying components)
- [ ] `pnpm registry:build` run after registry changes
- [ ] API verified: `curl http://localhost:3000/api/v1/ui/<name>` returns source code
- [ ] MCP tool verified: `get_component({ name })` returns source code
- [ ] DB seed updated (if adding new data)

## Architecture / Docs (if applicable)

- [ ] `CLAUDE.md` updated if architecture/commands/conventions changed
- [ ] `CHANGELOG.md` updated
- [ ] `openapi.yaml` updated if API surface changed
- [ ] Version bumped in `package.json`, `lib/brand.ts`, and `components/landing/footer.tsx` if releasing

## Screenshots

If applicable, show before/after.
