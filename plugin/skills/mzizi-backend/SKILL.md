---
name: mzizi-backend
description: Use this skill when building or changing a Mzizi backend service on Cloudflare Workers — a Rust Worker with workers-rs or an MCP server in TypeScript. Covers where the backend stands today (every live Mzizi Worker is TypeScript; the Mzizi language has a backend `service` slice, RFC-0011, that `mz contract` runs in process and `mz build` lowers to a local Rust + axum package, with no Workers target and nothing deployed), the live endpoint map (api.mzizi.dev, mcp.mzizi.dev, docs.mzizi.dev/mcp), the sans-IO core plus thin host that Mzizi Roots server components use, wrangler config, cron and queues, storage through Workers bindings (no database client), MCP transport, one-factory/many-entrypoints, a code-defined tool catalogue over data bundled at a pinned commit, federation, tool naming and annotations, the free-except-Fundi access rule, logging, publishing to npm and the MCP Registry, and deploy.
user-invocable: true
---

# Mzizi backend on Cloudflare Workers

This skill replaces two 0.7.0 skills: `cloudflare-worker-rust` (now "A Rust Worker") and
`mcp-server-cloudflare` (now "An MCP server"). The rules they shared (access, logging, deploy)
are stated once, at the end.

## Where the backend stands today

**Direction: Rust first, TypeScript second** (`mzizi-registry` →
`content/doctrine/documentation-architecture-framework/`), and Mzizi's backend is meant, in
the end, to be built in the Mzizi language itself (`CHARTER.md` v0.4, §1). Neither is the
state today, and a skill that implied otherwise would mislead you:

- **Every Worker Mzizi runs is TypeScript.** `api.mzizi.dev` is `mzizi-dev/mzizi-api-gateway`,
  a Hono Worker. `mzizi-dev/agent-tools` holds `mzizi-mcp` (mcp.mzizi.dev), `mzizi-fundi` and
  `bushtrade-mcp`, all TypeScript, because the MCP SDK, `hono` and `agents` are TypeScript.
- **The Rust building blocks exist.** Mzizi Roots server components (the `mzizi-roots-server`
  crate: `mzizi-assurance`, `mzizi-fundi`, `mzizi-docs`, `mzizi-discovery`) are sans-IO cores
  meant to be mounted in a Worker. The `workers-rs` adapter crate (`mzizi-worker`) is planned
  and has not landed, so today the Worker writes its own few lines of adapter.
- **The Mzizi language has one backend slice, and it serves nothing live.** A `service` with
  HTTP routes and handlers (`when`, `header`, `respond`) exists on the language's `main`
  (RFC-0011; `mzizi-dev/mzizi` at `62a0f32`). `mz check` checks it, `mz contract` runs it in
  process against its `example` and `ensure` clauses, and `mz build` lowers it to a local
  Rust + axum Cargo package that serves `127.0.0.1:$PORT`. That is all: no Workers,
  WebAssembly or Containers target, no deployment, no Workers bindings or storage, no request bodies,
  no state, and no expressions, functions, loops or modules in a handler. No component lowers.
  Its first job is the Phase 0 backend measurement (task B1, the `mzizi-be` arm), and no
  backend episode has run. Check `LANGUAGE-TRACKER.md` in the language repo before claiming
  any capability. "A Mzizi service" below shows the slice.

So: write a new production service's logic in Rust as a sans-IO core. Use TypeScript where
the work leans on the MCP SDK or `agents` (see "An MCP server" below). Port nothing that
works without a reason; when a service is ported, its existing tests and parity script are the
contract the port must meet.

## The live endpoint map

Read this before inventing a hostname. Each MCP has its own host, and the old umbrella
`mcp.nyuchi.dev/{service}` path scheme is **not** how these are deployed:

