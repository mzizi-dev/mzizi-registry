"use client"
import * as React from "react"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI FUNDI — N9 self-healing intelligence (a rung)
   Swahili: fixer, mechanic, technician

   N8 assurance observes and finds problems; N9 fundi receives those
   observations and acts on them. Two rungs, one loop: observe, then heal.

   Was written against the axis model — "the 3D architecture", "the depth
   dimension", "Z-observe", "Z-act". That model is retired. Nodes sit on two
   backbones held by cross-cutting rungs; there are no axes and no X/Y/Z, so
   absence is the correct state for anything axis-shaped rather than a
   relabelling of it.
   ═══════════════════════════════════════════════════════════════ */

// ── Remediation Actions ─────────────────────────────────────────

// ARCHITECTURE NOTE: This client-side decision engine works in two contexts:
// 1. CLIENT-SIDE: FundiProvider wraps the app, catches errors, creates healing plans in-memory
// 2. SERVER-SIDE: fundi-webhook edge function receives GitHub issues, runs the same
//    decision logic, writes to fundi_issues table, comments on GitHub
// The client-side and server-side share the same healing plan logic.
// GitHub issues are the source of truth — the human-in-the-loop interface.

export type RemediationAction =
  | { type: "circuit-break"; service: string; durationMs: number }
  | { type: "fallback-switch"; from: string; to: string }
  | { type: "cache-clear"; scope: "local" | "edge" | "all" }
  | { type: "reroute"; fromNode: string; toNode: string }
  | { type: "retry-with-backoff"; service: string; maxRetries: number }
  | { type: "degrade-feature"; feature: string; level: "partial" | "static" | "disabled" }
  | { type: "scale-request"; direction: "up" | "down"; resource: string }
  | { type: "escalate"; severity: "low" | "medium" | "high" | "critical"; message: string }

// ── Healing Decision Engine ─────────────────────────────────────

export interface DiagnosticInput {
  blastRadius: "isolated" | "partial" | "systemic"
  failedComponent: string
  failedNode: number
  errorType: "render" | "network" | "data" | "auth" | "chain" | "crypto" | "timeout"
  errorCount: number
  timeSinceFirstError: number
  probeResults: { target: string; status: "healthy" | "degraded" | "error" | "timeout" }[]
}

export interface HealingPlan {
  id: string
  timestamp: string
  diagnostic: DiagnosticInput
  actions: RemediationAction[]
  confidence: number
  reasoning: string
  requiresHumanApproval: boolean
}

/**
 * The fundi decision engine. Takes a diagnostic report from N8 assurance
 * and produces a healing plan with remediation actions.
 *
 * Decision tree:
 * 1. Isolated + render error → retry + cache-clear
 * 2. Isolated + network error → circuit-break + fallback-switch
 * 3. Partial blast radius → degrade affected features + reroute
 * 4. Systemic → escalate to human + emergency degradation
 * 5. Chain/crypto errors → fallback to classical + notify
 * 6. Repeated errors (>3 in 60s) → circuit-break
 */
