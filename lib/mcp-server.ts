/**
 * Mukoko Registry MCP Server
 *
 * Configures the McpServer instance with all tools and resources.
 * Served via the HTTP endpoint at /mcp (app/mcp/route.ts).
 *
 * All data is read from Supabase — zero hardcoded content.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  isSupabaseConfigured,
  isSeeded,
  getAllComponents,
  getComponent,
  getBrandSystem,
  getMinerals,
  getSemanticColors,
  getArchitecturePrinciples,
  getFrameworkDecision,
  getLocalDataLayer,
  getCloudLayer,
  getPipeline,
  getDataOwnership,
  getSovereignty,
  getRemovedTechnologies,
} from "@/lib/db"

// ─── Server Factory ────────────────────────────────────────────────────────

/**
 * Creates and configures a Mukoko Registry MCP server with all tools and resources.
 */
export function createMukokoMcpServer(): McpServer {
  const server = new McpServer({
    name: "mukoko-registry",
    version: "7.0.0",
  })

  // ─── Resources ───────────────────────────────────────────────────────

  server.resource(
    "registry",
    "mukoko://registry",
    { description: "Full Mukoko component registry index" },
    async () => {
      const components = await getAllComponents()
      const items = components.map((c) => ({
        name: c.name,
        type: c.registry_type,
        description: c.description,
        dependencies: c.dependencies,
        registryDependencies: c.registry_dependencies,
      }))
      return {
        contents: [{
          uri: "mukoko://registry",
          mimeType: "application/json",
          text: JSON.stringify({
            $schema: "https://ui.shadcn.com/schema/registry.json",
            name: "mukoko",
            homepage: "https://registry.mukoko.com",
            items,
          }, null, 2),
        }],
      }
    }
  )

  server.resource(
    "brand",
    "mukoko://brand",
    { description: "Complete Mukoko brand system — minerals, typography, spacing, ecosystem" },
    async () => {
      const brand = await getBrandSystem()
      return {
        contents: [{
          uri: "mukoko://brand",
          mimeType: "application/json",
          text: JSON.stringify(brand, null, 2),
        }],
      }
    }
  )

  server.resource(
    "design-tokens",
    "mukoko://design-tokens",
    { description: "Five African Minerals palette and semantic color tokens" },
    async () => {
      const [minerals, semanticColors] = await Promise.all([
        getMinerals(),
        getSemanticColors(),
      ])
      return {
        contents: [{
          uri: "mukoko://design-tokens",
          mimeType: "application/json",
          text: JSON.stringify({ minerals, semanticColors }, null, 2),
        }],
      }
    }
  )

  server.resource(
    "architecture",
    "mukoko://architecture",
    { description: "Mukoko ecosystem architecture, data layer, and sovereignty information" },
    async () => {
      const [principles, framework, localData, cloud, pipeline, ownership, sovereignty, removed] =
        await Promise.all([
          getArchitecturePrinciples(),
          getFrameworkDecision(),
          getLocalDataLayer(),
          getCloudLayer(),
          getPipeline(),
          getDataOwnership(),
          getSovereignty(),
          getRemovedTechnologies(),
        ])
      return {
        contents: [{
          uri: "mukoko://architecture",
          mimeType: "application/json",
          text: JSON.stringify({
            principles,
            frameworkDecision: framework,
            localDataLayer: localData,
            cloudLayer: cloud,
            pipeline,
            dataOwnership: ownership,
            sovereignty,
            removedTechnologies: removed,
          }, null, 2),
        }],
      }
    }
  )

  // ─── Tools ───────────────────────────────────────────────────────────

  server.tool(
    "get_architecture_info",
    "Get Mukoko ecosystem architecture information: principles, data layer, pipeline, or sovereignty details.",
    {
      category: z.enum(["principles", "framework", "local-data-layer", "cloud-layer", "open-data-pipeline", "data-ownership", "sovereignty", "removed", "all"]).describe("Architecture category to retrieve"),
    },
    async ({ category }) => {
      const fetchMap: Record<string, () => Promise<unknown>> = {
        "principles": () => getArchitecturePrinciples(),
        "framework": () => getFrameworkDecision(),
        "local-data-layer": () => getLocalDataLayer(),
        "cloud-layer": () => getCloudLayer(),
        "open-data-pipeline": () => getPipeline(),
        "data-ownership": () => getDataOwnership(),
        "sovereignty": () => getSovereignty(),
        "removed": () => getRemovedTechnologies(),
      }

      if (category === "all") {
        const results = await Promise.all(
          Object.entries(fetchMap).map(async ([key, fn]) => [key, await fn()])
        )
        const data = Object.fromEntries(results)
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        }
      }

      const data = await fetchMap[category]()
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "list_components",
    "List all Mukoko registry components. Optionally filter by type or category.",
    {
      type: z.enum(["all", "registry:ui", "registry:hook", "registry:lib"]).default("all").describe("Filter by component type"),
    },
    async ({ type }) => {
      const components = await getAllComponents()
      const items = type === "all"
        ? components
        : components.filter(c => c.registry_type === type)

      const summary = items.map(c => ({
        name: c.name,
        type: c.registry_type,
        description: c.description,
        dependencies: c.dependencies,
        registryDependencies: c.registry_dependencies,
      }))

      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      }
    }
  )

  server.tool(
    "get_component",
    "Get a component's full source code, metadata, and dependencies from the Mukoko registry.",
    {
      name: z.string().describe("Component name (e.g., 'button', 'card', 'use-toast')"),
    },
    async ({ name }) => {
      const component = await getComponent(name)

      if (!component) {
        const all = await getAllComponents()
        const available = all.map(c => c.name).join(", ")
        return {
          content: [{ type: "text" as const, text: `Component "${name}" not found. Available: ${available}` }],
          isError: true,
        }
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            name: component.name,
            type: component.registry_type,
            description: component.description,
            dependencies: component.dependencies,
            registryDependencies: component.registry_dependencies,
            files: component.files,
            sourceCode: component.source_code,
            installCommand: `npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/${component.name}`,
          }, null, 2),
        }],
      }
    }
  )

  server.tool(
    "search_components",
    "Search Mukoko registry components by name or description keyword.",
    {
      query: z.string().describe("Search query to match against component names and descriptions"),
    },
    async ({ query }) => {
      const components = await getAllComponents()
      const lower = query.toLowerCase()

      const matches = components.filter(c =>
        c.name.includes(lower) ||
        c.description.toLowerCase().includes(lower)
      )

      if (matches.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No components found matching "${query}".` }],
        }
      }

      const results = matches.map(c => ({
        name: c.name,
        type: c.registry_type,
        description: c.description,
        installCommand: `npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/${c.name}`,
      }))

      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      }
    }
  )

  server.tool(
    "get_design_tokens",
    "Get Mukoko design tokens: Five African Minerals palette, semantic colors, typography, or spacing.",
    {
      category: z.enum(["minerals", "semantic-colors", "typography", "spacing", "all"]).default("all").describe("Token category to retrieve"),
    },
    async ({ category }) => {
      const brand = await getBrandSystem()
      if (!brand) {
        return { content: [{ type: "text" as const, text: "Brand system not available. Database may not be seeded." }], isError: true }
      }
      const data: Record<string, unknown> = {}
      if (category === "all" || category === "minerals") data.minerals = brand.minerals
      if (category === "all" || category === "semantic-colors") data.semanticColors = brand.semanticColors
      if (category === "all" || category === "typography") data.typography = brand.typography
      if (category === "all" || category === "spacing") data.spacing = brand.spacing

      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "scaffold_component",
    "Generate a new Mukoko UI component following the CVA + Radix + cn() pattern.",
    {
      name: z.string().describe("Component name in kebab-case (e.g., 'status-badge')"),
      description: z.string().describe("One-line description of the component"),
      variants: z.array(z.string()).optional().describe("Visual variant names"),
      sizes: z.array(z.string()).optional().describe("Size variant names"),
      hasRadix: z.boolean().default(false).describe("Whether the component uses Radix UI primitives"),
      isClient: z.boolean().default(false).describe("Whether the component needs 'use client' directive"),
    },
    async ({ name, description, variants, sizes, hasRadix, isClient }) => {
      const pascalName = name
        .split("-")
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")

      const camelVariants = name.replace(/-./g, x => x[1].toUpperCase())
      const variantEntries = (variants || ["default"]).map(v => `        ${v}: "",`).join("\n")
      const sizeEntries = (sizes || ["default"]).map(s => `        ${s}: "",`).join("\n")

      const imports = [
        'import * as React from "react"',
        'import { cva, type VariantProps } from "class-variance-authority"',
      ]
      if (hasRadix) imports.push('import { Slot } from "radix-ui"')
      imports.push('', 'import { cn } from "@/lib/utils"')

      const source = `${isClient ? '"use client"\n\n' : ""}${imports.join("\n")}

const ${camelVariants}Variants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
${variantEntries}
      },
      size: {
${sizeEntries}
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function ${pascalName}({
  className,
  variant,
  size,${hasRadix ? "\n  asChild = false," : ""}
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof ${camelVariants}Variants>${hasRadix ? " & { asChild?: boolean }" : ""}) {${hasRadix ? '\n  const Comp = asChild ? Slot.Root : "div"' : ""}

  return (
    <${hasRadix ? "Comp" : "div"}
      data-slot="${name}"
      className={cn(${camelVariants}Variants({ variant, size, className }))}
      {...props}
    />
  )
}

export { ${pascalName}, ${camelVariants}Variants }
`

      return {
        content: [{
          type: "text" as const,
          text: `## ${pascalName}\n\n\`\`\`tsx\n${source}\`\`\`\n\n### Registry Entry\n\n\`\`\`json\n${JSON.stringify({ name, type: "registry:ui", description, dependencies: [...(hasRadix ? ["radix-ui"] : []), "class-variance-authority"], files: [{ path: `components/ui/${name}.tsx`, type: "registry:ui" }] }, null, 2)}\n\`\`\``,
        }],
      }
    }
  )

  server.tool(
    "get_install_command",
    "Get the shadcn CLI install command for one or more Mukoko components.",
    {
      components: z.array(z.string()).describe("Component names to install"),
    },
    async ({ components: requested }) => {
      const all = await getAllComponents()
      const names = new Set(all.map(c => c.name))
      const valid = requested.filter(n => names.has(n))
      const invalid = requested.filter(n => !names.has(n))

      let text = ""
      if (valid.length > 0) {
        text += valid.map(n => `npx shadcn@latest add https://registry.mukoko.com/api/v1/ui/${n}`).join("\n")
      }
      if (invalid.length > 0) {
        text += `\n\nNot found: ${invalid.join(", ")}`
      }

      return { content: [{ type: "text" as const, text }] }
    }
  )

  server.tool(
    "get_brand_info",
    "Get information about a specific Mukoko ecosystem brand (bundu, nyuchi, mukoko, shamwari, nhimbe).",
    {
      brand: z.string().describe("Brand name"),
    },
    async ({ brand: brandName }) => {
      const brandData = await getBrandSystem()
      if (!brandData) {
        return { content: [{ type: "text" as const, text: "Brand system not available. Database may not be seeded." }], isError: true }
      }
      const found = brandData.ecosystem.find(
        (b: { name: string }) => b.name === brandName.toLowerCase()
      )

      if (!found) {
        const available = brandData.ecosystem.map((b: { name: string }) => b.name).join(", ")
        return {
          content: [{ type: "text" as const, text: `Brand "${brandName}" not found. Available: ${available}` }],
          isError: true,
        }
      }

      const mineral = brandData.minerals.find(
        (m: { name: string }) => m.name === found.mineral
      )
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ ...found, mineralDetails: mineral }, null, 2) }],
      }
    }
  )

  return server
}
