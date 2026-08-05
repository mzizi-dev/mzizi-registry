#!/usr/bin/env -S tsx
/**
 * Normalise `registry.json` — the authored component manifest.
 *
 *   pnpm registry:normalize   — rewrite it in canonical form
 *   pnpm registry:verify      — non-mutating; exit non-zero if it is not canonical
 *
 * WHAT THIS REPLACED, AND WHY.
 *
 * This script used to REGENERATE `registry.json` from the Supabase `components`
 * view: read every row, project six fields, write the file, and fail CI when the
 * committed copy disagreed. `registry.json` was a snapshot; the database was the
 * source of truth.
 *
 * That is no longer true, and keeping the old direction would now be actively
 * destructive. Component source is on disk (docs/component-source-migration.md)
 * and the manifest carries authored `meta` — use cases, variants, sizes, features,
 * a11y notes — that no database row holds any more. Regenerating from Supabase
 * would silently delete all of it on the next run.
 *
 * So the manifest is AUTHORED. Editing a component's description, dependencies or
 * use cases is a pull request against this file, where a reviewer and a diff can
 * see it — which is the same rule that moved source out of a JSON column.
 *
 * WHAT "NORMALISE" MEANS, AND WHAT IT DELIBERATELY DOES NOT CHECK.
 *
 * Only canonical FORM: keys sorted, items sorted by name, two-space indent, one
 * trailing newline. That makes a diff show what actually changed instead of a
 * reordering, and it is the whole job.
 *
 * It does NOT check that items resolve on disk, that dependencies are
 * installable, or that the shape satisfies the shadcn CLI. `pnpm
 * registry:validate` (scripts/validate-registry.mjs) asks every one of those
 * consumer-facing questions, offline, and is the gate that catches a broken
 * install. Two scripts because they answer two questions: this one asks "is the
 * file tidy", that one asks "does it work".
 *
 * No credentials and no network — a missing secret must never be why a
 * malformed manifest ships.
 */

import { readFile, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { join } from "path"

const REGISTRY_PATH = join(process.cwd(), "registry.json")

function sortKeys<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(sortKeys) as unknown as T
  if (obj && typeof obj === "object") {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key])
    }
    return sorted as T
  }
  return obj
}

type Manifest = {
  $schema?: string
  name?: string
  homepage?: string
  items?: Array<{ name: string } & Record<string, unknown>>
}

function canonicalise(manifest: Manifest): string {
  const items = [...(manifest.items ?? [])].sort((a, b) => a.name.localeCompare(b.name))
  // The header keys stay where the shadcn schema expects them; only the body is
  // key-sorted, so `$schema` does not end up buried under `homepage`.
  const payload = {
    $schema: manifest.$schema ?? "https://ui.shadcn.com/schema/registry.json",
    name: manifest.name ?? "mzizi",
    homepage: manifest.homepage ?? "https://mzizi.dev",
    items: items.map((item) => sortKeys(item)),
  }
  return JSON.stringify(payload, null, 2) + "\n"
}

async function main() {
  const check = process.argv.slice(2).includes("--check")

  if (!existsSync(REGISTRY_PATH)) {
    console.error(
      "✖ registry.json is missing. It is authored, not generated — restore it from git."
    )
    process.exit(1)
  }

  const raw = await readFile(REGISTRY_PATH, "utf-8")
  let manifest: Manifest
  try {
    manifest = JSON.parse(raw) as Manifest
  } catch (e) {
    console.error(`✖ registry.json is not valid JSON — ${(e as Error).message}`)
    process.exit(1)
  }

  if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
    console.error("✖ registry.json has no items[].")
    process.exit(1)
  }

  const canonical = canonicalise(manifest)

  if (check) {
    if (raw !== canonical) {
      console.error("✖ registry.json is not in canonical form.")
      console.error("  Run `pnpm registry:normalize` and commit the result.")
      process.exit(1)
    }
    console.log(`✓ registry.json is canonical (${manifest.items.length} items).`)
    return
  }

  await writeFile(REGISTRY_PATH, canonical, "utf-8")
  console.log(`✓ registry.json normalised (${manifest.items.length} items)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
