# @nyuchi/design-cli

Bootstrap a Nyuchi Design app — install components from the registry and skills for AI agents.

```bash
# Scaffold a fresh project (writes globals.css, components.json, lib/utils.ts,
# theme-provider, and seeds .claude/skills/)
npx @nyuchi/design-cli init

# Install one component (wraps the shadcn CLI, pinned to design.nyuchi.com)
npx @nyuchi/design-cli add button

# Install agent skills into ./.claude/skills/
npx @nyuchi/design-cli skills install
npx @nyuchi/design-cli skills update
```

## What it does

`@nyuchi/design-cli` is the canonical entry point for adopting the Nyuchi Design system in any consumer app — replacing the previous 8-step manual bootstrap (`globals.css` copy, `lib/utils.ts`, theme provider, components.json, …) with a single command.

Subcommands:

| Command                 | Action                                                                                                                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init`                  | Writes the canonical bootstrap files (`app/globals.css`, `lib/utils.ts`, `components/theme-provider.tsx`, `components.json`) into the current directory. Idempotent — won't overwrite existing files unless `--force`. |
| `add <component...>`    | Thin wrapper over `npx shadcn@latest add <url>` pinned to the Nyuchi registry at `https://design.nyuchi.com/api/v1/ui`.                                                                                                |
| `skills install [name]` | Fetches `/api/v1/skills` (or `/api/v1/skills/<name>`) and writes `.md` files to `./.claude/skills/`.                                                                                                                   |
| `skills update`         | Re-fetches via `/api/v1/skills/summary`; reports version drift; rewrites changed skills.                                                                                                                               |

## Where everything lives

- **Source of truth**: the Supabase `components` and `skills` tables on the Nyuchi Design Portal — served live at `https://design.nyuchi.com`.
- **Component install path**: shadcn CLI under the hood — `nyuchi-design add` is just a thin wrapper that pre-fills the registry URL.
- **Skills install path**: HTTP `GET /api/v1/skills/<name>` returns the MDX body; CLI writes to `./.claude/skills/<name>.md`.
- **Skills bundled in the npm package**: `@nyuchi/design-agent-skills` ships the same `.md` files for offline / `npx skills add` workflows.

## Doctrine

- **Five African Minerals** color palette (Cobalt, Tanzanite, Malachite, Gold, Terracotta).
- **CVA + Radix + cn()** component pattern.
- **APCA 3.0 AAA** contrast targets.
- **56 px default / 48 px minimum** touch targets.
- **Buttons are always pill-shaped** (`rounded-full`).

The `init` subcommand wires all of these into the consumer project so every downstream component uses them by default.

## Development

This package lives in the [nyuchi/design-portal](https://github.com/nyuchi/design-portal) monorepo. To work on it:

```bash
git clone https://github.com/nyuchi/design-portal
cd design-portal
pnpm install                                       # installs every package in the workspace
pnpm --filter @nyuchi/design-cli build              # build only this package
pnpm --filter @nyuchi/design-cli test               # run vitest
node packages/design-cli/bin/cli.js init            # exercise the local CLI
```

## License

MIT — © Nyuchi Africa (PVT) Ltd
