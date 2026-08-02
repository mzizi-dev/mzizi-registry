"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI APPLICATION TRACKER — Brand Component (Pre-Wired)
   Mineral: Gold (employment, economics).
   Application status timeline with stage progression.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface ApplicationStage {
  stage: "applied" | "reviewed" | "interview" | "offer" | "rejected" | "withdrawn"
  date?: string
  note?: string
  active?: boolean
}
interface NyuchiApplicationTrackerProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  jobTitle: string
  company: string
  stages: ApplicationStage[]
  onClick?: () => void
  className?: string
}

const stageIcons = {
  applied: "📤",
  reviewed: "👀",
  interview: "🎙",
  offer: "🎉",
  rejected: "✕",
  withdrawn: "↩",
} as const

export function NyuchiApplicationTracker({
  loading = false,
  jobTitle,
  company,
  stages,
  onClick,
  className,
}: NyuchiApplicationTrackerProps) {
  const { motion } = useNyuchiHarness("application-tracker")
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
        data-slot="nyuchi-application-tracker"
        data-portal="https://mzizi.dev/components/nyuchi-application-tracker"
        data-loading
        role="list"
        aria-label="Application stages"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-4 w-1/2 rounded bg-muted" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="size-6 rounded-full bg-muted" />
            <div className="h-3 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  return (
    <div
      data-slot="nyuchi-application-tracker"
      style={animStyle}
      role="list"
      tabIndex={0}
      aria-label="Application stages"
      onClick={onClick}
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        "space-y-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-4",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div>
        <h3
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {jobTitle}
        </h3>
        <p className="text-[11px] text-muted-foreground">{company}</p>
      </div>
      <div className="space-y-0">
        {stages.map((s, i) => (
          <div key={i} className="flex items-start gap-3 py-1.5">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-[11px]",
                  s.stage === "rejected" || s.stage === "withdrawn"
                    ? "bg-[var(--status-error,#FF5252)]/10 text-red-400"
                    : s.active
                      ? "bg-[var(--color-gold,#FFD740)]/20 text-[var(--color-gold,#FFD740)]"
                      : s.date
                        ? "bg-[var(--color-malachite,#64FFDA)]/20 text-[var(--color-malachite,#64FFDA)]"
                        : "bg-muted text-muted-foreground/40"
                )}
              >
                {stageIcons[s.stage]}
              </div>
              {i < stages.length - 1 && <div className="min-h-[12px] w-px flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <p
                className={cn(
                  "text-xs capitalize",
                  s.active
                    ? "font-semibold text-foreground"
                    : s.date
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {s.stage.replace("-", " ")}
              </p>
              {s.date && <p className="text-[10px] text-muted-foreground">{s.date}</p>}
              {s.note && (
                <p className="mt-0.5 text-[10px] text-muted-foreground italic">{s.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
