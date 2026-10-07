"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  healthMonitor,
  worstHealth,
  type HealthMonitor,
  type HealthReport,
  type HealthStatus,
} from "@/lib/mzizi-resilience"

/* ═══════════════════════════════════════════════════════════════
   MZIZI HEALTH PANEL — N5 Resilience (admin and debug views)

   The health of every section and dependency reporting to a
   HealthMonitor (mzizi-resilience): MziziSection, createResilience
   pipelines and resilientFetch. Codes only, never error messages.

   Moved out of mzizi-resilience, which is framework-free now
   (mzizi-registry#472). The Astro build comes in a later phase.
   ═══════════════════════════════════════════════════════════════ */

/** Subscribe to a HealthMonitor (default the shared one). */
export function useHealthMonitor(monitor: HealthMonitor = healthMonitor) {
  const reports = React.useSyncExternalStore(
    React.useCallback((onChange: () => void) => monitor.subscribe(onChange), [monitor]),
    () => monitor.snapshot(),
    () => monitor.snapshot()
  )
  const systemHealth = React.useMemo(
    () => worstHealth(Array.from(reports.values(), (r) => r.status)),
    [reports]
  )

  return {
    reports,
    systemHealth,
    getSection: (name: string): HealthReport | undefined => reports.get(name),
  }
}

// Status tokens with a hex fallback, so the panel stays independently installable: an
// app that has not defined the tokens still renders, and one that has retunes with its
// theme.
const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: "var(--success,#4ADE80)",
  degraded: "var(--warning,#FBBF24)",
  error: "var(--destructive,#F87171)",
  loading: "var(--info,#00B0FF)",
}

interface MziziHealthPanelProps {
  className?: string
  /** Default the shared `healthMonitor`. */
  monitor?: HealthMonitor
  /** The panel's heading. */
  title?: string
}

export function MziziHealthPanel({ className, monitor, title = "System health" }: MziziHealthPanelProps) {
  const { reports, systemHealth } = useHealthMonitor(monitor)
  const entries = Array.from(reports.values())

  return (
    <section
      data-slot="mzizi-health-panel"
      data-status={systemHealth}
      aria-label={title}
      className={cn("rounded-[var(--radius-card,14px)] bg-card p-4 ring-1 ring-foreground/10", className)}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <span
          data-slot="mzizi-health-status"
          className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
          style={{
            backgroundColor: `color-mix(in srgb, ${STATUS_COLOR[systemHealth]} 15%, transparent)`,
            color: STATUS_COLOR[systemHealth],
          }}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[systemHealth] }} />
          {systemHealth}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">No sections reporting</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {entries.map((report) => (
            <li
              key={report.name}
              data-slot="mzizi-health-row"
              data-status={report.status}
              className="flex items-center gap-2 rounded-[var(--radius-inner,7px)] px-3 py-2 text-xs"
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[report.status] }}
              />
              <span className="flex-1 font-medium text-foreground">{report.name}</span>
              <span className="sr-only">{report.status}</span>
              {report.source !== "primary" && report.source !== "none" && (
                <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {report.source}
                </span>
              )}
              {report.circuitState && report.circuitState !== "closed" && (
                <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  circuit {report.circuitState.replace("_", "-")}
                </span>
              )}
              {report.errorCount > 0 && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ color: STATUS_COLOR.error }}
                  title={report.lastErrorCode ?? undefined}
                >
                  {report.errorCount} {report.errorCount === 1 ? "error" : "errors"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export type { MziziHealthPanelProps }
