/**
 * MetaList — the facts of one item on its Discover page ("When", "Where",
 * "Price", "Organiser"): a <dl> of label and value rows, each with an
 * optional decorative icon, a link (`href`) or a machine-readable time
 * (`datetime`). One column on phones; `columns` from 40rem and 64rem. An
 * empty value hides itself. No items, nothing rendered.
 *
 * The React build of contract `discover/meta-list`, beside
 * `discover-meta-list.astro`: the same markup and classes.
 */
import { Icon } from "@/components/ui/site-icon"
import type { IconName } from "@/lib/site-icons"
import { cn } from "@/lib/ui-utils"

export interface MetaListItem {
  label: string
  value: string
  /** A glyph from the design system's set; decorative. */
  icon?: IconName
  /** Links the value (a map, a profile, a source). */
  href?: string
  /** ISO 8601: the value is a <time datetime>. */
  datetime?: string
}

export interface MetaListProps {
  items: MetaListItem[]
  /** Columns from 40rem (2) and 64rem (3); 1 keeps one column. */
  columns?: 1 | 2 | 3
}

const link =
  "inline-flex min-h-6 items-center text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground pointer-coarse:min-h-11"

export function MetaList({ items, columns = 2 }: MetaListProps) {
  if (items.length === 0) return null
  const cols = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" }[columns]
  return (
    <dl className={cn("grid gap-x-8 gap-y-5", cols)} data-slot="meta-list" data-columns={columns}>
      {items.map((item, i) => {
        const value =
          item.datetime !== undefined ? <time dateTime={item.datetime}>{item.value}</time> : item.value
        return (
          <div key={`${i}|${item.label}`} className="min-w-0 has-[dd:empty]:hidden" data-slot="meta-list-item">
            <dt className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
              {item.icon !== undefined && <Icon name={item.icon} className="shrink-0 text-body-lg text-muted-foreground" />}
              {item.label}
            </dt>
            <dd className="mt-1 text-body break-words text-foreground empty:hidden">
              {item.href !== undefined ? (
                <a className={link} href={item.href}>
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
