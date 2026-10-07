//! Mzizi resilience (N5) for Rust: timeout, retry, circuit breaker, rate limiter, bulkhead
//! and fallback chain, composed into one pipeline with a health monitor and the fault hook
//! the N8 chaos engine plugs into.
//!
//! # Where the components are
//!
//! Not authored in this crate. Each module is a file under
//! `components/registry/n5-resilience/<name>.rs`, beside the framework-free `<name>.ts` that
//! implements the same contract (`contracts/lib/<name>.contract.json`) for JavaScript hosts.
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate` and
//! checked by `pnpm rust:generate:check`. Edit the registry file; the copy is overwritten.
//!
//! # Sans-IO cores, runtime-generic wrappers
//!
//! Every primitive has a core that takes `now` (integer ms) and does no I/O:
//! [`circuit_breaker::CircuitBreakerCore`], [`rate_limiter::RateLimiterCore`],
//! [`bulkhead::BulkheadCore`], [`retry::retry_delay`], [`timeout::timeout_outcome`]. The
//! async wrappers are generic over [`resilience_core::Runtime`] (a clock and a sleep), so the
//! crate has no dependencies by default and builds for `wasm32-unknown-unknown`. The `tokio`
//! feature adds [`resilience_core::Runtime`] for tokio; on Cloudflare Workers, implement it
//! with `worker::Delay`.
//!
//! # One behaviour in every build
//!
//! The shared fixtures in `__tests__/fixtures/resilience/` are run by this crate's
//! `tests/fixtures.rs` and by the TypeScript suite; both must produce identical results.
//! Randomness is injected ([`rng::Random`]); [`rng::Mulberry32`] reproduces the TypeScript
//! generator bit for bit.
//!
//! ```
//! use mzizi_resilience::circuit_breaker::{Acquire, CircuitBreakerConfig, CircuitBreakerCore, CircuitState};
//!
//! let mut breaker = CircuitBreakerCore::new(CircuitBreakerConfig {
//!     failure_threshold: 1,
//!     cooldown_ms: 100,
//!     ..CircuitBreakerConfig::new("weather")
//! })
//! .unwrap();
//! breaker.on_failure(0);
//! assert_eq!(breaker.try_acquire(50), Acquire::Rejected { retry_after_ms: 50 });
//! assert_eq!(breaker.state(100), CircuitState::HalfOpen);
//! ```

#[path = "generated/resilience-core.rs"]
pub mod resilience_core;

#[path = "generated/rng.rs"]
pub mod rng;

#[path = "generated/timeout.rs"]
pub mod timeout;

#[path = "generated/circuit-breaker.rs"]
pub mod circuit_breaker;

#[path = "generated/retry.rs"]
pub mod retry;

#[path = "generated/rate-limiter.rs"]
pub mod rate_limiter;

#[path = "generated/bulkhead.rs"]
pub mod bulkhead;

#[path = "generated/fallback-chain.rs"]
pub mod fallback_chain;

#[path = "generated/mzizi-resilience.rs"]
pub mod mzizi_resilience;

pub use mzizi_resilience::{
    Fault, FaultInjector, FaultKind, FaultSchedule, HealthMonitor, HealthReport, HealthStatus,
    Resilience, ResilienceConfig, apply_fault,
};
pub use resilience_core::{ConfigError, Error, ErrorCode, Runtime};
pub use rng::{Mulberry32, Random};
