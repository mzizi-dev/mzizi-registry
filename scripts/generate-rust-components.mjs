#!/usr/bin/env node
/**
 * Copy every Rust registry component into the crate that compiles it.
 *
 * WHY A COPY EXISTS AT ALL.
 *
 * `components/registry/n<N>-<label>/<name>.rs` stays canonical — it is the file a
 * human edits, sitting beside its `.tsx`/`.ts` sibling, one component in one place
 * (§8.3). The crates used to reach it directly:
 *
 *   #[path = "../../../../components/registry/n2-primitives/button.rs"]
 *
 * which compiles fine and cannot be PUBLISHED. `cargo package` only collects files
 * under the package root, so the tarball shipped a `src/lib.rs` pointing four levels
 * above itself at nothing, and the verify build failed on every one of the seven
 * crates. Every alternative — moving the sources into the crates, `include!` with an
 * absolute path, a build script — either overturns "one component, one name, one
 * place" or fails the same way inside the tarball.
 *
 * So each crate gets a GENERATED copy at `src/generated/<name>.rs`, committed (a
 * gitignored file is excluded from the tarball, and `cargo publish` must work from a
 * clean checkout with no pre-step) and byte-identical to its source apart from a
 * header naming where the original lives. That is the same move `mzizi-tokens`
 * already makes: the Rust token module is not a re-authoring of the palette, it is
 * one more emitter.
 *
 * A NOTE ON `cargo fmt`.
 *
 * rustfmt now reaches the copies rather than the sources, so an unformatted source
 * surfaces as a `cargo fmt --check` failure naming `src/generated/…`. Fix the source
 * and regenerate — never the copy, which this script overwrites.
 *
 * Usage:
 *   node scripts/generate-rust-components.mjs           write the copies
 *   node scripts/generate-rust-components.mjs --check   fail if any has drifted
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const REGISTRY = join(ROOT, "components", "registry")
const CRATES = join(ROOT, "mzizi-rs", "crates")

/**
 * Node directory → the crate whose `src/generated/` receives its `.rs` files.
 *
 * Explicit rather than inferred: a new node with Rust in it should fail this script
 * loudly and make someone decide which crate compiles it, not land silently in a
 * directory nothing includes.
 */
const CRATE_FOR_NODE = {
  "n1-tokens": "mzizi-tokens",
  "n2-primitives": "mzizi-ui",
  "n7-shell": "mzizi-shell",
  "n8-assurance": "mzizi-assurance",
  "n9-fundi": "mzizi-fundi",
  "n10-documentation": "mzizi-docs",
  "n11-discovery": "mzizi-discovery",
}

/** The header prepended to every copy. `source` is repo-relative, forward-slashed. */
function header(source) {
  return `// GENERATED — DO NOT EDIT.
//
// Copied verbatim from ${source} by scripts/generate-rust-components.mjs.
// That file is the one a human edits; this is the copy \`cargo package\` can ship,
// because a tarball only carries files under the crate root.
//
// Regenerate with \`pnpm rust:generate\`. CI runs \`pnpm rust:generate:check\`,
// which fails if this copy and its source have drifted.

`
}

/** Every `<node>/<file>.rs` under the registry, sorted, with its target crate. */
function discover() {
  const found = []
  for (const node of readdirSync(REGISTRY, { withFileTypes: true })) {
    if (!node.isDirectory()) continue
    const files = readdirSync(join(REGISTRY, node.name)).filter((f) => f.endsWith(".rs"))
    if (files.length === 0) continue
    const crate = CRATE_FOR_NODE[node.name]
    if (!crate) {
      throw new Error(
        `components/registry/${node.name}/ contains Rust (${files.sort().join(", ")}) but no ` +
          `crate claims it. Add an entry to CRATE_FOR_NODE in scripts/generate-rust-components.mjs ` +
          `and a \`mod\` line in that crate's src/lib.rs.`
      )
    }
    for (const file of files.sort()) {
      found.push({
        crate,
        file,
        source: `components/registry/${node.name}/${file}`,
        from: join(REGISTRY, node.name, file),
        to: join(CRATES, crate, "src", "generated", file),
      })
    }
  }
  return found.sort((a, b) => a.source.localeCompare(b.source))
}

const items = discover()
const check = process.argv.includes("--check")

/** Copies that exist on disk but no longer have a source — stale, and must go. */
const stale = []
for (const crate of new Set(Object.values(CRATE_FOR_NODE))) {
  const dir = join(CRATES, crate, "src", "generated")
  let existing = []
  try {
    existing = readdirSync(dir)
  } catch {
    continue
  }
  const wanted = new Set(items.filter((i) => i.crate === crate).map((i) => i.file))
  for (const file of existing) {
    if (!wanted.has(file)) stale.push(join(dir, file))
  }
}

const problems = []

for (const item of items) {
  const expected = header(item.source) + readFileSync(item.from, "utf8")
  if (check) {
    let current = null
    try {
      current = readFileSync(item.to, "utf8")
    } catch {
      problems.push(`missing: ${relative(ROOT, item.to)} (source ${item.source})`)
      continue
    }
    if (current !== expected) {
      problems.push(`out of date: ${relative(ROOT, item.to)} has drifted from ${item.source}`)
    }
  } else {
    mkdirSync(dirname(item.to), { recursive: true })
    writeFileSync(item.to, expected)
  }
}

for (const path of stale) {
  if (check) {
    problems.push(`orphaned: ${relative(ROOT, path)} has no source under components/registry/`)
  } else {
    rmSync(path)
  }
}

if (check) {
  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem}`)
    console.error("\nRun `pnpm rust:generate`. Edit the registry source, never the copy.")
    process.exit(1)
  }
  console.log(`✓ Rust component copies in sync — ${items.length} files`)
} else {
  const removed = stale.length > 0 ? `, removed ${stale.length} orphaned` : ""
  console.log(`✓ wrote ${items.length} Rust component copies${removed}`)
}
