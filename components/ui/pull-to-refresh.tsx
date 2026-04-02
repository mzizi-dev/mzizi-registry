"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const THRESHOLD = 80

function PullToRefresh({
  onRefresh,
  children,
  loading = false,
  className,
  ...props
}: {
  onRefresh: () => void
  children: React.ReactNode
  loading?: boolean
} & React.ComponentProps<"div">) {
  const [pullDistance, setPullDistance] = React.useState(0)
  const [pulling, setPulling] = React.useState(false)
  const startY = React.useRef(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  function handleTouchStart(e: React.TouchEvent) {
    const container = containerRef.current
    if (!container || container.scrollTop > 0 || loading) return
    startY.current = e.touches[0].clientY
    setPulling(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!pulling || loading) return
    const diff = e.touches[0].clientY - startY.current
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, THRESHOLD * 1.5))
    }
  }

  function handleTouchEnd() {
    if (!pulling) return
    setPulling(false)
    if (pullDistance >= THRESHOLD && !loading) {
      onRefresh()
    }
    setPullDistance(0)
  }

  const progress = Math.min(pullDistance / THRESHOLD, 1)

  return (
    <div
      data-slot="pull-to-refresh"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      <div
        className="pointer-events-none flex items-center justify-center overflow-hidden transition-all"
        style={{ height: loading ? `${THRESHOLD * 0.6}px` : `${pullDistance}px` }}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin text-[var(--color-cobalt)]" />
        ) : (
          <div
            className="flex flex-col items-center gap-1 transition-opacity"
            style={{ opacity: progress }}
          >
            <Loader2
              className="size-5 text-[var(--color-cobalt)] transition-transform"
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
            {progress >= 1 && (
              <span className="text-xs text-muted-foreground">Release to refresh</span>
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

export { PullToRefresh }
