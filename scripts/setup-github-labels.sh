#!/usr/bin/env bash
# setup-github-labels.sh
#
# Creates the canonical label set for nyuchitech/design-portal.
# Requires the GitHub CLI (gh) and repo write access.
#
# Usage:
#   bash scripts/setup-github-labels.sh
#   bash scripts/setup-github-labels.sh nyuchitech/other-repo   # apply to another repo

set -euo pipefail

REPO="${1:-nyuchitech/design-portal}"
echo "Setting up labels for: $REPO"

create_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list --repo "$REPO" --limit 100 | grep -q "^${name}[[:space:]]"; then
    gh label edit "$name" --repo "$REPO" --color "$color" --description "$desc" 2>/dev/null && \
      echo "  updated: $name" || echo "  skipped: $name (already current)"
  else
    gh label create "$name" --repo "$REPO" --color "$color" --description "$desc" && \
      echo "  created: $name"
  fi
}

# ── Type ────────────────────────────────────────────────────────────────────
echo "Type labels..."
create_label "bug"              "d73a4a" "Something isn't working"
create_label "enhancement"      "0047AB" "New feature or improvement"
create_label "documentation"    "B388FF" "Documentation improvements"
create_label "question"         "64FFDA" "Further information is requested"
create_label "security"         "B3261E" "Security vulnerability or concern"

# ── Component & registry ────────────────────────────────────────────────────
echo "Component/registry labels..."
create_label "component:new"         "0047AB" "Request for a new registry component"
create_label "component:bug"         "d73a4a" "Bug in an existing component"
create_label "component:improvement" "FFD740" "Improvement to an existing component"
create_label "registry:api"          "B388FF" "Related to the /api/v1/ registry API"
create_label "registry:mcp"          "64FFDA" "Related to the MCP server"
create_label "registry:schema"       "D4A574" "Registry schema or structure"

# ── Priority ────────────────────────────────────────────────────────────────
echo "Priority labels..."
create_label "priority:critical" "B3261E" "Blocking — must fix before next release"
create_label "priority:high"     "d73a4a" "Important — address this sprint"
create_label "priority:medium"   "FFD740" "Should be addressed soon"
create_label "priority:low"      "D4A574" "Nice to have"

# ── Scope ───────────────────────────────────────────────────────────────────
echo "Scope labels..."
create_label "scope:design-system"  "0047AB" "Affects the Five African Minerals design system"
create_label "scope:brand"          "B388FF" "Brand documentation or tokens"
create_label "scope:architecture"   "64FFDA" "Architecture documentation or decisions"
create_label "scope:ecosystem"      "D4A574" "Affects multiple bundu ecosystem apps"
create_label "scope:ci-cd"          "FFD740" "CI/CD workflows and automation"
create_label "scope:database"       "0047AB" "Supabase / database schema"
create_label "scope:observability"  "64FFDA" "Metrics, logging, tracing"

# ── Process ─────────────────────────────────────────────────────────────────
echo "Process labels..."
create_label "good first issue"   "D4A574" "Good for newcomers to the codebase"
create_label "help wanted"        "64FFDA" "Extra attention is needed"
create_label "breaking change"    "B3261E" "Breaking change — requires consumer updates"
create_label "wontfix"            "ffffff" "This will not be worked on"
create_label "duplicate"          "cccccc" "This issue or PR already exists"
create_label "needs:reproduction" "FFD740" "Needs a minimal reproduction case"
create_label "needs:design"       "B388FF" "Needs design work before implementation"

echo ""
echo "Done. Labels created/updated for $REPO"
