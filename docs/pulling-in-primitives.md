# Pulling primitives into your app

Where the primitives are, how to install them per target, and what to do when the
target you want has no source yet.

This is the answer to "where and how do I pull the primitives in". It is
deliberately separate from the build-out plan (issue #222 and its waves), because
consuming and producing are different jobs with different audiences.

---

## 1. First, ask which target you are on

The registry serves **two different things** depending on target, and confusing
them wastes the most time. `framework_descriptors.readiness` is the field that
says which:

| `readiness`        | What you actually get                                         |
| ------------------ | ------------------------------------------------------------- |
| `production`       | Real, installable component source                            |
| `primitives_wired` | Some primitives resolve; the surface is partial               |
| `metadata_only`    | **Instructions only** — contract, tokens and rules, no source |

A `metadata_only` target is not broken and not "coming soon". It is a stated
position: the contract exists, the source is yours to write. Do not wait for it.

`readiness` is not the same question as `tier`, and you need both:

| `tier`     | Meaning                                              |
| ---------- | ---------------------------------------------------- |
| `primary`  | Where Mzizi is heading — Rust: `dioxus`, `crates-io` |
| `native`   | First-class native shells — swift, kotlin, arkts, RN |
| `optional` | Supported, not the destination — `svelte`            |
| `legacy`   | Still ships, being moved away from — `react`         |

They point opposite ways today on purpose: **svelte is `production` + `optional`**
(source exists, not the direction) while **dioxus is `metadata_only` + `primary`**
(the direction, source not wired). One field would force a false choice between
"has components" and "is the plan", and whichever it answered would mislead you.

---

## 2. Installing, per target

### React — the shadcn CLI

```bash
npx shadcn@latest add https://mzizi.dev/api/v1/ui/button
```

This is the only target with a CLI that resolves the registry directly. It reads
the item's `files[].path` for where to put the file, `dependencies` for npm
packages, and `registryDependencies` for other components to pull in first.

Two things that will bite you if the manifest is wrong, both now gate-checked by
`pnpm registry:validate`:

- A `registryDependencies` entry is a **bare name only** for components that exist
  upstream at ui.shadcn.com. Anything Mzizi-only needs the absolute
  `https://mzizi.dev/api/v1/ui/<name>` form, because a bare name sends the CLI to
  the default registry, where it 404s.
- Every npm package a component imports must be in its `dependencies`. A missing
  one installs a file that cannot resolve its own import.

### Svelte

Use `shadcn-svelte` against the same registry. Source exists; it is not where the
system is heading.

### Rust / Dioxus

Consumed as a **crate**, not via a CLI:

```toml
[dependencies]
mzizi-ui     = { git = "https://github.com/nyuchi/mzizi", package = "mzizi-ui" }
mzizi-tokens = { git = "https://github.com/nyuchi/mzizi", package = "mzizi-tokens" }
```

Check what actually exists before you plan around it:

```bash
curl https://mzizi.dev/api/v1/rs/button      # 200 — has a Dioxus implementation
curl https://mzizi.dev/api/v1/rs/select      # 404 — TypeScript only, for now
```

A 404 there is a true answer, not an outage. Three primitives have Rust today
(`button`, `badge`, `card`); the rest are issue #222.

### Swift, Kotlin, ArkTS, React Native

**No CLI, by design** — these are instruction-first. You get:

- the component's contract from `/api/v1/ui/{name}/docs` (use cases, variants,
  sizes, features, a11y notes),
- the tokens from `components/registry/n1-tokens/nyuchi-tokens-<platform>.<ext>`,
  which are **generated** for every target from one source,
- the rules below.

You write the component. That is the deal, and it is why the token file is
generated rather than hand-written: adding a target means adding an emitter, never
re-authoring values.

---

## 3. What does not vary, whatever target you are on

These are the invariants. A target that cannot honour them is not a supported
target:

1. **N1 is the only layer allowed to define a design value.** Everything else
   consumes — `var()` on the web, the generated token file on Swift / Kotlin /
   ArkTS / Rust. If you find yourself typing a hex, stop.
2. **Buttons are pill-shaped** (`rounded-full`). An executive brand decision, not
   a radius-scale value.
3. **The APCA contrast floor**, and the control scale. A dense control that is a
   _touch_ target has to earn its hit area through surrounding spacing or padding
   beyond the visual box.
4. **The main image on a detail page is square** (`--aspect-media`), and components
   reference it with an inline fallback — `aspect-[var(--aspect-media,1/1)]` —
   never a bare `aspect-media` utility. Nothing distributes that utility, so a bare
   one silently collapses the card to its content height in _your_ app.
5. **A component that renders HTML sanitises it.** You are not the boundary; the
   component is, because it is the last place anyone can enforce anything. Four
   shipped without it — see §8.4.2.

---

## 4. When the primitive you want has no source

In order of preference:

1. **Check `/api/v1/rs/{name}`** (Dioxus) or the target's descriptor. It may exist.
2. **Read the contract** — `/api/v1/ui/{name}/docs` gives use cases, variants,
   sizes, features and a11y notes; `/api/v1/ui/{name}` gives dependencies and the
   file layout.
3. **Write it against the contract, not against the `.tsx`.** A mechanical
   translation carries every defect in the original across while the compiler waves
   it through, because a faithful port of a broken component still compiles.
4. **Say so on issue #222** with which primitive and what you are building. Demand
   is how the long tail (#226) gets prioritised — 284 primitives have no dependents,
   and the one you need should stop being one of them.

---

## 5. Do not fork the registry

Install from it. Copy-pasting component source or standing up a parallel component
library is the thing this registry exists to prevent: the copy cannot receive a
security fix, and the four unsanitised HTML sinks found in §8.4.2 would still be
live in every fork made before the fix.

If a component is wrong for you, open an issue or a PR against it. Changes here
propagate to every consumer; changes in your fork propagate nowhere.
