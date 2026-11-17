// @vitest-environment node
import { describe, it, expect } from "vitest"
import { getEngineeringConstraints, getUbuntuPrinciples } from "@/lib/db"

/**
 * The seven engineering constraints (bundu-labs/bundu-standards#105). The canonical
 * ecosystem record in bundu-standards names them by these ids, in this order, and
 * fails if the list changes, so the doctrine must hold exactly these.
 */
const IDS = [
  "outdoor-readability",
  "connectivity-gradient-design",
  "multilingual-parity",
  "shared-device-awareness",
  "personal-data-sovereignty",
  "no-surveillance-business-model",
  "bundu-floor",
]

describe("engineering constraints", () => {
  it("are the seven, in order", async () => {
    const rows = await getEngineeringConstraints()
    expect(rows.map((r) => r.name)).toEqual(IDS)
  })

  it("each names real Ubuntu principles and states a check", async () => {
    const principles = new Set((await getUbuntuPrinciples()).map((p) => p.name))
    for (const r of await getEngineeringConstraints()) {
      expect(r.principles.length, r.name).toBeGreaterThan(0)
      for (const p of r.principles) expect(principles.has(p), `${r.name}: ${p}`).toBe(true)
      expect(r.check.length, r.name).toBeGreaterThan(20)
    }
  })

  it("makes offline-first the enforced minimum of connectivity-gradient design", async () => {
    const c = (await getEngineeringConstraints()).find((r) => r.name === "connectivity-gradient-design")!
    expect(c.description).toMatch(/Offline-first is the enforced minimum/)
    expect(c.check).toMatch(/do not work offline fails/)
  })
})
