---
name: pr-gates
description: Use this skill before the first push of any pull request in a Mzizi repo, and whenever a required check is red. It makes the first push green by naming the checks that failed again and again and the fix for each: issue attached (the line must start with Closes, Fixes, Refs or No issue and sit on its own line), changelog entry required (an entry under Unreleased with a descriptive heading, so markdownlint MD024 does not flag duplicates; no-changelog only for CI, lint or typo changes), markdownlint, yamllint line length, no agent-local files (never commit CLAUDE.md or .claude), oxfmt and vp fmt (CI is the authority, never format a whole package locally), CodeQL (bad HTML filtering regexp, polynomial regular expression), parity (strict ignores EXPECTED), rendered-content gates, the version policy on staging, CHANGELOG merge conflicts and merge methods. Never skip a test, never --admin.
---

# PR gates: make the first push green

> **Covenant:** _A red check is information. Fix its cause; never switch the check off._

Most red first pushes in the Mzizi repos fail on the same dozen checks. Each has a cause you can
read before you push and a fix that leaves the check meaning what it meant. This skill lists
them. It is not a way around a gate: **never skip, disable or loosen a test or a check to go
green, and never `--admin`.** If a gate is wrong, say so in the PR and let a person change it.

Each repo's own `AGENTS.md` is the authority where it differs, and CI is the authority over
anything you ran locally.

## Before you push

```bash
git status --short                                        # only the files you meant
git diff --name-only origin/staging...HEAD | grep -E '(^|/)(CLAUDE\.local\.md|\.claude/)' && echo "STOP: agent-local file"
CHANGELOG_BASE=origin/staging bash scripts/changelog-gate.sh    # where the repo has the gate (see below)
pnpm check                                                # the repo's own check script, where it has one
```

Before every push, read what the commit holds, not what you meant it to hold:

```bash
git show --stat HEAD            # every file and line count in the commit you are about to push
git diff --stat origin/staging...HEAD
```

A file you did not mean to touch, or a huge line count, is the signal. `git add -A` sweeps
in whatever a tool rewrote: in one session an audit run rewrote a tracked file
(`audit-out/run.json`, about 160,000 lines) and it landed in a PR, which failed the formatter
check. Add files by name, and run audits and generators with their output **outside** the
repo (a `--out "${TMPDIR:-/tmp}/audit-out"` style option, or a temp directory), or first
confirm the tool does not rewrite tracked files. If a tracked file was changed by accident,
restore the original from the base branch:

```bash
git checkout origin/staging -- path/to/file
```

Never delete a tracked file to make the diff smaller; that is a change too.

Then write the PR body (below) and read the checks the REST way, because GraphQL is blocked in
cloud sessions (so `gh pr checks` fails there):

```bash
SHA=$(gh api repos/OWNER/REPO/pulls/N --jq .head.sha)
gh api "repos/OWNER/REPO/commits/$SHA/check-runs?per_page=100" --jq '.check_runs[] | [(.conclusion // .status), .name] | @tsv'
gh api repos/OWNER/REPO/actions/jobs/JOB_ID/logs        # a failed job's log (or the GitHub MCP get_job_logs tool)
```

## The checks that failed, and the fix

