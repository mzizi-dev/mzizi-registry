"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ROUTE PLANNER — Brand Component (Pre-Wired)
   Mineral: Gold (commerce, transport, movement).
   Composes route-card + stop-card + itinerary-timeline + fare-calculator.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface RouteStop {
  name: string
  time?: string
  type?: "origin" | "stop" | "transfer" | "destination"
}
interface NyuchiRoutePlannerProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  origin: string
  destination: string
  stops?: RouteStop[]
  mode?: "bus" | "kombi" | "taxi" | "walk" | "mixed"
  duration?: string
  distance?: string
  fare?: string
  currency?: string
  departureTime?: string
  arrivalTime?: string
  onBook?: () => void
  onSave?: () => void
  onClick?: () => void
  className?: string
}

const modeIcons = { bus: "🚌", kombi: "🚐", taxi: "🚕", walk: "🚶", mixed: "🔀" } as const

export function NyuchiRoutePlanner({
  loading = false,
  origin,
  destination,
  stops = [],
  mode = "bus",
  duration,
  distance,
  fare,
  currency = "ZWL",
  departureTime,
  arrivalTime,
  onBook,
  onSave,
  onClick,
  className,
}: NyuchiRoutePlannerProps) {
  const { motion } = useNyuchiHarness("route-planner")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <div
        data-slot="nyuchi-route-planner"
        data-portal="https://mzizi.dev/components/nyuchi-route-planner"
        data-loading
        role="article"
        aria-label="Route plan"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-1/2 rounded bg-muted" />
            <div className="h-2.5 w-2/3 rounded bg-muted" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="ml-5 flex items-center gap-3 border-l-2 border-muted py-2 pl-4">
            <div className="size-2 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-3 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  if (loading)
    return (
      <div
        data-slot="nyuchi-route-planner"
        data-loading
        role="article"
        aria-label="Route plan"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-muted" />
          <div className="h-3.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-6 rounded-full bg-muted" />
              <div className="h-3 flex-1 rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-muted" />
          <div className="h-3.5 w-1/3 rounded bg-muted" />
        </div>
      </div>
    )
  return (
    <div
      data-slot="nyuchi-route-planner"
      style={animStyle}
      role="article"
      aria-label="Route plan"
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-[var(--color-gold,#FFD740)]/5 px-4 py-3">
        <span className="text-lg">{modeIcons[mode]}</span>
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {origin} → {destination}
          </p>
          {(duration || distance) && (
            <p className="text-[11px] text-muted-foreground">
              {[duration, distance].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {fare && (
          <div className="text-right">
            <p className="text-sm font-bold text-[var(--color-gold,#FFD740)]">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currency || "USD",
              }).format(Number(fare) || 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">est. fare</p>
          </div>
        )}
      </div>
      {stops.length > 0 && (
        <div className="space-y-0 px-4 py-3">
          {stops.map((stop, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "mt-1 size-2.5 rounded-full",
                    stop.type === "origin" || stop.type === "destination"
                      ? "bg-[var(--color-gold,#FFD740)]"
                      : stop.type === "transfer"
                        ? "bg-[var(--color-cobalt,#00B0FF)]"
                        : "bg-muted-foreground/30"
                  )}
                />
                {i < stops.length - 1 && <div className="min-h-[16px] w-px flex-1 bg-border" />}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs",
                    stop.type === "origin" || stop.type === "destination"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {stop.name}
                </p>
                {stop.time && <p className="text-[10px] text-muted-foreground">{stop.time}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {(departureTime || arrivalTime) && (
        <div className="flex justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>Depart: {departureTime || "—"}</span>
          <span>Arrive: {arrivalTime || "—"}</span>
        </div>
      )}
      {(onBook || onSave) && (
        <div className="flex gap-2 border-t border-border p-3">
          {onBook && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBook()
              }}
              className="h-12 flex-1 rounded-full bg-[var(--color-gold,#FFD740)] text-[13px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              Book Ride
            </button>
          )}
          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSave()
              }}
              className="h-12 rounded-full border border-border bg-muted px-5 text-[13px] font-medium text-foreground transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  )
}
