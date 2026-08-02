"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useNyuchiHarness } from "@/lib/harness"
type LogLevel = "debug" | "info" | "warn" | "error" | "fatal"
interface LogsPageProps {
  title?: string
  search?: React.ReactNode
  levelFilters?: LogLevel[]
  activeLevel?: LogLevel | "all"
  onLevelChange?: (level: LogLevel | "all") => void
  timeRange?: React.ReactNode
  isStreaming?: boolean
  onToggleStream?: () => void
  children?: React.ReactNode
  loading?: boolean
  className?: string
}
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "var(--color-muted-foreground)",
  info: "var(--status-info, var(--color-cobalt, #00B0FF))",
  warn: "var(--status-warning, var(--color-gold, #FFD740))",
  error: "var(--status-error, var(--destructive, #FF5252))",
  fatal: "var(--severity-extreme, var(--destructive, #FF5252))",
}
export function LogsPage({
  title = "Logs",
  search,
  levelFilters = ["debug", "info", "warn", "error", "fatal"],
  activeLevel = "all",
  onLevelChange,
  timeRange,
  isStreaming,
  onToggleStream,
  children,
  loading = false,
  className,
}: LogsPageProps) {
  const { motion } = useNyuchiHarness("logs-page")
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
      <main
        data-slot="logs-page"
        data-portal="https://mzizi.dev/components/logs-page"
        data-loading
        role="main"
        className="animate-pulse space-y-3 p-4 font-mono"
      >
        <div className="h-10 rounded bg-muted" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-6 rounded bg-muted"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        ))}
      </main>
    )
  return (
    <main
      data-slot="logs-page"
      role="main"
      aria-label={title}
      style={animStyle}
      className={cn("flex h-screen flex-col overflow-hidden", className)}
    >
      <header className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">{title}</h1>
          {isStreaming != null && (
            <button
              onClick={onToggleStream}
              className={cn(
                "flex min-h-[44px] items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                isStreaming
                  ? "bg-[var(--status-success,var(--color-malachite,#64FFDA))]/15 text-[var(--status-success,var(--color-malachite,#64FFDA))]"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "size-1.5 rounded-full",
                  isStreaming
                    ? "animate-pulse bg-[var(--status-success,var(--color-malachite,#64FFDA))]"
                    : "bg-muted-foreground"
                )}
              />
              {isStreaming ? "Live" : "Paused"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {search}
          {timeRange}
        </div>
      </header>
      <nav className="flex items-center gap-1 border-b border-border px-4 py-2">
        <button
          onClick={() => onLevelChange?.("all")}
          className={cn(
            "min-h-[44px] rounded px-2 py-1 text-xs font-medium transition-colors",
            activeLevel === "all"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </button>
        {levelFilters.map((l) => (
          <button
            key={l}
            onClick={() => onLevelChange?.(l)}
            className={cn(
              "min-h-[44px] rounded px-2 py-1 font-mono text-xs font-medium transition-colors",
              activeLevel === l ? "bg-muted" : "hover:bg-muted"
            )}
            style={{ color: LEVEL_COLORS[l] }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </nav>
      <section aria-label="Log entries" className="flex-1 overflow-y-auto p-4 font-mono text-xs">
        {children}
      </section>
    </main>
  )
}
export type { LogLevel, LogsPageProps }
