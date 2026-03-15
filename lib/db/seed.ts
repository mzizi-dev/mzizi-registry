/**
 * Seed the Supabase database from existing hardcoded sources.
 *
 * Migrates data from:
 *   - registry.json        → components table
 *   - component-docs.ts    → component_docs table (if available)
 *   - demo-names.ts        → component_demos table (if available)
 *
 * Uses upsert (ON CONFLICT) so it's idempotent — safe to run repeatedly.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY for write access.
 *
 * Usage:
 *   pnpm db:seed        # Seed from registry.json
 *   pnpm db:reseed      # Force re-seed (same thing, upsert is idempotent)
 */

import fs from "fs"
import path from "path"
import {
  upsertComponent,
  upsertComponentDoc,
  upsertComponentDemo,
  isSupabaseConfigured,
} from "./index"
import type { ComponentInsert, ComponentCategory } from "./types"

// ── Category mapping ────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, ComponentCategory> = {
  calendar: "input", checkbox: "input", combobox: "input", command: "input",
  "date-picker": "input", field: "input", form: "input", input: "input",
  "input-group": "input", "input-otp": "input", label: "input",
  "native-select": "input", "radio-group": "input", "search-bar": "input",
  select: "input", slider: "input", switch: "input", textarea: "input",
  "file-upload": "input",

  button: "action", "button-group": "action", "copy-button": "action",
  toggle: "action", "toggle-group": "action", rating: "action",

  avatar: "data-display", badge: "data-display", chart: "data-display",
  "data-table": "data-display", kbd: "data-display", table: "data-display",
  "stats-card": "data-display", "status-indicator": "data-display",
  timeline: "data-display", typography: "data-display",
  "pricing-card": "data-display",

  alert: "feedback", empty: "feedback", progress: "feedback",
  skeleton: "feedback", sonner: "feedback", spinner: "feedback",
  toast: "feedback", toaster: "feedback",

  accordion: "layout", "aspect-ratio": "layout", card: "layout",
  carousel: "layout", collapsible: "layout", drawer: "layout",
  item: "layout", resizable: "layout", "scroll-area": "layout",
  separator: "layout", sheet: "layout", sidebar: "layout",

  breadcrumb: "navigation", menubar: "navigation",
  "navigation-menu": "navigation", pagination: "navigation", tabs: "navigation",

  "alert-dialog": "overlay", "context-menu": "overlay", dialog: "overlay",
  "dropdown-menu": "overlay", "filter-bar": "overlay",
  "hover-card": "overlay", "notification-bell": "overlay",
  popover: "overlay", "share-dialog": "overlay", tooltip: "overlay",
  "user-menu": "overlay",

  direction: "utility", "use-mobile": "utility", "use-toast": "utility",
  utils: "utility",

  "mukoko-sidebar": "mukoko", "mukoko-header": "mukoko",
  "mukoko-footer": "mukoko", "mukoko-bottom-nav": "mukoko",
  "detail-layout": "mukoko", "dashboard-layout": "mukoko",

  observability: "infrastructure", "error-boundary": "infrastructure",
  "section-error-boundary": "infrastructure", timeout: "infrastructure",
  "circuit-breaker": "infrastructure", retry: "infrastructure",
  "fallback-chain": "infrastructure", "ai-safety": "infrastructure",
  chaos: "infrastructure", "lazy-section": "infrastructure",
  "use-memory-pressure": "infrastructure", architecture: "infrastructure",
}

const LAYER_MAP: Record<string, string> = {
  "mukoko-sidebar": "layout", "mukoko-header": "layout",
  "mukoko-footer": "layout", "mukoko-bottom-nav": "layout",
  "detail-layout": "layout", "dashboard-layout": "layout",

  observability: "infrastructure", "error-boundary": "infrastructure",
  "section-error-boundary": "infrastructure", timeout: "infrastructure",
  "circuit-breaker": "infrastructure", retry: "infrastructure",
  "fallback-chain": "infrastructure", "ai-safety": "infrastructure",
  chaos: "infrastructure", "lazy-section": "infrastructure",
  "use-memory-pressure": "infrastructure", architecture: "infrastructure",

  "search-bar": "composite", "user-menu": "composite",
  "stats-card": "composite", "filter-bar": "composite",
  "share-dialog": "composite", "notification-bell": "composite",
  "file-upload": "composite", "copy-button": "composite",
  "status-indicator": "composite", timeline: "composite",
  "pricing-card": "composite", rating: "composite",
  "data-table": "composite", "date-picker": "composite",
}

