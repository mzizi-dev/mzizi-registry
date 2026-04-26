/**
 * `nyuchi-design init` — scaffold a consumer app with the canonical
 * Nyuchi Design bootstrap files.
 *
 * Writes (idempotently — skips files that already exist unless `force`):
 *   - app/globals.css                 (the L1 token block)
 *   - lib/utils.ts                    (the cn() helper)
 *   - components/theme-provider.tsx   (next-themes wrapper)
 *   - components.json                 (shadcn CLI config)
 *
 * Implementation detail: the canonical content lives in
 * `packages/design-cli/templates/` and is bundled into the published
 * tarball via the `files` field in package.json. The CLI resolves the
 * template directory relative to its own location at runtime.
 */

import { existsSync, mkdirSync, copyFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import kleur from "kleur"

const __dirname = dirname(fileURLToPath(import.meta.url))

interface InitOptions {
  /** Target directory (defaults to process.cwd()) */
  cwd?: string
  /** Overwrite files that already exist */
  force?: boolean
}

interface TemplateMapping {
  /** Path inside `packages/design-cli/templates/` */
  template: string
  /** Destination path relative to the consumer's project root */
  dest: string
  /** Human-readable description for the CLI output */
  label: string
}

const MAPPINGS: TemplateMapping[] = [
  { template: "globals.css", dest: "app/globals.css", label: "L1 design tokens" },
  { template: "utils.ts", dest: "lib/utils.ts", label: "cn() helper" },
  {
    template: "theme-provider.tsx",
    dest: "components/theme-provider.tsx",
    label: "next-themes wrapper",
  },
  { template: "components.json", dest: "components.json", label: "shadcn CLI config" },
]

export async function runInit(options: InitOptions = {}): Promise<{
  written: string[]
  skipped: string[]
}> {
  const cwd = options.cwd ?? process.cwd()
  const force = options.force ?? false
  // Templates ship inside the package (resolved relative to dist/commands)
  const templatesDir = resolve(__dirname, "../../templates")

  const written: string[] = []
  const skipped: string[] = []

  for (const mapping of MAPPINGS) {
    const src = join(templatesDir, mapping.template)
    const dest = join(cwd, mapping.dest)

    if (existsSync(dest) && !force) {
      skipped.push(mapping.dest)
      console.log(kleur.gray(`  skip   ${mapping.dest}  (exists)`))
      continue
    }

    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(src, dest)
    written.push(mapping.dest)
    console.log(kleur.green(`  write  ${mapping.dest}`) + kleur.gray(`  (${mapping.label})`))
  }

  if (written.length > 0) {
    console.log()
    console.log(kleur.bold("Next steps:"))
    console.log(
      `  npx @nyuchi/design-cli add ${kleur.cyan("button")}    ${kleur.gray("# install components")}`
    )
    console.log(
      `  npx @nyuchi/design-cli skills install      ${kleur.gray("# install agent skills")}`
    )
  }
  if (skipped.length > 0 && !force) {
    console.log()
    console.log(kleur.gray(`Re-run with --force to overwrite ${skipped.length} existing file(s).`))
  }

  return { written, skipped }
}
