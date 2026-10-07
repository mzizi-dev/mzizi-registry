# mzizi-roots-server

**Mzizi Roots**, the server side: one dependency for the server components of the
[Mzizi](https://mzizi.dev) component registry.

Mzizi Roots server components are sans-IO cores. A typed request goes in and a typed
response comes out, with every external facility (a store, a clock, an outbound request, a
secret) behind a trait the host implements. The same core runs in a Cloudflare Worker
through `workers-rs`, in a container behind an axum-class server, or in a test with an
in-memory store. They build for `wasm32-unknown-unknown`.

This crate has no code of its own. It re-exports the node crates, each behind a feature:

| Module        | Crate               | What it holds                                          | Feature                |
| ------------- | ------------------- | ------------------------------------------------------ | ---------------------- |
| `assurance`   | `mzizi-assurance`   | N8 probes, telemetry, alerting and the OTLP exporter   | `assurance` (default)  |
| `fundi`       | `mzizi-fundi`       | N9 Fundi reporter and learning loop                    | `fundi` (default)      |
| `docs`        | `mzizi-docs`        | N10 docs API, AI context and the docs renderers        | `docs` (default)       |
| `discovery`   | `mzizi-discovery`   | N11 page metadata and Schema.org JSON-LD               | `discovery` (default)  |
| `activitypub` | `mzizi-activitypub` | N11 on the fediverse: ActivityPub, WebFinger, NodeInfo | `activitypub` (opt-in) |

`assurance`, `fundi` and `discovery` have no dependencies. `activitypub` is opt-in, because
it brings in `serde_json` and `url`. `docs` brings in `dioxus`,
because `mzizi-docs` also carries the two documentation renderers.

The UI-side components are in [`mzizi-roots`](https://crates.io/crates/mzizi-roots).

## Install

```sh
cargo add mzizi-roots-server
```

Before the first crates.io release, or to follow `main`, install from git:

```sh
cargo add mzizi-roots-server --git https://github.com/mzizi-dev/mzizi-registry
```

To take only what you use:

```toml
[dependencies]
mzizi-roots-server = { version = "0.2", default-features = false, features = ["assurance", "discovery"] }
```

```rust
use mzizi_roots_server::docs::mzizi_docs_api::cors_headers;
```

## Links

- Source: <https://github.com/mzizi-dev/mzizi-registry>
- The plan: `docs/roots/RFC-roots.md` in the registry

Apache-2.0. Copyright 2026 Bundu Foundation.
