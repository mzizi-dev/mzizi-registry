import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getArchitectureSnapshot, isSupabaseConfigured } from "@/lib/db"
import type { ArchitectureSnapshotAxis, ArchitectureSnapshotLayer } from "@/lib/db/types"

export const revalidate = 3600

export const metadata = {
  title: "Architecture — nyuchi design portal",
  description:
    "The Nyuchi 3D Architecture Model — five axes, ten layers, every count read live from Supabase. Doctrine that documents itself.",
}

const GEOMETRY_BADGE: Record<string, string> = {
  horizontal: "bg-[var(--color-cobalt)]/10 text-[var(--color-cobalt)]",
  vertical: "bg-[var(--color-tanzanite)]/10 text-[var(--color-tanzanite)]",
  depth: "bg-[var(--color-malachite)]/10 text-[var(--color-malachite)]",
  external: "bg-[var(--color-gold)]/10 text-[var(--color-gold)]",
}

function geometryClass(geometry: string): string {
  return GEOMETRY_BADGE[geometry] ?? "bg-muted text-muted-foreground"
}

function LayerCard({ layer }: { layer: ArchitectureSnapshotLayer }) {
  return (
    <Link
      href={`/architecture/layers/${layer.layer_number}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          L{layer.layer_number} · {layer.sub_label}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {layer.component_count} {layer.component_count === 1 ? "component" : "components"}
        </span>
      </div>
      <h3 className="font-serif text-xl font-semibold text-foreground">{layer.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{layer.role}</p>
      <p className="border-l-2 border-border pl-3 text-sm leading-relaxed text-foreground italic">
        &ldquo;{layer.covenant}&rdquo;
      </p>
      <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        Open detail <ArrowRight className="size-3" />
      </span>
    </Link>
  )
}

function AxisSection({ axis }: { axis: ArchitectureSnapshotAxis }) {
  const componentTotal = axis.layers.reduce((sum, layer) => sum + layer.component_count, 0)

  return (
    <section className="border-t border-border pt-10 first:border-t-0 first:pt-0">
      <header className="mb-6 flex flex-col gap-3 sm:mb-8">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-widest uppercase ${geometryClass(
              axis.geometry
            )}`}
          >
            {axis.geometry}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {axis.layers.length} {axis.layers.length === 1 ? "layer" : "layers"} · {componentTotal}{" "}
            {componentTotal === 1 ? "component" : "components"}
          </span>
        </div>
        <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {axis.name} — {axis.title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          <span className="text-foreground italic">{axis.metaphor}.</span> {axis.description}
        </p>
      </header>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        {axis.layers.map((layer) => (
          <LayerCard key={layer.layer_number} layer={layer} />
        ))}
      </div>
    </section>
  )
}

export default async function ArchitecturePage() {
  if (!isSupabaseConfigured()) {
    return (
      <article className="mx-auto max-w-3xl py-12">
        <h1 className="font-serif text-3xl font-bold">Architecture</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Supabase is not configured for this environment. Set{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>{" "}
          to render the live 3D architecture model.
        </p>
      </article>
    )
  }

  const axes = await getArchitectureSnapshot()
  const totalLayers = axes.reduce((sum, axis) => sum + axis.layers.length, 0)
  const totalComponents = axes.reduce(
    (sum, axis) => sum + axis.layers.reduce((s, layer) => s + layer.component_count, 0),
    0
  )

  return (
    <article data-mdx className="mx-auto max-w-5xl py-8">
      <header className="mb-10">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground sm:text-xs">
          3D ARCHITECTURE
        </p>
        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Five axes. Ten layers. Doctrine that documents itself.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Most component libraries are flat: primitives at the bottom, composed components above,
          pages on top. That stack fails when the system needs to express concerns that don&apos;t
          fit linearly — safety doesn&apos;t live above pages, it threads through every layer;
          observability doesn&apos;t live below primitives, it watches the whole thing without being
          inside it. The Nyuchi 3D model gives each kind of concern its own dimension.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every count below is read live from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            architecture_frontend_axes
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            architecture_frontend_layers
          </code>
          , and <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">components</code> —
          never hardcoded. Click any layer card for its covenant, stakeholder, and implementation
          rules.
        </p>

        <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-border py-4 text-sm">
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Axes
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">{axes.length}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Layers
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">{totalLayers}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Components
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">{totalComponents}</dd>
          </div>
        </dl>
      </header>

      <div className="space-y-12">
        {axes.map((axis) => (
          <AxisSection key={axis.name} axis={axis} />
        ))}
      </div>

      <footer className="mt-16 rounded-2xl border border-border bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
        <p className="mb-3 font-mono text-[10px] tracking-widest text-foreground uppercase">
          Source of truth
        </p>
        <p>
          The doctrine is the data. Layer covenants, stakeholders, and implementation rules live in
          the database — relabel a layer with an{" "}
          <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">UPDATE</code> and
          every consumer (this page, the API at{" "}
          <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">
            /api/v1/architecture
          </code>
          , the MCP server, AI assistants) sees the new shape on the next read. No migration. No
          drift.
        </p>
      </footer>
    </article>
  )
}
