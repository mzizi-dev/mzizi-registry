#!/usr/bin/env -S tsx
/**
 * Hardcoded-palette-colour lint.
 *
 * The seven minerals and seven heritage tones are the brand palette and must be
 * referenced as tokens — the Tailwind utility (`bg-sodalite`, `text-copper`,
 * `bg-cobalt-container`) or the CSS var (`var(--color-sodalite)`) — never pasted
 * in as a raw hex. This lint fails when a raw hex that EQUALS a known palette
 * value appears outside the canonical token files.
 *
 * The vocabulary is DB-driven: it is read from lib/tokens/palette.generated.ts
 * (itself generated from the DB by sync-tokens.ts), so adding a colour to the
 * store needs no change here. Non-palette hexes (status greens/ambers, chart
 * fallbacks, SVG gradients) are intentionally NOT flagged — this guards the
 * brand palette specifically, not every colour literal.
 *
 *   pnpm lint:colors
 */

import { readdir, readFile } from "fs/promises"
import { join, relative } from "path"
import { minerals, heritageColors } from "../lib/tokens/palette.generated"

const ROOT = process.cwd()
const SCAN_DIRS = ["app", "components", "lib", "hooks"]

/**
 * Paths whose raw palette hexes are correct, each with the reason it is correct.
 *
 * An entry here is a claim that the hex CANNOT be a token reference at this
 * path — not that the violation is inconvenient. Widening this list to quieten
 * a component that could reference a token turns the gate off silently, so the
 * reason is part of the data and has to survive review alongside the path.
 */
const ALLOW: { prefix: string; why: string }[] = [
  {
    prefix: "lib/tokens/",
    why: "The generated palette itself — the vocabulary this lint is checked against.",
  },
  {
    prefix: "app/globals.css",
    why: "The canonical `:root` / `.dark` declarations. N1's web emitter output.",
  },
  {
    prefix: "packages/design-cli/templates/",
    why: "Scaffolding emitted into a consumer's repo, where our tokens do not exist yet.",
  },
  { prefix: "scripts/", why: "Generators and this lint, which must name hexes to check them." },
  {
    prefix: "components/registry/n1-tokens/",
    why:
      "N1 is the only layer allowed to DEFINE a design value — docs/pulling-in-primitives.md §3, " +
      "invariant 1 " +
      '("If you find yourself typing a hex, stop." — everything else consumes), and ' +
      "content/doctrine/documentation-architecture-nodes/design-tokens.mdx, whose `role` is " +
      '"N1 — the only node allowed to define CSS values". This is the same reason `lib/tokens/` ' +
      "is above; the boundary is the LAYER, not the file, so the directory is listed rather " +
      "than the three files that happen to trip today. Most of it is generated anyway: " +
      "scripts/sync-tokens.ts writes nyuchi-tokens-{react-native,swift,kotlin,arkts,python,rust} " +
      "from the Supabase store and `pnpm tokens:verify` is their drift gate — so the hexes here " +
      "are already checked, by a stricter check than this one.",
  },
  {
    prefix: "app/manifest.ts",
    why:
      "A web app manifest is JSON served to the browser. It cannot resolve a CSS custom " +
      "property, so `theme_color` / `background_color` have nowhere to reference a token " +
      "from — the same reason `next/og` routes are exempt (§7.4). The file already says so " +
      "in its docblock; this is the lint agreeing with it.",
  },
  /**
   * `color-picker` and `caption-editor` present colours for a user to CHOOSE.
   *
   * This is not a new exemption — it is this lint catching up with a decision
   * the repo already made and wrote down. `scripts/validate-registry.mjs`
   * enforces the same §7.4 rule over registry component source and exempts
   * exactly these two by name (`LITERAL_COLOUR_DATA`), because "the hex is the
   * value the component returns, so it has to be a literal: a swatch rendered
   * as `var(--color-cobalt)` cannot report which colour was picked."
   *
   * `color-picker` proves it mechanically: the value round-trips through a
   * `maxLength={7}` text input and is validated with /^#[0-9A-Fa-f]{6}$/, which
   * `var(--color-cobalt)` fails. `caption-editor` hands the same string back
   * through `onColorChange` for the consumer to store.
   *
   * Two gates enforcing one rule and disagreeing about which files break it is
   * itself a blind spot: `pnpm check` failed on files `pnpm registry:validate`
   * had already cleared, and the two lists had no way to notice each other.
   * These are listed per file, not as an `n2-primitives/` directory, because
   * the exemption belongs to those two components and to nothing else in that
   * layer. The residual — both files RETYPE N1's palette
   * instead of sourcing it, and `color-picker`'s "Terracotta" swatch (#D4A574)
   * is not the terracotta token (#A0522D / #E1B07E) — is recorded in
   * `validate-registry.mjs` and needs the §15.6 self-containment rule relaxed
   * before it can be fixed. Neither gate can see that drift; a hex that is not
   * a palette value is invisible to this one by design.
   */
  {
    prefix: "components/registry/n2-primitives/color-picker.tsx",
    why: "Colour DATA, not styling — see the block comment above.",
  },
  {
    prefix: "components/registry/n2-primitives/caption-editor.tsx",
    why: "Colour DATA, not styling — see the block comment above.",
  },
]

