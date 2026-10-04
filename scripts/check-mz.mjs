#!/usr/bin/env node
// Check every Mzizi language component in the registry: `mz check` and `mz contract`.
//
// A `.mz` file beside a component's `.tsx` and `.rs` is the third build of the same
// contract. Like a `.rs` with no crate compiling it, a `.mz` that nothing checks is bytes
// no toolchain verifies, so this runs in CI from the commit that adds the first one.
//
// `mz` is built from mzizi-dev/mzizi at the commit pinned in `scripts/mz-pin`. Point MZ at
// the binary:
//
//   git clone https://github.com/mzizi-dev/mzizi ../mzizi && git -C ../mzizi checkout "$(cat scripts/mz-pin)"
//   cargo build --release --manifest-path ../mzizi/compiler/Cargo.toml --bin mz
//   MZ=../mzizi/target/release/mz pnpm mz:check
//
// Today `mz` checks a component and evaluates its contract; it does not lower a component
// to Rust (only a `service` lowers). The `.rs` sibling stays hand-written and is held to
// the same contract by its crate's `tests/contract.rs`.

import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const ROOT = process.cwd()
const REGISTRY = join(ROOT, "components", "registry")
const MZ = process.env.MZ

if (!MZ || !existsSync(MZ)) {
  console.error(
    "✖ set MZ to the `mz` binary built from mzizi-dev/mzizi at the commit in scripts/mz-pin " +
      "(see the header of scripts/check-mz.mjs)."
  )
  process.exit(1)
}

const files = []
for (const dir of readdirSync(REGISTRY).sort()) {
  const path = join(REGISTRY, dir)
  if (!statSync(path).isDirectory()) continue
  for (const f of readdirSync(path).sort()) if (f.endsWith(".mz")) files.push(join(path, f))
}

let failed = 0
let clauses = 0
for (const file of files) {
  const rel = relative(ROOT, file)
  for (const command of ["check", "contract"]) {
    let out
    try {
      out = execFileSync(MZ, [command, "--agent", file], { encoding: "utf8" })
    } catch (e) {
      failed++
      console.error(`✖ mz ${command} ${rel}\n${e.stdout ?? ""}${e.stderr ?? ""}`)
      continue
    }
    const summary = out
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l))
      .find((d) => d.summary)
    if (summary?.warnings) {
      failed++
      console.error(`✖ mz ${command} ${rel}: ${summary.warnings} warning(s)\n${out}`)
    }
    if (command === "contract") clauses += summary?.contract_clauses ?? 0
  }
}

if (failed) process.exit(1)
console.log(`✓ ${files.length} Mzizi component(s) check clean; ${clauses} contract clause(s) hold.`)
