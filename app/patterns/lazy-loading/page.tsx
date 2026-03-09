import { CodeBlock } from "@/components/patterns/code-block"
import { LazyLoadingDemo } from "@/components/patterns/lazy-loading-demo"

export default function LazyLoadingPage() {
  return (
    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <a href="/patterns" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Patterns
          </a>
          <span className="mx-2 text-muted-foreground">/</span>
        </div>

        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lazy Loading
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            TikTok-style sequential mounting from mukoko-weather. Only one section
            mounts at a time through a global FIFO queue, preventing OOM crashes on
            mobile devices.
          </p>
        </div>

        {/* Install */}
        <div className="mb-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">Install from registry</h3>
          <CodeBlock code={`npx shadcn@latest add https://registry.mukoko.com/api/r/lazy-section
npx shadcn@latest add https://registry.mukoko.com/api/r/use-memory-pressure`} />
        </div>

        {/* Live demo */}
        <div className="mb-16">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            The first section loads eagerly. All subsequent sections wait in a FIFO
            queue and mount one at a time with skeleton fallbacks.
          </p>
          <LazyLoadingDemo />
        </div>

        {/* How it works */}
        <div className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">How it works</h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "FIFO Queue",
                description: "Global mount queue ensures only ONE section loads at a time. Lower priority numbers mount first.",
                mineral: "cobalt",
              },
              {
                title: "Settle Delay",
                description: "150ms between mounts on mobile (768px), 50ms on desktop. Prevents jank from simultaneous hydration.",
                mineral: "gold",
              },
              {
                title: "Memory Reclaim",
                description: "Sections unmount when scrolled 1500px past viewport. useMemoryPressure monitors JS heap usage.",
                mineral: "malachite",
              },
            ].map((item) => {
              const colors: Record<string, string> = {
                cobalt: "bg-[var(--color-cobalt)]",
                gold: "bg-[var(--color-gold)]",
                malachite: "bg-[var(--color-malachite)]",
              }
              return (
                <div key={item.title} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2">
                    <div className={`size-2.5 rounded-full ${colors[item.mineral]}`} />
                    <span className="text-sm font-semibold text-foreground">{item.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Usage */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Usage</h2>
          <CodeBlock
            filename="app/dashboard/page.tsx"
            code={`import { LazySection } from "@/components/lazy-section"
import { SectionErrorBoundary } from "@/components/section-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  return (
    <main>
      {/* First section: always eager */}
      <SectionErrorBoundary section="Current Conditions">
        <CurrentConditions />
      </SectionErrorBoundary>

      {/* Sequential loading: one at a time */}
      <LazySection
        section="Hourly Forecast"
        fallback={<Skeleton className="h-64" />}
      >
        <SectionErrorBoundary section="Hourly Forecast">
          <HourlyForecast />
        </SectionErrorBoundary>
      </LazySection>

      <LazySection
        section="Weather Chart"
        priority={1}  // mount after forecast
        fallback={<Skeleton className="h-80" />}
      >
        <SectionErrorBoundary section="Weather Chart">
          <WeatherChart />
        </SectionErrorBoundary>
      </LazySection>

      {/* Low priority — mounts last */}
      <LazySection section="Community Reports" priority={2}>
        <SectionErrorBoundary section="Community Reports">
          <CommunityReports />
        </SectionErrorBoundary>
      </LazySection>
    </main>
  )
}`} />
        </div>

        {/* Memory pressure */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Memory Pressure</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Monitor JS heap usage and react to memory pressure. Chrome-only API
            with graceful no-op fallback on other browsers.
          </p>
          <CodeBlock
            filename="hooks/use-memory-pressure.ts"
            code={`import { useMemoryPressure } from "@/hooks/use-memory-pressure"

function App() {
  const { isUnderPressure, usedMB, totalMB, usagePercent } = useMemoryPressure(85)

  if (isUnderPressure) {
    // Reduce quality, unmount heavy components
    return <LightweightDashboard />
  }

  return <FullDashboard />
}`} />
        </div>

        {/* Props table */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium text-foreground">LazySection props</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 pr-4 font-medium text-foreground">Prop</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Type</th>
                  <th className="pb-2 pr-4 font-medium text-foreground">Default</th>
                  <th className="pb-2 font-medium text-foreground">Description</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["section", "string", "—", "Section name for logging (required)"],
                  ["fallback?", "ReactNode", "pulse skeleton", "Shown while queued"],
                  ["priority?", "number", "0", "Lower = mounts first"],
                  ["unmountDistance?", "number", "1500", "Pixels past viewport to unmount"],
                  ["disabled?", "boolean", "false", "Bypass lazy loading"],
                ].map(([prop, type, def, desc]) => (
                  <tr key={prop as string} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{prop}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{type}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{def}</td>
                    <td className="py-2">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
