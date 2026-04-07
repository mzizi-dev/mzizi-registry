import * as React from "react"
import { Globe, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

function WebhookCard({
  url,
  events,
  status,
  lastTriggered,
  className,
  ...props
}: {
  url: string
  events: string[]
  status: "active" | "inactive"
  lastTriggered?: string
} & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="webhook-card"
      data-status={status}
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10",
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
            "inline-flex items-center gap-1.5 rounded-4xl px-2 py-0.5 text-xs font-medium",
            status === "active"
              ? "bg-[var(--color-malachite)]/15 text-[var(--color-malachite)]"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              status === "active" ? "bg-[var(--color-malachite)]" : "bg-muted-foreground"
            )}
          />
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {events.map((event) => (
          <span
            key={event}
            className="rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
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
