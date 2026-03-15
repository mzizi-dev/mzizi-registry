/**
 * Mukoko Registry Document Store
 *
 * PouchDB-based document store that replaces hardcoded JSON files with a
 * queryable, versionable, syncable database. Works in three modes:
 *
 * 1. **Server (Node.js):** In-memory PouchDB for API routes and SSR
 *    (auto-seeds from registry.json on cold start, persists via CouchDB sync)
 * 2. **Client (Browser):** IndexedDB-backed PouchDB for offline caching
 * 3. **Synced:** Bidirectional sync with remote CouchDB for multi-contributor
 *
 * Architecture:
 *   PouchDB (IndexedDB)  ←→  CouchDB (remote)  ←→  PouchDB (memory)
 *        browser                  server               serverless/API
 *
 * Usage:
 *   import { db, getComponent, getAllComponents } from "@/lib/db"
 *   const button = await getComponent("button")
 *   const all = await getAllComponents()
 */

import PouchDBCore from "pouchdb-core"
import AdapterMemory from "pouchdb-adapter-memory"
import AdapterHttp from "pouchdb-adapter-http"
import Mapreduce from "pouchdb-mapreduce"
import Replication from "pouchdb-replication"
import PouchFind from "pouchdb-find"

import type {
  ComponentDocument,
  ComponentDocDocument,
  DemoDocument,
  ComponentWithDocs,
  RegistryDocument,
  DatabaseInfo,
} from "./types"

// Assemble PouchDB with only the plugins we need (no native leveldown)
const PouchDB = PouchDBCore.plugin(AdapterMemory)
  .plugin(AdapterHttp)
  .plugin(Mapreduce)
  .plugin(Replication)
  .plugin(PouchFind)

// ── Database instances ──────────────────────────────────────────────

/** Server-side registry database (components, docs, demos) */
let _registryDb: PouchDB.Database<RegistryDocument> | null = null

/** Remote CouchDB URL (set via COUCHDB_URL env var) */
const REMOTE_URL = process.env.COUCHDB_URL || null

/**
 * Get or create the registry database instance.
 * Uses in-memory adapter on server (serverless-safe, no native deps).
 * On cold start the DB is empty — call seedDatabase() or hit POST /api/v1/db.
 */
export function getDb(): PouchDB.Database<RegistryDocument> {
  if (!_registryDb) {
    _registryDb = new PouchDB<RegistryDocument>("mukoko-registry", {
      adapter: "memory",
    })
  }
  return _registryDb
}

/**
 * Get a remote CouchDB connection for sync.
 * Returns null if COUCHDB_URL is not configured.
 */
export function getRemoteDb(): PouchDB.Database<RegistryDocument> | null {
  if (!REMOTE_URL) return null
  return new PouchDB<RegistryDocument>(REMOTE_URL)
}

// ── Convenience alias ───────────────────────────────────────────────

export const db = {
  get instance() {
    return getDb()
  },
}

// ── Component queries ───────────────────────────────────────────────

/**
 * Get a single component by name.
 */
export async function getComponent(
  name: string
): Promise<ComponentDocument | null> {
  try {
    const doc = await getDb().get(`component:${name}`)
    return doc as ComponentDocument
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null
    throw err
  }
}

/**
 * Get all components, sorted by name.
 */
export async function getAllComponents(): Promise<ComponentDocument[]> {
  const result = await getDb().allDocs({
    include_docs: true,
    startkey: "component:",
    endkey: "component:\ufff0",
  })

  return result.rows
    .map((row) => row.doc as ComponentDocument)
    .filter((doc) => doc.type === "component")
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get components by category.
 */
export async function getComponentsByCategory(
  category: string
): Promise<ComponentDocument[]> {
  const all = await getAllComponents()
  return all.filter((c) => c.category === category)
}

/**
 * Get components by layer.
 */
export async function getComponentsByLayer(
  layer: string
): Promise<ComponentDocument[]> {
  const all = await getAllComponents()
  return all.filter((c) => c.layer === layer)
}

/**
 * Search components by name, description, or tags.
 */
export async function searchComponents(
  query: string
): Promise<ComponentDocument[]> {
  const all = await getAllComponents()
  const q = query.toLowerCase()
  return all.filter(
    (c) =>
      c.name.includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags?.some((t) => t.includes(q))
  )
}

// ── Component documentation queries ─────────────────────────────────

/**
 * Get documentation for a component.
 */
export async function getComponentDoc(
  name: string
): Promise<ComponentDocDocument | null> {
  try {
    const doc = await getDb().get(`doc:${name}`)
    return doc as ComponentDocDocument
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) return null
    throw err
  }
}

