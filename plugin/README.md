# The `mzizi` Claude Code plugin

The public plugin: Mzizi's agent skills and the Mzizi MCP. Markdown and an MCP connection only, so it ships no script and no hook module. (The dev workflow, its scripts and the house-rules hooks are a second plugin, `mzizi-dev`, below.)

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

## The seven skills, and where the other five are

`skills/` holds `mzizi-language`, `mzizi-roots`, `mzizi-design`, `mukoko-design`, `mzizi-backend`, `mzizi-architecture` and `discoverability`. The other five skills in `@nyuchi/mzizi-skills` (`digital-hygiene`, `progress-report`, `ship-release`, `registry-propagation`, `pr-gates`) are dev workflow, and three of them ship shell scripts. They live in the `mzizi-dev` plugin (`plugin-dev/`), so this plugin carries nothing that runs on your machine.

`mukoko-design` keeps the PNG and SVG forms of its favicon and drops `favicon.ico`, which a plugin directory cannot inspect. The npm package still ships it.

## Also install the dev plugin

```text
/plugin install mzizi-dev@mzizi
```

See [`plugin-dev/README.md`](../plugin-dev/README.md).

## Privacy

The plugin connects to the Mzizi MCP at `https://mcp.mzizi.dev/mcp`. The privacy notice is [bundu.org/legal/privacy](https://www.bundu.org/legal/privacy).
