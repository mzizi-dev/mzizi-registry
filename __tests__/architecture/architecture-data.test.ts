import { describe, it, expect } from "vitest"
import {
  ARCHITECTURE_PRINCIPLES,
  FRAMEWORK_DECISION,
  LOCAL_DATA_LAYER,
  CLOUD_LAYER,
  OPEN_DATA_PIPELINE,
  DATA_OWNERSHIP_RULES,
  REMOVED_TECHNOLOGIES,
  SOVEREIGNTY_SUMMARY,
  ARCHITECTURE_SYSTEM,
} from "@/lib/architecture"

describe("Architecture Data Module", () => {
  describe("ARCHITECTURE_PRINCIPLES", () => {
    it("has exactly 5 principles", () => {
      expect(ARCHITECTURE_PRINCIPLES).toHaveLength(5)
    })

    it("contains all expected principles", () => {
      const names = ARCHITECTURE_PRINCIPLES.map((p) => p.name)
      expect(names).toEqual([
        "ubuntu",
        "local-first",
        "mobile-first",
        "open-source-sovereign",
        "open-data",
      ])
    })

    it("every principle has required fields", () => {
      for (const principle of ARCHITECTURE_PRINCIPLES) {
        expect(principle.name).toBeTruthy()
        expect(principle.title).toBeTruthy()
        expect(principle.description).toBeTruthy()
        expect(principle.rationale).toBeTruthy()
        expect(principle.implementation).toBeTruthy()
      }
    })
  })

  describe("FRAMEWORK_DECISION", () => {
    it("is web-first with Next.js + Capacitor", () => {
      expect(FRAMEWORK_DECISION.approach).toBe("web-first")
      expect(FRAMEWORK_DECISION.framework).toBe("Next.js + Capacitor")
    })

    it("has 4 platform targets", () => {
      expect(FRAMEWORK_DECISION.platforms).toHaveLength(4)
    })

    it("includes HarmonyOS as a platform", () => {
      const harmonyos = FRAMEWORK_DECISION.platforms.find(
        (p) => p.name === "harmonyos"
      )
      expect(harmonyos).toBeDefined()
      expect(harmonyos?.status).toBe("planned")
    })

    it("has HarmonyOS strategy", () => {
      expect(FRAMEWORK_DECISION.harmonyOs.approach).toBeTruthy()
      expect(FRAMEWORK_DECISION.harmonyOs.rationale).toBeTruthy()
    })
  })

  describe("LOCAL_DATA_LAYER", () => {
    it("has 4 technologies", () => {
      expect(LOCAL_DATA_LAYER).toHaveLength(4)
    })

    it("contains RxDB, SQLite, IndexedDB+Dexie, and PouchDB", () => {
      const names = LOCAL_DATA_LAYER.map((t) => t.name)
      expect(names).toContain("rxdb")
      expect(names).toContain("sqlite")
      expect(names).toContain("indexeddb-dexie")
      expect(names).toContain("pouchdb")
    })

    it("SQLite is public domain with no sovereignty risk", () => {
      const sqlite = LOCAL_DATA_LAYER.find((t) => t.name === "sqlite")
      expect(sqlite?.sovereignty.license).toBe("Public Domain")
      expect(sqlite?.sovereignty.sovereigntyRisk).toBe("none")
    })

    it("every technology has a sovereignty assessment", () => {
      for (const tech of LOCAL_DATA_LAYER) {
        expect(tech.sovereignty).toBeDefined()
        expect(tech.sovereignty.technology).toBeTruthy()
        expect(tech.sovereignty.license).toBeTruthy()
        expect(tech.sovereignty.sovereigntyRisk).toBeTruthy()
      }
    })
  })

  describe("CLOUD_LAYER", () => {
    it("has 2 cloud services", () => {
      expect(CLOUD_LAYER).toHaveLength(2)
    })

    it("Supabase uses strict consistency", () => {
      const supabase = CLOUD_LAYER.find(
        (s) => s.name === "supabase-postgresql"
      )
      expect(supabase?.consistencyModel).toBe("strict")
      expect(supabase?.database).toBe("PostgreSQL")
    })

    it("CouchDB uses eventual consistency", () => {
      const couchdb = CLOUD_LAYER.find((s) => s.name === "apache-couchdb")
      expect(couchdb?.consistencyModel).toBe("eventual")
      expect(couchdb?.database).toBe("CouchDB")
    })

    it("every cloud service has data categories", () => {
      for (const service of CLOUD_LAYER) {
        expect(service.dataCategories.length).toBeGreaterThan(0)
      }
    })
  })

  describe("OPEN_DATA_PIPELINE", () => {
    it("has 3 pipeline stages", () => {
      expect(OPEN_DATA_PIPELINE).toHaveLength(3)
    })

    it("stages are in correct order: Redpanda, Flink, Doris", () => {
      const names = OPEN_DATA_PIPELINE.map((s) => s.name)
      expect(names).toEqual(["redpanda", "apache-flink", "apache-doris"])
    })

    it("Flink and Doris are Apache-licensed", () => {
      const flink = OPEN_DATA_PIPELINE.find((s) => s.name === "apache-flink")
      const doris = OPEN_DATA_PIPELINE.find((s) => s.name === "apache-doris")
      expect(flink?.sovereignty.license).toBe("Apache-2.0")
      expect(doris?.sovereignty.license).toBe("Apache-2.0")
    })
  })

  describe("DATA_OWNERSHIP_RULES", () => {
    it("has 3 ownership categories", () => {
      expect(DATA_OWNERSHIP_RULES).toHaveLength(3)
    })

    it("covers personal, community, and platform-open", () => {
      const categories = DATA_OWNERSHIP_RULES.map((r) => r.category)
      expect(categories).toEqual(["personal", "community", "platform-open"])
    })

    it("personal data is user-private with strict consistency", () => {
      const personal = DATA_OWNERSHIP_RULES.find(
        (r) => r.category === "personal"
      )
      expect(personal?.ownership).toBe("user-private")
      expect(personal?.consistencyModel).toBe("strict")
    })

    it("platform-open data is public with aggregate consistency", () => {
      const open = DATA_OWNERSHIP_RULES.find(
        (r) => r.category === "platform-open"
      )
      expect(open?.ownership).toBe("public-open")
      expect(open?.consistencyModel).toBe("aggregate")
    })

    it("every rule has conflict resolution strategy", () => {
      for (const rule of DATA_OWNERSHIP_RULES) {
        expect(rule.conflictResolution).toBeTruthy()
      }
    })
  })

  describe("REMOVED_TECHNOLOGIES", () => {
    it("contains MongoDB", () => {
      expect(REMOVED_TECHNOLOGIES).toHaveLength(1)
      expect(REMOVED_TECHNOLOGIES[0].name).toBe("mongodb")
    })

    it("MongoDB was removed for SSPL license", () => {
      const mongo = REMOVED_TECHNOLOGIES[0]
      expect(mongo.reason).toContain("SSPL")
      expect(mongo.replacement).toBe("Apache CouchDB")
    })
  })

  describe("SOVEREIGNTY_SUMMARY", () => {
    it("has assessments for all technologies", () => {
      expect(SOVEREIGNTY_SUMMARY.length).toBeGreaterThanOrEqual(10)
    })

    it("every assessment has required fields", () => {
      for (const assessment of SOVEREIGNTY_SUMMARY) {
        expect(assessment.technology).toBeTruthy()
        expect(assessment.role).toBeTruthy()
        expect(assessment.license).toBeTruthy()
        expect(["none", "low", "removed"]).toContain(
          assessment.sovereigntyRisk
        )
      }
    })

    it("MongoDB is marked as removed", () => {
      const mongo = SOVEREIGNTY_SUMMARY.find(
        (a) => a.technology === "MongoDB"
      )
      expect(mongo?.sovereigntyRisk).toBe("removed")
    })

    it("sovereign-rated technologies are forkable and self-hostable", () => {
      const sovereign = SOVEREIGNTY_SUMMARY.filter(
        (a) => a.sovereigntyRisk === "none"
      )
      for (const tech of sovereign) {
        expect(tech.forkable).toBe(true)
        expect(tech.selfHostable).toBe(true)
      }
    })
  })

  describe("ARCHITECTURE_SYSTEM", () => {
    it("has version 4.0.1", () => {
      expect(ARCHITECTURE_SYSTEM.version).toBe("4.0.1")
    })

    it("has correct $schema", () => {
      expect(ARCHITECTURE_SYSTEM.$schema).toBe(
        "https://design.nyuchi.com/schema/architecture.json"
      )
    })

    it("has schema.org context and type", () => {
      expect(ARCHITECTURE_SYSTEM["@context"]).toBe("https://schema.org")
      expect(ARCHITECTURE_SYSTEM["@type"]).toBe("TechArticle")
    })

    it("has all top-level keys", () => {
      expect(ARCHITECTURE_SYSTEM.principles).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.frameworkDecision).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.localDataLayer).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.cloudLayer).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.openDataPipeline).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.dataOwnership).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.removedTechnologies).toBeDefined()
      expect(ARCHITECTURE_SYSTEM.sovereigntySummary).toBeDefined()
    })

    it("is JSON-serializable", () => {
      const json = JSON.stringify(ARCHITECTURE_SYSTEM)
      expect(json).toBeTruthy()
      const parsed = JSON.parse(json)
      expect(parsed.version).toBe("4.0.1")
    })
  })
})
