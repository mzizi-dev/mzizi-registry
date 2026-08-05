/**
 * Component source lives on disk, not in the database.
 *
 * See `docs/component-source-migration.md`. `component_documents.document->>
 * 'source_code'` is being emptied node by node; the files under
 * `components/registry/n<N>-<label>/<name>.<ext>` are the single copy. Every
 * surface that serves source — the shadcn registry route, the MCP server, the
 * source/playground pages — reads it through THIS module. One reader, because
 * two readers of the filesystem would be the same mistake as two copies of the
 * source.
 *
 * Metadata (description, dependencies, registryDependencies, node, status,
 * `files[].path`) still comes from the registry. Only the bytes moved.
 *
 * NOTE the `files[].path` distinction: that is where the shadcn CLI places a
 * file in a CONSUMER's project. It is unrelated to where the file lives here.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { basename, extname, join } from "node:path"

/**
 * Resolved against `process.cwd()` so it works in `next dev`, in a Vercel
 * lambda, and in a script. The directory has to be traced into the deployed
 * bundle explicitly — see `outputFileTracingIncludes` in `next.config.mjs`,
 * without which these reads succeed locally and 404 in production.
 */
const REGISTRY_ROOT = join(process.cwd(), "components", "registry")

/**
 * Files that are never a component's source, whatever directory they land in.
 *
 * This is an EXCLUDE list, deliberately, where an allow-list of `.tsx / .ts /
 * .css / .json` stood before. The registry is multi-language: N8's
 * `accessibility-audit` ships as `.md` (a documented SQL pipeline) and N1's
 * token targets ship as `.kt`, `.swift`, `.py`, `.ets` and `.rs`. An allow-list
 * silently returned `null` for all five — they resolved through the database
 * fallback instead, so nothing looked wrong until the fallback was removed, at
 * which point they would have 404'd in production.
 *
 * An allow-list fails closed on a language nobody thought of, and it fails
 * INVISIBLY: the reader returns null, the ramp covers it, and the defect only
 * surfaces at the drop. Excluding known non-source instead means a new language
 * works the day it lands, and a genuine mistake shows up as a duplicate-name
 * error rather than a silent 404.
 */
const NOT_SOURCE = new Set([".ds_store", ".map", ".snap", ".log"])

/**
 * Extensions that serve the React/shadcn surface, in preference order.
 *
 * The winner is what `readComponentSource(name)` returns, so it is what
 * `GET /api/v1/ui/{name}` and `npx shadcn add` hand a consumer. Without an explicit order
 * the answer would depend on directory enumeration, and `shadcn add button` could return
 * `button.rs` on one filesystem and `button.tsx` on another.
 */
const PRIMARY_EXTENSIONS = ["tsx", "ts", "jsx", "js"]

function primaryRank(ext: string): number {
  const i = PRIMARY_EXTENSIONS.indexOf(ext)
  return i === -1 ? PRIMARY_EXTENSIONS.length : i
}

interface RegistryIndex {
  /** component name → absolute path of its PRIMARY source file */
  files: Map<string, string>
  /** component name → every source file it has, keyed by extension without the dot */
  targets: Map<string, Record<string, string>>
  /** names that resolve to files in more than one node directory — a defect */
  ambiguous: Map<string, string[]>
}

let cached: RegistryIndex | null = null

