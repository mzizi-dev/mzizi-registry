"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface NotificationItem {
  id: string
  title: string
  description?: string
  timestamp: string
  read: boolean
  icon?: React.ReactNode
}

interface NotificationListProps extends React.ComponentProps<"div"> {
  notifications: NotificationItem[]
  onRead?: (id: string) => void
}

function NotificationList({ className, notifications, onRead, ...props }: NotificationListProps) {
  const grouped = React.useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {}
    for (const n of notifications) {
      const date = n.timestamp.split("T")[0] ?? n.timestamp
      if (!groups[date]) groups[date] = []
      groups[date].push(n)
    }
    return groups
  }, [notifications])

  return (
    <div data-slot="notification-list" className={cn("text-sm", className)} {...props}>
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-4 last:mb-0">
          <h3 className="mb-2 px-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {date}
          </h3>
          <div className="flex flex-col gap-1">
            {items.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onRead={onRead} />
            ))}
          </div>
        </div>
      ))}
      {notifications.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No notifications</p>
      )}
    </div>
  )
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationItem
  onRead?: (id: string) => void
}) {
  return (
    <div
      data-slot="notification-item"
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50",
        !notification.read && "bg-muted/30"
      )}
      onMouseEnter={() => {
        if (!notification.read) onRead?.(notification.id)
      }}
      role="article"
      aria-label={notification.title}
    >
      {/* Unread indicator */}
      <div className="mt-1.5 flex shrink-0 items-center">
        {!notification.read ? (
          <span className="size-2 rounded-full bg-primary" />
        ) : (
          <span className="size-2" />
        )}
      </div>
      {notification.icon && (
        <div className="mt-0.5 shrink-0 text-muted-foreground">{notification.icon}</div>
      )}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", !notification.read && "font-medium")}>{notification.title}</p>
        {notification.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.description}
          </p>
        )}
        <time className="mt-1 block text-xs text-muted-foreground">{notification.timestamp}</time>
      </div>
    </div>
  )
}

export { NotificationList, type NotificationItem, type NotificationListProps }
