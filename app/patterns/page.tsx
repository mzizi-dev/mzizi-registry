import { Layers, Shield, Activity, Puzzle } from "lucide-react"
import { cn } from "@/lib/utils"

const patterns = [
  {
    title: "5-Layer Architecture",
    description:
      "Mandatory layered component architecture that enforces separation of concerns from primitives to server pages.",
    href: "/patterns/architecture",
    icon: Layers,
    mineral: "cobalt" as const,
    items: [
      "Shared primitives",
      "Domain composites",
      "Page orchestrators",
      "Error boundaries",
      "Server wrappers",
    ],
  },
  {
    title: "Error Boundaries",
    description:
      "Three layers of error isolation that prevent one failing section from crashing the entire page.",
    href: "/patterns/error-boundaries",
    icon: Shield,
    mineral: "malachite" as const,
    items: [
      "Component-level",
      "Section-level (new)",
      "Route-level",
      "Global fallback",
    ],
  },
  {
    title: "Observability",
    description:
      "Structured logging, performance measurement, and error tracking with the [mukoko] prefix for grep-ability.",
    href: "/patterns/observability",
    icon: Activity,
    mineral: "tanzanite" as const,
    items: [
      "Scoped loggers",
      "Performance timing",
      "Error tracking",
      "Trace IDs",
    ],
  },
  {
    title: "Component Patterns",
    description:
      "CVA variants, Radix UI primitives, cn() composition, and data attributes — the mandatory stack for every component.",
    href: "/patterns/components",
    icon: Puzzle,
    mineral: "gold" as const,
    items: [
      "CVA variant system",
      "Radix + Slot polymorphism",
      "cn() composition",
      "data-slot attributes",
    ],
  },
]

const MINERAL_STYLES: Record<string, string> = {
  cobalt: "bg-[var(--color-cobalt)]",
  tanzanite: "bg-[var(--color-tanzanite)]",
  malachite: "bg-[var(--color-malachite)]",
  gold: "bg-[var(--color-gold)]",
  terracotta: "bg-[var(--color-terracotta)]",
}

export default function PatternsPage() {
  return (
    <div className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Mandatory Patterns
          </p>
          <h1 className="font-serif text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How mukoko is built
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Every Mukoko app follows these patterns. They are not optional —
            they ensure consistency, resilience, and maintainability across the
            entire ecosystem.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {patterns.map((pattern) => (
            <a
              key={pattern.title}
              href={pattern.href}
              className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:border-foreground/12 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <pattern.icon className="size-5 text-foreground" />
                </div>
                <div
                  className={cn(
                    "size-2 rounded-full",
                    MINERAL_STYLES[pattern.mineral]
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold text-foreground">
                  {pattern.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {pattern.description}
                </p>
              </div>
              <ul className="flex flex-col gap-1.5">
                {pattern.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="size-1 rounded-full bg-border" />
                    {item}
                  </li>
                ))}
              </ul>
            </a>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-secondary/30 p-6">
          <p className="text-center text-sm text-muted-foreground">
            These patterns are enforced across all Mukoko apps:{" "}
            <span className="font-medium text-foreground">weather</span>,{" "}
            <span className="font-medium text-foreground">news</span>,{" "}
            <span className="font-medium text-foreground">nhimbe</span>,{" "}
            <span className="font-medium text-foreground">super app</span>, and{" "}
            <span className="font-medium text-foreground">shamwari</span>.
            Install components from this registry — do not copy-paste or create
            parallel libraries.
          </p>
        </div>
      </div>
    </div>
  )
}
