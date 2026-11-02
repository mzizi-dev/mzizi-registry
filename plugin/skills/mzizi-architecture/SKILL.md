---
name: mzizi-architecture
description: Use this skill before you start a new Mzizi app, site, console or page, before you add a page to one, and whenever you decide where code, data or a component belongs. Design architecture is the DNA helix (8 nodes, 4 rungs, 6 strands), read live from api.mzizi.dev/v1/architecture or mzizi_get_architecture, with what each placement obliges. App architecture puts the shell first: every app or page mounts exactly one shell before anything else (AppShell for a signed-in app, the Dashboard Standard; DiscoverShell for a public browse site, the Discover Standard), then the page patterns, the five application layers, and the rule that a missing component goes upstream. System architecture covers Rust first, Astro as the default UI, Cloudflare Workers, the four API gateways, files as the registry's data layer at a pinned commit, one service per domain database, and what is decided versus built. Use it when an app lacks a shell, a page invents its own chrome, or someone asks how the pieces fit.
user-invocable: true
---

# Mzizi architecture: design, app and system

Three questions, in this order, before anything is built:

1. **Design architecture.** Where on the helix does this belong, and what does that placement
   oblige it to do?
2. **App architecture.** Which shell frames it? The shell is installed **first**, before the
   first page.
3. **System architecture.** Which service owns the data, which gateway serves it, and what runs
   where?

The rule behind all three is **upstream first**. If the registry lacks a component, a shell or a
pattern that you need, or has one that is wrong, change it in `mzizi-dev/mzizi-registry`, its
contract in `contracts/` and its build in `@bundu/ui`. Keep a local copy only while that pull
request is open, marked `TODO(mzizi): <PR URL>`. Never fork the shell or restyle it locally.

This skill describes registry `main` at v4.18.0 (`0d17818`, 2026-11-01), the Roots crates at
0.7.0 and `@bundu/ui` 0.7.0. Counts move, so read the live sources below rather than this text.

## Design architecture: the DNA helix

The design system is a double helix. Read it live, not from memory:

```bash
curl -s https://api.mzizi.dev/v1/architecture          # nodes, rungs, strands
curl -s https://api.mzizi.dev/v1/architecture/nodes/7  # one node, with its rules
```

On the MCP, call `mzizi_get_architecture`, or `mzizi_get_architecture node=7` for one node. The
node number is uncapped, so never assume a range.

**Eight nodes.** These are the backbone, and each owns one kind of thing:

| Node | Name             | Owns                                                            | Strand         |
| ---- | ---------------- | --------------------------------------------------------------- | -------------- |
| N1   | Design tokens    | the only node allowed to define CSS values                      | swappable      |
| N2   | Primitives       | the smallest composable unit of UI                              | core-guarantee |
| N3   | Brand components | primitives wrapped in Ubuntu, the only consumers of the harness | shipped        |
| N4   | Safety rails     | input validation, output sanitisation, AI guardrails            | core-guarantee |
| N5   | Resilience       | circuit breakers, retries, timeouts, fallback chains            | core-guarantee |
| N6   | Pages            | composition of N2 and N3, implementing nothing                  | shipped        |
| N7   | Shell            | the app chrome: header, footer, navigation, theme, mounted once | shipped        |
| N8   | Assurance        | observability, health monitoring, SLO tracking                  | core-guarantee |

**Four rungs.** These bridge both backbones: N9 Fundi (self-healing: it consumes N8 signals and
files structured issues for people, and never auto-merges), N10 Documentation, N11 Discovery
(SEO and AIO, preview images, structured data, agent-readiness) and N12 Skills (this bundle).

**Six strands.** Four belong to the engineering backbone: `core-guarantee` (travels unchanged
and cannot be turned off), `shipped` (in the box, but free to evolve), `swappable` (the only fork
seams: tokens, icons and the framework) and `spine`. Two belong to the meaning backbone:
`genetic-code` and `transcription` ("Doctrine is data, not tribal knowledge").

What a placement obliges, from the nodes' own implementation rules:

- **N1 only defines values.** No hex, `rgba()` or inline style outside N1. Everything else reads
  `var(--…)` or its platform equivalent.
- **N6 composes and implements nothing.** A page imports from N2 and N3, never defines a
  primitive, and pulls a spinner or skeleton from N2 rather than inlining one. Pages render on
  the server by default (Astro, no client JavaScript).
- **N7 is singular.** There is one shell per app. It is the only place that holds sticky
  positioning, backdrop blur and theme-provider wiring. It surfaces auth state and never
  implements auth logic. It is responsive from 320px up.
