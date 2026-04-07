import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Disallow write/admin endpoints — read API is intentionally open
        disallow: ["/api/v1/db", "/mcp"],
      },
      {
        // Allow AI crawlers explicitly — this is a design system built for AI consumption
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "Applebot",
          "Googlebot",
          "CCBot",
          "ChatGPT-User",
          "cohere-ai",
          "PerplexityBot",
        ],
        allow: "/",
        disallow: ["/api/v1/db", "/mcp"],
      },
    ],
    sitemap: "https://design.nyuchi.com/sitemap.xml",
    host: "https://design.nyuchi.com",
  }
}
