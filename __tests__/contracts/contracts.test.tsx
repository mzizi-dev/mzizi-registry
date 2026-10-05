/**
 * Component contracts (contracts/, #404).
 *
 * Three families: `app/` (the Dashboard Standard, #404), `discover/` (the
 * Discover Standard, #413) and `primitives/` (registry primitives whose registry
 * builds implement their contract in full, #427). One contract per component,
 * whatever the language: Astro, React (.tsx), Rust (.rs) and Mzizi (.mz).
 *
 * 1. Every contract is well formed: it validates against
 *    contracts/schema/component-contract.schema.json (read here, not
 *    restated), every line of its `contract … end` block is a clause form
 *    the runners evaluate, and every `when <state>` names a declared state.
 * 2. index.json and the README's coverage table agree with the files.
 * 3. Where a contract names a React (.tsx), Rust (.rs) or Mzizi (.mz)
 *    sibling, that sibling carries the contract's identity: the root
 *    data-slot, and the data-variant values or the role, as `identity` says.
 *    The .tsx is rendered; the .rs and .mz are read.
 * 4. A .tsx with `identity: "contract"` implements the whole contract: every
 *    state is rendered and every clause, check and density row is evaluated
 *    on its markup. Its .rs is evaluated the same way by the crate's
 *    tests/contracts_json.rs, and its .mz by `pnpm mz:check` (with the copy
 *    of the contract `pnpm contracts:sync` writes into it).
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
import { StatusBadge } from "@/components/ui/status-badge"

const ROOT = path.resolve(__dirname, "../..")
const DIR = path.join(ROOT, "contracts")
const read = (p: string) => readFileSync(path.join(DIR, p), "utf8")

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
interface Sibling {
  registry: string
  identity: "slot" | "slot+role" | "slot+variants" | "contract"
  divergences?: string[]
}
interface Contract {
  name: string
  title: string
  version: string
  node: number
  states: Record<string, { props?: Record<string, unknown>; slots?: Record<string, string> }>
  contract: string
  props: { name: string; values?: string[] }[]
  checks: Check[]
  density: { part: string; select: string; state?: string; fine: number; coarse: number }[]
  implementations: { tsx: Sibling | null; rs: Sibling | null; mz: Sibling | null }
  gaps?: string[]
}

const schema = JSON.parse(read("schema/component-contract.schema.json")) as Record<string, Json>
const index = JSON.parse(read("index.json")) as {
  schema: string
  contracts: {
    name: string
    title: string
    version: string
    file: string
    tsx: string | null
    rs: string | null
    mz: string | null
  }[]
}
interface Check {
  say: string
  select: string
  state?: string
  count?: number
  min?: number
  absent?: boolean
  attr?: Record<string, string | boolean>
  text?: string
}
/**
 * The contract families, one directory each: `app/` is the Dashboard
 * Standard (#404), `discover/` the Discover Standard (#413), `primitives/`
 * the registry primitives with no `@bundu/ui` standard yet (#427).
 */
const FAMILIES = { app: 31, discover: 11, primitives: 1 } as const
// Keys are `<family>/<file>`, the path under contracts/.
const files = Object.keys(FAMILIES)
  .flatMap((family) =>
    readdirSync(path.join(DIR, family))
      .filter((f) => f.endsWith(".contract.json"))
      .map((f) => `${family}/${f}`),
  )
  .sort()
