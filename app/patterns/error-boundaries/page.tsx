import { CodeBlock } from "@/components/patterns/code-block"
import { ErrorBoundaryDemo } from "@/components/patterns/error-boundary-demo"

export default function ErrorBoundariesPage() {
  return (
    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <a
            href="/patterns"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Patterns
          </a>
          <span className="mx-2 text-muted-foreground">/</span>
        </div>

        <div className="mb-12">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Error Boundaries
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Three layers of error isolation prevent cascading failures. A
            crashing chart never takes down the whole page. This is mandatory in
            every Mukoko app.
          </p>
        </div>

        {/* Layer overview */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              layer: "Component",
              file: "components/error-boundary.tsx",
              description:
                "Wraps individual component previews. Shows a minimal fallback if a single component fails to render.",
              mineral: "malachite",
            },
            {
              layer: "Section",
              file: "components/section-error-boundary.tsx",
              description:
                "Wraps page sections (Layer 4). Shows section name, retry button, and logs to observability. Other sections continue working.",
              mineral: "cobalt",
            },
            {
              layer: "Route / Global",
              file: "app/error.tsx + app/global-error.tsx",
              description:
                "Last-resort boundaries. Route-level catches page errors with reset. Global catches the entire app with hardcoded styles.",
              mineral: "gold",
            },
          ].map((item) => {
            const colors: Record<string, string> = {
              malachite: "bg-[var(--color-malachite)]",
              cobalt: "bg-[var(--color-cobalt)]",
              gold: "bg-[var(--color-gold)]",
            }
            return (
              <div
                key={item.layer}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 rounded-full ${colors[item.mineral]}`}
                  />
                  <span className="text-sm font-semibold text-foreground">
                    {item.layer}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {item.file}
                </span>
              </div>
            )
          })}
        </div>

        {/* Live demo */}
        <div className="mb-16">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Click each button to trigger an error in different components. Watch
            how the error is contained to just that boundary — everything else
            continues working.
          </p>
          <ErrorBoundaryDemo />
        </div>

        {/* Component ErrorBoundary */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            1. Component ErrorBoundary
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The simplest boundary. Wraps individual components (like preview
            cards) and shows a minimal fallback. No retry — the component is
            simply replaced with a &quot;failed to render&quot; message.
          </p>
          <CodeBlock
            filename="components/error-boundary.tsx"
            code={`import { ErrorBoundary } from "@/components/error-boundary"

// In a component showcase or preview
<ErrorBoundary
  fallback={<p className="text-xs text-muted-foreground">Preview unavailable</p>}
>
  <ChartPreview />
</ErrorBoundary>`}
          />
        </div>

        {/* SectionErrorBoundary */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            2. SectionErrorBoundary
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            The workhorse boundary for the 5-layer architecture. Every page
            section gets one. Shows the section name, a retry button, and logs
            errors via the observability system. Supports custom fallback UI and
            an onError callback for external reporting.
          </p>
          <CodeBlock
            filename="components/section-error-boundary.tsx"
            code={`import { SectionErrorBoundary } from "@/components/section-error-boundary"

<main className="flex flex-col gap-6">
  <SectionErrorBoundary section="Weather Overview">
    <WeatherOverview />
  </SectionErrorBoundary>

  <SectionErrorBoundary section="Activity Feed">
    <ActivityFeed />
  </SectionErrorBoundary>

  <SectionErrorBoundary
    section="Analytics"
    onError={(error, section) => {
      // Report to external service
      reportError(error, { section })
    }}
  >
    <AnalyticsChart />
  </SectionErrorBoundary>
</main>`}
          />
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Props
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium text-foreground">Prop</th>
                    <th className="pb-2 pr-4 font-medium text-foreground">Type</th>
                    <th className="pb-2 font-medium text-foreground">Description</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-mono text-xs">section</td>
                    <td className="py-2 pr-4 font-mono text-xs">string</td>
                    <td className="py-2">Section name for logging and fallback display</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-mono text-xs">fallback?</td>
                    <td className="py-2 pr-4 font-mono text-xs">ReactNode</td>
                    <td className="py-2">Custom fallback UI (default: card with retry)</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-mono text-xs">onError?</td>
                    <td className="py-2 pr-4 font-mono text-xs">{`(error, section) => void`}</td>
                    <td className="py-2">Callback for external error reporting</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">className?</td>
                    <td className="py-2 pr-4 font-mono text-xs">string</td>
                    <td className="py-2">Additional styles for the fallback container</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Route + Global */}
        <div className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            3. Route + Global Error Boundaries
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Next.js provides these automatically. The route-level boundary
            (error.tsx) catches errors within a route segment and offers a
            retry. The global boundary (global-error.tsx) is the absolute last
            resort — it wraps the entire HTML document with hardcoded colors
            since CSS custom properties may not be available.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <CodeBlock
              filename="app/error.tsx"
              code={`"use client"

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen items-center
      justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <h1>Something went wrong</h1>
        {error.digest && (
          <p className="font-mono text-xs">
            Error ID: {error.digest}
          </p>
        )}
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  )
}`}
            />
            <CodeBlock
              filename="app/global-error.tsx"
              code={`"use client"

// Hardcoded colors — CSS custom
// properties may not be available
export default function GlobalError({
  error,
  reset,
}) {
  return (
    <html lang="en">
      <body className="bg-[#0A0A0A]
        text-[#F5F5F4]">
        <div className="flex min-h-screen
          items-center justify-center">
          <h1>Something went wrong</h1>
          <button onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}`}
            />
          </div>
        </div>

        {/* Install */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Install from registry
          </h3>
          <CodeBlock
            code={`# SectionErrorBoundary (recommended for page sections)
npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/section-error-boundary

# Basic ErrorBoundary (for component previews)
npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/error-boundary`}
          />
        </div>
      </div>
    </div>
  )
}
