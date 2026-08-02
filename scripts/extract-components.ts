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
 * RLS public-read for the collections the `components` view exposes. There is
 * deliberately no service-role path — extraction is a read, and a read never
 * needs to outrank a policy.
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
import { join } from "node:path"

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
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i === -1 ? undefined : process.argv[i + 1]
}

const hasFlag = (f: string) => process.argv.includes(f)

async function fetchNode(node: number): Promise<Row[]> {
  const url = new URL("/rest/v1/components", SUPABASE_URL)
  url.searchParams.set("select", "name,source_code,ecosystem_node,status")
  url.searchParams.set("ecosystem_node", `eq.${node}`)
  url.searchParams.set("order", "name.asc")
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) {
    throw new Error(`registry read failed (${res.status}): ${(await res.text()).slice(0, 300)}`)
  }
  return (await res.json()) as Row[]
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

function fileFor(node: number, name: string): string {
  const label = NODE_LABELS[node] ?? String(node)
  return join(ROOT, `n${node}-${label}`, `${name}.tsx`)
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

  for (const row of rows) {
    const path = fileFor(node, row.name)
    const next = row.source_code!.trimEnd() + "\n"
    const current = existsSync(path) ? readFileSync(path, "utf8") : null

    if (check) {
      if (current === null) drift.push(`${row.name}: missing on disk`)
      else if (current !== next) drift.push(`${row.name}: differs from the registry`)
      continue
    }
    if (dryRun) {
      console.log(
        `${current === null ? "create" : current === next ? "unchanged" : "update"}  ${path}`
      )
      continue
    }
    mkdirSync(dir, { recursive: true })
    writeFileSync(path, next)
  }

  if (check) {
    // A file on disk with no registry row is drift too — otherwise a deleted
    // component lingers as a file nobody serves.
    const known = new Set(rows.map((r) => `${r.name}.tsx`))
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
  console.log(`✔ N${node}: extracted ${rows.length} component(s) to ${dir}`)
}

main().catch((err) => {
  console.error(`✖ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
