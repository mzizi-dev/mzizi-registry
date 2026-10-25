#!/usr/bin/env bash
# hygiene.sh — disk hygiene for agent clones (the Mzizi `digital-hygiene` skill).
#
# Portable bash (3.2+, macOS and Linux). clone and worktree always write:
# they make a clone or a worktree (and worktree writes into CLONE's .git).
# prune, tmp, close and sweep are a DRY RUN unless you pass --apply (close
# and sweep still fetch first, which writes only a clone's remote-tracking
# refs and FETCH_HEAD). check and audit only read. What counts as published
# is asked of each remote (git ls-remote), never read off remote-tracking
# refs, so a remote that cannot be reached vouches for nothing. Nothing is deleted outside --root,
# nothing under ~/GitHub is deleted or written to, nothing another agent owns
# is touched, and nothing is deleted that has not passed the checks below.
# No git it runs on a checkout found inside another (a package's .git, a
# cache clone, a mirror) uses that checkout's config to fetch, ask a remote
# or run a command (see "trust" below).
#
#   hygiene.sh check [--min-gb N | --min-pct P] [--path P]
#                                                 free disk; exit 1 below the threshold
#                                                 (50 GB; in a cloud session 25% of the
#                                                 session's allowance)
#   hygiene.sh clone REPO --task NAME [--branch B]
#                                                 clone into $ROOT/<task>-<repo>-<agent-id>,
#                                                 mark it as yours, print its path
#   hygiene.sh worktree CLONE --task NAME [--branch B] [--from REF] [--force-new] [--shared]
#                                                 add a git worktree of CLONE at
#                                                 $ROOT/<task>-<repo>-<agent-id>-wt-<branch>
#                                                 (detached: -wt-<short sha>), mark it as
#                                                 yours, print its path. CLONE is a clone
#                                                 marked as yours (`clone`), or with
#                                                 --shared a session's unmarked base clone;
#                                                 never one under ~/GitHub or excluded
#   hygiene.sh audit [--root DIR]                 report every clone and worktree: CLEAN,
#                                                 KEEP or ACTIVE, and scratch review
#                                                 branches (pr<N>) that are safe to delete
#   hygiene.sh prune [--root DIR] [--apply]       remove regenerable build folders
#   hygiene.sh tmp [--tmp DIR] [--apply]          remove orphaned tool temp folders from
#                                                 ${TMPDIR:-/tmp} (Vitest/Vite module
#                                                 copies, npm pack folders)
#   hygiene.sh close CLONE [--apply]              close one clone or worktree: audit it,
#                                                 delete it if clean (a worktree with
#                                                 `git worktree remove`)
#   hygiene.sh sweep [--root DIR] [--apply]       prune and tmp, then close every clean,
#                                                 idle clone
#
# REPO is <org>/<repo> (cloned from GitHub), a git URL, or a local path.
#
# Submodules: a submodule's checkout (its .git is a file pointing into the
# parent's .git/modules/) belongs to its parent. It is audited with the parent
# and deleted only with it, never listed, closed or deleted on its own.
#
# Deletion: a folder goes (rm -rf, or git worktree remove) only when every
# checkout inside it, any .git entry in gitignored folders too, may go with
# it: git reads it as its own, its git dir is inside the folder, not locked,
# not another agent's, idle, nothing unpublished. So may every other git dir
# in it (a bare mirror, a deinit'd submodule's .git/modules/<name>). A
# worktree of a clone outside the folder is never deleted with it. prune and
# tmp skip a folder with a checkout in it.
#
# Ownership: `clone` writes the agent id into <clone>/.git/hygiene-owner, and
# `worktree` into the worktree's own git dir (<clone>/.git/worktrees/<name>/),
# beside the branch it created (hygiene-branch) and the commit it started from
# (hygiene-from), so close can judge a review worktree after a fetch.
# prune, close and sweep never touch a clone or worktree whose
# marker names another agent; pass --force-owner to override (a supervisor's
# sweep). Clones with no marker are judged as before.
#
# Cloud sessions: when CLAUDE_CODE_REMOTE=true (Claude Code on the web), the
# disk is a per-session allowance on a shared filesystem: df's Size is the
# host's, and used + available is the session's. `check` then defaults to 25%
# of that allowance instead of 50 GB, and says how many heavy builds fit
# (10 GB each, counted in the free space above the threshold).
#
# clone and worktree create a missing root (mkdir -p of the root only, never
# of a task folder), so `export HYGIENE_ROOT=/workspace/wt` is enough.
#
# Options:
#   --root DIR          where the clones live (default: $HYGIENE_ROOT, else $TMPDIR, else /tmp)
#   --tmp DIR           the temp directory `tmp` cleans (default: $TMPDIR, else /tmp)
#   --agent ID          your agent id (default: $HYGIENE_AGENT_ID; `clone` makes one if unset)
#   --task NAME         the task name in the folder name (clone, worktree)
#   --branch B          the branch to check out (clone, worktree). worktree checks out a
#                       local B, else bases B on origin/B and tracks it, else creates B
#   --from REF          where a new worktree branch, or a detached worktree, starts
#                       (default: the clone's HEAD). Refused when the local B exists, and
#                       when origin/B exists at another commit (unless --force-new)
#   --force-new         worktree: start a new B from --from although origin/B exists
#                       (B then tracks nothing)
#   --shared            worktree: CLONE may have no ownership marker (a session's shared
#                       base clone, such as /workspace/<repo>). Never lifts the refusal of
#                       a clone under ~/GitHub, an --exclude path, or another agent's clone
#   --min-gb N          check: the free-space threshold in GB
#   --min-pct P         check: the threshold as P% of used + available (default 25 when remote)
#   --older-than MIN    leave anything touched in the last MIN minutes alone (default 120)
#   --exclude PATH      never touch PATH (repeatable; e.g. your own live clone)
#   --force-owner       act on clones another agent owns (still dry run without --apply)
#   --apply             actually delete; without it, only report
#
# Environment:
#   HYGIENE_AGENT_ID    your agent id: letters, digits, '.', '_' or '-'
#   HYGIENE_GH          the gh binary to ask for PR state (default: gh; "none" skips PR lookups).
#                       Only `gh api` is used, so Claude Code's built-in gh works too.
#   CLAUDE_CODE_REMOTE  "true" in a Claude Code cloud session (set by Claude Code)
#
# Exit codes: 0 ok; 1 check failed (low disk), a refused path or clone, or bad
# usage (close also exits 1 for a clone it leaves in place only because a
# worktree of it, or of a clone inside it, is still checked out: close those
# first); 2 a clone was kept because it holds unpublished work (close/sweep),
# so a human or agent must look.

set -u
set -o pipefail
# Read-only git: `git status` must not refresh the index, or the audit itself
# would make every clone look recently active.
export GIT_OPTIONAL_LOCKS=0
# No git this script runs may run a command a repository's config names
# through these keys: no fsmonitor, no hooks, no signature check, no ext::
# or fd:: transport. GIT_CONFIG_COUNT outranks every config file and reaches
# every git that git starts (a submodule's status included). The keys a
# scanned repository could still use to run something (filters, textconv,
# includes, transports) are refused before any git runs there (config_safe).
# The caller's own count, for git_user.
HYG_GIT_COUNT0="${GIT_CONFIG_COUNT:-0}"
case "$HYG_GIT_COUNT0" in '' | *[!0-9]*) HYG_GIT_COUNT0=0 ;; esac
HYG_NO_LAZY0="${GIT_NO_LAZY_FETCH:-0}"
harden_git() {
  local n="${GIT_CONFIG_COUNT:-0}" kv
  case "$n" in '' | *[!0-9]*) n=0 ;; esac
  # protocol.allow=never: no transport at all, unless a call names the
  # protocols it needs (remote_cache, safe_ls_remote) or is git_user.
  for kv in core.fsmonitor=false core.hooksPath=/dev/null log.showSignature=false \
    protocol.allow=never protocol.ext.allow=never protocol.fd.allow=never; do
    export "GIT_CONFIG_KEY_$n=${kv%%=*}" "GIT_CONFIG_VALUE_$n=${kv#*=}"
    n=$((n + 1))
  done
  export GIT_CONFIG_COUNT="$n"
  # A missing object is never fetched on demand (a promisor remote in a
  # partial clone's config would otherwise be a transport): git 2.44+.
  export GIT_NO_LAZY_FETCH=1
}
harden_git
# git with the caller's own config, hooks included: only for writes to a
# clone you own and name (`worktree add`, close's and sweep's fetch of a
# trusted checkout), never on a git dir found by scanning.
git_user() { GIT_CONFIG_COUNT="$HYG_GIT_COUNT0" GIT_NO_LAZY_FETCH="$HYG_NO_LAZY0" git "$@"; }
# cfg_file FILE ARGS...: `git config --file FILE ARGS...` as a plain file
# read: run from /, with no repository to find (GIT_CEILING_DIRECTORIES),
# no system or global config, and no include followed (--file follows none).
# The one way this script reads a scanned git dir's config.
cfg_file() {
  local f="$1"
  shift
  (cd / && GIT_CEILING_DIRECTORIES=/ GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null \
    git config --file "$f" "$@")
}

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
TMP_ARG="${TMPDIR:-/tmp}"
MIN_GB=""
MIN_PCT=""
FROM=""
FORCE_NEW=0
CHECK_PATH=""
OLDER=120
APPLY=0
EXCLUDES=""
TARGET=""
TASK=""
BRANCH=""
FORCE_OWNER=0
SHARED=0
MY_AGENT="${HYGIENE_AGENT_ID:-}"
GH="${HYGIENE_GH:-gh}"

while [ $# -gt 0 ]; do
  case "$1" in
    --root) ROOT_ARG="${2:?--root needs a directory}"; shift 2 ;;
    --min-gb) MIN_GB="${2:?--min-gb needs a number}"; shift 2 ;;
    --min-pct) MIN_PCT="${2:?--min-pct needs a percentage}"; shift 2 ;;
    --tmp) TMP_ARG="${2:?--tmp needs a directory}"; shift 2 ;;
    --from) FROM="${2:?--from needs a ref}"; shift 2 ;;
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
    --force-new) FORCE_NEW=1; shift ;;
    --shared) SHARED=1; shift ;;
    --apply) APPLY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    --*) die "unknown option: $1" ;;
    *) [ -z "$TARGET" ] || die "unexpected argument: $1"; TARGET="$1"; shift ;;
  esac
done

case "$MIN_GB" in *[!0-9]*) die "--min-gb must be a whole number" ;; esac
case "$MIN_PCT" in *[!0-9]*) die "--min-pct must be a whole number" ;; esac
case "$OLDER" in ''|*[!0-9]*) die "--older-than must be a whole number of minutes" ;; esac
# $((...)) reads a leading zero as octal (010 is 8, 08 is an error): make
# every number decimal once, here, before any arithmetic.
[ -z "$MIN_GB" ] || MIN_GB=$((10#$MIN_GB))
[ -z "$MIN_PCT" ] || MIN_PCT=$((10#$MIN_PCT))
OLDER=$((10#$OLDER))
[ -z "$MIN_PCT" ] || [ "$MIN_PCT" -le 100 ] || die "--min-pct must be 0 to 100"

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

# True when the resolved PATH is under ~/GitHub, the owner's live working
# copies: nothing there is ever deleted or written to.
under_github() {
  [ -n "$HOME_REAL" ] || return 1
  case "$1/" in "$HOME_REAL/GitHub/"*) return 0 ;; esac
  return 1
}

# True when PATH is an --exclude path, inside one, or holds one.
excluded() {
  local p="$1" ex
  [ -n "$EXCLUDES" ] || return 1
  while IFS= read -r ex; do
    [ -n "$ex" ] || continue
    case "$p/" in "$ex/"*) return 0 ;; esac
    case "$ex/" in "$p/"*) return 0 ;; esac
  done <<EOF
$EXCLUDES
EOF
  return 1
}

# Why the resolved PATH is never deleted or written to, or nothing: it is /,
# your home, or under ~/GitHub. The one list behind validate_root and
# untouchable_why.
protected_why() {
  if [ "$1" = / ]; then
    echo "it is /"
  elif [ -n "$HOME_REAL" ] && [ "$1" = "$HOME_REAL" ]; then
    echo "it is your home directory"
  elif under_github "$1"; then
    echo "it is under ~/GitHub (working copies are never written to or deleted)"
  fi
}

# Why the resolved PATH may not be touched, or nothing: protected_why, or an
# --exclude path (or inside one, or holding one). The gate behind deletable,
# git_dir_writable and worktree's CLONE.
untouchable_why() {
  local why
  why="$(protected_why "$1")"
  [ -n "$why" ] || ! excluded "$1" || why="it is excluded (--exclude)"
  printf '%s\n' "$why"
}

# A path we may delete: absolute, inside ROOT, not ROOT itself, and not
# untouchable. Every rm under the root goes through here first.
deletable() {
  local p="$1"
  case "$p" in /*) ;; *) return 1 ;; esac
  [ "$p" != "$ROOT" ] || return 1
  case "$p/" in "$ROOT"/*) ;; *) return 1 ;; esac
  [ -z "$(untouchable_why "$p")" ]
}

# Die unless the directory named by the variable VAR may be a root that this
# script deletes under: not /, not your home, not under ~/GitHub. LABEL
# names it in the message (default: root). The one gate for --root and --tmp.
# (A root may hold an --exclude path, so exclusion is not asked here.)
validate_root() {
  local v="${!1}" label="${2:-root}" why
  [ -n "$v" ] || die "no $label"
  why="$(protected_why "$v")"
  [ -z "$why" ] || die "refusing to use $v as the $label: $why"
}

# The resolved common git dir of the checkout at DIR (for a linked worktree,
# its clone's .git), or fail. The one way close, sweep and worktree find it.
common_git_dir() {
  local c
  c="$(git -C "$1" rev-parse --git-common-dir 2>/dev/null)" || return 1
  [ -n "$c" ] || return 1
  case "$c" in /*) ;; *) c="$1/$c" ;; esac
  resolve_dir "$c"
}

# Sets CK_GD and CK_CD to the resolved git dir and common git dir of the
# checkout at DIR (the same dir for a clone; for a linked worktree, its own
# entry under the clone's .git/worktrees/ and the clone's .git). Fails, with
# both empty, when git cannot read them. A --separate-git-dir checkout or a
# worktree keeps its git data away from the checkout, so the checkout's own
# path proves nothing about where git writes.
CK_GD=""
CK_CD=""
git_dirs() {
  CK_GD=""
  CK_CD=""
  if CK_GD="$(git -C "$1" rev-parse --absolute-git-dir 2>/dev/null)" && [ -n "$CK_GD" ] &&
    CK_GD="$(resolve_dir "$CK_GD")" && CK_CD="$(common_git_dir "$1")"; then
    return 0
  fi
  CK_GD=""
  CK_CD=""
  return 1
}

# True when git reads DIR as a repository of its own: the git dir it resolves
# is DIR's own (the .git folder, or the git dir a .git file names) and DIR is
# its top level. Git skips a .git folder it does not recognise (no HEAD, say)
# and climbs to the repository around it, and then every answer it gives is
# about that one: such a checkout is never judged, fetched into or deleted.
# Sets CK_GD and CK_CD (git_dirs) when true.
own_checkout() {
  local d="$1" want top
  if [ -d "$d/.git" ]; then
    want="$(resolve_dir "$d/.git")" || return 1
  else
    want="$(gitfile_dir "$d")" || return 1
    [ -n "$want" ] && want="$(resolve_dir "$want")" || return 1
  fi
  git_dirs "$d" || return 1
  [ "$CK_GD" = "$want" ] || return 1
  top="$(git -C "$d" rev-parse --show-toplevel 2>/dev/null)" && top="$(resolve_dir "$top")" && [ "$top" = "$d" ]
}

# git_dir_writable GITDIR [admin]: true when this script may write to the git
# dir GITDIR (resolved first). Never /, your home, or under ~/GitHub. An
# --exclude path also refuses ref and config writes (the fetch, branch -D,
# worktree add); an "admin" write, the linked worktree's own entry under
# <clone>/.git/worktrees/ that `git worktree remove` drops, is allowed there,
# so a sweep that excludes your clone still removes its finished worktrees.
# Asked before every git write. Sets GD_WHY when not.
GD_WHY=""
git_dir_writable() {
  local g why
  g="$(resolve_dir "$1")" || { GD_WHY="its git dir $1 is missing"; return 1; }
  if [ "${2:-}" = admin ]; then why="$(protected_why "$g")"; else why="$(untouchable_why "$g")"; fi
  [ -z "$why" ] || { GD_WHY="its git dir $g: $why"; return 1; }
  GD_WHY=""
}

# checkout_writable DIR [admin]: git_dir_writable for both of DIR's git dirs.
# Returns 0 when writable, 1 when refused (GD_WHY says why), and 2 when git
# cannot read them, which proves nothing either way: close then audits the
# checkout, whose failed git status keeps it for a human.
checkout_writable() {
  git_dirs "$1" || { GD_WHY="git cannot read its git dir"; return 2; }
  git_dir_writable "$CK_GD" "${2:-}" && git_dir_writable "$CK_CD" "${2:-}"
}

# Create a missing root, for clone and worktree. mkdir -p of the root itself
# and never of a task folder (a task folder's mkdir is the claim). The path
# the root would have is resolved through its nearest existing parent and
# passes validate_root before anything is made.
make_root() {
  local want="$ROOT_ARG" base rest="" new_root
  case "$want" in /*) ;; *) want="$PWD/$want" ;; esac
  while :; do
    case "$want" in /) break ;; */) want="${want%/}" ;; *) break ;; esac
  done
  case "$want/" in */./*|*/../*) die "refusing to create a root with . or .. in it: $ROOT_ARG" ;; esac
  base="$want"
  while [ ! -d "$base" ]; do
    [ ! -e "$base" ] && [ ! -L "$base" ] || die "cannot create the root: $base exists and is not a directory"
    rest="/${base##*/}$rest"
    base="${base%/*}"
    [ -n "$base" ] || base=/
  done
  new_root="$(resolve_dir "$base")" || die "cannot resolve $base"
  new_root="${new_root%/}$rest"
  validate_root new_root
  mkdir -p -- "$new_root" || die "could not create the root $new_root"
  note "created the root $new_root"
}

