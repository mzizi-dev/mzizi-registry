"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ReminderCardProps extends React.ComponentProps<"div"> {
  title: string
  dueAt: Date | string
  description?: string
  recurring?: boolean
  recurrenceLabel?: string
  priority?: "low" | "medium" | "high"
  onDismiss?: () => void
  onSnooze?: () => void
  onComplete?: () => void
}

const priorityColors = {
  low: "border-l-[var(--color-cobalt,#00B0FF)]",
  medium: "border-l-[var(--color-gold,#FFD740)]",
  high: "border-l-[var(--color-terracotta,#D4A574)]",
}

function ReminderCard({
  title,
  dueAt,
  description,
  recurring,
  recurrenceLabel,
  priority,
  onDismiss,
  onSnooze,
  onComplete,
  className,
  ...props
}: ReminderCardProps) {
  const d = new Date(dueAt)
  const isOverdue = d.getTime() < Date.now()

  return (
    <div
      data-slot="reminder-card"
      data-portal="https://mzizi.dev/components/reminder-card"
      role="alert"
      className={cn(
        "rounded-[var(--radius-lg,14px)] border bg-card p-4",
        priority ? `border-l-[3px] ${priorityColors[priority]}` : "border-border",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div
            className={cn(
              "text-xs",
              isOverdue ? "font-medium text-destructive" : "text-muted-foreground"
            )}
          >
            {isOverdue ? "Overdue · " : ""}
            {d.toLocaleDateString()}{" "}
            {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          {description && <div className="mt-1 text-xs text-muted-foreground">{description}</div>}
          {recurring && (
            <div className="mt-1 text-[10px] text-[var(--color-cobalt,#00B0FF)]">
              🔁 {recurrenceLabel || "Recurring"}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
      {(onComplete || onSnooze) && (
        <div className="mt-3 flex gap-2">
          {onComplete && (
            <button
              onClick={onComplete}
              className="h-8 flex-1 rounded-full bg-primary/10 text-xs font-medium text-primary"
            >
              Done
            </button>
          )}
          {onSnooze && (
            <button
              onClick={onSnooze}
              className="h-8 flex-1 rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              Snooze
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export { ReminderCard }
export type { ReminderCardProps }
