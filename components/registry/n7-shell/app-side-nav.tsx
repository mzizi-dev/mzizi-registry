/**
 * SideNav (React) — an app's navigation, dense like a product console: quiet
 * group labels, one 32px row per item (48px on touch) with an icon and the
 * label only, a "New"-style badge, nested items under a disclosure with a
 * chevron, and the current item filled with a gold indicator. The current
 * item carries aria-current="page".
 *
 * An item's `description` is never printed in the list: it is a tooltip and
 * the link's accessible description (aria-describedby). `current` is the
 * current href; when omitted it is the longest href the request path
 * (`requestUrl`, the Astro build's `Astro.url`) is at or below. No script:
 * the disclosures are <details>. The tooltip styles are a hoisted <style>.
 *
 * Implements contract `app/side-nav` beside `app-side-nav.astro`, with the
 * same markup and classes.
 */
import { Icon } from "@/components/ui/site-icon"
import { containsHref, currentHref, type NavGroup, type NavItem } from "@/lib/app-nav"

/** 0.3 name of a flat item. */
type SideNavItem = NavItem

interface SideNavProps {
  groups?: NavGroup[]
  items?: NavItem[]
  /** Accessible name of the navigation landmark. */
  label?: string
  current?: string
  /** Prefix for the ids the tooltips need; unique per page. */
  idPrefix?: string
  id?: string
  /** The request URL (the Astro build reads `Astro.url`); finds `current` when it is omitted. */
  requestUrl?: string | URL
}

const row =
  "group/row relative flex h-8 w-full min-w-0 items-center gap-2.5 rounded-sm px-2.5 text-body-sm text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11"
const here =
  "bg-muted font-medium before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--app-accent,var(--primary))]"
const icon = "h-4 w-4 shrink-0 text-muted-foreground group-hover/row:text-foreground"
const badge = "shrink-0 rounded-sm border border-border px-1.5 text-caption leading-4 font-medium text-muted-foreground"
const tip =
  "pointer-events-none z-50 hidden w-max max-w-64 rounded-sm bg-foreground px-2.5 py-1.5 text-caption leading-snug text-background shadow-md"

const CSS = `
[data-slot="side-nav"] [data-slot="nav-tip"] {
  position: fixed;
  left: calc(var(--app-sidebar-w, 16.25rem) + 0.5rem);
  transform: translateY(calc(1rem - 50%));
}
[data-slot="side-nav"] [data-slot="nav-tip"] [data-tip-label] {
  display: none;
}
@media (min-width: 64rem) {
  [data-slot="nav-item"]:has(
      > [data-nav-row]:hover,
      > [data-nav-row]:focus-visible,
      > details > summary:hover,
      > details > summary:focus-visible
    )
    > [data-slot="nav-tip"]:not([data-empty]) {
    display: block;
  }
}
[data-tips-hidden] [data-slot="nav-tip"] {
  display: none !important;
}
[data-slot="nav-branch"] > summary [data-icon="chevron-right"] {
  transition: transform 150ms ease;
}
[data-slot="nav-branch"][open] > summary [data-icon="chevron-right"] {
  transform: rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  [data-slot="side-nav"] * {
    transition: none !important;
  }
}
`

const describe = (item: NavItem) => item.description ?? item.summary

function pathOf(url: string | URL | undefined): string {
  if (url === undefined) return "/"
  try {
    return new URL(String(url), "http://localhost").pathname
  } catch {
    return "/"
  }
}

