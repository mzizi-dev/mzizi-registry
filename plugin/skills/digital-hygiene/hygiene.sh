#!/usr/bin/env bash
# hygiene.sh — disk hygiene for agent clones (the Mzizi `digital-hygiene` skill).
#
# Portable bash (3.2+, macOS and Linux). Every command except `clone` is a DRY
# RUN unless you pass --apply. Nothing is deleted outside --root, nothing under
# ~/GitHub, nothing another agent owns, and nothing that has not passed the
# checks below.
#
#   hygiene.sh check [--min-gb N] [--path P]     free disk; exit 1 below N GB (default 50)
#   hygiene.sh clone REPO --task NAME [--branch B]
#                                                 clone into $ROOT/<task>-<repo>-<agent-id>,
#                                                 mark it as yours, print its path
#   hygiene.sh audit [--root DIR]                 report every clone: CLEAN, KEEP or ACTIVE
#   hygiene.sh prune [--root DIR] [--apply]       remove regenerable build folders
#   hygiene.sh close CLONE [--apply]              close one clone: audit it, delete it if clean
#   hygiene.sh sweep [--root DIR] [--apply]       prune, then close every clean, idle clone
#
# REPO is <org>/<repo> (cloned from GitHub), a git URL, or a local path.
#
# Ownership: `clone` writes the agent id into <clone>/.git/hygiene-owner.
# prune, close and sweep never touch a clone whose
# marker names another agent; pass --force-owner to override (a supervisor's
# sweep). Clones with no marker are judged as before.
#
# Options:
#   --root DIR          where the clones live (default: $HYGIENE_ROOT, else $TMPDIR, else /tmp)
#   --agent ID          your agent id (default: $HYGIENE_AGENT_ID; `clone` makes one if unset)
#   --task NAME         the task name in the clone's folder name (clone)
#   --branch B          the branch to check out (clone)
#   --older-than MIN    leave anything touched in the last MIN minutes alone (default 120)
#   --exclude PATH      never touch PATH (repeatable; e.g. your own live clone)
#   --force-owner       act on clones another agent owns (still dry run without --apply)
#   --apply             actually delete; without it, only report
#
# Environment:
#   HYGIENE_AGENT_ID    your agent id: letters, digits, '.', '_' or '-'
#   HYGIENE_GH          the gh binary to ask for PR state (default: gh; "none" skips PR lookups)
#
# Exit codes: 0 ok; 1 check failed (low disk), a refused path or clone, or bad
# usage; 2 a clone was kept because it holds unpublished work (close/sweep), so
# a human or agent must look.

set -u
set -o pipefail
# Read-only git: `git status` must not refresh the index, or the audit itself
# would make every clone look recently active.
export GIT_OPTIONAL_LOCKS=0

REGENERABLE="node_modules target .astro .wrangler .turbo .next"
# The ownership marker `clone` writes into every clone it makes, relative to
# the clone. Inside .git, so `git clean -fdx` and `git stash --all` cannot
# remove it and it never shows as a change.
MARKER=".git/hygiene-owner"

die() {
  printf 'hygiene: %s\n' "$*" >&2
  exit 1
}
say() { printf '%s\n' "$*"; }
note() { printf '%s\n' "$*" >&2; }
usage() { awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"; }

# Absolute, symlink-resolved path of an existing directory, or empty.
resolve_dir() {
  [ -d "$1" ] || return 1
  (cd "$1" 2>/dev/null && pwd -P)
}

human_kb() {
  awk -v k="$1" 'BEGIN {
    if (k >= 1048576) printf "%.1f GB", k / 1048576
    else if (k >= 1024) printf "%.1f MB", k / 1024
    else printf "%d KB", k }'
}

size_kb() { du -sk "$1" 2>/dev/null | awk '{print $1+0}'; }

