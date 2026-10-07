"""Mzizi resilience for Python (mzizi-dev/mzizi-registry#472).

The public API. The modules beside this file are GENERATED copies of the registry's
``components/registry/n5-resilience/*.py`` and ``n8-assurance/*.py``; this file is the
one hand-written module and only re-exports them.
"""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("mzizi-resilience")
except PackageNotFoundError:  # running from a source checkout that is not installed
    __version__ = "0.0.0"

__all__ = ["__version__"]
