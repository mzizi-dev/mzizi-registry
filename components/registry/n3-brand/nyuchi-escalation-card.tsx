"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ESCALATION CARD — Agentic Component (UCP ECP)

   The "requires escalation" mini-card: when a flow needs a human
   choice, the agent pauses and renders this; on choose it resumes.

   ✅ HARNESS  ✅ TOKENS  ✅ A11Y  ✅ TOUCH 48px+
   ═══════════════════════════════════════════════════════════════ */

export interface EscalationOption {
  id: string
  label: string
  description?: string
}

export interface NyuchiEscalationCardProps {
  title: string
  prompt?: string
  options: EscalationOption[]
  onChoose: (id: string) => Promise<void> | void
  className?: string
}

export function NyuchiEscalationCard({
  title,
  prompt,
  options,
  onChoose,
  className,
}: NyuchiEscalationCardProps) {
  const { log, motion } = useNyuchiHarness("escalation-card")
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  async function choose(id: string) {
    if (pendingId) return
    setPendingId(id)
    log.info("escalation_choose", { id })
    try {
      await onChoose(id)
    } finally {
      setPendingId(null)
    }
  }

  const animStyle = motion.prefersReduced
    ? undefined
    : { animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both` }

  return (
    <div
      data-slot="nyuchi-escalation-card"
      data-portal="https://mzizi.dev/components/nyuchi-escalation-card"
      role="group"
      aria-label={title}
      style={animStyle}
      className={cn(
        "w-full max-w-sm rounded-[var(--radius-xl,17px)] border border-border",
        "bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-[var(--shadow-lg)]",
        className
      )}
    >
      <header className="mb-4 space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {prompt && <p className="text-sm text-[var(--muted-foreground)]">{prompt}</p>}
      </header>
      <div className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => choose(o.id)}
            disabled={pendingId !== null}
            className={cn(
              "flex min-h-[48px] flex-col items-start justify-center rounded-[var(--radius,10px)] border border-border",
              "bg-[var(--background)] px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--muted)] disabled:opacity-60",
              "focus-visible:ring-2 focus-visible:ring-[var(--brand-accent,var(--ring))] focus-visible:outline-none"
            )}
          >
            <span className="font-medium">{pendingId === o.id ? "…" : o.label}</span>
            {o.description && (
              <span className="text-xs text-[var(--muted-foreground)]">{o.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
