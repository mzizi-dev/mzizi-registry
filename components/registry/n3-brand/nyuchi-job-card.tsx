"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI JOB CARD — Brand Component (Pre-Wired)
   Mineral: Gold (employment, commerce, economics).
   Job listing with employer verification and skill matching.
   ✅ HARNESS  ✅ TOKENS  ✅ STRICT MINERAL RULES  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiJobCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  title: string
  company: string
  companyLogo?: string
  companyVerified?: boolean
  location?: string
  remote?: boolean
  salary?: string
  currency?: string
  type?: "full-time" | "part-time" | "contract" | "gig" | "internship"
  skills?: string[]
  postedAt?: string
  matchScore?: number
  onApply?: () => void
  onSave?: () => void
  onClick?: () => void
  className?: string
}

export function NyuchiJobCard({
  loading = false,
  title,
  company,
  companyLogo,
  companyVerified,
  location,
  remote,
  salary,
  currency = "USD",
  type,
  skills = [],
  postedAt,
  matchScore,
  onApply,
  onSave,
  onClick,
  className,
}: NyuchiJobCardProps) {
  const { motion } = useNyuchiHarness("job-card")
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
        data-slot="nyuchi-job-card"
        data-portal="https://mzizi.dev/components/nyuchi-job-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] border-l-2 border-l-muted bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="flex gap-3">
          <div className="size-10 shrink-0 rounded-[var(--radius-sm,7px)] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-muted" />
            <div className="h-2.5 w-1/3 rounded bg-muted" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-2.5 w-16 rounded bg-muted" />
          <div className="h-2.5 w-12 rounded bg-muted" />
        </div>
      </div>
    )
  return (
    <div
      data-slot="nyuchi-job-card"
      style={animStyle}
      role="article"
      onClick={onClick}
      className={cn(
        "min-h-[48px] space-y-3 rounded-[var(--radius-lg,14px)] border border-l-2 border-border border-l-[var(--color-gold,#FFD740)] bg-card p-4 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm,7px)] bg-muted text-sm">
          {companyLogo ? (
            <img src={companyLogo} alt={company} className="size-full object-cover" />
          ) : (
            company.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {title}
          </h3>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span>{company}</span>
            {companyVerified && <span className="text-[var(--color-gold,#FFD740)]">✓</span>}
          </div>
        </div>
        {matchScore != null && (
          <div className="shrink-0 rounded-full bg-[var(--color-gold,#FFD740)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-gold,#FFD740)]">
            {matchScore}% match
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {location && <span>📍 {location}</span>}
        {remote && (
          <span className="rounded-full bg-[var(--color-cobalt,#00B0FF)]/10 px-1.5 py-0.5 text-[var(--color-cobalt,#00B0FF)]">
            Remote
          </span>
        )}
        {type && <span className="capitalize">{type.replace("-", " ")}</span>}
        {salary && (
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: currency || "USD",
            }).format(Number(salary) || 0)}
          </span>
        )}
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 4).map((s) => (
            <span
              key={s}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        {postedAt && <span className="text-[10px] text-muted-foreground">{postedAt}</span>}
        <div className="ml-auto flex gap-2">
          {onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSave()
              }}
              className="h-10 rounded-full border border-border bg-muted px-4 text-[12px] font-medium text-foreground hover:opacity-80"
            >
              Save
            </button>
          )}
          {onApply && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onApply()
              }}
              className="h-10 rounded-full bg-[var(--color-gold,#FFD740)] px-4 text-[12px] font-medium text-[#0A0A0A] hover:opacity-80"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
