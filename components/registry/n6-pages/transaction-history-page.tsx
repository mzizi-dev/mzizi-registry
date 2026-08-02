"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

interface TransactionHistoryPageProps {
  filters?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}

export function TransactionHistoryPage({
  filters,
  children,
  loading = false,
  className,
}: TransactionHistoryPageProps) {
  const { motion } = useNyuchiHarness("transaction-history-page")
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
        data-slot="transaction-history-page"
        data-portal="https://mzizi.dev/components/transaction-history-page"
        data-loading
        role="main"
        className="animate-pulse space-y-3 p-4"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 rounded-[var(--radius-lg,14px)] bg-muted" />
        ))}
      </main>
    )
  return (
    <main
      data-slot="transaction-history-page"
      role="main"
      aria-label="Transaction History"
      style={animStyle}
      className={cn("flex flex-col gap-4 p-4", className)}
    >
      <h1 className="text-xl font-bold">Transactions</h1>
      {filters && <section aria-label="Filters">{filters}</section>}
      <section aria-label="Transaction list" className="flex flex-col gap-2">
        {children}
      </section>
    </main>
  )
}
export type { TransactionHistoryPageProps }
