/**
 * Shared by the contract suites (React, Astro and the CSP rule): every
 * contract file on disk and the registry file that implements one in a given
 * language. One copy, so the suites cannot drift on how a contract or its
 * implementation is found. `render-tsx.ts` renders a React state.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"

import type { Contract } from "../../contracts/runner"

export const ROOT = path.resolve(__dirname, "../..")
export const REGISTRY = path.join(ROOT, "components/registry")
export const CONTRACTS = path.join(ROOT, "contracts")
/** The request URL every runner renders with (Astro's `Astro.url`, React's `requestUrl`). */
export const REQUEST_URL = "https://console.example/content/news"

/** A contract file with its helix node. */
export type ContractFile = Contract & { node: number }

/** Every contract file, sorted by path (contracts.test.tsx keeps index.json in step). */
export function loadContracts(): ContractFile[] {
  return readdirSync(CONTRACTS, { withFileTypes: true })
    // `lib/` holds non-visual library contracts (their own schema, held by the crates); these
    // renderers only read component contracts.
    .filter((d) => d.isDirectory() && d.name !== "schema" && d.name !== "lib")
    .flatMap((d) =>
      readdirSync(path.join(CONTRACTS, d.name))
        .filter((f) => f.endsWith(".contract.json"))
        .map((f) => `${d.name}/${f}`)
    )
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(CONTRACTS, f), "utf8")) as ContractFile)
}

/** The registry file `<name>.<ext>`, in whichever node directory holds it, or null. */
export function registryFile(name: string, ext: "astro" | "tsx" | "rs"): string | null {
  for (const node of readdirSync(REGISTRY)) {
    const p = path.join(REGISTRY, node, `${name}.${ext}`)
    if (existsSync(p)) return p
  }
  return null
}

/**
 * The registry file a contract declares as its `ext` build. Throws, naming
 * the contract and the path it looked for, when the file is missing, so a
 * declared implementation is never read as an empty source.
 */
export function declaredFile(contract: string, name: string, ext: "astro" | "tsx" | "rs"): string {
  const file = registryFile(name, ext)
  if (!file)
    throw new Error(
      `declared implementation missing: ${contract} declares ${name}.${ext}, and no components/registry/*/${name}.${ext} exists`
    )
  return file
}
