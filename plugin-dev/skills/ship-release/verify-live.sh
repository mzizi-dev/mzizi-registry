#!/usr/bin/env bash
# verify-live.sh — print what is LIVE (the Mzizi `ship-release` skill).
#
# Portable bash (3.2+, macOS and Linux). READ-ONLY: it only reads npm, the GitHub
# API (through gh) and HTTP responses, and never writes, publishes, tags or deploys.
# It prints facts. It does not decide that a release is good: compare the output
# with what you expect, and say "not live" until it matches. Cloudflare deploys
# lag a minute or two behind a merge to main, so a stale answer is not yet a failure.
#
#   verify-live.sh npm PKG[@VERSION]...      latest on npm, or whether PKG@VERSION is listed
#   verify-live.sh api [BASE]                status and X-Mzizi-Source of BASE/v1/brand
#                                            (default https://api.mzizi.dev)
#   verify-live.sh mcp [BASE]                catalogue.json version and registry commit, and the
#                                            status of a POST with Origin https://evil.example
#                                            (default https://mcp.mzizi.dev; want 403)
#   verify-live.sh release OWNER/REPO TAG    whether the tag and its release exist, draft state
#                                            and the length of the notes
#   verify-live.sh http URL...               the HTTP status of each page
#
# Environment: VERIFY_CURL, VERIFY_GH, VERIFY_NPM, VERIFY_NODE name the binaries
# (defaults: curl, gh, npm, node). VERIFY_RELEASE_PAGES caps the release pages read (20).
#
# Exit codes: 0 ok (a down site or an unlisted version is a fact, not a failure);
# 1 bad usage or a missing tool.

set -u
set -o pipefail

die() {
  printf 'verify-live: %s\n' "$*" >&2
  exit 1
}

CURL="${VERIFY_CURL:-curl}"
GH="${VERIFY_GH:-gh}"
NPM="${VERIFY_NPM:-npm}"
NODE="${VERIFY_NODE:-node}"
RELEASE_MAX_PAGES="${VERIFY_RELEASE_PAGES:-20}"   # 20 pages of 100 releases

