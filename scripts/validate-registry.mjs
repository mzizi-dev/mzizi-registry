#!/usr/bin/env node
/**
 * Validate every registry item against the contract a CONSUMER depends on.
 *
 *   pnpm registry:validate
 *
 * This is the gate that was impossible while component source lived in a
 * Supabase JSON column: nothing could open a component, so nothing could check
 * one. Now that all 571 are files on disk, CI can.
 *
 * It exists because three separate bugs shipped this week while every existing
 * gate stayed green — typecheck, lint, tests, build, the registry snapshot, and
 * the API returning HTTP 200 the entire time:
 *
 *   1. 145 `registryDependencies` were written `@mzizi/<name>`. The shadcn CLI
 *      resolves a dependency as either a bare name (against ui.shadcn.com) or an
 *      absolute URL. `@mzizi/x` is neither, so `npx shadcn add` 404'd for 105
 *      components. Nothing noticed, because the payload itself was well-formed.
 *   2. The source reader took an allow-list of four extensions, so five
 *      multi-language components (`.md`, `.kt`, `.swift`, `.py`, `.ets`)
 *      resolved to nothing on disk and were quietly served from the database
 *      fallback instead — invisible until that fallback was removed.
 *   3. A view predicate hid 249 stable components from `/api/v1/ui/{name}` for
 *      weeks while they stayed visible over MCP.
 *
 * The common shape: a component can be BROKEN FOR A CONSUMER while every
 * signal we had said fine. So this validator asks only consumer-facing
 * questions, and asks them offline.
 *
 * OFFLINE AND CREDENTIAL-FREE, deliberately. It reads `registry.json` and the
 * files on disk — no database, no network. A missing secret must never be the
 * reason a broken component ships, and a gate that skips when unconfigured is a
 * gate that trains people to ignore it.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs"
import { basename, extname, join } from "node:path"

const ROOT = process.cwd()
const REGISTRY_JSON = join(ROOT, "registry.json")
const REGISTRY_DIR = join(ROOT, "components", "registry")

/** Files that are never component source. Mirrors `lib/registry-source.ts`. */
const NOT_SOURCE = new Set([".ds_store", ".map", ".snap", ".log"])

/** Only N1 may define raw colour values (CLAUDE.md §7.4). */
const TOKENS_NODE_DIR = "n1-tokens"

/*
 * There is deliberately NO touch-target check here any more.
 *
 * There was one: `/\b(?:h|size)-(?:8|9|10|11)\b/` — everything under 48px —
 * written when §8.2 declared a 56px default and a 48px "non-negotiable"
 * minimum. §8.2 has since recorded that the shipped primitives never did that,
 * that the doctrine described a system which did not exist, and that density
 * won: the scale is `h-8` small, `h-9` default, `h-10` large. So the check
 * flagged the exact sizes doctrine now mandates, on 125 components — and a gate
 * that calls correct code wrong is why nobody read this output, with 85
 * genuinely broken install paths sitting in the same list.
 *
 * Narrowing it to "below `h-8`" was tried and is worse: 146 warnings, because
 * the pattern greps the whole FILE for a size class and for `onClick`, so
 * `<ArrowLeft className="size-4" />` inside a button counts as an undersized
 * control. A file-level regex cannot tell an icon from the control containing
 * it.
 *
 * And the rule §8.2 actually states is not about the number at all: a dense
 * control on a touch surface must "earn its hit area some other way —
 * surrounding spacing, or padding the interactive area beyond the visual box."
 * That is a question about rendered layout. Answering it needs a rendered tree,
 * which belongs in the a11y audit, not in an offline manifest validator.
 *
 * Leaving it out is the honest state. Re-adding a regex version would restore
 * the noise that hid the real findings.
 */

/**
 * Components that genuinely exist upstream at ui.shadcn.com.
 *
 * A bare `registryDependencies` entry is resolved by the CLI against the default
 * registry, so a bare name is CORRECT for these and wrong for anything
 * Mzizi-only. Without this distinction the check fires on `button` and `card`
 * — 657 warnings, none of them actionable — and a gate nobody can act on is a
 * gate everybody ignores.
 */
