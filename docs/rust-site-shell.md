# Proposal: a Rust site shell, and APCA in `mzizi-tokens`

Status: draft, for discussion. Nothing here is published, registered or released.

standards.bundu.org and vocab.bundu.org (repository `bundu-labs/bundu-standards`, PR #151)
render every page through one Rust crate, `bundu-site`, so the two sites look and behave the
same. Mzizi's Rust crates have no shell for a public site (`mzizi-ui` has 14 primitives;
`mzizi-shell` has the app-side components; `discover-shell` exists as `.astro` and `.tsx`
only), so the pieces below were written there, as Dioxus components with their contracts in the
module docs. Per the upstream-first rule they belong here.

Source: `site/src/components/` and `site/src/css_audit.rs` in `bundu-labs/bundu-standards`
at the head of branch `coolify-standards`.

| Piece                    | What it is                                                                                                                                                                                                | Closest thing here                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `SkipLink`               | first focusable element, `a.skip[href=#main]`, "Skip to main content", shown on focus                                                                                                                     | the skip link inside `discover-shell`                      |
| `SiteHeader` + `NavLink` | `header.site`: brand (light and dark mark, both `alt=""`), one `nav[aria-label=Main]`, `aria-current` `page` / `location`, optional screen-reader-only hint on a short link, every link a full hit region | the header of `discover-shell`; `mzizi-header` (tsx)       |
| `CopyControl`            | "Copy this page as" Markdown or JSON, `div[data-copy][hidden]` until `copy.js` runs, labelled select, button, `role=status`                                                                               | none                                                       |
| `Document`               | head (icons per colour scheme, theme-color, canonical or `noindex`, JSON data scripts), body (skip link, header, `main#main[tabindex=-1]`, footer)                                                        | `discover-shell` plus `DiscoverMeta`                       |
| `apca(txt, bg)`          | APCA-W3 0.1.9 Lc from two `#rrggbb` colours, checked against the reference values (black on white 106.04, white on black -107.88)                                                                         | `mzizi-tokens` documents APCA bars but exports no function |

## What would make it a registry change

1. A contract per component (`contracts/discover/` for the shell parts, since a public site is
   the Discover Standard's case) with props, states, clauses and checks.
2. The Astro build first (it may already be `discover-shell`; the question is whether the
   Rust `Document`, header and skip link should be a `.rs` sibling of it with
   `identity: "contract"`), then the `.rs` in `n7-shell`, registered in `registry.json`.
3. `apca` in `mzizi-tokens` (and its generator), with the reference-value test.
4. The docs page on docs.mzizi.dev and the `@bundu/ui` pin, per CONTRIBUTING.

Open question for the maintainers: should these be new components, or should the Rust
`discover-shell` sibling replace them? The sites would adopt whichever lands and delete their
local copy (marked `TODO(mzizi)` pointing at this PR).
