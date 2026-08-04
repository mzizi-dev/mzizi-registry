"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Track {
  id: string
  title: string
  artist: string
  duration: string
  previewUrl?: string
}

interface MusicSelectorProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  tracks: Track[]
  selectedId?: string
  onSelect?: (trackId: string) => void
  onPreview?: (trackId: string) => void
  searchable?: boolean
}

function MusicSelector({
  tracks,
  selectedId,
  onSelect,
  onPreview,
  searchable = true,
  className,
  ...props
}: MusicSelectorProps) {
  const [search, setSearch] = React.useState("")
  const filtered = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      data-slot="music-selector"
      data-portal="https://mzizi.dev/components/music-selector"
      className={cn("space-y-2", className)}
      {...props}
    >
      {searchable && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search music…"
          className="h-10 w-full rounded-full border border-input bg-input/30 px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      )}
      <div className="max-h-60 space-y-0.5 overflow-y-auto">
        {filtered.map((track) => (
          <button
            key={track.id}
            onClick={() => onSelect?.(track.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-md,12px)] px-3 py-2.5 text-left transition-colors",
              selectedId === track.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
            )}
          >
            {/* Play preview */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPreview?.(track.id)
              }}
              aria-label={`Preview ${track.title}`}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs hover:bg-border"
            >
              ▶
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{track.title}</div>
              <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {track.duration}
            </span>
            {selectedId === track.id && <span className="text-primary">✓</span>}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">No tracks found</div>
        )}
      </div>
    </div>
  )
}

export { MusicSelector }
export type { MusicSelectorProps }
