"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI LESSON CARD — Brand Component (Pre-Wired)
   Mineral: Cobalt (education, language, learning).
   Language lesson display with progress and streak tracking.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiLessonCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  title: string
  language: string
  targetLanguage?: string
  progress?: number
  totalLessons?: number
  completedLessons?: number
  streak?: number
  difficulty?: "beginner" | "intermediate" | "advanced"
  estimatedMinutes?: number
  locked?: boolean
  onStart?: () => void
  onClick?: () => void
  className?: string
}

export function NyuchiLessonCard({
  loading = false,
  title,
  language,
  targetLanguage,
  progress = 0,
  totalLessons,
  completedLessons,
  streak,
  difficulty,
  estimatedMinutes,
  locked,
  onStart,
  onClick,
  className,
}: NyuchiLessonCardProps) {
  const { motion } = useNyuchiHarness("lesson-card")
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
        data-slot="nyuchi-lesson-card"
        data-portal="https://mzizi.dev/components/nyuchi-lesson-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-10 shrink-0 rounded-[var(--radius-sm,7px)] bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-2/3 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted" />
      </div>
    )
  const diffColors = {
    beginner: "var(--color-malachite,#64FFDA)",
    intermediate: "var(--color-cobalt,#00B0FF)",
    advanced: "var(--color-tanzanite,#B388FF)",
  }
  return (
    <div
      data-slot="nyuchi-lesson-card"
      style={animStyle}
      role="article"
      onClick={onClick}
      className={cn(
        "min-h-[48px] space-y-3 rounded-[var(--radius-lg,14px)] border border-border bg-card p-4 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        locked && "opacity-60",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm,7px)] bg-[var(--color-cobalt,#00B0FF)]/10 text-lg">
          {locked ? "🔒" : "🗣"}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {language}
            {targetLanguage ? ` → ${targetLanguage}` : ""}
          </p>
        </div>
        {streak != null && streak > 0 && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-gold,#FFD740)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-gold,#FFD740)]">
            🔥 {streak}
          </div>
        )}
      </div>
      {progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{completedLessons ?? Math.round(progress)}% complete</span>
            {totalLessons && (
              <span>
                {completedLessons ?? 0}/{totalLessons} lessons
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[var(--color-cobalt,#00B0FF)] transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {difficulty && (
            <span
              className="rounded-full px-1.5 py-0.5 capitalize"
              style={{
                backgroundColor: `color-mix(in srgb, ${diffColors[difficulty]} 15%, transparent)`,
                color: diffColors[difficulty],
              }}
            >
              {difficulty}
            </span>
          )}
          {estimatedMinutes && <span>~{estimatedMinutes} min</span>}
        </div>
        {onStart && !locked && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStart()
            }}
            className="h-10 rounded-full bg-[var(--color-cobalt,#00B0FF)] px-4 text-[12px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] hover:opacity-80"
          >
            {progress > 0 ? "Continue" : "Start"}
          </button>
        )}
      </div>
    </div>
  )
}
