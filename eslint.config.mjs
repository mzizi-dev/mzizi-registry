import js from "@eslint/js"
import tseslint from "typescript-eslint"
import next from "@next/eslint-plugin-next"

export default tseslint.config(
  {
    // Registry component source carries `eslint-disable @next/next/no-img-element`
    // directives that are correct FOR CONSUMERS — a registry component must not
    // hard-depend on `next/image`. This repo does not adopt Next's rule set, so
    // the plugin is registered (below) only so those directives resolve instead
    // of erroring, and unused-directive reporting is off because a directive
    // aimed at a consumer's linter is not dead code here.
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "packages/*/node_modules/**",
      "packages/*/dist/**",
      "mzizi-mcp/node_modules/**",
      "mzizi-mcp/dist/**",
      "public/**",
      "scripts/**",
      "supabase/**",
      "*.config.*",
      "vitest.setup.ts",
    ],
  },
  {
    // The portal IS a Next app, and registry component source carries
    // `eslint-disable @next/next/no-img-element` directives that are correct for
    // consumers — a registry component must not hard-depend on `next/image`.
    // Without the plugin registered, ESLint errors on the directive itself
    // ("Definition for rule ... was not found") rather than honouring it.
    plugins: { "@next/next": next },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // Node CLI packages — `console` IS the UI surface, and `process` is
    // the standard environment accessor. Both are first-class Node globals
    // and should be allowed unconditionally inside CLI tooling. The shadcn
    // / commander / clack CLIs all do the same.
    files: ["packages/design-cli/**/*.{ts,tsx,js,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  }
)
