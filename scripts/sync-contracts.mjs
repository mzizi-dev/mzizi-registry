#!/usr/bin/env node
// Write each component contract into the builds that carry it inline.
//
// One contract per component, whatever the language (owner, 2026-10-05; #427). The
// contract is `contracts/<family>/<name>.contract.json` and nothing else. Two builds need
// its clauses inside their own source:
//
//   .rs  `pub const CONTRACT: &str = r#"contract … end"#;`, which the crate exports and
//        the API serves beside the source. It is the contract's `contract` block, verbatim.
//   .mz  the `contract … end` block `mz contract` evaluates. `mz check` warns on a component
//        with none, and the language evaluates its clauses on the source, not on a rendered
//        state, so it gets the clauses that read the root element (`slot`, `portal`, `role`,
//        `label`, `class`) and `<element> "<text>" min_height N`. The `when <state>` clauses,
//        `uses` and the checks need rendered markup: the .tsx and .rs runners hold those.
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

const ROOT_SUBJECT = /^(?:slot|portal|role|label|class) /
const MIN_HEIGHT = /^[a-z0-9]+ "[^"]*" min_height \d+$/

/** The clauses `mz contract` evaluates on source. */
function mzClauses(contract) {
  return contract
    .split("\n")
    .slice(1, -1)
    .map((l) => l.trim())
    .filter((l) => ROOT_SUBJECT.test(l) || MIN_HEIGHT.test(l))
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

function syncMz(path, contract, contractFile) {
  const src = readFileSync(path, "utf8")
  const clauses = mzClauses(contract)
  if (clauses.length === 0) {
    throw new Error(
      `${contractFile} has no clause the Mzizi language evaluates on source (slot, portal, role, ` +
        "label, class or min_height), so its .mz would carry an empty contract. Add one."
    )
  }
  const block = ["  contract", ...clauses.map((c) => `    ${c}`), "  end"].join("\n")
  const re = /^ {2}contract\n[\s\S]*?^ {2}end$/m
  if (!re.test(src)) {
    throw new Error(
      `${relative(ROOT, path)} has no \`  contract … end\` block for its contract to be written into.`
    )
  }
  return src.replace(re, block)
}

const drift = []
let written = 0
let copies = 0
for (const file of contractFiles()) {
  const c = JSON.parse(readFileSync(file, "utf8"))
  const rel = relative(ROOT, file)
  for (const [lang, sync] of [
    ["rs", (p) => syncRs(p, c.contract)],
    ["mz", (p) => syncMz(p, c.contract, rel)],
  ]) {
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
