"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChapterReaderProps extends React.ComponentProps<"article"> {
  title: string
  chapterNumber?: number
  content: string
  authorName?: string
  wordCount?: number
  readingTimeMin?: number
  fontSize?: "sm" | "default" | "lg" | "xl"
  onBookmark?: () => void
  isBookmarked?: boolean
  onNextChapter?: () => void
  onPrevChapter?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

const fontSizeClasses = {
  sm: "text-sm leading-relaxed",
  default: "text-base leading-relaxed",
  lg: "text-lg leading-loose",
  xl: "text-xl leading-loose",
}

function ChapterReader({
  title,
  chapterNumber,
  content,
  authorName,
  wordCount,
  readingTimeMin,
  fontSize = "default",
  onBookmark,
  isBookmarked,
  onNextChapter,
  onPrevChapter,
  hasNext,
  hasPrev,
  className,
  ...props
}: ChapterReaderProps) {
  return (
    <article
      data-slot="chapter-reader"
      data-portal="https://mzizi.dev/components/chapter-reader"
      className={cn("mx-auto max-w-2xl px-4 py-8", className)}
      {...props}
    >
      {/* Header */}
      <header className="mb-8 text-center">
        {chapterNumber !== undefined && (
          <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Chapter {chapterNumber}
          </div>
        )}
        <h1 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-serif, serif)" }}>
          {title}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          {authorName && <span>by {authorName}</span>}
          {wordCount && <span>{wordCount.toLocaleString()} words</span>}
          {readingTimeMin && <span>{readingTimeMin} min read</span>}
        </div>
        {onBookmark && (
          <button
            onClick={onBookmark}
            className="mt-3 inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {isBookmarked ? "★ Bookmarked" : "☆ Bookmark"}
          </button>
        )}
      </header>

      {/* Content */}
      <div
        className={cn(
          "prose prose-neutral dark:prose-invert max-w-none",
          fontSizeClasses[fontSize]
        )}
        style={{ fontFamily: "var(--font-serif, serif)" }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Navigation */}
      {(hasPrev || hasNext) && (
        <nav className="mt-12 flex items-center justify-between border-t border-border pt-6">
          {hasPrev && onPrevChapter ? (
            <button
              onClick={onPrevChapter}
              className="h-12 rounded-full border border-border px-6 text-sm font-medium transition-colors hover:bg-muted"
            >
              ← Previous
            </button>
          ) : (
            <div />
          )}
          {hasNext && onNextChapter ? (
            <button
              onClick={onNextChapter}
              className="h-12 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
            >
              Next Chapter →
            </button>
          ) : (
            <div />
          )}
        </nav>
      )}
    </article>
  )
}

export { ChapterReader }
export type { ChapterReaderProps }
