#!/usr/bin/env -S tsx
/**
 * Extract doctrine + long-form documentation out of Supabase and into this repo
 * as MDX with YAML frontmatter.
 *
 * Modes:
 *   pnpm doctrine:extract          — write content/doctrine/**\/*.mdx from the DB
 *   pnpm doctrine:verify           — non-mutating; exit non-zero if a file drifted
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (the doctrine
 * collections are RLS public-read, so the anon key is enough — this script never
 * writes to the database).
 *
 * Why this exists: doctrine is prose, and prose held in a JSON column is
 * invisible to the toolchain. An MDX file passes through the build, so a
 * doctrine page that references a retired model or a route that moved becomes a
 * build error instead of something a reader notices months later. This is the
 * same argument that moved component source onto disk
 * (docs/component-source-migration.md), applied to the documentation rung.
 *
 * WHAT IS DELIBERATELY NOT EXTRACTED: rows whose `kind` is null. Those are
 * installable components (1 in `documentation`, 4 in `documentation-engine`)
 * whose source already lives under components/registry/. Writing them here
 * would recreate the two-copies defect the source migration removed.
 */

import { writeFile, mkdir, readFile } from "fs/promises"
import { existsSync } from "fs"
import { join, dirname } from "path"
import { createClient } from "@supabase/supabase-js"

const CONTENT_ROOT = join(process.cwd(), "content", "doctrine")

/** Collections that hold doctrine or prose rather than components. */
const DOCTRINE_COLLECTIONS = [
  "ai-instructions",
  "documentation",
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
] as const

/**
 * Fields that carry the prose body, in preference order. The first one present
 * and non-empty becomes the MDX body; the rest stay in frontmatter so nothing is
 * silently dropped.
 */
const BODY_FIELDS = ["content", "body", "body_mdx", "instruction_text", "rationale"] as const

/**
 * Dropped from frontmatter. These are storage plumbing, not doctrine: the
 * per-engine pointer columns are null on every row (artifacts of a multi-store
 * plan that never shipped), and `_id` / `collection` are recoverable from the
 * file's own path.
 */
const DROP_KEYS = new Set([
  "_id",
  "collection",
  "mongodb_doc_id",
  "scylladb_doc_id",
  "cassandra_doc_id",
  "edge_doc_id",
  "legacy",
])

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local")
  if (!existsSync(p)) return
  for (const line of require("fs").readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

function slugify(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * True when a rendered value belongs on the same line as its key. Empty
 * collections render as `[]` / `{}` and must stay inline — emitting `key:[]`
 * with no space is not valid YAML.
 */
function isInline(value: unknown, rendered: string): boolean {
  if (rendered === "[]" || rendered === "{}") return true
  if (rendered.startsWith("|-")) return true
  return !(typeof value === "object" && value !== null)
}

/** Minimal YAML emitter — enough for scalars, string arrays and nested objects. */
function toYaml(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent)
  if (value === null || value === undefined) return "null"
  if (typeof value === "boolean" || typeof value === "number") return String(value)
  if (typeof value === "string") {
    // Block scalar for anything multi-line so the YAML stays readable.
    if (value.includes("\n")) {
      const body = value
        .split("\n")
        .map((l) => (l.length ? `${pad}  ${l}` : ""))
        .join("\n")
      return `|-\n${body}`
    }
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    return `\n${value
      .map((v) => {
        const rendered = toYaml(v, indent + 1)
        return typeof v === "object" && v !== null && !Array.isArray(v)
          ? `${pad}-\n${rendered}`
          : `${pad}- ${rendered}`
      })
      .join("\n")}`
  }
  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) return "{}"
  return `\n${entries
    .map(([k, v]) => {
      const rendered = toYaml(v, indent + 1)
      return isInline(v, rendered) ? `${pad}  ${k}: ${rendered}` : `${pad}  ${k}:${rendered}`
    })
    .join("\n")}`
}

function renderMdx(doc: Record<string, unknown>): { slug: string; body: string } {
  const front: Record<string, unknown> = {}
  let prose = ""
  let proseField: string | null = null

  for (const field of BODY_FIELDS) {
    const v = doc[field]
    if (typeof v === "string" && v.trim().length > 0) {
      prose = v.trim()
      proseField = field
      break
    }
  }

  for (const [k, v] of Object.entries(doc)) {
    if (DROP_KEYS.has(k)) continue
    if (k === proseField) continue
    if (v === null || v === undefined) continue
    if (Array.isArray(v) && v.length === 0) continue
    front[k] = v
  }

  // Record WHICH field became the body, so a reader can put it back. Without this
  // the move is lossy in a way nothing would catch: `rationale` and `instruction_text`
  // silently stop existing as fields, and any consumer casting frontmatter back to a
  // row type gets an object missing its main prose.
  if (proseField) front._bodyField = proseField

  // Deterministic key order so re-running produces no diff.
  const ordered = Object.keys(front)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => ((acc[k] = front[k]), acc), {})

  const yaml = Object.entries(ordered)
    .map(([k, v]) => {
      const rendered = toYaml(v, 0)
      return isInline(v, rendered) ? `${k}: ${rendered}` : `${k}:${rendered}`
    })
    .join("\n")

  const slugSource =
    (doc.slug as string) || (doc.name as string) || (doc.title as string) || (doc._id as string)

  return {
    slug: slugify(String(slugSource)),
    body: `---\n${yaml}\n---\n\n${prose}${prose.endsWith("\n") ? "" : "\n"}`,
  }
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    console.error(
      "[mzizi] extract-doctrine: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are required."
    )
    process.exit(1)
  }

  const check = process.argv.slice(2).includes("--check")
  const supabase = createClient(url, key)

  const { data, error } = await supabase
    .from("component_documents")
    .select("name, collection, node, document")
    .in("collection", DOCTRINE_COLLECTIONS as unknown as string[])

  if (error) {
    console.error(`[mzizi] extract-doctrine: query failed — ${error.message}`)
    process.exit(1)
  }

  // `kind: null` marks an installable component, never doctrine. Those rows keep
  // their source under components/registry/ and must not be written here.
  const rows = (data ?? []).filter((r) => {
    const kind = (r.document as Record<string, unknown> | null)?.kind
    return typeof kind === "string" && kind.length > 0
  })

  const skipped = (data ?? []).length - rows.length
  const drifted: string[] = []
  let written = 0

  for (const row of rows) {
    const doc = row.document as Record<string, unknown>
    const { slug, body } = renderMdx(doc)
    const path = join(CONTENT_ROOT, row.collection, `${slug}.mdx`)

    if (check) {
      if (!existsSync(path)) {
        drifted.push(`missing: content/doctrine/${row.collection}/${slug}.mdx`)
        continue
      }
      const onDisk = await readFile(path, "utf8")
      if (onDisk !== body) drifted.push(`changed: content/doctrine/${row.collection}/${slug}.mdx`)
      continue
    }

    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, body, "utf8")
    written++
  }

  if (check) {
    if (drifted.length) {
      console.error(`[mzizi] doctrine:verify — ${drifted.length} file(s) drifted from the DB:`)
      for (const d of drifted) console.error(`  ${d}`)
      process.exit(1)
    }
    console.log(`[mzizi] doctrine:verify — ${rows.length} file(s) match the database.`)
    return
  }

  console.log(
    `[mzizi] doctrine:extract — wrote ${written} MDX file(s) under content/doctrine/ ` +
      `(skipped ${skipped} component row(s) whose source lives on disk).`
  )
}

main().catch((err) => {
  console.error("[mzizi] extract-doctrine failed:", err)
  process.exit(1)
})
