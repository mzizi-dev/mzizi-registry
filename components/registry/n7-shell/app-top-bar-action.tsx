/**
 * TopBarAction (React) — one item in AppShell's top bar ("Ask Nyuchi AI",
 * "Support"): an icon and a short label, a link when `href` is set and a
 * button otherwise. Below `sm` only the icon shows and the label becomes the
 * accessible name. 32px tall, 44px on touch.
 *
 * Implements contract `app/top-bar-action` beside `app-top-bar-action.astro`,
 * with the same markup and classes.
 */
import { Icon, type IconName } from "@/components/ui/site-icon"

interface TopBarActionProps {
  label: string
  icon?: IconName
  href?: string
  /** Open in a new tab (adds rel="noopener" and says so to screen readers). */
  external?: boolean
  /** For a button that opens a popover, e.g. a CommandPalette. */
  popovertarget?: string
  current?: boolean
}

const cls =
  "inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-sm px-2 text-body-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted pointer-coarse:h-11 pointer-coarse:min-w-11"

function TopBarAction({ label, icon, href, external = false, popovertarget, current = false }: TopBarActionProps) {
  const labelClass = icon ? "sr-only sm:not-sr-only" : ""
  if (href) {
    return (
      <a
        href={href}
        className={cls}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener" : undefined}
        aria-current={current ? "page" : undefined}
        data-slot="topbar-action"
      >
        {icon && <Icon name={icon} className="h-4 w-4 shrink-0" />}
        <span className={labelClass}>{label}</span>
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    )
  }
  return (
    <button type="button" popoverTarget={popovertarget} className={cls} data-slot="topbar-action">
      {icon && <Icon name={icon} className="h-4 w-4 shrink-0" />}
      <span className={labelClass}>{label}</span>
    </button>
  )
}

export { TopBarAction, type TopBarActionProps }