| Endpoint                   | Worker / source                           | Serves                                                                                              |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `api.mzizi.dev`            | `mzizi-api-gateway` (Hono, TypeScript)    | The registry API: the registry's files at a pinned commit; no origin, no database                   |
| `mcp.mzizi.dev/mcp`        | `mzizi-mcp` (`mzizi-dev/agent-tools`)     | The Mzizi registry, tokens, architecture, doctrine and skills (`mzizi_*`), plus the docs (`docs_*`) |
| `mcp.mzizi.dev/mcp/signin` | the same Worker                           | The same MCP, answering 401 until you sign in: the URL for the Fundi tools                          |
| `docs.mzizi.dev/mcp`       | Mintlify (`mzizi-dev/mzizi-docs`)         | The Mzizi docs; `mzizi-mcp` federates these as `docs_*`                                             |
| (Worker, no public route)  | `bushtrade-mcp` (`mzizi-dev/agent-tools`) | Agentic commerce: task-driven UCP/AP2 verbs (Nyuchi)                                                |
| `docs.nyuchi.com/mcp`      | `nyuchi-docs-mcp` (`nyuchi/nyuchi-docs`)  | Nyuchi's own docs corpus, not Mzizi's                                                               |

`design.nyuchi.com` is a 308 permanent redirect to `mzizi.dev`. Never reference it in new code
or docs. `mzizi.dev/mcp` 308-redirects to `mcp.mzizi.dev/mcp` (method and body preserved), so
point new clients at `mcp.mzizi.dev/mcp` directly.

**One MCP per surface.** Two endpoints over one corpus is two tool catalogues to keep in step,
two access stories to explain, and a silent choice for every client author. That is why the
docs are federated into `mzizi-mcp` rather than listed as a second Mzizi MCP.

## A Rust Worker

### The shape: a sans-IO core and a thin host

The core owns routing and response shaping. The host owns I/O, bindings and secrets. This is
the shape of `n10-documentation/mzizi-docs-api.rs` in the registry, and it is what lets the
same core run in a Worker, in a container behind axum, and in a native unit test.

```
service-name/
├── src/
│   ├── core.rs     # routes, types, a Store trait — no `worker` import
│   └── lib.rs      # the Worker: reads bindings, calls the core, writes the response
├── wrangler.toml
└── Cargo.toml
```

This example compiles against `worker` 0.8.7, natively and for `wasm32-unknown-unknown`:

```toml
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
worker = "0.8"
```

```rust
// src/core.rs
//! The sans-IO core: typed request in, typed response out. No `worker` import,
//! so it builds and tests natively and for wasm32 alike.

/// Every route this service answers. An unhandled one is a compile error in `respond`.
#[derive(Debug, PartialEq, Eq)]
pub enum Route {
    Health,
    Item(String),
    NotFound,
}

/// Parse a method and path into a route.
pub fn route(method: &str, path: &str) -> Route {
    match (method, path.trim_end_matches('/')) {
        ("GET", "/health") => Route::Health,
        ("GET", p) if p.starts_with("/v1/items/") => Route::Item(p["/v1/items/".len()..].to_string()),
        _ => Route::NotFound,
    }
}

/// What the core needs from the host, behind a trait so a test can pass an in-memory one.
pub trait Store {
    fn item(&self, id: &str) -> Option<String>;
}

/// Shape the answer: a status and a body. The host owns I/O, bindings and secrets.
pub fn respond(route: &Route, store: &dyn Store) -> (u16, String) {
    match route {
        Route::Health => (200, r#"{"ok":true}"#.to_string()),
        Route::Item(id) => match store.item(id) {
            Some(body) => (200, body),
            None => (404, r#"{"error":"not found"}"#.to_string()),
        },
        Route::NotFound => (404, r#"{"error":"no such route"}"#.to_string()),
    }
}
```

