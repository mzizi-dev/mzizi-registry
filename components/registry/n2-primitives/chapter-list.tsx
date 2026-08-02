"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Chapter {
  id: string
  number: number
  title: string
  wordCount?: number
  publishedAt?: string
  locked?: boolean
  read?: boolean
}

interface ChapterListProps extends React.ComponentProps<"nav"> {
  chapters: Chapter[]
  currentChapterId?: string
  onChapterSelect?: (id: string) => void
}

function ChapterList({
  chapters,
  currentChapterId,
  onChapterSelect,
  className,
  ...props
}: ChapterListProps) {
  return (
    <nav
      data-slot="chapter-list"
      data-portal="https://mzizi.dev/components/chapter-list"
      aria-label="Table of contents"
      className={cn("space-y-1", className)}
      {...props}
    >
      {chapters.map((ch) => (
        <button
          key={ch.id}
          onClick={() => !ch.locked && onChapterSelect?.(ch.id)}
          aria-current={ch.id === currentChapterId ? "page" : undefined}
          disabled={ch.locked}
          className={cn(
            "flex w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-3 py-2.5 text-left text-sm transition-colors",
            ch.id === currentChapterId
              ? "bg-primary/10 font-medium text-primary"
              : "hover:bg-muted",
            ch.locked && "cursor-not-allowed opacity-50",
            ch.read && ch.id !== currentChapterId && "text-muted-foreground"
          )}
        >
          <span className="w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">
            {ch.number}
          </span>
          <span className="flex-1 truncate">{ch.title}</span>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {ch.wordCount && <span>{(ch.wordCount / 1000).toFixed(1)}k</span>}
            {ch.locked && <span className="text-[var(--color-gold,#FFD740)]">🔒</span>}
            {ch.read && !ch.locked && (
              <span className="text-[var(--color-malachite,#64FFDA)]">✓</span>
            )}
          </div>
        </button>
      ))}
    </nav>
  )
}

export { ChapterList }
export type { ChapterListProps }
