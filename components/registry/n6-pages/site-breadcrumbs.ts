/**
 * Breadcrumb helpers. The Astro `Breadcrumb` component consumes
 * `BreadcrumbItem[]`; this module derives that array from a URL
 * pathname plus a per-app label map.
 *
 * Labels: each app declares a `Record<string, string>` mapping URL
 * segments (or full paths) to display names. The deriver walks the
 * path one segment at a time, prefers a full-path hit over a
 * segment hit, and falls back to a title-cased rendering of the
 * segment itself. Segments without a humane label can be marked
 * `null` to skip the segment entirely (useful when a routing
 * segment is structural rather than user-facing, e.g. `/blog/tag/`
 * where `tag` is a routing token).
 */

export interface BreadcrumbItem {
  /** Display label. */
  name: string;
  /** Absolute URL or site-relative path. Omit on the current page
   * and the component renders it as `aria-current="page"`. */
  url?: string;
}

export type BreadcrumbLabelMap = Record<string, string | null>;

/** Title-case fallback: "k12-digital-campus" → "K12 Digital Campus".
 * Used when a segment isn't in the label map. */
function humanize(segment: string): string {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Build a breadcrumb trail from a URL pathname.
 *
 * @param pathname e.g. `Astro.url.pathname` — `/education/k12-digital-campus`
 * @param labels   per-app label map. Keys can be full paths
 *                 (`/education/k12-digital-campus`) or single
 *                 segments (`education`). Full-path keys win.
 * @param homeName the label for the root crumb. Pass the app's
 *                 short name (e.g. "Nyuchi", "Bundu", "Mukoko").
 * @param currentName optional label override for the final crumb
 *                 (e.g. an article title that isn't representable
 *                 in a static label map).
 */
export function deriveBreadcrumbs(
  pathname: string,
  labels: BreadcrumbLabelMap,
  homeName: string,
  currentName?: string,
): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const items: BreadcrumbItem[] = [{ name: homeName, url: "/" }];
  let cumulative = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    cumulative += `/${segment}`;
    const isLast = i === segments.length - 1;

    // Full-path label wins over single-segment.
    const explicit = Object.prototype.hasOwnProperty.call(labels, cumulative)
      ? labels[cumulative]
      : Object.prototype.hasOwnProperty.call(labels, segment)
        ? labels[segment]
        : undefined;

    // `null` in the label map means "skip this segment entirely"
    // (used for routing tokens like `/blog/tag/` where `tag` adds
    // no breadcrumb value).
    if (explicit === null) continue;

    const name =
      isLast && currentName ? currentName : (explicit ?? humanize(segment));

    items.push(isLast ? { name } : { name, url: cumulative });
  }

  return items;
}
