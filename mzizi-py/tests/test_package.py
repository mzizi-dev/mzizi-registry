"""The package as installed: importable, typed, versioned."""

from __future__ import annotations

from importlib import resources
from importlib.metadata import version

import mzizi_resilience


def test_version_matches_the_distribution() -> None:
    assert mzizi_resilience.__version__ == version("mzizi-resilience")


def test_ships_py_typed() -> None:
    assert resources.files("mzizi_resilience").joinpath("py.typed").is_file()


def test_imports_the_installed_package_not_the_source_tree() -> None:
    # CI installs the wheel and runs with --import-mode=importlib, so a module that is in
    # src/ but missing from the wheel fails here rather than passing from the checkout.
    assert "site-packages" in (mzizi_resilience.__file__ or "")
