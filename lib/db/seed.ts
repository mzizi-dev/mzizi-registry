/**
 * Seed the PouchDB document store from existing hardcoded sources.
 *
 * Migrates data from:
 *   - registry.json        → component:<name> documents
 *   - component-docs.ts    → doc:<name> documents
 *   - demo-names.ts        → demo:<name> documents
 *
 * This is idempotent — running it again updates existing documents
 * rather than creating duplicates (upsert pattern).
 *
 * Usage:
 *   import { seedDatabase } from "@/lib/db/seed"
 *   await seedDatabase()
 *
 * Or via CLI:
 *   npx tsx lib/db/seed.ts
 */

import fs from "fs"
import path from "path"
import { getDb, upsertDocument, isSeeded } from "./index"
import type {
  ComponentDocument,
  ComponentDocDocument,
  DemoDocument,
  ConfigDocument,
  ComponentCategory,
  RegistryDocument,
} from "./types"

// ── Category mapping ────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, ComponentCategory> = {
  // Input
  calendar: "input",
  checkbox: "input",
  combobox: "input",
  command: "input",
  "date-picker": "input",
  field: "input",
  form: "input",
  input: "input",
  "input-group": "input",
  "input-otp": "input",
  label: "input",
  "native-select": "input",
  "radio-group": "input",
  "search-bar": "input",
  select: "input",
  slider: "input",
  switch: "input",
  textarea: "input",
  "file-upload": "input",

  // Action
  button: "action",
  "button-group": "action",
  "copy-button": "action",
  toggle: "action",
  "toggle-group": "action",
  rating: "action",

  // Data Display
  avatar: "data-display",
  badge: "data-display",
  chart: "data-display",
  "data-table": "data-display",
  kbd: "data-display",
  table: "data-display",
  "stats-card": "data-display",
  "status-indicator": "data-display",
  timeline: "data-display",
  typography: "data-display",
  "pricing-card": "data-display",

  // Feedback
  alert: "feedback",
  empty: "feedback",
  progress: "feedback",
  skeleton: "feedback",
  sonner: "feedback",
  spinner: "feedback",
  toast: "feedback",
  toaster: "feedback",

  // Layout
  accordion: "layout",
  "aspect-ratio": "layout",
  card: "layout",
  carousel: "layout",
  collapsible: "layout",
  drawer: "layout",
  item: "layout",
  resizable: "layout",
  "scroll-area": "layout",
  separator: "layout",
  sheet: "layout",
  sidebar: "layout",

  // Navigation
  breadcrumb: "navigation",
  menubar: "navigation",
  "navigation-menu": "navigation",
  pagination: "navigation",
  tabs: "navigation",

  // Overlay
  "alert-dialog": "overlay",
  "context-menu": "overlay",
  dialog: "overlay",
  "dropdown-menu": "overlay",
  "filter-bar": "overlay",
  "hover-card": "overlay",
  "notification-bell": "overlay",
  popover: "overlay",
  "share-dialog": "overlay",
  tooltip: "overlay",
  "user-menu": "overlay",

  // Utility
  direction: "utility",
  "use-mobile": "utility",
  "use-toast": "utility",
  utils: "utility",

  // Mukoko ecosystem
  "mukoko-sidebar": "mukoko",
  "mukoko-header": "mukoko",
  "mukoko-footer": "mukoko",
  "mukoko-bottom-nav": "mukoko",
  "detail-layout": "mukoko",
  "dashboard-layout": "mukoko",

  // Infrastructure
  observability: "infrastructure",
  "error-boundary": "infrastructure",
  "section-error-boundary": "infrastructure",
  timeout: "infrastructure",
  "circuit-breaker": "infrastructure",
  retry: "infrastructure",
  "fallback-chain": "infrastructure",
  "ai-safety": "infrastructure",
  chaos: "infrastructure",
  "lazy-section": "infrastructure",
  "use-memory-pressure": "infrastructure",
  architecture: "infrastructure",
}

