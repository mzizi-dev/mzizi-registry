"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/* NYUCHI COMPONENT HARNESS — the vertical infrastructure spine.
   Gives N3 brand, N4 safety, and N5 resilience components scoped
   logging, motion (reduced-motion aware), and an accessible shared
   live region. N2 primitives never import it; N1 tokens are pure data.
   Self-contained: swap the console logger for your app observability. */

export interface ScopedLogger {
  debug: (message: string, data?: Record<string, unknown>) => void
  info: (message: string, data?: Record<string, unknown>) => void
  warn: (message: string, data?: Record<string, unknown>) => void
  error: (message: string, error?: Error, data?: Record<string, unknown>) => void
}

function createScopedLogger(name: string): ScopedLogger {
  const prefix = `[mzizi:${name}]`
  /* eslint-disable no-console -- this component IS the console logger the rest
     of the system calls; `debug` and `info` are its own levels, not stray
     debugging left in a component. */
  return {
    debug: (m, d) => console.debug(prefix, m, d ?? ""),
    info: (m, d) => console.info(prefix, m, d ?? ""),
    warn: (m, d) => console.warn(prefix, m, d ?? ""),
    error: (m, e, d) => console.error(prefix, m, e ?? "", d ?? ""),
    /* eslint-enable no-console */
  }
}

export interface MotionConfig {
  prefersReduced: boolean
  enterDuration: number
  exitDuration: number
  enterEasing: string
  exitEasing: string
  staggerDelay: (index: number) => number
}

function getMotionConfig(): MotionConfig {
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  return {
    prefersReduced,
    enterDuration: prefersReduced ? 0 : 200,
    exitDuration: prefersReduced ? 0 : 100,
    enterEasing: prefersReduced ? "linear" : "cubic-bezier(0, 0, 0.2, 1)",
    exitEasing: prefersReduced ? "linear" : "cubic-bezier(0.4, 0, 1, 1)",
    staggerDelay: (index: number) => (prefersReduced ? 0 : Math.min(index, 8) * 50),
  }
}

function useAnnouncer() {
  const regionRef = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    if (typeof document === "undefined") return
    let el = document.getElementById("nyuchi-live-region")
    if (!el) {
      el = document.createElement("div")
      el.id = "nyuchi-live-region"
      el.setAttribute("role", "status")
      el.setAttribute("aria-live", "polite")
      el.setAttribute("aria-atomic", "true")
      el.className = "sr-only"
      document.body.appendChild(el)
    }
    regionRef.current = el
  }, [])
  const say = React.useCallback((message: string, politeness: "polite" | "assertive") => {
    const el = regionRef.current
    if (!el) return
    el.setAttribute("aria-live", politeness)
    el.textContent = ""
    requestAnimationFrame(() => {
      el.textContent = message
    })
  }, [])
  const announce = React.useCallback((m: string) => say(m, "polite"), [say])
  const announceUrgent = React.useCallback((m: string) => say(m, "assertive"), [say])
  const LiveRegion = React.useMemo(() => <span className="sr-only" aria-hidden="true" />, [])
  return { announce, announceUrgent, LiveRegion }
}

export interface ComponentHarnessResult {
  log: ScopedLogger
  motion: MotionConfig
  announce: (message: string) => void
  announceUrgent: (message: string) => void
  LiveRegion: React.ReactNode
}

export function useNyuchiHarness(componentName: string): ComponentHarnessResult {
  const log = React.useMemo(() => createScopedLogger(componentName), [componentName])
  const motion = React.useMemo(() => getMotionConfig(), [])
  const { announce, announceUrgent, LiveRegion } = useAnnouncer()
  React.useEffect(() => {
    log.debug("mounted")
    return () => log.debug("unmounted")
  }, [log])
  return { log, motion, announce, announceUrgent, LiveRegion }
}

export interface NyuchiHarnessProps {
  name: string
  children: React.ReactNode
  loading?: boolean
  skeleton?: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

interface BoundaryState {
  hasError: boolean
}

class HarnessBoundary extends React.Component<
  { name: string; fallback?: React.ReactNode; children: React.ReactNode },
  BoundaryState
> {
  state: BoundaryState = { hasError: false }
  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    createScopedLogger(this.props.name).error("section crashed", error)
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="flex flex-col items-center gap-2 rounded-[var(--radius-lg,14px)] border border-border bg-card p-6 text-center text-sm text-muted-foreground"
          >
            This section could not be displayed.
          </div>
        )
      )
    }
    return this.props.children
  }
}

export function NyuchiHarness({
  name,
  children,
  loading = false,
  skeleton,
  fallback,
  className,
}: NyuchiHarnessProps) {
  if (loading) {
    return (
      <div data-slot="nyuchi-harness" data-loading role="status" className={className}>
        {skeleton ?? (
          <div className="h-32 animate-pulse rounded-[var(--radius-lg,14px)] bg-muted" />
        )}
      </div>
    )
  }
  return (
    <div
      data-slot="nyuchi-harness"
      data-portal="https://mzizi.dev/components/nyuchi-harness"
      className={cn(className)}
    >
      <HarnessBoundary name={name} fallback={fallback}>
        {children}
      </HarnessBoundary>
    </div>
  )
}