export function createHealingPlan(input: DiagnosticInput): HealingPlan {
  const actions: RemediationAction[] = []
  let confidence = 0.8
  let reasoning = ""
  let requiresHumanApproval = false

  // Rule 1: Repeated errors → circuit-break
  if (input.errorCount > 3 && input.timeSinceFirstError < 60000) {
    actions.push({ type: "circuit-break", service: input.failedComponent, durationMs: 30000 })
    reasoning += "Repeated failures detected — circuit-breaking to prevent cascade. "
  }

  // Rule 2: Blast radius determines severity of response
  if (input.blastRadius === "systemic") {
    actions.push({ type: "degrade-feature", feature: "non-critical", level: "disabled" })
    actions.push({
      type: "escalate",
      severity: "critical",
      message: `Systemic failure: ${input.failedComponent} on N${input.failedNode}. ${input.errorCount} errors in ${Math.round(input.timeSinceFirstError / 1000)}s.`,
    })
    confidence = 0.6
    reasoning += "Systemic outage — disabling non-critical features, escalating to ops. "
    requiresHumanApproval = true
  } else if (input.blastRadius === "partial") {
    const healthyNodes = input.probeResults.filter((p) => p.status === "healthy")
    if (healthyNodes.length > 0) {
      actions.push({
        type: "reroute",
        fromNode: input.failedComponent,
        toNode: healthyNodes[0].target,
      })
      reasoning += `Partial failure — rerouting to healthy node: ${healthyNodes[0].target}. `
    }
    actions.push({ type: "degrade-feature", feature: input.failedComponent, level: "partial" })
    reasoning += "Degrading affected feature to partial mode. "
  } else {
    // Isolated failure
    if (input.errorType === "network" || input.errorType === "timeout") {
      actions.push({ type: "retry-with-backoff", service: input.failedComponent, maxRetries: 3 })
      actions.push({ type: "fallback-switch", from: "cloud", to: "edge" })
      reasoning += "Isolated network issue — retrying with backoff, switching to edge. "
    } else if (input.errorType === "data" || input.errorType === "render") {
      actions.push({ type: "cache-clear", scope: "local" })
      actions.push({ type: "retry-with-backoff", service: input.failedComponent, maxRetries: 2 })
      reasoning += "Isolated data/render error — clearing local cache and retrying. "
    } else if (input.errorType === "chain" || input.errorType === "crypto") {
      actions.push({ type: "fallback-switch", from: "web3", to: "web2" })
      actions.push({ type: "degrade-feature", feature: input.failedComponent, level: "partial" })
      reasoning += "Chain/crypto failure — falling back to Web2 path. "
      confidence = 0.7
    } else if (input.errorType === "auth") {
      actions.push({
        type: "escalate",
        severity: "high",
        message: `Auth failure in ${input.failedComponent}`,
      })
      reasoning += "Auth error — escalating (never auto-fix auth). "
      requiresHumanApproval = true
    }
  }

  return {
    id: `fundi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    diagnostic: input,
    actions,
    confidence,
    reasoning: reasoning.trim(),
    requiresHumanApproval,
  }
}

// ── Healing Executor ────────────────────────────────────────────

export interface HealingResult {
  planId: string
  actionsExecuted: number
  actionsFailed: number
  results: { action: RemediationAction; success: boolean; error?: string }[]
  healedAt: string
}

/**
 * An executor per remediation action, keyed by the action's own `type`. Mapped
 * over the union rather than `Record<type, (a: any) => …>` so a `cache-clear`
 * executor is handed a `cache-clear` action and nothing else — with `any` every
 * executor silently accepted every action shape.
 */
export type RemediationExecutors = {
  [K in RemediationAction["type"]]?: (
    action: Extract<RemediationAction, { type: K }>
  ) => Promise<boolean>
}

/**
 * Execute a healing plan. Each action is attempted in order.
 * Failed actions don't block subsequent actions.
 * Returns a structured result for logging and learning.
 */
export async function executeHealingPlan(
  plan: HealingPlan,
  executors: RemediationExecutors
): Promise<HealingResult> {
  const results: HealingResult["results"] = []

  for (const action of plan.actions) {
    // TypeScript cannot correlate `action.type` with the executor it just
    // selected, so the union has to be widened back here. Sound by
    // construction: the key that chose the executor came off this action.
    const executor = executors[action.type] as
      ((a: RemediationAction) => Promise<boolean>) | undefined
    if (!executor) {
      results.push({ action, success: false, error: "No executor registered" })
      continue
    }
    try {
      const success = await executor(action)
      results.push({ action, success })
    } catch (e) {
      results.push({ action, success: false, error: (e as Error).message })
    }
  }

  const result: HealingResult = {
    planId: plan.id,
    actionsExecuted: results.filter((r) => r.success).length,
    actionsFailed: results.filter((r) => !r.success).length,
    results,
    healedAt: new Date().toISOString(),
  }

  /*
   * fundi's log IS its artifact: the healing record a human reads before
   * deciding whether to keep the change. Downgrading it to console.warn would
   * misreport a success as a problem, so the rule is waived here rather than
   * the message being made dishonest.
   */
  // eslint-disable-next-line no-console
  console.info(
    `[nyuchi:fundi] Healing complete: ${result.actionsExecuted}/${plan.actions.length} actions succeeded`,
    JSON.stringify(result, null, 2)
  )
  return result
}

// ── React Integration ───────────────────────────────────────────

interface FundiContextValue {
  lastPlan: HealingPlan | null
  lastResult: HealingResult | null
  isHealing: boolean
  heal: (diagnostic: DiagnosticInput) => Promise<HealingResult | null>
}

const FundiContext = React.createContext<FundiContextValue>({
  lastPlan: null,
  lastResult: null,
  isHealing: false,
  heal: async () => null,
})

export function FundiProvider({
  executors,
  autoHeal = true,
  onPlanCreated,
  onHealComplete,
  children,
}: {
  executors: RemediationExecutors
  autoHeal?: boolean
  onPlanCreated?: (plan: HealingPlan) => void
  onHealComplete?: (result: HealingResult) => void
  children: React.ReactNode
}) {
  const [lastPlan, setLastPlan] = React.useState<HealingPlan | null>(null)
  const [lastResult, setLastResult] = React.useState<HealingResult | null>(null)
  const [isHealing, setIsHealing] = React.useState(false)

  const heal = React.useCallback(
    async (diagnostic: DiagnosticInput): Promise<HealingResult | null> => {
      const plan = createHealingPlan(diagnostic)
      setLastPlan(plan)
      onPlanCreated?.(plan)
      // See the note in executeHealingPlan — the log is the artifact.
      // eslint-disable-next-line no-console
      console.info(`[nyuchi:fundi] Healing plan created: ${plan.reasoning}`)

      if (plan.requiresHumanApproval && !autoHeal) {
        console.warn("[nyuchi:fundi] Plan requires human approval — waiting")
        return null
      }

      setIsHealing(true)
      try {
        const result = await executeHealingPlan(plan, executors)
        setLastResult(result)
        onHealComplete?.(result)
        return result
      } finally {
        setIsHealing(false)
      }
    },
    [executors, autoHeal, onPlanCreated, onHealComplete]
  )

  const value = React.useMemo(
    () => ({ lastPlan, lastResult, isHealing, heal }),
    [lastPlan, lastResult, isHealing, heal]
  )
  return <FundiContext.Provider value={value}>{children}</FundiContext.Provider>
}

export function useFundi(): FundiContextValue {
  return React.useContext(FundiContext)
}

// `DiagnosticInput`, `HealingPlan` and `HealingResult` are already exported at
// their declarations; re-listing them here was a TS2484 conflict, so this file
// did not compile in any consumer that installed it. `FundiContextValue` is
// declared without `export`, so this line is its only export and has to stay.
export type { FundiContextValue }
