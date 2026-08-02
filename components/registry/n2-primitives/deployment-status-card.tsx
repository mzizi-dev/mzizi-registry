import * as React from "react"
import { cn } from "@/lib/utils"

type HealthStatus = "healthy" | "degraded" | "down" | "unknown"

interface DeploymentStatusCardProps extends React.ComponentProps<"div"> {
  serviceName: string
  status: HealthStatus
  uptimePct?: number
  errorRate?: number
  p50ms?: number
  p95ms?: number
  p99ms?: number
  lastDeploy?: string
  version?: string
}

const statusConfig: Record<HealthStatus, { color: string; label: string }> = {
  healthy: { color: "var(--color-malachite,#64FFDA)", label: "Healthy" },
  degraded: { color: "var(--color-gold,#FFD740)", label: "Degraded" },
  down: { color: "var(--status-error, #FF5252)", label: "Down" },
  unknown: { color: "var(--muted-foreground,#B2AFA8)", label: "Unknown" },
}

function DeploymentStatusCard({
  serviceName,
  status,
  uptimePct,
  errorRate,
  p50ms,
  p95ms,
  p99ms,
  lastDeploy,
  version,
  className,
  ...props
}: DeploymentStatusCardProps) {
  const cfg = statusConfig[status]

  return (
    <div
      data-slot="deployment-status-card"
      data-portal="https://mzizi.dev/components/deployment-status-card"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full" style={{ backgroundColor: cfg.color }} />
          <span className="text-sm font-medium">{serviceName}</span>
        </div>
        <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        {uptimePct !== undefined && (
          <div>
            <div className="text-xs font-bold tabular-nums">{uptimePct.toFixed(2)}%</div>
            <div className="text-[9px] text-muted-foreground">Uptime</div>
          </div>
        )}
        {errorRate !== undefined && (
          <div>
            <div className="text-xs font-bold tabular-nums">{errorRate.toFixed(2)}%</div>
            <div className="text-[9px] text-muted-foreground">Error Rate</div>
          </div>
        )}
        {p50ms !== undefined && (
          <div>
            <div className="text-xs font-bold tabular-nums">{p50ms}ms</div>
            <div className="text-[9px] text-muted-foreground">p50</div>
          </div>
        )}
        {/* `p95ms` and `p99ms` were destructured and never rendered. On a
            latency card the tail percentiles are the ones that matter — p50
            alone hides exactly the degradation this card exists to surface. */}
        {p95ms !== undefined && (
          <div>
            <div className="text-xs font-bold tabular-nums">{p95ms}ms</div>
            <div className="text-[9px] text-muted-foreground">p95</div>
          </div>
        )}
        {p99ms !== undefined && (
          <div>
            <div className="text-xs font-bold tabular-nums">{p99ms}ms</div>
            <div className="text-[9px] text-muted-foreground">p99</div>
          </div>
        )}
      </div>
      {(lastDeploy || version) && (
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          {version && <span className="font-mono">v{version}</span>}
          {lastDeploy && <span>Deployed {lastDeploy}</span>}
        </div>
      )}
    </div>
  )
}

export { DeploymentStatusCard }
export type { DeploymentStatusCardProps }
