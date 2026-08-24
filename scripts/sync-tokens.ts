#!/usr/bin/env -S tsx
/**
 * Sync the seven-mineral + seven-heritage colour palette from the Supabase
 * document store into the committed token artifacts.
 *
 * The DB is the single source of truth (collections `styling-minerals`,
 * `styling-heritage-colors` and `styling-experimental` in
 * `component_documents`). This script projects those rows into:
 *   - lib/tokens/palette.generated.ts   (typed snapshot consumed by lib/tokens)
 *   - app/globals.css                   (the marked palette regions only)
 *   - components/registry/n1-tokens/nyuchi-tokens-<platform>.<ext>
 *       for swift, kotlin, arkts, react-native, python and rust
 *
 * The platform outputs were previously hand-written files stamped
 * "auto-generated … do not edit manually" that nothing generated. They had
 * drifted badly: every one carried FIVE minerals and FIVE heritage tones
 * against a seven-and-seven system (no sodalite, copper, hematite or kalahari),
 * several hexes were stale — Kotlin's baobab was a green where the palette says
 * brown — and they emitted only the dark theme, so a light-theme consumer got
 * dark values. `nyuchi-tokens.ts` also carried its own `generateSwiftTokens` /
 * `generateKotlinTokens` / `generateRustTokens` / `generatePythonTokens`
 * functions reading a hardcoded in-file colour map, which made the token node —
 * whose covenant is "design decisions are data, not code" — the one place in
 * the repo with two competing sources for the same values. Those are deleted;
 * this script is the only generator, and `tokens:verify` now covers every file
 * it writes, so the banner is true for the first time.
 *
 * The EXPERIMENTAL SEVEN (`styling-experimental`: ember, acacia, fern, lagoon,
 * storm, dusk, protea — a heptagon of hues offset 17 degrees, prime
 * saturations, foregrounds solved to P7) were outside this script's scope until
 * now. Their `--exp-*` custom properties in globals.css sit OUTSIDE the
 * `tokens:generated:*` markers, so they were hand-maintained in CSS while also
 * living in the DB, with nothing checking the two agreed — the same
 * two-sources-for-one-value defect the rest of this file was written to remove.
 *
 * This script now (a) emits them into palette.generated.ts so TypeScript
 * consumers can reach them the way they reach minerals, and (b) VERIFIES the
 * hand-written `--exp-*` values against the DB rather than regenerating them.
 * Verifying instead of generating is deliberate: it closes the drift hole with
 * zero risk of changing a shipped colour. Moving that CSS inside the markers is
 * a follow-up, and only worth doing once the values are known to agree.
 *
 * Experimental tones are NOT emitted to the six platform targets. Those files
 * carry the stable mineral + heritage palette that native consumers compile
 * against; an experimental set can change, and widening a published surface is
 * a separate decision from ending a drift hole.
 *
 * Modes:
 *   pnpm tokens:sync     regenerate the artifacts from the DB
 *   pnpm tokens:verify   non-mutating CI gate; exits non-zero if an artifact
 *                        has drifted from the DB (compared value-wise, so
 *                        formatting differences never trip the gate)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (same as
 * tokens:sync). The store is anon-readable via RLS.
 */

import { readFile, writeFile } from "fs/promises"
import { join } from "path"
import { createClient } from "@supabase/supabase-js"

const CHECK = process.argv.includes("--check")

const PALETTE_TS = join(process.cwd(), "lib/tokens/palette.generated.ts")
const GLOBALS_CSS = join(process.cwd(), "app/globals.css")
const N1 = join(process.cwd(), "components/registry/n1-tokens")

/**
 * Scale constants shared by every platform output.
 *
 * Colour comes from the DB; these do not — the radius scale is doctrine
 * (CLAUDE.md §7.5: all radii derive from a 7px unit, giving 7/12/14/17) and the
 * type stack is §7.2. They are declared once here and emitted to all six
 * targets, so there is still exactly one source per concern.
 */
