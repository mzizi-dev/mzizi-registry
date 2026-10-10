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
  decodeEntities,
  looksLikeRichText,
  markdownBlocks,
  parseInlines,
  richTextBlocks,
  safeHref,
} from "@/components/registry/n2-primitives/markdown-parse"

const fixture = JSON.parse(
  readFileSync(path.resolve(__dirname, "../fixtures/markdown-renderer.cases.json"), "utf8")
) as {
  cases: { say: string; links?: "safe" | "https"; from?: "markdown" | "html" | "auto"; input: string; expect: unknown }[]
}

const html = (content: string, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<MarkdownRenderer content={content} {...props} />)

describe("markdownBlocks: the cases the Rust build also runs", () => {
  it.each(fixture.cases.map((c) => [c.say, c] as const))("%s", (_say, c) => {
    expect(markdownBlocks(c.input, { links: c.links ?? "safe", from: c.from ?? "markdown" })).toEqual(c.expect)
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
    "VbScRiPt:msgbox(1)",
    "DATA:text/html,x",
    "file:///etc/passwd",
    "blob:https://x.org/1",
    "feed:javascript:alert(1)",
    "javascript://%0aalert(1)",
    "javascript\u0000:alert(1)",
    "\u3000javascript:alert(1)",
    "\ufeffjavascript:alert(1)",
    "java\u2028script:alert(1)",
    "java\rscript:alert(1)",
    "<javascript:alert(1)>",
    "<\u0001javascript:alert(1)>",
    "<\u0001//bank@evil.example>",
    "https://x.org/\u0000a",
    "https://bank.example@evil.example/x",
    "\\\\bank.example@evil.example",
    "/\\bank.example@evil.example",
    "/\\",
    "//user@evil.example",
    "https://",
    "http:/x.org",
    "https://x.org/a b",
    "https://x.org/a\u00a0b",
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

describe("rich text", () => {
  it("is read without a DOM: nothing in it runs, loads or touches the document", () => {
    const w = window as unknown as { __mdr?: number }
    w.__mdr = 0
    const before = document.documentElement.outerHTML.length
    const blocks = richTextBlocks('<p>x<img src="x" onerror="window.__mdr = 1"><script>window.__mdr = 2</script></p>')
    expect(blocks).toEqual([{ kind: "p", lines: [[{ t: "text", v: "x" }]] }])
    expect(w.__mdr).toBe(0)
    expect(document.documentElement.outerHTML.length).toBe(before)
  })

  it("gives the same tree with or without a browser (no hydration mismatch)", () => {
    const g = globalThis as { DOMParser?: unknown }
    const saved = g.DOMParser
    const html = "<p>Hello <b>x</b></p>"
    const inBrowser = markdownBlocks(html, { from: "html" })
    g.DOMParser = undefined
    try {
      expect(markdownBlocks(html, { from: "html" })).toEqual(inBrowser)
    } finally {
      g.DOMParser = saved
    }
    expect(inBrowser).toEqual([{ kind: "p", lines: [[{ t: "text", v: "Hello " }, { t: "strong", c: [{ t: "text", v: "x" }] }]] }])
  })

  it("auto: only an editor's tags mark text as rich text", () => {
    expect(looksLikeRichText("<p>x</p>")).toBe(true)
    expect(looksLikeRichText("<BR/>")).toBe(true)
    expect(looksLikeRichText("Score < 5 or > 9")).toBe(false)
    expect(looksLikeRichText("<img src=x onerror=alert(1)>")).toBe(false)
    expect(looksLikeRichText("<b_x>")).toBe(false)
  })

  it("refuses an encoded or padded address once its references are decoded, and keeps the words", () => {
    const blocks = richTextBlocks(
      '<p><a href="&#x6A;avascript:alert(1)">a</a> <a href=" JAVA&#x09;SCRIPT:alert(1)">b</a> <a href="&#100;ata:text/html,x">c</a> <a href="https://x.org">d</a></p>'
    )
    expect(blocks).toEqual([
      { kind: "p", lines: [[{ t: "text", v: "a b c " }, { t: "link", href: "https://x.org", c: [{ t: "text", v: "d" }] }]] },
    ])
  })

  it("never emits an image, whatever its src", () => {
    const out = html('<p><img src="javascript:alert(1)" alt="a"><img src="https://x.org/i.png" alt="b">ok</p>', { from: "html" })
    expect(out).not.toMatch(/<img|src=/i)
    expect(out).toContain("ok")
  })

  it("decodes character references", () => {
    expect(decodeEntities("&lt;&amp;&#65;&#x42;&nbsp;&copy;&#0;")).toBe("<&AB\u00a0&copy;\ufffd")
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

  it("a scheme-relative link is external too", () => {
    expect(html("[a](//x.org/p)")).toMatch(/href="\/\/x\.org\/p"[^>]*target="_blank" rel="noopener noreferrer"/)
  })

  it("a refused link is plain text, with no anchor and no href", () => {
    for (const dest of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "vbscript:msgbox(1)", "data:text/html,x", "<java\u0001script:alert(1)>"]) {
      const out = html(`see [the **words**](${dest}) here`)
      expect(out).not.toMatch(/<a\b|href=/i)
      expect(out).toContain("see the <strong>words</strong> here")
    }
  })

  it("a Markdown image is never an image, and its address is checked like a link's", () => {
    const out = html("![x](javascript:alert(1)) ![y](https://x.org/i.png)")
    expect(out).not.toMatch(/<img|src=|href="javascript:/i)
  })

  it("a character reference in a Markdown address stays inert text in the attribute", () => {
    // Not decoded into a scheme: the browser reads the escaped value as a relative path.
    const out = html("[x](&#106;avascript:alert(1))")
    expect(out).toContain('href="&amp;#106;avascript:alert(1)"')
    expect(out).not.toMatch(/href="javascript:/i)
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

  it.each([
    ["markers, brackets and backticks", "*a ".repeat(20_000) + "[".repeat(20_000) + "`".repeat(5_000)],
    ["unmatched italics inside bold", "**" + "*x ".repeat(32_000) + "y**"],
    ["unmatched underscores inside bold", "**" + "_x ".repeat(32_000) + "y**"],
    ["unmatched bolds inside italic", "*" + "**x ".repeat(32_000) + "y*"],
    ["unmatched italics inside a link", "[" + "*x ".repeat(32_000) + "](https://x.org)"],
    ["deep quotes and lists", "> ".repeat(500) + "x\n" + "  ".repeat(500) + "- y"],
  ])("renders hostile input in linear time: %s", (_say, input) => {
    const started = performance.now()
    html(input)
    expect(performance.now() - started).toBeLessThan(1500)
  })

  it("renders hostile rich text in linear time, and deep nesting without a stack overflow", () => {
    const started = performance.now()
    html("<a <b <p>x<!--".repeat(20_000), { from: "html" })
    html("<".repeat(50_000), { from: "auto" })
    expect(html("<b>".repeat(5_000) + "x", { from: "html" })).toContain("x")
    html("<span>".repeat(20_000) + "</div>".repeat(20_000), { from: "html" })
    expect(performance.now() - started).toBeLessThan(1500)
  })

  it("reads huge rich text without a stack overflow, and decides `auto` in linear time", () => {
    const started = performance.now()
    expect(html("<span>" + "<br>".repeat(150_000) + "x</span>", { from: "html" })).toContain("x")
    expect(html("<p><span>" + "a<i></i>".repeat(150_000) + "</span></p>", { from: "html" })).toContain("aaa")
    expect(looksLikeRichText("<p ".repeat(40_000))).toBe(false)
    // Marks nested in marks of the same kind add nothing, so a <br> split stays linear.
    const nested = richTextBlocks('<b><i><a href="https://x.org">'.repeat(11) + "x<br>".repeat(100_000))
    expect(JSON.stringify(nested).length).toBeLessThan(25_000_000)
    expect(performance.now() - started).toBeLessThan(3000)
  })

  it("charges every marker run to the budget (no K×L work)", () => {
    const started = performance.now()
    html("**" + "*a ".repeat(2_000) + "a" + "*".repeat(1_000_000))
    expect(performance.now() - started).toBeLessThan(1500)
  })

  it("from=html renders an editor's text, with its markup as elements and its Markdown as text", () => {
    const out = html("<p># Plan <strong>now</strong></p><script>alert(1)</script>", { from: "html" })
    expect(out).not.toContain("<h1")
    expect(out).not.toContain("<script")
    expect(out).toContain("# Plan <strong>now</strong>")
  })
})