const SHADCN_PRIMITIVES = new Set([
  "accordion",
  "alert",
  "alert-dialog",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "calendar",
  "card",
  "carousel",
  "chart",
  "checkbox",
  "collapsible",
  "combobox",
  "command",
  "context-menu",
  "data-table",
  "date-picker",
  "dialog",
  "drawer",
  "dropdown-menu",
  "empty",
  "field",
  "form",
  "hover-card",
  "input",
  "input-group",
  "input-otp",
  "item",
  "kbd",
  "label",
  "menubar",
  "navigation-menu",
  "pagination",
  "popover",
  "progress",
  "radio-group",
  "resizable",
  "scroll-area",
  "select",
  "separator",
  "sheet",
  "sidebar",
  "skeleton",
  "slider",
  "sonner",
  "spinner",
  "switch",
  "table",
  "tabs",
  "textarea",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
  "typography",
  "utils",
  "use-mobile",
])

const errors = []
const warnings = []
const err = (item, msg) => errors.push(`${item}: ${msg}`)
const warn = (item, msg) => warnings.push(`${item}: ${msg}`)

// ─── Index what is actually on disk ─────────────────────────────────────────

/** Extensions that serve the React/shadcn surface, in preference order. */
const PRIMARY_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]
const primaryRank = (ext) => {
  const i = PRIMARY_EXTENSIONS.indexOf(ext.toLowerCase())
  return i === -1 ? PRIMARY_EXTENSIONS.length : i
}

/**
 * Index the registry by component name.
 *
 * A name may map to SEVERAL files — `button.tsx` and `button.rs` are one component with two
 * target implementations (CLAUDE.md §8.9), and the entry records every one. Only the primary
 * (TypeScript) file is doctrine-checked below: the §7.4 hex rule and the §8.2 touch-target
 * rule are written in Tailwind terms and the Rust sibling carries the identical class
 * strings, so running them twice would double every finding without catching anything new.
 * The Rust side is gated by `cargo check`, `clippy -D warnings` and the contract tests in
 * `mzizi-rs/crates/mzizi-ui/tests/contract.rs`, which compare it back to the TypeScript.
 *
 * Two files with one name in DIFFERENT node directories is still an error — the component's
 * node would be ambiguous, and a node decides what may import what.
 */
function indexDisk() {
  const byName = new Map()
  if (!existsSync(REGISTRY_DIR)) {
    console.error(`✗ ${REGISTRY_DIR} does not exist`)
    process.exit(1)
  }
  for (const dir of readdirSync(REGISTRY_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const entry of readdirSync(join(REGISTRY_DIR, dir.name))) {
      if (entry.startsWith(".")) continue
      const ext = extname(entry)
      if (NOT_SOURCE.has(ext.toLowerCase())) continue
      const name = basename(entry, ext)
      const rel = `${dir.name}/${entry}`
      const existing = byName.get(name)

      if (!existing) {
        byName.set(name, { rel, dir: dir.name, ext, targets: [rel] })
        continue
      }
      if (existing.dir !== dir.name) {
        err(
          name,
          `resolves to files under two different nodes: ${existing.rel} and ${rel}. ` +
            `A component belongs to exactly one node.`
        )
        continue
      }
      if (existing.targets.includes(rel)) continue
      existing.targets.push(rel)
      // The primary is what `/api/v1/ui/{name}` serves, so it must be deterministic rather
      // than whichever file the directory listed first.
      if (primaryRank(ext) < primaryRank(existing.ext)) {
        existing.rel = rel
        existing.ext = ext
      }
    }
  }
  return byName
}

// ─── Checks ─────────────────────────────────────────────────────────────────

