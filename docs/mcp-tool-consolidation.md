# The MCP tool surface consolidates to 10

Specified by the repo owner, 2026-08-04.

## Current state, measured not assumed

`mcp_tool_registry` holds **66 rows, 62 enabled**, across 18 categories. There is
one registry table — no v2 exists. A connected MCP client is served all 62. So the
consolidation below is the target, and nothing has been retired yet.

Note the drift this already caused: the `mcp-tool-registry` collection in
`component_documents` holds **60** rows against the table's 66, so the projection was
already 6 tools stale.

## The 10

| #   | Tool                  | Replaces                                                                                                                                                                                                            | Why it earns a slot                                                                                              |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `search`              | `search_components`, cross-resource discovery                                                                                                                                                                       | One entry point. An agent that does not know the vocabulary starts here.                                         |
| 2   | `get_component`       | `get_component`, `read_documents`, `get_component_history`, `get_component_links`, `get_component_status_history`, `resolve_primitive`, `list_primitive_sources`                                                    | **One read, everything**: metadata, deps, `files[]`, source URL, a11y, variants, version history. The workhorse. |
| 3   | `list_components`     | `list_components`, `list_collections`, `get_node_categories`, `get_node_counts`                                                                                                                                     | Filtered index — node, owner, collection, status, dnaRole. Never a fixed node range.                             |
| 4   | `get_tokens`          | `get_brand_tokens`, `list_brand_token_categories`, `get_token_counts`, `list_ecosystem_brands`                                                                                                                      | `family` param: minerals \| heritage \| status \| experimental \| semantic \| spacing \| radius \| type.         |
| 5   | `get_architecture`    | `get_architecture`, `get_node_detail`, `get_node_documents`                                                                                                                                                         | The helix, plus optional per-node detail. Uncapped node arg.                                                     |
| 6   | `get_doctrine`        | `get_ubuntu_pillars`, `get_ubuntu_principles`, `get_ubuntu_doctrine`, `get_ubuntu_counts`, `list_bundu_conventions`, `get_bundu_convention`, `get_simplify_guidance`, `get_ai_instructions`, `list_ai_instructions` | `topic` param. All of it is "how to build here".                                                                 |
| 7   | `get_skills`          | `list_skills`, `get_skill`, `get_skills_summary`                                                                                                                                                                    | List or fetch one. Standalone because skills are what agents load first.                                         |
| 8   | `check_accessibility` | `calculate_contrast_ratio`, `relative_luminance`, `simulate_color_blindness`, `run_accessibility_audit`, `get_accessibility_summary`                                                                                | `mode` param. APCA/AAA is doctrine, so this stays first-class.                                                   |
| 9   | `report_issue`        | `submit_component_feedback`, `record_observability_event`, `record_chaos_event`                                                                                                                                     | The three public write sinks behind one `kind`. Feeds N9.                                                        |
| 10  | `fundi`               | `fundi_status`, `fundi_submit_test`, `fundi_task_status`, `fundi_cancel_task`                                                                                                                                       | `action` param. Submit-and-poll preserved — must never block.                                                    |

## What this is not

**Not `enabled = false` on 52 rows.** Only `get_component`, `list_components`,
`get_architecture` and `get_skills` keep their names, and every one of them absorbs
tools it does not currently implement — `get_component` alone takes on six. The other
six tools do not exist at all. This is an implementation task in the server, with
retirement as its last step, not a registry edit.

## Constraints carried over

- **Retirement goes through `enabled = false`**, never `stability`, whose enum has no
  `deprecated` member and which `server.ts` never selects.
- **`fundi` must not block.** Submit-and-poll is the entire reason the A2A bridge
  exists; an `action` param collapsing four tools into one must not tempt a
  poll-until-done loop inside a single call.
- **Never cap the node set.** `list_components` and `get_architecture` take an
  uncapped node argument — a Zod `.max()` rejects the filter before it reaches the
  store, which is how asking for N11 returned a schema error instead of an answer.
- **`report_issue` stays honestly annotated.** It is a write: not read-only, not
  idempotent.
- **The registry itself moves to the repo** (`docs/db-contents-rule.md`), so the 10
  are defined beside the server that serves them rather than in a table.

## Sequencing

1. Implement the 10 in `mzizi-mcp` (`nyuchi/mzizi-tools`), each covering its full
   replaces-list.
2. Prove coverage: every one of the 62 current tools answered by one of the 10, with
   no capability silently dropped.
3. Move the tool definitions into the repo.
4. Retire the 52 via `enabled = false`.
5. Regenerate `tool-manifest.json` and re-run the drift gate.
