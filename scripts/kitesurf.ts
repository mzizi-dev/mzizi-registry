#!/usr/bin/env -S tsx
/**
 * Render pages through Cloudflare Kitesurf, assert they actually painted, and
 * report the run to N8 assurance over OTLP.
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
 * THIS IS AN N8 PROBE RUNNER, NOT A STANDALONE SCRIPT.
 *
 * `mzizi-synthetic-probe` (N8) already declared this contract — `SyntheticJourney`,
 * `ProbeStep`, `ProbeResult`, `onResult`/`onAlert` — and its body says, in as many
 * words, "here we define the contract that the probe runner implements". The first
 * version of this file ignored all of it and printed to a console, so a render
 * failure was seen by whoever ran the command and by nothing else. It now produces
 * a `ProbeResult` and ships it through `mzizi-otel`, which is what makes the signal
 * reach the rung that acts on it.
 *
 * That component's comment also says the runner "would use Puppeteer/Playwright".
 * It cannot: **fundi is a Cloudflare Worker and cannot spawn a browser process.**
 * Browser Run is a `fetch`, so the same check runs from a laptop, from CI, and
 * from inside fundi's heal loop — from a Worker via `env.BROWSER.quickAction()`,
 * which needs no API token. Kitesurf because it is 3-7x lighter than Chromium and
 * this needs text, not pixels. See `docs/browser-checks.md`.
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
import { exportProbeResult } from "@/components/registry/n8-assurance/mzizi-otel"
import type { ProbeResult } from "@/components/registry/n8-assurance/mzizi-synthetic-probe"

const ACCOUNT = env.CLOUDFLARE_ACCOUNT_ID ?? "125a2dfbc21f76a25c980609609e8218"
const TOKEN = env.CLOUDFLARE_API_TOKEN ?? ""
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/browser-rendering`

/** The journey id every run reports under. A collector groups on this. */
const JOURNEY_ID = "mzizi-browser-render"

interface Route {
  path: string
  expect: string
}

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
const ROUTES: Route[] = [
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
function body(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, "")
}

/**
 * On a failure, tell "the page rendered empty" apart from "you were never
 * looking at the page".
 *
 * Pointing `--base` at a Vercel preview renders **Vercel's login page** — the
 * deployment sits behind SSO, so `/tokens` 302s off-origin and the browser
 * faithfully returns 2,035 characters of "Log in to Vercel". The expectation
 * then fails and, without this, the script reports the chrome-around-a-hole
 * message: the checker blaming the site for the checker's own problem. That is
 * the same mistake as expecting a capitalised `Malachite`, and it is worth
 * catching in code rather than in a doc nobody reads mid-debugging.
 *
 * An off-origin redirect is the general signal — it covers Vercel SSO,
 * Cloudflare Access and any other auth wall without naming a vendor. A
 * same-origin redirect is not reported, because this site has legitimate ones
 * (`/architecture/layers/:n` → `/architecture/nodes/:n`).
 *
 * Only runs on failure, so the happy path still costs one request per route.
 * Best-effort: a probe that itself fails must not replace the real result.
 */
async function diagnose(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "manual" })
    const location = res.headers.get("location")
    if (location) {
      const target = new URL(location, url)
      if (target.origin !== new URL(url).origin) {
        return (
          `the URL redirects off-origin to ${target.origin}, so the browser rendered ` +
          `that page rather than this route — an auth wall (Vercel SSO, Cloudflare ` +
          `Access, …), not an empty page. This route cannot be checked without a bypass token.`
        )
      }
    }
    if (!res.ok && res.status < 300) return `the URL answers HTTP ${res.status}.`
  } catch {
    // A failed probe is not evidence of anything; fall through to the plain report.
  }
  return null
}

type RenderResult = { ok: true; text: string } | { ok: false; detail: string }

