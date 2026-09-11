# mzizi-tokens

The [Mzizi](https://mzizi.dev) design palette as Rust consts — **node N1, tokens**, the
first rung of the DNA-helix architecture.

All 21 families, each in both themes: seven African minerals (cobalt, tanzanite,
malachite, gold, terracotta, sodalite, copper), seven heritage tones (indigo, savanna,
baobab, sunset, river, hematite, kalahari) and the seven experimental (ember, acacia,
fern, lagoon, storm, dusk, protea). Plus the spacing, radius and type scales.

```toml
[dependencies]
mzizi-tokens = "0.1"
```

```rust
use mzizi_tokens::{Palette, COBALT_DARK, Radius};

let p = Palette::dark();      // every colour resolved for one theme
let r = Radius::MD;           // 12 — every radius derives from the 7px unit
```

## The values are generated, not authored

Not here, and not in any other target either. `lib/tokens/palette.source.ts` in the
[registry repo](https://github.com/mzizi-dev/mzizi-registry) is the one place a Mzizi
colour is written; `pnpm tokens:sync` projects it into the CSS custom properties, the
Swift, Kotlin, ArkTS, React Native, Python and TypeScript token files, and the Rust file
this crate compiles. `pnpm tokens:verify` fails the build when any of them drifts, and a
cross-surface test checks all seven emitters agree on every family and every hex.

That is N1's covenant made literal: design decisions are data, so adding a target means
adding an emitter, never re-authoring the palette. A hand-maintained Rust colour table
here would be the exact failure this crate exists to avoid — and it is not a hypothetical
one. A hardcoded five-mineral map is why the token node shipped five families against a
seven-family system, and another such map outlived that fix by two more palette expansions
before it was found.

`src/generated/` holds a committed copy of the registry file, written by
`pnpm rust:generate` and gated in CI by `pnpm rust:generate:check`. The copy exists because
`cargo package` collects only files under the package root. Edit the registry file; the
copy is overwritten.

No dependencies, and no network or filesystem access at build or run time — the palette is
consts.

## Links

- Palette: <https://mzizi.dev/tokens>
- Registry: <https://mzizi.dev/r/> — browse at <https://mzizi.dev/components>
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Mzizi is an open-architecture project of the Bundu Foundation, operated and
developed by Nyuchi.
