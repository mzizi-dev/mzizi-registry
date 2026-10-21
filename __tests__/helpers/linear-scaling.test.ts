/**
 * The linear-scaling check itself: linear work passes, quadratic work fails on every attempt,
 * options that would pass anything are refused, and the budget stops a quadratic early and is
 * reported with the attempts before it. So the markdown-renderer "linear time" tests cannot
 * pass a quadratic parser.
 */
import { describe, expect, it } from "vitest"

import {
  checkFactors,
  linearViolations,
  SCALING_BUDGET_MS,
  SCALING_TIMEOUT_MS,
  scalingSink,
  scalingViolations,
  type Scaling,
} from "./linear-scaling"

// Pure work: its result goes to the helper's sink, so it cannot be dropped.
const linear = (n: number) => {
  let x = 0
  for (let i = 0; i < n * 400; i++) x = (x + i * 31) | 0
  return x
}
const quadratic = (n: number) => {
  let x = 0
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) x = (x + (i ^ j)) | 0
  return x
}

/** A measurement with the given medians at n=1000 and 4000: no timing involved. */
const scaling = (medians: number[], extra: Partial<Scaling> = {}): Scaling => ({
  sizes: [1_000, 4_000],
  medians,
  perDoubling: medians.length ? Math.sqrt(medians[1]! / medians[0]!) : NaN,
  reps: 1,
  limit: 2.5,
  slackMs: 1,
  ...extra,
})

describe("linear-scaling", () => {
  it("passes linear work", () => {
    expect(linearViolations((n) => n, linear, { n: 5_000 })).toEqual([])
    expect(typeof scalingSink()).toBe("number")
  }, SCALING_TIMEOUT_MS)

  it("fails quadratic work, on every attempt", () => {
    const violations = linearViolations((n) => n, quadratic, { n: 600 })
    expect(violations).toHaveLength(3)
    for (const v of violations) expect(v).toMatch(/^attempt \d: cost x\d+\.\d+ per doubling: n=600: /)
  }, SCALING_TIMEOUT_MS)

  it("judges a measurement by its cost per doubling over the range (no timing)", () => {
    // 4x the size: 6.25x the time is the most 2.5x per doubling allows, plus 1 ms of slack.
    expect(scalingViolations(scaling([10, 62]))).toEqual([])
    expect(scalingViolations(scaling([10, 63.5]))).toEqual([])
    expect(scalingViolations(scaling([10, 64]))).toEqual(["cost x2.53 per doubling: n=1000: 10.0 ms, n=4000: 64.0 ms [1 run(s) per sample, limit x2.5]"])
    expect(scalingViolations(scaling([10, 160]))[0]).toMatch(/^cost x4\.00 per doubling/)
  })

  it("never passes a measurement with nothing to compare, or one the budget stopped (no timing)", () => {
    expect(scalingViolations(scaling([]))).toEqual(["no measurement to compare: 0 median(s) for 2 size(s)"])
    expect(scalingViolations(scaling([10]))).toEqual(["no measurement to compare: 1 median(s) for 2 size(s)"])
    expect(scalingViolations(scaling([10, Number.NaN]))[0]).toMatch(/^no measurement/)
    expect(scalingViolations(scaling([], { hang: "hang guard: x" }))).toEqual(["hang guard: x"])
  })

  it("refuses factors that would pass anything", () => {
    expect(() => checkFactors([])).toThrow(/at least two/)
    expect(() => checkFactors([1])).toThrow(/at least two/)
    expect(() => checkFactors([1, 3])).toThrow(/double/)
    expect(() => checkFactors([1, 1])).toThrow(/double/)
    expect(() => checkFactors([4, 2])).toThrow(/double/)
    expect(() => checkFactors([0, 0])).toThrow(/positive/)
    expect(() => checkFactors([1, 2, 4])).not.toThrow()
    expect(() => checkFactors([1, 4])).not.toThrow()
    expect(() => linearViolations((n) => n, linear, { n: 10, factors: [1] })).toThrow(/at least two/)
  })

  it("stops a quadratic at the budget, before the run that would cross it, and reports every attempt", () => {
    const started = performance.now()
    // About 16M steps at n=4000, and 16x that predicted at 4n: far over a 50 ms budget.
    const violations = linearViolations((n) => n, quadratic, { n: 4_000, budgetMs: 50 })
    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatch(/^attempt 1: hang guard: the budget would run out warming up n=16000/)
    // One run at n and nothing at 4n: well under the 256M steps at 4n.
    expect(performance.now() - started).toBeLessThan(10_000)
  }, SCALING_TIMEOUT_MS)

  it("keeps the Vitest timeout above the budget, so the check reports before Vitest does", () => {
    expect(SCALING_TIMEOUT_MS).toBeGreaterThan(SCALING_BUDGET_MS)
  })
})
