import type { MetadataRoute } from "next"

const BASE = "https://mzizi.dev"
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

    // ── Components ────────────────────────────────────────────────────
    {
      url: `${BASE}/components`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.9,
    },

    // ── Playground ────────────────────────────────────────────────────
    {
      url: `${BASE}/playground`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.8,
    },

    // ── Skills + CLI — the agent-facing instruction surfaces ──────────
    {
      url: `${BASE}/skills`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/cli`,
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

    // ── Observability ─────────────────────────────────────────────────
    {
      url: `${BASE}/observability`,
      lastModified: NOW,
      changeFrequency: "weekly",
      priority: 0.6,
    },

    // ── Legal ─────────────────────────────────────────────────────────
    {
      url: `${BASE}/privacy`,
      lastModified: NOW,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: NOW,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]
}
