// NYUCHI AI CONTEXT — N10: Documentation Outlier
//
// Generates context windows for AI assistants working on the Nyuchi
// Design System. This lib is framework-agnostic — it exports pure
// TypeScript functions that produce strings. No React, no Svelte.
//
// The 3D ecosystem model:
//   horizontal nodes  = N2 (primitives), N3 (brand), N6 (pages), N7 (shell)
//   vertical nodes    = N1 (tokens), N4 (safety), N5 (resilience)
//   depth node        = N8 (assurance)
//   outlier actors    = N9 (Fundi — self-healing), N10 (Documentation — self-describing)
//
// IMPORTANT: This lib never hardcodes counts. Counts drift as the
// ecosystem evolves. Always pass live counts from get_node_counts()
// or get_system_counts() into generateAIContext().

export interface EcosystemCounts {
  totalComponents: number
  totalStable: number
  totalNodes: number
}

export interface AIContextOptions {
  counts?: EcosystemCounts
  includeRules?: boolean
  includeArchitecture?: boolean
  includeNodeMap?: boolean
}

// The full ecosystem model — never hardcoded axis names or L-refs
const ECOSYSTEM_MODEL = `
## Nyuchi Design System — 3D Ecosystem Model

The ecosystem uses a 3D node model, not a flat stack. Every component
belongs to exactly one node. Nodes are organised on four axes:

| Axis       | Nodes              | What it carries                         |
|------------|--------------------|-----------------------------------------|
| horizontal | N2, N3, N6, N7     | UI composition — what users see         |
| vertical   | N1, N4, N5         | Structural spine — runs through all     |
| depth      | N8                 | Observability — watches everything      |
| outlier    | N9, N10            | Outside the build — heals + describes   |

Node map:
  N1  Tokens        vertical   — CSS substrate. Only node that defines CSS values.
  N2  Primitives    horizontal — Headless, accessible. Uses Radix + CVA.
  N3  Brand         horizontal — N2 + Ubuntu. Uses nyuchi-harness.
  N4  Safety        vertical   — Gates. Validates input, guards AI output.
  N5  Resilience    vertical   — Circuit breakers, retries, fallback chains.
  N6  Pages         horizontal — Pure composition. No inline primitives.
  N7  Shell         horizontal — App chrome. Header, nav, theme, lifecycle.
  N8  Assurance     depth      — Observability, SLO tracking, chaos testing.
  N9  Fundi         outlier    — Self-healing via GitHub Issues.
  N10 Documentation outlier    — Self-describing. Database is source of truth.
`.trim()

const ECOSYSTEM_RULES = `
## Rules (non-negotiable)

1. CSS values live only in N1. All other nodes use var(--token-name). Never hex outside N1.
2. Icons import from @/lib/icons only. Never from lucide-react directly.
3. N2 primitives never import useNyuchiHarness.
4. N3 brand components always destructure { log, motion, LiveRegion } from useNyuchiHarness.
5. N6 pages: pure composition, semantic CSS vars only, accept children/slots.
6. All interactive components: data-slot + data-portal attributes required.
7. Status colors use semantic tokens: --status-success, --status-error, --status-warning.
8. Touch targets: 48px minimum. Focus rings: focus-visible:outline-2.
9. No hardcoded numbers in code or copy. Query get_node_counts() for live counts.
10. Shona terms come from the database. Never translate or invent them.
`.trim()

/**
 * Generate a context window string for an AI assistant.
 * Pass live counts from get_system_counts() — never hardcode them.
 */
export function generateAIContext(options: AIContextOptions = {}): string {
  const { counts, includeRules = true, includeArchitecture = true, includeNodeMap = true } = options

  const parts: string[] = []

  if (includeArchitecture) {
    parts.push("# Nyuchi Design System")
    parts.push("")

    if (counts) {
      parts.push(
        `Live counts: ${counts.totalComponents} components total, ` +
          `${counts.totalStable} stable, across ${counts.totalNodes} nodes.`
      )
      parts.push("Source: mzizi.dev | GitHub: nyuchi/design-portal")
    } else {
      parts.push("Source: mzizi.dev | GitHub: nyuchi/design-portal")
      parts.push("For live counts: SELECT * FROM get_system_counts();")
    }

    parts.push("")
  }

  if (includeNodeMap) {
    parts.push(ECOSYSTEM_MODEL)
    parts.push("")
  }

  if (includeRules) {
    parts.push(ECOSYSTEM_RULES)
    parts.push("")
  }

  parts.push("Database: Supabase project grjsboqkaywpwatvrzmy (ap-southeast-1)")
  parts.push("MCP server: mcp.mzizi.dev/mcp")

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
