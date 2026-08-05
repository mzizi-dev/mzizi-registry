#!/usr/bin/env -S tsx
/**
 * ONE-TIME migration: move component docs metadata out of Supabase and into
 * `registry.json`, where the rest of the component's contract already lives.
 *
 *   pnpm tsx scripts/migrate-registry-meta.ts          # write
 *   pnpm tsx scripts/migrate-registry-meta.ts --check  # report, change nothing
 *
 * WHY THIS EXISTS, AND WHY IT RUNS ONCE.
 *
 * `use_cases`, `variants`, `sizes`, `features`, `a11y`, `examples` and `demo` were the
 * last authored content still living only in `component_documents`. They are the
 * component's documented contract — what it is for, how it varies, what it guarantees
 * for a screen reader — which is exactly the category that belongs in a file a reviewer
 * can diff, next to `dependencies` and `files`.
 *
 * They go into `registry.json` under a single `meta` key rather than scattered across
 * the item. `registry.json` declares the shadcn registry schema, and one namespaced
 * object keeps the shadcn-owned surface (`name`, `type`, `dependencies`,
 * `registryDependencies`, `files`) untouched, so `npx shadcn add` cannot be affected by
 * fields it does not know about.
 *
 * After this runs, `registry.json` is AUTHORED, not generated. Editing a component's
 * use cases is a pull request against this file. That is the point — the previous
 * arrangement had no reviewable home for them at all.
 *
 * This script is deliberately not wired into package.json: it reads a table that is
 * being dropped, so it is a migration, not a pipeline. It is kept for provenance.
 */

import { readFile, writeFile } from "fs/promises"
import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { createClient } from "@supabase/supabase-js"

const MANIFEST = join(process.cwd(), "registry.json")

/** The authored fields being moved. `examples` is included though currently empty. */
const META_FIELDS = ["use_cases", "variants", "sizes", "features", "a11y", "examples"] as const

type Meta = {
  useCases?: string[]
  variants?: string[]
  sizes?: string[]
  features?: string[]
  a11y?: string[]
  examples?: unknown[]
  hasDemo?: boolean
  /**
   * Who authors this component — `bundu` | `nyuchi` | `mzizi` | `framework`.
   * A real classification the MCP filters on, and a column rather than a
   * document field, which is why it needs carrying separately.
   */
  owner?: string
  /**
   * The document-store collection (`primitives`, `brand`, `styling-libs`, …).
   *
   * Kept even though the node is derived from the directory on disk, because the
   * two are not the same granularity: N2 holds `primitives`, `ecommerce` and
   * more, and collapsing them onto the node would lose the distinction the
   * `mzizi://nodes` resource reports.
   */
  collection?: string
}

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

const asStrings = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
  return out.length ? out : undefined
}

/** `demo` is `{ has_demo, demo_type }` in the document, or a bare truthy value. */
function readHasDemo(document: Record<string, unknown>): boolean | undefined {
  const demo = document.demo
  if (demo === undefined || demo === null) return undefined
  if (typeof demo === "object") return Boolean((demo as Record<string, unknown>).has_demo)
  return Boolean(demo)
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.error("[mzizi] migrate-registry-meta: Supabase URL + anon key required.")
    process.exit(1)
  }
  const check = process.argv.slice(2).includes("--check")
  const supabase = createClient(url, key)

  // Page through — the table is larger than PostgREST's default ceiling.
  const rows: {
    name: string
    collection: string | null
    owner: string | null
    document: Record<string, unknown> | null
  }[] = []
  const PAGE = 500
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("component_documents")
      .select("name, collection, owner, document")
      .order("name")
      .range(from, from + PAGE - 1)
    if (error) {
      console.error(`[mzizi] migrate-registry-meta: query failed — ${error.message}`)
      process.exit(1)
    }
    if (!data?.length) break
    rows.push(...(data as typeof rows))
    if (data.length < PAGE) break
  }

  // Only rows that are installable components; a non-null `kind` is something else.
  type Row = { document: Record<string, unknown>; collection: string | null; owner: string | null }
  const byName = new Map<string, Row>()
  for (const r of rows) {
    const doc = r.document ?? {}
    if (typeof doc.kind === "string" && doc.kind.length > 0) continue
    byName.set(r.name, { document: doc, collection: r.collection, owner: r.owner })
  }

  const manifest = JSON.parse(await readFile(MANIFEST, "utf8")) as {
    items: Array<Record<string, unknown> & { name: string; meta?: Meta }>
  }

  let enriched = 0
  let missing = 0
  const counts: Record<string, number> = {}

  for (const item of manifest.items) {
    const row = byName.get(item.name)
    if (!row) {
      missing++
      continue
    }
    const doc = row.document

    const meta: Meta = {}
    for (const field of META_FIELDS) {
      const value =
        field === "examples" ? (doc.examples as unknown[] | undefined) : asStrings(doc[field])
      if (!value || (Array.isArray(value) && value.length === 0)) continue
      const camel = field === "use_cases" ? "useCases" : field
      ;(meta as Record<string, unknown>)[camel] = value
      counts[camel] = (counts[camel] ?? 0) + 1
    }
    const hasDemo = readHasDemo(doc)
    if (hasDemo !== undefined) {
      meta.hasDemo = hasDemo
      counts.hasDemo = (counts.hasDemo ?? 0) + 1
    }
    if (row.owner) {
      meta.owner = row.owner
      counts.owner = (counts.owner ?? 0) + 1
    }
    if (row.collection) {
      meta.collection = row.collection
      counts.collection = (counts.collection ?? 0) + 1
    }

    if (Object.keys(meta).length > 0) {
      if (!check) item.meta = meta
      enriched++
    }
  }

  const summary =
    `${enriched} item(s) with meta, ${missing} manifest item(s) absent from the database — ` +
    Object.entries(counts)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join(" ")

  if (check) {
    console.log(`[mzizi] migrate-registry-meta --check — would enrich ${summary}`)
    return
  }

  // Match the byte-for-byte shape `registry:verify` compares against.
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8")
  console.log(`[mzizi] migrate-registry-meta — ${summary}`)
}

main().catch((err) => {
  console.error("[mzizi] migrate-registry-meta failed:", err)
  process.exit(1)
})
