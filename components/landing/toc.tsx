"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// "On This Page" floating TOC for long-form MDX routes. Walks the
// rendered `<article data-mdx>` element for h2/h3 with stable IDs
// (generated at compile time by `rehype-slug`), then uses
// IntersectionObserver as a scroll-spy to highlight the active heading.
//
// Returns `null` on routes without headings (landing, playground, etc.)
// so it disappears from the shell rather than showing an empty shelf.

interface TocEntry {
  id: string
  text: string
  level: 2 | 3
}

export function Toc({ className }: { className?: string }) {
  const [entries, setEntries] = React.useState<TocEntry[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Collect headings — rerun on every route change (no internal nav
  // here, so the MDX body is the only thing that changes between routes
  // via Next's client-side navigation).
  React.useEffect(() => {
    const root =
      document.querySelector("article[data-mdx]") ?? document.querySelector("main") ?? document.body
    const headings = Array.from(root.querySelectorAll("h2, h3")) as HTMLHeadingElement[]
    const next: TocEntry[] = headings
      .filter((h) => h.id)
      .map((h) => ({
        id: h.id,
        text: h.textContent ?? "",
        level: h.tagName === "H2" ? 2 : 3,
      }))
    setEntries(next)
  }, [])

  // Scroll-spy via IntersectionObserver. rootMargin biases the
  // "active" heading toward the top of the viewport — once a heading
  // scrolls past the top 80px, the next one becomes active.
  React.useEffect(() => {
    if (entries.length === 0) return
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((o) => o.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id)
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )
    for (const entry of entries) {
      const el = document.getElementById(entry.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  return (
    <nav aria-label="On this page" className={cn("flex flex-col gap-0.5 text-xs", className)}>
      <p className="mb-2 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        On this page
      </p>
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={cn(
            "block border-s py-0.5 ps-3 transition-colors",
            entry.level === 3 && "ps-6",
            activeId === entry.id
              ? "border-foreground font-medium text-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {entry.text}
        </a>
      ))}
    </nav>
  )
}