const MUKOKO_COMPONENTS = new Set([
  "mukoko-sidebar", "mukoko-header", "mukoko-footer", "mukoko-bottom-nav",
  "detail-layout", "dashboard-layout", "search-bar", "user-menu",
  "stats-card", "filter-bar", "share-dialog", "notification-bell",
  "file-upload", "copy-button", "status-indicator", "timeline",
  "pricing-card", "rating", "data-table", "date-picker", "typography",
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

  let count = 0

  for (const item of registry.items) {
    const component: ComponentInsert = {
      name: item.name,
      registry_type: item.type,
      description: item.description,
      dependencies: item.dependencies ?? [],
      registry_dependencies: item.registryDependencies ?? [],
      files: item.files,
      category: CATEGORY_MAP[item.name] ?? "utility",
      layer: LAYER_MAP[item.name] ?? "primitive",
      is_mukoko_component: MUKOKO_COMPONENTS.has(item.name),
      tags: generateTags(item.name, item.description),
      added_in_version: "7.0.0",
    }

    await upsertComponent(component)
    count++
  }

  return count
}

async function seedComponentDocs(): Promise<number> {
  let COMPONENT_DOCS: Record<
    string,
    { useCases: string[]; variants?: string[]; sizes?: string[]; features?: string[] }
  >

  try {
    const mod = await import("@/components/playground/component-docs")
    COMPONENT_DOCS = mod.COMPONENT_DOCS
  } catch {
    console.warn("[mukoko] component-docs.ts not available, skipping docs seed")
    return 0
  }

  let count = 0

  for (const [name, docData] of Object.entries(COMPONENT_DOCS)) {
    await upsertComponentDoc({
      component_name: name,
      use_cases: docData.useCases,
      variants: docData.variants ?? [],
      sizes: docData.sizes ?? [],
      features: docData.features ?? [],
    })
    count++
  }

  return count
}

async function seedDemos(): Promise<number> {
  let DEMO_NAMES: Set<string>

  try {
    const mod = await import("@/components/playground/demo-names")
    DEMO_NAMES = mod.DEMO_NAMES
  } catch {
    console.warn("[mukoko] demo-names.ts not available, skipping demo seed")
    return 0
  }

  let count = 0

  for (const name of DEMO_NAMES) {
    await upsertComponentDemo({
      component_name: name,
      has_demo: true,
      demo_type: "interactive",
    })
    count++
  }

  return count
}

function generateTags(name: string, description: string): string[] {
  const tags: string[] = []
  if (CATEGORY_MAP[name]) tags.push(CATEGORY_MAP[name])
  if (LAYER_MAP[name]) tags.push(LAYER_MAP[name])
  if (MUKOKO_COMPONENTS.has(name)) tags.push("mukoko")
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
 * Seed the Supabase database from all hardcoded sources.
 * Idempotent — uses upsert so it's safe to run repeatedly.
 */
export async function seedDatabase(): Promise<SeedResult> {
  const start = Date.now()

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  console.log("[mukoko] Seeding Supabase database...")

  const components = await seedComponents()
  console.log(`[mukoko]   ${components} components`)

  const docs = await seedComponentDocs()
  console.log(`[mukoko]   ${docs} docs`)

  const demos = await seedDemos()
  console.log(`[mukoko]   ${demos} demos`)

  const duration = Date.now() - start
  console.log(
    `[mukoko] Seeded ${components + docs + demos} rows in ${duration}ms`
  )

  return { components, docs, demos, total: components + docs + demos, duration }
}

// ── CLI entry point ─────────────────────────────────────────────────

const isMainModule =
  typeof require !== "undefined" && require.main === module

if (isMainModule) {
  seedDatabase()
    .then((result) => {
      console.log("[mukoko] Seed complete:", result)
      process.exit(0)
    })
    .catch((err) => {
      console.error("[mukoko] Seed failed:", err)
      process.exit(1)
    })
}
