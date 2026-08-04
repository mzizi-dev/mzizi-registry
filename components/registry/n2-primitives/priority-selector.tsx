"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Priority = "none" | "low" | "medium" | "high" | "urgent"

interface PrioritySelectorProps extends Omit<React.ComponentProps<"div">, "onChange"> {
  value?: Priority
  onChange?: (priority: Priority) => void
  compact?: boolean
}

const priorities: { value: Priority; label: string; color: string; dot: string }[] = [
  { value: "none", label: "None", color: "text-muted-foreground", dot: "bg-muted-foreground/30" },
  {
    value: "low",
    label: "Low",
    color: "text-[var(--color-cobalt,#00B0FF)]",
    dot: "bg-[var(--color-cobalt,#00B0FF)]",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-[var(--color-gold,#FFD740)]",
    dot: "bg-[var(--color-gold,#FFD740)]",
  },
  {
    value: "high",
    label: "High",
    color: "text-[var(--color-terracotta,#D4A574)]",
    dot: "bg-[var(--color-terracotta,#D4A574)]",
  },
  { value: "urgent", label: "Urgent", color: "text-destructive", dot: "bg-destructive" },
]

function PrioritySelector({
  value = "none",
  onChange,
  compact = false,
  className,
  ...props
}: PrioritySelectorProps) {
  return (
    <div
      data-slot="priority-selector"
      data-portal="https://mzizi.dev/components/priority-selector"
      role="radiogroup"
      aria-label="Priority"
      className={cn(
        "inline-flex gap-1 rounded-full border border-border bg-muted/30 p-0.5",
        className
      )}
      {...props}
    >
      {priorities.map((p) => (
        <button
          key={p.value}
          role="radio"
          aria-checked={value === p.value}
          aria-label={p.label}
          onClick={() => onChange?.(p.value)}
          className={cn(
            "flex items-center gap-1 rounded-full transition-colors",
            compact ? "size-7 justify-center" : "h-8 px-2.5 text-xs font-medium",
            value === p.value
              ? `bg-card shadow-sm ${p.color}`
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <div className={cn("size-2 rounded-full", p.dot)} />
          {!compact && p.label}
        </button>
      ))}
    </div>
  )
}

export { PrioritySelector }
export type { PrioritySelectorProps, Priority }
