import * as React from "react"
import { Star, QuoteIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  author: string
  rating: number
  content: string
  date?: string
  avatar?: string
  className?: string
}

function ReviewCard({
  loading = false,
  author,
  rating,
  content,
  date,
  avatar,
  className,
}: ReviewCardProps) {
  if (loading)
    return (
      <div
        data-slot="review-card"
        data-portal="https://mzizi.dev/components/review-card"
        data-loading
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    )

  return (
    <div
      data-slot="review-card"
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-lg,14px)] bg-card p-6 text-sm text-card-foreground ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "size-4",
                i < rating
                  ? "fill-[var(--status-warning, var(--color-gold, #FFD740))] text-[var(--status-warning, var(--color-gold, #FFD740))]"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
        </div>
        <QuoteIcon className="size-5 text-muted-foreground/20" />
      </div>
      <p className="flex-1 text-sm leading-relaxed text-foreground">{content}</p>
      <div className="flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={author} className="size-8 rounded-full object-cover" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {author.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">{author}</span>
          {date && <span className="text-xs text-muted-foreground">{date}</span>}
        </div>
      </div>
    </div>
  )
}

export { ReviewCard }
export type { ReviewCardProps }