const SCALE = {
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32 },
  radius: { sm: 7, md: 12, lg: 14, xl: 17, full: 9999 },
  fonts: { sans: "Noto Sans", serif: "Noto Serif", mono: "JetBrains Mono" },
} as const

interface Mineral {
  name: string
  role: string
  family: string
  cssVar: string
  darkHex: string
  lightHex: string
  containerDark: string
  containerLight: string
  onContainerDark: string
  onContainerLight: string
  sortOrder: number
  origin: string
  symbolism: string
  usage: string
}
interface Experimental {
  name: string
  lightHex: string
  darkHex: string
  containerLight: string
  containerDark: string
  onContainerLight: string
  onContainerDark: string
  uiLight: string
  uiDark: string
  heptagonIndex: number
  sortOrder: number
}
interface Heritage {
  name: string
  cssVar: string
  darkHex: string
  lightHex: string
  sortOrder: number
  origin: string
  symbolism: string
  usage: string
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

async function fetchPalette(): Promise<{
  minerals: Mineral[]
  heritage: Heritage[]
  experimental: Experimental[]
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are required")

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from("component_documents")
    .select("collection, document")
    .in("collection", ["styling-minerals", "styling-heritage-colors", "styling-experimental"])
  if (error) fail(`Supabase read failed: ${error.message}`)

  const docs = (data ?? []).map((r) => r.document as Record<string, unknown>)
  const str = (d: Record<string, unknown>, k: string) => String(d[k] ?? "")
  const num = (d: Record<string, unknown>, k: string) => Number(d[k] ?? 0)

  const minerals: Mineral[] = docs
    .filter((d) => d.collection === "styling-minerals")
    .map((d) => ({
      name: str(d, "name"),
      role: str(d, "role"),
      family: str(d, "family"),
      cssVar: str(d, "css_var"),
      darkHex: str(d, "dark_hex"),
      lightHex: str(d, "light_hex"),
      containerDark: str(d, "container_dark"),
      containerLight: str(d, "container_light"),
      onContainerDark: str(d, "on_container_dark"),
      onContainerLight: str(d, "on_container_light"),
      sortOrder: num(d, "sort_order"),
      origin: str(d, "origin"),
      symbolism: str(d, "symbolism"),
      usage: str(d, "usage"),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const heritage: Heritage[] = docs
    .filter((d) => d.collection === "styling-heritage-colors")
    .map((d) => ({
      name: str(d, "name"),
      cssVar: str(d, "css_var"),
      darkHex: str(d, "dark_hex"),
      lightHex: str(d, "light_hex"),
      sortOrder: num(d, "sort_order"),
      origin: str(d, "origin"),
      symbolism: str(d, "symbolism"),
      usage: str(d, "usage"),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const experimental: Experimental[] = docs
    .filter((d) => d.collection === "styling-experimental")
    .map((d) => ({
      name: str(d, "name"),
      lightHex: str(d, "light_hex"),
      darkHex: str(d, "dark_hex"),
      containerLight: str(d, "container_light"),
      containerDark: str(d, "container_dark"),
      onContainerLight: str(d, "on_container_light"),
      onContainerDark: str(d, "on_container_dark"),
      uiLight: str(d, "ui_light"),
      uiDark: str(d, "ui_dark"),
      heptagonIndex: num(d, "heptagon_index"),
      sortOrder: num(d, "sort_order"),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Seven is the system, not a coincidence — the collections are a heptagon
  // each. A count that is not seven means a row was added or lost, and the
  // whole point of this gate is that such a change cannot land silently.
  if (minerals.length !== 7) fail(`expected 7 minerals, got ${minerals.length}`)
  if (heritage.length !== 7) fail(`expected 7 heritage tones, got ${heritage.length}`)
  if (experimental.length !== 7) fail(`expected 7 experimental tones, got ${experimental.length}`)
  return { minerals, heritage, experimental }
}

function renderPaletteModule(
  minerals: Mineral[],
  heritage: Heritage[],
  experimental: Experimental[]
): string {
  const mineral = (m: Mineral) =>
    `  {
    name: ${JSON.stringify(m.name)},
    role: ${JSON.stringify(m.role)},
    family: ${JSON.stringify(m.family)},
    cssVar: ${JSON.stringify(m.cssVar)},
    darkHex: ${JSON.stringify(m.darkHex)},
    lightHex: ${JSON.stringify(m.lightHex)},
    containerDark: ${JSON.stringify(m.containerDark)},
    containerLight: ${JSON.stringify(m.containerLight)},
    onContainerDark: ${JSON.stringify(m.onContainerDark)},
    onContainerLight: ${JSON.stringify(m.onContainerLight)},
    sortOrder: ${m.sortOrder},
    origin: ${JSON.stringify(m.origin)},
    symbolism: ${JSON.stringify(m.symbolism)},
    usage: ${JSON.stringify(m.usage)},
  },`
  const heri = (h: Heritage) =>
    `  {
    name: ${JSON.stringify(h.name)},
    cssVar: ${JSON.stringify(h.cssVar)},
    darkHex: ${JSON.stringify(h.darkHex)},
    lightHex: ${JSON.stringify(h.lightHex)},
    sortOrder: ${h.sortOrder},
    origin: ${JSON.stringify(h.origin)},
    symbolism: ${JSON.stringify(h.symbolism)},
    usage: ${JSON.stringify(h.usage)},
  },`

  const exp = (e: Experimental) =>
    `  {
    name: ${JSON.stringify(e.name)},
    lightHex: ${JSON.stringify(e.lightHex)},
    darkHex: ${JSON.stringify(e.darkHex)},
    containerLight: ${JSON.stringify(e.containerLight)},
    containerDark: ${JSON.stringify(e.containerDark)},
    onContainerLight: ${JSON.stringify(e.onContainerLight)},
    onContainerDark: ${JSON.stringify(e.onContainerDark)},
    uiLight: ${JSON.stringify(e.uiLight)},
    uiDark: ${JSON.stringify(e.uiDark)},
    heptagonIndex: ${e.heptagonIndex},
    sortOrder: ${e.sortOrder},
  },`

  return `/**
 * SEVEN MINERALS + SEVEN HERITAGE + SEVEN EXPERIMENTAL — canonical colour
 * palette snapshot.
 *
 * AUTO-GENERATED by \`scripts/sync-tokens.ts\` from the Supabase document store
 * (collections \`styling-minerals\`, \`styling-heritage-colors\` and
 * \`styling-experimental\`). The database is the single source of truth — DO NOT
 * EDIT THIS FILE BY HAND.
 *
 *   pnpm tokens:sync     regenerate this file + the globals.css palette block
 *   pnpm tokens:verify   CI gate — fails if this snapshot drifts from the DB
 *
 * Two mineral families: \`deep-earth\` (cobalt, tanzanite, malachite, sodalite)
 * and \`hand\` (gold, terracotta, copper). Heritage tones are atmospheric
 * anchors with no family/role.
 *
 * The experimental seven are a computed heptagon — hues offset 17 degrees,
 * prime saturations, foregrounds solved to P7 — carrying a \`heptagonIndex\`
 * (0–6) that fixes each tone's position on the wheel. They are exported here so
 * TypeScript can reach them; their \`--exp-*\` custom properties in globals.css
 * remain hand-written and are verified against these values by
 * \`pnpm tokens:verify\`.
 */

export interface MineralToken {
  name: string
  role: string
  family: "deep-earth" | "hand"
  cssVar: string
  darkHex: string
  lightHex: string
  containerDark: string
  containerLight: string
  onContainerDark: string
  onContainerLight: string
  sortOrder: number
  origin: string
  symbolism: string
  usage: string
}

export interface HeritageToken {
  name: string
  cssVar: string
  darkHex: string
  lightHex: string
  sortOrder: number
  origin: string
  symbolism: string
  usage: string
}

export const minerals: MineralToken[] = [
${minerals.map(mineral).join("\n")}
]

export const heritageColors: HeritageToken[] = [
${heritage.map(heri).join("\n")}
]

export interface ExperimentalToken {
  name: string
  lightHex: string
  darkHex: string
  containerLight: string
  containerDark: string
  onContainerLight: string
  onContainerDark: string
  uiLight: string
  uiDark: string
  /** Position on the seven-point hue wheel, 0-6. */
  heptagonIndex: number
  sortOrder: number
}

export const experimentalColors: ExperimentalToken[] = [
${experimental.map(exp).join("\n")}
]
`
}

function renderThemeBlock(minerals: Mineral[], heritage: Heritage[]): string {
  const m = minerals
    .map(
      (x) =>
        `  --color-${x.name}: var(--mineral-${x.name});\n` +
        `  --color-${x.name}-container: var(--mineral-${x.name}-container);\n` +
        `  --color-${x.name}-on-container: var(--mineral-${x.name}-on-container);`
    )
    .join("\n")
  const h = heritage.map((x) => `  --color-${x.name}: var(--heritage-${x.name});`).join("\n")
  return `${m}\n${h}`
}

function renderVars(minerals: Mineral[], heritage: Heritage[], mode: "light" | "dark"): string {
  const m = minerals
    .map((x) => {
      const base = mode === "light" ? x.lightHex : x.darkHex
      const con = mode === "light" ? x.containerLight : x.containerDark
      const onc = mode === "light" ? x.onContainerLight : x.onContainerDark
      return (
        `  --mineral-${x.name}: ${base.toLowerCase()};\n` +
        `  --mineral-${x.name}-container: ${con.toLowerCase()};\n` +
        `  --mineral-${x.name}-on-container: ${onc.toLowerCase()};`
      )
    })
    .join("\n")
  const h = heritage
    .map(
      (x) => `  --heritage-${x.name}: ${(mode === "light" ? x.lightHex : x.darkHex).toLowerCase()};`
    )
    .join("\n")
  return `${m}\n${h}`
}

// ─── Platform outputs ────────────────────────────────────────────────────────
//
// Every renderer emits BOTH themes. The hand-written files these replace
// emitted only the dark hex, so a light-theme Compose or SwiftUI consumer was
// handed dark values with nothing to signal it.

/** `terracotta` → `Terracotta`. */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
/** `terracotta` → `TERRACOTTA`. */
const upper = (s: string) => s.toUpperCase()
/** `#E1B07E` → `E1B07E`, for platforms that want a bare ARGB literal. */
const bare = (hex: string) => hex.replace("#", "").toUpperCase()

const banner = (comment: string, platform: string) =>
  [
    `${comment} NYUCHI DESIGN TOKENS — N1`,
    `${comment} ${platform} — generated by scripts/sync-tokens.ts from the Supabase`,
    `${comment} document store (styling-minerals, styling-heritage-colors).`,
    `${comment}`,
    `${comment} DO NOT EDIT BY HAND. Run \`pnpm tokens:sync\`; \`pnpm tokens:verify\``,
    `${comment} fails the build if this file drifts from the database.`,
  ].join("\n")

function renderSwift(minerals: Mineral[], heritage: Heritage[]): string {
  const pair = (name: string, dark: string, light: string) =>
    `    static let nyuchi${cap(name)}Dark  = Color(hex: "${dark}")\n` +
    `    static let nyuchi${cap(name)}Light = Color(hex: "${light}")`
  return `${banner("//", "Swift / SwiftUI")}

import SwiftUI

public extension Color {
    // Seven African Minerals
${minerals.map((m) => pair(m.name, m.darkHex, m.lightHex)).join("\n")}

    // Seven Heritage Colors
${heritage.map((h) => pair(h.name, h.darkHex, h.lightHex)).join("\n")}
}

public struct NyuchiSpacing {
${Object.entries(SCALE.spacing)
  .map(([k, v]) => `    public static let ${k}: CGFloat = ${v}`)
  .join("\n")}
}

public struct NyuchiRadius {
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    public static let ${k}: CGFloat = ${v}`)
  .join("\n")}
}

public struct NyuchiFonts {
${Object.entries(SCALE.fonts)
  .map(([k, v]) => `    public static let ${k} = ${JSON.stringify(v)}`)
  .join("\n")}
}
`
}

function renderKotlin(minerals: Mineral[], heritage: Heritage[]): string {
  const pair = (name: string, dark: string, light: string) =>
    `    val ${cap(name)}Dark  = Color(0xFF${bare(dark)})\n` +
    `    val ${cap(name)}Light = Color(0xFF${bare(light)})`
  return `${banner("//", "Kotlin / Jetpack Compose")}

package com.nyuchi.design.tokens

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

object NyuchiColors {
    // Seven African Minerals
${minerals.map((m) => pair(m.name, m.darkHex, m.lightHex)).join("\n")}

    // Seven Heritage Colors
${heritage.map((h) => pair(h.name, h.darkHex, h.lightHex)).join("\n")}
}

object NyuchiSpacing {
${Object.entries(SCALE.spacing)
  .map(([k, v]) => `    val ${k} = ${v}.dp`)
  .join("\n")}
}

object NyuchiRadius {
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    val ${k} = ${v}.dp`)
  .join("\n")}
}

object NyuchiFonts {
${Object.entries(SCALE.fonts)
  .map(([k, v]) => `    const val ${k} = ${JSON.stringify(v)}`)
  .join("\n")}
}
`
}

function renderArkTs(minerals: Mineral[], heritage: Heritage[]): string {
  const pair = (name: string, dark: string, light: string) =>
    `    ${name}Dark: ${JSON.stringify(dark)},\n    ${name}Light: ${JSON.stringify(light)},`
  return `${banner("//", "ArkTS / ArkUI (HarmonyOS)")}

export const NyuchiColors = {
    // Seven African Minerals
${minerals.map((m) => pair(m.name, m.darkHex, m.lightHex)).join("\n")}

    // Seven Heritage Colors
${heritage.map((h) => pair(h.name, h.darkHex, h.lightHex)).join("\n")}
} as const

export const NyuchiSpacing = {
${Object.entries(SCALE.spacing)
  .map(([k, v]) => `    ${k}: ${v},`)
  .join("\n")}
} as const

export const NyuchiRadius = {
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    ${k}: ${v},`)
  .join("\n")}
} as const

export const NyuchiFonts = {
${Object.entries(SCALE.fonts)
  .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
  .join("\n")}
} as const
`
}

function renderReactNative(minerals: Mineral[], heritage: Heritage[]): string {
  const pair = (name: string, dark: string, light: string) =>
    `    ${name}Dark: ${JSON.stringify(dark)},\n    ${name}Light: ${JSON.stringify(light)},`
  return `${banner("//", "React Native")}

export const NyuchiColors = {
    // Seven African Minerals
${minerals.map((m) => pair(m.name, m.darkHex, m.lightHex)).join("\n")}

    // Seven Heritage Colors
${heritage.map((h) => pair(h.name, h.darkHex, h.lightHex)).join("\n")}
} as const

export const NyuchiSpacing = {
${Object.entries(SCALE.spacing)
  .map(([k, v]) => `    ${k}: ${v},`)
  .join("\n")}
} as const

export const NyuchiRadius = {
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    ${k}: ${v},`)
  .join("\n")}
} as const

export const NyuchiFonts = {
${Object.entries(SCALE.fonts)
  .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
  .join("\n")}
} as const
`
}

function renderPython(minerals: Mineral[], heritage: Heritage[]): string {
  const pair = (name: string, dark: string, light: string) =>
    `    ${upper(name)}_DARK: str = ${JSON.stringify(dark)}\n` +
    `    ${upper(name)}_LIGHT: str = ${JSON.stringify(light)}`
  return `${banner("#", "Python")}

from dataclasses import dataclass


@dataclass(frozen=True)
class NyuchiMinerals:
    """Seven African Minerals — the brand accents, dark and light themes."""
${minerals.map((m) => pair(m.name, m.darkHex, m.lightHex)).join("\n")}


@dataclass(frozen=True)
class NyuchiHeritage:
    """Seven Heritage tones — atmospheric anchors, dark and light themes."""
${heritage.map((h) => pair(h.name, h.darkHex, h.lightHex)).join("\n")}


@dataclass(frozen=True)
class NyuchiSpacing:
    """Spacing scale, in pixels."""
${Object.entries(SCALE.spacing)
  .map(([k, v]) => `    ${upper(k)}: int = ${v}`)
  .join("\n")}


@dataclass(frozen=True)
class NyuchiRadius:
    """Radius scale, in pixels. Derived from the 7px unit."""
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    ${upper(k)}: int = ${v}`)
  .join("\n")}


minerals = NyuchiMinerals()
heritage = NyuchiHeritage()
spacing = NyuchiSpacing()
radius = NyuchiRadius()

# Ordered chart series for matplotlib / plotly / altair — dark theme.
CHART_COLORS = [
${minerals.map((m) => `    minerals.${upper(m.name)}_DARK,`).join("\n")}
${heritage.map((h) => `    heritage.${upper(h.name)}_DARK,`).join("\n")}
]
`
}

function renderRust(minerals: Mineral[], heritage: Heritage[]): string {
  // Every public item carries a doc comment. `mzizi-rs` sets `missing_docs = "warn"` at the
  // workspace level and CI runs clippy with `-D warnings`, so an undocumented `pub const`
  // here fails the Rust build — in a file nobody may hand-edit. Emitting the docs is
  // therefore the only place the fix can live (CLAUDE.md §8.4.1: fix the generator, never
  // the artifact).
  const consts = (rows: { name: string; darkHex: string; lightHex: string }[]) =>
    rows
      .map(
        (r) =>
          `/// ${cap(r.name)} — dark theme.\n` +
          `pub const ${upper(r.name)}_DARK: &str = ${JSON.stringify(r.darkHex)};\n` +
          `/// ${cap(r.name)} — light theme.\n` +
          `pub const ${upper(r.name)}_LIGHT: &str = ${JSON.stringify(r.lightHex)};`
      )
      .join("\n")
  const field = (r: { name: string }) =>
    `    /// ${cap(r.name)}, resolved for this theme.\n    pub ${r.name}: &'static str,`
  const darkInit = (r: { name: string }) => `            ${r.name}: ${upper(r.name)}_DARK,`
  const lightInit = (r: { name: string }) => `            ${r.name}: ${upper(r.name)}_LIGHT,`
  const all = [...minerals, ...heritage]

  return `${banner("//", "Rust")}
//
// \`nyuchi-tokens.ts\` has declared a Rust target ("const values + config
// structs") since the file was written, and nothing ever emitted one. This is
// that file, and it is what the Dioxus half of the registry consumes.

#![allow(dead_code)]

// ─── Seven African Minerals ─────────────────────────────────────────────────
${consts(minerals)}

// ─── Seven Heritage tones ───────────────────────────────────────────────────
${consts(heritage)}

/// Every palette colour for one theme. Construct with [\`Palette::dark\`] or
/// [\`Palette::light\`] rather than by hand, so a new colour cannot be missed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Palette {
${all.map(field).join("\n")}
}

impl Palette {
    /// The palette resolved for the dark theme.
    pub const fn dark() -> Self {
        Self {
${all.map(darkInit).join("\n")}
        }
    }

    /// The palette resolved for the light theme.
    pub const fn light() -> Self {
        Self {
${all.map(lightInit).join("\n")}
        }
    }
}

/// Spacing scale, in pixels.
pub struct Spacing;

impl Spacing {
${Object.entries(SCALE.spacing)
  .map(([k, v]) => `    /// ${v}px.\n    pub const ${upper(k)}: u32 = ${v};`)
  .join("\n")}
}

/// Radius scale, in pixels. Every value derives from the 7px unit.
pub struct Radius;

impl Radius {
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    /// ${v}px.\n    pub const ${upper(k)}: u32 = ${v};`)
  .join("\n")}
}

/// The canonical type stack.
pub struct Fonts;

impl Fonts {
${Object.entries(SCALE.fonts)
  .map(([k, v]) => `    /// ${v}.\n    pub const ${upper(k)}: &'static str = ${JSON.stringify(v)};`)
  .join("\n")}
}
`
}

interface PlatformTarget {
  file: string
  render: (minerals: Mineral[], heritage: Heritage[]) => string
}

const PLATFORM_TARGETS: PlatformTarget[] = [
  { file: "nyuchi-tokens-swift.swift", render: renderSwift },
  { file: "nyuchi-tokens-kotlin.kt", render: renderKotlin },
  { file: "nyuchi-tokens-arkts.ets", render: renderArkTs },
  { file: "nyuchi-tokens-react-native.ts", render: renderReactNative },
  { file: "nyuchi-tokens-python.py", render: renderPython },
  { file: "nyuchi-tokens-rust.rs", render: renderRust },
]

function spliceRegion(css: string, region: string, body: string): string {
  const start = `/* tokens:generated:${region}:start */`
  const end = `/* tokens:generated:${region}:end */`
  const s = css.indexOf(start)
  const e = css.indexOf(end)
  if (s === -1 || e === -1) fail(`globals.css is missing the ${region} generated markers`)
  return css.slice(0, s + start.length) + "\n" + body + "\n  " + css.slice(e)
}

/** Strip whitespace so value drift is caught but formatting differences are not. */
const norm = (s: string) => s.replace(/\s+/g, "")

/**
 * Verify the hand-written `--exp-*` block in globals.css against the DB.
 *
 * These properties live OUTSIDE the `tokens:generated:*` markers, so this
 * script does not own them and must not rewrite them — a generated colour that
 * differs by one digit from the shipped one is a visual regression nobody
 * reviewed. Verifying gets the guarantee (the CSS cannot silently disagree with
 * the DB) without taking the risk.
 *
 * Each tone contributes four properties per theme. Light values are asserted
 * inside the `:root` block and dark inside `.dark`, because a value present in
 * the wrong theme block is exactly the defect that shipped dark colours to
 * light-theme consumers in the platform files.
 */
function checkExperimentalCss(css: string, experimental: Experimental[]): string[] {
  const drift: string[] = []
  // Split on the `.dark {` BLOCK OPENER, not on the substring `.dark` — line 5
  // is `@custom-variant dark (&:is(.dark *))`, so a plain indexOf puts the whole
  // file in the dark half and every light assertion fails spuriously. (It did.)
  const darkAt = css.search(/^\.dark\s*\{/m)
  if (darkAt === -1) {
    drift.push("globals.css has no `.dark {` block — cannot locate dark-theme values")
    return drift
  }
  const light = css.slice(0, darkAt)
  const dark = css.slice(darkAt)

  const has = (block: string, prop: string, value: string) =>
    new RegExp(`--${prop}\\s*:\\s*${value}\\s*;`, "i").test(block)

  for (const e of experimental) {
    const cases: [string, string, string, string][] = [
      ["light", `exp-${e.name}`, e.lightHex, "light_hex"],
      ["dark", `exp-${e.name}`, e.darkHex, "dark_hex"],
      ["light", `exp-${e.name}-container`, e.containerLight, "container_light"],
      ["dark", `exp-${e.name}-container`, e.containerDark, "container_dark"],
      ["light", `exp-${e.name}-on`, e.onContainerLight, "on_container_light"],
      ["dark", `exp-${e.name}-on`, e.onContainerDark, "on_container_dark"],
      ["light", `exp-${e.name}-ui`, e.uiLight, "ui_light"],
      ["dark", `exp-${e.name}-ui`, e.uiDark, "ui_dark"],
    ]
    for (const [theme, prop, value, column] of cases) {
      if (!value) continue // the DB does not define every rung for every tone
      if (!has(theme === "light" ? light : dark, prop, value)) {
        drift.push(`--${prop} (${theme}) != ${column} ${value}`)
      }
    }
  }
  return drift
}

async function main() {
  const { minerals, heritage, experimental } = await fetchPalette()

  const paletteModule = renderPaletteModule(minerals, heritage, experimental)
  let css = await readFile(GLOBALS_CSS, "utf8")
  css = spliceRegion(css, "theme", renderThemeBlock(minerals, heritage))
  css = spliceRegion(css, "light", renderVars(minerals, heritage, "light"))
  css = spliceRegion(css, "dark", renderVars(minerals, heritage, "dark"))

  const platforms = PLATFORM_TARGETS.map((t) => ({
    path: join(N1, t.file),
    label: `components/registry/n1-tokens/${t.file}`,
    body: t.render(minerals, heritage),
  }))

  if (CHECK) {
    const onDiskPalette = await readFile(PALETTE_TS, "utf8")
    const onDiskCss = await readFile(GLOBALS_CSS, "utf8")
    const drift: string[] = []
    if (norm(onDiskPalette) !== norm(paletteModule)) drift.push("lib/tokens/palette.generated.ts")
    if (norm(onDiskCss) !== norm(css)) drift.push("app/globals.css")
    for (const p of platforms) {
      // A missing platform file is drift, not a crash — that is exactly the
      // state `nyuchi-tokens-rust.rs` was in for the life of the repo.
      const onDisk = await readFile(p.path, "utf8").catch(() => null)
      if (onDisk === null || norm(onDisk) !== norm(p.body)) drift.push(p.label)
    }
    const expDrift = checkExperimentalCss(onDiskCss, experimental)
    if (expDrift.length) {
      fail(
        `globals.css --exp-* values drifted from styling-experimental:\n  ` +
          expDrift.join("\n  ") +
          `\nThese properties are hand-written (outside the tokens:generated markers), ` +
          `so \`pnpm tokens:sync\` will NOT fix them — edit globals.css to match the DB, ` +
          `or change the DB if the CSS is right.`
      )
    }
    if (drift.length) {
      fail(`token artifacts drifted from the DB: ${drift.join(", ")}. Run \`pnpm tokens:sync\`.`)
    }
    console.log(
      `✓ tokens in sync with the DB (7 minerals, 7 heritage, 7 experimental; ` +
        `${platforms.length} platform targets)`
    )
    return
  }

  await writeFile(PALETTE_TS, paletteModule)
  await writeFile(GLOBALS_CSS, css)
  for (const p of platforms) await writeFile(p.path, p.body)
  const expDrift = checkExperimentalCss(css, experimental)
  if (expDrift.length) {
    // Not a hard failure on write: the sync's job is the artifacts it owns, and
    // the --exp-* block is not one of them. Warn loudly so it gets fixed, and
    // let `tokens:verify` be the gate that actually blocks.
    console.warn(
      `! globals.css --exp-* values disagree with styling-experimental ` +
        `(${expDrift.length} propert${expDrift.length === 1 ? "y" : "ies"}); ` +
        `run \`pnpm tokens:verify\` for the list. Not rewritten — those properties ` +
        `are hand-maintained.`
    )
  }
  console.log(
    `✓ synced ${minerals.length} minerals + ${heritage.length} heritage + ` +
      `${experimental.length} experimental → palette.generated.ts, globals.css, ` +
      `${platforms.length} platform targets`
  )
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)))
