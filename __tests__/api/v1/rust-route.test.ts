import { describe, expect, it } from "vitest"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

/**
 * The bilingual registry — TypeScript and Rust as two surfaces over ONE component.
 *
 * These are structural assertions about the repo rather than route invocations, matching the
 * rest of `__tests__/api/v1/`: they catch the thing that actually breaks, which is a `.rs`
 * file drifting out of the crate that compiles it, or the registry gaining a second entry for
 * a component that already has one.
 *
 * What is NOT asserted here: that the Rust compiles, or that it agrees with the TypeScript.
 * `cargo check` / `clippy -D warnings` and `mzizi-rs/crates/mzizi-ui/tests/contract.rs` own
 * those, and they run in CI's `Rust` job. Re-implementing them in vitest would give a second,
 * weaker answer to a question already answered properly.
 */

const ROOT = process.cwd()
const REGISTRY_DIR = join(ROOT, "components", "registry")
const CRATES = join(ROOT, "mzizi-rs", "crates")

/** Every `.rs` file in the component registry, as `n<N>-<label>/<name>.rs`. */
function rustComponents(): string[] {
  const out: string[] = []
  for (const dir of readdirSync(REGISTRY_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const entry of readdirSync(join(REGISTRY_DIR, dir.name))) {
      if (entry.endsWith(".rs")) out.push(`${dir.name}/${entry}`)
    }
  }
  return out.sort()
}

/** Every `#[path = "…"]` include across the cargo workspace, normalised to `dir/file.rs`. */
function includedByCrates(): Set<string> {
  const included = new Set<string>()
  for (const crate of readdirSync(CRATES, { withFileTypes: true })) {
    if (!crate.isDirectory()) continue
    const lib = join(CRATES, crate.name, "src", "lib.rs")
    if (!existsSync(lib)) continue
    for (const m of readFileSync(lib, "utf8").matchAll(/#\[path\s*=\s*"([^"]+)"\]/g)) {
      const rel = m[1].replace(/^(\.\.\/)+/, "").replace(/^components\/registry\//, "")
      included.add(rel)
    }
  }
  return included
}

describe("the Rust half of the registry", () => {
  it("has a cargo workspace", () => {
    expect(existsSync(join(ROOT, "mzizi-rs", "Cargo.toml"))).toBe(true)
  })

  it("compiles every .rs component through a crate", () => {
    // THE load-bearing assertion. A `.rs` file that no crate includes is not checked by
    // `cargo check`, `clippy` or the contract tests — it is bytes nothing verifies, which is
    // precisely what a `source_code` database column was. Adding a Rust component means
    // adding its `#[path]` line, and this fails until you do.
    const included = includedByCrates()
    const orphans = rustComponents().filter((f) => !included.has(f))
    expect(orphans, `these .rs components are compiled by no crate: ${orphans.join(", ")}`).toEqual(
      []
    )
  })

  it("serves Rust at its own route", () => {
    expect(existsSync(join(ROOT, "app", "api", "v1", "rs", "[name]", "route.ts"))).toBe(true)
  })

  it("gives a Rust sibling no registry entry of its own", () => {
    // One component, one name, one contract — implemented for two targets. A `button-rust`
    // entry beside `button` would let the description, the dependencies and the documented
    // variants drift apart while both entries looked correct.
    const manifest = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8")) as {
      items: { name: string }[]
    }
    const names = new Set(manifest.items.map((i) => i.name))
    for (const file of rustComponents()) {
      const name = file.split("/")[1].replace(/\.rs$/, "")
      // The N1 token targets are genuinely separate artifacts, one per platform, and each
      // legitimately has its own entry — `nyuchi-tokens-rust` is a file, not a second
      // implementation of `nyuchi-tokens`.
      if (name.startsWith("nyuchi-tokens-")) continue
      expect(names.has(`${name}-rust`), `${name}-rust should not be a separate item`).toBe(false)
      expect(names.has(name), `${name} has Rust source but no registry entry`).toBe(true)
    }
  })

  it("keeps the Rust CI gate wired to the build", () => {
    const ci = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8")
    for (const cmd of ["cargo fmt", "cargo check", "cargo clippy", "cargo test"]) {
      expect(ci, `CI does not run \`${cmd}\``).toContain(cmd)
    }
    // Without this the Rust job could go red while `Build` — the terminal gate — went green.
    expect(ci).toMatch(/needs: \[[^\]]*\brust\b[^\]]*\]/)
  })
})
