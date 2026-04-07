"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { withChaos, ChaosError } from "@/lib/chaos"
import { CircuitBreaker, CircuitOpenError, type CircuitState } from "@/lib/circuit-breaker"

interface LogEntry {
  type: "success" | "chaos_error" | "circuit_open" | "latency" | "info"
  message: string
  timestamp: string
}

export function ChaosDemo() {
  const [errorRate, setErrorRate] = useState(0.3)
  const [latencyMin, setLatencyMin] = useState(100)
  const [latencyMax, setLatencyMax] = useState(500)
  const [log, setLog] = useState<LogEntry[]>([])
  const [circuitState, setCircuitState] = useState<CircuitState>("closed")
  const [running, setRunning] = useState(false)

  const breakerRef = useRef(
    new CircuitBreaker({
      name: "chaos-demo",
      failureThreshold: 3,
      cooldownMs: 5000,
      windowMs: 30000,
      timeoutMs: 3000,
      onStateChange: (_from, to) => setCircuitState(to),
    })
  )

  function addLog(type: LogEntry["type"], message: string) {
    const ts = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    setLog((prev) => [...prev.slice(-29), { type, message, timestamp: ts }])
  }

  async function sendSingleRequest() {
    const breaker = breakerRef.current
    const start = Date.now()

    try {
      await breaker.execute(() =>
        withChaos(
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 50))
            return { data: "ok" }
          },
          {
            enabled: true,
            errorRate,
            latencyMs: [latencyMin, latencyMax],
          }
        )
      )
      const elapsed = Date.now() - start
      addLog("success", `Request succeeded (${elapsed}ms)`)
    } catch (error) {
      if (error instanceof CircuitOpenError) {
        addLog("circuit_open", "REJECTED — circuit breaker is open")
      } else if (error instanceof ChaosError) {
        addLog("chaos_error", `Chaos injected: ${error.message}`)
      } else {
        addLog("chaos_error", `Error: ${error instanceof Error ? error.message : "unknown"}`)
      }
    }

    setCircuitState(breaker.state)
  }

  async function runBurst() {
    setRunning(true)
    addLog("info", "Starting burst of 10 requests...")
    for (let i = 0; i < 10; i++) {
      await sendSingleRequest()
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    addLog("info", "Burst complete")
    setRunning(false)
  }

  function reset() {
    breakerRef.current.reset()
    setCircuitState("closed")
    setLog([])
  }

  const stateColors: Record<CircuitState, string> = {
    closed: "text-[var(--color-malachite)]",
    open: "text-destructive",
    half_open: "text-[var(--color-gold)]",
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
      {/* Circuit state */}
      <div className="flex items-center gap-3">
        <span className={cn("font-mono text-sm font-bold", stateColors[circuitState])}>
          Circuit: {circuitState.toUpperCase()}
        </span>
        <Badge variant="outline">Error rate: {Math.round(errorRate * 100)}%</Badge>
        <Badge variant="outline">
          Latency: {latencyMin}-{latencyMax}ms
        </Badge>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-xl bg-secondary/30 p-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Error rate: {Math.round(errorRate * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={errorRate * 100}
            onChange={(e) => setErrorRate(Number(e.target.value) / 100)}
            className="w-full accent-[var(--color-tanzanite)]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Min latency: {latencyMin}ms
            </label>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={latencyMin}
              onChange={(e) => setLatencyMin(Number(e.target.value))}
              className="w-full accent-[var(--color-gold)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Max latency: {latencyMax}ms
            </label>
            <input
              type="range"
              min="0"
              max="3000"
              step="50"
              value={latencyMax}
              onChange={(e) => setLatencyMax(Number(e.target.value))}
              className="w-full accent-[var(--color-gold)]"
            />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={sendSingleRequest} disabled={running}>
          Send request
        </Button>
        <Button variant="destructive" size="sm" onClick={runBurst} disabled={running}>
          {running ? "Running..." : "Burst (10 requests)"}
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          Reset
        </Button>
      </div>

      {/* Log */}
      <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border bg-[#141413] p-3 dark:bg-[#0A0A0A]">
        {log.length === 0 ? (
          <p className="text-center text-xs text-[#9A9A95]">
            Adjust chaos parameters and send requests to see resilience in action. The circuit
            breaker will open after 3 chaos-injected failures.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 font-mono text-[11px]">
                <span className="shrink-0 text-[#9A9A95]">{entry.timestamp}</span>
                <span
                  className={cn(
                    entry.type === "success" && "text-[var(--color-malachite)]",
                    entry.type === "chaos_error" && "text-destructive",
                    entry.type === "circuit_open" && "text-[var(--color-gold)]",
                    entry.type === "latency" && "text-[var(--color-cobalt)]",
                    entry.type === "info" && "text-[#9A9A95]"
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
        Chaos injection + circuit breaker working together. Crank up the error rate to see the
        circuit open, then watch it recover through HALF_OPEN after 5 seconds.
      </p>
    </div>
  )
}
