# mzizi-docs

Self-describing documentation components from the [Mzizi](https://mzizi.dev) component
registry — **rung N10, documentation** — the rung where the system explains itself.

Four modules: `mzizi_ai_context` and `mzizi_docs_api` are string assembly and routing;
`mzizi_changelog_renderer` and `mzizi_docs_engine` render, and pull in Dioxus for it.

```toml
[dependencies]
mzizi-docs = "0.4"
```

The registry's `publish-crates` workflow releases each new version to crates.io. Before
the first release, or to follow `main`, depend on it from git:

```toml
[dependencies]
mzizi-docs = { git = "https://github.com/mzizi-dev/mzizi-registry" }
```

Dioxus is pinned to the same version `mzizi-ui` uses, so composing an N10 portal out of N2
primitives links one Dioxus rather than two.

## Parameters, not literals

N10's components describe the ecosystem, so a stale constant here does not merely go out
of date — it becomes what the system _tells people about itself_. `mzizi-ai-context` is
the cautionary case: the original opened by forbidding hardcoded counts and then hardcoded
the entire node list, which went stale at N10 while the node set ran on to N12. Each port
turns those literals into parameters.

## The source lives in the registry, not in this crate

Each module is authored as `components/registry/n10-documentation/<name>.rs`, beside the
`.ts`/`.tsx` that implements the same contract for a JavaScript host. `src/generated/`
holds a committed copy, written by `pnpm rust:generate` and gated in CI by
`pnpm rust:generate:check`; editing it directly is overwritten on the next run. The copy
exists because `cargo package` collects only files under the package root.

## Part of Mzizi Roots

This crate is also re-exported as `mzizi_roots_server::docs` by the
[`mzizi-roots-server`](https://crates.io/crates/mzizi-roots-server) umbrella crate (the
`docs` feature, on by default). Depend on this crate directly to take only this node, or
on `mzizi-roots-server` for the whole server side in one line.

## Links

- Registry index: <https://api.mzizi.dev/api/v1/ui>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an independent open-architecture project, operated and developed
by Nyuchi.
