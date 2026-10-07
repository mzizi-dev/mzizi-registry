// MZIZI AI CONTEXT — N10: Documentation rung
//
// Generates context windows for AI assistants working on Mzizi. This lib is
// framework-agnostic — it exports pure TypeScript functions that produce
// strings. No React, no Svelte.
//
// The node map is the DNA helix's node set, which is UNCAPPED: N11 (discovery)
// and N12 (skills) are rungs past N10, and more may come. It used to be the
// retired horizontal / vertical / depth / outlier axis model stopping at N10,
// and this file called the system "the Nyuchi Design System" and pointed at a
// Supabase project. The Rust build (`mzizi-ai-context.rs`) renders the same
// text; keep the two in step.
//
// IMPORTANT: This lib never hardcodes counts. Counts drift as the ecosystem
// evolves. Pass live counts (GET https://api.mzizi.dev/v1/stats, or
// mzizi_get_architecture on the MCP) into generateAIContext().

/**
 * Live totals, supplied by the caller. There is no stable count: the registry
 * has no per-component status, and `/v1/stats` reports none.
 */
export interface EcosystemCounts {
  /** Every component in the registry (`meta.registryTotal` on `/v1/ui`). */
  totalComponents: number
  /** How many nodes exist. Uncapped. */
  totalNodes: number
}

/** One row of the node map. Same shape as `NodeEntry` in the Rust build. */
export interface NodeEntry {
  /** Node number. No upper bound. */
  number: number
  /** Short name, e.g. `Primitives`. */
  label: string
  /** What the node is for, one line. */
  role: string
}

export interface AIContextOptions {
  counts?: EcosystemCounts
  includeRules?: boolean
  includeArchitecture?: boolean
  includeNodeMap?: boolean
}

const SITE = "https://mzizi.dev"
const GITHUB_REPO = "mzizi-dev/mzizi-registry"
const MCP_SERVER = "https://mcp.mzizi.dev/mcp"

/**
 * The node set as it stands. A default, not a definition: the authority is
 * `GET https://api.mzizi.dev/v1/architecture`. Same rows as `current_nodes()` in the Rust build.
 */
const CURRENT_NODES: ReadonlyArray<NodeEntry> = [
  { number: 1, label: "Tokens", role: "CSS substrate. The only node that defines CSS values." },
  { number: 2, label: "Primitives", role: "Headless and accessible. Radix + CVA." },
  { number: 3, label: "Brand", role: "N2 plus Ubuntu. Uses mzizi-harness." },
  { number: 4, label: "Safety", role: "Gates. Validates input, guards AI output." },
  { number: 5, label: "Resilience", role: "Circuit breakers, retries, fallback chains." },
  { number: 6, label: "Pages", role: "Pure composition. No inline primitives." },
  { number: 7, label: "Shell", role: "App chrome. Header, nav, theme, lifecycle." },
  { number: 8, label: "Assurance", role: "Observability, SLO tracking, chaos testing." },
  { number: 9, label: "Fundi", role: "Self-healing. Turns assurance signals into filed defects." },
  { number: 10, label: "Documentation", role: "Self-describing. The system explains itself." },
  { number: 11, label: "Discovery", role: "Machine visibility. Metadata and structured data." },
  { number: 12, label: "Skills", role: "What the system knows how to do, authored in git." },
]

/** The node map as text, each label padded to the widest so it aligns at any node count. */
function renderNodeMap(nodes: ReadonlyArray<NodeEntry>): string {
  const widest = nodes.reduce((w, n) => Math.max(w, n.label.length), 0)
  let out = "## Node map\n\n"
  out +=
    "Every component belongs to exactly one node. The node set is UNCAPPED — a\n" +
    "new node may be added at any time, so never assume the highest number here\n" +
    "is the last one.\n\n"
  for (const n of nodes) {
    out += `  N${String(n.number).padEnd(3)} ${n.label.padEnd(widest)}  — ${n.role}\n`
  }
  return out
}

const ECOSYSTEM_RULES = `
## Rules (non-negotiable)

1. CSS values live only in N1. All other nodes use var(--token-name). Never hex outside N1.
2. Icons import from @/lib/icons only. Never from lucide-react directly.
3. N2 primitives never import useMziziHarness.
4. N3 brand components always destructure { log, motion, LiveRegion } from useMziziHarness.
5. N6 pages: pure composition, semantic CSS vars only, accept children/slots.
6. All interactive components: data-slot + data-portal attributes required.
7. Status colors use semantic tokens: --status-success, --status-error, --status-warning.
8. Touch targets: 48px minimum. Focus rings: focus-visible:outline-2.
9. No hardcoded numbers in code or copy. Query the live counts.
10. Shona terms come from the Ubuntu doctrine. Never translate or invent them.
`.trim()

/**
 * Generate a context window string for an AI assistant.
 * Pass live counts — never hardcode them.
 */
export function generateAIContext(options: AIContextOptions = {}): string {
  const { counts, includeRules = true, includeArchitecture = true, includeNodeMap = true } = options

  const parts: string[] = []

  if (includeArchitecture) {
    parts.push("# Mzizi Design System")
    parts.push("")

    if (counts) {
      parts.push(
        `Live counts: ${counts.totalComponents} components total, across ${counts.totalNodes} nodes.`
      )
    }
    parts.push(`Source: ${SITE} | GitHub: ${GITHUB_REPO}`)
    if (!counts) parts.push(`For live counts: ${MCP_SERVER}`)

    parts.push("")
  }

  if (includeNodeMap) {
    parts.push(renderNodeMap(CURRENT_NODES))
    parts.push("")
  }

  if (includeRules) {
    parts.push(ECOSYSTEM_RULES)
    parts.push("")
  }

  parts.push(`MCP server: ${MCP_SERVER}`)

  return parts.join("\n")
}

/**
 * Targeted context for specific AI surfaces.
 * These are thin wrappers — the caller supplies live counts.
 */
export const aiContextPresets = {
  /** Full context for MCP server (architecture + rules + node map) */
  mcp: (counts?: EcosystemCounts) =>
    generateAIContext({
      counts,
      includeArchitecture: true,
      includeRules: true,
      includeNodeMap: true,
    }),

  /** Copilot context (rules only, no architecture prose) */
  copilot: () =>
    generateAIContext({ includeArchitecture: false, includeRules: true, includeNodeMap: true }),

  /** Claude project context (full context) */
  claude: (counts?: EcosystemCounts) =>
    generateAIContext({
      counts,
      includeArchitecture: true,
      includeRules: true,
      includeNodeMap: true,
    }),

  /** Minimal context for cursor IDE (node map + rules) */
  cursor: () =>
    generateAIContext({ includeArchitecture: false, includeRules: true, includeNodeMap: true }),
} as const

// Both are already exported at their declarations above; re-listing them here was
// a TS2484 conflict, so this file did not compile in any consumer that installed it.
