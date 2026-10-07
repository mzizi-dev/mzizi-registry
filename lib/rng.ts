/**
 * Injected randomness for the Mzizi resilience node (N5) and the chaos engine (N8).
 *
 * No resilience core reads ambient randomness: retry jitter and chaos decisions draw from
 * a `Random` passed in. Tests, fixtures and chaos use `Mulberry32`, a small seeded
 * generator whose outputs are pinned in `__tests__/fixtures/resilience/prng.cases.json`
 * and reproduced bit for bit by the Rust build (`mzizi_resilience::rng::Mulberry32`).
 * Production jitter may use `mathRandom`, which is not seeded.
 *
 * Framework-free: usable from Astro, React, Workers and Node alike.
 *
 * Contract: contracts/lib/rng.contract.json
 * Install via: npx shadcn@latest add https://api.mzizi.dev/v1/ui/rng
 */

import { ResilienceConfigError } from "./resilience-core"

/** A source of uniformly distributed unsigned 32-bit integers. */
export interface Random {
  /** The next value, an integer in [0, 4294967295]. */
  nextU32(): number
}

/**
 * mulberry32, exactly as the resilience spec defines it:
 *
 * ```
 * state = (state + 0x6D2B79F5) mod 2^32
 * t = state
 * t = imul32(t ^ (t >>> 15), t | 1)
 * t = (t + imul32(t ^ (t >>> 7), t | 61)) ^ t
 * return (t ^ (t >>> 14)) >>> 0
 * ```
 *
 * @example
 * ```ts
 * import { Mulberry32 } from "./rng"
 *
 * const rng = new Mulberry32(42)
 * rng.nextU32() // the same sequence in every build, on every host
 * ```
 */
export class Mulberry32 implements Random {
  private state: number

  /** `seed` is taken modulo 2^32; it must be a finite integer. */
  constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new ResilienceConfigError("seed", `must be an integer, got ${String(seed)}`)
    }
    this.state = seed >>> 0
  }

  nextU32(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    return (t ^ (t >>> 14)) >>> 0
  }
}

/** A seeded generator; the same as `new Mulberry32(seed)`. */
export function mulberry32(seed: number): Mulberry32 {
  return new Mulberry32(seed)
}

/** Unseeded randomness from `Math.random`, for production jitter only (never in tests or chaos). */
export const mathRandom: Random = {
  nextU32: () => Math.floor(Math.random() * 4294967296) >>> 0,
}

/**
 * A probability `p` in [0, 1] as a u32 threshold: `floor(p * 2^32)`. A draw `u` hits when
 * `u < threshold`; `p = 1` always hits (see `hits`), so the threshold is never compared
 * against 2^32 itself.
 */
export function probabilityThreshold(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new ResilienceConfigError("probability", `must be a number in [0, 1], got ${String(p)}`)
  }
  return p === 1 ? 4294967295 : Math.floor(p * 4294967296)
}

/** Whether a draw `u` hits probability `p` (integer comparison; `p = 1` always hits). */
export function hits(u: number, p: number): boolean {
  return p === 1 || u < probabilityThreshold(p)
}
