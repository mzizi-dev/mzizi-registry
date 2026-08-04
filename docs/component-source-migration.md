# Component source moves out of the database

Status: **complete.** All 571 components are files on disk, `source_code` has been cleared
from every row, and the `resolveComponentSource` ramp, the drift gate and the extraction
script are all deleted. `readComponentSource` is the only reader, disk is the only copy,
and a component with no file is a 404 rather than a 200 with an empty body.

This document is kept as the record of what the migration found, because most of what it
found was invisible while source lived in a JSON column and is the reason
`scripts/validate-registry.mjs` now exists.

## The count was wrong for most of this migration

It ran against **322** components for weeks because that is all the `components` VIEW
exposed. The view listed nine collections. Four more carried real component source and
were never listed:

| Collection             | Node | Rows |
| ---------------------- | ---- | ---- |
| `primitives`           | N2   | 228  |
| `styling-libs`         | N1   | 16   |
| `documentation-engine` | N10  | 4    |
| `documentation`        | N8   | 1    |

The real number is **571**. Every one of the 249 was `status: stable` with real source and
a real `files[].path`, and every one 404'd on `/api/v1/ui/{name}` — visible over MCP
`read_documents`, installable by nobody. `styling-libs` sitting at N1 is the whole reason
that node reported zero components.

Two consequences worth carrying forward:

- **`extract-components.ts` reads `component_documents` directly, never the view.**
  Extracting through the view is exactly what hid them.
- **It never overwrites a file already on disk.** A re-run reported 138 N2 files as
  "update"; those had already been fixed to compile, and the database copy is by
  definition the version that never compiled.

## `documentation` is a mixed collection

It holds `accessibility-audit` (a genuine N8 component) **and 20 retired documentation
pages** — `installation`, `introduction`, `api-reference`, `contributing` — whose content
moved to bundu-docs / nyuchi-docs and whose HTTP surface is a 410.

The view therefore filters on `document->>'kind' IS NULL`. That predicate is exact: it
selects 571 rows, every one of which has source, across all thirteen collections; every
non-null `kind` (`doc_page` 16, `overview` 2, `deprecation-registry` 1, `guide` 1) has no
source and appears only in `documentation`.

**It is deliberately not `source_code IS NOT NULL`.** `kind` describes what the row _is_,
so the predicate still holds after the drop. Predicating on the column would empty the
entire registry the moment the drop landed.

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

### The fallback was a ramp, not an architecture — and it is gone

`resolveComponentSource(name, databaseSource)` read disk first and fell back to the
`source_code` column. It existed **only for the duration of the migration**: nodes moved
one PR at a time, so between the first extraction and the last drop most components still
lived only in the database, and a disk-only read path would have 404'd the whole registry
the moment it merged.

It is **deleted**, along with the `components:verify` drift gate and
`scripts/extract-components.ts`. All three read the `source_code` column, which is now
empty for all 571 rows, so all three were inert — the extraction script in particular could
only ever print "nothing to extract", since its input filter is
`typeof document.source_code === "string"`.

Deleted rather than left as dead code, because a fallback is a ramp: the moment a reader
can serve from two places the two can disagree, and making that impossible was the point of
moving source into git. The same argument retires the drift gate — a gate that compares one
copy against nothing is not a check, it is an invitation to recreate the second copy. If
source ever needs to come out of a database again, the script is one `git log` away.

Three properties of the surviving reader are load-bearing:

- **Absent is `null`, never `""`.** A 200 carrying an empty body is exactly how the
  pre-migration bugs hid. The registry route 404s on `null`.
- **A duplicate name throws for that name only.** A component name is unique across the
  registry, so two files claiming one name means an extraction went to the wrong node.
  One mislaid file must not take the route down for the other 300-odd components.
- **`outputFileTracingIncludes` in `next.config.mjs` is not optional.** The reads are
  dynamic (`readdir` + `readFileSync`), so Next's static trace cannot see them; without
  the explicit include the files are absent from the deployed lambdas and every read
  succeeds in `next dev` and 404s in production.

## How extraction ran

`scripts/extract-components.ts` (now deleted — see above) pulled one node at a time,
reading `component_documents` through PostgREST with the **anon** key. Extraction is a
read, and a read never needs to outrank a policy. Two of its rules are worth remembering
if anything like it is ever needed again:

- **It refused to write an empty file** for a component with no source. An empty `.tsx`
  typechecks and silently serves nothing.
- **It never overwrote a file already on disk.** By the time a file was committed it had
  been through tsc, eslint and prettier, and most needed fixing to survive that — so the
  database copy was by definition the version that never compiled, and a re-run would have
  restored every one of those defects.

Per node the gate was: extract → `pnpm typecheck` (fix what it exposes properly, rather
than narrowing types to fit) → `pnpm build && pnpm test` → PR → merge → **then** the
migration clearing that node's `source_code`.

Order run, by ascending risk:
**N9 (3) → N8 (13) → N5 (14) → N4 (14) → N7 (16) → N6 (52) → N3 (67) → N2 (143)**, then
the 249 the view had hidden.

## The order that mattered

**The drop ran after the files were merged AND deployed — never before.** Until the files
were live, the column was the only copy production could reach, so clearing it first would
have emptied `/api/v1/ui/{name}` for the entire registry — a 200 with an empty body, which
is precisely the failure mode this migration existed to remove.

The sequence, as executed:

1. Merge and deploy the 571 files.
2. Confirm one component per node serves real source from production. `nyuchi-tokens` went
   48382 → 46499 chars at this step, which is how we knew it had been serving the database
   copy and was now serving the file.
3. Clear `document.source_code` across all 571 rows **and**
   `document.versions[].sourceCode` plus the two nested `snapshot` blobs across the 556
   `versions` rows — `source_code` was one of four copies, and clearing only the column
   would have left the database full of component source.
4. Delete the ramp, the drift gate and the extraction script.

Rollback snapshot: `public.component_source_backup_20260802`, 571 rows, revoked from `anon`
and `authenticated`. Drop it once you are satisfied — left indefinitely it becomes the
second copy this migration removed.

## Known follow-ups

- **N1 `nyuchi-tokens` is not a component.** Its `source_code` holds a JSON token payload
  that `getDesignTokens()` parses. It moves too, but as data — not as part of the `.tsx`
  fan-out above.
- **N2 overlaps `components/ui/`.** The portal imports ~35 primitives from
  `components/ui/<name>.tsx` and `scripts/sync-registry.ts` writes them there from the DB.
  Extracting N2 to `components/registry/n2-primitives/` would put two copies on disk —
  precisely what this migration forbids. Settle which path is the one file before N2 is
  extracted; it is last in the order for that reason.
- ~~**`registry.json` does not exist**~~ — resolved. It is generated and committed, 571
  items. Its `name` also said `mukoko`, left over from the rebrand, while the `homepage`
  beside it already said `mzizi.dev`; that is the identifier the shadcn CLI shows
  consumers, and it is now `mzizi`.
- ~~**`components:verify` / the `--check` mode is due for deletion**~~ — done, along with
  `scripts/extract-components.ts` and `resolveComponentSource`.
- **The 556 `versions[].sourceCode` archive blobs were cleared with the column.** They were
  the only record of what each component looked like before extraction, since git history
  begins at the extraction commits; `component_source_backup_20260802` is now that record.
  Do not drop the backup table until you are content to lose it.
