#!/usr/bin/env bash
# progress.sh — measured progress for a report tick (the Mzizi `progress-report` skill).
#
# Portable bash (3.2+, macOS and Linux). READ-ONLY: it never writes to a repo,
# a branch, a release, a registry or a deployment. It only reads git, the
# GitHub API (through gh) and HTTP status codes.
#
#   progress.sh bar PCT [LABEL [BASIS]]       a 20-cell bar: LABEL  ████████░░░░  40%  BASIS
#   progress.sh pct DONE TOTAL                 DONE/TOTAL as a whole percentage (0 when TOTAL is 0)
#   progress.sh repo OWNER/REPO                open PRs, latest release, staging ahead of the
#                                              default branch, default-branch CI
#   progress.sh lines REF PATHSPEC...          lines in the files under PATHSPEC at REF, run
#                                              inside a git clone (for "code migrated" bars)
#   progress.sh http URL...                    the HTTP status of each deployed site
#
# Options (before or after the command's arguments):
#   -C DIR              run `lines` against the git clone at DIR (default: the current directory)
#   --width N           bar cells (default 20)
#   --label-width N     pad LABEL to N columns (default 24)
#
# Environment:
#   PROGRESS_GH         the gh binary (default: gh)
#   PROGRESS_CURL       the curl binary (default: curl)
#
# Exit codes: 0 ok; 1 bad usage or a failed read (the message says which).

set -u
set -o pipefail

die() {
  printf 'progress: %s\n' "$*" >&2
  exit 1
}

GH="${PROGRESS_GH:-gh}"
CURL="${PROGRESS_CURL:-curl}"
WIDTH=20
LABEL_WIDTH=24
GIT_DIR_ARG="."

# Pull the options out wherever they sit (before or after the command), and keep
# the command and its positional arguments in order.
ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    -C) GIT_DIR_ARG="${2:?-C needs a directory}"; shift 2 ;;
    --width) WIDTH="${2:?--width needs a number}"; shift 2 ;;
    --label-width) LABEL_WIDTH="${2:?--label-width needs a number}"; shift 2 ;;
    -h|--help) sed -n '2,26p' "$0"; exit 0 ;;
    --) shift; while [ $# -gt 0 ]; do ARGS+=("$1"); shift; done ;;
    *) ARGS+=("$1"); shift ;;
  esac
done
set -- ${ARGS[@]+"${ARGS[@]}"}
CMD="${1:-}"
[ $# -gt 0 ] && shift

is_uint() { case "$1" in ''|*[!0-9]*) return 1 ;; *) return 0 ;; esac; }
if ! is_uint "$WIDTH" || [ "$WIDTH" -eq 0 ]; then die "--width must be a whole number above 0"; fi
is_uint "$LABEL_WIDTH" || die "--label-width must be a whole number"

# Round a percentage given as 75, 75.4, ~75 or 75% to a whole number in 0..100.
norm_pct() {
  local p="${1#\~}"
  p="${p%\%}"
  case "$p" in
    ''|*[!0-9.]*|*.*.*|.) return 1 ;;
  esac
  # Unfinished work never rounds up to 100 (99.6% is not done), and started
  # work never rounds down to 0 (0.4% has begun).
  awk -v p="$p" 'BEGIN { r = int(p + 0.5); if (r > 100) r = 100
    if (p < 100 && r == 100) r = 99; if (p > 0 && r == 0) r = 1; print r }'
}

# ---------------------------------------------------------------- bar
cmd_bar() {
  [ $# -ge 1 ] || die "usage: progress.sh bar PCT [LABEL [BASIS]]"
  local raw="$1" label="${2:-}" basis="${3:-}" pct filled i cells="" shown
  pct="$(norm_pct "$raw")" || die "bar: '$raw' is not a percentage"
  filled=$(( (pct * WIDTH + 50) / 100 ))
  # Never an empty bar for started work, and never a full bar for unfinished
  # work. The second rule wins when the two collide (a one-cell bar).
  if [ "$pct" -gt 0 ] && [ "$filled" -eq 0 ]; then filled=1; fi
  if [ "$pct" -lt 100 ] && [ "$filled" -ge "$WIDTH" ]; then filled=$((WIDTH - 1)); fi
  i=0
  while [ "$i" -lt "$WIDTH" ]; do
    if [ "$i" -lt "$filled" ]; then cells="${cells}█"; else cells="${cells}░"; fi
    i=$((i + 1))
  done
  # An estimate keeps its "~" so the reader knows it is not a count.
  case "$raw" in \~*) shown="~$pct%" ;; *) shown="$pct%" ;; esac
  if [ -n "$label" ]; then
    # Pad by characters, not bytes (printf's %-Ns counts bytes): count the
    # bytes that are not UTF-8 continuation bytes, in any locale. A wide
    # character (CJK, most emoji) still counts as one column, so keep labels
    # to Latin script.
    local chars pad
    chars="$(printf '%s' "$label" | LC_ALL=C tr -d '\200-\277' | wc -c | tr -d ' ')"
    pad=$((LABEL_WIDTH - chars))
    [ "$pad" -lt 0 ] && pad=0
    printf '%s%*s%s  %5s' "$label" "$pad" "" "$cells" "$shown"
  else
    printf '%s  %5s' "$cells" "$shown"
  fi
  [ -n "$basis" ] && printf '   %s' "$basis"
  printf '\n'
}

