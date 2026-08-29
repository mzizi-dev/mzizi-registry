import { describe, expect, it } from "vitest"

import { match, normalisePath } from "@/mzizi-api/src/router"
import { ROUTES } from "@/mzizi-api/src/routes.generated"

/**
 * Tests for the API Worker's router.
 *
 * What is deliberately NOT tested here is whether each endpoint returns the
 * right payload — the handlers are the app's own, already covered by the API
 * route tests, and asserting them twice would only prove the import works.
 * What IS unique to this Worker, and therefore worth testing, is the routing
 * Next used to derive from the filesystem: path normalisation, parameter
 * extraction, and the precedence between a literal segment and a parameter.
 */

describe("normalisePath", () => {
  it("accepts the published /api form unchanged", () => {
    expect(normalisePath("/api/v1/skills")).toBe("/api/v1/skills")
  })

  it("accepts the bare form served on api.mzizi.dev", () => {
    // This is the property that lets `mzizi.dev/api/v1/*` be pointed at this
    // Worker later without changing a single published URL.
    expect(normalisePath("/v1/skills")).toBe("/api/v1/skills")
  })

  it("maps the root to the API root rather than 404ing", () => {
    expect(normalisePath("/")).toBe("/api")
  })

  it("tolerates duplicate and trailing slashes", () => {
    expect(normalisePath("//v1//skills/")).toBe("/api/v1/skills")
  })

  it("does not strip a path that merely starts with the letters 'api'", () => {
    // `/apiary` must not be read as the `/api` prefix. Getting this wrong
    // would silently route an unrelated path into the table.
    expect(normalisePath("/apiary")).toBe("/api/apiary")
  })
})

describe("match", () => {
  it("prefers a literal segment over a parameter that would also match", () => {
    // `/api/v1/skills/summary` and `/api/v1/skills/:name` both match the path.
    // The generator orders literals first so this resolves to the summary
    // route; without that ordering it would be served by the by-name handler,
    // which would answer 404 for a route that exists.
    const found = match("/api/v1/skills/summary")
    expect(found).not.toBeNull()
    expect(found!.params).toEqual({})
  })

  it("extracts a dynamic segment", () => {
    expect(match("/api/v1/skills/nyuchi-design")!.params).toEqual({ name: "nyuchi-design" })
  })

  it("extracts multiple path shapes at the same depth", () => {
    expect(match("/api/v1/ui/button/docs")!.params).toEqual({ name: "button" })
    expect(match("/api/v1/architecture/nodes/2")!.params).toEqual({ n: "2" })
  })

  it("percent-decodes a parameter", () => {
    expect(match("/api/v1/ui/data%2Dtable")!.params).toEqual({ name: "data-table" })
  })

  it("does not match a path of the wrong depth", () => {
    expect(match("/api/v1/skills/a/b")).toBeNull()
    expect(match("/api/v1/nope")).toBeNull()
  })
})

describe("the generated route table", () => {
  it("covers every route in the app", () => {
    // A route present in `app/api/` and absent here would 404 in production
    // while every other test passed. `pnpm api:routes:check` is the real gate
    // — this asserts the shape the gate produces.
    expect(ROUTES.length).toBeGreaterThan(0)
    for (const route of ROUTES) {
      expect(route.pattern.startsWith("/api")).toBe(true)
      expect(route.methods.length).toBeGreaterThan(0)
    }
  })

  it("has no duplicate patterns", () => {
    const patterns = ROUTES.map((r) => r.pattern)
    expect(new Set(patterns).size).toBe(patterns.length)
  })

  it("orders literals before the parameters that would shadow them", () => {
    // The property the generator's sort exists to guarantee, asserted against
    // the artifact rather than against the sort function — a sort that is
    // correct in isolation but applied to the wrong list would still pass a
    // unit test of the comparator.
    for (let i = 0; i < ROUTES.length; i++) {
      for (let j = i + 1; j < ROUTES.length; j++) {
        const earlier = ROUTES[i]!.pattern.split("/")
        const later = ROUTES[j]!.pattern.split("/")
        if (earlier.length !== later.length) continue
        // If `later` would match every path `earlier` does, `later` is the more
        // general of the two and must not come first.
        const laterShadowsEarlier = later.every(
          (seg, k) => seg.startsWith(":") || seg === earlier[k]
        )
        const earlierShadowsLater = earlier.every(
          (seg, k) => seg.startsWith(":") || seg === later[k]
        )
        if (laterShadowsEarlier && !earlierShadowsLater) continue
        expect(earlierShadowsLater && !laterShadowsEarlier).toBe(false)
      }
    }
  })
})