```rust
// src/lib.rs
use worker::*;

mod core;

/// A `Store` over data the Worker has already read from its bindings (KV, R2, D1).
struct Loaded(Option<String>);

impl core::Store for Loaded {
    fn item(&self, _id: &str) -> Option<String> {
        self.0.clone()
    }
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let route = core::route(req.method().as_ref(), &req.path());
    // The host does the I/O the core asked for, then hands the result over.
    let loaded = match &route {
        core::Route::Item(id) => env.kv("ITEMS")?.get(id).text().await?,
        _ => None,
    };
    let (status, body) = core::respond(&route, &Loaded(loaded));
    let headers = Headers::new();
    headers.set("content-type", "application/json")?;
    Ok(Response::ok(body)?.with_status(status).with_headers(headers))
}

#[event(scheduled)]
async fn scheduled(_event: ScheduledEvent, _env: Env, _ctx: ScheduleContext) {
    console_log!("[example] scheduled run");
}
```

Test the core natively with an in-memory `Store`, and assert status codes, headers and bodies
per route there. That is the contract a Rust server component carries. A Mzizi `service`
states the same facts as `example` and `ensure` clauses (below), but nothing lowers a Mzizi
service to a Worker, so a Rust Worker keeps its contract in its tests.

### Project setup

```bash
npm install -g wrangler
cargo install worker-build
cargo generate cloudflare/workers-rs
```

### wrangler.toml

```toml
name = "mzizi-example-service"
main = "build/worker/shim.mjs"
compatibility_date = "2026-09-01"

[build]
command = "cargo install -q worker-build && worker-build --release"

[[kv_namespaces]]
binding = "ITEMS"
id = "<namespace id>"

[[triggers.crons]]
cron = "*/5 * * * *"

[[queues.consumers]]
queue = "mzizi-example-signals"
max_batch_size = 10
```

Keep `compatibility_date` current; a stale date silently pins you to old runtime behaviour.
Secrets are set out of band with `wrangler secret put <NAME>` and never committed.

### Storage

A Mzizi service holds **no database client**. Its data is files bundled at build time (the way
`api.mzizi.dev` and `mcp.mzizi.dev` serve the registry at a pinned commit) or Workers bindings:
KV, R2, D1, Durable Objects. Put each behind a trait in the core so the core never imports
`worker`. Only the Mzizi console (`app.mzizi.dev`, operated by Nyuchi) uses Supabase, and
nothing else in the estate should talk to it.

### Queue consumers

A queue consumer needs the crate's `queue` feature:
`worker = { version = "0.8", features = ["queue"] }`.

```rust
#[event(queue)]
pub async fn queue(batch: MessageBatch<String>, _env: Env, _ctx: Context) -> Result<()> {
    for message in batch.messages()? {
        // hand message.body() to the core, then acknowledge
        message.ack();
    }
    Ok(())
}
```

## A Mzizi service (the language's backend slice)

Write one when the task is the language itself: a backend benchmark task, an example, or an
experiment with the slice. Do not use it for a live Mzizi service; nothing deploys it. The
full grammar, the runtime-owned behaviour and every `MZ08xx` code are in the `mzizi-language`
skill ("Services"). A minimal service, which passes `mz check` and `mz contract`:

```mz
## Health and one item, with a JSON 404.
service items

  header "x-service" "items"

  record health
    field status: text
  end

  record problem
    field error: text
  end

  route health_check
    get "/v1/health"
    respond 200 json health status "ok"
  end

  route item
    get "/v1/items/{name}"
    when name in "badge" "button"
      respond 200 text "{name}"
    end
    respond 404 json problem error "Not found"
  end

  fallback
    respond 404 json problem error "Not found"
  end

  contract
    example get "/v1/health" body.status is "ok"
    example get "/v1/items/card" status is 404
    example options "/v1/items/badge" header "allow" is "GET, HEAD, OPTIONS"
    ensure header "x-service" is "items"
  end

end service items
```

The runtime answers `HEAD`, `OPTIONS`, `405` and the trailing-slash `308` itself, so a
service never writes them. The loop, with `mz` built from source (there is no release; see
"Getting `mz`" in the `mzizi-language` skill):

