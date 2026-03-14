import nextra from "nextra"

const withNextra = nextra({
  // Search indexing enabled by default
  // Syntax highlighting via Shiki at build time
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ["radix-ui"],
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
    },
  },
}

export default withNextra(nextConfig)
