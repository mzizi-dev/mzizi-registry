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
  /**
   * Repo-relative path of the component's primary source file — the React/TypeScript one
   * when there is one, since that is what `/api/v1/ui/{name}` and `npx shadcn add` serve.
   */
  sourcePath?: string
  /**
   * Every source file for this component, keyed by extension without the dot:
   * `{ tsx: "…/button.tsx", rs: "…/button.rs" }`.
   *
   * A component is one name with one contract and possibly several implementations — the
   * React one and the Dioxus one are the same button (CLAUDE.md §8.9). This is what lets
   * `/api/v1/ui/{name}` stay byte-identical for React while `/api/v1/rs/{name}` serves the
   * Rust, without inventing a second registry entry that would drift from the first.
   */
  sources?: Record<string, string>
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

type SourceEntry = {
  node: number
  nodeLabel: string
  sourcePath: string
  sources: Record<string, string>
}

/**
 * Extensions that serve the React/shadcn surface, in preference order.
 *
 * The winner becomes `sourcePath`, which is what `/api/v1/ui/{name}` returns. Picking the
 * first file the directory happens to list would let `button.rs` become the answer to
 * `GET /api/v1/ui/button` on a filesystem that enumerates differently — a `shadcn add`
 * silently handing a consumer Rust.
 */
const PRIMARY_EXTENSIONS = ["tsx", "ts", "jsx", "js"]

/** Every component file on disk, keyed by component name. */
function readSourceIndex(): Map<string, SourceEntry> {
  const index = new Map<string, SourceEntry>()
  if (!existsSync(REGISTRY_SOURCE_ROOT)) return index

  for (const dir of readdirSync(REGISTRY_SOURCE_ROOT)) {
    const parsed = parseNodeDir(dir)
    const dirPath = safeSourcePath(dir)
    if (!parsed || !dirPath || !statSync(dirPath).isDirectory()) continue

    for (const file of readdirSync(dirPath)) {
      const filePath = safeSourcePath(dir, file)
      if (!filePath || !statSync(filePath).isFile()) continue
      // The component name is the filename without its extension, so a component's
      // per-target implementations (`button.tsx` + `button.rs`) collapse onto one name —
      // which is the point: one component, one contract, several targets.
      const name = basename(file, extname(file))
      const ext = extname(file).replace(/^\./, "").toLowerCase()
      const rel = `components/registry/${dir}/${file}`

      const existing = index.get(name)
      if (!existing) {
        index.set(name, {
          node: parsed.node,
          nodeLabel: parsed.label,
          sourcePath: rel,
          sources: { [ext]: rel },
        })
        continue
      }
      // Same name in a different node directory is a genuine conflict, not a target
      // variant — the node would be ambiguous. First one wins and the validator reports it.
      if (existing.sources[ext]) continue
      existing.sources[ext] = rel
      const current = extname(existing.sourcePath).replace(/^\./, "").toLowerCase()
      const rank = (e: string) => {
        const i = PRIMARY_EXTENSIONS.indexOf(e)
        return i === -1 ? PRIMARY_EXTENSIONS.length : i
      }
      if (rank(ext) < rank(current)) existing.sourcePath = rel
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
    out.push({
      ...item,
      node: src.node,
      nodeLabel: src.nodeLabel,
      sourcePath: src.sourcePath,
      sources: src.sources,
    })
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
