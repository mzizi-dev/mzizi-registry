"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MapViewProps extends React.ComponentProps<"div"> {
  /** Map center coordinates */
  center?: { lat: number; lng: number }
  /** Zoom level (1-20) */
  zoom?: number
  /** Map style variant */
  variant?: "default" | "satellite" | "terrain"
  /** Show user location indicator */
  showUserLocation?: boolean
  /** Interactive or static display */
  interactive?: boolean
  /** Called when user taps/clicks the map */
  onMapClick?: (coords: { lat: number; lng: number }) => void
  /** Min height */
  minHeight?: number
}

function MapView({
  center = { lat: -17.8292, lng: 31.0522 },
  zoom = 13,
  variant = "default",
  interactive = true,
  showUserLocation = false,
  // Underscore-prefixed deliberately (the repo's eslint config reserves `_` for
  // intentionally-unused bindings). Unlike the other dropped props in this
  // sweep, this one is NOT wireable here: its signature is
  // `(coords: { lat, lng }) => void`, and this primitive is library-agnostic by
  // design — it owns the container, loading state and marker slot, while the map
  // itself (Mapbox GL, Leaflet, Google) is injected at the app level. Only that
  // layer can turn a pointer position into real coordinates. Binding it to the
  // container's DOM click would hand the consumer a MouseEvent where they
  // declared a lat/lng, which is worse than not calling it at all. It stays in
  // the public props so the injecting layer can forward it.
  onMapClick: _onMapClick,
  minHeight = 200,
  children,
  className,
  ...props
}: MapViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = React.useState(false)

  /*
   * This primitive provides the container, loading state, and child
   * slot for markers/routes/overlays. The actual map library (Mapbox GL,
   * Leaflet, Google Maps) is injected at the app level via a provider
   * pattern — the primitive stays library-agnostic.
   */
  React.useEffect(() => {
    /* Simulate map tile load */
    const timer = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      data-slot="map-view"
      data-portal="https://mzizi.dev/components/map-view"
      data-variant={variant}
      data-interactive={interactive}
      data-zoom={zoom}
      data-center-lat={center.lat}
      data-center-lng={center.lng}
      ref={containerRef}
      className={cn("relative overflow-hidden rounded-[var(--radius-lg,14px)] bg-muted", className)}
      style={{ minHeight }}
      {...props}
    >
      {/* Loading state */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <span className="text-xs text-muted-foreground">Loading map…</span>
          </div>
        </div>
      )}

      {/* Map canvas placeholder — map library attaches here */}
      {loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50">
          {/* Grid overlay to suggest a map */}
          <svg className="absolute inset-0 size-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
          </svg>
          <div className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 font-mono text-[9px] text-muted-foreground backdrop-blur-sm">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)} · z{zoom}
          </div>
        </div>
      )}

      {/* User location pulse */}
      {showUserLocation && loaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <div className="absolute size-6 animate-ping rounded-full bg-[var(--color-cobalt,#00B0FF)]/30" />
            <div className="size-3 rounded-full border-2 border-white bg-[var(--color-cobalt,#00B0FF)] shadow-md" />
          </div>
        </div>
      )}

      {/* Controls */}
      {interactive && loaded && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            className="flex size-8 items-center justify-center rounded-[var(--radius-sm,7px)] bg-background/90 text-sm font-bold shadow-sm backdrop-blur-sm hover:bg-background"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            className="flex size-8 items-center justify-center rounded-[var(--radius-sm,7px)] bg-background/90 text-sm font-bold shadow-sm backdrop-blur-sm hover:bg-background"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>
      )}

      {/* Child markers / overlays render here */}
      {loaded && children}
    </div>
  )
}

export { MapView }
export type { MapViewProps }
