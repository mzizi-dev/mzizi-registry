import { notFound } from "next/navigation"

export const revalidate = 3600

const COMPONENT_NAME_PATTERN = /^[a-z][a-z0-9-]*$/

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!COMPONENT_NAME_PATTERN.test(name)) {
    return { title: "Component not found" }
  }
  return {
    title: `Changelog: ${name}`,
    description: `Per-version release notes for the \`${name}\` registry component, newest first.`,
  }
}

/**
 * Per-component changelog page. Documented in component-backlinks.
 *
 * Per-component history is machine-written data in Supabase
 * (`component_versions`), and the registry holds no database — the Mzizi
 * console (mzizi-dev/mzizi-console) is the only thing that talks to Supabase.
 * This page was gated on Supabase credentials the registry Worker never had, so
 * the notice below is what it has always served, and it is kept byte for byte;
 * the version-history render behind the gate is gone with the query it needed.
 */
export default async function ComponentChangelogPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  if (!COMPONENT_NAME_PATTERN.test(name)) notFound()

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
