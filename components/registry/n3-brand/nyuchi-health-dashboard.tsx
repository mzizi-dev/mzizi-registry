"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI HEALTH DASHBOARD — Brand Component (Pre-Wired)
   Mineral: Malachite (wellness, health, vitality).
   Sovereign health data overview — all data stays in user pod.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface Vital {
  label: string
  value: string
  unit?: string
  trend?: "up" | "down" | "stable"
}
interface Appointment {
  provider: string
  specialty: string
  date: string
  time: string
}
interface Medication {
  name: string
  dosage: string
  nextDue?: string
  taken?: boolean
}

interface NyuchiHealthDashboardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  vitals?: Vital[]
  appointments?: Appointment[]
  medications?: Medication[]
  lastSync?: string
  onViewAll?: () => void
  className?: string
}

export function NyuchiHealthDashboard({
  loading = false,
  vitals = [],
  appointments = [],
  medications = [],
  lastSync,
  onViewAll,
  className,
}: NyuchiHealthDashboardProps) {
  const { motion } = useNyuchiHarness("health-dashboard")
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
        data-slot="nyuchi-health-dashboard"
        data-portal="https://mzizi.dev/components/nyuchi-health-dashboard"
        data-loading
        role="region"
        aria-label="Health overview"
        className="animate-pulse overflow-hidden rounded-[var(--radius-lg,14px)] bg-card ring-1 ring-foreground/10"
      >
        <div className="border-b border-border px-4 py-3">
          <div className="h-4 w-1/3 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-2 gap-px bg-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5 bg-card p-3">
              <div className="h-2.5 w-1/2 rounded bg-muted" />
              <div className="h-5 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )
  const trendIcon = { up: "↑", down: "↓", stable: "→" }
  return (
    <div
      data-slot="nyuchi-health-dashboard"
      style={animStyle}
      role="region"
      aria-label="Health overview"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Health Overview
        </h3>
        {lastSync && <span className="text-[10px] text-muted-foreground">Synced {lastSync}</span>}
      </div>
      {vitals.length > 0 && (
        <div className="grid grid-cols-2 gap-px bg-border">
          {vitals.slice(0, 4).map((v, i) => (
            <div key={i} className="space-y-0.5 bg-card p-3">
              <p className="text-[10px] text-muted-foreground">{v.label}</p>
              <p className="text-lg font-bold text-foreground">
                {v.value}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{v.unit}</span>
              </p>
              {v.trend && (
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    v.trend === "up"
                      ? "text-[var(--status-success, #22C55E)]"
                      : v.trend === "down"
                        ? "text-red-400"
                        : "text-muted-foreground"
                  )}
                >
                  {trendIcon[v.trend]} {v.trend}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {appointments.length > 0 && (
        <div className="space-y-2 border-t border-border px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground">Upcoming</p>
          {appointments.slice(0, 2).map((a, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="bg-[var(--status-success, #22C55E)]/10 flex size-8 items-center justify-center rounded-full text-sm">
                🏥
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{a.provider}</p>
                <p className="text-[10px] text-muted-foreground">
                  {a.specialty} · {a.date} {a.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {medications.length > 0 && (
        <div className="space-y-2 border-t border-border px-4 py-3">
          <p className="text-[11px] font-semibold text-muted-foreground">Medications</p>
          {medications.slice(0, 3).map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2 text-[10px]",
                  m.taken
                    ? "border-[var(--status-success, #22C55E)] bg-[var(--status-success, #22C55E)]/20 text-[var(--status-success, #22C55E)]"
                    : "border-border text-transparent"
                )}
              >
                ✓
              </div>
              <div className="flex-1">
                <p className="text-xs text-foreground">
                  {m.name} · {m.dosage}
                </p>
                {m.nextDue && !m.taken && (
                  <p className="text-[10px] text-muted-foreground">Due: {m.nextDue}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {onViewAll && (
        <div className="border-t border-border p-3">
          <button
            onClick={onViewAll}
            className="bg-[var(--status-success, #22C55E)] flex h-12 w-full items-center justify-center rounded-full text-[13px] font-medium text-[#0A0A0A] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
          >
            View All Health Data
          </button>
        </div>
      )}
    </div>
  )
}
