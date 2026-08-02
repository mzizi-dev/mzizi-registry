/**
 * `@/lib/registry-source` is the single reader of component source on disk.
 *
 * These run against the REAL `components/registry/**` tree rather than a
 * fixture, because the property that matters is "the file the route serves is
 * the file in the repo" — a fixture would assert the resolver's shape while
 * leaving the thing the migration exists to guarantee untested.
 */

import { describe, expect, it, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import {
  componentsOnDisk,
  readComponentSource,
  resetRegistrySourceCache,
  resolveComponentSource,
} from "@/lib/registry-source"

beforeEach(() => resetRegistrySourceCache())

describe("readComponentSource", () => {
  it("returns the file's real bytes, not a rendering of them", () => {
    const onDisk = readFileSync(
      join(process.cwd(), "components/registry/n11-discovery/nyuchi-seo.tsx"),
      "utf8"
    )
    expect(readComponentSource("nyuchi-seo")).toBe(onDisk)
  })

  it("finds a component without being told its node", () => {
    // The caller has a name, not a node. If the resolver needed the node it
    // would need the node-label table too, and that table would then live in
    // two places.
    expect(readComponentSource("nyuchi-seo")).toContain("generateMetadata")
  })

  it("returns null — never an empty string — for a component with no file", () => {
    // A 200 carrying an empty body is exactly how the pre-migration bugs hid,
    // so the absent case has to be distinguishable at the type level.
    expect(readComponentSource("no-such-component-anywhere")).toBeNull()
  })

  it("does not resolve a path traversal to something outside the registry", () => {
    expect(readComponentSource("../../package")).toBeNull()
    expect(readComponentSource("../../../etc/passwd")).toBeNull()
  })
})

describe("resolveComponentSource — the migration window", () => {
  it("prefers disk over the database column", () => {
    // Both copies exist for exactly as long as a node takes to move. Disk wins,
    // because disk is the copy the toolchain has actually checked.
    expect(resolveComponentSource("nyuchi-seo", "// stale db copy")).toContain("generateMetadata")
  })

  it("falls back to the database for a component not yet extracted", () => {
    // Without this the read path would 404 every un-extracted component — an
    // outage across the whole registry in exchange for nothing, since the DB
    // copy is still there and still correct.
    expect(resolveComponentSource("not-yet-extracted", "export const x = 1")).toBe(
      "export const x = 1"
    )
  })

  it("treats a blank database column as absent, not as empty source", () => {
    expect(resolveComponentSource("not-yet-extracted", "   \n ")).toBeNull()
    expect(resolveComponentSource("not-yet-extracted", "")).toBeNull()
    expect(resolveComponentSource("not-yet-extracted", null)).toBeNull()
    expect(resolveComponentSource("not-yet-extracted")).toBeNull()
  })
})

describe("componentsOnDisk", () => {
  it("lists migrated components and is sorted", () => {
    const names = componentsOnDisk()
    expect(names).toContain("nyuchi-seo")
    expect(names).toEqual([...names].sort())
  })

  it("holds no duplicates — a name maps to exactly one file", () => {
    const names = componentsOnDisk()
    expect(new Set(names).size).toBe(names.length)
  })
})
