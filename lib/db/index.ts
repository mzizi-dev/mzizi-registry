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
 *   Brand       →  lib/tokens/palette.source.ts (21 colour families)
 *                  + lib/tokens/brand.source.ts (everything else brand)
 *   Releases    →  content/changelog/releases.json → lib/changelog.generated.ts
 *
 * This block said `content/registry/<collection>/<name>.json`. That directory
 * does not exist and never did — `content/` holds `doctrine/` only, and
 * `lib/registry.ts` reads a single `registry.json` at the repo root. A path in a
 * header is the first thing someone greps for, so a plausible-but-absent one
 * costs more than no path at all.
 *
 * Nothing here is Supabase any more. The registry holds no database: every
 * function in this module reads files that ship with the app. The machine-
 * written data that used to be read from Supabase — component version history,
 * usage telemetry, the fundi and observability logs, health and chaos events,
 * the MCP tool registry — belongs to the Mzizi console (mzizi-dev/mzizi-console),
 * the only thing in the estate that talks to Supabase. The routes and pages that
 * served it answer what production answered with no database configured.
 *
 * `supabase/` (schema.sql, seeds, data-migrations) stays in the repo as history;
 * nothing here reads it.
 *
 * See docs/db-contents-rule.md for the original rule and the live audit.
 *
 * Usage:
 *   import { getComponent, getAllComponents } from "@/lib/db"
 *   const button = await getComponent("button")   // reads a file, not a row
 */

import { doctrineRows, readDoctrineSorted, DOCTRINE } from "@/lib/doctrine"
import { readComponent, readComponents, readNodeCounts, type RegistryItem } from "@/lib/registry"
import { CHANGELOG_RELEASES } from "@/lib/changelog.generated"
import type {
  ComponentRow,
  ComponentDocRow,
  ComponentDemoRow,
  ComponentWithDocs,
  DatabaseInfo,
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
  HelixClass,
  HelixModel,
  HelixNode,
  HelixStrand,
  UbuntuPillarRow,
  UbuntuPrincipleRow,
} from "./types"

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
 * Get components listing `category` in their `categories`.
 *
 * This compared a `category` field, the retired Supabase row's name, which no registry
 * item has, so it matched nothing for every input. Items carry `categories`, an array.
 */
export async function getComponentsByCategory(category: string): Promise<RegistryItem[]> {
  return readComponents().filter((c) => (c.categories ?? []).includes(category))
}

/**
 * Get components on a node of the helix, by node number as written (`"2"`, not `"02"`).
 */
