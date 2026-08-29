# Deploying

Every Worker in this repo is deployed by the **Cloudflare GitHub app**, configured
per Worker in the Cloudflare dashboard. There is no deploy workflow in
`.github/workflows/`, and there should not be one.

CI in this repo does build checks and tests. It is not a publish path. Two ways
to deploy is worse than one: they can disagree about what is live, and the one
nobody uses rots without anyone noticing until the day it is needed.

## The Workers

| Worker      | Serves                           | Config                     | Owner                    |
| ----------- | -------------------------------- | -------------------------- | ------------------------ |
| `mzizi`     | `mzizi.dev` — the framework site | `wrangler.jsonc`           | Mzizi / Bundu Foundation |
| `mzizi-api` | `api.mzizi.dev` — the public API | `mzizi-api/wrangler.jsonc` | Mzizi / Bundu Foundation |

## Connecting a Worker in the dashboard

Workers &rarr; the Worker &rarr; Settings &rarr; Build. Point it at this repo and
set:

| Worker      | Build command                                                             | Deploy command                                          |
| ----------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `mzizi`     | `pnpm install --frozen-lockfile && pnpm exec opennextjs-cloudflare build` | `npx wrangler deploy`                                   |
| `mzizi-api` | `pnpm install --frozen-lockfile`                                          | `npx wrangler deploy --config mzizi-api/wrangler.jsonc` |

`mzizi-api` has no build step of its own — wrangler bundles it from source. The
install is still needed, because the Worker imports the app's own route handlers
and those import real dependencies.

## The one setting that is easy to get wrong

**`mzizi` needs the Supabase values as BUILD variables. `mzizi-api` needs them as
Worker SECRETS.** They are not interchangeable, and each is silently useless in
the other's place.

|           | `mzizi`                            | `mzizi-api`           |
| --------- | ---------------------------------- | --------------------- |
| where     | Build &rarr; Variables and Secrets | `wrangler secret put` |
| when read | at compile time                    | at request time       |

Next inlines every `NEXT_PUBLIC_*` variable into the bundle when it compiles, so
for the portal they must be present **when the build runs**. Setting them as
Worker secrets instead does nothing: the built code carries empty strings and
every database-backed route answers `503 Database not configured`.

`mzizi-api` is the reverse. It reads `process.env` at request time under
`nodejs_compat`, so the values go in once:

```bash
wrangler secret put NEXT_PUBLIC_SUPABASE_URL --config mzizi-api/wrangler.jsonc
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --config mzizi-api/wrangler.jsonc
```

They persist across deploys, and rotating a key does not need a rebuild.

The `NEXT_PUBLIC_` prefix on the API Worker's names is inherited from `lib/db`,
which is shared with the Next app. It does not mean anything there, and renaming
it would fork a module both surfaces import.

## Verifying a deploy

The dashboard reports the build, not the result. Check what is actually served:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://mzizi.dev/
curl -s -o /dev/null -w '%{http_code}\n' https://api.mzizi.dev/v1/skills
curl -s -o /dev/null -w '%{http_code}\n' https://api.mzizi.dev/v1/brand
```

`/v1/brand` is the one worth keeping in that list. It is database-backed, so it
is the only one of the three that can prove the credentials are actually set —
`/v1/skills` reads the inlined bundle and answers 200 on a Worker that can reach
nothing.
