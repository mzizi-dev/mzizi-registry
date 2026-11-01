---
name: digital-hygiene
description: Use this skill whenever an agent clones a repository, adds a git worktree, fans out sub-agents, builds or tests (pnpm, npm, vitest, cargo, Astro, wrangler), reviews a PR, or finishes a task. It keeps agent hosts and cloud sessions from filling their disks. Before starting, check free disk with `df -h /`. On a shared host, refuse to fan out below 50 GB. In a Claude Code cloud session (CLAUDE_CODE_REMOTE=true) the disk is a fixed per-session allowance, so df's Avail is what counts: `check` defaults to 25% of used + available (or a --min-gb the session sets), and each concurrent heavy build needs 10 GB free above that threshold. $TMPDIR may be unset, so always write "${TMPDIR:-/tmp}/…". Work in a folder unique to you, a clone at ${TMPDIR:-/tmp}/<task>-<repo>-<short-id> or a `git worktree` with an owner marker in its git dir, and never cd into, check out, fetch into or modify a folder you did not create. Put a scratch review checkout in its own throwaway worktree, never as a pr<N> branch in a shared clone. Before every commit, check `git status`, the current branch and its upstream. Share build caches (one CARGO_TARGET_DIR, the pnpm store, the npm cache), but a shared CARGO_TARGET_DIR can serve a stale test binary, so run `cargo clean -p <crate>` before the final verification. Never commit build output. On close, when the PR is merged or abandoned, audit uncommitted changes, stashes and local branches with no commit on any remote. Map each branch to its PR state, because a squash merge leaves commits local-only, so "not on a remote" proves nothing. Publish or report what is left, then delete only your own clone, or `git worktree remove` your own worktree. The periodic sweep prunes regenerable folders (node_modules, target, .astro, .wrangler, .turbo, .next) and orphaned tool temp folders (Vitest/Vite module copies and npm pack folders, found by their contents) older than N minutes, then audits the clones and deletes the clean ones. The safety rules are no `rm -rf` on an unchecked variable, never touch ~/GitHub, claude-* temp, browser profiles or another session's folders, never delete `staging`, and always report what was freed. The skill ships hygiene.sh, a portable script with check, clone, worktree, audit, prune, tmp, close and sweep. clone and worktree make the unique folder and mark it with your agent id; prune, close and sweep never touch a clone or worktree another agent owns without --force-owner; audit lists merged pr<N> scratch branches as safe to delete; and every deleting command is a dry run unless given --apply.
user-invocable: true
---

# Digital hygiene: leave the machine as you found it

> **Covenant:** _A clone is borrowed space. Give it back when the work is done._

On 2026-10-05 an agent host ran out of disk. Its temp directory held **217 GB** in about
**930 leftover agent clones**: roughly 92 GB of `node_modules` and 14 GB of Rust `target/`.
No agent had removed its clone when its work closed. When the disk filled, every agent on the
machine stopped mid-task, including the ones doing nothing wrong. Hygiene is not tidiness. It
is what lets the next agent run at all, and Ubuntu applies here: what one agent leaves behind,
every other agent pays for.

On 2026-10-06 the other failure happened. Several agents on one release task cloned into one
shared, readable folder, `$TMPDIR/rel1006`, and one of them ran `git checkout` in the others'
clones. Their working trees moved under them mid-task. A readable folder name says what the task
is; it does not say whose clone it is. So every clone now gets a folder that is unique to the
agent that made it, and the script refuses to touch a clone another agent owns.

On 2026-10-07, in a Claude Code cloud session with a fixed disk allowance of about 38 GB, the
gaps were different. The 50 GB rule could never be met, so agents either ignored it or stopped.
`$TMPDIR` was unset, so a documented `"$TMPDIR/<task>-…"` meant `/<task>-…` at the filesystem
root. `/tmp` held 4.8 GB of litter that no clone audit sees: about 600 folders of Vitest module
copies that test runs never removed, a 472 MB stray clone and a 572 MB Node compile cache. A
shared `CARGO_TARGET_DIR` served a stale test binary, so 38 tests ran instead of 42 and the run
was a false green. Code reviews fetched PR heads as `pr<N>` branches into shared clones, and the
session's stop hook then flagged already-merged work as unpushed. This skill now covers cloud
sessions, worktrees, tool temp litter, the shared-target hazard and scratch review branches.

This skill has four parts: what to do **before** you start, **while** you work, **on close**,
and in the **periodic sweep**. The safety rules apply to all of them. The script `hygiene.sh`
in this skill folder runs the checks, the audit and the prune for you.

## Get the script

`hygiene.sh` is portable bash (3.2+) for macOS and Linux. Every command that deletes (`prune`,
`tmp`, `close`, `sweep`) is a **dry run** unless you pass `--apply`; `close` and `sweep` still
fetch first.
`clone` and `worktree` always write: they make a clone or a worktree. `check` and `audit` only
read.

