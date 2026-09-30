---
name: mzizi-language
description: Use this skill when writing, checking or fixing Mzizi language source (`.mz` files) — LANGUAGE-TRACKER.md as the one list of what Mzizi can and cannot do, the component syntax (enum tables, props, the view tree, `when` / `for each`, records, `use motion`), the backend `service` (routes, handlers with `when` / `header` / `respond`, `example` and `ensure` contracts; RFC-0011), the `mz check --agent` loop and its NDJSON diagnostics, `mz fix` for every `exact` fix, `mz contract` (a component's contract, or a service run in process), `mz build` (a service to a local Rust + axum package), the diagnostic codes you will meet (MZ0101, MZ0106, MZ0312, MZ0313, MZ0406–MZ0409, MZ0602, MZ0603, MZ0605, MZ0606, MZ0611–MZ0613, MZ07xx, MZ08xx), and exactly what is not built yet (expressions, bindings, callable functions, loops, error handling, modules, a standard library, component lowering, a release).
user-invocable: true
---

# Writing and checking Mzizi

**Mzizi is a general-purpose programming language, built to make Rust better, the way
TypeScript makes JavaScript better** (`CHARTER.md` v0.4, "Mzizi: a general-purpose
programming language"). How: no borrows, lifetimes or ownership in the language you write
(RFC-0001 §1.8), with the harness at the core, the layer an agent reads. "Makes Rust better"
is the goal Phase 0 measures, not a result. Only a backend `service` lowers to Rust today; no
component does.

Rust is its platform, the way JavaScript is TypeScript's: Mzizi is designed to lower to Rust (RFC-0001 §5), and Mzizi
Roots is its component model, the way React is JavaScript's. Its goal is to be the language
people choose instead of TypeScript, Python and C++: write Mzizi, get Rust underneath. That
is a goal, not a result. Phase 0 has one goal: to build Mzizi as a programming language,
measured against the best existing language for each kind of task (RFC-0009). Nothing has
been measured against that yet.
Its syntax, type system and diagnostics are designed for machine authorship.

The language lives in [`mzizi-dev/mzizi`](https://github.com/mzizi-dev/mzizi) (public). Say
which thing is which when you describe it:

- **The language:** its syntax, type system, semantics, and contracts as a language
  feature.
- **The harness, the core of Mzizi:** the layer an agent reads and works through. It covers
  the language as an agent sees it (grammar, types, contracts, canonical form), the agent
  protocol (`mz check --agent`, its diagnostics and fixes; RFC-0001 §4), and the plugin
  host that the toolchain, the CLI, the MCP server and plugins attach to natively. Part of
  it exists today, in the toolchain: the `mz check --agent` output this skill teaches. The
  harness as a whole is designed, not built: RFC-0012 (a draft) specifies it, and there is no
  `mz harness` command and no plugin host, so never say it works. It lives in
  `mzizi-dev/mzizi`, the language repository, and the `agent-tools`
  packages (`@nyuchi/mzizi-cli`, `mzizi-mcp`, `fundi`) are its clients. It is not
  `benchmarks/harness/`, which is the Phase 0 benchmark scorer.
- **The toolchain, which implements and supports the language:** `mz` (the compiler, its
  IR and its NDJSON diagnostics, `mz fix`, `mz contract`, `mz build`), `@nyuchi/mzizi-cli`, the MCP
  server at `mcp.mzizi.dev`, these skills, and the Phase 0 benchmark harness. They are
  meant to attach to the harness. Never call the compiler "the language".
- **The components, which support the language:** Mzizi Roots and the registry
  (`mzizi-dev/mzizi-registry`), the language's UI layer. That is the companion
  `mzizi-roots` skill. Supplying the benchmark's UI tasks is one of their jobs, not what
  they are.

This skill describes `main` at `62a0f32` (2026-09-30): 425 tests in the workspace
(`cargo test --workspace`, 294 of them in the compiler crate) and 12,644 lines in
`compiler/src`. Where this skill and the code disagree, **the code is the fact** (RFC-0003
§7.1). Every example below is copied from a file in the repository that passes `mz check`
and `mz contract` there.

## Check the tracker before you claim anything

[`LANGUAGE-TRACKER.md`](https://github.com/mzizi-dev/mzizi/blob/main/LANGUAGE-TRACKER.md) in
the language repository is **the one list of what Mzizi can and cannot do** (owner, 2026-09-30).
If a capability is not ✅ there, Mzizi does not have it, whatever any other page says, this
skill included. Its status column is what the code on `main` does, never what an RFC designs.
Read it before you tell anyone Mzizi can do something, and before you write Mzizi that relies
on a construct this skill does not show.

What exists is the front end of a language whose first domains are UI components and one
backend slice. What the tracker lists as missing is almost everything a general-purpose
program needs:

- **No expressions or operators** (C1): no arithmetic, no `+`, no `==`. Comparisons exist only
  inside contracts and handler conditions (`is`, `in`, `at_least`, `at_most`).
- **No bindings** (C2): no variables, no named values, no assignment.
- **No callable functions** (C3): `fn` parses, but a body is nothing beyond `emit`; there are no
  parameters, return values or calls.
- **No loops** (C4) outside a view's `for each`, and no early return except a handler's
  `respond`.
- **No error handling** (C9): no result type and no propagation. Contracts check behaviour;
  they are not error handling.
- **No modules or imports** (P1): one component or one service per file.
- **No standard library** (P2), no text operations (C6), `int` is the only number (C5), and
  there is no map, set or tuple (C7).
- **No program entry point that runs** (C10): there is no `mz run`.

The public benchmark suites (MultiPL-E, EvalPlus) are blocked until functions exist.

## What exists, and what does not

**Built and tested, in the toolchain:** the lexer, the recovering parser, the name and type
resolver, the agent diagnostic protocol (`mz check --agent`), `mz fix`, the content-addressed
IR, `mz outline`, contract evaluation (`mz contract`), nine primitives written in Mzizi
(`primitives/*.mz`), two component examples and one service (`examples/*.mz`), and the Phase 0
benchmark harness and runner. All of it is gated in CI.

**The backend slice (RFC-0011), built and tested:** a `service` with HTTP routes and handlers
(`when`, `header`, `respond`), checked by `mz check`. `mz contract` runs a service in process
and evaluates its `example` and `ensure` clauses. `mz build` lowers a service to a local
Rust + axum package, which CI compiles, tests and serves. That is **the whole of the lowering
today:** no component lowers, and the package is a local server, with no Workers, WebAssembly
or Containers target and no deployment. The `mzizi-be` benchmark arm, the probe crate
`mzprobe` and backend task B1 exist; no backend episode has run.

**Not built:** everything in the tracker list above, lowering of components, rendering, a
release and a published binary. A component `.mz` file today is checked and its contract
evaluated; **nothing runs it.** Do not tell anyone Mzizi "compiles to Rust" or is "production
ready"; say it is designed to lower to Rust, and that only a service does so today.

**In progress, as design only:**

- **The harness.** RFC-0012 (draft). Only the agent protocol exists (`mz check --agent`,
  `mz fix`, `mz contract`).
- **Contracts everywhere.** RFC-0010 (draft) extends contracts to functions, handlers,
  services and records. Component contracts (RFC-0006) and service contracts (RFC-0011 §7) are
  evaluated. Of RFC-0010's codes, `MZ0606`, `MZ0611`, `MZ0612` and `MZ0613` exist, for
  services; `MZ0607`–`MZ0610` do not exist in the compiler.
- **Request bodies** for a service (`body input: <record>` and `reject` blocks, RFC-0011 §4.3)
  are designed and not built. So is state (task B4).
- **Modules.** There are no imports. Components are referenced by bare name
  (`primitives/confirm_bar.mz` uses `button` and `alert` with no import line). A reference to
  another component's enum (`button_variant.ghost`) is warning `MZ0502`, because it cannot be
  checked until modules exist.

**Results, as they fell.** Two Phase 0 pilots ran on 2026-09-27 and neither showed an
advantage for Mzizi. On the frontier model the Mzizi and Dioxus arms tied, with Mzizi about 8%
fewer transcript tokens. On the ~7B open-weight model, the design target, Mzizi did worse on
all three metrics. Neither pilot is the kill-criterion run (RFC-0009 §6), and that run has not
happened. The pilots were tests inside Phase 0 on a few registry UI components against
Dioxus, not its goal. "Designed for agents" and "aims to replace TypeScript, Python and C++"
are accurate; "faster" or "better" is not.

## Getting `mz`

There is no release. Build it from source; the compiler crate has zero dependencies:

```bash
git clone https://github.com/mzizi-dev/mzizi.git && cd mzizi/compiler
cargo build --bin mz            # ../target/debug/mz
cargo run --bin mz -- check ../primitives/button.mz
```

**Never `cargo install mz`.** The `mz` crate on crates.io is an unrelated project, and the
compiler crate (`mzizi-lang-compiler`) is `publish = false`.

## The commands

`mz` takes exactly one file per call. `mz check ../primitives/*.mz` is a usage error (exit 2).
Loop over files instead.

| Command                             | Does                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `mz check <file>`                   | human-readable diagnostics                                                       |
| `mz check --agent <file>`           | NDJSON: one diagnostic per line, then one summary line. **Target this.**         |
| `mz fix <file>`                     | applies every `exact` fix in place, in one pass, then re-checks the file         |
| `mz contract <file>`                | evaluates the file's `contract` block (only on a file that checks clean)         |
| `mz contract --agent <file>`        | the same, as NDJSON; the summary adds `contract_clauses` and `contract_failures` |
| `mz outline <file>`                 | the interface only (name, enums, props, contract subjects), as valid Mzizi       |
| `mz hash <file>` / `mz ir <file>`   | the content-addressed root hash / every IR node with its hash and path           |
| `mz build <service.mz> --out <dir>` | lowers a service to a Rust + axum Cargo package in `<dir>` (only a clean file)   |

Exit status: **0** no errors (warnings do not fail), **1** errors or a failed contract
assertion, **2** a usage or I/O problem. Branch on the status; parse the NDJSON for detail.

On a **service**, `mz contract` runs the service in process (no lowering, no socket), and the
summary adds `contract_tested`, the number of generated requests its `ensure` clauses were
tested over. `mz outline`, `mz hash` and `mz ir` do not cover services yet and exit 2. `mz
build` on a component exits 2 ("components do not lower yet"), and on a file with errors it
prints them, builds nothing and exits 1.

`check` and `contract` are deliberately separate: a compile error is not a defect, and a
contract failure is. Your file is done when **both** `mz check --agent` and
`mz contract --agent` exit 0.

## The loop

1. Write the file.
2. `mz check --agent file.mz`. If it exits 0, go to 5.
3. `mz fix file.mz` to apply every `exact` fix. Read each remaining diagnostic's `say`; apply
   `guess` fixes only after checking them.
4. Fix everything reported, then go to 2. Errors are independent, so fix them all before
   re-running; do not fix one and re-run to "see the next".
5. `mz contract --agent file.mz`. `MZ0603` means an assertion is false (a defect in the
   component or the contract); `MZ0605` means it could not be evaluated, which **counts as a
   failure**.

## Reading the NDJSON

This file is wrong on purpose. It is the example in `benchmarks/prompts/mzizi-guide.md`, which
`benchmarks/prompts/verify-guide.sh` checks against the real compiler.

```mz
## WRONG ON PURPOSE: three mistakes.
component tag

  enum tag_size
    snug  class "h-13 px-3"
  end

  prop onPick: event(none)
  prop size: tag_size = snug

  view
    row
      slot = "tag"
      class = "rounded-full {size.class}"
      tap = on_pick
    end
  end

  contract
    slot is "tag"
    tag_size.snug height 52
  end

end
```

`mz check --agent tag.mz` exits 1 and prints exactly:

```text
{"code":"MZ0101","severity":"error","file":"tag.mz","span":[8,8,8,14],"say":"`onPick` is not snake_case — Mzizi names are snake_case, so write `on_pick`","fix":{"span":[8,8,8,14],"replace":"on_pick","confidence":"exact"}}
{"code":"MZ0602","severity":"error","file":"tag.mz","span":[21,26,21,28],"say":"a contract clause needs a predicate (is / in / contains / not_empty / at_least / uses / min_height / shows), found `52`","fix":{"span":[21,26,21,26],"replace":"is ","confidence":"exact"}}
{"code":"MZ0208","severity":"error","file":"tag.mz","span":[24,1,24,4],"say":"top-level blocks close with their name: write `end component tag`","fix":{"span":[24,1,24,4],"replace":"end component tag","confidence":"exact"}}
{"summary":true,"errors":3,"warnings":0,"exact_fixable":3,"ms":0}
```

`mz fix tag.mz` then prints `mz: applied 3 exact fixes; 0 errors (0 exact-fixable) remain`, and
`mz contract --agent tag.mz` reports `"contract_clauses":2,"contract_failures":0`.

- `code`, `severity` (`error` or `warning`), `file` (the path you passed), `span`
  `[line, col, end_line, end_col]` (1-indexed, end exclusive) and `say` are always present.
- `say` quotes the offending source, so you need not re-read the file to understand it.
- `fix` is optional: put `replace` at `fix.span`. An empty `replace` is a deletion. `exact`
  is safe to apply blind; `guess` has the right location and an inferred replacement.
- The last line is always the summary.

## Syntax essentials

One file holds one component, or one service (see "Services" below). There is one form per
intent: if a construct is not shown here or in the RFCs, assume it does not exist. The order
inside a component is doc lines, `use`, `enum` and `record`, `prop`, `view`, `fn`, `contract`.

A complete primitive, `primitives/badge.mz`:

```mz
## A small status label. Not interactive, so no touch floor applies.
## Corpus reference: n2-primitives/badge.tsx.
component badge

  enum badge_variant
    default      class "bg-primary text-primary-foreground"
    secondary    class "bg-secondary text-secondary-foreground"
    destructive  class "bg-destructive/10 text-destructive dark:bg-destructive/20"
    outline      class "border-border text-foreground bg-input/30"
    ghost        class "hover:bg-muted hover:text-muted-foreground"
    link         class "text-primary underline-offset-4 hover:underline"
  end

  prop variant: badge_variant = default
  prop label: text

  view
    mark
      slot = "badge"
      portal = "https://mzizi.dev/components/badge"
      variant = variant
      class = "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all {variant.class}"
      text = label
    end
  end

  contract
    every badge_variant class not_empty
    badge_variant.default class contains "bg-primary"
    slot is "badge"
  end

end component badge
```

- **Shape.** `component <name>` opens the file and `end component <name>` closes it, repeating
  the name. Every other block (`enum`, `record`, `view`, `contract`, each element, each `when`,
  each `for each`, each `fn`) closes with a bare `end`. Never `end enum` or `end view`.
- **Comments.** `##` to end of line is the only comment form. `//` and `/* */` are errors.
- **Names** are `snake_case`. `onRemove` is `MZ0101`, with the snake form as its `exact` fix.
- **Enums are variant tables.** One row per variant: its name, then `column value` pairs. Every
  variant has every column (`MZ0303` otherwise). A column can carry meaning beyond styling, as in
  `primitives/alert.mz`, where `announce` ties the ARIA role to the severity:

  ```mz
  enum alert_variant
    default      class "bg-card text-card-foreground"                    announce "status"
    destructive  class "bg-card text-destructive"                        announce "alert"
    warning      class "bg-card text-[var(--status-warning,#FFD740)]"     announce "alert"
    info         class "bg-card text-[var(--status-info,#00B0FF)]"        announce "status"
  end
  ```

- **Heights come from the class.** A variant's `height` is the pixels its `h-N` or `size-N`
  class renders (`N × 4`). You may leave the `height` column out. A written `height` that
  disagrees with the class is `MZ0313`, and its `exact` fix is the rendered number.
- **Props.** `prop <name>: <type>`, optionally `= <default>`. The types are an enum name
  (`= default`), `text`, `bool`, `int`, `event(none)`, `event(<type>)`, `list(<type>)`
  (omitted means empty), `option(<type>)` (omitted means none) and a record name. Never
  `option(list(T))` (`MZ0703`).
- **The view** holds exactly one element tree. An element is a bare word on its own line,
  closed by `end`. Inside it, each line is an attribute `name = value` (the `=` is required),
  a child element, a `when` block, a `for each`, or `nothing`. Strings interpolate with
  `{...}`; there is no `+`.
- **Conditionals.** `when x` … `end`, `when not x`, `when v is <variant>`, and for an option or
  a list `when x is none` … `else` … `end`. There is no `if` (`MZ0407`, `exact` fix `when`)
  and no `match`. From `primitives/avatar.mz`:

  ```mz
      when image is none
        row
          slot = "avatar-fallback"
          class = "flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground {size.text_class}"
          text = initials
        end
      else
        picture
          slot = "avatar-image"
          source = image
          alt = alt
          class = "aspect-square size-full rounded-full object-cover"
        end
      end
  ```

- **Lists** render with `for each item in items`, whose first line is its `key = item.<field>`.
- **Capabilities.** `use motion` if the component animates (`primitives/spinner.mz`). Nothing
  else needs `use`.
- **Events.** Bind with `tap = on_tap` / `change = on_change`. A parameterless `fn` can `emit`
  an event prop, as in `examples/connectivity_bar.mz`:

  ```mz
  fn retry
    emit on_state_change(syncing)
  end
  ```

- **No React carry-overs.** `...props` spreads are `MZ0106` (`exact` fix deletes the line).
  An `as_child` prop is warning `MZ0312`: delete it, and keep what the `as_child = false`
  branch renders. `className` pass-through has no equivalent.

`benchmarks/prompts/mzizi-guide.md` is the complete one-file guide the benchmark gives a model,
including records, `for each` and a React-to-Mzizi table. Read it before writing a component.

## Services (the backend slice, RFC-0011)

A backend program is one file holding one `service`, closed by `end service <name>`. Every
inner block (`record`, `route`, `fallback`, `when`, `contract`) closes with a bare `end`. The
order is doc lines, service-level `header` lines, `record`s (and `enum`s), `route`s,
`fallback`, `contract`. There are no imports, no `main`, no server setup and no port.

`examples/registry.mz`, the example service (22 clauses, all holding; its `ensure` clauses
tested over 61 generated requests):

```mz
## A registry of two components: routes, methods, redirects and a JSON 404.
## RFC-0011's worked example, shaped like the API gateway's `/v1/ui` routes (RFC-0009 §2.4, B1).
service registry

  header "x-mzizi-source" "fixture"

  record problem
    field error: text
  end

  record health
    field status: text
  end

  record item
    field name: text
  end

  route health_check
    get "/v1/health"
    respond 200 json health status "ok"
  end

  route ui_list
    get "/v1/ui"
    respond 200 file "fixtures/ui.json"
  end

  route ui_item
    get "/v1/ui/{name}"
    when name in "badge" "button"
      respond 200 json item name name
    end
    header "cache-control" "private, no-cache, no-store, max-age=0, must-revalidate"
    respond 404 json problem error "Not found"
  end

  fallback
    header "cache-control" "private, no-cache, no-store, max-age=0, must-revalidate"
    respond 404 json problem error "Not found"
  end

  contract
    example get "/v1/health" body.status is "ok"
    example get "/v1/ui" status is 200
    example get "/v1/ui" header "content-type" is "application/json"
    example get "/v1/ui/button" status is 200
    example get "/v1/ui/button" body.name is "button"
    example get "/v1/ui/does-not-exist" status is 404
    example get "/v1/ui/does-not-exist" body.error is "Not found"
    example get "/v1/ui/does-not-exist" header "cache-control" is "private, no-cache, no-store, max-age=0, must-revalidate"
    example head "/v1/ui/button" status is 200
    example head "/v1/ui/button" body is ""
    example options "/v1/ui" status is 204
    example options "/v1/ui" header "allow" is "GET, HEAD, OPTIONS"
    example delete "/v1/ui/button" status is 405
    example delete "/v1/ui/button" body is ""
    example get "/v1/ui/" status is 308
    example get "/v1/ui/?limit=2" header "location" is "/v1/ui?limit=2"
    example get "/nope" status is 404
    example get "/nope" header "content-type" is "application/json"
    ensure status in 200 204 308 404 405
    ensure header "x-mzizi-source" is "fixture"
    ensure when status is 404 then body.error is "Not found"
    ensure when status is 405 then header "allow" is "GET, HEAD, OPTIONS"
  end

end service registry
```

- **A route** is `route <name>`, then exactly one `<method> "<pattern>"` line, then zero or
  more `query <name>: option(<scalar>)` lines, then statements, then `end`. The methods are
  `get`, `head`, `post`, `put`, `patch`, `delete` and `options`, lower case; a second method on
  the same path is a second route.
- **A pattern** is `/` or `/`-separated segments of lower-case letters, digits and `-._~`,
  or a whole-segment `{name}`, which binds `name` as `text`. No trailing slash, no empty
  segment, no `?`. A literal segment beats a parameter at the same position.
- **A query parameter is always an option:** `query limit: option(int)`. `option(int)` is
  `-`? then ASCII digits, so `"0x10"`, `"1e2"`, `" 7 "` and `"1.5"` are `none`; `option(bool)`
  is exactly `true` or `false`. Bad input is absence, never an error.
- **A handler has three statements**, and every path through it must end in `respond`:

  | Statement                        | Means                                                     |
  | -------------------------------- | --------------------------------------------------------- |
  | `when <cond>` … [`else` …] `end` | a branch; with no `else`, a false condition falls through |
  | `header "<name>" "<value>"`      | set a header on the response this path sends              |
  | `respond <status> [<body>]`      | send the response; nothing after it on the path runs      |

  A condition is `p` / `not p` (a `bool`), `p is <literal>`, `p in <literal> …`,
  `p at_least <n>` / `p at_most <n>` (an `int`), or `p is none` … `else` (an option, which is
  narrowed in the `else`). There is no `if`, `==`, `return`, assignment, loop or call.

- **Bodies:** none; `json <record> <field> <value> …` (every field once, a literal or a
  parameter, no punctuation; `application/json`); `text "<string>"` (may interpolate a
  parameter as `{name}`); or `file "<path>"` (a fixture beside the `.mz` file, embedded at
  build time). A response record's fields are scalars or options of scalars. `204`, `304` and
  `1xx` take no body.
- **Headers** are lower case. A service-level `header` applies to every response, runtime
  ones included; a route's own `header` for the same name wins. `content-length` and
  `transfer-encoding` belong to the server.
- **The runtime answers what HTTP defines, so do not write it:** `HEAD` for a `get` route
  (its status and headers, no body); `OPTIONS` (`204` with `allow`, e.g. `GET, HEAD, OPTIONS`);
  any other undeclared method on a matched path (`405` with the same `allow`, no body); and a
  trailing slash or `//` (`308` to the canonical path, query kept, never off-site). A path no
  route matches runs `fallback`, or gets an empty `404` when there is none.
- **The contract:** `example <method> "<target>" <facet> <predicate>` sends one request;
  `ensure [when <facet> <predicate> then] <facet> <predicate>` must hold for every generated
  request. A facet is `status`, `header "<name>"`, `body` or `body.<field>`; a predicate is
  `is <value>`, `in <value> …`, `not_empty`, `contains "<text>"`, `at_least <n>` or
  `at_most <n>`. `header "<name>" is none` asserts absence and `body is ""` an empty body.
  `ensure` is **tested** over the generated set, never proven.

This file is wrong on purpose. It is the example in `benchmarks/prompts/mzizi-be-guide.md`:

```mz
## WRONG ON PURPOSE: three mistakes.
service shop

  record problem
    field error: text
  end

  route item
    GET "/v1/items/{id}/"
    when id is "1"
      respond 200 text "one"
    end
  end

end service shop
```

`mz check --agent candidate.mz` exits 1 and prints:

```text
{"code":"MZ0613","severity":"warning","file":"candidate.mz","span":[2,9,2,13],"say":"`service shop` has no `contract` block — its behaviour is unverified (RFC-0010 §8)"}
{"code":"MZ0801","severity":"error","file":"candidate.mz","span":[9,5,9,8],"say":"`GET` is not a method — a route declares one of get, head, post, put, patch, delete, options","fix":{"span":[9,5,9,8],"replace":"get","confidence":"exact"}}
{"code":"MZ0802","severity":"error","file":"candidate.mz","span":[9,9,9,26],"say":"`\"/v1/items/{id}/\"` ends with `/` — patterns have no trailing slash; the runtime redirects `…/` to the path without it","fix":{"span":[9,9,9,26],"replace":"\"/v1/items/{id}\"","confidence":"exact"}}
{"code":"MZ0804","severity":"error","file":"candidate.mz","span":[13,3,13,6],"say":"a path through `route item` reaches `end` without a `respond` — when the `when` on line 10 does not respond on both branches; every path must respond"}
{"summary":true,"errors":3,"warnings":1,"exact_fixable":2,"ms":0}
```

`mz fix` applies the two `exact` fixes. `MZ0804` needs a decision: add
`respond 404 json problem error "Not found"` after the `when`'s `end`, so the false path
responds too.

**Building it.** `mz build registry.mz --out <dir>` checks the file and, with zero errors,
writes `Cargo.toml`, `src/main.rs` and the fixtures. The package is its own workspace root,
generated output that is never committed, and depends on `axum =0.8.9` and `tokio =1.53.1`
(tests add `tower`, `http-body-util` and `serde_json`). Every `example` becomes one
`#[tokio::test]` (`cargo test` in the package); `ensure` clauses are evaluated by
`mz contract` only. `cargo run --release --manifest-path <dir>/Cargo.toml` serves
`127.0.0.1:$PORT` (8080 by default) and prints `listening on http://127.0.0.1:<port>`.

## Contracts

Every component carries a `contract … end` block: one assertion per line,
`<subject> <predicate>`, no colon. A file with no contract is warning `MZ0501`. It is checked
against the file's own enums, view attributes and prop defaults (RFC-0006). From
`primitives/button.mz`:

```mz
  contract
    every button_size height at_least 48
    button_size.default height is 56
    button_size.sm height is 48
    button_variant.default class contains "bg-primary"
    slot is "button"
  end
```

| Subject                     | Means                                              |
| --------------------------- | -------------------------------------------------- |
| `every <enum> <column>`     | that column in every variant                       |
| `<enum>.<variant> <column>` | one cell                                           |
| `<attribute>`               | the root view element's attribute (`slot`, `role`) |
| `<prop>`                    | the prop's default (only a prop that has one)      |
| `<element> "<text>"`        | the element carrying that text                     |
| `when <name>`               | the `when` branch that mentions that name          |

Predicates: `is <value>` (exactly as written: `height is "52"` fails against `height 52`),
`contains "<s>"`, `not_empty`, `at_least <n>`, `in "<a>" "<b>"`, `uses "--token"`,
`uses <component>` (no subject), `shows <element> "<t>"` (after `when <name>`) and
`min_height <n>`. `examples/connectivity_bar.mz` uses the last two:

```mz
    when offline shows button "Retry"
    button "Retry" min_height 48
```

Assert what the source guarantees: every interactive size clears 48px, the `slot`, and the key
cells. An assertion on a prop with no default is `MZ0605` (unevaluable), which fails.

`mz contract` checks nothing rendered. The rendered half is `benchmarks/harness`, which diffs a
`.mz` component's variants, defaults, touch heights and `data-slot` set against the Rust
reference. Mzizi Roots components carry the same clause grammar as `pub const CONTRACT` and
check it against their server-rendered markup (see the `mzizi-roots` skill).

The direction (RFC-0010, draft) is that **everything built carries a contract**: components,
language functions and backend handlers. The component form and the service form ("Services"
above) are evaluated today; functions have no contracts because they have no bodies.

## Diagnostic codes you will meet

The ranges are `MZ01xx` lexing and names, `MZ02xx` blocks and closers, `MZ03xx` declarations,
`MZ04xx` the view, `MZ05xx` lints, `MZ06xx` contracts, `MZ07xx` types and resolution, and
`MZ08xx` services and handlers. The full tables are RFC-0001 §4.7, RFC-0006 §8, RFC-0008
(types), RFC-0010 §6 and RFC-0011 §9. A service reuses `MZ0701`, `MZ0707`, `MZ0708` and
`MZ0710` for unknown names and un-narrowed options.

| Code                | Severity | Written                                                                            | Repair                                         |
| ------------------- | -------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| `MZ0101`            | error    | a name that is not `snake_case`                                                    | `exact`: the snake form                        |
| `MZ0105`            | error    | `list<T>`, `T[]`, `[T]`                                                            | `exact`: `list(T)`                             |
| `MZ0106`            | error    | `...props`, `{...props}`, `..attributes`                                           | `exact`: delete (the whole line when alone)    |
| `MZ0204`            | error    | a block never closed                                                               | `guess`: insert the `end`s                     |
| `MZ0206`–`MZ0208`   | error    | a wrong closer (`end view`, a bare `end` for `component`)                          | `exact`: rewrite the whole closer line         |
| `MZ0303`            | error    | a variant missing a column another variant has                                     | add the column                                 |
| `MZ0312`            | warning  | `prop as_child: bool` (React `asChild`)                                            | `exact` when unread: delete the prop           |
| `MZ0313`            | error    | `icon class "size-14" height 48`                                                   | `exact`: the rendered px (`56`)                |
| `MZ0406`            | error    | `class "flex"` (attribute without `=`)                                             | insert `=` (`exact` for known attribute words) |
| `MZ0407`            | error    | `if open`                                                                          | `exact`: `when open`                           |
| `MZ0408`            | error    | an attribute directly under `view`                                                 | move it inside the root element                |
| `MZ0409`            | error    | `span class = "x"` (more after an element word)                                    | put the element word on its own line           |
| `MZ0501`            | warning  | no `contract` block                                                                | write one                                      |
| `MZ0502`            | warning  | `<other>_enum.variant` from another component                                      | none until modules                             |
| `MZ0602`            | error    | a clause with no predicate (`height 52`)                                           | `exact`: insert `is` (needs an operand)        |
| `MZ0603`            | error    | **an assertion that does not hold**                                                | fix the component or the clause                |
| `MZ0605`            | error    | an assertion that cannot be evaluated                                              | assert something the file defines              |
| `MZ0606`            | error    | an `example` status that an `ensure status in …` rules out                         | fix one of the two                             |
| `MZ0611` / `MZ0612` | error    | a service `ensure` / `example` that does not hold                                  | `say` quotes the request that broke it         |
| `MZ0613`            | warning  | a service with no or an empty `contract` block                                     | write one                                      |
| `MZ0701`            | error    | an unknown type (`strng`)                                                          | alias or nearest-name fix                      |
| `MZ0706`            | error    | a default that does not fit its type                                               | varies                                         |
| `MZ0707` / `MZ0708` | error    | an unknown name / variant, column or field                                         | nearest-name fix                               |
| `MZ0710`            | error    | an option used without `when … is none … else`                                     | narrow it first                                |
| `MZ0711` / `MZ0712` | error    | a wrong kind of value / a `when` that does not fit its type                        | see `say`                                      |
| `MZ0801`            | error    | a route not opening with `<method> "<pattern>"`, `GET`, a second method line       | `exact` for `GET`; else a `guess`              |
| `MZ0802`            | error    | a bad pattern: trailing `/`, empty segment, `?`, no leading `/`                    | `exact` where the repair is certain            |
| `MZ0803`            | error    | two routes with one method and the same pattern                                    | delete or change one                           |
| `MZ0804`            | error    | a handler path that reaches `end` without `respond`                                | add the `respond`                              |
| `MZ0805`            | error    | a line after `respond` that can never run                                          | `exact`: delete it                             |
| `MZ0806`            | error    | a bad `respond`: no status, not 100–599, a body on `204`                           | `exact` deletes a body that is not allowed     |
| `MZ0807`            | error    | a bad `header`: `"Cache-Control"`, set twice, server-owned                         | `exact`: the lower-case name                   |
| `MZ0808`            | error    | a `json` literal with a missing, repeated or ill-typed field (unknown is `MZ0708`) | give every field once                          |
| `MZ0809`            | error    | `query limit: int`                                                                 | `exact`: `option(int)`                         |
| `MZ0810`            | error    | a `file "…"` fixture that does not exist                                           | add the file or fix the path                   |
| `MZ0811`            | error    | a line a service or handler cannot hold (`return`, `=`, `view`)                    | see `say` (`is` for `=` is `exact`)            |
| `MZ0812`            | error    | a second `fallback`, or a route or parameter name used twice                       | rename or delete one                           |

Two real outputs, from pilot-2 candidates written by the 7B model and re-checked on `main`
(`benchmarks/results/2026-09-27-pilot-2/raw/scored/…/mzizi/{button,badge}/seed-1/iter-01/candidate.mz`):

```text
{"code":"MZ0313","severity":"error","file":"candidate.mz","span":[16,35,16,37],"say":"`icon` declares `height 48` but its class `size-14` renders 56px (N × 4) — write `height 56`, or drop the column and let the class say it once","fix":{"span":[16,35,16,37],"replace":"56","confidence":"exact"}}
{"code":"MZ0106","severity":"error","file":"candidate.mz","span":[15,8,15,16],"say":"`...props` is a spread, and Mzizi has none: a component names each prop it reads and each attribute it sets. `props` has no equivalent — delete the line","fix":{"span":[15,1,16,1],"replace":"","confidence":"exact"}}
```

## Contributing to the language

- A language change needs an RFC in `design/`. Take the next unused number: RFC-0005 is
  reserved, and RFC-0011 (handlers) and RFC-0012 (the harness) exist, so the next is
  RFC-0013.
- A PR that changes what the language can do updates its row in `LANGUAGE-TRACKER.md` in the
  same PR, with evidence, and adds a `CHANGELOG.md` entry.
- CI runs `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`,
  and `mz check` and `mz contract` over every file in `examples/` and `primitives/`, one file
  per call. Its `lowering` job runs `mz build` on `examples/registry.mz`, then `cargo test` and
  one request over a socket against the package, and `mzprobe verify` of task B1. `AGENTS.md`
  in the repo has the exact script.
- Pull requests are rebase-merged. State what you measured in the commit message.
- The repo consumes nothing else in the org: no build step, test or script may reach into
  `mzizi-registry` or `agent-tools`.

## See also

- `LANGUAGE-TRACKER.md` (what Mzizi can and cannot do), `CHARTER.md` (v0.4),
  `design/RFC-0001` (syntax and the agent protocol), `RFC-0006` (contracts), `RFC-0008`
  (types, collections, records), `RFC-0009` (the comparison benchmark and the kill
  criterion), `RFC-0010` (contracts everywhere, draft), `RFC-0011` (handlers, the backend
  slice), `RFC-0012` (the harness, draft), `benchmarks/prompts/mzizi-be-guide.md` (the
  one-file service guide) and `benchmarks/READINESS.md`.
- The `mzizi-backend` skill: where a Mzizi service stands against the live TypeScript Workers.
- The `mzizi-roots` skill: the Rust components built to support the language, its component
  model and where a component lowering would target.
