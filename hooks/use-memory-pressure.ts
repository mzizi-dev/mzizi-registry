"use client"

import { useState, useEffect } from "react"

interface MemoryInfo {
  /** Whether JS heap usage exceeds the threshold (default 85%) */
  isUnderPressure: boolean
  /** Used JS heap in MB, or null if API unavailable */
  usedMB: number | null
  /** Total JS heap size in MB, or null if API unavailable */
  totalMB: number | null
  /** Usage percentage (0-100), or null if API unavailable */
  usagePercent: number | null
}

/**
 * Check if the Performance Memory API is available.
 * Only available in Chromium browsers (Chrome, Edge, Opera).
 */
function hasMemoryAPI(): boolean {
  return (
    typeof performance !== "undefined" &&
    "memory" in performance &&
    typeof (performance as PerformanceWithMemory).memory?.usedJSHeapSize === "number"
  )
}

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory: PerformanceMemory
}

/**
 * Monitor JavaScript heap memory pressure.
 *
 * Uses the Performance Memory API (Chrome-only) to detect when the app
 * is approaching memory limits. Gracefully returns null values on browsers
 * that don't support the API (Firefox, Safari).
 *
 * From mukoko-weather's TikTok-style sequential mounting:
 * memory pressure triggers aggressive unmounting of off-screen sections.
 *
 * @param thresholdPercent - Usage percentage that triggers pressure (default: 85)
 * @param pollIntervalMs - How often to check memory in ms (default: 5000)
 *
 * @example
 * ```ts
 * import { useMemoryPressure } from "@/hooks/use-memory-pressure"
 *
 * function Dashboard() {
 *   const { isUnderPressure, usedMB } = useMemoryPressure(85)
 *
 *   return (
 *     <main>
 *       {isUnderPressure && (
 *         <Banner variant="warning">
 *           High memory usage ({usedMB}MB) — some sections may be unloaded
 *         </Banner>
 *       )}
 *       <LazySection section="Charts" disabled={isUnderPressure}>
 *         <Charts />
 *       </LazySection>
 *     </main>
 *   )
 * }
 * ```
 */
export function useMemoryPressure(thresholdPercent = 85, pollIntervalMs = 5000): MemoryInfo {
  const [info, setInfo] = useState<MemoryInfo>({
    isUnderPressure: false,
    usedMB: null,
    totalMB: null,
    usagePercent: null,
  })

  useEffect(() => {
    if (!hasMemoryAPI()) return

    function check() {
      const mem = (performance as PerformanceWithMemory).memory
      const usedMB = Math.round(mem.usedJSHeapSize / 1024 / 1024)
      const totalMB = Math.round(mem.jsHeapSizeLimit / 1024 / 1024)
      const usagePercent = Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100)

      setInfo({
        isUnderPressure: usagePercent >= thresholdPercent,
        usedMB,
        totalMB,
        usagePercent,
      })
    }

    check()
    const timer = setInterval(check, pollIntervalMs)
    return () => clearInterval(timer)
  }, [thresholdPercent, pollIntervalMs])

  return info
}
