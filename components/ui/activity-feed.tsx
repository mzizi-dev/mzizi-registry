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
  items: ActivityFeedItem[]
}

function ActivityFeed({ className, items, ...props }: ActivityFeedProps) {
  return (
    <div data-slot="activity-feed" className={cn("text-sm", className)} {...props}>
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
