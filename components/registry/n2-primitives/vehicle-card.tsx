import * as React from "react"
import { cn } from "@/lib/utils"

interface VehicleCardProps extends React.ComponentProps<"div"> {
  name: string
  type: string
  image?: string
  seats?: number
  rating?: number
  pricePerDay?: string
  currency?: string
  available?: boolean
  driverName?: string
  verified?: boolean
  onBook?: () => void
}

function VehicleCard({
  name,
  type,
  image,
  seats,
  rating,
  pricePerDay,
  currency = "MXT",
  available = true,
  driverName,
  verified,
  onBook,
  className,
  ...props
}: VehicleCardProps) {
  return (
    <div
      data-slot="vehicle-card"
      data-portal="https://mzizi.dev/components/vehicle-card"
      role="article"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        className
      )}
      {...props}
    >
      {image && (
        <div className="aspect-video bg-muted">
          <img src={image} alt={name} className="size-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-muted-foreground">
              {type}
              {seats ? ` · ${seats} seats` : ""}
            </div>
          </div>
          {rating !== undefined && (
            <span className="text-xs font-medium text-[var(--color-gold,#FFD740)]">
              ★ {rating.toFixed(1)}
            </span>
          )}
        </div>
        {driverName && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span>{driverName}</span>
            {verified && <span className="text-[var(--color-gold,#FFD740)]">✓</span>}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          {pricePerDay && (
            <div>
              <span className="text-sm font-bold">
                {pricePerDay} {currency}
              </span>
              <span className="text-xs text-muted-foreground"> /day</span>
            </div>
          )}
          {onBook && (
            <button
              onClick={onBook}
              disabled={!available}
              className="h-10 rounded-full bg-primary px-4 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {available ? "Book" : "Unavailable"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export { VehicleCard }
export type { VehicleCardProps }
