---
name: ship-release
description: "Use this skill whenever you release a Mzizi repo, meaning staging goes to main and the change goes live (npm, Cloudflare Workers, docs.mzizi.dev, mzizi.dev). It is the runbook: cut the release branch off origin/main with staging's exact tree in one commit and prove the tree hashes are equal, the PR title and the issue line in its body, the version rule (next minor above npm, a CHANGELOG entry per bumped version in the repo's own heading style, majors need the owner), the main-gate failure about commits that staging may not have and its owner-only forward-ported label (never --admin), the merge queue (the repo convention `gh pr merge N --squash --auto`, the REST route as the fallback where GraphQL is blocked, and which method each queue really uses), stale checks, a publish that npm lists late, immutable releases, and verifying LIVE with commands. Ships verify-live.sh, which only reads. A release is live when the live commands say so, never when it merges."
---

# Ship a release: staging to main, then prove it is live

> **Covenant:** _A release is done when the live commands say so, not when the PR merges._

Releases go live without sitting around. The owner's direction is to choose the practice that
keeps releases moving and every claim checkable: cut, check, queue, publish, verify, report.
This skill is the runbook, written from the releases that stalled for the same few reasons.

It has seven parts: **cut**, **versions**, **the main gate**, **queues**, **stale checks**,
**publish**, and **verify live**. `verify-live.sh` in this skill folder prints the live state.

**Scope.** Which repos release this way: the org's repos with a `staging` branch that deploys
or publishes from `main` (agent-tools, mzizi-registry, mzizi-api, mzizi-docs, mzizi-site,
packages-npm). Each repo's own `AGENTS.md` wins where it differs. Who may release: only the
owner, or an agent the owner authorised for that release. Without that authority, stop at a
merged PR into `staging` and say so in "Needs you:".

## Get the script

`verify-live.sh` is portable bash (3.2+) and **read-only**: it reads npm, the GitHub API
(through `gh`) and HTTP responses, and never publishes, tags or deploys.

| Where you are                   | Path                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `@nyuchi/mzizi-skills` from npm | `node_modules/@nyuchi/mzizi-skills/skills/ship-release/verify-live.sh`                     |
| The `mzizi-dev` plugin          | `skills/ship-release/verify-live.sh` in the plugin                                         |
| Only the MCP                    | Install the package, then use the first path: `npm install --no-save @nyuchi/mzizi-skills` |

Run it as `bash "$V" ...`. It is committed executable (like `hygiene.sh` and `progress.sh`), but
npm packs every file as mode 644, so the copy from npm has no execute bit: `bash` works
everywhere, `./verify-live.sh` only from a git checkout. `bash "$V" --help` prints the usage.

```bash
V="${TMPDIR:-/tmp}/verify-live.sh"   # or one of the paths above
bash "$V" npm @nyuchi/mzizi-skills @nyuchi/mzizi-skills@0.19.0   # latest, and is 0.19.0 listed yet
bash "$V" api                                                     # status and X-Mzizi-Source of /v1/brand
bash "$V" mcp                                                     # catalogue version, registry commit, evil-origin probe
bash "$V" release mzizi-dev/agent-tools '@nyuchi/mzizi-skills@0.19.0'   # tag and release exist (a draft shows draft=true), notes length
bash "$V" http https://docs.mzizi.dev/ https://mzizi.dev/         # status per page
```

## 1. Cut the release branch

A release PR is `main` plus `staging`'s exact tree in **one commit**. Work in your own clone
(see the `digital-hygiene` skill), never in another agent's.

```bash
git fetch origin main staging
git checkout -B release/2026-11-04-skills origin/main     # release/<date>-<name>
git read-tree --reset -u origin/staging                    # the index and working tree become staging's
git commit -m "chore(release): staging to main, 2026-11-04 (@nyuchi/mzizi-skills 0.19.0)"
test "$(git rev-parse 'HEAD^{tree}')" = "$(git rev-parse 'origin/staging^{tree}')" && echo "trees equal"
git push -u origin release/2026-11-04-skills
```