# ---------------------------------------------------------------- arguments
CMD="${1:-}"
[ -n "$CMD" ] && shift
ROOT_ARG="${HYGIENE_ROOT:-${TMPDIR:-/tmp}}"
MIN_GB=50
CHECK_PATH=""
OLDER=120
APPLY=0
EXCLUDES=""
TARGET=""
TASK=""
BRANCH=""
FORCE_OWNER=0
MY_AGENT="${HYGIENE_AGENT_ID:-}"
GH="${HYGIENE_GH:-gh}"

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT_ARG="${2:?--root needs a directory}"; shift 2 ;;
    --min-gb) MIN_GB="${2:?--min-gb needs a number}"; shift 2 ;;
    --path) CHECK_PATH="${2:?--path needs a directory}"; shift 2 ;;
    --older-than) OLDER="${2:?--older-than needs minutes}"; shift 2 ;;
    --exclude)
      ex="$(resolve_dir "${2:?--exclude needs a path}")" || ex="$2"
      EXCLUDES="$EXCLUDES
$ex"
      shift 2 ;;
    --agent) MY_AGENT="${2:?--agent needs an id}"; shift 2 ;;
    --task) TASK="${2:?--task needs a name}"; shift 2 ;;
    --branch) BRANCH="${2:?--branch needs a branch}"; shift 2 ;;
    --force-owner) FORCE_OWNER=1; shift ;;
    --apply) APPLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    --*) die "unknown option: $1" ;;
    *) [ -z "$TARGET" ] || die "unexpected argument: $1"; TARGET="$1"; shift ;;
  esac
done

case "$MIN_GB" in ''|*[!0-9]*) die "--min-gb must be a whole number" ;; esac
case "$OLDER" in ''|*[!0-9]*) die "--older-than must be a whole number of minutes" ;; esac

# A name that is safe in a folder name: letters, digits, '.', '_', '-'; not
# starting with '.' or '-'; at most 64 characters.
valid_name() {
  case "$1" in ''|.*|-*|*[!A-Za-z0-9._-]*) return 1 ;; esac
  [ "${#1}" -le 64 ]
}
[ -z "$MY_AGENT" ] || valid_name "$MY_AGENT" ||
  die "agent id must be letters, digits, '.', '_' or '-' (at most 64): $MY_AGENT"

# ------------------------------------------------------------- safety gates
HOME_REAL="$(resolve_dir "${HOME:-/nonexistent}" || true)"

