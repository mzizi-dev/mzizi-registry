---
name: digital-hygiene
description: Use this skill whenever an agent clones a repository, fans out sub-agents, builds (pnpm, npm, cargo, Astro, wrangler), or finishes a task. It keeps agent hosts from filling their disks. Before starting, check free disk with `df -h /` and refuse to fan out below 50 GB. Clone only into a folder unique to you, $TMPDIR/<task>-<repo>-<short-id>, and never cd into, check out, fetch into or modify a folder you did not create; a shared parent folder is fine, a shared clone is not. Before every commit, check `git status`, the current branch and its upstream. Share build caches (one CARGO_TARGET_DIR, the pnpm store, the npm cache). Never commit build output. On close, when the PR is merged or abandoned, run the close-out audit of uncommitted changes, stashes, and local branches with no commit on any remote. Each branch is mapped to its PR state with `gh pr list --head`, because a squash merge leaves commits local-only, so "not on a remote" proves nothing. Publish or report what is left, then delete only your own clone. The periodic sweep prunes regenerable folders (node_modules, target, .astro, .wrangler, .turbo, .next) older than N minutes, audits the clones, and deletes the clean ones. The safety rules are no `rm -rf` on an unchecked variable, never touch ~/GitHub or another session's folders, never delete `staging`, and always report what was freed. Ships hygiene.sh, a portable script (check, clone, audit, prune, close, sweep): clone makes the unique folder and marks it with your agent id in .git/hygiene-owner, prune, close and sweep never touch a clone another agent owns without --force-owner, and every deleting command is a dry run unless given --apply.
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

This skill has four parts: what to do **before** you start, **while** you work, **on close**,
and in the **periodic sweep**. The safety rules apply to all of them. The script `hygiene.sh`
in this skill folder runs the checks, the audit and the prune for you.

## Get the script

`hygiene.sh` is portable bash (3.2+) for macOS and Linux. Every command that deletes is a
**dry run** unless you pass `--apply`.

| Where you are                   | Path                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@nyuchi/mzizi-skills` from npm | `node_modules/@nyuchi/mzizi-skills/skills/digital-hygiene/hygiene.sh`                                         |
| The public `mzizi` plugin       | `skills/digital-hygiene/hygiene.sh` in the plugin                                                             |
| Only the MCP                    | `curl -fsSL https://unpkg.com/@nyuchi/mzizi-skills/skills/digital-hygiene/hygiene.sh -o "$TMPDIR/hygiene.sh"` |

```bash
H="$TMPDIR/hygiene.sh"   # or one of the paths above
export HYGIENE_AGENT_ID="$(od -An -N3 -tx1 /dev/urandom | tr -d ' \n')"  # once per agent
bash "$H" check                      # free disk; exits 1 below 50 GB
D="$(bash "$H" clone <org>/<repo> --task <task>)"  # $TMPDIR/<task>-<repo>-<agent-id>
bash "$H" audit                      # every clone under $TMPDIR: CLEAN, KEEP or ACTIVE, with its owner
bash "$H" prune                      # regenerable build folders it would remove
bash "$H" close "$D" --apply         # close your own clone
bash "$H" sweep --exclude "$D"       # prune + delete clean idle clones (dry run)
```

Options: `--root DIR` (default `$HYGIENE_ROOT`, else `$TMPDIR`), `--agent ID` (default
`$HYGIENE_AGENT_ID`), `--task NAME` and `--branch B` (for `clone`), `--older-than MIN` (default
120), `--min-gb N` (default 50), `--exclude PATH` (repeatable), `--force-owner`, `--apply`.
`HYGIENE_GH=none` turns off PR lookups. Exit codes: `0` ok, `1` low disk, a refused path or a
clone another agent owns, `2` a clone was kept because it holds unpublished work.

## Before you start

1. **Check the disk.** Run `df -h /`, or `hygiene.sh check`. **Below 50 GB free, do not fan
   out.** Don't spawn sub-agents and don't start parallel clones or builds. Run a sweep first
   (see below), or report the low disk to your supervisor. A fan-out on a nearly full disk
   fails all at once, part-way through every branch.
2. **Clone only into a folder unique to you: `$TMPDIR/<task>-<repo>-<short-id>`.** The
   short id is unique per agent, for example six random hex characters
   (`od -An -N3 -tx1 /dev/urandom | tr -d ' \n'`). Set it once as `HYGIENE_AGENT_ID` and use
   it for every clone you make. Never clone into `~/GitHub`, which holds the owner's working
   copies. `hygiene.sh clone` does all of this: it creates the folder (and refuses one that
   already exists), clones into it, writes your agent id into `<clone>/.git/hygiene-owner` (inside
   `.git`, so `git clean -fdx` cannot remove it), and prints the path.

   ```bash
   D="$(bash "$H" clone <org>/<repo> --task <task-name>)"   # or by hand:
   D="$TMPDIR/<task-name>-<repo>-$HYGIENE_AGENT_ID"
   mkdir "$D" && git clone https://github.com/<org>/<repo>.git "$D"   # mkdir, not mkdir -p
   printf '%s\n' "$HYGIENE_AGENT_ID" >"$D/.git/hygiene-owner"         # the marker: never skip it
   ```

   A clone with no marker has no owner the script can see, so another agent's sweep may
   delete it once it is clean and idle. A `git worktree` of your clone is owned by your clone's
   marker.

   - **Never cd into, check out, fetch into or modify a folder you did not create,** however
     its name reads and whoever's task it seems to be. A shared parent folder is fine
     (`$TMPDIR/rel1006/` holding one clone per agent); a shared clone is not. If you need
     another agent's work, fetch its pushed branch into your own clone.
   - `mkdir` without `-p` is the claim: it fails when the folder exists, so you notice instead
     of moving into someone else's clone.

