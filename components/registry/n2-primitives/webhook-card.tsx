import * as React from "react"
import { Globe, Clock } from "@/lib/icons"

import { cn } from "@/lib/utils"

function WebhookCard({
  loading = false,
  url,
  events,
  status,
  lastTriggered,
  className,
  ...props
}: {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  url: string
  events: string[]
  status: "active" | "inactive"
  lastTriggered?: string
} & React.ComponentProps<"div">) {
  if (loading)
    return (
      <div
        data-slot="webhook-card"
        data-portal="https://mzizi.dev/components/webhook-card"
        data-loading
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
      </div>
    )

  return (
    <div
      data-slot="webhook-card"
      data-status={status}
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 text-card-foreground ring-1 ring-foreground/10",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <Globe className="size-4 shrink-0 text-muted-foreground" />
          <code className="truncate font-mono text-sm">{url}</code>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            status === "active"
              ? "bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15 text-[var(--status-success,var(--color-malachite,#64FFDA))]"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              status === "active"
                ? "bg-[var(--status-success,var(--color-malachite,#64FFDA))]"
                : "bg-muted-foreground"
            )}
          />
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {events.map((event) => (
          <span
            key={event}
            className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {event}
          </span>
        ))}
      </div>
      {lastTriggered && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>Last triggered {lastTriggered}</span>
        </div>
      )}
    </div>
  )
}

export { WebhookCard }
