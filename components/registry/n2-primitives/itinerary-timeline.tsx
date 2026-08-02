import * as React from "react"
import { cn } from "@/lib/utils"

type LegMode = "bus" | "kombi" | "train" | "taxi" | "walk" | "drive" | "flight"

interface ItineraryLeg {
  from: string
  to: string
  mode: LegMode
  duration: string
  departure?: string
  arrival?: string
  routeName?: string
}

interface ItineraryTimelineProps extends React.ComponentProps<"div"> {
  legs: ItineraryLeg[]
  totalDuration?: string
}

const modeColors: Record<LegMode, string> = {
  bus: "var(--color-cobalt,#00B0FF)",
  kombi: "var(--color-gold,#FFD740)",
  train: "var(--color-malachite,#64FFDA)",
  taxi: "var(--color-terracotta,#D4A574)",
  walk: "var(--muted-foreground,#B2AFA8)",
  drive: "var(--muted-foreground,#B2AFA8)",
  flight: "var(--color-tanzanite,#B388FF)",
}

function ItineraryTimeline({ legs, totalDuration, className, ...props }: ItineraryTimelineProps) {
  return (
    <div
      data-slot="itinerary-timeline"
      data-portal="https://mzizi.dev/components/itinerary-timeline"
      className={cn("space-y-0", className)}
      role="list"
      aria-label="Journey itinerary"
      {...props}
    >
      {legs.map((leg, i) => (
        <div key={i} role="listitem" className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className="size-3 rounded-full border-2"
              style={{ borderColor: modeColors[leg.mode] }}
            />
            {i < legs.length - 1 && (
              <div className="w-0.5 flex-1" style={{ backgroundColor: modeColors[leg.mode] }} />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{leg.from}</span>
              {leg.departure && (
                <span className="text-xs text-muted-foreground">{leg.departure}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold capitalize"
                style={{
                  backgroundColor: `${modeColors[leg.mode]}20`,
                  color: modeColors[leg.mode],
                }}
              >
                {leg.mode}
              </span>
              <span>{leg.duration}</span>
              {leg.routeName && <span>· {leg.routeName}</span>}
            </div>
            {i === legs.length - 1 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-medium">{leg.to}</span>
                {leg.arrival && (
                  <span className="text-xs text-muted-foreground">{leg.arrival}</span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      {totalDuration && (
        <div className="pl-6 text-xs font-medium text-muted-foreground">Total: {totalDuration}</div>
      )}
    </div>
  )
}

export { ItineraryTimeline }
export type { ItineraryTimelineProps }
