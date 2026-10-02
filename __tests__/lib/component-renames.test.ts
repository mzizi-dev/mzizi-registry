import { describe, expect, it } from "vitest"

import manifest from "@/registry.json"
import {
  COMPONENT_RENAMES,
  componentNameHistory,
  renamedComponent,
  renamedComponentPath,
} from "@/lib/component-renames"
import { readComponent } from "@/lib/registry"

/**
 * The `nyuchi-*` → `mzizi-*` rename (2026-09-27) must not break a single
 * published link. These tests pin the map and the name lookup the MCP tools go
 * through. The HTTP 308s are served by mzizi-dev/mzizi-api-gateway
 * (src/redirects.ts), which reads this same map, and are tested there.
 */

const itemNames = new Set((manifest as { items: { name: string }[] }).items.map((i) => i.name))

describe("the rename map", () => {
  it("maps every old name to an item that exists, and no old name is still an item", () => {
    for (const [old, next] of Object.entries(COMPONENT_RENAMES)) {
      expect(itemNames.has(next), `${old} → ${next}`).toBe(true)
      expect(itemNames.has(old), `${old} is still in registry.json`).toBe(false)
    }
  })

  it("leaves no nyuchi-* item behind", () => {
    expect([...itemNames].filter((n) => n.startsWith("nyuchi-"))).toEqual([])
  })

  it("covers the 123 components renamed on 2026-09-27", () => {
    expect(Object.keys(COMPONENT_RENAMES)).toHaveLength(123)
  })
})

describe("renamedComponentPath", () => {
  it("rewrites the item segment and keeps the prefix and sub-path", () => {
    expect(renamedComponentPath("/components/nyuchi-footer")).toBe("/components/mzizi-footer")
    expect(renamedComponentPath("/v1/ui/nyuchi-footer/docs")).toBe("/v1/ui/mzizi-footer/docs")
    expect(renamedComponentPath("/api/v1/rs/nyuchi-bottom-nav")).toBe("/api/v1/rs/mzizi-bottom-nav")
  })

  it("prefers the exact item over a shorter one sharing its prefix", () => {
    expect(renamedComponentPath("/v1/ui/nyuchi-tokens-globals")).toBe("/v1/ui/mzizi-tokens-globals")
  })

  it("leaves names that were never renamed alone", () => {
    expect(renamedComponentPath("/v1/ui/button")).toBeNull()
    expect(renamedComponentPath("/v1/ui/mzizi-footer")).toBeNull()
    expect(renamedComponentPath("/v1/ui/nyuchi-footerx")).toBeNull()
    expect(renamedComponentPath("/skills/nyuchi-footer")).toBeNull()
  })
})

describe("old names still resolve", () => {
  it("readComponent answers an old name with the renamed item", () => {
    expect(readComponent("nyuchi-footer")?.name).toBe("mzizi-footer")
    expect(readComponent("nyuchi-no-such-thing")).toBeNull()
  })

  it("componentNameHistory lists current then previous names", () => {
    expect(componentNameHistory("mzizi-footer")).toEqual(["mzizi-footer", "nyuchi-footer"])
    expect(componentNameHistory("nyuchi-footer")).toEqual(["mzizi-footer", "nyuchi-footer"])
    expect(componentNameHistory("button")).toEqual(["button"])
    expect(renamedComponent("hasOwnProperty")).toBeUndefined()
  })
})