const LAYER_MAP: Record<string, ComponentDocument["layer"]> = {
  // Mukoko ecosystem = composite/layout
  "mukoko-sidebar": "layout",
  "mukoko-header": "layout",
  "mukoko-footer": "layout",
  "mukoko-bottom-nav": "layout",
  "detail-layout": "layout",
  "dashboard-layout": "layout",
  // Infrastructure
  observability: "infrastructure",
  "error-boundary": "infrastructure",
  "section-error-boundary": "infrastructure",
  timeout: "infrastructure",
  "circuit-breaker": "infrastructure",
  retry: "infrastructure",
  "fallback-chain": "infrastructure",
  "ai-safety": "infrastructure",
  chaos: "infrastructure",
  "lazy-section": "infrastructure",
  "use-memory-pressure": "infrastructure",
  architecture: "infrastructure",
  // Cross-app composites
  "search-bar": "composite",
  "user-menu": "composite",
  "stats-card": "composite",
  "filter-bar": "composite",
  "share-dialog": "composite",
  "notification-bell": "composite",
  "file-upload": "composite",
  "copy-button": "composite",
  "status-indicator": "composite",
  timeline: "composite",
  "pricing-card": "composite",
  rating: "composite",
  "data-table": "composite",
  "date-picker": "composite",
}

const MUKOKO_COMPONENTS = new Set([
  "mukoko-sidebar",
  "mukoko-header",
  "mukoko-footer",
  "mukoko-bottom-nav",
  "detail-layout",
  "dashboard-layout",
  "search-bar",
  "user-menu",
  "stats-card",
  "filter-bar",
  "share-dialog",
  "notification-bell",
  "file-upload",
  "copy-button",
  "status-indicator",
  "timeline",
  "pricing-card",
  "rating",
  "data-table",
  "date-picker",
  "typography",
])

// ── Seed functions ──────────────────────────────────────────────────

interface RegistryJson {
  items: Array<{
    name: string
    type: string
    description: string
    dependencies?: string[]
    registryDependencies?: string[]
    files: Array<{ path: string; type: string }>
  }>
}

async function seedComponents(): Promise<number> {
  const registryPath = path.join(process.cwd(), "registry.json")
  const raw = fs.readFileSync(registryPath, "utf-8")
  const registry: RegistryJson = JSON.parse(raw)

  const now = new Date().toISOString()
  let count = 0

  for (const item of registry.items) {
    const doc: ComponentDocument = {
      _id: `component:${item.name}`,
      type: "component",
      name: item.name,
      registryType: item.type as ComponentDocument["registryType"],
      description: item.description,
      dependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
      files: item.files,
      category: CATEGORY_MAP[item.name] ?? "utility",
      layer: LAYER_MAP[item.name] ?? "primitive",
      isMukokoComponent: MUKOKO_COMPONENTS.has(item.name),
      addedInVersion: "7.0.0",
      tags: generateTags(item.name, item.description),
      createdAt: now,
      updatedAt: now,
    }

    await upsertDocument(doc)
    count++
  }

  return count
}

async function seedComponentDocs(): Promise<number> {
  // Dynamically import the hardcoded docs
  // We read the file and extract the data structure
  const docsPath = path.join(
    process.cwd(),
    "components/playground/component-docs.ts"
  )

  if (!fs.existsSync(docsPath)) {
    console.warn("[mukoko] component-docs.ts not found, skipping docs seed")
    return 0
  }

  // Parse the exported COMPONENT_DOCS object
  // Since we can't easily import .ts in a seed context, we'll use a simpler approach:
  // read the component-docs module at runtime
  let COMPONENT_DOCS: Record<
    string,
    { useCases: string[]; variants?: string[]; sizes?: string[]; features?: string[] }
  >

  try {
    // Try dynamic import (works in ts-node/tsx)
    const mod = await import(
      "@/components/playground/component-docs"
    )
    COMPONENT_DOCS = mod.COMPONENT_DOCS
  } catch {
    console.warn(
      "[mukoko] Could not import component-docs.ts, skipping docs seed"
    )
    return 0
  }

  const now = new Date().toISOString()
  let count = 0

  for (const [name, docData] of Object.entries(COMPONENT_DOCS)) {
    const doc: ComponentDocDocument = {
      _id: `doc:${name}`,
      type: "component-doc",
      componentName: name,
      useCases: docData.useCases,
      variants: docData.variants,
      sizes: docData.sizes,
      features: docData.features,
      createdAt: now,
      updatedAt: now,
    }

    await upsertDocument(doc)
    count++
  }

  return count
}

