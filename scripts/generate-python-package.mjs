#!/usr/bin/env node
/**
 * Copy every packaged Python registry component into the package that ships it.
 *
 * The Python twin of `scripts/generate-rust-components.mjs` (#472), for the same reason.
 *
 * `components/registry/n<N>-<label>/<name>.py` stays canonical: it is the file a human
 * edits, beside the component's `.ts` and `.rs` siblings, one component in one place. A
 * wheel or sdist only carries files under the project root (`mzizi-py/`), and a registry
 * file name such as `circuit-breaker.py` is not an importable module name. So the package
 * gets a GENERATED copy at `mzizi-py/src/<import_name>/<module>.py` (dashes become
 * underscores), committed so `python -m build` works from a clean checkout with no
 * pre-step, and byte-identical to its source apart from a header naming where the
 * original lives.
 *
 * Which package a node's `.py` files ship in is read from `mzizi-py/package-for-node.json`,
 * the file `lib/python-packages.ts` (and so `/v1/py/{name}` on api.mzizi.dev) reads too. A
 * node mapped to `null` has Python that is NOT packaged: a single-file module a consumer
 * copies (N1's `mzizi-tokens-python.py`, which `pnpm tokens:sync` writes). A node with
 * Python and no entry fails this script, so someone decides where it ships.
 *
 * The package directory also holds hand-written files: `__init__.py` (the public API, which
 * re-exports the modules) and `py.typed`. Anything else without the generated header is
 * refused, so a module cannot be written in the package and never reach the registry.
 *
 * Usage:
 *   node scripts/generate-python-package.mjs           write the copies
 *   node scripts/generate-python-package.mjs --check   fail if any has drifted
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const REGISTRY = join(ROOT, "components", "registry")
const PROJECT = join(ROOT, "mzizi-py")

/** node directory → PyPI distribution name, or `null` for Python that is not packaged */
const PACKAGE_FOR_NODE = JSON.parse(readFileSync(join(PROJECT, "package-for-node.json"), "utf8"))

/** The one distribution `mzizi-py/pyproject.toml` builds. */
const PROJECT_NAME = (() => {
  const toml = readFileSync(join(PROJECT, "pyproject.toml"), "utf8")
  const match = /^\[project\][^[]*?^name\s*=\s*"([^"]+)"/ms.exec(toml)
  if (!match) throw new Error("mzizi-py/pyproject.toml has no [project] name")
  return match[1]
})()

const IMPORT_NAME = PROJECT_NAME.replace(/-/g, "_")
const PACKAGE_DIR = join(PROJECT, "src", IMPORT_NAME)

/** Hand-written files the package directory may hold beside the copies. */
const HAND_WRITTEN = new Set(["__init__.py", "py.typed"])

const MARKER = "# GENERATED — DO NOT EDIT."

/** The header prepended to every copy. `source` is repo-relative, forward-slashed. */
function header(source) {
  return `${MARKER}
#
# Copied verbatim from ${source} by scripts/generate-python-package.mjs.
# That file is the one a human edits; this is the copy a wheel can ship, because a
# wheel only carries files under the project root, and a registry file name is not
# an importable module name.
#
# Regenerate with \`pnpm py:generate\`. CI runs \`pnpm py:generate:check\`,
# which fails if this copy and its source have drifted.

`
}

/** `circuit-breaker.py` → `circuit_breaker.py` */
function moduleFile(file) {
  return file.replace(/-/g, "_")
}

for (const [node, pkg] of Object.entries(PACKAGE_FOR_NODE)) {
  if (pkg !== null && pkg !== PROJECT_NAME) {
    throw new Error(
      `mzizi-py/package-for-node.json sends ${node} to "${pkg}", but mzizi-py/ builds ` +
        `"${PROJECT_NAME}". One project, one distribution: add a project before a second package.`
    )
  }
}

/** Every packaged `<node>/<file>.py` under the registry, sorted. */
function discover() {
  const found = []
  for (const node of readdirSync(REGISTRY, { withFileTypes: true })) {
    if (!node.isDirectory()) continue
    const files = readdirSync(join(REGISTRY, node.name)).filter((f) => f.endsWith(".py"))
    if (files.length === 0) continue
    if (!(node.name in PACKAGE_FOR_NODE)) {
      throw new Error(
        `components/registry/${node.name}/ contains Python (${files.sort().join(", ")}) but ` +
          `mzizi-py/package-for-node.json does not say where it ships. Map the node to ` +
          `"${PROJECT_NAME}", or to null for single-file modules that are not packaged.`
      )
    }
    if (PACKAGE_FOR_NODE[node.name] === null) continue
    for (const file of files.sort()) {
      found.push({
        file: moduleFile(file),
        source: `components/registry/${node.name}/${file}`,
        from: join(REGISTRY, node.name, file),
        to: join(PACKAGE_DIR, moduleFile(file)),
      })
    }
  }
  const byModule = new Map()
  for (const item of found) {
    if (HAND_WRITTEN.has(item.file)) {
      throw new Error(`${item.source} would overwrite the hand-written ${item.file}`)
    }
    const other = byModule.get(item.file)
    if (other) {
      throw new Error(`${other.source} and ${item.source} both become module ${item.file}`)
    }
    byModule.set(item.file, item)
  }
  return found.sort((a, b) => a.source.localeCompare(b.source))
}

const items = discover()
const check = process.argv.includes("--check")
const wanted = new Set(items.map((i) => i.file))
const problems = []

/** Files in the package directory that are neither hand-written nor a current copy. */
const stale = []
if (existsSync(PACKAGE_DIR)) {
  for (const entry of readdirSync(PACKAGE_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || HAND_WRITTEN.has(entry.name) || wanted.has(entry.name)) continue
    const path = join(PACKAGE_DIR, entry.name)
    if (entry.name.endsWith(".py") && readFileSync(path, "utf8").startsWith(MARKER)) {
      stale.push(path)
    } else {
      problems.push(
        `hand-written: ${relative(ROOT, path)} is not a generated copy. Put the module in ` +
          `components/registry/ and run \`pnpm py:generate\`.`
      )
    }
  }
}
for (const file of HAND_WRITTEN) {
  if (!existsSync(join(PACKAGE_DIR, file))) {
    problems.push(`missing: ${relative(ROOT, join(PACKAGE_DIR, file))} (hand-written)`)
  }
}

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

// The wheel and sdist carry the licence, and hatchling only reads files under the project
// root, so the project holds a copy of the repository's LICENSE.
{
  const from = join(ROOT, "LICENSE")
  const to = join(PROJECT, "LICENSE")
  const expected = readFileSync(from, "utf8")
  if (check) {
    const current = existsSync(to) ? readFileSync(to, "utf8") : null
    if (current !== expected) problems.push(`out of date: mzizi-py/LICENSE differs from LICENSE`)
  } else {
    writeFileSync(to, expected)
  }
}

for (const path of stale) {
  if (check) {
    problems.push(`orphaned: ${relative(ROOT, path)} has no source under components/registry/`)
  } else {
    rmSync(path)
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`✗ ${problem}`)
  console.error("\nRun `pnpm py:generate`. Edit the registry source, never the copy.")
  process.exit(1)
}
if (check) {
  console.log(`✓ Python package copies in sync — ${items.length} files`)
} else {
  const removed = stale.length > 0 ? `, removed ${stale.length} orphaned` : ""
  console.log(`✓ wrote ${items.length} Python package copies${removed}`)
}
