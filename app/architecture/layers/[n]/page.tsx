import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getLayerDetail, isSupabaseConfigured } from "@/lib/db"

export const revalidate = 3600

const VALID_LAYERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export async function generateStaticParams() {
  return VALID_LAYERS.map((n) => ({ n: String(n) }))
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const parsed = Number.parseInt(n, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    return { title: "Layer not found — nyuchi design portal" }
  }
  if (!isSupabaseConfigured()) {
    return { title: `Layer ${parsed} — nyuchi design portal` }
  }
  const detail = await getLayerDetail(parsed).catch(() => null)
  if (!detail) {
    return { title: `Layer ${parsed} — nyuchi design portal` }
  }
  return {
    title: `L${detail.layer_number} ${detail.title} — nyuchi design portal`,
    description: detail.description,
  }
}

export default async function LayerDetailPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const parsed = Number.parseInt(n, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
    notFound()
  }

  if (!isSupabaseConfigured()) {
    return (
      <article className="mx-auto max-w-3xl py-12">
        <h1 className="font-serif text-3xl font-bold">Layer {parsed}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Supabase is not configured. Layer detail is read live from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            get_layer_detail({parsed})
          </code>
          .
        </p>
      </article>
    )
  }

  const detail = await getLayerDetail(parsed)
  if (!detail) notFound()

  const totalInBreakdown = detail.categories.reduce((sum, c) => sum + c.count, 0) || 1

  return (
    <article data-mdx className="mx-auto max-w-3xl py-8">
      <Link
        href="/architecture"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> All layers
      </Link>

      <header className="mb-8">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground sm:text-xs">
          L{detail.layer_number} · {detail.sub_label.toUpperCase()} · {detail.axis_name}
        </p>
        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {detail.title}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-foreground">{detail.role}</p>
      </header>

      <section className="mb-10 rounded-2xl border border-border bg-muted/20 p-6">
        <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Covenant
        </p>
        <p className="font-serif text-xl leading-relaxed text-foreground italic">
          &ldquo;{detail.covenant}&rdquo;
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-xl font-semibold">What this layer is</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-serif text-xl font-semibold">Stakeholder</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{detail.stakeholder}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 font-serif text-xl font-semibold">Implementation rules</h2>
        <ul className="space-y-2 text-sm leading-relaxed">
          {detail.implementation_rules.map((rule, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="mt-1 text-muted-foreground">
                →
              </span>
              <span className="text-foreground">{rule}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <header className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">Components in this layer</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {detail.component_count} total
          </span>
        </header>
        {detail.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No components yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.categories.map((cat) => {
              const pct = Math.round((cat.count / totalInBreakdown) * 100)
              return (
                <li key={cat.category} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 font-mono text-xs text-muted-foreground">
                    {cat.category}
                  </span>
                  <span
                    className="block h-2 rounded-full bg-foreground/80"
                    style={{ width: `${Math.max(pct, 4)}%` }}
                    aria-hidden="true"
                  />
                  <span className="ml-auto font-mono text-xs text-foreground tabular-nums">
                    {cat.count}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </article>
  )
}
