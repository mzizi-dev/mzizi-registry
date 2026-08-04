#!/usr/bin/env -S tsx
/**
 * Extract every component document out of Supabase and into this repo.
 *
 *   pnpm registry:extract   — write content/registry/<collection>/<name>.json
 *   pnpm registry:extracted:verify — non-mutating; fail if a file drifted
 *
 * WHY: the architecture is that the Next.js app builds the registry at build time
 * and serves it over /api/v1/*, and the MCP is an HTTP client of that API. The
 * database is not in that path. Component SOURCE already lives on disk
 * (docs/component-source-migration.md); this moves the document that wraps it —
 * description, dependencies, registryDependencies, files[], node, collection, owner,
 * status, docs, demo — so the whole component is a file.
 *
 * Once /api/v1/* reads these and mzizi-mcp reads /api/v1 instead of Supabase, the
 * `component_documents` table has no readers left and goes.
 *
 * JSON, not MDX: a component document is structured metadata with no prose body, and
 * `registry.json` beside it is already JSON. Doctrine went to MDX because doctrine is
 * prose; this is not.
 */

import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { createClient } from "@supabase/supabase-js"

const REGISTRY_ROOT = join(process.cwd(), "content", "registry")

/**
 * Collections that hold components. Doctrine collections are excluded — those are
 * MDX under content/doctrine (§15.17) and must not be duplicated here.
 */
const EXCLUDED = new Set([
  "ai-instructions",
  "changelog",
  "documentation-architecture-cloud",
  "documentation-architecture-data",
  "documentation-architecture-data-ownership",
  "documentation-architecture-framework",
  "documentation-architecture-nodes",
  "documentation-architecture-pipeline",
  "documentation-architecture-principles",
  "documentation-architecture-removed",
  "documentation-architecture-sovereignty",
  "documentation-architecture-strands",
  "genetic-code-conventions",
  "genetic-code-ubuntu-pillars",
  "genetic-code-ubuntu-principles",
  "mcp-tool-registry",
  "skills",
  "versions",
])

/**
 * Never written to disk. `source_code` is the one that matters: component source is
 * git-owned and read from components/registry/ via lib/registry-source.ts. It is null
 * on every row today, and writing it here would recreate the second copy the source
 * migration removed — §6.1, "not source, not a snapshot, not an archive blob".
 */
const DROP_KEYS = new Set([
  "source_code",
  "sourceCode",
  "mongodb_doc_id",
  "scylladb_doc_id",
  "cassandra_doc_id",
  "edge_doc_id",
])

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

/** Strip dropped keys anywhere in the document, including nested. */
function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub)
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (DROP_KEYS.has(k)) continue
      out[k] = scrub(v)
    }
    return out
  }
  return value
}

/** Stable key order so re-running produces no diff. */
function stableStringify(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort)
    if (v && typeof v === "object") {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = sort((v as Record<string, unknown>)[k])
          return acc
        }, {})
    }
    return v
  }
  return JSON.stringify(sort(value), null, 2) + "\n"
}

function safeName(name: string): string {
  // Component names are already slug-like, but the collection is a directory and a
  // name containing a separator would escape it.
  return name.replace(/[/\\]/g, "-")
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.error("[mzizi] registry:extract — Supabase URL + anon key required.")
    process.exit(1)
  }

  const check = process.argv.slice(2).includes("--check")
  const supabase = createClient(url, key)

  // Page through: the table is larger than PostgREST's default ceiling.
  const rows: { name: string; collection: string; node: number; document: unknown }[] = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("component_documents")
      .select("name, collection, node, document")
      .order("collection")
      .order("name")
      .range(from, from + PAGE - 1)
    if (error) {
      console.error(`[mzizi] registry:extract — query failed: ${error.message}`)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    rows.push(...(data as typeof rows))
    if (data.length < PAGE) break
  }

  const components = rows.filter((r) => !EXCLUDED.has(r.collection))
  const drifted: string[] = []
  let written = 0

  for (const row of components) {
    const doc = scrub(row.document ?? {}) as Record<string, unknown>
    // Collection and node are the file's location and a queryable field; keep both.
    const payload = stableStringify({ ...doc, collection: row.collection, node: row.node })
    const path = join(REGISTRY_ROOT, row.collection, `${safeName(row.name)}.json`)

    if (check) {
      if (!existsSync(path)) {
        drifted.push(`missing: content/registry/${row.collection}/${safeName(row.name)}.json`)
        continue
      }
      if ((await readFile(path, "utf8")) !== payload) {
        drifted.push(`changed: content/registry/${row.collection}/${safeName(row.name)}.json`)
      }
      continue
    }

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, payload, "utf8")
    written++
  }

  if (check) {
    if (drifted.length) {
      console.error(`[mzizi] registry:extracted:verify — ${drifted.length} file(s) drifted:`)
      for (const d of drifted.slice(0, 20)) console.error(`  ${d}`)
      process.exit(1)
    }
    console.log(`[mzizi] registry:extracted:verify — ${components.length} file(s) match.`)
    return
  }

  const collections = new Set(components.map((c) => c.collection))
  console.log(
    `[mzizi] registry:extract — wrote ${written} component document(s) across ` +
      `${collections.size} collection(s); skipped ${rows.length - components.length} ` +
      `doctrine/version/registry row(s).`
  )
}

main().catch((err) => {
  console.error("[mzizi] registry:extract failed:", err)
  process.exit(1)
})