usage() {
  cat <<'USAGE'
verify-live.sh: print what is LIVE (read-only; the Mzizi `ship-release` skill)

  verify-live.sh npm PKG[@VERSION]...      latest on npm, or whether PKG@VERSION is listed
  verify-live.sh api [BASE]                status and X-Mzizi-Source of BASE/v1/brand
                                           (default https://api.mzizi.dev)
  verify-live.sh mcp [BASE]                catalogue.json version and registry commit, and the
                                           status of a POST with Origin https://evil.example
                                           (default https://mcp.mzizi.dev; want 403)
  verify-live.sh release OWNER/REPO TAG    whether the tag and its release exist, draft state
                                           and the length of the notes
  verify-live.sh http URL...               the HTTP status of each page

Environment: VERIFY_CURL, VERIFY_GH, VERIFY_NPM, VERIFY_NODE name the binaries
(defaults: curl, gh, npm, node).

Exit codes: 0 ok (a down site or an unlisted version is a fact, not a failure);
1 bad usage or a missing tool.
USAGE
}

need() { command -v "$1" >/dev/null 2>&1 || die "$2: '$1' not found"; }

is_url() { case "$1" in http://*|https://*) return 0 ;; *) return 1 ;; esac; }

cmd_npm() {
  [ $# -ge 1 ] || die "usage: verify-live.sh npm PKG[@VERSION]..."
  need "$NPM" npm
  local spec v
  for spec in "$@"; do
    case "$spec" in
      *[!A-Za-z0-9@/._-]*|'') die "npm: '$spec' is not a package spec" ;;
    esac
    # A scoped name starts with @, so a version is an @ after the first character.
    case "${spec#?}" in
      *@*)
        v="$("$NPM" view "$spec" version 2>/dev/null | tail -n 1)" || v=""
        if [ -n "$v" ]; then printf '%s  listed\n' "$spec"; else printf '%s  not listed on npm yet\n' "$spec"; fi
        ;;
      *)
        v="$("$NPM" view "$spec" version 2>/dev/null | tail -n 1)" || v=""
        if [ -n "$v" ]; then printf '%s  latest=%s\n' "$spec" "$v"; else printf '%s  ? (npm view failed)\n' "$spec"; fi
        ;;
    esac
  done
}

cmd_api() {
  local base="${1:-https://api.mzizi.dev}" url hdr code src
  is_url "$base" || die "api: '$base' is not an http(s) URL"
  need "$CURL" curl
  url="${base%/}/v1/brand"
  hdr="$("$CURL" -sI --max-time 15 "$url" 2>/dev/null | tr -d '\r')" || hdr=""
  code="$(printf '%s\n' "$hdr" | awk 'toupper($1) ~ /^HTTP/ { c = $2 } END { print c }')"
  src="$(printf '%s\n' "$hdr" | awk 'tolower($1) == "x-mzizi-source:" { sub(/^[^:]*: */, ""); print; exit }')"
  printf '%s  %s\n' "${code:-000}" "$url"
  printf 'x-mzizi-source  %s\n' "${src:-?}"
}

cmd_mcp() {
  local base="${1:-https://mcp.mzizi.dev}" body parsed code
  is_url "$base" || die "mcp: '$base' is not an http(s) URL"
  need "$CURL" curl
  need "$NODE" node
  base="${base%/}"
  body="$("$CURL" -s --max-time 15 "$base/catalogue.json" 2>/dev/null)" || body=""
  parsed="$(printf '%s' "$body" | "$NODE" -e '
    let t = "";
    process.stdin.on("data", (c) => (t += c)).on("end", () => {
      try {
        const d = JSON.parse(t);
        const r = (d.source && d.source.registry) || "";
        const sha = r.split("/").pop();
        console.log("version " + (d.version ?? "?"));
        console.log("registry " + (sha ? sha.slice(0, 12) : "?"));
      } catch {
        console.log("version ?");
        console.log("registry ?");
      }
    });' 2>/dev/null)" || parsed="version ?
registry ?"
  printf 'catalogue.json  %s\n' "$(printf '%s' "$parsed" | sed -n 1p)"
  printf 'catalogue.json  %s\n' "$(printf '%s' "$parsed" | sed -n 2p)"
  code="$("$CURL" -s -o /dev/null --max-time 15 -w '%{http_code}' -X POST -H 'Origin: https://evil.example' \
    -H 'Content-Type: application/json' -d '{}' "$base/mcp" 2>/dev/null)" || code="${code:-000}"
  printf 'origin probe    %s (want 403)\n' "${code:-000}"
}

cmd_release() {
  [ $# -eq 2 ] || die "usage: verify-live.sh release OWNER/REPO TAG"
  need "$GH" gh
  local repo="$1" tag="$2" sha info out page
  case "$repo" in */*) ;; *) die "release: '$repo' is not OWNER/REPO" ;; esac
  case "$tag" in *[!A-Za-z0-9@/._-]*|'') die "release: '$tag' is not a tag name" ;; esac
  sha="$("$GH" api "repos/$repo/git/ref/tags/$tag" --jq '.object.sha' 2>/dev/null)" || sha=""
  if [ -n "$sha" ]; then printf 'tag      %s -> object %s\n' "$tag" "$sha"; else printf 'tag      %s not found\n' "$tag"; fi
  # releases/tags/<tag> answers 404 for a draft, so list the releases and match the tag name:
  # a draft that was never published shows draft=true instead of "not found". The list is
  # newest first and 100 a page, so read pages until the tag turns up or a page is short.
  # (Explicit page numbers, not `gh api --paginate`: a proxy may refuse paginate's next links.)
  info=""
  page=1
  while [ "$page" -le "$RELEASE_MAX_PAGES" ]; do
    out="$("$GH" api "repos/$repo/releases?per_page=100&page=$page" \
      --jq "\"\(length)|\" + ([.[] | select(.tag_name == \"$tag\")][0] | if . then \"draft=\\(.draft) prerelease=\\(.prerelease) notes_chars=\\(.body | length)\" else \"\" end)" 2>/dev/null)" || out=""
    [ -n "$out" ] || break
    info="${out#*|}"
    [ -z "$info" ] || break
    [ "${out%%|*}" -ge 100 ] 2>/dev/null || break
    page=$((page + 1))
  done
  if [ -n "$info" ]; then printf 'release  %s %s\n' "$tag" "$info"; else printf 'release  %s not found\n' "$tag"; fi
}

cmd_http() {
  [ $# -ge 1 ] || die "usage: verify-live.sh http URL..."
  need "$CURL" curl
  local u code
  for u in "$@"; do
    is_url "$u" || die "http: '$u' is not an http(s) URL"
    code="$("$CURL" -s -o /dev/null -L --max-time 15 -w '%{http_code}' "$u" 2>/dev/null)" || code="${code:-000}"
    printf '%s  %s\n' "${code:-000}" "$u"
  done
}

CMD="${1:-}"
[ $# -gt 0 ] && shift
case "$CMD" in
  npm) cmd_npm "$@" ;;
  api) cmd_api "$@" ;;
  mcp) cmd_mcp "$@" ;;
  release) cmd_release "$@" ;;
  http) cmd_http "$@" ;;
  -h|--help) usage ;;
  *) die "unknown command: ${CMD:-<none>} (npm, api, mcp, release, http)" ;;
esac
