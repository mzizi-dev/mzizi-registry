"use client"

// ── INFRASTRUCTURE HARNESS (auto-wired) ──
// Every brand component participates in observability, motion, a11y,
// and health monitoring via the harness. Zero manual config.
import { useNyuchiHarness } from "@/lib/harness"

import * as React from "react"
import { cn } from "@/lib/utils"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI WASHED THEME — the one washed-theme mechanism.

   A washed theme is "surface tinted by accent": pick an accent,
   mix a little of it into the active surface to get a container
   (the WASH), and solve a foreground that stays legible on it.

   Four independent implementations of this one idea existed —
   nhimbe's `.event-themed-page`, bushtrade's `.season-*` blocks,
   this repo's own `--wash`, and a retired styling-washed-themes
   collection. They disagreed on the mix space (srgb vs oklab), the
   strength (7/8/12/14%), the argument order, and the variable
   names. This component is the single mechanism they collapse to.

   WHAT IT EMITS. On its root element, as inline custom properties
   every descendant inherits:

     --washed-accent   the saturated mark colour
     --wash            the container: surface tinted by the accent
     --washed-on-wash  an AAA-aimed foreground for that wash
     --washed-gradient the cover gradient

   plus the `--event-*` aliases (`--event-primary`, `--event-on-wash`,
   `--event-gradient`) that nyuchi-cover-wash-header and nhimbe's
   event pages already read, so existing call sites keep working.

   WHERE THE COLOURS COME FROM. Every value is a `var(--color-<family>,
   #canon)` reference: the token when the app ships mzizi's palette —
   which is already light/dark switched, so the accent follows the
   mode for free — and the canonical hex when it does not. No hex is
   ever pasted bare (CLAUDE.md §7.4), and nothing is fetched: the
   repo is the source of truth and no route may depend on a network
   call.

   MODE-DEPENDENT STRENGTH. The mix percentages are read from
   `--wash-surface` / `--wash-on-*` with light-mode defaults, so an
   app tunes dark mode in one place:

     .dark { --wash-surface: 88%; --wash-on-strength: 48%;
             --wash-on-mix: white; }

   That is the same 93%/88% split app/globals.css already uses for
   the repo's own `--wash`, kept in the same oklab space.
   ═══════════════════════════════════════════════════════════════ */

/** The seven heritage tones — atmospheric anchors, no family/role. */
type HeritageTheme = "indigo" | "savanna" | "baobab" | "sunset" | "river" | "hematite" | "kalahari"

/** The seven minerals — these carry a real on-container token. */
type MineralTheme =
  "cobalt" | "tanzanite" | "malachite" | "sodalite" | "gold" | "terracotta" | "copper"

type WashedThemeName = HeritageTheme | MineralTheme

/**
 * Accent per family, as a token reference with the canonical fallback.
 *
 * Two entries per family because the fallback — and only the fallback —
 * is mode-specific. When the app ships the palette, `--color-<family>`
 * is already switched by `:root` / `.dark` and both forms resolve to the
 * same, correct value; the pair only matters for a consumer installing
 * this component into a project that has no mzizi tokens yet.
 */
const ACCENT: Record<WashedThemeName, { light: string; dark: string }> = {
  // Heritage — lightHex / darkHex straight from palette.source.ts.
  indigo: { light: "var(--color-indigo, #4527A0)", dark: "var(--color-indigo, #7986CB)" },
  savanna: { light: "var(--color-savanna, #8D6E1A)", dark: "var(--color-savanna, #E5C158)" },
  baobab: { light: "var(--color-baobab, #4E342E)", dark: "var(--color-baobab, #A1887F)" },
  sunset: { light: "var(--color-sunset, #D84315)", dark: "var(--color-sunset, #FF7043)" },
  river: { light: "var(--color-river, #006064)", dark: "var(--color-river, #4DD0E1)" },
  hematite: { light: "var(--color-hematite, #546E7A)", dark: "var(--color-hematite, #90A4AE)" },
  kalahari: { light: "var(--color-kalahari, #C9B589)", dark: "var(--color-kalahari, #E8D9B5)" },
  // Minerals.
  cobalt: { light: "var(--color-cobalt, #0047AB)", dark: "var(--color-cobalt, #00B0FF)" },
  tanzanite: { light: "var(--color-tanzanite, #4B0082)", dark: "var(--color-tanzanite, #B388FF)" },
  malachite: { light: "var(--color-malachite, #004D40)", dark: "var(--color-malachite, #64FFDA)" },
  sodalite: { light: "var(--color-sodalite, #283593)", dark: "var(--color-sodalite, #3D5AFE)" },
  gold: { light: "var(--color-gold, #5D4037)", dark: "var(--color-gold, #FFD740)" },
  terracotta: {
    light: "var(--color-terracotta, #A0522D)",
    dark: "var(--color-terracotta, #E1B07E)",
  },
  copper: { light: "var(--color-copper, #BF5A36)", dark: "var(--color-copper, #FF8A65)" },
}

