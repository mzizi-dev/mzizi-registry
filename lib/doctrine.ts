/**
 * Doctrine, read from disk.
 *
 * Doctrine lives in `content/doctrine/<collection>/<slug>.mdx` as YAML frontmatter
 * plus a prose body (CLAUDE.md §15.17). Nothing here touches Supabase: once the
 * content is a file, routing it back through the database adds a network hop, a
 * failure mode, and a second copy that can disagree with the first.
 *
 * This replaces the eight `architecture_*` reads in `lib/db` that pointed at tables
 * which **do not exist** in the project — `architecture_principles`,
 * `architecture_framework`, `architecture_data_layer`, `architecture_cloud_layer`,
 * `architecture_pipeline`, `architecture_data_ownership`, `architecture_sovereignty`
 * and `architecture_removed`. Every one of them returned an error, which is what
 * made four live routes answer 500. A file cannot go missing without the build
 * noticing, which is the whole argument for the move.
 *
 * Frontmatter is parsed with a deliberately small reader rather than a dependency:
 * `pnpm doctrine:extract` is the only writer, it emits one predictable shape, and
 * `pnpm doctrine:verify` fails if a file drifts from that shape.
 */

import { DOCTRINE_SOURCES } from "./doctrine.generated"

/**
 * A single safe path segment: letters, digits, dot, underscore, hyphen — and never
 * `.` or `..` on their own.
 *
 * `collection` and `slug` reach these functions from callers that may be handling a
 * request parameter. When these were filesystem paths, treating them as trusted was a
 * path-traversal read. They are now object keys, so the stakes are lower — but a
 * caller passing `..` should still get "not found" rather than a memoised empty
 * entry, and the check costs nothing.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

function isSafeSegment(s: string): boolean {
  return SAFE_SEGMENT.test(s) && s !== "." && s !== ".."
}

// `safeDoctrinePath` lived here: it joined segments under the doctrine root and
// refused anything escaping it, because `collection` and `slug` arrive from
// request parameters and a slug of `../../../etc/passwd` would otherwise read a
// file off the server.
//
// It is deleted because there is no path to build any more. Lookups go through
// an object keyed by collection and slug, so a traversal attempt is a key that
// does not exist. `isSafeSegment` is kept and still checked at both entry
// points — the property it enforces is now about what gets memoised rather than
// what gets opened, and losing the validation entirely would be the wrong
// lesson to draw from removing the filesystem.

export type DoctrineDocument = {
  /** Frontmatter fields, as written by `doctrine:extract`. */
  data: Record<string, unknown>
  /** The prose body below the frontmatter block; empty string when there is none. */
  body: string
  /** File slug, i.e. the basename without `.mdx`. */
  slug: string
}

/** Unquote / coerce a scalar. Handles the JSON-quoted strings the extractor emits. */
function parseScalar(raw: string): unknown {
  const v = raw.trim()
  if (v === "" || v === "null") return null
  if (v === "true") return true
  if (v === "false") return false
  if (v === "[]") return []
  if (v === "{}") return {}
  if (/^-?\d+$/.test(v)) return Number.parseInt(v, 10)
  if (/^-?\d*\.\d+$/.test(v)) return Number.parseFloat(v)
  if (v.startsWith('"')) {
    try {
      return JSON.parse(v)
    } catch {
      return v.replace(/^"|"$/g, "")
    }
  }
  return v
}

const indentOf = (line: string) => line.length - line.trimStart().length

/**
 * Parse the block starting at `lines[i]` with the given indent, returning the value
 * and the index just past it. Handles nested maps, `- ` sequences, and `|-` blocks.
 */
