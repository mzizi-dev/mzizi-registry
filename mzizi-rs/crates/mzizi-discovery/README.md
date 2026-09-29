# mzizi-discovery

Machine visibility from the [Mzizi](https://mzizi.dev) component registry — **rung N11,
discovery** — the rung whose claim is that if the machine cannot see it, it does not exist.

One module today, `mzizi_seo`: resolved page metadata and Schema.org JSON-LD.

```toml
[dependencies]
mzizi-discovery = "0.1"
```

The registry's `publish-crates` workflow releases each new version to crates.io. Before
the first release, or to follow `main`, depend on it from git:

```toml
[dependencies]
mzizi-discovery = { git = "https://github.com/mzizi-dev/mzizi-registry" }
```

The TypeScript sibling returns a Next.js `Metadata` object. There is no Next.js here, so
the Rust side returns a plain resolved struct and can render the `<head>` elements itself
— the same division as N8, which builds a request and lets the host send it.

No dependencies, `serde_json` included. JSON-LD is a small, fully specified shape, and the
escaping this rung needs is stricter than a general serializer's default anyway: `<`, `>`
and `&` become `\u` escapes so a caller-supplied string cannot close the `<script>`
element carrying it.

## The source lives in the registry, not in this crate

It is authored as `components/registry/n11-discovery/<name>.rs`, beside the `.ts` that
implements the same contract for a JavaScript host. `src/generated/` holds a committed
copy, written by `pnpm rust:generate` and gated in CI by `pnpm rust:generate:check`;
editing it directly is overwritten on the next run. The copy exists because
`cargo package` collects only files under the package root.

## Part of Mzizi Roots

This crate is also re-exported as `mzizi_roots_server::discovery` by the
[`mzizi-roots-server`](https://crates.io/crates/mzizi-roots-server) umbrella crate (the
`discovery` feature, on by default). Depend on this crate directly to take only this node,
or on `mzizi-roots-server` for the whole server side in one line.

## Links

- Registry index: <https://api.mzizi.dev/api/v1/ui>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an independent open-architecture project, operated and developed
by Nyuchi.