async function render(url: string): Promise<RenderResult> {
  const res = await fetch(`${API}/markdown?browser=kitesurf`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  const payload = (await res.json().catch(() => null)) as {
    success?: boolean
    result?: string
    errors?: { message: string }[]
  } | null
  if (!res.ok || !payload?.success) {
    const detail = payload?.errors?.map((e) => e.message).join("; ") ?? `HTTP ${res.status}`
    return { ok: false, detail }
  }
  return { ok: true, text: body(String(payload.result ?? "")) }
}

/**
 * Ship the run to N8 assurance.
 *
 * Reporting NEVER changes the exit code. A run that "failed" because a collector
 * was unreachable would manufacture an incident out of an exporter outage, which
 * is the opposite of what an assurance signal is for. The outcome is printed so
 * a silent no-export is visible, and then ignored.
 *
 * With no collector configured this is inert — which is the normal case today,
 * because the ecosystem does not run one yet. `docs/browser-checks.md` records
 * that, rather than this pretending to emit somewhere.
 */
async function report(result: ProbeResult, base: string): Promise<void> {
  const outcome = await exportProbeResult(
    result,
    {
      serviceName: "mzizi-browser-check",
      environment: base.includes("localhost") ? "local" : "production",
      // Endpoint comes from OTEL_EXPORTER_OTLP_ENDPOINT. No default: sending a
      // consumer's telemetry to an address they never chose is not a default.
    },
    { "mzizi.check": "browser-render", "url.base": base }
  )

  if (outcome.exported) {
    console.log(`⇡ reported ${outcome.spanCount} spans to OTLP (trace ${outcome.traceId})`)
  } else {
    console.log(`⇡ not reported — ${outcome.reason}`)
  }
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

  const runStart = Date.now()
  const steps: ProbeResult["steps"] = []
  let failed = 0

  for (const route of targets) {
    const stepStart = Date.now()
    const result = await render(base + route.path)
    const durationMs = Date.now() - stepStart

    if (!result.ok) {
      console.error(`✗ ${route.path}\n    render failed: ${result.detail}`)
      steps.push({
        description: route.path,
        status: "fail",
        durationMs,
        error: `render failed: ${result.detail}`,
      })
      failed++
      continue
    }

    if (dumpText) {
      console.log(`\n──── ${route.path} (${result.text.length} chars) ────\n${result.text}`)
      continue
    }

    if (!result.text.includes(route.expect)) {
      const reason = await diagnose(base + route.path)
      const detail = reason
        ? `NOT a rendering failure — ${reason}`
        : `That is the chrome-around-a-hole shape: the frame rendered, its content did not.`
      console.error(
        `✗ ${route.path}\n    rendered ${result.text.length} chars of prose, but not ` +
          `${JSON.stringify(route.expect)}.\n    ${detail}\n` +
          `    \`pnpm browser:check --text ${route.path}\` shows what it did render.`
      )
      steps.push({
        description: route.path,
        status: "fail",
        durationMs,
        error: `missing ${JSON.stringify(route.expect)} — ${detail}`,
      })
      failed++
      continue
    }

    console.log(
      `✓ ${route.path}  found ${JSON.stringify(route.expect)} (${result.text.length} chars)`
    )
    steps.push({ description: route.path, status: "pass", durationMs })
  }

  // `--text` is a debugging dump, not a run. Reporting it would put a probe
  // result on the bus for something that asserted nothing.
  if (dumpText) return

  const probe: ProbeResult = {
    journeyId: JOURNEY_ID,
    timestamp: new Date(runStart).toISOString(),
    // Browser Run picks the edge location; this process only knows it did not
    // choose one. Claiming a region we did not measure would be worse than
    // saying so.
    region: "cloudflare-edge",
    status: failed > 0 ? "fail" : "pass",
    durationMs: Date.now() - runStart,
    steps,
  }
  await report(probe, base)

  if (failed > 0) {
    console.error(`\n${failed} of ${targets.length} route(s) did not render their content.`)
    exit(1)
  }
  console.log(`\nAll ${targets.length} route(s) rendered their content.`)
}

main().catch((err) => {
  console.error("kitesurf: " + (err instanceof Error ? err.message : String(err)))
  exit(1)
})
