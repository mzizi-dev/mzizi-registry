"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI FORECAST CARD — Brand Component (Pre-Wired)
   Mineral: Cobalt (environment, information).
   Weather forecast with farming advisory for African contexts.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface DayForecast {
  day: string
  high: number
  low: number
  icon: string
  condition: string
}
interface NyuchiForecastCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  location: string
  temperature: number
  unit?: "C" | "F"
  condition: string
  icon?: string
  humidity?: number
  windSpeed?: string
  feelsLike?: number
  forecast?: DayForecast[]
  farmingAdvice?: string
  lastUpdated?: string
  onClick?: () => void
  className?: string
}

export function NyuchiForecastCard({
  loading = false,
  location,
  temperature,
  unit = "C",
  condition,
  icon,
  humidity,
  windSpeed,
  feelsLike,
  forecast = [],
  farmingAdvice,
  lastUpdated,
  onClick,
  className,
}: NyuchiForecastCardProps) {
  const { motion } = useNyuchiHarness("forecast-card")
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
        data-slot="nyuchi-forecast-card"
        data-portal="https://mzizi.dev/components/nyuchi-forecast-card"
        data-loading
        role="article"
        className="animate-pulse overflow-hidden rounded-[var(--radius-lg,14px)] bg-card ring-1 ring-foreground/10"
      >
        <div className="space-y-3 p-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-2.5 w-20 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </div>
            <div className="size-10 rounded bg-muted" />
          </div>
        </div>
        <div className="flex justify-between border-t border-border px-2 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="h-2 w-6 rounded bg-muted" />
              <div className="size-6 rounded bg-muted" />
              <div className="h-2 w-4 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  return (
    <div
      data-slot="nyuchi-forecast-card"
      style={animStyle}
      role="article"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="space-y-2 bg-gradient-to-br from-[var(--color-cobalt,#00B0FF)]/10 to-transparent p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">📍 {location}</p>
            <p className="mt-1 text-4xl font-bold text-foreground">
              {temperature}°{unit}
            </p>
            {feelsLike != null && (
              <p className="text-[11px] text-muted-foreground">
                Feels like {feelsLike}°{unit}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-3xl">{icon || "☀️"}</span>
            <p className="mt-1 text-xs text-foreground">{condition}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          {humidity != null && <span>💧 {humidity}%</span>}
          {windSpeed && <span>💨 {windSpeed}</span>}
        </div>
      </div>
      {forecast.length > 0 && (
        <div className="flex justify-between border-t border-border px-2 py-3">
          {forecast.slice(0, 5).map((d, i) => (
            <div key={i} className="flex-1 space-y-1 text-center">
              <p className="text-[10px] text-muted-foreground">{d.day}</p>
              <p className="text-sm">{d.icon}</p>
              <p className="text-[10px] font-medium text-foreground">{d.high}°</p>
              <p className="text-[10px] text-muted-foreground">{d.low}°</p>
            </div>
          ))}
        </div>
      )}
      {farmingAdvice && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold text-[var(--color-malachite,#64FFDA)]">
            🌾 Farming Advisory
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{farmingAdvice}</p>
        </div>
      )}
      {lastUpdated && (
        <div className="px-4 pb-3">
          <p className="text-[9px] text-muted-foreground/60">Updated {lastUpdated}</p>
        </div>
      )}
    </div>
  )
}
