import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

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
    alias: {
      "@": path.resolve(__dirname, "."),
    },
    conditions: ["development", "module", "browser", "default"],
  },
})
