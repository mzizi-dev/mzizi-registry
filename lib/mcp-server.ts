/**
 * Mukoko Registry MCP Server — Shared Setup
 *
 * Configures the McpServer instance with all tools and resources.
 * Used by both the stdio transport (mcp/src/index.ts) and
 * the HTTP endpoint (app/mcp/route.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import fs from "fs"
import path from "path"

// ─── Data Loading ──────────────────────────────────────────────────────────

interface RegistryFile {
  path: string
  type: string
  content?: string
}

interface RegistryItem {
  name: string
  type: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
}

interface Registry {
  $schema: string
  name: string
  homepage: string
  items: RegistryItem[]
}

function loadRegistry(): Registry {
  const raw = fs.readFileSync(
    path.join(process.cwd(), "registry.json"),
    "utf-8"
  )
  return JSON.parse(raw)
}

function loadComponentSource(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath)
  if (!fs.existsSync(fullPath)) {
    return `// File not found: ${filePath}`
  }
  return fs.readFileSync(fullPath, "utf-8")
}

// ─── Brand Data ────────────────────────────────────────────────────────────

const MINERALS = [
  { name: "cobalt", hex: "#0047AB", cssVar: "--color-cobalt", origin: "Katanga (DRC) and Zambian Copperbelt", symbolism: "Digital future, trust, knowledge", usage: "Primary blue, links, CTAs" },
  { name: "tanzanite", hex: "#B388FF", cssVar: "--color-tanzanite", origin: "Merelani Hills, Tanzania", symbolism: "Premium, creativity, connection", usage: "Purple accent, brand/logo, social features" },
  { name: "malachite", hex: "#64FFDA", cssVar: "--color-malachite", origin: "Congo Copper Belt", symbolism: "Growth, nature, success", usage: "Success states, positive actions" },
  { name: "gold", hex: "#FFD740", cssVar: "--color-gold", origin: "Ghana, South Africa, Mali", symbolism: "Honey, rewards, warmth", usage: "Achievements, rewards, highlights" },
  { name: "terracotta", hex: "#D4A574", cssVar: "--color-terracotta", origin: "Pan-African Sahel", symbolism: "Earth, community, grounding", usage: "Community features, warmth" },
]

const SEMANTIC_COLORS = [
  { name: "background", light: "#FAF9F5", dark: "#0A0A0A", usage: "Page background" },
  { name: "foreground", light: "#141413", dark: "#F5F5F4", usage: "Primary text" },
  { name: "card", light: "#FFFFFF", dark: "#141414", usage: "Card surfaces" },
  { name: "muted", light: "#F3F2EE", dark: "#1E1E1E", usage: "Subdued backgrounds" },
  { name: "muted-foreground", light: "#5C5B58", dark: "#9A9A95", usage: "Secondary text" },
  { name: "border", light: "rgba(10,10,10,0.08)", dark: "rgba(255,255,255,0.08)", usage: "Borders" },
  { name: "primary", light: "#141413", dark: "#F5F5F4", usage: "Primary interactive" },
  { name: "destructive", light: "#B3261E", dark: "#F2B8B5", usage: "Error/danger" },
  { name: "success", light: "#004D40", dark: "#64FFDA", usage: "Success states" },
  { name: "warning", light: "#7A5C00", dark: "#FFD866", usage: "Warning states" },
  { name: "info", light: "#0047AB", dark: "#00B0FF", usage: "Informational states" },
]

const TYPOGRAPHY = {
  fonts: {
    sans: { family: "Noto Sans", usage: "All body text, UI labels" },
    serif: { family: "Noto Serif", usage: "Page titles, hero text, display headings" },
    mono: { family: "JetBrains Mono", usage: "Code blocks, terminal output" },
  },
  scale: [
    { name: "Display", sizePx: 72, font: "serif", usage: "Hero headlines" },
    { name: "H1", sizePx: 48, font: "serif", usage: "Page titles" },
    { name: "H2", sizePx: 36, font: "serif", usage: "Section headings" },
    { name: "H3", sizePx: 30, font: "serif", usage: "Sub-section headings" },
    { name: "H4", sizePx: 24, font: "sans", usage: "Card titles" },
    { name: "H5", sizePx: 20, font: "sans", usage: "Small headings" },
    { name: "Body Large", sizePx: 18, font: "sans", usage: "Lead paragraphs" },
    { name: "Body", sizePx: 16, font: "sans", usage: "Default body text" },
    { name: "Body Small", sizePx: 14, font: "sans", usage: "Secondary text" },
    { name: "Caption", sizePx: 12, font: "sans", usage: "Labels, metadata" },
    { name: "Code", sizePx: 14, font: "mono", usage: "Code blocks" },
  ],
}

const SPACING = [
  { name: "xs", px: 4 }, { name: "sm", px: 8 }, { name: "md", px: 12 },
  { name: "base", px: 16 }, { name: "lg", px: 24 }, { name: "xl", px: 32 },
  { name: "2xl", px: 48 }, { name: "3xl", px: 64 },
]

const ECOSYSTEM = [
  { name: "bundu", meaning: "Wilderness", language: "Shona", role: "Parent ecosystem", mineral: "terracotta", url: "https://bundu.family" },
  { name: "nyuchi", meaning: "Bee", language: "Shona", role: "Action layer", mineral: "gold", url: "https://nyuchi.com" },
  { name: "mukoko", meaning: "Beehive", language: "Shona", role: "Structure layer", mineral: "tanzanite", url: "https://mukoko.com" },
  { name: "shamwari", meaning: "Friend", language: "Shona", role: "Intelligence layer", mineral: "cobalt", url: "https://shamwari.ai" },
  { name: "nhimbe", meaning: "Gathering", language: "Shona", role: "Events layer", mineral: "malachite", url: "https://nhimbe.com" },
]

const GUIDELINES = `# Mukoko Design System Guidelines

## Styling Rules
1. NEVER use hardcoded hex colors, rgba(), or inline style={{}} — use Tailwind classes backed by CSS custom properties
2. All new color tokens MUST be added to globals.css in both :root and .dark blocks AND registered in the @theme block
3. Use cn() from @/lib/utils for all className composition — never string concatenation
4. Border radius uses the --radius token system (radius-sm through radius-4xl)

## Component Requirements
- Accessibility: ARIA attributes, semantic HTML, keyboard navigation via Radix primitives
- Global styles only: Tailwind classes backed by CSS custom properties from globals.css
- cn() composition: all className props composed through cn()
- CVA variants: use class-variance-authority for any component with visual variants
- Radix primitives: use Radix UI for accessible behavior
- data-slot attribute: for component identification in CSS selectors

## Layered Architecture
Layer 1: Shared primitives (Button, Input, Card, Badge, etc.)
Layer 2: Domain-specific composites (landing sections, feature components)
Layer 3: Page orchestrators (compose sections into full pages)
Layer 4: Error boundaries + loading states (per-section isolation)
Layer 5: Server page wrappers (page.tsx — SEO, data, layout)

## Brand Wordmarks
All lowercase: mukoko, nyuchi, shamwari, bundu, nhimbe

## Accessibility Standards
- APCA 3.0 AAA contrast
- 48px minimum touch targets
- Full keyboard support via Radix UI
- Semantic HTML with ARIA attributes

## Category-to-Mineral Mapping
| Category  | Mineral    | Tailwind classes                                    |
|-----------|------------|-----------------------------------------------------|
| Farming   | Malachite  | bg-mineral-malachite, text-mineral-malachite       |
| Mining    | Terracotta | bg-mineral-terracotta, text-mineral-terracotta     |
| Travel    | Cobalt     | bg-mineral-cobalt, text-mineral-cobalt             |
| Tourism   | Tanzanite  | bg-mineral-tanzanite, text-mineral-tanzanite       |
| Sports    | Gold       | bg-mineral-gold, text-mineral-gold                 |
`

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
    { description: "Full Mukoko component registry index with all 70+ components" },
    async () => {
      const registry = loadRegistry()
      return {
        contents: [{
          uri: "mukoko://registry",
          mimeType: "application/json",
          text: JSON.stringify(registry, null, 2),
        }],
      }
    }
  )

  server.resource(
    "brand",
    "mukoko://brand",
    { description: "Complete Mukoko brand system — minerals, typography, spacing, ecosystem" },
    async () => {
      const brandData = {
        version: "7.0.0",
        minerals: MINERALS,
        ecosystem: ECOSYSTEM,
        typography: TYPOGRAPHY,
        spacing: SPACING,
        semanticColors: SEMANTIC_COLORS,
      }
      return {
        contents: [{
          uri: "mukoko://brand",
          mimeType: "application/json",
          text: JSON.stringify(brandData, null, 2),
        }],
      }
    }
  )

  server.resource(
    "design-tokens",
    "mukoko://design-tokens",
    { description: "Five African Minerals palette and semantic color tokens" },
    async () => ({
      contents: [{
        uri: "mukoko://design-tokens",
        mimeType: "application/json",
        text: JSON.stringify({ minerals: MINERALS, semanticColors: SEMANTIC_COLORS, typography: TYPOGRAPHY, spacing: SPACING }, null, 2),
      }],
    })
  )

  server.resource(
    "guidelines",
    "mukoko://guidelines",
    { description: "Mukoko design system usage guidelines and rules" },
    async () => ({
      contents: [{
        uri: "mukoko://guidelines",
        mimeType: "text/markdown",
        text: GUIDELINES,
      }],
    })
  )

  // ─── Tools ───────────────────────────────────────────────────────────

  server.tool(
    "list_components",
    "List all Mukoko registry components. Optionally filter by type or category.",
    {
      type: z.enum(["all", "registry:ui", "registry:hook", "registry:lib"]).default("all").describe("Filter by component type"),
    },
    async ({ type }) => {
      const registry = loadRegistry()
      let items = registry.items

      if (type !== "all") {
        items = items.filter(item => item.type === type)
      }

      const summary = items.map(item => ({
        name: item.name,
        type: item.type,
        description: item.description || "",
        dependencies: item.dependencies || [],
        registryDependencies: item.registryDependencies || [],
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
      const registry = loadRegistry()
      const item = registry.items.find(i => i.name === name)

      if (!item) {
        const available = registry.items.map(i => i.name).join(", ")
        return {
          content: [{ type: "text" as const, text: `Component "${name}" not found. Available components: ${available}` }],
          isError: true,
        }
      }

      const filesWithContent = item.files.map(file => ({
        ...file,
        content: loadComponentSource(file.path),
      }))

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            ...item,
            files: filesWithContent,
            installCommand: `npx shadcn@latest add https://registry.mukoko.com/api/r/${item.name}`,
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
      const registry = loadRegistry()
      const lower = query.toLowerCase()

      const matches = registry.items.filter(item =>
        item.name.includes(lower) ||
        (item.description || "").toLowerCase().includes(lower)
      )

      if (matches.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No components found matching "${query}". Try a broader search term.` }],
        }
      }

      const results = matches.map(item => ({
        name: item.name,
        type: item.type,
        description: item.description || "",
        installCommand: `npx shadcn@latest add https://registry.mukoko.com/api/r/${item.name}`,
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
      const data: Record<string, unknown> = {}
      if (category === "all" || category === "minerals") data.minerals = MINERALS
      if (category === "all" || category === "semantic-colors") data.semanticColors = SEMANTIC_COLORS
      if (category === "all" || category === "typography") data.typography = TYPOGRAPHY
      if (category === "all" || category === "spacing") data.spacing = SPACING

      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      }
    }
  )

  server.tool(
    "scaffold_component",
    "Generate a new Mukoko UI component following the CVA + Radix + cn() pattern. Returns the component source code and registry.json entry.",
    {
      name: z.string().describe("Component name in kebab-case (e.g., 'status-badge')"),
      description: z.string().describe("One-line description of the component"),
      variants: z.array(z.string()).optional().describe("Visual variant names (e.g., ['default', 'outline', 'ghost'])"),
      sizes: z.array(z.string()).optional().describe("Size variant names (e.g., ['sm', 'default', 'lg'])"),
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

      const componentSource = `${isClient ? '"use client"\n\n' : ""}${imports.join("\n")}

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
    defaultVariants: {
      variant: "default",
      size: "default",
    },
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

      const registryEntry = {
        name,
        type: "registry:ui",
        description,
        dependencies: [...(hasRadix ? ["radix-ui"] : []), "class-variance-authority"],
        files: [{ path: `components/ui/${name}.tsx`, type: "registry:ui" }],
      }

      return {
        content: [{
          type: "text" as const,
          text: `## Scaffolded Component: ${pascalName}\n\n### Source Code (components/ui/${name}.tsx)\n\n\`\`\`tsx\n${componentSource}\`\`\`\n\n### Registry Entry (add to registry.json items array)\n\n\`\`\`json\n${JSON.stringify(registryEntry, null, 2)}\n\`\`\`\n\n### Next Steps\n1. Save the source code to \`components/ui/${name}.tsx\`\n2. Customize the CVA variant classes with appropriate Tailwind utilities\n3. Add the registry entry to \`registry.json\`\n4. Run \`pnpm registry:build\` to regenerate static files\n5. Verify: \`curl http://localhost:3000/api/r/${name}\`\n`,
        }],
      }
    }
  )

  server.tool(
    "get_install_command",
    "Get the shadcn CLI install command for one or more Mukoko components.",
    {
      components: z.array(z.string()).describe("Component names to install (e.g., ['button', 'card', 'input'])"),
    },
    async ({ components }) => {
      const registry = loadRegistry()
      const valid: string[] = []
      const invalid: string[] = []

      for (const name of components) {
        if (registry.items.some(i => i.name === name)) {
          valid.push(name)
        } else {
          invalid.push(name)
        }
      }

      let text = ""
      if (valid.length > 0) {
        text += "## Install Commands\n\n"
        text += valid.map(n => `\`\`\`bash\nnpx shadcn@latest add https://registry.mukoko.com/api/r/${n}\n\`\`\``).join("\n\n")
        text += "\n\n### Install all at once\n\n```bash\n"
        text += valid.map(n => `npx shadcn@latest add https://registry.mukoko.com/api/r/${n}`).join(" && \\\n")
        text += "\n```"
      }
      if (invalid.length > 0) {
        text += `\n\n**Not found:** ${invalid.join(", ")}`
      }

      return { content: [{ type: "text" as const, text }] }
    }
  )

  server.tool(
    "get_brand_info",
    "Get information about a specific Mukoko ecosystem brand (bundu, nyuchi, mukoko, shamwari, nhimbe).",
    {
      brand: z.string().describe("Brand name (bundu, nyuchi, mukoko, shamwari, or nhimbe)"),
    },
    async ({ brand }) => {
      const lower = brand.toLowerCase()
      const found = ECOSYSTEM.find(b => b.name === lower)

      if (!found) {
        return {
          content: [{ type: "text" as const, text: `Brand "${brand}" not found. Available brands: ${ECOSYSTEM.map(b => b.name).join(", ")}` }],
          isError: true,
        }
      }

      const mineral = MINERALS.find(m => m.name === found.mineral)
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ ...found, mineralDetails: mineral }, null, 2) }],
      }
    }
  )

  return server
}
