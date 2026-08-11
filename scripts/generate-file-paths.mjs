#!/usr/bin/env node
/**
 * Make `files[].path` mean what shadcn says it means, and move the install destination to
 * `files[].target`.
 *
 *   pnpm registry:paths          rewrite registry.json
 *   pnpm registry:paths --check  fail if it is out of date (CI)
 *
 * WHY THIS EXISTS
 *
 * shadcn's registry-item schema is explicit about the two fields:
 *
 *   path    the SOURCE location of the file inside the registry repository
 *   target  the DESTINATION path in the consumer's project
 *
 * This registry had it backwards. Every item declared `path: "components/ui/button.tsx"` —
 * the place the file should LAND — and no `target`. The real file is at
 * `components/registry/n2-primitives/button.tsx`.
 *
 * Nothing caught it because our own API never reads `path` as a source: `/api/v1/ui/{name}`
 * resolves the source by component NAME and inlines the content, so the wrong `path` was
 * only ever used by the CLI as a destination hint — and the destination it derives from a
 * `registry:ui` type plus that basename happens to be the same string. Right answer, wrong
 * mechanism, and it only holds while every item's type implies its folder.
 *
 * It is not cosmetic. `shadcn registry validate nyuchi/mzizi` fails on all 574 items, and
 * GitHub registries — `npx shadcn add nyuchi/mzizi/button`, which needs no API, no worker
 * and no deploy — resolve files straight out of the repository at `path`. With the wrong
 * path, that entire distribution channel is closed.
 *
 * GENERATED, NEVER HAND-EDITED. The source path is a fact about where the file is on disk,
 * so hand-writing it creates a second copy that drifts the moment a component moves between
 * node directories. `--check` gates it in CI.
 */

import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs"
import { join, extname, basename } from "node:path"

const ROOT = process.cwd()
const SOURCE_ROOT = join(ROOT, "components", "registry")
const REGISTRY = join(ROOT, "registry.json")

/**
 * Extension preference, identical to `PRIMARY_EXTENSIONS` in `lib/registry.ts`.
 *
 * A component may have several implementations under one name (`button.tsx` + `button.rs`).
 * `/api/v1/ui/{name}` serves the React one, so the React one is the source path here. If the
 * two disagreed, the manifest would advertise a file the API does not serve.
 */
const PRIMARY = ["tsx", "ts", "jsx", "js"]

const rank = (e) => {
  const i = PRIMARY.indexOf(e)
  return i === -1 ? PRIMARY.length : i
}

/** Repo-relative primary source path for every component name on disk. */
function readSourceIndex() {
  const index = new Map()
  if (!existsSync(SOURCE_ROOT)) return index
  for (const dir of readdirSync(SOURCE_ROOT)) {
    const dirPath = join(SOURCE_ROOT, dir)
    if (!/^n\d+-/.test(dir) || !statSync(dirPath).isDirectory()) continue
    for (const file of readdirSync(dirPath)) {
      if (!statSync(join(dirPath, file)).isFile()) continue
      const name = basename(file, extname(file))
      const ext = extname(file).replace(/^\./, "").toLowerCase()
      const rel = `components/registry/${dir}/${file}`
      const existing = index.get(name)
      if (!existing) {
        index.set(name, { rel, ext })
        continue
      }
      if (rank(ext) < rank(existing.ext)) index.set(name, { rel, ext })
    }
  }
  return index
}

function main() {
  const check = process.argv.includes("--check")
  const sources = readSourceIndex()
  const manifest = JSON.parse(readFileSync(REGISTRY, "utf8"))

  const problems = []
  let changed = 0
  let dataItems = 0

  for (const item of manifest.items ?? []) {
    const files = item.files ?? []
    if (!files.length) {
      // A data item (registry:theme) carries cssVars/css and no file. Nothing to path.
      dataItems++
      continue
    }
    const src = sources.get(item.name)
    if (!src) {
      problems.push(`${item.name}: no source file on disk under components/registry/`)
      continue
    }
    for (const file of files) {
      // The destination is whatever the item already installed to. Preserving it is the
      // whole safety property of this change: every consumer that ran `shadcn add` before
      // gets the same file in the same place after.
      const target = file.target ?? file.path
      if (file.path !== src.rel || file.target !== target) changed++
      file.path = src.rel
      file.target = target
    }
  }

  if (problems.length) {
    console.error("✖ cannot generate file paths:")
    for (const p of problems) console.error(`  ${p}`)
    process.exit(1)
  }

  if (check) {
    if (changed > 0) {
      console.error(
        `✖ ${changed} registry file entr(ies) have a stale source path or a missing target.\n` +
          "  Run `pnpm registry:paths` and commit the result."
      )
      process.exit(1)
    }
    console.log(
      `✓ files[].path points at the real source and files[].target at the install ` +
        `destination (${(manifest.items ?? []).length - dataItems} filed items).`
    )
    return
  }

  writeFileSync(REGISTRY, JSON.stringify(manifest, null, 2) + "\n")
  console.log(
    `✓ rewrote ${changed} file entr(ies): path → source on disk, target → install destination.`
  )
}

main()
