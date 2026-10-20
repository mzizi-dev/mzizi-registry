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

import { linearViolations } from "../helpers/linear-scaling"
import { MarkdownRenderer } from "@/components/registry/n2-primitives/markdown-renderer"
import {
  atxHeading,
  decodeEntities,
  looksLikeRichText,
  markdownBlocks,
  parseInlines,
  richTextBlocks,
  safeHref,
  safeLink,
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

describe("atxHeading: the heading regex it replaced, without the backtracking", () => {
  // The expression markdown-parse used before this fix. It backtracked quadratically on a run of
  // spaces or tabs inside a heading (about 50 s for one 160,000-character line), so one
  // crafted line could freeze a page. atxHeading must read every line exactly as it did.
  const OLD_HEADING = /^ {0,3}(#{1,6})[ \t]+([^]*?)(?:[ \t]+#+)?[ \t]*$/
  const old = (line: string) => {
    const m = OLD_HEADING.exec(line)
    return m ? [m[1], m[2]] : null
  }

  it("matches the old expression on 20,000 generated lines", () => {
    let seed = 20261014
    const rnd = () => (seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) / 2 ** 32
    const pick = (a: string[]) => a[Math.floor(rnd() * a.length)] ?? ""
    const alphabet = [" ", "\t", "#", "a", "b", "\u2028", "\u2029", " ", "#"]
    let headings = 0
    for (let i = 0; i < 20_000; i++) {
      let line = " ".repeat(Math.floor(rnd() * 5)) + "#".repeat(Math.floor(rnd() * 8))
      for (let n = Math.floor(rnd() * 14); n > 0; n--) line += pick(alphabet)
      if (rnd() < 0.5) line += pick([" ", "\t", "", "  \t"]) + "#".repeat(Math.floor(rnd() * 4)) + pick(["", " ", "\t", " \t "])
      const want = old(line)
      if (want) headings++
      expect(atxHeading(line), JSON.stringify(line)).toEqual(want)
    }
    expect(headings).toBeGreaterThan(2_000)
  })

  it.each([
    "# Title #",
    "#\tTitle\t##\t",
    "## a#",
    "## ###",
    "#  #  ",
    "#\t",
    "####### seven",
    "    # four spaces",
    "#nospace",
    "# a\u2028b #",
  ])("%j", (line) => {
    expect(atxHeading(line)).toEqual(old(line))
  })

  it.each([
    ["spaces", (n: number) => "# a" + " ".repeat(n - 4) + "b"],
    ["tabs", (n: number) => "# a" + "\t".repeat(n - 4) + "b"],
    ["spaces only", (n: number) => "# " + " ".repeat(n - 2)],
    ["spaces before a closer", (n: number) => "# a" + " ".repeat(n - 5) + "#x"],
  ])("a line of %s parses in linear time, up to 160,000 characters", (_name, line) => {
    expect(line(160_000)).toHaveLength(160_000)
    expect(markdownBlocks(line(160_000))[0]?.kind).toBe("h")
    expect(linearViolations(line, (s) => markdownBlocks(s), { n: 40_000 })).toEqual([])
  }, 30_000)
})

describe("safeLink: the title a reader sees on hover (#470)", () => {
  it.each([
    ["https://\u0430pple.com/login", "https://xn--pple-43d.com/login"],
    ["HTTPS://Example.ORG/Docs?Q=A#X", "https://example.org/Docs?Q=A#X"],
    ["//B\u00fccher.example/x", "//xn--bcher-kva.example/x"],
    ["https://EXAMPLE.org:8443/a", "https://example.org:8443/a"],
    ["https://0x7f.1/", "https://127.0.0.1/"],
    ["MAILTO:a@B.c", "mailto:a@b.c"],
    ["mailto:help@\u0430pple.com", "mailto:help@xn--pple-43d.com"],
    ["mailto:a@x.org,b@\u0430.com?cc=c@\u0430.com#x", "mailto:a@x.org,b@xn--80a.com?cc=c@\u0430.com#x"],
    ["mailto:Someone", "mailto:Someone"],
    ["tel:+263-77-000", "tel:+263-77-000"],
    ["https://example.com:65535/a", "https://example.com:65535/a"],
    ["https://example.com:/a", "https://example.com:/a"],
    ["//Example.com:0443/", "//example.com:0443/"],
    ["https://[::1]:8080/", "https://[::1]:8080/"],
    ["/Rel/Path", "/Rel/Path"],
  ])("%j shows as %j, its href as written", (raw, title) => {
    expect(safeLink(raw)).toEqual({ href: raw, title })
  })

  it.each(["https://a<b/", "https://1.2.3.999/", "//:80/x", "https://ex%2Fa/"])(
    "refuses %j: the URL parser rejects its host",
    (raw) => {
      expect(safeLink(raw)).toBeNull()
    }
  )

  it.each([
    "https://example.com:abc/",
    "https://example.com:99999/",
    "https://example.com:65536/",
    "https://example.com:-1/",
    "https://example.com:1e3/",
    "//example.com:8a/",
  ])("refuses %j: its port is not a number up to 65535, as new URL() refuses it", (raw) => {
    expect(() => new URL(raw, "https://base.example/")).toThrow()
    expect(safeLink(raw)).toBeNull()
  })

  it.each(["mailto:a@", "mailto:a@b<c.com", "mailto:a@1.2.3.999", "mailto:x@b.com,y@[1.2.3.4]"])(
    "refuses %j: the URL parser rejects a domain in it",
    (raw) => {
      expect(safeLink(raw)).toBeNull()
    }
  )

  /** Run `f` with no `URL` global, as in a runtime without one. */
  const withoutUrl = <T,>(f: () => T): T => {
    const g = globalThis as { URL?: unknown }
    const saved = g.URL
    g.URL = undefined
    try {
      return f()
    } finally {
      g.URL = saved
    }
  }

  it("without a URL global, keeps only hosts it can write exactly as the URL parser does", () => {
    withoutUrl(() => {
      expect(safeLink("https://Example.ORG/A")).toEqual({ href: "https://Example.ORG/A", title: "https://example.org/A" })
      expect(safeLink("https://1.2.3.4/")).toEqual({ href: "https://1.2.3.4/", title: "https://1.2.3.4/" })
      expect(safeLink("MAILTO:a@Example.ORG")).toEqual({ href: "MAILTO:a@Example.ORG", title: "mailto:a@example.org" })
      // An IDN, an IPv4 address the parser would rewrite or reject, punycode it would check,
      // percent-encoding and IPv6: not written exactly here, so refused.
      for (const raw of [
        "https://\u0430pple.com/",
        "https://1.2.3.999/",
        "https://0x7f.1/",
        "https://01.2.3.4/",
        "https://127.1/",
        "https://1.2.3.4./",
        "https://xn--pple-43d.com/",
        "https://%41b.example/",
        "https://[::1]/",
      ])
        expect(safeLink(raw), raw).toBeNull()
    })
  })

  it("without a URL global, a kept link has the title it has with one (generated hosts)", () => {
    // Every host the fallback keeps is written exactly as new URL() writes it.
    let seed = 470
    const rnd = (n: number) => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) % n
    }
    const parts = ["a", "Z", "0", "9", "1", "25", "255", "256", "-", ".", "x", "n", "0x", "0X1f", "xn--", "%41", "\u0430", "_", "e", "08"]
    let kept = 0
    for (let k = 0; k < 4000; k++) {
      let host = ""
      for (let n = 1 + rnd(6); n > 0; n--) host += parts[rnd(parts.length)]
      const raw = `https://${host}/p`
      const main = safeLink(raw)
      const fallback = withoutUrl(() => safeLink(raw))
      if (fallback !== null) {
        kept++
        expect(fallback, raw).toEqual(main)
      }
    }
    expect(kept).toBeGreaterThan(500)
  })

  it("without a URL global, every shared case keeps only links it keeps with one, with the same titles", () => {
    const links = (x: unknown, out: string[] = []): string[] => {
      if (Array.isArray(x)) for (const y of x) links(y, out)
      else if (x !== null && typeof x === "object") {
        const o = x as Record<string, unknown>
        if (o.t === "link") out.push(`${String(o.href)} ${String(o.title)}`)
        for (const v of Object.values(o)) links(v, out)
      }
      return out
    }
    for (const c of fixture.cases) {
      const opts = { links: c.links ?? "safe", from: c.from ?? "markdown" } as const
      const main = links(markdownBlocks(c.input, opts))
      for (const link of links(withoutUrl(() => markdownBlocks(c.input, opts)))) expect(main, c.say).toContain(link)
    }
  })
})