function parseBlock(lines: string[], start: number, indent: number): [unknown, number] {
  // A sequence at this indent.
  if (start < lines.length && lines[start].trim().startsWith("- ")) {
    const items: unknown[] = []
    let i = start
    while (i < lines.length) {
      const line = lines[i]
      if (!line.trim() || indentOf(line) < indent) break
      if (indentOf(line) !== indent || !line.trim().startsWith("- ")) break
      const inline = line.trim().slice(2)
      if (inline === "") {
        // `-` alone: a nested map follows, indented further.
        const [val, next] = parseBlock(lines, i + 1, indent + 2)
        items.push(val)
        i = next
      } else {
        items.push(parseScalar(inline))
        i++
      }
    }
    return [items, i]
  }

  // Otherwise a mapping at this indent.
  const map: Record<string, unknown> = {}
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    if (indentOf(line) < indent) break
    if (indentOf(line) > indent) {
      i++
      continue
    }

    const m = line.trim().match(/^([A-Za-z0-9_$-]+):\s?(.*)$/)
    if (!m) {
      i++
      continue
    }
    const [, key, rest] = m

    if (rest === "|-") {
      // Block scalar: subsequent lines indented past this key.
      const out: string[] = []
      i++
      while (i < lines.length && (lines[i].trim() === "" || indentOf(lines[i]) > indent)) {
        out.push(lines[i].slice(indent + 2))
        i++
      }
      while (out.length && out[out.length - 1].trim() === "") out.pop()
      map[key] = out.join("\n")
      continue
    }

    if (rest === "") {
      // The child block's indent must be discovered, not assumed. A nested MAP is
      // indented past its key, but a SEQUENCE sits at the key's own indent — which
      // is how `implementation_rules` (emitted at indent 0 under a key at indent 0)
      // parsed as empty when this assumed indent + 2.
      let peek = i + 1
      while (peek < lines.length && !lines[peek].trim()) peek++
      if (peek >= lines.length) {
        map[key] = null
        i = peek
        continue
      }
      const childIndent = indentOf(lines[peek])
      const isSeq = lines[peek].trim().startsWith("- ")
      if (isSeq ? childIndent >= indent : childIndent > indent) {
        const [val, next] = parseBlock(lines, peek, childIndent)
        map[key] = val
        i = next
      } else {
        map[key] = null
        i = peek
      }
      continue
    }

    map[key] = parseScalar(rest)
    i++
  }
  return [map, i]
}

function parseFrontmatter(source: string): { data: Record<string, unknown>; body: string } {
  if (!source.startsWith("---\n")) return { data: {}, body: source.trim() }
  const end = source.indexOf("\n---\n", 3)
  if (end === -1) return { data: {}, body: source.trim() }

  const fm = source.slice(4, end)
  const body = source.slice(end + 5).trim()
  const [parsed] = parseBlock(fm.split("\n"), 0, 0)
  return { data: (parsed as Record<string, unknown>) ?? {}, body }
}

/**
 * Parsed collections, memoised.
 *
 * The previous implementation re-read and re-parsed the directory on every call.
 * Reading from an in-memory map makes that cheap, but 103 documents parsed per
 * request would still be waste for content that cannot change between
 * deployments — the sources are frozen into the bundle at build time.
 */
const parsed = new Map<string, DoctrineDocument[]>()

/** Every document in a doctrine collection. Returns [] when the collection is absent. */
export function readDoctrineCollection(collection: string): DoctrineDocument[] {
  const cached = parsed.get(collection)
  if (cached) return cached

  // `isSafeSegment` still runs. It no longer guards a path — a traversal
  // attempt is now just a key that is not in the map — but rejecting it here
  // keeps a malformed collection name from being memoised, and keeps the
  // validation next to the lookup rather than relying on the map's shape.
  if (!isSafeSegment(collection)) return []

  const docs = DOCTRINE_SOURCES[collection]
  if (!docs) return []

  // Sort by FILENAME, not by slug. The previous implementation sorted the
  // output of `readdirSync`, i.e. `<slug>.mdx`, and that is not the same order:
  // `-` (0x2D) sorts before `.` (0x2E), so `personal-sovereign.mdx` precedes
  // `personal.mdx` while the bare slug `personal` precedes `personal-sovereign`.
  // The order flips for any collection where one slug is a prefix of another,
  // which `documentation-architecture-data-ownership` is.
  //
  // Callers of `readDoctrineCollection` render in the order they receive, so
  // this is display order on a live page. Preserved deliberately rather than
  // "improved" — changing it is a decision, not a refactor side effect.
  const out = Object.keys(docs)
    .sort((a, b) => (a + ".mdx" < b + ".mdx" ? -1 : a === b ? 0 : 1))
    .map((slug) => {
      const { data, body } = parseFrontmatter(docs[slug]!)
      return { data, body, slug }
    })

  parsed.set(collection, out)
  return out
}

