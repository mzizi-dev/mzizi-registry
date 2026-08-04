"use client"
import * as React from "react"
import { useNyuchiHarness } from "@/lib/harness"

interface PrefetchConfig {
  url?: string
  prefetchFn?: () => Promise<void>
  priority?: "high" | "low"
}

interface NyuchiPrefetchBoundaryProps {
  children: React.ReactNode
  prefetches: PrefetchConfig[]
  rootMargin?: string
  respectDataSaver?: boolean
  name?: string
}

/**
 * The Network Information API — widely shipped, absent from lib.dom and from
 * Safari. Declared narrowly so the rest of Navigator stays typed.
 */
interface NavigatorWithConnection extends Navigator {
  connection?: {
    saveData?: boolean
    effectiveType?: string
    addEventListener?: (type: string, listener: () => void) => void
    removeEventListener?: (type: string, listener: () => void) => void
  }
}

export function NyuchiPrefetchBoundary({
  children,
  prefetches,
  rootMargin = "500px",
  respectDataSaver = true,
  name = "prefetch",
}: NyuchiPrefetchBoundaryProps) {
  const { log } = useNyuchiHarness(`prefetch-${name}`)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const triggered = React.useRef(false)

  React.useEffect(() => {
    if (triggered.current) return
    const el = sentinelRef.current
    if (!el) return
    if (respectDataSaver) {
      const conn = (navigator as NavigatorWithConnection).connection
      if (conn?.saveData || conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") {
        log.info("prefetch_skipped")
        return
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true
          observer.disconnect()
          log.info(`prefetch_triggered: ${prefetches.length}`)
          prefetches.forEach((p) => {
            if (p.url) {
              const link = document.createElement("link")
              link.rel = p.priority === "high" ? "preload" : "prefetch"
              link.href = p.url
              document.head.appendChild(link)
            }
            if (p.prefetchFn)
              p.prefetchFn().catch((e) =>
                log.warn("prefetch_failed", { error: (e as Error).message })
              )
          })
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [prefetches, rootMargin, respectDataSaver, log])

  return (
    <>
      {children}
      <div
        ref={sentinelRef}
        data-slot="nyuchi-prefetch-boundary"
        data-portal="https://mzizi.dev/components/nyuchi-prefetch-boundary"
        aria-hidden="true"
        className="h-0 w-0 overflow-hidden"
      />
    </>
  )
}
export type { PrefetchConfig, NyuchiPrefetchBoundaryProps }
