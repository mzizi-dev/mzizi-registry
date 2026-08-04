"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { QrCode, Calendar, MapPin, Ticket, Check, X, ArrowRightLeft } from "@/lib/icons"
import { cn } from "@/lib/utils"

type TicketStatus = "valid" | "used" | "cancelled" | "transferred"

const statusConfig: Record<
  TicketStatus,
  { label: string; color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }
> = {
  valid: { label: "Valid", color: "var(--status-success, #64FFDA)", icon: Check },
  used: { label: "Used", color: "var(--status-neutral, #6B6B66)", icon: Check },
  cancelled: { label: "Cancelled", color: "var(--status-error, #FF5252)", icon: X },
  transferred: { label: "Transferred", color: "var(--color-cobalt,#00B0FF)", icon: ArrowRightLeft },
}

interface NyuchiTicketCardProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  eventTitle: string
  eventDate: string
  eventVenue?: string
  tierName?: string
  tierPrice?: string | number
  ticketCode?: string
  status?: TicketStatus
  qrValue?: string
  mineral?: "malachite" | "cobalt" | "gold" | "tanzanite" | "terracotta"
  onTap?: () => void
  className?: string
}

function NyuchiTicketCard({
  loading = false,
  eventTitle,
  eventDate,
  eventVenue,
  tierName = "General Admission",
  tierPrice,
  ticketCode,
  status = "valid",
  mineral = "malachite",
  onTap,
  className,
}: NyuchiTicketCardProps) {
  const { motion } = useNyuchiHarness("ticket-card")
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
        data-slot="nyuchi-ticket-card"
        data-portal="https://mzizi.dev/components/nyuchi-ticket-card"
        data-loading
        role="article"
        className="animate-pulse space-y-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-24 rounded-[var(--radius-md,12px)] bg-muted" />
        <div className="h-3.5 w-2/3 rounded bg-muted" />
        <div className="h-2.5 w-1/2 rounded bg-muted" />
      </div>
    )

  const sc = statusConfig[status]
  const StatusIcon = sc.icon
  const mineralColors: Record<string, string> = {
    malachite: "var(--color-malachite,#64FFDA)",
    cobalt: "var(--color-cobalt,#00B0FF)",
    gold: "var(--color-gold,#FFD740)",
    tanzanite: "var(--color-tanzanite,#B388FF)",
    terracotta: "var(--color-terracotta,#D4A574)",
  }
  const accent = mineralColors[mineral]

  return (
    <div
      data-slot="nyuchi-ticket-card"
      style={animStyle}
      role="article"
      data-status={status}
      onClick={onTap}
      className={cn(
        "overflow-hidden rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
        onTap &&
          "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        className
      )}
    >
      {/* Top section: event info */}
      <div className="border-b border-dashed border-border px-4 py-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-serif text-base font-bold text-foreground">{eventTitle}</h4>
            <div className="mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                {eventDate}
              </span>
              {eventVenue && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3" />
                  {eventVenue}
                </span>
              )}
            </div>
          </div>
          {/* Status badge */}
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: `color-mix(in srgb, ${sc.color} 15%, transparent)`,
              color: sc.color,
            }}
          >
            <StatusIcon className="size-3" strokeWidth={2.5} />
            {sc.label}
          </span>
        </div>
      </div>

      {/* Bottom section: tier + QR area */}
      <div className="flex items-center gap-4 px-4 py-3">
        {/* QR placeholder */}
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-[var(--radius-inner,7px)]"
          style={{ backgroundColor: `color-mix(in srgb, ${accent} 10%, transparent)` }}
        >
          <QrCode
            className="size-8"
            style={{ color: accent, opacity: status === "valid" ? 1 : 0.3 }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Ticket className="size-3.5" style={{ color: accent }} />
            <span className="text-sm font-medium text-foreground">{tierName}</span>
          </div>
          {tierPrice != null && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {typeof tierPrice === "number"
                ? tierPrice === 0
                  ? "Free"
                  : `$${tierPrice}`
                : tierPrice}
            </div>
          )}
          {ticketCode && (
            <div className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground/60">
              {ticketCode}
            </div>
          )}
        </div>
      </div>

      {/* Mineral accent strip at bottom */}
      <div
        className="h-1"
        style={{ backgroundColor: accent, opacity: status === "valid" ? 1 : 0.2 }}
      />
    </div>
  )
}

export { NyuchiTicketCard }
export type { NyuchiTicketCardProps, TicketStatus }
