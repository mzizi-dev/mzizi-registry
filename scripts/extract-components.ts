/**
 * Extract component source out of Supabase and onto disk, one node at a time.
 *
 * See docs/component-source-migration.md. Source code is moving to the repo so
 * the toolchain can see it; every other field stays in the database. This is
 * the one-way door for a given node — run it, review the files, commit them.
 *
 *   pnpm components:extract --node 11
 *   pnpm components:extract --node 11 --check    # non-mutating drift gate
 *   pnpm components:extract --node 11 --dry-run  # print the plan, write nothing
 *
 * Reads through PostgREST with the ANON key, because `component_documents` is
 * RLS public-read. There is deliberately no service-role path — extraction is a
 * read, and a read never needs to outrank a policy.
 *
 * It reads `component_documents` DIRECTLY, not the `components` view. The view
 * lists only nine collections, so four more — `primitives` (228 components),
 * `styling-libs` (16), `documentation-engine` (4) and `documentation` (1) —
 * were invisible to it. Extracting through the view would have declared the
 * migration finished while 249 stable components were still database-only, and
 * a component the view hides is one `/api/v1/ui/{name}` answers 404 for, so the
 * omission was already costing consumers the ability to install them.
 *
 * Layout on disk mirrors the helix so a directory listing teaches the model:
 *
 *   components/registry/n11-discovery/nyuchi-seo.tsx
 *
 * NOTE the distinction that trips people up: the registry's `files[].path`
 * (e.g. "components/ui/nyuchi-seo.tsx") is where the shadcn CLI places the file
 * in a CONSUMER's project. It is not where the file lives here, and the two are
 * free to differ.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { existsSync } from "node:fs"
import { extname, join } from "node:path"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY

/** Node number → directory label. Matches `nodeLabel` in the registry. */
const NODE_LABELS: Record<number, string> = {
  1: "tokens",
  2: "primitives",
  3: "brand",
  4: "safety",
  5: "resilience",
  6: "pages",
  7: "shell",
  8: "assurance",
  9: "fundi",
  10: "documentation",
  11: "discovery",
}

const ROOT = join(process.cwd(), "components", "registry")

interface Row {
  name: string
  source_code: string | null
  ecosystem_node: number | null
  status: string | null
  files: { path: string; type: string }[] | null
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i === -1 ? undefined : process.argv[i + 1]
}

const hasFlag = (f: string) => process.argv.includes(f)

interface DocumentRow {
  name: string
  collection: string
  document: {
    source_code?: string | null
    node?: string | number | null
    status?: string | null
    files?: { path: string; type: string }[] | null
  } | null
}

/**
 * Every document at this node that carries source, whatever collection holds
 * it. `document->>'node'` is TEXT in the store, so the filter is a string
 * compare — `eq.2` matches, `eq.02` would not, and a numeric cast here would
 * make PostgREST reject rows whose node is empty rather than skip them.
 */
