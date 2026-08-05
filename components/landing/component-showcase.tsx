import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AutoPreview } from "@/components/playground/auto-preview"
import { readComponent } from "@/lib/registry"
import { Section, SectionHeader } from "@/components/landing/section"

/**
 * Live component band — show, don't tell. A curated grid of *actual* rendered
 * components, so a first-time visitor sees the quality on the landing rather than
 * reading about it. Only self-contained, non-modal components are featured so nothing
 * opens an overlay from the grid.
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
        eyebrow="The library"
        title="Components that look shipped, out of the box"
        sub="Real components, rendered live — theme-adaptive, accessible, and installed straight into your repo with the shadcn CLI. This is the same registry your AI assistant reads."
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
          Browse all components
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Section>
  )
}
