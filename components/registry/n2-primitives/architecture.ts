/**
 * Nyuchi Architecture System — Types and database accessors.
 *
 * The DATABASE is the source of truth for all architecture data.
 * This file exports types and re-exports async getters from lib/db.
 *
 * Install via: npx shadcn@latest add https://mzizi.dev/api/v1/ui/architecture
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ArchitecturePrinciple {
  name: string
  title: string
  description: string
  rationale: string
  implementation: string
}

export interface PlatformTarget {
  name: string
  strategy: string
  status: "production" | "planned" | "research"
}

export interface FrameworkDecision {
  name: string
  approach: string
  framework: string
  rationale: string
  sovereigntyAdvantage: string
  platforms: PlatformTarget[]
  harmonyOs: {
    approach: string
    rationale: string
    status: string
  }
}

export interface SovereigntyAssessment {
  technology: string
  role: string
  license: string
  governance: string
  sovereigntyRisk: "none" | "low" | "removed"
  forkable: boolean
  selfHostable: boolean
  rationale: string
}

export interface DataLayer {
  layer: number
  name: string
  technology: string
  covenant: string
  stakeholder: string
  description: string
  sovereignty: SovereigntyAssessment
}

export interface SourceOfTruth {
  name: string
  database: string
  owner: "platform" | "personal"
  description: string
  dataTypes: string[]
}

export interface DataLayerTechnology {
  name: string
  role: string
  platform: "native" | "browser" | "both"
  description: string
  sovereignty: SovereigntyAssessment
}

export interface CloudService {
  name: string
  role: string
  consistencyModel: "strict" | "eventual"
  database: string
  dataCategories: string[]
  description: string
  sovereignty: SovereigntyAssessment
}

export interface PipelineStage {
  name: string
  role: string
  description: string
  sovereignty: SovereigntyAssessment
}

export interface DataOwnershipRule {
  category: string
  consistencyModel: "strict" | "eventual" | "aggregate"
  database: string
  examples: string[]
  conflictResolution: string
  ownership: "user-private" | "community-shared" | "public-open"
  description: string
}

export interface RemovedTechnology {
  name: string
  previousRole: string
  reason: string
  replacement: string
  migrationPath: string
}

// ─── Database Getters (runtime source of truth) ─────────────────────────────
//
// The database is the source of truth. These re-export the async getters
// from lib/db so consumers can import from "@/lib/architecture" as before.

export {
  getArchitecturePrinciples,
  getFrameworkDecision,
  getLocalDataLayer,
  getCloudLayer,
  getPipeline,
  getDataOwnership,
  getSovereignty,
  getRemovedTechnologies,
} from "@/lib/db"

// A block re-exporting eleven `SEED_*` constants from
// `@/lib/db/seed-data/architecture` stood here, described as kept "for backward
// compatibility with tests and static builds". Three things were wrong with it:
// the module does not exist (`lib/db/seed-data/` holds only `ubuntu.ts`), nothing
// in the repo imports any of the eleven names, and the `pnpm db:seed` the comments
// pointed at is not a script in `package.json`. It was a re-export of nothing, for
// nobody, and it is why this file did not compile once it reached disk.
//
// The database getters above are the runtime source of truth; seeding, if it is
// ever reintroduced, belongs in a script rather than in a shipped registry item.
