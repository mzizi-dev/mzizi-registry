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
// TypeScript's own parser, so the JSX check below is exact rather than a regex guess.
import ts from "typescript"

const ROOT = process.cwd()
const REGISTRY_JSON = join(ROOT, "registry.json")
const REGISTRY_DIR = join(ROOT, "components", "registry")

/** Files that are never component source. Mirrors `lib/registry-source.ts`. */
const NOT_SOURCE = new Set([".ds_store", ".map", ".snap", ".log"])

/** Only N1 may define raw colour values (CLAUDE.md §7.4). */
const TOKENS_NODE_DIR = "n1-tokens"

/**
 * Components whose hexes are DATA, not styling.
 *
 * A named list of two rather than a pattern, because a pattern that exempts
 * "anything that looks like a palette" would silently swallow the next real
 * violation — and the §8.2 touch-target check already taught this repo what an
 * unactionable gate costs.
 *
 * `color-picker` and `caption-editor` present colours for a user to CHOOSE. The
 * hex is the value the component returns, so it has to be a literal: a swatch
 * rendered as `var(--color-cobalt)` cannot report which colour was picked. They
 * do duplicate N1's palette, which is a real (smaller) problem — the fix is to
 * source the swatch list from N1 rather than retype it, and that needs an
 * import a self-contained registry component (§15.6) cannot currently make.
 */
const LITERAL_COLOUR_DATA = new Set(["color-picker", "caption-editor"])

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

