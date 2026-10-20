/**
 * The linear-scaling check itself: linear work passes, and quadratic work fails on every
 * attempt, so the markdown-renderer "linear time" tests cannot pass a quadratic parser.
 */
import { describe, expect, it } from "vitest"

import { linearViolations, measureScaling, scalingViolations } from "./linear-scaling"

// Work the optimiser cannot drop: the result is returned and checked.
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

describe("linear-scaling", () => {
  it("passes linear work", () => {
    expect(linearViolations((n) => n, linear, { n: 5_000 })).toEqual([])
  }, 30_000)

  it("fails quadratic work, on every attempt", () => {
    const violations = linearViolations((n) => n, quadratic, { n: 600 })
    expect(violations).toHaveLength(3)
    for (const v of violations) expect(v).toMatch(/^attempt \d: cost x\d+\.\d+ per doubling: n=600: /)
  }, 30_000)

  it("measures the median at each size, every size twice the one before", () => {
    const s = measureScaling((n) => n, linear, { n: 1_000, factors: [1, 2, 4, 8], runs: 3 })
    expect(s.sizes).toEqual([1_000, 2_000, 4_000, 8_000])
    expect(s.medians).toHaveLength(4)
    expect(s.ratios).toHaveLength(3)
    expect(() => measureScaling((n) => n, linear, { n: 1, factors: [1, 3] })).toThrow(/double/)
  }, 30_000)

  it("stops a quadratic at the hang guard before the run that would cross it", () => {
    const started = performance.now()
    expect(() => measureScaling((n) => n, quadratic, { n: 2_000, ceilingMs: 50 })).toThrow(/^hang guard/)
    // One run at n (about 4M steps) and nothing at 2n or 4n: well under the 64M steps at 4n.
    expect(performance.now() - started).toBeLessThan(10_000)
  }, 30_000)

  it("reports a measurement over the hang guard", () => {
    const s = { ...measureScaling((n) => n, linear, { n: 1_000 }), totalMs: 31_000 }
    expect(scalingViolations(s)).toEqual(["hang guard: took 31000 ms (ceiling 30000 ms)"])
  })
})
