import * as React from "react"

import { cn } from "@/lib/utils"

interface MarkdownRendererProps extends React.ComponentProps<"div"> {
  content: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderInline(text: string): string {
  let result = text
  // Code spans (before other inline formatting)
  result = result.replace(
    /`([^`]+)`/g,
    '<code class="rounded-md bg-muted px-1.5 py-0.5 font-mono text-sm">$1</code>'
  )
  // Bold + italic
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  // Bold
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  // Italic
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>")
  // Links
  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-cobalt underline underline-offset-4 hover:text-cobalt/80" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  return result
}

function parseMarkdown(content: string): string {
  const lines = content.split("\n")
  const html: string[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let inList = false
  let inOrderedList = false
  let inBlockquote = false
  let inTable = false
  let tableRows: string[] = []

  const flushList = () => {
    if (inList) {
      html.push("</ul>")
      inList = false
    }
    if (inOrderedList) {
      html.push("</ol>")
      inOrderedList = false
    }
  }

  const flushBlockquote = () => {
    if (inBlockquote) {
      html.push("</blockquote>")
      inBlockquote = false
    }
  }

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      html.push(
        '<table class="w-full border-collapse text-sm"><thead><tr>' +
          tableRows[0] +
          "</tr></thead><tbody>"
      )
      for (let i = 2; i < tableRows.length; i++) {
        html.push("<tr>" + tableRows[i] + "</tr>")
      }
      html.push("</tbody></table>")
      tableRows = []
      inTable = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html.push(
          '<pre class="overflow-x-auto rounded-xl bg-muted/50 p-4 font-mono text-sm"><code>' +
            escapeHtml(codeBlockContent.join("\n")) +
            "</code></pre>"
        )
        codeBlockContent = []
        inCodeBlock = false
      } else {
        flushList()
        flushBlockquote()
        flushTable()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // Empty line
    if (line.trim() === "") {
      flushList()
      flushBlockquote()
      flushTable()
      continue
    }

    // Table rows
    const tableMatch = line.match(/^\|(.+)\|$/)
    if (tableMatch) {
      if (!inTable) {
        flushList()
        flushBlockquote()
        inTable = true
      }
      const separator = line.match(/^\|[\s\-:|]+\|$/)
      if (separator) {
        tableRows.push("__separator__")
      } else {
        const cells = tableMatch[1].split("|").map((c) => c.trim())
        const tag = tableRows.length === 0 ? "th" : "td"
        const cellClass =
          tag === "th"
            ? "border border-border px-3 py-2 text-left font-medium"
            : "border border-border px-3 py-2"
        tableRows.push(
          cells
            .map((cell) => `<${tag} class="${cellClass}">${renderInline(cell)}</${tag}>`)
            .join("")
        )
      }
      continue
    } else if (inTable) {
      flushTable()
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      flushBlockquote()
      const level = headingMatch[1].length
      const text = renderInline(escapeHtml(headingMatch[2]))
      const headingClasses: Record<number, string> = {
        1: "font-serif text-3xl font-bold tracking-tight mt-8 mb-4",
        2: "font-serif text-2xl font-semibold tracking-tight mt-6 mb-3",
        3: "font-serif text-xl font-semibold mt-5 mb-2",
        4: "text-lg font-semibold mt-4 mb-2",
        5: "text-base font-semibold mt-3 mb-1",
        6: "text-sm font-semibold mt-3 mb-1 text-muted-foreground",
      }
      html.push(`<h${level} class="${headingClasses[level]}">${text}</h${level}>`)
      continue
    }

    // Blockquotes
    const blockquoteMatch = line.match(/^>\s*(.*)$/)
    if (blockquoteMatch) {
      flushList()
      if (!inBlockquote) {
        html.push(
          '<blockquote class="border-l-4 border-cobalt/30 pl-4 italic text-muted-foreground">'
        )
        inBlockquote = true
      }
      html.push(`<p>${renderInline(escapeHtml(blockquoteMatch[1]))}</p>`)
      continue
    } else if (inBlockquote) {
      flushBlockquote()
    }

    // Unordered list items
    const ulMatch = line.match(/^[-*]\s+(.+)$/)
    if (ulMatch) {
      flushBlockquote()
      if (inOrderedList) {
        html.push("</ol>")
        inOrderedList = false
      }
      if (!inList) {
        html.push('<ul class="list-disc space-y-1 pl-6">')
        inList = true
      }
      html.push(`<li>${renderInline(escapeHtml(ulMatch[1]))}</li>`)
      continue
    }

    // Ordered list items
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      flushBlockquote()
      if (inList) {
        html.push("</ul>")
        inList = false
      }
      if (!inOrderedList) {
        html.push('<ol class="list-decimal space-y-1 pl-6">')
        inOrderedList = true
      }
      html.push(`<li>${renderInline(escapeHtml(olMatch[1]))}</li>`)
      continue
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      flushList()
      flushBlockquote()
      html.push('<hr class="my-6 border-border" />')
      continue
    }

    // Paragraph
    flushList()
    flushBlockquote()
    html.push(
      `<p class="leading-7 [&:not(:first-child)]:mt-4">${renderInline(escapeHtml(line))}</p>`
    )
  }

  // Flush remaining state
  flushList()
  flushBlockquote()
  flushTable()
  if (inCodeBlock) {
    html.push(
      '<pre class="overflow-x-auto rounded-xl bg-muted/50 p-4 font-mono text-sm"><code>' +
        escapeHtml(codeBlockContent.join("\n")) +
        "</code></pre>"
    )
  }

  return html.join("\n")
}

function MarkdownRenderer({ content, className, ...props }: MarkdownRendererProps) {
  const html = parseMarkdown(content)

  return (
    <div
      data-slot="markdown-renderer"
      className={cn("prose-mukoko text-sm leading-relaxed text-foreground", className)}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  )
}

export { MarkdownRenderer }
export type { MarkdownRendererProps }
