#!/usr/bin/env bash
# Tests for publish-release.sh with a fake `gh` that returns canned release JSON (needs jq).
# Run: bash .github/scripts/test-publish-release.sh
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/bin"
cat >"$tmp/bin/gh" <<'GH'
#!/usr/bin/env bash
echo "gh $*" >>"$GH_LOG"
if [ "$1" = api ] && [ "${2:-}" != "-X" ]; then cat "$RELEASES_JSON"; fi
GH
chmod +x "$tmp/bin/gh"
export PATH="$tmp/bin:$PATH" GH_LOG="$tmp/log" RELEASES_JSON="$tmp/releases.json" GH_REPO=o/r
echo "notes" >"$tmp/notes.md"
: >"$tmp/empty.md"
fail=0
check() { if ! eval "$2"; then echo "FAIL: $1"; fail=1; else echo "ok: $1"; fi; }

echo '[]' >"$RELEASES_JSON"; : >"$GH_LOG"
bash "$here/publish-release.sh" v1.0.0 "v1.0.0" "$tmp/notes.md" latest >/dev/null
check "creates a draft with the notes, then publishes once" \
  'grep -q "release create v1.0.0 --verify-tag --draft --title v1.0.0 --notes-file $tmp/notes.md --latest" "$GH_LOG" && [ "$(grep -c "release edit v1.0.0 --draft=false" "$GH_LOG")" = 1 ]'
check "never edits notes or the tag" '! grep -qE "release edit .*(--notes|--tag)" "$GH_LOG"'

echo '[{"id":7,"tag_name":"v1.0.0","draft":false}]' >"$RELEASES_JSON"; : >"$GH_LOG"
bash "$here/publish-release.sh" v1.0.0 "v1.0.0" "$tmp/notes.md" >/dev/null
check "a published release is left alone" '! grep -q "release " "$GH_LOG" && ! grep -q DELETE "$GH_LOG"'

echo '[{"id":9,"tag_name":"v1.0.0","draft":true}]' >"$RELEASES_JSON"; : >"$GH_LOG"
bash "$here/publish-release.sh" v1.0.0 "v1.0.0" "$tmp/notes.md" prerelease >/dev/null
check "a leftover draft is deleted and made again as a pre-release" \
  'grep -q "api -X DELETE repos/o/r/releases/9" "$GH_LOG" && grep -q "release create v1.0.0 --verify-tag --draft .*--prerelease --latest=false" "$GH_LOG"'

: >"$GH_LOG"
check "empty notes fail and create nothing" \
  '! bash "$here/publish-release.sh" v1.0.0 t "$tmp/empty.md" 2>/dev/null && ! grep -q "release " "$GH_LOG"'

echo '[]' >"$RELEASES_JSON"; : >"$GH_LOG"
RELEASE_TARGET=abc123 bash "$here/publish-release.sh" "@o/p@1.0.0" t "$tmp/notes.md" >/dev/null
check "a package release names its target commit instead of verifying a tag" \
  'grep -q "release create @o/p@1.0.0 --target abc123 --draft" "$GH_LOG" && ! grep -q verify-tag "$GH_LOG"'

[ "$fail" = 0 ]
