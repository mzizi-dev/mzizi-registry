#!/bin/bash
set -euo pipefail

# Cloud sessions only.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install only if a file that decides what gets installed has changed since the
# last successful install. The hash file lives in node_modules (git-ignored).
hashes=node_modules/.session-start.sha256
if ! sha256sum --check --status "$hashes" 2>/dev/null; then
  # Delete the old hashes first, so a failed install runs again next time.
  rm -f "$hashes"

  # pnpm is pinned by "packageManager" in package.json. Prefer install over a
  # frozen install so the cached container state is reused.
  corepack enable >/dev/null 2>&1 || true
  pnpm install --ignore-scripts

  sha256sum .claude/hooks/session-start.sh package.json pnpm-lock.yaml pnpm-workspace.yaml 2>/dev/null > "$hashes" || rm -f "$hashes"
fi
