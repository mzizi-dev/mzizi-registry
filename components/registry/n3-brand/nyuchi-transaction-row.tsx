"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingBag,
  Gift,
  Repeat,
  Clock,
  Check,
  X,
} from "@/lib/icons"
import { cn } from "@/lib/utils"

type TransactionType = "send" | "receive" | "purchase" | "reward" | "swap"
type TransactionStatus = "pending" | "completed" | "failed" | "cancelled"

const typeConfig: Record<
  TransactionType,
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; sign: string }
> = {
  send: { icon: ArrowUpRight, color: "var(--status-error, #FF5252)", sign: "-" },
  receive: { icon: ArrowDownLeft, color: "var(--status-success, #64FFDA)", sign: "+" },
  purchase: { icon: ShoppingBag, color: "var(--color-cobalt,#00B0FF)", sign: "-" },
  reward: { icon: Gift, color: "var(--color-gold,#FFD740)", sign: "+" },
  swap: { icon: Repeat, color: "var(--color-tanzanite,#B388FF)", sign: "" },
}

const statusConfig: Record<
  TransactionStatus,
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string }
> = {
  pending: { icon: Clock, color: "var(--status-warning, #FFD740)" },
  completed: { icon: Check, color: "var(--status-success, #64FFDA)" },
  failed: { icon: X, color: "var(--status-error, #FF5252)" },
  cancelled: { icon: X, color: "var(--status-neutral, #6B6B66)" },
}

interface NyuchiTransactionRowProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  type: TransactionType
  amount: number
  currency?: string
  counterparty?: string
  description?: string
  status?: TransactionStatus
  timestamp: string | Date
  onClick?: () => void
  className?: string
}

function NyuchiTransactionRow({
  loading = false,
  type,
  amount,
  currency = "MIT",
  counterparty,
  description,
  status = "completed",
  timestamp,
  onClick,
  className,
}: NyuchiTransactionRowProps) {
  const { motion } = useNyuchiHarness("transaction-row")
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
        data-slot="nyuchi-transaction-row"
        data-portal="https://mzizi.dev/components/nyuchi-transaction-row"
        data-loading
        role="listitem"
        className="flex animate-pulse items-center gap-3 py-3"
      >
        <div className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-1/4 rounded bg-muted" />
        </div>
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
    )
  if (loading)
    return (
      <div
        data-slot="nyuchi-transaction-row"
        data-loading
        role="listitem"
        className="flex animate-pulse items-center gap-3 px-4 py-3"
      >
        <div className="size-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-1/3 rounded bg-muted" />
          <div className="h-2.5 w-1/4 rounded bg-muted" />
        </div>
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
    )

  const tc = typeConfig[type]
  const sc = statusConfig[status]
  const Icon = tc.icon
  const time = typeof timestamp === "string" ? timestamp : timestamp.toLocaleDateString()

  return (
    <div
      data-slot="nyuchi-transaction-row"
      style={animStyle}
      role="listitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        onClick &&
          "cursor-pointer transition-colors hover:bg-foreground/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]",
        className
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${tc.color} 12%, transparent)` }}
      >
        <Icon className="size-5" style={{ color: tc.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">
          {description || counterparty || type}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{time}</span>
          {status !== "completed" && (
            <span className="flex items-center gap-0.5 capitalize" style={{ color: sc.color }}>
              <sc.icon className="size-3" />
              {status}
            </span>
          )}
        </div>
      </div>
      <span className={cn("text-sm font-semibold tabular-nums")} style={{ color: tc.color }}>
        {tc.sign}
        {amount.toLocaleString()} {currency}
      </span>
    </div>
  )
}

export { NyuchiTransactionRow }
export type { NyuchiTransactionRowProps, TransactionType, TransactionStatus }
