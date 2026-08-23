import { Suspense } from "react"
import Link from "next/link"
import { getHelixModel, isSupabaseConfigured } from "@/lib/db"
import type { HelixNode, HelixStrand } from "@/lib/db/types"
import { Skeleton } from "@/components/registry/n2-primitives/skeleton"
import { ArchitectureExplorer } from "@/components/landing/architecture-explorer"

export const revalidate = 3600

export const metadata = {
  title: "Architecture — a Rust framework for the agentic web",
  description:
    "The research architecture of the Mzizi framework: a novel syntax, type system, and compiler feedback loop designed for machine authorship, with Dioxus rendering interop, Candle ML, and an edge-first WASM artifact. Phase 0: language design + benchmark.",
}

const STRAND_BADGE: Record<string, string> = {
  "core-guarantee": "bg-[var(--color-cobalt)]/10 text-[var(--color-cobalt)]",
  shipped: "bg-[var(--color-tanzanite)]/10 text-[var(--color-tanzanite)]",
  swappable: "bg-[var(--color-malachite)]/10 text-[var(--color-malachite)]",
  spine: "bg-[var(--color-copper)]/10 text-[var(--color-copper)]",
  "genetic-code": "bg-[var(--color-terracotta)]/10 text-[var(--color-terracotta)]",
  transcription: "bg-[var(--color-sodalite)]/10 text-[var(--color-sodalite)]",
}
const RUNG_BADGE = "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"

function strandBadge(strand: string): string {
  return STRAND_BADGE[strand] ?? "bg-muted text-muted-foreground"
}

// ── Static charter content ─────────────────────────────────────────────
// The framework is in Phase 0: the language is being designed now. These
// tables state the charter — goals, layers, phases, non-goals — and never
// invent syntax, benchmark numbers, or shipped features.

const DESIGN_GOALS = [
  {
    label: "G1 · Low syntactic ambiguity",
    body: "Every construct should have one obvious spelling. An agent that has to guess between equivalent forms burns iterations; a grammar with fewer valid ways to say the same thing converges faster.",
  },
  {
    label: "G2 · High-signal compiler errors",
    body: "Errors are written for a machine reader: dense, structured, and pointing at the fix — not prose for a human skimming a terminal. The compiler is the agent's pair programmer, and its output is the feedback channel.",
  },
  {
    label: "G3 · Fast incremental compilation",
    body: "An agent iterates against the compiler hundreds or thousands of times per task. Compile latency multiplies through every loop, so incremental build speed is a first-order success metric, not a nice-to-have.",
  },
  {
    label: "G4 · Token-efficient representation",
    body: "More logic per context-window token. The denser the language, the more of a program an agent can hold, read, and rewrite inside one context window.",
  },
] as const

const LAYERS = [
  {
    layer: "Syntax · type system · compiler",
    posture: "Novel — the research",
    detail:
      "The part Mzizi actually builds: a language and compiler feedback loop designed for machine authorship, measured against the four goals.",
    accent: "text-[var(--color-gold)]",
  },
  {
    layer: "Rendering",
    posture: "Interop — Dioxus",
    detail:
      "Mzizi does not build a renderer. Components compile to Dioxus for rendering; no native renderer in Phase 0/1.",
    accent: "text-[var(--color-cobalt)]",
  },
  {
    layer: "Machine learning",
    posture: "Interop — Candle",
    detail:
      "ML workloads go through Candle. Building a competing tensor runtime is an explicit non-goal.",
    accent: "text-[var(--color-tanzanite)]",
  },
  {
    layer: "Runtime",
    posture: "Edge-first — Cloudflare Workers / workers-rs",
    detail:
      "The default deployment target is the edge; the runtime story is workers-rs, not a bespoke server.",
    accent: "text-[var(--color-malachite)]",
  },
  {
    layer: "Artifact",
    posture: "WASM (+ native desktop)",
    detail:
      "The compiled artifact is WASM, standalone and embeddable, with native desktop as the second target.",
    accent: "text-[var(--color-copper)]",
  },
  {
    layer: "Host frameworks",
    posture: "Thin optional adapters",
    detail:
      "Astro and other frameworks get adapters that embed the artifact. Adapters stay thin and optional — the artifact is the product of compilation, not a plugin.",
    accent: "text-[var(--color-sodalite)]",
  },
  {
    layer: "Cryptography",
    posture: "Deferred",
    detail: "Post-quantum crypto is acknowledged and explicitly deferred. Not a Phase 0–4 concern.",
    accent: "text-[var(--color-terracotta)]",
  },
] as const

