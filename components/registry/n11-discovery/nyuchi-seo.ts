import type { Metadata } from "next"

/* ═══════════════════════════════════════════════════════════════
   NYUCHI SEO — N11 discovery (a rung)
   "If the machine can't see it, it doesn't exist."
   Server-side metadata generation for Next.js App Router.

   Was labelled "Layer 6 Page Composition": wrong twice over. The layer/axis
   model is retired in favour of the DNA double helix, and this is not a page
   composition — it implements machine visibility and composes nothing, which
   is why it moved off N6 to the N11 discovery rung.
   ═══════════════════════════════════════════════════════════════ */

interface NyuchiSEOConfig {
  title: string
  description?: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: "website" | "article" | "profile" | "product"
  twitterCard?: "summary" | "summary_large_image" | "player"
  noIndex?: boolean
  locale?: string
  alternateLocales?: string[]
  /** Schema.org structured data */
  schema?: SchemaOrgData | SchemaOrgData[]
}

interface SchemaOrgData {
  "@type": string
  [key: string]: unknown
}

const BASE_URL = "https://mukoko.com"
const SITE_NAME = "Mukoko"
const DEFAULT_OG_IMAGE = "/og-default.png"

/**
 * Generate Next.js Metadata object from NyuchiSEOConfig.
 * Use in page.tsx: export const metadata = generateMetadata({ title: "..." })
 */
export function generateMetadata(config: NyuchiSEOConfig): Metadata {
  const {
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType = "website",
    twitterCard = "summary_large_image",
    noIndex = false,
    locale = "en",
    alternateLocales = [],
  } = config
  const fullTitle = `${title} — ${SITE_NAME}`
  const image = ogImage || DEFAULT_OG_IMAGE
  const url = canonicalUrl ? `${BASE_URL}${canonicalUrl}` : undefined

  return {
    title: fullTitle,
    description,
    ...(noIndex && { robots: { index: false, follow: false } }),
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        alternateLocales.map((l) => [l, `${BASE_URL}/${l}${canonicalUrl || ""}`])
      ),
    },
    // `product` is a real og:type (ogp.me/ns/product) and commerce pages need
    // it, but Next.js's `OpenGraph` union only accepts website | article |
    // profile — so passing it straight through is a type error in every
    // consumer's app. Keep it in this component's public API, declare the
    // supported value to Next, and emit the true og:type through `other`,
    // which Next renders verbatim. Narrowing the prop instead would silently
    // downgrade every product page's metadata.
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: ogType === "product" ? "website" : ogType,
      locale,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    ...(ogType === "product" && { other: { "og:type": "product" } }),
    twitter: { card: twitterCard, title: fullTitle, description, images: [image] },
  }
}

/**
 * Generate Schema.org JSON-LD script tag content.
 * Use in layout.tsx: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateSchemaLD(schema) }} />
 */
export function generateSchemaLD(schema: SchemaOrgData | SchemaOrgData[]): string {
  const items = Array.isArray(schema) ? schema : [schema]
  const graph = items.map((item) => ({ "@context": "https://schema.org", ...item }))
  return JSON.stringify(
    graph.length === 1 ? graph[0] : { "@context": "https://schema.org", "@graph": graph }
  )
}

/** Pre-built Schema.org templates for common Mukoko content types */
export const schemaTemplates = {
  jobPosting: (job: {
    title: string
    company: string
    location: string
    description: string
    datePosted: string
    salary?: { min: number; max: number; currency: string }
  }): SchemaOrgData => ({
    "@type": "JobPosting",
    title: job.title,
    hiringOrganization: { "@type": "Organization", name: job.company },
    jobLocation: { "@type": "Place", address: job.location },
    description: job.description,
    datePosted: job.datePosted,
    ...(job.salary && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: job.salary.currency,
        value: {
          "@type": "QuantitativeValue",
          minValue: job.salary.min,
          maxValue: job.salary.max,
          unitText: "MONTH",
        },
      },
    }),
  }),
  article: (a: {
    title: string
    author: string
    datePublished: string
    image?: string
  }): SchemaOrgData => ({
    "@type": "Article",
    headline: a.title,
    author: { "@type": "Person", name: a.author },
    datePublished: a.datePublished,
    ...(a.image && { image: a.image }),
  }),
  event: (e: {
    name: string
    startDate: string
    endDate?: string
    location: string
    description?: string
  }): SchemaOrgData => ({
    "@type": "Event",
    name: e.name,
    startDate: e.startDate,
    ...(e.endDate && { endDate: e.endDate }),
    location: { "@type": "Place", name: e.location },
    ...(e.description && { description: e.description }),
  }),
  product: (p: {
    name: string
    price: number
    currency: string
    image?: string
    description?: string
  }): SchemaOrgData => ({
    "@type": "Product",
    name: p.name,
    ...(p.description && { description: p.description }),
    ...(p.image && { image: p.image }),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: p.currency,
      availability: "https://schema.org/InStock",
    },
  }),
}

export type { NyuchiSEOConfig, SchemaOrgData }
