"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Calendar } from "lucide-react"

import { cn } from "@/lib/utils"

const priorityVariants = cva(
  "inline-flex rounded-4xl px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
  {
    variants: {
      priority: {
        low: "bg-muted text-muted-foreground",
        medium: "bg-[var(--color-gold)]/15 text-[var(--color-gold)]",
        high: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { priority: "low" },
  }
)

function TodoItem({
  title,
  completed = false,
  priority = "low",
  dueDate,
  onToggle,
  className,
  ...props
}: {
  title: string
  completed?: boolean
  priority?: "low" | "medium" | "high"
  dueDate?: string
  onToggle?: () => void
} & Omit<React.ComponentProps<"div">, "title">) {
  return (
    <div
      data-slot="todo-item"
      data-completed={completed || undefined}
      className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50", className)}
      {...props}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        onClick={onToggle}
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          completed ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/30"
        )}
      >
        {completed && (
          <svg className="size-3" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
      </button>
      <span className={cn("flex-1 text-sm", completed ? "text-muted-foreground line-through" : "text-foreground")}>
        {title}
      </span>
      <span className={cn(priorityVariants({ priority }))}>{priority}</span>
      {dueDate && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          {dueDate}
        </span>
      )}
    </div>
  )
}

export { TodoItem, priorityVariants }
