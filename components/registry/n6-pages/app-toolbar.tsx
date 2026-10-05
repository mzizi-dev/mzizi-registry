import type { ReactNode } from "react";

import { Icon } from "@/components/ui/site-icon";

/**
 * Toolbar (React) — the row above a list: a full-width search box and, joined
 * to it on the right, a button group (the `filters` slot: ToolbarMenu for a
 * date range or a filter, or Buttons). The search is a GET form, so it works
 * with no script; press Enter to search. `keep` carries other parameters
 * through (the selected range, a sort). Implements contract `app/toolbar`
 * beside `app-toolbar.astro`, with the same markup. A server component.
 */
interface ToolbarProps {
  /** Accessible name of the search box, e.g. "Search agents". */
  label: string;
  /** Visible hint in the empty box; defaults to `label`. */
  placeholder?: string;
  name?: string;
  value?: string;
  action?: string | URL;
  keep?: Record<string, string>;
  id?: string;
  /** The `filters` slot. */
  filters?: ReactNode;
}

function Toolbar({
  label,
  placeholder,
  name = "q",
  value = "",
  action,
  keep = {},
  id = "toolbar",
  filters,
}: ToolbarProps) {
  const inputId = `${id}-${name}`;
  const hasFilters =
    filters !== undefined && filters !== null && filters !== false;
  return (
    <div
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-1 sm:flex-row sm:items-stretch sm:gap-0"
      data-slot="toolbar"
    >
      <form
        method="get"
        action={action === undefined ? undefined : String(action)}
        role="search"
        className="flex min-w-0 flex-1 items-center gap-2 px-2"
      >
        {Object.entries(keep).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <Icon
          name="search"
          className="h-4 w-4 shrink-0 text-muted-foreground"
        />
        <input
          id={inputId}
          name={name}
          type="search"
          defaultValue={value}
          placeholder={placeholder ?? label}
          autoComplete="off"
          className="h-8 min-w-0 flex-1 bg-transparent text-body-sm outline-none placeholder:text-muted-foreground pointer-coarse:h-11 pointer-coarse:text-body"
        />
        <button
          type="submit"
          className="sr-only focus:not-sr-only focus:rounded-sm focus:px-2 focus:text-body-sm"
        >
          Search
        </button>
      </form>
      {hasFilters && (
        <div
          className="flex flex-wrap items-center gap-1 sm:border-l sm:border-border sm:pl-1"
          data-slot="toolbar-filters"
        >
          {filters}
        </div>
      )}
    </div>
  );
}

export { Toolbar, type ToolbarProps };
