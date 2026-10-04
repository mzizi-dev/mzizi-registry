/**
 * Component contracts (contracts/, #404).
 *
 * 1. Every contract is well formed: it validates against
 *    contracts/schema/component-contract.schema.json (read here, not
 *    restated), every line of its `contract … end` block is a clause form
 *    the runners evaluate, and every `when <state>` names a declared state.
 * 2. index.json and the README's coverage table agree with the files.
 * 3. Where a contract names a React (.tsx) or Rust (.rs) sibling, that
 *    sibling carries the contract's identity: the root data-slot, and the
 *    data-variant values or the role, as `identity` says. The .tsx is
 *    rendered; the .rs is read (its crate's tests/contract.rs renders it
 *    against the .tsx).
 *
 * The Astro builds are evaluated in full in mzizi-dev/packages-npm
 * (`src/app/contracts.test.ts`), against a copy of this directory.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { createElement, type ComponentType } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test } from "vitest"

import { Alert } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

const ROOT = path.resolve(__dirname, "../..")
const DIR = path.join(ROOT, "contracts")
const read = (p: string) => readFileSync(path.join(DIR, p), "utf8")

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
interface Sibling {
  registry: string
  identity: "slot" | "slot+role" | "slot+variants"
  divergences?: string[]
}
interface Contract {
  name: string
  title: string
  version: string
  node: number
  states: Record<string, unknown>
  contract: string
  props: { name: string; values?: string[] }[]
  implementations: { tsx: Sibling | null; rs: Sibling | null }
  gaps?: string[]
}

const schema = JSON.parse(read("schema/component-contract.schema.json")) as Record<string, Json>
const index = JSON.parse(read("index.json")) as {
  schema: string
  contracts: { name: string; title: string; version: string; file: string; tsx: string | null; rs: string | null }[]
}
const files = readdirSync(path.join(DIR, "app"))
  .filter((f) => f.endsWith(".contract.json"))
  .sort()
const raw = Object.fromEntries(files.map((f) => [f, JSON.parse(read(`app/${f}`)) as Json]))
const contracts = Object.fromEntries(Object.entries(raw).map(([f, j]) => [f, j as unknown as Contract]))

// ─── A JSON Schema reader for the subset the contract schema uses ─────────

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
      else if (s.additionalProperties && typeof s.additionalProperties === "object") {
        validate(v, s.additionalProperties as Record<string, Json>, `${at}.${key}`, out)
      }
    }
  }
}

// ─── The clause grammar the runners evaluate (RFC-0006 subset) ────────────

const PRED = String.raw`(?:is "[^"]*"|contains "[^"]*"|not_empty|in(?: "[^"]*")+|uses "--[a-z0-9-]+")`
const CLAUSE = [
  new RegExp(String.raw`^(?:slot|role|label|class|portal) ${PRED}$`),
  new RegExp(String.raw`^when [a-z][a-z0-9_-]* (?:slot|role|label|class|portal) ${PRED}$`),
  /^when [a-z][a-z0-9_-]* shows [a-z0-9]+ "[^"]*"$/,
  /^[a-z0-9]+ "[^"]*" min_height \d+$/,
  /^uses [a-z0-9-]+$/,
]

function clauses(c: Contract): string[] {
  return c.contract.split("\n").slice(1, -1).map((l) => l.trim())
}

/** The unguarded `slot is "…"` clause: the component's identity. */
function slotOf(c: Contract): string | undefined {
  for (const line of clauses(c)) {
    const m = /^slot is "([^"]+)"$/.exec(line)
    if (m) return m[1]
  }
  return undefined
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("contracts are well formed", () => {
  test("there is one per @bundu/ui app component (31)", () => {
    expect(files).toHaveLength(31)
  })

  test.each(files)("%s validates against the schema", (f) => {
    const out: string[] = []
    validate(raw[f] as Json, schema, f, out)
    expect(out).toEqual([])
    expect(`${contracts[f].name.split("/")[1]}.contract.json`).toBe(f)
  })

  test.each(files)("%s: every clause is a form the runners evaluate", (f) => {
    const c = contracts[f]
    const bad = clauses(c).filter((l) => !CLAUSE.some((re) => re.test(l)))
    expect(bad).toEqual([])
    const states = Object.keys(c.states)
    const unknown = clauses(c)
      .map((l) => /^when ([a-z][a-z0-9_-]*) /.exec(l)?.[1])
      .filter((s): s is string => s !== undefined && !states.includes(s))
    expect(unknown).toEqual([])
    expect(slotOf(c), "every contract names its slot").toBeDefined()
  })
})

