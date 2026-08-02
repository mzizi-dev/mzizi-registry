"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface MediaTrack {
  id: string
  title: string
  artist?: string
  thumbnail?: string
  type: "audio" | "video" | "live"
  duration?: number
}

interface NyuchiPersistentPlayerProps {
  track?: MediaTrack | null
  isPlaying?: boolean
  progress?: number
  onPlay?: () => void
  onPause?: () => void
  onExpand?: () => void
  onClose?: () => void
  className?: string
}

export function NyuchiPersistentPlayer({
  track,
  isPlaying = false,
  progress = 0,
  onPlay,
  onPause,
  onExpand,
  onClose,
  className,
}: NyuchiPersistentPlayerProps) {
  const { motion } = useNyuchiHarness("persistent-player")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  if (!track) return null

  return (
    <div
      data-slot="nyuchi-persistent-player"
      data-portal="https://mzizi.dev/components/nyuchi-persistent-player"
      data-playing={isPlaying || undefined}
      role="region"
      aria-label={`Now playing: ${track.title}`}
      style={animStyle}
      className={cn(
        "safe-area-bottom fixed right-0 bottom-16 left-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm",
        className
      )}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center gap-3 px-4 py-2">
        {/* Thumbnail */}
        {track.thumbnail && (
          <button
            onClick={onExpand}
            className="size-10 shrink-0 overflow-hidden rounded-[var(--radius-sm,7px)] bg-muted"
          >
            <img src={track.thumbnail} alt="" className="size-full object-cover" loading="lazy" />
          </button>
        )}

        {/* Track info */}
        <button onClick={onExpand} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{track.title}</p>
          {track.artist && <p className="truncate text-xs text-muted-foreground">{track.artist}</p>}
        </button>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={isPlaying ? onPause : onPlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex size-10 min-h-[48px] min-w-[48px] items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {isPlaying ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            aria-label="Close player"
            className="flex size-10 min-h-[48px] min-w-[48px] items-center justify-center rounded-full transition-colors hover:bg-muted"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export type { MediaTrack, NyuchiPersistentPlayerProps }
