# mzizi-roots

**Mzizi Roots**, the Dioxus-free runtime core of the [Mzizi](https://mzizi.dev) component
registry, and one dependency for the Dioxus components that have not moved onto it yet.

The core has no dependency and no renderer. It has two parts:

- **`node`**: the element tree. A `Node` is an element (a tag, its attributes in order, and its
  children), a text run, or a fragment. `render_to_string` writes a list of nodes as markup, and
  escapes every text node and every attribute value with the five decimal references
  (`&#38;` `&#60;` `&#62;` `&#34;` `&#39;`). It is the node shape of the Mzizi language's renderer
  (`compiler/src/render.rs` in `mzizi-dev/mzizi`), so a component written in Rust and one compiled
  from `.mz` produce the same tree.
- **`components`**: the components that render through the core, each unstyled. They carry the hooks
  a stylesheet keys off (`data-slot`, `data-variant`, `data-size`, `data-state`, `data-loading`, ARIA)
  and no class names. A `class` passed in is a pass-through for the adopter's own styling, written
  last, as given. The eight are alert, badge, card, chart, progress, separator, safe-area-frame and
  markdown-renderer.

```rust
use mzizi_roots::components::badge::{self, BadgeVariant, RenderProps};

let html = badge::render(&RenderProps {
    variant: BadgeVariant::Destructive,
    text: "Revoked".to_owned(),
    ..RenderProps::default()
});
assert_eq!(
    html,
    r#"<span data-slot="badge" data-portal="https://mzizi.dev/components/badge" data-variant="destructive">Revoked</span>"#
);
```

Each component also exposes `node(&RenderProps) -> Node`, so a parent can compose its tree
without serialising it first.

## Install

```sh
cargo add mzizi-roots --no-default-features
```

The default features re-export the Dioxus components in the node crates (`ui`, `brand`, `shell`),
which still need Dioxus. Turn them off to take only the core:

```toml
[dependencies]
mzizi-roots = { version = "0.11", default-features = false }
```

## Tests

`tests/components.rs` holds the goldens for every component state and the rule that a component
writes no class of its own. `tests/contracts.rs` evaluates the registry contracts for these builds
with the shared evaluator in `mzizi-rs/contract-eval/`; the class clauses of a contract cannot hold
for an unstyled build, so they are dropped there and the no-class rule covers them.
`tests/markdown_parity.rs` holds the Markdown parser to the shared fixture the TypeScript suite runs.

## Links

- Source: <https://github.com/mzizi-dev/mzizi-registry>
- A component's Rust source: `https://api.mzizi.dev/v1/rs/<name>`
- The Roots design: [`docs/roots/RFC-roots.md`](https://github.com/mzizi-dev/mzizi-registry/blob/staging/docs/roots/RFC-roots.md)

Apache-2.0. Copyright 2026 Bundu Foundation.
