"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown"
interface ServiceHealth {
  name: string
  status: ServiceStatus
  latencyMs?: number
  message?: string
}

const STATUS_CONFIG: Record<ServiceStatus, { color: string; label: string }> = {
  operational: { color: "var(--health-operational, #22C55E)", label: "Operational" },
  degraded: { color: "var(--health-degraded, #F59E0B)", label: "Degraded" },
  outage: { color: "var(--health-outage, #EF4444)", label: "Outage" },
  maintenance: { color: "var(--health-maintenance, #3B82F6)", label: "Maintenance" },
  unknown: { color: "var(--color-muted-foreground)", label: "Unknown" },
}

interface NyuchiPlatformHealthProps {
  services: ServiceHealth[]
  title?: string
  compact?: boolean
  loading?: boolean
  className?: string
}

export function NyuchiPlatformHealth({
  services,
  title = "Platform Status",
  compact = false,
  loading = false,
  className,
}: NyuchiPlatformHealthProps) {
  const { motion } = useNyuchiHarness("platform-health")
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
      <div
        data-slot="nyuchi-platform-health"
        data-portal="https://mzizi.dev/components/nyuchi-platform-health"
        data-loading
        role="status"
        className="h-40 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  const allOk = services.every((s) => s.status === "operational")
  const overallColor = allOk
    ? STATUS_CONFIG.operational.color
    : services.some((s) => s.status === "outage")
      ? STATUS_CONFIG.outage.color
      : STATUS_CONFIG.degraded.color

  return (
    <div
      data-slot="nyuchi-platform-health"
      role="region"
      aria-label={title}
      style={animStyle}
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg,14px)] bg-card ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: overallColor }} />
          <p
            className="text-sm font-semibold text-foreground"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {title}
          </p>
        </div>
        <p className="text-xs" style={{ color: overallColor }}>
          {allOk ? "All Systems Operational" : "Issues Detected"}
        </p>
      </div>
      <div className={compact ? "divide-y divide-border" : "space-y-1 p-3"}>
        {services.map((svc) => {
          const c = STATUS_CONFIG[svc.status]
          return (
            <div key={svc.name} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <div
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-sm text-foreground">{svc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {svc.latencyMs != null && (
                  <span className="font-mono text-xs text-muted-foreground">{svc.latencyMs}ms</span>
                )}
                <span className="text-xs font-medium" style={{ color: c.color }}>
                  {c.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
export type { ServiceStatus, ServiceHealth, NyuchiPlatformHealthProps }