```bash
mz check --agent items.mz           # NDJSON; MZ08xx for routes and handlers
mz fix items.mz                     # every exact fix
mz contract --agent items.mz        # runs the service in process; the summary adds contract_tested
mz build items.mz --out ../target/mz-build/items
cargo test --manifest-path ../target/mz-build/items/Cargo.toml          # one test per example
PORT=8787 cargo run --release --manifest-path ../target/mz-build/items/Cargo.toml
```

The generated package depends on `axum` and `tokio` (pinned exactly), is its own workspace
root, and is never committed. Its runtime is one Rust function, the same routing algorithm
`mz contract` evaluates.

## An MCP server

### Transport

MCP over HTTP is **Streamable HTTP**, JSON-RPC 2.0:

- `POST /mcp` — JSON-RPC requests
- `GET /mcp` — SSE stream
- `DELETE /mcp` — session cleanup
- `OPTIONS /mcp` — CORS preflight

A server exposes `tools/list` and `tools/call`, and optionally `resources/list` and
`prompts/list`.

Use `@modelcontextprotocol/sdk`. TypeScript is the right choice for an MCP server today,
because the SDK, `hono` and `agents` are TypeScript-first; put any heavy logic in a Rust core
("A Rust Worker" above). Pin the SDK version deliberately: `agents` hard-pins
`@modelcontextprotocol/sdk`, and letting your own declaration drift produces two incompatible
`McpServer` classes in the type graph and a private-field mismatch at typecheck.

### One factory, many entrypoints

Keep the server definition free of any runtime binding, then wrap it per surface. This is what
lets the same catalogue ship as a Worker, a generic fetch handler and a local stdio bin
(`mzizi-mcp/src/`):

```
src/
├── server.ts   # createXMcpServer(deps) → McpServer   ← the only place tools are defined
├── http.ts     # createXHttpHandler()   — any fetch runtime
├── worker.ts   # Cloudflare Worker entry, bound to env
└── stdio.ts    # bin for local clients / the MCP Registry
```

### The catalogue is code; the data is bundled

`mzizi-mcp` defines its tools in code (`src/tools.ts`) and reads its data from files bundled at
build time: `scripts/generate-registry.mjs` fetches the registry at the exact commit in
`registry.pin.json`, and `scripts/generate-skills.mjs` inlines `mzizi-skills/`. There is **no
database client, dependency, env var or secret** behind a read tool. To move the MCP to newer
registry content, change the pinned commit in a pull request; the diff is the review.

The gates are tests, not a live drift check:

1. **A tool-surface suite** connects a real MCP `Client` to the factory over an in-memory
   transport and asserts the contract: the tool names and prefix, annotations, input and output
   schemas, and which tools need sign-in (`test/tool-surface.test.ts`, `free-tier.test.ts`).
2. **A bundle suite** calls every tool against the real bundled data with the network disabled,
   and asserts that what a tool serves is byte-identical to the file it came from
   (`registry-bundle.test.ts`, `rust-first.test.ts`, `skills-bundle.test.ts`, `no-database.test.ts`).

**Federating another MCP.** `mzizi-mcp` lists the docs MCP's tools under a `docs_` prefix and
forwards each call, with a cached tool list and a clear tool error when the upstream fails
(`src/docs-federation.ts`). Prefer that to copying another server's content.

### Tool naming and annotations

Tools are `snake_case`, prefixed with the server (`mzizi_`), and named for the action:
`mzizi_search`, `mzizi_get_component`, `mzizi_list_components`, `mzizi_get_tokens`,
`mzizi_get_architecture`, `mzizi_get_doctrine`, `mzizi_get_skills`,
`mzizi_check_accessibility`, `mzizi_report_issue`, `mzizi_fundi`, `mzizi_mcp_describe`. Read the
live list with `tools/list` rather than trusting a copy, this one included. Inputs take plain
names (`{ "name": "button" }`); the old `p_`-prefixed database parameters are gone.

Every tool carries a `title`, an `outputSchema`, and honest behaviour hints:

- `readOnlyHint` — true only if the tool cannot mutate anything. An action that runs an audit
  or files a report is **not** read-only.
