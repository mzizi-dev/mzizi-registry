"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "flat"
  prefix?: string
  suffix?: string
  loading?: boolean
}

export function KPICard({
  label,
  value,
  change,
  trend,
  prefix,
  suffix,
  loading = false,
  className,
  ...props
}: KPICardProps) {
  if (loading)
    return (
      <div
        data-slot="kpi-card"
        data-portal="https://mzizi.dev/components/kpi-card"
        data-loading
        className={cn("h-24 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted", className)}
      />
    )
  const derivedTrend =
    trend || (change != null ? (change > 0 ? "up" : change < 0 ? "down" : "flat") : undefined)
  return (
    <div
      data-slot="kpi-card"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </p>
      {change != null && (
        <p
          className={cn(
            "mt-0.5 text-xs font-medium",
            derivedTrend === "up"
              ? "text-[var(--status-success,#64FFDA)]"
              : derivedTrend === "down"
                ? "text-[var(--status-error,#FF5252)]"
                : "text-muted-foreground"
          )}
        >
          {change >= 0 ? "+" : ""}
          {change}%
        </p>
      )}
    </div>
  )
}
export type { KPICardProps }
