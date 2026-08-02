# Component source moves out of the database

Status: **in progress.** N11 is on disk; the read path landed with this document.

## Why

Component source lived in Supabase as `component_documents.document->>'source_code'`,
exposed through a Postgres **view** named `components`. Because the source was a JSON
column and not a file, the toolchain could not see it, and that cost showed up four
separate times in one working session:

- a component could not be typechecked, linted or rendered before being edited;
- edits reached production through blind `jsonb_set` string replacement;
- an `aspect-media` change shipped a utility **nothing defines** for consumers, so every
  installed card would have silently lost its aspect ratio in someone else's app;
- `nyuchi-cover-wash-header` was left unfixed _specifically_ because a structural JSX
  edit could not be compiled first.

The N11 pilot proved the thesis on its first file. The moment `nyuchi-seo` hit disk `tsc`
failed it: a **stable**, consumer-installed component had been passing
`ogType: "product"` into Next's `openGraph.type` — whose union does not include it — for
as long as the source lived where no typechecker could reach.

## The rule

**No component source in the database.** Once a file exists on disk the DB copy is
deleted, not mirrored. Two copies is the drift this migration exists to end — there is
no projection script, no sync, and therefore no drift gate to keep honest.

Everything _around_ a component stays in Supabase: description, dependencies,
`registryDependencies`, `files[]`, node, collection, owner, status, version history,
changelog, docs. Only the bytes moved.

## Layout

```
components/registry/n<N>-<label>/<name>.tsx
```

e.g. `components/registry/n11-discovery/nyuchi-seo.tsx`.

The directory mirrors the DNA helix so a directory listing teaches the model. Note the
distinction that trips people up: the registry's `files[].path` (e.g.
`components/ui/nyuchi-seo.tsx`) is where the shadcn CLI places the file in a **consumer's**
project. It is not where the file lives here, and the two are free to differ.

## The read path

`lib/registry-source.ts` is the **single** reader. Every surface that serves source goes
through it:

| Surface                 | What it serves                                   |
| ----------------------- | ------------------------------------------------ |
| `app/api/v1/ui/[name]`  | the shadcn registry item — `files[0].content`    |
| `lib/mcp-server.ts`     | `get_component` → `document.source_code`         |
| `app/source/[name]`     | the source-code page                             |
| `app/components/[name]` | the docs surface's code panel                    |
| `app/playground/[name]` | the playground's code panel                      |
| `app/api/v1/stats`      | "has source" — now a disk question, not a column |

Two readers of the filesystem would be the same mistake as two copies of the source.

### The fallback is a ramp, not an architecture

`resolveComponentSource(name, databaseSource)` reads disk first and falls back to the
`source_code` column. That fallback exists **only for the duration of the migration**:
nodes move one PR at a time, so between the first extraction and the last drop most
components still live only in the database, and a disk-only read path would 404 the whole
registry the moment it merged — an outage taken on in exchange for nothing, since the DB
copy is still there and still correct.

**Delete `resolveComponentSource` at step 5**, once
`select count(*) from components where source_code is not null` returns 0. Its callers go
back to `readComponentSource` directly. Keeping it past that point re-establishes the
second copy this whole migration exists to end.

Three properties are load-bearing:

- **Absent is `null`, never `""`.** A 200 carrying an empty body is exactly how the
  pre-migration bugs hid. The registry route 404s on `null`.
- **A duplicate name throws for that name only.** A component name is unique across the
  registry, so two files claiming one name means an extraction went to the wrong node.
  One mislaid file must not take the route down for the other 300-odd components.
- **`outputFileTracingIncludes` in `next.config.mjs` is not optional.** The reads are
  dynamic (`readdir` + `readFileSync`), so Next's static trace cannot see them; without
  the explicit include the files are absent from the deployed lambdas and every read
  succeeds in `next dev` and 404s in production.

## Extraction

`scripts/extract-components.ts`, one node at a time:

```bash
pnpm components:extract --node 11
pnpm components:extract --node 11 --dry-run
```

It reads through PostgREST with the **anon** key — extraction is a read, and a read never
needs to outrank a policy — and refuses to write an empty file for a component with no
source, because an empty `.tsx` would typecheck and silently serve nothing.

Per node, and **a node is not done until it is green**:

1. `pnpm components:extract --node <n>`
2. `pnpm typecheck` — fix what the extraction exposes. Expect real bugs; N11 had one in
   its single file. Fix them properly rather than narrowing types to fit.
3. `pnpm build` && `pnpm test`
4. Commit, PR, merge.
5. **Then** the migration that clears that node's `source_code`.

Step 5 is never batched across nodes. Dropping before a node's files are merged and
serving is the one irreversible mistake available here.

Order, by ascending risk:
**N9 (3) → N8 (13) → N5 (14) → N4 (14) → N7 (16) → N6 (52) → N3 (67) → N2 (143)**.

## Known follow-ups

- **N1 `nyuchi-tokens` is not a component.** Its `source_code` holds a JSON token payload
  that `getDesignTokens()` parses. It moves too, but as data — not as part of the `.tsx`
  fan-out above.
- **N2 overlaps `components/ui/`.** The portal imports ~35 primitives from
  `components/ui/<name>.tsx` and `scripts/sync-registry.ts` writes them there from the DB.
  Extracting N2 to `components/registry/n2-primitives/` would put two copies on disk —
  precisely what this migration forbids. Settle which path is the one file before N2 is
  extracted; it is last in the order for that reason.
- **`registry.json` does not exist** although `pnpm registry:verify` (in `pnpm check` and
  in CI) expects it. Resolve before the drops, or the gate goes red for an unrelated
  reason.
- **`components:verify` / the `--check` mode is due for deletion.** A drift gate is
  meaningless once there is only one copy, and leaving it invites someone to re-create
  the second.
