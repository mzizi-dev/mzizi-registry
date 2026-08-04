import * as React from "react"
import { cn } from "@/lib/utils"

type RouteMode = "driving" | "walking" | "transit" | "cycling"

interface MapRouteProps extends React.ComponentProps<"div"> {
  /** Route polyline coordinates (for display info only — rendering handled by map lib) */
  distance?: string
  duration?: string
  mode?: RouteMode
  waypoints?: { name: string; lat: number; lng: number }[]
  active?: boolean
}

function MapRoute({
  distance,
  duration,
  mode = "driving",
  waypoints,
  active = true,
  className,
  ...props
}: MapRouteProps) {
  return (
    <div
      data-slot="map-route"
      data-portal="https://mzizi.dev/components/map-route"
      aria-label={`Route: ${distance || "Unknown distance"}, ${duration || "Unknown duration"} by ${mode}`}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-md,12px)] px-3 py-2 text-xs",
        active
          ? "bg-[var(--color-malachite,#64FFDA)]/10 text-foreground"
          : "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="font-medium capitalize">{mode}</span>
      {distance && <span>{distance}</span>}
      {duration && <span className="font-medium">{duration}</span>}
      {waypoints && waypoints.length > 0 && (
        <span className="text-muted-foreground">· {waypoints.length} stops</span>
      )}
    </div>
  )
}

export { MapRoute }
export type { MapRouteProps }
