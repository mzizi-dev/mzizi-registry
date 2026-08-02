"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown"
const STATUS_COLORS: Record<ServiceStatus, string> = {
  operational: "var(--health-operational, var(--status-success, #64FFDA))",
  degraded: "var(--health-degraded, var(--status-warning, #FFD740))",
  outage: "var(--health-outage, var(--status-error, #FF5252))",
  maintenance: "var(--health-maintenance, var(--status-info, #00B0FF))",
  unknown: "var(--status-neutral, currentColor)",
}
interface ServiceHealthCardProps {
  name: string
  status: ServiceStatus
  uptime?: string
  latency?: number
  message?: string
  onClick?: () => void
  className?: string
}

export function ServiceHealthCard({
  name,
  status,
  uptime,
  latency,
  message,
  onClick,
  className,
}: ServiceHealthCardProps) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      data-slot="service-health-card"
      data-portal="https://mzizi.dev/components/service-health-card"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-lg,14px)] border border-border bg-card p-3 text-left",
        onClick && "cursor-pointer transition-colors hover:bg-muted",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: STATUS_COLORS[status] }}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        {uptime && <span>{uptime}</span>}
        {latency != null && <span className="tabular-nums">{latency}ms</span>}
      </div>
      {message && <p className="mt-1 text-xs text-muted-foreground/60">{message}</p>}
    </Comp>
  )
}
export type { ServiceStatus, ServiceHealthCardProps }
