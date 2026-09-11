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

/** The leading `// …` comment block of a generated copy, where its source is named. */
function generatedHeader(file: string): string {
  const lines: string[] = []
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (line !== "//" && !line.startsWith("// ")) break
    lines.push(line)
  }
  return lines.join("\n")
}

/**
 * Every registry component a crate compiles, as `n<N>-<label>/<name>.rs`.
 *
 * THE CHAIN HAS A LINK IN IT NOW. A crate's `#[path]` points at a committed copy under
 * `crates/<crate>/src/generated/`, not at `components/registry/` directly, because
 * `cargo package` collects only files below the package root — an include reaching four
 * levels up produced a tarball whose `src/lib.rs` pointed at nothing, and none of the
 * seven crates could be published. The copy's header names the registry file it came
 * from, so that is what this follows.
 *
 * Following the header rather than trusting the filename is the point: it asserts the
 * crate reaches the REGISTRY COMPONENT, not merely that it reaches some file that
 * happens to sit in a directory called `generated`. Whether the copy still MATCHES its
 * source is `pnpm rust:generate:check`'s job, asserted below to be wired into CI.
 */
function includedByCrates(): Set<string> {
  const included = new Set<string>()
  for (const crate of readdirSync(CRATES, { withFileTypes: true })) {
    if (!crate.isDirectory()) continue
    const src = join(CRATES, crate.name, "src")
    const lib = join(src, "lib.rs")
    if (!existsSync(lib)) continue
    for (const m of readFileSync(lib, "utf8").matchAll(/#\[path\s*=\s*"([^"]+)"\]/g)) {
      const spec = m[1]
      // A `#[path]` that still reaches into the registry itself. Unpublishable, and
      // `cargo package --workspace` in CI rejects it — but resolve it here anyway so
      // this test reports the orphan it was written to report rather than a miss.
      if (spec.includes("components/registry/")) {
        included.add(
          spec.slice(spec.indexOf("components/registry/") + "components/registry/".length)
        )
        continue
      }
      const copy = join(src, spec)
      if (!existsSync(copy)) continue
      const source = /components\/registry\/(\S+\.rs)/.exec(generatedHeader(copy))
      if (source) included.add(source[1])
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
    // The two gates that keep the crates publishable. `cargo package` is the only
    // command that proves it — it collects the tarball and verify-builds it, which is
    // what failed on all seven while the crates included their components from four
    // levels up. `rust:generate:check` is what stops the committed copies drifting from
    // the registry files they were copied from; without it the crates.io release would
    // quietly stop being the component the registry serves.
    expect(ci, "CI does not run `cargo package`").toContain("cargo package")
    expect(ci, "CI does not verify the generated Rust copies").toContain("rust:generate:check")
    // `--no-verify` skips the verify build, which is the entire assertion — it would
    // turn the step into "the tarball was written", not "the tarball compiles". Matched
    // on the command line rather than anywhere in the file, so the comment above the
    // step is free to name the flag it is warning against.
    expect(ci, "`cargo package --no-verify` defeats the point").not.toMatch(
      /cargo (package|publish)[^\n]*--no-verify/
    )
    // Without this the Rust job could go red while `Build` — the terminal gate — went green.
    expect(ci).toMatch(/needs: \[[^\]]*\brust\b[^\]]*\]/)
  })
})