# ---------------------------------------------------------------- pct
cmd_pct() {
  [ $# -eq 2 ] || die "usage: progress.sh pct DONE TOTAL"
  if ! is_uint "$1" || ! is_uint "$2"; then die "pct: DONE and TOTAL must be whole numbers"; fi
  if [ "$2" -eq 0 ]; then echo 0; return; fi
  # 999 of 1000 is 99 and 1 of 1000 is 1: only a finished count reads 100, and
  # only an untouched one reads 0.
  awk -v d="$1" -v t="$2" 'BEGIN { r = int(d * 100 / t + 0.5); if (r > 100) r = 100
    if (d < t && r == 100) r = 99; if (d > 0 && r == 0) r = 1; print r }'
}

# ---------------------------------------------------------------- repo
cmd_repo() {
  [ $# -eq 1 ] || die "usage: progress.sh repo OWNER/REPO"
  local r="$1" def prs rel ahead ci
  case "$r" in */*) ;; *) die "repo: '$r' is not OWNER/REPO" ;; esac
  command -v "$GH" >/dev/null 2>&1 || die "repo: gh not found (set PROGRESS_GH)"

  def="$("$GH" api "repos/$r" --jq '.default_branch' 2>/dev/null)" || die "repo: cannot read $r"
  [ -n "$def" ] || die "repo: cannot read $r"

  # --paginate, so a repo with more than 100 open PRs is counted in full.
  if prs="$("$GH" api --paginate "repos/$r/pulls?state=open&per_page=100" --jq '.[].number' 2>/dev/null)"; then
    prs="$(printf '%s' "$prs" | grep -c . || true)"
  else
    prs="?"
  fi

  rel="$("$GH" api "repos/$r/releases/latest" --jq '.tag_name + " (" + (.published_at[0:10]) + ")"' 2>/dev/null)" || rel=""
  if [ -z "$rel" ]; then
    # The REST tags list is sorted by name, not date, so ask for the newest tag.
    # shellcheck disable=SC2016 # $owner and $name are GraphQL variables
    rel="$("$GH" api graphql -f owner="${r%%/*}" -f name="${r#*/}" -f query='
      query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) {
        refs(refPrefix: "refs/tags/", first: 1, orderBy: {field: TAG_COMMIT_DATE, direction: DESC}) {
          nodes { name } } } }' --jq '.data.repository.refs.nodes[0].name // empty' 2>/dev/null)" || rel=""
    [ -n "$rel" ] && rel="$rel (tag, no release)"
  fi
  [ -n "$rel" ] || rel="none"

  if [ "$def" = "staging" ]; then
    ahead="n/a (staging is the default branch)"
  elif "$GH" api "repos/$r/branches/staging" --jq '.name' >/dev/null 2>&1; then
    ahead="$("$GH" api "repos/$r/compare/$def...staging" --jq '"\(.ahead_by) ahead, \(.behind_by) behind"' 2>/dev/null)" || ahead="?"
  else
    ahead="no staging branch"
  fi

  # Default-branch CI on the branch head, from three sources, every page of
  # each: GitHub Actions workflow runs (keyed by workflow file: display names
  # and job names need not be unique), check runs from other apps (keyed by app
  # and check name), and commit statuses (keyed by context; the older API that
  # deploy integrations such as Cloudflare and Vercel often use). One TSV line
  # per signal: kind, state (ok, failed, pending or cancelled), key, time, and
  # the name to show.
  local signals sha
  if sha="$("$GH" api "repos/$r/commits/$def" --jq '.sha' 2>/dev/null)" && [ -n "$sha" ] &&
    signals="$(
      {
        "$GH" api --paginate "repos/$r/actions/runs?head_sha=$sha&per_page=100" --jq '.workflow_runs[] |
          [ "workflow",
            (if .status != "completed" then "pending"
             elif .conclusion == "cancelled" then "cancelled"
             elif (.conclusion == "skipped" or .conclusion == "neutral") then "skipped"
             elif .conclusion == "success" then "ok"
             else "failed" end),
            .path, .created_at, .name ] | @tsv' &&
          "$GH" api --paginate "repos/$r/commits/$sha/check-runs?per_page=100" --jq '.check_runs[] |
            select(.app.slug != "github-actions") |
            [ "app",
              (if .status != "completed" then "pending"
               elif .conclusion == "cancelled" then "cancelled"
               elif (.conclusion == "skipped" or .conclusion == "neutral") then "skipped"
               elif .conclusion == "success" then "ok"
               else "failed" end),
              (.app.slug + "/" + .name), (.started_at // ""), .name ] | @tsv' &&
          "$GH" api --paginate "repos/$r/commits/$sha/statuses?per_page=100" --jq '.[] |
            [ "status",
              (if .state == "success" then "ok" elif .state == "pending" then "pending" else "failed" end),
              .context, .created_at, .context ] | @tsv'
      } 2>/dev/null
    )"; then
    # Reruns, scheduled runs and new statuses pile up on one commit: only the
    # newest signal per key counts, so a stale failure that a later run fixed
    # does not turn CI red. When the newest run was cancelled, nothing finished
    # it: it is reported as cancelled, neither green nor red, and an older
    # result does not stand in for it. ISO times sort as text, newest first.
    ci="$(printf '%s\n' "$signals" | sort -t "$(printf '\t')" -k4,4r | awk -F'\t' '
      function add(list, name) { return list (list ? ", " : "") name }
      NF < 5 || $1 == "" { next }
      # A skipped or neutral run checked nothing, so it never replaces an older
      # result; a workflow with only skipped runs counts as passing.
      $2 == "skipped" { key = $1 SUBSEP $3; if (!(key in skipped)) { skipped[key] = 1; order[++k] = key } next }
      { key = $1 SUBSEP $3; if (seen[key]++) next }
      $2 == "cancelled" { c++; cn = add(cn, $5); next }
      { n++ }
      $2 == "failed" { f++; if (!(($5) in named)) { named[$5] = 1; fn = add(fn, $5) } }
      $2 == "pending" { p++ }
      END {
        for (i = 1; i <= k; i++) if (!(order[i] in seen)) n++
        extra = c ? sprintf("; %d cancelled: %s", c, cn) : ""
        if (n == 0 && c == 0) print "no checks"
        else if (f) printf "red (%d failed of %d: %s%s)\n", f, n, fn, extra
        else if (p) printf "running (%d pending of %d%s)\n", p, n, extra
        else if (n == 0) printf "cancelled (%d: %s)\n", c, cn
        else printf "green (%d checks%s)\n", n, extra }')"
  else
    ci="?"
  fi

  printf '%s\n' "$r"
  printf '  open PRs        %s\n' "$prs"
  printf '  latest release  %s\n' "$rel"
  printf '  staging vs %-4s %s\n' "$def" "$ahead"
  printf '  CI on %-9s %s\n' "$def" "$ci"
}

