import { describe, it, expect, vi } from "vitest"
import { readComponents } from "@/lib/registry"
import { getAllAiInstructions } from "@/lib/db"

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { headers?: Record<string, string>; status?: number }) => ({
      data,
      headers: init?.headers ?? {},
      status: init?.status ?? 200,
    }),
  },
}))

/**
 * The routes that answered 503 "Database not configured" while their data sat in the
 * registry's files, and the discovery document that described them. api.mzizi.dev
 * (mzizi-dev/mzizi-api-gateway) serves these answers from the same files.
 */

type Resp<T> = { data: T; status: number; headers: Record<string, string> }

type SearchBody = {
  data: Array<{
    name: string
    type?: string
    description?: string
    categories?: string[]
    node?: number
    nodeLabel?: string
  }>
  meta: {
    total: number
    query: string | null
    node: string | null
    category: string | null
    deprecation?: string
  }
}

async function search(query: string) {
  const { GET } = await import("@/app/api/v1/search/route")
  return (await GET(
    new Request(`https://api.mzizi.dev/api/v1/search${query}`)
  )) as unknown as Resp<SearchBody & { error?: string }>
}

const components = readComponents()

describe("GET /api/v1/search", () => {
  it("matches name or description case-insensitively and projects the item's own fields", async () => {
    const r = await search("?q=%20BUTTON%20")
    expect(r.status).toBe(200)
    expect(r.headers["Cache-Control"]).toBe("public, max-age=300, s-maxage=3600")
    expect(r.headers).not.toHaveProperty("Deprecation")

    const expected = components.filter(
      (c) =>
        c.name.toLowerCase().includes("button") ||
        (c.description ?? "").toLowerCase().includes("button")
    )
    expect(r.data.data.map((d) => d.name)).toEqual(expected.map((c) => c.name))
    expect(r.data.meta).toEqual({ total: expected.length, query: "BUTTON", node: null, category: null })

    const button = r.data.data.find((d) => d.name === "button")!
    const item = components.find((c) => c.name === "button")!
    expect(button).toEqual({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      categories: item.categories,
      node: item.node,
      nodeLabel: item.nodeLabel,
    })
    // The retired database row's names are gone from every hit.
    for (const hit of r.data.data) {
      expect(hit).not.toHaveProperty("layer")
      expect(hit).not.toHaveProperty("registry_type")
      expect(hit).not.toHaveProperty("category")
    }
  })

  it("filters by node", async () => {
    const r = await search("?node=2")
    const expected = components.filter((c) => c.node === 2).map((c) => c.name)
    expect(expected.length).toBeGreaterThan(0)
    expect(r.data.data.map((d) => d.name)).toEqual(expected)
    expect(r.data.meta.node).toBe("2")
    expect(r.data.meta).not.toHaveProperty("deprecation")
  })

  it("filters by category, against the item's categories", async () => {
    const category = components.find((c) => c.categories?.length)!.categories![0]
    const r = await search(`?category=${encodeURIComponent(category)}`)
    const expected = components.filter((c) => c.categories?.includes(category)).map((c) => c.name)
    expect(expected.length).toBeGreaterThan(0)
    expect(r.data.data.map((d) => d.name)).toEqual(expected)
  })

  it("combines parameters with AND", async () => {
    const r = await search("?q=button&node=2")
    for (const hit of r.data.data) expect(hit.node).toBe(2)
    const unfiltered = await search("?q=button")
    expect(r.data.data.length).toBeLessThan(unfiltered.data.data.length)
    expect(r.data.data.length).toBeGreaterThan(0)
  })

  it("keeps ?layer= working as a deprecated alias of node", async () => {
    const viaLayer = await search("?layer=2")
    const viaNode = await search("?node=2")
    expect(viaLayer.status).toBe(200)
    expect(viaLayer.data.data).toEqual(viaNode.data.data)
    expect(viaLayer.data.meta.node).toBe("2")
    expect(viaLayer.data.meta.deprecation).toMatch(/deprecated alias of `node`/)
    expect(viaLayer.headers.Deprecation).toBe("true")
  })

  it("prefers node over layer when both are given, without the deprecation notice", async () => {
    const r = await search("?node=3&layer=2")
    expect(r.data.meta.node).toBe("3")
    expect(r.data.meta).not.toHaveProperty("deprecation")
    for (const hit of r.data.data) expect(hit.node).toBe(3)
  })

  it("answers 400 without a usable parameter", async () => {
    for (const q of ["", "?q=%20%20", "?node=", "?layer=", "?category="]) {
      const r = await search(q)
      expect(r.status, q).toBe(400)
      expect(r.data).toEqual({ error: "At least one of q, node, or category is required" })
    }
  })
})

