/**
 * The component registry, read from the repo.
 *
 * A component is a REAL FILE — `components/registry/n<N>-<label>/<name>.<ext>` — which
 * the build compiles and typechecks. That is the whole point: an error in a component
 * fails `pnpm build`. There is no per-component JSON document and no database row; both
 * are representations of a component rather than the component, and both can drift from
 * the code while still looking correct.
 *
 * Two files, and only two:
 *
 *   components/registry/n<N>-<label>/<name>.<ext>   the component itself, 571 of them
 *   registry.json                                   the shadcn manifest, 571 items
 *
 * `registry.json` is the manifest a consumer's `npx shadcn add` resolves against, so it
 * has to exist as one document in the shadcn schema. It is NOT a second copy of the
 * components: it carries the install contract (description, dependencies,
 * registryDependencies, target paths) and never the source.
 *
 * The node is derived from the directory the component lives in, so it cannot disagree
 * with where the file actually is.
 */

import { readdirSync, readFileSync, existsSync, statSync } from "fs"
import { join, resolve, sep, extname, basename } from "path"

const REGISTRY_SOURCE_ROOT = join(process.cwd(), "components", "registry")
const MANIFEST_PATH = join(process.cwd(), "registry.json")

/** Only letters, digits, dot, underscore, hyphen — never bare `.` or `..`. */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

function isSafeSegment(s: string): boolean {
  return SAFE_SEGMENT.test(s) && s !== "." && s !== ".."
}

/** Join under the source root, or null if a segment is unsafe or the path escapes. */
function safeSourcePath(...segments: string[]): string | null {
  if (!segments.every(isSafeSegment)) return null
  const candidate = resolve(REGISTRY_SOURCE_ROOT, ...segments)
  const root = resolve(REGISTRY_SOURCE_ROOT)
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  return candidate
}

export type RegistryFile = { path: string; type?: string }

export type RegistryItem = {
  name: string
  type?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  /** Derived from the directory on disk, e.g. `n2-primitives` → 2. */
  node?: number
  /** The directory label on disk, e.g. `primitives`. */
  nodeLabel?: string
  /** Repo-relative path of the actual component file. */
  sourcePath?: string
}

type Manifest = { items?: RegistryItem[] }

let _cache: RegistryItem[] | null = null

/** Parse `n<N>-<label>` into its node number and label. */
function parseNodeDir(dir: string): { node: number; label: string } | null {
  const m = dir.match(/^n(\d+)-(.+)$/)
  if (!m) return null
  const node = Number.parseInt(m[1], 10)
  // No upper bound: the node set is uncapped (CLAUDE.md §9), so a cap here would
  // silently hide a component the moment a new node is added.
  if (!Number.isFinite(node) || node < 1) return null
  return { node, label: m[2] }
}

/** Every component file on disk, keyed by component name. */
function readSourceIndex(): Map<string, { node: number; nodeLabel: string; sourcePath: string }> {
  const index = new Map<string, { node: number; nodeLabel: string; sourcePath: string }>()
  if (!existsSync(REGISTRY_SOURCE_ROOT)) return index

  for (const dir of readdirSync(REGISTRY_SOURCE_ROOT)) {
    const parsed = parseNodeDir(dir)
    const dirPath = safeSourcePath(dir)
    if (!parsed || !dirPath || !statSync(dirPath).isDirectory()) continue

    for (const file of readdirSync(dirPath)) {
      const filePath = safeSourcePath(dir, file)
      if (!filePath || !statSync(filePath).isFile()) continue
      // The component name is the filename without its extension. A component may
      // ship per-target variants (.tsx / .swift / .kt), which share one name.
      const name = basename(file, extname(file))
      if (index.has(name)) continue
      index.set(name, {
        node: parsed.node,
        nodeLabel: parsed.label,
        sourcePath: `components/registry/${dir}/${file}`,
      })
    }
  }
  return index
}

/**
 * The registry: every manifest item, joined to the component file that implements it.
 *
 * An item with no file on disk is dropped rather than served — the manifest promises
 * something installable, and serving an entry whose source does not exist hands a
 * consumer a broken `shadcn add`.
 */
export function readComponents(): RegistryItem[] {
  if (_cache) return _cache
  if (!existsSync(MANIFEST_PATH)) {
    _cache = []
    return _cache
  }

  let manifest: Manifest
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest
  } catch {
    console.error("[mzizi] registry: registry.json is not valid JSON")
    _cache = []
    return _cache
  }

  const sources = readSourceIndex()
  const out: RegistryItem[] = []
  for (const item of manifest.items ?? []) {
    if (!item?.name) continue
    const src = sources.get(item.name)
    if (!src) {
      console.error(`[mzizi] registry: ${item.name} is in registry.json with no file on disk`)
      continue
    }
    out.push({ ...item, node: src.node, nodeLabel: src.nodeLabel, sourcePath: src.sourcePath })
  }

  _cache = out.sort((a, b) => a.name.localeCompare(b.name))
  return _cache
}

/** One component by name, or null. */
export function readComponent(name: string): RegistryItem | null {
  return readComponents().find((c) => c.name === name) ?? null
}

/**
 * Component count per node, derived from where the files actually are. Never stored — a
 * stored count is the oldest drift bug here (§11) — and never bounded, because the node
 * set is uncapped.
 */
export function readNodeCounts(): Record<number, number> {
  return readComponents().reduce<Record<number, number>>((acc, c) => {
    if (typeof c.node !== "number") return acc
    acc[c.node] = (acc[c.node] ?? 0) + 1
    return acc
  }, {})
}

/** Node labels present on disk, e.g. { 2: "primitives" }. */
export function readNodeLabels(): Record<number, string> {
  return readComponents().reduce<Record<number, string>>((acc, c) => {
    if (typeof c.node === "number" && c.nodeLabel) acc[c.node] = c.nodeLabel
    return acc
  }, {})
}
