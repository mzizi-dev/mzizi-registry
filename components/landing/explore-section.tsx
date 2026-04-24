import { Blocks, Palette, BookOpen, BarChart3, Layers, Shield, Code, Globe } from "lucide-react"
import { getRegistryCounts } from "@/lib/db"

export async function ExploreSection() {
  const counts = await getRegistryCounts().catch(() => ({
    total: 0,
    ui: 0,
    blocks: 0,
    hooks: 0,
    lib: 0,
  }))

  // chart blocks ≈ blocks with category prefix "chart-" — approximate split from total blocks
  // exact breakdown requires a category query; show total blocks for accuracy
  const sections = [
    {
      title: "Components",
      description:
        counts.ui > 0
          ? `${counts.ui} production-ready UI components. Browse, preview, and install.`
          : "Production-ready UI components. Browse, preview, and install.",
      href: "/components",
      icon: Layers,
      mineral: "bg-[var(--color-cobalt)]",
      count: counts.ui > 0 ? `${counts.ui}` : undefined,
    },
    {
      title: "Blocks",
      description: "Complete page compositions — dashboards, auth flows, sidebars.",
      href: "/blocks",
      icon: Blocks,
      mineral: "bg-[var(--color-tanzanite)]",
      count: counts.blocks > 0 ? `${counts.blocks}` : undefined,
    },
    {
      title: "Charts",
      description: "Area, bar, line, pie, radar, radial — all mineral-themed.",
      href: "/charts",
      icon: BarChart3,
      mineral: "bg-[var(--color-malachite)]",
    },
    {
      title: "Brand",
      description: "Five African Minerals palette, ecosystem brands, philosophy.",
      href: "/brand",
      icon: Palette,
      mineral: "bg-[var(--color-gold)]",
    },
    {
      title: "Patterns",
      description: "Resilience, AI safety, error boundaries, authentication.",
      href: "/patterns",
      icon: Shield,
      mineral: "bg-[var(--color-terracotta)]",
    },
    {
      title: "Architecture",
      description: "Seven data layers, three sources of truth, sovereignty.",
      href: "/architecture",
      icon: Globe,
      mineral: "bg-[var(--color-cobalt)]",
    },
    {
      title: "Foundations",
      description: "Typography, accessibility, layout, i18n, motion.",
      href: "/foundations",
      icon: BookOpen,
      mineral: "bg-[var(--color-tanzanite)]",
    },
    {
      title: "API & Registry",
      description: "REST API, MCP server, registry schema, CLI usage.",
      href: "/api-docs",
      icon: Code,
      mineral: "bg-[var(--color-malachite)]",
    },
  ]

  return (
    <section className="px-4 py-16 sm:px-6 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center sm:mb-14">
          <p className="mb-3 text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Explore
          </p>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-balance text-foreground sm:text-3xl md:text-4xl">
            Everything you need to build
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
            Design system, component library, architecture reference, and developer docs — all in
            one place.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
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
      </div>
    </section>
  )
}
