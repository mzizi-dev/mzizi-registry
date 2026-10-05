import {
  badgeClasses,
  statusToneClasses,
  type BadgeVariant,
  type StatusTone,
} from "@/lib/ui-variants";

/**
 * DataTable — a real <table> with a caption, column headers with scope, and
 * a card-per-row layout on narrow screens (each cell shows its column name),
 * so a phone never scrolls sideways. Filtering and paging happen on the
 * server (`@/lib/server-table`); pair with FilterBar and Pagination.
 *
 * Cells are plain data, not markup, so a section cannot inject HTML:
 * a string, or { text, href, badge, tone, mono, sub }. `tone` renders a
 * status pill in a fixed status colour; `badge` is the registry badge's
 * variants.
 *
 * The React build of contract `app/data-table`, beside `app-data-table.astro`
 * (same markup and classes; a badge cell uses the shared `badgeClasses`
 * recipe and a tone cell `statusToneClasses`). A server component.
 */
interface CellObject {
  text: string;
  href?: string;
  badge?: BadgeVariant;
  /** A status pill: neutral, success, warning, info, accent or premium. */
  tone?: StatusTone;
  mono?: boolean;
  sub?: string;
  current?: boolean;
}

type Cell = string | number | null | undefined | CellObject;

interface Column {
  key: string;
  label: string;
  align?: "start" | "end";
  /** Hidden visually on narrow screens' card view (still in the table). */
  primary?: boolean;
}

interface DataTableProps {
  caption: string;
  /** Show the caption to sighted readers too (default: screen readers only). */
  showCaption?: boolean;
  columns: Column[];
  rows: Record<string, Cell>[];
  /** Key in each row that identifies it, for data-row. */
  rowKey?: string;
}

const asObject = (cell: Cell): CellObject | null => {
  if (cell === null || cell === undefined || cell === "") return null;
  if (typeof cell === "object") return cell;
  return { text: String(cell) };
};

function CellContent({ cell }: { cell: CellObject | null }) {
  if (cell === null) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden="true">—</span>
        <span className="sr-only">none</span>
      </span>
    );
  }
  if (cell.tone) {
    return (
      <span
        data-slot="status"
        data-tone={cell.tone}
        className={statusToneClasses(cell.tone)}
      >
        {cell.text}
      </span>
    );
  }
  if (cell.badge) {
    return (
      <span
        data-slot="badge"
        data-variant={cell.badge}
        className={badgeClasses(cell.badge)}
      >
        {cell.text}
      </span>
    );
  }
  if (cell.href) {
    return (
      <a
        href={cell.href}
        className="font-medium text-primary underline-offset-4 hover:underline"
        aria-current={cell.current ? "true" : undefined}
      >
        {cell.text}
      </a>
    );
  }
  return (
    <span className={cell.mono ? "font-mono text-caption" : ""}>
      {cell.text}
    </span>
  );
}

function DataTable({
  caption,
  showCaption = false,
  columns,
  rows,
  rowKey,
}: DataTableProps) {
  return (
    <div
      className="overflow-hidden rounded-md border border-border bg-card"
      data-slot="data-table"
    >
      <table className="w-full border-collapse text-body-sm">
        <caption
          className={
            showCaption
              ? "px-3 py-2 text-start text-caption text-muted-foreground"
              : "sr-only"
          }
        >
          {caption}
        </caption>
        <thead className="hidden border-b border-border bg-surface-muted md:table-header-group">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`h-9 px-3 text-caption font-medium text-muted-foreground ${c.align === "end" ? "text-end" : "text-start"}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, r) => {
            const id = rowKey
              ? String((asObject(row[rowKey]) ?? { text: "" }).text)
              : undefined;
            const current = columns.some((c) => asObject(row[c.key])?.current);
            return (
              <tr
                key={id ?? r}
                data-row={id}
                aria-current={current ? "true" : undefined}
                className={`block px-3 py-2.5 hover:bg-surface-muted md:table-row md:p-0 ${current ? "bg-muted" : ""}`}
              >
                {columns.map((c, i) => {
                  const cell = asObject(row[c.key]);
                  const Tag = i === 0 ? "th" : "td";
                  return (
                    <Tag
                      key={c.key}
                      scope={i === 0 ? "row" : undefined}
                      className={`flex items-baseline justify-between gap-4 py-1 font-normal md:table-cell md:h-10 md:px-3 md:py-2 md:align-middle ${c.align === "end" ? "md:text-end" : "text-start"}`}
                    >
                      <span
                        className="text-caption text-muted-foreground md:hidden"
                        aria-hidden="true"
                      >
                        {c.label}
                      </span>
                      <span className="min-w-0 text-end md:text-start">
                        <CellContent cell={cell} />
                        {cell?.sub && (
                          <span className="block text-caption text-muted-foreground">
                            {cell.sub}
                          </span>
                        )}
                      </span>
                    </Tag>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export {
  DataTable,
  type BadgeVariant,
  type Cell,
  type CellObject,
  type Column,
  type DataTableProps,
  type StatusTone,
};