| Check                                                          | Why it fails                                                                                                                                                                                                                                                                                             | Fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issue attached`                                               | No line in the PR body **starts with** `Closes`, `Fixes`, `Refs` or `No issue:`. A mention in the middle of a sentence does not count.                                                                                                                                                                   | Put `Refs #n` (or `Refs owner/repo#n`, `Closes #n`, `No issue: <reason>`) alone on its own line at the start of a line. It reads the body snapshot of the event: after fixing it, save the body again.                                                                                                                                                                                                                                                              |
| `changelog / entry required`                                   | No new line under `## [Unreleased]` in `CHANGELOG.md`, for a change outside `.github/`, lockfiles and lint config.                                                                                                                                                                                       | Add an entry in the repo's own heading style: copy the newest entry (`agent-tools`: `### <package> <version> — what changed (date, [#n](url))`; `mzizi-registry`, `mzizi-api`, `mzizi-docs`, `mzizi-site`: `### <Kind> — what changed (date, ref)`; `packages-npm`: `## [<name> <version>] - <date>` for a release, entries under Unreleased naming the package). `ship-release` has the table. The `no-changelog` label is only for pure CI, lint or typo changes. |
| markdownlint (MD024)                                           | Two headings with the same text next to each other (siblings), usually two `### mzizi-skills` entries under Unreleased.                                                                                                                                                                                  | Make each heading descriptive and unique: package, version and what changed, as in `### mzizi-skills 0.19.0 — corrections to the release skills`.                                                                                                                                                                                                                                                                                                                   |
| markdownlint (other)                                           | A skipped heading level, a bad list marker, trailing spaces, a missing blank line around a list or fence.                                                                                                                                                                                                | `npx markdownlint-cli2 path/to/file.md` with the repo's `.markdownlint.jsonc` and fix what it names.                                                                                                                                                                                                                                                                                                                                                                |
| yamllint                                                       | A line over 140 characters in a workflow, or a bad indent.                                                                                                                                                                                                                                               | Break the line (a `run: \|` block, or a folded `>-` scalar). `yamllint -c .yamllint.yaml .github/workflows` where yamllint is installed.                                                                                                                                                                                                                                                                                                                            |
| `no agent-local files`                                         | A personal or local agent file is in the diff: a `.claude/` path, `CLAUDE.local.md`, or a `CLAUDE.md` in a repo that gitignores it (agent-tools does). Some repos track `CLAUDE.md` and `AGENTS.md` as committed guides; the check there is the repo's own, and an edit to them needs a changelog entry. | `git rm --cached` the file and keep it local. Never commit a `.claude/` path, and do not edit a repo's guide just to make a PR pass.                                                                                                                                                                                                                                                                                                                                |
| `oxfmt` / `vp fmt`                                             | The file is not formatted the way CI's formatter writes it (tables, wrapping, trailing commas).                                                                                                                                                                                                          | CI is the authority. Format only the files you changed, with the repo's own formatter, and read the diff. **Do not run `vp fmt` over a whole package**: it reformatted about 40 files in one session.                                                                                                                                                                                                                                                               |
| CodeQL: bad HTML filtering regexp                              | A regex strips or matches an HTML comment with `-->` only; the browser also closes a comment with `--!>`.                                                                                                                                                                                                | Handle `--!>` as well as `-->`, or stop using a regex: find the opener with `indexOf` and the closer with `indexOf`, and cut between them.                                                                                                                                                                                                                                                                                                                          |
| CodeQL: polynomial regular expression                          | A regex with nested or overlapping quantifiers (a trim like `\s+$`, or `(a+)+`) backtracks on long input.                                                                                                                                                                                                | Replace the backtracking trim with a loop (`while (end > start && isSpace(s[end - 1])) end--`) or `indexOf`; keep any remaining regex linear and anchored.                                                                                                                                                                                                                                                                                                          |
| CodeQL: incomplete sanitization                                | A replace escapes one character (`*`) but not the backslash that escapes it.                                                                                                                                                                                                                             | Escape the backslash too (`/[\\*]/g`), or build the string without replacing.                                                                                                                                                                                                                                                                                                                                                                                       |
| parity                                                         | `--strict` ignores `EXPECTED`, so every difference counts as unexplained. In mzizi-api, strict runs on PRs into `main`; PRs and merge queues into `staging` run without it (mzizi-api #126), because `staging` is ahead of production. Check the repo's `parity.yml` on the branch you target.           | Run `npm run parity -- --strict` yourself. Fix the cause, or record the intended difference as a `PIN_<sha>` entry in `EXPECTED` and in the PR body. Prune stale entries before a release PR.                                                                                                                                                                                                                                                                       |
| rendered-content gate (`verify-rendered.py`, `check-facts.py`) | The live API changed (a count, a node total), so a number the gate expects moved on every branch.                                                                                                                                                                                                        | Update the expected numbers there and the same counts in `AGENTS.md` and `README.md`, with a CHANGELOG entry. Fix the site from upstream, not the check.                                                                                                                                                                                                                                                                                                            |
| version policy on `staging`                                    | `package.json` moved backwards, or a version was bumped that the workflow owns. The next staging patch comes from the tags.                                                                                                                                                                              | Never lower a version. Read the latest tag and npm (`npm view <pkg> version`), keep `package.json` at or above them, and bump only the package you are releasing, to the next minor.                                                                                                                                                                                                                                                                                |
| merge conflict in `CHANGELOG.md`                               | Two PRs added entries under `## [Unreleased]`.                                                                                                                                                                                                                                                           | Merge the base branch into yours and **keep both sides**; keep headings unique. Never resolve by dropping the other PR's entry.                                                                                                                                                                                                                                                                                                                                     |
| rendered-geometry guard (`audit-ui.mjs --guard`)               | Run against a plain static server such as `python3 -m http.server`: the site uses clean URLs (`build.format` file, so `/ecosystem` is `ecosystem.html`), which that server cannot resolve, so pages answer 404 and the guard reports false line-height failures (an "Error code: 404" page).             | Run the guard against a Cloudflare preview URL, `wrangler dev` or `astro preview`, or the live site with `--url`, never a bare file server. A failure on a 404 page is a bad harness, not a pass or a real failure.                                                                                                                                                                                                                                                 |
| `release-version-check` (release PRs)                          | `main` has commits `staging` may not have.                                                                                                                                                                                                                                                               | That is the `ship-release` skill: an owner decision (`forward-ported` label), never `--admin`.                                                                                                                                                                                                                                                                                                                                                                      |

## The PR body

```markdown
Refs #343

What changed and why, in two or three sentences.

## Site/docs/skills impact

None. (Or: what a reader of the site, docs or skills sees differently, and which pages or skills.)
```

- The issue line starts at the beginning of a line, alone. Substantial work has a tracking issue;
  a tiny fix may say `No issue: <reason>`.
- Some repos ask for an impact heading in the body (agent-tools does); keep the exact heading.
- Say how you tested it, and what you did not.
- No secrets, tokens or credential status, and no personal information.

## Merging

- `staging` takes a **squash** through the merge queue; `main`'s queue is set to MERGE (see
  `ship-release`). Do not pick a method by hand.