- **N4, N5 and N8 are core guarantees.** You cannot configure accessibility, safety,
  resilience or observability away.

Do not confuse the helix with the five application layers below. They are two models with two
numberings, so never quote a count from one while describing the other.

## App architecture: the shell comes first

The failure this section exists to stop is apps built page by page with no shell installed. Each
one then hand-rolls its own header, nav and footer, drifts from every other app, and loses the
no-JS, density, accessibility and brand-overlay guarantees the shell's contract carries.
**Step one of any new app is the shell.** Step one of any new page in an existing app is to
confirm the page renders inside it.

### 1. Pick the shell from the kind of surface

| Surface                                              | Shell                                    | Standard                                                                   | Contract                            |
| ---------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| A signed-in app, console or admin surface            | `@bundu/ui/app/AppShell.astro`           | Mzizi Dashboard Standard (docs.mzizi.dev/patterns/dashboard-standard)      | `contracts/app/app-shell`           |
| A public discover or browse site (the Mukoko family) | `@bundu/ui/discover/DiscoverShell.astro` | Mzizi Discover Standard (docs.mzizi.dev/patterns/discover-standard)        | `contracts/discover/discover-shell` |
| A marketing site                                     | none yet: see "Gaps" below               | the `site/` components (`Hero`, `Section`, `Container`, `MineralStrip`, …) | no shell contract                   |

Read the shell's contract before you wire it. The props, slots, `noJs`, `density` and `theming`
there are the specification. On the MCP that is `mzizi_get_component app-shell`, and in the
package, `@bundu/ui/contracts/app/*`.

### 2. Install it (Astro, the default)

```bash
npm install @bundu/ui          # 0.7.0 or later
```

Import the tokens and your brand's overlay (colour and mark only) in your global stylesheet, as
the `mzizi-design` skill says. Then describe the navigation as data and wrap **every**
signed-in page in one layout that mounts `AppShell`:

```astro
---
// src/layouts/App.astro: the one layout every signed-in page uses
import AppShell from "@bundu/ui/app/AppShell.astro";
import { nav } from "../nav";                      // navigation as data, not markup
const { title } = Astro.props;
---
<AppShell nav={nav} accent="gold" footerLinks={[{ label: "Status", href: "/status" }]}>
  <slot />
</AppShell>
```

A public discover page puts `DiscoverMeta` in `<head>` and `DiscoverShell` in `<body>`, then
`DiscoverHero`. The Discover Standard page has the full order.

Then build pages from the patterns, never from scratch. For a dashboard, that means
`PageHeader` first, then `Toolbar` or `FilterBar`, then `StatTiles`, then content in `Card`,
`DataTable`, `FormLayout`, `EmptyState` or `DetailPanel`. For discover pages, that means
`DiscoverSection`, `ResultGrid`, `DetailHero` and `RelatedRail`.

### 3. Check that the shell is there

Run this before you add a page, and in review. An app passes when each line holds:

```bash
# The shell is a dependency.
grep -E '"@bundu/ui"' package.json
# Exactly one layout mounts it.
grep -rlE 'AppShell|DiscoverShell' src/layouts
# Every page uses that layout. List the pages that do not:
grep -rL -E 'layouts/(App|Discover)' src/pages --include='*.astro'
# No page hand-rolls chrome the shell owns.
grep -rnE '<(header|nav|footer)[ >]' src/pages
```

Any page the third command prints, and any match from the fourth, is a page outside the shell.
Move it into the layout. A shell that is missing entirely means step 2 was skipped, so install
the shell before anything else.

### 4. Structure the app's own code: five layers, imports flow down

These layers are local to one application (docs.mzizi.dev/patterns/architecture). They are not
the helix:

| Layer | What it holds                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------- |
| L1    | Shared primitives, installed from the registry and never edited in place                          |
| L2    | Domain composites built only from L1, the first layer that knows what the app is about            |
| L3    | Page sections that arrange L2. They arrange and do not implement                                  |
| L4    | Error boundaries and loading states around every L3 section, so one failure never blanks the page |
| L5    | Routes: data fetching and composition, inside the shell. This is where the network lives          |

A component imports from the layer below, never sideways or upward.

### 5. A React or Rust app

- **React (Next.js) adopts through the registry's `.tsx` builds.** AppShell and DiscoverShell
  have `.tsx` siblings that implement the same contract:
  `npx shadcn@latest add https://api.mzizi.dev/v1/ui/app-shell`. Always give the full URL. A bare
  name installs shadcn's own component and reports success.
