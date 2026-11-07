#!/usr/bin/env python3
"""Tests for release_notes.py: run `python3 .github/scripts/test_release_notes.py`.

Builds a throwaway git repository with a CHANGELOG.md at two refs. Identical in
every Mzizi repository that carries release_notes.py.
"""
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "release_notes.py")

BEFORE = """# Changelog

## [Unreleased]

### Added

- Old entry.

## [1.0.0] - 2026-10-01

### Fixed

- Older fix.
"""

AFTER = """# Changelog

## [Unreleased]

### Added

- Old entry.
- New entry.

### Changed

- **Breaking:** a renamed route.

## [1.0.0] - 2026-10-01

### Fixed

- Older fix.
"""


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


class ReleaseNotes(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = self.tmp.name
        git(self.dir, "init", "-q", "-b", "main")
        git(self.dir, "config", "user.email", "t@example.com")
        git(self.dir, "config", "user.name", "t")
        self.commit(BEFORE, "before")
        git(self.dir, "tag", "v1.0.0")

    def tearDown(self):
        self.tmp.cleanup()

    def commit(self, text, msg):
        with open(os.path.join(self.dir, "CHANGELOG.md"), "w") as f:
            f.write(text)
        git(self.dir, "add", "CHANGELOG.md")
        git(self.dir, "commit", "-q", "--allow-empty", "-m", msg)

    def run_notes(self, *args, **env):
        return subprocess.run(
            [sys.executable, SCRIPT, *args],
            cwd=self.dir,
            capture_output=True,
            text=True,
            env={**os.environ, **env},
        )

    def test_new_entries_with_groups_breaking_and_compare_link(self):
        self.commit(AFTER, "after")
        out = self.run_notes("v1.0.0", "HEAD", COMPARE_URL="https://example.com/compare/v1.0.0...v1.1.0")
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertIn("### Added\n\n- New entry.", out.stdout)
        self.assertNotIn("Old entry", out.stdout)
        self.assertIn("### Changed\n\n- **Breaking:** a renamed route.", out.stdout)
        self.assertTrue(
            out.stdout.rstrip().endswith("**Full changelog**: https://example.com/compare/v1.0.0...v1.1.0")
        )

    def test_nothing_new_fails_with_empty_stdout(self):
        self.commit(BEFORE, "no-op")
        out = self.run_notes("v1.0.0", "HEAD")
        self.assertEqual(out.returncode, 1)
        self.assertEqual(out.stdout, "")
        self.assertIn("no CHANGELOG.md entries", out.stderr)

    def test_allow_empty_says_exempt_and_keeps_the_compare_link(self):
        self.commit(BEFORE, "no-op")
        out = self.run_notes("--allow-empty", "v1.0.0", "HEAD", COMPARE_URL="https://example.com/c")
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertIn("added no `CHANGELOG.md` entry", out.stdout)
        self.assertIn("**Full changelog**: https://example.com/c", out.stdout)

    def test_unreadable_changelog_fails(self):
        out = self.run_notes("v1.0.0", "no-such-ref")
        self.assertEqual(out.returncode, 1)
        self.assertEqual(out.stdout, "")

    def test_first_release_takes_every_unreleased_entry(self):
        self.commit(AFTER, "after")
        out = self.run_notes("", "HEAD")
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertIn("- Old entry.", out.stdout)
        self.assertIn("- New entry.", out.stdout)
        self.assertNotIn("Older fix", out.stdout)


if __name__ == "__main__":
    unittest.main()
