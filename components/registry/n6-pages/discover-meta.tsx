/**
 * DiscoverMeta — the <head> tags every Discover page carries: the title,
 * description, robots and canonical URL; Open Graph and the X card (a large
 * image when there is one); and JSON-LD.
 *
 * The React build of contract `discover/discover-meta`, beside
 * `discover-meta.astro`. It renders the same elements as a fragment: React 19
 * hoists <title>, <meta> and <link> into <head>; a static render emits them
 * in place. `jsonLd` is an object (serialised, with `<` escaped so it can
 * never close the element) or a string of JSON, written verbatim. JSON-LD is
 * data, not script.
 */
export interface DiscoverMetaProps {
  /** The whole <title>. */
  title: string
  description: string
  canonical: string
  /** og:site_name, e.g. "Mukoko Circles". */
  siteName: string
  /** An absolute URL, 1200×630. */
  image?: string
  imageAlt?: string
  type?: string
  locale?: string
  /** "index, follow" by default; pass `noindex` for search and later pages. */
  robots?: string
  noindex?: boolean
  jsonLd?: string | Record<string, unknown>
}

export function DiscoverMeta({
  title,
  description,
  canonical,
  siteName,
  image,
  imageAlt,
  type = "website",
  locale = "en_GB",
  robots,
  noindex = false,
  jsonLd,
}: DiscoverMetaProps) {
  const robotsValue = robots ?? (noindex ? "noindex, follow" : "index, follow")
  const ld =
    jsonLd === undefined
      ? undefined
      : typeof jsonLd === "string"
        ? jsonLd
        : JSON.stringify(jsonLd).replace(/</g, "\\u003c")
  return (
    <>
      <title data-slot="discover-meta">{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robotsValue} />
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={locale} />
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      {image && imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {ld !== undefined && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />}
    </>
  )
}