async function fetchNode(node: number): Promise<Row[]> {
  const rows: DocumentRow[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const url = new URL("/rest/v1/component_documents", SUPABASE_URL)
    url.searchParams.set("select", "name,collection,document")
    url.searchParams.set("document->>node", `eq.${node}`)
    url.searchParams.set("order", "name.asc")
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY!,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Range: `${from}-${from + pageSize - 1}`,
      },
    })
    if (!res.ok) {
      throw new Error(`registry read failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
    }
    const batch = (await res.json()) as DocumentRow[]
    rows.push(...batch)
    if (batch.length < pageSize) break
  }

  // Only documents that actually carry source are components to extract; the
  // node also holds version-history and descriptor rows, which are not files.
  const components = rows
    .filter((r) => typeof r.document?.source_code === "string")
    .map((r) => ({
      name: r.name,
      collection: r.collection,
      source_code: r.document!.source_code!,
      ecosystem_node: node,
      status: r.document!.status ?? null,
      files: r.document!.files ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // A node draws from several collections, and the file name is derived from
  // `name` alone — so two collections holding the same name would write one
  // file twice and silently keep whichever lost the race. Refuse instead: the
  // duplicate is a registry defect to reconcile, not something to pick between.
  const byName = new Map<string, string[]>()
  for (const c of components) byName.set(c.name, [...(byName.get(c.name) ?? []), c.collection])
  const clashes = [...byName.entries()].filter(([, cols]) => cols.length > 1)
  if (clashes.length > 0) {
    throw new Error(
      `N${node}: ${clashes.length} name(s) exist in more than one collection — ` +
        clashes.map(([n, cols]) => `${n} (${cols.join(" + ")})`).join(", ")
    )
  }

  return components
}

/**
 * A component whose source is empty is a real defect, not something to write as
 * an empty file — an empty .tsx would typecheck and silently serve nothing.
 */
function assertUsable(rows: Row[]): Row[] {
  const empty = rows.filter((r) => !r.source_code || r.source_code.trim().length === 0)
  if (empty.length > 0) {
    throw new Error(
      `${empty.length} component(s) have no source in the registry and cannot be extracted: ` +
        empty.map((r) => r.name).join(", ")
    )
  }
  return rows
}

/**
 * The file's extension comes from the registry's own `files[0].path`, not from a
 * blanket `.tsx`.
 *
 * It is not cosmetic. In a `.ts` file `<T>(x)` is a type assertion; in `.tsx`
 * the same characters open a JSX element — so writing a `registry:lib` module
 * into a `.tsx` file can change what its source MEANS, and the typechecker this
 * migration exists to enable would then be checking a different program from
 * the one consumers install. Falls back to `.tsx` when the registry says
 * nothing, since that is the permissive-by-default case for a UI item.
 */
function extensionFor(row: Row): string {
  const path = row.files?.[0]?.path
  const ext = path ? extname(path) : ""
  return ext || ".tsx"
}

function fileFor(node: number, row: Row): string {
  const label = NODE_LABELS[node] ?? String(node)
  return join(ROOT, `n${node}-${label}`, `${row.name}${extensionFor(row)}`)
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "✖ Supabase env vars not set. Configure NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY (the anon key is public; the registry is RLS public-read)."
    )
    process.exit(1)
  }

  const nodeArg = arg("--node")
  if (!nodeArg) {
    console.error("✖ --node <n> is required. Nodes are never capped; pass whatever exists.")
    process.exit(1)
  }
  const node = Number(nodeArg)
  if (!Number.isInteger(node) || node < 1) {
    console.error(`✖ --node must be a positive integer, got ${nodeArg}`)
    process.exit(1)
  }

  const check = hasFlag("--check")
  const dryRun = hasFlag("--dry-run")

  const rows = assertUsable(await fetchNode(node))
  if (rows.length === 0) {
    // Not an error: N10 legitimately holds no components (documentation is MDX).
    console.log(`N${node}: no components in the registry — nothing to extract.`)
    return
  }

  const dir = join(ROOT, `n${node}-${NODE_LABELS[node] ?? node}`)
  const drift: string[] = []
  const written: string[] = []
  const skipped: string[] = []

  for (const row of rows) {
    const path = fileFor(node, row)
    const next = row.source_code!.trimEnd() + "\n"
    const current = existsSync(path) ? readFileSync(path, "utf8") : null

    if (check) {
      if (current === null) drift.push(`${row.name}: missing on disk`)
      else if (current !== next) drift.push(`${row.name}: differs from the registry`)
      continue
    }
    // Never overwrite a file that is already on disk. Extraction is a one-way
    // door: once a component is here it has been through tsc, eslint and
    // prettier, and most needed fixing to survive that — the database copy is
    // by definition the version that never compiled. Re-running the script
    // across an extracted node would restore every one of those defects, which
    // is precisely the drift this migration exists to end.
    if (current !== null) {
      skipped.push(row.name)
      if (dryRun) console.log(`skip (on disk)  ${path}`)
      continue
    }
    if (dryRun) {
      console.log(`create  ${path}`)
      continue
    }
    mkdirSync(dir, { recursive: true })
    writeFileSync(path, next)
    written.push(row.name)
  }

  if (check) {
    // A file on disk with no registry row is drift too — otherwise a deleted
    // component lingers as a file nobody serves.
    const known = new Set(rows.map((r) => `${r.name}${extensionFor(r)}`))
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) {
        if (!known.has(f)) drift.push(`${f}: on disk but not in the registry`)
      }
    }
    if (drift.length > 0) {
      console.error(`✖ N${node} drift (${drift.length}):`)
      for (const d of drift) console.error(`  - ${d}`)
      process.exit(1)
    }
    console.log(`✔ N${node}: ${rows.length} component(s) on disk match the registry.`)
    return
  }

  if (dryRun) return
  console.log(
    `✔ N${node}: extracted ${written.length} new component(s) to ${dir}` +
      (skipped.length > 0 ? `; left ${skipped.length} already on disk untouched` : "")
  )
}

main().catch((err) => {
  console.error(`✖ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