# ---------------------------------------------------------------- lines
cmd_lines() {
  [ $# -ge 2 ] || die "usage: progress.sh lines REF PATHSPEC..."
  local ref="$1" total
  shift
  git -C "$GIT_DIR_ARG" rev-parse --git-dir >/dev/null 2>&1 || die "lines: $GIT_DIR_ARG is not a git clone"
  git -C "$GIT_DIR_ARG" rev-parse --verify --quiet "$ref^{commit}" >/dev/null || die "lines: no such ref '$ref'"
  # `git grep -c ''` counts every line of every text file in the tree at REF,
  # without checking anything out. -I skips binary files. No match is 0, not an error.
  local counts rc=0 err
  err="$(mktemp "${TMPDIR:-/tmp}/progress-lines.XXXXXX")" || die "lines: cannot make a temp file"
  counts="$(git -C "$GIT_DIR_ARG" grep -I -c '' "$ref" -- "$@" 2>"$err")" || rc=$?
  # Exit 1 is "no file matched" (a real 0); anything above is git refusing the
  # pathspec or the ref, and a bar built on it would look measured but not be.
  if [ "$rc" -gt 1 ]; then
    printf 'progress: lines: git grep failed: %s\n' "$(head -n 1 "$err")" >&2
    rm -f -- "$err"
    exit 1
  fi
  rm -f -- "$err"
  total="$(printf '%s\n' "$counts" | awk -F: 'NF { n += $NF } END { print n + 0 }')"
  printf '%s\n' "$total"
}

# ---------------------------------------------------------------- http
cmd_http() {
  [ $# -ge 1 ] || die "usage: progress.sh http URL..."
  command -v "$CURL" >/dev/null 2>&1 || die "http: curl not found (set PROGRESS_CURL)"
  local u code
  for u in "$@"; do
    case "$u" in http://*|https://*) ;; *) die "http: '$u' is not an http(s) URL" ;; esac
    code="$("$CURL" -s -o /dev/null -L --max-time 15 -w '%{http_code}' "$u" 2>/dev/null)" || code="${code:-000}"
    [ -n "$code" ] || code="000"
    printf '%s  %s\n' "$code" "$u"
  done
  # A down site is a fact for the report, not a script failure.
  return 0
}

case "$CMD" in
  bar) cmd_bar "$@" ;;
  pct) cmd_pct "$@" ;;
  repo) cmd_repo "$@" ;;
  lines) cmd_lines "$@" ;;
  http) cmd_http "$@" ;;
  ''|-h|--help|help) sed -n '2,26p' "$0" ;;
  *) die "unknown command: $CMD (bar, pct, repo, lines, http)" ;;
esac
