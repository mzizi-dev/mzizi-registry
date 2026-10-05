/**
 * DiscoverBreadcrumb — the trail above an item's page on a Discover site: a
 * named <nav>, an ordered list of crumbs, the last one the current page
 * (plain text, aria-current="page"), and the same trail as `BreadcrumbList`
 * JSON-LD. Relative hrefs resolve against `origin`, else `requestUrl`'s
 * origin; the current page uses its `href`, else `requestUrl`'s path.
 * `jsonLd={false}` leaves the data out. JSON-LD is data, not script.
 *
 * The React build of contract `discover/breadcrumb`, beside
 * `discover-breadcrumb.astro`: the same markup and classes.
 */
export interface DiscoverBreadcrumbCrumb {
  label: string
  /** Where the crumb goes. The last crumb is the current page and never a link. */
  href?: string
}

export interface DiscoverBreadcrumbProps {
  crumbs: DiscoverBreadcrumbCrumb[]
  /** The nav's accessible name (default "Breadcrumb"). */
  label?: string
  /** The site's origin, e.g. "https://events.mukoko.com", for absolute JSON-LD URLs. */
  origin?: string
  /** Emit the BreadcrumbList JSON-LD (default true). */
  jsonLd?: boolean
  /** The page's URL (Astro.url in the Astro build): the fallback origin and current path. */
  requestUrl?: string | URL
}

const link =
  "inline-flex min-h-6 items-center text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground pointer-coarse:min-h-11"

export function DiscoverBreadcrumb({ crumbs, label = "Breadcrumb", origin, jsonLd = true, requestUrl }: DiscoverBreadcrumbProps) {
  if (crumbs.length === 0) return null
  const request = requestUrl === undefined ? undefined : new URL(String(requestUrl))
  const base = (origin ?? request?.origin ?? "").replace(/\/$/, "")
  const absolute = (href: string) =>
    /^https?:\/\//i.test(href) ? href : `${base}${href.startsWith("/") ? "" : "/"}${href}`
  const last = crumbs.length - 1
  const ld = jsonLd
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.label,
          ...(c.href !== undefined || i === last ? { item: absolute(c.href ?? request?.pathname ?? "/") } : {}),
        })),
      }).replace(/</g, "\\u003c")
    : undefined
  return (
    <>
      <nav aria-label={label} className="text-body-sm" data-slot="discover-breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((c, i) => (
            <li key={`${i}|${c.label}`} className="inline-flex min-w-0 items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" className="text-muted-foreground">
                  /
                </span>
              )}
              {i < last && c.href ? (
                <a className={link} href={c.href}>
                  {c.label}
                </a>
              ) : i === last ? (
                <span
                  aria-current="page"
                  className="inline-flex min-h-6 items-center font-semibold text-foreground pointer-coarse:min-h-11"
                >
                  {c.label}
                </span>
              ) : (
                <span className="text-muted-foreground">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      {ld !== undefined && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />}
    </>
  )
}
