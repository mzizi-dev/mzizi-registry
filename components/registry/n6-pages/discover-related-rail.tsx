/**
 * RelatedRail — "More like this" under one item's page on a Discover site: a
 * titled section of DiscoverCards, a scroll-snap row on phones
 * (keyboard-focusable; the page never scrolls sideways) and a grid from
 * 48rem. A named region, labelled by its heading. No items, nothing
 * rendered. Card titles sit one level under the rail's heading.
 *
 * The React build of contract `discover/related-rail`, beside
 * `discover-related-rail.astro`: the same markup and classes.
 */
import { DiscoverCard, type DiscoverCardProps } from "@/components/ui/discover-card"
import { buttonVariants } from "@/lib/ui-variants"

export type RelatedRailItem = Omit<DiscoverCardProps, "level">

export interface RelatedRailProps {
  /** The rail's heading, e.g. "More events in Harare". */
  title: string
  /** The section's id; its heading is `<id>-title`. Unique per page. */
  id: string
  /** The related items, as DiscoverCard props. */
  items: RelatedRailItem[]
  /** Heading level (default 2); the cards' titles are one level under it. */
  level?: 2 | 3
  /** Where "See all" goes; no link without it. */
  seeAllHref?: string
  seeAllLabel?: string
}

export function RelatedRail({ title, id, items, level = 2, seeAllHref, seeAllLabel = "See all" }: RelatedRailProps) {
  if (items.length === 0) return null
  const Heading = `h${level}` as "h2" | "h3"
  const titleId = `${id}-title`
  const cardLevel = (level + 1) as 3 | 4
  return (
    <section id={id} aria-labelledby={titleId} className="py-12 md:py-16" data-slot="related-rail">
      <div className="container-custom">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <Heading id={titleId} className="font-serif text-h3 text-balance">
            {title}
          </Heading>
          {seeAllHref && (
            <a href={seeAllHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
              {seeAllLabel}
            </a>
          )}
        </div>
        <ul
          aria-labelledby={titleId}
          tabIndex={0}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&>li]:w-72 [&>li]:shrink-0 [&>li]:snap-start md:grid md:snap-none md:grid-cols-2 md:overflow-visible md:pb-0 md:[&>li]:w-auto lg:grid-cols-3"
          data-slot="related-rail-list"
        >
          {items.map((item, i) => (
            <DiscoverCard key={`${i}|${item.href}`} {...item} level={cardLevel} />
          ))}
        </ul>
      </div>
    </section>
  )
}
