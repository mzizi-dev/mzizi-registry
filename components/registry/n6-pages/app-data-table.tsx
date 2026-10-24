import { Icon } from "@/components/ui/site-icon";
import { cn, initialsOf } from "@/lib/ui-utils";
import {
  appButtonVariants,
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
 *
 * 1.2: a `person` cell is an avatar (the image, or initials when there is
 * none) beside the name (`text`, a link with `href`) and a secondary line
 * (`sub`, an email or a role). `actions` gives rows their own actions, keyed by
 * the row's `rowKey` text: one action is a button in the row, more are a
 * <details> menu. Each action is a link or a small form (POST by default, with
 * hidden `fields`), so it works with no script; `destructive` marks one that
 * removes something (its label says what; it is drawn in the destructive
 * colour and listed last; pair it with ConfirmAction).
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
  /** A person: an avatar beside the name (`text`) and the secondary line (`sub`). */
  person?: boolean;
  /** The person's avatar URL; without one the avatar shows their initials. */
  avatar?: string | null;
}

/** One action on a row: a link (`href`) or a form (`action`, POST unless `method` says GET). */
interface RowAction {
  label: string;
  href?: string;
  action?: string;
  method?: "post" | "get";
  /** Hidden fields posted with the form (`{ id: "42" }`). */
  fields?: Record<string, string>;
  /** It removes or revokes something: drawn in the destructive colour and kept last. */
  destructive?: boolean;
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
  /** Each row's actions, keyed by its `rowKey` text. */
  actions?: Record<string, RowAction[]>;
}

const itemClasses = (destructive?: boolean) =>
  cn(
    "flex min-h-8 w-full items-center rounded-sm px-2 text-start text-body-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11",
    destructive && "text-destructive",
  );

function Hidden({ fields }: { fields?: Record<string, string> }) {
  return (
    <>
      {Object.entries(fields ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

function RowActions({ list, name }: { list: RowAction[]; name: string }) {
  const sorted = [...list].sort(
    (a, b) => Number(!!a.destructive) - Number(!!b.destructive),
  );
  if (sorted.length === 0) return null;
  if (sorted.length === 1) {
    const a = sorted[0]!;
    const cls = appButtonVariants({
      variant: a.destructive ? "destructive-outline" : "outline",
      size: "sm",
    });
    const text = (
      <>
        {a.label}
        <span className="sr-only">: {name}</span>
      </>
    );
    return a.href ? (
      <a data-slot="row-action" href={a.href} className={cls}>
        {text}
      </a>
    ) : (
      <form data-slot="row-action" method={a.method ?? "post"} action={a.action}>
        <Hidden fields={a.fields} />
        <button type="submit" className={cls}>
          {text}
        </button>
      </form>
    );
  }
  return (
    <details
      data-slot="row-actions-menu"
      className="relative inline-block text-start"
    >
      <summary className="inline-flex h-8 cursor-pointer list-none items-center justify-center gap-1.5 rounded-sm px-2.5 text-body-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-11 [&::-webkit-details-marker]:hidden">
        <Icon name="more" className="h-4 w-4 shrink-0" />
        <span className="sr-only">Actions for {name}</span>
      </summary>
      <ul
        role="list"
        aria-label={`Actions for ${name}`}
        className="absolute end-0 z-40 mt-1 grid min-w-44 gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      >
        {sorted.map((a) => (
          <li key={a.label}>
            {a.href ? (
              <a
                data-slot="row-action"
                href={a.href}
                className={itemClasses(a.destructive)}
              >
                {a.label}
              </a>
            ) : (
              <form
                data-slot="row-action"
                method={a.method ?? "post"}
                action={a.action}
              >
                <Hidden fields={a.fields} />
                <button type="submit" className={itemClasses(a.destructive)}>
                  {a.label}
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
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
  if (cell.person) {
    return (
      <span
        data-slot="person"
        className="inline-flex min-w-0 items-center gap-2.5 text-start"
      >
        {cell.avatar ? (
          <img
            src={cell.avatar}
            alt=""
            width="32"
            height="32"
            loading="lazy"
            className="size-8 shrink-0 rounded-full bg-muted object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-medium text-muted-foreground"
          >
            {initialsOf(cell.text)}
          </span>
        )}
        <span className="grid min-w-0">
          {cell.href ? (
            <a
              href={cell.href}
              className="truncate font-medium text-primary underline-offset-4 hover:underline"
              aria-current={cell.current ? "true" : undefined}
            >
              {cell.text}
            </a>
          ) : (
            <span className="truncate font-medium">{cell.text}</span>
          )}
          {cell.sub && (
            <span className="truncate text-caption text-muted-foreground">
              {cell.sub}
            </span>
          )}
        </span>
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
  actions = {},
}: DataTableProps) {
  const hasActions = Object.values(actions).some((list) => list.length > 0);
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
            {hasActions && (
              <th scope="col" className="h-9 px-3 text-end">
                <span className="sr-only">Actions</span>
              </th>
            )}
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
                        {cell?.sub && !cell.person && (
                          <span className="block text-caption text-muted-foreground">
                            {cell.sub}
                          </span>
                        )}
                      </span>
                    </Tag>
                  );
                })}
                {hasActions && (
                  <td
                    data-slot="row-actions"
                    className="flex justify-end py-1 md:table-cell md:h-10 md:px-3 md:py-2 md:text-end md:align-middle"
                  >
                    <RowActions
                      list={actions[id ?? ""] ?? []}
                      name={asObject(row[columns[0]?.key ?? ""])?.text ?? ""}
                    />
                  </td>
                )}
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
  type RowAction,
  type StatusTone,
};