| Where you are                   | Path                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@nyuchi/mzizi-skills` from npm | `node_modules/@nyuchi/mzizi-skills/skills/digital-hygiene/hygiene.sh`                                                 |
| The public `mzizi` plugin       | `skills/digital-hygiene/hygiene.sh` in the plugin                                                                     |
| Only the MCP                    | `curl -fsSL https://unpkg.com/@nyuchi/mzizi-skills/skills/digital-hygiene/hygiene.sh -o "${TMPDIR:-/tmp}/hygiene.sh"` |

```bash
H="${TMPDIR:-/tmp}/hygiene.sh"   # or one of the paths above
export HYGIENE_AGENT_ID="$(od -An -N3 -tx1 /dev/urandom | tr -d ' \n')"  # once per agent
bash "$H" check                      # free disk; exits 1 below 50 GB (cloud: 25% of the allowance)
D="$(bash "$H" clone <org>/<repo> --task <task>)"  # ${TMPDIR:-/tmp}/<task>-<repo>-<agent-id>
W="$(bash "$H" worktree <clone> --task <task> --branch <b>)"  # or a worktree: …-<agent-id>-wt-<b>
#   (of your own marked clone; of a session's unmarked base clone with --shared)
bash "$H" audit                      # every clone and worktree: CLEAN, KEEP or ACTIVE, with its owner
bash "$H" prune                      # regenerable build folders it would remove
bash "$H" tmp                        # orphaned tool temp folders in ${TMPDIR:-/tmp} it would remove
bash "$H" close "$D" --apply         # close your own clone (or worktree: git worktree remove)
bash "$H" sweep --exclude "$D"       # prune + tmp + delete clean idle clones (dry run)
```

Options: `--root DIR` (default `$HYGIENE_ROOT`, else `$TMPDIR`, else `/tmp`), `--tmp DIR` (for
`tmp`; default `$TMPDIR`, else `/tmp`), `--agent ID` (default `$HYGIENE_AGENT_ID`), `--task NAME`
and `--branch B` (for `clone` and `worktree`), `--from REF` (where a new worktree branch or a
detached worktree starts), `--force-new` and `--shared` (see "Worktrees"), `--older-than MIN`
(default 120),
`--min-gb N` or `--min-pct P` (for `check`), `--exclude PATH` (repeatable), `--force-owner`,
`--apply`. `clone` and `worktree` create a missing root with `mkdir -p` (the root only, never a
task folder), after the same checks as an existing root. PR lookups use `gh api` only, so Claude
Code's built-in `gh` in a cloud session works; `HYGIENE_GH=none` turns them off. Exit codes: `0`
ok, `1` low disk, a refused path or a clone another agent owns (and from `close`, a clone left in
place only because a worktree of it, or of a clone inside it, is still checked out: close that
worktree first), `2` a clone was kept because it holds unpublished work.

**`$TMPDIR` can be unset**, as it is in a Claude Code cloud session. Then `"$TMPDIR/x"` is
`/x`, at the filesystem root. Every command in this skill writes `"${TMPDIR:-/tmp}"`; write it
that way in your own commands too. `hygiene.sh` falls back to `/tmp` by itself, and `check`
warns when `$TMPDIR` is unset.

## Cloud sessions (Claude Code on the web)

A cloud session runs on a VM that Anthropic hosts, one per session, and the VM goes away when
the session ends. Nothing you leave there outlives the session. The risk is different: you fill
**your own allowance** part-way through the work, and every agent in the session stops.