async function seedDemos(): Promise<number> {
  let DEMO_NAMES: Set<string>

  try {
    const mod = await import(
      "@/components/playground/demo-names"
    )
    DEMO_NAMES = mod.DEMO_NAMES
  } catch {
    console.warn("[mukoko] Could not import demo-names.ts, skipping demo seed")
    return 0
  }

  const now = new Date().toISOString()
  let count = 0

  for (const name of DEMO_NAMES) {
    const doc: DemoDocument = {
      _id: `demo:${name}`,
      type: "demo",
      componentName: name,
      hasDemo: true,
      demoType: "interactive",
      createdAt: now,
      updatedAt: now,
    }

    await upsertDocument(doc)
    count++
  }

  return count
}

function generateTags(name: string, description: string): string[] {
  const tags: string[] = []

  // Add category as tag
  if (CATEGORY_MAP[name]) tags.push(CATEGORY_MAP[name])

  // Add layer as tag
  if (LAYER_MAP[name]) tags.push(LAYER_MAP[name])

  // Mukoko tag
  if (MUKOKO_COMPONENTS.has(name)) tags.push("mukoko")

  // Extract keywords from description
  const keywords = description.toLowerCase().split(/\s+/)
  const useful = keywords.filter(
    (w) => w.length > 4 && !["with", "that", "from", "this", "component"].includes(w)
  )
  tags.push(...useful.slice(0, 3))

  return [...new Set(tags)]
}

// ── Main seed function ──────────────────────────────────────────────

export interface SeedResult {
  components: number
  docs: number
  demos: number
  total: number
  duration: number
}

/**
 * Seed the database from all hardcoded sources.
 * Idempotent — safe to run multiple times.
 */
export async function seedDatabase(
  options: { force?: boolean } = {}
): Promise<SeedResult> {
  const start = Date.now()

  if (!options.force && (await isSeeded())) {
    console.log("[mukoko] Database already seeded. Use force: true to re-seed.")
    const info = await getDb().info()
    return {
      components: 0,
      docs: 0,
      demos: 0,
      total: info.doc_count,
      duration: Date.now() - start,
    }
  }

  console.log("[mukoko] Seeding database...")

  const components = await seedComponents()
  console.log(`[mukoko]   ${components} component documents`)

  const docs = await seedComponentDocs()
  console.log(`[mukoko]   ${docs} documentation documents`)

  const demos = await seedDemos()
  console.log(`[mukoko]   ${demos} demo documents`)

  // Mark as seeded
  await upsertDocument({
    _id: "config:seeded",
    type: "config",
    key: "seeded",
    value: {
      timestamp: new Date().toISOString(),
      version: "7.0.0",
      counts: { components, docs, demos },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as ConfigDocument)

  const duration = Date.now() - start
  console.log(
    `[mukoko] Seeded ${components + docs + demos} documents in ${duration}ms`
  )

  return {
    components,
    docs,
    demos,
    total: components + docs + demos,
    duration,
  }
}

// ── CLI entry point ─────────────────────────────────────────────────

if (typeof require !== "undefined" && require.main === module) {
  seedDatabase({ force: true })
    .then((result) => {
      console.log("[mukoko] Seed complete:", result)
      process.exit(0)
    })
    .catch((err) => {
      console.error("[mukoko] Seed failed:", err)
      process.exit(1)
    })
}
