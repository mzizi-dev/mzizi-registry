# mzizi-assurance

The shared assurance core from the [Mzizi](https://mzizi.dev) component registry — **node
N8, assurance**, the rung whose claim is that what breaks is seen before users feel it.

Thirteen modules: conformity and RTL checks, an accessibility audit, API / synthetic /
performance probes, RUM, error tracking, alert evaluation, incident management, chaos, a
platform-health roll-up, and an OpenTelemetry OTLP/HTTP encoder.

```toml
[dependencies]
mzizi-assurance = "0.1"
```

## It computes; it does not perform I/O

The boundary is drawn at I/O, not at language. Everything that must compute identically on
every target is here and is pure; everything that must differ — how bytes leave the
process, where the clock and the CSPRNG come from — belongs to the host. So
`mzizi_otel::build_trace_request` returns a request rather than sending one, and ids are
supplied as bytes rather than generated.

Two consequences worth knowing before you reach for it. There are **no dependencies** —
no `serde_json`, no HTTP client, no `getrandom` — because this core compiles into every
consumer of every app and a shared core must not pick the host's TLS stack or CSPRNG. And
the never-throw rule the TypeScript exporter had to promise in a `try`/`catch` is
structural here: a core with no I/O cannot report "failed" merely because a collector was
unreachable.

## The source lives in the registry, not in this crate

Each module is authored as `components/registry/n8-assurance/<name>.rs`, beside the `.ts`
that implements the same contract for a JavaScript host. `src/generated/` holds a
committed copy, written by `pnpm rust:generate` and gated in CI by
`pnpm rust:generate:check`; editing it directly is overwritten on the next run. The copy
exists because `cargo package` collects only files under the package root.

## Links

- Registry: <https://mzizi.dev/r/> — browse at <https://mzizi.dev/components>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an open-architecture project of the Bundu Foundation, operated and
developed by Nyuchi.
