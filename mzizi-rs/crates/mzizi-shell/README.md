# mzizi-shell

App-chrome components from the [Mzizi](https://mzizi.dev) component registry — **node N7,
shell** — the node that holds everything wrapping a screen.

Twelve of N7's sixteen components are ported: bottom nav, footer, command palette,
connectivity bar, notification centre, toast provider, theme provider, update prompt,
route guard, deep-link handler, persistent player and the mini-app runtime.

**The header, sidebar, app switcher and root layout are not here.** The first three depend
on N2 primitives that have no Dioxus port yet; the fourth wraps Next.js's `<html>`/`<body>`,
which is the App Router's job rather than a portable component's — a Dioxus app's root is
`dioxus::launch`. If you need a header, this crate does not have one.

```toml
[dependencies]
mzizi-shell = "0.1"
```

> Not on crates.io yet. The seven `mzizi-rs` crates were made publishable in
> mzizi-registry#328 but none has been released, so this line does not resolve
> today — depend on it by path or git until the first release.

`regex` is the one dependency beyond Dioxus, and only for deep-link route matching: the
TypeScript sibling uses native `RegExp` with named capture groups and anchoring, so its
behaviour _is_ regex semantics and hand-rolling a second engine would buy nothing.

## The source lives in the registry, not in this crate

Each component is authored as `components/registry/n7-shell/<name>.rs`, beside the `.tsx`
that implements the same contract for React. `src/generated/` holds a committed copy,
written by `pnpm rust:generate` and gated in CI by `pnpm rust:generate:check`; editing it
directly is overwritten on the next run. The copy exists because `cargo package` collects
only files under the package root.

These components style themselves with Tailwind classes over Mzizi's CSS custom properties
(`--color-*`); they do not link `mzizi-tokens`. The custom properties are generated —
`lib/tokens/palette.source.ts` is the one place a Mzizi colour is authored — and the crate
that carries those values as Rust consts is [`mzizi-tokens`](https://crates.io/crates/mzizi-tokens).

## Links

- Registry index: <https://api.mzizi.dev/api/v1/ui>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an open-architecture project of the Bundu Foundation, operated and
developed by Nyuchi.
