import type { MetadataRoute } from "next"

/**
 * Mzizi robots.txt.
 *
 * The site is a public design system + API intentionally optimised for AI
 * consumption. All read routes (/, /api/v1/*, /openapi, /llms.txt) are
 * allowed for every crawler, including every AI training and answer-engine
 * bot we're aware of. /mcp stays disallowed: it is now a 308 to
 * mcp.mzizi.dev/mcp, and a crawler following it lands on a POST-only JSON-RPC
 * endpoint behind an auth gate. Nothing indexable either side of the hop, so
 * the disallow keeps crawl budgets on surfaces that are.
 */
export default function robots(): MetadataRoute.Robots {
  const DISALLOW_FROM_CRAWL = ["/mcp"]

  return {
    rules: [
      // Default rule for every crawler we haven't explicitly named.
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW_FROM_CRAWL,
      },
      // Explicit allow-list for AI training, retrieval, and answer-engine
      // bots. Adding them here is a public signal that their use of this
      // site for AI training / retrieval is expected and welcomed.
      {
        userAgent: [
          // Anthropic
          "ClaudeBot",
          "Claude-Web",
          "anthropic-ai",
          // OpenAI
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          // Google
          "Googlebot",
          "Google-Extended",
          "GoogleOther",
          // Perplexity
          "PerplexityBot",
          "Perplexity-User",
          // Meta
          "FacebookBot",
          "Meta-ExternalAgent",
          "Meta-ExternalFetcher",
          // Apple
          "Applebot",
          "Applebot-Extended",
          // Other answer engines & training crawlers
          "CCBot",
          "cohere-ai",
          "Diffbot",
          "DuckAssistBot",
          "Bytespider",
          "YouBot",
          "Amazonbot",
        ],
        allow: "/",
        disallow: DISALLOW_FROM_CRAWL,
      },
    ],
    sitemap: "https://mzizi.dev/sitemap.xml",
    host: "https://mzizi.dev",
  }
}
