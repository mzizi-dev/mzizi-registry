# mzizi-resilience

Mzizi **N5 (resilience)**: the shared core. "Failure in one part never breaks the whole."

Circuit breaker, retry backoff, bulkhead, token-bucket rate limiter, fallback chain and
deadline, each a **sans-IO state machine**: no clock, no timer, no thread, no random
number generator. The host passes the time in (milliseconds) and, where needed, a random
draw in `[0, 1)`. So the same code runs on Cloudflare Workers (`wasm32`), in containers
and on bare metal, and every behaviour is tested with a script rather than sleeps.

```rust
use mzizi_resilience::breaker::{Admission, Breaker, Config};

let mut breaker = Breaker::new(Config { failure_threshold: 3, window_ms: 60_000, cooldown_ms: 30_000 })?;
match breaker.acquire(now_ms) {
    Admission::Allowed(permit) => match call_dependency() {
        Ok(_) => breaker.success(permit),
        Err(e) if e.counts() => breaker.failure(now_ms, permit),
        Err(_) => breaker.release(permit), // the caller's fault, not the dependency's
    },
    Admission::Open { retry_after_ms } => { /* serve the fallback; Retry-After: retry_after_ms */ }
    Admission::ProbeInFlight => { /* serve the fallback */ }
}
# Ok::<(), mzizi_resilience::ConfigError>(())
```

## What it fixes from the TypeScript originals

The audit in mzizi-registry#472 found these in the TypeScript primitives; each is a test here.

- Half-open admits **exactly one** probe (it admitted unlimited).
- The circuit opens **on the failing call**, not on the next one.
- A late outcome from a call admitted before the circuit opened is **ignored**.
- What counts as a failure is the host's decision (`failure` vs `release`).
- Jitter **never exceeds** the cap; zero attempts and zero capacity are refused at
  construction instead of dividing by zero.
- The rate limiter's sustained rate is **exactly `limit` per window** (the burst is a
  one-time allowance), and `retry_after` counts the part of a token already refilled.
- A bulkhead queue-wait giving up (`abandon`) is not a rejection.
- A fallback chain's total failure carries **counts, not error text**, so it cannot move
  personal data into a log.

## Shared vectors

`__tests__/fixtures/resilience/*.json` are run by this crate (`tests/fixtures.rs`) and, as
the TypeScript and Python builds land (#472), by vitest and pytest, so all builds behave
the same.

## Status

Phase 1 of #472: the Rust core only. The TypeScript rewrite, the Astro shells for the 14
N5 UI components, the Python build and the registry entries follow in their own changes.