export async function getComponentsByNode(node: string): Promise<RegistryItem[]> {
  return readComponents().filter((c) => typeof c.node === "number" && String(c.node) === node)
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
export async function searchComponents(query: string): Promise<RegistryItem[]> {
  // Plain substring match over the files. The old implementation had to strip
  // PostgREST-significant characters to avoid filter-structure injection; reading
  // files removes that attack surface entirely rather than sanitising for it.
  const q = query.trim().toLowerCase()
  if (!q) return []
  return readComponents().filter((c) => {
    const name = String(c.name ?? "").toLowerCase()
    const desc = String(c.description ?? "").toLowerCase()
    return name.includes(q) || desc.includes(q)
  })
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
 *
 * Reads `lib/changelog.generated.ts`, not Supabase. The release history moved
 * into the repo with everything else — see `scripts/generate-changelog.mjs` for
 * why the seed is a record rather than something derived from `CHANGELOG.md`.
 * The committed order IS the view's order, so this returns the array as-is.
 */
export async function getChangelogEntries(): Promise<ChangelogRow[]> {
  // `entry_order` is repo bookkeeping, not a column the view ever had — it
  // records the order entries sharing a version are served in, which Postgres
  // answered from physical row order and a file cannot. It is stripped here so
  // this payload stays exactly the 27 fields `releases` projected.
  return CHANGELOG_RELEASES.map((entry) => {
    const { entry_order: _entryOrder, ...row } = entry as ChangelogRow & { entry_order?: number }
    return row as ChangelogRow
  })
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
 *
 * Reads `lib/changelog.generated.ts`. It projects to the narrower `changelog`
 * column set on purpose: the `releases` VIEW added `line`, `line_rank`,
 * `major`, `minor`, `patch`, `release_kind` and `components_touched` on top of
 * the `changelog` TABLE, and this endpoint served the table. Serving the seven
 * extra fields here would be a payload change to a route that is not broken,
 * so the projection is explicit rather than a spread.
 */
export async function getChangelogByVersion(version: string): Promise<ChangelogRow[]> {
  const orderOf = (row: ChangelogRow) =>
    (
      CHANGELOG_RELEASES.find(
        (entry) => entry.version === row.version && entry.title === row.title
      ) as (ChangelogRow & { entry_order?: number }) | undefined
    )?.entry_order ?? 0

  return CHANGELOG_RELEASES.filter((entry) => entry.version === version)
    .map(
      (entry) =>
        ({
          version: entry.version,
          title: entry.title,
          description: entry.description,
          released_at: entry.released_at,
          created_at: entry.created_at,
          breaking: entry.breaking,
          nodes_affected: entry.nodes_affected,
          components_added: entry.components_added,
          components_modified: entry.components_modified,
          components_deprecated: entry.components_deprecated,
          components_removed: entry.components_removed,
          tools_added: entry.tools_added,
          tools_modified: entry.tools_modified,
          tools_deprecated: entry.tools_deprecated,
          tools_removed: entry.tools_removed,
          linked_issues: entry.linked_issues,
          total_stable: entry.total_stable,
          total_deprecated: entry.total_deprecated,
          total_alpha: entry.total_alpha,
          changed_by: entry.changed_by,
        }) as unknown as ChangelogRow
    )
    .sort((a, b) => {
      // `created_at` ascending with NULLS LAST, matching the
      // `.order("created_at", { ascending: true, nullsFirst: false })` this
      // replaced. The null branch is not a detail: ten entries have no
      // `created_at`, and treating null as the empty string sorts them FIRST,
      // which silently reordered 4.1.0 — the one version where a dated and an
      // undated entry share a number.
      const aNull = a.created_at == null
      const bNull = b.created_at == null
      if (aNull !== bNull) return aNull ? 1 : -1
      const byDate = aNull ? 0 : String(a.created_at).localeCompare(String(b.created_at))
      if (byDate !== 0) return byDate
      // Then `entry_order`. Eight versions carry two or three entries that share
      // a `created_at` to the microsecond, so `created_at` alone leaves their
      // order to whatever the sort happens to do — and Postgres broke those ties
      // by physical row order, which no file can reproduce by rule. The order is
      // therefore recorded as data in `content/changelog/releases.json` rather
      // than guessed: it is real, and it is diffable.
      return orderOf(a) - orderOf(b)
    })
}

// ── Design token queries ────────────────────────────────────────────
//
// `getDesignTokens()` is DELETED, not repointed.
//
// It selected `source_code` from the `components` view where
// `name = 'mzizi-tokens'` and JSON.parse'd the result. That column has been
// null on every row since component source moved to disk (§8.3), so the
// function could only ever return null — and it had no callers anywhere in
// `app/`, `lib/`, `components/` or `scripts/`.
//
// Repointing it at the file would have been the wrong fix twice over: nothing
// wants it, and the token pipeline already runs the other way. `pnpm
// tokens:sync` GENERATES `lib/tokens/palette.generated.ts` and the
// `tokens:generated` block of `app/globals.css` from
// `lib/tokens/palette.source.ts` — the canonical palette in this repo, not the
// database — with `pnpm tokens:verify` as the drift gate (§8.4.1). A second reader that parsed
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
 * by node number, counted from the registry on disk.
 */
export async function getNodeCounts(): Promise<Record<number, number>> {
  return readNodeCounts()
}

/**
 * The Mzizi DNA double helix — nodes (on engineering strands) + rungs
 * (cross-cutting base pairs) + the six strands, read live from
 * `component_documents` (`documentation-architecture-{nodes,strands}`),
 * the single source of truth the MCP serves. Per-node component counts
 * are counted from the registry on disk. Returns empty arrays if the
 * collections are empty — callers render an empty
 * state. There are no axes and no outliers.
 */
export async function getHelixModel(): Promise<HelixModel> {
  const empty: HelixModel = { nodes: [], rungs: [], strands: [] }

  // The helix comes from content/doctrine, not Supabase, and so do the counts.
  //
  // `readNodeCounts()` has always counted the registry ON DISK — it is
  // `readComponents().reduce(...)`, not a query. The `isSupabaseConfigured()`
  // ternary that stood in front of it was therefore gating a disk read on a
  // database credential, and on a deployment with none it substituted `{}`:
  // every node and rung served `component_count: 0` while the rest of the
  // payload was correct. `/api/v1/architecture` looked healthy at 200 and was
  // quietly wrong, which is worse than the 503 its sibling returned.
  //
  // A count is derived, not stored. Deriving it from whatever is on disk is the
  // whole reason it cannot go stale.
  const nodeRes = {
    error: null,
    data: readDoctrineSorted(DOCTRINE.nodes).map((d) => ({ document: d.data })),
  }
  const strandRes = {
    error: null,
    data: readDoctrineSorted(DOCTRINE.strands).map((d) => ({ document: d.data })),
  }
  const counts = await getNodeCounts()

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
 * null when no element carries that number.
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

// ── Skills — moved out of the database ──────────────────────────────
//
// `listSkills`, `getSkill` and `getSkillsSummary` lived here, wrapping the
// `list_skills()`, `get_skill()` and `get_skills_summary()` RPCs against the
// Supabase `skills` collection. They are deleted, not deprecated.
//
// Skills are authored in mzizi-dev/agent-tools and published as
// `@nyuchi/mzizi-skills`. `lib/skills.ts` reads that package; the routes and
// pages read `lib/skills.ts`. The database copy was a second home for the same
// content, kept in step by a script somebody had to remember to run — and it
// was not run, so this app served skills instructing agents to write into a
// column that had been cleared.
//
// Leaving these functions behind as an unused fallback would leave exactly the
// thing that caused it: a second way to answer the same question, ready for the
// next caller who reaches for the nearest import.

// ── Ubuntu doctrine — issue #45 (`ubuntu_pillars`, `ubuntu_principles`) ──
//
// Two tables, five rows each. Tables are canonical; seeding is out-of-band.
// Callers must tolerate an empty array and render an empty state.

/**
 * The Ubuntu pillars, from content/doctrine. Empty array if the collection is empty.
 */
export async function getUbuntuPillars(): Promise<UbuntuPillarRow[]> {
  return doctrineRows<UbuntuPillarRow>(DOCTRINE.ubuntuPillars)
}

/**
 * The Ubuntu principles, from content/doctrine. Empty array if the collection is empty.
 */
export async function getUbuntuPrinciples(): Promise<UbuntuPrincipleRow[]> {
  return doctrineRows<UbuntuPrincipleRow>(DOCTRINE.ubuntuPrinciples)
}
