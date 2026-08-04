"use client"

import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   LAZY SECTION — Layer 2 Primitive (Upgraded)
   
   TikTok-style sequential mounting with bidirectional visibility.
   Production-proven in mukoko-weather (7 Chart.js sections, mobile).
   
   Key features:
   1. FIFO mount queue — only ONE section mounts at a time
   2. Bidirectional unmount — sections unmount when far off-screen
   3. Adaptive timing — mobile gets 150ms settle, desktop 50ms
   4. Canvas-optimised — Chart.js instances destroyed on unmount
   
   ✅ TOKENS  ✅ ARIA  ✅ LOADING  ✅ MOBILE
   ═══════════════════════════════════════════════════════════════ */

type QueueEntry = { mount: () => void; cancelled: boolean }
const mountQueue: QueueEntry[] = []
let isProcessing = false

function getSettleDelay(): number {
  if (typeof window === "undefined") return 100
  return window.innerWidth < 768 ? 150 : 50
}

function processQueue(): void {
  while (mountQueue.length > 0) {
    const next = mountQueue.shift()!
    if (next.cancelled) continue
    isProcessing = true
    next.mount()
    requestAnimationFrame(() => {
      setTimeout(() => {
        isProcessing = false
        processQueue()
      }, getSettleDelay())
    })
    return
  }
  isProcessing = false
}

function enqueueMount(mountFn: () => void): () => void {
  const entry: QueueEntry = { mount: mountFn, cancelled: false }
  mountQueue.push(entry)
  if (!isProcessing) processQueue()
  return () => {
    entry.cancelled = true
  }
}

const UNLOAD_MARGIN = "1500px"
function getLoadMargin(): string {
  if (typeof window === "undefined") return "300px"
  return window.innerWidth < 768 ? "100px" : "300px"
}

interface LazySectionProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  label?: string
  loading?: boolean
  className?: string
}

const DEFAULT_FALLBACK = (
  <div
    className="h-48 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
    role="status"
    aria-label="Loading section"
  >
    <span className="sr-only">Loading section</span>
  </div>
)

export function LazySection({
  children,
  fallback = DEFAULT_FALLBACK,
  rootMargin,
  label = "section",
  loading = false,
  className,
}: LazySectionProps) {
  const loadMargin = rootMargin ?? getLoadMargin()
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const cancelRef = React.useRef<(() => void) | null>(null)
  const [visible, setVisible] = React.useState(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined"
  )
  const hasRendered = React.useRef(false)
  const [animate, setAnimate] = React.useState(false)

  // Load observer: mount when entering viewport
  React.useEffect(() => {
    if (visible) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          cancelRef.current = enqueueMount(() => {
            setAnimate(!hasRendered.current)
            setVisible(true)
            hasRendered.current = true
          })
        }
      },
      { rootMargin: loadMargin }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelRef.current?.()
      cancelRef.current = null
    }
  }, [visible, loadMargin])

  // Unload observer: unmount when far off-screen to reclaim memory
  React.useEffect(() => {
    if (!visible || !hasRendered.current) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) setVisible(false)
      },
      { rootMargin: UNLOAD_MARGIN }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  if (loading)
    return (
      <div
        data-slot="lazy-section"
        data-portal="https://mzizi.dev/components/lazy-section"
        data-loading
      >
        {fallback}
      </div>
    )

  return (
    <div ref={sentinelRef} data-slot="lazy-section" data-lazy-section={label} className={className}>
      {visible ? (
        <div className={animate ? "animate-fade-in-up" : undefined}>{children}</div>
      ) : (
        fallback
      )}
    </div>
  )
}
