# mzizi-ui

Primitives from the [Mzizi](https://mzizi.dev) component registry — **node N2,
primitives** — the second node of the DNA-helix architecture. They are Dioxus components.
Mzizi is replacing Dioxus with its own `render(props) -> String` path, and that path lives in
[`mzizi-roots`](https://crates.io/crates/mzizi-roots), not here.

This crate exports these primitives: `Avatar`, `Button`, `DeviceCode`, `Input`, `Label`,
`Skeleton` and `StatusBadge`. N2 has more components, and the rest exist only as React and
Astro today.

The unstyled components moved to `mzizi-roots`, at `mzizi_roots::components::*`, and this crate
no longer exports them: `Alert`, `Badge`, `Card`, `Chart`, `MarkdownRenderer`, `Progress`,
`SafeAreaFrame` and `Separator`. For those, depend on `mzizi-roots` instead. Its
`components::markdown_renderer` module holds the Markdown renderer (`RenderProps`, `render`,
`MarkdownLinks`, `parse_markdown` and the `Block` tree).

`DeviceCode` is the device side of an RFC 8628 pairing: the user code, the short address, a
QR code drawn on the device (the `qrcode` crate, encoder only) and the time left. It renders
one frame from `now` (Unix ms), so the app re-renders it each second to tick the countdown.

```rust
use mzizi_ui::{DeviceCode, DeviceCodeSize, rfc3339_to_unix_ms};

let expires_at = rfc3339_to_unix_ms("2026-10-07T12:10:00Z").unwrap();
rsx! {
    DeviceCode {
        user_code: "KTQB4RMX",
        verification_uri: "https://mukoko.com/link",
        verification_uri_complete: "https://mukoko.com/link?code=KTQB4RMX",
        expires_at,
        size: DeviceCodeSize::Tv,
    }
}
```

```toml
[dependencies]
mzizi-ui = "0.10"
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