# A path we may delete: absolute, inside ROOT, not ROOT itself, not under
# ~/GitHub, not excluded. Every rm in this script goes through here first.
deletable() {
  p="$1"
  case "$p" in /*) ;; *) return 1 ;; esac
  [ "$p" != "/" ] && [ "$p" != "$ROOT" ] && [ "$p" != "$HOME_REAL" ] || return 1
  case "$p/" in "$ROOT"/*) ;; *) return 1 ;; esac
  if [ -n "$HOME_REAL" ]; then
    case "$p/" in "$HOME_REAL/GitHub/"*) return 1 ;; esac
  fi
  if [ -n "$EXCLUDES" ]; then
    while IFS= read -r ex; do
      [ -n "$ex" ] || continue
      case "$p/" in "$ex/"*) return 1 ;; esac
      case "$ex/" in "$p/"*) return 1 ;; esac
    done <<EOF
$EXCLUDES
EOF
  fi
  return 0
}

set_root() {
  ROOT="$(resolve_dir "$ROOT_ARG")" || die "root does not exist: $ROOT_ARG"
  [ "$ROOT" != "/" ] || die "refusing to use / as the root"
  [ "$ROOT" != "$HOME_REAL" ] || die "refusing to use your home directory as the root"
  if [ -n "$HOME_REAL" ]; then
    case "$ROOT/" in "$HOME_REAL/GitHub/"*) die "refusing: $ROOT is under ~/GitHub (working copies are never swept)" ;; esac
  fi
}

# ---------------------------------------------------------------- ownership
# The marker file for the clone at DIR, if it has one. A worktree or
# submodule has a .git *file* pointing at its git dir: a worktree is owned by
# the marker of the clone it belongs to (its common dir).
marker_file() {
  local p="$1" gd cd
  if [ -d "$p/.git" ]; then
    [ -f "$p/$MARKER" ] && printf '%s\n' "$p/$MARKER"
    return 0
  fi
  [ -f "$p/.git" ] || return 0
  gd="$(sed -n 's/^gitdir: //p' "$p/.git" | head -n 1)"
  [ -n "$gd" ] || return 0
  case "$gd" in /*) ;; *) gd="$p/$gd" ;; esac
  if [ -f "$gd/hygiene-owner" ]; then
    printf '%s\n' "$gd/hygiene-owner"
  elif [ -f "$gd/commondir" ]; then
    cd="$(head -n 1 "$gd/commondir")"
    case "$cd" in /*) ;; *) cd="$gd/$cd" ;; esac
    [ -f "$cd/hygiene-owner" ] && printf '%s\n' "$cd/hygiene-owner"
  fi
  return 0
}

# The agent id in a marker file ("unknown" for an empty one).
marker_id() {
  local id
  id="$(head -n 1 "$1" 2>/dev/null | tr -d '[:space:]')"
  printf '%s\n' "${id:-unknown}"
}

# The owner recorded by the nearest marker at or above DIR, inside ROOT; empty
# when there is none (a clone made before markers, or by hand).
owner_above() {
  local p="$1" f
  while :; do
    case "$p/" in "$ROOT"/*) ;; *) return 0 ;; esac
    [ "$p" != "$ROOT" ] || return 0
    f="$(marker_file "$p")"
    if [ -n "$f" ]; then
      marker_id "$f"
      return 0
    fi
    p="${p%/*}"
  done
}

# True when we may act on something owned by OWNER: no owner, our own id, or
# --force-owner.
owner_ok() {
  [ -z "$1" ] && return 0
  [ "$FORCE_OWNER" -eq 1 ] && return 0
  [ -n "$MY_AGENT" ] && [ "$1" = "$MY_AGENT" ]
}

# True when a file under DIR (outside build folders) changed in the window.
# Files, not folders: removing a build folder changes its parent's mtime.
recently_active() {
  local dir="$1" hit
  [ "$OLDER" -gt 0 ] || return 1
  hit="$(find "$dir" \( -name node_modules -o -name target -o -name .next -o -name .turbo \) -prune \
    -o -type f -mmin "-$OLDER" -print 2>/dev/null | head -n 1)"
  [ -n "$hit" ]
}

# ------------------------------------------------------------------- check
cmd_check() {
  p="${CHECK_PATH:-/}"
  free_kb="$(df -Pk "$p" 2>/dev/null | awk 'NR==2 {print $4+0}')"
  [ -n "$free_kb" ] || die "could not read free space for $p"
  free_gb=$((free_kb / 1048576))
  if [ "$free_gb" -lt "$MIN_GB" ]; then
    say "LOW DISK: ${free_gb} GB free on $p (threshold ${MIN_GB} GB). Do not fan out; run a sweep first."
    return 1
  fi
  say "ok: ${free_gb} GB free on $p (threshold ${MIN_GB} GB)"
}

# ------------------------------------------------------------------- prune
cmd_prune() {
  set_root
  total=0
  count=0
  # One walk. A matching folder is never descended into (-prune), so nothing
  # inside a node_modules is judged on its own, and a folder touched inside the
  # window is left alone (-mmin).
  names=""
  for name in $REGENERABLE; do names="$names -o -name $name"; done
  # shellcheck disable=SC2086 # $names is a fixed list of plain words
  find "$ROOT" -name .git -prune -o -type d \( -false $names \) -prune \( -mmin "+$OLDER" -print -o -true \) 2>/dev/null |
    while IFS= read -r d; do
    [ -n "$d" ] || continue
    parent="${d%/*}"
    base="${d##*/}"
    # Only folders a tool regenerates: a sibling manifest proves what they are.
    case "$base" in
      node_modules|.next|.turbo|.astro) [ -f "$parent/package.json" ] || [ "$base" = node_modules ] || continue ;;
      target) [ -f "$parent/Cargo.toml" ] || [ -f "$d/CACHEDIR.TAG" ] || continue ;;
      .wrangler) [ -f "$parent/wrangler.toml" ] || [ -f "$parent/wrangler.jsonc" ] || [ -f "$parent/wrangler.json" ] || continue ;;
    esac
    deletable "$d" || continue
    owner="$(owner_above "$parent")"
    owner_ok "$owner" || { say "skip (owned by $owner): $d"; continue; }
    recently_active "$parent" && { say "skip (active): $d"; continue; }
    kb="$(size_kb "$d")"
    if [ "$APPLY" -eq 1 ]; then
      rm -rf -- "$d" && say "pruned $(human_kb "$kb"): $d"
    else
      say "would prune $(human_kb "$kb"): $d"
    fi
    printf '%s\n' "$kb" >>"$PRUNE_TALLY"
  done
  total="$(awk '{s+=$1} END {print s+0}' "$PRUNE_TALLY")"
  count="$(wc -l <"$PRUNE_TALLY" | tr -d ' ')"
  if [ "$APPLY" -eq 1 ]; then
    say "prune: freed $(human_kb "$total") in $count folder(s) under $ROOT"
  else
    say "prune (dry run): $(human_kb "$total") in $count folder(s) under $ROOT; re-run with --apply"
  fi
}

