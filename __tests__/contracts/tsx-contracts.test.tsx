/**
 * React (.tsx) implementations that keep the WHOLE contract (`identity:
 * "contract"`), evaluated exactly as the Astro build is: every named state is
 * rendered (react-dom/server), and the `contract … end` clauses, the selector
 * checks, the density table and the brand-overlay rule must all hold, with the
 * same runner (contracts/runner.ts). A clause the runner cannot evaluate fails.
 *
 * The React mapping of a contract, which every such implementation follows:
 *
 * - The component is the named export `<title>` of `<registry>.tsx`, filed
 *   under the contract's node, beside its `.astro`.
 * - Props keep the contract's names, except `class` → `className` and
 *   `for` → `htmlFor`. A `{"$url": …}` fixture arrives as a `URL`.
 * - The default slot is `children`; a named slot is a ReactNode prop of the
 *   same name in camelCase (`sidebar-footer` → `sidebarFooter`). A slot that
 *   is not passed counts as empty (Astro's `Astro.slots.has`).
 * - Where the Astro build reads the request URL (`Astro.url`), the React
 *   build takes a `requestUrl` prop (string or URL); the runner passes the
 *   same URL the Astro runner renders with.
 * - `noJs.script: "none"` means a server component: no "use client".
 */
import { readFileSync } from "node:fs"
import path from "node:path"
import type { ComponentType } from "react"
import { describe, expect, test } from "vitest"

import {
  type Rendered,
  evaluateChecks,
  evaluateClauses,
  evaluateDensity,
  evaluateTheming,
} from "../../contracts/runner"
import { loadContracts, registryFile } from "./contract-files"
import { renderTsx, wantsRequestUrl } from "./render-tsx"

const contracts = loadContracts()
const full = contracts.filter((c) => c.implementations.tsx?.identity === "contract")
const tsxPath = (name: string) => registryFile(name, "tsx")

describe("every `contract` React implementation exists", () => {
  test.each(full.map((c) => [c.name, c] as const))("%s", (_n, c) => {
    const reg = c.implementations.tsx?.registry ?? ""
    const p = tsxPath(reg)
    expect(p, `components/registry/*/${reg}.tsx`).not.toBeNull()
    expect(path.basename(path.dirname(p ?? "")).split("-")[0]).toBe(`n${c.node}`)
  })
})

describe.each(full.map((c) => [c.name, c] as const))("%s (.tsx) keeps its contract", (_n, c) => {
  const file = tsxPath(c.implementations.tsx?.registry ?? "")
  const source = file ? readFileSync(file, "utf8") : ""

  const render = async (): Promise<Rendered> => {
    const mod = (await import(/* @vite-ignore */ file ?? "")) as Record<string, unknown>
    const Comp = mod[c.title] as ComponentType<Record<string, unknown>> | undefined
    if (!Comp) throw new Error(`${file}: no export named ${c.title}`)
    const out: Rendered = {}
    for (const [name, state] of Object.entries(c.states)) {
      out[name] = renderTsx(Comp, state, wantsRequestUrl(source))
    }
    return out
  }

  test("every clause, check, density row and theming rule holds", async () => {
    const rendered = await render()
    expect(evaluateClauses(c, rendered), "clauses").toEqual([])
    expect(evaluateChecks(c, rendered), "checks").toEqual([])
    expect(evaluateDensity(c, rendered), "density").toEqual([])
    expect(evaluateTheming(c, rendered), "theming").toEqual([])
  })

  test("no-JS: a server component unless the contract allows an enhancement", () => {
    if (c.noJs.script === "none") expect(source).not.toMatch(/^["']use client["']/m)
  })
})
