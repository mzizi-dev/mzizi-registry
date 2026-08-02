# Moving component source out of Supabase and into this repo

> Status: **decided, barely started.** N11 is the pilot. Nothing else has moved.
> This reverses CLAUDE.md §8.3 / §15.1 for **source code only** — every other
> field stays in the database.

## 1. Why

Component source lives in `component_documents.document->>'source_code'`, so the
files do not exist on disk. That has a cost nobody wrote down: **the toolchain
cannot see the code.**

Concretely, in one session:

- A component could not be typechecked, linted, or rendered before changing it.
- Edits went to production through blind `jsonb_set` string replacement.
- A change referencing `aspect-media` shipped a utility that **nothing defines**
  for consumers — every installed card would have lost its aspect ratio
  silently, in someone else's app. A build would have caught it in seconds;
  instead it was caught by hand, afterwards.
- `nyuchi-cover-wash-header` was left unfixed _specifically_ because a
  structural JSX edit could not be compiled first.

None of those are database problems. They are consequences of the source not
being a file.

## 2. What moves, and what does not

| Stays in Supabase                                             | Moves to this repo |
| ------------------------------------------------------------- | ------------------ |
| description, category, node, nodeLabel, status, framework     | `source_code`      |
| dependencies, registryDependencies, files, urls, platforms    |                    |
| `currentVersion` + `component_versions` (the version history) |                    |
| `component_docs`, `changelog`, every `styling-*` collection   |                    |

The database keeps being the system of record for **what a component is**. The
repo becomes the system of record for **what it does**.

## 3. The precedent — this is not a new pattern

`mzizi-skills` already did exactly this reversal. Skills used to be authored in
Supabase; git is now the source of truth and `pnpm skills:sync` projects the
committed bundle **into** the `skills` collection, so `/api/v1/skills*` and the
MCP keep serving unchanged (mzizi-tools CLAUDE.md §8, this repo's §15.23).

Copy that shape rather than inventing one. `scripts/sync-registry.ts` currently
runs DB → disk; it becomes **disk → DB for source only**, plus a `--check` drift
gate, writing as `authenticated` through RLS with an M2M-minted JWT. **There is
no service-role path**, for the same reason there is none for skills.

## 4. Serving: projection by default, disk at build time for N11

Two different answers, deliberately:

- **Default (N2–N9): keep the DB as the serving projection.** The API and the
  shadcn CLI never notice the migration, which is what makes it safe to do one
  node at a time with consumers unaffected throughout.
- **N11 `discovery`: `/api/v1/ui/{name}` reads source from DISK at build time.**
  N11's covenant is "if the machine can't see it, it doesn't exist", and its
  components are the ones that emit machine-visible output. Reading them at
  build time means a broken discovery component fails `pnpm build` rather than
  being served to a crawler — the guarantee is worth more here than the
  indirection of a projection.

N11 is therefore also the pilot: smallest surface, strongest reason.

## 5. Order — and the correction to "start at 11 and work down"

N10 and N11 held **no** components at all, so the migration cannot literally
start at 11 and descend. What each rung actually is:

| Rung | Holds                                                            |
| ---- | ---------------------------------------------------------------- |
| N11  | `nyuchi-seo` — reclassified here from N6 (see §6). The pilot.    |
| N10  | **No components, by design.** Documentation is MDX in this repo. |
| N9   | 3 components — `nyuchi-fundi`, `-learning`, `-reporter`.         |

**N10 gets no components and that is the correct answer, not a gap.** Its
covenant is "the system documents itself in code", and §15.17 settles how:
`.mdx` under `app/`, compiled by `@next/mdx`, so a page referencing something
that no longer exists fails the build. Documentation is pages, not components.

Then downward by size and risk: N9 (3) → N8 (13) → N5 (13) → N4 (14) → N7 (16)
→ N6 (53) → N3 (64) → N2 (143). 319 components, ~1.1 MB of source in total.

## 6. `nyuchi-seo` was at N6, and that is why N11 looked empty

It generates head metadata, Open Graph tags, Twitter Cards and Schema.org
structured data. That implements machine visibility and composes nothing, so
N6's covenant ("a page is a composition, not an implementation") never fit it.
Moved to N11 `discovery`.

`nyuchi-page` **stays at N6** and was deliberately not moved: it is a genuine
page wrapper that carries SEO among several concerns, so its node is right even
though its description mentions Open Graph. The test is what a component _is_,
not which words appear in it.

## 7. The sample `globals.css` — and the hole it closes

Ship a reference token stylesheet consumers copy.

This is not a nicety. Today **nothing distributes the CSS custom properties**:
there is no registry item carrying them (`token-row` is a data-display
primitive, not the token source), and consumer apps take tokens from
`@bundu/ui`. That is exactly how a component can reference `--aspect-media` with
nothing defining it. Until the sample ships, components must keep referencing
tokens with an inline fallback — `aspect-[var(--aspect-media,1/1)]` — so they
stay independently installable (§15.6).

## 8. What has actually been done

- `nyuchi-seo` reclassified N6 → N11 (migration
  `nyuchi_seo_belongs_to_n11_discovery`). N11 now has one component.
- Nothing has moved to disk yet. `scripts/sync-registry.ts` still runs DB → disk.
- The `discoverability` skill already exists in git (`mzizi-skills`) and in the
  `skills` collection — it needs **wiring to N11**, not authoring.
