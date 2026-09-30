// @vitest-environment node
// Reads the manifest off disk — must run in Node.
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * The plugin manifest is a PROMISE about a running endpoint, and nothing was
 * checking it against the endpoint.
 *
 * It advertised "Mzizi MCP — components, brand tokens, open 3D architecture,
 * skills, changelog" while the portal's own server registered four tools:
 * list_components, get_component, list_collections, get_database_status. Four
 * of the five advertised capabilities did not exist, and the fifth named the
 * RETIRED axis model — the same vocabulary architecture-routes.test.ts already
 * forbids in public/llms.txt.
 *
 * A manifest is the first thing an agent reads and the last thing anyone
 * re-reads, so it drifts silently and is believed anyway.
 *
 * WHAT CHANGED. That four-tool server is gone. There is one Mzizi MCP —
 * `mcp.mzizi.dev/mcp`, the `mzizi-mcp` Worker in mzizi-dev/agent-tools — and
 * `mzizi.dev/mcp` is a 308 to it. So the capability check can no longer read
 * the tool list off disk: the source of truth is in another repository.
 *
 * Rather than replace it with a hand-copied list of eleven tool names — which
 * is the drift this suite exists to catch, merely relocated — the local
 * assertions narrow to what this repo can actually verify: the URL it points
 * at, the hosts it may reach, and the vocabulary it uses. The capability claim
 * is checkable at runtime against `mcp.mzizi.dev/catalogue.json`, which is
 * published for exactly this and is deliberately NOT fetched from a unit test.
 */

const root = process.cwd()
const manifest = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, "plugin/.claude-plugin/plugin.json"),
      "utf-8",
    ),
  )

describe("the plugin's MCP entry describes the server that exists", () => {
  it("points at the one Mzizi MCP", () => {
    // Not `mzizi.dev/mcp`. That route still answers — as a 308 — so a client
    // configured against it keeps working, but a manifest shipped today should
    // name the endpoint rather than the forwarder.
    expect(manifest().mcpServers.mzizi.url).toBe("https://mcp.mzizi.dev/mcp")
  })

  it("registers exactly one MCP server", () => {
    // The whole point of the consolidation. A second entry here would put the
    // choice back in front of every agent that installs this plugin.
    expect(Object.keys(manifest().mcpServers)).toEqual(["mzizi"])
  })

  it("does not name the retired axis model", () => {
    const description: string = manifest().description
    // "3D", "X/Y/Z-axis" and "layers across ... axes" are the retired
    // vocabulary. Unlike llms.txt, this field has no legitimate reason to cite
    // it in order to disown it — it is one sentence of advertising copy. The
    // server entry carries no description of its own (an MCP server config is
    // `type` + `url`), so this checks the plugin's.
    expect(description).not.toMatch(/\b3D\b/i)
    expect(description).not.toMatch(/\baxes\b|\b[XYZ]-axis\b/i)
  })

  it("declares the server as Streamable HTTP", () => {
    // Claude Code reads an entry with a `url` and no `type` as a stdio server
    // and skips it. 1.1.0 and earlier said `"type": "url"`, which
    // `claude plugin validate` rejects, so the MCP never loaded.
    expect(manifest().mcpServers.mzizi.type).toBe("http")
  })

  it("ships no MCP config but its own", () => {
    // Claude Code always loads `.mcp.json` at a plugin's root and merges the
    // manifest's `mcpServers` into it; the manifest cannot exclude it. The
    // plugin is rooted at `plugin/` so the repo root's developer `.mcp.json`
    // (the shadcn MCP) never reaches a user who installs it.
    expect(fs.existsSync(path.join(root, "plugin/.mcp.json"))).toBe(false)
  })
})

/**
 * The public plugin carries the skills. Claude Code installs a plugin from git,
 * so the skills must be files in this repository: `skills/` is a byte-for-byte
 * copy of `@nyuchi/mzizi-skills`, written by scripts/generate-plugin-skills.mjs
 * and gated in CI by `pnpm plugin:skills:check`. These specs pin the shape a
 * user installs; the check pins the bytes.
 */
describe("the public plugin carries the published skills", () => {
  const bundle = JSON.parse(
    fs.readFileSync(
      path.join(root, "node_modules/@nyuchi/mzizi-skills/index.json"),
      "utf-8",
    ),
  ) as { version: string; skills: { name: string; file: string }[] }

  it("ships one skills/<name>/SKILL.md per skill in the package, and no others", () => {
    const onDisk = fs
      .readdirSync(path.join(root, "plugin/skills"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
    expect(onDisk).toEqual(bundle.skills.map((s) => s.name).sort())
    for (const s of bundle.skills) {
      expect(
        fs.existsSync(path.join(root, "plugin/skills", s.name, "SKILL.md")),
        s.name,
      ).toBe(true)
    }
  })

  it("names the skills version it carries", () => {
    expect(manifest().description).toContain(
      `@nyuchi/mzizi-skills ${bundle.version}`,
    )
  })

  it("is installable from this repository's marketplace", () => {
    const market = JSON.parse(
      fs.readFileSync(
        path.join(root, ".claude-plugin/marketplace.json"),
        "utf-8",
      ),
    )
    expect(market.plugins).toHaveLength(1)
    expect(market.plugins[0].name).toBe(manifest().name)
    expect(market.plugins[0].source).toBe("./plugin")
  })

  it("names the project's contact, not a person's", () => {
    // Owner, 2026-09-30: the general contact is support@bundu.org.
    expect(manifest().author.email).toBe("support@bundu.org")
    const market = JSON.parse(
      fs.readFileSync(
        path.join(root, ".claude-plugin/marketplace.json"),
        "utf-8",
      ),
    )
    expect(market.owner.email).toBe("support@bundu.org")
  })
})
