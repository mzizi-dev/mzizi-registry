// @vitest-environment node
// Runs scripts/generate-changelog.mjs as a process — must run in Node.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * The staleness gate in `changelog:generate --check` compares `package.json`'s
 * version with the newest record in `content/changelog/releases.json`.
 *
 * It must fail when `package.json` is AHEAD (a version bump with no release
 * record) and must pass when the record is ahead. The second case is `staging`
 * after a sync-back: the record comes back from `main`, but the org's release
 * version check lets a pull request into `staging` write only the next patch,
 * so `package.json` keeps staging's version. When the gate required equality,
 * the two required checks contradicted each other (#680, #687, #689).
 *
 * Each case runs the real script in a scratch directory holding a copy of the
 * repo's release records, with only `package.json`'s version changed.
 */

const repo = path.resolve(__dirname, "..");
const script = path.join(repo, "scripts", "generate-changelog.mjs");
const releases = JSON.parse(
  fs.readFileSync(
    path.join(repo, "content", "changelog", "releases.json"),
    "utf8",
  ),
) as Array<{ version: string }>;
const newest = releases[0].version;

let scratch: string;

beforeAll(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), "changelog-gate-"));
  fs.mkdirSync(path.join(scratch, "content", "changelog"), { recursive: true });
  fs.mkdirSync(path.join(scratch, "lib"), { recursive: true });
  for (const rel of [
    "content/changelog/releases.json",
    "lib/changelog.generated.ts",
    ".prettierrc",
  ]) {
    const from = path.join(repo, rel);
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(scratch, rel));
  }
});

afterAll(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

function runGate(version: string) {
  fs.writeFileSync(
    path.join(scratch, "package.json"),
    JSON.stringify({ version }) + "\n",
  );
  return spawnSync(process.execPath, [script, "--check"], {
    cwd: scratch,
    encoding: "utf8",
  });
}

function bump(version: string, part: 0 | 1 | 2, by: number) {
  const parts = version.split(".").map(Number);
  parts[part] += by;
  for (let i = part + 1; i < 3; i++) parts[i] = 0;
  return parts.join(".");
}

describe("changelog:generate --check staleness gate", () => {
  it("passes when package.json equals the newest record", () => {
    expect(runGate(newest).status).toBe(0);
  });

  it("passes when the newest record is ahead of package.json (staging after a sync-back)", () => {
    const [major, minor] = newest.split(".").map(Number);
    expect(minor).toBeGreaterThan(0);
    expect(runGate(`${major}.${minor - 1}.0`).status).toBe(0);
  });

  it("fails when package.json is a minor ahead of the newest record", () => {
    const result = runGate(bump(newest, 1, 1));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Add the release record");
  });

  it("compares numerically, so a two-digit patch is ahead of a one-digit one", () => {
    const [major, minor, patch] = newest.split(".").map(Number);
    const result = runGate(`${major}.${minor}.${patch + 10}`);
    expect(result.status).toBe(1);
  });

  it("fails on a package.json version that is not MAJOR.MINOR.PATCH", () => {
    const result = runGate("not-a-version");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("is not MAJOR.MINOR.PATCH");
  });
});
