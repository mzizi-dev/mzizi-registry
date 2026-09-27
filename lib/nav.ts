import {
  Activity,
  BookOpen,
  Box,
  HeartHandshake,
  Layers,
  Palette,
  ScrollText,
  Sparkles,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react"

// Shared navigation structure for the Mzizi portal shell.
// Curated (not auto-generated) — the portal hosts the functional
// surfaces only; long-form guides live in the standalone Mintlify
// docs site at docs.bundu.org/mzizi.
//
//   Framework     — the research architecture (charter layers, phases) and
//                   the benchmark's measurement discipline
//   Corpus        — the benchmark corpus: the fixed component set the
//                   framework is measured against, its tokens, its playground
//   Agent tooling — the agent-facing surface: tools, skills, the CLI
//   Doctrine      — Ubuntu, the Bundu Foundation research ethos
//   Releases      — the node-aware corpus changelog
//   Documentation — external link to the Mintlify docs site
//
// Header nav (top-right) and sidebar (left) share this file so the two
// navigations never drift.

export interface NavItem {
  label: string
  href: string
  icon?: LucideIcon
  external?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
  /**
   * Collapsible groups render as an expandable section in the sidebar.
   */
  collapsible?: boolean
}

export const SIDEBAR_NAV: NavGroup[] = [
  {
    label: "Framework",
    items: [
      { label: "Architecture", href: "/architecture", icon: Box },
      { label: "Observability", href: "/observability", icon: Activity },
    ],
  },
  {
    label: "Corpus",
    items: [
      { label: "Components", href: "/components", icon: Layers },
      { label: "Colour tokens", href: "/tokens", icon: Palette },
      { label: "Playground", href: "/playground", icon: Sparkles },
    ],
  },
  {
    label: "Agent tooling",
    items: [
      { label: "Tools", href: "/tools", icon: Wrench },
      { label: "Skills", href: "/skills", icon: BookOpen },
      { label: "CLI", href: "/cli", icon: Terminal },
    ],
  },
  {
    label: "Doctrine",
    items: [{ label: "Ubuntu", href: "/ubuntu", icon: HeartHandshake }],
  },
  {
    label: "Releases",
    items: [{ label: "Changelog", href: "/changelog", icon: ScrollText }],
  },
  {
    label: "Documentation",
    items: [
      { label: "Docs", href: "https://docs.bundu.org/mzizi", icon: BookOpen, external: true },
    ],
  },
]

// Header top-level nav (desktop-only). Mirrors the sidebar so the header
// and sidebar tell the same story.
export const HEADER_NAV: NavItem[] = [
  { label: "Architecture", href: "/architecture" },
  { label: "Corpus", href: "/components" },
  { label: "Playground", href: "/playground" },
  { label: "CLI", href: "/cli" },
  { label: "Docs", href: "https://docs.bundu.org/mzizi", external: true },
]

// Pretty labels for breadcrumbs — maps URL segments to display strings.
// Missing keys fall back to Title Case of the segment (see `labelFor`
// in `components/landing/breadcrumbs.tsx`).
export const BREADCRUMB_LABELS: Record<string, string> = {
  components: "Components",
  architecture: "Architecture",
  observability: "Observability",
  playground: "Playground",
  changelog: "Changelog",
  tools: "Tools",
  skills: "Skills",
  cli: "CLI",
  source: "Source",
  layers: "Layers",
  ubuntu: "Ubuntu",
}
