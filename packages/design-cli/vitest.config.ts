import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.{test,spec}.ts"],
    // The CLI runs in Node, not jsdom — no React, no DOM. Force NODE_ENV
    // so tests don't accidentally pick up production-React-only behaviour
    // if tests later import from the broader workspace.
    env: { NODE_ENV: "test" },
  },
})