3. **Share build caches; don't multiply them.** Each clone with its own caches costs gigabytes
   in every clone.
   - **Rust:** one `CARGO_TARGET_DIR` per machine or session, for example
     `export CARGO_TARGET_DIR="$TMPDIR/cargo-target"`. Every clone then reuses one compiled
     dependency tree instead of building its own `target/`.
   - **pnpm:** the content-addressed store is shared by default. Keep it that way: never pass
     `--store-dir` into the clone, and don't use `node-linker=hoisted` copies when links will
     do.
   - **npm:** the cache (`~/.npm`) is shared. Use `npm ci --prefer-offline` and don't point
     `--cache` into the clone.
   - Install only what the task needs. `pnpm install --filter <pkg>...` installs one workspace
     package; a whole monorepo install for a docs fix is waste.

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

## On close: when the PR is merged or abandoned

Closing a clone is an audit first and a deletion second. **Never delete a clone you have not
audited.** The audit asks one question: is there any work here that exists nowhere else?

1. **Fetch**, so you judge against the remote as it is now: `git fetch --prune origin`.
2. **Uncommitted changes:** `git status --porcelain`. Anything listed exists only here.
3. **Stashes:** `git stash list`. A stash is never on a remote.
4. **Local branches whose commits are on no remote:**

   ```bash
   git for-each-ref --format='%(refname:short)' refs/heads | while read -r b; do
     n=$(git rev-list --count "$b" --not --remotes)
     [ "$n" -gt 0 ] && echo "$b: $n commit(s) on no remote"
   done
   ```

5. **Map each of those branches to its PR state.** Merged or closed counts as published:

   ```bash
   gh pr list -R <owner>/<repo> --head <branch> --state all --json number,state,title
   ```

   **A squash merge makes "not on any remote" meaningless as proof.** Squashing writes a new
   commit on the base branch, so the branch's own commits stay local-only even though the
   work shipped. Then the remote branch is deleted, and every squash-merged branch looks
   unpublished. So check in this order:
   - Is every commit on a remote? Then it is published.
   - Is there a PR from this branch that is `MERGED` or `CLOSED`? Then it is published (merged,
     or deliberately abandoned).
   - Does every unpublished commit's subject appear on a remote branch, as is or with the
     squash suffix `(#123)` appended? Then it is published.
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
nothing, when step 6 is needed.

## The periodic sweep

Run a sweep when `check` fails, before a large fan-out, and at the end of a long supervisor
session. It has two passes, and the dry run comes first:

1. **Safe prune of regenerable folders.** These are `node_modules`, `target`, `.astro`,
   `.wrangler`, `.turbo` and `.next`, removed **only when older than N minutes** (default 120),
   so an agent mid-build is not hit. A sibling manifest has to prove what each folder is:
   `Cargo.toml` (or the cargo `CACHEDIR.TAG`) for `target`, `package.json` for `.next`,
   `.turbo` and `.astro`, and a `wrangler` config for `.wrangler`. A folder named `target` that
   holds notes is not a build cache. Pruning loses nothing, because the next install or build
   recreates the folder.
2. **Audit report of the clones, then delete the clean ones.** Each clone gets one verdict:
   - `CLEAN`: nothing unpublished, idle. Deleted with `--apply`.
   - `KEEP`: unpublished work, with the reason. Never deleted: publish it or report it.
   - `ACTIVE`: a file changed inside the window. Another session is probably using it. Leave
     it.
   - `OTHER`: its `.git/hygiene-owner` names another agent. Not audited, not pruned, not deleted.

Prune, close and sweep leave a clone another agent owns alone. A supervisor clearing up after
agents that have finished passes `--force-owner`, which still deletes only `CLEAN`, idle
clones and is still a dry run without `--apply`. A clone with no marker (made by hand, or
before markers) is judged as before.

```bash
bash hygiene.sh sweep --exclude "$TMPDIR/<your-task>"          # read the report
bash hygiene.sh sweep --exclude "$TMPDIR/<your-task>" --apply  # then act on it
```

Report the result: what was freed, how many clones were deleted, and every `KEEP` with its
reason.

## Safety rules (all of the above)

- **Never `rm -rf` a path built from an unchecked variable.** If `$DIR` is empty or unset,
  `rm -rf "$DIR/"*` deletes from `/`. Use fixed base paths and let `find … -prune` produce the
  paths. Check every path before you delete it: it is absolute, it is inside the root, it is not
  the root itself, `/` or `$HOME`, and it is not under `~/GitHub`. Then use
  `rm -rf -- "$path"`. `hygiene.sh` routes every deletion through that check.
- **Never touch `~/GitHub` working copies, or another agent's folders.** The owner keeps live
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

- [ ] `df -h /` before starting; 50 GB free or more before any fan-out.
- [ ] Cloned into `$TMPDIR/<task>-<repo>-<short-id>` (`hygiene.sh clone`), unique to you; never
      `~/GitHub`, never a folder another agent made.
- [ ] `git status`, `git branch --show-current` and the upstream checked before every commit.
- [ ] `CARGO_TARGET_DIR` shared; pnpm store and npm cache not redirected into the clone.
- [ ] No build output committed.
- [ ] On close: fetched, then checked the status, the stashes, and the branches on no remote.
      PR state looked up per branch, because of squash merges.
- [ ] Unpublished work pushed into a PR, or reported.
- [ ] Your own clone deleted, nobody else's, and the amount freed reported.
