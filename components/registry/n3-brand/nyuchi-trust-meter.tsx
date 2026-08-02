"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Shield, Activity, Heart, TrendingUp, Star } from "@/lib/icons"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO TRUST METER — Ubuntu Trust Visualization
   
   The full breakdown of the three-axis trust model:
   
   Signal 1: Verification Tier (weighted by subject type)
     → How real are you? Identity ladder 0–4
   Signal 2: Platform Status (lifecycle modifier)
     → Are you active on the platform?
   Signal 3: Ubuntu Contribution (community value)
     → Are you helpful? "I am because we are"
   
   Each signal is shown as a labeled bar with its weighted
   contribution to the composite score. The composite score
   is the main meter at the top.
   
   Used on profile detail pages, admin dashboards, and
   trust audit views. The verified badge is the compact
   representation; this is the expanded view.
   ═══════════════════════════════════════════════════════════════ */

interface TrustSignal {
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  value: number /* 0.0 – 1.0 normalized */
  color: string
  detail?: string
}

interface NyuchiTrustMeterProps {
  loading?: boolean
  /** Composite trust score (0.000 – 1.000) */
  trustScore: number
  /** Individual signal values */
  verificationScore?: number
  statusScore?: number
  ubuntuScore?: number
  /** Ubuntu points (raw count) */
  ubuntuPoints?: number
  /** Verification tier label */
  tierLabel?: string
  /** Platform status label */
  statusLabel?: string
  /** Compact mode — just the meter bar, no signal breakdown */
  compact?: boolean
  className?: string
}

function NyuchiTrustMeter({
  loading = false,
  trustScore,
  verificationScore = 0,
  statusScore = 0,
  ubuntuScore = 0,
  ubuntuPoints,
  tierLabel,
  statusLabel,
  compact = false,
  className,
}: NyuchiTrustMeterProps) {
  const { motion } = useNyuchiHarness("trust-meter")
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
        data-slot="nyuchi-trust-meter"
        data-portal="https://mzizi.dev/components/nyuchi-trust-meter"
        data-loading
        role="meter"
        aria-label="Trust score"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-2 rounded-full bg-muted" />
        <div className="flex justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2 w-8 rounded bg-muted" />
              <div className="h-1.5 w-6 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    )

  const percent = Math.round(trustScore * 100)

  /* Score color thresholds */
  const scoreColor =
    trustScore >= 0.4
      ? "#4ADE80" /* Green — strong */
      : trustScore >= 0.2
        ? "#FBBF24" /* Amber — growing */
        : trustScore >= 0.05
          ? "#FB923C" /* Orange — low */
          : "#6B6B66" /* Grey — none */

  const signals: TrustSignal[] = [
    {
      label: "Verification",
      icon: Shield,
      value: verificationScore,
      color: "var(--status-warning, #F59E0B)",
      detail: tierLabel,
    },
    {
      label: "Status",
      icon: Activity,
      value: Math.max(
        statusScore + 0.5,
        0
      ) /* Normalize: -0.05–0.0 → 0.45–0.50 range for display */,
      color: statusScore >= 0 ? "#4ADE80" : "#F87171",
      detail: statusLabel,
    },
    {
      label: "Ubuntu",
      icon: Heart,
      value: ubuntuScore,
      color: "var(--color-tanzanite,#B388FF)",
      detail: ubuntuPoints != null ? `${ubuntuPoints.toLocaleString()} points` : undefined,
    },
  ]

  return (
    <div
      data-slot="nyuchi-trust-meter"
      style={animStyle}
      role="meter"
      aria-label="Trust score"
      className={cn(
        "rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      {/* ── Composite score header ────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Trust Score</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>
            {trustScore.toFixed(3)}
          </span>
          <span className="text-xs text-muted-foreground">/ 1.000</span>
        </div>
      </div>

      {/* ── Main meter bar ────────────────────────────────── */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: scoreColor }}
        />
      </div>

      {/* ── Signal breakdown (full mode) ──────────────────── */}
      {!compact && (
        <div className="mt-4 flex flex-col gap-3">
          {signals.map((signal) => {
            const Icon = signal.icon
            const signalPercent = Math.round(Math.min(signal.value, 1) * 100)
            return (
              <div key={signal.label}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="size-3.5" style={{ color: signal.color }} />
                    <span className="text-xs font-medium text-muted-foreground">
                      {signal.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {signal.detail && (
                      <span className="text-[10px] text-muted-foreground">{signal.detail}</span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: signal.color }}>
                      {signal.value.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-foreground/[0.04]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${signalPercent}%`, backgroundColor: signal.color }}
                  />
                </div>
              </div>
            )
          })}

          {/* Ubuntu points callout */}
          {ubuntuPoints != null && (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Star
                className="size-3"
                style={{ color: "var(--color-gold, var(--status-warning, #F59E0B))" }}
              />
              <span>
                {ubuntuPoints.toLocaleString()} Ubuntu Points earned through community contribution
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export { NyuchiTrustMeter }
export type { NyuchiTrustMeterProps, TrustSignal }
