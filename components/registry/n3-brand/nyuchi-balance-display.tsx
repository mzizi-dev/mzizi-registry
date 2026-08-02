"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { ArrowUpRight, ArrowDownLeft, Repeat, Eye, EyeOff } from "@/lib/icons"
import { cn } from "@/lib/utils"

interface NyuchiBalanceDisplayProps {
  /** Renders the skeleton branch this component already implements. */
  loading?: boolean
  balance: number
  currency?: string
  fiatEquivalent?: string
  onSend?: () => void
  onReceive?: () => void
  onSwap?: () => void
  className?: string
}

function NyuchiBalanceDisplay({
  loading = false,
  balance,
  currency = "MIT",
  fiatEquivalent,
  onSend,
  onReceive,
  onSwap,
  className,
}: NyuchiBalanceDisplayProps) {
  const { motion } = useNyuchiHarness("balance-display")
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
        data-slot="nyuchi-balance-display"
        data-portal="https://mzizi.dev/components/nyuchi-balance-display"
        data-loading
        role="status"
        aria-label="Balance"
        className="animate-pulse space-y-2 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10"
      >
        <div className="h-2.5 w-16 rounded bg-muted" />
        <div className="h-7 w-1/3 rounded bg-muted" />
        <div className="h-2.5 w-24 rounded bg-muted" />
      </div>
    )
  if (loading)
    return (
      <div
        data-slot="nyuchi-balance-display"
        data-loading
        role="status"
        aria-label="Balance"
        className="animate-pulse space-y-2 p-4"
      >
        <div className="h-2.5 w-16 rounded bg-muted" />
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-2.5 w-12 rounded bg-muted" />
          <div className="h-2.5 w-8 rounded bg-muted" />
        </div>
      </div>
    )

  const [hidden, setHidden] = React.useState(false)

  return (
    <div
      data-slot="nyuchi-balance-display"
      style={animStyle}
      role="status"
      aria-label="Balance"
      className={cn(
        "rounded-[var(--radius-card,14px)] bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Total Balance</span>
        <button onClick={() => setHidden(!hidden)} className="p-1 text-muted-foreground">
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="mt-2">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {hidden ? "••••••" : balance.toLocaleString()}
        </span>
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">{currency}</span>
      </div>
      {fiatEquivalent && !hidden && (
        <div className="mt-1 text-sm text-muted-foreground">≈ {fiatEquivalent}</div>
      )}
      {/* Quick actions */}
      <div className="mt-5 flex gap-3">
        {[
          {
            label: "Send",
            icon: ArrowUpRight,
            action: onSend,
            color: "var(--color-malachite,#64FFDA)",
          },
          {
            label: "Receive",
            icon: ArrowDownLeft,
            action: onReceive,
            color: "var(--color-cobalt,#00B0FF)",
          },
          { label: "Swap", icon: Repeat, action: onSwap, color: "var(--color-tanzanite,#B388FF)" },
        ].map(
          (a) =>
            a.action && (
              <button
                key={a.label}
                onClick={a.action}
                className="flex min-h-[48px] flex-1 flex-col items-center gap-1.5 rounded-[var(--radius-inner,7px)] py-3 transition-colors hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
              >
                <div
                  className="flex size-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `color-mix(in srgb, ${a.color} 12%, transparent)` }}
                >
                  <a.icon className="size-5" style={{ color: a.color }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{a.label}</span>
              </button>
            )
        )}
      </div>
    </div>
  )
}

export { NyuchiBalanceDisplay }
export type { NyuchiBalanceDisplayProps }
