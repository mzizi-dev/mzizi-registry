#!/usr/bin/env bash
# changelog / entry required
#
# Fails a pull request that changes any non-exempt file without adding to
# CHANGELOG.md. Owner rule, 2026-09-30: "changelogs are super important".
# Every PR that changes behaviour, shipped content, an API response, a
# published package, a default, a dependency or a documented fact adds an
# entry under `## [Unreleased]`.
#
# Run by .github/workflows/changelog.yml; scripts/changelog-gate.test.sh
# exercises every branch below. The same two files are in mzizi-registry,
# mzizi-api-gateway, mzizi-site, mzizi-docs and agent-tools; keep the copies
# identical.
#
# A PR passes when any of these holds:
#   1. It carries the `no-changelog` label (pure CI, lint or typo PRs).
#   2. It is the registry-pin bot's own PR: branch EXEMPT_BRANCH, opened from
#      this repository, changing nothing but PIN_FILE. The bot's gate
#      (scripts/registry-pin-bump.mjs) refuses to merge a bump that touches
#      any other file, so it cannot add an entry, and its PR body carries the
#      registry commit list instead. A person who takes a bump over and ports
#      a handler change is back under the normal rule.
#   3. Every changed file is exempt: anything under .github/, a lockfile, or
#      lint/format config.
#   4. CHANGELOG.md is still present and the diff adds at least one
#      non-blank line to it.
#
# Environment (all optional except CHANGELOG_BASE):
#   CHANGELOG_BASE      the ref to diff against, e.g. origin/main
#   CHANGELOG_HEAD      the ref under test (default HEAD)
#   NO_CHANGELOG_LABEL  "true" when the PR carries the no-changelog label
#   HEAD_BRANCH         the PR's head branch name
#   SAME_REPO           "true" when the head branch lives in this repository
#   EXEMPT_BRANCH       the pin bot's branch (unset: no branch is exempt)
#   PIN_FILE            the one file the pin bot's PR may change
set -euo pipefail

base=${CHANGELOG_BASE:?CHANGELOG_BASE must name the base ref, e.g. origin/main}
head=${CHANGELOG_HEAD:-HEAD}
changelog=CHANGELOG.md

pass() {
  echo "changelog: pass: $1"
  exit 0
}
fail() {
  echo "::error title=CHANGELOG.md entry required::$1"
  exit 1
}

# Paths that never need an entry on their own.
is_exempt() {
  case "$1" in
    .github/*) return 0 ;;
    pnpm-lock.yaml | */pnpm-lock.yaml | package-lock.json | */package-lock.json) return 0 ;;
    yarn.lock | */yarn.lock | Cargo.lock | */Cargo.lock | bun.lock | */bun.lock | bun.lockb | */bun.lockb) return 0 ;;
    .editorconfig | .prettierrc | .prettierrc.* | .prettierignore) return 0 ;;
    .markdownlint.jsonc | .markdownlint.json | .markdownlint-cli2.jsonc | .markdownlintignore) return 0 ;;
    .yamllint | .yamllint.yaml | .yamllint.yml) return 0 ;;
    eslint.config.* | */eslint.config.* | .eslintrc | .eslintrc.* | .eslintignore) return 0 ;;
  esac
  return 1
}

if [ "${NO_CHANGELOG_LABEL:-false}" = "true" ]; then
  pass "the PR carries the no-changelog label"
fi

changed=$(git diff --name-only "$base...$head")
if [ -z "$changed" ]; then
  pass "the PR changes no files"
fi

echo "Files changed against $base:"
while IFS= read -r f; do echo "  $f"; done <<<"$changed"

if [ -n "${EXEMPT_BRANCH:-}" ] && [ "${HEAD_BRANCH:-}" = "$EXEMPT_BRANCH" ]; then
  if [ "${SAME_REPO:-false}" = "true" ] && [ -n "${PIN_FILE:-}" ] && [ "$changed" = "$PIN_FILE" ]; then
    pass "the registry-pin bot's PR changes only $PIN_FILE; its body lists the registry commits"
  fi
  echo "Branch $EXEMPT_BRANCH changes more than ${PIN_FILE:-the pin file} (or is from a fork), so the normal rule applies."
fi

needs_entry=""
while IFS= read -r f; do
  [ "$f" = "$changelog" ] && continue
  is_exempt "$f" || needs_entry="$needs_entry $f"
done <<<"$changed"

if [ -z "$needs_entry" ]; then
  pass "no changed file needs an entry (only $changelog, .github/, lockfiles or lint config)"
fi

if ! grep -qxF "$changelog" <<<"$changed"; then
  fail "This PR changes${needs_entry} but not $changelog. Add an entry under '## [Unreleased]' (Keep a Changelog headings: Added, Changed, Deprecated, Removed, Fixed, Security; call out breaking changes). For a pure CI, lint or typo change, add the no-changelog label instead."
fi

if ! git cat-file -e "$head:$changelog" 2>/dev/null; then
  fail "This PR deletes $changelog."
fi

added=$(git diff --unified=0 "$base...$head" -- "$changelog" | grep '^+' | grep -v '^+++ ' | cut -c2- || true)
if ! grep -q '[^[:space:]]' <<<"$added"; then
  fail "$changelog changes, but no line is added to it. Add an entry under '## [Unreleased]'."
fi

pass "$changelog has a new entry"
