import { BookOpen, Layers, Box, Activity, Code } from "lucide-react"
import { getRegistryCounts } from "@/lib/db"
import { Section, SectionHeader } from "@/components/landing/section"

export async function ExploreSection() {
  const counts = await getRegistryCounts().catch(() => ({
    total: 0,
    ui: 0,
    blocks: 0,
    hooks: 0,
    lib: 0,
  }))

  const sections = [
    {
      title: "Benchmark corpus",
      description:
        counts.ui > 0
          ? `${counts.ui} live UI components — the fixed proving ground the framework is measured against.`
          : "Live UI components — the fixed proving ground the framework is measured against.",
      href: "/components",
      icon: Layers,
      mineral: "bg-[var(--color-cobalt)]",
      count: counts.ui > 0 ? `${counts.ui}` : undefined,
      external: false,
    },
    {
      title: "Research charter",
      description: "The full charter — the thesis, the four design goals, and the five phases.",
      href: "/architecture",
      icon: Box,
      mineral: "bg-[var(--color-tanzanite)]",
      external: false,
    },
    {
      title: "Observability",
      description:
        "Live telemetry for the corpus, the API, and the MCP server — benchmark results land here.",
      href: "/observability",
      icon: Activity,
      mineral: "bg-[var(--color-malachite)]",
      external: false,
    },
    {
      title: "Documentation",
      description: "The charter in long form — goals, phasing, and integration posture.",
      href: "https://docs.bundu.org/mzizi",
      icon: BookOpen,
      mineral: "bg-[var(--color-gold)]",
      external: true,
    },
    {
      title: "API & MCP",
      description: "REST API, MCP server, and the OpenAPI contract — the corpus, machine-readable.",
      href: "/api/v1",
      icon: Code,
      mineral: "bg-[var(--color-terracotta)]",
      external: false,
    },
  ]

  return (
    <Section>
      <SectionHeader
        align="center"
        eyebrow="Explore"
        title="Follow the research"
        sub="The corpus, the charter, the telemetry, and the agent surfaces — everything measurable about the project, in one place."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            target={section.external ? "_blank" : undefined}
            rel={section.external ? "noopener noreferrer" : undefined}
            className="group flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-card p-5 transition-all hover:border-foreground/12 hover:bg-card/80"
          >
            <div className="flex items-center justify-between">
              <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-secondary text-foreground">
                <section.icon className="size-5" />
              </div>
              {section.count && (
                <span className="font-mono text-xs text-muted-foreground">{section.count}</span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {section.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </Section>
  )
}
