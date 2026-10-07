# mzizi-resilience

Mzizi N5 resilience for Rust: timeout, retry, circuit breaker, rate limiter, bulkhead and
fallback chain, composed into one pipeline with a health monitor and a chaos fault hook.

- **Sans-IO cores.** Each primitive's state machine takes the time in integer milliseconds
  and does no I/O, so it is trivially testable and identical across hosts.
- **Runtime-generic async wrappers.** The wrappers take a `Runtime` (a clock and a sleep).
  No dependencies by default; builds for `wasm32-unknown-unknown` (Cloudflare Workers:
  implement `Runtime` with `worker::Delay`). The `tokio` feature adds `TokioRuntime`.
- **One behaviour in every build.** The same contracts (`contracts/lib/*.contract.json`)
  and the same JSON fixtures hold this crate and the framework-free TypeScript build
  (`components/registry/n5-resilience/*.ts`) to identical results. `Mulberry32` reproduces
  the TypeScript generator bit for bit.
- **Codes, not messages.** Health reports and fallback errors carry error codes only: no
  personal data leaves through this node.

The composition order, outermost first:

```text
FallbackChain( Retry( CircuitBreaker( RateLimiter( Timeout( Bulkhead( Fault( operation )))))))
```

Per-provider configuration is a pattern, not a preset list: give each dependency its own
breaker (mukoko-weather's: Tomorrow.io 3 failures in 5 minutes opens for 2 minutes;
Open-Meteo 5 in 5 minutes opens for 5 minutes).

Source: `components/registry/n5-resilience/` in
[mzizi-dev/mzizi-registry](https://github.com/mzizi-dev/mzizi-registry); the files in
`src/generated/` are copies written by `pnpm rust:generate`. Licensed Apache-2.0.
