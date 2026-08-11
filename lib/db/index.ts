/**
 * Mzizi data access.
 *
 * The registry is NOT in the database. This app builds it from files at build time and
 * serves it over `/api/v1/*`, and `mzizi-mcp` is an HTTP client of that API — so the
 * database is not in the serving path for components or doctrine.
 *
 *   Components  →  registry.json, one authored item per component (lib/registry.ts)
 *                  + source on disk under components/registry/ (lib/registry-source.ts)
 *   Doctrine    →  content/doctrine/<collection>/<slug>.mdx    (lib/doctrine.ts)
 *
 * This block said `content/registry/<collection>/<name>.json`. That directory
 * does not exist and never did — `content/` holds `doctrine/` only, and
 * `lib/registry.ts` reads a single `registry.json` at the repo root. A path in a
 * header is the first thing someone greps for, so a plausible-but-absent one
 * costs more than no path at all.
 *
 * What is still Supabase, and why — it is written by a machine, not a person:
 *
 *   component_versions / tool_versions  — version history
 *   changelog                           — release state
 *   brand_*                             — tokens (pnpm tokens:sync generates the
 *                                         repo artifacts; migration pending)
 *   fundi_issues / fundi_healing_log    — the issue log and the self-healing log
 *   observability_events / chaos_events / usage_events — telemetry
 *
 * See docs/db-contents-rule.md for the rule and the live audit.
 *
 * Env vars (still needed for the above):
 *   NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — Public anon key (read-only via RLS)
 *   SUPABASE_SERVICE_ROLE_KEY     — Service role key (write access, server only)
 *
 * Usage:
 *   import { getComponent, getAllComponents } from "@/lib/db"
 *   const button = await getComponent("button")   // reads a file, not a row
 */

import { doctrineRows, readDoctrineSorted, DOCTRINE } from "@/lib/doctrine"
import { readComponent, readComponents, readNodeCounts, type RegistryItem } from "@/lib/registry"
import { createClient } from "@supabase/supabase-js"
import type {
  ComponentRow,
  ComponentDocRow,
  ComponentDemoRow,
  ComponentWithDocs,
  ComponentInsert,
  ComponentDocInsert,
  ComponentDemoInsert,
  DatabaseInfo,
  BrandMineralRow,
  BrandMineralInsert,
  BrandSemanticColorRow,
  BrandSemanticColorInsert,
  BrandTypographyRow,
  BrandTypographyInsert,
  BrandSpacingRow,
  BrandSpacingInsert,
  BrandEcosystemRow,
  BrandEcosystemInsert,
  BrandMetaRow,
  BrandMetaInsert,
  ArchitecturePrincipleRow,
  ArchitectureFrameworkRow,
  ArchitectureDataLayerRow,
  ArchitectureCloudLayerRow,
  ArchitecturePipelineRow,
  ArchitectureDataOwnershipRow,
  ArchitectureSovereigntyRow,
  ArchitectureRemovedRow,
  AiInstructionRow,
  ChangelogRow,
  ChangelogInsert,
  ChangelogListRow,
  ComponentVersionRow,
  McpToolRegistryRow,
  HelixClass,
  HelixModel,
  HelixNode,
  HelixStrand,
  SkillRow,
  SkillSummary,
  UbuntuPillarRow,
  UbuntuPrincipleRow,
  FundiIssueRow,
  ObservabilityEventRow,
  ChaosEventRow,
  SystemCountsRow,
} from "./types"

// ── Supabase clients ────────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

type SupabaseClient = ReturnType<typeof createClient>

/**
 * Public client (uses anon key, respects RLS).
 * Safe for client-side and server-side reads.
 */
let _publicClient: SupabaseClient | null = null

export function getPublicClient(): SupabaseClient {
  if (!_publicClient) {
    _publicClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _publicClient
}

/**
 * Admin client (uses service_role key, bypasses RLS).
 * Server-only — for seed scripts and write operations.
 */
let _adminClient: SupabaseClient | null = null

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _adminClient
}

/**
 * Check if Supabase is configured (URL + anon key — enough for public reads).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

/**
 * Check if the service-role (admin) client is configured. Admin/write paths
 * must guard on this so they no-op cleanly when the secret is absent (e.g. in
 * preview/CI) instead of constructing a client with an empty key.
 */
export function isAdminConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey)
}

// ── Component docs, from the manifest ───────────────────────────────
//
// Use cases, variants, sizes, features, a11y notes and the demo flag were the
// last authored content living only in Supabase — first in the dropped
// `component_docs` / `component_demos` tables, then inside each row's JSON
// document. They are now the `meta` block on the item in `registry.json`, beside
// the dependencies and files they describe.
//
// That move fixed a defect nobody could see from the outside. Every read below
// filtered `.eq("collection", "components")`, but the registry spans thirteen
// collections — so `/api/v1/ui/{name}/docs` answered 200 with empty arrays for
// every component outside that one collection, which is most of them. An empty
// payload and "this component documents nothing" are indistinguishable over
// HTTP. The manifest has one entry per component and no collection to filter on,
// so the whole class is gone rather than fixed.

