// @vitest-environment node
/**
 * Library contracts (contracts/lib/, contracts/schema/lib-contract.schema.json; #472).
 *
 * 1. Each validates against the library schema (read here, not restated).
 * 2. index.json's `libraries` and the README's library table agree with the files.
 * 3. Each implementation exists: the `.ts` and `.rs` registry files, the Rust module declared
 *    in its crate's lib.rs, and the crate in mzizi-rs/crate-for-node.json for its node.
 * 4. Every API symbol the contract lists is exported by that build's source, and every
 *    error code appears in both builds.
 * 5. Every fixture exists, and a build that is `null` has a `gaps` entry saying when it lands.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, test } from "vitest"

const ROOT = path.resolve(__dirname, "../..")
const DIR = path.join(ROOT, "contracts")
const read = (p: string) => readFileSync(path.join(DIR, p), "utf8")

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
interface Symbol_ {
  name: string
  kind: string
}
interface LibContract {
  name: string
  title: string
  version: string
  node: number
  api: { ts: Symbol_[]; rs: Symbol_[]; py: Symbol_[] | null }
  errors: { code: string }[]
  fixtures: string[]
  implementations: {
    ts: { registry: string; file: string } | null
    rs: { registry: string; file: string; crate: string; module: string } | null
    py: { registry: string; file: string; package: string } | null
  }
  gaps?: string[]
}

const schema = JSON.parse(read("schema/lib-contract.schema.json")) as Record<string, Json>
const index = JSON.parse(read("index.json")) as {
  libSchema: string
  libraries: { name: string; title: string; version: string; file: string; ts: string | null; rs: string | null; py: string | null }[]
}
const files = readdirSync(path.join(DIR, "lib"))
  .filter((f) => f.endsWith(".contract.json"))
  .map((f) => `lib/${f}`)
  .sort()
const raw = Object.fromEntries(files.map((f) => [f, JSON.parse(read(f)) as Json]))
const contracts = Object.fromEntries(Object.entries(raw).map(([f, j]) => [f, j as unknown as LibContract]))

// The same JSON Schema subset contracts.test.tsx reads.
function typeOf(v: Json): string {
  if (v === null) return "null"
  if (Array.isArray(v)) return "array"
  if (typeof v === "number") return Number.isInteger(v) ? "integer" : "number"
  return typeof v
}

function validate(value: Json, s: Record<string, Json>, at: string, out: string[]): void {
  if (typeof s.$ref === "string") {
    const def = (schema.$defs as Record<string, Record<string, Json>>)[s.$ref.replace("#/$defs/", "")]
    if (!def) return void out.push(`${at}: unresolved ${s.$ref}`)
    return validate(value, def, at, out)
  }
  if (s.type !== undefined) {
    const types = Array.isArray(s.type) ? s.type : [s.type]
    const t = typeOf(value)
    if (!types.includes(t) && !(t === "integer" && types.includes("number"))) {
      return void out.push(`${at}: is ${t}, expected ${types.join(" | ")}`)
    }
  }
  if (Array.isArray(s.enum) && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    out.push(`${at}: ${JSON.stringify(value)} is not one of ${JSON.stringify(s.enum)}`)
  }
  if (typeof s.pattern === "string" && typeof value === "string" && !new RegExp(s.pattern).test(value)) {
    out.push(`${at}: does not match ${s.pattern}`)
  }
  if (Array.isArray(value)) {
    if (typeof s.minItems === "number" && value.length < s.minItems) out.push(`${at}: fewer than ${s.minItems} items`)
    if (s.items && typeof s.items === "object") {
      value.forEach((v, i) => validate(v, s.items as Record<string, Json>, `${at}[${i}]`, out))
    }
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const props = (s.properties ?? {}) as Record<string, Record<string, Json>>
    for (const key of (s.required ?? []) as string[]) if (!(key in value)) out.push(`${at}: missing "${key}"`)
    for (const [key, v] of Object.entries(value)) {
      if (props[key]) validate(v, props[key], `${at}.${key}`, out)
      else if (s.additionalProperties === false) out.push(`${at}: unexpected "${key}"`)
    }
  }
}

const source = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8")

/** Whether a TypeScript module exports `name` (declared here or re-exported with `export *`). */
function tsExports(file: string, name: string, seen = new Set<string>()): boolean {
  if (seen.has(file)) return false
  seen.add(file)
  const src = source(file)
  const declared = new RegExp(
    String.raw`^export\s+(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(?:class|function|const|let|type|interface|enum)\s+${name}\b`,
    "m",
  )
  if (declared.test(src)) return true
  for (const m of src.matchAll(/^export \* from "\.\/([a-z0-9-]+)"/gm)) {
    if (tsExports(path.join(path.dirname(file), `${m[1]}.ts`), name, seen)) return true
  }
  return false
}