function buildIndex(): RegistryIndex {
  const files = new Map<string, string>()
  const targets = new Map<string, Record<string, string>>()
  // name → the node directories it appeared in, and the paths under each
  const dirs = new Map<string, Map<string, string[]>>()

  if (existsSync(REGISTRY_ROOT)) {
    for (const dir of readdirSync(REGISTRY_ROOT, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue
      const nodeDir = join(REGISTRY_ROOT, dir.name)
      for (const entry of readdirSync(nodeDir)) {
        if (entry.startsWith(".")) continue
        const dotted = extname(entry)
        if (NOT_SOURCE.has(dotted.toLowerCase())) continue
        const ext = dotted.replace(/^\./, "").toLowerCase()
        const name = basename(entry, dotted)
        const path = join(nodeDir, entry)

        const perDir = dirs.get(name) ?? new Map<string, string[]>()
        perDir.set(dir.name, [...(perDir.get(dir.name) ?? []), path])
        dirs.set(name, perDir)

        const byExt = targets.get(name) ?? {}
        if (!byExt[ext]) byExt[ext] = path
        targets.set(name, byExt)

        const current = files.get(name)
        if (!current || primaryRank(ext) < primaryRank(extname(current).replace(/^\./, ""))) {
          files.set(name, path)
        }
      }
    }
  }

  // AMBIGUITY IS ABOUT NODES, NOT EXTENSIONS.
  //
  // `button.tsx` and `button.rs` in the SAME directory are one component with two target
  // implementations — the whole design of the bilingual registry (CLAUDE.md §8.9). This
  // check used to treat any repeated name as a defect, which was right when a component
  // could only be TypeScript and would now reject every Rust sibling.
  //
  // Two files sharing a name across DIFFERENT node directories is still a genuine defect:
  // the component's node would be ambiguous, and a node is not cosmetic — it decides what
  // may import what. Fail that ONE name rather than the whole index, so a single mislaid
  // file cannot take the route down for the other 570.
  const ambiguous = new Map<string, string[]>()
  for (const [name, perDir] of dirs) {
    if (perDir.size > 1) ambiguous.set(name, [...perDir.values()].flat())
  }

  return { files, targets, ambiguous }
}

function index(): RegistryIndex {
  if (!cached) cached = buildIndex()
  return cached
}

/** Drop the cached index. For tests and for the extract script. */
export function resetRegistrySourceCache(): void {
  cached = null
}

/**
 * Read a component's source from disk.
 *
 * Returns `null` when the component has no file — which is a genuine 404 for
 * the registry route, NOT an empty string. A 200 carrying an empty body is
 * exactly how the pre-migration bugs hid, so the empty case never silently
 * becomes "".
 *
 * @throws if the name resolves to more than one file on disk.
 */
export function readComponentSource(name: string): string | null {
  return readAt(name, index().files.get(name))
}

/**
 * Read one target's source for a component — `readComponentSourceFor("button", "rs")`.
 *
 * Returns `null` when the component has no implementation for that target, which is the
 * honest answer for the many components that are TypeScript-only: `/api/v1/rs/{name}` 404s
 * rather than pretending a Dioxus version exists (CLAUDE.md §8.9 — never present a
 * `metadata_only` target as though components exist for it).
 */
export function readComponentSourceFor(name: string, ext: string): string | null {
  return readAt(name, index().targets.get(name)?.[ext.toLowerCase()])
}

/** Every target a component ships, keyed by extension: `{ tsx: "…", rs: "…" }`. */
export function componentTargets(name: string): Record<string, string> {
  assertUnambiguous(name)
  return { ...(index().targets.get(name) ?? {}) }
}

function assertUnambiguous(name: string): void {
  const duplicates = index().ambiguous.get(name)
  if (duplicates) {
    throw new Error(
      `Component "${name}" resolves to files under more than one node directory: ` +
        `${duplicates.join(", ")}. A component belongs to exactly one node — ` +
        `delete the copy that is filed under the wrong one. ` +
        `(Several files with one name in ONE directory are target variants and are fine.)`
    )
  }
}

function readAt(name: string, path: string | undefined): string | null {
  assertUnambiguous(name)
  if (!path) return null
  const source = readFileSync(path, "utf8")
  return source.trim().length === 0 ? null : source
}

/** Every component name that has a source file on disk. */
export function componentsOnDisk(): string[] {
  return [...index().files.keys()].sort()
}

// `resolveComponentSource(name, databaseSource)` stood here — disk first, the
// `source_code` column second — and its own docstring said to delete it once that
// column was empty. It is. All 571 components resolve on disk, the column has
// been dropped from every document, and production was verified serving files
// byte-for-byte before the drop ran.
//
// It is gone rather than left as dead code because a fallback is a ramp, not an
// architecture: the moment a reader can serve from two places, the two can
// disagree, and the whole point of moving source into git was to make that
// impossible. `readComponentSource` is now the only reader, and a component with
// no file is a 404 — never a 200 with an empty body.
