# Supabase Edge Functions

Deno-runtime functions that run close to the database. Two are scaffolded here:

| Function    | Route (Supabase-prefixed)                     | Purpose                                                                                                                       |
| ----------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `analytics` | `POST /functions/v1/analytics`                | Fire-and-forget ingest for `usage_events`. Replaces the inline `trackApiCall` / `trackMcpTool` path from Next.js.             |
| `fundi`     | `POST /functions/v1/fundi` and `.../heal`     | Ingests self-healing issues from L8 assurance callsites; opens GitHub issues for the worst ones on a cron-driven `heal` pass. |

Project ref: `grjsboqkaywpwatvrzmy` (`nyuchi_design_db`, region `ap-southeast-1`).

## Prerequisites

1. Install the Supabase CLI: `brew install supabase/tap/supabase` (or see <https://supabase.com/docs/guides/cli>).
2. `supabase login` with a PAT that has access to the `nyuchi_design_db` project.
3. `supabase link --project-ref grjsboqkaywpwatvrzmy` from the repo root.

## Required database tables

All three tables already exist in the production Supabase project
(`grjsboqkaywpwatvrzmy`). These functions align to the live schema,
not to a new one. The authoritative columns are:

```text
usage_events
  id, event_type, endpoint, tool_name, component_name,
  duration_ms, status_code, is_error (NOT NULL), created_at

fundi_issues
  id, component_name (NOT NULL), severity (NOT NULL),
  error_type (NOT NULL), diagnostic_source (NOT NULL),
  architecture_layer, blast_radius, diagnostic_payload (jsonb),
  healing_plan, actions_taken, auto_fixable, requires_human,
  portal_url, status (NOT NULL, default 'open'),
  github_issue_number, github_issue_url,
  resolution, resolved_by, resolved_at, root_cause,
  prevented_recurrence, created_at, updated_at

fundi_healing_log
  id, issue_id, action_type (NOT NULL), action_payload (jsonb),
  success, error, executed_at, approved_by, duration_ms
```

If those tables ever need to be recreated, use `supabase db pull`
from the live project — do NOT hand-author a schema here (the one
committed previously drifted from live, which broke the edge
functions). The fundi edge function deduplicates new reports by the
tuple `(component_name, error_type, severity)` rather than a stored
fingerprint, so no unique-index changes are required.

## Secrets

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Supabase runtime. You only need to set secrets the functions consume directly.

### `fundi`

```bash
supabase secrets set GITHUB_TOKEN=ghp_xxx        # PAT with `repo:issues` on nyuchi/design-portal
supabase secrets set FUNDI_GITHUB_REPO=nyuchi/design-portal

# Optional: dedicated token for the /heal endpoint. If unset, /heal
# accepts the Supabase service-role key instead. Set this secret if
# you want to isolate the heal trigger from service-role access.
supabase secrets set FUNDI_HEAL_TOKEN=$(openssl rand -hex 32)
```

The PAT must be able to create issues and add labels on that repo.

**Auth model:**

- `POST /functions/v1/fundi` — **unauthenticated by design.** L8
  assurance callsites anywhere in the ecosystem can report. The L8
  client library, not this endpoint, decides whether to send.
  Validation here matches the live `fundi_issues` schema
  (`component_name`, `severity`, `error_type`, `diagnostic_source`
  all required); dedup by the natural-key tuple
  `(component_name, error_type, severity)` across rows in
  `status IN ('open','in_progress')` limits row growth.
- `POST /functions/v1/fundi/heal` — **requires a Bearer token** matching
  either `SUPABASE_SERVICE_ROLE_KEY` (auto-injected; what the documented
  pg_cron schedule uses) or `FUNDI_HEAL_TOKEN` if set. Returns 401
  otherwise. This prevents an unauthenticated caller from triggering
  GitHub-issue creation via the heal loop.

**Who reports to fundi (deployment matrix):**

| Environment                             | Fundi reporting |
| --------------------------------------- | --------------- |
| `*.nyuchi.com`, `nyuchi.africa`, …      | **On by default** |
| `*.mukoko.com`                          | **On by default** |
| Any bundu-repo `NODE_ENV=development`   | **On by default** |
| Allow-listed staging environments       | **On by default** (per-app config) |
| External customers consuming the registry | **Opt-in** (set `NEXT_PUBLIC_FUNDI_ENABLED=1`) |

The L8 client library on the consumer side reads its environment and
decides whether to POST. No data leaves an external customer's
infrastructure without an explicit opt-in. Every report carries a
`source` field so triage can filter by ecosystem.

### `analytics`

No additional secrets. Rate limiting is per-instance (see notes inside the file).

## Deploy

```bash
# From the repo root:
supabase functions deploy analytics --project-ref grjsboqkaywpwatvrzmy
supabase functions deploy fundi     --project-ref grjsboqkaywpwatvrzmy
```

Both functions are `--no-verify-jwt` compatible (they do their own auth via rate limiting + fingerprinting). The default deploy is fine.

## Scheduling the fundi heal pass

Run once in the Supabase SQL editor to schedule `fundi/heal` every 15 minutes via `pg_cron` + `pg_net`:

```sql
select cron.schedule(
  'fundi-heal',
  '*/15 * * * *',
  $$
    select net.http_post(
      url     := 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/fundi/heal',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type',  'application/json'
      ),
      body    := '{}'::jsonb
    );
  $$
);
```

To unschedule: `select cron.unschedule('fundi-heal');`

## Switching the portal to the analytics function

`lib/metrics.ts` currently writes to `usage_events` directly from Next.js via the service-role client. Once `analytics` is deployed and verified, swap the body of `trackApiCall` / `trackMcpTool` to:

```ts
void fetch(`${SUPABASE_URL}/functions/v1/analytics`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(event),
  // Don't let this block or throw — metrics must never affect the request path.
}).catch(() => {})
```

This pulls the service-role key out of the Next.js request path and centralises ingest (so mukoko-*, nhimbe, shamwari can hit the same endpoint without needing service-role access).

## Invoking by hand

```bash
# Analytics — single event
curl -sS -X POST 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/analytics' \
  -H 'Content-Type: application/json' \
  -d '{"event_type":"api_call","endpoint":"/api/v1/ui","duration_ms":42,"status_code":200}'

# Fundi — report an issue. Body matches the live fundi_issues schema
# exactly (component_name / severity / error_type / diagnostic_source
# all required).
curl -sS -X POST 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/fundi' \
  -H 'Content-Type: application/json' \
  -d '{
    "component_name": "button",
    "severity": "high",
    "error_type": "hydration-mismatch",
    "diagnostic_source": "l8-assurance",
    "architecture_layer": 2,
    "blast_radius": "single-component",
    "diagnostic_payload": { "expected": "button", "received": "div" }
  }'

# Fundi — manually trigger a heal pass (requires auth, see "Auth model" above)
curl -sS -X POST 'https://grjsboqkaywpwatvrzmy.supabase.co/functions/v1/fundi/heal' \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

## Local development

```bash
supabase start                                    # boot local stack (Docker)
supabase functions serve analytics --no-verify-jwt
# in another terminal
supabase functions serve fundi --no-verify-jwt
```

Functions hot-reload on save.

## Why edge instead of Next.js API routes?

- **Analytics** moves the metric write off the portal's request path — no more service-role key in the Next.js runtime, no fire-and-forget client in app code. Any ecosystem app can call the same URL.
- **Fundi** is a long-running / cron-driven loop with external HTTP (to the GitHub API). Running it outside Next.js keeps retries, rate limits, and timeouts out of the portal's serverless budget, and keeps `fundi_issues` row writes close to the DB.

## License

MIT — same as the rest of the repo (see `../../LICENSE`).
