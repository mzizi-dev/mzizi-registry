#!/usr/bin/env -S tsx
/**
 * Sync registry.json from the Supabase `components` table.
 *
 * Component SOURCE no longer lives in the database (see
 * docs/component-source-migration.md) and `components/ui/` no longer holds
 * registry components, so the old `--ui-only` projection of primitives onto disk
 * is gone — it would recreate the duplicates the migration removed. What remains
 * is the metadata snapshot.
 *
 * Modes:
 *   pnpm registry:sync              — regenerate registry.json + committed primitives
 *   pnpm registry:verify            — non-mutating; exit non-zero if registry.json drifts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to be set.
 *
 * Post-v4.0.26 the authoritative source of truth is the Supabase `components`
 * table. `registry.json` is a committed snapshot so PRs show registry deltas
 * clearly; `registry:verify` runs in CI to make sure the snapshot matches.
 * Only the ~35 primitives actually consumed by this Next.js app are written
 * into `components/ui/` — everything else in the DB is served via /api/v1/ui.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { join, dirname } from "path"
import { getAllComponents, getComponent, isSupabaseConfigured } from "../lib/db"

const REGISTRY_PATH = join(process.cwd(), "registry.json")
const REGISTRY_HEADER = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "mukoko",
  homepage: "https://mzizi.dev",
}

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    check: args.includes("--check"),
  }
}

function sortKeys<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(sortKeys) as unknown as T
  if (obj && typeof obj === "object") {
    const sorted: Record<string, unknown> = {}
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key])
    }
    return sorted as T
  }
  return obj
}

async function buildRegistryJson() {
  const components = await getAllComponents()
  const items = components
    .map((c) => ({
      name: c.name,
      type: c.registry_type,
      description: c.description,
      dependencies: c.dependencies ?? [],
      registryDependencies: c.registry_dependencies ?? [],
      files: c.files ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    ...REGISTRY_HEADER,
    items,
  }
}

async function writeRegistryJson(payload: unknown) {
  const serialised = JSON.stringify(payload, null, 2) + "\n"
  await writeFile(REGISTRY_PATH, serialised, "utf-8")
}

async function readRegistryJson(): Promise<string | null> {
  if (!existsSync(REGISTRY_PATH)) return null
  return readFile(REGISTRY_PATH, "utf-8")
}

async function main() {
  const args = parseArgs()

  if (!isSupabaseConfigured()) {
    console.error(
      "✖ Supabase env vars not set. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
    process.exit(1)
  }

  // Registry JSON
  {
    console.log("→ Building registry.json from Supabase…")
    const payload = sortKeys(await buildRegistryJson())
    const serialised = JSON.stringify(payload, null, 2) + "\n"

    if (args.check) {
      const existing = await readRegistryJson()
      if (existing !== serialised) {
        console.error("✖ registry.json is out of sync with the database.")
        console.error("  Run `pnpm registry:sync` and commit the result.")
        process.exit(1)
      }
      console.log("✓ registry.json matches the database.")
    } else {
      await writeRegistryJson(payload)
      console.log(
        `✓ registry.json written (${(payload as { items: unknown[] }).items.length} items)`
      )
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