# Resolve and check ROOT. `set_root create` (clone, worktree) first creates
# a missing root; every other command needs it to exist.
set_root() {
  [ "${1:-}" != create ] || [ -d "$ROOT_ARG" ] || make_root
  ROOT="$(resolve_dir "$ROOT_ARG")" || die "root does not exist: $ROOT_ARG"
  validate_root ROOT
}

rand_hex() {
  od -An -N3 -tx1 /dev/urandom 2>/dev/null | tr -d ' \n'
}

# Set MY_AGENT when it is unset: six random hex characters, and agent_hint
# then tells the caller to export it.
AGENT_GENERATED=0
ensure_agent_id() {
  [ -z "$MY_AGENT" ] || return 0
  MY_AGENT="$(rand_hex)"
  [ "${#MY_AGENT}" -eq 6 ] || die "could not read /dev/urandom for an agent id; pass --agent"
  AGENT_GENERATED=1
}

agent_hint() { # agent_hint <clone|worktree>
  [ "$AGENT_GENERATED" -eq 1 ] || return 0
  note "your agent id is $MY_AGENT; export HYGIENE_AGENT_ID=$MY_AGENT so close and sweep know this $1 is yours"
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
  # A malformed .git names no marker; the audit keeps that checkout.
  gd="$(gitfile_dir "$p")" || return 0
  [ -n "$gd" ] || return 0
  if [ -f "$gd/hygiene-owner" ]; then
    printf '%s\n' "$gd/hygiene-owner"
  elif [ -f "$gd/commondir" ]; then
    cd="$(git_one_line "$gd/commondir")" || return 0
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

# git_one_line FILE: the value of a one-line pointer file (.git gitfile,
# commondir) as git reads it, or exit status 2 when this script cannot be
# sure it reads it the way git does.
#
# git (setup.c: read_gitfile_gently, get_common_dir_noenv) reads the whole
# file into a C string and strips only a trailing run of \n and \r. So it
# stops at the first NUL, keeps an embedded \n or \r, and keeps any other
# byte. Shell tools disagree with that on exactly those bytes (bash drops a
# NUL from $(...); awk's handling of NUL and of RS differs between mawk,
# gawk, busybox and BSD awk), so the parse is made boring instead:
#   - any NUL: refused (compare the byte count with and without NULs);
#   - read with cat inside $(...; printf x), so no trailing byte is lost,
#     and strip only a trailing run of \n and \r, as git does;
#   - left empty, or any \n or \r left, or any byte outside printable ASCII
#     (0x20-0x7e, under LC_ALL=C): refused.
# A refusal keeps the checkout (KEEP), which is the safe direction: a path
# git uses for its own internals is plain ASCII in practice.
#
# Git itself is not asked to confirm the path: every git command that would
# answer (rev-parse, git config with that dir as GIT_DIR) reads that dir's
# config to do it, which is what this check exists to avoid.
git_one_line() {
  local f="$1" n0 n1 v nl='
' cr
  cr="$(printf '\r')"
  [ -f "$f" ] || return 2
  n0="$(LC_ALL=C wc -c <"$f" 2>/dev/null | tr -d ' ')" || return 2
  n1="$(LC_ALL=C tr -d '\000' <"$f" 2>/dev/null | LC_ALL=C wc -c | tr -d ' ')" || return 2
  [ -n "$n0" ] && [ "$n0" = "$n1" ] || return 2
  v="$(LC_ALL=C cat -- "$f" 2>/dev/null && printf x)" || return 2
  v="${v%x}"
  while :; do
    case "$v" in
      *"$nl") v="${v%"$nl"}" ;;
      *"$cr") v="${v%"$cr"}" ;;
      *) break ;;
    esac
  done
  [ -n "$v" ] || return 2
  case "$v" in *"$nl"* | *"$cr"*) return 2 ;; esac
  # One line left: any byte outside space..tilde refuses.
  if printf '%s' "$v" | LC_ALL=C grep -q '[^ -~]'; then return 2; fi
  printf '%s\n' "$v"
}

# The git dir that the .git file of DIR points at, made absolute. Read from
# the file, not asked of git, so it works when that git dir is gone, and so
# no git runs on DIR before its config is checked. Exit status:
#   0  with the path: a .git file of exactly one `gitdir: <path>` line,
#      read the way git reads it (git_one_line);
#   0  with nothing: DIR has no .git, or its .git is a folder;
#   2  with nothing: a .git that is malformed: a file this script cannot be
#      sure git reads the same way, one with no `gitdir: ` line, or one that
#      is neither a folder nor a file (a broken link, a fifo).
# Callers refuse on 2 (KEEP, "a malformed .git file in ..."); none may read
# an empty result as "nothing to check".
gitfile_dir() {
  local line gd
  if [ -d "$1/.git" ] || { [ ! -e "$1/.git" ] && [ ! -L "$1/.git" ]; }; then
    return 0
  fi
  [ -f "$1/.git" ] || return 2
  line="$(git_one_line "$1/.git")" || return 2
  case "$line" in 'gitdir: '?*) gd="${line#gitdir: }" ;; *) return 2 ;; esac
  case "$gd" in /*) ;; *) gd="$1/$gd" ;; esac
  printf '%s\n' "$gd"
}

# gitlinks DIR [PATH]: the gitlink (submodule) entries of DIR's index, under
# PATH when given, as NUL-terminated "160000 <sha> <stage>\t<path>" records.
# Filtered before any bash loop reads them: newline and NUL are swapped
# around the grep (tr maps each to the other), so every record is one line
# for grep and a path with a newline still comes back whole.
gitlinks() {
  if [ -n "${2:-}" ]; then
    git --literal-pathspecs -C "$1" ls-files -s -z -- "$2" 2>/dev/null
  else
    git -C "$1" ls-files -s -z 2>/dev/null
  fi | tr '\n\000' '\000\n' | grep -a '^160000 ' | tr '\n\000' '\000\n'
}

# True when REL is a submodule path of the work tree SP: a gitlink in its
# index, or a submodule.<name>.path in its .gitmodules. Both are read
# NUL-separated (a path git would quote, a name with spaces), and without a
# pipe that a long .gitmodules could break with SIGPIPE.
gitlink_in() {
  local sp="$1" rel="$2" rec nl='
'
  while IFS= read -r -d '' rec; do
    [ "${rec#*	}" != "$rel" ] || return 0
  done < <(gitlinks "$sp" "$rel")
  [ -f "$sp/.gitmodules" ] || return 1
  # -z: one "<key>\n<value>" record per NUL.
  while IFS= read -r -d '' rec; do
    [ "${rec#*"$nl"}" != "$rel" ] || return 0
  done < <(cfg_file "$sp/.gitmodules" -z --get-regexp '^submodule\..*\.path$' 2>/dev/null)
  return 1
}

# The work tree of the parent that DIR is a submodule of, or nothing. Asked
# of the parent, whatever the shape of DIR's .git: a file into the parent's
# .git/modules/, or a folder (`git submodule add` of a repository already
# there keeps its own .git). In order: git's own answer
# (--show-superproject-working-tree); DIR as a gitlink or .gitmodules path
# of the work tree around it; and, when its git dir is gone, a .git file
# into a .git/modules/. A linked worktree is never a submodule.
submodule_parent() {
  local d="$1" gd sp="" rel
  # A malformed .git is no submodule of anything: the audit keeps it.
  gd="$(gitfile_dir "$d")" || return 0
  [ -z "$gd" ] || [ ! -f "$gd/commondir" ] || return 0
  # Git is asked only once DIR's config has passed (scan_ok); the work tree
  # around it is found by reading the folders, and asked (gitlink_in) only
  # once it has passed too.
  if scan_ok "$d"; then
    sp="$(git -C "$d" rev-parse --show-superproject-working-tree 2>/dev/null)" || sp=""
  fi
  if [ -z "$sp" ]; then
    sp="$(enclosing_checkout "$d")"
    [ -z "$sp" ] || sp="$(resolve_dir "$sp")" || sp=""
    if [ -n "$sp" ]; then
      rel="${d#"$sp"/}"
      [ "$rel" != "$d" ] && scan_ok "$sp" && gitlink_in "$sp" "$rel" || sp=""
    fi
  fi
  if [ -z "$sp" ]; then
    case "$gd" in
      */.git/modules/*) sp="$(resolve_dir "${gd%%/.git/modules/*}")" || sp="${gd%%/.git/modules/*}" ;;
      */.git/worktrees/*/modules/*)
        sp="$(sed -n 1p "${gd%/modules/*}/gitdir" 2>/dev/null)"
        sp="${sp%/.git}"
        [ -n "$sp" ] || sp="${gd%/modules/*}" ;;
    esac
  fi
  printf '%s\n' "$sp"
}

# True when DIR is a submodule's checkout. Its parent owns it: it is audited
# with the parent and deleted only with it. Answers are cached for the run
# (list_clones asks for every checkout; removal asks again).
is_submodule() {
  if grep -Fxq -- "S	$1" "$SUBMOD_CACHE" 2>/dev/null; then return 0; fi
  if grep -Fxq -- "N	$1" "$SUBMOD_CACHE" 2>/dev/null; then return 1; fi
  if [ -n "$(submodule_parent "$1")" ]; then
    printf 'S\t%s\n' "$1" >>"$SUBMOD_CACHE"
    return 0
  fi
  printf 'N\t%s\n' "$1" >>"$SUBMOD_CACHE"
  return 1
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
# During a sweep, a file in a .git folder in DIR newer than the sweep's start
# is the sweep's own doing (its fetch; removing a worktree and its branch
# rewrites the clone's .git/config and packed-refs), so it does not make the
# clone active. A nested checkout's .git counts too: the sweep fetches into
# it.
SWEEP_SINCE=""
recently_active() {
  local dir="$1" hit
  local own=()
  [ "$OLDER" -gt 0 ] || return 1
  # During a sweep: skip (true, unprinted) the .git files the sweep changed.
  # find runs from inside DIR: a -path pattern built from DIR's name would
  # read [, * and ? in it as a pattern.
  [ -z "$SWEEP_SINCE" ] || own=(\( -type f -path "*/.git/*" -newer "$SWEEP_SINCE" \) -o)
  # ${own[@]+...}: bash 3.2 calls an empty array unbound under set -u.
  hit="$(cd "$dir" 2>/dev/null && find . \( -name node_modules -o -name target -o -name .next -o -name .turbo \) -prune \
    -o ${own[@]+"${own[@]}"} -type f -mmin "-$OLDER" -print 2>/dev/null | head -n 1)"
  [ -n "$hit" ]
}

# ------------------------------------------------------------------- check
# A Claude Code cloud session (Claude Code on the web). Claude Code sets
# CLAUDE_CODE_REMOTE=true there and never locally; a Remote Control session
# runs on your own machine and is local.
is_remote() { [ "${CLAUDE_CODE_REMOTE:-}" = true ]; }

# Free space per heavy build (a pnpm install plus a build, or a cargo build)
# when deciding how far to fan out in a cloud session.
HEAVY_BUILD_KB=$((10 * 1048576))

cmd_check() {
  local p line used_kb free_kb allowance_kb need_kb basis pct room
  p="${CHECK_PATH:-/}"
  line="$(df -Pk "$p" 2>/dev/null | awk 'NR==2 {print $3+0, $4+0}')"
  [ -n "$line" ] || die "could not read free space for $p"
  used_kb="${line% *}"
  free_kb="${line#* }"
  # used + available, not df's Size: in a cloud session the filesystem is the
  # host's and only used + available is this session's; anywhere, it leaves
  # out the blocks reserved for root.
  allowance_kb=$((used_kb + free_kb))
  if [ -n "$MIN_GB" ]; then
    need_kb=$((MIN_GB * 1048576))
    basis="$MIN_GB GB"
  elif [ -n "$MIN_PCT" ] || is_remote; then
    pct="${MIN_PCT:-25}"
    need_kb=$((allowance_kb * pct / 100))
    basis="$(human_kb "$need_kb"), ${pct}% of $(human_kb "$allowance_kb") used + available"
  else
    need_kb=$((50 * 1048576))
    basis="50 GB"
  fi
  if is_remote; then
    say "cloud session (CLAUDE_CODE_REMOTE=true): this session's disk is about $(human_kb "$allowance_kb") (used + available); df's Size is the shared host's and does not count"
    # Only the space above the threshold is spare: the threshold is the floor
    # the session must keep free, so a build may not spend it.
    room=$(((free_kb - need_kb) / HEAVY_BUILD_KB))
    [ "$room" -ge 0 ] || room=0
    say "fan-out: room for $room concurrent heavy build(s) at 10 GB each, in the free space above the threshold"
  fi
  # shellcheck disable=SC2016 # the $TMPDIR in the message is literal on purpose
  [ -n "${TMPDIR:-}" ] ||
    say 'warning: $TMPDIR is unset, so "$TMPDIR/<name>" is "/<name>" at the filesystem root; write "${TMPDIR:-/tmp}/<name>"'
  if [ "$free_kb" -lt "$need_kb" ]; then
    say "LOW DISK: $(human_kb "$free_kb") free on $p (threshold $basis). Do not fan out; run a sweep first."
    return 1
  fi
  say "ok: $(human_kb "$free_kb") free on $p (threshold $basis)"
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
    # Regenerable, unless a checkout sits inside it (a git dependency, a
    # clone someone made there): rm -rf would take its work with it.
    if [ -n "$(find "$d" -name .git -print 2>/dev/null | head -n 1)" ]; then
      say "skip (holds a git checkout): $d"
      continue
    fi
    owner="$(owner_above "$parent")"
    owner_ok "$owner" || { say "skip (owned by $owner): $d"; continue; }
    recently_active "$parent" && { say "skip (active): $d"; continue; }
    kb="$(size_kb "$d")"
    if [ "$APPLY" -eq 1 ]; then
      rm -rf -- "$d" && say "pruned $(human_kb "$kb"): $d"
    else
      say "would prune $(human_kb "$kb"): $d"
    fi
    printf '%s\t%s\n' "$kb" "$d" >>"$PRUNE_TALLY"
  done
  total="$(awk '{s+=$1} END {print s+0}' "$PRUNE_TALLY")"
  count="$(wc -l <"$PRUNE_TALLY" | tr -d ' ')"
  if [ "$APPLY" -eq 1 ]; then
    say "prune: freed $(human_kb "$total") in $count folder(s) under $ROOT"
  else
    say "prune (dry run): $(human_kb "$total") in $count folder(s) under $ROOT; re-run with --apply"
  fi
}

# --------------------------------------------------------------------- tmp
# Orphaned tool temp folders directly in the temp directory. A folder is
# judged by what is in it, never by its name alone:
#
#   vitest  a random name (letters, digits, '_', '-'; 16 to 32 long) holding
#           only `client/` and/or `ssr/`, each holding only regular files named
#           by a 40-hex hash, the first of which is Vite SSR module code. These
#           are the module copies Vitest leaves behind on every run: seen with
#           Vitest 5.0.0-5.0.2, and with Vitest 4.x as Vite+ (vite-plus) runs
#           it. The test is by content, not by version, so any Vitest that
#           leaves the same shape is caught.
#   npmpack `tmp.*` (mktemp -d) holding only `*.tgz` files and/or an unpacked
#           `package/` with a package.json: a leftover `npm pack`.
#
# Never: a symlink, a folder owned by another user, anything touched inside
# the window, claude-* (Claude Code's own temp, the session's scratchpad),
# browser profiles, or an --exclude path.

# The kind of tool litter at DIR (vitest or npmpack), or nothing.
tmp_kind() {
  local d="$1" b e sub first
  b="${d##*/}"
  case "$b" in
    claude|claude-*|.org.chromium.*|*[Cc]hrom*|puppeteer*|playwright*|*firefox*|*profile*) return 0 ;;
  esac
  case "$b" in
    tmp.*)
      [ -n "$(ls -A "$d" 2>/dev/null)" ] || return 0
      for e in "$d"/* "$d"/.[!.]*; do
        [ -e "$e" ] || [ -L "$e" ] || continue
        [ ! -L "$e" ] || return 0
        case "${e##*/}" in
          *.tgz) [ -f "$e" ] || return 0 ;;
          package) [ -d "$e" ] && [ -f "$e/package.json" ] || return 0 ;;
          *) return 0 ;;
        esac
      done
      echo npmpack
      return 0 ;;
  esac
  [ "${#b}" -ge 16 ] && [ "${#b}" -le 32 ] || return 0
  case "$b" in *[!A-Za-z0-9_-]*) return 0 ;; esac
  sub=0
  for e in "$d"/* "$d"/.[!.]*; do
    [ -e "$e" ] || [ -L "$e" ] || continue
    case "${e##*/}" in client|ssr) ;; *) return 0 ;; esac
    [ -d "$e" ] && [ ! -L "$e" ] || return 0
    sub=$((sub + 1))
  done
  [ "$sub" -gt 0 ] || return 0
  # One walk: every entry under client/ and ssr/ must be a regular file named
  # by a sha1 (40 hex). Anything else prints a lone "/", which no path is.
  # The first file is kept, to check that it is Vite SSR module code.
  first="$(find "$d" -mindepth 2 \( -type f -print \) -o \( -exec printf '/\n' \; \) 2>/dev/null |
    awk -F/ '$0 == "/" || $NF !~ /^[0-9a-f]+$/ || length($NF) != 40 { bad = 1; exit }
      NR == 1 { first = $0 }
      END { if (!bad) print first }')"
  [ -n "$first" ] && grep -q '__vite_ssr_' "$first" 2>/dev/null || return 0
  echo vitest
}

