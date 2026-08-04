"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Check, CheckCheck, Clock } from "@/lib/icons"
import { cn } from "@/lib/utils"

type DeliveryStatus = "sending" | "sent" | "delivered" | "read"
type BubbleVariant = "sent" | "received"

const deliveryIcons: Record<
  DeliveryStatus,
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }
> = {
  sending: { icon: Clock, color: "var(--status-neutral, #6B6B66)" },
  sent: { icon: Check, color: "var(--status-neutral, #6B6B66)" },
  delivered: { icon: CheckCheck, color: "var(--status-neutral, #6B6B66)" },
  read: { icon: CheckCheck, color: "var(--color-malachite,#64FFDA)" },
}

interface NyuchiMessageBubbleProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  content: string
  variant?: BubbleVariant
  timestamp?: string
  deliveryStatus?: DeliveryStatus
  senderName?: string
  senderAvatar?: string
  reactions?: { emoji: string; count: number }[]
  isFirstInGroup?: boolean
  className?: string
}

function NyuchiMessageBubble({
  loading = false,
  content,
  variant = "received",
  timestamp,
  deliveryStatus = "read",
  senderName,
  senderAvatar,
  reactions,
  isFirstInGroup = true,
  className,
}: NyuchiMessageBubbleProps) {
  const { motion } = useNyuchiHarness("message-bubble")
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
        data-slot="nyuchi-message-bubble"
        data-portal="https://mzizi.dev/components/nyuchi-message-bubble"
        data-loading
        role="article"
        className="max-w-[75%] animate-pulse space-y-1.5 rounded-2xl bg-muted p-3"
      >
        <div className="h-3 w-full rounded bg-foreground/5" />
        <div className="h-3 w-2/3 rounded bg-foreground/5" />
      </div>
    )

  const isSent = variant === "sent"
  const initials =
    senderName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) || ""
  const ds = deliveryIcons[deliveryStatus]
  const StatusIcon = ds.icon

  return (
    <div
      data-slot="nyuchi-message-bubble"
      style={animStyle}
      role="article"
      className={cn("flex gap-2", isSent ? "flex-row-reverse" : "flex-row", className)}
    >
      {/* Avatar (received only, first in group) */}
      {!isSent && isFirstInGroup && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {senderAvatar ? (
            <img src={senderAvatar} alt="" className="size-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
      )}
      {!isSent && !isFirstInGroup && <div className="size-8 shrink-0" />}

      <div className={cn("max-w-[75%]", isSent && "items-end", !isSent && "items-start")}>
        {/* Sender name */}
        {!isSent && isFirstInGroup && senderName && (
          <span className="mb-0.5 ml-1 text-[10px] font-medium text-muted-foreground">
            {senderName}
          </span>
        )}
        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isSent
              ? "rounded-br-md bg-[var(--color-malachite)] text-background"
              : "rounded-bl-md bg-card text-foreground ring-1 ring-foreground/10"
          )}
        >
          {content}
        </div>
        {/* Timestamp + delivery status */}
        <div
          className={cn(
            "mt-0.5 flex items-center gap-1 px-1",
            isSent ? "justify-end" : "justify-start"
          )}
        >
          {timestamp && <span className="text-[10px] text-muted-foreground/50">{timestamp}</span>}
          {isSent && <StatusIcon className="size-3" style={{ color: ds.color }} />}
        </div>
        {/* Reactions */}
        {reactions && reactions.length > 0 && (
          <div className={cn("mt-1 flex gap-1", isSent ? "justify-end" : "justify-start")}>
            {reactions.map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 rounded-full bg-card px-1.5 py-0.5 text-xs ring-1 ring-foreground/10"
              >
                {r.emoji}
                {r.count > 1 && (
                  <span className="text-[10px] text-muted-foreground">{r.count}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { NyuchiMessageBubble }
export type { NyuchiMessageBubbleProps, BubbleVariant, DeliveryStatus }
