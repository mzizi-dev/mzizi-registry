"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   HORIZONTAL SCROLL — Layer 2 Primitive
   Snap-scrolling horizontal container for cards.
   ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ TOUCH
   ═══════════════════════════════════════════════════════════════ */

interface HorizontalScrollProps {
  children: React.ReactNode
  /** Snap alignment per item */
  snap?: "start" | "center" | "none"
  /** Gap between items */
  gap?: "sm" | "md" | "lg"
  /** Padding at edges */
  padded?: boolean
  /** Loading state — shows shimmer placeholders */
  loading?: boolean
  /** Number of skeleton items when loading */
  skeletonCount?: number
  /** Skeleton item width class */
  skeletonWidth?: string
  /** Accessible label */
  ariaLabel?: string
  className?: string
}

const gapMap = { sm: "gap-2", md: "gap-3", lg: "gap-4" }

export function HorizontalScroll({
  children,
  snap = "start",
  gap = "md",
  padded = true,
  loading = false,
  skeletonCount = 5,
  skeletonWidth = "w-28",
  ariaLabel = "Scrollable list",
  className,
}: HorizontalScrollProps) {
  if (loading) {
    return (
      <div
        data-slot="horizontal-scroll"
        data-portal="https://mzizi.dev/components/horizontal-scroll"
        data-loading
        role="list"
        aria-label={ariaLabel}
        className={cn("flex overflow-hidden", gapMap[gap], padded && "px-4", className)}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            role="listitem"
            className={cn(
              "h-20 shrink-0 animate-pulse rounded-[var(--radius-md,12px)] bg-muted",
              skeletonWidth
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      data-slot="horizontal-scroll"
      role="list"
      aria-label={ariaLabel}
      className={cn(
        "flex scrollbar-none overflow-x-auto",
        snap !== "none" && "snap-x snap-mandatory",
        gapMap[gap],
        padded && "px-4",
        className
      )}
    >
      {React.Children.map(children, (child) => (
        <div
          role="listitem"
          className={cn(
            "shrink-0",
            snap === "start" && "snap-start",
            snap === "center" && "snap-center"
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
