import { cn } from "@/lib/ui-utils";
import {
  appButtonVariants,
  appInputClasses as inputClasses,
  labelClasses,
} from "@/lib/ui-variants";

/**
 * FilterBar — search and filters as a GET form, so the filtered view is a
 * URL: linkable, bookmarkable, and working without JavaScript. Changing a
 * filter goes back to page 1. `search={false}` leaves the search field out
 * (selects only), e.g. when the page already has a search box.
 *
 * The React build of contract `app/filter-bar`, beside `app-filter-bar.astro`
 * (same markup and classes; the buttons use the shared `appButtonVariants`
 * recipe). A server component: fields are uncontrolled (`defaultValue`).
 */
interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelect {
  name: string;
  label: string;
  options: FilterOption[];
  /** Label for "no filter". */
  allLabel?: string;
}

interface FilterBarProps {
  /** Accessible name for the search field, e.g. "Search families". */
  searchLabel?: string;
  q?: string;
  /** Show the search field (default true). With false, only the selects. */
  search?: boolean;
  selects?: FilterSelect[];
  values?: Record<string, string>;
  /** Parameters to carry through (e.g. a selected row). */
  keep?: Record<string, string>;
  /** Where "Clear" goes: the page with no filters. */
  clearHref: string;
}

function FilterBar({
  searchLabel = "Search",
  q = "",
  search = true,
  selects = [],
  values = {},
  keep = {},
  clearHref,
}: FilterBarProps) {
  const active =
    (search && q !== "") || Object.values(values).some((v) => v !== "");
  return (
    <form
      method="get"
      role="search"
      className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-3"
      data-slot="filter-bar"
    >
      {Object.entries(keep).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {search && (
        <div className="grid min-w-0 grow basis-72 gap-1.5">
          <label htmlFor="filter-q" className={labelClasses}>
            {searchLabel}
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={q}
            className={inputClasses}
            autoComplete="off"
          />
        </div>
      )}
      {selects.map((s) => (
        <div key={s.name} className="grid min-w-0 grow basis-48 gap-1.5">
          <label htmlFor={`filter-${s.name}`} className={labelClasses}>
            {s.label}
          </label>
          <select
            id={`filter-${s.name}`}
            name={s.name}
            className={inputClasses}
            defaultValue={values[s.name] || undefined}
          >
            <option value="">{s.allLabel ?? "All"}</option>
            {s.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className={cn(appButtonVariants({ variant: "primary" }))}
          data-slot="button"
        >
          Apply
        </button>
        {active && (
          <a
            href={clearHref}
            className={cn(appButtonVariants({ variant: "ghost" }))}
            data-slot="button"
          >
            Clear
          </a>
        )}
      </div>
    </form>
  );
}

export { FilterBar, type FilterBarProps, type FilterOption, type FilterSelect };
