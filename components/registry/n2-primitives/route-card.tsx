import * as React from "react"
import { cn } from "@/lib/utils"

type TransportMode = "bus" | "kombi" | "train" | "taxi" | "walk"

interface RouteStop {
  name: string
  time?: string
}

interface RouteCardProps extends React.ComponentProps<"div"> {
  /** Route name/number */
  routeName: string
  /** Transport mode */
  mode: TransportMode
  /** Origin stop */
  from: RouteStop
  /** Destination stop */
  to: RouteStop
  /** Total duration in minutes */
  duration: number
  /** Fare amount */
  fare?: string
  /** Currency code */
  currency?: string
  /** Number of stops */
  stopCount?: number
  /** Departure frequency */
  frequency?: string
}

const modeLabels: Record<TransportMode, string> = {
  bus: "Bus",
  kombi: "Kombi",
  train: "Train",
  taxi: "Taxi",
  walk: "Walk",
}

const modeColors: Record<TransportMode, string> = {
  bus: "bg-[var(--color-cobalt,#00B0FF)]/15 text-[var(--color-cobalt,#00B0FF)]",
  kombi: "bg-[var(--color-gold,#FFD740)]/15 text-[var(--color-gold,#FFD740)]",
  train: "bg-[var(--color-malachite,#64FFDA)]/15 text-[var(--color-malachite,#64FFDA)]",
  taxi: "bg-[var(--color-terracotta,#D4A574)]/15 text-[var(--color-terracotta,#D4A574)]",
  walk: "bg-muted text-muted-foreground",
}

function RouteCard({
  routeName,
  mode,
  from,
  to,
  duration,
  fare,
  currency = "MXT",
  stopCount,
  frequency,
  className,
  ...props
}: RouteCardProps) {
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`

  return (
    <div
      data-slot="route-card"
      data-portal="https://mzizi.dev/components/route-card"
      role="article"
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-4",
        className
      )}
      {...props}
    >
      {/* Mode badge */}
      <div className="flex flex-col items-center gap-1">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", modeColors[mode])}>
          {modeLabels[mode]}
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">{routeName}</span>
      </div>

      {/* Route details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">{from.time || "Depart"}</div>
            <div className="truncate text-sm font-medium">{from.name}</div>
          </div>
          <div className="flex flex-col items-center px-2">
            <div className="text-[10px] text-muted-foreground">{durationStr}</div>
            <div className="my-0.5 h-px w-12 bg-border" />
            {stopCount && (
              <div className="text-[10px] text-muted-foreground">{stopCount} stops</div>
            )}
          </div>
          <div className="flex-1 text-right">
            <div className="text-xs text-muted-foreground">{to.time || "Arrive"}</div>
            <div className="truncate text-sm font-medium">{to.name}</div>
          </div>
        </div>
        {(fare || frequency) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {fare && (
              <span className="font-medium text-foreground">
                {fare} {currency}
              </span>
            )}
            {frequency && <span>Every {frequency}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export { RouteCard }
export type { RouteCardProps, TransportMode }
