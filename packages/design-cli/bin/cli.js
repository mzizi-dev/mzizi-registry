#!/usr/bin/env node
/**
 * @nyuchi/design-cli — argv dispatch shim.
 *
 * Tiny native-only argv parser; no external dependency. Delegates to
 * the compiled handlers in dist/.
 */

import { runInit, runAdd, runSkillsInstall, runSkillsUpdate, VERSION } from "../dist/index.js"

const HELP = `nyuchi-design — Nyuchi Design CLI v${VERSION}

usage:
  nyuchi-design init [--force]
  nyuchi-design add <component> [<component>...]
  nyuchi-design skills install [<name>]
  nyuchi-design skills update
  nyuchi-design --help
  nyuchi-design --version

commands:
  init                Scaffold a fresh project with the canonical
                      Nyuchi Design bootstrap files (globals.css,
                      lib/utils.ts, theme-provider, components.json).
                      Idempotent; pass --force to overwrite.
  add <component...>  Install one or more components from the registry,
                      pinned to https://design.nyuchi.com/api/v1/ui.
                      Wraps \`npx shadcn@latest add\`.
  skills install      Fetch every published skill from /api/v1/skills
                      and write to ./.claude/skills/. Pass a name to
                      install a single skill.
  skills update       Re-fetch the skill index, diff against local
                      manifest, rewrite only changed skills.

source of truth: https://design.nyuchi.com
issues: https://github.com/nyuchi/design-portal/issues
`

async function main(argv) {
  const args = argv.slice(2)
  const cmd = args[0]
  const rest = args.slice(1)

  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(HELP)
    return 0
  }
  if (cmd === "--version" || cmd === "-v") {
    console.log(VERSION)
    return 0
  }

  switch (cmd) {
    case "init": {
      const force = rest.includes("--force")
      await runInit({ force })
      return 0
    }
    case "add": {
      const components = rest.filter((a) => !a.startsWith("--"))
      const passthrough = rest.filter((a) => a.startsWith("--"))
      const { exitCode } = await runAdd(components, { passthrough })
      return exitCode
    }
    case "skills": {
      const sub = rest[0]
      if (sub === "install") {
        const name = rest[1] && !rest[1].startsWith("--") ? rest[1] : undefined
        await runSkillsInstall(name)
        return 0
      }
      if (sub === "update") {
        await runSkillsUpdate()
        return 0
      }
      console.error(`error: unknown skills subcommand: ${sub ?? "(none)"}`)
      console.error(HELP)
      return 1
    }
    default:
      console.error(`error: unknown command: ${cmd}`)
      console.error(HELP)
      return 1
  }
}

main(process.argv)
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err.message ?? err)
    process.exit(1)
  })
