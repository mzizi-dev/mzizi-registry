"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Award, Star, Check, ChevronRight, Target, Zap } from "@/lib/icons"
import { cn } from "@/lib/utils"

type MissionStatus = "available" | "in_progress" | "completed" | "locked"
type MissionDifficulty = "easy" | "medium" | "hard" | "legendary"

const difficultyConfig: Record<MissionDifficulty, { color: string; label: string }> = {
  easy: { color: "var(--status-success, #64FFDA)", label: "Easy" },
  medium: { color: "var(--status-warning, #FFD740)", label: "Medium" },
  hard: { color: "var(--status-error, #FF5252)", label: "Hard" },
  legendary: { color: "var(--color-tanzanite,#B388FF)", label: "Legendary" },
}

interface NyuchiMissionCardProps {
  loading?: boolean
  title: string
  description: string
  pointsReward: number
  badgeName?: string
  difficulty?: MissionDifficulty
  status?: MissionStatus
  progress?: number /* 0-100 */
  totalSteps?: number
  completedSteps?: number
  onClick?: () => void
  className?: string
}

function NyuchiMissionCard({
  loading = false,
  title,
  description,
  pointsReward,
  badgeName,
  difficulty = "easy",
  status = "available",
  progress,
  totalSteps,
  completedSteps,
  onClick,
  className,
}: NyuchiMissionCardProps) {
  const { motion } = useNyuchiHarness("mission-card")
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
        data-slot="nyuchi-mission-card"
        data-portal="https://mzizi.dev/components/nyuchi-mission-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-muted" />
          <div className="h-3.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="h-2.5 w-full rounded bg-muted" />
        <div className="h-1.5 rounded-full bg-muted" />
      </div>
    )

  const dc = difficultyConfig[difficulty]
  const isCompleted = status === "completed"
  const isLocked = status === "locked"
  const progressPercent =
    progress ?? (totalSteps && completedSteps ? Math.round((completedSteps / totalSteps) * 100) : 0)

  return (
    <div
      data-slot="nyuchi-mission-card"
      style={animStyle}
      role="article"
      tabIndex={0}
      data-status={status}
      onClick={onClick}
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        "rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10 transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
        isLocked && "opacity-40",
        isCompleted && "ring-[var(--color-malachite)]/30",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Mission icon */}
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]",
            isCompleted ? "bg-[var(--color-malachite)]/15" : "bg-foreground/[0.04]"
          )}
        >
          {isCompleted ? (
            <Check className="size-6 text-[var(--color-malachite)]" strokeWidth={2.5} />
          ) : isLocked ? (
            <Target className="size-6 text-muted-foreground" />
          ) : (
            <Zap className="size-6" style={{ color: dc.color }} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={cn(
                "text-sm font-semibold",
                isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {title}
            </h4>
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: `color-mix(in srgb, ${dc.color} 15%, transparent)`,
                color: dc.color,
              }}
            >
              {dc.label}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</p>
          {/* Rewards */}
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span
              className="flex items-center gap-1 font-medium"
              style={{ color: "var(--color-gold, var(--color-gold,#FFD740))" }}
            >
              <Star className="size-3" />
              {pointsReward} pts
            </span>
            {badgeName && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Award className="size-3 text-[var(--color-tanzanite)]" />
                {badgeName}
              </span>
            )}
          </div>
        </div>
        {onClick && !isLocked && (
          <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
        )}
      </div>
      {/* Progress bar */}
      {status === "in_progress" && progressPercent > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span>
              {completedSteps != null && totalSteps
                ? `${completedSteps}/${totalSteps}`
                : `${progressPercent}%`}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPercent}%`, backgroundColor: dc.color }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export { NyuchiMissionCard }
export type { NyuchiMissionCardProps, MissionStatus, MissionDifficulty }
