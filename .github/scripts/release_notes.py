#!/usr/bin/env python3
"""Release notes from CHANGELOG.md.

Usage: release_notes.py [--allow-empty] <previous-ref> <ref>

Prints, as Markdown, every CHANGELOG.md entry present at <ref> but not at
<previous-ref>. The release workflows pass it to `gh release create`, so a
release says what changed in the changelog's own words (adapted from
mzizi-dev/mzizi's .github/scripts/release_notes.py). This file is identical in
every Mzizi repository that carries it; change them together.

An entry is a top-level bullet (`- ...`, with its continuation lines) under a
`### ...` heading, or, for a `### ...` section written as prose, the whole
section with its heading. Entries compare with whitespace collapsed, so a
reflow is not a change and an entry moved from `[Unreleased]` into a dated
section is not reported twice; an entry whose words were edited counts as new.
With an empty <previous-ref>, or one with no CHANGELOG.md (the first release),
every `[Unreleased]` entry is new.

CHANGELOG_URL, if set, is the link the notes give to CHANGELOG.md. COMPARE_URL,
if set, is printed last as "Full changelog". Exits 1, printing nothing to
stdout, when nothing is new (a release with no changelog content must fail its
job, not publish empty or generic notes) and when CHANGELOG.md cannot be read at
either ref. --allow-empty is for a staging patch whose merge was exempt from
the changelog gate (CI, lockfile or lint config, or a typo): the notes then say
so, still with the compare link, and the exit is 0.
"""
import os
import subprocess
import sys
from collections import Counter


def show(ref: str, missing_ok: bool = False) -> str:
    if not ref:
        return ""
    out = subprocess.run(
        ["git", "show", f"{ref}:CHANGELOG.md"], capture_output=True, text=True
    )
    if out.returncode != 0 and missing_ok:
        # Tell "the ref has no CHANGELOG.md" apart from any other failure: git's
        # message for it differs with the working tree, so ask git directly.
        def git_ok(*args: str) -> bool:
            return subprocess.run(["git", *args], capture_output=True).returncode == 0

        if git_ok("rev-parse", "--verify", "--quiet", f"{ref}^{{commit}}") and not git_ok(
            "cat-file", "-e", f"{ref}:CHANGELOG.md"
        ):
            return ""
    if out.returncode != 0:
        # A wrong note is worse than a failed release run: the run can be re-tried.
        sys.exit(f"release_notes: cannot read CHANGELOG.md at {ref}: {out.stderr.strip()}")
    return out.stdout


def sections(text: str):
    """Yield (release heading, ### heading, body lines) in file order."""
    release, heading, body = "", None, []
    for line in text.splitlines():
        if line.startswith("## ") or line.startswith("### "):
            if heading is not None:
                yield release, heading, body
            if line.startswith("## "):
                release, heading, body = line, None, []
            else:
                heading, body = line[4:].strip(), []
        elif heading is not None:
            body.append(line)
    if heading is not None:
        yield release, heading, body


def entries(text: str, unreleased_only: bool = False):
    """Yield (heading, entry, is_section) in file order."""
    for release, heading, body in sections(text):
        if unreleased_only and not release.startswith("## [Unreleased]"):
            continue
        prose = [l for l in body if l.strip() and not l.startswith(("- ", "  "))]
        bullets, cur = [], []
        for l in body:
            if l.startswith("- "):
                if cur:
                    bullets.append("\n".join(cur).rstrip())
                cur = [l]
            elif cur and (l.startswith("  ") or not l.strip()):
                cur.append(l)
            elif cur:
                bullets.append("\n".join(cur).rstrip())
                cur = []
        if cur:
            bullets.append("\n".join(cur).rstrip())
        if bullets and not prose:
            for b in bullets:
                yield heading, b, False
        elif any(l.strip() for l in body):
            yield heading, "\n".join(body).strip(), True


def norm(heading: str, entry: str) -> str:
    return " ".join(f"{heading} {entry}".split())


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--allow-empty"]
    allow_empty = len(args) != len(sys.argv) - 1
    if len(args) != 2:
        sys.exit("usage: release_notes.py [--allow-empty] <previous-ref> <ref>")
    prev, ref = args
    compare = os.environ.get("COMPARE_URL", "")
    footer = f"**Full changelog**: {compare}\n" if compare else ""
    # A previous release with no CHANGELOG.md counts as the first release.
    before = show(prev, missing_ok=True)
    old = Counter(norm(h, e) for h, e, _ in entries(before))
    blocks: list[tuple[str, list[str], bool]] = []
    for heading, e, is_section in entries(show(ref), unreleased_only=not before):
        key = norm(heading, e)
        if old[key] > 0:
            old[key] -= 1
            continue
        if not is_section and blocks and blocks[-1][0] == heading and not blocks[-1][2]:
            blocks[-1][1].append(e)
        else:
            blocks.append((heading, [e], is_section))
    if not blocks:
        if allow_empty:
            print("## What changed\n")
            print("This merge added no `CHANGELOG.md` entry. (The changelog gate lets "
                  "changes to CI, lockfiles, lint config and typos through without one.)\n")
            print(footer, end="")
            return 0
        sys.exit(f"release_notes: no CHANGELOG.md entries were added between {prev or 'the start'} and {ref}; "
                 "a release needs its changelog entries (add them under [Unreleased] and re-run)")
    url = os.environ.get("CHANGELOG_URL", "CHANGELOG.md")
    print("## What changed\n")
    print(f"From [`CHANGELOG.md`]({url}).\n")
    for heading, items, is_section in blocks:
        print(f"### {heading}\n")
        print(("\n\n" if is_section else "\n").join(items))
        print()
    print(footer, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())