function main() {
  if (!existsSync(REGISTRY_JSON)) {
    console.error("✗ registry.json is missing. It is authored — restore it from git.")
    process.exit(1)
  }

  const registry = JSON.parse(readFileSync(REGISTRY_JSON, "utf8"))
  const items = registry.items ?? []
  if (items.length === 0) {
    console.error("✗ registry.json has no items")
    process.exit(1)
  }

  const disk = indexDisk()
  const names = new Set(items.map((i) => i.name))

  for (const item of items) {
    const n = item.name ?? "(unnamed)"

    // — shape the shadcn CLI requires —
    if (!item.name) err("(item)", "has no name")
    if (!item.type) err(n, "has no type (registry:ui | registry:lib | …)")
    if (!Array.isArray(item.files) || item.files.length === 0) err(n, "has no files[]")

    // — every advertised component must exist on disk (bug 2 and 3) —
    const onDisk = disk.get(n)
    if (!onDisk) {
      err(
        n,
        "is advertised in registry.json but has NO source file under components/registry/. " +
          "A consumer installing it gets nothing."
      )
    }

    // — dependencies must be resolvable (bug 1) —
    for (const dep of item.registryDependencies ?? []) {
      if (typeof dep !== "string" || dep.length === 0) {
        err(n, `has an empty registryDependencies entry`)
        continue
      }
      if (dep.startsWith("@")) {
        err(
          n,
          `registryDependencies "${dep}" is scope-prefixed. The shadcn CLI resolves a ` +
            `dependency as a bare name or an absolute URL — never a package scope — so ` +
            `this makes the component uninstallable. Use ` +
            `https://mzizi.dev/api/v1/ui/${dep.replace(/^@[^/]+\//, "")}`
        )
        continue
      }
      if (/^https?:\/\//.test(dep)) {
        const m = dep.match(/\/api\/v1\/ui\/([^/?#]+)$/)
        if (m && !names.has(m[1])) {
          err(n, `registryDependencies "${dep}" points at "${m[1]}", which is not in the registry`)
        }
        continue
      }
      // A bare name resolves against ui.shadcn.com. That is correct for a real
      // upstream primitive and broken for anything Mzizi-only, which will 404.
      if (SHADCN_PRIMITIVES.has(dep)) continue
      if (names.has(dep)) {
        warn(
          n,
          `registryDependencies "${dep}" is a bare name, but "${dep}" is Mzizi-only — it does ` +
            `not exist at ui.shadcn.com, which is where the CLI will look. ` +
            `Use https://mzizi.dev/api/v1/ui/${dep}`
        )
      } else {
        err(
          n,
          `registryDependencies "${dep}" resolves nowhere — not a known shadcn primitive and ` +
            `not in this registry`
        )
      }
    }

    // — declared npm dependencies should be installable here (§14 upgrade-first) —
    for (const dep of item.dependencies ?? []) {
      const bare = dep.replace(/^(@[^/]+\/[^@]+|[^@][^@]*)@.*$/, "$1")
      if (!PKG_DEPS.has(bare)) {
        warn(
          n,
          `declares npm dependency "${dep}" which this repo does not install, so nothing ` +
            `here ever compiles against it`
        )
      }
    }

    // — doctrine, checkable only now that the file is readable —
    if (onDisk) {
      const src = readFileSync(join(REGISTRY_DIR, onDisk.rel), "utf8")

      // §7.4 — only N1 defines raw colour values.
      if (onDisk.dir !== TOKENS_NODE_DIR) {
        const hexes = src.match(/#[0-9a-fA-F]{6}\b/g) ?? []
        // A hex inside a `var(--token, #fallback)` is the documented fallback
        // form, so only flag hexes that are NOT preceded by a comma in a var().
        const bare = hexes.filter((h) => !new RegExp(`var\\([^)]*,\\s*${h}`).test(src))
        if (bare.length > 0) {
          warn(
            n,
            `contains ${bare.length} raw hex colour(s) outside N1 (${[...new Set(bare)].slice(0, 3).join(", ")}). ` +
              `§7.4: consume CSS custom properties instead`
          )
        }
      }

      // §8.2 touch targets are not checked here — see the note by NOT_SOURCE.
    }
  }

  // — anything on disk that the registry does not advertise —
  for (const [name, meta] of disk) {
    if (!names.has(name)) {
      warn(
        name,
        `exists on disk (${meta.rel}) but is not in registry.json, so no consumer can install it`
      )
    }
  }

  // ─── Report ───────────────────────────────────────────────────────────────

  console.log(`Checked ${items.length} registry items against ${disk.size} files on disk.\n`)

  if (warnings.length > 0) {
    console.log(`⚠ ${warnings.length} warning(s):`)
    for (const w of warnings) console.log(`  ${w}`)
    console.log("")
  }

  if (errors.length > 0) {
    console.error(`✗ ${errors.length} error(s) — these break installs:`)
    for (const e of errors) console.error(`  ${e}`)
    process.exit(1)
  }

  console.log(`✓ every registry item resolves on disk and every dependency is addressable`)
}

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
const PKG_DEPS = new Set([
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.devDependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  // Always available to a consumer of a React registry.
  "react",
  "react-dom",
])

main()
