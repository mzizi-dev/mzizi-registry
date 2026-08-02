"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface Notification {
  id: string
  type: "social" | "fintech" | "system" | "alert"
  title: string
  message?: string
  avatar?: string
  timestamp: string
  read?: boolean
  action?: { label: string; onClick: () => void }
}

interface NyuchiNotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications?: Notification[]
  onMarkAllRead?: () => void
  onDismiss?: (id: string) => void
  emptyMessage?: string
  className?: string
}

export function NyuchiNotificationCenter({
  open,
  onOpenChange,
  notifications = [],
  onMarkAllRead,
  onDismiss,
  emptyMessage = "You are all caught up",
  className,
}: NyuchiNotificationCenterProps) {
  const { motion } = useNyuchiHarness("notification-center")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  const unreadCount = notifications.filter((n) => !n.read).length

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => onOpenChange(false)} aria-hidden="true" />
      <div
        data-slot="nyuchi-notification-center"
        data-portal="https://mzizi.dev/components/nyuchi-notification-center"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        style={animStyle}
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl sm:top-16 sm:top-auto sm:right-4 sm:h-auto sm:max-h-[80vh] sm:rounded-[var(--radius-xl,17px)] sm:border",
          className
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onMarkAllRead && unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="min-h-[44px] px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="flex size-8 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 border-b border-border px-4 py-3 transition-colors",
                  !n.read && "bg-primary/5"
                )}
              >
                {n.avatar && (
                  <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                    <img src={n.avatar} alt="" className="size-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.read && "font-medium")}>{n.title}</p>
                  {n.message && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <time className="text-[10px] text-muted-foreground/60">{n.timestamp}</time>
                    {n.action && (
                      <button
                        onClick={n.action.onClick}
                        className="text-[10px] text-primary hover:underline"
                      >
                        {n.action.label}
                      </button>
                    )}
                  </div>
                </div>
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(n.id)}
                    aria-label="Dismiss"
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center self-start text-muted-foreground/40 hover:text-muted-foreground"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

export type { Notification, NyuchiNotificationCenterProps }
