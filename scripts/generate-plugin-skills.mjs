// Copy the published skills bundle into `skills/`, where the public `mzizi`
// Claude Code plugin (`.claude-plugin/plugin.json`, installed from this repo)
// finds them.
//
// WHY A COMMITTED COPY. A plugin installs from git, so its skills must be files
// in the repository: `node_modules/@nyuchi/mzizi-skills` is not in a clone.
// Skills are authored in mzizi-dev/agent-tools (`mzizi-skills/`), which is
// private, so this is the one public place a Claude Code user can install them
// from. The copy is build output in the same sense as
// `lib/skills.generated.ts`: one generator, one committed artifact, and a
// `--check` gate (CI's "generated artifacts" step) so it cannot drift from the
// `@nyuchi/mzizi-skills` version in package.json. Never edit `skills/` by hand;
// bump the dependency and regenerate.
//
// Every file under the package's `skills/` is copied byte for byte (SKILL.md
// plus anything a skill ships, such as mzizi-design's generated tokens), and
// anything in `skills/` that the package does not ship is removed.
//
// Usage:
//   node scripts/generate-plugin-skills.mjs           write skills/
//   node scripts/generate-plugin-skills.mjs --check   fail if stale (CI)

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
const OUT = join(ROOT, "skills");
const check = process.argv.includes("--check");

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

const want = new Map(walk(SRC).map((p) => [relative(SRC, p), readFileSync(p)]));
const have = new Map(walk(OUT).map((p) => [relative(OUT, p), readFileSync(p)]));

const stale = [];
for (const [rel, buf] of want) {
  if (!have.has(rel)) stale.push(`missing ${rel}`);
  else if (!have.get(rel).equals(buf)) stale.push(`differs ${rel}`);
}
for (const rel of have.keys()) if (!want.has(rel)) stale.push(`extra ${rel}`);

const skillCount = new Set([...want.keys()].map((rel) => rel.split(/[\\/]/)[0]))
  .size;

if (check) {
  if (stale.length) {
    console.error(
      `✗ skills/ does not match @nyuchi/mzizi-skills ${version} (${stale.length} file(s)):\n` +
        stale.map((s) => `  ${s}`).join("\n") +
        "\n  Run: node scripts/generate-plugin-skills.mjs",
    );
    process.exit(1);
  }
  console.log(
    `✓ skills/ matches @nyuchi/mzizi-skills ${version} — ${skillCount} skills, ${want.size} files`,
  );
  process.exit(0);
}

rmSync(OUT, { recursive: true, force: true });
for (const [rel, buf] of want) {
  const to = join(OUT, rel);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, buf);
}
console.log(
  `✓ wrote skills/ — ${skillCount} skills, ${want.size} files, @nyuchi/mzizi-skills ${version}`,
);
