// Copy the published skills bundle into two committed trees, one per Claude Code
// plugin this repo's `.claude-plugin/marketplace.json` lists:
//
//   plugin/skills/      the public `mzizi` plugin: Markdown skills that need no
//                       script, plus the Mzizi MCP. This is the plugin submitted
//                       to the Claude plugin directory, so it ships no script, no
//                       hook module and no file the directory cannot read as text
//                       or as a PNG, JPEG, GIF, WebP or SVG image.
//   plugin-dev/skills/  the `mzizi-dev` plugin: the dev skills that ship shell
//                       scripts (digital-hygiene, progress-report, ship-release)
//                       or run commands against our own repos (registry-propagation,
//                       pr-gates). Installed from this marketplace, not submitted.
//
// WHY TWO PLUGINS (owner decision, 2026-11-12). The directory holds a plugin for
// review when it ships scripts that read the installer's environment, a hook module,
// or a binary it cannot inspect, and will later accept those only from verified
// organizations, which we are not and cannot ask to become. Keeping them out of the
// public plugin lets it pass without verification; the dev plugin keeps them.
//
// WHY `plugin/` AND `plugin-dev/` AND NOT THE REPO ROOT. Claude Code always loads
// `.mcp.json` at a plugin's root, and the manifest cannot switch that off
// (`mcpServers` merges with it). The repo root's `.mcp.json` is a developer tool (the
// shadcn MCP), so a plugin rooted there would configure it for every user who installs
// the plugin. Rooted at `plugin/`, the public plugin ships only its skills and the
// Mzizi MCP declared in its manifest.
//
// WHY A COMMITTED COPY. A plugin installs from git, so its skills must be files in
// the repository: `node_modules/@nyuchi/mzizi-skills` is not in a clone. Skills are
// authored in mzizi-dev/agent-tools (`mzizi-skills/`), which is private, so this is the
// one public place a Claude Code user can install them from. The copies are build
// output in the same sense as `lib/skills.generated.ts`: one generator, committed
// artifacts, and a `--check` gate (CI's "generated artifacts" step) so they cannot
// drift from the `@nyuchi/mzizi-skills` version in package.json. Never edit
// `plugin/skills/` or `plugin-dev/skills/` by hand; bump the dependency and regenerate.
//
// Every file under a skill is copied byte for byte (SKILL.md plus anything a skill
// ships, such as mzizi-design's generated tokens), with ONE exception: files the
// public plugin's rules refuse (EXCLUDED_FROM_PUBLIC below). The package keeps them;
// the public copy omits them. Anything in either tree that the package does not ship is
// removed.
//
// Usage:
//   node scripts/generate-plugin-skills.mjs           write plugin/skills/ and plugin-dev/skills/
//   node scripts/generate-plugin-skills.mjs --check   fail if either is stale (CI)

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

const require_ = createRequire(import.meta.url);
const ROOT = process.cwd();
const check = process.argv.includes("--check");

// The dev skills: the ones whose folder carries a shell script or that drive our own
// repos. Every other skill in the package is public.
const DEV_SKILLS = [
  "digital-hygiene",
  "pr-gates",
  "progress-report",
  "registry-propagation",
  "ship-release",
];

// Files the public plugin must not ship: the directory cannot inspect a .ico as text
// or as one of the accepted image types (BINARIES_NOT_INSPECTED). mukoko-design keeps
// the PNG and SVG forms of the same favicon.
const EXCLUDED_FROM_PUBLIC = ["mukoko-design/favicon/favicon.ico"];

const pkgDir = dirname(require_.resolve("@nyuchi/mzizi-skills/index.json"));
const SRC = join(pkgDir, "skills");
const { version } = JSON.parse(
  readFileSync(join(pkgDir, "index.json"), "utf8"),
);

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const all = new Map(walk(SRC).map((p) => [relative(SRC, p), readFileSync(p)]));
const isDev = (rel) => DEV_SKILLS.includes(rel.split(/[\\/]/)[0]);

const targets = [
  {
    label: "plugin/skills/",
    out: join(ROOT, "plugin", "skills"),
    want: new Map(
      [...all].filter(
        ([rel]) =>
          !isDev(rel) &&
          !EXCLUDED_FROM_PUBLIC.includes(rel.split("\\").join("/")),
      ),
    ),
  },
  {
    label: "plugin-dev/skills/",
    out: join(ROOT, "plugin-dev", "skills"),
    want: new Map([...all].filter(([rel]) => isDev(rel))),
  },
];

const skillCount = (want) =>
  new Set([...want.keys()].map((rel) => rel.split(/[\\/]/)[0])).size;

const missingDev = DEV_SKILLS.filter(
  (s) => ![...all.keys()].some((rel) => rel.split(/[\\/]/)[0] === s),
);
if (missingDev.length) {
  console.error(
    `✗ @nyuchi/mzizi-skills ${version} has no skill named ${missingDev.join(", ")}; update DEV_SKILLS in scripts/generate-plugin-skills.mjs`,
  );
  process.exit(1);
}

if (check) {
  let failed = false;
  for (const t of targets) {
    const have = new Map(
      walk(t.out).map((p) => [relative(t.out, p), readFileSync(p)]),
    );
    const stale = [];
    for (const [rel, buf] of t.want) {
      if (!have.has(rel)) stale.push(`missing ${rel}`);
      else if (!have.get(rel).equals(buf)) stale.push(`differs ${rel}`);
    }
    for (const rel of have.keys())
      if (!t.want.has(rel)) stale.push(`extra ${rel}`);
    if (stale.length) {
      failed = true;
      console.error(
        `✗ ${t.label} does not match @nyuchi/mzizi-skills ${version} (${stale.length} file(s)):\n` +
          stale.map((s) => `  ${s}`).join("\n") +
          "\n  Run: node scripts/generate-plugin-skills.mjs",
      );
    } else {
      console.log(
        `✓ ${t.label} matches @nyuchi/mzizi-skills ${version} — ${skillCount(t.want)} skills, ${t.want.size} files`,
      );
    }
  }
  process.exit(failed ? 1 : 0);
}

for (const t of targets) {
  rmSync(t.out, { recursive: true, force: true });
  for (const [rel, buf] of t.want) {
    const to = join(t.out, rel);
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, buf);
  }
  console.log(
    `✓ wrote ${t.label} — ${skillCount(t.want)} skills, ${t.want.size} files, @nyuchi/mzizi-skills ${version}`,
  );
}