describe("parseInlines", () => {
  it("finds a closer inside a mark after a search to the end found none", () => {
    expect(parseInlines("*x **a *b***")).toEqual([
      { t: "text", v: "*x " },
      { t: "strong", c: [{ t: "text", v: "a " }, { t: "em", c: [{ t: "text", v: "b" }] }] },
    ])
    expect(parseInlines("*a* b *c **d *e***")).toEqual([
      { t: "em", c: [{ t: "text", v: "a" }] },
      { t: "text", v: " b *c " },
      { t: "strong", c: [{ t: "text", v: "d " }, { t: "em", c: [{ t: "text", v: "e" }] }] },
    ])
  })

  it("ends a link's address at a space or a tab, as CommonMark does, and undoes its escapes", () => {
    const link = (href: string) => [{ t: "link", href, title: href, c: [{ t: "text", v: "a" }] }]
    expect(parseInlines('[a](http://x.com\t"title")')).toEqual(link("http://x.com"))
    expect(parseInlines("[a](http://x.com/\\(y\\))")).toEqual(link("http://x.com/(y)"))
  })

  it("does not cut a link's address at other whitespace or a control character: the link is refused", () => {
    // CommonMark keeps a no-break space in the address (markdown-it links to
    // https://x.com/a%C2%A0b); an address with whitespace in it is refused here, as before,
    // rather than linked to the part before the space.
    for (const ws of ["\u00a0", "\u2000", "\u200a", "\u3000", "\u0001", "\u000b", "\u007f"])
      expect(parseInlines(`[a](https://x.com/a${ws}b)`), JSON.stringify(ws)).toEqual([{ t: "text", v: "a" }])
    expect(parseInlines("[a](\u00a0https://x.com)")).toEqual([{ t: "text", v: "a" }])
  })

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
      { kind: "p", lines: [[{ t: "text", v: "a b c " }, { t: "link", href: "https://x.org", title: "https://x.org", c: [{ t: "text", v: "d" }] }]] },
    ])
  })

  it("never emits an image, whatever its src", () => {
    const out = html('<p><img src="javascript:alert(1)" alt="a"><img src="https://x.org/i.png" alt="b">ok</p>', { from: "html" })
    expect(out).not.toMatch(/<img|src=/i)
    expect(out).toContain("ok")
  })

  it("ends a dropped element only at its own end tag", () => {
    expect(richTextBlocks('<p>a</p><script>var s="</scripts>"; secret()</script><p>b</p>')).toEqual([
      { kind: "p", lines: [[{ t: "text", v: "a" }]] },
      { kind: "p", lines: [[{ t: "text", v: "b" }]] },
    ])
  })

  it.each([
    "<template><template></template>secret</template>",
    "<svg><svg></svg>secret</svg>",
    "<math><math></math>secret</math>",
    "<template><!-- </template> -->secret</template>",
    '<template><a title="</template>">secret</template>',
    "<template><script>\"</template>\"</script>secret</template>",
    "<template></ x </template>secret</template>",
    "<svg><![CDATA[</svg>]]>secret</svg>",
    "<svg><foreignObject><b></svg>secret</b></foreignObject></svg>",
    "<svg><b><iframe></svg>secret</iframe></svg>",
    "<script><!--<script></script>secret</script>",
    '<script>x</script a=">secret">',
    "<!-- --!><script>x-->secret</script>",
  ])("ends a dropped element where a browser ends it, so nothing in it shows: %j", (dropped) => {
    expect(richTextBlocks(`<p>a</p>${dropped}<p>b</p>`)).toEqual([
      { kind: "p", lines: [[{ t: "text", v: "a" }]] },
      { kind: "p", lines: [[{ t: "text", v: "b" }]] },
    ])
  })

  it("reads comments, a doctype and tags as a browser does, so they hide nothing more", () => {
    expect(richTextBlocks('<!DOCTYPE html><p>a</p><!--><p>b</p><?xml x?><p>c</p><svg/><p>d</p><p><svg-x>e</svg-x></p>')).toEqual(
      ["a", "b", "c", "d", "e"].map((v) => ({ kind: "p", lines: [[{ t: "text", v }]] }))
    )
  })

  it("keeps text after a nested list after it, apart", () => {
    expect(richTextBlocks("<ul><li>a<ul><li>b</li></ul>c</li></ul>")).toEqual([
      {
        kind: "ul",
        items: [
          {
            lines: [[{ t: "text", v: "a" }]],
            children: [
              { kind: "ul", items: [{ lines: [[{ t: "text", v: "b" }]], children: [] }] },
              { kind: "lines", lines: [[{ t: "text", v: "c" }]] },
            ],
          },
        ],
      },
    ])
    expect(html("<ul><li>a<ul><li>b</li></ul>c</li></ul>", { from: "html" })).toMatch(/<li>a<ul [^>]*><li>b<\/li><\/ul>c<\/li>/)
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
    expect(out).toContain('<a href="https://x.org" title="https://x.org" class="')
    expect(out).toMatch(/href="https:\/\/x\.org"[^>]*target="_blank" rel="noopener noreferrer"/)
    expect(out).toMatch(/href="\/here" title="\/here" class="[^"]*">b<\/a>/)
    expect(out).toMatch(/href="mailto:a@b\.c" title="mailto:a@b\.c" class="[^"]*">c<\/a>/)
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

  it("a trailing backslash on a paragraph's last line is text", () => {
    expect(html("Save it to C:\\")).toContain(">Save it to C:\\</p>")
    expect(html("a\\\nb")).toMatch(/>a<br\/>b<\/p>/)
  })

  it("a link shows its address, normalised, on hover", () => {
    const out = html("[look-alike](https://\u0430pple.com/login)")
    expect(out).toContain('href="https://\u0430pple.com/login" title="https://xn--pple-43d.com/login"')
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

  // Each input is built at n, 2n and 4n (`linear-scaling.ts`); 4n is the size these tests used
  // when they had a wall-clock budget. A quadratic path quadruples per doubling and fails.
  it.each([
    ["markers, brackets and backticks", 5_000, (n: number) => "*a ".repeat(n) + "[".repeat(n) + "`".repeat(n >> 2)],
    ["unmatched italics inside bold", 8_000, (n: number) => "**" + "*x ".repeat(n) + "y**"],
    ["unmatched underscores inside bold", 8_000, (n: number) => "**" + "_x ".repeat(n) + "y**"],
    ["unmatched bolds inside italic", 8_000, (n: number) => "*" + "**x ".repeat(n) + "y*"],
    ["unmatched italics inside a link", 8_000, (n: number) => "[" + "*x ".repeat(n) + "](https://x.org)"],
    ["deep quotes and lists", 125, (n: number) => "> ".repeat(n) + "x\n" + "  ".repeat(n) + "- y"],
  ])("renders hostile input in linear time: %s", (_say, n, input) => {
    expect(linearViolations(input, (s) => html(s), { n })).toEqual([])
  }, 30_000)

  it.each([
    ["unclosed tags and comments", 5_000, (n: number) => "<a <b <p>x<!--".repeat(n), "html"],
    ["a run of `<` read as auto", 12_500, (n: number) => "<".repeat(n), "auto"],
    ["deep bold", 1_250, (n: number) => "<b>".repeat(n) + "x", "html"],
    ["spans closed by divs", 5_000, (n: number) => "<span>".repeat(n) + "</div>".repeat(n), "html"],
    // Dropped elements: nested, full of comments, tags and attributes, or never closed.
    ["nested templates", 5_000, (n: number) => "<template>" + "<template><!-- x --><a title='>'>".repeat(n), "html"],
    ["comments in a paragraph", 12_500, (n: number) => "<p>" + "<!--x-->".repeat(n) + "</p>", "html"],
    ["bold in foreignObject", 12_500, (n: number) => "<svg><foreignObject>" + "<b>".repeat(n) + "</svg>".repeat(n / 50), "html"],
    ["deep svg groups", 12_500, (n: number) => "<svg>" + "<g>".repeat(n) + "</g>".repeat(n) + "</svg>x", "html"],
    ["script look-alikes", 12_500, (n: number) => "<script><!--<script>" + "</script>-".repeat(n), "html"],
  ] as const)("renders hostile rich text in linear time: %s", (_say, n, input, from) => {
    expect(linearViolations(input, (s) => html(s, { from }), { n })).toEqual([])
  }, 30_000)

  it("renders deep nesting without a stack overflow, and drops what a browser drops", () => {
    expect(html("<b>".repeat(5_000) + "x", { from: "html" })).toContain("x")
    expect(html("<svg>" + "<g>".repeat(50_000) + "</g>".repeat(50_000) + "</svg>x", { from: "html" })).toContain("x")
  }, 30_000)

  it("reads huge rich text without a stack overflow", () => {
    expect(html("<span>" + "<br>".repeat(150_000) + "x</span>", { from: "html" })).toContain("x")
    expect(html("<p><span>" + "a<i></i>".repeat(150_000) + "</span></p>", { from: "html" })).toContain("aaa")
    expect(looksLikeRichText("<p ".repeat(40_000))).toBe(false)
    // Marks nested in marks of the same kind add nothing, so a <br> split stays small.
    const nested = richTextBlocks('<b><i><a href="https://x.org">'.repeat(11) + "x<br>".repeat(100_000))
    expect(JSON.stringify(nested).length).toBeLessThan(25_000_000)
  }, 30_000)

  it.each([
    ["line breaks in a span", 25_000, (n: number) => "<span>" + "<br>".repeat(n) + "x</span>"],
    ["empty marks between letters", 12_500, (n: number) => "<p><span>" + "a<i></i>".repeat(n) + "</span></p>"],
  ])("reads huge rich text in linear time: %s", (_say, n, input) => {
    expect(linearViolations(input, (s) => html(s, { from: "html" }), { n })).toEqual([])
  }, 30_000)

  it("splits nested marks at <br> in linear time", () => {
    const nested = (n: number) => '<b><i><a href="https://x.org">'.repeat(11) + "x<br>".repeat(n)
    expect(linearViolations(nested, (s) => richTextBlocks(s), { n: 10_000 })).toEqual([])
  }, 30_000)

  it.each([
    // No `>` at all: answered from one scan.
    ["tag openers with no `>`", 40_000, (n: number) => "<p ".repeat(n), false],
    // A `>` first, then only tag openers: every candidate is read, and none may rescan the rest.
    ["tag openers after the only `>`", 40_000, (n: number) => ">" + "<p ".repeat(n), false],
    ["tag openers before the last `>`", 40_000, (n: number) => "<p ".repeat(n) + ">", true],
  ])("decides `auto` in linear time: %s", (_say, n, input, rich) => {
    expect(looksLikeRichText(input(n))).toBe(rich)
    expect(linearViolations(input, (s) => looksLikeRichText(s), { n })).toEqual([])
    expect(linearViolations(input, (s) => html(s, { from: "auto" }), { n: n / 4 })).toEqual([])
  }, 30_000)

  it("charges every marker run to the budget (no K×L work)", () => {
    // K markers inside the bold, then a run of L closers: the work must grow with K + L, not K × L.
    const kByL = (n: number) => "**" + "*a ".repeat(n / 500) + "a" + "*".repeat(n)
    expect(linearViolations(kByL, (s) => html(s), { n: 250_000 })).toEqual([])
  }, 30_000)

  it("from=html renders an editor's text, with its markup as elements and its Markdown as text", () => {
    const out = html("<p># Plan <strong>now</strong></p><script>alert(1)</script>", { from: "html" })
    expect(out).not.toContain("<h1")
    expect(out).not.toContain("<script")
    expect(out).toContain("# Plan <strong>now</strong>")
  })
})
