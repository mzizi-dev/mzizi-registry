import { CodeBlock } from "@/components/patterns/code-block"
import { ArchitectureDemo } from "@/components/patterns/architecture-demo"

const layers = [
  {
    number: 1,
    title: "Shared Primitives",
    path: "components/ui/",
    mineral: "cobalt",
    description:
      "Foundational UI components from this registry — Button, Input, Card, Badge, etc. Installed via the shadcn CLI. Never import from higher layers.",
    code: `// components/ui/button.tsx
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import * as Slot from "radix-ui/internal/slot"

const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border-border bg-input/30",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export function Button({ className, variant, size, asChild, ...props }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}`,
  },
  {
    number: 2,
    title: "Domain Composites",
    path: "components/weather/, components/reports/",
    mineral: "tanzanite",
    description:
      "Feature-specific components that compose Layer 1 primitives into domain-relevant UI. A WeatherCard combines Card + Badge + Progress from the registry.",
    code: `// components/weather/forecast-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export function ForecastCard({ location, temp, condition, confidence }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{location}</CardTitle>
        <Badge variant="outline">{condition}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">{temp}°C</p>
        <Progress value={confidence} className="mt-2" />
        <span className="text-xs text-muted-foreground">
          {confidence}% confidence
        </span>
      </CardContent>
    </Card>
  )
}`,
  },
  {
    number: 3,
    title: "Page Orchestrators",
    path: "components/landing/, components/dashboard/",
    mineral: "malachite",
    description:
      "Compose Layer 2 components into full page sections. Orchestrators NEVER hardcode rendering logic — they import and arrange domain composites.",
    code: `// components/dashboard/weather-dashboard.tsx
import { ForecastCard } from "@/components/weather/forecast-card"
import { ActivityFeed } from "@/components/reports/activity-feed"
import { WeatherChart } from "@/components/charts/weather-chart"

export function WeatherDashboard({ forecasts, activities, chartData }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-4">
        {forecasts.map((f) => (
          <ForecastCard key={f.id} {...f} />
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <WeatherChart data={chartData} />
        <ActivityFeed items={activities} />
      </div>
    </div>
  )
}`,
  },
  {
    number: 4,
    title: "Error Boundaries + Loading States",
    path: "components/section-error-boundary.tsx",
    mineral: "gold",
    description:
      "Every section gets wrapped in a SectionErrorBoundary. If a chart crashes, only that section shows an error — the rest of the page continues working. This is mandatory.",
    code: `// components/dashboard/safe-dashboard.tsx
import { SectionErrorBoundary } from "@/components/section-error-boundary"
import { WeatherOverview } from "@/components/weather/overview"
import { ActivityFeed } from "@/components/reports/activity-feed"
import { WeatherChart } from "@/components/charts/weather-chart"

export function SafeDashboard({ data }) {
  return (
    <main className="flex flex-col gap-6">
      <SectionErrorBoundary section="Weather Overview">
        <WeatherOverview forecast={data.forecast} />
      </SectionErrorBoundary>

      <SectionErrorBoundary section="Activity Feed">
        <ActivityFeed items={data.activities} />
      </SectionErrorBoundary>

      <SectionErrorBoundary section="Weather Charts">
        <WeatherChart data={data.chartData} />
      </SectionErrorBoundary>
    </main>
  )
}`,
  },
  {
    number: 5,
    title: "Server Page Wrappers",
    path: "app/[route]/page.tsx",
    mineral: "terracotta",
    description:
      "Next.js App Router page.tsx files. Handle SEO metadata, data fetching, and pass props down to the orchestrator. These are React Server Components by default.",
    code: `// app/dashboard/page.tsx
import { Metadata } from "next"
import { SafeDashboard } from "@/components/dashboard/safe-dashboard"

export const metadata: Metadata = {
  title: "Dashboard — mukoko weather",
  description: "Real-time weather intelligence for your region.",
}

async function getWeatherData() {
  // Server-side data fetching
  const res = await fetch("https://api.mukoko.com/weather", {
    next: { revalidate: 900 }, // 15-minute cache
  })
  return res.json()
}

export default async function DashboardPage() {
  const data = await getWeatherData()
  return <SafeDashboard data={data} />
}`,
  },
]

const MINERAL_COLORS: Record<string, string> = {
  cobalt: "bg-[var(--color-cobalt)]",
  tanzanite: "bg-[var(--color-tanzanite)]",
  malachite: "bg-[var(--color-malachite)]",
  gold: "bg-[var(--color-gold)]",
  terracotta: "bg-[var(--color-terracotta)]",
}

const MINERAL_BORDERS: Record<string, string> = {
  cobalt: "border-[var(--color-cobalt)]/20",
  tanzanite: "border-[var(--color-tanzanite)]/20",
  malachite: "border-[var(--color-malachite)]/20",
  gold: "border-[var(--color-gold)]/20",
  terracotta: "border-[var(--color-terracotta)]/20",
}

export default function ArchitecturePage() {
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
            5-Layer Architecture
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Every Mukoko app enforces a strict 5-layer component hierarchy. Components import from the layer below, never sideways or upward. This ensures isolation, testability, and prevents cascading failures.
          </p>
        </div>

        {/* Visual diagram */}
        <div className="mb-16 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="mb-6 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Layer Hierarchy
          </h2>
          <div className="flex flex-col gap-2">
            {layers.map((layer) => (
              <div key={layer.number} className="flex items-stretch gap-3">
                <div className="flex w-8 shrink-0 items-center justify-center">
                  <span className="font-mono text-xs font-bold text-muted-foreground">
                    L{layer.number}
                  </span>
                </div>
                <div
                  className={`flex flex-1 items-center gap-3 rounded-xl border ${MINERAL_BORDERS[layer.mineral]} bg-secondary/30 px-4 py-3`}
                >
                  <div
                    className={`size-2.5 shrink-0 rounded-full ${MINERAL_COLORS[layer.mineral]}`}
                  />
                  <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {layer.title}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {layer.path}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              imports flow downward only
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>

        {/* Live demo */}
        <div className="mb-16">
          <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">
            Live demonstration
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            This live demo shows all 5 layers in action. Each section is
            wrapped in a SectionErrorBoundary — click &quot;Trigger error&quot; to see
            how one section crashes without affecting the others.
          </p>
          <ArchitectureDemo />
        </div>

        {/* Layer details */}
        <div className="flex flex-col gap-12">
          {layers.map((layer) => (
            <div key={layer.number} id={`layer-${layer.number}`}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${MINERAL_COLORS[layer.mineral]}`}
                >
                  <span className="text-sm font-bold text-white">
                    {layer.number}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {layer.title}
                </h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                {layer.description}
              </p>
              <CodeBlock code={layer.code} filename={layer.path} />
            </div>
          ))}
        </div>

        {/* Rules */}
        <div className="mt-16 rounded-2xl border border-border bg-secondary/30 p-6">
          <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Rules
          </h3>
          <ul className="flex flex-col gap-3">
            {[
              "Components import from the layer below, never sideways or upward",
              "Each component is a standalone file — independently installable via the registry",
              "Page orchestrators NEVER hardcode rendering logic — they compose imported components",
              "All colors and styles come from CSS custom properties in globals.css",
              "SectionErrorBoundary wrapping is mandatory for every page section",
              "Server components by default — add \"use client\" only when using hooks or event handlers",
            ].map((rule) => (
              <li
                key={rule}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/30" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
