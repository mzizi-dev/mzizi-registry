/// <reference types="vite/client" />
/**
 * The Astro implementations (`components/registry/n<N>-*\/<name>.astro`) against
 * their component contracts (contracts/).
 *
 * Every contract names the registry item whose `.astro` implements it
 * (`implementations.astro.registry`). This renders that file in every named
 * state through Astro's container API, with NO framework renderer registered
 * (a component that reached for React would fail here), and evaluates the
 * `contract … end` clauses, the selector checks, the density table, the
 * brand-overlay rule and the no-JS rule, with contracts/runner.ts. A clause the
 * runner cannot evaluate fails (RFC-0006 FM-12).
 *
 * Coverage runs both ways: every contract has an `.astro`, and every `.astro`
 * in the registry implements exactly one contract.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { experimental_AstroContainer as AstroContainer } from "astro/container"
import { beforeAll, describe, expect, test } from "vitest"

import {
  type Contract,
  type Rendered,
  declaredProps,
  declaredSlots,
  evaluateChecks,
  evaluateClauses,
  evaluateDensity,
  evaluateTheming,
  hydrate,
} from "../../contracts/runner"

const ROOT = path.resolve(__dirname, "../..")
const REGISTRY = path.join(ROOT, "components/registry")
const CONTRACTS = path.join(ROOT, "contracts")

/** Every contract file, read from disk (contracts.test.tsx keeps index.json in step). */
const contracts = readdirSync(CONTRACTS, { withFileTypes: true })
  // `lib/` is the non-visual library family (lib-contract.schema.json): nothing to render.
  .filter((d) => d.isDirectory() && d.name !== "schema" && d.name !== "lib")
  .flatMap((d) =>
    readdirSync(path.join(CONTRACTS, d.name))
      .filter((f) => f.endsWith(".contract.json"))
      .map((f) => `${d.name}/${f}`)
  )
  .sort()
  .map((f) => JSON.parse(readFileSync(path.join(CONTRACTS, f), "utf8")) as Contract)

/** Every `.astro` in the registry, by component name → path under components/registry/. */
const astroFiles = new Map<string, string>()
for (const node of readdirSync(REGISTRY)) {
  if (!/^n\d+-/.test(node)) continue
  for (const file of readdirSync(path.join(REGISTRY, node))) {
    if (file.endsWith(".astro")) astroFiles.set(file.slice(0, -".astro".length), `${node}/${file}`)
  }
}

const modules = import.meta.glob<{ default: unknown }>("/components/registry/*/*.astro", {
  eager: true,
})

let container: AstroContainer
beforeAll(async () => {
  container = await AstroContainer.create()
})

type Component = Parameters<AstroContainer["renderToString"]>[0]

const registryOf = (c: Contract) => c.implementations.astro?.registry ?? ""

async function renderStates(c: Contract): Promise<Rendered> {
  const rel = astroFiles.get(registryOf(c))
  const mod = rel ? modules[`/components/registry/${rel}`] : undefined
  if (!mod) throw new Error(`${c.name}: no components/registry/*/${registryOf(c)}.astro`)
  const out: Rendered = {}
  for (const [name, state] of Object.entries(c.states)) {
    const html = await container.renderToString(mod.default as Component, {
      props: hydrate(state.props),
      slots: state.slots ?? {},
      request: new Request("https://console.example/content/news"),
    })
    out[name] = html.replace(/ data-astro-source-(?:file|loc)="[^"]*"/g, "")
  }
  return out
}

/** `.astro` files that are building blocks of others, not contracted components. */
const SUPPORT = new Set(["site-cta-button"])

describe("coverage", () => {
  test("every contract names a registry .astro that exists", () => {
    const missing = contracts.filter((c) => !astroFiles.has(registryOf(c))).map((c) => c.name)
    expect(missing).toEqual([])
  })

  test("every registry .astro implements exactly one contract", () => {
    const claimed = contracts.map(registryOf)
    expect(new Set(claimed).size).toBe(claimed.length)
    const unclaimed = [...astroFiles.keys()].filter((n) => !claimed.includes(n) && !SUPPORT.has(n))
    expect(unclaimed).toEqual([])
  })

  test("every .astro is filed under its contract's node", () => {
    for (const c of contracts) {
      const rel = astroFiles.get(registryOf(c)) ?? ""
      expect(rel.split("-")[0], c.name).toBe(`n${(c as unknown as { node: number }).node}`)
    }
  })
})

describe.each(contracts.map((c) => [c.name, c] as const))("%s (.astro) keeps its contract", (_name, c) => {
  const rel = astroFiles.get(registryOf(c)) ?? ""
  const source = rel ? readFileSync(path.join(REGISTRY, rel), "utf8") : ""
  let rendered: Rendered
  beforeAll(async () => {
    rendered = await renderStates(c)
  })

  test("its props are the contract's props", () => {
    const declared = declaredProps(source)
    const named = c.props.map((p) => p.name)
    if (declared === null) expect(named).toEqual(["...attributes"])
    else expect([...declared].sort()).toEqual([...named].sort())
  })

  test("its slots are the contract's slots", () => {
    expect(declaredSlots(source)).toEqual(c.slots.map((s) => s.name).sort())
  })

  test("every clause holds", () => {
    expect(evaluateClauses(c, rendered)).toEqual([])
  })

  test("every check holds", () => {
    expect(evaluateChecks(c, rendered)).toEqual([])
  })

  test("density: fine and coarse pointer heights", () => {
    expect(evaluateDensity(c, rendered)).toEqual([])
  })

  test("brand overlay: no colour values, minerals only as status colours", () => {
    expect(evaluateTheming(c, rendered)).toEqual([])
  })

  test("no-JS: the script the contract allows, no islands, no framework", () => {
    const scripts = source.match(/<script\b(?![^>]*application\/ld\+json)/g) ?? []
    expect(scripts.length).toBe(c.noJs.script === "none" ? 0 : 1)
    for (const html of Object.values(rendered)) expect(html).not.toMatch(/<astro-island/i)
    expect(source).not.toMatch(/client:(load|idle|visible|media|only)/)
    expect(source).not.toMatch(/from\s+["'](react|react-dom|preact|svelte|vue)(\/[^"']*)?["']/)
  })
})
