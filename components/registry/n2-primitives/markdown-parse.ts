/**
 * MARKDOWN PARSE — the framework-free half of `markdown-renderer` (contracts/ui/markdown-renderer).
 *
 * Markdown in, a typed tree out. Nothing here builds HTML: the `.astro` and `.tsx` builds
 * draw the tree as elements, so every piece of text reaches the page as a text node and every
 * address as an attribute the framework escapes. The Rust build (`markdown-renderer.rs`)
 * implements the same parser, rule for rule; its tests run the same cases.
 *
 * - Blocks: paragraphs (every line break kept as a hard break), ATX headings, bulleted and
 *   numbered lists (nested by indentation), blockquotes, fenced code, horizontal rules and
 *   GFM tables.
 * - Inlines: code spans, links, **bold**, *italic* / _italic_, backslash escapes. A marker
 *   with no partner stays text, and so does `snake_case`.
 * - Raw HTML is text. A `<script>` in the source is shown, never parsed.
 * - Links pass `safeHref`: an allow-list of schemes. A refused link keeps its words and loses
 *   its address.
 * - Rich-text HTML (from editors that store HTML) can be read through a `DOMParser`, which
 *   runs nothing, into the same Markdown (`htmlToMarkdown`).
 */

/** Inline content, as data. */
export type MarkdownInline =
  | { t: "text"; v: string }
  | { t: "strong"; c: MarkdownInline[] }
  | { t: "em"; c: MarkdownInline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: MarkdownInline[] }

/** A table column's alignment, from its delimiter row. */
export type MarkdownAlign = "left" | "center" | "right" | null

/** A list item: its lines (each a hard break apart) and any lists nested under it. */
export interface MarkdownListItem {
  lines: MarkdownInline[][]
  children: MarkdownList[]
}

/** A bulleted or numbered list. */
export type MarkdownList =
  | { kind: "ul"; items: MarkdownListItem[] }
  | { kind: "ol"; start: number; items: MarkdownListItem[] }

/** A block, as data. */
export type MarkdownBlock =
  | { kind: "p"; lines: MarkdownInline[][] }
  | { kind: "h"; level: 1 | 2 | 3 | 4 | 5 | 6; c: MarkdownInline[] }
  | MarkdownList
  | { kind: "quote"; children: MarkdownBlock[] }
  | { kind: "code"; lang: string; v: string }
  | { kind: "hr" }
  | { kind: "table"; align: MarkdownAlign[]; head: MarkdownInline[][]; rows: MarkdownInline[][][] }

/**
 * Which link addresses are kept. `safe`: http, https, mailto, tel and relative addresses.
 * `https`: https only.
 */
export type MarkdownLinkPolicy = "safe" | "https"

/**
 * What `content` is. `markdown`; `html`, rich text read through a `DOMParser`; `auto`,
 * rich text when it holds block or inline HTML tags, Markdown otherwise.
 */
export type MarkdownSource = "markdown" | "html" | "auto"

export interface MarkdownOptions {
  links?: MarkdownLinkPolicy
  from?: MarkdownSource
  /** A DOMParser constructor for `html` / `auto`; defaults to the global one, if any. */
  Parser?: (new () => DOMParser) | undefined
}

/** How deep blockquotes and lists nest before deeper ones are read flat. */
export const MAX_NESTING = 8
/** How deep inline marks nest before deeper markers are read as text. */
const MAX_INLINE_DEPTH = 16
/** How far a link's label and address are looked for (keeps a line of `[` linear). */
const MAX_LABEL = 1000
const MAX_DEST = 2048

// ─── Classes ──────────────────────────────────────────────────────────────────────────────
//
// One table of classes for the Astro and React builds; the Rust build carries the same
// strings and `tests/contract.rs` checks they match. Colour is tokens only.

