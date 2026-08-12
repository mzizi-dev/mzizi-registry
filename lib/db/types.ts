/**
 * Database types for the Nyuchi Design Portal Supabase document store.
 *
 * These types mirror the Supabase tables defined in supabase/schema.sql.
 * Components, docs, and demos are stored as rows in Postgres — queryable,
 * indexable, and protected by RLS.
 */

import type { RegistryItem } from "@/lib/registry"

// ── Row types (what comes back from Supabase) ───────────────────────

export interface ComponentRow {
  id: number
  name: string
  registry_type: string
  description: string
  dependencies: string[]
  registry_dependencies: string[]
  files: ComponentFile[]
  category: string | null
  layer: string | null
  is_mukoko_component: boolean
  tags: string[]
  added_in_version: string | null
  source_code: string | null
  created_at: string
  updated_at: string
}

export interface ComponentDocRow {
  id: number
  component_name: string
  use_cases: string[]
  variants: string[]
  sizes: string[]
  features: string[]
  a11y: string[]
  examples: CodeExample[]
  created_at: string
  updated_at: string
}

export interface ComponentDemoRow {
  id: number
  component_name: string
  has_demo: boolean
  demo_type: string | null
  created_at: string
  updated_at: string
}

// ── Insert types (what we send to Supabase) ─────────────────────────

export interface ComponentInsert {
  name: string
  registry_type: string
  description: string
  dependencies?: string[]
  registry_dependencies?: string[]
  files?: ComponentFile[]
  category?: string | null
  layer?: string | null
  is_mukoko_component?: boolean
  tags?: string[]
  added_in_version?: string | null
  source_code?: string | null
}

export interface ComponentDocInsert {
  component_name: string
  use_cases: string[]
  variants?: string[]
  sizes?: string[]
  features?: string[]
  a11y?: string[]
  examples?: CodeExample[]
}

export interface ComponentDemoInsert {
  component_name: string
  has_demo: boolean
  demo_type?: string | null
}

// ── Shared types ────────────────────────────────────────────────────

export interface ComponentFile {
  path: string
  type: string
}

export interface CodeExample {
  title: string
  code: string
  language?: string
}

export type ComponentCategory =
  | "input"
  | "action"
  | "data-display"
  | "feedback"
  | "layout"
  | "navigation"
  | "overlay"
  | "utility"
  | "mukoko"
  | "infrastructure"

// ── Enriched types ──────────────────────────────────────────────────

/**
 * A registry item plus its docs and demo flag.
 *
 * Extends `RegistryItem` — what the registry reader actually produces — not `ComponentRow`,
 * which is the retired Supabase row shape and names `registry_type` where an item has
 * `type`. Anything typed as `ComponentRow` while holding a registry item can read fields
 * that are always `undefined` and the compiler will agree with it.
 */
export interface ComponentWithDocs extends Omit<RegistryItem, "docs"> {
  /**
   * The structured docs ROW (use cases, variants, a11y) served by
   * `/api/v1/ui/{name}/docs`.
   *
   * `RegistryItem.docs` is a different thing that happens to share the name: shadcn's
   * registry-item schema defines `docs` as a STRING the CLI prints after installing.
   * Both are real and both are called `docs`, so this omits the shadcn one rather than
   * widening either — collapsing them would either break the /docs payload or put an
   * object where the schema says string.
   */
  docs?: ComponentDocRow | null
  demo?: ComponentDemoRow | null
}

// ── Database info ───────────────────────────────────────────────────

export interface DatabaseInfo {
  /**
   * Where the component registry is actually read from. `registry` = the repo
   * (registry.json + the files on disk); `supabase` remains in the union only
   * for the surfaces that still read a table, so a consumer can tell which
   * answered.
   */
  provider: "registry" | "supabase"
  components: number
  docs: number
  demos: number
  status: "connected" | "error"
}

// ── Brand table types ──────────────────────────────────────────────