describe("index.json and the README agree with the files", () => {
  test("the index lists every contract, at its version", () => {
    expect(index.contracts.map((e) => e.file).sort()).toEqual(files.map((f) => `app/${f}`))
    for (const e of index.contracts) {
      const c = contracts[e.file.replace("app/", "")]
      expect([e.name, e.title, e.version, e.tsx, e.rs]).toEqual([
        c.name,
        c.title,
        c.version,
        c.implementations.tsx?.registry ?? null,
        c.implementations.rs?.registry ?? null,
      ])
    }
  })

  test("the README's coverage table has the right row for every contract", () => {
    // Prettier pads table cells; compare with runs of spaces collapsed.
    const readme = read("README.md").replace(/ {2,}/g, " ")
    const cell = (s: Sibling | null) => (s ? `\`${s.registry}\` (${s.identity})` : "—")
    for (const c of Object.values(contracts)) {
      const row = `| \`${c.name}\` | ${c.title} | N${c.node} | ${c.version} | ${cell(c.implementations.tsx)} | ${cell(c.implementations.rs)} |`
      expect(readme, c.name).toContain(row)
    }
  })
})

// ─── Siblings ─────────────────────────────────────────────────────────────

const REACT: Record<string, ComponentType<Record<string, unknown>>> = {
  alert: Alert as ComponentType<Record<string, unknown>>,
  badge: Badge as ComponentType<Record<string, unknown>>,
  button: Button as ComponentType<Record<string, unknown>>,
  card: Card as ComponentType<Record<string, unknown>>,
  input: Input as ComponentType<Record<string, unknown>>,
  label: Label as ComponentType<Record<string, unknown>>,
  skeleton: Skeleton as ComponentType<Record<string, unknown>>,
}

function registryFile(name: string, ext: "tsx" | "rs"): string {
  const dir = path.join(ROOT, "components/registry")
  for (const node of readdirSync(dir)) {
    const p = path.join(dir, node, `${name}.${ext}`)
    try {
      return readFileSync(p, "utf8")
    } catch {
      // not in this node
    }
  }
  throw new Error(`no components/registry/*/${name}.${ext}`)
}

function rootOf(html: string): Element {
  const el = new DOMParser().parseFromString(html, "text/html").body.firstElementChild
  if (!el) throw new Error(`rendered nothing: ${html}`)
  return el
}

const variantsOf = (c: Contract) => c.props.find((p) => p.name === "variant")?.values ?? []
const roleOf = (c: Contract) =>
  clauses(c)
    .map((l) => /^role is "([^"]+)"$/.exec(l)?.[1])
    .find(Boolean)

const withTsx = Object.values(contracts).filter((c) => c.implementations.tsx)
const withRs = Object.values(contracts).filter((c) => c.implementations.rs)

describe("React (.tsx) siblings carry the contract's identity", () => {
  test.each(withTsx.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const sib = c.implementations.tsx as Sibling
    const Comp = REACT[sib.registry]
    expect(Comp, `no renderer registered here for ${sib.registry}.tsx`).toBeDefined()
    const slot = slotOf(c)
    const render = (props: Record<string, unknown>) => rootOf(renderToStaticMarkup(createElement(Comp, props)))
    expect(render({}).getAttribute("data-slot")).toBe(slot)
    if (sib.identity === "slot+variants") {
      const values = variantsOf(c)
      expect(values.length).toBeGreaterThan(0)
      for (const v of values) {
        const el = render({ variant: v })
        expect(el.getAttribute("data-slot"), v).toBe(slot)
        expect(el.getAttribute("data-variant"), v).toBe(v)
      }
    }
    if (sib.identity === "slot+role") expect(render({}).getAttribute("role")).toBe(roleOf(c))
  })
})

describe("Rust (.rs) siblings carry the contract's identity", () => {
  test.each(withRs.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const sib = c.implementations.rs as Sibling
    const rs = registryFile(sib.registry, "rs")
    expect(rs).toContain(`"data-slot": "${slotOf(c)}"`)
    if (sib.identity === "slot+variants") {
      expect(rs).toContain(`"data-variant"`)
      for (const v of variantsOf(c)) expect(rs, v).toContain(`"${v}"`)
    }
    if (sib.identity === "slot+role") expect(rs).toContain(`"role": "${roleOf(c)}"`)
  })
})
