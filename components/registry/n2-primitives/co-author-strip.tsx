import * as React from "react"
import { cn } from "@/lib/utils"

interface CoAuthor {
  id: string
  name: string
  avatar?: string
  revenueSharePct: number
}

interface CoAuthorStripProps extends React.ComponentProps<"div"> {
  authors: CoAuthor[]
}

function CoAuthorStrip({ authors, className, ...props }: CoAuthorStripProps) {
  if (authors.length <= 1) return null

  return (
    <div
      data-slot="co-author-strip"
      data-portal="https://mzizi.dev/components/co-author-strip"
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Co-authored by ${authors.map((a) => a.name).join(", ")}`}
      {...props}
    >
      <div className="flex -space-x-1.5">
        {authors.map((author) => (
          <div
            key={author.id}
            className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-medium ring-2 ring-background"
            title={`${author.name} (${author.revenueSharePct}%)`}
          >
            {author.avatar ? (
              <img
                src={author.avatar}
                alt={author.name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              author.name.charAt(0)
            )}
          </div>
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground">
        {authors.length} authors · {authors.map((a) => `${a.revenueSharePct}%`).join("/")} split
      </span>
    </div>
  )
}

export { CoAuthorStrip }
export type { CoAuthorStripProps }
