import * as React from "react"
import { ExternalLink } from "lucide-react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const relevanceVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      level: {
        high: "bg-mineral-malachite/15 text-mineral-malachite",
        medium: "bg-mineral-gold/15 text-mineral-gold",
        low: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      level: "medium",
    },
  }
)

function getRelevanceLevel(relevance: number): "high" | "medium" | "low" {
  if (relevance >= 0.7) return "high"
  if (relevance >= 0.4) return "medium"
  return "low"
}

function SourceCitation({
  className,
  title,
  url,
  snippet,
  relevance,
  ...props
}: React.ComponentProps<"div"> & {
  title: string
  url: string
  snippet?: string
  relevance?: number
}) {
  const level = relevance !== undefined ? getRelevanceLevel(relevance) : undefined

  return (
    <div
      data-slot="source-citation"
      className={cn(
        "ring-foreground/10 group flex flex-col gap-1.5 rounded-xl bg-card p-3 text-sm ring-1",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
        >
          {title}
          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
        </a>
        {level && (
          <span className={relevanceVariants({ level })}>
            {Math.round(relevance! * 100)}%
          </span>
        )}
      </div>
      {snippet && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{snippet}</p>
      )}
    </div>
  )
}

export { SourceCitation }
