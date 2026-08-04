/**
 * The component registry, read from disk.
 *
 * Component documents live in `content/registry/<collection>/<name>.json`, extracted
 * by `pnpm registry:extract`. This module is the read path the Next.js app builds the
 * registry from, and `/api/v1/*` serves. The database is not involved.
 *
 * That is the architecture: the app builds the registry at build time and serves it
 * over `/api/v1/*`, and `mzizi-mcp` is an HTTP client of that API rather than a
 * Supabase client. A component is a file (source under `components/registry/`) plus a
 * file (its document here) — nothing about it is a row.
 *
 * The `components` set mirrors what the retired `components` VIEW selected: documents
 * whose `kind` is null. A non-null `kind` marks something that is not an installable
 * component (`doc_page`, `overview`, `architecture`, `version_history`, …), and serving
 * those as components is the defect the view's filter existed to prevent.
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs"
import { join, resolve, sep } from "path"

const REGISTRY_ROOT = join(process.cwd(), "content", "registry")

/**
 * A single safe path segment. Directory and file names come off the filesystem here
 * rather than from a request, but validating them keeps the join provably contained --
 * the same rule as lib/doctrine.ts, and the failure mode if it is wrong is reading
 * files from outside the content tree.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

function isSafeSegment(s: string): boolean {
  return SAFE_SEGMENT.test(s) && s !== "." && s !== ".."
}

function safeRegistryPath(...segments: string[]): string | null {
  if (!segments.every(isSafeSegment)) return null
  const candidate = resolve(REGISTRY_ROOT, ...segments)
  const root = resolve(REGISTRY_ROOT)
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  return candidate
}

export type RegistryDocument = Record<string, unknown> & {
  name?: string
  collection?: string
  node?: number
  kind?: string | null
}

let _cache: RegistryDocument[] | null = null

/** Every document under content/registry, parsed once per process. */
export function readAllRegistryDocuments(): RegistryDocument[] {
  if (_cache) return _cache
  if (!existsSync(REGISTRY_ROOT)) {
    _cache = []
    return _cache
  }

  const out: RegistryDocument[] = []
  for (const collection of readdirSync(REGISTRY_ROOT)) {
    const dir = safeRegistryPath(collection)
    if (!dir || !statSync(dir).isDirectory()) continue
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue
      const filePath = safeRegistryPath(collection, file)
      if (!filePath) continue
      try {
        const doc = JSON.parse(readFileSync(filePath, "utf8")) as RegistryDocument
        // `name` is authoritative from the document; fall back to the filename so a
        // document missing it is still addressable rather than silently invisible.
        if (typeof doc.name !== "string" || doc.name.length === 0) {
          doc.name = file.replace(/\.json$/, "")
        }
        if (typeof doc.collection !== "string") doc.collection = collection
        out.push(doc)
      } catch {
        // A malformed file is a build-time problem, not a reason to serve nothing —
        // but it must not be silent, so surface it and continue.
        console.error(`[mzizi] registry: could not parse content/registry/${collection}/${file}`)
      }
    }
  }
  _cache = out.sort((a, b) => String(a.name).localeCompare(String(b.name)))
  return _cache
}

/**
 * Installable components only — documents with a null/absent `kind`, matching what the
 * `components` view selected.
 */
export function readComponents(): RegistryDocument[] {
  return readAllRegistryDocuments().filter(
    (d) => d.kind === null || d.kind === undefined || d.kind === ""
  )
}

/** One component by name, or null. */
export function readComponent(name: string): RegistryDocument | null {
  return readComponents().find((d) => d.name === name) ?? null
}

/** Any document by name, component or not. */
export function readRegistryDocument(name: string): RegistryDocument | null {
  return readAllRegistryDocuments().find((d) => d.name === name) ?? null
}

/** Components in a collection. */
export function readCollection(collection: string): RegistryDocument[] {
  return readComponents().filter((d) => d.collection === collection)
}

/** Collection names present on disk, with document counts. */
export function readCollectionCounts(): Record<string, number> {
  return readAllRegistryDocuments().reduce<Record<string, number>>((acc, d) => {
    const c = String(d.collection ?? "unknown")
    acc[c] = (acc[c] ?? 0) + 1
    return acc
  }, {})
}

/**
 * Component count per node. Derived, never stored — a stored count is the oldest drift
 * bug in this system (CLAUDE.md §11), and the node set is uncapped, so this returns
 * whatever nodes actually have components rather than a fixed range.
 */
export function readNodeCounts(): Record<number, number> {
  return readComponents().reduce<Record<number, number>>((acc, d) => {
    const n = typeof d.node === "number" ? d.node : Number(d.node)
    if (!Number.isFinite(n)) return acc
    acc[n] = (acc[n] ?? 0) + 1
    return acc
  }, {})
}
