# mzizi-api

`api.mzizi.dev` — the Mzizi public API as a standalone Cloudflare Worker.

## What this is

The 36 JSON endpoints under `app/api/`, served from their own Worker instead of
from the website's deployment.

It is **not** a reimplementation. Every handler is the exact module
`app/api/**/route.ts` that the Next app serves, imported unmodified.
`wrangler.jsonc` aliases `next/server` to `src/next-server.ts`, a small shim, and
that is the whole of the adaptation. There is one copy of every endpoint and no
way for the two surfaces to disagree.

Verified rather than asserted: with both Workers running from the same commit,
all 37 route/parameter combinations return identical status and identical bodies
once genuinely volatile fields (`timestamp`, `duration_ms`, `latencyMs`,
`last_checked`) are normalised.

## Why split it out

The API and the website have different shapes. The API is JSON with long cache
lives and cross-origin consumers; the site is pages. Serving both from one
deployment means a copy change redeploys the API and an API change redeploys the
site. Separating them is also what the Astro migration needs: Astro renders the
pages, and the data behind them lives here.

## Paths

Both forms resolve to the same route:

```
https://api.mzizi.dev/v1/skills          # canonical — the api. subdomain makes /api redundant
https://api.mzizi.dev/api/v1/skills      # accepted
```

The second is not just a convenience. It is what allows `mzizi.dev/api/v1/*` to
be routed here later without changing a single published URL.

## The route table is generated

Next derives routing from the filesystem. A standalone Worker cannot, so
`src/routes.generated.ts` is written by `scripts/generate-api-routes.mjs` and
`pnpm api:routes:check` fails in CI when it drifts from `app/api/`.

A hand-maintained list would omit a new route silently: the endpoint would exist
in the app, 404 on `api.mzizi.dev`, and every test would pass.

```bash
pnpm api:routes          # regenerate
pnpm api:routes:check    # CI gate
```

## Running it locally

```bash
pnpm api:dev
curl -s localhost:8787/v1/skills | head
```

It needs no environment variables and no secrets: the registry holds no database,
so every route the Worker imports reads files bundled with it.

## Deploying

Through the **Cloudflare GitHub app**, configured in the Cloudflare dashboard —
not from CI. See [`docs/deploying.md`](../docs/deploying.md) for the build and
deploy commands. Neither this Worker nor the portal takes a secret or a build
variable.
