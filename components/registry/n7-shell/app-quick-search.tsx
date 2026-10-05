/**
 * QuickSearch (React) — the sidebar's search button with its ⌘K hint. It
 * opens a CommandPalette through the Popover API (`popovertarget`), so it
 * works with no script; the palette adds the ⌘K / Ctrl+K shortcut and swaps
 * the hint to "Ctrl K" off Apple platforms.
 *
 * Implements contract `app/quick-search` beside `app-quick-search.astro`,
 * with the same markup and classes.
 */
import { Icon } from "@/components/ui/site-icon"

interface QuickSearchProps {
  /** The CommandPalette's id. */
  target?: string
  label?: string
}

function QuickSearch({ target = "command-palette", label = "Quick search" }: QuickSearchProps) {
  return (
    <button
      type="button"
      popoverTarget={target}
      aria-label={label}
      aria-keyshortcuts="Meta+K Control+K"
      data-slot="quick-search"
      className="flex h-8 w-full min-w-0 items-center gap-2 rounded-sm border border-border bg-background px-2.5 text-body-sm text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11"
    >
      <Icon name="search" className="h-4 w-4 shrink-0" />
      <span data-qs-text className="min-w-0 flex-1 truncate text-start">{`${label}…`}</span>
      <kbd
        data-qs-kbd
        aria-hidden="true"
        className="hidden shrink-0 rounded-sm border border-border px-1.5 font-sans text-caption leading-4 lg:inline"
      >
        ⌘K
      </kbd>
    </button>
  )
}

export { QuickSearch, type QuickSearchProps }
