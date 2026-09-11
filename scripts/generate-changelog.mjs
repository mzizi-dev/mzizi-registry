// Inline `content/changelog/releases.json` into `lib/changelog.generated.ts`.
//
// WHY. `/api/v1/changelog` read the Supabase `releases` view. Under the
// owner's ruling the registry has no database going forwards — everything is
// from disk — so the release history moves into the repo, where a diff and a
// reviewer can see it. `docs/db-contents-rule.md` had carved out "version
// history" as legitimate database content; that carve-out is superseded.
//
// WHY A JSON SEED AND NOT `CHANGELOG.md` + GIT TAGS. That was the first choice
// and it was tried. It cannot work here, and the numbers are not close:
//
//   - This repository has ZERO git tags. `git tag` returns nothing, so there is
//     no tag history to read a release date, a version or an ordering from.
//   - `CHANGELOG.md` carries five `##` headings, of which three are versions:
//     `4.0.26`, `4.0.1` and `6.0.0`. The release history carries 64 records
//     across 55 distinct versions. The intersection is ONE version — `4.0.26`.
//     `4.0.1` and `6.0.0` are not in the history at all.
//   - Of the 27 fields `/api/v1/changelog` serves, `CHANGELOG.md` contains a
//     recognisable form of about five. `line`, `line_rank`, `major`, `minor`,
//     `patch`, `release_kind`, `breaking`, `components_touched`,
//     `nodes_affected`, `components_{added,modified,deprecated,removed}`,
//     `tools_{added,modified,deprecated,removed}`, `linked_issues`,
//     `total_stable`, `total_deprecated`, `total_alpha`, `released_at`,
//     `created_at` and `changed_by` appear nowhere in the markdown in any form.
//
// A generator over `CHANGELOG.md` would therefore reproduce one record in
// sixty-four and would have to invent the other twenty-two fields.
// `/api/v1/changelog` would stop being the same endpoint.
//
// So `CHANGELOG.md` stays what it is — the human narrative — and this file is
// the machine-readable release record the API serves. The staleness that a
// plain dump invites is closed by a gate rather than by hope: the check below
// fails when `package.json`'s version is not the newest release here, so
// shipping a version bump without a release record breaks CI.
//
// WHAT IS GENERATED. The raw records, untouched. No sorting, no reshaping, no
// derived fields: the route serves the array in the order it appears here, and
// that order is the one the `releases` view served in production. A generator
// that sorted would be a second opinion about ordering competing with the seed,
// and the two would drift.
//
// Usage:
//   node scripts/generate-changelog.mjs           write the module
//   node scripts/generate-changelog.mjs --check   fail if stale (CI)

import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import prettier from "prettier"

const SRC = join(process.cwd(), "content", "changelog", "releases.json")
const OUT = join(process.cwd(), "lib", "changelog.generated.ts")
const check = process.argv.includes("--check")

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (!existsSync(SRC)) fail(`no release seed at ${SRC}`)

let releases
try {
  releases = JSON.parse(readFileSync(SRC, "utf8"))
} catch (error) {
  fail(`content/changelog/releases.json is not valid JSON: ${error.message}`)
}

if (!Array.isArray(releases)) fail("content/changelog/releases.json must be a JSON array")
if (releases.length === 0) fail("content/changelog/releases.json is empty")

// Every record must carry the full field set. A record missing a field would
// serve `undefined`, which `JSON.stringify` drops silently — the API would lose
// a key and nothing would say so. Nulls are fine and expected; absent keys are
// not. The reference shape is the first record's keys.
const expected = Object.keys(releases[0]).sort()
releases.forEach((entry, i) => {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    fail(`release ${i} is not an object`)
  }
  const actual = Object.keys(entry).sort()
  if (actual.join(",") !== expected.join(",")) {
    const missing = expected.filter((k) => !actual.includes(k))
    const extra = actual.filter((k) => !expected.includes(k))
    fail(
      `release ${i} (${entry.version ?? "unversioned"}) has a different field set than release 0` +
        (missing.length ? ` — missing: ${missing.join(", ")}` : "") +
        (extra.length ? ` — unexpected: ${extra.join(", ")}` : "")
    )
  }
  if (typeof entry.version !== "string" || entry.version.length === 0) {
    fail(`release ${i} has no version string`)
  }
})

// The staleness gate. The release history is ordered newest-first — that is the
// order the API serves and the order the `releases` view carried — so the head
// of the array is the current release, and it must be the version this package
// claims to be. Bump `package.json` without writing the release record and this
// fails, which is precisely the failure mode a committed record is accused of
// hiding.
const declared = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")).version
if (releases[0].version !== declared) {
  fail(
    `package.json is version ${declared} but the newest release in ` +
      `content/changelog/releases.json is ${releases[0].version}. ` +
      `Add the release record for ${declared} (newest first) and re-run.`
  )
}

const raw = `/**
 * GENERATED by scripts/generate-changelog.mjs — do not edit.
 *
 * The release history, inlined from \`content/changelog/releases.json\`. This is
 * what \`/api/v1/changelog\` and \`/api/v1/changelog/[version]\` serve; there is no
 * database read behind either any more.
 *
 * Inlined rather than read with \`readFileSync\` for the same reason the doctrine
 * is: Cloudflare Workers has no request-time filesystem.
 *
 * Add a release by editing \`content/changelog/releases.json\` and running
 * \`pnpm changelog:generate\`; \`pnpm changelog:generate:check\` is the CI gate.
 */

import type { ChangelogRow } from "@/lib/db/types"

export const CHANGELOG_RELEASES: readonly ChangelogRow[] =
  ${JSON.stringify(releases, null, 2)} as unknown as readonly ChangelogRow[]
`

const config = await prettier.resolveConfig(OUT)
const content = await prettier.format(raw, { ...config, filepath: OUT })

if (check) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : ""
  if (current !== content) {
    fail(
      "lib/changelog.generated.ts is stale against content/changelog/releases.json. " +
        "Run `pnpm changelog:generate` and commit the result."
    )
  }
  console.log(`✓ generated changelog matches the seed (${releases.length} releases)`)
} else {
  writeFileSync(OUT, content)
  console.log(`✓ wrote lib/changelog.generated.ts — ${releases.length} releases`)
}
