import * as React from "react"
import { cn } from "@/lib/utils"

interface ArrivingVehicle {
  routeName: string
  destination: string
  eta: string
  mode: "bus" | "kombi" | "train"
}

interface StopCardProps extends React.ComponentProps<"div"> {
  name: string
  type?: "bus_stop" | "train_station" | "kombi_rank" | "taxi_rank"
  distance?: string
  arriving?: ArrivingVehicle[]
}

const typeLabels: Record<string, string> = {
  bus_stop: "Bus Stop",
  train_station: "Station",
  kombi_rank: "Kombi Rank",
  taxi_rank: "Taxi Rank",
}

function StopCard({
  name,
  type = "bus_stop",
  distance,
  arriving = [],
  className,
  ...props
}: StopCardProps) {
  return (
    <div
      data-slot="stop-card"
      data-portal="https://mzizi.dev/components/stop-card"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{typeLabels[type]}</div>
        </div>
        {distance && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {distance}
          </span>
        )}
      </div>
      {arriving.length > 0 && (
        <div className="mt-3 space-y-2">
          {arriving.map((v, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium">{v.routeName}</span>
                <span className="text-muted-foreground">→ {v.destination}</span>
              </div>
              <span className="font-medium text-[var(--color-malachite,#64FFDA)]">{v.eta}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { StopCard }
export type { StopCardProps }
