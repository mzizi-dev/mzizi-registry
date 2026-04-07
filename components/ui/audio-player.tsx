"use client"

import * as React from "react"
import { Play, Pause } from "lucide-react"

import { cn } from "@/lib/utils"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function AudioPlayer({
  className,
  src,
  title,
  artist,
  ...props
}: React.ComponentProps<"div"> & {
  src: string
  title?: string
  artist?: string
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [speed, setSpeed] = React.useState(1)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed)
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
    setSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) audioRef.current.currentTime = time
  }

  return (
    <div
      data-slot="audio-player"
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/80"
      >
        {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {(title || artist) && (
          <div className="flex items-baseline gap-1.5 truncate">
            {title && <span className="truncate text-sm font-medium text-foreground">{title}</span>}
            {artist && <span className="truncate text-xs text-muted-foreground">{artist}</span>}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
          <span className="text-xs text-muted-foreground tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>
      <button
        onClick={cycleSpeed}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {speed}x
      </button>
    </div>
  )
}

export { AudioPlayer }
