/**
 * Breadcrumb — the breadcrumb trail of a marketing page: a labelled <nav>
 * with an ordered list of links, and the matching schema.org BreadcrumbList
 * JSON-LD, both from one `items` array. The last item is the current page
 * (plain text, aria-current="page"). Fewer than two items render nothing.
 *
 * The React build of contract `site/breadcrumb`, beside
 * `site-breadcrumb.astro`: the same markup and classes. Where the Astro build
 * falls back to `Astro.site` / `Astro.url`, this takes `requestUrl`.
 */
import { Fragment } from "react";

import type { BreadcrumbItem } from "@/lib/site-breadcrumbs";

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Fully-qualified origin used to expand site-relative `url`s into
   * absolute URLs in the JSON-LD payload (Google requires absolute). Falls
   * back to the origin of `requestUrl`. */
  origin?: string;
  /** The current request's URL: the JSON-LD fallback origin, and the url of
   * an item that has none. */
  requestUrl?: string | URL;
  /** Extra classes for the wrapping <nav>. */
  className?: string;
}

export function Breadcrumb({
  items,
  origin,
  requestUrl,
  className,
}: BreadcrumbProps) {
  if (items.length < 2) return null;

  const request = requestUrl ? new URL(String(requestUrl)) : null;

  const toAbsolute = (url: string): string => {
    if (/^https?:\/\//i.test(url)) return url;
    const base = origin ?? request?.origin ?? "";
    const baseTrimmed = base.replace(/\/$/, "");
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${baseTrimmed}${path}`;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      // Schema.org requires an absolute URL on every item including the
      // last; fall back to the current page URL when an item has no href.
      item: toAbsolute(item.url ?? request?.pathname ?? "/"),
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        data-slot="breadcrumb"
        className={["text-body-sm text-muted-foreground", className]
          .filter(Boolean)
          .join(" ")}
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <Fragment key={`${index}-${item.name}`}>
                <li className={isLast ? "text-foreground truncate" : undefined}>
                  {isLast || !item.url ? (
                    <span aria-current={isLast ? "page" : undefined}>
                      {item.name}
                    </span>
                  ) : (
                    <a
                      href={item.url}
                      className="hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </a>
                  )}
                </li>
                {!isLast && <li aria-hidden="true">/</li>}
              </Fragment>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
