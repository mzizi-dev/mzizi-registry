"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type TaskPriority = "none" | "low" | "medium" | "high" | "urgent"

interface TaskBoardProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  assignee?: { name: string; avatar?: string }
  labels?: { text: string; color?: string }[]
  subtasksDone?: number
  subtasksTotal?: number
  onDragStart?: (e: React.DragEvent) => void
  onClick?: () => void
}

const priorityDots: Record<TaskPriority, string> = {
  none: "bg-transparent",
  low: "bg-[var(--color-cobalt,#00B0FF)]",
  medium: "bg-[var(--color-gold,#FFD740)]",
  high: "bg-[var(--color-terracotta,#D4A574)]",
  urgent: "bg-destructive",
}

function TaskBoard({
  title,
  description,
  priority = "none",
  dueDate,
  assignee,
  labels,
  subtasksDone,
  subtasksTotal,
  onDragStart,
  onClick,
  className,
  ...props
}: TaskBoardProps) {
  const isOverdue = dueDate && new Date(dueDate) < new Date()

  return (
    <div
      data-slot="task-board"
      data-portal="https://mzizi.dev/components/task-board"
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "rounded-[var(--radius-lg,14px)] border border-border bg-card p-3 transition-shadow",
        onDragStart && "cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      {...props}
    >
      {labels && labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {labels.map((l, i) => (
            <span
              key={i}
              className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: `${l.color || "var(--status-success, var(--color-malachite, #64FFDA))"}20`,
                color: l.color || "var(--status-success, var(--color-malachite, #64FFDA))",
              }}
            >
              {l.text}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        {priority !== "none" && (
          <div className={cn("mt-1.5 size-2 shrink-0 rounded-full", priorityDots[priority])} />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{title}</div>
          {description && (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{description}</div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {dueDate && (
            <span className={isOverdue ? "font-medium text-destructive" : ""}>
              {new Date(dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          {subtasksTotal !== undefined && subtasksDone !== undefined && (
            <span>
              {subtasksDone}/{subtasksTotal}
            </span>
          )}
        </div>
        {assignee && (
          <div
            className="flex size-6 items-center justify-center rounded-full bg-muted text-[9px] font-medium"
            title={assignee.name}
          >
            {assignee.avatar ? (
              <img src={assignee.avatar} alt="" className="size-full rounded-full object-cover" />
            ) : (
              assignee.name.charAt(0)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { TaskBoard }
export type { TaskBoardProps }