- **Rust.** `mzizi-shell` (in `mzizi-roots`) carries N7 parts such as the bottom nav, footer,
  command palette, connectivity bar, theme provider, route guard and deep links. **It has no
  AppShell or DiscoverShell.** Both contracts have `rs: null`. A Rust or Astro-with-Roots app
  takes the shell from `@bundu/ui` and renders Roots components inside it. Do not write a Rust
  shell in an app. See the gaps below.

### Gaps: report them upstream, do not paper over them

These were found in the registry at v4.18.0 and are tracked in mzizi-registry#589:

- AppShell and DiscoverShell have no Rust build (`rs: null`), and `mzizi-shell` documents that
  `mzizi-header` and `mzizi-sidebar` wait on N2 ports.
- No shell contract exists for marketing sites (`site/` has no `site-shell`). The N6 doctrine
  names a "Site Standard", but docs.mzizi.dev has no page for it.

When you hit one of these, open or comment on the registry issue instead of building a local
shell.

## System architecture

What runs where, and who owns what. **Decided** and **built** are different words. Say which one
applies.

- **Rust first, Astro for the UI.** Astro is the default web UI. Underneath, the code is Rust
  first and TypeScript second, and Mzizi's own surfaces have no third UI framework. Components
  are Mzizi Roots (Rust) where a Rust build exists and the React build otherwise, with React
  deprioritised. No Dioxus, Leptos or Yew in new work. The Roots crates still depend on Dioxus
  until the move to Mzizi's own `render(props)` finishes.
- **Cloudflare Workers** run the services: `api.mzizi.dev` (`mzizi-dev/mzizi-api`, a Hono
  Worker), `mcp.mzizi.dev` (`mzizi-mcp`) and fundi. Containers and bare metal are decided as
  further targets and are not built. The `mzizi-backend` skill has the patterns.
- **Four API gateways.** The Mzizi API (`api.mzizi.dev`, Hono, built), the Nyuchi API (B2B), the
  Mukoko API (consumer) and the Nyuchi Servers API (internal). It is decided that the last three
  are Rust. An app reads through its gateway and never opens a database connection of its own
  for a read the gateway serves. Add the endpoint to the gateway instead.
- **The registry's files are its data layer.** `registry.json`, `components/`, `contracts/` and
  `content/doctrine/` are bundled into the API and the MCP at a pinned registry commit (the
  `x-mzizi-source` header and `catalogue.json` name it). Nothing is read from a database at
  request time. Only the console keeps state, and its move to Cloudflare D1 is decided, not
  built.
- **One owner per domain.** Platform data lives in domain-separated databases (news,
  engagement, identity, entity, places, …). Each is written only by the service that owns it,
  and other services reference its records by id rather than copying them. Doctrine is data:
  read `mzizi_get_doctrine`, never a copy in a prompt.
- **Trust is two things.** Assurance levels and attestations come from the one access decision
  in nyuchi-api `gateway/lib/assurance.py`. Read that decision rather than deriving your own,
  and draw them with the `--assurance-*` and `--attestation-*` roles in `mzizi-design`.
- **Every surface is free by default.** Gate only what acts as a person: WorkOS sign-in, with
  401 for a missing token and 403 for a token that lacks the scope.
- **Failures become issues.** N8 signals feed fundi (N9), which files deduplicated GitHub
  issues for people and never merges a fix itself.

## Checklist for a new app or page

- [ ] Helix placement decided, and its node's rules read live.
- [ ] Shell chosen from the surface table, its contract read, and `@bundu/ui` installed.
- [ ] One layout mounts the shell, and every page uses it (the check in step 3 prints nothing).
- [ ] Pages built from the Standard's patterns, with no hand-rolled header, nav or footer.
- [ ] Tokens and brand overlay from `mzizi-design`. No local colour, radius, spacing or type.
- [ ] Data read through the owning gateway. No new direct database read.
- [ ] Anything missing or wrong in the registry raised upstream, with any local stopgap marked
      `TODO(mzizi): <PR URL>`.

## See also

- `mzizi-design`: tokens, brand overlays, Apple HIG and where Mzizi overrides it, and the 44px
  touch floor with the desktop density layer.
- `mzizi-roots`: the components, Rust first. "Starting an app" covers project setup, and
  "Contributing a component" covers adding one upstream.
- `mzizi-backend`: Workers and MCP servers.
- `discoverability`: N11 in practice, covering OG images, structured data and agent-readiness.
