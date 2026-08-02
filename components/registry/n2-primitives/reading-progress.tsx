"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ReadingProgressProps extends React.ComponentProps<"div"> {
  /** Current position (0-1) */
  progress: number
  /** Total chapters */
  totalChapters?: number
  /** Current chapter index (0-based) */
  currentChapter?: number
  /** Estimated minutes remaining */
  minutesRemaining?: number
  /** Compact inline variant */
  variant?: "default" | "compact"
}

function ReadingProgress({
  progress,
  totalChapters,
  currentChapter,
  minutesRemaining,
  variant = "default",
  className,
  ...props
}: ReadingProgressProps) {
  const pct = Math.min(100, Math.max(0, progress * 100))

  return (
    <div
      data-slot="reading-progress"
      data-portal="https://mzizi.dev/components/reading-progress"
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Reading progress: ${Math.round(pct)}%`}
      className={cn(variant === "compact" ? "flex items-center gap-2" : "space-y-1.5", className)}
      {...props}
    >
      {/* Progress bar */}
      <div
        className={cn(
          "overflow-hidden rounded-full bg-muted",
          variant === "compact" ? "h-1 flex-1" : "h-1.5 w-full"
        )}
      >
        <div
          className="h-full rounded-full bg-[var(--color-malachite,#64FFDA)] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Metadata */}
      {variant === "default" && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {Math.round(pct)}% complete
            {totalChapters && currentChapter !== undefined
              ? ` · Ch ${currentChapter + 1}/${totalChapters}`
              : ""}
          </span>
          {minutesRemaining !== undefined && <span>{minutesRemaining} min left</span>}
        </div>
      )}
    </div>
  )
}

export { ReadingProgress }
export type { ReadingProgressProps }
