#!/usr/bin/env node
/**
 * Project `app/globals.css` into the `nyuchi-tokens` registry item's `cssVars`.
 *
 *   pnpm tokens:registry          rewrite registry.json
 *   pnpm tokens:registry --check  fail if it is out of date (CI)
 *
 * WHY THIS EXISTS
 *
 * N1's covenant is that it is "the only node allowed to define CSS values" and that design
 * decisions are data, not code. The registry contradicted both: `nyuchi-tokens` shipped a
 * 50 KB TypeScript file containing ZERO CSS custom properties, and no registry item shipped
 * any CSS at all — not a `.css` file, not `css`, not `cssVars`.
 *
 * The consequence was not cosmetic. 431 of 573 components reference `var(--…)` — 137
 * distinct variables — and `app/globals.css` defines 214 of them. A consumer running
 * `npx shadcn add nyuchi-listing-card` received Tailwind classes like
 * `bg-[var(--color-malachite)]` and no definition for `--color-malachite`, so every mineral
 * colour, radius, motion duration and touch target resolved to its fallback or to nothing.
 * The tokens existed; they were simply never delivered.
 *
 * `cssVars` is shadcn's first-class answer (registry-item.json: theme / light / dark). The
 * CLI merges it into whatever stylesheet the consuming project uses, so it is genuinely
 * framework-agnostic — which a `.ts` file cannot be. The TypeScript constants are not lost:
 * they become `nyuchi-tokens-typescript`, the seventh platform variant alongside the arkts,
 * kotlin, python, react-native, rust and swift ones that already existed.
 *
 * GENERATED, NEVER HAND-EDITED. `globals.css` is itself generated in part (`tokens:sync`
 * writes the marked blocks from the DB palette), so hand-copying 214 values into
 * registry.json would create a third copy that drifts from both. This reads the CSS and is
 * gated in CI by `--check`.
 */

import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const CSS = join(ROOT, "app", "globals.css")
const REGISTRY = join(ROOT, "registry.json")

/** The item that carries the theme. */
const THEME_ITEM = "nyuchi-tokens"

/**
 * Extract the declarations of one top-level block.
 *
 * Brace-counted rather than regex-matched: `@theme inline` and `:root` both contain nested
 * braces in practice, and a lazy `\{([^}]*)\}` silently truncates at the first inner `}`.
 */
function block(css, header) {
  // Anchored to the start of a line, because a substring search finds the wrong thing:
  // `.dark` first occurs inside `@custom-variant dark (&:is(.dark *));` on line 5, and
  // matching there walks forward to the NEXT `{` — the `@theme inline` block — silently
  // harvesting the theme a second time and losing every dark value.
  const anchor = new RegExp(`^${header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`, "m")
  const found = anchor.exec(css)
  if (!found) return null
  const start = found.index
  const open = css.indexOf("{", start)
  if (open === -1) return null
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++
    else if (css[i] === "}") {
      depth--
      if (depth === 0) return css.slice(open + 1, i)
    }
  }
  return null
}

/**
 * Custom properties declared directly in a block, as shadcn wants them: keys WITHOUT the
 * leading `--` (see the `cssVars` example in registry-item.json).
 *
 * Comments are stripped first so a commented-out declaration is not harvested, and only
 * `--x: y;` pairs are taken, so nested rules inside `@theme` contribute nothing.
 */
function customProperties(body) {
  const out = {}
  if (!body) return out
  const clean = body.replace(/\/\*[\s\S]*?\*\//g, "")
  for (const m of clean.matchAll(/(^|[\s;{])--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g)) {
    out[m[2]] = m[3].trim().replace(/\s+/g, " ")
  }
  return out
}

/**
 * Key-sorted, because `scripts/normalize-registry.ts` sorts every object key in
 * registry.json. Emitting insertion order here would mean the normaliser rewrites what this
 * script just wrote, and `--check` would then fail on key ORDER while the values were
 * identical — a gate that fails for a reason nobody can act on.
 */
const sorted = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)))

function buildCssVars() {
  const css = readFileSync(CSS, "utf8")
  const theme = customProperties(block(css, "@theme inline"))
  const light = customProperties(block(css, ":root"))
  const dark = customProperties(block(css, ".dark"))
  const vars = {}
  if (Object.keys(theme).length) vars.theme = sorted(theme)
  if (Object.keys(light).length) vars.light = sorted(light)
  if (Object.keys(dark).length) vars.dark = sorted(dark)
  // The normaliser sorts nested keys too, so `theme/light/dark` come back as
  // `dark/light/theme`. Sort here as well or `--check` compares two orderings of the
  // same data and reports drift that does not exist.
  return sorted(vars)
}

function main() {
  const check = process.argv.includes("--check")
  const cssVars = buildCssVars()
  const counts = Object.fromEntries(
    Object.entries(cssVars).map(([k, v]) => [k, Object.keys(v).length])
  )

  if (Object.keys(cssVars).length === 0) {
    console.error(
      "✖ no custom properties found in app/globals.css — refusing to write an empty theme."
    )
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(REGISTRY, "utf8"))
  const item = manifest.items?.find((i) => i.name === THEME_ITEM)
  if (!item) {
    console.error(`✖ ${THEME_ITEM} is not in registry.json.`)
    process.exit(1)
  }

  const current = JSON.stringify(item.cssVars ?? null)
  const next = JSON.stringify(cssVars)

  if (check) {
    if (current !== next) {
      console.error(
        `✖ ${THEME_ITEM}.cssVars is out of date with app/globals.css.\n` +
          "  Run `pnpm tokens:registry` and commit the result."
      )
      process.exit(1)
    }
    console.log(`✓ ${THEME_ITEM}.cssVars matches app/globals.css (${JSON.stringify(counts)}).`)
    return
  }

  item.cssVars = cssVars
  writeFileSync(REGISTRY, JSON.stringify(manifest, null, 2) + "\n")
  console.log(`✓ ${THEME_ITEM}.cssVars generated from app/globals.css (${JSON.stringify(counts)}).`)
}

main()
