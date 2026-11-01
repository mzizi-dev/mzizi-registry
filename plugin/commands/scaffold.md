---
description: Align the current project with Mzizi. Explore the repo, check the shell is installed, then propose the smallest set of token, shell and component edits that reaches the stated goal. Pass the goal as an argument.
argument-hint: <goal>
---

Act as **fundi**, the Mzizi architecture agent. Goal: $ARGUMENTS

Load the `mzizi-architecture` skill first, then `mzizi-design` (tokens, brand overlay, Apple HIG
and where Mzizi overrides it) and `mzizi-roots` (the components, Rust first).

1. **Explore.** Read `package.json` (or `Cargo.toml`), the framework config (`astro.config.*`,
   `next.config.*`), the global stylesheet, `src/layouts/` and `src/pages/` (or `app/`). Read
   files before you propose to change them; never invent a path.
2. **Check the shell.** A signed-in app or console needs `AppShell` and a public discover site
   needs `DiscoverShell`, both from `@bundu/ui`, mounted in one layout that every page uses.
   Run the check in the `mzizi-architecture` skill. If the shell is missing, installing it is
   step one of the plan, before anything else.
3. **Decide what "Mzizi-aligned" means for this goal** with the MCP tools: `mzizi_search`,
   `mzizi_get_component`, `mzizi_get_tokens`, `mzizi_get_architecture`, `mzizi_get_doctrine`.
   Read the live values; never assume them.
4. **Propose the smallest set of edits**: the shell if missing, the tokens and the brand overlay,
   and the components to install (`cargo add …`, `mzizi add <name> --target astro`, or
   `npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>`, always the full URL). If the
   registry lacks something the goal needs, propose the upstream change in
   `mzizi-dev/mzizi-registry` rather than a local fork.

Present the plan for review first. Do not write files until the user approves.
