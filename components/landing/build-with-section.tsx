import Link from "next/link"
import { Button } from "@/components/registry/n2-primitives/button"
import { ArrowRight } from "lucide-react"
import { Section, SectionHeader } from "@/components/landing/section"

/**
 * The research program — the five phases of the charter, in order. Each card
 * states what the phase produces and links to where progress can be followed.
 * Phase 0 is the current phase; nothing beyond it is presented as shipped.
 */
export function BuildWithSection() {
  return (
    <Section bordered muted>
      <SectionHeader
        eyebrow="The research program"
        title="Five phases, benchmark first"
        sub="Mzizi ships as evidence before it ships as software. The compiler is proven against a fixed corpus before rendering, edge deployment, ML, and distribution are layered on — each phase gated by the one before it."
      />

      <ol className="mt-12 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <li className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
          <span className="font-mono text-xs text-muted-foreground">PHASE 0 · NOW</span>
          <h3 className="font-serif text-xl font-semibold">Compiler prototype + benchmark</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The syntax and compiler prototype, scored by one experiment: an LLM agent reauthors the
            corpus in Mzizi syntax vs. raw Dioxus and Leptos — measured on tokens consumed,
            iterations to a clean compile, and defect rate (a defect compiles cleanly but is
            behaviorally wrong).
          </p>
          <Link
            href="/components"
            className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            The benchmark corpus <ArrowRight className="size-3" />
          </Link>
        </li>

        <li className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
          <span className="font-mono text-xs text-muted-foreground">PHASE 1</span>
          <h3 className="font-serif text-xl font-semibold">Dioxus rendering interop</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Rendering interops with <code className="font-mono text-xs">Dioxus</code> — Mzizi does
            not rebuild a renderer. The output is a standalone compiled artifact: WASM for the web,
            native for desktop, embeddable anywhere with no host framework required.
          </p>
          <Link
            href="/architecture"
            className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Integration posture <ArrowRight className="size-3" />
          </Link>
        </li>

        <li className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
          <span className="font-mono text-xs text-muted-foreground">PHASE 2</span>
          <h3 className="font-serif text-xl font-semibold">Edge deployment</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Edge-first on Cloudflare Workers via{" "}
            <code className="font-mono text-xs">workers-rs</code>. The same WASM artifact that runs
            in a browser deploys to the edge — the agentic web is served from where the agents are.
          </p>
          <Link
            href="https://docs.bundu.org/mzizi"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Charter documentation <ArrowRight className="size-3" />
          </Link>
        </li>

        <li className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
          <span className="font-mono text-xs text-muted-foreground">PHASE 3</span>
          <h3 className="font-serif text-xl font-semibold">ML via Candle</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Machine learning runs through <code className="font-mono text-xs">Candle</code> — not a
            competing tensor runtime. The language makes inference reachable; the runtime stays
            someone else&apos;s well-solved problem.
          </p>
          <Link
            href="https://docs.bundu.org/mzizi"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Charter documentation <ArrowRight className="size-3" />
          </Link>
        </li>

        <li className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6">
          <span className="font-mono text-xs text-muted-foreground">PHASE 4</span>
          <h3 className="font-serif text-xl font-semibold">Distribution adapters</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Astro and other frameworks become thin optional adapters around the standalone artifact
            — distribution channels, not compile targets — published under the{" "}
            <code className="font-mono text-xs">@bundu</code> npm scope.
          </p>
          <Link
            href="https://docs.bundu.org/mzizi"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
          >
            Charter documentation <ArrowRight className="size-3" />
          </Link>
        </li>

        <li className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-6">
          <div>
            <span className="font-mono text-xs text-muted-foreground">STATUS</span>
            <h3 className="mt-3 font-serif text-xl font-semibold">Where the project stands</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This is a research charter in Phase 0. The language and compiler are being designed
              now — there is no toolchain to install yet, and no benchmark numbers to quote. What
              exists today is the corpus, the charter, and the telemetry on this site.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/architecture">
              Read the research charter
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </li>
      </ol>
    </Section>
  )
}
