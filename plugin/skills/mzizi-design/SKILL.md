---
name: mzizi-design
description: Use this skill for the Mzizi design system and brand — generating well-branded interfaces (production or prototype), design tokens, and ecosystem-level work. Contains the canonical 21-family Mzizi palette (seven African Minerals + seven Heritage tones + the Experimental Seven) with generated stylesheets (tokens/palette.css, tokens-update.css), the radius scale, Noto Sans/Serif + JetBrains Mono type, pill buttons and the 48px touch floor, status and surface tokens, the verified brand constellation (every brand's mineral, voice, meaning, URL), the ecosystem identity (copper), the five Ubuntu pillars + five principles, what is and isn't an ecosystem app, and the wordmarks.
user-invocable: true
---

# Mzizi design — the system and the ecosystem

This skill replaces three 0.7.0 skills: `nyuchi-design` (UI and tokens, now "The design
system" below), the Ubuntu and ownership half of `ecosystem-app-setup` (now "What belongs in
the ecosystem"), and the tokens of `mukoko-design`, which moved here. The mukoko brand assets
(the Swarm mark, logos, icons) are no longer in this package; they move to a Nyuchi-owned
bundle.

## Files this skill ships

All generated from `palette.canonical.json` at the package root by
`scripts/generate-tokens.mjs`, and gated against it. Never hand-edit them; never retype a hex.

| File                   | Contents                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `tokens/palette.css`   | all 21 families, light + dark, as CSS custom properties                                              |
| `tokens/palette.json`  | all 21 families, machine-readable                                                                    |
| `tokens/minerals.css`  | the seven minerals only                                                                              |
| `tokens/minerals.json` | the seven minerals only, machine-readable                                                            |
| `tokens-update.css`    | all 21 families (light, dark, `.dark`, `prefers-color-scheme`) plus the radius scale, as one drop-in |

## The ecosystem

**Mzizi** is the parent identity at the ecosystem level — the framework, the design language, the
component registry and the open doctrine every brand builds on. Everything revenue-generating (the
Mzizi console, fundi, paid plans, billing) is Nyuchi's. Three pillars: **mukoko** (consumer super app), **nyuchi** (infrastructure &
enterprise), and the **sister brands** (specialist verticals) — one identity, one design system, one
open data commons.

Doctrine **v4.1.0**. **The repo is the source of truth, and there is no database.** Colour
comes from `palette.canonical.json` at the root of this package — 21 families, vendored from
`mzizi-dev/mzizi-registry → lib/tokens/palette.source.ts` and gated against it. The ecosystem
constellation and the Ubuntu pillars and principles come from `mzizi-registry →
content/doctrine/`, served at <https://api.mzizi.dev/v1/brand> (`.ecosystem`, `.philosophy`) and
by the MCP as `mzizi_get_tokens` (`family: "ecosystem"`) and `mzizi_get_doctrine`. Two notes:
principles were renamed in v4.x, so use the set below and not older Shona-named lists; and the
registry still names its ecosystem-layer entry `bundu` (URL **bundu.org**). That is registry
data, and it changes in mzizi-registry, not here.

The **five** pillars and **five** principles below are a count of Ubuntu doctrine, not of the
palette, and they are correct — `/v1/brand` `.philosophy.ubuntuPillars` serves exactly these five.
Do not "fix" them to seven to match the colour families.

### The ecosystem-level identity

- **Mineral:** `copper` — `#BF5A36` light / `#FF8A65` dark (`--color-copper`) · connection, foundation, stewardship
- **Registry entry:** `bundu` in `/v1/brand` `.ecosystem` (meaning _wilderness_, Shona) · **URL:** <https://bundu.org>
- **Voice:** visionary, grounded, inclusive
- **Role:** the ecosystem — the layer that holds the whole, the commons, governance, philosophy
- **Wordmark:** `Mzizi`, capitalised, Noto Serif 600. (The other wordmarks stay lowercase.)
- **No standalone ecosystem-level logo mark is registered in the registry yet** — that's an open identity
  item. Until one exists, ecosystem-level materials use the wordmark in copper, optionally with
  Mukoko's Swarm mark (a Nyuchi asset, not in this package) when the subject is the product family. Don't invent an ecosystem mark ad hoc.

### The brand constellation (verified, v4.1.0)

Every brand owns a mineral and a voice. Theme each brand's surfaces and copy in **its own** mineral
and register — never default everything to tanzanite.

| Brand        | Role                        | Mineral    | Meaning    | Voice                                  |
| ------------ | --------------------------- | ---------- | ---------- | -------------------------------------- |
| **bundu**    | The ecosystem               | copper     | Wilderness | visionary, grounded, inclusive         |
| **nyuchi**   | Infrastructure & enterprise | gold       | Bee        | technical, reliable, industrious       |
| **mukoko**   | Africa's super app          | tanzanite  | Beehive    | welcoming, structured, protective      |
| **shamwari** | Sovereign AI companion      | sodalite   | Friend     | helpful, warm, intelligent             |
| nhimbe       | Events & gatherings         | malachite  | Gathering  | celebratory, communal, vibrant         |
| bushtrade    | Marketplace                 | gold       | Bush trade | practical, trustworthy, local          |
| lingo        | Language learning           | cobalt     | Language   | encouraging, cultural, playful         |
| campfire     | Platform messaging anchor   | malachite  | Campfire   | direct, warm, always present           |
| bytes        | Short-form creator video    | tanzanite  | Bytes      | energetic, creative, youthful          |
| novels       | Publishing platform         | malachite  | Novels     | literary, thoughtful, immersive        |
| places       | Geographic knowledge graph  | gold       | Places     | authoritative, helpful, discoverable   |
| transport    | Public transit & booking    | gold       | Transport  | efficient, reliable, practical         |
| planner      | Productivity hub            | cobalt     | Planner    | organised, clear, supportive           |
| wallet       | Payments & tokens           | gold       | Wallet     | trustworthy, precise, secure           |
| pulse        | Feed & Mukoko Home          | tanzanite  | Pulse      | personal, adaptive, ambient            |
| health       | Wellness & telemedicine     | malachite  | Health     | caring, accurate, private              |
| circles      | Community messaging         | terracotta | Circles    | inclusive, moderated, community-driven |

The `bundu` row is the ecosystem layer as `/v1/brand` serves it today; the table mirrors the
registry, so it changes when mzizi-registry renames the entry.

The narrative spine: **nyuchi is the bee, mukoko is the hive, Mzizi is the root everything
grows from.** Use this when explaining the ecosystem — it is the one-sentence architecture.

### Ubuntu as identity (live doctrine)

Mzizi carries the philosophy. _Ndiri nekuti tiri_ — I am because we are.

**Five Pillars** (spheres of belonging): **family** (the household and kin, the primary web of
belonging) → **community** (neighbours, peers, chosen kin) → **society** (the broader human web —
strangers, institutions, the polity) → **environment** (the natural world that holds all
relationships; Ubuntu is ecological before it is social) → **spirituality** (the vertical
dimension — meaning, purpose, ancestry, the sacred).

**Five Principles** (operating rules): **survival** (collective endurance — no one survives alone) ·
**solidarity** (firm, persevering commitment to the common good) · **compassion** (active care shown
through helping, sharing, welcoming) · **respect** (unprejudiced consideration of another's
privileges, beliefs, norms — includes elder-respect) · **dignity** (inherent worth by virtue of
existence, irrespective of status or background).

In ecosystem materials, philosophy is **structural, not decorative**: name a pillar/principle only
when the feature or message genuinely embodies it.

### Rules for ecosystem-level work

- **Wordmarks:** `Mzizi` is capitalised. Every other wordmark is lowercase: `nyuchi`, `mukoko`,
  `shamwari`, `bundu`, `nhimbe` and every sister brand.
- **Copper accents** signal "this is the ecosystem speaking" (parent-level pages, governance,
  commons, manifesto-register material).
- **Cross-brand layouts:** lead with the brand that owns the message; bring in the constellation
  table's minerals when showing the family together (each brand in its own mineral).
- **Voice shifts with the speaker.** An ecosystem-level page is visionary/grounded/inclusive; the same content
  on mukoko.com becomes welcoming/structured/protective. Don't copy-paste tone across brands.
- Cultural specificity is non-negotiable: Shona vocabulary and Zimbabwean grounding are structural.
- All UI tokens (radius, type, spacing, surfaces, status colours) are under "The design system"
  below. Mukoko's logo and assets are Nyuchi's and are not in this package.
- **Every brand owns a mineral, but the palette is not only minerals.** A cross-brand piece has 21
  families to draw on — seven minerals, seven Heritage tones, the Experimental Seven. Use the
  minerals to say _who is speaking_; use Heritage for atmosphere and surface, and the Experimental
  Seven for categorical sets that would otherwise stretch a mineral past its meaning.

## The design system

> **Doctrine v4.1.0. The canonical palette ships with this package.**
> `palette.canonical.json` at the root of `@nyuchi/mzizi-skills` states all **21 colour
> families** — seven African Minerals, seven Heritage tones, the Experimental Seven — and
> every token file in this bundle is generated from it and gated against it. Read it, or the
> stylesheets generated from it (`tokens-update.css` and `tokens/palette.css` here). Do not retype hex values out of this prose into a project.
>
> Canon upstream is `mzizi-dev/mzizi-registry → lib/tokens/palette.source.ts`, served publicly
> at <https://api.mzizi.dev/v1/brand> and by the MCP as `mzizi_get_tokens`. There is no
> database: the registry's files are the data layer.
>
> **Colour is derived and gated. Everything else on this page is hand-maintained** —
> typography, spacing, radius, sizes, motion, shadow, z-index and the semantic set. The
> radius scale and control sizes were checked against `mzizi-registry` `main` for 0.8.0;
> confirm the rest with `mzizi_get_tokens` (`typography`, `spacing`, `radii`, `semantic`,
> `componentSpecs`) if precision matters.

### Rules that are non-negotiable

- **Wordmarks** — `Mzizi` is capitalised. `mukoko`, `nyuchi`, `bundu`, `shamwari`, `nhimbe`, `bushtrade` are lowercase, always.
- **The palette is 21 families: seven Minerals + seven Heritage + the Experimental Seven.** Any interface that uses only the minerals is using a third of the system. Do not describe it as "the seven-colour palette".
- **Seven African Minerals** (geological, the core palette). The custom properties are `--color-<mineral>`, `--color-<mineral>-container`, `--color-<mineral>-on-container` — those are the names the design system defines. (`--container-<mineral>` / `--on-container-<mineral>` appeared in earlier revisions of this skill and are defined nowhere upstream; `tokens-update.css` now ships them as aliases so existing work keeps rendering, but do not reach for them in new code.)
  - `cobalt` — primary blue, links, CTAs · digital future, trust
  - `tanzanite` — **mukoko's brand mineral**, social features · premium, connection
  - `malachite` — success states, positive actions · growth
  - `gold` — achievements, rewards, highlights · honey, warmth
  - `terracotta` — community features · earth, grounding
  - `sodalite` — **AI / Shamwari surfaces, deep-reasoning states** · intelligence, depth _(added v4.1.0)_
  - `copper` — **Bundu ecosystem identity, the commons** · connection, stewardship _(added v4.1.0)_
- **Seven Heritage tones** (atmospheric anchors — mini-app surfaces, backgrounds, moods; no family or role): `indigo` (dusk, the dyer's craft) · `savanna` (sun-dried grass, the dry season) · `baobab` (the tree of life, bark, shelter) · `sunset` (day's end, the gathering hour) · `river` (flow, the journey) · `hematite` (the neutral anchor, the substrate) · `kalahari` (the light anchor, openness). Reach for them via `--color-<name>` (aliasing `--heritage-<name>`); values are in `palette.canonical.json`. _(Two earlier framings are withdrawn: the ten-colour one from before the palette settled, and the two-anchor one that survived into v0.5.1 of this bundle. **There are seven.** A skill that named two produced two-tone output in projects that had never seen each other.)_
- **The Experimental Seven** — a computed heptagon (hues offset 17°, prime saturations, foregrounds solved to P7), each tone carrying a `heptagonIndex` 0–6 that fixes its place on the wheel: `ember` · `acacia` · `fern` · `lagoon` · `storm` · `dusk` · `protea`. Four tiers each: `--exp-<name>`, `--exp-<name>-container`, `--exp-<name>-on`, `--exp-<name>-ui`. Use them for generated/wheel-derived surfaces and categorical sets where the minerals would have to be stretched past their meanings.
- **Each brand owns a mineral** (the ecosystem map, verified v4.1.0 and served at `/v1/brand` as `.ecosystem`): bundu→**copper**, nyuchi→**gold**, mukoko→**tanzanite**, shamwari→**sodalite**, nhimbe/campfire/novels/health→malachite, lingo/planner→cobalt, bushtrade/places/transport/wallet→gold, bytes/pulse→tanzanite, circles→terracotta. Theme a surface in its brand's mineral — never default everything to tanzanite.
- **Buttons are ALWAYS pill** (`rounded-full` → `--radius-full`, 9999px). Inputs match buttons visually.
- **Nothing tappable goes below 48px.** Buttons are `h-14` (56px) default and large, `h-12` (48px) small; icon buttons `size-14` / `size-12`. Inputs are 56px default, 48px small. That is what `button.tsx`, the Roots `button.rs` and the language's `primitives/button.mz` all ship, and what `/v1/brand` `.componentSpecs` serves (`minTouchTarget: 48`). (0.7.0 of this skill said controls were dense, 32/36/40px, with 56px only for hero CTAs. The shipped primitives do not do that, so that rule described a system that does not exist.) Badges are 20px tall and are not touch targets; a small element that becomes one gets `min-h-[48px]`.
- **Radius scale** (px), every step from a 7px unit: `sm` 7 · `md` 12 · `lg` 14 (**DEFAULT** cards/panels) · `xl` 17 · `2xl` 17 · `full` 9999 (pills). That is `mzizi-registry/app/globals.css`, the Rust `mzizi-tokens` `Radius`, and `/v1/brand` `.radii` ("ecosystem numbers: 7, 12, 14, 17"). Checkboxes use `sm`, inputs and small cards `md`, cards and panels `lg`, modals, sheets, dialogs and tabs `xl`. Reference via `--radius-<name>`. (Until 0.8.0 this skill also listed `none` 0, `xs` 4 and `2xl` 24; none of those is defined upstream.)
- **H1–H3 are Noto Serif. H4+ and body are Noto Sans. Code is JetBrains Mono.**
- **Rings over shadows.** Cards get `ring-1` of `--border`, not a drop shadow.
- **No gradients, no glassmorphism** except sticky chrome (`backdrop-blur`).
- **Emoji only as mini-app identifiers**, never as chrome or body decoration.
- **Status has its own names: `--status-success` / `--status-warning` / `--status-error` / `--status-info` / `--status-neutral`.** Use those names and do not hardcode a hex. Upstream they alias `--success` / `--warning` / `--destructive` / `--info` / `--neutral`, so there is one decision per status — which means the resolved values are mineral-derived in the shipped theme (success reads as malachite, info as cobalt), not the standalone #22C55E/#F59E0B/#EF4444/#3B82F6 set an earlier revision of this skill listed. Those hexes are the per-component `var(--token, #hex)` fallback for an app that has not defined the properties; they are not the theme. Severity scale (`--severity-low/moderate/high/severe/extreme/cold`) and connection (`--connection-online/syncing/cached/offline`) follow the same logic. Verification tiers are the only place minerals carry status meaning (community→malachite, otp→cobalt, government→tanzanite, licensed→gold).
- **Surfaces (April 2026 AAA refresh):** light mode — `--background` warm paper, `--card` pure white, `--muted` cream, `--overlay` white. Dark mode — `--background` warm stone L10%, `--card` L6% (darker than bg), `--muted` L2% (deepest), `--overlay` L14% (lighter than bg, scrim creates pop).
- **Icons:** in the React build, Lucide through `@/lib/icons`, never `lucide-react` directly; in Mzizi Roots, an icon is an `Element` slot the host renders. For an HTML prototype, the Lucide CDN build is fine.
- **APCA 3.0 AAA contrast** on both primary and secondary text on every surface.

### When creating visual artifacts

Create static HTML files for the user to view. `@import` `tokens-update.css` at the top of every HTML file (or inline it). For slide decks use a mineral accent strip and serif display type.

### When working on production code

Use the registry's components, never hand-rolled copies. **Rust first:** Mzizi Roots is the lead build (`cargo add mzizi-roots`; see the `mzizi-roots` skill). The React build installs by absolute URL, for existing React apps:

```bash
npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>
```

Take CSS variables from `tokens-update.css` or `tokens/palette.css` in this skill — it is generated from `palette.canonical.json` and carries all 21 families. The upstream equivalent is `mzizi-registry/app/globals.css`, which is generated from the same canon. There is no database to refresh from.

## What belongs in the ecosystem

### Ubuntu alignment

The ecosystem is built on Ubuntu — "I am because we are." When you architect a new app:

- Prefer open source over proprietary
- Build for community, not extraction
- Respect data sovereignty — African data stays on African infrastructure where possible
- Accessibility is not an afterthought; it is the starting point
- Every feature should contribute to collective wellbeing, not just individual efficiency

These aren't marketing claims, they're architectural constraints. If you find yourself
designing something that only benefits a small subset of users at others' expense, question
whether it belongs in the ecosystem.

### What is and isn't an ecosystem app

The ecosystem has two layers. **Mzizi** owns and operates the framework, the language, the
registry, the design system, the docs and the API, and sits under every app. **Nyuchi Africa**
operates the Mzizi console and everything revenue-generating. Inside Nyuchi Africa
sit three pillars and the platform:

- **mukoko** — the consumer pillar: the super-app (social, commerce, payments, identity)
- **nyuchi** — the commercial/infrastructure pillar and the platform (web services, developer
  tools, storage)
- **shamwari ai** — the intelligence pillar, sovereign by nature (on-device inference,
  pod-resident context, no third-party AI vendor)
- **nhimbe** — cooperative economic features

Mzizi is not an app and not a layer in a stack; it is the open, non-revenue foundation the
ecosystem builds on and the doctrine that governs it. mukoko and shamwari ai are pillars inside Nyuchi Africa, not separate companies.

Not ecosystem apps:

- Any app that extracts value without giving back
- Any app that requires surveillance for its business model
- Any app that centralises what should be federated

If the app you're building doesn't fit, that's fine — consume the Mzizi design system, but
don't brand it as ecosystem.

## If invoked with no other guidance

Ask what the work is: (a) an interface or prototype (which surface: mobile, desktop, print,
slide; which brand voice: Mzizi, nyuchi, mukoko, shamwari, nhimbe), (b) parent-brand material
(ecosystem page, manifesto, deck), (c) a cross-brand piece, or (d) a voice or mineral decision
for one brand. Then apply the constellation table, the voice rules and the design system, and
output HTML artifacts or production code as the need requires.

_Mzizi — the root everything grows from._
