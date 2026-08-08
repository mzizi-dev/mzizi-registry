#!/usr/bin/env node
/**
 * Render pages through Cloudflare Kitesurf and assert they actually painted.
 *
 *   pnpm browser:check                                  # the default route set
 *   pnpm browser:check --base http://localhost:11736    # against a dev server
 *   pnpm browser:check /changelog/button                # one route
 *   pnpm browser:check --text /components/button        # dump what the page rendered
 *
 * WHY THIS EXISTS, AND WHY NOTHING OFFLINE REPLACES IT.
 *
 * `/changelog/{name}` served page chrome with **no article body** in production.
 * Every gate was green — typecheck, lint, tests, build — and the route answered
 * HTTP 200 with ~140 KB of HTML. The failure was `new Date(undefined)
 * .toISOString()` throwing inside the article, which React swallowed into an
 * empty region while the header, sidebar and footer rendered around it.
 *
 * A status code says 200 and a byte count says 140 KB. Both are true, and both
 * are useless. The only thing that separates "the page works" from "the page is
 * a frame around a hole" is rendering it and looking for content that should be
 * there.
 *
 * WHY KITESURF RATHER THAN PLAYWRIGHT.
 *
 * fundi is a Cloudflare Worker. It cannot spawn a browser process, so a
 * Playwright checker would serve developers and be useless to the agent that
 * most needs it. Browser Run is a `fetch` call, so the same check runs from a
 * laptop, from CI, and from inside fundi's heal loop — see
 * `docs/browser-checks.md` for the Worker binding, which needs no API token.
 * Kitesurf because it is 3-7x lighter than Chromium and this needs text, not
 * pixels.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY `/markdown` AND NOT `/content` + AN HTML PARSER.
 *
 * The first version fetched raw HTML and extracted the text here. That is a
 * whole class of bug this does not need to own, and it hit two of them before
 * getting one green run:
 *
 * 1. It read `<main>`. On this site `<main>` wraps the SIDEBAR — the button
 *    page's real content sits outside it, and `</main>` closes at character
 *    61,535 of 140,113. Every page therefore reported ~600 characters of
 *    identical navigation text and a green tick. Five very different pages
 *    agreeing to within 11 characters was the tell.
 *
 * 2. It stripped tags with `/<[^>]+>/g`. Tailwind arbitrary variants contain
 *    `>` inside attribute values — `class="[&>svg]:size-4"` — so the regex cut
 *    in the wrong place and leaked class names into the "visible text". Same
 *    family as the `=>` trap in `extract-props.ts`.
 *
 * `/markdown` extracts in the browser's own context and returns prose, so both
 * disappear, the dependency goes with them, and a Worker gets the identical
 * result with no parsing library at all. `/scrape` and `/links` would also have
 * done, but Kitesurf answers `Action "scrape" is not supported by the kitesurf
 * browser` — only a subset of Quick Actions works on it. `/markdown`,
 * `/content`, `/screenshot` and `/accessibilityTree` do.
 *
 * THE FRONTMATTER STRIP IS LOAD-BEARING, NOT TIDYING.
 *
 * `/markdown` prefixes a YAML block carrying the page's `<meta>` tags —
 * including `description`. Two of the five expectations below are satisfied by
 * that block alone, so matching against the raw response would green-tick a
 * page whose body rendered nothing: the exact failure this exists to catch,
 * reintroduced through the front door. Only the body is searched.
 *
 * A THRESHOLD IS NOT AN ASSERTION.
 *
 * The first version also measured text LENGTH, which cannot tell content from
 * chrome and so passed navigation. Each route names a string only its own body
 * produces.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHAT THIS DELIBERATELY DOES NOT DO.
 *
 * No contrast or colour assertions. Kitesurf trades CSS exactness for cost, so
 * a computed style from it cannot gate an APCA floor. Rendered-or-not is a
 * binary it can answer; "is this colour exactly right" is not.
 *
 * No assertions on the live component previews either. Those mount client-side
 * and Kitesurf returns before they resolve, so every page shows
 * "Loading preview…". That is a limit of this check, not a defect on the page —
 * asserting on it would produce a failure nobody can fix.
 */

import { argv, env, exit } from "node:process"

