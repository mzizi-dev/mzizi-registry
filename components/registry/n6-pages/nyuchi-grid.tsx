"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI GRID — Layer 6 Page Composition
   Responsive grid with Mukoko breakpoints.
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Columns at each breakpoint. Defaults: mobile=1, tablet=2, desktop=3, wide=4 */
  cols?: { mobile?: number; tablet?: number; desktop?: number; wide?: number }
  /** Gap between items. Uses spacing tokens. Default: 16px */
  gap?: "sm" | "md" | "lg" | "xl"
  /** Max content width. Default: none (full width) */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full"
  children: React.ReactNode
}

const GAP_MAP = { sm: "gap-2", md: "gap-4", lg: "gap-6", xl: "gap-8" }
const MAX_MAP = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-7xl",
  full: "max-w-full",
}

export function NyuchiGrid({
  cols = {},
  gap = "md",
  maxWidth = "full",
  children,
  className,
  ...props
}: NyuchiGridProps) {
  const { mobile = 1, tablet = 2, desktop = 3, wide = 4 } = cols

  return (
    <div
      data-slot="nyuchi-grid"
      data-portal="https://mzizi.dev/components/nyuchi-grid"
      role="region"
      className={cn(
        "mx-auto grid w-full",
        `grid-cols-${mobile}`,
        `sm:grid-cols-${Math.min(tablet, 2)}`,
        `md:grid-cols-${tablet}`,
        `lg:grid-cols-${desktop}`,
        `xl:grid-cols-${wide}`,
        GAP_MAP[gap],
        MAX_MAP[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type { NyuchiGridProps }
