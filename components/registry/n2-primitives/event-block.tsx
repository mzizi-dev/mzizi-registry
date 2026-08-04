import * as React from "react"
import { cn } from "@/lib/utils"

interface EventBlockProps extends React.ComponentProps<"div"> {
  title: string
  startTime?: string
  endTime?: string
  color?: string
  category?: string
  onClick?: () => void
  compact?: boolean
}

function EventBlock({
  title,
  startTime,
  endTime,
  color = "var(--color-malachite,#64FFDA)",
  category,
  onClick,
  compact = false,
  className,
  ...props
}: EventBlockProps) {
  return (
    <div
      data-slot="event-block"
      data-portal="https://mzizi.dev/components/event-block"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      className={cn(
        "overflow-hidden rounded-[var(--radius-sm,7px)] border-l-[3px] px-2 transition-colors",
        compact ? "py-0.5" : "py-1.5",
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      style={{ borderLeftColor: color, backgroundColor: `${color}15` }}
      {...props}
    >
      <div className={cn("truncate font-medium", compact ? "text-[10px]" : "text-xs")}>{title}</div>
      {/* `category` was destructured and never rendered, and the meta line was
          gated on `startTime` alone — so an all-day event carrying only a
          category showed nothing below the title. */}
      {!compact && (startTime || category) && (
        <div className="text-[10px] text-muted-foreground">
          {startTime ? `${startTime}${endTime ? ` – ${endTime}` : ""}` : ""}
          {startTime && category ? " · " : ""}
          {category ?? ""}
        </div>
      )}
    </div>
  )
}

export { EventBlock }
export type { EventBlockProps }
