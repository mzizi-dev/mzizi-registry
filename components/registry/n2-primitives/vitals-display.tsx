"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type VitalStatus = "normal" | "warning" | "critical"

interface Vital {
  label: string
  value: string | number
  unit: string
  status?: VitalStatus
  trend?: number[]
}

interface VitalsDisplayProps extends React.ComponentProps<"div"> {
  vitals: Vital[]
  lastUpdated?: string
}

const statusColors: Record<VitalStatus, string> = {
  normal: "text-[var(--color-malachite,#64FFDA)]",
  warning: "text-[var(--color-gold,#FFD740)]",
  critical: "text-destructive",
}
const statusBg: Record<VitalStatus, string> = {
  normal: "bg-[var(--color-malachite,#64FFDA)]/10",
  warning: "bg-[var(--color-gold,#FFD740)]/10",
  critical: "bg-destructive/10",
}

function VitalsDisplay({ vitals, lastUpdated, className, ...props }: VitalsDisplayProps) {
  return (
    <div
      data-slot="vitals-display"
      data-portal="https://mzizi.dev/components/vitals-display"
      role="article"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-5", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Health Vitals</span>
        {lastUpdated && (
          <span className="text-[10px] text-muted-foreground">Updated {lastUpdated}</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {vitals.map((vital, i) => {
          const st = vital.status || "normal"
          return (
            <div key={i} className={cn("rounded-[var(--radius-md,12px)] p-3", statusBg[st])}>
              <div className="text-[10px] font-medium text-muted-foreground">{vital.label}</div>
              <div className={cn("mt-0.5 text-lg font-bold tabular-nums", statusColors[st])}>
                {vital.value}{" "}
                <span className="text-xs font-normal text-muted-foreground">{vital.unit}</span>
              </div>
              {vital.trend && vital.trend.length > 1 && (
                <div className="mt-1.5 flex h-4 items-end gap-px">
                  {vital.trend.map((v, ti) => {
                    const max = Math.max(...vital.trend!)
                    const h = max > 0 ? (v / max) * 100 : 0
                    return (
                      <div
                        key={ti}
                        className="flex-1 rounded-t-[1px]"
                        style={{
                          height: `${Math.max(4, h)}%`,
                          backgroundColor: `${statusColors[st].replace("text-", "").replace("[", "").replace("]", "")}50`,
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { VitalsDisplay }
export type { VitalsDisplayProps }
