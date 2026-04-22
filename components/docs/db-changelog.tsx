import { getChangelogEntries } from "@/lib/db"

/**
 * Renders the full changelog from the Supabase `changelog` table, most recent
 * first. Used by `app/docs/changelog/page.mdx` as a thin shell.
 */
export async function DbChangelog() {
  const entries = await getChangelogEntries().catch(() => [])

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        Changelog unavailable — ensure Supabase is configured and the `changelog` table is seeded.
      </p>
    )
  }

  return (
    <div className="space-y-10">
      {entries.map((entry) => (
        <section
          key={entry.version}
          className="space-y-3 border-b border-border pb-8 last:border-b-0"
        >
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-serif text-2xl font-bold tracking-tight">v{entry.version}</h2>
            <time className="font-mono text-xs text-muted-foreground">
              {new Date(entry.released_at).toISOString().slice(0, 10)}
            </time>
            {entry.is_latest && (
              <span className="rounded-full bg-[var(--color-malachite)]/10 px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--color-malachite)]">
                latest
              </span>
            )}
          </div>
          {entry.title && <h3 className="text-lg font-semibold">{entry.title}</h3>}
          {entry.description && <p className="text-muted-foreground">{entry.description}</p>}
          {entry.body && (
            <div className="text-sm leading-relaxed whitespace-pre-line text-foreground">
              {entry.body}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
