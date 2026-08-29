import { defineCloudflareConfig } from "@opennextjs/cloudflare"

/**
 * OpenNext → Cloudflare Workers.
 *
 * This is the deployment half of moving mzizi.dev off Vercel. The application
 * half is already done: nothing in `lib/` or `app/` reads the filesystem at
 * request time any more, which is what made a Worker possible at all. Skills,
 * doctrine, the registry index and every component's source are inlined at
 * build time (see the four `scripts/generate-*.mjs`).
 *
 * WHY OPENNEXT RATHER THAN A REWRITE. The Astro migration is the destination,
 * and it is gated on ~425 Rust components that do not exist yet. Waiting for it
 * means staying on Vercel for as long as that takes. OpenNext moves the hosting
 * now and leaves the rewrite to happen on Cloudflare rather than as a
 * prerequisite for getting there.
 *
 * VERSION FLOOR, verified rather than assumed: `@opennextjs/cloudflare@1.20.4`
 * declares `next: ">=15.5.24 <16 || >=16.3.3"`. This app was on 16.2.12 — inside
 * the excluded gap between those ranges — so the Next bump to 16.3.3 is a
 * prerequisite of this file existing, not an unrelated upgrade. 16.3.3 is
 * currently the only published version at or above that floor.
 *
 * Caching is left at the default (no incremental cache) deliberately. Adding R2
 * or KV incremental caching is a real improvement and a separate decision with
 * its own bindings and cost; turning it on in the same change that moves the
 * host would make a regression impossible to attribute.
 */
export default defineCloudflareConfig()
