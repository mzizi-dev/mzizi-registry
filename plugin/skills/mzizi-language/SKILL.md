---
name: mzizi-language
description: Use this skill when writing, checking or fixing Mzizi language source (`.mz` files) — the component syntax (enum tables, props, the view tree, `when` / `for each`, records, `use motion`), the `mz check --agent` loop and its NDJSON diagnostics, `mz fix` for every `exact` fix, `mz contract` for the `contract … end` block (RFC-0006 / RFC-0010), the diagnostic codes you will meet (MZ0101, MZ0106, MZ0312, MZ0313, MZ0406–MZ0409, MZ0602, MZ0603, MZ0605, MZ07xx), and exactly what is not built yet (lowering to Rust, a runtime, handlers, a release).
user-invocable: true
---

# Writing and checking Mzizi

Mzizi is a language whose syntax, type system and compiler feedback loop are designed for
machine authorship. The language lives in [`mzizi-dev/mzizi`](https://github.com/mzizi-dev/mzizi)
(public). It is **not** the component registry (`mzizi-dev/mzizi-registry`); that is the
companion `mzizi-roots` skill.

This skill describes `main` at `e9e9233` (2026-09-29). Where this skill and the code
disagree, **the code is the fact** (RFC-0003 §7.1). Every example below is copied from a file
in the repository that passes `mz check` and `mz contract` there.

## What exists, and what does not

**Built and tested:** the lexer, the recovering parser, the name and type resolver, the agent
diagnostic protocol (`mz check --agent`), `mz fix`, the content-addressed IR, `mz outline`,
contract evaluation (`mz contract`), nine primitives written in Mzizi (`primitives/*.mz`), two
examples (`examples/*.mz`) and the Phase 0 benchmark harness and runner. All of it is gated in
CI.

**Not built:** lowering to Rust, code generation, a runtime, rendering, a release and a
published binary. A `.mz` file today is checked and its contract evaluated; **nothing runs
it.** Do not tell anyone Mzizi "compiles to Rust" or is "production ready".

**In progress, as design only:**

- **Handlers and the backend slice.** RFC-0011 (handlers, the backend measurement slice) is a
  draft on a branch, not on `main`. RFC-0007 G2.2 (handler declarations) and G1.2 (function
  parameters and bodies) are not implemented. There is no `route`, `service` or HTTP syntax
  you can check today.
- **Contracts everywhere.** RFC-0010 (draft) extends contracts to functions, handlers,
  services and records, with codes `MZ0606`–`MZ0613`. **None of those codes exist in the
  compiler yet.** Only component contracts (RFC-0006) are evaluated.
- **Modules.** There are no imports. Components are referenced by bare name
  (`primitives/confirm_bar.mz` uses `button` and `alert` with no import line). A reference to
  another component's enum (`button_variant.ghost`) is warning `MZ0502`, because it cannot be
  checked until modules exist.

**Results, as they fell.** Two Phase 0 pilots ran on 2026-09-27 and neither showed an
advantage for Mzizi. On the frontier model the Mzizi and Dioxus arms tied, with Mzizi about 8%
fewer transcript tokens. On the ~7B open-weight model, the design target, Mzizi did worse on
all three metrics. Neither pilot is the kill-criterion run (RFC-0009 §6), and that run has not
happened. "Designed for agents" is accurate; "faster" or "better" is not.

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

| Command                           | Does                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `mz check <file>`                 | human-readable diagnostics                                                       |
| `mz check --agent <file>`         | NDJSON: one diagnostic per line, then one summary line. **Target this.**         |
| `mz fix <file>`                   | applies every `exact` fix in place, in one pass, then re-checks the file         |
| `mz contract <file>`              | evaluates the file's `contract` block (only on a file that checks clean)         |
| `mz contract --agent <file>`      | the same, as NDJSON; the summary adds `contract_clauses` and `contract_failures` |
| `mz outline <file>`               | the interface only (name, enums, props, contract subjects), as valid Mzizi       |
| `mz hash <file>` / `mz ir <file>` | the content-addressed root hash / every IR node with its hash and path           |

Exit status: **0** no errors (warnings do not fail), **1** errors or a failed contract
assertion, **2** a usage or I/O problem. Branch on the status; parse the NDJSON for detail.

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

One file holds one component. There is one form per intent: if a construct is not shown here or
in the RFCs, assume it does not exist. The order inside a component is doc lines, `use`, `enum`
and `record`, `prop`, `view`, `fn`, `contract`.

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
language functions and backend handlers. Only the component form is evaluated today.

## Diagnostic codes you will meet

The ranges are `MZ01xx` lexing and names, `MZ02xx` blocks and closers, `MZ03xx` declarations,
`MZ04xx` the view, `MZ05xx` lints, `MZ06xx` contracts and `MZ07xx` types and resolution. The
full tables are RFC-0001 §4.7, RFC-0006 §8 and RFC-0008 (types).

| Code                | Severity | Written                                                     | Repair                                         |
| ------------------- | -------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `MZ0101`            | error    | a name that is not `snake_case`                             | `exact`: the snake form                        |
| `MZ0105`            | error    | `list<T>`, `T[]`, `[T]`                                     | `exact`: `list(T)`                             |
| `MZ0106`            | error    | `...props`, `{...props}`, `..attributes`                    | `exact`: delete (the whole line when alone)    |
| `MZ0204`            | error    | a block never closed                                        | `guess`: insert the `end`s                     |
| `MZ0206`–`MZ0208`   | error    | a wrong closer (`end view`, a bare `end` for `component`)   | `exact`: rewrite the whole closer line         |
| `MZ0303`            | error    | a variant missing a column another variant has              | add the column                                 |
| `MZ0312`            | warning  | `prop as_child: bool` (React `asChild`)                     | `exact` when unread: delete the prop           |
| `MZ0313`            | error    | `icon class "size-14" height 48`                            | `exact`: the rendered px (`56`)                |
| `MZ0406`            | error    | `class "flex"` (attribute without `=`)                      | insert `=` (`exact` for known attribute words) |
| `MZ0407`            | error    | `if open`                                                   | `exact`: `when open`                           |
| `MZ0408`            | error    | an attribute directly under `view`                          | move it inside the root element                |
| `MZ0409`            | error    | `span class = "x"` (more after an element word)             | put the element word on its own line           |
| `MZ0501`            | warning  | no `contract` block                                         | write one                                      |
| `MZ0502`            | warning  | `<other>_enum.variant` from another component               | none until modules                             |
| `MZ0602`            | error    | a clause with no predicate (`height 52`)                    | `exact`: insert `is` (needs an operand)        |
| `MZ0603`            | error    | **an assertion that does not hold**                         | fix the component or the clause                |
| `MZ0605`            | error    | an assertion that cannot be evaluated                       | assert something the file defines              |
| `MZ0701`            | error    | an unknown type (`strng`)                                   | alias or nearest-name fix                      |
| `MZ0706`            | error    | a default that does not fit its type                        | varies                                         |
| `MZ0707` / `MZ0708` | error    | an unknown name / variant, column or field                  | nearest-name fix                               |
| `MZ0710`            | error    | an option used without `when … is none … else`              | narrow it first                                |
| `MZ0711` / `MZ0712` | error    | a wrong kind of value / a `when` that does not fit its type | see `say`                                      |

Two real outputs, from pilot-2 candidates written by the 7B model and re-checked on `main`
(`benchmarks/results/2026-09-27-pilot-2/raw/scored/…/mzizi/{button,badge}/seed-1/iter-01/candidate.mz`):

```text
{"code":"MZ0313","severity":"error","file":"candidate.mz","span":[16,35,16,37],"say":"`icon` declares `height 48` but its class `size-14` renders 56px (N × 4) — write `height 56`, or drop the column and let the class say it once","fix":{"span":[16,35,16,37],"replace":"56","confidence":"exact"}}
{"code":"MZ0106","severity":"error","file":"candidate.mz","span":[15,8,15,16],"say":"`...props` is a spread, and Mzizi has none: a component names each prop it reads and each attribute it sets. `props` has no equivalent — delete the line","fix":{"span":[15,1,16,1],"replace":"","confidence":"exact"}}
```

## Contributing to the language

- A language change needs an RFC in `design/`. Take the next unused number (RFC-0005 is
  reserved; RFC-0011 is on a branch).
- CI runs `cargo fmt -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test`,
  and `mz check` and `mz contract` over every file in `examples/` and `primitives/`, one file
  per call. `AGENTS.md` in the repo has the exact script.
- Pull requests are rebase-merged. State what you measured in the commit message.
- The repo consumes nothing else in the org: no build step, test or script may reach into
  `mzizi-registry` or `agent-tools`.

## See also

- `CHARTER.md` (v0.3), `design/RFC-0001` (syntax and the agent protocol), `RFC-0006`
  (contracts), `RFC-0008` (types, collections, records), `RFC-0009` (the comparison benchmark
  and the kill criterion), `RFC-0010` (contracts everywhere, draft) and
  `benchmarks/READINESS.md`.
- The `mzizi-roots` skill: the Rust components the language is benchmarked against, and where a
  lowering would target.
