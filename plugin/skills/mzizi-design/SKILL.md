---
name: mzizi-design
description: "Use this skill for the Mzizi design system and brand: generating well-branded interfaces (production or prototype), design tokens, and ecosystem-level work. Contains the canonical 21-family palette (seven African Minerals, seven Heritage tones, the Experimental Seven) with stylesheets (tokens/palette.css, tokens-update.css), the radius scale, Noto Sans/Serif and JetBrains Mono type, pill buttons, the Bundu floor (17px body and 45px hit region on touch, 15px and 24px on a desktop, 14px captions, 1.5 leading), the spacing layers with dense floors and the number rule, and the density layer, 7:1/4.5:1/3:1 contrast, status and surface tokens, the Dashboard and Discover Standards' brand overlays (colour and mark only), the verified brand constellation (each brand's mineral, voice, meaning, URL), the five Ubuntu pillars and principles, what is and isn't an ecosystem app, and the wordmarks. Also covers Apple's HIG as the baseline: touch targets, spacing, type, colour, pills, density."
---

# Mzizi design — the system and the ecosystem

This skill replaces three 0.7.0 skills: `nyuchi-design` (UI and tokens, now "The design
system" below), the Ubuntu and ownership half of `ecosystem-app-setup` (now "What belongs in
the ecosystem"), and the tokens of `mukoko-design`, which moved here. mukoko's brand files (the
Swarm mark, the app icon, favicons, the lockup and backgrounds) are in the `mukoko-design` skill,
restored in 0.15.0.

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

**The Bundu Foundation is the umbrella** (owner, 2026-11-17; the canonical record is
`bundu-labs/bundu-standards` → `ecosystem/ecosystem.yaml`). Under it sit **four pillars**:
**Bundu Labs** (the Foundation's research arm), **Nyuchi Africa** (platform and infrastructure,
and the company that builds and sells), **mukoko** (the hive and the consumer pillar: one
platform with apps inside it, a super app plus standalone apps in specific domains; a pillar of
Bundu and a product of Nyuchi Africa, built and operated by Nyuchi, and the proof that what is
researched reaches production, is used by people, and that the infrastructure works) and
**shamwari ai** (the ranger in the wilderness, guiding and managing things; both a pillar and a
Foundation project; it runs on Nyuchi and Nyuchi sells it). The **.cell** (one entity's data
store, one record per person, household or business) is a Bundu Labs project that maps directly
to SiafuDB; its repository is `siafuDB/cell`. The specialist brands
(events, bushtrade, lingo and the rest of the constellation) are **Mukoko apps**. **Mzizi** — the language, its toolchain, the design language,
the component registry and the open doctrine every brand builds on — is owned by the Foundation
and built by Nyuchi. Everything revenue-generating (the Mzizi console, fundi, paid plans,
billing) is Nyuchi's. One identity, one design system, one open data commons.

Doctrine **v4.1.0**. **The repo is the source of truth, and there is no database.** Colour
comes from `palette.canonical.json` at the root of this package — 21 families, vendored from
`mzizi-dev/mzizi-registry → lib/tokens/palette.source.ts` and gated against it. The ecosystem
constellation and the Ubuntu pillars and principles come from `mzizi-registry →
content/doctrine/`, served at <https://api.mzizi.dev/v1/brand> (`.ecosystem`, `.philosophy`) and
by the MCP as `mzizi_execute get_tokens` (`family: "ecosystem"`) and `mzizi_execute get_doctrine`. Two notes:
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
  Mukoko's Swarm mark (the `mukoko-design` skill) when the subject is the product family. Don't invent an ecosystem mark ad hoc.
- **Copper is the ecosystem layer, not Mzizi's own surfaces.** mzizi.dev, docs.mzizi.dev, the
  registry and the language are the `mzizi` row of the constellation below: theme them in
  **hematite** (owner decision, 2026-09-30). Keep copper for material where the ecosystem as a
  whole speaks: governance, the commons, the manifesto register.

### The brand constellation (verified, v4.1.0)

Every brand owns a mineral and a voice. Theme each brand's surfaces and copy in **its own** mineral
and register — never default everything to tanzanite.

| Brand        | Role                                        | Mineral    | Meaning    | Voice                                  |
| ------------ | ------------------------------------------- | ---------- | ---------- | -------------------------------------- |
| **bundu**    | The ecosystem                               | copper     | Wilderness | visionary, grounded, inclusive         |
| **nyuchi**   | Infrastructure & enterprise                 | gold       | Bee        | technical, reliable, industrious       |
| **mukoko**   | Africa's super app                          | tanzanite  | Beehive    | welcoming, structured, protective      |
| **shamwari** | AI companion; the ranger                    | sodalite   | Friend     | helpful, warm, intelligent             |
| **Mzizi**    | The root: language, registry, design system | hematite ¹ | Root       | precise, honest, grounded              |
| events       | Events & gatherings (Mukoko Events)         | malachite  | Gathering  | celebratory, communal, vibrant         |
| bushtrade    | Marketplace                                 | gold       | Bush trade | practical, trustworthy, local          |
| lingo        | Language learning                           | cobalt     | Language   | encouraging, cultural, playful         |
| campfire     | Platform messaging anchor                   | malachite  | Campfire   | direct, warm, always present           |
| bytes        | Short-form creator video                    | tanzanite  | Bytes      | energetic, creative, youthful          |
| novels       | Publishing platform                         | malachite  | Novels     | literary, thoughtful, immersive        |
| places       | Geographic knowledge graph                  | gold       | Places     | authoritative, helpful, discoverable   |
| transport    | Public transit & booking                    | gold       | Transport  | efficient, reliable, practical         |
| planner      | Productivity hub                            | cobalt     | Planner    | organised, clear, supportive           |
| wallet       | Payments & tokens                           | gold       | Wallet     | trustworthy, precise, secure           |
| pulse        | Feed & Mukoko Home                          | tanzanite  | Pulse      | personal, adaptive, ambient            |
| health       | Wellness & telemedicine                     | malachite  | Health     | caring, accurate, private              |
| circles      | Community messaging                         | terracotta | Circles    | inclusive, moderated, community-driven |
| kweli        | Trust and verification                      | malachite  | Truth      | honest, rigorous, reassuring           |
| learning     | Education (Nyuchi Learning)                 | gold       | Learning   | patient, practical, encouraging        |
| news         | News and journalism                         | cobalt     | News       | clear, credible, balanced              |
| weather      | Weather and alerts                          | cobalt     | Weather    | calm, precise, timely                  |

