// @vitest-environment node
// Reads the manifest off disk — must run in Node.
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

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

const root = process.cwd();
const manifest = () =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, "plugin/.claude-plugin/plugin.json"),
      "utf-8",
    ),
  );

describe("the plugin's MCP entry describes the server that exists", () => {
  it("points at the one Mzizi MCP", () => {
    // Not `mzizi.dev/mcp`. That route still answers — as a 308 — so a client
    // configured against it keeps working, but a manifest shipped today should
    // name the endpoint rather than the forwarder.
    expect(manifest().mcpServers.mzizi.url).toBe("https://mcp.mzizi.dev/mcp");
  });

  it("registers exactly one MCP server", () => {
    // The whole point of the consolidation. A second entry here would put the
    // choice back in front of every agent that installs this plugin.
    expect(Object.keys(manifest().mcpServers)).toEqual(["mzizi"]);
  });

  it("does not name the retired axis model", () => {
    const description: string = manifest().description;
    // "3D", "X/Y/Z-axis" and "layers across ... axes" are the retired
    // vocabulary. Unlike llms.txt, this field has no legitimate reason to cite
    // it in order to disown it — it is one sentence of advertising copy. The
    // server entry carries no description of its own (an MCP server config is
    // `type` + `url`), so this checks the plugin's.
    expect(description).not.toMatch(/\b3D\b/i);
    expect(description).not.toMatch(/\baxes\b|\b[XYZ]-axis\b/i);
  });

  it("declares the server as Streamable HTTP", () => {
    // Claude Code reads an entry with a `url` and no `type` as a stdio server
    // and skips it. 1.1.0 and earlier said `"type": "url"`, which
    // `claude plugin validate` rejects, so the MCP never loaded.
    expect(manifest().mcpServers.mzizi.type).toBe("http");
  });

  it("ships no MCP config but its own", () => {
    // Claude Code always loads `.mcp.json` at a plugin's root and merges the
    // manifest's `mcpServers` into it; the manifest cannot exclude it. The
    // plugin is rooted at `plugin/` so the repo root's developer `.mcp.json`
    // (the shadcn MCP) never reaches a user who installs it.
    expect(fs.existsSync(path.join(root, "plugin/.mcp.json"))).toBe(false);
  });
});

/**
 * The public plugin carries seven of the skills; the dev workflow is a second plugin.
 * Claude Code installs a plugin from git, so the skills must be files in this
 * repository: `skills/` is a copy of `@nyuchi/mzizi-skills`, written by
 * scripts/generate-plugin-skills.mjs and gated in CI by `pnpm plugin:skills:check`.
 * These specs pin the shape a user installs; the check pins the bytes.
 *
 * WHY TWO (owner, 2026-11-12). The Claude plugin directory holds a plugin for review
 * when it ships scripts, a hook module or a file it cannot read as text or a supported
 * image, and will later accept those only from verified organizations. The public
 * `mzizi` plugin therefore ships Markdown, images and an MCP connection only; the
 * scripts and the hooks module live in `mzizi-dev`.
 */
const DEV_SKILLS = [
  "digital-hygiene",
  "pr-gates",
  "progress-report",
  "registry-propagation",
  "ship-release",
];
const manifestOf = (dir: string) =>
  JSON.parse(
    fs.readFileSync(
      path.join(root, dir, ".claude-plugin/plugin.json"),
      "utf-8",
    ),
  );
const walk = (dir: string): string[] =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
    );

