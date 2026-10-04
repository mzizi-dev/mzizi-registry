#!/usr/bin/env -S tsx
/**
 * Project the token sources into `design-system/tokens.json`, the tokens file of
 * the mzizi design system (the brand book, marks and component renditions in
 * `design-system/`).
 *
 *   pnpm design-system:generate          write design-system/tokens.json
 *   pnpm design-system:generate:check    fail if it has drifted from its sources (CI)
 *
 * NOTHING IN tokens.json IS AUTHORED THERE. Every value comes from a source this
 * repo already treats as canonical:
 *   - colour values      styles/globals.css `:root` (light) and `.dark` (dark) —
 *                        the exact values the registry ships, palette regions
 *                        included (those are written by `pnpm tokens:sync`)
 *   - colour notes       lib/tokens/palette.source.ts (minerals, heritage) and
 *                        the role notes below for the semantic surfaces
 *   - type, spacing      lib/tokens/brand.source.ts (`typography`, `spacing`)
 *   - radii, targets     lib/tokens/brand.source.ts (`brandMeta.radii`,
 *                        `brandMeta.accessibility`)
 *   - media aspects      styles/globals.css `@theme` (`--aspect-*`)
 *
 * The output shape is the Design System artifact format: every family is a LIST of
 * `{name, value, usage}`, never a name-to-value map, and colour values are
 * `{light, dark}`. A `var(--x)` colour becomes the alias `"{x}"`; a value built with
 * `calc()` or `color-mix()` (only `--wash`) is skipped, because a token file holds
 * resolved values.
 *
 * No git sha is written: the same sources must produce the same bytes on every
 * commit, or `--check` would fail on every merge.
 */

import { existsSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import prettier from "prettier"
import { experimentalColors, heritageColors, minerals } from "../lib/tokens/palette.source"
import { brandMeta, spacing, typography } from "../lib/tokens/brand.source"

const ROOT = process.cwd()
const CSS_PATH = join(ROOT, "styles/globals.css")
const OUT_PATH = join(ROOT, "design-system/tokens.json")

type Theme = "light" | "dark"
interface ColorToken {
  name: string
  value: Record<Theme, string>
  usage: string
}

function block(css: string, selector: string): string {
  const start = css.indexOf(`\n${selector} {`)
  if (start < 0) throw new Error(`styles/globals.css has no \`${selector} {\` block`)
  return css.slice(start, css.indexOf("\n}", start))
}

function declarations(src: string): Map<string, string> {
  const out = new Map<string, string>()
  const stripped = src.replace(/\/\*[\s\S]*?\*\//g, "")
  for (const m of stripped.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out.set(m[1], m[2].trim())
  return out
}

function normalize(value: string): string {
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value)
  if (alias) return `{${alias[1]}}`
  if (value.startsWith("#")) return value.toLowerCase()
  return value.replace(/\s+/g, "")
}

/** Role notes for the semantic tokens. Their values come from globals.css. */
const SEMANTIC: [string, string][] = [
  ["background", "Ambient page base — the warm-grey paper everything sits on. Carries the dot grid."],
  ["foreground", "Default text and icons on background, card, popover, muted and every surface rung."],
  ["card", "Content surface — cards, panels, tables. White in light, darker than background in dark."],
  ["card-foreground", "Text on card."],
  ["popover", "Popovers, menus, dropdown panels."],
  ["popover-foreground", "Text on popover."],
  ["primary", "Default button fill, checked controls, active switch. Near-black ink in light, near-white in dark."],
  ["primary-foreground", "Text and icons on primary."],
  ["secondary", "Secondary button fill."],
  ["secondary-foreground", "Text on secondary."],
  ["muted", "Inset fills — tab lists, metadata rows, skeletons. Deepest fill in dark for maximum text contrast."],
  ["muted-foreground", "Secondary text, descriptions, placeholders, captions on background, card and muted."],
  ["accent", "Hover fills and selected rows."],
  ["accent-foreground", "Text on accent."],
  ["destructive", "Error text and destructive actions; used at 10–20% as the destructive button fill. Also --status-error."],
  ["overlay", "Modal and sheet surface."],
  ["overlay-foreground", "Text on overlay."],
  ["scrim", "Backdrop behind modals and sheets."],
  ["border", "Hairline for cards, dividers, tables — 6% ink, never a hard grey."],
  ["input", "Input border; inputs and outline buttons fill with input at 30%."],
  ["ring", "Focus ring colour — 3px ring at 50% on focus-visible."],
  ["surface", "Surface-elevation rung P7 — card/panel surface for elevation-aware layouts."],
  ["container", "Rung P11 — neutral containers, grouped content."],
  ["raised", "Rung P17 — menus and toasts above overlay."],
  ["pitch", "Rung P2 — deepest surface: media wells, splash."],
  ["void", "Rung P3 — app shell behind base."],
  ["sidebar", "Sidebar and navigation rail background."],
  ["sidebar-foreground", "Text on sidebar."],
  ["sidebar-primary", "Active sidebar item fill."],
  ["sidebar-primary-foreground", "Text on sidebar-primary."],
  ["sidebar-accent", "Sidebar hover fill."],
  ["sidebar-accent-foreground", "Text on sidebar-accent."],
  ["sidebar-border", "Sidebar dividers."],
  ["sidebar-ring", "Focus ring inside the sidebar."],
  [
    "brand-accent",
    "Per-brand saturated accent for CTAs and highlights. The registry default is gold (deep amber in light, honey in dark); mukoko maps it to tanzanite, bundu to copper — consumer apps override it.",
  ],
  ["brand-accent-foreground", "Text on brand-accent."],
  ["success", "Success / positive state (malachite). Also --status-success."],
  ["warning", "Warning state (amber). Also --status-warning."],
  ["info", "Informational state (cobalt). Also --status-info."],
  ["neutral", "Neutral / inactive status, secondary data series. Also --status-neutral."],
  ["offline", "Offline connectivity state."],
  ["syncing", "Syncing / in-flight state."],
]

const CHART_MINERALS = ["tanzanite", "cobalt", "malachite", "gold", "terracotta"]

/**
 * Raw mineral / heritage pairs that miss 4.5:1 on `card`, measured from the
 * values above. `__tests__/design-system.test.ts` recomputes every pair and fails
 * if this list stops matching reality, so a palette change cannot leave a stale
 * contrast claim behind.
 */
export const CONTRAST_FLAGS: Record<string, string> = {
  copper:
    " Contrast: 4.44:1 on card in light — use at 18.66px+ bold / 24px+, or for fills and marks; body text in copper goes on copper-container via copper-on-container.",
  sunset: " Contrast: 4.44:1 on card in light — large text and marks only.",
  kalahari: " Contrast: 2.01:1 on card in light — never text in light; a background/atmosphere tone.",
  sodalite:
    " Contrast: 3.73:1 on card in dark — large text and marks only in dark; body text uses sodalite-on-container on sodalite-container.",
}

export function buildTokens(css: string) {
  const light = declarations(block(css, ":root"))
  const dark = declarations(block(css, ".dark"))
  const theme = declarations(css.slice(css.indexOf("@theme inline {"), css.indexOf("\n}", css.indexOf("@theme inline {"))))
  const colors: ColorToken[] = []

  const add = (name: string, usage: string, key = name) => {
    const l = light.get(key)
    if (l === undefined) throw new Error(`styles/globals.css :root does not declare --${key}`)
    if (/calc\(|color-mix\(/.test(l)) return
    const d = dark.get(key) ?? l
    colors.push({ name, value: { light: normalize(l), dark: normalize(d) }, usage: usage + (CONTRAST_FLAGS[name] ?? "") })
  }

  for (const [name, usage] of SEMANTIC) add(name, usage)
  CHART_MINERALS.forEach((m, i) => add(`chart-${i + 1}`, `Chart series ${i + 1} — ${m} mineral.`))
  for (const m of minerals) {
    add(m.name, `Mineral · ${m.role} — ${m.usage}. ${m.symbolism}.`, `mineral-${m.name}`)
    add(`${m.name}-container`, `Soft ${m.name} fill behind ${m.name}-on-container text: chips, callouts, selected states.`, `mineral-${m.name}-container`)
    add(`${m.name}-on-container`, `Text and icons on ${m.name}-container.`, `mineral-${m.name}-on-container`)
  }
  for (const h of heritageColors) {
    add(h.name, `Heritage tone — ${h.usage}. ${h.symbolism}. Atmospheric, not a UI state colour.`, `heritage-${h.name}`)
  }
  for (const e of experimentalColors) {
    add(e.name, "Experimental Seven — computed heptagon hue; text-safe (≥7:1) on the base. Newsroom and exploratory surfaces only.", `exp-${e.name}`)
    add(`${e.name}-container`, `Soft ${e.name} fill.`, `exp-${e.name}-container`)
    add(`${e.name}-on`, `Text on ${e.name}-container.`, `exp-${e.name}-on`)
    add(`${e.name}-ui`, `Non-text ${e.name} marks: icons, bars, chart fills (3:1 tier, not for body text).`, `exp-${e.name}-ui`)
  }
  add("dot-color", "Blueprint dot grid on body — 1px dots at the dot-pitch, fixed.")

  const scale = typography.filter((t) => t.entryType === "scale")
  const style = (t: (typeof typography)[number]) => {
    let usage = t.usage
    if (t.fluidMinPx) usage += ` Fluid ${t.fluidMinPx}–${t.fluidMaxPx}px.`
    if (t.fontFeatures) usage += ` Font features: ${t.fontFeatures}.`
    return {
      name: t.name.toLowerCase().replace(/\s+/g, "-"),
      fontSize: `${t.sizePx}px`,
      lineHeight: t.lineHeight,
      fontWeight: t.weight,
      ...(t.letterSpacing && t.letterSpacing !== "normal" ? { letterSpacing: t.letterSpacing } : {}),
      usage,
    }
  }
  const medium = typography.find((t) => t.entryType === "weight" && t.weight === 500)
  const family = (name: string) => typography.find((t) => t.entryType === "font" && t.name === name)?.family

  const radii = brandMeta.radii as Record<string, string>
  const access = brandMeta.accessibility as Record<string, number>
  const dotPitch = /background-size:\s*(\d+px)/.exec(css)?.[1]
  if (!dotPitch) throw new Error("styles/globals.css has no body background-size for the dot grid")

  return {
    name: "mzizi",
    version: 1,
    meta: {
      source: "github",
      repo: "mzizi-dev/mzizi-registry",
      generator: "scripts/generate-design-system.ts",
      paths: {
        tokens: ["styles/globals.css", "lib/tokens/palette.source.ts", "lib/tokens/brand.source.ts"],
        assets: ["design-system/marks/"],
        docs: ["design-system/README.md"],
      },
    },
    color: { themes: [{ id: "light", name: "Light" }, { id: "dark", name: "Dark" }], tokens: colors },
    type: {
      fonts: [],
      families: {
        sans: `"${family("sans")}", system-ui, sans-serif`,
        serif: `"${family("serif")}", Georgia, serif`,
        mono: `"${family("mono")}", monospace`,
      },
      groups: [
        { name: "Display", family: "serif", styles: scale.filter((t) => t.font === "serif").map(style) },
        {
          name: "Text",
          family: "sans",
          styles: [
            ...scale.filter((t) => t.font === "sans").map(style),
            ...(medium ? [{ name: "label", fontSize: "14px", lineHeight: "1.5", fontWeight: 500, usage: `${medium.usage}. ${medium.reason}` }] : []),
          ],
        },
        { name: "Code", family: "mono", styles: scale.filter((t) => t.font === "mono").map(style) },
      ],
    },
    spacing: {
      note: "Ecosystem spacing scale. Default component padding is space-base; comfortable is space-base-plus.",
      tokens: spacing.map((s) => ({ name: `space-${s.name}`, value: `${s.px}px`, usage: s.usage })),
    },
    radius: {
      note: radii.system,
      tokens: [
        { name: "radius-sm", value: radii.sm, usage: "1× unit. Checkboxes, small chips, inline code." },
        { name: "radius-md", value: radii.md, usage: "Unit + 5. Inner corners of card headers/footers, images inside cards." },
        { name: "radius-lg", value: radii.lg, usage: "2× unit — THE card radius; also the base --radius." },
        { name: "radius-xl", value: radii.xl, usage: "Unit + 10. Dialogs, vertical tab lists." },
        { name: "radius-full", value: radii.full, usage: "Pill: every button, input, switch and horizontal tab list. Brand identity decision." },
      ],
    },
    size: {
      note: `Touch targets and control heights (${brandMeta.accessibility.standard}).`,
      tokens: [
        { name: "touch-min", value: `${access.minTouchTarget}px`, usage: "Minimum touch target — small buttons, inputs, icon-sm buttons." },
        { name: "touch-default", value: `${access.defaultTouchTarget}px`, usage: "Default touch target — default and large buttons, horizontal tab lists." },
        { name: "focus-ring", value: "3px", usage: "Focus-visible ring width, drawn in ring at 50% (focus-visible:ring-[3px] in the N2 primitives)." },
        { name: "dot-pitch", value: dotPitch, usage: "Body dot-grid pitch (1px dots in dot-color)." },
      ],
    },
    aspect: {
      note: "Media aspect ratios. Square is the default.",
      tokens: [
        { name: "aspect-media", value: theme.get("aspect-media"), usage: "Default for every media surface and detail-page hero." },
        { name: "aspect-media-wide", value: theme.get("aspect-media-wide"), usage: "Only for intrinsically 16:9 media (video frames) — never to make a layout look better." },
        { name: "aspect-media-portrait", value: theme.get("aspect-media-portrait"), usage: "Portrait media: profiles, covers." },
      ],
    },
  }
}

async function render(): Promise<string> {
  const json = JSON.stringify(buildTokens(readFileSync(CSS_PATH, "utf8")), null, 2) + "\n"
  const config = await prettier.resolveConfig(OUT_PATH)
  return prettier.format(json, { ...config, filepath: OUT_PATH })
}

async function main() {
  const check = process.argv.slice(2).includes("--check")
  const next = await render()
  const current = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : ""
  if (check) {
    if (current !== next) {
      console.error("design-system/tokens.json is out of date. Run `pnpm design-system:generate` and commit the result.")
      process.exit(1)
    }
    console.log("design-system/tokens.json is current.")
    return
  }
  if (current !== next) writeFileSync(OUT_PATH, next)
  console.log(current === next ? "design-system/tokens.json unchanged." : "Wrote design-system/tokens.json.")
}

if (process.argv[1]?.endsWith("generate-design-system.ts")) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
