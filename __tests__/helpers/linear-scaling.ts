/**
 * Linear-time checks that measure scaling, not wall-clock (owner decision, 2026-10-20).
 *
 * A fixed millisecond budget says more about the host than the parser: on a 4-core runner the
 * same staging commit took 2.2 to 4.0 s against a 3 s budget. What a "linear time" test means
 * is that doubling the input about doubles the time, and that a quadratic path (which
 * quadruples it) fails. So each check times the work at n and 4n (the default `factors`), takes
 * the median of several rounds at each size, and asserts that a doubling costs at most `limit`
 * (2.5x) on average over the range: `t(4n) <= 2.5^2 * t(n)`, where a quadratic costs 16x. The
 * order of the sizes rotates from round to round, so a slow patch on a busy host lands on every
 * size alike instead of on one.
 *
 * The only absolute number is the budget (`budgetMs`, 30 s by default) for the WHOLE check: every
 * attempt, every round, every size. It is checked before each sample with that sample's expected
 * cost, so a quadratic stops before the sample that would cross it, and the trip is reported
 * with every earlier attempt's measurement. A test that runs a check sets its Vitest timeout to
 * `SCALING_TIMEOUT_MS`, which sits above the budget, so the check reports first.
 *
 * `components/registry/n2-primitives/markdown-renderer.rs` carries the same check in Rust
 * (`linear_violations`); the two report the same way.
 */

export interface ScalingOptions {
  /** The smallest size; the work is timed at `n * factor` for each factor. */
  n: number
  /** Sizes as multiples of `n`: at least two, each a power-of-two multiple (2, 4, ...) of the one before. Default `[1, 4]`. */
  factors?: readonly number[]
  /** Timed rounds at each size; the median is compared. Default 5. */
  runs?: number
  /** The most a doubling may cost on average over the range, as a multiple. Default 2.5. */
  limit?: number
  /** Repeat the work in one sample until a sample at `n` takes about this long. Default 15. */
  sampleMs?: number
  /** Timer and scheduling slack added to the allowance, in milliseconds. Default 1. */
  slackMs?: number
  /** Measurements before the check fails; the first clean one passes. Default 3. */
  attempts?: number
  /** The budget for the whole check, every attempt included. Default 30,000. */
  budgetMs?: number
}

/** The default budget of one check. */
export const SCALING_BUDGET_MS = 30_000
/** The Vitest timeout for a test that runs ONE check: above the budget, so the check reports first. */
export const SCALING_TIMEOUT_MS = SCALING_BUDGET_MS + 15_000

export interface Scaling {
  sizes: number[]
  /** Median milliseconds per sample at each size (a sample is `reps` runs). */
  medians: number[]
  /** Cost per doubling over the whole range: `(medians[last] / medians[0]) ** (1 / doublings)`. */
  perDoubling: number
  reps: number
  limit: number
  slackMs: number
  /** Set when the budget ran out before the measurement finished. */
  hang?: string
}

/**
 * Every result is folded in here, so the optimiser cannot drop the work as dead code.
 * `scalingSink()` reads it; nothing else needs it.
 */
let sink = 0
const absorb = (r: unknown) => {
  sink ^= typeof r === "number" ? r | 0 : typeof r === "string" ? r.length : Array.isArray(r) ? r.length : r ? 1 : 0
}
export const scalingSink = () => sink

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

const isPowerOfTwo = (x: number) => Number.isInteger(x) && x >= 2 && (x & (x - 1)) === 0

/** Throws on options that would let any work pass: fewer than two sizes, or sizes that do not double. */
export function checkFactors(factors: readonly number[]): void {
  if (factors.length < 2) throw new Error("linear-scaling needs at least two factors")
  if (!(factors[0]! > 0)) throw new Error("linear-scaling factors must be positive")
  for (let i = 1; i < factors.length; i++) {
    if (!isPowerOfTwo(factors[i]! / factors[i - 1]!)) {
      throw new Error(`each factor must double the one before it (2x, 4x, ...): ${factors.join(", ")}`)
    }
  }
}

/**
 * Time `run` on each prebuilt input. `deadline` is the `performance.now()` the whole check must
 * finish by; the measurement stops (with `hang` set) before a sample that would cross it.
 */
