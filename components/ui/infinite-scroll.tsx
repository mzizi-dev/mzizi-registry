"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface InfiniteScrollProps extends React.ComponentProps<"div"> {
  onLoadMore: () => void | Promise<void>
  hasMore: boolean
  loading?: boolean
  threshold?: number
}

function InfiniteScroll({
  className,
  onLoadMore,
  hasMore,
  loading = false,
  threshold = 100,
  children,
  ...props
}: InfiniteScrollProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const loadMoreRef = React.useRef(onLoadMore)
  loadMoreRef.current = onLoadMore

  React.useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreRef.current()
        }
      },
      { rootMargin: `${threshold}px` }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, threshold])

  return (
    <div data-slot="infinite-scroll" className={cn(className)} {...props}>
      {children}
      {hasMore && (
        <div
          ref={sentinelRef}
          data-slot="infinite-scroll-sentinel"
          className="flex items-center justify-center py-4"
        >
          {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        </div>
      )}
      {!hasMore && React.Children.count(children) > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">No more items</p>
      )}
    </div>
  )
}

export { InfiniteScroll, type InfiniteScrollProps }