# --------------------------------------------------------- clone auditing
# The GitHub owner/repo of a clone's origin, or empty.
origin_slug() {
  local url
  url="$(git -C "$1" remote get-url origin 2>/dev/null)" || return 0
  printf '%s\n' "$url" | sed -E 's#^(git@[^:]+:|ssh://git@[^/]+/|https?://([^@/]+@)?[^/]+/)##; s#\.git$##'
}

# PR state for a head branch: MERGED, CLOSED, OPEN, or empty (no PR / no gh).
pr_state() {
  local slug="$1" branch="$2" states
  [ "$GH" != "none" ] && [ -n "$slug" ] || return 0
  command -v "$GH" >/dev/null 2>&1 || return 0
  states="$("$GH" pr list -R "$slug" --head "$branch" --state all --json state -q '.[].state' 2>/dev/null)" || return 0
  case "$states" in
    *MERGED*) echo MERGED ;;
    *CLOSED*) echo CLOSED ;;
    *OPEN*) echo OPEN ;;
  esac
}

# What counts as "on a remote": the remote-tracking refs, plus every commit
# named in FETCH_HEAD. A clone fetched by SHA (`git fetch origin <sha>`, as a
# pinned cache does) has no remote-tracking refs at all, but what it fetched
# came from the remote.
on_remote() {
  printf '%s\n' --remotes
  [ -f "$1/.git/FETCH_HEAD" ] || return 0
  awk '$1 ~ /^[0-9a-f]+$/ && length($1) >= 40 { print $1 }' "$1/.git/FETCH_HEAD" |
    while IFS= read -r sha; do
      git -C "$1" cat-file -e "$sha^{commit}" 2>/dev/null && printf '%s\n' "$sha"
    done
}

# True when every commit in RANGE has a subject that some remote branch also
# carries (a squash or rebase merge keeps the subject, not the SHA).
subjects_on_remote() {
  local repo="$1" remote_subjects s
  shift
  # A squash merge appends " (#123)" to the PR title; compare without it too.
  remote_subjects="$(git -C "$repo" log --remotes --format=%s 2>/dev/null |
    sed -E 'p; s/ \(#[0-9]+\)$//')"
  git -C "$repo" log --format=%s "$@" 2>/dev/null | while IFS= read -r s; do
    [ -n "$s" ] || continue
    printf '%s\n' "$remote_subjects" | grep -Fxq -- "$s" && continue
    echo missing
    break
  done | grep -q missing && return 1
  return 0
}

