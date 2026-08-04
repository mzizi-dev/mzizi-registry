import * as React from "react"
import { cn } from "@/lib/utils"

interface NearbyItem {
  id: string
  title: string
  subtitle?: string
  distance: string
  category?: string
  rating?: number
  imageUrl?: string
  verified?: boolean
}

interface NearbyListProps extends React.ComponentProps<"div"> {
  items: NearbyItem[]
  onItemClick?: (id: string) => void
  emptyMessage?: string
}

function NearbyList({
  items,
  onItemClick,
  emptyMessage = "Nothing nearby",
  className,
  ...props
}: NearbyListProps) {
  if (items.length === 0) {
    return (
      <div
        data-slot="nearby-list"
        data-portal="https://mzizi.dev/components/nearby-list"
        className={cn("py-8 text-center text-sm text-muted-foreground", className)}
        {...props}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      data-slot="nearby-list"
      className={cn("space-y-1", className)}
      role="list"
      aria-label="Nearby results"
      {...props}
    >
      {items.map((item) => (
        <button
          key={item.id}
          role="listitem"
          onClick={() => onItemClick?.(item.id)}
          className="flex w-full items-center gap-3 rounded-[var(--radius-lg,14px)] px-3 py-3 text-left transition-colors hover:bg-muted/30"
        >
          {item.imageUrl && (
            <div className="size-12 shrink-0 overflow-hidden rounded-[var(--radius-sm,7px)] bg-muted">
              <img src={item.imageUrl} alt="" className="size-full object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-medium">{item.title}</span>
              {item.verified && (
                <span className="text-[10px] text-[var(--color-gold,#FFD740)]">✓</span>
              )}
            </div>
            {item.subtitle && (
              <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
            )}
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              {item.category && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px]">
                  {item.category}
                </span>
              )}
              {item.rating !== undefined && (
                <span className="text-[var(--color-gold,#FFD740)]">★ {item.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {item.distance}
          </span>
        </button>
      ))}
    </div>
  )
}

export { NearbyList }
export type { NearbyListProps }
