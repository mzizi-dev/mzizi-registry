import * as React from "react"

import { cn } from "@/lib/utils"
import {
  MARKDOWN_CLASSES as C,
  cellClass,
  headingTag,
  isExternal,
  markdownBlocks,
  type MarkdownBlock,
  type MarkdownInline,
  type MarkdownLinkPolicy,
  type MarkdownList,
  type MarkdownSource,
} from "@/lib/markdown-parse"

/**
 * MARKDOWN RENDERER — N2 primitive, React (`contracts/ui/markdown-renderer`).
 *
 * Safe by construction: the Markdown is parsed into a typed tree (`markdown-parse.ts`) and the
 * tree is drawn as React elements. There is no HTML string and no `dangerouslySetInnerHTML`,
 * so text is always a text node and an address is always an escaped attribute. Raw HTML in the
 * source shows as text. Links pass an allow-list of schemes; a refused link keeps its words, and a
 * kept one shows its address on hover (`title`), normalised so an IDN look-alike host reads as punycode.
 * The Astro (`markdown-renderer.astro`) and Rust (`markdown-renderer.rs`) builds draw the same
 * tree with the same classes.
 */
interface MarkdownRendererProps extends Omit<React.ComponentProps<"div">, "children" | "content"> {
  /** The Markdown (or, with `from`, rich-text HTML) to show. Untrusted text is fine. */
  content: string
  /** `safe` keeps http, https, mailto, tel and relative links; `https` keeps https only. */
  links?: MarkdownLinkPolicy
  /** `markdown`; `html` reads rich text (an editor's HTML) into Markdown first; `auto` decides by its tags. */
  from?: MarkdownSource
  /** The heading level a `#` heading renders at (1–6); deeper levels follow, capped at 6. */
  headingBase?: number
}

function Inlines({ c }: { c: MarkdownInline[] }) {
  return (
    <>
      {c.map((x, i) => {
        switch (x.t) {
          case "text":
            return <React.Fragment key={i}>{x.v}</React.Fragment>
          case "code":
            return (
              <code key={i} className={C.code}>
                {x.v}
              </code>
            )
          case "strong":
            return (
              <strong key={i}>
                <Inlines c={x.c} />
              </strong>
            )
          case "em":
            return (
              <em key={i}>
                <Inlines c={x.c} />
              </em>
            )
          case "link":
            return isExternal(x.href) ? (
              <a key={i} href={x.href} title={x.title} className={C.a} target="_blank" rel="noopener noreferrer">
                <Inlines c={x.c} />
              </a>
            ) : (
              <a key={i} href={x.href} title={x.title} className={C.a}>
                <Inlines c={x.c} />
              </a>
            )
        }
      })}
    </>
  )
}

function Lines({ lines }: { lines: MarkdownInline[][] }) {
  return (
    <>
      {lines.map((l, j) => (
        <React.Fragment key={j}>
          {j ? <br /> : null}
          <Inlines c={l} />
        </React.Fragment>
      ))}
    </>
  )
}

function List({ list, nested }: { list: MarkdownList; nested?: boolean }) {
  const items = list.items.map((it, j) => (
    <li key={j}>
      <Lines lines={it.lines} />
      {it.children.map((sub, k) =>
        sub.kind === "lines" ? <Lines key={k} lines={sub.lines} /> : <List key={k} list={sub} nested />
      )}
    </li>
  ))
  const className = cn(C[list.kind], nested && C.nested)
  return list.kind === "ol" ? (
    <ol className={className} start={list.start === 1 ? undefined : list.start}>
      {items}
    </ol>
  ) : (
    <ul className={className}>{items}</ul>
  )
}

function Blocks({ blocks, headingBase }: { blocks: MarkdownBlock[]; headingBase: number }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "p":
            return (
              <p key={i} className={C.p}>
                <Lines lines={b.lines} />
              </p>
            )
          case "h": {
            const Tag = headingTag(b.level, headingBase)
            return (
              <Tag key={i} className={C[Tag]}>
                <Inlines c={b.c} />
              </Tag>
            )
          }
          case "ul":
          case "ol":
            return <List key={i} list={b} />
          case "quote":
            return (
              <blockquote key={i} className={C.quote}>
                <Blocks blocks={b.children} headingBase={headingBase} />
              </blockquote>
            )
          case "code":
            return (
              <pre key={i} className={C.pre}>
                <code data-language={b.lang || undefined}>{b.v}</code>
              </pre>
            )
          case "hr":
            return <hr key={i} className={C.hr} />
          case "table":
            return (
              <div key={i} className={C.tableWrap}>
                <table className={C.table}>
                  <thead>
                    <tr>
                      {b.head.map((cell, k) => (
                        <th key={k} scope="col" className={cellClass("th", b.align[k] ?? null)}>
                          <Inlines c={cell} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, k) => (
                          <td key={k} className={cellClass("td", b.align[k] ?? null)}>
                            <Inlines c={cell} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      })}
    </>
  )
}

function MarkdownRenderer({
  content,
  links = "safe",
  from = "markdown",
  headingBase = 1,
  className,
  ...props
}: MarkdownRendererProps) {
  // No hooks: a server component, and parsing is linear in the text.
  const blocks = markdownBlocks(content, { links, from })
  return (
    <div
      data-slot="markdown-renderer"
      data-portal="https://mzizi.dev/components/markdown-renderer"
      className={cn(C.root, className)}
      {...props}
    >
      <Blocks blocks={blocks} headingBase={headingBase} />
    </div>
  )
}

export { MarkdownRenderer }
export type { MarkdownRendererProps }
