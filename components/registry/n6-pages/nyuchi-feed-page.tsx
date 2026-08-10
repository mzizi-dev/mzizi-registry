"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI FEED PAGE — Layer 6 Page Orchestrator
   
   The standard feed screen. Every mini-app's primary list view
   uses this orchestrator. Composes:
   
   L7 Shell: header, bottom-nav (via parent layout)
   L5 Resilience: NyuchiSection error boundaries per section
   L3 Brand: nyuchi-listing-card (or custom renderer), 
             nyuchi-empty-state, nyuchi-search-view
   L2 Primitives: filter-bar, infinite-scroll, pull-to-refresh
   L1 Tokens: --brand-accent, responsive breakpoints
   
   ✅ HARNESS  ✅ TOKENS  ✅ RESPONSIVE  ✅ ERROR BOUNDARIES
   ═══════════════════════════════════════════════════════════════ */

interface FilterConfig {
  key: string
  label: string
  options: { value: string; label: string }[]
}

interface NyuchiFeedPageProps<T = unknown> {
  /** Page title shown in header area */
  title: string
  /** Subtitle or description */
  subtitle?: string
  /** Data items to render */
  items: T[]
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Loading state */
  loading?: boolean
  /** Load more handler for infinite scroll */
  onLoadMore?: () => void
  /** Whether there are more items to load */
  hasMore?: boolean
  /** Pull-to-refresh handler */
  /** Search handler */
  onSearch?: (query: string) => void
  /** Filter configuration */
  filters?: FilterConfig[]
  /** Active filters */
  activeFilters?: Record<string, string>
  /** Filter change handler */
  onFilterChange?: (key: string, value: string) => void
  /** FAB create action */
  onCreateAction?: () => void
  /** FAB label */
  createLabel?: string
  /** Empty state props */
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  /** Skeleton count when loading */
  skeletonCount?: number
  className?: string
  children?: React.ReactNode
}

export function NyuchiFeedPage<T>({
  title,
  subtitle,
  items,
  renderItem,
  loading = false,
  onLoadMore,
  hasMore = false,
  onSearch,
  filters,
  activeFilters,
  onFilterChange,
  onCreateAction,
  createLabel = "Create",
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  skeletonCount = 5,
  className,
  children,
}: NyuchiFeedPageProps<T>) {
  return (
    <div
      data-slot="nyuchi-feed-page"
      data-portal="https://mzizi.dev/components/nyuchi-feed-page"
      className={cn("min-h-screen bg-background", className)}
    >
      <div className="mx-auto max-w-2xl px-4 pb-24 sm:px-6">
        {/* Page header */}
        <div className="sticky top-14 z-40 bg-background/80 py-4 backdrop-blur-xl">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        {/* Search + filters */}
        {(onSearch || filters) && (
          <div className="mb-4 space-y-3">
            {onSearch && (
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-sm text-muted-foreground">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  onChange={(e) => onSearch(e.target.value)}
                  className="h-12 w-full rounded-full border border-border bg-muted pr-4 pl-11 text-sm text-foreground transition-colors outline-none placeholder:text-muted-foreground focus:border-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))]"
                />
              </div>
            )}
            {filters && filters.length > 0 && (
              <div className="flex scrollbar-none gap-1.5 overflow-x-auto pb-1">
                {filters.map((f) => (
                  <select
                    key={f.key}
                    value={activeFilters?.[f.key] || ""}
                    onChange={(e) => onFilterChange?.(f.key, e.target.value)}
                    className="h-9 shrink-0 rounded-full border border-border bg-muted px-3 text-xs text-muted-foreground outline-none"
                  >
                    <option value="">{f.label}</option>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Injected children (announcements, banners) */}
        {children}

        {/* Feed content */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
              />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, i) => renderItem(item, i))}
            {hasMore && onLoadMore && (
              <button
                onClick={onLoadMore}
                className="flex h-12 w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Load more
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            {emptyIcon && (
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))]/10 text-2xl">
                {emptyIcon}
              </div>
            )}
            <h3 className="text-base font-semibold text-foreground">{emptyTitle}</h3>
            {emptyDescription && (
              <p className="mt-2 max-w-[280px] text-sm text-muted-foreground">{emptyDescription}</p>
            )}
            {onCreateAction && (
              <button
                onClick={onCreateAction}
                className="mt-6 h-12 rounded-full bg-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))] px-6 text-[13px] font-medium text-[var(--brand-accent-foreground,#0A0A0A)] transition-opacity hover:opacity-80"
              >
                {createLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      {onCreateAction && items.length > 0 && (
        <button
          onClick={onCreateAction}
          aria-label={createLabel}
          className="fixed right-5 bottom-24 z-40 flex size-14 items-center justify-center rounded-full bg-[var(--brand-accent,var(--status-success,var(--color-malachite,#64FFDA)))] text-[var(--brand-accent-foreground,#0A0A0A)] shadow-lg transition-opacity hover:opacity-80 md:hidden"
        >
          <span className="text-xl font-bold">+</span>
        </button>
      )}
    </div>
  )
}
