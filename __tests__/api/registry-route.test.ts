/**
 * GET /api/v1/ui — the registry index.
 *
 * READ THIS BEFORE EDITING THE FIXTURES. The previous version of this file is why the
 * index shipped broken for so long: it fed `registry_type` and `registry_dependencies` —
 * column names from the retired Supabase row shape — so the route's mapping found them,
 * and a spec even asserted `item.type` matched /^registry:(ui|hook|lib|block)$/ and passed.
 * Meanwhile `getAllComponents()` returns registry items whose fields are `type` and
 * `registryDependencies`, so in production both keys were `undefined` and `JSON.stringify`
 * dropped them. The fixture agreed with the defect, so the test certified it.
 *
 * The fixtures below are `RegistryItem`s — the shape the reader really returns. If a future
 * change makes a spec fail, check the SHAPE before changing the assertion.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock next/server
vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { headers?: Record<string, string>; status?: number }) => ({
      data,
      headers: init?.headers ?? {},
      status: init?.status ?? 200,
    }),
  },
}))

const mockGetAllComponents = vi.fn()

vi.mock("@/lib/db", () => ({
  isSupabaseConfigured: () => true,
  getAllComponents: () => mockGetAllComponents(),
}))

vi.mock("@/lib/observability", () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

import { GET } from "@/app/api/v1/ui/route"

/** A registry item as `readComponents()` produces one. */
function item(
  name: string,
  over: Partial<{
    type: string
    description: string
    dependencies: string[]
    registryDependencies: string[]
    node: number
    nodeLabel: string
    meta: { owner?: string; collection?: string }
  }> = {}
) {
  return {
    name,
    type: "registry:ui",
    description: `${name} component.`,
    dependencies: [],
    registryDependencies: [],
    node: 2,
    nodeLabel: "primitives",
    meta: { owner: "mzizi", collection: "primitives" },
    ...over,
  }
}

const req = (qs = "") => new Request(`https://mzizi.dev/api/v1/ui${qs}`)

type IndexItem = {
  name: string
  type?: string
  description?: string
  dependencies?: string[]
  registryDependencies?: string[]
  node?: number
  nodeLabel?: string
  owner?: string
  collection?: string
}
type IndexBody = {
  $schema: string
  name: string
  homepage: string
  items: IndexItem[]
  meta: {
    total: number
    count: number
    offset: number
    limit: number | null
    registryTotal: number
    filters: Record<string, unknown>
  }
}
type Res = { status: number; headers: Record<string, string>; data: IndexBody }

