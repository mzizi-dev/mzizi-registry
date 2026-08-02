"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface JobBoardPageProps {
  search?: React.ReactNode
  filters?: React.ReactNode
  resultCount?: number
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function JobBoardPage({
  search,
  filters,
  resultCount,
  children,
  loading = false,
  className,
}: JobBoardPageProps) {
  const { motion } = useNyuchiHarness("job-board-page")
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
        data-slot="job-board-page"
        data-portal="https://mzizi.dev/components/job-board-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-12 rounded-full bg-muted" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-muted" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-[var(--radius-lg,14px)] bg-muted" />
        ))}
      </main>
    )
  return (
    <main
      data-slot="job-board-page"
      role="main"
      aria-label="Job Board"
      style={animStyle}
      className={cn("flex flex-col gap-4 p-4", className)}
    >
      <h1 className="text-xl font-bold">Jobs</h1>
      {search && <section aria-label="Job search">{search}</section>}
      {filters && (
        <section aria-label="Filters" className="flex gap-2 overflow-x-auto">
          {filters}
        </section>
      )}
      {resultCount != null && (
        <p className="text-sm text-muted-foreground">
          {resultCount.toLocaleString()} {resultCount === 1 ? "job" : "jobs"} found
        </p>
      )}
      <section aria-label="Job listings" className="flex flex-col gap-3">
        {children}
      </section>
    </main>
  )
}
export type { JobBoardPageProps }
