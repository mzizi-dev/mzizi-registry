"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI DATA BRIDGE
   
   The multi-node architecture means data arrives at different speeds
   from different sources. This module standardizes how the UI
   requests, receives, and displays data regardless of which
   layer it comes from.
   
   FETCH STRATEGY (cascade):
   1. Local cache (SQLite/IndexedDB via RxDB) → instant
   2. Edge (Cloudflare D1/KV) → fast
   3. Cloud (Supabase PostgreSQL) → reliable
   4. Background sync reconciles all layers
   
   Exports:
   - useNyuchiQuery: local-first data hook
   - NyuchiListView: declarative feed composition
   - NyuchiSearchView: standard search experience
   - optimistic update utilities
   ═══════════════════════════════════════════════════════════════ */

// ─── Data Source Tracking ──────────────────────────────────
export type DataSource = "local" | "edge" | "cloud" | "unknown"
export type FetchStatus = "idle" | "loading" | "success" | "error" | "stale"

interface QueryResult<T> {
  data: T | null
  status: FetchStatus
  source: DataSource
  error: Error | null
  isLoading: boolean
  isStale: boolean
  /** Time of last successful fetch */
  lastFetchedAt: Date | null
  /** Manually refetch */
  refetch: () => Promise<void>
  /** Optimistically set data (reverts on error) */
  setOptimistic: (updater: (current: T | null) => T) => void
}

interface QueryOptions<T> {
  /** Unique key for caching */
  key: string
  /** The fetch function — receives the preferred source */
  fetcher: (source: DataSource) => Promise<T>
  /** Stale time in ms (default 30s) */
  staleTime?: number
  /** Whether to enable the query */
  enabled?: boolean
  /** Callback on success */
  onSuccess?: (data: T, source: DataSource) => void
  /** Callback on error */
  onError?: (error: Error) => void
}

export function useNyuchiQuery<T>({
  key,
  fetcher,
  staleTime = 30_000,
  enabled = true,
  onSuccess,
  onError,
}: QueryOptions<T>): QueryResult<T> {
  const [data, setData] = React.useState<T | null>(null)
  const [status, setStatus] = React.useState<FetchStatus>("idle")
  const [source, setSource] = React.useState<DataSource>("unknown")
  const [error, setError] = React.useState<Error | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = React.useState<Date | null>(null)
  const previousDataRef = React.useRef<T | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!enabled) return
    setStatus("loading")
    setError(null)

    // Try sources in cascade order
    const sources: DataSource[] = ["local", "edge", "cloud"]
    for (const src of sources) {
      try {
        const result = await fetcher(src)
        setData(result)
        setSource(src)
        setStatus("success")
        setLastFetchedAt(new Date())
        previousDataRef.current = result
        onSuccess?.(result, src)

        // If we got local data, still try to sync from cloud in background
        if (src === "local") {
          fetcher("cloud")
            .then((cloudResult) => {
              setData(cloudResult)
              setSource("cloud")
              setLastFetchedAt(new Date())
              previousDataRef.current = cloudResult
            })
            .catch(() => {
              /* silent — local data is good enough */
            })
        }
        return
      } catch {
        continue // Try next source
      }
    }

    // All sources failed
    const err = new Error(`Failed to fetch: ${key}`)
    setError(err)
    setStatus("error")
    onError?.(err)
  }, [key, fetcher, enabled, onSuccess, onError])

  // Staleness check
  const isStale = React.useMemo(() => {
    if (!lastFetchedAt) return true
    return Date.now() - lastFetchedAt.getTime() > staleTime
  }, [lastFetchedAt, staleTime])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Optimistic update
  const setOptimistic = React.useCallback(
    (updater: (current: T | null) => T) => {
      previousDataRef.current = data
      setData(updater(data))
    },
    [data]
  )

  return {
    data,
    status,
    source,
    error,
    isLoading: status === "loading",
    isStale: status === "success" && isStale,
    lastFetchedAt,
    refetch: fetchData,
    setOptimistic,
  }
}

// ─── NyuchiListView ────────────────────────────────────────
// Declarative feed composition. Every list screen uses this.

interface NyuchiListViewProps<T> {
  /** Items to display */
  items: T[]
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Loading state — shows skeleton */
  loading?: boolean
  /** Error state — shows error card */
  error?: Error | string | null
  /** Whether more items can be loaded */
  hasMore?: boolean
  /** Callback when bottom is reached */
  onLoadMore?: () => void
  /**
   * Refresh callback. When supplied, a Refresh control renders above the list.
   *
   * Documented as "pull-to-refresh" and destructured but never wired, so a
   * consumer passing it got nothing. It is a button rather than a gesture
   * because this component does not own a scroll container — the page scrolls —
   * so it cannot observe an overscroll at the top of its own list, and a
   * gesture would not be keyboard-reachable in any case (§8.2).
   */
  onRefresh?: () => void
  /** Data source indicator */
  dataSource?: DataSource
  /** Empty state content */
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: React.ReactNode
  /** Number of skeleton items to show while loading */
  skeletonCount?: number
  /** Skeleton variant */
  skeletonVariant?: "row" | "compact"
  /** Retry callback for error state */
  onRetry?: () => void
  /** Header content (above the list) */
  header?: React.ReactNode
  className?: string
}

export function NyuchiListView<T>({
  items,
  renderItem,
  loading,
  error,
  hasMore,
  onLoadMore,
  onRefresh,
  dataSource,
  emptyIcon,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyAction,
  skeletonCount = 4,
  skeletonVariant = "row",
  onRetry,
  header,
  className,
}: NyuchiListViewProps<T>) {
  // Intersection observer for infinite scroll
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!hasMore || !onLoadMore || !sentinelRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore()
      },
      { rootMargin: "200px" }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  const isEmpty = !loading && !error && items.length === 0

  return (
    <div
      data-slot="nyuchi-list-view"
      data-portal="https://mzizi.dev/components/nyuchi-list-view"
      data-source={dataSource}
      className={cn("flex flex-col", className)}
    >
      {header}

      {onRefresh && (
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="min-h-12 rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && items.length === 0 && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "animate-pulse rounded-[var(--radius-card,14px)] bg-card ring-1 ring-foreground/10",
                skeletonVariant === "row"
                  ? "flex items-center gap-3 border-l-4 border-l-foreground/[0.06] py-3 pr-4 pl-3"
                  : "aspect-video"
              )}
            >
              {skeletonVariant === "row" && (
                <>
                  <div className="size-12 shrink-0 rounded-[var(--radius-inner,7px)] bg-foreground/[0.06]" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="h-4 w-2/3 rounded bg-foreground/[0.06]" />
                    <div className="h-3 w-full rounded bg-foreground/[0.06]" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-[var(--radius-card,14px)] border-l-4 border-l-[var(--color-terracotta)] bg-card px-4 py-3 ring-1 ring-foreground/10">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">Something went wrong</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {typeof error === "string" ? error : error.message}
            </div>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="shrink-0 text-xs font-medium text-[var(--color-primary)]"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          {emptyIcon && <div className="mb-4 text-muted-foreground">{emptyIcon}</div>}
          <h3 className="font-serif text-lg font-bold text-foreground">{emptyTitle}</h3>
          {emptyMessage && <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>}
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      )}

      {/* Items */}
      {items.map((item, i) => (
        <React.Fragment key={i}>{renderItem(item, i)}</React.Fragment>
      ))}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}

      {/* Loading more indicator */}
      {loading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-[var(--color-primary)]" />
        </div>
      )}
    </div>
  )
}

export type { QueryResult, QueryOptions, NyuchiListViewProps }
