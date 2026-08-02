"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BatchAction {
  label: string
  onClick: () => void
  variant?: "default" | "destructive"
  icon?: React.ReactNode
}

interface BatchActionBarProps extends React.ComponentProps<"div"> {
  selectedCount: number
  totalCount?: number
  actions: BatchAction[]
  onClearSelection?: () => void
}

function BatchActionBar({
  selectedCount,
  totalCount,
  actions,
  onClearSelection,
  className,
  ...props
}: BatchActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      data-slot="batch-action-bar"
      data-portal="https://mzizi.dev/components/batch-action-bar"
      role="toolbar"
      aria-label={`${selectedCount} items selected`}
      className={cn(
        "flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-lg",
        className
      )}
      {...props}
    >
      <span className="text-sm font-medium">
        {selectedCount}
        {totalCount ? `/${totalCount}` : ""} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <div className="flex gap-1.5">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition-colors",
              action.variant === "destructive"
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            )}
          >
            {action.icon && <span className="mr-1">{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
      {onClearSelection && (
        <button
          onClick={onClearSelection}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  )
}

export { BatchActionBar }
export type { BatchActionBarProps }