# True when DIR is a direct child of the temp root and not excluded.
tmp_deletable() {
  local p="$1"
  case "$p" in /*) ;; *) return 1 ;; esac
  [ "${p%/*}" = "$TMPROOT" ] || return 1
  [ "$p" != "$TMPROOT" ] && [ "$p" != "/" ] && [ "$p" != "$HOME_REAL" ] || return 1
  ! excluded "$p"
}

cmd_tmp() {
  local d kind kb total=0 count=0 uid ncc
  TMPROOT="$(resolve_dir "$TMP_ARG")" || die "temp directory does not exist: $TMP_ARG"
  validate_root TMPROOT "temp directory"
  uid="$(id -u)"
  # Direct children only; -mmin on the folder, then every file inside it.
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    tmp_deletable "$d" || continue
    kind="$(tmp_kind "$d")"
    [ -n "$kind" ] || continue
    if [ -n "$(find "$d" -name .git -print 2>/dev/null | head -n 1)" ]; then
      say "skip (holds a git checkout): $d"
      continue
    fi
    if [ "$OLDER" -gt 0 ] && [ -n "$(find "$d" -mmin "-$OLDER" -print 2>/dev/null | head -n 1)" ]; then
      say "skip (active): $d"
      continue
    fi
    kb="$(size_kb "$d")"
    if [ "$APPLY" -eq 1 ]; then
      rm -rf -- "$d" && say "removed $(human_kb "$kb") ($kind): $d"
    else
      say "would remove $(human_kb "$kb") ($kind): $d"
    fi
    total=$((total + kb))
    count=$((count + 1))
  done <<EOF
$(find "$TMPROOT" -mindepth 1 -maxdepth 1 -type d -user "$uid" -print 2>/dev/null)
EOF
  # Node's compile cache is shared and regenerable, but a running node may be
  # using it: report it, never remove it.
  ncc="$TMPROOT/node-compile-cache"
  [ -d "$ncc" ] && [ ! -L "$ncc" ] &&
    say "not touched: $(human_kb "$(size_kb "$ncc")") in $ncc (Node's shared compile cache; regenerable, remove it by hand when no node process runs)"
  if [ "$APPLY" -eq 1 ]; then
    say "tmp: freed $(human_kb "$total") in $count folder(s) under $TMPROOT"
  else
    say "tmp (dry run): $(human_kb "$total") in $count folder(s) under $TMPROOT; re-run with --apply"
  fi
}

# --------------------------------------------------------- clone auditing
# The GitHub owner/repo of a clone's origin, or empty.
# origin_path DIR: origin's URL without its scheme and host (a folder name
# is made from its last part; `worktree` checks it with valid_name).
origin_path() {
  local url
  url="$(git -C "$1" remote get-url origin 2>/dev/null)" || return 0
  printf '%s\n' "$url" | sed -E 's#^(git@[^:]+:|ssh://git@[^/]+/|https?://([^@/]+@)?[^/]+/)##; s#\.git$##'
}

origin_slug() {
  local slug
  slug="$(origin_path "$1")"
  # The slug goes into `gh api` paths, and a scanned checkout's URL is
  # anyone's to write: path characters only (no ?, &, #, space or %), and
  # no .. segment.
  printf '%s\n' "$slug" | grep -Eq '^[A-Za-z0-9._/-]+$' || return 0
  case "/$slug/" in */../* | */./*) return 0 ;; esac
  printf '%s\n' "$slug"
}

# Only `gh api` is used: it works with the GitHub CLI and with Claude Code's
# built-in gh in a cloud session, which has no other command.
gh_ok() {
  [ "$GH" != "none" ] && [ -n "$1" ] || return 1
  command -v "$GH" >/dev/null 2>&1
}

# A branch name made safe for a query string.
url_q() { printf '%s' "$1" | sed -e 's/%/%25/g' -e 's/&/%26/g' -e 's/+/%2B/g' -e 's/#/%23/g' -e 's/ /%20/g'; }

# The jq for a list of PRs: one "<STATE> <head sha>" line each.
PR_JQ='.[] | "\(if .merged_at then "MERGED" else (.state | ascii_upcase) end) \(.head.sha)"'

# "<STATE> <head sha>" for the PRs from BRANCH in SLUG's own repository.
pr_lines_head() {
  "$GH" api "repos/$1/pulls?head=${1%%/*}:$(url_q "$2")&state=all&per_page=100" --jq "$PR_JQ" 2>/dev/null
}

# "<STATE> <head sha>" for the PRs GitHub associates with commit SHA. This
# finds a PR from a fork by its commit.
pr_lines_commit() {
  "$GH" api "repos/$1/commits/$2/pulls?per_page=100" --jq "$PR_JQ" 2>/dev/null
}

# "<head ref><TAB><STATE><TAB><head sha>" for SLUG's latest 100 PRs, fork PRs
# included. Fetched once per repository per run.
pr_scan() {
  local slug="$1"
  if ! grep -Fxq -- "#$slug" "$SCAN_CACHE" 2>/dev/null; then
    {
      printf '#%s\n' "$slug"
      "$GH" api "repos/$slug/pulls?state=all&per_page=100" \
        --jq '.[] | "\(.head.ref)\t\(if .merged_at then "MERGED" else (.state | ascii_upcase) end)\t\(.head.sha)"' 2>/dev/null |
        awk -v s="$slug" '{ print s "\t" $0 }'
    } >>"$SCAN_CACHE"
  fi
  awk -F'\t' -v s="$slug" '$1 == s { print $2 "\t" $3 "\t" $4 }' "$SCAN_CACHE"
}

# The PR state of local branch BRANCH in clone REPO (GitHub repository
# SLUG). Sets PR_ST to MERGED, CLOSED, OPEN, or empty (no PR, or no gh);
# PR_ON_PR to 1 when the branch's tip is an open PR's head or behind it, so
# it is pushed to that PR even where no remote-tracking ref has it (a fork);
# and PR_PUB to 1 when the tip is a merged or closed PR's head or behind it.
# A merged PR publishes the commits it had, never one made after its head.
#
# A fork PR is not found by head=<owner>:<branch>, so when that finds
# nothing: the PRs associated with the tip commit, then the latest 100 PRs
# whose head ref is BRANCH and whose head commit is the tip or behind it.
pr_state() {
  local repo="$1" slug="$2" branch="$3" tip lines st sha
  PR_ST=""
  PR_ON_PR=0
  PR_PUB=0
  gh_ok "$slug" || return 0
  tip="$(git -C "$repo" rev-parse -q --verify "refs/heads/$branch^{commit}" 2>/dev/null)"
  lines="$(pr_lines_head "$slug" "$branch")"
  [ -n "$lines" ] || [ -z "$tip" ] || lines="$(pr_lines_commit "$slug" "$tip")"
  if [ -z "$lines" ] && [ -n "$tip" ]; then
    lines="$(pr_scan "$slug" | awk -F'\t' -v b="$branch" '$1 == b { print $2, $3 }' |
      while read -r st sha; do
        [ "$sha" = "$tip" ] || git -C "$repo" merge-base --is-ancestor "$sha" "$tip" 2>/dev/null || continue
        printf '%s %s\n' "$st" "$sha"
      done)"
  fi
  case "$lines" in
    *MERGED*) PR_ST=MERGED ;;
    *CLOSED*) PR_ST=CLOSED ;;
    *OPEN*) PR_ST=OPEN ;;
  esac
  [ -n "$tip" ] || return 0
  while read -r st sha; do
    [ -n "$sha" ] || continue
    if [ "$sha" = "$tip" ] || git -C "$repo" merge-base --is-ancestor "$tip" "$sha" 2>/dev/null; then
      case "$st" in
        OPEN) PR_ON_PR=1 ;;
        MERGED|CLOSED) PR_PUB=1 ;;
      esac
    fi
  done <<EOF
$lines
EOF
}

# True when commit SHA of SLUG is a published PR head: its PR is merged or
# closed, or it is an open PR's current head.
commit_pr_published() {
  local slug="$1" sha="$2" lines
  gh_ok "$slug" || return 1
  lines="$(pr_lines_commit "$slug" "$sha")"
  [ -n "$lines" ] || lines="$(pr_scan "$slug" | awk -F'\t' -v s="$sha" '$3 == s { print $2, $3 }')"
  printf '%s\n' "$lines" | awk -v s="$sha" '
    $1 == "MERGED" || $1 == "CLOSED" || ($1 == "OPEN" && $2 == s) { found = 1 }
    END { exit !found }'
}

# The PR number a scratch review branch is named after (pr123, pr-123, pr/123,
# review/pr123), or nothing.
review_pr() {
  printf '%s\n' "$1" | sed -n -E 's#^(review/)?pr[-/]?([0-9]+)$#\2#p'
}

# "<STATE> <head sha>" for PR number N, or nothing.
pr_by_number() {
  local slug="$1" n="$2"
  gh_ok "$slug" || return 0
  "$GH" api "repos/$slug/pulls/$n" \
    --jq '"\(if .merged_at then "MERGED" else (.state | ascii_upcase) end) \(.head.sha)"' 2>/dev/null | head -n 1
}

# ------------------------------------------------------------- trust
# Which git dirs this script lets run a network command with their own
# config. A checkout found by scanning (inside another checkout, or inside a
# build folder: a package that ships a .git in node_modules, a cache clone,
# a bare mirror) has config anyone could have written, and `git ls-remote`
# or `git fetch` with it runs whatever its remote URL (ext::), its
# core.sshCommand or its insteadOf rewrite names. So:
#   - trusted: a checkout under ROOT that is in no other checkout and no
#     build folder (the clones and worktrees you made), or one outside ROOT
#     (a shared clone you named). Fetched into, and asked with ls-remote,
#     with its own config.
#   - untrusted: everything else. Never fetched into. Its config is read as
#     a file (config_safe), and any key outside a short list of inert ones
#     keeps it unread. Its remotes are asked only by URL, https or ssh,
#     from an empty repository with protocol and ssh pinned (safe_ls_remote),
#     plus what the trusted checkout around it was told by its remotes.
#
# checkout_trust DIR: sets TRUSTED (1 or 0) and TRUST_ANCHOR, the common git
# dir of the outermost checkout under ROOT that DIR is inside (empty when
# DIR is trusted, or when that checkout is itself in a build folder).
TRUSTED=1
TRUST_ANCHOR=""
in_build_folder() {
  local n
  for n in $REGENERABLE; do
    case "/$1/" in */"$n"/*) return 0 ;; esac
  done
  return 1
}
checkout_trust() {
  local d="$1" p top=""
  TRUSTED=1
  TRUST_ANCHOR=""
  p="${d%/*}"
  while [ -n "$p" ] && [ "$p" != "$ROOT" ]; do
    case "$p/" in "$ROOT"/*) ;; *) break ;; esac
    [ ! -e "$p/.git" ] || top="$p"
    p="${p%/*}"
  done
  case "$d/" in "$ROOT"/*) in_build_folder "${d#"$ROOT"/}" && TRUSTED=0 ;; esac
  [ -z "$top" ] || TRUSTED=0
  if [ "$TRUSTED" -eq 0 ] && [ -n "$top" ] && ! in_build_folder "${top#"$ROOT"/}"; then
    TRUST_ANCHOR="$(common_git_dir "$top")" || TRUST_ANCHOR=""
  fi
  # A registered submodule of a trusted checkout (a gitlink or .gitmodules
  # path of it) is part of that checkout, its git dir made by git itself:
  # trusted while its config holds only inert keys (config_safe).
  # Decided from files alone: no git runs here.
  if [ "$TRUSTED" -eq 0 ] && [ -n "$top" ]; then
    local sp anchor="$TRUST_ANCHOR" gd
    sp="$(enclosing_checkout "$d")"
    gd="$(git_dir_of "$d")"
    if [ -n "$sp" ] && [ -n "$gd" ] && submodule_by_files "$sp" "$d" "$gd"; then
      checkout_trust "$sp"
      if [ "$TRUSTED" -eq 1 ] && config_safe "$gd" "$d"; then
        TRUST_ANCHOR=""
        return 0
      fi
    fi
    TRUSTED=0
    TRUST_ANCHOR="$anchor"
  fi
  return 0
}

# The git dir of the checkout at DIR read from files: DIR/.git when it is a
# folder, else the folder its .git file names; empty when there is none.
# Exit status 2 when its .git is malformed (gitfile_dir).
git_dir_of() {
  if [ -d "$1/.git" ]; then printf '%s\n' "$1/.git"; else gitfile_dir "$1"; fi
}

# The nearest folder above DIR with a .git in it (file or folder), read from
# the folders; empty when there is none.
enclosing_checkout() {
  local p="${1%/*}"
  while [ -n "$p" ]; do
    [ ! -e "$p/.git" ] || { printf '%s\n' "$p"; return 0; }
    p="${p%/*}"
  done
  return 0
}

# submodule_by_files PARENT DIR GITDIR: true when DIR is a submodule of the
# checkout at PARENT by its files: GITDIR is under PARENT's .git/modules/,
# or DIR's path is a submodule path in PARENT's .gitmodules (cfg_file).
submodule_by_files() {
  local sp="$1" d="$2" gd pg rec rel nl='
'
  gd="$(resolve_dir "$3")" || return 1
  pg="$(git_dir_of "$sp")"
  [ -z "$pg" ] || pg="$(resolve_dir "$pg")" || pg=""
  if [ -n "$pg" ]; then
    case "$gd/" in "$pg/modules/"*) return 0 ;; esac
  fi
  rel="${d#"$sp"/}"
  [ "$rel" != "$d" ] && [ -f "$sp/.gitmodules" ] || return 1
  while IFS= read -r -d '' rec; do
    [ "${rec#*"$nl"}" != "$rel" ] || return 0
  done < <(cfg_file "$sp/.gitmodules" -z --get-regexp '^submodule\..*\.path$' 2>/dev/null)
  return 1
}

# scan_ok DIR: true when git may run with the checkout at DIR as its
# repository: it is trusted (checkout_trust), or its git dir (read from
# files) and any commondir it names hold only inert config (config_safe).
# Sets CFG_WHY when not.
scan_ok() {
  local gd
  CFG_WHY=""
  checkout_trust "$1"
  [ "$TRUSTED" -eq 0 ] || return 0
  gd="$(git_dir_of "$1")" || { CFG_WHY="a malformed .git file in $1"; return 1; }
  [ -n "$gd" ] && [ -d "$gd" ] || { CFG_WHY="no git dir to read at $1"; return 1; }
  config_safe "$gd" "$1"
}

# True when KEY (as `git config --list` prints it) is inert: nothing any git
# command this script runs would execute or fetch because of it.
safe_key() {
  case "$1" in
    core.repositoryformatversion | core.filemode | core.bare | core.logallrefupdates | \
      core.ignorecase | core.precomposeunicode | core.symlinks | core.sparsecheckout | \
      core.sparsecheckoutcone | core.autocrlf | core.eol | core.safecrlf | core.checkstat | \
      core.trustctime | core.quotepath | core.abbrev | core.compression | \
      core.loosecompression | core.splitindex | core.untrackedcache | core.commitgraph | \
      core.multipackindex | core.preloadindex | core.longpaths | core.protectntfs | \
      core.protecthfs) return 0 ;;
    remote.*.url | remote.*.pushurl | remote.*.fetch | remote.*.push | remote.*.tagopt | \
      remote.*.prune | remote.*.prunetags | remote.*.mirror | \
      remote.*.skipdefaultupdate | remote.*.skipfetchall) return 0 ;;
    branch.*.remote | branch.*.merge | branch.*.rebase | branch.*.pushremote | \
      branch.*.description) return 0 ;;
    submodule.*.url | submodule.*.active | submodule.*.ignore | submodule.*.branch | \
      submodule.active) return 0 ;;
    # Not extensions.partialclone: it makes a remote a promisor that git
    # fetches missing objects from (a transport).
    extensions.objectformat | extensions.worktreeconfig | extensions.refstorage | \
      extensions.preciousobjects | extensions.noop) return 0 ;;
    diff.ignoresubmodules | diff.renames | diff.algorithm | status.* | color.* | advice.* | \
      gc.* | pack.* | index.* | fetch.* | init.* | user.* | i18n.* | pull.* | \
      push.default | maintenance.* | lfs.repositoryformatversion) return 0 ;;
  esac
  return 1
}

# config_safe GITDIR [CHECKOUT] [nocommon]: true when every config file of
# GITDIR (config, config.worktree, a worktree's or a submodule's under it)
# holds only inert keys (safe_key). Read as files (`git config --file`,
# which follows no include): an include, a filter, a textconv, a transport
# setting, a promisor or a hook path is a reason to run nothing there.
#   - commondir: git reads the config, refs and objects of the dir it names,
#     wherever that is. With "nocommon" (a bare git dir found by scanning)
#     any commondir refuses; otherwise the dir it names is checked too, and
#     a commondir there refuses.
#   - objects/info/alternates: objects from another dir; refused.
#   - core.worktree: points status, ls-files and attributes at another
#     tree. Allowed only when it resolves to CHECKOUT or a folder inside it
#     (a submodule's git dir names its own checkout); refused otherwise.
# Sets CFG_WHY to the first refusal.
CFG_WHY=""
config_safe() {
  local g="$1" co="${2:-}" mode="${3:-}" f keys key cd wt base
  CFG_WHY=""
  if [ -e "$g/commondir" ]; then
    [ "$mode" != nocommon ] || { CFG_WHY="a commondir file in $g"; return 1; }
    # Parsed exactly as git does; a CR, an embedded newline or an empty
    # value is a shape a loose read would disagree with git on: refuse it.
    cd="$(git_one_line "$g/commondir")" ||
      { CFG_WHY="a malformed commondir file in $g"; return 1; }
    case "$cd" in /*) ;; *) cd="$g/$cd" ;; esac
    cd="$(resolve_dir "$cd")" || { CFG_WHY="a commondir file in $g naming no folder"; return 1; }
    config_safe "$cd" "$co" nocommon || return 1
  fi
  if [ -s "$g/objects/info/alternates" ]; then
    CFG_WHY="$g/objects/info/alternates"
    return 1
  fi
  while IFS= read -r f; do
    [ -n "$f" ] && [ -f "$f" ] || continue
    keys="$(cfg_file "$f" --name-only --list 2>/dev/null)" ||
      { CFG_WHY="$f cannot be read"; return 1; }
    while IFS= read -r key; do
      [ -n "$key" ] || continue
      if [ "$key" = core.worktree ]; then
        wt="$(cfg_file "$f" --get core.worktree 2>/dev/null)"
        base="${f%/*}"
        case "$wt" in /*) ;; *) wt="$base/$wt" ;; esac
        wt="$(resolve_dir "$wt")" || wt=""
        if [ -n "$co" ] && [ -n "$wt" ]; then
          case "$wt/" in "$co"/*) continue ;; esac
        fi
        CFG_WHY="core.worktree in $f, outside the checkout"
        return 1
      fi
      safe_key "$key" || { CFG_WHY="$key in $f"; return 1; }
    done <<EOF
$keys
EOF
  done <<EOF
$g/config
$g/config.worktree
$(find "$g/modules" "$g/worktrees" \( -name config -o -name config.worktree \) -type f 2>/dev/null)
EOF
  return 0
}

# config_safe_tree DIR: config_safe for every git dir of DIR and of every
# checkout inside it (git status recurses into submodules before the
# checkouts inside are audited on their own). Sets CFG_WHY.
config_safe_tree() {
  local d="$1" g gd
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    g="$d/${g#./}"
    if [ -d "$g" ]; then
      gd="$g"
    else
      # Fails closed: a .git that is not a well-formed gitfile is refused,
      # never skipped.
      gd="$(gitfile_dir "${g%/.git}")" && [ -n "$gd" ] ||
        { CFG_WHY="a malformed .git file in ${g%/.git}"; return 1; }
    fi
    # Its commondir, a linked worktree's clone, is checked with it.
    config_safe "$gd" "$d" || return 1
  done < <(cd "$d" 2>/dev/null && find . -name .git -print -prune 2>/dev/null)
  return 0
}

# True when URL is one this script may ask from a neutral repository: https
# or ssh (ssh:// or user@host:path), no option-looking host or path, no
# transport helper (ext::, fd::, anything with ::), no local path.
url_ok() {
  case "$1" in
    '' | -* | *::* | *[[:space:]]* | *@-* | *//-*) return 1 ;;
    https://?*) return 0 ;;
    ssh://?*) return 0 ;;
  esac
  printf '%s\n' "$1" | grep -Eq '^[A-Za-z0-9._][A-Za-z0-9._-]*@[A-Za-z0-9.][A-Za-z0-9.-]*:[^:/-]'
}

