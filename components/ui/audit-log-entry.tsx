import * as React from "react"

import { cn } from "@/lib/utils"

const severityStyles = {
  info: "text-[var(--color-cobalt)]",
  warning: "text-[var(--color-gold)]",
  error: "text-destructive",
  critical: "text-destructive font-semibold",
} as const

function AuditLogEntry({
  actor,
  action,
  target,
  timestamp,
  ip,
  severity = "info",
  className,
  ...props
}: {
  actor: string
  action: string
  target?: string
  timestamp: string
  ip?: string
  severity?: "info" | "warning" | "error" | "critical"
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="audit-log-entry"
      data-severity={severity}
      className={cn("flex items-center gap-3 py-2 text-sm", className)}
      {...props}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", {
          "bg-[var(--color-cobalt)]": severity === "info",
          "bg-[var(--color-gold)]": severity === "warning",
          "bg-destructive": severity === "error" || severity === "critical",
        })}
      />
      <span className="min-w-0 flex-1">
        <span className="font-medium text-foreground">{actor}</span>
        <span className={cn("mx-1.5", severityStyles[severity])}>{action}</span>
        {target && <span className="font-medium text-foreground">{target}</span>}
      </span>
      {ip && <span className="shrink-0 font-mono text-xs text-muted-foreground">{ip}</span>}
      <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
    </div>
  )
}

export { AuditLogEntry }
