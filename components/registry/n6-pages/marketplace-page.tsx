"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
interface MarketplacePageProps {
  search?: React.ReactNode
  categories?: React.ReactNode
  viewToggle?: React.ReactNode
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
export function MarketplacePage({
  search,
  categories,
  viewToggle,
  children,
  loading = false,
  className,
}: MarketplacePageProps) {
  const { motion } = useNyuchiHarness("marketplace-page")
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
        data-slot="marketplace-page"
        data-portal="https://mzizi.dev/components/marketplace-page"
        data-loading
        role="main"
        className="animate-pulse space-y-4 p-4"
      >
        <div className="h-12 rounded-full bg-muted" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-[var(--radius-lg,14px)] bg-muted" />
          ))}
        </div>
      </main>
    )
  return (
    <main
      data-slot="marketplace-page"
      role="main"
      aria-label="Marketplace"
      style={animStyle}
      className={cn("flex flex-col gap-4 p-4", className)}
    >
      {search && <section aria-label="Search">{search}</section>}
      {(categories || viewToggle) && (
        <div className="flex items-center justify-between">
          {categories && (
            <section aria-label="Categories" className="flex-1 overflow-x-auto">
              {categories}
            </section>
          )}
          {viewToggle}
        </div>
      )}
      <section aria-label="Products">{children}</section>
    </main>
  )
}
export type { MarketplacePageProps }
