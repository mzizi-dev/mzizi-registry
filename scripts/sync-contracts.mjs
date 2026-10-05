#!/usr/bin/env node
// Write each component contract into the builds that carry it inline.
//
// One contract per component, whatever the language (owner, 2026-10-05; #427). The
// contract is `contracts/<family>/<name>.contract.json` and nothing else. The Rust build
// needs its clauses inside its own source: `pub const CONTRACT: &str = r#"contract … end"#;`,
// which the crate exports and the API serves beside the source. That const is the contract's
// `contract` block, verbatim, written here and never by hand.
//
// (`.mz` files are not touched: per AGENTS.md they are built elsewhere and land as their own
// change.)
//
// Only implementations whose `identity` is `contract` are written: an identity-only sibling
// (`slot`, `slot+role`, `slot+variants`) diverges from its contract by design, so its
// contract text must not be pasted into it.
//
//   node scripts/sync-contracts.mjs           write the copies
//   node scripts/sync-contracts.mjs --check   fail if any copy differs (CI)

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const CONTRACTS = join(ROOT, "contracts")
const REGISTRY = join(ROOT, "components", "registry")
const check = process.argv.includes("--check")

/** Every `<family>/<name>.contract.json` under contracts/. */
function contractFiles() {
  const out = []
  for (const family of readdirSync(CONTRACTS).sort()) {
    const dir = join(CONTRACTS, family)
    if (family === "schema" || !statSync(dir).isDirectory()) continue
    for (const f of readdirSync(dir).sort()) if (f.endsWith(".contract.json")) out.push(join(dir, f))
  }
  return out
}

/** The registry file for an item, in whichever node directory holds it. */
function registryFile(name, ext) {
  for (const node of readdirSync(REGISTRY).sort()) {
    const p = join(REGISTRY, node, `${name}.${ext}`)
    try {
      statSync(p)
      return p
    } catch {
      // not in this node
    }
  }
  return null
}

function syncRs(path, contract) {
  const src = readFileSync(path, "utf8")
  const re = /(pub const CONTRACT: &str = r#")([\s\S]*?)("#;)/
  if (!re.test(src)) {
    throw new Error(
      `${relative(ROOT, path)} has no \`pub const CONTRACT: &str = r#"…"#;\` for its contract to be written into. ` +
        "Add the const (with a doc comment naming the contract file), then run pnpm contracts:sync."
    )
  }
  return src.replace(re, (_, open, _old, close) => `${open}${contract}${close}`)
}

const drift = []
let written = 0
let copies = 0
for (const file of contractFiles()) {
  const c = JSON.parse(readFileSync(file, "utf8"))
  const rel = relative(ROOT, file)
  for (const [lang, sync] of [["rs", (p) => syncRs(p, c.contract)]]) {
    const sib = c.implementations?.[lang]
    if (!sib || sib.identity !== "contract") continue
    const path = registryFile(sib.registry, lang)
    if (!path) throw new Error(`${rel} names ${sib.registry}.${lang}, which is not in components/registry/`)
    copies++
    const current = readFileSync(path, "utf8")
    const next = sync(path)
    if (next === current) continue
    if (check) drift.push(`${relative(ROOT, path)} (from ${rel})`)
    else {
      writeFileSync(path, next)
      written++
    }
  }
}

if (check) {
  if (drift.length) {
    console.error("✖ these builds carry contract text that differs from their contract:")
    for (const d of drift) console.error(`  ${d}`)
    console.error("Run `pnpm contracts:sync` (then `pnpm rust:generate`) and commit the result.")
    process.exit(1)
  }
  console.log(`✓ ${copies} inline contract cop${copies === 1 ? "y matches" : "ies match"} contracts/.`)
} else {
  console.log(`✓ contracts:sync wrote ${written} of ${copies} inline contract cop${copies === 1 ? "y" : "ies"}.`)
}
