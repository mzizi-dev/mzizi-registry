import * as React from "react"
import { Star, QuoteIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  author: string
  rating: number
  content: string
  date?: string
  avatar?: string
  className?: string
}

function ReviewCard({ author, rating, content, date, avatar, className }: ReviewCardProps) {
  return (
    <div
      data-slot="review-card"
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-card p-6 text-sm text-card-foreground ring-1 ring-foreground/10",
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
                  ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
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
