/**
 * Database types for the Mukoko Registry Supabase document store.
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
    }
  }
}
