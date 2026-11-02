# The `mzizi` Claude Code plugin

```text
/plugin marketplace add mzizi-dev/mzizi-registry
/plugin install mzizi@mzizi
```

The plugin includes:

| Part                   | Where             | What it does                                                                                                                                                                             |
| ---------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The Mzizi agent skills | `skills/`         | A byte-for-byte copy of `@nyuchi/mzizi-skills`, written by `scripts/generate-plugin-skills.mjs`. Never edit it by hand. Change the skill in `mzizi-dev/agent-tools`, publish, then bump. |
| The Mzizi MCP          | `.claude-plugin/` | `https://mcp.mzizi.dev/mcp`. It is free with no account; only the Fundi tools need sign-in.                                                                                              |
| `/mzizi:component`     | `commands/`       | Fetches a component, Rust first, with its contract and install commands.                                                                                                                 |
| `/mzizi:scaffold`      | `commands/`       | Explores the project, checks that the app shell is installed, and plans the smallest edits for you to review.                                                                            |
| `fundi`                | `agents/`         | The architecture agent.                                                                                                                                                                  |
| The house rules        | `hooks/`          | A hooks module, described below.                                                                                                                                                         |

## The house rules hooks

`hooks/hooks.json` loads `hooks/register.ts`, a module written against Claude Code's plugin
hooks API. The module does three things:

- **Attaches the house rules to each typed prompt.** It uses `prompt.submit` context. Slash
  commands and meta prompts are skipped. The rules cover the following: check remote state
  first, use tokens rather than raw colours, add a CHANGELOG entry and `Refs #n` to every PR,
  squash through the merge queue and never use `--admin`, never close a conflicting PR, and
  report what was measured. The skills state the full rules; these are the reminders.
- **Refuses a raw hex colour** that a `Write` or `Edit` introduces into a styled file (css,
  scss, tsx, jsx, astro, svelte, vue, html).
  - It allows token, palette, brand, minerals, generated and fixture paths, as well as SVG, JSON
    and Markdown files.
  - A file that carries `mzizi-allow-hex` (a comment naming a deliberate literal) may also hold a
    hex.
  - An edit is judged only on the colour it adds.
- **Adds a `/mzizi` command** that prints the rules and where to look first.

**Why `prompt.submit`.** The rules were first written as a `prompt.compose` system-prompt
section and then as a `prompt.context` block. Both were skipped live, because another installed
plugin answers those events first and never calls `next`. A hook on `prompt.submit` runs on
every typed prompt whatever else is installed, so the rules ride there.

**Checks.** Run `claude plugin validate plugin/` to validate the manifest and the module.
`claude plugin test plugin/` runs `hooks/register.test.ts`. The repository's own TypeScript,
ESLint and Vitest setups leave `plugin/hooks/` out, because the module is typed against Claude
Code's API (`'claude-code'`), not this repository's.

The hooks module needs a Claude Code release with the plugin hooks API. It was validated and
tested with Claude Code 2.1.316. How an older client treats a `hooks.json` that lists `modules`
has not been checked.
