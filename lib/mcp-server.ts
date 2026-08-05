/**
 * Mzizi MCP Server — document-route, served from the repo.
 *
 * WHERE THIS READS FROM, AND WHY IT CHANGED.
 *
 * It used to read `component_documents` on Supabase: one JSON document per
 * component, fetched by name. That is gone. Components are REAL FILES under
 * `components/registry/n<N>-<label>/` which this app compiles and typechecks, and
 * `registry.json` is the manifest describing them. Both are in git, both are in
 * this process, and neither can drift from the code the way a JSON column could.
 *
 * So this server holds no Supabase client at all. It answers from
 * `lib/registry.ts` (the manifest joined to the files on disk) and
 * `lib/registry-source.ts` (the bytes). A component that fails to compile fails
 * the build before it can be served — which is the guarantee a database row never
 * offered.
 *
 * What that removes, concretely: the PostgREST 1000-row paging dance (the store
 * was bigger than one page, so an unpaged select silently truncated and whole
 * collections vanished from the surface), the RLS round trip, and the `source_code`
 * overlay that patched disk source back over a document that no longer had any.
 *
 * Read-only by construction — there is nothing here that can write.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { readComponent, readComponents, type RegistryItem } from "@/lib/registry"
import { readComponentSource } from "@/lib/registry-source"

const VERSION = "1.0.0"

// ─── Result helpers ─────────────────────────────────────────────────────────

function toolError(message: string, err?: unknown) {
  const reason = err instanceof Error ? err.message : err ? String(err) : ""
  return {
    isError: true,
    content: [{ type: "text" as const, text: reason ? `${message}: ${reason}` : message }],
  }
}

function jsonContent(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] }
}

type Meta = Record<string, unknown> & { owner?: string; collection?: string }

const metaOf = (item: RegistryItem): Meta =>
  ((item as unknown as { meta?: Meta }).meta ?? {}) as Meta

/** The lean index row — what `list_components` and `mzizi://components` return. */
function indexRow(item: RegistryItem) {
  const meta = metaOf(item)
  return {
    name: item.name,
    node: item.node ?? null,
    collection: meta.collection ?? item.nodeLabel ?? null,
    owner: meta.owner ?? null,
  }
}

/** Collections summarised by node, with an ownership breakdown. */
function collectionSummary() {
  const summary = new Map<
    string,
    { node: number; collection: string; total: number; byOwner: Record<string, number> }
  >()
  for (const item of readComponents()) {
    const row = indexRow(item)
    const key = row.collection ?? "(uncollected)"
    const entry = summary.get(key) ?? {
      node: row.node ?? 0,
      collection: key,
      total: 0,
      byOwner: {},
    }
    entry.total += 1
    const owner = row.owner ?? "unknown"
    entry.byOwner[owner] = (entry.byOwner[owner] ?? 0) + 1
    summary.set(key, entry)
  }
  return [...summary.values()].sort(
    (a, b) => a.node - b.node || a.collection.localeCompare(b.collection)
  )
}

// ─── Server factory ─────────────────────────────────────────────────────────

/**
 * Build the Mzizi MCP server.
 *
 * Takes no arguments. It used to take a request-scoped anon `SupabaseClient`;
 * there is no store to connect to any more, so a parameter kept "for symmetry"
 * would just be a credential nothing uses.
 */
export async function createMziziMcpServer(): Promise<McpServer> {
  const server = new McpServer({ name: "mzizi", version: VERSION })

  // ── Resources ─────────────────────────────────────────────────────────────

  server.resource(
    "components",
    "mzizi://components",
    {
      description:
        "Mzizi component registry index — one row per component (name / node / collection / owner). The full record is available via the get_component tool.",
    },
    async () => ({
      contents: [
        {
          uri: "mzizi://components",
          mimeType: "application/json",
          text: JSON.stringify(readComponents().map(indexRow), null, 2),
        },
      ],
    })
  )

  server.resource(
    "nodes",
    "mzizi://nodes",
    { description: "Per-node collection summary — counts and ownership breakdown." },
    async () => ({
      contents: [
        {
          uri: "mzizi://nodes",
          mimeType: "application/json",
          text: JSON.stringify(collectionSummary(), null, 2),
        },
      ],
    })
  )

  // ── Tools ─────────────────────────────────────────────────────────────────

  server.tool(
    "list_components",
    "List components from the registry. Optionally filter by node or owner (bundu | nyuchi | mzizi | framework). Node numbers are labels, not a sequence, and the set is never capped — a node above the highest you know of is a valid filter, not an error. Returns the lean index (name / node / collection / owner) — use get_component for the full record.",
    {
      // No .max(). A bound here rejects the filter before it ever reaches the
      // registry, so an agent asking for a node above the cap gets a schema
      // error rather than an answer — .max(10) is what made N11 undiscoverable
      // over MCP, and .max(11) would go on to hide N12. An unknown node
      // legitimately returns zero rows; that is the registry's answer to give.
      node: z.number().int().positive().optional(),
      owner: z.enum(["bundu", "nyuchi", "mzizi", "framework"]).optional(),
      limit: z.number().int().min(1).max(5000).default(500),
    },
    async ({ node, owner, limit }) => {
      try {
        const rows = readComponents()
          .map(indexRow)
          .filter((r) => (node == null || r.node === node) && (!owner || r.owner === owner))
          .slice(0, limit)
        return jsonContent(rows)
      } catch (err) {
        return toolError("list_components failed", err)
      }
    }
  )

  server.tool(
    "get_component",
    "Fetch one component in full — one read, everything: metadata, owner, node, documented use cases / variants / a11y notes, install contract (dependencies, registryDependencies, files) and the component's actual source code.",
    {
      name: z.string().min(1).describe("Component name, e.g. 'button', 'nyuchi-tokens'"),
    },
    async ({ name }) => {
      try {
        const item = readComponent(name)
        if (!item) return toolError(`Component '${name}' not found`)
        const { meta, ...rest } = item as RegistryItem & { meta?: Meta }
        return jsonContent({
          ...rest,
          ...indexRow(item),
          meta: meta ?? {},
          // Read from the file the build compiles. Absent stays absent — never
          // an empty string, which reads as "this component has no code".
          source_code: readComponentSource(name),
        })
      } catch (err) {
        return toolError("get_component failed", err)
      }
    }
  )

  server.tool(
    "list_collections",
    "List the per-node collections (primitives, brand, styling-libs, … — the set is never capped) with total counts and ownership breakdown.",
    {},
    async () => {
      try {
        return jsonContent(collectionSummary())
      } catch (err) {
        return toolError("list_collections failed", err)
      }
    }
  )

  server.tool(
    "get_database_status",
    "Diagnostic info — where the registry is read from and how many components resolve.",
    {},
    async () => {
      try {
        const items = readComponents()
        return jsonContent({
          // Not "supabase". Naming a store this server no longer reads is the
          // exact drift the migration removed.
          provider: "registry",
          source: "registry.json + components/registry/** (git)",
          status: "connected",
          components: items.length,
          collections: collectionSummary().length,
          readOnly: true,
        })
      } catch (err) {
        return toolError("get_database_status failed", err)
      }
    }
  )

  return server
}
