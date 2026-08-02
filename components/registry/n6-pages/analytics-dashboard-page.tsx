"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface KPICard {
  label: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "flat"
}
interface AnalyticsDashboardPageProps {
  title?: string
  dateRange?: React.ReactNode
  kpis?: KPICard[]
  exportAction?: () => void
  filters?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function AnalyticsDashboardPage({
  title = "Analytics",
  dateRange,
  kpis,
  exportAction,
  filters,
  children,
  loading = false,
  className,
}: AnalyticsDashboardPageProps) {
  const { motion } = useNyuchiHarness("analytics-dashboard-page")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <main
        data-slot="analytics-dashboard-page"
        data-portal="https://mzizi.dev/components/analytics-dashboard-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
        <div className="h-72 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="analytics-dashboard-page"
      role="main"
      aria-label={title}
      style={animStyle}
      className={cn("flex flex-col gap-6 p-4 lg:p-6", className)}
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {dateRange}
          {exportAction && (
            <button
              onClick={exportAction}
              className="min-h-[48px] rounded-[var(--radius-lg,14px)] border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              Export
            </button>
          )}
        </div>
      </header>
      {kpis && kpis.length > 0 && (
        <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-lg,14px)] border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-2xl font-bold">
                {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
              </p>
              {kpi.change != null && (
                <p
                  className={cn(
                    "mt-0.5 text-xs font-medium",
                    kpi.change >= 0
                      ? "text-[var(--status-success,var(--color-malachite,#64FFDA))]"
                      : "text-[var(--status-error,var(--destructive,#FF5252))]"
                  )}
                >
                  {kpi.change >= 0 ? "+" : ""}
                  {kpi.change}%
                </p>
              )}
            </div>
          ))}
        </section>
      )}
      {filters && <section aria-label="Filters">{filters}</section>}
      <section aria-label="Charts and data" className="flex flex-col gap-4">
        {children}
      </section>
    </main>
  )
}
export type { KPICard, AnalyticsDashboardPageProps }
