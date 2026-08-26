// @vitest-environment node
// Reads the manifest and the MCP server source off disk — must run in Node.
import { describe, it, expect } from "vitest"
import fs from "node:fs"
import path from "node:path"

/**
 * The plugin manifest is a PROMISE about a running endpoint, and nothing was
 * checking it against the endpoint.
 *
 * It advertised "Mzizi MCP — components, brand tokens, open 3D architecture,
 * skills, changelog". The server at mzizi.dev/mcp registers four tools:
 * list_components, get_component, list_collections, get_database_status. Four
 * of the five advertised capabilities did not exist, and the fifth named the
 * RETIRED axis model — the same vocabulary architecture-routes.test.ts already
 * forbids in public/llms.txt.
 *
 * A manifest is the first thing an agent reads and the last thing anyone
 * re-reads, so it drifts silently and is believed anyway.
 */

const root = process.cwd()
const manifest = () =>
  JSON.parse(fs.readFileSync(path.join(root, ".claude-plugin/plugin.json"), "utf-8"))
const serverSrc = () => fs.readFileSync(path.join(root, "lib/mcp-server.ts"), "utf-8")

/** Tool names the server actually registers — the source of truth. */
function registeredTools(): string[] {
  return [...serverSrc().matchAll(/server\.tool\(\s*"([a-z_]+)"/g)].map((m) => m[1] as string)
}

describe("the plugin's MCP entry describes the server that exists", () => {
  it("registers the tools this test reasons about", () => {
    // Guards the regex itself: if the registration style changes, the
    // capability check below would silently pass on an empty list.
    expect(registeredTools().length).toBeGreaterThan(0)
  })

  /**
   * Capability word → the tool that would have to exist for the claim to be
   * true. Asserted from the WORD rather than by parsing the sentence: a
   * description is prose and will be rewritten, but claiming "tokens" without a
   * token tool is wrong however the sentence is phrased.
   */
  const CLAIMS: Record<string, RegExp> = {
    token: /token/,
    architecture: /architecture|helix|node/,
    skill: /skill/,
    changelog: /changelog|version/,
    doctrine: /doctrine|ubuntu/,
    accessibility: /accessib|contrast/,
  }

  it("claims no capability the server does not implement", () => {
    const description: string = manifest().mcpServers.mzizi.description
    const tools = registeredTools()
    const unbacked = Object.entries(CLAIMS)
      .filter(([word]) => new RegExp(word, "i").test(description))
      .filter(([, toolPattern]) => !tools.some((t) => toolPattern.test(t)))
      .map(([word]) => word)
    expect(unbacked).toEqual([])
  })

  it("does not name the retired axis model", () => {
    const description: string = manifest().mcpServers.mzizi.description
    // "3D", "X/Y/Z-axis" and "layers across ... axes" are the retired
    // vocabulary. Unlike llms.txt, this field has no legitimate reason to cite
    // it in order to disown it — it is one sentence of advertising copy.
    expect(description).not.toMatch(/\b3D\b/i)
    expect(description).not.toMatch(/\baxes\b|\b[XYZ]-axis\b/i)
  })

  it("points at the endpoint the tools are served from", () => {
    expect(manifest().mcpServers.mzizi.url).toBe("https://mzizi.dev/mcp")
  })

  it("allows the hosts it needs and no others", () => {
    const net: string[] = manifest().permissions.network
    expect(net).toContain("mzizi.dev")
    // A manifest that quietly widens its network reach is worth failing on.
    expect(net.sort()).toEqual(["assets.nyuchi.com", "mzizi.dev"])
  })
})
