// nyuchi-docs-api runs as a Supabase edge function on Deno.
import { createClient } from "jsr:@supabase/supabase-js@2"

// NYUCHI DOCS API — N10: Documentation
//
// Supabase Deno edge function. Serves documentation and AI instruction
// content from the database. The database is the mechanical source
// of truth; this function is the read layer over it.
//
// Two corrections were needed the moment this reached disk, and both were
// invisible while it lived in a database column:
//
//   1. The header said "Cloudflare Worker (workers-rs/Rust WASM)". The body is
//      `Deno.serve`, `Deno.env.get` and a `jsr:` specifier — none of which is
//      Cloudflare, and none of which is Rust. The description was of a program
//      that is not this one, the same defect class as the five registry files
//      whose extensions disagreed with their contents.
//   2. It is excluded from `tsconfig.json`, alongside `supabase/functions`,
//      which is excluded for exactly this reason: tsc configured with the DOM
//      and Next libs cannot check Deno-runtime code, and adding `@types/deno`
//      to check one registry row would pull a second global environment across
//      the whole project. Excluding is honest; hand-declaring `Deno` would be a
//      fiction that compiles.
//
// SECURITY, pre-existing and worth stating plainly: this reads
// `SUPABASE_SERVICE_ROLE_KEY`, so it is a service-role surface distributed
// through a public registry. A consumer installing it inherits a function that
// bypasses RLS. It is not introduced here and not in scope for the extraction,
// but it should not stay this way — an anon client under RLS is sufficient for
// a read layer over published documentation.
//
// Routes:
//   GET /docs                        — list all published documentation pages
//   GET /docs/:slug                  — get a page by slug
//   GET /docs/category/:category     — filter pages by category
//   GET /ai-instructions             — list all active AI instruction sets
//   GET /ai-instructions/:name       — get instruction set by name or target
//   GET /architecture                — full 3D ecosystem model (all 10 nodes)
//   GET /architecture/nodes          — node list with counts
//   GET /architecture/axes           — axis summary
//   GET /changelog                   — recent changelog entries
//   GET /changelog/:version          — specific version entry
//   GET /counts                      — live system counts (no hardcoded numbers)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...CACHE_HEADERS,
    },
  })
}

function error(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  })
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== "GET") {
    return error("Method not allowed", 405)
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  )

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\//, "").split("/")
  const [resource, ...rest] = path

  try {
    // ── GET /counts ─────────────────────────────────────────────
    if (resource === "counts") {
      const { data, error: err } = await supabase.rpc("get_system_counts")
      if (err) return error(err.message, 500)
      return json(data?.[0] ?? {})
    }

    // ── GET /docs ────────────────────────────────────────────────
    if (resource === "docs") {
      const sub = rest[0]
      const subsub = rest[1]

      // GET /docs/category/:category
      if (sub === "category" && subsub) {
        const { data, error: err } = await supabase
          .from("documentation_pages")
          .select(
            "slug, title, category, subcategory, description, keywords, sort_order, related_nodes, related_components, status, updated_at"
          )
          .eq("category", subsub)
          .eq("status", "published")
          .order("sort_order")
        if (err) return error(err.message, 500)
        return json(data)
      }

      // GET /docs/:slug — specific page with full content
      if (sub && sub !== "category") {
        const { data, error: err } = await supabase
          .from("documentation_pages")
          .select("*")
          .eq("slug", sub)
          .eq("status", "published")
          .single()
        if (err) return error("Page not found", 404)
        return json(data)
      }

      // GET /docs — list all pages (no content body, just metadata)
      const { data, error: err } = await supabase
        .from("documentation_pages")
        .select(
          "slug, title, category, subcategory, description, keywords, sort_order, related_nodes, status, updated_at"
        )
        .eq("status", "published")
        .order("category")
        .order("sort_order")
      if (err) return error(err.message, 500)
      return json(data)
    }

    // ── GET /ai-instructions ─────────────────────────────────────
    if (resource === "ai-instructions") {
      const identifier = rest[0]

      if (identifier) {
        // Try name first, then target
        const { data, error: err } = await supabase
          .from("ai_instructions")
          .select("*")
          .eq("status", "active")
          .or(`name.eq.${identifier},target.eq.${identifier}`)
          .order("version", { ascending: false })
        if (err) return error(err.message, 500)
        if (!data?.length) return error("Instruction not found", 404)
        // If multiple versions match, return the latest
        return json(data[0])
      }

      const { data, error: err } = await supabase
        .from("ai_instructions")
        .select(
          "id, name, target, description, applies_to_nodes, applies_to_categories, version, status, updated_at"
        )
        .eq("status", "active")
        .order("target")
      if (err) return error(err.message, 500)
      return json(data)
    }

    // ── GET /architecture ────────────────────────────────────────
    if (resource === "architecture") {
      const sub = rest[0]

      // GET /architecture/nodes — node list with component counts
      if (sub === "nodes") {
        const { data, error: err } = await supabase.rpc("get_node_counts")
        if (err) return error(err.message, 500)
        return json(data)
      }

      // GET /architecture/axes — axis summary
      if (sub === "axes") {
        const { data, error: err } = await supabase.rpc("get_axes_summary")
        if (err) return error(err.message, 500)
        return json(data)
      }

      // GET /architecture — full model (all nodes + axes)
      const { data, error: err } = await supabase.rpc("get_architecture")
      if (err) return error(err.message, 500)
      return json(data)
    }

    // ── GET /changelog ───────────────────────────────────────────
    if (resource === "changelog") {
      const version = rest[0]

      if (version) {
        const { data, error: err } = await supabase.rpc("get_changelog_entry", {
          p_version: version,
        })
        if (err) return error(err.message, 500)
        if (!data?.length) return error("Version not found", 404)
        return json(data[0])
      }

      const limit = parseInt(url.searchParams.get("limit") ?? "20", 10)
      const offset = parseInt(url.searchParams.get("offset") ?? "0", 10)
      const { data, error: err } = await supabase.rpc("list_changelog", {
        p_limit: Math.min(limit, 100),
        p_offset: Math.max(offset, 0),
      })
      if (err) return error(err.message, 500)
      return json(data)
    }

    return error("Not found", 404)
  } catch (e) {
    console.error("[nyuchi-docs-api]", e)
    return error("Internal server error", 500)
  }
})