type RegistryMeta = {
  useCases?: string[]
  variants?: string[]
  sizes?: string[]
  features?: string[]
  a11y?: string[]
  examples?: ComponentDocRow["examples"]
  hasDemo?: boolean
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

function metaOf(name: string): RegistryMeta | null {
  const item = readComponent(name)
  if (!item) return null
  return ((item as unknown as { meta?: RegistryMeta }).meta ?? {}) as RegistryMeta
}

function docRowFromMeta(name: string, meta: RegistryMeta): ComponentDocRow {
  return {
    id: 0,
    component_name: name,
    use_cases: asStringArray(meta.useCases),
    variants: asStringArray(meta.variants),
    sizes: asStringArray(meta.sizes),
    features: asStringArray(meta.features),
    a11y: asStringArray(meta.a11y),
    examples: Array.isArray(meta.examples) ? meta.examples : [],
    // The manifest is a file in git, so its timestamps belong to the commit, not
    // to a row. Empty rather than invented — a fabricated `updated_at` would read
    // as a real edit time to every consumer of this shape.
    created_at: "",
    updated_at: "",
  }
}

// ── Component queries ───────────────────────────────────────────────

/**
 * Get a single component by name.
 */
export async function getComponent(name: string): Promise<RegistryItem | null> {
  return readComponent(name)
}

/**
 * Get all components, sorted by name.
 *
 * Returns `RegistryItem`, which is what `readComponents()` actually produces. It used to
 * claim `ComponentRow` — the retired Supabase row shape — through an `as unknown as` cast,
 * and that cast was not cosmetic: `ComponentRow` names `registry_type` and
 * `registry_dependencies` where a registry item has `type` and `registryDependencies`, so
 * `/api/v1/ui` read two fields that do not exist, TypeScript approved, and the index
 * silently served every item without its `type`. A cast that renames fields is a lie the
 * compiler is obliged to believe.
 */
export async function getAllComponents(): Promise<RegistryItem[]> {
  return readComponents()
}

/**
 * Get components by category.
 */
export async function getComponentsByCategory(category: string): Promise<ComponentRow[]> {
  return readComponents().filter(
    (c) => (c as unknown as { category?: string }).category === category
  ) as unknown as ComponentRow[]
}

/**
 * Get components by layer.
 */
export async function getComponentsByLayer(layer: string): Promise<ComponentRow[]> {
  return readComponents().filter(
    (c) => String(c.node) === layer || (c as unknown as { layer?: string }).layer === layer
  ) as unknown as ComponentRow[]
}

/**
 * Search components by name or description (case-insensitive).
 */
export async function searchComponents(query: string): Promise<ComponentRow[]> {
  // Plain substring match over the files. The old implementation had to strip
  // PostgREST-significant characters to avoid filter-structure injection; reading
  // files removes that attack surface entirely rather than sanitising for it.
  const q = query.trim().toLowerCase()
  if (!q) return []
  return readComponents().filter((c) => {
    const name = String(c.name ?? "").toLowerCase()
    const desc = String(c.description ?? "").toLowerCase()
    return name.includes(q) || desc.includes(q)
  }) as unknown as ComponentRow[]
}

// ── Component documentation queries ─────────────────────────────────

/**
 * Get documentation for a component.
 */
export async function getComponentDoc(name: string): Promise<ComponentDocRow | null> {
  const meta = metaOf(name)
  if (!meta) return null
  return docRowFromMeta(name, meta)
}

/**
 * Get all component documentation.
 */
export async function getAllComponentDocs(): Promise<ComponentDocRow[]> {
  return readComponents().map((c) =>
    docRowFromMeta(c.name, ((c as unknown as { meta?: RegistryMeta }).meta ?? {}) as RegistryMeta)
  )
}

// ── Demo queries ────────────────────────────────────────────────────

/**
 * Whether a component ships a hand-written demo.
 *
 * This is NOT "can it be previewed". `AutoPreview` renders the real component
 * from disk for everything, so a component without a demo still has a preview —
 * gating the Preview tab on this flag is what hid it for 525 of 571 components.
 */
export async function hasDemoFor(name: string): Promise<boolean> {
  return Boolean(metaOf(name)?.hasDemo)
}

/**
 * Get all component names that ship a hand-written demo.
 */
export async function getDemoNames(): Promise<string[]> {
  return readComponents()
    .filter((c) => Boolean((c as unknown as { meta?: RegistryMeta }).meta?.hasDemo))
    .map((c) => c.name)
}

// ── Enriched queries ────────────────────────────────────────────────

/**
 * Get a component with its documentation and demo info.
 */
export async function getComponentWithDocs(name: string): Promise<ComponentWithDocs | null> {
  const component = await getComponent(name)
  if (!component) return null

  const [docs, hasDemo] = await Promise.all([getComponentDoc(name), hasDemoFor(name)])
  const demo: ComponentDemoRow | null = hasDemo
    ? {
        id: 0,
        component_name: name,
        has_demo: true,
        demo_type: null,
        created_at: "",
        updated_at: "",
      }
    : null

  return { ...component, docs, demo }
}

/**
 * Get all components with their docs (for catalog pages).
 */
export async function getAllComponentsWithDocs(): Promise<ComponentWithDocs[]> {
  const [components, docs, demoNames] = await Promise.all([
    getAllComponents(),
    getAllComponentDocs(),
    getDemoNames().then((names) => new Set(names)),
  ])

  const docMap = new Map(docs.map((d) => [d.component_name, d]))

  return components.map((component) => ({
    ...component,
    docs: docMap.get(component.name) ?? null,
    demo: demoNames.has(component.name)
      ? {
          id: 0,
          component_name: component.name,
          has_demo: true,
          demo_type: null,
          created_at: "",
          updated_at: "",
        }
      : null,
  }))
}

// ── Write operations (server-only, uses service_role) ───────────────

/**
 * Upsert a component (insert or update on conflict).
 */
export async function upsertComponent(component: ComponentInsert): Promise<ComponentRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("components")
    .upsert(component, { onConflict: "name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ComponentRow
}

/**
 * Upsert component documentation.
 */
export async function upsertComponentDoc(doc: ComponentDocInsert): Promise<ComponentDocRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("component_docs")
    .upsert(doc, { onConflict: "component_name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ComponentDocRow
}

/**
 * Upsert a component demo.
 */
export async function upsertComponentDemo(demo: ComponentDemoInsert): Promise<ComponentDemoRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("component_demos")
    .upsert(demo, { onConflict: "component_name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ComponentDemoRow
}

/**
 * Delete a component and its docs/demos (cascade).
 */
export async function deleteComponent(name: string): Promise<void> {
  const { error } = await getAdminClient().from("components").delete().eq("name", name)

  if (error) throw new Error(error.message)
}

// ── Registry count queries ──────────────────────────────────────────

export interface RegistryCounts {
  total: number
  ui: number
  blocks: number
  hooks: number
  lib: number
}

/**
 * Get live component counts from the database, grouped by registry_type.
 * Used to replace hardcoded numbers in landing page components.
 * Returns zeros if database is not configured or not seeded.
 */
export async function getRegistryCounts(): Promise<RegistryCounts> {
  // Counted from the manifest joined to the files on disk, so the number cannot
  // disagree with what a consumer can actually install — five COUNT queries
  // against a view could, and the view predicate hiding 249 components for weeks
  // is what that looks like in practice.
  const items = readComponents()
  const by = (type: string) => items.filter((c) => c.type === type).length
  return {
    total: items.length,
    ui: by("registry:ui"),
    blocks: by("registry:block"),
    hooks: by("registry:hook"),
    lib: by("registry:lib"),
  }
}

// ── Database info ───────────────────────────────────────────────────

/**
 * Get database status and counts.
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  // Components, their docs and their demo flags are all in the repo now, so this
  // reports the repo — `provider: "registry"`, not `"supabase"`. Reporting the
  // old provider would be the same drift this migration removed: a status
  // endpoint naming a store it no longer reads.
  const items = readComponents()
  return {
    provider: "registry",
    components: items.length,
    docs: items.filter(
      (c) => Object.keys((c as unknown as { meta?: RegistryMeta }).meta ?? {}).length > 0
    ).length,
    demos: items.filter((c) => Boolean((c as unknown as { meta?: RegistryMeta }).meta?.hasDemo))
      .length,
    status: "connected",
  }
}

// ── Brand queries ──────────────────────────────────────────────────

/**
 * Get all brand minerals, sorted by sort_order.
 */
export async function getMinerals(): Promise<BrandMineralRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_minerals")
    .select("*")
    .order("sort_order")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandMineralRow[]
}

/**
 * Get all semantic colors.
 */
export async function getSemanticColors(): Promise<BrandSemanticColorRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_semantic_colors")
    .select("*")
    .order("name")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandSemanticColorRow[]
}

/**
 * Get semantic colors filtered by type (e.g. 'semantic' or 'background').
 */
export async function getSemanticColorsByType(colorType: string): Promise<BrandSemanticColorRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_semantic_colors")
    .select("*")
    .eq("color_type", colorType)
    .order("name")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandSemanticColorRow[]
}

/**
 * Get all typography entries, sorted by sort_order.
 */
export async function getTypography(): Promise<BrandTypographyRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_typography")
    .select("*")
    .order("sort_order")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandTypographyRow[]
}

