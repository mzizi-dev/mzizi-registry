#!/usr/bin/env bash
# Create a GitHub release with its notes and publish it once (immutable-release
# safe). Identical in every Mzizi repository that carries it; change them together.
#
# Usage: publish-release.sh <tag> <title> <notes-file> [latest|plain|prerelease]
#   latest      a main release: becomes the repository's latest release
#   plain       a package release: published, never marked latest (the default)
#   prerelease  a staging patch: published as a pre-release, never latest
#
# Needs GH_TOKEN and GH_REPO. The tag must already exist on origin
# (--verify-tag), so the release never creates or moves one. A caller whose tag
# does not exist yet (a package release, tagged by publishing) sets
# RELEASE_TARGET to the commit instead; GitHub then creates the tag, once, when
# the draft is published.
#
# The notes are set when the draft is CREATED and a published release is never
# edited: a release that is already published is left alone and the script exits
# 0; a leftover draft (a run that died between create and publish) is deleted
# and made again. An empty notes file is an error, not a release.
set -euo pipefail

tag="${1:?usage: publish-release.sh <tag> <title> <notes-file> [latest|plain|prerelease]}"
title="${2:?missing title}"
notes="${3:?missing notes file}"
kind="${4:-plain}"
: "${GH_REPO:?GH_REPO is not set}"

if [ ! -s "$notes" ]; then
  echo "::error::No release notes for $tag ($notes is empty); not creating a release." >&2
  exit 1
fi

existing="$(gh api "repos/${GH_REPO}/releases?per_page=100" --paginate \
  | jq -rs --arg t "$tag" 'add | map(select(.tag_name == $t)) | .[0] // empty | "\(.id) \(.draft)"')"
if [ -n "$existing" ]; then
  read -r id draft <<<"$existing"
  if [ "$draft" != "true" ]; then
    echo "$tag is already released; a published release is immutable, so it is left as it is."
    exit 0
  fi
  echo "Deleting the leftover draft release of $tag (id $id) and creating it again."
  gh api -X DELETE "repos/${GH_REPO}/releases/${id}"
fi

case "$kind" in
  latest) flags=(--latest) ;;
  plain) flags=(--latest=false) ;;
  prerelease) flags=(--prerelease --latest=false) ;;
  *) echo "::error::unknown release kind '$kind'" >&2; exit 1 ;;
esac

if [ -n "${RELEASE_TARGET:-}" ]; then where=(--target "$RELEASE_TARGET"); else where=(--verify-tag); fi

gh release create "$tag" "${where[@]}" --draft --title "$title" --notes-file "$notes" "${flags[@]}"
gh release edit "$tag" --draft=false "${flags[@]}"
echo "Released $tag."
