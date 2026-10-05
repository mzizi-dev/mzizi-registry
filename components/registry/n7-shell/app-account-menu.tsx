/**
 * AccountMenu (React) — who is signed in, the app's own account actions
 * (children: an appearance form, links), and sign-out. A <details>
 * disclosure, so it opens with keyboard and screen reader and needs no
 * script. Sign-out is a POST form, not a link, so no other page can trigger
 * it. Compact: a 24px avatar in a 32px row (44px on touch); the name shows
 * from `xl` and is the accessible name below it.
 *
 * Implements contract `app/account-menu` beside `app-account-menu.astro`,
 * with the same markup and classes.
 */
import type { ReactNode } from "react"

import { Icon } from "@/components/ui/site-icon"

interface AccountMenuProps {
  name?: string | null
  email?: string | null
  /** Where the sign-out form posts. Omit to leave sign-out to the children. */
  signOutAction?: string
  signOutLabel?: string
  children?: ReactNode
}

function AccountMenu({ name = null, email = null, signOutAction, signOutLabel = "Sign out", children }: AccountMenuProps) {
  const shown = name ?? email ?? "Your account"
  const initials =
    (name ?? email ?? "?")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  const hasChildren = children !== undefined && children !== null && children !== false && children !== ""
  return (
    <details className="group relative" data-slot="account-menu">
      <summary className="flex h-8 cursor-pointer list-none items-center gap-2 rounded-sm px-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-caption font-semibold ring-1 ring-border"
        >
          {initials}
        </span>
        <span className="hidden max-w-40 truncate text-body-sm font-medium xl:inline">{shown}</span>
        <span className="sr-only xl:hidden">{`Account menu for ${shown}`}</span>
      </summary>
      <div
        className="absolute right-0 z-40 mt-1 w-[min(18rem,calc(100vw-1rem))] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        data-slot="account-menu-panel"
      >
        <div className="px-3 py-2">
          <p className="truncate text-body-sm font-medium">{name ?? "Signed in"}</p>
          {email && <p className="truncate text-caption text-muted-foreground">{email}</p>}
        </div>
        {hasChildren && <div className="border-t border-border px-3 py-2">{children}</div>}
        {signOutAction && (
          <form method="post" action={signOutAction} className="border-t border-border p-1">
            <button
              type="submit"
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11"
            >
              <Icon name="log-out" className="h-4 w-4 text-muted-foreground" />
              {signOutLabel}
            </button>
          </form>
        )}
      </div>
    </details>
  )
}

export { AccountMenu, type AccountMenuProps }
