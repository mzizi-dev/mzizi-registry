//! Mzizi Roots, the server side — one dependency for Mzizi's server components.
//!
//! Mzizi Roots is the Rust build of Mzizi's own components (`docs/roots/RFC-roots.md` in the
//! registry). Its server components are sans-IO cores: a typed request in, a typed response
//! out, and every external facility (a store, a clock, an outbound request, a secret) behind a
//! trait the host implements. The same core therefore runs in a Cloudflare Worker through
//! `workers-rs`, in a container behind an axum-class server, or in a test with an in-memory
//! store. They build for `wasm32-unknown-unknown`.
//!
//! This crate re-exports them, each behind a feature:
//!
//! | Module      | Crate             | Node               | Feature                 |
//! | ----------- | ----------------- | ------------------ | ----------------------- |
//! | `resilience` | `mzizi-resilience` | N5 resilience    | `resilience` (default)  |
//! | `assurance` | `mzizi-assurance` | N8 assurance       | `assurance` (default)   |
//! | `fundi`     | `mzizi-fundi`     | N9 fundi           | `fundi` (default)       |
//! | `docs`      | `mzizi-docs`      | N10 documentation  | `docs` (default)        |
//! | `discovery` | `mzizi-discovery` | N11 discovery      | `discovery` (default)   |
//! | `activitypub` | `mzizi-activitypub` | N11 discovery (fediverse) | `activitypub`  |
//!
//! `resilience`, `assurance`, `fundi` and `discovery` have no dependencies. `docs` brings in
//! `dioxus`, because `mzizi-docs` also carries the two documentation renderers. Leave it out
//! with `default-features = false` if you only need the other four.
//!
//! The UI-side components are in `mzizi-roots`.
//!
//! ```
//! # #[cfg(feature = "docs")]
//! # {
//! // The docs API's CORS headers, the same the host sends on every response.
//! let headers = mzizi_roots_server::docs::mzizi_docs_api::cors_headers();
//! assert!(headers.contains(&("Access-Control-Allow-Origin", "*")));
//! # }
//! ```

/// N5 resilience: timeout, retry, circuit breaker, rate limiter, bulkhead, fallback chain,
/// the composed pipeline and its health monitor (`mzizi-resilience`).
#[cfg(feature = "resilience")]
pub use mzizi_resilience as resilience;

/// N8 assurance: probes, telemetry, alerting and the OTLP exporter (`mzizi-assurance`).
#[cfg(feature = "assurance")]
pub use mzizi_assurance as assurance;

/// N9 fundi: deciding what to file, shaping the issue, learning which fixes worked
/// (`mzizi-fundi`).
#[cfg(feature = "fundi")]
pub use mzizi_fundi as fundi;

/// N10 documentation: the docs API, AI context and the docs renderers (`mzizi-docs`).
#[cfg(feature = "docs")]
pub use mzizi_docs as docs;

/// N11 discovery: page metadata and Schema.org JSON-LD (`mzizi-discovery`).
#[cfg(feature = "discovery")]
pub use mzizi_discovery as discovery;

/// N11 discovery on the fediverse: ActivityPub, WebFinger and NodeInfo documents for a
/// read-only host (`mzizi-activitypub`). Not a default feature.
#[cfg(feature = "activitypub")]
pub use mzizi_activitypub as activitypub;