const raw = Object.fromEntries(files.map((f) => [f, JSON.parse(read(f)) as Json]))
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
  test.each(Object.entries(FAMILIES))("%s/ holds its %i contracts", (family, n) => {
    expect(files.filter((f) => f.startsWith(`${family}/`))).toHaveLength(n)
  })

  test("no directory under contracts/ is a family the tests do not read", () => {
    const dirs = readdirSync(DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== "schema")
      .map((d) => d.name)
      .sort()
    expect(dirs).toEqual(Object.keys(FAMILIES).sort())
  })

  test.each(files)("%s validates against the schema", (f) => {
    const out: string[] = []
    validate(raw[f] as Json, schema, f, out)
    expect(out).toEqual([])
    expect(`${contracts[f].name}.contract.json`).toBe(f)
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
    expect(index.contracts.map((e) => e.file).sort()).toEqual(files)
    for (const e of index.contracts) {
      const c = contracts[e.file]
      expect([e.name, e.title, e.version, e.tsx, e.rs, e.mz]).toEqual([
        c.name,
        c.title,
        c.version,
        c.implementations.tsx?.registry ?? null,
        c.implementations.rs?.registry ?? null,
        c.implementations.mz?.registry ?? null,
      ])
    }
  })

  test("the README's coverage table has the right row for every contract", () => {
    // Prettier pads table cells; compare with runs of spaces collapsed.
    const readme = read("README.md").replace(/ {2,}/g, " ")
    const cell = (s: Sibling | null) => (s ? `\`${s.registry}\` (${s.identity})` : "—")
    for (const c of Object.values(contracts)) {
      const row = `| \`${c.name}\` | ${c.title} | N${c.node} | ${c.version} | ${cell(c.implementations.tsx)} | ${cell(c.implementations.rs)} | ${cell(c.implementations.mz)} |`
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
  "status-badge": StatusBadge as ComponentType<Record<string, unknown>>,
}

function registryFile(name: string, ext: "tsx" | "rs" | "mz"): string {
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

describe("Mzizi (.mz) siblings carry the contract's identity", () => {
  const withMz = Object.values(contracts).filter((c) => c.implementations.mz)
  test.each(withMz.map((c) => [c.name, c] as const))("%s", (_name, c) => {
    const sib = c.implementations.mz as Sibling
    const mz = registryFile(sib.registry, "mz")
    expect(mz).toContain(`slot = "${slotOf(c)}"`)
    if (sib.identity === "slot+variants") {
      for (const v of variantsOf(c)) expect(mz, v).toMatch(new RegExp(`^\\s+${v}\\s`, "m"))
    }
    if (sib.identity === "slot+role") expect(mz).toContain(`"${roleOf(c)}"`)
  })
})

// ─── identity "contract": the whole contract, evaluated on the .tsx ───────

/** Render a contract state of a React build: its props, and its default slot as children. */
function renderState(c: Contract, state: string): Element {
  const sib = c.implementations.tsx as Sibling
  const Comp = REACT[sib.registry]
  expect(Comp, `no renderer registered here for ${sib.registry}.tsx`).toBeDefined()
  const s = c.states[state]
  if (!s) throw new Error(`${c.name}: no state \`${state}\``)
  const children = s.slots?.default
  return rootOf(renderToStaticMarkup(createElement(Comp, { ...(s.props ?? {}) }, children)))
}

const ROOT_ATTR: Record<string, string> = {
  slot: "data-slot",
  portal: "data-portal",
  role: "role",
  label: "aria-label",
  class: "class",
}

function unquote(s: string): string {
  return s.replace(/^"|"$/g, "")
}

/** A value predicate; `undefined` is a predicate this runner cannot evaluate (a failure). */
function holds(value: string | null, pred: string): boolean | undefined {
  if (value === null) return false
  let m: RegExpExecArray | null
  if ((m = /^is ("[^"]*")$/.exec(pred))) return value === unquote(m[1])
  if ((m = /^contains ("[^"]*")$/.exec(pred))) return value.includes(unquote(m[1]))
  if (pred === "not_empty") return value.trim() !== ""
  if ((m = /^in((?: "[^"]*")+)$/.exec(pred))) {
    return [...m[1].matchAll(/"([^"]*)"/g)].some((x) => x[1] === value)
  }
  if ((m = /^uses "(--[a-z0-9-]+)"$/.exec(pred))) return value.includes(`var(${m[1]}`)
  return undefined
}

/** The height an element's classes declare, in px (`h-N`, `min-h-N`, `size-N`, `[Npx]`). */
function declaredHeight(classes: string, coarse = false): number | undefined {
  const pick = classes
    .split(/\s+/)
    .map((c) => (coarse ? c.replace(/^pointer-coarse:/, "") : c))
    .filter((c) => coarse || !c.startsWith("pointer-coarse:"))
  const hs = pick
    .map((c) => /^(?:min-h-|h-|size-)(?:\[(\d+)px\]|(\d+(?:\.\d+)?))$/.exec(c))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => (m[1] ? Number(m[1]) : Number(m[2]) * 4))
  return hs.length ? Math.max(...hs) : undefined
}

function evaluate(c: Contract, clause: string): boolean | undefined {
  let m: RegExpExecArray | null
  if ((m = /^(slot|role|label|class|portal) (.+)$/.exec(clause))) {
    return holds(renderState(c, "default").getAttribute(ROOT_ATTR[m[1]]), m[2])
  }
  if ((m = /^when ([a-z][a-z0-9_-]*) (slot|role|label|class|portal) (.+)$/.exec(clause))) {
    return holds(renderState(c, m[1]).getAttribute(ROOT_ATTR[m[2]]), m[3])
  }
  if ((m = /^when ([a-z][a-z0-9_-]*) shows ([a-z0-9]+) "([^"]*)"$/.exec(clause))) {
    const root = renderState(c, m[1])
    const els = [root, ...root.querySelectorAll(m[2])].filter((e) => e.tagName.toLowerCase() === m![2])
    return els.some((e) => (e.textContent ?? "").includes(m![3]) || (e.getAttribute("aria-label") ?? "").includes(m![3]))
  }
  if ((m = /^uses ([a-z0-9-]+)$/.exec(clause))) {
    const root = renderState(c, "default")
    return root.getAttribute("data-slot") === m[1] || root.querySelector(`[data-slot="${m[1]}"]`) !== null
  }
  if ((m = /^([a-z0-9]+) "([^"]*)" min_height (\d+)$/.exec(clause))) {
    const [, tag, text, n] = m
    const found = Object.keys(c.states).flatMap((s) => {
      const root = renderState(c, s)
      return [root, ...root.querySelectorAll(tag)].filter(
        (e) => e.tagName.toLowerCase() === tag && (e.textContent ?? "").includes(text),
      )
    })
    if (found.length === 0) return undefined
    return found.every((e) => (declaredHeight(e.getAttribute("class") ?? "") ?? 0) >= Number(n))
  }
  return undefined
}

const fullTsx = Object.values(contracts).filter((c) => c.implementations.tsx?.identity === "contract")

describe("React (.tsx) builds with identity \"contract\" keep the whole contract", () => {
  test.each(fullTsx.map((c) => [c.name, c] as const))("%s: every clause holds", (_name, c) => {
    for (const clause of clauses(c)) {
      const result = evaluate(c, clause)
      expect(result, `\`${clause}\` cannot be evaluated (RFC-0006 FM-12)`).toBeDefined()
      expect(result, `\`${clause}\` fails`).toBe(true)
    }
  })

  test.each(fullTsx.map((c) => [c.name, c] as const))("%s: every check holds", (_name, c) => {
    for (const check of c.checks) {
      const states = check.state === "*" ? Object.keys(c.states) : [check.state ?? "default"]
      for (const s of states) {
        const root = renderState(c, s)
        const doc = root.ownerDocument.createElement("div")
        doc.appendChild(root.cloneNode(true))
        const hits = [...doc.querySelectorAll(check.select)]
        const say = `${check.say} [${s}]`
        if (check.count !== undefined) expect(hits.length, say).toBe(check.count)
        if (check.min !== undefined) expect(hits.length, say).toBeGreaterThanOrEqual(check.min)
        if (check.absent) expect(hits.length, say).toBe(0)
        if (check.attr) {
          expect(hits.length, say).toBeGreaterThan(0)
          for (const e of hits) {
            for (const [k, v] of Object.entries(check.attr)) {
              if (v === true) expect(e.hasAttribute(k), say).toBe(true)
              else if (v === false) expect(e.hasAttribute(k), say).toBe(false)
              else expect(e.getAttribute(k), say).toBe(v)
            }
          }
        }
        if (check.text !== undefined) {
          expect(hits.length, say).toBeGreaterThan(0)
          for (const e of hits) expect(e.textContent ?? "", say).toContain(check.text)
        }
      }
    }
  })

  test.each(fullTsx.map((c) => [c.name, c] as const))("%s: every density row holds", (_name, c) => {
    for (const row of c.density) {
      const root = renderState(c, row.state ?? "default")
      const doc = root.ownerDocument.createElement("div")
      doc.appendChild(root.cloneNode(true))
      const el = doc.querySelector(row.select)
      expect(el, `density ${row.part} selects nothing`).not.toBeNull()
      const classes = el!.getAttribute("class") ?? ""
      const fine = declaredHeight(classes)
      expect(fine, `density ${row.part} (fine)`).toBe(row.fine)
      expect(declaredHeight(classes, true) ?? fine, `density ${row.part} (coarse)`).toBe(row.coarse)
    }
  })
})

