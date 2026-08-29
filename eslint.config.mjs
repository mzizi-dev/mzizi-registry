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
      // OpenNext build output, and wrangler's local state. Both are
      // generated (and gitignored) — same reasoning as `.next/**` above.
      "**/.open-next/**",
      // Anchored with `**/` because a flat-config glob is relative to this
      // file: a bare `.wrangler/**` matches only the repo root and misses
      // `mzizi-api/.wrangler/`, which is where the API Worker's dev build lands.
      "**/.wrangler/**",
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
  },
  {
    // N1 substrate — this is the layer that IMPLEMENTS logging, so it cannot
    // route through it. `nyuchi-harness-prewire`'s `createScopedLogger` is the
    // `[nyuchi:<component>]` logger every other node consumes, and
    // `nyuchi-resilience` emits the structured `[nyuchi:resilience]` lifecycle
    // records (section recovered, fetch timing, fallback taken) that the
    // observability rung reads.
    //
    // `debug` and `info` are added to the allow-list rather than the rule being
    // switched off: these are deliberate severities, and rewriting a successful
    // fetch as `console.warn` to satisfy a linter would misreport it. Bare
    // `console.log` stays a warning here, as everywhere else.
    files: ["components/registry/n1-tokens/**/*.{ts,tsx}"],
    rules: {
      "no-console": ["warn", { allow: ["debug", "info", "warn", "error"] }],
    },
  }
)
