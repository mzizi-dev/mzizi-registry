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

interface RegistryIndex {
  /** component name → absolute path of its source file */
  files: Map<string, string>
  /** names that resolve to more than one file — a defect, not a fallback */
  ambiguous: Map<string, string[]>
}

let cached: RegistryIndex | null = null

function buildIndex(): RegistryIndex {
  const files = new Map<string, string>()
  const seen = new Map<string, string[]>()

  if (existsSync(REGISTRY_ROOT)) {
    for (const dir of readdirSync(REGISTRY_ROOT, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue
      const nodeDir = join(REGISTRY_ROOT, dir.name)
      for (const entry of readdirSync(nodeDir)) {
        if (entry.startsWith(".")) continue
        const ext = extname(entry)
        if (NOT_SOURCE.has(ext.toLowerCase())) continue
        const name = basename(entry, ext)
        const path = join(nodeDir, entry)
        seen.set(name, [...(seen.get(name) ?? []), path])
        if (!files.has(name)) files.set(name, path)
      }
    }
  }

  // A component name is unique across the registry, so two files claiming one
  // name means an extraction went to the wrong node. Fail that ONE name rather
  // than the whole index: a single mislaid file must not take the route down
  // for the other 300-odd components.
  const ambiguous = new Map<string, string[]>()
  for (const [name, paths] of seen) {
    if (paths.length > 1) ambiguous.set(name, paths)
  }

  return { files, ambiguous }
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
  const { files, ambiguous } = index()

  const duplicates = ambiguous.get(name)
  if (duplicates) {
    throw new Error(
      `Component "${name}" resolves to ${duplicates.length} files on disk: ` +
        `${duplicates.join(", ")}. A component name is unique across the registry — ` +
        `delete the copy that is filed under the wrong node.`
    )
  }

  const path = files.get(name)
  if (!path) return null

  const source = readFileSync(path, "utf8")
  return source.trim().length === 0 ? null : source
}

/** Every component name that has a source file on disk. */
export function componentsOnDisk(): string[] {
  return [...index().files.keys()].sort()
}

/**
 * Disk first, the database column second — **for the duration of the migration
 * only.**
 *
 * The nodes move one PR at a time, so between the first extraction and the last
 * drop most components still live only in `component_documents.document->>
 * 'source_code'`. Without this fallback the read path would 404 every component
 * that has not been extracted yet: an outage across the whole registry, taken
 * on deliberately in exchange for nothing, since the DB copy is still there and
 * still correct.
 *
 * DELETE THIS FUNCTION at step 5, once
 * `select count(*) from components where source_code is not null` is 0. Its
 * callers then go back to `readComponentSource` directly. Keeping it past that
 * point would re-establish the second copy this migration exists to end — the
 * fallback is a ramp, not an architecture.
 */
export function resolveComponentSource(
  name: string,
  databaseSource?: string | null
): string | null {
  const fromDisk = readComponentSource(name)
  if (fromDisk !== null) return fromDisk
  const fallback = databaseSource?.trim()
  return fallback ? databaseSource! : null
}
