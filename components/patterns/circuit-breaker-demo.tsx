"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CircuitBreaker, CircuitOpenError, type CircuitState } from "@/lib/circuit-breaker"

const STATE_STYLES: Record<CircuitState, { bg: string; text: string; label: string }> = {
  closed: { bg: "bg-[var(--color-malachite)]/15", text: "text-[var(--color-malachite)]", label: "CLOSED" },
  open: { bg: "bg-destructive/15", text: "text-destructive", label: "OPEN" },
  half_open: { bg: "bg-[var(--color-gold)]/15", text: "text-[var(--color-gold)]", label: "HALF OPEN" },
}

interface LogEntry {
  type: "success" | "failure" | "rejected" | "transition"
  message: string
  timestamp: string
}

export function CircuitBreakerDemo() {
  const [state, setState] = useState<CircuitState>("closed")
  const [failures, setFailures] = useState(0)
  const [log, setLog] = useState<LogEntry[]>([])
  const [failMode, setFailMode] = useState(false)

  const breakerRef = useRef(
    new CircuitBreaker({
      name: "demo-provider",
      failureThreshold: 3,
      cooldownMs: 5000, // 5s for demo
      windowMs: 30000,
      timeoutMs: 2000,
      onStateChange: (from, to) => {
        addLog("transition", `Circuit: ${from} → ${to}`)
      },
    })
  )

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    const ts = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    setLog((prev) => [...prev.slice(-19), { type, message, timestamp: ts }])
  }, [])

  async function sendRequest() {
    const breaker = breakerRef.current
    try {
      await breaker.execute(async () => {
        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 100))
        if (failMode) {
          throw new Error("Simulated provider failure")
        }
        return { data: "ok" }
      })
      addLog("success", "Request succeeded")
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        addLog("rejected", "Request REJECTED — circuit is open")
      } else {
        addLog("failure", `Request failed: ${error instanceof Error ? error.message : "unknown"}`)
      }
    }

    setState(breaker.state)
    setFailures(breaker.failureCount)
  }

  function reset() {
    breakerRef.current.reset()
    setState("closed")
    setFailures(0)
    setLog([])
    setFailMode(false)
  }

  const style = STATE_STYLES[state]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      {/* State display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-lg px-3 py-1.5 font-mono text-sm font-bold", style.bg, style.text)}>
            {style.label}
          </div>
          <span className="text-xs text-muted-foreground">
            {failures}/3 failures in window
          </span>
        </div>
        <Badge variant={failMode ? "destructive" : "outline"}>
          {failMode ? "Fail mode ON" : "Normal mode"}
        </Badge>
      </div>

      {/* State machine diagram */}
      <div className="flex items-center justify-center gap-2 rounded-xl bg-secondary/30 p-4 text-xs">
        <span className={cn("rounded px-2 py-1 font-mono", state === "closed" ? "bg-[var(--color-malachite)]/20 text-[var(--color-malachite)]" : "text-muted-foreground")}>
          CLOSED
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={cn("rounded px-2 py-1 font-mono", state === "open" ? "bg-destructive/20 text-destructive" : "text-muted-foreground")}>
          OPEN
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={cn("rounded px-2 py-1 font-mono", state === "half_open" ? "bg-[var(--color-gold)]/20 text-[var(--color-gold)]" : "text-muted-foreground")}>
          HALF_OPEN
        </span>
        <span className="text-muted-foreground">→ CLOSED</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={sendRequest}>
          Send request
        </Button>
        <Button
          variant={failMode ? "destructive" : "outline"}
          size="sm"
          onClick={() => setFailMode(!failMode)}
        >
          {failMode ? "Disable failures" : "Enable failures"}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>

      {/* Log */}
      <div className="max-h-[240px] overflow-y-auto rounded-xl border border-border bg-[#141413] dark:bg-[#0A0A0A] p-3">
        {log.length === 0 ? (
          <p className="text-center text-xs text-[#9A9A95]">
            Enable failures, then send requests to see the circuit breaker in action.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 font-mono text-[11px]">
                <span className="shrink-0 text-[#9A9A95]">{entry.timestamp}</span>
                <span
                  className={cn(
                    entry.type === "success" && "text-[var(--color-malachite)]",
                    entry.type === "failure" && "text-destructive",
                    entry.type === "rejected" && "text-[var(--color-gold)]",
                    entry.type === "transition" && "text-[var(--color-cobalt)]"
                  )}
                >
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        The circuit opens after 3 failures, rejects all requests for 5 seconds,
        then enters HALF_OPEN to probe. A success closes it; a failure re-opens.
      </p>
    </div>
  )
}