# safe_ls_remote URL: `git ls-remote -- URL` from an empty repository made
# for the run, with no system or global config (so no insteadOf, no
# credential helper), only https and ssh allowed, ssh as plain ssh in batch
# mode, and no prompt.
SAFE_REPO=""
safe_ls_remote() {
  url_ok "$1" || return 1
  if [ -z "$SAFE_REPO" ]; then
    SAFE_REPO="$REMOTE_DIR/neutral"
    GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null git init -q --template= "$SAFE_REPO" >/dev/null 2>&1 ||
      { SAFE_REPO=""; return 1; }
  fi
  (
    unset GIT_SSH GIT_SSH_COMMAND GIT_SSH_VARIANT GIT_ASKPASS SSH_ASKPASS GIT_PROXY_COMMAND GIT_DIR GIT_WORK_TREE
    GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_TERMINAL_PROMPT=0 \
      git -C "$SAFE_REPO" -c protocol.allow=never -c protocol.https.allow=always \
      -c protocol.ssh.allow=always -c core.sshCommand="ssh -o BatchMode=yes" \
      -c credential.helper= ls-remote -- "$1"
  )
}

# What counts as "on a remote" is asked of the remote itself, never read off
# the clone's own refs: a remote-tracking ref outlives the branch it tracked
# (deleted upstream, a fetch that failed or never ran), so it proves nothing.
#
# remote_cache GITDIR: the path prefix of this run's cache for the git dir
# (a clone's common dir, or a bare git dir), built on first use by running
# `git ls-remote` against each of its remotes:
#   <prefix>.shas  every commit a reachable remote names (branch and tag
#                  tips, peeled tags, and on GitHub refs/pull/*), that this
#                  clone has locally
#   <prefix>.urls  the fetch URL of each reachable remote (insteadOf applied,
#                  a trailing / and .git dropped), for FETCH_HEAD
#   <prefix>.bad   the remotes that could not be reached
# A remote that cannot be reached vouches for nothing, so work that only it
# would cover is kept. Never prompts: no terminal, ssh in batch mode.
remote_cache() {
  local gd="$1" f r url
  f="$REMOTE_DIR/$(printf '%s' "$gd" | cksum | tr ' ' '-')"
  if [ ! -f "$f.done" ]; then
    : >"$f.all"
    : >"$f.urls"
    : >"$f.bad"
    while IFS= read -r r; do
      [ -n "$r" ] || continue
      # A remote named like an option is never passed to git.
      case "$r" in -*) printf '%s\n' "$r" >>"$f.bad"; continue ;; esac
      if GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o BatchMode=yes}" \
        git --git-dir="$gd" -c protocol.file.allow=always -c protocol.https.allow=always \
          -c protocol.http.allow=always -c protocol.ssh.allow=always -c protocol.git.allow=always \
          ls-remote -- "$r" >"$f.ls" 2>/dev/null; then
        awk '{ print $1 }' "$f.ls" >>"$f.all"
        url="$(git --git-dir="$gd" ls-remote --get-url -- "$r" 2>/dev/null)" && [ -n "$url" ] &&
          norm_url "$url" >>"$f.urls"
      else
        printf '%s\n' "$r" >>"$f.bad"
      fi
    done <<EOF
