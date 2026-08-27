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
 * `mcp.mzizi.dev/mcp`, the `mzizi-mcp` Worker in nyuchi/mzizi-tools — and
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
  JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf-8"))

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
    const description: string = manifest().mcpServers.mzizi.description
    // "3D", "X/Y/Z-axis" and "layers across ... axes" are the retired
    // vocabulary. Unlike llms.txt, this field has no legitimate reason to cite
    // it in order to disown it — it is one sentence of advertising copy.
    expect(description).not.toMatch(/\b3D\b/i)
    expect(description).not.toMatch(/\baxes\b|\b[XYZ]-axis\b/i)
  })

  it("allows the hosts it needs and no others", () => {
    const net: string[] = manifest().permissions.network
    expect(net).toContain("mcp.mzizi.dev")
    expect(net).toContain("mzizi.dev")
    // A manifest that quietly widens its network reach is worth failing on.
    expect(net.sort()).toEqual(["assets.nyuchi.com", "mcp.mzizi.dev", "mzizi.dev"])
  })
})
