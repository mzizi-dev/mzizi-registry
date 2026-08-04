"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface VoiceNotePlayerProps extends React.ComponentProps<"div"> {
  /** Audio source URL */
  src: string
  /** Duration in seconds */
  duration: number
  /** Player already listened */
  listened?: boolean
  /** Playback speed options */
  speeds?: number[]
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function VoiceNotePlayer({
  src,
  duration,
  listened = false,
  speeds = [1, 1.5, 2],
  className,
  ...props
}: VoiceNotePlayerProps) {
  const [playing, setPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [speed, setSpeed] = React.useState(1)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setPlaying(!playing)
  }

  const cycleSpeed = () => {
    const idx = speeds.indexOf(speed)
    const next = speeds[(idx + 1) % speeds.length]
    setSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setProgress(audio.currentTime / audio.duration)
    const onEnd = () => {
      setPlaying(false)
      setProgress(0)
    }
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnd)
    }
  }, [])

  return (
    <div
      data-slot="voice-note-player"
      data-portal="https://mzizi.dev/components/voice-note-player"
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-2",
        listened ? "bg-muted/30" : "bg-[var(--color-malachite,#64FFDA)]/10",
        className
      )}
      role="region"
      aria-label="Voice message"
      {...props}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-malachite,#64FFDA)] text-sm font-bold text-[var(--primary-foreground,#0A0A0A)]"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <div className="flex-1">
        {/* Waveform placeholder — visual bars */}
        <div className="flex h-6 items-end gap-px">
          {Array.from({ length: 30 }).map((_, i) => {
            const height = 20 + Math.sin(i * 0.7) * 40 + Math.random() * 20
            const filled = i / 30 <= progress
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${height}%`,
                  backgroundColor: filled
                    ? "var(--color-malachite,#64FFDA)"
                    : "var(--color-malachite,#64FFDA)33",
                }}
              />
            )
          })}
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {formatDuration(duration * (1 - progress))}
        </span>
        <button
          onClick={cycleSpeed}
          className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground"
        >
          {speed}×
        </button>
      </div>
    </div>
  )
}

export { VoiceNotePlayer }
export type { VoiceNotePlayerProps }