- **How to tell.** Claude Code sets `CLAUDE_CODE_REMOTE=true` in a cloud session, and it is never
  `true` locally ([environment variables](https://code.claude.com/docs/en/env-vars)). The
  `CLAUDE_CODE_REMOTE_SESSION_ID` variable names the session. A Remote Control session is a local
  session that you steer from another device: it runs on your machine and follows the local
  rules.

  ```bash
  [ "${CLAUDE_CODE_REMOTE:-}" = true ] && echo "cloud session"
  ```

- **The disk is a per-session allowance, so `df`'s "Avail" is what counts.** The filesystem is
  the host's. On 2026-10-07 `df -h /` showed a size of 252G with 29G used and 8.9G available,
  and the 252G meant nothing to the session. Used plus available, about 38 GB there, is the
  session's allowance. Anthropic documents about 30 GB of disk for hosted environments
  ([resource limits](https://code.claude.com/docs/en/cloud-environments#resource-limits)), so
  measure it; don't assume it.
- **Thresholds.** The 50 GB rule can never be met in a cloud session. When
  `CLAUDE_CODE_REMOTE=true`, `hygiene.sh check` uses **25% of used + available** by default
  (about 9.5 GB of a 38 GB allowance), or the `--min-gb N` the session sets. It prints the
  allowance and how many heavy builds fit.
- **Fan-out.** Allow **10 GB free for each concurrent heavy build**, such as a pnpm install
  with a build or test run, or a cargo build, **on top of the threshold**: the threshold is the
  floor the session keeps free, so builds may not spend it. `check` prints the room as
  (free − threshold) / 10 GB, rounded down. With 22 GB free over a 9.5 GB threshold, run one
  heavy build at a time; with room for 0, sweep first or run nothing heavy beside what runs.
  Agents that only read, review or write docs need no build budget. Check again before each
  wave of sub-agents, not only at the start.
- **Where clones and worktrees go.** The session's repositories are usually cloned already (for
  example under `/workspace`). Make a `git worktree` of that clone per branch instead of a
  second clone: it shares the object store, so a worktree costs only its checkout. Keep every
  worktree, and any extra clone, under one root next to the clones and on the same disk:
  `export HYGIENE_ROOT=/workspace/wt`. Then `hygiene.sh worktree`, `clone`, `audit` and
  `sweep` all use it. The session's base clone has no owner marker, so add worktrees to it with
  `hygiene.sh worktree /workspace/<repo> --shared …`. The folder need not exist: `worktree` and `clone` create the root itself
  (`mkdir -p`, the root only), and `audit`, `prune` and `sweep` report a missing root as an
  error. By hand, `mkdir -p "$HYGIENE_ROOT"` once. Don't put clones in `/tmp`. Tools litter `/tmp`, and Claude Code keeps the
  session's own scratch there (`/tmp/claude-*`), which you must never touch.
- **Give space back as you go.** Once your PR is open and CI is green, delete that worktree's
  `node_modules` (`hygiene.sh prune`, or by hand), which a reinstall regenerates. Run
  `hygiene.sh tmp` after test runs. If the allowance runs out anyway, free what you created
  first, then commit and push, and report that the session's disk is spent. A new session
  starts on a fresh machine.

## Before you start

1. **Check the disk.** Run `df -h /`, or `hygiene.sh check`. **On a shared host, do not fan out
   below 50 GB free.** In a cloud session, `check`'s threshold is 25% of the session's
   allowance, and you need 10 GB free above it per concurrent heavy build (see "Cloud sessions"). Below
   the threshold, don't spawn sub-agents and don't start parallel clones or builds. Run a sweep
   first (see below), or report the low disk to your supervisor. A fan-out on a nearly full
   disk fails all at once, part-way through every branch.
2. **Clone only into a folder unique to you: `${TMPDIR:-/tmp}/<task>-<repo>-<short-id>`**, or a
   worktree (see "Worktrees" below). The
   short id is unique per agent, for example six random hex characters
   (`od -An -N3 -tx1 /dev/urandom | tr -d ' \n'`). Set it once as `HYGIENE_AGENT_ID` and use
   it for every clone you make. Never clone into `~/GitHub`, which holds the owner's working
   copies. `hygiene.sh clone` does all of this: it creates the folder (and refuses one that
   already exists), clones into it, writes your agent id into `<clone>/.git/hygiene-owner` (inside
   `.git`, so `git clean -fdx` cannot remove it), and prints the path.

   ```bash
   D="$(bash "$H" clone <org>/<repo> --task <task-name>)"   # or by hand:
   D="${TMPDIR:-/tmp}/<task-name>-<repo>-$HYGIENE_AGENT_ID"
   mkdir "$D" && git clone https://github.com/<org>/<repo>.git "$D"   # mkdir, not mkdir -p
   printf '%s\n' "$HYGIENE_AGENT_ID" >"$D/.git/hygiene-owner"         # the marker: never skip it
   ```

   A clone with no marker has no owner the script can see, so another agent's sweep may
   delete it once it is clean and idle. A `git worktree` of your clone is owned by your clone's
   marker, unless it has its own marker in its git dir (`hygiene.sh worktree` writes one).
   - **Never cd into, check out, fetch into or modify a folder you did not create,** however
     its name reads and whoever's task it seems to be. A shared parent folder is fine
     (`${TMPDIR:-/tmp}/rel1006/` holding one clone per agent); a shared clone is not. If you need
     another agent's work, fetch its pushed branch into your own clone.
   - `mkdir` without `-p` is the claim: it fails when the folder exists, so you notice instead
     of moving into someone else's clone.

3. **Share build caches; don't multiply them.** Each clone with its own caches costs gigabytes
   in every clone.
   - **Rust:** one `CARGO_TARGET_DIR` per machine or session, for example
     `export CARGO_TARGET_DIR="${TMPDIR:-/tmp}/cargo-target"`. Every clone then reuses one
     compiled dependency tree instead of building its own `target/`.

     **The hazard: a shared target dir can run a stale test binary.** Cargo names a workspace
     crate's artifacts with a hash that leaves out where the workspace is on disk, so worktrees
     of one repository on different branches build to the same files. Its freshness check
     compares file times, so a binary that another worktree built from other source can look up
     to date. On 2026-10-07 an agent saw 38 tests run
     instead of 42, a false green, until `cargo clean -p <crate>`. So:
     - **Before the final verification run** of a crate you changed, run
       `cargo clean -p <crate>` (it removes only that crate's artifacts, and the dependency tree
       stays shared), then build and test. Check that the test count matches the tests you
       expect.
     - Or give a crate you edit its own target for the task:
       `CARGO_TARGET_DIR="$PWD/target" cargo test -p <crate>`. Use the shared target for
       dependencies and for crates you only read. Prune the private `target/` when you close.

   - **pnpm:** the content-addressed store is shared by default. Keep it that way: never pass
     `--store-dir` into the clone, and don't use `node-linker=hoisted` copies when links will
     do.
   - **npm:** the cache (`~/.npm`) is shared. Use `npm ci --prefer-offline` and don't point
     `--cache` into the clone.
   - Install only what the task needs. `pnpm install --filter <pkg>...` installs one workspace
     package; a whole monorepo install for a docs fix is waste.

### Worktrees: a first-class alternative to a clone

A `git worktree` is a second checkout of a clone you already have. It shares the clone's object
store, so it costs only the checked-out files, and it is the right default when the repository
is already on disk (a cloud session's `/workspace/<repo>`, or your own clone). The rules for
clones apply to worktrees, plus three of their own:

1. **Make it with an owner marker.** `hygiene.sh worktree <clone> --task <task> --branch <b>`
   claims `$HYGIENE_ROOT/<task>-<repo>-<agent-id>-wt-<b>` (`mkdir`, as for a clone; `/` in the
   branch becomes `-`, and a detached worktree ends in `-wt-<short sha>`). The `-wt-` suffix keeps
   it apart from your own clone for the same task. It adds the worktree, writes your agent id to
   its own git dir (`<clone>/.git/worktrees/<name>/hygiene-owner`), and prints the path.
   - `--branch <b>` checks out the local `<b>` when it exists. Otherwise, when `origin/<b>`
     exists, it creates `<b>` from `origin/<b>` and tracks it. Otherwise it creates `<b>` from
     `--from REF` (default: the clone's HEAD). Without `--branch` the worktree is detached at
     `--from` (or HEAD).
   - `--from` is never ignored. With a local `<b>`, the script refuses it, so drop `--from` or
     pick a new branch. With `origin/<b>` at another commit, it refuses too, unless you pass
     `--force-new`, which starts a new `<b>` from `--from` that tracks nothing.
   - Beside the marker it records the branch it created (close deletes it once it is
     published) and the commit the worktree started from (`hygiene-from`, marked `remote` when
     that commit was on the remote at that moment, for example a PR head just fetched into
     `FETCH_HEAD`).
   - If `git worktree add` fails part-way, or the marker cannot be written, the script runs
     `git worktree remove --force`, removes the folder and deletes the branch it created, then
     exits 1. It never leaves a registered worktree without a marker.

   By hand:

   ```bash
   W="$HYGIENE_ROOT/<task>-<repo>-$HYGIENE_AGENT_ID-wt-<branch>"
   mkdir "$W" && git -C <clone> worktree add -b <branch> "$W" origin/staging
   printf '%s\n' "$HYGIENE_AGENT_ID" >"$(git -C "$W" rev-parse --absolute-git-dir)/hygiene-owner"
   ```

2. **Only from a clone that is yours or the session's.** Adding a worktree writes into the
   clone's `.git`, and closing it later runs `git worktree remove` and `git branch -D` there, so
   the clone passes the same checks as anything the script deletes under. The script refuses a
   clone under `~/GitHub` or on an `--exclude` path, a clone whose git data is there (it resolves
   the real git dir first), a clone whose marker names another agent, and a clone with no marker
   at all. A session's unmarked base clone (`/workspace/<repo>`) is
   shared by the session's agents: pass `--shared` to add worktrees to it, but never check out,
   commit in or fetch PR heads into the base checkout itself. `--shared` never lifts the other
   refusals.
3. **Close it with `git worktree remove`, never `rm -rf`.** `rm -rf` leaves the worktree's
   entry under `<clone>/.git/worktrees/`, and its branch stays "checked out" there until
   `git worktree prune`. `hygiene.sh close <worktree> --apply` audits only what the worktree holds,
   which is its uncommitted changes and its checked-out branch. Stashes and the clone's other
   branches stay with the clone. If the audit is clean, the script runs
   `git worktree remove` and then deletes the branch it created. By hand:
   `git -C <clone> worktree remove <path>`, and `git -C <clone> worktree prune` after an
   accidental `rm`. A clone that still has worktrees checked out is `KEEP` in an audit, because
   deleting it would cut them off from their git data. `close` leaves it in place and exits `1`,
   not `2`, since nothing in it is unpublished. It names each worktree holding the clone, with
   its owner and whether it is locked: close your own worktrees first, and report one that is
   locked or another agent's instead of unlocking or removing it. A worktree that
   `git worktree remove` would refuse without `--force` (locked, holding a submodule, or with
   modified or untracked files) is never removed, and the dry run says so too.

   Before every git write (the fetch, `git worktree add` and `remove`, `git branch -D`) the
   script resolves the checkout's real git dir and common git dir and refuses `/`, your home and
   anything under `~/GitHub`. A worktree of a clone under `~/GitHub`, or a `--separate-git-dir`
   checkout whose git dir is there, is never fetched into, removed or deleted. An `--exclude`
   path also refuses writes to a clone's refs and config (the fetch, `git branch -D`), but not
   to a worktree's own entry under `<clone>/.git/worktrees/`: `sweep --exclude <your clone>`
   still removes that clone's finished worktrees, and keeps the branches they were on.

## While you work

- **Don't commit build output.** `node_modules/`, `target/`, `dist/`, `.astro/`, `.wrangler/`,
  `.turbo/`, `.next/` and `.vercel/output/` belong in `.gitignore`. If one shows up in
  `git status`, ignore it; don't add it.
- **Delete what you made and no longer need.** That includes scratch builds, downloaded
  tarballs and one-off test clones, as soon as they have served their purpose.
- **Check the disk again before anything large:** a release build, a full test matrix, or a
  second fan-out.
- **Before every commit, check where you are.** Run `git status` and
  `git branch --show-current`, and confirm HEAD sits on your branch's upstream:

  ```bash
  git status && git branch --show-current
  git rev-parse --abbrev-ref '@{u}'       # the upstream you expect, e.g. origin/feat/x
  git log --oneline '@{u}..HEAD'           # only your own unpushed commits
  git log --oneline 'HEAD..@{u}'           # empty, or pull first
  ```

  A branch you did not check out, a different upstream, or commits you did not write mean
  something else moved this clone. Stop and report it; don't commit on top.

- **Review a PR in a throwaway worktree, never as a branch in a shared clone.** For a code
  review, `git fetch origin pull/<N>/head:pr<N>` in a shared clone leaves a `pr<N>` branch
  whose commits are on no remote branch. Stop hooks and audits then flag it as unpushed work
  long after the PR merged. Fetch the head without a branch, and check it out detached in a
  worktree of your own:

  ```bash
  git -C <clone> fetch origin "pull/<N>/head"
  R="$(bash "$H" worktree <clone> --task review-pr<N> --from FETCH_HEAD)"   # detached
  # ... review, build, test ...
  bash "$H" close "$R" --apply                                             # git worktree remove
  ```

  `close` fetches first, which overwrites `FETCH_HEAD`, and each worktree keeps its own
  `FETCH_HEAD` in its git dir. So the script judges a review worktree by the commit it recorded
  at creation: published when it was fetched from the remote, or when its PR is merged or closed
  (a squash-merged or fork PR's head is on no remote branch), or while it is an open PR's head.

  `hygiene.sh audit` lists a `pr<N>` scratch branch (also `pr-<N>`, `pr/<N>` and
  `review/pr<N>`) as **safe to delete** when PR #N is merged or closed and the branch has nothing
  beyond the PR's head. It prints the `git branch -D` to run. A scratch branch with commits beyond
  the head is unpublished work, and the audit keeps it.

- **Test runners leave temp folders.** Vitest 5.0.0 to 5.0.2 leave one folder per run in
  `${TMPDIR:-/tmp}`, and so does Vitest 4.x as Vite+ (`vite-plus`) runs it. It has a random 21-character name, holds only `client/` and `ssr/` module
  copies, and is 25 to 57 MB per run. Use Vitest 5.0.3 or later (Vite+ 1.1.0 or later), and run
  `hygiene.sh tmp` after a session of test runs: it finds the folders by their contents, whatever
  the version.

## On close: when the PR is merged or abandoned

Closing a clone is an audit first and a deletion second. **Never delete a clone you have not
audited.** The audit asks one question: is there any work here that exists nowhere else?

1. **Fetch**, so you judge against the remote as it is now: `git fetch --prune origin`. Even
   then, a remote-tracking ref is the clone's memory of the remote, not the remote: it outlives
   a branch deleted upstream whenever a fetch fails or never ran. Ask the remote itself
   (`git ls-remote origin`); a remote you cannot reach vouches for nothing.
2. **Uncommitted changes:** `git status --porcelain --untracked-files=all --ignore-submodules=none`.
   Anything listed exists only here. Pass both options: `status.showUntrackedFiles=no` would hide
   untracked files, and `submodule.<name>.ignore` would hide a submodule moved off its commit.
   Status cannot see two more kinds of work: an edit to a file marked `--assume-unchanged` or
   `--skip-worktree` (`git ls-files -v`: a lowercase tag, or `S`), and **ignored files**
   (`git status --ignored`). An ignored `.env` or a folder of notes kept out of git is work;
   only build output (`node_modules`, `target`, `dist` and the like) is not.
3. **Stashes:** `git stash list`. A stash is never on a remote.
4. **Local refs whose commits are on no remote** — branches, and also tags, notes and
   remote-tracking refs (one whose branch was deleted upstream may be the only copy):

   ```bash
   git ls-remote origin | cut -f1 | sort -u | sed 's/^/^/' >/tmp/on-remote   # what origin has now
   git for-each-ref --format='%(refname)' | while read -r r; do
     n=$(git rev-list --count --stdin "$r" </tmp/on-remote 2>/dev/null) || n=?
     [ "$n" = 0 ] || echo "$r: $n commit(s) on no remote"
   done
   ```

   (A commit the remote has that you have not fetched is not named here; `--stdin` skips
   nothing, so fetch first. A commit in `FETCH_HEAD` counts only when it came from the
   remote's own URL: `git fetch . <branch>` writes one too.)

5. **Map each of those branches to its PR state.** Merged or closed counts as published:

   ```bash
   gh pr list -R <owner>/<repo> --head <branch> --state all --json number,state,title
   ```

   `hygiene.sh` asks `gh api repos/<owner>/<repo>/pulls?head=<owner>:<branch>`. That never finds
   a PR from a fork, so it then asks for the PRs associated with the branch's tip commit
   (`commits/<sha>/pulls`), and then scans the latest 100 PRs for one whose head ref is the
   branch and whose head commit is the tip or behind it. A tip that is an open PR's head is
   pushed, even when no remote-tracking ref has it.

   **A squash merge makes "not on any remote" meaningless as proof.** Squashing writes a new
   commit on the base branch, so the branch's own commits stay local-only even though the
   work shipped. Then the remote branch is deleted, and every squash-merged branch looks
   unpublished. So check in this order:
   - Is every commit on a remote? Then it is published.
   - Is there a PR from this branch that is `MERGED` or `CLOSED`, **and is the branch's tip that
     PR's head, or behind it**? Then it is published (merged, or deliberately abandoned). A
     commit made after the PR's head is not in the PR, whatever its state.
   - Is every unpublished commit already on a remote as **the same change**
     (`git patch-id --stable`, as `git cherry` compares; a rebase or a one-commit squash keeps
     the change)? Then it is published. A matching commit subject proves nothing: two
     different changes can carry one subject.
   - Otherwise it is **unpublished**. This includes an `OPEN` PR whose branch is behind your
     local commits.

6. **Publish or report anything genuinely unpublished.** Push the branch and open a PR (into
   `staging` where the repo has one), or report it to your supervisor with the branch name,
   the commit subjects and why it was not published. Don't delete work to make a clone
   "clean".
7. **Delete the clone, and only your own.** Delete it only after steps 1 to 6 come back
   clean, and then report what was freed. Never delete another agent's folder, even an empty
   one, even in a shared parent.

`hygiene.sh close <clone> --apply` runs steps 1 to 5 and 7. It refuses, before it fetches or
reads anything, a clone whose `.git/hygiene-owner` names another agent, or any marked clone when
you have given no agent id. A clone nested inside yours,
such as a gitignored cache clone, is deleted with it, so it is audited too: unpublished work
there keeps the whole clone. It exits `2`, and deletes
nothing, when step 6 is needed. A clone kept only because a worktree of it, or of a clone nested
in it, is still checked out is not step 6: `close` exits `1` and says to close that worktree
first. A submodule belongs to its parent, whatever the shape of its `.git` (a file pointing
into the parent's `.git/modules/`, or a folder, when `git submodule add` adopted a repository
that was already there). The script asks the parent: git's superproject, or a gitlink or
`.gitmodules` path for it. It is audited as part of the parent, and `close` refuses it on its
own.

**Nothing goes with a folder unless everything in it may go.** Before a clone is deleted
(`rm -rf`) or a worktree removed (`git worktree remove`, which also deletes everything inside
it), the script finds every `.git` entry inside it, in gitignored folders, `node_modules` and
`target` too, and gates each checkout the same way. Git has to read it as its own repository,
its git dir has to be inside the folder, it may not be locked, and its own audit has to be clean
and idle. A worktree of a clone outside the folder, such as a cache holding a
`git worktree add` of `~/GitHub/live`, is never deleted with it: `git worktree remove` it
against its own clone first, or report it. Another agent's clone inside it holds it the same
way (`close` exits `1`: report it). Any refusal keeps the whole folder, with a reason that names
the checkout inside.

- **A `.git` git does not read as its own** (a `.git` folder that lost its `HEAD`, a git dir that
  is gone) is kept for a human. Git skips such a folder and answers for the repository around
  it, so the script checks that the git dir git resolves is the checkout's own and that the
  checkout is its top level. `close` audits it and exits `2`, as `sweep` does.
- **Git dirs not named `.git`** are gated too: a bare repository or mirror (`foo.git/`) and a
  deinit'd submodule's `.git/modules/<name>`. One goes only when it has no stash and every
  commit any of its refs or `HEAD` reaches is named by a remote it can reach (`git ls-remote`),
  never by its own remote-tracking refs. One with no reachable remote and any commit is kept:
  delete it by hand once you know it holds nothing of yours.
- **A checkout found inside another runs nothing its config names.** A package that ships a
  `.git` in `node_modules`, a cache clone or a bare mirror has config anyone could have written,
  and `git ls-remote`, `git fetch` or even `git status` with it can run a command (an `ext::`
  remote URL, `core.sshCommand`, `remote.<name>.uploadpack`, `core.fsmonitor`, a filter). So the
  script never fetches into one, and asks its remotes only by URL (https or ssh, from an empty
  repository with every other protocol off), alongside what the clone around it was told by its
  own remotes. Any config key outside a short list of inert ones (`core.*` basics,
  `remote.*.url`/`fetch`, `branch.*`, `submodule.*.url`, …) keeps it unread, as `KEEP`
  ("untrusted git config"). Every git the script runs has `core.fsmonitor`, hooks, signature
  checks, the `ext`/`fd` transports and lazy fetches switched off, and no git runs on a scanned
  checkout at all until its config (and any `commondir`, which is followed, or refused for a
  bare git dir) has passed; a `core.worktree` pointing outside it or an
  `objects/info/alternates` keeps it. A `commondir` and a `.git` gitfile are
  read exactly as git reads them (the whole file, only a trailing `\n`/`\r`
  stripped); one with an embedded newline or CR, a NUL, or a byte outside
  printable ASCII is refused rather than parsed two ways, and a malformed
  `.git` file keeps its folder instead of being skipped. A registered submodule of your own clone is trusted while
  its config is inert.
- **The dry run counts each byte once.** A sweep measures every checkout once before anything
  goes, and a checkout inside another is not counted again with the folder around it. The total
  is shown in exact KB, and it is what `--apply` frees.

## The periodic sweep

Run a sweep when `check` fails, before a large fan-out, and at the end of a long supervisor
session. It has three passes, and the dry run comes first:

1. **Safe prune of regenerable folders.** These are `node_modules`, `target`, `.astro`,
   `.wrangler`, `.turbo` and `.next`, removed **only when older than N minutes** (default 120),
   so an agent mid-build is not hit. A sibling manifest has to prove what each folder is:
   `Cargo.toml` (or the cargo `CACHEDIR.TAG`) for `target`, `package.json` for `.next`,
   `.turbo` and `.astro`, and a `wrangler` config for `.wrangler`. A folder named `target` that
   holds notes is not a build cache. Pruning loses nothing, because the next install or build
   recreates the folder. A folder with a git checkout inside it (a `.git` anywhere in it) is
   skipped, since its checkout is not regenerable.
2. **Orphaned tool temp folders** (`hygiene.sh tmp`, also run on its own) in `${TMPDIR:-/tmp}`
   (or `--tmp DIR`). A folder there is judged by its contents, not only its name, and only
   folders directly in the temp directory, owned by you and untouched for N minutes, are
   candidates:
   - **Vitest/Vite module copies:** a random name (16 to 32 letters, digits, `_` or `-`) holding
     only `client/` and/or `ssr/`. Each of those holds only files named by a 40-hex hash, and
     the files are Vite SSR module code.
   - **npm pack leftovers:** a `tmp.*` folder (from `mktemp -d`) holding only `*.tgz` files
     and/or an unpacked `package/` with a `package.json`.

   It never touches `claude-*` (Claude Code's temp and the session's scratchpad), browser
   profiles (`.org.chromium.*`, `*chrom*`, `puppeteer*`, `playwright*`, `*profile*`), symlinks,
   another user's folders, a folder with a git checkout inside it, or an `--exclude` path. It
   reports `node-compile-cache` (Node's
   shared compile cache) with its size and never removes it; delete it by hand when no `node`
   process runs. A stray clone in `/tmp` is a clone: `hygiene.sh audit --root /tmp` finds it.

3. **Audit report of the clones and worktrees, then delete the clean ones.** Each gets one
   verdict:
   - `CLEAN`: nothing unpublished, idle. Deleted with `--apply`.
   - `KEEP`: unpublished work, with the reason. Never deleted: publish it or report it.
   - `ACTIVE`: a file changed inside the window. Another session is probably using it. Leave
     it.
   - `OTHER`: its `.git/hygiene-owner` names another agent. Not audited, not pruned, not deleted.

The sweep judges worktrees before clones. Removing a clean worktree frees its clone, which is
then judged without it (in a dry run, as if it were gone), so a clone is never reported as kept
only because the sweep had not reached its worktree yet. A clone held only by a worktree that is
still in use (active, or another agent's) is left in place and reported, but it is not counted
as kept and does not make the sweep exit `2`. The dry run predicts `--apply` exactly: a worktree
that `git worktree remove` would refuse (locked, holding a submodule) is not counted as removed,
so the clone it holds is not reported as deletable either. A submodule is never listed on its
own; it goes only with its parent.

A worktree is deleted with `git worktree remove`, never `rm -rf`. Prune, close and sweep leave
a clone or worktree another agent owns alone. A supervisor clearing up after
agents that have finished passes `--force-owner`, which still deletes only `CLEAN`, idle
clones and is still a dry run without `--apply`. A clone with no marker (made by hand, or
before markers) is judged as before.

```bash
bash hygiene.sh sweep --exclude "${TMPDIR:-/tmp}/<your-task>"          # read the report
bash hygiene.sh sweep --exclude "${TMPDIR:-/tmp}/<your-task>" --apply  # then act on it
```

Report the result: what was freed, how many clones were deleted, and every `KEEP` with its
reason.

## Safety rules (all of the above)

- **Never `rm -rf` a path built from an unchecked variable.** If `$DIR` is empty or unset,
  `rm -rf "$DIR/"*` deletes from `/`. Use fixed base paths and let `find … -prune` produce the
  paths. Check every path before you delete it: it is absolute, it is inside the root, it is not
  the root itself, `/` or `$HOME`, and it is not under `~/GitHub`. Then use
  `rm -rf -- "$path"`. `hygiene.sh` routes every deletion through that check.
- **Never touch `~/GitHub` working copies, `claude-*` temp folders, browser profiles, or another
  agent's folders.** The owner keeps live
  work in `~/GitHub`. The script refuses a root or a clone there. A clone you did not create
  is someone else's until they or your supervisor say otherwise: never cd into it, check it
  out, fetch into it, build in it or delete it. The script refuses a clone whose
  `.git/hygiene-owner` is not yours unless you pass `--force-owner`. Use `--exclude` for your own
  live clone.
- **Never delete `staging`,** neither the branch on the remote nor a release PR's head branch.
  A clone is deleted locally; branches on the remote are the repository's business, not the
  sweep's.
- **Dry run first, then `--apply`.** Read what would go before anything goes.
- **Report what was freed,** in GB, with the number of folders and clones and every clone that
  was kept and why. "Cleaned up" is not a report.

## Checklist

- [ ] `df -h /` before starting. On a shared host, 50 GB free or more before any fan-out. In a
      cloud session (`CLAUDE_CODE_REMOTE=true`), `hygiene.sh check` passes, and you have 10 GB
      free above its threshold per concurrent heavy build.
- [ ] Every path is written `"${TMPDIR:-/tmp}/…"`, never a bare `"$TMPDIR/…"`.
- [ ] Cloned into `${TMPDIR:-/tmp}/<task>-<repo>-<short-id>` (`hygiene.sh clone`), or a marked
      worktree (`hygiene.sh worktree`; in a cloud session under `HYGIENE_ROOT`), unique to you;
      never `~/GitHub`, never a folder another agent made.
- [ ] PR reviews in a throwaway detached worktree, not `pr<N>` branches in a shared clone.
- [ ] `cargo clean -p <crate>` before the final test run of a crate you changed, when
      `CARGO_TARGET_DIR` is shared.
- [ ] `git status`, `git branch --show-current` and the upstream checked before every commit.
- [ ] `CARGO_TARGET_DIR` shared; pnpm store and npm cache not redirected into the clone.
- [ ] No build output committed.
- [ ] On close: fetched, then checked the status, the stashes, and the branches on no remote.
      PR state looked up per branch, because of squash merges.
- [ ] Unpublished work pushed into a PR, or reported.
- [ ] Your own clone deleted, or your worktree removed with `git worktree remove`, nobody
      else's, and the amount freed reported.
- [ ] `hygiene.sh tmp` run after test runs; orphaned tool temp folders removed.
