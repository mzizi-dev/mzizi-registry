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

import { readdirSync, readFileSync, existsSync } from "fs"
import { join, resolve, sep } from "path"

const DOCTRINE_ROOT = join(process.cwd(), "content", "doctrine")

/**
 * A single safe path segment: letters, digits, dot, underscore, hyphen — and never
 * `.` or `..` on their own.
 *
 * `collection` and `slug` reach these functions from callers that may be handling a
 * request parameter, so treating them as trusted is a path-traversal read: a `slug` of
 * `../../../etc/passwd` would resolve outside the content tree. Validating the segment
 * is the fix; a `replace()` that strips separators is not, because it leaves `..`
 * intact.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

function isSafeSegment(s: string): boolean {
  return SAFE_SEGMENT.test(s) && s !== "." && s !== ".."
}

/**
 * Join segments under DOCTRINE_ROOT, or return null if any segment is unsafe or the
 * result escapes the root. The containment check is belt-and-braces behind the segment
 * validation — defence in depth is cheap here and the failure mode is reading arbitrary
 * files off the server.
 */
function safeDoctrinePath(...segments: string[]): string | null {
  if (!segments.every(isSafeSegment)) return null
  const candidate = resolve(DOCTRINE_ROOT, ...segments)
  const root = resolve(DOCTRINE_ROOT)
  if (candidate !== root && !candidate.startsWith(root + sep)) return null
  return candidate
}

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

/** Every document in a doctrine collection. Returns [] when the directory is absent. */
export function readDoctrineCollection(collection: string): DoctrineDocument[] {
  const dir = safeDoctrinePath(collection)
  if (!dir || !existsSync(dir)) return []

  return readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && isSafeSegment(f))
    .sort()
    .map((file) => {
      const path = safeDoctrinePath(collection, file)
      if (!path) return null
      const { data, body } = parseFrontmatter(readFileSync(path, "utf8"))
      return { data, body, slug: file.replace(/\.mdx$/, "") }
    })
    .filter((d): d is DoctrineDocument => d !== null)
}

/** One document by slug, or null. An unsafe collection or slug is simply not found. */
export function readDoctrineDocument(collection: string, slug: string): DoctrineDocument | null {
  const path = safeDoctrinePath(collection, `${slug}.mdx`)
  if (!path || !existsSync(path)) return null
  const { data, body } = parseFrontmatter(readFileSync(path, "utf8"))
  return { data, body, slug }
}

/**
 * Collection ordered by `sort_order` when present, then slug. The extractor writes
 * `sort_order` through from the row, so display order survives the move.
 */
export function readDoctrineSorted(collection: string): DoctrineDocument[] {
  return readDoctrineCollection(collection).sort((a, b) => {
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