describe("the public plugin carries the published skills", () => {
  const bundle = JSON.parse(
    fs.readFileSync(
      path.join(root, "node_modules/@nyuchi/mzizi-skills/index.json"),
      "utf-8",
    ),
  ) as { version: string; skills: { name: string; file: string }[] };

  it("ships one skills/<name>/SKILL.md per public skill in the package, and no others", () => {
    const onDisk = fs
      .readdirSync(path.join(root, "plugin/skills"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    const publicSkills = bundle.skills
      .map((s) => s.name)
      .filter((n) => !DEV_SKILLS.includes(n))
      .sort();
    expect(onDisk).toEqual(publicSkills);
    for (const n of publicSkills) {
      expect(
        fs.existsSync(path.join(root, "plugin/skills", n, "SKILL.md")),
        n,
      ).toBe(true);
    }
  });

  it("ships the dev skills in the dev plugin, and only there", () => {
    const dev = fs
      .readdirSync(path.join(root, "plugin-dev/skills"), {
        withFileTypes: true,
      })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    expect(dev).toEqual([...DEV_SKILLS].sort());
    for (const n of DEV_SKILLS)
      expect(fs.existsSync(path.join(root, "plugin/skills", n)), n).toBe(false);
  });

  it("runs nothing on the user's machine: no script, no hook module, no .mcp.json", () => {
    // The directory holds a plugin for review for each of these. They belong in
    // `plugin-dev/`.
    const files = walk(path.join(root, "plugin"));
    for (const f of files) {
      expect(f, f).not.toMatch(/\.(sh|bash|zsh|ps1|js|mjs|cjs|ts)$/);
    }
    expect(fs.existsSync(path.join(root, "plugin/hooks"))).toBe(false);
    expect(manifest().hooks).toBeUndefined();
  });

  it("carries no file the directory cannot read as text or a supported image", () => {
    // `.ico` is refused (BINARIES_NOT_INSPECTED); text (Markdown, JSON, YAML, CSS) and PNG, JPEG, GIF, WebP and SVG images pass.
    const ok = /\.(md|json|ya?ml|txt|css|png|jpe?g|gif|webp|svg)$/i;
    for (const f of walk(path.join(root, "plugin"))) expect(f, f).toMatch(ok);
  });

  it("declares an icon the directory accepts and a privacy policy", () => {
    // Square PNG, 512 to 2048 px a side, under 2 MB.
    const icon = path.join(root, "plugin", manifest().icon);
    const buf = fs.readFileSync(icon);
    expect(buf.subarray(1, 4).toString()).toBe("PNG");
    const [w, h] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    expect(w).toBe(h);
    expect(w).toBeGreaterThanOrEqual(512);
    expect(w).toBeLessThanOrEqual(2048);
    expect(buf.length).toBeLessThan(2 * 1024 * 1024);
    expect(manifest().privacyPolicyUrl).toBe(
      "https://www.bundu.org/legal/privacy",
    );
  });

  it("quotes every skill description in YAML frontmatter", () => {
    for (const dir of ["plugin/skills", "plugin-dev/skills"]) {
      for (const f of walk(path.join(root, dir)).filter((p) =>
        p.endsWith("SKILL.md"),
      )) {
        const m = /^description: (.*)$/m.exec(fs.readFileSync(f, "utf-8"));
        expect(m, f).not.toBeNull();
        expect(m![1], f).toMatch(/^".*"$/);
      }
    }
  });

  it("names the skills version it carries", () => {
    expect(manifest().description).toContain(
      `@nyuchi/mzizi-skills ${bundle.version}`,
    );
  });

  it("is installable from this repository's marketplace", () => {
    const market = JSON.parse(
      fs.readFileSync(
        path.join(root, ".claude-plugin/marketplace.json"),
        "utf-8",
      ),
    );
    expect(market.plugins.map((p: { name: string }) => p.name)).toEqual([
      manifest().name,
      manifestOf("plugin-dev").name,
    ]);
    expect(market.plugins[0].source).toBe("./plugin");
    expect(market.plugins[1].source).toBe("./plugin-dev");
  });

  it("gives the dev plugin the hooks module and the scripts", () => {
    expect(fs.existsSync(path.join(root, "plugin-dev/hooks/hooks.json"))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(root, "plugin-dev/hooks/register.ts"))).toBe(
      true,
    );
    expect(manifestOf("plugin-dev").description).toContain(
      `@nyuchi/mzizi-skills ${bundle.version}`,
    );
    for (const [skill, script] of [
      ["digital-hygiene", "hygiene.sh"],
      ["progress-report", "progress.sh"],
      ["ship-release", "verify-live.sh"],
    ])
      expect(
        fs.existsSync(path.join(root, "plugin-dev/skills", skill, script)),
        script,
      ).toBe(true);
  });

  it("names the project's contact, not a person's", () => {
    // Owner, 2026-09-30: the general contact is support@bundu.org.
    expect(manifest().author.email).toBe("support@bundu.org");
    const market = JSON.parse(
      fs.readFileSync(
        path.join(root, ".claude-plugin/marketplace.json"),
        "utf-8",
      ),
    );
    expect(market.owner.email).toBe("support@bundu.org");
  });
});

/**
 * The plugin's commands and agent (restored for mzizi-registry#589). The retired private
 * plugin's copies named tools that no longer exist (`mzizi_read_documents`,
 * `get_brand_tokens`, `mcp_describe`) and a model by name, so these pin the shape a user
 * installs and keep those out.
 */
describe("the public plugin's commands and agent", () => {
  const dir = (d: string) => path.join(root, "plugin", d);
  const front = (file: string) => {
    const raw = fs.readFileSync(file, "utf-8");
    const m = /^---\n([\s\S]*?)\n---\n/.exec(raw);
    return { meta: m ? m[1] : "", body: raw };
  };
  const files = ["commands", "agents"].flatMap((d) =>
    fs.readdirSync(dir(d)).map((f) => path.join(dir(d), f)),
  );

  it("ships /mzizi:component, /mzizi:scaffold and the fundi agent", () => {
    expect(fs.readdirSync(dir("commands")).sort()).toEqual([
      "component.md",
      "scaffold.md",
    ]);
    expect(fs.readdirSync(dir("agents"))).toEqual(["fundi.md"]);
    expect(front(path.join(dir("agents"), "fundi.md")).meta).toMatch(
      /^name: fundi$/m,
    );
  });

  it("gives every command and agent a description", () => {
    for (const f of files)
      expect(front(f).meta, f).toMatch(/^description: \S/m);
  });

  it("names no retired tool, no retired host and no model", () => {
    for (const f of files) {
      const { meta, body } = front(f);
      expect(body, f).not.toMatch(
        /mzizi_read_documents|mzizi_list_collections|get_brand_tokens|mzizi_get_node_documents|\bmcp_describe\b|mzizi\.dev\/api\/v1/,
      );
      expect(meta, f).not.toMatch(/^model:/m);
    }
  });

  it("installs from the API host with the full URL, never a bare shadcn name", () => {
    for (const f of files) {
      // A line that names the bare form only to warn against it ("a bare `npx shadcn add`")
      // is allowed; an instruction to run it is not.
      const lines = front(f)
        .body.split("\n")
        .filter((l) => !/\bbare\b/.test(l));
      for (const line of lines) {
        expect(line, f).not.toMatch(
          /npx shadcn(@latest)? add (?!https:\/\/api\.mzizi\.dev\/v1\/ui\/)[a-z<$]/,
        );
      }
    }
  });
});

/**
 * The same plugin, for Codex and ChatGPT. OpenAI's hosts read the portable
 * Agent Plugins layout (https://agent-plugins.org): `plugin.json` and
 * `mcp.json` at the plugin root, beside the same `skills/`, and a repo
 * marketplace at `.agents/plugins/marketplace.json`. Claude Code reads neither
 * file (it loads `.claude-plugin/plugin.json` and a dotted `.mcp.json`), so
 * the two manifests can only drift apart; these specs keep them one plugin.
 */
describe("the portable manifest is the same plugin", () => {
  const read = (p: string) =>
    JSON.parse(fs.readFileSync(path.join(root, p), "utf-8"));
  const portable = () => read("plugin/plugin.json");

  it("declares the Agent Plugins schema", () => {
    expect(portable().$schema).toBe(
      "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    );
    expect(read("plugin/mcp.json").$schema).toBe(
      "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
    );
  });

  it("has the Claude manifest's name, version and description", () => {
    expect(portable().name).toBe(manifest().name);
    expect(portable().version).toBe(manifest().version);
    expect(portable().description).toBe(manifest().description);
  });

  it("connects the one Mzizi MCP, and only it", () => {
    const servers = read("plugin/mcp.json").mcpServers;
    expect(Object.keys(servers)).toEqual(["mzizi"]);
    expect(servers.mzizi).toEqual({
      type: "streamable-http",
      url: manifest().mcpServers.mzizi.url,
    });
  });

  it("is listed by the repo marketplace OpenAI's hosts read", () => {
    const market = read(".agents/plugins/marketplace.json");
    expect(market.plugins).toHaveLength(1);
    expect(market.plugins[0].name).toBe(portable().name);
    expect(market.plugins[0].source).toEqual({
      source: "local",
      path: "./plugin",
    });
    expect(market.plugins[0].policy.installation).toBe("AVAILABLE");
  });
});