describe("GET /api/v1/ui/[name]/docs", () => {
  async function docs(name: string) {
    const { GET } = await import("@/app/api/v1/ui/[name]/docs/route")
    return (await GET(new Request(`https://api.mzizi.dev/api/v1/ui/${name}/docs`), {
      params: Promise.resolve({ name }),
    })) as unknown as Resp<Record<string, unknown>>
  }

  it("serves the docs row built from the item's meta block", async () => {
    const r = await docs("button")
    expect(r.status).toBe(200)
    expect(r.headers["Cache-Control"]).toBe("public, max-age=3600, s-maxage=86400")
    expect(Object.keys(r.data)).toEqual([
      "name",
      "description",
      "node",
      "nodeLabel",
      "owner",
      "collection",
      "docs",
      "demo",
    ])
    const d = r.data.docs as { component_name: string; use_cases: string[] }
    expect(d.component_name).toBe("button")
    expect(d.use_cases.length).toBeGreaterThan(0)
    expect(r.data).not.toHaveProperty("layer")
  })

  it("answers 404 for an unknown component", async () => {
    const r = await docs("does-not-exist")
    expect(r.status).toBe(404)
    expect(r.data).toEqual({ error: 'Component "does-not-exist" not found' })
  })
})

describe("GET /api/v1/ai/instructions/[name]", () => {
  async function instruction(name: string) {
    const { GET } = await import("@/app/api/v1/ai/instructions/[name]/route")
    return (await GET(new Request(`https://api.mzizi.dev/api/v1/ai/instructions/${name}`), {
      params: Promise.resolve({ name }),
    })) as unknown as Resp<Record<string, unknown>>
  }

  it("serves every set by name and by target", async () => {
    const rows = await getAllAiInstructions()
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      for (const key of [row.name, row.target]) {
        const r = await instruction(key)
        expect(r.status, key).toBe(200)
        expect(r.headers["Cache-Control"]).toBe("public, max-age=300, s-maxage=3600")
        expect(r.data).toEqual(row)
      }
    }
  })

  it("answers 404 for neither", async () => {
    const r = await instruction("nope")
    expect(r.status).toBe(404)
    expect(r.data).toEqual({ error: 'AI instruction "nope" not found' })
  })
})

describe("GET /api/v1 (discovery)", () => {
  it("says the files are the data layer, with the real count, and names no database", async () => {
    const { GET } = await import("@/app/api/v1/route")
    const r = (await GET()) as unknown as Resp<Record<string, unknown>>
    expect(r.status).toBe(200)
    expect(r.data).not.toHaveProperty("database")
    expect(r.data.data).toEqual({
      source: "files",
      repository: "https://github.com/mzizi-dev/mzizi-registry",
      components: components.length,
    })
    const text = JSON.stringify(r.data)
    expect(text).not.toMatch(/operated and developed by Nyuchi/i)
    expect(text).not.toMatch(/served from database|database and registry status/i)
    expect(text).toContain("Bundu Foundation")
  })
})

describe("openapi.yaml", () => {
  it("makes no database or Nyuchi-operator claim", async () => {
    const { readFileSync } = await import("node:fs")
    const { resolve } = await import("node:path")
    const yaml = readFileSync(resolve(__dirname, "../../../openapi.yaml"), "utf8")
    expect(yaml).not.toMatch(/read from Supabase|Reads from Supabase/i)
    expect(yaml).not.toMatch(/database is not configured|Supabase not configured/i)
    expect(yaml).not.toMatch(/operated and developed by Nyuchi/i)
    expect(yaml).not.toMatch(/NEXT_PUBLIC_SUPABASE/)
  })
})
