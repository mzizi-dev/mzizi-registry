"use client"

/**
 * AppShell (React) — the signed-in frame of an app or console, laid out like
 * a product dashboard and using the whole viewport: a fixed left sidebar
 * (16.25rem; a 3.5rem icon rail when collapsed) and a main column that fills
 * the rest of the width. No centred page container.
 *
 * Sidebar, top to bottom: `workspace` (a WorkspaceSwitcher), `search` (a
 * QuickSearch), `nav` (a SideNav), and a footer with the collapse toggle and
 * `sidebarFooter`. Main column: a thin top bar (`brand` on phones, then
 * `actions`, e.g. TopBarAction, and `account`, e.g. AccountMenu), the page
 * (children) in <main id="main">, and a quiet footer (`footerLinks`,
 * `footer`). Put a CommandPalette in `overlay`.
 *
 * Below 64rem the sidebar is an off-canvas drawer (a Popover API popover
 * opened by the top bar's menu button, no script). Collapse is a real
 * checkbox; `collapsed` sets it from the server. Hydrated, the shell writes
 * the collapse choice to the `persist` cookie and lets Escape hide a
 * tooltip (WCAG 1.4.13), as the Astro build's script does; the
 * server-rendered markup already works without it.
 *
 * Implements contract `app/app-shell` beside `app-shell.astro`.
 */
import { useEffect, useRef, type ReactNode } from "react"

import { Icon } from "@/components/ui/site-icon"

interface FooterLink {
  label: string
  href: string
}

type Accent = "cobalt" | "tanzanite" | "malachite" | "gold" | "terracotta" | "sodalite" | "copper"

interface AppShellProps {
  /** Accessible name of the drawer button and the collapse toggle's noun. */
  navLabel?: string
  /** Render with the sidebar collapsed (from the app's preference cookie). */
  collapsed?: boolean
  /** Cookie the collapse choice is saved to ("collapsed" or "expanded"). */
  persist?: string
  footerLinks?: FooterLink[]
  /** Accessible name of the sidebar landmark. */
  sidebarLabel?: string
  /** A mineral whose brand fill colours primary actions and the current item's indicator. */
  accent?: Accent
  /** Prefix for the shell's ids; unique per page. */
  id?: string
  /** The page. */
  children?: ReactNode
  workspace?: ReactNode
  search?: ReactNode
  nav?: ReactNode
  sidebarFooter?: ReactNode
  brand?: ReactNode
  actions?: ReactNode
  account?: ReactNode
  footer?: ReactNode
  overlay?: ReactNode
}

const has = (node: ReactNode) => node !== undefined && node !== null && node !== false && node !== ""

const ACCENTS: Accent[] = ["cobalt", "tanzanite", "malachite", "gold", "terracotta", "sodalite", "copper"]

const CSS = `
[data-slot="app-shell"] {
  --app-sidebar-w: 16.25rem;
  min-height: 100dvh;
  background: var(--background);
  color: var(--foreground);
}
${ACCENTS.map(
  (m) => `[data-slot="app-shell"][data-accent="${m}"] {
  --app-accent: var(--color-${m}-brand);
  --app-accent-foreground: var(--color-${m}-on-brand);
}`
).join("\n")}
[data-slot="app-shell"] :is(h1, h2, h3, h4, h5, h6) {
  font-family: inherit;
}
[data-slot="app-sidebar"] {
  position: fixed;
  inset: 0 auto 0 0;
  width: min(18rem, 86vw);
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  border-right: 1px solid var(--border);
  background: var(--background);
  color: var(--foreground);
  flex-direction: column;
  overflow: hidden;
}
[data-slot="app-sidebar"]:popover-open {
  display: flex;
}
[data-slot="app-sidebar"]::backdrop {
  background: color-mix(in oklab, var(--foreground) 30%, transparent);
}
@media (min-width: 64rem) {
  [data-slot="app-shell"] {
    display: grid;
    grid-template-columns: var(--app-sidebar-w) minmax(0, 1fr);
  }
  [data-slot="app-sidebar"] {
    display: flex;
    position: sticky;
    top: 0;
    inset: 0 auto auto 0;
    width: auto;
    height: 100dvh;
    z-index: 20;
  }
  [data-slot="app-sidebar"]::backdrop {
    display: none;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) {
    --app-sidebar-w: 3.5rem;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) :is(
      [data-nav-text],
      [data-slot="nav-group-label"],
      [data-slot="nav-branch"],
      [data-ws-name],
      [data-slot="brand-wordmark"],
      [data-qs-text],
      [data-qs-kbd],
      [data-slot="workspace-switcher"] [data-icon="chevrons-up-down"]
    ) {
    display: none !important;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) [data-slot="nav-rail-link"] {
    display: flex;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) :is([data-nav-row], [data-slot="quick-search"], [data-slot="workspace-switcher"] > summary, a[data-slot="workspace-switcher"]) {
    justify-content: center;
    padding-inline: 0;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) [data-slot="nav-group"] + [data-slot="nav-group"] {
    border-top: 1px solid var(--border);
    padding-top: 0.5rem;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) [data-slot="nav-tip"] [data-tip-label] {
    display: block;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked)
    [data-slot="nav-item"]:has(> [data-nav-row]:hover, > [data-nav-row]:focus-visible)
    > [data-slot="nav-tip"] {
    display: block;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) [data-slot="sidebar-head"] {
    padding-inline: 0.25rem;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) [data-slot="sidebar-foot"] {
    justify-content: center;
  }
  [data-slot="app-shell"]:has([data-shell-collapse]:checked) [data-slot="sidebar-foot"] [data-icon="panel-left"] {
    transform: scaleX(-1);
  }
}
`