const PHASES = [
  {
    phase: "Phase 0",
    title: "Compiler & syntax prototype + benchmark",
    status: "now",
    body: "Design the language; prototype the compiler feedback loop; run the benchmark. An agent authors Mzizi's own component corpus in Mzizi syntax versus raw Dioxus and Leptos, measured on tokens consumed, iterations to a clean compile, and defect rate — where a defect is code that compiles cleanly but is behaviorally wrong.",
  },
  {
    phase: "Phase 1",
    title: "Dioxus interop → standalone artifact",
    status: "planned",
    body: "Components render through Dioxus and compile to a standalone WASM / native artifact, embeddable anywhere.",
  },
  {
    phase: "Phase 2",
    title: "Edge",
    status: "planned",
    body: "First-class deployment to Cloudflare Workers via workers-rs — edge-first, not edge-eventually.",
  },
  {
    phase: "Phase 3",
    title: "Candle ML",
    status: "planned",
    body: "ML integration through Candle, so agent-authored components can carry inference without leaving Rust.",
  },
  {
    phase: "Phase 4",
    title: "Adapters",
    status: "planned",
    body: "Thin optional adapters for Astro and other host frameworks that want to embed compiled Mzizi artifacts.",
  },
] as const

function NodeCard({ node }: { node: HelixNode }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 transition-colors hover:border-foreground/30">
      <div className="flex items-baseline justify-between gap-3">
        <Link
          href={`/architecture/nodes/${node.node_number}`}
          className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          {node.sub_label} · {node.title}
        </Link>
        <span className="font-mono text-xs text-muted-foreground">
          {node.component_count} {node.component_count === 1 ? "component" : "components"}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{node.role}</p>
      <p className="border-l-2 border-border pl-3 text-sm leading-relaxed text-foreground italic">
        &ldquo;{node.covenant}&rdquo;
      </p>
    </article>
  )
}

