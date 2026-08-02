import * as React from "react"
import { cn } from "@/lib/utils"

interface ApiUsageMeterProps extends React.ComponentProps<"div"> {
  label?: string
  current: number
  limit: number
  unit?: string
  period?: string
  throttled?: boolean
}

function ApiUsageMeter({
  label = "API Usage",
  current,
  limit,
  unit = "requests",
  period = "today",
  throttled = false,
  className,
  ...props
}: ApiUsageMeterProps) {
  const pct = Math.min(100, (current / limit) * 100)
  const barColor = throttled
    ? "bg-destructive"
    : pct > 90
      ? "bg-[var(--color-terracotta,#D4A574)]"
      : pct > 75
        ? "bg-[var(--color-gold,#FFD740)]"
        : "bg-[var(--color-malachite,#64FFDA)]"

  return (
    <div
      data-slot="api-usage-meter"
      data-portal="https://mzizi.dev/components/api-usage-meter"
      role="meter"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-label={`${label}: ${current} of ${limit} ${unit} ${period}`}
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {throttled && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
            Throttled
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums">{current.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">
          / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        {period} · {(100 - pct).toFixed(0)}% remaining
      </div>
    </div>
  )
}

export { ApiUsageMeter }
export type { ApiUsageMeterProps }
