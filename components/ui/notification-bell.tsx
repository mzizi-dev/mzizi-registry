"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  title: string
  description?: string
  timestamp: string
  read?: boolean
  icon?: React.ReactNode
  href?: string
}

interface NotificationBellProps {
  /** List of notifications */
  notifications: Notification[]
  /** Called when a notification is clicked */
  onNotificationClick?: (notification: Notification) => void
  /** Called when "Mark all as read" is clicked */
  onMarkAllRead?: () => void
  /** Called when "View all" is clicked */
  onViewAll?: () => void
  className?: string
}

function NotificationBell({
  notifications,
  onNotificationClick,
  onMarkAllRead,
  onViewAll,
  className,
}: NotificationBellProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          data-slot="notification-bell"
          variant="ghost"
          size="sm"
          className={cn("relative size-9 p-0", className)}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && onMarkAllRead && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-muted-foreground"
              onClick={onMarkAllRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onNotificationClick?.(notification)}
                  className={cn(
                    "flex gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  {notification.icon && (
                    <div className="mt-0.5 shrink-0">{notification.icon}</div>
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          !notification.read && "font-medium"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--color-cobalt)]" />
                      )}
                    </div>
                    {notification.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {notification.timestamp}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {onViewAll && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={onViewAll}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export { NotificationBell }
export type { NotificationBellProps, Notification }
