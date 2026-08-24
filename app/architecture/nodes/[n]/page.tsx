import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getHelixModel, getHelixNode, helixClassOf, isSupabaseConfigured } from "@/lib/db"
import type { HelixNode } from "@/lib/db/types"

export const revalidate = 3600

// NODE DETAIL — one slice of the Phase 0 benchmark corpus.
//
// Under the framework reframing, N1–N12 are the taxonomy of the corpus the
// Mzizi language is measured against: each node is a fixed, known-ground-truth
// set of components with reference implementations and behavior contracts.
//
// Replaces the axis-era `/architecture/layers/[n]`, which read
// `get_layer_detail()` and printed `L{n} · {sub_label} · {axis_name}` for
// a hardcoded range of ten layers. Both defects are gone: the page reads
// the helix collection the MCP serves, and it never caps the node set.
//
// `generateStaticParams` derives its params FROM the collection rather
// than from a constant, so a node added to the DB gets a page with no
// code change. A `VALID_NODES` array here would be the same defect that
// hid N11 — and a cap of 11 would go on to hide N12.

export async function generateStaticParams() {
  const model = await getHelixModel().catch(() => null)
  if (!model) return []
  return [...model.nodes, ...model.rungs].map((element) => ({
    n: String(element.node_number),
  }))
}

function parseNode(raw: string): number | null {
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== raw.trim()) return null
  return parsed
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const parsed = parseNode(n)
  if (parsed === null) return { title: "Node not found" }
  if (!isSupabaseConfigured()) return { title: `N${parsed}` }

  const element = await getHelixNode(parsed).catch(() => null)
  if (!element) return { title: `N${parsed}` }
  return {
    title: `N${element.node_number} ${element.title}`,
    description: element.description,
  }
}

/** Where this element sits: a strand + its backbone, or cross-cutting. */
function placement(element: HelixNode): string {
  if (element.type === "rung") return "rung · cross-cutting · bridges both backbones"
  if (!element.strand) return "node"
  return element.backbone
    ? `node · ${element.strand} · ${element.backbone} backbone`
    : `node · ${element.strand}`
}

const CLASS_BADGE: Record<string, string> = {
  "core-guarantee": "bg-[var(--color-cobalt)]/10 text-[var(--color-cobalt)]",
  shipped: "bg-[var(--color-tanzanite)]/10 text-[var(--color-tanzanite)]",
  swappable: "bg-[var(--color-malachite)]/10 text-[var(--color-malachite)]",
  spine: "bg-[var(--color-copper)]/10 text-[var(--color-copper)]",
  rung: "bg-[var(--color-gold)]/10 text-[var(--color-gold)]",
}

export default async function NodeDetailPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params
  const parsed = parseNode(n)
  if (parsed === null) notFound()

  if (!isSupabaseConfigured()) {
    return (
      <article className="mx-auto max-w-3xl py-12">
        <h1 className="font-serif text-3xl font-bold">N{parsed}</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Supabase is not configured. Every slice of the benchmark corpus is read live from{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            component_documents
          </code>{" "}
          (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            documentation-architecture-nodes
          </code>
          ) — nothing on this page is hardcoded, so there is nothing to show.
        </p>
      </article>
    )
  }

  const element = await getHelixNode(parsed)
  if (!element) notFound()

  const badge = CLASS_BADGE[helixClassOf(element)] ?? "bg-muted text-muted-foreground"

  return (
    <article data-mdx className="mx-auto max-w-3xl py-8">
      <Link
        href="/architecture"
        className="mb-6 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> The whole corpus
      </Link>

      <header className="mb-8">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground sm:text-xs">
          N{element.node_number} · {element.sub_label.toUpperCase()}
        </p>
        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {element.title}
        </h1>
        <p className="mb-4">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-widest uppercase ${badge}`}
          >
            {placement(element)}
          </span>
        </p>
        {element.role ? (
          <p className="max-w-2xl text-base leading-relaxed text-foreground">{element.role}</p>
        ) : null}
      </header>

      {element.covenant ? (
        <section className="mb-10 rounded-2xl border border-border bg-muted/20 p-6">
          <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Covenant
          </p>
          <p className="font-serif text-xl leading-relaxed text-foreground italic">
            &ldquo;{element.covenant}&rdquo;
          </p>
        </section>
      ) : null}

      {element.description ? (
        <section className="mb-10">
          <h2 className="mb-3 font-serif text-xl font-semibold">What this {element.type} is</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{element.description}</p>
        </section>
      ) : null}

      <section className="mb-10 rounded-2xl border border-border bg-muted/10 p-6">
        <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          Role in the Phase 0 benchmark
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This {element.type} is one slice of the fixed benchmark corpus the Mzizi framework is
          measured against. Each component here has a reference implementation read from disk and a
          behavior contract; when the benchmark agent re-authors it in Mzizi syntax (versus raw
          Dioxus and Leptos), the run is scored on tokens consumed, iterations to a clean compile,
          and defect rate — a defect being code that compiles cleanly but fails the contract. No
          benchmark has been run yet; the corpus is the ground truth being prepared for it.
        </p>
      </section>

      {element.stakeholder ? (
        <section className="mb-10">
          <h2 className="mb-3 font-serif text-xl font-semibold">Stakeholder</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{element.stakeholder}</p>
        </section>
      ) : null}

      {element.implementation_rules.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl font-semibold">Implementation rules</h2>
          <ul className="space-y-2 text-sm leading-relaxed">
            {element.implementation_rules.map((rule, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-1 text-muted-foreground">
                  →
                </span>
                <span className="text-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-10">
        <header className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">
            Corpus components on this {element.type}
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {element.component_count} {element.component_count === 1 ? "component" : "components"}
          </span>
        </header>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Counted live by{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">get_node_counts()</code>.
          Browse them in the{" "}
          <Link href="/components" className="text-foreground hover:underline">
            component gallery
          </Link>
          .
        </p>
      </section>
    </article>
  )
}
