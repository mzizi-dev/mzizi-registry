/**
 * Nyuchi Design Portal MCP Server
 *
 * Configures the McpServer instance with all tools and resources.
 * Served via the HTTP endpoint at /mcp (app/mcp/route.ts).
 *
 * All data is read from Supabase — zero hardcoded content.
 */

import { readFile } from "fs/promises"
import { join } from "path"

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  getAllComponents,
  getComponent,
  getComponentWithDocs,
  searchComponents,
  getDatabaseInfo,
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
import { getUsageStats, trackMcpTool } from "@/lib/metrics"

// ─── Server Factory ────────────────────────────────────────────────────────

/**
 * Creates and configures a Nyuchi Design Portal MCP server with all tools and resources.
 */
export function createMukokoMcpServer(): McpServer {
  const server = new McpServer({
    name: "design-portal",
    version: "4.0.1",
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
        contents: [
          {
            uri: "mukoko://registry",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                $schema: "https://ui.shadcn.com/schema/registry.json",
                name: "mukoko",
                homepage: "https://design.nyuchi.com",
                items,
              },
              null,
              2
            ),
          },
        ],
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
        contents: [
          {
            uri: "mukoko://brand",
            mimeType: "application/json",
            text: JSON.stringify(brand, null, 2),
          },
        ],
      }
    }
  )

  server.resource(
    "design-tokens",
    "mukoko://design-tokens",
    { description: "Five African Minerals palette and semantic color tokens" },
    async () => {
      const [minerals, semanticColors] = await Promise.all([getMinerals(), getSemanticColors()])
      return {
        contents: [
          {
            uri: "mukoko://design-tokens",
            mimeType: "application/json",
            text: JSON.stringify({ minerals, semanticColors }, null, 2),
          },
        ],
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
        contents: [
          {
            uri: "mukoko://architecture",
            mimeType: "application/json",
            text: JSON.stringify(
              {
                principles,
                frameworkDecision: framework,
                localDataLayer: localData,
                cloudLayer: cloud,
                pipeline,
                dataOwnership: ownership,
                sovereignty,
                removedTechnologies: removed,
              },
              null,
              2
            ),
          },
        ],
      }
    }
  )

  server.resource(
    "ubuntu",
    "mukoko://ubuntu",
    {
      description: "Ubuntu philosophy and community-first design doctrine for the bundu ecosystem",
    },
    async () => {
      const ubuntuData = {
        philosophy: {
          principle: "Umuntu ngumuntu ngabantu — A person is a person through other persons.",
          origin:
            "Nguni Bantu — rooted in Zulu, Ndebele, Xhosa, and related Southern African languages",
          meaning:
            "Ubuntu describes the essence of being human: humanity, dignity, communal interdependence, and shared prosperity. It is not merely a philosophy but a lived behavioural framework.",
          aiFraming:
            "AI systems in the bundu ecosystem operate in the Ubuntu tradition: community-first, dignity-centred, context-aware, and locally grounded.",
        },
        designPrinciples: [
          {
            title: "Shared devices",
            description:
              "Design for multiple family members on one account — not individual user isolation. Account switching, family profiles, and shared history are first-class features.",
          },
          {
            title: "Outdoor readability",
            description:
              "High contrast (APCA Lc 90+ for body text), large touch targets (56px default), sun-readable colour choices. Users are in markets, fields, and streets — not air-conditioned offices.",
          },
          {
            title: "Intermittent connectivity",
            description:
              "Offline-first architecture. Graceful degradation. Every action that can be queued locally must be. Connectivity is a gift, not a given.",
          },
          {
            title: "Budget hardware",
            description:
              "Performance budget: 100KB JS, 3G-optimised, <3s TTI on mid-range Android. The flagship experience must work on a Tecno Spark.",
          },
          {
            title: "All ages and literacy levels",
            description:
              "No age-gate assumptions. Iconography supplements text. Voice input is a peer-class interaction method. Swahili, Shona, Ndebele, and English are all valid primary languages.",
          },
          {
            title: "Community data ownership",
            description:
              "Individual data belongs to the individual and their community. No dark patterns. Data portability is non-negotiable. The community's aggregate data benefits the community first.",
          },
        ],
        communityFirst: {
          description:
            "Every feature decision asks: does this benefit the community, or just the individual? Does it strengthen relationships, or fragment them?",
          examples: [
            "Shared watchlists (nhimbe events) — 'who else is going?' over 'my tickets'",
            "Group weather summaries (mukoko-weather) — 'your farming area' over 'your personal forecast'",
            "Community marketplace trust scores — built on social proof, not anonymous ratings",
          ],
        },
        aiResponseStyle: [
          "Frame benefits in terms of community and shared prosperity — not individual gain",
          "Use local examples (Zimbabwe, Southern Africa, East Africa) where relevant",
          "Respect elders, family structures, and communal decision-making patterns",
          "Avoid individualist framing: prefer 'you and your community' over 'you personally'",
          "Acknowledge that multiple languages coexist — Shona, Ndebele, and English are all valid primary languages",
          "Do not assume Western infrastructure: credit cards, fast broadband, and single-user households are not universal",
        ],
        languages: {
          primary: ["English (en-ZW)", "Shona (sn)", "Ndebele (nd)"],
          supported: ["Zulu (zu)", "Sotho (st)", "Swahili (sw)", "Chewa (ny)"],
          note: "All user-facing text should be designed for localisation. String externalisation is required from day one.",
        },
      }

      return {
        contents: [
          {
            uri: "mukoko://ubuntu",
            mimeType: "application/json",
            text: JSON.stringify(ubuntuData, null, 2),
          },
        ],
      }
    }
  )

  // ─── Tools ───────────────────────────────────────────────────────────

  function toolError(context: string, err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    return {
      content: [{ type: "text" as const, text: `${context}: ${message}` }],
      isError: true as const,
    }
  }

  /** Read a component's source code from disk, given its file path relative to project root. */
  async function readSourceFromDisk(filePath: string): Promise<string | null> {
    try {
      return await readFile(join(process.cwd(), filePath), "utf-8")
    } catch {
      return null
    }
  }

  server.tool(
    "list_components",
    "List Nyuchi design portal components. Filter by registry type (ui/hook/lib) and/or category.",
    {
      type: z
        .enum(["all", "registry:ui", "registry:hook", "registry:lib", "registry:block"])
        .default("all")
        .describe("Filter by registry type"),
      category: z
        .string()
        .optional()
        .describe(
          "Filter by category (e.g. 'forms', 'overlay', 'navigation', 'data-display', 'layout', 'feedback', 'action', 'ai', 'chat', 'calendar', 'developer', 'security', 'ecommerce', 'mukoko')"
        ),
    },
    async ({ type, category }) => {
      const start = Date.now()
      try {
        const components = await getAllComponents()

        let items = type === "all" ? components : components.filter((c) => c.registry_type === type)

        if (category) {
          const lower = category.toLowerCase()
          items = items.filter((c) => c.category?.toLowerCase().includes(lower))
        }

        const summary = items.map((c) => ({
          name: c.name,
          type: c.registry_type,
          category: c.category,
          description: c.description,
          dependencies: c.dependencies,
          registryDependencies: c.registry_dependencies,
          installCommand: `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${c.name}`,
        }))

        trackMcpTool({ toolName: "list_components", durationMs: Date.now() - start })
        return {
          content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
        }
      } catch (err) {
        trackMcpTool({ toolName: "list_components", durationMs: Date.now() - start, isError: true })
        return toolError("Failed to list components", err)
      }
    }
  )

  server.tool(
    "get_component",
    "Get a component's full source code, metadata, and dependencies from the Nyuchi design portal.",
    {
      name: z.string().describe("Component name (e.g., 'button', 'card', 'use-toast')"),
      include_docs: z
        .boolean()
        .default(false)
        .describe("Include documentation, use cases, and examples"),
    },
    async ({ name, include_docs }) => {
      const start = Date.now()
      try {
        const component = include_docs ? await getComponentWithDocs(name) : await getComponent(name)

        if (!component) {
          const all = await getAllComponents()
          const available = all.map((c) => c.name).join(", ")
          trackMcpTool({
            toolName: "get_component",
            durationMs: Date.now() - start,
            componentName: name,
            isError: true,
          })
          return {
            content: [
              {
                type: "text" as const,
                text: `Component "${name}" not found. Available: ${available}`,
              },
            ],
            isError: true,
          }
        }

        // Read source code from DB or fall back to disk
        let sourceCode = component.source_code ?? null
        if (!sourceCode && component.files.length > 0) {
          sourceCode = await readSourceFromDisk(component.files[0].path)
        }

        const result: Record<string, unknown> = {
          name: component.name,
          type: component.registry_type,
          category: component.category,
          description: component.description,
          dependencies: component.dependencies,
          registryDependencies: component.registry_dependencies,
          files: component.files,
          tags: component.tags,
          sourceCode,
          installCommand: `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${component.name}`,
        }

        if (include_docs && "docs" in component && component.docs) {
          result.docs = component.docs
        }

        trackMcpTool({
          toolName: "get_component",
          durationMs: Date.now() - start,
          componentName: name,
        })
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
        }
      } catch (err) {
        trackMcpTool({
          toolName: "get_component",
          durationMs: Date.now() - start,
          componentName: name,
          isError: true,
        })
        return toolError(`Failed to get component "${name}"`, err)
      }
    }
  )

  server.tool(
    "get_component_docs",
    "Get detailed documentation for a component: use cases, variants, accessibility notes, and code examples.",
    {
      name: z.string().describe("Component name (e.g., 'button', 'dialog', 'data-table')"),
    },
    async ({ name }) => {
      try {
        const component = await getComponentWithDocs(name)

        if (!component) {
          return {
            content: [{ type: "text" as const, text: `Component "${name}" not found.` }],
            isError: true,
          }
        }

        if (!component.docs) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    name: component.name,
                    description: component.description,
                    message: "No extended documentation available for this component.",
                    installCommand: `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${component.name}`,
                  },
                  null,
                  2
                ),
              },
            ],
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  name: component.name,
                  description: component.description,
                  ...component.docs,
                  installCommand: `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${component.name}`,
                },
                null,
                2
              ),
            },
          ],
        }
      } catch (err) {
        return toolError(`Failed to get docs for "${name}"`, err)
      }
    }
  )

  server.tool(
    "search_components",
    "Search Nyuchi design portal components by name or description keyword.",
    {
      query: z.string().describe("Search query to match against component names and descriptions"),
      type: z
        .enum(["all", "registry:ui", "registry:hook", "registry:lib", "registry:block"])
        .default("all")
        .describe("Filter results by registry type"),
    },
    async ({ query, type }) => {
      try {
        // Use DB-level ilike search for accuracy
        let matches = await searchComponents(query)

        if (type !== "all") {
          matches = matches.filter((c) => c.registry_type === type)
        }

        if (matches.length === 0) {
          return {
            content: [{ type: "text" as const, text: `No components found matching "${query}".` }],
          }
        }

        const results = matches.map((c) => ({
          name: c.name,
          type: c.registry_type,
          category: c.category,
          description: c.description,
          installCommand: `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${c.name}`,
        }))

        return {
          content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
        }
      } catch (err) {
        return toolError(`Failed to search components for "${query}"`, err)
      }
    }
  )

  server.tool(
    "get_design_tokens",
    "Get Mukoko design tokens: Five African Minerals palette, semantic colors, typography, spacing, or radii.",
    {
      category: z
        .enum(["minerals", "semantic-colors", "typography", "spacing", "radii", "all"])
        .default("all")
        .describe("Token category to retrieve"),
    },
    async ({ category }) => {
      const brand = await getBrandSystem()
      if (!brand) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Brand system not available. Database may not be seeded.",
            },
          ],
          isError: true,
        }
      }
      const data: Record<string, unknown> = {}
      if (category === "all" || category === "minerals") data.minerals = brand.minerals
      if (category === "all" || category === "semantic-colors")
        data.semanticColors = brand.semanticColors
      if (category === "all" || category === "typography") data.typography = brand.typography
      if (category === "all" || category === "spacing") data.spacing = brand.spacing
      if (category === "all" || category === "radii") data.radii = brand.meta?.radii

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
      hasRadix: z
        .boolean()
        .default(false)
        .describe("Whether the component uses Radix UI primitives"),
      isClient: z
        .boolean()
        .default(false)
        .describe("Whether the component needs 'use client' directive"),
    },
    async ({ name, description, variants, sizes, hasRadix, isClient }) => {
      const pascalName = name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")

      const camelVariants = name.replace(/-./g, (x) => x[1].toUpperCase())
      const variantEntries = (variants || ["default"]).map((v) => `        ${v}: "",`).join("\n")
      const sizeEntries = (sizes || ["default"]).map((s) => `        ${s}: "",`).join("\n")

      const imports = [
        'import * as React from "react"',
        'import { cva, type VariantProps } from "class-variance-authority"',
      ]
      if (hasRadix) imports.push('import { Slot } from "radix-ui"')
      imports.push("", 'import { cn } from "@/lib/utils"')

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
        content: [
          {
            type: "text" as const,
            text: `## ${pascalName}\n\n\`\`\`tsx\n${source}\`\`\`\n\n### Registry Entry\n\n\`\`\`json\n${JSON.stringify({ name, type: "registry:ui", description, dependencies: [...(hasRadix ? ["radix-ui"] : []), "class-variance-authority"], files: [{ path: `components/ui/${name}.tsx`, type: "registry:ui" }] }, null, 2)}\n\`\`\`\n\n### Next Steps\n1. Create \`components/ui/${name}.tsx\` with the code above\n2. Add the registry entry to \`registry.json\`\n3. Run \`pnpm registry:build\` to regenerate static files\n4. Verify: \`curl http://localhost:3000/api/v1/ui/${name}\`\n\n### Ubuntu Design Checklist\n- [ ] Touch target ≥ 56px (h-14) default, ≥ 48px (h-12) minimum — outdoor use, all ages\n- [ ] APCA contrast Lc 90+ for body text against both light (#FAF9F5) and dark (#0A0A0A) backgrounds\n- [ ] Designed for shared devices — avoid personal-only state assumptions\n- [ ] Works at 3G speeds — no heavy dependencies unless necessary\n- [ ] All strings externalisable for Shona/Ndebele/English localisation\n- [ ] Community-first framing — benefits the group, not just the individual`,
          },
        ],
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
      try {
        const all = await getAllComponents()
        const names = new Set(all.map((c) => c.name))
        const valid = requested.filter((n) => names.has(n))
        const invalid = requested.filter((n) => !names.has(n))

        let text = ""
        if (valid.length > 0) {
          text += valid
            .map((n) => `npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/${n}`)
            .join("\n")
        }
        if (invalid.length > 0) {
          text += `\n\nNot found: ${invalid.join(", ")}`
        }

        return { content: [{ type: "text" as const, text }] }
      } catch (err) {
        return toolError("Failed to get install commands", err)
      }
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
        return {
          content: [
            {
              type: "text" as const,
              text: "Brand system not available. Database may not be seeded.",
            },
          ],
          isError: true,
        }
      }
      const found = brandData.ecosystem.find(
        (b: { name: string }) => b.name === brandName.toLowerCase()
      )

      if (!found) {
        const available = brandData.ecosystem.map((b: { name: string }) => b.name).join(", ")
        return {
          content: [
            {
              type: "text" as const,
              text: `Brand "${brandName}" not found. Available: ${available}`,
            },
          ],
          isError: true,
        }
      }

      const mineral = brandData.minerals.find((m: { name: string }) => m.name === found.mineral)
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ...found, mineralDetails: mineral }, null, 2),
          },
        ],
      }
    }
  )

  server.tool(
    "get_architecture_info",
    "Get Mukoko ecosystem architecture information: principles, data layer, pipeline, or sovereignty details.",
    {
      category: z
        .enum([
          "principles",
          "framework",
          "local-data-layer",
          "cloud-layer",
          "open-data-pipeline",
          "data-ownership",
          "sovereignty",
          "removed",
          "all",
        ])
        .describe("Architecture category to retrieve"),
    },
    async ({ category }) => {
      try {
        const fetchMap: Record<string, () => Promise<unknown>> = {
          principles: () => getArchitecturePrinciples(),
          framework: () => getFrameworkDecision(),
          "local-data-layer": () => getLocalDataLayer(),
          "cloud-layer": () => getCloudLayer(),
          "open-data-pipeline": () => getPipeline(),
          "data-ownership": () => getDataOwnership(),
          sovereignty: () => getSovereignty(),
          removed: () => getRemovedTechnologies(),
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
      } catch (err) {
        return toolError("Failed to fetch architecture data", err)
      }
    }
  )

  server.tool(
    "get_ubuntu_principles",
    "Get Ubuntu philosophy principles and community-first design doctrine for the bundu ecosystem. Use when designing new features, writing AI prompts, or onboarding new team members.",
    {
      aspect: z
        .enum(["all", "philosophy", "design", "community", "ai-framing", "languages"])
        .default("all")
        .describe("Aspect of Ubuntu doctrine to retrieve"),
    },
    async ({ aspect }) => {
      const ubuntu = {
        philosophy: {
          principle: "Umuntu ngumuntu ngabantu — A person is a person through other persons.",
          origin: "Nguni Bantu (Zulu, Ndebele, Xhosa, Shona traditions)",
          meaning:
            "Ubuntu is the philosophical foundation of the bundu ecosystem. It defines how we build: community-first, dignity-centred, locally grounded.",
          aiFraming:
            "AI systems in the bundu ecosystem operate in the Ubuntu tradition: community benefit over individual optimisation, local context over universal assumptions, dignity as a non-negotiable baseline.",
        },
        design: [
          "Shared devices — design for families, not isolated individuals",
          "Outdoor readability — APCA Lc 90+ body text, 56px touch targets, sun-readable contrast",
          "Intermittent connectivity — offline-first, queue locally, sync when able",
          "Budget hardware — 100KB JS budget, 3G-optimised, Tecno Spark must work",
          "All ages — no age-gate assumptions, icons supplement text, voice is first-class",
          "Community data ownership — individual data benefits the community",
        ],
        community: {
          coreQuestion: "Does this feature benefit the community, or just the individual?",
          patterns: [
            "Group features over solo features",
            "Social proof over anonymous ratings",
            "Shared context over personal dashboards",
            "Local news over global feeds",
          ],
        },
        "ai-framing": [
          "Frame responses in terms of community and shared benefit",
          "Use local examples (Zimbabwe, Southern Africa) where relevant",
          "Respect communal decision-making: families and elders matter",
          "Do not assume Western infrastructure (credit cards, broadband, single-user households)",
          "Shona, Ndebele, and English are all valid primary languages — do not treat English as default",
          "Do not describe Africa as a monolith — specify countries and regions",
        ],
        languages: {
          primary: ["English (en-ZW)", "Shona (sn)", "Ndebele (nd)"],
          supported: ["Zulu (zu)", "Sotho (st)", "Swahili (sw)", "Chewa (ny)"],
          principle:
            "All UI must be designed for localisation from day one. String externalisation is required.",
        },
      }

      const result = aspect === "all" ? ubuntu : ubuntu[aspect as keyof typeof ubuntu]

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      }
    }
  )

  server.tool(
    "get_database_status",
    "Get the status and row counts for the design portal database.",
    {},
    async () => {
      const start = Date.now()
      try {
        const info = await getDatabaseInfo()
        trackMcpTool({ toolName: "get_database_status", durationMs: Date.now() - start })
        return {
          content: [{ type: "text" as const, text: JSON.stringify(info, null, 2) }],
        }
      } catch (err) {
        trackMcpTool({
          toolName: "get_database_status",
          durationMs: Date.now() - start,
          isError: true,
        })
        return toolError("Failed to get database status", err)
      }
    }
  )

  server.tool(
    "get_usage_stats",
    "Get public API and MCP usage statistics for the Nyuchi Design Portal. Returns aggregate call counts, error rates, popular components, and daily trends. Data is open by design — CC BY 4.0.",
    {
      days: z
        .number()
        .int()
        .min(1)
        .max(90)
        .optional()
        .describe("Lookback period in days (1–90, default 30)"),
    },
    async ({ days = 30 }) => {
      const start = Date.now()
      try {
        const stats = await getUsageStats(days)
        trackMcpTool({ toolName: "get_usage_stats", durationMs: Date.now() - start })
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(stats, null, 2),
            },
          ],
        }
      } catch (err) {
        trackMcpTool({ toolName: "get_usage_stats", durationMs: Date.now() - start, isError: true })
        return toolError("Failed to get usage stats", err)
      }
    }
  )

  return server
}