/**
 * Get typography entries by type ('font' or 'scale').
 */
export async function getTypographyByType(entryType: string): Promise<BrandTypographyRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_typography")
    .select("*")
    .eq("entry_type", entryType)
    .order("sort_order")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandTypographyRow[]
}

/**
 * Get all spacing tokens, sorted by sort_order.
 */
export async function getSpacing(): Promise<BrandSpacingRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_spacing")
    .select("*")
    .order("sort_order")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandSpacingRow[]
}

/**
 * Get all ecosystem brands, sorted by sort_order.
 */
export async function getEcosystemBrands(): Promise<BrandEcosystemRow[]> {
  const { data, error } = await getPublicClient()
    .from("brand_ecosystem")
    .select("*")
    .order("sort_order")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BrandEcosystemRow[]
}

/**
 * Get brand metadata (single row).
 */
export async function getBrandMeta(): Promise<BrandMetaRow | null> {
  const { data, error } = await getPublicClient().from("brand_meta").select("*").limit(1).single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return data as unknown as BrandMetaRow
}

/**
 * Get the full brand system from DB, assembled into the same shape as BRAND_SYSTEM.
 */
export async function getBrandSystem(): Promise<{
  minerals: BrandMineralRow[]
  semanticColors: BrandSemanticColorRow[]
  backgrounds: BrandSemanticColorRow[]
  typography: BrandTypographyRow[]
  spacing: BrandSpacingRow[]
  ecosystem: BrandEcosystemRow[]
  meta: BrandMetaRow | null
} | null> {
  try {
    const [minerals, semanticColors, backgrounds, typography, spacing, ecosystem, meta] =
      await Promise.all([
        getMinerals(),
        getSemanticColorsByType("semantic"),
        getSemanticColorsByType("background"),
        getTypography(),
        getSpacing(),
        getEcosystemBrands(),
        getBrandMeta(),
      ])

    if (minerals.length === 0 && !meta) return null

    return { minerals, semanticColors, backgrounds, typography, spacing, ecosystem, meta }
  } catch {
    return null
  }
}

