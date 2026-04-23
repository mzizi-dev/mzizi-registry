import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for `/components/[name]` — matches the detail page
 * (breadcrumb + title/badges + doc section + preview box + install
 * command) so the reader's eye lands in the same place once the real
 * content streams in.
 */
export default function ComponentDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-24 rounded-md" />
        <span className="text-border" aria-hidden="true">
          /
        </span>
        <Skeleton className="h-4 w-32 rounded-md" />
      </div>

      {/* Title row: name + type badge + layer badge */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
        <Skeleton className="h-5 w-2/3 rounded-md" />
      </div>

      {/* Docs section */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <Skeleton className="h-4 w-4/6 rounded-md" />
      </section>

      {/* Preview / source box */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </section>

      {/* Install command */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-28 rounded-md" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </section>
    </div>
  )
}
