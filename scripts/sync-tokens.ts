#!/usr/bin/env -S tsx
/**
 * Sync the seven-mineral + seven-heritage colour palette from the Supabase
 * document store into the committed token artifacts.
 *
 * The DB is the single source of truth (collections `styling-minerals` and
 * `styling-heritage-colors` in `component_documents`). This script projects
 * those rows into:
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

async function fetchPalette(): Promise<{ minerals: Mineral[]; heritage: Heritage[] }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are required")

  const supabase = createClient(url, key)
  const { data, error } = await supabase
    .from("component_documents")
    .select("collection, document")
    .in("collection", ["styling-minerals", "styling-heritage-colors"])
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

  if (minerals.length !== 7) fail(`expected 7 minerals, got ${minerals.length}`)
  if (heritage.length !== 7) fail(`expected 7 heritage tones, got ${heritage.length}`)
  return { minerals, heritage }
}

function renderPaletteModule(minerals: Mineral[], heritage: Heritage[]): string {
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

  return `/**
 * SEVEN MINERALS + SEVEN HERITAGE — canonical colour palette snapshot.
 *
 * AUTO-GENERATED by \`scripts/sync-tokens.ts\` from the Supabase document store
 * (collections \`styling-minerals\` and \`styling-heritage-colors\`). The database
 * is the single source of truth — DO NOT EDIT THIS FILE BY HAND.
 *
 *   pnpm tokens:sync     regenerate this file + the globals.css palette block
 *   pnpm tokens:verify   CI gate — fails if this snapshot drifts from the DB
 *
 * Two mineral families: \`deep-earth\` (cobalt, tanzanite, malachite, sodalite)
 * and \`hand\` (gold, terracotta, copper). Heritage tones are atmospheric
 * anchors with no family/role.
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
  const consts = (rows: { name: string; darkHex: string; lightHex: string }[]) =>
    rows
      .map(
        (r) =>
          `pub const ${upper(r.name)}_DARK: &str = ${JSON.stringify(r.darkHex)};\n` +
          `pub const ${upper(r.name)}_LIGHT: &str = ${JSON.stringify(r.lightHex)};`
      )
      .join("\n")
  const field = (r: { name: string }) => `    pub ${r.name}: &'static str,`
  const darkInit = (r: { name: string }) => `        ${r.name}: ${upper(r.name)}_DARK,`
  const lightInit = (r: { name: string }) => `        ${r.name}: ${upper(r.name)}_LIGHT,`
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
    pub const fn dark() -> Self {
        Self {
${all.map(darkInit).join("\n")}
        }
    }

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
  .map(([k, v]) => `    pub const ${upper(k)}: u32 = ${v};`)
  .join("\n")}
}

/// Radius scale, in pixels. Every value derives from the 7px unit.
pub struct Radius;

impl Radius {
${Object.entries(SCALE.radius)
  .map(([k, v]) => `    pub const ${upper(k)}: u32 = ${v};`)
  .join("\n")}
}

/// The canonical type stack.
pub struct Fonts;

impl Fonts {
${Object.entries(SCALE.fonts)
  .map(([k, v]) => `    pub const ${upper(k)}: &'static str = ${JSON.stringify(v)};`)
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

async function main() {
  const { minerals, heritage } = await fetchPalette()

  const paletteModule = renderPaletteModule(minerals, heritage)
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
    if (drift.length) {
      fail(`token artifacts drifted from the DB: ${drift.join(", ")}. Run \`pnpm tokens:sync\`.`)
    }
    console.log(
      `✓ tokens in sync with the DB (7 minerals, 7 heritage; ${platforms.length} platform targets)`
    )
    return
  }

  await writeFile(PALETTE_TS, paletteModule)
  await writeFile(GLOBALS_CSS, css)
  for (const p of platforms) await writeFile(p.path, p.body)
  console.log(
    `✓ synced ${minerals.length} minerals + ${heritage.length} heritage tones → ` +
      `palette.generated.ts, globals.css, ${platforms.length} platform targets`
  )
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)))
