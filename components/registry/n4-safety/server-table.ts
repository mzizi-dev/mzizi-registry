/**
 * Server-side filtering and paging for DataTable. State lives in the URL
 * (`?q=…&page=…`), so every view is linkable, works without JavaScript,
 * and survives a reload. Pure functions; tested in table.test.ts. Re-exported by `@bundu/ui/lib/table`.
 */

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface TableQuery {
  q: string;
  page: number;
  perPage: number;
  /** Any other filter parameters, by name (e.g. a role select). */
  filters: Record<string, string>;
}

export function parseTableQuery(
  params: URLSearchParams,
  filterNames: readonly string[] = [],
): TableQuery {
  const q = (params.get("q") ?? "").trim().slice(0, 200);
  const page = clampInt(params.get("page"), 1, 1, 100_000);
  const perPage = clampInt(
    params.get("per"),
    DEFAULT_PAGE_SIZE,
    1,
    MAX_PAGE_SIZE,
  );
  const filters: Record<string, string> = {};
  for (const name of filterNames) {
    const value = (params.get(name) ?? "").trim();
    if (value) filters[name] = value.slice(0, 200);
  }
  return { q, page, perPage, filters };
}

function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Rows whose searchable text contains every word of `q` (case- and
 * accent-insensitive), and whose filter fields equal each set filter.
 */
export function filterRows<T>(
  rows: readonly T[],
  query: Pick<TableQuery, "q" | "filters">,
  searchable: (row: T) => readonly (string | null | undefined)[],
  filterValue: (row: T, name: string) => string | null | undefined = () => null,
): T[] {
  const words = fold(query.q).split(/\s+/).filter(Boolean);
  return rows.filter((row) => {
    for (const [name, value] of Object.entries(query.filters)) {
      if ((filterValue(row, name) ?? "") !== value) return false;
    }
    if (words.length === 0) return true;
    const haystack = fold(searchable(row).filter(Boolean).join(" "));
    return words.every((w) => haystack.includes(w));
  });
}

export function fold(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();
}

export interface Page<T> {
  rows: T[];
  page: number;
  pageCount: number;
  total: number;
  /** 1-based index of the first and last row shown, 0 when empty. */
  from: number;
  to: number;
}

export function paginate<T>(
  rows: readonly T[],
  page: number,
  perPage: number,
): Page<T> {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * perPage;
  const slice = rows.slice(start, start + perPage);
  return {
    rows: slice,
    page: current,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: start + slice.length,
  };
}

/** The current URL with some parameters changed (`null` removes one). */
export function withParams(
  url: URL,
  changes: Record<string, string | number | null>,
): string {
  const next = new URL(url);
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === "") next.searchParams.delete(k);
    else next.searchParams.set(k, String(v));
  }
  const search = next.searchParams.toString();
  return `${next.pathname}${search ? `?${search}` : ""}`;
}
