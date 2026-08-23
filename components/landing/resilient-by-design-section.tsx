import Link from "next/link"
import { Suspense } from "react"
import { ArrowRight } from "lucide-react"
import { ArchitectureExplorer } from "@/components/landing/architecture-explorer"
import { Skeleton } from "@/components/registry/n2-primitives/skeleton"
import { Section, SectionHeader } from "@/components/landing/section"

/**
 * "The wrong author" — the argument behind the charter. Two premises:
 *
 *   1. Every existing framework optimizes for a human typist — forgiving
 *      syntax, expressive redundancy, errors written for eyes. An agent
 *      pays for each of those affordances on every one of thousands of
 *      iterations.
 *   2. For a machine author, the compiler IS the IDE. The error channel and
 *      incremental compile speed are the interface, so Mzizi treats them as
 *      first-class design surfaces.
 *
 * The embedded ArchitectureExplorer renders the corpus architecture live
 * from the database — the proving ground the claim is tested against.
 */
// `ResilientBySection` is async because it embeds the server-rendered
// `ArchitectureExplorer` (which fetches the corpus architecture — nodes,
// rungs and strands — from Supabase).
export async function ResilientBySection() {
  return (
    <Section bordered>
      <SectionHeader
        eyebrow="Why a new language"
        title="Every framework assumes a human is typing"
        sub="Forgiving syntax, many ways to say the same thing, errors written for human eyes, compile times a person can tolerate — all of it optimizes for the wrong author. Below: the live corpus architecture the claim gets tested against, and the two premises behind the charter."
      />

      {/* Interactive corpus-architecture explorer */}
      <div className="mt-12 mb-10 overflow-hidden">
        <Suspense
          fallback={
            <Skeleton className="h-[320px] w-full rounded-xl border border-border sm:h-[420px]" />
          }
        >
          <ArchitectureExplorer />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">PREMISE · 01</span>
            <span className="rounded-full bg-[var(--color-cobalt)]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[var(--color-cobalt)]">
              the author
            </span>
          </div>
          <h3 className="font-serif text-2xl font-semibold">Human affordances are machine costs</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Humans benefit from redundancy: several spellings of the same intent, gentle free-prose
            errors, an IDE filling the gaps. An agent iterating against a compiler in a tight loop —
            thousands of times — pays for every one of those affordances: each synonym is a
            decision, each vague error is another round trip, and every token of ceremony is context
            window that can&apos;t hold logic.
          </p>
          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Expressive redundancy becomes wasted iterations</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Prose-shaped errors are low-signal for a machine reader</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Compile latency multiplies by thousands of attempts</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Verbose syntax spends the context window token by token</span>
            </li>
          </ul>
          <Link
            href="/architecture"
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
          >
            The full research charter <ArrowRight className="size-4" />
          </Link>
        </article>

        <article className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">PREMISE · 02</span>
            <span className="rounded-full bg-[var(--color-tanzanite)]/10 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[var(--color-tanzanite)]">
              the loop
            </span>
          </div>
          <h3 className="font-serif text-2xl font-semibold">
            The compiler is the agent&apos;s whole IDE
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            An agent doesn&apos;t hover for tooltips or skim docs mid-keystroke. It writes,
            compiles, reads the error, and writes again — so the compiler&apos;s output channel is
            the entire developer experience. Mzizi treats that channel as a first-class API: dense,
            structured, maximally actionable errors, and incremental compilation fast enough that
            the loop is bounded by thinking, not waiting.
          </p>
          <ul className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Errors designed as data — max actionable signal per character</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>One canonical spelling per intent, by construction</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Incremental compile latency as a headline benchmark metric</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">→</span>
              <span>Behavioral contracts catch &quot;compiles cleanly but wrong&quot;</span>
            </li>
          </ul>
          <Link
            href="/architecture"
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
          >
            The full research charter <ArrowRight className="size-4" />
          </Link>
        </article>
      </div>

      <div className="mt-10 rounded-2xl border border-foreground/10 bg-foreground/5 px-6 py-5 sm:px-8 sm:py-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Where this stands.</span> Mzizi is a Bundu
          Foundation research charter in Phase 0 — the language and compiler are being designed now.
          There are no benchmark numbers yet and no toolchain to install, and this page won&apos;t
          pretend otherwise. What is real today: the corpus, the MCP server, and the telemetry on
          this site. See{" "}
          <Link href="/architecture" className="underline hover:no-underline">
            the architecture page
          </Link>{" "}
          for the full charter and{" "}
          <a
            href="https://github.com/nyuchi/mzizi/blob/main/SECURITY.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            SECURITY.md
          </a>{" "}
          for the disclosure process.
        </p>
      </div>
    </Section>
  )
}