export const MARKDOWN_CLASSES = {
  root: "text-sm leading-relaxed text-foreground",
  p: "leading-7 [&:not(:first-child)]:mt-4",
  h1: "font-serif text-3xl font-bold tracking-tight mt-8 mb-4 first:mt-0",
  h2: "font-serif text-2xl font-semibold tracking-tight mt-6 mb-3 first:mt-0",
  h3: "font-serif text-xl font-semibold mt-5 mb-2 first:mt-0",
  h4: "text-lg font-semibold mt-4 mb-2 first:mt-0",
  h5: "text-base font-semibold mt-3 mb-1 first:mt-0",
  h6: "text-sm font-semibold mt-3 mb-1 first:mt-0 text-muted-foreground",
  ul: "my-4 list-disc space-y-1 pl-6",
  ol: "my-4 list-decimal space-y-1 pl-6",
  nested: "mt-1 mb-0",
  quote: "my-4 border-l-4 border-border pl-4 italic text-muted-foreground",
  pre: "my-4 overflow-x-auto rounded-[var(--radius-xl,17px)] bg-muted/50 p-4 font-mono text-sm",
  code: "rounded-[var(--radius-md,12px)] bg-muted px-1.5 py-0.5 font-mono text-sm",
  a: "text-primary underline underline-offset-4 transition-colors hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  hr: "my-6 border-border",
  tableWrap: "my-4 w-full overflow-x-auto",
  table: "w-full border-collapse text-sm",
  th: "border border-border px-3 py-2 font-medium",
  td: "border border-border px-3 py-2",
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const

/** The class for a cell with this alignment (left when none is given). */
export function cellClass(part: "th" | "td", align: MarkdownAlign): string {
  return `${MARKDOWN_CLASSES[part]} ${MARKDOWN_CLASSES[align ?? "left"]}`
}

/** The heading tag for a Markdown level, shifted by `headingBase` and capped at h6. */
export function headingTag(level: number, headingBase = 1): "h1" | "h2" | "h3" | "h4" | "h5" | "h6" {
  const base = Number.isFinite(headingBase) ? Math.min(Math.max(Math.trunc(headingBase), 1), 6) : 1
  const n = Math.min(level + base - 1, 6)
  return `h${n}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

// ─── Links ────────────────────────────────────────────────────────────────────────────────

const SAFE_SCHEMES = ["http", "https", "mailto", "tel"]

/**
 * The address to put in an `href`, or null when it is refused.
 *
 * Browsers drop tabs and newlines anywhere in a URL and C0 controls and spaces at either
 * end, so `\tjavascript:` and `java\nscript:` are `javascript:` to them: those characters
 * are removed first. Then the scheme is checked against an allow-list, never a deny-list
 * (`javascript:`, `vbscript:`, `data:` and the next one are refused alike). Under `safe` an
 * address with no scheme (relative, root-relative, `#anchor`, `?query`) is kept; under
 * `https` only `https:` is.
 */
export function safeHref(raw: string, policy: MarkdownLinkPolicy = "safe"): string | null {
  let url = raw.replace(/[\t\n\r]/g, "")
  let start = 0
  let end = url.length
  while (start < end && url.charCodeAt(start) <= 0x20) start++
  while (end > start && url.charCodeAt(end - 1) <= 0x20) end--
  url = url.slice(start, end)
  if (url.startsWith("<") && url.endsWith(">")) url = url.slice(1, -1)
  if (url === "") return null
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(url)
  if (policy === "https") return scheme && scheme[1].toLowerCase() === "https" ? url : null
  if (!scheme) return url
  return SAFE_SCHEMES.includes(scheme[1].toLowerCase()) ? url : null
}

/** Whether a kept address leaves the site (it opens in a new tab). */
export function isExternal(href: string): boolean {
  return /^https?:/i.test(href)
}

// ─── Inlines ──────────────────────────────────────────────────────────────────────────────

const PUNCT = new Set(Array.from("!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"))
const isSpace = (c: string | undefined) => c === undefined || /\s/u.test(c)
const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c)

/** The length of the run of `c` starting at `i`. */
function runAt(s: string[], i: number, c: string): number {
  let n = 0
  while (s[i + n] === c) n++
  return n
}

/** Past a code span opening at `j` (a backtick run with a partner), or null if it has none. */
function codeSpanEnd(s: string[], j: number): number | null {
  const n = runAt(s, j, "`")
  for (let k = j + n; k < s.length; ) {
    if (s[k] === "`") {
      const m = runAt(s, k, "`")
      if (m === n) return k + m
      k += m
    } else k++
  }
  return null
}

class InlineParser {
  private readonly s: string[]
  private readonly policy: MarkdownLinkPolicy
  /** Delimiters known to have no partner from some position on (keeps scans linear). */
  private readonly noCloser = new Set<string>()
  private readonly codeEnds = new Map<number, number | null>()
  /** Backtick run lengths with no partner after some run start (none after a later one). */
  private readonly unpaired = new Set<number>()

  constructor(s: string[], policy: MarkdownLinkPolicy) {
    this.s = s
    this.policy = policy
  }

  /** `codeSpanEnd`, remembered per position, so no backtick run is measured twice. */
  private codeEnd(j: number): number | null {
    let end = this.codeEnds.get(j)
    if (end === undefined) {
      const atStart = this.s[j - 1] !== "`"
      const n = runAt(this.s, j, "`")
      end = atStart && this.unpaired.has(n) ? null : codeSpanEnd(this.s, j)
      if (end === null && atStart) this.unpaired.add(n)
      this.codeEnds.set(j, end)
    }
    return end
  }

  /** Find the closer of an emphasis run of `n` × `c`, scanning [from, to). */
  private closer(c: string, n: number, from: number, to: number): number | null {
    const key = `${c}${n}`
    if (this.noCloser.has(key)) return null
    const s = this.s
    for (let j = from; j < to; ) {
      const ch = s[j]
      if (ch === "\\") {
        j += 2
        continue
      }
      if (ch === "`") {
        j = this.codeEnd(j) ?? j + runAt(s, j, "`")
        continue
      }
      if (ch === c) {
        const run = runAt(s, j, c)
        // A single marker closes only on a single marker: `**` inside `*…*` is a nested bold.
        if (run >= n && (n > 1 || run === 1)) {
          // The closer: `n` markers, not after whitespace, not before a word for `_`.
          const at = run === n ? j : j + run - n
          const before = s[at - 1]
          const after = s[at + n]
          if (at > from && !isSpace(before) && !(c === "_" && isWord(after))) return at
        }
        j += run
        continue
      }
      j++
    }
    if (to === s.length) this.noCloser.add(key)
    return null
  }

  parse(from: number, to: number, depth: number, inLink: boolean): MarkdownInline[] {
    const s = this.s
    const out: MarkdownInline[] = []
    let buf = ""
    const flush = () => {
      if (!buf) return
      const last = out[out.length - 1]
      if (last?.t === "text") last.v += buf
      else out.push({ t: "text", v: buf })
      buf = ""
    }
    const pushAll = (xs: MarkdownInline[]) => {
      for (const x of xs) {
        if (x.t === "text") buf += x.v
        else {
          flush()
          out.push(x)
        }
      }
    }
    let i = from
    while (i < to) {
      const ch = s[i]
      if (ch === "\\" && i + 1 < to && PUNCT.has(s[i + 1])) {
        buf += s[i + 1]
        i += 2
        continue
      }
      if (ch === "`") {
        const n = runAt(s, i, "`")
        const end = this.codeEnd(i)
        if (end !== null && end <= to) {
          flush()
          let v = s.slice(i + n, end - n).join("")
          if (v.length > 1 && v.startsWith(" ") && v.endsWith(" ") && v.trim() !== "") v = v.slice(1, -1)
          out.push({ t: "code", v })
          i = end
        } else {
          buf += "`".repeat(n)
          i += n
        }
        continue
      }
      if (ch === "[" && depth < MAX_INLINE_DEPTH) {
        const link = this.link(i, to)
        if (link) {
          const label = this.parse(i + 1, link.labelEnd, depth + 1, true)
          const href = inLink ? null : safeHref(link.dest, this.policy)
          if (href !== null) {
            flush()
            out.push({ t: "link", href, c: label })
          } else pushAll(label)
          i = link.end
          continue
        }
      }
      if ((ch === "*" || ch === "_") && depth < MAX_INLINE_DEPTH) {
        const run = runAt(s, i, ch)
        const opens = !isSpace(s[i + run]) && !(ch === "_" && isWord(s[i - 1]))
        if (opens) {
          let done = false
          for (const n of [3, 2, 1]) {
            if (n > run) continue
            const close = this.closer(ch, n, i + n, to)
            if (close === null) continue
            const literal = ch.repeat(run - n)
            buf += literal
            flush()
            const inner = this.parse(i + run, close, depth + 1, inLink)
            if (n === 3) out.push({ t: "strong", c: [{ t: "em", c: inner }] })
            else out.push({ t: n === 2 ? "strong" : "em", c: inner })
            i = close + n
            done = true
            break
          }
          if (done) continue
        }
        buf += ch.repeat(run)
        i += run
        continue
      }
      buf += ch
      i++
    }
    flush()
    return out
  }

  /** A link at `i`: `[label](dest "title")`, with balanced brackets and parentheses. */
  private link(i: number, to: number): { labelEnd: number; dest: string; end: number } | null {
    const s = this.s
    let depth = 0
    let j = i
    const labelTo = Math.min(to, i + MAX_LABEL)
    for (; j < labelTo; j++) {
      const ch = s[j]
      if (ch === "\\") {
        j++
        continue
      }
      if (ch === "`") {
        const end = this.codeEnd(j)
        j = (end !== null && end <= labelTo ? end : j + runAt(s, j, "`")) - 1
        continue
      }
      if (ch === "[") depth++
      else if (ch === "]") {
        depth--
        if (depth === 0) break
      }
    }
    if (j >= labelTo || s[j + 1] !== "(") return null
    const labelEnd = j
    let parens = 0
    let k = j + 2
    const destTo = Math.min(to, k + MAX_DEST)
    for (; k < destTo; k++) {
      const ch = s[k]
      if (ch === "\\") {
        k++
        continue
      }
      if (ch === "(") parens++
      else if (ch === ")") {
        if (parens === 0) break
        parens--
      }
    }
    if (k >= destTo) return null
    const inside = s.slice(labelEnd + 2, k).join("").replace(/^[ \t\n]+/, "")
    const dest = /^<[^>]*>/.exec(inside)?.[0] ?? inside.split(/[ \n]/)[0] ?? ""
    return { labelEnd, dest, end: k + 1 }
  }
}

/** Inline Markdown as data. */
export function parseInlines(text: string, policy: MarkdownLinkPolicy = "safe"): MarkdownInline[] {
  const s = Array.from(text)
  return new InlineParser(s, policy).parse(0, s.length, 0, false)
}

// ─── Blocks ───────────────────────────────────────────────────────────────────────────────

const FENCE = /^ {0,3}(`{3,}|~{3,})[ \t]*([^\s`]*)[^`]*$/
const HEADING = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/
const HR = /^ {0,3}([-*_])(?:[ \t]*\1){2,}[ \t]*$/
const QUOTE = /^ {0,3}> ?(.*)$/
const LIST_ITEM = /^( *)([-*+•‣◦]|\d{1,9}[.)])[ \t]+(.*)$/
const DELIM_CELL = /^:?-+:?$/

const blank = (line: string) => line.trim() === ""

/** Split a table row into its cells: outer pipes dropped, `\|` kept as a pipe. */
function cells(line: string): string[] {
  let row = line.trim()
  if (row.startsWith("|")) row = row.slice(1)
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1)
  const out: string[] = []
  let cur = ""
  for (let i = 0; i < row.length; i++) {
    if (row[i] === "\\" && row[i + 1] === "|") {
      cur += "|"
      i++
    } else if (row[i] === "|") {
      out.push(cur.trim())
      cur = ""
    } else cur += row[i]
  }
  out.push(cur.trim())
  return out
}

function delimiterRow(line: string): MarkdownAlign[] | null {
  if (!line.includes("|") || !line.includes("-")) return null
  const cs = cells(line)
  if (!cs.every((c) => DELIM_CELL.test(c))) return null
  return cs.map((c) =>
    c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : null
  )
}

function tableStarts(lines: string[], i: number): MarkdownAlign[] | null {
  if (i + 1 >= lines.length || !lines[i].includes("|")) return null
  const align = delimiterRow(lines[i + 1])
  return align && cells(lines[i]).length === align.length ? align : null
}

/** Leading tabs as four spaces, so indentation reads one way. */
function untab(line: string): string {
  const m = /^[ \t]*/.exec(line)?.[0] ?? ""
  return m.includes("\t") ? m.replace(/\t/g, "    ") + line.slice(m.length) : line
}

function startsBlock(lines: string[], i: number): boolean {
  const line = lines[i]
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    HR.test(line) ||
    QUOTE.test(line) ||
    LIST_ITEM.test(line) ||
    tableStarts(lines, i) !== null
  )
}

class BlockParser {
  private readonly policy: MarkdownLinkPolicy

  constructor(policy: MarkdownLinkPolicy) {
    this.policy = policy
  }

  private inl(text: string): MarkdownInline[] {
    return parseInlines(text, this.policy)
  }

  parse(lines: string[], depth: number): MarkdownBlock[] {
    const out: MarkdownBlock[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (blank(line)) {
        i++
        continue
      }
      const fence = FENCE.exec(line)
      if (fence) {
        const mark = fence[1]
        const indent = line.length - line.trimStart().length
        const body: string[] = []
        i++
        while (i < lines.length) {
          const l = lines[i]
          const t = l.trim()
          if (t.length >= mark.length && t === mark[0].repeat(t.length) && l.length - l.trimStart().length <= 3) {
            i++
            break
          }
          body.push(l.replace(new RegExp(`^ {0,${indent}}`), ""))
          i++
        }
        out.push({ kind: "code", lang: fence[2].replace(/[^A-Za-z0-9_+#.-]/g, "").slice(0, 32), v: body.join("\n") })
        continue
      }
      const heading = HEADING.exec(line)
      if (heading) {
        out.push({ kind: "h", level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6, c: this.inl(heading[2]) })
        i++
        continue
      }
      if (HR.test(line)) {
        out.push({ kind: "hr" })
        i++
        continue
      }
      if (QUOTE.test(line)) {
        const inner: string[] = []
        while (i < lines.length && QUOTE.test(lines[i])) {
          inner.push(QUOTE.exec(lines[i])?.[1] ?? "")
          i++
        }
        if (depth + 1 >= MAX_NESTING) out.push({ kind: "p", lines: inner.filter((l) => !blank(l)).map((l) => this.inl(l.trim())) })
        else out.push({ kind: "quote", children: this.parse(inner, depth + 1) })
        continue
      }
      if (LIST_ITEM.test(line)) {
        i = this.list(lines, i, out)
        continue
      }
      const align = tableStarts(lines, i)
      if (align) {
        const width = align.length
        const fit = (cs: string[]) => Array.from({ length: width }, (_, k) => this.inl(cs[k] ?? ""))
        const head = fit(cells(line))
        const rows: MarkdownInline[][][] = []
        i += 2
        while (i < lines.length && !blank(lines[i]) && lines[i].includes("|") && !startsBlock(lines, i)) {
          rows.push(fit(cells(lines[i])))
          i++
        }
        out.push({ kind: "table", align, head, rows })
        continue
      }
      const para: MarkdownInline[][] = []
      while (i < lines.length && !blank(lines[i]) && (para.length === 0 || !startsBlock(lines, i))) {
        para.push(this.inl(lines[i].trim().replace(/\\$/, "")))
        i++
      }
      out.push({ kind: "p", lines: para })
    }
    return out
  }

  /** Read a run of list items from `i` into `out`; returns the line after it. */
  private list(lines: string[], i: number, out: MarkdownBlock[]): number {
    const stack: { indent: number; list: MarkdownList }[] = []
    const newList = (ordered: boolean, marker: string): MarkdownList =>
      ordered ? { kind: "ol", start: Number.parseInt(marker, 10), items: [] } : { kind: "ul", items: [] }
    while (i < lines.length) {
      const line = lines[i]
      if (blank(line)) {
        let k = i + 1
        while (k < lines.length && blank(lines[k])) k++
        if (k < lines.length && LIST_ITEM.test(lines[k])) {
          i = k
          continue
        }
        break
      }
      const m = LIST_ITEM.exec(line)
      if (!m) {
        const top = stack[stack.length - 1]
        const item = top?.list.items[top.list.items.length - 1]
        if (item && /^ {2,}\S/.test(line) && !startsBlock(lines, i)) {
          item.lines.push(this.inl(line.trim()))
          i++
          continue
        }
        break
      }
      const indent = m[1].length
      const ordered = /\d/.test(m[2])
      const kind = ordered ? "ol" : "ul"
      const item: MarkdownListItem = { lines: [this.inl(m[3].trim())], children: [] }
      if (stack.length === 0) {
        const list = newList(ordered, m[2])
        out.push(list)
        stack.push({ indent, list })
      } else {
        while (stack.length > 1 && indent < stack[stack.length - 1].indent) stack.pop()
        const top = stack[stack.length - 1]
        const last = top.list.items[top.list.items.length - 1]
        if (indent >= top.indent + 2 && last && stack.length < MAX_NESTING) {
          const list = newList(ordered, m[2])
          last.children.push(list)
          stack.push({ indent, list })
        } else if (top.list.kind !== kind) {
          const list = newList(ordered, m[2])
          if (stack.length === 1) out.push(list)
          else {
            const parent = stack[stack.length - 2].list
            parent.items[parent.items.length - 1].children.push(list)
          }
          stack[stack.length - 1] = { indent: top.indent, list }
        }
      }
      stack[stack.length - 1].list.items.push(item)
      i++
    }
    return i
  }
}

/** Markdown as data. */
export function parseMarkdown(text: string, policy: MarkdownLinkPolicy = "safe"): MarkdownBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").map(untab)
  return new BlockParser(policy).parse(lines, 0)
}

// ─── Rich text ────────────────────────────────────────────────────────────────────────────

const LOOKS_HTML = /<\/?(?:p|br|div|ul|ol|li|h[1-6]|strong|em|b|i|u|span|a|blockquote|pre|code)\b[^>]*>/i

/** Whether text reads as rich-text HTML: it holds an editor's block or inline tags. */
export function looksLikeRichText(text: string): boolean {
  return LOOKS_HTML.test(text)
}

/** Escape the characters inline Markdown reads, so text from HTML stays text. */
const escapeInline = (text: string) => text.replace(/[\\`*_[\]]/g, (c) => `\\${c}`)