function SideNav({ groups: given, items, label = "Sections", current: currentProp, idPrefix = "nav", id, requestUrl }: SideNavProps) {
  const groups: NavGroup[] = given ?? [{ items: items ?? [] }]
  const current = currentProp ?? currentHref(pathOf(requestUrl), groups)

  let n = 0
  const nextId = () => `${idPrefix}-tip-${++n}`

  return (
    <nav aria-label={label} id={id} data-slot="side-nav" className="grid gap-3">
      <style href="mzizi-app-side-nav" precedence="default">
        {CSS}
      </style>
      {groups.map((group, gi) => {
        const labelId = group.label ? `${idPrefix}-group-${gi}` : undefined
        return (
          <div key={gi} data-slot="nav-group" className="grid gap-0.5">
            {group.label && (
              <p id={labelId} data-slot="nav-group-label" className="px-2.5 pt-1 pb-1 text-caption font-medium text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul role="list" aria-labelledby={labelId} className="grid gap-0.5">
              {group.items.map((item, ii) => {
                const desc = describe(item)
                const tipId = nextId()
                const descId = `${tipId}-d`
                const kids = item.children ?? []
                const tooltip = (
                  <span role="tooltip" id={tipId} data-slot="nav-tip" data-empty={desc ? undefined : ""} className={tip}>
                    <span data-tip-label className="block font-medium">
                      {item.label}
                    </span>
                    {desc && <span id={descId}>{desc}</span>}
                  </span>
                )
                if (kids.length === 0) {
                  const isHere = item.href === current
                  return (
                    <li key={ii} className="relative" data-slot="nav-item">
                      {tooltip}
                      <a
                        href={item.href}
                        aria-current={isHere ? "page" : undefined}
                        aria-describedby={desc ? descId : undefined}
                        className={`${row} ${isHere ? here : ""}`}
                        data-nav-row
                      >
                        {item.icon && <Icon name={item.icon} className={icon} />}
                        <span data-nav-text className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span data-nav-text className={badge}>
                            {item.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  )
                }
                // A parent that is a page itself is listed first among its
                // children ("Overview"), so the disclosure never hides it.
                const own = item.href !== "" && !kids.some((k) => k.href === item.href)
                const branch: NavItem[] = own ? [{ href: item.href, label: item.overviewLabel ?? "Overview" }, ...kids] : kids
                const open = containsHref(item, current)
                const railHref = item.href !== "" ? item.href : (kids[0]?.href ?? "#")
                return (
                  <li key={ii} className="relative" data-slot="nav-item">
                    {tooltip}
                    <details data-slot="nav-branch" open={open}>
                      <summary
                        className={`${row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
                        aria-describedby={desc ? descId : undefined}
                        data-nav-row
                      >
                        {item.icon && <Icon name={item.icon} className={icon} />}
                        <span data-nav-text className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span data-nav-text className={badge}>
                            {item.badge}
                          </span>
                        )}
                        <Icon name="chevron-right" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </summary>
                      <ul role="list" className="mt-0.5 ml-[1.0625rem] grid gap-0.5 border-l border-border pl-2" data-slot="nav-children">
                        {branch.map((child, ci) => {
                          const childDesc = describe(child)
                          const childTip = nextId()
                          const childDescId = `${childTip}-d`
                          const childHere = child.href === current
                          return (
                            <li key={ci} className="relative" data-slot="nav-item">
                              {childDesc && (
                                <span role="tooltip" id={childTip} data-slot="nav-tip" className={tip}>
                                  <span id={childDescId}>{childDesc}</span>
                                </span>
                              )}
                              <a
                                href={child.href}
                                aria-current={childHere ? "page" : undefined}
                                aria-describedby={childDesc ? childDescId : undefined}
                                className={`${row} ${childHere ? here : ""}`}
                                data-nav-row
                              >
                                <span className="min-w-0 flex-1 truncate">{child.label}</span>
                                {child.badge && <span className={badge}>{child.badge}</span>}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </details>
                    <a
                      href={railHref}
                      data-slot="nav-rail-link"
                      aria-current={open ? "page" : undefined}
                      aria-describedby={desc ? descId : undefined}
                      className={`${row} ${open ? here : ""} hidden`}
                      data-nav-row
                    >
                      {item.icon && <Icon name={item.icon} className={icon} />}
                      <span data-nav-text className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

export { SideNav, type SideNavProps, type SideNavItem, type NavGroup, type NavItem }
