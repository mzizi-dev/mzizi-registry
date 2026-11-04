---
name: mukoko-design
description: Use this skill whenever you create, apply or export Mukoko's brand identity, or anything that must carry it. That covers the Seed of Life mark (the Swarm), the app icon, favicons, the lockup, the splash screen, social and launch assets, and honeycomb backgrounds. It ships the canonical files byte for byte as mukoko-dev/mukoko-news serves them: the full-palette mark (light and dark), the app icon on deep tanzanite, the paper icon, the favicon set and the lowercase serif lockup. It also carries the honeycomb backgrounds and the 1080×1920 splash, the seven minerals of the mark with their meanings, and the rules. The full-palette mark is the only icon at every size, with no mono or single-colour reduction. Never recolour, reorder, add a gradient or shadow, or redraw it. The wordmark is always lowercase "mukoko". For the wider palette, tokens and UI use mzizi-design, and for app structure use mzizi-architecture.
---

# mukoko design: the Swarm

The visual identity of **mukoko**, the hive at the centre of the Bundu ecosystem: _nyuchi is the
bee, mukoko is the hive_. This skill ships Mukoko's brand files and the rules for using them.

**Where the files come from.** Everything under `mark/`, `lockup/`, `app-icon/` and `favicon/`
is copied byte for byte from `public/` in
[`mukoko-dev/mukoko-news`](https://github.com/mukoko-dev/mukoko-news). That repository is the
source of truth for the mark and the icons, and mukoko-weather and mukoko-events ship
byte-identical copies pinned by hash tests. `SOURCES.md` names each file's source and its
SHA-256, and `scripts/mukoko-design.test.sh` fails when a file here stops matching it. To change
an icon, change it in mukoko-news first and then copy it here. Never redraw one.

The colours come from the Mzizi palette (`mzizi_get_tokens` on the Mzizi MCP, and
`palette.canonical.json` in this package). Tokens, stylesheets, the 21 families and UI rules are
in the `mzizi-design` skill. This skill does not duplicate them.

## The idea

The mark is the **Seed of Life**: one centre cell ringed by six, the first complete ring of the
honeycomb, rendered in the **seven African Minerals**.

> **Tanzanite at the core** (mukoko, the brand), ringed by the six minerals of the ecosystem.
> One hive holding the whole. **Ndiri nekuti tiri**: _I am because we are._

It is a known geometric figure, like the Olympic rings, made Mukoko's through the mineral palette
and the meaning. mukoko's mark is the hive, never a bee; the bee is nyuchi's.

## The seven minerals of the mark

The meanings are `symbolism` from `mzizi_get_tokens`. The `light` value is used on light
surfaces, and the `dark` value on dark ones:

| Mineral       | Light     | Dark      | Meaning                             |
| ------------- | --------- | --------- | ----------------------------------- |
| cobalt        | `#0047AB` | `#00B0FF` | Digital future, trust, knowledge    |
| **tanzanite** | `#4B0082` | `#B388FF` | Premium, creativity, connection     |
| malachite     | `#004D40` | `#64FFDA` | Growth, nature, success             |
| gold          | `#5D4037` | `#FFD740` | Honey, rewards, warmth              |
| terracotta    | `#A0522D` | `#E1B07E` | Earth, community, grounding         |
| sodalite      | `#283593` | `#3D5AFE` | Intelligence, depth, reasoning      |
| copper        | `#BF5A36` | `#FF8A65` | Connection, foundation, stewardship |

**The ring, as the canonical files draw it.** Tanzanite sits in the centre. Clockwise from the
top cell, the ring runs **sodalite, terracotta, cobalt, gold, malachite, copper**, alternating
cool and warm. The files are the reference; never reorder the ring.

**The seven minerals are the mark, not the palette.** The Mzizi palette has 21 families: these
seven, the seven Heritage tones and the Experimental Seven (`mzizi-design`). Build pages, decks
and mini-app surfaces from the palette and the semantic tokens. Do not build them from the mark's
seven colours alone.

## Files

```text
mark/         mukoko-mark-full-light.svg, mukoko-mark-full-dark.svg
              The bare full-palette mark on a transparent ground. Light minerals on light
              surfaces, dark minerals on dark ones.
lockup/       mukoko-lockup-light.svg, mukoko-lockup-dark.svg
              The mark plus the lowercase `mukoko` wordmark in Noto Serif 600.
app-icon/     mukoko-appicon.png        the app icon: the full mark on the deep tanzanite
                                        ground (`#1A0033`). The favicons are downscaled from it.
              mukoko-appicon-paper.png  the full mark on a paper ground, for light stores and surfaces
favicon/      favicon.svg (carries its own ground, so one file serves both browser themes),
              favicon-16.png, favicon-32.png, favicon.ico (16/32/48), apple-touch-icon.png (180)
backgrounds/  honeycomb-grain-paper.svg       faint tanzanite outline texture for body and empty states
              honeycomb-tanzanite-header.svg  header and email band
              honeycomb-pattern-full.svg      the full-mineral tile for heroes and social backdrops
              honeycomb-splash-stone.svg / -1080x1920.png  launch screen: mark centred, wordmark below
SOURCES.md    each file's source and SHA-256
```

On the web, link the favicons as mukoko-news does:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

## Rules for the mark

These rules are owner doctrine, recorded in mukoko-news `CLAUDE.md` under "Design System". They
override every earlier version of this skill.

- **The full-palette mark is the only icon, at every size.** There is no mono, single-colour or
  knockout reduction, at 16px or anywhere else. The favicons are the full mark.
  - **Why (owner correction, 2026-09-01).** A mono tanzanite favicon made the browser tab a
    solid purple blob that looked like a different product.
  - **Withdrawn.** The mono marks and the mono tanzanite app icon were withdrawn so they cannot
    be wired up again. Do not recreate them.
- **The app icon is `app-icon/mukoko-appicon.png`**: the mark on deep tanzanite (`#1A0033`).
  The browser tab, the installed app and every other surface carry the same artwork.
- **Never** add gradients, shadows, glows or outlines. Never recolour a cell, reorder the ring,
  or rotate, stretch or rearrange the cells.
- **Clear space** is one cell-radius on all sides. Nothing else goes inside it.
- **The wordmark is always lowercase**: `mukoko`, never `Mukoko` or `MUKOKO`. It is set in Noto
  Serif 600. UI text is Noto Sans; code and labels are JetBrains Mono. Product names are names,
  not wordmarks ("Mukoko Events", "Mukoko News").
- **Use the files.** Scale the SVGs freely. Export other PNG sizes from `mukoko-appicon.png` or
  the SVGs. Never trace or redraw the mark.

## The backgrounds

The honeycomb backgrounds and the splash come from this skill's last version before 0.8.0. No
live surface ships them, so they are carried over unchanged. Their ground colours predate today's
Mzizi surface scale (`mzizi_get_tokens`, `backgrounds`). When one sits behind content, check its
ground against the surface it replaces. Where it clashes, set the pattern over
`var(--background)` and do not hand-pick a hex. If a background needs a new ground, change it
here in a reviewed PR and record the reason in `SOURCES.md`.

## If invoked with no other guidance

1. Ask what is needed: a logo export, an app icon, a favicon set, a social or launch asset, a
   splash screen or a header band.
2. Confirm whether the surface is light or dark.
3. Hand over the file from this skill, or export a size from it.
4. For anything beyond the brand files (a page, a component, a palette question), go to
   `mzizi-design`.

_mukoko: the hive that holds the whole._
