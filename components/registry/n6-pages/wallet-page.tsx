"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface WalletPageProps {
  balance?: { amount: number; currency: string; change?: number }
  tokens?: { symbol: string; balance: number; value?: number }[]
  actions?: { label: string; icon: React.ReactNode; onClick: () => void }[]
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function WalletPage({
  balance,
  tokens,
  actions,
  children,
  loading = false,
  className,
}: WalletPageProps) {
  const { motion } = useNyuchiHarness("wallet-page")
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
      <main
        data-slot="wallet-page"
        data-portal="https://mzizi.dev/components/wallet-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-32 rounded-[var(--radius-xl,17px)] bg-muted" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 flex-1 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
        <div className="h-64 rounded-[var(--radius-lg,14px)] bg-muted" />
      </main>
    )

  return (
    <main
      data-slot="wallet-page"
      role="main"
      style={animStyle}
      className={cn("flex flex-col gap-4 p-4", className)}
    >
      {/* Balance card */}
      {balance && (
        <section
          aria-label="Balance"
          className="rounded-[var(--radius-xl,17px)] bg-gradient-to-br from-primary to-primary/60 p-6 text-white"
        >
          <p className="text-sm opacity-80">Total Balance</p>
          <p className="mt-1 text-3xl font-bold">
            {new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: balance.currency,
            }).format(balance.amount)}
          </p>
          {balance.change != null && (
            <p
              className={cn(
                "mt-1 text-sm",
                balance.change >= 0 ? "text-[var(--status-success,#64FFDA)]" : "text-red-300"
              )}
            >
              {balance.change >= 0 ? "+" : ""}
              {balance.change.toFixed(2)}%
            </p>
          )}
        </section>
      )}
      {/* Quick actions */}
      {actions && actions.length > 0 && (
        <section aria-label="Quick actions" className="flex gap-3 overflow-x-auto">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="flex min-h-[48px] min-w-[72px] flex-1 flex-col items-center gap-1 rounded-[var(--radius-lg,14px)] border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary,#00B0FF)]"
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </section>
      )}
      {/* Token portfolio */}
      {tokens && tokens.length > 0 && (
        <section
          aria-label="Token portfolio"
          className="divide-y divide-border rounded-[var(--radius-lg,14px)] border border-border bg-card"
        >
          {tokens.map((t) => (
            <div key={t.symbol} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{t.symbol}</span>
              <div className="text-right">
                <p className="text-sm font-medium">{t.balance.toLocaleString()}</p>
                {t.value != null && (
                  <p className="text-xs text-muted-foreground">${t.value.toFixed(2)}</p>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
      {children}
    </main>
  )
}
export type { WalletPageProps }
