import { notFound } from "next/navigation"
import sanitizeHtml from "sanitize-html"
import { getDocumentationPage } from "@/lib/db"

/**
 * Extremely small markdown renderer — handles the subset we actually need for
 * blog-style doc pages: headings, paragraphs, lists, inline code, fenced code,
 * bold, italic, and links. Runs server-side, output is sanitised.
 *
 * Anything richer (MDX components, JSX interpolation) should stay in the MDX
 * shells — DB content is plain markdown.
 */
function renderMarkdown(body: string): string {
  let html = body

  // Fenced code blocks ```lang\n...\n```
  html = html.replace(/```([a-z0-9]*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    const safe = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    return `<pre class="rounded-xl border border-border bg-muted/30 p-4 font-mono text-sm overflow-x-auto"><code class="language-${lang || "text"}">${safe}</code></pre>`
  })

  // Headings (## up to ######)
  html = html.replace(/^###### (.+)$/gm, '<h6 class="mt-4 text-sm font-semibold">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 class="mt-4 text-base font-semibold">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 class="mt-6 text-lg font-semibold">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 class="mt-8 text-xl font-semibold">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="mt-10 text-2xl font-semibold">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="mt-12 font-serif text-3xl font-bold">$1</h1>')

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">$1</code>'
  )

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-[var(--color-cobalt)] underline underline-offset-2 hover:text-foreground">$1</a>'
  )

  // Unordered list items (simple — line-based)
  html = html.replace(/^(?:- (.+)(?:\n|$))+/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((line) => line.replace(/^- /, ""))
      .map((li) => `<li class="mt-1.5">${li}</li>`)
      .join("")
    return `<ul class="ml-6 list-disc space-y-1 py-2">${items}</ul>`
  })

  // Paragraphs — wrap orphan text blocks
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      if (block.startsWith("<") || block.trim() === "") return block
      return `<p class="mt-4 leading-relaxed text-muted-foreground">${block.replace(/\n/g, " ")}</p>`
    })
    .join("\n\n")

  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "code",
      "pre",
      "a",
      "blockquote",
      "br",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ],
    allowedAttributes: {
      a: ["href", "class", "target", "rel"],
      code: ["class"],
      pre: ["class"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
      h5: ["class"],
      h6: ["class"],
      p: ["class"],
      ul: ["class"],
      ol: ["class"],
      li: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  })
}

/**
 * DB-hydrated documentation page. Reads a row from `documentation_pages` by
 * slug and renders title + body. Used as a shell inside MDX routes (docs,
 * brand, architecture) so every bundu blog-style page is powered by the same
 * Supabase table.
 */
export async function DbDocPage({ slug }: { slug: string }) {
  const page = await getDocumentationPage(slug).catch(() => null)

  if (!page) {
    notFound()
  }

  return (
    <article className="mx-auto w-full max-w-3xl py-8">
      <header className="space-y-3 border-b border-border pb-6">
        <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          {page.category}
        </p>
        <h1 className="font-serif text-4xl font-bold tracking-tight">{page.title}</h1>
        {page.description && <p className="text-lg text-muted-foreground">{page.description}</p>}
      </header>

      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        // Body is sanitised by renderMarkdown via sanitize-html.
        dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }}
      />
    </article>
  )
}
