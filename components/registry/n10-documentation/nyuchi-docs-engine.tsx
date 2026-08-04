"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

// NYUCHI DOCS ENGINE — N10: Documentation Outlier
//
// Renders the documentation portal UI. Data comes from the database
// (documentation_pages table) via nyuchi-docs-api.
//
// Architecture note:
//   - DocPage.relatedNodes mirrors documentation_pages.related_nodes (integer[])
//   - DocPage.content is markdown/MDX — render with your MDX processor of choice
//   - This component handles layout and navigation; content rendering is
//     delegated to the renderContent prop so consumers choose their renderer

export interface DocPage {
  slug: string
  title: string
  category: string
  subcategory?: string
  content: string
  description?: string
  keywords?: string[]
  relatedNodes?: number[]
  relatedComponents?: string[]
  version?: string
  updatedAt?: string
}

export interface DocsEngineProps {
  pages: DocPage[]
  currentSlug?: string
  onNavigate?: (slug: string) => void
  search?: string
  onSearch?: (query: string) => void
  // Delegate content rendering so consumers can use their MDX processor
  // Falls back to a plain pre-formatted text display if not provided
  renderContent?: (content: string, page: DocPage) => React.ReactNode
  className?: string
}

// Ecosystem node labels for the relatedNodes display
const NODE_LABELS: Record<number, string> = {
  1: "N1 Tokens",
  2: "N2 Primitives",
  3: "N3 Brand",
  4: "N4 Safety",
  5: "N5 Resilience",
  6: "N6 Pages",
  7: "N7 Shell",
  8: "N8 Assurance",
  9: "N9 Fundi",
  10: "N10 Docs",
}

function DefaultContentRenderer({ content }: { content: string }) {
  // Minimal safe fallback: render as preformatted text
  // Replace with your MDX processor (next-mdx-remote, @mdx-js/react, etc.)
  return <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{content}</pre>
}

export function DocsEngine({
  pages,
  currentSlug,
  onNavigate,
  search = "",
  onSearch,
  renderContent,
  className,
}: DocsEngineProps) {
  const currentPage = pages.find((p) => p.slug === currentSlug)

  // Filter pages by search query across title, description, and keywords
  const filteredPages = search.trim()
    ? pages.filter((p) => {
        const q = search.toLowerCase()
        return (
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.keywords?.some((k) => k.toLowerCase().includes(q))
        )
      })
    : pages

  // Group pages by category for sidebar navigation
  const categories = [...new Set(filteredPages.map((p) => p.category))]

  const handleKeyDown = (e: React.KeyboardEvent, slug: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onNavigate?.(slug)
    }
  }

  return (
    <div
      data-slot="nyuchi-docs-engine"
      data-portal="https://mzizi.dev/components/nyuchi-docs-engine"
      className={cn("flex h-screen overflow-hidden bg-background", className)}
    >
      {/* Sidebar */}
      <aside
        className="w-64 shrink-0 overflow-y-auto border-r border-border p-4"
        aria-label="Documentation navigation"
      >
        {/* Search */}
        {onSearch && (
          <div className="mb-4">
            <label htmlFor="docs-search" className="sr-only">
              Search documentation
            </label>
            <input
              id="docs-search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search docs..."
              className="min-h-[48px] w-full rounded-[var(--radius-md,12px)] border border-border bg-input px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            />
          </div>
        )}

        {/* Category sections */}
        {categories.length === 0 && search && (
          <p className="px-2 text-sm text-muted-foreground">No results for "{search}"</p>
        )}

        {categories.map((cat) => (
          <div key={cat} className="mb-4">
            <p className="mb-1 px-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {cat.replace(/-/g, " ")}
            </p>
            <nav role="list">
              {filteredPages
                .filter((p) => p.category === cat)
                .map((p) => (
                  <button
                    key={p.slug}
                    role="listitem"
                    onClick={() => onNavigate?.(p.slug)}
                    onKeyDown={(e) => handleKeyDown(e, p.slug)}
                    aria-current={currentSlug === p.slug ? "page" : undefined}
                    className={cn(
                      "block min-h-[44px] w-full rounded-[var(--radius-sm,7px)] px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
                      currentSlug === p.slug
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {p.title}
                  </button>
                ))}
            </nav>
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto p-8"
        role="main"
        aria-label={currentPage?.title ?? "Documentation"}
      >
        {currentPage ? (
          <article className="max-w-3xl">
            {/* Page header */}
            <header className="mb-8 border-b border-border pb-6">
              <h1 className="font-serif text-3xl font-bold">{currentPage.title}</h1>

              {currentPage.description && (
                <p className="mt-2 text-lg text-muted-foreground">{currentPage.description}</p>
              )}

              {/* Metadata row */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {currentPage.version && <span className="font-mono">v{currentPage.version}</span>}
                {currentPage.updatedAt && (
                  <time>Updated {new Date(currentPage.updatedAt).toLocaleDateString()}</time>
                )}
              </div>

              {/* Related ecosystem nodes */}
              {currentPage.relatedNodes && currentPage.relatedNodes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Related ecosystem nodes">
                  {currentPage.relatedNodes.map((n) => (
                    <span
                      key={n}
                      className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground"
                      title={NODE_LABELS[n] ?? `N${n}`}
                    >
                      {NODE_LABELS[n] ?? `N${n}`}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Content — delegate to renderContent or fall back to default */}
            <div className="prose prose-sm max-w-none text-foreground">
              {renderContent ? (
                renderContent(currentPage.content, currentPage)
              ) : (
                <DefaultContentRenderer content={currentPage.content} />
              )}
            </div>
          </article>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              {pages.length === 0
                ? "No documentation pages found."
                : "Select a page from the sidebar."}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

// `DocsEngineProps` and `DocPage` are already exported at their declarations, so
// re-listing them here was a TS2484 conflict and this file did not compile in any
// consumer that installed it. Only the alias is a genuinely new export.
export type { DocsEngineProps as NyuchiDocsEngineProps }