/** One document by slug, or null. An unsafe collection or slug is simply not found. */
export function readDoctrineDocument(collection: string, slug: string): DoctrineDocument | null {
  if (!isSafeSegment(collection) || !isSafeSegment(slug)) return null
  return readDoctrineCollection(collection).find((d) => d.slug === slug) ?? null
}

/**
 * Collection ordered by `sort_order` when present, then slug. The extractor writes
 * `sort_order` through from the row, so display order survives the move.
 */
export function readDoctrineSorted(collection: string): DoctrineDocument[] {
  // Copy before sorting. `Array.prototype.sort` mutates, and
  // `readDoctrineCollection` now returns a MEMOISED array — so sorting it in
  // place permanently reorders the cache, and every later caller expecting
  // slug order silently gets sort_order instead.
  //
  // This was harmless while each call re-read the directory and returned a
  // fresh array. Adding the cache is what made an in-place sort a bug, and no
  // unit test caught it: it only shows up when both functions are called for
  // the same collection in one process, which is exactly what production does
  // and what a differential dump against the previous implementation exposed.
  return [...readDoctrineCollection(collection)].sort((a, b) => {
    const ao = typeof a.data.sort_order === "number" ? a.data.sort_order : Number.MAX_SAFE_INTEGER
    const bo = typeof b.data.sort_order === "number" ? b.data.sort_order : Number.MAX_SAFE_INTEGER
    return ao !== bo ? ao - bo : a.slug.localeCompare(b.slug)
  })
}

/**
 * Flatten a document back into the row shape callers expect, putting the body back
 * into the field it came from.
 *
 * `doctrine:extract` moves one prose field into the MDX body and records its name as
 * `_bodyField`. Without putting it back, a consumer casting frontmatter to a row type
 * gets an object silently missing its main prose — `rationale` on a sovereignty
 * assessment, `instruction_text` on an AI instruction set. That is the kind of loss
 * that type-checks cleanly and shows up as a blank panel in production.
 */
export function doctrineRow<T = Record<string, unknown>>(doc: DoctrineDocument): T {
  const { _bodyField, ...rest } = doc.data as Record<string, unknown> & { _bodyField?: string }
  const row: Record<string, unknown> = { ...rest }
  if (typeof _bodyField === "string" && _bodyField.length > 0) row[_bodyField] = doc.body
  return row as T
}

/** A whole collection as rows, ordered, with bodies restored. */
export function doctrineRows<T = Record<string, unknown>>(collection: string): T[] {
  return readDoctrineSorted(collection).map((d) => doctrineRow<T>(d))
}

/** Doctrine collection names, kept in one place so callers do not spell them. */
export const DOCTRINE = {
  nodes: "documentation-architecture-nodes",
  strands: "documentation-architecture-strands",
  principles: "documentation-architecture-principles",
  framework: "documentation-architecture-framework",
  dataLayer: "documentation-architecture-data",
  dataOwnership: "documentation-architecture-data-ownership",
  cloudLayer: "documentation-architecture-cloud",
  pipeline: "documentation-architecture-pipeline",
  sovereignty: "documentation-architecture-sovereignty",
  removed: "documentation-architecture-removed",
  ubuntuPillars: "genetic-code-ubuntu-pillars",
  ubuntuPrinciples: "genetic-code-ubuntu-principles",
  conventions: "genetic-code-conventions",
  aiInstructions: "ai-instructions",
  documentation: "documentation",
} as const
