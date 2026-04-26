# @nyuchi/design-agent-skills

Agent skills for AI assistants working with the Nyuchi Design system.

```bash
# Install via the community skills CLI (writes to ./.claude/skills/)
npx skills add @nyuchi/design-agent-skills

# Or via the Nyuchi Design CLI (same effect, supports `update`)
npx @nyuchi/design-cli skills install
```

## What's in the box

Three skills, each shipped as a single `.md` file under `skills/`:

| Skill                  | When to invoke                                                                                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nyuchi-design-system` | Working on any bundu-ecosystem app (mukoko, nyuchi, shamwari, nhimbe) or asking about the Five African Minerals palette, the 3D frontend architecture, Ubuntu design doctrine, component patterns (CVA + Radix + cn), APCA accessibility targets, or shadcn-CLI registry install commands. |
| `scaffold-component`   | Adding a new UI component to the Nyuchi Design Portal registry. The workflow is: MCP `scaffold_component` → upsert Supabase row → `pnpm registry:sync` → verify via `/api/v1/ui/{name}`.                                                                                                   |
| `ecosystem-app-setup`  | Bootstrapping a new bundu-ecosystem app from scratch — Next.js + shadcn CLI + Tailwind 4 + next-themes against the Nyuchi Design Portal registry.                                                                                                                                          |

## Source of truth

The `.md` files in this package are a **published snapshot** of the Supabase `skills` table on the Nyuchi Design Portal. The live source is always:

```
GET https://design.nyuchi.com/api/v1/skills/<name>
```

Whenever the database is updated, a new version of this package is published with the latest content. To always pull the freshest version, use `npx @nyuchi/design-cli skills install` (which fetches live from the API) instead of installing this package directly.

## Compatible agents

Each skill carries a YAML frontmatter `agents: [...]` array declaring which AI tooling it targets. Today every skill ships for `claude-code`, `cursor`, `copilot`, and `cline`; the `nyuchi-design-system` skill additionally targets `windsurf`. Most agent-skills CLIs filter by the agent name automatically; if yours doesn't, you can hand-pick.

## License

MIT — © Nyuchi Africa (PVT) Ltd
