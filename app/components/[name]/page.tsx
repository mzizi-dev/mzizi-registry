import fs from "fs"
import path from "path"
import { notFound } from "next/navigation"
import { ComponentPreview } from "@/components/playground/component-preview"
import { ApiTester } from "@/components/playground/api-tester"
import { DemoRenderer, hasDemoFor } from "@/components/playground/demo-renderer"
import { ComponentDocSection } from "@/components/playground/component-doc-section"
import { Badge } from "@/components/ui/badge"

interface RegistryItem {
  name: string
  type: string
  description: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: Array<{ path: string; type: string }>
}

function getRegistry(): { items: RegistryItem[] } {
  const registryPath = path.join(process.cwd(), "registry.json")
  const raw = fs.readFileSync(registryPath, "utf-8")
  return JSON.parse(raw)
}

function getSourceCode(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) return "// Source file not found"
  return fs.readFileSync(fullPath, "utf-8")
}

export async function generateStaticParams() {
  const registry = getRegistry()
  return registry.items.map((item) => ({ name: item.name }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const registry = getRegistry()
  const item = registry.items.find((i) => i.name === name)
  if (!item) return { title: "Not Found" }
  return {
    title: `${item.name} — mukoko registry`,
    description: item.description,
  }
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ name: string }>
}) {
  const { name } = await params
  const registry = getRegistry()
  const item = registry.items.find((i) => i.name === name)

  if (!item) notFound()

  const sourceCode = getSourceCode(item.files[0].path)
  const installUrl = `https://registry.mukoko.com/api/v1/ui/${item.name}`
  const hasDemo = hasDemoFor(item.name)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            {item.name}
          </h1>
          <Badge variant="outline" className="font-mono text-xs">
            {item.type.replace("registry:", "")}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">{item.description}</p>
      </div>

      {/* Use cases, variants, sizes, features */}
      <ComponentDocSection name={item.name} />

      {/* Preview + Code */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          {hasDemo ? "Preview" : "Source Code"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasDemo
            ? "Interactive preview with light/dark mode toggle. Switch to Code tab to view the full source."
            : "View the full component source code below."}
        </p>
        <ComponentPreview code={sourceCode} hasDemo={hasDemo}>
          <DemoRenderer name={item.name} />
        </ComponentPreview>
      </section>

      {/* Install */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Installation</h2>
        <div className="rounded-xl border border-border bg-muted/50 p-4">
          <code className="text-sm text-foreground">
            npx shadcn@latest add {installUrl}
          </code>
        </div>
      </section>

      {/* Dependencies */}
      {((item.dependencies && item.dependencies.length > 0) ||
        (item.registryDependencies &&
          item.registryDependencies.length > 0)) && (
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
      )}

      {/* API Tester */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">API</h2>
        <p className="text-sm text-muted-foreground">
          Fetch this component&apos;s metadata and source code from the registry
          API.
        </p>
        <ApiTester name={item.name} />
      </section>

      {/* Source file path */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Source</h2>
        <p className="text-sm text-muted-foreground">
          <code className="rounded-md bg-muted px-2 py-1 text-xs">
            {item.files[0].path}
          </code>
        </p>
      </section>
    </div>
  )
}
