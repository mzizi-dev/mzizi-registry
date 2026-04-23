import { Skeleton } from "@/components/ui/skeleton"

/**
 * Root-level loading state. Renders while any server component on the
 * landing page is still streaming — most commonly the DB-driven sections
 * (ResilientBySection / ExploreSection) that query Supabase.
 *
 * Shape mirrors Hero + InstallSteps to minimise layout shift.
 */
export default function RootLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16 sm:px-6">
      {/* Hero */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-40 rounded-full" />
        <Skeleton className="h-14 w-3/4 rounded-lg" />
        <Skeleton className="h-14 w-2/3 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <div className="flex flex-wrap gap-3 pt-2">
          <Skeleton className="h-12 w-36 rounded-full" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>

      {/* Install steps */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-6">
            <Skeleton className="h-6 w-32 rounded-md" />
            <Skeleton className="mt-3 h-4 w-full rounded-md" />
            <Skeleton className="mt-1.5 h-4 w-3/4 rounded-md" />
          </div>
        ))}
      </div>

      {/* Explore cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border border-border p-6">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="mt-3 h-4 w-full rounded-md" />
            <Skeleton className="mt-1.5 h-4 w-5/6 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
