# mzizi-fundi

The client-side self-healing rung from the [Mzizi](https://mzizi.dev) component registry —
**rung N9, fundi** — the rung whose claim is that failure is a learning event rather than a
user-facing incident.

Three modules: `mzizi_fundi` decides whether a failure is worth filing, `mzizi_fundi_reporter`
shapes the issue, and `mzizi_fundi_learning` tracks which fixes have worked before.

```toml
[dependencies]
mzizi-fundi = "0.4"
```

The registry's `publish-crates` workflow releases each new version to crates.io. Before
the first release, or to follow `main`, depend on it from git:

```toml
[dependencies]
mzizi-fundi = { git = "https://github.com/mzizi-dev/mzizi-registry" }
```

## What this crate is not

It does not file anything. It builds the issue and the host sends it — the same division
as N8, which builds an OTLP request and lets the host perform it. There are no
dependencies and no HTTP client in particular: N9's Rust position is an edge worker, and a
Worker already has `fetch`.

The **healing loop itself** — the cron pass, the webhook ingest, the GitHub automation —
is a separate Worker in `mzizi-dev/agent-tools` and is still TypeScript. Taking this crate
gives you the registry surface of N9, not the loop.

## The source lives in the registry, not in this crate

Each module is authored as `components/registry/n9-fundi/<name>.rs`, beside the `.ts` that
implements the same contract for a JavaScript host. `src/generated/` holds a committed
copy, written by `pnpm rust:generate` and gated in CI by `pnpm rust:generate:check`;
editing it directly is overwritten on the next run. The copy exists because
`cargo package` collects only files under the package root.

## Part of Mzizi Roots

This crate is also re-exported as `mzizi_roots_server::fundi` by the
[`mzizi-roots-server`](https://crates.io/crates/mzizi-roots-server) umbrella crate (the
`fundi` feature, on by default). Depend on this crate directly to take only this node, or
on `mzizi-roots-server` for the whole server side in one line.

## Links

- Registry index: <https://api.mzizi.dev/api/v1/ui>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an independent open-architecture project, operated and developed
by Nyuchi.
