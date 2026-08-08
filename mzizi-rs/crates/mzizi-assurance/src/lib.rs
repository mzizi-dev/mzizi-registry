//! Mzizi N8 assurance for Rust — the shared core behind "what breaks is seen
//! before users feel it."
//!
//! # Where the components are
//!
//! Not in this crate's `src/`. Each one is a file under
//! `components/registry/n8-assurance/<name>.rs`, beside the `.ts` that implements
//! the same contract for a JavaScript host, and this module `#[path]`-includes
//! it. One component, one name, one place — the registry — with this crate as the
//! thing that compiles it.
//!
//! # N8 is a Rust node, and what that means precisely
//!
//! N8 holds *logic*, not UI: probe execution, error aggregation, alert
//! evaluation, telemetry encoding. Logic does not need a copy per framework, so
//! unlike N2 there is no "Dioxus alternative" here — there is an implementation,
//! and each target's shim is a thin call into it.
//!
//! The boundary is drawn at **I/O, not at language**. Everything that must
//! compute identically on every target lives here and is pure; everything that
//! must differ — how bytes actually leave the process, where the clock and the
//! CSPRNG come from — is the host's. That is why [`mzizi_otel::build_trace_request`]
//! returns a request rather than sending one.
//!
//! A useful consequence: the never-throw rule that the TypeScript exporter had to
//! promise in a `try`/`catch` is structural here. A core with no I/O cannot fail
//! in a way that changes its caller's verdict, so a probe can never report
//! "failed" merely because a collector was unreachable.

#[path = "../../../../components/registry/n8-assurance/mzizi-rum.rs"]
pub mod mzizi_rum;

#[path = "../../../../components/registry/n8-assurance/mzizi-api-probe.rs"]
pub mod mzizi_api_probe;

#[path = "../../../../components/registry/n8-assurance/mzizi-error-tracker.rs"]
pub mod mzizi_error_tracker;

#[path = "../../../../components/registry/n8-assurance/mzizi-alert-engine.rs"]
pub mod mzizi_alert_engine;

#[path = "../../../../components/registry/n8-assurance/mzizi-synthetic-probe.rs"]
pub mod mzizi_synthetic_probe;

#[path = "../../../../components/registry/n8-assurance/mzizi-otel.rs"]
pub mod mzizi_otel;
