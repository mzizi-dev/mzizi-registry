/**
 * markdown-renderer (React) and markdown-parse: the parser, the link allow-list, the rich-text
 * reader and the rendered markup. The contract (`contracts/ui/markdown-renderer.contract.json`)
 * holds all three builds to the same states in `__tests__/contracts` and `__tests__/astro`; the
 * cases here are shared with the Rust build through `__tests__/fixtures/markdown-renderer.cases.json`.
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { MarkdownRenderer } from "@/components/registry/n2-primitives/markdown-renderer"
import {
  htmlToMarkdown,
  looksLikeRichText,
  markdownBlocks,
  parseInlines,
  parseMarkdown,
  safeHref,
} from "@/components/registry/n2-primitives/markdown-parse"

const fixture = JSON.parse(
  readFileSync(path.resolve(__dirname, "../fixtures/markdown-renderer.cases.json"), "utf8")
) as { cases: { say: string; links?: "safe" | "https"; input: string; expect: unknown }[] }

const html = (content: string, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<MarkdownRenderer content={content} {...props} />)

describe("parseMarkdown: the cases the Rust build also runs", () => {
  it.each(fixture.cases.map((c) => [c.say, c] as const))("%s", (_say, c) => {
    expect(parseMarkdown(c.input, c.links ?? "safe")).toEqual(c.expect)
  })
})

describe("safeHref", () => {
  it.each([
    "javascript:alert(1)",
    "\tjavascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " \u0001javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "<javascript:alert(1)>",
    "",
    "   ",
  ])("refuses %j", (raw) => {
    expect(safeHref(raw)).toBeNull()
  })

  it.each(["https://x.org", "http://x.org", "mailto:a@b.c", "tel:+263", "/a", "#b", "?c", "d/e", "//x.org"])(
    "keeps %j",
    (raw) => {
      expect(safeHref(raw)).toBe(raw)
    }
  )

  it("https keeps https only", () => {
    expect(safeHref("https://x.org", "https")).toBe("https://x.org")
    expect(safeHref("HTTPS://x.org", "https")).toBe("HTTPS://x.org")
    for (const raw of ["http://x.org", "/a", "#b", "mailto:a@b.c", "//x.org"]) expect(safeHref(raw, "https")).toBeNull()
  })
})

describe("parseInlines", () => {
  it("a refused link keeps its words and their marks", () => {
    expect(parseInlines("[**x** y](javascript:alert(1))")).toEqual([
      { t: "strong", c: [{ t: "text", v: "x" }] },
      { t: "text", v: " y" },
    ])
  })
})

describe("rich text (DOMParser)", () => {
  // The Toddle extension's case: an editor's paragraphs, breaks, marks and list items wrapped in paragraphs.
  it("reads paragraphs, breaks, marks and list items, and drops scripts", () => {
    expect(
      markdownBlocks(
        "<p>Allergy <strong>nuts</strong></p><p>Line a<br>Line b</p><ul><li><p>pen</p></li><li><p>card</p></li></ul><ol><li>call</li></ol><script>x()</script>",
        { from: "auto" }
      )
    ).toEqual([
      { kind: "p", lines: [[{ t: "text", v: "Allergy " }, { t: "strong", c: [{ t: "text", v: "nuts" }] }]] },
      { kind: "p", lines: [[{ t: "text", v: "Line a" }], [{ t: "text", v: "Line b" }]] },
      { kind: "ul", items: [{ lines: [[{ t: "text", v: "pen" }]], children: [] }, { lines: [[{ t: "text", v: "card" }]], children: [] }] },
      { kind: "ol", start: 1, items: [{ lines: [[{ t: "text", v: "call" }]], children: [] }] },
    ])
  })

  it("text in rich text stays text: markers are escaped, links are still checked", () => {
    const md = htmlToMarkdown(
      '<p>2 * 3 and [x](javascript:y)</p><p><a href="javascript:alert(1)">bad</a> <a href="https://x.org">good</a></p><pre>a < b</pre><h2>Head</h2><blockquote>Said</blockquote><hr>',
      DOMParser
    )
    expect(parseMarkdown(md)).toEqual([
      { kind: "p", lines: [[{ t: "text", v: "2 * 3 and [x](javascript:y)" }]] },
      {
        kind: "p",
        lines: [[{ t: "text", v: "bad " }, { t: "link", href: "https://x.org", c: [{ t: "text", v: "good" }] }]],
      },
      { kind: "code", lang: "", v: "a < b" },
      { kind: "h", level: 2, c: [{ t: "text", v: "Head" }] },
      { kind: "quote", children: [{ kind: "p", lines: [[{ t: "text", v: "Said" }]] }] },
      { kind: "hr" },
    ])
  })

  it("an image's handler never runs: DOMParser parses without loading or running anything", () => {
    const w = window as unknown as { __mdr?: number }
    w.__mdr = 0
    markdownBlocks('<p><img src="x" onerror="window.__mdr = 1"></p>', { from: "html" })
    expect(w.__mdr).toBe(0)
  })

  it("auto: only an editor's tags mark text as rich text", () => {
    expect(looksLikeRichText("<p>x</p>")).toBe(true)
    expect(looksLikeRichText("Score < 5 or > 9")).toBe(false)
    expect(looksLikeRichText("<img src=x onerror=alert(1)>")).toBe(false)
  })

  it("without a DOMParser, rich text is read as Markdown: its tags are text", () => {
    expect(markdownBlocks("<p>x</p>", { from: "html", Parser: undefined })).toEqual([
      { kind: "p", lines: [[{ t: "text", v: "<p>x</p>" }]] },
    ])
  })
})

describe("MarkdownRenderer (React)", () => {
  it("renders elements, never markup from the source", () => {
    const out = html(
      "<img src=x onerror=alert(1)>\n\n<script>alert(2)</script>\n\n| a |\n| - |\n| <iframe src=javascript:alert(3)> |\n\n[x](javascript:alert(4)) [y](data:text/html,z)"
    )
    expect(out).not.toMatch(/<img|<script|<iframe|href="(?:javascript|data):/i)
    expect(out).not.toContain("onerror=\"")
    expect(out).toContain("&lt;img src=x onerror=alert(1)&gt;")
    expect(out).toContain("&lt;iframe src=javascript:alert(3)&gt;")
  })

  it("an attribute cannot be broken out of", () => {
    const out = html('[x](https://x.org/"onmouseover="alert(1))')
    expect(out).toContain('href="https://x.org/&quot;onmouseover=&quot;alert(1)"')
    expect(out).not.toContain(' onmouseover="')
  })

  it("external links open in a new tab safely; others stay in place", () => {
    const out = html("[a](https://x.org) [b](/here) [c](mailto:a@b.c)")
    expect(out).toContain('<a href="https://x.org" class="')
    expect(out).toMatch(/href="https:\/\/x\.org"[^>]*target="_blank" rel="noopener noreferrer"/)
    expect(out).toMatch(/href="\/here" class="[^"]*">b<\/a>/)
    expect(out).toMatch(/href="mailto:a@b\.c" class="[^"]*">c<\/a>/)
  })

  it("links=https keeps https only", () => {
    const out = html("[a](https://x.org) [b](http://x.org) [c](/r)", { links: "https" })
    expect(out.match(/<a /g)).toHaveLength(1)
    expect(out).toContain("b c")
  })

  it("headingBase shifts headings and stops at h6", () => {
    const out = html("# One\n\n#### Four", { headingBase: 4 })
    expect(out).toContain("<h4")
    expect(out).toContain("<h6")
    expect(out).not.toContain("<h1")
  })

  it("passes extra attributes and classes to the root", () => {
    const out = html("x", { className: "mt-2", id: "notes", "aria-label": "Notes" })
    expect(out).toMatch(/^<div data-slot="markdown-renderer"[^>]*class="text-sm leading-relaxed text-foreground mt-2"[^>]*id="notes"/)
    expect(out).toContain('aria-label="Notes"')
  })

  it("renders large hostile input in reasonable time", () => {
    const started = performance.now()
    html("*a ".repeat(20_000) + "[".repeat(20_000) + "`".repeat(5_000) + "\n" + "> ".repeat(500) + "x\n" + "  ".repeat(500) + "- y")
    expect(performance.now() - started).toBeLessThan(3000)
  })
})
