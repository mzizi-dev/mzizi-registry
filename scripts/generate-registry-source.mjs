// Inline every component's SOURCE into `lib/registry-source.generated.json`.
//
// WHY. `lib/registry-source.ts` reads component files with `readFileSync` at
// request time. It is the last filesystem reader in this app's read path, and
// Cloudflare Workers has no filesystem.
//
// WHY INLINED RATHER THAN SERVED FROM STATIC ASSETS. Static Assets is the shape
// these files arguably want — they are static, served by path. It was rejected
// for now on two grounds, both practical:
//
//   1. It needs an assets binding, which only exists once the Worker does.
//      Building against a binding that is not there yet means writing code no
//      test can exercise.
//   2. It makes every read async. All five call sites are currently sync; three
//      are React server components where that is survivable and two are route
//      handlers where it is trivial — but it is still five call sites changed
//      for a benefit that is invisible until the bundle is near its limit.
//
// The whole corpus is ~0.6 MB gzipped, comfortably inside the Worker script
// limit, so inlining costs budget that is available and buys a change with no
// call-site churn. If the bundle later gets tight, Static Assets is the move,
// and this generator is where it changes.
//
// JSON rather than a .ts module on purpose: `registry.json` (1.1 MB) is already
// imported this way, a JSON import parses faster than an equivalent object
// literal, and it keeps a multi-megabyte artifact out of the TypeScript program.
//
// Usage:
//   node scripts/generate-registry-source.mjs           write the artifact
//   node scripts/generate-registry-source.mjs --check   fail if stale (CI)

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs"
import { join } from "node:path"

const ROOT = join(process.cwd(), "components", "registry")
const OUT = join(process.cwd(), "lib", "registry-source.generated.json")
const check = process.argv.includes("--check")

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

if (!existsSync(ROOT)) fail(`no registry tree at ${ROOT}`)

/** `<node-dir>/<file>` → file contents. Keys match REGISTRY_FILES exactly. */
const sources = {}
let bytes = 0

for (const dir of readdirSync(ROOT).sort()) {
  const dirPath = join(ROOT, dir)
  if (!statSync(dirPath).isDirectory()) continue
  for (const file of readdirSync(dirPath).sort()) {
    const filePath = join(dirPath, file)
    if (!statSync(filePath).isFile()) continue
    const text = readFileSync(filePath, "utf8")
    sources[`${dir}/${file}`] = text
    bytes += text.length
  }
}

const count = Object.keys(sources).length
if (count === 0) fail("registry tree contains no files")

// Stable key order so the artifact is reproducible and diffs stay readable.
const ordered = {}
for (const k of Object.keys(sources).sort()) ordered[k] = sources[k]
const content = JSON.stringify(ordered, null, 2) + "\n"

if (check) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : ""
  if (current !== content) {
    fail(
      "lib/registry-source.generated.json is stale against components/registry/. " +
        "Run `pnpm registry:source` and commit the result."
    )
  }
  console.log(`✓ generated registry source matches the tree (${count} files)`)
} else {
  writeFileSync(OUT, content)
  console.log(
    `✓ wrote lib/registry-source.generated.json — ${count} files, ${(bytes / 1048576).toFixed(1)} MB of source`
  )
}
