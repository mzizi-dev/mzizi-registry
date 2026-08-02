"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

/* ═══════════════════════════════════════════════════════════════
   OFFLINE BANNER — Layer 5 Resilience
   
   Connection status for local-first architecture.
   ✅ HARNESS  ✅ TOKENS  ✅ ARIA  ✅ MOTION
   ═══════════════════════════════════════════════════════════════ */

type ConnectionStatus = "online" | "offline" | "cached" | "syncing"

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; icon: string }> = {
  online: {
    label: "Connected",
    color: "var(--connection-online, #22C55E)",
    icon: "M5 12l5 5L20 7",
  },
  offline: {
    label: "You are offline",
    color: "var(--connection-offline, #EF4444)",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636",
  },
  cached: {
    label: "Showing saved data",
    color: "var(--connection-cached, #F59E0B)",
    icon: "M12 8v4m0 4h.01",
  },
  syncing: {
    label: "Reconnecting...",
    color: "var(--connection-syncing, #3B82F6)",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  },
}

interface OfflineBannerProps {
  status?: ConnectionStatus
  /** Auto-detect using navigator.onLine */
  autoDetect?: boolean
  /** Show even when online (for debugging) */
  alwaysShow?: boolean
  className?: string
}

export function OfflineBanner({
  status: propStatus,
  autoDetect = true,
  alwaysShow = false,
  className,
}: OfflineBannerProps) {
  const { log, motion } = useNyuchiHarness("offline-banner")
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  const [detected, setDetected] = React.useState<ConnectionStatus>("online")
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    if (!autoDetect || typeof window === "undefined") return
    const update = () => {
      const next = navigator.onLine ? "online" : "offline"
      setDetected(next)
      setDismissed(false)
      log.info(`connection_${next}`)
    }
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    update()
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [autoDetect, log])

  const status = propStatus ?? detected
  const config = STATUS_CONFIG[status]

  if (status === "online" && !alwaysShow) return null
  if (dismissed) return null

  return (
    <div
      data-slot="offline-banner"
      data-portal="https://mzizi.dev/components/offline-banner"
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-black",
        className
      )}
      style={{ ...animStyle, backgroundColor: config.color }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={status === "syncing" ? "animate-spin" : ""}
      >
        <path d={config.icon} />
      </svg>
      <span>{config.label}</span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="ml-2 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full p-1 transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export type { ConnectionStatus, OfflineBannerProps }