# Audit one clone. Prints one report line and sets VERDICT (CLEAN, KEEP, ACTIVE).
audit_clone() {
  local repo="$1" reasons status dirty stashes n slug branches b st kb active nested g own inner excl owner wt
  VERDICT=CLEAN
  reasons=""
  # Judge activity before any git command touches the clone.
  active=0
  recently_active "$repo" && active=1
  add() { reasons="${reasons:+$reasons; }$1"; VERDICT=KEEP; }

  # A status that fails (a worktree whose git dir is gone, a broken clone)
  # proves nothing, so it is never CLEAN.
  if status="$(git -C "$repo" status --porcelain 2>/dev/null)"; then
    dirty="$(printf '%s' "$status" | grep -c .)"
    [ "$dirty" -eq 0 ] || add "$dirty uncommitted change(s)"
  else
    add "git status failed (a broken clone, or a worktree whose clone is gone)"
  fi
  # Deleting a clone cuts its linked worktrees off from their git data, so a
  # clone with a worktree still checked out is kept.
  if [ -d "$repo/.git" ]; then
    while IFS= read -r wt; do
      [ -n "$wt" ] && [ -d "$wt" ] || continue
      [ "$(resolve_dir "$wt")" != "$repo" ] || continue
      add "worktree $wt is still checked out (git worktree remove it first)"
    done <<EOF
$(git -C "$repo" worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')
EOF
  fi
  # Word-split on purpose: --remotes and full commit SHAs, never spaces.
  excl="$(on_remote "$repo" | tr '\n' ' ')"
  stashes="$(git -C "$repo" stash list 2>/dev/null | wc -l | tr -d ' ')"
  [ "$stashes" -eq 0 ] || add "$stashes stash(es)"
  if git -C "$repo" rev-parse -q --verify HEAD >/dev/null 2>&1 &&
    ! git -C "$repo" symbolic-ref -q HEAD >/dev/null 2>&1; then
    # shellcheck disable=SC2086 # $excl is split on purpose (see above)
    n="$(git -C "$repo" rev-list --count HEAD --not $excl 2>/dev/null || echo 0)"
    # shellcheck disable=SC2086 # $excl is split on purpose (see above)
    if [ "$n" -gt 0 ] && ! subjects_on_remote "$repo" HEAD --not $excl; then
      add "detached HEAD with $n commit(s) on no remote"
    fi
  fi

  slug="$(origin_slug "$repo")"
  branches="$(git -C "$repo" for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null)"
  while IFS= read -r b; do
    [ -n "$b" ] || continue
    # shellcheck disable=SC2086 # $excl is split on purpose (see above)
    n="$(git -C "$repo" rev-list --count "refs/heads/$b" --not $excl 2>/dev/null || echo 0)"
    [ "$n" -gt 0 ] || continue # every commit is on a remote: published
    st="$(pr_state "$slug" "$b")"
    case "$st" in
      MERGED|CLOSED) continue ;; # published by PR (a squash merge leaves the SHAs local-only)
    esac
    # shellcheck disable=SC2086 # $excl is split on purpose (see above)
    subjects_on_remote "$repo" "refs/heads/$b" --not $excl && continue
    if [ "$st" = OPEN ]; then
      add "$b: $n commit(s) not pushed to its open PR"
    else
      add "$b: $n commit(s) on no remote and no PR"
    fi
  done <<EOF
$branches
EOF

  # A clone inside this one (a gitignored cache clone, a vendored checkout) is
  # deleted with it, so its work counts as this clone's work.
  nested="$(find "$repo" -mindepth 2 \( -name node_modules -o -name target \) -prune -o -name .git -print 2>/dev/null)"
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    own="$VERDICT"
    audit_clone "${g%/.git}" >/dev/null
    inner="$VERDICT"
    VERDICT="$own"
    [ "$inner" != KEEP ] || add "nested clone ${g%/.git} holds unpublished work"
    # Deleting this clone would delete the nested one too: never another agent's.
    inner="$(owner_above "${g%/.git}")"
    owner_ok "$inner" || add "nested clone ${g%/.git} belongs to agent $inner"
  done <<EOF
$nested
EOF

  kb="$(size_kb "$repo")"
  if [ "$VERDICT" = CLEAN ] && [ "$active" -eq 1 ]; then
    VERDICT=ACTIVE
    reasons="changed in the last $OLDER min"
  fi
  owner="$(owner_above "$repo")"
  printf '%-6s %10s  %s%s%s\n' "$VERDICT" "$(human_kb "$kb")" "$repo" "${reasons:+  ($reasons)}" "${owner:+  [owner: $owner]}"
  CLONE_KB="$kb"
}

