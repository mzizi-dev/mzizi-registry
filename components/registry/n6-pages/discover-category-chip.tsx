/**
 * CategoryChip — one category link in a CategoryChips row: a pill with the
 * name and, optionally, how many items it holds. A link, never a button.
 * Renders its own `<li>`; `current` may be true or the string "page".
 *
 * The React build of contract `discover/category-chip`, beside
 * `discover-category-chip.astro`: the same markup and classes.
 *
 * `linkComponent` (#543) renders the link with the app's router link (Next
 * `Link`, a React Router `Link`), as on `mzizi-place-card` (#549), so the app
 * keeps client-side navigation and prefetch. The Astro build has no router to
 * hand off to and always renders the plain `<a>`.
 */
import type * as React from "react"

/**
 * The props `linkComponent` receives: `href`, `className` and `children`, plus
 * every attribute the plain `<a>` carries (`aria-current`). The same shape as
 * `MziziPlaceCardLinkProps`.
 */
export type CategoryChipLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string
  className?: string
  children?: React.ReactNode
  [dataAttribute: `data-${string}`]: string | undefined
}

export interface CategoryChipProps {
  href: string
  label: string
  /** How many items, e.g. 12 or "1,204". Empty text hides itself. */
  count?: string | number
  /** The current category: true (or "page") sets aria-current="page". */
  current?: boolean | string
  /**
   * The component that renders the link: Next's `Link`, a React Router `Link`,
   * or any component that renders an `<a>` from `href`, `className` and
   * `children`. It receives the same attributes the plain `<a>` would have.
   * Unset, the chip renders a plain `<a>`.
   */
  linkComponent?: React.ComponentType<CategoryChipLinkProps>
}

const CHIP_CLASS =
  "group/chip inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-body-sm font-medium text-foreground no-underline transition-colors hover:border-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"

export function CategoryChip({ href, label, count, current, linkComponent }: CategoryChipProps) {
  const ariaCurrent = current === true ? "page" : current === false || current === undefined ? undefined : current
  const children = (
    <>
      {label}
      {count !== undefined && (
        <span className="text-caption text-muted-foreground empty:hidden group-aria-[current=page]/chip:text-background">
          {count}
        </span>
      )}
    </>
  )
  const Link = linkComponent
  return (
    <li data-slot="category-chip">
      {Link ? (
        <Link href={href} aria-current={ariaCurrent as "page" | undefined} className={CHIP_CLASS}>
          {children}
        </Link>
      ) : (
        <a href={href} aria-current={ariaCurrent as "page" | undefined} className={CHIP_CLASS}>
          {children}
        </a>
      )}
    </li>
  )
}
