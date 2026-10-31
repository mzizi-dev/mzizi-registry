# mzizi-chaos-engine

Mzizi **N8 (assurance)**: a seeded, deterministic fault schedule for chaos tests.

It decides which fault the next call gets: nothing, a delay, a 5xx, no answer, or a
refused connection. The host injects it. So it is sans-IO, has no dependencies and runs
unchanged on Workers (`wasm32`), in containers and on bare metal. It exercises the
`mzizi-resilience` (N5) paths before a release instead of an outage doing it.

```rust
use mzizi_chaos_engine::{Engine, Fault, Plan};

let plan = Plan { seed: 42, error_rate: 0.2, latency_rate: 0.2, latency_min_ms: 100, latency_max_ms: 900, ..Plan::default() };
let mut chaos = Engine::new(plan, &std::env::var("ENVIRONMENT").unwrap_or_default())?; // refuses production
match chaos.next_fault() {
    Fault::Latency { ms } => { /* sleep ms, then call */ }
    Fault::Error { status } => { /* return that 5xx */ }
    Fault::Timeout | Fault::Unreachable => { /* never answer / refuse */ }
    Fault::None => { /* call normally */ }
}
# Ok::<(), mzizi_chaos_engine::ChaosError>(())
```

## Rules

- **Deterministic.** Same plan, same faults, in every build. SplitMix64; a draw is its top 53
  bits over 2^53. `__tests__/fixtures/chaos/seeded.json` was produced by an independent Python
  implementation and the Rust build matches it, so a failing chaos run replays from its seed.
- **Never in production.** An empty, unknown or production environment is refused; there is no
  flag to override it.
- **Validated.** Bad rates, a backwards latency range and a bad status list are refused at
  construction.

## Status

The contract is `contracts/lib/chaos-engine.contract.json`. TypeScript and Python builds, the
registry entry and the `mzizi chaos run` command (mzizi-dev/agent-tools#285) follow under
mzizi-registry#472.
