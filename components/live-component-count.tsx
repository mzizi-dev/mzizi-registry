import { getPublicClient, isSupabaseConfigured } from "@/lib/db"

/**
 * Live count of components where `status = 'stable'`. Renders in Server
 * Components (including MDX pages) so every docs page always reflects the
 * current Supabase row count. Falls back to the caller-supplied string if
 * Supabase is unreachable or misconfigured — never blocks render.
 */
export async function LiveComponentCount({ fallback = "hundreds of" }: { fallback?: string }) {
  if (!isSupabaseConfigured()) return <>{fallback}</>
  try {
    const { count, error } = await getPublicClient()
      .from("components")
      .select("*", { count: "exact", head: true })
      .eq("status", "stable")
    if (error || count == null) return <>{fallback}</>
    return <>{count.toLocaleString()}</>
  } catch {
    return <>{fallback}</>
  }
}
