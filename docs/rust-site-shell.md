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

## Proposed floor: keyboard help on every page

Owner requirement: keyboard help is not optional footer text. Proposed as a clause of the
**Bundu floor** (the `bundu-floor` engineering constraint and `get_doctrine` topic
`bundu-floor`, beside text size, contrast, hit regions and spacing), and as part of the contract
of the shell and footer components.

**The clause.** Every page of every Mzizi site and app exposes keyboard help:

1. **Visible.** The help is in the page, not behind a script or a hover, and is not removed
   at any width or theme.
2. **Keyboard-reachable.** It is reached with Tab alone, and the page begins with a skip link
   (`a.skip[href=#main]`, first focusable element, shown on focus).
3. **Documented shortcuts.** It names every key the page needs, and every shortcut the page
   defines. A page with no shortcut of its own says so by having none: there is no shortcut
   without help.
4. **No clash.** A page defines no shortcut that the browser or a screen reader uses. Without
   a keyboard-help dialog to arbitrate, the rule is the simplest one: no `accesskey`, and no
   single-key shortcut (WCAG 2.1.4).
5. **A way to open it.** Where the help is a dialog or a panel (an app with shortcuts), `?`
   opens it, Escape closes it, focus returns where it was, and it is listed in the help itself.
   Where the help is always on the page (a public site), that is the way to see it.
6. **A way to report a barrier**, from the same place.

**Reference implementation** (what standards.bundu.org and vocab.bundu.org ship today, in
`bundu-labs/bundu-standards`, `site/` and the pages of both sites). The footer of every page
holds, as `footer.site`:

> Every page works with a keyboard alone: **Tab** moves forward, **Shift**+**Tab** moves back,
> **Enter** follows a link. Read the [accessibility statement](https://standards.bundu.org/accessibility/)
> or [report a barrier](https://github.com/bundu-labs/bundu-standards/issues/new?title=Accessibility%3A%20).

with each key in `<kbd>`. Both sites define no shortcut of their own, so clause 3 holds by
construction and clause 5's `?` is not needed. The shell's other keyboard parts: the skip link
first, `main` as its `tabindex="-1"` target, a labelled `nav`, a visible 3px `:focus-visible`
outline (forced-colours: `Highlight`), full hit regions on every link and control (45px touch,
24px fine pointer), and the copy control, a labelled `select` and `button` reached in order.
The standards site's accessibility statement lists the same keys in a table, with a caption.

**Component contract.** The footer component takes the help as required, not optional content:
`SiteFooter` has no way to render without the keyboard-help paragraph and the accessibility
link, and `SiteHeader` / `Document` place `SkipLink` first. A consumer cannot omit them.

**How the floor is checked.** The audit in `site/src/audit.rs` runs over every page of both
sites in `cargo test` (every page of standards, every term page and the not-found page of
vocab). The keyboard-help part:

```rust
// Keyboard help is a requirement: on every page, in the footer, naming Tab, Shift+Tab and
// Enter, linking to the accessibility statement; no `accesskey` (a shortcut that can clash).
let footer = html.find("<footer").zip(html.find("</footer>")).map(|(a, b)| &html[a..b]).unwrap_or("");
for needle in ["<kbd>Tab</kbd>", "<kbd>Shift</kbd>", "<kbd>Enter</kbd>"] {
    if !footer.contains(needle) {
        bad(format!("the footer's keyboard help lacks {needle}"));
    }
}
if !footer.contains("accessibility") {
    bad("the footer's keyboard help does not link to the accessibility statement".into());
}
if html.contains(" accesskey=") {
    bad("accesskey defines a shortcut that can clash".into());
}
```

and, in the same audit, the skip link is the first link in `<body>`, `main` is `#main` with
`tabindex="-1"`, and every `nav` is labelled. Its own unit tests remove each piece (a `<kbd>`,
an `accesskey` added) and fail if the audit does not catch it. In this registry the same
clauses would be `checks` in the shell contract (selectors `footer kbd` min 3, `a.skip`
first in `body`, no `[accesskey]`) so every build (Astro, React, Rust) is held to them by
`runner.ts`.

**For the maintainers to decide:** the exact floor wording and its place in `bundu-floor`
(a new numbered clause, or a sibling `keyboard-floor`); whether apps with a command palette
(`app-command-palette`, `⌘K`) must also bind `?` to help; and the single-key rule, which this
draft takes from WCAG 2.1.4.