/**
 * Generated artifacts are skipped entirely.
 *
 * This rule exists to stop a hex being hardcoded in code that should reference
 * a token. A generated file is not code anybody writes — its content is
 * governed by its source, and pointing at the projection tells the wrong
 * person to edit a file whose first line says "do not edit".
 *
 * It is not hypothetical. Inlining the skills bundle put
 * `lib/skills.generated.ts` in `lib/`, and one skill body TEACHES the canonical
 * token block:
 *
 *     --color-terracotta: #a0522d; \/* Community *\/
 *
 * That is the same content as `app/globals.css`, which is on the allow-list
 * above, arriving by a different route — so the linter reported nine
 * violations for documentation doing exactly what the rule wants. `pnpm
 * lint:colors` has been red on `main` ever since, and nothing noticed because
 * it runs only via `pnpm check`, never in CI.
 *
 * The gate is not weakened. A hex hardcoded in a generated file means a hex
 * hardcoded in its SOURCE, and that is where it has to be caught — for skills,
 * in `nyuchi/mzizi-tools`, where the SKILL.md is authored.
 */
const GENERATED = /\.generated\.(ts|tsx|json)$/

// hex (lowercase) -> token name, for a helpful message.
const paletteHex = new Map<string, string>()
for (const m of minerals) {
  for (const hex of [
    m.darkHex,
    m.lightHex,
    m.containerDark,
    m.containerLight,
    m.onContainerDark,
    m.onContainerLight,
  ]) {
    paletteHex.set(hex.toLowerCase(), m.name)
  }
}
for (const h of heritageColors) {
  paletteHex.set(h.darkHex.toLowerCase(), h.name)
  paletteHex.set(h.lightHex.toLowerCase(), h.name)
}

const HEX = /#[0-9a-fA-F]{6}\b/g

/**
 * Is the position at the end of `before` inside an unclosed `var(`?
 *
 * This walks the parentheses with a stack instead of counting them, because
 * counting got it wrong. The previous form subtracted every `)` on the line
 * from the number of `var(`s, so ANY earlier parenthesis — one that had
 * nothing to do with a var() — cancelled the var out and the fallback hex was
 * reported as a hardcoded colour:
 *
 *     rainfall: { label: "Rainfall (mm)", color: "var(--color-tanzanite, #B388FF)" }
 *                                ^^^^ this `)` closed the `var(`
 *
 * That is textbook-correct token usage — a var() reference with a fallback,
 * exactly what the rule asks for — and it was two of the violations standing
 * between `pnpm lint:colors` and green. A stack keeps unrelated parens
 * balanced against their own openers and nests properly, so
 * `var(--a, var(--b, #hex))` is inside a var() at both depths.
 */
function insideVar(before: string): boolean {
  const stack: boolean[] = []
  for (let i = 0; i < before.length; i++) {
    if (before[i] === "(") stack.push(before.slice(Math.max(0, i - 3), i) === "var")
    else if (before[i] === ")") stack.pop()
  }
  return stack.includes(true)
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue
      yield* walk(full)
    } else if (/\.(ts|tsx)$/.test(e.name) && !GENERATED.test(e.name)) {
      yield full
    }
  }
}

async function main() {
  const violations: string[] = []
  for (const base of SCAN_DIRS) {
    for await (const file of walk(join(ROOT, base))) {
      const rel = relative(ROOT, file)
      if (ALLOW.some((a) => rel.startsWith(a.prefix))) continue
      // Blank out block + line comments so documented hexes aren't flagged,
      // preserving newlines so reported line numbers stay accurate.
      const text = (await readFile(file, "utf8")).replace(/\/\*[\s\S]*?\*\//g, (m) =>
        m.replace(/[^\n]/g, " ")
      )
      const seen = new Set<string>()
      text.split("\n").forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, "")
        for (const match of code.matchAll(HEX)) {
          const hex = match[0].toLowerCase()
          const token = paletteHex.get(hex)
          // A hex used as a `var(--color-x, #fallback)` fallback is correct
          // token usage — skip it.
          if (token && !insideVar(code.slice(0, match.index ?? 0))) {
            const k = `${rel}:${i + 1}:${hex}`
            if (!seen.has(k)) {
              seen.add(k)
              violations.push(
                `  ${rel}:${i + 1}  ${match[0]} is the "${token}" token — use var(--color-${token}) or the bg-${token}/text-${token} utility`
              )
            }
          }
        }
      })
    }
  }

  if (violations.length) {
    console.error(`✗ hardcoded palette colours found (${violations.length}):`)
    console.error(violations.join("\n"))
    console.error(
      `\nThe palette is brand identity — reference the token, never the raw hex. (vocabulary: ${paletteHex.size} hexes across ${minerals.length} minerals + ${heritageColors.length} heritage tones)`
    )
    process.exit(1)
  }
  console.log(
    `✓ no hardcoded palette colours (checked against ${paletteHex.size} palette hexes from the DB snapshot)`
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
