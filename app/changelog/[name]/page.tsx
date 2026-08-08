import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getComponent, getComponentVersions, isSupabaseConfigured } from "@/lib/db"

export const revalidate = 3600

const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

/**
 * A version's release date as `YYYY-MM-DD`, or null when it has none.
 *
 * This page used to render `new Date(entry.released_at).toISOString()`, and
 * `component_versions` has no `released_at` — it is a VIEW whose timestamp is
 * `created_at`. `new Date(undefined)` is an Invalid Date and `.toISOString()`
 * on one THROWS a RangeError, so the whole `<article>` failed to render and
 * `/changelog/{name}` served page chrome with no body. `ComponentVersionRow`
 * declared `released_at` (plus `id` and `changes`, equally absent), and the
 * `as unknown as ComponentVersionRow[]` cast at the query meant tsc had nothing
 * to disagree with. Correcting the type is what surfaced this.
 *
 * A null timestamp now omits the `<time>` element rather than throwing: a
 * missing date is a missing date, not a broken page.
 */
function releasedOn(value: string | null): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!COMPONENT_NAME_PATTERN.test(name)) {
    return { title: "Component not found" }
  }
  return {
    title: `Changelog: ${name} — nyuchi design portal`,
    description: `Per-version release notes for the \`${name}\` registry component, newest first.`,
  }
}

/**
 * Per-component changelog page. Documented in component-backlinks;
 * data lives in `component_versions` filtered by component_name.
 *
 * For the JSON shape, use `/api/v1/ui/{name}/versions`.
 */
export default async function ComponentChangelogPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  if (!COMPONENT_NAME_PATTERN.test(name)) notFound()

  if (!isSupabaseConfigured()) {
    return (
      <article className="mx-auto max-w-3xl py-12">
        <h1 className="font-serif text-3xl font-bold">Changelog: {name}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Supabase is not configured. Per-component history is read live from the{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">component_versions</code>{" "}
          table.
        </p>
      </article>
    )
  }

  const component = await getComponent(name).catch(() => null)
  if (!component) notFound()
  const versions = await getComponentVersions(name).catch(() => [])

  return (
    <article data-mdx className="mx-auto max-w-3xl py-8">
      <Link
        href={`/components/${component.name}`}
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Back to component
      </Link>

      <header className="mb-8">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">
          Version history
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {component.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {component.description}
        </p>
        {component.added_in_version ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Added in v{component.added_in_version}
          </p>
        ) : null}
      </header>

      {versions.length === 0 ? (
        <section className="rounded-xl border border-border bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            No per-version rows in <code className="font-mono">component_versions</code> for this
            component yet. The component is{" "}
            <span className="font-mono text-foreground">{component.name}</span>; cross-cutting
            release notes for the whole registry live in the{" "}
            <a
              className="font-medium text-foreground hover:underline"
              href="https://docs.bundu.org/mzizi/changelog"
              target="_blank"
              rel="noopener noreferrer"
            >
              Mzizi changelog
            </a>
            .
          </p>
        </section>
      ) : (
        <ol className="space-y-8">
          {versions.map((entry, index) => (
            <li
              key={`${entry.version}-${entry.version_number ?? index}`}
              className="border-b border-border pb-8 last:border-b-0 last:pb-0"
            >
              <header className="mb-3 flex flex-wrap items-baseline gap-3">
                <h2 className="font-serif text-2xl font-bold text-foreground">v{entry.version}</h2>
                {releasedOn(entry.created_at) ? (
                  <time
                    dateTime={entry.created_at ?? undefined}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    {releasedOn(entry.created_at)}
                  </time>
                ) : null}
                {entry.change_type ? (
                  <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    {entry.change_type}
                  </span>
                ) : null}
              </header>
              {(entry.comment ?? entry.description) ? (
                <p className="text-sm leading-relaxed text-foreground">
                  {entry.comment ?? entry.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No release-notes copy stored for this version.
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}
