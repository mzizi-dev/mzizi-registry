# Browser checks — proving a page actually rendered

`pnpm browser:check` renders pages through [Kitesurf](https://developers.cloudflare.com/browser-run/kitesurf/)
and asserts each one produced its own content. `scripts/kitesurf.mjs` is the whole
implementation; this file is the why, the dev setup, and how fundi runs the same
check from a Worker.

## The gap it closes

`/changelog/{name}` served page chrome with **no article body** in production.
Every gate was green — typecheck, lint, tests, build — and the route answered
HTTP 200 with ~140 KB of HTML. The failure was `new Date(undefined).toISOString()`
throwing inside the article, which React swallowed into an empty region while the
header, sidebar and footer rendered around it.

A status code says 200. A byte count says 140 KB. Both were true and neither was
useful. Nothing in the repo asked the only question that separates "the page
works" from "the page is a frame around a hole": **render it and look for content
that should be there.**

That question cannot be answered offline. A unit test renders a component in
jsdom, not the deployed page; `pnpm build` proves the route compiles, not that it
paints. So this check needs a real browser, and it is the only gate of its kind
here.

## Dev setup

```bash
export CLOUDFLARE_API_TOKEN=...        # Browser Rendering - Edit permission
export CLOUDFLARE_ACCOUNT_ID=...       # optional; the script defaults to Nyuchi's

pnpm browser:check                                 # the default route set
pnpm browser:check --base http://localhost:11736   # against a dev server
pnpm browser:check /changelog/button               # one route
pnpm browser:check --text /components/button       # dump what the page rendered
```

**Without a token it skips loudly and exits 0.** That is deliberate: there is no
offline substitute, so the alternatives are "skip visibly" or "fail every
contributor who has no Cloudflare token". What it must never do is _look_ like a
green run — the skip prints what was not checked and why.

`--text` is the debugging tool. When an expectation fails, the answer is almost
always in what the page rendered instead, and dumping it takes one command.

**`--base` against a Vercel preview does not work, and the script says so.**
Preview deployments sit behind Vercel SSO, so the route 302s off-origin and the
browser faithfully renders 2,035 characters of "Log in to Vercel". Left alone the
check would report `its content did not render` — the checker blaming the site
for the checker's own problem, which is the same mistake as expecting a
capitalised `Malachite`. On failure it now probes for an off-origin redirect and
reports the real cause instead:

```
✗ /tokens
    rendered 2035 chars of prose, but not "malachite".
    NOT a rendering failure — the URL redirects off-origin to https://vercel.com,
    so the browser rendered that page rather than this route — an auth wall
    (Vercel SSO, Cloudflare Access, …), not an empty page.
```

An off-origin redirect is the general signal, so this covers Cloudflare Access
and anything else without naming a vendor. Same-origin redirects are not
reported, because this site has legitimate ones
(`/architecture/layers/:n` → `/architecture/nodes/:n`). The probe only runs on
failure, so the happy path still costs one request per route.

Checking a protected preview needs a bypass token
(`VERCEL_AUTOMATION_BYPASS_SECRET`), which is why the practical targets today are
production and a local dev server.

Kitesurf is in free beta and uses 3–7× less CPU and memory than Chromium for
exactly this kind of task. It is not pixel-perfect, which does not matter here —
see _What this does not check_.

## Adding a route

Each entry in `ROUTES` names a string **only that route's own body can produce**:

```js
{ path: "/components/button", expect: "Polymorphic rendering via asChild" },
```

Pick content the page reads from data — a `meta.features` entry from
`registry.json`, a version row, a mineral name, a rendered headline. Three things
that look like reasonable expectations and are not:

- **A text-length threshold.** The first version used one, and it green-ticked
  navigation on all five routes. A threshold cannot tell content from chrome.
- **Anything in the page's `<meta>` description.** `/markdown` prefixes a YAML
  block built from the meta tags, and two of the five current expectations appear
  in it. The script strips that block before matching; an expectation that only
  exists there would pass against a page that rendered nothing.
- **A capitalised wordmark.** §7.2 makes them lowercase — the page renders
  `malachite`. Expecting `Malachite` failed against a page that was rendering
  perfectly, which is a brittle assertion reporting its author's assumption as
  the site's defect.

## Which Quick Action, and why

`/markdown`. It extracts prose in the browser's own context, so the script does
no HTML parsing at all — which removed both bugs the first version shipped with:

1. It read `<main>`. On this site `<main>` wraps the **sidebar**; the button
   page's real content sits outside it and `</main>` closes at character 61,535
   of 140,113. Every page reported ~600 characters of identical navigation and a
   green tick. Five very different pages agreeing to within 11 characters was
   the tell.
2. It stripped tags with `/<[^>]+>/g`. Tailwind arbitrary variants put `>` inside
   attribute values — `class="[&>svg]:size-4"` — so the regex cut in the wrong
   place and leaked class names into the "visible text". Same family as the `=>`
   trap documented in `scripts/extract-props.ts`.

Both were self-inflicted, and neither can recur when the extraction happens
server-side. It also means the script has **zero dependencies**, and a Worker
gets the identical result with no parsing library.

Kitesurf supports a subset of Quick Actions. Verified against `mzizi.dev`:

| Action               | Kitesurf                                                   |
| -------------------- | ---------------------------------------------------------- |
| `/markdown`          | works                                                      |
| `/content`           | works                                                      |
| `/accessibilityTree` | works                                                      |
| `/screenshot`        | works                                                      |
| `/scrape`            | `Action "scrape" is not supported by the kitesurf browser` |
| `/links`             | same refusal                                               |

If a future check needs `/scrape` or `/links`, drop `?browser=kitesurf` for that
call and pay for Chromium — do not assume the refusal is a transient error.

## Running it from fundi

fundi is a Cloudflare Worker. It cannot spawn a browser process, so a Playwright
checker would serve developers and be useless to the agent that most needs it.
**This is the reason the check is a `fetch` and not a local browser** — the same
capability is reachable from a laptop, from CI, and from inside the heal loop.

From a Worker, use the binding rather than the REST API: it needs **no API
token**, does not leave Cloudflare's network, and is lower latency.

```jsonc
// fundi/wrangler.jsonc
{
  "browser": { "binding": "BROWSER" },
}
```

```ts
const md = await env.BROWSER.quickAction("markdown", { url })
const body = md.replace(/^---\n[\s\S]*?\n---\n/, "") // same frontmatter strip
```

Three constraints, each verified rather than assumed:

- **`quickAction()` needs `compatibility_date >= 2026-03-24`.** `fundi-tester` is
  on `2026-05-22`, so it already qualifies — no bump, no flag.
- **It does not work under plain `wrangler dev`.** Local mode answers
  `The RPC receiver does not implement the method "quickAction"`. Use
  `wrangler dev --remote`, or set `"remote": true` on the binding.
- **The binding has no `?browser=kitesurf` query string.** The REST path opts in
  through the URL; check the binding's own options before assuming a Worker call
  gets Kitesurf rather than Chromium. The check works either way — this only
  affects cost.

What this buys the N9 rung: fundi currently files issues from observability
events, which means it learns about a broken page only when something throws
_and_ the throw is reported. A render check is a signal it can generate itself —
"this route stopped producing its content" is a diagnostic no error-boundary
beacon emits, because the failing page did not error, it rendered empty.

## Reporting back — this is an N8 probe, not a console tool

> **Source of truth:** `docs/n8-telemetry.md`.

The first version printed to a console and exited non-zero, so a render failure
was seen by whoever ran the command and by nothing else. `mzizi-synthetic-probe`
(N8) had already declared the contract it should have implemented — down to
saying in its own body _"here we define the contract that the probe runner
implements."_

Each run now produces a `ProbeResult` and ships it through `mzizi-otel` as OTLP:
one INTERNAL span for the run, one CLIENT child per route, `status.code = 2`
(ERROR) on the run and on each failing route.

```
✓ /tokens  found "malachite" (6665 chars)
⇡ reported 2 spans to OTLP (trace ed6ba19310dbe8e04cf0a037fc06b36e)
```

OTLP rather than a Mzizi endpoint because a signal only fundi can read is a
signal only fundi can act on — any collector, backend or agent that speaks
OpenTelemetry can subscribe instead.

Two rules worth repeating here:

- **Reporting never changes the exit code.** A run that "failed" because a
  collector was unreachable would manufacture an incident out of an exporter
  outage. The export outcome is printed and then ignored.
- **With no `OTEL_EXPORTER_OTLP_ENDPOINT` it is inert**, and says so
  (`⇡ not reported — no OTLP endpoint configured`). No collector is configured
  anywhere in the ecosystem yet, so that is the normal output today.

`--text` runs do **not** report: a debugging dump asserted nothing, and putting
a probe result on the bus for it would be noise.

## What this does not check

- **Contrast and colour.** Kitesurf trades CSS exactness for cost, so a computed
  style from it cannot gate an APCA floor. Rendered-or-not is a binary it can
  answer; "is this colour exactly right" is not. Use Chromium if that check is
  ever wanted.
- **The live component previews.** Those mount client-side and Kitesurf returns
  before they resolve, so every page currently shows `Loading preview…`. That is
  a limit of this check, not a defect on the page — asserting on it would produce
  a failure nobody could fix.
- **Anything below the fold that renders lazily**, for the same reason.

## Why it is not in CI (yet)

It needs a Cloudflare token, so wiring it into `ci.yml` makes a missing secret
look like a broken build on every fork and every PR from outside the org. The
honest sequence is: run it against production after a deploy, and add it to CI
once the secret is provisioned and the route set has settled. A red check
everyone learns to ignore is worse than no check.
