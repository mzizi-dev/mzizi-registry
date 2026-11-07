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
- [ ] Brand wordmarks are lowercase: `mukoko`, `nyuchi`, `shamwari`, `bundu`
- [ ] Accessibility (the Bundu floor, `BUNDU_FLOOR` in `lib/tokens/roles.source.ts`): body text 17px and captions 14px, a 49px hit region on every control on every device (a desktop control may be drawn smaller but keeps it), contrast 7:1 body, 4.5:1 non-body, 3:1 UI
- [ ] Ubuntu design checklist: shared devices, 3G performant, localisable strings
- [ ] AI output runs through `fullSafetyCheck()` + `validateCulturalContext()` (if AI features touched)

## Registry / Design System (if applicable)

- [ ] No database touched — the registry holds none (component data is `registry.json` + files on disk)
- [ ] `registry.json` updated by hand (it is authored) and `pnpm registry:normalize` run; CI verifies via `pnpm registry:verify` + `pnpm registry:validate`
- [ ] `pnpm build` leaves `git status --porcelain` empty. There is no local server; once on `main` and the gateway pin reaches it, `https://api.mzizi.dev/v1/ui/<name>` serves the item
- [ ] MCP tool verified: `get_component({ name })` returns source code

## Architecture / Docs (if applicable)

- [ ] `CLAUDE.md` updated if architecture/commands/conventions changed
- [ ] `CHANGELOG.md` updated
- [ ] `openapi.yaml` updated if API surface changed
- [ ] Version bumped in `package.json`, and a new entry added to `content/changelog/releases.json` (then `pnpm changelog:generate`), if releasing
- [ ] Release PR (`release/*` into `main`): the body carries the release notes, the `CHANGELOG.md` entries being released (the `release notes / release PR` job prints them in its run summary)

## Site/docs/skills impact

mzizi.dev (`mzizi-site`), docs.mzizi.dev (`mzizi-docs`) and the agent skills
(`@nyuchi/mzizi-skills`) must never lag this repo. Name any user-visible change to
components, the Mzizi Roots crates, the API data, or the npm packages and MCP tools, and the
site pages, docs pages or skills it affects, so the freshness agents pick it up. Write
"None" if nothing user-visible changed.

- None

## Screenshots

If applicable, show before/after.
