/**
 * Client-side PouchDB for browser caching and offline support.
 *
 * Uses IndexedDB as the backing store. Can sync with the server's
 * PouchDB or a remote CouchDB instance for real-time updates.
 *
 * Usage:
 *   import { useRegistryDb } from "@/lib/db/client"
 *
 *   function MyComponent() {
 *     const { db, isReady } = useRegistryDb()
 *     // ... use db for local queries
 *   }
 *
 * Note: This module is only imported on the client side ("use client").
 * Server components should use "@/lib/db" directly.
 */

"use client"

import { useState, useEffect, useCallback } from "react"

// We use a lightweight approach — fetch from the API and cache in IndexedDB
// via the browser's Cache API or a simple in-memory store.
// Full PouchDB in the browser is reserved for when CouchDB sync is enabled.

interface CachedComponent {
  name: string
  type: string
  description: string
  dependencies: string[]
  registryDependencies: string[]
  category?: string
  layer?: string
  cachedAt: number
}

interface RegistryCache {
  components: CachedComponent[]
  cachedAt: number
  ttl: number
}

const CACHE_KEY = "mukoko-registry-cache"
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

/**
 * Read cache from IndexedDB via localStorage (simple and reliable).
 */
function readCache(): RegistryCache | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache: RegistryCache = JSON.parse(raw)
    if (Date.now() - cache.cachedAt > cache.ttl) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return cache
  } catch {
    return null
  }
}

/**
 * Write cache to localStorage.
 */
function writeCache(components: CachedComponent[]): void {
  if (typeof window === "undefined") return
  try {
    const cache: RegistryCache = {
      components,
      cachedAt: Date.now(),
      ttl: CACHE_TTL,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full — silently fail
  }
}

/**
 * React hook for accessing the registry with client-side caching.
 */
export function useRegistryCache() {
  const [components, setComponents] = useState<CachedComponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/ui")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const items: CachedComponent[] = (data.items ?? []).map(
        (item: CachedComponent) => ({
          ...item,
          cachedAt: Date.now(),
        })
      )
      setComponents(items)
      writeCache(items)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Try cache first
    const cached = readCache()
    if (cached) {
      setComponents(cached.components)
      setIsLoading(false)
      return
    }
    // Fetch from API
    refresh()
  }, [refresh])

  return {
    components,
    isLoading,
    error,
    refresh,
    /** Search components by name or description */
    search: (query: string) => {
      const q = query.toLowerCase()
      return components.filter(
        (c) =>
          c.name.includes(q) || c.description.toLowerCase().includes(q)
      )
    },
  }
}

/**
 * Invalidate the client-side cache (e.g., after a contributor adds a component).
 */
export function invalidateRegistryCache(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(CACHE_KEY)
}