- `destructiveHint` / `idempotentHint` / `openWorldHint` — set them deliberately; clients use
  them to decide what to auto-approve. A tool that reads only bundled data is
  `openWorldHint: false`.

Return `structuredContent` matching the declared `outputSchema`.

### Static assets

If the Worker also serves `llms.txt`, `robots.txt` or `/.well-known/*` cards, put them behind an
`[assets]` block so they resolve ahead of the OAuth handler; everything else falls through to
the server.

### Instrumentation

If you report tool errors to an observability sink, do it fire-and-forget via
`ctx.waitUntil`, so reporting never blocks or fails the response.

### Publishing to npm and the MCP Registry

`server.json` next to `package.json` is the source of truth, and `package.json#mcpName`
**must** equal `server.json#name` or the registry refuses the publish. Registry names are
`io.github.mzizi-dev/<server>`: the namespace is the GitHub owner of the repository the publish
runs from, because `mcp-publisher login github-oidc` only authorises `io.github.<owner>/*`. The
old `io.github.nyuchi/mzizi-mcp` entry is stale and no longer updated.

Release checklist:

1. Bump the version everywhere it is stated: the constant the server reports in `serverInfo`
   (`MZIZI_MCP_VERSION` in `src/server.ts`), `package.json#version`, `server.json#version`,
   and `server.json#packages[0].version`. A mismatch here is the most common failed publish.
2. Merge to `main`. `.github/workflows/publish-mzizi-mcp.yml` publishes to npm (skipped if the
   version is already there) and then runs `mcp-publisher login github-oidc` and
   `mcp-publisher publish`, treating "this version already exists" as success. OIDC means no
   registry secret. A merge that does not change the version is a no-op.

## Access: free, except what acts as a person (every service)

Owner decision, 2026-09-29: **the MCP server and the CLI are free, with no gate.** An anonymous
session can `initialize`, `tools/list` and call every tool except the Fundi ones. Gating starts
at **Fundi**: `mzizi_fundi` and `mzizi_report_issue` act as a Mzizi console user.

How `mzizi-mcp` does it (`src/worker.ts`, `src/access.ts`):

- A tokenless request to `/mcp` is routed around the OAuth provider, rate-limited per IP, and
  served with no user.
- Any request with an `Authorization` header, and `/mcp/signin`, goes through
  `@cloudflare/workers-oauth-provider`, which validates the token and puts the WorkOS identity
  on `ctx.props`. A bad or expired token still gets the 401 that makes a client refresh.
- The gated tools stay **listed** to an anonymous caller and answer with a tool error that
  starts `Sign-in required:` and says how to sign in. `access.ts` is the one list.

When a person signs in, it is WorkOS Connect OAuth with PKCE (a public client, no secret). A
machine calling an internal service uses WorkOS M2M; only the Worker holds that secret, and it
mints the token and proxies the call so a CLI never holds it. Auth happens **inline in the
client**, never by punting the user to a browser tab mid-task.

Validate an inbound token against the WorkOS JWKS before any privileged work, and cache the
JWKS; refetching per request is the classic latency bug. Return `401` for a missing or invalid
token and `403` for a valid token without the required scope. Never collapse the two, or
callers cannot tell "sign in" from "you can't do this". Cron, queue and health routes are not
user-triggered and bypass the gate by design.

## Logging (every service)

Prefix every line with the service in brackets, as `mzizi-fundi` does with `[fundi]`, so it is
greppable across services:

```rust
console_log!("[example] cycle complete: {} records processed", count);
console_error!("[example] upstream error: {:?}", e);
```

Never log a token, a secret, or a full request body.

## Deploy (every service)

```bash
wrangler dev        # local
wrangler deploy     # manual only; normally CI deploys
```

Wire deploys to CI rather than a laptop, so what is live is what is merged. `mzizi-mcp` is
deployed by Cloudflare Workers Builds on every push to `main`, including its bundled registry
pin and skills. Run the test suites before you merge, and a live smoke pass of every read tool
(`mzizi-mcp/scripts/integration.mjs`) after.
