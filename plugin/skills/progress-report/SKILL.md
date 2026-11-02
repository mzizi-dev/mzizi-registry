---
name: progress-report
description: Use this skill whenever dev work starts, in any repo. All dev work runs on a 10-minute progress-report loop. When the work starts, schedule a recurring report every 10 minutes (in Claude Code, `/loop 10m <report prompt>` or CronCreate `*/10 * * * *`; the cron dies with the session and expires after 7 days; on surfaces without cron, report at each natural checkpoint). Measure, don't guess. Each report has 20-cell progress bars with a percentage and a one-line basis (plan steps done of total from the plan doc or tracking issue, features done, code migrated as lines in the new tree against the old, and an Overall bar labelled "estimate" when it is not exact). For each workstream it gives open PRs, the latest release or tag, staging ahead of main, CI, a live HTTP check for deployed sites, and published against draft counts for content. It ends with one "Since last report:" line and a final "Needs you:" line (owner actions and decisions, or "nothing"). When nothing changed, report a single line. Ticks are read-only: never publish, release, merge, delete or deploy from a tick unless the owner already approved that specific action. No secrets and no PII in a report. The loop stops when the work is done (one final report with the outcome) or when the owner says stop. Ships progress.sh, a portable read-only script (bar, pct, repo, lines, http).
user-invocable: true
---

# Progress report: measured, every ten minutes

> **Covenant:** _The owner should never have to ask "where are we?"_

All dev work runs on a 10-minute progress-report loop. The owner reads the reports to decide
what to do next, so every number in them is measured, and every report ends with what the
owner has to do. A report that guesses is worse than none, because it is believed.

This skill has four parts: **starting** the loop, **what a report holds**, **the rules for a
tick**, and **stopping**. The script `progress.sh` in this skill folder renders the bars and
reads the repo state for you.

## Get the script

`progress.sh` is portable bash (3.2+) for macOS and Linux. It is **read-only**: it reads git,
the GitHub API (through `gh`) and HTTP status codes, and never writes anything.

| Where you are                   | Path                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@nyuchi/mzizi-skills` from npm | `node_modules/@nyuchi/mzizi-skills/skills/progress-report/progress.sh`                                                  |
| The public `mzizi` plugin       | `skills/progress-report/progress.sh` in the plugin                                                                      |
| Only the MCP                    | `curl -fsSL https://unpkg.com/@nyuchi/mzizi-skills/skills/progress-report/progress.sh -o "${TMPDIR:-/tmp}/progress.sh"` |

```bash
P="${TMPDIR:-/tmp}/progress.sh"   # or one of the paths above
bash "$P" bar 78 "Plan steps" "7 of 9"          # Plan steps   ████████████████░░░░   78%   7 of 9
bash "$P" pct 7 9                               # 78
bash "$P" repo mzizi-dev/agent-tools            # open PRs, latest release, staging vs main, CI
bash "$P" -C "${TMPDIR:-/tmp}/task/app" lines origin/staging app/   # lines under app/ at that ref
bash "$P" http https://mcp.mzizi.dev/ https://mzizi.dev     # status code per deployed site
```

`lines` counts the committed tree at a ref (`git grep -c ''`, binary files skipped), never the
working copy, so two reports on the same commit give the same number. `repo` reads only, every
page of each list. Its CI line takes the newest run of each GitHub Actions workflow, the
checks of other apps, and the commit statuses (deploy integrations often post only a status)
on the default branch's head, and names what failed. A workflow whose newest run was
cancelled is shown as cancelled (`; 1 cancelled: CI`), neither green nor red, because nothing
finished it; read that as "not verified", never as passing. `pct` and
`bar` never round unfinished work up to 100%.

## Starting the loop

When dev work starts, schedule the report before you write any code:

- **Claude Code:** `/loop 10m <report prompt>`, or CronCreate with `*/10 * * * *`. The cron
  lives in the session: it dies when the session ends and expires after 7 days, so a long build
  re-arms it in each new session.
- **Surfaces without cron** (a chat, a CI job, an agent with no scheduler): report at each
  natural checkpoint instead, such as a PR opened, CI finished, a merge, a release, or a
  blocker.

The report prompt names the work and where its measures come from, for example:

```text
Progress report for the Toddle rebuild (nyuchi/toddle-enhancement-extension#41).
Bars: plan steps from the checklist in #41; features from the feature table in docs/plan.md;
code migrated = lines in app/ vs src/ at origin/staging. Workstreams: the repo, the Chrome Web
Store listing. Use the progress-report skill. Read-only.
```

