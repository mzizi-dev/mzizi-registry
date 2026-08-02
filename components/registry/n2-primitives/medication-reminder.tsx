"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MedicationReminderProps extends React.ComponentProps<"div"> {
  name: string
  dosage: string
  scheduledTime: string
  frequency?: string
  adherenceRate?: number
  onTake?: () => void
  onSnooze?: () => void
  onSkip?: () => void
  taken?: boolean
}

function MedicationReminder({
  name,
  dosage,
  scheduledTime,
  frequency,
  adherenceRate,
  onTake,
  onSnooze,
  onSkip,
  taken = false,
  className,
  ...props
}: MedicationReminderProps) {
  return (
    <div
      data-slot="medication-reminder"
      data-portal="https://mzizi.dev/components/medication-reminder"
      role="alert"
      className={cn(
        "rounded-[var(--radius-lg,14px)] border bg-card p-4",
        taken ? "border-[var(--color-malachite,#64FFDA)]/30 opacity-60" : "border-border",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">
            {dosage} · {scheduledTime}
          </div>
          {frequency && <div className="text-[10px] text-muted-foreground">{frequency}</div>}
        </div>
        {adherenceRate !== undefined && (
          <div className="text-right">
            <div className="text-xs font-medium tabular-nums">{adherenceRate}%</div>
            <div className="text-[9px] text-muted-foreground">adherence</div>
          </div>
        )}
      </div>
      {!taken && (onTake || onSnooze || onSkip) && (
        <div className="mt-3 flex gap-2">
          {onTake && (
            <button
              onClick={onTake}
              className="h-9 flex-1 rounded-full bg-[var(--color-malachite,#64FFDA)]/15 text-xs font-medium text-[var(--color-malachite,#64FFDA)]"
            >
              Take
            </button>
          )}
          {onSnooze && (
            <button
              onClick={onSnooze}
              className="h-9 flex-1 rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              Snooze
            </button>
          )}
          {onSkip && (
            <button
              onClick={onSkip}
              className="h-9 rounded-full px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
          )}
        </div>
      )}
      {taken && <div className="mt-2 text-xs text-[var(--color-malachite,#64FFDA)]">✓ Taken</div>}
    </div>
  )
}

export { MedicationReminder }
export type { MedicationReminderProps }