describe("GET /api/v1/ui", () => {
  beforeEach(() => {
    mockGetAllComponents.mockReset()
  })

  it("serves the registry with no database configured", async () => {
    // The registry is files on disk in the deployed bundle. This spec once asserted a 503
    // "Database not configured", and asserting it is what kept that defect alive.
    mockGetAllComponents.mockResolvedValue([item("button")])
    const res = (await GET(req())) as unknown as Res
    expect(res.status).toBe(200)
    expect(res.data.items.map((i) => i.name)).toEqual(["button"])
  })

  it("serves type and registryDependencies — the two keys the old mapping dropped", async () => {
    mockGetAllComponents.mockResolvedValue([
      item("button", {
        type: "registry:ui",
        dependencies: ["class-variance-authority"],
        registryDependencies: ["https://mzizi.dev/api/v1/ui/slot"],
      }),
    ])

    const res = (await GET(req())) as unknown as Res
    const first = res.data.items[0]

    // The regression guard. Against the old route these were `undefined`, and `undefined`
    // is not an assertable value once it has been through JSON — so assert presence, not
    // just equality.
    expect(Object.keys(first)).toContain("type")
    expect(Object.keys(first)).toContain("registryDependencies")
    expect(first.type).toBe("registry:ui")
    expect(first.registryDependencies).toEqual(["https://mzizi.dev/api/v1/ui/slot"])
    expect(first.dependencies).toEqual(["class-variance-authority"])
  })

  it("projects node, nodeLabel, owner and collection so the index can be filtered", async () => {
    mockGetAllComponents.mockResolvedValue([
      item("nyuchi-header", {
        node: 3,
        nodeLabel: "brand",
        meta: { owner: "nyuchi", collection: "brand" },
      }),
    ])

    const res = (await GET(req())) as unknown as Res
    expect(res.data.items[0]).toMatchObject({
      node: 3,
      nodeLabel: "brand",
      owner: "nyuchi",
      collection: "brand",
    })
  })

  it("returns the registry payload with the correct schema, name and headers", async () => {
    mockGetAllComponents.mockResolvedValue([item("button"), item("card")])

    const res = (await GET(req())) as unknown as Res
    expect(res.status).toBe(200)
    expect(res.data.$schema).toBe("https://ui.shadcn.com/schema/registry.json")
    // `registry.json` says `mzizi`. This asserted `mukoko` and so pinned the wrong brand.
    expect(res.data.name).toBe("mzizi")
    expect(res.data.homepage).toBe("https://mzizi.dev")
    expect(res.data.items).toHaveLength(2)
    expect(res.headers["Access-Control-Allow-Origin"]).toBe("*")
  })

  it("each item has required fields and a recognisable type", async () => {
    mockGetAllComponents.mockResolvedValue([
      item("button", { type: "registry:ui" }),
      item("use-toast", { type: "registry:hook" }),
      item("retry", { type: "registry:lib" }),
      item("dashboard-01", { type: "registry:block" }),
    ])

    const res = (await GET(req())) as unknown as Res
    for (const i of res.data.items) {
      expect(i.name).toBeTruthy()
      expect(i.type).toMatch(/^registry:(ui|hook|lib|block)$/)
      expect(i.description).toBeTruthy()
    }
  })

  describe("filters", () => {
    const corpus = [
      item("button", { node: 2, meta: { owner: "mzizi", collection: "primitives" } }),
      item("nyuchi-header", { node: 3, meta: { owner: "nyuchi", collection: "brand" } }),
      item("retry", {
        node: 5,
        type: "registry:lib",
        meta: { owner: "mzizi", collection: "resilience" },
      }),
    ]

    beforeEach(() => mockGetAllComponents.mockResolvedValue(corpus))

    it("narrows by node", async () => {
      const res = (await GET(req("?node=3"))) as unknown as Res
      expect(res.data.items.map((i) => i.name)).toEqual(["nyuchi-header"])
      expect(res.data.meta.total).toBe(1)
      expect(res.data.meta.registryTotal).toBe(3)
    })

    it("narrows by owner, collection and type", async () => {
      expect(
        ((await GET(req("?owner=nyuchi"))) as unknown as Res).data.items.map((i) => i.name)
      ).toEqual(["nyuchi-header"])
      expect(
        ((await GET(req("?collection=resilience"))) as unknown as Res).data.items.map((i) => i.name)
      ).toEqual(["retry"])
      expect(
        ((await GET(req("?type=registry:lib"))) as unknown as Res).data.items.map((i) => i.name)
      ).toEqual(["retry"])
    })

    it("combines filters", async () => {
      const res = (await GET(req("?owner=mzizi&node=5"))) as unknown as Res
      expect(res.data.items.map((i) => i.name)).toEqual(["retry"])
    })

    it("answers an unknown node with an empty list, never a 400", async () => {
      // §9: the node set is uncapped and grows. A bound is the defect regardless of its
      // value — a cap of 10 hid N11, a cap of 11 would hide N12. An unknown node is a
      // legitimate empty result, and `registryTotal` lets a caller tell "filtered to
      // nothing" from "the registry is empty".
      const res = (await GET(req("?node=99"))) as unknown as Res
      expect(res.status).toBe(200)
      expect(res.data.items).toEqual([])
      expect(res.data.meta.total).toBe(0)
      expect(res.data.meta.registryTotal).toBe(3)
    })

    it("ignores an unparseable filter rather than failing the index", async () => {
      const res = (await GET(req("?node=abc"))) as unknown as Res
      expect(res.status).toBe(200)
      expect(res.data.items).toHaveLength(3)
    })
  })

  describe("pagination", () => {
    const corpus = ["a", "b", "c", "d", "e"].map((n) => item(n))
    beforeEach(() => mockGetAllComponents.mockResolvedValue(corpus))

    it("returns everything when limit is unset — existing consumers are unaffected", async () => {
      const res = (await GET(req())) as unknown as Res
      expect(res.data.items).toHaveLength(5)
      expect(res.data.meta.limit).toBeNull()
    })

    it("pages with limit and offset, reporting total separately from count", async () => {
      const res = (await GET(req("?limit=2&offset=1"))) as unknown as Res
      expect(res.data.items.map((i) => i.name)).toEqual(["b", "c"])
      expect(res.data.meta).toMatchObject({ total: 5, count: 2, offset: 1, limit: 2 })
    })

    it("pages a FILTERED set, so total reflects the filter and not the registry", async () => {
      mockGetAllComponents.mockResolvedValue([
        item("x", { node: 2 }),
        item("y", { node: 2 }),
        item("z", { node: 7 }),
      ])
      const res = (await GET(req("?node=2&limit=1"))) as unknown as Res
      expect(res.data.items.map((i) => i.name)).toEqual(["x"])
      expect(res.data.meta).toMatchObject({ total: 2, count: 1, registryTotal: 3 })
    })

    it("returns an empty page past the end rather than erroring", async () => {
      const res = (await GET(req("?offset=99"))) as unknown as Res
      expect(res.status).toBe(200)
      expect(res.data.items).toEqual([])
      expect(res.data.meta.total).toBe(5)
    })
  })

  it("returns 500 when the registry read throws", async () => {
    mockGetAllComponents.mockRejectedValue(new Error("read failed"))
    const res = (await GET(req())) as unknown as { status: number; data: { error: string } }
    expect(res.status).toBe(500)
    expect(res.data.error).toBe("Internal server error")
  })
})
