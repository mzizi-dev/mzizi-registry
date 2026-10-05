/**
 * WorkspaceSwitcher (React) — the top of the sidebar: the product's mark and
 * name (the `mark` slot, e.g. <BrandMark wordmark />) over the current
 * workspace or organisation, with chevrons that open a list of the other
 * workspaces and a few account links. A <details> disclosure, so it works
 * with the keyboard and a screen reader and needs no script.
 *
 * With one workspace and no links there is nothing to switch to, so it
 * renders as a plain link home (`href`) with no chevrons, never as a control
 * that does nothing.
 *
 * Implements contract `app/workspace-switcher` beside
 * `app-workspace-switcher.astro`, with the same markup and classes.
 */
import type { ReactNode } from "react"

import { Icon } from "@/components/ui/site-icon"

interface Workspace {
  name: string
  href: string
  current?: boolean
  /** A second line, e.g. the plan or the region. */
  note?: string
}
interface WorkspaceLink {
  label: string
  href: string
}
interface WorkspaceSwitcherProps {
  /** The current workspace's name. */
  name: string
  /** Where the mark goes (the app's home). */
  href?: string
  workspaces?: Workspace[]
  links?: WorkspaceLink[]
  /** Accessible label of the switcher, e.g. "Switch organisation". */
  label?: string
  /** The product's mark (the `mark` slot). */
  mark?: ReactNode
}

const row =
  "flex h-14 w-full min-w-0 items-center gap-2.5 rounded-sm px-2 text-start outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
const menuItem =
  "flex min-h-8 items-center gap-2 rounded-sm px-2 py-1.5 text-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11"

function WorkspaceSwitcher({
  name,
  href = "/",
  workspaces = [],
  links = [],
  label = "Switch workspace",
  mark,
}: WorkspaceSwitcherProps) {
  const switchable = workspaces.length > 1 || links.length > 0
  const text = (
    <span className="flex min-w-0 flex-1 flex-col" data-ws-text>
      {mark}
      <span className="truncate text-caption text-muted-foreground" data-ws-name>
        {name}
      </span>
    </span>
  )
  if (!switchable) {
    return (
      <a href={href} className={row} data-slot="workspace-switcher">
        {text}
      </a>
    )
  }
  return (
    <details className="relative" data-slot="workspace-switcher">
      <summary className={`${row} cursor-pointer list-none [&::-webkit-details-marker]:hidden`} aria-label={`${label}: ${name}`}>
        {text}
        <Icon name="chevrons-up-down" className="h-4 w-4 shrink-0 text-muted-foreground" />
      </summary>
      <div
        className="absolute inset-x-0 top-full z-40 mt-1 grid gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        data-slot="workspace-menu"
      >
        {workspaces.length > 0 && (
          <ul role="list" className="grid gap-0.5" aria-label="Workspaces">
            {workspaces.map((w) => (
              <li key={w.href}>
                <a href={w.href} className={menuItem} aria-current={w.current ? "true" : undefined}>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{w.name}</span>
                    {w.note && <span className="truncate text-caption text-muted-foreground">{w.note}</span>}
                  </span>
                  {w.current && <Icon name="check" title="Current" className="h-4 w-4 shrink-0" />}
                </a>
              </li>
            ))}
          </ul>
        )}
        {links.length > 0 && (
          <ul role="list" className={`grid gap-0.5 ${workspaces.length > 0 ? "border-t border-border pt-1" : ""}`}>
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className={menuItem}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

export { WorkspaceSwitcher, type Workspace, type WorkspaceLink, type WorkspaceSwitcherProps }
