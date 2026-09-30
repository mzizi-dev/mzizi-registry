#!/usr/bin/env bash
# Tests for scripts/changelog-gate.sh: builds a throwaway git repository per
# case, makes the change a pull request would, runs the gate against it and
# checks the verdict. Needs only bash and git.
#
#   bash scripts/changelog-gate.test.sh
#
# Run by .github/workflows/changelog.yml before the gate itself, so a broken
# gate fails loudly instead of waving every PR through.
set -euo pipefail

gate="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/changelog-gate.sh"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

export GIT_AUTHOR_NAME=changelog-gate-test GIT_AUTHOR_EMAIL=test@example.invalid
export GIT_COMMITTER_NAME=changelog-gate-test GIT_COMMITTER_EMAIL=test@example.invalid
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1

passed=0
failed=0

# new_repo: a main branch holding a CHANGELOG, some source and config, then a
# PR branch checked out on top of it.
new_repo() {
  local dir="$work/$1"
  git init -q -b main "$dir"
  cd "$dir"
  mkdir -p src scripts .github/workflows
  printf '# Changelog\n\n## [Unreleased]\n\n### Added\n\n- The first thing.\n' >CHANGELOG.md
  echo 'export const x = 1' >src/index.ts
  echo '{}' >scripts/registry-ref.json
  echo 'name: CI' >.github/workflows/ci.yml
  echo 'lockfileVersion: 9' >pnpm-lock.yaml
  echo '{}' >.prettierrc
  git add -A
  git commit -qm base
  git checkout -qb "${2:-feature}"
}

commit() { git add -A && git commit -qm change; }

# expect <pass|fail> <description> [VAR=value ...]: run the gate in the current
# repository with the given environment and compare the verdict.
expect() {
  local want=$1 name=$2
  shift 2
  local out got
  if out=$(env CHANGELOG_BASE=main "$@" bash "$gate" 2>&1); then got=pass; else got=fail; fi
  if [ "$got" = "$want" ]; then
    passed=$((passed + 1))
    echo "ok    $name ($got)"
  else
    failed=$((failed + 1))
    echo "FAIL  $name: wanted $want, got $got"
    while IFS= read -r line; do echo "      $line"; done <<<"$out"
  fi
}

new_repo code-no-entry
echo 'export const x = 2' >src/index.ts
commit
expect fail "a code change without an entry"
expect pass "the same change with the no-changelog label" NO_CHANGELOG_LABEL=true

new_repo code-with-entry
echo 'export const x = 2' >src/index.ts
printf '\n### Changed\n\n- x is 2.\n' >>CHANGELOG.md
commit
expect pass "a code change with an entry"

new_repo entry-only
printf '\n### Fixed\n\n- A typo.\n' >>CHANGELOG.md
commit
expect pass "a change to CHANGELOG.md alone"

new_repo ci-only
echo 'name: CI v2' >.github/workflows/ci.yml
commit
expect pass "a change under .github/ alone"

new_repo ci-and-code
echo 'name: CI v2' >.github/workflows/ci.yml
echo 'export const x = 2' >src/index.ts
commit
expect fail "a change under .github/ plus code, no entry"

new_repo lockfile-and-lint
echo 'lockfileVersion: 10' >pnpm-lock.yaml
echo '{"semi":false}' >.prettierrc
commit
expect pass "a lockfile and lint config change alone"

new_repo deletions-only
printf '# Changelog\n\n## [Unreleased]\n' >CHANGELOG.md
echo 'export const x = 2' >src/index.ts
commit
expect fail "an edit that only deletes lines from CHANGELOG.md"

new_repo blank-lines-only
printf '\n\n' >>CHANGELOG.md
echo 'export const x = 2' >src/index.ts
commit
expect fail "an edit that only adds blank lines to CHANGELOG.md"

new_repo changelog-deleted
git rm -q CHANGELOG.md
echo 'export const x = 2' >src/index.ts
commit
expect fail "a PR that deletes CHANGELOG.md"

new_repo nothing-changed
expect pass "a PR with no changes"

bot=(EXEMPT_BRANCH=bot/registry-pin PIN_FILE=scripts/registry-ref.json HEAD_BRANCH=bot/registry-pin)

new_repo bot-pin-only bot/registry-pin
echo '{"ref":"abc"}' >scripts/registry-ref.json
commit
expect pass "the pin bot's PR, pin file only" "${bot[@]}" SAME_REPO=true
expect fail "the same branch opened from a fork" "${bot[@]}" SAME_REPO=false
expect fail "the same branch where no branch is exempt" HEAD_BRANCH=bot/registry-pin SAME_REPO=true

new_repo bot-takeover bot/registry-pin
echo '{"ref":"abc"}' >scripts/registry-ref.json
echo 'export const x = 2' >src/index.ts
commit
expect fail "a bump someone took over to port a handler, no entry" "${bot[@]}" SAME_REPO=true
printf '\n### Changed\n\n- Ported the handler.\n' >>CHANGELOG.md
commit
expect pass "the same takeover with an entry" "${bot[@]}" SAME_REPO=true

new_repo not-the-bot other-branch
echo '{"ref":"abc"}' >scripts/registry-ref.json
commit
expect fail "a pin change by hand on another branch, no entry" "${bot[@]}" HEAD_BRANCH=other-branch SAME_REPO=true

echo
echo "$passed passed, $failed failed"
[ "$failed" -eq 0 ]