- Enqueue with `gh pr merge <n> --squash --auto`: that is every repo's convention. GraphQL is
  blocked in cloud sessions, so there `gh pr merge --auto` fails; the fallback is the GitHub MCP
  `enable_pr_auto_merge` tool or `gh api -X PUT repos/OWNER/REPO/pulls/N/ccr/auto_merge -f merge_method=squash`.
- Enqueue only past the merge gate: the work is complete, CI is green, it is verified at
  runtime, and `/code-review` has run with its findings resolved.
- A dequeue with `MERGE_CONFLICT` means the base moved: merge the base into your branch,
  resolve (CHANGELOG: keep both sides) and enqueue again.

## Do not

- Do not skip, `.skip`, delete or loosen a test, a lint rule or a gate to go green.
- Do not use `--admin`, or add a label (`forward-ported`, `no-changelog`) that the checks above
  do not support.
- Do not run a repo-wide formatter locally, or edit generated files by hand.
- Do not retry a red check without reading why it failed. A flake is proven by a re-run that
  goes green with no change, and you say so in the PR.

## Checklist

- [ ] `Refs #n` (or `Closes`, `Fixes`, `No issue: reason`) alone at the start of a line in the body.
- [ ] A `## [Unreleased]` entry with a unique, descriptive heading; `no-changelog` only for CI, lint or typo.
- [ ] No `.claude/` path, `CLAUDE.local.md` or gitignored `CLAUDE.md` in the diff.
- [ ] Only the files I changed are formatted; the repo's `check` script passes locally.
- [ ] No regex that can backtrack on user input; HTML comments handle `--!>`.
- [ ] Parity and rendered-content gates run where they apply, and recorded differences are in the PR.
- [ ] `package.json` versions did not move backwards.
- [ ] `git show --stat HEAD` reviewed before the push; audit and generator output went outside the repo; no tracked file rewritten by a tool.
- [ ] Nothing skipped, disabled or bypassed.
