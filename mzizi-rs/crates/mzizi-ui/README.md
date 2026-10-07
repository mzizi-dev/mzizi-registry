# mzizi-ui

Dioxus primitives from the [Mzizi](https://mzizi.dev) component registry — **node N2,
primitives** — the second node of the DNA-helix architecture.

The primitives ported so far: `Alert`, `Avatar`, `Badge`, `Button`, `Card`, `Chart`,
`Input`, `Label`, `MarkdownRenderer`, `Progress`, `SafeAreaFrame`, `Separator`, `Skeleton`
and `StatusBadge`. That is the whole of this crate; N2 has many more components, and the
rest exist only as React and Astro today.

`MarkdownRenderer` is safe by construction: it parses Markdown into a typed tree
(`parse_markdown`, `MarkdownBlock`, `MarkdownInline`) and renders elements, with no HTML
string anywhere. Raw HTML in the text shows as text, and links pass `safe_href`, a scheme
allow-list (`MarkdownLinks::Https` keeps https only).

```rust
use mzizi_ui::{MarkdownLinks, MarkdownRenderer};

rsx! { MarkdownRenderer { content: "**Hi** [docs](https://mzizi.dev)", links: MarkdownLinks::Https } }
```

```toml
[dependencies]
mzizi-ui = "0.3"
```

The registry's `publish-crates` workflow releases each new version to crates.io. Before
the first release, or to follow `main`, depend on it from git:

```toml
[dependencies]
mzizi-ui = { git = "https://github.com/mzizi-dev/mzizi-registry" }
```

```rust
use mzizi_ui::{Button, ButtonVariant, ButtonSize};
```

`mzizi-tokens` is re-exported as `mzizi_ui::tokens`, so a consumer takes one dependency
for the primitives and the palette together.

## The source lives in the registry, not in this crate

Every primitive is authored as `components/registry/n2-primitives/<name>.rs`, beside the
`.tsx` that implements the same contract for React — one component, one name, one place.
`src/generated/` holds a committed copy, written by `pnpm rust:generate` and gated in CI
by `pnpm rust:generate:check`; editing it directly is overwritten on the next run. The
copy exists because `cargo package` collects only files under the package root, so a
crate that reached up into the registry would ship a tarball that could not build.

The primitives themselves carry no colour literals — they style with Tailwind classes over
Mzizi's CSS custom properties. The values behind those properties are not authored here
either: `lib/tokens/palette.source.ts` is the one place a Mzizi colour is written, and
`mzizi-tokens` (re-exported above) is one of the surfaces generated from it.

## Part of Mzizi Roots

This crate is also re-exported as `mzizi_roots::ui` by the
[`mzizi-roots`](https://crates.io/crates/mzizi-roots) umbrella crate (the `ui` feature, on
by default). Depend on this crate directly to take only this node, or on `mzizi-roots` for
the whole UI side in one line.

## Links

- Registry index: <https://api.mzizi.dev/api/v1/ui>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an independent open-architecture project, operated and developed
by Nyuchi.
