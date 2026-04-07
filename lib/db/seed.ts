/* eslint-disable no-console -- CLI seed script with intentional stdout logging */

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
  upsertBrandMineral,
  upsertBrandSemanticColor,
  upsertBrandTypography,
  upsertBrandSpacing,
  upsertBrandEcosystem,
  upsertBrandMeta,
  upsertArchitecturePrinciple,
  upsertArchitectureFramework,
  upsertArchitectureDataLayer,
  upsertArchitectureCloudLayer,
  upsertArchitecturePipeline,
  upsertArchitectureDataOwnership,
  upsertArchitectureSovereignty,
  upsertArchitectureRemoved,
  isSupabaseConfigured,
} from "./index"
import type { ComponentInsert, ComponentCategory } from "./types"
import {
  MINERALS,
  SEMANTIC_COLORS,
  BACKGROUNDS,
  TYPE_SCALE,
  TYPOGRAPHY_FONTS,
  SPACING_SCALE,
  ECOSYSTEM_BRANDS,
  BRAND_SYSTEM,
  PHILOSOPHY,
  VOICE_AND_TONE,
  ACCESSIBILITY,
  RADII,
  COMPONENT_SPECS,
} from "@/lib/db/seed-data/brand"
import {
  ARCHITECTURE_PRINCIPLES,
  FRAMEWORK_DECISION,
  LOCAL_DATA_LAYER,
  CLOUD_LAYER,
  OPEN_DATA_PIPELINE,
  DATA_OWNERSHIP_RULES,
  SOVEREIGNTY_SUMMARY,
  REMOVED_TECHNOLOGIES,
} from "@/lib/db/seed-data/architecture"

// ── Category mapping ────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, ComponentCategory> = {
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

  button: "action",
  "button-group": "action",
  "copy-button": "action",
  toggle: "action",
  "toggle-group": "action",
  rating: "action",

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

  alert: "feedback",
  empty: "feedback",
  progress: "feedback",
  skeleton: "feedback",
  sonner: "feedback",
  spinner: "feedback",
  toast: "feedback",
  toaster: "feedback",

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

  breadcrumb: "navigation",
  menubar: "navigation",
  "navigation-menu": "navigation",
  pagination: "navigation",
  tabs: "navigation",

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

  direction: "utility",
  "use-mobile": "utility",
  "use-toast": "utility",
  utils: "utility",

  "mukoko-sidebar": "mukoko",
  "mukoko-header": "mukoko",
  "mukoko-footer": "mukoko",
  "mukoko-bottom-nav": "mukoko",
  "detail-layout": "mukoko",
  "dashboard-layout": "mukoko",

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

