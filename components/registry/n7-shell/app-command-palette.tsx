"use client"

/**
 * CommandPalette (React) — "go to anything": every navigation item, grouped,
 * in a Popover API panel, opened by QuickSearch or ⌘K / Ctrl+K.
 *
 * Progressive enhancement, in layers, as in the Astro build:
 * - Server-rendered (no script): QuickSearch opens it (`popovertarget`),
 *   Escape and a click outside close it, and every item is a plain link.
 *   With `action`, the search box is a GET form, so the app can answer `?q=`
 *   on the server (`searchNav` in `@/lib/app-nav` does the matching).
 * - Hydrated: the ⌘K / Ctrl+K shortcut, live filtering with the count
 *   announced in a polite live region, Enter to open the first match, and
 *   the arrow keys to move. The effect works on the rendered DOM, the same
 *   way the Astro build's script does, so the markup stays identical.
 *
 * Implements contract `app/command-palette` beside `app-command-palette.astro`.
 */
import { useEffect, useRef } from "react"

import { Icon } from "@/components/ui/site-icon"
import { flattenNav, type NavGroup } from "@/lib/app-nav"

interface CommandPaletteProps {
  groups: NavGroup[]
  id?: string
  /** GET target for the search box when scripts do not run (e.g. "/search"). */
  action?: string
  label?: string
  placeholder?: string
}

const CSS = `
[data-slot="command-palette"] {
  position: fixed;
  inset: 12vh auto auto 50%;
  transform: translateX(-50%);
  width: min(40rem, calc(100vw - 2rem));
  margin: 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--popover);
  color: var(--popover-foreground);
  box-shadow:
    0 24px 48px -12px color-mix(in oklab, var(--foreground) 25%, transparent),
    0 0 0 1px color-mix(in oklab, var(--foreground) 4%, transparent);
  overflow: hidden;
}
[data-slot="command-palette"]::backdrop {
  background: color-mix(in oklab, var(--foreground) 30%, transparent);
}
[data-slot="command-palette"] [hidden] {
  display: none !important;
}
`

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

/** Wire the palette's keyboard and filtering onto its rendered DOM; returns a cleanup. */
function enhance(el: HTMLElement): () => void {
  const off: Array<() => void> = []
  const on = <K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Document,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void
  ) => {
    target.addEventListener(type, fn as EventListener)
    off.push(() => target.removeEventListener(type, fn as EventListener))
  }

  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    for (const kbd of document.querySelectorAll<HTMLElement>("[data-qs-kbd]")) kbd.textContent = "Ctrl K"
  }

  on(document, "keydown", (e) => {
    if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return
    if (document.querySelector('[data-slot="command-palette"]') !== el) return
    e.preventDefault()
    if (el.matches(":popover-open")) el.hidePopover()
    else el.showPopover()
  })

  const input = el.querySelector<HTMLInputElement>('input[name="q"]')
  if (!input) return () => off.forEach((f) => f())
  const items = [...el.querySelectorAll<HTMLElement>("[data-cmdk-item]")]
  const groups = [...el.querySelectorAll<HTMLElement>("[data-cmdk-group]")]
  const empty = el.querySelector<HTMLElement>("[data-cmdk-empty]")
  const status = el.querySelector<HTMLElement>("[data-cmdk-status]")
  const links = () =>
    items
      .filter((i) => !i.hidden)
      .map((i) => i.querySelector("a"))
      .filter((a): a is HTMLAnchorElement => a !== null)
  const filter = () => {
    const words = fold(input.value).split(/\s+/).filter(Boolean)
    let shown = 0
    for (const item of items) {
      const ok = words.every((w) => fold(item.dataset.search ?? "").includes(w))
      item.hidden = !ok
      if (ok) shown += 1
    }
    for (const g of groups) g.hidden = g.querySelector("[data-cmdk-item]:not([hidden])") === null
    if (empty) empty.hidden = shown !== 0
    if (status) status.textContent = words.length === 0 ? "" : `${shown} ${shown === 1 ? "match" : "matches"}`
  }
  on(input, "input", filter)
  const form = el.querySelector<HTMLElement>("[data-cmdk-form]")
  if (form) {
    on(form, "submit", (e) => {
      const first = links()[0]
      if (first) {
        e.preventDefault()
        window.location.assign(first.href)
      }
    })
  }
  on(input, "keydown", (e) => {
    if (e.key === "Enter" && !(input.form ?? null)) {
      const first = links()[0]
      if (first) window.location.assign(first.href)
    }
  })
  on(el, "keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const list = links()
    if (list.length === 0) return
    e.preventDefault()
    const at = list.indexOf(document.activeElement as HTMLAnchorElement)
    if (e.key === "ArrowDown") (list[at + 1] ?? list[0])?.focus()
    else if (at <= 0) input.focus()
    else list[at - 1]?.focus()
  })
  on(el, "toggle", (e) => {
    if ((e as ToggleEvent).newState === "open") {
      input.value = ""
      filter()
      input.focus()
    }
  })
  return () => off.forEach((f) => f())
}