$(git --git-dir="$gd" remote 2>/dev/null)
EOF
    # Only what this clone holds as a commit can be named to rev-list.
    awk '/^[0-9a-f]+$/' "$f.all" | sort -u |
      git --git-dir="$gd" cat-file --batch-check='%(objectname) %(objecttype)' 2>/dev/null |
      awk '$2 == "commit" { print $1 }' >"$f.shas"
    : >"$f.done"
  fi
  printf '%s\n' "$f"
}

# untrusted_cache GITDIR ANCHOR: remote_cache's files for a git dir this
# script found by scanning (checkout_trust). No git runs with its config
# for a remote: what counts is what ANCHOR's remotes (the trusted checkout
# around it) answered, and what each of its own remote URLs answers when
# asked by URL alone (safe_ls_remote: https or ssh only). A URL that is
# refused or does not answer goes in <prefix>.bad.
untrusted_cache() {
  local gd="$1" anchor="$2" f af key url
  f="$REMOTE_DIR/u$(printf '%s|%s' "$gd" "$anchor" | cksum | tr ' ' '-')"
  if [ ! -f "$f.done" ]; then
    : >"$f.all"
    : >"$f.urls"
    : >"$f.bad"
    if [ -n "$anchor" ]; then
      af="$(remote_cache "$anchor")"
      cat "$af.all" >>"$f.all"
      cat "$af.urls" >>"$f.urls"
    fi
    while IFS=' ' read -r key url; do
      [ -n "$key" ] || continue
      key="${key#remote.}"
      key="${key%.url}"
      if safe_ls_remote "$url" >"$f.ls" 2>/dev/null; then
        awk '{ print $1 }' "$f.ls" >>"$f.all"
        norm_url "$url" >>"$f.urls"
      else
        printf '%s\n' "$key" >>"$f.bad"
      fi
    done <<EOF
$(cfg_file "$gd/config" --get-regexp '^remote\..*\.url$' 2>/dev/null)
EOF
    awk '/^[0-9a-f]+$/' "$f.all" | sort -u |
      git --git-dir="$gd" cat-file --batch-check='%(objectname) %(objecttype)' 2>/dev/null |
      awk '$2 == "commit" { print $1 }' >"$f.shas"
    : >"$f.done"
  fi
  printf '%s\n' "$f"
}

# cache_for DIR: the remote cache that judges the checkout at DIR: its own
# remotes when it is trusted, else untrusted_cache (checkout_trust).
cache_for() {
  local cd
  cd="$(common_git_dir "$1")" || return 1
  checkout_trust "$1"
  if [ "$TRUSTED" -eq 1 ]; then
    remote_cache "$cd"
  else
    untrusted_cache "$cd" "$TRUST_ANCHOR"
  fi
}

# Forget GITDIR's cached remote state (after a fetch changed what it holds).
remote_cache_drop() {
  rm -f -- "$REMOTE_DIR/$(printf '%s' "$1" | cksum | tr ' ' '-')".*
}

# A fetch URL without a trailing / or .git, as FETCH_HEAD records it.
norm_url() {
  local u="$1"
  u="${u%/}"
  u="${u%.git}"
  printf '%s\n' "$u"
}

# The remotes of the checkout at DIR that could not be reached, space-separated.
unreachable_remotes() {
  local f
  f="$(cache_for "$1")" || return 0
  tr '\n' ' ' <"$f.bad" | sed 's/ *$//'
}

# The commits "on a remote" for the checkout at DIR, one SHA per line:
# everything a reachable remote names (remote_cache); commits in DIR's
# FETCH_HEAD fetched from one of those remotes' URLs (a clone fetched by SHA,
# `git fetch origin <sha>`, as a pinned cache does, has no ref naming it;
# a line from any other source, `git fetch . feat` included, proves
# nothing); and the commit a worktree started from, when it is published
# (from_published). FETCH_HEAD is found with --git-path: in a linked
# worktree .git is a file, and each worktree has its own.
on_remote() {
  local fh f sha rest src
  f="$(cache_for "$1")" || return 0
  cat "$f.shas"
  fh="$(git -C "$1" rev-parse --git-path FETCH_HEAD 2>/dev/null)" || fh=""
  case "$fh" in '' | /*) ;; *) fh="$1/$fh" ;; esac
  if [ -n "$fh" ] && [ -f "$fh" ] && [ -s "$f.urls" ]; then
    # "<sha>\t[not-for-merge]\t<what> of <url>". Split by hand: tab is
    # whitespace to read, so IFS would fold the empty middle field away.
    while IFS= read -r rest; do
      sha="${rest%%	*}"
      rest="${rest#*	}"
      rest="${rest#*	}"
      case "$sha" in *[!0-9a-f]* | '') continue ;; esac
      [ "${#sha}" -ge 40 ] || continue
      # "<what> of <url>": the URL is what follows the last " of ".
      src="$(norm_url "${rest##* of }")"
      [ "$src" != "$rest" ] || continue
      grep -Fxq -- "$src" "$f.urls" || continue
      git -C "$1" cat-file -e "$sha^{commit}" 2>/dev/null && printf '%s\n' "$sha"
    done <"$fh"
  fi
  from_published "$1"
}

# excl_file DIR: a new file of "^<sha>" lines, one per commit on_remote
# names, for `git rev-list --stdin` (a list that may run to thousands of
# refs/pull heads never goes on a command line). Prints its path.
excl_file() {
  local x
  x="$(mktemp "$REMOTE_DIR/excl.XXXXXX")" || return 1
  on_remote "$1" | sort -u | sed 's/^/^/' >"$x"
  printf '%s\n' "$x"
}

# unpublished_count DIR EXCL REV...: how many commits REV... reach that no
# remote does, or empty when git cannot say (a missing object, say), which
# callers keep.
unpublished_count() {
  local repo="$1" x="$2" n
  shift 2
  n="$(git -C "$repo" rev-list --count --stdin "$@" <"$x" 2>/dev/null)" || n=""
  case "$n" in '' | *[!0-9]*) n="" ;; esac
  printf '%s\n' "$n"
}
# The commit that `worktree` recorded as a worktree's start (hygiene-from in
# its git dir, "<sha>" or "<sha> remote"), when it is published. A review
# worktree starts from FETCH_HEAD after `git fetch origin pull/<N>/head`, and
# close's own fetch overwrites FETCH_HEAD, so the record is what proves it.
# Published means: it was on the remote when the worktree was made
# ("remote"), or its PR is merged or closed, or it is an open PR's head (a
# squash-merged or fork PR head is on no remote branch).
from_published() {
  local gd sha how
  gd="$(git -C "$1" rev-parse --absolute-git-dir 2>/dev/null)" || return 0
  [ -f "$gd/hygiene-from" ] || return 0
  read -r sha how <"$gd/hygiene-from" || [ -n "${sha:-}" ] || return 0
  case "$sha" in '' | *[!0-9a-f]*) return 0 ;; esac
  git -C "$1" cat-file -e "$sha^{commit}" 2>/dev/null || return 0
  if [ "${how:-}" = remote ] || commit_pr_published "$(origin_slug "$1")" "$sha"; then
    printf '%s\n' "$sha"
  fi
}

# patches_on_remote DIR EXCL TIP [NOT...]: true when every commit TIP reaches
# that no remote does (and NOT... do not) is already on a remote as the same
# change: an equal `git patch-id --stable` (a rebase or a one-commit squash
# merge keeps the change, not the SHA). A matching subject proves nothing.
# Merges and empty commits have no patch-id, so they are never matched, and
# binary changes are compared in full (--binary), never as "Binary files
# differ". The remote side is the commits a reachable remote names that TIP
# does not reach, at most 20000 of them: past that, nothing is matched.
patches_on_remote() {
  local repo="$1" x="$2" tip="$3" cand pos want have
  shift 3
  cand="$(git -C "$repo" rev-list --stdin "$tip" "$@" <"$x" 2>/dev/null)" || return 1
  [ -n "$cand" ] || return 0
  # A merge has no patch of its own to match.
  [ -z "$(printf '%s\n' "$cand" | git -C "$repo" rev-list --no-walk --merges --stdin 2>/dev/null)" ] || return 1
  pos="$(mktemp "$REMOTE_DIR/pos.XXXXXX")" || return 1
  sed 's/^\^//' "$x" >"$pos"
  printf '^%s\n' "$tip" >>"$pos"
  have="$(git -C "$repo" rev-list --no-merges --max-count=20000 --stdin <"$pos" 2>/dev/null)" || have=""
  rm -f -- "$pos"
  # Never `git log --stdin` an empty list: with no revision it shows HEAD.
  [ -n "$have" ] || return 1
  have="$(printf '%s\n' "$have" |
    git -C "$repo" log --no-walk=unsorted --stdin -p --binary --no-textconv --no-ext-diff --format='commit %H' 2>/dev/null |
    git -C "$repo" patch-id --stable 2>/dev/null | awk '{ print $1 }' | sort -u)"
  want="$(printf '%s\n' "$cand" |
    git -C "$repo" log --no-walk=unsorted --stdin -p --binary --no-textconv --no-ext-diff --format='commit %H' 2>/dev/null |
    git -C "$repo" patch-id --stable 2>/dev/null)"
  # Every candidate needs a patch-id (an empty commit has none) ...
  [ "$(printf '%s\n' "$want" | grep -c .)" -eq "$(printf '%s\n' "$cand" | grep -c .)" ] || return 1
  # ... and each must be on the remote side.
  printf '%s\n' "$want" | awk '{ print $1 }' | while IFS= read -r p; do
    printf '%s\n' "$have" | grep -Fxq -- "$p" || { echo missing; break; }
  done | grep -q missing && return 1
  return 0
}

# True when DIR is a linked worktree: its .git is a file pointing at a git dir
# under another clone's .git/worktrees/ (a submodule's has no commondir).
is_linked_worktree() {
  local gd
  [ -f "$1/.git" ] || return 1
  gd="$(git -C "$1" rev-parse --absolute-git-dir 2>/dev/null)" || return 1
  [ -f "$gd/commondir" ]
}

# other_refs DIR EXCL: for a clone, every ref other than its branches, HEAD
# and the stash (judged on their own): tags, notes, remote-tracking refs
# (one whose branch is gone upstream holds commits nothing else may) and any
# other namespace. Each one reaching a commit no remote names is a reason
# (audit_clone's add). Deleting the clone deletes them all.
other_refs() {
  local repo="$1" x="$2" ref n
  while IFS= read -r ref; do
    case "$ref" in '' | refs/heads/* | refs/stash) continue ;; esac
    n="$(unpublished_count "$repo" "$x" "$ref")"
    if [ -z "$n" ]; then
      add "$ref: git cannot list its commits"
    elif [ "$n" -gt 0 ]; then
      add "$ref: $n commit(s) on no remote"
    fi
  done <<EOF
$(git -C "$repo" for-each-ref --format='%(refname)' 2>/dev/null)
EOF
}

# hidden_edits DIR: how many tracked files git status cannot see edited: an
# entry marked --assume-unchanged (ls-files -v: a lowercase tag) or
# --skip-worktree (S) whose file is in the work tree and differs from the
# index. A skip-worktree file a sparse checkout left out is not there, and
# is not counted. Empty when git cannot say.
hidden_edits() {
  local repo="$1" rec tag path n=0 idx cur
  while IFS= read -r -d '' rec; do
    tag="${rec%% *}"
    path="${rec#* }"
    case "$tag" in [a-z] | S) ;; *) continue ;; esac
    [ -e "$repo/$path" ] || [ -L "$repo/$path" ] || continue
    if [ -f "$repo/$path" ] && [ ! -L "$repo/$path" ]; then
      idx="$(git -C "$repo" rev-parse -q --verify ":$path" 2>/dev/null)" || idx=""
      cur="$(git -C "$repo" hash-object --path="$path" -- "$repo/$path" 2>/dev/null)" || cur=""
      [ -n "$idx" ] && [ "$idx" = "$cur" ] && continue
    fi
    n=$((n + 1))
  done < <(git -C "$repo" ls-files -v -z 2>/dev/null)
  printf '%s\n' "$n"
}

# Build output an ignored path may be part of, by name: the regenerable
# folders prune removes, and the usual output and cache folders and files.
# An ignored file anywhere else (.env, notes kept out of git) is work.
IGNORED_OK="$REGENERABLE dist build .svelte-kit .vite .parcel-cache .cache-loader coverage .nyc_output __pycache__ .pytest_cache .mypy_cache .ruff_cache .venv venv .tox .gradle .eslintcache .DS_Store"

# True when the relative PATH is build output: a component of it is named
# in IGNORED_OK, or it ends in .tsbuildinfo, .pyc or .log.
ignored_ok() {
  local p="/$1/" n
  case "$p" in *.tsbuildinfo/ | *.pyc/ | *.log/) return 0 ;; esac
  for n in $IGNORED_OK; do
    case "$p" in */"$n"/*) return 0 ;; esac
  done
  return 1
}

# ignored_work DIR: up to three ignored paths in DIR that are not build
# output (ignored_ok), comma-separated; empty when there are none. An
# ignored folder is looked into (git names it as a whole), skipping build
# folders and any checkout inside it (deletion_gate audits those on their
# own). A path git cannot list makes it "(git status failed)".
ignored_work() {
  local repo="$1" rec path found="" k=0 hit
  while IFS= read -r -d '' rec; do
    case "$rec" in '!! '*) ;; *) continue ;; esac
    path="${rec#!! }"
    ignored_ok "${path%/}" && continue
    case "$path" in
      */)
        [ -d "$repo/$path" ] || continue
        # A checkout of its own: judged by deletion_gate, not here.
        [ ! -e "$repo/$path.git" ] || continue
        hit="$(ignored_in "$repo/${path%/}")"
        [ -n "$hit" ] || continue
        path="${path}${hit#./}" ;;
    esac
    found="${found:+$found, }$path"
    k=$((k + 1))
    [ "$k" -lt 3 ] || break
  done < <(git -C "$repo" status --porcelain -z --ignored=matching --untracked-files=all 2>/dev/null ||
    printf '!! (git status failed)\0')
  printf '%s\n' "$found"
}

