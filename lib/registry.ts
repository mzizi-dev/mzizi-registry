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

import manifestJson from "../registry.json"
import { REGISTRY_FILES } from "./registry.generated"
import { extname, basename } from "path"

// `REGISTRY_SOURCE_ROOT` and `MANIFEST_PATH` are gone with the filesystem reads.
// The manifest is imported directly and the file listing comes from
// `lib/registry.generated.ts`, so this module needs no paths and no `fs` — which
// is what lets it run on Cloudflare Workers.
const SOURCE_PREFIX = "components/registry"

/** Only letters, digits, dot, underscore, hyphen — never bare `.` or `..`. */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

function isSafeSegment(s: string): boolean {
  return SAFE_SEGMENT.test(s) && s !== "." && s !== ".."
}

// `safeSourcePath` is deleted with the filesystem reads it guarded — there is no
// path to build. `isSafeSegment` is kept and applied to the directory and file
// names coming out of the generated listing: they are build-time data rather
// than request input now, but a name with a separator or a `..` in it would
// still produce a wrong `sourcePath`, and that string is handed to consumers.

/**
 * A file on a registry item, in shadcn's terms (registry-item.json):
 *
 *   path    where the file IS — its source location in this repository
 *   target  where the file GOES — the destination in the consumer's project
 *
 * They were conflated: `path` held the destination and `target` was absent, so
 * `shadcn registry validate` failed on every item and `npx shadcn add nyuchi/mzizi/button`
 * — the GitHub-registry route, which reads files straight out of the repo at `path` — could
 * not resolve a single file.
 */
export type RegistryFile = { path: string; type?: string; target?: string }

/**
 * The authored `meta` block from `registry.json` — a component's documented contract.
 *
 * It was spread into every item by `readComponents()` and declared nowhere, so nothing
 * could read `owner` or `collection` without a cast. That is how `/api/v1/ui` shipped an
 * index with no way to filter by either: the data was always there, the type said it was
 * not. Declaring it is what makes the index able to serve it (CLAUDE.md §6.1).
 */
export type RegistryMeta = {
  useCases?: string[]
  variants?: string[]
  sizes?: string[]
  features?: string[]
  a11y?: string[]
  /** `mzizi` | `nyuchi` | `bundu` | `framework`. */
  owner?: string
  /** The authored collection, e.g. `primitives`, `brand`, `pages`. */
  collection?: string
  hasDemo?: boolean
  /**
   * The node, for a DATA item only — one with `cssVars`/`css` and no file.
   *
   * Every other item derives its node from the directory the file lives in, which is what
   * stops the node disagreeing with where the code actually is. A data item has no
   * directory, so there is nothing to derive from and the manifest is the only source.
   *
   * Declaring it is not cosmetic. Without it `nyuchi-tokens` carried no `node`, so
   * `/api/v1/ui?node=1` — and `mzizi_list_components({ node: 1 })` on top of it — returned
   * the 17 N1 libraries and silently omitted the tokens themselves: the one item that IS
   * N1, and the one every consumer is told to install first.
   */
  node?: number
  /** The node's label, for a DATA item only. See `node` above. */
  nodeLabel?: string
}