The `bundu` row is the ecosystem layer as `/v1/brand` serves it today; the table mirrors the
registry, so it changes when mzizi-registry renames the entry. The last four rows joined canon
on 2026-10-04 (owner decisions, mzizi-registry #409): kweli is malachite (it used to borrow
Mukoko's tanzanite), news and weather are cobalt, and **learning is gold** because every Nyuchi
brand is gold. The education industry category follows it: education is gold, not cobalt.

The `events` row is **Mukoko Events**, at `events.mukoko.com` (owner decision,
2026-10-04). The _nhimbe_ brand is retired. `nhimbe` survives only as a deprecated alias of
`events`: canon still resolves it, and `brand-nhimbe.css` re-exports `brand-events.css`, so
nothing that names it breaks. New work names `events` and writes "Mukoko Events" in copy. The
mineral is unchanged: malachite.

¹ **Mzizi's brand colour is hematite, and hematite is a Heritage tone, not one of the seven
minerals** (owner decision, 2026-09-30). `/v1/brand` serves it in `.ecosystem` as
`{"name": "mzizi", "meaning": "Root", "language": "Swahili", "mineral": "hematite"}` and lists
hematite under `.heritage`, not `.minerals`: the field is called `mineral`, but it names a
palette family, usually a mineral. Mzizi owns and operates the language, the registry, the design
system, the docs and the API; `/v1/brand` gives its role as "Language, registry and design
system", and its voice as "Precise, honest, grounded". A Mzizi surface takes its primary from
hematite, as the shipped stylesheets do: `@bundu/ui`'s `brand-mzizi.css` (which mzizi.dev uses)
sets `--primary` to `var(--color-hematite)`, and the registry's `mzizi-tokens-globals.css`
defaults `--primary` to `var(--heritage-hematite-aa)`. Not gold (nyuchi's), not tanzanite (mukoko's), not copper (the
ecosystem layer's). Take the values from `palette.canonical.json` (`hematite`, Heritage).

The narrative spine: **bundu is the wilderness, shamwari is the ranger, nyuchi is the bee,
mukoko is the hive, Mzizi is the root everything grows from.** Use this when explaining the ecosystem — it is the one-sentence architecture.

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
  `shamwari`, `bundu` and every Mukoko app.
- **Copper accents** signal "this is the ecosystem speaking" (parent-level pages, governance,
  commons, manifesto-register material).
- **Cross-brand layouts:** lead with the brand that owns the message; bring in the constellation
  table's minerals when showing the family together (each brand in its own mineral).
- **Voice shifts with the speaker.** An ecosystem-level page is visionary/grounded/inclusive; the same content
  on mukoko.com becomes welcoming/structured/protective. Don't copy-paste tone across brands.
- Cultural specificity is non-negotiable: Shona vocabulary and Zimbabwean grounding are structural.
- All UI tokens (radius, type, spacing, surfaces, status colours) are under "The design system"
  below. Mukoko's logo and assets are in the `mukoko-design` skill.
- **Every brand owns a mineral, but the palette is not only minerals.** A cross-brand piece has 21
  families to draw on — seven minerals, seven Heritage tones, the Experimental Seven. Use the
  minerals to say _who is speaking_ (and hematite when Mzizi is); use Heritage for atmosphere and surface, and the Experimental
  Seven for categorical sets that would otherwise stretch a mineral past its meaning.

## The design system

> **Doctrine v4.1.0. The canonical palette ships with this package.**
> `palette.canonical.json` at the root of `@nyuchi/mzizi-skills` states all **21 colour
> families** — seven African Minerals, seven Heritage tones, the Experimental Seven — and
> every token file in this bundle is generated from it and gated against it. Read it, or the
> stylesheets generated from it (`tokens-update.css` and `tokens/palette.css` here). Do not retype hex values out of this prose into a project.
>
> Canon upstream is `mzizi-dev/mzizi-registry → lib/tokens/palette.source.ts`, served publicly
> at <https://api.mzizi.dev/v1/brand> and by the MCP as `mzizi_execute get_tokens`. There is no
> database: the registry's files are the data layer.
>
> **Colour is derived and gated. Everything else on this page is hand-maintained** —
> typography, spacing, radius, sizes, motion, shadow, z-index and the semantic set. The
> radius scale and control sizes were checked against `mzizi-registry` `main` for 0.8.0;
> confirm the rest with `mzizi_execute get_tokens` (`typography`, `spacing`, `radii`, `semantic`,
> `componentSpecs`) if precision matters.

**The published design system.** The brand book, the tokens as data, the marks and static
previews of the components (Badge, Button, Card, Checkbox, Input, StatusBadge, Switch, Tabs and
more) are published as the Design System artifact at
<https://claude.ai/artifact/G8CCtAbZ8w717uQ3R5itCc>. Its source of truth is the `design-system/`
folder in `mzizi-dev/mzizi-registry` (arriving with mzizi-registry#418), which the artifact is
built from file for file. To change the design system, change that folder, never the artifact
page: the artifact is republished from registry `main` after a merge that touches it.

### Rules that are non-negotiable

- **Wordmarks** — `Mzizi` is capitalised. `mukoko`, `nyuchi`, `bundu`, `shamwari`, `bushtrade` are lowercase, always. (Product names such as Mukoko Events are written as names, not wordmarks.)
- **The palette is 21 families: seven Minerals + seven Heritage + the Experimental Seven.** Any interface that uses only the minerals is using a third of the system. Do not describe it as "the seven-colour palette".
- **Seven African Minerals** (geological, the core palette). The custom properties are `--color-<mineral>`, `--color-<mineral>-container`, `--color-<mineral>-on-container` — those are the names the design system defines. (`--container-<mineral>` / `--on-container-<mineral>` appeared in earlier revisions of this skill and are defined nowhere upstream; `tokens-update.css` now ships them as aliases so existing work keeps rendering, but do not reach for them in new code.)
  - `cobalt` — primary blue, links, CTAs · digital future, trust
  - `tanzanite` — **mukoko's brand mineral**, social features · premium, connection
  - `malachite` — success states, positive actions · growth
  - `gold` — achievements, rewards, highlights · honey, warmth
  - `terracotta` — community features · earth, grounding
  - `sodalite` — **AI / Shamwari surfaces, deep-reasoning states** · intelligence, depth _(added v4.1.0)_
  - `copper` — **Bundu ecosystem identity, the commons** · connection, stewardship _(added v4.1.0)_
- **Seven Heritage tones** (atmospheric anchors — mini-app surfaces, backgrounds, moods; no family or role, with one exception: `hematite` is Mzizi's brand colour): `indigo` (dusk, the dyer's craft) · `savanna` (sun-dried grass, the dry season) · `baobab` (the tree of life, bark, shelter) · `sunset` (day's end, the gathering hour) · `river` (flow, the journey) · `hematite` (the neutral anchor, the substrate) · `kalahari` (the light anchor, openness). Reach for them via `--color-<name>` (aliasing `--heritage-<name>`); values are in `palette.canonical.json`. _(Two earlier framings are withdrawn: the ten-colour one from before the palette settled, and the two-anchor one that survived into v0.5.1 of this bundle. **There are seven.** A skill that named two produced two-tone output in projects that had never seen each other.)_
- **The Experimental Seven** — a computed heptagon (hues offset 17°, prime saturations, foregrounds solved to P7), each tone carrying a `heptagonIndex` 0–6 that fixes its place on the wheel: `ember` · `acacia` · `fern` · `lagoon` · `storm` · `dusk` · `protea`. Four tiers each: `--exp-<name>`, `--exp-<name>-container`, `--exp-<name>-on`, `--exp-<name>-ui`. Use them for generated/wheel-derived surfaces and categorical sets where the minerals would have to be stretched past their meanings.
- **Each brand owns a mineral** (the ecosystem map, verified v4.1.0 and served at `/v1/brand` as `.ecosystem`): bundu→**copper**, nyuchi→**gold**, mukoko→**tanzanite**, shamwari→**sodalite**, Mzizi→**hematite** (a Heritage tone, not a mineral: the one brand whose colour comes from the Heritage set), events (Mukoko Events)/campfire/novels/health/kweli→malachite, lingo/planner/news/weather→cobalt, bushtrade/places/transport/wallet/learning→gold (learning, and with it the education category, is gold because every Nyuchi brand is), bytes/pulse→tanzanite, circles→terracotta. Theme a surface in its brand's colour — never default everything to tanzanite, and never give a Mzizi surface gold, tanzanite or copper as its primary.
- **Buttons are ALWAYS pill** (`rounded-full` → `--radius-full`, 9999px). Inputs match buttons visually. The exception is the Mzizi Dashboard Standard (below): its app Button and controls use the small radius, as their contracts state.
- **The Bundu floor: hard minimums, in two tiers** (owner rulings 2026-11-01 and 2026-11-02, mzizi-registry#597; registry 4.23.0, `@bundu/ui` 0.8.0; the desktop tier is the owner's ruling of 2026-11-12, mzizi-registry#660; the hit-area floor is the owner's ruling of 2026-11-19, which replaces the 49px touch and 28px desktop hit floors). **Touch** is a coarse pointer, or any window under 64rem. **Desktop** is a fine pointer with hover, 64rem and up, and no coarse pointer anywhere (`(min-width: 64rem) and (pointer: fine) and (hover: hover) and (not (any-pointer: coarse))`); a device with any coarse pointer stays on touch. Bundu sets the standard for outdoor reading and for people who find technology hard, so the minimums are as high as they can be. **Body text is 17px on touch** (Apple's iOS default) **and 15px on a desktop** (body-large stays 17px; native fields are drawn 36px, 33px compact). **Captions, metadata and secondary text are 14px** (2 x 7), and nothing readable is smaller: `text-xs` and `text-sm` both paint 14px, badges and chart labels are 14px, and an arbitrary `text-[10px]` is wrong. Only display and heading sizes step down as screens grow; body and secondary text never do (h1 is 34px on a phone, Apple Large Title). **The hit-area floor is 45px on touch and 24px on a desktop.** On touch the floor is 45px (`--target-floor: 2.8125rem`): WCAG 2.5.5 and Apple ask for 44, 44 is 4 x 11, so the floor is the next Mzizi number, 45 (3 x 15). On a desktop it is 24px (`--target-floor: 1.5rem` under desktop density), the WCAG 2.5.8 minimum, and 24 is 3 x 8. **On touch every interactive control keeps a 45px hit region**, through the transparent `::after` the token layer's `hit-area` rule gives every `button`, `summary`, button-like role and `.hit-area` element. **On a desktop a control may be drawn 28 to 41px** (`--control-floor`, the drawn minimum), and its drawn box is at least the 24px hit region. A native input, select or textarea cannot carry a pseudo-element, so `h-field` is its own box: 49px drawn on touch and 36px on a desktop (33px compact), and on touch a standalone link that is a target is drawn at 49px or takes `hit-area`. Control drawn heights on touch stay on the size roles (`h-control` 49px, `h-control-lg` 56px, `size-control-icon`, `h-field`), never `h-12`, `h-14`, `size-12`, `size-14` or `min-h-[44px]`. Density is visual size only: **never use screen size to guess network quality**. The radii are unchanged: 4, 7, 12, 14, 17 and a pill. `<html data-mzizi-sizes="legacy">` is the compatibility alias: it restores the sizes from before 2026-11-01 (48px floor, 56px default, 16px body, 12px captions), steps out of the Bundu floor and the spacing layers, and is planned for removal in the next major; set it only for an app that has not migrated, and remove it once it has. The numbers live in one place, `BUNDU_FLOOR` in the registry's `lib/tokens/roles.source.ts`, and are what `/v1/brand` `accessibility` and `.componentSpecs` serve. Until the registry release that carries the 45px and 24px hit floors is pinned, the pinned registry still states the older numbers; check the pin before you rely on a number from it. Dashboards and Discover: the Dashboard and Discover Standards' components read the same size roles; each contract's `density` states the rows, and about 40 rows that predate the floor (links and controls on literal `h-11`/`h-12` classes) are pinned in the registry's `HIT_AREA_GAPS` until they move, so do not copy their heights. **The Bundu Order** (registry `brand-guidelines`, "The Bundu Order") is where these numbers come from: the unit is 7px, body is 17 (a prime), captions 14 (2 x 7), the touch hit floor 45 (3 x 15) and the desktop hit floor 24 (3 x 8). Cite it as the owner's provenance, not as an engineering reason.
- **The spacing layers: a default floor and a dense floor for each layer** (owner, 2026-11-19; it replaces the single spacing floor of 2026-11-04). Every spacing value is a Mzizi number (the number rule, below). Each layer has a **default** value, the floor at default density, and a **dense** value, the absolute floor: nothing goes below dense. Use default white space where it serves, and dense where the content needs it (data-heavy screens, tables, toolbars, status pills). Dense controls are drawn smaller but keep the full hit area (45px touch, 24px desktop) through the hit-area pseudo-element. Dense tokens are named `<token>-dense` (for example `--space-card-dense`) or are set by a `dense` density on the element. Layers: **layout** (the page edge and the gaps between sections); **containers** (dialogs, sheets and panels); **cards** (cards, list items and tiles, N3 composites, and the gaps between sibling items in a list, grid or toolbar); **controls** (buttons, inputs and the label-to-field gap, N2 primitives); **chips**; and **pills and badges** (status pills). The tokens, in px:

  | Layer         | Token                     | Default | Built from | Default ref               | Dense | Built from        | Dense ref          |
  | ------------- | ------------------------- | ------- | ---------- | ------------------------- | ----- | ----------------- | ------------------ |
  | Layout        | `--space-page-x`          | 17      | prime      | Apple and M3 compact 16   | none  |                   |                    |
  | Layout        | `--space-page-x-wide`     | 28      | 7 x 4      | M3 medium and expanded 24 | 21    | 7 x 3             | 16 to 24           |
  | Layout        | `--space-section`         | 49      | 7 x 7      | 48                        | 28    | 7 x 4             | 24                 |
  | Containers    | `--space-container`       | 28      | 7 x 4      | M3 dialog 24              | 21    | 7 x 3             | M3 sheet 16        |
  | Containers    | `--space-container-gap`   | 21      | 7 x 3      | M3 dialog 16              | 14    | 7 x 2             | 12                 |
  | Cards         | `--space-card`            | 21      | 7 x 3      | M3 card 16                | 14    | 7 x 2             | M3 list item 12    |
  | Cards         | `--space-card-gap`        | 14      | 7 x 2      | M3 card gap 8             | 7     | 7                 | 4                  |
  | Cards         | `--space-card-stack`      | 7       | 7          | title to body 4           | 7     | 7                 | 4                  |
  | Controls      | `--space-control-x`       | 17      | prime      | M3 small button 16        | 12    | 3 x 4             | M3 dense button 12 |
  | Controls      | `--space-field-x`         | 17      | prime      | M3 text field 16          | 12    | 3 x 4             | 12                 |
  | Controls      | `--space-control-gap`     | 9       | 3 x 3      | M3 icon to label 8        | 7     | 7                 | 6                  |
  | Controls      | `--space-control-between` | 9       | 3 x 3      | M3 target spacing 8       | 9     | 3 x 3             | 8 (no dense step)  |
  | Controls      | `--space-label-gap`       | 7       | 7          | label to field 6 to 8     | 5     | prime             | M3 4               |
  | Chips         | `--space-chip-x`          | 12      | 3 x 4      | M3 chip 12                | 9     | 3 x 3             | M3 chip 8          |
  | Pills, badges | `--space-pill-x`          | 9       | 3 x 3      | 8                         | 5     | prime             | M3 badge 4         |
  | Pills, badges | `--space-pill-gap`        | 5       | prime      | 4                         | 3     | prime, also 3 x 1 | 2                  |

  **Which gap goes where.** The gap between adjacent controls is `--space-control-between` (9, and 9 dense: it has no dense step). The icon-to-label gap is `--space-control-gap` (9, dense 7), and the label-to-field gap is `--space-label-gap` (7, dense 5); a line that names neither is held to the 9px between-controls gap. The gap between sibling items in a list, grid or toolbar is `--space-card-gap` (14, dense 7), because list items belong to the cards layer. The 7px card stack (`--space-card-stack`) is title to body inside a card, not a gap between items. The label-to-field gap and the sibling-item rule are derived from the number rule, pending the owner's confirmation.

  **Changes from today:** the single 14px inset floor becomes a floor per layer (the table). The gap between adjacent controls goes from 7 to 9. The 7px value remains only as the card stack gap, and the 7px item gap is gone (sibling items take the 14px card gap). Status pills and badges use `--space-pill-x` (9, dense 5), and chips use `--space-chip-x` (12, dense 9); the old 14px inline inset on pills is replaced. The page edge on a phone is 17, not 21. Control heights come onto the number rule, rounding up to the nearest Mzizi number: `spacing-control-sm` 32 to 33 (3 x 11), `spacing-control-dense` 32 to 33, `spacing-field-sm` 32 to 33, `spacing-control-lg` 40 to 41 (prime), and `--touch-target-sm` 40 to 41 (prime); 36, 28, 48 and 56 are already Mzizi numbers. Body text, captions, contrast (7:1 body, 4.5:1 non-body, 3:1 UI) and the 1.5 body leading are unchanged. Screens built on the old values get slightly roomier, and nothing breaks.

- **The number rule: every spacing and size value is a Mzizi number** (owner, 2026-11-19). A Mzizi number is a multiple of 3, a multiple of 7, or a prime. Start from the recommended value (WCAG, Apple's HIG or Material 3) and take the nearest Mzizi number at or above it: a little larger is fine, lower never is. Cards, containers and page layout use multiples of 7 (the page edge, 17, is the one prime in the layout layer, as the ruling states it). Controls may use any Mzizi number. Pick values from the table or from the rule, and never write a value that is not one: `mz floor` warns on it.
- **Dense or default: pick by content, not by screen size.** Use default where there is room and the layout can breathe. Use dense on data-heavy screens: tables, dense toolbars, lists of records and status pills. A dense control keeps its 45px touch or 24px desktop hit region through the pseudo-element, so density never shrinks what a finger or a pointer can reach. Never go below the dense value of a layer, and never tighten a default-density screen below its default value to fit more on it.
- **The body leading floor is 1.5** (`--leading-floor`, WCAG 1.4.12): no body text line is set below 1.5, and `leading-none`, `leading-tight` and a line height under 1.5 on body text are wrong. **Enforcement:** components built on the layer tokens sit at their layer's floor. `mz floor` (`@nyuchi/mzizi-cli`) fails a project's CSS or TSX whose padding or gap is under the default floor of the layer the line names (a dense line is held to the dense floor), whose control hit region is under 24px, whose leading is under 1.5, or whose gap is under the floor of the control it names. A line no layer can be read from is held to 14px padding and a 7px gap, at any density, and so is a layer with no token of the kind it sets (chips have no gap token). A dense control is checked against the 45px and 24px hit floors like any other control. It warns, and never fails, on a value that breaks the number rule and on a control drawn between 24px and 45px on touch. **Nothing may go under a floor:** no brand pack, no density layer, no app, no one-off. `<html data-mzizi-sizes="legacy">` is the one opt-out. Where a value below a floor is deliberate (a decorative, non-text box), put an exception comment on the same or the previous line: `mzizi-spacing-exempt: <reason>`, with a reason. An exception without a reason fails.
- **`text-base` can collide with `--color-base`.** The token layer registers `--text-base` (17px, the font-size step) and the palette also has a surface colour named `base` (`--color-base`), and Tailwind 4 reads both namespaces for a `text-base` class, so an app that has both may not get the 17px step. This is a known open point (registry decision pending, a follow-up to mzizi-registry#597), not something to work around by renaming a token. Until it is decided: write body copy as `text-body` (17px) or leave it unclassed, use `text-xs` and `text-sm` (both 14px) for secondary text, which work, and never use `text-[Npx]` under 14.
- **Radius scale** (px), every step from a 7px unit: `xs` 4 (unit − 3) · `sm` 7 · `md` 12 · `lg` 14 (**DEFAULT** cards/panels) · `xl` 17 · `2xl` 17 · `full` 9999 (pills). That is `mzizi-registry/styles/globals.css`, the Rust `mzizi-tokens` `Radius`, and `/v1/brand` `.radii` ("ecosystem numbers: 4, 7, 12, 14, 17"; `xs` joined in mzizi-registry#544). Legend swatches, kbd keys and inline tags use `xs`, checkboxes `sm`, inputs and small cards `md`, cards and panels `lg`, modals, sheets, dialogs and tabs `xl`. Reference via `--radius-<name>`. `2xl` is 17px, never 24. (Until 0.8.0 this skill listed `none` 0 and `2xl` 24, which were never upstream values.)
- **H1–H3 are Noto Serif. H4+ and body are Noto Sans. Code is JetBrains Mono.**
- **Rings over shadows.** Cards get `ring-1` of `--border`, not a drop shadow.
- **No gradients, no glassmorphism** except sticky chrome (`backdrop-blur`) and the Discover Standard's hero wash (DiscoverHero's `gradient-showcase`, which mixes `--primary` into the background, as its contract declares).
- **Emoji only as mini-app identifiers**, never as chrome or body decoration.
- **Status has its own names: `--status-success` / `--status-warning` / `--status-error` / `--status-info` / `--status-neutral`.** Use those names and do not hardcode a hex. Upstream they alias `--success` / `--warning` / `--destructive` / `--info` / `--neutral`, so there is one decision per status — which means the resolved values are mineral-derived in the shipped theme (success reads as malachite, info as cobalt), not the standalone #22C55E/#F59E0B/#EF4444/#3B82F6 set an earlier revision of this skill listed. Those hexes are the per-component `var(--token, #hex)` fallback for an app that has not defined the properties; they are not the theme. Severity scale (`--severity-low/moderate/high/severe/extreme/cold`) and connection (`--connection-online/syncing/cached/offline`) follow the same logic. Verification is the only place minerals carry status meaning; it has its own rule, next.
- **Verification is two things, not one ladder: assurance levels and attestations** (mzizi-registry#577; the source is `gateway/lib/assurance.py` in `nyuchi/nyuchi-api`, the one access decision every surface derives from — read that, never re-derive it). Read the roles, never a hex; each has `-container`, `-on-container` and `-text`, and passes APCA in both themes.
  - **Assurance levels** are ordered (`>=` is meaningful): how strongly an identity is proven. 0 `none` "Unverified" → `--assurance-none` (the neutral grey, `--status-neutral`) · 1 `otp` "Contact Verified" → `--assurance-otp` (cobalt) · 2 `documented` "Documents Checked" → `--assurance-documented` (sodalite) · 3 `government` "Government Verified" → `--assurance-government` (gold) · 4 `licensed` "Licensed Professional" → `--assurance-licensed` (tanzanite).
  - **A level can expire.** A `government` check holds for five years and a `licensed` one for a year (`LEVEL_VALIDITY_YEARS` in assurance.py, nyuchi-api#375). When the term runs out the level is withdrawn, so show the level a person holds now and never cache it as permanent.
  - **Attestations** are unordered and held beside the level: who vouches for the subject. `community` "Community Vouched" → `--attestation-community` (terracotta) · `business` "Registered Business" → `--attestation-business` (malachite) · `domain` "Domain Verified" → `--attestation-domain` (copper). Show each as its own chip next to the level (`app/tier-status` and `ui/mzizi-verified-badge` do this, from registry v4.17.0; `ui/mzizi-trust-meter` shows the level and renders no attestation chips).
  - **Provenance: where an attestation came from, and when it was checked** (mzizi-registry#593, on registry `staging`, released with the next registry version: `ui/mzizi-verified-badge` 1.2.0 and `app/tier-status` 1.2.0). A stored attestation record may carry `source` (a short id such as `"osm"`), `sourceRef` (the source's own reference, kept and never shown) and `checkedAt` (an ISO date or date-time). The chip label stays the canonical one ("Community Vouched"), and an optional second line reads "via <Source> · checked <date>", for example "via OpenStreetMap · checked 14 Mar 2026". Source names come from `ATTESTATION_SOURCES` in `mzizi-trust-tier-data` (`osm` → "OpenStreetMap"), and the line is built by `attestationProvenance`. Two rules: **never invent a check date.** With no `checkedAt`, or one that does not parse or names a day that does not exist, the line is "via OpenStreetMap" with no date. And **never a per-source label**: a source changes the second line only, never the chip's name, its colour or the closed set of three attestations (an OpenStreetMap verification is a `community` attestation, never a level). The date is formatted in UTC from the locale (`en-GB` by default) so the day never shifts. The chip's `aria-label` stays the canonical name and the line is its `aria-description` (badge) or is read with the name (tier status, the date as `<time datetime>`).
  - **Community is not a rung.** The old ladder put `community` at 1, below `otp`, which ranked a trader vouched for by their whole street below anyone who clicked a link in an email. Mukoko serves the informal economy: a tuck shop is level `otp` plus community, a registered firm is `government` plus business, and neither outranks the other. So never draw community on the level scale and never below otp; `tier="community"` now renders as level Unverified plus a "Community Vouched" chip.
  - **`--tier-*` are legacy aliases**, kept while `bundu.verificationTier` (the `legacy_tier()` projection in assurance.py) still has readers: `--tier-unverified` → `--assurance-none`, `--tier-community` → `--attestation-community`, `--tier-otp` → `--assurance-otp`, `--tier-government` → `--assurance-government`, `--tier-licensed` → `--assurance-licensed`. They paint what they always did. New code reads `--assurance-*` and `--attestation-*`. (Earlier revisions of this skill listed a five-rung tier ladder, first as community→malachite, government→tanzanite, licensed→gold, then, after mzizi-registry#543, with community as terracotta; both treated community as a rung.)
  - Colour is never the only cue: every level and attestation carries its label and glyph. Heritage tones never carry a level or an attestation.
- **Surfaces (April 2026 AAA refresh):** light mode — `--background` warm paper, `--card` pure white, `--muted` cream, `--overlay` white. Dark mode — `--background` warm stone L10%, `--card` L6% (darker than bg), `--muted` L2% (deepest), `--overlay` L14% (lighter than bg, scrim creates pop).
- **Icons:** in the React build, Lucide through `@/lib/icons`, never `lucide-react` directly; in Mzizi Roots, an icon is an `Element` slot the host renders. For an HTML prototype, the Lucide CDN build is fine.
- **Contrast has two bars, both enforced** (registry #399, #610; owner 2026-11-02): WCAG 2 minimums of **7:1 for body text** (on `base` and `surface`, both themes), **4.5:1 for non-body text** (captions, timestamps, metadata) and **3:1 for UI parts** (focus rings, control edges, WCAG 1.4.11), and the APCA bars (Lc 75 and up) beside them. `pnpm tokens:verify` in the registry fails a default role under its minimum. **One named exception, owner-confirmed:** five button-label roles hold 4.5:1, not 7:1, on their fill: `primary-foreground`, `brand-accent-foreground`, `app-accent-foreground`, `sidebar-primary-foreground` and `destructive-foreground`. The fills are each brand's `-aa` tier, which is 4.5:1 under white by definition, so 7:1 would darken every brand's action colour. Never apply the exception to anything that is not one of those five roles: a label on any other fill, and all running text, needs 7:1. Read the roles (`--text-secondary`, `--muted-foreground`, the `-text` tier) instead of picking a grey; `mzizi_execute check_accessibility` returns the WCAG ratio and checks 7:1 (it does not compute APCA or the 4.5:1 and 3:1 tiers).

### When creating visual artifacts

Create static HTML files for the user to view. `@import` `tokens-update.css` at the top of every HTML file (or inline it). For slide decks use a mineral accent strip and serif display type.

### When working on production code

Use the registry's components, never hand-rolled copies. **Rust first:** Mzizi Roots is the lead build (`cargo add mzizi-roots`; see the `mzizi-roots` skill). The React build installs by absolute URL, for existing React apps:

```bash
npx shadcn@latest add https://api.mzizi.dev/v1/ui/<name>
```

Take CSS variables from `tokens-update.css` or `tokens/palette.css` in this skill — it is generated from `palette.canonical.json` and carries all 21 families. The upstream equivalent is `mzizi-registry/styles/globals.css`, which is generated from the same canon. There is no database to refresh from.

### Apple HIG: the baseline, and where Mzizi overrides it

Mzizi designs on Apple's Human Interface Guidelines
(<https://developer.apple.com/design/human-interface-guidelines>). It applies them to **every**
Mzizi surface (web, native and console) and not only to Apple platforms. The HIG is the
baseline wherever Mzizi says nothing. Where Mzizi has a token, a registry component or a
contract, **Mzizi is the authority, across all apps**, and the HIG value does not apply. Read
the HIG pages live, because Apple revises them: the design principles were reintroduced on
8 June 2026, Layout was updated on 9 September 2026, and Liquid Glass guidance arrived on
9 June 2025.

**The eight HIG design principles** (Design principles, June 2026) are the questions to ask of
every screen:

| Principle      | In Apple's words                     | In Mzizi terms                                                                        |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| Purpose        | Make something meaningful.           | Build what the person came for, and drop features nobody asked for.                   |
| Agency         | Let people do things their own way.  | No locked flows, an escape from every guided step, undo before confirm.               |
| Responsibility | Act in people's best interest.       | Say what is collected and why. Collect only what the product needs (Ubuntu: dignity). |
| Familiarity    | Build on what people know.           | One shell and one set of patterns across every app (`mzizi-architecture`).            |
| Flexibility    | Adapt to diverse contexts and needs. | Accessibility from the start, and every input (touch, keyboard, voice, pointer).      |
| Simplicity     | Be clear and direct.                 | Every element earns its place. Hierarchy first, concise labels.                       |
| Craft          | Care about every detail.             | The contract's checks pass, every state renders, motion is purposeful.                |
| Delight        | Make it human.                       | Delight is never decoration. The minerals carry meaning, not ornament.                |

**Where Mzizi is the authority** (the HIG value is replaced, not blended):

| Concern                 | HIG says                                                      | Mzizi rule (wins)                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Touch targets           | 44×44 pt default, 28×28 pt minimum on iOS/iPadOS              | **45px hit region on touch, 24px on a desktop** (`--target-floor`; `h-control` and `h-field` 49px drawn on touch), drawn 28 to 41px at desktop density, where the drawn box is at least the 24px hit region. Dense controls keep the full region through the pseudo-element. Dashboards: each contract's `density`                                                                                                      |
| Spacing and layout grid | system margins, layout guides                                 | **the spacing layers**: page edge 17 (default), section gap 49 (dense 28), container padding 28 (dense 21), card padding 21 (dense 14) and card gap 14 (dense 7), control padding 17 (dense 12) and gap 9 (dense 7), label gap 7 (dense 5), chips 12 (dense 9), pills 9 (dense 5), each with a default and a dense floor; then the Mzizi spacing tokens and each component contract's `responsive` rules, from 320px up |
| Type scale and families | San Francisco, Dynamic Type sizes (17 pt default body on iOS) | Noto Serif H1–H3, Noto Sans H4 and body, JetBrains Mono for code, at Apple's Large (default) sizes on a phone (body 17px, h1 34px), and body is 17px on touch and 15px on a desktop with captions at 14px (the Bundu floor). **Text still scales with the user's setting** (rem units, no fixed px caps)                                                                                                                |
| Colour                  | system colours, dynamic colours                               | the 21 families and the semantic tokens only, through `var(--…)`. A brand overlay changes colour and mark only                                                                                                                                                                                                                                                                                                          |
| Contrast                | 4.5:1 up to 17 pt, 3:1 at 18 pt or bold (WCAG)                | WCAG 7:1 body, 4.5:1 non-body, 3:1 UI, plus APCA, in both themes (the palette is solved for it), with five button-label roles at 4.5:1                                                                                                                                                                                                                                                                                  |
| Shape                   | system control shapes, capsules in Liquid Glass               | **pill buttons and inputs** (`--radius-full`), the radius scale above, and the Dashboard Standard's small radius where its contracts say so                                                                                                                                                                                                                                                                             |
| Materials               | Liquid Glass for controls over content                        | solid surfaces and rings; blur only on sticky chrome. No glass panels on web surfaces                                                                                                                                                                                                                                                                                                                                   |
| Density                 | per-platform defaults                                         | comfortable by default, dense only where a Standard's contract says so                                                                                                                                                                                                                                                                                                                                                  |
| App chrome              | tab bars, sidebars, toolbars per platform                     | **the shell**: AppShell or DiscoverShell from `@bundu/ui`, mounted once (`mzizi-architecture`)                                                                                                                                                                                                                                                                                                                          |

**Where the HIG applies as written** (Mzizi is silent, so follow Apple):

- **Hierarchy and layout.** Order content by importance (top and leading side first), align to
  make it scannable, group related items with space, containers or separators, and use
  progressive disclosure instead of showing every choice at once (Layout).
- **Adaptivity.** Lay out by the space available, never by device type. Keep functionality
  the same as the size changes, and respect safe areas (the registry's `safe-area-frame`
  primitive does this on the web).
- **Accessibility.** VoiceOver and screen-reader labels, Reduce Motion (stop auto-playing,
  zooming and parallax motion; Mzizi's harness exposes `prefers-reduced-motion`), Increase
  Contrast, keyboard and switch access, and never colour alone.
- **Feedback and recovery.** Show state changes, confirm destructive actions, and make
  reversal cheap.
- **Writing.** Be concise, use the exact words a control needs, and say what will happen.
- **Native apps** (SwiftUI and other native platforms) use the system components and
  materials, Liquid Glass included, themed through the generated Swift and Kotlin tokens, while
  the Mzizi floor, type and colour rules still hold.

When a HIG update conflicts with a Mzizi rule, the Mzizi rule stands until the registry changes
it. Raise the conflict upstream in `mzizi-dev/mzizi-registry` and do not patch around it in an
app.

### Dashboards: brand overlays only

An admin or operator dashboard uses the **Mzizi Dashboard Standard**: the app components of
`@bundu/ui` (`@bundu/ui/app/*`), one design for every product in the Bundu ecosystem, each
with a versioned contract in `mzizi-registry/contracts/app/` (see `mzizi-roots`). A brand
changes colour and mark, and nothing else:

- **A brand overlay changes `--primary`, `--ring`, AppShell's `--app-accent` and the brand
  mark.** Layout, spacing, type and size never vary by brand. The overlay is one stylesheet
  imported after the tokens (`@bundu/ui/styles/brand-<brand>.css`). AppShell's `accent`
  takes one of the seven minerals and fills primary actions and the current nav indicator
  with its brand fill (`--color-<mineral>-brand`, text `--color-<mineral>-on-brand`); text
  links and the focus ring keep `--primary` and `--ring`.
- **Status colours do not follow the brand.** Success is malachite, warning gold, error
  terracotta, info cobalt, in every brand. A component names a mineral only as one of its
  contract's `theming.statusColours`; any other mineral class, or a literal colour value,
  fails its contract test.
- **Mzizi's hematite** is a Heritage tone, so AppShell's `accent` does not apply to it;
  `brand-mzizi.css` sets `--primary`.

### Discover pages: the same overlay, touch-first

A public discover or browse page in the Mukoko family (circles, news, events, weather, and the
super-app on the web) uses the **Mzizi Discover Standard**: the Discover components of
`@bundu/ui` (`@bundu/ui/discover/*`), each with a versioned contract in
`mzizi-registry/contracts/discover/` (see `mzizi-roots`). The brand-overlay rule is the
Dashboard Standard's, with two differences the contracts state:

- **No `--app-accent`.** A brand shows in DiscoverShell's `brand` slot (its mark) and in the
  primary action its `action` slot holds; the frame, header, navigation and footer are
  identical in every brand. `--primary` reaches only DiscoverHero's wash, DiscoverCard's
  monogram and `brand` badge tone, and OpenInApp's `primary` variant. Category chips, sections,
  search and "Load more" are neutral (search follows the brand only in its `--ring` focus
  ring). DiscoverCard is the one Discover component with status colours (`cobalt`,
  `malachite`, `gold`, `terracotta`), for its badge tones, and they do not follow the brand.
- **Sizes come from the size roles.** Discover pages take their heights from `h-control` and
  friends (search field 49px on touch and 36px on a mouse, submit button 36px drawn at desktop density and 49px on touch,
  as the density rows in `contracts/discover/` state); its links and chips are still pinned
  gaps in the registry. (Until 2026-11-01 Discover was the same size on every pointer, 48px or
  44px; the Bundu floor replaced that.)

## What belongs in the ecosystem

### Ubuntu alignment

The ecosystem is built on Ubuntu — "I am because we are." When you architect a new app:

- Prefer open source over proprietary
- Build for community, not extraction
- Respect data sovereignty — African data stays on African infrastructure where possible
- Accessibility is not an afterthought; it is the starting point
- Every feature should contribute to collective wellbeing, not just individual efficiency

Every surface also meets the **seven engineering constraints**, in this order: outdoor
readability, connectivity-gradient design (offline-first is its enforced minimum: core tasks
work with no connection), multilingual parity, shared-device awareness, personal data
sovereignty, no surveillance business model, and the Bundu floor. Each has a check that fails a
surface which misses it; the definitions are Mzizi doctrine
(`content/doctrine/genetic-code-engineering-constraints/` in mzizi-registry).

These aren't marketing claims, they're architectural constraints. If you find yourself
designing something that only benefits a small subset of users at others' expense, question
whether it belongs in the ecosystem.

### What is and isn't an ecosystem app

The **Bundu Foundation** is the umbrella, with four pillars:

- **Bundu Labs** — the Foundation's research arm
- **Nyuchi Africa** — platform and infrastructure; it builds and operates mukoko, sells shamwari ai,
  and sells its own tools and products (web services, developer tools, storage)
- **mukoko** — the hive and the consumer pillar: one platform with apps inside it, like an office
  suite. It is a super app and also standalone apps in specific domains (Mukoko Events, formerly
  nhimbe; weather, news, lingo and the rest of the constellation's Mukoko apps). Mukoko is a
  pillar of Bundu and a product of Nyuchi Africa, the way Claude is a product of Anthropic: built
  and operated by Nyuchi. It is the proof that research reaches production and is used by people,
  and the proof that the infrastructure works
- **shamwari ai** — the ranger: it guides and manages things across the wilderness (on-device
  inference, pod-resident context, no third-party AI vendor); a pillar and a Foundation project,
  run on and sold by Nyuchi

**Mzizi** owns and operates nothing commercial: the Foundation owns the language, its toolchain,
the registry, the design system, the docs and the API, and Nyuchi builds them. Mzizi is not an
app and not a layer in a stack; it is the open, non-revenue foundation the ecosystem builds on
and the doctrine that governs it. Mukoko is a pillar of Bundu and a product of Nyuchi Africa:
Nyuchi builds and operates it.

Not ecosystem apps:

- Any app that extracts value without giving back
- Any app that requires surveillance for its business model
- Any app that centralises what should be federated

If the app you're building doesn't fit, that's fine — consume the Mzizi design system, but
don't brand it as ecosystem.

## If invoked with no other guidance

Ask what the work is: (a) an interface or prototype (which surface: mobile, desktop, print,
slide; which brand voice: Mzizi, nyuchi, mukoko, shamwari, Mukoko Events), (b) parent-brand material
(ecosystem page, manifesto, deck), (c) a cross-brand piece, or (d) a voice or mineral decision
for one brand. Then apply the constellation table, the voice rules and the design system, and
output HTML artifacts or production code as the need requires.

_Mzizi — the root everything grows from._