function AppShell({
  navLabel = "Navigation",
  sidebarLabel = "Sidebar",
  collapsed = false,
  persist,
  footerLinks = [],
  accent,
  id = "app",
  children,
  workspace,
  search,
  nav,
  sidebarFooter,
  brand,
  actions,
  account,
  footer,
  overlay,
}: AppShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const drawerId = `${id}-sidebar`
  const collapseId = `${id}-collapse`
  const noun = navLabel.toLowerCase()
  const hasFooter = footerLinks.length > 0 || has(footer)

  useEffect(() => {
    const shell = ref.current
    if (!shell) return
    const toggle = shell.querySelector<HTMLInputElement>("[data-shell-collapse]")
    const onChange = () => {
      if (!toggle || !persist || !/^[\w-]+$/.test(persist)) return
      const secure = window.location.protocol === "https:" ? "; Secure" : ""
      document.cookie = `${persist}=${toggle.checked ? "collapsed" : "expanded"}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shell.setAttribute("data-tips-hidden", "")
    }
    const reset = () => shell.removeAttribute("data-tips-hidden")
    toggle?.addEventListener("change", onChange)
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerover", reset)
    document.addEventListener("focusin", reset)
    return () => {
      toggle?.removeEventListener("change", onChange)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerover", reset)
      document.removeEventListener("focusin", reset)
    }
  }, [persist])

  return (
    <div ref={ref} data-slot="app-shell" data-persist={persist} data-accent={accent}>
      <style href="mzizi-app-shell" precedence="default">
        {CSS}
      </style>
      <aside id={drawerId} popover="" aria-label={sidebarLabel} data-slot="app-sidebar">
        <div className="flex items-center gap-1 px-2 pt-1.5" data-slot="sidebar-head">
          <div className="min-w-0 flex-1">{workspace}</div>
          <button
            type="button"
            popoverTarget={drawerId}
            popoverTargetAction="hide"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted lg:hidden"
            aria-label={`Close ${noun}`}
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        {has(search) && (
          <div className="px-2 pt-1 pb-2" data-slot="sidebar-search">
            {search}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-4" data-slot="sidebar-body">
          {nav}
        </div>
        <div className="hidden items-center gap-1 border-t border-border px-2 py-1.5 lg:flex" data-slot="sidebar-foot">
          <input type="checkbox" id={collapseId} data-shell-collapse defaultChecked={collapsed} className="peer sr-only" />
          <label
            htmlFor={collapseId}
            title={`Collapse ${noun}`}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
          >
            <Icon name="panel-left" className="h-4 w-4" />
            <span className="sr-only">{`Collapse ${noun}`}</span>
          </label>
          <div className="min-w-0 flex-1" data-nav-text>
            {sidebarFooter}
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col" data-slot="app-main">
        <header
          className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4 lg:px-6"
          data-slot="app-topbar"
        >
          <button
            type="button"
            popoverTarget={drawerId}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm hover:bg-muted lg:hidden"
            aria-label={`Open ${noun}`}
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="min-w-0 lg:hidden">{brand}</div>
          <div className="ml-auto flex min-w-0 items-center gap-0.5 sm:gap-1">
            {actions}
            {account}
          </div>
        </header>

        <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 focus:outline-none sm:px-6 lg:px-8 lg:py-6">
          <div className="grid min-w-0 gap-5">{children}</div>
        </main>

        {hasFooter && (
          <footer className="border-t border-border px-4 py-3 text-caption text-muted-foreground sm:px-6 lg:px-8" data-slot="app-footer">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              {footerLinks.length > 0 && (
                <ul role="list" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                  {footerLinks.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        className="inline-flex min-h-8 items-center hover:text-foreground hover:underline underline-offset-4 pointer-coarse:min-h-11"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {footer}
            </div>
          </footer>
        )}
      </div>
      {overlay}
    </div>
  )
}

export { AppShell, type AppShellProps, type FooterLink }
