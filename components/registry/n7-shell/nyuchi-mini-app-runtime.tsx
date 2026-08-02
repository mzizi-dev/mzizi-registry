"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"

type MiniAppState = "loading" | "mounted" | "suspended" | "error" | "destroyed"

interface MiniAppConfig {
  id: string
  name: string
  tier: 1 | 2
  entrypoint: string
  icon?: React.ReactNode
  permissions?: string[]
  maxMemoryMB?: number
}

interface NyuchiMiniAppRuntimeProps {
  config: MiniAppConfig
  state?: MiniAppState
  onStateChange?: (state: MiniAppState) => void
  fallback?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function NyuchiMiniAppRuntime({
  config,
  state = "loading",
  onStateChange,
  fallback,
  children,
  className,
}: NyuchiMiniAppRuntimeProps) {
  const { log, motion } = useNyuchiHarness(`mini-app-${config.id}`)
  const animStyle = React.useMemo(
    () =>
      motion.prefersReduced
        ? {}
        : {
            animation: `nyuchi-fade-slide-up ${motion.enterDuration}ms ${motion.enterEasing} both`,
          },
    [motion]
  )

  React.useEffect(() => {
    log.info(`mini_app_state: ${config.id} → ${state}`)
    onStateChange?.(state)
  }, [state, config.id, log, onStateChange])

  if (state === "loading") {
    return (
      <div
        data-slot="nyuchi-mini-app-runtime"
        data-portal="https://mzizi.dev/components/nyuchi-mini-app-runtime"
        data-app={config.id}
        data-state="loading"
        role="status"
        aria-label={`Loading ${config.name}`}
        className={cn("flex min-h-screen items-center justify-center", className)}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">{config.name}</p>
        </div>
      </div>
    )
  }

  if (state === "error") {
    return (
      <div
        data-slot="nyuchi-mini-app-runtime"
        data-app={config.id}
        data-state="error"
        role="alert"
        className={cn(
          "flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center",
          className
        )}
      >
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-sm text-muted-foreground">{config.name} encountered an error</p>
        {fallback}
      </div>
    )
  }

  if (state === "suspended") return null

  return (
    <div
      data-slot="nyuchi-mini-app-runtime"
      data-app={config.id}
      data-state="mounted"
      data-tier={config.tier}
      role="application"
      aria-label={config.name}
      style={animStyle}
      className={cn("flex min-h-screen flex-col", className)}
    >
      {children}
    </div>
  )
}

export type { MiniAppState, MiniAppConfig, NyuchiMiniAppRuntimeProps }