- If `git commit` says `nothing to commit`, `main` already holds `staging`'s tree: there is
  nothing to release, and you say so instead of opening a PR.
- **Title:** `chore(release): staging to main, <date> (<package versions>)`.
- **Body:** a line that starts with `Refs <owner>/<repo>#n`, `Refs #n`, `Closes #n` or
  `No issue: <reason>`, on its own line. A mention in the middle of a sentence does not count.
  Where the repo's `AGENTS.md` asks for release notes in the PR body, paste what the release
  will carry (the CHANGELOG sections), and the `Site/docs/skills impact` heading if it asks.
- **Never** a merge commit or a rebase here: the point of one commit is that the diff against
  `main` is exactly what `staging` holds. If the trees differ, stop and find out why.
- After a re-cut or a force-push of the branch, check the labels on the PR again (part 3).

## 2. Versions

- A package version must be the **next minor** above the highest on npm: x.y.z becomes
  x.(y+1).0. Read npm, not the file: `npm view <package> version` (for a list,
  `npm view <package> versions --json`). The release job refuses anything else.
- **Majors need the owner**, and go only through a manual workflow run with `bump: major`.
- `CHANGELOG.md` needs an entry for **each bumped version**, and **the heading style is the
  repo's own**: read its `AGENTS.md` (and `CLAUDE.md`) and copy the newest entry. Do not carry
  one repo's heading into another. Read on 4 November 2026:

  | Repo                                    | Heading                                                                         | Where                                              |
  | --------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
  | `packages-npm`                          | `## [@bundu/ui 0.12.0] - 2026-11-04`                                            | a dated section per version (its `CLAUDE.md`)      |
  | `agent-tools`                           | `### mzizi-skills 0.19.0 — what changed (2026-11-04, [#343](<issue URL>))`      | under `## [Unreleased]`, one `###` per package     |
  | `mzizi-registry`                        | `### Changed — what changed (2026-11-04, #PR)`, then `## [4.25.0] - 2026-11-04` | entries under Unreleased; a release dates them     |
  | `mzizi-api`, `mzizi-docs`, `mzizi-site` | `### Changed — what changed (2026-11-04, [#n](<issue URL>))`                    | under `## [Unreleased]`; no version in the heading |

  In `agent-tools` the publish job builds the release notes from the `###` headings that name
  the package and version, and a version without one fails before `npm publish`. In
  `packages-npm` the release job needs the `## [<name> <version>]` section. For the others, read the
  "Release notes" section of the repo's `AGENTS.md`. Whatever the style, the heading must be unique under
  `## [Unreleased]` (markdownlint MD024).

- If `package.json` was already bumped for a version that has since reached npm, bump again
  before the release PR, or the job has nothing valid to publish.
- Do not bump a version a repo's rules leave to tags (a staging patch tag is the workflow's
  job, never yours).

## 3. The main gate and the `forward-ported` label

The org's main gate (`release-version-check`, which runs `main-gate.sh`) can fail with:

```text
'main' has 1 commit(s) since the last release that staging may not have; this release would delete them
```

It fails when `main` holds commits that `staging`'s history does not. The repos' `AGENTS.md`
name the usual cause, commits that exist only on `main` and that `staging` lacks (forward-port them first). A
release itself also leaves commits on `main` that `staging` never contains (see part 4), and the
gate has been seen to fire after one. Which commits it counts is defined in `main-gate.sh` in
the org's `.github` repository, which a session often cannot read: read the failing job's log
rather than assuming. When the trees are equal, nothing would be deleted; the documented lane
for that is the **`forward-ported` label** on the release PR.

**That label is an owner decision, made per release.** Add it only when the owner has said so
for this release, and only after you have checked both of these:

1. The tree hashes are equal (part 1), and
2. The main gate is the **only** failing check on the PR:

```bash
SHA=$(gh api repos/OWNER/REPO/pulls/N --jq .head.sha)
gh api "repos/OWNER/REPO/commits/$SHA/check-runs?per_page=100" --jq '.check_runs[] | [(.conclusion // .status), .name] | @tsv'
```

Then label the PR and re-run only the failed jobs:

```bash
gh api -X POST repos/OWNER/REPO/issues/N/labels -f 'labels[]=forward-ported'
gh api "repos/OWNER/REPO/actions/runs?head_sha=$SHA&per_page=30" --jq '.workflow_runs[] | [.id, .name, .conclusion] | @tsv'
gh api -X POST repos/OWNER/REPO/actions/runs/RUN_ID/rerun-failed-jobs
```

- **Never `--admin`**, never skip or disable the gate, never merge past a red check. Org admins
  can bypass rulesets; agents never do.
- If any other check fails, fix that first. The label does not cover it.
- Prevention: forward-port `main`-only commits into `staging` before cutting, and open
  every pin bump into `staging` (see `registry-propagation`). After the release, sync `main` back into `staging` as the repo's
  `AGENTS.md` says, so the trees match before more work lands. Compare trees, not
  ahead/behind counts.

## 4. Merge queues

- **The two queues use different methods.** In all six repos (read from the rulesets on
  4 November 2026: `gh api repos/OWNER/REPO/rulesets`, then `.../rulesets/ID`, field
  `rules[].parameters.merge_method` of the `merge_queue` rule), `merge-queue-staging` is
  **SQUASH** and `merge-queue-main` is **MERGE**. The `AGENTS.md` files agree once read closely:
  "squash merges through the queue" is the `staging` rule, and they say `merge-queue-main` stays
  MERGE. Where they say a release "lands as one squash commit", they mean the **release branch**
  is one commit (part 1). The queue then lands it on `main` as a **merge commit** with two
  parents (mzizi-registry `main` `c3e6e87`, "Merge pull request #623", is one; its second parent
  is the one-commit release branch). Neither commit is in `staging`'s history, so after a
  release the trees match and the ancestry does not: compare trees, never ahead/behind counts,
  and sync `main` back into `staging` (the repo's `AGENTS.md`). Do not choose a method by hand;
  enqueue and let the queue use its own. Ruleset reads can be refused for an agent: say so
  rather than guessing.
- **The repo convention is `gh pr merge <n> --squash --auto`** (every repo's `AGENTS.md`, "Merge
  convention"): it adds the PR to the queue, and the queue applies its own method. Never
  `--admin`.
- **The fallback, where GraphQL is blocked.** Cloud sessions block GraphQL, so
  `gh pr merge --auto` fails there. Then enable auto-merge with the GitHub MCP
  `enable_pr_auto_merge` tool or the REST route that session's own GraphQL error
  names. It does the same job, and it is the fallback, not the convention:

```bash
gh api -X PUT repos/OWNER/REPO/pulls/N/ccr/auto_merge -f merge_method=squash   # a staging PR
gh api -X DELETE repos/OWNER/REPO/pulls/N/ccr/auto_merge                       # to take it back
```

For a release PR into `main`, do not argue with the queue: its method is MERGE, and release
PRs there have landed as merge commits (mzizi-registry #623, agent-tools #358).

- Enqueue only past the merge gate: the work is complete, CI is green, it is verified at
  runtime, and `/code-review` has run with its findings resolved.
- A **dequeue with `MERGE_CONFLICT`** means the base moved. Merge `staging` (or `main`, for a
  sync PR) into your branch and resolve. In `CHANGELOG.md`, a conflict under
  `## [Unreleased]` almost always means two PRs each added entries: **keep both sides**.
  Push, then enqueue again.

## 5. Stale checks

`issue attached` reads the PR body from the **event snapshot**, so fixing the body does not
change a check that already ran. After you fix the body, save it again to fire a fresh event
(change it by a character and back, or `gh api -X PATCH repos/OWNER/REPO/pulls/N -F body=@body.md`),
then read the new run. The same goes for a label: a check that read the labels before you
added one needs a re-run.

## 6. Publish

On a merge to `main` the release workflow runs `npm publish` (trusted publishing, no token)
and then a tag step.

- npm can take **minutes** to list a version after `npm publish` prints `+ pkg@version`. The
  tag step can run first, print `not on npm, not tagged`, and make **no tag and no release**.
  Wait until npm lists it (`bash "$V" npm <package>@<version>` says `listed`), then re-run the
  workflow run **once**:

```bash
gh api "repos/OWNER/REPO/actions/runs?branch=main&per_page=10" --jq '.workflow_runs[] | [.id, .name, .status, .conclusion] | @tsv'
gh api -X POST repos/OWNER/REPO/actions/runs/RUN_ID/rerun
```

- **Releases are immutable.** The workflow creates a release as a draft with its notes, then
  publishes it once. Never edit a published release, never move or delete and re-create a tag,
  never re-upload an asset. A wrong release is corrected by the next version, not by editing
  this one.

## 7. Verify LIVE

Merged is not live. Cloudflare deploys lag a minute or two behind a merge to `main`, so a
stale answer in the first minutes is not a failure; read again before you report. Check what
the release claims, by its own value:

```bash
npm view @nyuchi/mzizi-skills version                  # npm has the version
bash "$V" release mzizi-dev/agent-tools '@nyuchi/mzizi-skills@0.19.0'   # tag, release (draft=false) and notes
curl -sI https://api.mzizi.dev/v1/brand | grep -i x-mzizi-source        # registry=<sha> the API serves
curl -s https://mcp.mzizi.dev/catalogue.json | head -c 400              # version, source.registry
curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'Origin: https://evil.example' \
  -H 'Content-Type: application/json' -d '{}' https://mcp.mzizi.dev/mcp    # 403
curl -s -o /dev/null -w '%{http_code}\n' https://docs.mzizi.dev/           # 200
```

`bash "$V" api`, `bash "$V" mcp` and `bash "$V" http <url>...` print the same facts without
the greps. For a site, the spacing guard runs from a `mzizi-site` checkout (Playwright
installed; `PW_EXECUTABLE` names a Chrome or Chromium binary). Point it at the live URL or a
Cloudflare preview, never a bare `python3 -m http.server` (the site's clean URLs 404 there), and
write its output outside the repo:

```bash
PW_EXECUTABLE=/opt/pw-browsers/chromium node scripts/audit-ui.mjs --url https://mzizi.dev --guard --out "${TMPDIR:-/tmp}/audit-out"
```

Report each product as **live** only with the value you read this minute, and say what is
still waiting (a queued deploy, a bot PR, a registry pin). Use the status format in the
`progress-report` skill.

## Do not

- Do not use `--admin`, add `forward-ported` without the owner's word for this release, or
  skip or disable a test or gate to go green.
- Do not cut a release you were not authorised to cut, or promote `staging` while it holds work
  the owner has not approved.
- Do not edit or move a published tag or release.
- Do not write a secret, a token or credential status into a PR body, a report or an issue.

## Checklist

- [ ] Branch cut off `origin/main` with `staging`'s tree in one commit; the two tree hashes are equal.
- [ ] Title is `chore(release): staging to main, <date> (<package versions>)`; the body has an issue line at the start of its own line.
- [ ] Each bumped version is the next minor above npm and has a CHANGELOG section; no major without the owner.
- [ ] If the main gate is the only failure and the owner said so: `forward-ported` added, failed jobs re-run, label still there after any re-cut.
- [ ] Enqueued with `gh pr merge <n> --squash --auto` (or, where GraphQL is blocked, the MCP tool or the REST route), past the merge gate; no `--admin`.
- [ ] Publish confirmed on npm before the one workflow re-run; no release edited.
- [ ] Verified live with the commands above, a minute or two after the deploy; each product reported with the value read.