const LAYER_MAP: Record<string, string> = {
  "mukoko-sidebar": "layout",
  "mukoko-header": "layout",
  "mukoko-footer": "layout",
  "mukoko-bottom-nav": "layout",
  "detail-layout": "layout",
  "dashboard-layout": "layout",

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

  let count = 0

  for (const item of registry.items) {
    // Read source code from filesystem
    let sourceCode: string | null = null
    if (item.files.length > 0) {
      try {
        const filePath = path.join(process.cwd(), item.files[0].path)
        if (fs.existsSync(filePath)) {
          sourceCode = fs.readFileSync(filePath, "utf-8")
        }
      } catch {
        // Skip source code if file can't be read
      }
    }

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
      added_in_version: "4.0.1",
      source_code: sourceCode,
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

// ── Brand seed functions ───────────────────────────────────────────

async function seedBrandMinerals(): Promise<number> {
  let count = 0
  for (let i = 0; i < MINERALS.length; i++) {
    const m = MINERALS[i]
    await upsertBrandMineral({
      name: m.name,
      hex: m.hex,
      light_hex: m.lightHex,
      dark_hex: m.darkHex,
      container_light: m.containerLight,
      container_dark: m.containerDark,
      css_var: m.cssVar,
      origin: m.origin,
      symbolism: m.symbolism,
      usage: m.usage,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedBrandSemanticColors(): Promise<number> {
  let count = 0

  // Semantic colors
  for (const c of SEMANTIC_COLORS) {
    await upsertBrandSemanticColor({
      name: c.name,
      light_value: c.light,
      dark_value: c.dark,
      usage: c.usage,
      color_type: "semantic",
    })
    count++
  }

  // Background tokens
  for (const b of BACKGROUNDS) {
    await upsertBrandSemanticColor({
      name: `bg-${b.name}`,
      light_value: b.light,
      dark_value: b.dark,
      usage: b.usage,
      color_type: "background",
    })
    count++
  }

  return count
}

async function seedBrandTypography(): Promise<number> {
  let count = 0

  // Font families
  const fontEntries = Object.entries(TYPOGRAPHY_FONTS) as Array<
    [string, { family: string; usage: string; reason: string }]
  >
  for (let i = 0; i < fontEntries.length; i++) {
    const [key, font] = fontEntries[i]
    await upsertBrandTypography({
      name: `font-${key}`,
      entry_type: "font",
      usage: font.usage,
      family: font.family,
      reason: font.reason,
      sort_order: i,
    })
    count++
  }

  // Type scale entries
  for (let i = 0; i < TYPE_SCALE.length; i++) {
    const t = TYPE_SCALE[i]
    await upsertBrandTypography({
      name: t.name,
      entry_type: "scale",
      size_px: t.sizePx,
      size_rem: t.sizeRem,
      line_height: t.lineHeight,
      weight: t.weight,
      font: t.font,
      usage: t.usage,
      sort_order: fontEntries.length + i,
    })
    count++
  }

  return count
}

async function seedBrandSpacing(): Promise<number> {
  let count = 0
  for (let i = 0; i < SPACING_SCALE.length; i++) {
    const s = SPACING_SCALE[i]
    await upsertBrandSpacing({
      name: s.name,
      px: s.px,
      rem: s.rem,
      usage: s.usage,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedBrandEcosystem(): Promise<number> {
  let count = 0
  for (let i = 0; i < ECOSYSTEM_BRANDS.length; i++) {
    const b = ECOSYSTEM_BRANDS[i]
    await upsertBrandEcosystem({
      name: b.name,
      meaning: b.meaning,
      language: b.language,
      role: b.role,
      mineral: b.mineral,
      url: b.url,
      description: b.description,
      voice: b.voice,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedBrandMeta(): Promise<number> {
  await upsertBrandMeta({
    version: BRAND_SYSTEM.version,
    name: BRAND_SYSTEM.name,
    last_updated: BRAND_SYSTEM.lastUpdated,
    homepage: BRAND_SYSTEM.homepage,
    philosophy: PHILOSOPHY as unknown as Record<string, unknown>,
    voice_and_tone: VOICE_AND_TONE as unknown as Record<string, unknown>,
    accessibility: ACCESSIBILITY as unknown as Record<string, unknown>,
    radii: RADII as unknown as Record<string, unknown>,
    component_specs: COMPONENT_SPECS as unknown as Record<string, unknown>[],
  })
  return 1
}

// ── Architecture seed functions ────────────────────────────────────

async function seedArchitecturePrinciples(): Promise<number> {
  let count = 0
  for (let i = 0; i < ARCHITECTURE_PRINCIPLES.length; i++) {
    const p = ARCHITECTURE_PRINCIPLES[i]
    await upsertArchitecturePrinciple({
      name: p.name,
      title: p.title,
      description: p.description,
      rationale: p.rationale,
      implementation: p.implementation,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedArchitectureFramework(): Promise<number> {
  const fd = FRAMEWORK_DECISION
  await upsertArchitectureFramework({
    name: fd.name,
    approach: fd.approach,
    framework: fd.framework,
    rationale: fd.rationale,
    sovereignty_advantage: fd.sovereigntyAdvantage,
    platforms: fd.platforms as unknown as Record<string, unknown>[],
    harmony_os: fd.harmonyOs as unknown as Record<string, unknown>,
  })
  return 1
}

async function seedArchitectureDataLayer(): Promise<number> {
  let count = 0
  for (let i = 0; i < LOCAL_DATA_LAYER.length; i++) {
    const t = LOCAL_DATA_LAYER[i]
    await upsertArchitectureDataLayer({
      name: t.name,
      role: t.role,
      platform: t.platform,
      description: t.description,
      sovereignty: t.sovereignty as unknown as Record<string, unknown>,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedArchitectureCloudLayer(): Promise<number> {
  let count = 0
  for (let i = 0; i < CLOUD_LAYER.length; i++) {
    const s = CLOUD_LAYER[i]
    await upsertArchitectureCloudLayer({
      name: s.name,
      role: s.role,
      consistency_model: s.consistencyModel,
      database: s.database,
      data_categories: s.dataCategories,
      description: s.description,
      sovereignty: s.sovereignty as unknown as Record<string, unknown>,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedArchitecturePipeline(): Promise<number> {
  let count = 0
  for (let i = 0; i < OPEN_DATA_PIPELINE.length; i++) {
    const p = OPEN_DATA_PIPELINE[i]
    await upsertArchitecturePipeline({
      name: p.name,
      role: p.role,
      description: p.description,
      sovereignty: p.sovereignty as unknown as Record<string, unknown>,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedArchitectureDataOwnership(): Promise<number> {
  let count = 0
  for (let i = 0; i < DATA_OWNERSHIP_RULES.length; i++) {
    const r = DATA_OWNERSHIP_RULES[i]
    await upsertArchitectureDataOwnership({
      category: r.category,
      consistency_model: r.consistencyModel,
      database: r.database,
      examples: r.examples,
      conflict_resolution: r.conflictResolution,
      ownership: r.ownership,
      description: r.description,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedArchitectureSovereignty(): Promise<number> {
  let count = 0
  for (let i = 0; i < SOVEREIGNTY_SUMMARY.length; i++) {
    const a = SOVEREIGNTY_SUMMARY[i]
    await upsertArchitectureSovereignty({
      technology: a.technology,
      role: a.role,
      license: a.license,
      governance: a.governance,
      sovereignty_risk: a.sovereigntyRisk,
      forkable: a.forkable,
      self_hostable: a.selfHostable,
      rationale: a.rationale,
      sort_order: i,
    })
    count++
  }
  return count
}

async function seedArchitectureRemoved(): Promise<number> {
  let count = 0
  for (const r of REMOVED_TECHNOLOGIES) {
    await upsertArchitectureRemoved({
      name: r.name,
      previous_role: r.previousRole,
      reason: r.reason,
      replacement: r.replacement,
      migration_path: r.migrationPath,
    })
    count++
  }
  return count
}

// ── Main seed function ──────────────────────────────────────────────

export interface SeedResult {
  components: number
  docs: number
  demos: number
  brand: {
    minerals: number
    semanticColors: number
    typography: number
    spacing: number
    ecosystem: number
    meta: number
  }
  architecture: {
    principles: number
    framework: number
    dataLayer: number
    cloudLayer: number
    pipeline: number
    dataOwnership: number
    sovereignty: number
    removed: number
  }
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

  // Components
  const components = await seedComponents()
  console.log(`[mukoko]   ${components} components (with source_code)`)

  const docs = await seedComponentDocs()
  console.log(`[mukoko]   ${docs} docs`)

  const demos = await seedDemos()
  console.log(`[mukoko]   ${demos} demos`)

  // Brand
  console.log("[mukoko] Seeding brand data...")
  const brandMinerals = await seedBrandMinerals()
  console.log(`[mukoko]   ${brandMinerals} minerals`)

  const brandSemanticColors = await seedBrandSemanticColors()
  console.log(`[mukoko]   ${brandSemanticColors} semantic/background colors`)

  const brandTypography = await seedBrandTypography()
  console.log(`[mukoko]   ${brandTypography} typography entries`)

  const brandSpacing = await seedBrandSpacing()
  console.log(`[mukoko]   ${brandSpacing} spacing tokens`)

  const brandEcosystem = await seedBrandEcosystem()
  console.log(`[mukoko]   ${brandEcosystem} ecosystem brands`)

  const brandMeta = await seedBrandMeta()
  console.log(`[mukoko]   ${brandMeta} brand meta row`)

  // Architecture
  console.log("[mukoko] Seeding architecture data...")
  const archPrinciples = await seedArchitecturePrinciples()
  console.log(`[mukoko]   ${archPrinciples} principles`)

  const archFramework = await seedArchitectureFramework()
  console.log(`[mukoko]   ${archFramework} framework decision`)

  const archDataLayer = await seedArchitectureDataLayer()
  console.log(`[mukoko]   ${archDataLayer} data layer technologies`)

  const archCloudLayer = await seedArchitectureCloudLayer()
  console.log(`[mukoko]   ${archCloudLayer} cloud services`)

  const archPipeline = await seedArchitecturePipeline()
  console.log(`[mukoko]   ${archPipeline} pipeline stages`)

  const archDataOwnership = await seedArchitectureDataOwnership()
  console.log(`[mukoko]   ${archDataOwnership} data ownership rules`)

  const archSovereignty = await seedArchitectureSovereignty()
  console.log(`[mukoko]   ${archSovereignty} sovereignty assessments`)

  const archRemoved = await seedArchitectureRemoved()
  console.log(`[mukoko]   ${archRemoved} removed technologies`)

  const total =
    components +
    docs +
    demos +
    brandMinerals +
    brandSemanticColors +
    brandTypography +
    brandSpacing +
    brandEcosystem +
    brandMeta +
    archPrinciples +
    archFramework +
    archDataLayer +
    archCloudLayer +
    archPipeline +
    archDataOwnership +
    archSovereignty +
    archRemoved

  const duration = Date.now() - start
  console.log(`[mukoko] Seeded ${total} rows in ${duration}ms`)

  return {
    components,
    docs,
    demos,
    brand: {
      minerals: brandMinerals,
      semanticColors: brandSemanticColors,
      typography: brandTypography,
      spacing: brandSpacing,
      ecosystem: brandEcosystem,
      meta: brandMeta,
    },
    architecture: {
      principles: archPrinciples,
      framework: archFramework,
      dataLayer: archDataLayer,
      cloudLayer: archCloudLayer,
      pipeline: archPipeline,
      dataOwnership: archDataOwnership,
      sovereignty: archSovereignty,
      removed: archRemoved,
    },
    total,
    duration,
  }
}

// ── CLI entry point ─────────────────────────────────────────────────

const isMainModule = typeof require !== "undefined" && require.main === module

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
