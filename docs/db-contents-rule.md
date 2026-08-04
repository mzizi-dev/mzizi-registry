# What the database is allowed to hold

Decided by the repo owner, 2026-08-04. This supersedes every earlier statement that
Supabase is the default home for Mzizi data.

## The rule

> The DB only exists for version history, node counts, fundi-related logging, the
> issue log and the self-healing log. Subscriptions and customer data live in their
> own store. **Everything else is in the repo.**

The test is **who writes it**. A script, a release, or telemetry writes to the
database. A human writes to a file, where a diff and a reviewer can see it.

## Audit — 2026-08-04

Taken against the live project, not against documentation.

### Allowed, and staying

| Object                                                 | Rows  | Why it qualifies      |
| ------------------------------------------------------ | ----- | --------------------- |
| `component_versions_store` + `component_versions`      | 2,099 | Version history       |
| `versions` collection in `component_documents`         | 1,540 | Version history       |
| `tool_versions`                                        | 110   | Version history       |
| `fundi_issues`                                         | —     | The issue log         |
| `fundi_healing_log`                                    | —     | The self-healing log  |
| `observability_events`, `chaos_events`, `usage_events` | 4,588 | fundi-related logging |
| `observability_domains`, `observability_analytics`     | —     | fundi-related logging |

**"Node counts" is a derived answer, not a stored one.** Nothing should hold a
counts table; a count is `count(*)` over whatever the node set currently is. This
matters because a stored count is the oldest drift bug in this system — see the
"never hardcode counts" rule in CLAUDE.md §11.

### Must move to the repo

| Object                                   | Rows | Destination                                                                               |
| ---------------------------------------- | ---- | ----------------------------------------------------------------------------------------- |
| `nodes_store` + doctrine views           | 126  | `content/doctrine/` — **extracted 2026-08-04**                                            |
| `instructions_store` / `ai_instructions` | 3    | `content/doctrine/ai-instructions/` — **extracted**                                       |
| `skills` view, `_backup_skills_20260701` | 9    | `nyuchi/mzizi-tools` — already authoritative there                                        |
| `components_store` + `components`        | 571  | Component metadata alongside the source on disk                                           |
| `brand_store` + ~19 `brand_*` views      | 259  | Tokens; `pnpm tokens:sync` already generates the repo artifacts, so the direction inverts |
| `mcp_tool_registry`                      | 66   | Tool definitions belong beside the server that serves them                                |
| `documentation_pages`                    | —    | Historical; content already left                                                          |

### Delete — superseded, and two violate CLAUDE.md §6.1

§6.1: _"The DB never holds component code — not source, not a snapshot, not an
archive blob."_ Two of these hold exactly that. Source was dropped from the live
tables and kept in backups, so the rule read as satisfied everywhere anyone looked.

| Table                                  | Rows  | Size  | Note                                  |
| -------------------------------------- | ----- | ----- | ------------------------------------- |
| `_rearch_snapshot_component_documents` | 3,190 | 14 MB | 2,499 documents contain `source_code` |
| `component_source_backup_20260802`     | 2,111 | 11 MB | 571 rows with non-empty `source_code` |
| `_audit_backup_20260727`               | —     | —     | Superseded audit snapshot             |
| `_backup_skills_20260701`              | —     | —     | Skills are files in `mzizi-tools`     |

### Needs a decision

- **`changelog_store` (64 rows).** Release history, which is adjacent to "version
  history" but is not the same thing: it is prose someone writes per release, and
  the release-bump workflow in CLAUDE.md §14 writes it by hand. By the who-writes-it
  test it belongs in the repo.
- **`first_party_clients`.** An auth allow-list — operational config rather than
  content or telemetry. Neither category in the rule covers it.

## Ordering — this part is not optional

The extracted rows still **serve** live surfaces: `/api/v1/architecture`,
`/api/v1/ubuntu/*`, `/api/v1/ai/instructions`, `/api/v1/skills*`, and the MCP read
tools. Deleting a row before its reader moves takes the endpoint down.

1. Extract to files. (Doctrine: done. Metadata, tokens, tool registry: not yet.)
2. Repoint `lib/db` and the `/api/v1` routes to read the files.
3. Verify the routes green against the files, with the DB rows still present.
4. **Then** delete the rows.

The four `delete` tables above are the exception — nothing reads them, so they can
go independently of steps 1-3.
