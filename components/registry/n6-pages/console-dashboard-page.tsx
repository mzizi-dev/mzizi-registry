"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface ConsoleProject {
  name: string
  status: "active" | "deploying" | "error" | "paused"
  lastDeploy?: string
  region?: string
}
interface ConsoleDashboardPageProps {
  projects?: ConsoleProject[]
  usage?: React.ReactNode
  traffic?: React.ReactNode
  quickActions?: { label: string; onClick: () => void }[]
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function ConsoleDashboardPage({
  projects,
  usage,
  traffic,
  quickActions,
  children,
  loading = false,
  className,
}: ConsoleDashboardPageProps) {
  const { motion } = useNyuchiHarness("console-dashboard-page")
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
        data-slot="console-dashboard-page"
        data-portal="https://mzizi.dev/components/console-dashboard-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-6"
      >
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
      </main>
    )
  return (
    <main
      data-slot="console-dashboard-page"
      role="main"
      aria-label="Console Dashboard"
      style={animStyle}
      className={cn("flex flex-col gap-6 p-6", className)}
    >
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        {quickActions && (
          <div className="flex gap-2">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                className="min-h-[48px] rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </header>
      {projects && (
        <section
          aria-label="Projects"
          className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((p) => (
            <div
              key={p.name}
              className="rounded-[var(--radius-lg,14px)] border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.name}</span>
                <div
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor:
                      p.status === "active"
                        ? "var(--health-operational, var(--status-success, var(--color-malachite, #64FFDA)))"
                        : p.status === "error"
                          ? "var(--health-outage, var(--destructive, #FF5252))"
                          : p.status === "deploying"
                            ? "var(--health-maintenance, var(--status-info, var(--color-cobalt, #00B0FF)))"
                            : "var(--color-muted-foreground)",
                  }}
                />
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {p.region && <span>{p.region}</span>}
                {p.lastDeploy && <span>{p.lastDeploy}</span>}
              </div>
            </div>
          ))}
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {usage && <section aria-label="Usage">{usage}</section>}
        {traffic && <section aria-label="Traffic">{traffic}</section>}
      </div>
      {children}
    </main>
  )
}
export type { ConsoleProject, ConsoleDashboardPageProps }