// ── Architecture queries ───────────────────────────────────────────

/**
 * Get all architecture principles, sorted by sort_order.
 */
export async function getArchitecturePrinciples(): Promise<ArchitecturePrincipleRow[]> {
  return doctrineRows<ArchitecturePrincipleRow>(DOCTRINE.principles)
}

/**
 * Get the framework decision (single row).
 */
export async function getFrameworkDecision(): Promise<ArchitectureFrameworkRow | null> {
  const rows = doctrineRows<ArchitectureFrameworkRow>(DOCTRINE.framework)
  return rows[0] ?? null
}

/**
 * Get local data layer technologies, sorted by sort_order.
 */
export async function getLocalDataLayer(): Promise<ArchitectureDataLayerRow[]> {
  return doctrineRows<ArchitectureDataLayerRow>(DOCTRINE.dataLayer)
}

/**
 * Get cloud layer services, sorted by sort_order.
 */
export async function getCloudLayer(): Promise<ArchitectureCloudLayerRow[]> {
  return doctrineRows<ArchitectureCloudLayerRow>(DOCTRINE.cloudLayer)
}

/**
 * Get pipeline stages, sorted by sort_order.
 */
export async function getPipeline(): Promise<ArchitecturePipelineRow[]> {
  return doctrineRows<ArchitecturePipelineRow>(DOCTRINE.pipeline)
}

/**
 * Get data ownership rules, sorted by sort_order.
 */
export async function getDataOwnership(): Promise<ArchitectureDataOwnershipRow[]> {
  return doctrineRows<ArchitectureDataOwnershipRow>(DOCTRINE.dataOwnership)
}

/**
 * Get sovereignty assessments, sorted by sort_order.
 */
export async function getSovereignty(): Promise<ArchitectureSovereigntyRow[]> {
  return doctrineRows<ArchitectureSovereigntyRow>(DOCTRINE.sovereignty)
}

/**
 * Get removed technologies.
 */
export async function getRemovedTechnologies(): Promise<ArchitectureRemovedRow[]> {
  return doctrineRows<ArchitectureRemovedRow>(DOCTRINE.removed)
}

// ── Brand write operations (server-only) ───────────────────────────

/**
 * Upsert a brand mineral.
 */
