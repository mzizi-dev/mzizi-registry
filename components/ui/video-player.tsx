"use client"

import * as React from "react"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"

function VideoPlayer({
  className,
  src,
  poster,
  title,
  ...props
}: React.ComponentProps<"div"> & {
  src: string
  poster?: string
  title?: string
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = React.useState(false)
  const [started, setStarted] = React.useState(false)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setPlaying(true)
      setStarted(true)
    }
  }

  return (
    <div
      data-slot="video-player"
      className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10", className)}
      {...props}
    >
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls={started}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className="aspect-video w-full bg-black object-contain"
        />
        {!playing && !started && (
          <button
            onClick={handlePlay}
            aria-label="Play video"
            className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105">
              <Play className="ml-0.5 size-6" />
            </div>
          </button>
        )}
      </div>
      {title && (
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
      )}
    </div>
  )
}

export { VideoPlayer }
