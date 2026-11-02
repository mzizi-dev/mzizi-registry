---
description: Fetch a Mzizi component's full document from the registry, Rust first, with its contract and install commands. Pass the component name as an argument.
argument-hint: <component-name>
---

Use the **mzizi** MCP server (this plugin registers it at `https://mcp.mzizi.dev/mcp`) to fetch
the component named: $ARGUMENTS

1. Call `mzizi_get_component` with that name. Components are **Rust first** (Mzizi Roots): the
   answer's `lead` says which implementation to present first. If the name is not found, call
   `mzizi_search` with it and suggest the closest matches.
2. If `lead` is `"rust"`, present the Rust implementation first, from `rust`: the crate
   (`rust.crate.name`) and its `cargo add` line (`rust.install.cargo`), the component's
   `rust.contract` clauses when present, and the `.rs` source path from `rust.files`.
3. Then the other builds. An Astro build installs with `mzizi add $ARGUMENTS --target astro`
   (`@nyuchi/mzizi-cli`). The React build is deprioritised (it keeps working; new work goes to
   Rust) and installs with `npx shadcn@latest add https://api.mzizi.dev/v1/ui/$ARGUMENTS`. The full
   URL is mandatory: a bare `npx shadcn add $ARGUMENTS` installs shadcn's own component and
   reports success.
4. If the component has a contract in the registry's `contracts/` (every `@bundu/ui`
   component does), say so: the contract is the specification, and any change starts there.
5. Summarise: the node it sits on (N1–N8), its owner, its dependencies and any usage notes.
   Pass `include: ["docs"]` for use cases, variants and accessibility notes.

If the component is a shell (`app-shell`, `discover-shell`), remind the user it is mounted once
per app, in one layout every page uses (the `mzizi-architecture` skill).