const ACCOUNT = env.CLOUDFLARE_ACCOUNT_ID ?? "125a2dfbc21f76a25c980609609e8218"
const TOKEN = env.CLOUDFLARE_API_TOKEN ?? ""
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/browser-rendering`

/**
 * Route -> a string only that route's own BODY can produce.
 *
 * Each one is content the page reads from data — a `meta.features` entry from
 * `registry.json`, a version row, a mineral name, a rendered headline. Chrome
 * cannot satisfy any of them, which is the property a length threshold lacked.
 *
 * `/tokens` is lowercase on purpose: §7.2 makes every wordmark lowercase and
 * the page renders "malachite". A capitalised expectation here failed against a
 * page that was rendering perfectly — a brittle assertion reports its author's
 * assumption as the site's defect.
 */
const ROUTES = [
  // A `meta.features` entry — served from registry.json, rendered by the detail body.
  { path: "/components/button", expect: "Polymorphic rendering via asChild" },
  // The oldest version row. `/changelog/{name}` is the route that shipped empty.
  { path: "/changelog/button", expect: "backfilled from existing design system" },
  // A mineral name out of the live palette.
  { path: "/tokens", expect: "malachite" },
  // The helix headline — doctrine, and read live from component_documents.
  { path: "/architecture", expect: "Two backbones. Cross-cutting rungs. No axes." },
  // The Ubuntu line on the landing hero.
  { path: "/", expect: "Ndiri nekuti tiri" },
]

/** Drop the `<meta>`-derived YAML block `/markdown` prepends. See the header. */
function body(markdown) {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, "")
}

async function render(url) {
  const res = await fetch(`${API}/markdown?browser=kitesurf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  const payload = await res.json().catch(() => null)
  if (!res.ok || !payload?.success) {
    const detail = payload?.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`
    return { ok: false, detail }
  }
  return { ok: true, text: body(String(payload.result ?? "")) }
}

async function main() {
  const args = argv.slice(2)
  const dumpText = args.includes("--text")
  const baseAt = args.indexOf("--base")
  const base = (baseAt !== -1 ? args[baseAt + 1] : "https://mzizi.dev").replace(/\/$/, "")
  const only = args.filter((a, i) => !a.startsWith("--") && !(baseAt !== -1 && i === baseAt + 1))
  const targets = only.length ? ROUTES.filter((r) => only.includes(r.path)) : ROUTES

  if (only.length && targets.length === 0) {
    console.error(`No known route among: ${only.join(", ")}`)
    console.error(`Known routes: ${ROUTES.map((r) => r.path).join(", ")}`)
    console.error("A route needs an `expect` string here before it can be checked.")
    exit(1)
  }

  if (!TOKEN) {
    // A loud skip, not a silent pass. There is no offline version of "did the
    // browser paint it", so this cannot be made non-fatal by moving work
    // around. What it must not do is look like a green run.
    console.error("⊘ CLOUDFLARE_API_TOKEN is not set — SKIPPING the render check.")
    console.error("  This is the only gate that catches a page rendering empty.")
    console.error("  Needs a token with the `Browser Rendering - Edit` permission.")
    exit(0)
  }

  let failed = 0
  for (const route of targets) {
    const result = await render(base + route.path)
    if (!result.ok) {
      console.error(`✗ ${route.path}\n    render failed: ${result.detail}`)
      failed++
      continue
    }
    if (dumpText) {
      console.log(`\n──── ${route.path} (${result.text.length} chars) ────\n${result.text}`)
      continue
    }
    if (!result.text.includes(route.expect)) {
      console.error(
        `✗ ${route.path}\n    rendered ${result.text.length} chars of prose, but not ` +
          `${JSON.stringify(route.expect)}.\n` +
          `    That is the chrome-around-a-hole shape: the frame rendered, its content did not.\n` +
          `    \`pnpm browser:check --text ${route.path}\` shows what it did render.`
      )
      failed++
      continue
    }
    console.log(
      `✓ ${route.path}  found ${JSON.stringify(route.expect)} (${result.text.length} chars)`
    )
  }

  if (dumpText) return
  if (failed > 0) {
    console.error(`\n${failed} of ${targets.length} route(s) did not render their content.`)
    exit(1)
  }
  console.log(`\nAll ${targets.length} route(s) rendered their content.`)
}

main().catch((err) => {
  console.error("kitesurf: " + (err?.message ?? String(err)))
  exit(1)
})
