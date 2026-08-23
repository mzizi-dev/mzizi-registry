import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AutoPreview } from "@/components/playground/auto-preview"
import { readComponent } from "@/lib/registry"
import { Section, SectionHeader } from "@/components/landing/section"

/**
 * Live corpus band — show, don't tell. A curated grid of *actual* rendered
 * components from the benchmark corpus, so a first-time visitor sees that the
 * proving ground is real, running software — not a synthetic task list. Only
 * self-contained, non-modal components are featured so nothing opens an
 * overlay from the grid.
 *
 * A server component: it resolves each featured item to the file that implements it,
 * then hands that to AutoPreview (a client component) to render. Previously it pulled
 * from a hand-written demo map, which is now deleted — the component itself is the
 * demo.
 */
const FEATURED = [
  "button",
  "badge",
  "tabs",
  "switch",
  "checkbox",
  "slider",
  "progress",
  "avatar",
  "select",
  "toggle",
  "rating",
  "stats-card",
] as const

export function ComponentShowcase() {
  return (
    <Section bordered>
      <SectionHeader
        eyebrow="The proving ground"
        title="The benchmark corpus, rendered live"
        sub="Mzizi is measured against a fixed component set: this registry. In Phase 0, an LLM agent reauthors these exact components — in Mzizi syntax, in raw Dioxus, in Leptos — and the results are compared. Real, running components make an honest benchmark; here is a sample of the corpus."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED.map((name) => ({ name, sourcePath: readComponent(name)?.sourcePath ?? "" }))
          .filter((c) => /\.tsx$/.test(c.sourcePath))
          .map(({ name, sourcePath }) => (
            <div
              key={name}
              className="group flex min-h-[184px] flex-col overflow-hidden rounded-xl border border-border bg-background transition-colors hover:border-foreground/30"
            >
              <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
                <AutoPreview sourcePath={sourcePath} name={name} />
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                <span className="font-mono text-xs text-muted-foreground capitalize">
                  {name.replace(/-/g, " ")}
                </span>
                <Link
                  href={`/components/${name}`}
                  className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100"
                >
                  View →
                </Link>
              </div>
            </div>
          ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/components"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
        >
          Browse the full corpus
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Section>
  )
}
