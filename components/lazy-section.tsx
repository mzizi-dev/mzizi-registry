"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react"
import { createLogger } from "@/lib/observability"

const logger = createLogger("lazy-section")

// ---------------------------------------------------------------------------
// Global mount queue — ensures only ONE section mounts at a time (FIFO)
// ---------------------------------------------------------------------------

type QueueEntry = {
  id: string
  priority: number
  mount: () => void
}

const mountQueue: QueueEntry[] = []
let isProcessing = false

function enqueue(entry: QueueEntry) {
  mountQueue.push(entry)
  // Sort by priority (lower = first)
  mountQueue.sort((a, b) => a.priority - b.priority)
  processQueue()
}

function dequeue(id: string) {
  const idx = mountQueue.findIndex((e) => e.id === id)
  if (idx !== -1) mountQueue.splice(idx, 1)
}

function processQueue() {
  if (isProcessing || mountQueue.length === 0) return
  isProcessing = true

  const next = mountQueue.shift()
  if (next) {
    next.mount()
    // Delay before processing next item
    // Mobile: 150ms settle time, Desktop: 50ms (from mukoko-weather)
    const delay = typeof window !== "undefined" && window.innerWidth < 768 ? 150 : 50
    setTimeout(() => {
      isProcessing = false
      processQueue()
    }, delay)
  } else {
    isProcessing = false
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

let sectionCounter = 0

interface LazySectionProps {
  children: ReactNode
  /** Skeleton or placeholder shown while section is queued/loading */
  fallback?: ReactNode
  /** Section name for logging (required) */
  section: string
  /** Lower priority mounts first (default: 0) */
  priority?: number
  /** Pixels past viewport before unmounting to reclaim memory (default: 1500) */
  unmountDistance?: number
  /** Bypass lazy loading entirely — renders children immediately */
  disabled?: boolean
  /** Additional className for the container */
  className?: string
}

/**
 * TikTok-style sequential section mounting for the Mukoko ecosystem.
 *
 * Prevents memory pressure on mobile by ensuring only ONE section mounts
 * at a time through a global FIFO queue. Sections that scroll far out of
 * view are unmounted to reclaim memory.
 *
 * From mukoko-weather production:
 * - Mobile: 150ms delay between section mounts
 * - Desktop: 50ms delay between section mounts
 * - Unmount threshold: 1500px past viewport
 *
 * Combine with SectionErrorBoundary for full Layer 4 protection:
 *
 * @example
 * ```tsx
 * import { LazySection } from "@/components/lazy-section"
 * import { SectionErrorBoundary } from "@/components/section-error-boundary"
 * import { Skeleton } from "@/components/ui/skeleton"
 *
 * export function DashboardPage() {
 *   return (
 *     <main>
 *       {/* First section loads eagerly *\/}
 *       <SectionErrorBoundary section="Current Conditions">
 *         <CurrentConditions />
 *       </SectionErrorBoundary>
 *
 *       {/* Remaining sections load sequentially *\/}
 *       <LazySection section="Hourly Forecast" fallback={<Skeleton className="h-64" />}>
 *         <SectionErrorBoundary section="Hourly Forecast">
 *           <HourlyForecast />
 *         </SectionErrorBoundary>
 *       </LazySection>
 *
 *       <LazySection section="Weather Chart" priority={1} fallback={<Skeleton className="h-80" />}>
 *         <SectionErrorBoundary section="Weather Chart">
 *           <WeatherChart />
 *         </SectionErrorBoundary>
 *       </LazySection>
 *     </main>
 *   )
 * }
 * ```
 */
export function LazySection({
  children,
  fallback,
  section,
  priority = 0,
  unmountDistance = 1500,
  disabled = false,
  className,
}: LazySectionProps) {
  const [mounted, setMounted] = useState(disabled)
  const [_visible, setVisible] = useState(disabled)
  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(`lazy-${sectionCounter++}-${section}`)

  // Mount when section enters viewport queue
  const handleMount = useCallback(() => {
    setMounted(true)
    logger.info(`Section "${section}" mounted`, {
      data: { section, priority },
    })
  }, [section, priority])

  // IntersectionObserver for viewport detection
  useEffect(() => {
    if (disabled || !containerRef.current) return

    const el = containerRef.current
    const id = idRef.current

    // Observe entry into viewport (with some margin)
    const entryObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !mounted) {
          enqueue({ id, priority, mount: handleMount })
        }
        setVisible(entry.isIntersecting)
      },
      { rootMargin: "200px" } // Start loading 200px before entering viewport
    )

    entryObserver.observe(el)

    return () => {
      entryObserver.disconnect()
      dequeue(id)
    }
  }, [disabled, mounted, priority, handleMount])

  // Unmount when scrolled far past viewport to reclaim memory
  useEffect(() => {
    if (disabled || !mounted || !containerRef.current) return

    const el = containerRef.current

    const unmountObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Check if we're far enough past viewport
          const rect = el.getBoundingClientRect()
          const distance = Math.min(
            Math.abs(rect.bottom), // Distance above viewport
            Math.abs(rect.top - window.innerHeight) // Distance below viewport
          )

          if (distance > unmountDistance) {
            setMounted(false)
            logger.info(`Section "${section}" unmounted (${Math.round(distance)}px away)`, {
              data: { section, distance: Math.round(distance), unmountDistance },
            })
          }
        }
      },
      { rootMargin: `${unmountDistance}px` }
    )

    unmountObserver.observe(el)
    return () => unmountObserver.disconnect()
  }, [disabled, mounted, section, unmountDistance])

  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <div ref={containerRef} className={className} data-slot="lazy-section" data-section={section} data-mounted={mounted}>
      {mounted ? children : (fallback ?? <div className="h-48 animate-pulse rounded-2xl bg-secondary/30" />)}
    </div>
  )
}
