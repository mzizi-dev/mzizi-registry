# mzizi-docs

Self-describing documentation components from the [Mzizi](https://mzizi.dev) component
registry — **node N10, documentation**, the rung where the system explains itself.

Four modules: `nyuchi_ai_context` and `nyuchi_docs_api` are string assembly and routing;
`nyuchi_changelog_renderer` and `nyuchi_docs_engine` render, and pull in Dioxus for it.

```toml
[dependencies]
mzizi-docs = "0.1"
```

Dioxus is pinned to the same version `mzizi-ui` uses, so composing an N10 portal out of N2
primitives links one Dioxus rather than two.

## Parameters, not literals

N10's components describe the ecosystem, so a stale constant here does not merely go out
of date — it becomes what the system _tells people about itself_. `nyuchi-ai-context` is
the cautionary case: the original opened by forbidding hardcoded counts and then hardcoded
the entire node list, which went stale at N10 while the node set ran on to N12. Each port
turns those literals into parameters.

## The source lives in the registry, not in this crate

Each module is authored as `components/registry/n10-documentation/<name>.rs`, beside the
`.ts`/`.tsx` that implements the same contract for a JavaScript host. `src/generated/`
holds a committed copy, written by `pnpm rust:generate` and gated in CI by
`pnpm rust:generate:check`; editing it directly is overwritten on the next run. The copy
exists because `cargo package` collects only files under the package root.

## Links

- Registry: <https://mzizi.dev/r/> — browse at <https://mzizi.dev/components>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an open-architecture project of the Bundu Foundation, operated and
developed by Nyuchi.
