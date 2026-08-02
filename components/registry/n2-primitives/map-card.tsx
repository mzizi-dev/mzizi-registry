import * as React from "react"
import { cn } from "@/lib/utils"

interface MapCardProps extends React.ComponentProps<"div"> {
  title: string
  subtitle?: string
  imageUrl?: string
  category?: string
  distance?: string
  rating?: number
  verified?: boolean
  onTap?: () => void
}

function MapCard({
  title,
  subtitle,
  imageUrl,
  category,
  distance,
  rating,
  verified,
  onTap,
  className,
  ...props
}: MapCardProps) {
  return (
    <div
      data-slot="map-card"
      data-portal="https://mzizi.dev/components/map-card"
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-3 shadow-md",
        onTap && "cursor-pointer transition-colors hover:bg-muted/30",
        className
      )}
      onClick={onTap}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      {...props}
    >
      {imageUrl && (
        <div className="size-14 shrink-0 overflow-hidden rounded-[var(--radius-sm,7px)] bg-muted">
          <img src={imageUrl} alt={title} className="size-full object-cover" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-sm font-medium">{title}</span>
          {verified && <span className="text-xs text-[var(--color-gold,#FFD740)]">✓</span>}
        </div>
        {subtitle && <div className="truncate text-xs text-muted-foreground">{subtitle}</div>}
        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          {category && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px]">{category}</span>
          )}
          {distance && <span>{distance}</span>}
          {rating !== undefined && (
            <span className="text-[var(--color-gold,#FFD740)]">★ {rating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export { MapCard }
export type { MapCardProps }
