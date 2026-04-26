/**
 * `nyuchi-design add <component...>` — thin wrapper over the shadcn CLI
 * pinned to the Nyuchi Design Portal registry.
 *
 * Translates `nyuchi-design add button card` into:
 *   npx shadcn@latest add \
 *     https://design.nyuchi.com/api/v1/ui/button \
 *     https://design.nyuchi.com/api/v1/ui/card
 *
 * The shadcn CLI handles all the actual file writing, dependency
 * resolution, and registry-format parsing — this wrapper just spares
 * the consumer from typing the registry URL every time.
 */

import { spawn } from "node:child_process"
import kleur from "kleur"

const REGISTRY_BASE = "https://design.nyuchi.com/api/v1/ui"
const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

interface AddOptions {
  /** Pass-through flags forwarded to `shadcn add` (e.g. `--overwrite`) */
  passthrough?: string[]
}

export async function runAdd(
  components: string[],
  options: AddOptions = {}
): Promise<{ exitCode: number }> {
  if (components.length === 0) {
    console.error(kleur.red("error: no components specified"))
    console.error(`usage: nyuchi-design add <component> [<component>...]`)
    return { exitCode: 1 }
  }

  const invalid = components.filter((c) => !COMPONENT_NAME_PATTERN.test(c))
  if (invalid.length > 0) {
    console.error(
      kleur.red(`error: invalid component name${invalid.length > 1 ? "s" : ""}: `) +
        invalid.join(", ")
    )
    console.error(kleur.gray(`names must match /^[a-z][a-z0-9-]*$/`))
    return { exitCode: 1 }
  }

  const urls = components.map((c) => `${REGISTRY_BASE}/${c}`)
  const args = ["shadcn@latest", "add", ...urls, ...(options.passthrough ?? [])]

  console.log(kleur.gray(`$ npx ${args.join(" ")}`))

  return new Promise((resolvePromise) => {
    const child = spawn("npx", args, { stdio: "inherit" })
    child.on("error", (err) => {
      console.error(kleur.red(`error: failed to spawn shadcn CLI: ${err.message}`))
      resolvePromise({ exitCode: 1 })
    })
    child.on("exit", (code) => resolvePromise({ exitCode: code ?? 0 }))
  })
}