# The first file in the ignored folder DIR that is not build output, outside
# any checkout inside it, relative to DIR ("./x"); empty when there is none.
# Searched from inside DIR, so its name is never read as a pattern.
ignored_in() {
  local f names=""
  for f in $IGNORED_OK; do names="$names -o -name $f"; done
  # shellcheck disable=SC2086 # $names is a fixed list of plain words
  (cd "$1" 2>/dev/null && find . -type d \( -false $names -o -exec sh -c 'test -e "$1/.git"' sh '{}' ';' \) -prune \
    -o \( -type f -o -type l \) ! -name '*.pyc' ! -name '*.log' ! -name '*.tsbuildinfo' ! -name .DS_Store -print 2>/dev/null) |
    head -n 1
}

# The checks of audit_clone, for a checkout git reads as its own. Runs in
# audit_clone's scope: it reads and sets that function's locals (repo,
# linked, top, status, reasons, safe, wtlist, ...) and calls its add and
# add_wt.
audit_checks() {
  # A status that fails (a worktree whose git dir is gone, a broken clone)
  # proves nothing, so it is never CLEAN. Every untracked file counts, and so
  # does every submodule change, whatever status.showUntrackedFiles,
  # submodule.<name>.ignore or diff.ignoreSubmodules say.
  if status="$(git -C "$repo" status --porcelain --untracked-files=all --ignore-submodules=none 2>/dev/null)"; then
    dirty="$(printf '%s' "$status" | grep -c .)"
    [ "$dirty" -eq 0 ] || add "$dirty uncommitted change(s)"
  else
    add "git status failed (a broken clone, or a worktree whose clone is gone)"
  fi
  # Read once: the worktrees below, and the scratch branches checked out.
  wtlist="$(git -C "$repo" worktree list --porcelain 2>/dev/null)"
  # Deleting a clone cuts its linked worktrees off from their git data, so a
  # clone with a worktree still checked out is kept.
  if [ -d "$repo/.git" ]; then
    while IFS= read -r wt; do
      [ -n "$wt" ] && [ -d "$wt" ] || continue
      wtr="$(resolve_dir "$wt")"
      [ "$wtr" != "$repo" ] || continue
      # Removed by this sweep already (or, in a dry run, it would be).
      ! in_swept "$wtr" || continue
      add_wt "worktree $wt is still checked out (git worktree remove it first)"
      HOLDERS="${HOLDERS}worktree	$wt
"
    done <<EOF
$(printf '%s\n' "$wtlist" | sed -n 's/^worktree //p')
EOF
  fi
  # Edits git status cannot see, and ignored files that are not build output.
  hidden="$(hidden_edits "$repo")"
  [ "$hidden" = 0 ] || add "${hidden:-some} tracked file(s) edited under --assume-unchanged or --skip-worktree (git status hides them)"
  ignored="$(ignored_work "$repo")"
  [ -z "$ignored" ] || add "ignored file(s) that are not build output: $ignored"
  # What a reachable remote names (on_remote), as "^<sha>" lines for
  # rev-list --stdin. A remote that cannot be reached vouches for nothing.
  excl="$(excl_file "$repo")" || { add "could not make a temp file to judge it"; return 0; }
  unreach="$(unreachable_remotes "$repo")"
  # A worktree shares its clone's stashes, branches, tags and other refs,
  # and removing it touches none of them: judge only what is checked out in
  # it.
  if [ "$linked" -eq 0 ]; then
    stashes="$(git -C "$repo" stash list 2>/dev/null | wc -l | tr -d ' ')"
    [ "$stashes" -eq 0 ] || add "$stashes stash(es)"
    other_refs "$repo" "$excl"
  fi
  if git -C "$repo" rev-parse -q --verify HEAD >/dev/null 2>&1 &&
    ! git -C "$repo" symbolic-ref -q HEAD >/dev/null 2>&1; then
    n="$(unpublished_count "$repo" "$excl" HEAD)"
    if [ -z "$n" ]; then
      add "detached HEAD: git cannot list its commits"
    elif [ "$n" -gt 0 ] && ! patches_on_remote "$repo" "$excl" HEAD; then
      add "detached HEAD with $n commit(s) on no remote"
    fi
  fi

  slug="$(origin_slug "$repo")"
  if [ "$linked" -eq 1 ]; then
    branches="$(git -C "$repo" symbolic-ref -q --short HEAD 2>/dev/null)"
  else
    branches="$(git -C "$repo" for-each-ref --format='%(refname:short)' refs/heads 2>/dev/null)"
  fi
  while IFS= read -r b; do
    [ -n "$b" ] || continue
    n="$(unpublished_count "$repo" "$excl" "refs/heads/$b")"
    [ -n "$n" ] || { add "$b: git cannot list its commits"; continue; }
    # A scratch review branch (`git fetch origin pull/<N>/head:pr<N>`): its
    # commits live on GitHub as the PR's head, not under refs/remotes. Up to
    # that head it is published; once the PR is merged or closed it is
    # scratch that is safe to delete.
    pr="$(review_pr "$b")"
    rv=""
    [ -z "$pr" ] || rv="$(pr_by_number "$slug" "$pr")"
    if [ -n "$rv" ]; then
      head="${rv#* }"
      tip="$(git -C "$repo" rev-parse -q --verify "refs/heads/$b^{commit}" 2>/dev/null)"
      beyond=""
      if [ "$tip" = "$head" ]; then
        beyond=0
      elif git -C "$repo" cat-file -e "$head^{commit}" 2>/dev/null; then
        beyond="$(unpublished_count "$repo" "$excl" "refs/heads/$b" "^$head")"
        [ -n "$beyond" ] || beyond=1
      fi
      if [ "$beyond" = 0 ]; then
        case "${rv%% *}" in
          MERGED|CLOSED) safe="${safe}$b	$pr	${rv%% *}
" ;;
        esac
        continue
      elif [ -n "$beyond" ]; then
        patches_on_remote "$repo" "$excl" "refs/heads/$b" "^$head" ||
          add "$b: $beyond commit(s) beyond PR #$pr's head, on no remote"
        continue
      fi
    fi
    [ "$n" -gt 0 ] || continue # every commit is on a remote: published
    pr_state "$repo" "$slug" "$b"
    # Published by its merged or closed PR (a squash merge leaves the SHAs
    # local-only), but only up to that PR's head: never a commit made after.
    [ "$PR_PUB" -eq 0 ] || continue
    [ "$PR_ON_PR" -eq 0 ] || continue # its tip is on its open PR (a fork's head is under no remote ref)
    patches_on_remote "$repo" "$excl" "refs/heads/$b" && continue
    case "$PR_ST" in
      OPEN) add "$b: $n commit(s) not pushed to its open PR" ;;
      MERGED|CLOSED) add "$b: $n commit(s) on no remote, some made after its $PR_ST PR's head" ;;
      *) add "$b: $n commit(s) on no remote and no PR" ;;
    esac
  done <<EOF
$branches
EOF
  rm -f -- "$excl"
  # Say why nothing could vouch for the work above.
  [ "$nwork" -eq 0 ] || [ -z "$unreach" ] ||
    reasons="${reasons:+$reasons; }remote(s) not reachable, so nothing they hold counts: $unreach"

  # Whether it may go with everything inside it (deletion_gate): only for
  # the checkout audited for removal; the checkouts inside it are found
  # there, all at once, and audited with AUDIT_DEPTH > 0.
  if [ "$top" -eq 1 ]; then
    AUDIT_DEPTH=1
    deletion_gate "$repo" "$linked"
    AUDIT_DEPTH=0
  fi

}

# Audit one clone or worktree. Prints one report line (and a line per scratch
# review branch that is safe to delete) and sets VERDICT (CLEAN, KEEP, ACTIVE).
audit_clone() {
  local repo="$1" reasons status dirty stashes n slug branches b st kb active excl owner wt
  local hidden ignored unreach unsafe
  local linked=0 safe="" pr rv head tip beyond nwork=0 wtr wtlist top=0
  # The checkout audited for removal (not one inside it): only it is gated.
  [ "$AUDIT_DEPTH" -gt 0 ] || top=1
  VERDICT=CLEAN
  reasons=""
  # Before any git runs there: a checkout found inside another (or in a
  # build folder) must pass the config allowlist, read from files, with
  # every checkout inside it (git status recurses into submodules).
  unsafe=""
  checkout_trust "$repo"
  if [ "$TRUSTED" -eq 0 ] && { ! scan_ok "$repo" || ! config_safe_tree "$repo"; }; then
    unsafe="$CFG_WHY"
  fi
  [ -n "$unsafe" ] || ! is_linked_worktree "$repo" || linked=1
  # Judge activity before any git command touches the clone.
  active=0
  recently_active "$repo" && active=1
  # add: unpublished work here. add_wt: a worktree still needs this clone.
  add() { reasons="${reasons:+$reasons; }$1"; VERDICT=KEEP; nwork=$((nwork + 1)); }
  add_wt() { reasons="${reasons:+$reasons; }$1"; VERDICT=KEEP; }

  # Only a checkout git reads as its own is judged: anything else (a .git git
  # does not recognise, a git dir that is gone) is kept for a human.
  if [ -n "$unsafe" ]; then
    # Not one git command runs there: its config could make it run anything.
    add "untrusted git config ($unsafe): it was found inside another checkout or a build folder, so nothing is run there; inspect it by hand"
  elif own_checkout "$repo"; then
    audit_checks
  else
    add "git status failed: git cannot read $repo as its own repository (a .git it does not recognise, or a git dir that is gone)"
  fi

  # What deleting it frees, each byte once (the checkouts inside it are not
  # measured on their own: the one being removed counts them).
  kb=0
  [ "$top" -eq 0 ] || kb="$(freeable_kb "$repo")"
  if [ "$VERDICT" = CLEAN ] && [ "$active" -eq 1 ]; then
    VERDICT=ACTIVE
    reasons="changed in the last $OLDER min"
  fi
  owner="$(owner_above "$repo")"
  # KEEP_WORK: how many reasons are unpublished work, not worktrees in use.
  KEEP_WORK="$nwork"
  # remove_clone deletes only the checkout that this audit gated.
  if [ "$top" -eq 1 ]; then
    GATE_OF="$repo"
    GATE_LINKED="$linked"
  fi
  printf '%-6s %10s  %s%s%s\n' "$VERDICT" "$(human_kb "$kb")" "$repo" "${reasons:+  ($reasons)}" "${owner:+  [owner: $owner]}"
  while IFS='	' read -r b pr st; do
    [ -n "$b" ] || continue
    if printf '%s\n' "$wtlist" | grep -Fxq "branch refs/heads/$b"; then
      say "       safe to delete: $b (scratch review branch, PR #$pr ${st}; checked out, so switch away or remove its worktree first)"
    else
      say "       safe to delete: $b (scratch review branch, PR #$pr ${st}): git -C $repo branch -D $b"
    fi
  done <<EOF
$safe
EOF
  CLONE_KB="$kb"
}

list_clones() {
  # Worktrees (a .git file) before clones (a .git folder), so sweep judges a
  # clone after it has removed the clone's worktrees. Within each, deepest
  # first, so a nested clone is judged before the one around it. A submodule
  # is not listed: its parent owns it (and audits it as a nested clone).
  find "$ROOT" \( -name node_modules -o -name target \) -prune -o -name .git -print 2>/dev/null |
    while IFS= read -r g; do
      d="${g%/.git}"
      ! is_submodule "$d" || continue
      kind=1
      [ -d "$g" ] || kind=0
      printf '%s\t%s\t%s\n' "$kind" "$(printf '%s' "$d" | tr -cd '/' | wc -c | tr -d ' ')" "$d"
    done | sort -k1,1n -k2,2rn | cut -f3-
}

# Remove a linked worktree the way git expects: `git worktree remove`, which
# also drops its entry under the clone's .git/worktrees/ (an `rm -rf` leaves
# that entry, and its branch stays "checked out" until `git worktree prune`).
# A branch that `hygiene.sh worktree` created for it is deleted too: the audit
# has just found it published.
#
# True when the checkout WT has a submodule checked out: a gitlink in its
# index whose path holds a .git (file or folder). Read NUL-separated, so a
# path git would quote (non-ASCII, quotes) still matches. The index, not
# .gitmodules: git's own check reads the index, and a gitlink needs no
# .gitmodules entry.
has_checked_out_gitlink() {
  local rec
  while IFS= read -r -d '' rec; do
    [ ! -e "$1/${rec#*	}/.git" ] || return 0
  done < <(gitlinks "$1")
  return 1
}

