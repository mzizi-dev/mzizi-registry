"use client"
import * as React from "react"

type RequestPriority = "critical" | "high" | "normal" | "low" | "background"
type SystemLoad = "normal" | "elevated" | "high" | "critical"

const SHED_THRESHOLDS: Record<SystemLoad, RequestPriority[]> = {
  normal: [],
  elevated: ["background"],
  high: ["background", "low"],
  critical: ["background", "low", "normal"],
}

interface LoadShedderConfig {
  systemLoad: SystemLoad
  onShed?: (priority: RequestPriority, reason: string) => void
}

const LoadShedContext = React.createContext<LoadShedderConfig>({ systemLoad: "normal" })

export function LoadShedProvider({
  systemLoad,
  onShed,
  children,
}: LoadShedderConfig & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ systemLoad, onShed }), [systemLoad, onShed])
  return <LoadShedContext.Provider value={value}>{children}</LoadShedContext.Provider>
}

export function useLoadShed(priority: RequestPriority): {
  shouldShed: boolean
  systemLoad: SystemLoad
} {
  const { systemLoad, onShed } = React.useContext(LoadShedContext)
  const shedList = SHED_THRESHOLDS[systemLoad]
  const shouldShed = shedList.includes(priority)
  React.useEffect(() => {
    if (shouldShed) onShed?.(priority, `System load: ${systemLoad}`)
  }, [shouldShed, priority, systemLoad, onShed])
  return { shouldShed, systemLoad }
}

interface NyuchiLoadShedderProps {
  children: React.ReactNode
  priority: RequestPriority
  fallback?: React.ReactNode
  silent?: boolean
}

export function NyuchiLoadShedder({
  children,
  priority,
  fallback,
  silent = false,
}: NyuchiLoadShedderProps) {
  const { shouldShed, systemLoad } = useLoadShed(priority)
  if (!shouldShed) return <>{children}</>
  if (silent) return null
  if (fallback) return <>{fallback}</>
  return (
    <div
      data-slot="nyuchi-load-shedder"
      data-portal="https://mzizi.dev/components/nyuchi-load-shedder"
      role="status"
      className="rounded-[var(--radius-lg,14px)] bg-muted/50 p-3 text-center text-xs text-muted-foreground"
    >
      Temporarily simplified — system load: {systemLoad}
    </div>
  )
}
export type { RequestPriority, SystemLoad, LoadShedderConfig }
