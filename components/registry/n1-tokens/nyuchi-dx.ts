/**
 * NYUCHI DEVELOPER EXPERIENCE
 *
 * Meta-infrastructure for the design system itself — how components
 * are documented, versioned, contributed, and deprecated.
 *
 * This ensures the design system scales not just as a codebase
 * but as a collaborative process across all Nyuchi teams.
 */

// ─── Component Maturity Levels ─────────────────────────────
// Every component has a maturity status that communicates
// how stable and well-tested it is.

export type ComponentStatus = "alpha" | "beta" | "stable" | "deprecated"

export const statusConfig: Record<
  ComponentStatus,
  {
    label: string
    color: string
    description: string
    canUseInProduction: boolean
  }
> = {
  alpha: {
    label: "Alpha",
    color: "#F87171",
    description: "Experimental. API will change. Do not use in production.",
    canUseInProduction: false,
  },
  beta: {
    label: "Beta",
    color: "#FBBF24",
    description:
      "API stabilizing. Usable in production with caution. Breaking changes possible in minor versions.",
    canUseInProduction: true,
  },
  stable: {
    label: "Stable",
    color: "#4ADE80",
    description: "Production-ready. API frozen. Breaking changes only in major versions.",
    canUseInProduction: true,
  },
  deprecated: {
    label: "Deprecated",
    color: "#6B6B66",
    description: "Scheduled for removal. Migrate to the specified replacement.",
    canUseInProduction: false,
  },
}

// ─── Component Documentation Schema ────────────────────────
// Defines what every component MUST document before reaching
// stable status. Stored in the component_docs table.

export interface ComponentDocumentation {
  /** Component name */
  name: string
  /** Current maturity status */
  status: ComponentStatus
  /** Version when this component was introduced */
  addedInVersion: string

  /** When to use this component (positive guidance) */
  whenToUse: string[]
  /** When NOT to use this component (negative guidance) */
  whenNotToUse: string[]
  /** Common mistakes and how to avoid them */
  commonMistakes: string[]

  /** Accessibility documentation */
  accessibility: {
    /** ARIA roles applied */
    ariaRoles: string[]
    /** Keyboard interactions */
    keyboardInteractions: { key: string; action: string }[]
    /** What screen readers announce */
    screenReaderBehavior: string
    /** Focus management notes */
    focusManagement: string
    /** WCAG criteria met */
    wcagCriteria: string[]
  }

  /** Code examples */
  examples: { title: string; code: string; description: string }[]

  /** Migration guide (for deprecated components) */
  migration?: {
    replacement: string
    guide: string
    codemod?: string
    deadline?: string
  }

  /** Props API documentation */
  props: { name: string; type: string; required: boolean; default?: string; description: string }[]

  /** Related components */
  relatedComponents: string[]

  /** Which Nyuchi apps use this component */
  usedBy: string[]
}

// ─── Deprecation Warning Utility ───────────────────────────
// Use in deprecated components to warn developers at dev time.

export function deprecationWarning(
  componentName: string,
  replacement: string,
  deadline?: string
): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[Nyuchi Design] ⚠️ <${componentName}> is deprecated. Use <${replacement}> instead.` +
        (deadline ? ` Will be removed after ${deadline}.` : "") +
        ` See: https://mzizi.dev/components/${replacement}`
    )
  }
}

// ─── Contribution Guidelines ───────────────────────────────
// The process for adding new brand components.

export const CONTRIBUTION_PROCESS = {
  steps: [
    {
      step: 1,
      title: "Propose",
      description:
        "Open a Linear issue with the component name, use case, which apps need it, and which platform schema it maps to. Tag it with [design-system].",
    },
    {
      step: 2,
      title: "Design",
      description:
        "Create a mockup showing all variants, states (default, loading, error, empty, disabled), and responsive behavior. Include dark and light mode.",
    },
    {
      step: 3,
      title: "Build",
      description:
        "Implement as a brand component in the appropriate ecosystem app (components/mukoko/, components/bundu/, etc.). Must use design tokens (no hardcoded values), include accessibility (ARIA, keyboard, focus), respect motion preferences, and handle RTL.",
    },
    {
      step: 4,
      title: "Document",
      description:
        "Fill out the ComponentDocumentation schema: when to use, when not to use, accessibility notes, keyboard interactions, examples, props API.",
    },
    {
      step: 5,
      title: "Review",
      description:
        "Submit for design system review. Reviewers check: token usage, accessibility, motion, RTL, responsive behavior, documentation completeness.",
    },
    {
      step: 6,
      title: "Ship",
      description:
        "Insert into nyuchi_design_db via Supabase. Set status to beta. Monitor usage for one release cycle before promoting to stable.",
    },
  ],
  requirements: {
    /** Component must use CSS custom properties from nyuchi-tokens */
    usesTokens: true,
    /** Must include ARIA attributes and keyboard navigation */
    accessible: true,
    /** Must respect prefers-reduced-motion */
    motionSafe: true,
    /** Must work in RTL layouts */
    rtlReady: true,
    /** Must have responsive behavior defined for all breakpoints */
    responsive: true,
    /** Must have brand-matching skeleton variant */
    hasSkeleton: true,
    /** Must handle error state gracefully */
    handlesErrors: true,
    /** Must have component_docs entry */
    documented: true,
  },
} as const

// ─── Usage Analytics Types ─────────────────────────────────
// Track which components are used, by which apps, how often.
// Stored in usage_events table in nyuchi_design_db.

export interface ComponentUsageEvent {
  componentName: string
  appId: string
  variant?: string
  timestamp: string
  context: "production" | "development" | "storybook"
}

// ─── Versioning Strategy ───────────────────────────────────
export const VERSIONING = {
  scheme: "semver",
  deprecationPolicy:
    "Components are deprecated with 2 minor versions of warning before removal in the next major version.",
  breakingChangeProcess:
    "Breaking changes only in major versions. All breaking changes include migration guides and, where possible, automated codemods.",
  currentVersion: "1.0.0",
} as const

export { statusConfig as componentStatusConfig }
