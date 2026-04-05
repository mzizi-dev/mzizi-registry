import { describe, it, expect } from "vitest"
import {
  SEED_ARCHITECTURE_PRINCIPLES,
  SEED_FRAMEWORK_DECISION,
  SEED_LOCAL_DATA_LAYER,
  SEED_CLOUD_LAYER,
  SEED_OPEN_DATA_PIPELINE,
  SEED_DATA_OWNERSHIP_RULES,
  SEED_REMOVED_TECHNOLOGIES,
  SEED_SOVEREIGNTY_SUMMARY,
  SEED_ARCHITECTURE_SYSTEM,
  SEED_SOURCES_OF_TRUTH,
  SEED_SEVEN_DATA_LAYERS,
} from "@/lib/architecture"

describe("Architecture Data Module", () => {
  describe("SEED_ARCHITECTURE_PRINCIPLES", () => {
    it("has exactly 5 principles", () => {
      expect(SEED_ARCHITECTURE_PRINCIPLES).toHaveLength(5)
    })

    it("contains all expected principles", () => {
      const names = SEED_ARCHITECTURE_PRINCIPLES.map((p) => p.name)
      expect(names).toEqual([
        "ubuntu",
        "local-first",
        "mobile-first",
        "open-source-sovereign",
        "open-data",
      ])
    })

    it("every principle has required fields", () => {
      for (const principle of SEED_ARCHITECTURE_PRINCIPLES) {
        expect(principle.name).toBeTruthy()
        expect(principle.title).toBeTruthy()
        expect(principle.description).toBeTruthy()
        expect(principle.rationale).toBeTruthy()
        expect(principle.implementation).toBeTruthy()
      }
    })
  })

  describe("SEED_FRAMEWORK_DECISION", () => {
    it("is web-first with Next.js + Capacitor", () => {
      expect(SEED_FRAMEWORK_DECISION.approach).toBe("web-first")
      expect(SEED_FRAMEWORK_DECISION.framework).toBe("Next.js + Capacitor")
    })

    it("has 4 platform targets", () => {
      expect(SEED_FRAMEWORK_DECISION.platforms).toHaveLength(4)
    })

    it("includes HarmonyOS as a platform", () => {
      const harmonyos = SEED_FRAMEWORK_DECISION.platforms.find(
        (p) => p.name === "harmonyos"
      )
      expect(harmonyos).toBeDefined()
      expect(harmonyos?.status).toBe("planned")
    })

    it("has HarmonyOS strategy", () => {
      expect(SEED_FRAMEWORK_DECISION.harmonyOs.approach).toBeTruthy()
      expect(SEED_FRAMEWORK_DECISION.harmonyOs.rationale).toBeTruthy()
    })
  })

  describe("SEED_LOCAL_DATA_LAYER", () => {
    it("has 4 technologies", () => {
      expect(SEED_LOCAL_DATA_LAYER).toHaveLength(4)
    })

    it("contains RxDB, SQLite, IndexedDB+Dexie, and PouchDB", () => {
      const names = SEED_LOCAL_DATA_LAYER.map((t) => t.name)
      expect(names).toContain("rxdb")
      expect(names).toContain("sqlite")
      expect(names).toContain("indexeddb-dexie")
      expect(names).toContain("pouchdb")
    })

    it("SQLite is public domain with no sovereignty risk", () => {
      const sqlite = SEED_LOCAL_DATA_LAYER.find((t) => t.name === "sqlite")
      expect(sqlite?.sovereignty.license).toBe("Public Domain")
      expect(sqlite?.sovereignty.sovereigntyRisk).toBe("none")
    })

    it("every technology has a sovereignty assessment", () => {
      for (const tech of SEED_LOCAL_DATA_LAYER) {
        expect(tech.sovereignty).toBeDefined()
        expect(tech.sovereignty.technology).toBeTruthy()
        expect(tech.sovereignty.license).toBeTruthy()
        expect(tech.sovereignty.sovereigntyRisk).toBeTruthy()
      }
    })
  })

  describe("SEED_CLOUD_LAYER", () => {
    it("has 4 cloud services", () => {
      expect(SEED_CLOUD_LAYER).toHaveLength(4)
    })

    it("Supabase uses strict consistency", () => {
      const supabase = SEED_CLOUD_LAYER.find(
        (s) => s.name === "supabase-postgresql"
      )
      expect(supabase?.consistencyModel).toBe("strict")
      expect(supabase?.database).toBe("PostgreSQL")
    })

    it("CouchDB uses eventual consistency", () => {
      const couchdb = SEED_CLOUD_LAYER.find((s) => s.name === "apache-couchdb")
      expect(couchdb?.consistencyModel).toBe("eventual")
      expect(couchdb?.database).toBe("CouchDB")
    })

    it("every cloud service has data categories", () => {
      for (const service of SEED_CLOUD_LAYER) {
        expect(service.dataCategories.length).toBeGreaterThan(0)
      }
    })
  })

  describe("SEED_OPEN_DATA_PIPELINE", () => {
    it("has 3 pipeline stages", () => {
      expect(SEED_OPEN_DATA_PIPELINE).toHaveLength(3)
    })

    it("stages are in correct order: Redpanda, Flink, Doris", () => {
      const names = SEED_OPEN_DATA_PIPELINE.map((s) => s.name)
      expect(names).toEqual(["redpanda", "apache-flink", "apache-doris"])
    })

    it("Flink and Doris are Apache-licensed", () => {
      const flink = SEED_OPEN_DATA_PIPELINE.find((s) => s.name === "apache-flink")
      const doris = SEED_OPEN_DATA_PIPELINE.find((s) => s.name === "apache-doris")
      expect(flink?.sovereignty.license).toBe("Apache-2.0")
      expect(doris?.sovereignty.license).toBe("Apache-2.0")
    })
  })

  describe("SEED_DATA_OWNERSHIP_RULES", () => {
    it("has 4 ownership categories", () => {
      expect(SEED_DATA_OWNERSHIP_RULES).toHaveLength(4)
    })

    it("covers personal, community, personal-sovereign, and platform-open", () => {
      const categories = SEED_DATA_OWNERSHIP_RULES.map((r) => r.category)
      expect(categories).toEqual(["personal", "community", "personal-sovereign", "platform-open"])
    })

    it("personal data is user-private with strict consistency", () => {
      const personal = SEED_DATA_OWNERSHIP_RULES.find(
        (r) => r.category === "personal"
      )
      expect(personal?.ownership).toBe("user-private")
      expect(personal?.consistencyModel).toBe("strict")
    })

    it("platform-open data is public with aggregate consistency", () => {
      const open = SEED_DATA_OWNERSHIP_RULES.find(
        (r) => r.category === "platform-open"
      )
      expect(open?.ownership).toBe("public-open")
      expect(open?.consistencyModel).toBe("aggregate")
    })

    it("every rule has conflict resolution strategy", () => {
      for (const rule of SEED_DATA_OWNERSHIP_RULES) {
        expect(rule.conflictResolution).toBeTruthy()
      }
    })
  })

  describe("SEED_REMOVED_TECHNOLOGIES", () => {
    it("contains MongoDB and D1", () => {
      expect(SEED_REMOVED_TECHNOLOGIES).toHaveLength(2)
      const names = SEED_REMOVED_TECHNOLOGIES.map((t) => t.name)
      expect(names).toContain("mongodb")
      expect(names).toContain("cloudflare-d1")
    })

    it("MongoDB was removed for SSPL license", () => {
      const mongo = SEED_REMOVED_TECHNOLOGIES[0]
      expect(mongo.reason).toContain("SSPL")
      expect(mongo.replacement).toBe("Apache CouchDB")
    })
  })

  describe("SEED_SOVEREIGNTY_SUMMARY", () => {
    it("has assessments for all technologies", () => {
      expect(SEED_SOVEREIGNTY_SUMMARY.length).toBeGreaterThanOrEqual(10)
    })

    it("every assessment has required fields", () => {
      for (const assessment of SEED_SOVEREIGNTY_SUMMARY) {
        expect(assessment.technology).toBeTruthy()
        expect(assessment.role).toBeTruthy()
        expect(assessment.license).toBeTruthy()
        expect(["none", "low", "removed"]).toContain(
          assessment.sovereigntyRisk
        )
      }
    })

    it("MongoDB is marked as removed", () => {
      const mongo = SEED_SOVEREIGNTY_SUMMARY.find(
        (a) => a.technology === "MongoDB"
      )
      expect(mongo?.sovereigntyRisk).toBe("removed")
    })

    it("sovereign-rated technologies are forkable and self-hostable", () => {
      const sovereign = SEED_SOVEREIGNTY_SUMMARY.filter(
        (a) => a.sovereigntyRisk === "none"
      )
      for (const tech of sovereign) {
        expect(tech.forkable).toBe(true)
        expect(tech.selfHostable).toBe(true)
      }
    })
  })

  describe("SEED_SOURCES_OF_TRUTH", () => {
    it("has 3 sources — two platform, one personal", () => {
      expect(SEED_SOURCES_OF_TRUTH).toHaveLength(3)
      const platformSources = SEED_SOURCES_OF_TRUTH.filter((s) => s.owner === "platform")
      const personalSources = SEED_SOURCES_OF_TRUTH.filter((s) => s.owner === "personal")
      expect(platformSources).toHaveLength(2)
      expect(personalSources).toHaveLength(1)
    })

    it("includes Supabase, ScyllaDB, and Web3 Pod", () => {
      const names = SEED_SOURCES_OF_TRUTH.map((s) => s.name)
      expect(names).toContain("relational")
      expect(names).toContain("non-relational")
      expect(names).toContain("personal")
    })
  })

  describe("SEED_SEVEN_DATA_LAYERS", () => {
    it("has exactly 7 layers", () => {
      expect(SEED_SEVEN_DATA_LAYERS).toHaveLength(7)
    })

    it("layers are numbered 1-7", () => {
      const layers = SEED_SEVEN_DATA_LAYERS.map((l) => l.layer)
      expect(layers).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it("every layer has a covenant and stakeholder", () => {
      for (const layer of SEED_SEVEN_DATA_LAYERS) {
        expect(layer.covenant).toBeTruthy()
        expect(layer.stakeholder).toBeTruthy()
      }
    })
  })

  describe("SEED_ARCHITECTURE_SYSTEM", () => {
    it("has version 4.0.1", () => {
      expect(SEED_ARCHITECTURE_SYSTEM.version).toBe("4.0.1")
    })

    it("has correct $schema", () => {
      expect(SEED_ARCHITECTURE_SYSTEM.$schema).toBe(
        "https://design.nyuchi.com/schema/architecture.json"
      )
    })

    it("has schema.org context and type", () => {
      expect(SEED_ARCHITECTURE_SYSTEM["@context"]).toBe("https://schema.org")
      expect(SEED_ARCHITECTURE_SYSTEM["@type"]).toBe("TechArticle")
    })

    it("has all top-level keys", () => {
      expect(SEED_ARCHITECTURE_SYSTEM.principles).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.frameworkDecision).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.sourcesOfTruth).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.sevenDataLayers).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.localDataLayer).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.cloudLayer).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.openDataPipeline).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.dataOwnership).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.removedTechnologies).toBeDefined()
      expect(SEED_ARCHITECTURE_SYSTEM.sovereigntySummary).toBeDefined()
    })

    it("is JSON-serializable", () => {
      const json = JSON.stringify(SEED_ARCHITECTURE_SYSTEM)
      expect(json).toBeTruthy()
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe("4.0.1")
    })
  })
})
