/**
 * Mukoko Registry Document Store — Supabase Backend
 *
 * Replaces hardcoded JSON files (registry.json, component-docs.ts) with
 * Supabase Postgres. All registry data lives in three tables:
 *
 *   components       — Component metadata (name, deps, files, category)
 *   component_docs   — Documentation (use cases, variants, features)
 *   component_demos  — Demo configuration
 *
 * Architecture:
 *   Browser  →  Next.js API routes  →  Supabase (Postgres + RLS)
 *                                         ↑
 *                                    Public read (anon key)
 *                                    Write via service_role key
 *
 * Env vars:
 *   NEXT_PUBLIC_SUPABASE_URL      — Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — Public anon key (read-only via RLS)
 *   SUPABASE_SERVICE_ROLE_KEY     — Service role key (write access, server only)
 *
 * Usage:
 *   import { getComponent, getAllComponents } from "@/lib/db"
 *   const button = await getComponent("button")
 */

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
 * Check if Supabase is configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

// ── Component queries ───────────────────────────────────────────────

/**
 * Get a single component by name.
 */
export async function getComponent(
  name: string
): Promise<ComponentRow | null> {
  const { data, error } = await getPublicClient()
    .from("components")
    .select("*")
    .eq("name", name)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null // not found
    throw error
  }
  return data as unknown as ComponentRow
}

/**
 * Get all components, sorted by name.
 */
export async function getAllComponents(): Promise<ComponentRow[]> {
  const { data, error } = await getPublicClient()
    .from("components")
    .select("*")
    .order("name")

  if (error) throw error
  return (data ?? []) as unknown as ComponentRow[]
}

/**
 * Get components by category.
 */
export async function getComponentsByCategory(
  category: string
): Promise<ComponentRow[]> {
  const { data, error } = await getPublicClient()
    .from("components")
    .select("*")
    .eq("category", category)
    .order("name")

  if (error) throw error
  return (data ?? []) as unknown as ComponentRow[]
}

/**
 * Get components by layer.
 */
export async function getComponentsByLayer(
  layer: string
): Promise<ComponentRow[]> {
  const { data, error } = await getPublicClient()
    .from("components")
    .select("*")
    .eq("layer", layer)
    .order("name")

  if (error) throw error
  return (data ?? []) as unknown as ComponentRow[]
}

/**
 * Search components by name or description (case-insensitive).
 */
export async function searchComponents(
  query: string
): Promise<ComponentRow[]> {
  const { data, error } = await getPublicClient()
    .from("components")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order("name")

  if (error) throw error
  return (data ?? []) as unknown as ComponentRow[]
}

// ── Component documentation queries ─────────────────────────────────

/**
 * Get documentation for a component.
 */
export async function getComponentDoc(
  name: string
): Promise<ComponentDocRow | null> {
  const { data, error } = await getPublicClient()
    .from("component_docs")
    .select("*")
    .eq("component_name", name)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }
  return data as unknown as ComponentDocRow
}

/**
 * Get all component documentation.
 */
export async function getAllComponentDocs(): Promise<ComponentDocRow[]> {
  const { data, error } = await getPublicClient()
    .from("component_docs")
    .select("*")

  if (error) throw error
  return (data ?? []) as unknown as ComponentDocRow[]
}

// ── Demo queries ────────────────────────────────────────────────────

/**
 * Check if a component has a demo.
 */
export async function hasDemoFor(name: string): Promise<boolean> {
  const { data } = await getPublicClient()
    .from("component_demos")
    .select("has_demo")
    .eq("component_name", name)
    .single()

  return (data as unknown as { has_demo: boolean } | null)?.has_demo ?? false
}

/**
 * Get all component names that have demos.
 */
export async function getDemoNames(): Promise<string[]> {
  const { data, error } = await getPublicClient()
    .from("component_demos")
    .select("component_name")
    .eq("has_demo", true)

  if (error) throw error
  return ((data ?? []) as unknown as Array<{ component_name: string }>).map(
    (d) => d.component_name
  )
}

// ── Enriched queries ────────────────────────────────────────────────

/**
 * Get a component with its documentation and demo info.
 */
export async function getComponentWithDocs(
  name: string
): Promise<ComponentWithDocs | null> {
  const component = await getComponent(name)
  if (!component) return null

  const [docs, demo] = await Promise.all([
    getComponentDoc(name),
    getPublicClient()
      .from("component_demos")
      .select("*")
      .eq("component_name", name)
      .single()
      .then(({ data }) => data as unknown as ComponentDemoRow | null),
  ])

  return { ...component, docs, demo }
}

/**
 * Get all components with their docs (for catalog pages).
 */
export async function getAllComponentsWithDocs(): Promise<ComponentWithDocs[]> {
  const [components, docs, demos] = await Promise.all([
    getAllComponents(),
    getAllComponentDocs(),
    getPublicClient()
      .from("component_demos")
      .select("*")
      .eq("has_demo", true)
      .then(
        ({ data }) =>
          (data ?? []) as unknown as ComponentDemoRow[]
      ),
  ])

  const docMap = new Map(docs.map((d) => [d.component_name, d]))
  const demoMap = new Map(demos.map((d) => [d.component_name, d]))

  return components.map((component) => ({
    ...component,
    docs: docMap.get(component.name) ?? null,
    demo: demoMap.get(component.name) ?? null,
  }))
}

// ── Write operations (server-only, uses service_role) ───────────────

/**
 * Upsert a component (insert or update on conflict).
 */
export async function upsertComponent(
  component: ComponentInsert
): Promise<ComponentRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("components")
    .upsert(component, { onConflict: "name" })
    .select()
    .single()

  if (error) throw error
  return data as ComponentRow
}

/**
 * Upsert component documentation.
 */
export async function upsertComponentDoc(
  doc: ComponentDocInsert
): Promise<ComponentDocRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("component_docs")
    .upsert(doc, { onConflict: "component_name" })
    .select()
    .single()

  if (error) throw error
  return data as ComponentDocRow
}

/**
 * Upsert a component demo.
 */
export async function upsertComponentDemo(
  demo: ComponentDemoInsert
): Promise<ComponentDemoRow> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (getAdminClient() as any)
    .from("component_demos")
    .upsert(demo, { onConflict: "component_name" })
    .select()
    .single()

  if (error) throw error
  return data as ComponentDemoRow
}

/**
 * Delete a component and its docs/demos (cascade).
 */
export async function deleteComponent(name: string): Promise<void> {
  const { error } = await getAdminClient()
    .from("components")
    .delete()
    .eq("name", name)

  if (error) throw error
}

// ── Database info ───────────────────────────────────────────────────

/**
 * Get database status and counts.
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  try {
    const [components, docs, demos] = await Promise.all([
      getPublicClient()
        .from("components")
        .select("*", { count: "exact", head: true }),
      getPublicClient()
        .from("component_docs")
        .select("*", { count: "exact", head: true }),
      getPublicClient()
        .from("component_demos")
        .select("*", { count: "exact", head: true }),
    ])

    return {
      provider: "supabase",
      components: components.count ?? 0,
      docs: docs.count ?? 0,
      demos: demos.count ?? 0,
      status: "connected",
    }
  } catch {
    return {
      provider: "supabase",
      components: 0,
      docs: 0,
      demos: 0,
      status: "error",
    }
  }
}

/**
 * Check if the database has been seeded (has at least one component).
 */
export async function isSeeded(): Promise<boolean> {
  const { count } = await getPublicClient()
    .from("components")
    .select("*", { count: "exact", head: true })

  return (count ?? 0) > 0
}
