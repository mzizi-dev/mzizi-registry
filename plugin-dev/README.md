# The `mzizi-dev` Claude Code plugin

```text
/plugin marketplace add mzizi-dev/mzizi-registry
/plugin install mzizi-dev@mzizi
```

The dev workflow for agents and maintainers. It is the second plugin in this marketplace; the first, `mzizi`, is the public one (skills and the Mzizi MCP, no scripts). This one ships code that runs on your machine, so it is installed from this marketplace and is not submitted to the Claude plugin directory, which holds such plugins for review.

| Part                | Where     | What it does                                                                                                                                                                                                                                                                                                                        |
| ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The dev skills      | `skills/` | `digital-hygiene`, `progress-report`, `ship-release`, `registry-propagation` and `pr-gates`: a byte-for-byte copy from `@nyuchi/mzizi-skills`, written by `scripts/generate-plugin-skills.mjs`. Never edit by hand.                                                                                                                 |
| Their shell scripts | `skills/` | `hygiene.sh`, `progress.sh` and `verify-live.sh`, one in each of the first three skills. They are portable bash. `progress.sh` and `verify-live.sh` are read-only. `hygiene.sh` makes clones and worktrees (`clone`, `worktree`); its deleting commands (`prune`, `tmp`, `close`, `sweep`) are a dry run unless you pass `--apply`. |
| The house rules     | `hooks/`  | A hooks module, described below.                                                                                                                                                                                                                                                                                                    |

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

**Checks.** Run `claude plugin validate plugin-dev/` to validate the manifest and the module.
`claude plugin test plugin-dev/` runs `hooks/register.test.ts`. The repository's own TypeScript,
ESLint and Vitest setups leave `plugin-dev/hooks/` out, because the module is typed against Claude
Code's API (`'claude-code'`), not this repository's.

The hooks module needs a Claude Code release with the plugin hooks API. It was validated and
tested with Claude Code 2.1.316. How an older client treats a `hooks.json` that lists `modules`
has not been checked.
