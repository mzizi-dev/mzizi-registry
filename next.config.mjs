import createMDX from "@next/mdx"

// MDX compilation (replaces Nextra). All `.mdx` files under `app/` are
// compiled by @next/mdx and routed through Next.js's file-based router.
// Rehype plugins are referenced by NAME (string tuples) rather than
// imported functions — Turbopack requires loader options to be
// serialisable for its persistent cache, and function references are
// not serialisable. Next.js resolves the strings to real plugins at
// build time from `node_modules`.
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: [
      ["rehype-slug"],
      [
        "rehype-autolink-headings",
        { behavior: "append", properties: { className: ["heading-anchor"] } },
      ],
      [
        "rehype-pretty-code",
        {
          theme: { light: "github-light", dark: "github-dark-dimmed" },
          keepBackground: false,
        },
      ],
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],

  // There is deliberately no `typescript: { ignoreBuildErrors: true }` here.
  // It stood in this file until #274 and meant `next build` — the step that
  // produces what users actually get — compiled and shipped regardless of type
  // errors. `pnpm typecheck` was the only real gate, and it is a convention
  // (pre-commit hook) plus a CI job the deploy does not depend on.
  //
  // Without the flag Next runs `tsc` itself as part of the build, over a
  // tsconfig that includes `.next/types/**` — the generated route types. CI's
  // `Type Check` job runs `pnpm typecheck` on a bare checkout, where that
  // directory does not exist yet, so those generated types are only ever
  // checked here. Do not put the flag back: it removes the last gate the
  // deploy path has of its own.

  images: {
    unoptimized: true,
  },
  transpilePackages: ["radix-ui"],

  // `outputFileTracingIncludes` stood here, naming `components/registry/**` for
  // six routes. It existed because `@/lib/registry-source` read those files at
  // request time with `readdir` + `readFileSync` — dynamic reads Next's static
  // trace cannot see, so without the hint the reads succeeded in `next dev` and
  // 404'd in a Vercel lambda.
  //
  // Nothing reads them at request time any more. The source is inlined into
  // `lib/registry-source.generated.json` at build time, and every remaining
  // `components/registry/...` reference is a static import the bundler resolves.
  // The hint now describes a mechanism this app no longer has, which is the
  // reason to delete it: a comment asserting request-time filesystem reads is
  // how the next person concludes the Vercel coupling is still real.
  //
  // It buys no size back, and that was checked rather than assumed. All 609
  // files are still traced into `.open-next/server-functions/default/` without
  // it — Next reaches them through the static imports — and the Worker upload
  // is unchanged at ~6.9 MB gzipped either way. This is a correctness cleanup,
  // not an optimisation.

  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
    },
  },
  async headers() {
    return [
      // ── Security headers (all routes) ───────────────────────────────
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer policy — send origin only on cross-origin requests
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS — 2 years, include subdomains, preload-eligible
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // DNS prefetch control
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },

      // ── CORS for all API v1 routes ───────────────────────────────────
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },

      // ── CORS for MCP endpoint ────────────────────────────────────────
      {
        source: "/mcp",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, DELETE, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, MCP-Protocol-Version, MCP-Session-Id",
          },
        ],
      },

      // ── Cache static registry JSON ───────────────────────────────────
      {
        source: "/r/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600",
          },
        ],
      },

      // ── Cache llms.txt and robots.txt for crawlers ───────────────────
      {
        source: "/(llms.txt|robots.txt|sitemap.xml)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" }],
      },
    ]
  },

  // ── Permanent redirects ──────────────────────────────────────────────
  //
  // `/design/*` → `/tokens`. Issue #48 consolidated the old /design route
  // group (Tokens and Icons) into a `/foundations` group, but no
  // `/foundations` page was ever built — so all three redirects landed on
  // a 404, which is worse than the original URL. `/tokens` is the
  // foundations surface that actually exists, so they point there.
  //
  // `/architecture/layers/:n` → `/architecture/nodes/:n`. The unit did not
  // change, its name did: what the axis era called layer N is node N on
  // the DNA double helix (§6.2). A redirect — not a 410 — because the
  // destination genuinely holds the same content, and existing inbound
  // links and crawler history should land on it rather than dead-end.
  // The node itself may not exist; `/architecture/nodes/[n]` decides that
  // by asking the collection, never a capped range.
  async redirects() {
    return [
      { source: "/design", destination: "/tokens", permanent: true },
      { source: "/design/tokens", destination: "/tokens", permanent: true },
      { source: "/design/icons", destination: "/tokens", permanent: true },
      {
        source: "/architecture/layers/:n",
        destination: "/architecture/nodes/:n",
        permanent: true,
      },
    ]
  },
}

export default withMDX(nextConfig)
