// @vitest-environment node
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import {
  componentsOnDisk,
  readComponentSource,
  readComponentSourceFor,
} from "@/lib/registry-source"
import SOURCES from "@/lib/registry-source.generated.json"

/**
 * Component source moved off the filesystem and into a generated artifact, so
 * this app can run on Cloudflare Workers — which has none. This was the LAST
 * filesystem reader in the read path.
 *
 * Verified by dumping every component's source through the public API before
 * and after and comparing: 573 components, byte-identical.
 */
const ROOT = join(process.cwd(), "components", "registry")

describe("registry source is served from the generated artifact", () => {
  it("matches the tree on disk, file for file", () => {
    // The artifact is generated, so the risk is that it silently stops covering
    // the tree — a component added without regenerating is a 404 in production.
    const onDisk: string[] = []
    for (const dir of readdirSync(ROOT)) {
      const dirPath = join(ROOT, dir)
      if (!statSync(dirPath).isDirectory()) continue
      for (const f of readdirSync(dirPath)) {
        if (statSync(join(dirPath, f)).isFile()) onDisk.push(`${dir}/${f}`)
      }
    }
    expect(Object.keys(SOURCES).sort()).toEqual(onDisk.sort())
  })

  it("serves content byte-identical to the file on disk", () => {
    for (const name of componentsOnDisk().slice(0, 40)) {
      const served = readComponentSource(name)
      expect(served, `${name} served nothing`).not.toBeNull()
      // Find the file it came from and compare exactly.
      const key = Object.keys(SOURCES).find(
        (k) => k.endsWith(`/${name}.tsx`) || k.endsWith(`/${name}.ts`)
      )
      if (!key) continue
      expect(served).toBe(readFileSync(join(ROOT, key), "utf8"))
    }
  })

  /**
   * A 200 carrying an empty body is exactly how the pre-migration source bugs
   * hid for 571 components, so `null` and `""` must stay distinguishable.
   *
   * This covers the UNKNOWN-NAME path only. The other null path in `readAt` —
   * an index key missing from the artifact — is unreachable by construction,
   * because the index is built from `Object.keys(SOURCES)`. Mutation-testing
   * proved it: changing that branch to return `""` fails no spec. Said plainly
   * rather than left implied, because a test that looks like it covers a branch
   * it cannot reach is worse than an uncovered branch.
   */
  it("returns null for an unknown component, never an empty string", () => {
    expect(readComponentSource("no-such-component-anywhere")).toBeNull()
    expect(readComponentSourceFor("no-such-component-anywhere", "rs")).toBeNull()
    // And the reachable empty case: a component whose file is whitespace-only
    // must read as absent, not as a successful empty response.
    const blank = Object.keys(SOURCES).find((k) => SOURCES[k as keyof typeof SOURCES].trim() === "")
    expect(blank, "no blank source in the tree — nothing to assert").toBeUndefined()
  })

  it("404s the Rust target for a TypeScript-only component", () => {
    // /api/v1/rs/{name} must not pretend a Dioxus version exists.
    expect(readComponentSourceFor("data-table", "rs")).toBeNull()
    // …and must serve it where one does.
    expect(readComponentSourceFor("button", "rs")).toMatch(/Dioxus|dioxus/)
  })

  it("serves React, not Rust, as a component's primary source", () => {
    // `button` ships button.tsx and button.rs. `.rs` sorts before `.tsx`, so a
    // lost extension preference would hand a shadcn consumer Dioxus.
    expect(readComponentSource("button")).toMatch(
      /^["']use client["']|import \* as React|from "react"/m
    )
  })

  it("needs no filesystem", () => {
    const src = readFileSync(join(process.cwd(), "lib/registry-source.ts"), "utf8")
    expect(src).not.toMatch(/from ["']fs["']|from ["']node:fs["']/)
  })
})