export async function upsertBrandMineral(mineral: BrandMineralInsert): Promise<BrandMineralRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("brand_minerals")
    .upsert(mineral, { onConflict: "name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BrandMineralRow
}

/**
 * Upsert a semantic color.
 */
export async function upsertBrandSemanticColor(
  color: BrandSemanticColorInsert
): Promise<BrandSemanticColorRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("brand_semantic_colors")
    .upsert(color, { onConflict: "name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BrandSemanticColorRow
}

/**
 * Upsert a typography entry.
 */
export async function upsertBrandTypography(
  entry: BrandTypographyInsert
): Promise<BrandTypographyRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("brand_typography")
    .upsert(entry, { onConflict: "name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BrandTypographyRow
}

/**
 * Upsert a spacing token.
 */
export async function upsertBrandSpacing(spacing: BrandSpacingInsert): Promise<BrandSpacingRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("brand_spacing")
    .upsert(spacing, { onConflict: "name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BrandSpacingRow
}

/**
 * Upsert an ecosystem brand.
 */
export async function upsertBrandEcosystem(
  brand: BrandEcosystemInsert
): Promise<BrandEcosystemRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("brand_ecosystem")
    .upsert(brand, { onConflict: "name" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as BrandEcosystemRow
}

/**
 * Upsert brand metadata (single row — deletes existing then inserts).
 */
export async function upsertBrandMeta(meta: BrandMetaInsert): Promise<BrandMetaRow> {
  const admin = getAdminClient()

  // Delete existing rows (single row table)
  await admin.from("brand_meta").delete().neq("id", 0)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).from("brand_meta").insert(meta).select().single()

  if (error) throw new Error(error.message)
  return data as BrandMetaRow
}

// ── Architecture write operations (server-only) ────────────────────

// ── AI instruction queries ─────────────────────────────────────────

/**
 * Get an AI instruction by name (e.g., "nyuchi-mcp-system-prompt").
 */
export async function getAiInstruction(name: string): Promise<AiInstructionRow | null> {
  return (
    doctrineRows<AiInstructionRow>(DOCTRINE.aiInstructions).find((r) => r.name === name) ?? null
  )
}

/**
 * Get an AI instruction by target audience (mcp-server, claude, github-copilot, cursor).
 */
export async function getAiInstructionByTarget(target: string): Promise<AiInstructionRow | null> {
  return (
    doctrineRows<AiInstructionRow>(DOCTRINE.aiInstructions).find((r) => r.target === target) ?? null
  )
}

/**
 * Get all AI instructions.
 */
export async function getAllAiInstructions(): Promise<AiInstructionRow[]> {
  return doctrineRows<AiInstructionRow>(DOCTRINE.aiInstructions)
}

// ── Changelog queries ───────────────────────────────────────────────

/**
 * Every release, newest first, classified.
 *
 * Reads the `releases` view rather than `changelog` directly. Ordering the raw
 * table by `released_at DESC` — what this did — opened the changelog with
 * 4.1.8, 4.1.1, 4.1.2, 4.1.0 in arbitrary order and put the current release,
 * 1.0.0, at position ELEVEN, because ten rows have no `released_at` and
 * Postgres sorts NULLS FIRST on DESC.
 *
 * The view adds what a reader needs to classify a release rather than just
 * read its title: `line` (the public 1.x line vs the pre-1.0 internal 4.x one
 * it superseded), `release_kind` (initial / major / minor / patch, compared
 * within its own line), and `components_touched`. It is ordered in the view, so
 * no `.order()` here — adding one would silently override the two-era sort.
 */
export async function getChangelogEntries(): Promise<ChangelogRow[]> {
  const { data, error } = await getPublicClient().from("releases").select("*")

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ChangelogRow[]
}

/**
 * Every changelog entry published under a version.
 *
 * Returns an ARRAY because a version number is not unique here: eight of them
 * carry two or three entries with genuinely different titles and content
 * (4.0.31 has three — Ubuntu pillars, a documentation sweep, and an audit
 * remediation). They are separate changesets that shared a version number, not
 * duplicates of one another, so picking one would silently drop real release
 * notes.
 *
 * This used `.single()`, and PostgREST answers PGRST116 for BOTH "no rows" and
 * "more than one row". The `if (error.code === "PGRST116") return null` branch
 * therefore turned "this version has three entries" into "this version does not
 * exist", and `/api/v1/changelog/4.0.31` answered 404 for a release that is in
 * the table three times. Eight of sixty-four releases were unreachable that way.
 */
export async function getChangelogByVersion(version: string): Promise<ChangelogRow[]> {
  const { data, error } = await getPublicClient()
    .from("changelog")
    .select("*")
    .eq("version", version)
    .order("created_at", { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ChangelogRow[]
}

/**
 * The current release version.
 *
 * Reads the `releases` view, which orders across both version eras. Ordering
 * `changelog` by `released_at DESC` — what this did — is wrong twice: ten rows
 * have no `released_at`, and Postgres sorts NULLS FIRST on DESC, so this
 * returned **4.1.8**. That is not the current version and not even the newest
 * of the undated rows; it was whichever null landed first.
 *
 * Sorting by semver instead would return 4.2.0, also wrong: the version line
 * was deliberately reset and 1.0.0 supersedes the whole 4.x line (§14). The
 * view carries that as `line` / `line_rank` and is already sorted, so the first
 * row is the answer.
 */
export async function getLatestVersion(): Promise<string | null> {
  const { data, error } = await getPublicClient().from("releases").select("version").limit(1)

  if (error) throw new Error(error.message)
  return (data as unknown as Array<{ version: string }>)?.[0]?.version ?? null
}

/**
 * Upsert a changelog entry (admin only).
 */
export async function upsertChangelog(entry: ChangelogInsert): Promise<ChangelogRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("changelog")
    .upsert(entry, { onConflict: "version" })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as ChangelogRow
}

// ── Component version queries ───────────────────────────────────────

/**
 * Get version history for a component, most recent first.
 */
/**
 * The columns `/api/v1/ui/{name}/versions` serves.
 *
 * Named explicitly rather than `*` because the `component_versions` view also
 * projects `source_code` out of each archived version's `sourceCode` key, and
 * `*` served it: a public, and by then STALE, second copy of component source
 * that lives on disk in git (§8.3). Component source has exactly one home and
 * this route is not it. A new column added to the view is now invisible here
 * until someone adds it deliberately, which is the point.
 */
const VERSION_COLUMNS = [
  "component_name",
  "entity_name",
  "entity_kind",
  "version",
  "version_number",
  "change_type",
  "change_kind",
  "release",
  "release_marker",
  "release_breaking",
  "comment",
  "description",
  "status",
  "ecosystem_node",
  "category",
  "subcategory",
  "tags",
  "changed_by",
  "created_at",
].join(", ")

export async function getComponentVersions(componentName: string): Promise<ComponentVersionRow[]> {
  const { data, error } = await getPublicClient()
    .from("component_versions")
    .select(VERSION_COLUMNS)
    .eq("component_name", componentName)
    // `component_versions` has no `released_at` — it is a VIEW whose timestamp
    // column is `created_at`. Ordering by a column that does not exist made
    // PostgREST error, `getComponentVersions` throw, and
    // `/api/v1/ui/{name}/versions` answer 500 for every component in the
    // registry. `changelog` does have `released_at`, which is why the two other
    // call sites in this file are correct and only this one was wrong.
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ComponentVersionRow[]
}

/**
 * Get a specific component version.
 */
export async function getComponentVersion(
  componentName: string,
  version: string
): Promise<ComponentVersionRow | null> {
  const { data, error } = await getPublicClient()
    .from("component_versions")
    .select(VERSION_COLUMNS)
    .eq("component_name", componentName)
    .eq("version", version)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return data as unknown as ComponentVersionRow
}

// ── Design token queries ────────────────────────────────────────────
//
// `getDesignTokens()` is DELETED, not repointed.
//
// It selected `source_code` from the `components` view where
// `name = 'nyuchi-tokens'` and JSON.parse'd the result. That column has been
// null on every row since component source moved to disk (§8.3), so the
// function could only ever return null — and it had no callers anywhere in
// `app/`, `lib/`, `components/` or `scripts/`.
//
// Repointing it at the file would have been the wrong fix twice over: nothing
// wants it, and the token pipeline already runs the other way. `pnpm
// tokens:sync` GENERATES `lib/tokens/palette.generated.ts` and the
// `tokens:generated` block of `app/globals.css` from the Supabase
// `styling-minerals` / `styling-heritage-colors` collections, with
// `pnpm tokens:verify` as the drift gate (§8.4.1). A second reader that parsed
// a component's source back into a token object would be a third copy of the
// palette that nothing keeps in step.
//
// The `components` view no longer has a `source_code` column at all, so this
// query would now raise 42703 rather than quietly returning null.

// ── Layer summary query ─────────────────────────────────────────────

export interface LayerSummary {
  layer: string
  total: number
  byCategory: Record<string, number>
  components: Array<{ name: string; category: string | null; description: string }>
}

/**
 * Get a summary of components in a given architecture layer.
 * Used by the MCP server's get_layer_summary tool.
 */
export async function getLayerSummary(layer: string): Promise<LayerSummary> {
  const components = await getComponentsByLayer(layer)

  const byCategory: Record<string, number> = {}
  for (const c of components) {
    const key = c.category ?? "uncategorized"
    byCategory[key] = (byCategory[key] ?? 0) + 1
  }

  return {
    layer,
    total: components.length,
    byCategory,
    components: components.map((c) => ({
      name: c.name,
      category: c.category,
      description: c.description,
    })),
  }
}

// ── Component links (RPC wrapper) ───────────────────────────────────

export interface ComponentLink {
  url: string
  kind: string
  title?: string
}

/**
 * Get portal URLs for a component via the Supabase RPC `get_component_links`.
 * Falls back to canonical portal URLs if the RPC is not available.
 */
export async function getComponentLinks(name: string): Promise<ComponentLink[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc("get_component_links", {
    component_name: name,
  })

  if (!error && Array.isArray(data)) {
    return data as ComponentLink[]
  }

  // Fallback: canonical URL pattern for the portal
  return [
    { url: `https://mzizi.dev/components/${name}`, kind: "portal" },
    { url: `https://mzizi.dev/api/v1/ui/${name}`, kind: "api" },
  ]
}

// ── Architecture — the Mzizi DNA double helix ────────────────────────
//
// `component_documents` / `documentation-architecture-{nodes,strands}` is
// the source of truth, and the same one the MCP serves. The axis-era
// helpers that used to live here — `getLayerDetail()` (which wrapped
// `get_layer_detail(p_layer_number)` and returned an `axis_name` per row,
// capped 1-10) and `getArchitectureSnapshot()` (which reshaped
// `get_architecture()` into `axes[].layers[]`) — are deleted rather than
// rewired. Emitting a strand through a field named `axis_*` would look
// correct and teach the retired model to every consumer that read it.
//
// No in-code fallback dataset is kept: the DB is the only source of truth
// and seeding happens out-of-band, so callers must tolerate an empty
// model and render an honest empty state rather than implying data.

/**
 * Live per-node component counts via the `get_node_counts()` RPC, keyed
 * by node number. Empty object if Supabase isn't configured.
 */
export async function getNodeCounts(): Promise<Record<number, number>> {
  return readNodeCounts()
}

/**
 * The Mzizi DNA double helix — nodes (on engineering strands) + rungs
 * (cross-cutting base pairs) + the six strands, read live from
 * `component_documents` (`documentation-architecture-{nodes,strands}`),
 * the single source of truth the MCP serves. Per-node component counts
 * come from `get_node_counts()`. Returns empty arrays if Supabase isn't
 * configured or the collections are empty — callers render an empty
 * state. There are no axes and no outliers.
 */
export async function getHelixModel(): Promise<HelixModel> {
  const empty: HelixModel = { nodes: [], rungs: [], strands: [] }

  // The helix comes from content/doctrine, not Supabase. Node counts still do — a
  // count is derived from whatever components exist, which is database-owned.
  // Deliberately NOT gated on isSupabaseConfigured(): the helix is files now, so
  // /api/v1/architecture must keep answering when the database is unreachable.
  const nodeRes = {
    error: null,
    data: readDoctrineSorted(DOCTRINE.nodes).map((d) => ({ document: d.data })),
  }
  const strandRes = {
    error: null,
    data: readDoctrineSorted(DOCTRINE.strands).map((d) => ({ document: d.data })),
  }
  const counts = isSupabaseConfigured() ? await getNodeCounts() : {}

  if (nodeRes.error || !Array.isArray(nodeRes.data) || nodeRes.data.length === 0) return empty

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const read = (row: any) => (row?.document ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === "string" ? v : "")
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0)

  const strandRows: unknown[] = Array.isArray(strandRes?.data) ? strandRes.data : []
  const strands: HelixStrand[] = strandRows
    .map(read)
    .map((d) => ({
      name: str(d.strand) || str(d._id),
      title: str(d.title),
      backbone: str(d.backbone),
      covenant: str(d.covenant),
      description: str(d.description),
      sort_order: num(d.sort_order),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)

  const backboneByStrand = new Map<string, string>(strands.map((s) => [s.name, s.backbone]))

  const all: HelixNode[] = (nodeRes.data as unknown[])
    .map(read)
    .map((d) => {
      const strand = d.strand == null ? null : str(d.strand)
      const nodeNumber = num(d.node_number)
      return {
        node_number: nodeNumber,
        sub_label: str(d.sub_label) || (nodeNumber ? `N${nodeNumber}` : ""),
        title: str(d.title),
        type: d.type === "rung" ? ("rung" as const) : ("node" as const),
        strand,
        backbone: strand ? (backboneByStrand.get(strand) ?? null) : null,
        role: str(d.role),
        covenant: str(d.covenant),
        description: str(d.description),
        stakeholder: str(d.stakeholder),
        implementation_rules: Array.isArray(d.implementation_rules)
          ? (d.implementation_rules as string[])
          : [],
        sort_order: num(d.sort_order) || nodeNumber,
        component_count: counts[nodeNumber] ?? 0,
      }
    })
    .sort((a, b) => a.sort_order - b.sort_order)

  return {
    nodes: all.filter((n) => n.type === "node"),
    rungs: all.filter((n) => n.type === "rung"),
    strands,
  }
}

/**
 * One element of the helix by its node number — a node or a rung, both of
 * which carry a covenant, description, stakeholder, and implementation
 * rules. Backs `/architecture/nodes/[n]` and
 * `/api/v1/architecture/nodes/[n]`.
 *
 * Deliberately takes no upper bound. Node numbers are labels, not a
 * sequence, and the set is never capped — whether `n` exists is a
 * question for the collection, not for a constant in this file. Returns
 * null when Supabase isn't configured or no element carries that number.
 */
export async function getHelixNode(nodeNumber: number): Promise<HelixNode | null> {
  if (!Number.isInteger(nodeNumber) || nodeNumber < 1) return null
  const model = await getHelixModel()
  return (
    [...model.nodes, ...model.rungs].find((element) => element.node_number === nodeNumber) ?? null
  )
}

/**
 * The helix class a node or rung renders as — its strand class if it sits
 * on a strand, `"rung"` if it bridges both backbones. Keeps the chart,
 * the node badge, and the explorer colouring off one rule.
 */
export function helixClassOf(element: HelixNode): HelixClass {
  if (element.type === "rung") return "rung"
  switch (element.strand) {
    case "core-guarantee":
    case "shipped":
    case "swappable":
    case "spine":
      return element.strand
    default:
      return "core-guarantee"
  }
}

// ── Skills — issue #54 / #58 (FRD-15 Part A, `skills` table) ────────
//
// Agent-skill MDX bodies. Three RPC helpers in Supabase:
//   list_skills()           returns the index without body_mdx
//   get_skill(name)          returns one row including body_mdx
//   get_skills_summary()     returns the index without body_mdx (alias)

/**
 * Live fetch of all skills via the `list_skills()` RPC. Returns an empty
 * array if Supabase isn't configured. Body MDX is omitted — use
 * {@link getSkill} when the full body is needed.
 */
export async function listSkills(): Promise<SkillSummary[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc("list_skills")
  if (error || !Array.isArray(data)) return []
  return data as SkillSummary[]
}

/**
 * Lightweight summary list (same shape as {@link listSkills}). Wraps the
 * `get_skills_summary()` SQL helper.
 */
export async function getSkillsSummary(): Promise<SkillSummary[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc("get_skills_summary")
  if (error || !Array.isArray(data)) return []
  return data as SkillSummary[]
}

/**
 * Fetch a single skill (with full `body_mdx`) via `get_skill(name)`.
 * Returns null when Supabase isn't configured or the row is missing.
 */
export async function getSkill(name: string): Promise<SkillRow | null> {
  if (!isSupabaseConfigured()) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc("get_skill", { p_name: name })
  if (error || !Array.isArray(data) || data.length === 0) return null
  return data[0] as SkillRow
}

// ── Ubuntu doctrine — issue #45 (`ubuntu_pillars`, `ubuntu_principles`) ──
//
// Two tables, five rows each. Tables are canonical; seeding is out-of-band.
// Callers must tolerate an empty array and render an empty state.

/**
 * Live fetch from `ubuntu_pillars`. Returns an empty array if Supabase
 * isn't configured or the table is empty.
 */
export async function getUbuntuPillars(): Promise<UbuntuPillarRow[]> {
  return doctrineRows<UbuntuPillarRow>(DOCTRINE.ubuntuPillars)
}

/**
 * Live fetch from `ubuntu_principles`. Returns an empty array if Supabase
 * isn't configured or the table is empty.
 */
export async function getUbuntuPrinciples(): Promise<UbuntuPrincipleRow[]> {
  return doctrineRows<UbuntuPrincipleRow>(DOCTRINE.ubuntuPrinciples)
}

// ── Observability open-data — issue #84 ─────────────────────────────
//
// Thin read wrappers over `fundi_issues`, `observability_events`,
// `chaos_events`, and the `get_system_counts()` RPC. All four surfaces
// are public-read via RLS — the dashboard renders them without auth.
//
// Doctrine: node language. Components are indexed on `ecosystem_node`
// (1..10) not on `architecture_layer`. The system-counts RPC returns
// `total_nodes`, replacing the legacy `get_layer_counts()` helper.

/**
 * Recent rows from `fundi_issues`, newest first. Returns an empty array
 * when Supabase isn't configured or the table is empty.
 */
export async function getFundiIssues(limit = 10): Promise<FundiIssueRow[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any)
    .from("fundi_issues")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) return []
  return data as FundiIssueRow[]
}

/**
 * Recent rows from `observability_events`, newest first.
 */
export async function getObservabilityEvents(limit = 20): Promise<ObservabilityEventRow[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any)
    .from("observability_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) return []
  return data as ObservabilityEventRow[]
}

/**
 * Recent rows from `chaos_events`, newest first.
 */
export async function getChaosEvents(limit = 20): Promise<ChaosEventRow[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any)
    .from("chaos_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !Array.isArray(data)) return []
  return data as ChaosEventRow[]
}

/**
 * Live system-wide counts via the `get_system_counts()` RPC. Replaces
 * the deprecated `get_layer_counts()` — returns `total_nodes` rather
 * than `total_layers`. Returns null when Supabase isn't configured or
 * the RPC errors.
 */
export async function getSystemCounts(): Promise<SystemCountsRow | null> {
  if (!isSupabaseConfigured()) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc("get_system_counts")
  if (error || !Array.isArray(data) || data.length === 0) return null
  return data[0] as SystemCountsRow
}

// The observability dashboard's component-distribution panel used to read
// a `getNodeDistribution()` helper that joined component counts to
// `architecture_frontend_layers.ecosystem_axis` — a retired table and an
// axis-shaped column. It is deleted, not rewired: `getHelixModel()`
// already returns every node and rung with its live `component_count`
// from `get_node_counts()`, off the collection the MCP serves, so the
// panel reads the helix directly and colours by `helixClassOf()`.

// ── Changelog v2 — issue #85 (`versioning_and_changelog_v2`) ────────
//
// The node-aware changelog lives behind the `list_changelog(limit, offset)`
// SQL helper. Each row carries `nodes_affected integer[]` and
// component / tool deltas. `/changelog` reads via this RPC; the older
// `getChangelogEntries()` helper is kept for backwards compatibility
// with `components/docs/db-changelog.tsx`.

/**
 * Live fetch of changelog entries via the `list_changelog()` RPC. Most
 * recent first. Returns an empty array if Supabase isn't configured or
 * the RPC errors. Bounded by `limit` (default 50) for the page render.
 */
export async function listChangelog(limit = 50, offset = 0): Promise<ChangelogListRow[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any).rpc("list_changelog", {
    p_limit: limit,
    p_offset: offset,
  })
  if (error || !Array.isArray(data)) return []
  return data as ChangelogListRow[]
}

// ── MCP tool registry — issue #85 / #83 (`mcp_tool_registry` table) ──
//
// The published Mzizi tools (mzizi-mcp, mzizi-sdk, mzizi-skills,
// mzizi-cli) live in `mcp_tool_registry`. Thin read helpers backing
// `/tools/[name]`. The full registry-driven endpoints land with #83.

/**
 * List all enabled rows from `mcp_tool_registry`. Empty array on
 * configuration / query failure.
 */
export async function listMcpToolRegistry(): Promise<McpToolRegistryRow[]> {
  if (!isSupabaseConfigured()) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any)
    .from("mcp_tool_registry")
    .select("*")
    .eq("enabled", true)
    .order("tool_name", { ascending: true })

  if (error || !Array.isArray(data)) return []
  return data as McpToolRegistryRow[]
}

/**
 * Fetch a single tool row by `tool_name`. Returns null when missing or
 * when Supabase isn't configured.
 */
export async function getMcpTool(toolName: string): Promise<McpToolRegistryRow | null> {
  if (!isSupabaseConfigured()) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getPublicClient() as any)
    .from("mcp_tool_registry")
    .select("*")
    .eq("tool_name", toolName)
    .maybeSingle()

  if (error || !data) return null
  return data as McpToolRegistryRow
}
