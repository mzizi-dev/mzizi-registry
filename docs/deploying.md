# Deploying

Every Worker in this repo is deployed by the **Cloudflare GitHub app**, configured
per Worker in the Cloudflare dashboard. There is no deploy workflow in
`.github/workflows/`, and there should not be one.

CI in this repo does build checks and tests. It is not a publish path. Two ways
to deploy is worse than one: they can disagree about what is live, and the one
nobody uses rots without anyone noticing until the day it is needed.

## The Workers

| Worker       | Serves                                   | Config                      | Owner |
| ------------ | ---------------------------------------- | --------------------------- | ----- |
| `mzizi-ui`   | `ui.mzizi.dev` — the viewable primitives | `mzizi-ui/wrangler.jsonc`   | Mzizi |
| `mzizi-plus` | `plus.mzizi.dev` — the toolchain         | `mzizi-plus/wrangler.jsonc` | Mzizi |

`mzizi-ui` and `mzizi-plus` don't render anything of their own — they proxy to
`mzizi.dev` per-request and gate which pages/items are allowed through by node
(see `lib/domain-proxy.ts`). They hold no state and reach no database.

They are the only Workers deployed from this repo. The `mzizi` Worker (the
Next.js portal, built with OpenNext) and the `mzizi-api` Worker (generated from
the portal's `app/api/` routes) were removed with the app itself:

| Host            | Served by now                                               |
| --------------- | ----------------------------------------------------------- |
| `mzizi.dev`     | `mzizi-dev/mzizi-site`                                      |
| `app.mzizi.dev` | `mzizi-dev/mzizi-console`                                   |
| `api.mzizi.dev` | `mzizi-dev/mzizi-api-gateway`                               |
| `mcp.mzizi.dev` | the `mzizi-mcp` Worker in `mzizi-dev/agent-tools` (private) |

If the Cloudflare dashboard still has a Workers Build connected to this repo
for the `mzizi` or `mzizi-api` Worker, disconnect it: it has nothing to build.

## Connecting a Worker in the dashboard

Workers &rarr; the Worker &rarr; Settings &rarr; Build. Point it at this repo and
set:

| Worker       | Build command                    | Deploy command                                           |
| ------------ | -------------------------------- | -------------------------------------------------------- |
| `mzizi-ui`   | `pnpm install --frozen-lockfile` | `npx wrangler deploy --config mzizi-ui/wrangler.jsonc`   |
| `mzizi-plus` | `pnpm install --frozen-lockfile` | `npx wrangler deploy --config mzizi-plus/wrangler.jsonc` |

Neither `mzizi-ui` nor `mzizi-plus` has a build step of its own — wrangler
bundles each from source. The install is still needed: both import
`lib/domain-proxy.ts` and its generated node map, so they need the real
dependency tree present even though neither compiles anything ahead of time.

## No secrets, no build variables

None of these Workers takes a secret or a build variable. The registry holds no
database: `registry.json` and the files on disk are the whole data layer, and
the Mzizi console (`mzizi-dev/mzizi-console`) is the only thing in the estate
that talks to Supabase.

If a `NEXT_PUBLIC_SUPABASE_*` variable or `SUPABASE_SERVICE_ROLE_KEY` secret is
still configured on either Worker in the Cloudflare dashboard, it is unused and
can be deleted.

## Verifying a deploy

The dashboard reports the build, not the result. Check what is actually served:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://ui.mzizi.dev/components/button
curl -s -o /dev/null -w '%{http_code}\n' https://plus.mzizi.dev/components/accessibility-audit
curl -s -o /dev/null -w '%{http_code}\n' -L https://ui.mzizi.dev/components/accessibility-audit
```

The last three prove `mzizi-ui`/`mzizi-plus` are gating rather than just
proxying everything: `button` is n2, so it should answer 200 through
`ui.mzizi.dev` directly; `accessibility-audit` is n8, so it should answer 200
through `plus.mzizi.dev` but redirect (302, hence `-L` to follow it and confirm
the final page loads) when requested from `ui.mzizi.dev`.
