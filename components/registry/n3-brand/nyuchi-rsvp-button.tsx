"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { Check, Clock, X, Ticket, Loader2, Users } from "@/lib/icons"
import { cn } from "@/lib/utils"

type RSVPStatus = "none" | "pending" | "confirmed" | "waitlisted" | "declined"

const statusDisplay: Record<
  RSVPStatus,
  {
    label: string
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
    bg: string
    fg: string
  }
> = {
  none: {
    label: "RSVP",
    icon: Ticket,
    bg: "var(--brand-accent, var(--color-malachite))",
    fg: "var(--brand-accent-foreground, var(--color-background, var(--muted,#050504)))",
  },
  pending: { label: "Pending", icon: Clock, bg: "rgba(251,191,36,0.15)", fg: "#FBBF24" },
  confirmed: { label: "Confirmed", icon: Check, bg: "rgba(74,222,128,0.15)", fg: "#4ADE80" },
  waitlisted: {
    label: "Waitlisted",
    icon: Users,
    bg: "rgba(179,136,255,0.15)",
    fg: "var(--color-tanzanite,#B388FF)",
  },
  declined: { label: "Declined", icon: X, bg: "rgba(248,113,113,0.15)", fg: "#F87171" },
}

interface NyuchiRSVPButtonProps {
  status?: RSVPStatus
  price?: string | number
  spotsRemaining?: number
  loading?: boolean
  disabled?: boolean
  onRSVP?: () => void
  onCancel?: () => void
  full?: boolean
  className?: string
}

function NyuchiRSVPButton({
  status = "none",
  price,
  spotsRemaining,
  loading = false,
  disabled = false,
  onRSVP,
  onCancel,
  full = true,
  className,
}: NyuchiRSVPButtonProps) {
  const { motion } = useNyuchiHarness("rsvp-button")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const config = statusDisplay[status]
  const Icon = loading ? Loader2 : config.icon
  const isActioned = status !== "none"
  const isFree = price === "Free" || price === 0

  const priceLabel =
    typeof price === "number"
      ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(price)
      : price

  const label = loading
    ? "Processing…"
    : status === "none"
      ? isFree
        ? "RSVP — Free"
        : `Get Tickets${priceLabel ? ` — ${priceLabel}` : ""}`
      : config.label

  return (
    <div
      data-slot="nyuchi-rsvp-button"
      data-portal="https://mzizi.dev/components/nyuchi-rsvp-button"
      className={cn("flex flex-col gap-1.5", full && "w-full", className)}
      style={animStyle}
    >
      <button
        type="button"
        onClick={isActioned ? onCancel : onRSVP}
        disabled={disabled || loading}
        aria-label={label}
        className={cn(
          "flex h-[52px] min-h-[48px] items-center justify-center gap-2 rounded-full text-[16px] font-semibold transition-all",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
          "disabled:opacity-50",
          full ? "w-full" : "px-6"
        )}
        style={{ backgroundColor: config.bg, color: config.fg }}
      >
        <Icon className={cn("size-5", loading && "animate-spin")} strokeWidth={2.2} />
        {label}
      </button>
      {spotsRemaining != null && status === "none" && (
        <span className="text-center text-[11px] text-muted-foreground">
          {spotsRemaining} spots remaining
        </span>
      )}
    </div>
  )
}

export { NyuchiRSVPButton }
export type { NyuchiRSVPButtonProps, RSVPStatus }
