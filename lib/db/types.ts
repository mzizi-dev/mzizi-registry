/**
 * Database types for the Nyuchi Design Portal Supabase document store.
 *
 * These types mirror the Supabase tables defined in supabase/schema.sql.
 * Components, docs, and demos are stored as rows in Postgres — queryable,
 * indexable, and protected by RLS.
 */

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

export interface ComponentWithDocs extends ComponentRow {
  docs?: ComponentDocRow | null
  demo?: ComponentDemoRow | null
}

// ── Database info ───────────────────────────────────────────────────

export interface DatabaseInfo {
  provider: "supabase"
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

// ── Documentation page table types ──────────────────────────────────

export interface DocumentationPageRow {
  id: number
  slug: string
  title: string
  category: string
  description: string | null
  body: string
  sort_order: number
  status: string
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DocumentationPageInsert {
  slug: string
  title: string
  category: string
  description?: string | null
  body: string
  sort_order?: number
  status?: string
  metadata?: Record<string, unknown> | null
}

// ── Changelog table types ───────────────────────────────────────────

export interface ChangelogRow {
  id: number
  version: string
  title: string
  description: string | null
  body: string | null
  released_at: string
  is_latest: boolean
  categories: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ChangelogInsert {
  version: string
  title: string
  description?: string | null
  body?: string | null
  released_at: string
  is_latest?: boolean
  categories?: Record<string, unknown> | null
}

// ── Component version table types ───────────────────────────────────

export interface ComponentVersionRow {
  id: number
  component_name: string
  version: string
  changes: string | null
  source_code: string | null
  released_at: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface ComponentVersionInsert {
  component_name: string
  version: string
  changes?: string | null
  source_code?: string | null
  released_at: string
  metadata?: Record<string, unknown> | null
}

// ── Fundi issue table types ─────────────────────────────────────────

export interface FundiIssueRow {
  id: number
  title: string
  body: string | null
  status: string
  severity: string | null
  component_name: string | null
  layer: string | null
  source: string | null
  github_issue_number: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface FundiIssueInsert {
  title: string
  body?: string | null
  status?: string
  severity?: string | null
  component_name?: string | null
  layer?: string | null
  source?: string | null
  github_issue_number?: number | null
  metadata?: Record<string, unknown> | null
  resolved_at?: string | null
}

export interface FundiIssueFilters {
  status?: string
  severity?: string
  component_name?: string
  layer?: string
  limit?: number
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
      documentation_pages: {
        Row: DocumentationPageRow
        Insert: DocumentationPageInsert
        Update: Partial<DocumentationPageInsert>
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
      fundi_issues: {
        Row: FundiIssueRow
        Insert: FundiIssueInsert
        Update: Partial<FundiIssueInsert>
      }
    }
  }
}
