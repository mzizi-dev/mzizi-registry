import * as React from "react"

import { cn } from "@/lib/utils"

const mineralBorders: Record<string, string> = {
  cobalt: "border-t-[var(--color-primary,var(--color-cobalt,#00B0FF))]",
  tanzanite: "border-t-[var(--color-accent,var(--color-tanzanite,#B388FF))]",
  malachite: "border-t-[var(--status-success,var(--color-malachite,#64FFDA))]",
  gold: "border-t-[var(--status-warning,var(--color-gold,#FFD740))]",
  terracotta: "border-t-[var(--status-error,var(--color-terracotta,#D4A574))]",
}

function NoteCard({
  loading = false,
  title,
  content,
  timestamp,
  color,
  className,
  ...props
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  title: string
  content: string
  timestamp: string
  color?: "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta"
} & React.ComponentProps<"div">) {
  if (loading)
    return (
      <div
        data-slot="note-card"
        data-portal="https://mzizi.dev/components/note-card"
        data-loading
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    )

  return (
    <div
      data-slot="note-card"
      data-color={color}
      className={cn(
        "flex flex-col gap-2 rounded-[var(--radius-xl,17px)] bg-card p-4 ring-1 ring-foreground/10",
        color ? `border-t-4 ${mineralBorders[color]}` : "",
        className
      )}
      {...props}
    >
      <h4 className="line-clamp-1 text-sm font-medium text-foreground">{title}</h4>
      <p className="line-clamp-3 text-sm text-muted-foreground">{content}</p>
      <span className="mt-auto text-xs text-muted-foreground">{timestamp}</span>
    </div>
  )
}

export { NoteCard }
