import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for `/docs/[slug]` — DB-driven documentation pages.
 * Mirrors the article layout emitted by `DbDocPage`: category badge,
 * big serif title, optional description, then a long body.
 */
export default function DocsSlugLoading() {
  return (
    <article className="mx-auto w-full max-w-3xl py-8">
      <header className="space-y-3 border-b border-border pb-6">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-10 w-3/4 rounded-lg" />
        <Skeleton className="h-5 w-2/3 rounded-md" />
      </header>

      <div className="mt-8 space-y-3">
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 rounded-md ${i % 4 === 3 ? "w-1/2" : "w-full"}`} />
        ))}
      </div>
    </article>
  )
}
