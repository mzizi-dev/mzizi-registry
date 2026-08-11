#!/usr/bin/env node
/**
 * Fill the shadcn registry-item fields that were absent on every item.
 *
 *   pnpm registry:metadata          rewrite registry.json
 *   pnpm registry:metadata --check  fail if it is out of date (CI)
 *
 * WHAT AND WHY
 *
 * Audited against the published schema at ui.shadcn.com/schema/registry-item.json, the
 * registry used 5 of the 22 available properties. `title` and `categories` were missing on
 * ALL 573 items, and `docs` and `author` on all of them too. None of that breaks an install
 * — but `title` is what a registry browser and the CLI show a human, `categories` is how
 * anything groups 573 components, and `docs` is what the CLI prints AFTER installing, which
 * is the one moment a consumer is looking for "now what?".
 *
 * DERIVED, NEVER INVENTED. Every value here comes from data already authored on the item:
 *
 *   title       the component name, cased
 *   categories  meta.collection and the node label — the two groupings that already exist
 *   docs        meta.useCases / variants / sizes / features / a11y, which 558-568 items
 *               already carry, plus the real install command
 *   author      the attribution in README.md
 *
 * Nothing is placeholder. An item with no `meta` gets no `docs` rather than a stub, because
 * a stub would read as documentation and say nothing — and this repo has already learned
 * what an unactionable signal costs (see the touch-target note in validate-registry.mjs).
 *
 * `description` is NOT touched: it is authored per component and several are load-bearing
 * prose. Regenerating it would overwrite the only human-written field on the item.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const REGISTRY = join(ROOT, "registry.json")

/**
 * Brand wordmarks stay lowercase (CLAUDE.md §11.1 — never "Mzizi-Tools", never "Nyuchi").
 * So `nyuchi-listing-card` titles as "nyuchi Listing Card", not "Nyuchi Listing Card".
 */
const WORDMARKS = new Set([
  "mzizi",
  "nyuchi",
  "mukoko",
  "bundu",
  "shamwari",
  "nhimbe",
  "fundi",
  "kweli",
  "bushtrade",
])

/** Acronyms that read wrong in Title Case. */
const UPPER = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["ui", "UI"],
  ["ux", "UX"],
  ["mcp", "MCP"],
  ["a11y", "a11y"],
  ["seo", "SEO"],
  ["otp", "OTP"],
  ["pwa", "PWA"],
  ["qr", "QR"],
  ["sms", "SMS"],
  ["url", "URL"],
  ["id", "ID"],
  ["kyc", "KYC"],
  ["ap2", "AP2"],
  ["ucp", "UCP"],
  ["dx", "DX"],
])

function titleFor(name) {
  return name
    .split("-")
    .map((w) => {
      if (WORDMARKS.has(w)) return w
      if (UPPER.has(w)) return UPPER.get(w)
      if (/^\d+$/.test(w)) return w
      return w.charAt(0).toUpperCase() + w.slice(1)
    })
    .join(" ")
}

function categoriesFor(item, nodeLabel) {
  const out = []
  const collection = item.meta?.collection
  if (collection) out.push(collection)
  if (nodeLabel && nodeLabel !== collection) out.push(nodeLabel)
  return out.length ? out : undefined
}

/**
 * Compose `docs` from the contract the component already declares.
 *
 * Returns undefined when there is nothing real to say, so an item without `meta` gets no
 * `docs` key at all rather than an empty heading.
 */
function docsFor(item) {
  const m = item.meta ?? {}
  const parts = []
  const section = (label, values) => {
    if (Array.isArray(values) && values.length) {
      parts.push(`${label}: ${values.join(", ")}.`)
    }
  }
  section("Use it for", m.useCases)
  section("Variants", m.variants)
  section("Sizes", m.sizes)
  section("Includes", m.features)
  section("Accessibility", m.a11y)
  if (!parts.length) return undefined
  parts.push(`Install: npx shadcn@latest add https://mzizi.dev/api/v1/ui/${item.name}`)
  return parts.join("\n")
}

/** From README.md — Apache-2.0, © Bundu Foundation, operated by Nyuchi Africa (Pvt) Ltd. */
const AUTHOR = "Bundu Foundation, operated by Nyuchi Africa (Pvt) Ltd — https://mzizi.dev"

/**
 * The node label, read from the directory the source sits in — `n2-primitives` → primitives.
 *
 * NOT from `meta`: the node is derived at read time by `lib/registry.ts` from where the file
 * actually is, and is deliberately not stored in registry.json, so that a component cannot
 * claim a node its file contradicts. Deriving it the same way here keeps that property.
 */
function indexNodeLabels() {
  const dir = join(ROOT, "components", "registry")
  const byName = new Map()
  for (const nodeDir of readdirSync(dir, { withFileTypes: true })) {
    if (!nodeDir.isDirectory()) continue
    const label = /^n\d+-(.+)$/.exec(nodeDir.name)?.[1]
    if (!label) continue
    for (const entry of readdirSync(join(dir, nodeDir.name))) {
      const base = entry.replace(/\.[^.]+$/, "")
      if (!byName.has(base)) byName.set(base, label)
    }
  }
  return byName
}

const NODE_LABELS = indexNodeLabels()
function nodeLabelOf(item) {
  return NODE_LABELS.get(item.name)
}

function apply(manifest) {
  let changed = 0
  for (const item of manifest.items ?? []) {
    const before = JSON.stringify([item.title, item.categories, item.docs, item.author])
    item.title = titleFor(item.name)
    const cats = categoriesFor(item, nodeLabelOf(item))
    if (cats) item.categories = cats
    else delete item.categories
    const docs = docsFor(item)
    if (docs) item.docs = docs
    else delete item.docs
    item.author = AUTHOR
    if (JSON.stringify([item.title, item.categories, item.docs, item.author]) !== before) changed++
  }
  return changed
}

function main() {
  const check = process.argv.includes("--check")
  const manifest = JSON.parse(readFileSync(REGISTRY, "utf8"))
  const original = JSON.stringify(manifest)
  const changed = apply(manifest)
  const next = JSON.stringify(manifest)

  if (check) {
    if (original !== next) {
      console.error(
        `✖ registry item metadata is out of date (${changed} item(s) would change).\n` +
          "  Run `pnpm registry:metadata` and commit the result."
      )
      process.exit(1)
    }
    console.log(
      `✓ title / categories / docs / author are current on ${manifest.items.length} items.`
    )
    return
  }

  writeFileSync(REGISTRY, JSON.stringify(manifest, null, 2) + "\n")
  const withDocs = manifest.items.filter((i) => i.docs).length
  const withCats = manifest.items.filter((i) => i.categories).length
  console.log(
    `✓ metadata generated for ${manifest.items.length} items ` +
      `(${changed} changed; ${withDocs} with docs, ${withCats} with categories).`
  )
}

main()