/** Whether a Rust module declares `pub <item> name`. */
function rsDeclares(file: string, name: string): boolean {
  return new RegExp(
    String.raw`^\s*pub\s+(?:const\s+fn|async\s+fn|fn|struct|enum|trait|const|type|mod)\s+${name}\b`,
    "m",
  ).test(source(file))
}

describe("library contracts are well formed", () => {
  test("there is at least one, and the index points at the library schema", () => {
    expect(files.length).toBeGreaterThan(0)
    expect(index.libSchema).toBe("schema/lib-contract.schema.json")
  })

  test.each(files)("%s validates against the library schema", (f) => {
    const out: string[] = []
    validate(raw[f] as Json, schema, f, out)
    expect(out).toEqual([])
    expect(`${contracts[f]?.name}.contract.json`).toBe(f)
  })
})

describe("index.json and the README agree with the library files", () => {
  test("the index lists every library contract, at its version", () => {
    expect(index.libraries.map((e) => e.file).sort()).toEqual(files)
    for (const e of index.libraries) {
      const c = contracts[e.file] as LibContract
      expect([e.name, e.title, e.version, e.ts, e.rs, e.py]).toEqual([
        c.name,
        c.title,
        c.version,
        c.implementations.ts?.registry ?? null,
        c.implementations.rs?.registry ?? null,
        c.implementations.py?.registry ?? null,
      ])
    }
  })

  test("the README's library table has the right row for every contract", () => {
    const readme = read("README.md").replace(/ {2,}/g, " ")
    for (const c of Object.values(contracts)) {
      const ts = c.implementations.ts ? `\`${c.implementations.ts.registry}\`` : "—"
      const rs = c.implementations.rs
        ? `\`${c.implementations.rs.registry}\` (\`${c.implementations.rs.crate.replace(/-/g, "_")}::${c.implementations.rs.module}\`)`
        : "—"
      const py = c.implementations.py ? `\`${c.implementations.py.registry}\`` : "—"
      expect(readme, c.name).toContain(`| \`${c.name}\` | ${c.title} | N${c.node} | ${c.version} | ${ts} | ${rs} | ${py} |`)
    }
  })
})

describe("every build the contract names exists and carries the contract", () => {
  const crateForNode = JSON.parse(source("mzizi-rs/crate-for-node.json")) as Record<string, string>

  test.each(files)("%s", (f) => {
    const c = contracts[f] as LibContract
    const { ts, rs, py } = c.implementations
    if (ts) {
      expect(existsSync(path.join(ROOT, ts.file)), ts.file).toBe(true)
      expect(path.basename(ts.file, ".ts")).toBe(ts.registry)
      for (const s of c.api.ts) expect(tsExports(ts.file, s.name), `${ts.file} exports ${s.name}`).toBe(true)
      // A code may be raised by a sibling module the library imports flat; check the node.
      const nodeTs = readdirSync(path.join(ROOT, path.dirname(ts.file)))
        .filter((x) => x.endsWith(".ts"))
        .map((x) => source(path.join(path.dirname(ts.file), x)))
      for (const e of c.errors) {
        expect(nodeTs.some((src) => src.includes(`"${e.code}"`)), `${ts.registry} code ${e.code}`).toBe(true)
      }
    }
    if (rs) {
      expect(existsSync(path.join(ROOT, rs.file)), rs.file).toBe(true)
      expect(path.basename(rs.file, ".rs")).toBe(rs.registry)
      const node = rs.file.split("/").at(-2) as string
      expect(crateForNode[node], `crate-for-node.json maps ${node}`).toBe(rs.crate)
      const lib = source(`mzizi-rs/crates/${rs.crate}/src/lib.rs`)
      expect(lib).toContain(`#[path = "generated/${rs.registry}.rs"]\npub mod ${rs.module};`)
      // A symbol may live in a sibling module of the crate and be re-exported; check the crate.
      const crateFiles = readdirSync(path.join(ROOT, path.dirname(rs.file)))
        .filter((x) => x.endsWith(".rs"))
        .map((x) => path.join(path.dirname(rs.file), x))
      for (const s of c.api.rs) {
        expect(
          crateFiles.some((file) => rsDeclares(file, s.name)),
          `${rs.crate} declares ${s.name}`,
        ).toBe(true)
      }
      for (const e of c.errors) {
        expect(crateFiles.some((file) => source(file).includes(`"${e.code}"`)), `${rs.crate} code ${e.code}`).toBe(true)
      }
    }
    for (const fx of c.fixtures) expect(existsSync(path.join(ROOT, fx)), fx).toBe(true)
    for (const [lang, impl] of Object.entries({ ts, rs, py })) {
      if (impl === null) {
        const word = { ts: "TypeScript", rs: "Rust", py: "Python" }[lang] as string
        expect(c.gaps?.some((g) => g.includes(word)), `${c.name}: a gap says when ${word} lands`).toBe(true)
      }
    }
    expect(c.api.py === null).toBe(py === null)
  })
})
