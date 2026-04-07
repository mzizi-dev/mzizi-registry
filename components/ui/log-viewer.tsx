"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
}

interface LogViewerProps extends React.ComponentProps<"div"> {
  entries: LogEntry[]
  maxHeight?: string
}

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-foreground",
  warn: "text-mineral-gold",
  error: "text-destructive",
  debug: "text-muted-foreground",
}

const LEVEL_BADGE_STYLES: Record<LogLevel, string> = {
  info: "bg-foreground/10 text-foreground",
  warn: "bg-mineral-gold/10 text-mineral-gold",
  error: "bg-destructive/10 text-destructive",
  debug: "bg-muted text-muted-foreground",
}

function LogViewer({ className, entries, maxHeight = "400px", ...props }: LogViewerProps) {
  const [filter, setFilter] = React.useState<LogLevel | "all">("all")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = React.useState(true)

  const filtered = React.useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.level === filter)),
    [entries, filter]
  )

  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }, [])

  const levels: Array<LogLevel | "all"> = ["all", "info", "warn", "error", "debug"]

  return (
    <div
      data-slot="log-viewer"
      className={cn("overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10", className)}
      {...props}
    >
      {/* Filter bar */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors",
              filter === level
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setFilter(level)}
          >
            {level}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>
      {/* Log output */}
      <div
        ref={scrollRef}
        className="overflow-auto font-mono text-xs"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {filtered.map((entry, index) => (
          <div
            key={index}
            className="flex items-start gap-2 px-3 py-1 transition-colors hover:bg-muted/30"
          >
            <span className="shrink-0 text-muted-foreground tabular-nums select-none">
              {entry.timestamp}
            </span>
            <span
              className={cn(
                "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                LEVEL_BADGE_STYLES[entry.level]
              )}
            >
              {entry.level}
            </span>
            <span className={cn("min-w-0 break-all", LEVEL_STYLES[entry.level])}>
              {entry.message}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-8 text-center font-sans text-sm text-muted-foreground">
            No log entries
          </p>
        )}
      </div>
    </div>
  )
}

export { LogViewer, type LogEntry, type LogLevel, type LogViewerProps }