list_clones() {
  # Deepest first, so a nested clone is judged before the one around it.
  find "$ROOT" \( -name node_modules -o -name target \) -prune -o -name .git -print 2>/dev/null |
    while IFS= read -r g; do
      d="${g%/.git}"
      printf '%s\t%s\n' "$(printf '%s' "$d" | tr -cd '/' | wc -c | tr -d ' ')" "$d"
    done | sort -rn | cut -f2-
}

remove_clone() {
  local repo="$1" kb="$2" parent
  deletable "$repo" || { say "  not deleting (outside the root, under ~/GitHub, or excluded): $repo"; return 1; }
  [ -e "$repo/.git" ] || { say "  not deleting (no .git): $repo"; return 1; }
  if [ "$APPLY" -eq 1 ]; then
    rm -rf -- "$repo" || return 1
    say "  deleted $(human_kb "$kb"): $repo"
    # Remove the task folder too when the clone was its last content.
    parent="${repo%/*}"
    if [ "$parent" != "$ROOT" ] && deletable "$parent"; then
      rmdir -- "$parent" 2>/dev/null || true
    fi
  else
    say "  would delete $(human_kb "$kb"): $repo"
  fi
  printf '%s\n' "$kb" >>"$CLOSE_TALLY"
}

cmd_audit() {
  set_root
  say "audit of clones under $ROOT"
  clean=0 keep=0 active=0
  while IFS= read -r repo; do
    [ -n "$repo" ] || continue
    deletable "$repo" || continue
    audit_clone "$repo"
    case "$VERDICT" in CLEAN) clean=$((clean + 1)) ;; KEEP) keep=$((keep + 1)) ;; ACTIVE) active=$((active + 1)) ;; esac
  done <<EOF
$(list_clones)
EOF
  say "audit: $clean clean, $keep keep (unpublished work), $active active"
}

cmd_close() {
  [ -n "$TARGET" ] || die "close needs a clone path"
  repo="$(resolve_dir "$TARGET")" || die "no such clone: $TARGET"
  [ -e "$repo/.git" ] || die "not a git clone: $repo"
  # Closing your own finished clone: the activity window does not apply.
  OLDER=0
  set_root
  deletable "$repo" || die "refusing: $repo is outside $ROOT, under ~/GitHub, or excluded"
  # Ownership before anything touches the clone, the fetch included.
  owner="$(owner_above "$repo")"
  owner_ok "$owner" ||
    die "refusing: $repo belongs to agent $owner (its $MARKER), not ${MY_AGENT:-you (no --agent or HYGIENE_AGENT_ID)}; pass --agent if it is yours, or --force-owner"
  git -C "$repo" fetch --quiet --prune origin 2>/dev/null || say "warning: fetch failed; judging against the last-fetched remote state"
  audit_clone "$repo"
  if [ "$VERDICT" = KEEP ]; then
    say "kept: publish the work above (push and open a PR) or report it, then close again"
    return 2
  fi
  remove_clone "$repo" "$CLONE_KB" || return 1
  report_close
}

# ------------------------------------------------------------------- clone
rand_hex() {
  od -An -N3 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n'
}