/**
 * Get all component documentation.
 */
export async function getAllComponentDocs(): Promise<ComponentDocDocument[]> {
  const result = await getDb().allDocs({
    include_docs: true,
    startkey: "doc:",
    endkey: "doc:\ufff0",
  })

  return result.rows
    .map((row) => row.doc as ComponentDocDocument)
    .filter((doc) => doc.type === "component-doc")
}

// ── Demo queries ────────────────────────────────────────────────────

/**
 * Check if a component has a demo.
 */
export async function hasDemoFor(name: string): Promise<boolean> {
  try {
    const doc = await getDb().get(`demo:${name}`)
    return (doc as DemoDocument).hasDemo
  } catch {
    return false
  }
}

/**
 * Get all component names that have demos.
 */
export async function getDemoNames(): Promise<string[]> {
  const result = await getDb().allDocs({
    include_docs: true,
    startkey: "demo:",
    endkey: "demo:\ufff0",
  })

  return result.rows
    .map((row) => row.doc as DemoDocument)
    .filter((doc) => doc.type === "demo" && doc.hasDemo)
    .map((doc) => doc.componentName)
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
    getDb()
      .get(`demo:${name}`)
      .catch(() => null) as Promise<DemoDocument | null>,
  ])

  return {
    ...component,
    docs: docs ?? undefined,
    demo: demo ?? undefined,
  }
}

/**
 * Get all components with their docs (for catalog pages).
 */
export async function getAllComponentsWithDocs(): Promise<ComponentWithDocs[]> {
  const [components, docs, demos] = await Promise.all([
    getAllComponents(),
    getAllComponentDocs(),
    getDemoNames(),
  ])

  const docMap = new Map(docs.map((d) => [d.componentName, d]))
  const demoSet = new Set(demos)

  return components.map((component) => ({
    ...component,
    docs: docMap.get(component.name),
    demo: demoSet.has(component.name)
      ? ({
          _id: `demo:${component.name}`,
          type: "demo" as const,
          componentName: component.name,
          hasDemo: true,
          createdAt: component.createdAt,
          updatedAt: component.updatedAt,
        } satisfies DemoDocument)
      : undefined,
  }))
}

// ── Write operations ────────────────────────────────────────────────

/**
 * Upsert a document (create or update).
 */
export async function upsertDocument<T extends RegistryDocument>(
  doc: T
): Promise<T> {
  const db = getDb()
  try {
    const existing = await db.get(doc._id)
    const updated = {
      ...doc,
      _rev: existing._rev,
      updatedAt: new Date().toISOString(),
    }
    await db.put(updated as PouchDB.Core.PutDocument<RegistryDocument>)
    return updated as T
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) {
      const newDoc = {
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await db.put(newDoc as PouchDB.Core.PutDocument<RegistryDocument>)
      return newDoc as T
    }
    throw err
  }
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(id: string): Promise<void> {
  const db = getDb()
  try {
    const doc = await db.get(id)
    await db.remove(doc)
  } catch (err: unknown) {
    if ((err as { status?: number }).status !== 404) throw err
  }
}

// ── Sync ────────────────────────────────────────────────────────────

/**
 * Start live bidirectional sync with a remote CouchDB.
 * Returns a cancel function.
 */
export function startSync(): (() => void) | null {
  const remote = getRemoteDb()
  if (!remote) return null

  const sync = getDb().sync(remote, {
    live: true,
    retry: true,
  })

  sync.on("error", (err) => {
    console.error("[mukoko] Sync error:", err)
  })

  return () => sync.cancel()
}

// ── Database info ───────────────────────────────────────────────────

/**
 * Get database information (doc count, adapter, etc.)
 */
export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const info = await getDb().info()
  return {
    name: info.db_name,
    docCount: info.doc_count,
    updateSeq: info.update_seq,
    adapter: String(
      (info as unknown as Record<string, unknown>).adapter ?? "memory"
    ),
  }
}

/**
 * Check if the database has been seeded.
 */
export async function isSeeded(): Promise<boolean> {
  try {
    await getDb().get("config:seeded")
    return true
  } catch {
    return false
  }
}
