"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface VirtualListProps<T> extends Omit<React.ComponentProps<"div">, "children"> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  overscan?: number
}

function VirtualList<T>({
  className,
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  ...props
}: VirtualListProps<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = React.useState(0)
  const [containerHeight, setContainerHeight] = React.useState(0)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = React.useMemo(() => {
    const result: React.ReactNode[] = []
    for (let i = startIndex; i < endIndex; i++) {
      result.push(
        <div
          key={i}
          data-slot="virtual-list-item"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: itemHeight,
            transform: `translateY(${i * itemHeight}px)`,
          }}
        >
          {renderItem(items[i], i)}
        </div>
      )
    }
    return result
  }, [items, startIndex, endIndex, itemHeight, renderItem])

  return (
    <div
      ref={containerRef}
      data-slot="virtual-list"
      onScroll={handleScroll}
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      <div
        data-slot="virtual-list-inner"
        style={{ height: totalHeight, position: "relative" }}
      >
        {visibleItems}
      </div>
    </div>
  )
}

export { VirtualList }
export type { VirtualListProps }
