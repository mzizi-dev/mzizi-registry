"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface InfraService {
  name: string
  status: "operational" | "degraded" | "outage" | "maintenance"
  uptime?: string
  latency?: number
}
interface InfrastructurePageProps {
  services?: InfraService[]
  deployments?: React.ReactNode
  resources?: React.ReactNode
  incidents?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function InfrastructurePage({
  services,
  deployments,
  resources,
  incidents,
  children,
  loading = false,
  className,
}: InfrastructurePageProps) {
  const { motion } = useNyuchiHarness("infrastructure-page")
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
        data-slot="infrastructure-page"
        data-portal="https://mzizi.dev/components/infrastructure-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-6"
      >
        <div className="h-8 w-1/3 rounded bg-muted" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
      </main>
    )
  return (
    <main
      data-slot="infrastructure-page"
      role="main"
      aria-label="Infrastructure"
      style={animStyle}
      className={cn("flex flex-col gap-6 p-6", className)}
    >
      <h1 className="text-xl font-bold">Infrastructure</h1>
      {services && (
        <section aria-label="Service health" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.name}
              className="rounded-[var(--radius-lg,14px)] border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{s.name}</span>
                <div
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor:
                      s.status === "operational"
                        ? "var(--health-operational, var(--status-success, var(--color-malachite, #64FFDA)))"
                        : s.status === "degraded"
                          ? "var(--health-degraded, var(--status-warning, var(--color-gold, #FFD740)))"
                          : s.status === "outage"
                            ? "var(--health-outage, var(--destructive, #FF5252))"
                            : "var(--health-maintenance, var(--status-info, var(--color-cobalt, #00B0FF)))",
                  }}
                />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                {s.uptime && <span>{s.uptime}</span>}
                {s.latency != null && <span>{s.latency}ms</span>}
              </div>
            </div>
          ))}
        </section>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {resources && <section aria-label="Resources">{resources}</section>}
        {deployments && <section aria-label="Deployments">{deployments}</section>}
      </div>
      {incidents && <section aria-label="Incidents">{incidents}</section>}
      {children}
    </main>
  )
}
export type { InfraService, InfrastructurePageProps }
