# mzizi-roots

**Mzizi Roots**, the UI side: one dependency for the Dioxus components and design tokens of
the [Mzizi](https://mzizi.dev) component registry.

Mzizi Roots is the Rust build of Mzizi's own components. This crate has no code of its own.
It re-exports the node crates, each behind a feature:

| Module   | Crate          | What it holds                                       | Feature           |
| -------- | -------------- | --------------------------------------------------- | ----------------- |
| `tokens` | `mzizi-tokens` | N1 design tokens: the Mzizi palette and scales      | always on         |
| `ui`     | `mzizi-ui`     | N2 primitives: button, badge, card and the rest     | `ui` (default)    |
| `brand`  | `mzizi-brand`  | N3 brand components, each with a checkable contract | `brand` (default) |
| `shell`  | `mzizi-shell`  | N7 app shell: navigation, footer, toasts, theme     | `shell` (default) |

The server-side components are in [`mzizi-roots-server`](https://crates.io/crates/mzizi-roots-server).

## Install

```sh
cargo add mzizi-roots
```

Before the first crates.io release, or to follow `main`, install from git:

```sh
cargo add mzizi-roots --git https://github.com/mzizi-dev/mzizi-registry
```

To take only what you use:

```toml
[dependencies]
mzizi-roots = { version = "0.4", default-features = false, features = ["brand"] }
```

```rust
use mzizi_roots::brand::{AlertSeverity, MziziAlertBanner};
use mzizi_roots::tokens::COBALT_DARK;
```

The components pull in no renderer, so the app that mounts them picks the target: web,
desktop, mobile, or server-side rendering. They style with Tailwind classes over Mzizi's
CSS custom properties, the same classes their React siblings use.

## Why an umbrella

The components stay in one crate per registry node. That keeps the crate that compiles a
component the one `https://api.mzizi.dev/v1/rs/<name>` names. This crate is the one-line
install for an app that wants the design system.

## Links

- Source: <https://github.com/mzizi-dev/mzizi-registry>
- A component's Rust source: `https://api.mzizi.dev/v1/rs/<name>`

Apache-2.0. Copyright 2026 Bundu Foundation.
