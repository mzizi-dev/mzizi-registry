/**
 * Mukoko Architecture System — Types and database accessors.
 *
 * The DATABASE is the source of truth for all architecture data.
 * This file exports types and re-exports async getters from lib/db.
 * Seed data (for initial DB population) lives in lib/db/seed-data/architecture.ts.
 *
 * Install via: npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/architecture
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
// Seed data lives in lib/db/seed-data/architecture.ts and is only used for
// initial database seeding via `pnpm db:seed`.

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

// Re-export seed data for backward compatibility with tests and static builds.
// These are prefixed to make it clear they are NOT the source of truth.
export {
  ARCHITECTURE_PRINCIPLES as SEED_ARCHITECTURE_PRINCIPLES,
  FRAMEWORK_DECISION as SEED_FRAMEWORK_DECISION,
  LOCAL_DATA_LAYER as SEED_LOCAL_DATA_LAYER,
  CLOUD_LAYER as SEED_CLOUD_LAYER,
  OPEN_DATA_PIPELINE as SEED_OPEN_DATA_PIPELINE,
  DATA_OWNERSHIP_RULES as SEED_DATA_OWNERSHIP_RULES,
  REMOVED_TECHNOLOGIES as SEED_REMOVED_TECHNOLOGIES,
  SOVEREIGNTY_SUMMARY as SEED_SOVEREIGNTY_SUMMARY,
  SOURCES_OF_TRUTH as SEED_SOURCES_OF_TRUTH,
  SEVEN_DATA_LAYERS as SEED_SEVEN_DATA_LAYERS,
  ARCHITECTURE_SYSTEM as SEED_ARCHITECTURE_SYSTEM,
} from "@/lib/db/seed-data/architecture"
