import * as React from "react"

import { cn } from "@/lib/utils"

interface ActivityFeedItem {
  id: string
  icon?: React.ReactNode
  actor: string
  action: string
  target?: string
  timestamp: string
}

interface ActivityFeedProps extends React.ComponentProps<"div"> {
  /** Render the skeleton instead of the content. */
  loading?: boolean
  items: ActivityFeedItem[]
}

function ActivityFeed({ loading = false, className, items, ...props }: ActivityFeedProps) {
  if (loading)
    return (
      <div data-loading className="animate-pulse space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="size-9 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-2/3 rounded bg-muted" />
              <div className="h-2.5 w-1/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )

  return (
    <div
      data-slot="activity-feed"
      data-portal="https://mzizi.dev/components/activity-feed"
      className={cn("text-sm", className)}
      {...props}
    >
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-6 last:pb-0">
          {/* Timeline line */}
          {index < items.length - 1 && (
            <div className="absolute top-8 bottom-0 left-[15px] w-px bg-border" />
          )}
          {/* Timeline dot */}
          <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {item.icon ?? <div className="size-2 rounded-full bg-muted-foreground" />}
          </div>
          {/* Content */}
          <div className="flex-1 pt-1">
            <p>
              <span className="font-medium">{item.actor}</span>
              <span className="text-muted-foreground"> {item.action} </span>
              {item.target && <span className="font-medium">{item.target}</span>}
            </p>
            <time className="mt-0.5 block text-xs text-muted-foreground">{item.timestamp}</time>
          </div>
        </div>
      ))}
    </div>
  )
}

export { ActivityFeed, type ActivityFeedItem, type ActivityFeedProps }