# The one gate before any deletion. DIR goes by `git worktree remove` (a
# linked worktree; LINKED is 1) or by rm -rf (anything else), and either
# takes every file inside it, gitignored folders, node_modules and target
# included. So DIR may go only when:
#   - its git dirs may be written to: a worktree's own entry and its clone's
#     .git are not /, your home or under ~/GitHub; a clone's git dir is
#     inside it (a --separate-git-dir elsewhere would be left behind);
#   - git would remove it without --force: not locked, no submodule in it;
#   - it is not a submodule (those go with their parent);
#   - and every checkout inside it (any .git entry, file or folder) passes
#     too: git can read it, its git dir is inside DIR (a worktree of a clone
#     outside DIR is never deleted with it: at most `git worktree remove` it
#     against its own clone, by hand), it is not locked, no other agent owns
#     it, and its own audit (status with every untracked file and submodule
#     change, stashes, branches) finds nothing unpublished.
# Each refusal is a reason on the audit's line (add: unpublished work;
# add_wt: held), naming the checkout inside. Called by audit_clone for the
# checkout it audits, so audit, close and sweep all report it, and
# remove_clone deletes only what this gate has just passed.
deletion_gate() {
  local dir="$1" linked="$2" g n own inner inner_work o why h gated="" dgd="" anchor="" gd
  # What the bare git dirs inside are judged against: the remotes of DIR's
  # clone when DIR is trusted, else of the checkout around it.
  checkout_trust "$dir"
  if [ "$TRUSTED" -eq 1 ]; then
    anchor="$(common_git_dir "$dir")" || anchor=""
  else
    anchor="$TRUST_ANCHOR"
  fi
  if git_dirs "$dir"; then
    dgd="$CK_GD"
    if [ "$linked" -eq 1 ]; then
      { git_dir_writable "$CK_GD" admin && git_dir_writable "$CK_CD" admin; } || add_wt "$GD_WHY"
      [ ! -f "$CK_GD/locked" ] || add_wt "locked: git worktree unlock it first"
      if [ -d "$CK_GD/modules" ] || has_checked_out_gitlink "$dir"; then
        add_wt "it holds a submodule, which git removes only with --force"
      fi
    else
      case "$CK_GD/" in
        "$dir"/*) ;;
        *)
          why="$(protected_why "$CK_GD")"
          add_wt "its git dir $CK_GD is outside it${why:+ ($why)}; deleting the checkout would leave that git dir behind" ;;
      esac
    fi
  fi # git cannot read it: the audit's failed git status keeps it
  if is_submodule "$dir"; then
    add_wt "a submodule of $(submodule_parent "$dir"); it goes only with its parent"
  fi
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    # find ran from inside DIR (see below): "./x/.git" is DIR/x/.git.
    n="$dir/${g#./}"
    n="${n%/.git}"
    # Removed by this sweep already (or, in a dry run, it would be).
    ! in_swept "$n" || continue
    # Before any git runs there: a checkout inside DIR is untrusted unless
    # it is a registered submodule (checkout_trust), and its config, read
    # as a file, must be inert (config_safe: no commondir elsewhere, no
    # core.worktree outside it, no command-running key).
    if [ -d "$n/.git" ]; then
      gd="$n/.git"
    elif ! gd="$(gitfile_dir "$n")" || [ -z "$gd" ]; then
      # Fails closed: no git runs on it, and it is never skipped.
      add "nested checkout $n: a malformed .git file in $n; nothing is run there"
      continue
    fi
    if [ -d "$gd" ] && ! config_safe "$gd" "$n"; then
      add "nested checkout $n: untrusted git config ($CFG_WHY); nothing is run there"
      continue
    fi
    # Git skips a .git it does not recognise and answers for the repository
    # around it: such a checkout is kept, never judged by DIR's state.
    if ! own_checkout "$n"; then
      add "git cannot read $n as its own repository (a .git it does not recognise, or a git dir that is gone)"
      continue
    fi
    gated="$gated$CK_GD
"
    if [ -f "$CK_GD/commondir" ]; then
      case "$CK_CD/" in
        "$dir"/*) ;;
        *)
          add_wt "nested worktree $n belongs to the clone at ${CK_CD%/.git}, outside it; git worktree remove it there, never with this folder"
          HOLDERS="${HOLDERS}worktree	$n
"
          continue ;;
      esac
      if [ -f "$CK_GD/locked" ]; then
        add_wt "nested worktree $n is locked"
        HOLDERS="${HOLDERS}worktree	$n
"
      fi
    else
      case "$CK_GD/" in
        "$dir"/*) ;;
        *)
          add_wt "nested checkout $n keeps its git dir $CK_GD outside it"
          continue ;;
      esac
    fi
    # Deleting DIR deletes it too: never another agent's. That holds DIR, as
    # another agent's worktree does: report it.
    o="$(owner_above "$n")"
    if ! owner_ok "$o"; then
      add_wt "nested clone $n belongs to agent $o"
      HOLDERS="${HOLDERS}checkout	$n
"
    fi
    own="$VERDICT"
    audit_clone "$n" >/dev/null
    inner="$VERDICT"
    inner_work="$KEEP_WORK"
    VERDICT="$own"
    case "$inner" in
      KEEP)
        # The same split as for DIR: unpublished work, or only a worktree in use.
        if [ "$inner_work" -gt 0 ]; then
          add "nested clone $n holds unpublished work"
        else
          add_wt "nested clone $n has a worktree checked out (close it first)"
        fi ;;
      # DIR's own activity check skips node_modules, target, .next and .turbo.
      ACTIVE) add_wt "nested checkout $n changed in the last $OLDER min" ;;
    esac
  done < <(cd "$dir" 2>/dev/null && find . -path ./.git -prune -o -name .git -print -prune 2>/dev/null)
  # Git dirs not named .git: a bare repository or mirror (foo.git), or a
  # deinit'd submodule's <clone>/.git/modules/<name>. A folder with HEAD,
  # objects/ and refs/ that is not DIR's own git dir or a checkout's above.
  while IFS= read -r h; do
    g="${h%/HEAD}"
    [ -d "$g/objects" ] && [ -d "$g/refs" ] || continue
    g="$(resolve_dir "$g")" || continue
    [ "$g" != "$dgd" ] || continue
    ! printf '%s' "$gated" | grep -Fxq -- "$g" || continue
    ! in_swept "$g" || continue
    GATE_ANCHOR="$anchor"
    gate_git_dir "$g"
  done < <(find "$dir" -name objects -prune -o -name HEAD -type f -print 2>/dev/null)
}

# The gate for a git dir with no checkout of its own (a bare repository, a
# mirror, a deinit'd submodule's git dir): it goes only when git can read it,
# it has no stash, and every commit any of its refs (branches, tags, notes,
# remote-tracking refs) or HEAD reaches is named by one of its remotes,
# asked with `git ls-remote` (remote_cache). A remote-tracking ref is not
# asked: it may be stale. With no remote it can reach, any commit keeps it.
gate_git_dir() {
  local g="$1" n f x
  # Found by scanning: its config is untrusted (checkout_trust).
  if ! config_safe "$g" "" nocommon; then
    add "git dir $g: untrusted git config ($CFG_WHY); nothing is run there"
    return 0
  fi
  if ! git --git-dir="$g" rev-parse --git-dir >/dev/null 2>&1; then
    add "git dir $g: git cannot read it"
    return 0
  fi
  if git --git-dir="$g" rev-parse -q --verify refs/stash >/dev/null 2>&1; then
    add "git dir $g holds a stash"
  fi
  f="$(untrusted_cache "$g" "$GATE_ANCHOR")"
  x="$(mktemp "$REMOTE_DIR/excl.XXXXXX")" || { add "git dir $g: could not make a temp file"; return 0; }
  sed 's/^/^/' "$f.shas" >"$x"
  if git --git-dir="$g" rev-parse -q --verify 'HEAD^{commit}' >/dev/null 2>&1; then
    n="$(git --git-dir="$g" rev-list --count --stdin --all HEAD <"$x" 2>/dev/null)" || n=""
  else
    n="$(git --git-dir="$g" rev-list --count --stdin --all <"$x" 2>/dev/null)" || n=""
  fi
  rm -f -- "$x"
  case "$n" in
    0) ;;
    '' | *[!0-9]*) add "git dir $g: git cannot list its commits" ;;
    *) add "git dir $g holds $n commit(s) no reachable remote names" ;;
  esac
  return 0
}

# True when PATH is a checkout this run has removed (or, in a dry run, would
# remove), or is inside one.
in_swept() {
  [ -n "$SWEPT_PATHS" ] || return 1
  printf '%s\n' "$SWEPT_PATHS" | awk -v p="$1" 'length($0) && (p == $0 || index(p, $0 "/") == 1) { f = 1 } END { exit !f }'
}

# What deleting DIR frees, in KB, each byte once: its size when the sweep
# began (or now), less what this run has already tallied inside it: the
# checkouts removed before it and, in a dry run, the folders prune would
# remove (with --apply they were gone before the sweep measured). The same
# arithmetic in both modes, so the dry run's total is what --apply frees.
freeable_kb() {
  local d="$1" kb inside
  kb="$(awk -F'\t' -v p="$d" '$2 == p { print $1; exit }' "$PRESIZE" 2>/dev/null)"
  [ -n "$kb" ] || kb="$(size_kb "$d")"
  inside="$(awk -F'\t' -v p="$d/" 'index($2, p) == 1 { s += $1 } END { print s + 0 }' "$CLOSE_TALLY")"
  if [ "$APPLY" -eq 0 ]; then
    inside=$((inside + $(awk -F'\t' -v p="$d/" 'index($2, p) == 1 { s += $1 } END { print s + 0 }' "$PRUNE_TALLY")))
  fi
  kb=$((kb - inside))
  [ "$kb" -ge 0 ] || kb=0
  printf '%s\n' "$kb"
}

# Remove the linked worktree WT with `git worktree remove` (deletion_gate has
# passed it). Its branch goes too when `hygiene.sh worktree` made it, unless
# the clone's refs may not be written (an --exclude'd clone keeps it).
remove_worktree() {
  local wt="$1" kb="$2" gd common branch keepb=""
  git_dirs "$wt" || { say "  not removing (git cannot read it): $wt"; return 1; }
  gd="$CK_GD"
  common="$CK_CD"
  branch=""
  [ -f "$gd/hygiene-branch" ] && branch="$(head -n 1 "$gd/hygiene-branch" | tr -d '[:space:]')"
  [ "$branch" = "$(git -C "$wt" symbolic-ref -q --short HEAD 2>/dev/null)" ] || branch=""
  if [ -n "$branch" ] && ! git_dir_writable "$common"; then keepb="$GD_WHY"; fi
  if [ "$APPLY" -eq 1 ]; then
    git --git-dir="$common" worktree remove -- "$wt" >/dev/null 2>&1 ||
      { say "  git worktree remove failed: $wt"; return 1; }
    say "  removed worktree $(human_kb "$kb"): $wt"
    if [ -n "$keepb" ]; then
      say "  kept its local branch $branch ($keepb)"
    elif [ -n "$branch" ] && git --git-dir="$common" branch -D -- "$branch" >/dev/null 2>&1; then
      say "  deleted its local branch $branch (published)"
    fi
  else
    if [ -n "$keepb" ]; then
      say "  would remove worktree $(human_kb "$kb") (git worktree remove): $wt; would keep its local branch $branch ($keepb)"
    else
      say "  would remove worktree $(human_kb "$kb") (git worktree remove): $wt${branch:+, and its local branch $branch}"
    fi
  fi
  printf '%s\t%s\n' "$kb" "$wt" >>"$CLOSE_TALLY"
}

remove_clone() {
  local repo="$1" kb="$2" parent
  deletable "$repo" || { say "  not deleting (outside the root, under ~/GitHub, or excluded): $repo"; return 1; }
  [ -e "$repo/.git" ] || { say "  not deleting (no .git): $repo"; return 1; }
  # Only what the audit just gated (deletion_gate) and found CLEAN.
  [ "$GATE_OF" = "$repo" ] && [ "$VERDICT" = CLEAN ] ||
    { say "  not deleting (not audited clean just now): $repo"; return 1; }
  if [ "$GATE_LINKED" -eq 1 ]; then
    remove_worktree "$repo" "$kb"
    return
  fi
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
  printf '%s\t%s\n' "$kb" "$repo" >>"$CLOSE_TALLY"
}

# Fetch origin into the checkout at DIR (close and sweep, before judging
# it), pruning remote-tracking refs whose branch is gone, so the judgement
# sees what origin has now. Never prompts. What counts as published is
# still asked of each remote (remote_cache), fetched or not.
fetch_checkout() {
  local rc=0
  GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND="${GIT_SSH_COMMAND:-ssh -o BatchMode=yes}" \
    git_user -C "$1" fetch --quiet --prune origin 2>/dev/null || rc=1
  [ -z "$CK_CD" ] || remote_cache_drop "$CK_CD"
  return "$rc"
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
  # Before the fetch too: a submodule is closed with its parent, and the fetch
  # writes into the checkout's git dirs (a worktree's clone, or a
  # --separate-git-dir), which must be writable.
  sp="$(submodule_parent "$repo")"
  [ -z "$sp" ] || die "refusing: $repo is a submodule of $sp; close its parent instead"
  # Refuse only what is positively protected. A checkout git cannot read is
  # audited (its failed status keeps it, exit 2), and one whose refs are
  # excluded is judged without a fetch.
  HOLDERS=""
  checkout_trust "$repo"
  if [ "$TRUSTED" -eq 0 ]; then
    say "not fetching: $repo is inside another checkout or a build folder, so its config is not trusted"
  elif ! own_checkout "$repo"; then
    say "warning: git cannot read $repo as its own repository; not fetching"
  else
  checkout_writable "$repo"
  case $? in
    0) fetch_checkout "$repo" ||
      say "warning: fetch failed; only what a remote answers for now (git ls-remote) counts as published" ;;
    1)
      why="$GD_WHY"
      checkout_writable "$repo" admin || die "refusing: $repo: $GD_WHY"
      say "not fetching ($why); only what a remote answers for now (git ls-remote) counts as published" ;;
    *) say "warning: git cannot read its git dir; not fetching" ;;
  esac
  fi
  audit_clone "$repo"
  if [ "$VERDICT" = KEEP ]; then
    # Only unpublished work exits 2, the way sweep counts it. A clone held
    # only by a worktree in use is refused (exit 1): close the worktree first.
    if [ "$KEEP_WORK" -gt 0 ]; then
      say "kept: publish the work above (push and open a PR) or report it, then close again"
      return 2
    fi
    # Name each worktree that holds it, with its owner and lock state. One
    # that is locked or another agent's is not yours to close: report it.
    if [ -z "$HOLDERS" ]; then
      say "not closed (see the reasons above): resolve them, or report them; this script never forces a removal"
      return 1
    fi
    say "not closed: worktrees of this clone, or checkouts inside it, are still checked out"
    report=0
    while IFS='	' read -r hk wt; do
      [ -n "$wt" ] || continue
      [ "$hk" = worktree ] || hk="nested checkout"
      o="$(owner_above "$wt")"
      lk=""
      cw=""
      if git_dirs "$wt"; then
        if [ -f "$CK_GD/locked" ]; then
          lk="$(tr '\n' ' ' <"$CK_GD/locked" | sed 's/ *$//')"
          lk="locked${lk:+: $lk}"
        fi
        git_dir_writable "$CK_CD" admin || cw="its clone: $GD_WHY"
      fi
      say "  held by $hk $wt (owner: ${o:-none}${lk:+; $lk}${cw:+; $cw})"
      if [ -n "$lk" ] || [ -n "$cw" ] || ! owner_ok "$o"; then report=1; fi
    done <<EOF
$HOLDERS
EOF
    if [ "$report" -eq 1 ]; then
      say "what holds it is locked, another agent's, or of a clone this script never writes to: report it to its owner or your supervisor; do not unlock or remove it yourself"
    else
      say "close its worktrees first (hygiene.sh close <worktree> --apply), then close this clone again"
    fi
    return 1
  fi
  remove_clone "$repo" "$CLONE_KB" || return 1
  report_close
}

# ------------------------------------------------------------------- clone
cmd_clone() {
  local src repo dir
  [ -n "$TARGET" ] || die "clone needs a repository: <org>/<repo>, a git URL or a path"
  [ -n "$TASK" ] || die "clone needs --task NAME"
  valid_name "$TASK" || die "task name must be letters, digits, '.', '_' or '-' (at most 64): $TASK"
  ensure_agent_id
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
  set_root create
  dir="$ROOT/$TASK-$repo-$MY_AGENT"
  deletable "$dir" || die "refusing: $dir is outside $ROOT, under ~/GitHub, or excluded"
  # mkdir without -p is the claim: it fails if the folder exists, so two
  # agents can never share one.
  mkdir -- "$dir" 2>/dev/null ||
    die "$dir already exists; never reuse a folder you did not create (pick another --agent if it is not yours)"
  if ! git_user clone --quiet ${BRANCH:+--branch "$BRANCH"} -- "$src" "$dir" >&2; then
    rm -rf -- "$dir"
    die "git clone of $src failed"
  fi
  # An unmarked clone has no owner a sweep can see: never leave one behind.
  if ! { printf '%s\n' "$MY_AGENT" >"$dir/$MARKER"; } 2>/dev/null; then
    rm -rf -- "$dir"
    die "could not write $dir/$MARKER; the clone was removed again"
  fi
  note "cloned $src into $dir as agent $MY_AGENT"
  agent_hint clone
  say "$dir"
}

# ---------------------------------------------------------------- worktree
# Undo a worktree add that failed part-way, or whose records could not be
# written: `git worktree remove --force` when git registered it, then the
# folder this run claimed, then the branch this run created (and only that).
undo_worktree() {
  local clone="$1" dir="$2" made_branch="$3"
  if git -C "$clone" worktree list --porcelain 2>/dev/null | grep -Fxq -- "worktree $dir"; then
    git -C "$clone" worktree remove --force -- "$dir" >/dev/null 2>&1
  fi
  if [ -d "$dir" ] && deletable "$dir"; then
    rm -rf -- "$dir"
  fi
  if [ -n "$made_branch" ] && git -C "$clone" show-ref -q --verify "refs/heads/$made_branch"; then
    git -C "$clone" branch -D -- "$made_branch" >/dev/null 2>&1
  fi
}

cmd_worktree() {
  local clone repo dir gd owner how fromsha upsha slug made="" start excl n rec why
  [ -n "$TARGET" ] || die "worktree needs the clone to branch from"
  [ -n "$TASK" ] || die "worktree needs --task NAME"
  valid_name "$TASK" || die "task name must be letters, digits, '.', '_' or '-' (at most 64): $TASK"
  clone="$(resolve_dir "$TARGET")" || die "no such clone: $TARGET"
  [ -d "$clone/.git" ] || die "not the main checkout of a clone (no .git folder): $clone"
  own_checkout "$clone" || die "git cannot read $clone as its own repository (a .git it does not recognise?)"
  # Adding a worktree writes into the clone's .git, and close and sweep later
  # run `git worktree remove` and `git branch -D` there: the clone passes the
  # same gates as anything this script deletes under.
  why="$(untouchable_why "$clone")"
  [ -z "$why" ] || die "refusing: $clone: $why; make your own clone with hygiene.sh clone"
  checkout_writable "$clone" || die "refusing: $clone: $GD_WHY"
  ensure_agent_id
  # Never another agent's clone, and an unmarked one only when you say it is
  # a session's shared base clone (--shared).
  owner=""
  [ -f "$clone/$MARKER" ] && owner="$(marker_id "$clone/$MARKER")"
  [ -n "$owner" ] || [ "$SHARED" -eq 1 ] ||
    die "refusing: $clone has no ownership marker ($MARKER), so nothing shows it is yours; make your own clone with hygiene.sh clone, or pass --shared if it is the session's shared base clone"
  owner_ok "$owner" || die "refusing: $clone belongs to agent $owner (its $MARKER); fetch its branch into your own clone"
  if [ -n "$BRANCH" ]; then
    git -C "$clone" check-ref-format --branch "$BRANCH" >/dev/null 2>&1 || die "not a valid branch name: $BRANCH"
  fi
  fromsha=""
  if [ -n "$FROM" ]; then
    fromsha="$(git -C "$clone" rev-parse -q --verify "$FROM^{commit}" 2>/dev/null)" ||
      die "--from $FROM is not a commit in $clone"
  fi
  # Which worktree to add. --from never silently loses to an existing branch.
  if [ -z "$BRANCH" ]; then
    how=detached
  elif git -C "$clone" show-ref -q --verify "refs/heads/$BRANCH"; then
    [ -z "$FROM" ] ||
      die "branch $BRANCH already exists in $clone, so it would be checked out as it is and --from $FROM ignored; drop --from, or pick a new --branch"
    how=existing
  elif git -C "$clone" show-ref -q --verify "refs/remotes/origin/$BRANCH"; then
    upsha="$(git -C "$clone" rev-parse "refs/remotes/origin/$BRANCH^{commit}")"
    if [ -z "$FROM" ] || [ "$fromsha" = "$upsha" ]; then
      how=track
    elif [ "$FORCE_NEW" -eq 1 ]; then
      how=new
    else
      die "origin/$BRANCH exists, so $BRANCH is based on it and tracks it, but --from $FROM is another commit; drop --from, or pass --force-new for a new $BRANCH from $FROM that tracks nothing"
    fi
  else
    how=new
  fi
  # The folder: <task>-<repo>-<agent-id>-wt-<branch> (detached: the short
  # SHA). The -wt- suffix keeps it apart from your clone for the same task.
  repo="$(origin_path "$clone")"
  repo="${repo##*/}"
  [ -n "$repo" ] || repo="${clone##*/}"
  repo="${repo#.}"
  valid_name "$repo" || die "cannot name a folder after $clone"
  if [ -n "$BRANCH" ]; then
    slug="$BRANCH"
  else
    slug="$(git -C "$clone" rev-parse --short=7 "${fromsha:-HEAD}" 2>/dev/null)" || die "$clone has no commit to start from"
  fi
  slug="$(printf '%s' "$slug" | tr -c 'A-Za-z0-9._-' '-' | sed -e 's/^[.-]*//' | cut -c1-48)"
  [ -n "$slug" ] || slug="head"
  set_root create
  dir="$ROOT/$TASK-$repo-$MY_AGENT-wt-$slug"
  deletable "$dir" || die "refusing: $dir is outside $ROOT, under ~/GitHub, or excluded"
  # The same claim as clone: mkdir fails if the folder exists. git worktree
  # add accepts the empty folder.
  mkdir -- "$dir" 2>/dev/null ||
    die "$dir already exists; never reuse a folder you did not create (pass another --task, or close the worktree that is there)"
  case "$how" in
    new | track) made="$BRANCH" ;;
  esac
  case "$how" in
    detached) git_user -C "$clone" worktree add --quiet --detach -- "$dir" "${fromsha:-HEAD}" >&2 ;;
    existing) git_user -C "$clone" worktree add --quiet -- "$dir" "$BRANCH" >&2 ;;
    track) git_user -C "$clone" worktree add --quiet --track -b "$BRANCH" -- "$dir" "origin/$BRANCH" >&2 ;;
    new) git_user -C "$clone" worktree add --quiet --no-track -b "$BRANCH" -- "$dir" "${fromsha:-HEAD}" >&2 ;;
  esac || {
    undo_worktree "$clone" "$dir" "$made"
    die "git worktree add in $clone failed; removed the partial worktree${made:+ and the branch $made}"
  }
  # The records, before anything says the worktree is ready: the owner, the
  # branch made for it (close deletes it once published), and the commit it
  # started from, "remote" when that commit was on the remote just now (a PR
  # head in FETCH_HEAD), so close can judge it after its own fetch.
  rec=""
  if [ "$how" = detached ] || [ "$how" = new ]; then
    start="$(git -C "$dir" rev-parse -q --verify HEAD 2>/dev/null)"
    n=1
    if excl="$(excl_file "$clone")"; then
      n="$(unpublished_count "$clone" "$excl" "$start")"
      rm -f -- "$excl"
    fi
    rec="$start"
    [ "$n" != 0 ] || rec="$start remote"
  fi
  if ! gd="$(git -C "$dir" rev-parse --absolute-git-dir 2>/dev/null)" ||
    ! { printf '%s\n' "$MY_AGENT" >"$gd/hygiene-owner"; } 2>/dev/null ||
    ! { [ -z "$made" ] || printf '%s\n' "$made" >"$gd/hygiene-branch"; } 2>/dev/null ||
    ! { [ -z "$rec" ] || printf '%s\n' "$rec" >"$gd/hygiene-from"; } 2>/dev/null; then
    undo_worktree "$clone" "$dir" "$made"
    die "could not write the owner marker in ${gd:-its git dir}; removed the worktree again${made:+ and the branch $made}"
  fi
  note "added a worktree of $clone at $dir as agent $MY_AGENT${BRANCH:+ on $BRANCH}"
  agent_hint worktree
  say "$dir"
}