export interface BrandMineralRow {
  id: number
  name: string
  hex: string
  light_hex: string
  dark_hex: string
  container_light: string
  container_dark: string
  css_var: string
  origin: string
  symbolism: string
  usage: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BrandMineralInsert {
  name: string
  hex: string
  light_hex: string
  dark_hex: string
  container_light: string
  container_dark: string
  css_var: string
  origin: string
  symbolism: string
  usage: string
  sort_order?: number
}

export interface BrandSemanticColorRow {
  id: number
  name: string
  light_value: string
  dark_value: string
  usage: string
  color_type: string
  created_at: string
  updated_at: string
}

export interface BrandSemanticColorInsert {
  name: string
  light_value: string
  dark_value: string
  usage: string
  color_type?: string
}

export interface BrandTypographyRow {
  id: number
  name: string
  entry_type: string
  size_px: number | null
  size_rem: string | null
  line_height: string | null
  weight: number | null
  font: string | null
  usage: string
  family: string | null
  reason: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BrandTypographyInsert {
  name: string
  entry_type?: string
  size_px?: number | null
  size_rem?: string | null
  line_height?: string | null
  weight?: number | null
  font?: string | null
  usage: string
  family?: string | null
  reason?: string | null
  sort_order?: number
}

export interface BrandSpacingRow {
  id: number
  name: string
  px: number
  rem: string
  usage: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BrandSpacingInsert {
  name: string
  px: number
  rem: string
  usage: string
  sort_order?: number
}

export interface BrandEcosystemRow {
  id: number
  name: string
  meaning: string
  language: string
  role: string
  mineral: string
  url: string
  description: string
  voice: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BrandEcosystemInsert {
  name: string
  meaning: string
  language: string
  role: string
  mineral: string
  url: string
  description: string
  voice: string
  sort_order?: number
}

export interface BrandMetaRow {
  id: number
  version: string
  name: string
  last_updated: string
  homepage: string
  philosophy: Record<string, unknown>
  voice_and_tone: Record<string, unknown>
  accessibility: Record<string, unknown>
  radii: Record<string, unknown>
  component_specs: Record<string, unknown>[]
  created_at: string
  updated_at: string
}

export interface BrandMetaInsert {
  version: string
  name: string
  last_updated: string
  homepage: string
  philosophy?: Record<string, unknown>
  voice_and_tone?: Record<string, unknown>
  accessibility?: Record<string, unknown>
  radii?: Record<string, unknown>
  component_specs?: Record<string, unknown>[]
}

// ── Architecture table types ───────────────────────────────────────

export interface ArchitecturePrincipleRow {
  id: number
  name: string
  title: string
  description: string
  rationale: string
  implementation: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ArchitecturePrincipleInsert {
  name: string
  title: string
  description: string
  rationale: string
  implementation: string
  sort_order?: number
}

export interface ArchitectureFrameworkRow {
  id: number
  name: string
  approach: string
  framework: string
  rationale: string
  sovereignty_advantage: string
  platforms: Record<string, unknown>[]
  harmony_os: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ArchitectureFrameworkInsert {
  name: string
  approach: string
  framework: string
  rationale: string
  sovereignty_advantage: string
  platforms?: Record<string, unknown>[]
  harmony_os?: Record<string, unknown>
}

export interface ArchitectureDataLayerRow {
  id: number
  name: string
  role: string
  platform: string
  description: string
  sovereignty: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ArchitectureDataLayerInsert {
  name: string
  role: string
  platform: string
  description: string
  sovereignty?: Record<string, unknown>
  sort_order?: number
}

export interface ArchitectureCloudLayerRow {
  id: number
  name: string
  role: string
  consistency_model: string
  database: string
  data_categories: string[]
  description: string
  sovereignty: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ArchitectureCloudLayerInsert {
  name: string
  role: string
  consistency_model: string
  database: string
  data_categories?: string[]
  description: string
  sovereignty?: Record<string, unknown>
  sort_order?: number
}

export interface ArchitecturePipelineRow {
  id: number
  name: string
  role: string
  description: string
  sovereignty: Record<string, unknown>
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ArchitecturePipelineInsert {
  name: string
  role: string
  description: string
  sovereignty?: Record<string, unknown>
  sort_order?: number
}

export interface ArchitectureDataOwnershipRow {
  id: number
  category: string
  consistency_model: string
  database: string
  examples: string[]
  conflict_resolution: string
  ownership: string
  description: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ArchitectureDataOwnershipInsert {
  category: string
  consistency_model: string
  database: string
  examples?: string[]
  conflict_resolution: string
  ownership: string
  description: string
  sort_order?: number
}

export interface ArchitectureSovereigntyRow {
  id: number
  technology: string
  role: string
  license: string
  governance: string
  sovereignty_risk: string
  forkable: boolean
  self_hostable: boolean
  rationale: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ArchitectureSovereigntyInsert {
  technology: string
  role: string
  license: string
  governance: string
  sovereignty_risk: string
  forkable?: boolean
  self_hostable?: boolean
  rationale: string
  sort_order?: number
}

export interface ArchitectureRemovedRow {
  id: number
  name: string
  previous_role: string
  reason: string
  replacement: string
  migration_path: string
  created_at: string
  updated_at: string
}

export interface ArchitectureRemovedInsert {
  name: string
  previous_role: string
  reason: string
  replacement: string
  migration_path: string
}

// ── AI instruction table types ──────────────────────────────────────

export interface AiInstructionRow {
  id: number
  name: string
  target: string
  title: string | null
  description: string | null
  content: string
  version: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface AiInstructionInsert {
  name: string
  target: string
  title?: string | null
  description?: string | null
  content: string
  version?: string | null
  metadata?: Record<string, unknown> | null
}

// ── Skills table types ──────────────────────────────────────────────

/**
 * Agent-skill MDX bodies. **Read-only from this repo** — the source of truth is
 * git: `mzizi-skills/skills/<name>/SKILL.md` in `nyuchi/mzizi-tools`, published
 * as the npm package `@nyuchi/mzizi-skills` and projected into this table by
 * that repo's `pnpm skills:sync`. The portal serves what it finds here via the
 * HTTP API at `/api/v1/skills/{name}` and the MCP `get_skill` tool; consumers
 * install the package (`npx skills add @nyuchi/mzizi-skills`). Never write to
 * this table from the portal — see CLAUDE.md §15.23.
 *
 * Distinct from `ai_instructions` — those are per-AI-target system prompts
 * (one row per target like `claude-system-prompt`, `mcp-server`,
 * `github-copilot`); skills are reusable workflows an agent invokes on
 * specific tasks (one row per skill like `nyuchi-design`,
 * `scaffold-component`, `ecosystem-app-setup`).
 */
export interface SkillRow {
  id: number
  name: string
  description: string
  body_mdx: string
  agents: string[]
  requires_mcp: boolean
  applies_to: string[]
  status: string | null
  version: string
  created_at: string
  updated_at: string
}

/**
 * Lightweight summary shape returned by `list_skills()` and
 * `get_skills_summary()` SQL helpers — same as `SkillRow` minus the heavy
 * `body_mdx` field, for consumers that only need the index.
 */
export type SkillSummary = Omit<SkillRow, "body_mdx" | "id" | "created_at">

// ── Changelog table types ───────────────────────────────────────────
//
// The `changelog` table was migrated by `versioning_and_changelog_v2`
// to a node-aware shape. Each row tracks which ecosystem nodes and
// which components / tools moved in the release. The legacy
// optional fields (`body`, `is_latest`, `categories`, `updated_at`)
// are retained for backwards compatibility with the older
// `getChangelogEntries` / `db-changelog.tsx` rendering path; they are
// null/undefined on rows fetched via the new `list_changelog()` RPC.

export interface ChangelogRow {
  id: number
  version: string
  title: string
  description: string | null
  /**
   * Which version era this release belongs to.
   *
   * `public` is the 1.x line; `pre-1.0` is the internal 4.x iteration that
   * 1.0.0 superseded (§14). Both exist in the same table, which is why no
   * single sort key orders the changelog: by date, ten undated 4.1.x rows
   * float above everything; by semver, 4.2.0 outranks the current 1.0.0.
   * `line_rank` puts the public line first and the view is pre-sorted.
   */
  line?: "public" | "pre-1.0"
  line_rank?: number
  major?: number | null
  minor?: number | null
  patch?: number | null
  /** initial / major / minor / patch, compared to the predecessor in the SAME line. */
  release_kind?: "initial" | "major" | "minor" | "patch"
  breaking?: boolean | null
  /** Components added + modified + deprecated + removed by this release. */
  components_touched?: number
  /**
   * Ecosystem nodes touched by this release. Rendered as pill badges
   * coloured by helix classification (strand class for a node, gold for
   * a rung) via the nyuchi-changelog-renderer. The node set is never
   * capped — a release may name a node newer than any listed in code.
   */
  nodes_affected: number[] | null
  components_added: string[] | null
  components_modified: string[] | null
  components_deprecated: string[] | null
  components_removed: string[] | null
  tools_added: string[] | null
  tools_modified: string[] | null
  tools_deprecated: string[] | null
  tools_removed: string[] | null
  total_stable: number | null
  total_deprecated: number | null
  total_alpha: number | null
  changed_by: string | null
  released_at: string
  linked_issues: string[] | null
  created_at: string
  // legacy fields (post-v2 migration leaves these absent)
  body?: string | null
  is_latest?: boolean
  categories?: Record<string, unknown> | null
  updated_at?: string
}

export interface ChangelogInsert {
  version: string
  title: string
  description?: string | null
  nodes_affected?: number[] | null
  components_added?: string[] | null
  components_modified?: string[] | null
  components_deprecated?: string[] | null
  components_removed?: string[] | null
  released_at: string
}

/**
 * Shape returned by the `list_changelog(p_limit, p_offset)` RPC. Mirrors
 * the row shape minus the ID / archive columns. Used by `/changelog`.
 */
export interface ChangelogListRow {
  version: string
  title: string
  description: string | null
  nodes_affected: number[] | null
  components_added: string[] | null
  components_modified: string[] | null
  components_deprecated: string[] | null
  components_removed: string[] | null
  total_stable: number | null
  total_deprecated: number | null
  total_alpha: number | null
  changed_by: string | null
  created_at: string
}

// ── mcp_tool_registry table types ───────────────────────────────────

export type ToolStability = "experimental" | "evolving" | "stable" | "frozen" | "deprecated"

export interface McpToolRegistryRow {
  tool_name: string
  category: string | null
  description: string | null
  sql_function: string | null
  source_table: string | null
  input_schema: Record<string, unknown> | null
  output_shape: Record<string, unknown> | null
  stability: ToolStability | null
  tool_kind: string | null
  requires_first_party: boolean | null
  requires_domain_feature: string | null
  cache_ttl_seconds: number | null
  enabled: boolean | null
  added_in_version: string | null
  notes: string | null
  created_at: string
  updated_at: string
  current_version: string | null
  version_count: number | null
  edge_function: string | null
}

// ── Component version table types ───────────────────────────────────

/**
 * A row of `public.component_versions` — a VIEW that unnests
 * `component_documents.document->'versions'`, not a table.
 *
 * Two things this type used to get wrong, both hidden by the
 * `as unknown as ComponentVersionRow[]` cast at the call site:
 *
 * 1. It declared `id`, `changes`, `released_at` and `metadata`, none of which
 *    the view has, and omitted nine columns that it does. A cast through
 *    `unknown` asserts a shape rather than checking one, so tsc had nothing to
 *    disagree with and the type documented a payload nobody ever received.
 * 2. It carried `source_code`. The view still projects `sourceCode` out of each
 *    archived version, so `select("*")` served component source over
 *    `/api/v1/ui/{name}/versions` — a second, STALE copy of bytes that live on
 *    disk in git (§8.3). `button` came back at 3,637 chars against 3,921 on
 *    disk. It is deliberately absent here and the query names its columns
 *    explicitly, so re-adding it takes two edits rather than none.
 */
export interface ComponentVersionRow {
  /**
   * Never null. It used to be, on 1,034 of 4,889 rows, because the view read
   * `document->>'componentName'` and 1,472 archived entities have no such key —
   * the row's own `name` column held the identity all along.
   */
  component_name: string
  /** The archived row's own name, before the componentName fallback. */
  entity_name: string
  /**
   * What is being versioned. The view is called `component_versions` but the
   * archive covers far more: 60 MCP tools, 11 architecture nodes, documentation
   * pages, changelog entries, design tokens (`Body Large`, `raised`,
   * `duration-quick`) and framework descriptors (`react:badge`). Filter on
   * `component` to get a component's history.
   */
  entity_kind:
    "component" | "tool" | "architecture" | "release" | "doctrine" | "documentation" | "other"
  version: string | null
  version_number: number | null
  /** The raw archived value — 12 ad-hoc strings. Kept so the mapping stays auditable. */
  change_type: string | null
  /** `change_type` normalised. `unclassified` means the raw value said WHEN, not WHAT. */
  change_kind: "added" | "changed" | "fixed" | "moved" | "metadata" | "docs" | "unclassified"
  /**
   * The release this change belongs to.
   *
   * Taken from the marker embedded in `change_type` when it encodes one — the
   * largest change_type value, `4.1.1-alignment` on 2,132 rows, is a release
   * marker wearing a change type's clothes — otherwise the newest release
   * published on or before the change's timestamp. Null for changes that
   * predate the first dated release.
   */
  release: string | null
  /** The release marker parsed out of `change_type`, when there was one. */
  release_marker: string | null
  release_breaking: boolean | null
  comment: string | null
  description: string | null
  status: string | null
  ecosystem_node: number | null
  category: string | null
  subcategory: string | null
  tags: string[] | null
  changed_by: string | null
  created_at: string | null
}

export interface ComponentVersionInsert {
  component_name: string
  version: string
  version_number?: number | null
  change_type?: string | null
  comment?: string | null
  description?: string | null
  status?: string | null
  ecosystem_node?: number | null
  category?: string | null
  subcategory?: string | null
  tags?: string[] | null
  changed_by?: string | null
}

// ── Design token types (from nyuchi-tokens component source_code) ──

export interface DesignTokens {
  minerals?: Record<string, unknown>
  semanticColors?: Record<string, unknown>
  typography?: Record<string, unknown>
  spacing?: Record<string, unknown>
  radii?: Record<string, unknown>
  [key: string]: unknown
}

// ── Supabase database type helper ───────────────────────────────────

export interface Database {
  public: {
    Tables: {
      components: {
        Row: ComponentRow
        Insert: ComponentInsert
        Update: Partial<ComponentInsert>
      }
      component_docs: {
        Row: ComponentDocRow
        Insert: ComponentDocInsert
        Update: Partial<ComponentDocInsert>
      }
      component_demos: {
        Row: ComponentDemoRow
        Insert: ComponentDemoInsert
        Update: Partial<ComponentDemoInsert>
      }
      brand_minerals: {
        Row: BrandMineralRow
        Insert: BrandMineralInsert
        Update: Partial<BrandMineralInsert>
      }
      brand_semantic_colors: {
        Row: BrandSemanticColorRow
        Insert: BrandSemanticColorInsert
        Update: Partial<BrandSemanticColorInsert>
      }
      brand_typography: {
        Row: BrandTypographyRow
        Insert: BrandTypographyInsert
        Update: Partial<BrandTypographyInsert>
      }
      brand_spacing: {
        Row: BrandSpacingRow
        Insert: BrandSpacingInsert
        Update: Partial<BrandSpacingInsert>
      }
      brand_ecosystem: {
        Row: BrandEcosystemRow
        Insert: BrandEcosystemInsert
        Update: Partial<BrandEcosystemInsert>
      }
      brand_meta: {
        Row: BrandMetaRow
        Insert: BrandMetaInsert
        Update: Partial<BrandMetaInsert>
      }
      architecture_principles: {
        Row: ArchitecturePrincipleRow
        Insert: ArchitecturePrincipleInsert
        Update: Partial<ArchitecturePrincipleInsert>
      }
      architecture_framework: {
        Row: ArchitectureFrameworkRow
        Insert: ArchitectureFrameworkInsert
        Update: Partial<ArchitectureFrameworkInsert>
      }
      architecture_data_layer: {
        Row: ArchitectureDataLayerRow
        Insert: ArchitectureDataLayerInsert
        Update: Partial<ArchitectureDataLayerInsert>
      }
      architecture_cloud_layer: {
        Row: ArchitectureCloudLayerRow
        Insert: ArchitectureCloudLayerInsert
        Update: Partial<ArchitectureCloudLayerInsert>
      }
      architecture_pipeline: {
        Row: ArchitecturePipelineRow
        Insert: ArchitecturePipelineInsert
        Update: Partial<ArchitecturePipelineInsert>
      }
      architecture_data_ownership: {
        Row: ArchitectureDataOwnershipRow
        Insert: ArchitectureDataOwnershipInsert
        Update: Partial<ArchitectureDataOwnershipInsert>
      }
      architecture_sovereignty: {
        Row: ArchitectureSovereigntyRow
        Insert: ArchitectureSovereigntyInsert
        Update: Partial<ArchitectureSovereigntyInsert>
      }
      architecture_removed: {
        Row: ArchitectureRemovedRow
        Insert: ArchitectureRemovedInsert
        Update: Partial<ArchitectureRemovedInsert>
      }
      ai_instructions: {
        Row: AiInstructionRow
        Insert: AiInstructionInsert
        Update: Partial<AiInstructionInsert>
      }
      changelog: {
        Row: ChangelogRow
        Insert: ChangelogInsert
        Update: Partial<ChangelogInsert>
      }
      component_versions: {
        Row: ComponentVersionRow
        Insert: ComponentVersionInsert
        Update: Partial<ComponentVersionInsert>
      }
    }
  }
}

// ── Architecture (Mzizi DNA double helix) — nodes on strands + rungs ──
//
// The live model lives in `component_documents` under the collections
// `documentation-architecture-nodes` (nodes + rungs) and
// `documentation-architecture-strands` (the backbone groupings). This is
// the single source of truth the MCP already serves, and the only model
// this repo describes: there are no axes, no outliers, no 3D, no X/Y/Z.
//
// The axis-era types that used to live here — axis geometry, the
// `architecture_frontend_*` row shapes, the `get_axes_summary()` /
// `get_layer_detail()` return shapes, and the nested `axes[].layers[]`
// snapshot — are deleted, not relabelled. A field named `axis_geometry`
// carrying a strand looks correct and teaches the wrong model to every
// consumer downstream, so absence is the correct state here.
//
// Counts are never hardcoded and the node set is never capped: nodes are
// read from the collection and more will come. Any `maximum` on a node
// argument is itself the defect — a cap of 10 hid N11, and a cap of 11
// would hide N12.

export type HelixStrandKey =
  "core-guarantee" | "shipped" | "swappable" | "spine" | "genetic-code" | "transcription"

export type HelixBackbone = "engineering" | "meaning"

/** A backbone grouping (`documentation-architecture-strands`). */
export interface HelixStrand {
  name: HelixStrandKey | string
  title: string
  backbone: HelixBackbone | string
  covenant: string
  description: string
  sort_order: number
}

/**
 * A helix element from `documentation-architecture-nodes`. Both nodes
 * (`type: "node"`, bound to one engineering strand) and rungs
 * (`type: "rung"`, cross-cutting — `strand`/`backbone` null) share this
 * shape; `getHelixModel()` splits them by `type`.
 */
export interface HelixNode {
  node_number: number
  sub_label: string
  title: string
  type: "node" | "rung"
  strand: HelixStrandKey | string | null
  backbone: HelixBackbone | string | null
  role: string
  covenant: string
  description: string
  stakeholder: string
  implementation_rules: string[]
  sort_order: number
  component_count: number
}

export interface HelixModel {
  nodes: HelixNode[]
  rungs: HelixNode[]
  strands: HelixStrand[]
}
//
// Five Ubuntu Pillars (the spheres in which Ubuntu is lived) and Five
// Ubuntu Principles (the operating rules that translate Ubuntu to software).
// Tables are the canonical structure; seeding is out-of-band.

export interface UbuntuPillarRow {
  id: number
  name: string
  shona: string
  title: string
  description: string
  sphere: string
  platform_surface: string
  source: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UbuntuPillarInsert {
  name: string
  shona: string
  title: string
  description: string
  sphere: string
  platform_surface: string
  source: string
  sort_order?: number
}

export interface UbuntuPrincipleRow {
  id: number
  name: string
  shona: string
  title: string
  description: string
  expression: string
  source: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UbuntuPrincipleInsert {
  name: string
  shona: string
  title: string
  description: string
  expression: string
  source: string
  sort_order?: number
}

// ── Observability open-data tables — issue #84 ──────────────────────
//
// The /observability dashboard reads from four public tables (and the
// `get_system_counts()` RPC). All rows are public-read via RLS — see
// nyuchi/mzizi#82.

export interface FundiIssueRow {
  id: number
  github_issue_number: number | null
  github_issue_url: string | null
  component_name: string | null
  ecosystem_node: number | null
  portal_url: string | null
  severity: string | null
  error_type: string | null
  blast_radius: string | null
  status: string | null
  resolution: string | null
  auto_fixable: boolean | null
  requires_human: boolean | null
  root_cause: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface ObservabilityEventRow {
  id: number
  event_type: string
  component_name: string | null
  ecosystem_node: number | null
  domain: string | null
  page_path: string | null
  created_at: string
  metadata: Record<string, unknown> | null
}

export interface ChaosEventRow {
  id: number
  event_type: string
  injection_kind: string | null
  domain: string | null
  environment: string | null
  component_name: string | null
  ecosystem_node: number | null
  page_path: string | null
  blocked_reason: string | null
  injected_by: string | null
  duration_ms: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

/**
 * Row from the `get_system_counts()` RPC (v4.0.33+ replacement for the
 * deprecated `get_layer_counts()`). The dashboard reads `total_nodes`.
 */
export interface SystemCountsRow {
  total_components: number
  total_stable: number
  total_alpha: number
  total_deprecated: number
  total_nodes: number
  total_categories: number
  total_mini_apps: number
  total_doc_pages: number
  total_ai_instructions: number
  total_changelog_entries: number
}

/**
 * The helix classification a node or rung is rendered with. Nodes take
 * their strand class from the strand they sit on; every rung is a rung,
 * because a rung bridges both backbones and belongs to no strand. This
 * is the same four-way split `components/ui/node-badge.tsx` colours by,
 * so the chart, the badge, and the explorer agree.
 */
export type HelixClass = "core-guarantee" | "shipped" | "swappable" | "spine" | "rung"
