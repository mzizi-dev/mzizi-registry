import * as React from "react"
import { cn } from "@/lib/utils"

interface HealthRecordSummaryProps extends React.ComponentProps<"div"> {
  lastVisit?: string
  activePrescriptions?: number
  allergies?: string[]
  conditions?: string[]
  podEncrypted?: boolean
}

function HealthRecordSummary({
  lastVisit,
  activePrescriptions,
  allergies,
  conditions,
  podEncrypted = true,
  className,
  ...props
}: HealthRecordSummaryProps) {
  return (
    <div
      data-slot="health-record-summary"
      data-portal="https://mzizi.dev/components/health-record-summary"
      role="article"
      className={cn("rounded-[var(--radius-lg,14px)] border border-border bg-card p-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Health Summary</span>
        {podEncrypted && (
          <span className="rounded-full bg-[var(--color-malachite,#64FFDA)]/10 px-2 py-0.5 text-[9px] font-medium text-[var(--color-malachite,#64FFDA)]">
            🔒 Pod Encrypted
          </span>
        )}
      </div>
      <div className="mt-3 space-y-2 text-xs">
        {lastVisit && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last visit</span>
            <span>{lastVisit}</span>
          </div>
        )}
        {activePrescriptions !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active prescriptions</span>
            <span>{activePrescriptions}</span>
          </div>
        )}
        {allergies && allergies.length > 0 && (
          <div>
            <span className="text-muted-foreground">Allergies: </span>
            <span className="text-destructive">{allergies.join(", ")}</span>
          </div>
        )}
        {conditions && conditions.length > 0 && (
          <div>
            <span className="text-muted-foreground">Conditions: </span>
            <span>{conditions.join(", ")}</span>
          </div>
        )}
      </div>
      <div className="mt-3 text-[9px] text-muted-foreground italic">
        Data sourced from your sovereign pod — never stored on platform servers.
      </div>
    </div>
  )
}

export { HealthRecordSummary }
export type { HealthRecordSummaryProps }