/**
 * Minerals ship a solved on-container; heritage tones do not.
 *
 * Where canon has the value, use it — a solved pair beats anything
 * derived. Heritage falls through to the mix below.
 */
const ON_CONTAINER: Partial<Record<WashedThemeName, string>> = {
  cobalt: "var(--on-container-cobalt, #002966)",
  tanzanite: "var(--on-container-tanzanite, #2E004D)",
  malachite: "var(--on-container-malachite, #00332B)",
  sodalite: "var(--on-container-sodalite, #141A5C)",
  gold: "var(--on-container-gold, #3E2723)",
  terracotta: "var(--on-container-terracotta, #5D2906)",
  copper: "var(--on-container-copper, #5C2410)",
}

/** The fully-solved washed theme for one mode. */
interface WashedThemeColors {
  /** The saturated mark colour. */
  accent: string
  /** The container — surface tinted by the accent. */
  wash: string
  /** Foreground on the wash. */
  onWash: string
  /** Cover gradient. */
  gradient: string
}

/**
 * Solve a washed theme without rendering anything.
 *
 * Exported for the call sites that need the values rather than a
 * wrapper element: a theme picker previewing swatches, an OG image
 * route, a `<meta name="theme-color">`, or a stored event theme.
 *
 * `accent` overrides the named theme entirely, which is how an
 * app themes by something the palette does not name — bushtrade's
 * planting/growing/harvest/dry seasons, for instance.
 */
function resolveWashedTheme(
  theme: WashedThemeName | undefined,
  mode: "light" | "dark" = "light",
  accent?: string
): WashedThemeColors {
  const ink = accent ?? (theme ? ACCENT[theme][mode] : "var(--brand-accent)")

  // Surface-first, oklab — the same form and space as the `--wash`
  // in app/globals.css, so a page using both stays consistent.
  const wash = `color-mix(in oklab, var(--surface) var(--wash-surface, ${
    mode === "dark" ? "88%" : "93%"
  }), ${ink})`

  // Only a NAMED theme can claim canon's solved on-container; an explicit
  // accent has no token to look up, so it always derives.
  const solved = theme && !accent ? ON_CONTAINER[theme] : undefined
  const onWash =
    solved ??
    `color-mix(in oklab, ${ink} var(--wash-on-strength, ${
      mode === "dark" ? "48%" : "82%"
    }), var(--wash-on-mix, ${mode === "dark" ? "white" : "black"}))`

  const gradient =
    mode === "dark"
      ? `linear-gradient(135deg, ${ink}, ${onWash})`
      : `linear-gradient(135deg, ${onWash}, ${ink})`

  return { accent: ink, wash, onWash, gradient }
}

interface NyuchiWashedThemeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Named palette family to theme from. Ignored when `accent` is set. */
  theme?: WashedThemeName
  /**
   * Explicit accent, for a theme the palette does not name (a season, a
   * per-event colour). Takes precedence over `theme`.
   */
  accent?: string
  /**
   * Which mode's fallbacks and mix strengths to emit. Only affects a
   * project without mzizi tokens; with them the accent switches itself.
   */
  mode?: "light" | "dark"
  /** Paint `--wash` as this element's background. Default true. */
  paint?: boolean
  /** Render as a different element. Default "div". */
  as?: "div" | "section" | "main" | "article"
  children?: React.ReactNode
}

function NyuchiWashedTheme({
  theme,
  accent,
  mode = "light",
  paint = true,
  as: Tag = "div",
  className,
  style,
  children,
  ...props
}: NyuchiWashedThemeProps) {
  useNyuchiHarness("washed-theme")

  const solved = React.useMemo(() => resolveWashedTheme(theme, mode, accent), [theme, mode, accent])

  const rootStyle = {
    "--washed-accent": solved.accent,
    "--wash": solved.wash,
    "--washed-on-wash": solved.onWash,
    "--washed-gradient": solved.gradient,
    // Aliases the existing call sites already read.
    "--event-primary": solved.accent,
    "--event-on-wash": solved.onWash,
    "--event-gradient": solved.gradient,
    ...(paint ? { background: "var(--wash)" } : null),
    ...style,
  } as React.CSSProperties

  return (
    <Tag
      data-slot="nyuchi-washed-theme"
      data-theme-family={accent ? "custom" : theme}
      data-mode={mode}
      style={rootStyle}
      className={cn(className)}
      {...props}
    >
      {children}
    </Tag>
  )
}

export { NyuchiWashedTheme, resolveWashedTheme }
export type {
  NyuchiWashedThemeProps,
  WashedThemeColors,
  WashedThemeName,
  HeritageTheme,
  MineralTheme,
}
