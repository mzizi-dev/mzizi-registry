"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AnalyticsDashboardCardProps extends React.ComponentProps<"div"> {
  title: string
  value: string | number
  previousValue?: number
  currentValue?: number
  changeLabel?: string
  trend?: "up" | "down" | "flat"
  sparklineData?: number[]
  icon?: React.ReactNode
}

function AnalyticsDashboardCard({
  title,
  value,
  previousValue,
  currentValue,
  changeLabel,
  trend,
  sparklineData,
  icon,
  className,
  ...props
}: AnalyticsDashboardCardProps) {
  const changePct =
    previousValue && currentValue
      ? ((currentValue - previousValue) / previousValue) * 100
      : undefined

  return (
    <div
      data-slot="analytics-dashboard-card"
      data-portal="https://mzizi.dev/components/analytics-dashboard-card"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {/* `trend` was destructured and never used, so a consumer that knows the
          direction but has no previous/current pair — a series from an API that
          reports direction directly — rendered no change indicator at all. It
          now draws the arrow, and colours the row when `changePct` is absent. */}
      {(changePct !== undefined || changeLabel || trend) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {trend && (
            <span
              aria-hidden="true"
              className={cn(
                "font-medium",
                trend === "up"
                  ? "text-[var(--color-malachite,#64FFDA)]"
                  : trend === "down"
                    ? "text-destructive"
                    : "text-muted-foreground"
              )}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </span>
          )}
          {changePct !== undefined && (
            <span
              className={cn(
                "font-medium",
                changePct > 0
                  ? "text-[var(--color-malachite,#64FFDA)]"
                  : changePct < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
              )}
            >
              {changePct > 0 ? "+" : ""}
              {changePct.toFixed(1)}%
            </span>
          )}
          {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
        </div>
      )}
      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-3 flex h-8 items-end gap-px">
          {sparklineData.map((val, i) => {
            const max = Math.max(...sparklineData)
            const height = max > 0 ? (val / max) * 100 : 0
            return (
              <div
                key={i}
                className="flex-1 rounded-t-[1px] bg-[var(--color-malachite,#64FFDA)]/30"
                style={{ height: `${Math.max(2, height)}%` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export { AnalyticsDashboardCard }
export type { AnalyticsDashboardCardProps }
