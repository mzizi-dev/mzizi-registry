import { notFound } from "next/navigation"
import { ComponentPreview } from "@/components/playground/component-preview"
import { ApiTester } from "@/components/playground/api-tester"
import { AutoPreview } from "@/components/playground/auto-preview"
import { ComponentDocSection } from "@/components/playground/component-doc-section"
import { SafeSection } from "@/components/error-boundary"
import { Badge } from "@/components/registry/n2-primitives/badge"
import { getAllComponents, getComponent, isSupabaseConfigured } from "@/lib/db"
import { readComponentSource } from "@/lib/registry-source"

/**
 * Static params: generate a page per component by listing the DB registry.
 * If Supabase is unreachable at build time we emit an empty set and let the
 * page render on demand — avoiding a build failure in preview environments.
 */
export async function generateStaticParams() {
  if (!isSupabaseConfigured()) return []
  try {
    const components = await getAllComponents()
    return components.map((c) => ({ name: c.name }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const item = await getComponent(name).catch(() => null)
  if (!item) return { title: "Not Found" }
  return {
    title: `${item.name} — nyuchi design portal`,
    description: item.description,
  }
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const item = await getComponent(name).catch(() => null)

  if (!item) notFound()

  // Source lives on disk, not in the registry document (@/lib/registry-source).
  const sourceCode = readComponentSource(name) ?? "// Source not available"
  const firstFilePath = item.files?.[0]?.path ?? ""
  const registryType = item.type?.replace("registry:", "") ?? "component"
  const installUrl = `https://mzizi.dev/api/v1/ui/${item.name}`
  // Every component is a real file, so every one can be rendered. There is no
  // hand-written demo list any more -- that list gated the Preview tab off for 525
  // of 571 components, which is why this page only ever showed code.
  const sourcePath = (item as { sourcePath?: string }).sourcePath ?? ""
  const canPreview = /\.tsx$/.test(sourcePath)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-8">
      {/* Breadcrumb — wayfinding back to the gallery */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>
            <a
              href="/components"
              className="rounded-md transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Components
            </a>
          </li>
          <li aria-hidden="true" className="text-border">
            /
          </li>
          <li aria-current="page" className="font-mono text-foreground">
            {item.name}
          </li>
        </ol>
      </nav>

      {/* Header — always renders (no boundary needed, pure server markup) */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-bold tracking-tight">{item.name}</h1>
          <Badge variant="outline" className="font-mono text-xs">
            {registryType}
          </Badge>
          {item.node && (
            <Badge variant="secondary" className="font-mono text-xs">
              N{item.node}
            </Badge>
          )}
        </div>
        <p className="text-lg text-muted-foreground">{item.description}</p>
      </div>

      {/* Use cases, variants, sizes, features */}
      <SafeSection section="Documentation">
        <ComponentDocSection name={item.name} />
      </SafeSection>

      {/* Preview + Code */}
      <SafeSection section="Preview">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{canPreview ? "Preview" : "Source Code"}</h2>
          <p className="text-sm text-muted-foreground">
            {canPreview
              ? "Interactive preview with light/dark mode toggle. Switch to Code tab to view the full source."
              : "View the full component source code below."}
          </p>
          <ComponentPreview code={sourceCode} hasDemo={canPreview}>
            <AutoPreview sourcePath={sourcePath} name={item.name} />
          </ComponentPreview>
        </section>
      </SafeSection>

      {/* Install */}
      <SafeSection section="Installation">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Installation</h2>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <code className="text-sm text-foreground">npx shadcn@latest add {installUrl}</code>
          </div>
        </section>
      </SafeSection>

      {/* Dependencies */}
      {((item.dependencies && item.dependencies.length > 0) ||
        (item.registryDependencies && item.registryDependencies.length > 0)) && (
        <SafeSection section="Dependencies">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">Dependencies</h2>
            <div className="flex flex-wrap gap-2">
              {item.dependencies?.map((dep) => (
                <Badge key={dep} variant="secondary">
                  {dep}
                </Badge>
              ))}
              {item.registryDependencies?.map((dep) => (
                <Badge key={dep} variant="outline">
                  <a href={`/components/${dep}`} className="hover:underline">
                    {dep}
                  </a>
                </Badge>
              ))}
            </div>
          </section>
        </SafeSection>
      )}

      {/* API Tester */}
      <SafeSection section="API Tester">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">API</h2>
          <p className="text-sm text-muted-foreground">
            Fetch this component&apos;s metadata and source code from the registry API.
          </p>
          <ApiTester name={item.name} />
        </section>
      </SafeSection>

      {/* Source file path */}
      {firstFilePath && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Source</h2>
          <p className="text-sm text-muted-foreground">
            <code className="rounded-md bg-muted px-2 py-1 text-xs">{firstFilePath}</code>
          </p>
        </section>
      )}
    </div>
  )
}