cmd_sweep() {
  cmd_prune
  cmd_tmp
  set_root
  say "sweep of clones under $ROOT"
  touch -- "$SWEEP_STAMP" && SWEEP_SINCE="$SWEEP_STAMP"
  clones="$(list_clones)"
  # As close does: fetch each of your checkouts first (never one this script
  # may not write to), so what is judged is what origin has now. Before the
  # sizes are taken, so the dry run measures what --apply will.
  while IFS= read -r repo; do
    [ -n "$repo" ] || continue
    deletable "$repo" || continue
    owner_ok "$(owner_above "$repo")" || continue
    checkout_trust "$repo"
    [ "$TRUSTED" -eq 1 ] || continue
    own_checkout "$repo" || continue
    checkout_writable "$repo" || continue
    [ -z "$(submodule_parent "$repo")" ] || continue
    fetch_checkout "$repo" || say "warning: fetch failed for $repo; only what a remote answers for now counts as published"
  done <<EOF
$clones
EOF
  # Every checkout measured once, before anything goes (see freeable_kb).
  while IFS= read -r repo; do
    [ -z "$repo" ] || printf '%s\t%s\n' "$(size_kb "$repo")" "$repo"
  done >"$PRESIZE" <<EOF
$clones
EOF
  kept=0
  held=0
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
      CLEAN)
        # A worktree removed here (or, in a dry run, that would be) no longer
        # holds its clone: the clone, judged later, is judged without it.
        # A checkout removed here (or, in a dry run, that would be) no longer
        # holds, or counts inside, what is judged after it.
        if remove_clone "$repo" "$CLONE_KB"; then
          SWEPT_PATHS="$SWEPT_PATHS
$repo"
        fi ;;
      KEEP)
        # Only unpublished work counts as kept (and exit 2). A clone held by a
        # worktree still in use is not: that worktree is reported on its own.
        if [ "$KEEP_WORK" -gt 0 ]; then kept=$((kept + 1)); else held=$((held + 1)); fi ;;
    esac
  done <<EOF
$clones
EOF
  report_close
  [ "$others" -eq 0 ] || say "sweep: $others clone(s) owned by other agents left alone; --force-owner includes them"
  [ "$held" -eq 0 ] || say "sweep: $held clone(s) left in place because worktrees of theirs are still checked out, or a checkout in them may not go (see the reasons above)"
  [ "$kept" -eq 0 ] || { say "sweep: $kept clone(s) kept with unpublished work; publish or report them"; return 2; }
}

report_close() {
  total="$(awk '{s+=$1} END {print s+0}' "$CLOSE_TALLY")"
  count="$(wc -l <"$CLOSE_TALLY" | tr -d ' ')"
  if [ "$APPLY" -eq 1 ]; then
    say "freed $(human_kb "$total") from $count clone(s) ($total KB)"
  else
    say "dry run: $(human_kb "$total") in $count clone(s) would be freed ($total KB); re-run with --apply"
  fi
}

PRUNE_TALLY="$(mktemp "${TMPDIR:-/tmp}/hygiene-prune.XXXXXX")" || die "mktemp failed"
CLOSE_TALLY="$(mktemp "${TMPDIR:-/tmp}/hygiene-close.XXXXXX")" || die "mktemp failed"
SCAN_CACHE="$(mktemp "${TMPDIR:-/tmp}/hygiene-prs.XXXXXX")" || die "mktemp failed"
SWEEP_STAMP="$(mktemp "${TMPDIR:-/tmp}/hygiene-sweep.XXXXXX")" || die "mktemp failed"
SUBMOD_CACHE="$(mktemp "${TMPDIR:-/tmp}/hygiene-sub.XXXXXX")" || die "mktemp failed"
PRESIZE="$(mktemp "${TMPDIR:-/tmp}/hygiene-size.XXXXXX")" || die "mktemp failed"
# What each remote answered this run (remote_cache), and rev-list inputs.
REMOTE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/hygiene-remote.XXXXXX")" || die "mktemp failed"
trap 'rm -f -- "$PRUNE_TALLY" "$CLOSE_TALLY" "$SCAN_CACHE" "$SWEEP_STAMP" "$SUBMOD_CACHE" "$PRESIZE"; rm -rf -- "$REMOTE_DIR"' EXIT
# Checkouts sweep has removed (or would remove), one path per line.
SWEPT_PATHS=""
KEEP_WORK=0
PR_ST=""
PR_ON_PR=0
PR_PUB=0
# The worktrees audit_clone found holding a clone (one path per line; close
# names them). AUDIT_DEPTH: 0 outside an audit, so the audited checkout is
# gated and the checkouts inside it are not gated again. GATE_OF and
# GATE_LINKED: the checkout the last audit gated, and whether it is a linked
# worktree (remove_clone deletes nothing else).
HOLDERS=""
AUDIT_DEPTH=0
GATE_OF=""
GATE_LINKED=0
GATE_ANCHOR=""

case "$CMD" in
  check) cmd_check ;;
  clone) cmd_clone ;;
  worktree) cmd_worktree ;;
  audit) cmd_audit ;;
  prune) cmd_prune ;;
  tmp) cmd_tmp ;;
  close) cmd_close ;;
  sweep) cmd_sweep ;;
  ''|-h|--help|help) usage ;;
  *) die "unknown command: $CMD (check, clone, worktree, audit, prune, tmp, close, sweep)" ;;
esac
