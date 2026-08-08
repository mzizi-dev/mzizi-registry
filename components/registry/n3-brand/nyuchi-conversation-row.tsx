"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { cn } from "@/lib/utils"

interface NyuchiConversationRowProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  isOnline?: boolean
  onClick?: () => void
  className?: string
}

function NyuchiConversationRow({
  loading = false,
  name,
  avatar,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isOnline,
  onClick,
  className,
}: NyuchiConversationRowProps) {
  const { motion } = useNyuchiHarness("conversation-row")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )
  if (loading)
    return (
      <div
        data-slot="nyuchi-conversation-row"
        data-portal="https://mzizi.dev/components/nyuchi-conversation-row"
        data-loading
        role="listitem"
        className="flex animate-pulse items-center gap-3 px-4 py-3"
      >
        <div className="size-12 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-2/3 rounded bg-muted" />
        </div>
        <div className="h-2.5 w-8 rounded bg-muted" />
      </div>
    )

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
  const hasUnread = unreadCount > 0

  return (
    <div
      data-slot="nyuchi-conversation-row"
      style={animStyle}
      role="listitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        onClick &&
          "cursor-pointer hover:bg-foreground/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        className
      )}
    >
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-muted">
          {avatar ? (
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">{initials}</span>
          )}
        </div>
        {isOnline && (
          <div className="absolute right-0 bottom-0 size-3 rounded-full bg-[var(--status-success,#4ADE80)] ring-2 ring-card" />
        )}
      </div>
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              hasUnread ? "font-semibold text-foreground" : "font-medium text-foreground"
            )}
          >
            {name}
          </span>
          {lastMessageTime && (
            <span
              className={cn(
                "shrink-0 text-[10px]",
                hasUnread ? "font-semibold text-[var(--color-malachite)]" : "text-muted-foreground"
              )}
            >
              {lastMessageTime}
            </span>
          )}
        </div>
        {lastMessage && (
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-xs",
                hasUnread ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {lastMessage}
            </span>
            {hasUnread && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-malachite)] text-[10px] font-bold text-background">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export { NyuchiConversationRow }
export type { NyuchiConversationRowProps }
