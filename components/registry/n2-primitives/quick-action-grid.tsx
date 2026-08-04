"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}
interface QuickActionGridProps {
  actions: QuickAction[]
  className?: string
}

export function QuickActionGrid({ actions, className }: QuickActionGridProps) {
  return (
    <div
      data-slot="quick-action-grid"
      data-portal="https://mzizi.dev/components/quick-action-grid"
      role="group"
      aria-label="Quick actions"
      className={cn("flex gap-3 overflow-x-auto", className)}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={a.onClick}
          disabled={a.disabled}
          className={cn(
            "flex min-h-[48px] min-w-[72px] flex-1 flex-col items-center gap-1 rounded-[var(--radius-lg,14px)] border border-border bg-card p-3 text-xs font-medium transition-colors",
            a.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          )}
        >
          {a.icon}
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  )
}
export type { QuickAction, QuickActionGridProps }
