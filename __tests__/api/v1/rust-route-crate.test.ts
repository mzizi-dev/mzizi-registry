import { describe, expect, it, vi } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

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
 * `/api/v1/rs/{name}` names the crate that actually compiles the component.
 *
 * It used to answer `mzizi-ui` for all of them. Asserted by invoking the handler for every
 * `.rs` file in the registry and checking the crate named in the payload is the one whose
 * `src/generated/` holds that file — the ground truth `pnpm rust:generate` writes.
 */

type Served = {
  status: number
  data: {
    name?: string
    target?: string
    crate?: { name: string; registry: string; git: string }
    files?: { path: string; type: string; content: string }[]
  }
}

const ROOT = process.cwd()
const REGISTRY = join(ROOT, "components", "registry")
const CRATES = join(ROOT, "mzizi-rs", "crates")

function rustSources(): { node: string; name: string }[] {
  const out: { node: string; name: string }[] = []
  for (const dir of readdirSync(REGISTRY, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    for (const f of readdirSync(join(REGISTRY, dir.name))) {
      if (f.endsWith(".rs")) out.push({ node: dir.name, name: f.slice(0, -3) })
    }
  }
  return out
}

/** The crate whose generated copies include `<name>.rs`. */
function crateHolding(name: string): string | undefined {
  return readdirSync(CRATES).find((crate) => {
    try {
      return readdirSync(join(CRATES, crate, "src", "generated")).includes(`${name}.rs`)
    } catch {
      return false
    }
  })
}

async function serve(name: string): Promise<Served> {
  const { GET } = await import("@/app/api/v1/rs/[name]/route")
  return (await GET(new Request(`https://mzizi.dev/api/v1/rs/${name}`), {
    params: Promise.resolve({ name }),
  })) as unknown as Served
}

describe("/api/v1/rs/[name] names the right crate", () => {
  it("for every Rust component in the registry", async () => {
    const sources = rustSources()
    expect(sources.length).toBeGreaterThan(40)
    for (const { name } of sources) {
      // The N1 token module is served too; it is a registry item of its own.
      const r = await serve(name)
      expect(r.status, name).toBe(200)
      expect(r.data.crate?.name, name).toBe(crateHolding(name))
      expect(r.data.crate?.git).toBe("https://github.com/mzizi-dev/mzizi-registry")
    }
  })

  it("serves the first Mzizi Roots batch from mzizi-brand", async () => {
    const batch = [
      "mzizi-alert-banner",
      "mzizi-avatar-stack",
      "mzizi-cover-header",
      "mzizi-empty-state",
      "mzizi-escalation-card",
      "mzizi-gauge-card",
      "mzizi-hero-stat",
      "mzizi-meta-tile",
      "mzizi-stats-row",
      "mzizi-success-screen",
      "mzizi-suitability-card",
      "mzizi-user-card",
    ]
    for (const name of batch) {
      const r = await serve(name)
      expect(r.status, name).toBe(200)
      expect(r.data.target).toBe("dioxus")
      expect(r.data.crate?.name, name).toBe("mzizi-brand")
      const file = r.data.files?.[0]
      expect(file?.path).toBe(`components/registry/n3-brand/${name}.rs`)
      expect(file?.content).toBe(readFileSync(join(REGISTRY, "n3-brand", `${name}.rs`), "utf8"))
      expect(file?.content).toContain("pub const CONTRACT: &str")
    }
  })

  it("still 404s a component with no Rust sibling", async () => {
    const r = await serve("mzizi-media")
    expect(r.status).toBe(404)
  })
})
