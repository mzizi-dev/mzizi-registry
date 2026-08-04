"use client"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI ALERT ENGINE — N8 assurance (a node on the engineering strand)
   SLO tracking + threshold alerting + escalation.
   ═══════════════════════════════════════════════════════════════ */

export type AlertSeverity = "info" | "warning" | "critical" | "page"
export type AlertState = "firing" | "pending" | "resolved"

export interface SLODefinition {
  id: string
  name: string
  /** Target percentage (e.g. 99.9) */
  target: number
  /** Window in hours (e.g. 720 = 30 days) */
  windowHours: number
  /** Which metric to track */
  metric: "availability" | "latency_p99" | "error_rate" | "success_rate"
  /** Which mini-apps this SLO covers */
  miniApps?: string[]
  /** Escalation: what severity at what burn rate */
  escalation: { burnRate: number; severity: AlertSeverity }[]
}

export interface Alert {
  id: string
  sloId?: string
  name: string
  severity: AlertSeverity
  state: AlertState
  message: string
  firedAt: string
  resolvedAt?: string
  /** Affected components from backlinks */
  affectedComponents: string[]
  /** Affected mini-apps */
  affectedMiniApps: string[]
  /** Who was notified */
  notified: string[]
  /** Link to runbook */
  runbookUrl?: string
}

export interface AlertEngineConfig {
  slos: SLODefinition[]
  /** How often to evaluate in ms */
  evaluationInterval?: number
  /** Channels: email, slack, sms, push */
  channels?: { type: string; target: string }[]
  onAlert?: (alert: Alert) => void
  onResolve?: (alert: Alert) => void
}

// N9 fundi integration: SLO breaches are reported to Fundi via GitHub issues
// import { getFundiReporter } from "@/lib/fundi/nyuchi-fundi-reporter"
// On SLO breach: getFundiReporter().report({ component: slo.name, severity, errorType: "slo", source: "alert-engine", ... })

class AlertEngineCore {
  private alerts = new Map<string, Alert>()
  private config: AlertEngineConfig
  private timer?: ReturnType<typeof setInterval>

  constructor(config: AlertEngineConfig) {
    this.config = config
  }

  start() {
    this.timer = setInterval(() => this.evaluate(), this.config.evaluationInterval ?? 60000)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
  }

  private evaluate() {
    // In production this would query metrics from nyuchi-perf-probe, nyuchi-rum, nyuchi-api-probe
    // and compare against SLO burn rates. Here we define the contract.
    for (const slo of this.config.slos) {
      // Placeholder: real implementation reads from metrics store
      const currentValue = 99.95 // Would come from aggregation
      const remaining = currentValue - slo.target
      const burnRate = remaining < 0 ? Math.abs(remaining) / (100 - slo.target) : 0

      for (const esc of slo.escalation) {
        if (burnRate >= esc.burnRate) {
          this.fire({
            sloId: slo.id,
            name: `SLO breach: ${slo.name}`,
            severity: esc.severity,
            message: `${slo.name} burn rate ${burnRate.toFixed(2)}x (threshold: ${esc.burnRate}x). Current: ${currentValue}%, target: ${slo.target}%`,
            affectedMiniApps: slo.miniApps || [],
          })
        }
      }
    }
  }

  fire(params: {
    sloId?: string
    name: string
    severity: AlertSeverity
    message: string
    affectedMiniApps: string[]
    affectedComponents?: string[]
  }) {
    const id = `alert-${Date.now()}`
    const alert: Alert = {
      id,
      sloId: params.sloId,
      name: params.name,
      severity: params.severity,
      state: "firing",
      message: params.message,
      firedAt: new Date().toISOString(),
      affectedComponents:
        params.affectedComponents ||
        (typeof document !== "undefined"
          ? Array.from(document.querySelectorAll("[data-portal]"))
              .map((el) => el.getAttribute("data-slot") || "")
              .filter(Boolean)
              .slice(0, 20)
          : []),
      affectedMiniApps: params.affectedMiniApps,
      notified: [],
      runbookUrl: params.sloId ? `https://mzizi.dev/runbooks/${params.sloId}` : undefined,
    }
    this.alerts.set(id, alert)
    this.config.onAlert?.(alert)
    return alert
  }

  resolve(id: string) {
    const alert = this.alerts.get(id)
    if (alert) {
      alert.state = "resolved"
      alert.resolvedAt = new Date().toISOString()
      this.config.onResolve?.(alert)
    }
  }

  getActive(): Alert[] {
    return [...this.alerts.values()].filter((a) => a.state === "firing")
  }
  getAll(): Alert[] {
    return [...this.alerts.values()]
  }
}

export function createAlertEngine(config: AlertEngineConfig): AlertEngineCore {
  return new AlertEngineCore(config)
}

export type { AlertEngineCore }
