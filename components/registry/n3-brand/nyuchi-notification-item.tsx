"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Calendar,
  ShieldCheck,
  Star,
  TrendingUp,
  AlertTriangle,
  Package,
  Newspaper,
  MapPin,
} from "@/lib/icons"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   MUKOKO NOTIFICATION ITEM
   
   Maps to system.notifications in nyuchi_platform_db.
   Each notification type gets a mineral-colored icon so users
   can scan their notification feed by color.
   ═══════════════════════════════════════════════════════════════ */

type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "event"
  | "verification"
  | "trust"
  | "achievement"
  | "alert"
  | "commerce"
  | "news"
  | "place"
  | "system"

const typeConfig: Record<
  NotificationType,
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }
> = {
  like: { icon: Heart, color: "var(--status-error, #FF5252)" },
  comment: { icon: MessageCircle, color: "var(--color-cobalt,#00B0FF)" },
  follow: { icon: UserPlus, color: "var(--notification-success, #22C55E)" },
  event: { icon: Calendar, color: "var(--color-tanzanite,#B388FF)" },
  verification: { icon: ShieldCheck, color: "var(--notification-warning, #F59E0B)" },
  trust: { icon: TrendingUp, color: "var(--status-success, #64FFDA)" },
  achievement: { icon: Star, color: "var(--notification-warning, #F59E0B)" },
  alert: { icon: AlertTriangle, color: "var(--color-terracotta,#D4A574)" },
  commerce: { icon: Package, color: "var(--color-cobalt,#00B0FF)" },
  news: { icon: Newspaper, color: "var(--color-tanzanite,#B388FF)" },
  place: { icon: MapPin, color: "var(--notification-success, #22C55E)" },
  system: { icon: Bell, color: "var(--status-neutral, #6B6B66)" },
}

interface NyuchiNotificationItemProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  type: NotificationType
  title: string
  message?: string
  timestamp: string | Date
  read?: boolean
  actorName?: string
  actorAvatar?: string
  onClick?: () => void
  className?: string
}

function NyuchiNotificationItem({
  loading = false,
  type,
  title,
  message,
  timestamp,
  read = false,
  actorName,
  actorAvatar,
  onClick,
  className,
}: NyuchiNotificationItemProps) {
  const { motion } = useNyuchiHarness("notification-item")
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
        data-slot="nyuchi-notification-item"
        data-portal="https://mzizi.dev/components/nyuchi-notification-item"
        data-loading
        role="article"
        className="flex animate-pulse items-start gap-3 p-3"
      >
        <div className="size-9 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-2.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="h-2.5 w-8 shrink-0 rounded bg-muted" />
      </div>
    )
  if (loading)
    return (
      <div
        data-slot="nyuchi-notification-item"
        data-loading
        role="article"
        className="flex animate-pulse items-start gap-3 px-4 py-3"
      >
        <div className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-2.5 w-1/2 rounded bg-muted" />
        </div>
        <div className="h-2 w-10 shrink-0 rounded bg-muted" />
      </div>
    )

  const config = typeConfig[type] || typeConfig.system
  const Icon = config.icon
  const time = typeof timestamp === "string" ? timestamp : timestamp.toLocaleDateString()
  const initials =
    actorName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || ""

  return (
    <div
      data-slot="nyuchi-notification-item"
      style={animStyle}
      role="article"
      data-read={read}
      onClick={onClick}
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors",
        !read && "bg-[var(--color-malachite)]/[0.03]",
        onClick &&
          "cursor-pointer hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        className
      )}
    >
      {/* Actor avatar or type icon */}
      {actorAvatar || actorName ? (
        <div className="relative shrink-0">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted">
            {actorAvatar ? (
              <img src={actorAvatar} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-muted-foreground">{initials}</span>
            )}
          </div>
          {/* Type badge overlay */}
          <div
            className="absolute -right-0.5 -bottom-0.5 flex size-[18px] items-center justify-center rounded-full ring-2 ring-card"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="size-2.5 text-background" strokeWidth={2.5} />
          </div>
        </div>
      ) : (
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]"
          style={{ backgroundColor: `color-mix(in srgb, ${config.color} 15%, transparent)` }}
        >
          <Icon className="size-5" style={{ color: config.color }} />
        </div>
      )}
      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={cn("text-sm", read ? "text-muted-foreground" : "font-medium text-foreground")}
        >
          {title}
        </div>
        {message && (
          <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{message}</div>
        )}
        <div className="mt-1 text-[10px] text-muted-foreground/60">{time}</div>
      </div>
      {/* Unread dot */}
      {!read && <div className="mt-2 size-2 shrink-0 rounded-full bg-[var(--color-malachite)]" />}
    </div>
  )
}

export { NyuchiNotificationItem }
export type { NyuchiNotificationItemProps, NotificationType }
