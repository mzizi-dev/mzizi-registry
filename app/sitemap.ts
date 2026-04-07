import type { MetadataRoute } from "next"

const BASE = "https://design.nyuchi.com"
const NOW = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Root ──────────────────────────────────────────────────────────
    {
      url: BASE,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 1,
    },

    // ── Brand ─────────────────────────────────────────────────────────
    {
      url: `${BASE}/brand`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/brand/colors`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/brand/guidelines`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/brand/components`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.7,
    },

    // ── Architecture ──────────────────────────────────────────────────
    {
      url: `${BASE}/architecture`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/architecture/principles`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/architecture/data-layer`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE}/architecture/pipeline`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE}/architecture/sovereignty`,
      lastModified: NOW,
      changeFrequency: "monthly",
      priority: 0.6,
    },

    // ── Docs ──────────────────────────────────────────────────────────
    {
      url: `${BASE}/docs`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.9,
    },

    // ── API ───────────────────────────────────────────────────────────
    {
      url: `${BASE}/api-docs`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // ── Registry ──────────────────────────────────────────────────────
    {
      url: `${BASE}/registry`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]
}
