import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"
import { existsSync, readdirSync } from "node:fs"

/**
 * `@/components/ui/*` resolves to the portal's own files first, then to the
 * registry directories — mirroring the `paths` entry in tsconfig.json, which
 * Vitest does not read. Registry source imports the path a CONSUMER installs
 * to, so it must keep working here without the source being forked.
 */
const REGISTRY_UI_ROOTS = [
  "components/registry/n2-primitives",
  "components/registry/n3-brand",
  "components/registry/n7-shell",
]

/** One alias per registry component, ahead of the `@` catch-all. */
const registryUiAliases = REGISTRY_UI_ROOTS.flatMap((root) =>
  existsSync(path.resolve(__dirname, root))
    ? readdirSync(path.resolve(__dirname, root)).map((file) => ({
        find: `@/components/ui/${file.replace(/\.[^.]+$/, "")}`,
        replacement: path.resolve(__dirname, root, file),
      }))
    : []
)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    // React's CJS files check `process.env.NODE_ENV === "development"` at
    // require-time to pick dev vs prod builds. Vitest defaults NODE_ENV to
    // "test", which falls back to React's production build — that strips
    // `React.act`, breaking @testing-library/react's `render()`. Force
    // "development" for the test runtime so the dev React build loads.
    env: { NODE_ENV: "development" },
  },
  resolve: {
    alias: [...registryUiAliases, { find: "@", replacement: path.resolve(__dirname, ".") }],
    conditions: ["development", "module", "browser", "default"],
  },
})
