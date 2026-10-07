/**
 * Fallback chain for the Mzizi resilience node (N5): try stages in order and return the
 * first success.
 *
 * Each stage may carry its own timeout. `withFallbackResult` reports which stage served
 * (`{ value, stage, index }`), which is what tells a health monitor "degraded"; `withFallback`
 * returns the bare value. When every stage fails, `AllStagesFailedError` (code
 * `all-stages-failed`) lists each stage with its error CODE, never its message, so the
 * error is safe to log.
 *
 * The production shape this came from (mukoko-weather): cache → primary provider →
 * secondary provider → seasonal estimate.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike. The Rust build is
 * `mzizi_resilience::fallback_chain`.
 *
 * Contract: contracts/lib/fallback-chain.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/fallback-chain
 */

import { abortReason, checkName, emit, errorCode, ResilienceConfigError, type OnResilienceEvent, type Sleep } from "./resilience-core"
import { withTimeout } from "./timeout"

export interface FallbackStage<T> {
  /** A name for results and events, e.g. `cache` or `open-meteo`. */
  name: string
  /** The operation. It receives a signal that aborts at the stage's timeout. */
  execute: (signal?: AbortSignal) => Promise<T>
  /** A per-stage timeout in ms (default: none). */
  timeoutMs?: number
}

export interface FallbackOptions {
  /** The timer for stage timeouts (default `setTimeout`). */
  sleep?: Sleep
  /** Aborts the stage in flight. */
  signal?: AbortSignal
  /** Optional event hook (`stage-failed`, `served`). */
  onEvent?: OnResilienceEvent
}

/** Which stage served, and its value. */
export interface FallbackResult<T> {
  value: T
  stage: string
  index: number
}

/** One stage's failure: its name and its error code. */
export interface StageError {
  stage: string
  code: string
}

/** Every stage failed. */
export class AllStagesFailedError extends Error {
  readonly code = "all-stages-failed" as const
  readonly stageErrors: StageError[]

  constructor(stageErrors: StageError[]) {
    super(`All fallback stages failed: ${stageErrors.map((s) => `${s.stage} (${s.code})`).join(" → ")}`)
    this.name = "AllStagesFailedError"
    this.stageErrors = stageErrors
  }
}

/**
 * Run the stages in order; resolve with the first success and the stage that served it.
 *
 * @example
 * ```ts
 * import { withFallbackResult } from "./fallback-chain"
 *
 * const { value, stage } = await withFallbackResult([
 *   { name: "cache", execute: () => cached(slug), timeoutMs: 2000 },
 *   { name: "primary", execute: (signal) => fetchPrimary(slug, signal), timeoutMs: 5000 },
 *   { name: "estimate", execute: () => seasonalEstimate(slug) },
 * ])
 * ```
 */
export async function withFallbackResult<T>(stages: FallbackStage<T>[], options?: FallbackOptions): Promise<FallbackResult<T>> {
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new ResilienceConfigError("stages", "must hold at least one stage")
  }
  for (const s of stages) checkName("stage.name", s?.name)

  const errors: StageError[] = []
  for (let index = 0; index < stages.length; index++) {
    const stage = stages[index] as FallbackStage<T>
    try {
      const value =
        stage.timeoutMs !== undefined
          ? await withTimeout((signal) => stage.execute(signal), stage.timeoutMs, {
              label: stage.name,
              sleep: options?.sleep,
              signal: options?.signal,
            })
          : await stage.execute(options?.signal)
      emit(options?.onEvent, { module: "fallback-chain", type: "served", name: stage.name, data: { index } })
      return { value, stage: stage.name, index }
    } catch (error) {
      // The caller gave up: stop here rather than run the next stage for nobody.
      if (options?.signal?.aborted) throw abortReason(options.signal)
      const code = errorCode(error)
      errors.push({ stage: stage.name, code })
      emit(options?.onEvent, { module: "fallback-chain", type: "stage-failed", name: stage.name, data: { index, code } })
    }
  }
  throw new AllStagesFailedError(errors)
}

/** Run the stages in order; resolve with the first success's value. */
export async function withFallback<T>(stages: FallbackStage<T>[], options?: FallbackOptions): Promise<T> {
  return (await withFallbackResult(stages, options)).value
}
