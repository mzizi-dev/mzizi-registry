import { Skeleton } from "@/components/ui/skeleton"

/**
 * Loading skeleton for `/observability`. The real page shows ~4 live
 * stat cards plus a breakdown list — this skeleton mirrors that so the
 * first paint is the right shape.
 */
export default function ObservabilityLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 py-8">
      {/* Page header */}
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 rounded-lg" />
        <Skeleton className="h-5 w-2/3 rounded-md" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-5">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>

      {/* Breakdown list */}
      <section className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-md" />
        <div className="divide-y divide-border rounded-xl border border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <Skeleton className="h-4 w-48 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
