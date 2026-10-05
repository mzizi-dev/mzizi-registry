/**
 * Vitest for the registry's Astro implementations (`components/registry/**\/*.astro`).
 *
 * Astro's `getViteConfig` compiles `.astro` files, and no framework renderer is
 * registered: these components are pure Astro, so one that reached for React
 * (or any island) fails to render here.
 *
 * Registry files import each other FLAT, the way `mzizi add --target astro`
 * installs them into one directory (`./button.astro`, `./ui-utils`,
 * `./server-cookies.js`), while on disk they live under their helix node
 * (`n2-primitives/`, `n6-pages/`, …) and brand assets in `assets/`. `registryFlatImports` resolves a flat
 * specifier that is not beside its importer to the one file of that name in
 * another node directory, so the source is tested exactly as it installs.
 */
import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { getViteConfig } from "astro/config"
import type { Plugin } from "vite"

const REGISTRY = path.resolve(__dirname, "components/registry")
const NODES = readdirSync(REGISTRY).filter((d) => /^n\d+-/.test(d))

function registryFlatImports(): Plugin {
  return {
    name: "mzizi-registry-flat-imports",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !source.startsWith("./")) return null
      const from = importer.split("?")[0]
      if (!from.startsWith(REGISTRY)) return null
      if (existsSync(path.resolve(path.dirname(from), source))) return null
      // A brand asset: `./assets/<file>` is `components/registry/assets/<file>`.
      if (source.startsWith("./assets/")) return path.join(REGISTRY, source.slice(2))
      const base = source.slice(2).replace(/\.js$/, "")
      const candidates = path.extname(base) ? [base] : [`${base}.ts`, `${base}.astro`]
      for (const node of NODES) {
        for (const file of candidates) {
          const p = path.join(REGISTRY, node, file)
          if (existsSync(p)) return p
        }
      }
      return null
    },
  }
}

export default getViteConfig(
  {
    plugins: [registryFlatImports()],
    test: { include: ["__tests__/astro/**/*.test.ts"] },
  },
  { logLevel: "error" }
)