export type RegistryItem = {
  name: string
  type?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  /** The authored contract from `registry.json`. */
  meta?: RegistryMeta
  /**
   * Design tokens as CSS custom properties, keyed `theme` / `light` / `dark`.
   *
   * shadcn's first-class field for exactly this (registry-item.json). The CLI merges these
   * into the consuming project's stylesheet, which is what makes N1 framework-agnostic —
   * 431 of the registry's components reference `var(--…)` and nothing shipped a definition
   * until these existed.
   */
  cssVars?: {
    theme?: Record<string, string>
    light?: Record<string, string>
    dark?: Record<string, string>
  }
  /** Raw CSS the item contributes, for rules that are not custom properties. */
  css?: Record<string, unknown>
  /**
   * Project configuration, for `registry:base` / `registry:style` items.
   *
   * These sit at the TOP LEVEL of a registry item, which is what the published
   * registry-item schema declares — not inside a `config` object, which is what the docs
   * example shows. Only the top-level form works: verified against shadcn 4.16.2 by running
   * a real `init` twice, once per shape. Top level wrote a correct `components.json` and
   * merged the item's cssVars; nested `config` errored out and merged nothing.
   */
  style?: string
  iconLibrary?: string
  baseColor?: string
  tailwind?: Record<string, unknown>
  /** Display name shown by a registry browser and the CLI. */
  title?: string
  categories?: string[]
  docs?: string
  author?: string
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

/**
 * Items whose payload is DATA, not a source file.
 *
 * Two kinds, and the distinction is not "has cssVars":
 *
 *   registry:theme   the tokens themselves (nyuchi-tokens) — payload is `cssVars`/`css`
 *   registry:base    a project foundation (mzizi-base)     — payload is the CONFIG
 *                    (style / iconLibrary / baseColor / tailwind) plus dependencies
 *
 * A base legitimately carries no `cssVars` at all: `mzizi-base` pulls N1 through
 * `registryDependencies: ["nyuchi-tokens"]` rather than duplicating 324 values, because N1
 * is the only node allowed to define CSS values. Testing for `cssVars` alone would drop it
 * here and answer 404 for the one item a new project installs first.
 */
function isDataItem(item: RegistryItem): boolean {
  return Boolean(
    item.cssVars || item.css || item.type === "registry:base" || item.type === "registry:style"
  )
}

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

  // Grouped from the generated listing rather than walked. The listing is
  // emitted sorted, and the original `readdirSync(...)` was NOT sorted — but
  // every ordering-sensitive decision below (primary-extension rank,
  // first-node-wins on a duplicate) is explicit, so a stable order can only
  // make the outcome more deterministic than it was, never different in kind.
  const byDir = new Map<string, string[]>()
  for (const rel of REGISTRY_FILES) {
    const slash = rel.indexOf("/")
    if (slash === -1) continue
    const dir = rel.slice(0, slash)
    const file = rel.slice(slash + 1)
    // A nested path would break the `<dir>/<file>` assumption below, and an
    // unsafe segment would end up in a `sourcePath` served to consumers. The
    // generator emits neither; skipping is safer than trusting that.
    if (file.includes("/") || !isSafeSegment(dir) || !isSafeSegment(file)) continue
    const list = byDir.get(dir)
    if (list) list.push(file)
    else byDir.set(dir, [file])
  }

  for (const [dir, files] of byDir) {
    const parsed = parseNodeDir(dir)
    if (!parsed) continue

    for (const file of files) {
      // The component name is the filename without its extension, so a component's
      // per-target implementations (`button.tsx` + `button.rs`) collapse onto one name —
      // which is the point: one component, one contract, several targets.
      const name = basename(file, extname(file))
      const ext = extname(file).replace(/^\./, "").toLowerCase()
      const rel = `${SOURCE_PREFIX}/${dir}/${file}`

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

  // Imported, not read. The parse-failure branch that stood here is gone with
  // the `readFileSync`: `registry.json` is now resolved by the bundler, so
  // malformed JSON fails the BUILD rather than degrading a live request to an
  // empty registry. That is the better failure — an empty registry is a 404 on
  // every component, and it used to be reachable at runtime.
  const manifest = manifestJson as unknown as Manifest

  const sources = readSourceIndex()
  const out: RegistryItem[] = []
  for (const item of manifest.items ?? []) {
    if (!item?.name) continue

    // A DATA item's payload is `cssVars`/`css`, not a file — that is what a `registry:theme`
    // is. `nyuchi-tokens` carries the 214 design tokens themselves, generated from
    // app/globals.css, and has no source on disk BY DESIGN: a `.ts` file is React-only, and
    // the point of moving N1 into cssVars is that the shadcn CLI merges it into any project.
    //
    // Without this branch the item is dropped here and `/api/v1/ui/nyuchi-tokens` answers
    // 404 — the tokens would be correct in the manifest and invisible to every consumer.
    if (!item.files?.length && isDataItem(item)) {
      // The node comes from the manifest here and ONLY here, because there is no directory
      // to read it from. Every filed component still derives it from disk below, so the
      // invariant that matters — a component's node cannot disagree with where its code is
      // — is untouched: an item with no code has no place to disagree with.
      out.push({
        ...item,
        ...(typeof item.meta?.node === "number" ? { node: item.meta.node } : {}),
        ...(item.meta?.nodeLabel ? { nodeLabel: item.meta.nodeLabel } : {}),
      })
      continue
    }

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
