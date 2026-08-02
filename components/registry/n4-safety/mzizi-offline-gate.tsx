"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type ConnectivityRequirement = "none" | "cached" | "edge" | "cloud"
type ConnectivityState = "online" | "edge-only" | "cached-only" | "offline"

const CONNECTIVITY_ORDER: Record<ConnectivityState, number> = {
  online: 3,
  "edge-only": 2,
  "cached-only": 1,
  offline: 0,
}
const REQUIREMENT_ORDER: Record<ConnectivityRequirement, number> = {
  none: 0,
  cached: 1,
  edge: 2,
  cloud: 3,
}

const STATE_CONFIG: Record<ConnectivityState, { color: string; label: string }> = {
  online: { color: "var(--connection-online, #22C55E)", label: "Connected" },
  "edge-only": { color: "var(--connection-syncing, #3B82F6)", label: "Edge Connected" },
  "cached-only": { color: "var(--connection-cached, #F59E0B)", label: "Using Saved Data" },
  offline: { color: "var(--connection-offline, #EF4444)", label: "Offline" },
}

interface NyuchiOfflineGateProps {
  children: React.ReactNode
  requires: ConnectivityRequirement
  currentState: ConnectivityState
  featureName?: string
  offlineAlternative?: React.ReactNode
  loading?: boolean
  className?: string
}

export function NyuchiOfflineGate({
  children,
  requires,
  currentState,
  featureName = "This feature",
  offlineAlternative,
  loading = false,
  className,
}: NyuchiOfflineGateProps) {
  const { motion } = useNyuchiHarness("offline-gate")
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
      <div
        data-slot="nyuchi-offline-gate"
        data-portal="https://mzizi.dev/components/nyuchi-offline-gate"
        data-loading
        role="status"
        className="h-24 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted"
      />
    )

  const hasEnoughConnectivity = CONNECTIVITY_ORDER[currentState] >= REQUIREMENT_ORDER[requires]
  if (hasEnoughConnectivity) return <>{children}</>
  if (offlineAlternative) return <>{offlineAlternative}</>

  const stateConfig = STATE_CONFIG[currentState]
  return (
    <div
      data-slot="nyuchi-offline-gate"
      role="status"
      aria-live="polite"
      style={animStyle}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg,14px)] bg-card p-4 ring-1 ring-foreground/10",
        className
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${stateConfig.color} 15%, transparent)` }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={stateConfig.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{featureName} requires a connection</p>
        <p className="text-xs text-muted-foreground">
          Status: <strong style={{ color: stateConfig.color }}>{stateConfig.label}</strong> — needs{" "}
          {requires === "cloud"
            ? "full internet"
            : requires === "edge"
              ? "edge connectivity"
              : "cached data"}
        </p>
      </div>
    </div>
  )
}
export type { ConnectivityRequirement, ConnectivityState, NyuchiOfflineGateProps }
