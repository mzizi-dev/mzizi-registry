# mzizi-brand

Branded Dioxus components from the [Mzizi](https://mzizi.dev) component registry, **node N3,
brand**. This is the first batch of **Mzizi Roots**: Mzizi's own components converted to Rust.

Twelve of N3's components are here:

| Component              | What it is                                         |
| ---------------------- | -------------------------------------------------- |
| `MziziAlertBanner`     | Mineral-coded severity alert                       |
| `MziziAvatarStack`     | Overlapping avatars with a `+N` overflow           |
| `MziziCoverHeader`     | Cover image, avatar and name                       |
| `MziziEmptyState`      | The branded empty state                            |
| `MziziEscalationCard`  | Asks a person to choose, so a paused agent resumes |
| `MziziGaugeCard`       | Radial arc gauge                                   |
| `MziziHeroStat`        | One large value with context                       |
| `MziziMetaTile`        | Date or icon chip beside a primary line            |
| `MziziStatsRow`        | Compact row or grid of stats                       |
| `MziziSuccessScreen`   | Confirmation after a payment or a booking          |
| `MziziSuitabilityCard` | Scored recommendation                              |
| `MziziUserCard`        | A person with avatar, role and actions             |

The rest of N3 exists only as React today.

## Install

From crates.io, once the first release is out:

```toml
[dependencies]
mzizi-brand = "0.3"
```

Until then, and at any commit, from git:

```toml
[dependencies]
mzizi-brand = { git = "https://github.com/mzizi-dev/mzizi-registry" }
```

```rust
use mzizi_brand::{AlertSeverity, MziziAlertBanner};
```

The crate is a component library. It pulls in no renderer, so the app that mounts these
components picks the target: web, desktop, mobile, or server-side rendering.

## Every component carries a contract

Each module exports `CONTRACT`, a `contract … end` block written in the clause grammar of the
[Mzizi language](https://github.com/mzizi-dev/mzizi) (`design/RFC-0006-contracts.md`):

```text
contract
  slot is "mzizi-alert-banner"
  role is "alert"
  every alert_severity label not_empty
  button "Dismiss" min_height 48
end
```

The crate's contract suite renders each component and evaluates every clause against the
markup it emits. A clause it cannot evaluate fails the suite rather than passing.

## What the components expect from the host

- **Styling.** They style with Tailwind classes over Mzizi's CSS custom properties, the same
  classes their React siblings use, so one stylesheet serves both.
- **Motion.** Components that animate in take `prefers_reduced_motion: bool`. Pass the user's
  preference; the React siblings read it from the Mzizi harness.
- **Icons.** Where the React sibling takes a Lucide component, this crate takes an `Element`
  you render.

## The source lives in the registry, not in this crate

Each component is authored as `components/registry/n3-brand/<name>.rs`, beside the `.tsx`
that implements the same contract for React. `src/generated/` holds a committed copy, written
by `pnpm rust:generate` and gated in CI by `pnpm rust:generate:check`. Edit the registry
file; the copy is overwritten.

## Part of Mzizi Roots

This crate is also re-exported as `mzizi_roots::brand` by the
[`mzizi-roots`](https://crates.io/crates/mzizi-roots) umbrella crate (the `brand` feature,
on by default). Depend on this crate directly to take only this node, or on `mzizi-roots`
for the whole UI side in one line.

## Links

- A component's Rust source: `https://api.mzizi.dev/v1/rs/<name>`
- Source: <https://github.com/mzizi-dev/mzizi-registry>

Apache-2.0. Copyright 2026 Bundu Foundation.
