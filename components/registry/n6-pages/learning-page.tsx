"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface LearningPageProps {
  courseName?: string
  progress?: number
  lessonTitle?: string
  sidebar?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function LearningPage({
  courseName,
  progress,
  lessonTitle,
  sidebar,
  children,
  loading = false,
  className,
}: LearningPageProps) {
  const { motion } = useNyuchiHarness("learning-page")
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
        data-slot="learning-page"
        data-portal="https://mzizi.dev/components/learning-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-6 w-1/3 rounded bg-muted" />
        <div className="h-2 rounded-full bg-muted" />
        <div className="h-64 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )
  return (
    <main
      data-slot="learning-page"
      role="main"
      aria-label={courseName || "Learning"}
      style={animStyle}
      className={cn("flex flex-col lg:flex-row", className)}
    >
      {sidebar && (
        <aside className="w-full border-r border-border p-4 lg:h-screen lg:w-72 lg:overflow-y-auto">
          {sidebar}
        </aside>
      )}
      <div className="flex-1 p-4">
        {courseName && <p className="text-sm text-muted-foreground">{courseName}</p>}
        {progress != null && (
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {lessonTitle && <h1 className="mt-4 text-xl font-bold">{lessonTitle}</h1>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  )
}
export type { LearningPageProps }
