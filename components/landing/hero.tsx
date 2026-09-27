import { Button } from "@/components/registry/n2-primitives/button"
import { Badge } from "@/components/registry/n2-primitives/badge"
import { ArrowRight } from "lucide-react"
import { getRegistryCounts } from "@/lib/db"

const minerals = [
  { name: "cobalt", color: "bg-[var(--color-cobalt)]" },
  { name: "tanzanite", color: "bg-[var(--color-tanzanite)]" },
  { name: "malachite", color: "bg-[var(--color-malachite)]" },
  { name: "sodalite", color: "bg-[var(--color-sodalite)]" },
  { name: "gold", color: "bg-[var(--color-gold)]" },
  { name: "terracotta", color: "bg-[var(--color-terracotta)]" },
  { name: "copper", color: "bg-[var(--color-copper)]" },
]

const products = [
  { label: "bundu", href: "https://bundu.family" },
  { label: "nyuchi", href: "https://nyuchi.com" },
  { label: "bushtrade", href: "https://bushtrade.co.zw" },
  { label: "mukoko", href: "https://www.mukoko.com" },
  { label: "weather", href: "https://weather.mukoko.com" },
  { label: "news", href: "https://news.mukoko.com" },
  { label: "lingo", href: "https://lingo.mukoko.com" },
  { label: "nhimbe", href: "https://nhimbe.com" },
  { label: "shamwari", href: "https://shamwari.ai" },
]

export async function Hero() {
  const counts = await getRegistryCounts().catch(() => ({
    total: 0,
    ui: 0,
    blocks: 0,
    hooks: 0,
    lib: 0,
  }))

  const corpusLabel = counts.total > 0 ? `${counts.total}-component` : "fixed"

  return (
    <section className="relative flex flex-col items-center gap-8 px-4 pt-12 pb-16 text-center sm:gap-10 sm:px-6 md:pt-20 md:pb-32">
      {/* Engineering dot-field — theme-aware, denser than the site grid, faded
          to the edges with a radial mask so the hero reads as a focal plate. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--dot-color)_1.25px,transparent_1.5px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,#000_40%,transparent_100%)] bg-[size:20px_20px]"
        aria-hidden="true"
      />

      <div className="flex w-full max-w-full flex-col items-center gap-4">
        <Badge variant="outline" className="max-w-full gap-2 px-3 py-1 text-[11px] sm:text-xs">
          <span className="flex shrink-0 gap-1">
            {minerals.map((m) => (
              <span key={m.name} className={`size-1.5 rounded-full ${m.color}`} />
            ))}
          </span>
          <span className="truncate text-muted-foreground sm:whitespace-normal">
            A Bundu Foundation research project · Phase 0
          </span>
        </Badge>

        <div className="flex w-full flex-wrap items-center justify-center gap-1.5 px-2">
          {products.map((p) => (
            <a
              key={p.label}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      <div className="flex max-w-3xl flex-col items-center gap-4 sm:gap-6">
        <h1 className="font-serif text-[clamp(1.75rem,6vw,2rem)] leading-[1.1] font-bold tracking-tight text-balance text-foreground sm:text-4xl md:text-6xl lg:text-7xl">
          A Rust framework
          <br />
          for the agentic web
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground sm:text-base md:text-lg">
          Every existing framework was designed assuming a human is typing. Mzizi&apos;s syntax,
          type system, and compiler feedback loop are designed for machine authorship — an agent
          iterating against a compiler in a tight loop, thousands of times — and measured against a{" "}
          {corpusLabel} benchmark corpus.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:gap-3">
          <Button size="lg" className="w-full gap-2 sm:w-auto" asChild>
            <a href="/architecture">
              Read the research charter
              <ArrowRight className="size-4" />
            </a>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
            <a href="/components">The benchmark corpus</a>
          </Button>
        </div>
      </div>

      {/* Charter stats — the corpus count is live from the DB; the rest are
          fixed properties of the research program. */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 sm:gap-8">
        {[
          { label: "Corpus Components", value: counts.total > 0 ? `${counts.total}` : "—" },
          { label: "Design Goals", value: "4" },
          { label: "Current Phase", value: "0" },
          { label: "Palette", value: "7 minerals" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-lg font-semibold text-foreground">{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
