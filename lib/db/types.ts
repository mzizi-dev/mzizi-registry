/**
 * Document schemas for the Mukoko Registry document store.
 *
 * Every piece of registry data — component metadata, documentation, demos,
 * brand tokens — is a typed document in PouchDB/CouchDB. This replaces
 * hardcoded files (registry.json, component-docs.ts, demo-names.ts) with
 * a queryable, versionable, syncable document store.
 *
 * Document ID conventions:
 *   component:<name>       — Component metadata (registry entry)
 *   doc:<name>             — Component documentation (use cases, features)
 *   demo:<name>            — Demo configuration (has demo, demo type)
 *   brand:<key>            — Brand system tokens
 *   config:<key>           — System configuration
 */

// ── Base document ───────────────────────────────────────────────────

export interface BaseDocument {
  _id: string
  _rev?: string
  type: DocumentType
  createdAt: string
  updatedAt: string
}

export type DocumentType =
  | "component"
  | "component-doc"
  | "demo"
  | "brand"
  | "config"

// ── Component document ──────────────────────────────────────────────
// Replaces entries in registry.json

export interface ComponentDocument extends BaseDocument {
  type: "component"
  /** Component name (e.g., "button", "mukoko-sidebar") */
  name: string
  /** Registry type */
  registryType: "registry:ui" | "registry:hook" | "registry:lib"
  /** One-line description */
  description: string
  /** npm dependencies */
  dependencies: string[]
  /** Other registry components this depends on */
  registryDependencies: string[]
  /** Source files */
  files: ComponentFile[]
  /** Component category for catalog organization */
  category?: ComponentCategory
  /** Component layer in the architecture */
  layer?: "primitive" | "composite" | "layout" | "infrastructure"
  /** Whether this is a Mukoko ecosystem component (vs shadcn base) */
  isMukokoComponent?: boolean
  /** Source code (inlined for API responses) */
  sourceCode?: string
  /** Version when this component was added */
  addedInVersion?: string
  /** Tags for search and filtering */
  tags?: string[]
}

export interface ComponentFile {
  path: string
  type: string
}

export type ComponentCategory =
  | "input"
  | "action"
  | "data-display"
  | "feedback"
  | "layout"
  | "navigation"
  | "overlay"
  | "utility"
  | "mukoko"
  | "infrastructure"

// ── Component documentation document ────────────────────────────────
// Replaces entries in component-docs.ts

export interface ComponentDocDocument extends BaseDocument {
  type: "component-doc"
  /** Component name this doc belongs to */
  componentName: string
  /** Use case descriptions */
  useCases: string[]
  /** Available variants */
  variants?: string[]
  /** Available sizes */
  sizes?: string[]
  /** Feature descriptions */
  features?: string[]
  /** Props documentation (future: auto-extracted from source) */
  props?: PropDoc[]
  /** Code examples */
  examples?: CodeExample[]
  /** Accessibility notes */
  a11y?: string[]
}

export interface PropDoc {
  name: string
  type: string
  description: string
  required?: boolean
  defaultValue?: string
}

export interface CodeExample {
  title: string
  code: string
  language?: string
}

// ── Demo document ───────────────────────────────────────────────────
// Replaces demo-names.ts (demo JSX stays in demos.tsx for now)

export interface DemoDocument extends BaseDocument {
  type: "demo"
  /** Component name */
  componentName: string
  /** Whether an interactive demo exists */
  hasDemo: boolean
  /** Demo category */
  demoType?: "interactive" | "static" | "api"
}

// ── Brand document ──────────────────────────────────────────────────
// Replaces hardcoded brand data for dynamic brand system management

export interface BrandDocument extends BaseDocument {
  type: "brand"
  /** Brand data key (e.g., "minerals", "typography", "ecosystem") */
  key: string
  /** Brand data value (flexible JSON) */
  data: Record<string, unknown>
}

// ── Config document ─────────────────────────────────────────────────
// System-level configuration

export interface ConfigDocument extends BaseDocument {
  type: "config"
  key: string
  value: unknown
}

// ── Union type ──────────────────────────────────────────────────────

export type RegistryDocument =
  | ComponentDocument
  | ComponentDocDocument
  | DemoDocument
  | BrandDocument
  | ConfigDocument

// ── Query result types ──────────────────────────────────────────────

export interface ComponentWithDocs extends ComponentDocument {
  docs?: ComponentDocDocument
  demo?: DemoDocument
}

// ── Database info ───────────────────────────────────────────────────

export interface DatabaseInfo {
  name: string
  docCount: number
  updateSeq: number | string
  adapter: string
}