function CommandPalette({
  groups,
  id = "command-palette",
  action,
  label = "Search",
  placeholder = "Search pages and settings",
}: CommandPaletteProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => (ref.current ? enhance(ref.current) : undefined), [])

  const flat = flattenNav(groups)
  const sections = [...new Set(flat.map((i) => i.group ?? ""))].map((g) => ({
    label: g === "" ? "Go to" : g,
    items: flat.filter((i) => (i.group ?? "") === g),
  }))
  const inputId = `${id}-q`
  const box = (
    <>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <Icon name="search" className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        id={inputId}
        name="q"
        type="search"
        autoComplete="off"
        autoFocus
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
    </>
  )

  return (
    <div ref={ref} id={id} popover="" role="dialog" aria-label={label} data-slot="command-palette">
      <style href="mzizi-app-command-palette" precedence="default">
        {CSS}
      </style>
      {action ? (
        <form method="get" action={action} role="search" data-cmdk-form className="flex items-center gap-2 border-b border-border px-3">
          {box}
        </form>
      ) : (
        <div className="flex items-center gap-2 border-b border-border px-3" data-cmdk-form>
          {box}
        </div>
      )}
      <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-1" data-cmdk-list>
        {sections.map((s) => (
          <section key={s.label} data-cmdk-group aria-label={s.label}>
            <p aria-hidden="true" className="px-2 pt-2 pb-1 text-caption font-medium text-muted-foreground">
              {s.label}
            </p>
            <ul role="list" className="grid gap-0.5">
              {s.items.map((i) => (
                <li
                  key={i.href}
                  data-cmdk-item
                  data-search={[i.label, i.description ?? i.summary ?? "", i.group ?? "", ...i.trail].join(" ")}
                >
                  <a
                    href={i.href}
                    className="flex h-9 min-w-0 items-center gap-2.5 rounded-sm px-2 text-body-sm outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11"
                  >
                    {i.icon ? <Icon name={i.icon} className="h-4 w-4 shrink-0 text-muted-foreground" /> : <span className="w-4 shrink-0" />}
                    <span className="shrink-0">
                      {i.trail.length > 0 && <span className="text-muted-foreground">{`${i.trail.join(" › ")} › `}</span>}
                      {i.label}
                    </span>
                    {(i.description ?? i.summary) && (
                      <span className="ml-auto hidden min-w-0 truncate text-caption text-muted-foreground sm:block">
                        {i.description ?? i.summary}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p data-cmdk-empty hidden className="px-3 py-8 text-center text-body-sm text-muted-foreground">
          No matches. Try another word.
        </p>
      </div>
      <p data-cmdk-status className="sr-only" aria-live="polite"></p>
      <div className="hidden items-center gap-4 border-t border-border px-3 py-2 text-caption text-muted-foreground sm:flex" aria-hidden="true">
        <span>
          <kbd className="font-sans">↑</kbd>
          <kbd className="font-sans">↓</kbd> move
        </span>
        <span>
          <kbd className="font-sans">Enter</kbd> open
        </span>
        <span>
          <kbd className="font-sans">Esc</kbd> close
        </span>
      </div>
    </div>
  )
}

export { CommandPalette, type CommandPaletteProps }
