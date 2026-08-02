"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface ReportPageProps {
  title?: string
  subtitle?: string
  date?: string
  author?: string
  status?: "draft" | "published" | "archived"
  onPrint?: () => void
  onExport?: () => void
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function ReportPage({
  title,
  subtitle,
  date,
  author,
  status,
  onPrint,
  onExport,
  children,
  loading = false,
  className,
}: ReportPageProps) {
  const { motion } = useNyuchiHarness("report-page")
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
        data-slot="report-page"
        data-portal="https://mzizi.dev/components/report-page"
        data-loading
        role="main"
        className="mx-auto max-w-4xl animate-pulse space-y-4 p-6"
      >
        <div className="h-10 w-2/3 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-96 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="report-page"
      data-status={status}
      role="main"
      aria-label={title || "Report"}
      style={animStyle}
      className={cn("mx-auto max-w-4xl p-6 print:p-0", className)}
    >
      <header className="mb-8 border-b border-border pb-6 print:border-0">
        <div className="flex items-start justify-between">
          <div>
            {title && <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              {date && <time>{date}</time>}
              {author && <span>by {author}</span>}
              {status && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 font-medium",
                    status === "published"
                      ? "bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15 text-[var(--status-success,var(--color-malachite,#64FFDA))]"
                      : status === "draft"
                        ? "bg-[var(--status-warning,var(--color-gold,#FFD740))]/15 text-[var(--status-warning,var(--color-gold,#FFD740))]"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {status}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            {onPrint && (
              <button
                onClick={onPrint}
                className="min-h-[48px] rounded-[var(--radius-lg,14px)] border border-border px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
              >
                Print
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="min-h-[48px] rounded-[var(--radius-lg,14px)] border border-border px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
              >
                Export
              </button>
            )}
          </div>
        </div>
      </header>
      <article className="prose prose-sm max-w-none text-foreground">{children}</article>
    </main>
  )
}
export type { ReportPageProps }
