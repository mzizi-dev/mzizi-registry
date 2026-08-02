"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type ConnectionState = "online" | "syncing" | "cached" | "offline"

interface NyuchiConnectivityBarProps {
  state?: ConnectionState
  message?: string
  autoHideOnline?: boolean
  autoHideDelay?: number
  onRetry?: () => void
  className?: string
}

const STATE_CONFIG: Record<ConnectionState, { label: string; color: string }> = {
  online: { label: "Connected", color: "var(--connection-online, var(--status-success, #64FFDA))" },
  syncing: { label: "Syncing...", color: "var(--connection-syncing, var(--status-info, #00B0FF))" },
  cached: {
    label: "Using cached data",
    color: "var(--connection-cached, var(--status-warning, #FFD740))",
  },
  offline: {
    label: "No connection",
    color: "var(--connection-offline, var(--status-error, #FF5252))",
  },
}

export function NyuchiConnectivityBar({
  state = "online",
  message,
  autoHideOnline = true,
  autoHideDelay = 2000,
  onRetry,
  className,
}: NyuchiConnectivityBarProps) {
  const { log } = useNyuchiHarness("connectivity-bar")
  const [visible, setVisible] = React.useState(state !== "online")

  React.useEffect(() => {
    if (state === "online" && autoHideOnline) {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), autoHideDelay)
      return () => clearTimeout(t)
    }
    setVisible(true)
  }, [state, autoHideOnline, autoHideDelay])

  React.useEffect(() => {
    if (state !== "online") log.warn(`connectivity: ${state}`)
  }, [state, log])

  if (!visible) return null
  const config = STATE_CONFIG[state]

  return (
    <div
      data-slot="nyuchi-connectivity-bar"
      data-portal="https://mzizi.dev/components/nyuchi-connectivity-bar"
      data-state={state}
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium text-white transition-all",
        className
      )}
      style={{ backgroundColor: config.color }}
    >
      {state === "syncing" && (
        <div className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      )}
      <span>{message || config.label}</span>
      {state === "offline" && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 min-h-[44px] underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export type { ConnectionState, NyuchiConnectivityBarProps }
