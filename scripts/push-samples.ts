#!/usr/bin/env -S tsx
/**
 * Push the sample dataset into MongoDB.
 *
 *   pnpm samples:push           — upsert every sample document into `mzizi_samples`
 *   pnpm samples:push --check   — report what would change; write nothing
 *   pnpm samples:push --prune   — also delete documents no longer in `lib/samples/data.ts`
 *
 * WHY THE DIRECTION IS GIT → MONGO, AND ONLY THAT DIRECTION.
 *
 * `lib/samples/data.ts` is the source. This script projects it. Nothing reads back.
 *
 * That is not a hedge against MongoDB — the platform's real data lives there and this repo
 * does not second-guess it. It is about what KIND of thing the sample set is. Sample records
 * are authored: someone writes them, someone reviews them, and the reason a place has no
 * cover image is a decision recorded in a comment. Doctrine here is that anything a person
 * writes and another person should check belongs in a file where a diff can show it
 * (CLAUDE.md §15.1). Domain data — the 15,359 real places, the 23,231 articles — is the
 * opposite kind and belongs in Mongo, where it already is.
 *
 * So MongoDB gets FILLED, and it is not the authoring surface. Edit a document in
 * `mzizi_samples` directly and the next push overwrites it. That is correct: this is a
 * projection, and a projection nobody may edit is the one thing that cannot go stale.
 *
 * WHAT FILLING IT BUYS, WHICH SERVING JSON WOULD NOT.
 *
 * A consumer or an agent building against Mzizi can point a real MongoDB driver at
 * `mzizi_samples` and query documents in the production shape — same field names, same
 * nesting, same `bundu` trust block, same schema.org types. They write the query they will
 * ship, against data that renders in the components they will ship. That is the wiring
 * already being done; an HTTP fixture endpoint would not give it to them.
 *
 * The site itself does NOT read this. 1,179 pages prerender from the file, so a Mongo
 * outage can never empty the playground — see the note in `lib/samples/data.ts`.
 *
 * `MONGODB_URI` is required. There is no fallback and no "skip when unset": a push that
 * silently does nothing looks exactly like a push that worked.
 */

import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { MongoClient } from "mongodb"
import { sampleData } from "../lib/samples/data"

const DB = "mzizi_samples"

function loadEnvLocal() {
  const p = join(process.cwd(), ".env.local")
  if (!existsSync(p)) return
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
  }
}

async function main() {
  loadEnvLocal()
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error(
      "✖ MONGODB_URI is required.\n" +
        "  The sample set is projected INTO MongoDB; without a connection string there is\n" +
        "  nothing to project into. Set it in .env.local or the environment."
    )
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const check = args.includes("--check")
  const prune = args.includes("--prune")

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(DB)

  let upserted = 0
  let unchanged = 0
  let removed = 0

  try {
    for (const [collection, records] of Object.entries(sampleData)) {
      const col = db.collection(collection)
      const ids = new Set<string>()

      for (const record of records as Array<Record<string, unknown> & { _id: string }>) {
        ids.add(record._id)
        const existing = await col.findOne({ _id: record._id as never })
        // Compare the projection, not the stored document — Mongo adds nothing here, but a
        // future index or field would otherwise make every run report a change.
        const same = existing && JSON.stringify({ ...existing }) === JSON.stringify(record)
        if (same) {
          unchanged++
          continue
        }
        upserted++
        if (!check) {
          // `replaceOne`, not `updateOne` with `$set`. A `$set` leaves fields from a previous
          // version of the record in place, so removing a field from `data.ts` would never
          // remove it from the store — the document would drift further from the source with
          // every edit, which is the exact failure this whole direction exists to prevent.
          await col.replaceOne({ _id: record._id as never }, record, { upsert: true })
        }
      }

      if (prune) {
        const stale = await col.find({ _id: { $nin: [...ids] as never } }).toArray()
        removed += stale.length
        if (!check && stale.length > 0) {
          await col.deleteMany({ _id: { $nin: [...ids] as never } })
        }
      }
    }
  } finally {
    await client.close()
  }

  const verb = check ? "would write" : "wrote"
  console.log(
    `${check ? "→" : "✓"} ${DB}: ${verb} ${upserted} document(s), ${unchanged} unchanged` +
      (prune ? `, ${check ? "would remove" : "removed"} ${removed} stale` : "")
  )
  if (!prune && !check) {
    console.log("  (documents deleted from data.ts are left in place — re-run with --prune)")
  }
}

main().catch((err) => {
  console.error("✖ samples:push failed:", err)
  process.exit(1)
})