export function measureScaling<T>(
  sizes: readonly number[],
  inputs: readonly T[],
  run: (input: T) => unknown,
  options: Omit<ScalingOptions, "n" | "factors" | "attempts" | "budgetMs"> & { deadline: number }
): Scaling {
  const { runs = 5, limit = 2.5, sampleMs = 15, slackMs = 1, deadline } = options
  if (runs < 1) throw new Error("linear-scaling needs at least one run per size")
  const doublings = Math.log2(sizes[sizes.length - 1]! / sizes[0]!)
  const result = (medians: number[], reps: number, hang?: string): Scaling => ({
    sizes: [...sizes],
    medians,
    perDoubling: medians.length ? (medians[medians.length - 1]! / Math.max(medians[0]!, Number.EPSILON)) ** (1 / doublings) : NaN,
    reps,
    limit,
    slackMs,
    ...(hang ? { hang } : {}),
  })
  const over = (nextMs: number) => performance.now() + nextMs > deadline
  const hang = (where: string) => `hang guard: the budget would run out ${where} (sizes ${sizes.join(", ")})`

  // Warm up every size once, smallest first (JIT, caches). A run is expected to cost up to the
  // square of the size ratio times the one before it, so a quadratic stops before its big run.
  const warm: number[] = []
  for (let i = 0; i < inputs.length; i++) {
    const ratio = i ? sizes[i]! / sizes[i - 1]! : 1
    if (over(i ? ratio * ratio * warm[i - 1]! : 0)) return result([], 0, hang(`warming up n=${sizes[i]}`))
    const t0 = performance.now()
    absorb(run(inputs[i]!))
    warm.push(performance.now() - t0)
  }
  const reps = Math.min(1_000, Math.max(1, Math.ceil(sampleMs / Math.max(warm[0]!, 0.01))))

  const samples: number[][] = sizes.map(() => [])
  for (let round = 0; round < runs; round++) {
    for (let k = 0; k < sizes.length; k++) {
      const i = (round + k) % sizes.length
      if (over(reps * warm[i]!)) return result([], reps, hang(`in round ${round + 1} at n=${sizes[i]}`))
      const t0 = performance.now()
      for (let r = 0; r < reps; r++) absorb(run(inputs[i]!))
      samples[i]!.push(performance.now() - t0)
    }
  }
  return result(samples.map(median), reps)
}

const describeScaling = (s: Scaling): string =>
  s.sizes.map((size, i) => `n=${size}: ${s.medians[i]!.toFixed(1)} ms`).join(", ") + ` [${s.reps} run(s) per sample, limit x${s.limit}]`

/**
 * What is wrong with a measurement, as messages (empty when it scales linearly). The test is
 * the cost per doubling across the whole range, held to `limit`; comparing the ends lets noise
 * in between cancel, and a quadratic still costs 4x per doubling. A measurement with no medians,
 * or one the budget stopped, is a violation, never a pass.
 */
export function scalingViolations(s: Scaling): string[] {
  if (s.hang) return [s.hang]
  if (s.medians.length < 2 || s.medians.length !== s.sizes.length || s.medians.some((m) => !Number.isFinite(m))) {
    return [`no measurement to compare: ${s.medians.length} median(s) for ${s.sizes.length} size(s)`]
  }
  const doublings = Math.log2(s.sizes[s.sizes.length - 1]! / s.sizes[0]!)
  const first = s.medians[0]!
  const last = s.medians[s.medians.length - 1]!
  return last > s.limit ** doublings * first + s.slackMs ? [`cost x${s.perDoubling.toFixed(2)} per doubling: ${describeScaling(s)}`] : []
}

/**
 * Build the inputs once, then measure, and measure again when a busy host made one look
 * superlinear: up to `attempts` measurements inside one `budgetMs`, and the first clean one
 * passes. A real quadratic fails every one. Returns every attempt's violations, a budget trip
 * included, when none was clean: `expect(linearViolations(...)).toEqual([])`.
 */
export function linearViolations<T>(build: (size: number) => T, run: (input: T) => unknown, options: ScalingOptions): string[] {
  const { n, factors = [1, 4], attempts = 3, budgetMs = SCALING_BUDGET_MS, ...rest } = options
  checkFactors(factors)
  const deadline = performance.now() + budgetMs
  const sizes = factors.map((f) => Math.round(n * f))
  const inputs = sizes.map((s) => build(s))
  const failures: string[] = []
  for (let a = 1; a <= attempts; a++) {
    const s = measureScaling(sizes, inputs, run, { ...rest, deadline })
    const violations = scalingViolations(s)
    if (violations.length === 0) return []
    failures.push(...violations.map((v) => `attempt ${a}: ${v}`))
    if (s.hang) break
  }
  return failures
}
