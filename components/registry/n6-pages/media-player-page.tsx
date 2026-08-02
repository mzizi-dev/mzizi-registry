"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface MediaPlayerPageProps {
  mediaType?: "video" | "audio" | "live"
  title?: string
  creator?: { name: string; avatar?: string }
  player?: React.ReactNode
  controls?: React.ReactNode
  engagement?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function MediaPlayerPage({
  mediaType = "video",
  title,
  creator,
  player,
  controls,
  engagement,
  children,
  loading = false,
  className,
}: MediaPlayerPageProps) {
  if (loading)
    return (
      <main
        data-slot="media-player-page"
        data-portal="https://mzizi.dev/components/media-player-page"
        data-loading
        role="main"
        className="animate-pulse"
      >
        <div className="aspect-[var(--aspect-media-wide,16/9)] bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
      </main>
    )
  return (
    <main
      data-slot="media-player-page"
      data-media={mediaType}
      role="main"
      aria-label={title || "Media"}
      className={cn("flex flex-col", className)}
    >
      {player && (
        <section aria-label="Player" className={mediaType === "audio" ? "p-4" : ""}>
          {player}
        </section>
      )}
      {controls && (
        <section aria-label="Controls" className="px-4 py-2">
          {controls}
        </section>
      )}
      <div className="px-4 py-3">
        {title && <h1 className="text-lg font-bold">{title}</h1>}
        {creator && (
          <div className="mt-2 flex items-center gap-2">
            <div className="size-8 overflow-hidden rounded-full bg-muted">
              {creator.avatar && (
                <img src={creator.avatar} alt="" className="size-full object-cover" />
              )}
            </div>
            <span className="text-sm font-medium">{creator.name}</span>
          </div>
        )}
      </div>
      {engagement && (
        <section aria-label="Engagement" className="border-y border-border px-4 py-2">
          {engagement}
        </section>
      )}
      <section aria-label="Related content" className="p-4">
        {children}
      </section>
    </main>
  )
}
export type { MediaPlayerPageProps }