/**
 * Rich text to Markdown, through a `DOMParser` (which parses without running anything: no
 * scripts, no event handlers, no image loads). Block elements and `<br>` end a line; a list
 * item is one line with its marker (its own paragraphs joined, as editors such as ProseMirror
 * wrap them); bold, italic and code keep their marks, links their address (still checked by
 * `safeHref` when the Markdown is read). Scripts, styles and templates are dropped.
 */
export function htmlToMarkdown(html: string, Parser: new () => DOMParser): string {
  const doc = new Parser().parseFromString(html, "text/html")
  const DROP = new Set(["script", "style", "template", "noscript", "iframe", "object"])
  const inline = (node: Node): string => {
    let s = ""
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 3) {
        s += escapeInline((child.textContent ?? "").replace(/\s+/g, " "))
        continue
      }
      if (child.nodeType !== 1) continue
      const el = child as Element
      const tag = el.tagName.toLowerCase()
      if (DROP.has(tag)) continue
      if (tag === "br") s += "\n"
      else if (tag === "strong" || tag === "b") s += `**${inline(el).trim()}**`
      else if (tag === "em" || tag === "i") s += `*${inline(el).trim()}*`
      else if (tag === "code") s += `\`${(el.textContent ?? "").replace(/`/g, "")}\``
      else if (tag === "a") s += `[${inline(el).trim()}](<${(el.getAttribute("href") ?? "").replace(/[<>\s]/g, "")}>)`
      else if (/^(p|div|h[1-6]|blockquote|li)$/.test(tag)) s += " " + inline(el) + " "
      else s += inline(el)
    }
    return s
  }
  const blocks: string[] = []
  const walk = (node: Node) => {
    let loose = ""
    const flush = () => {
      if (loose.trim()) blocks.push(loose.trim())
      loose = ""
    }
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== 1) {
        if (child.nodeType === 3) loose += escapeInline(child.textContent ?? "")
        continue
      }
      const el = child as Element
      const tag = el.tagName.toLowerCase()
      if (DROP.has(tag)) continue
      if (tag === "ul" || tag === "ol") {
        flush()
        let n = 0
        const items: string[] = []
        for (const li of Array.from(el.children))
          if (li.tagName.toLowerCase() === "li") {
            n += 1
            const t = inline(li).replace(/\s+/g, " ").trim()
            if (t) items.push((tag === "ol" ? `${n}. ` : "- ") + t)
          }
        if (items.length) blocks.push(items.join("\n"))
      } else if (/^h[1-6]$/.test(tag)) {
        flush()
        const t = inline(el).replace(/\s+/g, " ").trim()
        if (t) blocks.push("#".repeat(Number(tag[1])) + " " + t)
      } else if (tag === "pre") {
        flush()
        const t = (el.textContent ?? "").replace(/^\n|\n$/g, "")
        if (t.trim()) blocks.push("~~~\n" + t.replace(/^~~~/gm, " ~~~") + "\n~~~")
      } else if (tag === "hr") {
        flush()
        blocks.push("---")
      } else if (/^(p|blockquote)$/.test(tag)) {
        flush()
        const t = inline(el)
          .split("\n")
          .map((l) => l.replace(/\s+/g, " ").trim())
          .join("\n")
          .trim()
        if (t) blocks.push(tag === "blockquote" ? t.replace(/^/gm, "> ") : t)
      } else if (tag === "div") {
        flush()
        walk(el)
      } else loose += inline({ childNodes: [el] } as unknown as Node)
    }
    flush()
  }
  walk(doc.body)
  return blocks.join("\n\n")
}

/**
 * The tree for a `markdown-renderer`'s props: rich text first read into Markdown where
 * `from` asks for it and a `DOMParser` exists (in a browser, or jsdom). Without one (server
 * rendering) the text is read as Markdown, so its tags show as text and are never parsed.
 */
export function markdownBlocks(content: string, options: MarkdownOptions = {}): MarkdownBlock[] {
  const { links = "safe", from = "markdown" } = options
  const Parser = "Parser" in options ? options.Parser : (globalThis as { DOMParser?: new () => DOMParser }).DOMParser
  const text = typeof content === "string" ? content : ""
  const rich = from === "html" || (from === "auto" && looksLikeRichText(text))
  return parseMarkdown(rich && Parser ? htmlToMarkdown(text, Parser) : text, links)
}