cmd_clone() {
  local src repo dir generated=0
  [ -n "$TARGET" ] || die "clone needs a repository: <org>/<repo>, a git URL or a path"
  [ -n "$TASK" ] || die "clone needs --task NAME"
  valid_name "$TASK" || die "task name must be letters, digits, '.', '_' or '-' (at most 64): $TASK"
  set_root
  if [ -z "$MY_AGENT" ]; then
    MY_AGENT="$(rand_hex)"
    [ "${#MY_AGENT}" -eq 6 ] || die "could not read /dev/urandom for an agent id; pass --agent"
    generated=1
  fi
  src="$TARGET"
  # <org>/<repo> that is not a local path means GitHub.
  if [ ! -e "$src" ]; then
    case "$src" in
      */*/*|*:*) ;;
      [A-Za-z0-9]*/[A-Za-z0-9._-]*) src="https://github.com/${src%.git}.git" ;;
    esac
  fi
  repo="${src%/}"
  # A local path (".", "repo/.git") is named after the folder it resolves to.
  if [ -d "$src" ]; then
    repo="$(resolve_dir "$src")" || die "cannot resolve $src"
    repo="${repo%/.git}"
  fi
  repo="${repo##*/}"
  repo="${repo##*:}"
  repo="${repo%.git}"
  repo="${repo#.}" # .github -> github
  valid_name "$repo" || die "cannot name a folder after $TARGET"
  dir="$ROOT/$TASK-$repo-$MY_AGENT"
  deletable "$dir" || die "refusing: $dir is outside $ROOT, under ~/GitHub, or excluded"
  # mkdir without -p is the claim: it fails if the folder exists, so two
  # agents can never share one.
  mkdir -- "$dir" 2>/dev/null ||
    die "$dir already exists; never reuse a folder you did not create (pick another --agent if it is not yours)"
  if ! git clone --quiet ${BRANCH:+--branch "$BRANCH"} -- "$src" "$dir" >&2; then
    rm -rf -- "$dir"
    die "git clone of $src failed"
  fi
  printf '%s\n' "$MY_AGENT" >"$dir/$MARKER" || die "could not write $dir/$MARKER"
  note "cloned $src into $dir as agent $MY_AGENT"
  if [ "$generated" -eq 1 ]; then
    note "your agent id is $MY_AGENT; export HYGIENE_AGENT_ID=$MY_AGENT so close and sweep know this clone is yours"
  fi
  say "$dir"
}

cmd_sweep() {
  cmd_prune
  set_root
  say "sweep of clones under $ROOT"
  kept=0
  others=0
  while IFS= read -r repo; do
    [ -n "$repo" ] || continue
    [ -d "$repo" ] || continue
    deletable "$repo" || continue
    owner="$(owner_above "$repo")"
    if ! owner_ok "$owner"; then
      say "OTHER  $repo  (owned by $owner; left alone)"
      others=$((others + 1))
      continue
    fi
    audit_clone "$repo"
    case "$VERDICT" in
      CLEAN) remove_clone "$repo" "$CLONE_KB" || true ;;
      KEEP) kept=$((kept + 1)) ;;
    esac
  done <<EOF
$(list_clones)
EOF
  report_close
  [ "$others" -eq 0 ] || say "sweep: $others clone(s) owned by other agents left alone; --force-owner includes them"
  [ "$kept" -eq 0 ] || { say "sweep: $kept clone(s) kept with unpublished work; publish or report them"; return 2; }
}

report_close() {
  total="$(awk '{s+=$1} END {print s+0}' "$CLOSE_TALLY")"
  count="$(wc -l <"$CLOSE_TALLY" | tr -d ' ')"
  if [ "$APPLY" -eq 1 ]; then
    say "freed $(human_kb "$total") from $count clone(s)"
  else
    say "dry run: $(human_kb "$total") in $count clone(s) would be freed; re-run with --apply"
  fi
}

PRUNE_TALLY="$(mktemp "${TMPDIR:-/tmp}/hygiene-prune.XXXXXX")" || die "mktemp failed"
CLOSE_TALLY="$(mktemp "${TMPDIR:-/tmp}/hygiene-close.XXXXXX")" || die "mktemp failed"
trap 'rm -f -- "$PRUNE_TALLY" "$CLOSE_TALLY"' EXIT

case "$CMD" in
  check) cmd_check ;;
  clone) cmd_clone ;;
  audit) cmd_audit ;;
  prune) cmd_prune ;;
  close) cmd_close ;;
  sweep) cmd_sweep ;;
  ''|-h|--help|help) usage ;;
  *) die "unknown command: $CMD (check, clone, audit, prune, close, sweep)" ;;
esac