Write the measures down once, in the tracking issue (see "Track big work in GitHub issues").
Then every tick measures the same thing the same way.

## What a report holds

### 1. Progress bars

Each bar is 20 cells of `█` and `░`, a percentage, and a **one-line basis**: what was counted.
Use `progress.sh bar` so every bar has the same width and alignment. Typical bars:

| Bar           | Basis (measured)                                                                     |
| ------------- | ------------------------------------------------------------------------------------ |
| Plan steps    | Steps done of total, from the repo's plan doc or the tracking issue's checklist.     |
| Features done | Features shipped of the features listed in the plan.                                 |
| Code migrated | Lines in the new tree against the old (`progress.sh lines`), at the same ref.        |
| Overall       | How it combines the others. Labelled `(estimate)` and shown as `~N%` when not exact. |

Only show a bar you can measure. If there is no checklist, say so and don't invent a
denominator. A bar never reads 100% for unfinished work: `progress.sh` keeps a cell empty
until the count is complete.

### 2. Per workstream

For each repo, service or content stream the work touches:

- **Open PRs**, the **latest release or tag**, **staging ahead of main**, and **CI** on the
  default branch: `progress.sh repo <owner/repo>`.
- **Deployed sites:** a live HTTP check (`progress.sh http <url>…`). Report the status code
  you got; don't call a site live without one.
- **Content**, when the work includes it (Intercom articles, Sanity documents, store
  listings): the **published** count against the **draft** count, read from the source's API
  or MCP.

### 3. Since last report

One line: what changed since the previous tick (a PR merged, CI went green, a bar moved from
68% to 74%).

### 4. Needs you

The **last line** of every report: `Needs you:` and the owner actions and decisions that block
the work, each one specific enough to act on. Write `Needs you: nothing` when nothing does.

### When nothing changed

If nothing changed since the last tick, the whole report is one line, such as
`10:40 no change since 10:30 (PR #212 CI still running). Needs you: nothing.`

## Example

The Toddle rebuild format, partway through (the numbers are illustrative):

```text
Progress report 14:20 (Toddle rebuild, nyuchi/toddle-enhancement-extension#41)

Features rebuilt (UI)   ████████████████████   100%   every visible feature is React in app/
Plan steps              ████████████████░░░░    78%   7 of 9
Code in app/            ██████████████░░░░░░    69%   16,090 app/ · 7,266 src/
───────────────────────────────────────────────
Overall (estimate)      ███████████████░░░░░   ~75%   plan steps, weighted by code moved

nyuchi/toddle-enhancement-extension
  open PRs        2 (#58 settings panel, #59 remove src/)
  latest release  v1.6.0 (2026-10-05)
  staging vs main 4 ahead, 0 behind
  CI on main      green (9 checks)
Chrome Web Store  1.6.0 published, 1.7.0 draft staged

Since last report: #57 merged; code in app/ 64% → 69%.
Needs you: approve the 1.7.0 store submission (staged, not submitted).
```

## Rules for a tick

- **Ticks are read-only by default.** Never publish, release, merge, delete or deploy from a
  report tick unless the owner already approved that specific action. A report observes the
  work; it does not do it. Installing an approved test build is fine when the owner set that
  up.
- **Measure, don't guess.** Every number comes from a command, an API or a file you read in
  this tick. If a read fails, say `?` and why, rather than reusing an old number.
- **Privacy.** No secrets, tokens or credential status, and no personal information (names of
  members of the public, emails, phone numbers) in a report. Name a secret by its name, never
  its value.
- **Short.** A report is read on a phone between other things. Bars, workstreams, one "Since
  last report" line, then "Needs you".

## Stopping

The loop stops when:

- **the work is done:** send one final report with the outcome (what merged, what is live and
  verified, what is left) and its "Needs you" line, then cancel the loop; or
- **the owner says stop.**

Cancel the scheduled job (`CronDelete`, or end the `/loop`) so nothing keeps reporting on
finished work.

## Checklist

- [ ] The loop is scheduled (10 minutes) or, without cron, checkpoints are named.
- [ ] Each bar has a measured basis; the Overall bar says `estimate` when it is one.
- [ ] Each workstream shows PRs, release, staging vs main, CI, live HTTP, and content counts.
- [ ] One "Since last report:" line, and "Needs you:" is the last line.
- [ ] Nothing published, released, merged, deleted or deployed by a tick without approval.
- [ ] No secrets, no PII.
- [ ] A final report when the work is done, and the loop cancelled.
