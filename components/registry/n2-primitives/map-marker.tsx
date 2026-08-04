"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type MineralColor = "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"

interface MapMarkerProps extends React.ComponentProps<"div"> {
  /** Mineral color variant */
  color?: MineralColor
  /** Verification tier (0-4) — shows check for verified */
  tier?: 0 | 1 | 2 | 3 | 4
  /** Display as cluster with count */
  cluster?: number
  /** Active/selected state */
  active?: boolean
  /** Label text below pin */
  label?: string
  /** Click handler */
  onClick?: () => void
  /** Pin size */
  size?: "sm" | "md" | "lg"
}

const mineralValues: Record<MineralColor, string> = {
  cobalt: "var(--color-cobalt, #00B0FF)",
  tanzanite: "var(--color-tanzanite, #B388FF)",
  malachite: "var(--color-malachite, #64FFDA)",
  gold: "var(--color-gold, #FFD740)",
  terracotta: "var(--color-terracotta, #D4A574)",
}

const sizes = { sm: "size-6 text-[9px]", md: "size-8 text-xs", lg: "size-10 text-sm" }

function MapMarker({
  color = "malachite",
  tier,
  cluster,
  active = false,
  label,
  onClick,
  size = "md",
  className,
  ...props
}: MapMarkerProps) {
  const bg = mineralValues[color]

  return (
    <div
      data-slot="map-marker"
      data-portal="https://mzizi.dev/components/map-marker"
      onClick={onClick}
      role={onClick ? "button" : "img"}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label || (cluster ? `Cluster of ${cluster}` : "Map marker")}
      className={cn(
        "relative flex flex-col items-center",
        active && "z-10 scale-125",
        onClick && "cursor-pointer",
        "transition-transform",
        className
      )}
      {...props}
    >
      {/* Pin body */}
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold shadow-md",
          sizes[size]
        )}
        style={{ backgroundColor: bg, color: "var(--foreground, #0A0A0A)" }}
      >
        {cluster ? (cluster > 99 ? "99+" : cluster) : tier !== undefined && tier > 0 ? "✓" : ""}
      </div>

      {/* Pin tail */}
      <div
        className="size-0 border-x-4 border-t-4 border-x-transparent"
        style={{ borderTopColor: bg }}
      />

      {/* Label */}
      {label && (
        <span className="mt-0.5 max-w-[80px] truncate text-center text-[9px] font-medium whitespace-nowrap text-foreground drop-shadow-sm">
          {label}
        </span>
      )}
    </div>
  )
}

export { MapMarker }
export type { MapMarkerProps, MineralColor }