/*
 * There is deliberately NO allow-list of "real upstream primitives" any more.
 *
 * There was one — `SHADCN_PRIMITIVES`, ~60 names — and the rule beside it said a bare
 * `registryDependencies` entry is "CORRECT for these and wrong for anything Mzizi-only".
 * That rule is why 567 edges across 41 names shipped bare, and all 41 of those names are
 * items in THIS registry.
 *
 * The premise was wrong. A bare name does not mean "take the upstream one where an upstream
 * one exists" — the CLI resolves every bare name against ui.shadcn.com, full stop. So
 * installing `nyuchi-listing-card` from production pulled shadcn's badge (1776 B), card
 * (1987 B) and avatar (2916 B) instead of ours (1909 / 4306 / 3429): a brand component
 * standing on stock primitives, with no mineral tokens and no pill buttons, and nothing
 * anywhere reported a problem.
 *
 * Mzizi HAS its own button, card, badge, input, avatar and so on. If the registry ships
 * them, they are what a consumer of the registry must get. So there is no such thing as a
 * name we are happy to hand to another registry, and no list to maintain.
 *
 * The addressable forms are an absolute URL (works everywhere, what the manifest uses now)
 * and `@mzizi/<name>` (pinnable, needs a `registries` mapping in the consumer's
 * components.json — which a registry:base cannot write, so the CLI and template app do it).
 */

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

    /**
     * A DATA item carries `cssVars` or `css` instead of a file, and that is not a
     * degenerate component — it is what a `registry:theme` IS.
     *
     * `nyuchi-tokens` is the case: N1's covenant is that it is the only node allowed to
     * define CSS values, and it discharges that by shipping the 214 custom properties
     * themselves, generated from `app/globals.css`. It has no source file on disk and
     * should not: a `.ts` file is React-only, and the whole point of moving the tokens
     * into `cssVars` is that the shadcn CLI merges them into ANY consuming project.
     *
     * The two checks below assume every item is a component with a file. Applied to a
     * theme they demand exactly the thing that made the registry framework-specific.
     */
    // A `registry:base`/`registry:style` is a data item whose payload is the project CONFIG,
    // not cssVars — `mzizi-base` deliberately has none, pulling N1 through
    // registryDependencies so the tokens are defined in exactly one place.
    const isConfigItem = item.type === "registry:base" || item.type === "registry:style"
    const isDataItem = Boolean(item.cssVars || item.css || isConfigItem)
    const hasFiles = Array.isArray(item.files) && item.files.length > 0

    // A base that carries no config writes a DEFAULT components.json — the project ends up
    // shaped for stock shadcn, not for this registry, and nothing errors.
    if (isConfigItem && !item.style && !item.iconLibrary && !item.baseColor && !item.tailwind) {
      err(
        item.name,
        `is a ${item.type} but carries no configuration (style / iconLibrary / baseColor / ` +
          "tailwind). These belong at the TOP LEVEL of the item — the `config: {…}` shape in " +
          "shadcn's docs example is not read by the CLI (verified against 4.16.2)."
      )
    }

    if (!hasFiles && !isDataItem) err(n, "has no files[] and no cssVars/css — it installs nothing")

    // — a data item must declare its node, because nothing else can —
    //
    // Every filed component gets its node from the directory it lives in. A data item has no
    // directory, so an undeclared node is simply absent, and absent is not neutral: it drops
    // the item out of `/api/v1/ui?node=N` and out of `mzizi_list_components({ node: N })`.
    // That is exactly what happened — listing N1 returned the 17 libraries and omitted
    // `nyuchi-tokens`, the item those libraries and 431 components depend on.
    if (isDataItem && !hasFiles) {
      if (typeof item.meta?.node !== "number" || item.meta.node < 1) {
        err(
          n,
          "is a data item with no file, so its node cannot be derived from a directory — " +
            "declare `meta.node` (a positive integer) or it vanishes from every node-filtered list."
        )
      }
      if (typeof item.meta?.nodeLabel !== "string" || !item.meta.nodeLabel) {
        err(n, "is a data item with no file — declare `meta.nodeLabel` alongside `meta.node`.")
      }
    }
    if (isDataItem && hasFiles) {
      err(
        n,
        "carries both cssVars/css and files[]. Keep the token DATA and the typed accessor " +
          "as separate items (nyuchi-tokens vs nyuchi-tokens-typescript) so a non-React " +
          "consumer can take the tokens without the TypeScript."
      )
    }

    // — a component is ONE source file, so it may declare exactly one —
    //
    // `readComponentSource(name)` resolves a component by NAME, not by install path, so
    // there has only ever been one file's worth of content to serve. Five items declared
    // more (nyuchi-tokens declared four), and `/api/v1/ui/{name}` filled the extras with
    // an empty string: `npx shadcn add nyuchi-tokens` wrote three EMPTY files over the
    // consumer's own. Nothing caught it, because every item resolved on disk — the check
    // above passes on the component, and the defect was in the file list beside it.
    if (Array.isArray(item.files) && item.files.length > 1) {
      err(
        n,
        `declares ${item.files.length} files (${item.files.map((f) => f.path).join(", ")}) but a ` +
          "component has exactly one source. The extra paths have no content and install as " +
          "empty files — declare only the file that exists."
      )
    }

    // — `path` is the SOURCE, `target` is the DESTINATION —
    //
    // shadcn's schema is explicit about which is which, and this registry had them merged:
    // every item declared the install destination as `path` and no `target` at all. Our own
    // API hid it, because `/api/v1/ui/{name}` resolves the source by component NAME and
    // inlines the content — `path` was never read as a source, so a wrong one cost nothing
    // locally. It cost the GitHub-registry channel entirely: `shadcn registry validate
    // nyuchi/mzizi` failed on all 574 items, because that path is resolved against the repo.
    for (const file of item.files ?? []) {
      const p = file.path ?? ""
      if (!p.startsWith("components/registry/")) {
        err(
          n,
          `file path "${p}" is not a source path. \`path\` must point at the file as it ` +
            "exists in THIS repo (components/registry/n<N>-<label>/…); the install " +
            "destination belongs in `target`."
        )
      }
      if (!file.target) {
        err(n, `file "${p}" has no \`target\` — nothing says where it installs.`)
      }
    }

    // — a source containing JSX must install to a .tsx path —
    //
    // `nyuchi-resilience` shipped 18 KB of JSX into `lib/resilience/health-monitor.ts`;
    // `nyuchi-data`, `nyuchi-platform`, `nyuchi-layout` and `nyuchi-locale` each declared a
    // JSX source as `index.ts`. TypeScript reads `<Foo>` in a .ts file as a type assertion,
    // so these fail with a wall of syntax errors in the CONSUMER's build, with nothing
    // pointing back here.
    //
    // The rule is about JSX, NOT about extensions matching. A first cut compared source and
    // install extensions and flagged `ai-safety` — a .tsx file that contains no JSX and
    // compiles fine as .ts. Renaming it would have been churn dressed as a fix, and worse,
    // would have left anyone who already installed `lib/ai-safety.ts` with a second copy.
    //
    // TypeScript's own parser decides, because no regex can: `<T>`, `React.useState<X>` and
    // `<b>bold</b>` inside a doc comment all look like JSX to a pattern and are not.
    {
      const src = disk.get(n)
      // The INSTALL path is `target`. It used to be `path`, and reading `path` here now
      // would compare the source's extension against itself and never fire — the gate would
      // still print green while checking nothing.
      const declaredPath = item.files?.[0]?.target
      // `rel` is relative to components/registry (e.g. `n1-tokens/nyuchi-tokens.ts`), and a
      // component's primary source is not always TypeScript — some are .md or .rs.
      const isTs = src && /\.tsx?$/.test(src.rel ?? "")
      if (src && isTs && declaredPath && !declaredPath.endsWith(".tsx")) {
        const abs = join(ROOT, "components", "registry", src.rel)
        const text = readFileSync(abs, "utf8")
        const parsed = ts.createSourceFile(
          abs,
          text,
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TS
        )
        const syntaxErrors = parsed.parseDiagnostics?.length ?? 0
        if (syntaxErrors > 0) {
          err(
            n,
            `source contains JSX but installs to ${declaredPath}. Parsed as TypeScript it ` +
              `produces ${syntaxErrors} syntax error(s) — it must install to a .tsx path.`
          )
        }
      }
    }

    // — every advertised component must exist on disk (bug 2 and 3) —
    // A data item's payload IS its cssVars/css, so "no source file" is correct for it.
    const onDisk = disk.get(n)
    if (!onDisk && !isDataItem) {
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
      // A bare name resolves against ui.shadcn.com — ALWAYS, including when this registry
      // has an item by that name. That used to be treated as correct for the ~60 "real
      // upstream primitives", and it is the rule that produced the defect below.
      //
      // 567 edges across 41 names were bare, and all 41 are items here. Measured against
      // production: installing `nyuchi-listing-card` pulled shadcn's badge (1776 B), card
      // (1987 B) and avatar (2916 B) instead of ours (1909 / 4306 / 3429). The brand
      // component landed on stock primitives — no mineral tokens, no pill buttons — and
      // nothing errored, because a well-formed component from the wrong registry looks
      // exactly like a well-formed component.
      //
      // So a bare name for one of OUR items is an error, not a warning: a warning is what
      // this check emitted before, and 567 edges shipped anyway.
      if (names.has(dep)) {
        err(
          n,
          `registryDependencies "${dep}" is a bare name and "${dep}" is an item in THIS ` +
            `registry — the CLI resolves bare names against ui.shadcn.com, so a consumer ` +
            `gets shadcn's ${dep}, not ours. Use https://mzizi.dev/api/v1/ui/${dep} (or ` +
            `"@mzizi/${dep}" once consumers carry the registries mapping).`
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
      if (onDisk.dir !== TOKENS_NODE_DIR && !LITERAL_COLOUR_DATA.has(n)) {
        // Third-party brand marks are stripped before the scan: a `fill="#4285F4"`
        // in Google's "G" is that company's identity, not a Mzizi design
        // decision, and §7.4 already exempts SVG where Tailwind cannot reach.
        const scannable = src.replace(/\b(?:fill|stroke|stop-color)=["']#[0-9a-fA-F]{6}["']/g, "")
        const hexes = scannable.match(/#[0-9a-fA-F]{6}\b/g) ?? []
        // A hex inside a `var(--token, #fallback)` is the documented fallback
        // form, so only flag hexes that are NOT preceded by a comma in a var().
        const bare = hexes.filter((h) => !new RegExp(`var\\([^)]*,\\s*${h}`).test(scannable))
        if (bare.length > 0) {
          warn(
            n,
            `contains ${bare.length} raw hex colour(s) outside N1 (${[...new Set(bare)].slice(0, 3).join(", ")}). ` +
              `§7.4: consume CSS custom properties instead`
          )
        }
      }

      // A Tailwind candidate is whitespace-delimited, so an arbitrary value
      // containing a space is split TWICE: the extractor generates no rule, and
      // the browser's class-token parser matches no element even where an
      // identical space-free class elsewhere happened to emit one. The result is
      // an element with no background, colour or border at all — silent, absent
      // from every gate, and visible only in a consumer's app. 111 of these
      // shipped across 39 components before anyone measured it.
      //
      // This is an error, not a warning: the failure mode is invisible, so a
      // warning would be read past exactly like the original was.
      for (const line of src.split("\n")) {
        for (const tok of line.split(/\s+/)) {
          const opened = (tok.match(/\[/g) ?? []).length
          const closed = (tok.match(/\]/g) ?? []).length
          if (opened > closed && /[-a-zA-Z0-9_@:./!]*[a-z0-9]-\[/.test(tok)) {
            err(
              n,
              `spaced Tailwind arbitrary value generates no CSS: ${tok.slice(0, 60)}… ` +
                `— remove the whitespace inside [...] (or use _)`
            )
          }
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
