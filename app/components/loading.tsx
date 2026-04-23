import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for `/components` — matches the gallery layout
 * (filter row + ~12 card placeholders) so the layout doesn't shift
 * when the real grid streams in.
 */
export default function ComponentsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-8">
      {/* Filter row: search input + type chips + count */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      {/* Card grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-10 rounded-md" />
            </div>
            <Skeleton className="mt-3 h-3 w-full rounded-md" />
            <Skeleton className="mt-1.5 h-3 w-3/4 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
