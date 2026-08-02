"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PayoutEntry {
  date: string
  amount: number
  status: "paid" | "pending" | "scheduled"
}

interface RevenueDashboardWidgetProps extends React.ComponentProps<"div"> {
  totalEarnings: number
  periodLabel?: string
  currency?: string
  platformFee?: number
  creatorShare?: number
  nextPayoutDate?: string
  nextPayoutAmount?: number
  recentPayouts?: PayoutEntry[]
}

function RevenueDashboardWidget({
  totalEarnings,
  periodLabel = "This month",
  currency = "MXT",
  platformFee,
  creatorShare,
  nextPayoutDate,
  nextPayoutAmount,
  recentPayouts,
  className,
  ...props
}: RevenueDashboardWidgetProps) {
  return (
    <div
      data-slot="revenue-dashboard-widget"
      data-portal="https://mzizi.dev/components/revenue-dashboard-widget"
      role="article"
      className={cn("rounded-[var(--radius-xl,17px)] border border-border bg-card p-5", className)}
      {...props}
    >
      <div className="text-xs text-muted-foreground">{periodLabel}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">
        {totalEarnings.toLocaleString()} {currency}
      </div>

      {platformFee !== undefined && creatorShare !== undefined && (
        <div className="mt-3 flex gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Your share: </span>
            <span className="font-medium text-[var(--color-malachite,#64FFDA)]">
              {creatorShare}%
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Platform: </span>
            <span className="font-medium">{platformFee}%</span>
          </div>
        </div>
      )}

      {nextPayoutDate && (
        <div className="mt-3 rounded-[var(--radius-md,12px)] bg-muted/30 p-3">
          <div className="text-[10px] text-muted-foreground">Next payout</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{nextPayoutDate}</span>
            {nextPayoutAmount && (
              <span className="text-sm font-bold tabular-nums">
                {nextPayoutAmount.toLocaleString()} {currency}
              </span>
            )}
          </div>
        </div>
      )}

      {recentPayouts && recentPayouts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[10px] font-medium text-muted-foreground">Recent payouts</div>
          {recentPayouts.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{p.date}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium tabular-nums">
                  {p.amount.toLocaleString()} {currency}
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px]",
                    p.status === "paid"
                      ? "bg-[var(--color-malachite,#64FFDA)]/10 text-[var(--color-malachite,#64FFDA)]"
                      : p.status === "pending"
                        ? "bg-[var(--color-gold,#FFD740)]/10 text-[var(--color-gold,#FFD740)]"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { RevenueDashboardWidget }
export type { RevenueDashboardWidgetProps }
