import Link from "next/link"
import { getAllDocumentationPages, isSupabaseConfigured } from "@/lib/db"

/**
 * Server-rendered index of DB-driven documentation pages, grouped by
 * category. Exists because Nextra's `_meta.ts` sidebar is filesystem-bound
 * and can't list slugs that only resolve through the `[slug]` dynamic
 * route. Dropping `<DbDocIndex />` into an MDX page gives those pages a
 * discoverable home.
 *
 * Safe when Supabase is unreachable: silently renders nothing rather than
 * breaking the shell.
 */
export async function DbDocIndex({
  excludeSlugs = [],
}: {
  /** Slugs to omit from the list — e.g. the slug currently rendered above. */
  excludeSlugs?: string[]
}) {
  if (!isSupabaseConfigured()) return null

  let pages
  try {
    pages = await getAllDocumentationPages()
  } catch {
    return null
  }

  const published = pages.filter((p) => p.status === "published" && !excludeSlugs.includes(p.slug))
  if (published.length === 0) return null

  // Group by category, preserving each row's sort_order within its category.
  const byCategory = new Map<string, typeof published>()
  for (const page of published) {
    const bucket = byCategory.get(page.category) ?? []
    bucket.push(page)
    byCategory.set(page.category, bucket)
  }

  const categories = Array.from(byCategory.entries()).map(([category, rows]) => ({
    category,
    // `sort_order` is nullable in the live schema; treat null as +∞ so
    // rows with an explicit order appear before unordered ones.
    rows: [...rows].sort((a, b) => (a.sort_order ?? Infinity) - (b.sort_order ?? Infinity)),
  }))

  return (
    <section className="not-prose mt-12 border-t border-border pt-10">
      <h2 className="mb-6 font-serif text-2xl font-bold tracking-tight">More in the docs</h2>
      <div className="space-y-8">
        {categories.map(({ category, rows }) => (
          <div key={category}>
            <h3 className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
              {category.replace(/-/g, " ")}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {rows.map((row) => (
                <li key={row.slug}>
                  <Link
                    href={`/docs/${row.slug}`}
                    className="group flex flex-col rounded-lg border border-border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium text-foreground group-hover:text-foreground">
                      {row.title}
                    </span>
                    {row.description && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {row.description}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
