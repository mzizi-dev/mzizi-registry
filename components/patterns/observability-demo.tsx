"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { log, createLogger, measure, trackError } from "@/lib/observability"

interface LogEntry {
  level: "debug" | "info" | "warn" | "error"
  message: string
  timestamp: string
}

const LEVEL_STYLES: Record<string, string> = {
  debug: "text-muted-foreground",
  info: "text-[var(--color-cobalt)]",
  warn: "text-[var(--color-gold)]",
  error: "text-destructive",
}

const LEVEL_BADGES: Record<string, string> = {
  debug: "secondary",
  info: "outline",
  warn: "outline",
  error: "destructive",
}

export function ObservabilityDemo() {
  const [entries, setEntries] = useState<LogEntry[]>([])

  function addEntry(level: LogEntry["level"], message: string) {
    setEntries((prev) => [
      ...prev,
      {
        level,
        message,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
    ])
  }

  function handleBasicLog() {
    log.info("User clicked the log button", {
      module: "demo",
      data: { action: "click", target: "basic-log" },
    })
    addEntry("info", '[mukoko:demo] INFO User clicked the log button { action: "click" }')
  }

  function handleScopedLogger() {
    const logger = createLogger("weather")
    logger.info("Forecast loaded", {
      data: { location: "Harare", temp: 28 },
    })
    logger.warn("Cache miss — fetching from API", {
      data: { location: "Bulawayo" },
    })
    addEntry("info", '[mukoko:weather] INFO Forecast loaded { location: "Harare", temp: 28 }')
    addEntry("warn", '[mukoko:weather] WARN Cache miss — fetching from API { location: "Bulawayo" }')
  }

  async function handleMeasure() {
    addEntry("info", "[mukoko:perf] INFO Measuring simulated API call...")
    const result = await measure(
      "simulated-api-call",
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 350))
        return { data: "success" }
      },
      { module: "demo" }
    )
    const duration = Math.round(Math.random() * 350 + 150)
    addEntry("info", `[mukoko:demo] INFO simulated-api-call completed in ~${duration}ms`)
    return result
  }

  function handleTrackError() {
    try {
      throw new Error("Failed to parse weather data")
    } catch (error) {
      trackError(error, {
        module: "weather",
        data: { endpoint: "/api/forecast", statusCode: 500 },
      })
      addEntry(
        "error",
        '[mukoko:weather] ERROR Failed to parse weather data { endpoint: "/api/forecast", statusCode: 500 }'
      )
    }
  }

  function handleClear() {
    setEntries([])
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleBasicLog}>
          log.info()
        </Button>
        <Button variant="outline" size="sm" onClick={handleScopedLogger}>
          createLogger()
        </Button>
        <Button variant="outline" size="sm" onClick={handleMeasure}>
          measure()
        </Button>
        <Button variant="destructive" size="sm" onClick={handleTrackError}>
          trackError()
        </Button>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      <div className="min-h-[200px] overflow-hidden rounded-xl border border-border bg-[#141413] dark:bg-[#0A0A0A]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
          <span className="font-mono text-xs text-[#9A9A95]">console output</span>
          <Badge variant="secondary" className="bg-white/10 text-[#9A9A95]">
            {entries.length} entries
          </Badge>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-4">
          {entries.length === 0 ? (
            <p className="text-center text-xs text-[#9A9A95]">
              Click a button above to see log output. Also check your browser
              console (F12).
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {entries.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="shrink-0 font-mono text-[11px] text-[#9A9A95]">
                    {entry.timestamp}
                  </span>
                  <span
                    className={`font-mono text-[12px] leading-relaxed ${LEVEL_STYLES[entry.level]}`}
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        These buttons call the actual observability functions — open your browser
        console (F12) to see the real output alongside the preview above.
      </p>
    </div>
  )
}
