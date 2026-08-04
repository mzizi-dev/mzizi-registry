import * as React from "react"
import { cn } from "@/lib/utils"

type WorkStatus = "ongoing" | "completed" | "hiatus" | "dropped"
type WorkType =
  "web_novel" | "short_story" | "manga" | "manhwa" | "comic" | "poetry_collection" | "light_novel"

interface NovelCoverProps extends React.ComponentProps<"div"> {
  title: string
  coverUrl?: string
  author: string
  genre?: string
  rating?: number
  chapterCount?: number
  status?: WorkStatus
  type?: WorkType
  onClick?: () => void
}

const statusColors: Record<WorkStatus, string> = {
  ongoing: "bg-[var(--color-malachite,#64FFDA)]/15 text-[var(--color-malachite,#64FFDA)]",
  completed: "bg-[var(--color-cobalt,#00B0FF)]/15 text-[var(--color-cobalt,#00B0FF)]",
  hiatus: "bg-[var(--color-gold,#FFD740)]/15 text-[var(--color-gold,#FFD740)]",
  dropped: "bg-muted text-muted-foreground",
}

function NovelCover({
  title,
  coverUrl,
  author,
  genre,
  rating,
  chapterCount,
  status,
  type,
  onClick,
  className,
  ...props
}: NovelCoverProps) {
  return (
    <div
      data-slot="novel-cover"
      data-portal="https://mzizi.dev/components/novel-cover"
      className={cn(
        "group overflow-hidden rounded-[var(--radius-lg,14px)]",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {/* Cover image — book aspect ratio (2:3) */}
      <div className="relative aspect-[2/3] bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="size-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 p-4 text-center text-sm font-medium text-muted-foreground">
            {title}
          </div>
        )}
        {status && (
          <span
            className={cn(
              "absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
              statusColors[status]
            )}
          >
            {status}
          </span>
        )}
        {rating !== undefined && (
          <span className="absolute top-2 right-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            ★ {rating.toFixed(1)}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-2">
        <div className="line-clamp-2 text-sm leading-tight font-medium">{title}</div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{author}</div>
        {/* `type` (the WorkType — novel, manhwa, comic …) was destructured and
            never rendered, so a mixed library gave the reader no way to tell one
            medium from another. It leads the meta line because it is the
            coarsest distinction between two covers. */}
        {(type || genre || chapterCount) && (
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {type && <span className="capitalize">{type}</span>}
            {type && (genre || chapterCount) && <span>·</span>}
            {genre && <span>{genre}</span>}
            {genre && chapterCount && <span>·</span>}
            {chapterCount && <span>{chapterCount} ch</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export { NovelCover }
export type { NovelCoverProps }
