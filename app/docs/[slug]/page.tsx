import { notFound } from "next/navigation"
import { getAllDocumentationPages, getDocumentationPage, isSupabaseConfigured } from "@/lib/db"
import { DbDocPage } from "@/components/docs/db-doc-page"

/**
 * Dynamic route for DB-driven documentation pages.
 *
 * The source of truth for long-form docs is the Supabase `documentation_pages`
 * table (issue #29 / #47). Static MDX pages under `app/docs/*` still resolve
 * first (Next.js matches concrete segments before `[slug]`), so any slug that
 * also has a hand-written MDX page keeps its MDX rendering. Every other
 * published slug is served from the DB.
 */

export const revalidate = 300 // 5 minutes — balances freshness with build cost

export async function generateStaticParams() {
  if (!isSupabaseConfigured()) return []
  try {
    const pages = await getAllDocumentationPages()
    return pages.filter((p) => p.status === "published").map((p) => ({ slug: p.slug }))
  } catch {
    // Don't fail the build if Supabase is temporarily unreachable;
    // pages will render on demand via `dynamicParams: true` (default).
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getDocumentationPage(slug).catch(() => null)
  if (!page) return { title: "Not Found" }
  return {
    title: `${page.title} — nyuchi design portal`,
    description: page.description ?? undefined,
  }
}

export default async function DocsBySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getDocumentationPage(slug).catch(() => null)

  // 404 for: missing, draft, archived — only `published` is reachable.
  if (!page || page.status !== "published") {
    notFound()
  }

  return <DbDocPage slug={slug} />
}