function StrandBlock({ strand, nodes }: { strand: HelixStrand; nodes: HelixNode[] }) {
  const componentTotal = nodes.reduce((sum, n) => sum + n.component_count, 0)
  return (
    <section className="rounded-2xl border border-border bg-muted/10 p-5 sm:p-6">
      <header className="mb-5 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-widest uppercase ${strandBadge(
              strand.name
            )}`}
          >
            {strand.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {nodes.length === 0
              ? "doctrine strand"
              : `${nodes.length} ${nodes.length === 1 ? "node" : "nodes"} · ${componentTotal} ${
                  componentTotal === 1 ? "component" : "components"
                }`}
          </span>
        </div>
        <h3 className="font-serif text-xl font-semibold text-foreground">{strand.title}</h3>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          <span className="text-foreground italic">&ldquo;{strand.covenant}&rdquo;</span>{" "}
          {strand.description}
        </p>
      </header>
      {nodes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {nodes
            .slice()
            .sort((a, b) => a.node_number - b.node_number)
            .map((node) => (
              <NodeCard key={node.node_number} node={node} />
            ))}
        </div>
      )}
    </section>
  )
}

function RungCard({ rung }: { rung: HelixNode }) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/architecture/nodes/${rung.node_number}`}
          className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          {rung.sub_label} · {rung.title}
        </Link>
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${RUNG_BADGE}`}
        >
          rung
        </span>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{rung.description}</p>
      <p className="border-l-2 border-border pl-3 text-sm leading-relaxed text-foreground italic">
        &ldquo;{rung.covenant}&rdquo;
      </p>
    </article>
  )
}

function BackboneSection({
  title,
  blurb,
  strands,
  nodesByStrand,
}: {
  title: string
  blurb: string
  strands: HelixStrand[]
  nodesByStrand: Map<string, HelixNode[]>
}) {
  if (strands.length === 0) return null
  return (
    <section className="border-t border-border pt-10 first:border-t-0 first:pt-0">
      <header className="mb-6 flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {blurb}
        </p>
      </header>
      <div className="space-y-5">
        {strands.map((strand) => (
          <StrandBlock
            key={strand.name}
            strand={strand}
            nodes={nodesByStrand.get(strand.name) ?? []}
          />
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
          to render the live benchmark-corpus taxonomy.
        </p>
      </article>
    )
  }

  const model = await getHelixModel()
  const nodesByStrand = new Map<string, HelixNode[]>()
  for (const node of model.nodes) {
    if (!node.strand) continue
    const list = nodesByStrand.get(node.strand) ?? []
    list.push(node)
    nodesByStrand.set(node.strand, list)
  }
  const engineeringStrands = model.strands.filter((s) => s.backbone === "engineering")
  const meaningStrands = model.strands.filter((s) => s.backbone === "meaning")
  const totalComponents = model.nodes.reduce((sum, n) => sum + n.component_count, 0)

  return (
    <article data-mdx className="mx-auto max-w-5xl py-8">
      <header className="mb-8">
        <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground sm:text-xs">
          RESEARCH ARCHITECTURE · BUNDU FOUNDATION
        </p>
        <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          A Rust framework designed for machine authorship.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          Every existing web framework assumes a human is typing. Mzizi assumes the opposite: the
          primary author is{" "}
          <span className="text-foreground">an agent iterating against a compiler</span>, thousands
          of times, and the framework&apos;s syntax, type system, and compiler feedback loop are
          designed for that reader. It is a{" "}
          <span className="text-foreground">Bundu Foundation research project</span>, currently in{" "}
          <span className="text-foreground">Phase 0</span>: the language is being designed now.
          Nothing on this page is shipped syntax or a measured result — it is the charter the
          research is held to.
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The research is measured, not asserted. Phase 0 ends in a benchmark: an agent authors the
          framework&apos;s own component corpus — the {totalComponents}-component set catalogued
          below — in Mzizi syntax versus raw Dioxus and Leptos, scored on tokens consumed,
          iterations to a clean compile, and defect rate.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Corpus nodes
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">
              {model.nodes.length}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Rungs
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">
              {model.rungs.length}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Strands
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">
              {model.strands.length}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Corpus components
            </dt>
            <dd className="font-serif text-2xl font-semibold text-foreground">{totalComponents}</dd>
          </div>
        </dl>
      </header>

      {/* ── The four design goals ───────────────────────────────────── */}
      <section className="mb-12">
        <header className="mb-6 flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Four measurable design goals
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            The thesis, made falsifiable. Every language and compiler decision is judged against
            these four, and the Phase 0 benchmark exists to score them.
          </p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {DESIGN_GOALS.map((goal) => (
            <article
              key={goal.label}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-5"
            >
              <p className="font-mono text-[10px] tracking-widest text-[var(--color-gold)] uppercase">
                {goal.label}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{goal.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Layer table ─────────────────────────────────────────────── */}
      <section className="mb-12 border-t border-border pt-10">
        <header className="mb-6 flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Build one layer, borrow the rest
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            The novelty budget is spent in exactly one place — the language and its compiler. Every
            other layer interops with the best existing Rust work rather than competing with it.
          </p>
        </header>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-left">
                <th className="px-4 py-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Layer
                </th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  Posture
                </th>
                <th className="hidden px-4 py-3 font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:table-cell">
                  Why
                </th>
              </tr>
            </thead>
            <tbody>
              {LAYERS.map((row) => (
                <tr key={row.layer} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{row.layer}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${row.accent}`}>{row.posture}</td>
                  <td className="hidden px-4 py-3 leading-relaxed text-muted-foreground sm:table-cell">
                    {row.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Roadmap ─────────────────────────────────────────────────── */}
      <section className="mb-12 border-t border-border pt-10">
        <header className="mb-6 flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Phases 0–4
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Sequenced so that each phase has a shippable artifact and the benchmark comes first —
            the framework earns its later phases by measuring well in Phase 0.
          </p>
        </header>
        <ol className="space-y-4">
          {PHASES.map((p) => (
            <li
              key={p.phase}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-5"
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                  {p.phase}
                </span>
                <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium tracking-widest uppercase ${
                    p.status === "now"
                      ? "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-2xl border border-border bg-muted/10 p-5 text-sm leading-relaxed text-muted-foreground">
          <p className="mb-2 font-mono text-[10px] tracking-widest text-foreground uppercase">
            Explicit non-goals
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>No competing tensor runtime — ML is Candle&apos;s job.</li>
            <li>No native renderer in Phase 0/1 — rendering is Dioxus&apos;s job.</li>
            <li>Post-quantum cryptography is deferred, deliberately.</li>
          </ul>
          <p className="mt-3">
            Ownership: the framework IP is held by the{" "}
            <span className="text-foreground">Bundu Foundation</span> and published under{" "}
            <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">@bundu</code>;
            Nyuchi owns the Fundi console that operates around it.
          </p>
        </div>
      </section>

      {/* ── The benchmark corpus ────────────────────────────────────── */}
      <section className="border-t border-border pt-10">
        <header className="mb-6 flex flex-col gap-2">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            The Phase 0 benchmark corpus
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            The component registry Mzizi began life as is not the product any more — it is the{" "}
            <span className="text-foreground">measuring instrument</span>. A fixed,
            known-ground-truth set of components the framework is benchmarked against: each has a
            reference implementation read from disk and a behavior contract, and a defect is code
            that compiles cleanly but fails that contract. The taxonomy below — nodes on strands,
            bridged by rungs — is how the corpus is organized, read live from{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              component_documents
            </code>{" "}
            (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              documentation-architecture-&#123;nodes,strands&#125;
            </code>
            ), never hardcoded. Click any node for its slice of the corpus.
          </p>
        </header>

        {/* Interactive corpus explorer */}
        <div className="mb-12 overflow-hidden">
          <Suspense
            fallback={
              <Skeleton className="h-[340px] w-full rounded-2xl border border-border sm:h-[440px]" />
            }
          >
            <ArchitectureExplorer />
          </Suspense>
        </div>

        <div className="space-y-12">
          <BackboneSection
            title="Engineering backbone"
            blurb="The corpus slices that exercise the framework's engineering surface: primitives, shipped compositions, swappable seams, and the spine that wires them — each one a distinct kind of authoring task for the benchmark agent."
            strands={engineeringStrands}
            nodesByStrand={nodesByStrand}
          />
          <BackboneSection
            title="Meaning backbone"
            blurb="The strands that carry the doctrine behind the corpus: the Ubuntu + Bundu genetic code the research is read from, and the transcription layer that stores every convention and decision as queryable data — not tribal knowledge."
            strands={meaningStrands}
            nodesByStrand={nodesByStrand}
          />

          {model.rungs.length > 0 && (
            <section className="border-t border-border pt-10">
              <header className="mb-6 flex flex-col gap-2">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Cross-cutting rungs
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Corpus slices bound to no single strand — they keep the whole set documented,
                  discoverable, and verifiable, which is what makes it usable as ground truth.
                </p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {model.rungs
                  .slice()
                  .sort((a, b) => a.node_number - b.node_number)
                  .map((rung) => (
                    <RungCard key={rung.node_number} rung={rung} />
                  ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <footer className="mt-16 rounded-2xl border border-border bg-muted/20 p-6 text-sm leading-relaxed text-muted-foreground">
        <p className="mb-3 font-mono text-[10px] tracking-widest text-foreground uppercase">
          Status honesty
        </p>
        <p>
          Mzizi is in Phase 0. The syntax is being designed; no benchmark has been run; nothing
          above is a shipped feature or a measured number. The corpus taxonomy — node covenants,
          strand groupings, rung classifications — is live data in Supabase: relabel a document with
          an <code className="rounded bg-background px-1 py-0.5 font-mono text-xs">UPDATE</code> and
          every consumer (this page, the MCP server, AI assistants) sees the new shape on the next
          read.
        </p>
      </footer>
    </article>
  )
}
