# N8 assurance telemetry — the sink, and why it is OTLP

> N8's covenant: _what breaks is seen before users feel it._
> This is the "seen by whom" half.

## The gap this closes

N8 shipped twelve assurance components. Five of them end in a callback:

| Component               | Callbacks               |
| ----------------------- | ----------------------- |
| `mzizi-synthetic-probe` | `onResult`, `onAlert`   |
| `mzizi-rum`             | `onEvent`, `onFlush`    |
| `mzizi-error-tracker`   | `onError`, `onCritical` |
| `mzizi-alert-engine`    | its handlers            |
| `mzizi-platform-health` | render-time only        |

**None of them had a sink.** A signal was seen by whoever installed the
component and by nobody else. Three specific consequences, all measured rather
than inferred:

- `mzizi-rum` defaulted `endpoint` to `https://mzizi.dev/api/rum`. That route
  returns **404** and has never existed, and the flush is wrapped in a `catch`
  that (correctly) swallows delivery failures. Every consumer who installed RUM
  without setting an endpoint was posting into a void that looked exactly like
  working RUM. Fixed here: there is no default, and no endpoint means no POST.
- `mzizi-error-tracker`'s one instruction for getting a critical error out was a
  commented-out import of `@/lib/fundi/nyuchi-fundi-reporter`. That file does not
  exist in this repo and never has.
- `pnpm browser:check` — a synthetic probe by any reading — printed to a console
  and exited non-zero. `mzizi-synthetic-probe` had already declared the exact
  contract it should have implemented, down to saying in its own body _"here we
  define the contract that the probe runner implements."_

## Why OTLP rather than a Mzizi endpoint

**A signal only fundi can read is a signal only fundi can act on.** The obvious
move is a `mzizi.dev/api/assurance` route that fundi polls, and it is wrong for
the same reason `/api/rum` was: it makes Mzizi the only possible consumer, and it
requires Mzizi to ship a client for every service that later wants in.

OpenTelemetry is the protocol collectors, tracing backends and agent runtimes
already speak. Emitting OTLP means "the changelog route stopped rendering"
becomes an event **any** service can subscribe to — fundi, an alerting pipeline,
another agent, a dashboard — without this repo knowing any of them exist.

## `mzizi-otel` — the exporter

`components/registry/n8-assurance/mzizi-otel.ts`, installable as
`mzizi-otel`. It is a registry component rather than repo tooling because the
apps that need to emit are consumer apps, not this one.

```ts
import { exportProbeResult } from "./mzizi-otel"

await exportProbeResult(probeResult, {
  serviceName: "my-app",
  environment: "production",
  // endpoint from OTEL_EXPORTER_OTLP_ENDPOINT
})
```

### No `@opentelemetry/*` dependency, deliberately

OTLP/HTTP with a JSON payload is a documented wire format — a POST with a
specific body shape. The JS SDK brings a large dependency tree, and the parts
that matter (`BatchSpanProcessor`, `NodeTracerProvider`) assume a Node runtime.
**fundi is a Cloudflare Worker**, and consumer apps install this file into
runtimes that are not ours to choose. A hand-built payload runs unchanged in
Node, a Worker, Deno and a browser, and keeps the component independently
installable — which the registry requires.

The tradeoff is real and stated in the file: no automatic context propagation,
no batching queue, no retry/backoff. This carries discrete assurance events, not
request traces. If you need distributed tracing, use the SDK.

### Rules the implementation follows

- **Never throws, never changes the caller's verdict.** A probe that reported
  "failed" because its collector was unreachable would manufacture an incident
  out of an exporter outage. Every failure path returns `{ exported: false,
reason }`.
- **No default endpoint.** Unset means inert. Sending a consumer's telemetry to
  an address they never chose is not a default — that is the `/api/rum` mistake
  restated.
- **`OTEL_EXPORTER_OTLP_ENDPOINT` is a base** and gets `/v1/traces` appended;
  **`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is complete** and is used verbatim. The
  asymmetry is the spec's, and appending to the second yields
  `/v1/traces/v1/traces` — a 404 that reads like a broken collector. Both paths
  are covered by tests.
- **Trace ids come from `crypto.getRandomValues`, not `Math.random()`.** Trace
  ids are correlation keys across services; a predictable one lets an unrelated
  caller collide with, or forge, a trace.

### Wire-shape details that are tested, not eyeballed

A malformed OTLP body fails _silently_ — the POST returns 200, or the collector
drops the span, and the first anyone knows is an empty dashboard. So
`__tests__/lib/otel.test.ts` asserts the details a collector rejects:

- trace id is 32 hex chars, span id is 16
- timestamps are integer **nanosecond strings** (JSON has no int64; a number
  loses precision above 2^53, which is exactly where a nanosecond timestamp sits)
- every attribute is tagged with exactly one OTLP type, integers as strings
- a failing probe produces `status.code = 2` (ERROR) on the run **and on the
  failing step only**

Verified end to end against a local collector as well as in unit tests.

## The probe mapping

A `ProbeResult` becomes one **INTERNAL** span for the run plus one **CLIENT**
child per step. A step calls something external; the run calls nothing.
Reversing these makes a collector draw service-dependency edges that do not
exist.

`ProbeResult` carries a duration per step but no per-step timestamp, so steps are
laid end to end from the run start. The durations are measured; the offsets are
reconstructed, and the code says so rather than presenting them as measured.

Attributes use a `mzizi.*` namespace (`mzizi.node`, `mzizi.probe.journey`,
`mzizi.probe.status`, `mzizi.check`) alongside standard ones (`service.name`,
`error.message`). Mzizi-specific facts do not get to squat on OTel semantic
convention names.

### What a consumer sees on a failure

The step span's `error.message` carries the full diagnosis, not just "failed":

```
missing "malachite" — NOT a rendering failure — the URL redirects off-origin to
https://vercel.com, so the browser rendered that page rather than this route —
an auth wall (Vercel SSO, Cloudflare Access, …), not an empty page.
```

That distinction is the point of putting prose on the wire. fundi filing a
GitHub issue for an auth-wall failure would be a false positive; with the reason
attached it can tell the two apart without re-running anything.

## Still not wired — stated plainly

`CLAUDE.md` §17 draws the self-healing loop as
`record_observability_event → fundi cron → create_fundi_issue → draft PR`.
**In this repo those RPCs have zero call sites.** Nothing here emits onto that
bus, and `heal.ts`/`github.ts` in `mzizi-tools` file issues rather than opening
pull requests. This change adds the emitter and the protocol; it does not claim
the loop is closed.

What is still missing, in order:

1. **A collector.** No `OTEL_EXPORTER_OTLP_ENDPOINT` is configured anywhere in
   the ecosystem, so `browser:check` reports `not reported — no OTLP endpoint
configured` today. That is the honest state, not a failure.
2. **fundi consuming OTLP.** Today fundi polls Supabase. Subscribing to the
   collector is what turns a render failure into a filed issue.
3. **The `record_observability_event` bridge**, if the Supabase event stream is
   to stay the store of record — a collector exporter writing into it, rather
   than every emitter calling the RPC directly.
