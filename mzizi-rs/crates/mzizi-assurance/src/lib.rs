//! Mzizi N8 assurance for Rust — the shared core behind "what breaks is seen
//! before users feel it."
//!
//! # Where the components are
//!
//! Not authored in this crate. Each one is a file under
//! `components/registry/n8-assurance/<name>.rs`, beside the `.ts` that implements
//! the same contract for a JavaScript host. One component, one name, one place —
//! the registry — with this crate as the thing that compiles it.
//!
//! `src/generated/` holds a COMMITTED copy of each, written by `pnpm rust:generate`
//! and checked by `pnpm rust:generate:check`. The copy is what makes this crate
//! publishable: `cargo package` collects only files under the package root, so a
//! `#[path]` reaching up into the registry ships a tarball that cannot build. Edit
//! the registry file; the copy is overwritten.
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

#[path = "generated/mzizi-conformity-check.rs"]
pub mod mzizi_conformity_check;

#[path = "generated/mzizi-rum.rs"]
pub mod mzizi_rum;

#[path = "generated/mzizi-api-probe.rs"]
pub mod mzizi_api_probe;

#[path = "generated/mzizi-error-tracker.rs"]
pub mod mzizi_error_tracker;

#[path = "generated/mzizi-alert-engine.rs"]
pub mod mzizi_alert_engine;

#[path = "generated/mzizi-synthetic-probe.rs"]
pub mod mzizi_synthetic_probe;

#[path = "generated/mzizi-a11y-audit.rs"]
pub mod mzizi_a11y_audit;

#[path = "generated/mzizi-chaos.rs"]
pub mod mzizi_chaos;

#[path = "generated/rtl-conformity-check.rs"]
pub mod rtl_conformity_check;

#[path = "generated/mzizi-platform-health.rs"]
pub mod mzizi_platform_health;

#[path = "generated/mzizi-perf-probe.rs"]
pub mod mzizi_perf_probe;

#[path = "generated/mzizi-incident-manager.rs"]
pub mod mzizi_incident_manager;

#[path = "generated/mzizi-otel.rs"]
pub mod mzizi_otel;
