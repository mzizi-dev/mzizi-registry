/**
 * Linear-time checks that measure scaling, not wall-clock (owner decision, 2026-10-20).
 *
 * A fixed millisecond budget says more about the host than the parser: on a 4-core runner the
 * same staging commit took 2.2 to 4.0 s against a 3 s budget. What a "linear time" test means
 * is that doubling the input about doubles the time, and that a quadratic path (which
 * quadruples it) fails. So each check times the work at n, 2n and 4n, takes the median of
 * several rounds at each size, and asserts that a doubling costs at most `limit` (2.5x) on
 * average over the range. The order of the sizes rotates from round to round, so a slow patch
 * on a busy host lands on every size alike instead of on one.
 *
 * The only absolute number left is the hang guard (`ceilingMs`, 30 s by default): the whole
 * measurement, every round at every size, has to finish inside it.
 */

export interface ScalingOptions {
  /** The smallest size; the work is timed at `n * factor` for each factor. */
  n: number
  /** Sizes as multiples of `n`. Each must be twice the one before it. Default `[1, 2, 4]`. */
  factors?: readonly number[]
  /** Timed rounds at each size; the median is compared. Default 5. */
  runs?: number
  /** The most a doubling may cost on average over the range, as a multiple. Default 2.5. */
  limit?: number
  /** Repeat the work in one sample until a sample at `n` takes about this long. Default 15. */
  sampleMs?: number
  /** Timer and scheduling slack added to every allowance, in milliseconds. Default 1. */
  slackMs?: number
  /** Hang guard: the whole measurement must finish inside this. Default 30,000. */
  ceilingMs?: number
}

export interface Scaling {
  sizes: number[]
  /** Median milliseconds per sample at each size (a sample is `reps` runs). */
  medians: number[]
  /** `medians[i + 1] / medians[i]` for each doubling (reported, not asserted one by one). */
  ratios: number[]
  reps: number
  totalMs: number
  limit: number
  slackMs: number
  ceilingMs: number
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

/** Time `run(build(size))` at each size. Inputs are built once, outside the timing. */
export function measureScaling<T>(
  build: (size: number) => T,
  run: (input: T) => unknown,
  options: ScalingOptions,
): Scaling {
  const {
    n,
    factors = [1, 2, 4],
    runs = 5,
    limit = 2.5,
    sampleMs = 15,
    slackMs = 1,
    ceilingMs = 30_000,
  } = options
  for (let i = 1; i < factors.length; i++) {
    if (factors[i] !== factors[i - 1]! * 2) throw new Error("each factor must double the one before it")
  }
  const started = performance.now()
  const sizes = factors.map((f) => Math.round(n * f))
  const inputs = sizes.map(build)

  // The hang guard runs before every run, with that run's expected cost: a quadratic is
  // stopped before the run that would take it past the ceiling, not minutes after.
  const guard = (nextMs: number) => {
    if (performance.now() - started + nextMs > ceilingMs) {
      throw new Error(`hang guard: would still be measuring after ${ceilingMs} ms (sizes ${sizes.join(", ")})`)
    }
  }

  // Warm up every size once, smallest first (JIT, caches); each run is expected to cost up to 4x
  // the one before it. A sample is sized from the smallest.
  const warm: number[] = []
  for (let i = 0; i < inputs.length; i++) {
    guard(i ? 4 * warm[i - 1]! : 0)
    const t0 = performance.now()
    run(inputs[i]!)
    warm.push(performance.now() - t0)
  }
  const reps = Math.min(1_000, Math.max(1, Math.ceil(sampleMs / Math.max(warm[0]!, 0.01))))

  const samples: number[][] = sizes.map(() => [])
  for (let round = 0; round < runs; round++) {
    for (let k = 0; k < sizes.length; k++) {
      const i = (round + k) % sizes.length
      const t0 = performance.now()
      for (let r = 0; r < reps; r++) {
        guard(warm[i]!)
        run(inputs[i]!)
      }
      samples[i]!.push(performance.now() - t0)
    }
  }
  const medians = samples.map(median)
  const ratios = medians.slice(1).map((m, i) => m / Math.max(medians[i]!, Number.EPSILON))
  return { sizes, medians, ratios, reps, totalMs: performance.now() - started, limit, slackMs, ceilingMs }
}

const describeScaling = (s: Scaling): string =>
  s.sizes
    .map((size, i) => `n=${size}: ${s.medians[i]!.toFixed(1)} ms` + (i ? ` (x${s.ratios[i - 1]!.toFixed(2)})` : ""))
    .join(", ") + ` [${s.reps} run(s) per sample, limit x${s.limit}]`

/**
 * What is wrong with a measurement, as messages (empty when it scales linearly). The test is
 * the cost per doubling across the whole range, `(t(last) / t(first)) ** (1 / doublings)`, held
 * to `limit`: comparing the ends lets the noise in the middle sizes cancel, and a quadratic still
 * costs 4x per doubling (16x over n to 4n, against 6.25x allowed). Returned as strings rather
 * than asserted, so `expect(...).toEqual([])` prints the measured medians when it fails.
 */
export function scalingViolations(s: Scaling): string[] {
  const out: string[] = []
  const doublings = s.sizes.length - 1
  const first = s.medians[0]!
  const last = s.medians[doublings]!
  if (last > s.limit ** doublings * first + s.slackMs) {
    const perDoubling = (last / Math.max(first, Number.EPSILON)) ** (1 / doublings)
    out.push(`cost x${perDoubling.toFixed(2)} per doubling: ${describeScaling(s)}`)
  }
  if (s.totalMs > s.ceilingMs) out.push(`hang guard: took ${Math.round(s.totalMs)} ms (ceiling ${s.ceilingMs} ms)`)
  return out
}

/**
 * Measure, and measure again when a busy host made one look superlinear: up to `attempts`
 * (default 3) measurements, and the first clean one passes. A real quadratic fails every one.
 * Returns the violations of every attempt when none was clean:
 * `expect(linearViolations(...)).toEqual([])`.
 */
export function linearViolations<T>(
  build: (size: number) => T,
  run: (input: T) => unknown,
  options: ScalingOptions & { attempts?: number },
): string[] {
  const { attempts = 3, ...rest } = options
  const failures: string[] = []
  for (let a = 1; a <= attempts; a++) {
    const violations = scalingViolations(measureScaling(build, run, rest))
    if (violations.length === 0) return []
    failures.push(...violations.map((v) => `attempt ${a}: ${v}`))
    if (violations.some((v) => v.startsWith("hang guard"))) break
  }
  return failures
}
