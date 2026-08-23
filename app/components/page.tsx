import type { Metadata } from "next"
import { ComponentGallery } from "@/components/playground/component-gallery"

export const metadata: Metadata = {
  title: "Components",
  description:
    "The Mzizi benchmark corpus — 571 components across 12 nodes, the fixed ground truth the framework is measured against. Live preview, source code, and an API tester for each.",
}

export const revalidate = 300

export default function ComponentsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 py-8">
      <header className="space-y-3">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Components
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          The benchmark corpus — 571 components across 12 nodes, each with a TypeScript reference
          and a growing set of Rust siblings, the fixed ground truth the Mzizi framework is measured
          against. Every component has a live preview, full source code, and an API tester to fetch
          it programmatically — and remains installable as a working component.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>npx shadcn@latest add https://mzizi.dev/api/v1/ui/&lt;component-name&gt;</code>
        </pre>
      </header>

      <ComponentGallery />
    </div>
  )
}
