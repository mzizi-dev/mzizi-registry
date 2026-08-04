"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface DataExplorerPageProps {
  datasetName?: string
  description?: string
  queryBuilder?: React.ReactNode
  columns?: React.ReactNode
  exportFormats?: ("csv" | "json" | "xlsx" | "parquet")[]
  onExport?: (format: string) => void
  totalRows?: number
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function DataExplorerPage({
  datasetName,
  description,
  queryBuilder,
  columns,
  exportFormats = ["csv", "json"],
  onExport,
  totalRows,
  children,
  loading = false,
  className,
}: DataExplorerPageProps) {
  const { motion } = useNyuchiHarness("data-explorer-page")
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
        data-slot="data-explorer-page"
        data-portal="https://mzizi.dev/components/data-explorer-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-8 w-1/2 rounded bg-muted" />
        <div className="h-12 rounded-[var(--radius-lg,14px)] bg-muted" />
        <div className="h-96 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="data-explorer-page"
      role="main"
      aria-label={datasetName || "Data Explorer"}
      style={animStyle}
      className={cn("flex flex-col gap-4 p-4 lg:p-6", className)}
    >
      <header>
        {datasetName && <h1 className="text-xl font-bold">{datasetName}</h1>}
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          {totalRows != null && <span>{totalRows.toLocaleString()} rows</span>}
          {exportFormats.length > 0 && (
            <div className="flex gap-1">
              {exportFormats.map((f) => (
                <button
                  key={f}
                  onClick={() => onExport?.(f)}
                  className="min-h-[44px] rounded bg-muted px-2 py-1 font-mono text-xs transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      {queryBuilder && <section aria-label="Query">{queryBuilder}</section>}
      {columns && <section aria-label="Columns">{columns}</section>}
      <section aria-label="Data" className="overflow-x-auto">
        {children}
      </section>
    </main>
  )
}
export type { DataExplorerPageProps }
